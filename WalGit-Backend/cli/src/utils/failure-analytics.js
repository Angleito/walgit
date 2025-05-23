/**
 * Failure Analytics System
 * 
 * This module provides comprehensive tracking, analysis and visualization of 
 * failure patterns in WalGit operations, helping identify systemic issues and
 * improve resilience strategies.
 * 
 * Key features:
 * - Detailed failure capture with contextual information
 * - Temporal pattern recognition and trend analysis
 * - Correlation of failures across operations and components
 * - Console-based visualization for failure statistics
 * - Integration with CircuitBreaker for enhanced resilience strategies
 * - Configurable retention policies and storage management
 */

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { getWalGitDir, getSettings } from './config.js';
import { formatDate, formatDuration, formatPercentage } from './format-utils.js';
import { WalGitError, NetworkError, TransactionError, StorageError } from './error-handler.js';
import { CircuitBreaker, getCircuitBreaker, getAllCircuitBreakers } from './network-resilience.js';
import { 
  classifyTransactionError, 
  enhanceTransactionError 
} from './transaction-utils.js';

// Constants for failure analytics
const DEFAULT_LOG_RETENTION_DAYS = 30;
const MAX_FAILURES_IN_MEMORY = 1000;
const ANALYTICS_FILE_PATH = path.join(os.homedir(), '.walgit', 'analytics', 'failure_stats.json');
const FAILURE_LOG_PATH = path.join(os.homedir(), '.walgit', 'analytics', 'failures');
const DEFAULT_SEVERITY_LEVELS = ['info', 'warning', 'error', 'critical'];
const DEFAULT_CATEGORIES = ['network', 'storage', 'transaction', 'authentication', 'validation', 'unknown'];
const CORRELATION_THRESHOLD = 0.7; // Threshold for considering failures correlated
const PATTERN_DETECTION_MIN_COUNT = 3; // Minimum count of similar failures to consider it a pattern
const MAX_FAILURE_LOG_SIZE = 10 * 1024 * 1024; // 10MB max log file size

// Ensure analytics directories exist
try {
  fs.mkdirSync(path.join(os.homedir(), '.walgit', 'analytics'), { recursive: true });
  fs.mkdirSync(FAILURE_LOG_PATH, { recursive: true });
} catch (error) {
  // Directory already exists or can't be created, just continue
}

/**
 * Main FailureLogger class for capturing, analyzing and visualizing failure data
 */
export class FailureLogger {
  /**
   * Create a new FailureLogger instance
   * @param {Object} options - Configuration options
   * @param {number} options.retentionDays - Number of days to retain failure data
   * @param {boolean} options.enableConsoleLogging - Whether to log failures to console
   * @param {boolean} options.enableCircuitBreakerIntegration - Whether to integrate with circuit breakers
   * @param {boolean} options.enablePatternDetection - Whether to enable pattern detection
   * @param {Array<string>} options.severityLevels - Custom severity levels
   * @param {Array<string>} options.categories - Custom failure categories
   * @param {number} options.maxFailuresInMemory - Maximum failures to keep in memory
   */
  constructor(options = {}) {
    this.retentionDays = options.retentionDays || DEFAULT_LOG_RETENTION_DAYS;
    this.enableConsoleLogging = options.enableConsoleLogging !== false;
    this.enableCircuitBreakerIntegration = options.enableCircuitBreakerIntegration !== false;
    this.enablePatternDetection = options.enablePatternDetection !== false;
    this.severityLevels = options.severityLevels || [...DEFAULT_SEVERITY_LEVELS];
    this.categories = options.categories || [...DEFAULT_CATEGORIES];
    this.maxFailuresInMemory = options.maxFailuresInMemory || MAX_FAILURES_IN_MEMORY;
    
    // Initialize storage
    this.failures = [];
    this.stats = this._loadStats();
    this.patterns = new Map();
    this.lastCleanup = Date.now();
    
    // Initialize circuit breaker listeners if enabled
    if (this.enableCircuitBreakerIntegration) {
      this._initCircuitBreakerListeners();
    }
  }
  
  /**
   * Logs a failure event
   * @param {Error} error - The error that occurred
   * @param {Object} context - Additional context information
   * @param {string} context.operation - Operation that failed
   * @param {string} context.component - Component where failure occurred
   * @param {string} context.severity - Severity level (default: 'error')
   * @param {string} context.category - Failure category (default: auto-detected)
   * @param {Object} context.metadata - Additional metadata about the failure
   * @returns {string} Failure ID
   */
  logFailure(error, context = {}) {
    // Generate failure ID
    const failureId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    // Auto-detect error type if not provided
    let errorType = context.category || 'unknown';
    let severity = context.severity || 'error';
    
    // Auto-detect error category based on error type
    if (error instanceof NetworkError) {
      errorType = 'network';
    } else if (error instanceof StorageError) {
      errorType = 'storage';
    } else if (error instanceof TransactionError) {
      errorType = 'transaction';
    } else if (error instanceof WalGitError) {
      errorType = error.code.toLowerCase().includes('auth') ? 'authentication' : 
                 error.code.toLowerCase().includes('valid') ? 'validation' : 'application';
    } else if (error && typeof error === 'object') {
      // Try to detect based on error message
      const message = error.message.toLowerCase();
      if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
        errorType = 'network';
      } else if (message.includes('storage') || message.includes('file')) {
        errorType = 'storage';
      } else if (message.includes('transaction') || message.includes('blockchain')) {
        errorType = 'transaction';
      }
    }
    
    // Auto-detect severity for known error types
    if (context.severity === undefined) {
      if (errorType === 'network' && error.message.includes('retry')) {
        severity = 'warning';
      } else if (errorType === 'storage' && error.message.includes('temporary')) {
        severity = 'warning';
      } else if (error.message.includes('critical') || error.message.includes('fatal')) {
        severity = 'critical';
      }
    }
    
    // Normalize severity
    if (!this.severityLevels.includes(severity)) {
      severity = 'error';
    }
    
    // Normalize category
    if (!this.categories.includes(errorType)) {
      errorType = 'unknown';
    }
    
    // Create failure record
    const failure = {
      id: failureId,
      timestamp,
      errorType,
      severity,
      operation: context.operation || 'unknown',
      component: context.component || 'unknown',
      message: error.message,
      stack: error.stack,
      metadata: context.metadata || {},
      errorName: error.name || (error.constructor ? error.constructor.name : 'Unknown'),
      errorCode: error.code || (error instanceof WalGitError ? error.code : undefined),
      transactionType: context.transactionType,
      userImpact: context.userImpact || 'unknown'
    };
    
    // For transaction errors, add more detail
    if (errorType === 'transaction') {
      failure.transactionDetails = {
        classification: error.errorType || (error.message ? classifyTransactionError(error) : 'unknown'),
        suggestion: error.suggestion || (error.userMessage ? error.userMessage : null),
        digest: error.data?.transactionDigest || context.metadata?.digest || null,
        phase: error.context?.phase || context.metadata?.phase || null
      };
    }
    
    // Add to in-memory store (with limit)
    this.failures.push(failure);
    if (this.failures.length > this.maxFailuresInMemory) {
      this.failures.shift(); // Remove oldest
    }
    
