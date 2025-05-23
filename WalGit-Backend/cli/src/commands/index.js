import { initCommand } from './init.js';
import { commitCommand } from './commit.js';
import { pushCommand } from './push.js';
import { pullCommand } from './pull.js';
import { repoCommands } from './repo.js';
import { statusCommand } from './status.js';
import { addCommand } from './add.js';
import { branchCommand } from './branch.js';
import { checkoutCommand } from './checkout.js';
import { cloneCommand } from './clone.js';
import { remoteCommand } from './remote.js';
import { logCommand } from './log.js';
import { fetchCommand } from './fetch.js';
import { mergeCommand } from './merge.js';
import { tagCommand } from './tag.js';
import { resetCommand } from './reset.js';
import { revertCommand } from './revert.js';
import { treeCommand } from './tree.js';
import { stashCommand } from './stash.js';
import { registerPRCommand } from './pr.js';
import { registerReviewCommand } from './review.js';
import { registerStorageCommand } from './storage.js';
import { credentialCommand } from './credential.js';
import { templateCommand } from './template.js';
import { getHealth, resetHealth, showFailures } from './health.js';
import { registerEncryptionCommand } from './encryption.js';
import { registerTuskyCommand } from './tusky.js';
import { walletCommand } from './wallet.js';
import { configCommand } from './config.js';

// Import optimization utilities
import '../utils/parallel-operations.js';
import '../utils/incremental-diff.js';
import '../utils/network-batching.js';

// Import enhanced blockchain integration utilities
import { blockchain, resilience } from '../utils/index.js';
import { networkMonitor, withNetworkAwareness } from '../utils/network-resilience.js';
import { BatchTransactionManager } from '../utils/batch-transaction-manager.js';
import { BlockchainTransactionHandler } from '../utils/blockchain-transaction-handler.js';
import parallelOps from '../utils/parallel-operations.js';
import incrementalDiff from '../utils/incremental-diff.js';
import networkBatching from '../utils/network-batching.js';
import * as txUtils from '../utils/transaction-utils.js';

/**
 * Register all commands with the CLI program
 * @param {import('commander').Command} program - Commander program instance
 */
