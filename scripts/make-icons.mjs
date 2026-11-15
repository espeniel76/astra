// 앱 아이콘을 그려 PNG로 저장한다(개발 서버가 켜져 있어야 한다: npx vite --port 5190).
//   node scripts/make-icons.mjs
// - app/icon/icon.png, app/icon/foreground.png : 안드로이드 앱
//   (그다음 app 폴더에서 `dart run flutter_launcher_icons`)
// 그림: 무지개 테 근원의 별 앞에 아스트라(icon.html)
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage();
await page.goto('http://localhost:5190/icon.html');
await page.waitForFunction(() => window.ready);
const save = async (path, size, bg, s) => {
  const data = await page.evaluate(([size, bg, s]) => window.draw(size, bg, s), [size, bg, s]);
  writeFileSync(path, Buffer.from(data.split(',')[1], 'base64'));
  console.log(path);
};
// 안드로이드 적응형 아이콘: 휴대폰마다 동그라미·둥근 네모 등으로 잘라 내므로,
// 앞 그림은 가운데 지름 66% 원 안에 들어가게 줄인다(배경색은 pubspec.yaml)
mkdirSync('app/icon', { recursive: true });
await save('app/icon/icon.png', 1024, true, 1);
await save('app/icon/foreground.png', 1024, false, 0.66);
await browser.close();
