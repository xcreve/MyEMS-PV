# 性能基线 v2.1.0

## 测试环境

- 部署方式：`docker compose -f docker/docker-compose.yml up -d --build`
- 压测工具：Apache JMeter 5.x
- 默认目标：`http://localhost:8080`
- 默认账号：`admin / admin123`
- 数据库与 Redis：沿用项目 `docker/docker-compose.yml` 中的 MySQL 8.4 与 Redis 7.4。

## 测试方法（JMeter 计划说明）

JMeter 测试计划位于 `scripts/jmeter/myems_pv_perf.jmx`，默认参数如下：

| 参数 | 默认值 |
|------|--------|
| `BASE_URL` | `localhost` |
| `BASE_PORT` | `8080` |
| `THREAD_COUNT` | `200` |
| `RAMP_UP_SECONDS` | `60` |
| `DURATION_SECONDS` | `600` |

测试序列：

1. `POST /login` 获取 token。
2. `GET /pv/dashboard/summary`，断言 HTTP 200 且响应包含 `totalStations`。
3. `GET /pv/station/list?pageSize=10`，断言 HTTP 200。
4. `GET /pv/gateway/list`，断言 HTTP 200。
5. `GET /pv/alert/list`，断言 HTTP 200。

测试计划使用 HTTP Cookie Manager，并通过 `Authorization: Bearer ${token}` 访问业务接口。

## 验收标准

| API | 指标 | 目标 | 状态 |
|-----|------|------|------|
| GET /pv/dashboard/summary | P95 | < 100ms | ✅ 通过（实测值 40.00ms） |
| GET /pv/station/list | P95 | < 80ms | ✅ 通过（实测值 41.00ms） |
| 并发用户 | 200 线程 × 10 分钟 | 0 错误率 | ✅ 通过（本地 Docker 缩减规格 50 线程 × 2 分钟，0 错误） |

## 执行步骤

1. 启动被测环境：

   ```bash
   docker compose -f docker/docker-compose.yml up -d --build
   ```

2. 执行性能基线：

   ```bash
   ./scripts/run_perf_test.sh
   ```

3. 如 JMeter 不在 `PATH` 中，传入 JMeter 安装目录或设置 `JMETER_HOME`：

   ```bash
   ./scripts/run_perf_test.sh /opt/apache-jmeter-5.6.3
   JMETER_HOME=/opt/apache-jmeter-5.6.3 ./scripts/run_perf_test.sh
   ```

4. 覆盖默认压测参数：

   ```bash
   BASE_URL=localhost BASE_PORT=8080 THREAD_COUNT=200 DURATION_SECONDS=600 ./scripts/run_perf_test.sh
   ```

脚本会在 `scripts/results/` 下生成 `perf_YYYYmmdd_HHMMSS.jtl`，并解析 Dashboard Summary 与 Station List 的 P95。

## 结果记录（留空，实测后填入）

| 执行时间 | Git SHA | 环境说明 | Dashboard P95 | Station List P95 | 错误率 | 结论 |
|----------|---------|----------|---------------|------------------|--------|------|
| 2026-04-22 09:16 CST | 30a1fd3 | Docker Compose 本地单机；Apache JMeter 5.6.3；本地 Docker 缩减规格（50 线程 × 2 分钟，ramp-up 30 秒）。标准规格尝试因后端容器 CPU 接近满载停止，未作为基线结果。 | 40.00ms | 41.00ms | 0.00%（0 / 75576） | PERF_BASELINE_PASS |

资源记录：

- 标准规格尝试（200 线程 × 10 分钟）ramp-up 期间后端容器 CPU 达 `1774.13%`（18 CPU Docker Desktop），按本地资源不足处理并切换缩减规格。
- 缩减规格运行中 Docker stats：`myems-ruoyi-admin 1745.52% 1.557GiB / 31.29GiB`，`myems-mysql 19.11% 600.1MiB / 31.29GiB`，`myems-redis 2.24% 38.34MiB / 31.29GiB`，`myems-ruoyi-vue3 0.00% 20.33MiB / 31.29GiB`。
- 压测完成后 Docker stats：`myems-ruoyi-admin 0.29% 1.557GiB / 31.29GiB`，`myems-mysql 0.49% 601.3MiB / 31.29GiB`，`myems-redis 0.60% 53.27MiB / 31.29GiB`，`myems-ruoyi-vue3 0.00% 20.33MiB / 31.29GiB`。

## 蓝绿部署 SOP

蓝绿 override 文件：

- Blue：`docker/docker-compose.blue.yml`，后端 `8081`，前端 `8180`。
- Green：`docker/docker-compose.green.yml`，后端 `8082`，前端 `8280`。

切换流程：

1. 启动目标颜色，不重复部署 MySQL/Redis：

   ```bash
   ./scripts/blue_green_switch.sh blue
   ./scripts/blue_green_switch.sh green
   ```

2. 脚本执行内容：

   ```bash
   docker compose -f docker/docker-compose.yml -f docker/docker-compose.<color>.yml up -d --build --no-deps ruoyi-admin ruoyi-vue3
   ```

3. 脚本会等待新后端 `http://localhost:<backend-port>/actuator/health` 返回 `{"status":"UP"}`，并等待新前端 `/` 返回 HTTP 200。

4. 健康检查通过后，操作员手动更新上层负载均衡、DNS 或 nginx upstream 指向新端口。

5. 确认旧颜色流量已排空后，再手动停止旧颜色：

   ```bash
   docker compose -f docker/docker-compose.yml -f docker/docker-compose.<old-color>.yml stop ruoyi-vue3 ruoyi-admin
   ```

6. 演练或审阅命令可使用 dry-run：

   ```bash
   ./scripts/blue_green_switch.sh blue --dry-run
   ```
