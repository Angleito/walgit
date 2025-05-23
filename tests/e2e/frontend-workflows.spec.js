/**
 * @fileoverview Comprehensive E2E tests for WalGit Frontend workflows
 * Tests complete user journeys through the web interface
 */

import { test, expect } from '@playwright/test';

// Test configuration
const FRONTEND_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 120000; // 2 minutes per test

// Mock wallet addresses for testing
const MOCK_ADDRESSES = {
  OWNER: '0x123456789abcdef123456789abcdef123456789a',
  COLLABORATOR: '0x987654321fedcba987654321fedcba987654321f',
  READER: '0xabc123def456789abc123def456789abc123def45'
};

test.describe('Frontend Authentication and Wallet Connection', () => {
  test('wallet connection flow', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    await page.goto(FRONTEND_URL);
    
    // Check initial state - should show connect wallet option
    await expect(page.locator('[data-testid="connect-wallet-button"]')).toBeVisible();
    
    // Click connect wallet
    await page.click('[data-testid="connect-wallet-button"]');
    
    // Wallet selection modal should appear
    await expect(page.locator('[data-testid="wallet-selection-modal"]')).toBeVisible();
    
    // Select Sui Wallet (mock)
    await page.click('[data-testid="sui-wallet-option"]');
    
    // Mock wallet connection success
    await page.evaluate(() => {
      window.mockWalletConnection({
        address: '0x123456789abcdef123456789abcdef123456789a',
        network: 'devnet',
        connected: true
      });
    });
    
    // Should show connected state
    await expect(page.locator('[data-testid="wallet-connected"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-address"]')).toContainText('0x1234...789a');
  });

  test('network selection and switching', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Connect wallet first
    await page.click('[data-testid="connect-wallet-button"]');
    await page.click('[data-testid="sui-wallet-option"]');
    
    // Open network selector
    await page.click('[data-testid="network-selector"]');
    
    // Should show network options
    await expect(page.locator('[data-testid="network-devnet"]')).toBeVisible();
    await expect(page.locator('[data-testid="network-testnet"]')).toBeVisible();
    await expect(page.locator('[data-testid="network-mainnet"]')).toBeVisible();
    
    // Switch to testnet
    await page.click('[data-testid="network-testnet"]');
    
    // Should show confirmation
    await expect(page.locator('[data-testid="network-switch-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-network"]')).toContainText('testnet');
  });

  test('wallet disconnection', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Connect wallet
    await page.click('[data-testid="connect-wallet-button"]');
    await page.click('[data-testid="sui-wallet-option"]');
    
    // Open wallet menu
    await page.click('[data-testid="wallet-menu"]');
    
    // Disconnect wallet
    await page.click('[data-testid="disconnect-wallet"]');
    
    // Should return to disconnected state
    await expect(page.locator('[data-testid="connect-wallet-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="wallet-connected"]')).not.toBeVisible();
  });
});

