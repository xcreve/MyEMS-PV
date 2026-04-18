# MyEMS-PV v2.0.0 发布后检查清单

- 执行时间（本地）：`2026-04-19 00:12:33 +0800 (CST)`
- 执行时间（UTC）：`2026-04-18 16:12:33 +0000 (UTC)`
- 工作目录：`/Users/xuyongqian/AI Code/MyEMS-PV`
- 发布基线：
  - 根仓 `MyEMS-PV`：`main` = `2212ccbd7d842925bb18b61131cf28cb287c7bb0`
  - 根仓注释 tag `v2.0.0`：`8a93a4983e8a93866b4ae7f20c0bfad3d8749696`
  - 后端 `RuoYi-Vue` `release/v2.0.0`：`a50852d42027fe9685fe7fd0570fbbf33f34be25`
  - 后端注释 tag `v2.0.0`：`489b9f75f2b99d1f00d02c515af5fc19b1413e5b`
  - 前端 `RuoYi-Vue3` `release/v2.0.0`：`bf43df732cb173afa3d29b2171f40ffa9f746768`
  - 前端注释 tag `v2.0.0`：`90d02c2044e0601c680a45b366b7d1bb2f300b66`
- 关联 URL：
  - Root Release：`https://github.com/xcreve/MyEMS-PV/releases/tag/v2.0.0`
  - Root Tag：`https://github.com/xcreve/MyEMS-PV/tree/v2.0.0`
  - Backend Tag：`https://github.com/xcreve/RuoYi-Vue/tree/v2.0.0`
  - Frontend Tag：`https://github.com/xcreve/RuoYi-Vue3/tree/v2.0.0`

## 1. 发布通告与文档同步

状态：`已做`

### 1.1 GitHub Release body 同步

命令：

```bash
gh release edit v2.0.0 --repo xcreve/MyEMS-PV --notes-file docs/release_notes_v2.0.0.md
```

实际输出：

```text
https://github.com/xcreve/MyEMS-PV/releases/tag/v2.0.0
```

结论：

- `v2.0.0` Release body 已用仓内 [docs/release_notes_v2.0.0.md](/Users/xuyongqian/AI%20Code/MyEMS-PV/docs/release_notes_v2.0.0.md) 刷新。

### 1.2 CHANGELOG 与版本占位同步

检查命令：

```bash
rg -n "2\.0\.0-rc|version-2\.0\.0|latest" README.md DEVELOPER_GUIDE.md docker/deploy_guide.md CHANGELOG.md
```

检查输出：

```text
CHANGELOG.md:8:## [2.0.0-rc1] - 2026-04-17
CHANGELOG.md:41:- P1-1 ModbusRTU 主动轮询仍待真实 RTU 设备或模拟器联调，不阻塞 `v2.0.0-rc1` 发布候选。
CHANGELOG.md:42:- P2-16 APM 观测接入仍待生产环境接入 SkyWalking / Prometheus，不阻塞 `v2.0.0-rc1` 发布候选。
README.md:3:![version](https://img.shields.io/badge/version-2.0.0--rc1-blue) ...
README.md:9:**当前状态**：✅ `v2.0.0-rc1` 候选发布物料已齐备，UAT 实跑通过
README.md:57:| RuoYi Framework | 2.0.0-rc1 | 基于若依 3.9.2 定制，内置 JWT + RBAC + 代码生成 |
README.md:84:> 发布候选的升级、回滚、预检与验收说明见 [docs/release_notes_v2.0.0-rc1.md](...)
DEVELOPER_GUIDE.md:549:docker build -t myems-pv:latest .
DEVELOPER_GUIDE.md:550:docker run -p 80:5173 myems-pv:latest
```

已修改文件：

- [README.md](/Users/xuyongqian/AI%20Code/MyEMS-PV/README.md)
- [CHANGELOG.md](/Users/xuyongqian/AI%20Code/MyEMS-PV/CHANGELOG.md)
- [DEVELOPER_GUIDE.md](/Users/xuyongqian/AI%20Code/MyEMS-PV/DEVELOPER_GUIDE.md)

落地结果：

- `README.md` 顶部版本 badge、当前状态、RuoYi Framework 版本、正式版说明链接已切换为 `v2.0.0`
- `CHANGELOG.md` 已新增 `## [2.0.0] - 2026-04-18`
- `DEVELOPER_GUIDE.md` Docker 示例镜像 tag 已从 `latest` 改为 `v2.0.0`

## 2. 制品与镜像

状态：`跳过`

检查命令：

