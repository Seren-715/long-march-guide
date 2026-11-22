// 《数字长征》（赛道二 · AI 编程）页面用到的结构化事实。
//
// 约定：这里不新增史实。每一条都写明 ref（src/data.js 里的节点或资料 ID，或 src/stories.js 里的故事 ID）
// 和 quote（必须逐字出现在该资料正文中的片段）。build.mjs 构建时逐条核对，找不到原文就中止构建。
// 页面上显示的日期、数字、会议决定都从这里或 data.js / stories.js 原文取，不由程序生成新的说法。

// 一、行军沙盘上每一站的日期锚点（推算“出发后第几天”用）。precision: 'day' | 'month'；end：资料原文给出的结束日（只在 quote 含区间时填写）
export const dateAnchors = {
  start:      { iso: '1934-10-10', label: '1934年10月10日', ref: 'yudu', quote: '1934 年 10 月 10 日，中共中央、中革军委率第 1、第 2 野战纵队从江西瑞金等地出发' },
  yudu:       { iso: '1934-10-17', label: '1934年10月17日起', ref: 'yudu_ferry', quote: '1934 年 10 月 17 日起' },
  xiangjiang: { iso: '1934-11-27', end: '1934-12-01', label: '1934年11月27日—12月1日', ref: 'xiangjiang', quote: '1934 年 11 月 27 日至 12 月 1 日' },
  tongdao:    { iso: '1934-12-12', label: '1934年12月12日', ref: 'tongdao', quote: '1934 年 12 月 12 日' },
  liping:     { iso: '1934-12-18', label: '1934年12月18日', ref: 'liping', quote: '1934 年 12 月 18 日' },
  houchang:   { iso: '1934-12-31', label: '1934年12月31日晚', ref: 'houchang', quote: '1934 年 12 月 31 日晚' },
  wujiang:    { iso: '1935-01-01', end: '1935-01-06', label: '1935年1月1日—6日', ref: 'wujiang', quote: '1935 年 1 月 1 日至 6 日' },
  zunyi:      { iso: '1935-01-15', end: '1935-01-17', label: '1935年1月15日—17日', ref: 'zunyi', quote: '1935 年 1 月 15 日至 17 日' },
  chishui:    { iso: '1935-01-29', label: '1935年1月29日首渡', ref: 'chishui_detail', quote: '1935 年 1 月 29 日，红军首次渡过赤水河' },
  kunming:    { iso: '1935-04', precision: 'month', label: '1935年4月', ref: 'kunming', quote: '1935 年 4 月，红军佯攻昆明' },
  jinsha:     { iso: '1935-05-03', end: '1935-05-09', label: '1935年5月3日—9日', ref: 'jinsha_complete', quote: '1935 年 5 月 3 日至 9 日' },
  huili:      { iso: '1935-05-12', label: '1935年5月12日', ref: 'huili', quote: '1935 年 5 月 12 日' },
  lizhou:     { iso: '1935-05-21', label: '1935年5月21日', ref: 'lizhou', quote: '1935 年 5 月 21 日' },
  yihai:      { iso: '1935-05-22', label: '1935年5月22日', ref: 'yihai', quote: '1935 年 5 月 22 日' },
  dadu:       { iso: '1935-05-25', label: '1935年5月25日晨', ref: 'dadu', quote: '1935 年 5 月 25 日晨' },
  luding:     { iso: '1935-05-29', label: '1935年5月29日', ref: 'luding', quote: '1935 年 5 月 29 日' },
  jiajin:     { iso: '1935-06-12', end: '1935-06-18', label: '1935年6月12日—18日', ref: 'jiajin', quote: '6 月 12 日，中央红军先头部队翻越夹金山；6 月 18 日，中央红军所有部队全部翻越夹金山' },
  maoergai:   { iso: '1935-08-20', label: '1935年8月20日', ref: 'maoergai', quote: '1935 年 8 月 20 日' },
  caodi:      { iso: '1935-08-21', end: '1935-08-27', label: '1935年8月21日—27日', ref: 'caodi', quote: '1935 年 8 月 21 日，右路军从毛儿盖出发，穿越川西北松潘草地，8 月 27 日到达班佑' },
  lazikou:    { iso: '1935-09-16', label: '1935年9月16日—17日', ref: 'lazikou', quote: '1935 年 9 月 16 日' },
  hadapu:     { iso: '1935-09-18', label: '1935年9月18日', ref: 'hadapu', quote: '1935 年 9 月 18 日' },
  liupan:     { iso: '1935-10-07', label: '1935年10月7日', ref: 'liupan', quote: '1935 年 10 月 7 日上午' },
  wuqi:       { iso: '1935-10-19', label: '1935年10月19日', ref: 'wuqi', quote: '1935 年 10 月 19 日' },
  zhiluozhen: { iso: '1935-11-21', end: '1935-11-24', label: '1935年11月21日—24日', ref: 'zhiluozhen', quote: '1935 年 11 月 21 日至 24 日' },
  huining:    { iso: '1936-10-09', label: '1936年10月9日', ref: 'huining', quote: '1936 年 10 月 9 日' },
  jiangtaibao:{ iso: '1936-10-22', label: '1936年10月22日', ref: 'jiangtaibao', quote: '1936 年 10 月 22 日' },
};

