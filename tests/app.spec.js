import { test, expect } from '@playwright/test';

test.describe('Agent Enforcer Dashboard E2E', () => {
  test('should load the dashboard and optimize neural weights successfully', async ({ page }) => {
    // Navigate to the local dev server (use domcontentloaded to avoid blocking on external fonts)
    await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });

    // Check header
    const header = page.locator('h1');
    await expect(header).toHaveText('Overview Dashboard');

    // Input value
    const input = page.locator('#input-factor');
    await input.fill('1.25');

    // Click button
    const btn = page.locator('#btn-optimize');
    await btn.click();

    // Assert optimized value (should be 1.25 * 1.42 = 1.78)
    const result = page.locator('#result-coefficient');
    await expect(result).toHaveText('1.78');
  });
});
