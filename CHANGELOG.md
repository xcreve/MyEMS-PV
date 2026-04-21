# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.1] - 2026-04-20

### Added

- `ruoyi-vue3-myems/package-lock.json` 入仓（#1），为 `npm ci` 提供可复现 lockfile。

### Changed

- 后端 Docker 镜像改为 multi-stage 构建（#2）；由镜像构建阶段直接产出 `ruoyi-admin.jar`，不再依赖根仓预置产物。
- 前端 Docker 镜像改为 multi-stage 构建（#3）；由镜像构建阶段直接产出前端 `dist`，不再依赖根仓预置产物。
- `docs/deploy_guide.md`、`docker/deploy_guide.md` 与 `README.md` 的部署主路径统一为 `git clone --recurse-submodules` 后执行 `docker compose --env-file docker/.env -f docker/docker-compose.yml up -d --build`（#4）。

### Fixed

- 前端镜像构建阶段 `npm ci` 改为 `registry.npmmirror.com` + fetch retry，缓解默认 npm registry `ECONNRESET` 导致的构建失败（#3）。
- 修复 v2.0.0-rc1 父仓 gitlink 漏 bump 的遗留问题：将前端子模块 gitlink 从 `bf43df7` 升到 `3cefbe8`（包含 `package-lock.json` 与 Node 20 LTS 引擎声明），并同步 `.gitmodules` 跟踪分支至 `release/v2.0.1`、Dockerfile 基础镜像升级到 `node:20-alpine`，解决干净克隆下 `npm ci` EUSAGE 失败。（follow-up #1）

## [2.0.0] - 2026-04-18

### Added

- 根仓正式版发布物料：[docs/release_manifest_v2.0.0.md](/Users/xuyongqian/AI%20Code/MyEMS-PV/docs/release_manifest_v2.0.0.md) 与 [docs/release_notes_v2.0.0.md](/Users/xuyongqian/AI%20Code/MyEMS-PV/docs/release_notes_v2.0.0.md)。

### Changed

- `v2.0.0` 正式版沿用 `v2.0.0-rc1` 已通过 UAT 的双子仓代码，不新增后端或前端业务代码变更。
- 根仓 `.gitmodules` 默认跟踪分支切换为子仓 `release/v2.0.0`，GitHub Release `v2.0.0` 已发布并标记为 Latest。

## [2.0.0-rc1] - 2026-04-17

### Added

- P1-2 MQTT 动态订阅采集链路，基于 `spring-integration-mqtt` 按 `pv_gateway` 动态装配 broker/topic，并将遥测落库到 `pv_telemetry`。
- P1-3 告警分发与节流能力，支持告警通道、规则与处理动作联动。
- P1-4 Dashboard WebSocket 实时推送，覆盖 MQTT、轮询、模拟数据与告警/资产变更事件。
- P1-5 `pv:*` 操作审计，关键资产 CRUD 与告警处理已纳入 `@Log` 记录。
- P1-6 前端 i18n 能力，8 个 PV 页面完成 `vue-i18n` 接入，后端业务异常改为 `MessageUtils.message()`。
- P1-7 Controller 层 MockMvc 集成测试，覆盖权限校验、参数校验与标准 CRUD 响应结构。
- P2-14 前端 Vitest 测试基线，覆盖 `src/api/pv/*.js` 全部 7 个模块与 Pinia store。
- W5 UAT 冒烟脚本与 `docker-compose` 部署链路，包含 HTTP API 与 Dashboard WebSocket 双路径验收。

### Changed

- P0-1 小时发电量统计改为 `ROW_NUMBER()` 方案，修复跨日增量计算偏差。
- P0-4 Dashboard 聚合查询改为合并 SQL + RedisCache，降低首页重复加载成本。
- P0-6 `pv_telemetry` 切换为月分区维护方案，补齐维护脚本、Quartz 任务与运行手册。

### Fixed

- UAT 现场修复 `/actuator/health` 暴露与健康探针可用性问题。
- UAT 现场修复 `/pv/dashboard/summary` 缺失 `totalStations` 字段问题。
- UAT 现场修复 `smoke_test_websocket.sh` 在缺少 `websocat/wscat` 时无法执行的问题，补齐 Node fallback。
- UAT 现场修复 `.dockerignore` 误排除前端 `dist` 与后端 `jar` 导致镜像构建失败的问题。
- UAT 现场修复 Docker 基础镜像源可达性问题，切换到 `docker.m.daocloud.io`。

### Removed

- P2-15 legacy React + Firebase 前端与 Node 旧后端源码、根级构建配置及产物。

### Known Limitations

- P1-1 ModbusRTU 主动轮询仍待真实 RTU 设备或模拟器联调，不阻塞 `v2.0.0-rc1` 发布候选。
- P2-16 APM 观测接入仍待生产环境接入 SkyWalking / Prometheus，不阻塞 `v2.0.0-rc1` 发布候选。

## [1.0.0] - 2025-xx-xx

### Changed

- 历史版本基于 React + Firebase 方案推进，菜单、认证、数据存储与当前 `RuoYi-Vue3 + Java + MySQL` 全栈形态存在较大差异。
- `v2.0` 已将业务数据、权限模型、部署方式与测试体系统一收敛到若依标准栈，并移除旧版 Firebase/Express 运行依赖。
