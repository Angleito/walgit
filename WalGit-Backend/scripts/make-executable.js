import { chmod } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.join(__dirname, '../cli/bin/walgit.js');

async function makeExecutable() {
  try {
    if (fs.existsSync(cliPath)) {
      await chmod(cliPath, '755');
      console.log(`Made ${cliPath} executable`);
    } else {
      console.error(`Error: CLI file not found at ${cliPath}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error making file executable: ${error.message}`);
    process.exit(1);
  }
}

makeExecutable();
