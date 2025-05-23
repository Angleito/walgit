/**
 * Parallel Operations
 * Provides utilities for executing operations in parallel with
 * adaptive concurrency and workload management for optimal performance.
 */

// Default configuration
const DEFAULT_MAX_CONCURRENCY = 10;
const DEFAULT_CHUNK_SIZE = 100;
const DEFAULT_ADAPTIVE = true;

/**
 * Executes operations in parallel with adaptive concurrency
 * @param {Array<Function>} operations - Functions to execute
 * @param {Object} options - Execution options
 * @param {number} options.maxConcurrency - Maximum concurrent operations
 * @param {boolean} options.adaptive - Whether to use adaptive concurrency
 * @param {Function} options.onProgress - Progress callback
 * @return {Promise<Array>} Results of operations
 */
export async function executeInParallel(operations, options = {}) {
  const maxConcurrency = options.maxConcurrency || DEFAULT_MAX_CONCURRENCY;
  const adaptive = options.adaptive !== false;
  const onProgress = options.onProgress || (() => {});
  
  // Results array (in original order)
  const results = new Array(operations.length);
  
  // Track active operations
  let activeCount = 0;
  let nextIndex = 0;
  let completedCount = 0;
  
  // Performance tracking
  const startTime = Date.now();
  const operationTimes = [];
  let adaptiveConcurrency = Math.min(maxConcurrency, operations.length);
  
  // Initial progress report
  try {
    onProgress({
      phase: 'starting',
      total: operations.length,
      active: 0,
      completed: 0,
      concurrency: adaptiveConcurrency,
      startTime
    });
  } catch (error) {
    console.warn('Error in progress callback:', error);
  }
  
  return new Promise((resolve, reject) => {
    // Function to start a new operation
    const startNextOperation = () => {
      if (nextIndex >= operations.length) {
        // No more operations to start
        if (activeCount === 0) {
          // All operations completed
          try {
            onProgress({
              phase: 'complete',
              total: operations.length,
              completed: completedCount,
              averageTime: operationTimes.reduce((a, b) => a + b, 0) / operationTimes.length,
              totalTime: Date.now() - startTime
            });
          } catch (error) {
            console.warn('Error in progress callback:', error);
          }
          
          resolve(results);
        }
        return;
      }
      
      // Start the next operation
      const opIndex = nextIndex++;
      activeCount++;
      
      const opStartTime = Date.now();
      
      // Report progress
      try {
        onProgress({
          phase: 'executing',
          total: operations.length,
          active: activeCount,
          completed: completedCount,
          next: opIndex,
          concurrency: adaptiveConcurrency,
          elapsedTime: opStartTime - startTime
        });
      } catch (error) {
        console.warn('Error in progress callback:', error);
      }
      
      // Execute the operation
      Promise.resolve()
        .then(() => operations[opIndex]())
        .then(result => {
          // Record result
          results[opIndex] = result;
          
          // Update counters
          activeCount--;
          completedCount++;
          
          // Track operation time
          const opTime = Date.now() - opStartTime;
          operationTimes.push(opTime);
          
          // Update adaptive concurrency if enabled
          if (adaptive && operationTimes.length >= 5) {
            // Use moving average of last 5 operation times
            const recentAvg = operationTimes.slice(-5).reduce((a, b) => a + b, 0) / 5;
            
            // If operations are fast (< 50ms), increase concurrency, otherwise decrease
            if (recentAvg < 50 && adaptiveConcurrency < maxConcurrency) {
              adaptiveConcurrency = Math.min(adaptiveConcurrency + 1, maxConcurrency);
            } else if (recentAvg > 200 && adaptiveConcurrency > 1) {
              adaptiveConcurrency = Math.max(adaptiveConcurrency - 1, 1);
            }
          }
          
          // Report progress
          try {
            onProgress({
              phase: 'progress',
              total: operations.length,
              active: activeCount,
              completed: completedCount,
              currentIndex: opIndex,
              opTime,
              concurrency: adaptiveConcurrency,
              elapsedTime: Date.now() - startTime
            });
          } catch (error) {
            console.warn('Error in progress callback:', error);
          }
          
          // Start more operations if needed
          while (activeCount < adaptiveConcurrency && nextIndex < operations.length) {
            startNextOperation();
          }
        })
        .catch(error => {
          // Handle operation error
          activeCount--;
          
          try {
            onProgress({
              phase: 'error',
              total: operations.length,
              active: activeCount,
              completed: completedCount,
              currentIndex: opIndex,
              error: error.message,
              elapsedTime: Date.now() - startTime
            });
          } catch (progressError) {
            console.warn('Error in progress callback:', progressError);
          }
          
          reject(error);
        });
    };
    
    // Start initial batch of operations
    for (let i = 0; i < adaptiveConcurrency && i < operations.length; i++) {
      startNextOperation();
    }
  });
}

/**
 * Processes a large array in chunks with parallel execution
 * @param {Array} items - Items to process
 * @param {Function} processFn - Function to process each item
 * @param {Object} options - Processing options
 * @param {number} options.chunkSize - Size of each chunk
 * @param {number} options.maxConcurrency - Maximum concurrent chunks
 * @param {Function} options.onProgress - Progress callback
 * @return {Promise<Array>} Results of processing
 */
export async function processInChunks(items, processFn, options = {}) {
  const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;
  const maxConcurrency = options.maxConcurrency || DEFAULT_MAX_CONCURRENCY;
  const onProgress = options.onProgress || (() => {});
  
  // Split items into chunks
  const chunks = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  
  // Create operations for each chunk
  const chunkOperations = chunks.map((chunk, chunkIndex) => {
    return async () => {
      // Process all items in this chunk
      const chunkResults = await Promise.all(
        chunk.map((item, itemIndex) => {
          const globalIndex = chunkIndex * chunkSize + itemIndex;
          return processFn(item, globalIndex);
        })
      );
      
      return chunkResults;
    };
  });
  
  // Execute chunk operations in parallel
  const chunkResults = await executeInParallel(chunkOperations, {
    maxConcurrency,
    adaptive: options.adaptive,
    onProgress: (progress) => {
      // Transform chunk progress to item progress
      if (progress.phase === 'progress' || progress.phase === 'complete') {
        const itemsCompleted = progress.completed * chunkSize;
        
        try {
          onProgress({
            ...progress,
            itemsTotal: items.length,
            itemsCompleted: Math.min(itemsCompleted, items.length)
          });
        } catch (error) {
          console.warn('Error in progress callback:', error);
        }
      }
    }
  });
  
  // Flatten results back into a single array
  return chunkResults.flat();
}

// Export as default object
export default {
  executeInParallel,
  processInChunks
};