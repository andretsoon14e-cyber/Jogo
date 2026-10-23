import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const url = process.argv[2] || 'http://localhost:3000';
const outDir = process.argv[3] || '/tmp/shots';
const room = process.argv[4] || 'SHOTX';
import fs from 'fs';
fs.mkdirSync(outDir, { recursive: true });

const exe = await chromium.executablePath();
const browser = await puppeteer.launch({
  args: [...chromium.args, '--no-sandbox', '--disable-gpu', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  executablePath: exe, headless: true,
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
const logs = [];
page.on('console', (m) => { if (m.type() === 'error') logs.push(`[console] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${(e.stack||'').split('\n').slice(0,3).join('\n')}`));
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 800));
await page.evaluate((r) => {
  document.querySelector('.loginTab[data-mode="guest"]').click();
  document.querySelector('#inpName').value = 'andre';
  document.querySelector('#inpRoom').value = r;
}, room);
await page.screenshot({ path: `${outDir}/00-login.png` });
await page.click('#btnPlay');
await new Promise(r => setTimeout(r, 5200));
await page.evaluate(() => {
  const t = document.querySelector('#tutorialPanel');
  if (t && t.classList.contains('open')) document.querySelector('#btnTutorialStart').click();
});
await new Promise(r => setTimeout(r, 900));
await page.screenshot({ path: `${outDir}/01-world.png` });

// tempo: fim de tarde
await page.evaluate(() => { window.__timeOverride = 18.6 * 60; });
await new Promise(r => setTimeout(r, 700));
await page.screenshot({ path: `${outDir}/02-sunset.png` });

// noite
await page.evaluate(() => { window.__timeOverride = 21.5 * 60; });
await new Promise(r => setTimeout(r, 700));
await page.screenshot({ path: `${outDir}/03-night.png` });

await page.evaluate(() => { window.__timeOverride = null; window.game.world.time = 10 * 60; });

// abrir painéis
const panels = ['inventoryPanel', 'jobPanel', 'kitchenPanel', 'bankPanel', 'questPanel', 'mapPanel', 'housePanel', 'travelPanel', 'settingsPanel'];
for (const p of panels) {
  await page.evaluate((id) => {
    window.togglePanel(id);
  }, p);
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: `${outDir}/panel-${p}.png` });
}

// interior
await page.evaluate(() => {
  document.querySelectorAll('.panel').forEach(x => x.classList.remove('open'));
  window.game.indoors = 'casa_player';
  window.game.x = 8; window.game.y = 7;
});
await new Promise(r => setTimeout(r, 900));
await page.screenshot({ path: `${outDir}/04-interior.png` });

// taverna
await page.evaluate(() => { window.game.indoors = 'taverna'; });
await new Promise(r => setTimeout(r, 600));
await page.screenshot({ path: `${outDir}/05-taverna.png` });
await page.evaluate(() => { window.game.indoors = 'mercado'; });
await new Promise(r => setTimeout(r, 600));
await page.screenshot({ path: `${outDir}/06-mercado.png` });
await page.evaluate(() => { window.game.indoors = null; });

// npc panel
await page.evaluate(() => { window.openNpc && window.openNpc('maria'); });
await new Promise(r => setTimeout(r, 600));
await page.screenshot({ path: `${outDir}/07-npc.png` });

// região vila / ilha
for (const reg of ['vila','ilha','cidade']) {
  await page.evaluate((r) => {
    window.game.region = r;
    const def = window.game.travelDef && window.game.travelDef[r];
    window.game.camera.x = 15; window.game.camera.y = 14;
    window.game.x = 15; window.game.y = 14;
  }, reg);
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: `${outDir}/08-region-${reg}.png` });
}
console.log(logs.slice(0,15).join('\n') || 'sem erros');
await browser.close();
