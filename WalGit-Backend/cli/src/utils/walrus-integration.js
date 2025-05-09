/**
 * @fileoverview Walrus storage integration for WalGit
 * Provides utilities for uploading and managing content in Walrus storage system
 * and integrating with the Sui blockchain for storage tracking.
 */

import fetch from 'node-fetch';
import crypto from 'crypto';
import { promisify } from 'util';
import { setTimeout } from 'timers/promises';
import { SuiClient } from '@mysten/sui.js/client';
import { Transaction } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { getConfig } from './config.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Constants
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const WALRUS_API_ENDPOINT = 'https://api.walrus.storage';
const CACHE_DIR = path.join(os.homedir(), '.walgit', 'cache');
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CACHE_MAX_SIZE = 100 * 1024 * 1024; // 100 MB in bytes

// Create cache directory if it doesn't exist
try {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
} catch (error) {
  console.warn(`Failed to create cache directory: ${error.message}`);
}

/**
 * Calculate content hash using SHA-256
 * @param {Buffer|string} content - The content to hash
 * @returns {string} - Hex-encoded SHA-256 hash
 */
export function calculateContentHash(content) {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Upload content to Walrus storage with retry mechanism
 * @param {Buffer|string} content - Content to upload
 * @param {Object} options - Upload options
 * @param {string} options.contentType - MIME type of the content
 * @param {number} [options.maxRetries=MAX_RETRIES] - Maximum number of retry attempts
 * @param {number} [options.retryDelay=RETRY_DELAY_MS] - Delay between retries in milliseconds
 * @returns {Promise<Object>} - Upload result with CID and verification info
 * @throws {Error} - If upload fails after all retries
 */
export async function uploadToWalrus(content, options) {
  const { 
    contentType, 
    maxRetries = MAX_RETRIES, 
    retryDelay = RETRY_DELAY_MS 
  } = options;
  
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
  const contentHash = calculateContentHash(buffer);
  
  // Get API key from config
  const config = getConfig();
  const apiKey = config?.walrus?.apiKey;
  
  if (!apiKey) {
    throw new Error('Walrus API key not found in configuration');
  }

  // Prepare upload parameters
  const uploadParams = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': contentType || 'application/octet-stream',
    },
    body: buffer,
  };

  let lastError;
  // Retry logic
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retrying upload attempt ${attempt}/${maxRetries}...`);
        await setTimeout(retryDelay * attempt); // Exponential backoff
      }
      
      // Make request to Walrus API
      const response = await fetch(`${WALRUS_API_ENDPOINT}/upload`, uploadParams);
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Upload failed with status ${response.status}: ${errorData}`);
      }
      
      const result = await response.json();
      
      // Verify the content was uploaded correctly by checking CID
      const verificationResult = await verifyUpload(result.cid, contentHash);
      
      if (!verificationResult.verified) {
        throw new Error('Content verification failed. Hash mismatch.');
      }
      
      // Return successful result with CID and verification info
      return {
        ...result,
        contentHash,
        verified: true
      };
    } catch (error) {
      lastError = error;
      console.error(`Upload attempt ${attempt + 1} failed:`, error.message);
      
      // If this was the last attempt, rethrow
      if (attempt === maxRetries) {
        throw new Error(`Failed to upload to Walrus after ${maxRetries} attempts: ${lastError.message}`);
      }
    }
  }
}

/**
 * Verify an uploaded content by its CID
 * @param {string} cid - Content identifier from Walrus
 * @param {string} expectedHash - Expected SHA-256 hash
 * @returns {Promise<Object>} - Verification result
 */
export async function verifyUpload(cid, expectedHash) {
  try {
    // Get API key from config
    const config = getConfig();
    const apiKey = config?.walrus?.apiKey;
    
    if (!apiKey) {
      throw new Error('Walrus API key not found in configuration');
    }

    // Fetch content metadata from Walrus
    const response = await fetch(`${WALRUS_API_ENDPOINT}/content/${cid}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to verify content: ${response.statusText}`);
    }
    
    const metadata = await response.json();
    
    // Compare hashes to verify content integrity
    const verified = metadata.hash === expectedHash;
    
    return {
      verified,
      cid,
      metadata
    };
  } catch (error) {
    console.error('Verification error:', error.message);
    return {
      verified: false,
      error: error.message
    };
  }
}

/**
 * Record content storage on Sui blockchain
 * @param {string} cid - Content identifier from Walrus
 * @param {string} contentHash - SHA-256 hash of the content
 * @param {string} repoId - Repository identifier
 * @returns {Promise<Object>} - Transaction result
 */
