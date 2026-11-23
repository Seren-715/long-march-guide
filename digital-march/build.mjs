// 构建《数字长征》单文件网页（赛道二 · AI 编程）。
// 用法：
//   node digital-march/build.mjs                    → 生成 digital-march/index.html（完整、可离线打开的单个 HTML）
//   node digital-march/build.mjs --fragment <路径>   → 另外输出不带 <html>/<head>/<body> 外壳的片段（用于 Artifact 托管）
//   node digital-march/build.mjs --check             → 只校验资料与生成结果是否一致，不写文件
// 资料全部来自仓库已有文件：src/data.js、src/stories.js、src/story-guides.js、src/story-trails.js、
// src/map-layout.json、src/assets/longmarch-map.webp，以及本目录 src/facts.js（每条都带资料 ID 和原文片段）。
import { readFile, writeFile } from 'node:fs/promises';
import { nodes } from '../src/data.js';
import { stories } from '../src/stories.js';
import { storyGuides } from '../src/story-guides.js';
import { storyTrails } from '../src/story-trails.js';
import * as facts from './src/facts.js';
import { novel } from './src/novel.js';

const here = (p) => new URL(p, import.meta.url);
const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const fragIdx = args.indexOf('--fragment');
const fragmentPath = fragIdx >= 0 ? args[fragIdx + 1] : null;

// ---------- 1. 资料索引 ----------
const materials = new Map();
for (const n of nodes) {
  materials.set(n.id, { text: n.text, source: n.source, url: n.url, node: n.id });
  for (const e of n.extra || []) materials.set(e.id, { text: e.text, source: e.source, url: e.url, node: n.id });
}
const reviewed = stories.filter((s) => s.reviewed);
for (const s of reviewed) materials.set(s.id, { text: s.text, source: s.source, url: s.url, node: s.node });

const errors = [];
const must = (cond, msg) => { if (!cond) errors.push(msg); };
const textOf = (id) => materials.get(id)?.text;
function checkQuote(ref, quote, where) {
  const t = textOf(ref);
  must(t, `${where}: 找不到资料 ${ref}`);
  if (t) must(t.includes(quote), `${where}: 资料 ${ref} 原文中没有「${quote}」`);
}

// ---------- 2. 逐条核对 facts.js ----------
const usedRefs = new Set();
const use = (r) => { usedRefs.add(r); return r; };
for (const [id, a] of Object.entries(facts.dateAnchors)) {
  must(nodes.some((n) => n.id === id), `dateAnchors: 未知节点 ${id}`);
  checkQuote(use(a.ref), a.quote, `dateAnchors.${id}`);
  if (a.end) { const [y, m, d] = a.end.split('-').map(Number); must(a.quote.includes(`${m} 月 ${d} 日`) || a.quote.includes(`${d} 日`), `dateAnchors.${id}: 结束日 ${a.end} 不在原文片段中`); must(a.end > a.iso && y >= 1934, `dateAnchors.${id}: 结束日有误`); }
}
for (const n of nodes) must(facts.dateAnchors[n.id], `dateAnchors: 节点 ${n.id} 缺少日期锚点`);
for (const s of facts.heroStats) checkQuote(use(s.ref), s.quote, `heroStats.${s.label}`);
for (const a of facts.armies) for (const r of a.refs) checkQuote(use(r.ref), r.quote, `armies.${a.id}`);
for (const e of facts.armyEvents) checkQuote(use(e.ref), e.quote, `armyEvents.${e.label}`);
for (const s of facts.armySizes) checkQuote(use(s.ref), s.quote, `armySizes.${s.place}`);
for (const r of facts.armySizeCaveat.refs) checkQuote(use(r.ref), r.quote, 'armySizeCaveat');
for (const m of facts.meetings) { checkQuote(use(m.ref), m.decision, `meetings.${m.name}`); must(nodes.some((n) => n.id === m.node), `meetings.${m.name}: 未知节点 ${m.node}`); }
for (const c of facts.chishuiSteps) checkQuote(use(c.ref), c.text, `chishuiSteps.${c.title}`);
for (const c of facts.numberCards) { checkQuote(use(c.ref), c.text, `numberCards.${c.label}`); must(c.text.includes(c.n), `numberCards.${c.label}: 原文片段里没有数字 ${c.n}`); }
for (const q of facts.numberQuestions) {
  checkQuote(use(q.ref), q.quote, `numberQuestions.${q.q}`);
  must(q.quote.includes(q.answer.replace(/^约/, '')) || q.quote.includes(q.answer), `numberQuestions.${q.q}: 答案「${q.answer}」不在原文片段中`);
  must(q.options.includes(q.answer) && new Set(q.options).size === q.options.length, `numberQuestions.${q.q}: 选项有误`);
}
for (const c of facts.closingQuotes) checkQuote(use(c.ref), c.quote, 'closingQuotes');
use('jiangtaibao_spirit'); use('wuqi_distance_method'); use('jiangtaibao_meaning');

