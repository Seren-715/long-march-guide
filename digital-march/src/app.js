// 《数字长征》页面脚本。数据由 build.mjs 注入到 window.__MARCH__，页面本身不联网、不调用模型。
(() => {
'use strict';
const D = window.__MARCH__;
const F = D.facts;
document.documentElement.lang = 'zh-CN';

// ---------- 工具 ----------
const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.append(e); return e; };
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isNarrow = () => innerWidth <= 820;
const store = {
  get(k, d) { try { const v = localStorage.getItem('digital-march:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('digital-march:' + k, JSON.stringify(v)); } catch { /* 本地存储不可用时只在本页有效 */ } },
};
const state = { visited: new Set(store.get('visited', [])), read: new Set(store.get('read', [])), best: store.get('best', null), vn: store.get('vn', { at: 0, done: false, picks: {} }) };
const saveState = () => { store.set('visited', [...state.visited]); store.set('read', [...state.read]); store.set('best', state.best); store.set('vn', state.vn); updatePassport(); };
const nodeById = Object.fromEntries(D.nodes.map((n) => [n.id, n]));
const storyById = Object.fromEntries(D.stories.map((s) => [s.id, s]));
const guideById = Object.fromEntries(D.guides.map((g) => [g.id, g]));
const ALL = [...D.mainOrder, ...D.codaOrder];
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, n) => shuffle(a).slice(0, n);
const DAY0 = Date.UTC(1934, 9, 10);
const daysFrom = (iso) => { const [y, m, d] = iso.split('-').map(Number); return d ? Math.round((Date.UTC(y, m - 1, d) - DAY0) / 864e5) : null; };
const tapeDate = (iso) => iso.split('-').join('·');
const ymText = (ym) => { const [y, m] = ym.split('-').map(Number); return `${y} 年 ${m} 月`; };

function srcLink(source, url, prefix = '出处：') {
  const a = el('a', 'src', prefix + source); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a;
}
function refBtn(id, label = '源') {
  const r = D.refs[id]; const b = el('button', 'ref', label); b.type = 'button';
  b.setAttribute('aria-label', '查看原文：' + (r ? r.source : id)); b.title = r ? r.source : '';
  b.addEventListener('click', (e) => { e.stopPropagation(); openRef(id); });
  return b;
}
function paragraphs(text, size = 130) {
  const sents = text.match(/[^。！？]+[。！？]+[”」’]?|[^。！？]+$/g) || [text];
  const out = []; let cur = '';
  for (const s of sents) { if (cur && (cur + s).length > size) { out.push(cur); cur = ''; } cur += s; }
  if (cur) out.push(cur);
  return out;
}

// ---------- 主题切换 ----------
(() => {
  const saved = store.get('theme', null);
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  $('theme-btn').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next); store.set('theme', next);
  });
})();

// ---------- 阅读框（故事 / 原文出处共用） ----------
const reader = $('reader'), readerIn = $('reader-in');
function openDialog(build) {
  readerIn.replaceChildren();
  const x = el('button', 'x', '×'); x.type = 'button'; x.setAttribute('aria-label', '关闭'); x.addEventListener('click', closeDialog);
  readerIn.append(x); build(readerIn);
  if (!reader.open) { if (reader.showModal) reader.showModal(); else reader.setAttribute('open', ''); }
  readerIn.scrollTop = 0; x.focus({ preventScroll: true });
}
function closeDialog() { if (reader.open) { if (reader.close) reader.close(); else reader.removeAttribute('open'); } }
reader.addEventListener('click', (e) => { if (e.target === reader) closeDialog(); });
function openRef(id) {
  const r = D.refs[id] || storyById[id] || (() => { for (const n of D.nodes) { if (n.id === id) return n; const e = n.extra.find((x) => x.id === id); if (e) return { ...e, node: n.id }; } })();
  if (!r) return;
  const n = nodeById[r.node || id];
  openDialog((box) => {
    box.append(el('div', 'meta', '资料原文' + (n ? ' · ' + n.pname + ' · ' + n.date : '')));
    const h = el('h3', null, '这句话出自哪里'); h.id = 'reader-title'; box.append(h);
    const t = el('div', 'txt'); for (const p of paragraphs(r.text)) t.append(el('p', null, p)); box.append(t);
    const s = el('div', 'srcs'); s.append(srcLink(r.source, r.url)); box.append(s);
    box.append(el('p', 'n', '本页文字取自《长征路上》知识库，知识库每条资料都对应一个公开网页。点上面的链接可以打开原文核对。'));
  });
}

