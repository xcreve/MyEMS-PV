# MyEMS-PV Docker Compose 部署指南

## 1. 前置条件

- Git 2.30+（用于 `git clone --recurse-submodules`）
- Docker 24+
- Docker Compose 2.20+
- 宿主机可访问 Docker Hub；受限网络环境请预先配置 Docker daemon 级 `registry-mirror`
- 前端依赖在镜像构建阶段自动通过 `registry.npmmirror.com` 拉取，后端依赖按子仓 `pom.xml` 中的 Maven 仓库配置解析
- 宿主机预留端口：`80`、`8080`、`3306`、`6379`

## 2. 部署文件说明

- [docker/docker-compose.yml](/Users/xuyongqian/AI%20Code/MyEMS-PV/docker/docker-compose.yml)
  前端、后端、MySQL、Redis 四个服务的一键编排入口
- [docker/.env.example](/Users/xuyongqian/AI%20Code/MyEMS-PV/docker/.env.example)
  UAT/演示环境变量模板
- [docker/mysql/initdb/00-bootstrap.sh](/Users/xuyongqian/AI%20Code/MyEMS-PV/docker/mysql/initdb/00-bootstrap.sh)
  首次启动时自动导入 `ruoyi-java-myems/sql/` 下的 `ry_20260321.sql`、`quartz.sql`、`myems_pv.sql`
- [docker/nginx/default.conf](/Users/xuyongqian/AI%20Code/MyEMS-PV/docker/nginx/default.conf)
  前端静态资源与 `/prod-api`、`/prod-api/ws` 反向代理

## 3. 一键启动

```bash
git clone --recurse-submodules https://github.com/xcreve/MyEMS-PV.git
cd MyEMS-PV
cp docker/.env.example docker/.env
docker compose --env-file docker/.env -f docker/docker-compose.yml up -d --build
```

主路径说明：

- 该流程会在镜像构建阶段内完成前端 `dist` 与后端 `ruoyi-admin.jar` 构建
- 无需本地先执行 `npm build`、`npm ci` 或 `mvn package`

默认映射：

- 前端：`http://localhost`
- 后端：`http://localhost:8080`
- MySQL：`localhost:3306`
- Redis：`localhost:6379`

首次初始化说明：

- MySQL 容器首次创建数据卷时会自动建库并导入基础 SQL
- 引导脚本会把 `sys.account.captchaEnabled` 改为 `false`
- 默认管理员仍为 `admin/admin123`

## 4. 停机窗口与回滚建议

适用场景：UAT 首次部署、演示环境重建、数据库卷重建。

### 4.1 首次部署

- 在 fresh clone 目录中按“3. 一键启动”执行 `docker compose --env-file docker/.env -f docker/docker-compose.yml up -d --build`
- 不需要手工预构建前端 `dist` 或后端 `ruoyi-admin.jar`
- 等待 `mysql` healthcheck 变为 `healthy`
- 再执行冒烟脚本核验

### 4.2 覆盖升级

- 先备份 MySQL 数据卷或逻辑导出
- 执行 `docker compose ... up -d --build ruoyi-admin ruoyi-vue3`
- 若涉及 SQL 变更，先在测试库验证，再决定是否重建数据卷

### 4.3 回滚

- 回滚镜像/代码版本
- 停止当前容器：`docker compose -f docker/docker-compose.yml down`
- 恢复数据库卷或重新导入备份
- 重新执行 `up -d --build`

## 5. 验证步骤

### 5.1 API 冒烟

后端直连：

```bash
BASE_URL=http://localhost:8080 ./scripts/smoke_test.sh
```

通过 nginx 网关：

```bash
BASE_URL=http://localhost/prod-api ./scripts/smoke_test.sh
```

### 5.2 WebSocket 冒烟

后端直连：

```bash
BASE_URL=http://localhost:8080 ./scripts/smoke_test_websocket.sh
```

通过 nginx 网关：

