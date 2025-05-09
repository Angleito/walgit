import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WalletProfile } from './WalletProfile';
import * as dappKit from '@mysten/dapp-kit';
import { walletService } from '../../services/wallet';
import { mockWalletAccount } from '../../test/test-utils';

// Mock the wallet service
vi.mock('../../services/wallet', () => ({
  walletService: {
    hasStorageQuota: vi.fn(),
    createStorageQuota: vi.fn(),
  },
}));

// Mock useCurrentAccount
vi.mock('@mysten/dapp-kit', async () => {
  return {
    useCurrentAccount: vi.fn(),
    useCurrentWallet: vi.fn(),
    useSuiClient: vi.fn(),
  };
});

// Mock useToast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('WalletProfile', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks();
  });

  it('should render wallet address when connected', () => {
    // Mock account as connected
    vi.mocked(dappKit.useCurrentAccount).mockReturnValue(mockWalletAccount);
    vi.mocked(dappKit.useCurrentWallet).mockReturnValue({ wallet: {} } as any);
    vi.mocked(dappKit.useSuiClient).mockReturnValue({} as any);
    
    // Mock wallet service functions
    vi.mocked(walletService.hasStorageQuota).mockResolvedValue(true);

    render(<WalletProfile />);
    
    // The address should be rendered
    expect(screen.getByText(mockWalletAccount.address)).toBeInTheDocument();
  });
  
  it('should return null when wallet is not connected', () => {
    // Mock account as not connected
    vi.mocked(dappKit.useCurrentAccount).mockReturnValue(null);
    
    const { container } = render(<WalletProfile />);
    
    // The component should not render anything
    expect(container).toBeEmptyDOMElement();
  });
});