import { useState } from 'react';
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
// Removed WalletSelector import as ConnectButton handles selection

export const WalletConnect = () => {
  // Removed useWallets and showWalletSelector state
  const currentWallet = useCurrentWallet();
  const [copied, setCopied] = useState(false);
  // Removed handleConnect function

  const handleCopyAddress = () => {
    // Access address via currentWallet.accounts[0].address when connected
    if (currentWallet.isConnected && currentWallet.currentWallet?.accounts[0]?.address) {
      navigator.clipboard.writeText(currentWallet.currentWallet.accounts[0].address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Check connection status and presence of accounts/address
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
            {/* Use the derived address variable */}
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
            // Use the connect method with just the silent option (remove accounts property)
            onClick={() => currentWallet.currentWallet?.features['standard:connect']?.connect({ silent: true })}
            className="cursor-pointer text-white hover:bg-white/10"
          >
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Use the ConnectButton component for the disconnected state
  return (
    <ConnectButton connectText="Connect Wallet" className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600" />
    // Removed WalletSelector component instance
  );
};

export default WalletConnect;