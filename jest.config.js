/**
 * @fileoverview Jest configuration for WalGit root project
 * Supports both backend and frontend testing with appropriate settings
 */

export default {
  // Projects configuration for multi-package testing
  projects: [
    {
      displayName: 'Backend CLI',
      testMatch: ['<rootDir>/walgit-backend/tests/**/*.test.js'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/walgit-backend/tests/setup.js'],
      moduleFileExtensions: ['js', 'json'],
      transform: {
        '^.+\\.js$': ['babel-jest', { presets: ['@babel/preset-env'] }]
      },
      collectCoverageFrom: [
        'walgit-backend/cli/src/**/*.js',
        '!walgit-backend/cli/src/**/*.test.js',
        '!walgit-backend/cli/src/**/mocks/**'
      ],
      coverageDirectory: '<rootDir>/coverage/backend',
      coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
      testTimeout: 30000,
      maxWorkers: 2
    },
    {
      displayName: 'Frontend',
      testMatch: ['<rootDir>/walgit-frontend/src/**/*.test.{ts,tsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/walgit-frontend/vitest.setup.ts'],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'walgit-frontend/tsconfig.json'
        }]
      },
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/walgit-frontend/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
      },
      collectCoverageFrom: [
        'walgit-frontend/src/**/*.{ts,tsx}',
        '!walgit-frontend/src/**/*.test.{ts,tsx}',
        '!walgit-frontend/src/**/*.d.ts',
        '!walgit-frontend/src/**/__tests__/**',
        '!walgit-frontend/src/**/mocks/**'
      ],
      coverageDirectory: '<rootDir>/coverage/frontend',
      coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
      testTimeout: 15000
    }
  ],
  
  // Global settings
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  
  // Global thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Test result processor
  testResultsProcessor: 'jest-sonar-reporter',
  
  // Global setup and teardown
  globalSetup: '<rootDir>/test-config/global-setup.js',
  globalTeardown: '<rootDir>/test-config/global-teardown.js',
  
  // Reporters
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './coverage/html-report',
      filename: 'jest-report.html',
      expand: true
    }],
    ['jest-junit', {
      outputDirectory: './coverage',
      outputName: 'junit.xml'
    }]
  ],
  
  // Verbose output for CI
  verbose: process.env.CI === 'true',
  
  // Watch mode settings
  watchman: true,
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/build/',
    '<rootDir>/.next/'
  ]
};