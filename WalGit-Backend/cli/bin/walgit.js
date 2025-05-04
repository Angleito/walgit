#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { registerCommands } from '../src/commands/index.js';

// Set up CLI program
const setupCLI = () => {
  program
    .name('walgit')
    .description('Decentralized, self-controlled version control powered by Sui and Walrus')
    .version('0.1.0');

  // Register all commands
  registerCommands(program);

  // Handle unknown commands
  program.on('command:*', () => {
    console.error(chalk.red('Invalid command: %s'), program.args.join(' '));
    console.log(`See ${chalk.yellow('walgit --help')} for a list of available commands.`);
    process.exit(1);
  });

  return program;
};

// Initialize and run CLI
const run = async () => {
  try {
    const cli = setupCLI();
    await cli.parseAsync(process.argv);
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
};

run(); 