    // Update stats
    this._updateStats(failure);
    
    // Save to disk
    this._persistFailure(failure);
    
    // Console logging if enabled
    if (this.enableConsoleLogging) {
      this._logToConsole(failure);
    }
    
    // Run pattern detection if enabled
    if (this.enablePatternDetection) {
      this._detectPatterns(failure);
    }
    
    // Clean up old data if needed
    if (Date.now() - this.lastCleanup > 86400000) { // Once a day
      this._cleanupOldData();
      this.lastCleanup = Date.now();
    }
    
    return failureId;
  }
  
  /**
   * Gets detailed statistics about failures
   * @param {Object} options - Filter options
   * @param {string} options.category - Filter by category
   * @param {string} options.severity - Filter by severity
   * @param {string} options.component - Filter by component
   * @param {string} options.operation - Filter by operation
   * @param {number} options.since - Timestamp to filter from
   * @param {number} options.until - Timestamp to filter to
   * @returns {Object} Aggregated statistics
   */
  getFailureStats(options = {}) {
    // Apply filters to failures
    const filteredFailures = this._filterFailures(this.failures, options);
    
    // Aggregate stats
    const stats = {
      totalCount: filteredFailures.length,
      byCategory: {},
      bySeverity: {},
      byComponent: {},
      byOperation: {},
      byHour: {},
      byDay: {},
      topErrors: [],
      timeDistribution: [],
      recentTrend: this._calculateTrend(filteredFailures)
    };
    
    // Calculate counts by different dimensions
    filteredFailures.forEach(failure => {
      // By category
      stats.byCategory[failure.errorType] = (stats.byCategory[failure.errorType] || 0) + 1;
      
      // By severity
      stats.bySeverity[failure.severity] = (stats.bySeverity[failure.severity] || 0) + 1;
      
      // By component
      stats.byComponent[failure.component] = (stats.byComponent[failure.component] || 0) + 1;
      
      // By operation
      stats.byOperation[failure.operation] = (stats.byOperation[failure.operation] || 0) + 1;
      
      // By hour
      const hour = new Date(failure.timestamp).toISOString().slice(0, 13);
      stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
      
      // By day
      const day = new Date(failure.timestamp).toISOString().slice(0, 10);
      stats.byDay[day] = (stats.byDay[day] || 0) + 1;
    });
    
    // Find top errors (by message)
    const errorMessages = {};
    filteredFailures.forEach(failure => {
      const message = failure.message.slice(0, 100); // Truncate long messages
      errorMessages[message] = (errorMessages[message] || 0) + 1;
    });
    
    stats.topErrors = Object.entries(errorMessages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }));
    
    // Time distribution for visualization
    const timeRange = this._calculateTimeRanges(filteredFailures);
    stats.timeDistribution = timeRange;
    
    return stats;
  }
  
  /**
   * Analyzes failure patterns to identify correlations and potential root causes
   * @param {Object} options - Analysis options
   * @param {boolean} options.includeVisualization - Whether to include ASCII visualization
   * @param {number} options.minConfidence - Minimum confidence score for patterns
   * @param {boolean} options.groupByComponent - Whether to group patterns by component
   * @returns {Object} Analysis results with identified patterns
   */
  analyzeFailurePatterns(options = {}) {
    const includeVisualization = options.includeVisualization !== false;
    const minConfidence = options.minConfidence || CORRELATION_THRESHOLD;
    const groupByComponent = options.groupByComponent !== false;
    
    // Get a copy of current detected patterns
    const detectedPatterns = Array.from(this.patterns.entries())
      .filter(([_, pattern]) => pattern.confidence >= minConfidence)
      .map(([patternKey, pattern]) => ({
        ...pattern,
        key: patternKey
      }))
      .sort((a, b) => b.occurrences.length - a.occurrences.length);
    
    // Find correlations between different errors
    const correlations = this._findCorrelations(this.failures);
    
    // Structure results
    const results = {
      patternCount: detectedPatterns.length,
      patterns: detectedPatterns,
      correlations,
      recentFailures: this.failures.slice(-10),
      summary: this._generatePatternSummary(detectedPatterns, correlations),
      recommendation: this._generateRecommendations(detectedPatterns, correlations)
    };
    
    // Group by component if requested
    if (groupByComponent) {
      results.patternsByComponent = {};
      
      detectedPatterns.forEach(pattern => {
        const component = pattern.component || 'unknown';
        if (!results.patternsByComponent[component]) {
          results.patternsByComponent[component] = [];
        }
        results.patternsByComponent[component].push(pattern);
      });
    }
    
    // Add visualization if requested
    if (includeVisualization) {
      results.visualization = this._generatePatternVisualization(detectedPatterns, correlations);
    }
    
    return results;
  }
  
  /**
   * Generates a detailed report for a specific failure
   * @param {string} failureId - ID of the failure to report on
   * @returns {Object|null} Detailed failure report or null if not found
   */
  getFailureReport(failureId) {
    // First check in-memory failures
    let failure = this.failures.find(f => f.id === failureId);
    
    // If not found, try to load from disk
    if (!failure) {
      try {
        const failurePath = path.join(FAILURE_LOG_PATH, `${failureId}.json`);
        if (fs.existsSync(failurePath)) {
          const fileContent = fs.readFileSync(failurePath, 'utf8');
          failure = JSON.parse(fileContent);
        }
      } catch (error) {
        console.warn(`Failed to load failure ${failureId}:`, error.message);
        return null;
      }
    }
    
    if (!failure) {
      return null;
    }
    
    // Find similar failures
    const similarFailures = this._findSimilarFailures(failure);
    
    // Compile detailed report
    return {
      failure,
      similarFailures,
      patterns: Array.from(this.patterns.values())
        .filter(pattern => pattern.occurrences.some(o => o.id === failureId)),
      circuitBreakerStatus: this.enableCircuitBreakerIntegration ? 
        this._getRelevantCircuitBreakerStatus(failure) : null,
      recommendation: this._generateFailureSpecificRecommendation(failure, similarFailures)
    };
  }
  
  /**
   * Gets failure rates for specific operations or components
   * @param {Object} options - Filter options
   * @param {string} options.operation - Operation to get rates for
   * @param {string} options.component - Component to get rates for
   * @param {number} options.timeWindow - Time window in milliseconds
   * @returns {Object} Failure rates and statistics
   */
  getFailureRates(options = {}) {
    const timeWindow = options.timeWindow || 24 * 60 * 60 * 1000; // Default 24 hours
    const since = Date.now() - timeWindow;
    
    // Get relevant stats
    const stats = this.stats || { operations: {}, components: {} };
    
    const results = {
      timeWindow,
      windowStart: new Date(since).toISOString(),
      windowEnd: new Date().toISOString(),
      overall: {
        attempts: 0,
        failures: 0,
        rate: 0
      },
      byOperation: {},
      byComponent: {},
      byCategory: {},
      timeSeries: []
    };
    
    // Filter operations
    if (options.operation) {
      const opStats = stats.operations[options.operation] || {};
      const recentFailures = (opStats.failures || [])
        .filter(f => new Date(f.timestamp).getTime() > since);
      
      results.operation = options.operation;
      results.operationStats = {
        attempts: opStats.attempts || 0,
        failures: recentFailures.length,
        rate: opStats.attempts ? (recentFailures.length / opStats.attempts) * 100 : 0,
        categories: this._countByProperty(recentFailures, 'errorType'),
        severities: this._countByProperty(recentFailures, 'severity')
      };
    }
    
    // Filter components
    if (options.component) {
      const compStats = stats.components[options.component] || {};
      const recentFailures = (compStats.failures || [])
        .filter(f => new Date(f.timestamp).getTime() > since);
      
      results.component = options.component;
      results.componentStats = {
        attempts: compStats.attempts || 0,
        failures: recentFailures.length,
        rate: compStats.attempts ? (recentFailures.length / compStats.attempts) * 100 : 0,
        categories: this._countByProperty(recentFailures, 'errorType'),
        severities: this._countByProperty(recentFailures, 'severity'),
        operations: this._countByProperty(recentFailures, 'operation')
      };
    }
    
    // Get failures in the time window
    const recentFailures = this.failures
      .filter(f => new Date(f.timestamp).getTime() > since);
    
    // Calculate overall stats
    const totalAttempts = Object.values(stats.operations || {})
      .reduce((sum, op) => sum + (op.attempts || 0), 0);
    
    results.overall = {
      attempts: totalAttempts,
      failures: recentFailures.length,
      rate: totalAttempts ? (recentFailures.length / totalAttempts) * 100 : 0
    };
    
    // Calculate by operation
    const operationFailures = this._groupByProperty(recentFailures, 'operation');
    Object.entries(operationFailures).forEach(([op, failures]) => {
      const opStats = stats.operations[op] || { attempts: 0 };
      results.byOperation[op] = {
        attempts: opStats.attempts || 0,
        failures: failures.length,
        rate: opStats.attempts ? (failures.length / opStats.attempts) * 100 : 0
      };
    });
    
    // Calculate by component
    const componentFailures = this._groupByProperty(recentFailures, 'component');
    Object.entries(componentFailures).forEach(([comp, failures]) => {
      const compStats = stats.components[comp] || { attempts: 0 };
      results.byComponent[comp] = {
        attempts: compStats.attempts || 0,
        failures: failures.length,
        rate: compStats.attempts ? (failures.length / compStats.attempts) * 100 : 0
      };
    });
    
    // Calculate by category
    results.byCategory = this._countByProperty(recentFailures, 'errorType');
    
    // Generate time series data for visualization
    results.timeSeries = this._generateTimeSeries(recentFailures, since);
    
    return results;
  }
  
  /**
   * Records a successful operation to maintain accurate failure rates
   * @param {string} operation - Operation name
   * @param {string} component - Component name
   */
  recordSuccess(operation, component) {
    if (!operation) return;
    
    // Initialize stat objects if needed
    if (!this.stats.operations[operation]) {
      this.stats.operations[operation] = { attempts: 0, successes: 0, failures: [] };
    }
    
    if (component && !this.stats.components[component]) {
      this.stats.components[component] = { attempts: 0, successes: 0, failures: [] };
    }
    
    // Update operation stats
    this.stats.operations[operation].attempts++;
    this.stats.operations[operation].successes = 
      (this.stats.operations[operation].successes || 0) + 1;
    
    // Update component stats if provided
    if (component) {
      this.stats.components[component].attempts++;
      this.stats.components[component].successes = 
        (this.stats.components[component].successes || 0) + 1;
    }
    
    // Persist updated stats periodically
    this._saveStatsDebounced();
  }
  
  /**
   * Integrates with a CircuitBreaker to inform its behavior based on failure analytics
   * @param {CircuitBreaker} circuitBreaker - Circuit breaker to integrate with
   * @param {Object} options - Integration options
   * @param {string} options.targetOperation - Operation to monitor for this circuit
   * @param {string} options.targetComponent - Component to monitor for this circuit
   * @returns {Function} Unsubscribe function
   */
  integrateWithCircuitBreaker(circuitBreaker, options = {}) {
    if (!this.enableCircuitBreakerIntegration) {
      console.warn('Circuit breaker integration is disabled');
      return () => {};
    }
    
    const targetOperation = options.targetOperation;
    const targetComponent = options.targetComponent;
    
    if (!targetOperation && !targetComponent) {
      throw new Error('Either targetOperation or targetComponent must be specified');
    }
    
    // Create a circuit state change handler
    const handleStateChange = (stateChangeInfo) => {
      // Log the circuit state change as a special type of failure or event
      this.logFailure(
        new Error(`Circuit ${circuitBreaker.name} state changed from ${stateChangeInfo.previousState} to ${stateChangeInfo.newState}`),
        {
          operation: targetOperation || 'circuit_breaker',
          component: targetComponent || circuitBreaker.name,
          severity: stateChangeInfo.newState === 'OPEN' ? 'error' : 'info',
          category: 'circuit_breaker',
          metadata: {
            circuitName: circuitBreaker.name,
            previousState: stateChangeInfo.previousState,
            newState: stateChangeInfo.newState,
            metrics: stateChangeInfo.metrics
          }
        }
      );
    };
    
    // Set up custom isFailure function that uses our analytics
    const originalIsFailure = circuitBreaker.isFailure;
    circuitBreaker.isFailure = (error) => {
      // First use the original function
      const isFailureByOriginal = originalIsFailure(error);
      
      // If the original function already determined it's a failure, trust it
      if (isFailureByOriginal) {
        return true;
      }
      
      // Otherwise, use our analytics to make a more informed decision
      const patterns = this.analyzeFailurePatterns({
        includeVisualization: false,
        minConfidence: 0.5
      });
      
      // If we've seen this error pattern frequently, consider it a failure
      const errorMessage = error.message.toLowerCase();
      const matchingPattern = patterns.patterns.find(pattern => 
        pattern.signature.toLowerCase().includes(errorMessage.substring(0, 30)) ||
        errorMessage.includes(pattern.signature.toLowerCase().substring(0, 30))
      );
      
      return matchingPattern !== undefined;
    };
    
    // Register our state change handler
    const originalOnStateChange = circuitBreaker.onStateChange;
    circuitBreaker.onStateChange = (info) => {
      // Call our handler
      handleStateChange(info);
      
      // Also call the original handler if it exists
      if (originalOnStateChange) {
        originalOnStateChange(info);
      }
    };
    
    // Return a function to unsubscribe and restore original handlers
    return () => {
      circuitBreaker.isFailure = originalIsFailure;
      circuitBreaker.onStateChange = originalOnStateChange;
    };
  }
  
  /**
   * Clears all failure data, resetting the analytics
   */
  clearAllData() {
    this.failures = [];
    this.patterns.clear();
    this.stats = {
      startTime: Date.now(),
      totalFailures: 0,
      categories: {},
      severities: {},
      operations: {},
      components: {}
    };
    
    // Save empty stats
    this._saveStats();
    
    // Attempt to clean up failure log files
    try {
      const files = fs.readdirSync(FAILURE_LOG_PATH);
      for (const file of files) {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(FAILURE_LOG_PATH, file));
        }
      }
    } catch (error) {
      console.warn('Failed to clean up failure log files:', error.message);
    }
  }
  
  // Private methods
  
  /**
   * Initializes circuit breaker state change listeners
   * @private
   */
  _initCircuitBreakerListeners() {
    // No op - will be set up when integrating specific circuit breakers
  }
  
  /**
   * Persists a failure to disk
   * @param {Object} failure - Failure to persist
   * @private
   */
  _persistFailure(failure) {
    try {
      const failurePath = path.join(FAILURE_LOG_PATH, `${failure.id}.json`);
      fs.writeFileSync(failurePath, JSON.stringify(failure, null, 2));
    } catch (error) {
      console.warn('Failed to persist failure:', error.message);
    }
  }
  
  /**
   * Updates statistics with a new failure
   * @param {Object} failure - Failure to update stats with
   * @private
   */
  _updateStats(failure) {
    // Initialize stats if needed
    if (!this.stats) {
      this.stats = {
        startTime: Date.now(),
        totalFailures: 0,
        categories: {},
        severities: {},
        operations: {},
        components: {}
      };
    }
    
    // Update global counts
    this.stats.totalFailures++;
    
    // Update category counts
    this.stats.categories[failure.errorType] = (this.stats.categories[failure.errorType] || 0) + 1;
    
    // Update severity counts
    this.stats.severities[failure.severity] = (this.stats.severities[failure.severity] || 0) + 1;
    
    // Initialize operation stats if needed
    if (!this.stats.operations[failure.operation]) {
      this.stats.operations[failure.operation] = {
        attempts: 0,
        failures: []
      };
    }
    
    // Update operation stats
    this.stats.operations[failure.operation].attempts++;
    this.stats.operations[failure.operation].failures.push({
      id: failure.id,
      timestamp: failure.timestamp,
      errorType: failure.errorType,
      severity: failure.severity,
      message: failure.message
    });
    
    // Keep only last 100 failures per operation
    if (this.stats.operations[failure.operation].failures.length > 100) {
      this.stats.operations[failure.operation].failures = 
        this.stats.operations[failure.operation].failures.slice(-100);
    }
    
    // Initialize component stats if needed
    if (!this.stats.components[failure.component]) {
      this.stats.components[failure.component] = {
        attempts: 0,
        failures: []
      };
    }
    
    // Update component stats
    this.stats.components[failure.component].attempts++;
    this.stats.components[failure.component].failures.push({
      id: failure.id,
      timestamp: failure.timestamp,
      errorType: failure.errorType,
      severity: failure.severity,
      message: failure.message,
      operation: failure.operation
    });
    
    // Keep only last 100 failures per component
    if (this.stats.components[failure.component].failures.length > 100) {
      this.stats.components[failure.component].failures = 
        this.stats.components[failure.component].failures.slice(-100);
    }
    
    // Persist updated stats periodically
    this._saveStatsDebounced();
  }
  
  /**
   * Saves the current stats to disk (debounced to prevent excessive writes)
   * @private
   */
  _saveStatsDebounced() {
    if (this._saveStatsTimeout) {
      clearTimeout(this._saveStatsTimeout);
    }
    
    this._saveStatsTimeout = setTimeout(() => {
      this._saveStats();
    }, 5000); // 5 second debounce
  }
  
  /**
   * Saves the current stats to disk
   * @private
   */
  _saveStats() {
    try {
      fs.writeFileSync(ANALYTICS_FILE_PATH, JSON.stringify(this.stats, null, 2));
    } catch (error) {
      console.warn('Failed to save failure stats:', error.message);
    }
  }
  
  /**
   * Loads stats from disk
   * @returns {Object} Loaded stats or new stats object
   * @private
   */
  _loadStats() {
    try {
      if (fs.existsSync(ANALYTICS_FILE_PATH)) {
        const fileContent = fs.readFileSync(ANALYTICS_FILE_PATH, 'utf8');
        return JSON.parse(fileContent);
      }
    } catch (error) {
      console.warn('Failed to load failure stats:', error.message);
    }
    
    return {
      startTime: Date.now(),
      totalFailures: 0,
      categories: {},
      severities: {},
      operations: {},
      components: {}
    };
  }
  
  /**
   * Cleans up old failure data
   * @private
   */
  _cleanupOldData() {
    const cutoffTime = Date.now() - (this.retentionDays * 24 * 60 * 60 * 1000);
    
    // Clean up in-memory failures
    this.failures = this.failures.filter(failure => 
      new Date(failure.timestamp).getTime() > cutoffTime
    );
    
    // Clean up on-disk failures
    try {
      const files = fs.readdirSync(FAILURE_LOG_PATH);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(FAILURE_LOG_PATH, file);
          try {
            const stats = fs.statSync(filePath);
            if (stats.mtime.getTime() < cutoffTime) {
              fs.unlinkSync(filePath);
            }
          } catch (error) {
            // Skip this file if there's an error
          }
        }
      }
    } catch (error) {
      console.warn('Failed to clean up old failure logs:', error.message);
    }
    
    // Update pattern occurrences
    for (const [key, pattern] of this.patterns.entries()) {
      pattern.occurrences = pattern.occurrences.filter(occurrence => 
        new Date(occurrence.timestamp).getTime() > cutoffTime
      );
      
      // Remove patterns that no longer have enough occurrences
      if (pattern.occurrences.length < PATTERN_DETECTION_MIN_COUNT) {
        this.patterns.delete(key);
      }
    }
  }
  
  /**
   * Filters failures based on criteria
   * @param {Array<Object>} failures - Failures to filter
   * @param {Object} options - Filter criteria
   * @returns {Array<Object>} Filtered failures
   * @private
   */
  _filterFailures(failures, options = {}) {
    return failures.filter(failure => {
      if (options.category && failure.errorType !== options.category) {
        return false;
      }
      
      if (options.severity && failure.severity !== options.severity) {
        return false;
      }
      
      if (options.component && failure.component !== options.component) {
        return false;
      }
      
      if (options.operation && failure.operation !== options.operation) {
        return false;
      }
      
      if (options.since && new Date(failure.timestamp).getTime() < options.since) {
        return false;
      }
      
      if (options.until && new Date(failure.timestamp).getTime() > options.until) {
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Calculates time ranges for time-based visualizations
   * @param {Array<Object>} failures - Failures to analyze
   * @returns {Array<Object>} Time range data
   * @private
   */
  _calculateTimeRanges(failures) {
    if (failures.length === 0) {
      return [];
    }
    
    // Get time range
    const timestamps = failures.map(f => new Date(f.timestamp).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    
    // If less than 1 hour range, use minutes
    if (maxTime - minTime < 60 * 60 * 1000) {
      return this._calculateMinuteDistribution(failures, minTime, maxTime);
    }
    
    // If less than 1 day range, use hours
    if (maxTime - minTime < 24 * 60 * 60 * 1000) {
      return this._calculateHourDistribution(failures, minTime, maxTime);
    }
    
    // Otherwise use days
    return this._calculateDayDistribution(failures, minTime, maxTime);
  }
  
  /**
   * Calculates minute-based distribution of failures
   * @param {Array<Object>} failures - Failures to analyze
   * @param {number} minTime - Minimum timestamp
   * @param {number} maxTime - Maximum timestamp
   * @returns {Array<Object>} Minute distribution data
   * @private
   */
  _calculateMinuteDistribution(failures, minTime, maxTime) {
    const result = [];
    const minuteBuckets = {};
    
    // Group by minute
    failures.forEach(failure => {
      const date = new Date(failure.timestamp);
      const minuteKey = date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
      minuteBuckets[minuteKey] = (minuteBuckets[minuteKey] || 0) + 1;
    });
    
    // Fill in gaps and create result array
    const startMinute = new Date(minTime);
    startMinute.setSeconds(0, 0);
    const endMinute = new Date(maxTime);
    endMinute.setSeconds(0, 0);
    
    for (let min = startMinute; min <= endMinute; min = new Date(min.getTime() + 60000)) {
      const minuteKey = min.toISOString().slice(0, 16);
      result.push({
        time: minuteKey,
        count: minuteBuckets[minuteKey] || 0,
        label: min.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
    
    return result;
  }
  
  /**
   * Calculates hour-based distribution of failures
   * @param {Array<Object>} failures - Failures to analyze
   * @param {number} minTime - Minimum timestamp
   * @param {number} maxTime - Maximum timestamp
   * @returns {Array<Object>} Hour distribution data
   * @private
   */
  _calculateHourDistribution(failures, minTime, maxTime) {
    const result = [];
    const hourBuckets = {};
    
    // Group by hour
    failures.forEach(failure => {
      const date = new Date(failure.timestamp);
      const hourKey = date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
      hourBuckets[hourKey] = (hourBuckets[hourKey] || 0) + 1;
    });
    
    // Fill in gaps and create result array
    const startHour = new Date(minTime);
    startHour.setMinutes(0, 0, 0);
    const endHour = new Date(maxTime);
    endHour.setMinutes(0, 0, 0);
    
    for (let hour = startHour; hour <= endHour; hour = new Date(hour.getTime() + 3600000)) {
      const hourKey = hour.toISOString().slice(0, 13);
      result.push({
        time: hourKey,
        count: hourBuckets[hourKey] || 0,
        label: hour.toLocaleString([], { hour: '2-digit', month: 'short', day: 'numeric' })
      });
    }
    
    return result;
  }
  
  /**
   * Calculates day-based distribution of failures
   * @param {Array<Object>} failures - Failures to analyze
   * @param {number} minTime - Minimum timestamp
   * @param {number} maxTime - Maximum timestamp
   * @returns {Array<Object>} Day distribution data
   * @private
   */
  _calculateDayDistribution(failures, minTime, maxTime) {
    const result = [];
    const dayBuckets = {};
    
    // Group by day
    failures.forEach(failure => {
      const date = new Date(failure.timestamp);
      const dayKey = date.toISOString().slice(0, 10); // YYYY-MM-DD
      dayBuckets[dayKey] = (dayBuckets[dayKey] || 0) + 1;
    });
    
    // Fill in gaps and create result array
    const startDay = new Date(minTime);
    startDay.setHours(0, 0, 0, 0);
    const endDay = new Date(maxTime);
    endDay.setHours(0, 0, 0, 0);
    
    for (let day = startDay; day <= endDay; day = new Date(day.getTime() + 86400000)) {
      const dayKey = day.toISOString().slice(0, 10);
      result.push({
        time: dayKey,
        count: dayBuckets[dayKey] || 0,
        label: day.toLocaleDateString([], { month: 'short', day: 'numeric' })
      });
    }
    
    return result;
  }
  
  /**
   * Calculates the trend in failure rates
   * @param {Array<Object>} failures - Failures to analyze
   * @returns {Object} Trend information
   * @private
   */
  _calculateTrend(failures) {
    if (failures.length < 2) {
      return { direction: 'stable', percentage: 0 };
    }
    
    // Split the failures into two time periods
    const sortedTimestamps = failures
      .map(f => new Date(f.timestamp).getTime())
      .sort((a, b) => a - b);
    
    const halfwayPoint = sortedTimestamps[Math.floor(sortedTimestamps.length / 2)];
    const oldFailures = failures.filter(f => new Date(f.timestamp).getTime() < halfwayPoint);
    const newFailures = failures.filter(f => new Date(f.timestamp).getTime() >= halfwayPoint);
    
    // Calculate failure rates in each period
    const oldRate = oldFailures.length;
    const newRate = newFailures.length;
    
    // Calculate percentage change
    let percentageChange = 0;
    if (oldRate > 0) {
      percentageChange = ((newRate - oldRate) / oldRate) * 100;
    } else if (newRate > 0) {
      percentageChange = 100; // If there were no old failures but there are new ones
    }
    
    // Determine trend direction
    let direction = 'stable';
    if (percentageChange > 10) {
      direction = 'increasing';
    } else if (percentageChange < -10) {
      direction = 'decreasing';
    }
    
    return {
      direction,
      percentage: Math.abs(percentageChange),
      oldCount: oldRate,
      newCount: newRate
    };
  }
  
  /**
   * Detects patterns in failures
   * @param {Object} failure - New failure to analyze
   * @private
   */
  _detectPatterns(failure) {
    // Extract key elements for pattern matching
    const messageParts = failure.message.split(/\s+/).slice(0, 5).join(' ');
    const componentKey = failure.component;
    const operationKey = failure.operation;
    const typeKey = failure.errorType;
    
    // Create pattern signatures
    const signatures = [
      // Specific message + component + operation
      `${messageParts}__${componentKey}__${operationKey}`,
      // Error type + component
      `${typeKey}__${componentKey}`,
      // Error type + operation
      `${typeKey}__${operationKey}`,
      // Component + operation
      `${componentKey}__${operationKey}`,
      // Just the message parts
      messageParts
    ];
    
    // Update pattern occurrences for each signature
    signatures.forEach(signature => {
      if (!this.patterns.has(signature)) {
        this.patterns.set(signature, {
          signature: signature,
          category: failure.errorType,
          component: failure.component,
          operation: failure.operation,
          occurrences: [],
          firstSeen: failure.timestamp,
          lastSeen: failure.timestamp,
          confidence: 0
        });
      }
      
      const pattern = this.patterns.get(signature);
      
      // Add this occurrence if it's not already there
      if (!pattern.occurrences.some(o => o.id === failure.id)) {
        pattern.occurrences.push({
          id: failure.id,
          timestamp: failure.timestamp,
          message: failure.message
        });
        
        // Update last seen
        pattern.lastSeen = failure.timestamp;
        
        // Update confidence based on number of occurrences
        pattern.confidence = Math.min(
          0.95, 
          pattern.occurrences.length / PATTERN_DETECTION_MIN_COUNT
        );
      }
    });
  }
  
  /**
   * Finds correlations between different failure types
   * @param {Array<Object>} failures - Failures to analyze
   * @returns {Array<Object>} Correlation data
   * @private
   */
  _findCorrelations(failures) {
    const correlations = [];
    
    // Group failures by component
    const byComponent = this._groupByProperty(failures, 'component');
    
    // For each component, look for correlations between operations
    Object.entries(byComponent).forEach(([component, componentFailures]) => {
      // Group by operation
      const byOperation = this._groupByProperty(componentFailures, 'operation');
      const operations = Object.keys(byOperation);
      
      // Check each pair of operations for time-based correlation
      for (let i = 0; i < operations.length; i++) {
        for (let j = i + 1; j < operations.length; j++) {
          const op1 = operations[i];
          const op2 = operations[j];
          
          const op1Failures = byOperation[op1];
          const op2Failures = byOperation[op2];
          
          // Need at least 3 failures in each to draw meaningful correlations
          if (op1Failures.length < 3 || op2Failures.length < 3) {
            continue;
          }
          
          // Check if failures occur close to each other in time
          const timeCorrelation = this._calculateTimeCorrelation(op1Failures, op2Failures);
          
          if (timeCorrelation.score > CORRELATION_THRESHOLD) {
            correlations.push({
              component,
              operations: [op1, op2],
              correlationScore: timeCorrelation.score,
              averageTimeDifference: timeCorrelation.averageTimeDiff,
              confidence: timeCorrelation.confidence,
              description: `Failures in ${op1} are followed by failures in ${op2} within ${formatDuration(timeCorrelation.averageTimeDiff / 1000)}`
            });
          }
        }
      }
    });
    
    return correlations.sort((a, b) => b.correlationScore - a.correlationScore);
  }
  
  /**
   * Calculates time-based correlation between two sets of failures
   * @param {Array<Object>} failures1 - First set of failures
   * @param {Array<Object>} failures2 - Second set of failures
   * @returns {Object} Correlation metrics
   * @private
   */
  _calculateTimeCorrelation(failures1, failures2) {
    // Extract timestamps
    const times1 = failures1.map(f => new Date(f.timestamp).getTime()).sort();
    const times2 = failures2.map(f => new Date(f.timestamp).getTime()).sort();
    
    // Count close occurrences
    let closeCount = 0;
    let totalTimeDiff = 0;
    
    // For each failure in the first set, find the closest failure in the second set
    times1.forEach(t1 => {
      // Find closest time in second set
      let closestDiff = Infinity;
      for (const t2 of times2) {
        const diff = Math.abs(t2 - t1);
        if (diff < closestDiff) {
          closestDiff = diff;
        }
      }
      
      // If within 5 minutes, consider it close
      if (closestDiff < 5 * 60 * 1000) {
        closeCount++;
        totalTimeDiff += closestDiff;
      }
    });
    
    // Calculate correlation score and confidence
    const correlationScore = closeCount / Math.min(times1.length, times2.length);
    const confidence = Math.min(0.95, (closeCount / 3) * 0.1 + 0.5); // Increases with more matches
    
    return {
      score: correlationScore,
      averageTimeDiff: closeCount > 0 ? totalTimeDiff / closeCount : Infinity,
      confidence,
      closeCount
    };
  }
  
  /**
   * Finds failures similar to a given failure
   * @param {Object} failure - Reference failure
   * @returns {Array<Object>} Similar failures
   * @private
   */
  _findSimilarFailures(failure) {
    return this.failures
      .filter(f => f.id !== failure.id) // Exclude the reference failure
      .map(f => {
        const messageSimilarity = this._calculateStringSimilarity(
          failure.message, 
          f.message
        );
        
        const componentMatch = failure.component === f.component;
        const operationMatch = failure.operation === f.operation;
        const typeMatch = failure.errorType === f.errorType;
        
        // Calculate overall similarity score
        const similarityScore = 
          messageSimilarity * 0.6 + 
          (componentMatch ? 0.2 : 0) + 
          (operationMatch ? 0.1 : 0) + 
          (typeMatch ? 0.1 : 0);
        
        return {
          ...f,
          similarityScore
        };
      })
      .filter(f => f.similarityScore > 0.5) // Only include reasonably similar failures
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 5); // Return top 5 most similar
  }
  
  /**
   * Calculates similarity between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Similarity score (0-1)
   * @private
   */
  _calculateStringSimilarity(str1, str2) {
    if (str1 === str2) return 1.0;
    if (!str1 || !str2) return 0.0;
    
    // Convert to lowercase and tokenize
    const tokens1 = str1.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const tokens2 = str2.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    
    if (tokens1.length === 0 || tokens2.length === 0) return 0.0;
    
    // Count matching tokens
    let matchCount = 0;
    for (const token of tokens1) {
      if (tokens2.includes(token)) {
        matchCount++;
      }
    }
    
    // Calculate Jaccard similarity
    const union = new Set([...tokens1, ...tokens2]).size;
    return matchCount / union;
  }
  
  /**
   * Generates a summary of detected patterns
   * @param {Array<Object>} patterns - Detected patterns
   * @param {Array<Object>} correlations - Detected correlations
   * @returns {string} Pattern summary
   * @private
   */
  _generatePatternSummary(patterns, correlations) {
    if (patterns.length === 0) {
      return 'No significant failure patterns detected.';
    }
    
    // Get top patterns
    const topPatterns = patterns.slice(0, 3);
    
    // Create summary
    let summary = `Detected ${patterns.length} failure patterns. `;
    
    // Add top pattern descriptions
    summary += 'Most significant patterns:\n';
    
    topPatterns.forEach((pattern, index) => {
      summary += `${index + 1}. "${pattern.signature}" - ${pattern.occurrences.length} occurrences`;
      summary += ` in ${pattern.component} / ${pattern.operation}\n`;
    });
    
    // Add correlation information if available
    if (correlations.length > 0) {
      summary += `\nDetected ${correlations.length} potential correlations between failures. `;
      summary += `Most significant: ${correlations[0].description}`;
    }
    
    return summary;
  }
  
  /**
   * Generates recommendations based on detected patterns
   * @param {Array<Object>} patterns - Detected patterns
   * @param {Array<Object>} correlations - Detected correlations
   * @returns {Array<string>} Recommendations
   * @private
   */
  _generateRecommendations(patterns, correlations) {
    const recommendations = [];
    
    // Identify components with high failure rates
    const componentFailureCounts = {};
    patterns.forEach(pattern => {
      const component = pattern.component;
      componentFailureCounts[component] = (componentFailureCounts[component] || 0) + 
        pattern.occurrences.length;
    });
    
    // Sort components by failure count
    const sortedComponents = Object.entries(componentFailureCounts)
      .sort((a, b) => b[1] - a[1]);
    
    // Add recommendation for most problematic component
    if (sortedComponents.length > 0) {
      const [worstComponent, failureCount] = sortedComponents[0];
      recommendations.push(
        `Prioritize investigation of the ${worstComponent} component, which has ${failureCount} failures.`
      );
    }
    
    // Add recommendations based on specific patterns
    patterns.slice(0, 3).forEach(pattern => {
      // For network errors, suggest resilience improvements
      if (pattern.category === 'network') {
        recommendations.push(
          `Improve network resilience for ${pattern.operation} operations in ${pattern.component} by adding circuit breaker protection.`
        );
      } 
      // For transaction errors, suggest optimizing parameters
      else if (pattern.category === 'transaction') {
        recommendations.push(
          `Review transaction parameters for ${pattern.operation} operations to reduce failures.`
        );
      }
      // For storage errors, suggest redundancy
      else if (pattern.category === 'storage') {
        recommendations.push(
          `Implement additional storage redundancy for ${pattern.component} to mitigate failures.`
        );
      }
    });
    
    // Add recommendations based on correlations
    if (correlations.length > 0) {
      const topCorrelation = correlations[0];
      recommendations.push(
        `Investigate the relationship between ${topCorrelation.operations[0]} and ${topCorrelation.operations[1]} operations in ${topCorrelation.component}, as failures appear correlated.`
      );
    }
    
    return recommendations;
  }
  
  /**
   * Generates a recommendation specific to a failure
   * @param {Object} failure - The failure
   * @param {Array<Object>} similarFailures - Similar failures
   * @returns {Object} Recommendation details
   * @private
   */
  _generateFailureSpecificRecommendation(failure, similarFailures) {
    const recommendation = {
      priority: 'low',
      suggestion: '',
      relatedIssues: []
    };
    
    // Set priority based on severity and recurrence
    if (failure.severity === 'critical') {
      recommendation.priority = 'critical';
    } else if (failure.severity === 'error' && similarFailures.length > 2) {
      recommendation.priority = 'high';
    } else if (failure.severity === 'error' || similarFailures.length > 0) {
      recommendation.priority = 'medium';
    }
    
    // Generate suggestion based on error type
    switch (failure.errorType) {
      case 'network':
        recommendation.suggestion = 'Implement circuit breaker pattern to handle network failures gracefully.';
        break;
      case 'transaction':
        recommendation.suggestion = 'Review transaction parameters and add adaptive retry logic.';
        break;
      case 'storage':
        recommendation.suggestion = 'Add redundant storage options and fallback strategies.';
        break;
      case 'authentication':
        recommendation.suggestion = 'Improve credential handling and add token refresh mechanisms.';
        break;
      case 'validation':
        recommendation.suggestion = 'Enhance input validation and add schema verification.';
        break;
      default:
        recommendation.suggestion = 'Implement comprehensive error handling and logging.';
    }
    
    // Add related issue IDs
    recommendation.relatedIssues = similarFailures.map(f => f.id);
    
    return recommendation;
  }
  
  /**
   * Gets circuit breaker status relevant to a failure
   * @param {Object} failure - Failure to check circuit breakers for
   * @returns {Object|null} Circuit breaker status
   * @private
   */
  _getRelevantCircuitBreakerStatus(failure) {
    if (!this.enableCircuitBreakerIntegration) {
      return null;
    }
    
    const allCircuits = getAllCircuitBreakers();
    if (!allCircuits || allCircuits.size === 0) {
      return null;
    }
    
    // Look for circuit breakers that might be relevant to this failure
    const relevantCircuits = [];
    
    for (const [name, circuit] of allCircuits.entries()) {
      // Check if circuit name contains component or operation name
      if (
        name.includes(failure.component) || 
        name.includes(failure.operation) ||
        name.includes(failure.errorType)
      ) {
        relevantCircuits.push({
          name,
          state: circuit.state,
          health: circuit.getHealth()
        });
      }
    }
    
    if (relevantCircuits.length === 0) {
      return null;
    }
    
    return {
      circuits: relevantCircuits,
      activations: relevantCircuits.filter(c => c.state === 'OPEN').length
    };
  }
  
  /**
   * Logs a failure to the console with formatting
   * @param {Object} failure - Failure to log
   * @private
   */
  _logToConsole(failure) {
    // Get chalk color for severity
    let severityColor = chalk.blue;
    switch (failure.severity) {
      case 'critical':
        severityColor = chalk.red.bold;
        break;
      case 'error':
        severityColor = chalk.red;
        break;
      case 'warning':
        severityColor = chalk.yellow;
        break;
      default:
        severityColor = chalk.blue;
    }
    
    // Format timestamp
    const time = new Date(failure.timestamp).toLocaleTimeString();
    
    // Print to console
    console.log(
      chalk.gray(`[${time}]`),
      severityColor(failure.severity.toUpperCase()),
      chalk.cyan(`[${failure.component}]`),
      chalk.gray(`(${failure.operation})`),
      failure.message,
      chalk.gray(`[${failure.id.substring(0, 8)}]`)
    );
  }
  
  /**
   * Counts occurrences of values for a property in an array of objects
   * @param {Array<Object>} items - Array of objects
   * @param {string} property - Property to count
   * @returns {Object} Counts by value
   * @private
   */
  _countByProperty(items, property) {
    const counts = {};
    items.forEach(item => {
      const value = item[property];
      counts[value] = (counts[value] || 0) + 1;
    });
    return counts;
  }
  
  /**
   * Groups an array of objects by a property value
   * @param {Array<Object>} items - Array of objects
   * @param {string} property - Property to group by
   * @returns {Object} Items grouped by property value
   * @private
   */
  _groupByProperty(items, property) {
    const groups = {};
    items.forEach(item => {
      const value = item[property];
      if (!groups[value]) {
        groups[value] = [];
      }
      groups[value].push(item);
    });
    return groups;
  }
  
  /**
   * Generates a time series for visualizing failure trends
   * @param {Array<Object>} failures - Failures to analyze
   * @param {number} since - Start timestamp
   * @returns {Array<Object>} Time series data
   * @private
   */
  _generateTimeSeries(failures, since) {
    if (failures.length === 0) {
      return [];
    }
    
    // Determine appropriate time buckets (hours or days)
    const now = Date.now();
    const timespan = now - since;
    const useHours = timespan <= 7 * 24 * 60 * 60 * 1000; // Use hours for 7 days or less
    
    const buckets = {};
    const bucketSize = useHours ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const bucketFormat = useHours ? 
      timestamp => new Date(timestamp).toISOString().slice(0, 13) : // YYYY-MM-DDTHH
      timestamp => new Date(timestamp).toISOString().slice(0, 10);  // YYYY-MM-DD
    
    // Initialize all buckets
    for (let t = since; t <= now; t += bucketSize) {
      buckets[bucketFormat(t)] = { total: 0, byCategory: {} };
    }
    
    // Fill buckets with failure data
    failures.forEach(failure => {
      const timestamp = new Date(failure.timestamp).getTime();
      const bucketKey = bucketFormat(timestamp);
      
      if (buckets[bucketKey]) {
        buckets[bucketKey].total++;
        
        const category = failure.errorType;
        buckets[bucketKey].byCategory[category] = (buckets[bucketKey].byCategory[category] || 0) + 1;
      }
    });
    
    // Convert to array format for visualization
    return Object.entries(buckets).map(([time, data]) => ({
      time,
      count: data.total,
      categories: data.byCategory,
      label: useHours ? 
        new Date(time).toLocaleString([], { hour: '2-digit', month: 'short', day: 'numeric' }) :
        new Date(time).toLocaleDateString([], { month: 'short', day: 'numeric' })
    }));
  }
  
  /**
   * Generates console visualization for patterns and correlations
   * @param {Array<Object>} patterns - Detected patterns
   * @param {Array<Object>} correlations - Detected correlations
   * @returns {string} Visualization string
   * @private
   */
  _generatePatternVisualization(patterns, correlations) {
    let visualization = '\n';
    
    // Create a bar chart for top patterns
    const topPatterns = patterns.slice(0, 7); // Limit to top 7 for visualization
    if (topPatterns.length > 0) {
      visualization += chalk.bold('Failure Patterns by Frequency\n');
      
      // Get maximum occurrence count for scaling
      const maxCount = Math.max(...topPatterns.map(p => p.occurrences.length));
      const barWidth = 40; // Maximum bar width in characters
      
      // Generate bar for each pattern
      topPatterns.forEach(pattern => {
        const count = pattern.occurrences.length;
        const ratio = count / maxCount;
        const barLength = Math.round(ratio * barWidth);
        const bar = '█'.repeat(barLength);
        
        const label = `${pattern.component}/${pattern.operation}`;
        
        visualization += chalk.cyan(label.padEnd(25)) + ' ' + 
          chalk.yellow(bar) + ' ' + 
          chalk.bold(count.toString().padStart(3)) + '\n';
      });
      
      visualization += '\n';
    }
    
    // Create a table for top correlations
    const topCorrelations = correlations.slice(0, 5); // Limit to top 5
    if (topCorrelations.length > 0) {
      visualization += chalk.bold('Correlated Failures\n');
      
      // Table header
      visualization += chalk.dim('┌────────────────────────┬─────────────────────────┬────────────┬────────────────┐\n');
      visualization += chalk.dim('│ ') + chalk.bold('Component'.padEnd(20)) + chalk.dim(' │ ') + 
        chalk.bold('Related Operations'.padEnd(21)) + chalk.dim(' │ ') + 
        chalk.bold('Score'.padEnd(8)) + chalk.dim(' │ ') + 
        chalk.bold('Time Gap'.padEnd(12)) + chalk.dim(' │\n');
      visualization += chalk.dim('├────────────────────────┼─────────────────────────┼────────────┼────────────────┤\n');
      
      // Table rows
      topCorrelations.forEach(corr => {
        const component = corr.component.slice(0, 20).padEnd(20);
        const operations = corr.operations.join(' → ').slice(0, 21).padEnd(21);
        const score = formatPercentage(corr.correlationScore * 100).padEnd(8);
        const timeGap = formatDuration(corr.averageTimeDifference / 1000).padEnd(12);
        
        visualization += chalk.dim('│ ') + chalk.cyan(component) + chalk.dim(' │ ') + 
          chalk.yellow(operations) + chalk.dim(' │ ') + 
          chalk.green(score) + chalk.dim(' │ ') + 
          timeGap + chalk.dim(' │\n');
      });
      
      visualization += chalk.dim('└────────────────────────┴─────────────────────────┴────────────┴────────────────┘\n');
      visualization += '\n';
    }
    
    return visualization;
  }
}

// Singleton instance for the application
const failureLogger = new FailureLogger();

/**
 * Creates a circuit breaker for an operation with failure analytics integration
 * @param {string} name - Circuit breaker name
 * @param {Object} options - CircuitBreaker options
 * @param {string} targetOperation - Operation this circuit protects
 * @param {string} targetComponent - Component this circuit protects
 * @returns {CircuitBreaker} Configured circuit breaker
 */
export function createAnalyticsEnabledCircuitBreaker(name, options = {}, targetOperation, targetComponent) {
  const circuitBreaker = getCircuitBreaker(name, options);
  
  // Integrate with failure analytics
  failureLogger.integrateWithCircuitBreaker(circuitBreaker, {
    targetOperation,
    targetComponent
  });
  
  return circuitBreaker;
}

/**
 * Executes an operation with failure tracking
 * @param {Function} operation - Function to execute
 * @param {Object} context - Failure context information
 * @returns {Promise<any>} Operation result
 */
export async function withFailureTracking(operation, context = {}) {
  try {
    // Record an attempt for failure rate calculation
    if (context.operation) {
      failureLogger.recordSuccess(context.operation, context.component);
    }
    
    // Execute the operation
    return await operation();
  } catch (error) {
    // Log the failure
    failureLogger.logFailure(error, context);
    
    // Re-throw the error
    throw error;
  }
}

/**
 * Gets a chart showing failure trends for an operation or component
 * @param {Object} options - Chart options
 * @param {string} options.operation - Operation to chart
 * @param {string} options.component - Component to chart
 * @param {number} options.days - Number of days to include
 * @returns {string} ASCII chart of failure trends
 */
export function getFailureTrendChart(options = {}) {
  const days = options.days || 7;
  const timeWindow = days * 24 * 60 * 60 * 1000;
  
  // Get failure rates for the specified time window
  const failureRates = failureLogger.getFailureRates({
    operation: options.operation,
    component: options.component,
    timeWindow
  });
  
  // Generate ASCII chart from the time series
  return generateAsciiChart(failureRates.timeSeries, options);
}

/**
 * Generates an ASCII chart from time series data
 * @param {Array<Object>} timeSeries - Time series data
 * @param {Object} options - Chart options
 * @returns {string} ASCII chart
 */
function generateAsciiChart(timeSeries, options = {}) {
  if (!timeSeries || timeSeries.length === 0) {
    return 'No data available for charting.';
  }
  
  const title = options.title || 'Failure Trend';
  const width = options.width || 60;
  const height = options.height || 10;
  
  // Find max count for scaling
  const maxCount = Math.max(...timeSeries.map(point => point.count));
  if (maxCount === 0) {
    return 'No failures recorded in this time period.';
  }
  
  // Initialize chart
  let chart = chalk.bold(`${title}\n\n`);
  
  // Create Y-axis labels and bars
  for (let i = height; i >= 0; i--) {
    const threshold = (maxCount * i) / height;
    
    // Y-axis label
    if (i === height) {
      chart += chalk.dim(`${maxCount} ┐ `);
    } else if (i === 0) {
      chart += chalk.dim(`0 └─`);
    } else if (i === height / 2) {
      chart += chalk.dim(`${Math.round(maxCount / 2)} ┤ `);
    } else {
      chart += chalk.dim(`  │ `);
    }
    
    // Bars
    timeSeries.forEach(point => {
      if (point.count >= threshold) {
        // Determine color based on count
        let barColor = chalk.green;
        if (point.count > maxCount * 0.7) {
          barColor = chalk.red;
        } else if (point.count > maxCount * 0.3) {
          barColor = chalk.yellow;
        }
        
        chart += barColor('█');
      } else {
        chart += ' ';
      }
    });
    
    chart += '\n';
  }
  
  // X-axis
  chart += chalk.dim('   ');
  chart += chalk.dim('─'.repeat(timeSeries.length)) + '\n';
  
  // X-axis labels (show every nth label to avoid crowding)
  const labelInterval = Math.max(1, Math.floor(timeSeries.length / 10));
  chart += chalk.dim('   ');
  
  timeSeries.forEach((point, index) => {
    if (index % labelInterval === 0) {
      // Add shortened label with date only
      const shortLabel = point.label.substring(0, 1);
      chart += shortLabel;
    } else {
      chart += ' ';
    }
  });
  
  chart += '\n\n';
  
  // Add a legend for more complete dates
  chart += chalk.dim('Legend:\n');
  
  timeSeries.forEach((point, index) => {
    if (index % labelInterval === 0) {
      chart += chalk.dim(`${point.label.substring(0, 1)}: ${point.label}\n`);
    }
  });
  
  return chart;
}

export default failureLogger;