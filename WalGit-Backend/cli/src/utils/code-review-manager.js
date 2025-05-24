/**
 * Code Review Manager
 * Handles code review functionality including inline comments and review threads
 */

import { initializeSuiClient } from './sui-integration.js';
import { walrusClient } from './walrus-sdk-integration.js';
import { estimatePROperationGas, executePRTransaction } from './transaction-utils.js';
import { DEFAULT_GAS_BUDGET } from './constants.js';

/**
 * Manages code review operations with blockchain optimization strategies
 */
export class CodeReviewManager {
  /**
   * Create an inline comment on a specific file and line
   * @param {string} pullRequestId - The pull request ID
   * @param {string} filePath - Path to the file being commented on
   * @param {number} lineNumber - Line number for the comment
   * @param {string} content - Comment content
   * @param {Object} options - Additional options
   * @returns {Object} Transaction result
   */
  static async createInlineComment(pullRequestId, filePath, lineNumber, content, options = {}) {
    const walrusClient = walrusClient;
    const suiClient = await initializeSuiClient();
    
    // Estimate gas cost for comment creation
    const estimatedGas = await estimatePROperationGas('add_inline_comment', {
      pull_request_id: pullRequestId,
      file_path: filePath,
      line_number: lineNumber,
      content
    });
    
    // Use Transaction Block for efficient execution
    const txb = suiClient.createTransactionBlock();
    
    // Add the comment operation
    txb.moveCall({
      target: `${process.env.PACKAGE_ID}::git_code_review::create_inline_comment`,
      arguments: [
        txb.object(pullRequestId),
        txb.pure(filePath),
        txb.pure(lineNumber),
        txb.pure(content),
        txb.pure(options.commitId || null),
        txb.object(options.reviewSummaryId),
      ]
    });
    
    // Execute the transaction with optimized gas settings
    const keypair = options.keypair || await walrusClient.getActiveKeypair();
    return executePRTransaction(txb, suiClient, keypair, {
      gasBudget: Math.min(estimatedGas * 1.2, options.maxGas || DEFAULT_GAS_BUDGET),
      waitForConfirmation: options.waitForConfirmation || false
    });
  }
  
  /**
   * Create a new review thread
   * @param {string} pullRequestId - The pull request ID
   * @param {string} filePath - Path to the file being commented on
   * @param {number} lineNumber - Line number for the thread
   * @param {string} initialComment - First comment in the thread
   * @param {Object} options - Additional options
   * @returns {Object} Transaction result
   */
  static async createReviewThread(pullRequestId, filePath, lineNumber, initialComment, options = {}) {
    const walrusClient = walrusClient;
    const suiClient = await initializeSuiClient();
    
    // Estimate gas cost for thread creation
    const estimatedGas = await estimatePROperationGas('create_review_thread', {
      pull_request_id: pullRequestId,
      file_path: filePath,
      line_number: lineNumber,
      initial_comment: initialComment
    });
    
    // Use Transaction Block for efficient execution
    const txb = suiClient.createTransactionBlock();
    
    // Add the thread creation operation
    txb.moveCall({
      target: `${process.env.PACKAGE_ID}::git_code_review::create_review_thread`,
      arguments: [
        txb.object(pullRequestId),
        txb.pure(filePath),
        txb.pure(lineNumber),
        txb.pure(initialComment),
        txb.pure(options.commitId || null),
        txb.object(options.reviewSummaryId),
      ]
    });
    
    // Execute the transaction with optimized gas settings
    const keypair = options.keypair || await walrusClient.getActiveKeypair();
    return executePRTransaction(txb, suiClient, keypair, {
      gasBudget: Math.min(estimatedGas * 1.2, options.maxGas || DEFAULT_GAS_BUDGET),
      waitForConfirmation: options.waitForConfirmation || false
    });
  }
  
