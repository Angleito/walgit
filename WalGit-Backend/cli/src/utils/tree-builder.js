/**
 * WalGit Tree Builder
 * 
 * This module is responsible for creating Git tree structures from file lists and
 * serializing them for storage on the Sui blockchain. It provides utilities for
 * converting flat file lists into nested tree structures that mirror the Git objects model.
 */

import path from 'path';
import { TransactionBlock } from '@mysten/sui.js/transactions';

// Package ID for the WalGit smart contract
// This should be updated with the actual deployed package ID
const WALGIT_PACKAGE_ID = process.env.WALGIT_PACKAGE_ID || '0x0'; // Default to 0x0 for testing

/**
 * Entry type constants for tree entries
 */
const ENTRY_TYPE = {
  BLOB: 0,
  TREE: 1
};

/**
 * Default file mode for regular files (644)
 * In Git, file modes are represented as octal numbers indicating permissions
 */
const DEFAULT_FILE_MODE = 0o100644;

/**
 * Default directory mode for directories (755)
 */
const DEFAULT_DIR_MODE = 0o040000;

/**
 * TreeNode class represents a node in a tree structure
 * It can be either a file (blob) or a directory (tree)
 */
class TreeNode {
  /**
   * Create a TreeNode
   * @param {string} name - The name of the file or directory
   * @param {boolean} isTree - Whether this node is a tree (directory) or blob (file)
   * @param {string|null} blobId - The ID of the blob if this is a file node
   * @param {number} mode - The file mode (permissions)
   */
  constructor(name, isTree = false, blobId = null, mode = null) {
    this.name = name;
    this.isTree = isTree;
    this.blobId = blobId;
    this.children = isTree ? new Map() : null;
    this.mode = mode || (isTree ? DEFAULT_DIR_MODE : DEFAULT_FILE_MODE);
    this.suiObjectId = null; // Will be set when the tree is created on-chain
  }

  /**
   * Add a child node to this tree node
   * @param {string} name - Name of the child node
   * @param {TreeNode} node - The child node to add
   */
  addChild(name, node) {
    if (!this.isTree) {
      throw new Error('Cannot add children to a blob node');
    }
    this.children.set(name, node);
  }

  /**
   * Get a child node by name
   * @param {string} name - Name of the child node
   * @returns {TreeNode|undefined} The child node or undefined if not found
   */
  getChild(name) {
    if (!this.isTree) return undefined;
    return this.children.get(name);
  }

  /**
   * Check if this tree node has a child with the given name
   * @param {string} name - Name of the child node to check
   * @returns {boolean} True if the child exists, false otherwise
   */
  hasChild(name) {
    if (!this.isTree) return false;
    return this.children.has(name);
  }

  /**
   * Get all children of this tree node
   * @returns {Array<TreeNode>} Array of child nodes
   */
  getAllChildren() {
    if (!this.isTree) return [];
    return Array.from(this.children.values());
  }

  /**
   * Get the number of children
   * @returns {number} Number of children
   */
  childCount() {
    if (!this.isTree) return 0;
    return this.children.size;
  }

  /**
   * Convert this node to a serializable object for JSON
   * @returns {object} Serializable object representation
   */
  toJSON() {
    const result = {
      name: this.name,
      type: this.isTree ? 'tree' : 'blob',
      mode: this.mode.toString(8), // Convert to octal string
    };

    if (this.suiObjectId) {
      result.id = this.suiObjectId;
    }

    if (this.isTree) {
      result.entries = Array.from(this.children.entries()).map(([name, node]) => {
        return node.toJSON();
      });
    } else if (this.blobId) {
      result.blobId = this.blobId;
    }

    return result;
  }
}

/**
 * Build a tree structure from a flat list of files
 * @param {Array<object>} files - Array of file objects with path and blobId properties
 * @returns {TreeNode} The root tree node
 */
export const buildTreeFromFiles = (files) => {
  // Create root node
  const root = new TreeNode('root', true);

  // Process each file and build the tree
  for (const file of files) {
    // Normalize the path to handle different OS path separators
    const normalizedPath = file.path.replace(/\\/g, '/');
    // Split the path into components
    const pathComponents = normalizedPath.split('/').filter(Boolean);

    // Skip empty paths
    if (pathComponents.length === 0) continue;

    // Navigate to the correct location in the tree
    let currentNode = root;
    
    // Process all directory components except the last one (filename)
    for (let i = 0; i < pathComponents.length - 1; i++) {
      const component = pathComponents[i];
      
      if (!currentNode.hasChild(component)) {
        // Create a new tree node for this directory
        currentNode.addChild(component, new TreeNode(component, true));
      }
      
      // Move to the child node
      currentNode = currentNode.getChild(component);
    }

    // Add the file as a blob node
    const fileName = pathComponents[pathComponents.length - 1];
    currentNode.addChild(
      fileName, 
      new TreeNode(fileName, false, file.blobId, DEFAULT_FILE_MODE)
    );
  }

  return root;
};

