import chalk from 'chalk';
import ora from 'ora';
import { pullCommits } from '../utils/repository.js';
import { validateWalletConnection } from '../utils/auth.js';
import { getCurrentRepository } from '../utils/config.js';

/**
 * Pull commits from remote storage
 * @param {import('commander').Command} program - Commander program instance
 */
export const pullCommand = (program) => {
  program
    .command('pull')
    .description('Pull commits from Walrus distributed storage')
    .option('-b, --branch <branch>', 'Specify branch to pull (defaults to current branch)')
    .option('--no-verify', 'Skip verification of signatures')
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
        
        const spinner = ora('Pulling commits from Walrus storage...').start();
        
        // Pull commits
        const result = await pullCommits({
          repositoryId: repository.id,
          branch: options.branch,
          verify: options.verify
        });
        
        if (result.commitCount === 0) {
          spinner.info('Already up to date');
        } else {
          spinner.succeed(`Pulled ${chalk.green(result.commitCount)} commits from Walrus storage`);
          console.log(`Branch: ${chalk.yellow(result.branch)}`);
          
          if (result.newFiles && result.newFiles > 0) {
            console.log(`New files: ${chalk.yellow(result.newFiles)}`);
          }
          
          if (result.conflicts && result.conflicts.length > 0) {
            console.log(chalk.yellow(`Conflicts detected in ${result.conflicts.length} files:`));
            result.conflicts.forEach(file => {
              console.log(chalk.dim(`  - ${file}`));
            });
            console.log(chalk.dim('Resolve conflicts and then commit the result'));
          }
        }
      } catch (error) {
        console.error(chalk.red('Failed to pull commits:'), error.message);
        process.exit(1);
      }
    });
}; 