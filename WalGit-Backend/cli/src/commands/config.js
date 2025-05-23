/**
 * Config command implementation for WalGit CLI
 * Manages configuration settings for API keys and other service configurations
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import Table from 'cli-table3';
import {
  getConfig,
  saveConfig,
  getSettings,
  updateSettings,
  getSealConfig,
  updateSealConfig,
  getTuskyConfig,
  updateTuskyConfig,
  getWalrusConfig,
  updateWalrusConfig,
  getWalletConfig,
  updateWalletConfig
} from '../utils/config.js';

/**
 * Register the config command and subcommands
 * @param {import('commander').Command} program - Commander program instance
 */
export const configCommand = (program) => {
  const config = program
    .command('config')
    .description('Manage WalGit configuration settings');

  // List all configuration
  config
    .command('list')
    .alias('ls')
    .description('Show current configuration settings')
    .option('-a, --all', 'Show all configuration including sensitive values')
    .action(async (options) => {
      try {
        await showConfig(options);
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  // Get specific configuration value
  config
    .command('get <key>')
    .description('Get a specific configuration value')
    .action(async (key) => {
      try {
        await getConfigValue(key);
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  // Set configuration value
  config
    .command('set <key> <value>')
    .description('Set a configuration value')
    .action(async (key, value) => {
      try {
        await setConfigValue(key, value);
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  // Seal API key shortcut
  config
    .command('seal-api-key [key]')
    .description('Set or show Seal encryption API key')
    .action(async (key) => {
      try {
        if (key) {
          await setSealApiKey(key);
        } else {
          await showSealApiKey();
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  // Walrus API key shortcut
  config
    .command('walrus-node-url [url]')
    .description('Set or show Walrus node URL')
    .action(async (url) => {
      try {
        if (url) {
          await setWalrusNodeUrl(url);
        } else {
          await showWalrusNodeUrl();
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  // Tusky API key shortcut
  config
    .command('tusky-api-key [key]')
    .description('Set or show Tusky storage API key')
    .action(async (key) => {
      try {
        if (key) {
          await setTuskyApiKey(key);
        } else {
          await showTuskyApiKey();
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  // Reset configuration
  config
    .command('reset')
    .description('Reset configuration to defaults')
    .option('-s, --section <section>', 'Reset specific section (seal, tusky, walrus, settings)')
    .action(async (options) => {
      try {
        await resetConfig(options);
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  // Interactive configuration setup
  config
    .command('setup')
    .description('Interactive configuration setup')
    .action(async () => {
      try {
        await interactiveSetup();
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  return config;
};

/**
 * Show current configuration
 * @param {object} options - Command options
 */
async function showConfig(options) {
  const fullConfig = await getConfig();
  const sealConfig = getSealConfig();
  const tuskyConfig = getTuskyConfig();
  const walrusConfig = getWalrusConfig();
  const settings = getSettings();

  console.log(chalk.cyan('\n=== WalGit Configuration ===\n'));

  // General Settings
  const generalTable = new Table({
    head: [chalk.cyan('Setting'), chalk.cyan('Value')],
    colWidths: [30, 50]
  });

  generalTable.push(
    ['Default Network', settings.defaultNetwork || 'devnet'],
    ['Default Branch', settings.defaultBranch || 'main'],
    ['Default Storage Provider', settings.defaultStorageProvider || 'walrus'],
    ['Storage Auto Fallback', settings.storageAutoFallback ? 'enabled' : 'disabled'],
    ['Storage Fallback Order', settings.storageFallbackOrder?.join(', ') || 'tusky, walrus'],
    ['Telemetry', settings.enableTelemetry ? 'enabled' : 'disabled']
  );

  console.log(chalk.yellow('General Settings:'));
  console.log(generalTable.toString());

  // API Configuration
  const apiTable = new Table({
    head: [chalk.cyan('Service'), chalk.cyan('Status'), chalk.cyan('Endpoint')],
    colWidths: [15, 15, 50]
  });

  const sealStatus = sealConfig.apiKey ? chalk.green('configured') : chalk.red('not set');
  const tuskyStatus = tuskyConfig.apiKey ? chalk.green('configured') : chalk.red('not set');
  const walrusStatus = walrusConfig.nodeUrl ? chalk.green('configured') : chalk.red('default');

  apiTable.push(
    ['Seal', sealStatus, sealConfig.apiEndpoint || 'https://api.seal.network'],
    ['Tusky', tuskyStatus, tuskyConfig.apiEndpoint || 'https://api.tusky.storage'],
    ['Walrus', walrusStatus, walrusConfig.nodeUrl || 'https://walrus.devnet.sui.io']
  );

  console.log(chalk.yellow('\nAPI Configuration:'));
  console.log(apiTable.toString());

  // Show sensitive values if requested
  if (options.all) {
    console.log(chalk.yellow('\nSensitive Values:'));
    const sensitiveTable = new Table({
      head: [chalk.cyan('Key'), chalk.cyan('Value')],
      colWidths: [25, 55]
    });

    sensitiveTable.push(
      ['Seal API Key', sealConfig.apiKey || chalk.gray('not set')],
      ['Tusky API Key', tuskyConfig.apiKey || chalk.gray('not set')],
      ['Wallet Address', fullConfig.walletAddress || chalk.gray('not set')]
    );

    console.log(sensitiveTable.toString());
  } else {
    console.log(chalk.gray('\nUse --all to show sensitive values like API keys'));
  }

  // Walrus Configuration Details
  console.log(chalk.yellow('\nWalrus Configuration:'));
  const walrusTable = new Table({
    head: [chalk.cyan('Setting'), chalk.cyan('Value')],
    colWidths: [25, 55]
  });

  walrusTable.push(
    ['Node URL', walrusConfig.nodeUrl || 'https://walrus.devnet.sui.io'],
    ['Max Retries', walrusConfig.maxRetries || '3'],
    ['Chunk Size', `${(walrusConfig.chunkSize || 1048576) / 1024 / 1024} MB`],
    ['Max Parallelism', walrusConfig.maxParallelism || '5'],
    ['Storage Nodes', walrusConfig.storageNodes?.length || '0']
  );

  console.log(walrusTable.toString());
}

/**
 * Get specific configuration value
 * @param {string} key - Configuration key
 */
async function getConfigValue(key) {
  const config = await getConfig();
  const sealConfig = getSealConfig();
  const tuskyConfig = getTuskyConfig();
  const walrusConfig = getWalrusConfig();
  const settings = getSettings();

  // Map of available configuration keys
  const keyMap = {
    'seal.api-key': sealConfig.apiKey,
    'seal.endpoint': sealConfig.apiEndpoint,
    'tusky.api-key': tuskyConfig.apiKey,
    'tusky.endpoint': tuskyConfig.apiEndpoint,
    'tusky.account-type': tuskyConfig.accountType,
    'walrus.node-url': walrusConfig.nodeUrl,
    'walrus.max-retries': walrusConfig.maxRetries,
    'walrus.chunk-size': walrusConfig.chunkSize,
    'walrus.max-parallelism': walrusConfig.maxParallelism,
    'settings.default-network': settings.defaultNetwork,
    'settings.default-branch': settings.defaultBranch,
    'settings.default-storage-provider': settings.defaultStorageProvider,
    'settings.storage-auto-fallback': settings.storageAutoFallback,
    'settings.enable-telemetry': settings.enableTelemetry,
    'wallet.address': config.walletAddress,
    'wallet.network-url': config.suiNetworkUrl,
    'wallet.package-id': config.packageId
  };

  if (keyMap.hasOwnProperty(key)) {
    const value = keyMap[key];
    if (value !== undefined && value !== null) {
      console.log(value);
    } else {
      console.log(chalk.gray('(not set)'));
    }
  } else {
    console.error(chalk.red(`Unknown configuration key: ${key}`));
    console.log(chalk.cyan('\nAvailable keys:'));
    Object.keys(keyMap).forEach(k => console.log(`  ${k}`));
    process.exit(1);
  }
}

/**
 * Set configuration value
 * @param {string} key - Configuration key
 * @param {string} value - Configuration value
 */
async function setConfigValue(key, value) {
  try {
    switch (key) {
      case 'seal.api-key':
        updateSealConfig({ apiKey: value });
        console.log(chalk.green('Seal API key updated'));
        break;
      
      case 'seal.endpoint':
        updateSealConfig({ apiEndpoint: value });
        console.log(chalk.green('Seal endpoint updated'));
        break;
      
      case 'tusky.api-key':
        updateTuskyConfig({ apiKey: value });
        console.log(chalk.green('Tusky API key updated'));
        break;
      
      case 'tusky.endpoint':
        updateTuskyConfig({ apiEndpoint: value });
        console.log(chalk.green('Tusky endpoint updated'));
        break;
      
      case 'tusky.account-type':
        if (!['personal', 'business'].includes(value)) {
          throw new Error('Account type must be "personal" or "business"');
        }
        updateTuskyConfig({ accountType: value });
        console.log(chalk.green('Tusky account type updated'));
        break;
      
      case 'walrus.node-url':
        updateWalrusConfig({ nodeUrl: value });
        console.log(chalk.green('Walrus node URL updated'));
        break;
      
      case 'walrus.max-retries':
        const retries = parseInt(value);
        if (isNaN(retries) || retries < 0) {
          throw new Error('Max retries must be a positive number');
        }
        updateWalrusConfig({ maxRetries: retries });
        console.log(chalk.green('Walrus max retries updated'));
        break;
      
      case 'walrus.chunk-size':
        const chunkSize = parseInt(value);
        if (isNaN(chunkSize) || chunkSize < 1024) {
          throw new Error('Chunk size must be at least 1024 bytes');
        }
        updateWalrusConfig({ chunkSize });
        console.log(chalk.green('Walrus chunk size updated'));
        break;
      
      case 'walrus.max-parallelism':
        const parallelism = parseInt(value);
        if (isNaN(parallelism) || parallelism < 1) {
          throw new Error('Max parallelism must be at least 1');
        }
        updateWalrusConfig({ maxParallelism: parallelism });
        console.log(chalk.green('Walrus max parallelism updated'));
        break;
      
      case 'settings.default-network':
        if (!['devnet', 'testnet', 'mainnet'].includes(value)) {
          throw new Error('Network must be "devnet", "testnet", or "mainnet"');
        }
        updateSettings({ defaultNetwork: value });
        console.log(chalk.green('Default network updated'));
        break;
      
      case 'settings.default-branch':
        updateSettings({ defaultBranch: value });
        console.log(chalk.green('Default branch updated'));
        break;
      
      case 'settings.default-storage-provider':
        if (!['walrus', 'tusky'].includes(value)) {
          throw new Error('Storage provider must be "walrus" or "tusky"');
        }
        updateSettings({ defaultStorageProvider: value });
        console.log(chalk.green('Default storage provider updated'));
        break;
      
      case 'settings.storage-auto-fallback':
        const autoFallback = value.toLowerCase() === 'true';
        updateSettings({ storageAutoFallback: autoFallback });
        console.log(chalk.green('Storage auto fallback updated'));
        break;
      
      case 'settings.enable-telemetry':
        const enableTelemetry = value.toLowerCase() === 'true';
        updateSettings({ enableTelemetry });
        console.log(chalk.green('Telemetry setting updated'));
        break;
      
      default:
        console.error(chalk.red(`Unknown configuration key: ${key}`));
        console.log(chalk.cyan('\nUse "walgit config get <key>" to see available keys'));
        process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('Error setting configuration:'), error.message);
    process.exit(1);
  }
}

/**
 * Set Seal API key
 * @param {string} key - API key
 */
async function setSealApiKey(key) {
  updateSealConfig({ apiKey: key });
  console.log(chalk.green('Seal API key updated successfully'));
}

/**
 * Show Seal API key
 */
async function showSealApiKey() {
  const sealConfig = getSealConfig();
  if (sealConfig.apiKey) {
    console.log(sealConfig.apiKey);
  } else {
    console.log(chalk.gray('Seal API key not set'));
  }
}

/**
 * Set Walrus node URL
 * @param {string} url - Node URL
 */
async function setWalrusNodeUrl(url) {
  try {
    new URL(url); // Validate URL format
    updateWalrusConfig({ nodeUrl: url });
    console.log(chalk.green('Walrus node URL updated successfully'));
  } catch (error) {
    console.error(chalk.red('Invalid URL format'));
    process.exit(1);
  }
}

/**
 * Show Walrus node URL
 */
async function showWalrusNodeUrl() {
  const walrusConfig = getWalrusConfig();
  console.log(walrusConfig.nodeUrl || 'https://walrus.devnet.sui.io');
}

/**
 * Set Tusky API key
 * @param {string} key - API key
 */
async function setTuskyApiKey(key) {
  updateTuskyConfig({ apiKey: key });
  console.log(chalk.green('Tusky API key updated successfully'));
}

/**
 * Show Tusky API key
 */
async function showTuskyApiKey() {
  const tuskyConfig = getTuskyConfig();
  if (tuskyConfig.apiKey) {
    console.log(tuskyConfig.apiKey);
  } else {
    console.log(chalk.gray('Tusky API key not set'));
  }
}

/**
 * Reset configuration
 * @param {object} options - Command options
 */
async function resetConfig(options) {
  const { section } = options;

  // Confirm reset operation
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: section 
        ? `Reset ${section} configuration to defaults?`
        : 'Reset all configuration to defaults?',
      default: false
    }
  ]);

  if (!confirm) {
    console.log(chalk.yellow('Reset cancelled'));
    return;
  }

  try {
    if (!section || section === 'seal') {
      updateSealConfig({
        apiKey: '',
        apiEndpoint: 'https://api.seal.network'
      });
      console.log(chalk.green('Seal configuration reset'));
    }

    if (!section || section === 'tusky') {
      updateTuskyConfig({
        apiKey: '',
        accountType: 'personal',
        apiEndpoint: 'https://api.tusky.storage'
      });
      console.log(chalk.green('Tusky configuration reset'));
    }

    if (!section || section === 'walrus') {
      updateWalrusConfig({
        nodeUrl: 'https://walrus.devnet.sui.io',
        storageNodes: [],
        maxRetries: 3,
        chunkSize: 1048576,
        maxParallelism: 5
      });
      console.log(chalk.green('Walrus configuration reset'));
    }

    if (!section || section === 'settings') {
      updateSettings({
        defaultNetwork: 'devnet',
        defaultBranch: 'main',
        enableTelemetry: false,
        defaultStorageProvider: 'walrus',
        storageAutoFallback: true,
        storageFallbackOrder: ['tusky', 'walrus']
      });
      console.log(chalk.green('Settings reset'));
    }

    if (!section) {
      console.log(chalk.green('\nAll configuration reset to defaults'));
    }
  } catch (error) {
    console.error(chalk.red('Error resetting configuration:'), error.message);
    process.exit(1);
  }
}

/**
 * Interactive configuration setup
 */
async function interactiveSetup() {
  console.log(chalk.cyan('\n=== WalGit Configuration Setup ===\n'));
  
  const currentConfig = await getConfig();
  const sealConfig = getSealConfig();
  const tuskyConfig = getTuskyConfig();
  const walrusConfig = getWalrusConfig();
  const settings = getSettings();

  // API Keys Setup
  console.log(chalk.yellow('API Keys Configuration:'));
  
  const apiAnswers = await inquirer.prompt([
    {
      type: 'input',
      name: 'sealApiKey',
      message: 'Seal encryption API key:',
      default: sealConfig.apiKey || '',
      when: () => !sealConfig.apiKey
    },
    {
      type: 'input',
      name: 'tuskyApiKey',
      message: 'Tusky storage API key:',
      default: tuskyConfig.apiKey || '',
      when: () => !tuskyConfig.apiKey
    }
  ]);

  // Storage Configuration
  console.log(chalk.yellow('\nStorage Configuration:'));
  
  const storageAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'defaultStorageProvider',
      message: 'Default storage provider:',
      choices: ['walrus', 'tusky'],
      default: settings.defaultStorageProvider || 'walrus'
    },
    {
      type: 'confirm',
      name: 'storageAutoFallback',
      message: 'Enable automatic fallback between storage providers?',
      default: settings.storageAutoFallback !== false
    },
    {
      type: 'input',
      name: 'walrusNodeUrl',
      message: 'Walrus node URL:',
      default: walrusConfig.nodeUrl || 'https://walrus.devnet.sui.io',
      validate: (input) => {
        try {
          new URL(input);
          return true;
        } catch {
          return 'Please enter a valid URL';
        }
      }
    }
  ]);

  // General Settings
  console.log(chalk.yellow('\nGeneral Settings:'));
  
  const generalAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'defaultNetwork',
      message: 'Default Sui network:',
      choices: ['devnet', 'testnet', 'mainnet'],
      default: settings.defaultNetwork || 'devnet'
    },
    {
      type: 'input',
      name: 'defaultBranch',
      message: 'Default Git branch name:',
      default: settings.defaultBranch || 'main'
    },
    {
      type: 'confirm',
      name: 'enableTelemetry',
      message: 'Enable telemetry and usage analytics?',
      default: settings.enableTelemetry || false
    }
  ]);

  // Save configuration
  try {
    if (apiAnswers.sealApiKey) {
      updateSealConfig({ apiKey: apiAnswers.sealApiKey });
    }
    if (apiAnswers.tuskyApiKey) {
      updateTuskyConfig({ apiKey: apiAnswers.tuskyApiKey });
    }
    
    updateWalrusConfig({ nodeUrl: storageAnswers.walrusNodeUrl });
    
    updateSettings({
      defaultStorageProvider: storageAnswers.defaultStorageProvider,
      storageAutoFallback: storageAnswers.storageAutoFallback,
      defaultNetwork: generalAnswers.defaultNetwork,
      defaultBranch: generalAnswers.defaultBranch,
      enableTelemetry: generalAnswers.enableTelemetry
    });

    console.log(chalk.green('\n✓ Configuration saved successfully!'));
    console.log(chalk.cyan('\nUse "walgit config list" to view your configuration'));
  } catch (error) {
    console.error(chalk.red('\nError saving configuration:'), error.message);
    process.exit(1);
  }
}