# MyEMS-PV 分布式光伏电站管理系统

![version](https://img.shields.io/badge/version-2.0.0-blue) ![tests](https://img.shields.io/badge/tests-91%2F91%20%7C%2026%2F26-green) ![uat](https://img.shields.io/badge/UAT-passed-green) ![security](https://img.shields.io/badge/OWASP%20DC-pending-lightgrey)

> **Codex 交接文档** · 更新时间：2026-04-16 · 评估模型：Claude Opus 4.6

一套面向分布式光伏电站的全栈能源管理系统，提供实时监控、设备管理、告警处置和发电量分析能力。

**当前状态**：✅ `v2.0.0` 正式版已发布，UAT 实跑通过，GitHub Release 已标记为 Latest

---

## 📦 仓库结构总览

```
MyEMS-PV/
├── ruoyi-java-myems/          ★ 后端（Spring Boot 4.0.3 + MyBatis + MySQL）
│   ├── ruoyi-admin/           # Web 入口，含 8 个 PV 业务 Controller
│   ├── ruoyi-system/          # Service + Mapper + Domain
│   ├── ruoyi-framework/       # 框架（拦截器/权限/AOP）
│   ├── ruoyi-common/          # 公共工具 & 注解
│   ├── ruoyi-quartz/          # 定时任务
│   ├── ruoyi-coverage/        # JaCoCo aggregate 聚合报表模块
│   ├── ruoyi-generator/       # 代码生成器
│   └── sql/
│       ├── ry_20260321.sql    # RuoYi 基础库（sys_user/sys_menu/...）
│       ├── quartz.sql         # Quartz 任务调度表
│       └── myems_pv.sql       # PV 业务库 + 32 条菜单 + 权限映射
├── ruoyi-vue3-myems/          ★ 前端（Vue 3 + Element Plus + Vite）
│   ├── src/api/pv/            # 7 个 PV API 模块（252 行）
│   ├── src/views/pv/          # 8 个业务页面（1898 行 Vue）
│   ├── src/lang/              # PV 国际化资源（zh-CN / en-US）
│   ├── tests/unit/            # Vitest 单测（PV API + Pinia store）
│   ├── src/layout/            # 布局（含主题切换）
│   ├── src/router/            # 路由（动态路由由后端菜单注入）
│   ├── src/store/             # Pinia
│   └── src/assets/styles/pv.scss  # 全站 CSS 变量主题
├── docker/                    # Docker Compose / Dockerfile / nginx / initdb / 部署指南
├── scripts/                   # 辅助脚本（含 API / WebSocket 冒烟测试）
├── FEASIBILITY_PLAN.md        # ⭐ 可行性修改方案 v2.0（6 周路线图）
├── DEVELOPER_GUIDE.md         # 开发者快速参考
├── COMPLETION_SUMMARY.md      # 交付物总结
├── DOCUMENTATION_INDEX.md     # 文档导航
└── README.md                  # 本文件
```

---

## 🛠 技术栈

### 后端（`ruoyi-java-myems/`）

| 组件 | 版本 | 说明 |
|---|---|---|
| JDK | 17 | `maven.compiler.source=17` |
| Spring Boot | 4.0.3 | `ruoyi-admin/pom.xml` |
| RuoYi Framework | 2.0.0 | 基于若依 3.9.2 定制，内置 JWT + RBAC + 代码生成 |
| MyBatis | 4.0.1 | XML Mapper + `resultMap` 命名映射 |
| MySQL | 8.x | 字符集 `utf8mb4` |
| Druid | 1.2.28 | 连接池 + 监控 |
| PageHelper | 2.1.1 | `startPage() + getDataTable()` |
| Spring Security | - | `@PreAuthorize("@ss.hasPermi(...)")` |
| Quartz | - | 遥测清理 + 网关心跳巡检 + 分区维护任务 |
| Apache POI | 4.1.2 | 发电量报表导出（poi-ooxml） |

### 前端（`ruoyi-vue3-myems/`）

| 组件 | 版本 | 说明 |
|---|---|---|
| Vue | 3.x | Composition API `<script setup>` |
| Element Plus | 2.13.1 | 主 UI 组件库 |
| Vue Router | 4.6.4 | 动态路由由后端菜单驱动 |
| Pinia | 3.0.4 | 状态管理 |
| vue-i18n | 12.0.0-alpha.3 | PV 页面中英文本地化与 Element Plus 语言包切换 |
| ECharts | 5.6.0 | 大屏功率曲线 / 柱状图 |
| Vite | 6.4.1 | 构建工具 |
| Vitest | 4.1.4 | 前端单元测试 + 覆盖率（v8 provider） |
| SCSS | - | CSS 变量支持浅色/深色主题 |

---

## 🚀 快速启动

> 正式版的升级、回滚、预检与验收说明见 [docs/release_notes_v2.0.0.md](/Users/xuyongqian/AI%20Code/MyEMS-PV/docs/release_notes_v2.0.0.md)。

### 前置条件

- **方式 A：Git 2.30+、Docker 24+、Docker Compose 2.20+**
- **方式 B：JDK 17、Maven 3.8+、MySQL 8.0+、Redis 6+、Node.js 20+**

### 方式 A. Docker Compose（UAT 推荐，唯一主路径）

```bash
git clone --recurse-submodules https://github.com/xcreve/MyEMS-PV.git
cd MyEMS-PV
cp docker/.env.example docker/.env
docker compose --env-file docker/.env -f docker/docker-compose.yml up -d --build
```

启动完成后，先跑冒烟：

```bash
BASE_URL=http://localhost:8080 ./scripts/smoke_test.sh
BASE_URL=http://localhost/prod-api ./scripts/smoke_test_websocket.sh
```

说明：

- `docker-compose.yml` 会启动 `MySQL 8 + Redis + ruoyi-admin + ruoyi-vue3`
- Compose 构建会在镜像内部完成前端 `dist` 与后端 `ruoyi-admin.jar` 打包，无需本地预构建
- MySQL 首次启动时会自动导入 `ry_20260321.sql`、`quartz.sql`、`myems_pv.sql`
- UAT 引导脚本会自动关闭验证码，便于 `smoke_test.sh` 直接登录 `admin/admin123`
- `smoke_test_websocket.sh` 优先使用 `websocat/wscat`，缺失时会自动回退到 Node 原生 `WebSocket`
- 更完整的停机窗口、回滚与排障说明见 [deploy_guide.md](/Users/xuyongqian/AI%20Code/MyEMS-PV/docs/deploy_guide.md)

### 方式 B. 本地开发初始化数据库（非部署主路径）

```bash
# 1) 建库
mysql -uroot -p -e "CREATE DATABASE \`ry-vue\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"

# 2) 按顺序导入（顺序很重要：基础库 → Quartz → PV 业务库）
cd ruoyi-java-myems/sql
mysql -uroot -p ry-vue < ry_20260321.sql
mysql -uroot -p ry-vue < quartz.sql
mysql -uroot -p ry-vue < myems_pv.sql   # ← 包含 7 张 pv_* 表、32 条菜单、角色-菜单映射
```

> `myems_pv.sql` 会为 `role_id=2`（普通角色）注入 PV 菜单权限。默认超管账号 `admin/admin123` 拥有所有权限，登录后可直接看到「光伏管理」一级菜单。若使用其他普通账号，需在「系统管理 → 角色管理」中手动给该账号的角色勾选 PV 菜单。

### 2. 启动后端

编辑 `ruoyi-java-myems/ruoyi-admin/src/main/resources/application-druid.yml` 修改数据库连接：

```yaml
spring:
  datasource:
    druid:
      master:
        url: jdbc:mysql://localhost:3306/ry-vue?useUnicode=true&characterEncoding=utf8&serverTimezone=GMT%2B8
        username: root
        password: <your-password>
```

同目录下 `application.yml` 中的 Redis 也需要确认可达。然后：

```bash
cd ruoyi-java-myems
mvn clean install -DskipTests
cd ruoyi-admin
mvn spring-boot:run
# 默认端口 8080
```

> 首次启动后，若 `sys_menu` 中未见「光伏管理」根节点，请检查 `myems_pv.sql` 是否执行成功。

### 3. 启动前端

```bash
cd ruoyi-vue3-myems
npm install
npm run dev
# 默认端口 80，访问 http://localhost:80
```

前端 `.env.development` 中的 `VITE_APP_BASE_API` 默认为 `/dev-api`，由 `vite.config.js` 代理到 `http://localhost:8080`。

### 4. 登录并体验

1. 浏览器打开 `http://localhost:80`
2. 用 `admin/admin123` 登录
3. 左侧菜单 → **光伏管理** → 子菜单：监控大屏 / 电站管理 / 接入设备 / 逆变器管理 / 数据分析 / 系统告警 / 基础资料
4. 在「监控大屏」页点击「**模拟数据**」按钮可一键生成样本 telemetry/alert 数据

### 方式 C. UAT 验收结果（2026-04-16）

- 首次 Docker Compose 实跑 UAT 已通过
- 验收报告：[docs/uat_report_2026-04-16.md](/Users/xuyongqian/AI%20Code/MyEMS-PV/docs/uat_report_2026-04-16.md)
- 运行日志：[scripts/uat_run_20260416.log](/Users/xuyongqian/AI%20Code/MyEMS-PV/scripts/uat_run_20260416.log)
- 关键结果：`/actuator/health = UP`、API smoke `34/34`、WebSocket smoke `10s` 内收帧、后端测试 `91/91`、前端测试 `26/26`

---

## 🗂 数据库 Schema 速览

`sql/myems_pv.sql` 中定义的 9 张业务表：

| 表名 | 说明 | 关键字段 |
|---|---|---|
| `pv_station_tag` | 电站分组标签 | `tag_id`, `tag_name`, `description` |
| `pv_station` | 电站主表 | `station_id`, `station_name`, `capacity_mw`, `tag_id`, `legacy_firebase_id` |
| `pv_inverter_model` | 品牌型号 | `model_id`, `brand`, `model_name`, `mqtt_protocol` |
| `pv_gateway` | 接入网关/DTU | `gateway_id`, `station_id`, `communication_type(MQTT/Polling)`, `broker_url`, `protocol` |
| `pv_inverter` | 逆变器 | `inverter_id`, `gateway_id`, `serial_number`, `model_id`, `current_power`, `status` |
| `pv_telemetry` | 时序遥测 | `inverter_id`, `collect_time`, `active_power`, `daily_yield` |
| `pv_alert_channel` | 告警推送通道 | `channel_id`, `channel_type`, `target`, `enabled` |
| `pv_alert_rule` | 告警推送规则 | `rule_id`, `level`, `channel_id`, `throttle_sec` |
| `pv_alert` | 告警 | `alert_id`, `level`, `status(active/resolved)`, `occur_time`, `resolved_at` |

> 所有业务表都预留了 `legacy_firebase_id` 字段，用于从早期 Firebase 版本迁移历史数据。

---

## 📡 REST API 清单

全部 16 个 PV 业务端点，前后端已**逐条核对一致**（2026-04-14）：

```
─────── 监控大屏 ───────
GET    /pv/dashboard/summary             仪表盘汇总（装机/发电/告警）
GET    /pv/dashboard/power-series        24h 功率曲线
POST   /pv/dashboard/simulate            触发一键模拟数据

─────── 电站 ───────
GET    /pv/station/list                  分页列表
POST   /pv/station                       新增
PUT    /pv/station                       编辑
DELETE /pv/station/{stationId}           删除（带外键校验）

─────── 接入设备 ───────
GET    /pv/gateway/list                  列表
POST   /pv/gateway                       新增
PUT    /pv/gateway                       编辑
DELETE /pv/gateway/{gatewayId}           删除

─────── 逆变器 ───────
GET    /pv/inverter/list                 列表
POST   /pv/inverter                      新增
PUT    /pv/inverter                      编辑
DELETE /pv/inverter/{inverterId}         删除

─────── 告警 ───────
GET    /pv/alert/list                    列表 + 级别/状态过滤
POST   /pv/alert/resolve/{alertId}       处理单条
POST   /pv/alert/resolve-all             一键处理全部

─────── 数据分析 ───────
GET    /pv/analysis/hourly-yield         24 小时发电量（按标签分组）
POST   /pv/analysis/hourly-yield/export  导出 Excel

─────── 基础资料 ───────
GET    /pv/stationTag/list               电站标签
POST   /pv/stationTag    PUT /pv/stationTag    DELETE /pv/stationTag/{tagId}
GET    /pv/model/list                    品牌型号
POST   /pv/model         PUT /pv/model         DELETE /pv/model/{modelId}
```

权限 key 与 `sys_menu.perms` 字段一一对应，如 `pv:station:list`、`pv:dashboard:simulate`，Controller 侧通过 `@PreAuthorize("@ss.hasPermi('pv:station:list')")` 校验。

---

## 🧱 关键代码坐标（给 Codex 改造时定位用）

### 后端

| 文件 | 作用 |
|---|---|
| `ruoyi-admin/src/main/java/com/ruoyi/web/controller/pv/*.java` | 8 个 PV Controller 入口 |
| `ruoyi-system/.../service/pv/impl/PvMonitoringServiceImpl.java` | 大屏/告警/模拟/轮询采集核心服务，含 `ModbusTcpRegisterReader` 可注入接口 |
| `ruoyi-system/.../service/pv/impl/PvMqttIngestService.java` | MQTT 动态订阅、遥测入库、逆变器实时状态回刷 |
| `ruoyi-system/.../service/pv/impl/PvAlertDispatchServiceImpl.java` | 告警事件异步分发、Redis 节流、Webhook/钉钉/邮件短信 stub 通道 |
| `ruoyi-system/.../service/pv/impl/PvAssetServiceImpl.java` | 电站/网关/逆变器 CRUD + 外键守卫 |
| `ruoyi-system/.../service/pv/impl/PvCatalogServiceImpl.java` | 标签/型号管理 |
| `ruoyi-system/.../resources/mapper/pv/PvAssetMapper.xml` | 资产 SQL（含 ROW_NUMBER() 窗口函数版 `selectHourlyYieldBuckets`） |
| `ruoyi-system/.../resources/mapper/pv/PvMonitoringMapper.xml` | 遥测/告警/聚合 SQL |
| `ruoyi-system/.../domain/pv/*.java` | 14 个 POJO 实体（已补 Bean Validation，含 `PvDashboardRealtimePayload`、`PvAlertChannel`、`PvAlertRule`） |
| `ruoyi-admin/.../websocket/pv/*.java` | 大屏 WebSocket 握手鉴权、会话管理、事件推送 |
| `ruoyi-admin/src/test/java/com/ruoyi/web/controller/pv/*.java` | 8 个 PV Controller MockMvc 集成测试（54 个用例） |
| `ruoyi-admin/src/test/java/com/ruoyi/web/controller/pv/AbstractPvControllerWebMvcTest.java` | Controller 切片测试基类（401/403/400、自定义 SecurityFilterChain） |
| `ruoyi-admin/src/test/java/com/ruoyi/web/controller/pv/PvWebMvcTest.java` | Boot 4 WebMvcTest 元注解，裁剪若依全局 Security/Resources 配置 |
| `ruoyi-quartz/.../task/PvGatewayPollingTask.java` | 心跳巡检 + 轮询窗口判定 + ModbusTCP 主动采集 |
| `ruoyi-quartz/.../task/PvTelemetryTask.java` | 遥测数据月度清理（保留 90 天） |
| `ruoyi-quartz/.../task/pv/PvTelemetryPartitionMaintainTask.java` | `pv_telemetry` 月分区滚动维护任务（每月补未来分区并删除过期分区） |
| `ruoyi-system/src/test/.../pv/PvMonitoringServiceImplTest.java` | 12 个测试（含 ModbusTCP 寄存器读取） |
| `ruoyi-system/src/test/.../pv/PvAssetServiceImplTest.java` | 12 个测试（CRUD + 外键 + 缓存失效） |
| `ruoyi-system/src/test/.../pv/impl/PvMqttIngestServiceTest.java` | 3 个测试（动态订阅、遥测入库、单逆变器回退） |
| `ruoyi-system/src/test/.../pv/impl/PvAlertDispatchServiceImplTest.java` | 4 个测试（异步分发、节流命中、失败回退、状态过滤） |
| `ruoyi-quartz/src/test/.../PvGatewayPollingTaskTest.java` | 3 个测试（间隔判定 + 离线检测） |
| `ruoyi-quartz/src/test/.../task/pv/PvTelemetryPartitionMaintainTaskTest.java` | 3 个测试（补未来分区、删除过期分区、缺失 `pmax` 失败） |
| `sql/myems_pv.sql` | Schema + 菜单 + 权限 + Quartz 默认任务 |
| `sql/pv_telemetry_partition.sql` | `pv_telemetry` 分区迁移脚本（预建 `p202604`–`p202703` + `pmax`） |
| `sql/pv_telemetry_partition_maintain.sql` | 月分区维护脚本（ADD 新分区 + DROP 超过保留窗口的旧分区） |
| `scripts/runbook_pv_telemetry_partition.md` | 分区维护窗口 SOP、决策树、回滚方案与验证 SQL |
| `scripts/smoke_test.sh` | 后端 API 冒烟脚本（登录 + 8 个 PV Controller 核心端点 + 电站 CRUD 循环） |
| `scripts/smoke_test_websocket.sh` | 大屏 WebSocket 冒烟脚本（登录后等待首条推送） |
| `docker/docker-compose.yml` | UAT 一键部署编排（MySQL/Redis/Admin/Vue3） |
| `docs/deploy_guide.md` | Docker Compose 部署、回滚、验证与排障指南 |
| `ruoyi-coverage/pom.xml` | JaCoCo aggregate 聚合模块，输出 `target/site/jacoco-aggregate/` |

### 前端

| 文件 | 作用 |
|---|---|
| `src/api/pv/dashboard.js` | `getDashboardSummary / getPowerSeries / triggerSimulate` |
| `src/api/pv/station.js` | 电站 CRUD |
| `src/api/pv/gateway.js` · `inverter.js` · `alert.js` · `analysis.js` · `catalog.js` | 其余模块 |
| `vitest.config.js` | 前端单测入口，复用 Vite 配置并启用 `happy-dom` 覆盖率统计 |
| `tests/unit/api/pv.test.js` | 7 个 PV API 模块测试，mock `axios` 并断言 URL / method / params |
| `tests/unit/store/*.test.js` | Pinia store 测试，覆盖 `src/store/index.js` 与全部 store 模块；含 `@vue/test-utils` 挂载用例 |
| `src/lang/index.js` · `src/lang/zh-CN/pv.json` · `src/lang/en-US/pv.json` | PV 页面国际化入口与中英文文案 |
| `src/views/pv/dashboard/index.vue` | 监控大屏（WebSocket 实时推送 + 断线回退 60s 轮询 + ECharts） |
| `src/views/pv/station/index.vue` | 电站管理 |
| `src/views/pv/gateway/index.vue` | 接入设备（按通讯方式动态切换 MQTT/ModbusTCP 表单标签与占位提示） |
| `src/views/pv/inverter/index.vue` | 逆变器 |
| `src/views/pv/alert/index.vue` | 告警 |
| `src/views/pv/analysis/index.vue` | 24h 发电量表 + 导出 |
| `src/views/pv/stationTag/index.vue` · `model/index.vue` | 基础资料 |
| `src/assets/styles/pv.scss` | 全站 CSS 变量主题 |

---

## 🔐 权限与安全

- **前端**：所有操作按钮通过 `auth.hasPermi(['pv:xxx:add'])` 动态显示。
- **后端**：Controller 方法使用 `@PreAuthorize` 做硬校验，前端不可绕过。
- **认证**：JWT 通过 `Authorization: Bearer <token>` 透传，由 RuoYi 的 `TokenService` 管理。
- **CSRF/XSS**：RuoYi 默认开启 XSS 过滤器和 SQL 注入过滤器。
- ⚠️ **已知风险**：当前 `application-druid.yml` 数据库密码为明文，生产环境需改为环境变量或加密（见 FEASIBILITY_PLAN v2.0 §五·P1-6）。

---

## 🎯 给 Codex 的改造任务（摘自 FEASIBILITY_PLAN v2.0）

完整任务清单请阅读 **`FEASIBILITY_PLAN.md`**，以下是优先级最高的改造项：

### 🔴 P0 必须修复（第 1 周）

1. **P0-1 · ✅ 发电量 SQL 跨日 Bug** — 已改为 `ROW_NUMBER()` 窗口函数取首末值差分
2. **P0-2 · ✅ 实体层 Bean Validation** — 5 个 Domain 已补 `@NotBlank / @Size / @DecimalMin` 等注解
3. **P0-3 · ✅ 模拟数据分布不均** — 已改为 `Collections.shuffle()` + 70/15/15 比例分配
4. **P0-4 · ✅ Dashboard Summary N+1** — 已合并为单条聚合 SQL + RedisCache 30s TTL
5. **P0-5 · ✅ 导出行限制** — 已加入 5000 行硬上限
6. **P0-6 · ✅ 时序数据分区** — `pv_telemetry` 目标表结构已切为月分区版，补齐迁移脚本、月维护脚本、停机 runbook、Quartz `pvTelemetryPartitionMaintainTask.maintainMonthlyPartitions(12)` 与单测

### 🟡 P1 应该做（第 2-3 周）

7. **P1-1 · 🟡 网关主动轮询** — ModbusTCP 已通过可注入 `ModbusTcpRegisterReader` 读取真实寄存器（`brokerUrl=tcp://host:502`），未配置时走稳定样本兜底；ModbusRTU 串口驱动待补
8. **P1-2 · ✅ MQTT 订阅器** — 已引入 `spring-integration-mqtt + Paho`，`PvMqttIngestService` 支持从 `pv_gateway` 动态装载 MQTT 网关、按 broker/topic 分组订阅、解析遥测写入 `pv_telemetry` 并回刷逆变器实时状态
9. **P1-3 · ✅ 告警通道** — 已新增 `pv_alert_channel/pv_alert_rule`、`PvAlertCreatedEvent`、`PvAlertDispatchServiceImpl`，模拟告警会在事务提交后异步分发，并按 `ruleId + level` 写 Redis 300 秒节流键
10. **P1-4 · ✅ WebSocket 大屏推送** — 已新增 dashboard 刷新事件、后端 `spring-websocket` 推送、token 握手鉴权，以及前端断线回退 60 秒轮询
11. **P1-5 · ✅ 操作审计** — 8 个 PV Controller 的写操作与导出操作已统一补全 `@Log` 元数据，标题前缀改为 `PV-`，并关闭响应体落日志，方便 `sys_oper_log` 按 PV 业务过滤
12. **P1-6 · ✅ i18n** — 已引入 `vue-i18n@next`，新增 `src/lang/zh-CN/pv.json` 和 `src/lang/en-US/pv.json`，8 个 PV 页面文案已改为 `$t('pv.xxx')`，`PvAssetServiceImpl` 防删守卫消息已切到 `MessageUtils.message()`，`npm run build:prod` 构建通过
13. **P1-7 · ✅ Service + Controller 测试** — 已新增 `ruoyi-admin/src/test/java/com/ruoyi/web/controller/pv/` 下 8 个 MockMvc 集成测试（54 个用例），覆盖 401/403/400/正常返回路径；叠加 `PvTelemetryPartitionMaintainTaskTest` 后，Maven 实跑结果为 `ruoyi-system 31/31`、`ruoyi-quartz 6/6`、`ruoyi-admin Controller 54/54`，全链路 `91/91` 通过，并已输出 JaCoCo aggregate 报表

### 🟢 P2 锦上添花（第 4-6 周）

14. **P2-14 · ✅ 前端单元测试（Vitest）** — 已接入 `happy-dom + @vue/test-utils`，补齐 `src/api/pv/*.js` 7 个模块与 `src/store/` Pinia store 的 Vitest 用例；`npm run test` 为 `26/26` 通过，`npm run test:coverage` 总覆盖率 `Statements 76.16% / Branches 75.79% / Functions 61.73% / Lines 91.85%`
15. **P2-15 · ✅ 清理 legacy React+Firebase 前端** — 已删除根目录旧 `src/`、`server/`、`tests/`、`firebase*.json`、`firestore.rules`、根 `package.json/package-lock.json`、`vite.config.ts`、`vitest.config.ts`、`tsconfig.json`、`index.html`、`metadata.json`、`dist/`、`node_modules/`
16. **P2-2 · 时序数据库迁移**：将 `pv_telemetry` 迁移到 TDengine / InfluxDB
17. **P2-3 · 监控与告警**：接入 SkyWalking/Prometheus 做 APM

---

## 🧪 测试与构建

### 后端

```bash
cd ruoyi-java-myems
mvn clean test                     # 运行 JUnit 5 + Mockito 单测
mvn clean package -DskipTests      # 打包 → ruoyi-admin/target/ruoyi-admin.jar
java -jar ruoyi-admin/target/ruoyi-admin.jar
```

当前已补的后端测试类：
- `ruoyi-system/src/test/java/com/ruoyi/system/service/pv/PvMonitoringServiceImplTest.java`
- `ruoyi-system/src/test/java/com/ruoyi/system/service/pv/PvAssetServiceImplTest.java`
- `ruoyi-system/src/test/java/com/ruoyi/system/service/pv/impl/PvMqttIngestServiceTest.java`
- `ruoyi-system/src/test/java/com/ruoyi/system/service/pv/impl/PvAlertDispatchServiceImplTest.java`
- `ruoyi-quartz/src/test/java/com/ruoyi/quartz/task/PvGatewayPollingTaskTest.java`
- `ruoyi-admin/src/test/java/com/ruoyi/web/controller/pv/PvDashboardControllerTest.java`
- `ruoyi-admin/src/test/java/com/ruoyi/web/controller/pv/PvStationControllerTest.java`
- `ruoyi-admin/src/test/java/com/ruoyi/web/controller/pv/PvGatewayControllerTest.java`
- `ruoyi-admin/src/test/java/com/ruoyi/web/controller/pv/PvInverterControllerTest.java`
- `ruoyi-admin/src/test/java/com/ruoyi/web/controller/pv/PvAlertControllerTest.java`
- `ruoyi-admin/src/test/java/com/ruoyi/web/controller/pv/PvAnalysisControllerTest.java`
- `ruoyi-admin/src/test/java/com/ruoyi/web/controller/pv/PvStationTagControllerTest.java`
- `ruoyi-admin/src/test/java/com/ruoyi/web/controller/pv/PvModelControllerTest.java`

当前覆盖的核心场景：
- `hourlyYield` 跨日计算
- `simulateTelemetry` 状态分布
- dashboard 缓存命中 / miss 回源 / 写回
- `deleteStationByIds` 外键守卫
- `pollGatewayTelemetry` 主动轮询分支（稳定样本 + ModbusTCP 寄存器读取）
- MQTT broker/topic 分组订阅、遥测入库、单逆变器身份回退
- 告警异步分发、Redis 节流命中、发送失败不落节流键
- `PvGatewayPollingTask` 按 `pollingIntervalSec` 跳过/触发轮询与超时离线
- 8 个 PV Controller 的无 token `401`、缺权限 `403`、`@Validated` 触发 `400`、正常 CRUD/导出响应
- `AuthenticationEntryPointImpl` 与 `GlobalExceptionHandler` 的真实 HTTP 状态码返回
- `ExcelUtil` HTTP 导出附件头与二进制 Excel 响应

2026-04-15 已实跑命令：

```bash
cd ruoyi-java-myems
mvn -pl ruoyi-system -am verify \
  -Dtest=PvMonitoringServiceImplTest,PvAssetServiceImplTest \
  -Dsurefire.failIfNoSpecifiedTests=false

mvn -pl ruoyi-quartz -am test \
  -Dtest=PvGatewayPollingTaskTest \
  -Dsurefire.failIfNoSpecifiedTests=false

mvn -pl ruoyi-system,ruoyi-quartz,ruoyi-admin -am test
mvn clean test jacoco:report-aggregate

cd ../ruoyi-vue3-myems
npm run build:prod
```

部署后的 UAT 冒烟命令：

```bash
cd ..
BASE_URL=http://localhost:8080 ./scripts/smoke_test.sh
BASE_URL=http://localhost/prod-api ./scripts/smoke_test_websocket.sh
```

实测结果：
- `PvMonitoringServiceImplTest` + `PvAssetServiceImplTest` + `PvAlertDispatchServiceImplTest`：`28/28` 通过
- `PvMqttIngestServiceTest`：`3/3` 通过
- `PvGatewayPollingTaskTest` + `PvTelemetryPartitionMaintainTaskTest`：`6/6` 通过
- `ruoyi-admin/src/test/java/com/ruoyi/web/controller/pv/`：8 个 Controller 测试类 `54/54` 通过
- 反应堆总计：`91/91` 通过
- `ruoyi-vue3-myems`：`npm run build:prod` 通过
- `P1-6 i18n`：8 个 PV 页面中文硬编码已替换为 `$t('pv.xxx')`，`PvAssetServiceImpl` 消息键化后回归 `PvMonitoringServiceImplTest + PvAssetServiceImplTest = 24/24` 通过
- JaCoCo aggregate：输出目录 `ruoyi-java-myems/target/site/jacoco-aggregate/`
- `com.ruoyi.web.controller.pv` 包覆盖率：`Line 98.57%`、`Branch 50.00%`
- `com.ruoyi.system.service.pv.impl` 包覆盖率：`Line 73.54%`、`Branch 52.66%`
- Service 实现明细：`PvMonitoringServiceImpl = Line 83% / Branch 54%`，`PvAssetServiceImpl = Line 94% / Branch 55%`
- W5 UAT：`2026-04-16` 首次 Docker Compose 实跑通过，报告见 [docs/uat_report_2026-04-16.md](/Users/xuyongqian/AI%20Code/MyEMS-PV/docs/uat_report_2026-04-16.md)

说明：
- 仓库当前未附带 `mvnw`，执行上述命令前需要本机安装 Maven 3.9+。
- 当前 JDK 25 环境已补 `src/test/resources/mockito-extensions/` 配置，确保 Mockito 测试可执行；运行时仍可能看到 ByteBuddy 动态 agent 警告，但不影响结果。
- `FEASIBILITY_PLAN.md v2.0` 中的 Service 覆盖率目标（≥ 70%）已达成；Controller 层已通过 aggregate 报表落到 `Line 98.57% / Branch 50.00%`，满足本轮 ≥ 50% 的实施目标。

### 前端

```bash
cd ruoyi-vue3-myems
npm run dev            # 开发（HMR）
npm run build:prod     # 生产构建 → dist/
npm run build:stage    # 预发布
npm run preview        # 本地预览构建产物
npm run test           # Vitest 单测
npm run test:coverage  # 覆盖率报告（coverage/）
```

当前已补的前端测试类：
- `ruoyi-vue3-myems/tests/unit/api/pv.test.js`
- `ruoyi-vue3-myems/tests/unit/store/basic.test.js`
- `ruoyi-vue3-myems/tests/unit/store/permission.test.js`
- `ruoyi-vue3-myems/tests/unit/store/tagsView.test.js`
- `ruoyi-vue3-myems/tests/unit/store/user.test.js`

2026-04-15 已实跑命令：

```bash
cd ruoyi-vue3-myems
npm run test
npm run test:coverage
```

实测结果：
- Vitest：`5/5` 测试文件、`26/26` 用例通过
- 总覆盖率：`Statements 76.16%`、`Branches 75.79%`、`Functions 61.73%`、`Lines 91.85%`
- `src/api/pv/*.js`：7 个模块 `100%` 覆盖
- `src/store/index.js`：`100%`
- `src/store/modules` 汇总：`Statements 73.86%`、`Branches 75.79%`、`Functions 53.98%`、`Lines 90.84%`

说明：
- 项目实际使用的是 `src/store/`，不是 `src/stores/`
- CLI 文本覆盖率报告会折叠 `100%` 文件，完整明细见 `ruoyi-vue3-myems/coverage/`

---

## 📚 文档导航

| 文档 | 用途 | 建议阅读对象 |
|---|---|---|
| **README.md**（本文件） | 快速上手 + Codex 任务交接 | 所有角色 |
| **FEASIBILITY_PLAN.md** v2.0 | 6 周改造路线图 + 10 项缺陷清单 + 代码片段 | Codex / Tech Lead |
| **DEVELOPER_GUIDE.md** | 开发规范 + CSS 主题 + 常见任务示例 | 开发工程师 |
| **COMPLETION_SUMMARY.md** | 交付物与项目指标总结 | PM / 管理者 |
| **DOCUMENTATION_INDEX.md** | 按角色 / 按用途的文档检索 | 所有角色 |
| `ruoyi-java-myems/README.md` | RuoYi 原框架说明 | 后端工程师 |
| `ruoyi-vue3-myems/README.md` | RuoYi Vue3 框架说明 | 前端工程师 |

---

## 🆘 常见问题

**Q1：启动后前端报 401？**  
A：检查 Redis 是否启动；RuoYi 的 token 存在 Redis，Redis 不可达会导致登录后立刻失效。

**Q2：菜单里看不到「光伏管理」？**  
A：确认 `myems_pv.sql` 已执行，并且当前登录用户的角色 (`sys_user_role`) 已关联 `role_id=2` 或手动在「系统管理 → 角色管理」里给角色勾选 PV 菜单。

**Q3：`/pv/dashboard/summary` 返回空？**  
A：先在大屏页面点击「模拟数据」按钮，会批量写入 `pv_telemetry` 和 `pv_alert` 样本数据。

**Q4：前端调用跨域失败？**  
A：开发环境走 Vite 代理，无跨域问题；生产部署需在 Nginx 做同源转发，或在 `ruoyi-framework` 的 `CorsFilter` 中放开来源。

**Q5：数据库字符集乱码？**  
A：确保建库时使用 `utf8mb4`，连接串包含 `useUnicode=true&characterEncoding=utf8`。

---

## 📝 提交规范

遵循 RuoYi 约定，PV 模块统一加 `pv` scope：

```
feat(pv): 新增发电量热力图组件
fix(pv): 修复 selectHourlyYieldBuckets 跨日发电量负数问题
refactor(pv): 将 Dashboard summary 改为单条聚合 SQL
docs(pv): 更新 README 中的 API 清单
```

---

## 🎬 下一步（给 Codex 的建议动作）

1. **先读 `FEASIBILITY_PLAN.md` v2.0** —— 里面有完整的 6 周路线图、缺陷清单、代码片段
2. **按 P0 → P1 → P2 顺序执行**，每完成一项提交一次 PR
3. **不要改动 `ruoyi-*` 框架层源码**（`ruoyi-common / ruoyi-framework / ruoyi-generator`），PV 相关改动集中在：
   - `ruoyi-admin/.../controller/pv/`
   - `ruoyi-system/.../service/pv/` · `domain/pv/` · `mapper/pv/`
   - `ruoyi-quartz/.../task/Pv*.java`（PV 专属定时任务，允许新增/修改）
   - `ruoyi-vue3-myems/src/{api,views}/pv/`
   - `sql/myems_pv.sql`（增量升级脚本建议新建 `myems_pv_v2.sql` 等）
4. **遇到不确定的设计决策**，优先参考 FEASIBILITY_PLAN v2.0 的对应 P 项章节
5. **每完成一个 P 项后**，同步更新本 README 的「改造任务」章节，标记完成状态

---

**维护者**: MyEMS Team  
**License**: MIT  
**Last Updated**: 2026-04-14 (Codex re-verified)
