/**
 * Stash manager for handling stashed changes
 * Provides functionality to save, list, apply and drop stashed changes
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getWalGitDir, getCurrentRepository } from './config.js';
import { calculateFileHash, getFileMetadata, isFileModified, getIndexHash } from './working-directory.js';
import { getRepositoryStatus } from './repository.js';

/**
 * Initialize stash storage
 * @returns {string} Path to stash directory
 */
export const initializeStashStorage = () => {
  const walgitDir = getWalGitDir();
  const stashDir = path.join(walgitDir, 'stash');
  
  if (!fs.existsSync(stashDir)) {
    fs.mkdirSync(stashDir, { recursive: true });
  }
  
  return stashDir;
};

/**
 * Get stash list
 * @returns {Array} List of stashes with metadata
 */
export const getStashList = () => {
  const stashDir = initializeStashStorage();
  const stashIndexPath = path.join(stashDir, 'stash-index.json');
  
  if (!fs.existsSync(stashIndexPath)) {
    return [];
  }
  
  try {
    const stashIndexContent = fs.readFileSync(stashIndexPath, 'utf-8');
    return JSON.parse(stashIndexContent);
  } catch (error) {
    console.error('Failed to read stash index:', error.message);
    return [];
  }
};

/**
 * Generate a unique stash ID
 * @returns {string} Unique stash ID
 */
const generateStashId = () => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(4).toString('hex');
  return `stash-${timestamp}-${randomString}`;
};

/**
 * Create stash from working directory changes
 * @param {object} options - Stash options
 * @param {string} options.message - Optional stash message
 * @param {boolean} options.includeUntracked - Whether to include untracked files
 * @returns {object} Created stash metadata
 */
export const createStash = async (options = {}) => {
  const repository = await getCurrentRepository();
  if (!repository) {
    throw new Error('Not in a WalGit repository');
  }
  
  // Get current status to identify changes
  const status = await getRepositoryStatus({
    untrackedFiles: options.includeUntracked ? 'all' : 'no'
  });
  
  // Check if there are any changes to stash
  const hasChanges = status.stagedChanges.length > 0 || 
                     status.unstagedChanges.length > 0 || 
                     (options.includeUntracked && status.untrackedFiles.length > 0);
  
  if (!hasChanges) {
    throw new Error('No local changes to save');
  }
  
  // Initialize stash storage
  const stashDir = initializeStashStorage();
  const stashId = generateStashId();
  const stashPath = path.join(stashDir, stashId);
  fs.mkdirSync(stashPath, { recursive: true });
  
  // Collect changes to stash
  const stashData = {
    id: stashId,
    branch: status.currentBranch,
    message: options.message || `WIP on ${status.currentBranch}`,
    timestamp: new Date().toISOString(),
    stagedChanges: {},
    unstagedChanges: {},
    untrackedFiles: options.includeUntracked ? {} : undefined
  };
  
  // Store staged changes
  for (const file of status.stagedChanges) {
    const filePath = file.path;
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath);
      const stashFilePath = path.join(stashPath, 'staged', filePath);
      
      // Ensure directory exists
      fs.mkdirSync(path.dirname(stashFilePath), { recursive: true });
      fs.writeFileSync(stashFilePath, content);
      
      stashData.stagedChanges[filePath] = {
        hash: calculateFileHash(content),
        status: file.status,
        size: content.length
      };
    }
  }
  
  // Store unstaged changes
  for (const file of status.unstagedChanges) {
    const filePath = file.path;
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath);
      const stashFilePath = path.join(stashPath, 'unstaged', filePath);
      
      // Ensure directory exists
      fs.mkdirSync(path.dirname(stashFilePath), { recursive: true });
      fs.writeFileSync(stashFilePath, content);
      
      stashData.unstagedChanges[filePath] = {
        hash: calculateFileHash(content),
        status: file.status,
        size: content.length
      };
    }
  }
  
  // Store untracked files if requested
  if (options.includeUntracked) {
    for (const filePath of status.untrackedFiles) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath);
        const stashFilePath = path.join(stashPath, 'untracked', filePath);
        
        // Ensure directory exists
        fs.mkdirSync(path.dirname(stashFilePath), { recursive: true });
        fs.writeFileSync(stashFilePath, content);
        
        stashData.untrackedFiles[filePath] = {
          hash: calculateFileHash(content),
          size: content.length
        };
      }
    }
  }
  
  // Save stash metadata
  const stashMetadataPath = path.join(stashPath, 'metadata.json');
  fs.writeFileSync(stashMetadataPath, JSON.stringify(stashData, null, 2));
  
  // Update stash index
  const stashList = getStashList();
  stashList.unshift({
    id: stashId,
    branch: stashData.branch,
    message: stashData.message,
    timestamp: stashData.timestamp,
    filesCount: Object.keys(stashData.stagedChanges).length + 
                Object.keys(stashData.unstagedChanges).length + 
                (stashData.untrackedFiles ? Object.keys(stashData.untrackedFiles).length : 0)
  });
  
  const stashIndexPath = path.join(stashDir, 'stash-index.json');
  fs.writeFileSync(stashIndexPath, JSON.stringify(stashList, null, 2));
  
  return stashData;
};

