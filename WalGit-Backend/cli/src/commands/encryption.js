#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig } from '../utils/config.js';
import { SealClient } from '../utils/seal-encryption.js';
import { initializeSuiClient } from '../utils/sui-integration.js';
import { Repository } from '../utils/repository.js';

/**
 * Register encryption commands
 * @param {Command} program - Commander instance
 */
export function registerEncryptionCommand(program) {
  const encryption = program
    .command('encryption')
    .description('Manage repository encryption using Seal');

  // Encrypt a public repository
  encryption
    .command('enable')
    .description('Enable encryption for a repository')
    .option('--owner <owner>', 'Repository owner')
    .option('--repo <repo>', 'Repository name')
    .option('--threshold <threshold>', 'Number of shares required to decrypt (default: 3)', parseInt, 3)
    .option('--shares <shares>', 'Total number of key shares (default: 5)', parseInt, 5)
    .action(async (options) => {
      const spinner = ora('Enabling encryption for repository...').start();
      
      try {
        const config = await getConfig();
        const suiClient = await initializeSuiClient();
        const sealClient = new SealClient(config.sealApiKey, suiClient);
        
        // Get repository details
        const repository = new Repository(config.repoPath);
        const repoId = options.repo || repository.getRepoName();
        const owner = options.owner || config.walletAddress;
        
        // Generate encryption policy
        const policyParams = {
          owner,
          threshold: options.threshold,
          totalShares: options.shares
        };
        
        const result = await sealClient.createEncryptionPolicy(repoId, policyParams);
        
        spinner.succeed(chalk.green('Repository encryption enabled'));
        console.log(chalk.cyan(`Policy ID: ${result.policyId}`));
        console.log(chalk.cyan(`Master key hash: ${result.keyHash}`));
        console.log(chalk.cyan(`Threshold: ${options.threshold}/${options.shares}`));
        
        // Update repository config
        await repository.setEncryptionEnabled(true, result.policyId);
        
      } catch (error) {
        spinner.fail(chalk.red(`Failed to enable encryption: ${error.message}`));
        process.exit(1);
      }
    });

  // Disable encryption
  encryption
    .command('disable')
    .description('Disable encryption for a repository')
    .option('--owner <owner>', 'Repository owner')
    .option('--repo <repo>', 'Repository name')
    .action(async (options) => {
      const spinner = ora('Disabling encryption for repository...').start();
      
      try {
        const config = await getConfig();
        const repository = new Repository(config.repoPath);
        const repoId = options.repo || repository.getRepoName();
        
        // Disable encryption in config
        await repository.setEncryptionEnabled(false);
        
        spinner.succeed(chalk.green('Repository encryption disabled'));
        console.log(chalk.yellow('Note: Existing encrypted blobs will remain encrypted'));
        
      } catch (error) {
        spinner.fail(chalk.red(`Failed to disable encryption: ${error.message}`));
        process.exit(1);
      }
    });

  // Share repository access
  encryption
    .command('share')
    .description('Share repository access with another user')
    .argument('<user>', 'User address to share with')
    .option('--repo <repo>', 'Repository name')
    .option('--duration <duration>', 'Access duration (e.g., 7d, 1m)', '7d')
    .option('--permissions <permissions>', 'Permissions (read|write|admin)', 'read')
    .action(async (user, options) => {
      const spinner = ora('Sharing repository access...').start();
      
      try {
        const config = await getConfig();
        const suiClient = await initializeSuiClient();
        const sealClient = new SealClient(config.sealApiKey, suiClient);
        
        const repository = new Repository(config.repoPath);
        const repoId = options.repo || repository.getRepoName();
        const policyId = await repository.getEncryptionPolicyId();
        
        if (!policyId) {
          throw new Error('Repository is not encrypted');
        }
        
        // Parse duration
        const duration = parseDuration(options.duration);
        
        // Share access
        const result = await sealClient.shareAccess(policyId, user, {
          permissions: options.permissions.split(','),
          expiry: Date.now() + duration
        });
        
        spinner.succeed(chalk.green(`Access shared with ${user}`));
        console.log(chalk.cyan(`Share ID: ${result.shareId}`));
        console.log(chalk.cyan(`Expires: ${new Date(result.expiry).toISOString()}`));
        console.log(chalk.cyan(`Permissions: ${options.permissions}`));
        
      } catch (error) {
        spinner.fail(chalk.red(`Failed to share access: ${error.message}`));
        process.exit(1);
      }
    });

  // Revoke access
  encryption
    .command('revoke')
    .description('Revoke repository access from a user')
    .argument('<user>', 'User address to revoke')
    .option('--repo <repo>', 'Repository name')
    .action(async (user, options) => {
      const spinner = ora('Revoking repository access...').start();
      
      try {
        const config = await getConfig();
        const suiClient = await initializeSuiClient();
        const sealClient = new SealClient(config.sealApiKey, suiClient);
        
        const repository = new Repository(config.repoPath);
        const repoId = options.repo || repository.getRepoName();
        const policyId = await repository.getEncryptionPolicyId();
        
        if (!policyId) {
          throw new Error('Repository is not encrypted');
        }
        
        // Revoke access
        await sealClient.revokeAccess(policyId, user);
        
        spinner.succeed(chalk.green(`Access revoked from ${user}`));
        
      } catch (error) {
        spinner.fail(chalk.red(`Failed to revoke access: ${error.message}`));
        process.exit(1);
      }
    });

  // List shared access
  encryption
    .command('list-access')
    .description('List users with repository access')
    .option('--repo <repo>', 'Repository name')
    .action(async (options) => {
      const spinner = ora('Loading access list...').start();
      
      try {
        const config = await getConfig();
        const suiClient = await initializeSuiClient();
        const sealClient = new SealClient(config.sealApiKey, suiClient);
        
        const repository = new Repository(config.repoPath);
        const repoId = options.repo || repository.getRepoName();
        const policyId = await repository.getEncryptionPolicyId();
        
        if (!policyId) {
          throw new Error('Repository is not encrypted');
        }
        
        // Get access control policy
        const policy = await sealClient.getAccessPolicy(policyId);
        
        spinner.succeed(chalk.green('Repository access list:'));
        
        if (policy.shares.length === 0) {
          console.log(chalk.yellow('No users have been granted access'));
          return;
        }
        
        console.log('\n' + chalk.bold('User Address'.padEnd(44)) + chalk.bold('Permissions'.padEnd(15)) + chalk.bold('Expires'));
        console.log('-'.repeat(80));
        
        for (const share of policy.shares) {
          const expiry = share.expiry ? new Date(share.expiry).toISOString() : 'Never';
          console.log(
            share.user.padEnd(44) +
            share.permissions.join(',').padEnd(15) +
            expiry
          );
        }
        
      } catch (error) {
        spinner.fail(chalk.red(`Failed to list access: ${error.message}`));
        process.exit(1);
      }
    });

  // Rotate encryption keys
  encryption
    .command('rotate-keys')
    .description('Rotate repository encryption keys')
    .option('--repo <repo>', 'Repository name')
    .action(async (options) => {
      const spinner = ora('Rotating encryption keys...').start();
      
      try {
        const config = await getConfig();
        const suiClient = await initializeSuiClient();
        const sealClient = new SealClient(config.sealApiKey, suiClient);
        
        const repository = new Repository(config.repoPath);
        const repoId = options.repo || repository.getRepoName();
        const policyId = await repository.getEncryptionPolicyId();
        
        if (!policyId) {
          throw new Error('Repository is not encrypted');
        }
        
        // Rotate keys
        const result = await sealClient.rotateKeys(policyId);
        
        spinner.succeed(chalk.green('Encryption keys rotated successfully'));
        console.log(chalk.cyan(`New key hash: ${result.newKeyHash}`));
        console.log(chalk.cyan(`Rotation ID: ${result.rotationId}`));
        console.log(chalk.yellow('Note: All existing shares have been invalidated'));
        
      } catch (error) {
        spinner.fail(chalk.red(`Failed to rotate keys: ${error.message}`));
        process.exit(1);
      }
    });
}

/**
 * Parse duration string to milliseconds
 * @param {string} duration - Duration string (e.g., '7d', '1m', '24h')
 * @returns {number} Duration in milliseconds
 */
function parseDuration(duration) {
  const match = /^(\d+)([dmh])$/.exec(duration);
  if (!match) {
    throw new Error('Invalid duration format. Use: 7d, 1m, 24h');
  }
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'm': return value * 30 * 24 * 60 * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    default: throw new Error('Invalid duration unit');
  }
}