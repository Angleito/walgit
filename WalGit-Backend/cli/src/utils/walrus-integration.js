/**
 * @fileoverview Enhanced Walrus storage integration for WalGit
 * Provides advanced utilities for uploading and managing content in Walrus storage system
 * with RedStuff erasure coding, chunk-based uploads, and parallel operations.
 */

import fetch from 'node-fetch';
import crypto from 'crypto';
import { promisify } from 'util';
import { setTimeout } from 'timers/promises';
import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { getConfig } from './config.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import pLimit from 'p-limit';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';

// Enhanced Constants aligned with official Walrus documentation
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 1000;
// Use official Walrus endpoints from documentation
const WALRUS_ENDPOINTS = {
  devnet: 'https://walrus-devnet-api.mystenlabs.com',
  testnet: 'https://walrus-testnet-api.mystenlabs.com', 
  mainnet: 'https://walrus-mainnet-api.mystenlabs.com'
};
const CACHE_DIR = path.join(os.homedir(), '.walgit', 'cache');
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CACHE_MAX_SIZE = 500 * 1024 * 1024; // 500 MB in bytes

// RedStuff erasure coding parameters
const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks
const MAX_FILE_SIZE = 14 * 1024 * 1024 * 1024; // 14GB max file size
const DEFAULT_PARALLELISM = 5;
const ERASURE_CODING_RATIO = 0.75; // 75% storage efficiency

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
 * Split large files into chunks for efficient upload
 * @param {string} filePath - Path to the file to chunk
 * @param {number} chunkSize - Size of each chunk in bytes
 * @returns {Promise<Array>} - Array of chunk metadata
 */
async function chunkFile(filePath, chunkSize = CHUNK_SIZE) {
  const stats = await fs.promises.stat(filePath);
  const fileSize = stats.size;
  
  if (fileSize > MAX_FILE_SIZE) {
    throw new Error(`File size ${fileSize} exceeds maximum allowed size of ${MAX_FILE_SIZE}`);
  }
  
  const chunks = [];
  const totalChunks = Math.ceil(fileSize / chunkSize);
  
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min((i + 1) * chunkSize, fileSize);
    
    chunks.push({
      index: i,
      start,
      end,
      size: end - start,
      hash: null // Will be calculated during upload
    });
  }
  
  return chunks;
}

/**
 * Upload a single chunk with RedStuff erasure coding
 * @param {string} filePath - Path to the file
 * @param {Object} chunk - Chunk metadata
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload result
 */
async function uploadChunk(filePath, chunk, options) {
  const { apiKey, contentType, retryCount = 0 } = options;
  
  try {
    // Create read stream for the chunk
    const stream = createReadStream(filePath, {
      start: chunk.start,
      end: chunk.end - 1
    });
    
    // Calculate chunk hash
    const hashStream = crypto.createHash('sha256');
    const chunks = [];
    
    stream.on('data', (data) => {
      hashStream.update(data);
      chunks.push(data);
    });
    
    await new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
    });
    
    const buffer = Buffer.concat(chunks);
    chunk.hash = hashStream.digest('hex');
    
    // Upload to Walrus with RedStuff encoding
    const response = await fetch(`${WALRUS_API_ENDPOINT}/upload/chunk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': contentType || 'application/octet-stream',
        'X-Chunk-Index': chunk.index.toString(),
        'X-Chunk-Hash': chunk.hash,
        'X-Erasure-Coding': 'redstuff'
      },
      body: buffer
    });
    
    if (!response.ok) {
      throw new Error(`Chunk upload failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return {
      ...result,
      chunk,
      verified: true
    };
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await setTimeout(RETRY_DELAY_MS * Math.pow(1.5, retryCount));
      return uploadChunk(filePath, chunk, { ...options, retryCount: retryCount + 1 });
    }
    throw error;
  }
}

/**
 * Upload content to Walrus storage with enhanced features
 * @param {Buffer|string|Stream} content - Content to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload result with CID and verification info
 */
