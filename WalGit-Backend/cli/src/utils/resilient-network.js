/**
 * Resilient Network Integration
 * 
 * This module integrates the network resilience patterns with the existing
 * transaction and Walrus storage utilities in WalGit. It provides a unified
 * interface for making network calls with enhanced resilience features like:
 * 
 * - Circuit breaker pattern to prevent cascading failures
 * - Enhanced retry strategies with jitter and backoff
 * - Adaptive network parameters based on health monitoring
 * - Detailed failure tracking and analytics
 * - Network-aware operation batching
 */

import { 
  CircuitBreaker, 
  getCircuitBreaker, 
  withRetry, 
  withCircuitBreaker,
  withNetworkAwareness,
  networkMonitor,
  createResilience
} from './network-resilience.js';

import {
  executeTransactionWithRetry,
  executeAndWait,
  batchTransactions,
  processBatchWithConcurrency
} from './transaction-utils.js';

import failureLogger, {
  withFailureTracking,
  createAnalyticsEnabledCircuitBreaker
} from './failure-analytics.js';

import { getSettings } from './config.js';

// Default circuit breaker configurations for different services
const DEFAULT_CIRCUIT_CONFIGS = {
  // Circuit breaker for Sui blockchain interactions
  sui: {
    failureThreshold: 5,
    resetTimeout: 30000, // 30 seconds
    halfOpenSuccessThreshold: 2
  },
  
  // Circuit breaker for Walrus storage interactions
  walrus: {
    failureThreshold: 3,
    resetTimeout: 20000, // 20 seconds
    halfOpenSuccessThreshold: 1
  },
  
  // Circuit breaker for general network operations
  network: {
    failureThreshold: 4,
    resetTimeout: 25000, // 25 seconds
    halfOpenSuccessThreshold: 2
  }
};

// Initialize circuit breakers for key services
const suiCircuitBreaker = createAnalyticsEnabledCircuitBreaker(
  'sui-network',
  DEFAULT_CIRCUIT_CONFIGS.sui,
  'blockchain-transaction',
  'sui-client'
);

const walrusCircuitBreaker = createAnalyticsEnabledCircuitBreaker(
  'walrus-storage',
  DEFAULT_CIRCUIT_CONFIGS.walrus,
  'storage-operation',
  'walrus-client'
);

const networkCircuitBreaker = createAnalyticsEnabledCircuitBreaker(
  'general-network',
  DEFAULT_CIRCUIT_CONFIGS.network,
  'network-request',
  'http-client'
);

/**
 * Creates a resilient execution strategy for network operations
 * Combines circuit breaker, retry logic, and failure tracking
 * 
 * @param {string} operationType - Type of operation (e.g., 'sui', 'walrus', 'network')
 * @param {Object} options - Resilience options
 * @returns {Function} Resilient execution function
 */
export function createResilientStrategy(operationType, options = {}) {
  // Get the appropriate circuit breaker for this operation type
  let circuitBreaker;
  switch (operationType) {
    case 'sui':
      circuitBreaker = suiCircuitBreaker;
      break;
    case 'walrus':
      circuitBreaker = walrusCircuitBreaker;
      break;
    default:
      circuitBreaker = networkCircuitBreaker;
  }
  
  // Get user settings for resilience configuration
  const settings = getSettings();
  const resilientConfig = settings?.resilience || {};
  
  // Create base resilience options
  const baseOptions = {
    // Circuit breaker options
    circuitName: circuitBreaker.name,
    bypassCircuit: options.bypassCircuit || false,
    
    // Retry options
    retryCount: options.retryCount || resilientConfig.retryCount || 5,
    retryDelay: options.retryDelay || resilientConfig.retryDelay || 2000,
    backoffFactor: options.backoffFactor || resilientConfig.backoffFactor || 1.5,
    
    // Network awareness
    networkAware: options.networkAware !== false && resilientConfig.networkAware !== false,
    
    // Batch options
    batchSize: options.batchSize || resilientConfig.batchSize || 10,
    concurrency: options.concurrency || resilientConfig.concurrency || 3,
    
    // Custom options
    ...options
  };
  
  // Create the resilience wrapper function
  return createResilience(baseOptions);
}

/**
 * Executes a Sui blockchain transaction with enhanced resilience
 * 
 * @param {SuiClient} client - Sui client instance
 * @param {TransactionBlock} txBlock - Transaction block to execute
 * @param {Ed25519Keypair} keypair - Keypair for signing
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Transaction result
 */
export async function executeSuiTransaction(client, txBlock, keypair, options = {}) {
  // Create resilient strategy specifically for Sui transactions
  const resilientExecute = createResilientStrategy('sui', {
    ...options,
    circuitName: 'sui-transaction'
  });
  
  // Prepare the context for failure tracking
  const context = {
    operation: options.operation || 'execute-transaction',
    component: 'sui-client',
    category: 'transaction',
    severity: options.critical ? 'critical' : 'error',
    metadata: {
      transactionType: options.txType || 'unknown',
      waitForConfirmation: options.waitForConfirmation !== false
    }
  };
  
  // Execute with all resilience features
  return withFailureTracking(
    async () => resilientExecute(
      async () => {
        // Use the existing executeTransactionWithRetry or executeAndWait function
        if (options.waitForConfirmation !== false) {
          return executeAndWait(client, txBlock, keypair, options);
        } else {
          return executeTransactionWithRetry(client, txBlock, keypair, options);
        }
      }
    ),
    context
  );
}

/**
 * Executes a Walrus storage operation with enhanced resilience
 * 
 * @param {Function} operation - Storage operation function to execute
 * @param {Object} options - Execution options
 * @returns {Promise<any>} Operation result
 */
