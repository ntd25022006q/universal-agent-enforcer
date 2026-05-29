import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceDir = path.resolve(__dirname, '..');
const logsDir = path.join(workspaceDir, '.agent_logs');
const stateFilePath = path.join(logsDir, 'execution_state.json');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

interface ExecutionState {
  lastError: string;
  consecutiveFailures: number;
}

// Read execution history to detect loops
function readState(): ExecutionState {
  if (fs.existsSync(stateFilePath)) {
    try {
      return JSON.parse(fs.readFileSync(stateFilePath, 'utf-8')) as ExecutionState;
    } catch {
      return { lastError: '', consecutiveFailures: 0 };
    }
  }
  return { lastError: '', consecutiveFailures: 0 };
}

function saveState(state: ExecutionState): void {
  fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf-8');
}

function runTests(): void {
  console.log('[Test Runner] Starting testing cycle...');

  const state = readState();
  let currentError = '';
  let testSuccess = true;

  try {
    console.log('Running Unit & Integration Tests...');
    execSync('npm run test', { stdio: 'inherit', cwd: workspaceDir });
  } catch (err: unknown) {
    testSuccess = false;
    currentError = err instanceof Error ? err.message : 'Unit tests failed';
  }

  if (!testSuccess) {
    console.error('[Test Runner] Test suite execution failed!');

    // Check if we are stuck in an infinite loop
    if (state.lastError === currentError) {
      state.consecutiveFailures += 1;
    } else {
      state.lastError = currentError;
      state.consecutiveFailures = 1;
    }

    console.warn(`[Test Runner] Consecutive failed run count: ${state.consecutiveFailures}/3`);
    saveState(state);

    if (state.consecutiveFailures >= 3) {
      console.error(
        '[Test Runner] Infinite Loop Detected: AI Agent is stuck in a loop resolving the same bug!',
      );
      console.error(
        'Aborting run. Please review instructions, mock data policy, or check your code structure.',
      );

      // Reset counter on crash to allow user manual retry
      saveState({ lastError: '', consecutiveFailures: 0 });
      process.exit(1);
    }

    process.exit(1);
  } else {
    console.log('[Test Runner] All tests passed! Resetting loop detector.');
    saveState({ lastError: '', consecutiveFailures: 0 });
    process.exit(0);
  }
}

runTests();
