# Circuit Breaker Pattern in WalGit

This document provides guidance on using the Circuit Breaker pattern to improve the network resilience of WalGit applications.

## Overview

The Circuit Breaker pattern prevents cascading failures by stopping requests to a failing service. It works by monitoring failures and temporarily blocking requests when a service is struggling, allowing the service time to recover.

WalGit's implementation offers:

- Configurable failure thresholds and reset timeouts
- Three states: CLOSED (normal operation), OPEN (blocking requests), and HALF-OPEN (testing recovery)
- Health metrics tracking for monitoring system behavior
- Registry for managing multiple circuit breakers
- Integration with existing retry and network monitoring utilities

## Basic Usage

### Direct Circuit Breaker Usage

```javascript
import { CircuitBreaker } from '../cli/src/utils/network-resilience.js';

// Create a circuit breaker instance
const breaker = new CircuitBreaker({
  name: 'my-service',
  failureThreshold: 3,  // Open after 3 failures
  resetTimeout: 10000,  // Try again after 10 seconds
  onStateChange: (event) => {
    console.log(`Circuit changed from ${event.previousState} to ${event.newState}`);
  }
});

// Execute operation with circuit breaker protection
try {
  const result = await breaker.execute(() => {
    // Your service call here
    return callMyService();
  });
  
  console.log('Operation succeeded:', result);
} catch (error) {
  if (error instanceof CircuitOpenError) {
    console.log('Circuit is open, blocking the request');
  } else {
    console.log('Operation failed:', error.message);
  }
}
```

### Using the Registry

```javascript
import { getCircuitBreaker } from '../cli/src/utils/network-resilience.js';

// Get circuit breakers for different services
const authBreaker = getCircuitBreaker('authentication-service', {
  failureThreshold: 2,
  resetTimeout: 5000
});

const storageBreaker = getCircuitBreaker('storage-service', {
  failureThreshold: 5,
  resetTimeout: 30000
});

// Execute operations
const result1 = await authBreaker.execute(() => authenticateUser());
const result2 = await storageBreaker.execute(() => storeData());
```

## High-Level API

For most use cases, the high-level API is recommended:

### Using withCircuitBreaker

```javascript
import { withCircuitBreaker } from '../cli/src/utils/network-resilience.js';

// Execute operation with circuit breaker protection
try {
  const result = await withCircuitBreaker(
    'user-service',  // Circuit name
    () => fetchUserData(userId),  // Operation
    {  // Options
      circuitOptions: {
        failureThreshold: 3,
        resetTimeout: 10000
      },
      networkAware: true  // Apply network-aware parameters
    }
  );
  
  console.log('User data:', result);
} catch (error) {
  console.error('Operation failed:', error.message);
}
```

### Using createResilience

The most powerful approach is to create a resilience wrapper for your operations:

```javascript
import { createResilience } from '../cli/src/utils/network-resilience.js';

// Create a resilience wrapper
const resilientBlockchainOps = createResilience({
  circuitName: 'blockchain-service',
  circuitOptions: {
    failureThreshold: 3,
    resetTimeout: 15000,
    trackHealth: true
  },
  networkAware: true,
  retryCount: 3,
  retryDelay: 1000
});

// Use the wrapper for operations
async function executeTransaction(params) {
  try {
    // The operation is passed to the resilience wrapper
    return await resilientBlockchainOps(async () => {
      // Your blockchain transaction logic here
      return await blockchainClient.executeTransaction(params);
    });
  } catch (error) {
    // Handle ultimate failure after all resilience attempts
    console.error('Transaction failed:', error.message);
    throw error;
  }
}
```

## Using with Blockchain Operations

The circuit breaker pattern is especially useful for blockchain operations, where network reliability can vary:

