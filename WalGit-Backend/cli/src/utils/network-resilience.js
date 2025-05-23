/**
 * Network Resilience Utilities
 * Provides enhanced network resilience strategies for blockchain operations
 */

import {
  DEFAULT_RETRY_COUNT,
  DEFAULT_RETRY_DELAY,
  DEFAULT_RETRY_BACKOFF_FACTOR
} from './transaction-utils.js';
import { NetworkError, WalGitError } from './error-handler.js';

// Circuit Breaker States
const CIRCUIT_STATE = {
  CLOSED: 'CLOSED',    // Normal operation - requests pass through
  OPEN: 'OPEN',        // Circuit is open - requests are blocked
  HALF_OPEN: 'HALF_OPEN' // Testing if service is back - limited requests allowed
};

/**
 * Implements the Circuit Breaker pattern for handling service failures
 * Prevents cascading failures by stopping requests to failing services
 */
export class CircuitBreaker {
  /**
   * Creates a new CircuitBreaker instance
   * @param {Object} options - Configuration options
   * @param {number} options.failureThreshold - Number of failures before opening circuit (default: 5)
   * @param {number} options.resetTimeout - Time in ms before trying half-open state (default: 30000)
   * @param {number} options.halfOpenSuccessThreshold - Successes needed in half-open state (default: 2)
   * @param {Function} options.onStateChange - Callback for state changes
   * @param {string} options.name - Identifier for this circuit breaker
   * @param {boolean} options.trackHealth - Whether to track detailed health metrics
   * @param {Function} options.isFailure - Function to determine if an error should count as a failure
   */
  constructor(options = {}) {
    this.name = options.name || 'default';
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000; // 30 seconds
    this.halfOpenSuccessThreshold = options.halfOpenSuccessThreshold || 2;
    this.onStateChange = options.onStateChange || (() => {});
    this.trackHealth = options.trackHealth !== false;
    
    // Custom function to determine what counts as a failure
    this.isFailure = options.isFailure || ((error) => {
      // Default implementation: only count network errors
      return error instanceof NetworkError || 
        (error instanceof Error && 
         /timeout|connection|network|econnrefused|unavailable|econnreset|socket/i.test(error.message));
    });
    
    // Initialize state
    this.state = CIRCUIT_STATE.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.lastStateChange = Date.now();
    
    // Health tracking
    if (this.trackHealth) {
      this.metrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        rejectedRequests: 0,
        lastFailure: null,
        stateHistory: [{
          state: this.state,
          timestamp: Date.now()
        }]
      };
    }
  }
  
  /**
   * Executes a function with circuit breaker protection
   * @param {Function} fn - The function to execute
   * @param {Object} options - Execution options
   * @param {boolean} options.bypassCircuit - Whether to bypass circuit protection
   * @returns {Promise<any>} Result of the function
   * @throws {Error} If circuit is open or function execution fails
   */
  async execute(fn, options = {}) {
    const bypassCircuit = options.bypassCircuit || false;
    
    if (this.trackHealth) {
      this.metrics.totalRequests++;
    }
    
    // Check if circuit is open and should block requests
    if (this.state === CIRCUIT_STATE.OPEN && !bypassCircuit) {
      // Check if enough time has passed to try half-open state
      if (Date.now() > this.lastFailureTime + this.resetTimeout) {
        this.transitionToState(CIRCUIT_STATE.HALF_OPEN);
      } else {
        if (this.trackHealth) {
          this.metrics.rejectedRequests++;
        }
        
        throw new CircuitOpenError(`Circuit '${this.name}' is OPEN - request rejected`, {
          circuitBreaker: this.name,
          sinceStateChange: Date.now() - this.lastStateChange,
          resetTimeoutRemaining: (this.lastFailureTime + this.resetTimeout) - Date.now()
        });
      }
    }
    
    // Execute function with circuit breaker protection
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      // Check if this error counts as a circuit failure
      if (this.isFailure(error)) {
        this.onFailure(error);
      }
      
      // Pass the error through to the caller
      throw error;
    }
  }
  
  /**
   * Handles successful execution
   */
  onSuccess() {
    if (this.trackHealth) {
      this.metrics.successfulRequests++;
    }
    
    if (this.state === CIRCUIT_STATE.HALF_OPEN) {
      this.successCount++;
      
      // Check if we've had enough successes to close the circuit
      if (this.successCount >= this.halfOpenSuccessThreshold) {
        this.transitionToState(CIRCUIT_STATE.CLOSED);
      }
    } else {
      // Reset failure count on success in closed state
      this.failureCount = 0;
      this.successCount = 0;
    }
  }
  
  /**
   * Handles execution failure
   * @param {Error} error - The error that occurred
   */
  onFailure(error) {
    if (this.trackHealth) {
      this.metrics.failedRequests++;
      this.metrics.lastFailure = {
        message: error.message,
        type: error.constructor.name,
        time: Date.now()
      };
    }
    
    this.lastFailureTime = Date.now();
    this.failureCount++;
    this.successCount = 0;
    
    // In half-open state, a single failure trips the circuit
    if (this.state === CIRCUIT_STATE.HALF_OPEN) {
      this.transitionToState(CIRCUIT_STATE.OPEN);
      return;
    }
    
    // In closed state, check if we've hit the threshold
    if (this.state === CIRCUIT_STATE.CLOSED && this.failureCount >= this.failureThreshold) {
      this.transitionToState(CIRCUIT_STATE.OPEN);
    }
  }
  
  /**
   * Forces a state transition
   * @param {string} newState - The state to transition to
   */
  forceTransition(newState) {
    if (Object.values(CIRCUIT_STATE).includes(newState)) {
      this.transitionToState(newState);
      return true;
    }
    return false;
  }
  
  /**
   * Resets the circuit breaker to initial state
   */
  reset() {
    this.transitionToState(CIRCUIT_STATE.CLOSED);
    this.failureCount = 0;
    this.successCount = 0;
    
    if (this.trackHealth) {
      this.metrics.stateHistory.push({
        state: CIRCUIT_STATE.CLOSED,
        timestamp: Date.now(),
        reason: 'manual_reset'
      });
    }
  }
  
  /**
   * Transitions to a new state
   * @param {string} newState - The state to transition to
   * @private
   */
  transitionToState(newState) {
    const previousState = this.state;
    
    if (newState === previousState) {
      return;
    }
    
    this.state = newState;
    this.lastStateChange = Date.now();
    
    // Reset counters on state change
    if (newState === CIRCUIT_STATE.CLOSED) {
      this.failureCount = 0;
      this.successCount = 0;
    } else if (newState === CIRCUIT_STATE.HALF_OPEN) {
      this.successCount = 0;
    }
    
    // Track state history if metrics are enabled
    if (this.trackHealth) {
      this.metrics.stateHistory.push({
        fromState: previousState,
        toState: newState,
        timestamp: Date.now(),
        failureCount: this.failureCount
      });
      
      // Trim history if it gets too long
      if (this.metrics.stateHistory.length > 100) {
        this.metrics.stateHistory = this.metrics.stateHistory.slice(-50);
      }
    }
    
    // Call state change callback
    try {
      this.onStateChange({
        name: this.name,
        previousState,
        newState,
        timestamp: Date.now(),
        metrics: this.trackHealth ? this.metrics : undefined
      });
    } catch (error) {
      console.warn(`Error in circuit breaker state change callback: ${error.message}`);
    }
  }
  
  /**
   * Gets the current health and metrics of the circuit breaker
   * @returns {Object} Health information
   */
  getHealth() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      inStateFor: Date.now() - this.lastStateChange,
      metrics: this.trackHealth ? this.metrics : undefined
    };
  }
}

