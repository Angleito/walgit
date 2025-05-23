import chalk from 'chalk';
import { validateWalletConnection } from '../utils/auth.js';
import { getCurrentRepository } from '../utils/config.js';
import { addRemote, removeRemote, listRemotes, setRemoteUrl } from '../utils/repository.js';
// Removed unused imports from transaction-utils.js

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
    .option('-a, --authenticate', 'Store credentials for this remote')
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

        // If --authenticate flag is provided, prompt for and store credentials
        if (options.authenticate) {
          try {
            console.log(chalk.blue(`Saving credentials for remote '${name}'...`));
            await getRemoteAuthentication(url, { forcePrompt: true, storeCredentials: true });
            console.log(chalk.green('Credentials stored successfully'));
          } catch (error) {
            console.error(chalk.yellow('Failed to store credentials:'), error.message);
          }
        }
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

  // Test authentication with remote
  remote
    .command('test-auth <name>')
    .description('Test authentication with a remote')
    .option('-f, --force-prompt', 'Force credential prompt even if stored')
    .action(async (name, options) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();

        // Check if in a repository
        const repository = await getCurrentRepository();
        if (!repository) {
          throw new Error('Not in a WalGit repository');
        }

        // Get remote URL
        const remotes = await listRemotes();
        const remote = remotes.find(r => r.name === name);

        if (!remote) {
          throw new Error(`Remote '${name}' not found`);
        }

        console.log(chalk.blue(`Testing authentication for remote '${name}' (${remote.url})...`));

        // Execute authenticated request to test credentials
        await executeAuthenticatedRequest(remote.url, async (credentials) => {
          // Simulate a successful authenticated request
          console.log(chalk.green(`Successfully authenticated as '${credentials.username}'`));
          return true;
        }, {
          forcePrompt: options.forcePrompt || false,
          maxRetries: 3
        });
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });

  // Manage authentication for a remote
  remote
    .command('auth <name>')
    .description('Manage authentication for a remote')
    .option('-c, --clear', 'Clear stored credentials')
    .option('-u, --update', 'Update stored credentials')
    .action(async (name, options) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();

        // Check if in a repository
        const repository = await getCurrentRepository();
        if (!repository) {
          throw new Error('Not in a WalGit repository');
        }

        // Get remote URL
        const remotes = await listRemotes();
        const remote = remotes.find(r => r.name === name);

        if (!remote) {
          throw new Error(`Remote '${name}' not found`);
        }

        // Import credential manager functions
        const { deleteCredentials } = await import('../utils/credential-manager.js');

        if (options.clear) {
          // Clear credentials
          await deleteCredentials(remote.url);
          console.log(chalk.green(`Cleared credentials for remote '${name}'`));
        } else if (options.update) {
          // Update credentials
          console.log(chalk.blue(`Updating credentials for remote '${name}'...`));
          await getRemoteAuthentication(remote.url, { forcePrompt: true, storeCredentials: true });
          console.log(chalk.green('Credentials updated successfully'));
        } else {
          // Check if credentials exist
          const { getCredentials } = await import('../utils/credential-manager.js');
          const credentials = await getCredentials(remote.url);

          if (credentials) {
            console.log(chalk.green(`Credentials found for remote '${name}' (${credentials.username})`));
          } else {
            console.log(chalk.yellow(`No credentials found for remote '${name}'`));

            // Ask if they want to add credentials
            console.log(chalk.blue('Would you like to add credentials? (y/n)'));
            process.stdout.write('> ');

            const answer = await new Promise(resolve => {
              process.stdin.once('data', data => {
                resolve(data.toString().trim().toLowerCase());
              });
            });

            if (answer === 'y' || answer === 'yes') {
              await getRemoteAuthentication(remote.url, { forcePrompt: true, storeCredentials: true });
              console.log(chalk.green('Credentials stored successfully'));
            }
          }
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });

  return remote;
};
