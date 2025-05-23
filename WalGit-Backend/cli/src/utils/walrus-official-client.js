/**
 * @fileoverview Official Walrus Client Integration
 * Uses the official Walrus SDK and follows documented patterns
 * Based on https://docs.wal.app/ documentation
 */

import { WalrusClient } from '@mysten/walrus';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';

/**
 * Official Walrus configuration following docs.wal.app format
 */
export class WalrusOfficialClient {
  constructor() {
    this.config = null;
    this.client = null;
    this.suiClient = null;
    this.initialized = false;
  }

  /**
   * Load official Walrus configuration from standard locations
   * Following the documented configuration pattern
   */
  async loadConfig() {
    const configPaths = [
      path.join(process.cwd(), 'client_config.yaml'),
      path.join(os.homedir(), '.config', 'walrus', 'client_config.yaml'),
      path.join(os.homedir(), '.walrus', 'client_config.yaml'),
      path.join(process.cwd(), 'walrus-client-config.yaml')
    ];

    for (const configPath of configPaths) {
      try {
        const configContent = await fs.readFile(configPath, 'utf8');
        this.config = yaml.load(configContent);
        console.log(`Loaded Walrus config from: ${configPath}`);
        return;
      } catch (error) {
        // Continue to next path
      }
    }

    throw new Error('No Walrus configuration found. Please create client_config.yaml');
  }

  /**
   * Initialize the official Walrus client
   */
  async initialize() {
    if (this.initialized) return;

    await this.loadConfig();

    const context = this.config.default_context || 'testnet';
    const contextConfig = this.config.contexts[context];

    if (!contextConfig) {
      throw new Error(`Context '${context}' not found in configuration`);
    }

    // Initialize Sui client
    const rpcUrl = contextConfig.rpc_urls[0] || getFullnodeUrl(context);
    this.suiClient = new SuiClient({ url: rpcUrl });

    // Load wallet configuration
    const walletConfigPath = contextConfig.wallet_config?.path || 
                            path.join(os.homedir(), '.sui', 'sui_config', 'client.yaml');
    
    try {
      const walletContent = await fs.readFile(walletConfigPath, 'utf8');
      const walletConfig = yaml.load(walletContent);
      
      // Get active address
      const activeEnv = contextConfig.wallet_config?.active_env || walletConfig.active_env;
      const activeAddress = contextConfig.wallet_config?.active_address || walletConfig.active_address;
      
      console.log(`Using Sui wallet: ${activeAddress} on ${activeEnv}`);
    } catch (error) {
      console.warn('Could not load Sui wallet config:', error.message);
    }

    // Initialize Walrus client with proper configuration
    this.client = new WalrusClient({
      suiClient: this.suiClient,
      systemObject: contextConfig.system_object,
      stakingObject: contextConfig.staking_object,
      communicationConfig: this.config.communication_config,
      refreshConfig: this.config.refresh_config
    });

    this.initialized = true;
    console.log(`Walrus client initialized for ${context} network`);
  }

  /**
   * Store a blob using official Walrus API
   * @param {Buffer} data - Data to store
   * @param {Object} options - Storage options
   * @returns {Promise<Object>} Storage result with blob ID
   */
  async storeBlob(data, options = {}) {
    await this.initialize();

    const { 
      epochs = 5,  // Storage duration
      forceSmallBlob = false 
    } = options;

    try {
      console.log(`Storing ${data.length} bytes in Walrus for ${epochs} epochs`);
      
      const result = await this.client.store({
        data,
        epochs,
        forceSmallBlob
      });

      console.log(`Blob stored successfully: ${result.blobId}`);
      
      return {
        success: true,
        blobId: result.blobId,
        blobObject: result.blobObject,
        resourceObject: result.resourceObject,
        cost: result.cost,
        epochs
      };
    } catch (error) {
      console.error('Failed to store blob:', error);
      throw new Error(`Walrus storage failed: ${error.message}`);
    }
  }

  /**
   * Read a blob using official Walrus API
   * @param {string} blobId - Blob ID to retrieve
   * @returns {Promise<Buffer>} Retrieved data
   */
  async readBlob(blobId) {
    await this.initialize();

    try {
      console.log(`Reading blob: ${blobId}`);
      
      const data = await this.client.read(blobId);
      
      console.log(`Blob read successfully: ${data.length} bytes`);
      return Buffer.from(data);
    } catch (error) {
      console.error('Failed to read blob:', error);
      throw new Error(`Walrus read failed: ${error.message}`);
    }
  }

  /**
   * Get blob information
   * @param {string} blobId - Blob ID to check
   * @returns {Promise<Object>} Blob information
   */
  async getBlobInfo(blobId) {
    await this.initialize();

    try {
      const info = await this.client.blobInfo(blobId);
      
      return {
        blobId,
        length: info.length,
        encoding: info.encoding,
        deletable: info.deletable
      };
    } catch (error) {
      console.error('Failed to get blob info:', error);
      throw new Error(`Blob info failed: ${error.message}`);
    }
  }

  /**
   * List all blobs in the current storage
   * @returns {Promise<Array>} List of blob IDs
   */
  async listBlobs() {
    await this.initialize();

    try {
      const blobs = await this.client.listBlobs();
      
      return blobs.map(blob => ({
        blobId: blob.blobId,
        length: blob.length,
        encoding: blob.encoding
      }));
    } catch (error) {
      console.error('Failed to list blobs:', error);
      throw new Error(`List blobs failed: ${error.message}`);
    }
  }

  /**
   * Get current storage quota and usage
   * @returns {Promise<Object>} Storage information
   */
  async getStorageInfo() {
    await this.initialize();

    const context = this.config.default_context || 'testnet';
    const contextConfig = this.config.contexts[context];

    try {
      // Query storage objects on Sui
      const systemObject = await this.suiClient.getObject({
        id: contextConfig.system_object,
        options: { showContent: true }
      });

      const stakingObject = await this.suiClient.getObject({
        id: contextConfig.staking_object, 
        options: { showContent: true }
      });

      return {
        systemObject: systemObject.data,
        stakingObject: stakingObject.data,
        network: context
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      throw new Error(`Storage info failed: ${error.message}`);
    }
  }

  /**
   * Batch store multiple blobs efficiently
   * @param {Array<Buffer>} dataArray - Array of data to store
   * @param {Object} options - Storage options
   * @returns {Promise<Array>} Array of storage results
   */
  async batchStore(dataArray, options = {}) {
    const results = [];
    
    console.log(`Batch storing ${dataArray.length} blobs`);
    
    for (let i = 0; i < dataArray.length; i++) {
      const data = dataArray[i];
      
      try {
        console.log(`Storing blob ${i + 1}/${dataArray.length} (${data.length} bytes)`);
        const result = await this.storeBlob(data, options);
        results.push(result);
        
        // Small delay to avoid overwhelming the network
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to store blob ${i + 1}:`, error);
        results.push({ success: false, error: error.message });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    console.log(`Batch store completed: ${successful}/${dataArray.length} successful`);
    
    return results;
  }

  /**
   * Verify blob integrity
   * @param {string} blobId - Blob ID to verify
   * @param {Buffer} originalData - Original data for comparison
   * @returns {Promise<boolean>} Verification result
   */
  async verifyBlob(blobId, originalData) {
    try {
      const retrievedData = await this.readBlob(blobId);
      return Buffer.compare(originalData, retrievedData) === 0;
    } catch (error) {
      console.error('Blob verification failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const walrusOfficialClient = new WalrusOfficialClient();

// Export class for advanced usage
export { WalrusOfficialClient };