/**
 * Seal encryption integration for WalGit
 * Provides client-side encryption/decryption using Seal's threshold encryption
 * for private repositories with access control policies
 */

import crypto from 'crypto';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { getConfig, getWalletConfig } from './config.js';
import { initializeSuiClient } from './sui-integration.js';
import chalk from 'chalk';
import ora from 'ora';

// Constants
const SEAL_API_ENDPOINT = process.env.SEAL_API_ENDPOINT || 'https://api.seal.mystennetwork.com';
const THRESHOLD = 2; // Minimum threshold for decryption
const TOTAL_SHARES = 3; // Total number of key shares
const KEY_ROTATION_INTERVAL = 90 * 24 * 60 * 60 * 1000; // 90 days

/**
 * Initialize Seal encryption client
 * @returns {Promise<SealClient>} Initialized Seal client
 */
export class SealClient {
  constructor(apiKey, suiClient) {
    this.apiKey = apiKey;
    this.suiClient = suiClient;
    this.baseUrl = SEAL_API_ENDPOINT;
  }

  /**
   * Generate a new encryption key with threshold scheme
   * @param {Object} options - Key generation options
   * @returns {Promise<Object>} - Generated key information
   */
  async generateThresholdKey(options = {}) {
    const { 
      threshold = THRESHOLD, 
      totalShares = TOTAL_SHARES,
      metadata = {}
    } = options;

    try {
      const response = await fetch(`${this.baseUrl}/keys/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scheme: 'threshold',
          threshold,
          totalShares,
          metadata
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate key: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        publicKey: result.publicKey,
        keyId: result.keyId,
        shares: result.shares,
        threshold,
        totalShares,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating threshold key:', error);
      throw error;
    }
  }

  /**
   * Encrypt data using Seal's threshold encryption
   * @param {Buffer|string} data - Data to encrypt
   * @param {string} publicKey - Public key for encryption
   * @param {Object} accessPolicy - Access control policy
   * @returns {Promise<Object>} - Encrypted data with metadata
   */
  async encrypt(data, publicKey, accessPolicy = {}) {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    
    try {
      const response = await fetch(`${this.baseUrl}/encrypt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: buffer.toString('base64'),
          publicKey,
          accessPolicy,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`Encryption failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        encryptedData: result.encryptedData,
        encryptionKey: result.encryptionKey,
        nonce: result.nonce,
        accessPolicy,
        algorithm: 'aes-256-gcm',
        threshold: true
      };
    } catch (error) {
      console.error('Error encrypting data:', error);
      throw error;
    }
  }

  /**
   * Decrypt data using threshold key shares
   * @param {Object} encryptedData - Encrypted data object
   * @param {Array} keyShares - Array of key shares for decryption
   * @returns {Promise<Buffer>} - Decrypted data
   */
  async decrypt(encryptedData, keyShares) {
    if (keyShares.length < THRESHOLD) {
      throw new Error(`Insufficient key shares. Need at least ${THRESHOLD}, got ${keyShares.length}`);
    }

    try {
      const response = await fetch(`${this.baseUrl}/decrypt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          encryptedData: encryptedData.encryptedData,
          encryptionKey: encryptedData.encryptionKey,
          nonce: encryptedData.nonce,
          keyShares: keyShares.slice(0, THRESHOLD), // Only use required shares
          algorithm: encryptedData.algorithm || 'aes-256-gcm'
        })
      });

      if (!response.ok) {
        throw new Error(`Decryption failed: ${response.statusText}`);
      }

      const result = await response.json();
      return Buffer.from(result.decryptedData, 'base64');
    } catch (error) {
      console.error('Error decrypting data:', error);
      throw error;
    }
  }

  /**
   * Request decryption key share from a backend service
   * @param {string} keyId - Key identifier
   * @param {string} serviceId - Backend service ID
   * @param {Object} proof - Identity proof for authorization
   * @returns {Promise<Object>} - Key share
   */
  async requestKeyShare(keyId, serviceId, proof) {
    try {
      const response = await fetch(`${this.baseUrl}/services/${serviceId}/key-share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keyId,
          proof,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get key share: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        share: result.share,
        serviceId,
        timestamp: result.timestamp
      };
    } catch (error) {
      console.error(`Error getting key share from ${serviceId}:`, error);
      throw error;
    }
  }
}

/**
 * Initialize Seal client with configuration
 * @returns {Promise<SealClient>} Initialized Seal client
 */
export async function initializeSealClient() {
  const config = getConfig();
  const apiKey = config?.seal?.apiKey;
  
  if (!apiKey) {
    throw new Error('Seal API key not configured');
  }

  const suiClient = await initializeSuiClient();
  return new SealClient(apiKey, suiClient);
}

/**
 * Create encryption policy for a repository
 * @param {Object} options - Policy options
 * @returns {Promise<Object>} - Created policy
 */
export async function createRepositoryEncryptionPolicy(options) {
  const {
    repositoryId,
    contributors = [],
    permissions = {},
    expirationTime = null
  } = options;

  const suiClient = await initializeSuiClient();
  const walletConfig = await getWalletConfig();
  const keypair = Ed25519Keypair.fromSecretKey(
    Buffer.from(walletConfig.keypair, 'base64')
  );

  const tx = new TransactionBlock();

  // Create Move policy object
  const policy = tx.moveCall({
    target: `${process.env.WALGIT_PACKAGE_ID}::seal_access_policy::create_policy`,
    arguments: [
      tx.pure(repositoryId),
      tx.pure(contributors),
      tx.pure(JSON.stringify(permissions)),
      tx.pure(expirationTime || 0)
    ]
  });

  const result = await suiClient.signAndExecuteTransactionBlock({
    signer: keypair,
    transactionBlock: tx,
    options: {
      showEffects: true,
      showObjectChanges: true
    }
  });

  // Extract policy object ID
  const createdObjects = result.objectChanges.filter(change => change.type === 'created');
  const policyObject = createdObjects.find(obj => 
    obj.objectType.includes('::seal_access_policy::Policy')
  );

  return {
    policyId: policyObject?.objectId,
    transactionDigest: result.digest,
    repositoryId,
    contributors,
    permissions
  };
}

/**
 * Encrypt repository data with Seal
 * @param {Object} options - Encryption options
 * @returns {Promise<Object>} - Encrypted data
 */
export async function encryptRepositoryData(options) {
  const {
    data,
    repositoryId,
    policyId,
    metadata = {}
  } = options;

  const spinner = ora('Encrypting repository data...').start();

  try {
    const sealClient = await initializeSealClient();
    
    // Generate threshold key for the repository
    const keyInfo = await sealClient.generateThresholdKey({
      metadata: {
        repositoryId,
        policyId,
        ...metadata
      }
    });

    // Create access policy object
    const accessPolicy = {
      policyId,
      repositoryId,
      validUntil: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year
      requiredShares: keyInfo.threshold
    };

    // Encrypt the data
    const encryptedResult = await sealClient.encrypt(
      data,
      keyInfo.publicKey,
      accessPolicy
    );

    // Store key shares in Sui blockchain
    const storedShares = await storeKeyShares(
      keyInfo.keyId,
      keyInfo.shares,
      repositoryId,
      policyId
    );

    spinner.succeed('Data encrypted successfully');

    return {
      encryptedData: encryptedResult,
      keyId: keyInfo.keyId,
      publicKey: keyInfo.publicKey,
      storedShares,
      accessPolicy
    };
  } catch (error) {
    spinner.fail('Encryption failed');
    throw error;
  }
}

/**
 * Decrypt repository data
 * @param {Object} options - Decryption options
 * @returns {Promise<Buffer>} - Decrypted data
 */
export async function decryptRepositoryData(options) {
  const {
    encryptedData,
    keyId,
    repositoryId,
    policyId
  } = options;

  const spinner = ora('Decrypting repository data...').start();

  try {
    const sealClient = await initializeSealClient();
    const walletConfig = await getWalletConfig();
    
    // Create identity proof
    const proof = await createIdentityProof(
      walletConfig.address,
      repositoryId,
      policyId
    );

    // Retrieve key shares from authorized services
    const keyShares = await retrieveKeyShares(
      keyId,
      THRESHOLD,
      proof
    );

    // Decrypt the data
    const decryptedData = await sealClient.decrypt(
      encryptedData,
      keyShares
    );

    spinner.succeed('Data decrypted successfully');
    return decryptedData;
  } catch (error) {
    spinner.fail('Decryption failed');
    throw error;
  }
}

/**
 * Store key shares on Sui blockchain
 * @param {string} keyId - Key identifier
 * @param {Array} shares - Key shares to store
 * @param {string} repositoryId - Repository ID
 * @param {string} policyId - Policy ID
 * @returns {Promise<Object>} - Storage result
 */
async function storeKeyShares(keyId, shares, repositoryId, policyId) {
  const suiClient = await initializeSuiClient();
  const walletConfig = await getWalletConfig();
  const keypair = Ed25519Keypair.fromSecretKey(
    Buffer.from(walletConfig.keypair, 'base64')
  );

  const tx = new TransactionBlock();
  const storedShares = [];

  // Store each share in a separate object
  for (let i = 0; i < shares.length; i++) {
    const share = shares[i];
    
    const shareObject = tx.moveCall({
      target: `${process.env.WALGIT_PACKAGE_ID}::seal_key_management::store_key_share`,
      arguments: [
        tx.pure(keyId),
        tx.pure(share.index),
        tx.pure(share.value),
        tx.pure(share.serviceId),
        tx.pure(repositoryId),
        tx.pure(policyId)
      ]
    });

    storedShares.push(shareObject);
  }

  const result = await suiClient.signAndExecuteTransactionBlock({
    signer: keypair,
    transactionBlock: tx,
    options: {
      showEffects: true,
      showObjectChanges: true
    }
  });

  return {
    transactionDigest: result.digest,
    shareCount: shares.length,
    keyId
  };
}

/**
 * Retrieve key shares from backend services
 * @param {string} keyId - Key identifier
 * @param {number} requiredShares - Number of shares needed
 * @param {Object} proof - Identity proof
 * @returns {Promise<Array>} - Retrieved key shares
 */
async function retrieveKeyShares(keyId, requiredShares, proof) {
  const sealClient = await initializeSealClient();
  const config = getConfig();
  const services = config?.seal?.services || [];

  if (services.length < requiredShares) {
    throw new Error(`Not enough backend services configured. Need ${requiredShares}, have ${services.length}`);
  }

  const sharePromises = services.slice(0, requiredShares).map(service => 
    sealClient.requestKeyShare(keyId, service.id, proof)
  );

  try {
    const shares = await Promise.all(sharePromises);
    return shares.map(share => share.share);
  } catch (error) {
    console.error('Failed to retrieve sufficient key shares:', error);
    throw new Error('Unable to decrypt: insufficient key shares available');
  }
}

/**
 * Create identity proof for authorization
 * @param {string} address - User address
 * @param {string} repositoryId - Repository ID
 * @param {string} policyId - Policy ID
 * @returns {Promise<Object>} - Identity proof
 */
async function createIdentityProof(address, repositoryId, policyId) {
  const timestamp = Date.now();
  const message = `${address}:${repositoryId}:${policyId}:${timestamp}`;
  
  const walletConfig = await getWalletConfig();
  const keypair = Ed25519Keypair.fromSecretKey(
    Buffer.from(walletConfig.keypair, 'base64')
  );

  const signature = keypair.signData(Buffer.from(message));

  return {
    address,
    repositoryId,
    policyId,
    timestamp,
    signature: Buffer.from(signature).toString('base64')
  };
}

/**
 * Grant access to encrypted repository
 * @param {Object} options - Access grant options
 * @returns {Promise<Object>} - Grant result
 */
export async function grantRepositoryAccess(options) {
  const {
    repositoryId,
    policyId,
    userAddress,
    permissions = ['read'],
    duration = null
  } = options;

  const suiClient = await initializeSuiClient();
  const walletConfig = await getWalletConfig();
  const keypair = Ed25519Keypair.fromSecretKey(
    Buffer.from(walletConfig.keypair, 'base64')
  );

  const tx = new TransactionBlock();

  tx.moveCall({
    target: `${process.env.WALGIT_PACKAGE_ID}::seal_access_policy::grant_access`,
    arguments: [
      tx.pure(policyId),
      tx.pure(userAddress),
      tx.pure(permissions),
      tx.pure(duration || 0)
    ]
  });

  const result = await suiClient.signAndExecuteTransactionBlock({
    signer: keypair,
    transactionBlock: tx,
    options: {
      showEffects: true,
      showEvents: true
    }
  });

  return {
    transactionDigest: result.digest,
    grantedTo: userAddress,
    permissions,
    expiresAt: duration ? new Date(Date.now() + duration).toISOString() : null
  };
}

/**
 * Revoke access to encrypted repository
 * @param {Object} options - Access revoke options
 * @returns {Promise<Object>} - Revoke result
 */
export async function revokeRepositoryAccess(options) {
  const {
    repositoryId,
    policyId,
    userAddress
  } = options;

  const suiClient = await initializeSuiClient();
  const walletConfig = await getWalletConfig();
  const keypair = Ed25519Keypair.fromSecretKey(
    Buffer.from(walletConfig.keypair, 'base64')
  );

  const tx = new TransactionBlock();

  tx.moveCall({
    target: `${process.env.WALGIT_PACKAGE_ID}::seal_access_policy::revoke_access`,
    arguments: [
      tx.pure(policyId),
      tx.pure(userAddress)
    ]
  });

  const result = await suiClient.signAndExecuteTransactionBlock({
    signer: keypair,
    transactionBlock: tx,
    options: {
      showEffects: true,
      showEvents: true
    }
  });

  return {
    transactionDigest: result.digest,
    revokedFrom: userAddress
  };
}

/**
 * Rotate encryption keys for a repository
 * @param {Object} options - Key rotation options
 * @returns {Promise<Object>} - Rotation result
 */
export async function rotateRepositoryKeys(options) {
  const {
    repositoryId,
    oldKeyId,
    reEncryptData = true
  } = options;

  const spinner = ora('Rotating encryption keys...').start();

  try {
    const sealClient = await initializeSealClient();
    
    // Generate new threshold key
    const newKeyInfo = await sealClient.generateThresholdKey({
      metadata: {
        repositoryId,
        previousKeyId: oldKeyId,
        rotatedAt: new Date().toISOString()
      }
    });

    // Store new key shares
    const storedShares = await storeKeyShares(
      newKeyInfo.keyId,
      newKeyInfo.shares,
      repositoryId,
      options.policyId
    );

    // Update key reference on blockchain
    await updateRepositoryKeyReference(
      repositoryId,
      oldKeyId,
      newKeyInfo.keyId
    );

    spinner.succeed('Keys rotated successfully');

    return {
      oldKeyId,
      newKeyId: newKeyInfo.keyId,
      publicKey: newKeyInfo.publicKey,
      storedShares,
      rotatedAt: new Date().toISOString()
    };
  } catch (error) {
    spinner.fail('Key rotation failed');
    throw error;
  }
}

/**
 * Update repository key reference on blockchain
 * @param {string} repositoryId - Repository ID
 * @param {string} oldKeyId - Old key ID
 * @param {string} newKeyId - New key ID
 * @returns {Promise<Object>} - Update result
 */
async function updateRepositoryKeyReference(repositoryId, oldKeyId, newKeyId) {
  const suiClient = await initializeSuiClient();
  const walletConfig = await getWalletConfig();
  const keypair = Ed25519Keypair.fromSecretKey(
    Buffer.from(walletConfig.keypair, 'base64')
  );

  const tx = new TransactionBlock();

  tx.moveCall({
    target: `${process.env.WALGIT_PACKAGE_ID}::seal_key_management::update_key_reference`,
    arguments: [
      tx.pure(repositoryId),
      tx.pure(oldKeyId),
      tx.pure(newKeyId),
      tx.pure(Date.now())
    ]
  });

  const result = await suiClient.signAndExecuteTransactionBlock({
    signer: keypair,
    transactionBlock: tx,
    options: {
      showEffects: true
    }
  });

  return {
    transactionDigest: result.digest,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Check if a user has access to an encrypted repository
 * @param {Object} options - Access check options
 * @returns {Promise<Object>} - Access status
 */
export async function checkRepositoryAccess(options) {
  const {
    repositoryId,
    policyId,
    userAddress
  } = options;

  const suiClient = await initializeSuiClient();

  try {
    const result = await suiClient.devInspectTransactionBlock({
      sender: userAddress,
      transactionBlock: new TransactionBlock().pure({
        id: policyId,
        user: userAddress
      }),
      targetFunction: `${process.env.WALGIT_PACKAGE_ID}::seal_access_policy::has_access`
    });

    const hasAccess = result?.results?.[0]?.returnValues?.[0] === 'true';
    
    if (hasAccess) {
      // Get detailed permissions
      const permissionsResult = await suiClient.devInspectTransactionBlock({
        sender: userAddress,
        transactionBlock: new TransactionBlock().pure({
          id: policyId,
          user: userAddress
        }),
        targetFunction: `${process.env.WALGIT_PACKAGE_ID}::seal_access_policy::get_permissions`
      });

      const permissions = JSON.parse(permissionsResult?.results?.[0]?.returnValues?.[0] || '[]');

      return {
        hasAccess: true,
        permissions,
        userAddress
      };
    }

    return {
      hasAccess: false,
      permissions: [],
      userAddress
    };
  } catch (error) {
    console.error('Error checking access:', error);
    return {
      hasAccess: false,
      error: error.message
    };
  }
}

/**
 * List all users with access to an encrypted repository
 * @param {Object} options - List options
 * @returns {Promise<Array>} - List of users with access
 */
export async function listRepositoryAccess(options) {
  const {
    repositoryId,
    policyId
  } = options;

  const suiClient = await initializeSuiClient();
  
  try {
    const policy = await suiClient.getObject({
      id: policyId,
      options: {
        showContent: true
      }
    });

    if (!policy?.data?.content) {
      throw new Error('Policy not found');
    }

    const accessList = policy.data.content.access_list || [];
    
    return accessList.map(entry => ({
      userAddress: entry.user,
      permissions: entry.permissions,
      grantedAt: new Date(parseInt(entry.granted_at)).toISOString(),
      expiresAt: entry.expires_at ? new Date(parseInt(entry.expires_at)).toISOString() : null
    }));
  } catch (error) {
    console.error('Error listing access:', error);
    throw error;
  }
}

export default {
  initializeSealClient,
  createRepositoryEncryptionPolicy,
  encryptRepositoryData,
  decryptRepositoryData,
  grantRepositoryAccess,
  revokeRepositoryAccess,
  rotateRepositoryKeys,
  checkRepositoryAccess,
  listRepositoryAccess
};