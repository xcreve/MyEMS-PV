# MyEMS-PV v2.0.0 本地部署演练记录

## 结论

结论：`失败`

真实环境上线判断：`no-go`

阻断项：

- 在全新签出的 `v2.0.0` 演练目录内，执行文档主路径 `docker compose --env-file docker/.env -f docker/docker-compose.yml up -d --build` 时，前端镜像构建失败，报错 `COPY ruoyi-vue3-myems/dist ... not found`。
- `docker compose ps -a` 为空，说明容器未创建成功，后续 MySQL healthcheck、HTTP 冒烟、WebSocket 冒烟均无法执行。

## 演练范围

- 工作仓库：`/Users/xuyongqian/AI Code/MyEMS-PV`
- 权威部署文档：`docs/deploy_guide.md`
- 演练目录：`/tmp/myems-deploy-rehearsal-20260419-111510`
- 目标版本：根仓 `v2.0.0` -> `2212ccbd7d842925bb18b61131cf28cb287c7bb0`
- 根仓当前基线（开始记录时）：`2e2acc6c91c16420f62333684039482872c8ced3`
- 本地开始时间：`2026-04-19 11:15:10 +0800 (CST)`
- UTC 开始时间：`2026-04-19 03:15:10 +0000 (UTC)`
- 本地结束时间：`2026-04-19 11:33:48 +0800 (CST)`
- UTC 结束时间：`2026-04-19 03:33:48 +0000 (UTC)`

## 1. 环境与端口预检

状态：`通过`

说明：本轮按续跑要求，仅重跑 Docker 可用性检查；端口与磁盘空间沿用上一轮证据，标记为“未变化”。

命令与输出摘录：

```bash
$ docker version
Client:
 Version:           29.4.0
 API version:       1.54
 Go version:        go1.26.1
 Git commit:        9d7ad9f
 Built:             Tue Apr  7 08:34:32 2026
 OS/Arch:           darwin/arm64
 Context:           desktop-linux

Server: Docker Desktop 4.69.0 (224084)
 Engine:
  Version:          29.4.0
  API version:      1.54 (minimum version 1.40)
  Go version:       go1.26.1
  Git commit:       daa0cb7
  Built:            Tue Apr  7 08:36:25 2026
  OS/Arch:          linux/arm64
  Experimental:     false
 containerd:
  Version:          v2.2.1
  GitCommit:        dea7da592f5d1d2b7755e3a161be07f43fad8f75
 runc:
  Version:          1.3.4
  GitCommit:        v1.3.4-0-gd6d73eb8
 docker-init:
  Version:          0.19.0
  GitCommit:        de40ad0

$ docker system df
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          0         0         15.58GB   0B (0%)
Containers      0         0         0B        0B
Local Volumes   0         0         0B        0B
Build Cache     219       0         16.69GB   16.69GB
```

沿用上一轮证据，未变化：

```bash
$ lsof -nP -iTCP:80,8080,3306,6379 -sTCP:LISTEN
# 无输出，80/8080/3306/6379 无监听

$ df -h / /System/Volumes/Data
Filesystem        Size    Used   Avail Capacity iused ifree %iused  Mounted on
/dev/disk3s1s1   7.3Ti    12Gi   4.7Ti     1%    458k  4.3G    0%   /
/dev/disk3s5     7.3Ti   2.5Ti   4.7Ti    35%    2.1M   51G    0%   /System/Volumes/Data
/dev/disk3s5     7.3Ti   2.5Ti   4.7Ti    35%    2.1M   51G    0%   /System/Volumes/Data
```

## 2. 在干净位置签出 v2.0.0

状态：`通过`

命令与输出摘录：

