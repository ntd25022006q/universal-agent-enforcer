<div align="center">

# 🛡️ Universal Agent Enforcer

**Strict enforcement framework for AI Agents with quality testing gates, auto-backup, and self-healing DevTools**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-1-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3?logo=eslint&logoColor=white)](https://eslint.org/)
[![Prettier](https://img.shields.io/badge/Prettier-3-F7B93E?logo=prettier&logoColor=black)](https://prettier.io/)
[![Puppeteer](https://img.shields.io/badge/Puppeteer-22-40B5A4?logo=puppeteer&logoColor=white)](https://pptr.dev/)

</div>

---

## ✨ Features

- **Quality Gates** — Strict multi-stage quality enforcement for AI agents
- **Auto-Backup** — Automatic code backup and restoration system
- **DevTools Monitor** — Self-healing DevTools integration for runtime monitoring
- **Stealth Browser** — Puppeteer stealth mode with CloakBrowser CDP support
- **Network Monitor** — Real-time network request monitoring and analysis
- **Visual Regression** — Automated visual regression testing via screenshot comparison
- **Fact Checker** — Automated fact-checking pipeline with secret scanning
- **Build Analyzer** — Build output analysis and optimization
- **Config Validator** — Project configuration integrity verification
- **Test Runner** — Test execution with infinite loop detection
- **Interactive CLI** — Human-in-the-loop prompt system for approvals
- **Orchestrator** — Unified orchestration of all enforcement tools

## 🛠️ Tech Stack

| Category   | Technology                 |
| ---------- | -------------------------- |
| Language   | TypeScript 5, JavaScript   |
| Testing    | Vitest, Playwright         |
| Browser    | Puppeteer + Stealth Plugin |
| Linting    | ESLint 9                   |
| Formatting | Prettier 3                 |
| Runtime    | Node.js 20+                |

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm 10+

### Installation

```bash
# Clone the repository
git clone https://github.com/ntd25022006q/universal-agent-enforcer.git
cd universal-agent-enforcer

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

| Script                          | Description                                 |
| ------------------------------- | ------------------------------------------- |
| `npm run dev`                   | Start development server                    |
| `npm run build`                 | Build the project                           |
| `npm run test`                  | Run all tests (Vitest + Playwright)         |
| `npm run lint`                  | Check code with ESLint                      |
| `npm run format`                | Format code with Prettier                   |
| `npm run format:check`          | Verify Prettier formatting                  |
| `npm run quality-gate`          | Run lint + format + fact-check              |
| `npm run agent:backup`          | Create automatic backup                     |
| `npm run agent:restore`         | Restore from backup                         |
| `npm run agent:check-network`   | Verify network and proxy connectivity       |
| `npm run agent:fact-check`      | Run fact-checking and secret scanning       |
| `npm run agent:analyze-build`   | Analyze build output size and quality       |
| `npm run agent:browser`         | Launch stealth browser for web automation   |
| `npm run agent:devtools`        | Monitor app via Chrome DevTools CDP         |
| `npm run agent:test-run`        | Execute tests with loop detection           |
| `npm run agent:visual`          | Run visual regression screenshot comparison |
| `npm run agent:orchestrate`     | Run full orchestration pipeline             |
| `npm run agent:audit`           | Generate comprehensive quality audit report |
| `npm run agent:cli`             | Interactive CLI for human-in-the-loop input |
| `npm run agent:validate-config` | Validate project configuration files        |

## 📁 Project Structure

```
universal-agent-enforcer/
├── src/                       # Frontend dashboard
│   ├── index.html             # Main HTML page
│   ├── app.js                 # Application logic
│   └── style.css              # Styles
├── scripts/                   # Agent enforcement scripts (14 validators)
│   ├── orchestrator.ts        # Main orchestration pipeline
│   ├── backup-guard.ts        # Auto-backup and restore system
│   ├── fact-checker.ts        # Import verification and secret scanning
│   ├── build-analyzer.ts      # Build output analysis
│   ├── build.ts               # Build bundler (copy to dist)
│   ├── network-monitor.ts     # Network and proxy health checks
│   ├── quality-auditor.ts     # Comprehensive quality audit reports
│   ├── server.ts              # Development HTTP server
│   ├── test-runner.ts         # Test execution with loop detection
│   ├── stealth-browser.ts     # Puppeteer stealth browser launcher
│   ├── devtools-monitor.ts    # Chrome DevTools CDP monitoring
│   ├── visual-regression.ts   # Screenshot comparison testing
│   ├── interactive-cli.ts     # Human-in-the-loop CLI prompts
│   └── config-validator.ts    # Project configuration validation
├── tests/                     # Test suites
│   ├── setup.test.js          # Vitest unit tests
│   ├── app.test.js            # Weight calculation tests
│   └── app.spec.js            # Playwright E2E tests
├── .github/                   # GitHub configuration
│   ├── workflows/ci.yml       # CI pipeline
│   └── dependabot.yml         # Dependency updates
├── eslint.config.js           # ESLint flat config
├── playwright.config.js       # Playwright configuration
├── vitest.config.js           # Vitest configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Project manifest
```

## 🧪 Testing

```bash
# Run unit tests
npx vitest run

# Run E2E tests
npx playwright test

# Run all tests
npm run test
```

## 📄 License

MIT -- Copyright (c) 2026 Nguyen Tien Dat. All rights reserved.
