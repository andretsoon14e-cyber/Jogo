import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const exe = await chromium.executablePath();
const browser = await puppeteer.launch({
  args: [...chromium.args, '--no-sandbox', '--disable-gpu', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  executablePath: exe, headless: true,
  defaultViewport: { width: 1100, height: 700, deviceScaleFactor: 2 },
});
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
await page.evaluate(async () => {
  const { characterFrames, specForSkin, NPC_SPECS } = await import('/js/art/characters.js');
  document.body.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.style.cssText = 'background:#6aa84f;padding:10px;display:flex;flex-wrap:wrap;gap:8px;font:11px sans-serif';
  const specs = [];
  for (const k of ['s1','s2','s3','s4','s5','s6']) specs.push({ name: k, spec: specForSkin(k) });
  for (const [id, sp] of Object.entries(NPC_SPECS)) specs.push({ name: id, spec: sp });
  for (const { name, spec } of specs) {
    const atlas = characterFrames(spec);
    const box = document.createElement('div');
    box.style.cssText = 'background:#fff8;padding:4px;text-align:center;color:#333';
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:2px';
    for (const dir of ['down','up','left','right']) {
      const c = document.createElement('canvas');
      c.width = atlas[dir][0].width; c.height = atlas[dir][0].height;
      c.getContext('2d').drawImage(atlas[dir][1], 0, 0);
      c.style.cssText = 'width:48px;height:72px;image-rendering:pixelated;background:#0001';
      row.appendChild(c);
    }
    const act = document.createElement('canvas');
    act.width = atlas.downAction.width; act.height = atlas.downAction.height;
    act.getContext('2d').drawImage(atlas.downAction, 0, 0);
    act.style.cssText = 'width:48px;height:72px;image-rendering:pixelated;background:#0001';
    row.appendChild(act);
    box.appendChild(row);
    const lbl = document.createElement('div'); lbl.textContent = name; box.appendChild(lbl);
    wrap.appendChild(box);
  }
  document.body.appendChild(wrap);
});
await new Promise(r => setTimeout(r, 400));
await page.screenshot({ path: '/tmp/sprites.png', fullPage: true });
console.log(errs.slice(0,3).join('\n') || 'ok');
await browser.close();
