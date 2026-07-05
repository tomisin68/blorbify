const { chromium } = require('playwright');
const shotDir = 'C:/Users/Admin/AppData/Local/Temp/claude/c--Users-Admin-StudioProjects-blorbify/671ab3fd-a191-4b62-bcc4-be9c0437714c/scratchpad';

(async () => {
  const browser = await chromium.launch();
  const errors = [];

  // --- No active subscription state ---
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', (err) => errors.push('[no-sub] ' + err.message));

  const mockPlansResponse = {
    data: {
      plans: [
        { id: 'starter', name: 'Starter', amountNaira: 10000, interval: 'monthly', description: 'Store online with the basics you need to start selling.' },
        { id: 'growth', name: 'Growth', amountNaira: 25000, interval: 'monthly', description: 'Store plus delivery and growth tools for active sellers.' },
        { id: 'pro', name: 'Pro', amountNaira: 50000, interval: 'monthly', description: 'Priority support and the full commerce toolkit.' },
      ],
    },
  };
  await page.route('**/api/payments/plans', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPlansResponse) }));

  await page.goto('http://localhost:5173/dashboard/preview.html', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.nav-item', { timeout: 15000 });
  await page.locator('.nav-item', { hasText: 'Billing' }).click();
  await page.waitForSelector('.billing-panel', { timeout: 10000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${shotDir}/billing-01-no-subscription.png`, fullPage: true });

  const planCount = await page.locator('.billing-plan-card').count();
  console.log('Plan cards rendered:', planCount);

  // Intercept the initialize call so clicking Subscribe doesn't hit the real Paystack/Firestore
  await page.route('**/api/payments/subscriptions/initialize', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ data: { authorizationUrl: 'https://checkout.paystack.com/mock-test-session' } }),
    });
  });
  // Prevent the actual navigation so the page (and test) stays put
  await page.route('https://checkout.paystack.com/**', (route) => route.abort());

  await page.locator('.billing-plan-card').filter({ has: page.locator('.billing-plan-name', { hasText: 'Growth' }) }).locator('.billing-plan-btn').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${shotDir}/billing-02-subscribing-state.png` });

  await page.close();

  // --- Active subscription state ---
  const active = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  active.on('pageerror', (err) => errors.push('[active-sub] ' + err.message));
  await active.route('**/api/payments/plans', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPlansResponse) }));
  await active.goto('http://localhost:5173/dashboard/preview.html?sub=active', { waitUntil: 'domcontentloaded' });
  await active.waitForSelector('.nav-item', { timeout: 15000 });
  await active.locator('.nav-item', { hasText: 'Billing' }).click();
  await active.waitForSelector('.billing-panel', { timeout: 10000 });
  await active.waitForTimeout(1500);
  await active.screenshot({ path: `${shotDir}/billing-03-active-subscription.png`, fullPage: true });
  await active.close();

  // --- Return-from-payment banner ---
  const back = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  back.on('pageerror', (err) => errors.push('[return-banner] ' + err.message));
  await back.route('**/api/payments/plans', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPlansResponse) }));
  await back.goto('http://localhost:5173/dashboard/preview.html?billing=success', { waitUntil: 'domcontentloaded' });
  await back.waitForSelector('.nav-item', { timeout: 15000 });
  await back.locator('.nav-item', { hasText: 'Billing' }).click();
  await back.waitForSelector('.billing-panel', { timeout: 10000 });
  await back.waitForTimeout(1000);
  await back.screenshot({ path: `${shotDir}/billing-04-return-banner.png` });
  console.log('URL after cleanup (should have no ?billing= param):', back.url());
  await back.close();

  console.log('CONSOLE_ERRORS:', JSON.stringify(errors, null, 2));
  await browser.close();
})();