// 二、开篇数字条
export const heroStats = [
  { value: '8.6万余', unit: '人', label: '中央红军出发时', ref: 'yudu_army', quote: '中央红军长征出发时为 8.6 万余人' },
  { value: '一年', unit: '', label: '历时', ref: 'wuqi_summary', quote: '历时一年' },
  { value: '11', unit: '个省', label: '纵横', ref: 'wuqi_summary', quote: '纵横 11 个省' },
  { value: '2.5万', unit: '里', label: '行程', ref: 'wuqi_summary', quote: '行程 2.5 万里' },
];

// 三、四路红军的长征（甘特图）。start / end 只到月，按资料原文。
export const armies = [
  { id: 'red1', name: '红一方面军', alias: '中央红军', start: '1934-10', end: '1935-10', distance: '约 2.5 万里',
    refs: [{ ref: 'start_route_dates', quote: '红一方面军 1934 年 10 月至 1935 年 10 月' }, { ref: 'start_route_compare', quote: '红一方面军约 2.5 万里' }] },
  { id: 'red25', name: '红二十五军', alias: '', start: '1934-11', end: '1935-09', distance: '近 1 万里',
    refs: [{ ref: 'start_route_dates', quote: '红二十五军 1934 年 11 月至 1935 年 9 月' }, { ref: 'start_route_compare', quote: '红二十五军近 1 万里' }] },
  { id: 'red4', name: '红四方面军', alias: '', start: '1935-03', end: '1936-10', distance: '1 万余里',
    refs: [{ ref: 'start_route_dates', quote: '红四方面军 1935 年 3 月至 1936 年 10 月' }, { ref: 'start_route_compare', quote: '红四方面军 1 万余里' }] },
  { id: 'red2', name: '红二方面军', alias: '红二、红六军团', start: '1935-11', end: '1936-10', distance: '2 万余里',
    refs: [{ ref: 'start_route_dates', quote: '红二方面军 1935 年 11 月至 1936 年 10 月' }, { ref: 'start_route_compare', quote: '红二方面军 2 万余里' }] },
];
// 甘特图上的事件点。armies：这件事涉及哪几路（画在哪几行上）
export const armyEvents = [
  { date: '1935-06', label: '一、四方面军部队在达维会师', armies: ['red1', 'red4'], ref: 'jiajin_maogong', quote: '中央红军一部与红四方面军一部在达维镇会师' },
  { date: '1935-09', label: '红二十五军最先到达陕北', armies: ['red25'], ref: 'wuqi_red25', quote: '是长征中最先到达陕北的红军部队' },
  { date: '1936-07', label: '二、六军团与红四方面军会师', armies: ['red2', 'red4'], ref: 'jiangtaibao_red2route', quote: '红二、红六军团与红四方面军胜利会师' },
  { date: '1936-10', label: '会宁、将台堡会师，长征胜利结束', armies: ['red1', 'red2', 'red4'], ref: 'jiangtaibao', quote: '标志着长征胜利结束' },
];

