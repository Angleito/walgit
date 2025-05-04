# WalGit Client Implementation Guide - Task Breakdown

## TASK 1: Understand Client Architecture

The WalGit client is the application users interact with to work with the WalGit system. It provides:

1. A command-line interface similar to Git
2. Integration with Sui blockchain for storing repository structure
3. Integration with Walrus for storing file content

Client structure:
```
┌────────────────────────────────────────────────┐
│                WalGit Client                    │
├────────────┬───────────────────┬───────────────┤
│            │                   │               │
│   CLI      │   Core Logic      │   UI          │
│ Interface  │                   │ (Optional)    │
│            │                   │               │
├────────────┴───────────────────┴───────────────┤
│                                                │
│           Integration Layers                   │
│                                                │
├───────────────────────┬────────────────────────┤
│                       │                        │
│     Sui SDK           │     Walrus SDK         │
│                       │                        │
└───────────────────────┴────────────────────────┘
```

Available commands (similar to Git):
- `walgit init [repo-name]` - Create new repository
- `walgit clone [repo-id]` - Download existing repository
- `walgit add [file/pattern]` - Stage files for commit
- `walgit commit -m "message"` - Record changes to repository
- `walgit checkout [commit/branch]` - Switch to different state
- `walgit branch [branch-name]` - Create new branch
- `walgit log` - View commit history
- `walgit status` - Show changed files

YOUR GOAL: Understand the overall client architecture and command structure before implementation.

---

## TASK 2: Set Up Project Structure

Create a Node.js project with this structure:

```
walgit-client/
├── src/
│   ├── commands/           # CLI command implementations
│   │   ├── index.js        # Command registration
│   │   ├── init.js         # Initialize command
│   │   ├── add.js          # Add command
│   │   └── commit.js       # Commit command
│   ├── sui/                # Sui blockchain integration
│   │   └── client.js       # Sui client wrapper
│   ├── walrus/             # Walrus storage integration
│   │   └── client.js       # Walrus client wrapper
│   ├── util/               # Utility functions
│   │   ├── config.js       # Configuration management
│   │   ├── index.js        # Staging area functions
│   │   └── cache.js        # Object caching
│   └── index.js            # Main entry point
├── tests/                  # Test files
├── package.json
└── README.md
```

Initialization code:

```javascript
// src/commands/index.js
export function registerCommands(program) {
  // Register each command with the CLI program
  initCommand(program);
  cloneCommand(program);
  addCommand(program);
  commitCommand(program);
  checkoutCommand(program);
  // ...
}

// src/index.js
import { Command } from 'commander';
import { registerCommands } from './commands/index.js';

const program = new Command();
program.name('walgit').description('Decentralized Git on Sui blockchain');

// Register all commands
registerCommands(program);

// Parse command line arguments
program.parse(process.argv);
```

Package dependencies:
- commander - For CLI command parsing
- @mysten/sui.js - Sui blockchain SDK
- walrus-sdk - For Walrus storage interactions
- fs-extra - Enhanced file system operations

YOUR GOAL: Set up the project structure with all necessary files and dependencies.

---

## TASK 3: Implement Local Repository Structure

Create a local repository structure similar to Git's `.git` directory:

```
.walgit/                # Local repository directory
  ├── config            # Repository configuration (JSON)
  ├── HEAD              # Points to current branch or commit
  ├── index             # Staging area (JSON)
  ├── objects/          # Cached objects from blockchain
  └── walrus-cache/     # Cached file content
```

Implement the config management functions:

```javascript
// src/util/config.js
import fs from 'fs-extra';
import path from 'path';

export async function createLocalConfig(config) {
  // Create .walgit directory
  await fs.mkdir('.walgit', { recursive: true });
  await fs.mkdir('.walgit/objects', { recursive: true });
  await fs.mkdir('.walgit/walrus-cache', { recursive: true });
  
  // Write config file
  await fs.writeJson('.walgit/config', {
    repoId: config.repoId,
    name: config.name,
    owner: config.owner,
    packageId: config.packageId
  });
  
  // Initialize empty HEAD
  await fs.writeFile('.walgit/HEAD', 'ref: master');
  
  // Initialize empty index
  await fs.writeJson('.walgit/index', {});
}

export async function readLocalConfig() {
  try {
    return await fs.readJson('.walgit/config');
  } catch (error) {
    throw new Error('Not a WalGit repository');
  }
}
```

