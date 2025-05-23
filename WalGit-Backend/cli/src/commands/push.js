import chalk from 'chalk';
import ora from 'ora';
import { pushCommits } from '../utils/repository.js';
import { validateWalletConnection } from '../utils/auth.js';
import { getCurrentRepository } from '../utils/config.js';

/**
 * Push commits to remote storage
 * @param {import('commander').Command} program - Commander program instance
 */
export const pushCommand = (program) => {
  program
    .command('push')
    .description('Push commits to Walrus distributed storage')
    .option('-f, --force', 'Force push, overriding remote history', false)
    .option('-b, --branch <branch>', 'Specify branch to push (defaults to current branch)')
    .action(async (options) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        // Check if we're in a repository
        const repository = await getCurrentRepository();
        if (!repository) {
          console.error(chalk.red('Not in a WalGit repository'));
          process.exit(1);
        }
        
        const spinner = ora('Pushing commits to Walrus storage...').start();
        
        // Push commits
        const result = await pushCommits({
          repositoryId: repository.id,
          force: options.force,
          branch: options.branch
        });
        
        spinner.succeed(`Pushed ${chalk.green(result.commitCount)} commits to Walrus storage`);
        console.log(`Branch: ${chalk.yellow(result.branch)}`);
        console.log(`Repository: ${repository.name}`);
        
        if (result.newObjects && result.newObjects > 0) {
          console.log(`New objects: ${chalk.yellow(result.newObjects)}`);
        }
      } catch (error) {
        console.error(chalk.red('Failed to push commits:'), error.message);
        process.exit(1);
      }
    });
}; 