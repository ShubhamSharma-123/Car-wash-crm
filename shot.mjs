import { chromium } from 'playwright';
const routes = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
for (const r of routes) {
  await page.goto('http://localhost:5173' + r, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  const name = r === '/' ? 'dashboard' : r.replace(/\//g, '_').replace(/^_/, '');
  await page.screenshot({ path: `shots/${name}.png`, fullPage: true });
}
console.log(errors.slice(0, 12).join('\n') || 'no console errors');
await browser.close();