/**
 * Apply a stash to the working directory
 * @param {object} options - Apply options
 * @param {string} options.stashId - ID of the stash to apply (default: latest stash)
 * @param {boolean} options.index - Whether to restore index state
 * @param {boolean} options.pop - Whether to drop the stash after applying
 * @returns {object} Result of the operation
 */
export const applyStash = async (options = {}) => {
  const repository = await getCurrentRepository();
  if (!repository) {
    throw new Error('Not in a WalGit repository');
  }
  
  const stashList = getStashList();
  if (stashList.length === 0) {
    throw new Error('No stash entries found');
  }
  
  // Determine which stash to apply
  let stashToApply;
  if (options.stashId) {
    stashToApply = stashList.find(stash => stash.id === options.stashId);
    if (!stashToApply) {
      throw new Error(`Stash '${options.stashId}' not found`);
    }
  } else {
    // Use the latest stash
    stashToApply = stashList[0];
  }
  
  // Load stash data
  const stashDir = initializeStashStorage();
  const stashPath = path.join(stashDir, stashToApply.id);
  
  if (!fs.existsSync(stashPath)) {
    throw new Error(`Stash data for '${stashToApply.id}' not found`);
  }
  
  const stashMetadataPath = path.join(stashPath, 'metadata.json');
  if (!fs.existsSync(stashMetadataPath)) {
    throw new Error(`Stash metadata for '${stashToApply.id}' not found`);
  }
  
  const stashData = JSON.parse(fs.readFileSync(stashMetadataPath, 'utf-8'));
  
  // Apply the stash
  const results = {
    applied: [],
    conflicts: [],
    errors: []
  };
  
  // Function to apply a single file
  const applyFile = (filePath, stashType) => {
    try {
      // Determine source file path in stash
      const stashFilePath = path.join(stashPath, stashType, filePath);
      
      if (!fs.existsSync(stashFilePath)) {
        results.errors.push({ path: filePath, error: 'File not found in stash' });
        return;
      }
      
      // Read file content from stash
      const content = fs.readFileSync(stashFilePath);
      
      // Check for conflicts with working directory
      if (fs.existsSync(filePath)) {
        const currentHash = calculateFileHash(fs.readFileSync(filePath));
        const indexHash = getIndexHash(filePath);
        
        if (indexHash && currentHash !== indexHash) {
          // File has local modifications
          results.conflicts.push(filePath);
          return;
        }
      }
      
      // Apply the change
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content);
      results.applied.push(filePath);
    } catch (error) {
      results.errors.push({ path: filePath, error: error.message });
    }
  };
  
  // Apply unstaged changes
  for (const filePath in stashData.unstagedChanges) {
    applyFile(filePath, 'unstaged');
  }
  
  // Apply staged changes if requested
  if (options.index) {
    for (const filePath in stashData.stagedChanges) {
      applyFile(filePath, 'staged');
    }
  }
  
  // Apply untracked files if they were included
  if (stashData.untrackedFiles) {
    for (const filePath in stashData.untrackedFiles) {
      applyFile(filePath, 'untracked');
    }
  }
  
  // Drop the stash if requested
  if (options.pop) {
    await dropStash({ stashId: stashToApply.id });
  }
  
  return {
    stash: stashToApply,
    results
  };
};

