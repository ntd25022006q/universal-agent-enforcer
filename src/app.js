/**
 * Universal Agent Enforcer — Real Dashboard Controller
 *
 * This module wires the in-browser control panel to the 14 enforcement scripts
 * exposed by the repo. It replaces the previous placeholder dashboard that only
 * multiplied an input by 1.42 with no real behaviour.
 *
 * The dashboard:
 *   • Lists all 14 validators (name + description)
 *   • Runs each validator sequentially when "Run All Validators" is clicked
 *   • Updates per-validator status (pending → pass / warn / fail) in real time
 *   • Maintains aggregate stats (total / pass / warn / fail)
 *   • Streams timestamped log lines to the audit-log panel
 *
 * The pure helpers (calculateStats, formatLogLine, renderValidatorList,
 * VALIDATOR_LIST) are exported so unit tests can exercise them without a DOM.
 */

/* -----------------------------------------------------------------------------
 * Pure data & helpers (exported for unit testing)
 * ---------------------------------------------------------------------------*/

/**
 * Canonical list of the 14 enforcement validators shipped in this repo.
 * Order matches the orchestrator's pipeline order where practical.
 */
export const VALIDATOR_LIST = Object.freeze([
  {
    name: 'network-monitor',
    description: 'Verifies internet/VPN/proxy connectivity before any external calls.',
  },
  {
    name: 'backup-guard',
    description: 'Snapshots protected files so they can be restored on corruption.',
  },
  {
    name: 'fact-checker',
    description: 'Anti-hallucination scan: rejects imports of undeclared packages.',
  },
  {
    name: 'test-runner',
    description: 'Runs the unit & E2E test suite and detects infinite-loop failures.',
  },
  {
    name: 'build',
    description: 'Bundles sources and copies static assets into the dist directory.',
  },
  {
    name: 'build-analyzer',
    description: 'Checks bundle size and flags regressions beyond the threshold.',
  },
  {
    name: 'config-validator',
    description: 'Validates .env / mcp-config.json structure against the schema.',
  },
  {
    name: 'devtools-monitor',
    description: 'Drives a headless browser to capture console & network errors.',
  },
  {
    name: 'visual-regression',
    description: 'Compares current screenshot bytes against the stored baseline.',
  },
  {
    name: 'stealth-browser',
    description: 'Configures puppeteer-extra with stealth plugin for Cloudflare bypass.',
  },
  {
    name: 'quality-auditor',
    description: 'Aggregates metrics into the final quality-gate report.',
  },
  {
    name: 'orchestrator',
    description: 'Coordinates every validator in a bounded retry loop.',
  },
  {
    name: 'interactive-cli',
    description: 'Prompts the operator for approval before destructive steps.',
  },
  {
    name: 'server',
    description: 'Static dev server used during live browser verification.',
  },
]);

/** Validator status values used throughout the UI. */
export const STATUS = Object.freeze({
  PENDING: 'pending',
  PASS: 'pass',
  WARN: 'warn',
  FAIL: 'fail',
});

/**
 * Aggregate an array of per-validator results into counters.
 *
 * @param {Array<{validator: string, status: string}>} results
 * @returns {{total: number, pass: number, warn: number, fail: number}}
 */
export function calculateStats(results) {
  const stats = { total: 0, pass: 0, warn: 0, fail: 0 };
  if (!Array.isArray(results)) return stats;
  for (const r of results) {
    if (!r || typeof r !== 'object') continue; // skip null / undefined / malformed
    stats.total += 1;
    if (r.status === STATUS.PASS) stats.pass += 1;
    else if (r.status === STATUS.WARN) stats.warn += 1;
    else if (r.status === STATUS.FAIL) stats.fail += 1;
  }
  return stats;
}

/**
 * Pad a number to two digits. Exported for testability.
 * @param {number} n
 * @returns {string}
 */
export function pad2(n) {
  const v = Math.max(0, Math.floor(Number(n) || 0));
  return v < 10 ? `0${v}` : String(v);
}

/**
 * Build a timestamp string in HH:MM:SS format (24h, local time).
 * Pure: receives an optional Date so tests can pin the value.
 *
 * @param {Date} [date]
 * @returns {string}
 */
export function formatTimestamp(date = new Date()) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

/**
 * Map a log level to a single-character colour prefix tag used by the UI.
 * @param {string} level
 * @returns {string}
 */
export function levelTag(level) {
  const upper = String(level || 'INFO').toUpperCase();
  switch (upper) {
    case 'PASS':
      return '[PASS]';
    case 'WARN':
      return '[WARN]';
    case 'ERROR':
    case 'FAIL':
      return '[FAIL]';
    case 'DEBUG':
      return '[DBG ]';
    case 'INFO':
    default:
      return '[INFO]';
  }
}

/**
 * Format a single log line for the audit-log panel.
 * Output shape: "HH:MM:SS [LEVEL] message"
 *
 * @param {string} level - one of INFO / WARN / ERROR / DEBUG / PASS / FAIL
 * @param {string} message
 * @param {Date} [date]
 * @returns {string}
 */
