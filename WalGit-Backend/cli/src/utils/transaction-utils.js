/**
 * Enhanced Transaction utilities for Sui blockchain operations
 * Provides a set of helper functions for building, signing, executing,
 * and monitoring transaction blocks on the Sui blockchain with improved
 * error handling, retry mechanisms, and batch operations.
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { toB64 } from '@mysten/sui.js/utils';
// EventId is not exported in this version, removed unused import
import {
  DEFAULT_GAS_BUDGET,
  MAX_GAS_BUDGET,
  MAX_BATCH_SIZE,
  MAX_CONCURRENT_TRANSACTIONS,
  SUI_TRANSACTION_BLOCK_SIZE_LIMIT,
  GAS_PRICE_BUFFER_MULTIPLIER
} from './constants.js';

// Sleep utility function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced configuration - export needed constants for external use
export const DEFAULT_RETRY_COUNT = 5;
export const DEFAULT_RETRY_DELAY = 2000; // ms
export const DEFAULT_RETRY_BACKOFF_FACTOR = 1.5; // Exponential backoff factor
export const DEFAULT_TX_WAIT_TIMEOUT = 120000; // 120 seconds (2 minutes)
const TX_MONITORING_INTERVAL = 1000; // 1 second
const NETWORK_JITTER_MIN = 0.85; // 15% below average for jitter calculation
const NETWORK_JITTER_MAX = 1.15; // 15% above average for jitter calculation
const MAX_RETRY_DELAY = 30000; // 30 seconds cap on retry delays

// Runtime configuration - these can be modified at runtime
let runtimeConfig = {
  gasLimit: DEFAULT_GAS_BUDGET,
  retryCount: DEFAULT_RETRY_COUNT,
  batchSize: MAX_BATCH_SIZE,
  waitTimeout: DEFAULT_TX_WAIT_TIMEOUT,
  adaptiveBatching: true,
  adaptiveGas: true
};

/**
 * Sets the gas limit for transactions
 * @param {number} limit - Gas limit in MIST units
 */
export function setGasLimit(limit) {
  if (typeof limit === 'number' && limit > 0) {
    runtimeConfig.gasLimit = Math.min(limit, MAX_GAS_BUDGET);
    console.log(`Gas limit set to ${formatGasCost(BigInt(runtimeConfig.gasLimit))}`);
  }
}

/**
 * Sets the retry count for transactions
 * @param {number} count - Number of retries
 */
export function setRetryCount(count) {
  if (typeof count === 'number' && count >= 0) {
    runtimeConfig.retryCount = count;
  }
}

/**
 * Sets the batch size for operations
 * @param {number} size - Batch size
 */
export function setBatchSize(size) {
  if (typeof size === 'number' && size > 0) {
    runtimeConfig.batchSize = Math.min(size, MAX_BATCH_SIZE);
  }
}

/**
 * Gets the current transaction configuration
 * @return {Object} Current configuration
 */
export function getTransactionConfig() {
  return { ...runtimeConfig };
}

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
 * @param {number} options.gasBudget - Optional custom gas budget
 * @return {TransactionBlock} New transaction block
 */
export function createTransactionBlock(options = {}) {
  const txb = new TransactionBlock(options);
  const gasBudget = options.gasBudget || runtimeConfig.gasLimit || DEFAULT_GAS_BUDGET;
  txb.setGasBudget(gasBudget);
  return txb;
}

/**
 * Signs a transaction with the provided keypair
 * @param {TransactionBlock} txb - Transaction block to sign
 * @param {Ed25519Keypair} keypair - Keypair to sign with
 * @return {Object} Object containing transaction bytes and signature
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
 * Enhanced error classification for blockchain transactions
 * @param {Error} error - The error to classify
 * @return {string} Classified error type
 */
export function classifyTransactionError(error) {
  if (!error) return 'unknown';
  
  const errorMessage = error.message.toLowerCase();
  
  // Common error classifications
  if (errorMessage.includes('gas') && (errorMessage.includes('insufficient') || errorMessage.includes('budget'))) {
    return 'insufficient_gas';
  } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return 'timeout';
  } else if (errorMessage.includes('object not found') || errorMessage.includes('does not exist')) {
    return 'object_not_found';
  } else if (errorMessage.includes('permission denied') || errorMessage.includes('unauthorized')) {
    return 'permission_denied';
  } else if (errorMessage.includes('signature')) {
    return 'signature_error';
  } else if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
    return 'duplicate_resource';
  } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return 'network_error';
  } else if (errorMessage.includes('rate limit') || errorMessage.includes('throttled')) {
    return 'rate_limited';
  } else if (errorMessage.includes('balance') || errorMessage.includes('fund')) {
    return 'insufficient_funds';
  } else if (errorMessage.includes('validation')) {
    return 'validation_error';
  } else if (errorMessage.includes('serialization') || errorMessage.includes('format')) {
    return 'serialization_error';
  } else if (errorMessage.includes('server')) {
    return 'server_error';
  }
  
  return 'unknown';
}

/**
 * Enhance transaction error with additional context information
 * @param {Error} error - The original error
 * @param {Object} context - Additional context information
 * @return {Error} Enhanced error with better context
 */
export function enhanceTransactionError(error, context = {}) {
  if (!error) return new Error('Unknown transaction error');
  
  // Create a new error object with the original message
  const enhancedError = new Error(error.message);
  
  // Copy over properties from original error
  Object.assign(enhancedError, error);
  
  // Add error classification
  enhancedError.errorType = classifyTransactionError(error);
  
  // Add user-friendly message based on error type
  switch (enhancedError.errorType) {
    case 'insufficient_gas':
      enhancedError.userMessage = 'Transaction failed due to insufficient gas. Try increasing the gas budget.';
      break;
    case 'timeout':
      enhancedError.userMessage = 'Transaction timed out. The network may be congested.';
      break;
    case 'object_not_found':
      enhancedError.userMessage = 'One or more objects needed for this transaction could not be found.';
      break;
    case 'permission_denied':
      enhancedError.userMessage = 'You do not have permission to perform this action.';
      break;
    case 'signature_error':
      enhancedError.userMessage = 'Invalid transaction signature. Please check your wallet connection.';
      break;
    case 'duplicate_resource':
      enhancedError.userMessage = 'This resource already exists.';
      break;
    case 'network_error':
      enhancedError.userMessage = 'Network connection issue. Please check your internet connection.';
      break;
    case 'rate_limited':
      enhancedError.userMessage = 'Rate limit exceeded. Please wait a moment before trying again.';
      break;
    case 'insufficient_funds':
      enhancedError.userMessage = 'Insufficient funds for this transaction.';
      break;
    case 'validation_error':
      enhancedError.userMessage = 'Transaction validation failed. Please check your inputs.';
      break;
    case 'serialization_error':
      enhancedError.userMessage = 'Transaction data format error.';
      break;
    case 'server_error':
      enhancedError.userMessage = 'Server error. Please try again later.';
      break;
    default:
      enhancedError.userMessage = 'An error occurred with this transaction.';
  }
  
  // Add suggestion based on error type
  switch (enhancedError.errorType) {
    case 'insufficient_gas':
      enhancedError.suggestion = 'Increase the gas budget or simplify the transaction.';
      break;
    case 'timeout':
      enhancedError.suggestion = 'Try again later when the network is less congested.';
      break;
    case 'object_not_found':
      enhancedError.suggestion = 'Verify that the object IDs are correct and that you own them.';
      break;
    case 'permission_denied':
      enhancedError.suggestion = 'Ensure you have the correct permissions or ownership.';
      break;
    case 'signature_error':
      enhancedError.suggestion = 'Reconnect your wallet and try again.';
      break;
    case 'duplicate_resource':
      enhancedError.suggestion = 'Use a different name or identifier.';
      break;
    case 'network_error':
      enhancedError.suggestion = 'Check your internet connection and try again.';
      break;
    case 'rate_limited':
      enhancedError.suggestion = 'Wait a moment before trying again.';
      break;
    case 'insufficient_funds':
      enhancedError.suggestion = 'Add more SUI to your wallet.';
      break;
    case 'validation_error':
      enhancedError.suggestion = 'Review your input parameters and try again.';
      break;
    case 'serialization_error':
      enhancedError.suggestion = 'Contact support if this issue persists.';
      break;
    case 'server_error':
      enhancedError.suggestion = 'Try again later or contact support.';
      break;
    default:
      enhancedError.suggestion = 'Try again or contact support if the issue persists.';
  }
  
  // Add context information
  enhancedError.context = context;
  
  // Add timestamp
  enhancedError.timestamp = new Date().toISOString();
  
  return enhancedError;
}

