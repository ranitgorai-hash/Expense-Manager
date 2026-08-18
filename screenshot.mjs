import { chromium } from 'playwright';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});

// Desktop viewport
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', err => errors.push(`[pageerror] ${err.message}`));

await page.goto('http://127.0.0.1:5183/Expense-Manager/', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: '/tmp/desktop_dashboard.png' });

await page.goto('http://127.0.0.1:5183/Expense-Manager/#/settings', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.screenshot({ path: '/tmp/desktop_settings.png' });

await page.goto('http://127.0.0.1:5183/Expense-Manager/#/history', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.screenshot({ path: '/tmp/desktop_history.png' });

console.log('--- ERRORS ---');
console.log(errors.length === 0 ? '(none)' : errors.join('\n'));

// Mobile viewport check (regression test)
const mpage = await browser.newPage({ viewport: { width: 390, height: 844 } });
const merrors = [];
mpage.on('console', msg => { if (msg.type() === 'error') merrors.push(msg.text()); });
mpage.on('pageerror', err => merrors.push(`[pageerror] ${err.message}`));
await mpage.goto('http://127.0.0.1:5183/Expense-Manager/', { waitUntil: 'networkidle', timeout: 15000 });
await mpage.waitForTimeout(1000);
await mpage.screenshot({ path: '/tmp/mobile_dashboard.png' });
console.log('--- MOBILE ERRORS ---');
console.log(merrors.length === 0 ? '(none)' : merrors.join('\n'));

await browser.close();
