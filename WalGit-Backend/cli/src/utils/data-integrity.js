/**
 * Data Integrity Utilities
 * Provides verification and validation tools for blob data integrity
 */

import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
import fs from 'fs/promises';
import zlib from 'zlib';
import { promisify } from 'util';
import path from 'path';

// Convert zlib methods to promise-based API
const deflate = promisify(zlib.deflate);
const inflate = promisify(zlib.inflate);

// Hash algorithms supported for verification
const HASH_ALGORITHMS = {
  SHA1: 'sha1',
  SHA256: 'sha256',
  BLAKE2B: 'blake2b512',
  XXHASH: 'xxhash64' // Faster hash for non-cryptographic purposes
};

/**
 * Generates multiple hash digests for a buffer
 * @param {Buffer} data - Data to hash
 * @param {Array<string>} algorithms - Hash algorithms to use
 * @returns {Object} Object with hash algorithm keys and digest values
 */
export function generateMultipleHashes(data, algorithms = [HASH_ALGORITHMS.SHA1, HASH_ALGORITHMS.SHA256]) {
  const hashes = {};
  
  for (const algorithm of algorithms) {
    try {
      if (algorithm === HASH_ALGORITHMS.XXHASH) {
        // XXHash implementation
        const xxhash = require('xxhash-addon');
        hashes[algorithm] = xxhash.hash64(data).toString('hex');
      } else {
        hashes[algorithm] = crypto.createHash(algorithm).update(data).digest('hex');
      }
    } catch (error) {
      console.error(`Error generating ${algorithm} hash:`, error);
    }
  }
  
  return hashes;
}

/**
 * Verifies a blob's integrity using multiple hash algorithms
 * @param {Object} hashData - Object containing expected hash values keyed by algorithm
 * @param {Buffer} content - Content to verify
 * @returns {Object} Verification results for each algorithm
 */
export function verifyIntegrity(hashData, content) {
  const results = {
    verified: true,
    algorithms: {}
  };
  
  for (const [algorithm, expectedHash] of Object.entries(hashData)) {
    try {
      let actualHash;
      
      if (algorithm === HASH_ALGORITHMS.XXHASH) {
        // XXHash implementation
        const xxhash = require('xxhash-addon');
        actualHash = xxhash.hash64(content).toString('hex');
      } else {
        actualHash = crypto.createHash(algorithm).update(content).digest('hex');
      }
      
      const isValid = expectedHash === actualHash;
      results.algorithms[algorithm] = {
        valid: isValid,
        expected: expectedHash,
        actual: actualHash
      };
      
      if (!isValid) {
        results.verified = false;
      }
    } catch (error) {
      results.algorithms[algorithm] = {
        valid: false,
        error: error.message
      };
      results.verified = false;
    }
  }
  
  return results;
}

/**
 * Creates a Git blob object with enhanced integrity verification
 * @param {Buffer|string} content - Content to store
 * @param {Array<string>} algorithms - Hash algorithms to use
 * @returns {Promise<{hash: string, size: number, integrity: Object}>}
 */
export async function createIntegrityBlob(content, algorithms = [HASH_ALGORITHMS.SHA1, HASH_ALGORITHMS.SHA256]) {
  // Ensure content is a Buffer
  const contentBuffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
  
  // Create the Git blob header
  const header = Buffer.from(`blob ${contentBuffer.length}\\0`);
  const blobData = Buffer.concat([header, contentBuffer]);
  
  // Generate multiple hashes for integrity checks
  const hashes = generateMultipleHashes(blobData, algorithms);
  
  // Use SHA1 as the primary identifier to maintain Git compatibility
  const hash = hashes[HASH_ALGORITHMS.SHA1];
  
  // Compress the blob data
  const compressedData = await deflate(blobData);
  
  // Return the hash, size, and integrity data
  return {
    hash,
    size: contentBuffer.length,
    compressedSize: compressedData.length,
    integrity: hashes,
    compressionRatio: contentBuffer.length / compressedData.length,
    compressedData
  };
}

/**
 * Calculates checksums for a file stream without loading the entire file into memory
 * @param {string} filePath - Path to the file
 * @param {Array<string>} algorithms - Hash algorithms to use
 * @returns {Promise<Object>} Object with hash values for each algorithm
 */
export async function calculateFileChecksums(filePath, algorithms = [HASH_ALGORITHMS.SHA1, HASH_ALGORITHMS.SHA256]) {
  // Get file stats
  const stats = await fs.stat(filePath);
  const fileSize = stats.size;
  
  // Create hash objects
  const hashObjects = {};
  for (const algorithm of algorithms) {
    if (algorithm !== HASH_ALGORITHMS.XXHASH) {
      hashObjects[algorithm] = crypto.createHash(algorithm);
    }
  }
  
  // Prepare the Git blob header
  const header = `blob ${fileSize}\\0`;
  for (const algorithm of algorithms) {
    if (algorithm !== HASH_ALGORITHMS.XXHASH) {
      hashObjects[algorithm].update(header);
    }
  }
  
  // Create a read stream to process the file in chunks
  const readStream = createReadStream(filePath);
  
  // Process the file in chunks
  for await (const chunk of readStream) {
    for (const algorithm of algorithms) {
      if (algorithm !== HASH_ALGORITHMS.XXHASH) {
        hashObjects[algorithm].update(chunk);
      }
    }
  }
  
  // Calculate xxhash separately if needed
  let xxhashValue = null;
  if (algorithms.includes(HASH_ALGORITHMS.XXHASH)) {
    const xxhash = require('xxhash-addon');
    const fileContent = await fs.readFile(filePath);
    xxhashValue = xxhash.hash64(Buffer.concat([Buffer.from(header), fileContent])).toString('hex');
  }
  
  // Return hash digests
  const results = {};
  for (const algorithm of algorithms) {
    if (algorithm === HASH_ALGORITHMS.XXHASH) {
      results[algorithm] = xxhashValue;
    } else {
      results[algorithm] = hashObjects[algorithm].digest('hex');
    }
  }
  
  return {
    hashes: results,
    size: fileSize
  };
}

