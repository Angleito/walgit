/**
 * @fileoverview Comprehensive Walrus SDK mock for testing
 * Simulates Walrus storage operations with realistic responses, delays, and error conditions
 */

import { jest } from '@jest/globals';
import crypto from 'crypto';

// Mock responses and configurations
const MOCK_BLOB_IDS = {
  'test-content-123': 'walrus://blob_abc123def456',
  'large-file-content': 'walrus://blob_xyz789abc123',
  'encrypted-dek-content': 'walrus://blob_seal456def789',
  'commit-manifest': 'walrus://blob_commit123abc456',
  'repository-metadata': 'walrus://blob_repo789def123'
};

const MOCK_DELAYS = {
  WRITE_SUCCESS: 500,    // 500ms for successful writes
  WRITE_FAILURE: 2000,   // 2s for failed writes
  READ_SUCCESS: 200,     // 200ms for successful reads
  READ_FAILURE: 1500,    // 1.5s for failed reads
  NETWORK_TIMEOUT: 5000  // 5s for network timeouts
};

// Storage for mocked content
const mockStorage = new Map();
let networkFailureRate = 0; // 0 = no failures, 1 = all failures
let enableRateLimit = false;
let requestCount = 0;

/**
 * Mock Walrus SDK client with comprehensive testing capabilities
 */
export class MockWalrusClient {
  constructor(config = {}) {
    this.config = {
      endpoint: config.endpoint || 'https://api.walrus.storage',
      apiKey: config.apiKey || 'mock-api-key',
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      ...config
    };
    this.isConnected = true;
  }

  /**
   * Mock writeBlob operation with comprehensive scenarios
   * @param {Buffer|string} content - Content to write
   * @param {Object} options - Write options
   * @returns {Promise<Object>} Mock response with blob ID
   */
  async writeBlob(content, options = {}) {
    requestCount++;
    
    // Simulate rate limiting
    if (enableRateLimit && requestCount % 10 === 0) {
      await this._simulateDelay(1000);
      throw new Error('Rate limit exceeded. Please retry after 1 second.');
    }

    // Simulate network failures
    if (Math.random() < networkFailureRate) {
      await this._simulateDelay(MOCK_DELAYS.WRITE_FAILURE);
      throw new Error('Network error: Failed to connect to Walrus storage');
    }

    // Validate content
    if (!content) {
      throw new Error('Content cannot be empty');
    }

    // Simulate large file chunking
    const contentSize = Buffer.isBuffer(content) ? content.length : Buffer.byteLength(content, 'utf8');
    if (contentSize > 14 * 1024 * 1024 * 1024) { // 14GB limit
      throw new Error('File size exceeds Walrus maximum of 14GB');
    }

    // Generate deterministic blob ID based on content
    const contentHash = crypto.createHash('sha256').update(content).digest('hex');
    const blobId = `walrus://blob_${contentHash.substring(0, 16)}`;

    // Store content in mock storage
    mockStorage.set(blobId, {
      content: content,
      size: contentSize,
      uploadedAt: new Date().toISOString(),
      metadata: options.metadata || {},
      chunks: Math.ceil(contentSize / (1024 * 1024)), // Number of 1MB chunks
      erasureCoding: {
        ratio: 0.75,
        redundancy: 3,
        totalShards: 7
      }
    });

    // Simulate upload delay based on content size
    const uploadDelay = Math.min(MOCK_DELAYS.WRITE_SUCCESS + (contentSize / (1024 * 1024)) * 100, 5000);
    await this._simulateDelay(uploadDelay);

    return {
      success: true,
      blobId: blobId,
      size: contentSize,
      chunks: Math.ceil(contentSize / (1024 * 1024)),
      uploadTime: uploadDelay,
      erasureCodedSize: Math.ceil(contentSize / 0.75), // Account for erasure coding overhead
      metadata: {
        timestamp: new Date().toISOString(),
        checksum: contentHash,
        walrusVersion: '1.0.0'
      }
    };
  }

  /**
   * Mock readBlob operation with comprehensive scenarios
   * @param {string} blobId - Blob ID to read
   * @param {Object} options - Read options
   * @returns {Promise<Buffer>} Mock blob content
   */
  async readBlob(blobId, options = {}) {
    requestCount++;

    // Simulate rate limiting
    if (enableRateLimit && requestCount % 15 === 0) {
      await this._simulateDelay(500);
      throw new Error('Rate limit exceeded. Please retry after 500ms.');
    }

    // Simulate network failures
    if (Math.random() < networkFailureRate) {
      await this._simulateDelay(MOCK_DELAYS.READ_FAILURE);
      throw new Error('Network error: Failed to read from Walrus storage');
    }

    // Check if blob exists
    if (!mockStorage.has(blobId)) {
      throw new Error(`Blob not found: ${blobId}`);
    }

    const storedBlob = mockStorage.get(blobId);
    
    // Simulate read delay based on content size
    const readDelay = Math.min(MOCK_DELAYS.READ_SUCCESS + (storedBlob.size / (1024 * 1024)) * 50, 2000);
    await this._simulateDelay(readDelay);

    // Simulate partial content reads
    if (options.range) {
      const { start, end } = options.range;
      const content = Buffer.isBuffer(storedBlob.content) 
        ? storedBlob.content 
        : Buffer.from(storedBlob.content, 'utf8');
      return content.slice(start, end);
    }

    return Buffer.isBuffer(storedBlob.content) 
      ? storedBlob.content 
      : Buffer.from(storedBlob.content, 'utf8');
  }

