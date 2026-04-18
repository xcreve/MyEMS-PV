# Release Manifest: v2.0.0

- 生成日期：2026-04-18
- 发布类型：General Availability
- 说明：`v2.0.0` 以 `v2.0.0-rc1` 的双子仓代码为正式版基线，并吸收 `v2.0.0-rc2` 在根仓完成的交付清理与子模块元数据补齐。

## 1. 发布组成

| 层级 | 仓库 | 远端 URL | 分支 / 标签 | 提交 Hash | 说明 |
|---|---|---|---|---|---|
| 根仓 | `MyEMS-PV` | `https://github.com/xcreve/MyEMS-PV.git` | `main` / `v2.0.0` | 由本次根仓提交生成 | 正式版说明文档、Release Notes、`.gitmodules` 跟踪分支切换 |
| 子模块 | `ruoyi-java-myems` | `https://github.com/xcreve/RuoYi-Vue.git` | `release/v2.0.0` / `v2.0.0` | `a50852d42027fe9685fe7fd0570fbbf33f34be25` | 与 `v2.0.0-rc1` / `v2.0.0-rc2` 候选代码一致 |
| 子模块 | `ruoyi-vue3-myems` | `https://github.com/xcreve/RuoYi-Vue3.git` | `release/v2.0.0` / `v2.0.0` | `bf43df732cb173afa3d29b2171f40ffa9f746768` | 与 `v2.0.0-rc1` / `v2.0.0-rc2` 候选代码一致 |

## 2. GA 前置校验结论

- UAT 依据：`docs/uat_report_2026-04-16.md`
- UAT 结论：本次实跑问题均已在同轮修复，无遗留阻塞项；回归验证通过，后端 `91/91`、前端 `26/26`、API 冒烟 `34` 条断言通过、WebSocket 在 10 秒内收到首条推送。
- rc2 依据：`docs/release_manifest_v2.0.0-rc2.md`
- rc2 结论：`v2.0.0-rc2` 仅变更根仓交付物，不变更双子仓代码。
- 当前复核：正式版发布前已确认两个子仓的 `origin/release/v2.0.0-rc1` 与 `v2.0.0-rc1` 仍指向上述同一提交，无额外候选后续代码漂移。

## 3. 三仓 Tag URL

- 根仓：`https://github.com/xcreve/MyEMS-PV/tree/v2.0.0`
- 后端：`https://github.com/xcreve/RuoYi-Vue/tree/v2.0.0`
- 前端：`https://github.com/xcreve/RuoYi-Vue3/tree/v2.0.0`

## 4. 冷验证基线

```bash
git clone --recurse-submodules https://github.com/xcreve/MyEMS-PV.git
cd MyEMS-PV
git checkout v2.0.0
git submodule update --init --recursive
```

检出结果应为：

- `ruoyi-java-myems` => `a50852d42027fe9685fe7fd0570fbbf33f34be25`
- `ruoyi-vue3-myems` => `bf43df732cb173afa3d29b2171f40ffa9f746768`
