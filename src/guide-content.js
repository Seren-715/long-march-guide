// 讲解互动内容：抉择时刻与每站小题。
//
// 所有内容都只能依据 src/data.js 中的资料条目撰写，并在 sources 中写明依据的资料 ID。
// reviewed: false 表示草稿，尚未由人工对照原文核对；页面默认不显示草稿，
// 只有在网址后加 ?draft=1 时才显示（并标注“草稿·待核对”）。
// 核对无误后把对应条目的 reviewed 改为 true，即可正式上线。
//
// test.mjs 会自动检查：节点与资料 ID 存在、答案序号有效、
// 文字中的阿拉伯数字都出现在所列资料中。

export const decisions = {
  tongdao: {
    reviewed: false,
    situation: '湘江之战中，中央红军突破第四道封锁线，但损失惨重，由出发时的 8.6 万余人减至 3 万余人。长征初期的原计划，是向湘西北转移，与红二、红六军团会合。1934 年 12 月 12 日，中革军委在湖南通道召开紧急会议，讨论接下来往哪里走。',
    question: '如果你在场，会倾向哪种选择？',
    options: ['按原计划，北上湘西与红二、红六军团会合', '改变方向，向西进入贵州'],
    outcome: '通道会议后，中革军委发出“万万火急”电令，部署“我军明十三号继续西进”，中央红军改向贵州方向前进。12 月 18 日的黎平会议否定了在湘西创建根据地的原计划，确定以遵义为中心建立川黔边新根据地。',
    sources: ['xiangjiang_detail', 'xiangjiang_lines', 'tongdao', 'tongdao_liming'],
  },
  luding: {
    reviewed: false,
    situation: '1935 年 5 月 24 日夜，中央红军先头部队袭占安顺场渡口；25 日晨，17 名勇士乘木船强渡大渡河，控制了北岸渡口。可是船只不足，又无法架桥，大部队一时过不了河。',
    question: '如果你在场，会倾向哪种选择？',
    options: ['留在安顺场，用仅有的船只分批渡河', '主力继续北上，去夺取泸定桥'],
    outcome: '主力继续北上夺取泸定桥。5 月 29 日，中央红军左纵队先头部队从泸定桥西头发起夺桥战斗，抢占大桥，为继续北上打开了通路。',
    sources: ['luding_dadu', 'luding_detail', 'luding'],
  },
  lazikou: {
    reviewed: false,
    situation: '1935 年 8 月的毛儿盖会议确定，以岷州、洮河为中心向东发展。9 月 17 日，红军突破天险腊子口；18 日到达甘肃哈达铺，毛泽东从国民党《大公报》上得知：陕北有根据地，也有红军。',
    question: '长征的落脚点该放在哪里？如果你在场，会怎么判断？',
    options: ['按毛儿盖会议的方针，以岷州、洮河为中心向东发展', '前往陕北，在那里建立根据地'],
    outcome: '9 月 22 日的团以上干部会议确定到陕北建立根据地；9 月 27 日，中央政治局常委在榜罗镇开会，决定把长征落脚点放在陕北。10 月 19 日，中共中央率陕甘支队到达陕北吴起镇。',
    sources: ['caodi_maogai', 'lazikou', 'lazikou_hadapu', 'lazikou_bangluo', 'wuqi'],
  },
};

export const quizzes = {
  start: { reviewed: false, question: '1934 年 10 月 17 日起，中央红军主力从哪条河的渡口渡河，开始战略转移？', options: ['于都河', '湘江', '乌江'], answer: 0, source: 'start_yudu' },
  xiangjiang: { reviewed: false, question: '湘江战役后，中央红军由出发时的 8.6 万余人减至多少？', options: ['3 万余人', '5 万余人', '7 万余人'], answer: 0, source: 'xiangjiang_lines' },
  tongdao: { reviewed: false, question: '通道会议后，中革军委的电令部署红军向哪个方向前进？', options: ['北上湘西', '继续西进，改向贵州', '东返江西'], answer: 1, source: 'tongdao' },
  zunyi: { reviewed: false, question: '遵义会议集中解决的是当时哪方面具有决定意义的问题？', options: ['军事和组织问题', '经济和财政问题', '外交和统战问题'], answer: 0, source: 'zunyi' },
  chishui: { reviewed: false, question: '红军首次渡过赤水河是在哪一天？', options: ['1935 年 1 月 29 日', '1935 年 2 月 18 日', '1935 年 3 月 21 日'], answer: 0, source: 'chishui_detail' },
  jinsha: { reviewed: false, question: '为创造北渡金沙江的条件，中央红军佯攻了哪座城市？', options: ['成都', '昆明', '重庆'], answer: 1, source: 'jinsha_detail' },
  luding: { reviewed: false, question: '安顺场渡口，营长孙继先挑选了多少名勇士乘木船强渡大渡河？', options: ['7 名', '17 名', '27 名'], answer: 1, source: 'luding_dadu' },
  jiajin: { reviewed: false, question: '长征途中第一座大雪山夹金山，海拔大约多少？', options: ['2000 余米', '4000 余米', '6000 余米'], answer: 1, source: 'jiajin' },
  caodi: { reviewed: false, question: '右路军 8 月 21 日从毛儿盖出发穿越草地，哪天到达班佑？', options: ['8 月 27 日', '9 月 17 日', '10 月 19 日'], answer: 0, source: 'caodi' },
  lazikou: { reviewed: false, question: '中央红军在哪里从报纸上得知陕北有根据地和红军？', options: ['腊子口', '哈达铺', '榜罗镇'], answer: 1, source: 'lazikou_hadapu' },
  wuqi: { reviewed: false, question: '长征中最先到达陕北的红军部队是哪一支？', options: ['红二十五军', '红四方面军', '红二方面军'], answer: 0, source: 'wuqi_red25' },
  zhiluozhen: { reviewed: false, question: '毛泽东说，直罗镇战役的胜利“算是举行了”什么？', options: ['誓师礼', '奠基礼', '庆功礼'], answer: 1, source: 'zhiluozhen_dianji' },
  huining: { reviewed: false, question: '1936 年 10 月 9 日，在甘肃会宁与红一方面军会师的是哪支部队？', options: ['红二方面军', '红四方面军', '红二十五军'], answer: 1, source: 'huining' },
  jiangtaibao: { reviewed: false, question: '红一、红二方面军会师的将台堡，今属哪里？', options: ['甘肃会宁', '宁夏西吉', '陕西富县'], answer: 1, source: 'jiangtaibao' },
};
