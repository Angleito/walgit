/**
 * @fileoverview Enhanced Walrus SDK integration for WalGit
 * Implements encryption/decryption workflows with SEAL and commit manifest management
 * using direct Walrus SDK operations
 */

import { WalrusClient } from '@mysten/walrus';
import crypto from 'crypto';
import { SealClient } from '@mysten/seal';
import { getConfig } from './config.js';
import { setTimeout } from 'timers/promises';

// Constants for SDK operations
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const DEK_SIZE = 32; // 256 bits for AES-256-GCM
const IV_SIZE = 12; // 96 bits for GCM
const TAG_SIZE = 16; // 128 bits for GCM

/**
 * Commit manifest structure for repository state
 */
export class CommitManifest {
  constructor(data = {}) {
    this.timestamp = data.timestamp || new Date().toISOString();
    this.author = data.author || '';
    this.message = data.message || '';
    this.parent_commit_cid = data.parent_commit_cid || null;
    this.tree = data.tree || {}; // filepath -> walrus_cid mapping
    this.metadata = data.metadata || {};
  }

  /**
   * Add a file to the manifest
   * @param {string} filePath - Path of the file
   * @param {string} walrusCid - Walrus CID of encrypted file
   * @param {Object} metadata - Additional file metadata
   */
  addFile(filePath, walrusCid, metadata = {}) {
    this.tree[filePath] = {
      cid: walrusCid,
      size: metadata.size || 0,
      hash: metadata.hash || '',
      encrypted: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Remove a file from the manifest
   * @param {string} filePath - Path of the file to remove
   */
  removeFile(filePath) {
    delete this.tree[filePath];
  }

  /**
   * Get all file paths in the manifest
   * @returns {string[]} - Array of file paths
   */
  getFilePaths() {
    return Object.keys(this.tree);
  }

  /**
   * Convert to JSON string
   * @returns {string} - JSON representation
   */
  toJSON() {
    return JSON.stringify({
      timestamp: this.timestamp,
      author: this.author,
      message: this.message,
      parent_commit_cid: this.parent_commit_cid,
      tree: this.tree,
      metadata: this.metadata
    }, null, 2);
  }

  /**
   * Create from JSON string
   * @param {string} jsonString - JSON representation
   * @returns {CommitManifest} - New CommitManifest instance
   */
  static fromJSON(jsonString) {
    const data = JSON.parse(jsonString);
    return new CommitManifest(data);
  }
}

/**
 * Enhanced Walrus SDK client with SEAL integration
 */
export class WalGitWalrusClient {
  constructor() {
    this.config = getConfig();
    this.walrusClient = null;
    this.sealClient = null;
    this.initialized = false;
  }

  /**
   * Initialize the Walrus and SEAL clients
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize Walrus client
      this.walrusClient = new WalrusClient({
        endpoint: this.config.walrus?.endpoint || 'https://api.walrus.storage',
        apiKey: this.config.walrus?.apiKey,
        network: this.config.sui?.network || 'testnet'
      });

      // Initialize SEAL client for encryption
      this.sealClient = new SealClient({
        endpoint: this.config.seal?.endpoint || 'https://api.seal.storage',
        apiKey: this.config.seal?.apiKey,
        network: this.config.sui?.network || 'testnet'
      });

      this.initialized = true;
      console.log('Walrus SDK and SEAL clients initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Walrus SDK clients:', error);
      throw new Error(`Client initialization failed: ${error.message}`);
    }
  }

  /**
   * Generate a new Data Encryption Key (DEK)
   * @returns {Buffer} - 256-bit DEK
   */
  generateDEK() {
    return crypto.randomBytes(DEK_SIZE);
  }

  /**
   * Encrypt file content using AES-256-GCM
   * @param {Buffer} content - File content to encrypt
   * @param {Buffer} dek - Data Encryption Key
   * @returns {Object} - Encrypted content with IV and tag
   */
  encryptContent(content, dek) {
    const iv = crypto.randomBytes(IV_SIZE);
    const cipher = crypto.createCipherGCM('aes-256-gcm', dek);
    cipher.setAAD(Buffer.from('WalGit-v1')); // Additional authenticated data

    let encrypted = cipher.update(content);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv,
      tag,
      algorithm: 'aes-256-gcm',
      version: 'v1'
    };
  }

  /**
   * Decrypt file content using AES-256-GCM
   * @param {Object} encryptedData - Encrypted content with IV and tag
   * @param {Buffer} dek - Data Encryption Key
   * @returns {Buffer} - Decrypted content
   */
  decryptContent(encryptedData, dek) {
    const { encrypted, iv, tag, algorithm } = encryptedData;
    
    if (algorithm !== 'aes-256-gcm') {
      throw new Error(`Unsupported encryption algorithm: ${algorithm}`);
    }

    const decipher = crypto.createDecipherGCM('aes-256-gcm', dek);
    decipher.setAAD(Buffer.from('WalGit-v1'));
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted;
  }

  /**
   * Encrypt DEK using SEAL threshold encryption
   * @param {Buffer} dek - Data Encryption Key to encrypt
   * @param {string} policyId - SEAL policy ID for the repository
   * @returns {Promise<string>} - Encrypted DEK as base64 string
   */
  async encryptDEKWithSEAL(dek, policyId) {
    await this.initialize();

    try {
      console.log(`Encrypting DEK with SEAL policy: ${policyId}`);
      
      const encryptedDEK = await this.sealClient.encrypt({
        data: dek.toString('base64'),
        policyId: policyId,
        threshold: 2, // 2-of-3 threshold encryption
        shares: 3
      });

      return encryptedDEK.ciphertext;
    } catch (error) {
      console.error('SEAL DEK encryption failed:', error);
      throw new Error(`SEAL encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt DEK using SEAL threshold encryption
   * @param {string} encryptedDEK - Encrypted DEK as base64 string
   * @param {string} policyId - SEAL policy ID for the repository
   * @param {Object} userWallet - User wallet for signing
   * @returns {Promise<Buffer>} - Decrypted DEK
   */
  async decryptDEKWithSEAL(encryptedDEK, policyId, userWallet) {
    await this.initialize();

    try {
      console.log(`Decrypting DEK with SEAL policy: ${policyId}`);
      
      // User needs to sign a session key for SEAL decryption
      const sessionKey = await userWallet.signPersonalMessage({
        message: `Decrypt repository data for policy: ${policyId}`,
        account: userWallet.currentAccount
      });

      const decryptedData = await this.sealClient.decrypt({
        ciphertext: encryptedDEK,
        policyId: policyId,
        sessionKey: sessionKey.signature
      });

      return Buffer.from(decryptedData.plaintext, 'base64');
    } catch (error) {
      console.error('SEAL DEK decryption failed:', error);
      throw new Error(`SEAL decryption failed: ${error.message}`);
    }
  }

  /**
   * Upload encrypted file to Walrus
   * @param {Buffer} content - File content to encrypt and upload
   * @param {Buffer} dek - Data Encryption Key
   * @param {Object} options - Upload options
   * @returns {Promise<string>} - Walrus CID
   */
  async uploadFile(content, dek, options = {}) {
    await this.initialize();

    // Encrypt content
    const encryptedData = this.encryptContent(content, dek);
    
    // Prepare encrypted payload
    const payload = Buffer.concat([
      Buffer.from('WALGIT1'), // Magic header
      encryptedData.iv,
      encryptedData.tag,
      encryptedData.encrypted
    ]);

    let lastError;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Retrying upload attempt ${attempt + 1}/${MAX_RETRIES}...`);
          await setTimeout(RETRY_DELAY_MS * Math.pow(2, attempt));
        }

        // Use Walrus SDK to write blob (this involves ~2200 requests)
        console.log(`Uploading ${payload.length} bytes to Walrus...`);
        const result = await this.walrusClient.writeBlob(payload, {
          contentType: 'application/octet-stream',
          ...options
        });

        console.log(`File uploaded to Walrus with CID: ${result.cid}`);
        return result.cid;

      } catch (error) {
        lastError = error;
        console.error(`Upload attempt ${attempt + 1} failed:`, error.message);
      }
    }

