import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const file = process.argv[2], out = process.argv[3];
const exe = await chromium.executablePath();
const browser = await puppeteer.launch({
  args: [...chromium.args, '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files'],
  executablePath: exe, headless: true,
  defaultViewport: { width: 1460, height: 1000 },
});
const page = await browser.newPage();
await page.goto('file://' + file, { waitUntil: 'networkidle0' });
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log('render ok');
