/**
 * @fileoverview Comprehensive SEAL Client mock for testing
 * Simulates SEAL threshold encryption/decryption with realistic scenarios
 */

import { jest } from '@jest/globals';
import crypto from 'crypto';

// Mock SEAL configurations
const MOCK_POLICIES = {
  'policy_basic': {
    threshold: 2,
    totalShares: 3,
    keyRotationInterval: 90 * 24 * 60 * 60 * 1000,
    accessList: ['owner', 'admin']
  },
  'policy_threshold': {
    threshold: 3,
    totalShares: 5,
    keyRotationInterval: 30 * 24 * 60 * 60 * 1000,
    accessList: ['owner', 'writer1', 'writer2', 'reader1']
  },
  'policy_enterprise': {
    threshold: 5,
    totalShares: 7,
    keyRotationInterval: 180 * 24 * 60 * 60 * 1000,
    accessList: ['ceo', 'cto', 'dev_lead', 'sec_lead', 'ops_lead']
  }
};

// Storage for mock encrypted data and keys
const mockKeyStorage = new Map();
const mockEncryptedData = new Map();
let networkFailureRate = 0;
let decryptionFailureRate = 0;
let requestCount = 0;

/**
 * Mock SEAL Client with comprehensive testing capabilities
 */
export class MockSealClient {
  constructor(apiKey, suiClient) {
    this.apiKey = apiKey || 'mock-seal-api-key';
    this.suiClient = suiClient;
    this.baseUrl = 'https://api.seal.mystennetwork.com';
    this.isInitialized = true;
  }

  /**
   * Generate a new threshold encryption key
   * @param {Object} options - Key generation options
   * @returns {Promise<Object>} Generated key information
   */
  async generateThresholdKey(options = {}) {
    requestCount++;
    
    // Simulate network failures
    if (Math.random() < networkFailureRate) {
      await this._simulateDelay(2000);
      throw new Error('Network error: Failed to connect to SEAL service');
    }

    const { 
      threshold = 2, 
      totalShares = 3,
      metadata = {},
      policyId = `policy_${Date.now()}`
    } = options;

    // Validate threshold parameters
    if (threshold > totalShares) {
      throw new Error('Threshold cannot exceed total shares');
    }

    if (threshold < 1 || totalShares < 2) {
      throw new Error('Invalid threshold parameters');
    }

    // Generate mock key data
    const keyId = `seal_key_${crypto.randomBytes(16).toString('hex')}`;
    const publicKey = `seal_pub_${crypto.randomBytes(32).toString('hex')}`;
    const privateKeyShares = Array.from({ length: totalShares }, (_, i) => 
      `seal_share_${i}_${crypto.randomBytes(24).toString('hex')}`
    );

    const keyData = {
      keyId,
      publicKey,
      privateKeyShares,
      threshold,
      totalShares,
      policyId,
      metadata,
      createdAt: new Date().toISOString(),
      lastRotated: new Date().toISOString(),
      status: 'active'
    };

    mockKeyStorage.set(keyId, keyData);
    await this._simulateDelay(1000);

    return {
      publicKey,
      keyId,
      shares: privateKeyShares,
      threshold,
      totalShares,
      policyId,
      createdAt: keyData.createdAt
    };
  }

  /**
   * Encrypt data using threshold encryption
   * @param {Buffer|string} data - Data to encrypt
   * @param {string} publicKey - Public key for encryption
   * @param {Object} accessPolicy - Access control policy
   * @returns {Promise<Object>} Encrypted data with metadata
   */
  async encrypt(data, publicKey, accessPolicy = {}) {
    requestCount++;

    // Simulate network failures
    if (Math.random() < networkFailureRate) {
      await this._simulateDelay(1500);
      throw new Error('Network error: Failed to encrypt data');
    }

    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    
    // Validate inputs
    if (!publicKey) {
      throw new Error('Public key is required for encryption');
    }

    if (buffer.length === 0) {
      throw new Error('Cannot encrypt empty data');
    }

    // Find key information
    const keyData = Array.from(mockKeyStorage.values())
      .find(key => key.publicKey === publicKey);
    
    if (!keyData) {
      throw new Error('Invalid public key: key not found');
    }

    // Generate mock encrypted data
    const encryptionId = `enc_${crypto.randomBytes(16).toString('hex')}`;
    const encryptedBuffer = crypto.randomBytes(buffer.length + 32); // Simulate encryption overhead
    const dekEncrypted = crypto.randomBytes(48); // Mock encrypted DEK

    const encryptedData = {
      encryptionId,
      encryptedContent: encryptedBuffer.toString('base64'),
      dekEncrypted: dekEncrypted.toString('base64'),
      keyId: keyData.keyId,
      accessPolicy,
      size: buffer.length,
      encryptedSize: encryptedBuffer.length,
      algorithm: 'threshold_encryption',
      timestamp: new Date().toISOString(),
      checksum: crypto.createHash('sha256').update(buffer).digest('hex')
    };

    mockEncryptedData.set(encryptionId, {
      ...encryptedData,
      originalData: buffer // Store for mock decryption
    });

    // Simulate encryption delay based on data size
    const encryptionDelay = Math.min(500 + (buffer.length / (1024 * 1024)) * 200, 3000);
    await this._simulateDelay(encryptionDelay);

    return {
      success: true,
      encryptionId,
      encryptedData: encryptedData.encryptedContent,
      dekEncrypted: encryptedData.dekEncrypted,
      metadata: {
        keyId: keyData.keyId,
        algorithm: encryptedData.algorithm,
        size: encryptedData.encryptedSize,
        timestamp: encryptedData.timestamp
      }
    };
  }

