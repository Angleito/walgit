import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { promisify } from 'util';
import { execFile } from 'child_process';
import chalk from 'chalk';
import {
  CREDENTIAL_HELPER_TYPES,
  DEFAULT_CREDENTIAL_TIMEOUT,
  AUTH_ERROR_MESSAGES
} from './constants.js';

const execFileAsync = promisify(execFile);

// Base path for credential storage
const WALGIT_HOME = path.join(os.homedir(), '.walgit');
const CREDENTIALS_DIR = path.join(WALGIT_HOME, 'credentials');
const CREDENTIALS_CONFIG = path.join(WALGIT_HOME, 'credential-config.json');

// Ensure directories exist
if (!fs.existsSync(WALGIT_HOME)) {
  fs.mkdirSync(WALGIT_HOME, { recursive: true });
}
if (!fs.existsSync(CREDENTIALS_DIR)) {
  fs.mkdirSync(CREDENTIALS_DIR, { recursive: true });
}

// Default configuration
const DEFAULT_CONFIG = {
  helper: CREDENTIAL_HELPER_TYPES.STORE, // Default to 'store'
  helpers: {
    [CREDENTIAL_HELPER_TYPES.STORE]: {
      enabled: true
    },
    [CREDENTIAL_HELPER_TYPES.CACHE]: {
      enabled: true,
      timeout: DEFAULT_CREDENTIAL_TIMEOUT
    },
    [CREDENTIAL_HELPER_TYPES.OSXKEYCHAIN]: {
      enabled: process.platform === 'darwin',
    },
    [CREDENTIAL_HELPER_TYPES.WINCRED]: {
      enabled: process.platform === 'win32',
    },
    [CREDENTIAL_HELPER_TYPES.LIBSECRET]: {
      enabled: process.platform === 'linux',
    }
  }
};

/**
 * Load credential configuration
 * @returns {Object} Credential configuration
 */
export const loadCredentialConfig = () => {
  if (fs.existsSync(CREDENTIALS_CONFIG)) {
    try {
      return JSON.parse(fs.readFileSync(CREDENTIALS_CONFIG, 'utf8'));
    } catch (error) {
      console.warn(chalk.yellow('Error reading credential configuration, using defaults'));
      return DEFAULT_CONFIG;
    }
  }
  // Create default config if it doesn't exist
  fs.writeFileSync(CREDENTIALS_CONFIG, JSON.stringify(DEFAULT_CONFIG, null, 2));
  return DEFAULT_CONFIG;
};

/**
 * Save credential configuration
 * @param {Object} config - Credential configuration
 */
export const saveCredentialConfig = (config) => {
  fs.writeFileSync(CREDENTIALS_CONFIG, JSON.stringify(config, null, 2));
};

/**
 * Get credentials from the configured helper
 * @param {string} url - URL to get credentials for
 * @returns {Promise<{username: string, password: string}|null>} - Credentials or null if not found
 */
export const getCredentials = async (url) => {
  const config = loadCredentialConfig();
  const helperName = config.helper;
  
  // Try cache first if enabled
  if (config.helpers.cache.enabled) {
    const cachedCreds = await getCachedCredentials(url);
    if (cachedCreds) {
      return cachedCreds;
    }
  }

  // Now try the actual configured helper
  let credentials = null;
  
  switch (helperName) {
    case 'store':
      credentials = await getStoredCredentials(url);
      break;
    case 'osxkeychain':
      credentials = await getOSXKeychainCredentials(url);
      break;
    case 'wincred':
      credentials = await getWinCredentials(url);
      break;
    case 'libsecret':
      credentials = await getLibSecretCredentials(url);
      break;
    default:
      throw new Error(`Unknown credential helper: ${helperName}`);
  }

  // Update cache if credentials found and cache is enabled
  if (credentials && config.helpers.cache.enabled) {
    await cacheCredentials(url, credentials);
  }

  return credentials;
};

/**
 * Store credentials using the configured helper
 * @param {string} url - URL to store credentials for
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<void>}
 */
export const storeCredentials = async (url, username, password) => {
  const config = loadCredentialConfig();
  const helperName = config.helper;
  
  switch (helperName) {
    case 'store':
      await storeCredentialsToFile(url, username, password);
      break;
    case 'osxkeychain':
      await storeOSXKeychainCredentials(url, username, password);
      break;
    case 'wincred':
      await storeWinCredentials(url, username, password);
      break;
    case 'libsecret':
      await storeLibSecretCredentials(url, username, password);
      break;
    default:
      throw new Error(`Unknown credential helper: ${helperName}`);
  }

  // Update cache
  if (config.helpers.cache.enabled) {
    await cacheCredentials(url, { username, password });
  }
};

