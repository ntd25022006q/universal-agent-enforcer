import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceDir = path.resolve(__dirname, '..');
const backupDir = path.join(workspaceDir, '.agent_backups', 'latest');

// Directories/files we MUST protect
const protectedPaths: string[] = ['src', 'config', 'package.json', 'tsconfig.json', '.cursorrules'];

function copyRecursiveSync(src: string, dest: string): void {
  const exists = fs.existsSync(src);
  const stats = exists ? fs.statSync(src) : null;
  const isDirectory = exists && stats !== null && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName: string) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function backup(): void {
  console.log('[Backup Guard] Creating snapshots of protected files...');
  protectedPaths.forEach((relPath: string) => {
    const fullPath = path.join(workspaceDir, relPath);
    const destPath = path.join(backupDir, relPath);

    if (fs.existsSync(fullPath)) {
      if (fs.existsSync(destPath)) {
        fs.rmSync(destPath, { recursive: true, force: true });
      }
      copyRecursiveSync(fullPath, destPath);
      console.log(`Backup created for: ${relPath}`);
    }
  });
  console.log('[Backup Guard] Snapshot backup completed.');
}

function restore(): void {
  console.log('[Backup Guard] Critical deletion or corruption detected! Initiating Rollback...');
  if (!fs.existsSync(backupDir)) {
    console.error('Error: No backup snapshot found to restore from!');
    process.exit(1);
  }

  protectedPaths.forEach((relPath: string) => {
    const fullPath = path.join(workspaceDir, relPath);
    const srcPath = path.join(backupDir, relPath);

    if (fs.existsSync(srcPath)) {
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
      copyRecursiveSync(srcPath, fullPath);
      console.log(`Restored: ${relPath}`);
    }
  });
  console.log('[Backup Guard] Rollback completed successfully.');
}

function autoCheck(): void {
  // If backup exists, verify that protected files are still in workspace
  if (!fs.existsSync(backupDir)) {
    // If no backup exists yet, create one
    backup();
    return;
  }

  let needsRestore = false;
  protectedPaths.forEach((relPath: string) => {
    const fullPath = path.join(workspaceDir, relPath);
    const srcPath = path.join(backupDir, relPath);

    if (fs.existsSync(srcPath) && !fs.existsSync(fullPath)) {
      console.warn(`[Backup Guard] Detected missing protected file/directory: ${relPath}`);
      needsRestore = true;
    }
  });

  if (needsRestore) {
    restore();
  } else {
    console.log('[Backup Guard] Integrity check passed. No files deleted.');
  }
}

const action = process.argv[2];
if (action === 'backup') {
  backup();
} else if (action === 'restore') {
  restore();
} else {
  autoCheck();
}
