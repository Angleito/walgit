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
      type: 'object',
      default: null
    },
    settings: {
      type: 'object',
      default: {
        defaultNetwork: 'devnet',
        defaultBranch: 'main',
        enableTelemetry: false
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
