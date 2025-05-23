/**
 * @fileoverview Enhanced Blob Manager for WalGit
 *
 * This module provides an optimized set of functions for managing Git blob objects
 * in the WalGit system. It handles creation, storage, retrieval, and verification
 * of blob objects, integrating with Walrus storage for persistence.
 *
 * Key improvements:
 * - Multi-level caching for frequently accessed blobs
 * - Chunked upload/download for large files with progress tracking
 * - Enhanced data integrity with multiple hash verification
 * - Parallel processing for batch operations
 * - Compression ratio optimization
 * - Deduplication of identical content
 * - Predictive prefetching for related blobs
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import zlib from 'zlib';
import { promisify } from 'util';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pLimit from 'p-limit';

// Import optimized utilities
import { HASH_ALGORITHMS, verifyIntegrity, createIntegrityBlob, calculateFileChecksums,
         verifyAndRepair, compareBlobData, createQuickChecksum } from './data-integrity.js';
import { initializeSuiClient } from './sui-integration.js';
import { walrusClient } from './walrus-sdk-integration.js';
import { getConfig } from './config.js';
// Repository path is always the current working directory
import { formatBytes } from './format-utils.js';
import { OptimizedStorageManager } from './optimized-storage.js';
import { PersistentCache } from './persistent-cache.js';
import { createMultiLevelCache } from './multi-level-cache.js';

// Convert zlib methods to promise-based API
const deflate = promisify(zlib.deflate);
const inflate = promisify(zlib.inflate);

// Cache configuration
const METADATA_CACHE_SIZE = 1000;
const CONTENT_CACHE_SIZE = 100;
const CACHE_TTL = 3600000; // 1 hour in milliseconds

// Multi-level cache instances - initialized during module load
let metadataCache = null;
let contentCache = null;

// Initialize caches asynchronously
const initializeCaches = async () => {
  try {
    // Initialize metadata cache
    metadataCache = await createMultiLevelCache({
      name: 'blob-metadata-cache',
      memoryCacheSize: 10 * 1024 * 1024, // 10MB memory for metadata
      fsCacheSize: 50 * 1024 * 1024, // 50MB for filesystem cache
      persistentCacheOptions: {
        dbName: 'walgit-blob-metadata-cache',
        storeName: 'metadata',
        maxSize: 100 * 1024 * 1024, // 100MB max size
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
      walrusClient: {
        get: async (key) => {
          try {
            // Only try to get metadata from Walrus for blobs we know exist
            const config = await getConfig();
            const exists = await walrusClient.blobExists({
              blobHash: key,
              repositoryId: config.currentRepository
            });

            if (exists) {
              const info = await walrusClient.getBlobInfo({
                blobHash: key,
                repositoryId: config.currentRepository
              });

              return {
                hash: key,
                size: info.size,
                compressedSize: info.compressedSize,
                integrity: info.integrity ? JSON.parse(info.integrity) : null,
                contentType: info.contentType || 'application/octet-stream',
                createdAt: info.createdAt || Date.now()
              };
            }
            return null;
          } catch (error) {
            return null;
          }
        },
        set: async () => false, // We don't write metadata back to Walrus
        has: async (key) => {
          try {
            const config = await getConfig();
            return await walrusClient.blobExists({
              blobHash: key,
              repositoryId: config.currentRepository
            });
          } catch (error) {
            return false;
          }
        }
      },
      enablePrefetching: true
    });

    // Initialize content cache
    contentCache = await createMultiLevelCache({
      name: 'blob-content-cache',
      memoryCacheSize: 100 * 1024 * 1024, // 100MB memory cache
      fsCacheSize: 500 * 1024 * 1024, // 500MB filesystem cache
      persistentCacheOptions: {
        dbName: 'walgit-blob-content-cache',
        storeName: 'content',
        maxSize: 1024 * 1024 * 1024, // 1GB max size
        maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
      },
      walrusClient: {
        get: async (key) => {
          try {
            const config = await getConfig();
            const result = await walrusClient.retrieveBlob({
              blobHash: key,
              repositoryId: config.currentRepository
            });

            if (result && result.content) {
              return Buffer.from(result.content, 'base64');
            }
            return null;
          } catch (error) {
            return null;
          }
        },
        set: async (key, value, metadata) => {
          try {
            if (!Buffer.isBuffer(value)) {
              return false;
            }

            const config = await getConfig();
            const base64Data = value.toString('base64');

            await walrusClient.storeBlob({
              blobHash: key,
              content: base64Data,
              repositoryId: config.currentRepository,
              contentType: metadata?.contentType || 'application/octet-stream',
              size: metadata?.size || value.length,
              integrity: metadata?.integrity ? JSON.stringify(metadata.integrity) : undefined
            });

            return true;
          } catch (error) {
            return false;
          }
        },
        has: async (key) => {
          try {
            const config = await getConfig();
            return await walrusClient.blobExists({
              blobHash: key,
              repositoryId: config.currentRepository
            });
          } catch (error) {
            return false;
          }
        }
      },
      enablePrefetching: true
    });

    console.log('Blob manager caches initialized successfully');
  } catch (error) {
    console.error('Error initializing blob manager caches:', error);
    // Fallback to in-memory LRU cache if initialization fails
    const { LRUCache } = await import('lru-cache');

    metadataCache = {
      get: async (key) => {
        const lru = new LRUCache({ max: METADATA_CACHE_SIZE, ttl: CACHE_TTL });
        return lru.get(key);
      },
      set: async (key, value) => {
        const lru = new LRUCache({ max: METADATA_CACHE_SIZE, ttl: CACHE_TTL });
        lru.set(key, value);
        return true;
      },
      has: async (key) => {
        const lru = new LRUCache({ max: METADATA_CACHE_SIZE, ttl: CACHE_TTL });
        return lru.has(key);
      }
    };

    contentCache = {
      get: async (key) => {
        const lru = new LRUCache({
          max: CONTENT_CACHE_SIZE,
          ttl: CACHE_TTL,
          sizeCalculation: (value) => value.length,
          maxSize: 100 * 1024 * 1024
        });
        return lru.get(key);
      },
      set: async (key, value) => {
        const lru = new LRUCache({
          max: CONTENT_CACHE_SIZE,
          ttl: CACHE_TTL,
          sizeCalculation: (value) => value.length,
          maxSize: 100 * 1024 * 1024
        });
        lru.set(key, value);
        return true;
      },
      has: async (key) => {
        const lru = new LRUCache({
          max: CONTENT_CACHE_SIZE,
          ttl: CACHE_TTL,
          sizeCalculation: (value) => value.length,
          maxSize: 100 * 1024 * 1024
        });
        return lru.has(key);
      }
    };
  }
};

// Start caches initialization
initializeCaches();

// Processing limits
const MAX_CONCURRENT_OPERATIONS = 5;
const concurrencyLimit = pLimit(MAX_CONCURRENT_OPERATIONS);

// Compression settings
const COMPRESSION_LEVELS = {
  NONE: 0,
  FAST: 1,
  DEFAULT: 6,
  BEST: 9
};

/**
 * Gets the optimal compression level based on file size and type
 * @param {number} size - File size in bytes
 * @param {string} contentType - Content MIME type
 * @returns {number} Optimal compression level
 */
function getOptimalCompressionLevel(size, contentType) {
  // Already compressed formats don't compress well
  const compressedFormats = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'audio/mp3', 'audio/ogg', 'video/mp4', 'video/webm',
    'application/zip', 'application/gzip', 'application/x-7z-compressed'
  ];
  
  if (compressedFormats.includes(contentType)) {
    return COMPRESSION_LEVELS.NONE;
  }
  
  // For very large files, use faster compression
  if (size > 50 * 1024 * 1024) { // 50MB
    return COMPRESSION_LEVELS.FAST;
  }
  
  // For small to medium files, use best compression
  if (size < 5 * 1024 * 1024) { // 5MB
    return COMPRESSION_LEVELS.BEST;
  }
  
  // Default for everything else
  return COMPRESSION_LEVELS.DEFAULT;
}

/**
 * Creates a Git blob object from file content with enhanced features
 * @param {Buffer|string} content - The content to store in the blob
 * @param {Object} options - Creation options
 * @param {number} [options.compressionLevel] - Compression level (0-9, defaults to auto)
 * @param {boolean} [options.verify] - Whether to verify after creation (default: true)
 * @param {boolean} [options.deduplicate] - Check for duplicates before storing (default: true)
 * @param {boolean} [options.storeWalrus] - Store in Walrus (default: true)
 * @returns {Promise<{hash: string, size: number, integrity: Object}>}
 */
