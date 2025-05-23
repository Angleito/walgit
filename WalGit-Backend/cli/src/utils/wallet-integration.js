/**
 * @fileoverview Wallet integration for WalGit CLI
 * Handles Sui wallet management, authentication, and transaction signing
 */

import { SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { fromBase64, toBase64 } from '@mysten/bcs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getConfig, saveConfig } from './config.js';

// Constants
const WALLET_CONFIG_DIR = path.join(os.homedir(), '.walgit', 'wallet');
const KEYSTORE_FILE = path.join(WALLET_CONFIG_DIR, 'keystore.json');
const SESSION_FILE = path.join(WALLET_CONFIG_DIR, 'session.json');
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

/**
 * Secure wallet manager for CLI operations
 */
export class WalletManager {
  constructor() {
    this.suiClient = null;
    this.currentKeypair = null;
    this.currentAddress = null;
    this.isAuthenticated = false;
    this.sessionData = null;
    
    this.ensureWalletDir();
  }

  /**
   * Ensure wallet directory exists
   */
  ensureWalletDir() {
    try {
      if (!fs.existsSync(WALLET_CONFIG_DIR)) {
        fs.mkdirSync(WALLET_CONFIG_DIR, { recursive: true, mode: 0o700 });
      }
    } catch (error) {
      console.error('Failed to create wallet directory:', error.message);
    }
  }

  /**
   * Initialize Sui client
   */
  async initializeSuiClient() {
    if (this.suiClient) return;

    const config = getConfig();
    const endpoint = config.sui?.endpoint || 'https://fullnode.testnet.sui.io:443';
    
    this.suiClient = new SuiClient({ url: endpoint });
    console.log(`Connected to Sui network: ${endpoint}`);
  }

  /**
   * Generate a new keypair
   * @returns {Ed25519Keypair} - New keypair
   */
  generateKeypair() {
    return new Ed25519Keypair();
  }

  /**
   * Encrypt private key for storage
   * @param {string} privateKey - Private key to encrypt
   * @param {string} password - Encryption password
   * @returns {Object} - Encrypted keystore data
   */
  encryptPrivateKey(privateKey, password) {
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);
    
    // Derive key using PBKDF2
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    
    // Encrypt using AES-256-GCM
    const cipher = crypto.createCipherGCM('aes-256-gcm', key);
    let encrypted = cipher.update(privateKey, 'hex', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      algorithm: 'aes-256-gcm',
      iterations: 100000,
      version: '1.0'
    };
  }

  /**
   * Decrypt private key from storage
   * @param {Object} keystoreData - Encrypted keystore data
   * @param {string} password - Decryption password
   * @returns {string} - Decrypted private key
   */
  decryptPrivateKey(keystoreData, password) {
    const { encrypted, salt, iv, tag, algorithm, iterations } = keystoreData;
    
    if (algorithm !== 'aes-256-gcm') {
      throw new Error(`Unsupported encryption algorithm: ${algorithm}`);
    }
    
    // Derive key using PBKDF2
    const key = crypto.pbkdf2Sync(
      password, 
      Buffer.from(salt, 'hex'), 
      iterations, 
      32, 
      'sha256'
    );
    
    // Decrypt using AES-256-GCM
    const decipher = crypto.createDecipherGCM('aes-256-gcm', key);
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'hex');
    decrypted += decipher.final('hex');
    
    return decrypted;
  }

  /**
   * Create a new wallet
   * @param {string} password - Wallet encryption password
   * @returns {Promise<Object>} - Wallet creation result
   */
  async createWallet(password) {
    if (this.walletExists()) {
      throw new Error('Wallet already exists. Use import or recover functions.');
    }

    await this.initializeSuiClient();

    // Generate new keypair
    const keypair = this.generateKeypair();
    const privateKey = keypair.export().privateKey;
    const address = keypair.getPublicKey().toSuiAddress();

    // Encrypt and store private key
    const keystoreData = this.encryptPrivateKey(privateKey, password);
    keystoreData.address = address;
    keystoreData.created_at = new Date().toISOString();

    fs.writeFileSync(KEYSTORE_FILE, JSON.stringify(keystoreData, null, 2), { mode: 0o600 });

    console.log(`New wallet created with address: ${address}`);
    console.log('Please save your private key securely. It cannot be recovered if lost.');
    console.log(`Private key: ${privateKey}`);

    return {
      address,
      privateKey,
      created: true
    };
  }

  /**
   * Import existing wallet from private key
   * @param {string} privateKey - Private key to import
   * @param {string} password - Wallet encryption password
   * @returns {Promise<Object>} - Import result
   */
  async importWallet(privateKey, password) {
    if (this.walletExists()) {
      throw new Error('Wallet already exists. Delete existing wallet first.');
    }

    await this.initializeSuiClient();

    try {
      // Validate private key by creating keypair
      const keypair = Ed25519Keypair.fromSecretKey(fromBase64(privateKey));
      const address = keypair.getPublicKey().toSuiAddress();

      // Encrypt and store private key
      const keystoreData = this.encryptPrivateKey(privateKey, password);
      keystoreData.address = address;
      keystoreData.imported_at = new Date().toISOString();

      fs.writeFileSync(KEYSTORE_FILE, JSON.stringify(keystoreData, null, 2), { mode: 0o600 });

      console.log(`Wallet imported with address: ${address}`);

      return {
        address,
        imported: true
      };
    } catch (error) {
      throw new Error(`Invalid private key: ${error.message}`);
    }
  }

  /**
   * Check if wallet exists
   * @returns {boolean} - True if wallet exists
   */
  walletExists() {
    return fs.existsSync(KEYSTORE_FILE);
  }

  /**
   * Unlock wallet with password
   * @param {string} password - Wallet password
   * @returns {Promise<boolean>} - True if unlocked successfully
   */
  async unlockWallet(password) {
    if (!this.walletExists()) {
      throw new Error('No wallet found. Create or import a wallet first.');
    }

    await this.initializeSuiClient();

    try {
      const keystoreData = JSON.parse(fs.readFileSync(KEYSTORE_FILE, 'utf8'));
      const privateKey = this.decryptPrivateKey(keystoreData, password);
      
      // Create keypair from decrypted private key
      this.currentKeypair = Ed25519Keypair.fromSecretKey(fromBase64(privateKey));
      this.currentAddress = this.currentKeypair.getPublicKey().toSuiAddress();
      this.isAuthenticated = true;

      // Create session
      this.sessionData = {
        address: this.currentAddress,
        unlocked_at: Date.now(),
        expires_at: Date.now() + SESSION_TIMEOUT
      };

      fs.writeFileSync(SESSION_FILE, JSON.stringify(this.sessionData, null, 2), { mode: 0o600 });

      console.log(`Wallet unlocked: ${this.currentAddress}`);
      return true;
    } catch (error) {
      throw new Error(`Failed to unlock wallet: ${error.message}`);
    }
  }

  /**
   * Check if wallet is currently unlocked
   * @returns {boolean} - True if unlocked and session valid
   */
  isWalletUnlocked() {
    if (!this.isAuthenticated || !this.sessionData) {
      // Try to restore session
      try {
        if (fs.existsSync(SESSION_FILE)) {
          const sessionData = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
          if (sessionData.expires_at > Date.now()) {
            this.sessionData = sessionData;
            this.currentAddress = sessionData.address;
            // Don't restore keypair for security - require unlock
            return false;
          }
        }
      } catch (error) {
        // Ignore session restore errors
      }
      return false;
    }

    return this.sessionData.expires_at > Date.now();
  }

  /**
   * Lock wallet (clear sensitive data)
   */
  lockWallet() {
    this.currentKeypair = null;
    this.currentAddress = null;
    this.isAuthenticated = false;
    this.sessionData = null;

    // Remove session file
    try {
      if (fs.existsSync(SESSION_FILE)) {
        fs.unlinkSync(SESSION_FILE);
      }
    } catch (error) {
      console.warn('Failed to remove session file:', error.message);
    }

    console.log('Wallet locked');
  }

  /**
   * Get current wallet address
   * @returns {string|null} - Current address or null if locked
   */
  getCurrentAddress() {
    return this.currentAddress;
  }

  /**
   * Get wallet balance
   * @returns {Promise<Object>} - Wallet balance information
   */
  async getBalance() {
    if (!this.isWalletUnlocked() || !this.currentAddress) {
      throw new Error('Wallet is locked. Unlock wallet first.');
    }

    await this.initializeSuiClient();

    try {
      const balance = await this.suiClient.getBalance({
        owner: this.currentAddress
      });

      const allBalances = await this.suiClient.getAllBalances({
        owner: this.currentAddress
      });

      return {
        sui: balance,
        all: allBalances,
        address: this.currentAddress
      };
    } catch (error) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Sign and execute transaction
   * @param {TransactionBlock} txb - Transaction to execute
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} - Transaction result
   */
  async signAndExecuteTransaction(txb, options = {}) {
    if (!this.isAuthenticated || !this.currentKeypair) {
      throw new Error('Wallet is locked. Unlock wallet first.');
    }

    await this.initializeSuiClient();

    try {
      const result = await this.suiClient.signAndExecuteTransactionBlock({
        signer: this.currentKeypair,
        transactionBlock: txb,
        options: {
          showEffects: true,
          showEvents: true,
          showInput: false,
          showRawInput: false,
          showObjectChanges: true,
          ...options
        }
      });

      if (result.effects?.status?.status !== 'success') {
        throw new Error(`Transaction failed: ${JSON.stringify(result.effects?.status)}`);
      }

      return result;
    } catch (error) {
      throw new Error(`Transaction execution failed: ${error.message}`);
    }
  }

  /**
   * Sign personal message for SEAL authentication
   * @param {string} message - Message to sign
   * @returns {Promise<Object>} - Signature data
   */
  async signPersonalMessage(message) {
    if (!this.isAuthenticated || !this.currentKeypair) {
      throw new Error('Wallet is locked. Unlock wallet first.');
    }

    try {
      const messageBytes = new TextEncoder().encode(message);
      const signature = await this.currentKeypair.signPersonalMessage(messageBytes);

      return {
        signature: toBase64(signature),
        address: this.currentAddress,
        message,
        signed_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Message signing failed: ${error.message}`);
    }
  }

  /**
   * Create a wallet adapter for SEAL integration
   * @returns {Object} - Wallet adapter object
   */
  createWalletAdapter() {
    return {
      currentAccount: {
        address: this.currentAddress
      },
      signPersonalMessage: async ({ message }) => {
        return this.signPersonalMessage(message);
      },
      isConnected: () => this.isWalletUnlocked(),
      getAddress: () => this.currentAddress
    };
  }

  /**
   * Get wallet info
   * @returns {Object} - Wallet information
   */
  getWalletInfo() {
    if (!this.walletExists()) {
      return { exists: false };
    }

    try {
      const keystoreData = JSON.parse(fs.readFileSync(KEYSTORE_FILE, 'utf8'));
      return {
        exists: true,
        address: keystoreData.address,
        created_at: keystoreData.created_at,
        imported_at: keystoreData.imported_at,
        locked: !this.isWalletUnlocked()
      };
    } catch (error) {
      return {
        exists: true,
        error: 'Failed to read wallet info'
      };
    }
  }

  /**
   * Delete wallet (permanently)
   * @param {string} password - Wallet password for confirmation
   * @returns {boolean} - True if deleted successfully
   */
  async deleteWallet(password) {
    if (!this.walletExists()) {
      throw new Error('No wallet found');
    }

    // Verify password before deletion
    try {
      const keystoreData = JSON.parse(fs.readFileSync(KEYSTORE_FILE, 'utf8'));
      this.decryptPrivateKey(keystoreData, password);
    } catch (error) {
      throw new Error('Incorrect password');
    }

    // Lock wallet and remove files
    this.lockWallet();
    
    try {
      fs.unlinkSync(KEYSTORE_FILE);
      if (fs.existsSync(SESSION_FILE)) {
        fs.unlinkSync(SESSION_FILE);
      }
      console.log('Wallet deleted successfully');
      return true;
    } catch (error) {
      throw new Error(`Failed to delete wallet: ${error.message}`);
    }
  }
}

// Export singleton instance
export const walletManager = new WalletManager();

// CLI command helpers
export const walletCommands = {
  /**
   * Create new wallet command
   */
  async create(password) {
    if (!password) {
      throw new Error('Password is required');
    }
    return await walletManager.createWallet(password);
  },

  /**
   * Import wallet command
   */
  async import(privateKey, password) {
    if (!privateKey || !password) {
      throw new Error('Private key and password are required');
    }
    return await walletManager.importWallet(privateKey, password);
  },

  /**
   * Unlock wallet command
   */
  async unlock(password) {
    if (!password) {
      throw new Error('Password is required');
    }
    return await walletManager.unlockWallet(password);
  },

  /**
   * Lock wallet command
   */
  lock() {
    walletManager.lockWallet();
    return { locked: true };
  },

  /**
   * Get wallet status
   */
  status() {
    return walletManager.getWalletInfo();
  },

  /**
   * Get balance command
   */
  async balance() {
    return await walletManager.getBalance();
  },

  /**
   * Delete wallet command
   */
  async delete(password) {
    if (!password) {
      throw new Error('Password is required for wallet deletion');
    }
    return await walletManager.deleteWallet(password);
  }
};