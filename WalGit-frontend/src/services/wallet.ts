import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';

// Interface for the repository creation parameters
export interface CreateRepositoryParams {
  name: string;
  description: string;
  defaultBranch: string;
}

// Service for wallet-based interactions with Sui blockchain
export const walletService = {
  // Create a new repository
  async createRepository(
    client: SuiClient,
    wallet: any,
    params: CreateRepositoryParams
  ) {
    try {
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Call the walgit::walgit::create_repository function
      // Get package ID from environment variables
      const PACKAGE_ID = import.meta.env.VITE_WALGIT_PACKAGE_ID;
      
      // Get the storage quota object for the user (this would be different based on your implementation)
      // This is a simplification - you might need to query for the user's storage quota object first
      const { data: quotaObjects } = await client.getOwnedObjects({
        owner: wallet.account?.address,
        filter: { 
          StructType: `${PACKAGE_ID}::storage::StorageQuota` 
        },
      });
      
      if (!quotaObjects || quotaObjects.length === 0) {
        throw new Error('No storage quota found. Please create one first.');
      }
      
      const storageQuotaObjectId = quotaObjects[0].data?.objectId;
      
      tx.moveCall({
        target: `${PACKAGE_ID}::walgit::create_repository`,
        arguments: [
          tx.pure.string(params.name),
          tx.pure.string(params.description),
          tx.pure.string(params.defaultBranch || 'main'),
          tx.object(storageQuotaObjectId),
        ],
      });
      
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
  async hasStorageQuota(client: SuiClient, address: string) {
    try {
      const PACKAGE_ID = import.meta.env.VITE_WALGIT_PACKAGE_ID;
      
      const objects = await client.getOwnedObjects({
        owner: address,
        filter: { 
          StructType: `${PACKAGE_ID}::storage::StorageQuota` 
        },
      });
      
      return objects.data.length > 0;
    } catch (error) {
      console.error('Error checking storage quota:', error);
      return false;
    }
  },
  
  // Method to create a storage quota
  async createStorageQuota(wallet: any) {
    try {
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Call the function to create a storage quota
      const PACKAGE_ID = import.meta.env.VITE_WALGIT_PACKAGE_ID;
      
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
  async purchaseStorage(wallet: any, amount: number) {
    try {
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Call the function to purchase storage
      const PACKAGE_ID = import.meta.env.VITE_WALGIT_PACKAGE_ID;
      
      // Query for storage quota object
      const { data: quotaObjects } = await client.getOwnedObjects({
        owner: wallet.account?.address,
        filter: { 
          StructType: `${PACKAGE_ID}::storage::StorageQuota` 
        },
      });
      
      if (!quotaObjects || quotaObjects.length === 0) {
        throw new Error('No storage quota found. Please create one first.');
      }
      
      const storageQuotaObjectId = quotaObjects[0].data?.objectId;
      
      // Create a coin for payment (simplified - in a real implementation, you'd use a coin from the wallet)
      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount * 1000000)]);
      
      tx.moveCall({
        target: `${PACKAGE_ID}::storage::purchase_storage`,
        arguments: [
          tx.object(storageQuotaObjectId),
          coin,
          tx.pure.u64(amount * 1024 * 1024), // Convert to bytes
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