import { jest } from '@jest/globals';
import { Command } from 'commander';
import { 
  setupMocks, 
  mockRepository,
  mockTransactionUtils,
  mockSuiIntegration
} from './mocks.js';

// Set up all mocks
setupMocks();

// Import commands to test
import { pushCommand } from '../cli/src/commands/push.js';
import { pullCommand } from '../cli/src/commands/pull.js';
import { fetchCommand } from '../cli/src/commands/fetch.js';
import { remoteCommand } from '../cli/src/commands/remote.js';
import { cloneCommand } from '../cli/src/commands/clone.js';

// Test push command
describe('Push command', () => {
  let program;
  let consoleLogSpy;
  let consoleErrorSpy;
  let mockExit;

  beforeEach(() => {
    program = new Command();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    
    // Mock additional repository functions
    mockRepository.pushChanges = jest.fn().mockResolvedValue({
      success: true,
      branch: 'main',
      commitsPushed: 2
    });
    
    // Register command
    pushCommand(program);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    mockExit.mockRestore();
    jest.clearAllMocks();
  });

  test('should push changes to remote', async () => {
    // Get the push command
    const cmd = program.commands.find(cmd => cmd.name() === 'push');
    expect(cmd).toBeDefined();
    
    // Execute the command
    await cmd.actionCallback({});
    
    // Verify pushChanges was called
    expect(mockRepository.pushChanges).toHaveBeenCalled();
    
    // Verify success output
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Pushed'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('2 commits'));
  });
  
  test('should push to specific remote and branch if specified', async () => {
    // Get the push command
    const cmd = program.commands.find(cmd => cmd.name() === 'push');
    
    // Execute the command with options
    await cmd.actionCallback({
      remote: 'upstream',
      branch: 'develop'
    });
    
    // Verify pushChanges was called with the right parameters
    expect(mockRepository.pushChanges).toHaveBeenCalledWith(
      expect.objectContaining({
        remote: 'upstream',
        branch: 'develop'
      })
    );
  });
  
  test('should handle push errors', async () => {
    // Mock error for push
    mockRepository.pushChanges.mockRejectedValueOnce(
      new Error('Failed to push changes')
    );
    
    // Get the push command
    const cmd = program.commands.find(cmd => cmd.name() === 'push');
    
    // Execute the command
    await cmd.actionCallback({});
    
    // Verify error handling
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to push changes'),
      expect.any(String)
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});

// Test pull command
describe('Pull command', () => {
  let program;
  let consoleLogSpy;
  let consoleErrorSpy;
  let mockExit;

  beforeEach(() => {
    program = new Command();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    
    // Mock additional repository functions
    mockRepository.pullChanges = jest.fn().mockResolvedValue({
      updated: true,
      branch: 'main',
      newCommits: 3
    });
    
    // Register command
    pullCommand(program);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    mockExit.mockRestore();
    jest.clearAllMocks();
  });

  test('should pull changes from remote', async () => {
    // Get the pull command
    const cmd = program.commands.find(cmd => cmd.name() === 'pull');
    expect(cmd).toBeDefined();
    
    // Execute the command
    await cmd.actionCallback({});
    
    // Verify pullChanges was called
    expect(mockRepository.pullChanges).toHaveBeenCalled();
    
    // Verify success output
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Pulled'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('3 new commits'));
  });
  
  test('should pull from specific remote and branch if specified', async () => {
    // Get the pull command
    const cmd = program.commands.find(cmd => cmd.name() === 'pull');
    
    // Execute the command with options
    await cmd.actionCallback({
      remote: 'upstream',
      branch: 'develop'
    });
    
    // Verify pullChanges was called with the right parameters
    expect(mockRepository.pullChanges).toHaveBeenCalledWith(
      expect.objectContaining({
        remote: 'upstream',
        branch: 'develop'
      })
    );
  });
  
  test('should handle pull errors', async () => {
    // Mock error for pull
    mockRepository.pullChanges.mockRejectedValueOnce(
      new Error('Failed to pull changes')
    );
    
    // Get the pull command
    const cmd = program.commands.find(cmd => cmd.name() === 'pull');
    
    // Execute the command
    await cmd.actionCallback({});
    
    // Verify error handling
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to pull changes'),
      expect.any(String)
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});

// Test fetch command
describe('Fetch command', () => {
  let program;
  let consoleLogSpy;
  let consoleErrorSpy;
  let mockExit;

  beforeEach(() => {
    program = new Command();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    
    // Mock additional repository functions
    mockRepository.fetchRemote = jest.fn().mockResolvedValue({
      branches: ['main', 'develop', 'feature/xyz'],
      commits: 5
    });
    
    // Register command
    fetchCommand(program);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    mockExit.mockRestore();
    jest.clearAllMocks();
  });

  test('should fetch changes from remote', async () => {
    // Get the fetch command
    const cmd = program.commands.find(cmd => cmd.name() === 'fetch');
    expect(cmd).toBeDefined();
    
    // Execute the command
    await cmd.actionCallback({});
    
    // Verify fetchRemote was called
    expect(mockRepository.fetchRemote).toHaveBeenCalled();
    
    // Verify success output
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Fetched'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('5 commits'));
  });
  
  test('should fetch from specific remote if specified', async () => {
    // Get the fetch command
    const cmd = program.commands.find(cmd => cmd.name() === 'fetch');
    
    // Execute the command with options
    await cmd.actionCallback({
      remote: 'upstream'
    });
    
    // Verify fetchRemote was called with the right parameters
    expect(mockRepository.fetchRemote).toHaveBeenCalledWith(
      expect.objectContaining({
        remote: 'upstream'
      })
    );
  });
  
  test('should handle fetch errors', async () => {
    // Mock error for fetch
    mockRepository.fetchRemote.mockRejectedValueOnce(
      new Error('Failed to fetch changes')
    );
    
    // Get the fetch command
    const cmd = program.commands.find(cmd => cmd.name() === 'fetch');
    
    // Execute the command
    await cmd.actionCallback({});
    
    // Verify error handling
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to fetch changes'),
      expect.any(String)
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});

// Test remote command
describe('Remote command', () => {
  let program;
  let consoleLogSpy;
  let consoleErrorSpy;
  let mockExit;

  beforeEach(() => {
    program = new Command();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    
    // Mock additional repository functions
    mockRepository.getRemotes = jest.fn().mockResolvedValue([
      { name: 'origin', url: 'https://example.com/repo' },
      { name: 'upstream', url: 'https://example.com/upstream' }
    ]);
    
    mockRepository.addRemote = jest.fn().mockResolvedValue({
      name: 'newremote',
      url: 'https://example.com/newremote',
      success: true
    });
    
    mockRepository.removeRemote = jest.fn().mockResolvedValue({
      name: 'upstream',
      success: true
    });
    
    // Register command
    remoteCommand(program);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    mockExit.mockRestore();
    jest.clearAllMocks();
  });

  test('should list remotes', async () => {
    // Get the remote command
    const remoteCmd = program.commands.find(cmd => cmd.name() === 'remote');
    expect(remoteCmd).toBeDefined();
    
    // Execute the command without arguments (list mode)
    await remoteCmd.actionCallback({});
    
    // Verify getRemotes was called
    expect(mockRepository.getRemotes).toHaveBeenCalled();
    
    // Verify output shows both remotes
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('origin'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('upstream'));
  });
  
  test('should add a new remote', async () => {
    // Get the remote add subcommand
    const remoteCmd = program.commands.find(cmd => cmd.name() === 'remote');
    const addCmd = remoteCmd.commands.find(cmd => cmd.name() === 'add');
    expect(addCmd).toBeDefined();
    
    // Execute the command
    await addCmd.actionCallback(['newremote', 'https://example.com/newremote']);
    
    // Verify addRemote was called with the right parameters
    expect(mockRepository.addRemote).toHaveBeenCalledWith(
      'newremote', 
      'https://example.com/newremote'
    );
    
    // Verify success output
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Added'));
  });
  
  test('should remove a remote', async () => {
    // Get the remote remove subcommand
    const remoteCmd = program.commands.find(cmd => cmd.name() === 'remote');
    const removeCmd = remoteCmd.commands.find(cmd => cmd.name() === 'remove');
    expect(removeCmd).toBeDefined();
    
    // Execute the command
    await removeCmd.actionCallback(['upstream']);
    
    // Verify removeRemote was called with the right parameter
    expect(mockRepository.removeRemote).toHaveBeenCalledWith('upstream');
    
    // Verify success output
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Removed'));
  });
  
  test('should handle remote operation errors', async () => {
    // Mock error for remote operations
    mockRepository.addRemote.mockRejectedValueOnce(
      new Error('Failed to add remote')
    );
    
    // Get the remote add subcommand
    const remoteCmd = program.commands.find(cmd => cmd.name() === 'remote');
    const addCmd = remoteCmd.commands.find(cmd => cmd.name() === 'add');
    
    // Execute the command
    await addCmd.actionCallback(['newremote', 'https://example.com/newremote']);
    
    // Verify error handling
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to add remote'),
      expect.any(String)
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});

// Test clone command
describe('Clone command', () => {
  let program;
  let consoleLogSpy;
  let consoleErrorSpy;
  let mockExit;

  beforeEach(() => {
    program = new Command();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    
    // Mock additional repository functions
    mockRepository.cloneRepository = jest.fn().mockResolvedValue({
      name: 'cloned-repo',
      url: 'https://example.com/repo',
      branch: 'main',
      success: true
    });
    
    // Register command
    cloneCommand(program);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    mockExit.mockRestore();
    jest.clearAllMocks();
  });

  test('should clone a repository', async () => {
    // Get the clone command
    const cmd = program.commands.find(cmd => cmd.name() === 'clone');
    expect(cmd).toBeDefined();
    
    // Execute the command
    await cmd.actionCallback(['https://example.com/repo', 'target-dir']);
    
    // Verify cloneRepository was called with the right parameters
    expect(mockRepository.cloneRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://example.com/repo',
        directory: 'target-dir'
      })
    );
    
    // Verify success output
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Cloned'));
  });
  
  test('should clone with specific branch if specified', async () => {
    // Get the clone command
    const cmd = program.commands.find(cmd => cmd.name() === 'clone');
    
    // Execute the command with options
    await cmd.actionCallback({
      arguments: ['https://example.com/repo', 'target-dir'],
      branch: 'develop'
    });
    
    // Verify cloneRepository was called with the right parameters
    expect(mockRepository.cloneRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://example.com/repo',
        directory: 'target-dir',
        branch: 'develop'
      })
    );
  });
  
  test('should handle clone errors', async () => {
    // Mock error for clone
    mockRepository.cloneRepository.mockRejectedValueOnce(
      new Error('Failed to clone repository')
    );
    
    // Get the clone command
    const cmd = program.commands.find(cmd => cmd.name() === 'clone');
    
    // Execute the command
    await cmd.actionCallback(['https://example.com/repo']);
    
    // Verify error handling
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to clone repository'),
      expect.any(String)
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});