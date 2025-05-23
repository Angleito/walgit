import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import '@mysten/dapp-kit/dist/index.css'
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'
import { getFullnodeUrl } from '@mysten/sui.js/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { createMockRouter } from './test/test-utils'

// Create a QueryClient instance
const queryClient = new QueryClient()

// Define network options
const networks = {
  devnet: { url: getFullnodeUrl('devnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
}

// Set the default network from environment variables or use devnet as fallback
const defaultNetwork = import.meta.env.VITE_NETWORK || 'devnet'

// Create a router for the legacy app
const router = createMockRouter()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork={defaultNetwork}>
        <WalletProvider>
          <AppRouterContext.Provider value={router as any}>
            <NextIntlClientProvider locale="en">
              <App />
            </NextIntlClientProvider>
          </AppRouterContext.Provider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
