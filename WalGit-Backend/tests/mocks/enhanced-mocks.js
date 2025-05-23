/**
 * @fileoverview Enhanced mock utilities for comprehensive WalGit testing
 * Provides integrated mocks for Sui, Walrus, and SEAL services with realistic scenarios
 */

import { jest } from '@jest/globals';
import crypto from 'crypto';
import { MockWalrusClient } from './walrus-sdk-mock.js';
import { MockSealClient } from './seal-client-mock.js';

// Test data management constants
const TEST_SCENARIOS = {
  BASIC_WORKFLOW: 'basic_workflow',
  CONCURRENT_ACCESS: 'concurrent_access',
  NETWORK_FAILURES: 'network_failures',
  ENCRYPTION_EDGE_CASES: 'encryption_edge_cases',
  LARGE_FILES: 'large_files',
  PERMISSION_MATRIX: 'permission_matrix'
};

// Mock repository data templates
const MOCK_REPOSITORIES = {
  'basic-repo': {
    name: 'basic-repo',
    description: 'Basic test repository',
    owner: '0x123456789abcdef',
    defaultBranch: 'main',
    sealPolicyId: 'policy_basic',
    collaborators: {
      '0x987654321fedcba': 2, // WRITER
      '0xabc123def456789': 1  // READER
    }
  },
  'encrypted-repo': {
    name: 'encrypted-repo',
    description: 'Repository with threshold encryption',
    owner: '0x555666777888999',
    defaultBranch: 'main',
    sealPolicyId: 'policy_threshold',
    encrypted: true,
    collaborators: {
      '0x111222333444555': 3, // ADMIN
      '0x666777888999000': 2, // WRITER
      '0xaaabbbcccdddee': 1   // READER
    }
  }
};

// Mock commit data
const MOCK_COMMITS = {
  'initial': {
    message: 'Initial commit',
    author: '0x123456789abcdef',
    files: ['README.md', 'package.json'],
    timestamp: Date.now() - 86400000 // 1 day ago
  },
  'feature': {
    message: 'Add new feature',
    author: '0x987654321fedcba',
    files: ['src/feature.js', 'tests/feature.test.js'],
    timestamp: Date.now() - 3600000 // 1 hour ago
  },
  'bugfix': {
    message: 'Fix critical bug',
    author: '0x555666777888999',
    files: ['src/main.js', 'CHANGELOG.md'],
    timestamp: Date.now() - 1800000 // 30 minutes ago
  }
};

/**
 * Enhanced Sui Client mock with comprehensive transaction simulation
 */
export class MockSuiClient {
  constructor(config = {}) {
    this.config = config;
    this.objects = new Map();
    this.transactions = [];
    this.networkDelay = config.networkDelay || 500;
    this.failureRate = config.failureRate || 0;
  }

  async getObject(objectId, options = {}) {
    await this._simulateNetworkDelay();
    
    if (Math.random() < this.failureRate) {
      throw new Error('Network error: Failed to fetch object');
    }

    if (!this.objects.has(objectId)) {
      throw new Error(`Object not found: ${objectId}`);
    }

    const obj = this.objects.get(objectId);
    return {
      data: {
        objectId,
        version: obj.version || '1',
        digest: obj.digest || `digest_${objectId}`,
        type: obj.type,
        content: {
          fields: obj.fields
        }
      }
    };
  }

  async multiGetObjects(objectIds, options = {}) {
    const results = await Promise.all(
      objectIds.map(async (id) => {
        try {
          return await this.getObject(id, options);
        } catch (error) {
          return { error: error.message };
        }
      })
    );
    return results;
  }

