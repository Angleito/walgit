import chalk from 'chalk';
import { validateWalletConnection } from '../utils/auth.js';
import { getCurrentRepository } from '../utils/config.js';
import { listBranches, createBranch, deleteBranch, renameBranch } from '../utils/repository.js';

/**
 * Register the branch command
 * @param {import('commander').Command} program - Commander program instance
 */
export const branchCommand = (program) => {
  program
    .command('branch')
    .description('List, create, or delete branches')
    .option('-a, --all', 'List both remote-tracking and local branches')
    .option('-r, --remotes', 'List the remote-tracking branches')
    .option('-d, --delete <branch>', 'Delete a branch')
    .option('-m, --move <oldBranch> <newBranch>', 'Rename a branch')
    .option('-c, --create <branch>', 'Create a new branch')
    .option('--list', 'List branches (default when no options are provided)')
    .action(async (options) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        // Check if in a repository
        const repository = await getCurrentRepository();
        if (!repository) {
          throw new Error('Not in a WalGit repository');
        }
        
        // Handle branch deletion
        if (options.delete) {
          await deleteBranch(options.delete);
          console.log(chalk.green(`Deleted branch ${options.delete}`));
          return;
        }
        
        // Handle branch renaming
        if (options.move && options.move.length === 2) {
          const [oldBranch, newBranch] = options.move;
          await renameBranch(oldBranch, newBranch);
          console.log(chalk.green(`Renamed branch ${oldBranch} to ${newBranch}`));
          return;
        }
        
        // Handle branch creation
        if (options.create) {
          await createBranch(options.create);
          console.log(chalk.green(`Created branch ${options.create}`));
          return;
        }
        
        // Default: list branches
        const branches = await listBranches({
          all: options.all || false,
          remotes: options.remotes || false
        });
        
        // Display branches
        branches.forEach(branch => {
          if (branch.current) {
            console.log(chalk.green(`* ${branch.name}`));
          } else {
            console.log(`  ${branch.name}`);
          }
        });
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
};
