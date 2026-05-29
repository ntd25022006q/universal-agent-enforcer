import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceDir = path.resolve(__dirname, '..');

interface ConfigCheck {
  name: string;
  exists: boolean;
  valid: boolean;
  message: string;
}

function validateConfig(): void {
  console.log('[Config Validator] Validating project configuration files...');

  const checks: ConfigCheck[] = [];

  // 1. package.json validation
  const packageJsonPath = path.join(workspaceDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as Record<string, unknown>;
      const hasName = typeof pkg.name === 'string' && pkg.name.length > 0;
      const hasVersion = typeof pkg.version === 'string' && pkg.version.length > 0;
      const hasLicense = typeof pkg.license === 'string' && pkg.license.length > 0;
      const hasScripts = typeof pkg.scripts === 'object' && pkg.scripts !== null;
      checks.push({
        name: 'package.json',
        exists: true,
        valid: hasName && hasVersion && hasLicense && hasScripts,
        message:
          hasName && hasVersion && hasLicense && hasScripts
            ? 'Valid: name, version, license, scripts present'
            : 'Invalid: missing required fields (name, version, license, or scripts)',
      });
    } catch {
      checks.push({ name: 'package.json', exists: true, valid: false, message: 'Invalid JSON' });
    }
  } else {
    checks.push({ name: 'package.json', exists: false, valid: false, message: 'Missing' });
  }

  // 2. tsconfig.json validation
  const tsconfigPath = path.join(workspaceDir, 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    try {
      const content = fs.readFileSync(tsconfigPath, 'utf-8');
      // Remove comments for JSON parsing (simple approach)
      const cleaned = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      const tsconfig = JSON.parse(cleaned) as Record<string, unknown>;
      const hasStrict =
        typeof tsconfig.compilerOptions === 'object' &&
        tsconfig.compilerOptions !== null &&
        (tsconfig.compilerOptions as Record<string, unknown>).strict === true;
      checks.push({
        name: 'tsconfig.json',
        exists: true,
        valid: hasStrict,
        message: hasStrict
          ? 'Valid: strict mode enabled'
          : 'Warning: strict mode not enabled (recommended)',
      });
    } catch {
      checks.push({ name: 'tsconfig.json', exists: true, valid: false, message: 'Invalid JSON' });
    }
  } else {
    checks.push({ name: 'tsconfig.json', exists: false, valid: false, message: 'Missing' });
  }

  // 3. eslint.config.js validation
  const eslintPath = path.join(workspaceDir, 'eslint.config.js');
  if (fs.existsSync(eslintPath)) {
    checks.push({
      name: 'eslint.config.js',
      exists: true,
      valid: true,
      message: 'Valid: ESLint flat config present',
    });
  } else {
    checks.push({ name: 'eslint.config.js', exists: false, valid: false, message: 'Missing' });
  }

  // 4. .prettierrc validation
  const prettierPath = path.join(workspaceDir, '.prettierrc');
  if (fs.existsSync(prettierPath)) {
    try {
      JSON.parse(fs.readFileSync(prettierPath, 'utf-8'));
      checks.push({
        name: '.prettierrc',
        exists: true,
        valid: true,
        message: 'Valid: Prettier configuration present',
      });
    } catch {
      checks.push({ name: '.prettierrc', exists: true, valid: false, message: 'Invalid JSON' });
    }
  } else {
    checks.push({ name: '.prettierrc', exists: false, valid: false, message: 'Missing' });
  }

  // 5. .gitignore validation
  const gitignorePath = path.join(workspaceDir, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    const hasNodeModules = content.includes('node_modules');
    const hasEnv = content.includes('.env');
    checks.push({
      name: '.gitignore',
      exists: true,
      valid: hasNodeModules && hasEnv,
      message:
        hasNodeModules && hasEnv
          ? 'Valid: node_modules and .env excluded'
          : 'Warning: missing critical ignore patterns',
    });
  } else {
    checks.push({ name: '.gitignore', exists: false, valid: false, message: 'Missing' });
  }

  // 6. .env.example validation
  const envExamplePath = path.join(workspaceDir, '.env.example');
  if (fs.existsSync(envExamplePath)) {
    checks.push({
      name: '.env.example',
      exists: true,
      valid: true,
      message: 'Valid: Environment template present',
    });
  } else {
    checks.push({ name: '.env.example', exists: false, valid: false, message: 'Missing' });
  }

  // 7. CI workflow validation
  const ciPath = path.join(workspaceDir, '.github', 'workflows', 'ci.yml');
  if (fs.existsSync(ciPath)) {
    checks.push({
      name: '.github/workflows/ci.yml',
      exists: true,
      valid: true,
      message: 'Valid: CI workflow present',
    });
  } else {
    checks.push({
      name: '.github/workflows/ci.yml',
      exists: false,
      valid: false,
      message: 'Missing',
    });
  }

  // Print results
  let hasFailure = false;
  console.log(
    '\n┌──────────────────────────────┬─────────┬──────────────────────────────────────────┐',
  );
  console.log(
    '│ Configuration File           │ Status  │ Details                                  │',
  );
  console.log(
    '├──────────────────────────────┼─────────┼──────────────────────────────────────────┤',
  );

  for (const check of checks) {
    const status = !check.exists ? '❌ MISS' : check.valid ? '✅ OK  ' : '⚠️ WARN';
    if (!check.exists || !check.valid) hasFailure = true;
    const name = check.name.padEnd(28);
    const msg = check.message.padEnd(40);
    console.log(`│ ${name} │ ${status} │ ${msg} │`);
  }

  console.log(
    '└──────────────────────────────┴─────────┴──────────────────────────────────────────┘',
  );

  if (hasFailure) {
    console.error(
      '\n[Config Validator] Some configuration issues detected. Review the table above.',
    );
    process.exit(1);
  } else {
    console.log('\n[Config Validator] All configuration files are valid and complete.');
    process.exit(0);
  }
}

validateConfig();