// 四、中央红军人数：资料只给出这三个时间点
export const armySizes = [
  { when: '1934.10', place: '出发时', value: 86000, text: '8.6 万余人', ref: 'yudu_army', quote: '中央红军长征出发时为 8.6 万余人' },
  { when: '1934.12', place: '湘江战役后', value: 30000, text: '3 万余人', ref: 'xiangjiang_lines', quote: '由出发时的 8.6 万余人减至 3 万余人' },
  { when: '1935.09', place: '哈达铺（陕甘支队）', value: 7000, text: '约 7000 余人', ref: 'hadapu_rest', quote: '部队约 7000 余人' },
];
export const armySizeCaveat = {
  text: '后两个数字之间，有扎西会议后的缩编、巴西会议后只有一部分部队先行北上、俄界会议缩编为陕甘支队等变化。资料没有给出减员的分项，不能把差额都看作伤亡。',
  refs: [
    { ref: 'chishui_zhaxi', quote: '缩编部队' },
    { ref: 'caodi_brazil', quote: '决定率红一、红三军和军委纵队一部先行北上' },
    { ref: 'lazikou_ejie', quote: '缩编为中国工农红军陕甘支队' },
  ],
};

// 五、会议与转折：decision 必须是资料原文片段（页面原样显示）
export const meetings = [
  { name: '通道会议', date: '1934.12.12', node: 'tongdao', ref: 'tongdao', decision: '中央红军改向贵州方向前进' },
  { name: '黎平会议', date: '1934.12.18', node: 'liping', ref: 'liping', decision: '否定在湘西创建根据地的原计划，确定以遵义为中心的川黔边新根据地' },
  { name: '猴场会议', date: '1934.12.31—1935.1.1', node: 'houchang', ref: 'houchang', decision: '再次否定回头东进湘西的主张，决定立即强渡乌江、攻占遵义' },
  { name: '遵义会议', date: '1935.1.15—17', node: 'zunyi', ref: 'zunyi_detail', decision: '改组中央领导机构，选举毛泽东为中央政治局常委', key: true },
  { name: '扎西会议', date: '1935.2.5—9', node: 'chishui', ref: 'chishui_zhaxi', decision: '作出“回兵黔北”和缩编部队的决策，并正式通过《遵义会议决议》' },
  { name: '苟坝会议', date: '1935.3', node: 'chishui', ref: 'chishui_gouba', decision: '决定放弃攻打打鼓新场，并确立由毛泽东、周恩来、王稼祥组成的三人军事领导小组' },
  { name: '会理会议', date: '1935.5.12', node: 'huili', ref: 'huili', decision: '决定立即北上、抢渡大渡河，并维护党和红军的团结' },
  { name: '礼州会议', date: '1935.5.21', node: 'lizhou', ref: 'lizhou_plan', decision: '决定避开大道，穿越大凉山彝族聚居地区，赶往大渡河' },
  { name: '两河口会议', date: '1935.6.26', node: 'jiajin', ref: 'jiajin_lianghekou', decision: '确定集中主力北上、创造川陕甘根据地的战略方针' },
  { name: '沙窝会议', date: '1935.8.4—6', node: 'maoergai', ref: 'maoergai_shawo', decision: '重申北上创造川陕甘根据地的方针' },
  { name: '毛儿盖会议', date: '1935.8.20', node: 'maoergai', ref: 'maoergai', decision: '确定以岷州、洮河为中心向东发展' },
  { name: '巴西会议', date: '1935.9.9', node: 'caodi', ref: 'caodi_brazil', decision: '决定率红一、红三军和军委纵队一部先行北上，向甘南前进' },
  { name: '俄界会议', date: '1935.9.12', node: 'lazikou', ref: 'lazikou_ejie', decision: '决定继续北上，并将红一、红三军团缩编为中国工农红军陕甘支队' },
  { name: '哈达铺干部会议', date: '1935.9.22', node: 'hadapu', ref: 'hadapu', decision: '确定到陕北建立根据地' },
  { name: '榜罗镇会议', date: '1935.9.27', node: 'lazikou', ref: 'lazikou_bangluo', decision: '作出了把红军长征落脚点放在陕北的决策' },
  { name: '吴起镇会议', date: '1935.10.22', node: 'wuqi', ref: 'wuqi_meeting', decision: '宣布中央红军已完成一年的长途行军，提出党的新任务是保卫与扩大陕北苏区' },
  { name: '瓦窑堡会议', date: '1935.12.17—25', node: 'zhiluozhen', ref: 'zhiluozhen_wayaobao', decision: '确定建立抗日民族统一战线的策略' },
];