// ---------- 2b. 互动小说《我的长征》：数字与引语必须出自所引资料 ----------
const nodeIds = new Set(nodes.map((n) => n.id));
function checkPassage(ps, where) {
  if (!ps || typeof ps.t !== 'string') { errors.push(`${where}: 段落格式有误`); return; }
  const quotes = [...ps.t.matchAll(/“([^”]+)”/g)].map((m) => m[1]);
  if (ps.frame) {
    must(!/\d/.test(ps.t), `${where}: 过渡句不能含数字「${ps.t}」`);
    must(!quotes.length && !/[“”「」]/.test(ps.t), `${where}: 过渡句不能含引号「${ps.t}」`);
    return;
  }
  must(Array.isArray(ps.src) && ps.src.length, `${where}: 缺少出处「${ps.t.slice(0, 20)}」`);
  const srcText = (ps.src || []).map((id) => { must(materials.has(id), `${where}: 未知资料 ${id}`); usedRefs.add(id); return textOf(id) || ''; }).join('\n');
  for (const num of ps.t.match(/\d+(?:\.\d+)?/g) || []) must(srcText.includes(num), `${where}: 数字 ${num} 不在所引资料原文中「${ps.t.slice(0, 30)}」`);
  for (const q of quotes) must(srcText.includes(q), `${where}: 引语「${q}」不在所引资料原文中`);
}
novel.prologue.forEach((ps, i) => checkPassage(ps, `novel.prologue[${i}]`));
const sceneIds = new Set();
for (const sc of novel.scenes) {
  const w = `novel.${sc.id}`;
  must(!sceneIds.has(sc.id), `${w}: 场景 ID 重复`); sceneIds.add(sc.id);
  must(nodeIds.has(sc.node), `${w}: 未知节点 ${sc.node}`);
  must(sc.choices?.length >= 2, `${w}: 至少要有 2 个选项`);
  for (const k of ['intro', 'outro']) (sc[k] || []).forEach((ps, i) => checkPassage(ps, `${w}.${k}[${i}]`));
  sc.choices.forEach((c, i) => { must(c.label && c.body?.length, `${w}.choices[${i}]: 选项缺少内容`); c.body.forEach((ps, j) => checkPassage(ps, `${w}.choices[${i}].body[${j}]`)); });
  if (sc.mini) {
    for (const k of ['before', 'after']) if (sc.mini[k]) checkPassage(sc.mini[k], `${w}.mini.${k}`);
    (sc.mini.steps || []).forEach((ps, i) => checkPassage(ps, `${w}.mini.steps[${i}]`));
    must(['bridge', 'chishui', 'bugle', 'chains', 'climb', 'tussock'].includes(sc.mini.type), `${w}: 未知小游戏 ${sc.mini.type}`);
  }
  if (sc.troops) must([...materials.values()].some((m) => m.text.includes(sc.troops.replace(/^约 /, ''))), `${w}: 队伍人数「${sc.troops}」在资料中找不到`);
}

// ---------- 3. 地图 ----------
const layout = JSON.parse(await readFile(here('../src/map-layout.json'), 'utf8'));
const mapB64 = (await readFile(here('../src/assets/longmarch-map.webp'))).toString('base64');
const pointByNode = Object.fromEntries(layout.points.map((p) => [p.node, p]));
const mainOrder = layout.points.map((p) => p.node);              // 地图上的 23 站（中央红军主力路线）
const codaOrder = nodes.map((n) => n.id).filter((id) => !mainOrder.includes(id)); // 直罗镇、会宁、将台堡
const nearestRouteIndex = (pt) => {
  let best = 0, bd = Infinity;
  layout.route.forEach((p, i) => { const d = (p[0] - pt[0]) ** 2 + (p[1] - pt[1]) ** 2; if (d < bd) { bd = d; best = i; } });
  return best;
};
const routeIndex = Object.fromEntries(mainOrder.map((id) => [id, nearestRouteIndex(layout.nodes[id])]));

// ---------- 4. 人物（data.js 中 *_person_* 资料）与他们在哪些站的资料里出现 ----------
const persons = [];
for (const n of nodes) for (const e of n.extra || []) {
  if (!e.id.includes('_person_')) continue;
  const display = e.text.split('，')[0];
  const key = display.split('（')[0];
  persons.push({ id: e.id, name: display, key, home: n.id, text: e.text, source: e.source, url: e.url });
}
for (const p of persons) {
  const mentions = [];
  for (const n of nodes) {
    const hits = [n, ...(n.extra || [])].filter((m) => m.id !== p.id && m.text.includes(p.key)).map((m) => m.id);
    if (hits.length || n.id === p.home) mentions.push({ node: n.id, refs: hits });
  }
  p.mentions = mentions;
  p.stories = reviewed.filter((s) => (s.title + s.text).includes(p.key)).map((s) => s.id);
}