// ---------- 顶栏章节高亮 ----------
(() => {
  const links = [...document.querySelectorAll('#nav a')];
  const io = new IntersectionObserver((ents) => {
    for (const en of ents) if (en.isIntersecting) {
      for (const a of links) a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id);
      const on = links.find((a) => a.classList.contains('on')); if (on) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  for (const a of links) { const s = document.querySelector(a.getAttribute('href')); if (s) io.observe(s); }
})();

// ---------- 路线几何 ----------
const W = D.map.w, H = D.map.h;
const routePx = D.map.route.map(([x, y]) => [x * W / 100, y * H / 100]);
const cum = [0]; for (let i = 1; i < routePx.length; i++) cum.push(cum[i - 1] + Math.hypot(routePx[i][0] - routePx[i - 1][0], routePx[i][1] - routePx[i - 1][1]));
const routeLen = cum[cum.length - 1];
const ptsAttr = (pts, fx = (p) => p) => pts.map((p) => fx(p).map((v) => v.toFixed(1)).join(',')).join(' ');

// ---------- 开篇“一笔长征” ----------
(() => {
  const svg = $('hero-route');
  const X0 = 250, Y0 = 215, VW = 1200, VH = 680;
  svg.setAttribute('viewBox', `${X0} ${Y0} ${VW} ${VH}`);
  for (const l of D.map.labels) {
    if (l.kind !== 'river' && l.kind !== 'mount') continue;
    const [x, y] = [l.at[0] * W / 100, l.at[1] * H / 100];
    if (x < X0 || x > X0 + VW || y < Y0 || y > Y0 + VH) continue;
    sv('text', { x, y, class: 'geo', 'text-anchor': 'middle', 'font-size': 20 }, svg).textContent = l.text;
  }
  sv('polyline', { points: ptsAttr(routePx), class: 'ghost-line', 'stroke-width': 2.4 }, svg);
  const ink = sv('polyline', { points: ptsAttr(routePx), class: 'ink-line', 'stroke-width': 7 }, svg);
  const len = routeLen; ink.style.setProperty('--len', len); ink.style.strokeDasharray = len;
  const LABELS = { start: ['中央苏区', '1934.10', 'below'], zunyi: ['遵义', '1935.01', 'right'], luding: ['泸定桥', '1935.05', 'left'], caodi: ['草地', '1935.08', 'left'], wuqi: ['吴起镇', '1935.10', 'right'], xiangjiang: ['湘江', '1934.11', 'below'], jinsha: ['金沙江', '1935.05', 'left'] };
  D.mainOrder.forEach((id) => {
    const [x, y] = [nodeById[id].at[0] * W / 100, nodeById[id].at[1] * H / 100];
    const delay = 0.2 + 3.6 * (cum[D.routeIndex[id]] / len);
    const big = id === 'start' || id === 'wuqi';
    const c = sv('circle', { cx: x, cy: y, r: big ? 10 : 6, class: 'dot' + (big ? ' big' : ''), 'stroke-width': 3 }, svg);
    c.style.animationDelay = delay + 's'; c.style.transformOrigin = `${x}px ${y}px`;
    const L = LABELS[id]; if (!L) return;
    const g = sv('g', { class: 'lbl' }, svg); g.style.animationDelay = delay + 's'; g.style.transformOrigin = `${x}px ${y}px`;
    const pos = L[2] === 'left' ? { x: x - 18, a: 'end', y: y + 8 } : L[2] === 'below' ? { x, a: 'middle', y: y + 42 } : { x: x + 18, a: 'start', y: y + 8 };
    sv('text', { x: pos.x, y: pos.y, 'text-anchor': pos.a, 'font-size': 30 }, g).textContent = L[0];
    sv('text', { x: pos.x, y: pos.y + 24, 'text-anchor': pos.a, class: 'd', 'font-size': 18 }, g).textContent = L[1];
  });
  if (!reduceMotion) svg.classList.add('animate');
  const stats = $('hero-stats');
  for (const s of F.heroStats) {
    const d = el('div', 'stat'); const b = el('b'); b.append(s.value); if (s.unit) b.append(el('small', null, s.unit));
    const sp = el('span', null, s.label); sp.append(refBtn(s.ref)); d.append(b, sp); stats.append(d);
  }
  // 长征路上的今天：按月、日找日历上离今天最近（含今天）的一站
  const now = new Date(); const doy = (m, d) => Date.UTC(2001, m - 1, d) / 864e5;
  const today = doy(now.getMonth() + 1, now.getDate());
  let best = null;
  for (const id of ALL) {
    const a = F.dateAnchors[id]; const [, m, d] = a.iso.split('-').map(Number); if (!d) continue;
    let gap = (doy(m, d) - today + 365) % 365;
    if (a.end) { const [, m2, d2] = a.end.split('-').map(Number); const len = (doy(m2, d2) - doy(m, d) + 365) % 365; if ((today - doy(m, d) + 365) % 365 <= len) gap = 0; }
    if (!best || gap < best.gap) best = { id, gap };
  }
  if (best) {
    const n = nodeById[best.id], a = F.dateAnchors[best.id]; const t = $('today');
    t.append(el('span', 'today-k', best.gap === 0 ? '长征路上的今天' : `再过 ${best.gap} 天`), `${a.label}，${n.pname}。`);
    const go = el('button', 'today-go', '去看看 →'); go.type = 'button'; go.addEventListener('click', () => march.goTo(best.id)); t.append(go);
  }
})();

// ---------- 壹 · 行军沙盘 ----------
const march = (() => {
  const cam = $('cam'), stage = $('stage'), stepsEl = $('steps'), ticks = $('ticks');
  const img = el('img'); img.src = D.map.img; img.alt = '长征途经地区的地形示意沙盘：西部横断山脉高耸，金沙江与大渡河切出深谷，北面是黄土高原，东南为丘陵。非精确地图。'; img.width = W; img.height = H; img.decoding = 'async';
  cam.append(img);
  const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none', 'aria-hidden': 'true' }, cam);
  const all = sv('polyline', { points: ptsAttr(routePx), class: 'route-all', 'stroke-dasharray': '6 8' }, svg);
  const done = sv('polyline', { points: ptsAttr(routePx), class: 'route-done' }, svg);
  done.style.strokeDasharray = routeLen; done.style.strokeDashoffset = routeLen;
  for (const l of D.map.labels) { const g = el('span', 'geo-label' + (l.kind === 'river' ? ' river' : ''), l.text); g.style.left = l.at[0] + '%'; g.style.top = l.at[1] + '%'; cam.append(g); }
  const pins = {};
  ALL.forEach((id) => {
    const n = nodeById[id]; const p = el('div', 'pin' + (D.codaOrder.includes(id) ? ' coda' : '') + (n.at[0] > 70 ? ' left' : ''));
    p.style.left = n.at[0] + '%'; p.style.top = n.at[1] + '%';
    const b = el('button'); b.type = 'button'; b.setAttribute('aria-label', '跳到「' + n.pname + '」');
    b.addEventListener('click', () => goTo(ALL.indexOf(id) + 1));
    p.append(b, el('span', 'pl', n.pname)); cam.append(p); pins[id] = p;
  });

  // 步骤：0 为总览，1..23 为主路线，之后为尾声
  const steps = [];
  const intro = el('li', 'step'); const ic = el('article', 'card intro-card');
  ic.append(el('p', 'body', `1934 年 10 月，中共中央和中央红军主力撤离中央革命根据地，开始长征。下面 ${D.mainOrder.length} 站按时间排列，到 1935 年 10 月陕北吴起镇为止；最后 ${D.codaOrder.length} 站是到达陕北之后的直罗镇战役和红军三大主力会师。`));
  const lg = el('div', 'legend'); lg.innerHTML = '<span><i></i>已走过的路线</span><span><i class="plan"></i>尚未走到</span><span><i class="d"></i>到达陕北之后</span>'; ic.append(lg);
  const jump = el('div', 'jump');
  const auto = el('button', 'btn primary', '▶ 自动行军'); auto.type = 'button';
  const first = el('button', 'btn', '从第 1 站开始'); first.type = 'button'; first.addEventListener('click', () => goTo(1));
  jump.append(auto, first); ic.append(jump);
  ic.append(el('p', 'note', '沙盘由 Blender 根据公开高程数据建模渲染，是地形示意，不画边界、不标行政区。路线为示意走向。'));
  intro.append(ic); stepsEl.append(intro); steps.push({ li: intro, id: null });

  ALL.forEach((id, i) => {
    const n = nodeById[id]; const a = F.dateAnchors[id]; const coda = D.codaOrder.includes(id);
    const li = el('li', 'step'); li.dataset.id = id;
    const c = el('article', 'card'); c.setAttribute('aria-labelledby', 'st-' + id);
    const k = el('div', 'card-kicker');
    k.append(el('span', 'no', coda ? '到达陕北之后' : `第 ${String(i + 1).padStart(2, '0')} 站 / ${D.mainOrder.length}`), el('span', null, a.label));
    const dd = daysFrom(a.iso); const ks = el('span', 'days', dd != null ? `出发后第 ${dd} 天` : '资料只到月份'); ks.append(refBtn(a.ref)); k.append(ks);
    const h = el('h3', null, n.pname); h.id = 'st-' + id;
    c.append(k, h); if (n.title !== n.pname) c.append(el('p', 'sub', n.title)); c.append(el('p', 'body', n.text), srcLink(n.source, n.url));
    if (n.extra.length) {
      const det = el('details', 'more'); det.append(el('summary', null, `这一站还有 ${n.extra.length} 条资料`));
      const ul = el('ul'); for (const e of n.extra) { const it = el('li', null, e.text); it.append(el('br'), srcLink(e.source, e.url)); ul.append(it); }
      det.append(ul); c.append(det);
    }
    const gs = D.guides.filter((g) => g.node === id);
    if (gs.length) { const ch = el('div', 'chips'); for (const g of gs) ch.append(storyChip(g)); c.append(ch); }
    li.append(c); stepsEl.append(li); steps.push({ li, id });
    const t = el('button', coda ? 'coda' : ''); t.type = 'button'; t.setAttribute('aria-label', `第 ${i + 1} 处：${n.pname}`); t.title = n.pname;
    t.addEventListener('click', () => goTo(i + 1)); ticks.append(t);
  });

  let cur = -1, scale = 1;
  function camera(id) {
    const r = stage.getBoundingClientRect(); const Wp = r.width, Hp = r.height;
    let s = 1, px = .5, py = .52;
    if (id) { const n = nodeById[id]; px = n.at[0] / 100; py = n.at[1] / 100; s = D.codaOrder.includes(id) ? 1.5 : (isNarrow() ? 1.9 : 2.2); }
    let tx = Wp / 2 - px * Wp * s, ty = Hp / 2 - py * Hp * s;
    tx = Math.min(0, Math.max(Wp - Wp * s, tx)); ty = Math.min(0, Math.max(Hp - Hp * s, ty));
    scale = s; cam.style.setProperty('--s', s); cam.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
    const unit = W / Math.max(Wp, 1) / s;
    done.style.strokeWidth = (4 * unit).toFixed(2); all.style.strokeWidth = (2 * unit).toFixed(2);
    all.setAttribute('stroke-dasharray', `${(6 * unit).toFixed(1)} ${(7 * unit).toFixed(1)}`);
  }
  function set(i) {
    if (i === cur) return; cur = i;
    const id = steps[i].id; const idx = id ? ALL.indexOf(id) : -1;
    steps.forEach((s, j) => s.li.classList.toggle('active', j === i));
    const mainReached = id ? (D.codaOrder.includes(id) ? D.mainOrder.length - 1 : D.mainOrder.indexOf(id)) : -1;
    done.style.strokeDashoffset = mainReached < 0 ? routeLen : routeLen - cum[D.routeIndex[D.mainOrder[mainReached]]];
    ALL.forEach((nid, j) => { pins[nid].classList.toggle('cur', nid === id); pins[nid].classList.toggle('done', j < idx); });
    [...ticks.children].forEach((t, j) => { t.classList.toggle('cur', j === idx); t.classList.toggle('done', j < idx); });
    camera(id);
    if (id) {
      const n = nodeById[id], a = F.dateAnchors[id], dd = daysFrom(a.iso);
      $('tg-date').textContent = a.precision === 'month' ? tapeDate(a.iso) + '·——' : tapeDate(a.iso);
      $('tg-rest').textContent = `${D.codaOrder.includes(id) ? '尾声' : String(idx + 1).padStart(2, '0')} ${n.pname}` + (dd != null ? ` · 出发后第${dd}天` : ' · 资料只到月份');
      if (!state.visited.has(id)) { state.visited.add(id); saveState(); }
    } else { $('tg-date').textContent = '1934·10·10'; $('tg-rest').textContent = '中共中央、中革军委率第 1、第 2 野战纵队从江西瑞金等地出发'; }
  }
  function goTo(i) { stopAuto(); const s = steps[i]; if (!s) return; (s.li.querySelector('.card') || s.li).scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: isNarrow() ? 'end' : 'center' }); set(i); }
  let raf = 0;
  function onScroll() {
    if (raf) return; raf = requestAnimationFrame(() => {
      raf = 0; const trig = innerHeight * (isNarrow() ? 0.86 : 0.55); let a = 0;
      steps.forEach((s, j) => { const c = s.li.querySelector('.card'); if (c && c.getBoundingClientRect().top < trig) a = j; });
      set(a);
    });
  }
  stage.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goTo(Math.min(steps.length - 1, cur + 1)); stage.focus({ preventScroll: true }); } if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goTo(Math.max(0, cur - 1)); stage.focus({ preventScroll: true }); } });
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { const k = cur; cur = -1; set(Math.max(0, k)); });
  // 自动行军
  let timer = null;
  function stopAuto() { if (timer) { clearInterval(timer); timer = null; auto.textContent = '▶ 自动行军'; } }
  auto.addEventListener('click', () => {
    if (timer) return stopAuto();
    let i = Math.max(1, cur); const step = () => { if (i >= steps.length) return stopAuto(); const c = steps[i].li.querySelector('.card'); c.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: isNarrow() ? 'end' : 'center' }); set(i); i++; };
    step(); timer = setInterval(step, 3800); auto.textContent = '■ 停止';
  });
  for (const ev of ['wheel', 'touchstart', 'keydown']) addEventListener(ev, (e) => { if (timer && !(e.target === auto)) stopAuto(); }, { passive: true });
  set(0);
  return { goTo: (id) => goTo(ALL.indexOf(id) + 1) };
})();

