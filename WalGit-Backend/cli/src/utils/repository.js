import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import crypto from 'crypto';
import { initializeWallet } from './auth.js';
import { saveCurrentRepository, getCurrentRepository, getWalGitDir } from './config.js';
import { getRepositoryFromChain, validatePackageId, pushCommitsOnChain } from './sui-integration.js';

/**
 * Calculate a simple hash of content.
 * In a real Git implementation, this would be a SHA-1 hash of the object type and content.
 * @param {string} content - The content to hash.
 * @returns {string} A simple hash string.
 */
const calculateHash = (content) => {
  return crypto.createHash('md5').update(content).digest('hex');
};

/**
 * Create a new repository
 * @param {object} options - Repository options
 * @param {string} options.name - Repository name
 * @param {string} options.description - Repository description
 * @param {boolean} options.isPrivate - Whether the repository is private
 * @returns {Promise<object>} Created repository data
 */
export const createRepository = async (options) => {
  // Initialize wallet for Sui interaction
  const wallet = await initializeWallet();

  // Check if we should use on-chain operations
  const useOnChain = process.env.WALGIT_USE_BLOCKCHAIN === 'true';
  const isPackageValid = useOnChain ? await validatePackageId() : false;

  let repository;

  if (useOnChain && isPackageValid) {
    // Create repository on blockchain
    console.log(chalk.blue('Creating repository on blockchain...'));
    repository = await createRepositoryOnChain(options);
  } else {
    // Local simulation mode
    if (useOnChain) {
      console.log(chalk.yellow('Falling back to local simulation mode due to invalid package ID or configuration.'));
    } else {
      console.log(chalk.blue('Using local simulation mode.'));
    }

    // Generate repository ID (would actually be created on-chain in production)
    const repoId = `walgit-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create repository metadata
    repository = {
      id: repoId,
      name: options.name,
      description: options.description || '',
      isPrivate: options.private || false,
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
      updatedAt: new Date().toISOString()
    };
  }

  // Create .walgit directory and store repository configuration
  await saveCurrentRepository(repository);

  // Create initial structure
  const walgitDir = path.join(process.cwd(), '.walgit');

  // Create objects directory to store git-like objects
  fs.mkdirSync(path.join(walgitDir, 'objects'), { recursive: true });

  // Create refs directory to store branch and tag references
  fs.mkdirSync(path.join(walgitDir, 'refs', 'heads'), { recursive: true });
  fs.mkdirSync(path.join(walgitDir, 'refs', 'tags'), { recursive: true });

  // Create initial HEAD file pointing to main branch
  fs.writeFileSync(path.join(walgitDir, 'HEAD'), 'ref: refs/heads/main\n');

  return repository;
};

/**
 * Stage files for commit
 * @param {object} options - Staging options
 * @param {boolean} options.all - Stage all modified and deleted files
 * @returns {Promise<Array>} Staged files
 */
export const stageFiles = async (options) => {
  // This function would normally scan the working directory and record changes
  // For this local simulation, we'll assume all files in the current directory
  // (excluding .walgit) are "staged" for the initial commit.
  const walgitDir = getWalGitDir();
  const filesToStage = [];

  const readDirRecursive = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (fullPath === walgitDir || fullPath.startsWith(path.join(walgitDir, path.sep))) {
        continue; // Skip the .walgit directory
      }

      if (entry.isDirectory()) {
        readDirRecursive(fullPath);
      } else {
        filesToStage.push({ path: fullPath, status: 'added' }); // For simplicity, assume all are 'added'
      }
    }
  };

  readDirRecursive(process.cwd());

  return filesToStage;
};

/**
 * Create a commit with staged changes
 * @param {object} options - Commit options
 * @param {string} options.message - Commit message
 * @param {boolean} options.amend - Whether to amend the previous commit
 * @returns {Promise<object>} Created commit data
 */
export const createCommit = async (options) => {
  // Initialize wallet for signing (needed for author info and blockchain interactions)
  const wallet = await initializeWallet();
  const progressSpinner = ora('Preparing commit...').start();

  try {
    // Get staged files (simulated by reading the directory)
    const stagedFiles = await stageFiles();
    progressSpinner.text = `Processing ${stagedFiles.length} files...`;

    // Check if we should use on-chain operations
    const useOnChain = process.env.WALGIT_USE_BLOCKCHAIN === 'true';
    const isPackageValid = useOnChain ? await validatePackageId() : false;

    // Get current repository
    const repository = await getCurrentRepository();
    if (!repository) {
      progressSpinner.fail('Not in a WalGit repository');
      throw new Error("Not in a WalGit repository");
    }

    // Import necessary modules (dynamic import to avoid circular dependencies)
    const { uploadToWalrus } = await import('./walrus-storage.js');
    const { createCommitOnChain } = await import('./sui-integration.js');

    // Process files and upload to Walrus storage
    const processedFiles = [];
    const blobs = {};
    const tree = {}; // This will represent the root tree

    for (const file of stagedFiles) {
      const filePath = file.path;
      const fileContent = fs.readFileSync(filePath);
      const fileSize = fileContent.length;
      const fileHash = calculateHash(fileContent.toString());
      let walrusBlobId;

      if (useOnChain && isPackageValid) {
        // Upload to Walrus storage
        progressSpinner.text = `Uploading ${path.basename(filePath)} to Walrus storage...`;
        try {
          const uploadResult = await uploadToWalrus({
            filePath,
            mimeType: 'application/octet-stream' // Default MIME type
          });
          walrusBlobId = uploadResult.blobId;
        } catch (error) {
          progressSpinner.warn(`Failed to upload ${path.basename(filePath)} to Walrus: ${error.message}`);
          progressSpinner.text = `Falling back to local simulation for ${path.basename(filePath)}...`;
          // Generate a local identifier instead of actual Walrus ID
          walrusBlobId = `local-${fileHash}`;
        }
      } else {
        // Local simulation - generate placeholder Walrus blob ID
        walrusBlobId = `local-${fileHash}`;
      }

      // Store file metadata for both local storage and blockchain operations
      const processedFile = {
        path: path.relative(process.cwd(), filePath),
        walrusBlobId,
        size: fileSize,
        hash: fileHash,
        mode: '100644' // Regular file with read permissions
      };
      processedFiles.push(processedFile);

      // Store blob information for local storage
      blobs[fileHash] = {
        content: fileContent,
        size: fileSize,
        walrusBlobId
      };

      // Build a simple tree structure (nested objects) for local storage
      const pathParts = path.relative(process.cwd(), filePath).split(path.sep);
      let currentLevel = tree;
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!currentLevel[part]) {
          currentLevel[part] = { type: 'tree', entries: {} };
        }
        currentLevel = currentLevel[part].entries;
      }
      currentLevel[pathParts[pathParts.length - 1]] = {
        type: 'blob',
        hash: fileHash,
        walrusBlobId,
        mode: '100644', // Regular file with read permissions
      };
    }

    // Create a root tree hash for local storage
    const rootTreeHash = calculateHash(JSON.stringify(tree));

    // Generate a commit hash for local storage
    const commitHash = calculateHash(
      options.message +
      wallet.address +
      new Date().toISOString() +
      rootTreeHash
    );

    let onChainCommitResult = null;

    if (useOnChain && isPackageValid) {
      progressSpinner.text = 'Creating commit on blockchain...';
      try {
        // Create commit on blockchain
        onChainCommitResult = await createCommitOnChain({
          repositoryId: repository.id,
          message: options.message,
          files: processedFiles
        });

        progressSpinner.succeed('Commit created on blockchain');
      } catch (error) {
        progressSpinner.warn(`Failed to create commit on blockchain: ${error.message}`);
        progressSpinner.text = 'Falling back to local simulation...';
      }
    }

    // Always create local commit representation for CLI operations
    progressSpinner.text = 'Creating local commit representation...';

    // Create a commit object
    const commit = {
      hash: onChainCommitResult ? onChainCommitResult.id : commitHash,
      message: options.message,
      author: wallet.address,
      timestamp: new Date().toISOString(),
      tree: rootTreeHash, // Reference to the root tree hash
      walrusBlobs: processedFiles.map(file => ({
        path: file.path,
        blobId: file.walrusBlobId,
        size: file.size,
        hash: file.hash
      })),
      // Link to blockchain data if available
      onChain: onChainCommitResult ? {
        commitId: onChainCommitResult.id,
        transactionDigest: onChainCommitResult.transactionDigest
      } : null
    };

    // Save the commit object to a file in .walgit/objects
    const walgitDir = getWalGitDir();
    const commitDir = path.join(walgitDir, 'objects', commit.hash.substring(0, 2));
    const commitFilePath = path.join(commitDir, commit.hash.substring(2));

    fs.mkdirSync(commitDir, { recursive: true });
    fs.writeFileSync(commitFilePath, JSON.stringify(commit, null, 2));

    // Save the tree and blob info for local operations
    const treeFilePath = path.join(walgitDir, 'objects', rootTreeHash.substring(0, 2), rootTreeHash.substring(2));
    fs.mkdirSync(path.dirname(treeFilePath), { recursive: true });
    fs.writeFileSync(treeFilePath, JSON.stringify(tree, null, 2));

    for (const blobHash in blobs) {
      const blobDir = path.join(walgitDir, 'objects', blobHash.substring(0, 2));
      const blobFilePath = path.join(blobDir, blobHash.substring(2));
      fs.mkdirSync(blobDir, { recursive: true });
      fs.writeFileSync(blobFilePath, blobs[blobHash].content);
    }

    // Update HEAD to point to the new commit
    fs.writeFileSync(path.join(walgitDir, 'HEAD'), commit.hash);

    // Success message based on mode
    if (onChainCommitResult) {
      progressSpinner.succeed(`Commit ${commit.hash.substring(0, 8)} created (on blockchain: ${onChainCommitResult.id.substring(0, 8)})`);
    } else if (useOnChain) {
      progressSpinner.succeed(`Commit ${commit.hash.substring(0, 8)} created (local simulation, blockchain unavailable)`);
      console.log(chalk.yellow("Note: Commit was created in local simulation mode. Files were not uploaded to Walrus storage."));
    } else {
      progressSpinner.succeed(`Commit ${commit.hash.substring(0, 8)} created (local simulation)`);
      console.log(chalk.yellow("Note: Commit was created in local simulation mode. Use WALGIT_USE_BLOCKCHAIN=true to enable blockchain integration."));
    }

    return commit;
  } catch (error) {
    progressSpinner.fail(`Commit failed: ${error.message}`);
    throw error;
  }
};

/**
 * Push commits to remote storage and the blockchain
 * @param {object} options - Push options
 * @param {string} options.repositoryId - Repository ID
 * @param {boolean} options.force - Force push (overrides conflict detection)
 * @param {string} options.branch - Branch to push (defaults to current branch)
 * @param {boolean} options.retry - Automatically retry failed transactions
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.batchSize - Number of commits to push in a single transaction (default: 5)
 * @returns {Promise<object>} Push result
 */
export const pushCommits = async (options) => {
  // Initialize wallet for authentication
  const wallet = await initializeWallet();
  const progressSpinner = ora('Preparing to push commits...').start();

  // Set defaults for push options
  const maxRetries = options.maxRetries || 3;
  const batchSize = options.batchSize || 5;
  const shouldRetry = options.retry !== false; // Default to true
  
  // Track push progress, errors, and retries for comprehensive reporting
  const pushStats = {
    totalCommits: 0,
    pushedCommits: 0,
    retries: 0,
    failedBatches: 0,
    startTime: Date.now(),
    errors: [],
    batchResults: []
  };

  try {
    // Get the current repository
    const repository = await getCurrentRepository();
    if (!repository) {
      progressSpinner.fail('Not in a WalGit repository');
      throw new Error("Not in a WalGit repository");
    }

    // Get the latest commit hash from HEAD
    const walgitDir = getWalGitDir();
    const headPath = path.join(walgitDir, 'HEAD');

    if (!fs.existsSync(headPath)) {
      progressSpinner.fail('No commits to push');
      throw new Error("No commits to push. Please make a commit first.");
    }

    const headContent = fs.readFileSync(headPath, 'utf-8').trim();
    let latestCommitHash = null;
    let currentBranch = options.branch || 'main';

    // Determine current branch and latest commit hash
    if (headContent.startsWith('ref: ')) {
      const refPath = headContent.substring(5);
      currentBranch = refPath.split('/').pop();
      
      const branchRefPath = path.join(walgitDir, refPath);
      if (fs.existsSync(branchRefPath)) {
        latestCommitHash = fs.readFileSync(branchRefPath, 'utf-8').trim();
      } else {
        // If the branch ref doesn't exist yet, use HEAD commit
        latestCommitHash = headContent;
      }
    } else {
      // Detached HEAD state
      latestCommitHash = headContent;
    }

    if (!latestCommitHash) {
      progressSpinner.fail('Could not determine the latest commit');
      throw new Error("Could not determine the latest commit from HEAD.");
    }

    progressSpinner.text = `Analyzing local commit history for ${currentBranch}...`;

    // Load the commit objects to be pushed
    const commitsToSync = await getLocalCommitsToSync(walgitDir, latestCommitHash);
    pushStats.totalCommits = commitsToSync.length;
    
    if (commitsToSync.length === 0) {
      progressSpinner.info('No commits to push. Already up to date.');
      return {
        commitHash: latestCommitHash,
        branch: currentBranch,
        commitCount: 0,
        status: 'up_to_date',
        message: 'Already up to date'
      };
    }
    
    // Check if we should use on-chain operations
    const useOnChain = process.env.WALGIT_USE_BLOCKCHAIN === 'true';
    const isPackageValid = useOnChain ? await validatePackageId() : false;

    if (useOnChain && isPackageValid) {
      progressSpinner.text = `Checking remote repository state on blockchain...`;
      
      try {
        // Import necessary blockchain integration modules
        const { getRepositoryFromChain, getRemoteBranchState, pushCommitsOnChain } = await import('./sui-integration.js');
        
        // Retry function for blockchain operations with exponential backoff
        const retryOperation = async (operation, description, retryCount = 0) => {
          try {
            return await operation();
          } catch (error) {
            // Don't retry on permission or validation errors
            if (error.message.includes('authority') || error.message.includes('permission') || 
                error.message.includes('non-existent') || !shouldRetry || retryCount >= maxRetries) {
              throw error;
            }
            
            // Exponential backoff - wait longer between each retry
            const delayMs = Math.min(1000 * Math.pow(2, retryCount), 10000);
            pushStats.retries++;
            
            progressSpinner.warn(`${description} failed, retrying in ${delayMs/1000}s (attempt ${retryCount+1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            
            return retryOperation(operation, description, retryCount + 1);
          }
        };
        
        // Get repository from chain to check remote state
        const remoteRepo = await retryOperation(
          () => getRepositoryFromChain(repository.id),
          'Getting repository state'
        );
        
        // Verify remote branch state and detect conflicts
        progressSpinner.text = 'Checking remote branch state...';
        const remoteBranchState = await retryOperation(
          () => getRemoteBranchState(repository.id, currentBranch),
          'Checking remote branch state'
        );
        
        const remoteHasConflicts = remoteBranchState.hasConflicts;
        
        // If remote has conflicts and force flag is not set, abort
        if (remoteHasConflicts && !options.force) {
          progressSpinner.fail('Remote has conflicting changes');
          throw new Error(
            "Remote branch has changes that conflict with your local branch. " +
            "Use --force to override (this may overwrite remote changes) or pull first to merge the changes."
          );
        }
        
        // If force push is specified but branch diverged, warn the user
        if (options.force && remoteBranchState.diverged) {
          progressSpinner.warn(
            `Warning: Force pushing to ${currentBranch}. ` +
            `This will overwrite ${remoteBranchState.ahead} commit(s) on the remote.`
          );
        }
        
        // Build commit chain for pushing all unpushed commits
        progressSpinner.text = `Building transaction for ${commitsToSync.length} commit(s)...`;
        
        // Get all commits to push in correct order (oldest first)
        const orderedCommits = commitsToSync.reverse();
        
        // Process commits in batches to avoid transaction size limits
        const batches = [];
        for (let i = 0; i < orderedCommits.length; i += batchSize) {
          batches.push(orderedCommits.slice(i, i + batchSize));
        }
        
        let lastTransactionDigest = null;
        let successfulBatches = 0;
        let pushedCommitCount = 0;
        
        // Two-phase approach:
        // 1. First push just the commits and trees
        // 2. Finally update the branch reference once all commits are pushed
        
        // Process each batch
        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          const batchProgress = `[${i+1}/${batches.length}]`;
          const isFinalBatch = i === batches.length - 1;
          
          // Update progress spinner
          progressSpinner.text = `${batchProgress} Pushing batch of ${batch.length} commit(s) to blockchain...`;
          
          // Build parent-child relationships for commit tree
          const parentCommitMap = new Map();
          let previousCommit = null;
          
          // Establish parent-child relationships between commits
          for (const commit of batch) {
            // Set parent from explicit parentCommitId property or previous commit
            if (commit.parent) {
              parentCommitMap.set(commit.hash, commit.parent);
            } else if (commit.parentCommitId) {
              parentCommitMap.set(commit.hash, commit.parentCommitId);
            } else if (previousCommit) {
              // If we have a previous commit in sequence and no explicit parent
              parentCommitMap.set(commit.hash, previousCommit.hash);
            }
            previousCommit = commit;
          }
          
          try {
            // First, try using the pushCommitBatchOnChain method which handles complex tree building
            const txOptions = {
              repositoryId: repository.id,
              branch: currentBranch,
              commits: batch,
              parentCommitMap: Object.fromEntries(parentCommitMap),
              force: options.force || false,
              isLastBatch: isFinalBatch
            };
            
            // Attempt to push the batch with automatic retries
            const pushResult = await retryOperation(
              () => pushCommitBatchOnChain(txOptions),
              `Pushing batch ${i+1}/${batches.length}`
            );
            
            // Store the transaction digest from the last successful batch
            lastTransactionDigest = pushResult.transactionDigest;
            pushedCommitCount += batch.length;
            successfulBatches++;
            
            // Track batch results for detailed reporting
            pushStats.batchResults.push({
              batchIndex: i,
              commitCount: batch.length,
              status: 'success',
              transactionDigest: pushResult.transactionDigest,
              gasUsed: pushResult.gasUsed
            });
            
            // Update progress
            progressSpinner.text = `${batchProgress} Batch pushed successfully. Transaction: ${lastTransactionDigest.substring(0, 8)}...`;
            pushStats.pushedCommits += batch.length;
            
          } catch (error) {
            // Track the failure
            pushStats.failedBatches++;
            pushStats.errors.push({
              batchIndex: i,
              error: error.message,
              commitHashes: batch.map(c => c.hash.substring(0, 8))
            });
            
            // If this is the final batch and it fails, it's critical
            if (isFinalBatch) {
              // Special handling for final batch
              progressSpinner.fail(`Failed to push final batch and update branch reference: ${error.message}`);
              
              // If we pushed some batches but failed the final, we should show a warning
              if (successfulBatches > 0) {
                progressSpinner.warn(
                  `${successfulBatches} out of ${batches.length} batches were pushed successfully, ` +
                  `but the branch reference was not updated. ` +
                  `Your commits are on the blockchain but not linked to the branch.`
                );
                
                // Try to update branch reference as a separate operation
                try {
                  const lastSuccessfulCommit = orderedCommits[pushedCommitCount - 1];
                  
                  progressSpinner.text = 'Attempting to update branch reference separately...';
                  
                  // Call pushCommitsOnChain which just updates the reference
                  const branchUpdateResult = await pushCommitsOnChain({
                    repositoryId: repository.id,
                    branch: currentBranch,
                    commits: [lastSuccessfulCommit],
                    force: options.force
                  });
                  
                  progressSpinner.succeed(`Branch reference updated separately. Transaction: ${branchUpdateResult.transactionDigest.substring(0, 8)}`);
                  lastTransactionDigest = branchUpdateResult.transactionDigest;
                } catch (refError) {
                  progressSpinner.fail(`Failed to update branch reference: ${refError.message}`);
                }
              }
              
              // Return partial success result
              return {
                commitHash: latestCommitHash,
                branch: currentBranch,
                commitCount: pushedCommitCount,
                status: 'partial_success',
                successfulBatches,
                totalBatches: batches.length,
                failedBatches: pushStats.failedBatches,
                errors: pushStats.errors,
                transactionDigest: lastTransactionDigest,
                message: `Pushed ${pushedCommitCount}/${pushStats.totalCommits} commits, but branch reference may not be updated`
              };
            }
            
            // For non-final batches, log and continue
            progressSpinner.warn(`Batch ${i+1} failed: ${error.message}`);
            continue;
          }
        }
        
        // All batches processed, update local references
        if (successfulBatches === batches.length) {
          // Update local branch reference to reflect the pushed state
          const branchRefsPath = path.join(walgitDir, 'refs', 'heads', currentBranch);
          fs.mkdirSync(path.dirname(branchRefsPath), { recursive: true });
          fs.writeFileSync(branchRefsPath, latestCommitHash);
          
          // Update local tracking information for this branch
          const trackingInfoPath = path.join(walgitDir, 'refs', 'remotes', 'origin', currentBranch);
          fs.mkdirSync(path.dirname(trackingInfoPath), { recursive: true });
          fs.writeFileSync(trackingInfoPath, latestCommitHash);
          
          progressSpinner.succeed(`Successfully pushed ${pushedCommitCount} commit(s) to blockchain`);
          
          // Calculate push metrics
          const duration = (Date.now() - pushStats.startTime) / 1000; // in seconds
          const commitsPerSecond = (pushedCommitCount / duration).toFixed(2);
          
          // Show advanced metrics for large pushes
          if (pushedCommitCount > 5) {
            console.log(chalk.blue(`Push metrics: ${duration.toFixed(2)}s, ${commitsPerSecond} commits/s, ${pushStats.retries} retries`));
          }
          
          return {
            commitHash: latestCommitHash,
            branch: currentBranch,
            commitCount: pushedCommitCount,
            status: 'success',
            transactionDigest: lastTransactionDigest,
            pushedFiles: orderedCommits.reduce((acc, commit) => acc + (commit.walrusBlobs?.length || 0), 0),
            duration: duration.toFixed(2),
            retries: pushStats.retries,
            metrics: {
              commitsPerSecond,
              batchResults: pushStats.batchResults
            }
          };
        } else {
          // Partial success
          progressSpinner.warn(`Partially successful: pushed ${pushedCommitCount}/${commitsToSync.length} commits in ${successfulBatches}/${batches.length} batches`);
          
          return {
            commitHash: latestCommitHash,
            branch: currentBranch,
            commitCount: pushedCommitCount,
            status: 'partial_success',
            successfulBatches,
            totalBatches: batches.length,
            failedBatches: pushStats.failedBatches,
            errors: pushStats.errors,
            transactionDigest: lastTransactionDigest
          };
        }
      } catch (error) {
        // Enhanced error handling with categorization and context
        let errorType = 'unknown';
        let errorMessage = error.message;
        let suggestion = '';
        
        // Handle blockchain-specific errors with detailed messages and suggestions
        if (error.message.includes('insufficient gas') || error.message.includes('gas budget')) {
          errorType = 'gas_error';
          suggestion = 'Try again with a higher gas budget or reduce the number of commits being pushed at once.';
          progressSpinner.fail('Transaction failed due to gas issues');
        } else if (error.message.includes('execution failure')) {
          errorType = 'contract_error';
          suggestion = 'Check contract permissions and data validity.';
          progressSpinner.fail('Smart contract execution failed');
        } else if (error.message.includes('non-existent object')) {
          errorType = 'object_error';
          suggestion = 'Try fetching the latest repository state.';
          progressSpinner.fail('Object not found on chain');
        } else if (error.message.includes('authority signature') || error.message.includes('permission')) {
          errorType = 'permission_error';
          suggestion = 'Verify your wallet has proper permissions for this repository.';
          progressSpinner.fail('Authentication error');
        } else if (error.message.includes('timeout')) {
          errorType = 'timeout_error';
          suggestion = 'The network might be congested. Try again later or with a smaller batch size.';
          progressSpinner.fail('Network timeout');
        } else if (error.message.includes('conflicting changes')) {
          errorType = 'conflict_error';
          suggestion = 'Use --force to override or pull and merge the changes first.';
          progressSpinner.fail('Remote conflict detected');
        } else {
          progressSpinner.fail('Failed to push to blockchain');
          console.error(chalk.red('Error details:'), error);
        }
        
        throw {
          message: errorMessage,
          type: errorType,
          suggestion,
          context: {
            repository: repository.id,
            branch: currentBranch,
            pushedCommits: pushStats.pushedCommits,
            totalCommits: pushStats.totalCommits,
            retries: pushStats.retries,
            errors: pushStats.errors
          }
        };
      }
    } else {
      // Local simulation mode
      progressSpinner.text = `Simulating push operation locally...`;
      
      if (useOnChain) {
        progressSpinner.info('Falling back to local simulation mode due to invalid package ID or configuration.');
      } else {
        progressSpinner.info('Using local simulation mode.');
      }
      
      // Simulate waiting for network
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local branch reference
      const branchRefsPath = path.join(walgitDir, 'refs', 'heads', currentBranch);
      fs.mkdirSync(path.dirname(branchRefsPath), { recursive: true });
      fs.writeFileSync(branchRefsPath, latestCommitHash);
      
      // Also create remote tracking info in local simulation
      const trackingInfoPath = path.join(walgitDir, 'refs', 'remotes', 'origin', currentBranch);
      fs.mkdirSync(path.dirname(trackingInfoPath), { recursive: true });
      fs.writeFileSync(trackingInfoPath, latestCommitHash);
      
      progressSpinner.succeed(`Successfully simulated push of ${commitsToSync.length} commit(s)`);
      console.log(chalk.yellow("Note: This is a local simulation. No data was sent to a remote or blockchain."));
      
      // Detailed push result for local simulation
      return {
        commitHash: latestCommitHash,
        branch: currentBranch,
        commitCount: commitsToSync.length,
        files: commitsToSync.reduce((acc, commit) => acc + (commit.walrusBlobs?.length || 0), 0),
        status: 'local_simulation_success',
        localTime: new Date().toISOString()
      };
    }
  } catch (error) {
    // Unified error handling
    if (typeof error === 'object' && error.message) {
      progressSpinner.fail(`Push failed: ${error.message}`);
      if (error.suggestion) {
        console.log(chalk.yellow(`Suggestion: ${error.suggestion}`));
      }
    } else {
      progressSpinner.fail(`Push failed: ${error}`);
    }
    throw error;
  }
};

