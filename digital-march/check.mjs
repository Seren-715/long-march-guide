// 《数字长征》回归检查：npm run test:march
// 1. 资料核对 + 生成文件是否最新（build.mjs --check）
// 2. 单文件约束：不加载任何外部脚本、样式、图片、字体（只允许 <a href> 外链到出处）
// 3. 脚本能解析
// 4. 若本机装有 Playwright：打开页面，走一遍沙盘、赤水、数据、会议、星河、故事、问答和行军卡，检查无脚本错误、无横向滚动
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const file = new URL('./index.html', import.meta.url);
execFileSync(process.execPath, [new URL('./build.mjs', import.meta.url).pathname, '--check'], { stdio: 'inherit' });

const html = await readFile(file, 'utf8');
const tags = html.match(/<(script|link|img|iframe|source|video|audio)\b[^>]*>/gi) || [];
for (const t of tags) assert.ok(!/\s(src|href)\s*=\s*["']?(https?:)?\/\//i.test(t), '页面不应加载外部资源：' + t);
assert.ok(!/@import|url\(\s*["']?https?:/i.test(html), 'CSS 不应引用外部资源');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
assert.equal(scripts.length, 2, '应有数据脚本和程序脚本各一段');
for (const s of scripts) new vm.Script(s);
assert.ok(Buffer.byteLength(html) < 2 * 1024 * 1024, '单文件应小于 2MB，便于手机打开');
console.log(`静态检查通过：${tags.length} 个资源标签均为内联，${scripts.length} 段脚本可解析，${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);

let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch { console.log('未安装 Playwright：浏览器检查未执行'); process.exit(0); }
const browser = await chromium.launch();
try {
  for (const vp of [{ width: 1366, height: 860 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport: vp });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) errors.push('外部请求：' + r.url()); });
    await page.goto(file.href);
    const steps = await page.locator('.step').count();
    assert.equal(steps, 27, '沙盘应有总览 + 26 站');
    for (let i = 1; i < steps; i++) await page.evaluate((i) => document.querySelectorAll('.step')[i].querySelector('.card').scrollIntoView({ behavior: 'instant', block: 'center' }), i);
    await page.waitForTimeout(200);
    assert.match(await page.textContent('#tg-date'), /1936·10·22/, '走到最后一站时电报纸带应显示将台堡会师日期');
    for (let i = 0; i < 7; i++) await page.click('#cs-next');
    assert.equal(await page.textContent('#cs-n'), '4', '四渡赤水示意走完应为 4 次');
    await page.locator('.gantt .evt').first().click();
    await page.click('#meet-next');
    await page.locator('#sky-svg .pp').first().click();
    await page.locator('.scard').first().click();
    assert.ok(await page.locator('#reader[open] .txt p').count() > 0, '故事阅读框应显示正文');
    await page.keyboard.press('Escape');
    await page.click('#quiz-box .btn.primary');
    for (let q = 0; q < 10; q++) {
      const opts = page.locator('#quiz-box .opt');
      const n = await opts.count();
      for (let i = 0; i < n; i++) if (await opts.nth(i).isEnabled()) await opts.nth(i).click();
      assert.ok(await page.locator('#quiz-box .feedback .src, #quiz-box .feedback').count() > 0, '每题答完应有反馈');
      await page.click('#quiz-box .qactions .btn.primary');
    }
    assert.ok(await page.locator('#quiz-box .result').count() === 1, '答完 10 题应显示成绩');
    await page.fill('#poster-name', '测试');
    await page.click('#make-poster');
    await page.locator('#poster img').waitFor();
    const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    assert.ok(sw <= iw, `页面不应横向滚动（${sw} > ${iw}）`);
    assert.deepEqual(errors, [], '不应有脚本错误或外部请求');
    console.log(`浏览器检查通过（${vp.width}×${vp.height}）：沙盘 26 站、四渡赤水、甘特图、会议纸带、人物星河、故事阅读、10 道问答、行军卡`);
    await page.close();
  }
} finally { await browser.close(); }