// 六、四渡赤水示意：side 是渡河后在河的哪一侧（west / east），只用于示意图左右摆放
export const chishuiSteps = [
  { date: '1935.1.28', title: '土城战斗', kind: 'event', side: 'east', ref: 'chishui_tucheng', text: '中央红军在贵州习水土城青杠坡与川军激战，伤亡 3000 余人。当晚红军决定撤出战斗' },
  { date: '1935.1.29', title: '一渡赤水', kind: 'cross', side: 'west', ref: 'chishui_tucheng', text: '次日凌晨从土城浑溪口、蔡家沱、元厚等渡口西渡赤水河，拉开四渡赤水的序幕' },
  { date: '1935.2.5—9', title: '扎西会议', kind: 'event', side: 'west', ref: 'chishui_zhaxi', text: '作出“回兵黔北”和缩编部队的决策' },
  { date: '1935.2.18—21', title: '二渡赤水', kind: 'cross', side: 'east', ref: 'zunyi_loushan', text: '红军主力二渡赤水，进军遵义' },
  { date: '1935.2.25', title: '娄山关', kind: 'event', side: 'east', ref: 'zunyi_loushan', text: '娄山关战斗是红军长征以来打的第一个大胜仗' },
  { date: '1935.3', title: '苟坝会议', kind: 'event', side: 'east', ref: 'chishui_gouba', text: '决定放弃攻打打鼓新场' },
  { date: '1935.3.16', title: '三渡赤水', kind: 'cross', side: 'west', ref: 'chishui_maneuver', text: '3 月 16 日红军由茅台地区西渡赤水河，采取白天渡河等行动，佯作北渡长江' },
  { date: '1935.3.21', title: '四渡赤水', kind: 'cross', side: 'east', ref: 'chishui_maneuver', text: '3 月 21 日由二郎滩、太平渡地区东渡赤水河，主力随后向南进军，并于 3 月 31 日南渡乌江' },
];

// 七、数字卡片：翻面后显示资料原文片段
export const numberCards = [
  { n: '8', unit: '个渡口', label: '于都河', ref: 'yudu_ferry', text: '1934 年 10 月 17 日起，中央红军主力从于都河 8 个主要渡口分批渡河' },
  { n: '7', unit: '只木船', label: '金沙江 · 皎平渡', ref: 'jinsha_boats', text: '前后共获木船 7 只，并设法找来 30 多位船工' },
  { n: '17', unit: '名勇士', label: '大渡河 · 安顺场', ref: 'dadu_boatmen', text: '孙继先挑选 17 名战士组成突击队，连长熊尚林担任队长；帅士高等 4 名当地船工摆渡' },
  { n: '3', unit: '只小船', label: '安顺场渡口', ref: 'luding_decision', text: '安顺场渡口又只有 3 只小船，往返一次需要一个多小时，照这种渡法，全军过河需要一个多月' },
  { n: '22', unit: '名突击队员', label: '泸定桥', ref: 'luding', text: '红四团二连 22 名共产党员和积极分子组成突击队，冒着枪林弹雨和熊熊烈焰，攀着桥上铁索前进' },
  { n: '4000', unit: '多米', label: '夹金山海拔', ref: 'jiajin', text: '夹金山海拔 4000 多米，山顶终年白雪皑皑，空气稀薄' },
  { n: '17', unit: '块弹片', label: '贺子珍', ref: 'jinsha_person_he_zizhen', text: '她为掩护腿部负伤的钟赤兵，身中 17 块弹片' },
  { n: '18', unit: '天大', label: '贺捷生', ref: 'jiangtaibao_person_he_jiesheng', text: '她出生仅 18 天，被放在骡子背上，由父母和红军叔叔阿姨抱着、背着走完长征' },
  { n: '半', unit: '条被子', label: '湖南汝城沙洲村', ref: 'xiangjiang_quilt', text: '其中一名女红军用剪刀将自己的行军被剪开，将半条被子留给了徐解秀' },
];

