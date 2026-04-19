# MyEMS-PV v2.0.1 立项计划

## 1. 目标

目标：修复发布与部署的可重复构建链，使 `fresh clone --recurse-submodules` 后无需任何本地预构建即可完成镜像构建、启动与冒烟验证。

范围：

- 仅修可重复构建链
- 不改业务代码
- 不改数据模型
- 不改接口契约

非范围：

- 不新增业务功能
- 不调整发布分支策略
- 不在本计划中落具体 workflow YAML 或 Dockerfile 实现代码

## 2. 现状判断

- `v2.0.0` 的后端镜像依赖本地 `ruoyi-java-myems/ruoyi-admin/target/ruoyi-admin.jar`
- `v2.0.0` 的前端镜像依赖本地 `ruoyi-vue3-myems/dist`
- `xcreve/RuoYi-Vue3` 当前忽略 `package-lock.json`、`yarn.lock` 与 `dist/`
- 因此 `v2.0.0` 需要开发者本地预构建，无法作为“纯 fresh clone + docker compose”路径稳定复现

## 3. 工作项

### 工作项 A：前端锁文件入仓

目标：

- 在 `xcreve/RuoYi-Vue3` 提交 `package-lock.json`
- 从 `xcreve/RuoYi-Vue3/.gitignore` 删除 `package-lock.json` 与 `yarn.lock` 两行

约束：

- 锁文件必须由当前权威 Node 版本一次 `npm install` 生成，不允许手工编辑
- Node 版本以 `ruoyi-vue3-myems/README.md` 的版本声明为准；当前声明为 `Node.js 18+`
- `dist/` 仍不作为发布产物入仓

交付：

- 子仓能够在 fresh clone 下直接执行锁文件一致的依赖安装

### 工作项 B：后端 Dockerfile 多阶段化

目标：

- 将 `docker/backend/Dockerfile` 改为多阶段镜像
- 结构为 `maven:3.9-eclipse-temurin-17` builder -> `eclipse-temurin:17-jre` runtime

约束：

- builder 阶段负责拉依赖并产出 `ruoyi-admin.jar`
- runtime 阶段只保留运行所需产物
- 不再依赖工作区中预先存在的 `ruoyi-admin/target/ruoyi-admin.jar`

交付：

- fresh clone 环境下后端镜像可独立完成构建

### 工作项 C：前端 Dockerfile 多阶段化

目标：

- 将 `docker/frontend/Dockerfile` 改为多阶段镜像
- 结构为 `node:<对齐版本>-alpine` builder + `npm ci` -> `nginx:1.27-alpine` runtime

约束：

- builder 阶段 Node 版本必须对齐权威版本声明，当前参考 `ruoyi-vue3-myems/README.md`
- 必须以已提交的 `package-lock.json` 驱动 `npm ci`
- runtime 阶段仅复制构建后的静态资源，不再依赖本地 `dist/`

交付：

- fresh clone 环境下前端镜像可独立完成构建

### 工作项 D：部署文档回归一键启动

目标：

- `docs/deploy_guide.md` 主路径回归为“一键 `docker compose up -d --build`”
- 删除 `v2.0.0` 临时讨论过的前置构建段

约束：

- 文档必须与新的多阶段镜像真实行为一致
- 历史副本 `docker/deploy_guide.md` 同步更新，直到该副本在后续版本移除

交付：

- fresh clone 部署手册不再要求手工预构建 jar / dist

### 工作项 E：干净环境复跑

目标：

- 新增 `docs/deploy_rehearsal_v2.0.1.md`
- 在干净环境完成从 clone 到启动、healthcheck、HTTP 冒烟、WebSocket 冒烟的全链路验证

约束：

- 不允许任何本地预构建
- 必须从 `fresh clone --recurse-submodules` 开始
- 验证结果要记录命令、输出摘录、镜像构建关键日志与 PASS/FAIL 结论

交付：

- `v2.0.1` 可重复构建与部署的实跑证据

## 4. 验收口径

- `fresh clone --recurse-submodules`
- `docker compose up -d --build`
- `mysql` healthcheck 变为 `healthy`
- HTTP 冒烟全 PASS
- WebSocket 冒烟全 PASS
- 全流程不依赖任何人工本地 `mvn package`、`npm install`、`npm run build:prod`

## 5. 风险

- 锁文件提交会触发依赖版本真正被锁定，可能暴露此前被忽略的环境差异与隐式升级问题
- 首次多阶段镜像改造可能暴露基础镜像平台兼容问题，尤其是 `linux/amd64` 与 `linux/arm64`
- Docker build context、子模块路径与缓存策略调整后，可能出现新的构建时长或缓存命中差异

## 6. 协作要求

- 需要 `xcreve/RuoYi-Vue3` 维护者配合提交锁文件与 `.gitignore` 调整
- 根仓维护者负责多阶段镜像改造、部署文档回归与最终演练归档

## 7. 时间线

- 待填
