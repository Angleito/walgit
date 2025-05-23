#!/usr/bin/env node

/**
 * @fileoverview Startup script for WalGit indexer service
 * Initializes and starts the off-chain indexing service with API server
 */

import { WalGitIndexer, IndexerAPIServer } from '../services/indexer-service.js';
import { program } from 'commander';
import chalk from 'chalk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Global variables
let indexer = null;
let apiServer = null;

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal) {
  console.log(chalk.yellow(`\n📡 Received ${signal}, shutting down gracefully...`));
  
  try {
    if (apiServer) {
      console.log('🔌 Stopping API server...');
      await apiServer.stop();
    }
    
    if (indexer) {
      console.log('⏹️  Stopping indexer...');
      await indexer.stop();
    }
    
    console.log(chalk.green('✅ Shutdown complete'));
    process.exit(0);
  } catch (error) {
    console.error(chalk.red('❌ Error during shutdown:'), error);
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart

/**
 * Start the indexer service
 */
async function startIndexer(options) {
  try {
    console.log(chalk.blue('🚀 Starting WalGit Indexer Service...'));
    
    // Validate required environment variables
    const requiredEnvVars = ['WALGIT_PACKAGE_ID'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error(chalk.red('❌ Missing required environment variables:'));
      missingVars.forEach(varName => {
        console.error(chalk.red(`   - ${varName}`));
      });
      console.log(chalk.yellow('\n💡 Please set these variables in your .env file or environment'));
      process.exit(1);
    }
    
    // Initialize indexer
    console.log(chalk.cyan('📊 Initializing indexer...'));
    
    const indexerOptions = {
      rpcUrl: options.rpcUrl || process.env.SUI_RPC_URL,
      packageId: process.env.WALGIT_PACKAGE_ID,
      dbPath: options.dbPath,
      batchSize: options.batchSize,
      indexingInterval: options.indexingInterval * 1000, // Convert to milliseconds
      maxRetries: options.maxRetries
    };
    
    indexer = new WalGitIndexer(indexerOptions);
    
    // Set up event listeners
    indexer.on('initialized', () => {
      console.log(chalk.green('✅ Indexer initialized successfully'));
    });
    
    indexer.on('started', () => {
      console.log(chalk.green('✅ Indexer started successfully'));
    });
    
    indexer.on('eventsProcessed', (data) => {
      console.log(chalk.cyan(`📈 Processed ${data.successful}/${data.total} events in ${data.processingTime}ms`));
    });
    
    indexer.on('error', (error) => {
      console.error(chalk.red('❌ Indexer error:'), error);
    });
    
    await indexer.initialize();
    await indexer.start();
    
    // Start API server if requested
    if (options.api) {
      console.log(chalk.cyan('🌐 Starting API server...'));
      
      const apiOptions = {
        port: options.apiPort
      };
      
      apiServer = new IndexerAPIServer(indexer, apiOptions);
      await apiServer.start();
      
      console.log(chalk.green(`✅ API server started on port ${options.apiPort}`));
      console.log(chalk.blue(`🔗 API available at: http://localhost:${options.apiPort}`));
    }
    
    // Display startup summary
    console.log(chalk.green('\n🎉 WalGit Indexer Service started successfully!'));
    console.log(chalk.cyan('📋 Configuration:'));
    console.log(`   • RPC URL: ${indexerOptions.rpcUrl}`);
    console.log(`   • Package ID: ${indexerOptions.packageId}`);
    console.log(`   • Database: ${indexerOptions.dbPath}`);
    console.log(`   • Batch Size: ${indexerOptions.batchSize}`);
    console.log(`   • Indexing Interval: ${options.indexingInterval}s`);
    if (options.api) {
      console.log(`   • API Port: ${options.apiPort}`);
    }
    
    // Show initial stats
    setTimeout(async () => {
      try {
        const stats = await indexer.getStats();
        console.log(chalk.cyan('\n📊 Initial Statistics:'));
        console.log(`   • Repositories: ${stats.repositories}`);
        console.log(`   • Collaborators: ${stats.collaborators}`);
        console.log(`   • Commits: ${stats.commits}`);
        console.log(`   • Cache Size: ${stats.cacheStats.size}/${stats.cacheStats.max}`);
      } catch (error) {
        console.warn(chalk.yellow('⚠️  Could not fetch initial stats'));
      }
    }, 2000);
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to start indexer:'), error);
    process.exit(1);
  }
}

/**
 * Show indexer status
 */
async function showStatus(options) {
  try {
    console.log(chalk.blue('📊 WalGit Indexer Status'));
    
    // Try to connect to API to get status
    const apiUrl = `http://localhost:${options.apiPort}`;
    
    try {
      const response = await fetch(`${apiUrl}/api/stats`);
      if (response.ok) {
        const stats = await response.json();
        
        console.log(chalk.green('\n✅ Indexer is running'));
        console.log(chalk.cyan('📈 Statistics:'));
        console.log(`   • Repositories: ${stats.repositories}`);
        console.log(`   • Collaborators: ${stats.collaborators}`);
        console.log(`   • Commits: ${stats.commits}`);
        console.log(`   • Last Cursor: ${stats.lastProcessedCursor || 'None'}`);
        console.log(`   • Cache: ${stats.cacheStats.size}/${stats.cacheStats.max} entries`);
        
        if (stats.eventMetrics && stats.eventMetrics.length > 0) {
          console.log(chalk.cyan('\n⚡ Event Processing Metrics (Last 24h):'));
          stats.eventMetrics.forEach(metric => {
            console.log(`   • ${metric.event_type}: ${metric.count} events, avg ${Math.round(metric.avg_time)}ms`);
          });
        }
      } else {
        console.log(chalk.yellow('⚠️  API server not responding'));
      }
    } catch (error) {
      console.log(chalk.red('❌ Indexer API not accessible'));
      console.log(chalk.yellow('💡 Make sure the indexer is running with --api flag'));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Error checking status:'), error);
    process.exit(1);
  }
}

/**
 * Reset indexer database
 */
async function resetDatabase(options) {
  try {
    console.log(chalk.yellow('⚠️  Resetting indexer database...'));
    
    const { confirm } = await import('inquirer');
    
    const answer = await confirm({
      message: 'Are you sure you want to reset the indexer database? This will delete all indexed data.',
      default: false
    });
    
    if (!answer) {
      console.log(chalk.blue('Operation cancelled'));
      return;
    }
    
    // Initialize indexer to reset database
    const indexerOptions = {
      rpcUrl: options.rpcUrl || process.env.SUI_RPC_URL,
      packageId: process.env.WALGIT_PACKAGE_ID,
      dbPath: options.dbPath,
      batchSize: options.batchSize,
      indexingInterval: options.indexingInterval * 1000,
      maxRetries: options.maxRetries
    };
    
    const tempIndexer = new WalGitIndexer(indexerOptions);
    await tempIndexer.initialize();
    
    // Reset database by recreating tables
    await tempIndexer.db.exec(`
      DROP TABLE IF EXISTS repositories;
      DROP TABLE IF EXISTS collaborators;
      DROP TABLE IF EXISTS commits;
      DROP TABLE IF EXISTS indexer_state;
      DROP TABLE IF EXISTS metrics;
    `);
    
    await tempIndexer.stop();
    
    console.log(chalk.green('✅ Database reset successfully'));
    console.log(chalk.blue('💡 Restart the indexer to begin fresh indexing'));
    
  } catch (error) {
    console.error(chalk.red('❌ Error resetting database:'), error);
    process.exit(1);
  }
}

// CLI Configuration
program
  .name('walgit-indexer')
  .description('WalGit off-chain indexing service')
  .version('1.0.0');

// Start command
program
  .command('start')
  .description('Start the indexer service')
  .option('--rpc-url <url>', 'Sui RPC URL', process.env.SUI_RPC_URL || 'https://fullnode.devnet.sui.io:443')
  .option('--db-path <path>', 'Database file path', './indexer.db')
  .option('--batch-size <size>', 'Event processing batch size', parseInt, 100)
  .option('--indexing-interval <seconds>', 'Indexing interval in seconds', parseInt, 5)
  .option('--max-retries <retries>', 'Maximum retry attempts', parseInt, 3)
  .option('--api', 'Start API server', false)
  .option('--api-port <port>', 'API server port', parseInt, 3001)
  .action(startIndexer);

// Status command
program
  .command('status')
  .description('Show indexer status')
  .option('--api-port <port>', 'API server port', parseInt, 3001)
  .action(showStatus);

// Reset command
program
  .command('reset')
  .description('Reset indexer database')
  .option('--rpc-url <url>', 'Sui RPC URL', process.env.SUI_RPC_URL || 'https://fullnode.devnet.sui.io:443')
  .option('--db-path <path>', 'Database file path', './indexer.db')
  .option('--batch-size <size>', 'Event processing batch size', parseInt, 100)
  .option('--indexing-interval <seconds>', 'Indexing interval in seconds', parseInt, 5)
  .option('--max-retries <retries>', 'Maximum retry attempts', parseInt, 3)
  .action(resetDatabase);

// Help command
program
  .command('help')
  .description('Show help information')
  .action(() => {
    console.log(chalk.blue('🔍 WalGit Indexer Service Help'));
    console.log('');
    console.log(chalk.cyan('Commands:'));
    console.log('  start    Start the indexer service');
    console.log('  status   Show current indexer status');
    console.log('  reset    Reset indexer database');
    console.log('  help     Show this help message');
    console.log('');
    console.log(chalk.cyan('Examples:'));
    console.log('  # Start indexer with API server');
    console.log('  walgit-indexer start --api --api-port 3001');
    console.log('');
    console.log('  # Check indexer status');
    console.log('  walgit-indexer status');
    console.log('');
    console.log('  # Reset database and start fresh');
    console.log('  walgit-indexer reset');
    console.log('');
    console.log(chalk.cyan('Environment Variables:'));
    console.log('  WALGIT_PACKAGE_ID     WalGit smart contract package ID (required)');
    console.log('  SUI_RPC_URL          Sui RPC endpoint URL');
    console.log('  FRONTEND_URL         Frontend URL for CORS (default: http://localhost:3000)');
  });

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}