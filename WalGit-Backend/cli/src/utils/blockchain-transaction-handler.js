/**
 * Blockchain Transaction Handler
 * Provides robust handling for blockchain transactions with enhanced error recovery,
 * intelligent retry mechanisms, and detailed progress reporting.
 */

import chalk from 'chalk';
import ora from 'ora';
import {
  executeAndWait,
  estimateGasCost,
  isTransactionSuccessful,
  getTransactionError,
  enhanceTransactionError,
  classifyTransactionError,
  formatGasCost
} from './transaction-utils.js';

import { 
  DEFAULT_GAS_BUDGET, 
  MAX_GAS_BUDGET, 
  GAS_PRICE_BUFFER_MULTIPLIER 
} from './constants.js';

/**
 * Enhanced transaction handler with improved error recovery and user feedback
 */
export class BlockchainTransactionHandler {
  /**
   * Execute a transaction with enhanced error handling and detailed reporting
   * @param {SuiClient} client - Sui client
   * @param {TransactionBlock} txb - Transaction block
   * @param {Object} keyPair - Keypair for signing
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Transaction results
   */
  static async executeTransaction(client, txb, keyPair, options = {}) {
    // Create spinner for better UX
    const silent = options.silent === true;
    const spinnerText = options.spinnerText || 'Processing blockchain transaction...';
    const spinner = !silent ? ora(spinnerText).start() : null;
    
    try {
      // Phase 1: Gas optimization
      await this._optimizeGas(client, txb, keyPair, spinner, options);
      
      // Phase 2: Transaction execution with retry
      const result = await this._executeWithRetryAndProgress(client, txb, keyPair, spinner, options);
      
      // Success handling
      if (spinner) spinner.succeed('Transaction completed successfully');
      
      // Report gas usage if available
      if (result.effects && result.effects.gasUsed && !silent) {
        const { computationCost, storageCost, storageRebate } = result.effects.gasUsed;
        const totalGas = BigInt(computationCost) + BigInt(storageCost) - BigInt(storageRebate);
        console.log(chalk.gray(`Gas used: ${formatGasCost(totalGas)}`));
      }
      
      // Return the successful result
      return result;
    } catch (error) {
      // Enhanced error handling
      if (spinner) spinner.fail('Transaction failed');
      
      // Get more user-friendly error details
      const enhancedError = this._enhanceError(error, options);
      
      // Provide helpful error messages
      if (!silent) {
        console.error(chalk.red('Error:'), enhancedError.userMessage || enhancedError.message);
        
        if (enhancedError.suggestion) {
          console.log(chalk.yellow('Suggestion:'), enhancedError.suggestion);
        }
        
        // Add debugging details if verbose
        if (options.verbose) {
          console.log(chalk.gray('Error details:'), enhancedError);
        }
      }
      
      // Rethrow the enhanced error
      throw enhancedError;
    }
  }
  
  /**
   * Optimize gas for transaction with intelligent estimation
   * @param {SuiClient} client - Sui client
   * @param {TransactionBlock} txb - Transaction block
   * @param {Object} keyPair - Keypair for signing
   * @param {Object} spinner - Ora spinner instance
   * @param {Object} options - Options
   * @private
   */
  static async _optimizeGas(client, txb, keyPair, spinner, options = {}) {
    const skipGasEstimation = options.skipGasEstimation === true;
    
    // Skip gas estimation if requested or if gas is already set and not auto-adjustable
    if (skipGasEstimation || (txb.blockData?.gasConfig?.budget && options.autoAdjustGas === false)) {
      return;
    }
    
    try {
      if (spinner) spinner.text = 'Estimating optimal gas...';
      
      // Get sender address for gas estimation
      const sender = keyPair.getPublicKey().toSuiAddress();
      
      // Use enhanced gas estimation with safety factor
      const estimatedGas = await estimateGasCost(client, txb, sender, {
        useSafetyFactor: true,
        safetyFactor: options.gasSafetyFactor || GAS_PRICE_BUFFER_MULTIPLIER,
        retryOnFailure: true,
        useHeuristicFallback: true
      });
      
      if (estimatedGas > 0) {
        // Apply safety multiplier and cap at max budget
        const safeGas = Math.min(
          Number(estimatedGas),
          options.maxGasBudget || MAX_GAS_BUDGET
        );
        
        // Only update if different from current gas budget
        const currentBudget = txb.blockData?.gasConfig?.budget;
        if (!currentBudget || currentBudget !== safeGas) {
          txb.setGasBudget(safeGas);
          
          if (!options.silent && options.verbose) {
            console.log(chalk.gray(`Gas budget set to ${formatGasCost(BigInt(safeGas))}`));
          }
        }
      }
    } catch (error) {
      // Log warning but continue - we'll use the default gas
      if (!options.silent) {
        console.warn(chalk.yellow('Gas estimation failed, using default gas budget:'), error.message);
      }
      
      // If no gas budget is set, use default
      if (!txb.blockData?.gasConfig?.budget) {
        txb.setGasBudget(options.defaultGasBudget || DEFAULT_GAS_BUDGET);
      }
    }
  }
  
