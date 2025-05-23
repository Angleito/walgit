declare module '@mysten/dapp-kit' {
  import { SuiClient } from '@mysten/sui.js/client';
  import { SuiTransactionBlockResponse } from '@mysten/sui.js/client';
  import { TransactionBlock } from '@mysten/sui.js/transactions';
  import { WalletAccount } from '@wallet-standard/core';
  import { ReactNode } from 'react';

  // Client and provider types
  export function createNetworkConfig(config: Record<string, { url: string }>): {
    networks: Record<string, { url: string }>;
    defaultNetwork: string;
  };

  export interface SuiClientProviderProps {
    networks: Record<string, { url: string }>;
    defaultNetwork: string;
    children: ReactNode;
  }

  export function SuiClientProvider(props: SuiClientProviderProps): JSX.Element;

  export interface WalletProviderProps {
    autoConnect?: boolean;
    children: ReactNode;
  }

  export function WalletProvider(props: WalletProviderProps): JSX.Element;

  // Hook types
  export function useSuiClient(): SuiClient;

  export interface ConnectedWallet {
    name: string;
    icon?: string;
    version?: string;
    chains?: string[];
    accounts?: WalletAccount[];
    features?: Record<string, unknown>;
    signAndExecuteTransaction: (params: {
      transaction: TransactionBlock;
    }) => Promise<SuiTransactionBlockResponse>;
    client?: SuiClient;
    account?: WalletAccount;
  }

  export function useCurrentWallet(): {
    wallet: ConnectedWallet | null;
    connecting: boolean;
    disconnecting: boolean;
    toggle: () => void;
  } | null;

  export function useCurrentAccount(): WalletAccount | null;

  export function useWallets(): {
    wallets: ConnectedWallet[];
    currentWallet: ConnectedWallet | null;
    select: (wallet: ConnectedWallet) => void;
  };

  // Component types
  export interface ConnectButtonProps {
    className?: string;
    children?: (props: {
      connected: boolean;
      connecting: boolean;
      connect: () => void;
      disconnect: () => void;
      wallet: ConnectedWallet | null;
    }) => ReactNode;
  }

  export function ConnectButton(props: ConnectButtonProps): JSX.Element;
}