Implement index management for staging files:

```javascript
// src/util/index.js
import fs from 'fs-extra';
import path from 'path';

export async function addToIndex(filePath, fileData) {
  // Read current index
  const index = await readIndex();
  
  // Add file to index
  index[filePath] = {
    blobId: fileData.blobId,
    size: fileData.size,
    path: filePath
  };
  
  // Write updated index
  await fs.writeJson('.walgit/index', index);
}

export async function readIndex() {
  try {
    return await fs.readJson('.walgit/index');
  } catch (error) {
    return {};
  }
}

export async function clearIndex() {
  await fs.writeJson('.walgit/index', {});
}
```

YOUR GOAL: Implement the local repository structure and management functions.

---

## TASK 4: Implement Sui Blockchain Integration

Create a client wrapper for interacting with Sui blockchain:

```javascript
// src/sui/client.js
import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';

export class SuiWalGitClient {
  constructor(config) {
    this.suiClient = new SuiClient({
      url: config.rpcUrl || 'https://fullnode.mainnet.sui.io:443'
    });
    this.packageId = config.packageId;
    this.wallet = config.wallet;
  }

  // Get repository object from blockchain
  async getRepository(repoId) {
    const repo = await this.suiClient.getObject({
      id: repoId,
      options: { showContent: true, showOwner: true }
    });
    return repo;
  }

  // Create new repository on blockchain
  async createRepository(name) {
    const tx = new TransactionBlock();
    
    tx.moveCall({
      target: `${this.packageId}::repository::init_repo`,
      arguments: [tx.pure(name)]
    });
    
    const result = await this.suiClient.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      signer: this.wallet
    });
    
    return this.extractRepositoryId(result);
  }

  // Helper to extract repo ID from transaction result
  extractRepositoryId(txResult) {
    // Extract the created object ID from transaction result
    const createdObj = txResult.created[0];
    return createdObj.reference.objectId;
  }

  // Create a commit on the blockchain
  async createCommit(commitData) {
    const tx = new TransactionBlock();
    
    // First create tree objects for all directories
    const treeId = await this.createTreeObjects(tx, commitData.treeEntries);
    
    // Then create the commit object
    tx.moveCall({
      target: `${this.packageId}::commit::create_commit`,
      arguments: [
        tx.object(treeId),
        tx.pure(commitData.message),
        tx.pure(commitData.author)
      ]
    });
    
    const result = await this.suiClient.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      signer: this.wallet
    });
    
    return this.extractCommitId(result);
  }
}
```

Implement helper for loading wallet:

```javascript
// src/util/wallet.js
import { RawSigner } from '@mysten/sui.js/signers/raw-signer';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import fs from 'fs-extra';

export async function loadWallet(keyPath) {
  // Read keystore file
  const keyData = await fs.readJson(keyPath);
  
  // Create keypair from private key
  const keypair = Ed25519Keypair.fromSecretKey(
    Buffer.from(keyData.privateKey, 'base64')
  );
  
  // Create signer from keypair
  return new RawSigner(keypair);
}
```

YOUR GOAL: Create the Sui integration layer for blockchain interactions.

---

## TASK 5: Implement Walrus Storage Integration

Create a client wrapper for Walrus decentralized storage:

```javascript
// src/walrus/client.js
import { WalrusClient } from 'walrus-sdk';
import fs from 'fs-extra';
import path from 'path';

export class WalrusStorageClient {
  constructor(config) {
    this.walrusClient = new WalrusClient({
      endpoint: config.endpoint || 'https://walrus-api.mainnet.sui.io',
      wallet: config.wallet
    });
  }

  // Upload file to Walrus storage
  async uploadFile(filePath) {
    // Read file content
    const content = await fs.readFile(filePath);
    
    // Upload to Walrus
    const uploadResult = await this.walrusClient.upload({
      content,
      duration: 1000000 // Configure storage duration
    });
    
    // Cache content locally
    await this.cacheBlob(uploadResult.blobId, content);
    
    return {
      blobId: uploadResult.blobId,
      size: content.length
    };
  }

  // Download blob from Walrus
  async downloadBlob(blobId, outputPath) {
    // Check local cache first
    const cachedContent = await this.getCachedBlob(blobId);
    if (cachedContent) {
      await fs.writeFile(outputPath, cachedContent);
      return outputPath;
    }
    
    // Download from Walrus if not in cache
    const content = await this.walrusClient.download({
      blobId
    });
    
    // Cache content for future use
    await this.cacheBlob(blobId, content);
    
    // Write to output path
    await fs.writeFile(outputPath, content);
    return outputPath;
  }

  // Store blob in local cache
  async cacheBlob(blobId, content) {
    const cachePath = path.join('.walgit', 'walrus-cache', blobId);
    await fs.writeFile(cachePath, content);
  }

  // Get blob from local cache
  async getCachedBlob(blobId) {
    try {
      const cachePath = path.join('.walgit', 'walrus-cache', blobId);
      return await fs.readFile(cachePath);
    } catch (error) {
      return null;
    }
  }
}
```

YOUR GOAL: Create the Walrus integration layer for file content storage.

---

## TASK 6: Implement Core Commands

Implement the `init` command that creates a new repository:

```javascript
// src/commands/init.js
import { createLocalConfig } from '../util/config.js';
import { SuiWalGitClient } from '../sui/client.js';
import { loadWallet } from '../util/wallet.js';

export function initCommand(program) {
  program
    .command('init')
    .description('Initialize a new WalGit repository')
    .argument('[name]', 'Repository name', 'default-repo')
    .option('-w, --wallet <path>', 'Path to wallet keystore')
    .option('-p, --package <id>', 'WalGit package ID')
    .action(async (name, options) => {
      try {
        // Load wallet
        const wallet = await loadWallet(options.wallet);
        
        // Set up Sui client
        const suiClient = new SuiWalGitClient({
          wallet,
          packageId: options.package || process.env.WALGIT_PACKAGE_ID
        });
        
        // Create repository on blockchain
        console.log(`Creating repository "${name}" on Sui blockchain...`);
        const repoId = await suiClient.createRepository(name);
        
        // Initialize local repository
        console.log('Initializing local repository...');
        await createLocalConfig({
          repoId,
          name,
          owner: wallet.getAddress(),
          packageId: options.package || process.env.WALGIT_PACKAGE_ID
        });
        
        console.log(`Repository initialized! Repository ID: ${repoId}`);
      } catch (error) {
        console.error('Error initializing repository:', error.message);
        process.exit(1);
      }
    });
}
```

Implement the `add` command that stages files:

