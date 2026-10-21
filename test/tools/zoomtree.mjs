import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const exe = await chromium.executablePath();
const browser = await puppeteer.launch({
  args: [...chromium.args, '--no-sandbox', '--disable-gpu', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  executablePath: exe, headless: true,
  defaultViewport: { width: 1000, height: 800, deviceScaleFactor: 3 },
});
const page = await browser.newPage();
await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
await page.evaluate(() => {
  document.querySelector('.loginTab[data-mode="guest"]').click();
  document.querySelector('#inpName').value = 'zz';
  document.querySelector('#inpRoom').value = 'ZTREE';
});
await page.click('#btnPlay');
await new Promise(r => setTimeout(r, 4200));
await page.evaluate(() => { const t = document.querySelector('#tutorialPanel'); if (t?.classList?.contains('open')) document.querySelector('#btnTutorialStart').click(); });
// posiciona câmera na floresta
await page.evaluate(() => {
  window.game.x = 12; window.game.y = 10;
  window.game.camera.x = 12; window.game.camera.y = 10;
  window.__timeOverride = 11 * 60;
});
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: '/tmp/tree1.png', clip: { x: 330, y: 240, width: 360, height: 300 } });
// prédio
await page.evaluate(() => {
  window.game.x = 40; window.game.y = 26;
  window.game.camera.x = 40; window.game.camera.y = 22;
});
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: '/tmp/bld1.png', clip: { x: 180, y: 60, width: 700, height: 480 } });
await browser.close();
console.log('ok');
