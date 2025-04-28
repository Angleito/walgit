import { initCommand } from './init.js';
import { commitCommand } from './commit.js';
import { pushCommand } from './push.js';
import { pullCommand } from './pull.js';
import { repoCommands } from './repo.js';

/**
 * Register all commands with the CLI program
 * @param {import('commander').Command} program - Commander program instance
 */
export const registerCommands = (program) => {
  // Initialize a new repository
  initCommand(program);
  
  // Commit changes
  commitCommand(program);
  
  // Push to remote
  pushCommand(program);
  
  // Pull from remote
  pullCommand(program);
  
  // Repository management commands
  repoCommands(program);
}; 