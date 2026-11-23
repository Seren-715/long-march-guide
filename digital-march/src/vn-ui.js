// ---------- 壹 · 我的长征（galgame 播放器）----------
// 由 build.mjs 插入 app.js 的 IIFE 内部，可直接使用 D、F、$、el、state、saveState、store、march、openRef、reduceMotion 等。
const vnUI = (() => {
  const V = D.vn, SC = V.scenes, CAST = V.cast, IMG = V.img;
  const root = $('vn'), stage = $('vn-stage'), box = $('vn-box'), nameEl = $('vn-name'), textEl = $('vn-text');
  const cardEl = $('vn-card'), choicesEl = $('vn-choices'), chapterEl = $('vn-chapter'), endEl = $('vn-end'), logEl = $('vn-log');
  const bgA = $('vn-bg-a'), bgB = $('vn-bg-b'), blur = $('vn-blur'), charsEl = $('vn-chars');
  const ABORT = Symbol('abort');
  let run = 0, pending = null, auto = false, skip = false, lastFocus = null, curBg = null, frontIsA = true;
  const log = [];
  const sceneIdx = (id) => SC.findIndex((s) => s.id === id);
  const choiceScenes = SC.filter((s) => s.lines.some((l) => l.choice));

  // —— 环境声：全部用 WebAudio 现场合成，不加载音频文件 ——
  const audio = (() => {
    let ac = null, master = null, noise = null, brown = null, layers = [], crackleTimer = 0, on = store.get('vn-sound', true);
    function init() {
      if (ac) return true;
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return false; }
      master = ac.createGain(); master.gain.value = on ? .8 : 0; master.connect(ac.destination);
      const len = ac.sampleRate * 3;
      noise = ac.createBuffer(1, len, ac.sampleRate); const w = noise.getChannelData(0); for (let i = 0; i < len; i++) w[i] = Math.random() * 2 - 1;
      brown = ac.createBuffer(1, len, ac.sampleRate); const b = brown.getChannelData(0); let last = 0; for (let i = 0; i < len; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; b[i] = last * 3.5; }
      return true;
    }
    function src(buf) { const s = ac.createBufferSource(); s.buffer = buf; s.loop = true; s.start(0, Math.random() * 2); return s; }
    function lfo(param, rate, depth, base) { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = rate; g.gain.value = depth; o.connect(g).connect(param); param.value = base; o.start(); return o; }
    const make = {
      wind(level = .5, f = 420) { const s = src(noise), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = .7; const g = ac.createGain(); s.connect(bp).connect(g); lfo(bp.frequency, .07, f * .4, f); lfo(g.gain, .11, level * .45, level * .7); return { out: g, nodes: [s] }; },
      rain(level = .4) { const s = src(noise), hp = ac.createBiquadFilter(), lp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900; lp.type = 'lowpass'; lp.frequency.value = 7000; const g = ac.createGain(); g.gain.value = level * .5; s.connect(hp).connect(lp).connect(g); return { out: g, nodes: [s] }; },
      river(level = .6, f = 520) { const s = src(brown), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = f; const g = ac.createGain(); s.connect(lp).connect(g); lfo(g.gain, .05, level * .2, level); return { out: g, nodes: [s] }; },
      pad(level = .05, notes = [110, 164.8, 220]) {
        const g = ac.createGain(); g.gain.value = 0; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(g);
        const nodes = notes.map((f, i) => { const o = ac.createOscillator(); o.type = i ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = (i - 1) * 4; const og = ac.createGain(); og.gain.value = 1 / notes.length; o.connect(og).connect(lp); o.start(); return o; });
        lfo(g.gain, .06, level * .35, level); return { out: g, nodes };
      },
    };
    const presets = {
      'wind-soft': [['wind', .25, 380], ['pad', .035, [98, 146.8, 196]]],
      river: [['river', .55, 600], ['wind', .12, 300]],
      'river-rain': [['river', .45, 700], ['rain', .25], ['wind', .1, 300]],
      torrent: [['river', .9, 950], ['rain', .3], ['wind', .15, 500]],
      blizzard: [['wind', .7, 520], ['wind', .4, 900], ['rain', .06]],
      rain: [['rain', .55], ['wind', .2, 350]],
      'rain-fire': [['rain', .35], ['wind', .12, 300], 'crackle'],
      evening: [['wind', .18, 320], ['pad', .05, [110, 164.8, 220, 277.2]]],
      finale: [['pad', .07, [130.8, 196, 261.6, 329.6]], ['wind', .12, 300]],
    };
    function crackle(onOff) {
      clearInterval(crackleTimer); if (!onOff) return;
      crackleTimer = setInterval(() => {
        if (!ac || Math.random() > .55) return;
        const s = ac.createBufferSource(); s.buffer = noise; const hp = ac.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 1500 + Math.random() * 2500; const g = ac.createGain();
        const t = ac.currentTime; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.15 + Math.random() * .2, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + .04 + Math.random() * .08);
        s.connect(hp).connect(g).connect(master); s.start(t, Math.random() * 2); s.stop(t + .15);
      }, 90);
    }
    function set(name) {
      if (!init()) return; if (ac.state === 'suspended') ac.resume();
      const t = ac.currentTime;
      for (const l of layers) { l.out.gain.cancelScheduledValues(t); l.out.gain.setTargetAtTime(0, t, .8); const n = l.nodes; setTimeout(() => { n.forEach((x) => { try { x.stop(); } catch { /* 已停止 */ } }); l.out.disconnect(); }, 4000); }
      layers = []; crackle(false);
      for (const spec of presets[name] || []) {
        if (spec === 'crackle') { crackle(true); continue; }
        const [kind, ...args] = spec; const l = make[kind](...args);
        const target = l.out.gain.value; const fin = ac.createGain(); fin.gain.value = 0; l.out.connect(fin).connect(master); fin.gain.setTargetAtTime(1, t, 1.2);
        layers.push({ out: fin, nodes: l.nodes }); void target;
      }
    }
    function stop() { if (!ac) return; set(null); }
    function toggle(v) { on = v; store.set('vn-sound', v); if (master) master.gain.setTargetAtTime(v ? .8 : 0, ac.currentTime, .2); }
    function chime() { if (!ac || !on) return; const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = 660; const t = ac.currentTime; g.gain.setValueAtTime(.06, t); g.gain.exponentialRampToValueAtTime(.0001, t + .6); o.connect(g).connect(master); o.start(); o.stop(t + .6); }
    return { set, stop, toggle, chime, get on() { return on; } };
  })();
  const sndBtn = $('vn-sound');
  const paintSound = () => { sndBtn.textContent = audio.on ? '声音 开' : '声音 关'; sndBtn.setAttribute('aria-pressed', String(audio.on)); };
  sndBtn.addEventListener('click', (e) => { e.stopPropagation(); audio.toggle(!audio.on); paintSound(); }); paintSound();

  // —— 粒子：雨、雪、雾、水、火星、尘 ——
  const fx = (() => {
    const c = $('vn-fx'), g = c.getContext('2d'); let kind = null, parts = [], raf = 0, w = 0, h = 0, t = 0; const R = Math.random;
    const size = () => { const r = c.getBoundingClientRect(); const d = Math.min(devicePixelRatio || 1, 2); w = c.width = Math.max(1, r.width * d); h = c.height = Math.max(1, r.height * d); };
    const spawn = {
      snow: () => ({ x: R() * w, y: R() * h, r: R() * 2.4 + .5, vy: R() * 1.6 + .8, vx: R() * 2.4 + 1 }),
      rain: () => ({ x: R() * w, y: R() * h, l: R() * 16 + 12, vy: R() * 8 + 12 }),
      fire: () => ({ x: w * (.55 + R() * .45), y: h + R() * h * .2, r: R() * 2.2 + .8, vy: -(R() * 2 + .8), vx: R() * 1.2 - .6, a: R() }),
      river: () => ({ x: R() * w, y: h * (.5 + R() * .5), l: R() * 90 + 40, vx: R() * 1.4 + .6 }),
      mist: () => ({ x: R() * w, y: h * (.2 + R() * .7), r: R() * w * .18 + w * .08, vx: R() * .3 + .08, a: R() * .05 + .03 }),
      dust: () => ({ x: R() * w, y: R() * h, r: R() * 1.6 + .5, vy: -(R() * .25 + .05), vx: R() * .3 - .1, a: R() }),
    };
    const counts = { snow: 260, rain: 220, fire: 120, river: 50, mist: 14, dust: 70 };
    function frame() {
      t++; g.clearRect(0, 0, w, h);
      for (const p of parts) {
        if (kind === 'snow') { p.y += p.vy; p.x -= p.vx; if (p.y > h || p.x < -10) { p.y = -5; p.x = R() * w * 1.3; } g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); }
        else if (kind === 'rain') { p.y += p.vy; p.x -= 2; if (p.y > h) { p.y = -20; p.x = R() * w * 1.1; } g.strokeStyle = 'rgba(200,215,230,.32)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - 3, p.y + p.l); g.stroke(); }
        else if (kind === 'fire') { p.y += p.vy; p.x += p.vx + Math.sin((t + p.x) / 25) * .4; p.a -= .006; if (p.y < h * .1 || p.a <= 0) Object.assign(p, spawn.fire(), { a: 1 }); g.fillStyle = `rgba(255,${130 + (p.r * 30 | 0)},50,${Math.max(0, p.a) * .9})`; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); }
        else if (kind === 'river') { p.x += p.vx; if (p.x > w + p.l) p.x = -p.l; g.strokeStyle = 'rgba(190,210,225,.16)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + p.l, p.y); g.stroke(); }
        else if (kind === 'mist') { p.x += p.vx; if (p.x - p.r > w) p.x = -p.r; const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); gr.addColorStop(0, `rgba(220,226,232,${p.a})`); gr.addColorStop(1, 'rgba(220,226,232,0)'); g.fillStyle = gr; g.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2); }
        else { p.y += p.vy; p.x += p.vx; if (p.y < 0) p.y = h; const a = .25 + .35 * Math.sin(t / 50 + p.a * 6); g.fillStyle = `rgba(255,220,160,${a * .6})`; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); }
      }
      raf = requestAnimationFrame(frame);
    }
    return {
      set(k) { if (k === kind && parts.length) return; kind = k; cancelAnimationFrame(raf); size(); g.clearRect(0, 0, w, h); parts = []; if (!k || !spawn[k] || reduceMotion) return; parts = Array.from({ length: counts[k] }, spawn[k]); frame(); },
      stop() { cancelAnimationFrame(raf); kind = null; parts = []; g.clearRect(0, 0, w, h); },
      resize() { const k = kind; kind = null; this.set(k); },
    };
  })();

  // —— 背景：两张图交替淡入 ——
  function setBg(name) {
    if (name === curBg) return; curBg = name;
    const next = frontIsA ? bgB : bgA, prev = frontIsA ? bgA : bgB; frontIsA = !frontIsA;
    next.src = IMG[name]; next.classList.remove('kb'); void next.offsetWidth; next.classList.add('kb', 'show'); prev.classList.remove('show');
    blur.style.backgroundImage = `url("${IMG[name]}")`;
  }

  // —— 人物剪影：左右两个位置，说话的人亮起 ——
  const slots = { left: null, right: null }; let used = 0; const lastUse = {}; let spriteVar = {};
  function charEl(who) { let e = charsEl.querySelector(`[data-who="${who}"]`); if (!e) { e = el('img', 'vn-ch' + (CAST[who].full ? ' full' : '')); e.dataset.who = who; e.alt = ''; charsEl.append(e); } return e; }
  function clearChars() { charsEl.replaceChildren(); slots.left = slots.right = null; spriteVar = {}; }
  function showSpeaker(who) {
    if (!who || who === 'me' || !CAST[who]?.sprite) { for (const e of charsEl.children) e.classList.remove('speak'); return; }
    let side = slots.left === who ? 'left' : slots.right === who ? 'right' : null;
    if (!side) {
      side = !slots.left ? 'left' : !slots.right ? 'right' : ((lastUse[slots.left] || 0) < (lastUse[slots.right] || 0) ? 'left' : 'right');
      const old = slots[side]; if (old) { const oe = charsEl.querySelector(`[data-who="${old}"]`); if (oe) { oe.classList.remove('in'); setTimeout(() => oe.remove(), 400); } }
      slots[side] = who;
    }
    lastUse[who] = ++used;
    const e = charEl(who); const v = spriteVar[who]; e.src = IMG[v ? CAST[who].alt[v] : CAST[who].sprite];
    e.classList.toggle('full', !!CAST[who].full && !v);
    e.classList.remove('left', 'right'); e.classList.add(side); requestAnimationFrame(() => e.classList.add('in'));
    for (const c of charsEl.children) c.classList.toggle('speak', c === e);
  }

  // —— 文字与推进 ——
  function waitClick() {
    const my = run;
    return new Promise((res) => {
      const done = () => { pending = null; res(my === run ? true : ABORT); };
      pending = { res: () => res(ABORT), go: done };
      if (skip) setTimeout(() => pending && pending.go === done && done(), 70);
      else if (auto) { const ms = 1300 + (textEl.textContent.length * 55); setTimeout(() => { if (pending && pending.go === done && auto) done(); }, ms); }
    });
  }
  let typing = null;
  function type(text) {
    const my = run;
    return new Promise((res) => {
      if (reduceMotion || skip) { textEl.textContent = text; return res(); }
      let i = 0; textEl.textContent = '';
      const step = () => { if (my !== run) return res(); i += 1; textEl.textContent = text.slice(0, i); if (i >= text.length) { typing = null; return res(); } typing.timer = setTimeout(step, 32); };
      typing = { finish: () => { clearTimeout(typing.timer); textEl.textContent = text; typing = null; res(); } };
      step();
    });
  }
  function advance() { if (!cardEl.hidden && pending) return pending.go(); if (typing) return typing.finish(); if (pending && choicesEl.hidden && endEl.hidden && chapterEl.hidden) pending.go(); }
  async function line(ln) {
    const my = run;
    if (ln.nar) { nameEl.textContent = ''; nameEl.hidden = true; box.dataset.kind = 'nar'; showSpeaker(null); log.push({ k: 'nar', t: ln.nar }); await type(ln.nar); }
    else { const who = ln.who; nameEl.hidden = false; nameEl.textContent = CAST[who].name; box.dataset.kind = who === 'me' ? 'me' : 'say'; showSpeaker(who); log.push({ k: who, n: CAST[who].name, t: ln.t }); await type(ln.t); }
    if (my !== run) throw ABORT;
    $('vn-next').classList.add('on');
    if ((await waitClick()) === ABORT) throw ABORT;
    $('vn-next').classList.remove('on');
  }
  async function showCard(ln) {
    const my = run; cardEl.replaceChildren();
    const r = D.refs[ln.src[0]] || storyById[ln.src[0]];
    const seal = el('span', 'vn-seal', '史料'); const body = el('p', 'vn-card-t', ln.card);
    cardEl.append(seal, body); if (ln.who) cardEl.append(el('p', 'vn-card-who', '—— ' + ln.who));
    const foot = el('div', 'vn-card-foot');
    if (r) { const b = el('button', 'vn-card-src', '出处：' + r.source + ' ↗'); b.type = 'button'; b.addEventListener('click', (e) => { e.stopPropagation(); openRef(ln.src[0]); }); foot.append(b); }
    foot.append(el('span', 'vn-card-hint', '点击继续')); cardEl.append(foot);
    cardEl.hidden = false; cardEl.classList.remove('in'); void cardEl.offsetWidth; cardEl.classList.add('in'); audio.chime();
    log.push({ k: 'card', t: ln.card, s: r ? r.source : '' });
    if (skip) { await new Promise((r) => setTimeout(r, 900)); cardEl.hidden = true; if (my !== run) throw ABORT; return; }
    const ok = await waitClick(); cardEl.hidden = true; if (ok === ABORT) throw ABORT;
  }
  function choose(opts) {
    const my = run;
    return new Promise((res) => {
      skip = false; paintMode(); choicesEl.replaceChildren(); textEl.textContent = '你要怎么做？'; nameEl.hidden = true; box.dataset.kind = 'nar'; showSpeaker(null);
      opts.forEach((o, i) => { const b = el('button', 'vn-choice', o.t); b.type = 'button'; b.addEventListener('click', (e) => { e.stopPropagation(); pending = null; choicesEl.hidden = true; res(my === run ? i : ABORT); }); choicesEl.append(b); });
      choicesEl.hidden = false; pending = { res: () => res(ABORT), go: () => {} };
      choicesEl.querySelector('button').focus({ preventScroll: true });
    });
  }
  async function chapter(sc) {
    const my = run; chapterEl.replaceChildren(el('span', 'vn-ch-no tape', sc.no), el('h2', null, sc.title), el('span', 'vn-ch-when tape', sc.when));
    chapterEl.hidden = false; chapterEl.classList.remove('out'); textEl.textContent = ''; nameEl.hidden = true;
    await new Promise((r) => { const t = setTimeout(r, skip ? 400 : 2200); chapterEl.onclick = (e) => { e.stopPropagation(); clearTimeout(t); r(); }; });
    if (my !== run) throw ABORT;
    chapterEl.classList.add('out'); setTimeout(() => { chapterEl.hidden = true; }, 600);
  }
  async function runLines(lines, sc) {
    for (const ln of lines) {
      if (ln.card) await showCard(ln);
      else if (ln.choice) {
        const i = await choose(ln.choice); if (i === ABORT) throw ABORT;
        const c = ln.choice[i]; state.vn.picks[sc.id] = c.spirit; saveState();
        log.push({ k: 'pick', t: '▸ ' + c.t });
        await runLines(c.lines, sc);
      } else if (ln.bg || ln.fx || ln.sprite || ln.amb) {
        if (ln.bg) { setBg(ln.bg); clearChars(); }
        if (ln.fx) fx.set(ln.fx);
        if (ln.amb) audio.set(ln.amb);
        if (ln.sprite) Object.assign(spriteVar, ln.sprite), [...charsEl.children].forEach((e) => { const who = e.dataset.who; const v = spriteVar[who]; if (v) { e.src = IMG[CAST[who].alt[v]]; e.classList.remove('full'); } });
        if (ln.flash) { const f = $('vn-flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }
      } else await line(ln);
    }
  }
  async function playFrom(i) {
    for (let k = i; k < SC.length; k++) {
      const sc = SC[k]; state.vn.at = k; saveState(); renderActs();
      clearChars(); setBg(sc.bg); fx.set(sc.fx); audio.set(sc.amb);
      $('vn-no').textContent = `${sc.no} · ${sc.when}`; $('vn-title').textContent = sc.title;
      log.push({ k: 'chap', t: `${sc.no} ${sc.title}` });
      await chapter(sc);
      await runLines(sc.lines, sc);
      if (state.visited && sc.id !== 'prologue' && sc.id !== 'end') { const node = { yudu: 'yudu', chishui: 'chishui', luding: 'luding', xueshan: 'jiajin', caodi: 'caodi', wuqi: 'wuqi' }[sc.id]; if (node && !state.visited.has(node)) state.visited.add(node); }
    }
    state.vn.done = true; state.vn.at = 0; saveState(); renderActs();
    ending();
  }

  // —— 结尾：我的长征精神 ——
  function spiritTally() {
    const n = {}; for (const k of Object.keys(V.spirits)) n[k] = 0;
    for (const s of choiceScenes) { const p = state.vn.picks[s.id]; if (p) n[p]++; }
    const max = Math.max(...Object.values(n)); const top = Object.keys(n).filter((k) => n[k] === max && max > 0);
    return { n, top };
  }
  function ending() {
    const { n, top } = spiritTally(); endEl.replaceChildren();
    showSpeaker(null); textEl.textContent = ''; nameEl.hidden = true;
    const inner = el('div', 'vn-end-in');
    inner.append(el('span', 'vn-ch-no tape', '你走完了这一程'), el('h2', null, '我的长征精神'));
    inner.append(el('p', 'vn-end-top', top.length ? top.map((k) => V.spirits[k]).join(' · ') : '还没有做出选择'));
    const bars = el('div', 'vn-bars');
    for (const k of Object.keys(V.spirits)) { const r = el('div', 'vn-bar' + (top.includes(k) ? ' top' : '')); const i = el('i'); i.style.width = (n[k] / choiceScenes.length * 100) + '%'; r.append(el('span', null, V.spirits[k]), el('b'), el('em', null, String(n[k]))); r.children[1].append(i); bars.append(r); }
    inner.append(bars);
    const sp = el('p', 'vn-end-note'); sp.append('这四种精神，都写在长征路上。资料里对长征精神的完整表述：'); const b = el('button', 'vn-link', '查看原文'); b.type = 'button'; b.addEventListener('click', (e) => { e.stopPropagation(); openRef('jiangtaibao_spirit'); }); sp.append(b); inner.append(sp);
    const row = el('div', 'vn-end-row');
    const mk = (t, fn, cls = '') => { const x = el('button', 'vn-choice ' + cls, t); x.type = 'button'; x.addEventListener('click', (e) => { e.stopPropagation(); fn(); }); row.append(x); };
    mk('生成我的长征精神卡', () => spiritPoster(), 'primary');
    mk('再走一遍', () => { state.vn.picks = {}; saveState(); start(0); });
    mk('看行军沙盘', () => { close(); march.goTo('start'); });
    mk('去行军考场', () => { close(); location.hash = '#quiz'; });
    inner.append(row); const out = el('div', 'vn-poster'); out.id = 'vn-poster'; inner.append(out);
    endEl.append(inner); endEl.hidden = false; box.hidden = true; audio.set('finale');
  }
  function spiritPoster() {
    const { n, top } = spiritTally(); const W2 = 1080, H2 = 1440, cv = document.createElement('canvas'); cv.width = W2; cv.height = H2; const g = cv.getContext('2d');
    const serif = '"STKaiti","KaiTi","Kaiti SC","Songti SC","Noto Serif CJK SC",serif', sans = 'system-ui,"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
    const im = new Image(); im.onload = () => {
      const s = Math.max(W2 / im.width, 760 / im.height); g.fillStyle = '#0d0f10'; g.fillRect(0, 0, W2, H2);
      g.drawImage(im, (W2 - im.width * s) / 2, 0, im.width * s, im.height * s);
      const gr = g.createLinearGradient(0, 300, 0, 900); gr.addColorStop(0, 'rgba(13,15,16,0)'); gr.addColorStop(1, 'rgba(13,15,16,1)'); g.fillStyle = gr; g.fillRect(0, 300, W2, 600); g.fillStyle = '#0d0f10'; g.fillRect(0, 900, W2, H2 - 900);
      g.fillStyle = '#E9C47C'; g.font = `32px ${sans}`; g.fillText('我的长征 · 1934—1936', 80, 640);
      g.fillStyle = '#EEE7D8'; g.font = `96px ${serif}`; g.fillText('我的长征精神', 80, 760);
      g.fillStyle = '#E2533E'; g.font = `64px ${serif}`; g.fillText(top.map((k) => V.spirits[k]).join(' · ') || '—', 80, 870);
      let y = 960; for (const k of Object.keys(V.spirits)) { g.fillStyle = '#A9A498'; g.font = `34px ${serif}`; g.fillText(V.spirits[k], 80, y + 30); g.fillStyle = 'rgba(238,231,216,.12)'; g.fillRect(300, y + 4, 620, 30); g.fillStyle = top.includes(k) ? '#E2533E' : '#8a7f6a'; g.fillRect(300, y + 4, 620 * n[k] / choiceScenes.length, 30); g.fillStyle = '#EEE7D8'; g.font = `30px ${sans}`; g.fillText(String(n[k]), 940, y + 30); y += 72; }
      g.fillStyle = '#EEE7D8'; g.font = `38px ${serif}`; g.fillText('从于都河到吴起镇，六幕，我和战友们一起走过。', 80, 1310);
      g.fillStyle = '#6f6a60'; g.font = `24px ${sans}`; g.fillText('人物为虚构 · 史实依据《长征路上》知识库资料 · 数字长征沙盘', 80, 1380);
      const url = cv.toDataURL('image/png'); const out = $('vn-poster'); out.replaceChildren(); const pi = el('img'); pi.src = url; pi.alt = '我的长征精神卡'; out.append(pi);
      let framed = true; try { framed = window.top !== window.self; } catch { /* 跨域框架 */ }
      if (!framed) { const a = el('a', 'vn-choice', '保存图片'); a.href = url; a.download = '我的长征精神卡.png'; out.append(a); }
      out.append(el('p', 'vn-end-note', '长按或右键图片也可以保存。'));
    };
    im.src = IMG.bg_end;
  }

  // —— 记录、自动、快进 ——
  function paintMode() { const a = $('vn-auto'), s = $('vn-skip'); a.classList.toggle('on', auto); a.setAttribute('aria-pressed', String(auto)); s.classList.toggle('on', skip); s.setAttribute('aria-pressed', String(skip)); }
  $('vn-auto').addEventListener('click', (e) => { e.stopPropagation(); auto = !auto; skip = false; paintMode(); if (auto && pending && !typing && choicesEl.hidden) setTimeout(() => pending && auto && pending.go(), 600); });
  $('vn-skip').addEventListener('click', (e) => { e.stopPropagation(); skip = !skip; auto = false; paintMode(); if (skip) { if (typing) typing.finish(); if (pending && choicesEl.hidden) pending.go(); } });
  function openLog() {
    logEl.replaceChildren(); const h = el('div', 'vn-log-head'); h.append(el('h3', null, '对话记录')); const x = el('button', 'vn-tool', '关闭'); x.type = 'button'; x.addEventListener('click', () => { logEl.hidden = true; }); h.append(x); logEl.append(h);
    const list = el('div', 'vn-log-list');
    for (const it of log.slice(-200)) {
      const r = el('div', 'vn-log-it ' + it.k);
      if (it.k === 'card') r.append(el('b', null, '史料'), it.t, el('small', null, it.s));
      else if (it.k === 'chap' || it.k === 'pick' || it.k === 'nar') r.append(it.t);
      else r.append(el('b', null, it.n), it.t);
      list.append(r);
    }
    logEl.append(list); logEl.hidden = false; list.scrollTop = list.scrollHeight; x.focus({ preventScroll: true });
  }
  $('vn-log-btn').addEventListener('click', (e) => { e.stopPropagation(); openLog(); });

  // —— 打开 / 关闭 ——
  function start(i = 0) {
    run++; if (pending) { const p = pending; pending = null; p.res(); }
    if (typing) { clearTimeout(typing.timer); typing = null; }
    lastFocus = lastFocus || document.activeElement;
    root.hidden = false; document.body.classList.add('vn-open');
    endEl.hidden = true; box.hidden = false; cardEl.hidden = true; choicesEl.hidden = true; logEl.hidden = true; auto = false; skip = false; paintMode(); curBg = null;
    requestAnimationFrame(() => fx.resize());
    root.focus({ preventScroll: true });
    playFrom(i).catch((e) => { if (e !== ABORT) console.error(e); });
  }
  function close() {
    run++; if (pending) { const p = pending; pending = null; p.res(); }
    root.hidden = true; document.body.classList.remove('vn-open'); fx.stop(); audio.stop();
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); lastFocus = null; renderActs(); updatePassport();
  }
  $('vn-close').addEventListener('click', (e) => { e.stopPropagation(); close(); });
  $('vn-frame').addEventListener('click', (e) => { if (e.target.closest('button,a')) return; advance(); });
  root.tabIndex = -1;
  addEventListener('keydown', (e) => {
    if (root.hidden || (reader && reader.open)) return;
    if (e.key === 'Escape') { e.preventDefault(); if (!logEl.hidden) logEl.hidden = true; else close(); return; }
    if (!logEl.hidden) return;
    if ((e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') && !e.target.closest?.('button')) { e.preventDefault(); advance(); }
  });
  addEventListener('resize', () => { if (!root.hidden) fx.resize(); });

  // —— 页面入口：章节目录 ——
  function renderActs() {
    const list = $('acts'); if (!list) return; list.replaceChildren();
    SC.forEach((sc, i) => {
      const li = el('li'); const done = state.vn.done || state.vn.at > i;
      const b = el('button', 'act' + (done ? ' done' : '')); b.type = 'button'; b.style.backgroundImage = `linear-gradient(90deg, rgba(10,12,14,.86), rgba(10,12,14,.35)), url("${IMG[sc.bg]}")`;
      b.append(el('span', 'act-no', sc.no), el('span', 'act-place', sc.title), el('span', 'act-when tape', sc.when));
      const p = state.vn.picks[sc.id]; if (p) b.append(el('span', 'act-seen', '你选择了：' + V.spirits[p]));
      b.addEventListener('click', () => start(i)); li.append(b); list.append(li);
    });
    const at = state.vn.at || 0; const btn = $('vn-start');
    btn.textContent = at > 0 && !state.vn.done ? `接着走：${SC[at].no} ${SC[at].title}` : (state.vn.done ? '再走一遍' : '背上行装，出发');
    $('vn-progress').textContent = state.vn.done ? '已走完全程' : `${SC.length - 2} 幕 + 序幕与尾声 · 约 12 分钟`;
  }
  $('vn-start').addEventListener('click', () => { const at = state.vn.at || 0; start(at > 0 && !state.vn.done ? at : 0); });
  $('hero-novel').addEventListener('click', () => start(0));
  renderActs();
  return { start, close };
})();