  async executeTransactionBlock(transaction, options = {}) {
    await this._simulateNetworkDelay();
    
    if (Math.random() < this.failureRate) {
      throw new Error('Transaction failed: Network error');
    }

    const txId = `tx_${crypto.randomBytes(16).toString('hex')}`;
    const txResult = {
      digest: txId,
      effects: {
        status: { status: 'success' },
        created: [],
        mutated: [],
        deleted: [],
        gasUsed: { computationCost: '1000', storageCost: '2000' }
      },
      events: [],
      objectChanges: []
    };

    // Simulate object creation/mutation based on transaction
    if (transaction.commands) {
      transaction.commands.forEach((command, index) => {
        if (command.type === 'create') {
          const objectId = `obj_${crypto.randomBytes(8).toString('hex')}`;
          const obj = {
            type: command.objectType,
            fields: command.fields || {},
            version: '1',
            digest: `digest_${objectId}`
          };
          this.objects.set(objectId, obj);
          txResult.effects.created.push({ objectId, version: '1' });
        }
      });
    }

    this.transactions.push({
      digest: txId,
      timestamp: new Date().toISOString(),
      sender: options.sender || '0xdefault',
      result: txResult
    });

    return txResult;
  }

  async getTransactionBlock(digest, options = {}) {
    const tx = this.transactions.find(t => t.digest === digest);
    if (!tx) {
      throw new Error(`Transaction not found: ${digest}`);
    }
    return tx.result;
  }

  async _simulateNetworkDelay() {
    if (this.networkDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.networkDelay));
    }
  }

  // Helper methods for testing
  addMockObject(objectId, objectData) {
    this.objects.set(objectId, objectData);
  }

  setFailureRate(rate) {
    this.failureRate = Math.max(0, Math.min(1, rate));
  }

  clearMockData() {
    this.objects.clear();
    this.transactions = [];
  }
}

/**
 * Test data management utility
 */
export class TestDataManager {
  constructor() {
    this.scenarios = new Map();
    this.testArtifacts = new Map();
  }

  /**
   * Setup test scenario with predefined data
   * @param {string} scenarioName - Name of the test scenario
   * @param {Object} options - Scenario configuration
   */
  setupScenario(scenarioName, options = {}) {
    const scenario = {
      name: scenarioName,
      suiObjects: new Map(),
      walrusBlobs: new Map(),
      sealKeys: new Map(),
      repositories: new Map(),
      users: new Map(),
      ...options
    };

    switch (scenarioName) {
      case TEST_SCENARIOS.BASIC_WORKFLOW:
        this._setupBasicWorkflow(scenario);
        break;
      case TEST_SCENARIOS.CONCURRENT_ACCESS:
        this._setupConcurrentAccess(scenario);
        break;
      case TEST_SCENARIOS.NETWORK_FAILURES:
        this._setupNetworkFailures(scenario);
        break;
      case TEST_SCENARIOS.ENCRYPTION_EDGE_CASES:
        this._setupEncryptionEdgeCases(scenario);
        break;
      case TEST_SCENARIOS.LARGE_FILES:
        this._setupLargeFiles(scenario);
        break;
      case TEST_SCENARIOS.PERMISSION_MATRIX:
        this._setupPermissionMatrix(scenario);
        break;
    }

    this.scenarios.set(scenarioName, scenario);
    return scenario;
  }

  /**
   * Generate test data for basic workflow scenario
   */
  _setupBasicWorkflow(scenario) {
    // Create test repository
    const repoId = 'repo_basic_001';
    scenario.repositories.set(repoId, {
      ...MOCK_REPOSITORIES['basic-repo'],
      objectId: repoId,
      createdAt: new Date().toISOString()
    });

    // Create test users
    const users = [
      { address: '0x123456789abcdef', role: 'owner', name: 'Alice' },
      { address: '0x987654321fedcba', role: 'writer', name: 'Bob' },
      { address: '0xabc123def456789', role: 'reader', name: 'Charlie' }
    ];

    users.forEach(user => {
      scenario.users.set(user.address, user);
    });

    // Create test commits
    Object.entries(MOCK_COMMITS).forEach(([key, commit]) => {
      const commitId = `commit_${key}_${crypto.randomBytes(4).toString('hex')}`;
      scenario.suiObjects.set(commitId, {
        type: 'GitCommitObject',
        fields: {
          ...commit,
          id: commitId,
          repository: repoId
        }
      });
    });
  }

