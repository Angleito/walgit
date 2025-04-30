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

if (!cliPath) {
  console.error(`Could not find walgit.js in any of the expected locations: ${possiblePaths.join(', ')}`);
  process.exit(1);
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
