import { chromium } from 'playwright';
const B = 'http://localhost:5173';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
const errs = [];
p.on('console', (m) => m.type() === 'error' && errs.push('CONSOLE ' + m.text()));
p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
const step = async (name, fn) => { try { await fn(); console.log('ok   ' + name); } catch (e) { console.log('FAIL ' + name + ' :: ' + e.message.split('\n')[0]); } };
const go = async (r) => { await p.goto(B + r, { waitUntil: 'networkidle' }); await p.waitForTimeout(900); };
const click = async (name, opts={}) => { await p.getByRole('button', { name }).first().click({ timeout: 5000, ...opts }); await p.waitForTimeout(600); };

await go('/');
await step('dashboard monthly', async () => { await p.getByRole('tab', { name: 'Monthly', exact: true }).click({timeout:5000}); await p.waitForTimeout(500); });

await go('/bookings');
await step('bookings calendar', async () => { await click(/^Calendar$/); });
await step('bookings table view', async () => { await click(/^Table$/); });
await step('bookings open row', async () => { await p.locator('tbody tr').first().click({timeout:5000}); await p.waitForTimeout(800); });

await go('/bookings/BKG-5633');
await step('advance status', async () => { await click(/^Mark /); });
await step('booking tabs', async () => {
  for (const t of ['Timeline','Payment','Notes','Overview']) { await p.getByRole('tab',{name:t,exact:true}).click({timeout:5000}); await p.waitForTimeout(250); }
});

await go('/bookings/BKG-5633');
await step('add note', async () => {
  await p.getByRole('tab',{name:'Notes',exact:true}).click(); await p.waitForTimeout(400);
  const ta = p.locator('textarea').first();
  await ta.fill('Smoke test note'); await p.getByRole('button',{name:/Add note|Save note|Post/i}).first().click({timeout:5000}); await p.waitForTimeout(500);
});

await go('/settings?tab=hours');
await step('settings add slot', async () => {
  await p.locator('select').last().selectOption({ index: 1 });
  await p.waitForTimeout(300);
  await click(/^Add slot$/);
});
await step('settings save sticky', async () => { await click(/^Save$/); });

await go('/reports');
await step('reports range 90d', async () => { await p.getByRole('tab',{name:'90d'}).click({timeout:5000}); await p.waitForTimeout(900); });
await step('reports tab payments', async () => { await p.getByRole('tab',{name:'Payments',exact:true}).click({timeout:5000}); await p.waitForTimeout(800); });
await step('reports export', async () => { await click(/Export CSV/); });

await go('/invoices/INV-2401');
await step('invoice record payment nav', async () => { await click(/Record payment/); await p.waitForTimeout(700); });

await go('/services');
await step('service detail modal', async () => { await p.getByText('Premium Wash',{exact:true}).first().click({timeout:5000}); await p.waitForTimeout(700); });
await p.keyboard.press('Escape');

await go('/staff');
await step('staff add modal', async () => { await click(/Add staff/); });
await p.keyboard.press('Escape');

await go('/vehicles/VEH-2003');
await step('vehicle details tabs', async () => {
  const tabs = await p.getByRole('tab').all();
  for (const t of tabs.slice(0,4)) { await t.click({timeout:5000}); await p.waitForTimeout(250); }
});

console.log(errs.length ? errs.join('\n') : 'no console errors');
await b.close();
