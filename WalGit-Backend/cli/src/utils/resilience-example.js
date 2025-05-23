/**
 * Resilient Network Examples
 * 
 * This file demonstrates how to use the resilient network framework in real-world
 * WalGit scenarios. These examples can be used as a reference for implementing
 * resilient network operations throughout the codebase.
 */

import { resilience } from './index.js';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import walrusStorage from './walrus-integration.js';
import fetch from 'node-fetch';

/**
 * Example 1: Resilient Sui Transaction
 * Demonstrates how to execute a blockchain transaction with full resilience
 */
export async function exampleResilientSuiTransaction() {
  // Set up SUI client
  const client = new SuiClient({ url: getFullnodeUrl('testnet') });
  
  // Create keypair (in a real app, this would come from secure storage)
  const keypair = Ed25519Keypair.generate();
  
  // Create a transaction block
  const txb = new TransactionBlock();
  txb.moveCall({
    target: '0x2::sui::transfer',
    arguments: [
      txb.object('0x6'),
      txb.pure(keypair.getPublicKey().toSuiAddress())
    ]
  });
  
  try {
    // Execute with resilience (retry, circuit breaker, failure tracking)
    const result = await resilience.executeSuiTransaction(client, txb, keypair, {
      operation: 'example-sui-transfer',
      waitForConfirmation: true,
      retryCount: 3,
      txType: 'transfer'
    });
    
    console.log('Transaction succeeded:', result.digest);
    return result;
  } catch (error) {
    console.error('Transaction failed with enhanced error info:', error.userMessage);
    throw error;
  }
}

/**
 * Example 2: Resilient Walrus Storage Operation
 * Demonstrates how to perform storage operations with resilience
 */
export async function exampleResilientWalrusOperation() {
  // Create test content
  const content = Buffer.from('Test content for resilient storage example');
  const contentHash = 'example-hash-123';
  
  // Wrap the storage operation in resilience
  try {
    const result = await resilience.executeWalrusOperation(
      // The operation to perform
      () => walrusStorage.storeContent(content, {
        contentType: 'text/plain'
      }, 'example-repo'),
      
      // Resilience options
      {
        operation: 'store-content',
        type: 'content-storage',
        hash: contentHash,
        size: content.length,
        retryCount: 3
      }
    );
    
    console.log('Storage operation succeeded:', result.cid);
    return result;
  } catch (error) {
    console.error('Storage operation failed:', error.message);
    throw error;
  }
}

/**
 * Example 3: Resilient Network Request
 * Demonstrates how to make HTTP requests with resilience
 */
export async function exampleResilientNetworkRequest() {
  const apiUrl = 'https://api.example.com/data';
  
  try {
    const result = await resilience.resilientNetworkRequest(
      // The request function to execute
      () => fetch(apiUrl).then(res => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      }),
      
      // Resilience options
      {
        operation: 'fetch-api-data',
        component: 'data-service',
        url: apiUrl,
        method: 'GET',
        retryCount: 3,
        circuitName: 'example-api'
      }
    );
    
    console.log('API request succeeded:', result);
    return result;
  } catch (error) {
    console.error('API request failed:', error.message);
    throw error;
  }
}

/**
 * Example 4: Resilient Batch Processing
 * Demonstrates how to process multiple operations with resilience
 */
export async function exampleResilientBatchProcess() {
  // Create an array of operations to perform
  const operations = [
    () => ({ id: 1, data: 'Operation 1' }),
    () => ({ id: 2, data: 'Operation 2' }),
    () => ({ id: 3, data: 'Operation 3' }),
    () => { throw new Error('Simulated failure in operation 4'); },
    () => ({ id: 5, data: 'Operation 5' })
  ];
  
  // Execute function that runs a single operation
  const executeFn = async (operation) => {
    try {
      return await operation();
    } catch (error) {
      console.warn(`Operation failed: ${error.message}`);
      throw error;
    }
  };
  
  try {
    // Process the batch with resilience
    const results = await resilience.processBatchResilient(
      operations,
      executeFn,
      {
        operation: 'batch-example',
        component: 'batch-processor',
        batchType: 'example',
        concurrency: 2,
        retryCount: 2,
        continueOnError: true,
        onProgress: (progress) => {
          console.log(`Batch progress: ${progress.completed}/${progress.total}`);
        }
      }
    );
    
    console.log('Batch processing results:', {
      successful: results.successful.length,
      failed: results.failed.length,
      total: results.total
    });
    
    return results;
  } catch (error) {
    console.error('Batch processing failed:', error.message);
    throw error;
  }
}

/**
 * Example 5: Get Network Health Status
 * Demonstrates how to check the health of network services
 */
export function exampleGetNetworkHealth() {
  const health = resilience.getNetworkHealth();
  
  console.log('Network Health Summary:');
  console.log('----------------------');
  console.log(`Sui Circuit: ${health.sui.state}`);
  console.log(`Walrus Circuit: ${health.walrus.state}`);
  console.log(`Network Status: ${health.monitor.status}`);
  console.log(`Average Latency: ${health.monitor.latency}ms`);
  console.log(`Recent Failures: ${health.failures.trends.totalCount}`);
  console.log(`Detected Patterns: ${health.failures.patterns.patternCount}`);
  
  return health;
}

// Helper function to run all examples
export async function runAllExamples() {
  console.log('Running Resilient Network Examples...');
  
  try {
    console.log('\n1. Network Health Check:');
    await exampleGetNetworkHealth();
    
    console.log('\n2. Resilient Network Request:');
    await exampleResilientNetworkRequest();
    
    console.log('\n3. Resilient Batch Processing:');
    await exampleResilientBatchProcess();
    
    console.log('\n4. Resilient Walrus Storage:');
    await exampleResilientWalrusOperation();
    
    console.log('\n5. Resilient Sui Transaction:');
    await exampleResilientSuiTransaction();
    
  } catch (error) {
    console.error('Example execution failed:', error);
  } finally {
    console.log('\nExamples completed.');
  }
}

// Export examples
export default {
  exampleResilientSuiTransaction,
  exampleResilientWalrusOperation,
  exampleResilientNetworkRequest,
  exampleResilientBatchProcess,
  exampleGetNetworkHealth,
  runAllExamples
};