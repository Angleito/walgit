'use client';

import { ConnectButton, useWallets, useCurrentAccount } from '@mysten/dapp-kit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
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
  const { currentWallet } = useWallets();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);
  
  // Redirect to profile page if connected and redirectOnConnect is true
  useEffect(() => {
    if (currentWallet && redirectOnConnect && !hasRedirected) {
      setHasRedirected(true);
      router.push(redirectPath);
    }
  }, [currentWallet, redirectOnConnect, router, redirectPath, hasRedirected]);
  
  // Render the connect button directly without wrapping in a function
  return (
    <Card className={cn("w-full max-w-lg", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ConnectButton className="w-full">
          {({ connected, connecting, connect, disconnect, wallet }) => {
          if (connected && wallet) {
            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {wallet.icon ? (
                      <Image 
                        src={wallet.icon} 
                        alt={`${wallet.name} icon`} 
                        width={24}
                        height={24}
                        className="h-6 w-6 mr-2"
                      />
                    ) : (
                      <div className="h-6 w-6 mr-2 bg-primary/10 rounded-full" />
                    )}
                    <span className="font-medium">{wallet.name}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={disconnect}
                    className="border-destructive text-destructive hover:bg-destructive/10"
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            );
          }
          
            return (
              <Button 
                onClick={connect} 
                disabled={connecting}
                className="w-full"
                variant="cyberpunk" // Use cyberpunk variant if available, falls back to default
              >
                {connecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect Wallet"
                )}
              </Button>
            );
          }}
        </ConnectButton>
          
          {!currentWallet && (
            <div className="pt-2 text-xs text-muted-foreground">
              <p>
                Don&apos;t have a Sui wallet? Install one of these:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  <a 
                    href="https://chrome.google.com/webstore/detail/slush-wallet/cianicohgbibphpnbbcnlnapmddkokjk" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Slush Wallet
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
              </ul>
            </div>
          )}
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