/**
 * Verify and repair corrupt blob data
 * @param {string} hash - Expected SHA1 hash
 * @param {Buffer} data - Data to verify
 * @param {Buffer} backup - Backup data to use if primary is corrupt
 * @returns {Promise<{verified: boolean, repaired: boolean, data: Buffer}>}
 */
export async function verifyAndRepair(hash, data, backup = null) {
  // Create Git blob format for verification
  const contentOnly = data.indexOf(0) !== -1 ? data.subarray(data.indexOf(0) + 1) : data;
  const header = Buffer.from(`blob ${contentOnly.length}\\0`);
  const blobData = Buffer.concat([header, contentOnly]);
  
  // Calculate SHA1 for verification
  const calculatedHash = crypto.createHash(HASH_ALGORITHMS.SHA1).update(blobData).digest('hex');
  
  // If hash matches, data is valid
  if (calculatedHash === hash) {
    return {
      verified: true,
      repaired: false,
      data: contentOnly
    };
  }
  
  // If backup is provided, try to repair
  if (backup) {
    const backupContentOnly = backup.indexOf(0) !== -1 ? backup.subarray(backup.indexOf(0) + 1) : backup;
    const backupHeader = Buffer.from(`blob ${backupContentOnly.length}\\0`);
    const backupBlobData = Buffer.concat([backupHeader, backupContentOnly]);
    const backupCalculatedHash = crypto.createHash(HASH_ALGORITHMS.SHA1).update(backupBlobData).digest('hex');
    
    if (backupCalculatedHash === hash) {
      return {
        verified: true,
        repaired: true,
        data: backupContentOnly
      };
    }
  }
  
  // Could not verify or repair
  return {
    verified: false,
    repaired: false,
    data: null
  };
}

/**
 * Compare two blobs and generate a verification report
 * @param {string} hash - Blob hash
 * @param {Buffer} localData - Local blob data
 * @param {Buffer} remoteData - Remote blob data
 * @returns {Object} Verification report
 */
export function compareBlobData(hash, localData, remoteData) {
  try {
    // Normalize data (extract content if needed)
    const localContent = localData.indexOf(0) !== -1 ? localData.subarray(localData.indexOf(0) + 1) : localData;
    const remoteContent = remoteData.indexOf(0) !== -1 ? remoteData.subarray(remoteData.indexOf(0) + 1) : remoteData;
    
    // Basic checks
    const sizeMatch = localContent.length === remoteContent.length;
    let contentMatch = false;
    
    // Only compare content if sizes match (for efficiency)
    if (sizeMatch) {
      contentMatch = localContent.equals(remoteContent);
    }
    
    // Perform hash verification
    const localHeader = Buffer.from(`blob ${localContent.length}\\0`);
    const localBlob = Buffer.concat([localHeader, localContent]);
    const localHash = crypto.createHash(HASH_ALGORITHMS.SHA1).update(localBlob).digest('hex');
    
    const remoteHeader = Buffer.from(`blob ${remoteContent.length}\\0`);
    const remoteBlob = Buffer.concat([remoteHeader, remoteContent]);
    const remoteHash = crypto.createHash(HASH_ALGORITHMS.SHA1).update(remoteBlob).digest('hex');
    
    const hashMatch = localHash === remoteHash;
    const expectedMatch = localHash === hash && remoteHash === hash;
    
    return {
      sizeMatch,
      contentMatch,
      hashMatch,
      expectedMatch,
      localHash,
      remoteHash,
      expectedHash: hash,
      localSize: localContent.length,
      remoteSize: remoteContent.length
    };
  } catch (error) {
    return {
      error: error.message,
      sizeMatch: false,
      contentMatch: false,
      hashMatch: false,
      expectedMatch: false
    };
  }
}

/**
 * Creates Blake2b hash for quick checksum verification
 * This is faster than SHA-256 and provides sufficient security for data integrity
 * @param {Buffer} data - Data to hash
 * @returns {string} Blake2b hash digest
 */
export function createQuickChecksum(data) {
  return crypto.createHash(HASH_ALGORITHMS.BLAKE2B).update(data).digest('hex');
}

/**
 * Creates a content-based deduplication key for blob data
 * @param {Buffer} content - Content to create key for
 * @returns {string} Deduplication key
 */
export function createDeduplicationKey(content) {
  // Use a faster hash for deduplication
  return crypto.createHash(HASH_ALGORITHMS.SHA1).update(content).digest('hex');
}

// Export hash algorithms for use in other modules
export { HASH_ALGORITHMS };

// Default export for all integrity functions
export default {
  generateMultipleHashes,
  verifyIntegrity,
  createIntegrityBlob,
  calculateFileChecksums,
  verifyAndRepair,
  compareBlobData,
  createQuickChecksum,
  createDeduplicationKey,
  HASH_ALGORITHMS
};