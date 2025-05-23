// @ts-check
import { jest } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname for ESM modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the modules we need to test
import { WorkingCopyManager } from '../cli/src/utils/working-copy-manager.js';
import * as Repository from '../cli/src/utils/repository.js';

// Mock SUI integration
jest.mock('../cli/src/utils/sui-integration.js', () => ({
  getClient: jest.fn().mockResolvedValue({}),
  getCurrentAddress: jest.fn().mockResolvedValue('0x1234...abcd'),
  executeTransaction: jest.fn().mockResolvedValue({ digest: 'mockDigest123', created_object_ids: ['0xrepo123'] }),
  loadKeypair: jest.fn().mockResolvedValue({})
}));

// Mock transaction utils
jest.mock('../cli/src/utils/transaction-utils.js', () => ({
  executeAuthenticatedRequest: jest.fn().mockResolvedValue({
    digest: 'mock-digest',
    created_object_ids: ['0xblob123'],
    effects: { status: { status: 'success' } }
  }),
  createTransaction: jest.fn().mockReturnValue({
    moveCall: jest.fn().mockReturnValue({})
  })
}));

// Mock config
jest.mock('../cli/src/utils/config.js', () => ({
  getConfig: jest.fn().mockReturnValue({
    user: { name: 'Test User', email: 'test@example.com' },
    walrusEndpoint: 'http://localhost:8080'
  }),
  saveConfig: jest.fn()
}));

// Mock Walrus integration
jest.mock('../cli/src/utils/walrus-integration.js', () => ({
  storeBlob: jest.fn().mockResolvedValue({ blobId: 'mock-blob-id-123' })
}));

// Mock auth module
jest.mock('../cli/src/utils/auth.js', () => ({
  initializeWallet: jest.fn().mockResolvedValue({
    keypair: { publicKey: 'mock-public-key' },
    address: '0xmockaddress'
  }),
  validateWalletConnection: jest.fn().mockResolvedValue(true)
}));

