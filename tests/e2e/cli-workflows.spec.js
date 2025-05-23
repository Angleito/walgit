/**
 * @fileoverview Comprehensive E2E tests for WalGit CLI workflows
 * Tests complete user journeys from initialization to collaboration
 */

import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Test configuration
const TEST_TIMEOUT = 120000; // 2 minutes per test
const CLI_PATH = path.join(process.cwd(), 'walgit-backend', 'cli', 'bin', 'walgit.js');
const TEST_REPO_DIR = path.join(os.tmpdir(), 'walgit-e2e-test');

// Helper function to execute CLI commands
const execCLI = (command, options = {}) => {
  const fullCommand = `node ${CLI_PATH} ${command}`;
  console.log(`Executing: ${fullCommand}`);
  
  try {
    const result = execSync(fullCommand, {
      encoding: 'utf8',
      cwd: options.cwd || TEST_REPO_DIR,
      timeout: 30000,
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

// Setup test environment
test.beforeEach(async () => {
  // Clean up previous test directory
  if (fs.existsSync(TEST_REPO_DIR)) {
    fs.rmSync(TEST_REPO_DIR, { recursive: true, force: true });
  }
  
  // Create fresh test directory
  fs.mkdirSync(TEST_REPO_DIR, { recursive: true });
  
  // Create test files
  fs.writeFileSync(path.join(TEST_REPO_DIR, 'README.md'), '# Test Repository\n\nThis is a test repository for E2E testing.');
  fs.writeFileSync(path.join(TEST_REPO_DIR, 'package.json'), JSON.stringify({
    name: 'test-repo',
    version: '1.0.0',
    description: 'Test repository for WalGit E2E tests'
  }, null, 2));
  
  // Create src directory with files
  fs.mkdirSync(path.join(TEST_REPO_DIR, 'src'), { recursive: true });
  fs.writeFileSync(path.join(TEST_REPO_DIR, 'src', 'main.js'), 'console.log("Hello, WalGit!");');
  fs.writeFileSync(path.join(TEST_REPO_DIR, 'src', 'utils.js'), 'export const add = (a, b) => a + b;');
});

test.afterEach(async () => {
  // Clean up test directory
  if (fs.existsSync(TEST_REPO_DIR)) {
    fs.rmSync(TEST_REPO_DIR, { recursive: true, force: true });
  }
});

test.describe('CLI Basic Workflow', () => {
  test('complete repository lifecycle: init → add → commit → push', async () => {
    test.setTimeout(TEST_TIMEOUT);

    // Step 1: Initialize repository
    const initResult = execCLI('init test-repo --description "E2E test repository"');
    expect(initResult.success).toBe(true);
    expect(initResult.output).toContain('Repository initialized');

    // Verify .walgit directory was created
    expect(fs.existsSync(path.join(TEST_REPO_DIR, '.walgit'))).toBe(true);

    // Step 2: Check status
    const statusResult = execCLI('status');
    expect(statusResult.success).toBe(true);
    expect(statusResult.output).toContain('Untracked files');

    // Step 3: Add files
    const addResult = execCLI('add .');
    expect(addResult.success).toBe(true);
    expect(addResult.output).toContain('Files staged');

    // Step 4: Check status after add
    const statusAfterAdd = execCLI('status');
    expect(statusAfterAdd.success).toBe(true);
    expect(statusAfterAdd.output).toContain('Changes to be committed');

    // Step 5: Commit files
    const commitResult = execCLI('commit -m "Initial commit with E2E test files"');
    expect(commitResult.success).toBe(true);
    expect(commitResult.output).toContain('Commit created');

    // Step 6: Check log
    const logResult = execCLI('log');
    expect(logResult.success).toBe(true);
    expect(logResult.output).toContain('Initial commit with E2E test files');

    // Step 7: Push to remote
    const pushResult = execCLI('push');
    expect(pushResult.success).toBe(true);
    expect(pushResult.output).toContain('Push completed');
  });

  test('repository initialization with encryption', async () => {
    test.setTimeout(TEST_TIMEOUT);

    // Initialize with encryption
    const initResult = execCLI('init encrypted-repo --encryption --description "Encrypted test repository"');
    expect(initResult.success).toBe(true);
    expect(initResult.output).toContain('Repository initialized');
    expect(initResult.output).toContain('encryption enabled');

    // Verify encryption configuration
    const configPath = path.join(TEST_REPO_DIR, '.walgit', 'config.json');
    expect(fs.existsSync(configPath)).toBe(true);
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    expect(config.encryption).toBe(true);
    expect(config.sealPolicyId).toBeDefined();
  });

  test('error handling for invalid commands', async () => {
    // Test command without initialization
    const statusResult = execCLI('status');
    expect(statusResult.success).toBe(false);
    expect(statusResult.error).toContain('not a WalGit repository');

    // Test invalid command
    const invalidResult = execCLI('invalid-command');
    expect(invalidResult.success).toBe(false);
    expect(invalidResult.error).toContain('Unknown command');
  });
});

test.describe('CLI Collaboration Workflow', () => {
  test('owner workflow: create repo → add collaborator → share access', async () => {
    test.setTimeout(TEST_TIMEOUT);

    // Initialize repository as owner
    const initResult = execCLI('init collab-repo --description "Collaboration test repository"');
    expect(initResult.success).toBe(true);

    // Add and commit initial files
    execCLI('add .');
    execCLI('commit -m "Initial commit by owner"');
    execCLI('push');

    // Add collaborator with writer permissions
    const addCollabResult = execCLI('repo add-collaborator 0x987654321fedcba writer');
    expect(addCollabResult.success).toBe(true);
    expect(addCollabResult.output).toContain('Collaborator added');

    // List collaborators
    const listCollabResult = execCLI('repo list-collaborators');
    expect(listCollabResult.success).toBe(true);
    expect(listCollabResult.output).toContain('0x987654321fedcba');
    expect(listCollabResult.output).toContain('writer');

    // Share encryption access (if encrypted)
    const shareResult = execCLI('encryption share 0x987654321fedcba');
    expect(shareResult.success).toBe(true);
    expect(shareResult.output).toContain('Access shared');
  });

  test('collaborator workflow: clone → modify → commit → push', async () => {
    test.setTimeout(TEST_TIMEOUT);

    // Setup: Create repository as owner (simulated)
    execCLI('init original-repo --description "Original repository"');
    execCLI('add .');
    execCLI('commit -m "Initial commit"');
    const pushResult = execCLI('push');
    
    // Get repository object ID from push result
    const repoMatch = pushResult.output.match(/Repository ID: (0x[a-fA-F0-9]+)/);
    const repoId = repoMatch ? repoMatch[1] : '0xabcdef123456789';

    // Create separate directory for collaborator
    const collabDir = path.join(os.tmpdir(), 'walgit-e2e-collaborator');
    if (fs.existsSync(collabDir)) {
      fs.rmSync(collabDir, { recursive: true, force: true });
    }
    fs.mkdirSync(collabDir, { recursive: true });

    // Clone repository as collaborator
    const cloneResult = execCLI(`clone ${repoId}`, { cwd: collabDir });
    expect(cloneResult.success).toBe(true);
    expect(cloneResult.output).toContain('Repository cloned');

    // Navigate to cloned repository
    const clonedRepoDir = path.join(collabDir, 'original-repo');
    
    // Modify files
    fs.writeFileSync(path.join(clonedRepoDir, 'COLLABORATOR.md'), '# Collaborator Changes\n\nChanges made by collaborator.');
    fs.writeFileSync(path.join(clonedRepoDir, 'src', 'feature.js'), 'export const newFeature = () => "Hello from collaborator";');

    // Add, commit, and push changes
    const addResult = execCLI('add .', { cwd: clonedRepoDir });
    expect(addResult.success).toBe(true);

    const commitResult = execCLI('commit -m "Add collaborator features"', { cwd: clonedRepoDir });
    expect(commitResult.success).toBe(true);

    const pushCollabResult = execCLI('push', { cwd: clonedRepoDir });
    expect(pushCollabResult.success).toBe(true);

    // Clean up collaborator directory
    fs.rmSync(collabDir, { recursive: true, force: true });
  });

  test('access control: test reader vs writer permissions', async () => {
    test.setTimeout(TEST_TIMEOUT);

    // Initialize repository
    execCLI('init access-control-repo --description "Access control test"');
    execCLI('add .');
    execCLI('commit -m "Initial commit"');
    execCLI('push');

    // Add reader collaborator
    const addReaderResult = execCLI('repo add-collaborator 0xreader123456789 reader');
    expect(addReaderResult.success).toBe(true);

    // Add writer collaborator
    const addWriterResult = execCLI('repo add-collaborator 0xwriter987654321 writer');
    expect(addWriterResult.success).toBe(true);

    // Test reader permissions (should be able to read but not write)
    const readerStatusResult = execCLI('status --as 0xreader123456789');
    expect(readerStatusResult.success).toBe(true);

    // Test writer permissions (should be able to read and write)
    const writerStatusResult = execCLI('status --as 0xwriter987654321');
    expect(writerStatusResult.success).toBe(true);

    // Attempt to commit as reader (should fail)
    fs.writeFileSync(path.join(TEST_REPO_DIR, 'reader-attempt.md'), 'Unauthorized change');
    execCLI('add reader-attempt.md');
    const readerCommitResult = execCLI('commit -m "Unauthorized commit" --as 0xreader123456789');
    expect(readerCommitResult.success).toBe(false);
    expect(readerCommitResult.error).toContain('Permission denied');
  });
});

test.describe('CLI Encryption Workflow', () => {
  test('encryption lifecycle: enable → encrypt data → rotate keys → decrypt', async () => {
    test.setTimeout(TEST_TIMEOUT);

    // Initialize repository with encryption
    const initResult = execCLI('init secure-repo --encryption --description "Secure repository"');
    expect(initResult.success).toBe(true);

    // Check encryption status
    const encStatusResult = execCLI('encryption status');
    expect(encStatusResult.success).toBe(true);
    expect(encStatusResult.output).toContain('Encryption: enabled');

    // Add and commit files (should be encrypted)
    execCLI('add .');
    const commitResult = execCLI('commit -m "Encrypted commit"');
    expect(commitResult.success).toBe(true);
    expect(commitResult.output).toContain('Encrypted');

    // Rotate encryption keys
    const rotateResult = execCLI('encryption rotate-keys');
    expect(rotateResult.success).toBe(true);
    expect(rotateResult.output).toContain('Keys rotated');

    // Verify key rotation
    const statusAfterRotation = execCLI('encryption status');
    expect(statusAfterRotation.success).toBe(true);
    expect(statusAfterRotation.output).toContain('Last rotation');

    // Test decryption access
    const decryptResult = execCLI('encryption list-access');
    expect(decryptResult.success).toBe(true);
    expect(decryptResult.output).toContain('Access list');
  });

  test('collaborative encryption: share → revoke → re-share access', async () => {
    test.setTimeout(TEST_TIMEOUT);

    // Setup encrypted repository
    execCLI('init shared-secure-repo --encryption --description "Shared secure repository"');
    execCLI('add .');
    execCLI('commit -m "Initial encrypted commit"');

    // Share access with collaborator
    const shareResult = execCLI('encryption share 0xcollaborator123456');
    expect(shareResult.success).toBe(true);
    expect(shareResult.output).toContain('Access shared');

    // Verify collaborator has access
    const listAccessResult = execCLI('encryption list-access');
    expect(listAccessResult.success).toBe(true);
    expect(listAccessResult.output).toContain('0xcollaborator123456');

    // Revoke access
    const revokeResult = execCLI('encryption revoke 0xcollaborator123456');
    expect(revokeResult.success).toBe(true);
    expect(revokeResult.output).toContain('Access revoked');

    // Verify access revoked
    const listAfterRevoke = execCLI('encryption list-access');
    expect(listAfterRevoke.success).toBe(true);
    expect(listAfterRevoke.output).not.toContain('0xcollaborator123456');

    // Re-share access
    const reshareResult = execCLI('encryption share 0xcollaborator123456');
    expect(reshareResult.success).toBe(true);
    expect(reshareResult.output).toContain('Access shared');
  });
});

test.describe('CLI Error Recovery and Edge Cases', () => {
  test('network failure recovery with retries', async () => {
    test.setTimeout(TEST_TIMEOUT);

    // Initialize repository
    execCLI('init network-test-repo --description "Network failure test"');
    execCLI('add .');
    execCLI('commit -m "Test commit"');

    // Simulate network issues during push
    const pushWithRetries = execCLI('push --retries 3 --network-simulation failure');
    // Should eventually succeed with retries
    expect(pushWithRetries.success).toBe(true);
    expect(pushWithRetries.output).toContain('Push completed');
  });

  test('large file handling and chunked uploads', async () => {
    test.setTimeout(TEST_TIMEOUT * 2); // Extended timeout for large files

    // Create large test file (simulated)
    const largeFileContent = 'x'.repeat(5 * 1024 * 1024); // 5MB
    fs.writeFileSync(path.join(TEST_REPO_DIR, 'large-file.bin'), largeFileContent);

    execCLI('init large-file-repo --description "Large file test"');
    
    const addLargeResult = execCLI('add large-file.bin');
    expect(addLargeResult.success).toBe(true);
    expect(addLargeResult.output).toContain('Large file detected');
    expect(addLargeResult.output).toContain('chunked upload');

    const commitLargeResult = execCLI('commit -m "Add large file"');
    expect(commitLargeResult.success).toBe(true);

    const pushLargeResult = execCLI('push');
    expect(pushLargeResult.success).toBe(true);
    expect(pushLargeResult.output).toContain('Upload completed');
  });

  test('corruption detection and integrity verification', async () => {
    test.setTimeout(TEST_TIMEOUT);

    execCLI('init integrity-test-repo --description "Integrity test"');
    execCLI('add .');
    execCLI('commit -m "Initial commit"');
    execCLI('push');

    // Verify repository integrity
    const verifyResult = execCLI('repo verify-integrity');
    expect(verifyResult.success).toBe(true);
    expect(verifyResult.output).toContain('Integrity check passed');

    // Simulate corruption by modifying .walgit files
    const configPath = path.join(TEST_REPO_DIR, '.walgit', 'HEAD');
    if (fs.existsSync(configPath)) {
      fs.writeFileSync(configPath, 'corrupted-content');
    }

    // Verify should detect corruption
    const verifyCorruptedResult = execCLI('repo verify-integrity');
    expect(verifyCorruptedResult.success).toBe(false);
    expect(verifyCorruptedResult.error).toContain('corruption detected');
  });

  test('concurrent operations and conflict resolution', async () => {
    test.setTimeout(TEST_TIMEOUT);

    execCLI('init concurrent-test-repo --description "Concurrent operations test"');
    execCLI('add .');
    execCLI('commit -m "Initial commit"');

    // Simulate concurrent file modifications
    fs.writeFileSync(path.join(TEST_REPO_DIR, 'concurrent.md'), 'Version 1');
    execCLI('add concurrent.md');
    execCLI('commit -m "Commit 1"');

    // Simulate another modification
    fs.writeFileSync(path.join(TEST_REPO_DIR, 'concurrent.md'), 'Version 2 - Modified');
    execCLI('add concurrent.md');
    const secondCommit = execCLI('commit -m "Commit 2"');
    expect(secondCommit.success).toBe(true);

    // Push should handle the concurrent changes
    const pushResult = execCLI('push');
    expect(pushResult.success).toBe(true);
  });
});

test.describe('CLI Storage Management', () => {
  test('storage quota management and optimization', async () => {
    test.setTimeout(TEST_TIMEOUT);

    execCLI('init storage-test-repo --description "Storage management test"');
    
    // Check initial storage status
    const storageStatusResult = execCLI('storage status');
    expect(storageStatusResult.success).toBe(true);
    expect(storageStatusResult.output).toContain('Storage quota');

    // Purchase additional storage
    const purchaseResult = execCLI('storage purchase 100MB');
    expect(purchaseResult.success).toBe(true);
    expect(purchaseResult.output).toContain('Storage purchased');

    // Add files and monitor storage consumption
    execCLI('add .');
    execCLI('commit -m "Storage test commit"');
    
    const statusAfterCommit = execCLI('storage status');
    expect(statusAfterCommit.success).toBe(true);
    expect(statusAfterCommit.output).toContain('Storage used');

    // Test storage optimization
    const optimizeResult = execCLI('storage optimize');
    expect(optimizeResult.success).toBe(true);
    expect(optimizeResult.output).toContain('Storage optimized');
  });

  test('tusky integration and fallback mechanisms', async () => {
    test.setTimeout(TEST_TIMEOUT);

    execCLI('init tusky-test-repo --description "Tusky integration test"');
    
    // Configure Tusky storage
    const tuskyConfigResult = execCLI('tusky config');
    expect(tuskyConfigResult.success).toBe(true);
    expect(tuskyConfigResult.output).toContain('Tusky configured');

    // Use Tusky as primary storage
    const tuskyUseResult = execCLI('tusky use');
    expect(tuskyUseResult.success).toBe(true);
    expect(tuskyUseResult.output).toContain('Tusky enabled');

    // Check Tusky status
    const tuskyStatusResult = execCLI('tusky status');
    expect(tuskyStatusResult.success).toBe(true);
    expect(tuskyStatusResult.output).toContain('Free tier');

    // Test fallback to Walrus when quota exceeded
    const fallbackResult = execCLI('tusky fallback walrus');
    expect(fallbackResult.success).toBe(true);
    expect(fallbackResult.output).toContain('Fallback configured');
  });
});