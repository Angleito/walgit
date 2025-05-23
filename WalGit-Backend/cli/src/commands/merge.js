import chalk from 'chalk';
import { validateWalletConnection } from '../utils/auth.js';
import { getCurrentRepository } from '../utils/config.js';
import { mergeChanges } from '../utils/repository.js';

/**
 * Register the merge command
 * @param {import('commander').Command} program - Commander program instance
 */
export const mergeCommand = (program) => {
  program
    .command('merge <branch>')
    .description('Join two or more development histories together')
    .option('--no-ff', 'Create a merge commit even when the merge resolves as a fast-forward')
    .option('--ff-only', 'Refuse to merge unless the current branch head is already up to date or the merge can be resolved as a fast-forward')
    .option('-m, --message <message>', 'Set the commit message for the merge commit')
    .option('--abort', 'Abort the current conflict resolution process')
    .option('--continue', 'Continue the current conflict resolution process')
    .action(async (branch, options) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        // Check if in a repository
        const repository = await getCurrentRepository();
        if (!repository) {
          throw new Error('Not in a WalGit repository');
        }
        
        // Handle merge abort
        if (options.abort) {
          console.log(chalk.blue('Aborting merge...'));
          await mergeChanges({
            abort: true
          });
          console.log(chalk.green('Merge aborted'));
          return;
        }
        
        // Handle merge continue
        if (options.continue) {
          console.log(chalk.blue('Continuing merge...'));
          await mergeChanges({
            continue: true
          });
          console.log(chalk.green('Merge completed'));
          return;
        }
        
        console.log(chalk.blue(`Merging branch '${branch}'...`));
        
        // Perform merge
        const result = await mergeChanges({
          branch,
          noFastForward: options.noFf || false,
          fastForwardOnly: options.ffOnly || false,
          message: options.message
        });
        
        // Display merge results
        if (result.success) {
          if (result.fastForward) {
            console.log(chalk.green(`Fast-forward merge to ${result.commitId.substring(0, 7)}`));
          } else {
            console.log(chalk.green(`Merge completed with commit ${result.commitId.substring(0, 7)}`));
          }
          
          if (result.filesChanged > 0) {
            console.log(chalk.green(`${result.filesChanged} files changed, ${result.insertions} insertions(+), ${result.deletions} deletions(-)`));
          }
        } else if (result.conflicts) {
          console.log(chalk.yellow('Automatic merge failed; fix conflicts and then commit the result.'));
          console.log(chalk.yellow(`Conflicts in ${result.conflicts.length} files:`));
          result.conflicts.forEach(file => {
            console.log(chalk.yellow(`  ${file}`));
          });
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
};
