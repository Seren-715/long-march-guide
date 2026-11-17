// 故事引导：把已有资料组织成“悬念 → 分段讲述 → 背景 → 追问”的阅读体验。
// 约定：这里不新增史实。
// - 写了 story 的条目：正文直接取 stories.js 里那条已审核故事的原文，由页面按句子分成几段；这里只补悬念问句（hook）、标签和可选的背景、追问。
//   悬念问句只能就故事原文里已有的内容发问，不能带出原文没有的事实。
// - 写了 parts 的条目（事件故事）：每段文字只改写 sources 所列资料里已有的内容，数字和专名与资料原文一致。
// 测试会检查：故事和出处都存在、问句和段落里的数字都能在对应资料原文中找到。
// cat 是故事分类：人物故事、事件故事、会议与决策、军民与民族（故事列表页按它筛选）；tag 是卡片上更细的小标签。
// 排在前面的 6 个会轮流出现在首页。
export const storyGuides = [
  { id: 'guide_banbei_beizi', cat: '军民与民族', story: 'story_banbei_beizi', tag: '人物 · 军民之间', hook: '只有一条被子，为什么还要剪下一半留给别人？',
    background: [
      { label: '这时的红军', text: '1934 年 10 月，中共中央和中央红军主力撤离中央革命根据地，开始长征，出发时为 8.6 万余人。', sources: ['start', 'yudu_army'] },
      { label: '接下来的路', text: '1934 年 11 月 27 日至 12 月 1 日，中央红军进行湘江之战，突破敌军封锁，部队付出重大代价，由出发时的 8.6 万余人减至 3 万余人。', sources: ['xiangjiang', 'xiangjiang_lines'] },
    ],
    place: '故事发生在湖南汝城县沙洲村，时间在湘江战役之前。路线上离它最近的一站是「血战湘江」。',
    whys: ['红军为什么要离开中央苏区？', '女红军在长征中做些什么工作？', '湘江战役是怎么打的？'] },
  {
    id: 'guide_sidu_chishui', cat: '事件故事', kind: 'event', title: '四渡赤水', tag: '事件 · 怎么做到的', date: '1935.01—03', node: 'chishui',
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
  { id: 'guide_he_zizhen', cat: '人物故事', story: 'story_he_zizhen', tag: '人物 · 战友之间', hook: '敌机飞走后，人们在她身上发现了 17 块弹片。轰炸的那一刻发生了什么？' },
  { id: 'guide_banjie_pidai', cat: '人物故事', story: 'story_banjie_pidai', tag: '人物 · 过草地', hook: '饿到煮皮带吃的时候，为什么偏偏留下了半截？' },
  { id: 'guide_22_yongshi', cat: '事件故事', story: 'story_22_yongshi', tag: '战斗 · 泸定桥', hook: '桥面木板被拆去大部分，22 个人怎样踏着铁索过河？' },
  { id: 'guide_mao_lamp', cat: '会议与决策', story: 'story_mao_lamp', tag: '决策 · 苟坝', hook: '作战命令就要发出，深夜里的一盏马灯改变了什么？' },
  { id: 'guide_zhou_enlai', cat: '人物故事', story: 'story_zhou_enlai', tag: '人物 · 过草地', hook: '草地上人人步履艰难，为什么还要抬着一个人走六天六夜？' },
  { id: 'guide_yudu_bridge', cat: '军民与民族', story: 'story_yudu_bridge', tag: '群众 · 出发', hook: '架桥缺木板，一位老人坚持献出来的是什么？' },
  { id: 'guide_laoshanjie', cat: '军民与民族', story: 'story_laoshanjie_mother_rice', tag: '亲历者记述 · 老山界', hook: '她拿出仅有的一点米，给路过的红军煮了粥。红军是怎么做的？' },
  { id: 'guide_yihai', cat: '军民与民族', story: 'story_yihai', tag: '民族 · 彝海', hook: '一度发生冲突的两边，后来怎样结成了盟友？' },
  { id: 'guide_17_yongshi', cat: '事件故事', story: 'story_17_yongshi', tag: '战斗 · 大渡河', hook: '水急、船少、对岸有守军，谁先过河？' },
  { id: 'guide_chen_shuxiang', cat: '人物故事', story: 'story_chen_shuxiang', tag: '人物 · 湘江', hook: '后卫师掩护主力过了江，师长自己后来怎样了？' },
  { id: 'guide_he_jiesheng', cat: '人物故事', story: 'story_he_jiesheng', tag: '人物 · 红二、红六军团', hook: '还在襁褓中的婴儿，是怎样走上长征路的？' },
  { id: 'guide_jiajin_tan_fagui', cat: '人物故事', story: 'story_jiajin_tan_fagui', tag: '人物 · 夹金山', hook: '队伍里年纪很小的战士，是怎样翻过雪山的？' },
  { id: 'guide_hadapu', cat: '会议与决策', story: 'story_hadapu_newspapers', tag: '决策 · 哈达铺', hook: '走出草地之后往哪里去？报纸上的消息起了什么作用？' },
  { id: 'guide_chen_yun_ferry', cat: '事件故事', story: 'story_chen_yun_ferry', tag: '事件 · 金沙江', hook: '江水湍急、渡船有限，大队人马怎样有次序地过江？' },
  { id: 'guide_danjiaji', cat: '军民与民族', story: 'story_danjiaji_night_talk', tag: '民族 · 单家集', hook: '两个月里红军两次来到同一个村子，村民的反应有什么不同？' },
  { id: 'guide_baimian', cat: '军民与民族', story: 'story_baimian_yao_rock', tag: '群众 · 瑶寨', hook: '红军临别时写在岩壁上的标语，后来为什么被刻进了石头？' },
  { id: 'guide_zeng_fanyi', cat: '人物故事', story: 'story_fj_zeng_fanyi', tag: '人物 · 八闽儿女', hook: '跳崖幸存的战士，为什么直到 1984 年才联系上老家的亲人？' },
  { id: 'guide_houchang', cat: '会议与决策', story: 'story_houchang_debate', tag: '决策 · 猴场', hook: '大军停在乌江南岸，是过江还是回头？一场“跨年”的会议怎样定下方向？', whys: ['毛泽东在猴场会议上是怎么反驳的？', '猴场会议之后红军是怎么渡过乌江的？', '猴场会议和黎平会议、遵义会议是什么关系？'] },
  { id: 'guide_nie_dadu', cat: '事件故事', story: 'story_nie_rongzhen_dadu', tag: '战斗 · 大渡河', hook: '身后有追兵、面前是大渡河，先遣队靠什么抢到了渡口？', whys: ['安顺场强渡时，船和炮是怎么配合的？', '强渡成功之后，大部队为什么改去泸定桥？', '彝海结盟帮了先遣队什么忙？'] },
  { id: 'guide_lin_luding', cat: '事件故事', story: 'story_lin_biao_luding', tag: '行军 · 泸定桥', hook: '要在两天半里赶到泸定桥，大军是怎样沿大渡河两岸分兵的？', whys: ['红四团是怎样两天半赶到泸定桥的？', '飞夺泸定桥的22勇士是怎么过桥的？', '为什么红军不继续在安顺场渡河而要夺泸定桥？'] },
  { id: 'guide_ye_supplies', cat: '人物故事', story: 'story_ye_jianying_supplies', tag: '后勤 · 北上途中', hook: '缴获了牛羊，叶剑英为什么要专门去找程世才？', whys: ['红一、红四方面军是在哪里会师的？', '叶剑英在长征中还做过哪些事？'] },
  { id: 'guide_xu_reunion', cat: '人物故事', story: 'story_xu_xiangqian_reunion', tag: '后勤 · 迎接会师', hook: '会师之前，徐向前为什么要先派炊事员带着粮食、盐巴去迎接？', whys: ['红一、红四方面军是怎样在夹金山下会师的？', '夹金山是座什么样的山？', '红军翻夹金山时遇到了什么困难？'] },
  { id: 'guide_deng_redstar', cat: '人物故事', story: 'story_deng_redstar', tag: '人物 · 《红星》报', hook: '行军路上没有铅印条件，一张报纸是怎样一期期印出来的？', whys: ['《红星》报在长征中是怎样出版的？', '邓小平在长征中还做了什么？'] },
  { id: 'guide_zhang_wentian', cat: '会议与决策', story: 'story_zhang_wentian_zunyi', tag: '会议 · 遵义', hook: '遵义会议上，谁最先站起来批评军事指挥？那份提纲是谁写的？', whys: ['遵义会议之后，军事指挥是怎么安排的？', '遵义会议之前，通道和黎平会议改变了什么？'] },
  { id: 'guide_zhu_de', cat: '会议与决策', story: 'story_zhu_de_zunyi', tag: '会议 · 通道、黎平、遵义', hook: '几次关键会议上，朱德为什么都支持改变方向？', whys: ['通道会议为什么决定转向贵州？', '黎平会议作出了什么决定？', '遵义会议后的三人军事小组是怎么组成的？'] },
  { id: 'guide_zhang_side', cat: '人物故事', story: 'story_zhang_side_grass', tag: '人物 · 过草地', hook: '战友发现了一丛能充饥的野菜，他为什么抢着先尝？', whys: ['草地上红军靠什么充饥？', '草地为什么那么难走？'] },
  { id: 'guide_helong', cat: '事件故事', story: 'story_helong_renbishi', tag: '会合 · 红二方面军', hook: '红二、红六军团到了甘孜，为什么要用“釜底抽薪”的办法？', whys: ['红二、红六军团是怎样走到甘孜的？', '红二、红四方面军会合后怎样北上？', '红一、红二方面军是在哪里会师的？'] },
  { id: 'guide_fj_zhongfu', cat: '军民与民族', story: 'story_fj_zhongfu_farewell', tag: '出发 · 中复村', hook: '2000 多名群众赶来告别，红军对他们说了什么？', whys: ['红九军团是怎样撤出松毛岭的？', '中央红军是从哪些地方出发的？', '福建有多少儿女参加了长征？'] },
  { id: 'guide_fj_ninghua', cat: '军民与民族', story: 'story_fj_ninghua_grain', tag: '支前 · 宁化', hook: '1300 名妇女挑粮上前线，她们后来都参加长征了吗？', whys: ['宁化在红军长征出发中起了什么作用？', '苏区群众为红军做了哪些支援？', '福建籍的红军有多少人？'] },
  { id: 'guide_fj_yang_chengwu', cat: '人物故事', story: 'story_fj_yang_chengwu', tag: '人物 · 飞夺泸定桥', hook: '长汀籍的红四团政委，在飞夺泸定桥时做了什么？', whys: ['泸定桥是座什么样的桥？', '红四团为什么被称为开路先锋？'] },
  { id: 'guide_fj_fu_lianzhang', cat: '人物故事', story: 'story_fj_fu_lianzhang', tag: '人物 · 医疗', hook: '伤寒流行、缺医少药，被称为“红色华佗”的他是怎样救治战士的？', whys: ['红军长征路上的医疗条件怎么样？', '傅连暲为毛泽东等人治过病吗？'] },
  { id: 'guide_fj_deng_liujin', cat: '人物故事', story: 'story_fj_deng_liujin', tag: '人物 · 干部休养连', hook: '背着伤员过一座晃动的浮桥，她是怎样过去的？', whys: ['干部休养连是做什么的？', '赤水河前后渡了几次？', '女红军在长征中做些什么？'] },
  { id: 'guide_fj_xie_xiaomei', cat: '人物故事', story: 'story_fj_xie_xiaomei', tag: '人物 · 八闽儿女', hook: '出发前夜，她为什么要把未满月的女儿托付给别人？', whys: ['干部休养连是做什么的？', '娄山关战斗是怎么回事？'] },
  { id: 'guide_fj_wu_fulian', cat: '人物故事', story: 'story_fj_wu_fulian', tag: '人物 · 西路军', hook: '从干部休养连到妇女先锋团政治委员，她后来经历了什么？', whys: ['红军三大主力是在哪里会师的？', '妇女先锋团是一支什么样的部队？'] },
  { id: 'guide_fj_cai_wei', cat: '人物故事', story: 'story_fj_cai_wei', tag: '人物 · 情报', hook: '日均工作近 20 小时、守在电台旁的人，为红军做了什么？', whys: ['军委二局在长征中做什么？', '四渡赤水中情报起了什么作用？', '包座战斗是怎么回事？'] },
];
