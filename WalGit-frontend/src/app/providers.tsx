'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  SuiClientProvider,
  WalletProvider,
  createNetworkConfig
} from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui.js/client';
import '@mysten/dapp-kit/dist/index.css';
import { ReactNode, useState } from 'react';
import { ThemeProvider } from '@/components/ui/theme-switcher';
import { NotificationProvider } from '@/components/ui/notification-system';
import { TourProvider } from '@/components/ui/tour-provider';
import { DebugWrapper } from '@/components/debug-wrapper';

// Configure networks for Sui client
// Use try-catch to handle potential errors with network configuration
let networks: any;
let defaultNetwork: any;

try {
  // Create network config with fallbacks for each URL
  const { networkConfig } = createNetworkConfig({
    // Testnet
    testnet: { url: getFullnodeUrl('testnet') || 'https://fullnode.testnet.sui.io' },
    // Mainnet
    mainnet: { url: getFullnodeUrl('mainnet') || 'https://fullnode.mainnet.sui.io' },
    // Devnet
    devnet: { url: getFullnodeUrl('devnet') || 'https://fullnode.devnet.sui.io' },
    // Local network for development
    localnet: { url: 'http://localhost:9000' },
  });

  networks = networkConfig;
  defaultNetwork = 'devnet';
} catch (error) {
  console.error('Error initializing Sui network config:', error);
  // Provide fallback network configuration
  networks = {
    devnet: { url: 'https://fullnode.devnet.sui.io' }
  };
  defaultNetwork = 'devnet';
}

export function Providers({ children }: { children: ReactNode }) {
  // Create a QueryClient instance for each request
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <DebugWrapper componentName="QueryClientProvider">
      <QueryClientProvider client={queryClient}>
        {networks ? (
          <DebugWrapper componentName="SuiClientProvider">
            <SuiClientProvider networks={networks} defaultNetwork={defaultNetwork}>
              <DebugWrapper componentName="WalletProvider">
                <WalletProvider>
                  <DebugWrapper componentName="ThemeProvider">
                    <ThemeProvider defaultTheme="dark" defaultAccent="blue">
                      <DebugWrapper componentName="NotificationProvider">
                        <NotificationProvider>
                          <DebugWrapper componentName="TourProvider">
                            <TourProvider>
                              <DebugWrapper componentName="ProvidersChildren">
                                {children}
                              </DebugWrapper>
                            </TourProvider>
                          </DebugWrapper>
                        </NotificationProvider>
                      </DebugWrapper>
                    </ThemeProvider>
                  </DebugWrapper>
                </WalletProvider>
              </DebugWrapper>
            </SuiClientProvider>
          </DebugWrapper>
        ) : (
        // Fallback UI when SUI network configuration fails
        <DebugWrapper componentName="ThemeProvider-Fallback">
          <ThemeProvider defaultTheme="dark" defaultAccent="blue">
            <DebugWrapper componentName="NotificationProvider-Fallback">
              <NotificationProvider>
                <div className="flex flex-col items-center justify-center min-h-screen bg-cyberpunk-dark text-white p-4">
                  <h1 className="text-2xl font-bold mb-4">Network Configuration Error</h1>
                  <p className="mb-6">Unable to connect to Sui network. Please try refreshing the page.</p>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Refresh Page
                    </button>
                  </div>
                  <div className="mt-8 opacity-70">
                    <DebugWrapper componentName="FallbackChildren">
                      {children}
                    </DebugWrapper>
                  </div>
                </div>
              </NotificationProvider>
            </DebugWrapper>
          </ThemeProvider>
        </DebugWrapper>
      )}
      </QueryClientProvider>
    </DebugWrapper>
  );
}