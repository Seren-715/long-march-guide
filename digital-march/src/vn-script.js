// 《我的长征》galgame 剧本。
//
// 创作约定（build.mjs 构建时逐条检查，不通过就中止构建）：
// - 人物为虚构（我、班长、石头、张大姐、于都大娘、陕北老乡），台词是创作的；
//   虚构台词与旁白里不许出现阿拉伯数字，不写具体统计和日期，不讲与史实冲突的事。
// - 时间、地点、数字、战斗经过只放在史料卡 card() 里：卡片文字必须逐字取自所引资料原文
//   （可用“……”省略中间部分，每一段都必须能在原文中找到），并附出处。
// - 真实历史人物不配编写的台词、不画立绘；需要时只在史料卡里引用资料记载的原话。
// - 选项不改变历史，只改变“我”和身边人的对话；每个选项对应一种长征精神。
// 这是对项目守则第 5 条的例外：只适用于本作中明确标注为虚构的人物，史实部分仍按第 5 条执行。

const say = (who, t) => ({ who, t });
const me = (t) => ({ who: 'me', t });
const nar = (t) => ({ nar: t });
const card = (t, src, extra = {}) => ({ card: t, src: Array.isArray(src) ? src : [src], ...extra });

export const vnCast = {
  me: { name: '我' },
  banzhang: { name: '班长', sprite: 'sil_banzhang', alt: { ill: 'sil_banzhang_ill' }, full: true },
  shitou: { name: '石头', sprite: 'sil_shitou' },
  zhang: { name: '张大姐', sprite: 'sil_zhang' },
  daniang: { name: '大娘', sprite: 'sil_daniang' },
  laoxiang: { name: '老乡', sprite: 'sil_laoxiang' },
};

export const vnSpirits = {
  sacrifice: '不怕牺牲',
  tenacity: '坚韧不拔',
  unity: '团结奋进',
  people: '忠诚为民',
};