```javascript
import { blockchain } from '../cli/src/utils/index.js';

// Create resilience wrapper for blockchain operations
const resilientBlockchain = blockchain.createResilience({
  circuitName: 'sui-operations',
  networkAware: true
});

// Execute blockchain transaction with resilience
async function createRepository(name, description) {
  return resilientBlockchain(async () => {
    const txb = createTransactionBlock();
    
    // Add repository creation to transaction
    txb.moveCall({
      target: `${packageId}::git_repository::create_repository`,
      arguments: [txb.pure(name), txb.pure(description)]
    });
    
    // Execute with all resilience patterns applied
    return await blockchain.executeTransaction(client, txb, keypair);
  });
}
```

## Monitoring Circuit Breakers

You can monitor all circuit breakers in your application:

```javascript
import { getAllCircuitBreakers } from '../cli/src/utils/network-resilience.js';

// Get health information for all circuit breakers
function getSystemHealth() {
  const health = {
    circuitBreakers: {}
  };
  
  for (const [name, breaker] of getAllCircuitBreakers()) {
    health.circuitBreakers[name] = breaker.getHealth();
  }
  
  return health;
}

// Log circuit breaker states
function logCircuitBreakerStates() {
  console.log('Circuit breaker states:');
  for (const [name, breaker] of getAllCircuitBreakers()) {
    console.log(`- ${name}: ${breaker.state} (failures: ${breaker.failureCount})`);
  }
}
```

## Best Practices

1. **Granular Circuit Breakers**: Create separate circuit breakers for different services and operations with distinct failure characteristics.

2. **Appropriate Thresholds**: Set failure thresholds based on service reliability. Critical services might have higher thresholds to prevent premature blocking.

3. **Reasonable Reset Timeouts**: Set timeouts based on how long the service typically takes to recover. For blockchain services, 15-30 seconds is often reasonable.

4. **Monitor Circuit Health**: Use the health metrics to identify problematic services and adjust circuit breaker parameters accordingly.

5. **Use with Retry Logic**: Combine circuit breakers with retries for transient failures. The `createResilience` function handles this automatically.

6. **Fallback Mechanisms**: Implement fallbacks when circuit breakers are open, such as returning cached data or gracefully degrading functionality.

## Error Handling

When a circuit breaker is open, it throws a `CircuitOpenError` with information about when the circuit might reset:

```javascript
try {
  await withCircuitBreaker('service-name', () => callService());
} catch (error) {
  if (error instanceof CircuitOpenError) {
    console.log(`Service unavailable: ${error.message}`);
    console.log(`Recovery info: ${error.data.recovery}`);
    
    // Implement fallback behavior
    return getFromCache() || getDefaultValue();
  }
  
  // Handle other errors
  console.error('Operation error:', error.message);
}
```

## Circuit Breaker States

The circuit breaker has three states:

1. **CLOSED**: Normal operation - requests pass through to the service.
2. **OPEN**: Circuit is open - requests are blocked without calling the service.
3. **HALF-OPEN**: After the reset timeout, the circuit enters half-open state to test if the service has recovered. A successful request will close the circuit; a failure will reopen it.

## Configuration Options

When creating a circuit breaker, you can configure the following options:

| Option | Description | Default |
|--------|-------------|---------|
| `name` | Identifier for this circuit breaker | `'default'` |
| `failureThreshold` | Number of failures before opening the circuit | `5` |
| `resetTimeout` | Time in milliseconds before trying half-open state | `30000` (30s) |
| `halfOpenSuccessThreshold` | Successes needed in half-open state to close | `2` |
| `onStateChange` | Callback for state changes | `() => {}` |
| `trackHealth` | Whether to track detailed health metrics | `true` |
| `isFailure` | Function to determine if an error counts as failure | Default function |

## Integration with Other Resilience Patterns

WalGit's implementation integrates with other resilience patterns for comprehensive protection:

1. **Retry Pattern**: Handles transient failures with exponential backoff.
2. **Network Monitoring**: Adapts parameters based on network conditions.
3. **Timeout Pattern**: Prevents hanging operations with configurable timeouts.

Use the `createResilience` function to apply all these patterns together with minimal code.