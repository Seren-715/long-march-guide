const {chromium}=require('playwright');const F=process.argv[2];
const wait=async(p,n)=>{for(let i=0;i<180;i++){const c=await p.locator('#messages .msg.bot').count();const busy=await p.getAttribute('#send','aria-busy');if(c>n&&busy!=='true')return true;await p.waitForTimeout(500)}return false};
(async()=>{const b=await chromium.launch();const all=[];
for(const [name,vp] of [['桌面 1440×900',{width:1440,height:900}],['手机 390×844',{width:390,height:844}]]){
 const p=await b.newPage({viewport:vp,deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,80))});
 const t0=Date.now();await p.goto('http://127.0.0.1:4195/');await p.waitForLoadState('networkidle');const load=Date.now()-t0;const turns=[];
 const last=()=>p.locator('#messages .msg.bot').last();
 const grab=async(q,ms)=>{const el=last();turns.push({q,ms,answer:(await el.locator('.msg-text').first().innerText().catch(()=>'')).trim(),steps:(await el.locator('.steps, .step-list, ol, ul').first().innerText().catch(()=>'')).replace(/\s*\n\s*/g,' ').trim(),srcTitles:await el.locator('.refs a, .webrefs a').allInnerTexts(),full:(await el.innerText()).trim(),refs:await el.locator('.refs a').allInnerTexts(),webBtn:await el.locator('.webask').count()})};
 let n=await p.locator('#messages .msg.bot').count();await p.fill('#home-q','四渡赤水是怎么走的？');await p.keyboard.press('Enter');let s=Date.now();await wait(p,n);await grab('（首页）四渡赤水是怎么走的？',Date.now()-s);
 n=await p.locator('#messages .msg.bot').count();await p.fill('#question','所以为什么要渡四次');await p.keyboard.press('Enter');s=Date.now();await wait(p,n);await grab('所以为什么要渡四次',Date.now()-s);
 if(await last().locator('.webask').count()){n=await p.locator('#messages .msg.bot').count();await last().locator('.webask').click();s=Date.now();await wait(p,n);await grab('（点回答下方“联网搜索”）',Date.now()-s)}
 await p.screenshot({path:F+'/页面-'+(name.startsWith('桌面')?'桌面':'手机')+'.png'});
 await p.goto('http://127.0.0.1:4195/#wujiang');await p.waitForTimeout(1500);const chips=await p.$$eval('.ask-here button',e=>e.map(x=>x.textContent)).catch(()=>[]);
 all.push({name,load,turns,askHere:chips,overflowX:await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),errors:errs});await p.close()}
require('fs').writeFileSync(F+'/realui.json',JSON.stringify(all,null,1));console.log(all.map(x=>x.name+' load '+x.load+' turns '+x.turns.length+' ovX '+x.overflowX+' err '+x.errors.length).join('\n'));await b.close()})()
