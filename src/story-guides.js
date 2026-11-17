// 故事引导：把已有资料组织成“悬念 → 分段讲述 → 背景 → 追问”的阅读体验。
// 约定：这里不新增史实。
// - 写了 story 的条目：正文直接取 stories.js 里那条已审核故事的原文，由页面按句子分成几段；这里只补悬念问句（hook）、标签和可选的背景、追问。
//   悬念问句只能就故事原文里已有的内容发问，不能带出原文没有的事实。
// - 写了 parts 的条目（事件故事）：每段文字只改写 sources 所列资料里已有的内容，数字和专名与资料原文一致。
// 测试会检查：故事和出处都存在、问句和段落里的数字都能在对应资料原文中找到。
// 排在前面的 6 个会轮流出现在首页。
export const storyGuides = [
  { id: 'guide_banbei_beizi', story: 'story_banbei_beizi', tag: '人物 · 军民之间', hook: '只有一条被子，为什么还要剪下一半留给别人？',
    background: [
      { label: '这时的红军', text: '1934 年 10 月，中共中央和中央红军主力撤离中央革命根据地，开始长征，出发时为 8.6 万余人。', sources: ['start', 'yudu_army'] },
      { label: '接下来的路', text: '1934 年 11 月 27 日至 12 月 1 日，中央红军进行湘江之战，突破敌军封锁，部队付出重大代价，由出发时的 8.6 万余人减至 3 万余人。', sources: ['xiangjiang', 'xiangjiang_lines'] },
    ],
    place: '故事发生在湖南汝城县沙洲村，时间在湘江战役之前。路线上离它最近的一站是「血战湘江」。',
    whys: ['红军为什么要离开中央苏区？', '女红军在长征中做些什么工作？', '湘江战役是怎么打的？'] },
  {
    id: 'guide_sidu_chishui', kind: 'event', title: '四渡赤水', tag: '事件 · 怎么做到的', date: '1935.01—03', node: 'chishui',
    hook: '同一条河，红军为什么来回渡了四次？',
    parts: [
      { label: '土城失利', date: '1 月 28 日', text: '1935 年 1 月 28 日，中央红军在贵州习水土城青杠坡与川军激战，伤亡 3000 余人。当晚，红军决定撤出战斗。', sources: ['chishui_tucheng'] },
      { label: '一渡', date: '1 月 29 日', text: '次日凌晨，红军从土城浑溪口、蔡家沱、元厚等渡口西渡赤水河。这是第一次渡河，四渡赤水由此开始。', sources: ['chishui_tucheng', 'chishui_detail'] },
      { label: '回兵黔北，二渡', date: '2 月', text: '2 月 5 日至 9 日，中共中央政治局在云南扎西（今威信）境内连续召开会议，作出“回兵黔北”和缩编部队的决策。2 月 18 日至 21 日，红军第二次渡过赤水河。', sources: ['chishui_zhaxi', 'chishui_detail'],
        terms: [{ word: '扎西（今威信）境内连续召开会议', text: '这几次会议还正式通过了《遵义会议决议》。', sources: ['chishui_zhaxi'] }] },
      { label: '苟坝的一夜', date: '3 月', text: '3 月，中央负责人在贵州苟坝讨论是否进攻打鼓新场。多数人主张进攻，毛泽东分析敌情后反对。当天深夜，他提着马灯来到周恩来住处，建议暂缓发出命令；次日一早重新开会，进攻计划最终没有执行。', sources: ['story_mao_lamp'],
        terms: [{ word: '苟坝', text: '苟坝会议还确立了由毛泽东、周恩来、王稼祥组成的三人军事领导小组（又称新三人团）。', sources: ['chishui_gouba'] }] },
      { label: '三渡、四渡', date: '3 月 16—22 日', text: '二渡后，中央红军进军黔北，攻占娄山关并再占遵义。3 月 16 日至 17 日，红军第三次渡过赤水河，从茅台地区西渡，佯作北渡长江，调动敌军。3 月 21 日至 22 日，红军又从二郎滩、太平渡地区第四次渡河，主力随后向南进军。3 月 31 日，中央红军南渡乌江，继续战略转移。', sources: ['chishui_detail', 'chishui_maneuver'] },
    ],
    background: [
      { label: '前后一共多久', text: '1935 年 1 月下旬至 3 月，中央红军在川黔滇边境地区四渡赤水河，机动周旋。', sources: ['chishui'] },
      { label: '靠什么掌握敌情', text: '行军时，曾希圣将军委情报二局分成两组接力工作，监听并破译敌方电报，向决策者提供情报；中革军委和各军团则用电台组成无线电通信网络传递作战命令。', sources: ['chishui_intelligence', 'chishui_radio'] },
    ],
    place: '赤水河在川黔滇边境地区。路线上对应的一站是「四渡赤水」。',
    whys: ['军委情报二局在四渡赤水中起了什么作用？', '苟坝会议为什么决定不打打鼓新场？', '四渡赤水之后红军去了哪里？'],
  },
  { id: 'guide_he_zizhen', story: 'story_he_zizhen', tag: '人物 · 战友之间', hook: '敌机飞走后，人们在她身上发现了 17 块弹片。轰炸的那一刻发生了什么？' },
  { id: 'guide_banjie_pidai', story: 'story_banjie_pidai', tag: '人物 · 过草地', hook: '饿到煮皮带吃的时候，为什么偏偏留下了半截？' },
  { id: 'guide_22_yongshi', story: 'story_22_yongshi', tag: '战斗 · 泸定桥', hook: '桥面木板被拆去大部分，22 个人怎样踏着铁索过河？' },
  { id: 'guide_mao_lamp', story: 'story_mao_lamp', tag: '决策 · 苟坝', hook: '作战命令就要发出，深夜里的一盏马灯改变了什么？' },
  { id: 'guide_zhou_enlai', story: 'story_zhou_enlai', tag: '人物 · 过草地', hook: '草地上人人步履艰难，为什么还要抬着一个人走六天六夜？' },
  { id: 'guide_yudu_bridge', story: 'story_yudu_bridge', tag: '群众 · 出发', hook: '架桥缺木板，一位老人坚持献出来的是什么？' },
  { id: 'guide_laoshanjie', story: 'story_laoshanjie_mother_rice', tag: '亲历者记述 · 老山界', hook: '她拿出仅有的一点米，给路过的红军煮了粥。红军是怎么做的？' },
  { id: 'guide_yihai', story: 'story_yihai', tag: '民族 · 彝海', hook: '一度发生冲突的两边，后来怎样结成了盟友？' },
  { id: 'guide_17_yongshi', story: 'story_17_yongshi', tag: '战斗 · 大渡河', hook: '水急、船少、对岸有守军，谁先过河？' },
  { id: 'guide_chen_shuxiang', story: 'story_chen_shuxiang', tag: '人物 · 湘江', hook: '后卫师掩护主力过了江，师长自己后来怎样了？' },
  { id: 'guide_he_jiesheng', story: 'story_he_jiesheng', tag: '人物 · 红二、红六军团', hook: '还在襁褓中的婴儿，是怎样走上长征路的？' },
  { id: 'guide_jiajin_tan_fagui', story: 'story_jiajin_tan_fagui', tag: '人物 · 夹金山', hook: '队伍里年纪很小的战士，是怎样翻过雪山的？' },
  { id: 'guide_hadapu', story: 'story_hadapu_newspapers', tag: '决策 · 哈达铺', hook: '走出草地之后往哪里去？报纸上的消息起了什么作用？' },
  { id: 'guide_chen_yun_ferry', story: 'story_chen_yun_ferry', tag: '事件 · 金沙江', hook: '江水湍急、渡船有限，大队人马怎样有次序地过江？' },
  { id: 'guide_danjiaji', story: 'story_danjiaji_night_talk', tag: '民族 · 单家集', hook: '两个月里红军两次来到同一个村子，村民的反应有什么不同？' },
  { id: 'guide_baimian', story: 'story_baimian_yao_rock', tag: '群众 · 瑶寨', hook: '红军临别时写在岩壁上的标语，后来为什么被刻进了石头？' },
  { id: 'guide_zeng_fanyi', story: 'story_fj_zeng_fanyi', tag: '人物 · 八闽儿女', hook: '跳崖幸存的战士，为什么直到 1984 年才联系上老家的亲人？' },
];