/**
 * Push a batch of commits to the blockchain
 * @param {object} options - Push options
 * @param {string} options.repositoryId - Repository ID
 * @param {string} options.branch - Branch name
 * @param {Array} options.commits - Commits to push
 * @param {object} options.parentCommitMap - Map of commit hash to parent commit hash
 * @param {boolean} options.force - Force push
 * @param {boolean} options.isLastBatch - Whether this is the last batch
 * @returns {Promise<object>} Push result
 * @private
 */
async function pushCommitBatchOnChain(options) {
  const wallet = await initializeWallet();
  
  // Import TransactionBlock and tree building utilities
  const { TransactionBlock } = await import('@mysten/sui.js/transactions');
  const { buildTreeFromFiles, processFileList, createTreeObjectsInTransaction } = await import('./tree-builder.js');
  
  // Create transaction block
  const tx = new TransactionBlock();
  
  // Get package ID
  const WALGIT_PACKAGE_ID = process.env.WALGIT_PACKAGE_ID || '0x0';
  
  // Map to store object IDs created in this transaction
  const createdObjects = new Map();
  
  // Process each commit in the batch
  for (const commit of options.commits) {
    // Skip commits that don't have Walrus blob references
    if (!commit.walrusBlobs || commit.walrusBlobs.length === 0) {
      continue;
    }
    
    // Track progress points for complex transactions
    const commitProgress = {
      blobsCreated: 0,
      treeBuilt: false,
      commitCreated: false
    };
    
    try {
      // Filter out local simulation blobs
      const validBlobs = commit.walrusBlobs.filter(blob => !blob.blobId.startsWith('local-'));
      
      if (validBlobs.length === 0) {
        console.warn(`Skipping commit ${commit.hash.substring(0, 8)} - No valid Walrus blobs found`);
        continue;
      }
      
      // Process files for tree building
      const processedFiles = processFileList(validBlobs);
      
      // 1. First create all blob objects for this commit's files
      for (const blob of validBlobs) {
        // Convert Walrus blob ID to number if needed
        const blobIdNumeric = typeof blob.blobId === 'string' && !blob.blobId.startsWith('0x') 
          ? parseInt(blob.blobId, 10) 
          : blob.blobId;
        
        // Create blob object
        const blobResult = tx.moveCall({
          target: `${WALGIT_PACKAGE_ID}::git_blob_object::create_blob`,
          arguments: [
            tx.pure(blobIdNumeric),         // Blob ID in Walrus storage
            tx.pure(blob.size),             // File size
            tx.pure(blob.hash),             // File hash
            tx.pure(0)                      // Encoding (0 for binary)
          ]
        });
        
        // Store blob object ID for use in tree building
        createdObjects.set(`blob:${blob.path}`, blobResult);
        commitProgress.blobsCreated++;
      }
      
      // 2. Build tree structure using the tree-builder utilities
      const rootTree = buildTreeFromFiles(processedFiles);
      
      // Create tree objects in the transaction
      const rootTreeId = createTreeObjectsInTransaction(tx, rootTree);
      createdObjects.set(`tree:${commit.hash}`, rootTreeId);
      commitProgress.treeBuilt = true;
      
      // 3. Create commit object
      // Determine parent commit ID
      let parentCommitId = null;
      if (options.parentCommitMap && options.parentCommitMap[commit.hash]) {
        parentCommitId = options.parentCommitMap[commit.hash];
      } else if (commit.parent) {
        parentCommitId = commit.parent;
      }
      
      const parentCommitIdArg = parentCommitId 
        ? tx.pure(parentCommitId)
        : tx.pure(null);
      
      const timestamp = commit.timestamp 
        ? new Date(commit.timestamp).getTime().toString()
        : Date.now().toString();
      
      // Create the commit object
      const commitResult = tx.moveCall({
        target: `${WALGIT_PACKAGE_ID}::git_commit_object::create_commit`,
        arguments: [
          rootTreeId,                  // Root tree ID
          parentCommitIdArg,           // Parent commit ID
          tx.pure(commit.message),     // Commit message
          tx.pure(commit.hash),        // Commit hash
          tx.pure(timestamp)           // Timestamp
        ]
      });
      
      // Store commit ID
      createdObjects.set(`commit:${commit.hash}`, commitResult);
      commitProgress.commitCreated = true;
      
    } catch (error) {
      // Enhanced error reporting with progress information
      const progressInfo = `[Progress: ${commitProgress.blobsCreated} blobs created, ` +
        `tree built: ${commitProgress.treeBuilt}, ` +
        `commit created: ${commitProgress.commitCreated}]`;
      
      throw new Error(`Failed to process commit ${commit.hash.substring(0, 8)}: ${error.message} ${progressInfo}`);
    }
  }
  
  // Get the latest commit in the batch
  const latestCommit = options.commits[options.commits.length - 1];
  const latestCommitId = createdObjects.get(`commit:${latestCommit.hash}`);
  
  if (!latestCommitId) {
    throw new Error(`Failed to find created commit object for ${latestCommit.hash.substring(0, 8)}`);
  }
  
  // Only update branch reference if this is the last batch or force flag is set
  if (options.isLastBatch || options.force) {
    try {
      // Update branch reference to point to the latest commit
      if (options.force) {
        tx.moveCall({
          target: `${WALGIT_PACKAGE_ID}::git_reference::force_update_branch`,
          arguments: [
            tx.pure(options.repositoryId),   // Repository ID
            tx.pure(options.branch),         // Branch name
            latestCommitId                  // Latest commit ID
          ]
        });
      } else {
        tx.moveCall({
          target: `${WALGIT_PACKAGE_ID}::git_reference::update_branch`,
          arguments: [
            tx.pure(options.repositoryId),   // Repository ID
            tx.pure(options.branch),         // Branch name
            latestCommitId                  // Latest commit ID
          ]
        });
      }
    } catch (error) {
      throw new Error(`Failed to update branch reference: ${error.message}`);
    }
  }
  
  // Add extra gas for large transactions
  tx.setGasBudget(100000000); // Adjust as needed for transaction size
  
  // Sign and execute the transaction with retries and timeouts
  let result;
  try {
    result = await wallet.client.signAndExecuteTransactionBlock({
      signer: wallet.keypair,
      transactionBlock: tx,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true
      },
      requestType: 'WaitForLocalExecution' // Ensure we wait for local execution before returning
    });
  } catch (error) {
    // Enhanced error handling for transaction execution
    if (error.message.includes('gas')) {
      throw new Error(`Transaction failed due to gas issues. Try increasing gas budget or splitting into smaller batches: ${error.message}`);
    } else if (error.message.includes('timeout')) {
      throw new Error(`Transaction timed out. The network might be congested: ${error.message}`);
    } else {
      throw new Error(`Transaction execution failed: ${error.message}`);
    }
  }
  
  // Process events to extract commit and tree IDs
  const commitEvents = result.events.filter(event => 
    event.type.includes('::git_commit_object::CommitCreated')
  );
  
  const treeEvents = result.events.filter(event => 
    event.type.includes('::git_tree_object::TreeCreated')
  );
  
  const branchEvents = result.events.filter(event => 
    event.type.includes('::git_reference::ReferenceUpdated')
  );
  
  // Create detailed push result with additional metadata
  const detailedResult = {
    branch: options.branch,
    commitCount: options.commits.length,
    commits: commitEvents.map(event => ({
      id: event.parsedJson.commit_id,
      hash: options.commits.find(c => 
        event.parsedJson.commit_id.includes(c.hash.substring(0, 8))
      )?.hash || 'unknown'
    })),
    trees: treeEvents.map(event => event.parsedJson.tree_id),
    branchUpdated: branchEvents.length > 0,
    transactionDigest: result.digest,
    status: result.effects?.status?.status || 'unknown',
    gasUsed: result.effects?.gasUsed || null,
    timestamp: new Date().toISOString(),
    isLastBatch: options.isLastBatch,
    objectChanges: result.objectChanges?.length || 0
  };
  
  // Verify transaction status
  if (result.effects?.status?.status !== 'success') {
    throw new Error(`Transaction completed but with status: ${result.effects?.status?.status || 'unknown'}`);
  }
  
  return detailedResult;
}