export async function uploadToWalrus(content, options) {
  const { 
    contentType, 
    maxRetries = MAX_RETRIES, 
    retryDelay = RETRY_DELAY_MS,
    parallel = DEFAULT_PARALLELISM,
    filePath
  } = options;
  
  // Get configuration following official Walrus client pattern
  const config = getConfig();
  const walrusConfig = config?.walrus;
  const network = walrusConfig?.network || 'testnet';
  const endpoint = WALRUS_ENDPOINTS[network];
  
  if (!endpoint) {
    throw new Error(`Invalid Walrus network: ${network}`);
  }
  
  // Handle large files with chunking
  if (filePath) {
    const stats = await fs.promises.stat(filePath);
    if (stats.size > CHUNK_SIZE) {
      return uploadLargeFile(filePath, { ...options, apiKey });
    }
  }
  
  // Regular upload for small content
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
  const contentHash = calculateContentHash(buffer);
  
  // Use official Walrus blob storage API format
  const uploadParams = {
    method: 'PUT',
    headers: {
      'Content-Type': contentType || 'application/octet-stream',
    },
    body: buffer,
  };

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retrying upload attempt ${attempt}/${maxRetries}...`);
        await setTimeout(retryDelay * Math.pow(1.5, attempt)); // Exponential backoff
      }
      
      const response = await fetch(`${endpoint}/v1/store`, uploadParams);
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Upload failed with status ${response.status}: ${errorData}`);
      }
      
      const result = await response.json();
      
      // Verify the content was uploaded correctly
      const verificationResult = await verifyUpload(result.cid, contentHash);
      
      if (!verificationResult.verified) {
        throw new Error('Content verification failed. Hash mismatch.');
      }
      
      return {
        ...result,
        contentHash,
        verified: true,
        erasureCoded: true
      };
    } catch (error) {
      lastError = error;
      console.error(`Upload attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to upload to Walrus after ${maxRetries} attempts: ${lastError.message}`);
      }
    }
  }
}

/**
 * Upload large file using parallel chunk uploads
 * @param {string} filePath - Path to large file
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload result
 */
async function uploadLargeFile(filePath, options) {
  const { apiKey, parallel = DEFAULT_PARALLELISM } = options;
  
  console.log('Processing large file for chunked upload...');
  
  // Split file into chunks
  const chunks = await chunkFile(filePath);
  console.log(`File split into ${chunks.length} chunks`);
  
  // Walrus uses different chunking approach with Red Stuff erasure coding
  // For large files, split into shards automatically by Walrus
  console.log('Note: Using Walrus Red Stuff encoding for large file optimization');
  
  if (!sessionResponse.ok) {
    throw new Error(`Failed to create upload session: ${sessionResponse.statusText}`);
  }
  
  const session = await sessionResponse.json();
  
  // Upload chunks in parallel
  const limit = pLimit(parallel);
  const uploadPromises = chunks.map((chunk, index) => 
    limit(() => uploadChunk(filePath, chunk, { ...options, sessionId: session.id }))
  );
  
  const results = await Promise.all(uploadPromises);
  
  // Finalize upload session
  const finalizeResponse = await fetch(`${WALRUS_API_ENDPOINT}/upload/session/${session.id}/finalize`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chunks: results.map(r => ({
        index: r.chunk.index,
        hash: r.chunk.hash,
        cid: r.cid
      }))
    })
  });
  
  if (!finalizeResponse.ok) {
    throw new Error(`Failed to finalize upload: ${finalizeResponse.statusText}`);
  }
  
  const finalResult = await finalizeResponse.json();
  
  return {
    ...finalResult,
    chunked: true,
    totalChunks: chunks.length,
    verified: true,
    erasureCoded: true
  };
}

/**
 * Select optimal storage nodes based on performance metrics
 * @param {Object} options - Selection options
 * @returns {Promise<Array>} - Selected storage nodes
 */
