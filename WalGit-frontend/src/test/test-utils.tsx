import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { SuiClient } from '@mysten/sui.js/client';

// Mock the modules we need
vi.mock('@mysten/dapp-kit', () => {
  return {
    SuiClientProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
    WalletProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
    ConnectButton: () => <button data-testid="connect-wallet-button">Connect Wallet</button>,
    useCurrentAccount: vi.fn(),
    useCurrentWallet: vi.fn(),
    useSuiClient: vi.fn(),
  };
});

// Create mock wallet data
export const mockWalletAccount = {
  address: '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  publicKey: new Uint8Array([1, 2, 3, 4, 5]),
  chains: ['sui:devnet'],
  features: ['sui:signAndExecuteTransaction'],
};

// Mock SuiClient with test responses
export const createMockSuiClient = () => {
  return {
    getOwnedObjects: vi.fn().mockResolvedValue({
      data: [
        {
          data: {
            objectId: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            digest: 'digest',
            version: '1',
            type: 'mockType',
            owner: { AddressOwner: mockWalletAccount.address },
            content: {
              dataType: 'moveObject',
              type: '0x0123::storage::StorageQuota',
              fields: {
                id: { id: '0xabcdef' },
                bytes_available: '1048576', // 1MB
                bytes_used: '0',
                owner: mockWalletAccount.address
              }
            }
          }
        }
      ]
    }),
    // Add more mock methods as needed
  } as unknown as SuiClient;
};

// Mock wallet with test behavior
export const createMockWallet = () => {
  return {
    name: 'Mock Wallet',
    accounts: [mockWalletAccount],
    chains: ['sui:devnet'],
    features: ['sui:signAndExecuteTransaction'],
    connecting: false,
    connected: true,
    wallet: {
      signAndExecuteTransaction: vi.fn().mockResolvedValue({
        digest: '123',
        effects: { status: { status: 'success' } },
      }),
      getAccounts: vi.fn().mockResolvedValue([mockWalletAccount]),
    }
  };
};

// Test wrapper component
export const TestWrapper = ({ 
  children, 
  mockWallet = createMockWallet(),
  mockSuiClient = createMockSuiClient(),
  initialEntries = ['/']
}: { 
  children: ReactNode,
  mockWallet?: any,
  mockSuiClient?: any,
  initialEntries?: string[]
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  // Setup module mocks before rendering
  const dappKitModule = require('@mysten/dapp-kit');
  dappKitModule.useSuiClient.mockReturnValue(mockSuiClient);
  dappKitModule.useCurrentWallet.mockReturnValue({ wallet: mockWallet.wallet });
  dappKitModule.useCurrentAccount.mockReturnValue(mockWallet.connected ? mockWalletAccount : null);

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};