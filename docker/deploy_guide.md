# MyEMS-PV Docker Compose 部署指南

## 1. 前置条件

- Docker 24+
- Docker Compose 2.20+
- 可访问 `docker.m.daocloud.io` / Maven Central / npm registry，或预先缓存所需基础镜像
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
cp docker/.env.example docker/.env
docker compose --env-file docker/.env -f docker/docker-compose.yml up -d --build
```

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

- 直接执行 `docker compose ... up -d --build`
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

- 当前 Dockerfile 已默认使用 `docker.m.daocloud.io/library/*` 作为基础镜像源
- 如果自行修改了 `FROM`，请改回镜像源或先手工 `docker pull` 对应镜像
- 若企业网络必须走私有镜像仓，请同步修改 `docker/backend/Dockerfile` 与 `docker/frontend/Dockerfile`

### 6.6 `/actuator/health` 返回 401 或 500

现象：

- `curl http://localhost:8080/actuator/health` 返回 `401`
- 或返回 `No static resource actuator/health`

处理：

- 保持 `ruoyi-framework` 的 `SecurityConfig` 对 `/actuator/health`、`/actuator/health/**` 匿名放行
- 确认 `ruoyi-admin/pom.xml` 已引入 `spring-boot-starter-actuator`
- 确认 `application.yml` 已配置 `management.endpoints.web.exposure.include=health,info`
- 变更后重打 jar 并执行 `docker compose --env-file docker/.env -f docker/docker-compose.yml up -d --build ruoyi-admin`

### 6.7 Docker 构建提示 COPY 文件不存在

现象：

- `COPY ruoyi-vue3-myems/dist ... not found`
- 或 `COPY ruoyi-java-myems/ruoyi-admin/target/ruoyi-admin.jar ... not found`

处理：

- 保持根目录 `.dockerignore` 中对以下路径的白名单：
  - `!ruoyi-vue3-myems/dist`
  - `!ruoyi-vue3-myems/dist/**`
  - `!ruoyi-java-myems/ruoyi-admin/target/ruoyi-admin.jar`
- 重新执行前先确保已生成前端 `dist` 与后端 `ruoyi-admin.jar`
