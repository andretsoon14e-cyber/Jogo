import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const exe = await chromium.executablePath();
const browser = await puppeteer.launch({
  args: [...chromium.args, '--no-sandbox', '--disable-gpu', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  executablePath: exe, headless: true,
  defaultViewport: { width: 420, height: 860, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
});
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 900));
await page.screenshot({ path: '/tmp/mobile-login.png' });
await page.evaluate(() => {
  document.querySelector('.loginTab[data-mode="guest"]').click();
  document.querySelector('#inpName').value = 'andre';
  document.querySelector('#inpRoom').value = 'MOB1';
});
await page.click('#btnPlay');
await new Promise(r => setTimeout(r, 4500));
await page.evaluate(() => { const t = document.querySelector('#tutorialPanel'); if (t?.classList?.contains('open')) document.querySelector('#btnTutorialStart').click(); });
await new Promise(r => setTimeout(r, 600));
await page.screenshot({ path: '/tmp/mobile-game.png' });
await page.evaluate(() => window.togglePanel('inventoryPanel'));
await new Promise(r => setTimeout(r, 600));
await page.screenshot({ path: '/tmp/mobile-panel.png' });
console.log(errs.slice(0,3).join('\n') || 'ok');
await browser.close();
