// 检索评估：不调用模型，只检查 search_materials 这个检索工具本身好不好用。
// 做法：对每个查询，让一个“假模型”调用一次 search_materials，再从服务端交还的工具结果里读出命中的资料 ID 及顺序，
// 与人工标注的“应命中资料”比对。指标：前 3 条命中率、前 8 条命中率（检索工具一次最多返回 8 条）、首个正确结果的平均倒数排名（MRR）。
//
// 用法：npm run eval:retrieval        （先 npm run build，或直接 npm test 会自动构建）
// 可选：RETRIEVAL_OUT=报告路径（默认 docs/检索评估结果-<日期>.md）；RETRIEVAL_MIN=前 8 条命中率下限（低于则退出码 1，默认不检查）
// 新增资料后，应在 CASES 里补上对应的查询。

import { writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import worker from '../worker/index.js';

// [查询, 应命中的资料 ID（命中任意一个即算对）]。查询既有关键词式的，也有口语问法。
export const CASES = [
  ['福建日报近2.6万福建子弟', ['story_fj_count_26k']],
  ['近万福建儿女福建长征英烈主题展', ['story_fj_count_10k']],
  ['福建参加长征有多少人为什么统计不同', ['story_fj_overview', 'story_fj_count_26k', 'story_fj_count_10k']],
  ['二万五千里', ['wuqi_distance_method', 'wuqi_summary', 'start_route_compare']],
  ['长征一共走了多少里', ['wuqi_summary', 'start_route_compare', 'wuqi_distance_method']],
  ['长征走了多长时间', ['wuqi_summary', 'start_route_dates']],
  ['红军出发时多少人', ['yudu_army', 'xiangjiang_detail']],
  ['于都河 架桥 老百姓', ['yudu_support', 'yudu_night']],
  ['湘江战役损失', ['xiangjiang_detail', 'xiangjiang_lines', 'xiangjiang']],
  ['湘江之战三大阻击战', ['xiangjiang_battles']],
  ['半条被子', ['story_banbei_beizi', 'xiangjiang_quilt']],
  ['通道转兵', ['tongdao', 'tongdao_direction']],
  ['黎平会议 李德', ['liping_attendees', 'liping_lide_other']],
  ['强渡乌江 渡口', ['wujiang', 'wujiang_battle']],
  ['遵义会议参加的人', ['zunyi_attendees']],
  ['遵义会议意义', ['zunyi_significance', 'zunyi_detail']],
  ['娄山关', ['zunyi_loushan']],
  ['新三人团', ['chishui_gouba', 'story_mao_lamp']],
  ['土城战斗伤亡', ['chishui_tucheng']],
  ['佯攻昆明', ['kunming']],
  ['皎平渡 几条船', ['jinsha_complete', 'jinsha_boats']],
  ['会理会议 林彪', ['huili_unity']],
  ['小叶丹', ['yihai', 'story_yihai', 'yihai_banner']],
  ['安顺场 船工', ['dadu_boatmen', 'dadu']],
  ['十七勇士', ['story_17_yongshi', 'dadu', 'dadu_boatmen']],
  ['飞夺泸定桥突击队', ['luding', 'story_22_yongshi']],
  ['爬雪山', ['jiajin']],
  ['懋功会师', ['jiajin_maogong']],
  ['过草地吃什么', ['caodi_food_rations', 'caodi', 'story_zhang_side_grass']],
  ['草地牺牲原因', ['caodi_losses']],
  ['左路军右路军', ['maoergai_army', 'caodi']],
  ['腊子口怎么打下来的', ['lazikou']],
  ['大公报 陕北', ['hadapu', 'hadapu_newspapers']],
  ['榜罗镇会议', ['lazikou_bangluo']],
  ['青石嘴 骑兵', ['liupan', 'liupan_cavalry']],
  ['清平乐六盘山', ['liupan_poem']],
  ['切尾巴', ['wuqi_battle']],
  ['红二十五军什么时候到陕北', ['wuqi_red25', 'wuqi_yongping']],
  ['奠基礼', ['zhiluozhen_dianji']],
  ['三大主力会师', ['huining', 'jiangtaibao']],
  ['长征精神', ['jiangtaibao_spirit']],
  ['周总理过草地生病', ['story_zhou_enlai']],
  ['女红军', ['start_women_work', 'wuqi_women_nurses', 'jiangtaibao_women_work']],
];

const env = { DEEPSEEK_API_KEY: 'offline', HISTORY_SIGNING_KEY: 'retrieval-eval' };
export async function search(query) {
  const realFetch = globalThis.fetch; let ids = null, calls = 0;
  globalThis.fetch = async (url, options) => {
    const body = JSON.parse(options.body); calls++;
    if (calls === 1) return Response.json({ choices: [{ message: { role: 'assistant', content: '', tool_calls: [{ id: 'c1', type: 'function', function: { name: 'search_materials', arguments: JSON.stringify({ query }) } }] }, finish_reason: 'tool_calls' }] });
    const tool = body.messages.findLast(m => m.role === 'tool');
    ids = [...String(tool?.content || '').matchAll(/^\[([\w]+)\]/gm)].map(m => m[1]);
    return Response.json({ choices: [{ message: { content: JSON.stringify({ type: 'chat', answer: '好的。', sources: [] }) }, finish_reason: 'stop' }] });
  };
  try { await worker.fetch(new Request('http://localhost/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: '检索评估', node: 'start', free: true, sessionId: randomUUID() }) }), { ...env, CHAT_LIMIT_PER_IP: 100000, MODEL_LIMIT_PER_HOUR: 100000 }); }
  finally { globalThis.fetch = realFetch; }
  return ids || [];
}
export async function evaluate() {
  const rows = []; let h3 = 0, h8 = 0, mrr = 0;
  for (const [query, expected] of CASES) {
    const got = await search(query), rank = got.findIndex(id => expected.includes(id)) + 1;
    if (rank && rank <= 3) h3++; if (rank && rank <= 8) h8++; if (rank) mrr += 1 / rank;
    rows.push({ query, expected, got, rank });
  }
  const n = CASES.length;
  return { rows, n, hit3: h3 / n, hit8: h8 / n, mrr: mrr / n };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await evaluate(), pct = x => (x * 100).toFixed(1) + '%';
  for (const x of r.rows) console.log((x.rank ? String(x.rank).padStart(2) : ' ✗'), x.query, x.rank ? '' : '→ 应命中 ' + x.expected.join('／') + '，实际 ' + (x.got.slice(0, 4).join('、') || '无'));
  console.log(`\n查询 ${r.n} 个：前 3 条命中 ${pct(r.hit3)}，前 8 条命中 ${pct(r.hit8)}，MRR ${r.mrr.toFixed(3)}`);
  const date = new Date().toISOString().slice(0, 10), out = process.env.RETRIEVAL_OUT || `docs/检索评估结果-${date}.md`;
  await writeFile(out, [`# 检索评估结果（${date}）`, '', `- 查询 ${r.n} 个，只测 search_materials 检索工具，不调用模型。`, `- 前 3 条命中率 ${pct(r.hit3)}，前 8 条命中率 ${pct(r.hit8)}，MRR ${r.mrr.toFixed(3)}。`, '- “排名”是第一条应命中资料出现的位置；“未命中”表示前 8 条里没有。', '', '| 查询 | 应命中（任一） | 排名 | 实际返回（前 8 条） |', '| --- | --- | --- | --- |', ...r.rows.map(x => `| ${x.query} | ${x.expected.join('、')} | ${x.rank || '未命中'} | ${x.got.join('、') || '无'} |`), ''].join('\n'));
  console.log('报告：' + out);
  const min = Number(process.env.RETRIEVAL_MIN); if (min && r.hit8 < min) process.exit(1);
}