```bash
$ git clone --recurse-submodules --branch v2.0.0 https://github.com/xcreve/MyEMS-PV.git .
Cloning into '.'...
warning: refs/tags/v2.0.0 8a93a4983e8a93866b4ae7f20c0bfad3d8749696 is not a commit!
Note: switching to '2212ccbd7d842925bb18b61131cf28cb287c7bb0'.
Submodule 'ruoyi-java-myems' (https://github.com/xcreve/RuoYi-Vue.git) registered for path 'ruoyi-java-myems'
Submodule 'ruoyi-vue3-myems' (https://github.com/xcreve/RuoYi-Vue3.git) registered for path 'ruoyi-vue3-myems'
Cloning into '/private/tmp/myems-deploy-rehearsal-20260419-111510/ruoyi-java-myems'...
Cloning into '/private/tmp/myems-deploy-rehearsal-20260419-111510/ruoyi-vue3-myems'...
Submodule path 'ruoyi-java-myems': checked out 'a50852d42027fe9685fe7fd0570fbbf33f34be25'
Submodule path 'ruoyi-vue3-myems': checked out 'bf43df732cb173afa3d29b2171f40ffa9f746768'

$ git rev-parse HEAD
2212ccbd7d842925bb18b61131cf28cb287c7bb0

$ git -C /tmp/myems-deploy-rehearsal-20260419-111510/ruoyi-java-myems rev-parse HEAD
a50852d42027fe9685fe7fd0570fbbf33f34be25

$ git -C /tmp/myems-deploy-rehearsal-20260419-111510/ruoyi-vue3-myems rev-parse HEAD
bf43df732cb173afa3d29b2171f40ffa9f746768
```

校验结果：

- 根仓 SHA 符合预期：`2212ccbd7d842925bb18b61131cf28cb287c7bb0`
- 后端子仓 SHA 符合预期：`a50852d42027fe9685fe7fd0570fbbf33f34be25`
- 前端子仓 SHA 符合预期：`bf43df732cb173afa3d29b2171f40ffa9f746768`

## 3. 构建与启动

状态：`失败`

执行动作：

```bash
$ cp docker/.env.example docker/.env
# 无输出
```

主命令：

```bash
$ docker compose --env-file docker/.env -f docker/docker-compose.yml up -d --build
Image redis:7.4-alpine Pulling
Image mysql:8.4 Pulling
...
Image redis:7.4-alpine Pulled
...
Image mysql:8.4 Pulled
Image docker-ruoyi-admin Building
Image docker-ruoyi-vue3 Building
#1 [internal] load local bake definitions
#1 reading from stdin 1.08kB done
#1 DONE 0.0s
#2 [ruoyi-vue3 internal] load build definition from Dockerfile
#2 transferring dockerfile: 213B done
#2 DONE 0.0s
#3 [ruoyi-admin internal] load build definition from Dockerfile
#3 transferring dockerfile: 324B done
#3 DONE 0.0s
#9 [ruoyi-vue3 3/3] COPY ruoyi-vue3-myems/dist /usr/share/nginx/html
#9 ERROR: failed to calculate checksum of ref ... "/ruoyi-vue3-myems/dist": not found
------
> [ruoyi-vue3 3/3] COPY ruoyi-vue3-myems/dist /usr/share/nginx/html:
------
Dockerfile:3

1 | FROM docker.m.daocloud.io/library/nginx:1.27-alpine
2 | COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
3 | >>> COPY ruoyi-vue3-myems/dist /usr/share/nginx/html

target ruoyi-vue3: failed to solve: failed to compute cache key: failed to calculate checksum of ref ... "/ruoyi-vue3-myems/dist": not found
View build details: docker-desktop://dashboard/build/default/default/iv39ebm65zci6mbffp0cdd80c
```

失败后补采状态：

```bash
$ docker compose -f docker/docker-compose.yml ps -a
NAME      IMAGE     COMMAND   SERVICE   CREATED   STATUS    PORTS

$ test -d ruoyi-vue3-myems/dist && echo PRESENT || echo MISSING
MISSING
```

说明：

- 失败发生在前端镜像构建阶段，未进入容器启动阶段。
- 因为没有成功创建容器，`docker compose ps` 中不存在可等待的 `mysql` healthcheck，对 `docker inspect --format '{{.State.Health.Status}}' <mysql 容器>` 的检查未执行。