export const vnScenes = [
  {
    id: 'prologue', no: '序幕', title: '出发之前', when: '1934 年秋', bg: 'bg_title', fx: 'dust', amb: 'wind-soft',
    lines: [
      nar('本作人物为虚构；时间、地点、数字和事件依据史料。看到“史料”卡片时，可以点开原文出处。'),
      card('1934 年 10 月，中共中央和中央红军主力撤离中央革命根据地，开始长征。', 'start'),
      me('那年秋天，我刚刚扛得动一支枪。'),
      me('没有人告诉我们要走多远。班长只说：跟上队伍，别掉队。'),
    ],
  },
  {
    id: 'yudu', no: '第一幕', title: '于都出发', when: '1934 年 10 月', bg: 'bg_yudu', fx: 'river', amb: 'river',
    lines: [
      card('1934 年 10 月 10 日，中共中央、中革军委率第 1、第 2 野战纵队从江西瑞金等地出发；17 日起，中央红军主力从于都河等渡口渡河，开始战略转移。', 'yudu'),
      nar('天快黑了，于都河边挤满了人。'),
      say('shitou', '哎，你看，河上又在搭桥了。白天明明拆掉了的。'),
      say('banzhang', '白天有飞机。天黑了搭，天亮前拆。'),
      card('为避免敌机侦察，工兵和群众傍晚架桥、凌晨拆桥。', 'story_yudu_bridge'),
      say('banzhang', '搭桥的木头，好多是老表从自己家里拆下来的。'),
      say('daniang', '伢子，搭把手，这块门板给你们搭桥。'),
      say('shitou', '大娘，门板给了我们，晚上你家门怎么关？'),
      say('daniang', '关什么门哟。你们过得了河才要紧。'),
      { choice: [
        { t: '扛起门板，跟工兵去搭桥', spirit: 'unity', lines: [
          say('banzhang', '两个人抬，一头一个，别让它磕着水。'),
          me('门板压在肩上，比我想的重。河水很急，桥一节一节往对岸伸。'),
          say('daniang', '慢些走，伢子，慢些走。'),
        ] },
        { t: '把自己的干粮塞给大娘', spirit: 'people', lines: [
          say('daniang', '你们路上吃什么？我不要，我不要。'),
          say('banzhang', '收下吧，大娘。他记着你的门板呢。'),
          me('大娘把干粮包又塞回我怀里，转身就扛着门板往河边走了。'),
        ] },
      ] },
      card('沿岸的百姓把能用来搭桥的家当都捐献出来，先后汇集了大小船只 800 多条；红军在短短 4 天时间里架起了 5 座浮桥。', 'story_yudu_bridge'),
      nar('轮到我们过河的时候，我回头看了一眼。岸上的人还站着，看不清是谁了。'),
      say('banzhang', '走吧。往前看。'),
      card('中央红军长征出发时为 8.6 万余人。', 'yudu_army'),
    ],
  },
  {
    id: 'chishui', no: '第二幕', title: '四渡赤水', when: '1935 年 1 月—3 月', bg: 'bg_chishui', fx: 'mist', amb: 'river-rain',
    lines: [
      card('1935 年 1 月 29 日，红军首次渡过赤水河；2 月 18 日至 21 日二渡；3 月 16 日至 17 日三渡；3 月 21 日至 22 日四渡。', 'chishui_detail'),
      nar('同一条河，我们过去，又回来，又过去。'),
      say('shitou', '班长，这条河我们是不是过过了？'),
      say('banzhang', '过过了。'),
      say('shitou', '那不是白走了？'),
      say('banzhang', '我们走得糊涂，追我们的人更糊涂。'),
      card('四渡赤水期间，中革军委和各军团使用电台组成无线电通信网络传递作战命令。', 'chishui_radio'),
      nar('浮桥在水上晃。张大姐背着一个伤员，一步一步往前挪。'),
      say('zhang', '慢一点，桥晃，别往下看。'),
      { choice: [
        { t: '跑过去，帮张大姐抬担架', spirit: 'unity', lines: [
          say('zhang', '好伢子，你抬那头，脚踩稳了再迈。'),
          me('担架上的人一直没出声。过了桥，他抓住我的袖子，攥了好一会儿。'),
          say('zhang', '他是在谢你呢。'),
        ] },
        { t: '在岸边记着，这是第几次过河', spirit: 'tenacity', lines: [
          say('shitou', '我也数着呢。又过来了。'),
          say('banzhang', '数着好。数到哪天不用数了，就到了。'),
          me('我在枪托上刻了一道。后来，那上面又多了好几道。'),
        ] },
      ] },
      card('1935 年 1 月下旬至 5 月上旬，中央红军四渡赤水，南渡乌江，佯攻贵阳，威逼昆明，巧渡金沙江，摆脱了数十万敌军的围追堵截。', 'jinsha'),
    ],
  },
  {
    id: 'luding', no: '第三幕', title: '飞夺泸定桥', when: '1935 年 5 月', bg: 'bg_luding', fx: 'rain', amb: 'torrent',
    lines: [
      card('27 日，红四团接到命令向泸定桥进发；28 日早上又接到电令，要求 29 日早晨夺下泸定桥。部队沿着陡峭的山路强行军，29 日清晨赶到桥西岸。', 'story_22_yongshi'),
      nar('一整夜，我们几乎是跑着过来的。'),
      say('shitou', '我的腿……不是我的了。'),
      say('banzhang', '到了桥边再歇。别停，停下就起不来。'),
      nar('天亮的时候，我看见了那座桥。只有铁索，没有木板。底下的河水是黄的，吼得人耳朵疼。'),
      card('泸定桥没有桥墩，由 13 根铁索连接两岸，其中 9 根构成桥面，两边各 2 根作扶手，桥面的木板已被守军拆去。', 'story_22_yongshi'),
      card('下午 4 时，战斗打响。22 名突击队员在火力掩护下，攀着铁索向对岸前进，后续战士一面战斗，一面向铁索上铺板。', 'story_22_yongshi'),
      say('banzhang', '突击队上去了。我们跟上，铺板！'),
      { choice: [
        { t: '扛起木板，跟着往铁索上铺', spirit: 'sacrifice', lines: [
          me('木板搭上铁索，脚下就是大渡河。我不敢看水，只看前面那块板。'),
          say('banzhang', '一块接一块！后面的人，踩着你铺的板过去！'),
        ] },
        { t: '趴在桥头，盯着对岸的火力点喊位置', spirit: 'tenacity', lines: [
          say('shitou', '左边！左边那个窗口又有枪！'),
          say('banzhang', '喊大声！让前面听见！'),
          me('我的嗓子喊哑了，眼睛一刻也不敢离开对岸。'),
        ] },
      ] },
      { fx: 'fire', flash: true },
      card('快到桥头时，守军点燃了堆在桥头的桥板，东桥头成了一片火海。廖大珠第一个冲了进去，其他队员跟着冲过火海，同守军展开近战。', 'story_22_yongshi'),
      card('夺取泸定桥为中央红军继续北上开辟了通道。', 'luding_significance'),
      { fx: 'rain' },
      say('shitou', '过来了……我们过来了！'),
    ],
  },
  {
    id: 'xueshan', no: '第四幕', title: '爬雪山', when: '1935 年 6 月', bg: 'bg_xueshan', fx: 'snow', amb: 'blizzard',
    lines: [
      card('夹金山海拔 4000 多米，山顶终年白雪皑皑，空气稀薄。6 月 12 日，中央红军先头部队翻越夹金山；6 月 18 日，中央红军所有部队全部翻越夹金山。', 'jiajin'),
      nar('我们穿着草鞋上了雪山。越往上，气越喘不上来。'),
      say('shitou', '班长，我走不动了，我就坐一会儿……'),
      say('zhang', '不能坐！坐下就起不来了。'),
      say('banzhang', '枪给我。你只管走路。'),
      nar('班长把石头的枪挂在自己肩上。他肩上已经有两支了。'),
      { choice: [
        { t: '拉住石头的手，一步一步往上走', spirit: 'tenacity', lines: [
          say('shitou', '你拉着我，我就不停。'),
          me('我们数着步子。数到一百，再从头数起。'),
        ] },
        { t: '解下绑腿，给脚冻伤的战友裹上', spirit: 'unity', lines: [
          say('zhang', '裹紧一点。你自己的脚呢？'),
          me('风把雪灌进领口。我把手缩进袖子里，没说话。'),
        ] },
      ] },
      nar('到了山顶，班长回头看我们，笑了一下，脸上全是冰碴。'),
      say('banzhang', '下山的路滑，抓住前面人的背包。'),
      card('1935 年 6 月 12 日，中央红军一部与红四方面军一部在达维镇会师；6 月 18 日，中共中央和中央红军主力到达懋功（今四川小金）地区。', 'jiajin_maogong'),
    ],
  },
  {
    id: 'caodi', no: '第五幕', title: '过草地', when: '1935 年 8 月', bg: 'bg_caodi', fx: 'rain', amb: 'rain',
    lines: [
      card('草地是千里沼泽，根本找不到道路，一不留神就会陷入泥潭；几天后粮食吃光了，战士们只好沿路找野菜充饥，有时甚至嚼草根、吃牛皮。', 'caodi'),
      nar('草地上没有路。脚下的草一踩，下面就是黑水。'),
      say('shitou', '班长！我的腿陷进去了！'),
      say('banzhang', '别乱动！趴下，抓住枪托！'),
      nar('班长把石头拖了出来，自己却陷到了大腿。等我们把他拉上来，他的脸色已经不对了。'),
      { sprite: { banzhang: 'ill' } },
      say('zhang', '他在发烧。'),
      say('banzhang', '没事……走。别为我停下。'),
      { bg: 'cg_fire', fx: 'rain', amb: 'rain-fire' },
      nar('那天夜里，我们把一根皮带切成细条，煮在锅里。'),
      say('shitou', '班长，喝一口。是皮带汤，有油星。'),
      say('banzhang', '你们先喝。'),
      { choice: [
        { t: '和石头一左一右，架着班长走', spirit: 'sacrifice', lines: [
          say('banzhang', '你们……先走。'),
          say('shitou', '一起走。你说过的，往前看。'),
          me('班长很沉。可我们谁也没松手。'),
        ] },
        { t: '把挖到的野菜留在路边，给后面的队伍', spirit: 'unity', lines: [
          say('zhang', '后面还有好多人呢，他们也饿。'),
          me('我们在野菜旁边插了一根草棍，好让后面的人看见。'),
        ] },
      ] },
      card('穿越草地时粮食十分紧缺，部队按天分配仅有的粮食，先头部队为后续部队留下食物，并为病员节省口粮。', 'caodi_food_rations'),
      card('红军穿越草地时缺粮断炊，许多战士因饥饿、寒冷、疾病和陷入沼泽牺牲。', 'caodi_losses'),
      { bg: 'bg_caodi', fx: 'mist', amb: 'wind-soft' },
      nar('走出草地的那天，班长还活着。他靠在我肩上，说他闻见了炊烟。'),
    ],
  },
  {
    id: 'wuqi', no: '第六幕', title: '到达吴起镇', when: '1935 年 10 月', bg: 'bg_wuqi', fx: 'dust', amb: 'evening',
    lines: [
      card('1935 年 10 月 7 日上午，陕甘支队主力翻越六盘山', 'liupan'),
      card('翻越六盘山后，毛泽东写下《清平乐·六盘山》：“天高云淡，望断南飞雁。不到长城非好汉，屈指行程二万。……”', 'liupan_poem'),
      card('1935 年 10 月 19 日，中共中央率红军陕甘支队到达陕北吴起镇，中央红军主力长征胜利结束。', 'wuqi'),
      nar('山是黄的，土是黄的，窑洞门口站满了人。'),
      say('laoxiang', '红军来了！快进窑里暖和暖和！'),
      say('shitou', '班长，我们走了多远啊？'),
      say('banzhang', '记不清了。脚记得。'),
      card('中央红军历时一年、纵横 11 个省、行程 2.5 万里到达陕北，中央红军主力长征胜利结束。', 'wuqi_summary'),
      { choice: [
        { t: '帮老乡挑水、劈柴', spirit: 'people', lines: [
          say('laoxiang', '你们走了那么远的路，还给我们干活！'),
          say('banzhang', '到哪儿都一样。我们是给老百姓干活的队伍。'),
        ] },
        { t: '坐下来，写下一路上没能走到这里的战友', spirit: 'sacrifice', lines: [
          say('zhang', '写吧。写下来，就有人记得。'),
          me('我写到很晚。有些名字，我只知道他们的外号。'),
        ] },
      ] },
      say('banzhang', '歇两天。往后的路，还长着呢。'),
    ],
  },
  {
    id: 'end', no: '尾声', title: '一年以后', when: '1936 年 10 月', bg: 'bg_end', fx: 'dust', amb: 'finale',
    lines: [
      card('1936 年 10 月 9 日，红四方面军在甘肃会宁与红一方面军会师。', 'huining'),
      card('1936 年 10 月 22 日，红二方面军在将台堡（今属宁夏西吉）与红一方面军会师。红一、红二、红四方面军在会宁和将台堡地区会师，标志着长征胜利结束。', 'jiangtaibao'),
      me('又是一年秋天。山梁上的红旗，从四面八方汇到了一起。'),
      card('长征是历史纪录上的第一次，长征是宣言书，长征是宣传队，长征是播种机。', 'zhiluozhen_manifesto', { who: '毛泽东，1935 年 12 月 27 日，瓦窑堡' }),
    ],
  },
];
