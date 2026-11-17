# Codex 工作须知 — 《长征路上》

> **Codex 唯一指定日常提交分支：`codex/workspace`。**
> 详细规则见 `docs/协作分支规范.md`。任何 Codex 任务开始前先阅读本文件及该文档。

1. 每次先 `git fetch origin`；`git switch codex/workspace`；`git pull --ff-only origin codex/workspace`；`git status --short`，确认没有覆盖他人未提交修改。当前不在 Codex 分支时禁止直接编辑或推送。
2. 所有 Codex **新提交**仅进入 `codex/workspace`。不直接提交 `main`、`claude/design-on-14nodes`、旧 PR 分支，不擅自开启合并/部署。
3. 优先负责 Agent 编排、检索、事实/来源核验、联网安全、回归测试：`src/server.js`、`scripts/eval-retrieval.mjs`、测试文件。修改故事 UI/故事正文等 Claude 主要负责的区域之前先明确接口契约与冲突风险。
4. 对共享文件 `src/data.js`、`src/stories.js`、`src/fujian-stories.js`、`src/page.html`、`test.mjs`、`worker/index.js` 的改动须在报告中列出并说明与 Claude 工作的兼容性；不用直接切到 Claude 分支解决。
5. 不改写已有历史，不 force push/rebase 已发布共享分支，不伪造提交作者，不默认关闭历史 PR。
6. 按任务实际运行 `npm test`、`npm run eval:retrieval`、`npm run build`、`node scripts/validate-artifact.mjs`，清晰区分模拟 Worker、真实 DeepSeek、浏览器和未执行项。
7. 史实和网络来源严格区分：附来源不代表事实已核实；引入或改写史料须说明来源与审核状态。
8. 提交后报告 `codex/workspace` 最新完整 SHA、修改范围、测试证据与剩余风险。提交正文可注明 `Assistant-Lane: codex`（仅限 Codex 实际完成的新提交）。
9. 需要从 Claude 同步代码、改集成流程或申请合并 `main` 时，先向用户说明方案并获得明确同意。

注意：Codex 分支从共同代码快照分出，所以**分流前的 Git 提交历史可能包含 Claude、维护者和其他工具的历史**；从此后 Codex 自己新提交的部分才归类为 Codex 工作。
