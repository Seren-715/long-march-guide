// 入口问题扫查：把访客最常点到的问题全部问一遍，看有没有降级或反复重答。
// 覆盖：首页的入门问题（src/starter-prompts.js）+ 每个故事读完后“在这里问小征”的问题（src/story-guides.js 的 whys）。
// 只调用 /api/chat，问法与页面一致：入门问题按首页直接提问（free），故事问题带上故事 ID（story）。
//
// 用法（本机直接调用服务端代码，需要 DeepSeek 密钥；与 npm run eval 相同）：
//   DEEPSEEK_API_KEY=... node scripts/eval-sweep.mjs
// 测试已部署的站点：EVAL_BASE_URL=https://你的站点 node scripts/eval-sweep.mjs
// 其他可选环境变量：
//   EVAL_OUT=路径        结果文档路径，默认 docs/入口问题扫查-<日期>.md（日常复测建议写到工作区外）
//   SWEEP_ROUNDS=2       每题问几次（默认 1）；模型有随机性，多问几次更能看出不稳定的题
//   SWEEP_CONCURRENCY=4  同时发出的请求数（默认 4）
//
// 判定：回答是“现有资料不足以可靠回答……”或接口报错 → 降级（进程以非零退出）；
// 处理步骤里出现“核对未通过”“删去未能核对的内容” → 记为首稿未通过（不算失败，但要留意反复出现的题）。
// 自动结果只反映“有没有得到带出处的回答”，史实是否准确仍需人工对照原文。
import { writeFile } from 'node:fs/promises';
import { randomUUID, randomBytes } from 'node:crypto';
import { execSync } from 'node:child_process';

const BASE = (process.env.EVAL_BASE_URL || '').replace(/\/+$/, '');
const ROUNDS = Math.max(1, Number(process.env.SWEEP_ROUNDS || 1));
const CONCURRENCY = Math.max(1, Number(process.env.SWEEP_CONCURRENCY || 4));

let worker = null, env = null;
if (!BASE) {
  if (!process.env.DEEPSEEK_API_KEY) { console.error('缺少 DEEPSEEK_API_KEY。本机模式需要密钥；或设置 EVAL_BASE_URL 测试已部署站点。'); process.exit(2); }
  execSync('node scripts/generate.mjs', { stdio: 'ignore' });
  worker = (await import('../worker/index.js')).default;
  env = {
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    HISTORY_SIGNING_KEY: process.env.HISTORY_SIGNING_KEY || randomBytes(32).toString('hex'),
    ...(process.env.DEEPSEEK_MODEL ? { DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL } : {}),
  };
}
const { starterQuestions } = await import('../src/starter-prompts.js');
const { storyGuides } = await import('../src/story-guides.js');
const { stories } = await import('../src/stories.js');
const { nodes } = await import('../src/data.js');

async function ask(body) {
  const started = Date.now(); let res;
  const payload = JSON.stringify({ sessionId: randomUUID(), ...body });
  try {
    res = worker
      ? await worker.fetch(new Request('http://localhost/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: payload }), env)
      : await fetch(BASE + '/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: payload });
  } catch (e) { return { status: 0, data: { error: e.message }, ms: Date.now() - started }; }
  let data = {}; try { data = await res.json(); } catch {}
  return { status: res.status, data, ms: Date.now() - started };
}

// 和页面一致：故事题的节点取故事所在节点（取不到就用中央苏区），并带上故事 ID
const jobs = [];
for (const s of starterQuestions) jobs.push({ group: '首页入门问题', label: s.label, body: { question: s.q, node: 'start', free: true } });
for (const g of storyGuides) {
  const story = g.story ? stories.find(x => x.id === g.story) : null;
  const node = story && nodes.some(n => n.id === story.node) ? story.node : 'start';
  for (const q of g.whys || []) jobs.push({ group: '故事后的问题', label: g.id, body: { question: q, node, story: g.id } });
}

const results = [];
const queue = [];
for (let r = 1; r <= ROUNDS; r++) for (const job of jobs) queue.push({ ...job, round: r });
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (queue.length) {
    const job = queue.shift();
    const { status, data, ms } = await ask(job.body);
    const steps = (data.steps || []).map(s => s.text + (s.detail ? '（' + s.detail + '）' : ''));
    const answer = data.answer || data.error || '';
    results.push({ ...job, status, ms, type: data.type, answer, steps,
      ids: (data.sources || []).flatMap(s => s.ids || [s.id]),
      degraded: status !== 200 || /现有资料不足以可靠回答|助手回复格式异常|服务暂时不可用/.test(answer),
      firstDraftFailed: steps.some(s => /核对未通过|仍未通过|删去未能核对/.test(s)) });
    process.stdout.write(results.at(-1).degraded ? '✗' : results.at(-1).firstDraftFailed ? '·' : '✓');
  }
}));
process.stdout.write('\n');

