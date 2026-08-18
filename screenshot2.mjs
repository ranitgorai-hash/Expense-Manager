import { chromium } from 'playwright';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', err => errors.push(`[pageerror] ${err.message}`));

await page.goto('http://127.0.0.1:5183/Expense-Manager/', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(1000);
// switch to single mode
await page.getByRole('button', { name: /single/i }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/desktop_single_mode.png' });

// click Analytics in sidebar nav to verify navigation works
await page.getByText('Analytics', { exact: true }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: '/tmp/desktop_analytics_nav.png' });

console.log('URL after nav click:', page.url());
console.log('--- ERRORS ---');
console.log(errors.length === 0 ? '(none)' : errors.join('\n'));
await browser.close();