/**
 * Error thrown when a circuit is open
 */
export class CircuitOpenError extends WalGitError {
  constructor(message, data = {}) {
    super(message, {
      code: 'CIRCUIT_OPEN',
      data
    });
    
    // Add information about when the circuit might close
    const resetIn = data.resetTimeoutRemaining || 0;
    this.data.recovery = `Circuit will try to reset in ${Math.ceil(resetIn / 1000)} seconds`;
  }
}

// Registry to manage multiple circuit breakers
const circuitRegistry = new Map();

/**
 * Gets or creates a circuit breaker instance
 * @param {string} name - Circuit identifier
 * @param {Object} options - Circuit options
 * @returns {CircuitBreaker} CircuitBreaker instance
 */
export function getCircuitBreaker(name, options = {}) {
  if (!circuitRegistry.has(name)) {
    circuitRegistry.set(name, new CircuitBreaker({
      name,
      ...options
    }));
  }
  
  return circuitRegistry.get(name);
}

/**
 * Returns all registered circuit breakers
 * @returns {Map<string, CircuitBreaker>} All circuit breakers
 */
export function getAllCircuitBreakers() {
  return circuitRegistry;
}

/**
 * Executes a function with retry logic
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise<any>} Result of the function call
 */
export async function withRetry(fn, options = {}) {
  const retryCount = options.retryCount || DEFAULT_RETRY_COUNT;
  const initialDelay = options.retryDelay || DEFAULT_RETRY_DELAY;
  const backoffFactor = options.backoffFactor || DEFAULT_RETRY_BACKOFF_FACTOR;
  const maxDelay = options.maxDelay || 30000; // 30 seconds maximum delay
  const jitterFactor = options.jitterFactor || 0.1; // 10% jitter
  const onRetry = options.onRetry || (() => {});
  
  // Function to determine if an error is retryable
  const isRetryable = options.isRetryable || ((error) => {
    // Default retry conditions for network-related errors
    const retryablePatterns = [
      /network/i,
      /timeout/i,
      /econnrefused/i,
      /econnreset/i,
      /unavailable/i,
      /rate limit/i,
      /throttl/i,
      /overloaded/i,
      /socket/i,
      /dns/i,
      /temporary/i,
      /try again/i,
      /etimeout/i
    ];
    
    // Check if error matches any retryable pattern
    return retryablePatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.code)
    );
  });
  
  // Try the function up to retryCount + 1 times
  let lastError;
  let currentDelay = initialDelay;
  
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      // Attempt to call the function
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      
      // Exit if we've hit max retries
      if (attempt >= retryCount) {
        break;
      }
      
      // Check if this error is retryable
      if (!isRetryable(error, attempt)) {
        break;
      }
      
      // Calculate delay with jitter
      const jitter = 1 - jitterFactor + (Math.random() * jitterFactor * 2);
      const delay = Math.min(currentDelay * jitter, maxDelay);
      
      // Log retry
      console.info(`Retry ${attempt + 1}/${retryCount} in ${Math.round(delay)}ms: ${error.message}`);
      
      // Call onRetry callback
      try {
        await onRetry(attempt, error, delay);
      } catch (callbackError) {
        console.warn('Error in retry callback:', callbackError.message);
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next attempt
      currentDelay = currentDelay * backoffFactor;
    }
  }
  
  // If we got here, all retries failed
  throw lastError;
}

