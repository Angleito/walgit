import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import '@mysten/dapp-kit/dist/index.css'
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'
import { getFullnodeUrl } from '@mysten/sui.js/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a helper for handling GitHub Pages path issues
const getBasename = () => {
  // When deployed to GitHub Pages, the app is served from /walgit/
  // In development, it's served from the root
  return process.env.NODE_ENV === 'production' ? '/walgit' : '/'
}

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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork={defaultNetwork}>
        <WalletProvider>
          <BrowserRouter basename={getBasename()}>
            <App />
          </BrowserRouter>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
