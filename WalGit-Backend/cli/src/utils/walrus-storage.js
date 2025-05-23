import fs from 'fs';
import path from 'path';
import axios from 'axios';
import chalk from 'chalk';
import { getWalletConfig } from './config.js';
import { initializeWallet } from './auth.js';

// Walrus API endpoint (to be configured by environment variable)
const WALRUS_API_ENDPOINT = process.env.WALRUS_API_ENDPOINT || 'https://api.walrus.storage';

/**
 * Upload a file to Walrus storage
 * @param {object} options - Upload options
 * @param {string} options.filePath - Path to the file
 * @param {Buffer} options.content - File content (alternative to filePath)
 * @param {string} options.mimeType - MIME type of the file
 * @returns {Promise<object>} Upload result with blob ID
 */
export const uploadToWalrus = async (options) => {
  const wallet = await initializeWallet();

  try {
    let fileContent;
    let fileName;

    if (options.filePath) {
      // Read file from disk
      fileContent = fs.readFileSync(options.filePath);
      fileName = path.basename(options.filePath);
    } else if (options.content) {
      // Use provided content
      fileContent = options.content;
      fileName = `blob-${Date.now()}`;
    } else {
      throw new Error('Either filePath or content must be provided');
    }

    // Prepare form data
    const formData = new FormData();
    const blob = new Blob([fileContent], { type: options.mimeType || 'application/octet-stream' });
    formData.append('file', blob, fileName);

    // Get authentication token
    const authToken = await getWalrusAuthToken(wallet);

    // Upload to Walrus
    const response = await axios.post(`${WALRUS_API_ENDPOINT}/upload`, formData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    // Return blob ID and metadata
    return {
      blobId: response.data.blobId,
      size: fileContent.length,
      hash: response.data.hash,
      url: response.data.url
    };
  } catch (error) {
    console.error(chalk.red('Failed to upload to Walrus:'), error.message);
    throw error;
  }
};

/**
 * Download a file from Walrus storage
 * @param {string} blobId - Walrus blob ID
 * @param {string} [outputPath] - Path to save the file (optional)
 * @returns {Promise<Buffer|object>} File content as Buffer or write result
 */
export const downloadFromWalrus = async (blobId, outputPath = null) => {
  const wallet = await initializeWallet();

  try {
    // Get authentication token
    const authToken = await getWalrusAuthToken(wallet);

    // Download from Walrus
    const response = await axios.get(`${WALRUS_API_ENDPOINT}/blob/${blobId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      responseType: 'arraybuffer'
    });

    // If output path provided, write to file
    if (outputPath) {
      // Ensure directory exists
      const dir = path.dirname(outputPath);
      fs.mkdirSync(dir, { recursive: true });
      
      // Write file to disk
      fs.writeFileSync(outputPath, Buffer.from(response.data));
      
      return {
        success: true,
        path: outputPath,
        size: response.data.length
      };
    }

    // Otherwise return content as buffer
    return Buffer.from(response.data);
  } catch (error) {
    console.error(chalk.red('Failed to download from Walrus:'), error.message);
    throw error;
  }
};

/**
 * Get Walrus authentication token
 * @param {object} wallet - Wallet instance
 * @returns {Promise<string>} Authentication token
 */
export const getWalrusAuthToken = async (wallet) => {
  try {
    // Generate signature for authentication
    const timestamp = Date.now().toString();
    const message = `walrus-auth-${timestamp}`;
    const signature = await wallet.signMessage(message);

    // Exchange signature for token
    const response = await axios.post(`${WALRUS_API_ENDPOINT}/auth`, {
      address: wallet.address,
      timestamp,
      signature,
      message
    });

    return response.data.token;
  } catch (error) {
    console.error(chalk.red('Failed to get Walrus authentication token:'), error.message);
    throw error;
  }
};

/**
 * Check if a blob exists in Walrus storage
 * @param {string} blobId - Walrus blob ID
 * @returns {Promise<boolean>} Whether the blob exists
 */
export const checkBlobExists = async (blobId) => {
  const wallet = await initializeWallet();

  try {
    // Get authentication token
    const authToken = await getWalrusAuthToken(wallet);

    // Check blob status
    const response = await axios.head(`${WALRUS_API_ENDPOINT}/blob/${blobId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    return response.status === 200;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return false;
    }
    console.error(chalk.red('Failed to check blob existence:'), error.message);
    throw error;
  }
};

/**
 * Delete a blob from Walrus storage
 * @param {string} blobId - Walrus blob ID
 * @returns {Promise<boolean>} Whether the deletion was successful
 */
export const deleteFromWalrus = async (blobId) => {
  const wallet = await initializeWallet();

  try {
    // Get authentication token
    const authToken = await getWalrusAuthToken(wallet);

    // Delete from Walrus
    const response = await axios.delete(`${WALRUS_API_ENDPOINT}/blob/${blobId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    return response.status === 200 || response.status === 204;
  } catch (error) {
    console.error(chalk.red('Failed to delete from Walrus:'), error.message);
    throw error;
  }
};