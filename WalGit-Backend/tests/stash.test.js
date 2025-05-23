/**
 * Tests for the stash command functionality
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { jest } from '@jest/globals';
import { 
  createStash, 
  getStashList, 
  applyStash, 
  dropStash, 
  showStash 
} from '../cli/src/utils/stash-manager.js';

// Mock the file system operations
jest.mock('fs');
jest.mock('path');

// Mock config utilities
jest.mock('../cli/src/utils/config.js', () => ({
  getWalGitDir: jest.fn(() => '/mock/walgit/dir'),
  getCurrentRepository: jest.fn(() => ({ id: 'repo123', name: 'test-repo' }))
}));

// Mock repository utilities
jest.mock('../cli/src/utils/repository.js', () => ({
  getRepositoryStatus: jest.fn(() => ({
    currentBranch: 'main',
    stagedChanges: [
      { path: 'file1.txt', status: 'modified' },
      { path: 'file2.txt', status: 'added' }
    ],
    unstagedChanges: [
      { path: 'file3.txt', status: 'modified' }
    ],
    untrackedFiles: [
      'file4.txt'
    ]
  }))
}));

// Mock working directory utilities
jest.mock('../cli/src/utils/working-directory.js', () => ({
  calculateFileHash: jest.fn((content) => 'mock-hash-' + content.toString().substr(0, 10)),
  getFileMetadata: jest.fn(() => ({ hash: 'mock-hash-123', size: 100 })),
  isFileModified: jest.fn(() => false),
  getIndexHash: jest.fn(() => 'mock-index-hash-123')
}));

// Test suite
describe('Stash Command', () => {
  // Setup before each test
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock file system
    fs.existsSync.mockImplementation((filePath) => {
      if (filePath === '/mock/walgit/dir/stash') return true;
      if (filePath === '/mock/walgit/dir/stash/stash-index.json') return true;
      if (filePath.includes('file')) return true;
      return false;
    });
    
    fs.readFileSync.mockImplementation((filePath, encoding) => {
      if (filePath === '/mock/walgit/dir/stash/stash-index.json') {
        return JSON.stringify([
          {
            id: 'stash-123456-abcd',
            branch: 'main',
            message: 'WIP on main: Test stash',
            timestamp: '2023-01-01T00:00:00.000Z',
            filesCount: 3
          }
        ]);
      }
      
      if (filePath === '/mock/walgit/dir/stash/stash-123456-abcd/metadata.json') {
        return JSON.stringify({
          id: 'stash-123456-abcd',
          branch: 'main',
          message: 'WIP on main: Test stash',
          timestamp: '2023-01-01T00:00:00.000Z',
          stagedChanges: {
            'file1.txt': { hash: 'hash1', status: 'modified', size: 100 },
            'file2.txt': { hash: 'hash2', status: 'added', size: 200 }
          },
          unstagedChanges: {
            'file3.txt': { hash: 'hash3', status: 'modified', size: 300 }
          },
          untrackedFiles: {}
        });
      }
      
      if (filePath.includes('file')) {
        return Buffer.from(`Content of ${path.basename(filePath)}`);
      }
      
      return '';
    });
    
    fs.writeFileSync.mockImplementation(() => {});
    fs.mkdirSync.mockImplementation(() => {});
    fs.rmSync.mockImplementation(() => {});
    
    path.join.mockImplementation((...parts) => parts.join('/'));
    path.dirname.mockImplementation((filePath) => {
      const parts = filePath.split('/');
      parts.pop();
      return parts.join('/');
    });
    path.basename.mockImplementation((filePath) => {
      return filePath.split('/').pop();
    });
  });
  
  // Test creating a stash
  test('createStash should create a new stash entry', async () => {
    const stashResult = await createStash({ message: 'Test stash' });
    
    // Verify stash was created
    expect(stashResult).toBeDefined();
    expect(stashResult.message).toBe('Test stash');
    expect(stashResult.branch).toBe('main');
    expect(stashResult.stagedChanges).toBeDefined();
    expect(stashResult.unstagedChanges).toBeDefined();
    
    // Verify file system operations
    expect(fs.mkdirSync).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalled();
  });
  
  // Test listing stashes
  test('getStashList should return list of stashes', () => {
    const stashList = getStashList();
    
    expect(stashList).toHaveLength(1);
    expect(stashList[0].id).toBe('stash-123456-abcd');
    expect(stashList[0].message).toBe('WIP on main: Test stash');
  });
  
  // Test showing stash details
  test('showStash should return stash details', async () => {
    const stashDetails = await showStash({});
    
    expect(stashDetails).toBeDefined();
    expect(stashDetails.id).toBe('stash-123456-abcd');
    expect(stashDetails.branch).toBe('main');
    expect(stashDetails.stagedChanges).toBeDefined();
    expect(Object.keys(stashDetails.stagedChanges)).toHaveLength(2);
  });
  
  // Test applying a stash
  test('applyStash should apply stashed changes', async () => {
    const applyResult = await applyStash({});
    
    expect(applyResult).toBeDefined();
    expect(applyResult.stash).toBeDefined();
    expect(applyResult.results).toBeDefined();
    expect(applyResult.results.applied).toBeDefined();
    
    // Verify file system operations
    expect(fs.readFileSync).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalled();
  });
  
  // Test dropping a stash
  test('dropStash should remove a stash', async () => {
    const dropResult = await dropStash({});
    
    expect(dropResult).toBe(true);
    
    // Verify file system operations
    expect(fs.rmSync).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalled();
  });
});