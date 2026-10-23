import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const exe = await chromium.executablePath();
const browser = await puppeteer.launch({
  args: [...chromium.args, '--no-sandbox', '--disable-gpu', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  executablePath: exe, headless: true,
  defaultViewport: { width: 900, height: 700, deviceScaleFactor: 4 },
});
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
await page.evaluate(() => {
  document.querySelector('.loginTab[data-mode="guest"]').click();
  document.querySelector('#inpName').value = 'andre';
  document.querySelector('#inpRoom').value = 'ACT1';
});
await page.click('#btnPlay');
await new Promise(r => setTimeout(r, 4200));
await page.evaluate(() => { const t = document.querySelector('#tutorialPanel'); if (t?.classList?.contains('open')) document.querySelector('#btnTutorialStart').click(); });
await page.evaluate(() => {
  window.game.actionUntil = performance.now() + 60000;
  window.game.actionTool = 'enxada';
  window.game.dir = 'left';
});
await new Promise(r => setTimeout(r, 400));
const c = await page.evaluate(() => { const cv = document.getElementById('gameCanvas'); return { w: cv.width, h: cv.height }; });
await page.screenshot({ path: '/tmp/action.png', clip: { x: c.w/2 - 45, y: c.h/2 - 62, width: 90, height: 90 } });
console.log(errs.slice(0,3).join('\n') || 'ok');
await browser.close();