## 4. 冒烟验证

状态：`跳过`

跳过原因：

- 第 3 步构建失败，容器栈未启动成功，`http://localhost:8080`、`http://localhost/prod-api` 及 WebSocket 入口均无可验证目标。

未执行的命令：

```bash
BASE_URL=http://localhost:8080 ./scripts/smoke_test.sh
BASE_URL=http://localhost/prod-api ./scripts/smoke_test.sh
BASE_URL=http://localhost:8080 ./scripts/smoke_test_websocket.sh
BASE_URL=http://localhost/prod-api ./scripts/smoke_test_websocket.sh
```

## 5. 关停与清理

状态：`通过`

命令与输出摘录：

```bash
$ docker compose -f docker/docker-compose.yml down -v
# 无输出
```

说明：

- 清理命令仅在 `/tmp/myems-deploy-rehearsal-20260419-111510` 执行。
- 演练目录保留，未删除。

## 与 docs/deploy_guide.md 不一致之处

1. `docs/deploy_guide.md` 的主路径在“3. 一键启动”中写为复制 `.env` 后直接执行 `docker compose ... up -d --build`，但在全新 `v2.0.0` 签出目录下，该路径不能自洽完成。
2. 同一份文档在“6.7 Docker 构建提示 COPY 文件不存在”里又写明，重新执行前要先确保已生成前端 `dist` 与后端 `ruoyi-admin.jar`。这说明“主路径前置条件”没有前置到主流程，而是埋在故障排查段落里。
3. 本次演练实际命中的是前端产物缺失：`ruoyi-vue3-myems/dist` 不存在；后端 `ruoyi-admin.jar` 是否同样需要预先生成，本次未走到对应检查，但文档 6.7 已提示存在同类前置条件。

## 建议下一步处置

1. 在不改动已发布 `v2.0.0` tag 的前提下，明确发布物交付口径：是要求仓库内自带 `dist` / `ruoyi-admin.jar`，还是要求部署前先执行一次前后端构建。
2. 若后续继续演练，应先补齐与文档一致的前置产物，再从第 3 步重新执行 `docker compose ... up -d --build`。
3. 单独评审 `docs/deploy_guide.md` 主流程，把“需先生成 `dist` / `ruoyi-admin.jar`”提升为主路径前置条件，避免再次在干净目录中按文档失败。

## v2.0.0 部署可重复性局限

已核验事实：

1. `ruoyi-vue3-myems/.gitignore:3` 忽略 `dist/`，`ruoyi-vue3-myems/.gitignore:23-24` 忽略 `package-lock.json` 与 `yarn.lock`。这意味着前端发布产物和锁文件都不会随子仓提交进入 fresh clone。
2. 2026-04-19 复跑前补采的实际命令证据表明，演练快照 `/tmp/myems-deploy-rehearsal-20260419-111510/ruoyi-vue3-myems` 中既没有 `dist/`，也没有 `package-lock.json`：

```bash
$ test -d ruoyi-vue3-myems/dist && echo PRESENT || echo MISSING
MISSING

$ test -f package-lock.json && { echo PACKAGE_LOCK_PRESENT; head -n 5 package-lock.json; } || echo PACKAGE_LOCK_MISSING
PACKAGE_LOCK_MISSING
```

3. `docker/frontend/Dockerfile:3` 直接执行 `COPY ruoyi-vue3-myems/dist /usr/share/nginx/html`，不会在镜像构建过程中自行生成前端静态资源。

结论：

- `v2.0.0` 的部署主路径在 fresh clone 下不可重复，开发者必须先在本地执行 `mvn package` 生成后端 jar，再执行 `npm install` 与 `npm run build:prod` 生成前端 `dist/`，之后才能让当前 Dockerfile 完成镜像构建。
- 该限制来自仓结构的既有选择，而不是 `v2.0.0` 单次发版疏漏。
- 此限制将在 `v2.0.1` 通过锁文件提交与多阶段镜像构建消除。