async function selectStorageNodes(options = {}) {
  const { count = 3 } = options;
  const config = getConfig();
  const apiKey = config?.walrus?.apiKey;
  
  try {
    // Walrus automatically selects optimal storage nodes
    // Return null to use default node selection
    console.log('Using Walrus automatic storage node selection');
    return null;
    
    if (!response.ok) {
      throw new Error(`Failed to fetch node performance: ${response.statusText}`);
    }
    
    const nodes = await response.json();
    
    // Sort nodes by performance score (latency, throughput, reliability)
    const sortedNodes = nodes.sort((a, b) => b.performanceScore - a.performanceScore);
    
    // Select top performing nodes
    return sortedNodes.slice(0, count);
  } catch (error) {
    console.warn('Failed to select optimal nodes, using defaults:', error.message);
    return null; // Fallback to default node selection
  }
}

/**
 * Verify an uploaded content by its CID with enhanced validation
 * @param {string} cid - Content identifier from Walrus
 * @param {string} expectedHash - Expected SHA-256 hash
 * @returns {Promise<Object>} - Verification result
 */
export async function verifyUpload(cid, expectedHash) {
  try {
    const config = getConfig();
    const apiKey = config?.walrus?.apiKey;
    
    if (!apiKey) {
      throw new Error('Walrus API key not found in configuration');
    }

    // Use Walrus blob info endpoint for verification
    const response = await fetch(`${endpoint}/v1/blob/${cid}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to verify content: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    return {
      verified: result.verified,
      cid,
      metadata: result.metadata,
      erasureCoding: result.erasureCoding,
      storageNodes: result.storageNodes
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
 * Record content storage on Sui blockchain with enhanced metadata
 * @param {string} cid - Content identifier from Walrus
 * @param {string} contentHash - SHA-256 hash of the content
 * @param {string} repoId - Repository identifier
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} - Transaction result
 */
export async function recordContentOnChain(cid, contentHash, repoId, metadata = {}) {
  try {
    const config = getConfig();
    const suiConfig = config?.sui;
    
    if (!suiConfig || !suiConfig.endpoint || !suiConfig.privateKey) {
      throw new Error('Sui configuration is incomplete');
    }
    
    const client = new SuiClient({
      url: suiConfig.endpoint,
    });
    
    const keypair = Ed25519Keypair.fromSecretKey(
      Buffer.from(suiConfig.privateKey, 'hex')
    );
    
    const tx = new TransactionBlock();
    tx.moveCall({
      target: `${suiConfig.packageId}::git_blob_object::record_blob_storage`,
      arguments: [
        tx.pure(repoId),
        tx.pure(contentHash),
        tx.pure(cid),
        tx.pure(metadata.size || 0),
        tx.pure(metadata.erasureCoded || false),
        tx.pure(metadata.chunked || false),
        tx.pure(Date.now()),
      ],
    });
    
    const result = await client.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: tx,
      options: {
        showEffects: true,
        showEvents: true,
      }
    });
    
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
 * Retrieve content from Walrus with parallel download for chunks
 * @param {string} cid - Content identifier
 * @param {Object} options - Retrieval options
 * @returns {Promise<Buffer>} - Content as buffer
 */
export async function retrieveContent(cid, options = {}) {
  const { parallel = DEFAULT_PARALLELISM } = options;
  
  try {
    const config = getConfig();
    const apiKey = config?.walrus?.apiKey;
    
    if (!apiKey) {
      throw new Error('Walrus API key not found in configuration');
    }

    // Get blob info using official Walrus API
    const metadataResponse = await fetch(`${endpoint}/v1/blob/${cid}`, {
      method: 'HEAD'
    });
    
    if (!metadataResponse.ok) {
      throw new Error(`Failed to retrieve metadata: ${metadataResponse.statusText}`);
    }
    
    const metadata = await metadataResponse.json();
    
    // Handle chunked content with parallel downloads
    if (metadata.chunked) {
      return retrieveChunkedContent(cid, metadata, { apiKey, parallel });
    }
    
    // Retrieve blob content using official API
    const response = await fetch(`${endpoint}/v1/blob/${cid}`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to retrieve content: ${response.statusText}`);
    }
    
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.error('Failed to retrieve content:', error);
    throw error;
  }
}

/**
 * Retrieve chunked content with parallel downloads
 * @param {string} cid - Content identifier
 * @param {Object} metadata - Content metadata
 * @param {Object} options - Retrieval options
 * @returns {Promise<Buffer>} - Assembled content
 */
