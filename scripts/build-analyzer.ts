import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceDir = path.resolve(__dirname, '..');

// Standard build outputs for Vite, NextJS, Create React App, Nuxt, etc.
const possibleBuildDirs: string[] = ['dist', 'build', '.next', 'out', '.output'];

// Load environment threshold or default to 10 KB for this lightweight demo
const envLimit = process.env.MIN_BUNDLE_SIZE_KB ? parseInt(process.env.MIN_BUNDLE_SIZE_KB, 10) : 10;
const MIN_BUNDLE_SIZE_BYTES = envLimit * 1024;

function getDirectorySize(dirPath: string): number {
  let size = 0;
  if (!fs.existsSync(dirPath)) return 0;

  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      size += getDirectorySize(filePath);
    } else {
      size += stats.size;
    }
  }
  return size;
}

function checkBuild(): void {
  console.log('[Build Analyzer] Starting build inspection...');

  let foundDir: string | null = null;
  let totalSize = 0;

  for (const dirName of possibleBuildDirs) {
    const fullPath = path.join(workspaceDir, dirName);
    if (fs.existsSync(fullPath)) {
      foundDir = dirName;
      totalSize = getDirectorySize(fullPath);
      break;
    }
  }

  if (!foundDir) {
    console.error('[Build Analyzer] Error: No production build directory found!');
    console.error(`Please compile your app first. Looked in: ${possibleBuildDirs.join(', ')}`);
    process.exit(1);
  }

  console.log(`Found build directory: "${foundDir}"`);
  console.log(`Total bundle size: ${(totalSize / 1024).toFixed(2)} KB`);

  if (totalSize < MIN_BUNDLE_SIZE_BYTES) {
    console.error(
      `[Build Analyzer] REJECTED: Total bundle size is too low (${(totalSize / 1024).toFixed(2)} KB).`,
    );
    console.error(`Threshold is set to ${MIN_BUNDLE_SIZE_BYTES / 1024} KB.`);
    console.error(
      'This usually indicates the AI Agent wrote an empty layout or skeletal placeholder code rather than a functional implementation.',
    );
    process.exit(1);
  }

  // Scan build folder for suspicious mock code or raw placeholder strings
  const searchMockInFiles = (dirPath: string): void => {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        searchMockInFiles(filePath);
      } else if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.json')) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.includes('placeholder_api') || content.includes('mock_response_data')) {
          console.warn(
            `[Build Analyzer] Warning: Found potential mock string in build asset: ${file}`,
          );
        }
      }
    }
  };

  searchMockInFiles(path.join(workspaceDir, foundDir));

  console.log('[Build Analyzer] Quality Check Passed! Build meets standards.');
}

checkBuild();
