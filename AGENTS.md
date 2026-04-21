# AGENTS.md — MyEMS-PV

> 本文件为 Codex 及所有 AI 编码 Agent 的工作规范。每次开始任务前必须完整阅读。

---

## 仓库结构

```
MyEMS-PV/                        ← 父仓（根仓）
├── CHANGELOG.md                 ← 版本记录，每次发布必须更新
├── AGENTS.md                    ← 本文件
├── docker/
│   ├── docker-compose.yml       ← 单栈一键部署（UAT/演示）
│   ├── docker-compose.blue.yml  ← 蓝绿部署 blue override
│   ├── docker-compose.green.yml ← 蓝绿部署 green override
│   ├── backend/Dockerfile       ← 后端 multi-stage 构建
│   ├── frontend/Dockerfile      ← 前端 multi-stage 构建（Node 20）
│   ├── mysql/initdb/            ← 首次启动自动导入 SQL
│   └── nginx/default.conf       ← 前端静态 + /prod-api 反代
├── scripts/
│   ├── smoke_test.sh            ← 功能冒烟测试（curl + python3）
│   ├── smoke_test_websocket.sh  ← WebSocket 冒烟
│   ├── run_perf_test.sh         ← JMeter 性能测试包装脚本
│   ├── blue_green_switch.sh     ← 蓝绿切换脚本
│   └── jmeter/myems_pv_perf.jmx← JMeter 压测计划
├── docs/                        ← 发布物料、UAT 报告、运行手册
├── ruoyi-java-myems/            ← 后端子模块 → github.com/xcreve/RuoYi-Vue
│   ├── ruoyi-admin/             ← Spring Boot 启动模块（Controller、WebSocket、Config）
│   ├── ruoyi-system/            ← 业务核心（Service、Mapper、Domain、Event）
│   ├── ruoyi-quartz/            ← 定时任务（PvGatewayPollingTask、PvTelemetryTask）
│   ├── ruoyi-framework/         ← 框架层（Security、AOP、DataScope）
│   ├── ruoyi-common/            ← 公共工具（annotation、constant、utils）
│   └── sql/                     ← 全量建表脚本 + 迁移脚本
└── ruoyi-vue3-myems/            ← 前端子模块 → github.com/xcreve/RuoYi-Vue3
    ├── src/api/pv/              ← PV 业务 API 模块（7 个 .js）
    ├── src/views/pv/            ← PV 业务页面（8 个 index.vue）
    └── src/lang/                ← i18n（zh-CN/pv.json、en-US/pv.json）
```

---

## 技术栈

| 层 | 技术 |
|----|------|
| 后端语言 | Java 21，Spring Boot 4.x，RuoYi-Vue 框架 |
| 持久层 | MyBatis + PageHelper，MySQL 8.4（月分区） |
| 缓存 | Redis 7.4，`RedisCache` 工具类 |
| 定时任务 | Quartz（`sys_job` 表驱动） |
| 物联网协议 | MQTT（spring-integration-mqtt + Paho）、ModbusTCP/RTU（原生 socket） |
| 实时推送 | Spring WebSocket |
| 前端 | Vue 3 + Vite + Pinia + vue-i18n，RuoYi-Vue3 框架 |
| 测试 | JUnit 5 + Mockito（后端）、Vitest + @vue/test-utils（前端） |
| 容器 | Docker Compose v2，multi-stage Dockerfile |

---

## 核心业务模块（PV 专属）

### 后端包路径：`com.ruoyi.*.pv.*`

| 类型 | 路径 | 说明 |
|------|------|------|
| Controller | `ruoyi-admin/.../controller/pv/Pv*.java` | 8 个 REST 控制器，全部带 `@PreAuthorize` |
| Service 接口 | `ruoyi-system/.../service/pv/IPv*.java` | 5 个接口 |
| Service 实现 | `ruoyi-system/.../service/pv/impl/Pv*Impl.java` | 业务逻辑主体 |
| Mapper 接口 | `ruoyi-system/.../mapper/pv/Pv*Mapper.java` | 3 个 |
| Mapper XML | `ruoyi-system/src/main/resources/mapper/pv/Pv*Mapper.xml` | MyBatis SQL |
| Domain | `ruoyi-system/.../domain/pv/Pv*.java` | 14 个 POJO，均扩展 `BaseEntity` |
| 定时任务 | `ruoyi-quartz/.../task/PvGatewayPollingTask.java` | Modbus 轮询 + 心跳巡检 |
| Event | `ruoyi-system/.../event/pv/` | Dashboard 刷新、告警创建发布者 |
| WebSocket | `ruoyi-admin/.../websocket/pv/` | Dashboard 实时推送 |

### 前端路径：`src/api/pv/` + `src/views/pv/`

---

## 开发工作流

### 所有后端改动必须在子模块 `ruoyi-java-myems` 内提交

```bash
# 切换到正确分支（当前活跃开发分支）
cd ruoyi-java-myems
git checkout feat/dept-scope-p2-1   # 或新建 feat/<scope>-<ticket>

# 编写代码 → 运行测试
mvn -pl ruoyi-system,ruoyi-quartz,ruoyi-admin -am test -q   # 必须全绿

# 提交
git add <files>
git commit -m "feat(pv): <简洁描述>"

# 推送并创建 PR（base 为上一个 feat/ 分支或 release/v2.0.0）
git push origin feat/<scope>-<ticket>
gh pr create --repo xcreve/RuoYi-Vue --base <base_branch> --head feat/<scope>-<ticket>
```

### 父仓在子模块 commit 后 bump gitlink

