import { chromium } from 'playwright';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pathLib from 'path';

const __dirname = pathLib.dirname(fileURLToPath(import.meta.url));
const workspaceDir = pathLib.resolve(__dirname, '..');
const screenshotDir = pathLib.join(workspaceDir, '.agent_logs', 'screenshots');

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

/**
 * Screenshot Comparison — compares screenshots using byte-level equality and size deviation.
 *
 * This module does NOT perform pixel-level diffing. Instead, it:
 *   1. Checks byte-exact equality between baseline and current screenshots.
 *   2. If not identical, computes the percentage size deviation.
 *   3. Flags screenshots with >15% size deviation as likely visual regressions
 *      (e.g., white screen, broken layout, missing components).
 *
 * @param url - Target URL to test
 * @param pageName - Identifier for the page state (e.g. 'home', 'login')
 * @returns True if layout matches baseline or deviation is within acceptable thresholds
 */
export async function verifyUILayout(url: string, pageName = 'default'): Promise<boolean> {
  console.log(
    `📸 [Screenshot Comparison] Capturing screenshot for page: "${pageName}" at URL: ${url}`,
  );

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });

    // Inject CSS to disable animations (avoids flaky visual tests)
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          transition-property: none !important;
          transform: none !important;
          animation: none !important;
        }
      `,
    });

    const baselinePath = pathLib.join(screenshotDir, `${pageName}_baseline.png`);
    const currentPath = pathLib.join(screenshotDir, `${pageName}_current.png`);

    // Capture current state
    await page.screenshot({ path: currentPath, fullPage: true });

    if (!fs.existsSync(baselinePath)) {
      console.log(
        `[Screenshot Comparison] No baseline found. Saving current screenshot as baseline: ${baselinePath}`,
      );
      fs.copyFileSync(currentPath, baselinePath);
      await browser.close();
      return true;
    }

    // Compare screenshot byte-level equality and size deviation
    const baselineBuffer = fs.readFileSync(baselinePath);
    const currentBuffer = fs.readFileSync(currentPath);

    if (baselineBuffer.equals(currentBuffer)) {
      console.log('[Screenshot Comparison] Screenshots are byte-identical to baseline.');
      await browser.close();
      return true;
    }

    // Check size deviation
    const sizeDiff = Math.abs(baselineBuffer.length - currentBuffer.length);
    const deviationPercentage = (sizeDiff / baselineBuffer.length) * 100;

    console.log(`[Screenshot Comparison] Size deviation: ${deviationPercentage.toFixed(2)}%`);

    // If size changes significantly (e.g. > 15%), it likely indicates white screen or broken UI elements
    if (deviationPercentage > 15) {
      console.error(
        `[Screenshot Comparison] REJECTED: Size deviation detected on page "${pageName}"!`,
      );
      console.error(
        `   Baseline size: ${baselineBuffer.length} bytes, Current size: ${currentBuffer.length} bytes.`,
      );
      console.error(
        '   This usually points to layout breakage, white screen, or missing components.',
      );
      await browser.close();
      return false;
    }

    console.log(
      '[Screenshot Comparison] Check passed (size deviation within acceptable thresholds).',
    );
    await browser.close();
    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Screenshot Comparison] Failed to perform visual test:', message);
    await browser.close();
    return false;
  }
}

// Self-test execution if run directly
if (process.argv[1] && process.argv[1].endsWith('visual-regression.ts')) {
  (async () => {
    const ok = await verifyUILayout('https://example.com', 'example_page');
    console.log(`Screenshot comparison test result: ${ok ? 'PASSED' : 'FAILED'}`);
  })();
}
