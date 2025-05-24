/**
 * Constants used throughout the WalGit application
 */

// Blockchain transaction constants
export const SUI_TRANSACTION_BLOCK_SIZE_LIMIT = 16000; // Maximum bytes per transaction
export const DEFAULT_GAS_BUDGET = 30000000; // Default gas budget for transactions
export const MAX_GAS_BUDGET = 200000000; // Maximum gas budget for complex operations
export const GAS_PRICE_BUFFER_MULTIPLIER = 1.2; // Multiplier to add buffer to gas estimates

// Pull Request constants
export const PR_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  MERGED: 'merged',
  DRAFT: 'draft'
};

export const PR_REVIEW_VERDICT = {
  APPROVE: 'approve',
  REQUEST_CHANGES: 'request_changes',
  COMMENT: 'comment'
};

export const PR_MERGE_STRATEGY = {
  MERGE: 'merge',
  SQUASH: 'squash',
  REBASE: 'rebase'
};

// Batch processing constants
export const MAX_BATCH_SIZE = 50; // Maximum number of items to process in a single batch
export const MAX_CONCURRENT_TRANSACTIONS = 5; // Maximum number of concurrent transactions

// Storage thresholds
export const WALRUS_STORAGE_TIER = {
  BASIC: {
    maxSize: 100 * 1024 * 1024, // 100 MB
    cost: 1000, // Cost in SUI
    duration: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
  },
  STANDARD: {
    maxSize: 1024 * 1024 * 1024, // 1 GB
    cost: 5000, // Cost in SUI
    duration: 180 * 24 * 60 * 60 * 1000 // 180 days in milliseconds
  },
  PREMIUM: {
    maxSize: 10 * 1024 * 1024 * 1024, // 10 GB
    cost: 20000, // Cost in SUI
    duration: 365 * 24 * 60 * 60 * 1000 // 365 days in milliseconds
  }
};

// Repository constants
export const REPO_VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private'
};

// Branch protection constants
export const PROTECTION_LEVEL = {
  NONE: 'none',
  PUSH: 'push_protection',
  REVIEW: 'review_required',
  APPROVAL: 'approval_required'
};

// Network configuration constants
export const NETWORK_CONFIG = {
  devnet: {
    rpcUrl: 'https://fullnode.devnet.sui.io:443',
    walrusAggregator: 'https://walrus.devnet.sui.io',
    walrusPublisher: 'https://walrus.devnet.sui.io'
  },
  testnet: {
    rpcUrl: 'https://fullnode.testnet.sui.io:443',
    walrusAggregator: 'https://walrus-testnet-aggregator.nodeinfra.com',
    walrusPublisher: 'https://walrus-testnet-publisher.nodeinfra.com'
  },
  mainnet: {
    rpcUrl: 'https://fullnode.mainnet.sui.io:443',
    walrusAggregator: 'https://walrus-mainnet-aggregator.nodeinfra.com',
    walrusPublisher: 'https://walrus-mainnet-publisher.nodeinfra.com'
  },
  localnet: {
    rpcUrl: 'http://localhost:9000',
    walrusAggregator: 'http://localhost:8080',
    walrusPublisher: 'http://localhost:8080'
  }
};

// Client configuration constants
export const DEFAULT_CONFIG = {
  defaultBranch: 'main',
  pushStrategy: 'single',
  storageSettings: 'standard',
  defaultMergeStrategy: PR_MERGE_STRATEGY.MERGE,
  autoRenewStorage: true
};

export const DEFAULT_COMMIT_MESSAGE_TEMPLATE = 
  '# Write a concise summary of your changes (50 chars or less)\n\n' +
  '# More detailed explanatory text. Wrap it to 72 characters.\n' +
  '# Explain the problem that this commit is solving. Focus on why you\n' +
  '# are making this change as opposed to how.\n\n' +
  '# Include any relevant task IDs or issue numbers with # prefix\n';

// Stash constants
export const STASH_STATUS = {
  APPLIED: 'applied',
  DROPPED: 'dropped',
  MODIFIED: 'modified'
};

export const STASH_SUBCOMMANDS = {
  SAVE: 'save',
  APPLY: 'apply',
  POP: 'pop',
  DROP: 'drop',
  LIST: 'list',
  SHOW: 'show',
  BRANCH: 'branch'
};

// Command line interface constants
export const CLI_COMMANDS = [
  'init',
  'add',
  'commit',
  'branch',
  'checkout',
  'merge',
  'remote',
  'push',
  'pull',
  'fetch',
  'tag',
  'log',
  'status',
  'diff',
  'reset',
  'revert',
  'clone',
  'stash',
  'pr',
  'changeset',
  'diffedit',
  'credential'
];

// Credential helper constants
export const CREDENTIAL_HELPER_TYPES = {
  STORE: 'store',      // Simple file-based storage
  CACHE: 'cache',      // In-memory temporary storage
  OSXKEYCHAIN: 'osxkeychain', // macOS keychain
  WINCRED: 'wincred',  // Windows credential manager
  LIBSECRET: 'libsecret' // Linux libsecret
};

export const DEFAULT_CREDENTIAL_TIMEOUT = 900; // 15 minutes in seconds

export const AUTH_ERROR_MESSAGES = [
  'unauthorized',
  'authentication failed',
  'invalid credentials',
  'login failed',
  'password incorrect',
  'auth failed',
  'not authorized',
  '401'
];