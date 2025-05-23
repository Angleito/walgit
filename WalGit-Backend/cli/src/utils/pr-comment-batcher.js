/**
 * PR Comment Batcher
 * Provides optimized handling of Pull Request comments with efficient batching and error handling
 */

import {
  SUI_TRANSACTION_BLOCK_SIZE_LIMIT,
  MAX_BATCH_SIZE
} from './constants.js';
import { batchPRComments } from './transaction-utils.js';

/**
 * Batches PR comments for efficient submission
 * @param {string} pullRequestId - The pull request ID
 * @param {Array<Object>} comments - Array of comment objects
 * @param {Object} walrusClient - Walrus client instance
 * @param {Object} options - Submission options
 * @return {Promise<Object>} Submission results
 */
export async function submitCommentsBatched(pullRequestId, comments, walrusClient, options = {}) {
  if (!comments || comments.length === 0) {
    return { successful: [], failed: [], totalComments: 0 };
  }

  // Create a function to execute a batch of comments
  const executeCommentBatch = async (batch) => {
    const txb = walrusClient.beginTransaction();
    
    // Add all comments in the batch to the transaction
    for (const comment of batch) {
      txb.addComment(
        pullRequestId,
        comment.content,
        comment.lineNumber,
        comment.filePath
      );
    }
    
    // Execute with appropriate gas
    try {
      const estimatedGas = await txb.estimateGas();
      const safeGas = Math.min(estimatedGas * 1.3, 150000000); // Safety margin
      return txb.execute({ gasBudget: safeGas });
    } catch (gasError) {
      console.warn('Gas estimation failed, using default budget:', gasError.message);
      return txb.execute({ gasBudget: 100000000 }); // Default if estimation fails
    }
  };

  // Use the enhanced batch processing from transaction-utils
  return batchPRComments(comments, executeCommentBatch, {
    maxConcurrent: options.maxConcurrent || 3,
    maxRetries: options.maxRetries || 3,
    continueOnError: options.continueOnError !== false,
    onProgress: options.onProgress
  });
}

/**
 * Optimally groups comments by file for efficient submission
 * @param {Array<Object>} comments - Array of comment objects
 * @param {Object} options - Grouping options
 * @return {Array<Array<Object>>} Grouped comments
 */
export function groupCommentsByFile(comments, options = {}) {
  // Sort comments by file path to group related comments
  const sortedComments = [...comments].sort((a, b) => {
    // First sort by file path
    if (a.filePath !== b.filePath) {
      return a.filePath.localeCompare(b.filePath);
    }
    // Then by line number
    return a.lineNumber - b.lineNumber;
  });
  
  // Group into batches respecting size limits
  const commentBatches = [];
  let currentBatch = [];
  let currentFileId = null;
  let currentBatchSize = 0;
  
  for (const comment of sortedComments) {
    const commentSize = estimateCommentSize(comment);
    
    // Start a new batch if this comment would exceed limits or is for a different file
    // and we already have comments in the current batch
    if (
      currentBatch.length >= MAX_BATCH_SIZE || 
      currentBatchSize + commentSize > SUI_TRANSACTION_BLOCK_SIZE_LIMIT * 0.8 ||
      (currentFileId !== null && comment.filePath !== currentFileId && currentBatch.length > 0)
    ) {
      if (currentBatch.length > 0) {
        commentBatches.push([...currentBatch]);
        currentBatch = [];
        currentBatchSize = 0;
      }
      
      currentFileId = comment.filePath;
    }
    
    // Add comment to current batch
    currentBatch.push(comment);
    currentBatchSize += commentSize;
    
    // Set file ID if this is the first comment in a batch
    if (currentBatch.length === 1) {
      currentFileId = comment.filePath;
    }
  }
  
  // Add the last batch if not empty
  if (currentBatch.length > 0) {
    commentBatches.push(currentBatch);
  }
  
  return commentBatches;
}

/**
 * Estimates the size of a comment for transaction planning
 * @param {Object} comment - Comment object
 * @return {number} Estimated size in bytes
 */
function estimateCommentSize(comment) {
  // Base size for transaction overhead
  const baseSize = 1000;
  
  // Size from the content
  const contentSize = (comment.content || '').length * 2;
  
  // Size from the file path
  const filePathSize = (comment.filePath || '').length * 2;
  
  // Add some buffer for other fields and encoding overhead
  return baseSize + contentSize + filePathSize + 200;
}

export default {
  submitCommentsBatched,
  groupCommentsByFile
};