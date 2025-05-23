/**
 * Network Resilience Framework Tests
 * 
 * Tests the resilience patterns implemented for network operations
 * in the WalGit system, including circuit breakers, retry mechanisms,
 * and failure analytics.
 */

import { jest } from '@jest/globals';
import {
  CircuitBreaker,
  CircuitOpenError,
  withRetry,
  withCircuitBreaker,
  withNetworkAwareness,
  createResilientStrategy,
  resilientNetworkRequest,
  processBatchResilient,
  FailureLogger
} from '../cli/src/utils/resilience-index.js';

// Mock the network health monitor
jest.mock('../cli/src/utils/network-resilience.js', () => {
  const original = jest.requireActual('../cli/src/utils/network-resilience.js');
  return {
    ...original,
    networkMonitor: {
      isNetworkHealthy: jest.fn().mockResolvedValue(true),
      getAverageLatency: jest.fn().mockReturnValue(100),
      getRecommendedBatchSize: jest.fn().mockImplementation(val => val),
      getRecommendedConcurrency: jest.fn().mockImplementation(val => val),
      getRecommendedRetryCount: jest.fn().mockImplementation(val => val),
      getNetworkAwareRecommendations: jest.fn().mockReturnValue({
        batchSize: 10,
        concurrency: 3,
        retryCount: 3,
        networkStatus: 'healthy',
        averageLatency: 100,
        isHealthy: true
      })
    }
  };
});

// Mock the failure analytics
jest.mock('../cli/src/utils/failure-analytics.js', () => {
  const mockLogger = {
    logFailure: jest.fn(),
    recordSuccess: jest.fn(),
    getFailureStats: jest.fn().mockReturnValue({ totalCount: 0 }),
    analyzeFailurePatterns: jest.fn().mockReturnValue({ patternCount: 0, patterns: [] }),
    integrateWithCircuitBreaker: jest.fn().mockReturnValue(() => {})
  };
  
  return {
    default: mockLogger,
    FailureLogger: jest.fn().mockImplementation(() => mockLogger),
    withFailureTracking: jest.fn().mockImplementation((fn) => fn),
    createAnalyticsEnabledCircuitBreaker: jest.fn().mockImplementation(
      (name, options) => new CircuitBreaker({ name, ...options })
    )
  };
});

describe('Network Resilience Framework', () => {
  describe('CircuitBreaker', () => {
    let circuitBreaker;
    
    beforeEach(() => {
      circuitBreaker = new CircuitBreaker({
        name: 'test-circuit',
        failureThreshold: 3,
        resetTimeout: 100,
        halfOpenSuccessThreshold: 1
      });
    });
    
    test('should execute function when circuit is closed', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const result = await circuitBreaker.execute(mockFn);
      
      expect(mockFn).toHaveBeenCalled();
      expect(result).toBe('success');
      expect(circuitBreaker.state).toBe('CLOSED');
    });
    
    test('should open circuit after failure threshold is reached', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('test error'));
      
      // Fail enough times to open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('test error');
      }
      
      expect(circuitBreaker.state).toBe('OPEN');
      
      // Next call should be rejected with CircuitOpenError
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow(CircuitOpenError);
      expect(mockFn.mock.calls.length).toBe(3); // Should not have called the function again
    });
    
    test('should transition to half-open state after reset timeout', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('test error'));
      
      // Fail enough times to open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('test error');
      }
      
      expect(circuitBreaker.state).toBe('OPEN');
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Mock function to succeed next time
      mockFn.mockResolvedValueOnce('success');
      
      // Should enter half-open and let one request through
      const result = await circuitBreaker.execute(mockFn);
      
      expect(result).toBe('success');
      expect(circuitBreaker.state).toBe('CLOSED'); // Should be closed after success
    });
    
    test('should return to open state if half-open request fails', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('test error 1'))
        .mockRejectedValueOnce(new Error('test error 2'))
        .mockRejectedValueOnce(new Error('test error 3'))
        .mockRejectedValueOnce(new Error('half-open error'));
      
      // Fail enough times to open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow(/test error/);
      }
      
      expect(circuitBreaker.state).toBe('OPEN');
      
      // Force transition to half-open
      circuitBreaker.forceTransition('HALF_OPEN');
      
      // Half-open request fails
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('half-open error');
      
      expect(circuitBreaker.state).toBe('OPEN');
    });
  });
  
  describe('Retry Mechanism', () => {
    test('should retry failed operations', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('temporary error'))
        .mockResolvedValueOnce('success');
      
      const result = await withRetry(mockFn, { retryCount: 3, retryDelay: 10 });
      
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(result).toBe('success');
    });
    
    test('should give up after max retries', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('persistent error'));
      
      await expect(withRetry(mockFn, { retryCount: 2, retryDelay: 10 }))
        .rejects.toThrow('persistent error');
      
      expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
    
    test('should not retry if error is not retryable', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('non-retryable'));
      const isRetryable = (error) => error.message.includes('retryable');
      
      await expect(withRetry(mockFn, { 
        retryCount: 3, 
        retryDelay: 10,
        isRetryable
      })).rejects.toThrow('non-retryable');
      
      expect(mockFn).toHaveBeenCalledTimes(1); // No retries
    });
    
    test('should call onRetry callback before retrying', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('temp error'))
        .mockResolvedValueOnce('success');
      
      const onRetry = jest.fn();
      
      await withRetry(mockFn, { 
        retryCount: 2, 
        retryDelay: 10,
        onRetry
      });
      
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry.mock.calls[0][0]).toBe(0); // First attempt index
      expect(onRetry.mock.calls[0][1].message).toBe('temp error');
    });
  });
  
  describe('Integrated Resilience', () => {
    test('should create resilient execution strategy', async () => {
      const resilientStrategy = createResilientStrategy('network', {
        retryCount: 2,
        retryDelay: 10
      });
      
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      const result = await resilientStrategy(mockOperation);
      
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(result).toBe('success');
    });
    
    test('resilientNetworkRequest should wrap operations with resilience', async () => {
      const mockRequestFn = jest.fn().mockResolvedValue({ data: 'response data' });
      
      const result = await resilientNetworkRequest(mockRequestFn, {
        operation: 'test-request',
        url: 'https://example.com/api',
        retryCount: 1
      });
      
      expect(mockRequestFn).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ data: 'response data' });
    });
    
    test('processBatchResilient should handle batch operations with resilience', async () => {
      const operations = [
        jest.fn().mockResolvedValue('result 1'),
        jest.fn().mockResolvedValue('result 2'),
        jest.fn().mockRejectedValue(new Error('test error')),
      ];
      
      const executeFn = jest.fn().mockImplementation(op => op());
      
      const result = await processBatchResilient(operations, executeFn, {
        continueOnError: true, 
        concurrency: 1,
        retryCount: 1
      });
      
      expect(executeFn).toHaveBeenCalledTimes(3);
      expect(result.successful.length).toBe(2);
      expect(result.failed.length).toBe(1);
    });
  });
});