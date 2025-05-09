/**
 * @fileoverview Blob Manager for WalGit
 * 
 * This module provides a comprehensive set of functions for managing Git blob objects
 * in the WalGit system. It handles creation, storage, retrieval, and verification
 * of blob objects, integrating with Walrus storage for persistence.
 * 
 * Blob objects in Git represent file content snapshots and are immutable.
 * They are content-addressed using SHA-1 hashes of their content.
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

// Import Sui integration utility for Walrus storage interactions
import { suiClient, walrusStorage } from './sui-integration.js';
import { getConfig } from './config.js';
import { getRepositoryPath } from './repository.js';

// Convert zlib methods to promise-based API
const deflate = promisify(zlib.deflate);
const inflate = promisify(zlib.inflate);

/**
 * Creates a Git blob object from file content
 * 
 * @param {Buffer|string} content - The content to store in the blob
 * @returns {Promise<{hash: string, size: number}>} - The SHA-1 hash and size of the created blob
 */
export async function createBlob(content) {
  // Ensure content is a Buffer
  const contentBuffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
  
  // Create the Git blob header (format: "blob {content-length}\0{content}")
  const header = Buffer.from(`blob ${contentBuffer.length}\0`);
  const blobData = Buffer.concat([header, contentBuffer]);
  
  // Generate the SHA-1 hash for content addressing
  const hash = crypto.createHash('sha1').update(blobData).digest('hex');
  
  // Compress the blob data for storage efficiency
  const compressedData = await deflate(blobData);
  
  // Store in local .git objects directory (for hybrid operation)
  await storeLocalBlob(hash, compressedData);
  
  // Store in Walrus storage (for distributed operation)
  await storeWalrusBlob(hash, compressedData);
  
  return {
    hash,
    size: contentBuffer.length
  };
}

/**
 * Stores a blob in the local .git/objects directory
 * 
 * @param {string} hash - The SHA-1 hash of the blob
 * @param {Buffer} compressedData - The compressed blob data
 * @returns {Promise<void>}
 */
async function storeLocalBlob(hash, compressedData) {
  const repoPath = await getRepositoryPath();
  const objectsDir = path.join(repoPath, '.git', 'objects');
  
  // Git objects are stored in directories named by the first 2 characters of the hash
  // with filenames being the remaining characters
  const subdir = hash.substring(0, 2);
  const filename = hash.substring(2);
  const objectPath = path.join(objectsDir, subdir, filename);
  
  // Create the subdirectory if it doesn't exist
  await fs.mkdir(path.join(objectsDir, subdir), { recursive: true });
  
  // Write the compressed data to the object file
  await fs.writeFile(objectPath, compressedData);
}

/**
 * Stores a blob in Walrus storage via Sui Move contract
 * 
 * @param {string} hash - The SHA-1 hash of the blob
 * @param {Buffer} compressedData - The compressed blob data
 * @returns {Promise<string>} - The transaction digest
 */
async function storeWalrusBlob(hash, compressedData) {
  const config = await getConfig();
  
  // Skip Walrus storage in simulation mode
  if (config.simulationMode) {
    return 'simulation-mode-skip-walrus-storage';
  }
  
  try {
    // Convert to base64 for transmission
    const base64Data = compressedData.toString('base64');
    
    // Store in Walrus via Sui Move contract
    const txResult = await walrusStorage.storeBlob({
      blobHash: hash,
      content: base64Data,
      repositoryId: config.currentRepository
    });
    
    return txResult.digest;
  } catch (error) {
    console.error('Error storing blob in Walrus:', error);
    throw new Error(`Failed to store blob ${hash} in Walrus storage: ${error.message}`);
  }
}

/**
 * Retrieves a blob from either local storage or Walrus
 * 
 * @param {string} hash - The SHA-1 hash of the blob to retrieve
 * @param {Object} options - Options for retrieval
 * @param {boolean} [options.raw=false] - If true, returns raw git object without decompressing
 * @param {boolean} [options.contentOnly=true] - If true, returns only the content (not the header)
 * @returns {Promise<Buffer>} - The blob data
 */
export async function getBlob(hash, options = { raw: false, contentOnly: true }) {
  try {
    // Try to get from local storage first
    return await getLocalBlob(hash, options);
  } catch (error) {
    // If not found locally, try Walrus storage
    return await getWalrusBlob(hash, options);
  }
}

/**
 * Retrieves a blob from local .git/objects directory
 * 
 * @param {string} hash - The SHA-1 hash of the blob to retrieve
 * @param {Object} options - Options for retrieval
 * @returns {Promise<Buffer>} - The blob data
 */
async function getLocalBlob(hash, { raw = false, contentOnly = true }) {
  const repoPath = await getRepositoryPath();
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
 * Retrieves a blob from Walrus storage
 * 
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
    // Retrieve from Walrus via Sui Move contract
    const result = await walrusStorage.retrieveBlob({
      blobHash: hash,
      repositoryId: config.currentRepository
    });
    
    // Convert from base64
    const compressedData = Buffer.from(result.content, 'base64');
    
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
  } catch (error) {
    console.error('Error retrieving blob from Walrus:', error);
    throw new Error(`Failed to retrieve blob ${hash} from Walrus storage: ${error.message}`);
  }
}

