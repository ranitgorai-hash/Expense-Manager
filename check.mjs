import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
const logs = [];
page.on('console', msg => logs.push(`[console.${msg.type()}] ${msg.text()}`));
page.on('pageerror', err => logs.push(`[pageerror] ${err.message}\n${err.stack}`));
page.on('requestfailed', req => logs.push(`[requestfailed] ${req.url()} - ${req.failure()?.errorText}`));

await page.goto('http://127.0.0.1:5175/', { waitUntil: 'networkidle', timeout: 15000 }).catch(e => logs.push(`[goto error] ${e.message}`));
await page.waitForTimeout(2000);

const bodyText = await page.evaluate(() => document.body.innerText);
const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML?.slice(0, 500));

console.log('--- LOGS ---');
console.log(logs.join('\n'));
console.log('--- BODY TEXT ---');
console.log(JSON.stringify(bodyText));
console.log('--- ROOT HTML (first 500 chars) ---');
console.log(rootHtml);

await browser.close();