export async function recordContentOnChain(cid, contentHash, repoId) {
  try {
    // Get Sui configuration
    const config = getConfig();
    const suiConfig = config?.sui;
    
    if (!suiConfig || !suiConfig.endpoint || !suiConfig.privateKey) {
      throw new Error('Sui configuration is incomplete');
    }
    
    // Setup Sui client
    const client = new SuiClient({
      url: suiConfig.endpoint,
    });
    
    // Create keypair from private key
    const keypair = Ed25519Keypair.fromSecretKey(
      Buffer.from(suiConfig.privateKey, 'hex')
    );
    
    // Prepare transaction to record content
    const tx = new Transaction();
    tx.moveCall({
      target: `${suiConfig.packageId}::git_blob_object::record_blob_storage`,
      arguments: [
        tx.pure(repoId),
        tx.pure(contentHash),
        tx.pure(cid),
      ],
    });
    
    // Sign and execute transaction
    const result = await client.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
    });
    
    // Verify transaction success
    if (result.effects?.status?.status !== 'success') {
      throw new Error(`Transaction failed: ${JSON.stringify(result.effects?.status)}`);
    }
    
    return {
      success: true,
      transactionDigest: result.digest,
      result
    };
  } catch (error) {
    console.error('Failed to record content on chain:', error);
    throw new Error(`Blockchain recording failed: ${error.message}`);
  }
}

/**
 * Upload multiple content items to Walrus in batch
 * @param {Array<{content: Buffer|string, contentType: string}>} items - Array of content items
 * @param {string} repoId - Repository identifier
 * @returns {Promise<Array<Object>>} - Array of upload results
 */
export async function batchUpload(items, repoId) {
  const results = [];
  
  for (const item of items) {
    try {
      // Upload content to Walrus
      const uploadResult = await uploadToWalrus(item.content, {
        contentType: item.contentType
      });
      
      // Record on blockchain
      const chainResult = await recordContentOnChain(
        uploadResult.cid,
        uploadResult.contentHash,
        repoId
      );
      
      results.push({
        success: true,
        cid: uploadResult.cid,
        contentHash: uploadResult.contentHash,
        transactionDigest: chainResult.transactionDigest
      });
    } catch (error) {
      results.push({
        success: false,
        error: error.message,
        content: item.content.slice(0, 20) + '...' // Include partial content for debugging
      });
    }
  }
  
  return results;
}

/**
 * Check if content already exists in Walrus by hash
 * @param {string} contentHash - SHA-256 hash of content
 * @returns {Promise<Object|null>} - Content info if exists, null otherwise
 */
export async function checkContentExists(contentHash) {
  try {
    // Get API key from config
    const config = getConfig();
    const apiKey = config?.walrus?.apiKey;
    
    if (!apiKey) {
      throw new Error('Walrus API key not found in configuration');
    }

    // Query Walrus API for content by hash
    const response = await fetch(`${WALRUS_API_ENDPOINT}/content/by-hash/${contentHash}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      }
    });
    
    // If not found, return null
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to check content: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking content existence:', error.message);
    // Return null on error to allow fallback to upload
    return null;
  }
}

/**
 * Store content with deduplication
 * First checks if content already exists, uploads only if needed
 * @param {Buffer|string} content - Content to store
 * @param {Object} options - Upload options
 * @param {string} repoId - Repository identifier
 * @returns {Promise<Object>} - Storage result
 */
export async function storeContent(content, options, repoId) {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
  const contentHash = calculateContentHash(buffer);
  
  // Check if content already exists
  const existingContent = await checkContentExists(contentHash);
  
  if (existingContent) {
    console.log(`Content already exists with CID: ${existingContent.cid}`);
    
    // Record on blockchain even if content already exists in Walrus
    // This creates the relationship between the repo and the content
    const chainResult = await recordContentOnChain(
      existingContent.cid,
      contentHash,
      repoId
    );
    
    return {
      success: true,
      cid: existingContent.cid,
      contentHash,
      transactionDigest: chainResult.transactionDigest,
      deduplicated: true
    };
  }
  
  // Content doesn't exist, upload it
  const uploadResult = await uploadToWalrus(buffer, options);
  
  // Record on blockchain
  const chainResult = await recordContentOnChain(
    uploadResult.cid,
    contentHash,
    repoId
  );
  
  return {
    success: true,
    cid: uploadResult.cid,
    contentHash,
    transactionDigest: chainResult.transactionDigest,
    deduplicated: false
  };
}

/**
 * Retrieve content from Walrus by CID
 * @param {string} cid - Content identifier
 * @returns {Promise<Buffer>} - Content as buffer
 */
export async function retrieveContent(cid) {
  try {
    // Get API key from config
    const config = getConfig();
    const apiKey = config?.walrus?.apiKey;
    
    if (!apiKey) {
      throw new Error('Walrus API key not found in configuration');
    }

    // Fetch content from Walrus
    const response = await fetch(`${WALRUS_API_ENDPOINT}/content/${cid}/data`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to retrieve content: ${response.statusText}`);
    }
    
    // Get content as buffer
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error retrieving content:', error.message);
    throw new Error(`Content retrieval failed: ${error.message}`);
  }
}

