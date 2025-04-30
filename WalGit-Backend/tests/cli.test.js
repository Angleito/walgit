import { jest } from '@jest/globals';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.join(__dirname, '../cli/bin/walgit.js');

// Helper function to run CLI commands
const runCommand = async (args) => {
  try {
    const { stdout, stderr } = await execAsync(`node ${cliPath} ${args}`);
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
  jest.setTimeout(10000);
  
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

  // Test basic commands
  const basicCommands = [
    'init --help',
    'status --help',
    'add --help',
    'commit --help',
    'log --help',
    'branch --help',
    'checkout --help',
    'merge --help',
    'pull --help',
    'push --help',
    'remote --help',
    'tag --help',
    'reset --help',
    'revert --help',
    'repo list --help'
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
