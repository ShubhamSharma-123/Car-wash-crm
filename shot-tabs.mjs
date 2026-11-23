import { chromium } from 'playwright';
const tabs = ['Bookings', 'Customers', 'Staff performance', 'Payments'];
const base = process.env.BASE || 'http://localhost:5173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errs = [];
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
await page.goto(base + '/reports', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
for (const t of tabs) {
  await page.getByRole('tab', { name: t, exact: true }).click();
  await page.waitForTimeout(1800);
  const slug = t.toLowerCase().replace(/\s+/g, '-');
  await page.screenshot({ path: `shots/reports-${slug}.png`, fullPage: true });
}
console.log(errs.length ? errs.join('\n') : 'no console errors');
await browser.close();
