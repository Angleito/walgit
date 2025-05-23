import Conf from 'conf';
import path from 'path';
import fs from 'fs';
import os from 'os';

// CLI configuration
const config = new Conf({
  projectName: 'walgit',
  schema: {
    repositories: {
      type: 'array',
      default: []
    },
    wallet: {
      type: 'object',
      default: {}
    },
    currentRepository: {
      type: ['object', 'null'],
      default: null
    },
    settings: {
      type: 'object',
      default: {
        defaultNetwork: 'devnet',
        defaultBranch: 'main',
        enableTelemetry: false,
        defaultStorageProvider: 'walrus',
        storageAutoFallback: true,
        storageFallbackOrder: ['tusky', 'walrus']
      }
    },
    seal: {
      type: 'object',
      default: {
        apiKey: '',
        apiEndpoint: 'https://api.seal.network'
      }
    },
    tusky: {
      type: 'object',
      default: {
        apiKey: '',
        accountType: 'personal',
        apiEndpoint: 'https://api.tusky.storage'
      }
    },
    walrus: {
      type: 'object',
      default: {
        nodeUrl: 'https://walrus.devnet.sui.io',
        storageNodes: [],
        maxRetries: 3,
        chunkSize: 1048576,
        maxParallelism: 5
      }
    }
  }
});

// Path to .walgit directory in current project
export const getWalGitDir = () => {
  return path.join(process.cwd(), '.walgit');
};

/**
 * Get wallet configuration
 * @returns {object} Wallet configuration
 */
export const getWalletConfig = async () => {
  return config.get('wallet') || {};
};

/**
 * Update wallet configuration
 * @param {object} walletConfig - New wallet configuration
 */
export const updateWalletConfig = async (walletConfig) => {
  config.set('wallet', walletConfig);
};

/**
 * Get current repository from local config
 * @returns {object|null} Current repository configuration or null if not in a repository
 */
export const getCurrentRepository = async () => {
  // Check if .walgit directory exists
  const walgitDir = getWalGitDir();
  if (!fs.existsSync(walgitDir)) {
    return null;
  }
  
  // Check if config file exists in .walgit directory
  const repoConfigPath = path.join(walgitDir, 'config.json');
  if (!fs.existsSync(repoConfigPath)) {
    return null;
  }
  
  // Read and parse repository config
  try {
    const repoConfig = JSON.parse(fs.readFileSync(repoConfigPath, 'utf8'));
    return repoConfig;
  } catch (error) {
    console.error('Error reading repository config:', error);
    return null;
  }
};

/**
 * Save current repository configuration
 * @param {object} repository - Repository configuration
 */
export const saveCurrentRepository = async (repository) => {
  // Create .walgit directory if it doesn't exist
  const walgitDir = getWalGitDir();
  if (!fs.existsSync(walgitDir)) {
    fs.mkdirSync(walgitDir, { recursive: true });
  }
  
  // Write repository config
  const repoConfigPath = path.join(walgitDir, 'config.json');
  fs.writeFileSync(repoConfigPath, JSON.stringify(repository, null, 2));
  
  // Update global config
  config.set('currentRepository', {
    id: repository.id,
    path: process.cwd()
  });
};

/**
 * Get CLI settings
 * @returns {object} CLI settings
 */
export const getSettings = () => {
  return config.get('settings');
};

/**
 * Update CLI settings
 * @param {object} settings - New settings
 */
export const updateSettings = (settings) => {
  const currentSettings = config.get('settings');
  config.set('settings', { ...currentSettings, ...settings });
};

/**
 * Get Seal encryption configuration
 * @returns {object} Seal configuration
 */
export const getSealConfig = () => {
  return config.get('seal');
};

/**
 * Update Seal encryption configuration
 * @param {object} sealConfig - New Seal configuration
 */
export const updateSealConfig = (sealConfig) => {
  const currentConfig = config.get('seal');
  config.set('seal', { ...currentConfig, ...sealConfig });
};

/**
 * Get Tusky storage configuration
 * @returns {object} Tusky configuration
 */
export const getTuskyConfig = () => {
  return config.get('tusky');
};

/**
 * Update Tusky storage configuration
 * @param {object} tuskyConfig - New Tusky configuration
 */
export const updateTuskyConfig = (tuskyConfig) => {
  const currentConfig = config.get('tusky');
  config.set('tusky', { ...currentConfig, ...tuskyConfig });
};

/**
 * Get Walrus storage configuration
 * @returns {object} Walrus configuration
 */
export const getWalrusConfig = () => {
  return config.get('walrus');
};

/**
 * Update Walrus storage configuration
 * @param {object} walrusConfig - New Walrus configuration
 */
export const updateWalrusConfig = (walrusConfig) => {
  const currentConfig = config.get('walrus');
  config.set('walrus', { ...currentConfig, ...walrusConfig });
};

/**
 * Get unified configuration for all services
 * @returns {object} Complete configuration
 */
export const getConfig = async () => {
  const walletConfig = await getWalletConfig();
  const currentRepo = await getCurrentRepository();
  const settings = getSettings();
  const seal = getSealConfig();
  const tusky = getTuskyConfig();
  const walrus = getWalrusConfig();
  
  return {
    walletAddress: walletConfig.address,
    privateKey: walletConfig.privateKey,
    suiNetworkUrl: walletConfig.networkUrl || 'https://testnet.sui.io',
    packageId: walletConfig.packageId,
    repoPath: currentRepo?.path || process.cwd(),
    repoId: currentRepo?.id,
    ...settings,
    sealApiKey: seal.apiKey,
    sealEndpoint: seal.apiEndpoint,
    tuskyApiKey: tusky.apiKey,
    tuskyAccountType: tusky.accountType,
    tuskyEndpoint: tusky.apiEndpoint,
    walrusNodeUrl: walrus.nodeUrl,
    walrusStorageNodes: walrus.storageNodes,
    walrusMaxRetries: walrus.maxRetries,
    walrusChunkSize: walrus.chunkSize,
    walrusMaxParallelism: walrus.maxParallelism
  };
};

/**
 * Save complete configuration
 * @param {object} fullConfig - Complete configuration object
 */
export const saveConfig = async (fullConfig) => {
  // Update individual sections
  if (fullConfig.sealApiKey !== undefined) {
    updateSealConfig({ apiKey: fullConfig.sealApiKey });
  }
  if (fullConfig.tuskyApiKey !== undefined) {
    updateTuskyConfig({ apiKey: fullConfig.tuskyApiKey });
  }
  if (fullConfig.walrusNodeUrl !== undefined) {
    updateWalrusConfig({ nodeUrl: fullConfig.walrusNodeUrl });
  }
  
  // Update storage provider settings
  const storageSettings = {};
  if (fullConfig.defaultStorageProvider !== undefined) {
    storageSettings.defaultStorageProvider = fullConfig.defaultStorageProvider;
  }
  if (fullConfig.storageAutoFallback !== undefined) {
    storageSettings.storageAutoFallback = fullConfig.storageAutoFallback;
  }
  if (fullConfig.storageFallbackOrder !== undefined) {
    storageSettings.storageFallbackOrder = fullConfig.storageFallbackOrder;
  }
  
  if (Object.keys(storageSettings).length > 0) {
    updateSettings(storageSettings);
  }
}; 