/**
 * Get cache file path for a given CID
 * @param {string} cid - Content identifier
 * @returns {string} - Cache file path
 * @private
 */
function _getCacheFilePath(cid) {
  return path.join(CACHE_DIR, `${cid}.data`);
}

/**
 * Get metadata file path for a given CID
 * @param {string} cid - Content identifier
 * @returns {string} - Metadata file path
 * @private
 */
function _getMetadataFilePath(cid) {
  return path.join(CACHE_DIR, `${cid}.meta.json`);
}

/**
 * Clean old cache entries to maintain cache size limits
 * @private
 */
async function _cleanupCache() {
  try {
    // Get all cache files
    const files = fs.readdirSync(CACHE_DIR);
    const now = Date.now();
    
    // Filter for data files and get their stats
    const cacheFiles = files
      .filter(file => file.endsWith('.data'))
      .map(file => {
        const filePath = path.join(CACHE_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          path: filePath,
          size: stats.size,
          accessTime: stats.atimeMs,
          cid: file.replace('.data', '')
        };
      });
    
    // First remove expired cache entries
    let removedCount = 0;
    for (const file of cacheFiles) {
      const metaPath = _getMetadataFilePath(file.cid);
      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          if (now - meta.timestamp > CACHE_MAX_AGE) {
            fs.unlinkSync(file.path);
            fs.unlinkSync(metaPath);
            removedCount++;
          }
        } catch (error) {
          // If metadata is corrupted, remove the cache entry
          fs.unlinkSync(file.path);
          if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
          removedCount++;
        }
      }
    }
    
    // If still over size limit, remove least recently accessed files
    let currentSize = cacheFiles.reduce((sum, file) => sum + file.size, 0);
    if (currentSize > CACHE_MAX_SIZE) {
      // Sort by access time (oldest first)
      const sortedFiles = cacheFiles.sort((a, b) => a.accessTime - b.accessTime);
      
      for (const file of sortedFiles) {
        if (currentSize <= CACHE_MAX_SIZE) break;
        
        const metaPath = _getMetadataFilePath(file.cid);
        fs.unlinkSync(file.path);
        if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
        
        currentSize -= file.size;
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} cache entries`);
    }
  } catch (error) {
    console.warn(`Cache cleanup failed: ${error.message}`);
  }
}

/**
 * Download content from Walrus storage by blob ID (CID)
 * Implements caching, verification, and error handling
 * 
 * @param {string} cid - Content identifier (blob ID) from Walrus
 * @param {Object} options - Download options
 * @param {boolean} [options.skipCache=false] - Skip cache and force download
 * @param {boolean} [options.verifyContent=true] - Verify content integrity after download
 * @param {number} [options.maxRetries=MAX_RETRIES] - Maximum retry attempts
 * @returns {Promise<Buffer>} - Downloaded content as Buffer
 * @throws {Error} - If download fails or content verification fails
 */
export async function downloadFromWalrus(cid, options = {}) {
  const {
    skipCache = false,
    verifyContent = true, 
    maxRetries = MAX_RETRIES
  } = options;
  
  const cacheFilePath = _getCacheFilePath(cid);
  const metadataFilePath = _getMetadataFilePath(cid);
  
  // Check cache first unless skipCache is true
  if (!skipCache && fs.existsSync(cacheFilePath) && fs.existsSync(metadataFilePath)) {
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataFilePath, 'utf8'));
      const content = fs.readFileSync(cacheFilePath);
      
      // Update access time
      fs.utimesSync(cacheFilePath, new Date(), new Date());
      fs.utimesSync(metadataFilePath, new Date(), new Date());
      
      // Verify cached content if requested
      if (verifyContent) {
        const contentHash = calculateContentHash(content);
        if (contentHash !== metadata.hash) {
          console.warn(`Cache integrity check failed for ${cid}, will re-download`);
          // Delete corrupted cache files
          fs.unlinkSync(cacheFilePath);
          fs.unlinkSync(metadataFilePath);
        } else {
          console.log(`Cache hit for ${cid}`);
          return content;
        }
      } else {
        console.log(`Cache hit for ${cid} (unverified)`);
        return content;
      }
    } catch (error) {
      console.warn(`Cache read error for ${cid}: ${error.message}`);
      // Continue to fresh download if cache read fails
    }
  }
  
  // Not in cache or skipCache is true, download from Walrus
  console.log(`Downloading content ${cid} from Walrus...`);
  
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry download attempt ${attempt + 1}/${maxRetries}...`);
        await setTimeout(RETRY_DELAY_MS * attempt); // Exponential backoff
      }
      
      // Get API key from config
      const config = getConfig();
      const apiKey = config?.walrus?.apiKey;
      
      if (!apiKey) {
        throw new Error('Walrus API key not found in configuration');
      }
      
      // Fetch content metadata first to get expected hash
      const metadataResponse = await fetch(`${WALRUS_API_ENDPOINT}/content/${cid}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        }
      });
      
      if (!metadataResponse.ok) {
        throw new Error(`Failed to retrieve content metadata: ${metadataResponse.statusText}`);
      }
      
      const metadata = await metadataResponse.json();
      const expectedHash = metadata.hash;
      
      // Download the actual content
      const contentResponse = await fetch(`${WALRUS_API_ENDPOINT}/content/${cid}/data`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        }
      });
      
      if (!contentResponse.ok) {
        throw new Error(`Failed to download content: ${contentResponse.statusText}`);
      }
      
      const arrayBuffer = await contentResponse.arrayBuffer();
      const content = Buffer.from(arrayBuffer);
      
      // Verify downloaded content if requested
      if (verifyContent) {
        const contentHash = calculateContentHash(content);
        if (contentHash !== expectedHash) {
          throw new Error(`Content verification failed. Expected hash: ${expectedHash}, got: ${contentHash}`);
        }
      }
      
      // Cache the content for future use
      try {
        // Ensure cache directory exists
        if (!fs.existsSync(CACHE_DIR)) {
          fs.mkdirSync(CACHE_DIR, { recursive: true });
        }
        
        // Write content to cache
        fs.writeFileSync(cacheFilePath, content);
        
        // Write metadata to cache
        const metadataObj = {
          cid,
          hash: expectedHash,
          timestamp: Date.now(),
          size: content.length,
          contentType: metadata.contentType || 'application/octet-stream'
        };
        fs.writeFileSync(metadataFilePath, JSON.stringify(metadataObj, null, 2));
        
        // Clean up old cache entries asynchronously
        _cleanupCache().catch(err => console.warn(`Cache cleanup error: ${err.message}`));
      } catch (cacheError) {
        console.warn(`Failed to cache content: ${cacheError.message}`);
        // Continue even if caching fails
      }
      
      return content;
    } catch (error) {
      lastError = error;
      console.error(`Download attempt ${attempt + 1} failed:`, error.message);
    }
  }
  
  throw new Error(`Failed to download content after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Verify content integrity by comparing with expected hash
 * @param {Buffer} content - Content to verify
 * @param {string} expectedHash - Expected SHA-256 hash
 * @returns {boolean} - True if content hash matches expected hash
 */
export function verifyContentIntegrity(content, expectedHash) {
  const contentHash = calculateContentHash(content);
  return contentHash === expectedHash;
}

/**
 * Download content by hash instead of CID
 * Useful when you know the hash but not the CID
 * 
 * @param {string} contentHash - SHA-256 hash of the content
 * @param {Object} options - Download options (same as downloadFromWalrus)
 * @returns {Promise<Buffer>} - Downloaded content as Buffer
 * @throws {Error} - If content not found or download fails
 */
export async function downloadByHash(contentHash, options = {}) {
  try {
    // First check if we have this hash in local cache
    const cacheDir = fs.readdirSync(CACHE_DIR);
    for (const file of cacheDir) {
      if (file.endsWith('.meta.json')) {
        try {
          const metaPath = path.join(CACHE_DIR, file);
          const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          
          if (metadata.hash === contentHash) {
            const cacheFilePath = _getCacheFilePath(metadata.cid);
            if (fs.existsSync(cacheFilePath)) {
              const content = fs.readFileSync(cacheFilePath);
              
              // Verify and return cached content
              if (verifyContentIntegrity(content, contentHash)) {
                console.log(`Cache hit for hash ${contentHash}`);
                // Update access time
                fs.utimesSync(cacheFilePath, new Date(), new Date());
                fs.utimesSync(metaPath, new Date(), new Date());
                return content;
              }
            }
          }
        } catch (error) {
          // Ignore individual cache read errors
        }
      }
    }
    
    // Not in cache, look up CID by hash
    const contentInfo = await checkContentExists(contentHash);
    if (!contentInfo) {
      throw new Error(`Content with hash ${contentHash} not found in Walrus storage`);
    }
    
    // Download using the CID
    return await downloadFromWalrus(contentInfo.cid, options);
  } catch (error) {
    throw new Error(`Failed to download content by hash: ${error.message}`);
  }
}

/**
 * Check if content exists in local cache
 * @param {string} cid - Content identifier
 * @returns {boolean} - True if content exists in cache
 */
export function isContentCached(cid) {
  const cacheFilePath = _getCacheFilePath(cid);
  const metadataFilePath = _getMetadataFilePath(cid);
  return fs.existsSync(cacheFilePath) && fs.existsSync(metadataFilePath);
}

/**
 * Get cache statistics
 * @returns {Object} - Cache stats including size, item count, and age range
 */
export function getCacheStats() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      return {
        exists: false,
        size: 0,
        itemCount: 0,
        oldestItem: null,
        newestItem: null
      };
    }
    
    const files = fs.readdirSync(CACHE_DIR);
    const dataFiles = files.filter(file => file.endsWith('.data'));
    
    let totalSize = 0;
    let oldestTimestamp = Date.now();
    let newestTimestamp = 0;
    let oldestItem = null;
    let newestItem = null;
    
    dataFiles.forEach(file => {
      const cid = file.replace('.data', '');
      const filePath = path.join(CACHE_DIR, file);
      const metaPath = _getMetadataFilePath(cid);
      
      // Get file size
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
      
      // Check metadata for timestamps
      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          if (meta.timestamp < oldestTimestamp) {
            oldestTimestamp = meta.timestamp;
            oldestItem = cid;
          }
          if (meta.timestamp > newestTimestamp) {
            newestTimestamp = meta.timestamp;
            newestItem = cid;
          }
        } catch (error) {
          // Ignore metadata parsing errors
        }
      }
    });
    
    return {
      exists: true,
      size: totalSize,
      itemCount: dataFiles.length,
      oldestItem: oldestItem ? {
        cid: oldestItem,
        timestamp: oldestTimestamp,
        date: new Date(oldestTimestamp).toISOString()
      } : null,
      newestItem: newestItem ? {
        cid: newestItem,
        timestamp: newestTimestamp,
        date: new Date(newestTimestamp).toISOString()
      } : null
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return {
      exists: fs.existsSync(CACHE_DIR),
      error: error.message
    };
  }
}