/**
 * Network health monitor for checking and adapting to network conditions
 */
export class NetworkHealthMonitor {
  constructor() {
    this.pingResults = [];
    this.failureCount = 0;
    this.successCount = 0;
    this.lastCheck = 0;
    this.networkStatus = 'unknown';
    this.pingInterval = 5000; // 5 seconds between checks
    this.maxPingHistory = 10;
  }
  
  /**
   * Checks if the network is healthy
   * @returns {Promise<boolean>} True if network is healthy
   */
  async isNetworkHealthy() {
    const now = Date.now();
    
    // Only check network status periodically to avoid excessive pings
    if (now - this.lastCheck < this.pingInterval && this.networkStatus !== 'unknown') {
      return this.networkStatus === 'healthy';
    }
    
    this.lastCheck = now;
    
    try {
      // Ping the SUI RPC endpoint
      const startTime = Date.now();
      const response = await fetch('https://fullnode.devnet.sui.io/healthcheck', {
        method: 'GET',
        timeout: 5000,
      });
      const endTime = Date.now();
      const pingTime = endTime - startTime;
      
      // Check if response is successful
      const isHealthy = response.ok;
      
      // Update counters
      if (isHealthy) {
        this.successCount++;
        this.failureCount = 0;
        this.networkStatus = 'healthy';
        
        // Record ping time
        this.pingResults.push(pingTime);
        if (this.pingResults.length > this.maxPingHistory) {
          this.pingResults.shift();
        }
      } else {
        this.failureCount++;
        this.successCount = 0;
        
        if (this.failureCount > 2) {
          this.networkStatus = 'unhealthy';
        }
      }
      
      return isHealthy;
    } catch (error) {
      this.failureCount++;
      this.successCount = 0;
      
      if (this.failureCount > 2) {
        this.networkStatus = 'unhealthy';
      }
      
      return false;
    }
  }
  
  /**
   * Gets the current average network latency
   * @returns {number} Average latency in milliseconds
   */
  getAverageLatency() {
    if (this.pingResults.length === 0) {
      return 100; // Default 100ms if no data
    }
    
    const sum = this.pingResults.reduce((total, ping) => total + ping, 0);
    return Math.round(sum / this.pingResults.length);
  }
  
  /**
   * Gets recommended batch size based on network health
   * @param {number} defaultBatchSize - Default batch size
   * @returns {number} Recommended batch size
   */
  getRecommendedBatchSize(defaultBatchSize) {
    if (this.networkStatus === 'unhealthy') {
      return Math.max(1, Math.floor(defaultBatchSize / 4));
    }
    
    const latency = this.getAverageLatency();
    
    if (latency > 500) {
      return Math.max(1, Math.floor(defaultBatchSize / 2));
    } else if (latency > 200) {
      return Math.max(1, Math.floor(defaultBatchSize * 0.75));
    }
    
    return defaultBatchSize;
  }
  
  /**
   * Gets recommended concurrency based on network health
   * @param {number} defaultConcurrency - Default concurrency
   * @returns {number} Recommended concurrency
   */
  getRecommendedConcurrency(defaultConcurrency) {
    if (this.networkStatus === 'unhealthy') {
      return 1;
    }
    
    const latency = this.getAverageLatency();
    
    if (latency > 500) {
      return Math.max(1, Math.floor(defaultConcurrency / 2));
    } else if (latency > 200) {
      return Math.max(1, defaultConcurrency - 1);
    }
    
    return defaultConcurrency;
  }
  
