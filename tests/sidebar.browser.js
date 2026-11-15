async page => {
  let fail=false;
  await page.route('**/api/chat',async route=>{if(fail) await route.fulfill({status:502,json:{error:'模拟失败'}});else await route.fulfill({json:{answer:'测试回答',type:'history',sources:[{id:'jinsha',ids:['jinsha'],title:'资料',url:'https://www.12371.cn/'}],historyToken:'test-token'}})});
  await page.setViewportSize({width:1440,height:900});await page.goto('http://127.0.0.1:4173/');
  await page.locator('#home-q').fill('你好');await page.locator('#home-form').evaluate(e=>e.requestSubmit());await page.locator('#send:not([disabled])').waitFor();
  const q=(await page.locator('.side-q').allTextContents())[1];fail=true;await page.locator('.side-q').nth(1).click();await page.locator('#send:not([disabled])').waitFor();
  if(!(await page.locator('.side-q').allTextContents()).includes(q))throw Error('失败后建议消失');
  fail=false;await page.locator('#messages .retry').last().click();await page.locator('#send:not([disabled])').waitFor();
  for(let i=0;i<70;i++){if((await page.locator('.side-q').allTextContents()).includes(q))throw Error('成功后重复出现：'+q);await page.getByRole('button',{name:'换一批'}).click();}
  return {question:q,failedPreserved:true,retryRemoved:true,rotations:70};
}
