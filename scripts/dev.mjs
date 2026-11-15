import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import worker from '../worker/index.js';

// 本地预览默认不带密钥，只能浏览页面和路线；设置 DEEPSEEK_API_KEY 后可在本地试用真实问答。
// 对话签名密钥不填则每次启动随机生成（重启后旧的对话记录失效）。
const env = {};
if (process.env.DEEPSEEK_API_KEY) {
  env.DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
  env.HISTORY_SIGNING_KEY = process.env.HISTORY_SIGNING_KEY || randomBytes(32).toString('hex');
  if (process.env.DEEPSEEK_MODEL) env.DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL;
}
const host = process.env.HOST || '127.0.0.1', port = Number(process.env.PORT) || 4173;

const server = createServer(async (req, res) => {
  try {
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    const request = new Request('http://' + (req.headers.host || host + ':' + port) + req.url, { method: req.method, headers: req.headers, ...(body.length ? { body } : {}) });
    const response = await worker.fetch(request, env);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    // 逐块转发，问答的处理步骤才能实时显示
    if (response.body) { for await (const chunk of response.body) res.write(chunk); res.end(); } else res.end();
  } catch { res.writeHead(500); res.end('Server error'); }
});
server.listen(port, host, () => console.log(`Local: http://${host}:${port}` + (env.DEEPSEEK_API_KEY ? '（已启用模型问答）' : '（未配置模型，问答不可用）')));
