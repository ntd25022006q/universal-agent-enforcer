import { execSync, spawn, type ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceDir = path.resolve(__dirname, '..');

const MAX_LOOPS = parseInt(process.env.MAX_ORCHESTRATE_LOOPS || '5', 10);
const DEV_SERVER_PORT = process.env.DEV_SERVER_PORT || '3001';
const TARGET_URL = `http://localhost:${DEV_SERVER_PORT}`;

function runStep(name: string, command: string): boolean {
  console.log(`\n=============================================================================`);
  console.log(`🚀 [Orchestrator Step] Running: ${name}`);
  console.log(`=============================================================================`);
  try {
    execSync(command, { stdio: 'inherit', cwd: workspaceDir });
    console.log(`✅ Step [${name}] completed successfully.`);
    return true;
  } catch {
    console.error(`❌🚨 Step [${name}] FAILED!`);
    return false;
  }
}

async function orchestrate(): Promise<void> {
  console.log('[orchestrator] Starting validation pipeline...');
  console.log(`[orchestrator] Loop execution threshold set to: Max ${MAX_LOOPS} attempts.`);

  const provider = process.env.AGENT_LLM_PROVIDER || 'local';
  console.log(`[orchestrator] LLM provider: ${provider}`);

  console.log('\n[validate] Running lint checks...');

  let loopCount = 0;
  let success = false;
  let serverProcess: ChildProcess | null = null;

  const cleanupServer = (): void => {
    if (serverProcess) {
      console.log('\n[orchestrator] Force shutting down background dev server...');
      try {
        serverProcess.kill('SIGTERM');
      } catch {
        // Ignore errors when terminating server
      }
      serverProcess = null;
    }
  };

  process.on('exit', cleanupServer);
  process.on('SIGINT', () => {
    cleanupServer();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    cleanupServer();
    process.exit(0);
  });
  process.on('uncaughtException', (err: Error) => {
    console.error('Uncaught Exception in Orchestrator:', err);
    cleanupServer();
    process.exit(1);
  });

  while (loopCount < MAX_LOOPS && !success) {
    loopCount++;
    console.log(`\n[orchestrator] Iteration ${loopCount}/${MAX_LOOPS}...`);

    // Step 1: Network & Proxy Verification
    if (!runStep('Network & VPN Health Check', 'tsx scripts/network-monitor.ts')) {
      console.error('Network check failed. Halting to save API tokens.');
      break;
    }

    // Step 2: Auto-Backup Current State
    if (!runStep('Backup Protection Check', 'tsx scripts/backup-guard.ts')) {
      console.error('Backup system failure. Halting for file safety.');
      break;
    }

    // Step 3: Anti-Hallucination Fact Check
    if (!runStep('Anti-Hallucination Import Verification', 'tsx scripts/fact-checker.ts')) {
      console.error('Fact check failed. Hallucinated or undeclared packages found.');
      continue;
    }

    // Step 4: Run Tests (Unit/E2E check & Loop detection)
    if (!runStep('Test Suite Verification', 'tsx scripts/test-runner.ts')) {
      console.error('Test suite failed.');
      continue;
    }

    // Step 5: Build Check and Size Analysis
    if (!runStep('Bundle & Copy Build', 'npm run build')) {
      console.error('Build failed. Bundle files are corrupted or missing.');
      continue;
    }

    // --- Start Dev Server in Background for Live Verification ---
    console.log('\nSpawning local dev server in background...');
    serverProcess = spawn('tsx', ['scripts/server.ts'], {
      cwd: workspaceDir,
      stdio: 'pipe',
      env: { ...process.env, DEV_SERVER_PORT },
    });

    // Wait 1.5 seconds for dev server to bind to the configured port
    await new Promise((resolve) => setTimeout(resolve, 1500));

    let browserCheckSuccess = false;
    let visualCheckSuccess = false;

    try {
      // Step 6: Browser DevTools & UI Screenshot Inspection
      console.log('\nRunning live browser verification...');
      browserCheckSuccess = runStep(
        'Chrome DevTools CDP Logs & Interact',
        `tsx scripts/devtools-monitor.ts ${TARGET_URL}`,
      );

      if (browserCheckSuccess) {
        // Step 7: Screenshot Comparison Check
        visualCheckSuccess = runStep(
          'Screenshot Comparison Check',
          `tsx scripts/visual-regression.ts`,
        );
      }
    } finally {
      cleanupServer();
    }

    if (!browserCheckSuccess || !visualCheckSuccess) {
      console.error('Live browser checks failed. Iterating again...');
      continue;
    }

    console.log('[validate] All checks passed');
    success = true;
  }

  // Always generate quality audit report at the end of the loop
  runStep('Generate Quality Audit Report', 'tsx scripts/quality-auditor.ts');

  if (success) {
    console.log('\n=============================================================================');
    console.log('[success] All quality gates passed.');
    console.log('Orchestrator confirms zero errors and passing tests.');
    console.log('=============================================================================');
    process.exit(0);
  } else {
    console.error(
      '\n=============================================================================',
    );
    console.error(
      '[failure] Orchestrator loop exceeded max attempts without passing quality gates.',
    );
    console.error('Ensure all mock data is replaced and compile errors are resolved.');
    console.error('=============================================================================');
    process.exit(1);
  }
}

orchestrate();