/**
 * Delete credentials for a URL
 * @param {string} url - URL to delete credentials for
 * @returns {Promise<void>}
 */
export const deleteCredentials = async (url) => {
  const config = loadCredentialConfig();
  const helperName = config.helper;
  
  switch (helperName) {
    case 'store':
      await deleteStoredCredentials(url);
      break;
    case 'osxkeychain':
      await deleteOSXKeychainCredentials(url);
      break;
    case 'wincred':
      await deleteWinCredentials(url);
      break;
    case 'libsecret':
      await deleteLibSecretCredentials(url);
      break;
    default:
      throw new Error(`Unknown credential helper: ${helperName}`);
  }

  // Clear from cache
  await clearCachedCredentials(url);
};

/**
 * Get hash of URL for use as filename
 * @param {string} url - URL to hash
 * @returns {string} - Hashed URL
 */
const getUrlHash = (url) => {
  return crypto.createHash('sha256').update(url).digest('hex');
};

// ============ File-based storage implementation ============

/**
 * Get credentials from file storage
 * @param {string} url - URL to get credentials for
 * @returns {Promise<{username: string, password: string}|null>} - Credentials or null if not found
 */
const getStoredCredentials = async (url) => {
  const hash = getUrlHash(url);
  const credPath = path.join(CREDENTIALS_DIR, `${hash}.json`);
  
  if (fs.existsSync(credPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(credPath, 'utf8'));
      return {
        username: data.username,
        password: decrypt(data.password)
      };
    } catch (error) {
      console.warn(chalk.yellow(`Error reading credentials for ${url}`));
      return null;
    }
  }
  
  return null;
};

/**
 * Store credentials to file
 * @param {string} url - URL to store credentials for
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<void>}
 */
const storeCredentialsToFile = async (url, username, password) => {
  const hash = getUrlHash(url);
  const credPath = path.join(CREDENTIALS_DIR, `${hash}.json`);
  
  const data = {
    url,
    username,
    password: encrypt(password),
    createdAt: new Date().toISOString()
  };
  
  fs.writeFileSync(credPath, JSON.stringify(data, null, 2), {
    mode: 0o600 // Only user can read/write
  });
};

/**
 * Delete stored credentials
 * @param {string} url - URL to delete credentials for
 * @returns {Promise<void>}
 */
const deleteStoredCredentials = async (url) => {
  const hash = getUrlHash(url);
  const credPath = path.join(CREDENTIALS_DIR, `${hash}.json`);
  
  if (fs.existsSync(credPath)) {
    fs.unlinkSync(credPath);
  }
};

// ============ Cache implementation ============

const CACHE_DIR = path.join(WALGIT_HOME, 'credential-cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Cache credentials
 * @param {string} url - URL to cache credentials for
 * @param {Object} credentials - Credentials to cache
 * @returns {Promise<void>}
 */
const cacheCredentials = async (url, credentials) => {
  const config = loadCredentialConfig();
  const { timeout } = config.helpers.cache;
  
  const hash = getUrlHash(url);
  const cachePath = path.join(CACHE_DIR, `${hash}.json`);
  
  const data = {
    url,
    username: credentials.username,
    password: encrypt(credentials.password),
    expiresAt: new Date(Date.now() + timeout * 1000).toISOString()
  };
  
  fs.writeFileSync(cachePath, JSON.stringify(data, null, 2), {
    mode: 0o600 // Only user can read/write
  });
};

/**
 * Get cached credentials
 * @param {string} url - URL to get credentials for
 * @returns {Promise<{username: string, password: string}|null>} - Credentials or null if not found or expired
 */
const getCachedCredentials = async (url) => {
  const hash = getUrlHash(url);
  const cachePath = path.join(CACHE_DIR, `${hash}.json`);
  
  if (fs.existsSync(cachePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      
      // Check if expired
      if (new Date(data.expiresAt) > new Date()) {
        return {
          username: data.username,
          password: decrypt(data.password)
        };
      } else {
        // Clean up expired cache
        fs.unlinkSync(cachePath);
      }
    } catch (error) {
      // Ignore errors, just return null
    }
  }
  
  return null;
};

/**
 * Clear cached credentials
 * @param {string} url - URL to clear cached credentials for
 * @returns {Promise<void>}
 */
const clearCachedCredentials = async (url) => {
  const hash = getUrlHash(url);
  const cachePath = path.join(CACHE_DIR, `${hash}.json`);
  
  if (fs.existsSync(cachePath)) {
    fs.unlinkSync(cachePath);
  }
};

// ============ OS X Keychain implementation ============

/**
 * Get credentials from OS X Keychain
 * @param {string} url - URL to get credentials for
 * @returns {Promise<{username: string, password: string}|null>} - Credentials or null if not found
 */
const getOSXKeychainCredentials = async (url) => {
  if (process.platform !== 'darwin') {
    throw new Error('OSX Keychain is only available on macOS');
  }
  
  try {
    const { stdout } = await execFileAsync('security', [
      'find-internet-password',
      '-s', new URL(url).hostname,
      '-g'
    ]);
    
    // Parse output to extract username and password
    const usernameMatch = stdout.match(/account: "([^"]+)"/);
    const passwordMatch = stdout.match(/password: "([^"]+)"/);
    
    if (usernameMatch && passwordMatch) {
      return {
        username: usernameMatch[1],
        password: passwordMatch[1]
      };
    }
  } catch (error) {
    // Credential not found, return null
    return null;
  }
  
  return null;
};

