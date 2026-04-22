# Release Manifest: v2.1.0

- 生成日期：2026-04-22
- 发布类型：General Availability
- 说明：`v2.1.0` 发布 JMeter 性能基线、蓝绿部署脚本与 GitHub Actions 镜像发布流水线。镜像 digest 待 tag 流水线实际推送 GHCR 镜像后回填。

## 1. 发布组成

| 层级 | 仓库 | 远端 URL | 分支 / 标签 | 提交 Hash | 说明 |
|---|---|---|---|---|---|
| 根仓 | `MyEMS-PV` | `https://github.com/xcreve/MyEMS-PV.git` | `main` / `v2.1.0` | 以 `v2.1.0` tag 指向为准 | 性能基线、蓝绿部署脚本、发布流水线与发布 manifest |
| 子模块 | `ruoyi-java-myems` | `https://github.com/xcreve/RuoYi-Vue.git` | `release/v2.0.0` | `3ada7f4203f4fbe70b5a2781b12360ab9b95c099` | 后端镜像构建输入 |
| 子模块 | `ruoyi-vue3-myems` | `https://github.com/xcreve/RuoYi-Vue3.git` | `release/v2.0.1` | `3cefbe8353ce0b6a3e77901b05744e22b6d7be37` | 前端镜像构建输入 |

## 2. 镜像制品

镜像仓：GitHub Container Registry

| 组件 | 镜像仓地址 | Tag | Multi-arch manifest digest | `linux/amd64` digest | `linux/arm64` digest | SBOM |
|---|---|---|---|---|---|---|
| backend | `ghcr.io/xcreve/myems-pv-backend` | `v2.1.0` | `sha256:3c016d69124f23672a94fe14ec578645009102881a023f96a6942b40324a3fe6` | `sha256:6f84aeec15c1fe4f4636e3f14542adfc4c7d66758e2ee2fd229010a9110ab81c` | `sha256:5a050ed51e652214a2f2ef94b2aeeeb404219f7f492d4856453919ff35aa2db0` | 待 CI 回填 |
| backend | `ghcr.io/xcreve/myems-pv-backend` | `latest` | 跟随 `v2.1.0` | 跟随 `v2.1.0` | 跟随 `v2.1.0` | 待 CI 回填 |
| frontend | `ghcr.io/xcreve/myems-pv-frontend` | `v2.1.0` | `sha256:555728663093b8dbbf4d0f4a544129021089644558650147a2ceab6324ab485b` | `sha256:03d40dee07c65549a12c90cf8dcdbe69b236f1a255bcb3d7d214539a82b27ef3` | `sha256:f28eae2c15d2290f1d477208bce3fade17dced41a8d7eae30bc3cf9b093c10ec` | 待 CI 回填 |
| frontend | `ghcr.io/xcreve/myems-pv-frontend` | `latest` | 跟随 `v2.1.0` | 跟随 `v2.1.0` | 跟随 `v2.1.0` | 待 CI 回填 |

## 3. 发布前置校验结论

- CHANGELOG：`[Unreleased]` 保持为空，`[2.1.0]` 已记录 JMeter 压测计划、蓝绿部署脚本与性能基线文档。
- 性能基线：`docs/perf_baseline_v2.1.0.md` 已填入实测结果，结论为 `PERF_BASELINE_PASS`。
- 性能基线实测摘要：本地 Docker 缩减规格（50 线程 x 2 分钟），Dashboard P95 `40.00ms`，Station List P95 `41.00ms`，错误率 `0.00%`。

## 4. Tag URL

- 根仓：`https://github.com/xcreve/MyEMS-PV/tree/v2.1.0`

## 5. 冷验证基线

```bash
git clone --recurse-submodules https://github.com/xcreve/MyEMS-PV.git
cd MyEMS-PV
git checkout v2.1.0
git submodule update --init --recursive
```

检出结果应为：

- `ruoyi-java-myems` => `3ada7f4203f4fbe70b5a2781b12360ab9b95c099`
- `ruoyi-vue3-myems` => `3cefbe8353ce0b6a3e77901b05744e22b6d7be37`

## 6. Digest 回填说明

正式 tag 推送后，`.github/workflows/release.yml` 已构建并推送 `linux/amd64,linux/arm64` multi-arch 镜像，并归档 multi-arch manifest digest 与各平台 digest。本文件第 2 节 digest 来自 GHCR `v2.1.0` tag 的 `docker buildx imagetools inspect` 结果。
