import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const url = process.argv[2] || 'http://localhost:3000';
const out = process.argv[3] || '/tmp/shot.png';
const waitMs = Number(process.argv[4] || 4500);
const room = process.argv[5] || 'SHOT1';

const exe = await chromium.executablePath();
const browser = await puppeteer.launch({
  args: [...chromium.args, '--no-sandbox', '--disable-gpu', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  executablePath: exe,
  headless: true,
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${e.stack||''}`));
page.on('requestfailed', (r) => logs.push(`[reqfail] ${r.url()} ${r.failure()?.errorText}`));
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await page.waitForSelector('#btnPlay', { visible: true });
// guest mode
try {
  await page.click('.loginTab[data-mode="guest"]');
} catch (e) {}
await page.evaluate((r) => {
  const el = document.querySelector('#inpName'); if (el) el.value = 'andre';
  const room = document.querySelector('#inpRoom'); if (room) room.value = r;
}, room);
await page.click('#btnPlay');
await new Promise((r) => setTimeout(r, waitMs));
// close tutorial if open
await page.evaluate(() => {
  const panel = document.querySelector('#tutorialPanel');
  if (panel && panel.classList.contains('open')) {
    const b = document.querySelector('#btnTutorialStart'); if (b) b.click();
  }
});
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: out });
console.log(logs.filter(l => !l.includes('favicon')).slice(0, 40).join('\n'));
await browser.close();
