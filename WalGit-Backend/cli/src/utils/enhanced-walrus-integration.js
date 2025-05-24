/**
 * @fileoverview Enhanced Walrus storage integration with robust error handling
 * Provides comprehensive error handling, retry mechanisms, and user feedback
 * for all Walrus operations in WalGit.
 */

import fetch from 'node-fetch';
import crypto from 'crypto';
import { setTimeout } from 'timers/promises';
import fs from 'fs';
import path from 'path';
import os from 'os';
import pLimit from 'p-limit';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { EventEmitter } from 'events';
import ora from 'ora';
import { URL } from 'url';
import FormData from 'form-data';

// Enhanced error classes
export class WalrusError extends Error {
  constructor(message, code, originalError = null) {
    super(message);
    this.name = 'WalrusError';
    this.code = code;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }
}

export class WalrusNetworkError extends WalrusError {
  constructor(message, statusCode, originalError = null) {
    super(message, 'NETWORK_ERROR', originalError);
    this.statusCode = statusCode;
  }
}

export class WalrusStorageError extends WalrusError {
  constructor(message, originalError = null) {
    super(message, 'STORAGE_ERROR', originalError);
  }
}

export class WalrusValidationError extends WalrusError {
  constructor(message, originalError = null) {
    super(message, 'VALIDATION_ERROR', originalError);
  }
}

// Enhanced constants
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 30000; // 30 seconds
const RETRY_MULTIPLIER = 2;
const TIMEOUT_MS = 60000; // 60 seconds per request
const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks
const MAX_FILE_SIZE = 14 * 1024 * 1024 * 1024; // 14GB
const DEFAULT_PARALLELISM = 3;
const CACHE_DIR = path.join(os.homedir(), '.walgit', 'cache');

// Network resilience patterns
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds

class CircuitBreaker {
  constructor(threshold = CIRCUIT_BREAKER_THRESHOLD, timeout = CIRCUIT_BREAKER_TIMEOUT) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new WalrusNetworkError('Circuit breaker is OPEN - service temporarily unavailable');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

/**
 * Enhanced Walrus client with comprehensive error handling
 */
export class EnhancedWalrusClient extends EventEmitter {
  constructor(options = {}) {
    super();
    this.apiKey = options.apiKey || process.env.WALRUS_API_KEY;
    this.endpoint = options.endpoint || process.env.WALRUS_API_ENDPOINT || 'https://api.walrus.storage';
    this.circuitBreaker = new CircuitBreaker();
    this.operationLimit = pLimit(DEFAULT_PARALLELISM);
    this.activeOperations = new Map();
    
    // Validate configuration
    if (!this.apiKey) {
      throw new WalrusValidationError('Walrus API key is required');
    }
    
    // Ensure cache directory exists
    this.ensureCacheDir();
  }

  ensureCacheDir() {
    try {
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
    } catch (error) {
      console.warn(`Failed to create cache directory: ${error.message}`);
    }
  }

  /**
   * Enhanced retry mechanism with exponential backoff
   */
  async withRetry(operation, operationName, retries = MAX_RETRIES) {
    let lastError;
    let delay = INITIAL_RETRY_DELAY;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.circuitBreaker.execute(operation);
      } catch (error) {
        lastError = error;
        
        // Don't retry on validation errors
        if (error instanceof WalrusValidationError) {
          throw error;
        }

        // Log attempt
        console.warn(`${operationName} attempt ${attempt + 1}/${retries + 1} failed:`, error.message);
        
        if (attempt < retries) {
          // Calculate next delay with jitter
          const jitter = Math.random() * 0.1 * delay;
          const nextDelay = Math.min(delay + jitter, MAX_RETRY_DELAY);
          
          console.log(`Retrying in ${Math.round(nextDelay / 1000)}s...`);
          await setTimeout(nextDelay);
          
          delay *= RETRY_MULTIPLIER;
        }
      }
    }

