import { program } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { updateWalletConfig } from './utils/config.js';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';

// Authentication command
program
  .command('auth')
  .description('Authenticate with your Sui wallet')
  .option('--network <network>', 'Set network (devnet, testnet, mainnet)', 'devnet')
  .action(async (options) => {
    console.log(chalk.blue('WalGit CLI - Authentication'));
    console.log(chalk.dim('Authenticate with your Sui wallet to use WalGit'));
    
    const { authMethod } = await inquirer.prompt([
      {
        type: 'list',
        name: 'authMethod',
        message: 'How would you like to authenticate?',
        choices: [
          { name: 'Generate a new keypair', value: 'generate' },
          { name: 'Import private key', value: 'import' }
        ]
      }
    ]);
    
    let keypair;
    
    if (authMethod === 'generate') {
      // Generate new keypair
      keypair = new Ed25519Keypair();
      console.log(chalk.green('New keypair generated!'));
    } else {
      // Import existing private key
      const { privateKey } = await inquirer.prompt([
        {
          type: 'password',
          name: 'privateKey',
          message: 'Enter your private key (will not be shown)',
          validate: input => input.length > 0 ? true : 'Private key is required'
        }
      ]);
      
      try {
        keypair = Ed25519Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));
      } catch (error) {
        console.error(chalk.red('Invalid private key format'));
        process.exit(1);
      }
    }
    
    const address = keypair.getPublicKey().toSuiAddress();
    
    // Save wallet configuration
    await updateWalletConfig({
      address,
      keypair: Buffer.from(keypair.export().privateKey).toString('base64'),
      network: options.network
    });
    
    console.log(chalk.green('\nAuthentication successful!'));
    console.log(`Wallet address: ${chalk.yellow(address)}`);
    console.log(`Network: ${chalk.yellow(options.network)}`);
    
    if (authMethod === 'generate') {
      console.log(chalk.yellow('\nImportant: Save your private key securely:'));
      console.log(chalk.dim(Buffer.from(keypair.export().privateKey).toString('base64')));
      console.log(chalk.dim('You will need this to recover your wallet if needed.'));
    }
  });

// Version command
program
  .command('version')
  .description('Show CLI version')
  .action(() => {
    console.log('WalGit CLI v0.1.0');
  });

export default program; 