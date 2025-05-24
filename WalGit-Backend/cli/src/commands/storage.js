/**
 * Storage command implementation for WalGit CLI
 * Manages repository storage allocations and shows storage statistics
 * Includes advanced blob management features for optimization and data integrity
 */

import { program } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import Table from 'cli-table3';
import { OptimizedStorageManager } from '../utils/optimized-storage.js';
import { getCurrentRepository } from '../utils/config.js';
import { getConfig } from '../utils/config.js';
import { validateWalletConnection, executeTransaction } from '../utils/sui-wallet-integration.js';
import { formatBytes, formatDate, formatDuration, formatPercentage } from '../utils/format-utils.js';
import { formatErrorOutput } from '../utils/error-handler.js';
import blobManager from '../utils/blob-manager.js';
import path from 'path';
import fs from 'fs/promises';

/**
 * Registers the Storage command and subcommands to the CLI program
 * @param {Commander.Command} parentCommand - The parent command to attach to
 */
export function registerStorageCommand(parentCommand) {
  const storageCommand = parentCommand
    .command('storage')
    .description('Manage repository storage allocation and view storage statistics');
  
  // Show storage information
  storageCommand
    .command('info')
    .description('Show storage information for the current repository')
    .option('-d, --detailed', 'Show detailed storage statistics')
    .action(async (options) => {
      try {
        await showStorageInfo(options);
      } catch (error) {
        console.error(chalk.red(`Error retrieving storage information: ${formatErrorOutput(error)}`));
        process.exit(1);
      }
    });
  
  // Create storage allocation
  storageCommand
    .command('allocate')
    .description('Create or modify storage allocation for the current repository')
    .option('-t, --tier <tier>', 'Storage tier (0: Basic, 1: Standard, 2: Premium)', '1')
    .option('-a, --auto-renew', 'Enable auto-renewal of storage allocation', true)
    .option('-c, --custom', 'Create a custom allocation')
    .option('-s, --size <size>', 'Custom allocation size in GB')
    .option('-d, --duration <days>', 'Custom allocation duration in days')
    .action(async (options) => {
      try {
        await createStorageAllocation(options);
      } catch (error) {
        console.error(chalk.red(`Error creating storage allocation: ${formatErrorOutput(error)}`));
        process.exit(1);
      }
    });
  
  // Upgrade storage allocation
  storageCommand
    .command('upgrade')
    .description('Upgrade storage allocation tier')
    .option('-t, --tier <tier>', 'New storage tier (1: Standard, 2: Premium)')
    .action(async (options) => {
      try {
        await upgradeStorageAllocation(options);
      } catch (error) {
        console.error(chalk.red(`Error upgrading storage allocation: ${formatErrorOutput(error)}`));
        process.exit(1);
      }
    });
  
  // Renew storage allocation
  storageCommand
    .command('renew')
    .description('Renew storage allocation')
    .option('-d, --duration <days>', 'Renewal duration in days')
    .action(async (options) => {
      try {
        await renewStorageAllocation(options);
      } catch (error) {
        console.error(chalk.red(`Error renewing storage allocation: ${formatErrorOutput(error)}`));
        process.exit(1);
      }
    });
  
  // Optimize storage
  storageCommand
    .command('optimize')
    .description('Optimize blob storage with deduplication and compression')
    .option('-d, --deduplicate', 'Deduplicate blob storage', true)
    .option('-r, --recompress', 'Recompress blobs for better compression', true)
    .option('-c, --clean', 'Clean up cache and temporary files', true)
    .option('-v, --verify', 'Verify data integrity after optimization', true)
    .option('-l, --local', 'Use local storage', true)
    .option('-w, --walrus', 'Use Walrus storage', true)
    .action(async (options) => {
      try {
        await optimizeStorage(options);
      } catch (error) {
        console.error(chalk.red(`Error optimizing storage: ${formatErrorOutput(error)}`));
        process.exit(1);
      }
    });
  
  // Verify storage integrity
  storageCommand
    .command('verify')
    .description('Verify the integrity of blob storage')
    .option('-r, --repair', 'Repair any corruption detected', false)
    .option('-b, --blobs <hashes>', 'Comma-separated list of blob hashes to verify')
    .option('-s, --sync', 'Synchronize missing blobs between storage locations', true)
    .action(async (options) => {
      try {
        await verifyStorageIntegrity(options);
      } catch (error) {
        console.error(chalk.red(`Error verifying storage integrity: ${formatErrorOutput(error)}`));
        process.exit(1);
      }
    });
  
  // Synchronize storage
  storageCommand
    .command('sync')
    .description('Synchronize blobs between local and Walrus storage')
    .option('-d, --direction <direction>', 'Direction to sync (local-to-walrus, walrus-to-local, both)', 'both')
    .option('-b, --blobs <hashes>', 'Comma-separated list of blob hashes to sync')
    .option('-s, --skip-existing', 'Skip blobs that already exist in the destination', true)
    .option('-c, --concurrency <number>', 'Maximum number of concurrent operations', '3')
    .action(async (options) => {
      try {
        await syncStorage(options);
      } catch (error) {
        console.error(chalk.red(`Error synchronizing storage: ${formatErrorOutput(error)}`));
        process.exit(1);
      }
    });
  
  // List blobs
  storageCommand
    .command('list')
    .description('List blobs in the repository')
    .option('-l, --limit <number>', 'Maximum number of blobs to list')
    .option('-s, --sort <sort>', 'Sort order (recent, size)', 'recent')
    .option('-t, --type <type>', 'Filter by content type')
    .option('-f, --format <format>', 'Output format (table, json)', 'table')
    .action(async (options) => {
      try {
        await listBlobs(options);
      } catch (error) {
        console.error(chalk.red(`Error listing blobs: ${formatErrorOutput(error)}`));
        process.exit(1);
      }
    });
  
  return storageCommand;
}

