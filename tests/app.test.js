import { describe, it, expect } from 'vitest';
import {
  calculateStats,
  formatLogLine,
  formatTimestamp,
  levelTag,
  pad2,
  renderValidatorList,
  VALIDATOR_LIST,
  STATUS,
  runValidatorMock,
  fetchRunAll,
  delay,
} from '../src/app.js';

describe('calculateStats', () => {
  it('counts pass / warn / fail correctly', () => {
    const results = [
      { validator: 'a', status: 'pass' },
      { validator: 'b', status: 'pass' },
      { validator: 'c', status: 'warn' },
      { validator: 'd', status: 'fail' },
    ];
    expect(calculateStats(results)).toEqual({ total: 4, pass: 2, warn: 1, fail: 1 });
  });

  it('handles an empty array', () => {
    expect(calculateStats([])).toEqual({ total: 0, pass: 0, warn: 0, fail: 0 });
  });

  it('handles null / undefined gracefully', () => {
    expect(calculateStats(null)).toEqual({ total: 0, pass: 0, warn: 0, fail: 0 });
    expect(calculateStats(undefined)).toEqual({ total: 0, pass: 0, warn: 0, fail: 0 });
  });

  it('treats unknown statuses as total-only increments', () => {
    const results = [
      { validator: 'a', status: 'pass' },
      { validator: 'b', status: 'lol-dunno' },
      { validator: 'c', status: 'pending' },
    ];
    expect(calculateStats(results)).toEqual({ total: 3, pass: 1, warn: 0, fail: 0 });
  });

  it('ignores malformed entries', () => {
    const results = [
      null,
      { validator: 'a', status: 'pass' },
      undefined,
      { validator: 'b', status: 'fail' },
    ];
    expect(calculateStats(results)).toEqual({ total: 2, pass: 1, warn: 0, fail: 1 });
  });
});

describe('formatLogLine', () => {
  it('includes the message body', () => {
    expect(formatLogLine('INFO', 'test message')).toContain('test message');
  });

  it('includes an HH:MM:SS timestamp', () => {
    expect(formatLogLine('INFO', 'hello')).toMatch(/\b\d{2}:\d{2}:\d{2}\b/);
  });

  it('embeds a level tag', () => {
    expect(formatLogLine('INFO', 'x')).toContain('[INFO]');
    expect(formatLogLine('WARN', 'x')).toContain('[WARN]');
    expect(formatLogLine('ERROR', 'x')).toContain('[FAIL]');
    expect(formatLogLine('FAIL', 'x')).toContain('[FAIL]');
    expect(formatLogLine('PASS', 'x')).toContain('[PASS]');
    expect(formatLogLine('DEBUG', 'x')).toContain('[DBG ]');
  });

  it('formats the timestamp from the provided Date', () => {
    const d = new Date(2024, 0, 1, 9, 5, 7);
    const line = formatLogLine('INFO', 'msg', d);
    expect(line.startsWith('09:05:07 ')).toBe(true);
  });

  it('handles missing message gracefully', () => {
    const line = formatLogLine('INFO', null);
    expect(line).toMatch(/\b\d{2}:\d{2}:\d{2}\b/);
    expect(line).toContain('[INFO]');
  });
});

describe('formatTimestamp & pad2', () => {
  it('pad2 zero-pads single digits', () => {
    expect(pad2(0)).toBe('00');
    expect(pad2(7)).toBe('07');
    expect(pad2(12)).toBe('12');
    expect(pad2(99)).toBe('99');
  });

  it('pad2 rejects NaN / negative', () => {
    expect(pad2('not-a-number')).toBe('00');
    expect(pad2(-5)).toBe('00');
  });

  it('formatTimestamp builds HH:MM:SS', () => {
    const d = new Date(2024, 5, 15, 23, 59, 1);
    expect(formatTimestamp(d)).toBe('23:59:01');
  });
});