  /**
   * Generate test data for concurrent access scenario
   */
  _setupConcurrentAccess(scenario) {
    // Create multiple repositories with overlapping collaborators
    for (let i = 0; i < 3; i++) {
      const repoId = `repo_concurrent_${i}`;
      scenario.repositories.set(repoId, {
        name: `concurrent-repo-${i}`,
        description: `Repository ${i} for concurrent testing`,
        owner: `0x${i.toString().repeat(15)}`,
        collaborators: {
          '0x111111111111111': 2, // WRITER on all repos
          '0x222222222222222': 1, // READER on all repos
          [`0x${(i + 3).toString().repeat(15)}`]: 3 // Different ADMIN per repo
        }
      });
    }

    // Create overlapping file modifications
    const files = ['shared.js', 'common.md', 'config.json'];
    files.forEach((file, index) => {
      const blobId = `blob_${file}_${index}`;
      scenario.walrusBlobs.set(blobId, {
        content: `Content of ${file} modified at ${new Date().toISOString()}`,
        size: 1024 + index * 500,
        lastModified: new Date(Date.now() - index * 3600000).toISOString()
      });
    });
  }

  /**
   * Generate test data for network failure scenarios
   */
  _setupNetworkFailures(scenario) {
    scenario.networkConditions = {
      walrusFailureRate: 0.3,
      sealFailureRate: 0.2,
      suiFailureRate: 0.1,
      timeoutRate: 0.15,
      retryScenarios: [
        { attempts: 3, finalSuccess: true },
        { attempts: 5, finalSuccess: false },
        { attempts: 2, finalSuccess: true }
      ]
    };

    // Create data that will be affected by network issues
    for (let i = 0; i < 10; i++) {
      const blobId = `blob_network_test_${i}`;
      scenario.walrusBlobs.set(blobId, {
        content: `Network test data ${i}`,
        size: Math.random() * 10000,
        uploadAttempts: Math.floor(Math.random() * 5) + 1
      });
    }
  }

  /**
   * Generate test data for encryption edge cases
   */
  _setupEncryptionEdgeCases(scenario) {
    const edgeCases = [
      { name: 'empty_data', content: '', expectError: true },
      { name: 'large_data', content: 'x'.repeat(100 * 1024 * 1024), size: '100MB' },
      { name: 'binary_data', content: crypto.randomBytes(1024), type: 'binary' },
      { name: 'unicode_data', content: '🚀🔐💾🌊🦭', type: 'unicode' },
      { name: 'json_data', content: JSON.stringify({ complex: { nested: { data: true } } }), type: 'json' }
    ];

    edgeCases.forEach((testCase, index) => {
      const keyId = `seal_key_edge_${index}`;
      scenario.sealKeys.set(keyId, {
        threshold: 2,
        totalShares: 3,
        testCase: testCase.name,
        content: testCase.content,
        expectError: testCase.expectError || false
      });
    });
  }

  /**
   * Generate test data for large file scenarios
   */
  _setupLargeFiles(scenario) {
    const fileSizes = [
      { name: '1MB', size: 1024 * 1024 },
      { name: '10MB', size: 10 * 1024 * 1024 },
      { name: '100MB', size: 100 * 1024 * 1024 },
      { name: '1GB', size: 1024 * 1024 * 1024 },
      { name: '5GB', size: 5 * 1024 * 1024 * 1024 }
    ];

    fileSizes.forEach((file, index) => {
      const blobId = `blob_large_${file.name}`;
      scenario.walrusBlobs.set(blobId, {
        content: `Simulated ${file.name} file content`,
        size: file.size,
        chunks: Math.ceil(file.size / (1024 * 1024)), // 1MB chunks
        uploadTime: file.size / (1024 * 1024) * 100, // 100ms per MB
        compressionRatio: 0.7 + Math.random() * 0.2 // 70-90% compression
      });
    });
  }

