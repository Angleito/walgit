import chalk from 'chalk';
import ora from 'ora';
import { walletCommands } from '../utils/wallet-integration.js';
import { getInput, getPassword } from '../utils/input.js';

/**
 * Register wallet management commands
 * @param {import('commander').Command} program - Commander program instance
 */
export const walletCommand = (program) => {
  const wallet = program
    .command('wallet')
    .description('Manage wallet for WalGit operations');

  // Create new wallet
  wallet
    .command('create')
    .description('Create a new wallet')
    .option('--password <password>', 'Wallet password (not recommended, use interactive mode)')
    .action(async (options) => {
      try {
        const spinner = ora('Creating new wallet...').start();
        
        let password = options.password;
        if (!password) {
          spinner.stop();
          console.log(chalk.yellow('Please create a secure password for your wallet:'));
          password = await getPassword('Password: ');
          const confirmPassword = await getPassword('Confirm password: ');
          
          if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
          }
          
          if (password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
          }
          
          spinner.start('Creating wallet...');
        }

        const result = await walletCommands.create(password);
        
        spinner.succeed('Wallet created successfully!');
        console.log(`Address: ${chalk.green(result.address)}`);
        console.log(chalk.yellow('\nIMPORTANT: Save your private key securely!'));
        console.log(chalk.red('Your private key (keep this secret):'));
        console.log(chalk.dim(result.privateKey));
        console.log(chalk.yellow('\nYour wallet is now ready to use.'));
        console.log(chalk.blue('Next steps:'));
        console.log(chalk.blue('1. Fund your wallet with SUI tokens'));
        console.log(chalk.blue('2. Configure Walrus and SEAL API keys'));
        console.log(chalk.blue('3. Run `walgit wallet unlock` to start using WalGit'));
      } catch (error) {
        console.error(chalk.red('Failed to create wallet:'), error.message);
        process.exit(1);
      }
    });

  // Import existing wallet
  wallet
    .command('import')
    .description('Import an existing wallet from private key')
    .option('--private-key <key>', 'Private key (not recommended, use interactive mode)')
    .option('--password <password>', 'Wallet password (not recommended, use interactive mode)')
    .action(async (options) => {
      try {
        const spinner = ora('Importing wallet...').start();
        
        let privateKey = options.privateKey;
        let password = options.password;
        
        if (!privateKey || !password) {
          spinner.stop();
          
          if (!privateKey) {
            console.log(chalk.yellow('Enter your private key (base64 format):'));
            privateKey = await getPassword('Private key: ');
          }
          
          if (!password) {
            console.log(chalk.yellow('Create a password to encrypt your wallet:'));
            password = await getPassword('Password: ');
            const confirmPassword = await getPassword('Confirm password: ');
            
            if (password !== confirmPassword) {
              throw new Error('Passwords do not match');
            }
          }
          
          spinner.start('Importing wallet...');
        }

        const result = await walletCommands.import(privateKey, password);
        
        spinner.succeed('Wallet imported successfully!');
        console.log(`Address: ${chalk.green(result.address)}`);
        console.log(chalk.yellow('Your wallet is now ready to use.'));
        console.log(chalk.blue('Run `walgit wallet unlock` to start using WalGit'));
      } catch (error) {
        console.error(chalk.red('Failed to import wallet:'), error.message);
        process.exit(1);
      }
    });

  // Unlock wallet
  wallet
    .command('unlock')
    .description('Unlock wallet for operations')
    .option('--password <password>', 'Wallet password (not recommended, use interactive mode)')
    .action(async (options) => {
      try {
        let password = options.password;
        
        if (!password) {
          console.log(chalk.yellow('Enter your wallet password:'));
          password = await getPassword('Password: ');
        }

        const spinner = ora('Unlocking wallet...').start();
        await walletCommands.unlock(password);
        
        spinner.succeed('Wallet unlocked successfully!');
        console.log(chalk.green('You can now use WalGit commands.'));
        console.log(chalk.dim('Wallet will lock automatically after 30 minutes of inactivity.'));
      } catch (error) {
        console.error(chalk.red('Failed to unlock wallet:'), error.message);
        process.exit(1);
      }
    });

  // Lock wallet
  wallet
    .command('lock')
    .description('Lock wallet')
    .action(() => {
      try {
        walletCommands.lock();
        console.log(chalk.green('Wallet locked successfully'));
        console.log(chalk.dim('Run `walgit wallet unlock` when you need to use WalGit again'));
      } catch (error) {
        console.error(chalk.red('Failed to lock wallet:'), error.message);
      }
    });

  // Show wallet status
  wallet
    .command('status')
    .description('Show wallet status and address')
    .action(() => {
      try {
        const status = walletCommands.status();
        
        if (!status.exists) {
          console.log(chalk.yellow('No wallet found'));
          console.log(chalk.blue('Run `walgit wallet create` or `walgit wallet import` to get started'));
          return;
        }

        console.log(`Address: ${chalk.green(status.address)}`);
        console.log(`Status: ${status.locked ? chalk.red('Locked') : chalk.green('Unlocked')}`);
        
        if (status.created_at) {
          console.log(`Created: ${chalk.dim(new Date(status.created_at).toLocaleString())}`);
        }
        
        if (status.imported_at) {
          console.log(`Imported: ${chalk.dim(new Date(status.imported_at).toLocaleString())}`);
        }

        if (status.locked) {
          console.log(chalk.blue('\nRun `walgit wallet unlock` to use WalGit commands'));
        }
      } catch (error) {
        console.error(chalk.red('Failed to get wallet status:'), error.message);
      }
    });

  // Show wallet balance
  wallet
    .command('balance')
    .description('Show wallet balance')
    .action(async () => {
      try {
        const spinner = ora('Fetching balance...').start();
        const balance = await walletCommands.balance();
        
        spinner.succeed('Balance retrieved');
        console.log(`Address: ${chalk.green(balance.address)}`);
        console.log(`SUI Balance: ${chalk.cyan(parseFloat(balance.sui.totalBalance) / 1000000000)} SUI`);
        
        if (balance.all && balance.all.length > 1) {
          console.log('\nAll balances:');
          balance.all.forEach(coin => {
            const amount = parseFloat(coin.totalBalance) / Math.pow(10, 9); // Assuming 9 decimals
            console.log(`  ${coin.coinType}: ${amount}`);
          });
        }
      } catch (error) {
        console.error(chalk.red('Failed to get balance:'), error.message);
      }
    });

  // Delete wallet
  wallet
    .command('delete')
    .description('Permanently delete wallet')
    .option('--password <password>', 'Wallet password (not recommended, use interactive mode)')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (options) => {
      try {
        if (!options.confirm) {
          console.log(chalk.red('WARNING: This will permanently delete your wallet!'));
          console.log(chalk.red('Make sure you have backed up your private key.'));
          const confirm = await getInput('Type "DELETE" to confirm: ');
          
          if (confirm !== 'DELETE') {
            console.log(chalk.yellow('Wallet deletion cancelled'));
            return;
          }
        }

        let password = options.password;
        if (!password) {
          console.log(chalk.yellow('Enter your wallet password to confirm deletion:'));
          password = await getPassword('Password: ');
        }

        const spinner = ora('Deleting wallet...').start();
        await walletCommands.delete(password);
        
        spinner.succeed('Wallet deleted successfully');
        console.log(chalk.red('Your wallet has been permanently deleted'));
      } catch (error) {
        console.error(chalk.red('Failed to delete wallet:'), error.message);
        process.exit(1);
      }
    });
};