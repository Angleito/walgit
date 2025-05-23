import { jest } from '@jest/globals';
import { Command } from 'commander';
import { setupMocks, mockPRTransactionManager, mockCodeReviewManager, mockOptimizedStorage } from './mocks.js';

// Set up all mocks
setupMocks();

// Import commands to test
import { registerPRCommand } from '../cli/src/commands/pr.js';
import { registerReviewCommand } from '../cli/src/commands/review.js';
import { registerStorageCommand } from '../cli/src/commands/storage.js';

// Test PR command
describe('Pull Request commands', () => {
  let program;
  let consoleLogSpy;
  let consoleErrorSpy;
  let mockExit;

  beforeEach(() => {
    program = new Command();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    
    // Register commands
    registerPRCommand(program);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    mockExit.mockRestore();
    jest.clearAllMocks();
  });

  test('should create a pull request successfully', async () => {
    // Get the PR create command
    const prCommand = program.commands.find(cmd => cmd.name() === 'pr');
    expect(prCommand).toBeDefined();
    
    const createCommand = prCommand.commands.find(cmd => cmd.name() === 'create');
    expect(createCommand).toBeDefined();
    
    // Execute the command
    await createCommand.actionCallback({
      title: 'Test PR',
      description: 'This is a test PR',
      source: 'feature-branch',
      target: 'main'
    });
    
    // Verify the PR creation function was called with the right params
    expect(mockPRTransactionManager.createPullRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test PR',
        description: 'This is a test PR',
        sourceBranch: 'feature-branch',
        targetBranch: 'main'
      })
    );
    
    // Verify success output
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Pull request created'));
  });
  
  test('should handle PR creation errors', async () => {
    // Mock error for PR creation
    mockPRTransactionManager.createPullRequest.mockRejectedValueOnce(
      new Error('Failed to create PR')
    );
    
    // Get the PR create command
    const prCommand = program.commands.find(cmd => cmd.name() === 'pr');
    const createCommand = prCommand.commands.find(cmd => cmd.name() === 'create');
    
    // Execute the command
    await createCommand.actionCallback({
      title: 'Test PR',
      description: 'This is a test PR',
      target: 'main'
    });
    
    // Verify error handling
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to create pull request'),
      expect.any(String)
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
  
  test('should list pull requests successfully', async () => {
    // Mock PRs to return
    mockPRTransactionManager.getPullRequestDetails.mockResolvedValueOnce([
      {
        id: '0xpr123456',
        title: 'First PR',
        status: 'open',
        sourceRef: 'feature-1',
        targetRef: 'main'
      },
      {
        id: '0xpr789012',
        title: 'Second PR',
        status: 'merged',
        sourceRef: 'feature-2',
        targetRef: 'main'
      }
    ]);
    
    // Get the PR list command
    const prCommand = program.commands.find(cmd => cmd.name() === 'pr');
    const listCommand = prCommand.commands.find(cmd => cmd.name() === 'list');
    expect(listCommand).toBeDefined();
    
    // Execute the command
    await listCommand.actionCallback({});
    
    // Verify the list function was called
    expect(mockPRTransactionManager.getPullRequestDetails).toHaveBeenCalled();
    
    // Verify output contains PR information
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('First PR'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Second PR'));
  });
  
  test('should approve a pull request successfully', async () => {
    // Get the PR approve command
    const prCommand = program.commands.find(cmd => cmd.name() === 'pr');
    const approveCommand = prCommand.commands.find(cmd => cmd.name() === 'approve');
    expect(approveCommand).toBeDefined();
    
    // Execute the command
    await approveCommand.actionCallback({ id: '0xpr123456' });
    
    // Verify the approve function was called with the right param
    expect(mockPRTransactionManager.approvePullRequest).toHaveBeenCalledWith('0xpr123456');
    
    // Verify success output
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('approved'));
  });
  
  test('should merge a pull request successfully', async () => {
    // Get the PR merge command
    const prCommand = program.commands.find(cmd => cmd.name() === 'pr');
    const mergeCommand = prCommand.commands.find(cmd => cmd.name() === 'merge');
    expect(mergeCommand).toBeDefined();
    
    // Execute the command
    await mergeCommand.actionCallback({ id: '0xpr123456' });
    
    // Verify the merge function was called with the right param
    expect(mockPRTransactionManager.mergePullRequest).toHaveBeenCalledWith('0xpr123456');
    
    // Verify success output
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('merged'));
  });
});

