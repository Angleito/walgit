/**
 * Tusky storage integration for WalGit
 * Provides free storage options through Tusky for users who don't want to manage 
 * their own Walrus storage accounts
 */

import fetch from 'node-fetch';
import crypto from 'crypto';
import { getConfig, saveConfig } from './config.js';
import { calculateContentHash } from './walrus-integration.js';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';

// Constants
const TUSKY_API_ENDPOINT = process.env.TUSKY_API_ENDPOINT || 'https://api.tusky.io';
const TUSKY_FREE_TIER_LIMIT = 5 * 1024 * 1024 * 1024; // 5GB for free tier
const TUSKY_WALGIT_ACCOUNT_ID = process.env.TUSKY_WALGIT_ACCOUNT || 'walgit-shared';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

/**
 * Tusky client for storage operations
 */
export class TuskyClient {
  constructor(apiKey, accountType = 'personal') {
    this.apiKey = apiKey;
    this.accountType = accountType;
    this.baseUrl = TUSKY_API_ENDPOINT;
    this.accountId = accountType === 'walgit' ? TUSKY_WALGIT_ACCOUNT_ID : null;
  }

  /**
   * Authenticate with Tusky
   * @param {Object} options - Authentication options
   * @returns {Promise<Object>} - Authentication result
   */
  async authenticate(options = {}) {
    const { email, password, githubToken } = options;

    try {
      const authData = {
        accountType: this.accountType
      };

      if (this.accountType === 'personal') {
        if (githubToken) {
          authData.githubToken = githubToken;
        } else if (email && password) {
          authData.email = email;
          authData.password = password;
        } else {
          throw new Error('Personal account requires either GitHub token or email/password');
        }
      }

      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(authData)
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      this.apiKey = result.apiKey;
      this.accountId = result.accountId;
      
      return {
        apiKey: result.apiKey,
        accountId: result.accountId,
        accountType: this.accountType,
        quota: result.quota,
        used: result.used
      };
    } catch (error) {
      console.error('Tusky authentication error:', error);
      throw error;
    }
  }

  /**
   * Get account quota information
   * @returns {Promise<Object>} - Quota information
   */
  async getQuota() {
    try {
      const response = await fetch(`${this.baseUrl}/account/quota`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get quota: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        total: result.total,
        used: result.used,
        available: result.total - result.used,
        percentage: ((result.used / result.total) * 100).toFixed(2),
        accountType: this.accountType,
        isShared: this.accountType === 'walgit'
      };
    } catch (error) {
      console.error('Error getting quota:', error);
      throw error;
    }
  }

