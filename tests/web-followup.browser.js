async page => {
 // 回答下方的“联网搜索”重放这一轮的原话和发问前的签名记录（Codex 041）；输入框里只说“联网搜索”时搜最近一个实质问题。
 let calls=[];await page.route('**/api/chat',async r=>{const b=r.request().postDataJSON();calls.push(b);const n=calls.length;
  await r.fulfill({json:b.web==='only'?{answer:'联网回答'+n,type:'history',sources:[],web:{sources:[{title:'网页',url:'https://www.12371.cn/'}]},historyToken:'w'+n}
   :{answer:'馆内回答'+n,type:'history',sources:[{id:'hadapu',ids:['hadapu'],title:'资料',url:'https://www.12371.cn/'}],historyToken:'t'+n,canWeb:true}})});
 await page.setViewportSize({width:1440,height:850});await page.goto('http://127.0.0.1:4173/');
 await page.locator('#home-q').fill('哈达铺的报纸为什么重要？');await page.locator('#home-form').evaluate(e=>e.requestSubmit());await page.locator('#send:not([disabled])').waitFor();
 await page.locator('#question').fill('后来呢？');await page.locator('#chat-form').evaluate(e=>e.requestSubmit());await page.locator('#send:not([disabled])').waitFor();
 await page.locator('#messages .msg.bot').last().locator('.webask').click();await page.locator('#send:not([disabled])').waitFor();
 let last=calls.at(-1);
 if(last.web!=='only'||last.question!=='后来呢？'||JSON.stringify(last.historyTokens)!=='["t1"]')throw Error('回答下的联网搜索应重放这一轮：'+JSON.stringify(last));
 await page.locator('#question').fill('联网搜索');await page.locator('#chat-form').evaluate(e=>e.requestSubmit());await page.locator('#send:not([disabled])').waitFor();
 last=calls.at(-1);
 if(last.web!=='only'||last.question!=='哈达铺的报纸为什么重要？'||last.historyTokens.length!==0)throw Error('输入框的联网搜索应搜最近的实质问题：'+JSON.stringify(last));
 return {replayed:true,typedSearch:true};
}