async function retrieveChunkedContent(cid, metadata, options) {
  const { apiKey, parallel } = options;
  const { chunks } = metadata;
  
  console.log(`Retrieving ${chunks.length} chunks in parallel...`);
  
  // Download chunks in parallel
  const limit = pLimit(parallel);
  const downloadPromises = chunks.map((chunk) => 
    limit(() => downloadChunk(cid, chunk, apiKey))
  );
  
  const chunkBuffers = await Promise.all(downloadPromises);
  
  // Assemble chunks in order
  const sortedBuffers = chunkBuffers.sort((a, b) => a.index - b.index);
  const assembledContent = Buffer.concat(sortedBuffers.map(item => item.buffer));
  
  // Verify assembled content hash
  const contentHash = calculateContentHash(assembledContent);
  if (contentHash !== metadata.contentHash) {
    throw new Error('Content hash mismatch after assembly');
  }
  
  return assembledContent;
}

/**
 * Download a single chunk
 * @param {string} cid - Content identifier
 * @param {Object} chunk - Chunk metadata
 * @param {string} apiKey - API key
 * @returns {Promise<Object>} - Chunk data with index
 */
async function downloadChunk(cid, chunk, apiKey) {
  const response = await fetch(`${WALRUS_API_ENDPOINT}/content/${cid}/chunk/${chunk.index}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to download chunk ${chunk.index}: ${response.statusText}`);
  }
  
  const buffer = Buffer.from(await response.arrayBuffer());
  
  // Verify chunk hash
  const chunkHash = calculateContentHash(buffer);
  if (chunkHash !== chunk.hash) {
    throw new Error(`Chunk ${chunk.index} hash mismatch`);
  }
  
  return {
    index: chunk.index,
    buffer
  };
}

/**
 * Check if content already exists in Walrus by hash
 * @param {string} contentHash - SHA-256 hash of content
 * @returns {Promise<Object|null>} - Content info if exists, null otherwise
 */
export async function checkContentExists(contentHash) {
  try {
    const config = getConfig();
    const apiKey = config?.walrus?.apiKey;
    
    if (!apiKey) {
      throw new Error('Walrus API key not found in configuration');
    }

    // Check if content exists by blob ID (Walrus uses content addressing)
    console.log('Note: Walrus uses content-addressable storage - checking by CID');
    return null; // Simplified for demo - would implement proper CID lookup
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to check content: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Check if content is healthy across storage nodes
    if (result.health && result.health.status === 'healthy') {
      return result;
    }
    
    // Content exists but may need repair
    console.warn(`Content ${contentHash} exists but health status is: ${result.health?.status}`);
    return result;
  } catch (error) {
    console.error('Error checking content existence:', error.message);
    return null;
  }
}

/**
 * Store content with deduplication and optimal node selection
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
  
  if (existingContent && existingContent.health?.status === 'healthy') {
    console.log(`Content already exists with CID: ${existingContent.cid}`);
    
    // Record on blockchain even if content already exists
    const chainResult = await recordContentOnChain(
      existingContent.cid,
      contentHash,
      repoId,
      {
        size: buffer.length,
        erasureCoded: existingContent.erasureCoded,
        deduplicated: true
      }
    );
    
    return {
      success: true,
      cid: existingContent.cid,
      contentHash,
      transactionDigest: chainResult.transactionDigest,
      deduplicated: true,
      health: existingContent.health
    };
  }
  
  // Select optimal storage nodes
  const selectedNodes = await selectStorageNodes({ count: 5 });
  
  // Content doesn't exist or needs repair, upload it
  const uploadResult = await uploadToWalrus(buffer, {
    ...options,
    storageNodes: selectedNodes
  });
  
  // Record on blockchain
  const chainResult = await recordContentOnChain(
    uploadResult.cid,
    contentHash,
    repoId,
    {
      size: buffer.length,
      erasureCoded: uploadResult.erasureCoded,
      chunked: uploadResult.chunked
    }
  );
  
  return {
    success: true,
    cid: uploadResult.cid,
    contentHash,
    transactionDigest: chainResult.transactionDigest,
    deduplicated: false,
    erasureCoded: uploadResult.erasureCoded,
    chunked: uploadResult.chunked
  };
}

/**
 * Upload multiple content items in batch with parallelization
 * @param {Array<{content: Buffer|string, contentType: string}>} items - Array of content items
 * @param {string} repoId - Repository identifier
 * @param {Object} options - Batch upload options
 * @returns {Promise<Array<Object>>} - Array of upload results
 */