/**
 * Shows storage information for the current repository
 * @param {Object} options - Command options
 */
async function showStorageInfo(options = {}) {
  const spinner = ora('Retrieving storage information...').start();
  
  try {
    // Get repository information
    const repo = await getCurrentRepository();
    
    if (!repo) {
      spinner.fail('Not in a WalGit repository');
      return;
    }
    
    // Get enhanced blob storage stats
    let stats;
    
    if (options.detailed) {
      spinner.text = 'Retrieving detailed storage statistics (this may take a while)...';
      stats = await blobManager.getBlobStorageStats();
    } else {
      // Get basic storage statistics
      stats = await OptimizedStorageManager.getStorageStats(repo.id);
    }
    
    spinner.succeed('Retrieved storage information');
    
    // Display repository information
    console.log(chalk.bold(`\nRepository: ${repo.name}`));
    console.log(`ID: ${repo.id}`);
    console.log(`Owner: ${repo.owner}`);
    
    // Display storage statistics
    console.log(chalk.bold('\nStorage Statistics:'));
    
    if (options.detailed && stats.blobCount) {
      // Show detailed stats
      console.log(chalk.cyan('\nBlob Count:'));
      console.log(`Total Blobs: ${stats.blobCount.total}`);
      console.log(`Unique Blobs: ${stats.blobCount.unique}`);
      console.log(`Local Storage: ${stats.blobCount.local}`);
      console.log(`Walrus Storage: ${stats.blobCount.walrus}`);
      console.log(`Synchronized Blobs: ${stats.blobCount.synchronized}`);
      
      console.log(chalk.cyan('\nSize Information:'));
      console.log(`Total Size: ${stats.size.formattedTotal}`);
      console.log(`Compressed Size: ${stats.size.formattedCompressed}`);
      console.log(`Compression Ratio: ${stats.size.compressionRatio}x`);
      console.log(`Space Savings: ${stats.size.savings}`);
      
      if (stats.contentTypes && Object.keys(stats.contentTypes).length > 0) {
        console.log(chalk.cyan('\nContent Type Distribution:'));
        const contentTypeTable = new Table({
          head: [
            chalk.white.bold('Content Type'),
            chalk.white.bold('Count')
          ],
        });
        
        Object.entries(stats.contentTypes)
          .sort((a, b) => b[1] - a[1])
          .forEach(([contentType, count]) => {
            contentTypeTable.push([contentType, count]);
          });
        
        console.log(contentTypeTable.toString());
      }
      
      if (stats.cache) {
        console.log(chalk.cyan('\nCache Information:'));
        console.log(`Metadata Cache Entries: ${stats.cache.metadataEntries}`);
        console.log(`Content Cache Entries: ${stats.cache.contentEntries}`);
        console.log(`Content Cache Size: ${stats.cache.contentSize}`);
      }
    } else {
      // Show basic stats
      console.log(`Total Blobs: ${typeof stats.blobCount === 'object' ? stats.blobCount.total : stats.blobCount}`);
      console.log(`Storage Used: ${stats.formattedSize || stats.size?.formattedTotal || 'Unknown'}`);
    }
    
    // Display allocation information if available
    if (stats.allocation || stats.quota) {
      const allocation = stats.allocation || stats.quota;
      const now = Math.floor(Date.now() / 1000);
      const remainingTime = allocation.expiresAt - now;
      
      console.log(chalk.bold('\nStorage Allocation:'));
      
      // Create table for allocation details
      const table = new Table({
        head: [
          chalk.white.bold('Property'),
          chalk.white.bold('Value')
        ],
      });
      
      const tierNames = ['Basic', 'Standard', 'Premium', 'Custom'];
      
      table.push(
        ['Tier', tierNames[allocation.tier]],
        ['Total Size', formatBytes(allocation.sizeBytes)],
        ['Used', formatBytes(allocation.usedBytes)],
        ['Utilization', formatPercentage(allocation.utilization)],
        ['Created', formatDate(allocation.createdAt)],
        ['Expires', formatDate(allocation.expiresAt)],
        ['Time Remaining', remainingTime > 0 ? formatDuration(remainingTime) : 'Expired'],
        ['Auto-Renew', allocation.autoRenew ? 'Enabled' : 'Disabled']
      );
      
      console.log(table.toString());
      
      // Display warning if allocation is nearly full
      if (allocation.utilization > 80) {
        console.log(chalk.yellow('\nWarning: Storage allocation is nearly full.'));
        console.log(chalk.yellow('Consider upgrading your storage allocation with \'walgit storage upgrade\'.'));
      }
      
      // Display warning if allocation is expiring soon
      if (remainingTime > 0 && remainingTime < 7 * 86400) {
        console.log(chalk.yellow('\nWarning: Storage allocation is expiring soon.'));
        console.log(chalk.yellow('Renew your allocation with \'walgit storage renew\'.'));
      }
    } else {
      console.log(chalk.yellow('\nNo storage allocation found.'));
      console.log(chalk.yellow('Create a storage allocation with \'walgit storage allocate\'.'));
    }
    
    // Display optimization tips
    if (options.detailed) {
      console.log(chalk.cyan('\nOptimization Recommendations:'));
      
      if (stats.size.compressionRatio && parseFloat(stats.size.compressionRatio) < 1.5) {
        console.log(chalk.yellow('✓ Consider running optimization to improve compression:'));
        console.log(chalk.gray('  walgit storage optimize --recompress'));
      }
      
      if (stats.blobCount.synchronized < stats.blobCount.unique * 0.5) {
        console.log(chalk.yellow('✓ Only ' + formatPercentage(stats.blobCount.synchronized / stats.blobCount.unique * 100) + ' of blobs are synchronized between local and Walrus storage.'));
        console.log(chalk.gray('  walgit storage sync'));
      }
      
      console.log(''); // Empty line for better readability
    }
  } catch (error) {
    spinner.fail(`Error retrieving storage information: ${error.message}`);
    throw error;
  }
}