  /**
   * Upload content to Tusky
   * @param {Buffer|string} content - Content to upload
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} - Upload result
   */
  async upload(content, options = {}) {
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
    const contentHash = calculateContentHash(buffer);
    
    // Check if content already exists
    const existing = await this.checkContentExists(contentHash);
    if (existing) {
      return {
        ...existing,
        deduplicated: true
      };
    }

    // Check quota before upload
    const quota = await this.getQuota();
    if (buffer.length > quota.available) {
      throw new Error(`Insufficient storage quota. Need ${buffer.length}, have ${quota.available}`);
    }

    try {
      const response = await fetch(`${this.baseUrl}/storage/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': options.contentType || 'application/octet-stream',
          'X-Content-Hash': contentHash,
          'X-Repository-Id': options.repositoryId || ''
        },
        body: buffer
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        tuskyId: result.id,
        contentHash,
        size: buffer.length,
        contentType: options.contentType,
        createdAt: result.createdAt,
        accountType: this.accountType
      };
    } catch (error) {
      console.error('Tusky upload error:', error);
      throw error;
    }
  }

  /**
   * Check if content exists in Tusky
   * @param {string} contentHash - Content hash
   * @returns {Promise<Object|null>} - Content info if exists
   */
  async checkContentExists(contentHash) {
    try {
      const response = await fetch(`${this.baseUrl}/storage/check/${contentHash}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Check failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking content:', error);
      return null;
    }
  }

  /**
   * Download content from Tusky
   * @param {string} tuskyId - Tusky content ID
   * @returns {Promise<Buffer>} - Content buffer
   */
  async download(tuskyId) {
    try {
      const response = await fetch(`${this.baseUrl}/storage/download/${tuskyId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      console.error('Tusky download error:', error);
      throw error;
    }
  }

  /**
   * Delete content from Tusky
   * @param {string} tuskyId - Tusky content ID
   * @returns {Promise<boolean>} - Success status
   */
  async delete(tuskyId) {
    try {
      const response = await fetch(`${this.baseUrl}/storage/delete/${tuskyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Tusky delete error:', error);
      return false;
    }
  }

  /**
   * Migrate content between Tusky and Walrus
   * @param {string} direction - Migration direction ('tusky-to-walrus' or 'walrus-to-tusky')
   * @param {Array} items - Items to migrate
   * @param {Object} options - Migration options
   * @returns {Promise<Object>} - Migration results
   */
  async migrate(direction, items, options = {}) {
    const results = {
      successful: [],
      failed: [],
      total: items.length
    };

    const walrusClient = options.walrusClient;
    if (!walrusClient && direction.includes('walrus')) {
      throw new Error('Walrus client required for migration involving Walrus');
    }

    for (const item of items) {
      try {
        let result;
        
        if (direction === 'tusky-to-walrus') {
          // Download from Tusky
          const content = await this.download(item.tuskyId);
          
          // Upload to Walrus
          const walrusResult = await walrusClient.uploadToWalrus(content, {
            contentType: item.contentType
          });
          
          result = {
            ...item,
            walrusCid: walrusResult.cid,
            migratedAt: new Date().toISOString()
          };
        } else if (direction === 'walrus-to-tusky') {
          // Download from Walrus
          const content = await walrusClient.retrieveContent(item.walrusCid);
          
          // Upload to Tusky
          const tuskyResult = await this.upload(content, {
            contentType: item.contentType,
            repositoryId: item.repositoryId
          });
          
          result = {
            ...item,
            tuskyId: tuskyResult.tuskyId,
            migratedAt: new Date().toISOString()
          };
        } else {
          throw new Error(`Invalid migration direction: ${direction}`);
        }
        
        results.successful.push(result);
      } catch (error) {
        results.failed.push({
          item,
          error: error.message
        });
      }
    }

    return results;
  }
}

/**
 * Initialize Tusky client from configuration
 * @param {Object} options - Initialization options
 * @returns {Promise<TuskyClient>} - Initialized client
 */
export async function initializeTuskyClient(options = {}) {
  const config = getConfig();
  const tuskyConfig = config?.tusky || {};
  
  const accountType = options.accountType || tuskyConfig.accountType || 'personal';
  const apiKey = options.apiKey || tuskyConfig.apiKey;
  
  const client = new TuskyClient(apiKey, accountType);
  
  // Authenticate if no API key
  if (!apiKey) {
    const authOptions = {
      email: options.email || tuskyConfig.email,
      password: options.password,
      githubToken: options.githubToken || tuskyConfig.githubToken
    };
    
    const authResult = await client.authenticate(authOptions);
    
    // Save configuration
    await saveConfig({
      tusky: {
        ...tuskyConfig,
        apiKey: authResult.apiKey,
        accountId: authResult.accountId,
        accountType
      }
    });
  }
  
  return client;
}

/**
 * Setup Tusky storage for a repository
 * @param {Object} options - Setup options
 * @returns {Promise<Object>} - Setup result
 */
export async function setupTuskyStorage(options) {
  const {
    repositoryId,
    accountType = 'personal',
    preferTusky = false
  } = options;
  
  const spinner = ora('Setting up Tusky storage...').start();
  
  try {
    const client = await initializeTuskyClient({ accountType });
    
    // Get current quota
    const quota = await client.getQuota();
    
    // Update repository configuration
    const config = getConfig();
    const repositories = config.repositories || {};
    
    repositories[repositoryId] = {
      ...repositories[repositoryId],
      storage: {
        primary: preferTusky ? 'tusky' : 'walrus',
        fallback: preferTusky ? 'walrus' : 'tusky',
        tusky: {
          accountType,
          accountId: client.accountId,
          enabled: true
        }
      }
    };
    
    await saveConfig({ repositories });
    
    spinner.succeed('Tusky storage configured');
    
    return {
      repositoryId,
      accountType,
      quota,
      configured: true
    };
  } catch (error) {
    spinner.fail('Failed to setup Tusky storage');
    throw error;
  }
}

/**
 * Switch storage provider for a repository
 * @param {Object} options - Switch options
 * @returns {Promise<Object>} - Switch result
 */
export async function switchStorageProvider(options) {
  const {
    repositoryId,
    provider, // 'tusky' or 'walrus'
    migrate = false
  } = options;
  
  const config = getConfig();
  const repoConfig = config.repositories?.[repositoryId];
  
  if (!repoConfig) {
    throw new Error(`Repository ${repositoryId} not found in configuration`);
  }
  
  // Update storage configuration
  repoConfig.storage.primary = provider;
  repoConfig.storage.fallback = provider === 'tusky' ? 'walrus' : 'tusky';
  
  await saveConfig({
    repositories: {
      ...config.repositories,
      [repositoryId]: repoConfig
    }
  });
  
  // Migrate existing content if requested
  if (migrate) {
    return migrateRepositoryStorage({
      repositoryId,
      fromProvider: provider === 'tusky' ? 'walrus' : 'tusky',
      toProvider: provider
    });
  }
  
  return {
    repositoryId,
    primaryStorage: provider,
    fallbackStorage: repoConfig.storage.fallback
  };
}

/**
 * Migrate repository storage between providers
 * @param {Object} options - Migration options
 * @returns {Promise<Object>} - Migration result
 */
async function migrateRepositoryStorage(options) {
  const {
    repositoryId,
    fromProvider,
    toProvider
  } = options;
  
  const spinner = ora(`Migrating storage from ${fromProvider} to ${toProvider}...`).start();
  
  try {
    // Get list of blobs to migrate
    const blobs = await getRepositoryBlobs(repositoryId);
    
    // Initialize clients
    const tuskyClient = await initializeTuskyClient();
    const walrusClient = await import('./walrus-integration.js');
    
    // Determine migration direction
    const direction = fromProvider === 'tusky' ? 'tusky-to-walrus' : 'walrus-to-tusky';
    
    // Perform migration
    const results = await tuskyClient.migrate(direction, blobs, {
      walrusClient
    });
    
    spinner.succeed(`Migration completed: ${results.successful.length} successful, ${results.failed.length} failed`);
    
    return results;
  } catch (error) {
    spinner.fail('Migration failed');
    throw error;
  }
}

/**
 * Get repository blobs for migration
 * @param {string} repositoryId - Repository ID
 * @returns {Promise<Array>} - List of blobs
 */
async function getRepositoryBlobs(repositoryId) {
  // This would typically query the blockchain or local database
  // for all blobs associated with the repository
  const config = getConfig();
  const blobRegistry = config.repositories?.[repositoryId]?.blobs || [];
  
  return blobRegistry;
}

/**
 * Upload content with automatic provider selection
 * @param {Buffer|string} content - Content to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload result
 */
export async function uploadContent(content, options) {
  const {
    repositoryId,
    contentType,
    preferredProvider
  } = options;
  
  const config = getConfig();
  const repoConfig = config.repositories?.[repositoryId];
  const storageConfig = repoConfig?.storage || { primary: 'walrus', fallback: 'tusky' };
  
  const primaryProvider = preferredProvider || storageConfig.primary;
  const fallbackProvider = primaryProvider === 'tusky' ? 'walrus' : 'tusky';
  
  let result;
  let usedProvider = primaryProvider;
  
  try {
    if (primaryProvider === 'tusky') {
      const client = await initializeTuskyClient();
      result = await client.upload(content, { repositoryId, contentType });
    } else {
      const walrus = await import('./walrus-integration.js');
      result = await walrus.uploadToWalrus(content, { contentType });
    }
  } catch (error) {
    console.warn(`Primary provider (${primaryProvider}) failed:`, error.message);
    
    // Try fallback provider
    try {
      usedProvider = fallbackProvider;
      
      if (fallbackProvider === 'tusky') {
        const client = await initializeTuskyClient();
        result = await client.upload(content, { repositoryId, contentType });
      } else {
        const walrus = await import('./walrus-integration.js');
        result = await walrus.uploadToWalrus(content, { contentType });
      }
    } catch (fallbackError) {
      throw new Error(`Both storage providers failed. Primary: ${error.message}, Fallback: ${fallbackError.message}`);
    }
  }
  
  return {
    ...result,
    provider: usedProvider,
    repositoryId
  };
}

/**
 * Download content with automatic provider selection
 * @param {string} contentId - Content identifier
 * @param {Object} options - Download options
 * @returns {Promise<Buffer>} - Content buffer
 */
export async function downloadContent(contentId, options) {
  const {
    repositoryId,
    provider
  } = options;
  
  if (provider === 'tusky' || contentId.startsWith('tusky:')) {
    const client = await initializeTuskyClient();
    const tuskyId = contentId.replace('tusky:', '');
    return client.download(tuskyId);
  } else {
    const walrus = await import('./walrus-integration.js');
    const walrusCid = contentId.replace('walrus:', '');
    return walrus.retrieveContent(walrusCid);
  }
}

/**
 * Get storage analytics for a repository
 * @param {string} repositoryId - Repository ID
 * @returns {Promise<Object>} - Storage analytics
 */
export async function getStorageAnalytics(repositoryId) {
  const config = getConfig();
  const repoConfig = config.repositories?.[repositoryId];
  
  if (!repoConfig) {
    throw new Error(`Repository ${repositoryId} not found`);
  }
  
  const analytics = {
    primary: repoConfig.storage.primary,
    fallback: repoConfig.storage.fallback,
    providers: {}
  };
  
  // Get Tusky analytics if enabled
  if (repoConfig.storage.tusky?.enabled) {
    try {
      const client = await initializeTuskyClient();
      const quota = await client.getQuota();
      
      analytics.providers.tusky = {
        quota,
        accountType: repoConfig.storage.tusky.accountType,
        enabled: true
      };
    } catch (error) {
      analytics.providers.tusky = {
        enabled: true,
        error: error.message
      };
    }
  }
  
  // Get Walrus analytics
  analytics.providers.walrus = {
    enabled: true
    // Add Walrus-specific metrics here
  };
  
  return analytics;
}

/**
 * Upgrade Tusky account
 * @param {Object} options - Upgrade options
 * @returns {Promise<Object>} - Upgrade result
 */
export async function upgradeTuskyAccount(options) {
  const {
    plan,
    paymentMethod
  } = options;
  
  const client = await initializeTuskyClient();
  
  try {
    const response = await fetch(`${client.baseUrl}/account/upgrade`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${client.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plan,
        paymentMethod
      })
    });
    
    if (!response.ok) {
      throw new Error(`Upgrade failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Update configuration with new quota
    const config = getConfig();
    await saveConfig({
      tusky: {
        ...config.tusky,
        plan: result.plan,
        quota: result.quota
      }
    });
    
    return result;
  } catch (error) {
    console.error('Account upgrade error:', error);
    throw error;
  }
}

export default {
  TuskyClient,
  initializeTuskyClient,
  setupTuskyStorage,
  switchStorageProvider,
  uploadContent,
  downloadContent,
  getStorageAnalytics,
  upgradeTuskyAccount
};