/**
 * Executes a transaction block with enhanced retry strategy and adaptive backoff
 * @param {SuiClient} client - Sui client
 * @param {TransactionBlock} txb - Transaction block to execute
 * @param {Ed25519Keypair} keypair - Keypair to sign with
 * @param {Object} options - Execution options
 * @param {number} options.retryCount - Number of retries (default: 5)
 * @param {number} options.retryDelay - Initial delay between retries in ms (default: 2000)
 * @param {number} options.backoffFactor - Exponential backoff multiplier (default: 1.5)
 * @param {Array<string>} options.retryableErrors - Array of error messages that should trigger retry
 * @param {function} options.onRetry - Callback function executed before each retry
 * @param {function} options.onProgress - Callback function for progress updates
 * @return {Object} Transaction execution result
 */
export async function executeTransactionWithRetry(
  client,
  txb,
  keypair,
  options = {}
) {
  const retryCount = options.retryCount || runtimeConfig.retryCount || DEFAULT_RETRY_COUNT;
  const initialRetryDelay = options.retryDelay || DEFAULT_RETRY_DELAY;
  const backoffFactor = options.backoffFactor || DEFAULT_RETRY_BACKOFF_FACTOR;
  const onProgress = options.onProgress || (() => {});
  
  // Extended list of retryable errors
  const retryableErrors = options.retryableErrors || [
    'transaction temporarily rejected',
    'server busy',
    'insufficient gas',
    'network error',
    'timeout',
    'rate limit',
    'connection',
    'retry',
    'quorum',
    'sequencing',
    'congestion',
    'throttled',
    'overloaded',
    'temporary',
    'service unavailable',
    'try again',
    'object reference error',
    'session expired'
  ];
  
  const onRetry = options.onRetry || (() => {});

  let lastError;
  let currentDelay = initialRetryDelay;
  
  // Report initial attempt
  try {
    onProgress({
      phase: 'starting',
      attempt: 1,
      totalAttempts: retryCount + 1
    });
  } catch (error) {
    console.warn('Error in progress callback:', error.message);
  }

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const { bytes, signature } = await signTransaction(txb, keypair);
      
      // Report execution attempt
      try {
        onProgress({
          phase: 'executing',
          attempt: attempt + 1,
          totalAttempts: retryCount + 1
        });
      } catch (error) {
        console.warn('Error in progress callback:', error.message);
      }

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
      
      // Report success
      try {
        onProgress({
          phase: 'success',
          attempt: attempt + 1,
          totalAttempts: retryCount + 1,
          result
        });
      } catch (error) {
        console.warn('Error in progress callback:', error.message);
      }

      // Success - return the result
      return result;
    } catch (error) {
      lastError = error;
      
      // Report failure
      try {
        onProgress({
          phase: 'failed',
          attempt: attempt + 1,
          totalAttempts: retryCount + 1,
          error,
          errorType: classifyTransactionError(error),
          isRetryable: retryableErrors.some(retryableError =>
            error.message.toLowerCase().includes(retryableError.toLowerCase())
          )
        });
      } catch (callbackError) {
        console.warn('Error in progress callback:', callbackError.message);
      }
      
      console.warn(`Transaction attempt ${attempt + 1} failed: ${error.message}`);

      // Check if we've reached max retries
      if (attempt >= retryCount) {
        break;
      }

      // Check if this error is retryable
      const isRetryable = retryableErrors.some(retryableError =>
        error.message.toLowerCase().includes(retryableError.toLowerCase())
      );

      if (!isRetryable) {
        console.warn('Error is not retryable, aborting retry sequence');
        break;
      }

      // Apply exponential backoff with jitter
      const jitter = Math.random() * (NETWORK_JITTER_MAX - NETWORK_JITTER_MIN) + NETWORK_JITTER_MIN;
      currentDelay = Math.min(currentDelay * backoffFactor * jitter, MAX_RETRY_DELAY);

      console.log(`Retrying in ${Math.round(currentDelay)}ms (attempt ${attempt + 1}/${retryCount})...`);
      
      // Report retry
      try {
        onProgress({
          phase: 'retrying',
          attempt: attempt + 1,
          totalAttempts: retryCount + 1,
          nextAttempt: attempt + 2,
          delay: currentDelay,
          error,
          errorType: classifyTransactionError(error)
        });
      } catch (callbackError) {
        console.warn('Error in progress callback:', callbackError.message);
      }

      // Execute retry callback if provided
      try {
        await onRetry(attempt, error, currentDelay);
      } catch (callbackError) {
        console.warn('Error in retry callback:', callbackError.message);
      }

      await sleep(currentDelay);
    }
  }

  // Report final failure
  try {
    onProgress({
      phase: 'exhausted',
      attempts: retryCount + 1,
      error: lastError,
      errorType: classifyTransactionError(lastError)
    });
  } catch (error) {
    console.warn('Error in progress callback:', error.message);
  }

  // Classify error type for better user feedback
  const errorType = classifyTransactionError(lastError);
  const enhancedError = enhanceTransactionError(lastError, {
    attempts: retryCount + 1,
    errorType
  });
  
  throw enhancedError;
}

/**
 * Waits for a transaction to be confirmed on the blockchain with enhanced monitoring
 * and smart timeout handling
 * @param {SuiClient} client - Sui client
 * @param {string} txDigest - Transaction digest
 * @param {number} timeout - Maximum time to wait in ms (default: 120000)
 * @param {Object} options - Wait options
 * @param {Function} options.onProgress - Callback that receives progress updates
 * @param {boolean} options.throwOnTimeout - Whether to throw error on timeout (default: true)
 * @param {number} options.progressInterval - Interval for progress callbacks in ms
 * @param {boolean} options.exponentialRetry - Whether to use exponential retries for status checks
 * @return {Object} Transaction details
 */