/**
 * Recursively create tree objects in a transaction
 * @param {TransactionBlock} tx - The transaction block
 * @param {TreeNode} node - The tree node to process
 * @returns {object} The transaction result containing the tree object ID
 */
export const createTreeObjectsInTransaction = (tx, node) => {
  if (!node.isTree) {
    // This is a blob node, return its ID
    return tx.pure(node.blobId);
  }

  // Process all children to get their object IDs
  const entries = [];
  for (const childNode of node.getAllChildren()) {
    const childResult = createTreeObjectsInTransaction(tx, childNode);
    
    entries.push({
      name: childNode.name,
      object_id: childResult,
      entry_type: childNode.isTree ? ENTRY_TYPE.TREE : ENTRY_TYPE.BLOB,
      mode: childNode.mode
    });
  }

  // Create the tree object with all entries
  return tx.moveCall({
    target: `${WALGIT_PACKAGE_ID}::git_tree_object::create_tree`,
    arguments: [
      tx.pure(entries)
    ]
  });
};

/**
 * Create tree entries for the Sui Move call
 * Note: This is a helper for directly formatting tree entries for the Move call
 * @param {Array<TreeNode>} treeNodes - Array of tree nodes to convert to entries
 * @returns {Array<object>} Array of properly formatted tree entries for Move call
 */
export const createTreeEntries = (treeNodes) => {
  return treeNodes.map(node => ({
    name: node.name,
    object_id: node.suiObjectId,
    entry_type: node.isTree ? ENTRY_TYPE.TREE : ENTRY_TYPE.BLOB,
    mode: node.mode
  }));
};

/**
 * Serialize a tree structure for storage
 * Converts the tree into a flat representation that can be stored and reconstructed
 * @param {TreeNode} root - The root tree node
 * @returns {object} Serialized tree structure
 */
export const serializeTree = (root) => {
  // Use the toJSON method to get a serializable version of the tree
  return root.toJSON();
};

/**
 * Build tree structure and create tree objects in a transaction
 * This is the main function to use when creating a commit with a tree
 * @param {TransactionBlock} tx - Transaction block
 * @param {Array<object>} files - Array of file objects with path and blobId
 * @returns {object} Transaction result for the root tree
 */
export const buildAndCreateTreeInTransaction = (tx, files) => {
  // Build the tree structure
  const rootTree = buildTreeFromFiles(files);
  
  // Create tree objects in the transaction
  return createTreeObjectsInTransaction(tx, rootTree);
};

/**
 * Process file list to prepare for tree building
 * This function takes raw file information and prepares it for the tree builder
 * @param {Array<object>} files - Array of file objects with raw information
 * @returns {Array<object>} Processed file list ready for tree building
 */
export const processFileList = (files) => {
  return files.map(file => ({
    path: file.path,
    blobId: file.blobId || file.walrusBlobId, // Support different property names
    size: file.size,
    hash: file.hash,
    mode: file.mode || DEFAULT_FILE_MODE
  }));
};

/**
 * Reconstruct a tree structure from serialized data
 * @param {object} serializedTree - The serialized tree object
 * @returns {TreeNode} The reconstructed tree node
 */
export const deserializeTree = (serializedTree) => {
  const { name, type, mode, entries, blobId, id } = serializedTree;
  const isTree = type === 'tree';
  
  // Create the node with the correct type
  const node = new TreeNode(
    name, 
    isTree, 
    blobId || null, 
    parseInt(mode, 8) // Parse octal string back to number
  );
  
  // Set the Sui object ID if available
  if (id) {
    node.suiObjectId = id;
  }
  
  // Recursively process child entries if this is a tree
  if (isTree && entries && entries.length > 0) {
    for (const entry of entries) {
      const childNode = deserializeTree(entry);
      node.addChild(childNode.name, childNode);
    }
  }
  
  return node;
};

export default {
  buildTreeFromFiles,
  createTreeObjectsInTransaction,
  buildAndCreateTreeInTransaction,
  serializeTree,
  deserializeTree,
  processFileList,
  createTreeEntries,
  ENTRY_TYPE,
  DEFAULT_FILE_MODE,
  DEFAULT_DIR_MODE
};