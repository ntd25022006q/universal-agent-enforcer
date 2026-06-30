import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const pkg = JSON.parse(
  fs.readFileSync(path.resolve(repoRoot, 'package.json'), 'utf-8'),
);

/**
 * Real repository-structure tests.
 * These tests verify that the universal-agent-enforcer repo ships with the
 * expected enforcement scripts, source files, and configuration — replacing
 * the previous trivial tests that only compared string literals to themselves.
 */
describe('Repository Structure — Required Files', () => {
  const requiredFiles = [
    // Top-level docs & config
    'README.md',
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'vitest.config.js',
    'playwright.config.js',
    'eslint.config.js',
    '.gitignore',
    '.prettierrc',
    '.env.example',
    'LICENSE',
    'CONTRIBUTING.md',
    'CODE_OF_CONDUCT.md',
    'SECURITY.md',
    'mcp-config.json',
    // Agent enforcement scripts (the 14 validators)
    'scripts/orchestrator.ts',
    'scripts/fact-checker.ts',
    'scripts/backup-guard.ts',
    'scripts/devtools-monitor.ts',
    'scripts/visual-regression.ts',
    'scripts/network-monitor.ts',
    'scripts/test-runner.ts',
    'scripts/config-validator.ts',
    'scripts/quality-auditor.ts',
    'scripts/build-analyzer.ts',
    'scripts/stealth-browser.ts',
    'scripts/interactive-cli.ts',
    'scripts/build.ts',
    'scripts/server.ts',
    // Source / dashboard
    'src/app.js',
    'src/index.html',
    'src/style.css',
    // Tests
    'tests/setup.test.js',
    'tests/app.test.js',
  ];

  it.each(requiredFiles)('required file "%s" exists in repo', (file) => {
    const fullPath = path.resolve(repoRoot, file);
    expect(fs.existsSync(fullPath)).toBe(true);
  });

  it('repository has at least 14 enforcement scripts', () => {
    const scriptsDir = path.resolve(repoRoot, 'scripts');
    const tsFiles = fs.readdirSync(scriptsDir).filter((f) => f.endsWith('.ts'));
    expect(tsFiles.length).toBeGreaterThanOrEqual(14);
  });
});

describe('Package.json — Required Fields', () => {
  it('has correct project name', () => {
    expect(pkg.name).toBe('universal-agent-enforcer');
  });

  it('has semantic version string', () => {
    expect(typeof pkg.version).toBe('string');
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('has non-empty description', () => {
    expect(typeof pkg.description).toBe('string');
    expect(pkg.description.length).toBeGreaterThan(10);
  });

  it('declares MIT license', () => {
    expect(pkg.license).toBe('MIT');
  });

  it('declares main entry point', () => {
    expect(pkg.main).toBe('scripts/orchestrator.ts');
  });

  it('declares test script', () => {
    expect(pkg.scripts).toBeDefined();
    expect(pkg.scripts.test).toBeDefined();
    expect(pkg.scripts.test).toContain('vitest');
  });

  it('declares build script', () => {
    expect(pkg.scripts.build).toBeDefined();
    expect(pkg.scripts.build).toContain('build.ts');
  });

  it('declares orchestration script', () => {
    expect(pkg.scripts['agent:orchestrate']).toBeDefined();
    expect(pkg.scripts['agent:orchestrate']).toContain('orchestrator.ts');
  });

  it('declares puppeteer as a dependency', () => {
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    expect(deps).toHaveProperty('puppeteer');
  });

  it('declares playwright as a dependency', () => {
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    expect(deps).toHaveProperty('playwright');
  });

  it('declares vitest for unit tests', () => {
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    expect(deps).toHaveProperty('vitest');
  });
});

/**
 * Validator scripts each define a top-level function that the orchestrator
 * invokes. We verify each script declares the expected entry function by
 * reading its source — this catches accidental renames or deletions that
 * would silently break the enforcement pipeline.
 */
describe('Validator Scripts — Function Definitions', () => {
  const expectations = [
    { file: 'scripts/orchestrator.ts', fn: 'orchestrate' },
    { file: 'scripts/fact-checker.ts', fn: 'verifyImports' },
    { file: 'scripts/backup-guard.ts', fn: 'backup' },
    { file: 'scripts/devtools-monitor.ts', fn: 'monitorApp' },
    { file: 'scripts/visual-regression.ts', fn: 'verifyUILayout' },
    { file: 'scripts/network-monitor.ts', fn: 'verifyNetwork' },
    { file: 'scripts/test-runner.ts', fn: 'runTests' },
    { file: 'scripts/config-validator.ts', fn: 'validateConfig' },
    { file: 'scripts/quality-auditor.ts', fn: 'runAudit' },
    { file: 'scripts/build-analyzer.ts', fn: 'checkBuild' },
  ];

  it.each(expectations)(
    '$file defines function "$fn"',
    ({ file, fn }) => {
      const fullPath = path.resolve(repoRoot, file);
      expect(fs.existsSync(fullPath)).toBe(true);
      const src = fs.readFileSync(fullPath, 'utf-8');
      // Matches: "function name(", "async function name(", or "export async function name("
      expect(src).toMatch(new RegExp(`(export\\s+)?(async\\s+)?function\\s+${fn}\\s*\\(`));
    },
  );

  it('visual-regression.ts exports verifyUILayout', () => {
    const src = fs.readFileSync(
      path.resolve(repoRoot, 'scripts/visual-regression.ts'),
      'utf-8',
    );
    expect(src).toMatch(/export\s+async\s+function\s+verifyUILayout\s*\(/);
  });

  it('stealth-browser.ts exports getStealthBrowser', () => {
    const src = fs.readFileSync(
      path.resolve(repoRoot, 'scripts/stealth-browser.ts'),
      'utf-8',
    );
    expect(src).toMatch(/export\s+async\s+function\s+getStealthBrowser\s*\(/);
  });
});

describe('LICENSE file — content sanity', () => {
  it('LICENSE contains MIT text', () => {
    const src = fs.readFileSync(path.resolve(repoRoot, 'LICENSE'), 'utf-8');
    expect(src).toMatch(/MIT/);
    expect(src.toLowerCase()).toContain('permission is hereby granted');
  });
});

describe('README.md — content sanity', () => {
  it('README mentions the project name and key features', () => {
    const src = fs.readFileSync(path.resolve(repoRoot, 'README.md'), 'utf-8');
    expect(src).toContain('universal-agent-enforcer');
    // README should describe at least one enforcement capability
    const keywords = ['orchestrator', 'DevTools', 'backup', 'fact-check'];
    const hits = keywords.filter((k) => src.toLowerCase().includes(k.toLowerCase()));
    expect(hits.length).toBeGreaterThanOrEqual(2);
  });
});