```bash
ls -la .github .github/workflows 2>/dev/null
find . -maxdepth 3 \( -name 'Makefile' -o -name 'Dockerfile' -o -path './.github/workflows/*' \) | sort
```

实际输出：

```text
./docker/backend/Dockerfile
./docker/frontend/Dockerfile
```

结论：

- 根仓不存在 `.github/workflows/`
- 根仓不存在 `Makefile`
- 仅发现 `docker/backend/Dockerfile` 与 `docker/frontend/Dockerfile`
- 仓内未定义由 `v2.0.0` tag 触发的镜像发布或制品归档 CI，未执行重发，也未向 [docs/release_manifest_v2.0.0.md](/Users/xuyongqian/AI%20Code/MyEMS-PV/docs/release_manifest_v2.0.0.md) 追加制品段

建议：

- 若后续需要镜像仓或二进制制品留档，应先在根仓补充 workflow / 发布流水线，再用后续版本接入

## 3. 分支与保护策略

状态：`已做（含跳过项）`

### 3.1 根仓 release 分支存在性核验

命令：

```bash
gh api "repos/xcreve/MyEMS-PV/branches/release%2Fv2.0.0"
gh api "repos/xcreve/MyEMS-PV/branches/release%2Fv2.0.0-rc1"
gh api "repos/xcreve/MyEMS-PV/branches/release%2Fv2.0.0-rc2"
```

实际输出：

```text
gh: Branch not found (HTTP 404)
{"message":"Branch not found","documentation_url":"https://docs.github.com/rest/branches/branches#get-a-branch","status":"404"}
```

结论：

- 根仓 GitHub 上不存在 `release/v2.0.0`、`release/v2.0.0-rc1`、`release/v2.0.0-rc2` 分支，因此根仓无对应分支保护操作

### 3.2 子仓 rc 分支核验

命令与输出：

```bash
gh api "repos/xcreve/RuoYi-Vue/branches/release%2Fv2.0.0-rc1" --jq '{name: .name, protected: .protected, sha: .commit.sha}'
gh api "repos/xcreve/RuoYi-Vue3/branches/release%2Fv2.0.0-rc1" --jq '{name: .name, protected: .protected, sha: .commit.sha}'
gh api "repos/xcreve/RuoYi-Vue/branches/release%2Fv2.0.0-rc2"
gh api "repos/xcreve/RuoYi-Vue3/branches/release%2Fv2.0.0-rc2"
```

```text
{"name":"release/v2.0.0-rc1","protected":false,"sha":"a50852d42027fe9685fe7fd0570fbbf33f34be25"}
{"name":"release/v2.0.0-rc1","protected":false,"sha":"bf43df732cb173afa3d29b2171f40ffa9f746768"}
gh: Branch not found (HTTP 404)
{"message":"Branch not found","documentation_url":"https://docs.github.com/rest/branches/branches#get-a-branch","status":"404"}
```

结论：

- 后端/前端 `release/v2.0.0-rc1` 都存在，但当前已是 `protected:false`，无需再做“降级”
- 后端/前端 `release/v2.0.0-rc2` 均不存在，无需处理

### 3.3 子仓 GA 分支保护

保护策略文件：

```text
/tmp/myems-release-branch-protection.json
```

策略内容：

```json
{
  "required_status_checks": null,
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": false,
  "lock_branch": false,
  "allow_fork_syncing": true
}
```

执行命令：

```bash
gh api --method PUT -H "Accept: application/vnd.github+json" "repos/xcreve/RuoYi-Vue/branches/release%2Fv2.0.0/protection" --input /tmp/myems-release-branch-protection.json
gh api --method PUT -H "Accept: application/vnd.github+json" "repos/xcreve/RuoYi-Vue3/branches/release%2Fv2.0.0/protection" --input /tmp/myems-release-branch-protection.json
```

实际输出摘录：

```json
{"url":"https://api.github.com/repos/xcreve/RuoYi-Vue/branches/release/v2.0.0/protection","required_pull_request_reviews":{"required_approving_review_count":1},"enforce_admins":{"enabled":true},"allow_force_pushes":{"enabled":false},"allow_deletions":{"enabled":false}}
{"url":"https://api.github.com/repos/xcreve/RuoYi-Vue3/branches/release/v2.0.0/protection","required_pull_request_reviews":{"required_approving_review_count":1},"enforce_admins":{"enabled":true},"allow_force_pushes":{"enabled":false},"allow_deletions":{"enabled":false}}
```

回读命令与输出：

