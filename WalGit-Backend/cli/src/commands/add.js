import chalk from 'chalk';
import { validateWalletConnection } from '../utils/auth.js';
import { getCurrentRepository } from '../utils/config.js';
import { stageFiles } from '../utils/repository.js';

/**
 * Register the add command
 * @param {import('commander').Command} program - Commander program instance
 */
export const addCommand = (program) => {
  program
    .command('add [files...]')
    .description('Add file contents to the index')
    .option('-A, --all', 'Add all files (modified, deleted, and untracked)')
    .option('-u, --update', 'Add only modified and deleted files, not untracked')
    .option('-p, --patch', 'Interactively choose hunks to stage')
    .option('-f, --force', 'Allow adding otherwise ignored files')
    .action(async (files, options) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        // Check if in a repository
        const repository = await getCurrentRepository();
        if (!repository) {
          throw new Error('Not in a WalGit repository');
        }
        
        // Handle different add options
        let filesToStage = files;
        
        if (options.all) {
          console.log(chalk.blue('Adding all changes...'));
          filesToStage = ['.'];
        } else if (options.update) {
          console.log(chalk.blue('Adding modified and deleted files...'));
        } else if (files.length === 0) {
          throw new Error('No files specified. Use --all to add all files or specify files to add.');
        }
        
        // Stage the files
        const stagedFiles = await stageFiles({
          files: filesToStage,
          update: options.update || false,
          patch: options.patch || false,
          force: options.force || false
        });
        
        if (stagedFiles.length === 0) {
          console.log(chalk.yellow('No changes added to commit'));
        } else {
          console.log(chalk.green(`Added ${stagedFiles.length} file(s) to staging area`));
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
};
