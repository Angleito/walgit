import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { getWalletConfig } from './config.js';
import { initializeWallet } from './auth.js';
import chalk from 'chalk';
import ora from 'ora';

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
    
    // Create tree structure
    // This is simplified - in a real implementation, you'd need to build
    // a proper tree structure based on file paths
    const rootTreeResult = tx.moveCall({
      target: `${WALGIT_PACKAGE_ID}::git_tree_object::create_tree`,
      arguments: [
        // Tree entries would be constructed here
        tx.pure([]) // Simplified for now
      ]
    });
    
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
    
    if (!commitEvent) {
      throw new Error('Commit creation event not found in transaction result');
    }
    
    // Extract commit ID from event
    const commitId = commitEvent.parsedJson.commit_id;
    
    spinner.succeed('Commit created on-chain');
    
    return {
      id: commitId,
      message: options.message,
      author: wallet.address,
      timestamp: new Date().toISOString(),
      rootTree: {
        id: 'root-tree-id', // This would come from the actual event
        entries: []         // This would be populated from the actual tree
      },
      files: options.files,
      transactionDigest: result.digest
    };
  } catch (error) {
    spinner.fail('Failed to create commit on-chain');
    console.error(chalk.red('Error details:'), error.message);
    throw error;
  }
};

/**
 * Push commits to the blockchain
 * @param {object} options - Push options
 * @param {string} options.repositoryId - Repository ID
 * @param {string} options.branch - Branch name
 * @param {string} options.commitId - Commit ID to push
 * @returns {Promise<object>} Push result
 */
export const pushCommitsOnChain = async (options) => {
  const wallet = await initializeWallet();
  const spinner = ora('Pushing commits to blockchain...').start();
  
  try {
    // Create transaction block
    const tx = new TransactionBlock();
    
    // Update branch reference to point to the new commit
    tx.moveCall({
      target: `${WALGIT_PACKAGE_ID}::git_reference::update_branch`,
      arguments: [
        tx.pure(options.repositoryId), // Repository ID
        tx.pure(options.branch),       // Branch name
        tx.pure(options.commitId)      // Commit ID
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
    
    spinner.succeed('Commits pushed to blockchain');
    
    return {
      branch: options.branch,
      commitId: options.commitId,
      transactionDigest: result.digest,
      status: 'success'
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
