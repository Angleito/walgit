/**
 * @fileoverview Walrus Storage Integration
 * 
 * This module provides functionality for interacting with Walrus decentralized storage,
 * particularly for downloading content, verifying it, and implementing caching strategies.
 */

// Import required dependencies
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import { createClient } from '@walrus-labs/client';

// Cache configuration
const CACHE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.walgit', 'cache');
const CACHE_MAX_AGE = 3600000; // 1 hour in milliseconds
const CACHE_MAX_SIZE = 100 * 1024 * 1024; // 100MB

// In-memory cache for extremely frequent access (short-lived)
const memoryCache = new Map();
const memoryCacheTimestamps = new Map();
const MEMORY_CACHE_MAX_SIZE = 20; // Maximum number of items in memory cache
const MEMORY_CACHE_MAX_AGE = 300000; // 5 minutes in milliseconds

/**
 * Initialize the cache directory
 * @returns {Promise<void>}
 */
export async function initializeCache() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to initialize cache directory:', error.message);
  }
}

/**
 * Creates a Walrus client instance
 * @param {Object} config - Configuration for the Walrus client
 * @returns {Object} - Walrus client instance
 */
export function createWalrusClient(config = {}) {
  try {
    return createClient({
      // Default configuration that can be overridden
      endpoint: config.endpoint || process.env.WALRUS_ENDPOINT || 'https://api.walrus.storage',
      ...config
    });
  } catch (error) {
    console.error('Failed to create Walrus client:', error.message);
    throw new Error('Walrus client initialization failed');
  }
}

/**
 * Generates a cache key for a blob ID
 * @param {string} blobId - The Walrus blob ID
 * @returns {string} - The cache key (SHA-256 hash of the blob ID)
 */
function getCacheKey(blobId) {
  return crypto.createHash('sha256').update(blobId).digest('hex');
}

/**
 * Gets the path to a cached file
 * @param {string} blobId - The Walrus blob ID
 * @returns {string} - The path to the cached file
 */
function getCachePath(blobId) {
  const cacheKey = getCacheKey(blobId);
  return path.join(CACHE_DIR, cacheKey);
}

/**
 * Checks if content is cached and not expired
 * @param {string} blobId - The Walrus blob ID
 * @returns {Promise<boolean>} - Whether the content is cached and valid
 */
async function isValidCache(blobId) {
  try {
    const cachePath = getCachePath(blobId);
    const stats = await fs.stat(cachePath);
    const age = Date.now() - stats.mtimeMs;
    return age < CACHE_MAX_AGE;
  } catch (error) {
    return false; // If file doesn't exist or can't be accessed
  }
}

/**
 * Cleans up old cache entries when the cache exceeds size limits
 * @returns {Promise<void>}
 */
async function cleanupCache() {
  try {
    const files = await fs.readdir(CACHE_DIR);
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(CACHE_DIR, file);
        const stats = await fs.stat(filePath);
        return { path: filePath, stats };
      })
    );
    
    // Sort by oldest access time
    fileStats.sort((a, b) => a.stats.atimeMs - b.stats.atimeMs);
    
    // Calculate total size
    let totalSize = fileStats.reduce((sum, file) => sum + file.stats.size, 0);
    
    // Remove oldest files until under the limit
    for (const file of fileStats) {
      if (totalSize <= CACHE_MAX_SIZE) break;
      
      await fs.unlink(file.path);
      totalSize -= file.stats.size;
    }
  } catch (error) {
    console.error('Cache cleanup failed:', error.message);
  }
}

/**
 * Manages the in-memory cache, removing oldest or expired entries
 */
function cleanupMemoryCache() {
  // Remove expired items
  const now = Date.now();
  for (const [key, timestamp] of memoryCacheTimestamps.entries()) {
    if (now - timestamp > MEMORY_CACHE_MAX_AGE) {
      memoryCache.delete(key);
      memoryCacheTimestamps.delete(key);
    }
  }
  
  // If still over size, remove oldest
  if (memoryCache.size > MEMORY_CACHE_MAX_SIZE) {
    const oldestKey = Array.from(memoryCacheTimestamps.entries())
      .sort((a, b) => a[1] - b[1])[0][0];
      
    memoryCache.delete(oldestKey);
    memoryCacheTimestamps.delete(oldestKey);
  }
}

