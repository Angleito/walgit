import chalk from 'chalk';
import { validateWalletConnection } from '../utils/auth.js';
import { getCurrentRepository } from '../utils/config.js';
import { 
  createStash, 
  getStashList, 
  applyStash, 
  dropStash, 
  showStash,
  createBranchFromStash
} from '../utils/stash-manager.js';

/**
 * Format a date as a relative time string
 * @param {string} dateStr - ISO date string 
 * @returns {string} Formatted relative time
 */
const formatRelativeTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) return `${diffSec} seconds ago`;
  
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minutes ago`;
  
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hours ago`;
  
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} days ago`;
  
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} months ago`;
  
  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear} years ago`;
};

/**
 * Register the stash command
 * @param {import('commander').Command} program - Commander program instance
 */
export const stashCommand = (program) => {
  const stash = program
    .command('stash')
    .description('Stash changes in a working directory');

  // stash save
  stash
    .command('save [message]')
    .description('Save changes in a working directory to the stash')
    .option('-u, --include-untracked', 'Include untracked files in stash')
    .option('-a, --all', 'Include both staged and unstaged changes')
    .action(async (message, options) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        // Check if in a repository
        const repository = await getCurrentRepository();
        if (!repository) {
          throw new Error('Not in a WalGit repository');
        }
        
        // Save changes to stash
        const stashResult = await createStash({
          message: message,
          includeUntracked: options.includeUntracked || false
        });
        
        console.log(chalk.green(`Saved working directory and index state as: ${stashResult.message}`));
        console.log(chalk.green(`Stash ID: ${chalk.white(stashResult.id)}`));
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
  
  // stash list
  stash
    .command('list')
    .description('List saved stashes')
    .action(async () => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        // Check if in a repository
        const repository = await getCurrentRepository();
        if (!repository) {
          throw new Error('Not in a WalGit repository');
        }
        
        // Get stash list
        const stashList = getStashList();
        
        if (stashList.length === 0) {
          console.log(chalk.yellow('No stashes found'));
          return;
        }
        
        console.log(chalk.blue('Stash List:'));
        
        stashList.forEach((stash, index) => {
          const stashRef = `stash@{${index}}`;
          const timeAgo = formatRelativeTime(stash.timestamp);
          const formattedDate = new Date(stash.timestamp).toLocaleString();
          
          console.log(
            chalk.green(stashRef),
            chalk.white(`on ${stash.branch}:`),
            chalk.yellow(stash.message),
            chalk.gray(`(${timeAgo})`)
          );
          console.log(
            chalk.gray(`    ID: ${stash.id}`),
            chalk.gray(`Created: ${formattedDate}`),
            chalk.gray(`Files: ${stash.filesCount}`)
          );
        });
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
  
  // stash apply
  stash
    .command('apply [stash-id]')
    .description('Apply a stash to the working directory')
    .option('--index', 'Also apply changes to the index')
    .action(async (stashId, options) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        // Check if in a repository
        const repository = await getCurrentRepository();
        if (!repository) {
          throw new Error('Not in a WalGit repository');
        }
        
        // Apply stash
        const applyResult = await applyStash({
          stashId: stashId,
          index: options.index || false
        });
        
        if (applyResult.results.conflicts.length > 0) {
          console.log(chalk.yellow('Conflicts found when applying stash:'));
          applyResult.results.conflicts.forEach(conflict => {
            console.log(chalk.yellow(`  - ${conflict}`));
          });
        }
        
        if (applyResult.results.errors.length > 0) {
          console.log(chalk.red('Errors found when applying stash:'));
          applyResult.results.errors.forEach(error => {
            console.log(chalk.red(`  - ${error.path}: ${error.error}`));
          });
        }
        
        console.log(chalk.green(`Applied stash: ${applyResult.stash.message}`));
        console.log(chalk.green(`  - Files applied: ${applyResult.results.applied.length}`));
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
  
  // stash pop
  stash
    .command('pop [stash-id]')
    .description('Apply a stash to the working directory and remove it from the stash list')
    .option('--index', 'Also apply changes to the index')
    .action(async (stashId, options) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        // Check if in a repository
        const repository = await getCurrentRepository();
        if (!repository) {
          throw new Error('Not in a WalGit repository');
        }
        
        // Apply stash and remove it
        const applyResult = await applyStash({
          stashId: stashId,
          index: options.index || false,
          pop: true
        });
        
        if (applyResult.results.conflicts.length > 0) {
          console.log(chalk.yellow('Conflicts found when applying stash:'));
          applyResult.results.conflicts.forEach(conflict => {
            console.log(chalk.yellow(`  - ${conflict}`));
          });
        }
        
        if (applyResult.results.errors.length > 0) {
          console.log(chalk.red('Errors found when applying stash:'));
          applyResult.results.errors.forEach(error => {
            console.log(chalk.red(`  - ${error.path}: ${error.error}`));
          });
        }
        
        console.log(chalk.green(`Applied stash: ${applyResult.stash.message}`));
        console.log(chalk.green(`  - Files applied: ${applyResult.results.applied.length}`));
        console.log(chalk.green('Dropped stash after applying'));
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
  
  // stash drop
  stash
    .command('drop [stash-id]')
    .description('Remove a stash from the stash list')
    .option('--all', 'Remove all stashes')
    .action(async (stashId, options) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        // Check if in a repository
        const repository = await getCurrentRepository();
        if (!repository) {
          throw new Error('Not in a WalGit repository');
        }
        
        // Drop stash
        await dropStash({
          stashId: stashId,
          all: options.all || false
        });
        
        if (options.all) {
          console.log(chalk.green('Dropped all stashes'));
        } else {
          console.log(chalk.green(`Dropped stash ${stashId || '(most recent)'}`));
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
  
  // stash show
  stash
    .command('show [stash-id]')
    .description('Show the changes recorded in a stash')
    .action(async (stashId) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        // Check if in a repository
        const repository = await getCurrentRepository();
        if (!repository) {
          throw new Error('Not in a WalGit repository');
        }
        
        // Show stash details
        const stashDetails = await showStash({
          stashId: stashId
        });
        
        console.log(chalk.blue(`Stash: ${stashDetails.message}`));
        console.log(chalk.blue(`Created: ${new Date(stashDetails.timestamp).toLocaleString()}`));
        console.log(chalk.blue(`Branch: ${stashDetails.branch}`));
        console.log(chalk.blue(`ID: ${stashDetails.id}`));
        
        console.log(chalk.green('\nStaged changes:'));
        Object.keys(stashDetails.stagedChanges).forEach(file => {
          console.log(`  ${chalk.green(stashDetails.stagedChanges[file].status || 'modified')}:  ${file}`);
        });
        
        console.log(chalk.yellow('\nUnstaged changes:'));
        Object.keys(stashDetails.unstagedChanges).forEach(file => {
          console.log(`  ${chalk.yellow(stashDetails.unstagedChanges[file].status || 'modified')}:  ${file}`);
        });
        
        if (stashDetails.untrackedFiles) {
          console.log(chalk.red('\nUntracked files:'));
          Object.keys(stashDetails.untrackedFiles).forEach(file => {
            console.log(`  ${chalk.red('untracked')}:  ${file}`);
          });
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
  
  // stash branch
  stash
    .command('branch <branch-name> [stash-id]')
    .description('Create a new branch from a stash')
    .action(async (branchName, stashId) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        // Check if in a repository
        const repository = await getCurrentRepository();
        if (!repository) {
          throw new Error('Not in a WalGit repository');
        }
        
        // Create branch from stash
        const result = await createBranchFromStash({
          branchName: branchName,
          stashId: stashId
        });
        
        console.log(chalk.green(`Created branch '${branchName}' and applied stash`));
        console.log(chalk.green(`  - Files applied: ${result.applied.applied.length}`));
        
        if (result.applied.conflicts.length > 0) {
          console.log(chalk.yellow('Conflicts found when applying stash:'));
          result.applied.conflicts.forEach(conflict => {
            console.log(chalk.yellow(`  - ${conflict}`));
          });
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
  
  // stash with no subcommand acts as 'stash save'
  stash
    .action(async () => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        // Check if in a repository
        const repository = await getCurrentRepository();
        if (!repository) {
          throw new Error('Not in a WalGit repository');
        }
        
        // Save changes to stash
        const stashResult = await createStash({
          includeUntracked: false
        });
        
        console.log(chalk.green(`Saved working directory and index state: ${stashResult.message}`));
        console.log(chalk.green(`Stash ID: ${chalk.white(stashResult.id)}`));
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });

  return stash;
};