  /**
   * Execute transaction with retry and progress updates
   * @param {SuiClient} client - Sui client
   * @param {TransactionBlock} txb - Transaction block
   * @param {Object} keyPair - Keypair for signing
   * @param {Object} spinner - Ora spinner instance
   * @param {Object} options - Options
   * @returns {Promise<Object>} Transaction result
   * @private
   */
  static async _executeWithRetryAndProgress(client, txb, keyPair, spinner, options = {}) {
    // Define progress handler that updates spinner text
    const progressHandler = (progress) => {
      // Update spinner with progress info
      if (spinner && progress.phase) {
        switch (progress.phase) {
          case 'executing':
            spinner.text = `Executing transaction (attempt ${progress.attempt}/${progress.totalAttempts})...`;
            break;
          case 'retrying':
            spinner.text = `Retrying transaction in ${Math.round(progress.delay / 1000)}s (attempt ${progress.attempt}/${progress.totalAttempts})...`;
            spinner.color = 'yellow';
            break;
          case 'gas_adjusted':
            spinner.text = `Adjusted gas budget for retry (new: ${progress.newGas})...`;
            break;
          case 'confirming':
            if (progress.percentComplete) {
              spinner.text = `Confirming transaction... ${progress.percentComplete}%`;
            } else {
              spinner.text = 'Confirming transaction...';
            }
            spinner.color = 'blue';
            break;
          case 'success':
            spinner.text = 'Transaction successful!';
            spinner.color = 'green';
            break;
          case 'failed':
          case 'exhausted':
            spinner.text = `Transaction failed: ${progress.errorType || 'unknown error'}`;
            spinner.color = 'red';
            break;
        }
      }
      
      // Call user's progress handler if provided
      if (options.onProgress) {
        try {
          options.onProgress(progress);
        } catch (error) {
          console.warn('Error in progress callback:', error.message);
        }
      }
    };
    
    // Execute the transaction with enhanced error handling and progress updates
    return executeAndWait(client, txb, keyPair, {
      timeout: options.timeout || options.waitTimeout,
      autoAdjustGas: options.autoAdjustGas !== false,
      onProgress: progressHandler,
      retryCount: options.retryCount,
      txType: options.txType || 'transaction',
      throwOnTimeout: options.throwOnTimeout !== false,
      onRetry: options.onRetry
    });
  }
  
  /**
   * Parse and enhance blockchain errors with more context and suggestions
   * @param {Error} error - Original error
   * @param {Object} options - Error enhancement options
   * @returns {Error} Enhanced error
   * @private
   */
  static _enhanceError(error, options = {}) {
    // Start with basic enhancement
    const enhancedError = enhanceTransactionError(error, {
      txType: options.txType || 'transaction',
      operationType: options.operationType,
      context: options.context,
      ...options.errorContext
    });
    
    // Add extra user-friendly context based on operation type
    if (options.operationType) {
      switch(options.operationType) {
        case 'repository_creation':
          enhancedError.userMessage = `Failed to create repository. ${enhancedError.userMessage || ''}`;
          enhancedError.suggestion = enhancedError.suggestion || 'Check your connection and try again later.';
          break;
        case 'commit_upload':
          enhancedError.userMessage = `Failed to upload commit. ${enhancedError.userMessage || ''}`;
          enhancedError.suggestion = enhancedError.suggestion || 'Try reducing the number of files or commit size.';
          break;
        case 'branch_update':
          enhancedError.userMessage = `Failed to update branch. ${enhancedError.userMessage || ''}`;
          enhancedError.suggestion = enhancedError.suggestion || 'Ensure the branch exists and you have permission to update it.';
          break;
        case 'storage_allocation':
          enhancedError.userMessage = `Failed to allocate storage. ${enhancedError.userMessage || ''}`;
          enhancedError.suggestion = enhancedError.suggestion || 'Check your SUI balance and try again.';
          break;
        case 'pr_creation':
          enhancedError.userMessage = `Failed to create pull request. ${enhancedError.userMessage || ''}`;
          enhancedError.suggestion = enhancedError.suggestion || 'Verify branch names and try again.';
          break;
        case 'pr_merge':
          enhancedError.userMessage = `Failed to merge pull request. ${enhancedError.userMessage || ''}`;
          enhancedError.suggestion = enhancedError.suggestion || 'Check for conflicts or ensure the PR is open.';
          break;
      }
    }
    
    return enhancedError;
  }
  
