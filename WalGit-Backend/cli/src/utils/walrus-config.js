/**
 * @fileoverview Walrus storage configuration utilities for WalGit
 * 
 * This module provides functionality for managing Walrus storage configurations,
 * including loading/saving settings, environment variable integration, and
 * network-specific configurations.
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/**
 * Default configuration directory
 * @type {string}
 */
const CONFIG_DIR = path.join(os.homedir(), '.walgit');

/**
 * Default configuration file path
 * @type {string}
 */
const WALRUS_CONFIG_FILE = path.join(CONFIG_DIR, 'walrus-config.json');

/**
 * Network types supported
 * @enum {string}
 */
export const NETWORKS = {
  DEVNET: 'devnet',
  TESTNET: 'testnet',
  MAINNET: 'mainnet'
};

/**
 * Walrus configuration schema
 * @type {Object}
 */
export const walrusConfigSchema = {
  // Walrus API endpoints
  endpoints: {
    [NETWORKS.DEVNET]: 'https://api.walrus.dev/devnet/v1',
    [NETWORKS.TESTNET]: 'https://api.walrus.dev/testnet/v1',
    [NETWORKS.MAINNET]: 'https://api.walrus.dev/mainnet/v1'
  },
  
  // Default network to use (devnet, testnet, mainnet)
  network: NETWORKS.DEVNET,
  
  // Storage bucket configuration
  storage: {
    bucketName: null,
    bucketId: null,
    region: 'us-east-1' // Default region
  },
  
  // API authentication
  auth: {
    apiKey: null,
    accessToken: null,
    refreshToken: null,
    tokenExpiry: null
  },
  
  // Connection options
  options: {
    timeout: 30000, // Default timeout in ms
    retries: 3,     // Default number of retries
    verbose: false  // Whether to log verbose output
  }
};

/**
 * Initializes the Walrus configuration directory
 * @async
 * @returns {Promise<void>}
 */
export async function initWalrusConfigDir() {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw new Error(`Failed to create Walrus config directory: ${error.message}`);
    }
  }
}

/**
 * Loads Walrus configuration from the config file
 * If the file doesn't exist, creates a default configuration
 * @async
 * @returns {Promise<Object>} The loaded configuration
 */
export async function loadWalrusConfig() {
  try {
    await initWalrusConfigDir();
    
    try {
      const configData = await fs.readFile(WALRUS_CONFIG_FILE, 'utf8');
      const config = JSON.parse(configData);
      return mergeWithDefaults(config);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // If config file doesn't exist, create default and return it
        const defaultConfig = getDefaultConfig();
        await saveWalrusConfig(defaultConfig);
        return defaultConfig;
      }
      throw error;
    }
  } catch (error) {
    throw new Error(`Error loading Walrus configuration: ${error.message}`);
  }
}

/**
 * Saves Walrus configuration to the config file
 * @async
 * @param {Object} config - The configuration to save
 * @returns {Promise<void>}
 */
export async function saveWalrusConfig(config) {
  try {
    await initWalrusConfigDir();
    await fs.writeFile(
      WALRUS_CONFIG_FILE,
      JSON.stringify(config, null, 2),
      'utf8'
    );
  } catch (error) {
    throw new Error(`Error saving Walrus configuration: ${error.message}`);
  }
}

/**
 * Updates specific fields in the Walrus configuration
 * @async
 * @param {Object} updates - The configuration updates
 * @returns {Promise<Object>} The updated configuration
 */
export async function updateWalrusConfig(updates) {
  const config = await loadWalrusConfig();
  const updatedConfig = deepMerge(config, updates);
  await saveWalrusConfig(updatedConfig);
  return updatedConfig;
}

/**
 * Gets the default configuration with environment variables applied
 * @returns {Object} The default configuration
 */
export function getDefaultConfig() {
  const defaultConfig = JSON.parse(JSON.stringify(walrusConfigSchema));
  
  // Apply environment variables
  applyEnvironmentVariables(defaultConfig);
  
  return defaultConfig;
}

/**
 * Merges provided configuration with default values
 * @param {Object} config - The configuration to merge
 * @returns {Object} The merged configuration
 */
