import { jest } from '@jest/globals';

// Mock utilities for testing CLI commands

// Mock chalk for colorized console output
export const mockChalk = {
  green: jest.fn(text => `GREEN:${text}`),
  yellow: jest.fn(text => `YELLOW:${text}`),
  red: jest.fn(text => `RED:${text}`),
  dim: jest.fn(text => `DIM:${text}`),
  blue: jest.fn(text => `BLUE:${text}`),
  cyan: jest.fn(text => `CYAN:${text}`),
  magenta: jest.fn(text => `MAGENTA:${text}`),
  bold: jest.fn(text => `BOLD:${text}`)
};

// Mock ora for spinners
export const mockOra = jest.fn(() => ({
  start: jest.fn().mockReturnThis(),
  succeed: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis(),
  stop: jest.fn().mockReturnThis(),
  text: ''
}));

// Mock config
export const mockConfig = {
  getWalletConfig: jest.fn().mockResolvedValue({
    keypair: 'mock-keypair',
    network: 'devnet'
  }),
  getCurrentRepository: jest.fn().mockResolvedValue({
    name: 'test-repo',
    objectId: '0xabcdef123456',
    owner: '0x123456789abcdef'
  }),
  saveCurrentRepository: jest.fn().mockResolvedValue(true),
  getWalGitDir: jest.fn().mockReturnValue('/test/path/.walgit'),
  config: {
    get: jest.fn((key) => {
      if (key === 'wallet') return { keypair: 'mock-keypair', network: 'devnet' };
      if (key === 'settings') return { defaultBranch: 'main' };
      if (key === 'currentRepository') return { name: 'test-repo' };
      return null;
    }),
    set: jest.fn()
  }
};

// Mock auth
export const mockAuth = {
  initializeWallet: jest.fn().mockResolvedValue({
    address: '0x123456789abcdef',
    publicKey: 'mock-public-key'
  }),
  validateWalletConnection: jest.fn().mockResolvedValue({
    address: '0x123456789abcdef',
    publicKey: 'mock-public-key'
  })
};

// Mock repository operations
export const mockRepository = {
  createRepository: jest.fn().mockResolvedValue({
    id: '0xrepo123456',
    name: 'test-repo',
    description: 'Test repository',
    isPrivate: false
  }),
  getRepositoryStatus: jest.fn().mockResolvedValue({
    branch: 'main',
    changes: {
      staged: [],
      unstaged: [],
      untracked: []
    }
  }),
  addToIndex: jest.fn().mockResolvedValue({
    added: ['file1.txt'],
    failed: []
  }),
  commitChanges: jest.fn().mockResolvedValue({
    commitId: '0xcommit123456',
    message: 'Test commit',
    timestamp: Date.now()
  }),
  fetchRemote: jest.fn().mockResolvedValue({
    branches: ['main', 'develop'],
    commits: 5
  }),
  pullChanges: jest.fn().mockResolvedValue({
    updated: true,
    branch: 'main',
    newCommits: 3
  }),
  pushChanges: jest.fn().mockResolvedValue({
    success: true,
    branch: 'main',
    commitsPushed: 2
  })
};

// Mock transaction utilities
export const mockTransactionUtils = {
  createTransaction: jest.fn().mockResolvedValue({
    txId: '0xtransaction123456',
    status: 'success'
  }),
  waitForTransaction: jest.fn().mockResolvedValue({
    status: 'success',
    events: []
  })
};

// Mock Sui blockchain integration
export const mockSuiIntegration = {
  getSuiProvider: jest.fn().mockReturnValue({
    getTransactionBlock: jest.fn().mockResolvedValue({
      effects: { status: { status: 'success' } }
    }),
    executeTransactionBlock: jest.fn().mockResolvedValue({
      effects: { status: { status: 'success' } },
      digest: '0xtx123456'
    })
  })
};

// Mock working directory
export const mockWorkingDirectory = {
  getChangedFiles: jest.fn().mockResolvedValue({
    staged: [],
    unstaged: ['file1.txt', 'file2.txt'],
    untracked: ['file3.txt']
  }),
  stageFiles: jest.fn().mockResolvedValue({
    added: ['file1.txt'],
    failed: []
  })
};

