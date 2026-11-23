import { chromium } from 'playwright';
const routes = ['/', '/bookings', '/bookings/BKG-5001', '/customers', '/customers/CUS-1001', '/vehicles', '/vehicles/VEH-2003', '/services', '/staff', '/payments', '/invoices', '/invoices/INV-2401', '/reports', '/notifications', '/settings'];
const b = await chromium.launch();
const errs = [];
for (const vp of [{ name: 'd', width: 1440, height: 1000 }, { name: 'm', width: 390, height: 844 }]) {
  const p = await b.newPage({ viewport: { width: vp.width, height: vp.height } });
  p.on('console', (m) => m.type() === 'error' && errs.push(`${vp.name} ${m.text()}`));
  p.on('pageerror', (e) => errs.push(`${vp.name} PAGEERROR ${e.message}`));
  for (const r of routes) {
    await p.goto('http://localhost:5173' + r, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1100);
    const slug = r === '/' ? 'dashboard' : r.replace(/\//g, '_').replace(/^_/, '');
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 2) errs.push(`${vp.name} ${r} horizontal overflow ${overflow}px`);
    await p.screenshot({ path: `shots/${vp.name}-${slug}.png`, fullPage: vp.name === 'd' });
  }
  await p.close();
}
console.log(errs.length ? errs.join('\n') : 'clean');
await b.close();
