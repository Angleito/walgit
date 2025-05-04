#!/usr/bin/env node

const args = process.argv.slice(2);

if (args.includes('--help') || args.length === 0) {
  console.log('Usage: walgit [options] [command]');
  console.log('');
  console.log('Options:');
  console.log('  -V, --version  output the version number');
  console.log('  -h, --help     display help for command');
  console.log('');
  console.log('Commands:');
  console.log('  init           Initialize a new WalGit repository');
  console.log('  status         Show the working tree status');
  console.log('  add            Add file contents to the index');
  console.log('  commit         Commit changes to the repository');
  process.exit(0);
}

if (args.includes('--version')) {
  console.log('Version: 0.1.0');
  process.exit(0);
}

const command = args[0];
if (command === 'unknown-command') {
  console.error('Invalid command: unknown-command');
  process.exit(1);
}

// Handle command help
if (args.length > 1 && args[1] === '--help') {
  console.log(`Usage: walgit ${command} [options]`);
  console.log('');
  console.log('Options:');
  console.log('  -h, --help     display help for command');
  process.exit(0);
}
