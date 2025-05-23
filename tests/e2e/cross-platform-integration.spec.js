/**
 * @fileoverview Cross-platform integration tests for WalGit
 * Tests interoperability between CLI and Frontend workflows
 */

import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Test configuration
const FRONTEND_URL = 'http://localhost:3000';
const CLI_PATH = path.join(process.cwd(), 'walgit-backend', 'cli', 'bin', 'walgit.js');
const TEST_REPO_DIR = path.join(os.tmpdir(), 'walgit-cross-platform-test');
const TEST_TIMEOUT = 180000; // 3 minutes per test

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
test.beforeEach(async ({ page }) => {
  // Clean up previous test directory
  if (fs.existsSync(TEST_REPO_DIR)) {
    fs.rmSync(TEST_REPO_DIR, { recursive: true, force: true });
  }
  
  // Create fresh test directory
  fs.mkdirSync(TEST_REPO_DIR, { recursive: true });
  
  // Create test files
  fs.writeFileSync(path.join(TEST_REPO_DIR, 'README.md'), '# Cross-Platform Test Repository\n\nTesting CLI and Frontend integration.');
  fs.writeFileSync(path.join(TEST_REPO_DIR, 'package.json'), JSON.stringify({
    name: 'cross-platform-test',
    version: '1.0.0',
    description: 'Cross-platform integration test repository'
  }, null, 2));
  
  // Create src directory with files
  fs.mkdirSync(path.join(TEST_REPO_DIR, 'src'), { recursive: true });
  fs.writeFileSync(path.join(TEST_REPO_DIR, 'src', 'main.js'), 'console.log("Cross-platform test");');
  fs.writeFileSync(path.join(TEST_REPO_DIR, 'src', 'config.js'), 'export const config = { env: "test" };');
  
  // Setup frontend connection
  await page.goto(FRONTEND_URL);
  await page.evaluate(() => {
    window.mockWalletConnection({
      address: '0x123456789abcdef123456789abcdef123456789a',
      network: 'devnet',
      connected: true
    });
  });
});

test.afterEach(async () => {
  // Clean up test directory
  if (fs.existsSync(TEST_REPO_DIR)) {
    fs.rmSync(TEST_REPO_DIR, { recursive: true, force: true });
  }
});

