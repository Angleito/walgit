import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { initializeWallet } from './auth.js';
import { saveCurrentRepository, getCurrentRepository, getWalGitDir } from './config.js';
import crypto from 'crypto';

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
  // Initialize wallet for signing (still needed for author info)
  const wallet = await initializeWallet();

  // Get staged files (simulated by reading the directory)
  const stagedFiles = await stageFiles();

  // Simulate creating blobs and a tree structure
  const blobs = {};
  const tree = {}; // This will represent the root tree

  for (const file of stagedFiles) {
    const filePath = file.path;
    const fileContent = fs.readFileSync(filePath);
    const blobHash = calculateHash(fileContent.toString()); // Simple hash for simulation

    blobs[blobHash] = {
      content: fileContent,
      size: fileContent.length,
    };

    // Build a simple tree structure (nested objects)
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
      hash: blobHash,
      mode: '100644', // Simplified mode for files
    };
  }

  // Simulate creating a root tree hash (simple hash of the tree structure JSON)
  const rootTreeHash = calculateHash(JSON.stringify(tree));

  // Generate a simple commit hash
  const commitHash = calculateHash(
    options.message +
    wallet.address +
    new Date().toISOString() +
    rootTreeHash
  );

  // Create a simplified commit object
  const commit = {
    hash: commitHash,
    message: options.message,
    author: wallet.address,
    timestamp: new Date().toISOString(),
    tree: rootTreeHash, // Reference to the root tree hash
    // In a real implementation, this would also include parent commits
  };

  // Save the commit object to a file in .walgit/objects
  const walgitDir = getWalGitDir();
  const commitDir = path.join(walgitDir, 'objects', commitHash.substring(0, 2));
  const commitFilePath = path.join(commitDir, commitHash.substring(2));

  fs.mkdirSync(commitDir, { recursive: true });
  fs.writeFileSync(commitFilePath, JSON.stringify(commit, null, 2));

  // For this simulation, also save the tree and blob info (in a real Git, these would be separate objects)
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
  fs.writeFileSync(path.join(walgitDir, 'HEAD'), commitHash);


  console.log(chalk.green(`[walgit] committed ${commitHash}`));

  return commit;
};

/**
 * Push commits to remote storage
 * @param {object} options - Push options
 * @param {string} options.repositoryId - Repository ID
 * @param {boolean} options.force - Force push
 * @param {string} options.branch - Branch to push
 * @returns {Promise<object>} Push result
 */
export const pushCommits = async (options) => {
  // Initialize wallet for authentication
  const wallet = await initializeWallet();

  // Get the latest commit hash from HEAD
  const walgitDir = getWalGitDir();
  const headPath = path.join(walgitDir, 'HEAD');

  if (!fs.existsSync(headPath)) {
    throw new Error("No commits to push. Please make a commit first.");
  }

  const headContent = fs.readFileSync(headPath, 'utf-8').trim();
  let latestCommitHash = null;

  if (headContent.startsWith('ref: ')) {
    const refPath = path.join(walgitDir, headContent.substring(5));
    if (fs.existsSync(refPath)) {
      latestCommitHash = fs.readFileSync(refPath, 'utf-8').trim();
    }
  } else {
    latestCommitHash = headContent;
  }

  if (!latestCommitHash) {
     throw new Error("Could not determine the latest commit from HEAD.");
  }

  // Check if we should use on-chain operations
  const useOnChain = process.env.WALGIT_USE_BLOCKCHAIN === 'true';
  const isPackageValid = useOnChain ? await validatePackageId() : false;

  if (useOnChain && isPackageValid) {
    // Get current repository
    const repository = await getCurrentRepository();
    if (!repository) {
      throw new Error('Not in a WalGit repository');
    }

    // Push commits to blockchain
    console.log(chalk.blue('Pushing commits to blockchain...'));
    const pushResult = await pushCommitsOnChain({
      repositoryId: repository.id,
      branch: options.branch || 'main',
      commitId: latestCommitHash
    });

    console.log(chalk.green(`[walgit] Successfully pushed commit ${latestCommitHash} to blockchain`));

    return pushResult;
  } else {
    // Local simulation mode
    if (useOnChain) {
      console.log(chalk.yellow('Falling back to local simulation mode due to invalid package ID or configuration.'));
    } else {
      console.log(chalk.blue('Using local simulation mode.'));
    }

    console.log(chalk.green(`[walgit] Successfully "pushed" local commit ${latestCommitHash}`));
    console.log(chalk.yellow("Note: This is a local simulation. No data was sent to a remote."));

    // Mock push result
    return {
      commitHash: latestCommitHash,
      branch: options.branch || 'main',
      status: 'local_simulation_success'
    };
  }
};

/**
 * Pull commits from remote storage
 * @param {object} options - Pull options
 * @param {string} options.repositoryId - Repository ID
 * @param {string} options.branch - Branch to pull
 * @param {boolean} options.verify - Verify signatures
 * @returns {Promise<object>} Pull result
 */
export const pullCommits = async (options) => {
  // Initialize wallet for authentication
  const wallet = await initializeWallet();

  // Mock pull result
  return {
    commitCount: 5,
    branch: options.branch || 'main',
    newFiles: 8,
    conflicts: []
  };
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

  // Mock fetch result
  return {
    remoteUrl: 'walgit://walrus-dev/walgit-core',
    newObjects: 5,
    updatedRefs: [
      { name: 'main', oldId: 'abcdef1', newId: 'abcdef2', type: 'fastForward' },
      { name: 'develop', oldId: 'bcdef12', newId: 'bcdef13', type: 'update' }
    ]
  };
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
