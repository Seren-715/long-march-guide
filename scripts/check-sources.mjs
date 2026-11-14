import { nodes } from '../src/data.js';

const entries = nodes.flatMap(n => [
  { kind: 'node', owner: n.id, title: n.source, url: n.url },
  ...(n.extra || []).map(e => ({ kind: 'extra', owner: e.id, title: e.source, url: e.url })),
]);
const byUrl = new Map();
for (const entry of entries) if (!byUrl.has(entry.url)) byUrl.set(entry.url, entry);
const queue = [...byUrl.values()];
const results = [];
const workers = Array.from({ length: 3 }, async () => {
  while (queue.length) {
    const entry = queue.shift();
    let lastError = '';
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(entry.url, {
          redirect: 'follow',
          signal: AbortSignal.timeout(30000),
          headers: { 'user-agent': 'Mozilla/5.0 (compatible; long-march-guide-source-check/1.0)', 'accept-language': 'zh-CN,zh;q=0.9' },
        });
        const body = await res.text();
        results.push({ ...entry, status: res.status, bytes: body.length, ok: res.status === 200 && body.length > 200 });
        lastError = '';
        break;
      } catch (err) {
        lastError = err?.name || String(err);
        await new Promise(r => setTimeout(r, 800));
      }
    }
    if (lastError) results.push({ ...entry, status: 0, bytes: 0, ok: false, error: lastError });
  }
});
await Promise.all(workers);
results.sort((a, b) => a.url.localeCompare(b.url));
for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${String(r.status).padStart(3)} ${String(r.bytes).padStart(7)}  ${r.owner}  ${r.url}${r.error ? '  ' + r.error : ''}`);
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} sources reachable; ${entries.length} citations, ${results.length} unique URLs`);
if (failed.length) {
  console.log('Failures:');
  for (const r of failed) console.log(`- ${r.owner}: ${r.url} (${r.error || r.status})`);
  process.exitCode = 1;
}
