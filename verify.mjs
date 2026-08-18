import { chromium } from 'playwright';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', err => errors.push(`[pageerror] ${err.message}`));

await page.goto('http://127.0.0.1:5180/', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(2500);

const bodyText = await page.evaluate(() => document.body.innerText);
const rootChildCount = await page.evaluate(() => document.getElementById('root')?.children.length);

console.log('--- ERRORS ---');
console.log(errors.length === 0 ? '(none)' : errors.join('\n'));
console.log('--- BODY TEXT (first 300 chars) ---');
console.log(bodyText.slice(0, 300));
console.log('--- ROOT CHILD COUNT ---', rootChildCount);

await page.screenshot({ path: '/tmp/app-screenshot.png' });
await browser.close();
