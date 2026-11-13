import worker from './worker/index.js';
import assert from 'node:assert/strict';
let page = await worker.fetch(new Request('http://localhost/'), {}); assert.equal(page.status,200); assert.match(await page.text(),/沿着历史/);
let absent = await worker.fetch(new Request('http://localhost/api/chat',{method:'POST',body:JSON.stringify({question:'遵义会议',node:'zunyi'})}),{}); assert.equal(absent.status,503);
const original=globalThis.fetch; globalThis.fetch=async (url, opts)=>{assert.equal(url,'https://api.deepseek.com/chat/completions');const body=JSON.parse(opts.body);assert.match(body.messages[0].content,/遵义/);return Response.json({choices:[{message:{content:'测试回答'}}]})};
let chat=await worker.fetch(new Request('http://localhost/api/chat',{method:'POST',body:JSON.stringify({question:'遵义会议',node:'zunyi'})}),{DEEPSEEK_API_KEY:'test'});assert.equal((await chat.json()).answer,'测试回答');globalThis.fetch=original;console.log('页面、未配置提示和模拟模型接口通过');
