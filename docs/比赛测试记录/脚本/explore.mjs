// 探索测试：多方面真实模型用例。node explore.mjs <cases.json> <out.json>
import { randomUUID, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
const worker = (await import(process.env.WORKER_PATH||new URL('../../../worker/index.js',import.meta.url).href)).default;
const env = { DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY, HISTORY_SIGNING_KEY: randomBytes(32).toString('hex') };
const cases = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const results = [];
const post = (path, body, raw) => worker.fetch(new Request('http://localhost' + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: raw ?? JSON.stringify(body) }), env);
async function runCase(c) {
  const sessionId = randomUUID(); const hist = []; const turns = [];
  for (const t of c.turns) {
    const started = Date.now();
    let status, d = {};
    if (c.plan) { const r = await post('/api/plan', t.body); status = r.status; try { d = await r.json(); } catch {} }
    else {
      const tokens = t.web ? hist.slice(0, -1).slice(-5) : hist.slice(-5);
      const body = { sessionId, question: t.q, node: c.node || 'start', ...(c.free !== false ? { free: true } : {}), ...(c.story ? { story: c.story } : {}), historyTokens: tokens, web: t.web ? 'only' : (c.web === 'off' ? undefined : 'auto') };
      const r = await post('/api/chat', body); status = r.status; try { d = await r.json(); } catch {}
      if (!t.web && d.historyToken) hist.push(d.historyToken);
    }
    const ids = (d.sources || []).flatMap(s => s.ids || [s.id]);
    const steps = (d.steps || []).map(s => s.text + (s.detail ? '（' + s.detail + '）' : ''));
    const answer = d.answer || d.error || (d.route ? JSON.stringify(d.route.map(x => x.id || x)) + ' ' + (d.intro || d.summary || '') : '');
    const checks = [];
    if (t.expect) {
      const e = t.expect;
      if (e.status && status !== e.status) checks.push(`状态码 ${status}≠${e.status}`);
      if (e.type && d.type !== e.type) checks.push(`type ${d.type}≠${e.type}`);
      if (e.cites && !e.cites.some(id => ids.includes(id))) checks.push(`未引用 ${e.cites.join('/')}`);
      if (e.has && !new RegExp(e.has).test(answer)) checks.push(`缺少 /${e.has}/`);
      if (e.not && new RegExp(e.not).test(answer)) checks.push(`出现 /${e.not}/`);
      if (e.noSources && ids.length) checks.push('不应有馆内出处');
      if (e.web && !(d.web?.sources?.length)) checks.push('没有网页来源');
    }
    turns.push({ q: t.q || JSON.stringify(t.body), status, type: d.type, answer, ids, srcs: (d.sources || []).map(s => ({ title: s.title, url: s.url, ids: s.ids || [s.id] })), followups: d.followups || [], reason: d.reason, route: d.route, web: (d.web?.sources || []).map(s => s.title + ' ' + s.url), steps, ms: Date.now() - started, checks, redo: steps.some(s => /核对未通过|删去未能核对/.test(s)) });
  }
  return { id: c.id, cat: c.cat, note: c.note, turns };
}
const queue = [...cases]; const conc = Number(process.env.CONC || 4);
await Promise.all(Array.from({ length: conc }, async () => { while (queue.length) { const c = queue.shift(); try { results.push(await runCase(c)); } catch (e) { results.push({ id: c.id, cat: c.cat, error: String(e) }); } process.stdout.write('.'); } }));
results.sort((a, b) => cases.findIndex(c => c.id === a.id) - cases.findIndex(c => c.id === b.id));
writeFileSync(process.argv[3], JSON.stringify(results, null, 1));
const fails = results.flatMap(r => (r.turns || []).filter(t => t.checks.length).map(t => r.id + ' ' + t.checks.join('；')));
console.log('\n用例', results.length, '自动判定未过', fails.length); for (const f of fails) console.log(' -', f);
