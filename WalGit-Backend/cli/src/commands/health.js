/**
 * WalGit Network Health Command
 * 
 * Provides utilities for monitoring and managing network health, resilience,
 * and failure analytics in the WalGit system.
 */

import { resilience } from '../utils/index.js';
import chalk from 'chalk';

/**
 * Display network health status
 * @param {Object} options - Command options
 */
export async function getHealth(options = {}) {
  try {
    const health = resilience.getNetworkHealth();
    
    console.log(chalk.bold('\nWalGit Network Health Status'));
    console.log(chalk.dim('═══════════════════════════════'));
    
    // Circuit Breaker Status
    console.log(chalk.cyan.bold('\nCircuit Breaker Status:'));
    console.log(`Sui Circuit: ${formatCircuitState(health.sui.state)}`);
    console.log(`Walrus Circuit: ${formatCircuitState(health.walrus.state)}`);
    console.log(`Network Circuit: ${formatCircuitState(health.network.state)}`);
    
    // Network Conditions
    console.log(chalk.cyan.bold('\nNetwork Conditions:'));
    console.log(`Status: ${formatNetworkStatus(health.monitor.status)}`);
    console.log(`Average Latency: ${health.monitor.latency}ms`);
    console.log(`Recommended Batch Size: ${health.monitor.recommendations.batchSize}`);
    console.log(`Recommended Concurrency: ${health.monitor.recommendations.concurrency}`);
    
    // Failure Statistics
    console.log(chalk.cyan.bold('\nFailure Statistics:'));
    console.log(`Recent Failures: ${health.failures.trends.totalCount}`);
    console.log(`Detected Patterns: ${health.failures.patterns.patternCount}`);
    
    // Detailed stats if requested
    if (options.detailed) {
      // Print top failure patterns
      if (health.failures.patterns.patterns && health.failures.patterns.patterns.length > 0) {
        console.log(chalk.yellow.bold('\nTop Failure Patterns:'));
        health.failures.patterns.patterns.slice(0, 3).forEach((pattern, i) => {
          console.log(`${i+1}. ${pattern.signature.substring(0, 50)}... (${pattern.occurrences.length} occurrences)`);
          console.log(`   Component: ${pattern.component}, Operation: ${pattern.operation}`);
        });
      }
      
      // Print recommendations if available
      if (health.failures.patterns.recommendation && health.failures.patterns.recommendation.length > 0) {
        console.log(chalk.yellow.bold('\nRecommendations:'));
        health.failures.patterns.recommendation.forEach((rec, i) => {
          console.log(`${i+1}. ${rec}`);
        });
      }
    }
    
    console.log(chalk.dim('\nUse "walgit health reset" to reset circuit breakers and network status'));
    console.log(chalk.dim('Use "walgit health failures" to view detailed failure analytics\n'));
    
    return health;
  } catch (error) {
    console.error('Error getting network health:', error.message);
    throw error;
  }
}

/**
 * Reset network health status and circuit breakers
 */
export async function resetHealth() {
  try {
    const result = resilience.resetNetworkStatus();
    
    console.log(chalk.green.bold('\nNetwork Health Status Reset'));
    console.log(chalk.dim('═══════════════════════════════'));
    console.log('All circuit breakers have been reset to CLOSED state.');
    console.log('Network health monitoring has been reinitialized.');
    console.log(chalk.dim('\nUse "walgit health" to view current status\n'));
    
    return result;
  } catch (error) {
    console.error('Error resetting network health:', error.message);
    throw error;
  }
}

/**
 * Show failure analytics dashboard
 * @param {Object} options - Command options
 */