export async function waitForTransaction(
  client,
  txDigest,
  timeout = null,
  options = {}
) {
  // Use provided timeout, runtime config, or default
  const effectiveTimeout = timeout || runtimeConfig.waitTimeout || DEFAULT_TX_WAIT_TIMEOUT;
  const startTime = Date.now();
  const throwOnTimeout = options.throwOnTimeout !== false;
  const progressInterval = options.progressInterval || TX_MONITORING_INTERVAL;
  const exponentialRetry = options.exponentialRetry !== false;
  const onProgress = options.onProgress || (() => {});

  // Create a map to track unique errors to prevent spamming logs
  const errorsSeen = new Map();

  // Report initial progress
  try {
    onProgress({
      status: 'pending',
      elapsedTime: 0,
      percentComplete: 0,
      txDigest
    });
  } catch (error) {
    console.warn('Error in progress callback:', error.message);
  }

  let lastReportTime = startTime;
  let consecutiveErrors = 0;
  let baseWaitTime = progressInterval;
  let currentWaitTime = baseWaitTime;

  while (Date.now() - startTime < effectiveTimeout) {
    try {
      const tx = await client.getTransactionBlock({
        digest: txDigest,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
      });

      // Reset error counter and wait time on successful response
      consecutiveErrors = 0;
      currentWaitTime = baseWaitTime;

      if (tx && tx.effects) {
        // Check status
        const status = tx.effects.status.status;

        if (status === 'success') {
          // Report final success progress
          try {
            onProgress({
              status: 'success',
              elapsedTime: Date.now() - startTime,
              percentComplete: 100,
              txDigest,
              result: tx
            });
          } catch (error) {
            console.warn('Error in progress callback:', error.message);
          }

          return tx;
        } else if (status === 'failure') {
          // Extract error message and add more context
          const errorMsg = tx.effects.status.error || 'Unknown error';
          const formattedError = parseBlockchainError(errorMsg);
          
          // Report final failure progress
          try {
            onProgress({
              status: 'failed',
              elapsedTime: Date.now() - startTime,
              percentComplete: 100,
              txDigest,
              error: formattedError,
              rawError: errorMsg
            });
          } catch (error) {
            console.warn('Error in progress callback:', error.message);
          }

          throw new Error(`Transaction failed: ${formattedError.message}`);
        }
      }

      // Report periodic progress
      const currentTime = Date.now();
      if (currentTime - lastReportTime >= progressInterval) {
        const elapsedTime = currentTime - startTime;
        const percentComplete = Math.min(95, Math.floor((elapsedTime / timeout) * 100));

        try {
          onProgress({
            status: 'pending',
            elapsedTime,
            percentComplete,
            txDigest,
            pollingAt: new Date().toISOString()
          });
        } catch (error) {
          console.warn('Error in progress callback:', error.message);
        }

        lastReportTime = currentTime;
      }

      // Wait before checking again
      await sleep(currentWaitTime);
    } catch (error) {
      consecutiveErrors++;

      // Apply exponential backoff to polling rate when encountering errors
      if (exponentialRetry && consecutiveErrors > 1) {
        currentWaitTime = Math.min(currentWaitTime * 1.5, 5000); // Cap at 5 seconds
      }

      // Only log errors that we haven't seen before or if we've had too many consecutive errors
      const errorKey = `${error.code || 'unknown'}:${error.message}`;
      if (!errorsSeen.has(errorKey) || consecutiveErrors > 5) {
        console.warn(`Error checking transaction status (attempt ${consecutiveErrors}):`, error.message);
        errorsSeen.set(errorKey, true);
      }

      if (error.code === 'transactionNotFound') {
        // Transaction not yet processed, continue waiting
        await sleep(currentWaitTime);
      } else if (consecutiveErrors <= 10) {
        // For other errors, keep retrying up to a limit
        await sleep(currentWaitTime);
      } else {
        // Too many consecutive errors, break the loop
        throw enhanceTransactionError(error, {
          phase: 'monitoring',
          txDigest,
          elapsedTime: Date.now() - startTime
        });
      }
    }
  }

  // Timeout occurred
  try {
    onProgress({
      status: 'timeout',
      elapsedTime: Date.now() - startTime,
      percentComplete: 100,
      txDigest,
      error: `Transaction confirmation timed out after ${effectiveTimeout}ms`
    });
  } catch (error) {
    console.warn('Error in progress callback:', error.message);
  }

  if (throwOnTimeout) {
    const timeoutError = new Error(`Transaction confirmation timed out after ${effectiveTimeout}ms`);
    throw enhanceTransactionError(timeoutError, {
      phase: 'timeout',
      txDigest,
      timeoutMs: effectiveTimeout
    });
  }

  // Return a timeout result if we don't throw
  return {
    success: false,
    timeout: true,
    digest: txDigest,
    message: `Transaction confirmation timed out after ${effectiveTimeout}ms`,
    elapsedTime: Date.now() - startTime
  };
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
 * Subscribes to events of a specific type with improved error handling
 * @param {SuiClient} client - Sui client
 * @param {string} eventType - Type of event to subscribe to
 * @param {Function} callback - Callback function for handling events
 * @param {Object} options - Subscription options
 * @param {boolean} options.autoReconnect - Whether to auto-reconnect on errors
 * @param {number} options.maxReconnectAttempts - Maximum reconnection attempts
 * @return {Object} Subscription object with unsubscribe function
 */
export function subscribeToEvents(client, eventType, callback, options = {}) {
  const autoReconnect = options.autoReconnect !== false;
  const maxReconnectAttempts = options.maxReconnectAttempts || 5;
  let reconnectAttempts = 0;
  let active = true;
  let unsubscribeFn = null;
  
  const eventFilter = {
    MoveEventType: eventType
  };
  
  // Enhanced callback wrapper with error handling
  const safeCallback = (event) => {
    try {
      callback(event);
    } catch (error) {
      console.error('Error in event callback:', error);
    }
  };
  
  // Function to establish subscription
  const subscribe = () => {
    try {
      unsubscribeFn = client.subscribeEvent({
        filter: eventFilter,
        onMessage: safeCallback,
        onError: (error) => {
          console.error('Subscription error:', error);
          
          // Auto-reconnect logic
          if (autoReconnect && active && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 15000);
            console.log(`Reconnecting subscription (attempt ${reconnectAttempts}/${maxReconnectAttempts}) in ${delay}ms...`);
            
            setTimeout(() => {
              if (active) {
                try {
                  if (unsubscribeFn) {
                    try {
                      unsubscribeFn();
                    } catch (e) {
                      // Ignore errors during unsubscribe
                    }
                  }
                  subscribe();
                } catch (reconnectError) {
                  console.error('Reconnection failed:', reconnectError);
                }
              }
            }, delay);
          }
        }
      });
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw error;
    }
  };
  
  // Establish initial subscription
  subscribe();
  
  // Return enhanced unsubscribe function
  return {
    unsubscribe: () => {
      active = false;
      if (unsubscribeFn) {
        try {
          unsubscribeFn();
          return true;
        } catch (error) {
          console.error('Error during unsubscribe:', error);
          return false;
        }
      }
      return false;
    },
    isActive: () => active,
    reconnect: () => {
      if (!active) {
        active = true;
        reconnectAttempts = 0;
        subscribe();
        return true;
      }
      return false;
    }
  };
}