  /**
   * Gets recommended retry count based on network health
   * @param {number} defaultRetryCount - Default retry count
   * @returns {number} Recommended retry count
   */
  getRecommendedRetryCount(defaultRetryCount) {
    if (this.networkStatus === 'unhealthy') {
      return defaultRetryCount + 2;
    }
    
    const latency = this.getAverageLatency();
    
    if (latency > 500) {
      return defaultRetryCount + 1;
    }
    
    return defaultRetryCount;
  }
  
  /**
   * Gets recommendations for network-aware operation
   * @param {Object} defaults - Default operation parameters
   * @returns {Object} Recommended parameters
   */
  getNetworkAwareRecommendations(defaults = {}) {
    const isHealthy = this.networkStatus === 'healthy';
    const defaultBatchSize = defaults.batchSize || 10;
    const defaultConcurrency = defaults.concurrency || 3;
    const defaultRetryCount = defaults.retryCount || 3;
    
    return {
      batchSize: this.getRecommendedBatchSize(defaultBatchSize),
      concurrency: this.getRecommendedConcurrency(defaultConcurrency),
      retryCount: this.getRecommendedRetryCount(defaultRetryCount),
      networkStatus: this.networkStatus,
      averageLatency: this.getAverageLatency(),
      isHealthy
    };
  }
}

// Create a singleton instance
export const networkMonitor = new NetworkHealthMonitor();

/**
 * Executes an operation with network-aware parameters
 * @param {Function} operation - Function to execute
 * @param {Object} options - Options for the operation
 * @returns {Promise<any>} Result of the operation
 */
export async function withNetworkAwareness(operation, options = {}) {
  // Check network health
  await networkMonitor.isNetworkHealthy();
  
  // Get network-aware recommendations
  const recommendations = networkMonitor.getNetworkAwareRecommendations({
    batchSize: options.batchSize,
    concurrency: options.concurrency,
    retryCount: options.retryCount
  });
  
  // Merge recommendations with options, prioritizing explicit options
  const enhancedOptions = {
    ...recommendations,
    ...options,
    networkConditions: recommendations
  };
  
  // Execute the operation with retry
  return withRetry(
    async (attempt) => operation(enhancedOptions, attempt),
    {
      retryCount: enhancedOptions.retryCount,
      retryDelay: options.retryDelay,
      onRetry: options.onRetry
    }
  );
}

/**
 * Executes an operation with circuit breaker protection
 * 
 * @param {string} circuitName - Name of the circuit breaker to use
 * @param {Function} operation - Operation to execute
 * @param {Object} options - Options for circuit breaker and operation
 * @returns {Promise<any>} Result of the operation
 */
export async function withCircuitBreaker(circuitName, operation, options = {}) {
  // Get or create the circuit breaker
  const circuitBreaker = getCircuitBreaker(circuitName, options.circuitOptions || {});
  
  // Wrap operation with network awareness if requested
  const networkAwareOperation = options.networkAware 
    ? (opts) => withNetworkAwareness(operation, opts)
    : operation;
  
  // Execute with circuit breaker protection
  return circuitBreaker.execute(
    () => networkAwareOperation(options),
    {
      bypassCircuit: options.bypassCircuit || false
    }
  );
}

/**
 * Combined resilience pattern that applies multiple resilience strategies
 * - Circuit breaker to prevent cascading failures
 * - Network awareness for adaptive parameters
 * - Retry with exponential backoff for transient failures
 * 
 * @param {Object} options - Resilience options
 * @param {string} options.circuitName - Circuit breaker name
 * @param {Object} options.circuitOptions - Circuit breaker configuration
 * @param {boolean} options.networkAware - Use network-aware parameters
 * @param {Function} operation - Function to execute with resilience
 * @returns {Promise<any>} Result of the operation
 */
export function createResilience(options = {}) {
  return async function resilientOperation(operation) {
    // Apply circuit breaker
    if (options.circuitName) {
      return withCircuitBreaker(
        options.circuitName, 
        operation, 
        {
          circuitOptions: options.circuitOptions,
          networkAware: options.networkAware !== false,
          bypassCircuit: options.bypassCircuit
        }
      );
    }
    
    // Apply network awareness without circuit breaker
    if (options.networkAware !== false) {
      return withNetworkAwareness(operation, options);
    }
    
    // Apply retry without other resilience
    return withRetry(
      () => operation(options),
      {
        retryCount: options.retryCount,
        retryDelay: options.retryDelay,
        backoffFactor: options.backoffFactor,
        maxDelay: options.maxDelay,
        onRetry: options.onRetry,
        isRetryable: options.isRetryable
      }
    );
  };
}