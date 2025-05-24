import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { URL } from 'url';
import {
  loadCredentialConfig,
  saveCredentialConfig,
  getCredentials,
  storeCredentials,
  deleteCredentials,
  askForCredentials
} from '../utils/credential-manager.js';

/**
 * Register the credential command
 * @param {import('commander').Command} program - Commander program instance
 */
export const credentialCommand = (program) => {
  const credential = program
    .command('credential')
    .description('Manage credential helpers for remote operations');
  
  // List credential configuration
  credential
    .command('list')
    .alias('ls')
    .description('List credential helper configuration')
    .action(async () => {
      try {
        const config = loadCredentialConfig();
        
        console.log(chalk.cyan('Current credential helper:'), chalk.green(config.helper));
        console.log(chalk.cyan('\nAvailable helpers:'));
        
        Object.entries(config.helpers).forEach(([name, settings]) => {
          const status = settings.enabled ? chalk.green('enabled') : chalk.gray('disabled');
          
          if (name === 'cache' && settings.enabled) {
            console.log(`  ${name}: ${status} (timeout: ${settings.timeout} seconds)`);
          } else {
            console.log(`  ${name}: ${status}`);
          }
        });
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
  
  // Set the credential helper
  credential
    .command('use <helper>')
    .description('Set the credential helper to use')
    .action(async (helper) => {
      try {
        const config = loadCredentialConfig();
        
        if (!config.helpers[helper]) {
          throw new Error(`Unknown credential helper: ${helper}`);
        }
        
        if (!config.helpers[helper].enabled) {
          throw new Error(`Credential helper '${helper}' is disabled on this platform`);
        }
        
        config.helper = helper;
        saveCredentialConfig(config);
        
        console.log(chalk.green(`Credential helper set to '${helper}'`));
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
  
  // Configure the cache timeout
  credential
    .command('cache-timeout <seconds>')
    .description('Set the credential cache timeout in seconds')
    .action(async (seconds) => {
      try {
        const timeout = parseInt(seconds, 10);
        
        if (isNaN(timeout) || timeout < 0) {
          throw new Error('Timeout must be a positive number');
        }
        
        const config = loadCredentialConfig();
        config.helpers.cache.timeout = timeout;
        saveCredentialConfig(config);
        
        console.log(chalk.green(`Credential cache timeout set to ${timeout} seconds`));
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
  
  // Store credentials for a URL
  credential
    .command('store <url>')
    .description('Store credentials for a URL')
    .action(async (url) => {
      try {
        // URL validation
        try {
          new URL(url);
        } catch (error) {
          throw new Error('Invalid URL format');
        }
        
        console.log(chalk.cyan(`Storing credentials for ${url}`));
        
        const credentials = await askForCredentials(url);
        await storeCredentials(url, credentials.username, credentials.password);
        
        console.log(chalk.green('Credentials stored successfully'));
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
  
  // Clear credentials for a URL
  credential
    .command('clear <url>')
    .description('Clear stored credentials for a URL')
    .action(async (url) => {
      try {
        // URL validation
        try {
          new URL(url);
        } catch (error) {
          throw new Error('Invalid URL format');
        }
        
        await deleteCredentials(url);
        console.log(chalk.green(`Credentials for ${url} cleared successfully`));
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
  
  // Check for a URL
  credential
    .command('check <url>')
    .description('Check if credentials are stored for a URL')
    .action(async (url) => {
      try {
        // URL validation
        try {
          new URL(url);
        } catch (error) {
          throw new Error('Invalid URL format');
        }
        
        const credentials = await getCredentials(url);
        
        if (credentials) {
          console.log(chalk.green(`Credentials found for ${url}`));
        } else {
          console.log(chalk.yellow(`No credentials found for ${url}`));
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
  
  // Clear all credentials (dangerous, should be confirmed)
  credential
    .command('clear-all')
    .description('Clear all stored credentials (dangerous)')
    .action(async () => {
      try {
        console.log(chalk.red('WARNING: This will delete all stored credentials.'));
        console.log(chalk.red('Type "YES" to confirm:'));
        
        const confirmation = await new Promise(resolve => {
          process.stdin.once('data', data => {
            resolve(data.toString().trim());
          });
        });
        
        if (confirmation !== 'YES') {
          console.log(chalk.yellow('Operation canceled'));
          return;
        }
        
        // Clear credential files - this only works for the 'store' helper
        const WALGIT_HOME = path.join(os.homedir(), '.walgit');
        const CREDENTIALS_DIR = path.join(WALGIT_HOME, 'credentials');
        const CACHE_DIR = path.join(WALGIT_HOME, 'credential-cache');
        
        if (fs.existsSync(CREDENTIALS_DIR)) {
          // Remove all credential files
          fs.readdirSync(CREDENTIALS_DIR).forEach(file => {
            if (file.endsWith('.json')) {
              fs.unlinkSync(path.join(CREDENTIALS_DIR, file));
            }
          });
        }
        
        if (fs.existsSync(CACHE_DIR)) {
          // Remove all cache files
          fs.readdirSync(CACHE_DIR).forEach(file => {
            if (file.endsWith('.json')) {
              fs.unlinkSync(path.join(CACHE_DIR, file));
            }
          });
        }
        
        console.log(chalk.green('All credentials cleared successfully'));
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
  
  return credential;
};