  /**
   * Decrypt data using threshold decryption
   * @param {string} encryptionId - Encryption ID
   * @param {string} dekEncrypted - Encrypted DEK
   * @param {Array} keyShares - Array of key shares for threshold decryption
   * @param {Object} context - Decryption context
   * @returns {Promise<Buffer>} Decrypted data
   */
  async decrypt(encryptionId, dekEncrypted, keyShares, context = {}) {
    requestCount++;

    // Simulate network failures
    if (Math.random() < networkFailureRate) {
      await this._simulateDelay(2000);
      throw new Error('Network error: Failed to decrypt data');
    }

    // Simulate decryption failures
    if (Math.random() < decryptionFailureRate) {
      await this._simulateDelay(1000);
      throw new Error('Decryption failed: Invalid key shares or insufficient threshold');
    }

    // Check if encrypted data exists
    if (!mockEncryptedData.has(encryptionId)) {
      throw new Error('Encrypted data not found');
    }

    const encryptedEntry = mockEncryptedData.get(encryptionId);
    const keyData = mockKeyStorage.get(encryptedEntry.keyId);

    if (!keyData) {
      throw new Error('Encryption key not found');
    }

    // Validate threshold requirements
    if (keyShares.length < keyData.threshold) {
      throw new Error(`Insufficient key shares: need ${keyData.threshold}, got ${keyShares.length}`);
    }

    // Validate key shares
    const validShares = keyShares.filter(share => 
      keyData.privateKeyShares.includes(share)
    );

    if (validShares.length < keyData.threshold) {
      throw new Error('Invalid key shares provided');
    }

    // Simulate access policy validation
    if (context.user && encryptedEntry.accessPolicy.restrictedUsers) {
      if (encryptedEntry.accessPolicy.restrictedUsers.includes(context.user)) {
        throw new Error('Access denied: user in restricted list');
      }
    }

    // Simulate decryption delay
    const decryptionDelay = Math.min(300 + (encryptedEntry.size / (1024 * 1024)) * 150, 2000);
    await this._simulateDelay(decryptionDelay);

    return encryptedEntry.originalData;
  }

  /**
   * Approve decryption request (simulates external approval flow)
   * @param {string} encryptionId - Encryption ID
   * @param {string} requesterId - User requesting decryption
   * @param {Array} approvers - List of approvers
   * @returns {Promise<Object>} Approval response
   */
  async approveDecryption(encryptionId, requesterId, approvers = []) {
    requestCount++;

    if (!mockEncryptedData.has(encryptionId)) {
      throw new Error('Encrypted data not found');
    }

    const encryptedEntry = mockEncryptedData.get(encryptionId);
    const keyData = mockKeyStorage.get(encryptedEntry.keyId);

    // Simulate approval validation
    if (approvers.length < keyData.threshold - 1) {
      throw new Error(`Insufficient approvers: need ${keyData.threshold - 1}, got ${approvers.length}`);
    }

    await this._simulateDelay(800);

    return {
      success: true,
      encryptionId,
      requesterId,
      approvers,
      approvedAt: new Date().toISOString(),
      approvalToken: `approval_${crypto.randomBytes(16).toString('hex')}`
    };
  }

