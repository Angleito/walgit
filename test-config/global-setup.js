/**
 * @fileoverview Global test setup for WalGit testing suite
 * Initializes test environment, mock services, and shared test data
 */

import { createIntegratedMocks, TestDataManager, TEST_SCENARIOS } from '../walgit-backend/tests/mocks/enhanced-mocks.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

export default async function globalSetup() {
  console.log('🚀 Setting up WalGit test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.WALGIT_TEST_MODE = 'true';
  process.env.WALGIT_LOG_LEVEL = 'error'; // Reduce log noise during tests
  
  // Create test directories
  const testDirs = [
    path.join(os.tmpdir(), 'walgit-test-workspace'),
    path.join(os.tmpdir(), 'walgit-test-cache'),
    path.join(os.tmpdir(), 'walgit-test-repos')
  ];
  
  testDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  // Initialize integrated mocks
  console.log('🔧 Initializing mock services...');
  const mocks = createIntegratedMocks({
    sui: { networkDelay: 100, failureRate: 0 },
    walrus: { endpoint: 'http://localhost:8080/mock-walrus' },
    seal: { apiKey: 'test-seal-api-key' }
  });
  
  // Populate test data for all scenarios
  console.log('📊 Populating test data...');
  const testDataManager = new TestDataManager();
  
  // Setup all test scenarios
  Object.values(TEST_SCENARIOS).forEach(scenario => {
    testDataManager.setupScenario(scenario, {
      populateData: true,
      enableMocking: true
    });
  });
  
  // Populate mock services with test data
  mocks.walrusClient.constructor.populateTestData();
  mocks.sealClient.constructor.populateTestData();
  
  // Setup test blockchain state
  console.log('⛓️ Initializing test blockchain state...');
  const testAddresses = [
    '0x123456789abcdef123456789abcdef123456789a', // Owner
    '0x987654321fedcba987654321fedcba987654321f', // Collaborator
    '0xabc123def456789abc123def456789abc123def45'  // Reader
  ];
  
  testAddresses.forEach((address, index) => {
    mocks.suiClient.addMockObject(`storage_quota_${address}`, {
      type: 'StorageQuota',
      fields: {
        owner: address,
        bytes_available: (10 + index * 5) * 1024 * 1024, // 10MB, 15MB, 20MB
        bytes_used: index * 1024 * 1024, // 0MB, 1MB, 2MB
        created_at: Date.now() - index * 86400000 // Staggered creation times
      }
    });
  });
  
  // Setup test repositories
  const testRepos = [
    {
      id: 'repo_basic_001',
      name: 'basic-test-repo',
      owner: testAddresses[0],
      encrypted: false
    },
    {
      id: 'repo_encrypted_002',
      name: 'encrypted-test-repo',
      owner: testAddresses[0],
      encrypted: true,
      sealPolicyId: 'policy_test_threshold'
    },
    {
      id: 'repo_collab_003',
      name: 'collaboration-test-repo',
      owner: testAddresses[0],
      encrypted: false,
      collaborators: {
        [testAddresses[1]]: 2, // Writer
        [testAddresses[2]]: 1  // Reader
      }
    }
  ];
  
  testRepos.forEach(repo => {
    mocks.suiClient.addMockObject(repo.id, {
      type: 'Repo',
      fields: {
        name: repo.name,
        owner: repo.owner,
        description: `Test repository: ${repo.name}`,
        default_branch: 'main',
        latest_commit_manifest_cid: `commit_cid_${repo.id}`,
        encrypted_dek_cid: repo.encrypted ? `encrypted_dek_${repo.id}` : '',
        seal_policy_id: repo.sealPolicyId || '',
        collaborators: repo.collaborators || {},
        created_at: Date.now() - Math.random() * 86400000,
        updated_at: Date.now() - Math.random() * 3600000
      }
    });
  });
  
  // Store mock instances globally for test access
  global.__WALGIT_MOCKS__ = mocks;
  global.__WALGIT_TEST_DATA_MANAGER__ = testDataManager;
  global.__WALGIT_TEST_REPOS__ = testRepos;
  global.__WALGIT_TEST_ADDRESSES__ = testAddresses;
  
  // Setup performance monitoring
  console.log('📈 Initializing performance monitoring...');
  global.__WALGIT_TEST_PERFORMANCE__ = {
    startTime: Date.now(),
    testTimes: new Map(),
    slowTests: []
  };
  
  // Create test artifacts directory
  const artifactsDir = path.join(process.cwd(), 'test-artifacts');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }
  
  // Setup test environment info
  const testInfo = {
    environment: 'test',
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString(),
    testSuites: ['smart-contracts', 'backend-cli', 'frontend', 'e2e'],
    mockServices: ['sui', 'walrus', 'seal'],
    testScenarios: Object.keys(TEST_SCENARIOS)
  };
  
  fs.writeFileSync(
    path.join(artifactsDir, 'test-environment.json'),
    JSON.stringify(testInfo, null, 2)
  );
  
  console.log('✅ Test environment setup complete');
  console.log(`📍 Test workspace: ${testDirs[0]}`);
  console.log(`📊 Test data scenarios: ${Object.keys(TEST_SCENARIOS).length}`);
  console.log(`🏦 Mock repositories: ${testRepos.length}`);
  console.log(`👥 Test addresses: ${testAddresses.length}`);
  
  return {
    mocks,
    testDataManager,
    testRepos,
    testAddresses,
    artifactsDir
  };
}