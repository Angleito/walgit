import chalk from 'chalk';
import { validateWalletConnection } from '../utils/auth.js';
import { cloneRepository } from '../utils/repository.js';

/**
 * Register the clone command
 * @param {import('commander').Command} program - Commander program instance
 */
export const cloneCommand = (program) => {
  program
    .command('clone <repo-url>')
    .description('Clone a repository from WalGit')
    .option('-b, --branch <branch>', 'Checkout a specific branch after clone')
    .option('-d, --directory <directory>', 'Clone into specific directory')
    .option('--depth <depth>', 'Create a shallow clone with specified depth')
    .option('--recursive', 'Initialize all submodules within the clone')
    .action(async (repoUrl, options) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        console.log(chalk.blue(`Cloning repository from ${repoUrl}...`));
        
        // Parse repository URL to extract owner and repo name
        // Format: walgit://<owner>/<repo> or https://walgit.io/<owner>/<repo>
        let owner, repoName;
        
        if (repoUrl.startsWith('walgit://')) {
          [owner, repoName] = repoUrl.replace('walgit://', '').split('/');
        } else if (repoUrl.includes('walgit.io')) {
          const urlParts = repoUrl.split('/');
          owner = urlParts[urlParts.length - 2];
          repoName = urlParts[urlParts.length - 1];
        } else {
          // Assume format is owner/repo
          [owner, repoName] = repoUrl.split('/');
        }
        
        if (!owner || !repoName) {
          throw new Error('Invalid repository URL format. Use walgit://<owner>/<repo> or <owner>/<repo>');
        }
        
        // Clone the repository
        await cloneRepository({
          owner,
          repoName,
          branch: options.branch,
          directory: options.directory,
          depth: options.depth ? parseInt(options.depth) : undefined,
          recursive: options.recursive || false
        });
        
        console.log(chalk.green(`Successfully cloned ${owner}/${repoName}`));
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
};