/**
 * Creates a storage allocation for the current repository
 * @param {Object} options - Command options
 */
async function createStorageAllocation(options) {
  const spinner = ora('Creating storage allocation...').start();
  
  try {
    // Get repository information
    const repo = await getCurrentRepository();
    
    if (!repo) {
      spinner.fail('Not in a WalGit repository');
      return;
    }
    
    // Determine allocation parameters
    let tier = parseInt(options.tier, 10);
    const autoRenew = options.autoRenew !== false;
    
    if (options.custom) {
      spinner.stop();
      
      // Prompt for custom allocation parameters
      const answers = await inquirer.prompt([
        {
          type: 'number',
          name: 'size',
          message: 'Enter custom allocation size (in GB):',
          default: options.size ? parseInt(options.size, 10) : 5,
          validate: (input) => input > 0 ? true : 'Size must be greater than 0'
        },
        {
          type: 'number',
          name: 'duration',
          message: 'Enter allocation duration (in days):',
          default: options.duration ? parseInt(options.duration, 10) : 30,
          validate: (input) => input > 0 ? true : 'Duration must be greater than 0'
        }
      ]);
      
      spinner.start('Creating custom storage allocation...');
      
      // Create custom allocation
      const allocationId = await OptimizedStorageManager.createCustomAllocation(
        repo.id,
        answers.size,
        answers.duration,
        autoRenew
      );
      
      spinner.succeed('Custom storage allocation created successfully');
      
      console.log(chalk.bold('\nStorage Allocation:'));
      console.log(`ID: ${allocationId}`);
      console.log(`Size: ${answers.size} GB`);
      console.log(`Duration: ${answers.duration} days`);
      console.log(`Auto-Renew: ${autoRenew ? 'Enabled' : 'Disabled'}`);
    } else {
      // Validate tier
      if (isNaN(tier) || tier < 0 || tier > 2) {
        spinner.fail('Invalid tier. Please specify 0 (Basic), 1 (Standard), or 2 (Premium)');
        return;
      }
      
      // Create standard allocation
      const allocationId = await OptimizedStorageManager.createStorageAllocation(
        repo.id,
        tier,
        autoRenew
      );
      
      spinner.succeed('Storage allocation created successfully');
      
      const tierNames = ['Basic', 'Standard', 'Premium'];
      const tierSizes = ['100 MB', '1 GB', '10 GB'];
      const tierDurations = ['30 days', '180 days', '365 days'];
      
      console.log(chalk.bold('\nStorage Allocation:'));
      console.log(`ID: ${allocationId}`);
      console.log(`Tier: ${tierNames[tier]}`);
      console.log(`Size: ${tierSizes[tier]}`);
      console.log(`Duration: ${tierDurations[tier]}`);
      console.log(`Auto-Renew: ${autoRenew ? 'Enabled' : 'Disabled'}`);
    }
  } catch (error) {
    spinner.fail(`Error creating storage allocation: ${error.message}`);
    throw error;
  }
}

