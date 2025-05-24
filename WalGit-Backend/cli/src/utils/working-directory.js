import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import crypto from 'crypto';
import { getWalGitDir, getCurrentRepository } from './config.js';

/**
 * Validate and get the current working directory
 * @param {string} [customPath] - Optional custom path to validate instead of cwd
 * @returns {string} Validated directory path
 * @throws {Error} If directory is not accessible
 */
export const validateWorkingDirectory = (customPath = null) => {
  const dirPath = customPath || process.cwd();
  
  try {
    const stat = fs.statSync(dirPath);
    if (!stat.isDirectory()) {
      throw new Error(`Path is not a directory: ${dirPath}`);
    }
    
    // Test write permissions by creating a temporary file
    const testFile = path.join(dirPath, '.walgit-write-test-' + Date.now());
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    
    return path.resolve(dirPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Directory does not exist: ${dirPath}`);
    } else if (error.code === 'EACCES' || error.code === 'EPERM') {
      throw new Error(`Permission denied accessing directory: ${dirPath}`);
    } else if (error.message.includes('.walgit-write-test')) {
      throw new Error(`Directory is not writable: ${dirPath}`);
    } else {
      throw new Error(`Cannot access directory: ${dirPath} (${error.message})`);
    }
  }
};

/**
 * Check if current directory is a WalGit repository
 * @param {string} [dirPath] - Optional directory path to check
 * @returns {boolean} True if directory contains .walgit folder
 */
export const isWalGitRepository = (dirPath = null) => {
  const checkDir = dirPath || process.cwd();
  const walgitDir = path.join(checkDir, '.walgit');
  return fs.existsSync(walgitDir) && fs.statSync(walgitDir).isDirectory();
};

/**
 * Find the root of the WalGit repository by traversing up the directory tree
 * @param {string} [startPath] - Starting directory path
 * @returns {string|null} Repository root path or null if not found
 */
export const findRepositoryRoot = (startPath = null) => {
  let currentPath = startPath || process.cwd();
  
  // Traverse up the directory tree
  while (currentPath !== path.dirname(currentPath)) {
    if (isWalGitRepository(currentPath)) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }
  
  return null;
};

/**
 * Ensure directory exists and is writable
 * @param {string} dirPath - Directory path to ensure
 * @returns {boolean} True if directory is ready for use
 */
export const ensureDirectory = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Validate the directory
    validateWorkingDirectory(dirPath);
    return true;
  } catch (error) {
    console.error(chalk.red(`Cannot ensure directory ${dirPath}:`), error.message);
    return false;
  }
};

/**
 * Calculate hash for a file
 * @param {string|Buffer} content - File content
 * @returns {string} Hash string
 */
export const calculateFileHash = (content) => {
  return crypto.createHash('sha256').update(content).digest('hex');
};

/**
 * Check if a file has been modified 
 * @param {string} filePath - Path to the file
 * @param {string} originalHash - Original hash of the file
 * @returns {boolean} Whether the file has been modified
 */
export const isFileModified = (filePath, originalHash) => {
  if (!fs.existsSync(filePath)) {
    return true; // File deleted
  }
  
  const currentContent = fs.readFileSync(filePath);
  const currentHash = calculateFileHash(currentContent);
  
  return currentHash !== originalHash;
};

/**
 * Get file metadata from the working directory
 * @param {string} filePath - Path to the file
 * @returns {object|null} File metadata or null if file doesn't exist
 */
export const getFileMetadata = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const content = fs.readFileSync(filePath);
  const stats = fs.statSync(filePath);
  
  return {
    path: filePath,
    hash: calculateFileHash(content),
    size: stats.size,
    lastModified: stats.mtime.toISOString()
  };
};

/**
 * Track file in the index
 * @param {string} filePath - Path to the file
 * @param {string} hash - File hash
 * @returns {boolean} Success status
 */
export const trackFile = (filePath, hash) => {
  const walgitDir = getWalGitDir();
  const indexPath = path.join(walgitDir, 'index');
  
  let index = {};
  
  // Read existing index if it exists
  if (fs.existsSync(indexPath)) {
    try {
      const indexContent = fs.readFileSync(indexPath, 'utf-8');
      index = JSON.parse(indexContent);
    } catch (error) {
      console.error(chalk.red('Failed to read index:'), error.message);
      // Create a new index if parsing fails
      index = {};
    }
  }
  
  // Normalize path for consistency
  const normalizedPath = path.normalize(filePath).replace(/\\/g, '/');
  
  // Update index with the file information
  index[normalizedPath] = {
    hash,
    lastUpdated: new Date().toISOString()
  };
  
  // Write updated index
  try {
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    return true;
  } catch (error) {
    console.error(chalk.red('Failed to write index:'), error.message);
    return false;
  }
};

/**
 * Check if a path would conflict with existing files
 * @param {string} filePath - Path to check
 * @param {boolean} isDirectory - Whether the path is a directory
 * @returns {array} List of conflicts if any
 */
export const checkPathConflicts = (filePath, isDirectory = false) => {
  const conflicts = [];
  const normalizedPath = path.normalize(filePath).replace(/\\/g, '/');
  
  if (!isDirectory && fs.existsSync(filePath)) {
    // Check if the existing item is of a different type
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      conflicts.push(`Path exists as a directory: ${normalizedPath}`);
    } else if (isFileModified(filePath, getIndexHash(filePath))) {
      conflicts.push(`File has local modifications: ${normalizedPath}`);
    }
  } else if (isDirectory) {
    // Check if there's a file at this path
    if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
      conflicts.push(`Path exists as a file: ${normalizedPath}`);
    }
  }
  
  return conflicts;
};

/**
 * Get the hash of a file from the index
 * @param {string} filePath - Path to the file
 * @returns {string|null} Hash from index or null if not found
 */
export const getIndexHash = (filePath) => {
  const walgitDir = getWalGitDir();
  const indexPath = path.join(walgitDir, 'index');
  
  if (!fs.existsSync(indexPath)) {
    return null;
  }
  
  try {
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    const index = JSON.parse(indexContent);
    
    // Normalize path for consistency
    const normalizedPath = path.normalize(filePath).replace(/\\/g, '/');
    
    return index[normalizedPath]?.hash || null;
  } catch (error) {
    console.error(chalk.red('Failed to read index:'), error.message);
    return null;
  }
};

/**
 * Create a backup of a file before modifying it
 * @param {string} filePath - Path to the file
 * @returns {string|null} Backup path or null if backup failed
 */
export const backupFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const walgitDir = getWalGitDir();
  const backupDir = path.join(walgitDir, 'backup');
  
  // Ensure backup directory exists
  fs.mkdirSync(backupDir, { recursive: true });
  
  // Create unique backup name with timestamp
  const fileName = path.basename(filePath);
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
  const backupPath = path.join(backupDir, `${fileName}.${timestamp}.bak`);
  
  try {
    // Copy file to backup location
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
  } catch (error) {
    console.error(chalk.red('Failed to create backup:'), error.message);
    return null;
  }
};

/**
 * Apply changes to the working directory
 * @param {string} filePath - Path to update
 * @param {Buffer} content - New content
 * @param {boolean} force - Force overwrite even if there are local changes
 * @returns {object} Result of the operation
 */
export const applyChanges = (filePath, content, force = false) => {
  // Check for local modifications if file exists
  if (fs.existsSync(filePath)) {
    const currentHash = getIndexHash(filePath);
    
    if (currentHash && isFileModified(filePath, currentHash) && !force) {
      return {
        success: false,
        conflict: true,
        message: `File has local modifications: ${filePath}`
      };
    }
    
    // Create backup if file exists
    const backupPath = backupFile(filePath);
    
    // Update file
    try {
      // Ensure directory exists
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content);
      
      // Update index
      const newHash = calculateFileHash(content);
      trackFile(filePath, newHash);
      
      return {
        success: true,
        message: `Updated: ${filePath}`,
        backupCreated: !!backupPath,
        backupPath
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  } else {
    // New file - create it
    try {
      // Ensure directory exists
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content);
      
      // Update index
      const newHash = calculateFileHash(content);
      trackFile(filePath, newHash);
      
      return {
        success: true,
        message: `Created: ${filePath}`,
        isNew: true
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

/**
 * Mark a conflict in a file
 * @param {string} filePath - Path to the file 
 * @param {Buffer} localContent - Local file content
 * @param {Buffer} incomingContent - Incoming file content
 * @returns {object} Result of the operation
 */
export const markConflict = (filePath, localContent, incomingContent) => {
  try {
    // Create backup if file exists
    let backupPath = null;
    if (fs.existsSync(filePath)) {
      backupPath = backupFile(filePath);
    }
    
    // Format conflict markers
    const conflictContent = Buffer.concat([
      Buffer.from('<<<<<<< LOCAL\n'),
      localContent,
      Buffer.from('\n=======\n'),
      incomingContent,
      Buffer.from('\n>>>>>>> INCOMING\n')
    ]);
    
    // Write the file with conflict markers
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, conflictContent);
    
    return {
      success: true,
      conflict: true,
      message: `Conflict marked in: ${filePath}`,
      backupCreated: !!backupPath,
      backupPath
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Check for conflicts in the working directory
 * @param {object} files - Map of files to update, with paths as keys and content as values
 * @returns {Array} List of conflicts
 */
export const checkWorkingDirectoryConflicts = (files) => {
  const conflicts = [];
  
  for (const [filePath, content] of Object.entries(files)) {
    // Check for local modifications
    if (fs.existsSync(filePath)) {
      const currentHash = getIndexHash(filePath);
      
      if (currentHash && isFileModified(filePath, currentHash)) {
        conflicts.push(filePath);
      }
    }
  }
  
  return conflicts;
};

/**
 * Apply a set of changes to the working directory
 * @param {object} files - Map of files to update, with paths as keys and content as values
 * @param {boolean} force - Force overwrite even if there are local changes
 * @returns {object} Result of the operation
 */
export const applyChangesToWorkingDirectory = (files, force = false) => {
  const results = {
    success: true,
    updated: [],
    created: [],
    conflicts: [],
    errors: []
  };
  
  for (const [filePath, content] of Object.entries(files)) {
    const result = applyChanges(filePath, content, force);
    
    if (result.success) {
      if (result.isNew) {
        results.created.push(filePath);
      } else {
        results.updated.push(filePath);
      }
    } else if (result.conflict) {
      results.conflicts.push(filePath);
      results.success = false;
    } else {
      results.errors.push({ path: filePath, error: result.error });
      results.success = false;
    }
  }
  
  return results;
};