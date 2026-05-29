# Contributing to Universal Agent Enforcer

Thank you for your interest in contributing to Universal Agent Enforcer. This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites

- Node.js >= 20
- npm (comes with Node.js)
- Approximately 500 MB disk space for browser binaries

### Setup

1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/universal-agent-enforcer.git
   cd universal-agent-enforcer
   ```
3. Install dependencies:
   ```bash
   npm install
   npx playwright install chromium
   ```
4. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
5. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Making Changes

1. Write your code following the existing style and conventions.
2. TypeScript strict mode is mandatory -- no `any` types, proper interfaces and generics.
3. All new features must include corresponding tests.

### Running Checks

Before submitting a pull request, ensure all of the following pass:

```bash
# Lint check
npm run lint

# Format check
npm run format:check

# Unit tests
npx vitest run

# E2E tests
npx playwright test

# Import verification + secret scanning
npm run agent:fact-check

# Full quality gate
npm run quality-gate
```

### Code Style

- Use TypeScript strict mode for all script files.
- Use Prettier for formatting (configuration is in `.prettierrc`).
- Use ESLint for linting (configuration is in `eslint.config.js`).
- Follow the existing project structure and naming conventions.

### Commit Messages

Use clear, descriptive commit messages following conventional commit format:

- `feat: add new validation script`
- `fix: resolve false positive in fact checker`
- `docs: update script reference table`
- `chore: update dependencies`
- `refactor: simplify orchestrator loop logic`
- `test: add unit tests for build analyzer`

### Pull Request Process

1. Ensure all tests pass locally.
2. Update the README.md or documentation if your change affects the public interface.
3. Add entries to the relevant configuration files if needed (e.g., `package.json` scripts, `tsconfig.json`).
4. Submit a pull request with a clear description of the changes and motivation.

### Testing

- **Unit tests**: Write Vitest tests in `tests/*.test.js` for all new logic.
- **E2E tests**: Write Playwright tests in `tests/*.spec.js` for browser-facing functionality.
- The Test Runner includes infinite repair loop detection. If 3 consecutive test runs produce identical failures, the pipeline halts.

## Security Considerations

- **Never commit real API keys, tokens, or secrets.** Use environment variables via `.env`.
- The Fact Checker will detect and block hardcoded secrets.
- Report security vulnerabilities through the process described in [SECURITY.md](SECURITY.md).

## Questions

If you have questions about contributing, please open a GitHub issue with the label `question`.