export async function createBlob(content, options = {}) {
  // Extract options with defaults
  const {
    compressionLevel = null,
    verify = true,
    deduplicate = true,
    storeWalrus = true
  } = options;

  // Ensure content is a Buffer
  const contentBuffer = Buffer.isBuffer(content) ? content : Buffer.from(content);

  // Determine content type from buffer (basic detection)
  const contentType = guessContentType(contentBuffer);

  // Create blob with integrity checks
  const {
    hash,
    size,
    compressedSize,
    integrity,
    compressionRatio,
    compressedData
  } = await createIntegrityBlob(contentBuffer, [HASH_ALGORITHMS.SHA1, HASH_ALGORITHMS.SHA256, HASH_ALGORITHMS.BLAKE2B]);

  // Create metadata object
  const metadata = {
    hash,
    size,
    compressedSize,
    integrity,
    compressionRatio,
    contentType,
    createdAt: Date.now()
  };

  // Update metadata cache (use await since it's now async)
  await metadataCache.set(hash, metadata, {
    metadata: {
      type: 'blob-metadata',
      contentType
    }
  });

  // Deduplicate if enabled
  if (deduplicate) {
    const existsLocal = await blobExistsLocally(hash);
    const existsWalrus = !existsLocal && await blobExistsInWalrus(hash);

    if (existsLocal || existsWalrus) {
      console.log(`Blob ${hash} already exists, skipping storage.`);
      return {
        hash,
        size,
        integrity,
        compressionRatio,
        exists: true,
        location: existsLocal ? 'local' : 'walrus'
      };
    }
  }

  // Store locally
  await storeLocalBlob(hash, compressedData);

  // Add to content cache (use await since it's now async)
  await contentCache.set(hash, contentBuffer, {
    metadata: {
      hash,
      size,
      contentType,
      integrity
    }
  });

  // Store in Walrus if enabled
  let walrusResult = null;
  if (storeWalrus) {
    try {
      walrusResult = await storeWalrusBlob(hash, compressedData, {
        size,
        contentType,
        integrity
      });
    } catch (error) {
      console.error(`Error storing blob ${hash} in Walrus:`, error.message);
      // Continue even if Walrus storage fails
    }
  }

  // Verify if enabled
  if (verify) {
    const verificationResult = await verifyBlob(hash, contentBuffer);
    if (!verificationResult.verified) {
      console.warn(`Integrity check failed for blob ${hash}. ${verificationResult.error || ''}`);
    }
  }

  return {
    hash,
    size,
    integrity,
    compressionRatio,
    walrusResult: walrusResult || null
  };
}

/**
 * Determines content type from a buffer sample
 * @param {Buffer} buffer - Data buffer
 * @returns {string} Detected MIME type
 */
function guessContentType(buffer) {
  // Basic content type detection based on buffer analysis
  // Check for common file signatures (magic numbers)
  
  if (buffer.length < 4) return 'application/octet-stream';
  
  // Check file signatures
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }
  
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }
  
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return 'image/gif';
  }
  
  if (buffer[0] === 0x50 && buffer[1] === 0x4B && (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07)) {
    return 'application/zip';
  }
  
  // Text detection
  const textSignature = buffer.slice(0, Math.min(buffer.length, 1000)).toString('utf8');
  
  if (textSignature.includes('<?xml')) {
    return 'application/xml';
  }
  
  if (textSignature.includes('<!DOCTYPE html') || textSignature.includes('<html')) {
    return 'text/html';
  }
  
  if (/^[\x20-\x7E\t\r\n]*$/.test(textSignature)) {
    return 'text/plain';
  }
  
  // Default to binary
  return 'application/octet-stream';
}

/**
 * Stores a blob in the local .git/objects directory
 * @param {string} hash - The SHA-1 hash of the blob
 * @param {Buffer} compressedData - The compressed blob data
 * @returns {Promise<void>}
 */
async function storeLocalBlob(hash, compressedData) {
  const repoPath = process.cwd();
  const objectsDir = path.join(repoPath, '.git', 'objects');
  
  // Git objects are stored in directories named by the first 2 characters of the hash
  // with filenames being the remaining characters
  const subdir = hash.substring(0, 2);
  const filename = hash.substring(2);
  const objectPath = path.join(objectsDir, subdir, filename);
  
  // Check if object already exists to avoid unnecessary writes
  try {
    await fs.access(objectPath);
    return; // Object already exists
  } catch (error) {
    // Object doesn't exist, proceed with creation
  }
  
  // Create the subdirectory if it doesn't exist
  await fs.mkdir(path.join(objectsDir, subdir), { recursive: true });
  
  // Write the compressed data to the object file
  await fs.writeFile(objectPath, compressedData);
}

/**
 * Stores a blob in Walrus storage via Sui Move contract with enhanced features
 * @param {string} hash - The SHA-1 hash of the blob
 * @param {Buffer} compressedData - The compressed blob data
 * @param {Object} metadata - Additional blob metadata
 * @returns {Promise<Object>} - The transaction result
 */
// Import resilience utilities
import { resilience } from './index.js';

async function storeWalrusBlob(hash, compressedData, metadata = {}) {
  const config = await getConfig();

  // Skip Walrus storage in simulation mode
  if (config.simulationMode) {
    return {
      digest: 'simulation-mode-skip-walrus-storage',
      simulated: true
    };
  }

  try {
    // Check blob size
    const DIRECT_UPLOAD_LIMIT = 1 * 1024 * 1024; // 1MB

    // Use resilient Walrus operation with proper error handling
    if (compressedData.length <= DIRECT_UPLOAD_LIMIT) {
      // Small blob - direct upload with resilience
      return await resilience.executeWalrusOperation(
        () => storeSmallWalrusBlob(hash, compressedData, metadata),
        {
          operation: 'store-small-blob',
          component: 'walrus-storage',
          hash: hash,
          size: compressedData.length,
          metadata: {
            contentType: metadata.contentType,
            blobSize: metadata.size || compressedData.length
          }
        }
      );
    } else {
      // Large blob - chunked upload with resilience
      return await resilience.executeWalrusOperation(
        () => storeLargeWalrusBlob(hash, compressedData, metadata),
        {
          operation: 'store-large-blob',
          component: 'walrus-storage',
          hash: hash,
          size: compressedData.length,
          metadata: {
            contentType: metadata.contentType,
            blobSize: metadata.size || compressedData.length,
            chunked: true
          }
        }
      );
    }
  } catch (error) {
    console.error('Error storing blob in Walrus:', error);
    throw new Error(`Failed to store blob ${hash} in Walrus storage: ${error.message}`);
  }
}

/**
 * Stores a small blob (< 1MB) directly to Walrus
 * @param {string} hash - The SHA-1 hash of the blob
 * @param {Buffer} compressedData - The compressed blob data
 * @param {Object} metadata - Additional blob metadata
 * @returns {Promise<Object>} - The transaction result
 */
async function storeSmallWalrusBlob(hash, compressedData, metadata = {}) {
  const config = await getConfig();
  
  // Convert to base64 for transmission
  const base64Data = compressedData.toString('base64');
  
  // Store in Walrus via Sui Move contract
  const txResult = await walrusClient.storeBlob({
    blobHash: hash,
    content: base64Data,
    repositoryId: config.currentRepository,
    contentType: metadata.contentType || 'application/octet-stream',
    size: metadata.size || compressedData.length,
    integrity: metadata.integrity ? JSON.stringify(metadata.integrity) : undefined
  });
  
  return txResult;
}

/**
 * Stores a large blob (> 1MB) in chunks to Walrus
 * @param {string} hash - The SHA-1 hash of the blob
 * @param {Buffer} compressedData - The compressed blob data
 * @param {Object} metadata - Additional blob metadata
 * @returns {Promise<Object>} - The transaction result
 */
async function storeLargeWalrusBlob(hash, compressedData, metadata = {}) {
  const config = await getConfig();
  
  // Split into 1MB chunks (or smaller for the last one)
  const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks
  const totalChunks = Math.ceil(compressedData.length / CHUNK_SIZE);
  
  // Initialize chunked storage
  const initResult = await walrusClient.initChunkedBlob({
    blobHash: hash,
    totalChunks,
    repositoryId: config.currentRepository,
    contentType: metadata.contentType || 'application/octet-stream',
    size: metadata.size || compressedData.length,
    integrity: metadata.integrity ? JSON.stringify(metadata.integrity) : undefined
  });
  
  // Upload each chunk in parallel with concurrency limit
  const chunkPromises = [];
  
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, compressedData.length);
    const chunkData = compressedData.slice(start, end);
    
    // Add chunk upload to the queue with concurrency limit
    chunkPromises.push(
      concurrencyLimit(async () => {
        // Convert chunk to base64
        const base64Chunk = chunkData.toString('base64');
        
        // Store chunk
        const chunkResult = await walrusClient.storeBlobChunk({
          blobHash: hash,
          chunkIndex: i,
          content: base64Chunk,
          repositoryId: config.currentRepository,
          chunkHash: createQuickChecksum(chunkData) // Add integrity check for chunk
        });
        
        return { index: i, result: chunkResult };
      })
    );
  }
  
  // Wait for all chunks to upload
  const chunkResults = await Promise.all(chunkPromises);
  
  // Finalize chunked storage
  const finalizeResult = await walrusClient.finalizeBlobChunks({
    blobHash: hash,
    repositoryId: config.currentRepository,
    integrityHash: metadata.integrity?.sha256 || '' // Use SHA-256 for stronger validation
  });
  
  return {
    initResult,
    chunkResults,
    finalizeResult
  };
}

