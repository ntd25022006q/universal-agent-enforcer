import { getStealthBrowser } from './stealth-browser.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceDir = path.resolve(__dirname, '..');
const logsDir = path.join(workspaceDir, '.agent_logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const targetUrl = process.argv[2] || 'http://localhost:3000';
const consoleErrors: string[] = [];
const failedRequests: string[] = [];

async function monitorApp(): Promise<void> {
  console.log(`[DevTools Monitor] Connecting browser to monitor: ${targetUrl}`);
  const { browser, remote } = await getStealthBrowser();

  try {
    const page = await browser.newPage();

    // Enable CDP Console Domain
    const client = await page.target().createCDPSession();
    await client.send('Console.enable');
    await client.send('Runtime.enable');

    // Attach listeners
    client.on('Console.messageAdded', (event: Record<string, unknown>) => {
      const message = event.message as Record<string, unknown>;
      if (message.level === 'error') {
        const errText = `[Console Error] [${message.source || 'unknown'}] ${message.text || ''} (${message.url || 'unknown'} line ${message.line || 0})`;
        console.warn(`🚨 ${errText}`);
        consoleErrors.push(errText);
      }
    });

    page.on('pageerror', (err: Error) => {
      const errText = `[Page Exception] ${err.toString()}`;
      console.warn(`🚨 ${errText}`);
      consoleErrors.push(errText);
    });

    page.on('requestfailed', (request: import('puppeteer').HTTPRequest) => {
      const failure = request.failure();
      const errText = `[Request Failed] ${request.url()} - Error: ${failure ? failure.errorText : 'unknown'}`;
      console.warn(`🚨 ${errText}`);
      failedRequests.push(errText);
    });

    page.on('response', (response: import('puppeteer').HTTPResponse) => {
      const status = response.status();
      if (status >= 500) {
        const errText = `[HTTP 5xx Server Error] ${response.url()} - Status: ${status}`;
        console.warn(`🚨 ${errText}`);
        failedRequests.push(errText);
      }
    });

    console.log('Navigating to application...');
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 15000 });

    // Emulate clicking around on links or interactive components to trigger faults
    console.log('Simulating interactions (clicking main interactive elements)...');
    const interactives = await page.$$('button, a, input[type="submit"], [role="button"]');
    console.log(`Found ${interactives.length} interactive elements. Interacting...`);

    // Click up to 5 elements or form controls
    const maxClicks = Math.min(interactives.length, 5);
    for (let i = 0; i < maxClicks; i++) {
      try {
        const el = interactives[i];
        if (el) {
          await el.click();
          await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 500))); // Delay
        }
      } catch {
        // Element might be detached or not visible, ignore click error and continue
      }
    }

    // Final assessment
    const totalErrors = consoleErrors.length + failedRequests.length;

    if (totalErrors > 0) {
      console.error(`[DevTools Monitor] REJECTED: Detected ${totalErrors} faults!`);

      // Save logs and screenshot
      const screenshotPath = path.join(logsDir, 'error_screenshot.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Screenshot saved to: ${screenshotPath}`);

      const reportPath = path.join(logsDir, 'devtools_report.txt');
      const reportContent: string = [
        `Fault Report for: ${targetUrl}`,
        `Timestamp: ${new Date().toISOString()}`,
        '\n--- CONSOLE ERRORS ---',
        ...consoleErrors,
        '\n--- NETWORK FAILURES ---',
        ...failedRequests,
      ].join('\n');

      fs.writeFileSync(reportPath, reportContent, 'utf-8');
      console.log(`Fault report details written to: ${reportPath}`);

      // Shutdown browser connection
      if (!remote) await browser.close();
      else {
        await page.close();
        browser.disconnect();
      }

      console.error(
        'Action Required: AI Agent must fix the reported DevTools console / network bugs before completing.',
      );
      process.exit(1); // Exit with error code to halt the Agent
    } else {
      console.log(
        '[DevTools Monitor] No console exceptions or network errors caught during monitoring!',
      );
      if (!remote) await browser.close();
      else {
        await page.close();
        browser.disconnect();
      }
      process.exit(0);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[DevTools Monitor] Error during monitoring:', message);
    if (!remote) await browser.close();
    process.exit(1);
  }
}

monitorApp();