```bash
BASE_URL=http://localhost/prod-api ./scripts/smoke_test_websocket.sh
```

说明：

- 后端实际握手路径是 `/ws/pv/dashboard`
- 通过 nginx 访问时，对外地址变为 `/prod-api/ws/pv/dashboard`
- 脚本会先登录，再携带 `token` 连接 WebSocket
- 脚本优先使用 `websocat/wscat`，缺失时自动回退到 Node 原生 `WebSocket`

### 5.3 容器状态检查

```bash
docker compose -f docker/docker-compose.yml ps
docker compose -f docker/docker-compose.yml logs -f ruoyi-admin
docker compose -f docker/docker-compose.yml logs -f ruoyi-vue3
```

## 6. 常见问题

### 6.1 端口占用

现象：

- `bind: address already in use`

处理：

- 修改 `docker/.env` 中的 `FRONTEND_PORT_FORWARD`、`BACKEND_PORT_FORWARD`、`MYSQL_PORT_FORWARD`、`REDIS_PORT_FORWARD`
- 再执行 `docker compose --env-file docker/.env -f docker/docker-compose.yml up -d`

### 6.2 MySQL 连接拒绝

现象：

- 后端日志出现 `Communications link failure`

处理：

- 确认 `mysql` 容器健康状态为 `healthy`
- 确认 `MYSQL_HOST=mysql`
- 如改过数据卷且初始化失败，先 `docker compose ... down -v`，再重新启动

### 6.3 Redis 超时

现象：

- 登录后接口返回 500，日志含 Redis connection timeout

处理：

- 确认 `redis` 容器正常启动
- 检查 `REDIS_HOST`、`REDIS_PORT`
- 若配置了密码，补齐 `REDIS_PASSWORD`

### 6.4 冒烟脚本提示验证码开启

现象：

- `sys.account.captchaEnabled=true`

处理：

- Compose 首次初始化会自动关闭验证码
- 若是复用旧库，手动执行：

```sql
update sys_config
set config_value = 'false'
where config_key = 'sys.account.captchaEnabled';
```

### 6.5 Docker Hub 鉴权失败

现象：

- 构建阶段出现 `failed to fetch oauth token`
- 日志包含 `auth.docker.io/token`

处理：

- 确认宿主机对 `registry-1.docker.io` 与 `auth.docker.io` 可达
- 受限网络环境请先为 Docker daemon 配置 `registry-mirror`
- 不要把部署手册主路径改写成手工 `docker pull` 或手工修改 Dockerfile `FROM`
- 如必须切到企业私有镜像仓，请同步评估 `docker/backend/Dockerfile` 与 `docker/frontend/Dockerfile`

### 6.6 `/actuator/health` 返回 401 或 500

现象：

- `curl http://localhost:8080/actuator/health` 返回 `401`
- 或返回 `No static resource actuator/health`

处理：

- 保持 `ruoyi-framework` 的 `SecurityConfig` 对 `/actuator/health`、`/actuator/health/**` 匿名放行
- 确认 `ruoyi-admin/pom.xml` 已引入 `spring-boot-starter-actuator`
- 确认 `application.yml` 已配置 `management.endpoints.web.exposure.include=health,info`
- 变更后重新执行 `docker compose --env-file docker/.env -f docker/docker-compose.yml up -d --build ruoyi-admin`

### 6.7 子模块未初始化或仓库不完整

现象：

- 构建阶段提示 `COPY ruoyi-vue3-myems/ .` 或 `COPY ruoyi-java-myems/ .` 失败
- 目录下缺少 `ruoyi-vue3-myems` 或 `ruoyi-java-myems` 的实际内容

处理：

- 优先按“3. 一键启动”从 `git clone --recurse-submodules` 开始重新获取代码
- 如果仓库已存在，执行 `git submodule update --init --recursive`
- 确认 `git submodule status` 中两个子模块都已检出后，再执行 `docker compose --env-file docker/.env -f docker/docker-compose.yml up -d --build`