  /**
   * Get transaction status with detailed information
   * @param {SuiClient} client - Sui client
   * @param {string} txDigest - Transaction digest
   * @returns {Promise<Object>} Detailed transaction status
   */
  static async getTransactionStatus(client, txDigest) {
    try {
      // Fetch transaction details from blockchain
      const transaction = await client.getTransactionBlock({
        digest: txDigest,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        },
      });
      
      // Check for success
      const successful = isTransactionSuccessful(transaction);
      
      if (successful) {
        // Calculate gas costs
        let gasDetails = null;
        if (transaction.effects && transaction.effects.gasUsed) {
          const { computationCost, storageCost, storageRebate } = transaction.effects.gasUsed;
          const totalGas = BigInt(computationCost) + BigInt(storageCost) - BigInt(storageRebate);
          
          gasDetails = {
            computationCost: formatGasCost(BigInt(computationCost)),
            storageCost: formatGasCost(BigInt(storageCost)),
            storageRebate: formatGasCost(BigInt(storageRebate)),
            totalCost: formatGasCost(totalGas),
            rawTotal: totalGas
          };
        }
        
        return {
          successful: true,
          digest: txDigest,
          status: 'success',
          effects: transaction.effects,
          events: transaction.events,
          objectChanges: transaction.objectChanges,
          balanceChanges: transaction.balanceChanges,
          timestamp: transaction.timestampMs,
          gasDetails
        };
      } else {
        // Transaction failed, get error details
        const error = getTransactionError(transaction);
        
        return {
          successful: false,
          digest: txDigest,
          status: 'failed',
          error,
          errorType: error?.type || 'unknown',
          message: error?.message || 'Unknown error',
          effects: transaction.effects,
          events: transaction.events
        };
      }
    } catch (error) {
      // Error looking up transaction
      const errorType = classifyTransactionError(error);
      
      return {
        successful: false,
        digest: txDigest,
        status: 'error',
        errorType,
        message: error.message,
        userMessage: 'Unable to retrieve transaction status',
        lookup_error: true
      };
    }
  }
  
  /**
   * Wait for a transaction to be confirmed with detailed progress updates
   * @param {SuiClient} client - Sui client
   * @param {string} txDigest - Transaction digest
   * @param {Object} options - Wait options
   * @returns {Promise<Object>} Transaction details
   */
  static async waitForTransaction(client, txDigest, options = {}) {
    // Create spinner for better UX
    const silent = options.silent === true;
    const spinner = !silent ? ora('Waiting for transaction confirmation...').start() : null;
    const progressCallback = options.onProgress || (() => {});
    
    try {
      let lastProgress = 0;
      
      // Use the executeAndWait transaction monitoring function
      const result = await client.waitForTransactionBlock({
        digest: txDigest,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        },
        timeout: options.timeout || options.waitTimeout,
        pollInterval: options.pollInterval || 1000,
        onProgress: (progress) => {
          // Update spinner text with progress percentage
          if (spinner && progress.percentComplete) {
            // Only update if progress has changed significantly to avoid flickering
            if (progress.percentComplete >= lastProgress + 5) {
              spinner.text = `Confirming transaction... ${progress.percentComplete}%`;
              lastProgress = progress.percentComplete;
            }
          }
          
          // Call user progress handler
          try {
            progressCallback(progress);
          } catch (error) {
            console.warn('Error in progress callback:', error.message);
          }
        }
      });
      
      // Check for success
      const successful = isTransactionSuccessful(result);
      
      if (successful) {
        if (spinner) spinner.succeed('Transaction confirmed successfully');
        
        // Report gas usage if available
        if (result.effects && result.effects.gasUsed && !silent) {
          const { computationCost, storageCost, storageRebate } = result.effects.gasUsed;
          const totalGas = BigInt(computationCost) + BigInt(storageCost) - BigInt(storageRebate);
          console.log(chalk.gray(`Gas used: ${formatGasCost(totalGas)}`));
        }
        
        return result;
      } else {
        // Transaction failed
        if (spinner) spinner.fail('Transaction failed');
        
        const error = getTransactionError(result);
        
        if (!silent) {
          console.error(chalk.red('Error:'), error.message);
          
          if (error.suggestion) {
            console.log(chalk.yellow('Suggestion:'), error.suggestion);
          }
        }
        
        throw new Error(error.message || 'Transaction failed');
      }
    } catch (error) {
      // Enhanced error handling
      if (spinner) spinner.fail('Transaction monitoring failed');
      
      const enhancedError = enhanceTransactionError(error, {
        txDigest,
        phase: 'monitoring'
      });
      
      if (!silent) {
        console.error(chalk.red('Error:'), enhancedError.userMessage || enhancedError.message);
      }
      
      throw enhancedError;
    }
  }
}

export default BlockchainTransactionHandler;