import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { 
  listRepositories, 
  getRepositoryDetails, 
  deleteRepository 
} from '../utils/repository.js';
import { validateWalletConnection } from '../utils/auth.js';

/**
 * Repository management commands
 * @param {import('commander').Command} program - Commander program instance
 */
export const repoCommands = (program) => {
  const repo = program
    .command('repo')
    .description('Repository management commands');

  // List repositories
  repo
    .command('list')
    .description('List all your repositories')
    .action(async () => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        const spinner = ora('Fetching repositories...').start();
        
        // Get repositories
        const repositories = await listRepositories();
        
        spinner.succeed(`Found ${chalk.green(repositories.length)} repositories`);
        
        if (repositories.length === 0) {
          console.log(chalk.dim('No repositories found. Create one with `walgit init`'));
          return;
        }
        
        // Display repositories
        repositories.forEach(repo => {
          console.log(`${chalk.yellow(repo.name)} (${repo.id.substring(0, 8)})`);
          console.log(`  Description: ${repo.description || 'No description'}`);
          console.log(`  Branch: ${repo.defaultBranch}`);
          console.log(`  Visibility: ${repo.isPrivate ? 'Private' : 'Public'}`);
          console.log(`  Last updated: ${new Date(repo.updatedAt).toLocaleString()}`);
          console.log(); // Empty line between repos
        });
      } catch (error) {
        console.error(chalk.red('Failed to list repositories:'), error.message);
        process.exit(1);
      }
    });

  // Show repository details
  repo
    .command('show')
    .description('Show repository details')
    .argument('[repo_id]', 'Repository ID or name')
    .action(async (repoId) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        const spinner = ora('Fetching repository details...').start();
        
        // Get repository details
        const repository = await getRepositoryDetails(repoId);
        
        spinner.succeed(`Repository: ${chalk.green(repository.name)}`);
        
        console.log(`ID: ${repository.id}`);
        console.log(`Description: ${repository.description || 'No description'}`);
        console.log(`Default branch: ${repository.defaultBranch}`);
        console.log(`Visibility: ${repository.isPrivate ? 'Private' : 'Public'}`);
        console.log(`Created: ${new Date(repository.createdAt).toLocaleString()}`);
        console.log(`Last updated: ${new Date(repository.updatedAt).toLocaleString()}`);
        
        console.log('\nBranches:');
        repository.branches.forEach(branch => {
          console.log(`  ${branch.name} (${branch.commitCount} commits)`);
        });
        
        console.log('\nLatest commits:');
        repository.commits.forEach(commit => {
          console.log(`  ${commit.id.substring(0, 8)} - ${commit.message}`);
          console.log(`    Author: ${commit.author}`);
          console.log(`    Date: ${new Date(commit.timestamp).toLocaleString()}`);
        });
      } catch (error) {
        console.error(chalk.red('Failed to get repository details:'), error.message);
        process.exit(1);
      }
    });

  // Delete repository
  repo
    .command('delete')
    .description('Delete a repository')
    .argument('<repo_id>', 'Repository ID or name')
    .option('-f, --force', 'Force deletion without confirmation', false)
    .action(async (repoId, options) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        // Get repository details for confirmation
        const repository = await getRepositoryDetails(repoId);
        
        // Confirm deletion unless force option is provided
        if (!options.force) {
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Are you sure you want to delete the repository "${repository.name}"? This action cannot be undone.`,
              default: false
            }
          ]);
          
          if (!confirm) {
            console.log(chalk.yellow('Repository deletion canceled'));
            return;
          }
        }
        
        const spinner = ora(`Deleting repository ${repository.name}...`).start();
        
        // Delete repository
        await deleteRepository(repository.id);
        
        spinner.succeed(`Repository ${chalk.green(repository.name)} has been deleted`);
      } catch (error) {
        console.error(chalk.red('Failed to delete repository:'), error.message);
        process.exit(1);
      }
    });
}; 