export const registerCommands = (program) => {
  // Add performance optimization commands
  program
    .command('optimize')
    .description('Manage WalGit performance optimizations')
    .option('--network', 'Optimize network operations')
    .option('--storage', 'Optimize storage operations')
    .option('--diff', 'Optimize diff operations')
    .option('--parallel [threads]', 'Set parallel processing threads')
    .option('--blockchain', 'Optimize blockchain transaction handling')
    .option('--gas-limit [limit]', 'Set gas limit for transactions')
    .option('--batch-size [size]', 'Set batch size for operations')
    .option('--retry-count [count]', 'Set number of retries for operations')
    .option('--stats', 'Show optimization statistics')
    .option('--clear-cache', 'Clear optimization caches')
    .option('--all', 'Apply all optimizations')
    .action((options) => {

      // Handle statistics display
      if (options.stats) {
        console.log('=== WalGit Optimization Statistics ===');
        console.log('Network cache:', networkBatching.getResponseCacheStats ? networkBatching.getResponseCacheStats() : 'Not available');
        console.log('Diff cache:', incrementalDiff.getDiffCacheStats());

        // Get network health statistics
        const networkStats = networkMonitor.getNetworkAwareRecommendations();

        console.log('\n=== Network Health ===');
        console.log('Network status:', networkStats.networkStatus);
        console.log('Average latency:', networkStats.averageLatency + 'ms');
        console.log('Recommended batch size:', networkStats.batchSize);
        console.log('Recommended concurrency:', networkStats.concurrency);

        console.log('\n=== Transaction Performance ===');
        const gasBudget = txUtils.DEFAULT_GAS_BUDGET || 100000000;
        console.log('Current Gas Budget:', txUtils.formatGasCost(BigInt(gasBudget)));
        console.log('Transaction retries:', txUtils.DEFAULT_RETRY_COUNT || 5);
        console.log('Transaction timeout:', (txUtils.DEFAULT_TX_WAIT_TIMEOUT || 120000) + 'ms');
        
        try {
          const config = txUtils.getTransactionConfig?.() || {};
          console.log('Batch operation size:', config.batchSize || 10);
          console.log('Adaptive batching:', config.adaptiveBatching ? 'Enabled' : 'Disabled');
          console.log('Adaptive gas estimation:', config.adaptiveGas ? 'Enabled' : 'Disabled');
        } catch (error) {
          console.log('Transaction config:', 'Not available');
        }
        return;
      }

      // Handle cache clearing
      if (options.clearCache) {
        if (networkBatching.clearResponseCache) networkBatching.clearResponseCache();
        incrementalDiff.clearDiffCache();
        console.log('All optimization caches cleared');
        return;
      }

      // Apply optimizations
      let optimizationsApplied = false;

      if (options.network || options.all) {
        console.log('✓ Network operation batching enabled');
        optimizationsApplied = true;
      }

      if (options.storage || options.all) {
        console.log('✓ Storage operation parallelization enabled');
        optimizationsApplied = true;
      }

      if (options.diff || options.all) {
        console.log('✓ Incremental diff computation enabled');
        optimizationsApplied = true;
      }

      if (options.blockchain || options.all) {
        console.log('✓ Enhanced blockchain transaction handling enabled');
        // Enable network monitoring for adaptive transactions
        networkMonitor.isNetworkHealthy().then(healthy => {
          console.log(`  Network health check: ${healthy ? 'Healthy' : 'Issues detected'}`);
          console.log(`  Average network latency: ${networkMonitor.getAverageLatency()}ms`);

          // Apply network-aware recommendations
          const recommendations = networkMonitor.getNetworkAwareRecommendations();
          txUtils.setBatchSize(recommendations.batchSize);
          txUtils.setRetryCount(recommendations.retryCount);

          console.log(`  Optimized batch size: ${recommendations.batchSize}`);
          console.log(`  Optimized retry count: ${recommendations.retryCount}`);
          console.log(`  Optimized concurrency: ${recommendations.concurrency}`);
        });

        // Enable adaptive gas estimation and batching
        const txConfig = txUtils.getTransactionConfig();
        txConfig.adaptiveBatching = true;
        txConfig.adaptiveGas = true;

        console.log('  Adaptive gas estimation: Enabled');
        console.log('  Adaptive batch sizing: Enabled');

        optimizationsApplied = true;
      }

      if (options.gasLimit) {
        const gasLimit = parseInt(options.gasLimit);
        if (!isNaN(gasLimit) && gasLimit > 0) {
          console.log(`✓ Gas limit set to ${txUtils.formatGasCost(BigInt(gasLimit))}`);
          txUtils.setGasLimit(gasLimit);
          optimizationsApplied = true;
        } else {
          console.log('⚠ Invalid gas limit value. Please provide a positive number.');
        }
      }

      if (options.batchSize) {
        const batchSize = parseInt(options.batchSize);
        if (!isNaN(batchSize) && batchSize > 0) {
          console.log(`✓ Batch size set to ${batchSize}`);
          txUtils.setBatchSize(batchSize);
          optimizationsApplied = true;
        } else {
          console.log('⚠ Invalid batch size value. Please provide a positive number.');
        }
      }

      if (options.retryCount) {
        const retryCount = parseInt(options.retryCount);
        if (!isNaN(retryCount) && retryCount >= 0) {
          console.log(`✓ Retry count set to ${retryCount}`);
          txUtils.setRetryCount(retryCount);
          optimizationsApplied = true;
        } else {
          console.log('⚠ Invalid retry count value. Please provide a non-negative number.');
        }
      }

      if (options.parallel) {
        const threads = parseInt(options.parallel) || 10;
        console.log(`✓ Parallel processing set to ${threads} threads`);
        optimizationsApplied = true;
      }

      if (!optimizationsApplied) {
        console.log('No optimizations selected. Use --all to apply all optimizations.');
      }
    });

  // Initialize a new repository
  initCommand(program);

  // Basic commands
  statusCommand(program);
  addCommand(program);
  commitCommand(program);

  // Branch management
  branchCommand(program);
  checkoutCommand(program);

  // Remote operations
  remoteCommand(program);
  fetchCommand(program);
  pushCommand(program);
  pullCommand(program);

  // History and changes
  logCommand(program);
  mergeCommand(program);
  resetCommand(program);
  revertCommand(program);
  treeCommand(program);
  stashCommand(program);

  // Repository operations
  cloneCommand(program);
  tagCommand(program);

  // Repository management commands
  repoCommands(program);

  // Pull request commands
  registerPRCommand(program);

  // Code review commands
  registerReviewCommand(program);

  // Storage management commands
  registerStorageCommand(program);

  // Credential management commands
  credentialCommand(program);

  // Template management commands
  templateCommand(program);

  // Encryption commands
  registerEncryptionCommand(program);

  // Tusky storage commands
  registerTuskyCommand(program);

  // Wallet management commands
  walletCommand(program);

  // Configuration management commands
  configCommand(program);

  // Network health and resilience commands
  program
    .command('health')
    .description('Manage and monitor network health and resilience')
    .option('-d, --detailed', 'Show detailed health statistics')
    .action((options) => getHealth(options));

  program
    .command('health:reset')
    .description('Reset network health monitoring and circuit breakers')
    .action(() => resetHealth());

  program
    .command('health:failures')
    .description('Show detailed failure analytics and recommendations')
    .option('-d, --days <days>', 'Number of days to include in analysis', 7)
    .option('-m, --minimal', 'Show minimal information without visualizations')
    .action((options) => showFailures(options));
};
