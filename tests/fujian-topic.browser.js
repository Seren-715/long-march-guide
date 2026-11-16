async page => {
  const errors=[]; page.on('pageerror', e=>errors.push(e.message));
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('#start-fujian').click();
  const dialog=page.locator('#fujian-dialog');
  if (!(await dialog.isVisible())) throw Error('专题未打开');
  if (await dialog.locator('article').count()!==10) throw Error('专题故事数量不正确');
  if (await dialog.locator('article a[href]').count()!==10) throw Error('专题故事缺少出处');
  if (!(await dialog.innerText()).includes('长征前支前活动')) throw Error('缺少历史口径提示');
  if (await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw Error('手机页面横向溢出');
  await page.keyboard.press('Escape');
  if (await dialog.isVisible()) throw Error('Escape 未关闭专题');
  if (await page.evaluate(()=>document.activeElement?.id)!=='start-fujian') throw Error('关闭后焦点未返回入口');
  await page.locator('#start-fujian').click();
  await dialog.getByRole('button',{name:/查看关联节点：泸定桥/}).click();
  if (!(await page.locator('#story-story_fj_yang_chengwu').isVisible())) throw Error('未进入相关节点的故事');
  if (errors.length) throw Error(errors.join('; '));
  return {stories:10,sources:10,escape:true,focusRestored:true,storyJump:true,overflow:false};
}
