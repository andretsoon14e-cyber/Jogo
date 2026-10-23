import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const url = process.argv[2] || 'http://localhost:3000';
const out = process.argv[3] || '/tmp/zoom.png';
const room = process.argv[4] || 'ZOOM1';
const t = Number(process.argv[5] || 10);
const exe = await chromium.executablePath();
const browser = await puppeteer.launch({
  args: [...chromium.args, '--no-sandbox', '--disable-gpu', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  executablePath: exe, headless: true,
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
});
const page = await browser.newPage();
const logs = [];
page.on('pageerror', (e) => logs.push(e.message));
await page.goto(url, { waitUntil: 'networkidle2' });
await page.evaluate((r) => {
  document.querySelector('.loginTab[data-mode="guest"]').click();
  document.querySelector('#inpName').value = 'andre';
  document.querySelector('#inpRoom').value = r;
}, room);
await page.click('#btnPlay');
await new Promise(r => setTimeout(r, 4500));
await page.evaluate((tt) => {
  const t = document.querySelector('#tutorialPanel');
  if (t && t.classList.contains('open')) document.querySelector('#btnTutorialStart').click();
  window.__timeOverride = tt * 60;
}, t);
await new Promise(r => setTimeout(r, 900));
// recorte ao redor do jogador
const box = await page.evaluate(() => {
  const c = document.getElementById('gameCanvas');
  return { w: c.width, h: c.height };
});
await page.screenshot({ path: out, clip: { x: box.w/2 - 260, y: box.h/2 - 190, width: 520, height: 380 } });
console.log(logs.slice(0,5).join('\n') || 'ok');
await browser.close();
