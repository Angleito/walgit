/**
 * Input validation utility for WalGit CLI commands
 * Provides validation functions for various command parameters
 */

import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { getConfig } from './config.js';

const fsAccess = promisify(fs.access);

/**
 * Validates a repository path
 * @param {string} repoPath - Repository path to validate
 * @returns {Promise<{valid: boolean, reason: string|null}>} Validation result
 */
export async function validateRepositoryPath(repoPath) {
  if (!repoPath) {
    return { valid: false, reason: 'Repository path cannot be empty' };
  }

  // Check for path traversal attacks
  const normalized = path.normalize(repoPath);
  if (normalized.includes('..')) {
    return { valid: false, reason: 'Invalid repository path: contains path traversal sequences' };
  }

  try {
    // Check if the directory exists
    await fsAccess(repoPath, fs.constants.F_OK);
    
    // Check if it's a WalGit repository
    const configPath = path.join(repoPath, '.walgit', 'config');
    await fsAccess(configPath, fs.constants.F_OK);
    
    return { valid: true, reason: null };
  } catch (error) {
    return { valid: false, reason: 'Not a valid WalGit repository' };
  }
}

/**
 * Validates a commit ID
 * @param {string} commitId - Commit ID to validate
 * @returns {{valid: boolean, reason: string|null}} Validation result
 */
export function validateCommitId(commitId) {
  if (!commitId) {
    return { valid: false, reason: 'Commit ID cannot be empty' };
  }
  
  // Check if the format matches a SHA-1 hash
  const commitIdRegex = /^[0-9a-f]{40}$/i;
  if (!commitIdRegex.test(commitId) && !commitId.match(/^[0-9a-f]{7,8}$/i)) {
    return { valid: false, reason: 'Invalid commit ID format' };
  }
  
  return { valid: true, reason: null };
}

/**
 * Validates a branch name
 * @param {string} branchName - Branch name to validate
 * @returns {{valid: boolean, reason: string|null}} Validation result
 */
export function validateBranchName(branchName) {
  if (!branchName) {
    return { valid: false, reason: 'Branch name cannot be empty' };
  }
  
  // Git branch naming rules
  const branchNameRegex = /^(?!\/|\.|\.\.)(?!.*\/\.\.?)(?!.*\/\/)[^\s~^:?*\\]+$/;
  if (!branchNameRegex.test(branchName)) {
    return { 
      valid: false, 
      reason: 'Invalid branch name. Branch names cannot contain spaces, ~, ^, :, ?, *, [, \\, or start with "." or ".."'
    };
  }
  
  return { valid: true, reason: null };
}

/**
 * Validates a file path
 * @param {string} filePath - File path to validate
 * @param {boolean} mustExist - Whether the file must exist
 * @returns {Promise<{valid: boolean, reason: string|null}>} Validation result
 */
export async function validateFilePath(filePath, mustExist = true) {
  if (!filePath) {
    return { valid: false, reason: 'File path cannot be empty' };
  }
  
  // Check for path traversal attacks
  const normalized = path.normalize(filePath);
  if (normalized.includes('..')) {
    return { valid: false, reason: 'Invalid file path: contains path traversal sequences' };
  }
  
  if (mustExist) {
    try {
      await fsAccess(filePath, fs.constants.F_OK);
      return { valid: true, reason: null };
    } catch (error) {
      return { valid: false, reason: 'File does not exist' };
    }
  }
  
  return { valid: true, reason: null };
}

/**
 * Validates a tag name
 * @param {string} tagName - Tag name to validate
 * @returns {{valid: boolean, reason: string|null}} Validation result
 */
export function validateTagName(tagName) {
  if (!tagName) {
    return { valid: false, reason: 'Tag name cannot be empty' };
  }
  
  // Git tag naming rules (more permissive than branch names)
  const tagNameRegex = /^[^\s~^:?*\\]+$/;
  if (!tagNameRegex.test(tagName)) {
    return { 
      valid: false, 
      reason: 'Invalid tag name. Tag names cannot contain spaces, ~, ^, :, ?, *, or \\'
    };
  }
  
  return { valid: true, reason: null };
}

/**
 * Validates a remote name
 * @param {string} remoteName - Remote name to validate
 * @returns {{valid: boolean, reason: string|null}} Validation result
 */
export function validateRemoteName(remoteName) {
  if (!remoteName) {
    return { valid: false, reason: 'Remote name cannot be empty' };
  }
  
  // Git remote naming rules
  const remoteNameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!remoteNameRegex.test(remoteName)) {
    return { 
      valid: false, 
      reason: 'Invalid remote name. Remote names can only contain alphanumeric characters, underscores, and hyphens'
    };
  }
  
  return { valid: true, reason: null };
}

/**
 * Validates a remote URL
 * @param {string} remoteUrl - Remote URL to validate
 * @returns {{valid: boolean, reason: string|null}} Validation result
 */
