import { useState } from 'react';
import { useWallets } from '@mysten/dapp-kit';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WalletSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletSelector = ({ isOpen, onClose }: WalletSelectorProps) => {
  const wallets = useWallets();

  const handleSelectWallet = async (wallet: any) => {
    try {
      // Use the standard connect feature instead of calling connect directly
      await wallet.features['standard:connect']?.connect({ silent: false });
      onClose();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Connect your wallet</DialogTitle>
          <DialogDescription className="text-gray-400">
            Select a wallet to connect to WalGit
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {wallets.length > 0 ? (
            wallets.map((wallet) => (
              <Button
                key={wallet.name}
                variant="outline"
                className="w-full justify-start text-white border-white/20 hover:border-white/40 hover:bg-white/10"
                onClick={() => handleSelectWallet(wallet)}
              >
                <div className="flex items-center gap-3">
                  {wallet.icon && (
                    <img 
                      src={wallet.icon} 
                      alt={`${wallet.name} logo`} 
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span>{wallet.name}</span>
                </div>
              </Button>
            ))
          ) : (
            <div className="text-center py-6">
              <p className="mb-4 text-gray-400">No Sui wallets detected</p>
              <div className="flex flex-col gap-2">
                <a 
                  href="https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Install Sui Wallet
                </a>
                <a 
                  href="https://chrome.google.com/webstore/detail/ethos-sui-wallet/mcbigmjiafegjnnogedioegffbooigli"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Install Ethos Wallet
                </a>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletSelector;