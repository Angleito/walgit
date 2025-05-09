import { describe, it, expect, vi } from 'vitest';
import { walletService } from './wallet';

// Mock TransactionBlock constructor and its methods
const mockTx = {
  moveCall: vi.fn(),
  pure: {
    string: vi.fn().mockImplementation(val => `string:${val}`),
    u64: vi.fn().mockImplementation(val => `u64:${val}`)
  },
  object: vi.fn().mockImplementation(val => `object:${val}`),
  splitCoins: vi.fn().mockReturnValue(['coin:split']),
  gas: 'gas'
};

// Mock environment variables
vi.stubGlobal('import.meta', {
  env: {
    VITE_WALGIT_PACKAGE_ID: '0xtest123'
  }
});

// Mock TransactionBlock class
vi.mock('@mysten/sui.js/transactions', () => ({
  TransactionBlock: vi.fn().mockImplementation(() => mockTx)
}));

describe('wallet service', () => {
  // Simple test to verify the module imports correctly
  it('has the expected methods', () => {
    expect(typeof walletService.hasStorageQuota).toBe('function');
    expect(typeof walletService.createStorageQuota).toBe('function');
    expect(typeof walletService.createRepository).toBe('function');
  });
});