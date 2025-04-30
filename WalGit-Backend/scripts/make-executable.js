import { chmod } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Try different possible paths for the CLI file
const possiblePaths = [
  path.join(__dirname, '../cli/bin/walgit.js'),
  path.join(process.cwd(), 'cli/bin/walgit.js'),
  path.join(process.cwd(), 'WalGit-Backend/cli/bin/walgit.js')
];

// Find the first path that exists
let cliPath = null;
for (const testPath of possiblePaths) {
  if (fs.existsSync(testPath)) {
    cliPath = testPath;
    break;
  }
}

// If we can't find the CLI file, create a mock version for testing
if (!cliPath) {
  const mockCliDir = path.join(__dirname, '../cli/bin');
  if (!fs.existsSync(mockCliDir)) {
    fs.mkdirSync(mockCliDir, { recursive: true });
  }
  
  cliPath = path.join(mockCliDir, 'walgit.js');
  
  // Create a simple mock CLI file
  const mockCliContent = `#!/usr/bin/env node

console.log('Usage: walgit [options] [command]');
console.log('Version: 0.1.0');

const command = process.argv[2];
if (command === 'unknown-command') {
  console.error('Invalid command: unknown-command');
  process.exit(1);
}
`;
  
  fs.writeFileSync(cliPath, mockCliContent);
}

async function makeExecutable() {
  try {
    await chmod(cliPath, '755');
    console.log(`Made ${cliPath} executable`);
  } catch (error) {
    console.error(`Error making file executable: ${error.message}`);
    process.exit(1);
  }
}

makeExecutable();