// ---------- 贰 · 四渡赤水 ----------
(() => {
  const svg = $('cs-svg'), list = $('cs-list'), S = F.chishuiSteps;
  const XW = 125, XE = 395, RX = 260, top = 78, gap = 60;
  const pts = S.map((s, i) => [s.side === 'west' ? XW : XE, top + i * gap]);
  // 河道（示意）
  let d = `M ${RX} 20`; for (let y = 20; y < 540; y += 40) d += ` Q ${RX + (((y - 20) / 40) % 2 ? -16 : 16)} ${y + 20} ${RX} ${y + 40}`;
  sv('path', { d, class: 'river' }, svg); sv('path', { d, class: 'river-core' }, svg);
  sv('text', { x: XW, y: 34, class: 'bank', 'text-anchor': 'middle' }, svg).textContent = '西 岸';
  sv('text', { x: XE, y: 34, class: 'bank', 'text-anchor': 'middle' }, svg).textContent = '东 岸';
  const rl = sv('text', { x: RX, y: 552, class: 'tdate', 'text-anchor': 'middle' }, svg); rl.textContent = '赤水河（示意）';
  S.forEach((s, i) => { sv('line', { x1: 14, x2: 44, y1: pts[i][1], y2: pts[i][1], class: 'tick' }, svg); });
  // 路径
  const segLen = [0]; for (let i = 1; i < pts.length; i++) segLen.push(segLen[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = segLen[segLen.length - 1];
  sv('polyline', { points: pts.map((p) => p.join(',')).join(' '), fill: 'none', stroke: 'currentColor', 'stroke-opacity': .18, 'stroke-width': 2, 'stroke-dasharray': '3 6' }, svg);
  const path = sv('polyline', { points: pts.map((p) => p.join(',')).join(' '), class: 'path' }, svg);
  path.style.strokeDasharray = total; path.style.strokeDashoffset = total;
  const dots = S.map((s, i) => {
    const [x, y] = pts[i]; const g = sv('g', {}, svg);
    sv('circle', { cx: x, cy: y, r: s.kind === 'cross' ? 9 : 6, class: 'ev' + (s.kind === 'cross' ? ' cross' : '') }, g);
    const left = s.side === 'west'; const lx = left ? x - 16 : x + 16;
    sv('text', { x: lx, y: y + 5, class: 'evl', 'text-anchor': left ? 'end' : 'start' }, g).textContent = s.title;
    sv('text', { x: lx, y: y + 22, class: 'tdate', 'text-anchor': left ? 'end' : 'start' }, g).textContent = s.date;
    return g;
  });
  const token = sv('path', { d: 'M0 -13 L3.1 -4.3 12.4 -4 5 1.6 7.6 10.5 0 5.3 -7.6 10.5 -5 1.6 -12.4 -4 -3.1 -4.3Z', class: 'token' }, svg);
  const items = S.map((s, i) => {
    const li = el('li'); const b = el('button'); b.type = 'button';
    const t = el('span', 't', s.title); if (s.kind === 'cross') t.append(el('small', null, '渡河'));
    const x = el('span', 'x', s.text + '。'); x.append(el('br'), srcLink(D.refs[s.ref].source, D.refs[s.ref].url));
    b.append(el('span', 'd', s.date), t, x); b.addEventListener('click', () => { stop(); go(i); });
    li.append(b); list.append(li); return li;
  });
  let cur = 0;
  function go(i) {
    cur = Math.max(0, Math.min(S.length - 1, i));
    path.style.strokeDashoffset = total - segLen[cur];
    token.setAttribute('transform', `translate(${pts[cur][0]} ${pts[cur][1]})`);
    token.style.transform = `translate(${pts[cur][0]}px, ${pts[cur][1]}px)`;
    dots.forEach((g, j) => { g.querySelector('circle').classList.toggle('on', j <= cur && S[j].kind === 'cross'); g.querySelector('.evl').classList.toggle('dim', j > cur); });
    items.forEach((li, j) => li.classList.toggle('on', j === cur));
    $('cs-n').textContent = S.slice(0, cur + 1).filter((s) => s.kind === 'cross').length;
    $('cs-prev').disabled = cur === 0; $('cs-next').disabled = cur === S.length - 1;
  }
  let timer = null; const play = $('cs-play');
  function stop() { if (timer) { clearInterval(timer); timer = null; play.textContent = '自动演示'; } }
  $('cs-prev').addEventListener('click', () => { stop(); go(cur - 1); });
  $('cs-next').addEventListener('click', () => { stop(); go(cur + 1); });
  play.addEventListener('click', () => {
    if (timer) return stop();
    if (cur >= S.length - 1) go(0);
    play.textContent = '暂停'; timer = setInterval(() => { if (cur >= S.length - 1) return stop(); go(cur + 1); }, 1700);
  });
  go(0);
})();

// ---------- 叁 · 数字 ----------
(() => {
  // 甘特图
  const svg = $('gantt'), info = $('gantt-info');
  const start = [1934, 10], months = 26; // 1934.10 — 1936.11
  const L = 150, R = 24, TOP = 34, ROW = 58, VW = 900;
  const VH = TOP + ROW * F.armies.length + 16;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const mIndex = (ym) => { const [y, m] = ym.split('-').map(Number); return (y - start[0]) * 12 + (m - start[1]); };
  const mx = (i) => L + (i / months) * (VW - L - R);
  for (let i = 0; i <= months; i++) {
    const y = start[0] + Math.floor((start[1] - 1 + i) / 12), m = ((start[1] - 1 + i) % 12) + 1;
    const yr = m === 1;
    sv('line', { x1: mx(i), x2: mx(i), y1: TOP - 6, y2: VH - 12, class: yr ? 'yr' : 'grid' }, svg);
    if (yr || i === 0 || m === 4 || m === 7 || m === 10) { const t = sv('text', { x: mx(i) + 3, y: TOP - 12, class: 'axis' }, svg); t.textContent = yr || i === 0 ? `${y}.${m}` : `${m}月`; }
  }
  const rowY = {};
  const showArmy = (a) => {
    info.replaceChildren(); const b = el('b', null, `${a.name}${a.alias ? '（' + a.alias + '）' : ''}：`);
    info.append(b, `${ymText(a.start)}至${ymText(a.end)}，里程${a.distance}。`);
    info.append(el('br'), srcLink(D.refs[a.refs[0].ref].source, D.refs[a.refs[0].ref].url));
  };
  F.armies.forEach((a, i) => {
    const y = TOP + i * ROW + 8; rowY[a.id] = y + 13;
    sv('text', { x: 0, y: y + 12, class: 'row-name' }, svg).textContent = a.name;
    sv('text', { x: 0, y: y + 29, class: 'row-dist' }, svg).textContent = a.alias || ' ';
    const x1 = mx(mIndex(a.start)), x2 = mx(mIndex(a.end) + 1);
    const bar = sv('rect', { x: x1, y, width: x2 - x1, height: 26, rx: 4, class: 'bar ' + a.id, tabindex: 0, role: 'button', 'aria-label': `${a.name}：${a.start} 至 ${a.end}，${a.distance}` }, svg);
    bar.addEventListener('click', () => showArmy(a)); bar.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showArmy(a); } });
    const txt = sv('text', { x: x1 + 8, y: y + 17.5, class: 'inbar' }, svg); txt.textContent = a.distance; txt.style.pointerEvents = 'none';
  });
  const evts = [];
  F.armyEvents.forEach((e) => {
    const x = mx(mIndex(e.date) + 0.5); const ys = e.armies.map((id) => rowY[id]);
    if (ys.length > 1) sv('line', { x1: x, x2: x, y1: Math.min(...ys), y2: Math.max(...ys), class: 'link' }, svg);
    const show = () => {
      evts.forEach((g) => g.forEach((d) => d.classList.remove('on')));
      ds.forEach((d) => d.classList.add('on'));
      info.replaceChildren(el('b', null, ymText(e.date) + '：' + e.label + '。'));
      info.append(' 原文：“' + e.quote + '”', el('br'), srcLink(D.refs[e.ref].source, D.refs[e.ref].url));
    };
    const ds = ys.map((y) => { const d = sv('path', { d: `M${x} ${y - 9} L${x + 9} ${y} L${x} ${y + 9} L${x - 9} ${y}Z`, class: 'evt', tabindex: 0, role: 'button', 'aria-label': e.label }, svg); d.addEventListener('click', show); d.addEventListener('keydown', (k) => { if (k.key === 'Enter' || k.key === ' ') { k.preventDefault(); show(); } }); return d; });
    evts.push(ds);
  });
  info.append('点条形看起止和里程，点菱形看会师等节点。');
  showArmy(F.armies[0]);

  // 人数
  const box = $('sizes'); const max = F.armySizes[0].value;
  for (const s of F.armySizes) {
    const r = el('div', 'size-row'); const lab = el('div', 'lab'); lab.append(el('b', null, s.when), s.place, refBtn(s.ref));
    const bar = el('div', 'size-bar'); const i = el('i'); const pct = s.value / max * 100; i.style.width = pct + '%';
    const t = el('span', pct < 28 ? 'out' : '', s.text); if (pct < 28) t.style.left = `calc(${pct}% + 8px)`;
    bar.append(i, t); r.append(lab, bar); box.append(r);
  }
  const cv = $('size-caveat'); cv.append(F.armySizeCaveat.text); for (const r of F.armySizeCaveat.refs) cv.append(refBtn(r.ref));

  // 翻面卡片
  const cards = $('cards');
  for (const c of F.numberCards) {
    const b = el('button', 'flip'); b.type = 'button'; b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', `${c.label}：${c.n}${c.unit}，翻面看原文`);
    const inner = el('div', 'flip-in'); const fr = el('div', 'face front'); const big = el('b', null, c.n); big.append(el('small', null, c.unit)); fr.append(big, el('span', null, c.label));
    const bk = el('div', 'face back'); bk.append(el('span', null, '“' + c.text + '”'), el('em', null, D.refs[c.ref].source));
    inner.append(fr, bk); b.append(inner);
    b.addEventListener('click', () => { const on = b.classList.toggle('on'); b.setAttribute('aria-pressed', String(on)); });
    cards.append(b);
  }
})();

