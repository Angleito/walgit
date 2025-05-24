/**
 * Optimized Storage Manager
 * Manages efficient storage operations with Walrus and Sui blockchain
 */

import { createHash } from 'crypto';
import { readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { mkdirp } from 'mkdirp';
import { LRUCache } from 'lru-cache';
import pLimit from 'p-limit';
import { initializeSuiClient } from './sui-integration.js';
import { walrusClient } from './walrus-sdk-integration.js';
import { estimateGasCost, executeTransactionWithRetry } from './transaction-utils.js';
import { getConfig } from './config.js';
import { validateWalletConnection, executeTransaction, getActiveKeypair } from './sui-wallet-integration.js';
import { formatBytes } from './format-utils.js';

// Constants for storage optimization
const MAX_CONCURRENT_UPLOADS = 5;
const CHUNK_SIZE = 1048576; // 1 MB
const MAX_DIRECT_UPLOAD_SIZE = 5242880; // 5 MB
const CACHE_MAX_AGE = 3600000; // 1 hour in milliseconds
const CACHE_MAX_SIZE = 100; // Max number of cached items

// Create a cache for blob metadata
const blobCache = new LRUCache({
  max: CACHE_MAX_SIZE,
  ttl: CACHE_MAX_AGE,
  updateAgeOnGet: true,
});

/**
 * Optimized Storage Manager for managing repository storage
 */
export class OptimizedStorageManager {
  /**
   * Initializes repository storage
   * @param {string} repositoryId - Repository ID
   * @returns {Promise<string>} Storage ID
   */
  static async initializeStorage(repositoryId) {
    const suiClient = await initializeSuiClient();
    const keypair = getActiveKeypair();
    
    // Create transaction block
    const txb = suiClient.createTransactionBlock();
    
    // Add initialize_repository_storage call
    txb.moveCall({
      target: `${process.env.PACKAGE_ID}::enhanced_walrus_integration::initialize_repository_storage`,
      arguments: [
        txb.object(repositoryId),
      ]
    });
    
    // Execute transaction
    const result = await executeTransactionWithRetry(
      suiClient,
      (tx) => txb,
      { waitForLocalExecution: true }
    );
    
    // Extract storage ID from transaction result
    const storageId = result.objectChanges?.find(change => 
      change.type === 'created' && 
      change.objectType.includes('enhanced_walrus_integration::RepositoryStorage')
    )?.objectId;
    
    return storageId;
  }
  
  /**
   * Creates a storage allocation for a repository
   * @param {string} repositoryId - Repository ID
   * @param {number} tier - Storage tier (0: Basic, 1: Standard, 2: Premium)
   * @param {boolean} autoRenew - Whether to auto-renew storage
   * @returns {Promise<string>} Allocation ID
   */
  static async createStorageAllocation(repositoryId, tier = 1, autoRenew = true) {
    const suiClient = await initializeSuiClient();
    const walrusClient = walrusClient;
    const keypair = getActiveKeypair();
    
    // Get configuration
    const config = await getConfig();
    const gasBudget = config.defaultGasBudget || 30000000;
    
    // Create transaction block
    const txb = suiClient.createTransactionBlock();
    
    // Get payment coin for allocation
    const [coin] = txb.splitCoins(txb.gas, [txb.pure(10000000000)]); // 10 SUI
    
    // Add create_allocation call
    txb.moveCall({
      target: `${process.env.PACKAGE_ID}::enhanced_storage::create_allocation`,
      arguments: [
        txb.object(repositoryId),
        txb.pure(tier),
        coin,
        txb.pure(autoRenew),
      ]
    });
    
    // Execute transaction
    const result = await executeTransactionWithRetry(
      suiClient,
      (tx) => txb,
      { gasBudget, waitForLocalExecution: true }
    );
    
    // Extract allocation ID from transaction result
    const allocationId = result.objectChanges?.find(change => 
      change.type === 'created' && 
      change.objectType.includes('enhanced_storage::StorageAllocation')
    )?.objectId;
    
    return allocationId;
  }
  
  /**
   * Uploads a file to Walrus storage with optimal strategy based on size
   * @param {string} repositoryId - Repository ID
   * @param {string} filePath - Path to the file to upload
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result with blob ID and URL
   */
  static async uploadFile(repositoryId, filePath, options = {}) {
    // Read file content
    const fileContent = await readFile(filePath);
    const fileSize = fileContent.length;
    
    // Calculate SHA-1 hash as blob ID
    const blobId = createHash('sha1').update(fileContent).digest('hex');
    
    // Determine content type
    const contentType = options.contentType || this.inferContentType(filePath);
    
    // Check if blob already exists in cache
    const cacheKey = `${repositoryId}:${blobId}`;
    if (blobCache.has(cacheKey)) {
      return blobCache.get(cacheKey);
    }
    
    try {
      // Check if blob already exists in repository
      const exists = await this.checkBlobExists(repositoryId, blobId);
      if (exists) {
        const blobInfo = await this.getBlobInfo(repositoryId, blobId);
        blobCache.set(cacheKey, blobInfo);
        return blobInfo;
      }
      
      // Choose upload strategy based on file size
      let result;
      
      if (fileSize <= MAX_DIRECT_UPLOAD_SIZE) {
        // For small files, upload directly
        result = await this.uploadSmallFile(repositoryId, fileContent, blobId, contentType, options);
      } else {
        // For large files, use chunked upload
        result = await this.uploadLargeFile(repositoryId, fileContent, blobId, contentType, options);
      }
      
      // Cache result
      blobCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }
  
  /**
   * Uploads a small file (< 5 MB) directly to Walrus storage
   * @param {string} repositoryId - Repository ID
   * @param {Buffer} fileContent - File content
   * @param {string} blobId - Blob ID (SHA-1 hash)
   * @param {string} contentType - Content type
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  static async uploadSmallFile(repositoryId, fileContent, blobId, contentType, options = {}) {
    const walrusClient = walrusClient;
    const suiClient = await initializeSuiClient();
    const keypair = getActiveKeypair();
    
    // Upload to Walrus
    const uploadResult = await walrusClient.uploadBlob(fileContent, {
      contentType,
      metadata: {
        repositoryId,
        blobId,
        size: fileContent.length,
      }
    });
    
    // Register blob on-chain
    const txb = suiClient.createTransactionBlock();
    
    // Convert hex blob ID to bytes
    const blobIdBytes = Buffer.from(blobId, 'hex');
    
    // Add register_blob call
    txb.moveCall({
      target: `${process.env.PACKAGE_ID}::enhanced_walrus_integration::register_blob`,
      arguments: [
        txb.object(repositoryId),
        txb.pure(Array.from(blobIdBytes)),
        txb.pure(fileContent.length),
        txb.pure(contentType),
        txb.pure(uploadResult.url),
        txb.pure(options.autoRenew !== false),
      ]
    });
    
    // Execute transaction
    const result = await executeTransactionWithRetry(
      suiClient,
      (tx) => txb,
      { waitForLocalExecution: true }
    );
    
    // Extract registration ID from transaction result
    const registrationId = result.objectChanges?.find(change => 
      change.type === 'created' && 
      change.objectType.includes('enhanced_walrus_integration::BlobRegistration')
    )?.objectId;
    
    return {
      blobId,
      registrationId,
      url: uploadResult.url,
      size: fileContent.length,
      contentType,
    };
  }
  
  /**
   * Uploads a large file (> 5 MB) in chunks to Walrus storage
   * @param {string} repositoryId - Repository ID
   * @param {Buffer} fileContent - File content
   * @param {string} blobId - Blob ID (SHA-1 hash)
   * @param {string} contentType - Content type
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  static async uploadLargeFile(repositoryId, fileContent, blobId, contentType, options = {}) {
    const walrusClient = walrusClient;
    const suiClient = await initializeSuiClient();
    const keypair = getActiveKeypair();
    
    // Determine chunks
    const fileSize = fileContent.length;
    const numChunks = Math.ceil(fileSize / CHUNK_SIZE);
    
    // Start chunked upload
    const txb = suiClient.createTransactionBlock();
    
    // Convert hex blob ID to bytes
    const blobIdBytes = Buffer.from(blobId, 'hex');
    
    // Add start_chunked_upload call
    txb.moveCall({
      target: `${process.env.PACKAGE_ID}::enhanced_walrus_integration::start_chunked_upload`,
      arguments: [
        txb.object(repositoryId),
        txb.pure(Array.from(blobIdBytes)),
        txb.pure(fileSize),
        txb.pure(numChunks),
        txb.pure(contentType),
      ]
    });
    
    // Execute transaction
    const startResult = await executeTransactionWithRetry(
      suiClient,
      (tx) => txb,
      { waitForLocalExecution: true }
    );
    
    // Extract upload ID from transaction result
    const uploadId = startResult.objectChanges?.find(change => 
      change.type === 'created' && 
      change.objectType.includes('enhanced_walrus_integration::BlobChunkUpload')
    )?.objectId;
    
    // Upload chunks in parallel with concurrency limit
    const limit = pLimit(MAX_CONCURRENT_UPLOADS);
    
    // Prepare chunk upload promises
    const chunkPromises = [];
    
    for (let i = 0; i < numChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileSize);
      const chunk = fileContent.slice(start, end);
      
      // Add chunk upload promise
      chunkPromises.push(
        limit(async () => {
          // Upload chunk to Walrus
          const chunkUploadResult = await walrusClient.uploadBlobChunk(chunk, {
            blobId,
            chunkIndex: i,
            totalChunks: numChunks,
            metadata: {
              repositoryId,
              uploadId,
            }
          });
          
          // Mark chunk as uploaded on-chain
          const chunkTxb = suiClient.createTransactionBlock();
          
          // Add upload_chunk call
          chunkTxb.moveCall({
            target: `${process.env.PACKAGE_ID}::enhanced_walrus_integration::upload_chunk`,
            arguments: [
              chunkTxb.object(uploadId),
              chunkTxb.pure(i),
            ]
          });
          
          // Execute transaction
          await executeTransactionWithRetry(
            suiClient,
            (tx) => chunkTxb,
            { waitForLocalExecution: true }
          );
          
          return {
            chunkIndex: i,
            success: true,
          };
        })
      );
    }
    
    // Wait for all chunks to upload
    await Promise.all(chunkPromises);
    
    // Complete chunked upload
    const completeTxb = suiClient.createTransactionBlock();
    
    // Add complete_chunked_upload call
    completeTxb.moveCall({
      target: `${process.env.PACKAGE_ID}::enhanced_walrus_integration::complete_chunked_upload`,
      arguments: [
        completeTxb.object(uploadId),
        completeTxb.pure(await walrusClient.getBlobUrl(blobId)),
        completeTxb.pure(options.autoRenew !== false),
      ]
    });
    
    // Execute transaction
    const completeResult = await executeTransactionWithRetry(
      suiClient,
      (tx) => completeTxb,
      { waitForLocalExecution: true }
    );
    
    // Extract registration ID from transaction events
    const registrationId = completeResult.events.find(event => 
      event.type.includes('enhanced_walrus_integration::BlobUploadCompleted')
    )?.parsedJson?.registration_id;
    
    return {
      blobId,
      registrationId,
      url: await walrusClient.getBlobUrl(blobId),
      size: fileSize,
      contentType,
    };
  }
  
  /**
   * Downloads a blob from Walrus storage
   * @param {string} blobId - Blob ID
   * @param {string} outputPath - Path to save the file
   * @param {Object} options - Download options
   * @returns {Promise<string>} Path to downloaded file
   */
  static async downloadBlob(blobId, outputPath, options = {}) {
    const walrusClient = walrusClient;
    
    // Get blob URL (either from cache or from blockchain)
    let blobUrl;
    
    if (options.url) {
      blobUrl = options.url;
    } else if (options.repositoryId && blobCache.has(`${options.repositoryId}:${blobId}`)) {
      const cachedBlob = blobCache.get(`${options.repositoryId}:${blobId}`);
      blobUrl = cachedBlob.url;
    } else if (options.repositoryId) {
      const blobInfo = await this.getBlobInfo(options.repositoryId, blobId);
      blobUrl = blobInfo.url;
    } else {
      throw new Error('Either URL or repositoryId must be provided');
    }
    
    // Download blob from Walrus
    const blobContent = await walrusClient.downloadBlob(blobUrl);
    
    // Ensure output directory exists
    await mkdirp(dirname(outputPath));
    
    // Write file to disk
    await writeFile(outputPath, blobContent);
    
    return outputPath;
  }
  
  /**
   * Gets information about a blob
   * @param {string} repositoryId - Repository ID
   * @param {string} blobId - Blob ID
   * @returns {Promise<Object>} Blob information
   */
  static async getBlobInfo(repositoryId, blobId) {
    const suiClient = await initializeSuiClient();
    
    // Convert hex blob ID to bytes
    const blobIdBytes = Buffer.from(blobId, 'hex');
    
    // Get repository storage object
    const repoStorageObj = await suiClient.getObject({
      id: repositoryId,
      options: {
        showContent: true,
      }
    });
    
    if (!repoStorageObj || !repoStorageObj.data || !repoStorageObj.data.content) {
      throw new Error(`Repository ${repositoryId} not found`);
    }
    
    // Call view function to check if blob exists
    const viewResult = await suiClient.devInspectTransaction({
      sender: '0x0', // Dummy sender for view function
      transaction: {
        kind: 'moveCall',
        data: {
          packageObjectId: process.env.PACKAGE_ID,
          module: 'enhanced_walrus_integration',
          function: 'blob_exists',
          typeArguments: [],
          arguments: [
            repositoryId,
            Array.from(blobIdBytes)
          ]
        }
      }
    });
    
    if (!viewResult || !viewResult.results || !viewResult.results.length) {
      throw new Error(`Blob ${blobId} not found`);
    }
    
    const blobExists = viewResult.results[0].returnValues[0][0];
    
    if (!blobExists) {
      throw new Error(`Blob ${blobId} not found in repository ${repositoryId}`);
    }
    
    // Get blob registration ID
    const registrationIdResult = await suiClient.getDynamicFields({
      parentId: repositoryId,
      cursor: null,
      limit: 100
    });
    
    // Find the blob registration
    const blobField = registrationIdResult.data.find(field => 
      field.name.value === blobIdBytes.toString()
    );
    
    if (!blobField) {
      throw new Error(`Blob ${blobId} registration not found`);
    }
    
    const registrationId = blobField.objectId;
    
    // Get blob registration object
    const registrationObj = await suiClient.getObject({
      id: registrationId,
      options: {
        showContent: true,
      }
    });
    
    if (!registrationObj || !registrationObj.data || !registrationObj.data.content) {
      throw new Error(`Blob registration ${registrationId} not found`);
    }
    
    const registration = registrationObj.data.content;
    
    return {
      blobId,
      registrationId,
      url: registration.fields.walrus_url,
      size: Number(registration.fields.size),
      contentType: registration.fields.content_type,
      createdAt: Number(registration.fields.created_at),
      expiresAt: Number(registration.fields.expires_at),
      autoRenew: registration.fields.auto_renew,
    };
  }
  
  /**
   * Checks if a blob exists in a repository
   * @param {string} repositoryId - Repository ID
   * @param {string} blobId - Blob ID
   * @returns {Promise<boolean>} Whether the blob exists
   */
  static async checkBlobExists(repositoryId, blobId) {
    const suiClient = await initializeSuiClient();
    
    // Convert hex blob ID to bytes
    const blobIdBytes = Buffer.from(blobId, 'hex');
    
    // Call view function to check if blob exists
    const viewResult = await suiClient.devInspectTransaction({
      sender: '0x0', // Dummy sender for view function
      transaction: {
        kind: 'moveCall',
        data: {
          packageObjectId: process.env.PACKAGE_ID,
          module: 'enhanced_walrus_integration',
          function: 'blob_exists',
          typeArguments: [],
          arguments: [
            repositoryId,
            Array.from(blobIdBytes)
          ]
        }
      }
    });
    
    if (!viewResult || !viewResult.results || !viewResult.results.length) {
      return false;
    }
    
    return viewResult.results[0].returnValues[0][0];
  }
  
  /**
   * Gets repository storage statistics
   * @param {string} repositoryId - Repository ID
   * @returns {Promise<Object>} Storage statistics
   */
  static async getStorageStats(repositoryId) {
    const suiClient = await initializeSuiClient();
    
    // Get total blob count
    const blobCountResult = await suiClient.devInspectTransaction({
      sender: '0x0', // Dummy sender for view function
      transaction: {
        kind: 'moveCall',
        data: {
          packageObjectId: process.env.PACKAGE_ID,
          module: 'enhanced_walrus_integration',
          function: 'get_repository_blob_count',
          typeArguments: [],
          arguments: [
            repositoryId
          ]
        }
      }
    });
    
    // Get total storage size
    const storageSizeResult = await suiClient.devInspectTransaction({
      sender: '0x0', // Dummy sender for view function
      transaction: {
        kind: 'moveCall',
        data: {
          packageObjectId: process.env.PACKAGE_ID,
          module: 'enhanced_walrus_integration',
          function: 'get_repository_storage_size',
          typeArguments: [],
          arguments: [
            repositoryId
          ]
        }
      }
    });
    
    // Get storage allocation
    const storageUsageObj = await suiClient.getObject({
      id: repositoryId,
      options: {
        showContent: true,
      }
    });
    
    // Parse results
    const blobCount = blobCountResult.results[0].returnValues[0][0];
    const storageSize = storageSizeResult.results[0].returnValues[0][0];
    
    // Parse allocation info (if available)
    let allocation = null;
    
    if (storageUsageObj && storageUsageObj.data && storageUsageObj.data.content) {
      const allocationId = storageUsageObj.data.content.fields.allocations;
      
      if (allocationId) {
        const allocationObj = await suiClient.getObject({
          id: allocationId,
          options: {
            showContent: true,
          }
        });
        
        if (allocationObj && allocationObj.data && allocationObj.data.content) {
          const alloc = allocationObj.data.content.fields;
          
          allocation = {
            id: allocationId,
            sizeBytes: Number(alloc.size_bytes),
            usedBytes: Number(alloc.used_bytes),
            tier: Number(alloc.tier),
            createdAt: Number(alloc.created_at),
            expiresAt: Number(alloc.expires_at),
            autoRenew: alloc.auto_renew,
            utilization: (Number(alloc.used_bytes) / Number(alloc.size_bytes)) * 100,
          };
        }
      }
    }
    
    return {
      repositoryId,
      blobCount: Number(blobCount),
      storageSize: Number(storageSize),
      formattedSize: formatBytes(Number(storageSize)),
      allocation,
    };
  }
  
  /**
   * Infers content type from file extension
   * @param {string} filePath - Path to the file
   * @returns {string} Content type
   */
  static inferContentType(filePath) {
    const extension = filePath.split('.').pop().toLowerCase();
    
    const contentTypes = {
      'txt': 'text/plain',
      'json': 'application/json',
      'md': 'text/markdown',
      'js': 'application/javascript',
      'jsx': 'application/javascript',
      'ts': 'application/typescript',
      'tsx': 'application/typescript',
      'css': 'text/css',
      'html': 'text/html',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'zip': 'application/zip',
      'gz': 'application/gzip',
      'tar': 'application/x-tar',
      'mp3': 'audio/mpeg',
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
    };
    
    return contentTypes[extension] || 'application/octet-stream';
  }
}

export default OptimizedStorageManager;