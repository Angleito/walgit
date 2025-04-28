import chalk from 'chalk';
import ora from 'ora';
import { createRepository } from '../utils/repository.js';
import { validateWalletConnection } from '../utils/auth.js';

/**
 * Initialize a new WalGit repository
 * @param {import('commander').Command} program - Commander program instance
 */
export const initCommand = (program) => {
  program
    .command('init')
    .description('Initialize a new WalGit repository')
    .option('-n, --name <name>', 'Repository name')
    .option('-d, --description <description>', 'Repository description')
    .option('-p, --private', 'Create private repository', false)
    .action(async (options) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        const spinner = ora('Initializing repository...').start();
        
        // Create new repository
        const repoData = await createRepository({
          name: options.name || process.cwd().split('/').pop(),
          description: options.description || '',
          isPrivate: options.private,
        });
        
        spinner.succeed(`Repository initialized: ${chalk.green(repoData.name)}`);
        console.log(`Repository ID: ${chalk.yellow(repoData.id)}`);
        console.log(chalk.dim('Run `walgit status` to verify repository status'));
      } catch (error) {
        console.error(chalk.red('Failed to initialize repository:'), error.message);
        process.exit(1);
      }
    });
}; 