import chalk from 'chalk';
import ora from 'ora';
import { validateWalletConnection, executeTransaction } from '../utils/sui-wallet-integration.js';
import { initializeSuiClient } from '../utils/sui-integration.js';
import { getConfig } from '../utils/config.js';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import fs from 'fs';
import path from 'path';

/**
 * Share repository with collaborators
 * @param {import('commander').Command} program - Commander program instance
 */
export const shareCommand = (program) => {
  program
    .command('share <repository-id-or-path> <collaborator-address> <role>')
    .description('Share repository with a collaborator')
    .option('-r, --remove', 'Remove collaborator instead of adding')
    .action(async (repoIdOrPath, collaboratorAddress, role, options) => {
      try {
        // Ensure wallet is connected
        const wallet = await validateWalletConnection();

        // Validate role
        const validRoles = ['reader', 'writer', 'admin'];
        if (!validRoles.includes(role.toLowerCase()) && !options.remove) {
          throw new Error(`Invalid role: ${role}. Valid roles: ${validRoles.join(', ')}`);
        }

        // Convert role to numeric value
        const roleMap = {
          'reader': 1,
          'writer': 2,
          'admin': 3
        };
        const roleValue = roleMap[role.toLowerCase()];

        let repositoryId = repoIdOrPath;

        // Check if it's a path to a local repository
        if (repoIdOrPath === '.' || fs.existsSync(repoIdOrPath)) {
          const targetDir = repoIdOrPath === '.' ? process.cwd() : repoIdOrPath;
          const configPath = path.join(targetDir, '.walgit', 'config.json');
          
          if (fs.existsSync(configPath)) {
            const repoConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            repositoryId = repoConfig.id;
            console.log(`Using repository: ${chalk.cyan(repoConfig.name)} (${repositoryId})`);
          } else {
            throw new Error('Not a WalGit repository. Use repository ID instead.');
          }
        }

        const spinner = ora('Fetching repository information...').start();

        // Fetch repository object to verify ownership
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
        const userAddress = wallet.address;

        // Check if user is owner or admin
        const isOwner = repoData.owner === userAddress;
        const isAdmin = repoData.collaborators && 
                       repoData.collaborators.fields && 
                       repoData.collaborators.fields.contents &&
                       repoData.collaborators.fields.contents.some(
                         collab => collab.fields.key === userAddress && collab.fields.value >= 3
                       );

        if (!isOwner && !isAdmin) {
          throw new Error('Access denied. Only repository owner or admin can manage collaborators.');
        }

        console.log(`Repository: ${chalk.cyan(repoData.name)}`);
        console.log(`Owner: ${chalk.yellow(repoData.owner)}`);

        // Validate collaborator address format (basic validation)
        if (!collaboratorAddress.startsWith('0x') || collaboratorAddress.length !== 66) {
          throw new Error('Invalid collaborator address format. Should be a 64-character hex string starting with 0x');
        }

        const config = getConfig();
        const tx = new TransactionBlock();

        if (options.remove) {
          spinner.text = 'Removing collaborator...';
          
          // Remove collaborator
          tx.moveCall({
            target: `${config.sui.packageId}::git_repository::remove_collaborator`,
            arguments: [
              tx.object(repositoryId),
              tx.pure(collaboratorAddress)
            ],
          });

          const result = await executeTransaction(tx);
          
          spinner.succeed('Collaborator removed successfully');
          console.log(`Removed: ${chalk.red(collaboratorAddress)}`);
          console.log(`Transaction: ${chalk.dim(result.digest)}`);
        } else {
          spinner.text = `Adding collaborator with ${role} role...`;
          
          // Add collaborator
          tx.moveCall({
            target: `${config.sui.packageId}::git_repository::add_collaborator`,
            arguments: [
              tx.object(repositoryId),
              tx.pure(collaboratorAddress),
              tx.pure(roleValue)
            ],
          });

          const result = await executeTransaction(tx);
          
          spinner.succeed('Collaborator added successfully');
          console.log(`Added: ${chalk.green(collaboratorAddress)}`);
          console.log(`Role: ${chalk.cyan(role)}`);
          console.log(`Transaction: ${chalk.dim(result.digest)}`);
          
          console.log(chalk.blue('\nCollaborator permissions:'));
          if (role === 'reader') {
            console.log(chalk.blue('• Can clone and read repository contents'));
            console.log(chalk.blue('• Cannot make commits or changes'));
          } else if (role === 'writer') {
            console.log(chalk.blue('• Can clone and read repository contents'));
            console.log(chalk.blue('• Can make commits and push changes'));
            console.log(chalk.blue('• Cannot manage other collaborators'));
          } else if (role === 'admin') {
            console.log(chalk.blue('• Can clone and read repository contents'));
            console.log(chalk.blue('• Can make commits and push changes'));
            console.log(chalk.blue('• Can manage other collaborators'));
            console.log(chalk.blue('• Cannot delete the repository (owner only)'));
          }
        }

        console.log(chalk.yellow('\nNote: Collaborators need to have SEAL decryption access to read repository contents.'));
        console.log(chalk.yellow('Repository files are encrypted and require proper SEAL key shares.'));
        
      } catch (error) {
        console.error(chalk.red('Failed to manage collaborator:'), error.message);
        process.exit(1);
      }
    });

  // List collaborators command
  program
    .command('collaborators <repository-id-or-path>')
    .description('List repository collaborators')
    .action(async (repoIdOrPath) => {
      try {
        // Ensure wallet is connected
        const wallet = await validateWalletConnection();

        let repositoryId = repoIdOrPath;

        // Check if it's a path to a local repository
        if (repoIdOrPath === '.' || fs.existsSync(repoIdOrPath)) {
          const targetDir = repoIdOrPath === '.' ? process.cwd() : repoIdOrPath;
          const configPath = path.join(targetDir, '.walgit', 'config.json');
          
          if (fs.existsSync(configPath)) {
            const repoConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            repositoryId = repoConfig.id;
          } else {
            throw new Error('Not a WalGit repository. Use repository ID instead.');
          }
        }

        const spinner = ora('Fetching collaborators...').start();

        // Fetch repository object
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
        
        spinner.succeed('Collaborators retrieved');
        
        console.log(`Repository: ${chalk.cyan(repoData.name)}`);
        console.log(`Owner: ${chalk.yellow(repoData.owner)} ${chalk.dim('(owner)')}`);
        
        if (repoData.collaborators && 
            repoData.collaborators.fields && 
            repoData.collaborators.fields.contents &&
            repoData.collaborators.fields.contents.length > 0) {
          
          console.log('\nCollaborators:');
          const roleNames = { 1: 'reader', 2: 'writer', 3: 'admin' };
          
          repoData.collaborators.fields.contents.forEach(collab => {
            const address = collab.fields.key;
            const roleValue = collab.fields.value;
            const roleName = roleNames[roleValue] || 'unknown';
            const roleColor = roleValue === 3 ? 'red' : roleValue === 2 ? 'yellow' : 'green';
            
            console.log(`  ${address} ${chalk[roleColor](`(${roleName})`)}`);
          });
        } else {
          console.log(chalk.gray('\nNo collaborators found'));
        }
        
        console.log(chalk.blue('\nUse `walgit share <repo> <address> <role>` to add collaborators'));
        console.log(chalk.blue('Valid roles: reader, writer, admin'));
        
      } catch (error) {
        console.error(chalk.red('Failed to list collaborators:'), error.message);
        process.exit(1);
      }
    });
};