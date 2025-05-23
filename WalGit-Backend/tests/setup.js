// Jest setup file
import { jest } from '@jest/globals';

// Set up global mocks
global.console.error = jest.fn();

// Mock process.exit to prevent tests from exiting
const originalExit = process.exit;
process.exit = jest.fn((code) => {
  console.log(`Mock process.exit called with code: ${code}`);
  // Don't actually exit the process during tests
});

// Restore original process.exit after tests
afterAll(() => {
  process.exit = originalExit;
});