```javascript
// src/commands/add.js
import { readLocalConfig } from '../util/config.js';
import { WalrusStorageClient } from '../walrus/client.js';
import { addToIndex } from '../util/index.js';
import { loadWallet } from '../util/wallet.js';
import fs from 'fs-extra';
import path from 'path';
import glob from 'glob';

export function addCommand(program) {
  program
    .command('add')
    .description('Add file contents to the index')
    .argument('<files...>', 'Files to add')
    .option('-w, --wallet <path>', 'Path to wallet keystore')
    .action(async (files, options) => {
      try {
        // Read local config
        const config = await readLocalConfig();
        
        // Load wallet
        const wallet = await loadWallet(options.wallet || config.walletPath);
        
        // Set up Walrus client
        const walrusClient = new WalrusStorageClient({ wallet });
        
        // Expand file patterns
        const expandedFiles = [];
        for (const pattern of files) {
          const matches = glob.sync(pattern);
          if (matches.length > 0) {
            expandedFiles.push(...matches);
          } else {
            expandedFiles.push(pattern);
          }
        }
        
        // Process each file
        for (const file of expandedFiles) {
          // Check if file exists
          if (!await fs.pathExists(file)) {
            console.log(`Warning: ${file} does not exist`);
            continue;
          }
          
          // Check if file is a directory
          const stats = await fs.stat(file);
          if (stats.isDirectory()) {
            console.log(`Warning: ${file} is a directory, skipping`);
            continue;
          }
          
          console.log(`Adding ${file}...`);
          
          // Upload to Walrus
          const { blobId, size } = await walrusClient.uploadFile(file);
          
          // Add to index
          await addToIndex(file, { blobId, size });
        }
        
        console.log('Files staged for commit');
      } catch (error) {
        console.error('Error adding files:', error.message);
        process.exit(1);
      }
    });
}
```

YOUR GOAL: Implement the core commands for repository initialization and file staging.

---

## TASK 7: Implement Commit Command

Implement the `commit` command that records changes:

```javascript
// src/commands/commit.js
import { readLocalConfig } from '../util/config.js';
import { SuiWalGitClient } from '../sui/client.js';
import { readIndex, clearIndex } from '../util/index.js';
import { loadWallet } from '../util/wallet.js';
import fs from 'fs-extra';
import path from 'path';

export function commitCommand(program) {
  program
    .command('commit')
    .description('Record changes to the repository')
    .requiredOption('-m, --message <message>', 'Commit message')
    .option('-w, --wallet <path>', 'Path to wallet keystore')
    .action(async (options) => {
      try {
        // Read local config
        const config = await readLocalConfig();
        
        // Read index
        const stagedFiles = await readIndex();
        if (Object.keys(stagedFiles).length === 0) {
          console.log('No changes to commit');
          return;
        }
        
        // Load wallet
        const wallet = await loadWallet(options.wallet || config.walletPath);
        
        // Set up Sui client
        const suiClient = new SuiWalGitClient({
          wallet,
          packageId: config.packageId,
          repoId: config.repoId
        });
        
        // Convert index to tree entries
        const treeEntries = convertIndexToTreeEntries(stagedFiles);
        
        // Create commit on blockchain
        console.log('Creating commit on blockchain...');
        const commitId = await suiClient.createCommit({
          message: options.message,
          author: wallet.getAddress(),
          treeEntries
        });
        
        // Update local HEAD
        await updateHead(commitId);
        
        // Clear index after successful commit
        await clearIndex();
        
        console.log(`Created commit ${commitId.substring(0, 8)}`);
      } catch (error) {
        console.error('Error committing changes:', error.message);
        process.exit(1);
      }
    });
}

// Helper function to convert index entries to tree structure
function convertIndexToTreeEntries(stagedFiles) {
  const entries = [];
  
  for (const [filePath, fileData] of Object.entries(stagedFiles)) {
    entries.push({
      path: filePath,
      type: 'blob',
      blobId: fileData.blobId,
      size: fileData.size
    });
  }
  
  return entries;
}

// Update HEAD reference to point to new commit
async function updateHead(commitId) {
  await fs.writeFile('.walgit/HEAD', commitId);
}
```

Implement the `checkout` command that switches repository state:

