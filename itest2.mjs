import { chromium } from 'playwright';
const B = 'http://localhost:5173';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
const errs = [];
p.on('console', (m) => m.type() === 'error' && errs.push('CONSOLE ' + m.text()));
p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
const step = async (n, f) => { try { await f(); console.log('ok   ' + n); } catch (e) { console.log('FAIL ' + n + ' :: ' + e.message.split('\n')[0]); } };
const go = async (r) => { await p.goto(B + r, { waitUntil: 'networkidle' }); await p.waitForTimeout(900); };
const tab = async (n) => { await p.getByRole('tab', { name: n, exact: true }).first().click({ timeout: 5000 }); await p.waitForTimeout(500); };

await go('/bookings');
await step('calendar view', async () => { await tab('Calendar'); await p.waitForTimeout(600); await p.screenshot({ path: 'shots/bookings-calendar.png', fullPage: false }); });
await step('table view', async () => { await tab('Table'); });

await go('/');
await step('dashboard weekly', async () => { await tab('Weekly'); });
await step('dashboard monthly', async () => { await tab('Monthly'); });
await step('service chart volume', async () => { await tab('Volume'); });

await go('/settings?tab=hours');
await step('add custom slot', async () => {
  await p.locator('input[type=time]').fill('21:30');
  await p.waitForTimeout(300);
  await p.getByRole('button', { name: /Add slot/i }).click({ timeout: 5000 });
  await p.waitForTimeout(500);
  const txt = await p.locator('body').innerText();
  if (!txt.includes('09:30 PM')) throw new Error('slot not rendered');
});
await step('save settings', async () => {
  await p.getByRole('button', { name: /^Save$/ }).first().click({ timeout: 5000 });
  await p.waitForTimeout(800);
});
console.log(errs.length ? errs.join('\n') : 'no console errors');
await b.close();
