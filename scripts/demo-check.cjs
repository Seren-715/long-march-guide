// 演示流程实测：按《演示录屏脚本》的顺序在真实页面上点击、提问，每轮用新的浏览器会话。
// 用法（需要已安装 Playwright 和 Chromium；站点要能真实调用模型）：
//   DEMO_BASE=http://127.0.0.1:4173 DEMO_RUNS=3 DEMO_OUT=/某个工作区外的目录/demo.json node scripts/demo-check.cjs
// 只读页面，不改任何数据；输出每一步实际发出的问题、耗时、类型、出处 ID、页面操作和完整回答。
// 不记录请求头、密钥或签名令牌。自动结果只说明“得到了带出处的回答”，史实仍需人工对照原文。
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = (process.env.DEMO_BASE || 'http://127.0.0.1:4173').replace(/\/+$/, '');
const RUNS = Number(process.env.DEMO_RUNS || 3);
const OUT = process.env.DEMO_OUT || '';

async function run(browser, n) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage(); const errors = []; const log = []; let pending = null;
  p.on('pageerror', e => errors.push(e.message));
  // 转发请求并记下完整响应（流式响应在这里会被整段转交给页面）
  await p.route('**/api/chat', async route => {
    const t0 = Date.now(); const req = JSON.parse(route.request().postData() || '{}');
    try { const resp = await route.fetch({ timeout: 120000 }); const txt = await resp.text(); if (pending) pending({ req, ms: Date.now() - t0, txt }); await route.fulfill({ response: resp, body: txt }); }
    catch (e) { if (pending) pending({ req, ms: Date.now() - t0, txt: '', err: e.message }); await route.abort(); }
  });
  const call = async (label, trigger) => {
    const got = new Promise(res => { pending = res; }); await trigger();
    let timer; const g = await Promise.race([got, new Promise(res => { timer = setTimeout(() => res(null), 130000); })]); clearTimeout(timer); pending = null;
    if (!g) { log.push({ label, error: '超时' }); return; }
    let done = null;
    for (const line of g.txt.split('\n')) { try { const o = JSON.parse(line); if (o.done) done = o.done; else if (o.answer) done = o; if (o.error) done = { error: o.error }; } catch {} }
    await p.waitForTimeout(800);
    log.push({ label, sent: g.req.question, ms: g.ms, type: done?.type, answer: done?.answer || done?.error || g.err,
      sources: (done?.sources || []).map(s => ({ title: s.title, ids: s.ids || [s.id] })),
      steps: (done?.steps || []).map(s => s.text + (s.detail ? ' · ' + s.detail : '')), action: done?.action || null });
  };
  await p.goto(BASE + '/#stories'); await p.waitForTimeout(1500);
  await p.click('.story-list .story-next:has-text("四渡赤水")'); await p.waitForTimeout(1200);
  for (let i = 0; i < 10; i++) { const c = await p.$('.story-cont'); if (!c) break; await c.click(); await p.waitForTimeout(350); }
  const onward = await p.$eval('.onward', e => e.innerText.replace(/\n+/g, ' | ')).catch(() => null);
  await call('故事页·在这里问小征', () => p.click('.story-ask button:has-text("苟坝会议为什么决定不打打鼓新场")'));
  await call('追问·具体点呢', async () => { await p.fill('#question', '具体点呢'); await p.keyboard.press('Enter'); });
  await p.click('#go-home'); await p.waitForTimeout(1200); await p.click('#try-claim'); await p.waitForTimeout(500);
  await call('核对一句话·林彪', () => p.click('#claims-list button:has-text("林彪亲自带头冲过了泸定桥")'));
  await call('页面操作·带我去', async () => { await p.fill('#question', '带我去飞夺泸定桥那一站'); await p.keyboard.press('Enter'); });
  const where = await p.evaluate(() => location.hash);
  await p.click('#go-home'); await p.waitForTimeout(1200); await p.click('#start-fujian'); await p.waitForTimeout(1200);
  await call('八闽专题·福建人数', async () => { await p.fill('#question', '福建籍参加长征的红军有多少？不同资料为什么数字不同？'); await p.keyboard.press('Enter'); });
  await p.click('#go-home'); await p.waitForTimeout(1200); await p.click('#try-claim'); await p.waitForTimeout(500);
  await call('核对一句话·宁化', () => p.click('#claims-list button:has-text("宁化的1300名妇女")'));
  await ctx.close();
  return { run: n, onward, where, errors, log };
}

(async () => {
  const browser = await chromium.launch(); const all = [];
  for (let n = 1; n <= RUNS; n++) all.push(await run(browser, n));
  await browser.close();
  if (OUT) fs.writeFileSync(OUT, JSON.stringify({ base: BASE, at: new Date().toISOString(), runs: all }, null, 1));
  let bad = 0;
  for (const a of all) {
    console.log(`== 第 ${a.run} 轮 · 继续前行：${a.onward || '（没找到）'} · 带我去之后：${a.where} · 页面报错：${a.errors.join('|') || '无'}`);
    if (a.errors.length || a.where !== '#luding' || !a.onward) bad++;
    for (const l of a.log) {
      const ids = (l.sources || []).flatMap(s => s.ids).join('、');
      console.log(` - ${l.label} · ${l.ms ?? '-'}ms · ${l.type || l.error} · 出处：${ids || '无'}`);
      if (l.error || !ids || /资料不足|未能核对/.test(l.answer || '')) bad++;
    }
  }
  console.log(bad ? `有 ${bad} 处需要人工查看` : '全部步骤得到带出处的回答');
  process.exitCode = bad ? 1 : 0;
})();
