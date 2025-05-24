#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { registerCommands } from '../src/commands/index.js';

// Set up CLI program
const setupCLI = () => {
  program
    .name('walgit')
    .description('Decentralized, self-controlled version control powered by Sui and Walrus')
    .version('0.1.0');

  // Add global working directory validation
  program.hook('preAction', (thisCommand, actionCommand) => {
    // Commands that don't require being in a working directory
    const globalCommands = [
      'init', 'clone', 'config', 'wallet', 'health', 'optimize', 
      'health:reset', 'health:failures', 'repo:list', 'help'
    ];
    
    const commandName = actionCommand.name();
    const isGlobalCommand = globalCommands.includes(commandName) || 
                           commandName.startsWith('repo:') ||
                           commandName.includes('help');
    
    // Validate working directory for non-global commands
    if (!isGlobalCommand) {
      const cwd = process.cwd();
      
      // Check if we're in a valid directory
      try {
        const stat = fs.statSync(cwd);
        if (!stat.isDirectory()) {
          console.error(chalk.red('Error: Current working directory is not accessible'));
          process.exit(1);
        }
      } catch (error) {
        console.error(chalk.red('Error: Cannot access current working directory:'), error.message);
        process.exit(1);
      }
      
      // For repository-specific commands, check if we're in a walgit repository
      const repoCommands = [
        'status', 'add', 'commit', 'push', 'pull', 'branch', 'checkout',
        'merge', 'log', 'tree', 'stash', 'pr', 'review'
      ];
      
      if (repoCommands.includes(commandName)) {
        const walgitDir = path.join(cwd, '.walgit');
        if (!fs.existsSync(walgitDir)) {
          console.error(chalk.red('Error: Not in a WalGit repository'));
          console.error(chalk.dim('Use "walgit init" to initialize a new repository'));
          process.exit(1);
        }
      }
    }
  });

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