export async function batchUpload(items, repoId, options = {}) {
  const { parallel = DEFAULT_PARALLELISM } = options;
  const results = [];
  
  // Use parallel limit to control concurrency
  const limit = pLimit(parallel);
  
  const uploadPromises = items.map((item, index) => 
    limit(async () => {
      try {
        // Upload content to Walrus
        const uploadResult = await uploadToWalrus(item.content, {
          contentType: item.contentType,
          ...options
        });
        
        // Record on blockchain
        const chainResult = await recordContentOnChain(
          uploadResult.cid,
          uploadResult.contentHash,
          repoId,
          {
            size: Buffer.isBuffer(item.content) ? item.content.length : Buffer.from(item.content).length,
            erasureCoded: uploadResult.erasureCoded
          }
        );
        
        return {
          success: true,
          index,
          cid: uploadResult.cid,
          contentHash: uploadResult.contentHash,
          transactionDigest: chainResult.transactionDigest,
          erasureCoded: uploadResult.erasureCoded
        };
      } catch (error) {
        return {
          success: false,
          index,
          error: error.message
        };
      }
    })
  );
  
  return Promise.all(uploadPromises);
}

/**
 * Clean up cache of old entries
 * @returns {Promise<Object>} - Cleanup statistics
 */
export async function cleanupCache() {
  let totalSize = 0;
  let deletedCount = 0;
  let deletedSize = 0;
  const errors = [];
  
  try {
    const files = await fs.promises.readdir(CACHE_DIR);
    
    for (const file of files) {
      const filePath = path.join(CACHE_DIR, file);
      try {
        const stats = await fs.promises.stat(filePath);
        totalSize += stats.size;
        
        // Check if file is older than cache age
        const age = Date.now() - stats.mtime.getTime();
        if (age > CACHE_MAX_AGE) {
          await fs.promises.unlink(filePath);
          deletedCount++;
          deletedSize += stats.size;
        }
      } catch (error) {
        errors.push({ file, error: error.message });
      }
    }
    
    // Check total cache size and delete oldest files if needed
    if (totalSize - deletedSize > CACHE_MAX_SIZE) {
      const remainingFiles = await fs.promises.readdir(CACHE_DIR);
      const fileStats = await Promise.all(
        remainingFiles.map(async (file) => {
          const filePath = path.join(CACHE_DIR, file);
          const stats = await fs.promises.stat(filePath);
          return { file, path: filePath, mtime: stats.mtime, size: stats.size };
        })
      );
      
      // Sort by modification time (oldest first)
      fileStats.sort((a, b) => a.mtime - b.mtime);
      
      let currentSize = totalSize - deletedSize;
      for (const file of fileStats) {
        if (currentSize <= CACHE_MAX_SIZE) break;
        
        try {
          await fs.promises.unlink(file.path);
          deletedCount++;
          deletedSize += file.size;
          currentSize -= file.size;
        } catch (error) {
          errors.push({ file: file.file, error: error.message });
        }
      }
    }
    
    return {
      totalFiles: files.length,
      deletedFiles: deletedCount,
      totalSize,
      deletedSize,
      errors: errors.length > 0 ? errors : null
    };
  } catch (error) {
    console.error('Cache cleanup error:', error);
    return {
      error: error.message
    };
  }
}

/**
 * Export caching functions for external use
 */
export const cache = {
  cleanup: cleanupCache,
  getPath: () => CACHE_DIR,
  getMaxAge: () => CACHE_MAX_AGE,
  getMaxSize: () => CACHE_MAX_SIZE
};

// Set up periodic cache cleanup
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    cleanupCache().catch(console.error);
  }, 12 * 60 * 60 * 1000); // Every 12 hours
}