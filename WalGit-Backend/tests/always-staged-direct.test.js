// Direct tests for the always-staged implementation without mocking imports
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { WorkingCopyManager } from '../cli/src/utils/working-copy-manager.js';

describe('Always-Staged Direct Tests', () => {
  let tempDir;
  let manager;

  beforeEach(async () => {
    // Create a temporary directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'walgit-direct-test-'));
    process.chdir(tempDir);
    
    // Create basic repo structure
    await fs.mkdirp('.walgit');
    WorkingCopyManager.createDefaultIgnoreFile(tempDir);
    
    // Initialize manager
    manager = new WorkingCopyManager(tempDir);
  });

  afterEach(async () => {
    process.chdir('/');
    await fs.remove(tempDir);
  });

  test('working copy manager tracks files correctly', async () => {
    // Create test files
    await fs.writeFile('app.js', 'console.log("hello");');
    await fs.writeFile('README.md', '# Test Project');
    await fs.writeFile('.env', 'SECRET=123');
    
    // .env should be ignored by default
    const files = await manager.getAllFiles();
    expect(files).toContain('app.js');
    expect(files).toContain('README.md');
    expect(files).not.toContain('.env');
  });

  test('snapshots capture file state', async () => {
    await fs.writeFile('file1.txt', 'content1');
    await fs.writeFile('file2.txt', 'content2');
    
    const snapshot = await manager.snapshot();
    
    expect(Object.keys(snapshot.files)).toContain('file1.txt');
    expect(Object.keys(snapshot.files)).toContain('file2.txt');
    expect(snapshot.files['file1.txt'].hash).toBeDefined();
    expect(snapshot.files['file1.txt'].size).toBe(8);
  });

  test('change detection works correctly', async () => {
    // Initial state
    await fs.writeFile('original.txt', 'original content');
    await fs.writeFile('deleted.txt', 'delete me');
    const snapshot1 = await manager.snapshot();
    
    // Make changes
    await fs.writeFile('new.txt', 'new file');
    await fs.writeFile('original.txt', 'modified content');
    await fs.unlink('deleted.txt');
    
    // Detect changes from snapshot1 to current state
    const changes = await manager.detectChanges(snapshot1);
    expect(changes.added).toContain('new.txt');
    expect(changes.modified).toContain('original.txt');
    expect(changes.deleted).toContain('deleted.txt');
  });

  test('ignore patterns work as expected', async () => {
    // Create custom ignore file
    await fs.writeFile('.walgitignore', '*.log\nbuild/\n!important.log\ntest/**/*.spec.js\n');
    
    // Create test files
    await fs.writeFile('app.js', 'app');
    await fs.writeFile('debug.log', 'debug');
    await fs.writeFile('important.log', 'important');
    await fs.mkdirp('build');
    await fs.writeFile('build/output.js', 'output');
    await fs.mkdirp('test/unit');
    await fs.writeFile('test/unit/file.spec.js', 'spec');
    await fs.writeFile('test/unit/file.js', 'test');
    
    // Reload manager to pick up new patterns
    const manager2 = new WorkingCopyManager(tempDir);
    const files = await manager2.getAllFiles();
    
    expect(files).toContain('app.js');
    expect(files).toContain('important.log'); // Negated pattern
    expect(files).toContain('test/unit/file.js');
    expect(files).not.toContain('debug.log');
    expect(files).not.toContain('build/output.js');
    expect(files).not.toContain('test/unit/file.spec.js');
  });

  test('always-staged workflow integration', async () => {
    // Simulate the workflow
    
    // 1. Create initial files
    await fs.writeFile('README.md', '# Project');
    await fs.writeFile('index.js', 'console.log("Hello");');
    await fs.writeFile('temp.txt', 'temporary');
    
    // 2. Take initial snapshot (like after a commit)
    const initialSnapshot = await manager.snapshot();
    await manager.saveSnapshot(initialSnapshot);
    
    // 3. Make changes
    await fs.writeFile('index.js', 'console.log("Hello World");'); // modify
    await fs.writeFile('new-feature.js', 'export function feature() {}'); // add
    await fs.unlink('temp.txt'); // delete
    
    // 4. Detect all changes since initial state
    const changes = await manager.detectChanges(initialSnapshot);
    
    expect(changes.modified).toContain('index.js');
    expect(changes.added).toContain('new-feature.js');
    expect(changes.deleted).toContain('temp.txt');
  });

  test('handles complex directory structures', async () => {
    // Create complex structure
    await fs.mkdirp('src/components/ui');
    await fs.mkdirp('src/utils');
    await fs.mkdirp('docs/api');
    
    await fs.writeFile('src/index.js', 'main');
    await fs.writeFile('src/components/App.js', 'App');
    await fs.writeFile('src/components/ui/Button.js', 'Button');
    await fs.writeFile('src/utils/helpers.js', 'helpers');
    await fs.writeFile('docs/README.md', 'docs');
    await fs.writeFile('docs/api/endpoints.md', 'endpoints');
    
    const files = await manager.getAllFiles();
    
    expect(files).toContain('src/index.js');
    expect(files).toContain('src/components/App.js');
    expect(files).toContain('src/components/ui/Button.js');
    expect(files).toContain('src/utils/helpers.js');
    expect(files).toContain('docs/README.md');
    expect(files).toContain('docs/api/endpoints.md');
  });

  test('binary files are tracked (no filtering)', async () => {
    // Create various file types
    await fs.writeFile('script.js', 'console.log("test");');
    await fs.writeFile('image.png', Buffer.from([0x89, 0x50, 0x4E, 0x47]));
    await fs.writeFile('data.bin', Buffer.from([0x00, 0x01, 0x02, 0x03]));
    
    const files = await manager.getAllFiles();
    
    // Current implementation doesn't filter by file type
    expect(files).toContain('script.js');
    expect(files).toContain('image.png');
    expect(files).toContain('data.bin');
  });
});