describe('levelTag', () => {
  it('defaults to INFO for unknown levels', () => {
    expect(levelTag('UNKNOWN')).toBe('[INFO]');
    expect(levelTag('')).toBe('[INFO]');
    expect(levelTag(null)).toBe('[INFO]');
  });
  it('normalises case', () => {
    expect(levelTag('warn')).toBe('[WARN]');
    expect(levelTag('Fail')).toBe('[FAIL]');
  });
});

describe('VALIDATOR_LIST', () => {
  it('has exactly 14 validators', () => {
    expect(VALIDATOR_LIST).toHaveLength(14);
  });

  it('each validator has a non-empty name and description', () => {
    VALIDATOR_LIST.forEach((v) => {
      expect(typeof v.name).toBe('string');
      expect(v.name.length).toBeGreaterThan(0);
      expect(typeof v.description).toBe('string');
      expect(v.description.length).toBeGreaterThan(10);
    });
  });

  it('validator names are unique', () => {
    const names = VALIDATOR_LIST.map((v) => v.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('is frozen (immutable)', () => {
    expect(Object.isFrozen(VALIDATOR_LIST)).toBe(true);
  });
});

describe('renderValidatorList', () => {
  it('returns a <ul> with one <li> per validator', () => {
    const html = renderValidatorList();
    expect(html.startsWith('<ul class="validator-list">')).toBe(true);
    expect(html).toContain('<li class="validator-row"');
    const liCount = (html.match(/<li class="validator-row"/g) || []).length;
    expect(liCount).toBe(14);
  });

  it('each row exposes name, description, and a pending status badge', () => {
    const html = renderValidatorList();
    expect(html).toContain('validator-name');
    expect(html).toContain('validator-desc');
    expect(html).toContain('status-pending');
  });

  it('escapes HTML in validator fields to prevent injection', () => {
    const html = renderValidatorList([{ name: '<script>', description: 'x & y' }]);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('x &amp; y');
  });

  it('returns empty string for non-array input', () => {
    expect(renderValidatorList(null)).toBe('');
    expect(renderValidatorList(undefined)).toBe('');
  });

  it('falls back to VALIDATOR_LIST when no argument is given', () => {
    const html = renderValidatorList();
    VALIDATOR_LIST.forEach((v) => {
      expect(html).toContain(v.name);
    });
  });
});

describe('runValidatorMock & fetchRunAll', () => {
  it('runValidatorMock returns one of the known statuses', async () => {
    const r = await runValidatorMock(VALIDATOR_LIST[0], 0);
    expect([STATUS.PASS, STATUS.WARN, STATUS.FAIL]).toContain(r.status);
    expect(typeof r.durationMs).toBe('number');
    expect(r.durationMs).toBeGreaterThanOrEqual(0);
    expect(r.validator).toBe(VALIDATOR_LIST[0].name);
  });

  it('fetchRunAll returns exactly 14 results', async () => {
    const results = await fetchRunAll();
    expect(results).toHaveLength(14);
    results.forEach((r, i) => {
      expect(r.validator).toBe(VALIDATOR_LIST[i].name);
    });
  });

  it('fetchRunAll produces the expected pass/warn/fail distribution', async () => {
    const results = await fetchRunAll();
    const stats = calculateStats(results);
    expect(stats.total).toBe(14);
    expect(stats.fail).toBe(1);
    expect(stats.warn).toBe(2);
    expect(stats.pass).toBe(11);
  });
});

describe('delay', () => {
  it('resolves after the requested milliseconds', async () => {
    const start = Date.now();
    await delay(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(40); // allow small timer slack
  });
});

describe('STATUS constant', () => {
  it('exposes the four expected statuses', () => {
    expect(STATUS.PENDING).toBe('pending');
    expect(STATUS.PASS).toBe('pass');
    expect(STATUS.WARN).toBe('warn');
    expect(STATUS.FAIL).toBe('fail');
  });
  it('is frozen', () => {
    expect(Object.isFrozen(STATUS)).toBe(true);
  });
});