/**
 * Verifies if a blob with the given hash exists
 * 
 * @param {string} hash - The SHA-1 hash to verify
 * @returns {Promise<boolean>} - True if the blob exists
 */
export async function blobExists(hash) {
  try {
    // Check local storage first
    const repoPath = await getRepositoryPath();
    const subdir = hash.substring(0, 2);
    const filename = hash.substring(2);
    const objectPath = path.join(repoPath, '.git', 'objects', subdir, filename);
    
    await fs.access(objectPath);
    return true;
  } catch (error) {
    // If not found locally, check Walrus storage
    const config = await getConfig();
    
    // In simulation mode, return false if not found locally
    if (config.simulationMode) {
      return false;
    }
    
    try {
      const exists = await walrusStorage.blobExists({
        blobHash: hash,
        repositoryId: config.currentRepository
      });
      
      return exists;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Calculates the SHA-1 hash of a file without loading it entirely into memory
 * Useful for large files
 * 
 * @param {string} filePath - Path to the file
 * @returns {Promise<{hash: string, size: number}>} - The SHA-1 hash and size of the file
 */
export async function calculateFileHash(filePath) {
  const stats = await fs.stat(filePath);
  const fileSize = stats.size;
  
  // Create a SHA-1 hash object
  const hash = crypto.createHash('sha1');
  
  // Prepare the Git blob header
  const header = `blob ${fileSize}\0`;
  hash.update(header);
  
  // Create a read stream to process the file in chunks
  const readStream = createReadStream(filePath);
  
  // Process the file in chunks
  for await (const chunk of readStream) {
    hash.update(chunk);
  }
  
  // Return the hash digest in hex format
  return {
    hash: hash.digest('hex'),
    size: fileSize
  };
}

/**
 * Streams a file to create a blob without loading it entirely into memory
 * 
 * @param {string} filePath - Path to the file to store
 * @returns {Promise<{hash: string, size: number}>} - The SHA-1 hash and size of the created blob
 */
export async function createBlobFromFile(filePath) {
  const { hash, size } = await calculateFileHash(filePath);
  
  const repoPath = await getRepositoryPath();
  const objectsDir = path.join(repoPath, '.git', 'objects');
  const subdir = hash.substring(0, 2);
  const filename = hash.substring(2);
  const objectPath = path.join(objectsDir, subdir, filename);
  
  // Check if the blob already exists locally
  try {
    await fs.access(objectPath);
    // Blob already exists, return hash and size
    return { hash, size };
  } catch (error) {
    // Blob doesn't exist, create it
  }
  
  // Create the subdirectory if it doesn't exist
  await fs.mkdir(path.join(objectsDir, subdir), { recursive: true });
  
  // Create deflate stream for compression
  const deflateStream = zlib.createDeflate();
  
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
  
  // Store in Walrus in background (don't await)
  storeWalrusLargeBlob(hash, objectPath).catch(error => {
    console.error(`Background Walrus storage failed for ${hash}: ${error.message}`);
  });
  
  return { hash, size };
}

/**
 * Stores a large blob in Walrus storage by reading from the local object file
 * 
 * @param {string} hash - The SHA-1 hash of the blob
 * @param {string} objectPath - Path to the local object file
 * @returns {Promise<string>} - The transaction digest
 */
async function storeWalrusLargeBlob(hash, objectPath) {
  const config = await getConfig();
  
  // Skip Walrus storage in simulation mode
  if (config.simulationMode) {
    return 'simulation-mode-skip-walrus-storage';
  }
  
  try {
    // Read the compressed data
    const compressedData = await fs.readFile(objectPath);
    
    // Convert to base64 for transmission
    const base64Data = compressedData.toString('base64');
    
    // Split into chunks if necessary (Sui transactions have size limits)
    const CHUNK_SIZE = 100000; // Adjust based on Sui transaction size limits
    
    if (base64Data.length <= CHUNK_SIZE) {
      // Small enough for a single transaction
      const txResult = await walrusStorage.storeBlob({
        blobHash: hash,
        content: base64Data,
        repositoryId: config.currentRepository
      });
      
      return txResult.digest;
    } else {
      // Large blob needs chunking
      const totalChunks = Math.ceil(base64Data.length / CHUNK_SIZE);
      
      // Initialize chunked storage
      const initTx = await walrusStorage.initChunkedBlob({
        blobHash: hash,
        totalChunks,
        repositoryId: config.currentRepository
      });
      
      // Store each chunk
      for (let i = 0; i < totalChunks; i++) {
        const chunk = base64Data.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        
        await walrusStorage.storeBlobChunk({
          blobHash: hash,
          chunkIndex: i,
          content: chunk,
          repositoryId: config.currentRepository
        });
      }
      
      // Finalize chunked storage
      const finalizeTx = await walrusStorage.finalizeBlobChunks({
        blobHash: hash,
        repositoryId: config.currentRepository
      });
      
      return finalizeTx.digest;
    }
  } catch (error) {
    console.error('Error storing large blob in Walrus:', error);
    throw new Error(`Failed to store large blob ${hash} in Walrus storage: ${error.message}`);
  }
}

/**
 * Verifies a blob's integrity by checking its content against its hash
 * 
 * @param {string} hash - The expected SHA-1 hash
 * @param {Buffer} content - The blob content to verify
 * @returns {boolean} - True if the content matches the hash
 */
export function verifyBlob(hash, content) {
  // Ensure content is a Buffer
  const contentBuffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
  
  // Create the Git blob header
  const header = Buffer.from(`blob ${contentBuffer.length}\0`);
  const blobData = Buffer.concat([header, contentBuffer]);
  
  // Calculate the SHA-1 hash
  const calculatedHash = crypto.createHash('sha1').update(blobData).digest('hex');
  
  // Compare with the expected hash
  return calculatedHash === hash;
}

/**
 * Finds duplicate blobs based on content hash
 * Useful for deduplication and storage optimization
 * 
 * @param {Array<string>} filePaths - Array of file paths to check for duplicates
 * @returns {Promise<Object>} - Map of content hashes to arrays of duplicate file paths
 */
export async function findDuplicateBlobs(filePaths) {
  const hashToFiles = new Map();
  
  for (const filePath of filePaths) {
    try {
      const { hash } = await calculateFileHash(filePath);
      
      if (!hashToFiles.has(hash)) {
        hashToFiles.set(hash, []);
      }
      
      hashToFiles.get(hash).push(filePath);
    } catch (error) {
      console.warn(`Error processing ${filePath}: ${error.message}`);
    }
  }
  
  // Filter for only those hashes that have duplicates
  const duplicates = {};
  for (const [hash, files] of hashToFiles.entries()) {
    if (files.length > 1) {
      duplicates[hash] = files;
    }
  }
  
  return duplicates;
}

/**
 * Lists all blobs in the repository (local and Walrus)
 * 
 * @returns {Promise<Array<{hash: string, size: number, location: string}>>} - Array of blob information
 */
export async function listBlobs() {
  const repoPath = await getRepositoryPath();
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
      
      for (const file of files) {
        // Check if valid hex filename (38 characters)
        if (!/^[0-9a-f]{38}$/.test(file)) continue;
        
        const hash = subdir + file;
        const objectPath = path.join(dirPath, file);
        const objectStats = await fs.stat(objectPath);
        
        // Get the uncompressed size by reading the header
        let size;
        try {
          const data = await getBlob(hash, { contentOnly: false });
          const header = data.toString('utf8', 0, 100).split('\0')[0];
          if (header.startsWith('blob ')) {
            size = parseInt(header.substring(5).trim(), 10);
          } else {
            size = 'unknown';
          }
        } catch (error) {
          size = 'unknown';
        }
        
        blobs.push({
          hash,
          size,
          location: 'local',
          compressedSize: objectStats.size
        });
      }
    }
  } catch (error) {
    console.error('Error listing local blobs:', error);
  }
  
  // Optionally list Walrus blobs (if not in simulation mode)
  const config = await getConfig();
  if (!config.simulationMode) {
    try {
      const walrusBlobs = await walrusStorage.listBlobs({
        repositoryId: config.currentRepository
      });
      
      for (const walrusBlob of walrusBlobs) {
        // Skip if already added from local
        if (blobs.some(b => b.hash === walrusBlob.hash)) continue;
        
        blobs.push({
          hash: walrusBlob.hash,
          size: walrusBlob.size,
          location: 'walrus',
          compressedSize: walrusBlob.compressedSize
        });
      }
    } catch (error) {
      console.error('Error listing Walrus blobs:', error);
    }
  }
  
  return blobs;
}

/**
 * Migrates blobs between local and Walrus storage
 * 
 * @param {string} direction - Either 'local-to-walrus' or 'walrus-to-local'
 * @param {Array<string>} hashes - Array of blob hashes to migrate (if undefined, migrates all)
 * @returns {Promise<{success: Array<string>, failed: Array<{hash: string, error: string}>}>} - Results
 */
export async function migrateBlobs(direction, hashes) {
  const results = {
    success: [],
    failed: []
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
  
  // Process each hash
  for (const hash of hashes) {
    try {
      if (direction === 'local-to-walrus') {
        // Get local blob
        const repoPath = await getRepositoryPath();
        const subdir = hash.substring(0, 2);
        const filename = hash.substring(2);
        const objectPath = path.join(repoPath, '.git', 'objects', subdir, filename);
        
        // Store to Walrus
        await storeWalrusLargeBlob(hash, objectPath);
      } else {
        // Get from Walrus
        const blobData = await getWalrusBlob(hash, { raw: true });
        
        // Store locally
        await storeLocalBlob(hash, blobData);
      }
      
      results.success.push(hash);
    } catch (error) {
      results.failed.push({
        hash,
        error: error.message
      });
    }
  }
  
  return results;
}

export default {
  createBlob,
  getBlob,
  blobExists,
  calculateFileHash,
  createBlobFromFile,
  verifyBlob,
  findDuplicateBlobs,
  listBlobs,
  migrateBlobs
};