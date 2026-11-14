// 知识库原文比对：抓取每条资料的来源网页，把资料文字逐句与原文比对，
// 标出原文中找不到依据的句子（用词重合度低、数字或引号内容不在原文中）。
//
// 用法：node scripts/check-kb-text.mjs
//   云端环境中访问 http 来源需要：HTTP_PROXY="$HTTPS_PROXY" NODE_USE_ENV_PROXY=1
// 可选：KB_OUT=报告路径（默认 docs/知识库原文比对-<日期>.md）；KB_THRESHOLD=覆盖率阈值（默认 0.8）
// 结果只是筛查：低覆盖率可能是合理的概括改写，需要人工对照原文判断。

import { writeFile } from 'node:fs/promises';
import { nodes } from '../src/data.js';

const THRESHOLD = Number(process.env.KB_THRESHOLD) || 0.8;
const entries = nodes.flatMap(n => [{ id: n.id, text: n.text, source: n.source, url: n.url }, ...(n.extra || []).map(e => ({ ...e }))]);
const urls = [...new Set(entries.map(e => e.url))];

function decode(buf, contentType) {
  const head = buf.subarray(0, 4000).toString('latin1');
  const m = /charset=["']?([\w-]+)/i.exec(contentType || '') || /charset=["']?([\w-]+)/i.exec(head);
  const enc = (m ? m[1] : 'utf-8').toLowerCase();
  try { return new TextDecoder(enc === 'gb2312' ? 'gbk' : enc).decode(buf); } catch { return new TextDecoder('utf-8').decode(buf); }
}
const plain = html => html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;|&#\d+;/g, ' ');
const norm = s => String(s).replace(/[\s　，。、；：！？“”‘’（）《》·—…,.;:!?"'()\-［］【】]/g, '');
const bigrams = s => { const t = norm(s); const out = []; for (let i = 0; i < t.length - 1; i++) out.push(t.slice(i, i + 2)); return out; };
const CN = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 百: 100, 千: 1000, 万: 10000 };
const cn = s => { let t = 0, sec = 0, d = 0; for (const ch of s) { const v = CN[ch]; if (v == null) return null; if (v === 10000) { t += (sec + d) * v; sec = 0; d = 0; } else if (v >= 10) { sec += (d || 1) * v; d = 0; } else d = v; } return t + sec + d; };
const nums = s => [...(String(s).match(/\d+(?:\.\d+)?/g) || []), ...[...String(s).matchAll(/[零〇一二两三四五六七八九十百千万]+/g)].map(m => cn(m[0])).filter(v => v != null).map(String)].map(x => x.includes('.') ? x : String(Number(x)));

const pages = new Map();
for (const url of urls) {
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(30000), headers: { 'user-agent': 'Mozilla/5.0 (compatible; long-march-guide-kb-check/1.0)' } });
    const text = plain(decode(Buffer.from(await res.arrayBuffer()), res.headers.get('content-type')));
    pages.set(url, { status: res.status, text, normText: norm(text), grams: new Set(bigrams(text)), nums: new Set(nums(text)) });
    console.log(res.status, url);
  } catch (e) { pages.set(url, { status: 0, error: e?.name || String(e) }); console.log('ERR', url); }
}

const rows = [];
let flaggedEntries = 0;
for (const e of entries) {
  const p = pages.get(e.url);
  if (!p || !p.text) { rows.push({ e, problems: [{ sentence: '（无法获取原文）', note: p?.error || 'HTTP ' + p?.status }] }); flaggedEntries++; continue; }
  const problems = [];
  for (const s of e.text.split(/(?<=[。；！？])/).map(x => x.trim()).filter(Boolean)) {
    const g = bigrams(s); if (g.length < 3) continue;
    const cover = g.filter(x => p.grams.has(x)).length / g.length;
    const badNums = [...new Set(nums(s).filter(n => !p.nums.has(n)))];
    const quotes = [...s.matchAll(/[“《]([^”》]{2,80})[”》]/g)].map(m => m[1]).filter(q => !p.normText.includes(norm(q)));
    if (cover < THRESHOLD || badNums.length || quotes.length) problems.push({ sentence: s, cover: cover.toFixed(2), badNums, quotes });
  }
  if (problems.length) flaggedEntries++;
  rows.push({ e, problems });
}

const cell = s => String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const date = new Date().toISOString().slice(0, 10);
const out = process.env.KB_OUT || `docs/知识库原文比对-${date}.md`;
await writeFile(out, [
  `# 知识库原文比对（${date}）`, '',
  `- 资料 ${entries.length} 条，来源网页 ${urls.length} 个，获取成功 ${[...pages.values()].filter(p => p.text).length} 个。`,
  `- 有可疑句子的资料 ${flaggedEntries} 条。标记规则：句子与原文的二字片段覆盖率低于 ${THRESHOLD}，或含原文中没有的数字（含汉字数字），或引号、书名号内容不在原文中。`,
  '- 这是筛查结果：覆盖率低可能只是合理的概括或改写，每条都需要人工对照原文判断。', '',
  '| 资料 ID | 可疑句子 | 覆盖率 | 原文没有的数字 | 原文没有的引文 | 人工判断 |', '| --- | --- | --- | --- | --- | --- |',
  ...rows.filter(r => r.problems.length).flatMap(r => r.problems.map(x => `| ${r.e.id} | ${cell(x.sentence)} | ${x.cover ?? '—'} | ${cell((x.badNums || []).join('、'))} | ${cell((x.quotes || []).join('、') || x.note || '')} |  |`)),
  '',
].join('\n'));
console.log(`\n有可疑句子的资料 ${flaggedEntries} / ${entries.length}，报告：${out}`);