// Implementation moved up (see line ~816)

/**
 * Compare local and remote commit histories to detect divergence
 * @param {string} walgitDir - Path to .walgit directory
 * @param {string} localCommitHash - Local commit hash
 * @param {string} remoteCommitHash - Remote commit hash
 * @param {string} branch - Branch name
 * @returns {Promise<object>} Comparison result with ahead/behind counts and divergence status
 */
export const compareCommitHistories = async (walgitDir, localCommitHash, remoteCommitHash, branch) => {
  if (!localCommitHash || !remoteCommitHash) {
    return {
      commonAncestor: null,
      localAhead: 0,
      remoteAhead: 0,
      diverged: false,
      fastForwardable: false
    };
  }
  
  // If local and remote are the same, no divergence
  if (localCommitHash === remoteCommitHash) {
    return {
      commonAncestor: localCommitHash,
      localAhead: 0,
      remoteAhead: 0,
      diverged: false,
      fastForwardable: false
    };
  }
  
  // Build commit history graphs for both local and remote
  const localCommits = new Map();
  const remoteCommits = new Map();
  
  try {
    // Helper function to load commit data
    const loadCommit = (commitHash) => {
      const commitPrefix = commitHash.substring(0, 2);
      const commitSuffix = commitHash.substring(2);
      const commitPath = path.join(walgitDir, 'objects', commitPrefix, commitSuffix);
      
      if (fs.existsSync(commitPath)) {
        return JSON.parse(fs.readFileSync(commitPath, 'utf-8'));
      }
      return null;
    };
    
    // Build local commit history
    const buildLocalHistory = (commitHash, depth = 0, maxDepth = 100) => {
      if (depth >= maxDepth || !commitHash || localCommits.has(commitHash)) {
        return;
      }
      
      const commit = loadCommit(commitHash);
      if (commit) {
        localCommits.set(commitHash, commit);
        if (commit.parent) {
          buildLocalHistory(commit.parent, depth + 1, maxDepth);
        }
      }
    };
    
    // Build remote commit history
    const buildRemoteHistory = (commitHash, depth = 0, maxDepth = 100) => {
      if (depth >= maxDepth || !commitHash || remoteCommits.has(commitHash)) {
        return;
      }
      
      const commit = loadCommit(commitHash);
      if (commit) {
        remoteCommits.set(commitHash, commit);
        if (commit.parent) {
          buildRemoteHistory(commit.parent, depth + 1, maxDepth);
        }
      }
    };
    
    // Build the commit history trees
    buildLocalHistory(localCommitHash);
    buildRemoteHistory(remoteCommitHash);
    
    // Find common ancestor (if any)
    let commonAncestor = null;
    const possibleAncestors = [];
    
    // Start with the most recently seen commits for efficiency
    for (const [hash, commit] of localCommits.entries()) {
      if (remoteCommits.has(hash)) {
        possibleAncestors.push({
          hash,
          commit,
          depth: getCommitDepth(hash, localCommits)
        });
      }
    }
    
    // Sort by depth (highest depth = closest to HEAD)
    possibleAncestors.sort((a, b) => b.depth - a.depth);
    
    // The first common commit with the highest depth is our ancestor
    if (possibleAncestors.length > 0) {
      commonAncestor = possibleAncestors[0].hash;
    }
    
    // Calculate ahead/behind counts
    const localAhead = countCommitsAhead(localCommitHash, commonAncestor, localCommits);
    const remoteAhead = countCommitsAhead(remoteCommitHash, commonAncestor, remoteCommits);
    
    // Determine if branches have diverged
    const diverged = localAhead > 0 && remoteAhead > 0;
    
    // Determine if fast-forward is possible
    const fastForwardable = (localAhead > 0 && remoteAhead === 0) || 
                           (remoteAhead > 0 && localAhead === 0);
    
    return {
      commonAncestor,
      localAhead,
      remoteAhead,
      diverged,
      fastForwardable
    };
  } catch (error) {
    console.error('Error comparing commit histories:', error);
    
    // Return safe defaults
    return {
      commonAncestor: null,
      localAhead: 0,
      remoteAhead: 0,
      diverged: false,
      fastForwardable: false
    };
  }
};