const commit = (() => { try { return execSync('git rev-parse --short HEAD').toString().trim(); } catch { return '未知'; } })();
const date = new Date().toISOString().slice(0, 10);
const cell = s => String(s ?? '').replace(/\|/g, '｜').replace(/\n+/g, ' ');
const degraded = results.filter(r => r.degraded), drafts = results.filter(r => !r.degraded && r.firstDraftFailed);
const byQuestion = new Map();
for (const r of results) { const k = r.body.question; const v = byQuestion.get(k) || { ...r, n: 0, bad: 0, draft: 0 }; v.n++; if (r.degraded) v.bad++; else if (r.firstDraftFailed) v.draft++; byQuestion.set(k, v); }
const lines = [
  `# 入口问题扫查（${date}，自动运行）`, '',
  `- 被测代码提交：\`${commit}\`；调用方式：${worker ? '本机直接调用服务端代码' : '已部署站点 ' + BASE}；每题 ${ROUNDS} 次；共 ${results.length} 次请求（${jobs.length} 个问题）。`,
  `- 降级 ${degraded.length} 次；首稿未通过、重答后通过 ${drafts.length} 次。降级指回答为“现有资料不足以可靠回答”或接口报错。`,
  '- 自动结果只说明有没有得到带出处的回答，**不能替代人工核对**；模型输出有随机性。', '',
  '## 需要留意的题（有降级或首稿未通过）', '',
  '| 来源 | 问题 | 次数 | 降级 | 首稿未通过 | 最近一次的处理步骤 |', '| --- | --- | --- | --- | --- | --- |',
  ...[...byQuestion.values()].filter(v => v.bad || v.draft).sort((a, b) => b.bad - a.bad || b.draft - a.draft)
    .map(v => `| ${cell(v.group + ' · ' + v.label)} | ${cell(v.body.question)} | ${v.n} | ${v.bad} | ${v.draft} | ${cell(results.filter(r => r.body.question === v.body.question).at(-1).steps.join(' → '))} |`),
  '', '## 全部回答', '',
  '| 来源 | 问题 | 轮次 | 回答 | 出处 ID | HTTP / 耗时 |', '| --- | --- | --- | --- | --- | --- |',
  ...results.sort((a, b) => jobs.indexOf(jobs.find(j => j.body.question === a.body.question)) - jobs.indexOf(jobs.find(j => j.body.question === b.body.question)) || a.round - b.round)
    .map(r => `| ${cell(r.group + ' · ' + r.label)} | ${cell(r.body.question)} | ${r.round} | ${cell(r.answer)} | ${cell(r.ids.join('、'))} | ${r.status} / ${r.ms} ms |`),
  '',
];
const out = process.env.EVAL_OUT || `docs/入口问题扫查-${date}.md`;
await writeFile(out, lines.join('\n'));
console.log(`共 ${results.length} 次：降级 ${degraded.length}，首稿未通过 ${drafts.length}。结果已写入 ${out}`);
process.exitCode = degraded.length ? 1 : 0;
