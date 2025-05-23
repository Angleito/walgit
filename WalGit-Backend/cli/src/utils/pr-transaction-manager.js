/**
 * PR Transaction Manager
 * Handles optimized blockchain transactions for Pull Request operations
 */

import { SUI_TRANSACTION_BLOCK_SIZE_LIMIT } from './constants.js';
import { estimateGasCost, batchTransactions } from './transaction-utils.js';
import { walrusClient } from './walrus-sdk-integration.js';

/**
 * Manages PR transaction operations with blockchain optimization strategies
 */
export class PRTransactionManager {
  /**
   * Creates a new pull request with optimized transaction strategy
   * @param {Object} prData - Pull request data
   * @param {string} repositoryId - The repository ID
   * @param {Object} options - Transaction options
   * @returns {Object} Transaction result
   */
  static async createPullRequest(prData, repositoryId, options = {}) {
    const walrusClient = walrusClient;
    const { sourceBranch, targetBranch, title, description } = prData;
    
    // Estimate gas cost for PR creation
    const estimatedGas = await estimateGasCost('create_pull_request', {
      repository_id: repositoryId,
      source_branch: sourceBranch,
      target_branch: targetBranch,
      title,
      description
    });
    
    // Execute transaction with optimized gas budget
    const gasToUse = Math.min(estimatedGas * 1.2, options.maxGas || 50000000);
    
    return walrusClient.createPullRequest(
      repositoryId,
      sourceBranch,
      targetBranch,
      title,
      description,
      { gasBudget: gasToUse }
    );
  }
  
  /**
   * Submits multiple PR comments in a batched transaction
   * @param {string} pullRequestId - The pull request ID
   * @param {Array<Object>} comments - Array of comment objects
   * @returns {Object} Transaction result
   */
  static async batchSubmitComments(pullRequestId, comments, options = {}) {
    const walrusClient = walrusClient;

    // Import the enhanced PR comment batcher
    const { batchPRComments } = await import('./pr-comment-batcher.js');

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

      // Estimate gas with safety margin
      try {
        const estimatedGas = await txb.estimateGas();
        const safeGas = Math.min(estimatedGas * 1.3, 150000000); // More safety margin
        return txb.execute({ gasBudget: safeGas });
      } catch (gasError) {
        console.warn('Gas estimation failed, using default budget:', gasError.message);
        return txb.execute({ gasBudget: 100000000 }); // Default if estimation fails
      }
    };

    // Use enhanced batch processing with retries, concurrency control, and progress tracking
    const result = await batchPRComments(comments, executeCommentBatch, {
      maxConcurrent: options.maxConcurrent || 3,
      maxRetries: options.maxRetries || 3,
      continueOnError: options.continueOnError !== false,
      onProgress: options.onProgress || ((progress) => {
        if (progress.phase === 'complete') {
          console.log(`Completed ${progress.successfulComments}/${progress.totalComments} comments`);
          if (progress.failedComments > 0) {
            console.warn(`Failed to submit ${progress.failedComments} comments`);
          }
        }
      })
    });

    // For backward compatibility, return an array of successful transaction results
    return result.successful.map(s => s.result);
  }
  
  /**
   * Updates PR status with optimized transaction strategy
   * @param {string} pullRequestId - The pull request ID
   * @param {string} status - New PR status
   * @param {Object} options - Transaction options
   * @returns {Object} Transaction result
   */
  static async updatePRStatus(pullRequestId, status, options = {}) {
    const walrusClient = walrusClient;
    
    // For status updates, use minimal gas since operation is light
    const estimatedGas = await estimateGasCost('update_pull_request_status', {
      pull_request_id: pullRequestId,
      status
    });
    
    return walrusClient.updatePullRequestStatus(
      pullRequestId,
      status,
      { gasBudget: Math.min(estimatedGas * 1.1, options.maxGas || 10000000) }
    );
  }
  
  /**
   * Performs a PR merge with optimized transaction handling
   * @param {string} pullRequestId - The pull request ID
   * @param {string} mergeStrategy - The merge strategy to use
   * @param {Object} options - Transaction options
   * @returns {Object} Transaction result
   */
  static async mergePullRequest(pullRequestId, mergeStrategy, options = {}) {
    const walrusClient = walrusClient;
    
    // Merge operations are complex, use higher gas multiplier
    const estimatedGas = await estimateGasCost('merge_pull_request', {
      pull_request_id: pullRequestId,
      merge_strategy: mergeStrategy
    });
    
    // Use higher multiplier for merge operations due to their complexity
    const gasToUse = Math.min(estimatedGas * 1.5, options.maxGas || 200000000);
    
    return walrusClient.mergePullRequest(
      pullRequestId,
      mergeStrategy,
      { gasBudget: gasToUse }
    );
  }
  
  /**
   * Submits a review for a PR with optimized gas usage
   * @param {string} pullRequestId - The pull request ID
   * @param {Object} reviewData - Review data including verdict and comments
   * @returns {Object} Transaction result
   */
  static async submitReview(pullRequestId, reviewData) {
    const walrusClient = walrusClient;
    const { verdict, comments, description } = reviewData;
    
    // If there are many comments, batch them separately from the review itself
    if (comments && comments.length > 5) {
      // First submit the review
      const reviewTx = await walrusClient.submitReview(
        pullRequestId,
        verdict,
        description,
        { gasBudget: 30000000 }
      );
      
      // Then batch submit the comments
      const commentsTx = await this.batchSubmitComments(pullRequestId, comments);
      
      return {
        reviewTx,
        commentsTx
      };
    } else {
      // For small number of comments, include them in the review transaction
      const txb = walrusClient.beginTransaction();
      
      // Add review
      txb.submitReview(pullRequestId, verdict, description);
      
      // Add comments
      if (comments && comments.length > 0) {
        for (const comment of comments) {
          txb.addComment(pullRequestId, comment.content, comment.lineNumber, comment.filePath);
        }
      }
      
      const estimatedGas = await txb.estimateGas();
      return txb.execute({ gasBudget: Math.min(estimatedGas * 1.3, 100000000) });
    }
  }
}

export default PRTransactionManager;