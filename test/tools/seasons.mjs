import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const url = 'http://localhost:3000';
const outDir = '/tmp/seasons';
import fs from 'fs';
fs.mkdirSync(outDir, { recursive: true });
const exe = await chromium.executablePath();
const browser = await puppeteer.launch({
  args: [...chromium.args, '--no-sandbox', '--disable-gpu', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  executablePath: exe, headless: true,
  defaultViewport: { width: 1440, height: 900 },
});
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.goto(url, { waitUntil: 'networkidle2' });
await page.evaluate(() => {
  document.querySelector('.loginTab[data-mode="guest"]').click();
  document.querySelector('#inpName').value = 'andre';
  document.querySelector('#inpRoom').value = 'SEASON';
});
await page.click('#btnPlay');
await new Promise(r => setTimeout(r, 4200));
await page.evaluate(() => { const t = document.querySelector('#tutorialPanel'); if (t?.classList.contains('open')) document.querySelector('#btnTutorialStart').click(); });
const seasons = ['Primavera','Verão','Outono','Inverno'];
const weathers = ['Ensolarado','Chuvoso','Neve','Nevoa'];
for (let i = 0; i < 4; i++) {
  await page.evaluate(({i, w, s}) => {
    window.__seasonOverride = i;
    window.game.world.weather = w;
    window.__timeOverride = 10 * 60;
  }, { i, w: weathers[i], s: seasons[i] });
  await new Promise(r => setTimeout(r, 900));
  await page.screenshot({ path: `${outDir}/season-${i}.png` });
}
// verão à noite
await page.evaluate(() => { window.__seasonOverride = 1; window.game.world.weather = 'Ensolarado'; window.__timeOverride = 20.5*60; });
await new Promise(r => setTimeout(r, 900));
await page.screenshot({ path: `${outDir}/summer-night.png` });
console.log(errs.slice(0,5).join('\n') || 'sem erros');
await browser.close();
