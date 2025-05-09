import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { getWalletConfig } from './config.js';
import { initializeWallet } from './auth.js';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import { buildAndCreateTreeInTransaction, processFileList, serializeTree, buildTreeFromFiles } from './tree-builder.js';

// Package ID for the WalGit smart contract
// This should be updated with the actual deployed package ID
const WALGIT_PACKAGE_ID = process.env.WALGIT_PACKAGE_ID || '0x0'; // Default to 0x0 for testing

/**
 * Initialize Sui client based on network configuration
 * @returns {Promise<SuiClient>} Initialized Sui client
 */
export const initializeSuiClient = async () => {
  const walletConfig = await getWalletConfig();
  const network = walletConfig.network || 'devnet';
  
  // Network RPC URLs
  const networkUrls = {
    devnet: 'https://fullnode.devnet.sui.io:443',
    testnet: 'https://fullnode.testnet.sui.io:443',
    mainnet: 'https://fullnode.mainnet.sui.io:443',
    localnet: 'http://localhost:9000'
  };
  
  const rpcUrl = networkUrls[network] || networkUrls.devnet;
  
  return new SuiClient({ url: rpcUrl });
};

/**
 * Create a new repository on the blockchain
 * @param {object} options - Repository options
 * @param {string} options.name - Repository name
 * @param {string} options.description - Repository description
 * @param {boolean} options.isPrivate - Whether the repository is private
 * @returns {Promise<object>} Created repository data
 */
