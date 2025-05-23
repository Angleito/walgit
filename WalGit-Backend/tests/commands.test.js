import { jest } from '@jest/globals';
import { Command } from 'commander';

// Mock dependencies
jest.mock('chalk', () => ({
  green: jest.fn(text => `GREEN:${text}`),
  yellow: jest.fn(text => `YELLOW:${text}`),
  red: jest.fn(text => `RED:${text}`),
  dim: jest.fn(text => `DIM:${text}`)
}));

jest.mock('ora', () => {
  return jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis()
  }));
});

// Mock utility modules
jest.mock('../cli/src/utils/auth.js', () => ({
  validateWalletConnection: jest.fn().mockResolvedValue({
    address: '0x123456789abcdef',
    publicKey: 'mock-public-key'
  }),
  initializeWallet: jest.fn().mockResolvedValue({
    address: '0x123456789abcdef',
    publicKey: 'mock-public-key'
  })
}));

jest.mock('../cli/src/utils/repository.js', () => ({
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
  })
}));

jest.mock('../cli/src/utils/transaction-utils.js', () => ({
  createTransaction: jest.fn().mockResolvedValue({
    txId: '0xtransaction123456',
    status: 'success'
  }),
  waitForTransaction: jest.fn().mockResolvedValue({
    status: 'success',
    events: []
  })
}));

jest.mock('../cli/src/utils/sui-integration.js', () => ({
  getSuiProvider: jest.fn().mockReturnValue({
    getTransactionBlock: jest.fn().mockResolvedValue({
      effects: { status: { status: 'success' } }
    })
  })
}));

jest.mock('../cli/src/utils/working-directory.js', () => ({
  getChangedFiles: jest.fn().mockResolvedValue({
    staged: [],
    unstaged: ['file1.txt', 'file2.txt'],
    untracked: ['file3.txt']
  }),
  stageFiles: jest.fn().mockResolvedValue({
    added: ['file1.txt'],
    failed: []
  })
}));

jest.mock('../cli/src/utils/blob-manager.js', () => ({
  uploadBlobs: jest.fn().mockResolvedValue({
    uploaded: ['file1.txt'],
    failed: []
  }),
  downloadBlob: jest.fn().mockResolvedValue({
    content: 'Mock file content',
    path: 'file1.txt'
  })
}));

jest.mock('../cli/src/utils/tree-builder.js', () => ({
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
}));

jest.mock('../cli/src/utils/walrus-integration.js', () => ({
  uploadToWalrus: jest.fn().mockResolvedValue({
    key: 'walrus-key-123',
    url: 'https://walrus.storage/walrus-key-123'
  }),
  downloadFromWalrus: jest.fn().mockResolvedValue(Buffer.from('mock content'))
}));

jest.mock('../cli/src/utils/pr-transaction-manager.js', () => ({
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
  })
}));

jest.mock('../cli/src/utils/code-review-manager.js', () => ({
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
}));

jest.mock('../cli/src/utils/optimized-storage.js', () => ({
  allocateStorage: jest.fn().mockResolvedValue({
    storageId: '0xstorage123456',
    quota: 1000000
  }),
  getStorageUsage: jest.fn().mockResolvedValue({
    used: 50000,
    total: 1000000
  })
}));

// Import commands to test
import { initCommand } from '../cli/src/commands/init.js';
import { statusCommand } from '../cli/src/commands/status.js';
import { addCommand } from '../cli/src/commands/add.js';
import { commitCommand } from '../cli/src/commands/commit.js';
import { branchCommand } from '../cli/src/commands/branch.js';
import { pushCommand } from '../cli/src/commands/push.js';
import { pullCommand } from '../cli/src/commands/pull.js';
import { treeCommand } from '../cli/src/commands/tree.js';
import { registerPRCommand } from '../cli/src/commands/pr.js';
import { registerReviewCommand } from '../cli/src/commands/review.js';
import { registerStorageCommand } from '../cli/src/commands/storage.js';

