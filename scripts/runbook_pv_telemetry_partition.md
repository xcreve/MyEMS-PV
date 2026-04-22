# `pv_telemetry` 月分区维护 Runbook

## 目标

在维护窗口内把 `pv_telemetry` 迁移为按 `collect_time` 的月分区表，并建立“当前月起 12 个月”的滚动分区窗口，降低大表清理和范围查询成本。

## 入口文件

- 迁移脚本：`ruoyi-java-myems/sql/pv_telemetry_partition.sql`
- 月维护脚本：`ruoyi-java-myems/sql/pv_telemetry_partition_maintain.sql`
- Quartz 任务：`pvTelemetryPartitionMaintainTask.maintainMonthlyPartitions(12)`

## 维护窗口前预检

1. 确认业务写流已知来源。
   - MQTT 写入：`PvMqttIngestService`
   - 模拟写入：`/pv/dashboard/simulate`
   - 主动轮询写入：`PvGatewayPollingTask`
2. 记录数据规模和时间分布。
   - `select count(*) from pv_telemetry;`
   - `select min(collect_time), max(collect_time) from pv_telemetry;`
   - `select date_format(collect_time, '%Y-%m') as month_key, count(*) from pv_telemetry group by month_key order by month_key;`
3. 检查主键和索引是否仍为预期版本。
   - `show create table pv_telemetry;`
4. 估算维护窗口。
   - 小表或低峰期：可直接重建 + rename
   - 百万级以上且写入无法长时间冻结：优先评估 `pt-online-schema-change`

## 决策树

### 直接 ALTER / 重建切换

适用条件：

- 维护窗口允许短暂停写
- 数据量可在窗口内完成复制
- 可以接受 `rename table` 级别的短时锁

执行方案：

1. 停止写入源或切换为只读。
2. 执行 `pv_telemetry_partition.sql` 创建 `pv_telemetry_part` 并导数。
3. 对账通过后执行 `rename table` 原子切换。
4. 恢复写入，观察 15 分钟。

### `pt-online-schema-change`

适用条件：

- 行数大、维护窗口紧
- 不能接受长时间停写
- 生产环境已安装并验证过 `pt-online-schema-change`

建议：

- 先在影子库演练把主键改为 `(telemetry_id, collect_time)`
- 明确 `--max-load`、`--critical-load`、`--chunk-time`
- 切换前仍需冻结应用写入几秒钟完成尾部同步和 rename

## 标准执行步骤

1. 暂停写入任务。
   - 暂停 Quartz：`pvGatewayPollingTask`、`pvTelemetryTask`
   - 暂停 MQTT 消费或临时下线应用实例
2. 执行迁移脚本。
3. 对账。
   - 行数一致
   - `min/max(collect_time)` 一致
   - 按月聚合抽样一致
4. 原子切换。
5. 恢复应用和任务。
6. 手动执行一次月维护脚本，确认 `pmax` 仍在且新增/删除逻辑正常。

## 本地验证结论（2026-04-22）

环境：Docker Compose 本地单机，后端子模块 `3ada7f42`，MySQL 容器 `myems-mysql`。

预检结论：

- `show create table pv_telemetry` 确认 `collect_time datetime not null`，主键为 `(telemetry_id, collect_time)`。
- 三条写入路径均使用同一 `collect_time` 语义：MQTT `PvMqttIngestService` 使用样本时间或接收时间，模拟写入 `/pv/dashboard/simulate` 使用 `DateUtils.getNowDate()`，主动轮询 `PvGatewayPollingTask` 通过 `PvMonitoringServiceImpl.pollGatewayTelemetry()` 写入当前采集时间。
- 迁移脚本验证前数据规模：`pv_telemetry` 103 行，`collect_time` 范围 `2026-04-21 04:31:09` 至 `2026-04-22 19:16:00`，按月聚合仅 `2026-04`。

执行结论：

- 本地数据量属于小表，按决策树选择“直接重建”方案；执行 `ruoyi-java-myems/sql/pv_telemetry_partition.sql` 创建 `pv_telemetry_part` 并导数，源表/目标表对账均为 103 行。
- 执行 `ruoyi-java-myems/sql/pv_telemetry_partition_maintain.sql` 成功；`pv_telemetry` 保持 `p202604` 至 `p202703` 与 `pmax` 分区窗口。
- 登录后触发 `/pv/dashboard/simulate` 返回 `simulated=3`，新增遥测 `telemetry_id` 107、108、109 的 `collect_time` 为 `2026-04-22 19:22:41`，均可从 `pv_telemetry partition(p202604)` 查到。
- 手动触发 `pvTelemetryPartitionMaintainTask.maintainMonthlyPartitions(12)` 成功，`sys_job_log.status=0`。

## 回滚方案

若在 `rename table` 前失败：

- 直接删除 `pv_telemetry_part`
- 保留原始 `pv_telemetry`

若在 `rename table` 后失败：

1. 立即停写。
2. 执行反向切换：
   - `rename table pv_telemetry to pv_telemetry_part_failed, pv_telemetry_legacy to pv_telemetry;`
3. 恢复应用到旧表。
4. 保留失败表用于排障，不要立刻删除。

## 验证 SQL

- `show create table pv_telemetry;`
- `select partition_name, partition_description, table_rows from information_schema.partitions where table_schema = database() and table_name = 'pv_telemetry' order by partition_ordinal_position;`
- `explain select * from pv_telemetry where collect_time between '2026-04-01' and '2026-04-30 23:59:59';`
- `select count(*) from pv_telemetry where collect_time < date_sub(now(), interval 90 day);`

## 通过标准

- `pv_telemetry` 主键为 `(telemetry_id, collect_time)`
- 分区存在 `p202604` 到 `p202703` 与 `pmax`
- Quartz 月维护任务可在测试库补齐缺失分区并清理过期分区
- 监控大屏、分析页、告警页查询结果与迁移前一致