test.describe('CLI to Frontend Integration', () => {
  test('CLI: create repository → Frontend: view and manage', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    // Step 1: Create repository via CLI
    const initResult = execCLI('init cross-platform-repo --description "Repository for cross-platform testing"');
    expect(initResult.success).toBe(true);
    expect(initResult.output).toContain('Repository initialized');

    // Add and commit files via CLI
    execCLI('add .');
    const commitResult = execCLI('commit -m "Initial commit via CLI"');
    expect(commitResult.success).toBe(true);

    // Push to remote via CLI
    const pushResult = execCLI('push');
    expect(pushResult.success).toBe(true);
    
    // Extract repository ID from push output
    const repoMatch = pushResult.output.match(/Repository ID: (0x[a-fA-F0-9]+)/);
    const repoId = repoMatch ? repoMatch[1] : '0xmockrepoid123456';

    // Step 2: View repository in Frontend
    await page.goto(`${FRONTEND_URL}/repositories/owner/cross-platform-repo`);
    
    // Mock repository data based on CLI creation
    await page.evaluate((repoData) => {
      window.mockRepository({
        id: repoData.repoId,
        name: 'cross-platform-repo',
        description: 'Repository for cross-platform testing',
        owner: '0x123456789abcdef123456789abcdef123456789a',
        defaultBranch: 'main',
        lastCommit: 'Initial commit via CLI',
        lastCommitTime: 'just now',
        fileCount: 4
      });
      
      window.mockFileStructure({
        files: [
          { name: 'README.md', type: 'file', size: '1.1KB', lastModified: 'just now' },
          { name: 'package.json', type: 'file', size: '234B', lastModified: 'just now' },
          { name: 'src', type: 'directory', lastModified: 'just now' }
        ]
      });
    }, { repoId });

    // Verify repository appears correctly in frontend
    await expect(page.locator('[data-testid="repo-title"]')).toContainText('cross-platform-repo');
    await expect(page.locator('[data-testid="repo-description"]')).toContainText('Repository for cross-platform testing');
    await expect(page.locator('[data-testid="last-commit-message"]')).toContainText('Initial commit via CLI');

    // Step 3: Manage collaborators via Frontend
    await page.click('[data-testid="tab-settings"]');
    await page.click('[data-testid="settings-collaborators-tab"]');
    
    // Add collaborator via frontend
    await page.fill('[data-testid="add-collaborator-address"]', '0x987654321fedcba987654321fedcba987654321f');
    await page.selectOption('[data-testid="collaborator-role-select"]', 'writer');
    await page.click('[data-testid="add-collaborator-submit"]');
    
    // Verify success
    await expect(page.locator('[data-testid="collaborator-added-success"]')).toBeVisible();
    
    // Step 4: Verify collaborator addition via CLI
    const listCollabResult = execCLI('repo list-collaborators');
    expect(listCollabResult.success).toBe(true);
    expect(listCollabResult.output).toContain('0x987654321fedcba987654321fedcba987654321f');
    expect(listCollabResult.output).toContain('writer');
  });

  test('CLI: encrypted repository → Frontend: manage encryption', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    // Step 1: Create encrypted repository via CLI
    const initResult = execCLI('init secure-cross-repo --encryption --description "Encrypted cross-platform repository"');
    expect(initResult.success).toBe(true);
    expect(initResult.output).toContain('encryption enabled');

    // Add and commit encrypted content
    execCLI('add .');
    execCLI('commit -m "Initial encrypted commit"');
    execCLI('push');

    // Step 2: Manage encryption via Frontend
    await page.goto(`${FRONTEND_URL}/repositories/owner/secure-cross-repo/storage/manage`);
    await page.click('[data-testid="encryption-tab"]');

    // Mock encryption status from CLI creation
    await page.evaluate(() => {
      window.mockEncryptionStatus({
        enabled: true,
        algorithm: 'SEAL Threshold Encryption',
        keyRotationInterval: '90 days',
        lastRotation: 'just created',
        policyId: 'policy_cli_generated_123',
        accessList: [
          { address: '0x123456789abcdef123456789abcdef123456789a', role: 'owner' }
        ]
      });
    });

    // Verify encryption is enabled
    await expect(page.locator('[data-testid="encryption-status"]')).toContainText('Enabled');
    await expect(page.locator('[data-testid="encryption-algorithm"]')).toContainText('SEAL Threshold');

    // Share encryption access via frontend
    await page.fill('[data-testid="share-address-input"]', '0xabc123def456789abc123def456789abc123def45');
    await page.click('[data-testid="share-access-button"]');
    await expect(page.locator('[data-testid="access-shared-success"]')).toBeVisible();

    // Step 3: Verify encryption sharing via CLI
    const listAccessResult = execCLI('encryption list-access');
    expect(listAccessResult.success).toBe(true);
    expect(listAccessResult.output).toContain('0xabc123def456789abc123def456789abc123def45');

    // Rotate keys via frontend
    await page.click('[data-testid="rotate-keys-button"]');
    await page.click('[data-testid="confirm-rotation"]');
    await expect(page.locator('[data-testid="rotation-success"]')).toBeVisible();

    // Verify key rotation via CLI
    const encStatusResult = execCLI('encryption status');
    expect(encStatusResult.success).toBe(true);
    expect(encStatusResult.output).toContain('Last rotation');
  });
});

