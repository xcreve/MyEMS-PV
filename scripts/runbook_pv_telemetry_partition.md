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
