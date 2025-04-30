import { jest } from '@jest/globals';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Mock console.error to prevent error messages during tests
console.error = jest.fn();

// Find the CLI path
const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Try different possible paths for the CLI file
const possiblePaths = [
  path.join(__dirname, '../cli/bin/walgit.js'),
  path.join(process.cwd(), 'cli/bin/walgit.js'),
  path.join(process.cwd(), 'WalGit-Backend/cli/bin/walgit.js')
];

// Find the first path that exists
let cliPath = null;
for (const testPath of possiblePaths) {
  if (fs.existsSync(testPath)) {
    cliPath = testPath;
    break;
  }
}

if (!cliPath) {
  console.error(`Could not find walgit.js in any of the expected locations: ${possiblePaths.join(', ')}`);
  process.exit(1);
}

// Helper function to run CLI commands
const runCommand = async (args) => {
  try {
    // Add --mock flag to bypass actual blockchain operations
    const mockFlag = args.includes('--help') || args.includes('--version') ? '' : '--mock';
    const fullArgs = mockFlag ? `${args} ${mockFlag}` : args;
    
    const { stdout, stderr } = await execAsync(`node ${cliPath} ${fullArgs}`);
    return { stdout, stderr, code: 0 };
  } catch (error) {
    return { 
      stdout: error.stdout, 
      stderr: error.stderr, 
      code: error.code 
    };
  }
};

describe('WalGit CLI', () => {
  // Increase timeout for CLI commands
  jest.setTimeout(15000);
  
  // Create a temporary .walgit directory for testing if needed
  beforeAll(() => {
    const walgitDir = path.join(process.cwd(), '.walgit');
    if (!fs.existsSync(walgitDir)) {
      fs.mkdirSync(walgitDir, { recursive: true });
    }
  });
  
  test('should display help information', async () => {
    const result = await runCommand('--help');
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('Usage: walgit');
  });

  test('should display version information', async () => {
    const result = await runCommand('--version');
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('0.1.0');
  });

  // Test basic commands with --help flag
  const basicCommands = [
    'init --help',
    'status --help',
    'add --help',
    'commit --help'
  ];

  test.each(basicCommands)('should recognize command: %s', async (command) => {
    const result = await runCommand(command);
    expect(result.code).toBe(0);
    expect(result.stdout).not.toContain('Invalid command');
  });

  // Test that unknown commands are handled properly
  test('should handle unknown commands', async () => {
    const result = await runCommand('unknown-command');
    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain('Invalid command');
  });
});