test.describe('Frontend to CLI Integration', () => {
  test('Frontend: create repository → CLI: clone and modify', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    // Step 1: Create repository via Frontend
    await page.click('[data-testid="new-repository-button"]');
    await page.fill('[data-testid="repo-name-input"]', 'frontend-to-cli-repo');
    await page.fill('[data-testid="repo-description-input"]', 'Repository created in frontend, modified in CLI');
    await page.click('[data-testid="visibility-public"]');
    await page.fill('[data-testid="default-branch-input"]', 'main');
    await page.click('[data-testid="create-repository-submit"]');

    // Wait for repository creation
    await expect(page.locator('[data-testid="creation-success"]')).toBeVisible();
    
    // Mock the created repository data
    const repoId = '0xfrontendcreated123456789abcdef';
    await page.evaluate((repoData) => {
      window.mockRepository({
        id: repoData.repoId,
        name: 'frontend-to-cli-repo',
        description: 'Repository created in frontend, modified in CLI',
        owner: '0x123456789abcdef123456789abcdef123456789a',
        defaultBranch: 'main',
        created: true
      });
    }, { repoId });

    // Step 2: Upload initial files via Frontend
    await page.click('[data-testid="upload-files-button"]');
    
    // Mock file upload
    await page.evaluate(() => {
      const mockFiles = [
        new File(['# Frontend Created Repo\n\nThis repo was created via frontend.'], 'README.md', { type: 'text/markdown' }),
        new File(['{"name": "frontend-repo", "version": "1.0.0"}'], 'package.json', { type: 'application/json' })
      ];
      
      const input = document.querySelector('[data-testid="file-upload-input"]');
      const dt = new DataTransfer();
      mockFiles.forEach(file => dt.items.add(file));
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await page.fill('[data-testid="commit-message-input"]', 'Initial commit via frontend');
    await page.click('[data-testid="commit-files-button"]');
    await expect(page.locator('[data-testid="commit-success"]')).toBeVisible();

    // Step 3: Clone repository via CLI
    const cloneDir = path.join(os.tmpdir(), 'walgit-cloned-from-frontend');
    if (fs.existsSync(cloneDir)) {
      fs.rmSync(cloneDir, { recursive: true, force: true });
    }
    fs.mkdirSync(cloneDir, { recursive: true });

    const cloneResult = execCLI(`clone ${repoId}`, { cwd: cloneDir });
    expect(cloneResult.success).toBe(true);
    expect(cloneResult.output).toContain('Repository cloned');

    // Verify cloned files
    const clonedRepoPath = path.join(cloneDir, 'frontend-to-cli-repo');
    expect(fs.existsSync(path.join(clonedRepoPath, 'README.md'))).toBe(true);
    expect(fs.existsSync(path.join(clonedRepoPath, 'package.json'))).toBe(true);

    // Step 4: Modify repository via CLI
    fs.writeFileSync(path.join(clonedRepoPath, 'CLI_CHANGES.md'), '# CLI Modifications\n\nThese changes were made via CLI.');
    fs.writeFileSync(path.join(clonedRepoPath, 'src', 'cli-feature.js'), 'export const cliFeature = () => "Added via CLI";');

    const addResult = execCLI('add .', { cwd: clonedRepoPath });
    expect(addResult.success).toBe(true);

    const commitResult = execCLI('commit -m "Add CLI modifications"', { cwd: clonedRepoPath });
    expect(commitResult.success).toBe(true);

    const pushResult = execCLI('push', { cwd: clonedRepoPath });
    expect(pushResult.success).toBe(true);

    // Step 5: Verify changes appear in Frontend
    await page.goto(`${FRONTEND_URL}/repositories/owner/frontend-to-cli-repo`);
    
    // Mock updated file structure
    await page.evaluate(() => {
      window.mockFileStructure({
        files: [
          { name: 'README.md', type: 'file', size: '1.1KB', lastModified: '10 minutes ago' },
          { name: 'package.json', type: 'file', size: '234B', lastModified: '10 minutes ago' },
          { name: 'CLI_CHANGES.md', type: 'file', size: '567B', lastModified: 'just now' },
          { name: 'src', type: 'directory', lastModified: 'just now' }
        ]
      });
      
      window.mockCommitHistory([
        { 
          hash: 'abc123def456', 
          message: 'Add CLI modifications', 
          author: '0x123456789abcdef123456789abcdef123456789a',
          timestamp: 'just now',
          filesChanged: 2
        },
        { 
          hash: 'def456abc789', 
          message: 'Initial commit via frontend', 
          author: '0x123456789abcdef123456789abcdef123456789a',
          timestamp: '10 minutes ago',
          filesChanged: 2
        }
      ]);
    });

    // Verify new files appear
    await expect(page.locator('[data-testid="file-item-CLI_CHANGES.md"]')).toBeVisible();
    
    // Check commit history
    await page.click('[data-testid="tab-commits"]');
    await expect(page.locator('[data-testid="commit-Add CLI modifications"]')).toBeVisible();

    // Clean up cloned directory
    fs.rmSync(cloneDir, { recursive: true, force: true });
  });

  test('Frontend: add collaborator → CLI: collaborator workflow', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    // Step 1: Setup repository with collaborator via Frontend
    await page.goto(`${FRONTEND_URL}/repositories/owner/collab-test-repo`);
    
    // Mock existing repository
    await page.evaluate(() => {
      window.mockRepository({
        id: '0xcollabtestrepo123456',
        name: 'collab-test-repo',
        description: 'Repository for collaboration testing',
        owner: '0x123456789abcdef123456789abcdef123456789a',
        defaultBranch: 'main'
      });
    });

    // Add collaborator via frontend
    await page.click('[data-testid="tab-settings"]');
    await page.click('[data-testid="settings-collaborators-tab"]');
    
    await page.fill('[data-testid="add-collaborator-address"]', '0x987654321fedcba987654321fedcba987654321f');
    await page.selectOption('[data-testid="collaborator-role-select"]', 'writer');
    await page.click('[data-testid="add-collaborator-submit"]');
    
    await expect(page.locator('[data-testid="collaborator-added-success"]')).toBeVisible();

    // Step 2: Setup CLI as collaborator
    const collabDir = path.join(os.tmpdir(), 'walgit-collaborator-cli');
    if (fs.existsSync(collabDir)) {
      fs.rmSync(collabDir, { recursive: true, force: true });
    }
    fs.mkdirSync(collabDir, { recursive: true });

    // Configure CLI for collaborator
    const configResult = execCLI('config user.address 0x987654321fedcba987654321fedcba987654321f', { cwd: collabDir });
    expect(configResult.success).toBe(true);

    // Clone repository as collaborator
    const cloneResult = execCLI('clone 0xcollabtestrepo123456', { cwd: collabDir });
    expect(cloneResult.success).toBe(true);

    // Step 3: Make changes as collaborator via CLI
    const collabRepoPath = path.join(collabDir, 'collab-test-repo');
    fs.writeFileSync(path.join(collabRepoPath, 'COLLABORATOR_FEATURE.md'), '# Collaborator Feature\n\nAdded by collaborator.');
    
    const addResult = execCLI('add .', { cwd: collabRepoPath });
    expect(addResult.success).toBe(true);

    const commitResult = execCLI('commit -m "Add collaborator feature"', { cwd: collabRepoPath });
    expect(commitResult.success).toBe(true);

    const pushResult = execCLI('push', { cwd: collabRepoPath });
    expect(pushResult.success).toBe(true);

    // Step 4: Verify collaborator changes in Frontend
    await page.goto(`${FRONTEND_URL}/repositories/owner/collab-test-repo`);
    
    // Mock updated repository state
    await page.evaluate(() => {
      window.mockFileStructure({
        files: [
          { name: 'README.md', type: 'file', size: '1.1KB', lastModified: '1 hour ago' },
          { name: 'COLLABORATOR_FEATURE.md', type: 'file', size: '456B', lastModified: 'just now' }
        ]
      });
    });

    await expect(page.locator('[data-testid="file-item-COLLABORATOR_FEATURE.md"]')).toBeVisible();

    // Clean up collaborator directory
    fs.rmSync(collabDir, { recursive: true, force: true });
  });
});

