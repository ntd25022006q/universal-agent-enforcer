import readline from 'readline';

/**
 * Prompts the user for input in the terminal.
 * Blocks execution until the user responds, preventing mock data generation.
 * @param question - The prompt question to display.
 * @returns The user's response.
 */
export function askUser(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(`\n❓ [Human-in-the-Loop] ${question}\n> `, (answer: string) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Prompts the user to verify and approve a specific file edit or design proposal.
 * @param proposalText - Summary of the proposed change.
 * @returns True if approved, False otherwise.
 */
export async function askApproval(proposalText: string): Promise<boolean> {
  console.log('\n--- 🔍 AI AGENT PROPOSAL FOR REVIEW ---');
  console.log(proposalText);
  console.log('----------------------------------------');

  const response = await askUser('Do you approve this proposal? (yes/no/y/n)');
  return response.toLowerCase() === 'yes' || response.toLowerCase() === 'y';
}

// Self-test execution if run directly
if (process.argv[1] && process.argv[1].endsWith('interactive-cli.ts')) {
  (async () => {
    const name = await askUser('Please enter your name to verify CLI interactivity:');
    console.log(`Hello, ${name}! Interactive CLI is working perfectly.`);
  })();
}
