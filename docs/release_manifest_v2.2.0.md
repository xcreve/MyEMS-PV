# Release Manifest: v2.2.0

- 生成日期：2026-04-22
- 发布类型：General Availability
- 说明：`v2.2.0` 发布 `pv_telemetry` 月分区迁移、Quartz 月维护任务与本地迁移验证结论。镜像 digest 已由 tag 流水线推送 GHCR 镜像后回填。

## 1. 发布组成

| 层级 | 仓库 | 远端 URL | 分支 / 标签 | 提交 Hash | 说明 |
|---|---|---|---|---|---|
| 根仓 | `MyEMS-PV` | `https://github.com/xcreve/MyEMS-PV.git` | `main` / `v2.2.0` | `0fffd87d95e3eca02255083cfb6d3755c8a0c2ea` | CHANGELOG、分区迁移 runbook 验证结论与发布 manifest |
| 子模块 | `ruoyi-java-myems` | `https://github.com/xcreve/RuoYi-Vue.git` | `release/v2.0.0` | `3ada7f4203f4fbe70b5a2781b12360ab9b95c099` | 后端镜像构建输入，包含 `pv_telemetry` 分区迁移与 Quartz 月维护任务 |
| 子模块 | `ruoyi-vue3-myems` | `https://github.com/xcreve/RuoYi-Vue3.git` | `release/v2.0.1` | `3cefbe8353ce0b6a3e77901b05744e22b6d7be37` | 前端镜像构建输入 |

## 2. 镜像制品

镜像仓：GitHub Container Registry

| 组件 | 镜像仓地址 | Tag | Multi-arch manifest digest | `linux/amd64` digest | `linux/arm64` digest | SBOM |
|---|---|---|---|---|---|---|
| backend | `ghcr.io/xcreve/myems-pv-backend` | `v2.2.0` | `sha256:1efdce34b29d677f55db62dd93d3589021660664fc7efd0ea50e1198ed1d23a0` | `sha256:bf7040974384071c32145968ebda185f61f40c35c2c44227a11fa016a03db6d2` | `sha256:4627b30d87ddc439fd7b40dd6c4e207741199c86dbfb57eeef9e593bf7e5fda5` | N/A（历史版本 CI 未覆盖 SBOM 生成。自 `v2.3.0` 起由 release workflow 通过 `anchore/sbom-action@v0` 生成并上传为 action artifact，保留期 90 天；下载方式见 `release_pipeline_plan_v2.1.md` §4.3。） |
| backend | `ghcr.io/xcreve/myems-pv-backend` | `latest` | 跟随 `v2.2.0` | 跟随 `v2.2.0` | 跟随 `v2.2.0` | N/A（历史版本 CI 未覆盖 SBOM 生成。自 `v2.3.0` 起由 release workflow 通过 `anchore/sbom-action@v0` 生成并上传为 action artifact，保留期 90 天；下载方式见 `release_pipeline_plan_v2.1.md` §4.3。） |
| frontend | `ghcr.io/xcreve/myems-pv-frontend` | `v2.2.0` | `sha256:d63aee4e85285f4d11f6121c9861856a23d3cb88948af5456f6dce2cae4f2d96` | `sha256:3120cbd727bb32f55cfbb20d837371dd32203838609cc71e65de87db3cdf3a8d` | `sha256:7133774489a69ef9f05aed121491a0593e7eb9019162696f278db16ab6b5f2a3` | N/A（历史版本 CI 未覆盖 SBOM 生成。自 `v2.3.0` 起由 release workflow 通过 `anchore/sbom-action@v0` 生成并上传为 action artifact，保留期 90 天；下载方式见 `release_pipeline_plan_v2.1.md` §4.3。） |
| frontend | `ghcr.io/xcreve/myems-pv-frontend` | `latest` | 跟随 `v2.2.0` | 跟随 `v2.2.0` | 跟随 `v2.2.0` | N/A（历史版本 CI 未覆盖 SBOM 生成。自 `v2.3.0` 起由 release workflow 通过 `anchore/sbom-action@v0` 生成并上传为 action artifact，保留期 90 天；下载方式见 `release_pipeline_plan_v2.1.md` §4.3。） |

## 3. 发布前置校验结论

- CHANGELOG：`[Unreleased]` 保持为空，`[2.2.0]` 已记录 `pv_telemetry` 月分区迁移与 Quartz 月维护任务。
- 分区迁移验证：`scripts/runbook_pv_telemetry_partition.md` 已回填 Docker Compose 本地验证结论，`pv_telemetry` 分区窗口为 `p202604` 至 `p202703` + `pmax`。
- 写入验证：`/pv/dashboard/simulate` 新增 3 条遥测数据，均可从 `pv_telemetry partition(p202604)` 查到。
- Quartz 验证：手动触发 `pvTelemetryPartitionMaintainTask.maintainMonthlyPartitions(12)` 成功，`sys_job_log.status=0`。
- 单元测试：`mvn -pl ruoyi-quartz -am test` 通过。
- 发布流水线：GitHub Actions `Release Images` run `24775851770` 通过，已推送 backend/frontend `linux/amd64,linux/arm64` multi-arch 镜像。

## 4. Tag URL

- 根仓：`https://github.com/xcreve/MyEMS-PV/tree/v2.2.0`

## 5. 冷验证基线

```bash
git clone --recurse-submodules https://github.com/xcreve/MyEMS-PV.git
cd MyEMS-PV
git checkout v2.2.0
git submodule update --init --recursive
```

检出结果应为：

- `ruoyi-java-myems` => `3ada7f4203f4fbe70b5a2781b12360ab9b95c099`
- `ruoyi-vue3-myems` => `3cefbe8353ce0b6a3e77901b05744e22b6d7be37`

## 6. Digest 回填说明

正式 tag 推送后，`.github/workflows/release.yml` 已构建并推送 `linux/amd64,linux/arm64` multi-arch 镜像，并归档 multi-arch manifest digest 与各平台 digest。本文件第 2 节 digest 来自 GHCR `v2.2.0` tag 的 `docker buildx imagetools inspect` 结果，并与 Actions artifact `release-digest-backend`、`release-digest-frontend` 内容一致。
