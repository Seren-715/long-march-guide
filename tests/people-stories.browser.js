async page => {
  const names=['王稼祥','陈云','博古','李德','彭德怀','聂荣臻','林彪','叶剑英','徐向前'];
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('#start-people').click();
  if (!(await page.locator('#people-page').isVisible())) throw Error('人物档案没有以独立页面打开');
  if (await page.locator('dialog[open]').count()) throw Error('人物档案仍是弹窗');
  if (!/^#people$/.test(await page.evaluate(()=>location.hash))) throw Error('人物档案地址不对');
  const cards=await page.locator('#people-list .story-next').count();
  if (cards<20) throw Error('人物卡片太少：'+cards);
  const checked=[];
  for (const name of names) {
    await page.locator('#people-list').getByRole('button',{name:new RegExp('^'+name+'，')}).click();
    const detail=page.locator('#person-detail');
    if ((await page.locator('#people-title').innerText())!==name) throw Error(name+' 详情标题不对');
    if (!(await detail.locator('.story-list .story-next').count())) throw Error(name+' 未显示相关故事');
    if (!(await detail.locator('.person-bio a[href]').count())) throw Error(name+' 的简介缺少出处');
    checked.push(name);
    await page.locator('#people-back').click();
  }
  await page.locator('#people-list').getByRole('button',{name:/^彭德怀，/}).click();
  const hash=await page.evaluate(()=>location.hash);
  await page.reload();
  if ((await page.locator('#people-title').innerText())!=='彭德怀') throw Error('刷新后没有回到人物详情 '+hash);
  await page.locator('#person-detail').getByRole('button',{name:/抬出草地/}).click();
  await page.locator('#story-page').waitFor();
  if (!/抬出草地/.test(await page.locator('#story-title').innerText())) throw Error('没有打开相关故事');
  await page.goBack();
  if ((await page.locator('#people-title').innerText())!=='彭德怀') throw Error('后退没有回到人物详情');
  if (await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw Error('手机页面横向溢出');
  return {checked,cards,reload:true,storyOpen:true,back:true,overflow:false};
}
