// 故事专题：把阅读引导按主题串成几条线，读完一篇后可以顺着这条线读下一篇。
// 约定：这里不新增史实。blurb 只概括这条线上故事的共同主题；items 是 story-guides.js 里的引导 ID，
// 按故事发生的先后排列；一篇故事可以出现在不止一条专题里。测试会检查 ID 存在、每条至少 4 篇、所有引导至少属于一条专题。
export const storyTrails = [
  { id: 'trail_turning', title: '转折之路', blurb: '从通道、黎平到猴场、遵义，再到苟坝和哈达铺：路线之争和几次关键决定。',
    items: ['guide_zhu_de', 'guide_houchang', 'guide_zhang_wentian', 'guide_sidu_chishui', 'guide_mao_lamp', 'guide_hadapu'] },
  { id: 'trail_start', title: '出发与湘江', blurb: '出发前的架桥、告别，到湘江血战和翻越老山界。',
    items: ['guide_yudu_bridge', 'guide_fj_zhongfu', 'guide_deng_redstar', 'guide_chen_shuxiang', 'guide_zeng_fanyi', 'guide_laoshanjie'] },
  { id: 'trail_rivers', title: '渡江与夺桥', blurb: '金沙江、彝海、大渡河到泸定桥：一个月里连着闯过的几道关。',
    items: ['guide_chen_yun_ferry', 'guide_yihai', 'guide_nie_dadu', 'guide_17_yongshi', 'guide_lin_luding', 'guide_22_yongshi', 'guide_fj_yang_chengwu'] },
  { id: 'trail_snow', title: '雪山与草地', blurb: '翻夹金山、过草地时的饥饿、疾病和互相扶持。',
    items: ['guide_xu_reunion', 'guide_jiajin_tan_fagui', 'guide_ye_supplies', 'guide_zhou_enlai', 'guide_banjie_pidai', 'guide_zhang_side', 'guide_fj_fu_lianzhang'] },
  { id: 'trail_women', title: '她们的长征', blurb: '女红军和支前的妇女：从挑粮、借宿到走完长征，也有走向西路军的。',
    items: ['guide_fj_ninghua', 'guide_banbei_beizi', 'guide_he_zizhen', 'guide_fj_xie_xiaomei', 'guide_fj_deng_liujin', 'guide_he_jiesheng', 'guide_fj_wu_fulian'] },
  { id: 'trail_people', title: '军民一家', blurb: '红军与沿途群众、少数民族之间的故事。',
    items: ['guide_yudu_bridge', 'guide_laoshanjie', 'guide_yihai', 'guide_baimian', 'guide_danjiaji', 'guide_banbei_beizi'] },
  { id: 'trail_fujian', title: '八闽儿女', blurb: '福建人的长征：从出发地、支前到一路上的人。',
    items: ['guide_fj_zhongfu', 'guide_fj_ninghua', 'guide_zeng_fanyi', 'guide_fj_yang_chengwu', 'guide_fj_fu_lianzhang', 'guide_fj_deng_liujin', 'guide_fj_xie_xiaomei', 'guide_fj_wu_fulian', 'guide_fj_cai_wei'] },
  { id: 'trail_reunion', title: '走向会师', blurb: '从哈达铺的决定，到单家集、红二方面军北上，再到会师之后：长征最后一程的故事。',
    items: ['guide_hadapu', 'guide_danjiaji', 'guide_helong', 'guide_fj_wu_fulian'] },
];