test.describe('Frontend Repository Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Mock wallet connection
    await page.evaluate(() => {
      window.mockWalletConnection({
        address: '0x123456789abcdef123456789abcdef123456789a',
        network: 'devnet',
        connected: true
      });
    });
  });

  test('create new repository flow', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    // Navigate to new repository page
    await page.click('[data-testid="new-repository-button"]');
    await expect(page).toHaveURL(/.*\/new-repository/);
    
    // Fill repository creation form
    await page.fill('[data-testid="repo-name-input"]', 'test-frontend-repo');
    await page.fill('[data-testid="repo-description-input"]', 'Test repository created from frontend');
    
    // Select repository visibility
    await page.click('[data-testid="visibility-public"]');
    
    // Enable encryption option
    await page.check('[data-testid="enable-encryption-checkbox"]');
    
    // Set default branch
    await page.fill('[data-testid="default-branch-input"]', 'main');
    
    // Submit form
    await page.click('[data-testid="create-repository-submit"]');
    
    // Should show creation progress
    await expect(page.locator('[data-testid="creation-progress"]')).toBeVisible();
    
    // Should redirect to repository overview
    await expect(page).toHaveURL(/.*\/repositories\/.*\/test-frontend-repo/);
    await expect(page.locator('[data-testid="repo-title"]')).toContainText('test-frontend-repo');
  });

  test('repository overview and navigation', async ({ page }) => {
    // Mock existing repository
    await page.evaluate(() => {
      window.mockRepository({
        id: 'repo_123',
        name: 'mock-repo',
        description: 'Mock repository for testing',
        owner: '0x123456789abcdef123456789abcdef123456789a',
        defaultBranch: 'main',
        collaborators: 3,
        lastCommit: 'Initial commit',
        lastCommitTime: '2 hours ago'
      });
    });

    await page.goto(`${FRONTEND_URL}/repositories/owner/mock-repo`);
    
    // Verify repository information
    await expect(page.locator('[data-testid="repo-title"]')).toContainText('mock-repo');
    await expect(page.locator('[data-testid="repo-description"]')).toContainText('Mock repository for testing');
    await expect(page.locator('[data-testid="repo-owner"]')).toContainText('0x1234...789a');
    
    // Check navigation tabs
    await expect(page.locator('[data-testid="tab-code"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-commits"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-branches"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-settings"]')).toBeVisible();
    
    // Test tab navigation
    await page.click('[data-testid="tab-commits"]');
    await expect(page.locator('[data-testid="commit-history"]')).toBeVisible();
    
    await page.click('[data-testid="tab-branches"]');
    await expect(page.locator('[data-testid="branch-list"]')).toBeVisible();
  });

  test('file browser functionality', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/repositories/owner/mock-repo`);
    
    // Mock file structure
    await page.evaluate(() => {
      window.mockFileStructure({
        files: [
          { name: 'README.md', type: 'file', size: '1.2KB', lastModified: '2 hours ago' },
          { name: 'src', type: 'directory', lastModified: '1 hour ago' },
          { name: 'package.json', type: 'file', size: '856B', lastModified: '3 hours ago' }
        ]
      });
    });
    
    // Verify file list
    await expect(page.locator('[data-testid="file-item-README.md"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-item-src"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-item-package.json"]')).toBeVisible();
    
    // Click on directory to navigate
    await page.click('[data-testid="file-item-src"]');
    await expect(page.locator('[data-testid="breadcrumb-src"]')).toBeVisible();
    
    // Click on file to view content
    await page.click('[data-testid="file-item-README.md"]');
    await expect(page.locator('[data-testid="file-viewer"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-content"]')).toBeVisible();
  });

  test('repository settings and configuration', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/repositories/owner/mock-repo`);
    
    // Navigate to settings
    await page.click('[data-testid="tab-settings"]');
    
    // General settings section
    await expect(page.locator('[data-testid="settings-general"]')).toBeVisible();
    
    // Update repository description
    await page.fill('[data-testid="settings-description"]', 'Updated repository description');
    await page.click('[data-testid="save-general-settings"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="settings-success"]')).toBeVisible();
    
    // Collaborator management section
    await page.click('[data-testid="settings-collaborators-tab"]');
    await expect(page.locator('[data-testid="collaborators-list"]')).toBeVisible();
    
    // Add new collaborator
    await page.fill('[data-testid="add-collaborator-address"]', MOCK_ADDRESSES.COLLABORATOR);
    await page.selectOption('[data-testid="collaborator-role-select"]', 'writer');
    await page.click('[data-testid="add-collaborator-submit"]');
    
    // Verify collaborator was added
    await expect(page.locator(`[data-testid="collaborator-${MOCK_ADDRESSES.COLLABORATOR}"]`)).toBeVisible();
    
    // Encryption settings section
    await page.click('[data-testid="settings-encryption-tab"]');
    await expect(page.locator('[data-testid="encryption-status"]')).toBeVisible();
    
    // Rotate encryption keys
    await page.click('[data-testid="rotate-encryption-keys"]');
    await expect(page.locator('[data-testid="key-rotation-success"]')).toBeVisible();
  });
});