/**
 * Store credentials to OS X Keychain
 * @param {string} url - URL to store credentials for
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<void>}
 */
const storeOSXKeychainCredentials = async (url, username, password) => {
  if (process.platform !== 'darwin') {
    throw new Error('OSX Keychain is only available on macOS');
  }
  
  try {
    // Delete existing credential if it exists
    await deleteOSXKeychainCredentials(url).catch(() => {});
    
    // Store new credential
    await execFileAsync('security', [
      'add-internet-password',
      '-s', new URL(url).hostname,
      '-a', username,
      '-w', password,
      '-l', `WalGit: ${url}`
    ]);
  } catch (error) {
    throw new Error(`Failed to store credentials in OS X Keychain: ${error.message}`);
  }
};

/**
 * Delete credentials from OS X Keychain
 * @param {string} url - URL to delete credentials for
 * @returns {Promise<void>}
 */
const deleteOSXKeychainCredentials = async (url) => {
  if (process.platform !== 'darwin') {
    throw new Error('OSX Keychain is only available on macOS');
  }
  
  try {
    await execFileAsync('security', [
      'delete-internet-password',
      '-s', new URL(url).hostname
    ]);
  } catch (error) {
    // Ignore if credential doesn't exist
  }
};

// ============ Windows Credential Manager implementation ============

/**
 * Get credentials from Windows Credential Manager
 * @param {string} url - URL to get credentials for
 * @returns {Promise<{username: string, password: string}|null>} - Credentials or null if not found
 */
const getWinCredentials = async (url) => {
  if (process.platform !== 'win32') {
    throw new Error('Windows Credential Manager is only available on Windows');
  }
  
  try {
    // Use PowerShell to access Windows Credential Manager
    const { stdout } = await execFileAsync('powershell', [
      '-Command',
      `
      $cred = Get-StoredCredential -Target "WalGit:${url}"
      if ($cred) {
        $username = $cred.UserName
        $password = $cred.GetNetworkCredential().Password
        Write-Output "$username|$password"
      }
      `
    ]);
    
    if (stdout.trim()) {
      const [username, password] = stdout.trim().split('|');
      return { username, password };
    }
  } catch (error) {
    // Credential not found, return null
    return null;
  }
  
  return null;
};

/**
 * Store credentials to Windows Credential Manager
 * @param {string} url - URL to store credentials for
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<void>}
 */
const storeWinCredentials = async (url, username, password) => {
  if (process.platform !== 'win32') {
    throw new Error('Windows Credential Manager is only available on Windows');
  }
  
  try {
    // Use PowerShell to store credentials
    await execFileAsync('powershell', [
      '-Command',
      `
      $securePassword = ConvertTo-SecureString "${password}" -AsPlainText -Force
      $cred = New-Object System.Management.Automation.PSCredential("${username}", $securePassword)
      New-StoredCredential -Target "WalGit:${url}" -Credential $cred -Persist LocalMachine
      `
    ]);
  } catch (error) {
    throw new Error(`Failed to store credentials in Windows Credential Manager: ${error.message}`);
  }
};

/**
 * Delete credentials from Windows Credential Manager
 * @param {string} url - URL to delete credentials for
 * @returns {Promise<void>}
 */
const deleteWinCredentials = async (url) => {
  if (process.platform !== 'win32') {
    throw new Error('Windows Credential Manager is only available on Windows');
  }
  
  try {
    await execFileAsync('powershell', [
      '-Command',
      `Remove-StoredCredential -Target "WalGit:${url}"`
    ]);
  } catch (error) {
    // Ignore if credential doesn't exist
  }
};

// ============ libsecret implementation (Linux) ============

/**
 * Get credentials from libsecret
 * @param {string} url - URL to get credentials for
 * @returns {Promise<{username: string, password: string}|null>} - Credentials or null if not found
 */
