async page => {
  const names=['王稼祥','陈云','博古','李德','彭德怀','聂荣臻','林彪','叶剑英','徐向前'];
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('#start-people').click();
  const checked=[];
  for (const name of names) {
    await page.locator('#people-list').getByRole('button',{name:new RegExp(name)}).click();
    const detail=page.locator('#person-detail');
    if (!(await detail.locator('li.person-story').count())) throw Error(name+' 未显示相关故事');
    if (!(await detail.locator('li.person-story a[href]').count())) throw Error(name+' 的故事缺少出处');
    checked.push(name);
    await detail.getByRole('button',{name:'← 返回人物'}).click();
  }
  await page.locator('#people-list').getByRole('button',{name:/彭德怀/}).click();
  await page.locator('#person-detail').getByRole('button',{name:/抬出草地/}).click();
  if (!(await page.locator('#story-story_zhou_enlai').isVisible())) throw Error('故事未跳转至节点');
  if (await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw Error('手机页面横向溢出');
  return {checked,storyJump:true,overflow:false};
}