// Test review command
describe('Code Review commands', () => {
  let program;
  let consoleLogSpy;
  let consoleErrorSpy;
  let mockExit;

  beforeEach(() => {
    program = new Command();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    
    // Register commands
    registerReviewCommand(program);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    mockExit.mockRestore();
    jest.clearAllMocks();
  });

  test('should add a review comment successfully', async () => {
    // Get the review comment command
    const reviewCommand = program.commands.find(cmd => cmd.name() === 'review');
    expect(reviewCommand).toBeDefined();
    
    const commentCommand = reviewCommand.commands.find(cmd => cmd.name() === 'comment');
    expect(commentCommand).toBeDefined();
    
    // Execute the command
    await commentCommand.actionCallback({
      pr: '0xpr123456',
      file: 'src/file.js',
      line: 42,
      content: 'This code needs refactoring'
    });
    
    // Verify the comment function was called with the right params
    expect(mockCodeReviewManager.addReviewComment).toHaveBeenCalledWith(
      expect.objectContaining({
        prId: '0xpr123456',
        filePath: 'src/file.js',
        line: 42,
        content: 'This code needs refactoring'
      })
    );
    
    // Verify success output
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Comment added'));
  });
  
  test('should handle comment addition errors', async () => {
    // Mock error for comment addition
    mockCodeReviewManager.addReviewComment.mockRejectedValueOnce(
      new Error('Failed to add comment')
    );
    
    // Get the review comment command
    const reviewCommand = program.commands.find(cmd => cmd.name() === 'review');
    const commentCommand = reviewCommand.commands.find(cmd => cmd.name() === 'comment');
    
    // Execute the command
    await commentCommand.actionCallback({
      pr: '0xpr123456',
      file: 'src/file.js',
      line: 42,
      content: 'This code needs refactoring'
    });
    
    // Verify error handling
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to add comment'),
      expect.any(String)
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
  
  test('should list review comments successfully', async () => {
    // Mock comments to return
    mockCodeReviewManager.getReviewComments.mockResolvedValueOnce([
      {
        id: '0xcomment123',
        content: 'Fix this issue',
        filePath: 'src/file1.js',
        line: 25,
        author: '0xuser123'
      },
      {
        id: '0xcomment456',
        content: 'Good implementation',
        filePath: 'src/file2.js',
        line: 78,
        author: '0xuser456'
      }
    ]);
    
    // Get the review list command
    const reviewCommand = program.commands.find(cmd => cmd.name() === 'review');
    const listCommand = reviewCommand.commands.find(cmd => cmd.name() === 'list');
    expect(listCommand).toBeDefined();
    
    // Execute the command
    await listCommand.actionCallback({ pr: '0xpr123456' });
    
    // Verify the list function was called with the right param
    expect(mockCodeReviewManager.getReviewComments).toHaveBeenCalledWith('0xpr123456');
    
    // Verify output contains comment information
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Fix this issue'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Good implementation'));
  });
});

// Test storage command
describe('Storage Management commands', () => {
  let program;
  let consoleLogSpy;
  let consoleErrorSpy;
  let mockExit;

  beforeEach(() => {
    program = new Command();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    
    // Register commands
    registerStorageCommand(program);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    mockExit.mockRestore();
    jest.clearAllMocks();
  });

  test('should allocate storage successfully', async () => {
    // Get the storage allocate command
    const storageCommand = program.commands.find(cmd => cmd.name() === 'storage');
    expect(storageCommand).toBeDefined();
    
    const allocateCommand = storageCommand.commands.find(cmd => cmd.name() === 'allocate');
    expect(allocateCommand).toBeDefined();
    
    // Execute the command
    await allocateCommand.actionCallback({ size: 1000 });
    
    // Verify the allocate function was called with the right params
    expect(mockOptimizedStorage.allocateStorage).toHaveBeenCalledWith(
      expect.objectContaining({ size: 1000 })
    );
    
    // Verify success output
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Storage allocated'));
  });
  
  test('should handle storage allocation errors', async () => {
    // Mock error for storage allocation
    mockOptimizedStorage.allocateStorage.mockRejectedValueOnce(
      new Error('Failed to allocate storage')
    );
    
    // Get the storage allocate command
    const storageCommand = program.commands.find(cmd => cmd.name() === 'storage');
    const allocateCommand = storageCommand.commands.find(cmd => cmd.name() === 'allocate');
    
    // Execute the command
    await allocateCommand.actionCallback({ size: 1000 });
    
    // Verify error handling
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to allocate storage'),
      expect.any(String)
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
  
  test('should show storage usage successfully', async () => {
    // Get the storage usage command
    const storageCommand = program.commands.find(cmd => cmd.name() === 'storage');
    const usageCommand = storageCommand.commands.find(cmd => cmd.name() === 'usage');
    expect(usageCommand).toBeDefined();
    
    // Execute the command
    await usageCommand.actionCallback({});
    
    // Verify the usage function was called
    expect(mockOptimizedStorage.getStorageUsage).toHaveBeenCalled();
    
    // Verify output contains usage information
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Storage usage'));
  });
  
  test('should upgrade storage plan successfully', async () => {
    // Get the storage upgrade command
    const storageCommand = program.commands.find(cmd => cmd.name() === 'storage');
    const upgradeCommand = storageCommand.commands.find(cmd => cmd.name() === 'upgrade');
    expect(upgradeCommand).toBeDefined();
    
    // Execute the command
    await upgradeCommand.actionCallback({ plan: 'premium' });
    
    // Verify the upgrade function was called with the right param
    expect(mockOptimizedStorage.upgradeStoragePlan).toHaveBeenCalledWith('premium');
    
    // Verify success output
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Storage plan upgraded'));
  });
});