// ---------- 肆 · 会议纸带 ----------
(() => {
  const M = F.meetings, svg = $('mini-map'), strip = $('tape-scroll'), focus = $('meet-focus');
  const X0 = 330, Y0 = 215, VW = 1080, VH = 660;
  svg.setAttribute('viewBox', `${X0} ${Y0} ${VW} ${VH}`);
  sv('polyline', { points: ptsAttr(routePx), class: 'r', 'stroke-width': 5 }, svg);
  const rd = sv('polyline', { points: ptsAttr(routePx), class: 'rd', 'stroke-width': 7 }, svg); rd.style.strokeDasharray = routeLen; rd.style.strokeDashoffset = routeLen;
  const marks = {};
  for (const id of new Set(M.map((m) => m.node))) { const n = nodeById[id]; marks[id] = sv('circle', { cx: n.at[0] * W / 100, cy: n.at[1] * H / 100, r: 11, class: 'm', 'stroke-width': 3 }, svg); }
  const lbl = sv('text', { class: 'ml', 'font-size': 34 }, svg);
  const cards = M.map((m, i) => {
    const b = el('button', 'punch'); b.type = 'button'; b.setAttribute('role', 'option');
    b.append(el('span', 'd', m.date)); const n = el('span', 'n', m.name); if (m.key) n.append(el('span', 'k', '转折')); b.append(n);
    b.addEventListener('click', () => sel(i)); strip.append(b); return b;
  });
  let cur = 0;
  function sel(i) {
    cur = (i + M.length) % M.length; const m = M[cur]; const n = nodeById[m.node];
    cards.forEach((c, j) => { c.classList.toggle('on', j === cur); c.setAttribute('aria-selected', String(j === cur)); });
    cards[cur].scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    for (const id in marks) marks[id].classList.toggle('on', id === m.node);
    const ri = D.mainOrder.includes(m.node) ? D.routeIndex[m.node] : routePx.length - 1; rd.style.strokeDashoffset = routeLen - cum[ri];
    const x = n.at[0] * W / 100, y = n.at[1] * H / 100; const right = x < X0 + VW * 0.6;
    lbl.setAttribute('x', right ? x + 22 : x - 22); lbl.setAttribute('y', y + 10); lbl.setAttribute('text-anchor', right ? 'start' : 'end'); lbl.textContent = m.name;
    focus.replaceChildren(el('div', 'd', `${m.date} · 第 ${cur + 1} / ${M.length} 次`));
    const h = el('h3', null, m.name); focus.append(h);
    const p = el('p', null, '“' + m.decision + '”'); focus.append(p);
    const row = el('div', 'chips'); const go = el('button', 'chip', '在沙盘上看「' + n.pname + '」'); go.type = 'button'; go.addEventListener('click', () => march.goTo(m.node));
    row.append(go); focus.append(srcLink(D.refs[m.ref].source, D.refs[m.ref].url), row);
  }
  $('meet-prev').addEventListener('click', () => sel(cur - 1));
  $('meet-next').addEventListener('click', () => sel(cur + 1));
  strip.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); sel(cur + 1); cards[cur].focus(); } if (e.key === 'ArrowLeft') { e.preventDefault(); sel(cur - 1); cards[cur].focus(); } });
  // 初始选中遵义会议，但不滚动页面
  const z = M.findIndex((m) => m.key); cur = z; const keep = scrollY; sel(z); scrollTo(0, keep);
})();

