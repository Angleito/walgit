/**
 * Batch Transaction Manager
 * Provides efficient batching strategies for various transaction types with optimized
 * concurrency control, intelligent retry mechanisms, and detailed progress reporting.
 */

import { 
  batchTransactions, 
  processBatchWithConcurrency, 
  executeAndWait, 
  DEFAULT_RETRY_COUNT,
  DEFAULT_RETRY_DELAY,
  DEFAULT_TX_WAIT_TIMEOUT
} from './transaction-utils.js';

import {
  MAX_BATCH_SIZE,
  MAX_CONCURRENT_TRANSACTIONS,
  SUI_TRANSACTION_BLOCK_SIZE_LIMIT,
  DEFAULT_GAS_BUDGET
} from './constants.js';

/**
 * BatchTransactionManager provides optimized batching for different types of
 * blockchain operations with smart retry, error recovery, and reporting.
 */
export class BatchTransactionManager {
  /**
   * Processes a batch of operations with optimal transaction grouping and concurrency
   * @param {Array<Function>} operations - Functions that generate transactions
   * @param {Function} executeFn - Function to execute each transaction
   * @param {Object} options - Batch processing options 
   * @returns {Promise<Object>} Processing results
   */
  static async processBatch(operations, executeFn, options = {}) {
    // Default and sanitize options
    const concurrency = Math.min(
      options.concurrency || 3,
      MAX_CONCURRENT_TRANSACTIONS
    );
    
    const batchSize = Math.min(
      options.batchSize || MAX_BATCH_SIZE,
      MAX_BATCH_SIZE
    );
    
    const retryCount = options.retryCount || DEFAULT_RETRY_COUNT;
    const initialDelay = options.retryDelay || DEFAULT_RETRY_DELAY;
    const continueOnError = options.continueOnError !== false;
    const adaptiveBatching = options.adaptiveBatching !== false;
    const progressCallback = options.onProgress || (() => {});
    
    // Define groups - a smart way to group operations that should go together
    const txGroups = this._groupOperations(operations, {
      batchSize,
      maxBlockSize: options.maxBlockSize || SUI_TRANSACTION_BLOCK_SIZE_LIMIT * 0.8,
      adaptiveBatching
    });
    
    // Process groups with controlled concurrency
    const results = await processBatchWithConcurrency(
      txGroups,
      async (group) => {
        try {
          return await executeFn(group);
        } catch (error) {
          if (group.length === 1 || !adaptiveBatching) {
            // Single operation or non-adaptive - just rethrow
            throw error;
          }
          
          // For batch failures with multiple operations, we'll retry each individually
          console.warn(`Batch of ${group.length} operations failed, retrying individually`);
          
          // Process each operation individually
          const individualResults = {
            successful: [],
            failed: []
          };
          
          for (let i = 0; i < group.length; i++) {
            try {
              const result = await executeFn([group[i]]);
              individualResults.successful.push({
                index: i,
                result,
                originalIndex: group[i].originalIndex
              });
            } catch (error) {
              individualResults.failed.push({
                index: i,
                error,
                originalIndex: group[i].originalIndex
              });
            }
          }
          
          // If all operations failed, rethrow the original error
          if (individualResults.successful.length === 0) {
            throw error;
          }
          
          // Return partial results
          return individualResults;
        }
      },
      {
        concurrency,
        retryCount,
        retryDelay: initialDelay,
        continueOnError,
        onProgress: (data) => {
          // Enhanced progress reporting
          const enhancedData = this._enhanceProgressData(data, operations.length, txGroups);
          progressCallback(enhancedData);
        }
      }
    );
    
    // Process and normalize results
    return this._normalizeResults(results, operations);
  }
  
  /**
   * Intelligently groups operations into optimal batches
   * @param {Array<Function>} operations - Operations to group
   * @param {Object} options - Grouping options
   * @returns {Array<Array<Function>>} Grouped operations
   * @private
   */
  static _groupOperations(operations, options) {
    const { batchSize, maxBlockSize, adaptiveBatching } = options;
    
    if (!adaptiveBatching || operations.length <= 1) {
      // If not using adaptive batching or only one operation, return simple groups
      const groups = [];
      for (let i = 0; i < operations.length; i += batchSize) {
        groups.push(
          operations.slice(i, i + batchSize).map((op, idx) => ({
            ...op,
            originalIndex: i + idx
          }))
        );
      }
      return groups;
    }
    
    // Adaptive batching strategy
    const groups = [];
    let currentGroup = [];
    let currentSize = 0;
    const sizeEstimateMultiplier = 1.2; // Safety buffer for size estimates
    
    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      
      // Estimate size - either from operation metadata or use default
      const opSize = (op.estimatedSize || 1000) * sizeEstimateMultiplier;
      
      // Check if adding this operation would exceed batch limits
      if (currentGroup.length >= batchSize || 
          (currentSize + opSize > maxBlockSize && currentGroup.length > 0)) {
        // Finalize current group and start a new one
        groups.push([...currentGroup]);
        currentGroup = [];
        currentSize = 0;
      }
      
      // Add operation to current group with original index
      currentGroup.push({
        ...op,
        originalIndex: i
      });
      currentSize += opSize;
    }
    
