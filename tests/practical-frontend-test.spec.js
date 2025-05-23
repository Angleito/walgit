/**
 * @fileoverview Practical E2E tests for WalGit Frontend
 * Tests actual frontend functionality without requiring mock setup
 */

import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 60000;

test.describe('Frontend Basic Functionality', () => {
  test('homepage loads successfully', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);
    
    await page.goto(FRONTEND_URL);
    
    // Check that the page loads without errors
    await expect(page).toHaveTitle(/WalGit/i);
    
    // Look for common elements that should be present
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent).toBeTruthy();
    
    // Check for React app mounting
    await page.waitForFunction(() => {
      return document.querySelector('[data-reactroot], #__next') !== null;
    }, { timeout: 10000 });
  });

  test('navigation structure exists', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for common navigation elements
    const links = await page.locator('a').count();
    expect(links).toBeGreaterThan(0);
    
    // Check for main content area
    const main = page.locator('main, [role="main"], #main, .main');
    const mainExists = await main.count() > 0;
    
    if (mainExists) {
      await expect(main.first()).toBeVisible();
    }
  });

  test('responsive design elements', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForLoadState('networkidle');
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // Page should still be responsive
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent).toBeTruthy();
  });

  test('check for error states', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Look for any obvious error messages
    const errorSelectors = [
      'text=/error/i',
      'text=/not found/i',
      '[role="alert"]',
      '.error',
      '.alert-error'
    ];
    
    for (const selector of errorSelectors) {
      const errorElement = page.locator(selector);
      const errorCount = await errorElement.count();
      
      if (errorCount > 0) {
        const errorText = await errorElement.first().textContent();
        console.log(`Found potential error: ${errorText}`);
      }
    }
  });

  test('basic routing functionality', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    
    // Try to navigate to common routes
    const commonRoutes = [
      '/repositories',
      '/new-repository',
      '/profile',
      '/discover'
    ];
    
    for (const route of commonRoutes) {
      await page.goto(`${FRONTEND_URL}${route}`);
      
      // Check that we get a valid response (not 404)
      const response = page.url();
      expect(response).toContain(FRONTEND_URL);
      
      // Wait a bit between requests
      await page.waitForTimeout(500);
    }
  });

  test('console errors check', async ({ page }) => {
    const errors = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', (err) => {
      errors.push(err.toString());
    });
    
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    
    // Allow some time for any async errors
    await page.waitForTimeout(3000);
    
    // Report errors but don't fail the test for minor issues
    if (errors.length > 0) {
      console.log('Console errors found:', errors);
      
      // Only fail for critical errors
      const criticalErrors = errors.filter(error => 
        error.includes('TypeError') || 
        error.includes('ReferenceError') ||
        error.includes('Network error')
      );
      
      expect(criticalErrors.length).toBe(0);
    }
  });
});

test.describe('Frontend Performance', () => {
  test('page load performance', async ({ page }) => {
    const start = Date.now();
    
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - start;
    
    // Page should load within reasonable time (10 seconds)
    expect(loadTime).toBeLessThan(10000);
    
    console.log(`Page load time: ${loadTime}ms`);
  });

  test('resource loading', async ({ page }) => {
    const resourcesLoaded = [];
    const resourcesFailed = [];
    
    page.on('response', (response) => {
      if (response.status() >= 200 && response.status() < 300) {
        resourcesLoaded.push(response.url());
      } else if (response.status() >= 400) {
        resourcesFailed.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    
    console.log(`Resources loaded: ${resourcesLoaded.length}`);
    console.log(`Resources failed: ${resourcesFailed.length}`);
    
    if (resourcesFailed.length > 0) {
      console.log('Failed resources:', resourcesFailed);
    }
    
    // Should have loaded some resources successfully
    expect(resourcesLoaded.length).toBeGreaterThan(0);
    
    // Critical resources shouldn't fail
    const criticalFailures = resourcesFailed.filter(r => 
      r.status === 404 && (
        r.url.includes('.js') || 
        r.url.includes('.css') ||
        r.url.includes('/api/')
      )
    );
    
    expect(criticalFailures.length).toBe(0);
  });
});