export function validateRemoteUrl(remoteUrl) {
  if (!remoteUrl) {
    return { valid: false, reason: 'Remote URL cannot be empty' };
  }
  
  try {
    // Check if it's a valid URL
    new URL(remoteUrl);
    return { valid: true, reason: null };
  } catch (error) {
    return { valid: false, reason: 'Invalid remote URL format' };
  }
}

/**
 * Validates PR input data
 * @param {Object} prData - Pull request data to validate
 * @returns {{valid: boolean, reason: string|null}} Validation result
 */
export function validatePRInput(prData) {
  if (!prData.title || prData.title.trim() === '') {
    return { valid: false, reason: 'Pull request title cannot be empty' };
  }
  
  if (!prData.sourceBranch || prData.sourceBranch.trim() === '') {
    return { valid: false, reason: 'Source branch cannot be empty' };
  }
  
  if (!prData.targetBranch || prData.targetBranch.trim() === '') {
    return { valid: false, reason: 'Target branch cannot be empty' };
  }
  
  if (prData.sourceBranch === prData.targetBranch) {
    return { valid: false, reason: 'Source and target branches cannot be the same' };
  }
  
  // Validate branch names
  const sourceBranchResult = validateBranchName(prData.sourceBranch);
  if (!sourceBranchResult.valid) {
    return { valid: false, reason: `Source branch: ${sourceBranchResult.reason}` };
  }
  
  const targetBranchResult = validateBranchName(prData.targetBranch);
  if (!targetBranchResult.valid) {
    return { valid: false, reason: `Target branch: ${targetBranchResult.reason}` };
  }
  
  return { valid: true, reason: null };
}

/**
 * Validates a number is within a range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {string} paramName - Parameter name for error message
 * @returns {{valid: boolean, reason: string|null}} Validation result
 */
export function validateNumberRange(value, min, max, paramName = 'Value') {
  const num = Number(value);
  
  if (isNaN(num)) {
    return { valid: false, reason: `${paramName} must be a number` };
  }
  
  if (num < min || num > max) {
    return { valid: false, reason: `${paramName} must be between ${min} and ${max}` };
  }
  
  return { valid: true, reason: null };
}

/**
 * Validates storage quota parameters
 * @param {Object} quota - Storage quota parameters
 * @returns {{valid: boolean, reason: string|null}} Validation result
 */
export function validateStorageQuota(quota) {
  if (!quota) {
    return { valid: false, reason: 'Storage quota parameters are required' };
  }
  
  if (quota.maxBytes) {
    const bytesResult = validateNumberRange(
      quota.maxBytes, 
      1024 * 1024, // 1MB minimum
      1024 * 1024 * 1024 * 10, // 10GB maximum
      'Maximum storage bytes'
    );
    
    if (!bytesResult.valid) {
      return bytesResult;
    }
  }
  
  if (quota.maxFiles) {
    const filesResult = validateNumberRange(
      quota.maxFiles,
      1,
      1000000, // 1 million files maximum
      'Maximum file count'
    );
    
    if (!filesResult.valid) {
      return filesResult;
    }
  }
  
  return { valid: true, reason: null };
}

/**
 * Validates and sanitizes string input
 * @param {string} input - String to validate and sanitize
 * @param {Object} options - Validation options
 * @param {number} options.minLength - Minimum string length
 * @param {number} options.maxLength - Maximum string length
 * @param {RegExp} options.pattern - Regular expression pattern to match
 * @param {boolean} options.trim - Whether to trim the string
 * @param {string} options.paramName - Parameter name for error message
 * @returns {{valid: boolean, reason: string|null, sanitized: string|null}} Validation result with sanitized value
 */
export function validateString(input, options = {}) {
  const {
    minLength = 0,
    maxLength = Number.MAX_SAFE_INTEGER,
    pattern = null,
    trim = true,
    paramName = 'String'
  } = options;
  
  if (input === undefined || input === null) {
    return { 
      valid: false, 
      reason: `${paramName} cannot be empty`, 
      sanitized: null 
    };
  }
  
  // Convert to string if not already
  let sanitized = String(input);
  
  // Trim if specified
  if (trim) {
    sanitized = sanitized.trim();
  }
  
  // Check length
  if (sanitized.length < minLength) {
    return { 
      valid: false, 
      reason: `${paramName} must be at least ${minLength} characters`, 
      sanitized: null 
    };
  }
  
  if (sanitized.length > maxLength) {
    return { 
      valid: false, 
      reason: `${paramName} must be no more than ${maxLength} characters`, 
      sanitized: null 
    };
  }
  
  // Check pattern
  if (pattern && !pattern.test(sanitized)) {
    return { 
      valid: false, 
      reason: `${paramName} does not match the required format`, 
      sanitized: null 
    };
  }
  
  return { valid: true, reason: null, sanitized };
}

export default {
  validateRepositoryPath,
  validateCommitId,
  validateBranchName,
  validateFilePath,
  validateTagName,
  validateRemoteName,
  validateRemoteUrl,
  validatePRInput,
  validateNumberRange,
  validateStorageQuota,
  validateString
};