/**
 * Upgrades a storage allocation to a higher tier
 * @param {Object} options - Command options
 */
async function upgradeStorageAllocation(options) {
  const spinner = ora('Upgrading storage allocation...').start();
  
  try {
    // Get repository information
    const repo = await getCurrentRepository();
    
    if (!repo) {
      spinner.fail('Not in a WalGit repository');
      return;
    }
    
    // Get current storage statistics
    const stats = await OptimizedStorageManager.getStorageStats(repo.id);
    
    // Check if allocation exists
    if (!stats.allocation) {
      spinner.fail('No storage allocation found. Create one with "walgit storage allocate"');
      return;
    }
    
    // Determine new tier
    let newTier = options.tier ? parseInt(options.tier, 10) : null;
    
    // If tier not provided or invalid, prompt for it
    if (newTier === null || isNaN(newTier) || newTier <= stats.allocation.tier || newTier > 2) {
      spinner.stop();
      
      // Get available tiers
      const tierNames = ['Basic', 'Standard', 'Premium'];
      const availableTiers = [];
      
      for (let i = stats.allocation.tier + 1; i <= 2; i++) {
        availableTiers.push({
          name: `${tierNames[i]} (${i === 1 ? '1 GB' : '10 GB'})`,
          value: i
        });
      }
      
      if (availableTiers.length === 0) {
        spinner.fail('Already at the highest tier (Premium)');
        return;
      }
      
      // Prompt for new tier
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'tier',
          message: 'Select new storage tier:',
          choices: availableTiers
        }
      ]);
      
      newTier = answers.tier;
      spinner.start(`Upgrading to ${tierNames[newTier]} tier...`);
    }
    
    // Upgrade allocation
    const result = await OptimizedStorageManager.upgradeStorageAllocation(
      repo.id,
      stats.allocation.id,
      newTier
    );
    
    spinner.succeed(`Storage allocation upgraded to ${['Basic', 'Standard', 'Premium'][newTier]} tier`);
    
    // Show updated storage info
    await showStorageInfo();
  } catch (error) {
    spinner.fail(`Error upgrading storage allocation: ${error.message}`);
    throw error;
  }
}

/**
 * Renews a storage allocation
 * @param {Object} options - Command options
 */