export async function executeWalrusOperation(operation, options = {}) {
  // Create resilient strategy specifically for Walrus operations
  const resilientExecute = createResilientStrategy('walrus', {
    ...options,
    circuitName: 'walrus-operation'
  });
  
  // Prepare the context for failure tracking
  const context = {
    operation: options.operation || 'walrus-storage',
    component: 'walrus-client',
    category: 'storage',
    severity: options.critical ? 'critical' : 'error',
    metadata: {
      operationType: options.type || 'unknown',
      contentSize: options.size,
      contentHash: options.hash
    }
  };
  
  // Execute with all resilience features
  return withFailureTracking(
    async () => resilientExecute(
      async () => operation(options)
    ),
    context
  );
}

/**
 * Performs a network request with enhanced resilience
 * 
 * @param {Function} requestFn - Network request function
 * @param {Object} options - Request options
 * @returns {Promise<any>} Request result
 */
export async function resilientNetworkRequest(requestFn, options = {}) {
  // Create resilient strategy for generic network requests
  const resilientExecute = createResilientStrategy('network', {
    ...options,
    circuitName: options.circuitName || 'network-request'
  });
  
  // Prepare the context for failure tracking
  const context = {
    operation: options.operation || 'network-request',
    component: options.component || 'http-client',
    category: 'network',
    severity: options.severity || 'error',
    metadata: {
      url: options.url,
      method: options.method || 'GET'
    }
  };
  
  // Execute with all resilience features
  return withFailureTracking(
    async () => resilientExecute(
      async () => requestFn(options)
    ),
    context
  );
}

/**
 * Process a batch of operations with resilience and concurrency control
 * 
 * @param {Array<Function>} operations - Array of operations to execute in batch
 * @param {Function} executeFn - Function to execute a single operation
 * @param {Object} options - Batch processing options
 * @returns {Promise<Object>} Batch processing results
 */
export async function processBatchResilient(operations, executeFn, options = {}) {
  // Get network-aware recommendations for batch processing
  await networkMonitor.isNetworkHealthy();
  const networkRecommendations = networkMonitor.getNetworkAwareRecommendations({
    batchSize: options.batchSize,
    concurrency: options.concurrency,
    retryCount: options.retryCount
  });
  
  // Prepare enhanced options with network awareness
  const enhancedOptions = {
    ...options,
    concurrency: options.concurrency || networkRecommendations.concurrency,
    retryCount: options.retryCount || networkRecommendations.retryCount,
    onProgress: options.onProgress,
    networkConditions: networkRecommendations
  };
  
  // Prepare the context for failure tracking
  const context = {
    operation: options.operation || 'batch-processing',
    component: options.component || 'batch-executor',
    category: 'batch',
    metadata: {
      operationCount: operations.length,
      batchType: options.batchType || 'unknown'
    }
  };
  
  // Execute with failure tracking
  return withFailureTracking(
    async () => processBatchWithConcurrency(
      operations,
      executeFn,
      enhancedOptions
    ),
    context
  );
}

/**
 * Creates network-aware transaction batches with optimized sizing
 * 
 * @param {Array<Function>} txFunctions - Functions that add transactions
 * @param {Object} options - Batching options
 * @returns {Array<TransactionBlock>} Optimized transaction batches
 */
export function createResilientBatches(txFunctions, options = {}) {
  // Get network-aware recommendations for batch size
  const networkRecommendations = networkMonitor.getNetworkAwareRecommendations({
    batchSize: options.maxBatchSize
  });
  
  // Prepare enhanced options with network awareness
  const enhancedOptions = {
    ...options,
    maxBatchSize: options.maxBatchSize || networkRecommendations.batchSize,
    adaptiveBatching: options.adaptiveBatching !== false,
    strictSizeLimit: options.strictSizeLimit !== false
  };
  
  // Use the existing batchTransactions function with enhanced options
  return batchTransactions(txFunctions, enhancedOptions);
}

/**
 * Gets the current health status of network services
 * 
 * @returns {Object} Health status for different services
 */
export function getNetworkHealth() {
  return {
    sui: suiCircuitBreaker.getHealth(),
    walrus: walrusCircuitBreaker.getHealth(),
    network: networkCircuitBreaker.getHealth(),
    monitor: {
      status: networkMonitor.networkStatus,
      latency: networkMonitor.getAverageLatency(),
      recommendations: networkMonitor.getNetworkAwareRecommendations()
    },
    failures: {
      trends: failureLogger.getFailureStats(),
      patterns: failureLogger.analyzeFailurePatterns({includeVisualization: false})
    }
  };
}

/**
 * Resets the network health status and clears circuit breakers
 * Useful after resolving known network issues
 */
export function resetNetworkStatus() {
  // Reset all circuit breakers
  suiCircuitBreaker.reset();
  walrusCircuitBreaker.reset();
  networkCircuitBreaker.reset();
  
  // Clear any cached network status
  networkMonitor.failureCount = 0;
  networkMonitor.successCount = 0;
  networkMonitor.networkStatus = 'unknown';
  
  return {
    success: true,
    message: 'Network health status has been reset'
  };
}

export default {
  // Resilient execution strategies
  createResilientStrategy,
  executeSuiTransaction,
  executeWalrusOperation,
  resilientNetworkRequest,
  processBatchResilient,
  createResilientBatches,
  
  // Health monitoring
  getNetworkHealth,
  resetNetworkStatus,
  
  // Access to underlying components
  monitor: networkMonitor,
  analytics: failureLogger,
  circuits: {
    sui: suiCircuitBreaker,
    walrus: walrusCircuitBreaker,
    network: networkCircuitBreaker,
    getCircuitBreaker
  }
};