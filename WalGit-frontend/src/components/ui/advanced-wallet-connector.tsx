/**
 * @fileoverview Advanced wallet connector with comprehensive error handling and animations
 * Supports multiple wallet types with detailed status feedback and recovery options
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  Smartphone, 
  Globe, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  RefreshCw,
  HelpCircle,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface WalletOption {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  type: 'browser' | 'mobile' | 'hardware' | 'web';
  isInstalled?: boolean;
  isRecommended?: boolean;
  downloadUrl?: string;
  features: string[];
  securityLevel: 'high' | 'medium' | 'low';
}

interface ConnectionState {
  status: 'idle' | 'connecting' | 'connected' | 'error' | 'installing';
  progress: number;
  error?: string;
  address?: string;
  network?: string;
  balance?: string;
}

interface AdvancedWalletConnectorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (walletId: string, address: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

const walletOptions: WalletOption[] = [
  {
    id: 'sui-wallet',
    name: 'Sui Wallet',
    description: 'Official Sui browser extension wallet',
    icon: Wallet,
    type: 'browser',
    isRecommended: true,
    downloadUrl: 'https://chrome.google.com/webstore/detail/sui-wallet',
    features: ['Browser Extension', 'Multi-Account', 'NFT Support'],
    securityLevel: 'high'
  },
  {
    id: 'ethos-wallet',
    name: 'Ethos Wallet',
    description: 'Multi-platform wallet for Sui ecosystem',
    icon: Zap,
    type: 'browser',
    downloadUrl: 'https://ethoswallet.xyz',
    features: ['Cross-Platform', 'DeFi Integration', 'Staking'],
    securityLevel: 'high'
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    description: 'Connect mobile wallets via QR code',
    icon: Smartphone,
    type: 'mobile',
    features: ['Mobile Support', 'QR Code', 'Multiple Wallets'],
    securityLevel: 'medium'
  },
  {
    id: 'web-wallet',
    name: 'Web Wallet',
    description: 'Browser-based wallet for quick access',
    icon: Globe,
    type: 'web',
    features: ['No Install', 'Quick Setup', 'Demo Friendly'],
    securityLevel: 'medium'
  }
];

export function AdvancedWalletConnector({
  isOpen,
  onOpenChange,
  onConnect,
  onError,
  className
}: AdvancedWalletConnectorProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'idle',
    progress: 0
  });
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Simulate wallet detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      walletOptions.forEach(wallet => {
        if (wallet.type === 'browser') {
          // Check if wallet is installed (simplified check)
          wallet.isInstalled = !!(window as any)[wallet.id.replace('-', '')];
        }
      });
    }
  }, []);

  const connectWallet = useCallback(async (walletId: string) => {
    setSelectedWallet(walletId);
    setConnectionState({ status: 'connecting', progress: 0 });

    try {
      // Simulate connection process with progress updates
      const steps = [
        { progress: 25, message: 'Detecting wallet...' },
        { progress: 50, message: 'Requesting connection...' },
        { progress: 75, message: 'Verifying network...' },
        { progress: 100, message: 'Connected successfully!' }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setConnectionState(prev => ({ 
          ...prev, 
          progress: step.progress,
          error: undefined
        }));
      }

      // Simulate successful connection
      const mockAddress = '0x' + Math.random().toString(16).substr(2, 40);
      setConnectionState({
        status: 'connected',
        progress: 100,
        address: mockAddress,
        network: 'devnet',
        balance: '10.5 SUI'
      });

      onConnect(walletId, mockAddress);
      
      // Close dialog after short delay
      setTimeout(() => {
        onOpenChange(false);
        setConnectionState({ status: 'idle', progress: 0 });
        setSelectedWallet(null);
      }, 2000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setConnectionState({
        status: 'error',
        progress: 0,
        error: errorMessage
      });
      onError?.(errorMessage);
    }
  }, [onConnect, onError, onOpenChange]);

  const installWallet = useCallback((wallet: WalletOption) => {
    setConnectionState({ status: 'installing', progress: 0 });
    if (wallet.downloadUrl) {
      window.open(wallet.downloadUrl, '_blank');
    }
    // Reset after short delay
    setTimeout(() => {
      setConnectionState({ status: 'idle', progress: 0 });
    }, 3000);
  }, []);

  const retryConnection = useCallback(() => {
    if (selectedWallet) {
      connectWallet(selectedWallet);
    }
  }, [selectedWallet, connectWallet]);

  const getSecurityBadgeColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className={cn(
          'max-w-2xl bg-gray-900 border-gray-700 text-gray-100',
          className
        )}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Connect Your Wallet
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Choose your preferred wallet to access WalGit&apos;s decentralized features
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Connection Progress */}
            <AnimatePresence>
              {connectionState.status !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {connectionState.status === 'connecting' && 'Connecting...'}
                      {connectionState.status === 'connected' && 'Connected!'}
                      {connectionState.status === 'error' && 'Connection Failed'}
                      {connectionState.status === 'installing' && 'Opening Install Page...'}
                    </span>
                    {connectionState.status === 'connecting' && (
                      <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                    )}
                    {connectionState.status === 'connected' && (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    )}
                    {connectionState.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>

                  <Progress value={connectionState.progress} className="h-2" />

                  {connectionState.status === 'connected' && connectionState.address && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="text-sm space-y-1">
                        <div>Address: <code className="text-green-400">{connectionState.address}</code></div>
                        <div>Network: <code className="text-green-400">{connectionState.network}</code></div>
                        <div>Balance: <code className="text-green-400">{connectionState.balance}</code></div>
                      </div>
                    </div>
                  )}

                  {connectionState.status === 'error' && connectionState.error && (
                    <Alert className="border-red-500/20 bg-red-500/10">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-400">
                        {connectionState.error}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="ml-2 h-6 border-red-500/30 text-red-400 hover:bg-red-500/10"
                          onClick={retryConnection}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Retry
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Wallet Options */}
            {connectionState.status === 'idle' && (
              <div className="grid gap-4">
                {walletOptions.map((wallet) => (
                  <motion.div
                    key={wallet.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card className="bg-gray-800/50 border-gray-700 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer group">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                              <wallet.icon className="h-6 w-6 text-cyan-400" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-100">
                                  {wallet.name}
                                </h3>
                                {wallet.isRecommended && (
                                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                                    Recommended
                                  </Badge>
                                )}
                                <Badge className={getSecurityBadgeColor(wallet.securityLevel)}>
                                  {wallet.securityLevel} security
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-gray-400 mb-2">
                                {wallet.description}
                              </p>
                              
                              <div className="flex flex-wrap gap-1">
                                {wallet.features.map((feature) => (
                                  <Badge 
                                    key={feature} 
                                    variant="outline" 
                                    className="text-xs text-gray-500 border-gray-600"
                                  >
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {wallet.isInstalled ? (
                              <Button
                                onClick={() => connectWallet(wallet.id)}
                                className="bg-cyan-600 hover:bg-cyan-700 text-white"
                                disabled={connectionState.status !== 'idle'}
                              >
                                Connect
                              </Button>
                            ) : (
                              <Button
                                onClick={() => installWallet(wallet)}
                                variant="outline"
                                className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Install
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            <Separator className="bg-gray-700" />

            {/* Help Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Need help choosing a wallet?</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHelp(!showHelp)}
                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                >
                  <HelpCircle className="h-4 w-4 mr-1" />
                  Learn More
                </Button>
              </div>

              <AnimatePresence>
                {showHelp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <Alert className="bg-blue-500/10 border-blue-500/20">
                      <Shield className="h-4 w-4 text-blue-400" />
                      <AlertDescription className="text-blue-300 space-y-2">
                        <p className="font-medium">Your wallet will be used to:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Sign transactions for repository operations</li>
                          <li>Manage storage quota and payments</li>
                          <li>Access encrypted repositories with SEAL</li>
                          <li>Authenticate your identity on the network</li>
                        </ul>
                        <p className="text-xs mt-2">
                          WalGit never stores your private keys and all transactions require your approval.
                        </p>
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}