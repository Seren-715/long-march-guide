async page => {
  let fail = false, invalidHistory = false, delay = 0, calls = [];
  await page.route('**/api/chat', async route => {
    const payload = route.request().postDataJSON(); calls.push(payload);
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    if (invalidHistory) await route.fulfill({status:400,json:{code:'HISTORY_INVALID',error:'对话记录已失效，请重新提问。'}});
    else if (fail) await route.fulfill({status:502,json:{error:'模拟连接失败'}});
    else await route.fulfill({json:{answer:'测试回答',sources:[],historyToken:'mock-token'}});
  });
  const choose = async id => { if (await page.locator('#home').isVisible()) { await page.locator('#start-browse').click(); } await page.locator('#strip [data-node="'+id+'"]').click(); };
  const suggestions = async () => page.locator('#chat-chips button').allTextContents();
  const sendDone = async () => page.locator('#send:not([disabled])').waitFor();
  await choose('jinsha');
  const before = await suggestions(), asked = before[1];
  await page.locator('#chat-chips').getByRole('button',{name:asked,exact:true}).click(); await sendDone();
  const after = await suggestions(); if (after.includes(asked) || after.length !== 2 || before.join('|') === after.join('|')) throw Error('成功后建议未更新');
  await choose('zunyi'); await choose('jinsha'); if ((await suggestions()).includes(asked)) throw Error('切回后已答建议重新出现');
  const failed = (await suggestions())[0]; fail = true; await page.locator('#chat-chips').getByRole('button',{name:failed,exact:true}).click(); await sendDone();
  if (!(await suggestions()).includes(failed) || await page.locator('#question').inputValue() !== failed) throw Error('失败问题被消耗或未恢复');
  await page.locator('#question').fill('未发送的草稿'); await page.locator('#chat-chips').getByRole('button',{name:failed,exact:true}).click();
  if (await page.locator('#question').inputValue() !== '未发送的草稿') throw Error('建议覆盖草稿');
  await page.reload(); fail = true; delay = 500; await choose('jinsha');
  const oldQuestion=(await suggestions())[0]; await page.locator('#chat-chips').getByRole('button',{name:oldQuestion,exact:true}).click(); await choose('zunyi'); await sendDone();
  if (await page.locator('#question').inputValue()) throw Error('旧节点失败问题进入新节点输入框');
  if (!(await page.locator('#status').innerText()).includes('节点已切换')) throw Error('跨节点失败提示缺失');
  fail = false; delay = 0; await page.locator('#messages .retry').last().click(); await sendDone();
  if (!calls.at(-1) || calls.at(-1).node !== 'jinsha' || !(await page.locator('#ctx-text2').innerText()).includes('金沙江')) throw Error('跨节点重试没有回到原节点');
  await page.reload(); await choose('chishui');
  for (let i=0;i<12 && !(await page.locator('#chat-chips').innerText()).includes('已看完');i++) {const q=(await suggestions())[0];await page.locator('#chat-chips').getByRole('button',{name:q,exact:true}).click();await sendDone();}
  if (!(await page.locator('#chat-chips').innerText()).includes('已看完')) throw Error('耗尽状态缺失');
  await page.locator('#chat-chips').getByRole('button',{name:'重新显示建议问题'}).click(); if ((await suggestions()).length !== 2) throw Error('无法重新显示建议');
  await page.reload(); await choose('jinsha');
  await page.locator('#chat-chips').getByRole('button',{name:(await suggestions())[0],exact:true}).click(); await sendDone();
  const expiredQuestion=(await suggestions())[0]; invalidHistory=true; await page.locator('#chat-chips').getByRole('button',{name:expiredQuestion,exact:true}).click(); await sendDone();
  if (!(await suggestions()).includes(expiredQuestion) || await page.locator('#question').inputValue() !== expiredQuestion) throw Error('记录失效时问题未保留');
  invalidHistory=false; await page.locator('#messages .retry').last().click(); await sendDone();
  if (calls.at(-1).historyTokens.length !== 0 || (await suggestions()).includes(expiredQuestion)) throw Error('记录失效后未清除上下文重试');
  return {before,after,failedPreserved:true,crossNodeRetry:true,exhaustionAndReset:true,expiredHistoryRecovery:true};
}