const getLibSecretCredentials = async (url) => {
  if (process.platform !== 'linux') {
    throw new Error('libsecret is only available on Linux');
  }
  
  try {
    // Check if secret-tool is available
    await execFileAsync('which', ['secret-tool']);
    
    // Use secret-tool to lookup credentials
    const { stdout: usernameOut } = await execFileAsync('secret-tool', [
      'lookup',
      'walgit-credential', url,
      'username'
    ]);
    
    const { stdout: passwordOut } = await execFileAsync('secret-tool', [
      'lookup',
      'walgit-credential', url,
      'password'
    ]);
    
    if (usernameOut.trim() && passwordOut.trim()) {
      return {
        username: usernameOut.trim(),
        password: passwordOut.trim()
      };
    }
  } catch (error) {
    // Missing secret-tool or credential not found, return null
    return null;
  }
  
  return null;
};

/**
 * Store credentials to libsecret
 * @param {string} url - URL to store credentials for
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<void>}
 */
const storeLibSecretCredentials = async (url, username, password) => {
  if (process.platform !== 'linux') {
    throw new Error('libsecret is only available on Linux');
  }
  
  try {
    // Check if secret-tool is available
    await execFileAsync('which', ['secret-tool']);
    
    // Delete existing credentials first
    await deleteLibSecretCredentials(url).catch(() => {});
    
    // Store username
    await execFileAsync('secret-tool', [
      'store',
      '--label', `WalGit Credential: ${url}`,
      'walgit-credential', url,
      'type', 'username'
    ], { input: username });
    
    // Store password
    await execFileAsync('secret-tool', [
      'store',
      '--label', `WalGit Credential: ${url}`,
      'walgit-credential', url,
      'type', 'password'
    ], { input: password });
  } catch (error) {
    throw new Error(`Failed to store credentials in libsecret: ${error.message}`);
  }
};

/**
 * Delete credentials from libsecret
 * @param {string} url - URL to delete credentials for
 * @returns {Promise<void>}
 */
const deleteLibSecretCredentials = async (url) => {
  if (process.platform !== 'linux') {
    throw new Error('libsecret is only available on Linux');
  }
  
  try {
    // Check if secret-tool is available
    await execFileAsync('which', ['secret-tool']);
    
    // Delete username and password
    await execFileAsync('secret-tool', [
      'clear',
      'walgit-credential', url,
      'type', 'username'
    ]);
    
    await execFileAsync('secret-tool', [
      'clear',
      'walgit-credential', url,
      'type', 'password'
    ]);
  } catch (error) {
    // Ignore errors if credential doesn't exist
  }
};

// ============ Simple encryption/decryption for file-based storage ============

// This is a simple encryption using a fixed key derived from machine-specific information
// Not intended for high-security scenarios but better than plaintext
const getEncryptionKey = () => {
  const machineId = [
    os.hostname(),
    os.userInfo().username,
    os.platform(),
    os.arch()
  ].join('|');
  
  return crypto.createHash('sha256').update(machineId).digest();
};

/**
 * Simple encryption for sensitive data
 * @param {string} text - Text to encrypt
 * @returns {string} - Encrypted text
 */
const encrypt = (text) => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt encrypted text
 * @param {string} encrypted - Encrypted text
 * @returns {string} - Decrypted text
 */
const decrypt = (encrypted) => {
  const key = getEncryptionKey();
  const [ivHex, encryptedText] = encrypted.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// ============ Utility functions ============

/**
 * Ask for credentials with prompt
 * @param {string} url - URL to ask credentials for
 * @returns {Promise<{username: string, password: string}>} - Credentials
 */
export const askForCredentials = async (url) => {
  // This function would use a readline interface or a prompt library
  // For simplicity, we'll implement a basic version that works in the CLI
  
  try {
    // For demonstration, we'll use a simple implementation
    // In a real application, you'd want to use a secure prompt library
    // that doesn't echo the password to the console
    
    console.log(chalk.cyan(`Please enter credentials for ${url}:`));
    
    // Get username
    process.stdout.write('Username: ');
    const username = await new Promise(resolve => {
      process.stdin.once('data', data => {
        resolve(data.toString().trim());
      });
    });
    
    // Get password
    process.stdout.write('Password: ');
    // Note: This doesn't hide the password input, which isn't secure
    // In a real application, use a library like 'inquirer'
    const password = await new Promise(resolve => {
      process.stdin.once('data', data => {
        resolve(data.toString().trim());
      });
    });
    
    return { username, password };
  } catch (error) {
    throw new Error('Failed to get credentials');
  }
};