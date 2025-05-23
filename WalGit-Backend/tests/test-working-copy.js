import fs from 'fs-extra';
import path from 'path';
import { WorkingCopyManager } from '../cli/src/utils/working-copy-manager.js';

// Simple test runner
const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
};

const runTests = async () => {
  const testDir = path.join(process.cwd(), 'test-walgit-' + Date.now());
  
  console.log('Testing WorkingCopyManager...\n');
  
  try {
    // Setup
    await fs.ensureDir(testDir);
    await fs.ensureDir(path.join(testDir, '.walgit'));
    
    // Test: createDefaultIgnoreFile
    console.log('Test: createDefaultIgnoreFile');
    const ignorePath = WorkingCopyManager.createDefaultIgnoreFile(testDir);
    assert(fs.existsSync(ignorePath), '.walgitignore should be created');
    const content = fs.readFileSync(ignorePath, 'utf-8');
    assert(content.includes('*.key'), 'Should include *.key pattern');
    assert(content.includes('node_modules/'), 'Should include node_modules/ pattern');
    console.log('✓ createDefaultIgnoreFile works correctly\n');
    
    // Test: isIgnored
    console.log('Test: isIgnored');
    const wc = new WorkingCopyManager(testDir);
    assert(wc.isIgnored('file.key'), 'Should ignore .key files');
    assert(wc.isIgnored('node_modules/test.js'), 'Should ignore node_modules');
    assert(!wc.isIgnored('regular.js'), 'Should not ignore regular files');
    console.log('✓ isIgnored works correctly\n');
    
    // Test: getAllFiles
    console.log('Test: getAllFiles');
    await fs.writeFile(path.join(testDir, 'file1.js'), 'content1');
    await fs.writeFile(path.join(testDir, 'file2.js'), 'content2');
    await fs.writeFile(path.join(testDir, '.env'), 'SECRET=123');
    
    const files = await wc.getAllFiles();
    assert(files.includes('file1.js'), 'Should include file1.js');
    assert(files.includes('file2.js'), 'Should include file2.js');
    assert(!files.includes('.env'), 'Should not include .env');
    console.log('✓ getAllFiles works correctly\n');
    
    // Test: snapshot
    console.log('Test: snapshot');
    const snapshot = await wc.snapshot();
    assert(snapshot.timestamp, 'Snapshot should have timestamp');
    assert(snapshot.files['file1.js'], 'Snapshot should include file1.js');
    assert(snapshot.files['file1.js'].hash, 'File should have hash');
    console.log('✓ snapshot works correctly\n');
    
    // Test: detectChanges
    console.log('Test: detectChanges');
    const snapshot1 = await wc.snapshot();
    
    // Add new file
    await fs.writeFile(path.join(testDir, 'newfile.js'), 'new content');
    
    // Modify existing file
    await fs.writeFile(path.join(testDir, 'file1.js'), 'modified content');
    
    // Delete file
    await fs.unlink(path.join(testDir, 'file2.js'));
    
    const changes = await wc.detectChanges(snapshot1);
    assert(changes.added.includes('newfile.js'), 'Should detect added file');
    assert(changes.modified.includes('file1.js'), 'Should detect modified file');
    assert(changes.deleted.includes('file2.js'), 'Should detect deleted file');
    console.log('✓ detectChanges works correctly\n');
    
    // Test: saveSnapshot and getLastSnapshot
    console.log('Test: saveSnapshot and getLastSnapshot');
    await wc.saveSnapshot(snapshot);
    const lastSnapshot = await wc.getLastSnapshot();
    assert(lastSnapshot, 'Should retrieve last snapshot');
    assert(lastSnapshot.files['file1.js'], 'Last snapshot should have file data');
    console.log('✓ saveSnapshot and getLastSnapshot work correctly\n');
    
    console.log('All tests passed! ✨');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  } finally {
    // Cleanup
    await fs.remove(testDir);
  }
};

runTests();