export function formatLogLine(level, message, date = new Date()) {
  const ts = formatTimestamp(date);
  const tag = levelTag(level);
  const msg = message == null ? '' : String(message);
  return `${ts} ${tag} ${msg}`;
}

/**
 * Render the validator list as an HTML string. Each row exposes the name,
 * description, and a status placeholder the controller can later update.
 *
 * @param {Array<{name: string, description: string}>} [validators]
 * @returns {string}
 */
export function renderValidatorList(validators) {
  // Distinguish "no argument" from an explicit null/undefined argument.
  if (arguments.length === 0) validators = VALIDATOR_LIST;
  if (validators == null) return '';
  if (!Array.isArray(validators)) return '';
  const rows = validators.map((v) => {
    const esc = (s) =>
      String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    const name = esc(v?.name);
    const desc = esc(v?.description);
    return (
      `<li class="validator-row" data-validator="${name}">` +
      `<span class="validator-name">${name}</span>` +
      `<span class="validator-desc">${desc}</span>` +
      `<span class="validator-status status-pending">pending</span>` +
      `</li>`
    );
  });
  return `<ul class="validator-list">${rows.join('')}</ul>`;
}

/**
 * Resolve a Promise after the given delay (used to pace sequential runs).
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* -----------------------------------------------------------------------------
 * Mock API (used when no real backend is reachable)
 * ---------------------------------------------------------------------------*/

/**
 * Simulated per-validator execution. Returns a deterministic-ish status so
 * the dashboard has something interesting to render even without a backend.
 *
 * @param {{name: string, description: string}} validator
 * @param {number} index
 * @returns {Promise<{validator: string, status: string, message: string, durationMs: number}>}
 */
export async function runValidatorMock(validator, index) {
  const start = Date.now();
  await delay(150 + ((index * 37) % 180)); // 150–330 ms, varies per validator
  const durationMs = Date.now() - start;

  // Deterministic pattern: 11 pass, 2 warn, 1 fail — easy to assert on UI.
  let status = STATUS.PASS;
  let message = `${validator.name}: checks completed successfully`;
  if (index === 6) {
    status = STATUS.WARN;
    message = `${validator.name}: bundle size within 5% of threshold`;
  } else if (index === 9) {
    status = STATUS.WARN;
    message = `${validator.name}: stealth plugin detected minor fingerprint leak`;
  } else if (index === 12) {
    status = STATUS.FAIL;
    message = `${validator.name}: approval prompt timed out (no operator input)`;
  }
  return { validator: validator.name, status, message, durationMs };
}

/**
 * Mock fetch replacement for `/api/run-all`. Walks every validator in order
 * and emits each result. Resolves with the full results array.
 *
 * @param {typeof runValidatorMock} [runner]
 * @returns {Promise<Array<{validator: string, status: string, message: string, durationMs: number}>>}
 */
export async function fetchRunAll(runner = runValidatorMock) {
  const out = [];
  for (let i = 0; i < VALIDATOR_LIST.length; i += 1) {
    const r = await runner(VALIDATOR_LIST[i], i);
    out.push(r);
  }
  return out;
}

/* -----------------------------------------------------------------------------
 * Dashboard controller class
 * ---------------------------------------------------------------------------*/

export class Dashboard {
  /**
   * @param {Document} doc
   * @param {Window} win
   * @param {{fetch?: typeof fetchRunAll, delayMs?: number}} [opts]
   */
  constructor(doc, win, opts = {}) {
    this.doc = doc;
    this.win = win;
    this.fetchFn = opts.fetch || fetchRunAll;
    this.delayMs = typeof opts.delayMs === 'number' ? opts.delayMs : 200;
    this.results = [];
    this.running = false;

    // Cached DOM refs — populated in init()
    this.el = {
      validatorList: null,
      runButton: null,
      statTotal: null,
      statPass: null,
      statWarn: null,
      statFail: null,
      logArea: null,
      statusBar: null,
    };
  }

  /** Wire DOM events and render the initial validator list. */
  init() {
    this.el.validatorList = this.doc.getElementById('validator-list');
    this.el.runButton = this.doc.getElementById('btn-run-all');
    this.el.statTotal = this.doc.getElementById('stat-total');
    this.el.statPass = this.doc.getElementById('stat-pass');
    this.el.statWarn = this.doc.getElementById('stat-warn');
    this.el.statFail = this.doc.getElementById('stat-fail');
    this.el.logArea = this.doc.getElementById('log-area');
    this.el.statusBar = this.doc.getElementById('status-bar');

    this.renderValidatorList();
    this.updateStats();
    this.appendLog('INFO', 'Dashboard initialised. Click "Run All Validators" to start.');

    if (this.el.runButton) {
      this.el.runButton.addEventListener('click', () => {
        this.runAll().catch((err) => this.handleError('runAll', err));
      });
    }
  }

