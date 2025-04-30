import chalk from 'chalk';
import { validateWalletConnection } from '../utils/auth.js';
import { getCurrentRepository } from '../utils/config.js';
import { addRemote, removeRemote, listRemotes, setRemoteUrl } from '../utils/repository.js';

/**
 * Register the remote command
 * @param {import('commander').Command} program - Commander program instance
 */
export const remoteCommand = (program) => {
  const remote = program
    .command('remote')
    .description('Manage set of tracked repositories');
  
  // List remotes
  remote
    .command('list')
    .alias('ls')
    .description('List remote connections')
    .option('-v, --verbose', 'Be verbose and show remote url')
    .action(async (options) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        // Check if in a repository
        const repository = await getCurrentRepository();
        if (!repository) {
          throw new Error('Not in a WalGit repository');
        }
        
        // List remotes
        const remotes = await listRemotes();
        
        if (remotes.length === 0) {
          console.log(chalk.yellow('No remotes configured'));
        } else {
          remotes.forEach(remote => {
            if (options.verbose) {
              console.log(`${remote.name}\t${remote.url} (fetch)`);
              console.log(`${remote.name}\t${remote.pushUrl || remote.url} (push)`);
            } else {
              console.log(remote.name);
            }
          });
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
  
  // Add remote
  remote
    .command('add <name> <url>')
    .description('Add a remote')
    .option('-f, --fetch', 'Fetch the remote after adding')
    .option('-t, --track <branch>', 'Track specific branch instead of default')
    .action(async (name, url, options) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        // Check if in a repository
        const repository = await getCurrentRepository();
        if (!repository) {
          throw new Error('Not in a WalGit repository');
        }
        
        // Add remote
        await addRemote(name, url, {
          fetch: options.fetch || false,
          track: options.track
        });
        
        console.log(chalk.green(`Added remote '${name}' with url '${url}'`));
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
  
  // Remove remote
  remote
    .command('remove <name>')
    .alias('rm')
    .description('Remove a remote')
    .action(async (name) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        // Check if in a repository
        const repository = await getCurrentRepository();
        if (!repository) {
          throw new Error('Not in a WalGit repository');
        }
        
        // Remove remote
        await removeRemote(name);
        
        console.log(chalk.green(`Removed remote '${name}'`));
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
  
  // Set URL for remote
  remote
    .command('set-url <name> <url>')
    .description('Change the url for a remote')
    .option('--push', 'Set push url instead of fetch url')
    .option('--add', 'Add new url instead of changing existing')
    .action(async (name, url, options) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        // Check if in a repository
        const repository = await getCurrentRepository();
        if (!repository) {
          throw new Error('Not in a WalGit repository');
        }
        
        // Set remote URL
        await setRemoteUrl(name, url, {
          push: options.push || false,
          add: options.add || false
        });
        
        console.log(chalk.green(`Updated remote '${name}' url to '${url}'`));
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
  
  return remote;
};