test.describe('Frontend Collaboration Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Mock wallet connection
    await page.evaluate(() => {
      window.mockWalletConnection({
        address: '0x987654321fedcba987654321fedcba987654321f',
        network: 'devnet',
        connected: true
      });
    });
  });

  test('pull request creation and management', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    await page.goto(`${FRONTEND_URL}/repositories/owner/mock-repo`);
    
    // Navigate to pull requests
    await page.click('[data-testid="tab-pull-requests"]');
    
    // Create new pull request
    await page.click('[data-testid="new-pull-request"]');
    
    // Fill PR form
    await page.fill('[data-testid="pr-title"]', 'Add new feature X');
    await page.fill('[data-testid="pr-description"]', 'This PR adds feature X with comprehensive tests');
    
    // Select source and target branches
    await page.selectOption('[data-testid="pr-source-branch"]', 'feature/feature-x');
    await page.selectOption('[data-testid="pr-target-branch"]', 'main');
    
    // Submit PR
    await page.click('[data-testid="create-pr-submit"]');
    
    // Should redirect to PR view
    await expect(page.locator('[data-testid="pr-title-display"]')).toContainText('Add new feature X');
    await expect(page.locator('[data-testid="pr-status"]')).toContainText('Open');
    
    // Verify PR details
    await expect(page.locator('[data-testid="pr-author"]')).toBeVisible();
    await expect(page.locator('[data-testid="pr-files-changed"]')).toBeVisible();
  });

  test('code review and commenting', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/repositories/owner/mock-repo/pull/1`);
    
    // Navigate to files tab
    await page.click('[data-testid="pr-files-tab"]');
    
    // Mock file diff
    await page.evaluate(() => {
      window.mockFileDiff({
        files: [
          {
            name: 'src/feature.js',
            status: 'added',
            additions: 25,
            deletions: 0,
            diff: '+export const newFeature = () => {\n+  return "Hello World";\n+};'
          }
        ]
      });
    });
    
    // View file diff
    await expect(page.locator('[data-testid="file-diff-src/feature.js"]')).toBeVisible();
    
    // Add inline comment
    await page.hover('[data-testid="diff-line-2"]');
    await page.click('[data-testid="add-comment-line-2"]');
    
    // Fill comment form
    await page.fill('[data-testid="comment-textarea"]', 'Consider adding error handling here');
    await page.click('[data-testid="submit-comment"]');
    
    // Verify comment appears
    await expect(page.locator('[data-testid="comment-thread"]')).toBeVisible();
    await expect(page.locator('[data-testid="comment-content"]')).toContainText('Consider adding error handling');
    
    // Add PR review
    await page.click('[data-testid="add-review-button"]');
    await page.fill('[data-testid="review-summary"]', 'Looks good overall, just minor suggestions');
    await page.click('[data-testid="review-approve"]');
    await page.click('[data-testid="submit-review"]');
    
    // Verify review appears
    await expect(page.locator('[data-testid="review-approved"]')).toBeVisible();
  });

  test('merge pull request workflow', async ({ page }) => {
    // Assume user is repository owner
    await page.evaluate(() => {
      window.mockWalletConnection({
        address: '0x123456789abcdef123456789abcdef123456789a', // Owner address
        network: 'devnet',
        connected: true
      });
    });

    await page.goto(`${FRONTEND_URL}/repositories/owner/mock-repo/pull/1`);
    
    // Mock PR that's ready to merge
    await page.evaluate(() => {
      window.mockPullRequest({
        id: 1,
        status: 'open',
        reviewsRequired: 1,
        reviewsApproved: 1,
        conflictsResolved: true,
        mergeable: true
      });
    });
    
    // Should show merge button
    await expect(page.locator('[data-testid="merge-pr-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="merge-pr-button"]')).not.toBeDisabled();
    
    // Select merge strategy
    await page.selectOption('[data-testid="merge-strategy"]', 'squash');
    
    // Add merge commit message
    await page.fill('[data-testid="merge-commit-message"]', 'Merge: Add new feature X (#1)');
    
    // Perform merge
    await page.click('[data-testid="merge-pr-button"]');
    
    // Should show merge progress
    await expect(page.locator('[data-testid="merge-progress"]')).toBeVisible();
    
    // Should update status to merged
    await expect(page.locator('[data-testid="pr-status"]')).toContainText('Merged');
    await expect(page.locator('[data-testid="merge-success"]')).toBeVisible();
  });
});

test.describe('Frontend Storage and Encryption', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Mock wallet connection
    await page.evaluate(() => {
      window.mockWalletConnection({
        address: '0x123456789abcdef123456789abcdef123456789a',
        network: 'devnet',
        connected: true
      });
    });
  });

  test('storage dashboard and quota management', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/repositories/owner/mock-repo/storage`);
    
    // Mock storage data
    await page.evaluate(() => {
      window.mockStorageData({
        totalQuota: '1024MB',
        usedStorage: '256MB',
        availableStorage: '768MB',
        utilizationPercentage: 25,
        repositories: [
          { name: 'mock-repo', size: '128MB', percentage: 50 },
          { name: 'other-repo', size: '64MB', percentage: 25 },
          { name: 'archive-repo', size: '64MB', percentage: 25 }
        ]
      });
    });
    
    // Verify storage overview
    await expect(page.locator('[data-testid="storage-total"]')).toContainText('1024MB');
    await expect(page.locator('[data-testid="storage-used"]')).toContainText('256MB');
    await expect(page.locator('[data-testid="storage-available"]')).toContainText('768MB');
    
    // Check storage usage chart
    await expect(page.locator('[data-testid="storage-chart"]')).toBeVisible();
    
    // Repository storage breakdown
    await expect(page.locator('[data-testid="repo-storage-mock-repo"]')).toContainText('128MB');
    
    // Purchase additional storage
    await page.click('[data-testid="purchase-storage-button"]');
    await page.selectOption('[data-testid="storage-amount-select"]', '512MB');
    await page.click('[data-testid="confirm-purchase"]');
    
    // Should show purchase confirmation
    await expect(page.locator('[data-testid="purchase-success"]')).toBeVisible();
  });

  test('encryption management interface', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/repositories/owner/mock-repo/storage/manage`);
    
    // Navigate to encryption tab
    await page.click('[data-testid="encryption-tab"]');
    
    // Mock encryption status
    await page.evaluate(() => {
      window.mockEncryptionStatus({
        enabled: true,
        algorithm: 'SEAL Threshold Encryption',
        keyRotationInterval: '90 days',
        lastRotation: '15 days ago',
        nextRotation: '75 days',
        accessList: [
          { address: '0x123456789abcdef123456789abcdef123456789a', role: 'owner' },
          { address: '0x987654321fedcba987654321fedcba987654321f', role: 'writer' },
          { address: '0xabc123def456789abc123def456789abc123def45', role: 'reader' }
        ]
      });
    });
    
    // Verify encryption details
    await expect(page.locator('[data-testid="encryption-status"]')).toContainText('Enabled');
    await expect(page.locator('[data-testid="encryption-algorithm"]')).toContainText('SEAL Threshold');
    await expect(page.locator('[data-testid="last-rotation"]')).toContainText('15 days ago');
    
    // View access list
    await expect(page.locator('[data-testid="access-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="access-owner"]')).toBeVisible();
    await expect(page.locator('[data-testid="access-writer"]')).toBeVisible();
    
    // Rotate keys
    await page.click('[data-testid="rotate-keys-button"]');
    await page.click('[data-testid="confirm-rotation"]');
    
    // Should show rotation progress
    await expect(page.locator('[data-testid="rotation-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="rotation-success"]')).toBeVisible();
    
    // Share access with new user
    await page.fill('[data-testid="share-address-input"]', MOCK_ADDRESSES.READER);
    await page.click('[data-testid="share-access-button"]');
    
    // Should show in access list
    await expect(page.locator(`[data-testid="access-${MOCK_ADDRESSES.READER}"]`)).toBeVisible();
  });

  test('tusky integration and storage optimization', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/repositories/owner/mock-repo/storage/manage`);
    
    // Navigate to Tusky tab
    await page.click('[data-testid="tusky-tab"]');
    
    // Mock Tusky status
    await page.evaluate(() => {
      window.mockTuskyStatus({
        enabled: false,
        freeQuota: '5GB',
        usedQuota: '0MB',
        sharedQuota: '50GB',
        status: 'available'
      });
    });
    
    // Enable Tusky
    await page.click('[data-testid="enable-tusky-button"]');
    await page.click('[data-testid="confirm-tusky-enable"]');
    
    // Should show Tusky configuration
    await expect(page.locator('[data-testid="tusky-enabled"]')).toBeVisible();
    await expect(page.locator('[data-testid="tusky-quota"]')).toContainText('5GB');
    
    // Configure fallback storage
    await page.click('[data-testid="configure-fallback"]');
    await page.selectOption('[data-testid="fallback-provider"]', 'walrus');
    await page.click('[data-testid="save-fallback"]');
    
    // Should show fallback configuration
    await expect(page.locator('[data-testid="fallback-configured"]')).toBeVisible();
    
    // Test migration to Tusky
    await page.click('[data-testid="migrate-to-tusky"]');
    await page.click('[data-testid="confirm-migration"]');
    
    // Should show migration progress
    await expect(page.locator('[data-testid="migration-progress"]')).toBeVisible();
  });
});

