/**
 * @fileoverview Enhanced commit command with comprehensive user feedback
 * Provides detailed progress updates during long-running Walrus operations
 */

import chalk from 'chalk';
import ora from 'ora';
import { createProgressBar } from 'cli-progress';
import { walletManager } from '../utils/wallet-integration.js';
import { EnhancedWalrusClient } from '../utils/enhanced-walrus-integration.js';
import { WorkingCopyManager } from '../utils/working-copy-manager.js';
import { initializeSuiClient } from '../utils/sui-integration.js';
import { getConfig } from '../utils/config.js';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

/**
 * Progress tracker for commit operations
 */
class CommitProgressTracker extends EventEmitter {
  constructor() {
    super();
    this.stages = [
      { name: 'Scanning files', weight: 0.1 },
      { name: 'Analyzing changes', weight: 0.1 },
      { name: 'Preparing content', weight: 0.1 },
      { name: 'Encrypting files', weight: 0.2 },
      { name: 'Uploading to Walrus', weight: 0.4 },
      { name: 'Creating commit', weight: 0.05 },
      { name: 'Updating blockchain', weight: 0.05 }
    ];
    
    this.currentStage = 0;
    this.stageProgress = 0;
    this.overallProgress = 0;
    this.isComplete = false;
    this.fileCount = 0;
    this.filesProcessed = 0;
    this.bytesUploaded = 0;
    this.totalBytes = 0;
    this.startTime = Date.now();
    
    this.progressBar = null;
    this.spinner = null;
  }

  initializeProgress(fileCount, totalBytes) {
    this.fileCount = fileCount;
    this.totalBytes = totalBytes;
    
    // Create progress bar for large operations
    if (fileCount > 5 || totalBytes > 10 * 1024 * 1024) { // 10MB threshold
      this.progressBar = new createProgressBar.SingleBar({
        format: `${chalk.cyan('Progress')} |{bar}| {percentage}% | {value}/{total} files | {speed} | ETA: {eta}s`,
        barCompleteChar: '█',
        barIncompleteChar: '░',
        hideCursor: true,
        etaBuffer: 100
      });
      
      this.progressBar.start(100, 0, {
        speed: '0 B/s',
        total: fileCount
      });
    } else {
      this.spinner = ora('Processing files...').start();
    }
  }

  updateStage(stageIndex, message = null) {
    if (stageIndex >= this.stages.length) return;
    
    this.currentStage = stageIndex;
    this.stageProgress = 0;
    
    const stage = this.stages[stageIndex];
    const displayMessage = message || stage.name;
    
    if (this.progressBar) {
      this.progressBar.update(this.calculateOverallProgress(), {
        speed: this.calculateSpeed(),
        value: this.filesProcessed,
        total: this.fileCount
      });
    } else if (this.spinner) {
      this.spinner.text = displayMessage;
    }
    
    this.emit('stage', { stage: stageIndex, message: displayMessage });
  }

  updateStageProgress(progress, details = {}) {
    this.stageProgress = Math.min(progress, 1);
    
    if (details.filesProcessed !== undefined) {
      this.filesProcessed = details.filesProcessed;
    }
    
    if (details.bytesUploaded !== undefined) {
      this.bytesUploaded = details.bytesUploaded;
    }
    
    const overallProgress = this.calculateOverallProgress();
    
    if (this.progressBar) {
      this.progressBar.update(overallProgress, {
        speed: this.calculateSpeed(),
        value: this.filesProcessed,
        total: this.fileCount,
        ...details
      });
    } else if (this.spinner) {
      const percentage = Math.round(overallProgress);
      this.spinner.text = `${this.stages[this.currentStage].name} (${percentage}%)`;
    }
    
    this.emit('progress', { 
      stage: this.currentStage, 
      stageProgress: this.stageProgress,
      overallProgress,
      ...details
    });
  }

  calculateOverallProgress() {
    let progress = 0;
    
    // Add completed stages
    for (let i = 0; i < this.currentStage; i++) {
      progress += this.stages[i].weight;
    }
    
    // Add current stage progress
    if (this.currentStage < this.stages.length) {
      progress += this.stages[this.currentStage].weight * this.stageProgress;
    }
    
    return Math.min(progress * 100, 100);
  }

  calculateSpeed() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    if (elapsed === 0) return '0 B/s';
    
