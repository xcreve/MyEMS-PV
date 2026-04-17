# MyEMS-PV UAT 验收报告（2026-04-16）

## 1. 验收结论

- 结论：通过
- Compose 启动命令发起时间：2026-04-16 23:49:07 +0800
- 后端健康检查首次返回 `UP`：2026-04-16 23:54:43 +0800
- API + WebSocket 冒烟全部通过时间：2026-04-17 00:01:23 +0800
- 启动到健康耗时：5 分 36 秒
- 启动到全量 UAT 完成耗时：12 分 16 秒
- UAT 运行日志：[scripts/uat_run_20260416.log](/Users/xuyongqian/AI%20Code/MyEMS-PV/scripts/uat_run_20260416.log)

## 2. 服务健康检查

### 2.1 Docker Compose 状态

```text
NAME                IMAGE                COMMAND                  SERVICE       CREATED          STATUS                    PORTS
myems-mysql         mysql:8.4            "docker-entrypoint.s…"   mysql         10 minutes ago   Up 10 minutes (healthy)   0.0.0.0:3306->3306/tcp, [::]:3306->3306/tcp
myems-redis         redis:7.4-alpine     "docker-entrypoint.s…"   redis         10 minutes ago   Up 10 minutes (healthy)   0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp
myems-ruoyi-admin   docker-ruoyi-admin   "sh -c 'java $JAVA_O…"   ruoyi-admin   2 minutes ago    Up 2 minutes              0.0.0.0:8080->8080/tcp, [::]:8080->8080/tcp
myems-ruoyi-vue3    docker-ruoyi-vue3    "/docker-entrypoint.…"   ruoyi-vue3    10 minutes ago   Up 10 minutes             0.0.0.0:80->80/tcp, [::]:80->80/tcp
```

### 2.2 后端健康检查

```json
{"groups":["liveness","readiness"],"status":"UP"}
```

### 2.3 前端 HTTP 探活

```text
HTTP/1.1 200 OK
Server: nginx/1.27.5
Date: Thu, 16 Apr 2026 15:56:23 GMT
Content-Type: text/html
Content-Length: 5419
```

## 3. API 冒烟结果

`scripts/smoke_test.sh` 最终结果：`34` 个断言全部通过，退出码 `0`。

| 端点 | 方法 | HTTP | 响应片段 |
| --- | --- | --- | --- |
| `/captchaImage` | `GET` | `200` | `{"captchaEnabled":false,...}` |
| `/login` | `POST` | `200` | `{"code":200,"token":"<jwt>"}` |
| `/pv/dashboard/summary` | `GET` | `200` | `{"code":200,"data":{"totalStations":2,"totalInverters":3,"onlineInverters":1}}` |
| `/pv/station/list` | `GET` | `200` | `{"code":200,"rows":[...]}` |
| `/pv/station` | `POST` | `200` | `{"code":200,"msg":"操作成功"}` |
| `/pv/station/{id}` | `GET` | `200` | `{"code":200,"data":{"location":"UAT smoke site updated"}}` |
| `/pv/station` | `PUT` | `200` | `{"code":200,"msg":"操作成功"}` |
| `/pv/station/{id}` | `DELETE` | `200` | `{"code":200,"msg":"操作成功"}` |
| `/pv/gateway/list` | `GET` | `200` | `{"code":200,"rows":[...]}` |
| `/pv/inverter/list` | `GET` | `200` | `{"code":200,"rows":[...]}` |
| `/pv/alert/list` | `GET` | `200` | `{"code":200,"rows":[...]}` |
| `/pv/analysis/hourly-yield` | `GET` | `200` | `{"code":200,"data":[...]}` |
| `/pv/stationTag/list` | `GET` | `200` | `{"code":200,"rows":[...]}` |
| `/pv/model/list` | `GET` | `200` | `{"code":200,"rows":[...]}` |

## 4. WebSocket 冒烟结果

`scripts/smoke_test_websocket.sh` 最终结果：连接建立后 `10` 秒内收到首条 dashboard 推送，退出码 `0`。

握手地址：

```text
ws://localhost:8080/ws/pv/dashboard?token=<jwt>
```

推送样本 JSON（从实际消息中裁剪的关键字段）：

```json
{
  "source": "websocket.connect",
  "pushedAt": "2026-04-16 16:01:23",
  "summary": {
    "activeAlerts": 1,
    "currentPowerKw": 56.70,
    "dailyYieldKwh": 528.82,
    "onlineInverters": 1,
    "totalCapacityMw": 19.30,
    "totalInverters": 3,
    "totalStations": 2
  },
  "alerts": [
    {
      "alertId": 1,
      "level": "warning",
      "status": "active"
    }
  ]
}
```

## 5. 发现的问题清单

本次实跑存在问题，但均已在同一轮 UAT 内修复，无遗留阻塞项。

1. Docker BuildKit 访问 `auth.docker.io/token` 被拒，导致基础镜像无法拉取。修复：移除远程 syntax 指令，并把 Docker 基础镜像切到 `docker.m.daocloud.io/library/*`。
2. 运行时镜像构建时，`.dockerignore` 误排除了 `ruoyi-vue3-myems/dist` 与 `ruoyi-admin.jar`。修复：显式加入白名单路径。
3. `/actuator/health` 先被安全链拦成 `401`，放开后又因未引入 Actuator 返回静态资源 `500`。修复：在 `SecurityConfig` 放行 `/actuator/health`，并为 `ruoyi-admin` 增加 `spring-boot-starter-actuator` 与 `management.endpoints.web.exposure.include=health,info`。
4. `/pv/dashboard/summary` 缺少实施方案要求的 `totalStations` 字段。修复：补齐 `PvDashboardSummary` DTO、MyBatis SQL 映射与默认值处理。
5. WebSocket 冒烟脚本依赖 `websocat/wscat`，当前环境未安装。修复：为脚本新增 Node 原生 `WebSocket` fallback，Node 20+ 可直接执行。

## 6. 资源占用快照

```text
CONTAINER ID   NAME                CPU %     MEM USAGE / LIMIT     MEM %     NET I/O           BLOCK I/O        PIDS
98a9d7f2c5bf   myems-ruoyi-admin   0.45%     832.7MiB / 7.748GiB   10.50%    102kB / 89.2kB    61.4kB / 188kB   170
33a7d612c25f   myems-ruoyi-vue3    0.00%     20.27MiB / 7.748GiB   0.26%     2.96kB / 1.32kB   7.4MB / 8.19kB   19
8f171d18f3d0   myems-redis         0.98%     21.59MiB / 7.748GiB   0.27%     81.1kB / 52.3kB   12.2MB / 221kB   6
75d65b26bcbc   myems-mysql         1.97%     545MiB / 7.748GiB     6.87%     127kB / 187kB     146MB / 337MB    48
```

## 7. 回归验证

- 后端：`mvn -pl ruoyi-system,ruoyi-quartz,ruoyi-admin -am test` 再跑通过
- 后端分项：Service `31/31`、Quartz `6/6`、Admin Controller `54/54`，总计 `91/91`
- 前端：`npm run test` 再跑通过，`26/26`
- UAT API 冒烟：`34` 个断言通过
- UAT WebSocket 冒烟：`10` 秒内收到首条推送

## 8. 清理

UAT 证据采集完成后已执行：

```bash
docker compose -f docker/docker-compose.yml --env-file docker/.env down -v
```

结果：4 个容器、3 个数据卷与 1 个网络均已清理。