async function renewStorageAllocation(options) {
  const spinner = ora('Renewing storage allocation...').start();
  
  try {
    // Get repository information
    const repo = await getCurrentRepository();
    
    if (!repo) {
      spinner.fail('Not in a WalGit repository');
      return;
    }
    
    // Get current storage statistics
    const stats = await OptimizedStorageManager.getStorageStats(repo.id);
    
    // Check if allocation exists
    if (!stats.allocation) {
      spinner.fail('No storage allocation found. Create one with "walgit storage allocate"');
      return;
    }
    
    // Determine renewal duration
    let duration = options.duration ? parseInt(options.duration, 10) : null;
    
    // If duration not provided or invalid, prompt for it
    if (duration === null || isNaN(duration) || duration <= 0) {
      spinner.stop();
      
      // Prompt for duration
      const answers = await inquirer.prompt([
        {
          type: 'number',
          name: 'duration',
          message: 'Enter renewal duration (in days):',
          default: 30,
          validate: (input) => input > 0 ? true : 'Duration must be greater than 0'
        }
      ]);
      
      duration = answers.duration;
      spinner.start(`Renewing storage allocation for ${duration} days...`);
    }
    
    // Renew allocation
    const result = await OptimizedStorageManager.renewStorageAllocation(
      repo.id,
      stats.allocation.id,
      duration
    );
    
    spinner.succeed(`Storage allocation renewed for ${duration} days`);
    
    // Show updated storage info
    await showStorageInfo();
  } catch (error) {
    spinner.fail(`Error renewing storage allocation: ${error.message}`);
    throw error;
  }
}

/**
 * Optimizes blob storage with deduplication, compression, and cleanup
 * @param {Object} options - Command options
 */
async function optimizeStorage(options) {
  const spinner = ora('Analyzing storage for optimization...').start();
  
  try {
    // Get repository information
    const repo = await getCurrentRepository();
    
    if (!repo) {
      spinner.fail('Not in a WalGit repository');
      return;
    }
    
    // Get storage statistics before optimization
    const beforeStats = await blobManager.getBlobStorageStats();
    
    // Show optimization plan
    spinner.succeed('Storage analysis complete');
    
    console.log(chalk.bold('\nOptimization Plan:'));
    if (options.deduplicate !== false) {
      console.log('✓ Deduplicate blob storage to eliminate redundant data');
    }
    if (options.recompress !== false) {
      console.log('✓ Recompress blobs for better compression ratios');
    }
    if (options.clean !== false) {
      console.log('✓ Clean up temporary files and optimize caching');
    }
    if (options.verify !== false) {
      console.log('✓ Verify data integrity after optimization');
    }
    
    // Confirm before proceeding
    spinner.stop();
    const {proceed} = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Proceed with optimization?',
        default: true
      }
    ]);
    
    if (!proceed) {
      console.log(chalk.yellow('Optimization cancelled'));
      return;
    }
    
    // Run optimization
    spinner.start('Running storage optimization...');
    
    const optimizationOptions = {
      deduplicate: options.deduplicate !== false,
      recompress: options.recompress !== false,
      clean: options.clean !== false,
      cleanCache: options.clean !== false,
      useLocal: options.local !== false,
      useWalrus: options.walrus !== false
    };
    
    const results = await blobManager.optimizeBlobStorage(optimizationOptions);
    
    // Verify data integrity if requested
    if (options.verify !== false) {
      spinner.text = 'Verifying data integrity...';
      const verifyResults = await blobManager.repairBlobs(null, { 
        repair: false, 
        syncMissing: false 
      });
      
      // Count integrity issues
      const integrityIssues = verifyResults.failed.length;
      if (integrityIssues > 0) {
        spinner.warn(`Optimization complete with ${integrityIssues} integrity issues detected`);
        console.log(chalk.yellow(`\nDetected ${integrityIssues} integrity issues that need repair.`));
        console.log(chalk.yellow('Run \'walgit storage verify --repair\' to fix these issues.'));
      } else {
        spinner.succeed('Optimization completed successfully with data integrity verified');
      }
    } else {
      spinner.succeed('Optimization completed successfully');
    }
    
    // Display optimization results
    console.log(chalk.bold('\nOptimization Results:'));
    
    // Create results table
    const resultsTable = new Table({
      head: [
        chalk.white.bold('Category'),
        chalk.white.bold('Count'),
        chalk.white.bold('Details')
      ],
    });
    
    resultsTable.push(
      ['Deduplicated', results.deduplicated.length, ''],
      ['Recompressed', results.recompressed.length, results.savings.formattedSize + ' saved'],
      ['Cleaned Up', results.cleaned.length, ''],
      ['Failed', results.failed.length, '']
    );
    
    console.log(resultsTable.toString());
    
    // Get storage statistics after optimization
    const afterStats = await blobManager.getBlobStorageStats();
    
    // Calculate improvements
    const sizeBefore = beforeStats.size.compressed;
    const sizeAfter = afterStats.size.compressed;
    const sizeDifference = sizeBefore - sizeAfter;
    
    if (sizeDifference > 0) {
      console.log(chalk.green(`\nTotal storage saved: ${formatBytes(sizeDifference)}`));
      console.log(chalk.green(`Compression ratio improved from ${beforeStats.size.compressionRatio}x to ${afterStats.size.compressionRatio}x`));
    } else {
      console.log(chalk.yellow('\nNo significant storage savings achieved'));
    }
    
    // Provide recommendations if applicable
    if (results.failed.length > 0) {
      console.log(chalk.yellow('\nSome operations failed. Consider running verification:'));
      console.log(chalk.gray('  walgit storage verify --repair'));
    }
  } catch (error) {
    spinner.fail(`Error optimizing storage: ${error.message}`);
    throw error;
  }
}

