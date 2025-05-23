import { describe, it, expect, beforeAll, jest, beforeEach } from '@jest/globals';
import { walletService } from './wallet';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { mockWalletAccount, createMockSuiClient, createMockWallet } from '../test/next-test-utils';

// Mock TransactionBlock and its methods
jest.mock('@mysten/sui.js/transactions', () => {
  return {
    TransactionBlock: jest.fn().mockImplementation(() => ({
      moveCall: jest.fn().mockReturnThis(),
      object: jest.fn(val => `object:${val}`),
      pure: {
        string: jest.fn(val => `string:${val}`),
        u64: jest.fn(val => `u64:${val}`),
        bool: jest.fn(val => `bool:${val}`),
      },
      splitCoins: jest.fn().mockReturnValue(['coin:split']),
      gas: 'gas'
    }))
  };
});

// Mock environment variables
beforeAll(() => {
  // Setup environment variables for testing
  const originalEnv = process.env;
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_WALGIT_PACKAGE_ID: '0xtest123456',
  };

  // Add window.__ENV for testing getPackageId function
  if (typeof window !== 'undefined') {
    window.__ENV = {
      WALGIT_PACKAGE_ID: '0xtest123456',
    };
  }

  return () => {
    process.env = originalEnv;
  };
});

describe('walletService', () => {
  // Setup test mocks
  const mockSuiClient = createMockSuiClient();
  const mockWallet = createMockWallet().wallet;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has the expected methods', () => {
    expect(typeof walletService.hasStorageQuota).toBe('function');
    expect(typeof walletService.createStorageQuota).toBe('function');
    expect(typeof walletService.createRepository).toBe('function');
    expect(typeof walletService.purchaseStorage).toBe('function');
  });

  it('creates a storage quota successfully', async () => {
    // Setup spy on TransactionBlock and wallet.signAndExecuteTransaction
    const txSpy = jest.spyOn(TransactionBlock.prototype, 'moveCall');
    const signAndExecuteSpy = jest.spyOn(mockWallet, 'signAndExecuteTransaction');
    
    // Execute the function
    await walletService.createStorageQuota(mockWallet);
    
    // Verify TransactionBlock.moveCall was called with the correct target
    expect(txSpy).toHaveBeenCalledWith({
      target: '0xtest123456::storage::create_storage_quota',
    });
    
    // Verify signAndExecuteTransaction was called
    expect(signAndExecuteSpy).toHaveBeenCalled();
  });

  it('checks for storage quota successfully', async () => {
    // Execute the function
    const result = await walletService.hasStorageQuota(mockSuiClient, mockWalletAccount.address);
    
    // Verify client.getOwnedObjects was called with correct parameters
    expect(mockSuiClient.getOwnedObjects).toHaveBeenCalledWith({
      owner: mockWalletAccount.address,
      filter: { 
        StructType: '0xtest123456::storage::StorageQuota' 
      },
    });
    
    // Verify it returns true when quota exists
    expect(result).toBe(true);
  });

  it('handles errors when checking for storage quota', async () => {
    // Make client.getOwnedObjects throw an error
    mockSuiClient.getOwnedObjects.mockRejectedValueOnce(new Error('Network error'));
    
    // Execute the function
    const result = await walletService.hasStorageQuota(mockSuiClient, mockWalletAccount.address);
    
    // Verify it returns false on error
    expect(result).toBe(false);
  });
});