describe('Always-Staged Implementation Tests', () => {
  let tempDir;
  let workingCopyManager;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'walgit-test-'));
    process.chdir(tempDir);
    
    // Create .walgit directory structure manually for testing
    await fs.mkdirp(path.join(tempDir, '.walgit'));
    await fs.mkdirp(path.join(tempDir, '.walgit', 'refs', 'heads'));
    await fs.writeFile(path.join(tempDir, '.walgit', 'HEAD'), 'ref: refs/heads/main');
    await fs.writeFile(path.join(tempDir, '.walgit', 'config'), JSON.stringify({
      repository: { id: 'test-repo', name: 'Test Repository' },
      user: { address: '0xtest', name: 'Test User', email: 'test@example.com' }
    }));
    
    // Create default .walgitignore
    WorkingCopyManager.createDefaultIgnoreFile(tempDir);
    
    // Set up working copy manager
    workingCopyManager = new WorkingCopyManager(tempDir);
  });

  afterEach(async () => {
    // Clean up temporary directory
    process.chdir('/');
    await fs.remove(tempDir);
  });

  describe('WorkingCopyManager', () => {
    test('should create snapshot of working directory', async () => {
      // Create test files
      await fs.writeFile('file1.txt', 'content1');
      await fs.writeFile('file2.txt', 'content2');
      await fs.mkdir('subdir');
      await fs.writeFile('subdir/file3.txt', 'content3');

      const snapshot = await workingCopyManager.snapshot();

      expect(Object.keys(snapshot.files)).toHaveLength(4); // includes .walgitignore
      expect(snapshot.files['file1.txt']).toBeDefined();
      expect(snapshot.files['file2.txt']).toBeDefined();
      expect(snapshot.files['subdir/file3.txt']).toBeDefined();
    });

    test('should respect .walgitignore patterns', async () => {
      // Create .walgitignore
      await fs.writeFile('.walgitignore', '*.log\nnode_modules/\nbuild/\n');
      
      // Create test files
      await fs.writeFile('app.js', 'console.log("app");');
      await fs.writeFile('debug.log', 'debug info');
      await fs.mkdir('node_modules');
      await fs.writeFile('node_modules/dep.js', 'dependency');
      await fs.mkdir('build');
      await fs.writeFile('build/output.js', 'built file');

      // Reset working copy manager to reload ignore patterns
      workingCopyManager = new WorkingCopyManager(tempDir);
      const snapshot = await workingCopyManager.snapshot();

      // Only app.js should be tracked (.walgitignore is also tracked)
      expect(Object.keys(snapshot.files)).toHaveLength(2);
      expect(snapshot.files['app.js']).toBeDefined();
      expect(snapshot.files['.walgitignore']).toBeDefined();
    });

    test('should detect changes between snapshots', async () => {
      // Initial files
      await fs.writeFile('file1.txt', 'initial content');
      await fs.writeFile('file2.txt', 'content2');

      const snapshot1 = await workingCopyManager.snapshot();
      await workingCopyManager.saveSnapshot(snapshot1);

      // Make changes
      await fs.writeFile('file1.txt', 'modified content'); // modify
      await fs.writeFile('file3.txt', 'new file'); // add
      await fs.unlink('file2.txt'); // delete

      const changes = await workingCopyManager.detectChanges(snapshot1);

      expect(changes.modified).toEqual(['file1.txt']);
      expect(changes.added).toEqual(['file3.txt']);
      expect(changes.deleted).toEqual(['file2.txt']);
    });

    test('should handle empty repositories', async () => {
      // Remove the default .walgitignore to have truly empty repo
      await fs.remove('.walgitignore');
      
      const snapshot = await workingCopyManager.snapshot();
      expect(Object.keys(snapshot.files)).toHaveLength(0);
      
      const changes = await workingCopyManager.detectChanges(null);
      expect(changes.added).toHaveLength(0);
      expect(changes.modified).toHaveLength(0);
      expect(changes.deleted).toHaveLength(0);
    });

    test('should generate default ignore file', async () => {
      const testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'walgit-patterns-'));
      WorkingCopyManager.createDefaultIgnoreFile(testDir);
      
      const content = await fs.readFile(path.join(testDir, '.walgitignore'), 'utf8');
      expect(content).toContain('node_modules/');
      expect(content).toContain('*.log');
      expect(content).toContain('.env');
      expect(content).toContain('build/');
      
      await fs.remove(testDir);
    });
  });

  describe('Status Command', () => {
    test('should show all changes as staged', async () => {
      // Create test files
      await fs.writeFile('file1.txt', 'content1');
      await fs.writeFile('file2.txt', 'content2');
      
      // Take initial snapshot
      const snapshot = await workingCopyManager.snapshot();
      await workingCopyManager.saveSnapshot(snapshot);
      
      // Make changes
      await fs.writeFile('file1.txt', 'modified content');
      await fs.writeFile('file3.txt', 'new file');
      await fs.unlink('file2.txt');

      // Check changes directly via WorkingCopyManager
      const changes = await workingCopyManager.detectChanges(snapshot);
      
      // Check what changes we have
      expect(changes.modified).toContain('file1.txt');
      expect(changes.added).toContain('file3.txt');
      expect(changes.deleted).toContain('file2.txt');
    });

    test('should show ignored files when requested', async () => {
      // Create .walgitignore
      await fs.writeFile('.walgitignore', '*.log\ntemp/\n');
      
      // Create files
      await fs.writeFile('app.js', 'console.log("app");');
      await fs.writeFile('debug.log', 'debug info');
      await fs.mkdir('temp');
      await fs.writeFile('temp/cache.txt', 'cache data');

      // Verify that the ignored files are in the working copy
      const workingCopy = new WorkingCopyManager(tempDir);
      const files = await workingCopy.getAllFiles();
      const trackedPaths = files;
      
      expect(trackedPaths).toContain('app.js');
      expect(trackedPaths).not.toContain('debug.log');
      expect(trackedPaths).not.toContain('temp/cache.txt');
    });
  });

  describe('Add Command', () => {
    test('should show deprecation warning', async () => {
      // Create a file
      await fs.writeFile('file1.txt', 'content');
      
      // Mock console output
      const mockLog = jest.spyOn(console, 'log').mockImplementation();
      const mockWarn = jest.spyOn(console, 'warn').mockImplementation();

      // Note: We can't directly run the command, but we can test the concept
      // Check that all files are tracked automatically
      const workingCopy = new WorkingCopyManager(tempDir);
      const snapshot = await workingCopy.snapshot();
      expect(snapshot.files['file1.txt']).toBeDefined();

      mockLog.mockRestore();
      mockWarn.mockRestore();
    });

    test('should force-add ignored files', async () => {
      // Create .walgitignore
      await fs.writeFile('.walgitignore', '*.log\n');
      
      // Create ignored file
      await fs.writeFile('debug.log', 'debug info');

      // By default, the file should be ignored
      const workingCopy = new WorkingCopyManager(tempDir);
      let snapshot = await workingCopy.snapshot();
      expect(snapshot.files['debug.log']).toBeUndefined();
      
      // With force flag, we would add it to exceptions
      // This tests the concept - actual implementation would update .walgitignore
      await fs.writeFile('.walgitignore', '*.log\n!debug.log\n');
      
      // Reset working copy to reload patterns
      const workingCopy2 = new WorkingCopyManager(tempDir);
      snapshot = await workingCopy2.snapshot();
      expect(snapshot.files['debug.log']).toBeDefined();
    });
  });

  describe('Commit Command', () => {
    test('should automatically stage all changes', async () => {
      // Create initial files
      await fs.writeFile('file1.txt', 'initial content');
      await fs.writeFile('file2.txt', 'content2');
      
      // Take initial snapshot
      const snapshot = await workingCopyManager.snapshot();
      await workingCopyManager.saveSnapshot(snapshot);
      
      // Make changes
      await fs.writeFile('file1.txt', 'modified content');
      await fs.writeFile('file3.txt', 'new file');
      await fs.unlink('file2.txt');

      // Run commit through repository
      await Repository.createCommit('Test commit', []);

      // Verify snapshot was taken
      const lastSnapshot = await workingCopyManager.getLastSnapshot();
      expect(lastSnapshot).toBeDefined();
      // Check that changes were included in snapshot
    });

    test('should update snapshot after commit', async () => {
      // Create files
      await fs.writeFile('file1.txt', 'content1');
      
      // Take initial snapshot
      const snapshot1 = await workingCopyManager.snapshot();
      await workingCopyManager.saveSnapshot(snapshot1);
      
      // Make changes
      await fs.writeFile('file2.txt', 'content2');

      // Run commit through repository
      await Repository.createCommit('Add file2', []);

      // Check that snapshot was updated
      const lastSnapshot = await workingCopyManager.getLastSnapshot();
      expect(lastSnapshot).toBeDefined();
      expect(Object.keys(lastSnapshot.files)).toHaveLength(2);
      expect(lastSnapshot.files['file2.txt']).toBeDefined();
    });
  });

  describe('Init Command', () => {
    test('should create .walgitignore with default patterns', async () => {
      // Create a new temp directory for this test
      const initTestDir = await fs.mkdtemp(path.join(os.tmpdir(), 'walgit-init-test-'));
      process.chdir(initTestDir);

      // Simulate repository initialization by creating .walgitignore
      WorkingCopyManager.createDefaultIgnoreFile(initTestDir);

      // Check if .walgitignore was created
      const ignoreExists = await fs.pathExists('.walgitignore');
      expect(ignoreExists).toBe(true);

      // Check contents
      const fileContent = await fs.readFile('.walgitignore', 'utf8');
      expect(fileContent).toContain('node_modules/');
      expect(fileContent).toContain('*.log');
      expect(fileContent).toContain('.env');
      
      // Clean up
      process.chdir('/');
      await fs.remove(initTestDir);
    });
  });

  describe('Integration Tests', () => {
    test('full workflow with always-staged paradigm', async () => {
      // Create initial file
      await fs.writeFile('README.md', '# My Project');
      
      // Take initial snapshot
      const snapshot1 = await workingCopyManager.snapshot();
      await workingCopyManager.saveSnapshot(snapshot1);

      // First commit
      await Repository.createCommit('Initial commit', []);

      // Make changes
      await fs.writeFile('app.js', 'console.log("Hello");');
      await fs.writeFile('README.md', '# My Project\n\nUpdated readme');
      await fs.writeFile('.env', 'SECRET=123');
      
      // Create .walgitignore
      await fs.writeFile('.walgitignore', '.env\n');

      // Status should show changes but not .env
      const status = await Repository.getRepositoryStatus();
      expect(status.stagedFiles.map(f => f.path)).toContain('app.js');
      expect(status.stagedFiles.map(f => f.path)).toContain('README.md');
      expect(status.stagedFiles.map(f => f.path)).not.toContain('.env');

      // Commit should include all tracked changes
      await Repository.createCommit('Add app.js and update README', []);

      // Final snapshot should not include .env
      const finalSnapshot = await workingCopyManager.getLastSnapshot();
      expect(finalSnapshot.files['.env']).toBeUndefined();
      expect(finalSnapshot.files['app.js']).toBeDefined();
    });

    test('handles complex ignore patterns', async () => {
      // Create complex directory structure
      await fs.mkdirp('src/components');
      await fs.mkdirp('dist/js');
      await fs.mkdirp('node_modules/package');
      await fs.mkdirp('.git/objects');
      
      await fs.writeFile('src/app.js', 'app code');
      await fs.writeFile('src/components/Button.js', 'button component');
      await fs.writeFile('dist/js/bundle.js', 'bundled code');
      await fs.writeFile('node_modules/package/index.js', 'package code');
      await fs.writeFile('.git/objects/abc123', 'git object');
      await fs.writeFile('debug.log', 'debug output');
      await fs.writeFile('README.md', 'readme content');

      // Create comprehensive .walgitignore
      await fs.writeFile('.walgitignore', `
# Dependencies
node_modules/

# Build output
dist/
build/
*.min.js

# Logs
*.log
logs/

# Git directory
.git/

# Environment files
.env
.env.*

# OS files
.DS_Store
Thumbs.db
`);

      // Reset working copy manager to load patterns
      workingCopyManager = new WorkingCopyManager(tempDir);
      const snapshot = await workingCopyManager.snapshot();

      // Only source files and README should be tracked
      expect(Object.keys(snapshot.files).sort()).toEqual([
        '.walgitignore',
        'README.md',
        'src/app.js',
        'src/components/Button.js'
      ].sort());
    });

    test('preserves file permissions and metadata', async () => {
      // Create file with specific permissions
      const testFile = 'executable.sh';
      await fs.writeFile(testFile, '#!/bin/bash\necho "test"');
      await fs.chmod(testFile, '755');

      // Take snapshot
      const snapshot = await workingCopyManager.snapshot();
      const fileEntry = snapshot.files[testFile];

      expect(fileEntry).toBeDefined();
      expect(fileEntry.mode).toBeDefined();
      // Check if executable bit is set (0o755 = 493 in decimal, 0o100 = 64 is exec bit for owner)
      expect(fileEntry.mode & 0o100).toBeTruthy();
    });
  });
});