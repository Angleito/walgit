import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NewRepository from './NewRepository';
import * as dappKit from '@mysten/dapp-kit';
import { mockWalletAccount } from '../test/test-utils';
import { MemoryRouter } from 'react-router-dom';

// Mock the necessary modules
vi.mock('@mysten/dapp-kit', () => ({
  useCurrentAccount: vi.fn(),
  useCurrentWallet: vi.fn(),
  useSuiClient: vi.fn(),
  ConnectButton: () => <button>Connect Wallet</button>,
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('../services/wallet', () => ({
  walletService: {
    hasStorageQuota: vi.fn(),
    createStorageQuota: vi.fn(),
    createRepository: vi.fn(),
  },
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('NewRepository', () => {
  it('renders the connect wallet message when wallet is not connected', () => {
    // Mock account as not connected
    vi.mocked(dappKit.useCurrentAccount).mockReturnValue(null);

    render(
      <MemoryRouter>
        <NewRepository />
      </MemoryRouter>
    );

    // Check that connect wallet message is displayed
    expect(screen.getByText(/Please connect your wallet to create a repository/i)).toBeInTheDocument();
    
    // Form should not be rendered
    expect(screen.queryByLabelText(/Repository name/i)).not.toBeInTheDocument();
  });

  it('renders the form when wallet is connected', () => {
    // Mock account as connected
    vi.mocked(dappKit.useCurrentAccount).mockReturnValue(mockWalletAccount);
    vi.mocked(dappKit.useCurrentWallet).mockReturnValue({ wallet: {} } as any);
    vi.mocked(dappKit.useSuiClient).mockReturnValue({} as any);

    render(
      <MemoryRouter>
        <NewRepository />
      </MemoryRouter>
    );

    // Check that the form is displayed
    expect(screen.getByLabelText(/Repository name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create repository/i })).toBeInTheDocument();
  });
});