// ---------- 5. 故事与专题 ----------
const storyById = Object.fromEntries(reviewed.map((s) => [s.id, s]));
const guides = storyGuides.filter((g) => (g.story ? storyById[g.story] : g.parts)).map((g) => ({
  id: g.id, cat: g.cat, tag: g.tag, hook: g.hook, story: g.story || null,
  title: g.title || storyById[g.story]?.title, node: g.node || storyById[g.story]?.node, date: g.date || storyById[g.story]?.date,
  parts: g.parts ? g.parts.map((p) => ({ label: p.label, date: p.date, text: p.text, sources: p.sources })) : null,
}));
for (const g of guides) for (const p of g.parts || []) for (const s of p.sources) { must(materials.has(s), `guide ${g.id}: 未知资料 ${s}`); usedRefs.add(s); }
const guidedStories = new Set(guides.map((g) => g.story).filter(Boolean));
for (const s of reviewed) if (!guidedStories.has(s.id)) guides.push({ id: 'solo_' + s.id, cat: '专题资料', tag: '资料辨析', hook: s.title, story: s.id, title: s.title, node: s.node, date: s.date, parts: null });
const trails = storyTrails.map((t) => ({ id: t.id, title: t.title, blurb: t.blurb, items: t.items.filter((id) => guides.some((g) => g.id === id)) }));

if (errors.length) { console.error('资料核对失败：\n- ' + errors.join('\n- ')); process.exit(1); }

// ---------- 6. 数据包 ----------
const refs = {};
for (const r of usedRefs) { const m = materials.get(r); refs[r] = { text: m.text, source: m.source, url: m.url, node: m.node }; }
const payload = {
  nodes: nodes.map((n) => ({ id: n.id, name: n.name, pname: pointByNode[n.id]?.name || n.name, date: n.date, title: n.title, text: n.text, source: n.source, url: n.url,
    at: layout.nodes[n.id], extra: (n.extra || []).map((e) => ({ id: e.id, text: e.text, source: e.source, url: e.url })) })),
  mainOrder, codaOrder, routeIndex,
  map: { w: layout.width, h: layout.height, route: layout.route, labels: layout.labels, img: 'data:image/webp;base64,' + mapB64 },
  stories: reviewed.map((s) => ({ id: s.id, title: s.title, node: s.node, date: s.date, text: s.text, note: s.note || '', source: s.source, url: s.url, more: (s.more || []).filter((m) => m && m.url) })),
  guides, trails, persons, refs, novel,
  facts: { dateAnchors: facts.dateAnchors, heroStats: facts.heroStats, armies: facts.armies, armyEvents: facts.armyEvents, armySizes: facts.armySizes, armySizeCaveat: facts.armySizeCaveat,
    meetings: facts.meetings, chishuiSteps: facts.chishuiSteps, numberCards: facts.numberCards, numberQuestions: facts.numberQuestions, closingQuotes: facts.closingQuotes },
  counts: { nodes: nodes.length, materials: nodes.reduce((s, n) => s + 1 + (n.extra || []).length, 0), stories: reviewed.length, persons: persons.length },
};
const json = JSON.stringify(payload).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');

// ---------- 7. 拼装 ----------
const [shell, css, app0, novelUi] = await Promise.all([readFile(here('src/shell.html'), 'utf8'), readFile(here('src/style.css'), 'utf8'), readFile(here('src/app.js'), 'utf8'), readFile(here('src/novel-ui.js'), 'utf8')]);
const app = app0.replace('/*NOVEL_UI*/', () => novelUi);
if (app === app0) throw new Error('app.js 缺少 /*NOVEL_UI*/ 标记');
const fill = (s) => s.replace('/*STYLE*/', () => css).replace('/*DATA*/', () => json).replace('/*APP*/', () => app);
const head = fill(shell.split('<!--HEAD-->')[1].split('<!--/HEAD-->')[0]).trim();
const body = fill(shell.split('<!--BODY-->')[1].split('<!--/BODY-->')[0]).trim();
const full = `<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}</style>\n${head}\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
const fragment = `${head}\n${body}\n`;

const outUrl = here('index.html');
if (checkOnly) {
  const current = await readFile(outUrl, 'utf8').catch(() => '');
  if (current !== full) { console.error('digital-march/index.html 与源文件不一致，请运行 npm run build:march'); process.exit(1); }
  console.log(`资料核对通过；digital-march/index.html 与源文件一致（${(Buffer.byteLength(full) / 1024).toFixed(0)} KB）`);
} else {
  await writeFile(outUrl, full);
  if (fragmentPath) await writeFile(fragmentPath, fragment);
  console.log(`已生成 digital-march/index.html（${(Buffer.byteLength(full) / 1024).toFixed(0)} KB，${payload.counts.nodes} 个节点，${payload.stories.length} 篇故事，${persons.length} 位人物，${usedRefs.size} 条资料引用，互动小说 ${novel.scenes.length} 幕）` + (fragmentPath ? `；片段：${fragmentPath}` : ''));
}