  /**
   * Reply to an existing review thread
   * @param {string} threadId - The thread ID
   * @param {string} content - Reply content
   * @param {Object} options - Additional options
   * @returns {Object} Transaction result
   */
  static async replyToThread(threadId, content, options = {}) {
    const walrusClient = walrusClient;
    const suiClient = await initializeSuiClient();
    
    // Estimate gas cost for thread reply
    const estimatedGas = await estimatePROperationGas('reply_to_thread', {
      thread_id: threadId,
      content
    });
    
    // Use Transaction Block for efficient execution
    const txb = suiClient.createTransactionBlock();
    
    // Add the reply operation
    txb.moveCall({
      target: `${process.env.PACKAGE_ID}::git_code_review::reply_to_thread`,
      arguments: [
        txb.object(threadId),
        txb.pure(content),
        txb.object(options.reviewSummaryId),
      ]
    });
    
    // Execute the transaction with optimized gas settings
    const keypair = options.keypair || await walrusClient.getActiveKeypair();
    return executePRTransaction(txb, suiClient, keypair, {
      gasBudget: Math.min(estimatedGas * 1.2, options.maxGas || DEFAULT_GAS_BUDGET),
      waitForConfirmation: options.waitForConfirmation || false
    });
  }
  
  /**
   * Resolve a review thread
   * @param {string} threadId - The thread ID
   * @param {Object} options - Additional options
   * @returns {Object} Transaction result
   */
  static async resolveThread(threadId, options = {}) {
    const walrusClient = walrusClient;
    const suiClient = await initializeSuiClient();
    
    // Use Transaction Block for efficient execution
    const txb = suiClient.createTransactionBlock();
    
    // Add the resolve operation
    txb.moveCall({
      target: `${process.env.PACKAGE_ID}::git_code_review::resolve_thread`,
      arguments: [
        txb.object(threadId),
      ]
    });
    
    // Execute the transaction with optimized gas settings
    const keypair = options.keypair || await walrusClient.getActiveKeypair();
    return executePRTransaction(txb, suiClient, keypair, {
      gasBudget: options.gasBudget || DEFAULT_GAS_BUDGET,
      waitForConfirmation: options.waitForConfirmation || false
    });
  }
  
  /**
   * Reopen a resolved review thread
   * @param {string} threadId - The thread ID
   * @param {Object} options - Additional options
   * @returns {Object} Transaction result
   */
  static async reopenThread(threadId, options = {}) {
    const walrusClient = walrusClient;
    const suiClient = await initializeSuiClient();
    
    // Use Transaction Block for efficient execution
    const txb = suiClient.createTransactionBlock();
    
    // Add the reopen operation
    txb.moveCall({
      target: `${process.env.PACKAGE_ID}::git_code_review::reopen_thread`,
      arguments: [
        txb.object(threadId),
      ]
    });
    
    // Execute the transaction with optimized gas settings
    const keypair = options.keypair || await walrusClient.getActiveKeypair();
    return executePRTransaction(txb, suiClient, keypair, {
      gasBudget: options.gasBudget || DEFAULT_GAS_BUDGET,
      waitForConfirmation: options.waitForConfirmation || false
    });
  }
  
  /**
   * Get all review threads for a pull request
   * @param {string} pullRequestId - The pull request ID
   * @param {string} reviewSummaryId - The review summary ID for the repository
   * @returns {Array} Array of thread IDs
   */
  static async getThreadsForPullRequest(pullRequestId, reviewSummaryId) {
    const suiClient = await initializeSuiClient();
    
    // Query thread IDs
    const result = await suiClient.getObject({
      id: reviewSummaryId,
      options: {
        showContent: true,
      }
    });
    
    if (!result || !result.data || !result.data.content) {
      return [];
    }
    
    // Call the view function to get threads
    const viewResult = await suiClient.devInspectTransaction({
      sender: '0x0', // Dummy sender for view function
      transaction: {
        kind: 'moveCall',
        data: {
          packageObjectId: process.env.PACKAGE_ID,
          module: 'git_code_review',
          function: 'get_threads_for_pr',
          typeArguments: [],
          arguments: [
            reviewSummaryId,
            pullRequestId
          ]
        }
      }
    });
    
    // Parse and return thread IDs
    if (viewResult && viewResult.results && viewResult.results.length > 0) {
      const returnValues = viewResult.results[0].returnValues;
      if (returnValues && returnValues.length > 0) {
        // Parse the vector of IDs
        const threadsVector = returnValues[0][0];
        return threadsVector;
      }
    }
    
    return [];
  }
  
