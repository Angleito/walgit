import chalk from 'chalk';
import { validateWalletConnection } from '../utils/auth.js';
import { getCurrentRepository } from '../utils/config.js';
import { fetchRemote } from '../utils/repository.js';

/**
 * Register the fetch command
 * @param {import('commander').Command} program - Commander program instance
 */
export const fetchCommand = (program) => {
  program
    .command('fetch [remote] [branch]')
    .description('Download objects and refs from another repository')
    .option('-a, --all', 'Fetch all remotes')
    .option('-p, --prune', 'Remove remote-tracking branches that no longer exist on the remote')
    .option('-t, --tags', 'Fetch all tags from the remote')
    .option('--depth <depth>', 'Limit fetching to the specified number of commits')
    .option('-f, --force', 'Force fetching even when it would not be a fast-forward')
    .action(async (remote, branch, options) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        // Check if in a repository
        const repository = await getCurrentRepository();
        if (!repository) {
          throw new Error('Not in a WalGit repository');
        }
        
        if (options.all) {
          console.log(chalk.blue('Fetching from all remotes...'));
        } else if (remote) {
          console.log(chalk.blue(`Fetching from remote '${remote}'${branch ? ` branch '${branch}'` : ''}...`));
        } else {
          console.log(chalk.blue('Fetching from origin...'));
          remote = 'origin';
        }
        
        // Fetch from remote
        const result = await fetchRemote({
          remote,
          branch,
          all: options.all || false,
          prune: options.prune || false,
          tags: options.tags || false,
          depth: options.depth ? parseInt(options.depth) : undefined,
          force: options.force || false
        });
        
        // Display fetch results
        if (result.newObjects === 0) {
          console.log(chalk.green('Already up to date.'));
        } else {
          console.log(chalk.green(`From ${result.remoteUrl}`));
          result.updatedRefs.forEach(ref => {
            console.log(` ${ref.type === 'fastForward' ? chalk.green('*') : ' '} ${ref.name}     ${ref.oldId.substring(0, 7)}..${ref.newId.substring(0, 7)}  ${ref.type}`);
          });
          console.log(chalk.green(`\nFetched ${result.newObjects} objects`));
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
};