export async function showFailures(options = {}) {
  try {
    // Get detailed failure analytics
    const failureLogger = resilience.failures;
    
    // Determine time window
    const days = options.days || 7;
    const timeWindow = days * 24 * 60 * 60 * 1000;
    const since = Date.now() - timeWindow;
    
    // Get failure stats
    const stats = failureLogger.getFailureStats({
      since
    });
    
    // Get failure patterns
    const patterns = failureLogger.analyzeFailurePatterns({
      includeVisualization: true,
      minConfidence: 0.5
    });
    
    // Get failure rates
    const rates = failureLogger.getFailureRates({
      timeWindow
    });
    
    // Display dashboard
    console.log(chalk.bold.blue('\nWalGit Failure Analytics Dashboard'));
    console.log(chalk.dim('═════════════════════════════════════'));
    
    // Overview section
    console.log(chalk.cyan.bold('\nOverview:'));
    console.log(`Failures in last ${days} days: ${stats.totalCount}`);
    console.log(`Overall failure rate: ${formatPercentage(rates.overall.rate)}%`);
    console.log(`Trend: ${formatTrend(stats.recentTrend)}`);
    
    // By category section
    console.log(chalk.cyan.bold('\nFailures by Category:'));
    const categories = Object.entries(stats.byCategory || {});
    categories.sort((a, b) => b[1] - a[1]);
    
    for (const [category, count] of categories) {
      const barLength = Math.round((count / stats.totalCount) * 20);
      console.log(`${category.padEnd(12)}: ${'█'.repeat(barLength)} ${count}`);
    }
    
    // By component section (if we have components with failures)
    if (Object.keys(stats.byComponent || {}).length > 0) {
      console.log(chalk.cyan.bold('\nTop Components:'));
      const components = Object.entries(stats.byComponent || {});
      components.sort((a, b) => b[1] - a[1]);
      
      for (const [component, count] of components.slice(0, 5)) {
        const barLength = Math.round((count / stats.totalCount) * 20);
        console.log(`${component.padEnd(20)}: ${'█'.repeat(barLength)} ${count}`);
      }
    }
    
    // Detected patterns
    if (patterns.patterns.length > 0) {
      console.log(chalk.cyan.bold('\nDetected Patterns:'));
      patterns.patterns.slice(0, 5).forEach((pattern, i) => {
        console.log(`${i+1}. ${pattern.signature.substring(0, 40)}... (${pattern.occurrences.length} occurrences)`);
      });
      
      // Show visualization if available and not in minimal mode
      if (patterns.visualization && !options.minimal) {
        console.log('\n' + patterns.visualization);
      }
    }
    
    // Recommendations
    if (patterns.recommendation && patterns.recommendation.length > 0) {
      console.log(chalk.yellow.bold('\nRecommendations:'));
      patterns.recommendation.forEach((rec, i) => {
        console.log(`${i+1}. ${rec}`);
      });
    }
    
    console.log(chalk.dim('\nUse "walgit health reset" to reset circuit breakers and network status'));
    
    return { stats, patterns, rates };
  } catch (error) {
    console.error('Error getting failure analytics:', error.message);
    throw error;
  }
}

// Helper functions for formatting

/**
 * Format circuit state with appropriate color
 * @param {string} state - Circuit state
 * @returns {string} Formatted state
 */
function formatCircuitState(state) {
  switch (state) {
    case 'CLOSED':
      return chalk.green('CLOSED');
    case 'OPEN':
      return chalk.red('OPEN');
    case 'HALF_OPEN':
      return chalk.yellow('HALF_OPEN');
    default:
      return chalk.grey(state);
  }
}

/**
 * Format network status with appropriate color
 * @param {string} status - Network status
 * @returns {string} Formatted status
 */
function formatNetworkStatus(status) {
  switch (status) {
    case 'healthy':
      return chalk.green('Healthy');
    case 'unhealthy':
      return chalk.red('Unhealthy');
    case 'degraded':
      return chalk.yellow('Degraded');
    default:
      return chalk.grey(status);
  }
}

/**
 * Format trend with appropriate indicator
 * @param {Object} trend - Trend information
 * @returns {string} Formatted trend
 */
function formatTrend(trend) {
  if (!trend) return chalk.grey('Unknown');
  
  const { direction, percentage } = trend;
  
  switch (direction) {
    case 'increasing':
      return chalk.red(`↑ Increasing (${percentage.toFixed(1)}%)`);
    case 'decreasing':
      return chalk.green(`↓ Decreasing (${percentage.toFixed(1)}%)`);
    case 'stable':
      return chalk.blue('→ Stable');
    default:
      return chalk.grey(direction);
  }
}

/**
 * Format percentage for display
 * @param {number} value - Percentage value
 * @returns {string} Formatted percentage
 */
function formatPercentage(value) {
  return (value || 0).toFixed(2);
}

export default {
  getHealth,
  resetHealth,
  showFailures
};