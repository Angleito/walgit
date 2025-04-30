export default {
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testEnvironment: 'node',
  testMatch: ['**/WalGit-Backend/tests/**/*.test.js'],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/WalGit-Backend/tests/setup.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/walrus-sites/'
  ]
};
