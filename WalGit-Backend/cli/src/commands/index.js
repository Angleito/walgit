import { initCommand } from './init.js';
import { commitCommand } from './commit.js';
import { pushCommand } from './push.js';
import { pullCommand } from './pull.js';
import { repoCommands } from './repo.js';
import { statusCommand } from './status.js';
import { addCommand } from './add.js';
import { branchCommand } from './branch.js';
import { checkoutCommand } from './checkout.js';
import { cloneCommand } from './clone.js';
import { remoteCommand } from './remote.js';
import { logCommand } from './log.js';
import { fetchCommand } from './fetch.js';
import { mergeCommand } from './merge.js';
import { tagCommand } from './tag.js';
import { resetCommand } from './reset.js';
import { revertCommand } from './revert.js';
import { treeCommand } from './tree.js';

/**
 * Register all commands with the CLI program
 * @param {import('commander').Command} program - Commander program instance
 */
export const registerCommands = (program) => {
  // Initialize a new repository
  initCommand(program);
  
  // Basic commands
  statusCommand(program);
  addCommand(program);
  commitCommand(program);
  
  // Branch management
  branchCommand(program);
  checkoutCommand(program);
  
  // Remote operations
  remoteCommand(program);
  fetchCommand(program);
  pushCommand(program);
  pullCommand(program);
  
  // History and changes
  logCommand(program);
  mergeCommand(program);
  resetCommand(program);
  revertCommand(program);
  treeCommand(program);
  
  // Repository operations
  cloneCommand(program);
  tagCommand(program);
  
  // Repository management commands
  repoCommands(program);
};