```bash
gh api "repos/xcreve/RuoYi-Vue/branches/release%2Fv2.0.0" --jq '{name: .name, protected: .protected, sha: .commit.sha}'
gh api "repos/xcreve/RuoYi-Vue3/branches/release%2Fv2.0.0" --jq '{name: .name, protected: .protected, sha: .commit.sha}'
```

```text
{"name":"release/v2.0.0","protected":true,"sha":"a50852d42027fe9685fe7fd0570fbbf33f34be25"}
{"name":"release/v2.0.0","protected":true,"sha":"bf43df732cb173afa3d29b2171f40ffa9f746768"}
```

## 4. 部署 / 上线

状态：`跳过`

检查命令：

```bash
find docs -maxdepth 2 -type f | sort
```

实际输出：

```text
docs/release_manifest_v2.0.0-rc1.md
docs/release_manifest_v2.0.0-rc2.md
docs/release_manifest_v2.0.0.md
docs/release_notes_v2.0.0-rc1.md
docs/release_notes_v2.0.0.md
docs/uat_report_2026-04-16.md
```

结论：

- `docs/` 下不存在生产 / 预生产切流手册或可执行部署流程
- 仓内虽有 [docker/deploy_guide.md](/Users/xuyongqian/AI%20Code/MyEMS-PV/docker/deploy_guide.md)，但不在 `docs/` 目录内，且未定义生产环境指向 `v2.0.0` 的仓内上线脚本
- 本轮未执行环境部署或切换，结论为：`无仓内部署流程，待人工`

## 5. 留痕产出

状态：`已做`

本次新增 / 修改文件：

- [README.md](/Users/xuyongqian/AI%20Code/MyEMS-PV/README.md)
- [CHANGELOG.md](/Users/xuyongqian/AI%20Code/MyEMS-PV/CHANGELOG.md)
- [DEVELOPER_GUIDE.md](/Users/xuyongqian/AI%20Code/MyEMS-PV/DEVELOPER_GUIDE.md)
- [docs/post_release_checklist_v2.0.0.md](/Users/xuyongqian/AI%20Code/MyEMS-PV/docs/post_release_checklist_v2.0.0.md)

待完成动作：

- 根仓提交：`post-release: v2.0.0 通告与产物归档`
- 推送到 `origin/main`

## 6. 未决项

- 根仓没有 release CI / artifact workflow；如需镜像 digest、二进制下载链接或镜像仓留档，需要先补发布流水线
- 根仓 `docs/` 下没有生产部署文档；生产 / 预生产切换仍需人工按环境流程执行

## 7. 安全扫描

状态：`失败`

补充时间（本地）：`2026-04-19 00:32:45 +0800 (CST)`

检查命令：

```bash
printenv NVD_API_KEY | wc -c
```

实际输出：

```text
0
```

扫描命令：

```bash
mvn -B -DskipTests -Dformat=JSON,HTML dependency-check:aggregate
```

关键输出摘录：

```text
[WARNING] The following dependencies could not be resolved at this point of the build but seem to be part of the reactor:
[WARNING] o com.ruoyi:ruoyi-framework:jar:2.0.0-rc1 (compile)
[WARNING] o com.ruoyi:ruoyi-system:jar:2.0.0-rc1 (compile)
[WARNING] Try running the build up to the lifecycle phase "package"
[INFO] --- dependency-check:12.1.0:aggregate (default-cli) @ ruoyi ---
```

进程定位命令：

```bash
ps -ef | rg "dependency-check:aggregate|org\.codehaus\.plexus\.classworlds\.launcher"
```

实际输出摘录：

```text
501 34099 ... org.codehaus.plexus.classworlds.launcher.Launcher -B -DskipTests -Dformat=JSON,HTML dependency-check:aggregate
```

终止命令：

```bash
kill -9 34099
```

实际输出：

```text
```

报告文件检查：

```bash
find ruoyi-java-myems -path '*/target/*' \( -name 'dependency-check-report*' -o -name 'dependency-check*' \) | sort
```

实际输出：

```text
```

结论：

- 仓内存在现成 OWASP Dependency-Check Maven 配置，但当前环境 `NVD_API_KEY` 未配置
- 本次单次扫描在首次依赖与插件引导阶段耗时过长，未生成 `JSON` / `HTML` 报告文件
- 高 / 中 / 低风险计数：`N/A`
- 报告路径：`N/A`
- README 安全徽章在本轮保持 `OWASP%20DC-pending-lightgrey`，避免伪造通过或发现状态

后续建议：

- 先配置 `NVD_API_KEY`
- 先执行一次 `mvn -DskipTests package` 让 reactor 工件就绪，再重新运行现成的 `dependency-check:aggregate`
