import { test, expect } from '@playwright/test';

test.describe('Agent Enforcer Dashboard E2E', () => {
  test('loads the dashboard and lists the 14 validators', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Header
    await expect(page.locator('h1')).toHaveText('Validator Dashboard');

    // Validator list is rendered dynamically on init
    const rows = page.locator('li.validator-row');
    await expect(rows).toHaveCount(14);

    // Stats initialise to zero
    await expect(page.locator('#stat-total')).toHaveText('0');
    await expect(page.locator('#stat-pass')).toHaveText('0');

    // Log panel gets an initial INFO message
    const logLine = page.locator('.log-line').first();
    await expect(logLine).toContainText('Dashboard initialised');
  });

  test('runs every validator and updates the stat counters', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const button = page.locator('#btn-run-all');
    await button.click();

    // Wait for the run to finish — button text reverts to the idle label.
    await expect(button).toHaveText('Run All Validators', { timeout: 30000 });

    // After the run completes, every row should be pass / warn / fail (none pending).
    const pending = page.locator('.validator-status.status-pending');
    await expect(pending).toHaveCount(0);

    // Stat cards should reflect 14 total validators.
    await expect(page.locator('#stat-total')).toHaveText('14');

    // The mock runner produces 11 pass / 2 warn / 1 fail.
    await expect(page.locator('#stat-pass')).toHaveText('11');
    await expect(page.locator('#stat-warn')).toHaveText('2');
    await expect(page.locator('#stat-fail')).toHaveText('1');

    // A final summary line should appear in the audit log.
    const summary = page.locator('.log-line', { hasText: 'Validation complete' });
    await expect(summary).toHaveCount(1);
  });
});