  /**
   * Get thread details including comments
   * @param {string} threadId - The thread ID
   * @returns {Object} Thread details with comments
   */
  static async getThreadDetails(threadId) {
    const suiClient = await initializeSuiClient();
    
    // Get thread object
    const threadResult = await suiClient.getObject({
      id: threadId,
      options: {
        showContent: true,
        showOwner: true,
      }
    });
    
    if (!threadResult || !threadResult.data || !threadResult.data.content) {
      throw new Error(`Thread ${threadId} not found`);
    }
    
    const threadData = threadResult.data.content;
    
    // Get comment IDs from thread
    const commentIds = threadData.fields.comments;
    
    // Fetch each comment
    const comments = await Promise.all(
      commentIds.map(async (commentId) => {
        const commentResult = await suiClient.getObject({
          id: commentId,
          options: {
            showContent: true,
            showOwner: true,
          }
        });
        
        if (!commentResult || !commentResult.data || !commentResult.data.content) {
          return null;
        }
        
        const commentData = commentResult.data.content;
        
        return {
          id: commentId,
          pullRequestId: commentData.fields.pull_request_id,
          commenter: commentData.fields.commenter,
          filePath: commentData.fields.file_path,
          lineNumber: commentData.fields.line_number,
          content: commentData.fields.content,
          createdAt: commentData.fields.created_at,
          commitId: commentData.fields.commit_id || null
        };
      })
    );
    
    // Filter out any failed comment fetches
    const validComments = comments.filter(comment => comment !== null);
    
    // Return thread with comments
    return {
      id: threadId,
      pullRequestId: threadData.fields.pull_request_id,
      filePath: threadData.fields.file_path,
      lineNumber: threadData.fields.line_number,
      status: threadData.fields.status,
      creator: threadData.fields.creator,
      createdAt: threadData.fields.created_at,
      resolvedBy: threadData.fields.resolved_by,
      resolvedAt: threadData.fields.resolved_at,
      comments: validComments
    };
  }
  
  /**
   * Get file diff for a specific file in a pull request
   * @param {string} pullRequestId - The pull request ID
   * @param {string} filePath - Path to the file
   * @returns {Object} File diff details
   */
  static async getFileDiff(pullRequestId, filePath) {
    const walrusClient = walrusClient;
    
    // Get the diff data from Walrus storage
    return walrusClient.getFileDiff(pullRequestId, filePath);
  }
  
  /**
   * Get all file diffs for a pull request
   * @param {string} pullRequestId - The pull request ID
   * @returns {Array} Array of file diffs
   */
  static async getFileDiffs(pullRequestId) {
    const walrusClient = walrusClient;
    
    // Get all diffs from Walrus storage
    return walrusClient.getFileDiffs(pullRequestId);
  }
  
  /**
   * Get comments for a specific file in a pull request
   * @param {string} pullRequestId - The pull request ID
   * @param {string} filePath - Path to the file
   * @param {string} reviewSummaryId - The review summary ID for the repository
   * @returns {Array} Array of comments for the file
   */
  static async getCommentsForFile(pullRequestId, filePath, reviewSummaryId) {
    const suiClient = await initializeSuiClient();
    
    // First get all comments for the PR
    const commentsResult = await suiClient.devInspectTransaction({
      sender: '0x0', // Dummy sender for view function
      transaction: {
        kind: 'moveCall',
        data: {
          packageObjectId: process.env.PACKAGE_ID,
          module: 'git_code_review',
          function: 'get_comments_for_pr',
          typeArguments: [],
          arguments: [
            reviewSummaryId,
            pullRequestId
          ]
        }
      }
    });
    
    if (!commentsResult || !commentsResult.results || !commentsResult.results.length) {
      return [];
    }
    
    // Parse comment IDs
    const returnValues = commentsResult.results[0].returnValues;
    if (!returnValues || !returnValues.length) {
      return [];
    }
    
    const commentIds = returnValues[0][0];
    
    // Fetch each comment
    const comments = await Promise.all(
      commentIds.map(async (commentId) => {
        const commentResult = await suiClient.getObject({
          id: commentId,
          options: {
            showContent: true,
          }
        });
        
        if (!commentResult || !commentResult.data || !commentResult.data.content) {
          return null;
        }
        
        const commentData = commentResult.data.content;
        
        return {
          id: commentId,
          pullRequestId: commentData.fields.pull_request_id,
          commenter: commentData.fields.commenter,
          filePath: commentData.fields.file_path,
          lineNumber: commentData.fields.line_number,
          content: commentData.fields.content,
          createdAt: commentData.fields.created_at,
          commitId: commentData.fields.commit_id || null
        };
      })
    );
    
    // Filter by file path and remove nulls
    return comments
      .filter(comment => comment !== null && comment.filePath === filePath)
      .sort((a, b) => a.lineNumber - b.lineNumber);
  }
}

export default CodeReviewManager;