  /**
   * Rotate encryption key
   * @param {string} keyId - Key to rotate
   * @param {Object} options - Rotation options
   * @returns {Promise<Object>} New key information
   */
  async rotateKey(keyId, options = {}) {
    requestCount++;

    if (!mockKeyStorage.has(keyId)) {
      throw new Error('Key not found');
    }

    const oldKeyData = mockKeyStorage.get(keyId);
    
    // Generate new key shares
    const newShares = Array.from({ length: oldKeyData.totalShares }, (_, i) => 
      `seal_share_${i}_${crypto.randomBytes(24).toString('hex')}`
    );

    const rotatedKeyData = {
      ...oldKeyData,
      privateKeyShares: newShares,
      lastRotated: new Date().toISOString(),
      rotationCount: (oldKeyData.rotationCount || 0) + 1
    };

    mockKeyStorage.set(keyId, rotatedKeyData);
    await this._simulateDelay(1200);

    return {
      keyId,
      newShares,
      rotatedAt: rotatedKeyData.lastRotated,
      rotationCount: rotatedKeyData.rotationCount
    };
  }

  /**
   * Get key information
   * @param {string} keyId - Key ID
   * @returns {Promise<Object>} Key information
   */
  async getKeyInfo(keyId) {
    if (!mockKeyStorage.has(keyId)) {
      throw new Error('Key not found');
    }

    const keyData = mockKeyStorage.get(keyId);
    await this._simulateDelay(200);

    return {
      keyId: keyData.keyId,
      publicKey: keyData.publicKey,
      threshold: keyData.threshold,
      totalShares: keyData.totalShares,
      policyId: keyData.policyId,
      status: keyData.status,
      createdAt: keyData.createdAt,
      lastRotated: keyData.lastRotated,
      rotationCount: keyData.rotationCount || 0
    };
  }

  /**
   * List user's encryption keys
   * @param {Object} options - List options
   * @returns {Promise<Array>} List of keys
   */
  async listKeys(options = {}) {
    const { limit = 50, offset = 0, status = 'active' } = options;
    
    const keys = Array.from(mockKeyStorage.values())
      .filter(key => !status || key.status === status)
      .slice(offset, offset + limit)
      .map(key => ({
        keyId: key.keyId,
        publicKey: key.publicKey,
        threshold: key.threshold,
        totalShares: key.totalShares,
        status: key.status,
        createdAt: key.createdAt
      }));

    await this._simulateDelay(300);
    return keys;
  }

  /**
   * Simulate network delay
   * @param {number} ms - Delay in milliseconds
   */
  async _simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Set network failure rate for testing
   * @param {number} rate - Failure rate between 0 and 1
   */
  static setNetworkFailureRate(rate) {
    networkFailureRate = Math.max(0, Math.min(1, rate));
  }

  /**
   * Set decryption failure rate for testing
   * @param {number} rate - Failure rate between 0 and 1
   */
  static setDecryptionFailureRate(rate) {
    decryptionFailureRate = Math.max(0, Math.min(1, rate));
  }

  /**
   * Clear all mock data
   */
  static clearMockData() {
    mockKeyStorage.clear();
    mockEncryptedData.clear();
    requestCount = 0;
  }

  /**
   * Get mock storage state (for testing)
   */
  static getMockState() {
    return {
      keyCount: mockKeyStorage.size,
      encryptedDataCount: mockEncryptedData.size,
      requestCount: requestCount
    };
  }

  /**
   * Pre-populate with test data
   */
  static populateTestData() {
    const testKeys = [
      {
        keyId: 'seal_key_test123',
        publicKey: 'seal_pub_test123',
        privateKeyShares: ['share1_test', 'share2_test', 'share3_test'],
        threshold: 2,
        totalShares: 3,
        policyId: 'policy_test',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastRotated: new Date().toISOString()
      }
    ];

    testKeys.forEach(key => {
      mockKeyStorage.set(key.keyId, key);
    });

    // Add test encrypted data
    mockEncryptedData.set('enc_test123', {
      encryptionId: 'enc_test123',
      encryptedContent: Buffer.from('encrypted_test_data').toString('base64'),
      dekEncrypted: Buffer.from('encrypted_dek').toString('base64'),
      keyId: 'seal_key_test123',
      originalData: Buffer.from('test_data_to_encrypt'),
      size: 20,
      timestamp: new Date().toISOString()
    });
  }
}

// Export mock functions for Jest
export const mockSealClient = {
  SealClient: MockSealClient,
  createClient: jest.fn((apiKey, suiClient) => new MockSealClient(apiKey, suiClient)),
  generatePolicy: jest.fn((options) => ({
    policyId: `policy_${Date.now()}`,
    threshold: options.threshold || 2,
    totalShares: options.totalShares || 3,
    ...options
  }))
};

// Mock module exports
export default mockSealClient;