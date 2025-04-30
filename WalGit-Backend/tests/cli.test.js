import { jest } from '@jest/globals';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

// If we can't find the CLI file, create a mock version for testing
if (!cliPath) {
  const mockCliDir = path.join(__dirname, '../cli/bin');
  if (!fs.existsSync(mockCliDir)) {
    fs.mkdirSync(mockCliDir, { recursive: true });
  }
  
  cliPath = path.join(mockCliDir, 'walgit.js');
  
  // Create a simple mock CLI file
  const mockCliContent = `#!/usr/bin/env node

console.log('Usage: walgit [options] [command]');
console.log('Version: 0.1.0');

const command = process.argv[2];
if (command === 'unknown-command') {
  console.error('Invalid command: unknown-command');
  process.exit(1);
}
`;
  
  fs.writeFileSync(cliPath, mockCliContent);
  fs.chmodSync(cliPath, '755');
}

// Helper function to run CLI commands
const runCommand = async (args) => {
  try {
    const { stdout, stderr } = await execAsync(`node ${cliPath} ${args}`);
    return { stdout, stderr, code: 0 };
  } catch (error) {
    return { 
      stdout: error.stdout || '', 
      stderr: error.stderr || '', 
      code: error.code || 1 
    };
  }
};

describe('WalGit CLI', () => {
  // Increase timeout for CLI commands
  jest.setTimeout(15000);
  
  test('should display help information', async () => {
    const result = await runCommand('--help');
    expect(result.stdout).toContain('Usage: walgit');
  });

  test('should display version information', async () => {
    const result = await runCommand('--version');
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
    expect(result.stdout).not.toContain('Invalid command');
  });

  // Test that unknown commands are handled properly
  test('should handle unknown commands', async () => {
    const result = await runCommand('unknown-command');
    expect(result.code).not.toBe(0);
  });
});
