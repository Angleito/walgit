import chalk from 'chalk';
import { validateWalletConnection } from '../utils/auth.js';
import { getCurrentRepository } from '../utils/config.js';
import { checkoutBranch, createBranch } from '../utils/repository.js';

/**
 * Register the checkout command
 * @param {import('commander').Command} program - Commander program instance
 */
export const checkoutCommand = (program) => {
  program
    .command('checkout <branch>')
    .description('Switch branches or restore working tree files')
    .option('-b, --create-branch', 'Create a new branch and switch to it')
    .option('-B, --force-create', 'Create/reset and checkout a branch')
    .option('-f, --force', 'Force checkout (throw away local modifications)')
    .option('--orphan', 'Create a new orphan branch')
    .action(async (branch, options) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        // Check if in a repository
        const repository = await getCurrentRepository();
        if (!repository) {
          throw new Error('Not in a WalGit repository');
        }
        
        // Handle branch creation with checkout
        if (options.createBranch || options.forceCreate) {
          console.log(chalk.blue(`Creating new branch '${branch}'...`));
          await createBranch(branch, {
            force: options.forceCreate || false,
            orphan: options.orphan || false
          });
        }
        
        // Checkout the branch
        console.log(chalk.blue(`Switching to branch '${branch}'...`));
        await checkoutBranch(branch, {
          force: options.force || false
        });
        
        console.log(chalk.green(`Switched to branch '${branch}'`));
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
};