// Test init command
describe('init command', () => {
  let program;
  let mockExit;
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    program = new Command();
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    mockExit.mockRestore();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  test('should initialize repository successfully', async () => {
    // Register and execute the command
    initCommand(program);
    
    // Get the registered init command
    const initCmd = program.commands.find(cmd => cmd.name() === 'init');
    expect(initCmd).toBeDefined();
    
    // Call the action directly with options
    await initCmd.actionCallback({ name: 'test-repo', description: 'Test repository', private: false });
    
    // Verify the expected functions were called
    const { validateWalletConnection } = await import('../cli/src/utils/auth.js');
    const { createRepository } = await import('../cli/src/utils/repository.js');
    
    expect(validateWalletConnection).toHaveBeenCalled();
    expect(createRepository).toHaveBeenCalledWith({
      name: 'test-repo',
      description: 'Test repository',
      isPrivate: false
    });
    
    // Verify console output
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Repository ID'));
    expect(mockExit).not.toHaveBeenCalled();
  });

  test('should handle initialization errors', async () => {
    const { validateWalletConnection } = await import('../cli/src/utils/auth.js');
    const { createRepository } = await import('../cli/src/utils/repository.js');
    
    // Mock a failure
    validateWalletConnection.mockRejectedValueOnce(new Error('Wallet connection failed'));
    
    // Register and execute the command
    initCommand(program);
    
    // Get the registered init command
    const initCmd = program.commands.find(cmd => cmd.name() === 'init');
    
    // Call the action with options
    await initCmd.actionCallback({ name: 'test-repo' });
    
    // Verify error handling
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to initialize repository'),
      expect.any(String)
    );
    expect(mockExit).toHaveBeenCalledWith(1);
    
    // Reset the mock for next tests
    validateWalletConnection.mockResolvedValue({
      address: '0x123456789abcdef',
      publicKey: 'mock-public-key'
    });
  });
});

