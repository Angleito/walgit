'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  SuiClientProvider,
  WalletProvider,
  createNetworkConfig
} from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui.js/client';
import { ReactNode, useState } from 'react';
import { ThemeProvider } from '@/components/ui/theme-switcher';
import { NotificationProvider } from '@/components/ui/notification-system';
import { TourProvider } from '@/components/ui/tour-provider';

// Configure networks for Sui client
let networks: any;
let defaultNetwork: any;

try {
  const { networkConfig } = createNetworkConfig({
    testnet: { url: getFullnodeUrl('testnet') || 'https://fullnode.testnet.sui.io' },
    mainnet: { url: getFullnodeUrl('mainnet') || 'https://fullnode.mainnet.sui.io' },
    devnet: { url: getFullnodeUrl('devnet') || 'https://fullnode.devnet.sui.io' },
    localnet: { url: 'http://localhost:9000' },
  });

  networks = networkConfig;
  defaultNetwork = 'devnet';
} catch (error) {
  console.error('Error initializing Sui network config:', error);
  networks = {
    devnet: { url: 'https://fullnode.devnet.sui.io' }
  };
  defaultNetwork = 'devnet';
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {networks ? (
        <SuiClientProvider networks={networks} defaultNetwork={defaultNetwork}>
          <WalletProvider>
            <ThemeProvider defaultTheme="dark" defaultAccent="blue">
              <NotificationProvider>
                <TourProvider>
                  {children}
                </TourProvider>
              </NotificationProvider>
            </ThemeProvider>
          </WalletProvider>
        </SuiClientProvider>
      ) : (
        <ThemeProvider defaultTheme="dark" defaultAccent="blue">
          <NotificationProvider>
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d1117] text-white p-4">
              <h1 className="text-2xl font-bold mb-4">Network Configuration Error</h1>
              <p className="mb-6">Unable to connect to Sui network. Please try refreshing the page.</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Refresh Page
              </button>
            </div>
          </NotificationProvider>
        </ThemeProvider>
      )}
    </QueryClientProvider>
  );
}