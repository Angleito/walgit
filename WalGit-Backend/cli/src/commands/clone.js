import chalk from 'chalk';
import ora from 'ora';
import { walletManager } from '../utils/wallet-integration.js';
import { walrusClient } from '../utils/walrus-sdk-integration.js';
import { initializeSuiClient } from '../utils/sui-integration.js';
import { getConfig } from '../utils/config.js';
import fs from 'fs';
import path from 'path';

/**
 * Register the clone command
 * @param {import('commander').Command} program - Commander program instance
 */
export const cloneCommand = (program) => {
  program
    .command('clone <repository-id>')
    .description('Clone a repository from WalGit using Sui object ID')
    .option('-b, --branch <branch>', 'Checkout a specific branch after clone (default: main)')
    .option('-d, --directory <directory>', 'Clone into specific directory')
    .option('--depth <depth>', 'Create a shallow clone with specified depth')
    .action(async (repositoryId, options) => {
      try {
        // Ensure wallet is unlocked
        if (!walletManager.isWalletUnlocked()) {
          throw new Error('Wallet is locked. Run `walgit wallet unlock` first.');
        }

        // Determine target directory
        const targetDir = options.directory || 
                         path.join(process.cwd(), `walgit-repo-${repositoryId.slice(0, 8)}`);

        const spinner = ora('Fetching repository information...').start();

        // Fetch repository object from Sui
        const suiClient = await initializeSuiClient();
        const repoObject = await suiClient.getObject({
          id: repositoryId,
          options: {
            showContent: true,
            showType: true
          }
        });

        if (!repoObject.data) {
          throw new Error(`Repository ${repositoryId} not found`);
        }

        const repoData = repoObject.data.content.fields;
        console.log(`Found repository: ${chalk.cyan(repoData.name)}`);
        console.log(`Description: ${repoData.description}`);
        console.log(`Owner: ${chalk.yellow(repoData.owner)}`);

        // Check if user has read access
        const userAddress = walletManager.getCurrentAddress();
        const isOwner = repoData.owner === userAddress;
        const isCollaborator = repoData.collaborators && 
                              repoData.collaborators.fields && 
                              repoData.collaborators.fields.contents &&
                              repoData.collaborators.fields.contents.some(
                                collab => collab.fields.key === userAddress
                              );

        if (!isOwner && !isCollaborator) {
          throw new Error('Access denied. You do not have permission to clone this repository.');
        }

        spinner.text = 'Creating local directory...';
        
        // Create target directory
        if (fs.existsSync(targetDir)) {
          if (fs.readdirSync(targetDir).length > 0) {
            throw new Error(`Directory ${targetDir} already exists and is not empty`);
          }
        } else {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        const walgitDir = path.join(targetDir, '.walgit');
        fs.mkdirSync(walgitDir, { recursive: true });

        spinner.text = 'Decrypting and downloading files...';

        // Create wallet adapter for SEAL integration
        const walletAdapter = walletManager.createWalletAdapter();

        // Download and decrypt all files
        const { files, manifest } = await walrusClient.decryptAndDownloadFiles(
          repoData.latest_commit_manifest_cid,
          repoData.encrypted_dek_cid,
          repoData.seal_policy_id,
          walletAdapter
        );

        spinner.text = 'Writing files to disk...';

        // Write all files to target directory
        let fileCount = 0;
        for (const { path: filePath, content } of files) {
          const fullPath = path.join(targetDir, filePath);
          const fileDir = path.dirname(fullPath);
          
          // Ensure directory exists
          if (!fs.existsSync(fileDir)) {
            fs.mkdirSync(fileDir, { recursive: true });
          }
          
          fs.writeFileSync(fullPath, content);
          fileCount++;
        }

        // Store repository configuration locally
        const repoConfig = {
          id: repositoryId,
          name: repoData.name,
          description: repoData.description,
          owner: repoData.owner,
          sealPolicyId: repoData.seal_policy_id,
          defaultBranch: repoData.default_branch,
          latestCommitManifestCid: repoData.latest_commit_manifest_cid,
          encryptedDekCid: repoData.encrypted_dek_cid,
          cloned_at: new Date().toISOString(),
          network: getConfig().sui.network
        };
        
        fs.writeFileSync(
          path.join(walgitDir, 'config.json'),
          JSON.stringify(repoConfig, null, 2)
        );

        spinner.succeed(`Repository cloned to ${chalk.green(targetDir)}`);
        console.log(`Repository: ${chalk.cyan(repoData.name)}`);
        console.log(`Branch: ${chalk.yellow(repoData.default_branch || 'main')}`);
        console.log(`Files: ${chalk.green(fileCount)}`);
        console.log(`Latest commit: ${chalk.dim(manifest.message)}`);
        console.log(`Commit author: ${chalk.dim(manifest.author)}`);
        console.log(`Commit date: ${chalk.dim(manifest.timestamp)}`);
        
        if (targetDir !== process.cwd()) {
          console.log(chalk.blue(`\nTo start working: cd ${targetDir}`));
        }
      } catch (error) {
        console.error(chalk.red('Failed to clone repository:'), error.message);
        process.exit(1);
      }
    });
};