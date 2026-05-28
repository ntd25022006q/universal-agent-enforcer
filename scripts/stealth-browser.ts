import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import http from 'http';

// Apply Stealth Plugin
puppeteer.use(StealthPlugin());

const REMOTE_DEBUG_PORT = process.env.REMOTE_DEBUG_PORT || '9222';
const REMOTE_DEBUG_URL = `http://127.0.0.1:${REMOTE_DEBUG_PORT}/json`;

interface StealthBrowserResult {
  browser: import('puppeteer').Browser;
  remote: boolean;
  wsUrl: string | null;
}

interface DebuggerTarget {
  type?: string;
  webSocketDebuggerUrl?: string;
}

// Query JSON metadata to extract CloakBrowser WebSocket Debugger URL
async function fetchWebSocketDebuggerUrl(): Promise<string | null> {
  return new Promise((resolve) => {
    http
      .get(REMOTE_DEBUG_URL, { timeout: 2000 }, (res) => {
        let data = '';
        res.on('data', (chunk: string | Buffer) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const targets: DebuggerTarget[] = JSON.parse(data) as DebuggerTarget[];
            // Look for page type targets
            const pageTarget = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
            if (pageTarget && pageTarget.webSocketDebuggerUrl) {
              resolve(pageTarget.webSocketDebuggerUrl);
            } else if (targets[0] && targets[0].webSocketDebuggerUrl) {
              resolve(targets[0].webSocketDebuggerUrl);
            } else {
              resolve(null);
            }
          } catch {
            resolve(null);
          }
        });
      })
      .on('error', () => {
        resolve(null);
      });
  });
}

export async function getStealthBrowser(): Promise<StealthBrowserResult> {
  const wsUrl = await fetchWebSocketDebuggerUrl();

  if (wsUrl) {
    console.log(`[Stealth Browser] Active CloakBrowser session detected!`);
    console.log(`WebSocket Debug URL: ${wsUrl}`);
    console.log(`You can configure chrome-devtools-mcp using port ${REMOTE_DEBUG_PORT}`);
    try {
      // Connect directly using the extracted WebSocket URL
      const browser = await puppeteer.connect({
        browserWSEndpoint: wsUrl,
        defaultViewport: null,
      });
      console.log('Connected to CloakBrowser CDP session successfully!');
      return { browser, remote: true, wsUrl };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        'Failed to connect to remote debug session, launching local stealth browser...',
        message,
      );
    }
  } else {
    console.warn(
      `[Stealth Browser] No active CloakBrowser session found on port ${REMOTE_DEBUG_PORT}.`,
    );
    console.warn(
      '   Ensure CloakBrowser is running with --remote-debugging-port=9222 to enable full Cloudflare bypass.',
    );
  }

  console.log(
    '[Stealth Browser] Launching local Chromium instance with puppeteer-extra-stealth...',
  );
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1280,800',
    ],
    defaultViewport: { width: 1280, height: 800 },
  });
  console.log('[Stealth Browser] Local stealth browser launched.');
  return { browser, remote: false, wsUrl: null };
}

// If run directly
if (process.argv[1] && process.argv[1].endsWith('stealth-browser.ts')) {
  (async () => {
    const { browser, remote } = await getStealthBrowser();
    const page = await browser.newPage();

    console.log('Navigating to security check page...');
    await page.goto('https://bot.sannysoft.com/', { waitUntil: 'networkidle2' });

    const screenshotPath = './stealth_test_result.png';
    await page.screenshot({ path: screenshotPath });
    console.log(`Test screenshot saved to: ${screenshotPath}`);

    if (!remote) {
      await browser.close();
    } else {
      await page.close();
      browser.disconnect();
    }
  })();
}
