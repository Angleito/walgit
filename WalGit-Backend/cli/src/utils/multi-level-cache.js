import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { EventEmitter } from 'events';
import { LRUCache } from 'lru-cache';

/**
 * Comprehensive multi-level cache implementation with various storage backends
 * Supports memory, disk, IndexedDB (simulated), with compression, encryption,
 * and synchronization capabilities.
 */

// Utility: Create a hash for cache keys
const createKeyHash = (key) => {
  return crypto.createHash('sha256').update(key).digest('hex');
};

// Utility: Serialize/deserialize values
const serialize = (value) => {
  return JSON.stringify(value);
};

const deserialize = (value) => {
  return JSON.parse(value);
};

/**
 * Memory Cache Implementation
 */
class MemoryCache {
  constructor(options = {}) {
    const maxSize = options.maxSize || 100;
    this.cache = new LRUCache({ max: maxSize });
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };
  }

  async get(key) {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.stats.hits++;
      return deserialize(value);
    }
    this.stats.misses++;
    return null;
  }

  async set(key, value, ttl) {
    const serialized = serialize(value);
    this.cache.set(key, serialized);
    this.stats.sets++;
    
    if (ttl) {
      setTimeout(() => this.cache.delete(key), ttl);
    }
  }

  async has(key) {
    return this.cache.has(key);
  }

  async remove(key) {
    return this.cache.delete(key);
  }

  async clear() {
    this.cache.clear();
  }

  getStats() {
    return this.stats;
  }
}

/**
 * Disk Cache Implementation
 */
class DiskCache {
  constructor(options = {}) {
    this.cacheDir = options.cacheDir || path.join(process.cwd(), '.walgit', 'cache');
    this.maxSize = options.maxSize || 500 * 1024 * 1024; // 500MB default
    this.currentSize = 0;
    this.metadata = new Map();
    this.metadataFile = path.join(this.cacheDir, 'metadata.json');
    
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };
  }

  async init() {
    await fs.ensureDir(this.cacheDir);
    await this.loadMetadata();
    await this.calculateCurrentSize();
  }

  async loadMetadata() {
    try {
      if (await fs.pathExists(this.metadataFile)) {
        const data = await fs.readJson(this.metadataFile);
        this.metadata = new Map(Object.entries(data));
      }
    } catch (error) {
      console.warn('Failed to load cache metadata:', error.message);
    }
  }

  async saveMetadata() {
    try {
      const data = Object.fromEntries(this.metadata);
      await fs.writeJson(this.metadataFile, data, { spaces: 2 });
    } catch (error) {
      console.error('Failed to save cache metadata:', error.message);
    }
  }

  async calculateCurrentSize() {
    this.currentSize = 0;
    for (const [key, meta] of this.metadata.entries()) {
      this.currentSize += meta.size;
    }
  }

  getCachePath(key) {
    const hash = createKeyHash(key);
    const dir = hash.substring(0, 2);
    const file = hash.substring(2);
    return path.join(this.cacheDir, dir, file);
  }

  async get(key) {
    const meta = this.metadata.get(key);
    if (!meta) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (meta.expiry && Date.now() > meta.expiry) {
      await this.remove(key);
      this.stats.misses++;
      return null;
    }

    try {
      const cachePath = this.getCachePath(key);
      const data = await fs.readFile(cachePath, 'utf-8');
      
      // Update access time
      meta.lastAccess = Date.now();
      this.metadata.set(key, meta);
      
      this.stats.hits++;
      return deserialize(data);
    } catch (error) {
      this.stats.misses++;
      return null;
    }
  }

  async set(key, value, options = {}) {
    const serialized = serialize(value);
    const size = Buffer.byteLength(serialized);
    
    // Check if we need to evict entries to make space
    if (this.currentSize + size > this.maxSize) {
      await this.evictEntries(size);
    }

    const cachePath = this.getCachePath(key);
    await fs.ensureDir(path.dirname(cachePath));
    await fs.writeFile(cachePath, serialized);

    const meta = {
      size,
      created: Date.now(),
      lastAccess: Date.now(),
      expiry: options.ttl ? Date.now() + options.ttl : null
    };

    // Update size if replacing existing entry
    const oldMeta = this.metadata.get(key);
    if (oldMeta) {
      this.currentSize -= oldMeta.size;
    }

    this.metadata.set(key, meta);
    this.currentSize += size;
    this.stats.sets++;

    await this.saveMetadata();
  }

  async evictEntries(neededSize) {
    // LRU eviction
    const entries = Array.from(this.metadata.entries())
      .sort((a, b) => a[1].lastAccess - b[1].lastAccess);

    let freedSize = 0;
    for (const [key, meta] of entries) {
      if (freedSize >= neededSize) break;
      
      await this.remove(key);
      freedSize += meta.size;
      this.stats.evictions++;
    }
  }

  async has(key) {
    const meta = this.metadata.get(key);
    if (!meta) return false;
    
    // Check if expired
    if (meta.expiry && Date.now() > meta.expiry) {
      await this.remove(key);
      return false;
    }
    
    return true;
  }

  async remove(key) {
    const meta = this.metadata.get(key);
    if (!meta) return false;

    try {
      const cachePath = this.getCachePath(key);
      await fs.remove(cachePath);
      
      this.currentSize -= meta.size;
      this.metadata.delete(key);
      
      await this.saveMetadata();
      return true;
    } catch (error) {
      return false;
    }
  }

  async clear() {
    await fs.emptyDir(this.cacheDir);
    this.metadata.clear();
    this.currentSize = 0;
    await this.saveMetadata();
  }

  getStats() {
    return {
      ...this.stats,
      size: this.currentSize,
      entries: this.metadata.size
    };
  }
}