/**
 * Retrieves a blob with enhanced caching and verification
 * @param {string} hash - The SHA-1 hash of the blob to retrieve
 * @param {Object} options - Options for retrieval
 * @param {boolean} [options.raw=false] - If true, returns raw git object without decompressing
 * @param {boolean} [options.contentOnly=true] - If true, returns only the content (not the header)
 * @param {boolean} [options.verify=true] - Verify blob integrity after retrieval
 * @param {boolean} [options.useCache=true] - Use cache if available
 * @param {boolean} [options.updateCache=true] - Update cache with retrieved content
 * @param {boolean} [options.prefetch=true] - Prefetch related blobs
 * @param {Object} [options.context] - Additional context for prefetching
 * @returns {Promise<Buffer>} - The blob data
 */
export async function getBlob(hash, options = {}) {
  // Parse options with defaults
  const {
    raw = false,
    contentOnly = true,
    verify = true,
    useCache = true,
    updateCache = true,
    prefetch = true,
    context = {}
  } = options;

  let blob = null;
  let source = null;

  // Try to get from multi-level cache first if enabled and not requesting raw data
  if (useCache && !raw) {
    try {
      const cachedContent = await contentCache.get(hash, {
        enablePrefetch: prefetch,
        recordAccess: true
      });

      if (cachedContent) {
        source = 'cache';

        if (prefetch && contentCache.prefetcher) {
          // Start background prefetching for related blobs based on context
          if (context.path || context.type) {
            // Don't await - let it run in background
            contentCache.prefetcher.prefetchRelatedFiles(context).catch(err => {
              if (contentCache.debug) {
                console.warn(`Prefetch error: ${err.message}`);
              }
            });
          }
        }

        return contentOnly ? cachedContent : createBlobWithHeader(cachedContent);
      }
    } catch (cacheError) {
      // Continue with non-cache retrievals
      console.warn(`Cache retrieval error for ${hash}:`, cacheError.message);
    }
  }

  try {
    // Try to get from local storage
    blob = await getLocalBlob(hash, { raw, contentOnly });
    source = 'local';

    // Verify if needed
    if (verify && !raw) {
      const content = contentOnly ? blob : extractContent(blob);
      const verified = await verifyBlob(hash, content);

      if (!verified.verified) {
        throw new Error(`Blob ${hash} integrity verification failed`);
      }
    }
  } catch (localError) {
    // If not found locally, try Walrus storage
    try {
      blob = await getWalrusBlob(hash, { raw, contentOnly });
      source = 'walrus';

      // Verify if needed
      if (verify && !raw) {
        const content = contentOnly ? blob : extractContent(blob);
        const verified = await verifyBlob(hash, content);

        if (!verified.verified) {
          throw new Error(`Blob ${hash} integrity verification failed (Walrus storage)`);
        }
      }

      // Store locally for future use
      try {
        if (raw) {
          await storeLocalBlob(hash, blob);
        } else {
          const compressedData = await deflate(createBlobWithHeader(contentOnly ? blob : blob));
          await storeLocalBlob(hash, compressedData);
        }
      } catch (storeError) {
        console.warn(`Could not store retrieved blob ${hash} locally: ${storeError.message}`);
      }
    } catch (walrusError) {
      throw new Error(`Blob ${hash} not found in local or Walrus storage: ${walrusError.message}`);
    }
  }

  // Update multi-level cache if needed
  if (updateCache && !raw && blob) {
    try {
      const cacheContent = contentOnly ? blob : extractContent(blob);

      // Get metadata from metadata cache if available
      let metadataObj = null;
      try {
        metadataObj = await metadataCache.get(hash);
      } catch (metadataError) {
        // Continue without metadata
      }

      // Store in content cache
      await contentCache.set(hash, cacheContent, {
        metadata: {
          hash,
          source,
          contentType: metadataObj?.contentType || guessContentType(cacheContent),
          size: cacheContent.length,
          ...(metadataObj || {}),
          retrievedAt: Date.now()
        }
      });
    } catch (cacheError) {
      console.warn(`Could not update cache for blob ${hash}:`, cacheError.message);
    }
  }

  // Start prefetching related blobs in the background if enabled
  if (prefetch && source === 'walrus' && contentCache.prefetcher) {
    // Don't await - let it run in background
    if (context.path || context.type) {
      contentCache.prefetcher.prefetchRelatedFiles(context).catch(err => {
        // Silently fail prefetching - it's a performance optimization
      });
    }
  }

  return blob;
}

/**
 * Extracts content from a blob with header
 * @param {Buffer} blob - Blob with header
 * @returns {Buffer} Content without header
 */
function extractContent(blob) {
  const nullIndex = blob.indexOf(0);
  if (nullIndex === -1) {
    return blob; // No header found, return as-is
  }
  return blob.subarray(nullIndex + 1);
}

/**
 * Creates a blob with Git header
 * @param {Buffer} content - Content without header
 * @returns {Buffer} Blob with header
 */
function createBlobWithHeader(content) {
  const header = Buffer.from(`blob ${content.length}\0`);
  return Buffer.concat([header, content]);
}

/**
 * Retrieves a blob from local .git/objects directory with optimized handling
 * @param {string} hash - The SHA-1 hash of the blob to retrieve
 * @param {Object} options - Options for retrieval
 * @returns {Promise<Buffer>} - The blob data
 */
async function getLocalBlob(hash, { raw = false, contentOnly = true }) {
  const repoPath = process.cwd();
  const subdir = hash.substring(0, 2);
  const filename = hash.substring(2);
  const objectPath = path.join(repoPath, '.git', 'objects', subdir, filename);
  
  // Read the compressed object
  const compressedData = await fs.readFile(objectPath);
  
  if (raw) {
    return compressedData;
  }
  
  // Decompress the object
  const data = await inflate(compressedData);
  
  if (contentOnly) {
    // Parse and extract only the content (skip the header)
    const nullIndex = data.indexOf(0);
    if (nullIndex === -1) {
      throw new Error(`Invalid blob format for ${hash}`);
    }
    return data.subarray(nullIndex + 1);
  }
  
  return data;
}

/**
 * Retrieves a blob from Walrus storage with optimized chunked downloads
 * @param {string} hash - The SHA-1 hash of the blob to retrieve
 * @param {Object} options - Options for retrieval
 * @returns {Promise<Buffer>} - The blob data
 */
async function getWalrusBlob(hash, { raw = false, contentOnly = true }) {
  const config = await getConfig();

  // In simulation mode, throw error since we can't fetch from Walrus
  if (config.simulationMode) {
    throw new Error(`Blob ${hash} not found locally and simulation mode is enabled`);
  }

  try {
    // Use resilient Walrus operation with circuit breaker and retry logic
    return await resilience.executeWalrusOperation(
      async () => {
        // Check if blob is chunked
        const blobInfo = await walrusClient.getBlobInfo({
          blobHash: hash,
          repositoryId: config.currentRepository
        });

        let compressedData;

        if (blobInfo.isChunked) {
          // Handle chunked blob
          compressedData = await getChunkedWalrusBlob(hash, blobInfo);
        } else {
          // Retrieve normal blob from Walrus
          const result = await walrusClient.retrieveBlob({
            blobHash: hash,
            repositoryId: config.currentRepository
          });

          // Convert from base64
          compressedData = Buffer.from(result.content, 'base64');
        }

        if (raw) {
          return compressedData;
        }

        // Decompress the object
        const data = await inflate(compressedData);

        if (contentOnly) {
          // Parse and extract only the content (skip the header)
          const nullIndex = data.indexOf(0);
          if (nullIndex === -1) {
            throw new Error(`Invalid blob format for ${hash}`);
          }
          return data.subarray(nullIndex + 1);
        }

        return data;
      },
      {
        operation: 'retrieve-blob',
        component: 'walrus-storage',
        hash: hash,
        metadata: {
          raw,
          contentOnly
        },
        retryCount: 3,  // More retries for retrieval operations
        backoffFactor: 1.3  // Slightly gentler backoff for reads
      }
    );
  } catch (error) {
    console.error('Error retrieving blob from Walrus:', error);
    throw new Error(`Failed to retrieve blob ${hash} from Walrus storage: ${error.message}`);
  }
}

