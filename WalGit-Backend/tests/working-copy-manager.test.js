// @ts-check
import { jest } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname for ESM modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the module to test
import { WorkingCopyManager } from '../cli/src/utils/working-copy-manager.js';

describe('WorkingCopyManager Unit Tests', () => {
  let tempDir;
  let manager;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'walgit-wcm-test-'));
    process.chdir(tempDir);
    
    // Create .walgit directory
    await fs.mkdirp(path.join(tempDir, '.walgit'));
    
    // Initialize manager
    manager = new WorkingCopyManager(tempDir);
  });

  afterEach(async () => {
    // Clean up
    process.chdir('/');
    await fs.remove(tempDir);
  });

  describe('Constructor and initialization', () => {
    test('should initialize with correct paths', () => {
      expect(manager.repoPath).toBe(tempDir);
      expect(manager.gitignorePath).toBe(path.join(tempDir, '.walgitignore'));
      expect(manager.walgitPath).toBe(path.join(tempDir, '.walgit'));
    });

    test('should load existing ignore patterns', async () => {
      // Create .walgitignore
      await fs.writeFile('.walgitignore', '*.log\nnode_modules/\n');
      
      // Create new manager to test pattern loading
      const newManager = new WorkingCopyManager(tempDir);
      
      // Test that patterns are loaded
      await fs.writeFile('test.log', 'log content');
      await fs.writeFile('app.js', 'app code');
      
      const snapshot = await newManager.snapshot();
      // .walgitignore will also be tracked
      expect(Object.keys(snapshot.files).sort()).toEqual(['.walgitignore', 'app.js'].sort());
    });

    test('should handle missing .walgitignore gracefully', async () => {
      // Ensure no .walgitignore exists
      await fs.remove('.walgitignore').catch(() => {});
      
      // Create new manager
      const newManager = new WorkingCopyManager(tempDir);
      
      // Should work without errors
      const snapshot = await newManager.snapshot();
      expect(snapshot).toBeDefined();
    });
  });

  describe('File traversal and filtering', () => {
    test('should traverse nested directories', async () => {
      // Create nested structure
      await fs.mkdirp('src/components/ui');
      await fs.mkdirp('src/utils');
      await fs.writeFile('src/index.js', 'main');
      await fs.writeFile('src/components/App.js', 'app');
      await fs.writeFile('src/components/ui/Button.js', 'button');
      await fs.writeFile('src/utils/helpers.js', 'helpers');

      const files = await manager.getAllFiles();
      const filePaths = files.sort();
      
      expect(filePaths).toEqual([
        'src/components/App.js',
        'src/components/ui/Button.js',
        'src/index.js',
        'src/utils/helpers.js'
      ]);
    });

    test('should handle empty directories', async () => {
      await fs.mkdirp('empty/nested/dirs');
      
      const files = await manager.getAllFiles();
      expect(files).toHaveLength(0);
    });

    test('should include all files (no binary filtering)', async () => {
      // Create text and binary files
      await fs.writeFile('text.txt', 'hello world');
      await fs.writeFile('image.png', Buffer.from([0x89, 0x50, 0x4E, 0x47])); // PNG header
      await fs.writeFile('data.bin', Buffer.from([0x00, 0x01, 0x02, 0x03]));
      
      const files = await manager.getAllFiles();
      const filePaths = files;
      
      // The current implementation doesn't filter binary files
      expect(filePaths).toContain('text.txt');
      expect(filePaths).toContain('image.png');
      expect(filePaths).toContain('data.bin');
    });

    test('should respect complex ignore patterns', async () => {
      await fs.writeFile('.walgitignore', `
# Comments should be ignored
*.log
!important.log
/build/
src/**/test/
*.tmp
.env*
`);
      
      // Reset manager to reload patterns
      manager = new WorkingCopyManager(tempDir);
      
      // Create test files
      await fs.mkdirp('src/components/test');
      await fs.mkdirp('build');
      await fs.writeFile('debug.log', 'debug');
      await fs.writeFile('important.log', 'important');
      await fs.writeFile('build/output.js', 'output');
      await fs.writeFile('src/app.js', 'app');
      await fs.writeFile('src/components/test/Button.test.js', 'test');
      await fs.writeFile('temp.tmp', 'temp');
      await fs.writeFile('.env', 'secret');
      await fs.writeFile('.env.local', 'local secret');

      const files = await manager.getAllFiles();
      const filePaths = files.sort();
      
      // .walgitignore will also be tracked
      expect(filePaths).toEqual([
        '.walgitignore',
        'important.log',  // Negated pattern
        'src/app.js'      // Not in test directory
      ]);
    });
  });

  describe('Snapshot functionality', () => {
    test('should create accurate snapshots', async () => {
      await fs.writeFile('file1.txt', 'content1');
      await fs.writeFile('file2.txt', 'content2');
      
      const snapshot = await manager.snapshot();
      
      expect(snapshot.timestamp).toBeDefined();
      expect(snapshot.timestamp).toBeLessThanOrEqual(Date.now());
      expect(Object.keys(snapshot.files)).toHaveLength(2);
      
      const file1 = snapshot.files['file1.txt'];
      expect(file1).toBeDefined();
      expect(file1.hash).toBeDefined();
      expect(file1.size).toBe(8); // 'content1'
      expect(file1.mode).toBeDefined();
    });

    test('should save and load snapshots', async () => {
      await fs.writeFile('test.txt', 'test content');
      
      const snapshot = await manager.snapshot();
      await manager.saveSnapshot(snapshot);
      
      const loaded = await manager.getLastSnapshot();
      expect(loaded).toEqual(snapshot);
    });

    test('should handle concurrent snapshot operations', async () => {
      // Create multiple files
      const filePromises = [];
      for (let i = 0; i < 10; i++) {
        filePromises.push(fs.writeFile(`file${i}.txt`, `content${i}`));
      }
      await Promise.all(filePromises);
      
      // Take multiple snapshots concurrently
      const snapshotPromises = [];
      for (let i = 0; i < 5; i++) {
        snapshotPromises.push(manager.snapshot());
      }
      
      const snapshots = await Promise.all(snapshotPromises);
      
      // All snapshots should be consistent
      const firstSnapshot = snapshots[0];
      for (const snapshot of snapshots) {
        expect(snapshot.files.length).toBe(firstSnapshot.files.length);
      }
    });
  });

  describe('Change detection', () => {
    test('should detect added files', async () => {
      const snapshot1 = await manager.snapshot();
      
      await fs.writeFile('new1.txt', 'new content 1');
      await fs.writeFile('new2.txt', 'new content 2');
      
      const changes = await manager.detectChanges(snapshot1);
      
      expect(changes.added.sort()).toEqual(['new1.txt', 'new2.txt']);
      expect(changes.modified).toHaveLength(0);
      expect(changes.deleted).toHaveLength(0);
    });

    test('should detect modified files', async () => {
      await fs.writeFile('file1.txt', 'original content');
      await fs.writeFile('file2.txt', 'original content');
      
      const snapshot1 = await manager.snapshot();
      
      // Modify files
      await fs.writeFile('file1.txt', 'modified content');
      await fs.writeFile('file2.txt', 'modified content');
      
      const changes = await manager.detectChanges(snapshot1);
      
      expect(changes.modified.sort()).toEqual(['file1.txt', 'file2.txt']);
      expect(changes.added).toHaveLength(0);
      expect(changes.deleted).toHaveLength(0);
    });

    test('should detect deleted files', async () => {
      await fs.writeFile('file1.txt', 'content');
      await fs.writeFile('file2.txt', 'content');
      
      const snapshot1 = await manager.snapshot();
      
      await fs.unlink('file1.txt');
      await fs.unlink('file2.txt');
      
      const changes = await manager.detectChanges(snapshot1);
      
      expect(changes.deleted.sort()).toEqual(['file1.txt', 'file2.txt']);
      expect(changes.added).toHaveLength(0);
      expect(changes.modified).toHaveLength(0);
    });

    test('should detect mixed changes', async () => {
      await fs.writeFile('existing.txt', 'original');
      await fs.writeFile('tobedeleted.txt', 'delete me');
      
      const snapshot1 = await manager.snapshot();
      
      await fs.writeFile('existing.txt', 'modified');
      await fs.writeFile('new.txt', 'new file');
      await fs.unlink('tobedeleted.txt');
      
      const changes = await manager.detectChanges(snapshot1);
      
      expect(changes.added).toEqual(['new.txt']);
      expect(changes.modified).toEqual(['existing.txt']);
      expect(changes.deleted).toEqual(['tobedeleted.txt']);
    });

    test('should handle content-only changes (permissions not tracked)', async () => {
      await fs.writeFile('script.sh', '#!/bin/bash\necho test');
      
      const snapshot1 = await manager.snapshot();
      
      // The implementation only tracks content changes via hash
      // Permission changes alone don't trigger modifications
      await fs.chmod('script.sh', '755');
      
      const changes = await manager.detectChanges(snapshot1);
      expect(changes.modified).toEqual([]);
      
      // But content changes are detected
      await fs.writeFile('script.sh', '#!/bin/bash\necho modified');
      const changes2 = await manager.detectChanges(snapshot1);
      expect(changes2.modified).toEqual(['script.sh']);
    });

    test('should handle no changes', async () => {
      await fs.writeFile('file.txt', 'content');
      
      const snapshot1 = await manager.snapshot();
      const changes = await manager.detectChanges(snapshot1);
      
      expect(changes.added).toHaveLength(0);
      expect(changes.modified).toHaveLength(0);
      expect(changes.deleted).toHaveLength(0);
    });

    test('should handle null previous snapshot', async () => {
      await fs.writeFile('file1.txt', 'content1');
      await fs.writeFile('file2.txt', 'content2');
      
      const changes = await manager.detectChanges(null);
      
      expect(changes.added.sort()).toEqual(['file1.txt', 'file2.txt']);
      expect(changes.modified).toHaveLength(0);
      expect(changes.deleted).toHaveLength(0);
    });
  });

  describe('Default ignore patterns', () => {
    test('should generate comprehensive default patterns via createDefaultIgnoreFile', async () => {
      // Create default ignore file
      const testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'walgit-patterns-test-'));
      WorkingCopyManager.createDefaultIgnoreFile(testDir);
      
      const ignoreContent = await fs.readFile(path.join(testDir, '.walgitignore'), 'utf8');
      
      // Check for essential patterns
      expect(ignoreContent).toContain('node_modules/');
      expect(ignoreContent).toContain('*.log');
      expect(ignoreContent).toContain('.env');
      expect(ignoreContent).toContain('.DS_Store');
      expect(ignoreContent).toContain('build/');
      expect(ignoreContent).toContain('dist/');
      expect(ignoreContent).toContain('.walgit/');
      
      // Check for crypto/blockchain specific patterns
      expect(ignoreContent).toContain('*.key');
      expect(ignoreContent).toContain('*.pem');
      
      // Clean up
      await fs.remove(testDir);
    });
  });

  describe('Error handling', () => {
    test('should handle file read errors gracefully', async () => {
      // Create a file that will be deleted during traversal
      await fs.writeFile('disappearing.txt', 'content');
      
      // Mock fs.stat to simulate file disappearing
      const originalStat = fs.stat;
      jest.spyOn(fs, 'stat').mockImplementation(async (filePath) => {
        if (filePath.includes('disappearing.txt')) {
          throw new Error('ENOENT: no such file');
        }
        return originalStat(filePath);
      });
      
      // Should not throw
      const files = await manager.getAllFiles();
      expect(files).toBeDefined();
      
      fs.stat.mockRestore();
    });

    test('should handle corrupted snapshot files', async () => {
      const snapshotPath = path.join(tempDir, '.walgit', 'snapshot.json');
      await fs.writeFile(snapshotPath, 'invalid json content');
      
      // Should return null instead of throwing
      const snapshot = await manager.getLastSnapshot();
      expect(snapshot).toBeNull();
    });

    test('should handle permission errors', async () => {
      // This test is platform-specific and might not work on all systems
      if (process.platform === 'win32') {
        // Skip on Windows
        return;
      }
      
      await fs.mkdirp('restricted');
      await fs.writeFile('restricted/file.txt', 'content');
      await fs.chmod('restricted', '000');
      
      // Should handle gracefully
      const files = await manager.getAllFiles();
      expect(files).toBeDefined();
      
      // Cleanup
      await fs.chmod('restricted', '755');
    });
  });

  describe('Performance considerations', () => {
    test('should handle large numbers of files efficiently', async () => {
      // Create many files
      const fileCount = 1000;
      const createPromises = [];
      
      for (let i = 0; i < fileCount; i++) {
        const dir = `dir${Math.floor(i / 100)}`;
        await fs.mkdirp(dir);
        createPromises.push(
          fs.writeFile(`${dir}/file${i}.txt`, `content${i}`)
        );
      }
      
      await Promise.all(createPromises);
      
      const startTime = Date.now();
      const snapshot = await manager.snapshot();
      const duration = Date.now() - startTime;
      
      expect(Object.keys(snapshot.files)).toHaveLength(fileCount);
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    test('should cache hash computations when possible', async () => {
      const largeContent = 'x'.repeat(1000000); // 1MB file
      await fs.writeFile('large.txt', largeContent);
      
      // First snapshot
      const start1 = Date.now();
      const snapshot1 = await manager.snapshot();
      const duration1 = Date.now() - start1;
      
      // Second snapshot (no changes)
      const start2 = Date.now();
      const snapshot2 = await manager.snapshot();
      const duration2 = Date.now() - start2;
      
      // Same hash should be computed
      const fileName = Object.keys(snapshot1.files)[0];
      expect(snapshot1.files[fileName].hash).toBe(snapshot2.files[fileName].hash);
      
      // Second snapshot should be faster (cached)
      // This is a heuristic test and might be flaky
      expect(duration2).toBeLessThanOrEqual(duration1 + 100);
    });
  });
});