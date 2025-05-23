import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { ConnectWallet } from './ConnectWallet';
import * as dappKit from '@mysten/dapp-kit';
import { mockNextNavigation } from '../../test/next-test-utils';

// Mock dapp-kit
jest.mock('@mysten/dapp-kit', () => ({
  ConnectButton: ({ children, className }: any) => {
    const renderProps = children({
      connected: false,
      connecting: false,
      connect: jest.fn(),
      disconnect: jest.fn(),
      wallet: null,
    });
    return (
      <div data-testid="connect-button" className={className}>
        {renderProps}
      </div>
    );
  },
  useWallets: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loading-icon" />,
}));

describe('ConnectWallet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNextNavigation.resetMocks();
    
    // Setup default wallet as not connected
    jest.mocked(dappKit.useWallets).mockReturnValue({
      currentWallet: null,
      wallets: [],
      select: jest.fn(),
    });
  });

  it('renders connect button when wallet is not connected', () => {
    render(<ConnectWallet />);
    
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    expect(screen.getByText('Don\'t have a Sui wallet? Install one of these:')).toBeInTheDocument();
    expect(screen.getByText('Slush Wallet')).toBeInTheDocument();
    expect(screen.getByText('Phantom Wallet')).toBeInTheDocument();
  });
  
  it('redirects after connection when redirectOnConnect is true', () => {
    // Mock router
    const mockRouter = mockNextNavigation.setupRouter();
    
    // Simulate connected wallet
    jest.mocked(dappKit.useWallets).mockReturnValue({
      currentWallet: {
        name: 'Test Wallet',
        icon: 'test-icon.png',
      } as any,
      wallets: [],
      select: jest.fn(),
    });
    
    render(<ConnectWallet redirectOnConnect={true} redirectPath="/test-redirect" />);
    
    // Should redirect to the specified path
    expect(mockRouter.push).toHaveBeenCalledWith('/test-redirect');
  });
  
  it('allows custom title and description', () => {
    const customTitle = 'Custom Wallet Title';
    const customDescription = 'Custom wallet description text';
    
    render(<ConnectWallet title={customTitle} description={customDescription} />);
    
    expect(screen.getByText(customTitle)).toBeInTheDocument();
    expect(screen.getByText(customDescription)).toBeInTheDocument();
  });
});