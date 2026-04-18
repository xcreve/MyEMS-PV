# MyEMS-PV v2.1 Release Pipeline Plan

## 1. 目标

为后续 `v2.1.x` 版本建立最小可用的发布流水线方案，覆盖 tag 触发、镜像构建、digest 留档和发布验收口径。本文件只定义方案，不包含 workflow 实现。

## 2. 触发条件

- Git 触发条件：推送符合 `v*` 规则的 tag，例如 `v2.1.0`
- 仅对正式 tag 触发镜像与制品流水线，不对 `-rc` 候选 tag 自动发布正式镜像
- 若后续需要候选版镜像，可单独为 `v*-rc*` 定义预发布流程，但不应与正式版混用

## 3. 镜像构建矩阵

### 3.1 镜像对象

- Backend：基于 [docker/backend/Dockerfile](/Users/xuyongqian/AI%20Code/MyEMS-PV/docker/backend/Dockerfile)
- Frontend：基于 [docker/frontend/Dockerfile](/Users/xuyongqian/AI%20Code/MyEMS-PV/docker/frontend/Dockerfile)

### 3.2 平台建议

- `linux/amd64`：建议纳入，作为当前默认生产平台
- `linux/arm64`：建议纳入，前提是目标镜像仓和基础镜像链路已验证可用

建议矩阵：

| 镜像 | `linux/amd64` | `linux/arm64` | 说明 |
|---|---|---|---|
| backend | 是 | 建议支持 | Java 服务，适合多架构 |
| frontend | 是 | 建议支持 | nginx 静态资源镜像，适合多架构 |

若首期要压缩复杂度，可先只做 `linux/amd64`，等镜像仓和运行环境验证完成后再补 `arm64`。

## 4. 制品产出

### 4.1 镜像 tag 命名

- 正式版：
  - `myems-pv-backend:vX.Y.Z`
  - `myems-pv-frontend:vX.Y.Z`
- 可选别名：
  - `myems-pv-backend:latest`
  - `myems-pv-frontend:latest`

`latest` 只应跟随最新正式版，不应用于 `-rc` 或手工试跑构建。

### 4.2 Digest 留档位置

- 首选留档位置：根仓 [docs/release_manifest_v2.0.0.md](/Users/xuyongqian/AI%20Code/MyEMS-PV/docs/release_manifest_v2.0.0.md) 同类文档的未来版本，例如 `docs/release_manifest_v2.1.0.md`
- 建议字段：
  - 镜像仓地址
  - tag
  - multi-arch manifest digest
  - backend / frontend 各自平台 digest

### 4.3 SBOM

- 建议纳入
- 首期可以至少对 backend / frontend 镜像各输出一份 SBOM，并在 release manifest 中记录下载位置或附件 URL
- 若首期发布链路复杂度过高，可先保留 SBOM 作为非阻塞产物，但应为后续版本预留接口

## 5. 与现有 Dockerfile 的对接点

- Backend 镜像构建输入依赖 [docker/backend/Dockerfile](/Users/xuyongqian/AI%20Code/MyEMS-PV/docker/backend/Dockerfile)
  - 需要确认流水线在构建前已准备 `ruoyi-java-myems/ruoyi-admin/target/ruoyi-admin.jar`
- Frontend 镜像构建输入依赖 [docker/frontend/Dockerfile](/Users/xuyongqian/AI%20Code/MyEMS-PV/docker/frontend/Dockerfile)
  - 需要确认流水线在构建前已准备 `ruoyi-vue3-myems/dist`
- 现有 `.dockerignore` 已对白名单产物路径做过处理，流水线应复用该约定，不额外改 Dockerfile

## 6. 验收口径

- CI 状态为绿：构建、推送、产物归档全部成功
- 镜像可拉取：至少验证 backend / frontend 的正式 tag 可从目标镜像仓拉取
- digest 已写回 release manifest：包含镜像 tag 和 digest
- 若纳入 SBOM：SBOM 下载路径或附件链接已写回 release manifest
- 发布完成后，GitHub Release 或 release checklist 中应能追溯镜像 tag、digest 与对应 Git tag

## 7. 后续实现边界

- 本轮不创建 `.github/workflows/`
- 本轮不修改 Dockerfile
- 本文件仅定义 `v2.1` 发布流水线设计输入，供下一轮实施时使用
