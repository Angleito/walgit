
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  await page.screenshot({ path: 'example.png' });
  console.log('Screenshot taken successfully');
  await browser.close();
})().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
