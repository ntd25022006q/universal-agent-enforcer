import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import module from 'module';

const builtinModules: readonly string[] =
  module.builtinModules ||
  (typeof (process as any).binding === 'function'
    ? Object.keys((process as any).binding('natives'))
    : []);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceDir = path.resolve(__dirname, '..');

// Read package.json dependency lists
const packageJsonPath = path.join(workspaceDir, 'package.json');

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

let packageJson: PackageJson = {};
if (fs.existsSync(packageJsonPath)) {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as PackageJson;
}

const declaredDeps = new Set<string>([
  ...Object.keys(packageJson.dependencies || {}),
  ...Object.keys(packageJson.devDependencies || {}),
  ...Object.keys(packageJson.peerDependencies || {}),
]);

function getJsAndTsFiles(dirPath: string): string[] {
  let filesList: string[] = [];
  if (!fs.existsSync(dirPath)) return filesList;

  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      if (
        file !== 'node_modules' &&
        file !== '.git' &&
        file !== '.agent_backups' &&
        file !== 'dist' &&
        file !== 'build'
      ) {
        filesList = filesList.concat(getJsAndTsFiles(filePath));
      }
    } else if (
      file.endsWith('.js') ||
      file.endsWith('.ts') ||
      file.endsWith('.jsx') ||
      file.endsWith('.tsx')
    ) {
      filesList.push(filePath);
    }
  }
  return filesList;
}

interface SecurityPattern {
  name: string;
  pattern: RegExp;
}

const securityPatterns: SecurityPattern[] = [
  { name: 'OpenAI API Key', pattern: /sk-[a-zA-Z0-9_-]{40,}/gi },
  { name: 'GitHub Personal Access Token', pattern: /gh[opr]_[a-zA-Z0-9]{36,}/gi },
  { name: 'Google API Key', pattern: /AIzaSy[a-zA-Z0-9_-]{33}/gi },
  {
    name: 'Generic Private Key / Connection String',
    pattern:
      /(private_key|client_secret|conn_string|password)\s*:\s*['"]([a-zA-Z0-9_.-]{24,})['"]/gi,
  },
];

function verifyImports(): void {
  console.log(
    '[Fact Checker] Scanning files to verify import declarations against package.json and node_modules...',
  );

  const files = getJsAndTsFiles(workspaceDir);
  let hasHallucination = false;

  // ESM Import Regex e.g. import { x } from 'pkg' or import * as z from 'pkg'
  const esmRegex = /import\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;
  // CommonJS require regex e.g. const a = require('pkg')
  const cjsRegex = /require\(\s*['"]([^'"]+)['"]\s*\)/g;

  // Strip single-line and multi-line comments to avoid false positives from example code in comments
  const stripComments = (src: string): string => {
    return src
      .replace(/\/\*[\s\S]*?\*\//g, '') // Multi-line comments
      .replace(/\/\/.*$/gm, ''); // Single-line comments
  };

  files.forEach((filePath: string) => {
    const relativeFilePath = path.relative(workspaceDir, filePath);
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const content = stripComments(rawContent);
    let match: RegExpExecArray | null;

    const verifyPackage = (importString: string): void => {
      // Ignore relative imports e.g. ./utils, ../components
      if (importString.startsWith('.') || importString.startsWith('/')) {
        return;
      }

      // Extract main package name from scoped packages or subpaths e.g. @types/node/fs or lodash/map
      let mainPkg: string;
      if (importString.startsWith('@')) {
        const parts = importString.split('/');
        mainPkg = parts.slice(0, 2).join('/');
      } else {
        mainPkg = importString.split('/')[0] ?? '';
      }

      // Check if it is a built-in Node module
      if (builtinModules.includes(mainPkg) || mainPkg.startsWith('node:')) {
        return;
      }

      // Check if it is declared in package.json
      if (!declaredDeps.has(mainPkg)) {
        console.error(`[Fact Checker] Hallucinated Dependency in "${relativeFilePath}":`);
        console.error(
          `   Package "${mainPkg}" (from "${importString}") is imported but not declared in package.json!`,
        );
        hasHallucination = true;
        return;
      }

      // Verify it actually exists in node_modules (if node_modules exists)
      const nodeModulesPath = path.join(workspaceDir, 'node_modules', mainPkg);
      const isInstalled = fs.existsSync(nodeModulesPath);

      // Verify if node_modules folder actually exists first
      const hasNodeModules = fs.existsSync(path.join(workspaceDir, 'node_modules'));
      if (hasNodeModules && !isInstalled) {
        console.error(`[Fact Checker] Missing Package in "${relativeFilePath}":`);
        console.error(
          `   Package "${mainPkg}" is declared in package.json but not installed in node_modules!`,
        );
        hasHallucination = true;
      }
    };

    // Reset regex indices
    esmRegex.lastIndex = 0;
    cjsRegex.lastIndex = 0;

    // Scan ES Modules imports
    while ((match = esmRegex.exec(content)) !== null) {
      if (match[1]) verifyPackage(match[1]);
    }

    // Scan CommonJS require imports
    while ((match = cjsRegex.exec(content)) !== null) {
      if (match[1]) verifyPackage(match[1]);
    }

    // --- SECURITY SCAN: Detect hardcoded Secrets & API Keys ---
    securityPatterns.forEach(({ name: keyName, pattern }: SecurityPattern) => {
      let secMatch: RegExpExecArray | null;
      pattern.lastIndex = 0;
      while ((secMatch = pattern.exec(content)) !== null) {
        const foundVal = secMatch[0];
        // Skip default placeholders in templates
        if (
          foundVal.includes('your_') ||
          foundVal.includes('placeholder_') ||
          foundVal.includes('example_') ||
          foundVal.includes('api_key_here')
        ) {
          continue;
        }

        // Report security vulnerability
        console.error(`\n[SECURITY ALERT] Hardcoded ${keyName} detected in "${relativeFilePath}":`);
        console.error(`   Found: "${foundVal.substring(0, 10)}..."`);
        console.error(
          `   SECURITY WARNING: Never hardcode secrets in code files. Use process.env variables.`,
        );
        hasHallucination = true; // Block verification loop
      }
    });
  });

  if (hasHallucination) {
    console.error('[Fact Checker] FAILED: AI Agent imported non-existent or undeclared libraries!');
    process.exit(1);
  } else {
    console.log(
      '[Fact Checker] All imports fact-checked successfully. No hallucinations detected.',
    );
    process.exit(0);
  }
}

verifyImports();