    throw new Error(`Failed to upload after ${MAX_RETRIES} attempts: ${lastError.message}`);
  }

  /**
   * Download and decrypt file from Walrus
   * @param {string} cid - Walrus CID
   * @param {Buffer} dek - Data Encryption Key
   * @returns {Promise<Buffer>} - Decrypted file content
   */
  async downloadFile(cid, dek) {
    await this.initialize();

    let lastError;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Retrying download attempt ${attempt + 1}/${MAX_RETRIES}...`);
          await setTimeout(RETRY_DELAY_MS * Math.pow(2, attempt));
        }

        // Use Walrus SDK to read blob (this involves ~335 requests)
        console.log(`Downloading from Walrus CID: ${cid}...`);
        const payload = await this.walrusClient.readBlob(cid);

        // Verify magic header
        const header = payload.slice(0, 7);
        if (header.toString() !== 'WALGIT1') {
          throw new Error('Invalid file format - missing WalGit header');
        }

        // Extract encryption components
        const iv = payload.slice(7, 7 + IV_SIZE);
        const tag = payload.slice(7 + IV_SIZE, 7 + IV_SIZE + TAG_SIZE);
        const encrypted = payload.slice(7 + IV_SIZE + TAG_SIZE);

        // Decrypt content
        const encryptedData = {
          encrypted,
          iv,
          tag,
          algorithm: 'aes-256-gcm',
          version: 'v1'
        };

        const decrypted = this.decryptContent(encryptedData, dek);
        console.log(`File decrypted successfully, size: ${decrypted.length} bytes`);
        
        return decrypted;

      } catch (error) {
        lastError = error;
        console.error(`Download attempt ${attempt + 1} failed:`, error.message);
      }
    }

    throw new Error(`Failed to download after ${MAX_RETRIES} attempts: ${lastError.message}`);
  }

  /**
   * Create and upload commit manifest
   * @param {CommitManifest} manifest - Commit manifest to upload
   * @param {Buffer} dek - Data Encryption Key
   * @returns {Promise<string>} - Walrus CID of the manifest
   */
  async createAndUploadCommitManifest(manifest, dek) {
    const manifestJSON = manifest.toJSON();
    const manifestBuffer = Buffer.from(manifestJSON, 'utf8');
    
    console.log('Uploading commit manifest to Walrus...');
    const cid = await this.uploadFile(manifestBuffer, dek, {
      contentType: 'application/json'
    });
    
    console.log(`Commit manifest uploaded with CID: ${cid}`);
    return cid;
  }

  /**
   * Download and parse commit manifest
   * @param {string} cid - Walrus CID of the manifest
   * @param {Buffer} dek - Data Encryption Key
   * @returns {Promise<CommitManifest>} - Parsed commit manifest
   */
  async downloadCommitManifest(cid, dek) {
    console.log(`Downloading commit manifest from CID: ${cid}`);
    const manifestBuffer = await this.downloadFile(cid, dek);
    const manifestJSON = manifestBuffer.toString('utf8');
    
    return CommitManifest.fromJSON(manifestJSON);
  }

  /**
   * Batch upload multiple files
   * @param {Array<{path: string, content: Buffer}>} files - Files to upload
   * @param {Buffer} dek - Data Encryption Key
   * @param {Function} progressCallback - Progress callback (optional)
   * @returns {Promise<Object>} - Mapping of file paths to CIDs
   */
  async batchUploadFiles(files, dek, progressCallback) {
    const results = {};
    const total = files.length;
    
    console.log(`Starting batch upload of ${total} files...`);
    
    for (let i = 0; i < files.length; i++) {
      const { path, content } = files[i];
      
      try {
        console.log(`Uploading file ${i + 1}/${total}: ${path}`);
        const cid = await this.uploadFile(content, dek);
        results[path] = cid;
        
        if (progressCallback) {
          progressCallback({
            completed: i + 1,
            total,
            current: path,
            success: true
          });
        }
        
        // Small delay to prevent overwhelming the network
        await setTimeout(100);
      } catch (error) {
        console.error(`Failed to upload ${path}:`, error.message);
        results[path] = { error: error.message };
        
        if (progressCallback) {
          progressCallback({
            completed: i + 1,
            total,
            current: path,
            success: false,
            error: error.message
          });
        }
      }
    }
    
    console.log(`Batch upload completed. Success: ${Object.keys(results).filter(k => typeof results[k] === 'string').length}/${total}`);
    return results;
  }

  /**
   * Complete encryption and upload workflow for repository files
   * @param {Array<{path: string, content: Buffer}>} files - Files to process
   * @param {string} policyId - SEAL policy ID
   * @param {CommitManifest} manifest - Commit manifest to update
   * @returns {Promise<{manifestCid: string, encryptedDekCid: string, dek: Buffer}>}
   */
  async encryptAndUploadFiles(files, policyId, manifest) {
    // Generate new DEK for this commit
    const dek = this.generateDEK();
    console.log('Generated new DEK for commit');

    // Upload files with progress tracking
    const uploadResults = await this.batchUploadFiles(files, dek, (progress) => {
      console.log(`Upload progress: ${progress.completed}/${progress.total} - ${progress.current}`);
    });

    // Update manifest with file CIDs
    for (const [filePath, result] of Object.entries(uploadResults)) {
      if (typeof result === 'string') {
        // Successful upload
        const fileData = files.find(f => f.path === filePath);
        manifest.addFile(filePath, result, {
          size: fileData.content.length,
          hash: crypto.createHash('sha256').update(fileData.content).digest('hex')
        });
      } else {
        console.error(`Failed to upload ${filePath}: ${result.error}`);
        throw new Error(`File upload failed: ${filePath}`);
      }
    }

    // Upload manifest
    const manifestCid = await this.createAndUploadCommitManifest(manifest, dek);

    // Encrypt DEK with SEAL
    const encryptedDEK = await this.encryptDEKWithSEAL(dek, policyId);

    // Upload encrypted DEK to Walrus
    const encryptedDEKBuffer = Buffer.from(encryptedDEK, 'base64');
    const encryptedDekCid = await this.walrusClient.writeBlob(encryptedDEKBuffer, {
      contentType: 'application/octet-stream'
    });

    return {
      manifestCid,
      encryptedDekCid: encryptedDekCid.cid,
      dek
    };
  }

  /**
   * Complete decryption and download workflow for repository files
   * @param {string} manifestCid - Walrus CID of commit manifest
   * @param {string} encryptedDekCid - Walrus CID of encrypted DEK
   * @param {string} policyId - SEAL policy ID
   * @param {Object} userWallet - User wallet for SEAL decryption
   * @returns {Promise<{files: Array<{path: string, content: Buffer}>, manifest: CommitManifest}>}
   */
  async decryptAndDownloadFiles(manifestCid, encryptedDekCid, policyId, userWallet) {
    // Download encrypted DEK
    console.log(`Downloading encrypted DEK from CID: ${encryptedDekCid}`);
    const encryptedDEKBuffer = await this.walrusClient.readBlob(encryptedDekCid);
    const encryptedDEK = encryptedDEKBuffer.toString('base64');

    // Decrypt DEK using SEAL
    const dek = await this.decryptDEKWithSEAL(encryptedDEK, policyId, userWallet);
    console.log('DEK decrypted successfully with SEAL');

    // Download and decrypt manifest
    const manifest = await this.downloadCommitManifest(manifestCid, dek);
    console.log(`Manifest downloaded with ${Object.keys(manifest.tree).length} files`);

    // Download all files
    const files = [];
    const filePaths = manifest.getFilePaths();
    
    console.log(`Downloading ${filePaths.length} files...`);
    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      const fileInfo = manifest.tree[filePath];
      
      try {
        console.log(`Downloading file ${i + 1}/${filePaths.length}: ${filePath}`);
        const content = await this.downloadFile(fileInfo.cid, dek);
        files.push({ path: filePath, content });
      } catch (error) {
        console.error(`Failed to download ${filePath}:`, error.message);
        throw new Error(`File download failed: ${filePath}`);
      }
    }

    return { files, manifest };
  }
}

// Export singleton instance
export const walrusClient = new WalGitWalrusClient();