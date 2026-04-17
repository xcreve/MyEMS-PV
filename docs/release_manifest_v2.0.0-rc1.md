# Release Manifest: v2.0.0-rc1

- 生成日期：2026-04-17
- 适用范围：根仓发布物料 + 双子仓独立候选标签

## 1. 子仓标签与提交映射

| 仓库 | 标签 | 提交 Hash | 状态 |
|---|---|---|---|
| `ruoyi-java-myems` | `v2.0.0-rc1` | `a50852d42027fe9685fe7fd0570fbbf33f34be25` | 工作区干净 |
| `ruoyi-vue3-myems` | `v2.0.0-rc1` | `bf43df732cb173afa3d29b2171f40ffa9f746768` | 工作区干净 |

## 2. 复现构建命令

### 2.1 后端

```bash
cd ruoyi-java-myems
git checkout v2.0.0-rc1
mvn package
```

### 2.2 前端

```bash
cd ruoyi-vue3-myems
git checkout v2.0.0-rc1
npm install
npm run build
```

## 3. 验证基线

- 后端：`mvn -pl ruoyi-system,ruoyi-quartz,ruoyi-admin -am test` => `91/91`
- 前端：`npm run test` => `26/26`
- UAT：`docs/uat_report_2026-04-16.md`

## 4. 降级说明

- 本地 OWASP Dependency-Check 已停止，不再阻塞候选发布。
- 夜间安全扫描迁移到 `ruoyi-java-myems/.github/workflows/security-scan.yml`。
- 前端 `npm audit --omit=dev --audit-level=high` 当前为 `0 high / 0 critical`。