// ---------- 伍 · 人物星河 ----------
(() => {
  const svg = $('sky-svg'), card = $('sky-card'), P = D.persons;
  const VW = 1000, VH = 660; svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const sx = (n) => 70 + (n.at[0] - 20) / (86 - 20) * 860, sy = (n) => (n.at[1] - 21) / (87 - 21) * 560 + 60;
  const pos = Object.fromEntries(D.nodes.map((n) => [n.id, [sx(n), sy(n)]]));
  // 背景星点（固定种子，保证每次一样）
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 140; i++) { const c = sv('circle', { cx: rnd() * VW, cy: rnd() * VH, r: rnd() * 1.3 + .3, class: 'bgstar' }, svg); c.setAttribute('opacity', (rnd() * .5 + .1).toFixed(2)); }
  sv('polyline', { points: D.mainOrder.map((id) => pos[id].map((v) => v.toFixed(1)).join(',')).join(' '), class: 'route' }, svg);
  // 人物布局：向关联站点的重心靠拢，彼此排斥
  const people = P.map((p, i) => {
    const ms = p.mentions.map((m) => pos[m.node]); const cx = ms.reduce((s, q) => s + q[0], 0) / ms.length, cy = ms.reduce((s, q) => s + q[1], 0) / ms.length;
    const ang = i * 2.399963; return { p, x: cx + Math.cos(ang) * 60, y: cy + Math.sin(ang) * 60, cx, cy };
  });
  const st = Object.values(pos);
  for (let it = 0; it < 360; it++) {
    for (const a of people) {
      let fx = (a.cx - a.x) * .015, fy = (a.cy - a.y) * .015;
      for (const b of people) if (a !== b) { const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy + .01; if (d2 < 120 * 120) { const f = 1400 / d2; fx += dx * f * .05; fy += dy * f * .05; } }
      for (const q of st) { const dx = a.x - q[0], dy = a.y - q[1], d2 = dx * dx + dy * dy + .01; if (d2 < 36 * 36) { fx += dx * 2 / Math.sqrt(d2); fy += dy * 2 / Math.sqrt(d2); } }
      a.x = Math.max(30, Math.min(VW - 80, a.x + Math.max(-6, Math.min(6, fx)))); a.y = Math.max(24, Math.min(VH - 20, a.y + Math.max(-6, Math.min(6, fy))));
    }
  }
  const edges = [];
  for (const a of people) for (const m of a.p.mentions) edges.push({ p: a.p.id, n: m.node, el: sv('line', { x1: a.x, y1: a.y, x2: pos[m.node][0], y2: pos[m.node][1], class: 'edge' }, svg) });
  const stEls = {}, stLbl = {};
  for (const n of D.nodes) {
    const [x, y] = pos[n.id]; const c = sv('circle', { cx: x, cy: y, r: 6.5, class: 'st', tabindex: 0, role: 'button', 'aria-label': '站点：' + n.pname }, svg);
    c.addEventListener('click', (e) => { e.stopPropagation(); showStation(n.id); }); c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showStation(n.id); } });
    stEls[n.id] = c; const t = sv('text', { x: x + 9, y: y + 18, class: 'stl' }, svg); t.textContent = n.pname; t.style.display = 'none'; stLbl[n.id] = t;
  }
  for (const id of ['start', 'wuqi']) stLbl[id].style.display = '';
  const pEls = {};
  for (const a of people) {
    const g = sv('g', { class: 'pp', tabindex: 0, role: 'button', 'aria-label': '人物：' + a.p.key }, svg);
    const r = 3 + Math.min(5, a.p.mentions.length * .6);
    sv('circle', { cx: a.x, cy: a.y, r: r * 3, class: 'halo' }, g); sv('circle', { cx: a.x, cy: a.y, r }, g);
    const t = sv('text', { x: a.x + r + 6, y: a.y + 7 }, g); t.textContent = a.p.key;
    g.addEventListener('click', (e) => { e.stopPropagation(); showPerson(a.p.id); }); g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showPerson(a.p.id); } });
    pEls[a.p.id] = g;
  }
  const byId = Object.fromEntries(P.map((p) => [p.id, p]));
  function clear() {
    svg.classList.add('focus');
    for (const e of edges) e.el.classList.remove('hot');
    for (const id in stEls) { stEls[id].classList.remove('hot'); stLbl[id].classList.remove('hot'); stLbl[id].style.display = id === 'start' || id === 'wuqi' ? '' : 'none'; }
    for (const id in pEls) pEls[id].classList.remove('hot');
  }
  const hotStation = (id) => { stEls[id].classList.add('hot'); stLbl[id].classList.add('hot'); stLbl[id].style.display = ''; };
  function showPerson(pid) {
    clear(); const p = byId[pid]; pEls[pid].classList.add('hot');
    for (const e of edges) if (e.p === pid) { e.el.classList.add('hot'); hotStation(e.n); }
    card.replaceChildren(); const h = el('h3', null, p.name); card.append(h, el('p', null, p.text), srcLink(p.source, p.url));
    card.append(el('div', 'lab', `在 ${p.mentions.length} 处站点的资料里出现`));
    const ul = el('ul'); let shown = 0;
    for (const m of p.mentions) for (const r of m.refs) {
      if (shown >= 4) break; const mat = D.nodes.find((n) => n.id === m.node); const t = r === m.node ? mat.text : mat.extra.find((e) => e.id === r)?.text;
      if (!t || r === p.id) continue; const li = el('li'); li.append(el('b', null, mat.pname), t); ul.append(li); shown++;
    }
    if (shown) card.append(ul);
    const chips = el('div', 'chips'); for (const m of p.mentions) { const c = el('button', 'chip', nodeById[m.node].pname); c.type = 'button'; c.addEventListener('click', () => showStation(m.node)); chips.append(c); } card.append(chips);
    const gs = D.guides.filter((g) => g.story && p.stories.includes(g.story));
    if (gs.length) { card.append(el('div', 'lab', '相关故事')); const ch = el('div', 'chips'); for (const g of gs) ch.append(storyChip(g)); card.append(ch); }
  }
  function showStation(id) {
    clear(); hotStation(id); const n = nodeById[id];
    const ps = P.filter((p) => p.mentions.some((m) => m.node === id));
    for (const e of edges) if (e.n === id) { e.el.classList.add('hot'); pEls[e.p].classList.add('hot'); }
    card.replaceChildren(el('h3', null, n.pname), el('p', null, `${n.date} · ${n.title}`));
    card.append(el('div', 'lab', ps.length ? `这一站的资料里出现了 ${ps.length} 位人物` : '这一站的资料里没有收录人物条目'));
    const chips = el('div', 'chips'); for (const p of ps) { const c = el('button', 'chip', p.key); c.type = 'button'; c.addEventListener('click', () => showPerson(p.id)); chips.append(c); } card.append(chips);
    const go = el('button', 'chip', '在沙盘上看这一站 →'); go.type = 'button'; go.addEventListener('click', () => march.goTo(id)); const r = el('div', 'chips'); r.append(go); card.append(r);
  }
  svg.addEventListener('click', () => { clear(); svg.classList.remove('focus'); card.replaceChildren(el('h3', null, '点一颗星'), el('p', null, `星河里有 ${P.length} 位人物、${D.nodes.length} 处站点。人物条目取自知识库中的人物资料，连线来自资料原文里出现他们名字的地方。`)); });
  showPerson('yihai_person_liu_bocheng');
})();