/**
 * Get the depth of a commit in the history tree
 * @param {string} commitHash - Commit hash
 * @param {Map} commitMap - Map of commits
 * @returns {number} Depth of the commit (0 = root)
 * @private
 */
function getCommitDepth(commitHash, commitMap) {
  let depth = 0;
  let currentHash = commitHash;
  
  while (currentHash) {
    depth++;
    const commit = commitMap.get(currentHash);
    if (!commit || !commit.parent) {
      break;
    }
    currentHash = commit.parent;
  }
  
  return depth;
}

/**
 * Count how many commits are ahead of the common ancestor
 * @param {string} startHash - Starting commit hash
 * @param {string} ancestorHash - Common ancestor hash
 * @param {Map} commitMap - Map of commits
 * @returns {number} Number of commits ahead
 * @private
 */
function countCommitsAhead(startHash, ancestorHash, commitMap) {
  if (!startHash || !ancestorHash) {
    return 0;
  }
  
  let count = 0;
  let currentHash = startHash;
  
  while (currentHash && currentHash !== ancestorHash) {
    count++;
    const commit = commitMap.get(currentHash);
    if (!commit || !commit.parent) {
      break;
    }
    currentHash = commit.parent;
  }
  
  return count;
}

// Implementation moved up (see line ~816)