// Test status command
describe('status command', () => {
  let program;
  let consoleLogSpy;
  let consoleErrorSpy;
  let mockExit;

  beforeEach(() => {
    program = new Command();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    mockExit.mockRestore();
    jest.clearAllMocks();
  });

  test('should display repository status successfully', async () => {
    const { getRepositoryStatus } = await import('../cli/src/utils/repository.js');
    
    // Mock successful status retrieval
    getRepositoryStatus.mockResolvedValueOnce({
      branch: 'main',
      changes: {
        staged: ['staged-file.txt'],
        unstaged: ['modified-file.txt'],
        untracked: ['new-file.txt']
      }
    });
    
    // Register and execute the command
    statusCommand(program);
    
    // Get the registered status command
    const statusCmd = program.commands.find(cmd => cmd.name() === 'status');
    expect(statusCmd).toBeDefined();
    
    // Call the action directly
    await statusCmd.actionCallback();
    
    // Verify the function was called
    expect(getRepositoryStatus).toHaveBeenCalled();
    
    // Verify console output shows status information
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('main'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('staged-file.txt'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('modified-file.txt'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('new-file.txt'));
  });

  test('should handle status errors', async () => {
    const { getRepositoryStatus } = await import('../cli/src/utils/repository.js');
    
    // Mock a failure
    getRepositoryStatus.mockRejectedValueOnce(new Error('Failed to get status'));
    
    // Register and execute the command
    statusCommand(program);
    
    // Get the registered status command
    const statusCmd = program.commands.find(cmd => cmd.name() === 'status');
    
    // Call the action
    await statusCmd.actionCallback();
    
    // Verify error handling
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to get repository status'),
      expect.any(String)
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});

// Test add command
describe('add command', () => {
  let program;
  let consoleLogSpy;
  let consoleErrorSpy;
  let mockExit;

  beforeEach(() => {
    program = new Command();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    mockExit.mockRestore();
    jest.clearAllMocks();
  });

  test('should add files to index successfully', async () => {
    const { addToIndex } = await import('../cli/src/utils/repository.js');
    
    // Register and execute the command
    addCommand(program);
    
    // Get the registered add command
    const addCmd = program.commands.find(cmd => cmd.name() === 'add');
    expect(addCmd).toBeDefined();
    
    // Call the action with file paths
    await addCmd.actionCallback(['file1.txt', 'file2.txt']);
    
    // Verify the function was called with correct arguments
    expect(addToIndex).toHaveBeenCalledWith(['file1.txt', 'file2.txt']);
    
    // Verify console output
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Added'));
  });

  test('should handle add errors', async () => {
    const { addToIndex } = await import('../cli/src/utils/repository.js');
    
    // Mock a failure
    addToIndex.mockRejectedValueOnce(new Error('Failed to add files'));
    
    // Register and execute the command
    addCommand(program);
    
    // Get the registered add command
    const addCmd = program.commands.find(cmd => cmd.name() === 'add');
    
    // Call the action
    await addCmd.actionCallback(['file1.txt']);
    
    // Verify error handling
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to add files to index'),
      expect.any(String)
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});

// Test commit command
describe('commit command', () => {
  let program;
  let consoleLogSpy;
  let consoleErrorSpy;
  let mockExit;

  beforeEach(() => {
    program = new Command();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    mockExit.mockRestore();
    jest.clearAllMocks();
  });

  test('should commit changes successfully', async () => {
    const { commitChanges } = await import('../cli/src/utils/repository.js');
    
    // Register and execute the command
    commitCommand(program);
    
    // Get the registered commit command
    const commitCmd = program.commands.find(cmd => cmd.name() === 'commit');
    expect(commitCmd).toBeDefined();
    
    // Call the action with message
    await commitCmd.actionCallback({ message: 'Test commit message' });
    
    // Verify the function was called with correct arguments
    expect(commitChanges).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Test commit message'
    }));
    
    // Verify console output
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Committed'));
  });

  test('should handle commit errors', async () => {
    const { commitChanges } = await import('../cli/src/utils/repository.js');
    
    // Mock a failure
    commitChanges.mockRejectedValueOnce(new Error('Failed to commit changes'));
    
    // Register and execute the command
    commitCommand(program);
    
    // Get the registered commit command
    const commitCmd = program.commands.find(cmd => cmd.name() === 'commit');
    
    // Call the action
    await commitCmd.actionCallback({ message: 'Test commit message' });
    
    // Verify error handling
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to commit changes'),
      expect.any(String)
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});

// Test PR command
describe('pr command', () => {
  let program;
  let consoleLogSpy;
  let consoleErrorSpy;
  let mockExit;

  beforeEach(() => {
    program = new Command();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    mockExit.mockRestore();
    jest.clearAllMocks();
  });

  test('should create PR successfully', async () => {
    const { createPullRequest } = await import('../cli/src/utils/pr-transaction-manager.js');
    
    // Register the PR command
    registerPRCommand(program);
    
    // Get the registered PR command
    const prCmd = program.commands.find(cmd => cmd.name() === 'pr');
    expect(prCmd).toBeDefined();
    
    // Get the create subcommand
    const createCmd = prCmd.commands.find(cmd => cmd.name() === 'create');
    expect(createCmd).toBeDefined();
    
    // Call the action with options
    await createCmd.actionCallback({ 
      title: 'Test PR',
      description: 'Test PR description',
      target: 'main',
      source: 'feature-branch'
    });
    
    // Verify the function was called with correct arguments
    expect(createPullRequest).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Test PR',
      description: 'Test PR description',
      targetBranch: 'main',
      sourceBranch: 'feature-branch'
    }));
    
    // Verify console output
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('created'));
  });

  test('should handle PR creation errors', async () => {
    const { createPullRequest } = await import('../cli/src/utils/pr-transaction-manager.js');
    
    // Mock a failure
    createPullRequest.mockRejectedValueOnce(new Error('Failed to create PR'));
    
    // Register the PR command
    registerPRCommand(program);
    
    // Get the registered PR command
    const prCmd = program.commands.find(cmd => cmd.name() === 'pr');
    
    // Get the create subcommand
    const createCmd = prCmd.commands.find(cmd => cmd.name() === 'create');
    
    // Call the action
    await createCmd.actionCallback({ 
      title: 'Test PR',
      description: 'Test PR description',
      target: 'main' 
    });
    
    // Verify error handling
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to create pull request'),
      expect.any(String)
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('should list PRs successfully', async () => {
    const { getPullRequestDetails } = await import('../cli/src/utils/pr-transaction-manager.js');
    
    // Register the PR command
    registerPRCommand(program);
    
    // Get the registered PR command
    const prCmd = program.commands.find(cmd => cmd.name() === 'pr');
    
    // Get the list subcommand
    const listCmd = prCmd.commands.find(cmd => cmd.name() === 'list');
    expect(listCmd).toBeDefined();
    
    // Call the action
    await listCmd.actionCallback({});
    
    // Verify the function was called
    expect(getPullRequestDetails).toHaveBeenCalled();
    
    // Verify console output
    expect(consoleLogSpy).toHaveBeenCalled();
  });
});

// Test review command
describe('review command', () => {
  let program;
  let consoleLogSpy;
  let consoleErrorSpy;
  let mockExit;

  beforeEach(() => {
    program = new Command();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    mockExit.mockRestore();
    jest.clearAllMocks();
  });

  test('should add review comment successfully', async () => {
    const { addReviewComment } = await import('../cli/src/utils/code-review-manager.js');
    
    // Register the review command
    registerReviewCommand(program);
    
    // Get the registered review command
    const reviewCmd = program.commands.find(cmd => cmd.name() === 'review');
    expect(reviewCmd).toBeDefined();
    
    // Get the comment subcommand
    const commentCmd = reviewCmd.commands.find(cmd => cmd.name() === 'comment');
    expect(commentCmd).toBeDefined();
    
    // Call the action with options
    await commentCmd.actionCallback({
      pr: '0xpr123',
      file: 'file1.txt',
      line: 10,
      content: 'Test comment'
    });
    
    // Verify the function was called with correct arguments
    expect(addReviewComment).toHaveBeenCalledWith(expect.objectContaining({
      prId: '0xpr123',
      filePath: 'file1.txt',
      line: 10,
      content: 'Test comment'
    }));
    
    // Verify console output
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Comment added'));
  });

  test('should handle review comment errors', async () => {
    const { addReviewComment } = await import('../cli/src/utils/code-review-manager.js');
    
    // Mock a failure
    addReviewComment.mockRejectedValueOnce(new Error('Failed to add comment'));
    
    // Register the review command
    registerReviewCommand(program);
    
    // Get the registered review command
    const reviewCmd = program.commands.find(cmd => cmd.name() === 'review');
    
    // Get the comment subcommand
    const commentCmd = reviewCmd.commands.find(cmd => cmd.name() === 'comment');
    
    // Call the action
    await commentCmd.actionCallback({
      pr: '0xpr123',
      file: 'file1.txt',
      line: 10,
      content: 'Test comment'
    });
    
    // Verify error handling
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to add comment'),
      expect.any(String)
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});

// Test storage command
describe('storage command', () => {
  let program;
  let consoleLogSpy;
  let consoleErrorSpy;
  let mockExit;

  beforeEach(() => {
    program = new Command();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    mockExit.mockRestore();
    jest.clearAllMocks();
  });

  test('should allocate storage successfully', async () => {
    const { allocateStorage } = await import('../cli/src/utils/optimized-storage.js');
    
    // Register the storage command
    registerStorageCommand(program);
    
    // Get the registered storage command
    const storageCmd = program.commands.find(cmd => cmd.name() === 'storage');
    expect(storageCmd).toBeDefined();
    
    // Get the allocate subcommand
    const allocateCmd = storageCmd.commands.find(cmd => cmd.name() === 'allocate');
    expect(allocateCmd).toBeDefined();
    
    // Call the action with options
    await allocateCmd.actionCallback({ size: 1000 });
    
    // Verify the function was called with correct arguments
    expect(allocateStorage).toHaveBeenCalledWith(expect.objectContaining({
      size: 1000
    }));
    
    // Verify console output
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Storage allocated'));
  });

  test('should handle storage allocation errors', async () => {
    const { allocateStorage } = await import('../cli/src/utils/optimized-storage.js');
    
    // Mock a failure
    allocateStorage.mockRejectedValueOnce(new Error('Failed to allocate storage'));
    
    // Register the storage command
    registerStorageCommand(program);
    
    // Get the registered storage command
    const storageCmd = program.commands.find(cmd => cmd.name() === 'storage');
    
    // Get the allocate subcommand
    const allocateCmd = storageCmd.commands.find(cmd => cmd.name() === 'allocate');
    
    // Call the action
    await allocateCmd.actionCallback({ size: 1000 });
    
    // Verify error handling
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to allocate storage'),
      expect.any(String)
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('should get storage usage successfully', async () => {
    const { getStorageUsage } = await import('../cli/src/utils/optimized-storage.js');
    
    // Register the storage command
    registerStorageCommand(program);
    
    // Get the registered storage command
    const storageCmd = program.commands.find(cmd => cmd.name() === 'storage');
    
    // Get the usage subcommand
    const usageCmd = storageCmd.commands.find(cmd => cmd.name() === 'usage');
    expect(usageCmd).toBeDefined();
    
    // Call the action
    await usageCmd.actionCallback({});
    
    // Verify the function was called
    expect(getStorageUsage).toHaveBeenCalled();
    
    // Verify console output
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Storage usage'));
  });
});