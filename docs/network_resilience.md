# Network Resilience Framework for WalGit

This document provides an overview of the Network Resilience Framework implemented in WalGit, which enhances the robustness and reliability of network operations when working with decentralized storage and blockchain systems.

## Table of Contents

1. [Overview](#overview)
2. [Core Components](#core-components)
3. [Integration Patterns](#integration-patterns)
4. [Usage Examples](#usage-examples)
5. [Failure Analytics](#failure-analytics)
6. [CLI Commands](#cli-commands)
7. [Configuration](#configuration)
8. [Development Guidelines](#development-guidelines)

## Overview

The Network Resilience Framework provides a comprehensive solution for handling network-related failures in distributed systems. It implements several resilience patterns like circuit breakers, enhanced retry logic, and failure analytics to ensure robust operation even under degraded network conditions.

Key features include:

- **Circuit Breaker Pattern**: Prevents cascading failures by stopping requests to failing services
- **Enhanced Retry Mechanisms**: Intelligent retry with exponential backoff and jitter
- **Network Health Monitoring**: Adaptive parameter adjustments based on network conditions
- **Failure Analytics**: Comprehensive tracking and analysis of failures to identify patterns
- **Batch Processing**: Network-aware concurrency and batching for optimal performance

## Core Components

### CircuitBreaker

The `CircuitBreaker` class implements the Circuit Breaker pattern to prevent cascading failures:

```javascript
const circuitBreaker = getCircuitBreaker('walrus-service', {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  halfOpenSuccessThreshold: 2
});

// Use the circuit breaker to protect a function
const result = await circuitBreaker.execute(async () => {
  // Function that might fail
  return await riskyNetworkOperation();
});
```

### Retry Mechanism

The `withRetry` function provides an enhanced retry mechanism:

```javascript
const result = await withRetry(
  async () => {
    // Operation that might need retrying
    return await networkRequest();
  },
  {
    retryCount: 3,
    retryDelay: 1000,
    backoffFactor: 1.5,
    jitterFactor: 0.1
  }
);
```

### Network Health Monitor

The `NetworkHealthMonitor` class tracks network health and provides adaptive recommendations:

```javascript
// Get network-aware recommendations
await networkMonitor.isNetworkHealthy();
const recommendations = networkMonitor.getNetworkAwareRecommendations();

console.log(`Recommended batch size: ${recommendations.batchSize}`);
console.log(`Recommended concurrency: ${recommendations.concurrency}`);
```

### Failure Logger

The `FailureLogger` class provides comprehensive failure tracking and analytics:

```javascript
// Log a failure with context
failureLogger.logFailure(error, {
  operation: 'store-blob',
  component: 'walrus-storage',
  severity: 'error',
  metadata: {
    blobHash: hash,
    size: data.length
  }
});

// Get failure statistics
const stats = failureLogger.getFailureStats();
console.log(`Total failures: ${stats.totalCount}`);
```

## Integration Patterns

The framework provides several integration patterns to simplify usage in different contexts:

### 1. High-Level Resilient Operations

Use these functions for specific operation types with built-in resilience:

```javascript
// For Sui blockchain transactions
const txResult = await resilience.executeSuiTransaction(client, txBlock, keypair, {
  operation: 'create-repository',
  waitForConfirmation: true
});

// For Walrus storage operations
const storeResult = await resilience.executeWalrusOperation(
  () => walrusStorage.storeContent(content, options),
  {
    operation: 'store-content',
    hash: contentHash
  }
);

// For general network requests
const apiResult = await resilience.resilientNetworkRequest(
  () => fetch('https://api.example.com/data'),
  {
    operation: 'fetch-api-data',
    url: 'https://api.example.com/data'
  }
);
```

### 2. Batch Processing with Resilience

For processing multiple operations with resilience:

```javascript
const results = await resilience.processBatchResilient(
  operations,
  executor,
  {
    operation: 'batch-upload',
    component: 'uploader',
    concurrency: 3,
    continueOnError: true
  }
);
```

### 3. Custom Resilience Strategy

For creating a custom resilience strategy:

```javascript
const resilientStrategy = resilience.createResilientStrategy('walrus', {
  retryCount: 3,
  circuitName: 'custom-walrus-circuit'
});

// Use the strategy
const result = await resilientStrategy(
  async () => customOperation()
);
```

## Usage Examples

### Example 1: Resilient Sui Transaction

```javascript
async function createRepository(name, description) {
  // Create a transaction block
  const txb = new TransactionBlock();
  txb.moveCall({
    target: `${packageId}::git_repository::create_repository`,
    arguments: [
      txb.pure(name),
      txb.pure(description || '')
    ]
  });
  
  // Execute with resilience
  return await resilience.executeSuiTransaction(client, txb, keypair, {
    operation: 'create-repository',
    component: 'repository-manager',
    waitForConfirmation: true,
    retryCount: 3
  });
}
```

### Example 2: Resilient Walrus Storage

```javascript
async function storeBlob(hash, data, metadata) {
  return await resilience.executeWalrusOperation(
    // The operation to perform
    () => walrusStorage.storeBlob({
      blobHash: hash,
      content: data.toString('base64'),
      repositoryId: config.currentRepository,
      ...metadata
    }),
    // Resilience options
    {
      operation: 'store-blob',
      component: 'blob-manager',
      hash: hash,
      size: data.length,
      metadata: metadata
    }
  );
}
```

### Example 3: Batch Processing

```javascript
async function migrateBlobs(hashes) {
  // Create migration operations
  const migrationOperations = hashes.map(hash => 
    async () => {
      // Operation implementation
      // ...
      return { hash, result: 'success' };
    }
  );
  
  // Process with resilience
  return await resilience.processBatchResilient(
    migrationOperations,
    op => op(),
    {
      operation: 'migrate-blobs',
      component: 'blob-manager',
      concurrency: 3,
      retryCount: 2,
      continueOnError: true
    }
  );
}
```

## Failure Analytics

The failure analytics system provides insights into failure patterns and helps identify potential issues:

### Getting Failure Statistics

```javascript
// Get statistics for failures in the last 7 days
const stats = failureLogger.getFailureStats({
  since: Date.now() - (7 * 24 * 60 * 60 * 1000)
});

console.log(`Total failures: ${stats.totalCount}`);
console.log('Failures by category:', stats.byCategory);
console.log('Top errors:', stats.topErrors);
```

### Analyzing Failure Patterns

```javascript
// Detect patterns in failures
const patterns = failureLogger.analyzeFailurePatterns();

console.log(`Detected ${patterns.patternCount} patterns`);
console.log('Recommendations:', patterns.recommendation);
```

### Tracking Failure Rates

```javascript
// Get failure rates for specific operations
const rates = failureLogger.getFailureRates({
  operation: 'store-blob',
  timeWindow: 24 * 60 * 60 * 1000 // 24 hours
});

console.log(`Failure rate: ${rates.operationStats.rate}%`);
```

## CLI Commands

The framework provides several CLI commands for monitoring and managing resilience:

### View Network Health

```bash
walgit health
```

Shows the current health status of network services, including circuit breaker states and network conditions.

### Reset Network Health

```bash
walgit health:reset
```

Resets all circuit breakers and network health monitoring.

### View Failure Analytics

```bash
walgit health:failures
```

Shows detailed failure analytics, including patterns, trends, and recommendations.

## Configuration

The resilience framework can be configured through:

### Runtime Configuration

```javascript
// Configure resilience parameters
resilience.createResilientStrategy('walrus', {
  retryCount: 5,
  retryDelay: 1000,
  backoffFactor: 1.5,
  circuitOptions: {
    failureThreshold: 3,
    resetTimeout: 20000
  }
});
```

### Configuration File Settings

In your WalGit config file, you can set resilience parameters:

```json
{
  "resilience": {
    "retryCount": 5,
    "retryDelay": 1000,
    "networkAware": true,
    "failureTracking": true,
    "circuits": {
      "sui": {
        "failureThreshold": 5,
        "resetTimeout": 30000
      },
      "walrus": {
        "failureThreshold": 3,
        "resetTimeout": 20000
      }
    }
  }
}
```

## Development Guidelines

When implementing resilience in your code:

1. **Use the Right Level of Abstraction**:
   - For specific operations, use the high-level functions (e.g., `executeSuiTransaction`)
   - For custom logic, create a resilient strategy with `createResilientStrategy`

2. **Add Context to Operations**:
   - Always provide `operation` and `component` names for better failure tracking
   - Add relevant metadata to help with failure analysis

3. **Handle Circuit Open Errors**:
   - Catch `CircuitOpenError` separately to provide user-friendly messages
   - Consider providing fallback behavior when circuits are open

4. **Monitor Failure Patterns**:
   - Regularly check failure analytics to identify recurring issues
   - Use recommendations to improve resilience strategies

5. **Test Failure Scenarios**:
   - Create tests that simulate different failure conditions
   - Verify that circuit breakers and retry logic work as expected

---

By following these guidelines and leveraging the resilience framework, you can build robust applications that gracefully handle network failures and provide a reliable user experience.