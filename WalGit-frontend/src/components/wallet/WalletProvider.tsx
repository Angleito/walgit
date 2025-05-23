'use client';

import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui.js/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mysten/dapp-kit/dist/index.css';

// Configure Sui networks
const { networkConfig } = createNetworkConfig({
  localnet: { url: getFullnodeUrl('localnet') },
  devnet: { url: getFullnodeUrl('devnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
});

const queryClient = new QueryClient();

interface WalGitWalletProviderProps {
  children: React.ReactNode;
  network?: 'localnet' | 'devnet' | 'testnet' | 'mainnet';
}

export function WalGitWalletProvider({ 
  children, 
  network = (process.env.NEXT_PUBLIC_NETWORK as any) || 'testnet' 
}: WalGitWalletProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork={network}>
        <WalletProvider 
          autoConnect={true}
          stashedWallet={{
            name: 'WalGit Wallet'
          }}
        >
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}