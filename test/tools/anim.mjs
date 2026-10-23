import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const exe = await chromium.executablePath();
const browser = await puppeteer.launch({
  args: [...chromium.args, '--no-sandbox', '--disable-gpu', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  executablePath: exe, headless: true,
  defaultViewport: { width: 1200, height: 800, deviceScaleFactor: 2 },
});
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
await page.evaluate(() => {
  document.querySelector('.loginTab[data-mode="guest"]').click();
  document.querySelector('#inpName').value = 'andre';
  document.querySelector('#inpRoom').value = 'ANIM1';
});
await page.click('#btnPlay');
await new Promise(r => setTimeout(r, 4200));
await page.evaluate(() => { const t = document.querySelector('#tutorialPanel'); if (t?.classList?.contains('open')) document.querySelector('#btnTutorialStart').click(); });
// força personagem andando com direção aleatória por alguns frames
for (const dir of ['right','left','up','down']) {
  await page.evaluate((d) => {
    window.game.keys = {};
    window.game.dir = d;
    window.game.moving = true;
    // simula movimento contínuo
    const k = d === 'right' ? 'd' : d === 'left' ? 'a' : d === 'up' ? 'w' : 's';
    window.game.keys[k] = true;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: k }));
  }, dir);
  await new Promise(r => setTimeout(r, 600));
  const c = await page.evaluate(() => { const cv = document.getElementById('gameCanvas'); return { w: cv.width, h: cv.height }; });
  await page.screenshot({ path: `/tmp/anim-${dir}.png`, clip: { x: c.w/2 - 55, y: c.h/2 - 90, width: 130, height: 140 } });
  await page.evaluate((d) => {
    const k = d === 'right' ? 'd' : d === 'left' ? 'a' : d === 'up' ? 'w' : 's';
    document.dispatchEvent(new KeyboardEvent('keyup', { key: k }));
    window.game.keys = {};
    window.game.moving = false;
  }, dir);
}
console.log(errs.slice(0,3).join('\n') || 'sem erros');
await browser.close();