/**
 * Verifies and optionally repairs the integrity of blob storage
 * @param {Object} options - Command options
 */
async function verifyStorageIntegrity(options) {
  const spinner = ora('Verifying storage integrity...').start();
  
  try {
    // Get repository information
    const repo = await getCurrentRepository();
    
    if (!repo) {
      spinner.fail('Not in a WalGit repository');
      return;
    }
    
    // Parse blob hashes if provided
    let blobHashes = null;
    if (options.blobs) {
      blobHashes = options.blobs.split(',').map(hash => hash.trim());
      spinner.text = `Verifying integrity of ${blobHashes.length} specified blobs...`;
    }
    
    // Run verification
    const results = await blobManager.repairBlobs(blobHashes, {
      repair: options.repair === true,
      syncMissing: options.sync !== false
    });
    
    // Show verification results
    if (options.repair) {
      spinner.succeed('Integrity verification and repair completed');
    } else {
      spinner.succeed('Integrity verification completed');
    }
    
    // Create results table
    const resultsTable = new Table({
      head: [
        chalk.white.bold('Status'),
        chalk.white.bold('Count'),
        chalk.white.bold('Details')
      ],
    });
    
    resultsTable.push(
      ['Verified', results.verified.length, 'Integrity confirmed'],
      ['Repaired', results.repaired.length, options.repair ? 'Issues fixed' : 'Issues detected, not repaired'],
      ['Failed', results.failed.length, 'Could not verify or repair'],
      ['Skipped', results.skipped.length, 'No action needed']
    );
    
    console.log(resultsTable.toString());
    
    // Show detailed repair information if applicable
    if (results.repaired.length > 0 && options.repair) {
      console.log(chalk.green(`\nRepaired ${results.repaired.length} integrity issues:`));
      results.repaired.forEach((item, index) => {
        if (index < 10) { // Limit to first 10 for readability
          console.log(`  ${chalk.cyan(item.hash.substring(0, 8))}... - ${item.action}`);
        } else if (index === 10) {
          console.log(`  ... and ${results.repaired.length - 10} more`);
        }
      });
    }
    
    // Show failures if any
    if (results.failed.length > 0) {
      console.log(chalk.yellow(`\n${results.failed.length} blobs could not be verified or repaired:`));
      results.failed.forEach((item, index) => {
        if (index < 5) { // Limit to first 5 for readability
          console.log(`  ${chalk.red(item.hash.substring(0, 8))}... - ${item.error}`);
        } else if (index === 5) {
          console.log(`  ... and ${results.failed.length - 5} more`);
        }
      });
      
      if (!options.repair) {
        console.log(chalk.yellow('\nRun with --repair to attempt to fix these issues:'));
        console.log(chalk.gray('  walgit storage verify --repair'));
      }
    }
    
    // Show summary
    if (results.verified.length === 0 && results.repaired.length === 0 && results.failed.length === 0) {
      console.log(chalk.cyan('\nNo blobs were checked. Your repository may be empty.'));
    } else if (results.failed.length === 0 && (options.repair || results.repaired.length === 0)) {
      console.log(chalk.green('\nAll checked blobs passed integrity verification.'));
    } else if (!options.repair && results.repaired.length > 0) {
      console.log(chalk.yellow(`\n${results.repaired.length} issues detected that can be repaired.`));
      console.log(chalk.yellow('Run with --repair to fix these issues:'));
      console.log(chalk.gray('  walgit storage verify --repair'));
    }
  } catch (error) {
    spinner.fail(`Error verifying storage integrity: ${error.message}`);
    throw error;
  }
}

