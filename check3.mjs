import { chromium } from 'playwright';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
const logs = [];
page.on('console', msg => logs.push(`[console.${msg.type()}] ${msg.text()}`));
page.on('pageerror', err => logs.push(`[pageerror] ${err.message}`));
page.on('requestfailed', req => logs.push(`[requestfailed] ${req.url()} - ${req.failure()?.errorText}`));

await page.goto('http://127.0.0.1:5179/', { waitUntil: 'networkidle', timeout: 15000 }).catch(e => logs.push(`[goto error] ${e.message}`));
await page.waitForTimeout(2500);

const bodyText = await page.evaluate(() => document.body.innerText);
const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML?.slice(0, 800));

console.log('--- LOGS ---');
console.log(logs.join('\n'));
console.log('--- BODY TEXT ---');
console.log(JSON.stringify(bodyText));
console.log('--- ROOT HTML ---');
console.log(rootHtml);

await browser.close();
