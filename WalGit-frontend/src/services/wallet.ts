import { SuiClient, SuiTransactionBlockResponse } from '@mysten/sui.js/client';
import { Transaction } from '@mysten/sui/transactions';
import type { ConnectedWallet } from '@mysten/dapp-kit';

// Interface for the repository creation parameters
export interface CreateRepositoryParams {
  name: string;
  description: string;
  defaultBranch: string;
  addReadme?: boolean;
  addGitignore?: boolean;
  addLicense?: boolean | string;
  template?: string;
  isPublic?: boolean;
}

/**
 * Gets the package ID from environment variables with fallbacks
 * Uses consistent approach between Next.js and Vite environments
 */
function getPackageId(): string {
  const packageId = 
    typeof window !== 'undefined' && (window as any).__ENV?.WALGIT_PACKAGE_ID ||
    process.env.NEXT_PUBLIC_WALGIT_PACKAGE_ID;
  
  if (!packageId) {
    throw new Error('WALGIT_PACKAGE_ID environment variable is not set');
  }
  
  return packageId;
}

// Service for wallet-based interactions with Sui blockchain
export const walletService = {
  // Create a new repository
  async createRepository(
    client: SuiClient,
    wallet: ConnectedWallet,
    params: CreateRepositoryParams
  ): Promise<SuiTransactionBlockResponse> {
    try {
      // Create a transaction
      const tx = new Transaction();
      
      // Get package ID from environment variables
      const PACKAGE_ID = getPackageId();
      
      // Get the storage quota object for the user
      const { data: quotaObjects } = await client.getOwnedObjects({
        owner: wallet.account?.address ?? '',
        filter: { 
          StructType: `${PACKAGE_ID}::storage::StorageQuota` 
        },
      });
      
      if (!quotaObjects || quotaObjects.length === 0) {
        throw new Error('No storage quota found. Please create one first.');
      }
      
      const storageQuotaObjectId = quotaObjects[0].data?.objectId;
      
      if (!storageQuotaObjectId) {
        throw new Error('Invalid storage quota object found.');
      }
      
      // Create transaction for repository creation
      const createRepoTx = tx.moveCall({
        target: `${PACKAGE_ID}::walgit::create_repository`,
        arguments: [
          tx.pure(params.name),
          tx.pure(params.description),
          tx.pure(params.defaultBranch || 'main'),
          tx.object(storageQuotaObjectId),
          tx.pure(params.isPublic !== undefined ? params.isPublic : true),
        ],
      });

      // Add template and initialization parameters
      if (params.template || params.addReadme || params.addGitignore || params.addLicense) {
        tx.moveCall({
          target: `${PACKAGE_ID}::walgit::configure_repository`,
          arguments: [
            createRepoTx,
            tx.pure(params.template || ''),
            tx.pure(params.addReadme || false),
            tx.pure(params.addGitignore || false),
            tx.pure(typeof params.addLicense === 'string' ? params.addLicense : ''),
          ],
        });
      }
      
      // Sign and execute the transaction
      const result = await wallet.signAndExecuteTransaction({
        transaction: tx,
      });
      
      return result;
    } catch (error) {
      console.error('Error creating repository:', error);
      throw error;
    }
  },
  
  // Method to check if a user has a storage quota
  async hasStorageQuota(client: SuiClient, address: string): Promise<boolean> {
    try {
      const PACKAGE_ID = getPackageId();
      
      const objects = await client.getOwnedObjects({
        owner: address,
        filter: { 
          StructType: `${PACKAGE_ID}::storage::StorageQuota` 
        },
      });
      
      return objects.data?.length > 0 || false;
    } catch (error) {
      console.error('Error checking storage quota:', error);
      return false;
    }
  },
  
  // Method to create a storage quota
  async createStorageQuota(wallet: ConnectedWallet): Promise<SuiTransactionBlockResponse> {
    try {
      // Create a transaction
      const tx = new Transaction();
      
      // Call the function to create a storage quota
      const PACKAGE_ID = getPackageId();
      
      tx.moveCall({
        target: `${PACKAGE_ID}::storage::create_storage_quota`,
      });
      
      // Sign and execute the transaction
      const result = await wallet.signAndExecuteTransaction({
        transaction: tx,
      });
      
      return result;
    } catch (error) {
      console.error('Error creating storage quota:', error);
      throw error;
    }
  },
  
  // Method to purchase storage
  async purchaseStorage(
    client: SuiClient,
    wallet: ConnectedWallet, 
    amount: number
  ): Promise<SuiTransactionBlockResponse> {
    try {
      // Create a transaction
      const tx = new Transaction();

      // Call the function to purchase storage
      const PACKAGE_ID = getPackageId();

      // Get client - use the passed client parameter
      if (!client) {
        throw new Error('SuiClient is required for storage purchase');
      }
      
      // Query for storage quota object
      const { data: quotaObjects } = await client.getOwnedObjects({
        owner: wallet.account?.address ?? '',
        filter: {
          StructType: `${PACKAGE_ID}::storage::StorageQuota`
        },
      });

      if (!quotaObjects || quotaObjects.length === 0) {
        throw new Error('No storage quota found. Please create one first.');
      }

      const storageQuotaObjectId = quotaObjects[0].data?.objectId;
      
      if (!storageQuotaObjectId) {
        throw new Error('Invalid storage quota object found.');
      }

      // Create a coin for payment
      const [coin] = tx.splitCoins(tx.gas, [tx.pure(amount * 1000000)]);

      tx.moveCall({
        target: `${PACKAGE_ID}::storage::purchase_storage`,
        arguments: [
          tx.object(storageQuotaObjectId),
          coin,
          tx.pure(amount * 1024 * 1024), // Convert to bytes
        ],
      });

      // Sign and execute the transaction
      const result = await wallet.signAndExecuteTransaction({
        transaction: tx,
      });

      return result;
    } catch (error) {
      console.error('Error purchasing storage:', error);
      throw error;
    }
  }
};