  /**
   * Generate test data for permission matrix testing
   */
  _setupPermissionMatrix(scenario) {
    const roles = ['owner', 'admin', 'writer', 'reader'];
    const operations = ['create', 'read', 'update', 'delete', 'share', 'encrypt', 'decrypt'];
    
    // Generate all combinations of roles and operations
    roles.forEach((role, roleIndex) => {
      operations.forEach((operation, opIndex) => {
        const testId = `perm_${role}_${operation}`;
        const userAddress = `0x${roleIndex.toString().repeat(15)}`;
        
        scenario.users.set(userAddress, {
          address: userAddress,
          role: role,
          permissions: this._getPermissionsForRole(role)
        });

        // Create test repositories for each permission scenario
        const repoId = `repo_${testId}`;
        scenario.repositories.set(repoId, {
          name: `Permission test ${role} ${operation}`,
          owner: role === 'owner' ? userAddress : '0x000000000000000',
          collaborators: role !== 'owner' ? { [userAddress]: this._getRoleCode(role) } : {}
        });
      });
    });
  }

  /**
   * Get permissions for a role
   */
  _getPermissionsForRole(role) {
    const permissions = {
      owner: ['create', 'read', 'update', 'delete', 'share', 'encrypt', 'decrypt', 'manage'],
      admin: ['create', 'read', 'update', 'delete', 'share', 'encrypt', 'decrypt'],
      writer: ['read', 'update', 'encrypt', 'decrypt'],
      reader: ['read', 'decrypt']
    };
    return permissions[role] || [];
  }

  /**
   * Get role code for collaboration
   */
  _getRoleCode(role) {
    const codes = { reader: 1, writer: 2, admin: 3 };
    return codes[role] || 1;
  }

  /**
   * Clean up test scenario
   */
  cleanupScenario(scenarioName) {
    this.scenarios.delete(scenarioName);
    // Clean up associated mock services
    MockWalrusClient.clearStorage();
    MockSealClient.clearMockData();
  }

  /**
   * Get scenario data
   */
  getScenario(scenarioName) {
    return this.scenarios.get(scenarioName);
  }

  /**
   * Save test artifacts for debugging
   */
  saveTestArtifact(testName, artifactType, data) {
    const key = `${testName}_${artifactType}`;
    this.testArtifacts.set(key, {
      testName,
      artifactType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get test artifacts
   */
  getTestArtifacts(testName) {
    const artifacts = [];
    for (const [key, artifact] of this.testArtifacts) {
      if (artifact.testName === testName) {
        artifacts.push(artifact);
      }
    }
    return artifacts;
  }
}

// Export integrated mock services
export const createIntegratedMocks = (config = {}) => {
  const suiClient = new MockSuiClient(config.sui);
  const walrusClient = new MockWalrusClient(config.walrus);
  const sealClient = new MockSealClient(config.seal?.apiKey, suiClient);
  const testDataManager = new TestDataManager();

  return {
    suiClient,
    walrusClient,
    sealClient,
    testDataManager,
    
    // Convenience methods for common testing patterns
    setupBasicRepo: async (repoName = 'test-repo') => {
      const scenario = testDataManager.setupScenario(TEST_SCENARIOS.BASIC_WORKFLOW);
      return scenario.repositories.get('repo_basic_001');
    },

    simulateNetworkIssues: (failureRate = 0.3) => {
      walrusClient.constructor.setNetworkFailureRate(failureRate);
      sealClient.constructor.setNetworkFailureRate(failureRate);
      suiClient.setFailureRate(failureRate);
    },

    resetAllMocks: () => {
      MockWalrusClient.clearStorage();
      MockSealClient.clearMockData();
      suiClient.clearMockData();
    }
  };
};

// Export test scenarios and utilities
export {
  TEST_SCENARIOS,
  MOCK_REPOSITORIES,
  MOCK_COMMITS,
  MockSuiClient
};