/**
 * Pull commits from remote storage
 * @param {object} options - Pull options
 * @param {string} options.repositoryId - Repository ID
 * @param {string} options.branch - Branch to pull (defaults to current branch)
 * @param {boolean} options.verify - Verify signatures
 * @returns {Promise<object>} Pull result
 */
export const pullCommits = async (options) => {
  // Initialize wallet for authentication
  const wallet = await initializeWallet();
  const spinner = ora('Analyzing repository state...').start();

  try {
    // Check if we should use on-chain operations
    const useOnChain = process.env.WALGIT_USE_BLOCKCHAIN === 'true';
    const isPackageValid = useOnChain ? await validatePackageId() : false;

    // Get the git directory
    const walgitDir = getWalGitDir();
    const currentBranch = options.branch || 'main';
    let conflicts = [];
    let newFiles = 0;
    let updatedFiles = 0;
    let commitCount = 0;

    if (useOnChain && isPackageValid) {
      spinner.text = 'Fetching repository state from blockchain...';

      // Import necessary modules
      const { getRepositoryFromChain, getRemoteBranchState, getCommitFromChain, getTreeFromChain, getBlobFromChain } = await import('./sui-integration.js');
      const { downloadFromWalrus, checkBlobExists } = await import('./walrus-storage.js');

      // 1. Get repository info from blockchain
      const repository = await getRepositoryFromChain(options.repositoryId);
      if (!repository) {
        spinner.fail('Repository not found on blockchain');
        throw new Error('Repository not found on blockchain');
      }

      // 2. Get remote branch state
      const remoteBranchState = await getRemoteBranchState(options.repositoryId, currentBranch);
      if (!remoteBranchState.exists) {
        spinner.info(`Branch '${currentBranch}' does not exist on remote`);
        return {
          commitCount: 0,
          branch: currentBranch,
          newFiles: 0,
          conflicts: []
        };
      }

      // 3. Get remote commit chain
      const remoteCommitId = remoteBranchState.commitId;
      
      // 4. Determine branch divergence/conflicts
      let localCommitHash = null;
      const headPath = path.join(walgitDir, 'HEAD');
      
      if (fs.existsSync(headPath)) {
        const headContent = fs.readFileSync(headPath, 'utf-8').trim();
        
        if (headContent.startsWith('ref: ')) {
          const refPath = headContent.substring(5);
          const branchRefPath = path.join(walgitDir, refPath);
          
          if (fs.existsSync(branchRefPath)) {
            localCommitHash = fs.readFileSync(branchRefPath, 'utf-8').trim();
          }
        } else {
          // Detached HEAD state
          localCommitHash = headContent;
        }
      }

      // If branches have diverged, we need to handle conflicts
      if (remoteBranchState.diverged) {
        spinner.warn('Local and remote branches have diverged. Conflict detection activated.');
      }

      // 5. Traverse commit chain from blockchain
      spinner.text = 'Fetching commits from blockchain...';
      let currentCommitId = remoteCommitId;
      const processedCommits = new Set();
      const commitChain = [];
      
      while (currentCommitId && !processedCommits.has(currentCommitId)) {
        processedCommits.add(currentCommitId);
        
        try {
          // Get commit details
          const commit = await getCommitFromChain(currentCommitId);
          commitChain.unshift(commit); // Add to beginning to get oldest first
          
          // Move to parent commit
          currentCommitId = commit.parentCommitId;
        } catch (error) {
          spinner.warn(`Failed to fetch commit ${currentCommitId}: ${error.message}`);
          break;
        }
        
        // Update number of commits processed
        commitCount++;
      }

      // If no commits found, return early
      if (commitChain.length === 0) {
        spinner.info('No new commits to pull');
        return {
          commitCount: 0,
          branch: currentBranch,
          newFiles: 0,
          conflicts: []
        };
      }

      // 6. Process each commit in the chain
      spinner.text = `Processing ${commitChain.length} commits...`;
      
      // Track all files to download
      const filesToDownload = new Map(); // Maps blob IDs to file paths
      
      // Process commits to build file structures
      for (const commit of commitChain) {
        spinner.text = `Processing commit: ${commit.message}`;
        
        try {
          // Get tree info
          const rootTree = await getTreeFromChain(commit.treeId);
          
          // Recursive function to process tree entries
          const processTreeEntries = async (tree, basePath = '') => {
            for (const entry of tree.entries) {
              const entryPath = path.join(basePath, entry.name);
              
              if (entry.type === 'blob') {
                try {
                  // Get blob details
                  const blob = await getBlobFromChain(entry.objectId);
                  
                  // Add blob to download queue if not already tracked
                  if (blob.walrusBlobId && !filesToDownload.has(blob.walrusBlobId)) {
                    filesToDownload.set(blob.walrusBlobId, {
                      path: entryPath,
                      hash: blob.hash,
                      size: blob.size
                    });
                  }
                } catch (error) {
                  spinner.warn(`Failed to fetch blob info for ${entryPath}: ${error.message}`);
                }
              } else if (entry.type === 'tree') {
                try {
                  // Get subtree and recursively process
                  const subtree = await getTreeFromChain(entry.objectId);
                  await processTreeEntries(subtree, entryPath);
                } catch (error) {
                  spinner.warn(`Failed to fetch subtree for ${entryPath}: ${error.message}`);
                }
              }
            }
          };
          
          // Start recursive tree processing
          await processTreeEntries(rootTree);
          
        } catch (error) {
          spinner.warn(`Failed to process commit tree: ${error.message}`);
        }
      }

      // 7. Download files from Walrus
      if (filesToDownload.size > 0) {
        spinner.text = `Downloading ${filesToDownload.size} files from Walrus storage...`;
        
        let downloadedCount = 0;
        let failedCount = 0;
        
        // Process downloads in reasonable batch sizes
        const batchSize = 5; // Process 5 files at a time
        const blobIds = Array.from(filesToDownload.keys());
        
        for (let i = 0; i < blobIds.length; i += batchSize) {
          const batch = blobIds.slice(i, i + batchSize);
          spinner.text = `Downloading files (${downloadedCount}/${filesToDownload.size})...`;
          
          // Process batch in parallel
          await Promise.all(batch.map(async (blobId) => {
            const fileInfo = filesToDownload.get(blobId);
            const localFilePath = path.join(process.cwd(), fileInfo.path);
            
            try {
              // Check if blob exists
              const exists = await checkBlobExists(blobId);
              if (!exists) {
                console.warn(chalk.yellow(`Warning: Blob ${blobId} does not exist in Walrus storage`));
                failedCount++;
                return;
              }
              
              // Check if file exists locally
              const fileExists = fs.existsSync(localFilePath);
              
              // Check for conflicts if file exists
              if (fileExists) {
                const localContent = fs.readFileSync(localFilePath);
                const localHash = crypto.createHash('md5').update(localContent).digest('hex');
                
                // If local file is different, we have a conflict
                if (localHash !== fileInfo.hash) {
                  conflicts.push(fileInfo.path);
                  
                  // Create backup of local file
                  const backupPath = `${localFilePath}.local`;
                  fs.copyFileSync(localFilePath, backupPath);
                  
                  // Download and replace (will be marked as conflict)
                  await downloadFromWalrus(blobId, localFilePath);
                  updatedFiles++;
                }
              } else {
                // New file, download it
                const dir = path.dirname(localFilePath);
                fs.mkdirSync(dir, { recursive: true });
                
                await downloadFromWalrus(blobId, localFilePath);
                newFiles++;
              }
              
              downloadedCount++;
            } catch (error) {
              console.error(chalk.red(`Failed to download file ${fileInfo.path}:`), error.message);
              failedCount++;
            }
          }));
        }
        
        spinner.text = `Downloaded ${downloadedCount} files (${failedCount} failed)`;
      }

      // 8. Update local references
      spinner.text = 'Updating local references...';
      
      // Update branch reference in .walgit
      const branchRefsPath = path.join(walgitDir, 'refs', 'heads', currentBranch);
      fs.mkdirSync(path.dirname(branchRefsPath), { recursive: true });
      fs.writeFileSync(branchRefsPath, remoteCommitId);
      
      // Update remote tracking info
      const remoteRefsPath = path.join(walgitDir, 'refs', 'remotes', 'origin', currentBranch);
      fs.mkdirSync(path.dirname(remoteRefsPath), { recursive: true });
      fs.writeFileSync(remoteRefsPath, remoteCommitId);
      
      // Set HEAD to point to the branch
      fs.writeFileSync(path.join(walgitDir, 'HEAD'), `ref: refs/heads/${currentBranch}`);
      
      // Success message
      if (conflicts.length > 0) {
        spinner.warn(`Pulled ${commitCount} commits with ${conflicts.length} conflicts`);
      } else {
        spinner.succeed(`Successfully pulled ${commitCount} commits from blockchain`);
      }
      
      return {
        commitCount,
        branch: currentBranch,
        newFiles,
        updatedFiles,
        conflicts
      };
      
    } else {
      // Local simulation mode
      spinner.info('Using local simulation mode for pull');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      
      spinner.succeed('Simulated pull completed');
      return {
        commitCount: 3,
        branch: currentBranch,
        newFiles: 5,
        updatedFiles: 2,
        conflicts: []
      };
    }
  } catch (error) {
    spinner.fail(`Pull failed: ${error.message}`);
    throw error;
  }
};