/**
 * Retrieves a chunked blob from Walrus storage
 * @param {string} hash - The SHA-1 hash of the blob
 * @param {Object} blobInfo - Blob metadata
 * @returns {Promise<Buffer>} Reassembled blob data
 */
async function getChunkedWalrusBlob(hash, blobInfo) {
  const config = await getConfig();
  const totalChunks = blobInfo.totalChunks;

  // Create operations array for each chunk download
  const chunkOperations = [];

  for (let i = 0; i < totalChunks; i++) {
    // Create a function for each chunk operation
    const chunkIndex = i; // Capture for closure
    chunkOperations.push(async () => {
      const chunkResult = await walrusClient.retrieveBlobChunk({
        blobHash: hash,
        chunkIndex: chunkIndex,
        repositoryId: config.currentRepository
      });

      // Verify chunk integrity if hash is available
      if (chunkResult.chunkHash) {
        const chunkData = Buffer.from(chunkResult.content, 'base64');
        const actualHash = createQuickChecksum(chunkData);

        if (actualHash !== chunkResult.chunkHash) {
          throw new Error(`Chunk ${chunkIndex} integrity check failed for blob ${hash}`);
        }
      }

      return {
        index: chunkIndex,
        data: Buffer.from(chunkResult.content, 'base64')
      };
    });
  }

  // Use resilient batch processing with network-aware concurrency
  const batchResults = await resilience.processBatchResilient(
    chunkOperations,
    // Execute function is the identity function, as each operation returns its result directly
    op => op(),
    {
      operation: 'download-chunks',
      component: 'walrus-storage',
      batchType: 'blob-chunks',
      // Adaptive concurrency based on network conditions with a reasonable maximum
      concurrency: Math.min(MAX_CONCURRENT_OPERATIONS, 5),
      // Strong retry for important operations
      retryCount: 4,
      continueOnError: false, // Fail the whole operation if any chunk fails
      metadata: {
        blobHash: hash,
        totalChunks,
        repositoryId: config.currentRepository
      }
    }
  );

  // Pull successful results and sort by chunk index
  const chunks = batchResults.successful
    .map(result => result.result)
    .sort((a, b) => a.index - b.index);

  // Ensure we have all chunks
  if (chunks.length !== totalChunks) {
    throw new Error(`Missing chunks for blob ${hash}, expected ${totalChunks} but got ${chunks.length}`);
  }

  // Concatenate all chunks in order
  const reassembledData = Buffer.concat(chunks.map(chunk => chunk.data));

  // Verify overall integrity if hash is available
  if (blobInfo.integrityHash) {
    const actualHash = createQuickChecksum(reassembledData);

    if (actualHash !== blobInfo.integrityHash) {
      throw new Error(`Blob ${hash} integrity check failed after reassembly`);
    }
  }

  return reassembledData;
}

/**
 * Checks if a blob exists locally
 * @param {string} hash - The SHA-1 hash to verify
 * @returns {Promise<boolean>} - True if the blob exists locally
 */