  /** Render the validator rows into the page. */
  renderValidatorList() {
    if (!this.el.validatorList) return;
    this.el.validatorList.innerHTML = renderValidatorList(VALIDATOR_LIST);
  }

  /**
   * Append a single timestamped log line to the audit-log panel.
   * @param {string} level
   * @param {string} message
   */
  appendLog(level, message) {
    if (!this.el.logArea) return;
    const line = formatLogLine(level, message);
    const node = this.doc.createElement('div');
    node.className = `log-line log-${String(level).toLowerCase()}`;
    node.textContent = line;
    this.el.logArea.appendChild(node);
    // Auto-scroll to bottom
    this.el.logArea.scrollTop = this.el.logArea.scrollHeight;
  }

  /** Recompute stats from `this.results` and update the stat cards. */
  updateStats() {
    const stats = calculateStats(this.results);
    if (this.el.statTotal) this.el.statTotal.textContent = String(stats.total);
    if (this.el.statPass) this.el.statPass.textContent = String(stats.pass);
    if (this.el.statWarn) this.el.statWarn.textContent = String(stats.warn);
    if (this.el.statFail) this.el.statFail.textContent = String(stats.fail);
    return stats;
  }

  /**
   * Patch a single validator row's status badge.
   * @param {string} name
   * @param {string} status
   */
  setValidatorStatus(name, status) {
    if (!this.el.validatorList) return;
    const row = this.el.validatorList.querySelector(
      `li.validator-row[data-validator="${CSS.escape(name)}"]`,
    );
    if (!row) return;
    const badge = row.querySelector('.validator-status');
    if (badge) {
      badge.className = `validator-status status-${status}`;
      badge.textContent = status;
    }
  }

  /**
   * Run every validator sequentially, updating UI + stats after each one.
   * Calls the real `fetch('/api/run-all')` endpoint if available, otherwise
   * falls back to the in-memory mock runner.
   */
  async runAll() {
    if (this.running) {
      this.appendLog('WARN', 'Run already in progress — ignoring request.');
      return;
    }
    this.running = true;
    this.setButtonState(true);
    this.results = [];
    VALIDATOR_LIST.forEach((v) => this.setValidatorStatus(v.name, STATUS.PENDING));
    this.updateStats();
    this.appendLog('INFO', `Starting validation run for ${VALIDATOR_LIST.length} validators…`);

    let results;
    try {
      results = await this.callBackend();
    } catch (err) {
      this.appendLog('WARN', `Backend unreachable (${err?.message || err}); using local mock.`);
      results = await this.runMockSequential();
    }

    // Apply each result individually so the UI reflects progression.
    for (const r of results) {
      this.results.push(r);
      this.setValidatorStatus(r.validator, r.status);
      this.updateStats();
      this.appendLog(
        r.status === STATUS.FAIL ? 'FAIL' : r.status === STATUS.WARN ? 'WARN' : 'PASS',
        r.message,
      );
      await delay(this.delayMs);
    }

    const stats = this.updateStats();
    this.appendLog(
      stats.fail > 0 ? 'FAIL' : stats.warn > 0 ? 'WARN' : 'PASS',
      `Validation complete — total=${stats.total}, pass=${stats.pass}, warn=${stats.warn}, fail=${stats.fail}.`,
    );
    this.setButtonState(false);
    this.running = false;
  }

  /**
   * Try the real backend first. Resolves with parsed results array.
   * Throws on non-2xx or network failure so the caller can fall back.
   */
  async callBackend() {
    if (typeof this.win.fetch !== 'function') {
      throw new Error('window.fetch unavailable');
    }
    const res = await this.win.fetch('/api/run-all', { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data?.results)) {
      throw new Error('malformed /api/run-all payload');
    }
    return data.results;
  }

  /**
   * Sequential mock runner — emits one result at a time so the dashboard
   * updates incrementally rather than freezing until everything is done.
   */
  async runMockSequential() {
    const out = [];
    for (let i = 0; i < VALIDATOR_LIST.length; i += 1) {
      out.push(await runValidatorMock(VALIDATOR_LIST[i], i));
    }
    return out;
  }

  /** Toggle the run button between idle and running states. */
  setButtonState(isRunning) {
    if (!this.el.runButton) return;
    this.el.runButton.disabled = isRunning;
    this.el.runButton.textContent = isRunning ? 'Running…' : 'Run All Validators';
    if (this.el.statusBar) {
      this.el.statusBar.textContent = isRunning ? 'Running validation pipeline…' : 'Idle';
    }
  }

  /** Centralised error handler — surfaces the error in the log panel. */
  handleError(context, err) {
    const msg = err instanceof Error ? err.message : String(err);
    this.appendLog('ERROR', `[${context}] ${msg}`);
    this.setButtonState(false);
    this.running = false;
  }
}

/* -----------------------------------------------------------------------------
 * Browser bootstrap (only when a real DOM is present)
 * ---------------------------------------------------------------------------*/

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new Dashboard(document, window);
    dashboard.init();
    // Expose for debugging / E2E inspection.
    window.__dashboard = dashboard;
  });
}
