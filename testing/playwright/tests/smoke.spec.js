import { test, expect } from '@playwright/test';

// ── Smoke tests ────────────────────────────────────────────
// These run after every task to verify the app still loads.
// Agent generates feature-specific tests in separate files.

test.describe('Smoke Tests', () => {

  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).not.toHaveTitle(/error/i);
    await page.screenshot({ path: '/screenshots/homepage.png', fullPage: true });
  });

  test('no console errors on load', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });

  test('API health check', async ({ request }) => {
    const res = await request.get('http://api:4000/health');
    expect(res.ok()).toBeTruthy();
  });

});
