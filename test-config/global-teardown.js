/**
 * @fileoverview Global test teardown for WalGit testing suite
 * Cleans up test environment, generates reports, and saves test artifacts
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

export default async function globalTeardown() {
  console.log('🧹 Cleaning up WalGit test environment...');
  
  const startTime = Date.now();
  
  try {
    // Clean up mock services
    console.log('🔧 Cleaning up mock services...');
    if (global.__WALGIT_MOCKS__) {
      global.__WALGIT_MOCKS__.resetAllMocks();
    }
    
    // Generate performance report
    console.log('📈 Generating performance report...');
    if (global.__WALGIT_TEST_PERFORMANCE__) {
      const performance = global.__WALGIT_TEST_PERFORMANCE__;
      const totalTestTime = Date.now() - performance.startTime;
      
      const performanceReport = {
        totalTestTime,
        slowTests: performance.slowTests,
        testCount: performance.testTimes.size,
        averageTestTime: totalTestTime / Math.max(performance.testTimes.size, 1),
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          memory: process.memoryUsage(),
          cpus: os.cpus().length
        },
        timestamp: new Date().toISOString()
      };
      
      const artifactsDir = path.join(process.cwd(), 'test-artifacts');
      if (fs.existsSync(artifactsDir)) {
        fs.writeFileSync(
          path.join(artifactsDir, 'performance-report.json'),
          JSON.stringify(performanceReport, null, 2)
        );
      }
      
      // Log slow tests warning
      if (performance.slowTests.length > 0) {
        console.warn(`⚠️ Found ${performance.slowTests.length} slow tests (>30s):`);
        performance.slowTests.forEach(test => {
          console.warn(`  - ${test.name}: ${test.duration}ms`);
        });
      }
    }
    
    // Clean up test directories
    console.log('📁 Cleaning up test directories...');
    const testDirs = [
      path.join(os.tmpdir(), 'walgit-test-workspace'),
      path.join(os.tmpdir(), 'walgit-test-cache'),
      path.join(os.tmpdir(), 'walgit-test-repos'),
      path.join(os.tmpdir(), 'walgit-e2e-test'),
      path.join(os.tmpdir(), 'walgit-cross-platform-test'),
      path.join(os.tmpdir(), 'walgit-collaborator-cli'),
      path.join(os.tmpdir(), 'walgit-cloned-from-frontend')
    ];
    
    let cleanedDirs = 0;
    testDirs.forEach(dir => {
      try {
        if (fs.existsSync(dir)) {
          fs.rmSync(dir, { recursive: true, force: true });
          cleanedDirs++;
        }
      } catch (error) {
        console.warn(`Failed to clean directory ${dir}: ${error.message}`);
      }
    });
    
    // Generate test summary
    console.log('📊 Generating test summary...');
    const testSummary = {
      completedAt: new Date().toISOString(),
      totalDuration: Date.now() - (global.__WALGIT_TEST_PERFORMANCE__?.startTime || startTime),
      directoriesCleaned: cleanedDirs,
      mockServicesReset: !!global.__WALGIT_MOCKS__,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        testMode: process.env.WALGIT_TEST_MODE,
        ciMode: !!process.env.CI
      }
    };
    
    // Save test summary
    const artifactsDir = path.join(process.cwd(), 'test-artifacts');
    if (fs.existsSync(artifactsDir)) {
      fs.writeFileSync(
        path.join(artifactsDir, 'test-summary.json'),
        JSON.stringify(testSummary, null, 2)
      );
      
      // Create human-readable summary
      const readableSummary = `
# WalGit Test Suite Summary

**Completed:** ${testSummary.completedAt}
**Duration:** ${Math.round(testSummary.totalDuration / 1000)}s
**Platform:** ${testSummary.environment.platform}
**Node Version:** ${testSummary.environment.nodeVersion}

## Cleanup Summary
- Directories cleaned: ${testSummary.directoriesCleaned}
- Mock services reset: ${testSummary.mockServicesReset ? 'Yes' : 'No'}
- CI Mode: ${testSummary.environment.ciMode ? 'Yes' : 'No'}

## Test Coverage
Coverage reports are available in the \`coverage/\` directory.

## Performance
Performance report is available in \`test-artifacts/performance-report.json\`.
      `.trim();
      
      fs.writeFileSync(
        path.join(artifactsDir, 'test-summary.md'),
        readableSummary
      );
    }
    
    // Clean up global test variables
    delete global.__WALGIT_MOCKS__;
    delete global.__WALGIT_TEST_DATA_MANAGER__;
    delete global.__WALGIT_TEST_REPOS__;
    delete global.__WALGIT_TEST_ADDRESSES__;
    delete global.__WALGIT_TEST_PERFORMANCE__;
    
    // Final cleanup of environment variables
    delete process.env.WALGIT_TEST_MODE;
    if (process.env.NODE_ENV === 'test') {
      delete process.env.NODE_ENV;
    }
    
    const teardownTime = Date.now() - startTime;
    console.log(`✅ Test environment cleanup complete (${teardownTime}ms)`);
    console.log(`📁 Cleaned ${cleanedDirs} test directories`);
    console.log(`📊 Test summary saved to test-artifacts/`);
    
  } catch (error) {
    console.error('❌ Error during test teardown:', error);
    
    // Save error report
    const artifactsDir = path.join(process.cwd(), 'test-artifacts');
    if (fs.existsSync(artifactsDir)) {
      const errorReport = {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        phase: 'teardown'
      };
      
      fs.writeFileSync(
        path.join(artifactsDir, 'teardown-error.json'),
        JSON.stringify(errorReport, null, 2)
      );
    }
    
    // Don't throw error to avoid masking test results
    console.error('⚠️ Teardown completed with errors - check teardown-error.json');
  }
}