/**
 * Clear the content cache
 * @param {Object} options - Clear options
 * @param {boolean} [options.olderThan] - Only clear items older than this timestamp (ms)
 * @returns {Object} - Results of the clear operation
 */
export function clearCache(options = {}) {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      return { success: true, message: 'Cache directory does not exist' };
    }
    
    const files = fs.readdirSync(CACHE_DIR);
    let removedCount = 0;
    
    for (const file of files) {
      // Only process metadata files to get timestamp info
      if (file.endsWith('.meta.json')) {
        const cid = file.replace('.meta.json', '');
        const metaPath = path.join(CACHE_DIR, file);
        const dataPath = _getCacheFilePath(cid);
        
        let shouldRemove = true;
        
        // If olderThan is specified, check timestamp
        if (options.olderThan) {
          try {
            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            if (meta.timestamp >= options.olderThan) {
              shouldRemove = false; // Skip if newer than specified time
            }
          } catch (error) {
            // If metadata is corrupted, remove it anyway
          }
        }
        
        if (shouldRemove) {
          // Remove both metadata and data files
          if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
          if (fs.existsSync(dataPath)) fs.unlinkSync(dataPath);
          removedCount++;
        }
      } else if (!file.endsWith('.data')) {
        // Remove any non-data, non-metadata files (potential garbage)
        fs.unlinkSync(path.join(CACHE_DIR, file));
      }
    }
    
    return {
      success: true,
      removedCount,
      message: removedCount > 0 ? `Removed ${removedCount} cache entries` : 'No cache entries were removed'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

export default {
  // Original functions
  uploadToWalrus,
  verifyUpload,
  recordContentOnChain,
  batchUpload,
  calculateContentHash,
  checkContentExists,
  storeContent,
  retrieveContent,
  
  // New download and verification functions
  downloadFromWalrus,
  downloadByHash,
  verifyContentIntegrity,
  
  // Cache management functions
  isContentCached,
  getCacheStats,
  clearCache
};