/**
 * Clone a repository
 * @param {object} options - Clone options
 * @param {string} options.owner - Repository owner
 * @param {string} options.repoName - Repository name
 * @param {string} options.branch - Branch to checkout
 * @param {string} options.directory - Directory to clone into
 * @param {number} options.depth - Create a shallow clone with specified depth
 * @param {boolean} options.recursive - Initialize all submodules
 * @returns {Promise<object>} Clone result
 */
export const cloneRepository = async (options) => {
  // Initialize wallet for authentication
  const wallet = await initializeWallet();

  // In a real implementation, this would:
  // 1. Fetch repository metadata from blockchain
  // 2. Download content from Walrus storage
  // 3. Set up local repository structure

  // Mock clone result
  return {
    success: true,
    repoId: `walgit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    branch: options.branch || 'main',
    commit: `commit-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  };
};

/**
 * Get repository status
 * @param {object} options - Status options
 * @param {boolean} options.short - Give output in short format
 * @param {boolean} options.branch - Show branch information
 * @param {string} options.untrackedFiles - Show untracked files mode
 * @returns {Promise<object>} Repository status
 */
export const getRepositoryStatus = async (options) => {
  // Initialize wallet for authentication
  const wallet = await initializeWallet();

  // Get current repository
  const repository = await getCurrentRepository();

  // Mock status result
  return {
    currentBranch: 'main',
    upstream: 'origin/main',
    relation: 'ahead of',
    commits: 2,
    stagedChanges: [
      { path: 'src/index.js', status: 'modified' },
      { path: 'README.md', status: 'modified' }
    ],
    unstagedChanges: [
      { path: 'package.json', status: 'modified' }
    ],
    untrackedFiles: [
      'new-file.txt'
    ]
  };
};

/**
 * List branches
 * @param {object} options - Branch listing options
 * @param {boolean} options.all - List both remote-tracking and local branches
 * @param {boolean} options.remotes - List the remote-tracking branches
 * @returns {Promise<Array>} Branches list
 */
export const listBranches = async (options) => {
  // Initialize wallet for authentication
  const wallet = await initializeWallet();

  // Mock branches list
  return [
    { name: 'main', current: true, upstream: 'origin/main', ahead: 2, behind: 0 },
    { name: 'develop', current: false, upstream: 'origin/develop', ahead: 0, behind: 1 },
    { name: 'feature/new-feature', current: false, upstream: null, ahead: 0, behind: 0 }
  ];
};

/**
 * Create a branch
 * @param {string} branchName - Branch name
 * @param {object} options - Branch creation options
 * @param {boolean} options.force - Force creation/reset
 * @param {boolean} options.orphan - Create orphan branch
 * @returns {Promise<object>} Created branch data
 */
export const createBranch = async (branchName, options = {}) => {
  // Initialize wallet for authentication
  const wallet = await initializeWallet();

  // Mock branch creation
  return {
    name: branchName,
    commit: `commit-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  };
};

/**
 * Delete a branch
 * @param {string} branchName - Branch name
 * @returns {Promise<object>} Deletion result
 */
export const deleteBranch = async (branchName) => {
  // Initialize wallet for authentication
  const wallet = await initializeWallet();

  // Mock branch deletion
  return { success: true };
};

/**
 * Rename a branch
 * @param {string} oldName - Old branch name
 * @param {string} newName - New branch name
 * @returns {Promise<object>} Rename result
 */
export const renameBranch = async (oldName, newName) => {
  // Initialize wallet for authentication
  const wallet = await initializeWallet();

  // Mock branch renaming
  return {
    oldName,
    newName,
    success: true
  };
};

/**
 * Checkout a branch
 * @param {string} branchName - Branch name
 * @param {object} options - Checkout options
 * @param {boolean} options.force - Force checkout
 * @returns {Promise<object>} Checkout result
 */
export const checkoutBranch = async (branchName, options = {}) => {
  // Initialize wallet for authentication
  const wallet = await initializeWallet();

  // Mock branch checkout
  return {
    name: branchName,
    previousBranch: 'main',
    commit: `commit-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  };
};

/**
 * List remotes
 * @returns {Promise<Array>} Remotes list
 */
export const listRemotes = async () => {
  // Initialize wallet for authentication
  const wallet = await initializeWallet();

  // Mock remotes list
  return [
    { name: 'origin', url: 'walgit://walrus-dev/walgit-core', pushUrl: null },
    { name: 'upstream', url: 'walgit://walgit-org/walgit-core', pushUrl: null }
  ];
};

/**
 * Add a remote
 * @param {string} name - Remote name
 * @param {string} url - Remote URL
 * @param {object} options - Remote options
 * @param {boolean} options.fetch - Fetch after adding
 * @param {string} options.track - Branch to track
 * @returns {Promise<object>} Add result
 */
export const addRemote = async (name, url, options = {}) => {
  // Initialize wallet for authentication
  const wallet = await initializeWallet();

  // Mock remote addition
  return { success: true };
};

/**
 * Remove a remote
 * @param {string} name - Remote name
 * @returns {Promise<object>} Remove result
 */
export const removeRemote = async (name) => {
  // Initialize wallet for authentication
  const wallet = await initializeWallet();

  // Mock remote removal
  return { success: true };
};

/**
 * Set remote URL
 * @param {string} name - Remote name
 * @param {string} url - Remote URL
 * @param {object} options - URL options
 * @param {boolean} options.push - Set push URL
 * @param {boolean} options.add - Add URL instead of changing
 * @returns {Promise<object>} Set URL result
 */
export const setRemoteUrl = async (name, url, options = {}) => {
  // Initialize wallet for authentication
  const wallet = await initializeWallet();

  // Mock remote URL update
  return { success: true };
};

/**
 * Get commit history
 * @param {object} options - Log options
 * @param {number} options.maxCount - Limit number of commits
 * @param {number} options.skip - Skip number of commits
 * @param {string} options.since - Show commits more recent than date
 * @param {string} options.until - Show commits older than date
 * @param {string} options.author - Filter by author
 * @param {string} options.grep - Filter by message pattern
 * @param {boolean} options.oneline - Show each commit as single line
 * @param {boolean} options.graph - Show text-based graph
 * @returns {Promise<Array>} Commit history
 */
export const getCommitHistory = async (options = {}) => {
  // Initialize wallet for authentication
  const wallet = await initializeWallet();

  // Mock commit history
  return [
    {
      id: `commit-${Date.now() - 86400000}-${Math.floor(Math.random() * 1000)}`,
      author: 'Walrus Developer',
      email: 'dev@walgit.io',
      date: new Date(Date.now() - 86400000).toISOString(),
      message: 'Add new feature\n\nThis commit adds a new feature to the repository.'
    },
    {
      id: `commit-${Date.now() - 172800000}-${Math.floor(Math.random() * 1000)}`,
      author: 'Walrus Developer',
      email: 'dev@walgit.io',
      date: new Date(Date.now() - 172800000).toISOString(),
      message: 'Update README.md\n\nUpdate documentation with new information.'
    },
    {
      id: `commit-${Date.now() - 259200000}-${Math.floor(Math.random() * 1000)}`,
      author: 'Walrus Developer',
      email: 'dev@walgit.io',
      date: new Date(Date.now() - 259200000).toISOString(),
      message: 'Initial commit'
    }
  ];
};

/**
 * Fetch from remote
 * @param {object} options - Fetch options
 * @param {string} options.remote - Remote name
 * @param {string} options.branch - Branch to fetch
 * @param {boolean} options.all - Fetch all remotes
 * @param {boolean} options.prune - Remove deleted remote branches
 * @param {boolean} options.tags - Fetch all tags
 * @param {number} options.depth - Limit fetching to depth
 * @param {boolean} options.force - Force fetching
 * @returns {Promise<object>} Fetch result
 */