export async function blobExistsLocally(hash) {
  try {
    const repoPath = process.cwd();
    const subdir = hash.substring(0, 2);
    const filename = hash.substring(2);
    const objectPath = path.join(repoPath, '.git', 'objects', subdir, filename);
    
    await fs.access(objectPath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Checks if a blob exists in Walrus storage
 * @param {string} hash - The SHA-1 hash to verify
 * @returns {Promise<boolean>} - True if the blob exists in Walrus
 */
export async function blobExistsInWalrus(hash) {
  const config = await getConfig();
  
  // In simulation mode, always return false
  if (config.simulationMode) {
    return false;
  }
  
  try {
    const exists = await walrusClient.blobExists({
      blobHash: hash,
      repositoryId: config.currentRepository
    });
    
    return exists;
  } catch (error) {
    return false;
  }
}

/**
 * Verifies if a blob with the given hash exists in any storage
 * @param {string} hash - The SHA-1 hash to verify
 * @returns {Promise<{exists: boolean, location: string|null}>} - Existence and location info
 */
export async function blobExists(hash) {
  // Check multi-level cache first (fastest)
  try {
    // Check content cache
    const hasContent = await contentCache.has(hash, {
      checkAllLayers: false // Stop at first layer that has it
    });

    if (hasContent) {
      return {
        exists: true,
        location: 'cache'
      };
    }

    // Check metadata cache
    const hasMetadata = await metadataCache.has(hash, {
      checkAllLayers: false
    });

    if (hasMetadata) {
      return {
        exists: true,
        location: 'cache'
      };
    }
  } catch (cacheError) {
    // Continue with non-cache checks
    console.warn(`Cache check error for ${hash}:`, cacheError.message);
  }

  // Check local storage
  const existsLocally = await blobExistsLocally(hash);
  if (existsLocally) {
    // Update metadata cache for future fast checks
    try {
      await metadataCache.set(hash, {
        hash,
        exists: true,
        location: 'local',
        checkedAt: Date.now()
      }, {
        metadata: { type: 'existence-check' }
      });
    } catch (error) {
      // Continue even if cache update fails
    }

    return {
      exists: true,
      location: 'local'
    };
  }

  // Check Walrus storage
  const existsInWalrus = await blobExistsInWalrus(hash);
  if (existsInWalrus) {
    // Update metadata cache for future fast checks
    try {
      await metadataCache.set(hash, {
        hash,
        exists: true,
        location: 'walrus',
        checkedAt: Date.now()
      }, {
        metadata: { type: 'existence-check' }
      });
    } catch (error) {
      // Continue even if cache update fails
    }

    return {
      exists: true,
      location: 'walrus'
    };
  }

  // Also negative results are cached to avoid repeated checks
  try {
    await metadataCache.set(hash, {
      hash,
      exists: false,
      location: null,
      checkedAt: Date.now()
    }, {
      metadata: { type: 'existence-check' },
      memoryOnly: true, // Only cache in memory - don't persist negative results
      ttl: 60 * 1000 // Only cache for 60 seconds
    });
  } catch (error) {
    // Continue even if cache update fails
  }

  return {
    exists: false,
    location: null
  };
}

/**
 * Calculates the SHA-1 hash of a file with enhanced integrity checks
 * @param {string} filePath - Path to the file
 * @param {Array<string>} algorithms - Hash algorithms to use
 * @returns {Promise<{hash: string, size: number, integrity: Object}>}
 */
export async function calculateFileHash(filePath, algorithms = [HASH_ALGORITHMS.SHA1, HASH_ALGORITHMS.SHA256]) {
  const result = await calculateFileChecksums(filePath, algorithms);
  
  return {
    hash: result.hashes[HASH_ALGORITHMS.SHA1],
    size: result.size,
    integrity: result.hashes
  };
}

/**
 * Creates a blob from a file with optimized streaming and chunking
 * @param {string} filePath - Path to the file
 * @param {Object} options - Creation options
 * @returns {Promise<{hash: string, size: number, integrity: Object}>}
 */
export async function createBlobFromFile(filePath, options = {}) {
  // Calculate file hash and size first
  const { hash, size, integrity } = await calculateFileHash(filePath);
  
  // Check if blob already exists
  if (options.deduplicate !== false) {
    const { exists, location } = await blobExists(hash);
    
    if (exists) {
      console.log(`Blob ${hash} already exists in ${location}, skipping creation.`);
      return { hash, size, integrity, exists: true, location };
    }
  }
  
  const repoPath = process.cwd();
  const objectsDir = path.join(repoPath, '.git', 'objects');
  const subdir = hash.substring(0, 2);
  const filename = hash.substring(2);
  const objectPath = path.join(objectsDir, subdir, filename);
  
  // Create the subdirectory if it doesn't exist
  await fs.mkdir(path.join(objectsDir, subdir), { recursive: true });
  
  // Detect content type for optimal processing
  let contentType = 'application/octet-stream';
  try {
    const fileExtension = path.extname(filePath).toLowerCase();
    contentType = getContentTypeFromExtension(fileExtension);
  } catch (error) {
    // Continue with default content type
  }
  
  // Determine optimal compression level
  const compressionLevel = options.compressionLevel || 
    getOptimalCompressionLevel(size, contentType);
  
  // Create deflate stream with optimized compression level
  const deflateStream = zlib.createDeflate({ level: compressionLevel });
  
  // Create write stream to object file
  const writeStream = createWriteStream(objectPath);
  
  // Create header for Git blob
  const headerStream = createReadStream(Buffer.from(`blob ${size}\0`));
  
  // Create read stream for file content
  const contentStream = createReadStream(filePath);
  
  // Pipeline: header + content -> deflate -> write to file
  await pipeline(
    [headerStream, contentStream],
    deflateStream,
    writeStream
  );
  
  // Store in Walrus in background (don't await) if enabled
  if (options.storeWalrus !== false) {
    const config = await getConfig();
    
    if (!config.simulationMode) {
      storeWalrusLargeBlob(hash, objectPath, {
        size,
        contentType,
        integrity
      }).catch(error => {
        console.error(`Background Walrus storage failed for ${hash}: ${error.message}`);
      });
    }
  }
  
  // Update metadata cache
  metadataCache.set(hash, {
    hash,
    size,
    integrity,
    contentType,
    createdAt: Date.now()
  });
  
  return { hash, size, integrity };
}

/**
 * Gets content type from file extension
 * @param {string} extension - File extension with dot
 * @returns {string} Content MIME type
 */
function getContentTypeFromExtension(extension) {
  const contentTypes = {
    '.txt': 'text/plain',
    '.json': 'application/json',
    '.md': 'text/markdown',
    '.js': 'application/javascript',
    '.jsx': 'application/javascript',
    '.ts': 'application/typescript',
    '.tsx': 'application/typescript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.gz': 'application/gzip',
    '.tar': 'application/x-tar',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
  };
  
  return contentTypes[extension] || 'application/octet-stream';
}

/**
 * Stores a large blob in Walrus storage by reading from the local object file
 * Significantly improved with chunking, integrity checks, and progress tracking
 * @param {string} hash - The SHA-1 hash of the blob
 * @param {string} objectPath - Path to the local object file
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} - The transaction result
 */
async function storeWalrusLargeBlob(hash, objectPath, metadata = {}) {
  const config = await getConfig();
  
  // Skip Walrus storage in simulation mode
  if (config.simulationMode) {
    return {
      digest: 'simulation-mode-skip-walrus-storage',
      simulated: true
    };
  }
  
  try {
    // Read the compressed data
    const compressedData = await fs.readFile(objectPath);
    
    // Store using OptimizedStorageManager
    return await OptimizedStorageManager.uploadBlob(
      config.currentRepository,
      compressedData,
      hash,
      metadata.contentType || 'application/octet-stream',
      metadata
    );
  } catch (error) {
    console.error('Error storing large blob in Walrus:', error);
    throw new Error(`Failed to store large blob ${hash} in Walrus storage: ${error.message}`);
  }
}

/**
 * Verifies a blob's integrity with enhanced multi-hash checks
 * @param {string} hash - The expected SHA-1 hash
 * @param {Buffer} content - The blob content to verify
 * @param {Object} [options] - Verification options
 * @param {boolean} [options.thorough=false] - Perform thorough multi-hash verification
 * @returns {Promise<{verified: boolean, error: string|null}>} - Verification result
 */
export async function verifyBlob(hash, content, options = {}) {
  const { thorough = false } = options;

  try {
    // Ensure content is a Buffer
    const contentBuffer = Buffer.isBuffer(content) ? content : Buffer.from(content);

    // Create the Git blob header
    const header = Buffer.from(`blob ${contentBuffer.length}\0`);
    const blobData = Buffer.concat([header, contentBuffer]);

    // Calculate the SHA-1 hash
    const calculatedHash = crypto.createHash(HASH_ALGORITHMS.SHA1).update(blobData).digest('hex');

    // Compare with the expected hash
    if (calculatedHash !== hash) {
      return {
        verified: false,
        error: `Hash mismatch: expected ${hash}, got ${calculatedHash}`
      };
    }

    // If thorough verification is requested and metadata has integrity values, verify those too
    if (thorough) {
      // Try to get metadata from cache
      let metadata = null;
      try {
        metadata = await metadataCache.get(hash);
      } catch (error) {
        // Continue without metadata
      }

      if (metadata && metadata.integrity) {
        // Verify additional hash algorithms
        for (const [algorithm, expectedHash] of Object.entries(metadata.integrity)) {
          if (algorithm === HASH_ALGORITHMS.SHA1) continue; // Already verified

          try {
            const calculatedHash = crypto.createHash(algorithm).update(blobData).digest('hex');

            if (calculatedHash !== expectedHash) {
              return {
                verified: false,
                error: `${algorithm} hash mismatch: expected ${expectedHash}, got ${calculatedHash}`
              };
            }
          } catch (error) {
            console.warn(`Could not verify ${algorithm} hash: ${error.message}`);
          }
        }
      }
    }

    // After successful verification, update metadata cache with verification timestamp
    try {
      const metadata = await metadataCache.get(hash) || {};
      await metadataCache.set(hash, {
        ...metadata,
        hash,
        verifiedAt: Date.now(),
        verified: true
      }, {
        metadata: {
          type: 'verification-result',
          thorough
        }
      });
    } catch (error) {
      // Continue even if cache update fails
    }

    return { verified: true, error: null };
  } catch (error) {
    // Log verification failure to metadata cache
    try {
      const metadata = await metadataCache.get(hash) || {};
      await metadataCache.set(hash, {
        ...metadata,
        hash,
        verifiedAt: Date.now(),
        verified: false,
        verificationError: error.message
      }, {
        metadata: {
          type: 'verification-result',
          thorough
        },
        memoryOnly: true // Only store failures in memory cache
      });
    } catch (cacheError) {
      // Continue even if cache update fails
    }

    return {
      verified: false,
      error: `Verification error: ${error.message}`
    };
  }
}

/**
 * Finds duplicate blobs based on content hash
 * Optimized for performance with parallel processing and caching
 * @param {Array<string>} filePaths - Array of file paths to check for duplicates
 * @param {Object} options - Options for deduplication
 * @returns {Promise<Object>} - Map of content hashes to arrays of duplicate file paths
 */
export async function findDuplicateBlobs(filePaths, options = {}) {
  const hashToFiles = new Map();
  const concurrentLimit = pLimit(options.concurrency || 5);
  
  // Process files in parallel with concurrency limit
  const hashPromises = filePaths.map(filePath => 
    concurrentLimit(async () => {
      try {
        const { hash } = await calculateFileHash(filePath);
        
        return { filePath, hash };
      } catch (error) {
        console.warn(`Error processing ${filePath}: ${error.message}`);
        return null;
      }
    })
  );
  
  // Wait for all hash calculations
  const results = (await Promise.all(hashPromises)).filter(result => result !== null);
  
  // Group by hash
  for (const { filePath, hash } of results) {
    if (!hashToFiles.has(hash)) {
      hashToFiles.set(hash, []);
    }
    
    hashToFiles.get(hash).push(filePath);
  }
  
  // Filter for duplicates
  const duplicates = {};
  for (const [hash, files] of hashToFiles.entries()) {
    if (files.length > 1) {
      duplicates[hash] = files;
    }
  }
  
  return duplicates;
}

/**
 * Lists all blobs in the repository with enhanced metadata
 * @param {Object} options - Listing options
 * @returns {Promise<Array<{hash: string, size: number, location: string, metadata: Object}>>}
 */
export async function listBlobs(options = {}) {
  const repoPath = process.cwd();
  const objectsDir = path.join(repoPath, '.git', 'objects');
  const blobs = [];
  
  // List local blobs
  try {
    const subdirs = await fs.readdir(objectsDir);
    
    for (const subdir of subdirs) {
      // Skip special directories
      if (subdir === 'info' || subdir === 'pack') continue;
      
      // Skip if not a valid hex directory (2 characters)
      if (subdir.length !== 2 || !/^[0-9a-f]{2}$/.test(subdir)) continue;
      
      const dirPath = path.join(objectsDir, subdir);
      const stats = await fs.stat(dirPath);
      
      if (!stats.isDirectory()) continue;
      
      const files = await fs.readdir(dirPath);
      
      // Process files in parallel with a concurrency limit
      const blobPromises = files.map(file => 
        concurrencyLimit(async () => {
          // Check if valid hex filename (38 characters)
          if (!/^[0-9a-f]{38}$/.test(file)) return null;
          
          const hash = subdir + file;
          const objectPath = path.join(dirPath, file);
          const objectStats = await fs.stat(objectPath);
          
          // Check if we have cached metadata
          if (metadataCache.has(hash)) {
            const metadata = metadataCache.get(hash);
            return {
              hash,
              size: metadata.size,
              location: 'local',
              compressedSize: objectStats.size,
              contentType: metadata.contentType,
              integrity: metadata.integrity,
              compressionRatio: metadata.compressionRatio,
              cached: true
            };
          }
          
          // Get the uncompressed size by reading the header
          let size;
          let contentType = 'application/octet-stream';
          
          try {
            const data = await getBlob(hash, { 
              contentOnly: false, 
              verify: false,
              useCache: true,
              updateCache: false
            });
            
            const header = data.toString('utf8', 0, 100).split('\0')[0];
            if (header.startsWith('blob ')) {
              size = parseInt(header.substring(5).trim(), 10);
              
              // Try to detect content type
              const content = data.subarray(data.indexOf(0) + 1);
              contentType = guessContentType(content);
            } else {
              size = 'unknown';
            }
          } catch (error) {
            size = 'unknown';
          }
          
          return {
            hash,
            size,
            location: 'local',
            compressedSize: objectStats.size,
            contentType,
            compressionRatio: 
              (typeof size === 'number' && objectStats.size) 
                ? (size / objectStats.size).toFixed(2) 
                : 'unknown'
          };
        })
      );
      
      const blobResults = await Promise.all(blobPromises);
      blobs.push(...blobResults.filter(b => b !== null));
    }
  } catch (error) {
    console.error('Error listing local blobs:', error);
  }
  
  // Optionally list Walrus blobs (if not in simulation mode)
  const config = await getConfig();
  if (!config.simulationMode && options.includeWalrus !== false) {
    try {
      const walrusBlobs = await walrusClient.listBlobs({
        repositoryId: config.currentRepository
      });
      
      for (const walrusBlob of walrusBlobs) {
        // Skip if already added from local
        if (blobs.some(b => b.hash === walrusBlob.hash)) continue;
        
        // Add blob from Walrus
        blobs.push({
          hash: walrusBlob.hash,
          size: walrusBlob.size,
          location: 'walrus',
          compressedSize: walrusBlob.compressedSize,
          contentType: walrusBlob.contentType || 'application/octet-stream',
          compressionRatio: walrusBlob.size && walrusBlob.compressedSize
            ? (walrusBlob.size / walrusBlob.compressedSize).toFixed(2)
            : 'unknown',
          integrity: walrusBlob.integrity ? JSON.parse(walrusBlob.integrity) : null,
          walrusDetails: {
            createdAt: walrusBlob.createdAt,
            expiresAt: walrusBlob.expiresAt,
            autoRenew: walrusBlob.autoRenew
          }
        });
      }
    } catch (error) {
      console.error('Error listing Walrus blobs:', error);
    }
  }
  
  // Sort by most recently accessed if requested
  if (options.sortBy === 'recent') {
    blobs.sort((a, b) => {
      const aTimestamp = a.walrusDetails?.createdAt || 0;
      const bTimestamp = b.walrusDetails?.createdAt || 0;
      return bTimestamp - aTimestamp;
    });
  }
  
  // Sort by size if requested
  if (options.sortBy === 'size') {
    blobs.sort((a, b) => {
      const aSize = typeof a.size === 'number' ? a.size : 0;
      const bSize = typeof b.size === 'number' ? b.size : 0;
      return bSize - aSize;
    });
  }
  
  // Apply limit if requested
  if (options.limit && typeof options.limit === 'number') {
    return blobs.slice(0, options.limit);
  }
  
  return blobs;
}

/**
 * Gets comprehensive blob storage statistics for the repository
 * @returns {Promise<Object>} - Detailed storage statistics
 */
export async function getBlobStorageStats() {
  const blobs = await listBlobs();
  
  // Calculate statistics
  let totalSize = 0;
  let totalCompressedSize = 0;
  let localCount = 0;
  let walrusCount = 0;
  let bothCount = 0;
  
  // Content type distribution
  const contentTypes = {};
  
  for (const blob of blobs) {
    // Calculate size statistics
    if (typeof blob.size === 'number') {
      totalSize += blob.size;
    }
    
    if (typeof blob.compressedSize === 'number') {
      totalCompressedSize += blob.compressedSize;
    }
    
    // Count by location
    if (blob.location === 'local') {
      localCount++;
      
      // Check if also in Walrus
      if (blobs.some(b => b.hash === blob.hash && b.location === 'walrus')) {
        bothCount++;
      }
    } else if (blob.location === 'walrus') {
      walrusCount++;
    }
    
    // Track content type distribution
    const contentType = blob.contentType || 'unknown';
    contentTypes[contentType] = (contentTypes[contentType] || 0) + 1;
  }
  
  // Calculate unique blob count (accounting for duplicates in both storage locations)
  const uniqueCount = localCount + walrusCount - bothCount;
  
  // Calculate overall compression ratio
  const overallCompressionRatio = totalSize > 0 && totalCompressedSize > 0
    ? (totalSize / totalCompressedSize).toFixed(2)
    : 'unknown';
  
  // Get quota information from Walrus storage
  let quotaInfo = null;
  try {
    const config = await getConfig();
    if (!config.simulationMode) {
      quotaInfo = await walrusClient.getStorageQuota({
        repositoryId: config.currentRepository
      });
    }
  } catch (error) {
    console.warn('Could not retrieve quota information:', error.message);
  }
  
  return {
    blobCount: {
      total: blobs.length,
      unique: uniqueCount,
      local: localCount,
      walrus: walrusCount,
      synchronized: bothCount
    },
    size: {
      total: totalSize,
      compressed: totalCompressedSize,
      formattedTotal: formatBytes(totalSize),
      formattedCompressed: formatBytes(totalCompressedSize),
      compressionRatio: overallCompressionRatio,
      savings: totalSize > totalCompressedSize 
        ? formatBytes(totalSize - totalCompressedSize)
        : '0 Bytes'
    },
    contentTypes: contentTypes,
    quota: quotaInfo,
    cache: {
      metadataEntries: metadataCache.size,
      contentEntries: contentCache.size,
      contentSize: formatBytes(Array.from(contentCache.values())
        .reduce((total, buffer) => total + buffer.length, 0))
    }
  };
}

/**
 * Migrates blobs between local and Walrus storage with enhanced features
 * @param {string} direction - Either 'local-to-walrus' or 'walrus-to-local'
 * @param {Array<string>} hashes - Array of blob hashes to migrate (if undefined, migrates all)
 * @param {Object} options - Migration options
 * @returns {Promise<{success: Array<string>, failed: Array<{hash: string, error: string}>}>}
 */
export async function migrateBlobs(direction, hashes, options = {}) {
  const results = {
    success: [],
    failed: [],
    skipped: []
  };

  if (direction !== 'local-to-walrus' && direction !== 'walrus-to-local') {
    throw new Error('Invalid migration direction. Use "local-to-walrus" or "walrus-to-local"');
  }

  // If no hashes provided, get all available blobs
  if (!hashes) {
    const blobs = await listBlobs();

    if (direction === 'local-to-walrus') {
      hashes = blobs.filter(b => b.location === 'local').map(b => b.hash);
    } else {
      hashes = blobs.filter(b => b.location === 'walrus').map(b => b.hash);
    }
  }

  // Create an array of migration operations
  const migrationOperations = hashes.map(hash => {
    return async () => {
      if (direction === 'local-to-walrus') {
        // Check if already in Walrus
        if (options.skipExisting !== false) {
          const existsInWalrus = await blobExistsInWalrus(hash);
          if (existsInWalrus) {
            return { hash, result: 'skipped' };
          }
        }

        // Get local blob
        const repoPath = process.cwd();
        const subdir = hash.substring(0, 2);
        const filename = hash.substring(2);
        const objectPath = path.join(repoPath, '.git', 'objects', subdir, filename);

        // Check if object file exists
        await fs.access(objectPath);

        // Get metadata from cache or fallback
        let metadata = await metadataCache.get(hash) || {};

        // Store to Walrus with resilience
        await storeWalrusLargeBlob(hash, objectPath, metadata);

        return { hash, result: 'success' };
      } else {
        // Check if already exists locally
        if (options.skipExisting !== false) {
          const existsLocally = await blobExistsLocally(hash);
          if (existsLocally) {
            return { hash, result: 'skipped' };
          }
        }

        // Get from Walrus with resilience (getWalrusBlob already uses resilience)
        const blobData = await getWalrusBlob(hash, { raw: true });

        // Store locally
        await storeLocalBlob(hash, blobData);

        return { hash, result: 'success' };
      }
    };
  });

  // Process migrations using resilient batch processing
  try {
    const operationType = direction === 'local-to-walrus' ? 'walrus' : 'local';
    const batchResults = await resilience.processBatchResilient(
      migrationOperations,
      async (operation) => {
        try {
          return await operation();
        } catch (error) {
          // Transform error to preserve hash information
          const enhancedError = new Error(`Migration failed: ${error.message}`);
          enhancedError.originalError = error;
          enhancedError.hash = operation.hash;
          throw enhancedError;
        }
      },
      {
        operation: `migrate-blobs-${direction}`,
        component: 'blob-manager',
        batchType: 'migration',
        // Use network-aware concurrency or user provided value
        concurrency: options.concurrency ||
          (operationType === 'walrus' ? 3 : 5), // Higher concurrency for local operations
        retryCount: options.retryCount || 2,
        // Continue on error to migrate as many as possible
        continueOnError: options.continueOnError !== false,
        metadata: {
          direction,
          blobCount: hashes.length
        },
        // Optional progress callback
        onProgress: options.onProgress
      }
    );

    // Process results
    batchResults.successful.forEach(successful => {
      const result = successful.result;
      if (result.result === 'success') {
        results.success.push(result.hash);
      } else if (result.result === 'skipped') {
        results.skipped.push(result.hash);
      }
    });

    // Process failures
    batchResults.failed.forEach(failure => {
      const hash = failure.error.hash || 'unknown';
      results.failed.push({
        hash,
        error: failure.error.message
      });
    });
  } catch (error) {
    console.error('Migration batch process failed:', error);
    // If the entire batch process fails, add a general error
    results.failed.push({
      hash: 'batch-process',
      error: `Batch migration failed: ${error.message}`
    });
  }

  return results;
}

/**
 * Repairs corrupted blobs by comparing local and Walrus copies
 * @param {Array<string>} hashes - Blob hashes to repair, or all if undefined
 * @param {Object} options - Repair options
 * @returns {Promise<Object>} - Repair results
 */
export async function repairBlobs(hashes, options = {}) {
  const results = {
    verified: [],
    repaired: [],
    failed: [],
    skipped: []
  };
  
  // If no hashes provided, check all blobs
  if (!hashes) {
    const blobs = await listBlobs();
    hashes = blobs.map(b => b.hash);
  }
  
  // Process each hash with concurrency limit
  const concurrentLimit = pLimit(options.concurrency || 2);
  
  const repairPromises = hashes.map(hash => 
    concurrentLimit(async () => {
      try {
        // Check if blob exists in both locations
        const existsLocally = await blobExistsLocally(hash);
        const existsInWalrus = await blobExistsInWalrus(hash);
        
        if (!existsLocally && !existsInWalrus) {
          results.skipped.push({
            hash,
            reason: 'does not exist in any location'
          });
          return;
        }
        
        if (!existsLocally && existsInWalrus) {
          // Only in Walrus, retrieve and store locally if requested
          if (options.syncMissing) {
            const blobData = await getWalrusBlob(hash, { raw: true });
            await storeLocalBlob(hash, blobData);
            results.repaired.push({
              hash,
              action: 'restored from Walrus'
            });
          } else {
            results.skipped.push({
              hash,
              reason: 'only in Walrus'
            });
          }
          return;
        }
        
        if (existsLocally && !existsInWalrus) {
          // Only in local, upload to Walrus if requested
          if (options.syncMissing) {
            const repoPath = process.cwd();
            const subdir = hash.substring(0, 2);
            const filename = hash.substring(2);
            const objectPath = path.join(repoPath, '.git', 'objects', subdir, filename);
            
            // Store to Walrus
            await storeWalrusLargeBlob(hash, objectPath);
            results.repaired.push({
              hash,
              action: 'uploaded to Walrus'
            });
          } else {
            results.skipped.push({
              hash,
              reason: 'only in local'
            });
          }
          return;
        }
        
        // Exists in both locations, verify integrity
        let localIntegrity = true;
        let walrusIntegrity = true;
        
        // Get local content
        let localContent;
        try {
          localContent = await getLocalBlob(hash, { raw: true });
          const localVerify = await verifyBlob(hash, 
            await inflate(localContent).then(data => {
              const nullIndex = data.indexOf(0);
              if (nullIndex !== -1) {
                return data.subarray(nullIndex + 1);
              }
              return data;
            })
          );
          localIntegrity = localVerify.verified;
        } catch (error) {
          localIntegrity = false;
        }
        
        // Get Walrus content
        let walrusContent;
        try {
          walrusContent = await getWalrusBlob(hash, { raw: true });
          const walrusVerify = await verifyBlob(hash, 
            await inflate(walrusContent).then(data => {
              const nullIndex = data.indexOf(0);
              if (nullIndex !== -1) {
                return data.subarray(nullIndex + 1);
              }
              return data;
            })
          );
          walrusIntegrity = walrusVerify.verified;
        } catch (error) {
          walrusIntegrity = false;
        }
        
        // Both have integrity, compare them
        if (localIntegrity && walrusIntegrity) {
          if (localContent.equals(walrusContent)) {
            results.verified.push({
              hash,
              status: 'both locations verified'
            });
          } else {
            // Content is different but both verify against hash
            // This should be rare but possible with hash collisions
            results.verified.push({
              hash,
              status: 'both locations verified but content differs'
            });
          }
          return;
        }
        
        // Repair from the good copy if one exists
        if (localIntegrity && !walrusIntegrity) {
          // Local copy is good, repair Walrus
          if (options.repair !== false) {
            const repoPath = process.cwd();
            const subdir = hash.substring(0, 2);
            const filename = hash.substring(2);
            const objectPath = path.join(repoPath, '.git', 'objects', subdir, filename);
            
            // Store to Walrus
            await storeWalrusLargeBlob(hash, objectPath);
            results.repaired.push({
              hash,
              action: 'repaired Walrus from local'
            });
          } else {
            results.failed.push({
              hash,
              error: 'Walrus copy corrupted but repair disabled'
            });
          }
          return;
        }
        
        if (!localIntegrity && walrusIntegrity) {
          // Walrus copy is good, repair local
          if (options.repair !== false) {
            // Store locally
            await storeLocalBlob(hash, walrusContent);
            results.repaired.push({
              hash,
              action: 'repaired local from Walrus'
            });
          } else {
            results.failed.push({
              hash,
              error: 'Local copy corrupted but repair disabled'
            });
          }
          return;
        }
        
        // Both are corrupt, can't repair
        results.failed.push({
          hash,
          error: 'Both local and Walrus copies corrupted'
        });
      } catch (error) {
        results.failed.push({
          hash,
          error: error.message
        });
      }
    })
  );
  
  await Promise.all(repairPromises);
  
  return results;
}

/**
 * Optimizes blob storage by deduplicating, recompressing, and cleaning up
 * @param {Object} options - Optimization options
 * @returns {Promise<Object>} - Optimization results
 */
export async function optimizeBlobStorage(options = {}) {
  const results = {
    deduplicated: [],
    recompressed: [],
    cleaned: [],
    failed: [],
    savings: {
      size: 0,
      count: 0
    }
  };

  // Use failure tracking for the overall operation
  try {
    return await resilience.withFailureTracking(
      async () => {
        // Step 1: Find duplicate content with same hash but stored in multiple places
        if (options.deduplicate !== false) {
          const blobs = await listBlobs();
          const hashCounts = {};

          // Count occurrences of each hash
          for (const blob of blobs) {
            hashCounts[blob.hash] = (hashCounts[blob.hash] || 0) + 1;
          }

          // Find duplicates (hashes with multiple blobs)
          const duplicateHashes = Object.entries(hashCounts)
            .filter(([hash, count]) => count > 1)
            .map(([hash]) => hash);

          // Process each duplicate with resilient batch processing
          if (duplicateHashes.length > 0) {
            // Create deduplication operations
            const dedupeOperations = duplicateHashes.map(hash => async () => {
              // Get blob existence in both locations
              const localExists = await blobExistsLocally(hash);
              const walrusExists = await blobExistsInWalrus(hash);

              // Already optimally stored
              if ((localExists && walrusExists) ||
                  (localExists && !options.useWalrus) ||
                  (walrusExists && !options.useLocal)) {
                return { hash, action: 'already-optimized' };
              }

              // Determine action needed
              if (options.useWalrus && !walrusExists && localExists) {
                // Migrate local to Walrus
                await migrateBlobs('local-to-walrus', [hash], {
                  skipExisting: true,
                  continueOnError: true
                });
                return { hash, action: 'ensured-walrus-copy' };
              }

              if (options.useLocal && !localExists && walrusExists) {
                // Migrate Walrus to local
                await migrateBlobs('walrus-to-local', [hash], {
                  skipExisting: true,
                  continueOnError: true
                });
                return { hash, action: 'ensured-local-copy' };
              }

              return { hash, action: 'no-action-needed' };
            });

            // Process deduplication operations with resilience
            const dedupeResults = await resilience.processBatchResilient(
              dedupeOperations,
              op => op(),
              {
                operation: 'optimize-deduplicate',
                component: 'blob-manager',
                batchType: 'deduplication',
                concurrency: options.concurrency || 3,
                retryCount: 2,
                continueOnError: true,
                metadata: {
                  hashCount: duplicateHashes.length
                },
                onProgress: options.onProgress
              }
            );

            // Process results
            dedupeResults.successful.forEach(result => {
              if (result.result.action === 'ensured-walrus-copy' ||
                  result.result.action === 'ensured-local-copy') {
                results.deduplicated.push({
                  hash: result.result.hash,
                  action: result.result.action
                });
              }
            });

            // Process failures
            dedupeResults.failed.forEach(failure => {
              results.failed.push({
                hash: failure.error.hash || 'unknown',
                operation: 'deduplication',
                error: failure.error.message
              });
            });
          }
        }

        // Step 2: Optimize compression if requested
        if (options.recompress) {
          try {
            // Get all blobs with compression ratio < 1.5 (poor compression)
            const blobs = await listBlobs();
            const poorlyCompressedBlobs = blobs.filter(blob => {
              const ratio = parseFloat(blob.compressionRatio);
              return !isNaN(ratio) && ratio < 1.5;
            });

            // Create recompression operations
            const recompressOperations = poorlyCompressedBlobs.map(blob => async () => {
              // Get uncompressed content
              const content = await getBlob(blob.hash, {
                contentOnly: true,
                verify: true
              });

              // Skip small blobs
              if (content.length < 1024) {
                return {
                  hash: blob.hash,
                  action: 'skipped-small'
                };
              }

              // Skip already compressed formats if detected
              const contentType = blob.contentType || guessContentType(content);
              if (contentType.includes('image/') ||
                  contentType.includes('audio/') ||
                  contentType.includes('video/') ||
                  contentType.includes('zip') ||
                  contentType.includes('gzip') ||
                  contentType.includes('compressed')) {
                return {
                  hash: blob.hash,
                  action: 'skipped-compressed-format'
                };
              }

              // Compress with best compression
              const header = Buffer.from(`blob ${content.length}\0`);
              const blobData = Buffer.concat([header, content]);

              // Use best compression
              const compressedData = await promisify(zlib.deflate)(
                blobData,
                { level: COMPRESSION_LEVELS.BEST }
              );

              // Check if new compression is better
              if (compressedData.length < blob.compressedSize) {
                // New version is smaller, update storage
                if (blob.location === 'local' || options.useLocal) {
                  const repoPath = process.cwd();
                  const subdir = blob.hash.substring(0, 2);
                  const filename = blob.hash.substring(2);
                  const objectPath = path.join(repoPath, '.git', 'objects', subdir, filename);

                  // Create the subdirectory if it doesn't exist
                  await fs.mkdir(path.join(repoPath, '.git', 'objects', subdir), { recursive: true });

                  // Write the compressed data to the object file
                  await fs.writeFile(objectPath, compressedData);
                }

                if (blob.location === 'walrus' || options.useWalrus) {
                  // Store in Walrus with better compression using resilient operation
                  await resilience.executeWalrusOperation(
                    () => storeWalrusBlob(blob.hash, compressedData, {
                      size: blob.size,
                      contentType: blob.contentType
                    }),
                    {
                      operation: 'optimize-recompress',
                      component: 'walrus-storage',
                      hash: blob.hash,
                      size: compressedData.length,
                      metadata: {
                        originalSize: blob.compressedSize,
                        saveBytes: blob.compressedSize - compressedData.length
                      }
                    }
                  );
                }

                // Calculate savings
                const savedBytes = blob.compressedSize - compressedData.length;

                return {
                  hash: blob.hash,
                  action: 'recompressed',
                  oldSize: blob.compressedSize,
                  newSize: compressedData.length,
                  saved: savedBytes,
                  improvement: ((savedBytes / blob.compressedSize) * 100).toFixed(1)
                };
              }

              return { hash: blob.hash, action: 'no-improvement' };
            });

            // Process recompression operations with resilience
            if (recompressOperations.length > 0) {
              const recompressResults = await resilience.processBatchResilient(
                recompressOperations,
                op => op(),
                {
                  operation: 'optimize-recompress',
                  component: 'blob-manager',
                  batchType: 'recompression',
                  concurrency: options.concurrency || 2, // Lower concurrency for CPU-intensive operations
                  retryCount: 1, // Fewer retries for compression operations
                  continueOnError: true,
                  metadata: {
                    blobCount: recompressOperations.length
                  },
                  onProgress: options.onProgress
                }
              );

              // Process results
              recompressResults.successful.forEach(result => {
                if (result.result.action === 'recompressed') {
                  results.recompressed.push({
                    hash: result.result.hash,
                    oldSize: result.result.oldSize,
                    newSize: result.result.newSize,
                    saved: result.result.saved,
                    improvement: `${result.result.improvement}%`
                  });

                  // Update total savings
                  results.savings.size += result.result.saved;
                  results.savings.count++;
                }
              });

              // Process failures
              recompressResults.failed.forEach(failure => {
                results.failed.push({
                  hash: failure.error.hash || 'unknown',
                  operation: 'recompression',
                  error: failure.error.message
                });
              });
            }
          } catch (error) {
            console.error('Error during recompression optimization:', error);
            results.failed.push({
              hash: 'recompression-batch',
              operation: 'recompression',
              error: error.message
            });
          }
        }

        // Step 3: Clean up as requested
        if (options.clean) {
          try {
            // Implement cleanup logic based on options
            // This could include removing temporary files, orphaned blobs, etc.

            // Clean metadata cache to save memory
            if (options.cleanCache) {
              // Use memory-specific operations that don't need resilience
              if (metadataCache && metadataCache.clear) {
                const previousSize = metadataCache.size;
                await metadataCache.clear();
                results.cleaned.push({
                  type: 'metadata-cache',
                  count: previousSize
                });
              }

              if (contentCache && contentCache.clear) {
                const previousContentSize = contentCache.size;
                await contentCache.clear();
                results.cleaned.push({
                  type: 'content-cache',
                  count: previousContentSize
                });
              }
            }
          } catch (error) {
            console.error('Error during cleanup:', error);
            results.failed.push({
              hash: 'cache-cleanup',
              operation: 'cleanup',
              error: error.message
            });
          }
        }

        // Return optimization results
        return {
          ...results,
          savings: {
            ...results.savings,
            formattedSize: formatBytes(results.savings.size)
          }
        };
      },
      // Track this high-level operation with detailed context
      {
        operation: 'optimize-blob-storage',
        component: 'blob-manager',
        severity: 'info',
        metadata: {
          options: JSON.stringify(options),
          timestamp: new Date().toISOString()
        }
      }
    );
  } catch (error) {
    console.error('Optimization failed:', error);

    // Return partial results with error
    return {
      ...results,
      error: error.message,
      savings: {
        ...results.savings,
        formattedSize: formatBytes(results.savings.size)
      }
    };
  }
}

export default {
  createBlob,
  getBlob,
  blobExists,
  blobExistsLocally,
  blobExistsInWalrus,
  calculateFileHash,
  createBlobFromFile,
  verifyBlob,
  findDuplicateBlobs,
  listBlobs,
  migrateBlobs,
  getBlobStorageStats,
  repairBlobs,
  optimizeBlobStorage,

  // Enhanced cache management
  clearCache: async () => {
    try {
      if (metadataCache && metadataCache.clear) {
        await metadataCache.clear();
      }
      if (contentCache && contentCache.clear) {
        await contentCache.clear();
      }
      console.log('Blob caches cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing caches:', error);
      return false;
    }
  },

  getCacheStats: async () => {
    try {
      const stats = {
        timestamp: Date.now(),
        metadata: {},
        content: {}
      };

      // Get metadata cache stats
      if (metadataCache && metadataCache.getStats) {
        stats.metadata = await metadataCache.getStats();
      } else {
        stats.metadata = { error: 'Metadata cache not initialized' };
      }

      // Get content cache stats
      if (contentCache && contentCache.getStats) {
        stats.content = await contentCache.getStats();
      } else {
        stats.content = { error: 'Content cache not initialized' };
      }

      // Add combined stats
      stats.combined = {
        hitRate: stats.metadata.hitRates?.overall || 0,
        prefetchSuccessRate: stats.content.prefetching?.successRate || 0,
        errors: (stats.metadata.metrics?.errors?.total || 0) +
                (stats.content.metrics?.errors?.total || 0)
      };

      return stats;
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { error: error.message };
    }
  },

  // Cache control functions
  optimizeCache: async () => {
    try {
      // Run cache optimizations
      if (contentCache) {
        const contentStats = await contentCache.getStats();

        // If cache is over 80% full, run pruning
        if (contentStats.memory?.utilizationPercent > 80) {
          await contentCache.prune({
            minAccessCount: 2,  // Remove items accessed less than twice
            maxAge: 24 * 60 * 60 * 1000 // Keep items newer than 1 day
          });
        }
      }

      if (metadataCache) {
        const metadataStats = await metadataCache.getStats();

        // If cache is over 80% full, run pruning
        if (metadataStats.memory?.utilizationPercent > 80) {
          await metadataCache.prune({
            minAccessCount: 1  // Remove items never accessed
          });
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error optimizing caches:', error);
      return { success: false, error: error.message };
    }
  },

  // Cache reporting
  reportCacheMetrics: async () => {
    try {
      if (contentCache && contentCache.reportMetrics) {
        await contentCache.reportMetrics();
      }
      if (metadataCache && metadataCache.reportMetrics) {
        await metadataCache.reportMetrics();
      }
      return true;
    } catch (error) {
      console.error('Error reporting cache metrics:', error);
      return false;
    }
  },

  // Direct access to cache instances (for advanced use)
  getMetadataCache: () => metadataCache,
  getContentCache: () => contentCache
};