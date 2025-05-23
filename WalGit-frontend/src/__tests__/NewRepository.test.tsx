import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import * as dappKit from '@mysten/dapp-kit';
import { mockWalletAccount, TestWrapper } from '../test/test-utils';

// Importing from app directory
import NewRepositoryPage from '@/app/new-repository/page';

// Mock the necessary modules
jest.mock('@mysten/dapp-kit', () => ({
  useCurrentAccount: jest.fn(),
  useCurrentWallet: jest.fn(),
  useSuiClient: jest.fn(),
  ConnectButton: () => <button>Connect Wallet</button>,
}));

// Mock the router hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('../services/wallet', () => ({
  walletService: {
    hasStorageQuota: jest.fn(),
    createStorageQuota: jest.fn(),
    createRepository: jest.fn(),
  },
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('@/components/ui/notification-system', () => ({
  useNotification: () => ({ addNotification: jest.fn() }),
}));

describe('NewRepository', () => {
  it('renders the connect wallet message when wallet is not connected', () => {
    // Mock account as not connected
    jest.mocked(dappKit.useCurrentAccount).mockReturnValue(null);

    render(
      <TestWrapper>
        <NewRepositoryPage />
      </TestWrapper>
    );

    // Check that connect wallet message is displayed
    expect(screen.getByText(/Please connect your wallet to create a repository/i)).toBeInTheDocument();

    // Form should not be rendered
    expect(screen.queryByLabelText(/Repository name/i)).not.toBeInTheDocument();
  });

  it('renders the form when wallet is connected', () => {
    // Mock account as connected
    jest.mocked(dappKit.useCurrentAccount).mockReturnValue(mockWalletAccount);
    jest.mocked(dappKit.useCurrentWallet).mockReturnValue({ wallet: {} } as any);
    jest.mocked(dappKit.useSuiClient).mockReturnValue({} as any);

    render(
      <TestWrapper>
        <NewRepositoryPage />
      </TestWrapper>
    );

    // Check that the form is displayed
    expect(screen.getByLabelText(/Repository name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create repository/i })).toBeInTheDocument();
  });
});