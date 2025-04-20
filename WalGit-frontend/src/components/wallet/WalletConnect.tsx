import { useState, useEffect } from 'react';
import { useCurrentWallet, ConnectButton } from '@mysten/dapp-kit';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { truncateMiddle } from '@/lib/utils';

export const WalletConnect = () => {
  const currentWallet = useCurrentWallet();
  const [copied, setCopied] = useState(false);

  // Add error handling for storage access
  useEffect(() => {
    const handleStorageError = (e: ErrorEvent) => {
      if (e.message.includes('Access to storage is not allowed')) {
        console.warn('Storage access is restricted. Some wallet features may not work properly.');
        // Prevent the error from bubbling up
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('error', handleStorageError);
    return () => window.removeEventListener('error', handleStorageError);
  }, []);

  const handleCopyAddress = () => {
    if (currentWallet.isConnected && currentWallet.currentWallet?.accounts[0]?.address) {
      try {
        navigator.clipboard.writeText(currentWallet.currentWallet.accounts[0].address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  // Check connection status and presence of accounts/address with additional error handling
  try {
    if (currentWallet.isConnected && currentWallet.currentWallet?.accounts[0]?.address) {
      const address = currentWallet.currentWallet.accounts[0].address;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="border-white/20 hover:border-white/40 flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              {truncateMiddle(address, 4, 4)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-zinc-900 border border-white/20">
            <DropdownMenuLabel className="text-white">Wallet</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/20" />
            <DropdownMenuItem 
              onClick={handleCopyAddress} 
              className="cursor-pointer text-white hover:bg-white/10 flex justify-between items-center"
            >
              Copy Address
              {copied && <span className="text-green-400 text-xs">Copied!</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => currentWallet.currentWallet?.features['standard:connect']?.connect({ silent: true })}
              className="cursor-pointer text-white hover:bg-white/10"
            >
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  } catch (error) {
    console.error('Error accessing wallet information:', error);
  }

  // Use the ConnectButton component for the disconnected state
  return (
    <ConnectButton connectText="Connect Wallet" className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600" />
  );
};

export default WalletConnect;