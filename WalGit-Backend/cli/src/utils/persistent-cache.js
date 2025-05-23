/**
 * @fileoverview Persistent Cache Manager for WalGit
 * 
 * This module provides a robust cross-session caching mechanism using IndexedDB
 * as a backend storage system. It extends the existing in-memory caching system
 * with persistent storage to improve performance across sessions, reduce network
 * requests, and optimize Walrus integration.
 * 
 * Key features:
 * - IndexedDB-based persistent storage that survives across sessions
 * - Size-based eviction for cache management
 * - Support for metadata including access patterns
 * - Configurable retention policies
 * - Error recovery mechanisms
 * - Performance optimization
 */

import { indexedDB, IDBKeyRange } from 'fake-indexeddb';
import { LRUCache } from 'lru-cache';
import { getConfig } from './config.js';
import { formatBytes } from './format-utils.js';

/**
 * PersistentCache class for cross-session storage using IndexedDB
 * Implements an LRU (Least Recently Used) eviction policy with size constraints
 */
export class PersistentCache {
  /**
   * Creates a new persistent cache instance
   * @param {Object} options - Configuration options
   * @param {string} [options.dbName='walgit-cache'] - Name of the IndexedDB database
   * @param {string} [options.storeName='blobs'] - Name of the object store
   * @param {number} [options.maxSize=500*1024*1024] - Maximum cache size in bytes (default: 500MB)
   * @param {number} [options.maxAge=7*24*60*60*1000] - Maximum age of cache entries in ms (default: 7 days)
   * @param {boolean} [options.updateAgeOnGet=true] - Whether to update entry age on access
   */
  constructor(options = {}) {
    this.dbName = options.dbName || 'walgit-cache';
    this.storeName = options.storeName || 'blobs';
    this.maxSize = options.maxSize || 500 * 1024 * 1024; // 500MB
    this.maxAge = options.maxAge || 7 * 24 * 60 * 60 * 1000; // 7 days
    this.updateAgeOnGet = options.updateAgeOnGet !== false;
    
    // Memory cache for frequently accessed items
    this.memoryCache = new LRUCache({
      max: 100, // Number of entries to keep in memory
      ttl: 30 * 60 * 1000, // 30 minutes
      updateAgeOnGet: true
    });
    
    this.db = null;
    this.currentSize = 0;
    this.initialized = false;
    this.pendingOperations = [];
    
    // Performance metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      writes: 0,
      evictions: 0,
      errors: 0,
      startTime: Date.now()
    };
  }

  /**
   * Initializes the IndexedDB database and object store
   * @returns {Promise<void>}
   */
  async init() {
    if (this.initialized) return;
    
    try {
      return new Promise((resolve, reject) => {
        // Open database connection
        const request = indexedDB.open(this.dbName, 1);
        
        // Handle database upgrade (first time use or version change)
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          
          // Create object store with indexes
          if (!db.objectStoreNames.contains(this.storeName)) {
            const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
            
            // Create indexes for efficient access
            store.createIndex('accessTime', 'accessTime', { unique: false });
            store.createIndex('creationTime', 'creationTime', { unique: false });
            store.createIndex('size', 'size', { unique: false });
            store.createIndex('type', 'metadata.type', { unique: false });
            store.createIndex('accessCount', 'accessCount', { unique: false });
          }
        };
        
        // Success handler
        request.onsuccess = (event) => {
          this.db = event.target.result;
          this.initialized = true;
          
          // Calculate current cache size
          this._calculateCurrentSize().then(() => {
            // Process any pending operations
            while (this.pendingOperations.length > 0) {
              const operation = this.pendingOperations.shift();
              operation();
            }
            
            resolve();
          });
        };
        
        // Error handler
        request.onerror = (event) => {
          this.metrics.errors++;
          const error = new Error(`Failed to initialize cache database: ${event.target.error}`);
          reject(error);
        };
      });
    } catch (error) {
      this.metrics.errors++;
      console.error(`Error initializing cache: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculates the current total size of all cached items
   * @returns {Promise<number>} The total size in bytes
   * @private
   */
  async _calculateCurrentSize() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.openCursor();
      
      let totalSize = 0;
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          totalSize += cursor.value.size || 0;
          cursor.continue();
        } else {
          this.currentSize = totalSize;
          resolve(totalSize);
        }
      };
      
      request.onerror = (event) => {
        this.metrics.errors++;
        reject(new Error(`Failed to calculate cache size: ${event.target.error}`));
      };
    });
  }

  /**
   * Retrieves an item from the cache
   * @param {string} key - The unique key for the item
   * @returns {Promise<any>} The cached value, or null if not found
   */
  async get(key) {
    // Ensure initialization
    if (!this.initialized) {
      return new Promise((resolve) => {
        this.pendingOperations.push(() => {
          this.get(key).then(resolve);
        });
      });
    }
    
    // Check memory cache first for better performance
    if (this.memoryCache.has(key)) {
      this.metrics.hits++;
      return this.memoryCache.get(key);
    }
    
    try {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);
        
        request.onsuccess = (event) => {
          const result = event.target.result;
          
          if (result) {
            // Item found in cache
            this.metrics.hits++;
            
            // Update access metadata if configured
            if (this.updateAgeOnGet) {
              const updatedItem = {
                ...result,
                accessTime: Date.now(),
                accessCount: (result.accessCount || 0) + 1,
              };
              
              // Update the item with new access time
              store.put(updatedItem);
              
              // Add to memory cache for faster subsequent access
              this.memoryCache.set(key, updatedItem.value);
              
              resolve(updatedItem.value);
            } else {
              // Add to memory cache
              this.memoryCache.set(key, result.value);
              
              resolve(result.value);
            }
          } else {
            // Item not found
            this.metrics.misses++;
            resolve(null);
          }
        };
        
        request.onerror = (event) => {
          this.metrics.errors++;
          reject(new Error(`Failed to get item from cache: ${event.target.error}`));
        };
      });
    } catch (error) {
      this.metrics.errors++;
      console.error(`Error retrieving from cache: ${error.message}`);
      return null;
    }
  }

  /**
   * Stores an item in the cache
   * @param {string} key - The unique key for the item
   * @param {any} value - The value to cache
   * @param {Object} [metadata={}] - Additional metadata for the cached item
   * @returns {Promise<void>}
   */
  async set(key, value, metadata = {}) {
    // Ensure initialization
    if (!this.initialized) {
      return new Promise((resolve) => {
        this.pendingOperations.push(() => {
          this.set(key, value, metadata).then(resolve);
        });
      });
    }
    
    try {
      // Calculate item size (approximate for non-buffer values)
      let size = 0;
      
      if (Buffer.isBuffer(value)) {
        size = value.length;
      } else if (typeof value === 'string') {
        size = value.length * 2; // Rough estimate for string size in bytes
      } else {
        const serialized = JSON.stringify(value);
        size = serialized.length * 2;
      }
      
      // Reject if a single item is larger than max cache size
      if (size > this.maxSize) {
        console.warn(`Item size (${formatBytes(size)}) exceeds cache max size (${formatBytes(this.maxSize)})`);
        return false;
      }
      
      // Add to memory cache for faster access
      this.memoryCache.set(key, value);
      
      // Check if we need to evict items before storing this one
      if (this.currentSize + size > this.maxSize) {
        await this._evictItems(size);
      }
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        // Check if item already exists to update its size correctly
        const getRequest = store.get(key);
        
        getRequest.onsuccess = (event) => {
          const existingItem = event.target.result;
          
          // Calculate size difference for existing items
          const sizeDiff = existingItem ? size - existingItem.size : size;
          
          // Create cache item with metadata
          const now = Date.now();
          const cacheItem = {
            key,
            value,
            size,
            metadata: {
              ...metadata,
              type: metadata.type || _guessValueType(value)
            },
            creationTime: existingItem ? existingItem.creationTime : now,
            accessTime: now,
            updateTime: now,
            accessCount: existingItem ? existingItem.accessCount + 1 : 1
          };
          
          // Store the item
          const putRequest = store.put(cacheItem);
          
          putRequest.onsuccess = () => {
            // Update current cache size
            this.currentSize += sizeDiff;
            this.metrics.writes++;
            resolve();
          };
          
          putRequest.onerror = (event) => {
            this.metrics.errors++;
            reject(new Error(`Failed to store item in cache: ${event.target.error}`));
          };
        };
        
        getRequest.onerror = (event) => {
          this.metrics.errors++;
          reject(new Error(`Failed to check existing item: ${event.target.error}`));
        };
      });
    } catch (error) {
      this.metrics.errors++;
      console.error(`Error storing in cache: ${error.message}`);
      return false;
    }
  }

  /**
   * Evicts items from the cache to make room for new entries
   * Uses LRU (Least Recently Used) policy
   * @param {number} sizeNeeded - Amount of space needed in bytes
   * @returns {Promise<number>} Number of items evicted
   * @private
   */
  async _evictItems(sizeNeeded) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('accessTime');
      
      // Get oldest accessed items first (LRU policy)
      const request = index.openCursor();
      
      let evictedCount = 0;
      let freedSpace = 0;
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        
        if (cursor && (this.currentSize + sizeNeeded - freedSpace > this.maxSize)) {
          // This item can be evicted
          const itemSize = cursor.value.size || 0;
          
          // Delete the item
          const deleteRequest = cursor.delete();
          
          deleteRequest.onsuccess = () => {
            // Update freed space and eviction count
            freedSpace += itemSize;
            evictedCount++;
            
            // Continue to next item if needed
            cursor.continue();
          };
          
          deleteRequest.onerror = (event) => {
            this.metrics.errors++;
            console.error(`Failed to evict item: ${event.target.error}`);
            cursor.continue();
          };
        } else {
          // Either no more items or we've freed enough space
          this.currentSize -= freedSpace;
          this.metrics.evictions += evictedCount;
          
          if (evictedCount > 0) {
            console.log(`Evicted ${evictedCount} items (${formatBytes(freedSpace)}) from cache`);
          }
          
          resolve(evictedCount);
        }
      };
      
      request.onerror = (event) => {
        this.metrics.errors++;
        reject(new Error(`Failed to evict items: ${event.target.error}`));
      };
    });
  }

  /**
   * Clears all items from the cache
   * @returns {Promise<void>}
   */
  async clear() {
    // Ensure initialization
    if (!this.initialized) {
      return new Promise((resolve) => {
        this.pendingOperations.push(() => {
          this.clear().then(resolve);
        });
      });
    }
    
    try {
      // Clear memory cache
      this.memoryCache.clear();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();
        
        request.onsuccess = () => {
          // Reset cache size counter
          this.currentSize = 0;
          resolve();
        };
        
        request.onerror = (event) => {
          this.metrics.errors++;
          reject(new Error(`Failed to clear cache: ${event.target.error}`));
        };
      });
    } catch (error) {
      this.metrics.errors++;
      console.error(`Error clearing cache: ${error.message}`);
      throw error;
    }
  }

  /**
   * Removes a specific item from the cache
   * @param {string} key - The key to remove
   * @returns {Promise<boolean>} True if item was removed, false otherwise
   */
  async remove(key) {
    // Ensure initialization
    if (!this.initialized) {
      return new Promise((resolve) => {
        this.pendingOperations.push(() => {
          this.remove(key).then(resolve);
        });
      });
    }
    
    try {
      // Remove from memory cache
      this.memoryCache.delete(key);
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        // First get the item to calculate size adjustment
        const getRequest = store.get(key);
        
        getRequest.onsuccess = (event) => {
          const item = event.target.result;
          
          if (!item) {
            // Item doesn't exist
            resolve(false);
            return;
          }
          
          // Delete the item
          const deleteRequest = store.delete(key);
          
          deleteRequest.onsuccess = () => {
            // Reduce current size counter
            this.currentSize -= (item.size || 0);
            resolve(true);
          };
          
          deleteRequest.onerror = (event) => {
            this.metrics.errors++;
            reject(new Error(`Failed to remove item: ${event.target.error}`));
          };
        };
        
        getRequest.onerror = (event) => {
          this.metrics.errors++;
          reject(new Error(`Failed to get item for removal: ${event.target.error}`));
        };
      });
    } catch (error) {
      this.metrics.errors++;
      console.error(`Error removing item from cache: ${error.message}`);
      return false;
    }
  }

  /**
   * Gets cache statistics and metrics
   * @returns {Promise<Object>} Cache statistics
   */
  async getStats() {
    // Ensure initialization
    if (!this.initialized) {
      return new Promise((resolve) => {
        this.pendingOperations.push(() => {
          this.getStats().then(resolve);
        });
      });
    }
    
    try {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const countRequest = store.count();
        
        countRequest.onsuccess = () => {
          const itemCount = countRequest.result;
          
          // Calculate hit rate
          const totalAccesses = this.metrics.hits + this.metrics.misses;
          const hitRate = totalAccesses > 0 ? (this.metrics.hits / totalAccesses) * 100 : 0;
          
          // Calculate uptime
          const uptime = Date.now() - this.metrics.startTime;
          
          resolve({
            itemCount,
            totalSize: this.currentSize,
            formattedSize: formatBytes(this.currentSize),
            maxSize: this.maxSize,
            formattedMaxSize: formatBytes(this.maxSize),
            utilizationPercent: this.maxSize > 0 ? (this.currentSize / this.maxSize) * 100 : 0,
            hitRate: hitRate.toFixed(2) + '%',
            metrics: {
              ...this.metrics,
              uptime
            },
            memoryCache: {
              size: this.memoryCache.size,
              maxSize: this.memoryCache.max
            }
          });
        };
        
        countRequest.onerror = (event) => {
          this.metrics.errors++;
          reject(new Error(`Failed to get cache stats: ${event.target.error}`));
        };
      });
    } catch (error) {
      this.metrics.errors++;
      console.error(`Error getting cache stats: ${error.message}`);
      
      // Return basic stats even if detailed ones failed
      return {
        error: error.message,
        metrics: this.metrics
      };
    }
  }

  /**
   * Prunes expired or unused items from the cache
   * @param {Object} options - Pruning options
   * @param {number} [options.maxAge] - Maximum age in ms before items are pruned
   * @param {number} [options.minAccessCount] - Minimum access count to keep items
   * @returns {Promise<number>} Number of items pruned
   */
  async prune(options = {}) {
    // Ensure initialization
    if (!this.initialized) {
      return new Promise((resolve) => {
        this.pendingOperations.push(() => {
          this.prune(options).then(resolve);
        });
      });
    }
    
    const maxAge = options.maxAge || this.maxAge;
    const minAccessCount = options.minAccessCount || 0;
    const now = Date.now();
    
    try {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.openCursor();
        
        let prunedCount = 0;
        let freedSpace = 0;
        
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          
          if (cursor) {
            const item = cursor.value;
            
            // Check pruning criteria
            const itemAge = now - item.creationTime;
            const shouldPrune = (
              itemAge > maxAge || 
              (minAccessCount > 0 && item.accessCount < minAccessCount)
            );
            
            if (shouldPrune) {
              // Delete the item
              const deleteRequest = cursor.delete();
              
              deleteRequest.onsuccess = () => {
                prunedCount++;
                freedSpace += (item.size || 0);
                cursor.continue();
              };
              
              deleteRequest.onerror = (event) => {
                this.metrics.errors++;
                console.error(`Failed to prune item: ${event.target.error}`);
                cursor.continue();
              };
            } else {
              cursor.continue();
            }
          } else {
            // Update current size counter
            this.currentSize -= freedSpace;
            
            if (prunedCount > 0) {
              console.log(`Pruned ${prunedCount} items (${formatBytes(freedSpace)}) from cache`);
            }
            
            resolve(prunedCount);
          }
        };
        
        request.onerror = (event) => {
          this.metrics.errors++;
          reject(new Error(`Failed to prune cache: ${event.target.error}`));
        };
      });
    } catch (error) {
      this.metrics.errors++;
      console.error(`Error pruning cache: ${error.message}`);
      return 0;
    }
  }
  
  /**
   * Closes the database connection
   * @returns {Promise<void>}
   */
  async close() {
    if (this.db) {
      this.db.close();
      this.initialized = false;
      this.db = null;
    }
  }
}

/**
 * Guesses the type of a value for metadata purposes
 * @param {any} value - The value to analyze
 * @returns {string} The detected type
 * @private
 */
function _guessValueType(value) {
  if (Buffer.isBuffer(value)) {
    return 'buffer';
  }
  
  if (typeof value === 'string') {
    // Check if it's JSON
    try {
      JSON.parse(value);
      return 'json';
    } catch (e) {
      return 'string';
    }
  }
  
  if (Array.isArray(value)) {
    return 'array';
  }
  
  if (value === null) {
    return 'null';
  }
  
  return typeof value;
}

/**
 * Creates a singleton persistent cache instance
 * @param {Object} options - Configuration options
 * @returns {Promise<PersistentCache>} The initialized cache
 */
export async function createPersistentCache(options = {}) {
  try {
    const config = await getConfig();
    const cacheOptions = {
      ...(config.cache || {}),
      ...options
    };
    
    const cache = new PersistentCache(cacheOptions);
    await cache.init();
    return cache;
  } catch (error) {
    console.error('Failed to create persistent cache:', error.message);
    throw error;
  }
}

/**
 * Default export with main cache instance and utility functions
 */
export default {
  PersistentCache,
  createPersistentCache,
  
  // Creates and initializes a persistent cache with default options
  create: async (options) => createPersistentCache(options),
  
  // Shorthand method to get a cache instance and retrieve a value
  get: async (key, options) => {
    const cache = await createPersistentCache(options);
    return cache.get(key);
  },
  
  // Shorthand method to get a cache instance and set a value
  set: async (key, value, metadata, options) => {
    const cache = await createPersistentCache(options);
    return cache.set(key, value, metadata);
  }
};