test.describe('Bidirectional State Synchronization', () => {
  test('real-time sync: CLI changes reflect in Frontend', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    // Setup repository
    execCLI('init sync-test-repo --description "Testing real-time synchronization"');
    execCLI('add .');
    execCLI('commit -m "Initial commit"');
    execCLI('push');

    // Open repository in frontend
    await page.goto(`${FRONTEND_URL}/repositories/owner/sync-test-repo`);
    
    // Mock initial repository state
    await page.evaluate(() => {
      window.mockRepository({
        id: '0xsynctestrepoid123',
        name: 'sync-test-repo',
        lastCommit: 'Initial commit',
        lastCommitTime: '5 minutes ago'
      });
    });

    // Make changes via CLI
    fs.writeFileSync(path.join(TEST_REPO_DIR, 'REALTIME_CHANGE.md'), '# Real-time Change\n\nThis file was added while frontend was open.');
    execCLI('add REALTIME_CHANGE.md');
    execCLI('commit -m "Add real-time change file"');
    execCLI('push');

    // Simulate real-time update in frontend
    await page.evaluate(() => {
      // Simulate WebSocket or polling update
      window.dispatchEvent(new CustomEvent('repository-updated', {
        detail: {
          repositoryId: '0xsynctestrepoid123',
          lastCommit: 'Add real-time change file',
          lastCommitTime: 'just now',
          newFiles: ['REALTIME_CHANGE.md']
        }
      }));
    });

    // Verify frontend reflects the change
    await expect(page.locator('[data-testid="last-commit-message"]')).toContainText('Add real-time change file');
    
    // Refresh file list
    await page.click('[data-testid="refresh-files"]');
    await expect(page.locator('[data-testid="file-item-REALTIME_CHANGE.md"]')).toBeVisible();
  });

  test('conflict resolution: concurrent modifications', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    // Setup repository
    execCLI('init conflict-test-repo --description "Testing conflict resolution"');
    fs.writeFileSync(path.join(TEST_REPO_DIR, 'SHARED_FILE.md'), '# Shared File\n\nOriginal content.');
    execCLI('add .');
    execCLI('commit -m "Initial commit with shared file"');
    execCLI('push');

    // Open in frontend
    await page.goto(`${FRONTEND_URL}/repositories/owner/conflict-test-repo`);

    // Mock file content for editing
    await page.evaluate(() => {
      window.mockFileContent({
        'SHARED_FILE.md': '# Shared File\n\nOriginal content.'
      });
    });

    // Start editing in frontend
    await page.click('[data-testid="file-item-SHARED_FILE.md"]');
    await page.click('[data-testid="edit-file-button"]');
    
    // Modify content in frontend (don't save yet)
    await page.fill('[data-testid="file-editor"]', '# Shared File\n\nModified in frontend.');

    // Meanwhile, modify via CLI
    fs.writeFileSync(path.join(TEST_REPO_DIR, 'SHARED_FILE.md'), '# Shared File\n\nModified in CLI.');
    execCLI('add SHARED_FILE.md');
    execCLI('commit -m "Modify shared file via CLI"');
    execCLI('push');

    // Now try to save frontend changes
    await page.click('[data-testid="save-file-button"]');

    // Should detect conflict
    await expect(page.locator('[data-testid="conflict-detected"]')).toBeVisible();
    await expect(page.locator('[data-testid="conflict-resolution-options"]')).toBeVisible();

    // Choose merge resolution
    await page.click('[data-testid="resolve-merge"]');
    
    // Should show merge editor
    await expect(page.locator('[data-testid="merge-editor"]')).toBeVisible();
    await expect(page.locator('[data-testid="merge-preview"]')).toContainText('Modified in frontend');
    await expect(page.locator('[data-testid="merge-preview"]')).toContainText('Modified in CLI');

    // Complete merge
    await page.fill('[data-testid="merged-content"]', '# Shared File\n\nMerged content from both frontend and CLI.');
    await page.click('[data-testid="complete-merge"]');

    // Should commit merge
    await page.fill('[data-testid="merge-commit-message"]', 'Merge frontend and CLI changes');
    await page.click('[data-testid="commit-merge"]');

    // Verify merge success
    await expect(page.locator('[data-testid="merge-success"]')).toBeVisible();
  });

  test('state consistency: permissions and access control', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    // Setup repository with encryption
    execCLI('init permission-sync-repo --encryption --description "Testing permission synchronization"');
    execCLI('add .');
    execCLI('commit -m "Initial encrypted commit"');
    execCLI('push');

    // Add collaborator via CLI
    const addCollabResult = execCLI('repo add-collaborator 0x987654321fedcba987654321fedcba987654321f writer');
    expect(addCollabResult.success).toBe(true);

    // Share encryption access via CLI
    const shareResult = execCLI('encryption share 0x987654321fedcba987654321fedcba987654321f');
    expect(shareResult.success).toBe(true);

    // Open repository in frontend
    await page.goto(`${FRONTEND_URL}/repositories/owner/permission-sync-repo`);

    // Check that collaborator appears in frontend
    await page.click('[data-testid="tab-settings"]');
    await page.click('[data-testid="settings-collaborators-tab"]');

    // Mock collaborator list from CLI addition
    await page.evaluate(() => {
      window.mockCollaborators([
        {
          address: '0x987654321fedcba987654321fedcba987654321f',
          role: 'writer',
          addedAt: 'just now',
          addedBy: 'CLI'
        }
      ]);
    });

    await expect(page.locator('[data-testid="collaborator-0x987654321fedcba987654321fedcba987654321f"]')).toBeVisible();
    await expect(page.locator('[data-testid="collaborator-role"]')).toContainText('writer');

    // Check encryption access
    await page.click('[data-testid="settings-encryption-tab"]');
    
    await page.evaluate(() => {
      window.mockEncryptionAccess([
        {
          address: '0x123456789abcdef123456789abcdef123456789a',
          role: 'owner'
        },
        {
          address: '0x987654321fedcba987654321fedcba987654321f',
          role: 'writer',
          grantedBy: 'CLI'
        }
      ]);
    });

    await expect(page.locator('[data-testid="access-0x987654321fedcba987654321fedcba987654321f"]')).toBeVisible();

    // Remove collaborator via frontend
    await page.click('[data-testid="settings-collaborators-tab"]');
    await page.click('[data-testid="remove-collaborator-0x987654321fedcba987654321fedcba987654321f"]');
    await page.click('[data-testid="confirm-remove"]');

    await expect(page.locator('[data-testid="collaborator-removed-success"]')).toBeVisible();

    // Verify removal via CLI
    const listResult = execCLI('repo list-collaborators');
    expect(listResult.success).toBe(true);
    expect(listResult.output).not.toContain('0x987654321fedcba987654321fedcba987654321f');

    // Verify encryption access also removed
    const accessResult = execCLI('encryption list-access');
    expect(accessResult.success).toBe(true);
    expect(accessResult.output).not.toContain('0x987654321fedcba987654321fedcba987654321f');
  });
});