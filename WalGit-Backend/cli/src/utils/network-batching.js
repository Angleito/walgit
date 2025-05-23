/**
 * Network Batching Utilities
 * Provides optimized batching strategies for network operations with
 * concurrent processing, size estimation, and adaptive batching.
 */

// Sleep utility
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
import { SUI_TRANSACTION_BLOCK_SIZE_LIMIT, MAX_CONCURRENT_TRANSACTIONS } from './constants.js';

/**
 * Processes items in optimally sized batches with concurrency control
 * @param {Array<any>} items - Items to process in batches
 * @param {Function} processFn - Function to process a batch of items
 * @param {Object} options - Processing options
 * @param {number} options.batchSize - Maximum batch size
 * @param {number} options.concurrency - Maximum concurrent batches
 * @param {Function} options.sizeEstimator - Function to estimate item size
 * @param {number} options.sizeLimit - Maximum batch size limit
 * @param {Function} options.onProgress - Progress callback
 * @return {Promise<Object>} Processing results
 */
export async function processBatchesWithConcurrency(items, processFn, options = {}) {
  // Configuration with defaults
  const batchSize = options.batchSize || 10;
  const concurrency = options.concurrency || Math.min(3, MAX_CONCURRENT_TRANSACTIONS);
  const sizeEstimator = options.sizeEstimator || (() => 1);
  const sizeLimit = options.sizeLimit || SUI_TRANSACTION_BLOCK_SIZE_LIMIT;
  const continueOnError = options.continueOnError !== false;
  const maxRetries = options.maxRetries || 3;
  const onProgress = options.onProgress || (() => {});
  
  // Create optimized batches based on size limits
  const batches = [];
  let currentBatch = [];
  let currentBatchSize = 0;
  
  // Group items into batches respecting size limits
  for (const item of items) {
    const itemSize = sizeEstimator(item);
    
    // Would this item exceed limits?
    if (currentBatch.length >= batchSize || (currentBatchSize + itemSize > sizeLimit)) {
      if (currentBatch.length > 0) {
        batches.push([...currentBatch]);
        currentBatch = [];
        currentBatchSize = 0;
      }
    }
    
    // Add item to the current batch
    currentBatch.push(item);
    currentBatchSize += itemSize;
  }
  
  // Add the last batch if it has items
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }
  
  // Track processing state
  const results = {
    successful: [],
    failed: [],
    total: batches.length,
    completed: 0,
    startTime: Date.now()
  };
  
  // Report initial progress
  try {
    onProgress({
      phase: 'starting',
      totalBatches: batches.length,
      totalItems: items.length,
      pendingBatches: batches.length,
      pendingItems: items.length,
      completedBatches: 0,
      completedItems: 0,
      startTime: results.startTime
    });
  } catch (error) {
    console.warn('Error in progress callback:', error);
  }
  
  // Process batches with controlled concurrency
  const activePromises = new Set();
  let batchIndex = 0;
  let completedItems = 0;
  
  return new Promise((resolve, reject) => {
    // Function to start processing a batch
    const processNextBatch = () => {
      if (batchIndex >= batches.length) {
        // No more batches to process
        if (activePromises.size === 0) {
          // All batches completed
          results.endTime = Date.now();
          results.duration = results.endTime - results.startTime;
          
          // Final progress report
          try {
            onProgress({
              phase: 'complete',
              totalBatches: batches.length,
              totalItems: items.length,
              pendingBatches: 0,
              pendingItems: 0,
              completedBatches: results.completed,
              completedItems: completedItems,
              successfulBatches: results.successful.length,
              failedBatches: results.failed.length,
              duration: results.duration
            });
          } catch (error) {
            console.warn('Error in progress callback:', error);
          }
          
          resolve(results);
        }
        return;
      }
      
      // Get next batch to process
      const currentBatchIndex = batchIndex++;
      const batch = batches[currentBatchIndex];
      
      // Create a promise for this batch operation
      const batchPromise = (async () => {
        // Implement retries for each batch
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            // Process the batch
            const result = await processFn(batch);
            
            // Record successful result
            results.successful.push({
              index: currentBatchIndex,
              items: batch.length,
              result,
              attempts: attempt + 1
            });
            
            // Update completed count and report progress
            results.completed++;
            completedItems += batch.length;
            
            try {
              onProgress({
                phase: 'progress',
                totalBatches: batches.length,
                totalItems: items.length,
                pendingBatches: batches.length - results.completed,
                pendingItems: items.length - completedItems,
                completedBatches: results.completed,
                completedItems: completedItems,
                successfulBatches: results.successful.length,
                failedBatches: results.failed.length,
                current: {
                  batchIndex: currentBatchIndex,
                  batchSize: batch.length,
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
            if (attempt >= maxRetries) {
              // Record failed batch
              results.failed.push({
                index: currentBatchIndex,
                items: batch.length,
                error,
                attempts: attempt + 1
              });
              
              // Update completed count and report progress
              results.completed++;
              
              try {
                onProgress({
                  phase: 'progress',
                  totalBatches: batches.length,
                  totalItems: items.length,
                  pendingBatches: batches.length - results.completed,
                  pendingItems: items.length - completedItems,
                  completedBatches: results.completed,
                  completedItems: completedItems,
                  successfulBatches: results.successful.length,
                  failedBatches: results.failed.length,
                  current: {
                    batchIndex: currentBatchIndex,
                    batchSize: batch.length,
                    status: 'failed',
                    error: error.message,
                    attempts: attempt + 1
                  },
                  elapsedTime: Date.now() - results.startTime
                });
              } catch (progressError) {
                console.warn('Error in progress callback:', progressError);
              }
              
              // If not continuing on error, reject the entire operation
              if (!continueOnError) {
                throw error;
              }
              
              return null;
            }
            
            // Retry with exponential backoff
            const delay = Math.min(1000 * Math.pow(1.5, attempt), 10000);
            console.warn(`Batch ${currentBatchIndex} failed, retrying in ${delay}ms (${attempt + 1}/${maxRetries}):`, error.message);
            
            // Report retry
            try {
              onProgress({
                phase: 'retrying',
                totalBatches: batches.length,
                totalItems: items.length,
                current: {
                  batchIndex: currentBatchIndex,
                  batchSize: batch.length,
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
      
      // Add to active promises and handle completion
      activePromises.add(batchPromise);
      
      batchPromise
        .then(() => {
          activePromises.delete(batchPromise);
          processNextBatch();
        })
        .catch((error) => {
          activePromises.delete(batchPromise);
          
          if (!continueOnError) {
            // Reject the entire operation if we're not continuing on errors
            reject(error);
          } else {
            // Otherwise, continue with the next batch
            processNextBatch();
          }
        });
    };
    
    // Start initial batch of operations up to concurrency limit
    for (let i = 0; i < Math.min(concurrency, batches.length); i++) {
      processNextBatch();
    }
  });
}

/**
 * Splits items into optimally sized batches based on estimated size
 * @param {Array<any>} items - Items to batch
 * @param {Function} sizeEstimator - Function to estimate item size
 * @param {Object} options - Batching options
 * @param {number} options.maxBatchSize - Maximum batch size in items
 * @param {number} options.sizeLimit - Maximum batch size in bytes
 * @return {Array<Array<any>>} Optimally sized batches
 */
export function createOptimalBatches(items, sizeEstimator, options = {}) {
  const maxBatchSize = options.maxBatchSize || 50;
  const sizeLimit = options.sizeLimit || SUI_TRANSACTION_BLOCK_SIZE_LIMIT;
  
  const batches = [];
  let currentBatch = [];
  let currentBatchSize = 0;
  
  for (const item of items) {
    const itemSize = sizeEstimator(item);
    
    // Check if adding this item would exceed limits
    if (currentBatch.length >= maxBatchSize || (currentBatchSize + itemSize > sizeLimit)) {
      if (currentBatch.length > 0) {
        batches.push([...currentBatch]);
        currentBatch = [];
        currentBatchSize = 0;
      }
      
      // If a single item exceeds the size limit, it needs its own batch
      if (itemSize > sizeLimit) {
        console.warn(`Item exceeds size limit (${itemSize} > ${sizeLimit}), placing in its own batch`);
        batches.push([item]);
        continue;
      }
    }
    
    // Add item to current batch
    currentBatch.push(item);
    currentBatchSize += itemSize;
  }
  
  // Add the last batch if not empty
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }
  
  return batches;
}

/**
 * Processes batches sequentially with retries
 * @param {Array<Array<any>>} batches - Batches to process
 * @param {Function} processFn - Function to process a batch
 * @param {Object} options - Processing options
 * @param {number} options.maxRetries - Maximum retries per batch
 * @param {boolean} options.continueOnError - Whether to continue on errors
 * @param {Function} options.onProgress - Progress callback
 * @return {Promise<Object>} Processing results
 */
export async function processSequentially(batches, processFn, options = {}) {
  const maxRetries = options.maxRetries || 3;
  const continueOnError = options.continueOnError !== false;
  const onProgress = options.onProgress || (() => {});
  
  const results = {
    successful: [],
    failed: [],
    total: batches.length,
    startTime: Date.now()
  };
  
  // Report initial progress
  try {
    onProgress({
      phase: 'starting',
      total: batches.length,
      completed: 0,
      startTime: results.startTime
    });
  } catch (error) {
    console.warn('Error in progress callback:', error);
  }
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    
    // Try processing with retries
    let success = false;
    let lastError;
    let result;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Report attempt
        try {
          onProgress({
            phase: 'processing',
            batchIndex: i,
            batchSize: batch.length,
            attempt: attempt + 1,
            maxRetries: maxRetries,
            total: batches.length,
            completed: i,
            elapsedTime: Date.now() - results.startTime
          });
        } catch (error) {
          console.warn('Error in progress callback:', error);
        }
        
        // Process batch
        result = await processFn(batch);
        success = true;
        
        // Record success
        results.successful.push({
          index: i,
          items: batch.length,
          result,
          attempts: attempt + 1
        });
        
        // Report success
        try {
          onProgress({
            phase: 'success',
            batchIndex: i,
            batchSize: batch.length,
            attempt: attempt + 1,
            maxRetries: maxRetries,
            total: batches.length,
            completed: i + 1,
            successful: results.successful.length,
            failed: results.failed.length,
            elapsedTime: Date.now() - results.startTime
          });
        } catch (error) {
          console.warn('Error in progress callback:', error);
        }
        
        break;
      } catch (error) {
        lastError = error;
        
        // Final attempt failed
        if (attempt >= maxRetries) {
          // Record failure
          results.failed.push({
            index: i,
            items: batch.length,
            error,
            attempts: attempt + 1
          });
          
          // Report failure
          try {
            onProgress({
              phase: 'failed',
              batchIndex: i,
              batchSize: batch.length,
              error: error.message,
              attempt: attempt + 1,
              maxRetries: maxRetries,
              total: batches.length,
              completed: i + 1,
              successful: results.successful.length,
              failed: results.failed.length,
              elapsedTime: Date.now() - results.startTime
            });
          } catch (progressError) {
            console.warn('Error in progress callback:', progressError);
          }
          
          if (!continueOnError) {
            throw error;
          }
          
          break;
        }
        
        // Prepare for retry
        const delay = Math.min(1000 * Math.pow(1.5, attempt), 10000);
        
        // Report retry
        try {
          onProgress({
            phase: 'retrying',
            batchIndex: i,
            batchSize: batch.length,
            error: error.message,
            attempt: attempt + 1,
            maxRetries: maxRetries,
            delay,
            total: batches.length,
            completed: i,
            elapsedTime: Date.now() - results.startTime
          });
        } catch (progressError) {
          console.warn('Error in progress callback:', progressError);
        }
        
        // Wait before retrying
        await sleep(delay);
      }
    }
    
    // Check if we failed and should stop
    if (!success && !continueOnError) {
      throw lastError;
    }
  }
  
  // Final results
  results.endTime = Date.now();
  results.duration = results.endTime - results.startTime;
  
  // Report completion
  try {
    onProgress({
      phase: 'complete',
      total: batches.length,
      completed: batches.length,
      successful: results.successful.length,
      failed: results.failed.length,
      duration: results.duration
    });
  } catch (error) {
    console.warn('Error in progress callback:', error);
  }
  
  return results;
}

// Export as default object
export default {
  processBatchesWithConcurrency,
  createOptimalBatches,
  processSequentially
};