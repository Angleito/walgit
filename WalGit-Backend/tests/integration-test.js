import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';

const testDir = path.join(process.cwd(), 'test-integration-' + Date.now());

const runCommand = (cmd) => {
  try {
    return execSync(cmd, { cwd: testDir, encoding: 'utf-8', stdio: 'pipe' });
  } catch (error) {
    return error.stdout + error.stderr;
  }
};

const runTest = async () => {
  console.log('Running integration test...\n');
  
  try {
    // Setup test directory
    await fs.ensureDir(testDir);
    process.chdir(testDir);
    
    // Initialize repository
    console.log('1. Initializing repository');
    const initOutput = runCommand('node ../cli/bin/walgit.js init --name test-repo');
    console.log(initOutput);
    
    // Check .walgitignore was created
    const ignoreExists = await fs.exists(path.join(testDir, '.walgitignore'));
    console.log(`✓ .walgitignore exists: ${ignoreExists}`);
    
    // Create some files
    await fs.writeFile(path.join(testDir, 'file1.js'), 'console.log("hello");');
    await fs.writeFile(path.join(testDir, 'file2.js'), 'console.log("world");');
    await fs.writeFile(path.join(testDir, '.env'), 'SECRET=123');
    await fs.ensureDir(path.join(testDir, 'node_modules'));
    await fs.writeFile(path.join(testDir, 'node_modules', 'dep.js'), 'module.exports = {};');
    
    // Check status
    console.log('\n2. Checking status');
    const statusOutput = runCommand('node ../cli/bin/walgit.js status');
    console.log(statusOutput);
    
    // Commit changes
    console.log('\n3. Creating commit');
    const commitOutput = runCommand('node ../cli/bin/walgit.js commit -m "Initial commit"');
    console.log(commitOutput);
    
    // Check status after commit
    console.log('\n4. Checking status after commit');
    const statusAfterOutput = runCommand('node ../cli/bin/walgit.js status');
    console.log(statusAfterOutput);
    
    // Test add command with ignored file
    console.log('\n5. Testing add command');
    const addOutput = runCommand('node ../cli/bin/walgit.js add .env');
    console.log(addOutput);
    
    // Test force add
    console.log('\n6. Testing force add');
    const forceAddOutput = runCommand('node ../cli/bin/walgit.js add --force .env');
    console.log(forceAddOutput);
    
    console.log('\nIntegration test completed successfully! ✨');
    
  } catch (error) {
    console.error('Integration test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Cleanup
    process.chdir('..');
    await fs.remove(testDir);
  }
};

runTest();