// ---------- 陆 · 故事 ----------
function storyChip(g) {
  const c = el('button', 'chip' + (state.read.has(g.id) ? ' read' : ''), g.title); c.type = 'button'; c.dataset.guide = g.id;
  c.addEventListener('click', () => openGuide(g.id)); return c;
}
let storyList = D.guides.map((g) => g.id);
function openGuide(gid, list = storyList) {
  const g = guideById[gid]; if (!g) return; const s = g.story ? storyById[g.story] : null; const n = nodeById[g.node];
  openDialog((box) => {
    box.append(el('div', 'meta', [g.date, n && n.pname, g.tag].filter(Boolean).join(' · ')));
    const h = el('h3', null, g.title); h.id = 'reader-title'; box.append(h);
    if (g.hook && g.hook !== g.title) box.append(el('p', 'hook', g.hook));
    const t = el('div', 'txt');
    const srcs = el('div', 'srcs');
    if (s) {
      for (const p of paragraphs(s.text)) t.append(el('p', null, p));
      box.append(t);
      if (s.note) box.append(el('p', 'n', '（' + s.note.trim() + '）'));
      srcs.append(srcLink(s.source, s.url)); for (const m of s.more) srcs.append(srcLink(m.title || m.source || m.url, m.url, '另见：'));
    } else {
      const seen = new Set();
      for (const part of g.parts) { const p = el('p'); p.append(el('span', 'part-l', part.label + (part.date ? ' · ' + part.date : '')), part.text); t.append(p); for (const r of part.sources) { const m = D.refs[r]; if (m && !seen.has(m.url)) { seen.add(m.url); srcs.append(srcLink(m.source, m.url)); } } }
      box.append(t);
    }
    box.append(srcs);
    const nav = el('div', 'reader-nav'); const i = list.indexOf(gid);
    const prev = el('button', 'btn', '← 上一篇'); prev.type = 'button'; prev.disabled = i <= 0; prev.addEventListener('click', () => openGuide(list[i - 1], list));
    const map = el('button', 'btn ghost', '在沙盘上看这一站'); map.type = 'button'; map.addEventListener('click', () => { closeDialog(); march.goTo(g.node); });
    const next = el('button', 'btn primary', '下一篇 →'); next.type = 'button'; next.disabled = i < 0 || i >= list.length - 1; next.addEventListener('click', () => openGuide(list[i + 1], list));
    nav.append(prev, map, next); box.append(nav);
  });
  if (!state.read.has(gid)) { state.read.add(gid); saveState(); }
  document.querySelectorAll(`[data-guide="${gid}"]`).forEach((c) => c.classList.add('read'));
}
(() => {
  const filters = $('filters'), grid = $('story-grid'), moreBtn = $('story-more');
  let trail = null, expanded = false;
  const mk = (label, id) => { const b = el('button', 'chip', label); b.type = 'button'; b.setAttribute('aria-pressed', 'false'); b.addEventListener('click', () => { trail = id; expanded = false; render(); }); filters.append(b); return b; };
  const fbtns = [[mk('全部', null), null], ...D.trails.map((t) => [mk(t.title, t.id), t.id])];
  function render() {
    for (const [b, id] of fbtns) { b.classList.toggle('on', id === trail); b.setAttribute('aria-pressed', String(id === trail)); }
    const t = D.trails.find((x) => x.id === trail);
    storyList = t ? t.items : D.guides.map((g) => g.id);
    const show = expanded || t ? storyList : storyList.slice(0, 9);
    grid.replaceChildren();
    for (const id of show) {
      const g = guideById[id]; const c = el('button', 'scard'); c.type = 'button'; c.dataset.guide = id;
      const tag = el('span', 'tag'); tag.append(el('span', null, `${g.cat} · ${nodeById[g.node]?.pname || ''}`)); if (state.read.has(id)) tag.append(el('span', 'ok', '已读 ✓'));
      c.append(tag, el('span', 'hook', g.hook), el('span', 't', `${g.title} · ${g.date || ''}`));
      c.addEventListener('click', () => { openGuide(id, storyList); render(); });
      grid.append(c);
    }
    moreBtn.hidden = !!t || expanded || storyList.length <= 9;
    moreBtn.textContent = `显示全部 ${storyList.length} 篇`;
  }
  moreBtn.addEventListener('click', () => { expanded = true; render(); });
  render();
})();

