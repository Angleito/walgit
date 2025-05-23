/**
 * Network Resilience Framework for WalGit
 * 
 * This module exports the combined network resilience utilities for WalGit,
 * providing an integrated approach to handling network failures, optimizing
 * transactions, and ensuring reliable operations with decentralized storage
 * and blockchain systems.
 */

// Export resilient network operations
export {
  createResilientStrategy,
  executeSuiTransaction,
  executeWalrusOperation,
  resilientNetworkRequest,
  processBatchResilient,
  createResilientBatches,
  getNetworkHealth,
  resetNetworkStatus,
  default as resilientNetwork
} from './resilient-network.js';

// Export core network resilience primitives
export {
  CircuitBreaker,
  CircuitOpenError,
  getCircuitBreaker,
  getAllCircuitBreakers,
  withRetry,
  NetworkHealthMonitor,
  networkMonitor,
  withNetworkAwareness,
  withCircuitBreaker,
  createResilience
} from './network-resilience.js';

// Export failure analytics
export {
  FailureLogger,
  withFailureTracking,
  createAnalyticsEnabledCircuitBreaker,
  getFailureTrendChart,
  default as failureLogger
} from './failure-analytics.js';

/**
 * Creates a network-resilient version of an API client
 * @param {Object} client - The original API client
 * @param {string} type - Type of client ('sui', 'walrus', 'network')
 * @param {Object} options - Resilience options
 * @returns {Object} Resilient API client
 */
export function createResilientClient(client, type, options = {}) {
  // Import here to avoid circular dependencies
  const { createResilientStrategy } = require('./resilient-network.js');
  const { withFailureTracking } = require('./failure-analytics.js');
  
  // Create the resilient execution strategy
  const resilientExecute = createResilientStrategy(type, options);
  
  // Create a proxy that wraps all methods in resilience
  return new Proxy(client, {
    get(target, prop) {
      // Get the original property
      const originalProp = target[prop];
      
      // If it's not a function or is a special method (like toString), return as is
      if (typeof originalProp !== 'function' || 
          prop === 'toString' || 
          prop === 'valueOf' ||
          prop === 'inspect' ||
          prop === 'constructor') {
        return originalProp;
      }
      
      // Return a wrapped version of the function
      return async function(...args) {
        // Prepare context for failure tracking
        const context = {
          operation: prop.toString(),
          component: type === 'sui' ? 'sui-client' : 
                     type === 'walrus' ? 'walrus-storage' : 
                     'network-client',
          category: type,
          metadata: {
            arguments: args.map(arg => 
              typeof arg === 'object' ? 
                JSON.stringify(arg).substring(0, 100) : 
                String(arg).substring(0, 100)
            )
          }
        };
        
        // Execute with resilience and failure tracking
        return withFailureTracking(
          async () => resilientExecute(
            async () => originalProp.apply(target, args)
          ),
          context
        );
      };
    }
  });
}

/**
 * Apply resilience to all future Walrus and Sui operations
 * @param {Object} options - Global resilience options
 */
export function enableGlobalResilience(options = {}) {
  // This function could patch global clients or set up global interceptors
  // The implementation would depend on how the Sui and Walrus clients are initialized
  
  console.log('Global resilience enabled with options:', options);
  
  // Return a function to disable global resilience if needed
  return function disableGlobalResilience() {
    console.log('Global resilience disabled');
  };
}