/**
 * Synchronizes blobs between local and Walrus storage
 * @param {Object} options - Command options
 */
async function syncStorage(options) {
  const spinner = ora('Analyzing storage synchronization needs...').start();
  
  try {
    // Get repository information
    const repo = await getCurrentRepository();
    
    if (!repo) {
      spinner.fail('Not in a WalGit repository');
      return;
    }
    
    // Parse blob hashes if provided
    let blobHashes = null;
    if (options.blobs) {
      blobHashes = options.blobs.split(',').map(hash => hash.trim());
      spinner.text = `Preparing to sync ${blobHashes.length} specified blobs...`;
    }
    
    // Determine concurrency
    const concurrency = parseInt(options.concurrency, 10) || 3;
    
    // Get direction
    let direction = options.direction?.toLowerCase() || 'both';
    if (!['local-to-walrus', 'walrus-to-local', 'both'].includes(direction)) {
      spinner.warn(`Invalid direction: ${direction}. Using 'both' instead.`);
      direction = 'both';
    }
    
    // Run synchronization
    let localToWalrusResults = null;
    let walrusToLocalResults = null;
    
    if (direction === 'local-to-walrus' || direction === 'both') {
      spinner.text = 'Synchronizing from local to Walrus...';
      localToWalrusResults = await blobManager.migrateBlobs('local-to-walrus', blobHashes, {
        skipExisting: options.skipExisting !== false,
        concurrency
      });
    }
    
    if (direction === 'walrus-to-local' || direction === 'both') {
      spinner.text = 'Synchronizing from Walrus to local...';
      walrusToLocalResults = await blobManager.migrateBlobs('walrus-to-local', blobHashes, {
        skipExisting: options.skipExisting !== false,
        concurrency
      });
    }
    
    spinner.succeed('Synchronization completed');
    
    // Show sync results
    console.log(chalk.bold('\nSynchronization Results:'));
    
    // Create results table
    const resultsTable = new Table({
      head: [
        chalk.white.bold('Direction'),
        chalk.white.bold('Synced'),
        chalk.white.bold('Skipped'),
        chalk.white.bold('Failed')
      ],
    });
    
    if (localToWalrusResults) {
      resultsTable.push([
        'Local → Walrus',
        localToWalrusResults.success.length,
        localToWalrusResults.skipped.length,
        localToWalrusResults.failed.length
      ]);
    }
    
    if (walrusToLocalResults) {
      resultsTable.push([
        'Walrus → Local',
        walrusToLocalResults.success.length,
        walrusToLocalResults.skipped.length,
        walrusToLocalResults.failed.length
      ]);
    }
    
    console.log(resultsTable.toString());
    
    // Show failures if any
    const allFailed = [
      ...(localToWalrusResults ? localToWalrusResults.failed : []),
      ...(walrusToLocalResults ? walrusToLocalResults.failed : [])
    ];
    
    if (allFailed.length > 0) {
      console.log(chalk.yellow(`\n${allFailed.length} blobs failed to synchronize:`));
      allFailed.forEach((item, index) => {
        if (index < 5) { // Limit to first 5 for readability
          console.log(`  ${chalk.red(item.hash.substring(0, 8))}... - ${item.error}`);
        } else if (index === 5) {
          console.log(`  ... and ${allFailed.length - 5} more`);
        }
      });
      
      console.log(chalk.yellow('\nRun verification to check for integrity issues:'));
      console.log(chalk.gray('  walgit storage verify --repair'));
    }
    
    // Show summary
    const totalSynced = (localToWalrusResults?.success.length || 0) + (walrusToLocalResults?.success.length || 0);
    const totalSkipped = (localToWalrusResults?.skipped.length || 0) + (walrusToLocalResults?.skipped.length || 0);
    
    if (totalSynced === 0 && totalSkipped === 0) {
      console.log(chalk.cyan('\nNo blobs needed synchronization.'));
    } else {
      console.log(chalk.green(`\nSynchronized ${totalSynced} blobs, skipped ${totalSkipped} (already in sync).`));
      
      // Run a quick verification
      if (totalSynced > 0) {
        console.log(chalk.cyan('\nVerifying synchronized blobs...'));
        
        const syncedHashes = [
          ...(localToWalrusResults?.success || []),
          ...(walrusToLocalResults?.success || [])
        ];
        
        // Verify only the first 10 synchronized blobs for performance
        const hashesToVerify = syncedHashes.slice(0, 10);
        if (hashesToVerify.length > 0) {
          const verifyResults = await blobManager.repairBlobs(hashesToVerify, { 
            repair: false,
            syncMissing: false
          });
          
          const verifiedCount = verifyResults.verified.length;
          const issueCount = verifyResults.repaired.length + verifyResults.failed.length;
          
          if (issueCount === 0) {
            console.log(chalk.green('All verified blobs passed integrity checks.'));
          } else {
            console.log(chalk.yellow(`Detected ${issueCount} integrity issues in synchronized blobs.`));
            console.log(chalk.yellow('Run full verification to fix these issues:'));
            console.log(chalk.gray('  walgit storage verify --repair'));
          }
        }
      }
    }
  } catch (error) {
    spinner.fail(`Error synchronizing storage: ${error.message}`);
    throw error;
  }
}

