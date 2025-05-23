import fs from 'fs-extra';
import path from 'path';
import { WorkingCopyManager } from '../cli/src/utils/working-copy-manager.js';

const testDir = path.join(process.cwd(), 'test-direct-' + Date.now());

const runTest = async () => {
  console.log('Testing WalGit always-staged paradigm...\n');
  
  try {
    // Setup test directory
    await fs.ensureDir(testDir);
    await fs.ensureDir(path.join(testDir, '.walgit'));
    
    // 1. Create default .walgitignore
    console.log('1. Creating .walgitignore');
    WorkingCopyManager.createDefaultIgnoreFile(testDir);
    const ignoreExists = await fs.exists(path.join(testDir, '.walgitignore'));
    console.log(`✓ .walgitignore created: ${ignoreExists}`);
    
    // Initialize working copy manager
    const workingCopy = new WorkingCopyManager(testDir);
    
    // 2. Create test files
    console.log('\n2. Creating test files');
    await fs.writeFile(path.join(testDir, 'file1.js'), 'console.log("hello");');
    await fs.writeFile(path.join(testDir, 'file2.js'), 'console.log("world");');
    await fs.writeFile(path.join(testDir, '.env'), 'SECRET=123'); // Should be ignored
    await fs.ensureDir(path.join(testDir, 'node_modules'));
    await fs.writeFile(path.join(testDir, 'node_modules', 'dep.js'), 'module.exports = {};');
    console.log('✓ Test files created');
    
    // 3. Get all tracked files
    console.log('\n3. Getting all tracked files');
    const allFiles = await workingCopy.getAllFiles();
    console.log('Tracked files:', allFiles);
    console.log(`✓ Found ${allFiles.length} tracked files`);
    
    // 4. Create initial snapshot
    console.log('\n4. Creating initial snapshot');
    const snapshot1 = await workingCopy.snapshot();
    await workingCopy.saveSnapshot(snapshot1);
    console.log('✓ Initial snapshot created');
    
    // 5. Modify files and detect changes
    console.log('\n5. Modifying files and detecting changes');
    await fs.writeFile(path.join(testDir, 'file1.js'), 'console.log("changed");');
    await fs.writeFile(path.join(testDir, 'file3.js'), 'console.log("new");');
    await fs.unlink(path.join(testDir, 'file2.js'));
    
    const changes = await workingCopy.detectChanges(snapshot1);
    console.log('Changes detected:', changes);
    console.log(`✓ Added: ${changes.added.length}, Modified: ${changes.modified.length}, Deleted: ${changes.deleted.length}`);
    
    // 6. Create new snapshot
    console.log('\n6. Creating new snapshot');
    const snapshot2 = await workingCopy.snapshot();
    await workingCopy.saveSnapshot(snapshot2);
    console.log('✓ New snapshot created');
    
    // 7. Test ignored files
    console.log('\n7. Testing ignored files');
    console.log('.env is ignored:', workingCopy.isIgnored('.env'));
    console.log('file1.js is ignored:', workingCopy.isIgnored('file1.js'));
    console.log('node_modules/dep.js is ignored:', workingCopy.isIgnored('node_modules/dep.js'));
    
    console.log('\nDirect test completed successfully! ✨');
    
  } catch (error) {
    console.error('Direct test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Cleanup
    await fs.remove(testDir);
  }
};

runTest();