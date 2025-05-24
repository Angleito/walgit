import chalk from 'chalk';
import ora from 'ora';
import { displayWalletInfo, getActiveAddress, getActiveNetwork, getBalance } from '../utils/sui-wallet-integration.js';
import { execSync } from 'child_process';

/**
 * Register wallet management commands (using Sui CLI)
 * @param {import('commander').Command} program - Commander program instance
 */
export const walletCommand = (program) => {
  const wallet = program
    .command('wallet')
    .description('Display Sui CLI wallet information');

  // Show wallet info
  wallet
    .command('info')
    .alias('show')
    .description('Show current Sui CLI wallet information')
    .action(async () => {
      try {
        await displayWalletInfo();
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  // Show active address
  wallet
    .command('address')
    .description('Show active Sui address')
    .action(async () => {
      try {
        const address = getActiveAddress();
        console.log(chalk.green('Active address:'), address);
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  // Show balance
  wallet
    .command('balance')
    .description('Show wallet balance')
    .action(async () => {
      try {
        const spinner = ora('Fetching balance...').start();
        const balance = await getBalance();
        spinner.stop();
        
        const suiBalance = (parseInt(balance.totalBalance) / 1e9).toFixed(4);
        console.log(chalk.green('Balance:'), `${suiBalance} SUI`);
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  // Switch network
  wallet
    .command('switch-network <network>')
    .description('Switch Sui network (testnet, mainnet, devnet)')
    .action(async (network) => {
      try {
        execSync(`sui client switch --env ${network}`, { stdio: 'inherit' });
        console.log(chalk.green('✓'), `Switched to ${network}`);
      } catch (error) {
        console.error(chalk.red('Error:'), 'Failed to switch network');
        process.exit(1);
      }
    });

  // Help for Sui CLI setup
  wallet
    .command('setup-help')
    .description('Show help for setting up Sui CLI')
    .action(() => {
      console.log(chalk.cyan('\n╔════════════════════════════════════════════════════╗'));
      console.log(chalk.cyan('║              Sui CLI Setup Guide                   ║'));
      console.log(chalk.cyan('╠════════════════════════════════════════════════════╣'));
      console.log(chalk.cyan('║                                                    ║'));
      console.log(chalk.cyan('║') + ' 1. Install Sui CLI:                               ' + chalk.cyan('║'));
      console.log(chalk.cyan('║') + chalk.yellow('    https://docs.sui.io/guides/developer/         ') + chalk.cyan('║'));
      console.log(chalk.cyan('║') + chalk.yellow('    getting-started/sui-install                    ') + chalk.cyan('║'));
      console.log(chalk.cyan('║                                                    ║'));
      console.log(chalk.cyan('║') + ' 2. Create a new address:                          ' + chalk.cyan('║'));
      console.log(chalk.cyan('║') + chalk.white('    sui client new-address ed25519                 ') + chalk.cyan('║'));
      console.log(chalk.cyan('║                                                    ║'));
      console.log(chalk.cyan('║') + ' 3. Switch to testnet:                             ' + chalk.cyan('║'));
      console.log(chalk.cyan('║') + chalk.white('    sui client switch --env testnet                ') + chalk.cyan('║'));
      console.log(chalk.cyan('║                                                    ║'));
      console.log(chalk.cyan('║') + ' 4. Get testnet SUI:                               ' + chalk.cyan('║'));
      console.log(chalk.cyan('║') + chalk.yellow('    Join Discord: https://discord.gg/sui           ') + chalk.cyan('║'));
      console.log(chalk.cyan('║') + chalk.yellow('    Use #testnet-faucet channel                    ') + chalk.cyan('║'));
      console.log(chalk.cyan('║                                                    ║'));
      console.log(chalk.cyan('║') + ' 5. Verify setup:                                  ' + chalk.cyan('║'));
      console.log(chalk.cyan('║') + chalk.white('    walgit wallet info                             ') + chalk.cyan('║'));
      console.log(chalk.cyan('║                                                    ║'));
      console.log(chalk.cyan('╚════════════════════════════════════════════════════╝\n'));
    });

  // Default action - show info
  wallet.action(async () => {
    try {
      await displayWalletInfo();
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      console.log(chalk.yellow('\nRun "walgit wallet setup-help" for setup instructions'));
      process.exit(1);
    }
  });
};