function mergeWithDefaults(config) {
  const defaultConfig = getDefaultConfig();
  return deepMerge(defaultConfig, config);
}

/**
 * Applies environment variables to the configuration
 * @param {Object} config - The configuration to update
 * @returns {Object} The updated configuration
 */
function applyEnvironmentVariables(config) {
  // Network selection
  if (process.env.WALGIT_NETWORK) {
    config.network = process.env.WALGIT_NETWORK;
  }
  
  // Storage bucket config
  if (process.env.WALRUS_BUCKET_NAME) {
    config.storage.bucketName = process.env.WALRUS_BUCKET_NAME;
  }
  if (process.env.WALRUS_BUCKET_ID) {
    config.storage.bucketId = process.env.WALRUS_BUCKET_ID;
  }
  if (process.env.WALRUS_REGION) {
    config.storage.region = process.env.WALRUS_REGION;
  }
  
  // Auth settings
  if (process.env.WALRUS_API_KEY) {
    config.auth.apiKey = process.env.WALRUS_API_KEY;
  }
  if (process.env.WALRUS_ACCESS_TOKEN) {
    config.auth.accessToken = process.env.WALRUS_ACCESS_TOKEN;
  }
  
  // Options
  if (process.env.WALRUS_TIMEOUT) {
    config.options.timeout = parseInt(process.env.WALRUS_TIMEOUT, 10);
  }
  if (process.env.WALRUS_VERBOSE === 'true') {
    config.options.verbose = true;
  }
  
  return config;
}

/**
 * Utility function to deep merge objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] === null) {
      result[key] = source[key];
    } else if (
      typeof source[key] === 'object' && 
      source[key] !== null &&
      !Array.isArray(source[key]) &&
      typeof target[key] === 'object' &&
      target[key] !== null &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

/**
 * Gets the active network configuration
 * @async
 * @returns {Promise<Object>} Network-specific configuration
 */
export async function getActiveNetworkConfig() {
  const config = await loadWalrusConfig();
  const network = config.network || NETWORKS.DEVNET;
  
  return {
    endpoint: config.endpoints[network],
    network,
    apiKey: config.auth.apiKey,
    bucketName: config.storage.bucketName,
    bucketId: config.storage.bucketId,
    region: config.storage.region,
    options: config.options
  };
}

/**
 * Validates the Walrus configuration
 * @param {Object} config - The configuration to validate
 * @returns {Object} Validation result {valid: boolean, errors: string[]}
 */
export function validateWalrusConfig(config) {
  const errors = [];
  
  // Check if network is valid
  if (config.network && !Object.values(NETWORKS).includes(config.network)) {
    errors.push(`Invalid network: ${config.network}. Must be one of: ${Object.values(NETWORKS).join(', ')}`);
  }
  
  // Check if at least bucketName or bucketId is set
  if (!config.storage.bucketName && !config.storage.bucketId) {
    errors.push('Either bucketName or bucketId must be specified for Walrus storage');
  }
  
  // Check if authentication is set up
  if (!config.auth.apiKey && !config.auth.accessToken) {
    errors.push('Either apiKey or accessToken must be provided for Walrus authentication');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Clears all authentication tokens from the configuration
 * @async
 * @returns {Promise<void>}
 */
export async function clearWalrusAuth() {
  const config = await loadWalrusConfig();
  
  config.auth.accessToken = null;
  config.auth.refreshToken = null;
  config.auth.tokenExpiry = null;
  
  await saveWalrusConfig(config);
}

/**
 * Gets the current bucket configuration
 * @async
 * @returns {Promise<Object>} Bucket configuration
 */
export async function getCurrentBucketConfig() {
  const config = await loadWalrusConfig();
  return config.storage;
}

/**
 * Sets the active network
 * @async
 * @param {string} network - The network to set (devnet, testnet, mainnet)
 * @returns {Promise<Object>} Updated configuration
 */
export async function setActiveNetwork(network) {
  if (!Object.values(NETWORKS).includes(network)) {
    throw new Error(`Invalid network: ${network}. Must be one of: ${Object.values(NETWORKS).join(', ')}`);
  }
  
  return await updateWalrusConfig({ network });
}