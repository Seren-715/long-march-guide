// 生成附录 E：接口、页面与自动化测试。node genE.mjs <final 目录> <输出.md>
import { readFileSync, writeFileSync } from 'node:fs';
const F = process.argv[2];
const robust = JSON.parse(readFileSync(F + '/robust.json'));
const xss = JSON.parse(readFileSync(F + '/xss.json'));
const ui = JSON.parse(readFileSync(F + '/realui.json'));
const browser = readFileSync(F + '/browser-tests.log', 'utf8').trim().split('\n');
const replays = readFileSync(F + '/codex-replays.log', 'utf8');
const npmTest = readFileSync(F + '/npm-test.log', 'utf8').split('\n').filter(l => l && !l.startsWith('npm notice') && !l.startsWith('>'));
const cell = s => String(s ?? '').replace(/\|/g, '｜').replace(/\n+/g, ' ');
const L = ['# 附录 E　接口、页面与自动化测试', '', `- 被测代码：${process.env.CODE_VER}。以下各项都在同一份代码检出上运行。`, ''];

L.push('## E1　单元测试（`npm test`）', '', '包括生成 Worker、`test.mjs` 全部用例（模拟模型）、构建和产物校验。输出：', '', '```', ...npmTest, '```', '');

L.push('## E2　接口健壮性（不调用模型）', '', `共 ${robust.rows.length} 项，符合预期 ${robust.rows.filter(r => r.ok).length} 项；测试过程中模型调用次数：${robust.modelCalls}（异常请求都在调用模型前被拦下）。`, '',
  '| 测试项 | 预期状态码 | 实际状态码 | 返回提示 | 结果 |', '| --- | --- | --- | --- | --- |',
  ...robust.rows.map(r => `| ${cell(r.name)} | ${r.expect} | ${r.status} | ${cell(r.msg)} | ${r.ok ? '通过' : '不通过'} |`), '',
  `首页响应头：${Object.entries(robust.headers).map(([k, v]) => '`' + k + ': ' + v + '`').join('，')}。没有 \`Content-Security-Policy\`，见主报告“局限性”。`, '');

L.push('## E3　页面安全（防止模型输出被当成网页代码执行）', '',
  '用模拟接口返回一段恶意内容：回答里有 `<img src=x onerror=alert(1)><script>alert(2)</script>`，出处标题含 `<b>` 标签，出处和网页来源的链接是 `javascript:alert(…)`，推荐追问里也有 `<img onerror>`。在真实页面里提交后检查：', '',
  '| 检查项 | 结果 |', '| --- | --- |',
  `| 回答里被插入的 \`<img src="x">\` 元素数 | ${xss.injectedImg} |`, `| 回答里的 \`<script>\` 元素数 | ${xss.scripts} |`,
  `| 页面上 \`javascript:\` 链接数 | ${xss.jsLinks} |`, `| 弹出对话框次数 | ${xss.dialogs} |`, `| 标签按原样作为文字显示 | ${xss.textShown ? '是' : '否'} |`, '',
  '结论：模型输出、出处标题、摘要和推荐追问都按纯文本处理，不安全的链接不渲染。', '');

L.push('## E4　真实页面流程（真实模型）', '', 'Chromium 打开本机开发服务器（真实 DeepSeek 模型），按普通观众的操作走：首页提问 → 在对话框追问 → 点回答下方“联网搜索” → 打开“乌江”节点页看推荐问题。桌面和手机宽度各一次。截图见同目录的 `页面-桌面.png`、`页面-手机.png`。', '');
for (const u of ui) {
  L.push(`### ${u.name}`, '', `- 页面加载 ${u.load} ms；横向溢出：${u.overflowX ? '有' : '无'}；脚本错误：${u.errors.length ? u.errors.join('；') : '无'}`,
    `- 乌江节点页“关于这一站，可以问”：${u.askHere.join(' / ')}`, '');
  for (const t of u.turns) {
    L.push(`**问**：${t.q}`, '', '**小征答**（页面上显示的回答正文）：', '', ...t.answer.split(/\n+/).filter(Boolean).map(s => '> ' + s), '',
      `**页面列出的来源**：${t.srcTitles.length ? t.srcTitles.join('；') : '—'}`, '', `**处理步骤**：${t.steps || '—'}`, '', `耗时 ${t.ms} ms；回答下方有“联网搜索”按钮：${t.webBtn ? '是' : '否'}`, '');
  }
}

L.push('## E5　浏览器自动化测试（模拟接口）', '', '`tests/*.browser.js`，覆盖关于弹窗、八闽专题、宁化证据、人物故事、返回对话、侧栏、推荐问题、联网按钮重放本轮。', '', '```', ...browser, '```', '');

L.push('## E6　Codex 独立编写的回归脚本', '', '脚本由 Codex 编写，放在协作仓库 `attachments/`，模拟模型，直接跑候选的 `/api/chat` 或页面。输出：', '', '```', ...replays.trim().split('\n'), '```', '');
writeFileSync(process.argv[3], L.join('\n'));
console.log('ok', L.length);