```bash
cd ..   # 回到父仓
git add ruoyi-java-myems
git commit -m "chore(submodule): bump backend gitlink to <short-sha> (<描述>)"
git push origin main
```

### 前端改动同理，在 `ruoyi-vue3-myems` 子模块内操作

---

## 测试要求

### 后端（必须在任何 PR 前通过）

```bash
# 全链路测试
mvn -pl ruoyi-system,ruoyi-quartz,ruoyi-admin -am test -q

# 当前基线：94 个用例全绿
# 新功能必须追加对应测试；不允许删除已有测试
```

测试位置：
- `ruoyi-system/src/test/.../pv/PvMonitoringServiceImplTest.java`（31 用例）
- `ruoyi-system/src/test/.../pv/PvAssetServiceImplTest.java`
- `ruoyi-quartz/src/test/.../PvGatewayPollingTaskTest.java`（3 用例）
- `ruoyi-quartz/src/test/.../pv/PvTelemetryPartitionMaintainTaskTest.java`
- `ruoyi-admin/src/test/.../pv/Pv*ControllerTest.java`（54 用例，MockMvc）

### 前端（前端改动时必须通过）

```bash
cd ruoyi-vue3-myems
npm run test          # Vitest，26 用例
npm run test:coverage # 覆盖率目标 > 60%
```

---

## 数据库迁移规范

- 全量建表脚本：`ruoyi-java-myems/sql/myems_pv.sql`（**新列必须同步加入**）
- 每次新增列或表，**必须同时新建迁移脚本** `sql/myems_pv_<feature>.sql`（`ALTER TABLE` 格式）
- `docker/mysql/initdb/00-bootstrap.sh` 自动导入 `myems_pv.sql`，迁移脚本须手动在已有环境执行

已有迁移脚本：
```
sql/myems_pv_modbus_rtu.sql    ← pv_inverter_model.register_profile
sql/myems_pv_dept_scope.sql    ← pv_station.dept_id
```

---

## 关键约定

### DataScope（数据权限）

- 电站列表、网关列表、逆变器列表均挂载 `@DataScope(deptAlias = "s", permission = "pv:*:list")`
- `pv_station.dept_id` 是数据隔离的根键；gateway/inverter 通过 JOIN `pv_station s` 继承
- Quartz 后台任务**直接调用 Mapper**，不经 Service AOP，无 SecurityContext 时 DataScopeAspect 自动跳过

### Modbus 采集

- ModbusTCP：`PvMonitoringServiceImpl.executeModbusTcpRead()`，MBAP header + Function Code 03
- ModbusRTU：`PvMonitoringServiceImpl.executeModbusRtuRead()`，RTU 帧 + CRC16，RTU-over-TCP
- 寄存器规格优先级：`gateway.topic` > `inverterModel.registerProfile` > 内置默认值
- 两者均有可注入 mock reader（`setModbusTcpRegisterReader` / `setModbusRtuRegisterReader`），用于测试

### MQTT 采集

- `PvMqttIngestService` 按 `pv_gateway` 动态装载 broker/topic，CRUD 变更触发订阅重载
- 仅 `communicationType=MQTT` 的网关走此路径

### Dashboard 缓存

- `PvDashboardSummary` Redis 缓存 30 秒，key `CacheConstants.PV_DASHBOARD_SUMMARY_KEY + "all"`
- 电站/逆变器/告警 CRUD、轮询更新、告警解除时主动失效

### 告警

- 告警分发：`PvAlertDispatchServiceImpl` + Redis 节流键，支持 webhook/dingtalk/email/sms
- 告警创建通过 `PvAlertCreatedPublisher` Spring Event 异步分发

---

## 安全规范

- **绝对禁止**将以下文件提交入仓：`firebase-applet-config.json`、`firebase*.json`、`*.env`（`.env.example` 除外）、`*-service-account*.json`、`*-credentials*.json`
- 凭据类配置只能通过环境变量或 `.env`（本地，已 `.gitignore`）传入
- 所有 Controller 写操作必须带 `@PreAuthorize` 和 `@Log`（操作审计）

---

## PR 分支命名规范

```
feat/<scope>-<ticket>      # 新功能，如 feat/modbus-rtu-p1-1
fix/<scope>-<brief>        # bug 修复
chore/<scope>-<brief>      # 构建/依赖/配置
docs/<scope>-<brief>       # 纯文档
```

受保护分支：`release/v2.0.0`（后端）、`release/v2.0.1`（前端）——**必须通过 PR 合并，禁止直接 push**

---

## CHANGELOG 维护

每次完成一个版本的功能后，在父仓 `CHANGELOG.md` 补充对应版本块，格式遵循 [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/)。

当前版本节奏：

| 版本 | 状态 | 内容 |
|------|------|------|
| v2.0.3 | 已发布 ✅ | P2-1 dept_id 数据权限 |
| v2.0.2 | 已发布 ✅ | ModbusRTU + 设备模板 + 安全修复 |
| v2.0.1 | 已发布 ✅ | Docker multi-stage + lockfile |
| v2.0.0 | 已发布 ✅ | 全栈 MVP |
| v2.1.0 | 开发中 | 压测基线 + 蓝绿部署 |

---

## 禁止事项

- 禁止 `git push --force` 到 `main`（父仓）以外的分支
- 禁止修改 `DataScopeAspect.java`（框架层，不动）
- 禁止在同一 commit 中混合后端子模块改动与父仓根文件改动
- 禁止删除或跳过已有测试（`--no-verify` 或 `-DskipTests`）
- 禁止在 Java 代码中硬编码密码、密钥或 IP 地址
- 禁止引入未在 `pom.xml` 声明的外部 Modbus 库（如 j2mod、modbus4j）
