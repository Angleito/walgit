import { jest } from '@jest/globals';
import { Command } from 'commander';
import { 
  setupMocks, 
  mockRepository, 
  mockWorkingDirectory, 
  mockAuth,
  mockBlobManager,
  mockTreeBuilder 
} from './mocks.js';

// Set up all mocks
setupMocks();

// Import commands to test
import { initCommand } from '../cli/src/commands/init.js';
import { statusCommand } from '../cli/src/commands/status.js';
import { addCommand } from '../cli/src/commands/add.js';
import { commitCommand } from '../cli/src/commands/commit.js';
import { branchCommand } from '../cli/src/commands/branch.js';
import { checkoutCommand } from '../cli/src/commands/checkout.js';
import { treeCommand } from '../cli/src/commands/tree.js';

// Test init command
describe('Init command', () => {
  let program;
  let consoleLogSpy;
  let consoleErrorSpy;
  let mockExit;

  beforeEach(() => {
    program = new Command();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    
    // Register command
    initCommand(program);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    mockExit.mockRestore();
    jest.clearAllMocks();
  });

  test('should initialize repository with default options', async () => {
    // Get the init command
    const cmd = program.commands.find(cmd => cmd.name() === 'init');
    expect(cmd).toBeDefined();
    
    // Execute the command with default options
    await cmd.actionCallback({});
    
    // Verify wallet validation was called
    expect(mockAuth.validateWalletConnection).toHaveBeenCalled();
    
    // Verify repository creation was called
    expect(mockRepository.createRepository).toHaveBeenCalledWith(expect.objectContaining({
      name: expect.any(String),
      description: '',
      isPrivate: false
    }));
    
    // Verify success output
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Repository ID'));
  });
  
  test('should initialize repository with custom options', async () => {
    // Get the init command
    const cmd = program.commands.find(cmd => cmd.name() === 'init');
    
    // Execute the command with custom options
    await cmd.actionCallback({
      name: 'custom-repo',
      description: 'Custom repository description',
      private: true
    });
    
    // Verify repository creation was called with custom options
    expect(mockRepository.createRepository).toHaveBeenCalledWith({
      name: 'custom-repo',
      description: 'Custom repository description',
      isPrivate: true
    });
  });
  
  test('should handle initialization errors', async () => {
    // Mock error for repository creation
    mockRepository.createRepository.mockRejectedValueOnce(
      new Error('Failed to create repository')
    );
    
    // Get the init command
    const cmd = program.commands.find(cmd => cmd.name() === 'init');
    
    // Execute the command
    await cmd.actionCallback({});
    
    // Verify error handling
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to initialize repository'),
      expect.any(String)
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});

// Test status command
describe('Status command', () => {
  let program;
  let consoleLogSpy;
  let consoleErrorSpy;
  let mockExit;

  beforeEach(() => {
    program = new Command();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    
    // Register command
    statusCommand(program);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    mockExit.mockRestore();
    jest.clearAllMocks();
  });

  test('should display repository status with no changes', async () => {
    // Mock status with no changes
    mockRepository.getRepositoryStatus.mockResolvedValueOnce({
      branch: 'main',
      changes: {
        staged: [],
        unstaged: [],
        untracked: []
      }
    });
    
    // Get the status command
    const cmd = program.commands.find(cmd => cmd.name() === 'status');
    expect(cmd).toBeDefined();
    
    // Execute the command
    await cmd.actionCallback({});
    
    // Verify getRepositoryStatus was called
    expect(mockRepository.getRepositoryStatus).toHaveBeenCalled();
    
    // Verify output shows clean working directory
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('main'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('working tree clean'));
  });
  
  test('should display repository status with changes', async () => {
    // Mock status with changes
    mockRepository.getRepositoryStatus.mockResolvedValueOnce({
      branch: 'feature',
      changes: {
        staged: ['staged1.txt', 'staged2.txt'],
        unstaged: ['modified1.js', 'modified2.js'],
        untracked: ['new1.txt', 'new2.txt']
      }
    });
    
    // Get the status command
    const cmd = program.commands.find(cmd => cmd.name() === 'status');
    
    // Execute the command
    await cmd.actionCallback({});
    
    // Verify output shows all changes
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('feature'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('staged1.txt'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('staged2.txt'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('modified1.js'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('modified2.js'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('new1.txt'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('new2.txt'));
  });
  
  test('should handle status errors', async () => {
    // Mock error for status retrieval
    mockRepository.getRepositoryStatus.mockRejectedValueOnce(
      new Error('Failed to get status')
    );
    
    // Get the status command
    const cmd = program.commands.find(cmd => cmd.name() === 'status');
    
    // Execute the command
    await cmd.actionCallback({});
    
    // Verify error handling
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to get repository status'),
      expect.any(String)
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});

// Test add command
describe('Add command', () => {
  let program;
  let consoleLogSpy;
  let consoleErrorSpy;
  let mockExit;

  beforeEach(() => {
    program = new Command();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    
    // Register command
    addCommand(program);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    mockExit.mockRestore();
    jest.clearAllMocks();
  });

  test('should add specific files to index', async () => {
    // Get the add command
    const cmd = program.commands.find(cmd => cmd.name() === 'add');
    expect(cmd).toBeDefined();
    
    // Execute the command with specific files
    await cmd.actionCallback(['file1.txt', 'file2.js']);
    
    // Verify addToIndex was called with the right files
    expect(mockRepository.addToIndex).toHaveBeenCalledWith(['file1.txt', 'file2.js']);
    
    // Verify success output
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Added'));
  });
  
  test('should add all files to index when using dot notation', async () => {
    // Get the add command
    const cmd = program.commands.find(cmd => cmd.name() === 'add');
    
    // Execute the command with dot notation
    await cmd.actionCallback(['.']);
    
    // Verify addToIndex was called with dot notation
    expect(mockRepository.addToIndex).toHaveBeenCalledWith(['.']);
    
    // Verify success output
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Added'));
  });
  
  test('should handle add errors', async () => {
    // Mock error for adding files
    mockRepository.addToIndex.mockRejectedValueOnce(
      new Error('Failed to add files')
    );
    
    // Get the add command
    const cmd = program.commands.find(cmd => cmd.name() === 'add');
    
    // Execute the command
    await cmd.actionCallback(['file1.txt']);
    
    // Verify error handling
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to add files to index'),
      expect.any(String)
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
  
  test('should handle when no files are specified', async () => {
    // Get the add command
    const cmd = program.commands.find(cmd => cmd.name() === 'add');
    
    // Execute the command with no files
    await cmd.actionCallback([]);
    
    // Verify error message about needing files
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('No files specified')
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});

// Test commit command
describe('Commit command', () => {
  let program;
  let consoleLogSpy;
  let consoleErrorSpy;
  let mockExit;

  beforeEach(() => {
    program = new Command();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    
    // Register command
    commitCommand(program);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    mockExit.mockRestore();
    jest.clearAllMocks();
  });

  test('should commit changes with message', async () => {
    // Get the commit command
    const cmd = program.commands.find(cmd => cmd.name() === 'commit');
    expect(cmd).toBeDefined();
    
    // Execute the command with message
    await cmd.actionCallback({ message: 'Test commit message' });
    
    // Verify commitChanges was called with the right message
    expect(mockRepository.commitChanges).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test commit message' })
    );
    
    // Verify success output
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Committed'));
  });
  
  test('should commit with author information if provided', async () => {
    // Get the commit command
    const cmd = program.commands.find(cmd => cmd.name() === 'commit');
    
    // Execute the command with author info
    await cmd.actionCallback({
      message: 'Test commit message',
      author: 'Test User',
      email: 'test@example.com'
    });
    
    // Verify commitChanges was called with the right info
    expect(mockRepository.commitChanges).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Test commit message',
        author: 'Test User',
        email: 'test@example.com'
      })
    );
  });
  
  test('should handle commit errors', async () => {
    // Mock error for committing
    mockRepository.commitChanges.mockRejectedValueOnce(
      new Error('Failed to commit changes')
    );
    
    // Get the commit command
    const cmd = program.commands.find(cmd => cmd.name() === 'commit');
    
    // Execute the command
    await cmd.actionCallback({ message: 'Test commit message' });
    
    // Verify error handling
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to commit changes'),
      expect.any(String)
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
  
  test('should require a commit message', async () => {
    // Get the commit command
    const cmd = program.commands.find(cmd => cmd.name() === 'commit');
    
    // Execute the command with empty message
    await cmd.actionCallback({ message: '' });
    
    // Verify error about missing message
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Commit message is required')
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});

// Test branch command
describe('Branch command', () => {
  let program;
  let consoleLogSpy;
  let consoleErrorSpy;
  let mockExit;

  beforeEach(() => {
    program = new Command();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    
    // Mock the required repository functions
    mockRepository.getBranches = jest.fn().mockResolvedValue([
      { name: 'main', isCurrent: true },
      { name: 'develop', isCurrent: false },
      { name: 'feature/xyz', isCurrent: false }
    ]);
    
    mockRepository.createBranch = jest.fn().mockResolvedValue({
      name: 'new-branch',
      success: true
    });
    
    mockRepository.deleteBranch = jest.fn().mockResolvedValue({
      name: 'feature/xyz',
      success: true
    });
    
    // Register command
    branchCommand(program);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    mockExit.mockRestore();
    jest.clearAllMocks();
  });

  test('should list all branches', async () => {
    // Get the branch command
    const cmd = program.commands.find(cmd => cmd.name() === 'branch');
    expect(cmd).toBeDefined();
    
    // Execute the command with no args (list mode)
    await cmd.actionCallback([]);
    
    // Verify getBranches was called
    expect(mockRepository.getBranches).toHaveBeenCalled();
    
    // Verify output shows all branches
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('* main'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('develop'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('feature/xyz'));
  });
  
  test('should create a new branch', async () => {
    // Get the branch command
    const cmd = program.commands.find(cmd => cmd.name() === 'branch');
    
    // Execute the command to create a branch
    await cmd.actionCallback(['new-branch']);
    
    // Verify createBranch was called with the right name
    expect(mockRepository.createBranch).toHaveBeenCalledWith('new-branch');
    
    // Verify success output
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Created'));
  });
  
  test('should delete a branch', async () => {
    // Get the branch command
    const cmd = program.commands.find(cmd => cmd.name() === 'branch');
    
    // Execute the command to delete a branch
    await cmd.actionCallback({ delete: 'feature/xyz' });
    
    // Verify deleteBranch was called with the right name
    expect(mockRepository.deleteBranch).toHaveBeenCalledWith('feature/xyz');
    
    // Verify success output
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Deleted'));
  });
  
  test('should handle branch creation errors', async () => {
    // Mock error for branch creation
    mockRepository.createBranch.mockRejectedValueOnce(
      new Error('Failed to create branch')
    );
    
    // Get the branch command
    const cmd = program.commands.find(cmd => cmd.name() === 'branch');
    
    // Execute the command
    await cmd.actionCallback(['new-branch']);
    
    // Verify error handling
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to create branch'),
      expect.any(String)
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});

// Test tree command
describe('Tree command', () => {
  let program;
  let consoleLogSpy;
  let consoleErrorSpy;
  let mockExit;

  beforeEach(() => {
    program = new Command();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    
    // Register command
    treeCommand(program);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    mockExit.mockRestore();
    jest.clearAllMocks();
  });

  test('should display tree structure', async () => {
    // Mock tree with nested structure
    mockTreeBuilder.getTree.mockResolvedValueOnce({
      rootTree: {
        id: '0xtree123456',
        entries: [
          { name: 'file1.txt', type: 'blob', hash: 'hash1' },
          { name: 'file2.js', type: 'blob', hash: 'hash2' },
          { 
            name: 'src', 
            type: 'tree',
            entries: [
              { name: 'index.js', type: 'blob', hash: 'hash3' },
              { name: 'app.js', type: 'blob', hash: 'hash4' }
            ]
          }
        ]
      }
    });
    
    // Get the tree command
    const cmd = program.commands.find(cmd => cmd.name() === 'tree');
    expect(cmd).toBeDefined();
    
    // Execute the command
    await cmd.actionCallback({ ref: 'main' });
    
    // Verify getTree was called with the right ref
    expect(mockTreeBuilder.getTree).toHaveBeenCalledWith('main');
    
    // Verify output shows tree structure
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('file1.txt'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('file2.js'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('src'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('index.js'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('app.js'));
  });
  
  test('should handle tree errors', async () => {
    // Mock error for tree retrieval
    mockTreeBuilder.getTree.mockRejectedValueOnce(
      new Error('Failed to get tree')
    );
    
    // Get the tree command
    const cmd = program.commands.find(cmd => cmd.name() === 'tree');
    
    // Execute the command
    await cmd.actionCallback({ ref: 'main' });
    
    // Verify error handling
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to get tree'),
      expect.any(String)
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});