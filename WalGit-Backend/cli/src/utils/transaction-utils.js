/**
 * Transaction utilities for Sui blockchain operations
 * Provides a set of helper functions for building, signing, executing,
 * and monitoring transaction blocks on the Sui blockchain.
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { toB64 } from '@mysten/sui.js/utils';
import { EventId } from '@mysten/sui.js/client';
import { sleep } from './config.js';

// Default configuration
const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_RETRY_DELAY = 2000; // ms
const DEFAULT_TX_WAIT_TIMEOUT = 60000; // 60 seconds
const GAS_BUDGET = 100000000; // 0.1 SUI

/**
 * Creates a configured Sui client for a specific network
 * @param {string} network - Network name ('mainnet', 'testnet', 'devnet', 'localnet')
 * @return {SuiClient} Configured Sui client
 */
export function createSuiClient(network = 'testnet') {
  return new SuiClient({ url: getFullnodeUrl(network) });
}

/**
 * Creates a keypair from a provided private key
 * @param {string} privateKey - Base64 encoded private key
 * @return {Ed25519Keypair} Sui keypair
 */
export function createKeypairFromPrivateKey(privateKey) {
  try {
    const privateKeyBytes = Buffer.from(privateKey, 'base64');
    return Ed25519Keypair.fromSecretKey(privateKeyBytes);
  } catch (error) {
    throw new Error(`Failed to create keypair: ${error.message}`);
  }
}

/**
 * Creates a new transaction block with default gas configuration
 * @param {Object} options - Transaction block options
 * @return {TransactionBlock} New transaction block
 */
export function createTransactionBlock(options = {}) {
  const txb = new TransactionBlock(options);
  txb.setGasBudget(GAS_BUDGET);
  return txb;
}

/**
 * Signs a transaction with the provided keypair
 * @param {TransactionBlock} txb - Transaction block to sign
 * @param {Ed25519Keypair} keypair - Keypair to sign with
 * @return {Uint8Array} Serialized signed transaction
 */
export async function signTransaction(txb, keypair) {
  try {
    const bytes = await txb.build();
    const signature = keypair.signTransactionBlock(bytes);
    return {
      bytes,
      signature: toB64(signature)
    };
  } catch (error) {
    throw new Error(`Failed to sign transaction: ${error.message}`);
  }
}

/**
 * Executes a transaction block with automatic retries
 * @param {SuiClient} client - Sui client
 * @param {TransactionBlock} txb - Transaction block to execute
 * @param {Ed25519Keypair} keypair - Keypair to sign with
 * @param {Object} options - Execution options
 * @param {number} options.retryCount - Number of retries (default: 3)
 * @param {number} options.retryDelay - Delay between retries in ms (default: 2000)
 * @return {Object} Transaction execution result
 */
export async function executeTransactionWithRetry(
  client,
  txb,
  keypair,
  options = {}
) {
  const retryCount = options.retryCount || DEFAULT_RETRY_COUNT;
  const retryDelay = options.retryDelay || DEFAULT_RETRY_DELAY;
  
  let lastError;
  
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const { bytes, signature } = await signTransaction(txb, keypair);
      
      const result = await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        },
      });
      
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`Transaction attempt ${attempt + 1} failed: ${error.message}`);
      
      if (attempt < retryCount) {
        console.log(`Retrying in ${retryDelay}ms...`);
        await sleep(retryDelay);
      }
    }
  }
  
  throw new Error(`Transaction failed after ${retryCount} attempts: ${lastError.message}`);
}

/**
 * Waits for a transaction to be confirmed on the blockchain
 * @param {SuiClient} client - Sui client
 * @param {string} txDigest - Transaction digest
 * @param {number} timeout - Maximum time to wait in ms (default: 60000)
 * @return {Object} Transaction details
 */
export async function waitForTransaction(client, txDigest, timeout = DEFAULT_TX_WAIT_TIMEOUT) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const tx = await client.getTransactionBlock({
        digest: txDigest,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
      });
      
      if (tx && tx.effects) {
        // Check status
        const status = tx.effects.status.status;
        
        if (status === 'success') {
          return tx;
        } else if (status === 'failure') {
          throw new Error(`Transaction failed: ${tx.effects.status.error || 'Unknown error'}`);
        }
      }
      
      // Wait before checking again
      await sleep(1000);
    } catch (error) {
      if (error.code === 'transactionNotFound') {
        // Transaction not yet processed, continue waiting
        await sleep(1000);
      } else {
        throw error;
      }
    }
  }
  
  throw new Error(`Transaction confirmation timed out after ${timeout}ms`);
}

/**
 * Extracts specific event data from transaction events
 * @param {Object} txResult - Transaction result
 * @param {string} eventType - Event type to extract
 * @return {Array} Filtered and parsed events
 */
export function extractEvents(txResult, eventType) {
  if (!txResult || !txResult.events || !Array.isArray(txResult.events)) {
    return [];
  }
  
  return txResult.events
    .filter(event => event.type && event.type.includes(eventType))
    .map(event => event.parsedJson || event);
}

