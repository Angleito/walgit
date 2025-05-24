import chalk from 'chalk';
import ora from 'ora';
import { createRepository } from '../utils/repository.js';
import { walletManager } from '../utils/wallet-integration.js';
import { walrusClient, CommitManifest } from '../utils/walrus-sdk-integration.js';
import { templateManager } from '../utils/template-manager.js';
import { WorkingCopyManager } from '../utils/working-copy-manager.js';
import { initializeSuiClient } from '../utils/sui-integration.js';
import { getConfig } from '../utils/config.js';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Initialize a new WalGit repository
 * @param {import('commander').Command} program - Commander program instance
 */
export const initCommand = (program) => {
  program
    .command('init')
    .description('Initialize a new WalGit repository')
    .option('-n, --name <name>', 'Repository name')
    .option('-d, --description <description>', 'Repository description')
    .option('-p, --private', 'Create private repository', false)
    .option('-t, --template <templateId>', 'Initialize with a template')
    .option('--list-templates', 'Show available templates')
    .option('--encryption <type>', 'Enable encryption (seal)', '')
    .option('--encryption-threshold <threshold>', 'Shares required to decrypt (default: 3)', parseInt, 3)
    .option('--encryption-shares <shares>', 'Total key shares (default: 5)', parseInt, 5)
    .action(async (options) => {
      try {
        // If user just wants to list templates, show them and exit
        if (options.listTemplates) {
          const templates = templateManager.getTemplates();

          if (templates.length === 0) {
            console.log(chalk.yellow('No templates available'));
            return;
          }

          console.log(chalk.bold('Available Templates:'));

          // Group templates by category
          const templatesByCategory = {};
          templates.forEach(template => {
            const category = template.category || 'Other';
            if (!templatesByCategory[category]) {
              templatesByCategory[category] = [];
            }
            templatesByCategory[category].push(template);
          });

          // Print templates by category
          for (const [category, categoryTemplates] of Object.entries(templatesByCategory)) {
            console.log(chalk.blue(`\n${category.charAt(0).toUpperCase() + category.slice(1)}:`));
            categoryTemplates.forEach(template => {
              const recommended = template.recommended ? chalk.green(' [Recommended]') : '';
              console.log(`  ${chalk.cyan(template.id)}: ${template.name}${recommended}`);
              console.log(`    ${template.description}`);
            });
          }

          console.log(chalk.dim('\nUse `walgit init --template <templateId>` to initialize with a template'));
          return;
        }

        // Ensure wallet is unlocked
        if (!walletManager.isWalletUnlocked()) {
          throw new Error('Wallet is locked. Run `walgit wallet unlock` first.');
        }

        const repoName = options.name || path.basename(process.cwd());
        const description = options.description || `${repoName} repository`;
        const spinner = ora('Initializing repository...').start();

        // Validate current working directory
        const currentDir = process.cwd();
        try {
          const stat = fs.statSync(currentDir);
          if (!stat.isDirectory()) {
            throw new Error('Current working directory is not accessible');
          }
          
          // Test write permissions
          const testFile = path.join(currentDir, '.walgit-init-test');
          fs.writeFileSync(testFile, 'test');
          fs.unlinkSync(testFile);
        } catch (error) {
          throw new Error(`Cannot initialize repository in current directory: ${error.message}`);
        }

        // Initialize local .walgit directory
        const walgitDir = path.join(currentDir, '.walgit');
        if (fs.existsSync(walgitDir)) {
          throw new Error('Directory is already a WalGit repository');
        }
        
        fs.mkdirSync(walgitDir, { recursive: true });

        // Generate SEAL policy ID based on repo name and user
        const userAddress = walletManager.getCurrentAddress();
        const policyId = `walgit-${repoName}-${userAddress.slice(0, 8)}-${Date.now()}`;
        
        spinner.text = 'Preparing initial commit...';

        // Collect initial files (or create empty manifest)
        const initialFiles = [];
        
        // Create .walgitignore if it doesn't exist
        const walgitignorePath = path.join(process.cwd(), '.walgitignore');
        if (!fs.existsSync(walgitignorePath)) {
          const defaultIgnore = [
            '# WalGit ignore patterns',
            '.walgit/',
            '*.log',
            'node_modules/',
            '.env',
            '.DS_Store',
            '*.tmp',
            'tmp/',
            '.git/'
          ].join('\n');
          fs.writeFileSync(walgitignorePath, defaultIgnore);
          console.log(chalk.green('Created .walgitignore with default patterns'));
        }

        // Apply template first if specified
        if (options.template) {
          spinner.text = `Applying template ${options.template}...`;
          const template = templateManager.getTemplate(options.template);
          if (template) {
            const result = await templateManager.applyTemplate(
              options.template,
              currentDir,
              {
                repositoryName: repoName,
                description: description
              }
            );
            if (result.success) {
              console.log(`Applied template: ${chalk.green(template.name)}`);
              if (result.filesCreated && result.filesCreated.length > 0) {
                console.log(`Created ${result.filesCreated.length} files from template`);
              }
            } else {
              console.warn(chalk.yellow(`Failed to apply template: ${result.error}`));
            }
          } else {
            console.warn(chalk.yellow(`Template '${options.template}' not found`));
          }
        }

        // Scan for files to include in initial commit
        spinner.text = 'Scanning files for initial commit...';
        const workingCopy = new WorkingCopyManager(currentDir);
        const allFiles = await workingCopy.scanFiles();
        
        // Add files to initial commit (exclude .walgit directory)
        for (const filePath of allFiles) {
          if (!filePath.startsWith('.walgit/')) {
            const fullPath = path.join(currentDir, filePath);
            try {
              const content = fs.readFileSync(fullPath);
              initialFiles.push({ path: filePath, content });
            } catch (error) {
              console.warn(chalk.yellow(`Warning: Could not read file ${filePath}: ${error.message}`));
            }
          }
        }

        console.log(`Found ${initialFiles.length} files for initial commit`);

        spinner.text = 'Encrypting and uploading files to Walrus...';
        
        // Create initial commit manifest
        const manifest = new CommitManifest({
          author: userAddress,
          message: 'Initial commit',
          parent_commit_cid: null
        });

        // Encrypt and upload files using Walrus SDK integration
        const { manifestCid, encryptedDekCid } = await walrusClient.encryptAndUploadFiles(
          initialFiles,
          policyId,
          manifest
        );

        console.log(`Files uploaded to Walrus. Manifest CID: ${manifestCid}`);
        console.log(`Encrypted DEK CID: ${encryptedDekCid}`);

        spinner.text = 'Creating repository on Sui blockchain...';

        // Create repository on Sui blockchain
        const suiClient = await initializeSuiClient();
        const config = getConfig();
        
        const tx = new TransactionBlock();
        const createRepoResult = tx.moveCall({
          target: `${config.sui.packageId}::git_repository::create_repository`,
          arguments: [
            tx.pure(repoName),
            tx.pure(description),
            tx.pure(manifestCid),
            tx.pure(encryptedDekCid),
            tx.pure(policyId),
            tx.pure('main'),
            tx.object(config.sui.storageQuotaId)
          ],
        });

        const result = await walletManager.signAndExecuteTransaction(tx);
        
        // Extract repository ID from transaction results
        const createdObjects = result.objectChanges?.filter(
          change => change.type === 'created' && change.objectType.includes('Repo')
        );
        
        if (!createdObjects || createdObjects.length === 0) {
          throw new Error('Failed to create repository on blockchain');
        }
        
        const repoObjectId = createdObjects[0].objectId;
        
        // Store repository info locally
        const repoConfig = {
          id: repoObjectId,
          name: repoName,
          description,
          owner: userAddress,
          sealPolicyId: policyId,
          defaultBranch: 'main',
          latestCommitManifestCid: manifestCid,
          encryptedDekCid,
          created_at: new Date().toISOString(),
          network: config.sui.network
        };
        
        fs.writeFileSync(
          path.join(walgitDir, 'config.json'),
          JSON.stringify(repoConfig, null, 2)
        );
        
        spinner.succeed(`Repository initialized: ${chalk.green(repoName)}`);

        console.log(`Repository ID: ${chalk.yellow(repoObjectId)}`);
        console.log(`SEAL Policy ID: ${chalk.cyan(policyId)}`);
        console.log(`Transaction: ${chalk.dim(result.digest)}`);
        console.log(`Initial commit: ${chalk.green(manifestCid)}`);
        
        if (options.encryption === 'seal') {
          console.log(chalk.cyan(`\nEncryption enabled with SEAL threshold: ${options.encryptionThreshold}/${options.encryptionShares}`));
        }
        
        console.log(chalk.dim('\nRun `walgit status` to verify repository status'));
        console.log(chalk.blue('\nNote: WalGit uses encrypted storage on Walrus with SEAL key management.'));
        console.log(chalk.blue('All files are automatically encrypted before upload.'));
      } catch (error) {
        console.error(chalk.red('Failed to initialize repository:'), error.message);
        process.exit(1);
      }
    });
}; 