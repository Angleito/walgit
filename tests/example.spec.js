// @ts-check
import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  await page.goto('/');
  
  // Basic test to ensure the page loads
  await expect(page).toHaveTitle(/WalGit/);
});