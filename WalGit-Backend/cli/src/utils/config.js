import Conf from 'conf';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
 * Load network-specific configuration
 * @param {string} network - Network name (devnet, testnet, mainnet)
 * @returns {object} Network configuration
 */
export const loadNetworkConfig = (network = 'devnet') => {
  const configPath = join(__dirname, '../../config', `${network}.json`);
  
  // Check if network config exists
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      console.warn(`Failed to load ${network} config:`, error.message);
    }
  }
  
  // Return default configuration
  return {
    network,
    rpcUrl: network === 'testnet' 
      ? 'https://fullnode.testnet.sui.io:443' 
      : 'https://fullnode.devnet.sui.io:443',
    packageId: process.env.WALGIT_PACKAGE_ID || 'TO_BE_FILLED_AFTER_DEPLOYMENT',
    walrus: {
      aggregatorUrl: network === 'testnet'
        ? 'https://walrus-testnet-aggregator.nodeinfra.com'
        : 'https://walrus.devnet.sui.io',
      publisherUrl: network === 'testnet'
        ? 'https://walrus-testnet-publisher.nodeinfra.com'
        : 'https://walrus.devnet.sui.io'
    }
  };
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
  
  // Load network-specific configuration
  const network = walletConfig.network || settings.defaultNetwork || 'devnet';
  const networkConfig = loadNetworkConfig(network);
  
  return {
    walletAddress: walletConfig.address,
    privateKey: walletConfig.privateKey,
    suiNetworkUrl: walletConfig.networkUrl || networkConfig.rpcUrl,
    packageId: walletConfig.packageId || networkConfig.packageId,
    network,
    networkConfig,
    repoPath: currentRepo?.path || process.cwd(),
    repoId: currentRepo?.id,
    ...settings,
    sealApiKey: seal.apiKey,
    sealEndpoint: seal.apiEndpoint,
    tuskyApiKey: tusky.apiKey,
    tuskyAccountType: tusky.accountType,
    tuskyEndpoint: tusky.apiEndpoint,
    walrusNodeUrl: walrus.nodeUrl || networkConfig.walrus.aggregatorUrl,
    walrusPublisherUrl: networkConfig.walrus.publisherUrl,
    walrusStorageNodes: walrus.storageNodes,
    walrusMaxRetries: walrus.maxRetries || networkConfig.walrus.maxRetries,
    walrusChunkSize: walrus.chunkSize || networkConfig.walrus.chunkSize,
    walrusMaxParallelism: walrus.maxParallelism || networkConfig.walrus.maxParallelism
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
