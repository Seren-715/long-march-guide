// 故事引导：把已有资料组织成“悬念 → 分段讲述 → 背景 → 追问”的阅读体验。
// 约定：这里不新增史实。每一段文字都只改写 sources 所列资料里已有的内容，数字和专名与资料原文一致；
// 测试会检查 sources 都存在、段落里的数字都能在所列资料中找到。
// kind：person 人物故事（一段叙述）；event 事件故事（按时间分步）。
export const storyGuides = [
  {
    id: 'guide_banbei_beizi',
    kind: 'person',
    title: '半条被子',
    tag: '人物 · 军民之间',
    date: '1934.11',
    hook: '只有一条被子，为什么还要剪下一半留给别人？',
    parts: [
      { label: '来到沙洲村', text: '1934 年 11 月上旬，中央红军在长征途中来到湖南汝城县休整，一支部队进入沙洲村。村民徐解秀让 3 名女红军住到了自己家里。', sources: ['xiangjiang_quilt'],
        terms: [{ word: '中央红军在长征途中', text: '1934 年 10 月，中共中央和中央红军主力撤离中央革命根据地，开始长征。', sources: ['start'] }] },
      { label: '剪开的行军被', text: '红军开拔时，看到徐解秀家连一条像样的被子都没有，其中一名女红军用剪刀把自己的行军被剪开，将半条被子留给了徐解秀。', sources: ['xiangjiang_quilt'] },
      { label: '老人的话', text: '徐解秀老人说：什么是共产党？共产党就是自己有一条被子，也要剪下半条给老百姓的人。', sources: ['story_banbei_beizi'] },
    ],
    background: [
      { label: '这时的红军', text: '1934 年 10 月，中共中央和中央红军主力撤离中央革命根据地，开始长征，出发时为 8.6 万余人。', sources: ['start', 'yudu_army'] },
      { label: '接下来的路', text: '1934 年 11 月 27 日至 12 月 1 日，中央红军进行湘江之战，突破敌军封锁，部队付出重大代价，由出发时的 8.6 万余人减至 3 万余人。', sources: ['xiangjiang', 'xiangjiang_lines'] },
    ],
    place: { node: 'xiangjiang', text: '故事发生在湖南汝城县沙洲村，时间在湘江战役之前。路线上离它最近的一站是「血战湘江」。' },
    whys: ['红军为什么要离开中央苏区？', '女红军在长征中做些什么工作？', '湘江战役是怎么打的？'],
    next: ['guide_sidu_chishui'],
  },
  {
    id: 'guide_sidu_chishui',
    kind: 'event',
    title: '四渡赤水',
    tag: '事件 · 怎么做到的',
    date: '1935.01—03',
    hook: '同一条河，红军为什么来回渡了四次？',
    parts: [
      { label: '土城失利', date: '1 月 28 日', text: '1935 年 1 月 28 日，中央红军在贵州习水土城青杠坡与川军激战，伤亡 3000 余人。当晚，红军决定撤出战斗。', sources: ['chishui_tucheng'] },
      { label: '一渡', date: '1 月 29 日', text: '次日凌晨，红军从土城浑溪口、蔡家沱、元厚等渡口西渡赤水河。这是第一次渡河，四渡赤水由此开始。', sources: ['chishui_tucheng', 'chishui_detail'] },
      { label: '回兵黔北，二渡', date: '2 月', text: '2 月 5 日至 9 日，中共中央政治局在云南扎西（今威信）境内连续召开会议，作出“回兵黔北”和缩编部队的决策。2 月 18 日至 21 日，红军第二次渡过赤水河。', sources: ['chishui_zhaxi', 'chishui_detail'],
        terms: [{ word: '扎西（今威信）境内连续召开会议', text: '这几次会议还正式通过了《遵义会议决议》。', sources: ['chishui_zhaxi'] }] },
      { label: '苟坝的一夜', date: '3 月', text: '3 月，苟坝会议讨论是否攻打打鼓新场。毛泽东认为打鼓新场易守难攻，一旦不能迅速攻克，红军会陷入重围，因此反对进攻；当晚他提着马灯去找周恩来商议，会议再次讨论后决定放弃进攻。', sources: ['story_mao_lamp'],
        terms: [{ word: '苟坝会议', text: '苟坝会议还确立了由毛泽东、周恩来、王稼祥组成的三人军事领导小组（又称新三人团）。', sources: ['chishui_gouba'] }] },
      { label: '三渡、四渡', date: '3 月 16—22 日', text: '3 月 16 日至 17 日，红军第三次渡过赤水河；3 月 21 日至 22 日，第四次渡河。', sources: ['chishui_detail'] },
    ],
    background: [
      { label: '前后一共多久', text: '1935 年 1 月下旬至 3 月，中央红军在川黔滇边境地区四渡赤水河，机动周旋。', sources: ['chishui'] },
      { label: '靠什么掌握敌情', text: '行军时，曾希圣将军委情报二局分成两组接力工作，监听并破译敌方电报，向决策者提供情报；中革军委和各军团则用电台组成无线电通信网络传递作战命令。', sources: ['chishui_intelligence', 'chishui_radio'] },
    ],
    place: { node: 'chishui', text: '赤水河在川黔滇边境地区。路线上对应的一站是「四渡赤水」。' },
    whys: ['军委情报二局在四渡赤水中起了什么作用？', '苟坝会议为什么决定不打打鼓新场？', '四渡赤水之后红军去了哪里？'],
    next: ['guide_banbei_beizi'],
  },
];
