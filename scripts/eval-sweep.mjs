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
// 判定：区分接口异常、回答格式或类型不符、无出处和明确降级。存在任何一项则非零退出。
// 处理步骤里出现“核对未通过”“删去未能核对的内容” → 记为首稿未通过（不算失败，但要留意反复出现的题）。
// 自动结果检查入口是否收到带出处 ID 的历史回答，仍需人工核对出处是否支持内容。
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
  // 200 也可能返回 HTML、空响应或 JSON null；统一交给格式判定。
  let data = null; try { data = await res.json(); } catch {}
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
    const steps = Array.isArray(data?.steps) ? data.steps.filter(s => typeof s?.text === 'string').map(s => s.text + (s.detail ? '（' + s.detail + '）' : '')) : [];
    const answer = typeof data?.answer === 'string' ? data.answer.trim() : '';
    const ids = Array.isArray(data?.sources) ? data.sources.flatMap(s => Array.isArray(s?.ids) ? s.ids : [s?.id]).filter(id => typeof id === 'string' && id.trim()) : [];
    // 每条入口题都在问故事或史实。历史回答须有正文和馆内出处。
    const issue = status !== 200 ? '接口异常'
      : typeof data?.error === 'string' && data.error.trim() ? '接口异常'
      : !answer || data?.type !== 'history' ? '格式或类型异常'
      : /现有资料不足以可靠回答|助手回复格式异常|服务暂时不可用/.test(answer) ? '明确降级'
      : !ids.length ? '缺少出处 ID' : '';
    results.push({ ...job, status, ms, answer: answer || (typeof data?.error === 'string' ? data.error : ''), steps, ids, issue,
      firstDraftFailed: steps.some(s => /核对未通过|仍未通过|删去未能核对/.test(s)) });
    process.stdout.write(issue ? '✗' : results.at(-1).firstDraftFailed ? '·' : '✓');
  }
}));
process.stdout.write('\n');

const commit = (() => { try { return execSync('git rev-parse --short HEAD').toString().trim(); } catch { return '未知'; } })();
const date = new Date().toISOString().slice(0, 10);
const cell = s => String(s ?? '').replace(/\|/g, '｜').replace(/\n+/g, ' ');
const failed = results.filter(r => r.issue), drafts = results.filter(r => !r.issue && r.firstDraftFailed);
const counts = ['接口异常', '格式或类型异常', '明确降级', '缺少出处 ID'].map(issue => `${issue} ${failed.filter(r => r.issue === issue).length}`).join('，');
const byQuestion = new Map();
for (const r of results) { const k = r.body.question; const v = byQuestion.get(k) || { ...r, n: 0, bad: 0, draft: 0 }; v.n++; if (r.issue) v.bad++; else if (r.firstDraftFailed) v.draft++; byQuestion.set(k, v); }
const lines = [
  `# 入口问题扫查（${date}，自动运行）`, '',
  `- 被测代码提交：\`${commit}\`；调用方式：${worker ? '本机直接调用服务端代码' : '已部署站点 ' + BASE}；每题 ${ROUNDS} 次；共 ${results.length} 次请求（${jobs.length} 个问题）。`,
  `- 未通过 ${failed.length} 次（${counts}）；首稿未通过、重答后通过 ${drafts.length} 次。`,
  '- 自动结果检查格式、类型和出处 ID 是否齐备。出处是否支持内容仍须人工核对；模型输出有随机性。', '',
  '## 需要留意的题（未通过或首稿未通过）', '',
  '| 来源 | 问题 | 次数 | 未通过 | 首稿未通过 | 最近一次的处理步骤 |', '| --- | --- | --- | --- | --- | --- |',
  ...[...byQuestion.values()].filter(v => v.bad || v.draft).sort((a, b) => b.bad - a.bad || b.draft - a.draft)
    .map(v => `| ${cell(v.group + ' · ' + v.label)} | ${cell(v.body.question)} | ${v.n} | ${v.bad} | ${v.draft} | ${cell(results.filter(r => r.body.question === v.body.question).at(-1).steps.join(' → '))} |`),
  '', '## 全部回答', '',
  '| 来源 | 问题 | 轮次 | 回答 | 出处 ID | HTTP / 耗时 | 自动判定 |', '| --- | --- | --- | --- | --- | --- | --- |',
  ...results.sort((a, b) => jobs.indexOf(jobs.find(j => j.body.question === a.body.question)) - jobs.indexOf(jobs.find(j => j.body.question === b.body.question)) || a.round - b.round)
    .map(r => `| ${cell(r.group + ' · ' + r.label)} | ${cell(r.body.question)} | ${r.round} | ${cell(r.answer)} | ${cell(r.ids.join('、'))} | ${r.status} / ${r.ms} ms | ${r.issue || '通过'} |`),
  '',
];
const out = process.env.EVAL_OUT || `docs/入口问题扫查-${date}.md`;
await writeFile(out, lines.join('\n'));
console.log(`共 ${results.length} 次：未通过 ${failed.length}（${counts}），首稿未通过 ${drafts.length}。结果已写入 ${out}`);
process.exitCode = failed.length ? 1 : 0;
