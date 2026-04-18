# Release Manifest: v2.0.0-rc2

- 生成日期：2026-04-18
- 适用范围：根仓发布清理与子模块元数据补齐
- 说明：`docs/release_manifest_v2.0.0-rc1.md` 冻结保留，不回写历史记录

## 1. 发布组成

| 层级 | 仓库 | 远端 URL | 分支 / 标签 | 提交 Hash | 说明 |
|---|---|---|---|---|---|
| 根仓 | `MyEMS-PV` | `https://github.com/xcreve/MyEMS-PV.git` | `v2.0.0-rc2` | 由本次根仓提交生成 | 仅根仓补清理和 `.gitmodules` |
| 子模块 | `ruoyi-java-myems` | `https://github.com/xcreve/RuoYi-Vue.git` | `release/v2.0.0-rc1` / `v2.0.0-rc1` | `a50852d42027fe9685fe7fd0570fbbf33f34be25` | 后端候选版，保持不变 |
| 子模块 | `ruoyi-vue3-myems` | `https://github.com/xcreve/RuoYi-Vue3.git` | `release/v2.0.0-rc1` / `v2.0.0-rc1` | `bf43df732cb173afa3d29b2171f40ffa9f746768` | 前端候选版，保持不变 |

## 2. 相对 rc1 的根仓差异

- 删除 legacy Firebase 残留：
  - `.github/workflows/ci.yml`
  - `docker/firestore-emulator/`
  - `scripts/test-firestore-rules.sh`
- 新增根仓 `.gitmodules`，显式声明两个子模块的 fork URL 和 `branch = release/v2.0.0-rc1`
- 业务代码、UAT 证据、双子仓候选标签均沿用 rc1，不重新打子仓标签

## 3. 外部复现方式

```bash
git clone https://github.com/xcreve/MyEMS-PV.git
cd MyEMS-PV
git checkout v2.0.0-rc2
git submodule update --init --recursive
git submodule update --remote --checkout
```

执行完成后，子模块会指向：

- 后端：`https://github.com/xcreve/RuoYi-Vue.git` 的 `release/v2.0.0-rc1`
- 前端：`https://github.com/xcreve/RuoYi-Vue3.git` 的 `release/v2.0.0-rc1`

## 4. 验证基线

- 后端：`mvn -pl ruoyi-system,ruoyi-quartz,ruoyi-admin -am test` => `91/91`
- 前端：`npm run test` => `26/26`
- UAT：`docs/uat_report_2026-04-16.md`
- 说明：本次 rc2 不变更双子仓代码，仅提升根仓可解释性和交付整洁度