export const fetchRemote = async (options = {}) => {
  // Initialize wallet for authentication
  const wallet = await initializeWallet();
  const spinner = ora('Initializing fetch...').start();

  try {
    // Check if we should use on-chain operations
    const useOnChain = process.env.WALGIT_USE_BLOCKCHAIN === 'true';
    const isPackageValid = useOnChain ? await validatePackageId() : false;

    // Get current repository
    const repository = await getCurrentRepository();
    if (!repository) {
      spinner.fail('Not in a WalGit repository');
      throw new Error('Not in a WalGit repository');
    }

    // Get the repository ID
    const repositoryId = repository.id;
    
    // Get the git directory
    const walgitDir = getWalGitDir();
    
    // Determine which remote to use
    const remoteName = options.remote || 'origin';
    const remoteUrl = `walgit://${repository.owner}/${repository.name}`;
    
    // Track metrics and results
    const updatedRefs = [];
    let newObjects = 0;
    let fetchedCommits = 0;
    let fetchedTrees = 0;
    let fetchedBlobs = 0;
    
    if (useOnChain && isPackageValid) {
      spinner.text = 'Connecting to blockchain...';
      
      // Import necessary modules
      const { 
        getRepositoryFromChain, 
        getRemoteBranchState, 
        getCommitFromChain, 
        getTreeFromChain, 
        getBlobFromChain 
      } = await import('./sui-integration.js');
      
      // Get repository info from blockchain
      spinner.text = 'Fetching repository metadata...';
      const remoteRepo = await getRepositoryFromChain(repositoryId);
      
      if (!remoteRepo) {
        spinner.fail('Repository not found on blockchain');
        throw new Error('Repository not found on blockchain');
      }
      
      // Determine which branches to fetch
      let branchesToFetch = [];
      
      if (options.all) {
        spinner.text = 'Fetching all branches...';
        
        // Get all branches
        // In a real implementation, we would query for all branches
        // For now, we'll assume main and develop branches
        branchesToFetch = ['main', 'develop'];
        
        // If there are custom branches in the repository, add them
        if (remoteRepo.branches && Array.isArray(remoteRepo.branches)) {
          branchesToFetch = [...new Set([...branchesToFetch, ...remoteRepo.branches.map(b => b.name)])];
        }
      } else if (options.branch) {
        // Just fetch the specified branch
        branchesToFetch = [options.branch];
      } else {
        // Default to main branch
        branchesToFetch = ['main'];
      }
      
      // Process each branch to fetch
      for (const branchName of branchesToFetch) {
        spinner.text = `Fetching branch '${branchName}'...`;
        
        try {
          // Get remote branch state
          const remoteBranchState = await getRemoteBranchState(repositoryId, branchName);
          
          if (!remoteBranchState.exists) {
            spinner.info(`Branch '${branchName}' does not exist on remote`);
            continue;
          }
          
          // Get local reference to this branch if it exists
          const localBranchRefPath = path.join(walgitDir, 'refs', 'heads', branchName);
          const remoteTrackingRefPath = path.join(walgitDir, 'refs', 'remotes', remoteName, branchName);
          
          let localCommitId = null;
          let remoteTrackingId = null;
          
          if (fs.existsSync(localBranchRefPath)) {
            localCommitId = fs.readFileSync(localBranchRefPath, 'utf-8').trim();
          }
          
          if (fs.existsSync(remoteTrackingRefPath)) {
            remoteTrackingId = fs.readFileSync(remoteTrackingRefPath, 'utf-8').trim();
          }
          
          // Get remote commit ID
          const remoteCommitId = remoteBranchState.commitId;
          
          // Skip if already up to date
          if (remoteTrackingId === remoteCommitId) {
            spinner.info(`Branch '${branchName}' already up to date`);
            continue;
          }
          
          // Determine if this is a fast-forward, update, or divergent change
          let refUpdateType = 'update';
          
          if (remoteTrackingId) {
            // Compare with previous tracking reference
            if (remoteBranchState.fastForwardable) {
              refUpdateType = 'fastForward';
            } else if (remoteBranchState.diverged) {
              refUpdateType = 'diverged';
              
              if (!options.force) {
                spinner.warn(`Branch '${branchName}' has diverged and requires a force fetch`);
                continue;
              }
            }
          } else {
            // New branch
            refUpdateType = 'new';
          }
          
          // Store updated reference for reporting
          updatedRefs.push({
            name: branchName,
            oldId: remoteTrackingId || '0000000',
            newId: remoteCommitId,
            type: refUpdateType
          });
          
          // Fetch commit history and objects
          spinner.text = `Downloading objects for branch '${branchName}'...`;
          
          // Track already processed objects to avoid duplicates
          const processedObjects = new Set();
          
          // Process commit chain up to the specified depth
          let currentCommitId = remoteCommitId;
          let depth = 0;
          const maxDepth = options.depth || Number.MAX_SAFE_INTEGER;
          
          while (currentCommitId && depth < maxDepth && !processedObjects.has(currentCommitId)) {
            processedObjects.add(currentCommitId);
            
            try {
              // Get commit details
              const commit = await getCommitFromChain(currentCommitId);
              fetchedCommits++;
              
              // Store commit object locally
              const commitDir = path.join(walgitDir, 'objects', currentCommitId.substring(0, 2));
              const commitPath = path.join(commitDir, currentCommitId.substring(2));
              fs.mkdirSync(commitDir, { recursive: true });
              fs.writeFileSync(commitPath, JSON.stringify(commit, null, 2));
              
              // Get the tree
              if (commit.treeId && !processedObjects.has(commit.treeId)) {
                processedObjects.add(commit.treeId);
                
                // Get root tree object
                const rootTree = await getTreeFromChain(commit.treeId);
                fetchedTrees++;
                
                // Store tree locally
                const treeDir = path.join(walgitDir, 'objects', commit.treeId.substring(0, 2));
                const treePath = path.join(treeDir, commit.treeId.substring(2));
                fs.mkdirSync(treeDir, { recursive: true });
                fs.writeFileSync(treePath, JSON.stringify(rootTree, null, 2));
                
                // Process tree for blob references (without downloading contents)
                await processTreeForBlobs(rootTree, processedObjects);
              }
              
              // Move to parent commit
              currentCommitId = commit.parentCommitId;
              depth++;
              
            } catch (error) {
              spinner.warn(`Failed to fetch commit ${currentCommitId}: ${error.message}`);
              break;
            }
          }
          
          // Update remote tracking reference
          fs.mkdirSync(path.dirname(remoteTrackingRefPath), { recursive: true });
          fs.writeFileSync(remoteTrackingRefPath, remoteCommitId);
          
          // Increment total object count
          newObjects += fetchedCommits + fetchedTrees + fetchedBlobs;
        } catch (error) {
          spinner.warn(`Failed to fetch branch '${branchName}': ${error.message}`);
        }
      }
      
      // Handle pruning of deleted remote branches
      if (options.prune) {
        spinner.text = 'Pruning deleted remote branches...';
        
        // Get all local remote-tracking refs
        const remoteRefsDir = path.join(walgitDir, 'refs', 'remotes', remoteName);
        if (fs.existsSync(remoteRefsDir)) {
          const trackingRefs = getAllFilesInDirectory(remoteRefsDir);
          
          for (const trackingRefPath of trackingRefs) {
            const relativePath = path.relative(remoteRefsDir, trackingRefPath);
            const branchName = relativePath.replace(/\\/g, '/'); // Normalize path separators
            
            try {
              // Check if branch still exists on remote
              const remoteBranchState = await getRemoteBranchState(repositoryId, branchName);
              
              if (!remoteBranchState.exists) {
                // Branch was deleted on remote, prune it locally
                fs.unlinkSync(trackingRefPath);
                
                updatedRefs.push({
                  name: branchName,
                  oldId: fs.readFileSync(trackingRefPath, 'utf-8').trim(),
                  newId: '0000000',
                  type: 'pruned'
                });
              }
            } catch (error) {
              // Skip on error
              spinner.warn(`Failed to check branch '${branchName}' for pruning: ${error.message}`);
            }
          }
        }
      }
      
      // Fetch tags if requested
      if (options.tags) {
        spinner.text = 'Fetching tags...';
        
        // This would be implemented similarly to branch fetching
        // For now, we'll simulate tag fetching
        // ... tag fetching implementation would go here
      }
      
      // Success message
      if (newObjects > 0) {
        spinner.succeed(`Fetched ${newObjects} objects from remote`);
      } else {
        spinner.succeed('Already up to date');
      }
      
      return {
        remoteUrl,
        newObjects,
        updatedRefs,
        commits: fetchedCommits,
        trees: fetchedTrees,
        blobs: fetchedBlobs,
      };
      
    } else {
      // Local simulation mode
      spinner.info('Using local simulation mode for fetch');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      
      spinner.succeed('Simulated fetch completed');
      return {
        remoteUrl: `walgit://${repository.owner}/${repository.name}`,
        newObjects: 5,
        updatedRefs: [
          { name: 'main', oldId: '0000000', newId: `sim-${Date.now()}`, type: 'fastForward' },
          { name: 'develop', oldId: '0000000', newId: `sim-${Date.now() + 1}`, type: 'update' }
        ]
      };
    }
  } catch (error) {
    spinner.fail(`Fetch failed: ${error.message}`);
    throw error;
  }
  
  /**
   * Process a tree to find and store blob references
   * @param {object} tree - Tree object
   * @param {Set} processedObjects - Set of already processed object IDs
   * @returns {Promise<void>}
   */
  async function processTreeForBlobs(tree, processedObjects) {
    const { getBlobFromChain, getTreeFromChain } = await import('./sui-integration.js');
    
    for (const entry of tree.entries) {
      if (entry.type === 'blob' && !processedObjects.has(entry.objectId)) {
        processedObjects.add(entry.objectId);
        
        try {
          // Get blob metadata (not content)
          const blob = await getBlobFromChain(entry.objectId);
          fetchedBlobs++;
          
          // Store blob reference metadata locally
          const blobDir = path.join(walgitDir, 'objects', entry.objectId.substring(0, 2));
          const blobPath = path.join(blobDir, entry.objectId.substring(2));
          fs.mkdirSync(blobDir, { recursive: true });
          fs.writeFileSync(blobPath, JSON.stringify(blob, null, 2));
          
        } catch (error) {
          console.warn(chalk.yellow(`Warning: Failed to fetch blob ${entry.objectId}: ${error.message}`));
        }
      } else if (entry.type === 'tree' && !processedObjects.has(entry.objectId)) {
        processedObjects.add(entry.objectId);
        
        try {
          // Get subtree
          const subtree = await getTreeFromChain(entry.objectId);
          fetchedTrees++;
          
          // Store tree locally
          const treeDir = path.join(walgitDir, 'objects', entry.objectId.substring(0, 2));
          const treePath = path.join(treeDir, entry.objectId.substring(2));
          fs.mkdirSync(treeDir, { recursive: true });
          fs.writeFileSync(treePath, JSON.stringify(subtree, null, 2));
          
          // Process subtree recursively
          await processTreeForBlobs(subtree, processedObjects);
          
        } catch (error) {
          console.warn(chalk.yellow(`Warning: Failed to fetch tree ${entry.objectId}: ${error.message}`));
        }
      }
    }
  }
  
  /**
   * Get all files in a directory recursively
   * @param {string} directory - Directory path
   * @returns {Array<string>} Array of file paths
   */
  function getAllFilesInDirectory(directory) {
    const files = [];
    
    function traverse(dir) {
      if (fs.existsSync(dir)) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            traverse(fullPath);
          } else {
            files.push(fullPath);
          }
        }
      }
    }
    
    traverse(directory);
    return files;
  }
};

