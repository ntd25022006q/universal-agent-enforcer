# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue in Universal Agent Enforcer, please report it responsibly.

### How to Report

**Do not** report security vulnerabilities through public GitHub issues.

Instead, please report them via one of the following methods:

1. **GitHub Security Advisories** (preferred): Use the [Security Advisories](https://github.com/ntd25022006q/universal-agent-enforcer/security/advisories/new) feature to privately report a vulnerability.
2. **Email**: Send a detailed report to the repository maintainer.

### What to Include

Please include the following information in your report:

- **Description** of the vulnerability and its potential impact
- **Steps to reproduce** the issue, including any proof-of-concept code
- **Affected versions** of the project
- **Suggested fix** if you have one

### Response Timeline

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours.
- **Initial assessment**: We will provide an initial assessment within 5 business days.
- **Resolution**: We will work to resolve critical vulnerabilities as quickly as possible and keep you informed of progress.

### Responsible Disclosure Guidelines

- Allow a reasonable amount of time for the vulnerability to be addressed before public disclosure.
- Do not access or modify data that does not belong to you.
- Do not degrade the performance or availability of the service.
- Do not exploit the vulnerability beyond what is necessary to demonstrate the issue.

## Built-in Security Features

Universal Agent Enforcer includes several built-in security mechanisms:

- **Fact Checker** (`npm run agent:fact-check`): Scans source code for hardcoded API keys (OpenAI, GitHub, Google) and undeclared dependencies.
- **Backup Guard** (`npm run agent:backup`): Protects against unauthorized file deletion by maintaining snapshots.
- **Environment variable enforcement**: The `.env.example` template documents all required and optional configuration. Real secrets must never be committed to version control.