    const bytesPerSecond = this.bytesUploaded / elapsed;
    return this.formatBytes(bytesPerSecond) + '/s';
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  complete(success = true) {
    this.isComplete = true;
    const duration = (Date.now() - this.startTime) / 1000;
    
    if (this.progressBar) {
      this.progressBar.update(100);
      this.progressBar.stop();
    } else if (this.spinner) {
      if (success) {
        this.spinner.succeed(`Commit completed in ${duration.toFixed(2)}s`);
      } else {
        this.spinner.fail('Commit failed');
      }
    }
    
    this.emit('complete', { success, duration });
  }

  error(message) {
    if (this.progressBar) {
      this.progressBar.stop();
    } else if (this.spinner) {
      this.spinner.fail(message);
    }
    
    this.emit('error', { message });
  }
}

/**
 * Enhanced commit command with comprehensive user feedback
 */
export const enhancedCommitCommand = (program) => {
  program
    .command('commit')
    .description('Commit all tracked changes to the repository (always-staged paradigm)')
    .option('-m, --message <message>', 'Commit message')
    .option('--amend', 'Amend the previous commit', false)
    .option('-v, --verbose', 'Show verbose output with file changes', false)
    .option('--dry-run', 'Show what would be committed without making changes', false)
    .option('--stats', 'Show detailed upload statistics', false)
    .action(async (options) => {
      const tracker = new CommitProgressTracker();
      
      try {
        // Ensure wallet is unlocked
        if (!walletManager.isWalletUnlocked()) {
          throw new Error('Wallet is locked. Run `walgit wallet unlock` first.');
        }
        
        // Check if we're in a repository
        const walgitDir = path.join(process.cwd(), '.walgit');
        const configPath = path.join(walgitDir, 'config.json');
        
        if (!fs.existsSync(configPath)) {
          console.error(chalk.red('Not in a WalGit repository'));
          console.log(chalk.blue('Run `walgit init` to initialize a new repository'));
          process.exit(1);
        }
        
        const repoConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Check if commit message is provided
        if (!options.message && !options.amend) {
          console.error(chalk.red('Commit message is required (use -m \"your message\")'));
          process.exit(1);
        }
        
        // Stage 1: Scanning files
        tracker.updateStage(0, 'Scanning repository for changes...');
        
        const workingCopyManager = new WorkingCopyManager(process.cwd(), {
          ignorePatterns: ['.walgit/**', 'node_modules/**', '.git/**']
        });
        
        const changes = await workingCopyManager.scanChanges();
        
        if (changes.length === 0 && !options.amend) {
          console.log(chalk.yellow('No changes to commit'));
          process.exit(0);
        }
        
        // Stage 2: Analyzing changes
        tracker.updateStage(1, 'Analyzing file changes...');
        
        const stats = await workingCopyManager.getChangeStats(changes);
        const totalBytes = stats.totalSize;
        
        tracker.initializeProgress(changes.length, totalBytes);
        
        if (options.verbose || options.dryRun) {
          console.log(chalk.cyan('\\nChanges to be committed:'));
          changes.forEach(change => {
            const icon = change.type === 'added' ? '++' : 
                        change.type === 'modified' ? '~~' : 
                        change.type === 'deleted' ? '--' : '??';
            const color = change.type === 'added' ? chalk.green : 
                         change.type === 'modified' ? chalk.yellow : 
                         change.type === 'deleted' ? chalk.red : chalk.gray;
            
            console.log(color(`  ${icon} ${change.path} (${formatBytes(change.size || 0)})`));
          });
          
          console.log(chalk.cyan(`\\nSummary: ${changes.length} files, ${formatBytes(totalBytes)} total`));
        }
        
        if (options.dryRun) {
          console.log(chalk.blue('\\nDry run - no changes made'));
          return;
        }
        
        // Stage 3: Preparing content
        tracker.updateStage(2, 'Preparing content for upload...');
        
        const filesToUpload = changes.filter(change => change.type !== 'deleted');
        
        // Stage 4: Encrypting files
        tracker.updateStage(3, 'Encrypting files with SEAL...');
        
        const walrusClient = new EnhancedWalrusClient();
        
        // Set up progress tracking for walrus operations
        walrusClient.on('uploadProgress', (data) => {
          tracker.updateStageProgress(data.progress / 100, {
            filesProcessed: data.filesProcessed,
            bytesUploaded: data.bytesUploaded
          });
        });
        
        // Stage 5: Uploading to Walrus
        tracker.updateStage(4, 'Uploading encrypted files to Walrus...');
        
        const uploadResults = [];
        let filesProcessed = 0;
        let bytesUploaded = 0;
        
        // Upload files with progress tracking
        for (const file of filesToUpload) {
          try {
            const result = await walrusClient.uploadFile(file.path, {
              contentType: file.mimeType,
              encryption: true
            });
            
            uploadResults.push({
              path: file.path,
              blobId: result.blobId,
              size: result.size,
              chunks: result.chunks || 1
            });
            
            filesProcessed++;
            bytesUploaded += result.size;
            
            tracker.updateStageProgress(filesProcessed / filesToUpload.length, {
              filesProcessed,
              bytesUploaded
            });
            
            if (options.verbose) {
              console.log(chalk.green(`  ✓ ${file.path} → ${result.blobId.substring(0, 8)}...`));
            }
            
          } catch (error) {
            console.error(chalk.red(`  ✗ Failed to upload ${file.path}: ${error.message}`));
            throw error;
          }
        }
        
        // Stage 6: Creating commit manifest
        tracker.updateStage(5, 'Creating commit manifest...');
        
        const commitManifest = {
          timestamp: Date.now(),
          author: walletManager.getCurrentAddress(),
          message: options.message || 'Amendment',
          parent_commit_cid: repoConfig.latestCommitCid || null,
          tree: {
            files: uploadResults.map(result => ({
              path: result.path,
              blobId: result.blobId,
              size: result.size
            }))
          }
        };
        
        const manifestResult = await walrusClient.uploadManifest(commitManifest);
        
        // Stage 7: Updating blockchain
        tracker.updateStage(6, 'Updating repository on blockchain...');
        
        const suiClient = initializeSuiClient();
        const txb = new TransactionBlock();
        
        // Update repository with new commit
        txb.moveCall({
          target: `${repoConfig.packageId}::git_repository::update_commit`,
          arguments: [
            txb.object(repoConfig.repositoryId),
            txb.pure(manifestResult.blobId),
            txb.pure(manifestResult.encryptedDekCid),
          ],
        });
        
        const result = await suiClient.signAndExecuteTransactionBlock({
          transactionBlock: txb,
          signer: walletManager.getKeypair(),
          options: {
            showEffects: true,
            showEvents: true,
          },
        });
        
        // Update local config
        repoConfig.latestCommitCid = manifestResult.blobId;
        repoConfig.encryptedDekCid = manifestResult.encryptedDekCid;
        fs.writeFileSync(configPath, JSON.stringify(repoConfig, null, 2));
        
        tracker.complete(true);
        
        // Show success message with statistics
        console.log(chalk.green('\\n✅ Commit successful!'));
        console.log(chalk.blue(`📝 Message: ${options.message || 'Amendment'}`));
        console.log(chalk.blue(`🔗 Commit ID: ${manifestResult.blobId.substring(0, 16)}...`));
        console.log(chalk.blue(`📦 Files: ${uploadResults.length} (${formatBytes(bytesUploaded)})`));
        
        if (options.stats) {
          console.log(chalk.cyan('\\n📊 Upload Statistics:'));
          console.log(`  • Total files: ${uploadResults.length}`);
          console.log(`  • Total size: ${formatBytes(bytesUploaded)}`);
          console.log(`  • Average file size: ${formatBytes(bytesUploaded / uploadResults.length)}`);
          console.log(`  • Upload speed: ${tracker.calculateSpeed()}`);
          console.log(`  • Chunks created: ${uploadResults.reduce((sum, r) => sum + r.chunks, 0)}`);
        }
        
        // Show transaction details if verbose
        if (options.verbose && result.effects?.status?.status === 'success') {
          console.log(chalk.cyan('\\n⛓️  Blockchain Transaction:'));
          console.log(`  • Transaction: ${result.digest}`);
          console.log(`  • Gas used: ${result.effects.gasUsed.computationCost}`);
          console.log(`  • Events emitted: ${result.events?.length || 0}`);
        }
      
      } catch (error) {
        tracker.error(error.message);
        
        console.error(chalk.red('\\n❌ Commit failed:'));
        console.error(chalk.red(error.message));
        
        if (options.verbose && error.stack) {
          console.error(chalk.gray('\\nStack trace:'));
          console.error(chalk.gray(error.stack));
        }
        
        // Provide helpful suggestions
        if (error.message.includes('Wallet')) {
          console.log(chalk.yellow('💡 Try running: walgit wallet unlock'));
        } else if (error.message.includes('Network')) {
          console.log(chalk.yellow('💡 Check your internet connection and try again'));
        } else if (error.message.includes('Storage')) {
          console.log(chalk.yellow('💡 You may need to purchase more storage quota'));
        }
        
        process.exit(1);
      }
    });
};

/**
 * Format bytes for human reading
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export { CommitProgressTracker };