/**
 * Merge changes
 * @param {object} options - Merge options
 * @param {string} options.branch - Branch to merge
 * @param {boolean} options.noFastForward - No fast-forward
 * @param {boolean} options.fastForwardOnly - Fast-forward only
 * @param {string} options.message - Merge commit message
 * @param {boolean} options.abort - Abort merge
 * @param {boolean} options.continue - Continue merge
 * @returns {Promise<object>} Merge result
 */
export const mergeChanges = async (options = {}) => {
  // Initialize wallet for authentication
  const wallet = await initializeWallet();

  // Mock merge result
  return {
    success: true,
    fastForward: false,
    commitId: `commit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    filesChanged: 3,
    insertions: 25,
    deletions: 10,
    conflicts: []
  };
};

/**
 * Create a tag
 * @param {object} options - Tag options
 * @param {string} options.name - Tag name
 * @param {string} options.commit - Commit to tag
 * @param {boolean} options.annotate - Create annotated tag
 * @param {string} options.message - Tag message
 * @returns {Promise<object>} Tag creation result
 */
export const createTag = async (options = {}) => {
  // Initialize wallet for authentication
  const wallet = await initializeWallet();

  // Mock tag creation
  return {
    name: options.name,
    commit: options.commit,
    annotated: options.annotate,
    message: options.message
  };
};

/**
 * Delete a tag
 * @param {string} tagName - Tag name
 * @returns {Promise<object>} Tag deletion result
 */
export const deleteTag = async (tagName) => {
  // Initialize wallet for authentication
  const wallet = await initializeWallet();

  // Mock tag deletion
  return { success: true };
};

/**
 * List tags
 * @param {string} pattern - Pattern to match tag names
 * @returns {Promise<Array>} Tags list
 */
export const listTags = async (pattern) => {
  // Initialize wallet for authentication
  const wallet = await initializeWallet();

  // Mock tags list
  return [
    { name: 'v1.0.0', commit: 'abcdef1', annotation: 'Version 1.0.0 release' },
    { name: 'v0.9.0', commit: 'bcdef12', annotation: 'Beta release' },
    { name: 'v0.1.0', commit: 'cdef123', annotation: 'Initial release' }
  ];
};

/**
 * Reset repository
 * @param {object} options - Reset options
 * @param {string} options.commit - Commit to reset to
 * @param {string} options.mode - Reset mode (soft, mixed, hard)
 * @param {Array} options.paths - Paths to reset
 * @returns {Promise<object>} Reset result
 */
export const resetRepository = async (options = {}) => {
  // Initialize wallet for authentication
  const wallet = await initializeWallet();

  // Mock reset result
  return {
    success: true,
    commit: options.commit,
    mode: options.mode,
    paths: options.paths
  };
};

/**
 * Revert a commit
 * @param {object} options - Revert options
 * @param {string} options.commit - Commit to revert
 * @param {boolean} options.noCommit - Don't create commit
 * @param {number} options.mainline - Parent number for merge commit
 * @param {boolean} options.abort - Abort revert
 * @param {boolean} options.continue - Continue revert
 * @returns {Promise<object>} Revert result
 */
export const revertCommit = async (options = {}) => {
  // Initialize wallet for authentication
  const wallet = await initializeWallet();

  // Mock revert result
  return {
    success: true,
    commitId: `commit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    filesChanged: 2,
    insertions: 15,
    deletions: 15,
    conflicts: []
  };
};

/**
 * List repositories owned by the current user
 * @returns {Promise<Array>} Repositories list
 */
export const listRepositories = async () => {
  // Initialize wallet for authentication
  const wallet = await initializeWallet();

  // Mock repositories list
  return [
    {
      id: 'walgit-repo-1',
      name: 'my-project',
      description: 'A sample project',
      isPrivate: false,
      defaultBranch: 'main',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'walgit-repo-2',
      name: 'private-repo',
      description: 'A private project',
      isPrivate: true,
      defaultBranch: 'develop',
      updatedAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    }
  ];
};

/**
 * Get repository details
 * @param {string} repoId - Repository ID or name
 * @returns {Promise<object>} Repository details
 */
export const getRepositoryDetails = async (repoId) => {
  // Initialize wallet for authentication
  const wallet = await initializeWallet();

  // Mock repository details
  return {
    id: repoId || 'walgit-repo-1',
    name: 'my-project',
    description: 'A sample project',
    isPrivate: false,
    owner: wallet.address,
    defaultBranch: 'main',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(), // 30 days ago
    updatedAt: new Date().toISOString(),
    branches: [
      { name: 'main', commitCount: 15 },
      { name: 'develop', commitCount: 7 }
    ],
    commits: [
      {
        id: 'commit-123456',
        message: 'Update README.md',
        author: wallet.address,
        timestamp: new Date().toISOString()
      },
      {
        id: 'commit-123455',
        message: 'Fix bug in login component',
        author: wallet.address,
        timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      }
    ]
  };
};

/**
 * Delete a repository
 * @param {string} repoId - Repository ID
 * @returns {Promise<boolean>} Whether the deletion was successful
 */
export const deleteRepository = async (repoId) => {
  // Initialize wallet for authentication
  const wallet = await initializeWallet();

  // In a real implementation, this would:
  // 1. Call contract to remove repository from blockchain
  // 2. Delete content from Walrus storage

  return true;
};

/**
 * Get tree structure for a commit
 * @param {object} options - Tree options
 * @param {string} options.commit - Commit ID (defaults to HEAD)
 * @param {string} options.path - Path within the tree to display
 * @param {boolean} options.recursive - Recursively include subtrees
 * @param {object} options.repository - Repository object
 * @returns {Promise<object>} Tree structure data
 */
export const getTreeStructure = async (options) => {
  // Initialize wallet for authentication
  const wallet = await initializeWallet();

  // In a real implementation, this would:
  // 1. Fetch commit object from blockchain
  // 2. Fetch root tree object
  // 3. Traverse to the specified path
  // 4. Fetch all subtrees if recursive option is enabled

  // Mock commit ID
  const commitId = options.commit || `commit-${Date.now() - 86400000}-${Math.floor(Math.random() * 1000)}`;

  // Create mock root tree
  const rootTree = {
    id: `tree-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    entries: [
      {
        name: 'README.md',
        type: 'blob',
        object_id: `blob-${Date.now()}-1`,
        mode: 0o644
      },
      {
        name: 'src',
        type: 'tree',
        object_id: `tree-${Date.now()}-2`,
        mode: 0o755,
        subtree: {
          id: `tree-${Date.now()}-2`,
          entries: [
            {
              name: 'index.js',
              type: 'blob',
              object_id: `blob-${Date.now()}-3`,
              mode: 0o644
            },
            {
              name: 'utils',
              type: 'tree',
              object_id: `tree-${Date.now()}-4`,
              mode: 0o755,
              subtree: {
                id: `tree-${Date.now()}-4`,
                entries: [
                  {
                    name: 'helper.js',
                    type: 'blob',
                    object_id: `blob-${Date.now()}-5`,
                    mode: 0o644
                  }
                ]
              }
            }
          ]
        }
      },
      {
        name: 'package.json',
        type: 'blob',
        object_id: `blob-${Date.now()}-6`,
        mode: 0o644
      }
    ]
  };

  // Handle path filtering
  let targetTree = rootTree;
  if (options.path) {
    const pathParts = options.path.split('/').filter(part => part);

    for (const part of pathParts) {
      const treeEntry = targetTree.entries.find(entry =>
        entry.type === 'tree' && entry.name === part && entry.subtree
      );

      if (!treeEntry) {
        throw new Error(`Path '${options.path}' not found in tree`);
      }

      targetTree = treeEntry.subtree;
    }
  }

  // If not recursive, remove subtree property from tree entries
  if (!options.recursive) {
    const removeSubtrees = (tree) => {
      if (!tree || !tree.entries) return;

      tree.entries.forEach(entry => {
        if (entry.type === 'tree') {
          delete entry.subtree;
        }
      });
    };

    removeSubtrees(targetTree);
  }

  return {
    commitId,
    tree: targetTree,
    repositoryId: options.repository.id
  };
};