# MyEMS-PV v2.0.0-rc1 Release Notes

- 发布日期：2026-04-17
- 发布类型：Release Candidate
- UAT 状态：2026-04-16 已完成真实 `docker compose` 实跑，详见 [uat_report_2026-04-16.md](/Users/xuyongqian/AI%20Code/MyEMS-PV/docs/uat_report_2026-04-16.md)

## 1. 适用范围

本次 `v2.0.0-rc1` 面向从早期 MyEMS-PV 版本升级到 `RuoYi-Vue3 + Java + MySQL` 正式栈的预发布环境、灰度环境和生产预演环境。

## 2. 升级路径（v1.x -> v2.0）

### 2.1 数据与脚本位置

- 若依基础表：`ruoyi-java-myems/sql/ry_20260321.sql`
- Quartz 调度表：`ruoyi-java-myems/sql/quartz.sql`
- PV 业务表与菜单权限：`ruoyi-java-myems/sql/myems_pv.sql`
- 遥测分区脚本：`ruoyi-java-myems/sql/pv_telemetry_partition.sql`
- 分区月维护脚本：`ruoyi-java-myems/sql/pv_telemetry_partition_maintain.sql`

### 2.2 迁移说明

- 业务数据迁移仅针对 PV 资产、告警、遥测等业务表，不迁移 Firebase 用户密码。
- 每张业务表均保留 `legacy_firebase_id`，用于一次性导入映射、抽样核对与回溯审计。
- 若依用户、角色、菜单在目标环境中重新初始化，统一由 `sys_user`、`sys_role`、`sys_menu` 承载。

### 2.3 建议升级顺序

1. 备份现网数据库快照与对象存储导出。
2. 初始化若依基础库、Quartz 表和 PV 业务库。
3. 导入业务数据，并按 `legacy_firebase_id` 做抽样核对。
4. 启动 `docker compose` 或本地进程，执行 [smoke_test.sh](/Users/xuyongqian/AI%20Code/MyEMS-PV/scripts/smoke_test.sh) 与 [smoke_test_websocket.sh](/Users/xuyongqian/AI%20Code/MyEMS-PV/scripts/smoke_test_websocket.sh)。

## 3. 预检清单

- JDK 17
- MySQL 8.x
- Redis 7.x
- Docker 24+ / Docker Compose 2.20+（若采用容器部署）
- 可用磁盘不少于 50 GB
- 可用内存不少于 8 GB
- 对外开放端口至少覆盖 `80`、`8080`、`3306`、`6379`
- 已准备数据库快照与回滚窗口

## 4. 变更影响面

### 4.1 API 兼容性

保留并继续使用的接口：

- `POST /login`
- `GET /getInfo`
- `GET /getRouters`
- `POST /logout`
- `GET|POST|PUT|DELETE /pv/*`
- `GET /actuator/health`
- `GET /ws/pv/dashboard`

废弃或不再提供的旧接口/能力：

- 旧版 React + Firebase 前端静态资源与运行时入口
- 旧版 Node / Express `server/` 相关 API
- Firebase Auth / Firestore 直连调用路径

### 4.2 前端路由变化

- 默认首页已切换为 `/pv/dashboard`
- 菜单由若依动态路由驱动，但外观与分组保持 MyEMS 暗色橙色风格
- 系统管理下的用户/角色管理直接复用若依原生 `/system/user`、`/system/role`

## 5. 验收脚本

容器部署完成后，在仓库根目录执行：

```bash
BASE_URL=http://localhost:8080 ./scripts/smoke_test.sh
BASE_URL=http://localhost/prod-api ./scripts/smoke_test_websocket.sh
```

通过标准：

- `smoke_test.sh` 退出码为 `0`
- `smoke_test_websocket.sh` 在 10 秒内收到首条 dashboard 推送并退出 `0`
- `docs/uat_report_2026-04-16.md` 中的关键端点结构与当前环境一致

## 6. 回滚方案

### 6.1 容器回滚

1. `docker compose -f docker/docker-compose.yml stop`
2. 恢复数据库快照到回滚前时间点
3. 恢复上一个稳定版镜像或 jar/dist 产物
4. 重新执行健康检查与冒烟脚本

### 6.2 数据库回滚 SOP

- 回滚前先记录 `pv_station`、`pv_gateway`、`pv_inverter`、`pv_alert`、`pv_telemetry` 行数
- 如已执行分区脚本，优先按快照整库恢复，不建议现场手工拼接分区
- 回滚后重新核对 `legacy_firebase_id` 抽样映射是否一致

## 7. 已知风险与安全检查

- OWASP Dependency-Check 首次同步 NVD 数据耗时过长，已挪至 GitHub Actions 定时任务（夜间 02:00，北京时间）；需 repo owner 在 Secrets 中配置 `NVD_API_KEY`，可通过 [NVD 免费申请页面](https://nvd.nist.gov/developers/request-an-api-key) 获取。
- 前端 `npm audit --omit=dev --audit-level=high`：`0 high / 0 critical`；`axios` 已升级到 `1.15.0`，当前仅剩 `follow-redirects` `1` 条 moderate（`GHSA-r4q5-vmmm-2653`，Node 侧传递依赖，浏览器运行时无直接暴露面）。
- 当前未发现阻塞 `v2.0.0-rc1` 的前端高危依赖；Java 侧 `CVSS >= 8` 结论以下一轮 GitHub Actions 扫描产物为准。

## 8. 已知限制

- P1-1 ModbusRTU 主动轮询仍待硬件或 RTU 模拟器联调
- P2-16 APM 能力仍待生产环境接入 SkyWalking / Prometheus