// ---------- 柒 · 行军考场 ----------
(() => {
  const box = $('quiz-box');
  const QN = F.numberQuestions, MEET = F.meetings, PEOPLE = D.persons;
  const twins = [['两河口会议', '沙窝会议'], ['哈达铺干部会议', '榜罗镇会议'], ['黎平会议', '猴场会议']];
  const conflict = (a, b) => twins.some((t) => t.includes(a) && t.includes(b));
  const mainNodes = D.mainOrder.map((id) => nodeById[id]);
  function genNumber(used) { const q = pick(QN.filter((x) => !used.has(x.q)), 1)[0]; used.add(q.q); return { kind: '数字', text: q.q, options: shuffle(q.options), answer: q.answer, quote: q.quote, ref: q.ref }; }
  function genMeeting(used) {
    const m = pick(MEET.filter((x) => !used.has(x.name)), 1)[0]; used.add(m.name);
    const others = pick(MEET.filter((x) => x.name !== m.name && !conflict(x.name, m.name)), 3).map((x) => x.name);
    return { kind: '会议', text: `哪一次会议「${m.decision}」？`, options: shuffle([m.name, ...others]), answer: m.name, quote: m.decision, ref: m.ref };
  }
  function genPerson(used) {
    const p = pick(PEOPLE.filter((x) => !used.has(x.id)), 1)[0]; used.add(p.id);
    const masked = p.text.split(p.key).join('□□');
    const others = pick(PEOPLE.filter((x) => x.id !== p.id && !masked.includes(x.key)), 3).map((x) => x.key);
    return { kind: '人物', text: `下面这段资料说的是谁？\n「${masked}」`, options: shuffle([p.key, ...others]), answer: p.key, quote: p.text, ref: p.id, src: p };
  }
  function genOrder() {
    let ns; do { ns = pick(mainNodes, 4); } while (new Set(ns.map((n) => F.dateAnchors[n.id].iso.slice(0, 7))).size < 4);
    const sorted = ns.slice().sort((a, b) => F.dateAnchors[a.id].iso.localeCompare(F.dateAnchors[b.id].iso));
    return { kind: '排序', order: true, text: '按发生的先后，依次点下面四站：', options: ns.map((n) => n.pname), answer: sorted.map((n) => n.pname), nodes: sorted };
  }
  function genDate(used) {
    const n = pick(mainNodes.filter((x) => !used.has(x.id)), 1)[0]; used.add(n.id);
    const ds = [...new Set(D.nodes.map((x) => x.date))].filter((d) => d !== n.date && !d.includes(n.date) && !n.date.includes(d));
    return { kind: '时间', text: `「${n.pname}」发生在什么时候？`, options: shuffle([n.date, ...pick(ds, 3)]), answer: n.date, quote: n.text, ref: n.id, node: n };
  }
  const plan = ['数字', '会议', '人物', '排序', '时间', '数字', '人物', '会议', '排序', '数字'];
  let qs = [], qi = 0, score = 0;
  function newRound() {
    const used = new Set();
    qs = plan.map((k) => k === '数字' ? genNumber(used) : k === '会议' ? genMeeting(used) : k === '人物' ? genPerson(used) : k === '排序' ? genOrder() : genDate(used));
    qi = 0; score = 0; ask();
  }
  function head() {
    const top = el('div', 'quiz-top'); const bar = el('div', 'qbar'); const i = el('i'); i.style.width = (qi / qs.length * 100) + '%'; bar.append(i);
    top.append(el('span', 'qcount', `第 ${Math.min(qi + 1, qs.length)} / ${qs.length} 题`), bar, el('span', 'qcount', `得分 ${score}`)); return top;
  }
  function feedback(ok, q) {
    const f = el('div', 'feedback ' + (ok ? 'ok' : 'no')); f.setAttribute('role', 'status');
    f.append(el('b', null, ok ? '答对了。' : '再想想：正确答案是「' + (q.order ? q.answer.join(' → ') : q.answer) + '」。'));
    if (q.order) { f.append(el('br'), q.nodes.map((n) => `${n.pname}（${F.dateAnchors[n.id].label}）`).join(' → ')); }
    else {
      f.append(el('br'), '原文：“' + q.quote + '”');
      const m = D.refs[q.ref] || q.src || q.node; if (m) { f.append(el('br')); f.append(srcLink(m.source, m.url)); }
    }
    return f;
  }
  function ask() {
    box.replaceChildren();
    if (qi >= qs.length) return result();
    const q = qs[qi]; box.append(head(), el('div', 'qkind', q.kind + '题'));
    const qt = el('p', 'qtext'); q.text.split('\n').forEach((line, i) => { if (i) qt.append(el('br')); qt.append(line); }); box.append(qt);
    const opts = el('div', 'opts'); box.append(opts);
    const actions = el('div', 'qactions');
    const next = el('button', 'btn primary', qi === qs.length - 1 ? '看成绩' : '下一题 →'); next.type = 'button'; next.hidden = true; next.addEventListener('click', () => { qi++; ask(); box.scrollIntoView({ block: 'nearest' }); });
    const finish = (ok) => { if (ok) score++; opts.querySelectorAll('button').forEach((b) => (b.disabled = true)); box.insertBefore(feedback(ok, q), actions); next.hidden = false; next.focus({ preventScroll: true }); box.querySelector('.qcount:last-child').textContent = `得分 ${score}`; };
    if (q.order) {
      const chosen = [];
      const reset = el('button', 'btn ghost', '重新点'); reset.type = 'button';
      const btns = q.options.map((o) => {
        const b = el('button', 'opt'); b.type = 'button'; const ord = el('span', 'ord empty', ''); b.append(ord, o);
        b.addEventListener('click', () => {
          if (chosen.includes(o)) return; chosen.push(o); ord.textContent = chosen.length; ord.classList.remove('empty');
          if (chosen.length === q.options.length) {
            const ok = chosen.every((c, i) => c === q.answer[i]); reset.hidden = true;
            btns.forEach((x) => { const pos = q.answer.indexOf(x.dataset.v); x.classList.add(chosen.indexOf(x.dataset.v) === pos ? 'right' : 'wrong'); });
            finish(ok);
          }
        });
        b.dataset.v = o; opts.append(b); return b;
      });
      reset.addEventListener('click', () => { chosen.length = 0; btns.forEach((b) => { const o = b.querySelector('.ord'); o.textContent = ''; o.classList.add('empty'); }); });
      actions.append(reset);
    } else {
      for (const o of q.options) {
        const b = el('button', 'opt', o); b.type = 'button';
        b.addEventListener('click', () => { const ok = o === q.answer; b.classList.add(ok ? 'right' : 'wrong'); if (!ok) [...opts.children].find((x) => x.textContent === q.answer)?.classList.add('right'); finish(ok); });
        opts.append(b);
      }
    }
    actions.append(next); box.append(actions);
  }
  function result() {
    if (state.best == null || score > state.best) { state.best = score; saveState(); }
    const r = el('div', 'result'); const s = el('div', 'score', String(score)); s.append(el('small', null, ' / ' + qs.length));
    const msg = score === qs.length ? '全部答对。这一程的资料，你都记住了。' : score >= 7 ? '很扎实。答错的题，原文和出处就在上面那几步里。' : '继续行军：沙盘和故事里能找到每一题的答案。';
    r.append(s, el('p', null, msg));
    const a = el('div', 'qactions'); a.style.justifyContent = 'center';
    const again = el('button', 'btn', '再来一轮（换一套题）'); again.type = 'button'; again.addEventListener('click', newRound);
    const card = el('a', 'btn primary', '生成我的行军卡'); card.href = '#end'; card.addEventListener('click', () => setTimeout(makePoster, 300));
    a.append(again, card); r.append(a); box.append(r);
  }
  function intro() {
    box.replaceChildren(); const d = el('div', 'quiz-start');
    d.append(el('div', 'qkind', '每轮 10 题 · 题目每轮重新组合'), el('p', 'qtext', '你能记住多少长征路上的细节？'));
    d.append(el('p', null, `题库直接从知识库资料生成：${QN.length} 道数字题、${MEET.length} 次会议、${PEOPLE.length} 位人物、${D.mainOrder.length} 站的时间排序。答完每题都会给出原文和出处。`));
    const ul = el('ul'); for (const t of ['数字题：17 名勇士、7 只木船……这些数字出自哪里', '会议题：从资料原文里的决定，认出是哪一次会议', '人物题：遮住名字的人物资料，说的是谁', '排序题：四个站点，按先后顺序点一遍']) ul.append(el('li', null, t)); d.append(ul);
    const a = el('div', 'qactions'); const go = el('button', 'btn primary', '开始答题'); go.type = 'button'; go.addEventListener('click', newRound); a.append(go);
    if (state.best != null) a.append(el('span', 'qcount', `你的最好成绩：${state.best} / 10`));
    d.append(a); box.append(d);
  }
  intro();
})();

