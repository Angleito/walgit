import chalk from 'chalk';
import { getWalletConfig, updateWalletConfig } from './config.js';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { SuiClient } from '@mysten/sui.js/client';

/**
 * Initialize and connect to SUI wallet
 * @returns {Promise<object>} Connected wallet session
 */
export const initializeWallet = async () => {
  // Get current wallet config
  const walletConfig = await getWalletConfig();
  
  if (walletConfig.keypair) {
    try {
      // Restore keypair from config
      const keyPair = Ed25519Keypair.fromSecretKey(
        Buffer.from(walletConfig.keypair, 'base64')
      );
      
      // Set up SUI client
      const network = process.env.WALGIT_NETWORK || 'devnet';
      const client = new SuiClient({
        url: networkToRpcUrl(network),
      });
      
      // Verify connection by trying to get the address
      const address = keyPair.getPublicKey().toSuiAddress();
      
      return {
        address,
        keypair: keyPair,
        client,
        network
      };
    } catch (error) {
      // Failed to restore wallet, will need to re-authenticate
      console.warn(chalk.yellow('Failed to restore wallet configuration'));
    }
  }
  
  throw new Error('No wallet configuration found. Please run `walgit auth` to authenticate.');
};

/**
 * Check if wallet is connected and valid
 * @returns {Promise<object>} Wallet session if valid
 * @throws {Error} If wallet is not connected or invalid
 */
export const validateWalletConnection = async () => {
  try {
    const wallet = await initializeWallet();
    return wallet;
  } catch (error) {
    throw new Error('Wallet not connected or invalid. Please run `walgit auth` to authenticate.');
  }
};

/**
 * Convert network name to RPC URL
 * @param {string} network - Network name (devnet, testnet, mainnet)
 * @returns {string} RPC URL
 */
const networkToRpcUrl = (network) => {
  switch (network.toLowerCase()) {
    case 'devnet':
      return 'https://fullnode.devnet.sui.io:443';
    case 'testnet':
      return 'https://fullnode.testnet.sui.io:443';
    case 'mainnet':
      return 'https://fullnode.mainnet.sui.io:443';
    default:
      throw new Error(`Unknown network: ${network}`);
  }
}; 