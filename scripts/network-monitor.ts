import http from 'http';
import https from 'https';

const testUrls: string[] = [
  'https://www.google.com',
  'https://github.com',
  'https://registry.npmjs.org',
];

async function checkUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { timeout: 5000 }, (res) => {
      resolve(res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 400);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function verifyNetwork(): Promise<void> {
  console.log('[Network Monitor] Checking network, VPN, and Proxy status...');

  // Check HTTP_PROXY/HTTPS_PROXY configuration
  const proxy =
    process.env.HTTP_PROXY ||
    process.env.HTTPS_PROXY ||
    process.env.http_proxy ||
    process.env.https_proxy;
  if (proxy) {
    console.log(`[Network Monitor] Proxy configured: ${proxy}`);
  }

  let connectionSuccess = false;

  for (const url of testUrls) {
    const isOk = await checkUrl(url);
    if (isOk) {
      console.log(`Connection to ${url} verified.`);
      connectionSuccess = true;
      break; // One successful connection is enough to verify internet access
    } else {
      console.warn(`Failed to connect to ${url}`);
    }
  }

  if (!connectionSuccess) {
    console.error(
      '[Network Monitor] ERROR: VPN/Proxy/VPS Connection lost or internet is unreachable!',
    );
    console.error(
      'Stopping AI Agent process immediately to conserve tokens and prevent incomplete task states.',
    );
    process.exit(1); // Force failure exit code to halt the Agent's script execution
  } else {
    console.log('[Network Monitor] Network check passed. Connection is healthy.');
  }
}

verifyNetwork();
