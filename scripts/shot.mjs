// 스크린샷: node scripts/shot.mjs <url> <out.png> [width] [height] [full] [waitMs] [clicks...]
// clicks: CSS 선택자 또는 "wait:1000" 을 차례로 실행한 뒤 찍는다.
import { chromium } from 'playwright-core';

const [url, out, w = 412, h = 915, full = '0', wait = '800', ...clicks] = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'msedge', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(+wait);
for (const c of clicks) {
  if (c.startsWith('wait:')) await page.waitForTimeout(+c.slice(5));
  else if (c.startsWith('shot:')) await page.screenshot({ path: c.slice(5) });
  else if (c.startsWith('eval:')) await page.evaluate(c.slice(5));
  else if (c === 'reload') await page.reload({ waitUntil: 'networkidle' });
  else if (c.startsWith('tap:')) { const [x, y] = c.slice(4).split(',').map(Number); await page.mouse.click(x, y); }
  else await page.click(c);
}
await page.screenshot({ path: out, fullPage: full === '1' });
if (errs.length) console.log('ERRORS:\n' + errs.join('\n'));
await browser.close();