// ---------- 捌 · 结尾与行军卡 ----------
(() => {
  const q = F.closingQuotes[0]; const wrap = $('closing-quote');
  const bq = el('blockquote', 'big', '“' + q.quote + '”'); const cite = el('cite', null, '—— ' + q.who); cite.append(refBtn(q.ref)); bq.append(cite); wrap.append(bq);
  const sp = el('div', 'spirit'); sp.append(el('b', null, '长征精神')); sp.append(D.refs.jiangtaibao_spirit.text.replace(/^长征铸就了伟大的长征精神，这就是：/, '')); sp.append(refBtn('jiangtaibao_spirit')); wrap.append(sp);
  const m = $('method');
  const col = (h, ps) => { const d = el('div'); d.append(el('h4', null, h)); for (const p of ps) d.append(el('p', null, p)); m.append(d); };
  col('资料从哪里来', [`全部内容取自《长征路上》知识库：${D.counts.nodes} 个节点、${D.counts.materials} 条节点资料、${D.counts.stories} 篇已审核故事、${D.counts.persons} 条人物资料。每条资料都对应一个公开网页（共产党员网、人民网、中央党史和文献研究院等），页面上逐条附链接。`]);
  col('怎样保证不编造', ['图表里的日期、数字和会议决定，都写成“资料 ID + 原文片段”的结构化事实。构建时程序逐条到原文里查找，找不到就中止构建。页面运行时不调用任何模型，问答题也只从这些原文组卷。']);
  col('怎么看这一页', ['沙盘是地形示意，不画边界、不标行政区；路线为示意走向。“出发后第几天”按资料日期推算，以 1934 年 10 月 10 日中央机关从瑞金等地出发为起点。资料之间有分歧的地方，原文里已注明。']);
  $('foot').textContent = '数字长征 · 《长征路上》项目赛道二作品 · 史实资料来自项目知识库，转引的原文版权归原发布单位所有 · 本页离线可用，不收集任何个人信息。';
})();

function updatePassport() {
  const p = $('pstats'); if (!p) return; p.replaceChildren();
  const add = (v, l) => { const d = el('div'); d.append(el('b', null, v), el('span', null, l)); p.append(d); };
  add(`${state.visited.size}/${ALL.length}`, '走过的站点'); add(state.vn.done ? '已走完' : (Object.keys(state.vn.picks).length ? `${Object.keys(state.vn.picks).length}/6 幕` : '—'), '我的长征'); add(String(state.read.size), '读过的故事'); add(state.best == null ? '—' : `${state.best}/10`, '问答最好成绩');
}
updatePassport();

function makePoster() {
  const W2 = 1080, H2 = 1500, cv = document.createElement('canvas'); cv.width = W2; cv.height = H2; const g = cv.getContext('2d');
  const serif = '"STKaiti","KaiTi","Kaiti SC","Songti SC","Noto Serif CJK SC",serif', sans = 'system-ui,"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
  g.fillStyle = '#E5E3DC'; g.fillRect(0, 0, W2, H2);
  g.fillStyle = '#A9241C'; g.fillRect(0, 0, W2, 14);
  g.fillStyle = '#1D2023'; g.font = `88px ${serif}`; g.fillText('我的长征行军卡', 70, 150);
  g.fillStyle = '#5B6064'; g.font = `30px ${sans}`; g.fillText('1934.10 — 1935.10 · 中央红军长征 · 数字长征沙盘', 72, 205);
  const im = new Image();
  im.onload = () => {
    const mx = 60, my = 250, mw = W2 - 120, mh = mw * 10 / 16;
    g.save(); g.beginPath(); g.roundRect ? g.roundRect(mx, my, mw, mh, 18) : g.rect(mx, my, mw, mh); g.clip(); g.drawImage(im, mx, my, mw, mh); g.restore();
    const P = (p) => [mx + p[0] / 100 * mw, my + p[1] / 100 * mh];
    g.lineJoin = g.lineCap = 'round';
    g.strokeStyle = 'rgba(122,74,31,.5)'; g.lineWidth = 3; g.setLineDash([8, 9]); g.beginPath(); D.map.route.forEach((p, i) => { const [x, y] = P(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); g.setLineDash([]);
    const reached = D.mainOrder.filter((id) => state.visited.has(id));
    const last = reached.length ? Math.max(...reached.map((id) => D.routeIndex[id])) : 0;
    g.strokeStyle = '#B3261E'; g.lineWidth = 7; g.beginPath(); D.map.route.slice(0, last + 1).forEach((p, i) => { const [x, y] = P(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
    for (const id of ALL) { const [x, y] = P(nodeById[id].at); g.beginPath(); g.arc(x, y, state.visited.has(id) ? 9 : 6, 0, 7); g.fillStyle = state.visited.has(id) ? '#B3261E' : '#8c7a63'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#fff'; g.stroke(); }
    const sy = my + mh + 70;
    const stat = (x, v, l) => { g.fillStyle = '#A9241C'; g.font = `96px ${serif}`; g.fillText(v, x, sy + 70); g.fillStyle = '#5B6064'; g.font = `30px ${sans}`; g.fillText(l, x, sy + 120); };
    stat(72, `${state.visited.size}/${ALL.length}`, '走过的站点'); stat(330, state.vn.done ? '走完' : `${Object.keys(state.vn.picks).length}/6`, '剧情'); stat(530, String(state.read.size), '读过的故事'); stat(780, state.best == null ? '—' : `${state.best}/10`, '问答成绩');
    g.fillStyle = 'rgba(29,32,35,.15)'; g.fillRect(70, sy + 170, W2 - 140, 2);
    g.fillStyle = '#1D2023'; g.font = `46px ${serif}`;
    const q = F.closingQuotes[1].quote; const lines = q.match(/[^。]+。/g) || [q];
    lines.forEach((l, i) => g.fillText(l, 72, sy + 250 + i * 66));
    g.fillStyle = '#5B6064'; g.font = `28px ${sans}`; g.fillText('—— ' + F.closingQuotes[1].who, 72, sy + 250 + lines.length * 66 + 6);
    const who = ($('poster-name').value || '').trim().slice(0, 12);
    if (who) { g.fillStyle = '#A9241C'; g.font = `40px ${serif}`; g.textAlign = 'right'; g.fillText('行军人：' + who, W2 - 72, H2 - 120); g.textAlign = 'left'; }
    g.font = `24px ${sans}`; g.fillStyle = '#8A8E90';
    const d = new Date(); g.fillText(`生成于 ${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} · 史实资料来自《长征路上》知识库，逐条附出处`, 72, H2 - 50);
    const url = cv.toDataURL('image/png'); const box = $('poster'); box.replaceChildren(); const pi = el('img'); pi.src = url; pi.alt = '我的长征行军卡：路线进度与阅读、答题记录'; box.append(pi); box.hidden = false;
    let framed = true; try { framed = window.top !== window.self; } catch { /* 跨域框架内 */ }
    const save = $('save-poster'); save.href = url; save.hidden = framed;
    $('poster-note').textContent = (framed ? '长按或右键图片即可保存。' : '可以点“保存图片”，或长按 / 右键图片保存。') + '记录只保存在你这台设备的浏览器里。';
  };
  im.src = D.map.img;
}
$('make-poster').addEventListener('click', makePoster);
/*NOVEL_UI*/
})();
