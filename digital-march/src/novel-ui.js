// ---------- 壹 · 我的长征（互动小说播放器）----------
// 由 build.mjs 插入 app.js 的 IIFE 内部，可直接使用 D、F、$、el、sv、state、saveState、store、nodeById、march 等。
const novelUI = (() => {
  const N = D.novel, S = N.scenes;
  const nv = $('nv'), log = $('nv-log'), act = $('nv-act'), card = $('nv-card'), jbox = $('nv-journal');
  const mapBox = $('nv-map'), fxCanvas = $('nv-fx');
  const ABORT = Symbol('abort');
  let run = 0, pending = null, curScene = -1, lastFocus = null;
  let sound = store.get('novel-sound', true);
  const ROMAN = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五'];
  const refOf = (id) => D.refs[id] || (storyById[id] ? storyById[id] : null);

  // —— 声音：只在用户操作后用 WebAudio 合成短音 ——
  let ac = null;
  function tone(freq = 520, dur = .18, type = 'triangle', gain = .05) {
    if (!sound) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(gain, ac.currentTime); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + dur);
      o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + dur);
    } catch { /* 不支持音频时静默 */ }
  }
  const bugle = () => { tone(392, .22); setTimeout(() => tone(523, .22), 200); setTimeout(() => tone(659, .4), 400); };
  function setSound(v) { sound = v; store.set('novel-sound', v); const b = $('nv-sound'); b.textContent = v ? '声音 开' : '声音 关'; b.setAttribute('aria-pressed', String(v)); }
  $('nv-sound').addEventListener('click', () => setSound(!sound)); setSound(sound);

  // —— 背景：沙盘推到这一幕的位置 ——
  const mimg = el('img'); mimg.alt = ''; mimg.src = D.map.img; mapBox.append(mimg);
  function moveMap(nodeId, zoom = 2.3) {
    const vw = innerWidth, vh = innerHeight; const bw = Math.max(vw, vh * 1.6), bh = bw / 1.6;
    mimg.style.width = bw + 'px'; mimg.style.height = bh + 'px';
    const n = nodeId ? nodeById[nodeId] : null; const px = n ? n.at[0] / 100 : .5, py = n ? n.at[1] / 100 : .5; const s = n ? zoom : 1.05;
    let tx = vw / 2 - px * bw * s, ty = vh * .45 - py * bh * s;
    tx = Math.min(0, Math.max(vw - bw * s, tx)); ty = Math.min(0, Math.max(vh - bh * s, ty));
    mimg.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
  }

  // —— 天气与氛围粒子 ——
  const fx = (() => {
    const c = fxCanvas, g = c.getContext('2d'); let kind = null, parts = [], raf = 0, w = 0, h = 0, t = 0;
    const size = () => { const d = Math.min(devicePixelRatio || 1, 2); w = c.width = innerWidth * d; h = c.height = innerHeight * d; };
    const R = Math.random;
    const spawn = {
      snow: () => ({ x: R() * w, y: R() * h, r: R() * 2.2 + .6, vy: R() * .8 + .4, vx: R() * .6 - .3 }),
      rain: () => ({ x: R() * w, y: R() * h, l: R() * 14 + 10, vy: R() * 6 + 9 }),
      fire: () => ({ x: R() * w, y: h + R() * h * .3, r: R() * 2 + .8, vy: -(R() * 1.4 + .6), vx: R() * .8 - .4, a: R() }),
      torch: () => ({ x: R() * w, y: h + R() * 40, r: R() * 1.6 + .6, vy: -(R() * .9 + .3), vx: R() * .5 - .25, a: R() }),
      river: () => ({ x: R() * w, y: h * (.55 + R() * .45), l: R() * 80 + 40, vx: R() * 1.2 + .6 }),
      lake: () => ({ x: R() * w, y: h * (.6 + R() * .4), l: R() * 50 + 20, vx: R() * .3 + .1, a: R() }),
      night: () => ({ x: R() * w, y: R() * h * .6, r: R() * 1.3 + .3, a: R() }),
      dawn: () => ({ x: R() * w, y: R() * h, r: R() * 1.5 + .5, vy: -(R() * .2 + .05), a: R() }),
      gold: () => ({ x: R() * w, y: R() * h, r: R() * 1.8 + .5, vy: -(R() * .25 + .05), a: R() }),
    };
    const counts = { snow: 160, rain: 140, fire: 90, torch: 50, river: 46, lake: 30, night: 120, dawn: 50, gold: 70 };
    function frame() {
      t++; g.clearRect(0, 0, w, h);
      for (const p of parts) {
        if (kind === 'snow') { p.y += p.vy; p.x += p.vx + Math.sin((t + p.y) / 60) * .3; if (p.y > h) { p.y = -5; p.x = R() * w; } g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); }
        else if (kind === 'rain') { p.y += p.vy; p.x -= 1.2; if (p.y > h) { p.y = -20; p.x = R() * w; } g.strokeStyle = 'rgba(190,210,225,.35)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - 3, p.y + p.l); g.stroke(); }
        else if (kind === 'fire' || kind === 'torch') { p.y += p.vy; p.x += p.vx + Math.sin((t + p.x) / 30) * .3; p.a -= .004; if (p.y < 0 || p.a <= 0) Object.assign(p, spawn[kind](), { a: 1 }); g.fillStyle = `rgba(255,${120 + (p.r * 30 | 0)},40,${Math.max(0, p.a) * .8})`; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); }
        else if (kind === 'river' || kind === 'lake') { p.x += p.vx; if (p.x > w + p.l) { p.x = -p.l; } g.strokeStyle = kind === 'river' ? 'rgba(170,205,230,.22)' : `rgba(200,225,240,${.1 + .12 * Math.sin(t / 40 + p.a * 6)})`; g.lineWidth = 1.5; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + p.l, p.y); g.stroke(); }
        else { if (p.vy) { p.y += p.vy; if (p.y < 0) p.y = h; } const a = .25 + .35 * Math.sin(t / 50 + p.a * 6); g.fillStyle = kind === 'night' ? `rgba(255,255,255,${a})` : `rgba(255,214,150,${a * .7})`; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); }
      }
      raf = requestAnimationFrame(frame);
    }
    return {
      set(k) {
        kind = k; cancelAnimationFrame(raf); size(); g.clearRect(0, 0, w, h);
        nv.dataset.fx = k || '';
        if (!k || !spawn[k] || reduceMotion) return;
        parts = Array.from({ length: counts[k] }, spawn[k]); frame();
      },
      stop() { cancelAnimationFrame(raf); kind = null; },
      resize: size,
    };
  })();

  // —— 文字：逐段出现，点一下继续 ——
  function passageEl(ps, extraCls = '') {
    const d = el('div', 'nv-p ' + (ps.frame ? 'frame' : 'hist') + (extraCls ? ' ' + extraCls : ''));
    const t = el('p'); d.append(t);
    if (!ps.frame && ps.src) {
      const s = el('div', 'nv-src');
      const seen = new Set();
      for (const id of ps.src) { const r = refOf(id); if (!r || seen.has(r.source)) continue; seen.add(r.source); const b = el('button', null, '据' + r.source); b.type = 'button'; b.addEventListener('click', (e) => { e.stopPropagation(); openRef(id); }); s.append(b); }
      d.append(s);
    }
    return { d, t };
  }
  const scrollEnd = () => { log.scrollTo({ top: log.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' }); };
  function waitAdvance(label = '继续 ▸') {
    const my = run;
    return new Promise((res) => {
      act.replaceChildren(); const b = el('button', 'nv-next', label); b.type = 'button'; act.append(b);
      const done = () => { pending = null; res(my === run ? true : ABORT); };
      pending = () => res(ABORT);
      b.addEventListener('click', done, { once: true }); b.focus({ preventScroll: true });
      log.onclick = (e) => { if (e.target.closest('button,a')) return; log.onclick = null; b.click(); };
    });
  }
  async function say(ps, cls) {
    const my = run; const { d, t } = passageEl(ps, cls); log.append(d); scrollEnd();
    if (reduceMotion) t.textContent = ps.t;
    else {
      let i = 0, skip = false; const txt = ps.t;
      const stopSkip = (e) => { if (!e.target.closest('button,a')) skip = true; };
      log.addEventListener('click', stopSkip);
      act.replaceChildren(); const sk = el('button', 'nv-next ghost', '跳过 ▸▸'); sk.type = 'button'; sk.addEventListener('click', () => { skip = true; }); act.append(sk);
      await new Promise((res) => { const step = () => { if (my !== run) return res(); if (skip) { t.textContent = txt; return res(); } i += 2; t.textContent = txt.slice(0, i); if (i % 16 === 0) scrollEnd(); if (i >= txt.length) return res(); setTimeout(step, 22); }; step(); });
      log.removeEventListener('click', stopSkip);
    }
    if (my !== run) throw ABORT;
    scrollEnd();
    if ((await waitAdvance()) === ABORT) throw ABORT;
  }
  function noteBox(text) { const n = el('div', 'nv-note'); n.append(el('b', null, '资料说明'), text); log.append(n); scrollEnd(); }

  // —— 小游戏 ——
  function stageBox(title) { const b = el('div', 'nv-stage'); b.append(el('div', 'nv-stage-t', title)); log.append(b); scrollEnd(); return b; }
  function holdButton(label, onProgress, ms = 2200) {
    // 按住推进；短按每次推进一段；键盘空格 / 回车同样有效
    const my = run;
    return new Promise((res) => {
      act.replaceChildren(); const b = el('button', 'nv-hold'); b.type = 'button'; const fill = el('i'); b.append(fill, el('span', null, label)); act.append(b); b.focus({ preventScroll: true });
      let v = 0, holding = false, last = 0, raf = 0;
      const set = (x) => { v = Math.min(1, x); fill.style.width = (v * 100) + '%'; onProgress(v); if (v >= 1) { cancelAnimationFrame(raf); pending = null; setTimeout(() => res(my === run ? true : ABORT), 250); } };
      const loop = (ts) => { if (!holding || v >= 1) return; if (last) set(v + (ts - last) / ms); last = ts; raf = requestAnimationFrame(loop); };
      const start = (e) => { e.preventDefault(); if (holding) return; holding = true; last = 0; raf = requestAnimationFrame(loop); tone(300, .08); };
      const end = () => { if (!holding) return; holding = false; cancelAnimationFrame(raf); if (v < 1) set(v + .06); };
      b.addEventListener('pointerdown', start); addEventListener('pointerup', end); b.addEventListener('pointerleave', end); b.addEventListener('pointercancel', end);
      b.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) start(e); });
      b.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') end(); });
      pending = () => res(ABORT);
    });
  }
  const minis = {
    async bridge(m) {
      const box = stageBox(m.title);
      const svg = sv('svg', { viewBox: '0 0 400 150', class: 'mini-svg' }, box);
      sv('rect', { x: 0, y: 40, width: 400, height: 70, class: 'm-water' }, svg);
      for (let i = 0; i < 5; i++) sv('path', { d: `M0 ${55 + i * 12} q 50 -6 100 0 t 100 0 t 100 0 t 100 0`, class: 'm-wave' }, svg);
      sv('rect', { x: 0, y: 30, width: 22, height: 90, class: 'm-bank' }, svg); sv('rect', { x: 378, y: 30, width: 22, height: 90, class: 'm-bank' }, svg);
      const planks = Array.from({ length: 16 }, (_, i) => { const r = sv('rect', { x: 22 + i * 22.2, y: 68, width: 20, height: 14, class: 'm-plank' }, svg); r.style.opacity = 0; return r; });
      const sky = sv('text', { x: 200, y: 22, class: 'm-cap', 'text-anchor': 'middle' }, svg); sky.textContent = '傍晚';
      if ((await holdButton(m.build, (v) => planks.forEach((p, i) => { p.style.opacity = v * 16 > i ? 1 : 0; }))) === ABORT) throw ABORT;
      tone(660, .25); sky.textContent = '凌晨'; box.classList.add('dawn');
      if ((await holdButton(m.remove, (v) => planks.forEach((p, i) => { p.style.opacity = (1 - v) * 16 > i ? 1 : 0; }))) === ABORT) throw ABORT;
      sky.textContent = '天亮前，河面上看不出桥';
    },
    async chishui() {
      const box = stageBox('同一条河，渡了四次');
      const C = F.chishuiSteps; const svg = sv('svg', { viewBox: '0 0 400 190', class: 'mini-svg' }, box);
      sv('path', { d: 'M200 0 q 18 24 0 48 t 0 48 t 0 48 t 0 48', class: 'm-river' }, svg);
      sv('text', { x: 90, y: 16, class: 'm-cap', 'text-anchor': 'middle' }, svg).textContent = '西岸';
      sv('text', { x: 310, y: 16, class: 'm-cap', 'text-anchor': 'middle' }, svg).textContent = '东岸';
      const pts = C.map((c, i) => [c.side === 'west' ? 90 : 310, 34 + i * 20]);
      const line = sv('polyline', { points: pts[0].join(','), class: 'm-path' }, svg);
      const dot = sv('circle', { cx: pts[0][0], cy: pts[0][1], r: 7, class: 'm-token' }, svg);
      const info = el('p', 'nv-mini-info'); box.append(info);
      const cnt = el('span', 'nv-mini-count tape'); box.append(cnt);
      let crossed = 0;
      for (let i = 0; i < C.length; i++) {
        const c = C[i]; line.setAttribute('points', pts.slice(0, i + 1).map((p) => p.join(',')).join(' ')); dot.setAttribute('cx', pts[i][0]); dot.setAttribute('cy', pts[i][1]);
        if (c.kind === 'cross') { crossed++; tone(440 + crossed * 60, .2); }
        const t = el('span', null, `${c.date} · ${c.title}：${c.text}。`); info.replaceChildren(t);
        cnt.textContent = `已渡 ${crossed} / 4`; scrollEnd();
        if (i < C.length - 1) { if ((await waitAdvance(C[i + 1].kind === 'cross' ? '渡河 ▸' : '继续 ▸')) === ABORT) throw ABORT; }
      }
      box.append(el('p', 'nv-mini-note', '示意图：横向表示在河的哪一岸，纵向表示先后，不表示实际位置。'));
    },
    async bugle() {
      const box = stageBox('听号音前进');
      const lamp = el('div', 'nv-lamp'); lamp.append(el('i'), el('span', null, '等待号音')); box.append(lamp);
      const msg = el('p', 'nv-mini-info', '号音响起时再点“前进”。'); box.append(msg);
      let ok = 0, lit = false, timer = 0; const my = run;
      await new Promise((res) => {
        act.replaceChildren(); const b = el('button', 'nv-next', '前进'); b.type = 'button'; act.append(b); b.focus({ preventScroll: true });
        const arm = () => { lit = false; lamp.classList.remove('on'); lamp.lastChild.textContent = '在江边停止，等待号音'; timer = setTimeout(() => { if (my !== run) return; lit = true; lamp.classList.add('on'); lamp.lastChild.textContent = '号音！'; bugle(); }, 900 + Math.random() * 1600); };
        b.addEventListener('click', () => {
          if (my !== run) return;
          if (!lit) { msg.textContent = '还没有号音。部队到江边必须停止，听号音前进。'; box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); return; }
          ok++; msg.textContent = `第 ${ok} 批按次上船。`; clearTimeout(timer);
          if (ok >= 3) { lamp.classList.remove('on'); lamp.lastChild.textContent = '三批都已按次上船'; pending = null; res(); } else arm();
        });
        pending = () => { clearTimeout(timer); res(); };
        arm();
      });
      if (my !== run) throw ABORT;
    },
    async chains(m) {
      const box = stageBox(m.title);
      const svg = sv('svg', { viewBox: '0 0 400 170', class: 'mini-svg' }, box);
      sv('rect', { x: 0, y: 128, width: 400, height: 42, class: 'm-water' }, svg);
      for (let i = 0; i < 9; i++) sv('path', { d: `M30 ${62 + i * 6} Q 200 ${92 + i * 6} 370 ${62 + i * 6}`, class: 'm-chain' }, svg);
      for (const y of [22, 30]) { sv('path', { d: `M30 ${y} Q 200 ${y + 30} 370 ${y}`, class: 'm-chain hand' }, svg); }
      sv('rect', { x: 10, y: 14, width: 22, height: 120, class: 'm-bank' }, svg); sv('rect', { x: 368, y: 14, width: 22, height: 120, class: 'm-bank' }, svg);
      sv('text', { x: 200, y: 160, class: 'm-cap', 'text-anchor': 'middle' }, svg).textContent = '13 根铁索：9 根桥面，两边各 2 根扶手（示意）';
      const planks = Array.from({ length: 14 }, (_, i) => { const x = 36 + i * 23.5; const tt = (x - 30) / 340; const yy = 62 + 4 * 30 * tt * (1 - tt) * 1 + 22; const r = sv('rect', { x, y: yy - 6, width: 20, height: 52, class: 'm-plank' }, svg); r.style.opacity = 0; return r; });
      const flame = sv('ellipse', { cx: 370, cy: 70, rx: 40, ry: 60, class: 'm-flame' }, svg); flame.style.opacity = 0;
      if ((await holdButton(m.action, (v) => { planks.forEach((p, i) => { p.style.opacity = v * 14 > i ? 1 : 0; }); flame.style.opacity = v > .7 ? (v - .7) / .3 : 0; if (v > .7) fx.set('fire'); }, 3000)) === ABORT) throw ABORT;
      tone(220, .5, 'sawtooth', .03);
    },
    async climb(m) {
      const box = stageBox(m.title);
      const svg = sv('svg', { viewBox: '0 0 400 170', class: 'mini-svg' }, box);
      const path = 'M10 160 L80 130 L120 138 L170 95 L210 104 L255 58 L290 66 L330 22 L390 160 Z';
      sv('path', { d: path, class: 'm-mount' }, svg);
      sv('path', { d: 'M300 48 L330 22 L352 52 L338 46 L326 56 L312 46 Z', class: 'm-snowcap' }, svg);
      const trail = [[10, 160], [80, 130], [120, 138], [170, 95], [210, 104], [255, 58], [290, 66], [330, 22]];
      const segs = [0]; for (let i = 1; i < trail.length; i++) segs.push(segs[i - 1] + Math.hypot(trail[i][0] - trail[i - 1][0], trail[i][1] - trail[i - 1][1]));
      const total = segs[segs.length - 1];
      const at = (v) => { const d = v * total; let i = 1; while (i < segs.length - 1 && segs[i] < d) i++; const k = (d - segs[i - 1]) / (segs[i] - segs[i - 1] || 1); return [trail[i - 1][0] + (trail[i][0] - trail[i - 1][0]) * k, trail[i - 1][1] + (trail[i][1] - trail[i - 1][1]) * k]; };
      const me = sv('circle', { r: 6, class: 'm-token' }, svg); const [x0, y0] = at(0); me.setAttribute('cx', x0); me.setAttribute('cy', y0);
      const alt = el('span', 'nv-mini-count tape', '山脚'); box.append(alt);
      const steps = m.steps || []; let shown = 0;
      for (let k = 0; k < steps.length; k++) {
        const from = k / steps.length, to = (k + 1) / steps.length;
        if ((await holdButton(m.action, (v) => { const [x, y] = at(from + (to - from) * v); me.setAttribute('cx', x); me.setAttribute('cy', y); alt.textContent = k === steps.length - 1 && v >= 1 ? '山顶' : '往上爬……'; }, 1500)) === ABORT) throw ABORT;
        shown++; await say(steps[k], 'climb-step');
      }
      return shown;
    },
    async tussock(m) {
      const box = stageBox(m.title);
      const grid = el('div', 'nv-bog'); box.append(grid);
      const cols = 5, rows = 4; const cells = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const b = el('button', 'tuft'); b.type = 'button'; b.setAttribute('aria-label', '草甸'); grid.append(b); cells.push(b); }
      const msg = el('p', 'nv-mini-info', m.hint || ''); box.append(msg);
      const pathIdx = []; let c = Math.floor(Math.random() * cols);
      for (let r = rows - 1; r >= 0; r--) { pathIdx.push(r * cols + c); c = Math.max(0, Math.min(cols - 1, c + (Math.random() < .5 ? -1 : 1))); pathIdx.push(r * cols + c); }
      const seq = [...new Set(pathIdx)];
      const my = run;
      await new Promise((res) => {
        let k = 0; act.replaceChildren(el('span', 'nv-act-hint', '点亮起的草甸'));
        const mark = () => { cells.forEach((b) => b.classList.remove('next')); if (k < seq.length) { cells[seq[k]].classList.add('next'); cells[seq[k]].focus({ preventScroll: true }); } };
        cells.forEach((b, i) => b.addEventListener('click', () => {
          if (my !== run || k >= seq.length) return;
          if (i === seq[k]) { b.classList.add('stepped'); tone(330 + k * 25, .1); k++; msg.textContent = `跳过 ${k} / ${seq.length} 个草甸`; if (k >= seq.length) { cells.forEach((x) => { x.classList.remove('next'); x.disabled = true; }); msg.textContent = `走过了 ${seq.length} 个草甸。`; pending = null; res(); } else mark(); }
          else { b.classList.add('mud'); setTimeout(() => b.classList.remove('mud'), 600); msg.textContent = '这里是泥潭。稍不小心踩进泥潭就很难拔出来。'; }
        }));
        pending = () => res(); mark();
      });
      if (my !== run) throw ABORT;
    },
  };

  // —— 见闻本 ——
  const jKey = (si, ci) => `${S[si].id}:${ci}`;
  function renderJournal() {
    $('nv-jn').textContent = state.journal.size;
    jbox.replaceChildren(); const h = el('div', 'nv-j-head'); h.append(el('h3', null, '见闻本')); const x = el('button', 'nv-tool', '收起'); x.type = 'button'; x.addEventListener('click', () => { jbox.hidden = true; }); h.append(x); jbox.append(h);
    if (!state.journal.size) { jbox.append(el('p', 'nv-j-empty', '还没有记下见闻。在每一幕里选一件事去看，就会记在这里。')); return; }
    S.forEach((sc, si) => sc.choices.forEach((c, ci) => {
      if (!state.journal.has(jKey(si, ci))) return;
      const it = el('div', 'nv-j-item'); it.append(el('span', 'nv-j-k', `第${ROMAN[si]}幕 · ${sc.place}`), el('b', null, c.label), el('p', null, c.body[0].t)); jbox.append(it);
    }));
  }
  $('nv-jbtn').addEventListener('click', () => { renderJournal(); jbox.hidden = !jbox.hidden; });

  // —— 场景流程 ——
  function dots(i) { const d = $('nv-dots'); d.replaceChildren(); S.forEach((sc, j) => { const s = el('i', j < i ? 'done' : j === i ? 'cur' : ''); d.append(s); }); }
  let troops = '';
  function setTop(sc) {
    $('nv-when').textContent = sc ? sc.when : '1934 年 10 月';
    $('nv-place').textContent = sc ? sc.place : '出发之前';
    if (sc && sc.troops) troops = sc.troops;
    $('nv-troops').textContent = troops ? `中央红军：${troops}` : '';
    $('nv-troops').title = '资料记载的人数，只在资料给出数字的地方更新';
  }
  async function titleCard(no, sc) {
    card.replaceChildren(); card.append(el('span', 'nv-card-no', no), el('h2', null, sc ? sc.place.split(' · ').pop() : N.title), el('span', 'nv-card-when tape', sc ? sc.when : '1934 — 1935'));
    card.hidden = false; card.classList.remove('out'); tone(196, .5, 'sine', .04);
    const my = run;
    await new Promise((r) => { const t = setTimeout(r, reduceMotion ? 300 : 1700); card.onclick = () => { clearTimeout(t); r(); }; });
    if (my !== run) throw ABORT;
    card.classList.add('out'); setTimeout(() => { if (card.classList.contains('out')) card.hidden = true; }, 500);
  }
  function choose(si, seen) {
    const sc = S[si]; const my = run;
    return new Promise((res) => {
      act.replaceChildren(); const box = el('div', 'nv-choices'); box.setAttribute('role', 'group'); box.setAttribute('aria-label', '你要去看哪件事');
      sc.choices.forEach((c, ci) => {
        const b = el('button', 'nv-choice' + (seen.has(ci) ? ' seen' : '') + (c.other ? ' other' : '')); b.type = 'button';
        b.append(el('span', null, c.label)); if (c.other) b.append(el('small', null, '另一路红军'));
        b.addEventListener('click', () => { pending = null; res(my === run ? ci : ABORT); }); box.append(b);
      });
      const go = el('button', 'nv-choice go', si === S.length - 1 ? '走完这一程 ▸' : `继续行军：${S[si + 1].place.split(' · ').pop()} ▸`); go.type = 'button';
      if (!seen.size) { go.disabled = true; go.title = '先选一件事去看看'; }
      go.addEventListener('click', () => { pending = null; res(my === run ? 'next' : ABORT); }); box.append(go);
      act.append(box); pending = () => res(ABORT);
      (box.querySelector('.nv-choice:not(.seen)') || go).focus({ preventScroll: true });
    });
  }
  async function playScene(si) {
    const sc = S[si]; curScene = si; store.set('novel-at', si);
    log.replaceChildren(); act.replaceChildren(); dots(si); setTop(sc); moveMap(sc.node); fx.set(sc.fx);
    await titleCard(`第${ROMAN[si]}幕`, sc);
    for (const ps of sc.intro) await say(ps);
    if (sc.mini) {
      if (sc.mini.before) await say(sc.mini.before);
      const r = await minis[sc.mini.type](sc.mini); if (r === ABORT) throw ABORT;
      if (sc.mini.after) await say(sc.mini.after);
      fx.set(sc.fx);
    }
    if (sc.note) noteBox(sc.note);
    const seen = new Set();
    for (;;) {
      const ci = await choose(si, seen); if (ci === ABORT) throw ABORT; if (ci === 'next') break;
      const c = sc.choices[ci]; seen.add(ci);
      const h = el('div', 'nv-chosen', '▸ ' + c.label); log.append(h);
      for (const ps of c.body) await say(ps, c.other ? 'other' : '');
      if (c.note) noteBox(c.note);
      if (!state.journal.has(jKey(si, ci))) { state.journal.add(jKey(si, ci)); saveState(); $('nv-jn').textContent = state.journal.size; tone(880, .12); }
    }
    for (const ps of sc.outro) await say(ps);
    if (!state.visited.has(sc.node)) { state.visited.add(sc.node); saveState(); }
    renderActs();
    if (si < S.length - 1) return playScene(si + 1);
    return ending();
  }
  async function prologue() {
    curScene = -1; log.replaceChildren(); dots(-1); troops = ''; setTop(null); moveMap('start', 1.6); fx.set('night');
    await titleCard('序幕', null);
    for (const ps of N.prologue) await say(ps);
    troops = '8.6 万余人';
    return playScene(0);
  }
  function ending() {
    store.set('novel-at', 0); store.set('novel-done', true); renderActs();
    log.replaceChildren(); act.replaceChildren(); moveMap(null); fx.set('gold'); dots(S.length);
    const e = el('div', 'nv-end');
    e.append(el('span', 'nv-card-no', '终章'), el('h2', null, '你走完了这一程'));
    e.append(el('p', null, `从于都河到吴起镇，${S.length} 幕。你在见闻本里记下了 ${state.journal.size} 件事。`));
    const q = F.closingQuotes[0]; const bq = el('blockquote', null, '“' + q.quote + '”'); bq.append(el('cite', null, '—— ' + q.who)); e.append(bq);
    const row = el('div', 'nv-end-row');
    const mk = (label, fn, cls = '') => { const b = el('button', 'nv-choice ' + cls, label); b.type = 'button'; b.addEventListener('click', fn); row.append(b); };
    mk('生成我的行军卡', () => { close(); location.hash = '#end'; setTimeout(makePoster, 300); }, 'go');
    mk('在沙盘上看全程', () => { close(); march.goTo('start'); });
    mk('去行军考场答题', () => { close(); location.hash = '#quiz'; });
    mk('从头再走一遍', () => start(-1));
    e.append(row); log.append(e);
  }

  function start(si = -1) {
    run++; if (pending) { const p = pending; pending = null; p(); }
    lastFocus = lastFocus || document.activeElement;
    if (nv.hidden) { nv.hidden = false; document.body.classList.add('nv-open'); }
    jbox.hidden = true; renderJournal();
    troops = ''; for (let k = 0; k <= si; k++) if (S[k].troops) troops = S[k].troops; if (si >= 0 && !troops) troops = '8.6 万余人';
    const go = si < 0 ? prologue() : playScene(si);
    go.catch((e) => { if (e !== ABORT) console.error(e); });
  }
  function close() {
    run++; if (pending) { const p = pending; pending = null; p(); }
    nv.hidden = true; document.body.classList.remove('nv-open'); fx.stop(); card.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); lastFocus = null;
  }
  $('nv-close').addEventListener('click', close);
  addEventListener('keydown', (e) => {
    if (nv.hidden) return;
    if (e.key === 'Escape') { if (!jbox.hidden) jbox.hidden = true; else close(); }
    if ((e.key === 'ArrowRight' || e.key === 'PageDown') && act.querySelector('.nv-next')) act.querySelector('.nv-next').click();
  });
  addEventListener('resize', () => { if (nv.hidden) return; fx.resize(); moveMap(curScene >= 0 ? S[curScene].node : 'start', curScene >= 0 ? 2.3 : 1.6); });

  // —— 页面上的入口：十四幕目录 ——
  function renderActs() {
    const box = $('acts'); box.replaceChildren();
    S.forEach((sc, si) => {
      const li = el('li'); const reached = store.get('novel-done', false) || store.get('novel-at', 0) > si; const b = el('button', 'act' + (reached ? ' done' : ''));
      b.type = 'button'; b.append(el('span', 'act-no', `第${ROMAN[si]}幕`), el('span', 'act-place', sc.place.split(' · ').pop()), el('span', 'act-when tape', sc.when));
      const mine = sc.choices.filter((_, ci) => state.journal.has(jKey(si, ci))).length; if (mine) b.append(el('span', 'act-seen', `见闻 ${mine}/${sc.choices.length}`));
      b.addEventListener('click', () => start(si)); li.append(b); box.append(li);
    });
    const at = store.get('novel-at', 0), done = store.get('novel-done', false);
    const btn = $('novel-start'); btn.textContent = at > 0 && !done ? `接着走：第${ROMAN[at]}幕 ${S[at].place.split(' · ').pop()}` : '背上行装，出发';
    $('novel-progress').textContent = state.journal.size ? `已记下 ${state.journal.size} 件见闻` : `${S.length} 幕 · 约 20 分钟`;
  }
  $('novel-start').addEventListener('click', () => { const at = store.get('novel-at', 0); start(at > 0 && !store.get('novel-done', false) ? at : -1); });
  $('hero-novel').addEventListener('click', () => start(-1));
  renderActs();
  return { start, close };
})();
