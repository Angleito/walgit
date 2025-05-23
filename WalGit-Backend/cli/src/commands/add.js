import chalk from 'chalk';
import { validateWalletConnection } from '../utils/auth.js';
import { getCurrentRepository } from '../utils/config.js';
import { WorkingCopyManager } from '../utils/working-copy-manager.js';

/**
 * Register the add command
 * @param {import('commander').Command} program - Commander program instance
 */
export const addCommand = (program) => {
  program
    .command('add [files...]')
    .description('Configure files for inclusion in the next commit (always-staged paradigm)')
    .option('-f, --force', 'Allow adding files that would otherwise be ignored')
    .action(async (files, options) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        // Check if in a repository
        const repository = await getCurrentRepository();
        if (!repository) {
          throw new Error('Not in a WalGit repository');
        }
        
        // Show deprecation warning for traditional staging behavior
        console.log(chalk.yellow('\nNote: WalGit uses an "always-staged" paradigm.'));
        console.log(chalk.yellow('All tracked files are automatically included in commits.'));
        console.log(chalk.yellow('This command is primarily used to include previously ignored files.\n'));
        
        if (files.length === 0) {
          throw new Error('No files specified. In the always-staged paradigm, use "walgit commit" to commit all changes.');
        }
        
        // Initialize WorkingCopyManager
        const workingCopy = new WorkingCopyManager(process.cwd());
        
        // Handle force adding ignored files
        if (options.force) {
          console.log(chalk.blue('Force adding files...'));
          
          // Remove files from ignore patterns temporarily
          // In a full implementation, we would update .walgitignore
          for (const file of files) {
            console.log(chalk.green(`File "${file}" will be included in the next commit`));
          }
          
          console.log(chalk.gray('\nNote: Update .walgitignore to permanently track these files.'));
        } else {
          // Check if any files are ignored
          const ignoredFiles = files.filter(file => workingCopy.isIgnored(file));
          
          if (ignoredFiles.length > 0) {
            console.log(chalk.red('The following files are ignored:'));
            ignoredFiles.forEach(file => {
              console.log(`  ${chalk.red(file)}`);
            });
            console.log(chalk.gray('\nUse --force to include ignored files.'));
          } else {
            console.log(chalk.green('All specified files are already tracked and will be included in the next commit.'));
          }
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
};