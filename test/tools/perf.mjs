import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const exe = await chromium.executablePath();
const browser = await puppeteer.launch({
  args: [...chromium.args, '--no-sandbox', '--disable-gpu', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  executablePath: exe, headless: true,
  defaultViewport: { width: 1440, height: 900 },
});
const page = await browser.newPage();
await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
await page.evaluate(() => {
  document.querySelector('.loginTab[data-mode="guest"]').click();
  document.querySelector('#inpName').value = 'perf';
  document.querySelector('#inpRoom').value = 'PERF1';
});
await page.click('#btnPlay');
await new Promise(r => setTimeout(r, 4000));
await page.evaluate(() => { const t = document.querySelector('#tutorialPanel'); if (t?.classList.contains('open')) document.querySelector('#btnTutorialStart').click(); });
await new Promise(r => setTimeout(r, 500));

const fps = await page.evaluate(() => new Promise((resolve) => {
  let frames = 0; const t0 = performance.now();
  function tick() {
    frames++;
    if (performance.now() - t0 < 4000) requestAnimationFrame(tick);
    else resolve(Math.round(frames / ((performance.now() - t0) / 1000)));
  }
  requestAnimationFrame(tick);
}));
const mem = await page.evaluate(() => performance.memory ? Math.round(performance.memory.usedJSHeapSize/1048576) : null);
console.log(JSON.stringify({ fps, memMB: mem }));
await browser.close();
