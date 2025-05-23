/**
 * Utility Module Index
 * Provides centralized access to enhanced blockchain utilities
 */

// Core utilities
export * from './transaction-utils.js';
export * from './blockchain-transaction-handler.js';
export * from './batch-transaction-manager.js';
export * from './config.js';
export * from './constants.js';

// Network resilience framework
export * from './resilience-index.js';

// Feature-specific utilities
export * from './auth.js';
export * from './repository.js';
export * from './sui-integration.js';
export * from './walrus-integration.js';
export * from './optimized-storage.js';
export * from './pr-transaction-manager.js';
export * from './blob-manager.js';
export * from './tree-builder.js';
export * from './format-utils.js';
export * from './error-handler.js';
export * from './code-review-manager.js';
export * from './working-directory.js';

// Import the handlers for better organization
import BlockchainTransactionHandler from './blockchain-transaction-handler.js';
import BatchTransactionManager from './batch-transaction-manager.js';
import {
  networkMonitor,
  withNetworkAwareness,
  withRetry,
  getCircuitBreaker,
  withCircuitBreaker,
  createResilience,
  getAllCircuitBreakers
} from './network-resilience.js';
import resilientNetwork, {
  executeSuiTransaction,
  executeWalrusOperation,
  resilientNetworkRequest,
  processBatchResilient,
  createResilientBatches,
  getNetworkHealth,
  resetNetworkStatus
} from './resilient-network.js';
import failureLogger from './failure-analytics.js';

/**
 * Enhanced blockchain utilities for resilient blockchain operations
 */
export const blockchain = {
  /**
   * Execute a transaction with enhanced error handling and user feedback
   * @param {SuiClient} client - Sui client
   * @param {TransactionBlock} txb - Transaction block
   * @param {Object} keypair - Keypair for signing
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Transaction results
   */
  executeTransaction: BlockchainTransactionHandler.executeTransaction.bind(BlockchainTransactionHandler),
  
  /**
   * Wait for a transaction to complete with enhanced monitoring
   * @param {SuiClient} client - Sui client
   * @param {string} txDigest - Transaction digest
   * @param {Object} options - Wait options
   * @returns {Promise<Object>} Transaction details
   */
  waitForTransaction: BlockchainTransactionHandler.waitForTransaction.bind(BlockchainTransactionHandler),
  
  /**
   * Get detailed transaction status
   * @param {SuiClient} client - Sui client
   * @param {string} txDigest - Transaction digest
   * @returns {Promise<Object>} Transaction status
   */
  getTransactionStatus: BlockchainTransactionHandler.getTransactionStatus.bind(BlockchainTransactionHandler),
  
  /**
   * Process a batch of operations with optimal concurrency and retry
   * @param {Array<Function>} operations - Array of operation functions
   * @param {Function} executor - Function to execute operations
   * @param {Object} options - Batch processing options
   * @returns {Promise<Object>} Processing results
   */
  processBatch: BatchTransactionManager.processBatch.bind(BatchTransactionManager),
  
  /**
   * Process a batch of files with optimal concurrency
   * @param {Array<Object>} files - Array of file objects
   * @param {Function} processor - Function to process each file
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processing results
   */
  processFileBatch: BatchTransactionManager.processFileBatch.bind(BatchTransactionManager),
  
  /**
   * Execute multiple blockchain transactions with optimal batching
   * @param {Array<Function>} txGenerators - Transaction generator functions
   * @param {SuiClient} client - Sui client
   * @param {Object} keypair - Keypair for signing
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Execution results
   */
  executeTransactions: BatchTransactionManager.executeTransactions.bind(BatchTransactionManager),
  
  /**
   * Get network health monitor instance
   * @returns {NetworkHealthMonitor} Network health monitor
   */
  getNetworkMonitor: () => networkMonitor,
  
  /**
   * Execute an operation with network-aware parameters
   * @param {Function} operation - Operation to execute
   * @param {Object} options - Operation options
   * @returns {Promise<any>} Operation result
   */
  withNetworkAwareness,
  
  /**
   * Execute an operation with retry logic
   * @param {Function} fn - Function to retry
   * @param {Object} options - Retry options
   * @returns {Promise<any>} Function result
   */
  withRetry,

  /**
   * Get or create a circuit breaker for a service
   * @param {string} name - Service name
   * @param {Object} options - Circuit breaker options
   * @returns {CircuitBreaker} Circuit breaker instance
   */
  getCircuitBreaker,

  /**
   * Execute an operation with circuit breaker protection
   * @param {string} circuitName - Circuit breaker name
   * @param {Function} operation - Operation to execute
   * @param {Object} options - Execution options
   * @returns {Promise<any>} Operation result
   */
  withCircuitBreaker,

  /**
   * Create a resilience wrapper with circuit breaker, network awareness, and retry
   * @param {Object} options - Resilience options
   * @returns {Function} Resilient operation wrapper
   */
  createResilience,

  /**
   * Get all registered circuit breakers
   * @returns {Map<string, CircuitBreaker>} Circuit breakers
   */
  getAllCircuitBreakers
};

/**
 * Enhanced resilience utilities for network operations
 */
export const resilience = {
  // Core resilience patterns
  network: resilientNetwork,
  failures: failureLogger,

  // Resilient execution functions
  executeSuiTransaction,
  executeWalrusOperation,
  resilientNetworkRequest,
  processBatchResilient,
  createResilientBatches,

  // Network health monitoring and management
  getNetworkHealth,
  resetNetworkStatus,

  // Legacy helpers for backward compatibility
  withNetworkAwareness,
  withRetry,
  withCircuitBreaker,
  createResilience,
  getCircuitBreaker,
  getAllCircuitBreakers
};

export default {
  blockchain,
  resilience
};