export const createRepositoryOnChain = async (options) => {
  const wallet = await initializeWallet();
  const spinner = ora('Creating repository on-chain...').start();
  
  try {
    // Create transaction block
    const tx = new TransactionBlock();
    
    // Call the init_repository function from the git_operations module
    tx.moveCall({
      target: `${WALGIT_PACKAGE_ID}::git_operations::init_repository`,
      arguments: [
        tx.pure(options.name),
        tx.pure(options.description || '')
      ]
    });
    
    // Sign and execute the transaction
    const result = await wallet.client.signAndExecuteTransactionBlock({
      signer: wallet.keypair,
      transactionBlock: tx,
      options: {
        showEffects: true,
        showEvents: true
      }
    });
    
    // Process the result to extract repository ID and other details
    const repoEvent = result.events.find(event => 
      event.type.includes('::git_repository::RepositoryCreated')
    );
    
    if (!repoEvent) {
      throw new Error('Repository creation event not found in transaction result');
    }
    
    // Extract repository ID from event
    const repoId = repoEvent.parsedJson.repository_id;
    
    spinner.succeed('Repository created on-chain');
    
    return {
      id: repoId,
      name: options.name,
      description: options.description || '',
      isPrivate: options.isPrivate || false,
      owner: wallet.address,
      defaultBranch: 'main',
      branches: [
        {
          name: 'main',
          commitCount: 0,
          lastCommit: null
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      transactionDigest: result.digest
    };
  } catch (error) {
    spinner.fail('Failed to create repository on-chain');
    console.error(chalk.red('Error details:'), error.message);
    throw error;
  }
};

/**
 * Create a commit on the blockchain
 * @param {object} options - Commit options
 * @param {string} options.repositoryId - Repository ID
 * @param {string} options.message - Commit message
 * @param {Array} options.files - Files to commit
 * @returns {Promise<object>} Created commit data
 */
export const createCommitOnChain = async (options) => {
  const wallet = await initializeWallet();
  const spinner = ora('Creating commit on-chain...').start();
  
  try {
    // Create transaction block
    const tx = new TransactionBlock();
    
    // For each file, create a blob object
    const blobIds = [];
    for (const file of options.files) {
      // Call create_blob function
      const blobResult = tx.moveCall({
        target: `${WALGIT_PACKAGE_ID}::git_blob_object::create_blob`,
        arguments: [
          tx.pure(file.walrusBlobId), // Blob ID in Walrus storage
          tx.pure(file.size),         // File size
          tx.pure(file.hash),         // File hash
          tx.pure(0)                  // Encoding (0 for binary)
        ]
      });
      
      blobIds.push({
        id: blobResult,
        path: file.path
      });
    }
    
    // Process the files for tree building - filter out local simulation files
    const filteredFiles = options.files.filter(file => !file.walrusBlobId.startsWith('local-'));
    
    // If no valid Walrus blobs, throw error
    if (filteredFiles.length === 0) {
      throw new Error('No valid Walrus blob references found. Cannot create commit.');
    }
    
    // Process the filtered files
    const processedFiles = processFileList(filteredFiles);
    
    // Build the tree structure and create tree objects in the transaction
    const rootTreeResult = buildAndCreateTreeInTransaction(tx, processedFiles);
    
    // Create commit object
    const commitResult = tx.moveCall({
      target: `${WALGIT_PACKAGE_ID}::git_commit_object::create_commit`,
      arguments: [
        rootTreeResult,                // Root tree ID
        tx.pure(null),                 // Parent commit ID (null for initial commit)
        tx.pure(options.message),      // Commit message
        tx.pure(Date.now().toString()) // Timestamp
      ]
    });
    
    // Add commit to repository
    tx.moveCall({
      target: `${WALGIT_PACKAGE_ID}::git_operations::add_commit_to_repository`,
      arguments: [
        tx.pure(options.repositoryId), // Repository ID
        commitResult                   // Commit object
      ]
    });
    
    // Sign and execute the transaction
    const result = await wallet.client.signAndExecuteTransactionBlock({
      signer: wallet.keypair,
      transactionBlock: tx,
      options: {
        showEffects: true,
        showEvents: true
      }
    });
    
    // Process the result to extract commit ID and other details
    const commitEvent = result.events.find(event => 
      event.type.includes('::git_commit_object::CommitCreated')
    );
    
    const treeEvent = result.events.find(event => 
      event.type.includes('::git_tree_object::TreeCreated')
    );
    
    if (!commitEvent) {
      throw new Error('Commit creation event not found in transaction result');
    }
    
    // Extract commit ID and tree ID from events
    const commitId = commitEvent.parsedJson.commit_id;
    const treeId = treeEvent ? treeEvent.parsedJson.tree_id : 'root-tree-id';
    
    spinner.succeed('Commit created on-chain');
    
    return {
      id: commitId,
      message: options.message,
      author: wallet.address,
      timestamp: new Date().toISOString(),
      rootTree: {
        id: treeId,
        entries: []         // This would be populated from the actual tree structure
      },
      files: options.files,
      treeInfo: serializeTree(buildTreeFromFiles(processedFiles)),
      transactionDigest: result.digest
    };
  } catch (error) {
    spinner.fail('Failed to create commit on-chain');
    console.error(chalk.red('Error details:'), error.message);
    throw error;
  }
};

/**
 * Get the current state of a remote branch
 * @param {string} repositoryId - Repository ID
 * @param {string} branchName - Branch name
 * @returns {Promise<object>} Branch state information
 */
export const getRemoteBranchState = async (repositoryId, branchName) => {
  const client = await initializeSuiClient();
  
  try {
    // First, fetch the repository object to get reference to branch refs
    const repository = await client.getObject({
      id: repositoryId,
      options: {
        showContent: true,
        showOwner: true
      }
    });
    
    if (!repository || !repository.data || !repository.data.content) {
      throw new Error(`Repository with ID ${repositoryId} not found`);
    }
    
    // Extract repository details from the object
    const repoData = repository.data.content;
    
    // Try to get reference collection ID
    const referencesId = repoData.references_id;
    if (!referencesId) {
      // No references collection means no remote conflicts
      return {
        exists: false,
        commitId: null,
        diverged: false,
        ahead: 0,
        behind: 0,
        hasConflicts: false
      };
    }
    
    // Fetch references collection
    const references = await client.getObject({
      id: referencesId,
      options: {
        showContent: true
      }
    });
    
    if (!references || !references.data || !references.data.content) {
      throw new Error(`References collection with ID ${referencesId} not found`);
    }
    
    const refsData = references.data.content;
    
    // Check if branch exists
    const branchExists = await branchExistsOnChain(referencesId, branchName);
    
    if (!branchExists) {
      // Branch doesn't exist, so no conflicts
      return {
        exists: false,
        commitId: null,
        diverged: false,
        ahead: 0,
        behind: 0,
        hasConflicts: false
      };
    }
    
    // Get branch reference ID
    const branchId = await getBranchReferenceId(referencesId, branchName);
    
    if (!branchId) {
      // Branch not found, no conflicts
      return {
        exists: false,
        commitId: null,
        diverged: false,
        ahead: 0,
        behind: 0,
        hasConflicts: false
      };
    }
    
    // Fetch branch reference
    const branchRef = await client.getObject({
      id: branchId,
      options: {
        showContent: true
      }
    });
    
    if (!branchRef || !branchRef.data || !branchRef.data.content) {
      throw new Error(`Branch reference with ID ${branchId} not found`);
    }
    
    const branchData = branchRef.data.content;
    const remoteCommitId = branchData.target_id;
    
    // Get local commit reference
    const { getCurrentRepository, getWalGitDir } = await import('./config.js');
    const { compareCommitHistories } = await import('./repository.js');
    const repository = await getCurrentRepository();
    const walgitDir = getWalGitDir();
    
    // Get the latest local commit hash for this branch
    const headContent = fs.readFileSync(path.join(walgitDir, 'HEAD'), 'utf-8').trim();
    let localCommitHash;
    
    if (headContent.startsWith('ref: ')) {
      const refPath = headContent.substring(5);
      const localBranch = refPath.split('/').pop();
      
      // Only compare if the branch names match
      if (localBranch === branchName) {
        const branchRefPath = path.join(walgitDir, refPath);
        if (fs.existsSync(branchRefPath)) {
          localCommitHash = fs.readFileSync(branchRefPath, 'utf-8').trim();
        } else {
          // If branch ref doesn't exist yet, use HEAD value
          localCommitHash = headContent;
        }
      } else {
        // Different branch, check if we have a local reference for the requested branch
        const branchRefPath = path.join(walgitDir, 'refs', 'heads', branchName);
        if (fs.existsSync(branchRefPath)) {
          localCommitHash = fs.readFileSync(branchRefPath, 'utf-8').trim();
        }
      }
    } else {
      // Detached HEAD state
      localCommitHash = headContent;
    }
    
    if (!localCommitHash) {
      // Local branch doesn't exist, no conflicts
      return {
        exists: true,
        commitId: remoteCommitId,
        diverged: false,
        ahead: 0,
        behind: 0,
        hasConflicts: false
      };
    }
    
    // Now that we have both local and remote commit IDs, compare histories
    const comparison = await compareCommitHistories(
      walgitDir,
      localCommitHash,
      remoteCommitId,
      branchName
    );
    
    // Determine if there are conflicts
    // Branches have diverged (they both have commits the other doesn't have)
    const hasConflicts = comparison.diverged;
    
    return {
      exists: true,
      commitId: remoteCommitId,
      diverged: comparison.diverged,
      ahead: comparison.remoteAhead, // Remote is ahead by this many commits
      behind: comparison.localAhead,  // Local is ahead by this many commits
      fastForwardable: comparison.fastForwardable,
      commonAncestor: comparison.commonAncestor,
      hasConflicts
    };
  } catch (error) {
    console.error(chalk.yellow('Warning: Could not determine remote branch state'), error.message);
    
    // Return safe defaults
    return {
      exists: false,
      commitId: null,
      diverged: false,
      ahead: 0,
      behind: 0,
      hasConflicts: false
    };
  }
};

/**
 * Check if a branch exists in the repository on chain
 * @param {string} referencesId - References collection ID
 * @param {string} branchName - Branch name
 * @returns {Promise<boolean>} Whether the branch exists
 * @private
 */
async function branchExistsOnChain(referencesId, branchName) {
  const client = await initializeSuiClient();
  
  try {
    // Call the branch_exists function in the git_reference module
    const tx = new TransactionBlock();
    
    // Using dryRunTransactionBlock to simulate calling a view function
    const result = await client.devInspectTransactionBlock({
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000', // Dummy sender
      transactionBlock: tx.pure({
        id: referencesId,
        branch: branchName
      }),
      targetFunction: `${WALGIT_PACKAGE_ID}::git_reference::branch_exists`
    });
    
    // Extract the result
    if (result && result.results && result.results.length > 0 && result.results[0].returnValues) {
      return result.results[0].returnValues[0] === 'true';
    }
    
    return false;
  } catch (error) {
    console.error(chalk.yellow('Warning: Could not check if branch exists on chain'), error.message);
    return false;
  }
}

/**
 * Get a branch reference ID from the repository
 * @param {string} referencesId - References collection ID
 * @param {string} branchName - Branch name
 * @returns {Promise<string|null>} Branch reference ID or null if not found
 * @private
 */
async function getBranchReferenceId(referencesId, branchName) {
  const client = await initializeSuiClient();
  
  try {
    // Fetch the references object
    const references = await client.getObject({
      id: referencesId,
      options: {
        showContent: true
      }
    });
    
    if (!references || !references.data || !references.data.content) {
      return null;
    }
    
    const refsData = references.data.content;
    
    // Get branches table
    if (!refsData.branches || !refsData.branches.fields || !refsData.branches.fields.contents) {
      return null;
    }
    
    // Find the branch in the table
    const branchEntry = refsData.branches.fields.contents.find(entry => 
      entry && entry.length === 2 && entry[0] === branchName
    );
    
    if (!branchEntry || !branchEntry[1]) {
      return null;
    }
    
    return branchEntry[1];
  } catch (error) {
    console.error(chalk.yellow('Warning: Could not get branch reference ID'), error.message);
    return null;
  }
}

/**
 * Push commits to the blockchain
 * @param {object} options - Push options
 * @param {string} options.repositoryId - Repository ID
 * @param {string} options.branch - Branch name
 * @param {Array<object>} options.commits - Array of commit objects to push
 * @param {boolean} options.force - Force push (overwrites remote)
 * @returns {Promise<object>} Push result
 */
export const pushCommitsOnChain = async (options) => {
  const wallet = await initializeWallet();
  const spinner = ora('Pushing commits to blockchain...').start();
  
  try {
    // Create transaction block
    const tx = new TransactionBlock();
    
    // Get the latest commit from the array
    const latestCommit = options.commits && options.commits.length > 0 
      ? options.commits[0] 
      : null;
    
    if (!latestCommit) {
      throw new Error('No commits provided to push');
    }
    
    // If this is a force push, we need to use a different approach
    if (options.force) {
      // Force update branch reference to point to the new commit
      tx.moveCall({
        target: `${WALGIT_PACKAGE_ID}::git_reference::force_update_branch`,
        arguments: [
          tx.pure(options.repositoryId), // Repository ID
          tx.pure(options.branch),       // Branch name
          tx.pure(latestCommit.hash)     // Commit hash
        ]
      });
    } else {
      // Standard update branch reference to point to the new commit
      tx.moveCall({
        target: `${WALGIT_PACKAGE_ID}::git_reference::update_branch`,
        arguments: [
          tx.pure(options.repositoryId), // Repository ID
          tx.pure(options.branch),       // Branch name
          tx.pure(latestCommit.hash)     // Commit hash
        ]
      });
    }
    
    // Add extra gas for large transactions
    tx.setGasBudget(50000000); // Increased gas budget for complex transactions
    
    // Sign and execute the transaction
    const result = await wallet.client.signAndExecuteTransactionBlock({
      signer: wallet.keypair,
      transactionBlock: tx,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true
      }
    });
    
    // Check for events that indicate success
    const updateEvents = result.events.filter(event => 
      event.type.includes('::git_reference::ReferenceUpdated')
    );
    
    if (updateEvents.length === 0) {
      spinner.warn('Branch update transaction completed, but no ReferenceUpdated event was emitted');
    }
    
    spinner.succeed('Commits pushed to blockchain');
    
    return {
      branch: options.branch,
      commitId: latestCommit.hash,
      commitCount: options.commits.length,
      force: options.force || false,
      transactionDigest: result.digest,
      status: 'success',
      gasUsed: result.effects?.gasUsed || null
    };
  } catch (error) {
    spinner.fail('Failed to push commits to blockchain');
    console.error(chalk.red('Error details:'), error.message);
    throw error;
  }
};

/**
 * Get repository details from the blockchain
 * @param {string} repositoryId - Repository ID
 * @returns {Promise<object>} Repository details
 */
export const getRepositoryFromChain = async (repositoryId) => {
  const client = await initializeSuiClient();
  
  try {
    // Fetch repository object from the blockchain
    const repository = await client.getObject({
      id: repositoryId,
      options: {
        showContent: true,
        showOwner: true
      }
    });
    
    if (!repository || !repository.data || !repository.data.content) {
      throw new Error(`Repository with ID ${repositoryId} not found`);
    }
    
    // Extract repository details from the object
    const repoData = repository.data.content;
    
    return {
      id: repositoryId,
      name: repoData.name,
      description: repoData.description,
      isPrivate: repoData.is_private,
      owner: repoData.owner,
      defaultBranch: repoData.default_branch,
      createdAt: new Date(parseInt(repoData.created_at)).toISOString(),
      updatedAt: new Date(parseInt(repoData.updated_at)).toISOString()
    };
  } catch (error) {
    console.error(chalk.red('Failed to get repository from blockchain:'), error.message);
    throw error;
  }
};

/**
 * Get commit details from the blockchain
 * @param {string} commitId - Commit ID
 * @returns {Promise<object>} Commit details
 */
export const getCommitFromChain = async (commitId) => {
  const client = await initializeSuiClient();
  
  try {
    // Fetch commit object from the blockchain
    const commit = await client.getObject({
      id: commitId,
      options: {
        showContent: true
      }
    });
    
    if (!commit || !commit.data || !commit.data.content) {
      throw new Error(`Commit with ID ${commitId} not found`);
    }
    
    // Extract commit details from the object
    const commitData = commit.data.content;
    
    return {
      id: commitId,
      treeId: commitData.tree_id,
      parentCommitId: commitData.parent_commit_id,
      author: commitData.author,
      committer: commitData.committer,
      message: commitData.message,
      timestamp: new Date(parseInt(commitData.timestamp)).toISOString(),
      hash: commitData.hash
    };
  } catch (error) {
    console.error(chalk.red('Failed to get commit from blockchain:'), error.message);
    throw error;
  }
};

/**
 * Get tree details from the blockchain
 * @param {string} treeId - Tree ID
 * @returns {Promise<object>} Tree details
 */
export const getTreeFromChain = async (treeId) => {
  const client = await initializeSuiClient();
  
  try {
    // Fetch tree object from the blockchain
    const tree = await client.getObject({
      id: treeId,
      options: {
        showContent: true
      }
    });
    
    if (!tree || !tree.data || !tree.data.content) {
      throw new Error(`Tree with ID ${treeId} not found`);
    }
    
    // Extract tree details from the object
    const treeData = tree.data.content;
    
    // Process tree entries
    const entries = treeData.entries.map(entry => ({
      name: entry.name,
      type: entry.entry_type === 0 ? 'blob' : 'tree',
      objectId: entry.object_id,
      mode: entry.mode
    }));
    
    return {
      id: treeId,
      entries
    };
  } catch (error) {
    console.error(chalk.red('Failed to get tree from blockchain:'), error.message);
    throw error;
  }
};

/**
 * Get blob details from the blockchain
 * @param {string} blobId - Blob ID
 * @returns {Promise<object>} Blob details
 */
export const getBlobFromChain = async (blobId) => {
  const client = await initializeSuiClient();
  
  try {
    // Fetch blob object from the blockchain
    const blob = await client.getObject({
      id: blobId,
      options: {
        showContent: true
      }
    });
    
    if (!blob || !blob.data || !blob.data.content) {
      throw new Error(`Blob with ID ${blobId} not found`);
    }
    
    // Extract blob details from the object
    const blobData = blob.data.content;
    
    return {
      id: blobId,
      walrusBlobId: blobData.walrus_blob_id,
      size: blobData.size,
      hash: blobData.hash,
      encoding: blobData.encoding
    };
  } catch (error) {
    console.error(chalk.red('Failed to get blob from blockchain:'), error.message);
    throw error;
  }
};

/**
 * Check if the package ID is valid and the smart contract is deployed
 * @returns {Promise<boolean>} Whether the package is valid
 */
export const validatePackageId = async () => {
  if (WALGIT_PACKAGE_ID === '0x0') {
    console.warn(chalk.yellow('Warning: Using default package ID (0x0). Set WALGIT_PACKAGE_ID environment variable to use a deployed contract.'));
    return false;
  }
  
  const client = await initializeSuiClient();
  
  try {
    // Try to get the package object
    const packageObj = await client.getObject({
      id: WALGIT_PACKAGE_ID,
      options: {
        showType: true
      }
    });
    
    return packageObj && packageObj.data && packageObj.data.type === 'package';
  } catch (error) {
    console.error(chalk.red('Failed to validate package ID:'), error.message);
    return false;
  }
};