/**
 * Subscribes to events of a specific type
 * @param {SuiClient} client - Sui client
 * @param {string} eventType - Type of event to subscribe to
 * @param {Function} callback - Callback function for handling events
 * @return {Function} Unsubscribe function
 */
export function subscribeToEvents(client, eventType, callback) {
  const eventFilter = {
    MoveEventType: eventType
  };
  
  const unsubscribeFn = client.subscribeEvent({
    filter: eventFilter,
    onMessage: (event) => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in event callback:', error);
      }
    }
  });
  
  return unsubscribeFn;
}

/**
 * Paginated event query for historical events
 * @param {SuiClient} client - Sui client
 * @param {string} eventType - Type of event to query
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of events to return
 * @param {EventId} options.cursor - Pagination cursor
 * @return {Object} Query results with cursor for pagination
 */
export async function queryEventHistory(client, eventType, options = {}) {
  const eventFilter = {
    MoveEventType: eventType
  };
  
  const result = await client.queryEvents({
    query: { EventType: eventFilter },
    cursor: options.cursor,
    limit: options.limit || 50,
    descending_order: true,
  });
  
  return {
    events: result.data,
    nextCursor: result.nextCursor,
    hasNextPage: result.hasNextPage,
  };
}

/**
 * Extracts created object IDs from transaction results
 * @param {Object} txResult - Transaction result
 * @return {Array<string>} Array of created object IDs
 */
export function extractCreatedObjects(txResult) {
  if (!txResult || !txResult.objectChanges) {
    return [];
  }
  
  return txResult.objectChanges
    .filter(change => change.type === 'created')
    .map(change => change.objectId);
}

/**
 * Estimates the gas cost for a transaction
 * @param {SuiClient} client - Sui client
 * @param {TransactionBlock} txb - Transaction block
 * @param {string} sender - Sender address
 * @return {BigInt} Estimated gas cost
 */
export async function estimateGasCost(client, txb, sender) {
  try {
    const dryRunResult = await client.dryRunTransactionBlock({
      transactionBlock: await txb.build({ provider: client }),
      sender,
    });
    
    if (dryRunResult && dryRunResult.effects && dryRunResult.effects.gasUsed) {
      const { computationCost, storageCost, storageRebate } = dryRunResult.effects.gasUsed;
      // Total gas = computation + storage - rebate
      return BigInt(computationCost) + BigInt(storageCost) - BigInt(storageRebate);
    }
    
    throw new Error('Unable to estimate gas cost');
  } catch (error) {
    throw new Error(`Gas estimation failed: ${error.message}`);
  }
}

/**
 * Formats a gas cost from BigInt to a human-readable string in SUI
 * @param {BigInt} gasCost - Gas cost in MIST
 * @return {string} Formatted gas cost in SUI
 */
export function formatGasCost(gasCost) {
  // 1 SUI = 10^9 MIST
  const suiAmount = Number(gasCost) / 1_000_000_000;
  return `${suiAmount.toFixed(9)} SUI`;
}

/**
 * Groups multiple transactions into a single transaction block
 * @param {Array<Function>} txFunctions - Functions that add transactions to a transaction block
 * @return {TransactionBlock} Combined transaction block
 */
export function batchTransactions(txFunctions) {
  const txb = createTransactionBlock();
  
  for (const addTx of txFunctions) {
    addTx(txb);
  }
  
  return txb;
}

/**
 * Executes a transaction and waits for confirmation in a single call
 * @param {SuiClient} client - Sui client
 * @param {TransactionBlock} txb - Transaction block
 * @param {Ed25519Keypair} keypair - Keypair for signing
 * @param {Object} options - Execution options
 * @return {Object} Confirmed transaction details
 */
export async function executeAndWait(client, txb, keypair, options = {}) {
  const result = await executeTransactionWithRetry(client, txb, keypair, options);
  
  if (!result || !result.digest) {
    throw new Error('Transaction execution did not return a valid digest');
  }
  
  return waitForTransaction(client, result.digest, options.timeout);
}

/**
 * Checks if a transaction was successful
 * @param {Object} txResult - Transaction result
 * @return {boolean} True if successful
 */
export function isTransactionSuccessful(txResult) {
  return (
    txResult &&
    txResult.effects &&
    txResult.effects.status &&
    txResult.effects.status.status === 'success'
  );
}

/**
 * Gets a readable error message from a failed transaction
 * @param {Object} txResult - Transaction result
 * @return {string} Error message
 */
export function getTransactionError(txResult) {
  if (isTransactionSuccessful(txResult)) {
    return null;
  }
  
  if (
    txResult &&
    txResult.effects &&
    txResult.effects.status &&
    txResult.effects.status.error
  ) {
    return txResult.effects.status.error;
  }
  
  return 'Unknown transaction error';
}