// Mock blob manager
export const mockBlobManager = {
  uploadBlobs: jest.fn().mockResolvedValue({
    uploaded: ['file1.txt'],
    failed: []
  }),
  downloadBlob: jest.fn().mockResolvedValue({
    content: 'Mock file content',
    path: 'file1.txt'
  })
};

// Mock tree builder
export const mockTreeBuilder = {
  createTree: jest.fn().mockResolvedValue({
    treeId: '0xtree123456',
    rootHash: 'abcdef1234567890'
  }),
  getTree: jest.fn().mockResolvedValue({
    rootTree: {
      id: '0xtree123456',
      entries: [{
        name: 'file1.txt',
        type: 'blob',
        hash: 'file1hash'
      }]
    }
  })
};

// Mock Walrus integration
export const mockWalrusIntegration = {
  uploadToWalrus: jest.fn().mockResolvedValue({
    key: 'walrus-key-123',
    url: 'https://walrus.storage/walrus-key-123'
  }),
  downloadFromWalrus: jest.fn().mockResolvedValue(Buffer.from('mock content'))
};

// Mock PR transaction manager
export const mockPRTransactionManager = {
  createPullRequest: jest.fn().mockResolvedValue({
    prId: '0xpr123456',
    sourceRef: 'feature-branch',
    targetRef: 'main',
    title: 'Test PR',
    description: 'Test PR description'
  }),
  getPullRequestDetails: jest.fn().mockResolvedValue({
    id: '0xpr123456',
    status: 'open',
    sourceRef: 'feature-branch',
    targetRef: 'main'
  }),
  approvePullRequest: jest.fn().mockResolvedValue({
    success: true,
    prId: '0xpr123456'
  }),
  mergePullRequest: jest.fn().mockResolvedValue({
    success: true,
    prId: '0xpr123456',
    mergeCommitId: '0xmerge123456'
  })
};

// Mock code review manager
export const mockCodeReviewManager = {
  addReviewComment: jest.fn().mockResolvedValue({
    id: '0xcomment123456',
    content: 'Test comment',
    filePath: 'file1.txt',
    line: 10
  }),
  getReviewComments: jest.fn().mockResolvedValue([{
    id: '0xcomment123456',
    content: 'Test comment',
    filePath: 'file1.txt',
    line: 10,
    author: '0x123456789abcdef'
  }])
};

// Mock optimized storage
export const mockOptimizedStorage = {
  allocateStorage: jest.fn().mockResolvedValue({
    storageId: '0xstorage123456',
    quota: 1000000
  }),
  getStorageUsage: jest.fn().mockResolvedValue({
    used: 50000,
    total: 1000000
  }),
  upgradeStoragePlan: jest.fn().mockResolvedValue({
    success: true,
    newQuota: 2000000
  })
};

// Configure module mocks for Jest
export const setupMocks = () => {
  jest.mock('chalk', () => mockChalk, { virtual: true });
  jest.mock('ora', () => mockOra, { virtual: true });
  
  jest.mock('../cli/src/utils/config.js', () => mockConfig, { virtual: true });
  jest.mock('../cli/src/utils/auth.js', () => mockAuth, { virtual: true });
  jest.mock('../cli/src/utils/repository.js', () => mockRepository, { virtual: true });
  jest.mock('../cli/src/utils/transaction-utils.js', () => mockTransactionUtils, { virtual: true });
  jest.mock('../cli/src/utils/sui-integration.js', () => mockSuiIntegration, { virtual: true });
  jest.mock('../cli/src/utils/working-directory.js', () => mockWorkingDirectory, { virtual: true });
  jest.mock('../cli/src/utils/blob-manager.js', () => mockBlobManager, { virtual: true });
  jest.mock('../cli/src/utils/tree-builder.js', () => mockTreeBuilder, { virtual: true });
  jest.mock('../cli/src/utils/walrus-integration.js', () => mockWalrusIntegration, { virtual: true });
  jest.mock('../cli/src/utils/pr-transaction-manager.js', () => mockPRTransactionManager, { virtual: true });
  jest.mock('../cli/src/utils/code-review-manager.js', () => mockCodeReviewManager, { virtual: true });
  jest.mock('../cli/src/utils/optimized-storage.js', () => mockOptimizedStorage, { virtual: true });
};