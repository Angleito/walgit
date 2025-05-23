import React, { ReactNode } from 'react';
import { render as rtlRender } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuiClient } from '@mysten/sui.js/client';

// Mock Next.js navigation and routing
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
    refresh: jest.fn(),
  })),
  usePathname: jest.fn(() => '/current-path'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useParams: jest.fn(() => ({})),
}));

// Mock the dapp-kit modules we need
jest.mock('@mysten/dapp-kit', () => {
  return {
    SuiClientProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
    WalletProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
    ConnectButton: () => <button data-testid="connect-wallet-button">Connect Wallet</button>,
    useCurrentAccount: jest.fn(),
    useCurrentWallet: jest.fn(),
    useSuiClient: jest.fn(),
  };
});

// Create mock wallet data
export const mockWalletAccount = {
  address: '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  publicKey: new Uint8Array([1, 2, 3, 4, 5]),
  chains: ['sui:devnet'] as `${string}:${string}`[],
  features: ['sui:signAndExecuteTransaction'],
};

// Mock SuiClient with test responses
export const createMockSuiClient = () => {
  return {
    getOwnedObjects: jest.fn().mockResolvedValue({
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
      signAndExecuteTransaction: jest.fn().mockResolvedValue({
        digest: '123',
        effects: { status: { status: 'success' } },
      }),
      getAccounts: jest.fn().mockResolvedValue([mockWalletAccount]),
    }
  };
};

// Functions to manipulate and inspect Next.js routing mocks
export const mockNextNavigation = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
  refresh: jest.fn(),
  
  // Helper to setup routing mocks for a test
  setupRouter(router = {}) {
    const nextNavigation = require('next/navigation');
    nextNavigation.useRouter.mockReturnValue({
      push: this.push,
      replace: this.replace,
      back: this.back,
      forward: this.forward,
      prefetch: this.prefetch,
      refresh: this.refresh,
      ...router
    });
    return nextNavigation.useRouter();
  },
  
  // Helper to setup route parameters
  setupParams(params = {}) {
    const nextNavigation = require('next/navigation');
    nextNavigation.useParams.mockReturnValue(params);
    return params;
  },
  
  // Helper to setup pathname
  setupPathname(pathname = '/current-path') {
    const nextNavigation = require('next/navigation');
    nextNavigation.usePathname.mockReturnValue(pathname);
    return pathname;
  },
  
  // Helper to setup search parameters
  setupSearchParams(searchParams = {}) {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      params.set(key, String(value));
    });
    
    const nextNavigation = require('next/navigation');
    nextNavigation.useSearchParams.mockReturnValue(params);
    return params;
  },
  
  // Reset all mocks
  resetMocks() {
    this.push.mockReset();
    this.replace.mockReset();
    this.back.mockReset();
    this.forward.mockReset();
    this.prefetch.mockReset();
    this.refresh.mockReset();
    
    const nextNavigation = require('next/navigation');
    nextNavigation.usePathname.mockReset();
    nextNavigation.useSearchParams.mockReset();
    nextNavigation.useParams.mockReset();
    nextNavigation.useRouter.mockReset();
  }
};

// Providers wrapper for Next.js app
export const AppProviders = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Custom render function with all providers
export function render(
  ui: React.ReactElement,
  {
    mockWallet = createMockWallet(),
    mockSuiClient = createMockSuiClient(),
    routeParams = {},
    pathname = '/current-path',
    searchParams = {},
    ...renderOptions
  } = {}
) {
  // Setup Next.js navigation mocks
  mockNextNavigation.setupRouter();
  mockNextNavigation.setupParams(routeParams);
  mockNextNavigation.setupPathname(pathname);
  mockNextNavigation.setupSearchParams(searchParams);
  
  // Setup dapp-kit mocks
  const dappKitModule = require('@mysten/dapp-kit');
  dappKitModule.useSuiClient.mockReturnValue(mockSuiClient);
  dappKitModule.useCurrentWallet.mockReturnValue(mockWallet.wallet);
  dappKitModule.useCurrentAccount.mockReturnValue(mockWallet.connected ? mockWalletAccount : null);

  function Wrapper({ children }: { children: ReactNode }) {
    return <AppProviders>{children}</AppProviders>;
  }

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// Helper for testing pages with params
export function createMockRouteComponentProps(params = {}, pathname = '', searchParams = {}) {
  mockNextNavigation.setupParams(params);
  mockNextNavigation.setupPathname(pathname);
  mockNextNavigation.setupSearchParams(searchParams);
  
  return {
    params,
    searchParams: new URLSearchParams(searchParams as Record<string, string>),
  };
}

// Re-export testing library utilities without the render function to avoid duplicates
export * from '@testing-library/react';
// Export our custom render function
// Note: we don't re-export render from the testing library