    // Add final group if not empty
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    
    return groups;
  }
  
  /**
   * Enhances progress data with useful metrics
   * @param {Object} progressData - Raw progress data
   * @param {number} totalOperations - Total number of operations
   * @param {Array<Array>} groups - Operation groups
   * @returns {Object} Enhanced progress data
   * @private
   */
  static _enhanceProgressData(progressData, totalOperations, groups) {
    const totalGroups = groups.length;
    let operationsProcessed = 0;
    
    // Calculate operations processed
    if (progressData.completed) {
      for (let i = 0; i < progressData.completed; i++) {
        operationsProcessed += groups[i].length;
      }
    }
    
    // Add operations in current batch if partially complete
    if (progressData.current && progressData.current.index < groups.length) {
      if (progressData.current.status === 'success') {
        operationsProcessed += groups[progressData.current.index].length;
      } else if (progressData.current.individualResults) {
        operationsProcessed += progressData.current.individualResults.successful.length;
      }
    }
    
    // Calculate percentages
    const groupPercentComplete = Math.round((progressData.completed / totalGroups) * 100);
    const operationsPercentComplete = Math.round((operationsProcessed / totalOperations) * 100);
    
    // Return enhanced data
    return {
      ...progressData,
      totalOperations,
      operationsProcessed,
      operationsPercentComplete,
      groupPercentComplete,
      totalGroups
    };
  }
  
  /**
   * Normalizes and combines batch processing results
   * @param {Object} batchResults - Results from batch processing
   * @param {Array} originalOperations - Original operations
   * @returns {Object} Normalized results
   * @private
   */
  static _normalizeResults(batchResults, originalOperations) {
    // Map successes and failures back to original operations
    const successful = [];
    const failed = [];
    
    // Process successful batches
    for (const success of batchResults.successful) {
      if (Array.isArray(success.result.successful)) {
        // This was an individually processed batch
        for (const item of success.result.successful) {
          successful.push({
            index: item.originalIndex,
            result: item.result,
            operation: originalOperations[item.originalIndex]
          });
        }
        
        // Also record individual failures
        for (const item of success.result.failed) {
          failed.push({
            index: item.originalIndex,
            error: item.error,
            operation: originalOperations[item.originalIndex]
          });
        }
      } else {
        // This was a batch processed together
        const batch = success.result;
        const group = batch.group || [];
        
        for (const op of group) {
          successful.push({
            index: op.originalIndex,
            result: batch,
            operation: originalOperations[op.originalIndex]
          });
        }
      }
    }
    
    // Process failed batches
    for (const failure of batchResults.failed) {
      const group = failure.group || [];
      
      for (const op of group) {
        failed.push({
          index: op.originalIndex,
          error: failure.error,
          operation: originalOperations[op.originalIndex]
        });
      }
    }
    
    return {
      successful: successful.sort((a, b) => a.index - b.index),
      failed: failed.sort((a, b) => a.index - b.index),
      total: originalOperations.length,
      successCount: successful.length,
      failureCount: failed.length,
      completedBatches: batchResults.successful.length,
      failedBatches: batchResults.failed.length,
      duration: batchResults.duration
    };
  }
  
  /**
   * Executes a file operations batch with optimized concurrency and chunking
   * @param {Array<Object>} files - Array of file objects to process
   * @param {Function} processFile - Function to process each file
   * @param {Object} options - Options for batch processing
   * @returns {Promise<Object>} Results of file processing
   */
  static async processFileBatch(files, processFile, options = {}) {
    // Convert files to operation functions
    const operations = files.map((file, index) => ({
      execute: async () => {
        return processFile(file);
      },
      estimatedSize: file.size || 5000,
      originalIndex: index
    }));
    
    // Execute batch with our general batch processor
    return this.processBatch(
      operations,
      async (group) => {
        const results = await Promise.all(group.map(op => op.execute()));
        return {
          results,
          group
        };
      },
      {
        ...options,
        // Default to more aggressive batching for files
        batchSize: options.batchSize || Math.min(MAX_BATCH_SIZE, 20),
        concurrency: options.concurrency || Math.min(MAX_CONCURRENT_TRANSACTIONS, 3)
      }
    );
  }
  
  /**
   * Executes blockchain transactions in batches with optimal concurrency and retry logic
   * @param {Array<Function>} txGenerators - Functions that generate transactions
   * @param {SuiClient} client - Sui client
   * @param {Object} keyPair - Keypair for signing
   * @param {Object} options - Transaction execution options
   * @returns {Promise<Object>} Transaction results
   */
  static async executeTransactions(txGenerators, client, keyPair, options = {}) {
    // Convert generator functions to executable operations
    const operations = txGenerators.map((generator, index) => ({
      execute: async () => {
        const txb = await generator();
        
        // Execute the transaction with wait and enhanced retry
        return executeAndWait(client, txb, keyPair, {
          timeout: options.waitTimeout || DEFAULT_TX_WAIT_TIMEOUT,
          autoAdjustGas: options.autoAdjustGas !== false,
          retryCount: options.txRetryCount || DEFAULT_RETRY_COUNT,
          onProgress: options.onTxProgress,
          txType: options.txType || 'batch_tx'
        });
      },
      originalIndex: index
    }));
    
    // Use our batch processor to execute transactions
    return this.processBatch(
      operations,
      async (group) => {
        const results = await Promise.all(group.map(op => op.execute()));
        return {
          results,
          group
        };
      },
      {
        concurrency: options.concurrency || 2, // Lower concurrency for blockchain txs
        retryCount: options.batchRetryCount || 2,
        continueOnError: options.continueOnError !== false,
        onProgress: options.onProgress
      }
    );
  }
}

export default BatchTransactionManager;