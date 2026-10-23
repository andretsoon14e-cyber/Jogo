import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const url = process.argv[2] || 'http://localhost:3000';
const out = process.argv[3] || '/tmp/zoomchar.png';
const room = process.argv[4] || 'ZOOMC';
const exe = await chromium.executablePath();
const browser = await puppeteer.launch({
  args: [...chromium.args, '--no-sandbox', '--disable-gpu', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  executablePath: exe, headless: true,
  defaultViewport: { width: 900, height: 700, deviceScaleFactor: 4 },
});
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'networkidle2' });
await page.evaluate((r) => {
  document.querySelector('.loginTab[data-mode="guest"]').click();
  document.querySelector('#inpName').value = 'andre';
  document.querySelector('#inpRoom').value = r;
}, room);
await page.click('#btnPlay');
await new Promise(r => setTimeout(r, 4200));
await page.evaluate(() => {
  const t = document.querySelector('#tutorialPanel');
  if (t && t.classList.contains('open')) document.querySelector('#btnTutorialStart').click();
});
await new Promise(r => setTimeout(r, 600));
// forçar olhar para baixo/parado
await page.evaluate(() => { window.game.dir = 'down'; window.__timeOverride = 11*60; });
await new Promise(r => setTimeout(r, 800));
const c = await page.evaluate(() => {
  const cv = document.getElementById('gameCanvas');
  return { w: cv.width, h: cv.height };
});
await page.screenshot({ path: out, clip: { x: c.w/2 - 30, y: c.h/2 - 62, width: 64, height: 80 } });
await browser.close();
console.log('ok');
