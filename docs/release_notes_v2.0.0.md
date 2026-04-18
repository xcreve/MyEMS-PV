# MyEMS-PV v2.0.0 Release Notes

- 发布日期：2026-04-18
- 发布类型：General Availability
- 基线说明：正式版采用 `v2.0.0-rc1` 已通过 UAT 的双子仓代码，并吸收 `v2.0.0-rc2` 在根仓完成的交付清理。
- UAT 状态：`2026-04-16` 已完成真实 `docker compose` 实跑；问题均在同轮修复，无遗留阻塞项。

## 1. 正式发布结论

- `v2.0.0` 不引入新的后端或前端业务代码变更，双子仓正式分支和正式标签均固定在已验收的候选提交。
- 根仓更新内容为正式版交付文档、Release Notes，以及子模块默认跟踪分支从 `release/v2.0.0-rc1` 切换为 `release/v2.0.0`。
- 历史候选版 `v2.0.0-rc1`、`v2.0.0-rc2` 保留为 pre-release 记录，不回写、不覆盖。

## 2. 三仓版本定位

| 仓库 | 分支 | 提交 Hash | Tag URL |
|---|---|---|---|
| `MyEMS-PV` | `main` | 由本次根仓正式版提交生成 | `https://github.com/xcreve/MyEMS-PV/tree/v2.0.0` |
| `ruoyi-java-myems` | `release/v2.0.0` | `a50852d42027fe9685fe7fd0570fbbf33f34be25` | `https://github.com/xcreve/RuoYi-Vue/tree/v2.0.0` |
| `ruoyi-vue3-myems` | `release/v2.0.0` | `bf43df732cb173afa3d29b2171f40ffa9f746768` | `https://github.com/xcreve/RuoYi-Vue3/tree/v2.0.0` |

## 3. 验收与回归依据

- UAT 报告：`docs/uat_report_2026-04-16.md`
- 候选版说明：`docs/release_notes_v2.0.0-rc1.md`
- rc2 清理说明：`docs/release_manifest_v2.0.0-rc2.md`

回归通过基线：

- 后端：`mvn -pl ruoyi-system,ruoyi-quartz,ruoyi-admin -am test` => `91/91`
- 前端：`npm run test` => `26/26`
- API 冒烟：`BASE_URL=http://localhost:8080 ./scripts/smoke_test.sh`
- WebSocket 冒烟：`BASE_URL=http://localhost/prod-api ./scripts/smoke_test_websocket.sh`

## 4. 冷安装验证命令

```bash
git clone --recurse-submodules https://github.com/xcreve/MyEMS-PV.git
cd MyEMS-PV
git checkout v2.0.0
git submodule update --init --recursive
```

期望子模块提交：

- 后端：`a50852d42027fe9685fe7fd0570fbbf33f34be25`
- 前端：`bf43df732cb173afa3d29b2171f40ffa9f746768`
