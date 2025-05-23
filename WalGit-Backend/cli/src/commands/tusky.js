#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, saveConfig } from '../utils/config.js';
import TuskyClient from '../utils/tusky-integration.js';
import { WalGitWalrusClient } from '../utils/walrus-sdk-integration.js';
import { initializeSuiClient } from '../utils/sui-integration.js';
import { getCurrentRepository } from '../utils/config.js';

/**
 * Register Tusky storage commands
 * @param {Command} program - Commander instance
 */
export function registerTuskyCommand(program) {
  const tusky = program
    .command('tusky')
    .description('Manage Tusky storage integration');

  // Configure Tusky
  tusky
    .command('config')
    .description('Configure Tusky storage integration')
    .option('--api-key <apiKey>', 'Tusky API key')
    .option('--account-type <type>', 'Account type (personal|walgit)', 'personal')
    .action(async (options) => {
      const spinner = ora('Configuring Tusky...').start();
      
      try {
        const config = await getConfig();
        
        // Update config with Tusky settings
        if (options.apiKey) {
          config.tuskyApiKey = options.apiKey;
        }
        if (options.accountType) {
          config.tuskyAccountType = options.accountType;
        }
        
        await saveConfig(config);
        
        // Test connection
        const tuskyClient = new TuskyClient(config.tuskyApiKey, config.tuskyAccountType);
        const auth = await tuskyClient.authenticate();
        const quota = await tuskyClient.getQuota();
        
        spinner.succeed(chalk.green('Tusky configured successfully'));
        console.log(chalk.cyan(`Account ID: ${auth.accountId}`));
        console.log(chalk.cyan(`Storage used: ${formatBytes(quota.used)} / ${formatBytes(quota.total)}`));
        console.log(chalk.cyan(`Files: ${quota.fileCount} / ${quota.fileLimit}`));
        
      } catch (error) {
        spinner.fail(chalk.red(`Failed to configure Tusky: ${error.message}`));
        process.exit(1);
      }
    });

  // Switch storage provider
  tusky
    .command('use')
    .description('Switch default storage provider')
    .argument('<provider>', 'Storage provider (tusky|walrus)')
    .action(async (provider) => {
      const spinner = ora('Switching storage provider...').start();
      
      try {
        const config = await getConfig();
        
        if (!['tusky', 'walrus'].includes(provider)) {
          throw new Error('Invalid provider. Use "tusky" or "walrus"');
        }
        
        config.defaultStorageProvider = provider;
        await saveConfig(config);
        
        spinner.succeed(chalk.green(`Default storage provider set to ${provider}`));
        
        // Show provider info
        if (provider === 'tusky') {
          console.log(chalk.cyan('\nTusky free storage limits:'));
          console.log(chalk.cyan('- Personal: 5GB storage, 1000 files'));
          console.log(chalk.cyan('- WalGit shared: 50GB storage, 10000 files'));
        } else {
          console.log(chalk.cyan('\nWalrus decentralized storage:'));
          console.log(chalk.cyan('- No storage limits'));
          console.log(chalk.cyan('- Pay per use with SUI'));
        }
        
      } catch (error) {
        spinner.fail(chalk.red(`Failed to switch provider: ${error.message}`));
        process.exit(1);
      }
    });

  // Show storage status
  tusky
    .command('status')
    .description('Show storage provider status and quota')
    .action(async () => {
      const spinner = ora('Loading storage status...').start();
      
      try {
        const config = await getConfig();
        
        spinner.succeed(chalk.green('Storage Provider Status'));
        console.log(chalk.bold(`\nCurrent provider: ${config.defaultStorageProvider || 'walrus'}`));
        
        // Show Tusky status if configured
        if (config.tuskyApiKey) {
          console.log(chalk.bold('\nTusky Status:'));
          const tuskyClient = new TuskyClient(config.tuskyApiKey, config.tuskyAccountType);
          
          const quota = await tuskyClient.getQuota();
          const percentage = (quota.used / quota.total * 100).toFixed(1);
          
          console.log(`Account type: ${config.tuskyAccountType}`);
          console.log(`Storage used: ${formatBytes(quota.used)} / ${formatBytes(quota.total)} (${percentage}%)`);
          console.log(`Files: ${quota.fileCount} / ${quota.fileLimit}`);
          console.log(`Available: ${formatBytes(quota.available)}`);
        } else {
          console.log(chalk.yellow('\nTusky: Not configured'));
        }
        
        // Show Walrus status
        console.log(chalk.bold('\nWalrus Status:'));
        const suiClient = await initializeSuiClient();
        console.log(`Connected to: ${config.suiNetworkUrl}`);
        console.log(`Address: ${config.walletAddress}`);
        
      } catch (error) {
        spinner.fail(chalk.red(`Failed to get status: ${error.message}`));
        process.exit(1);
      }
    });

  // Migrate blobs between providers
  tusky
    .command('migrate')
    .description('Migrate blobs between storage providers')
    .option('--from <provider>', 'Source provider (tusky|walrus)', 'walrus')
    .option('--to <provider>', 'Target provider (tusky|walrus)', 'tusky')
    .option('--repo <repo>', 'Repository to migrate')
    .option('--dry-run', 'Show what would be migrated without doing it')
    .action(async (options) => {
      const spinner = ora('Starting migration...').start();
      
      try {
        const config = await getConfig();
        const suiClient = await initializeSuiClient();
        
        if (options.from === options.to) {
          throw new Error('Source and target providers must be different');
        }
        
        // Initialize clients
        const tuskyClient = new TuskyClient(config.tuskyApiKey, config.tuskyAccountType);
        const walrusClient = new WalGitWalrusClient(config);
        
        // Get repository
        const repository = await getCurrentRepository();
        const repoId = options.repo || repository?.name || 'unnamed';
        
        spinner.text = 'Analyzing blobs to migrate...';
        
        // Get all blobs in repository
        // TODO: Implement blob listing logic
        const blobs = [];
        
        if (options.dryRun) {
          spinner.succeed(chalk.green('Migration analysis (dry run):'));
          console.log(`Found ${blobs.length} blobs to migrate`);
          console.log(`From: ${options.from}`);
          console.log(`To: ${options.to}`);
          
          let totalSize = 0;
          for (const blob of blobs) {
            totalSize += blob.size || 0;
          }
          console.log(`Total size: ${formatBytes(totalSize)}`);
          
          return;
        }
        
        spinner.text = `Migrating ${blobs.length} blobs from ${options.from} to ${options.to}...`;
        
        const results = {
          success: 0,
          failed: 0,
          errors: []
        };
        
        for (const blob of blobs) {
          try {
            // Read from source
            let data;
            if (options.from === 'walrus') {
              data = await walrusClient.downloadBlob(blob.id);
            } else {
              data = await tuskyClient.downloadBlob(blob.id);
            }
            
            // Write to target
            let newBlobId;
            if (options.to === 'walrus') {
              newBlobId = await walrusClient.uploadBlob(data);
            } else {
              newBlobId = await tuskyClient.uploadBlob(data);
            }
            
            // Update blob reference if ID changed
            if (newBlobId !== blob.id) {
              await repository.updateBlobId(blob.id, newBlobId);
            }
            
            results.success++;
          } catch (error) {
            results.failed++;
            results.errors.push({ blob: blob.id, error: error.message });
          }
        }
        
        spinner.succeed(chalk.green('Migration completed'));
        console.log(`Successful: ${results.success}`);
        console.log(`Failed: ${results.failed}`);
        
        if (results.errors.length > 0) {
          console.log(chalk.red('\nErrors:'));
          for (const err of results.errors) {
            console.log(`${err.blob}: ${err.error}`);
          }
        }
        
      } catch (error) {
        spinner.fail(chalk.red(`Migration failed: ${error.message}`));
        process.exit(1);
      }
    });

  // Show fallback settings
  tusky
    .command('fallback')
    .description('Configure storage fallback behavior')
    .option('--enable', 'Enable automatic fallback')
    .option('--disable', 'Disable automatic fallback')
    .option('--order <order>', 'Fallback order (tusky,walrus or walrus,tusky)')
    .action(async (options) => {
      const spinner = ora('Configuring fallback...').start();
      
      try {
        const config = await getConfig();
        
        if (options.enable) {
          config.storageAutoFallback = true;
        }
        if (options.disable) {
          config.storageAutoFallback = false;
        }
        if (options.order) {
          const providers = options.order.split(',').map(p => p.trim());
          if (!providers.every(p => ['tusky', 'walrus'].includes(p))) {
            throw new Error('Invalid providers in fallback order');
          }
          config.storageFallbackOrder = providers;
        }
        
        await saveConfig(config);
        
        spinner.succeed(chalk.green('Fallback configuration updated'));
        console.log(`Auto-fallback: ${config.storageAutoFallback ? 'Enabled' : 'Disabled'}`);
        console.log(`Fallback order: ${(config.storageFallbackOrder || ['tusky', 'walrus']).join(' → ')}`);
        
      } catch (error) {
        spinner.fail(chalk.red(`Failed to configure fallback: ${error.message}`));
        process.exit(1);
      }
    });
}

/**
 * Format bytes to human readable string
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}