/**
 * Circuit Breaker Pattern Usage Example
 * This file demonstrates how to use the Circuit Breaker pattern
 * for network resilience in the WalGit application.
 */

import { 
  CircuitBreaker, 
  getCircuitBreaker, 
  withCircuitBreaker,
  createResilience,
  CircuitOpenError
} from '../cli/src/utils/network-resilience.js';

/**
 * Example 1: Basic Circuit Breaker Usage
 * Demonstrates direct use of a CircuitBreaker instance
 */
async function basicCircuitBreakerExample() {
  console.log('=== Example 1: Basic Circuit Breaker ===');
  
  // Create a circuit breaker instance
  const breaker = new CircuitBreaker({
    name: 'example-service',
    failureThreshold: 3,  // Open after 3 failures
    resetTimeout: 5000,   // Try again after 5 seconds
    onStateChange: (event) => {
      console.log(`Circuit state changed from ${event.previousState} to ${event.newState}`);
    }
  });
  
  // Function that simulates an API call
  async function callService(shouldFail = false) {
    if (shouldFail) {
      throw new Error('Service unavailable');
    }
    return { success: true, data: 'Service response' };
  }
  
  try {
    // Successful execution
    console.log('Calling service (success expected)...');
    const result = await breaker.execute(() => callService(false));
    console.log('Service call succeeded:', result);
    
    // Simulate failures to trip the circuit
    console.log('\nSimulating 3 failures to trip circuit...');
    for (let i = 1; i <= 3; i++) {
      try {
        await breaker.execute(() => callService(true));
      } catch (error) {
        console.log(`Failure ${i}: ${error.message}`);
      }
    }
    
    // Circuit should be open now
    console.log('\nCircuit state:', breaker.state);
    
    // Try to call when circuit is open
    console.log('\nTrying to call service when circuit is open...');
    try {
      await breaker.execute(() => callService(false));
    } catch (error) {
      console.log(`Call blocked by circuit breaker: ${error.message}`);
      if (error instanceof CircuitOpenError) {
        console.log(`Recovery info: ${error.data.recovery}`);
      }
    }
    
    // Wait for reset timeout to transition to half-open
    console.log('\nWaiting for reset timeout (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5500));
    
    // Circuit should be half-open now - a successful call will close it
    console.log('\nCircuit state after waiting:', breaker.state);
    
    // Make successful call to close circuit
    console.log('\nMaking successful call in half-open state...');
    await breaker.execute(() => callService(false));
    
    // Circuit should be closed again
    console.log('\nCircuit state after successful call:', breaker.state);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

/**
 * Example 2: Using the Registry
 * Demonstrates using the circuit breaker registry to manage circuit breakers
 */
async function registryExample() {
  console.log('\n\n=== Example 2: Circuit Breaker Registry ===');
  
  // Get a circuit breaker for a specific service
  const authBreaker = getCircuitBreaker('auth-service', {
    failureThreshold: 2
  });
  
  const storageBreaker = getCircuitBreaker('storage-service', {
    failureThreshold: 3
  });
  
  // Use multiple circuit breakers
  console.log('Auth service breaker state:', authBreaker.state);
  console.log('Storage service breaker state:', storageBreaker.state);
  
  // Demonstrate that retrieving the same breaker returns the same instance
  const authBreaker2 = getCircuitBreaker('auth-service');
  console.log('Same instance check:', authBreaker === authBreaker2);
}

/**
 * Example 3: High-Level Circuit Breaker API
 * Demonstrates using the high-level withCircuitBreaker function
 */
async function highLevelExample() {
  console.log('\n\n=== Example 3: High-Level Circuit Breaker API ===');
  
  // Mock service function
  async function fetchUserData(userId) {
    // Simulate failure for certain user IDs
    if (userId === 'error') {
      throw new Error('Network error fetching user data');
    }
    return { id: userId, name: 'Example User', email: 'user@example.com' };
  }
  
  // Use the high-level API
  try {
    // Successful call
    console.log('Making successful API call...');
    const userData = await withCircuitBreaker(
      'user-service',
      () => fetchUserData('user123'),
      {
        circuitOptions: {
          failureThreshold: 2,
          resetTimeout: 5000
        },
        networkAware: true
      }
    );
    console.log('User data:', userData);
    
    // Failed calls to open circuit
    console.log('\nMaking failed API calls...');
    try {
      await withCircuitBreaker(
        'user-service',
        () => fetchUserData('error'),
        { networkAware: true }
      );
    } catch (error) {
      console.log('First error:', error.message);
    }
    
    try {
      await withCircuitBreaker(
        'user-service',
        () => fetchUserData('error'),
        { networkAware: true }
      );
    } catch (error) {
      console.log('Second error:', error.message);
    }
    
    // Circuit should be open now, blocking further calls
    console.log('\nAttempting call with open circuit...');
    try {
      await withCircuitBreaker(
        'user-service',
        () => fetchUserData('user456'),
        { networkAware: true }
      );
    } catch (error) {
      console.log('Call blocked:', error.message);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

/**
 * Example 4: Comprehensive Resilience Strategy
 * Demonstrates using the createResilience function for a complete resilience strategy
 */
async function comprehensiveResilienceExample() {
  console.log('\n\n=== Example 4: Comprehensive Resilience Strategy ===');
  
  // Create a resilience wrapper for blockchain operations
  const resilientBlockchainOps = createResilience({
    circuitName: 'blockchain-service',
    circuitOptions: {
      failureThreshold: 3,
      resetTimeout: 10000,
      trackHealth: true
    },
    networkAware: true,
    retryCount: 2,
    retryDelay: 1000
  });
  
  // Simulate blockchain transaction function with failure probability
  async function executeBlockchainTransaction(options) {
    console.log('Executing transaction with options:', options);
    
    // Simulate random failures
    if (Math.random() < 0.7) {
      throw new Error('Network timeout executing blockchain transaction');
    }
    
    return {
      success: true,
      transactionId: 'tx_' + Math.random().toString(36).substring(2, 15),
      timestamp: new Date().toISOString()
    };
  }
  
  // Attempt operation with resilience
  try {
    console.log('Attempting resilient blockchain operation...');
    
    // The operation itself is passed to the resilience wrapper
    const result = await resilientBlockchainOps(executeBlockchainTransaction);
    
    console.log('Operation succeeded:', result);
  } catch (error) {
    console.log('Operation ultimately failed:', error.message);
    
    // Show circuit breaker health info
    const breaker = getCircuitBreaker('blockchain-service');
    console.log('Circuit breaker health:', breaker.getHealth());
  }
}

// Run all examples
async function runExamples() {
  try {
    await basicCircuitBreakerExample();
    await registryExample();
    await highLevelExample();
    await comprehensiveResilienceExample();
    
    console.log('\n\n=== All circuit breakers in registry ===');
    for (const [name, breaker] of getAllCircuitBreakers()) {
      console.log(`- ${name}: ${breaker.state}`);
    }
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Import the getAllCircuitBreakers function
import { getAllCircuitBreakers } from '../cli/src/utils/network-resilience.js';

// Run the examples when this file is executed directly
runExamples().catch(console.error);