```javascript
// src/commands/checkout.js
import { readLocalConfig } from '../util/config.js';
import { SuiWalGitClient } from '../sui/client.js';
import { WalrusStorageClient } from '../walrus/client.js';
import { loadWallet } from '../util/wallet.js';
import fs from 'fs-extra';
import path from 'path';

export function checkoutCommand(program) {
  program
    .command('checkout')
    .description('Switch to a different commit')
    .argument('<commit>', 'Commit ID to checkout')
    .option('-w, --wallet <path>', 'Path to wallet keystore')
    .action(async (commitId, options) => {
      try {
        // Read local config
        const config = await readLocalConfig();
        
        // Load wallet
        const wallet = await loadWallet(options.wallet || config.walletPath);
        
        // Set up clients
        const suiClient = new SuiWalGitClient({
          wallet,
          packageId: config.packageId
        });
        
        const walrusClient = new WalrusStorageClient({ wallet });
        
        // Get commit object from blockchain
        console.log(`Getting commit ${commitId} from blockchain...`);
        const commit = await suiClient.getCommit(commitId);
        
        // Get tree object
        const tree = await suiClient.getTree(commit.treeId);
        
        // Clean working directory (except .walgit)
        await cleanWorkingDirectory();
        
        // Download and write files
        console.log('Downloading files...');
        await downloadFiles(tree, walrusClient);
        
        // Update HEAD
        await fs.writeFile('.walgit/HEAD', commitId);
        
        console.log(`Checked out commit ${commitId.substring(0, 8)}`);
      } catch (error) {
        console.error('Error checking out commit:', error.message);
        process.exit(1);
      }
    });
}

// Helper to clean working directory
async function cleanWorkingDirectory() {
  const entries = await fs.readdir('.');
  for (const entry of entries) {
    if (entry !== '.walgit' && !entry.startsWith('.')) {
      await fs.remove(entry);
    }
  }
}

// Helper to download files from tree
async function downloadFiles(tree, walrusClient) {
  for (const entry of tree.entries) {
    if (entry.type === 'blob') {
      // Create directory if it doesn't exist
      await fs.mkdir(path.dirname(entry.path), { recursive: true });
      
      // Download blob content
      await walrusClient.downloadBlob(entry.blobId, entry.path);
    } else if (entry.type === 'tree') {
      // Get tree object and recurse
      const subTree = await suiClient.getTree(entry.objectId);
      await downloadFiles(subTree, walrusClient);
    }
  }
}
```

YOUR GOAL: Implement commands for committing changes and checking out specific commits.

---

## TASK 8: Implement Testing and Optimizations

Create tests for your commands:

```javascript
// tests/commands/init.test.js
import { jest } from '@jest/globals';
import { SuiWalGitClient } from '../../src/sui/client.js';

// Mock the Sui client
jest.mock('../../src/sui/client.js');

describe('init command', () => {
  test('should create a repository on the blockchain', async () => {
    // Mock implementation
    SuiWalGitClient.prototype.createRepository.mockResolvedValue('0x123');
    
    // Test command execution
    // ...
    
    // Verify repository was created
    expect(SuiWalGitClient.prototype.createRepository).toHaveBeenCalledWith('test-repo');
  });
});
```

Implement caching mechanisms for objects:

```javascript
// src/util/cache.js
import fs from 'fs-extra';
import path from 'path';

// Cache Sui objects locally
export async function cacheObject(objectId, objectData) {
  const cachePath = path.join('.walgit', 'objects', objectId);
  await fs.writeJson(cachePath, objectData);
}

// Get cached object
export async function getCachedObject(objectId) {
  try {
    const cachePath = path.join('.walgit', 'objects', objectId);
    return await fs.readJson(cachePath);
  } catch (error) {
    return null;
  }
}
```

Implement best practices throughout the codebase:

1. **Error Handling**: Add descriptive error messages and proper error types
2. **Progress Indicators**: Show progress for long-running operations
3. **Gas Estimation**: Calculate gas costs before executing transactions
4. **Conflict Resolution**: Add merge strategies for conflicting changes
5. **Storage Optimization**: Deduplicate file content before uploading

YOUR GOAL: Add testing and optimize the client implementation.

---

## References

- Sui SDK Documentation: [https://docs.sui.io/sdk](https://docs.sui.io/sdk)
- Commander.js Documentation: [https://github.com/tj/commander.js](https://github.com/tj/commander.js)
- Git Internals: [https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain](https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain)
- Walrus Storage Docs: [Link to be added when available] 