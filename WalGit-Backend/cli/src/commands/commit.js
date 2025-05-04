import chalk from 'chalk';
import ora from 'ora';
import { createCommit, stageFiles } from '../utils/repository.js';
import { validateWalletConnection } from '../utils/auth.js';
import { getCurrentRepository } from '../utils/config.js';

/**
 * Commit changes to the repository
 * @param {import('commander').Command} program - Commander program instance
 */
export const commitCommand = (program) => {
  program
    .command('commit')
    .description('Commit changes to the repository')
    .option('-m, --message <message>', 'Commit message')
    .option('-a, --all', 'Stage all modified and deleted files', false)
    .option('--amend', 'Amend the previous commit', false)
    .option('-v, --verbose', 'Show verbose output with tree structure', false)
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
        
        // Check if commit message is provided
        if (!options.message && !options.amend) {
          console.error(chalk.red('Commit message is required (use -m "your message")'));
          process.exit(1);
        }
        
        // Stage files if --all option is used
        if (options.all) {
          const stagingSpinner = ora('Staging modified files...').start();
          await stageFiles({ all: true });
          stagingSpinner.succeed('Files staged');
        }
        
        // Create commit
        const commitSpinner = ora('Creating commit...').start();
        const commit = await createCommit({
          message: options.message,
          amend: options.amend,
          repositoryId: repository.id
        });
        
        commitSpinner.succeed(`Commit created: ${chalk.green(commit.id.substring(0, 8))}`);
        console.log(`Message: ${commit.message}`);
        console.log(`Files: ${commit.files.length} changed`);
        console.log(`Root tree: ${chalk.cyan(commit.rootTree.id.substring(0, 8))}`);
        console.log(`Trees: ${commit.trees.length}, Blobs: ${commit.blobs.length}`);
        
        // Display tree structure if requested
        if (options.verbose) {
          console.log('\nTree structure:');
          console.log(`${chalk.cyan(commit.rootTree.id.substring(0, 8))} (root)`);
          
          // Display root tree entries
          commit.rootTree.entries.forEach(entry => {
            const prefix = entry.type === 'tree' ? chalk.blue('tree') : chalk.green('blob');
            console.log(`  ${prefix} ${entry.name} (${entry.object_id.substring(0, 8)})`);
          });
        }
      } catch (error) {
        console.error(chalk.red('Failed to create commit:'), error.message);
        process.exit(1);
      }
    });
}; 