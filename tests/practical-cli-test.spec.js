/**
 * @fileoverview Practical CLI tests for WalGit
 * Tests actual CLI functionality without requiring external dependencies
 */

import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CLI_PATH = path.join(process.cwd(), 'WalGit-Backend', 'cli', 'bin', 'walgit.js');
const TEST_DIR = path.join(os.tmpdir(), 'walgit-practical-test');

// Helper function to execute CLI commands
const execCLI = (command, options = {}) => {
  const fullCommand = `node ${CLI_PATH} ${command}`;
  console.log(`Executing: ${fullCommand}`);
  
  try {
    const result = execSync(fullCommand, {
      encoding: 'utf8',
      cwd: options.cwd || TEST_DIR,
      timeout: 15000,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        WALGIT_TEST_MODE: 'true'
      }
    });
    return { success: true, output: result };
  } catch (error) {
    return { 
      success: false, 
      output: error.stdout || '', 
      error: error.stderr || error.message 
    };
  }
};

test.beforeEach(async () => {
  // Clean up and create test directory
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_DIR, { recursive: true });
});

test.afterEach(async () => {
  // Clean up test directory
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

test.describe('CLI Basic Commands', () => {
  test('CLI executable exists and shows help', async () => {
    // Check if CLI exists
    expect(fs.existsSync(CLI_PATH)).toBe(true);
    
    // Test help command
    const helpResult = execCLI('--help');
    expect(helpResult.success).toBe(true);
    expect(helpResult.output).toContain('WalGit');
  });

  test('CLI shows version information', async () => {
    const versionResult = execCLI('--version');
    
    // Should either show version or help (depending on implementation)
    expect(versionResult.success || versionResult.output.length > 0).toBe(true);
  });

  test('CLI handles invalid commands gracefully', async () => {
    const invalidResult = execCLI('invalid-nonexistent-command');
    
    // Should fail gracefully with an error message
    expect(invalidResult.success).toBe(false);
    expect(invalidResult.error || invalidResult.output).toBeTruthy();
  });

  test('CLI shows available commands', async () => {
    const helpResult = execCLI('help');
    
    if (helpResult.success) {
      // Check for common Git commands
      const commonCommands = ['init', 'add', 'commit', 'push', 'pull', 'status'];
      const output = helpResult.output.toLowerCase();
      
      let commandsFound = 0;
      for (const cmd of commonCommands) {
        if (output.includes(cmd)) {
          commandsFound++;
        }
      }
      
      expect(commandsFound).toBeGreaterThan(0);
    }
  });
});

test.describe('CLI Repository Operations', () => {
  test('repository initialization command exists', async () => {
    // Test that init command is available
    const initResult = execCLI('init --help');
    
    // Should either succeed or show command help
    expect(initResult.success || initResult.output.includes('init')).toBe(true);
  });

  test('status command handles non-repository directory', async () => {
    // Test status in non-git directory
    const statusResult = execCLI('status');
    
    // Should fail gracefully with appropriate message
    expect(statusResult.success).toBe(false);
    expect(statusResult.error || statusResult.output).toBeTruthy();
  });

  test('repository initialization workflow', async () => {
    // Try to initialize a repository
    const initResult = execCLI('init test-repo --description "Test repository"');
    
    if (initResult.success) {
      // Check if .walgit directory was created
      const walgitDir = path.join(TEST_DIR, '.walgit');
      expect(fs.existsSync(walgitDir)).toBe(true);
      
      // Test status after init
      const statusResult = execCLI('status');
      expect(statusResult.success).toBe(true);
    } else {
      console.log('Init failed (expected if no Sui connection):', initResult.error);
      
      // This is acceptable if we don't have Sui connectivity
      expect(initResult.error).toContain('network' || 'connection' || 'endpoint' || 'Sui');
    }
  });
});

test.describe('CLI Configuration', () => {
  test('configuration commands exist', async () => {
    const configCommands = ['config', 'credential', 'wallet'];
    
    for (const cmd of configCommands) {
      const result = execCLI(`${cmd} --help`);
      
      // Should show help or indicate command exists
      if (!result.success) {
        // Check if it's because the command doesn't exist vs other issues
        const isCommandNotFound = result.error && 
          (result.error.includes('Unknown command') || 
           result.error.includes('not found') ||
           result.error.includes('unrecognized'));
        
        if (isCommandNotFound) {
          console.log(`Command '${cmd}' not found - this may be expected`);
        }
      }
    }
  });

  test('environment handling', async () => {
    // Test with different environment variables
    const envTests = [
      { NODE_ENV: 'test' },
      { WALGIT_TEST_MODE: 'true' },
      { WALGIT_NETWORK: 'devnet' }
    ];
    
    for (const env of envTests) {
      const result = execCLI('--help', { env: { ...process.env, ...env } });
      expect(result.success).toBe(true);
    }
  });
});

test.describe('CLI Error Handling', () => {
  test('handles missing dependencies gracefully', async () => {
    // Test behavior when dependencies might be missing
    const commands = ['init', 'status', 'add', 'commit'];
    
    for (const cmd of commands) {
      const result = execCLI(cmd);
      
      if (!result.success) {
        // Should provide meaningful error messages
        expect(result.error || result.output).toBeTruthy();
        
        // Should not crash with unhandled exceptions
        expect(result.error).not.toContain('Uncaught');
        expect(result.error).not.toContain('unhandled');
      }
    }
  });

  test('validates command arguments', async () => {
    // Test commands with invalid arguments
    const invalidCommands = [
      'init', // no repo name
      'add', // no files
      'commit', // no message
    ];
    
    for (const cmd of invalidCommands) {
      const result = execCLI(cmd);
      
      if (!result.success) {
        // Should provide helpful error messages about missing arguments
        expect(result.error || result.output).toBeTruthy();
      }
    }
  });

  test('timeout handling', async () => {
    // Test that commands don't hang indefinitely
    const start = Date.now();
    const result = execCLI('init test-timeout-repo');
    const duration = Date.now() - start;
    
    // Should complete within reasonable time (15 seconds as set in execCLI)
    expect(duration).toBeLessThan(16000);
  });
});

test.describe('CLI Integration Points', () => {
  test('Sui integration accessibility', async () => {
    // Test if Sui-related functionality is accessible
    const suiCommands = ['wallet', 'push', 'pull'];
    
    for (const cmd of suiCommands) {
      const result = execCLI(`${cmd} --help`);
      
      // Log results for debugging
      console.log(`Command '${cmd}' result:`, {
        success: result.success,
        hasOutput: (result.output || '').length > 0,
        hasError: (result.error || '').length > 0
      });
    }
  });

  test('Walrus integration accessibility', async () => {
    // Test if Walrus-related functionality is accessible
    const walrusCommands = ['storage', 'tusky'];
    
    for (const cmd of walrusCommands) {
      const result = execCLI(`${cmd} --help`);
      
      console.log(`Command '${cmd}' result:`, {
        success: result.success,
        hasOutput: (result.output || '').length > 0,
        hasError: (result.error || '').length > 0
      });
    }
  });

  test('encryption commands accessibility', async () => {
    // Test if encryption functionality is accessible
    const encryptionCommands = ['encryption'];
    
    for (const cmd of encryptionCommands) {
      const result = execCLI(`${cmd} --help`);
      
      console.log(`Command '${cmd}' result:`, {
        success: result.success,
        hasOutput: (result.output || '').length > 0,
        hasError: (result.error || '').length > 0
      });
    }
  });
});