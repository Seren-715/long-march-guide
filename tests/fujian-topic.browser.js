async page => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({width:1440,height:900});
  await page.goto('http://127.0.0.1:4187/');
  const topic = page.locator('#fujian-page');
  const detail = page.locator('#fujian-detail');
  const cards = page.locator('#fujian-list button');
  const nav = section => page.locator('#section-' + section);
  const hash = () => page.evaluate(() => location.hash);

  await page.locator('#start-browse').click();
  await nav('stories').click();
  if (await hash() !== '#stories') throw Error('自由浏览未进入故事目录');
  await nav('browse').click();
  if (!(await page.locator('#map3d').isVisible())) throw Error('故事目录未返回沙盘自由浏览');
  await nav('fujian').click();
  if (!(await topic.isVisible()) || !(await page.locator('#chat-pane').isVisible())) throw Error('桌面专题双栏未显示');
  if (await cards.count() !== 12 || await detail.isVisible() || await topic.locator('a[href]').count()) throw Error('专题目录应有 12 张卡片且不展开正文或来源');
  await nav('stories').click();
  await nav('fujian').click();
  await nav('browse').click();
  await nav('fujian').click();

  const titles = await cards.locator('b').allTextContents();
  if (new Set(titles).size !== 12) throw Error('专题卡片标题应各不相同');
  await cards.first().click();
  const first = await hash();
  if (!first.startsWith('#fujian-') || !(await detail.isVisible()) || !(await detail.locator('a[href]').count())) throw Error('专题正文或出处未显示');
  if (await page.locator('#fujian-title').innerText() !== titles[0]) throw Error('专题正文标题错误');
  await page.reload();
  if (!(await detail.isVisible()) || await hash() !== first) throw Error('刷新专题正文未恢复');
  await page.goBack();
  if (!(await cards.first().isVisible()) || await hash() !== '#fujian') throw Error('后退未返回专题目录');
  await page.goForward();
  if (!(await detail.isVisible()) || await hash() !== first) throw Error('前进未恢复专题正文');
  await page.locator('#fujian-back').click();
  await cards.nth(1).click();
  if (await hash() === first || await page.locator('#fujian-title').innerText() !== titles[1]) throw Error('不同专题卡片应进入不同正文页');

  await page.setViewportSize({width:390,height:844});
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error('手机页面横向溢出');
  await page.locator('#sw-chat').click();
  if (!(await page.locator('#question').isVisible())) throw Error('手机对话未显示');
  await page.locator('#sw-read').click();
  await page.locator('#fujian-back').click();
  await cards.filter({hasText:'杨成武'}).first().click();
  await detail.getByRole('button',{name:/查看关联节点：泸定桥/}).click();
  if (!(await page.locator('#story-story_fj_yang_chengwu').isVisible())) throw Error('未进入相关节点的故事');
  await page.goBack();
  if (!(await detail.isVisible())) throw Error('节点后退未返回专题正文');
  await nav('stories').click();
  await nav('fujian').click();
  if (await hash() !== '#fujian') throw Error('手机板块切换失败');
  const requests = [];
  await page.route('**/api/chat', async route => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({json:{
      answer:'测试回答', type:'history', historyToken:'story-context-token',
      sources:[{id:'story_fj_yang_chengwu', title:'测试出处', url:'https://example.com/source', excerpt:'测试依据'}]
    }});
  });
  const askStory = async question => {
    await detail.getByRole('button',{name:'向小征提问'}).click();
    await page.locator('#question').fill(question);
    await page.locator('#chat-form button[type=submit]').click();
    await page.waitForFunction(() => !document.getElementById('send').disabled);
  };
  await cards.filter({hasText:'杨成武'}).first().click();
  await askStory('他和谁一起指挥？');
  if (requests[0]?.story !== 'story_fj_yang_chengwu') throw Error('问答未收到当前故事');
  const mapCard = page.getByRole('button',{name:'打开讲解：泸定桥'}).last();
  await mapCard.click();
  if (await hash() !== '#luding' || !(await page.locator('#map3d').isVisible())) throw Error('回答中的卡片未打开关联沙盘');
  await page.goBack();
  await detail.waitFor();
  await page.locator('#fujian-back').click();
  await cards.filter({hasText:'傅连暲'}).first().click();
  await askStory('他负责什么工作？');
  if (requests[1]?.story !== 'story_fj_fu_lianzhang' || requests[1]?.historyTokens?.length !== 0) throw Error('切换故事后沿用了旧的问答上下文');
  await page.locator('#sw-read').click();
  await askStory('他的职务是什么？');
  if (requests[2]?.historyTokens?.[0] !== 'story-context-token') throw Error('同一故事内无法继续追问');
  if (errors.length) throw Error(errors.join('; '));
  return {navigation:true, cards:12, details:true, history:true, mobile:true, relatedStop:true};
}
