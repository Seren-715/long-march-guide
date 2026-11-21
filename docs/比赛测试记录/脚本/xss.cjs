const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();let dialogs=0;p.on('dialog',d=>{dialogs++;d.dismiss()});
await p.route('**/api/chat',r=>r.fulfill({json:{answer:'测试<img src=x onerror=alert(1)><script>alert(2)</script>',type:'history',sources:[{id:'zunyi',ids:['zunyi'],title:'<b>标题</b>',url:'javascript:alert(3)',excerpt:'<img src=x onerror=alert(4)>'}],web:{sources:[{title:'网页',url:'javascript:alert(5)'}]},followups:['<img src=x onerror=alert(6)>'],historyToken:'t'}}));
await p.goto('http://127.0.0.1:4173/');await p.fill('#home-q','测试');await p.locator('#home-form').evaluate(e=>e.requestSubmit());await p.locator('#send:not([disabled])').waitFor();await p.waitForTimeout(800);
const last=p.locator('#messages .msg.bot').last();
const out={injectedImg:await last.locator('img[src="x"]').count(),scripts:await last.locator('script').count(),jsLinks:await p.locator('a[href^="javascript"]').count(),dialogs,textShown:(await last.innerText()).includes('<img src=x onerror=alert(1)>')};
console.log(JSON.stringify(out));await b.close()})()