test.describe('Frontend Error Handling and Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Mock wallet connection
    await page.evaluate(() => {
      window.mockWalletConnection({
        address: '0x123456789abcdef123456789abcdef123456789a',
        network: 'devnet',
        connected: true
      });
    });
  });

  test('network error handling and retry mechanisms', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/repositories/owner/mock-repo`);
    
    // Mock network failure
    await page.route('**/api/**', route => {
      route.abort('failed');
    });
    
    // Attempt to load repository data
    await page.reload();
    
    // Should show error state
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    
    // Restore network and retry
    await page.unroute('**/api/**');
    await page.click('[data-testid="retry-button"]');
    
    // Should reload successfully
    await expect(page.locator('[data-testid="repo-title"]')).toBeVisible();
  });

  test('transaction failure handling', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/repositories/owner/mock-repo/settings`);
    
    // Mock transaction failure
    await page.evaluate(() => {
      window.mockTransactionFailure = true;
    });
    
    // Attempt to update repository settings
    await page.fill('[data-testid="settings-description"]', 'Updated description');
    await page.click('[data-testid="save-general-settings"]');
    
    // Should show transaction error
    await expect(page.locator('[data-testid="transaction-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-details"]')).toContainText('Transaction failed');
    
    // Should offer retry option
    await expect(page.locator('[data-testid="retry-transaction"]')).toBeVisible();
  });

  test('permission denied scenarios', async ({ page }) => {
    // Mock connection as non-owner user
    await page.evaluate(() => {
      window.mockWalletConnection({
        address: '0xabc123def456789abc123def456789abc123def45', // Reader address
        network: 'devnet',
        connected: true
      });
    });

    await page.goto(`${FRONTEND_URL}/repositories/owner/mock-repo/settings`);
    
    // Should show permission denied message
    await expect(page.locator('[data-testid="permission-denied"]')).toBeVisible();
    await expect(page.locator('[data-testid="permission-message"]')).toContainText('You do not have permission');
    
    // Settings should be disabled or hidden
    await expect(page.locator('[data-testid="settings-form"]')).not.toBeVisible();
  });

  test('large file upload handling', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT * 2);

    await page.goto(`${FRONTEND_URL}/repositories/owner/mock-repo`);
    
    // Navigate to file upload
    await page.click('[data-testid="upload-files-button"]');
    
    // Mock large file selection
    await page.evaluate(() => {
      const mockFile = new File(['x'.repeat(100 * 1024 * 1024)], 'large-file.bin', {
        type: 'application/octet-stream'
      });
      
      const input = document.querySelector('[data-testid="file-upload-input"]');
      const dt = new DataTransfer();
      dt.items.add(mockFile);
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    // Should show large file warning
    await expect(page.locator('[data-testid="large-file-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="chunked-upload-info"]')).toBeVisible();
    
    // Proceed with upload
    await page.click('[data-testid="proceed-upload"]');
    
    // Should show upload progress
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
  });
});