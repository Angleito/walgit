/**
 * @fileoverview Enhanced SEAL encryption hook with wallet signing integration
 * Provides comprehensive UX for SEAL operations from the frontend
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useWallet, useSignPersonalMessage } from '@mysten/dapp-kit';
import { toast } from 'sonner';
import { SealClient } from '@/lib/seal-client';
import { WalrusClient } from '@/lib/walrus-client';

export interface SealPolicy {
  id: string;
  name: string;
  threshold: number;
  shares: number;
  shareholders: string[];
  createdAt: number;
  isActive: boolean;
}

export interface EncryptionOptions {
  policyId: string;
  contentType?: string;
  metadata?: Record<string, any>;
}

export interface DecryptionRequest {
  encryptedContentId: string;
  policyId: string;
  requesterAddress: string;
  timestamp: number;
  signature: string;
}

export interface SealOperationProgress {
  stage: 'preparing' | 'encrypting' | 'uploading' | 'signing' | 'complete';
  progress: number;
  message: string;
  details?: any;
}

/**
 * Custom hook for SEAL encryption operations with wallet integration
 */
export function useSealEncryption() {
  const { currentAccount, signPersonalMessage } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<SealOperationProgress | null>(null);
  const [policies, setPolicies] = useState<SealPolicy[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const sealClientRef = useRef<SealClient | null>(null);
  const walrusClientRef = useRef<WalrusClient | null>(null);
  const operationAbortController = useRef<AbortController | null>(null);

  // Initialize clients
  useEffect(() => {
    if (currentAccount) {
      sealClientRef.current = new SealClient({
        walletAddress: currentAccount.address,
        network: process.env.NEXT_PUBLIC_NETWORK || 'devnet'
      });
      
      walrusClientRef.current = new WalrusClient({
        apiKey: process.env.NEXT_PUBLIC_WALRUS_API_KEY,
        endpoint: process.env.NEXT_PUBLIC_WALRUS_API_ENDPOINT
      });
    }
  }, [currentAccount]);

  /**
   * Update operation progress with user feedback
   */
  const updateProgress = useCallback((stage: SealOperationProgress['stage'], progress: number, message: string, details?: any) => {
    setProgress({ stage, progress, message, details });
    
    // Show toast notifications for major milestones
    if (progress === 100) {
      switch (stage) {
        case 'encrypting':
          toast.success('Content encrypted successfully');
          break;
        case 'uploading':
          toast.success('Encrypted content uploaded to Walrus');
          break;
        case 'signing':
          toast.success('Transaction signed successfully');
          break;
        case 'complete':
          toast.success('Operation completed successfully');
          break;
      }
    }
  }, []);

  /**
   * Create a new SEAL policy with threshold encryption
   */
  const createPolicy = useCallback(async (
    name: string,
    threshold: number,
    shareholders: string[]
  ): Promise<SealPolicy> => {
    if (!currentAccount || !sealClientRef.current) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      updateProgress('preparing', 0, 'Preparing SEAL policy creation...');
      
      // Create signature for policy creation
      const policyData = {
        name,
        threshold,
        shareholders,
        creator: currentAccount.address,
        timestamp: Date.now()
      };
      
      const messageToSign = JSON.stringify(policyData);
      
      updateProgress('signing', 30, 'Please sign the policy creation request...');
      
      const signature = await signPersonalMessage({
        message: new TextEncoder().encode(messageToSign)
      });
      
      updateProgress('preparing', 60, 'Creating SEAL policy...');
      
      const policy = await sealClientRef.current.createPolicy({
        ...policyData,
        signature: Array.from(signature.signature)
      });
      
      updateProgress('complete', 100, 'SEAL policy created successfully');
      
      // Update local policies list
      setPolicies(prev => [...prev, policy]);
      
      return policy;
      
    } catch (error: any) {
      setError(error.message);
      toast.error(`Failed to create SEAL policy: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  }, [currentAccount, signPersonalMessage, updateProgress]);

  /**
   * Encrypt content using SEAL with comprehensive UX
   */
  const encryptContent = useCallback(async (
    content: string | Uint8Array,
    options: EncryptionOptions
  ): Promise<{ encryptedContentId: string; dekId: string }> => {
    if (!currentAccount || !sealClientRef.current || !walrusClientRef.current) {
      throw new Error('Wallet or clients not initialized');
    }

    setIsLoading(true);
    setError(null);
    operationAbortController.current = new AbortController();
    
    try {
      const contentBuffer = typeof content === 'string' 
        ? new TextEncoder().encode(content) 
        : content;
      
      updateProgress('preparing', 0, 'Preparing content for encryption...');
      
      // Generate data encryption key (DEK)
      const dek = await sealClientRef.current.generateDEK();
      
      updateProgress('encrypting', 20, 'Encrypting content with DEK...');
      
      // Encrypt content with DEK using AES-256-GCM
      const encryptedContent = await sealClientRef.current.encryptWithDEK(contentBuffer, dek);
      
      updateProgress('encrypting', 40, 'Encrypting DEK with SEAL policy...');
      
      // Encrypt DEK with SEAL policy
      const encryptedDek = await sealClientRef.current.encryptDEKWithPolicy(dek, options.policyId);
      
      updateProgress('uploading', 60, 'Uploading encrypted content to Walrus...');
      
      // Upload encrypted content to Walrus
      const contentUploadResult = await walrusClientRef.current.uploadBlob(encryptedContent, {
        contentType: 'application/octet-stream',
        metadata: {
          ...options.metadata,
          encrypted: true,
          policyId: options.policyId,
          originalContentType: options.contentType
        }
      });
      
      updateProgress('uploading', 80, 'Uploading encrypted DEK to Walrus...');
      
      // Upload encrypted DEK to Walrus
      const dekUploadResult = await walrusClientRef.current.uploadBlob(encryptedDek, {
        contentType: 'application/octet-stream',
        metadata: {
          type: 'encrypted-dek',
          policyId: options.policyId,
          contentId: contentUploadResult.blobId
        }
      });
      
      updateProgress('complete', 100, 'Content encrypted and uploaded successfully');
      
      return {
        encryptedContentId: contentUploadResult.blobId,
        dekId: dekUploadResult.blobId
      };
      
    } catch (error: any) {
      if (operationAbortController.current?.signal.aborted) {
        setError('Operation cancelled by user');
        toast.info('Encryption operation cancelled');
      } else {
        setError(error.message);
        toast.error(`Encryption failed: ${error.message}`);
      }
      throw error;
    } finally {
      setIsLoading(false);
      setProgress(null);
      operationAbortController.current = null;
    }
  }, [currentAccount, updateProgress]);

  /**
   * Decrypt content with SEAL policy verification
   */
  const decryptContent = useCallback(async (
    encryptedContentId: string,
    dekId: string,
    policyId: string
  ): Promise<Uint8Array> => {
    if (!currentAccount || !sealClientRef.current || !walrusClientRef.current) {
      throw new Error('Wallet or clients not initialized');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      updateProgress('preparing', 0, 'Preparing decryption request...');
      
      // Create decryption request signature
      const decryptionRequest: DecryptionRequest = {
        encryptedContentId,
        policyId,
        requesterAddress: currentAccount.address,
        timestamp: Date.now(),
        signature: ''
      };
      
      const messageToSign = JSON.stringify({
        encryptedContentId,
        policyId,
        requesterAddress: currentAccount.address,
        timestamp: decryptionRequest.timestamp
      });
      
      updateProgress('signing', 20, 'Please sign the decryption request...');
      
      const signature = await signPersonalMessage({
        message: new TextEncoder().encode(messageToSign)
      });
      
      decryptionRequest.signature = Array.from(signature.signature).join(',');
      
      updateProgress('preparing', 40, 'Downloading encrypted DEK...');
      
      // Download encrypted DEK from Walrus
      const encryptedDek = await walrusClientRef.current.downloadBlob(dekId);
      
      updateProgress('encrypting', 60, 'Decrypting DEK with SEAL policy...');
      
      // Decrypt DEK using SEAL policy
      const dek = await sealClientRef.current.decryptDEKWithPolicy(
        encryptedDek,
        policyId,
        decryptionRequest
      );
      
      updateProgress('preparing', 80, 'Downloading encrypted content...');
      
      // Download encrypted content from Walrus
      const encryptedContent = await walrusClientRef.current.downloadBlob(encryptedContentId);
      
      updateProgress('encrypting', 90, 'Decrypting content...');
      
      // Decrypt content with DEK
      const decryptedContent = await sealClientRef.current.decryptWithDEK(encryptedContent, dek);
      
      updateProgress('complete', 100, 'Content decrypted successfully');
      
      return decryptedContent;
      
    } catch (error: any) {
      setError(error.message);
      toast.error(`Decryption failed: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  }, [currentAccount, signPersonalMessage, updateProgress]);

  /**
   * Share access to encrypted content with another user
   */
  const shareAccess = useCallback(async (
    policyId: string,
    recipientAddress: string,
    permissions: string[] = ['read']
  ): Promise<void> => {
    if (!currentAccount || !sealClientRef.current) {
      throw new Error('Wallet or SEAL client not initialized');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      updateProgress('preparing', 0, 'Preparing access sharing...');
      
      const shareRequest = {
        policyId,
        recipientAddress,
        permissions,
        sharedBy: currentAccount.address,
        timestamp: Date.now()
      };
      
      const messageToSign = JSON.stringify(shareRequest);
      
      updateProgress('signing', 30, 'Please sign the access sharing request...');
      
      const signature = await signPersonalMessage({
        message: new TextEncoder().encode(messageToSign)
      });
      
      updateProgress('preparing', 60, 'Updating SEAL policy...');
      
      await sealClientRef.current.shareAccess({
        ...shareRequest,
        signature: Array.from(signature.signature)
      });
      
      updateProgress('complete', 100, 'Access shared successfully');
      
      toast.success(`Access shared with ${recipientAddress.substring(0, 8)}...`);
      
    } catch (error: any) {
      setError(error.message);
      toast.error(`Failed to share access: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  }, [currentAccount, signPersonalMessage, updateProgress]);

  /**
   * Revoke access from a user
   */
  const revokeAccess = useCallback(async (
    policyId: string,
    userAddress: string
  ): Promise<void> => {
    if (!currentAccount || !sealClientRef.current) {
      throw new Error('Wallet or SEAL client not initialized');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      updateProgress('preparing', 0, 'Preparing access revocation...');
      
      const revokeRequest = {
        policyId,
        userAddress,
        revokedBy: currentAccount.address,
        timestamp: Date.now()
      };
      
      const messageToSign = JSON.stringify(revokeRequest);
      
      updateProgress('signing', 40, 'Please sign the access revocation request...');
      
      const signature = await signPersonalMessage({
        message: new TextEncoder().encode(messageToSign)
      });
      
      updateProgress('preparing', 80, 'Updating SEAL policy...');
      
      await sealClientRef.current.revokeAccess({
        ...revokeRequest,
        signature: Array.from(signature.signature)
      });
      
      updateProgress('complete', 100, 'Access revoked successfully');
      
      toast.success(`Access revoked from ${userAddress.substring(0, 8)}...`);
      
    } catch (error: any) {
      setError(error.message);
      toast.error(`Failed to revoke access: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  }, [currentAccount, signPersonalMessage, updateProgress]);

  /**
   * Cancel ongoing operation
   */
  const cancelOperation = useCallback(() => {
    if (operationAbortController.current) {
      operationAbortController.current.abort();
      toast.info('Operation cancelled');
    }
  }, []);

  /**
   * Get user's SEAL policies
   */
  const loadPolicies = useCallback(async (): Promise<SealPolicy[]> => {
    if (!currentAccount || !sealClientRef.current) {
      return [];
    }

    try {
      const userPolicies = await sealClientRef.current.getUserPolicies(currentAccount.address);
      setPolicies(userPolicies);
      return userPolicies;
    } catch (error: any) {
      console.error('Failed to load SEAL policies:', error);
      setError(error.message);
      return [];
    }
  }, [currentAccount]);

  /**
   * Check if user has access to encrypted content
   */
  const checkAccess = useCallback(async (
    policyId: string,
    userAddress?: string
  ): Promise<boolean> => {
    if (!sealClientRef.current) {
      return false;
    }

    try {
      const address = userAddress || currentAccount?.address;
      if (!address) return false;
      
      return await sealClientRef.current.checkAccess(policyId, address);
    } catch (error) {
      console.error('Failed to check access:', error);
      return false;
    }
  }, [currentAccount]);

  // Load policies when account changes
  useEffect(() => {
    if (currentAccount) {
      loadPolicies().catch(console.error);
    } else {
      setPolicies([]);
    }
  }, [currentAccount, loadPolicies]);

  return {
    // State
    isLoading,
    progress,
    policies,
    error,
    
    // Operations
    createPolicy,
    encryptContent,
    decryptContent,
    shareAccess,
    revokeAccess,
    
    // Utilities
    cancelOperation,
    loadPolicies,
    checkAccess,
    
    // Status
    isConnected: !!currentAccount,
    isReady: !!(currentAccount && sealClientRef.current && walrusClientRef.current)
  };
}

export default useSealEncryption;