import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletProfile } from './WalletProfile';
import * as dappKit from '@mysten/dapp-kit';
import { walletService } from '../../services/wallet';
import { mockWalletAccount } from '../../test/test-utils';

// Mock the wallet service
jest.mock('../../services/wallet', () => ({
  walletService: {
    hasStorageQuota: jest.fn(),
    createStorageQuota: jest.fn(),
    purchaseStorage: jest.fn(),
  },
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loading-spinner" />,
}));

// Mock useToast
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

// Mock dapp-kit
jest.mock('@mysten/dapp-kit', () => ({
  useCurrentAccount: jest.fn(),
  useCurrentWallet: jest.fn(),
  useSuiClient: jest.fn(),
}));

describe('WalletProfile', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should render wallet address when connected', async () => {
    // Mock account as connected
    jest.mocked(dappKit.useCurrentAccount).mockReturnValue(mockWalletAccount);
    jest.mocked(dappKit.useCurrentWallet).mockReturnValue({} as any);
    jest.mocked(dappKit.useSuiClient).mockReturnValue({} as any);
    
    // Mock wallet service functions
    jest.mocked(walletService.hasStorageQuota).mockResolvedValue(true);

    render(<WalletProfile />);
    
    // The address should be rendered
    expect(screen.getByText(mockWalletAccount.address)).toBeInTheDocument();
    
    // Wait for checking quota to complete
    await waitFor(() => {
      expect(screen.queryByText('Checking quota status...')).not.toBeInTheDocument();
    });
    
    // Should show that user has a quota
    expect(screen.getByText('You have a storage quota for WalGit.')).toBeInTheDocument();
    
    // Purchase button should be visible
    expect(screen.getByText('Purchase More Storage')).toBeInTheDocument();
  });
  
  it('should render create quota button when no quota exists', async () => {
    // Mock account as connected but no quota
    jest.mocked(dappKit.useCurrentAccount).mockReturnValue(mockWalletAccount);
    jest.mocked(dappKit.useCurrentWallet).mockReturnValue({} as any);
    jest.mocked(dappKit.useSuiClient).mockReturnValue({} as any);
    
    // Mock wallet service to return no quota
    jest.mocked(walletService.hasStorageQuota).mockResolvedValue(false);

    render(<WalletProfile />);
    
    // Wait for checking quota to complete
    await waitFor(() => {
      expect(screen.queryByText('Checking quota status...')).not.toBeInTheDocument();
    });
    
    // Should show message about needing a quota
    expect(screen.getByText('You need a storage quota to create repositories.')).toBeInTheDocument();
    
    // Create button should be visible
    expect(screen.getByText('Create Storage Quota')).toBeInTheDocument();
  });
  
  it('should handle create storage quota action', async () => {
    // Mock account and wallet
    const mockWallet = { signAndExecuteTransaction: jest.fn() };
    jest.mocked(dappKit.useCurrentAccount).mockReturnValue(mockWalletAccount);
    jest.mocked(dappKit.useCurrentWallet).mockReturnValue(mockWallet as any);
    jest.mocked(dappKit.useSuiClient).mockReturnValue({} as any);
    
    // Mock wallet service
    jest.mocked(walletService.hasStorageQuota).mockResolvedValue(false);
    jest.mocked(walletService.createStorageQuota).mockResolvedValue({} as any);

    render(<WalletProfile />);
    
    // Wait for checking quota to complete
    await waitFor(() => {
      expect(screen.queryByText('Checking quota status...')).not.toBeInTheDocument();
    });
    
    // Click create button
    fireEvent.click(screen.getByText('Create Storage Quota'));
    
    // Function should be called
    expect(walletService.createStorageQuota).toHaveBeenCalled();
  });
  
  it('should return null when wallet is not connected', () => {
    // Mock account as not connected
    jest.mocked(dappKit.useCurrentAccount).mockReturnValue(null);
    
    const { container } = render(<WalletProfile />);
    
    // The component should not render anything
    expect(container).toBeEmptyDOMElement();
  });
});