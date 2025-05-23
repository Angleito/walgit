import chalk from 'chalk';
import { validateWalletConnection } from '../utils/auth.js';
import { getCurrentRepository } from '../utils/config.js';
import { getRepositoryStatus } from '../utils/repository.js';

/**
 * Register the status command
 * @param {import('commander').Command} program - Commander program instance
 */
export const statusCommand = (program) => {
  program
    .command('status')
    .description('Show the working tree status')
    .option('-s, --short', 'Give the output in the short format')
    .option('-b, --branch', 'Show branch information')
    .option('-u, --untracked-files [mode]', 'Show untracked files', 'normal')
    .action(async (options) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        // Check if in a repository
        const repository = await getCurrentRepository();
        if (!repository) {
          throw new Error('Not in a WalGit repository');
        }
        
        // Get repository status
        const status = await getRepositoryStatus({
          short: options.short || false,
          branch: options.branch || false,
          untrackedFiles: options.untrackedFiles
        });
        
        // Display branch information
        if (options.branch || !options.short) {
          console.log(chalk.blue(`On branch ${status.currentBranch}`));
          
          if (status.upstream) {
            console.log(chalk.blue(`Your branch is ${status.relation} '${status.upstream}' by ${status.commits} commit(s).`));
          }
        }
        
        // Display status information
        if (status.stagedChanges.length === 0 && status.untrackedFiles.length === 0) {
          console.log(chalk.green('Nothing to commit, working tree clean'));
        } else {
          // In "always-staged" paradigm, all tracked changes are staged
          if (status.stagedChanges.length > 0) {
            console.log(chalk.green('\nChanges to be committed:'));
            console.log(chalk.gray('  (use "walgit commit -m <message>" to commit)'));
            status.stagedChanges.forEach(file => {
              console.log(`  ${chalk.green(file.status)}:  ${file.path}`);
            });
          }
          
          // Display ignored/untracked files
          if (status.untrackedFiles.length > 0) {
            console.log(chalk.gray('\nIgnored files:'));
            console.log(chalk.gray('  (use "walgit add --force <file>..." to track)'));
            status.untrackedFiles.forEach(file => {
              console.log(`  ${chalk.gray('ignored')}:  ${file}`);
            });
          }
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
};
