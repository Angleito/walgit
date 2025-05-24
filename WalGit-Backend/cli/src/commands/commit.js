import chalk from 'chalk';
import ora from 'ora';
import { validateWalletConnection, getActiveAddress, executeTransaction } from '../utils/sui-wallet-integration.js';
import { walrusClient, CommitManifest } from '../utils/walrus-sdk-integration.js';
import { WorkingCopyManager } from '../utils/working-copy-manager.js';
import { initializeSuiClient } from '../utils/sui-integration.js';
import { getConfig } from '../utils/config.js';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import fs from 'fs';
import path from 'path';

/**
 * Commit changes to the repository
 * @param {import('commander').Command} program - Commander program instance
 */
export const commitCommand = (program) => {
  program
    .command('commit')
    .description('Commit all tracked changes to the repository (always-staged paradigm)')
    .option('-m, --message <message>', 'Commit message')
    .option('--amend', 'Amend the previous commit', false)
    .option('-v, --verbose', 'Show verbose output with file changes', false)
    .action(async (options) => {
      try {
        // Ensure wallet is unlocked
        await validateWalletConnection();
        
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
          console.error(chalk.red('Commit message is required (use -m "your message")'));
          process.exit(1);
        }
        
        const spinner = ora('Scanning for changes...').start();
        
        // Initialize WorkingCopyManager
        const workingCopy = new WorkingCopyManager(process.cwd());
        
        // Get current state of files
        const currentFiles = await workingCopy.scanFiles();
        
        // Filter out .walgit directory
        const filteredFiles = currentFiles.filter(filePath => !filePath.startsWith('.walgit/'));
        
        if (filteredFiles.length === 0) {
          spinner.warn('No files found to commit');
          console.log(chalk.yellow('Repository is empty or all files are ignored'));
          return;
        }
        
        spinner.text = 'Reading file contents...';
        
        // Read all file contents
        const filesToCommit = [];
        for (const filePath of filteredFiles) {
          try {
            const fullPath = path.join(process.cwd(), filePath);
            const content = fs.readFileSync(fullPath);
            filesToCommit.push({ path: filePath, content });
          } catch (error) {
            console.warn(chalk.yellow(`Warning: Could not read file ${filePath}: ${error.message}`));
          }
        }
        
        if (filesToCommit.length === 0) {
          throw new Error('No readable files found to commit');
        }
        
        console.log(`Found ${filesToCommit.length} files to commit`);
        
        if (options.verbose) {
          console.log('\nFiles to be committed:');
          filesToCommit.forEach(({ path: filePath }) => {
            console.log(`  ${chalk.green('+')} ${filePath}`);
          });
        }
        
        spinner.text = 'Creating commit manifest...';
        
        // Create commit manifest
        const userAddress = getActiveAddress();
        const manifest = new CommitManifest({
          author: userAddress,
          message: options.message,
          parent_commit_cid: repoConfig.latestCommitManifestCid || null
        });
        
        spinner.text = 'Encrypting and uploading files to Walrus...';
        
        // Encrypt and upload files
        const { manifestCid, encryptedDekCid } = await walrusClient.encryptAndUploadFiles(
          filesToCommit,
          repoConfig.sealPolicyId,
          manifest
        );
        
        console.log(`New manifest CID: ${manifestCid}`);
        console.log(`New encrypted DEK CID: ${encryptedDekCid}`);
        
        spinner.text = 'Updating repository on Sui blockchain...';
        
        // Update repository on Sui
        const suiClient = await initializeSuiClient();
        const config = getConfig();
        
        const tx = new TransactionBlock();
        tx.moveCall({
          target: `${config.sui.packageId}::git_repository::update_commit`,
          arguments: [
            tx.object(repoConfig.id),
            tx.pure(manifestCid),
            tx.pure(encryptedDekCid)
          ],
        });
        
        const result = await executeTransaction(tx);
        
        // Update local config
        repoConfig.latestCommitManifestCid = manifestCid;
        repoConfig.encryptedDekCid = encryptedDekCid;
        repoConfig.lastCommit = {
          manifestCid,
          message: options.message,
          author: userAddress,
          timestamp: new Date().toISOString(),
          transactionDigest: result.digest
        };
        
        fs.writeFileSync(configPath, JSON.stringify(repoConfig, null, 2));
        
        spinner.succeed('Commit created successfully');
        console.log(`Message: ${chalk.green(options.message)}`);
        console.log(`Manifest: ${chalk.cyan(manifestCid)}`);
        console.log(`Transaction: ${chalk.dim(result.digest)}`);
        console.log(`Files committed: ${chalk.yellow(filesToCommit.length)}`);
        
        if (options.verbose) {
          console.log('\nCommit details:');
          console.log(`  Author: ${userAddress}`);
          console.log(`  Timestamp: ${repoConfig.lastCommit.timestamp}`);
          console.log(`  Parent: ${manifest.parent_commit_cid || 'none (initial commit)'}`);
        }
        
        console.log(chalk.blue('\nRun `walgit push` to update the remote repository'));
        
      } catch (error) {
        console.error(chalk.red('Failed to create commit:'), error.message);
        process.exit(1);
      }
    });
};