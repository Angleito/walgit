'use client';

import { ConnectButton, useWallets, useCurrentAccount, useConnectWallet } from '@mysten/dapp-kit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Wallet } from 'lucide-react';
import Image from 'next/image';

interface ConnectWalletProps {
  className?: string;
  redirectOnConnect?: boolean; // Redirect to profile page after connecting
  redirectPath?: string; // Custom redirect path
  title?: string; // Custom title
  description?: string; // Custom description
}

export function ConnectWallet({ 
  className, 
  redirectOnConnect = false,
  redirectPath = '/profile',
  title = 'Wallet Authentication',
  description = 'Connect your Sui wallet to interact with WalGit. We support Slush (formerly Sui Wallet) and Phantom wallets.'
}: ConnectWalletProps) {
  const wallets = useWallets();
  const currentAccount = useCurrentAccount();
  const { mutate: connectWallet, isLoading } = useConnectWallet();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);
  
  // Redirect to profile page if connected and redirectOnConnect is true
  useEffect(() => {
    if (currentAccount && redirectOnConnect && !hasRedirected) {
      setHasRedirected(true);
      router.push(redirectPath);
    }
  }, [currentAccount, redirectOnConnect, router, redirectPath, hasRedirected]);
  
  const handleConnect = () => {
    console.log('Available wallets:', wallets);
    if (wallets.length > 0) {
      console.log('Connecting to first available wallet:', wallets[0].name);
      connectWallet(
        { wallet: wallets[0] },
        {
          onSuccess: () => console.log('Wallet connected successfully'),
          onError: (error) => console.error('Wallet connection failed:', error)
        }
      );
    } else {
      console.warn('No wallets detected. Make sure you have a Sui wallet installed.');
    }
  };

  // If already connected, show connected state
  if (currentAccount) {
    return (
      <Card className={cn("w-full max-w-lg", className)}>
        <CardHeader>
          <CardTitle>Wallet Connected</CardTitle>
          <CardDescription>Your wallet is connected to WalGit</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Wallet className="h-5 w-5 mr-2 text-green-500" />
              <span className="font-medium text-sm">
                {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
              </span>
            </div>
            <ConnectButton />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show connection UI
  return (
    <Card className={cn("w-full max-w-lg", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ConnectButton className="w-full" />
          
          <div className="text-center">
            <Button 
              onClick={handleConnect}
              disabled={isLoading || wallets.length === 0}
              className="w-full"
              variant="outline"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : wallets.length === 0 ? (
                "No Wallets Detected"
              ) : (
                `Connect to ${wallets[0]?.name || 'Wallet'}`
              )}
            </Button>
          </div>
          
          {wallets.length === 0 && (
            <div className="pt-2 text-xs text-muted-foreground">
              <p className="mb-2">
                No Sui wallets detected. Install one of these:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <a 
                    href="https://chrome.google.com/webstore/detail/slush-wallet/cianicohgbibphpnbbcnlnapmddkokjk" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Slush Wallet (Recommended)
                  </a>
                </li>
                <li>
                  <a 
                    href="https://phantom.app/download" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Phantom Wallet
                  </a>
                </li>
                <li>
                  <a 
                    href="https://suiwallet.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Sui Wallet
                  </a>
                </li>
              </ul>
            </div>
          )}
          
          {wallets.length > 0 && (
            <div className="pt-2 text-xs text-muted-foreground">
              <p>Detected wallets: {wallets.map(w => w.name).join(', ')}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Export a simple connection status component
export function WalletStatus() {
  const currentAccount = useCurrentAccount();
  
  if (!currentAccount) {
    return null;
  }
  
  return (
    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
      <span>Wallet connected</span>
    </div>
  );
}