/**
 * Drop a stash
 * @param {object} options - Drop options
 * @param {string} options.stashId - ID of the stash to drop (default: latest stash)
 * @param {boolean} options.all - Whether to drop all stashes
 * @returns {boolean} Success status
 */
export const dropStash = async (options = {}) => {
  const stashList = getStashList();
  if (stashList.length === 0) {
    throw new Error('No stash entries found');
  }
  
  const stashDir = initializeStashStorage();
  
  if (options.all) {
    // Drop all stashes
    for (const stash of stashList) {
      const stashPath = path.join(stashDir, stash.id);
      if (fs.existsSync(stashPath)) {
        fs.rmSync(stashPath, { recursive: true, force: true });
      }
    }
    
    // Clear the stash index
    const stashIndexPath = path.join(stashDir, 'stash-index.json');
    fs.writeFileSync(stashIndexPath, JSON.stringify([], null, 2));
    
    return true;
  } else {
    // Determine which stash to drop
    let stashToDrop;
    if (options.stashId) {
      stashToDrop = stashList.find(stash => stash.id === options.stashId);
      if (!stashToDrop) {
        throw new Error(`Stash '${options.stashId}' not found`);
      }
    } else {
      // Use the latest stash
      stashToDrop = stashList[0];
    }
    
    // Remove the stash directory
    const stashPath = path.join(stashDir, stashToDrop.id);
    if (fs.existsSync(stashPath)) {
      fs.rmSync(stashPath, { recursive: true, force: true });
    }
    
    // Update the stash index
    const updatedStashList = stashList.filter(stash => stash.id !== stashToDrop.id);
    const stashIndexPath = path.join(stashDir, 'stash-index.json');
    fs.writeFileSync(stashIndexPath, JSON.stringify(updatedStashList, null, 2));
    
    return true;
  }
};

/**
 * Get details of a specific stash
 * @param {object} options - Options
 * @param {string} options.stashId - ID of the stash to show (default: latest stash)
 * @returns {object} Stash details
 */
export const showStash = async (options = {}) => {
  const stashList = getStashList();
  if (stashList.length === 0) {
    throw new Error('No stash entries found');
  }
  
  // Determine which stash to show
  let stashToShow;
  if (options.stashId) {
    stashToShow = stashList.find(stash => stash.id === options.stashId);
    if (!stashToShow) {
      throw new Error(`Stash '${options.stashId}' not found`);
    }
  } else {
    // Use the latest stash
    stashToShow = stashList[0];
  }
  
  // Load stash metadata
  const stashDir = initializeStashStorage();
  const stashPath = path.join(stashDir, stashToShow.id);
  
  if (!fs.existsSync(stashPath)) {
    throw new Error(`Stash data for '${stashToShow.id}' not found`);
  }
  
  const stashMetadataPath = path.join(stashPath, 'metadata.json');
  if (!fs.existsSync(stashMetadataPath)) {
    throw new Error(`Stash metadata for '${stashToShow.id}' not found`);
  }
  
  return JSON.parse(fs.readFileSync(stashMetadataPath, 'utf-8'));
};

/**
 * Create a new branch from a stash
 * @param {object} options - Options
 * @param {string} options.branchName - Name of the branch to create
 * @param {string} options.stashId - ID of the stash to use (default: latest stash)
 * @returns {object} Operation result
 */
export const createBranchFromStash = async (options) => {
  if (!options.branchName) {
    throw new Error('Branch name is required');
  }
  
  // First apply the stash
  const applyResult = await applyStash({
    stashId: options.stashId,
    index: true
  });
  
  // Now we need to create a branch and commit the changes
  // This would typically use other WalGit functions, but for now we'll just return the apply result
  
  return {
    stash: applyResult.stash,
    applied: applyResult.results,
    branchName: options.branchName,
    // Branch creation would happen here using existing WalGit functionality
  };
};