/**
 * Paginated event query for historical events with automatic pagination
 * @param {SuiClient} client - Sui client
 * @param {string} eventType - Type of event to query
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of events per page
 * @param {EventId} options.cursor - Pagination cursor
 * @param {number} options.pages - Maximum number of pages to fetch (default: 1)
 * @param {boolean} options.descending - Whether to return results in descending order
 * @param {Function} options.onPage - Callback for each page of results
 * @return {Object} Query results with pagination info
 */
export async function queryEventHistory(client, eventType, options = {}) {
  const eventFilter = {
    MoveEventType: eventType
  };
  
  const limit = options.limit || 50;
  const pages = options.pages || 1;
  const descending = options.descending !== false;
  const onPage = options.onPage || (() => {});
  
  let cursor = options.cursor;
  let allEvents = [];
  let hasMore = true;
  let pageCount = 0;
  
  while (hasMore && pageCount < pages) {
    try {
      const result = await client.queryEvents({
        query: { EventType: eventFilter },
        cursor,
        limit,
        descending_order: descending,
      });
      
      pageCount++;
      allEvents = allEvents.concat(result.data);
      
      // Update pagination state
      cursor = result.nextCursor;
      hasMore = result.hasNextPage;
      
      // Call page callback
      try {
        await onPage({
          page: pageCount,
          events: result.data,
          hasMore,
          cursor
        });
      } catch (error) {
        console.warn('Error in page callback:', error);
      }
      
      // Break if no more pages or reached limit
      if (!hasMore || pageCount >= pages) {
        break;
      }
    } catch (error) {
      throw enhanceTransactionError(error, {
        phase: 'event_query',
        eventType,
        pageCount,
        eventsCollected: allEvents.length
      });
    }
  }
  
  return {
    events: allEvents,
    nextCursor: cursor,
    hasNextPage: hasMore,
    pageCount
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
 * Enhanced gas cost estimation with fallback strategies
 * @param {SuiClient} client - Sui client
 * @param {TransactionBlock} txb - Transaction block
 * @param {string} sender - Sender address
 * @param {Object} options - Estimation options
 * @param {boolean} options.useSafetyFactor - Apply safety multiplier (default: true)
 * @param {number} options.safetyFactor - Safety multiplier value (default: from constants)
 * @param {boolean} options.retryOnFailure - Retry on estimation failure (default: true)
 * @return {BigInt} Estimated gas cost
 */
export async function estimateGasCost(client, txb, sender, options = {}) {
  const useSafetyFactor = options.useSafetyFactor !== false;
  const safetyFactor = options.safetyFactor || GAS_PRICE_BUFFER_MULTIPLIER;
  const retryOnFailure = options.retryOnFailure !== false;
  const maxRetries = options.maxRetries || 3;
  
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const dryRunResult = await client.dryRunTransactionBlock({
        transactionBlock: await txb.build({ provider: client }),
        sender,
      });
      
      if (dryRunResult && dryRunResult.effects && dryRunResult.effects.gasUsed) {
        const { computationCost, storageCost, storageRebate } = dryRunResult.effects.gasUsed;
        
        // Total gas = computation + storage - rebate
        const rawEstimate = BigInt(computationCost) + BigInt(storageCost) - BigInt(storageRebate);
        
        // Apply safety factor if requested
        if (useSafetyFactor) {
          return BigInt(Math.ceil(Number(rawEstimate) * safetyFactor));
        }
        
        return rawEstimate;
      }
      
      throw new Error('Unable to estimate gas cost: missing effects data');
    } catch (error) {
      lastError = error;
      
      if (!retryOnFailure || attempt >= maxRetries - 1) {
        break;
      }
      
      // Wait before retrying
      await sleep(1000 * Math.pow(1.5, attempt));
    }
  }
  
  // Fall back to heuristic-based estimation
  if (options.useHeuristicFallback !== false) {
    try {
      const txbSize = JSON.stringify(txb).length;
      const moveCallCount = countMoveCallsInTx(txb);
      
      // Simple heuristic: base cost + move call cost + size-based cost
      const baseCost = 10000000n;
      const perMoveCallCost = 5000000n;
      const perKbCost = 1000000n;
      
      const sizeInKb = Math.max(1, Math.ceil(txbSize / 1024));
      const heuristicEstimate = baseCost + (perMoveCallCost * BigInt(moveCallCount)) + (perKbCost * BigInt(sizeInKb));
      
      // Apply extra safety factor for heuristic estimate
      const heuristicSafetyFactor = Math.max(safetyFactor, 1.5);
      return BigInt(Math.ceil(Number(heuristicEstimate) * heuristicSafetyFactor));
    } catch (heuristicError) {
      console.warn('Heuristic gas estimation failed:', heuristicError.message);
    }
  }
  
  throw new Error(`Gas estimation failed after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Helper function to count Move calls in a transaction for heuristic gas estimation
 * @param {TransactionBlock} txb - Transaction block
 * @return {number} Number of Move calls detected
 */
function countMoveCallsInTx(txb) {
  try {
    const txbJson = JSON.stringify(txb);
    return (txbJson.match(/moveCall/g) || []).length;
  } catch (error) {
    return 1; // Default to 1 if parsing fails
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
 * Groups multiple transactions into a single transaction block with enhanced
 * size optimization and complexity analysis
 * @param {Array<Function>} txFunctions - Functions that add transactions to a transaction block
 * @param {Object} options - Batch options
 * @param {number} options.maxBatchSize - Maximum number of operations in a single batch
 * @param {boolean} options.strictSizeLimit - Whether to strictly enforce size limits
 * @param {boolean} options.adaptiveBatching - Whether to use adaptive batch sizing
 * @return {Array<TransactionBlock>} Array of optimally sized transaction blocks
 */
export function batchTransactions(txFunctions, options = {}) {
  const maxBatchSize = options.maxBatchSize || runtimeConfig.batchSize || MAX_BATCH_SIZE;
  const strictSizeLimit = options.strictSizeLimit !== false;
  const adaptiveBatching = options.adaptiveBatching !== false;

  // If only one function or no size limit enforcement, create a single batch
  if (txFunctions.length <= 1 || (!strictSizeLimit && txFunctions.length <= maxBatchSize)) {
    const txb = createTransactionBlock();
    for (const addTx of txFunctions) {
      addTx(txb);
    }
    return [txb];
  }

  // Create multiple optimally sized batches
  const batches = [];
  let currentBatch = [];
  let approximateSize = 0;
  let complexityAccumulator = 0;

  for (const txFunction of txFunctions) {
    // Measure function complexity with improved heuristics
    const functionComplexity = estimateFunctionComplexity(txFunction);
    const functionSize = functionComplexity.size;
    const functionComplexityScore = functionComplexity.complexity;
    
    // Check if adding this function would exceed our limits
    const wouldExceedMaxBatchSize = currentBatch.length >= maxBatchSize;
    const wouldExceedSizeLimit = strictSizeLimit && 
                               (approximateSize + functionSize > SUI_TRANSACTION_BLOCK_SIZE_LIMIT);
    
    // Adaptive batching considers complexity in addition to size
    const wouldExceedComplexity = adaptiveBatching && 
                                (complexityAccumulator + functionComplexityScore > 1000);
    
    if (wouldExceedMaxBatchSize || wouldExceedSizeLimit || wouldExceedComplexity) {
      // Finalize current batch if not empty
      if (currentBatch.length > 0) {
        const txb = createTransactionBlock();
        for (const batchFn of currentBatch) {
          batchFn(txb);
        }
        batches.push(txb);
      }

      // Start a new batch
      currentBatch = [txFunction];
      approximateSize = functionSize;
      complexityAccumulator = functionComplexityScore;
    } else {
      // Add to current batch
      currentBatch.push(txFunction);
      approximateSize += functionSize;
      complexityAccumulator += functionComplexityScore;
    }
  }

  // Finalize the last batch if not empty
  if (currentBatch.length > 0) {
    const txb = createTransactionBlock();
    for (const batchFn of currentBatch) {
      batchFn(txb);
    }
    batches.push(txb);
  }

  return batches;
}

/**
 * Enhanced function to estimate the complexity of a transaction function
 * @param {Function} txFunction - Transaction function to estimate
 * @return {Object} Complexity metrics including size and complexity score
 */
function estimateFunctionComplexity(txFunction) {
  try {
    const functionString = txFunction.toString();
    
    // Complexity indicators with better weighting
    const complexityIndicators = [
      { pattern: /moveCall/g, weight: 100, sizeImpact: 200 },
      { pattern: /splitCoins/g, weight: 80, sizeImpact: 150 },
      { pattern: /mergeCoins/g, weight: 80, sizeImpact: 150 },
      { pattern: /transferObjects/g, weight: 60, sizeImpact: 120 },
      { pattern: /pure\(/g, weight: 30, sizeImpact: 50 },
      { pattern: /object\(/g, weight: 40, sizeImpact: 80 },
      { pattern: /\bmakeMoveVec\b/g, weight: 120, sizeImpact: 220 },
      { pattern: /SharedObject/g, weight: 90, sizeImpact: 180 },
      { pattern: /NestedResult/g, weight: 70, sizeImpact: 140 },
      { pattern: /objectIds/g, weight: 40, sizeImpact: 60 },
      { pattern: /getGasCostSummary/g, weight: 20, sizeImpact: 40 },
      { pattern: /array/g, weight: 30, sizeImpact: 50 },
      { pattern: /\bloop\b/g, weight: 100, sizeImpact: 150 },
      { pattern: /\bfor\b/g, weight: 80, sizeImpact: 120 },
      { pattern: /\bwhile\b/g, weight: 80, sizeImpact: 120 }
    ];
    
    let complexityScore = 50; // Base complexity score
    let sizeEstimate = 500;   // Base size estimate
    
    for (const indicator of complexityIndicators) {
      const matches = functionString.match(indicator.pattern) || [];
      const matchCount = matches.length;
      
      complexityScore += matchCount * indicator.weight;
      sizeEstimate += matchCount * indicator.sizeImpact;
    }
    
    // Factor in function length as a general complexity measure
    const functionLength = functionString.length;
    complexityScore += Math.min(functionLength / 10, 500);
    sizeEstimate += Math.min(functionLength / 2, 2000);
    
    // Analyze patterns that suggest high complexity
    if (functionString.includes('recursion') || functionString.includes('recursive')) {
      complexityScore *= 1.5;
      sizeEstimate *= 1.3;
    }
    
    if (functionString.includes('dynamic') || functionString.includes('adaptive')) {
      complexityScore *= 1.2;
      sizeEstimate *= 1.1;
    }
    
    // Look for nested loops or complex control flow
    const nestedLoopIndicator = /for.*for|while.*while|for.*while|while.*for/s;
    if (nestedLoopIndicator.test(functionString)) {
      complexityScore *= 1.8;
      sizeEstimate *= 1.4;
    }
    
    return {
      complexity: complexityScore,
      size: sizeEstimate
    };
  } catch (error) {
    console.warn('Error estimating function complexity:', error.message);
    return {
      complexity: 300, // Default complexity for unknown functions
      size: 1000      // Default size estimate
    };
  }
}

/**
 * Executes a transaction and waits for confirmation in a single call with enhanced
 * error handling, gas optimization, and progress tracking
 * @param {SuiClient} client - Sui client
 * @param {TransactionBlock} txb - Transaction block
 * @param {Ed25519Keypair} keypair - Keypair for signing
 * @param {Object} options - Execution options
 * @param {number} options.timeout - Wait timeout in ms
 * @param {boolean} options.autoAdjustGas - Whether to auto-adjust gas if estimation fails (default: true)
 * @param {function} options.onProgress - Callback for transaction progress updates
 * @param {function} options.onRetry - Callback for retry attempts
 * @param {string} options.txType - Transaction type for error context
 * @return {Object} Confirmed transaction details
 */
export async function executeAndWait(client, txb, keypair, options = {}) {
  // Default options
  const autoAdjustGas = options.autoAdjustGas !== false;
  const progressCallback = options.onProgress || (() => {});
  const txType = options.txType || 'transaction';
  const timeout = options.timeout || runtimeConfig.waitTimeout || DEFAULT_TX_WAIT_TIMEOUT;
  const executionStartTime = Date.now();
  
  // Track transaction phases for detailed progress reporting
  let currentPhase = 'preparing';
  let phaseStartTime = executionStartTime;
  
  const updateProgress = (phase, details = {}) => {
    const now = Date.now();
    const phaseElapsed = now - phaseStartTime;
    const totalElapsed = now - executionStartTime;
    
    try {
      progressCallback({
        phase,
        phaseElapsed,
        totalElapsed,
        timestamp: new Date().toISOString(),
        ...details
      });
    } catch (error) {
      console.warn('Error in progress callback:', error.message);
    }
    
    // Update phase tracking
    if (phase !== currentPhase) {
      currentPhase = phase;
      phaseStartTime = now;
    }
  };
  
  try {
    updateProgress('preparing');
    
    // Get sender address for gas estimation
    const sender = keypair.getPublicKey().toSuiAddress();
    
    // Try to get better gas estimation if needed
    if (autoAdjustGas) {
      try {
        updateProgress('estimating_gas');
        const gasBudget = txb.blockData.gasConfig?.budget;

        // Only estimate gas if not already set to a custom value
        if (!gasBudget || gasBudget === DEFAULT_GAS_BUDGET) {
          // Use enhanced gas estimation with safety factor
          const estimatedGas = await estimateGasCost(client, txb, sender, {
            useSafetyFactor: true,
            retryOnFailure: true
          });
          
          if (estimatedGas > 0) {
            // Apply safety multiplier and cap at max budget
            const safeGas = Math.min(
              Number(estimatedGas),
              MAX_GAS_BUDGET
            );
            
            // Update transaction with estimated gas
            txb.setGasBudget(safeGas);
            
            updateProgress('gas_estimated', {
              estimatedGas: formatGasCost(estimatedGas),
              appliedGas: formatGasCost(BigInt(safeGas))
            });
          }
        }
      } catch (error) {
        console.warn(`Gas estimation failed, using current gas budget: ${error.message}`);
        updateProgress('gas_estimation_failed', { error: error.message });
      }
    }

    // Execute transaction with enhanced retry mechanism
    updateProgress('executing');
    const result = await executeTransactionWithRetry(client, txb, keypair, {
      ...options,
      onProgress: (execProgress) => {
        updateProgress('executing', execProgress);
      },
      onRetry: async (attempt, error, delay) => {
        // Gas-related errors might need adjustment
        if (autoAdjustGas && error.message.toLowerCase().includes('gas')) {
          const currentBudget = txb.blockData.gasConfig?.budget || DEFAULT_GAS_BUDGET;
          const newBudget = Math.min(currentBudget * 1.5, MAX_GAS_BUDGET);
          console.log(`Adjusting gas budget from ${currentBudget} to ${newBudget}`);
          txb.setGasBudget(newBudget);
          
          updateProgress('gas_adjusted', {
            previousGas: formatGasCost(BigInt(currentBudget)),
            newGas: formatGasCost(BigInt(newBudget)),
            retryAttempt: attempt,
            errorType: classifyTransactionError(error)
          });
        }

        // Call user retry handler if provided
        if (options.onRetry) {
          await options.onRetry(attempt, error, delay);
        }
      }
    });

    if (!result || !result.digest) {
      throw new Error('Transaction execution did not return a valid digest');
    }

    // Wait for transaction confirmation with progress updates
    updateProgress('confirming', { digest: result.digest });
    
    const confirmedTx = await waitForTransaction(
      client,
      result.digest,
      timeout,
      {
        onProgress: (waitProgress) => {
          updateProgress('confirming', { 
            ...waitProgress,
            digest: result.digest
          });
        },
        throwOnTimeout: options.throwOnTimeout
      }
    );
    
    // Final success progress update
    updateProgress('completed', {
      digest: result.digest,
      result: confirmedTx,
      totalTime: Date.now() - executionStartTime
    });
    
    return confirmedTx;
  } catch (error) {
    // Provide rich error context for better debugging
    const enhancedError = enhanceTransactionError(error, {
      txType: txType,
      sender: keypair.getPublicKey().toSuiAddress(),
      gasBudget: txb.blockData.gasConfig?.budget,
      phase: currentPhase,
      totalTime: Date.now() - executionStartTime
    });

    // Report final error status
    updateProgress('failed', {
      error: enhancedError,
      message: enhancedError.message,
      errorType: enhancedError.errorType,
      totalTime: Date.now() - executionStartTime
    });

    throw enhancedError;
  }
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
 * Gets a detailed, user-friendly error message from a failed transaction
 * @param {Object} txResult - Transaction result
 * @return {Object} Structured error information
 */
export function getTransactionError(txResult) {
  if (isTransactionSuccessful(txResult)) {
    return null;
  }

  // Extract raw error message
  let rawError = 'Unknown transaction error';
  if (
    txResult &&
    txResult.effects &&
    txResult.effects.status &&
    txResult.effects.status.error
  ) {
    rawError = txResult.effects.status.error;
  }

  // Parse and enhance the error message
  const parsedError = parseBlockchainError(rawError);

  // Add context from transaction details if available
  if (txResult) {
    parsedError.txDigest = txResult.digest || null;
    parsedError.timestamp = txResult.timestampMs || Date.now();

    // Extract gas info if available
    if (txResult.effects && txResult.effects.gasUsed) {
      parsedError.gasUsed = txResult.effects.gasUsed;
    }

    // Check for specific error indicators in events
    if (txResult.events && txResult.events.length > 0) {
      // Look for error events that might provide more context
      const errorEvents = txResult.events.filter(event =>
        event.type && (event.type.includes('Error') || event.type.includes('Failed'))
      );

      if (errorEvents.length > 0) {
        parsedError.errorEvents = errorEvents.map(event => ({
          type: event.type,
          data: event.parsedJson || event
        }));
      }
    }
  }

  return parsedError;
}

/**
 * Parses and enhances blockchain error messages for user-friendly output
 * @param {string} errorMessage - Raw error message from blockchain
 * @return {Object} Structured and user-friendly error information
 */
function parseBlockchainError(errorMessage) {
  // Initialize result with raw error
  const result = {
    originalMessage: errorMessage,
    message: errorMessage,
    type: 'unknown',
    userMessage: 'An error occurred with your transaction',
    suggestion: 'Please try again later'
  };

  // Common error patterns and their user-friendly messages
  const errorPatterns = [
    {
      pattern: /gas.*insufficient|insufficient.*gas/i,
      type: 'gas_insufficient',
      userMessage: 'Insufficient gas for this transaction',
      suggestion: 'Try increasing the gas budget or simplifying the transaction'
    },
    {
      pattern: /gas.*budget.*exceed|exceed.*gas.*budget/i,
      type: 'gas_budget_exceeded',
      userMessage: 'Gas budget exceeded the maximum allowed limit',
      suggestion: 'Reduce the complexity of your transaction'
    },
    {
      pattern: /object.*not.*found|not.*found.*object/i,
      type: 'object_not_found',
      userMessage: 'One or more objects required for this transaction could not be found',
      suggestion: 'Verify that the object IDs are correct and that you own them'
    },
    {
      pattern: /permission.*denied|unauthorized/i,
      type: 'permission_denied',
      userMessage: 'You do not have permission to perform this action',
      suggestion: 'Verify that you own the objects or have the required permissions'
    },
    {
      pattern: /invalid.*signature/i,
      type: 'invalid_signature',
      userMessage: 'Transaction signature is invalid',
      suggestion: 'Ensure your wallet is properly connected and try again'
    },
    {
      pattern: /timeout|timed out/i,
      type: 'timeout',
      userMessage: 'Transaction timed out',
      suggestion: 'The network may be congested. Try again later'
    },
    {
      pattern: /rate.*limit/i,
      type: 'rate_limited',
      userMessage: 'Rate limit exceeded',
      suggestion: 'Please wait a moment before trying again'
    },
    {
      pattern: /network|connection|connectivity/i,
      type: 'network_error',
      userMessage: 'Network connectivity issue',
      suggestion: 'Check your internet connection and try again'
    },
    {
      pattern: /already.*exists|duplicate/i,
      type: 'already_exists',
      userMessage: 'This resource already exists',
      suggestion: 'Use a different name or identifier'
    },
    {
      pattern: /not.*enough.*coin|insufficient.*balance/i,
      type: 'insufficient_funds',
      userMessage: 'Insufficient funds for this transaction',
      suggestion: 'Ensure you have enough SUI to complete this operation'
    },
    {
      pattern: /validation.*failed/i,
      type: 'validation_failed',
      userMessage: 'Transaction validation failed',
      suggestion: 'Check the input parameters and try again'
    },
    {
      pattern: /version|versioning/i,
      type: 'version_mismatch',
      userMessage: 'Version mismatch detected',
      suggestion: 'Ensure you are using compatible versions of all components'
    },
    {
      pattern: /serialization|deserialization/i,
      type: 'serialization_error',
      userMessage: 'Transaction data format error',
      suggestion: 'This may be due to incompatible data structures'
    },
    {
      pattern: /transaction.*too.*large/i,
      type: 'transaction_too_large',
      userMessage: 'Transaction is too large',
      suggestion: 'Split your operation into multiple smaller transactions'
    },
    {
      pattern: /abort/i,
      type: 'move_abort',
      userMessage: 'Smart contract execution aborted',
      suggestion: 'The transaction was rejected by the contract logic'
    }
  ];

  // Check patterns to enhance error information
  for (const pattern of errorPatterns) {
    if (pattern.pattern.test(errorMessage)) {
      result.type = pattern.type;
      result.userMessage = pattern.userMessage;
      result.suggestion = pattern.suggestion;
      break;
    }
  }

  // Extract object IDs from the error message if present
  const objectIdMatches = errorMessage.match(/0x[a-fA-F0-9]{40,64}/g);
  if (objectIdMatches) {
    result.objectIds = objectIdMatches;
  }

  // Create a cleaner message for the user
  result.message = `${result.userMessage}. ${result.suggestion}.`;

  return result;
}

/**
 * Optimized batch processing for blockchain transactions with enhanced concurrency
 * and error recovery
 * @param {Array<Function>} txGenerators - Functions that generate transactions
 * @param {Function} executeFn - Function to execute a transaction
 * @param {Object} options - Batch processing options
 * @param {number} options.concurrency - Maximum concurrent transactions
 * @param {number} options.retryCount - Number of retries per transaction
 * @param {Function} options.onProgress - Progress callback
 * @return {Object} Batch execution results
 */
export async function processBatchWithConcurrency(txGenerators, executeFn, options = {}) {
  const concurrency = options.concurrency || Math.min(MAX_CONCURRENT_TRANSACTIONS, 3);
  const retryCount = options.retryCount || DEFAULT_RETRY_COUNT;
  const continueOnError = options.continueOnError !== false;
  const onProgress = options.onProgress || (() => {});
  
  // Results tracking
  const results = {
    successful: [],
    failed: [],
    total: txGenerators.length,
    completed: 0,
    startTime: Date.now()
  };
  
  // Track active promises
  const activePromises = new Set();
  let index = 0;
  
  // Report initial progress
  try {
    onProgress({
      phase: 'starting',
      total: results.total,
      pending: results.total,
      completed: 0,
      successful: 0,
      failed: 0,
      startTime: results.startTime
    });
  } catch (error) {
    console.warn('Error in progress callback:', error);
  }
  
  // Process transactions with controlled concurrency
  return new Promise((resolve, reject) => {
    // Function to start processing a transaction
    const processNext = async () => {
      if (index >= txGenerators.length) {
        // No more items to process
        if (activePromises.size === 0) {
          // All operations completed
          results.endTime = Date.now();
          results.duration = results.endTime - results.startTime;
          
          // Final progress report
          try {
            onProgress({
              phase: 'complete',
              total: results.total,
              pending: 0,
              completed: results.completed,
              successful: results.successful.length,
              failed: results.failed.length,
              duration: results.duration
            });
          } catch (error) {
            console.warn('Error in progress callback:', error);
          }
          
          resolve(results);
        }
        return;
      }
      
      // Get next transaction generator
      const currentIndex = index++;
      const txGenerator = txGenerators[currentIndex];
      
      // Create a promise for this operation
      const operationPromise = (async () => {
        // Track retries for this transaction
        for (let attempt = 0; attempt <= retryCount; attempt++) {
          try {
            // Generate the transaction
            const tx = await txGenerator();
            
            // Execute the transaction
            const result = await executeFn(tx);
            
            // Record successful result
            results.successful.push({
              index: currentIndex,
              result,
              attempts: attempt + 1
            });
            
            // Update completed count and report progress
            results.completed++;
            try {
              onProgress({
                phase: 'progress',
                total: results.total,
                pending: results.total - results.completed,
                completed: results.completed,
                successful: results.successful.length,
                failed: results.failed.length,
                current: {
                  index: currentIndex,
                  status: 'success',
                  attempts: attempt + 1
                },
                elapsedTime: Date.now() - results.startTime
              });
            } catch (error) {
              console.warn('Error in progress callback:', error);
            }
            
            return result;
          } catch (error) {
            // Last attempt failed
            if (attempt >= retryCount) {
              // Record failed result
              results.failed.push({
                index: currentIndex,
                error,
                attempts: attempt + 1
              });
              
              // Update completed count and report progress
              results.completed++;
              try {
                onProgress({
                  phase: 'progress',
                  total: results.total,
                  pending: results.total - results.completed,
                  completed: results.completed,
                  successful: results.successful.length,
                  failed: results.failed.length,
                  current: {
                    index: currentIndex,
                    status: 'failed',
                    error: error.message,
                    attempts: attempt + 1
                  },
                  elapsedTime: Date.now() - results.startTime
                });
              } catch (progressError) {
                console.warn('Error in progress callback:', progressError);
              }
              
              // If not continuing on error, reject the entire batch
              if (!continueOnError) {
                throw error;
              }
              
              return null;
            }
            
            // Retry with exponential backoff
            const delay = Math.min(1000 * Math.pow(1.5, attempt), 10000);
            console.warn(`Transaction ${currentIndex} failed, retrying in ${delay}ms (${attempt + 1}/${retryCount}):`, error.message);
            
            // Report retry
            try {
              onProgress({
                phase: 'retrying',
                total: results.total,
                current: {
                  index: currentIndex,
                  attempt: attempt + 1,
                  error: error.message,
                  delay
                }
              });
            } catch (progressError) {
              console.warn('Error in progress callback:', progressError);
            }
            
            await sleep(delay);
          }
        }
      })();
      
      // Add to active promises
      activePromises.add(operationPromise);
      
      // Handle promise completion
      operationPromise
        .then(() => {
          activePromises.delete(operationPromise);
          processNext();
        })
        .catch((error) => {
          activePromises.delete(operationPromise);
          
          if (!continueOnError) {
            // Reject the entire batch if any operation fails and continueOnError is false
            reject(error);
          } else {
            // Otherwise continue processing
            processNext();
          }
        });
    };
    
    // Start initial batch of operations up to concurrency limit
    for (let i = 0; i < Math.min(concurrency, txGenerators.length); i++) {
      processNext();
    }
  });
}

/**
 * Optimized batch execution for PR-specific operations with enhanced error handling
 */

/**
 * Estimates gas for PR-specific operations with optimized settings
 * @param {string} operationType - Type of PR operation
 * @param {Object} params - Parameters for the operation
 * @param {Object} options - Estimation options
 * @return {Promise<number>} Estimated gas amount
 */
export async function estimatePROperationGas(operationType, params, options = {}) {
  const client = options.client;
  const sender = options.sender;

  if (!client || !sender) {
    throw new Error('SUI client and sender address are required for gas estimation');
  }

  try {
    const txb = createTransactionBlock();

    // Build transaction based on operation type
    switch (operationType) {
      case 'create_pull_request':
        txb.moveCall({
          target: `${options.packageId}::git_pull_request::create_pull_request`,
          arguments: [
            txb.object(params.repository_id),
            txb.pure(params.source_branch),
            txb.pure(params.target_branch),
            txb.pure(params.title),
            txb.pure(params.description || '')
          ]
        });
        break;

      case 'update_pull_request':
        txb.moveCall({
          target: `${options.packageId}::git_pull_request::update_pull_request`,
          arguments: [
            txb.object(params.pull_request_id),
            txb.pure(params.title),
            txb.pure(params.description || '')
          ]
        });
        break;

      case 'submit_review':
        txb.moveCall({
          target: `${options.packageId}::git_pull_request::submit_review`,
          arguments: [
            txb.object(params.pull_request_id),
            txb.pure(params.verdict),
            txb.pure(params.description || '')
          ]
        });
        break;

      case 'merge_pull_request':
        txb.moveCall({
          target: `${options.packageId}::git_pull_request::merge_pull_request`,
          arguments: [
            txb.object(params.pull_request_id),
            txb.pure(params.merge_strategy)
          ]
        });
        break;

      default:
        return DEFAULT_GAS_BUDGET;
    }

    // Use enhanced gas estimation
    const estimated = await estimateGasCost(client, txb, sender, {
      useSafetyFactor: true,
      safetyFactor: GAS_PRICE_BUFFER_MULTIPLIER,
      retryOnFailure: true
    });

    // Apply operation-specific multipliers for safety
    let multiplier = 1.2; // Default
    
    if (operationType === 'merge_pull_request') {
      multiplier = 1.5; // Merges are complex operations
    } else if (operationType === 'create_pull_request') {
      multiplier = 1.3; // PR creation involves multiple steps
    }

    // Apply multiplier and cap at maximum
    const gasWithMultiplier = BigInt(Number(estimated) * multiplier);
    return Number(gasWithMultiplier < BigInt(MAX_GAS_BUDGET) ? gasWithMultiplier : BigInt(MAX_GAS_BUDGET));
  } catch (error) {
    console.warn(`Failed to estimate gas for ${operationType}:`, error.message);
    return DEFAULT_GAS_BUDGET;
  }
}

/**
 * Batches PR comments for efficient submission with adaptive sizing
 * Uses optimized network batching for better performance
 *
 * @param {Array<Object>} comments - Array of comment data
 * @param {Function} commentFn - Function to add a comment to a transaction
 * @param {Object} options - Batch options
 * @return {Promise<Object>} Processing results
 */
export async function batchPRComments(comments, commentFn, options = {}) {
  // Define a size estimator function for comment operations
  const commentSizeEstimator = (comment) => {
    // Base size for transaction overhead
    const baseSize = 1000;
    // Estimate size of comment data (keys + values)
    const dataSize = JSON.stringify(comment).length * 1.5;  // 1.5x multiplier for encoding overhead
    return baseSize + dataSize;
  };

  // Group comments into efficient batches based on size and complexity
  const commentBatches = [];
  let currentBatch = [];
  let currentBatchSize = 0;
  const batchSizeLimit = Math.min(SUI_TRANSACTION_BLOCK_SIZE_LIMIT * 0.8, 12000); // 80% of limit for safety
  const maxBatchItems = Math.min(options.batchSize || MAX_BATCH_SIZE, MAX_BATCH_SIZE);
  
  for (const comment of comments) {
    const commentSize = commentSizeEstimator(comment);
    
    // Start a new batch if this comment would exceed limits
    if (currentBatch.length >= maxBatchItems || currentBatchSize + commentSize > batchSizeLimit) {
      if (currentBatch.length > 0) {
        commentBatches.push([...currentBatch]);
        currentBatch = [];
        currentBatchSize = 0;
      }
    }
    
    // Add comment to current batch
    currentBatch.push(comment);
    currentBatchSize += commentSize;
  }
  
  // Add the last batch if not empty
  if (currentBatch.length > 0) {
    commentBatches.push(currentBatch);
  }
  
  // Process batches with controlled concurrency
  const maxConcurrent = Math.min(
    options.maxConcurrent || 3,
    MAX_CONCURRENT_TRANSACTIONS,
    Math.max(1, commentBatches.length / 2) // At most half the batches concurrently
  );
  
  // Define transaction generator functions
  const txGenerators = commentBatches.map(batch => {
    return async () => batch; // Just return the batch, commentFn will handle execution
  });
  
  // Track progress
  const startTime = Date.now();
  let completedComments = 0;
  let failedComments = 0;
  
  // Progress tracking function
  const progressTracker = (progressData) => {
    if (options.onProgress) {
      // Count comments in batches
      if (progressData.phase === 'progress' && progressData.current?.status === 'success') {
        const successfulBatchIndex = progressData.current.index;
        completedComments += commentBatches[successfulBatchIndex].length;
      } else if (progressData.phase === 'progress' && progressData.current?.status === 'failed') {
        const failedBatchIndex = progressData.current.index;
        failedComments += commentBatches[failedBatchIndex].length;
      }
      
      // Pass enhanced progress to user callback
      try {
        options.onProgress({
          ...progressData,
          totalComments: comments.length,
          successfulComments: completedComments,
          failedComments: failedComments,
          percentComplete: Math.round((completedComments + failedComments) * 100 / comments.length),
          elapsedTime: Date.now() - startTime
        });
      } catch (error) {
        console.warn('Error in user progress callback:', error.message);
      }
    }
  };
  
  // Process all batches with controlled concurrency
  const result = await processBatchWithConcurrency(txGenerators, commentFn, {
    concurrency: maxConcurrent,
    retryCount: options.maxRetries || 3,
    continueOnError: options.continueOnError !== false,
    onProgress: progressTracker
  });
  
  // Transform results to include comment counts
  return {
    successful: result.successful,
    failed: result.failed,
    total: result.total,
    totalComments: comments.length,
    successfulComments: completedComments,
    failedComments: failedComments,
    duration: Date.now() - startTime
  };
}

/**
 * Optimized transaction execution for PR operations with improved error handling
 * and retry mechanisms
 * @param {TransactionBlock} txb - Transaction block
 * @param {Object} client - Sui client
 * @param {Object} keypair - Keypair for signing
 * @param {Object} options - Execution options
 * @return {Promise<Object>} Transaction result
 */
export async function executePRTransaction(txb, client, keypair, options = {}) {
  // First ensure we have a proper gas budget
  let gasBudget = options.gasBudget;
  const sender = keypair.getPublicKey().toSuiAddress();

  // Estimate gas if not provided
  if (!gasBudget) {
    try {
      const estimatedGas = await estimateGasCost(client, txb, sender, {
        useSafetyFactor: true,
        safetyFactor: options.gasSafetyMultiplier || GAS_PRICE_BUFFER_MULTIPLIER,
        retryOnFailure: true
      });

      // Apply safety multiplier and cap at maximum
      gasBudget = Math.min(Number(estimatedGas), MAX_GAS_BUDGET);
    } catch (error) {
      console.warn('Gas estimation failed, using default budget:', error.message);
      gasBudget = DEFAULT_GAS_BUDGET;
    }
  }

  // Set the gas budget
  txb.setGasBudget(gasBudget);
  
  const txType = options.txType || 'pr_operation';
  
  // Use the enhanced executeAndWait function for better error handling and monitoring
  if (options.waitForConfirmation !== false) {
    return executeAndWait(client, txb, keypair, {
      timeout: options.timeout || DEFAULT_TX_WAIT_TIMEOUT,
      onProgress: options.onProgress,
      autoAdjustGas: options.autoAdjustGas !== false,
      txType,
      throwOnTimeout: options.throwOnTimeout !== false
    });
  } else {
    // Just execute without waiting for confirmation
    return executeTransactionWithRetry(client, txb, keypair, {
      retryCount: options.retryCount || DEFAULT_RETRY_COUNT,
      retryDelay: options.retryDelay || DEFAULT_RETRY_DELAY,
      onProgress: options.onProgress,
      txType
    });
  }
}