/**
 * IndexedDB Cache Implementation (simulated for Node.js)
 * In a browser environment, this would use actual IndexedDB
 */
class IndexedDBCache {
  constructor(options = {}) {
    this.dbName = options.dbName || 'walgit-cache';
    this.storeName = options.storeName || 'cache';
    this.version = options.version || 1;
    
    // Simulate IndexedDB with disk storage
    this.dbPath = path.join(process.cwd(), '.walgit', 'indexeddb', this.dbName);
    this.data = new Map();
    
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      removes: 0
    };
  }

  async init() {
    await fs.ensureDir(this.dbPath);
    await this.loadData();
  }

  async loadData() {
    try {
      const dataFile = path.join(this.dbPath, `${this.storeName}.json`);
      if (await fs.pathExists(dataFile)) {
        const data = await fs.readJson(dataFile);
        this.data = new Map(Object.entries(data));
      }
    } catch (error) {
      console.warn('Failed to load IndexedDB cache:', error.message);
    }
  }

  async saveData() {
    try {
      const dataFile = path.join(this.dbPath, `${this.storeName}.json`);
      const data = Object.fromEntries(this.data);
      await fs.writeJson(dataFile, data, { spaces: 2 });
    } catch (error) {
      console.error('Failed to save IndexedDB cache:', error.message);
    }
  }

  async get(key) {
    const entry = this.data.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check expiry
    if (entry.expiry && Date.now() > entry.expiry) {
      await this.remove(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value;
  }

  async set(key, value, options = {}) {
    const entry = {
      value,
      created: Date.now(),
      expiry: options.ttl ? Date.now() + options.ttl : null
    };

    this.data.set(key, entry);
    this.stats.sets++;
    
    await this.saveData();
  }

  async has(key) {
    const entry = this.data.get(key);
    if (!entry) return false;
    
    // Check expiry
    if (entry.expiry && Date.now() > entry.expiry) {
      await this.remove(key);
      return false;
    }
    
    return true;
  }

  async remove(key) {
    const existed = this.data.delete(key);
    if (existed) {
      this.stats.removes++;
      await this.saveData();
    }
    return existed;
  }

  async clear() {
    this.data.clear();
    await this.saveData();
  }

  getStats() {
    return {
      ...this.stats,
      entries: this.data.size
    };
  }
}

/**
 * Composite Cache that combines multiple cache backends
 */
class CompositeCache {
  constructor(caches = []) {
    this.caches = caches;
    this.writeThrough = true; // Write to all caches
    this.readThrough = true;  // Read from first available
  }

  async get(key) {
    for (let i = 0; i < this.caches.length; i++) {
      const cache = this.caches[i];
      const value = await cache.get(key);
      
      if (value !== null) {
        // Promote to higher-level caches if read-through is enabled
        if (this.readThrough && i > 0) {
          for (let j = i - 1; j >= 0; j--) {
            await this.caches[j].set(key, value);
          }
        }
        return value;
      }
    }
    return null;
  }

  async set(key, value, options = {}) {
    if (this.writeThrough) {
      // Write to all caches
      await Promise.all(
        this.caches.map(cache => cache.set(key, value, options))
      );
    } else {
      // Write only to first cache
      await this.caches[0].set(key, value, options);
    }
  }

  async has(key) {
    for (const cache of this.caches) {
      if (await cache.has(key)) {
        return true;
      }
    }
    return false;
  }

  async remove(key) {
    // Remove from all caches
    const results = await Promise.all(
      this.caches.map(cache => cache.remove(key))
    );
    return results.some(result => result);
  }

  async clear() {
    await Promise.all(
      this.caches.map(cache => cache.clear())
    );
  }

  getStats() {
    return this.caches.map((cache, index) => ({
      level: index,
      stats: cache.getStats()
    }));
  }
}

/**
 * Advanced cache features
 */

// Bloom Filter for quick negative lookups
class BloomFilter {
  constructor(size = 10000, hashFunctions = 3) {
    this.size = size;
    this.hashFunctions = hashFunctions;
    this.bits = new Array(size).fill(0);
    this.count = 0;
  }

  hash(value, seed) {
    let hash = seed;
    const str = String(value);
    
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash) % this.size;
  }

  add(key) {
    for (let i = 0; i < this.hashFunctions; i++) {
      const index = this.hash(key, i);
      this.bits[index] = 1;
    }
    this.count++;
  }

  contains(key) {
    for (let i = 0; i < this.hashFunctions; i++) {
      const index = this.hash(key, i);
      if (this.bits[index] === 0) {
        return false;
      }
    }
    return true; // Might be false positive
  }

  clear() {
    this.bits.fill(0);
    this.count = 0;
  }
}

