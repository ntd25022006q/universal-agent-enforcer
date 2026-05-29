<div align="center">

# 🛡️ Universal Agent Enforcer

**Strict enforcement framework for AI Agents with quality testing gates, auto-backup, and self-healing DevTools**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-1-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3?logo=eslint&logoColor=white)](https://eslint.org/)

</div>

---

## ✨ Features

- **Quality Gates** — Strict multi-stage quality enforcement for AI agents
- **Auto-Backup** — Automatic code backup and restoration system
- **DevTools Monitor** — Self-healing DevTools integration for runtime monitoring
- **Stealth Browser** — Puppeteer stealth mode for web automation
- **Network Monitor** — Real-time network request monitoring and analysis
- **Visual Regression** — Automated visual regression testing
- **Fact Checker** — Automated fact-checking pipeline
- **Build Analyzer** — Build output analysis and optimization
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

| Script                     | Description                         |
| -------------------------- | ----------------------------------- |
| `npm run dev`              | Start development server            |
| `npm run build`            | Build the project                   |
| `npm run test`             | Run all tests (Vitest + Playwright) |
| `npm run lint`             | Check code with ESLint              |
| `npm run format:check`     | Verify Prettier formatting          |
| `npm run quality-gate`     | Run lint + format + fact-check      |
| `npm run agent:backup`     | Create automatic backup             |
| `npm run agent:restore`    | Restore from backup                 |
| `npm run agent:fact-check` | Run fact-checking pipeline          |
| `npm run agent:audit`      | Run quality audit                   |

## 📁 Project Structure

```
universal-agent-enforcer/
├── src/                # Frontend dashboard
│   ├── index.html      # Main HTML page
│   ├── app.js          # Application logic
│   └── style.css       # Styles
├── scripts/            # Agent enforcement scripts
│   ├── orchestrator.ts # Main orchestration
│   ├── backup-guard.ts # Auto-backup system
│   ├── fact-checker.ts # Fact verification
│   ├── build-analyzer.ts # Build analysis
│   ├── network-monitor.ts # Network monitoring
│   ├── quality-auditor.ts # Quality auditing
│   ├── server.ts       # Development server
│   └── test-runner.ts  # Test execution
├── tests/              # Test suites
└── playwright.config.js # Playwright configuration
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
