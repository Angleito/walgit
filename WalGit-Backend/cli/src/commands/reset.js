import chalk from 'chalk';
import { validateWalletConnection } from '../utils/auth.js';
import { getCurrentRepository } from '../utils/config.js';
import { resetRepository } from '../utils/repository.js';

/**
 * Register the reset command
 * @param {import('commander').Command} program - Commander program instance
 */
export const resetCommand = (program) => {
  program
    .command('reset [commit] [paths...]')
    .description('Reset current HEAD to the specified state')
    .option('--soft', 'Do not touch the index file or the working tree')
    .option('--mixed', 'Reset the index but not the working tree (default)')
    .option('--hard', 'Reset both the index and working tree')
    .option('--merge', 'Reset the index and update the files in the working tree that are different between <commit> and HEAD')
    .option('--keep', 'Reset the index and update the files in the working tree that are different between <commit> and HEAD')
    .action(async (commit, paths, options) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        // Check if in a repository
        const repository = await getCurrentRepository();
        if (!repository) {
          throw new Error('Not in a WalGit repository');
        }
        
        // Determine reset mode
        let mode = 'mixed'; // Default
        if (options.soft) mode = 'soft';
        if (options.hard) mode = 'hard';
        if (options.merge) mode = 'merge';
        if (options.keep) mode = 'keep';
        
        // If paths are provided, it's a path reset (unstage)
        if (paths && paths.length > 0) {
          console.log(chalk.blue(`Unstaging files: ${paths.join(', ')}...`));
          
          await resetRepository({
            paths,
            commit: commit || 'HEAD'
          });
          
          console.log(chalk.green('Files unstaged'));
        } else {
          // It's a branch reset
          const targetCommit = commit || 'HEAD';
          console.log(chalk.blue(`Resetting to ${targetCommit} (${mode})...`));
          
          await resetRepository({
            commit: targetCommit,
            mode
          });
          
          console.log(chalk.green(`Reset to ${targetCommit} (${mode})`));
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
};