// Cache with Bloom Filter for quick negative lookups
class BloomFilterCache {
  constructor(cache, options = {}) {
    this.cache = cache;
    this.bloom = new BloomFilter(options.bloomSize, options.bloomHashes);
  }

  async get(key) {
    // Quick negative lookup
    if (!this.bloom.contains(key)) {
      return null;
    }
    
    return this.cache.get(key);
  }

  async set(key, value, options) {
    await this.cache.set(key, value, options);
    this.bloom.add(key);
  }

  async has(key) {
    if (!this.bloom.contains(key)) {
      return false;
    }
    
    return this.cache.has(key);
  }

  async remove(key) {
    // Note: Bloom filter doesn't support deletions
    // This is a limitation of this implementation
    return this.cache.remove(key);
  }

  async clear() {
    await this.cache.clear();
    this.bloom.clear();
  }

  getStats() {
    return {
      cache: this.cache.getStats(),
      bloom: {
        count: this.bloom.count,
        size: this.bloom.size
      }
    };
  }
}

/**
 * Compression Middleware
 */
class CompressionMiddleware {
  constructor(cache, options = {}) {
    this.cache = cache;
    this.threshold = options.threshold || 1024; // Compress if larger than 1KB
  }

  async compress(value) {
    const str = serialize(value);
    
    if (str.length < this.threshold) {
      return { compressed: false, data: str };
    }

    // Simple compression using Node.js zlib
    const zlib = await import('zlib');
    const buffer = Buffer.from(str, 'utf-8');
    const compressed = await new Promise((resolve, reject) => {
      zlib.gzip(buffer, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    return {
      compressed: true,
      data: compressed.toString('base64')
    };
  }

  async decompress(data) {
    if (!data.compressed) {
      return deserialize(data.data);
    }

    const zlib = await import('zlib');
    const buffer = Buffer.from(data.data, 'base64');
    const decompressed = await new Promise((resolve, reject) => {
      zlib.gunzip(buffer, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    return deserialize(decompressed.toString('utf-8'));
  }

  async get(key) {
    const data = await this.cache.get(key);
    if (!data) return null;
    
    return this.decompress(data);
  }

  async set(key, value, options) {
    const compressed = await this.compress(value);
    return this.cache.set(key, compressed, options);
  }

  async has(key) {
    return this.cache.has(key);
  }

  async remove(key) {
    return this.cache.remove(key);
  }

  async clear() {
    return this.cache.clear();
  }

  getStats() {
    return this.cache.getStats();
  }
}

/**
 * Encryption Middleware
 */
class EncryptionMiddleware {
  constructor(cache, options = {}) {
    this.cache = cache;
    this.algorithm = options.algorithm || 'aes-256-gcm';
    this.password = options.password || crypto.randomBytes(32);
    this.salt = options.salt || crypto.randomBytes(16);
  }

  deriveKey() {
    return crypto.pbkdf2Sync(this.password, this.salt, 100000, 32, 'sha256');
  }

  async encrypt(value) {
    const str = serialize(value);
    const key = this.deriveKey();
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    let encrypted = cipher.update(str, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  async decrypt(data) {
    const key = this.deriveKey();
    const iv = Buffer.from(data.iv, 'hex');
    const authTag = Buffer.from(data.authTag, 'hex');
    
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return deserialize(decrypted);
  }

  async get(key) {
    const data = await this.cache.get(key);
    if (!data) return null;
    
    try {
      return this.decrypt(data);
    } catch (error) {
      console.error('Decryption failed:', error.message);
      return null;
    }
  }

  async set(key, value, options) {
    const encrypted = await this.encrypt(value);
    return this.cache.set(key, encrypted, options);
  }

  async has(key) {
    return this.cache.has(key);
  }

  async remove(key) {
    return this.cache.remove(key);
  }

  async clear() {
    return this.cache.clear();
  }

  getStats() {
    return this.cache.getStats();
  }
}

/**
 * Rate Limiting for cache operations
 */
class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // 1 minute
    this.maxRequests = options.maxRequests || 100;
    this.requests = new Map();
  }

  isAllowed(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Clean old entries
    const requests = this.requests.get(key) || [];
    const recentRequests = requests.filter(time => time > windowStart);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    
    return true;
  }

  reset(key) {
    this.requests.delete(key);
  }

  resetAll() {
    this.requests.clear();
  }
}

/**
 * Rate-limited cache
 */
class RateLimitedCache {
  constructor(cache, rateLimiter) {
    this.cache = cache;
    this.rateLimiter = rateLimiter;
  }

  async get(key) {
    if (!this.rateLimiter.isAllowed(`get:${key}`)) {
      throw new Error('Rate limit exceeded');
    }
    
    return this.cache.get(key);
  }

  async set(key, value, options) {
    if (!this.rateLimiter.isAllowed(`set:${key}`)) {
      throw new Error('Rate limit exceeded');
    }
    
    return this.cache.set(key, value, options);
  }

  async has(key) {
    if (!this.rateLimiter.isAllowed(`has:${key}`)) {
      throw new Error('Rate limit exceeded');
    }
    
    return this.cache.has(key);
  }

  async remove(key) {
    if (!this.rateLimiter.isAllowed(`remove:${key}`)) {
      throw new Error('Rate limit exceeded');
    }
    
    return this.cache.remove(key);
  }

  async clear() {
    if (!this.rateLimiter.isAllowed('clear')) {
      throw new Error('Rate limit exceeded');
    }
    
    return this.cache.clear();
  }

  getStats() {
    return this.cache.getStats();
  }
}

/**
 * Cache Synchronization Manager
 */
class CacheSyncManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.peers = new Map();
    this.syncInterval = options.syncInterval || 30000; // 30 seconds
    this.syncTimer = null;
  }

  addPeer(id, cache) {
    this.peers.set(id, cache);
    this.emit('peer:added', id);
  }

  removePeer(id) {
    this.peers.delete(id);
    this.emit('peer:removed', id);
  }

  async sync() {
    const peerList = Array.from(this.peers.entries());
    
    // Collect all unique keys
    const allKeys = new Set();
    for (const [id, cache] of peerList) {
      // This is a simplified approach - in practice, you'd have a more efficient
      // way to get all keys from a cache
      const stats = cache.getStats();
      // Add keys to allKeys (implementation depends on cache interface)
    }

    // Sync keys between peers
    for (const key of allKeys) {
      const values = new Map();
      
      // Get value from each peer
      for (const [id, cache] of peerList) {
        const value = await cache.get(key);
        if (value !== null) {
          values.set(id, value);
        }
      }

      // If values differ, resolve conflict
      if (values.size > 1) {
        const resolved = await this.resolveConflict(key, values);
        
        // Update all peers with resolved value
        for (const [id, cache] of peerList) {
          await cache.set(key, resolved);
        }
      }
    }

    this.emit('sync:complete');
  }

  async resolveConflict(key, values) {
    // Simple resolution: use the most recent value
    // In practice, you'd have more sophisticated conflict resolution
    let mostRecent = null;
    let latestTime = 0;

    for (const [id, value] of values) {
      if (value && value._timestamp > latestTime) {
        mostRecent = value;
        latestTime = value._timestamp;
      }
    }

    return mostRecent || Array.from(values.values())[0];
  }

  startSync() {
    if (this.syncTimer) return;
    
    this.syncTimer = setInterval(() => {
      this.sync().catch(error => {
        this.emit('sync:error', error);
      });
    }, this.syncInterval);
  }

  stopSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }
}

/**
 * Offline-capable cache
 */
class OfflineCache extends EventEmitter {
  constructor(cache, options = {}) {
    super();
    this.cache = cache;
    this.queue = [];
    this.online = true;
    this.maxQueueSize = options.maxQueueSize || 1000;
    this.syncOnReconnect = options.syncOnReconnect !== false;
  }

  setOnline(online) {
    const wasOffline = !this.online;
    this.online = online;
    
    if (online && wasOffline && this.syncOnReconnect) {
      this.processQueue();
    }
    
    this.emit('status:change', online);
  }

  async processQueue() {
    while (this.queue.length > 0 && this.online) {
      const operation = this.queue.shift();
      
      try {
        await this.executeOperation(operation);
        this.emit('queue:processed', operation);
      } catch (error) {
        // Re-queue on failure
        this.queue.unshift(operation);
        this.emit('queue:error', error);
        break;
      }
    }
  }

  async executeOperation(operation) {
    switch (operation.type) {
      case 'set':
        return this.cache.set(operation.key, operation.value, operation.options);
      case 'remove':
        return this.cache.remove(operation.key);
      case 'clear':
        return this.cache.clear();
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  queueOperation(operation) {
    if (this.queue.length >= this.maxQueueSize) {
      throw new Error('Offline queue is full');
    }
    
    this.queue.push(operation);
    this.emit('queue:added', operation);
  }

  async get(key) {
    // Get operations can be performed offline
    return this.cache.get(key);
  }

  async set(key, value, options) {
    if (this.online) {
      return this.cache.set(key, value, options);
    } else {
      this.queueOperation({ type: 'set', key, value, options });
      // Store in local cache for immediate read access
      return this.cache.set(key, value, options);
    }
  }

  async has(key) {
    return this.cache.has(key);
  }

  async remove(key) {
    if (this.online) {
      return this.cache.remove(key);
    } else {
      this.queueOperation({ type: 'remove', key });
      // Remove from local cache immediately
      return this.cache.remove(key);
    }
  }

  async clear() {
    if (this.online) {
      return this.cache.clear();
    } else {
      this.queueOperation({ type: 'clear' });
      // Clear local cache immediately
      return this.cache.clear();
    }
  }

  getStats() {
    const stats = this.cache.getStats();
    return {
      ...stats,
      offline: {
        online: this.online,
        queueLength: this.queue.length
      }
    };
  }
}

/**
 * Main MultiLevelCache class that combines everything
 */
class MultiLevelCache extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      memorySize: options.memorySize || 100,
      diskSize: options.diskSize || 500 * 1024 * 1024,
      cacheDir: options.cacheDir || path.join(process.cwd(), '.walgit', 'cache'),
      enableIndexedDB: options.enableIndexedDB || false,
      enableCompression: options.enableCompression || true,
      enableEncryption: options.enableEncryption || false,
      encryptionPassword: options.encryptionPassword,
      enableBloomFilter: options.enableBloomFilter || true,
      enableRateLimiting: options.enableRateLimiting || false,
      rateLimitOptions: options.rateLimitOptions || {},
      enableOfflineSupport: options.enableOfflineSupport || false,
      ...options
    };
    
    this.levels = [];
    this.syncManager = null;
    this.rateLimiter = null;
  }

  async init() {
    // Level 1: Memory cache
    let memoryCache = new MemoryCache({ maxSize: this.options.memorySize });
    
    // Add bloom filter if enabled
    if (this.options.enableBloomFilter) {
      memoryCache = new BloomFilterCache(memoryCache);
    }
    
    this.levels.push(memoryCache);
    
    // Level 2: Disk cache
    const diskCache = new DiskCache({
      cacheDir: this.options.cacheDir,
      maxSize: this.options.diskSize
    });
    await diskCache.init();
    
    let diskCacheWrapped = diskCache;
    
    // Add compression if enabled
    if (this.options.enableCompression) {
      diskCacheWrapped = new CompressionMiddleware(diskCacheWrapped);
    }
    
    // Add encryption if enabled
    if (this.options.enableEncryption) {
      diskCacheWrapped = new EncryptionMiddleware(diskCacheWrapped, {
        password: this.options.encryptionPassword
      });
    }
    
    this.levels.push(diskCacheWrapped);
    
    // Level 3: IndexedDB cache (if enabled)
    if (this.options.enableIndexedDB) {
      const indexedDbCache = new IndexedDBCache();
      await indexedDbCache.init();
      this.levels.push(indexedDbCache);
    }
    
    // Create composite cache
    this.cache = new CompositeCache(this.levels);
    
    // Add rate limiting if enabled
    if (this.options.enableRateLimiting) {
      this.rateLimiter = new RateLimiter(this.options.rateLimitOptions);
      this.cache = new RateLimitedCache(this.cache, this.rateLimiter);
    }
    
    // Add offline support if enabled
    if (this.options.enableOfflineSupport) {
      this.cache = new OfflineCache(this.cache);
      
      // Monitor network status if available
      if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('online', () => this.cache.setOnline(true));
        window.addEventListener('offline', () => this.cache.setOnline(false));
      }
    }
    
    // Initialize sync manager
    this.syncManager = new CacheSyncManager();
    
    this.emit('initialized');
  }

  // Delegate methods to the composite cache
  async get(key) {
    return this.cache.get(key);
  }

  async set(key, value, options) {
    return this.cache.set(key, value, options);
  }

  async has(key) {
    return this.cache.has(key);
  }

  async remove(key) {
    return this.cache.remove(key);
  }

  async clear() {
    return this.cache.clear();
  }

  getStats() {
    return {
      levels: this.cache.getStats(),
      options: this.options
    };
  }

  // Advanced operations
  async warmup(keys) {
    // Pre-load keys into higher cache levels
    const results = [];
    
    for (const key of keys) {
      const value = await this.get(key);
      results.push({ key, found: value !== null });
    }
    
    return results;
  }

  async analyze() {
    // Analyze cache performance and provide recommendations
    const stats = this.getStats();
    const analysis = {
      performance: {},
      recommendations: []
    };

    // Calculate hit rates for each level
    if (stats.levels && Array.isArray(stats.levels)) {
      stats.levels.forEach((level, index) => {
        const levelStats = level.stats;
        const hitRate = levelStats.hits / (levelStats.hits + levelStats.misses);
        
        analysis.performance[`level${index}`] = {
          hitRate,
          size: levelStats.size || levelStats.entries,
          evictions: levelStats.evictions || 0
        };

        // Provide recommendations
        if (hitRate < 0.5 && index === 0) {
          analysis.recommendations.push(
            'Consider increasing memory cache size for better performance'
          );
        }

        if (levelStats.evictions > levelStats.sets * 0.5) {
          analysis.recommendations.push(
            `Level ${index} has high eviction rate. Consider increasing cache size.`
          );
        }
      });
    }

    return analysis;
  }

  // Cache synchronization
  addPeer(id, cache) {
    this.syncManager.addPeer(id, cache);
  }

  removePeer(id) {
    this.syncManager.removePeer(id);
  }

  startSync() {
    this.syncManager.startSync();
  }

  stopSync() {
    this.syncManager.stopSync();
  }
}

/**
 * Factory functions for creating cache instances
 */
export function createMemoryCache(options) {
  return new MemoryCache(options);
}

export function createDiskCache(options) {
  return new DiskCache(options);
}

export function createIndexedDBCache(options) {
  return new IndexedDBCache(options);
}

export function createCompositeCache(caches) {
  return new CompositeCache(caches);
}

export function createBloomFilter(size, hashFunctions) {
  return new BloomFilter(size, hashFunctions);
}

export function createCompressionMiddleware(cache, options) {
  return new CompressionMiddleware(cache, options);
}

export function createEncryptionMiddleware(cache, options) {
  return new EncryptionMiddleware(cache, options);
}

export function createRateLimiter(options) {
  return new RateLimiter(options);
}

export function createSyncManager(options) {
  return new CacheSyncManager(options);
}

export function createOfflineCache(cache, options) {
  return new OfflineCache(cache, options);
}

/**
 * Create a fully configured multi-level cache
 */
export async function createMultiLevelCache(options = {}) {
  try {
    const defaultOptions = {
      memorySize: 100,
      diskSize: 500 * 1024 * 1024, // 500MB
      cacheDir: path.join(process.cwd(), '.walgit', 'cache'),
      enableIndexedDB: false,
      enableCompression: true,
      enableEncryption: false,
      enableBloomFilter: true,
      enableRateLimiting: false,
      enableOfflineSupport: false
    };
    
    const cacheOptions = { ...defaultOptions, ...options };
    
    const cache = new MultiLevelCache(cacheOptions);
    await cache.init();
    return cache;
  } catch (error) {
    console.error('Failed to create multi-level cache:', error.message);
    throw error;
  }
}

/**
 * Default export with main cache instance and utility functions
 */
const cacheExports = {
  MultiLevelCache,
  createMultiLevelCache,
  
  // Default singleton instance (will be lazily initialized)
  _instance: null,
  
  // Get singleton instance
  getInstance: async (options) => {
    if (!cacheExports._instance) {
      cacheExports._instance = await createMultiLevelCache(options);
    }
    return cacheExports._instance;
  },
  
  // Shorthand methods
  get: async (key, options) => {
    const cache = await cacheExports.getInstance();
    return cache.get(key, options);
  },
  
  set: async (key, value, options) => {
    const cache = await cacheExports.getInstance();
    return cache.set(key, value, options);
  },
  
  has: async (key, options) => {
    const cache = await cacheExports.getInstance();
    return cache.has(key, options);
  },
  
  remove: async (key, options) => {
    const cache = await cacheExports.getInstance();
    return cache.remove(key, options);
  },
  
  clear: async (options) => {
    const cache = await cacheExports.getInstance();
    return cache.clear(options);
  },
  
  getStats: async () => {
    const cache = await cacheExports.getInstance();
    return cache.getStats();
  }
};

export default cacheExports;