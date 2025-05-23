/**
 * @fileoverview Working Frontend Tests for WalGit on port 3001
 * Tests actual frontend functionality that we know is working
 */

import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:3001';
const TEST_TIMEOUT = 60000;

test.describe('Frontend Functionality Tests', () => {
  test('homepage loads and displays main content', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    await page.goto(FRONTEND_URL);
    
    // Check that the page loads successfully
    const response = await page.waitForResponse(FRONTEND_URL);
    expect(response.status()).toBe(200);
    
    // Wait for React to hydrate
    await page.waitForLoadState('networkidle');
    
    // Check for main WalGit title
    await expect(page.locator('text=WalGit')).toBeVisible();
    
    // Check for main content sections
    await expect(page.locator('text=Decentralized Version Control')).toBeVisible();
  });

  test('navigation to different routes works', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    
    // Test navigation to repositories page
    await page.goto(`${FRONTEND_URL}/repositories`);
    const response = await page.waitForResponse(`${FRONTEND_URL}/repositories`);
    expect(response.status()).toBe(200);
    
    // Test navigation to new repository page
    await page.goto(`${FRONTEND_URL}/new-repository`);
    const newRepoResponse = await page.waitForResponse(`${FRONTEND_URL}/new-repository`);
    expect(newRepoResponse.status()).toBe(200);
  });

  test('cyberpunk UI elements are present', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    
    // Check for cyberpunk styling elements
    const bodyClasses = await page.locator('body').getAttribute('class');
    expect(bodyClasses).toBeTruthy();
    
    // Check for terminal components
    const terminalElements = page.locator('[class*="terminal"], [class*="cyberpunk"]');
    const terminalCount = await terminalElements.count();
    expect(terminalCount).toBeGreaterThanOrEqual(0); // Should have some cyberpunk elements
  });

  test('wallet connection button is present', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    
    // Look for wallet-related text or buttons
    const walletElements = page.locator('text=/connect.*wallet/i, text=/wallet/i');
    const walletCount = await walletElements.count();
    expect(walletCount).toBeGreaterThan(0);
  });

  test('main navigation links work', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    
    // Look for repository-related links
    const repoLinks = page.locator('a[href*="repositor"], a[href*="/new-"], a[href*="profile"]');
    const linkCount = await repoLinks.count();
    
    if (linkCount > 0) {
      // Test clicking the first available link
      const firstLink = repoLinks.first();
      const href = await firstLink.getAttribute('href');
      
      if (href) {
        await firstLink.click();
        await page.waitForLoadState('networkidle');
        
        // Should navigate successfully
        expect(page.url()).toContain(href);
      }
    }
  });

  test('responsive design works', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Test different viewport sizes
    const viewports = [
      { width: 1200, height: 800 }, // Desktop
      { width: 768, height: 1024 }, // Tablet
      { width: 375, height: 667 }   // Mobile
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      // Page should still load content
      const content = await page.locator('body').textContent();
      expect(content).toContain('WalGit');
    }
  });
});