  /**
   * Mock getBlobInfo operation
   * @param {string} blobId - Blob ID to get info for
   * @returns {Promise<Object>} Mock blob metadata
   */
  async getBlobInfo(blobId) {
    if (!mockStorage.has(blobId)) {
      throw new Error(`Blob not found: ${blobId}`);
    }

    const storedBlob = mockStorage.get(blobId);
    await this._simulateDelay(100);

    return {
      blobId: blobId,
      size: storedBlob.size,
      uploadedAt: storedBlob.uploadedAt,
      chunks: storedBlob.chunks,
      erasureCoding: storedBlob.erasureCoding,
      metadata: storedBlob.metadata,
      isAvailable: true,
      replicationStatus: 'fully_replicated'
    };
  }

  /**
   * Mock deleteBlob operation
   * @param {string} blobId - Blob ID to delete
   * @returns {Promise<Object>} Mock deletion response
   */
  async deleteBlob(blobId) {
    if (!mockStorage.has(blobId)) {
      throw new Error(`Blob not found: ${blobId}`);
    }

    mockStorage.delete(blobId);
    await this._simulateDelay(300);

    return {
      success: true,
      blobId: blobId,
      deletedAt: new Date().toISOString()
    };
  }

  /**
   * Mock listBlobs operation
   * @param {Object} options - List options
   * @returns {Promise<Array>} Mock blob list
   */
  async listBlobs(options = {}) {
    const { limit = 100, offset = 0, prefix = '' } = options;
    
    let blobs = Array.from(mockStorage.entries())
      .filter(([blobId]) => blobId.includes(prefix))
      .slice(offset, offset + limit)
      .map(([blobId, data]) => ({
        blobId,
        size: data.size,
        uploadedAt: data.uploadedAt,
        chunks: data.chunks
      }));

    await this._simulateDelay(200);
    return blobs;
  }

  /**
   * Mock batch upload operation
   * @param {Array} contents - Array of content to upload
   * @param {Object} options - Batch options
   * @returns {Promise<Array>} Mock batch response
   */
  async batchUpload(contents, options = {}) {
    const results = [];
    const { parallelism = 3 } = options;

    // Process in batches
    for (let i = 0; i < contents.length; i += parallelism) {
      const batch = contents.slice(i, i + parallelism);
      const batchPromises = batch.map(content => this.writeBlob(content));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({ success: false, error: result.reason.message });
        }
      });
    }

    return {
      total: contents.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results: results
    };
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
   * Enable/disable rate limiting simulation
   * @param {boolean} enabled - Whether to enable rate limiting
   */
  static setRateLimitEnabled(enabled) {
    enableRateLimit = enabled;
  }

  /**
   * Clear all mock storage
   */
  static clearStorage() {
    mockStorage.clear();
    requestCount = 0;
  }

  /**
   * Get current mock storage state (for testing)
   */
  static getStorageState() {
    return {
      blobCount: mockStorage.size,
      totalSize: Array.from(mockStorage.values()).reduce((sum, blob) => sum + blob.size, 0),
      requestCount: requestCount
    };
  }

  /**
   * Pre-populate storage with test data
   */
  static populateTestData() {
    const testData = [
      { id: 'walrus://blob_test123', content: 'Test repository data', size: 20 },
      { id: 'walrus://blob_commit456', content: JSON.stringify({ message: 'Initial commit', author: 'test' }), size: 50 },
      { id: 'walrus://blob_tree789', content: JSON.stringify({ files: ['README.md', 'src/main.js'] }), size: 40 }
    ];

    testData.forEach(data => {
      mockStorage.set(data.id, {
        content: data.content,
        size: data.size,
        uploadedAt: new Date().toISOString(),
        metadata: {},
        chunks: 1,
        erasureCoding: { ratio: 0.75, redundancy: 3, totalShards: 7 }
      });
    });
  }
}

// Export mock functions for Jest
export const mockWalrusSDK = {
  WalrusClient: MockWalrusClient,
  createClient: jest.fn((config) => new MockWalrusClient(config)),
  getDefaultConfig: jest.fn(() => ({
    endpoint: 'https://api.walrus.storage',
    timeout: 30000,
    retries: 3
  }))
};

// Mock module exports
export default mockWalrusSDK;