// 八、问答题里的数字题：answer 必须出现在 quote 中，quote 必须出现在资料原文中
export const numberQuestions = [
  { q: '1935 年 5 月强渡大渡河时，孙继先挑选了多少名战士组成突击队？', answer: '17 名', options: ['17 名', '22 名', '30 名', '7 名'], ref: 'dadu_boatmen', quote: '孙继先挑选 17 名战士组成突击队' },
  { q: '飞夺泸定桥时，红四团二连组成突击队的共产党员和积极分子有多少名？', answer: '22 名', options: ['17 名', '22 名', '12 名', '36 名'], ref: 'luding', quote: '22 名共产党员和积极分子组成突击队' },
  { q: '巧渡金沙江时，先遣部队在皎平渡前后共找到几只木船？', answer: '7 只', options: ['3 只', '7 只', '17 只', '30 只'], ref: 'jinsha_boats', quote: '前后共获木船 7 只' },
  { q: '中央红军长征出发时有多少人？', answer: '8.6 万余人', options: ['3 万余人', '8.6 万余人', '7000 余人', '50 万人'], ref: 'yudu_army', quote: '中央红军长征出发时为 8.6 万余人' },
  { q: '夹金山海拔大约多少米？', answer: '4000 多米', options: ['2000 多米', '3000 多米', '4000 多米', '6000 多米'], ref: 'jiajin', quote: '夹金山海拔 4000 多米' },
  { q: '中央红军主力从于都河的几个主要渡口分批渡河？', answer: '8 个', options: ['3 个', '5 个', '8 个', '12 个'], ref: 'yudu_ferry', quote: '从于都河 8 个主要渡口分批渡河' },
  { q: '按照现今省级行政区划统计，各路红军长征经过多少个省级行政区？', answer: '15 个', options: ['11 个', '14 个', '15 个', '18 个'], ref: 'start_provinces', quote: '按照现今省级行政区划统计则为 15 个' },
  { q: '贺子珍为掩护负伤的钟赤兵，身中多少块弹片？', answer: '17 块', options: ['7 块', '17 块', '22 块', '3 块'], ref: 'jinsha_person_he_zizhen', quote: '身中 17 块弹片' },
  { q: '红二、红六军团从桑植出发长征时，贺捷生出生仅几天？', answer: '18 天', options: ['3 天', '18 天', '30 天', '100 天'], ref: 'jiangtaibao_person_he_jiesheng', quote: '她出生仅 18 天' },
  { q: '红二十五军从河南罗山何家冲出发，历时 10 个月转战多少里？', answer: '9000 里', options: ['5000 里', '9000 里', '2 万里', '2.5 万里'], ref: 'wuqi_red25', quote: '历时 10 个月转战 9000 里' },
  { q: '湘江战役后，中央红军由出发时的 8.6 万余人减至多少人？', answer: '3 万余人', options: ['5 万余人', '3 万余人', '1 万余人', '7000 余人'], ref: 'xiangjiang_lines', quote: '减至 3 万余人' },
  { q: '六盘山下的青石嘴战斗大约历时多久？', answer: '约半小时', options: ['约半小时', '约三小时', '一整天', '三天三夜'], ref: 'liupan', quote: '随后的战斗历时约半小时' },
];

// 九、结尾引文
export const closingQuotes = [
  { ref: 'zhiluozhen_manifesto', quote: '长征是历史纪录上的第一次，长征是宣言书，长征是宣传队，长征是播种机。', who: '毛泽东，1935 年 12 月 27 日，瓦窑堡' },
  { ref: 'liupan_poem', quote: '天高云淡，望断南飞雁。不到长城非好汉，屈指行程二万。', who: '毛泽东《清平乐·六盘山》' },
];