/**
 * Calculates checksum for content verification
 * @param {Buffer} data - The data to calculate checksum for
 * @returns {string} - SHA-256 checksum of the data
 */
function calculateChecksum(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Verifies the integrity of downloaded content
 * @param {Buffer} data - The downloaded content
 * @param {string} expectedChecksum - The expected checksum (if available)
 * @returns {boolean} - Whether the content is valid
 */
function verifyContent(data, expectedChecksum) {
  if (!expectedChecksum) return true;
  const actualChecksum = calculateChecksum(data);
  return actualChecksum === expectedChecksum;
}

/**
 * Downloads content from Walrus storage
 * @param {string} blobId - The Walrus blob ID
 * @param {Object} options - Download options
 * @param {boolean} options.useCache - Whether to use the cache (default: true)
 * @param {string} options.expectedChecksum - Expected checksum for verification (optional)
 * @param {boolean} options.forceRefresh - Force download even if cached (default: false)
 * @returns {Promise<Buffer>} - The downloaded content as a Buffer
 */
export async function downloadContent(blobId, options = {}) {
  const {
    useCache = true,
    expectedChecksum = null,
    forceRefresh = false,
    client = null
  } = options;
  
  if (!blobId) {
    throw new Error('Blob ID is required');
  }
  
  // Initialize cache if needed
  await initializeCache();
  
  // 1. Check memory cache first (fastest)
  if (useCache && !forceRefresh && memoryCache.has(blobId)) {
    const cacheTimestamp = memoryCacheTimestamps.get(blobId);
    if (Date.now() - cacheTimestamp < MEMORY_CACHE_MAX_AGE) {
      const cachedData = memoryCache.get(blobId);
      // Still verify the content if checksum provided
      if (!expectedChecksum || verifyContent(cachedData, expectedChecksum)) {
        // Update access timestamp
        memoryCacheTimestamps.set(blobId, Date.now());
        return cachedData;
      }
    }
  }
  
  // 2. Check disk cache
  const cachePath = getCachePath(blobId);
  if (useCache && !forceRefresh && await isValidCache(blobId)) {
    try {
      const cachedData = await fs.readFile(cachePath);
      if (!expectedChecksum || verifyContent(cachedData, expectedChecksum)) {
        // Update file access time
        const now = new Date();
        await fs.utimes(cachePath, now, now);
        
        // Also update memory cache
        memoryCache.set(blobId, cachedData);
        memoryCacheTimestamps.set(blobId, Date.now());
        cleanupMemoryCache();
        
        return cachedData;
      }
    } catch (error) {
      // If reading from cache fails, proceed to download
      console.warn(`Cache retrieval failed for ${blobId}:`, error.message);
    }
  }
  
  // 3. Download from Walrus
  try {
    // Create client if not provided
    const walrusClient = client || createWalrusClient();
    
    // Download content
    const response = await walrusClient.downloadBlob(blobId);
    
    if (!response || !response.ok) {
      throw new Error(`Failed to download blob: ${response?.status} ${response?.statusText}`);
    }
    
    // Convert to buffer
    const arrayBuffer = await response.arrayBuffer();
    const data = Buffer.from(arrayBuffer);
    
    // Verify downloaded content if checksum provided
    if (expectedChecksum && !verifyContent(data, expectedChecksum)) {
      throw new Error('Content verification failed: checksum mismatch');
    }
    
    // Store in cache if caching is enabled
    if (useCache) {
      try {
        await fs.writeFile(cachePath, data);
        
        // Add to memory cache too
        memoryCache.set(blobId, data);
        memoryCacheTimestamps.set(blobId, Date.now());
        cleanupMemoryCache();
        
        // Periodically clean up cache to prevent it from growing too large
        cleanupCache().catch(err => console.error('Cache cleanup error:', err));
      } catch (cacheError) {
        console.error('Failed to cache content:', cacheError.message);
      }
    }
    
    return data;
  } catch (error) {
    throw new Error(`Failed to download content from Walrus: ${error.message}`);
  }
}

/**
 * Batch downloads multiple contents from Walrus storage
 * @param {string[]} blobIds - Array of Walrus blob IDs
 * @param {Object} options - Download options (same as downloadContent)
 * @returns {Promise<Map<string, Buffer>>} - Map of blob IDs to content buffers
 */
export async function batchDownloadContent(blobIds, options = {}) {
  if (!Array.isArray(blobIds) || blobIds.length === 0) {
    throw new Error('blobIds must be a non-empty array');
  }
  
  // Create a shared client for all downloads
  const client = options.client || createWalrusClient();
  const downloadOptions = { ...options, client };
  
  try {
    // Download all contents in parallel
    const results = await Promise.allSettled(
      blobIds.map(blobId => downloadContent(blobId, downloadOptions))
    );
    
    // Process results
    const contentMap = new Map();
    results.forEach((result, index) => {
      const blobId = blobIds[index];
      if (result.status === 'fulfilled') {
        contentMap.set(blobId, result.value);
      } else {
        console.error(`Failed to download ${blobId}:`, result.reason);
        contentMap.set(blobId, null); // Indicate failure
      }
    });
    
    return contentMap;
  } catch (error) {
    throw new Error(`Batch download failed: ${error.message}`);
  }
}

/**
 * Prefetches content into cache for future use
 * @param {string[]} blobIds - Array of blob IDs to prefetch
 * @returns {Promise<void>}
 */
export async function prefetchContent(blobIds) {
  if (!Array.isArray(blobIds) || blobIds.length === 0) return;
  
  try {
    const client = createWalrusClient();
    // Use low priority, non-blocking downloads
    blobIds.forEach(blobId => {
      downloadContent(blobId, { 
        client,
        useCache: true,
        forceRefresh: false
      }).catch(err => {
        console.debug(`Prefetch failed for ${blobId}:`, err.message);
      });
    });
  } catch (error) {
    console.error('Prefetch operation failed:', error.message);
  }
}

/**
 * Gets cache statistics
 * @returns {Promise<Object>} - Cache statistics
 */
export async function getCacheStats() {
  try {
    const files = await fs.readdir(CACHE_DIR);
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(CACHE_DIR, file);
        return await fs.stat(filePath);
      })
    );
    
    const totalSize = fileStats.reduce((sum, stats) => sum + stats.size, 0);
    const oldestTime = Math.min(...fileStats.map(stats => stats.mtimeMs));
    const newestTime = Math.max(...fileStats.map(stats => stats.mtimeMs));
    
    return {
      fileCount: files.length,
      totalSizeBytes: totalSize,
      oldestItemAge: Date.now() - oldestTime,
      newestItemAge: Date.now() - newestTime,
      memoryCacheSize: memoryCache.size
    };
  } catch (error) {
    console.error('Failed to get cache stats:', error.message);
    return {
      error: error.message,
      fileCount: 0,
      totalSizeBytes: 0
    };
  }
}

/**
 * Clears the cache entirely
 * @returns {Promise<void>}
 */
export async function clearCache() {
  try {
    const files = await fs.readdir(CACHE_DIR);
    await Promise.all(
      files.map(file => fs.unlink(path.join(CACHE_DIR, file)))
    );
    
    // Clear memory cache too
    memoryCache.clear();
    memoryCacheTimestamps.clear();
    
    console.log('Cache cleared successfully');
  } catch (error) {
    console.error('Failed to clear cache:', error.message);
    throw new Error(`Cache clearing failed: ${error.message}`);
  }
}

// Initialize cache on module import
initializeCache().catch(console.error);