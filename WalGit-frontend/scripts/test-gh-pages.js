#!/usr/bin/env node

// Since the package.json has type: "module", we need to use ESM syntax
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Building project for GitHub Pages...');
execSync('npm run build', { stdio: 'inherit' });

console.log('\n📁 Preparing to serve from /walgit/ path...');

// Find an available port for serving
const port = 5173;

console.log(`\n🌐 Starting server with the correct base path...`);
console.log(`\n🔍 Open http://localhost:${port}/walgit/ in your browser to test`);
console.log(`\n⚠️ This will simulate the GitHub Pages environment with base path "/walgit/"`);

// Use vite preview which respects the base path configuration
try {
  execSync(`npm run preview -- --port ${port}`, { stdio: 'inherit' });
} catch (e) {
  console.error('Error running preview server:', e);
  console.log('\n🔍 Alternative: Run the following command:');
  console.log(`   npm run preview -- --port ${port}`);
}
