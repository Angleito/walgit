/**
 * @fileoverview Authentication using Sui CLI wallet
 */

import chalk from 'chalk';
import { 
  initializeWallet as initSuiWallet, 
  validateWalletConnection as validateSuiWallet 
} from './sui-wallet-integration.js';

/**
 * Initialize and connect to Sui CLI wallet
 * @returns {Promise<object>} Connected wallet session
 */
export const initializeWallet = async () => {
  // Check for local simulation mode
  if (process.env.WALGIT_LOCAL_SIMULATION === 'true') {
    console.log(chalk.yellow('Running in local simulation mode. Using mock wallet.'));
    return {
      address: '0xLOCAL_SIMULATION_WALLET_ADDRESS',
      publicKey: 'mock-public-key',
      keypair: null,
      client: null,
      network: 'local-simulation'
    };
  }

  // Use Sui CLI wallet
  return initSuiWallet();
};

/**
 * Check if wallet is connected and valid
 * @returns {Promise<object>} Wallet session if valid
 * @throws {Error} If wallet is not connected or invalid
 */
export const validateWalletConnection = async () => {
  // Check for local simulation mode
  if (process.env.WALGIT_LOCAL_SIMULATION === 'true') {
    return {
      address: '0xLOCAL_SIMULATION_WALLET_ADDRESS',
      publicKey: 'mock-public-key',
      keypair: null,
      client: null,
      network: 'local-simulation'
    };
  }

  return validateSuiWallet();
};