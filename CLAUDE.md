# Claude 项目工作守则 — 《长征路上》

> **当前唯一指定日常提交分支：`claude/design-on-14nodes`。**
> 本文件和 `docs/协作分支规范.md` 是本仓库的长期协作规则。每次动手前先阅读并执行。

1. 开始工作前执行 `git fetch origin`、`git switch claude/design-on-14nodes`、`git pull --ff-only origin claude/design-on-14nodes`，并查看 `git status --short`。未能确认分支正确时，不要写入或推送。
2. Claude 的**后续代码与文档提交**只能到 `claude/design-on-14nodes`。不得直接改 `main`、`codex/workspace`，也不得默认写入既有 PR #1/#2 分支。
3. 优先负责故事和阅读体验、`src/page.html`、`src/story-guides.js`、`src/story-long.js`、内容审核与 UI；修改 `src/server.js`、`test.mjs` 等共享文件时先说明接口与冲突风险。
4. 不许擅自合并、rebase/force push 公开共享分支、关闭 PR、发布网站或改动他人分支；如需同步 Codex 工作，先向用户报告差异并征得同意。
5. 故事正文必须有可靠出处；资料未确认的内容不得设为已审核。AI 只能有据讲述，不能增加人物对白、心理或情节。
6. 提交前运行适当的构建和回归（至少按变更范围运行 `npm test`、`npm run eval:retrieval`、`npm run build`）。明确区分已执行的测试与未执行的测试。
7. 提交后报告分支、完整 HEAD SHA、文件改动、验证结果和残余风险。提交正文可注明 `Assistant-Lane: claude`（仅标记真正由 Claude 进行的未来提交）。
8. 当用户要求与 Codex 协作，先阅读 `docs/协作分支规范.md`；接口变更需先书面记录，不直接触碰 Codex 分支。

当前 Claude 分支包含分流前共享的既有历史；分支名不是历史提交作者的身份证明。
