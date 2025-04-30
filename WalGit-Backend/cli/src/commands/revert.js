import chalk from 'chalk';
import { validateWalletConnection } from '../utils/auth.js';
import { getCurrentRepository } from '../utils/config.js';
import { revertCommit } from '../utils/repository.js';

/**
 * Register the revert command
 * @param {import('commander').Command} program - Commander program instance
 */
export const revertCommand = (program) => {
  program
    .command('revert <commit>')
    .description('Revert some existing commits')
    .option('-n, --no-commit', 'Do not create a commit, just update the working tree and index')
    .option('-m, --mainline <parent-number>', 'Select parent number for merge commit')
    .option('--abort', 'Abort the current conflict resolution process')
    .option('--continue', 'Continue the current conflict resolution process')
    .action(async (commit, options) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        // Check if in a repository
        const repository = await getCurrentRepository();
        if (!repository) {
          throw new Error('Not in a WalGit repository');
        }
        
        // Handle revert abort
        if (options.abort) {
          console.log(chalk.blue('Aborting revert...'));
          await revertCommit({
            abort: true
          });
          console.log(chalk.green('Revert aborted'));
          return;
        }
        
        // Handle revert continue
        if (options.continue) {
          console.log(chalk.blue('Continuing revert...'));
          await revertCommit({
            continue: true
          });
          console.log(chalk.green('Revert completed'));
          return;
        }
        
        console.log(chalk.blue(`Reverting commit '${commit}'...`));
        
        // Perform revert
        const result = await revertCommit({
          commit,
          noCommit: !options.commit,
          mainline: options.mainline ? parseInt(options.mainline) : undefined
        });
        
        // Display revert results
        if (result.success) {
          if (options.commit) {
            console.log(chalk.green(`Created revert commit ${result.commitId.substring(0, 7)}`));
          } else {
            console.log(chalk.green('Changes from commit reverted in working tree and index'));
          }
          
          if (result.filesChanged > 0) {
            console.log(chalk.green(`${result.filesChanged} files changed, ${result.insertions} insertions(+), ${result.deletions} deletions(-)`));
          }
        } else if (result.conflicts) {
          console.log(chalk.yellow('Automatic revert failed; fix conflicts and then commit the result.'));
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