/**
 * Lists blobs in the repository with filtering and sorting options
 * @param {Object} options - Command options
 */
async function listBlobs(options) {
  const spinner = ora('Listing repository blobs...').start();
  
  try {
    // Get repository information
    const repo = await getCurrentRepository();
    
    if (!repo) {
      spinner.fail('Not in a WalGit repository');
      return;
    }
    
    // Parse options
    const limit = options.limit ? parseInt(options.limit, 10) : null;
    const sortBy = options.sort || 'recent';
    const contentType = options.type || null;
    
    // List blobs with filtering and sorting
    const blobs = await blobManager.listBlobs({
      limit,
      sortBy,
      includeWalrus: true
    });
    
    spinner.succeed(`Found ${blobs.length} blobs in the repository`);
    
    // Filter by content type if specified
    const filteredBlobs = contentType
      ? blobs.filter(blob => blob.contentType && blob.contentType.includes(contentType))
      : blobs;
    
    // Output based on format
    if (options.format === 'json') {
      console.log(JSON.stringify(filteredBlobs, null, 2));
    } else {
      // Create table for blob listing
      const table = new Table({
        head: [
          chalk.white.bold('Hash'),
          chalk.white.bold('Size'),
          chalk.white.bold('Type'),
          chalk.white.bold('Location'),
          chalk.white.bold('Compression')
        ],
        colWidths: [10, 15, 20, 12, 15]
      });
      
      filteredBlobs.forEach(blob => {
        table.push([
          blob.hash.substring(0, 8) + '...',
          formatBytes(blob.size),
          (blob.contentType || 'unknown').split('/')[1] || blob.contentType || 'unknown',
          blob.location,
          blob.compressionRatio ? `${blob.compressionRatio}x` : 'unknown'
        ]);
      });
      
      console.log(table.toString());
      
      // Show filtering information
      if (contentType) {
        console.log(chalk.cyan(`\nFiltered to ${filteredBlobs.length} blobs with content type containing '${contentType}'`));
      }
      
      if (filteredBlobs.length === 0) {
        console.log(chalk.yellow('\nNo blobs found with the specified criteria.'));
      } else if (limit && blobs.length > limit) {
        console.log(chalk.cyan(`\nShowing ${limit} of ${blobs.length} total blobs. Use --limit to adjust.`));
      }
    }
    
    // Provide storage management tips
    console.log(chalk.green('\nStorage Management Tips:'));
    console.log(chalk.cyan('• View storage details: ') + chalk.gray('walgit storage info --detailed'));
    console.log(chalk.cyan('• Optimize storage: ') + chalk.gray('walgit storage optimize'));
    console.log(chalk.cyan('• Verify integrity: ') + chalk.gray('walgit storage verify'));
  } catch (error) {
    spinner.fail(`Error listing blobs: ${error.message}`);
    throw error;
  }
}

export default {
  registerStorageCommand
};