    throw new WalrusError(
      `${operationName} failed after ${retries + 1} attempts: ${lastError.message}`,
      'MAX_RETRIES_EXCEEDED',
      lastError
    );
  }

  /**
   * Enhanced file upload with progress tracking and chunking
   */
  async uploadFile(filePath, options = {}) {
    const operationId = crypto.randomUUID();
    const spinner = ora(`Uploading ${path.basename(filePath)}...`).start();
    
    try {
      // Validate file
      const stats = await fs.promises.stat(filePath);
      if (stats.size > MAX_FILE_SIZE) {
        throw new WalrusValidationError(`File size ${stats.size} exceeds maximum allowed size of ${MAX_FILE_SIZE}`);
      }

      this.activeOperations.set(operationId, { type: 'upload', filePath, startTime: Date.now() });
      
      // For large files, use chunked upload
      if (stats.size > CHUNK_SIZE) {
        return await this.uploadLargeFile(filePath, options, spinner, operationId);
      } else {
        return await this.uploadSmallFile(filePath, options, spinner, operationId);
      }
    } catch (error) {
      spinner.fail(`Upload failed: ${error.message}`);
      throw error;
    } finally {
      this.activeOperations.delete(operationId);
      if (spinner.isSpinning) {
        spinner.stop();
      }
    }
  }

  /**
   * Upload small files in a single request
   */
  async uploadSmallFile(filePath, options, spinner, operationId) {
    return await this.withRetry(async () => {
      const fileBuffer = await fs.promises.readFile(filePath);
      const contentHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      
      const formData = new FormData();
      formData.append('file', fileBuffer, path.basename(filePath));
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      
      try {
        const response = await fetch(`${this.endpoint}/v1/store`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: formData,
          signal: controller.signal
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new WalrusNetworkError(
            `Upload failed with status ${response.status}: ${errorText}`,
            response.status
          );
        }

        const result = await response.json();
        
        // Update spinner with success
        spinner.succeed(`Uploaded ${path.basename(filePath)} (${this.formatBytes(fileBuffer.length)})`);
        
        this.emit('uploadComplete', {
          operationId,
          filePath,
          blobId: result.blobId,
          size: fileBuffer.length,
          contentHash
        });

        return {
          blobId: result.blobId,
          size: fileBuffer.length,
          contentHash,
          chunks: 1
        };
      } finally {
        clearTimeout(timeoutId);
      }
    }, `Upload ${path.basename(filePath)}`);
  }

  /**
   * Upload large files using chunked approach
   */
  async uploadLargeFile(filePath, options, spinner, operationId) {
    const stats = await fs.promises.stat(filePath);
    const chunks = await this.createChunks(filePath, CHUNK_SIZE);
    
    spinner.text = `Uploading ${path.basename(filePath)} in ${chunks.length} chunks...`;
    
    // Upload chunks in parallel with limited concurrency
    const chunkResults = await Promise.all(
      chunks.map(chunk => 
        this.operationLimit(() => this.uploadChunk(filePath, chunk, options, spinner))
      )
    );

    // Combine chunks into final blob
    const result = await this.combineChunks(chunkResults, options);
    
    spinner.succeed(`Uploaded ${path.basename(filePath)} (${this.formatBytes(stats.size)}, ${chunks.length} chunks)`);
    
    this.emit('uploadComplete', {
      operationId,
      filePath,
      blobId: result.blobId,
      size: stats.size,
      chunks: chunks.length
    });

    return result;
  }

  /**
   * Enhanced file download with progress tracking
   */
  async downloadFile(blobId, downloadPath, options = {}) {
    const operationId = crypto.randomUUID();
    const spinner = ora(`Downloading ${blobId}...`).start();
    
    try {
      this.activeOperations.set(operationId, { type: 'download', blobId, startTime: Date.now() });
      
      return await this.withRetry(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
        
        try {
          const response = await fetch(`${this.endpoint}/v1/retrieve/${blobId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
            },
            signal: controller.signal
          });

          if (!response.ok) {
            if (response.status === 404) {
              throw new WalrusStorageError(`Blob ${blobId} not found`);
            }
            const errorText = await response.text();
            throw new WalrusNetworkError(
              `Download failed with status ${response.status}: ${errorText}`,
              response.status
            );
          }

          // Stream the response to file
          const fileStream = fs.createWriteStream(downloadPath);
          await pipeline(response.body, fileStream);
          
          const stats = await fs.promises.stat(downloadPath);
          
          spinner.succeed(`Downloaded ${blobId} (${this.formatBytes(stats.size)})`);
          
          this.emit('downloadComplete', {
            operationId,
            blobId,
            downloadPath,
            size: stats.size
          });

          return {
            blobId,
            downloadPath,
            size: stats.size
          };
        } finally {
          clearTimeout(timeoutId);
        }
      }, `Download ${blobId}`);
    } catch (error) {
      spinner.fail(`Download failed: ${error.message}`);
      throw error;
    } finally {
      this.activeOperations.delete(operationId);
      if (spinner.isSpinning) {
        spinner.stop();
      }
    }
  }

  /**
   * Enhanced blob existence check
   */
  async blobExists(blobId) {
    return await this.withRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      
      try {
        const response = await fetch(`${this.endpoint}/v1/info/${blobId}`, {
          method: 'HEAD',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
          signal: controller.signal
        });

        return response.ok;
      } finally {
        clearTimeout(timeoutId);
      }
    }, `Check existence of ${blobId}`);
  }

  /**
   * Get blob metadata
   */
  async getBlobInfo(blobId) {
    return await this.withRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      
      try {
        const response = await fetch(`${this.endpoint}/v1/info/${blobId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
          signal: controller.abort
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new WalrusStorageError(`Blob ${blobId} not found`);
          }
          const errorText = await response.text();
          throw new WalrusNetworkError(
            `Failed to get blob info with status ${response.status}: ${errorText}`,
            response.status
          );
        }

        return await response.json();
      } finally {
        clearTimeout(timeoutId);
      }
    }, `Get info for ${blobId}`);
  }

  /**
   * Create chunks for large file upload
   */
  async createChunks(filePath, chunkSize) {
    const stats = await fs.promises.stat(filePath);
    const fileSize = stats.size;
    const chunks = [];
    const totalChunks = Math.ceil(fileSize / chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min((i + 1) * chunkSize, fileSize);
      
      chunks.push({
        index: i,
        start,
        end,
        size: end - start
      });
    }
    
    return chunks;
  }

  /**
   * Upload a single chunk
   */
  async uploadChunk(filePath, chunk, options, spinner) {
    return await this.withRetry(async () => {
      const buffer = Buffer.alloc(chunk.size);
      const fd = await fs.promises.open(filePath, 'r');
      
      try {
        await fd.read(buffer, 0, chunk.size, chunk.start);
        
        const formData = new FormData();
        formData.append('file', buffer, `chunk-${chunk.index}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
        
        try {
          const response = await fetch(`${this.endpoint}/v1/store`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
            },
            body: formData,
            signal: controller.signal
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new WalrusNetworkError(
              `Chunk upload failed with status ${response.status}: ${errorText}`,
              response.status
            );
          }

          const result = await response.json();
          
          // Update spinner progress
          spinner.text = `Uploading chunk ${chunk.index + 1}...`;
          
          return {
            index: chunk.index,
            blobId: result.blobId,
            size: chunk.size
          };
        } finally {
          clearTimeout(timeoutId);
        }
      } finally {
        await fd.close();
      }
    }, `Upload chunk ${chunk.index}`);
  }

  /**
   * Combine uploaded chunks into final blob
   */
  async combineChunks(chunkResults, options) {
    // Sort chunks by index
    chunkResults.sort((a, b) => a.index - b.index);
    
    // Create manifest for chunk assembly
    const manifest = {
      chunks: chunkResults.map(chunk => ({
        index: chunk.index,
        blobId: chunk.blobId,
        size: chunk.size
      })),
      totalSize: chunkResults.reduce((sum, chunk) => sum + chunk.size, 0),
      assemblyType: 'sequential'
    };
    
    // Upload manifest
    const manifestBuffer = Buffer.from(JSON.stringify(manifest));
    const formData = new FormData();
    formData.append('file', manifestBuffer, 'manifest.json');
    
    const response = await fetch(`${this.endpoint}/v1/store`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new WalrusNetworkError(
        `Manifest upload failed with status ${response.status}: ${errorText}`,
        response.status
      );
    }

    const result = await response.json();
    
    return {
      blobId: result.blobId,
      size: manifest.totalSize,
      chunks: chunkResults.length,
      manifest: manifest
    };
  }

  /**
   * Get status of active operations
   */
  getActiveOperations() {
    const operations = [];
    for (const [id, operation] of this.activeOperations.entries()) {
      operations.push({
        id,
        ...operation,
        duration: Date.now() - operation.startTime
      });
    }
    return operations;
  }

  /**
   * Cancel active operations
   */
  cancelAllOperations() {
    for (const [id, operation] of this.activeOperations.entries()) {
      this.emit('operationCancelled', { id, operation });
    }
    this.activeOperations.clear();
  }

  /**
   * Format bytes for human reading
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Health check for Walrus service
   */
  async healthCheck() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.endpoint}/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        statusCode: response.status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
export const walrusClient = new EnhancedWalrusClient();

// Error classes are already exported as class declarations above