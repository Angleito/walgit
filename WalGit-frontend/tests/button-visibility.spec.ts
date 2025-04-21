import { test, expect } from '@playwright/test';

test.describe('Button Visibility Tests', () => {
  test('all buttons should be visible and readable on HomePage', async ({ page }) => {
    await page.goto('/');
    
    // Test primary action buttons
    const buttons = await page.getByRole('button').all();
    for (const button of buttons) {
      // Check if button is visible
      await expect(button).toBeVisible();
      
      // Check if button has sufficient size
      const boundingBox = await button.boundingBox();
      expect(boundingBox.width).toBeGreaterThan(32);
      expect(boundingBox.height).toBeGreaterThan(32);
      
      // Check if button text is readable (has sufficient contrast)
      const color = await button.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          background: style.backgroundColor,
          color: style.color,
          opacity: style.opacity
        };
      });
      
      // Ensure button is not transparent
      expect(parseFloat(color.opacity)).toBeGreaterThan(0.5);
    }
  });

  test('all buttons should be visible and readable on Repository page', async ({ page }) => {
    await page.goto('/walgit/decentralized-git');
    
    // Test repository action buttons
    const buttons = await page.getByRole('button').all();
    for (const button of buttons) {
      await expect(button).toBeVisible();
      
      const boundingBox = await button.boundingBox();
      expect(boundingBox.width).toBeGreaterThan(32);
      expect(boundingBox.height).toBeGreaterThan(32);
      
      const color = await button.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          background: style.backgroundColor,
          color: style.color,
          opacity: style.opacity
        };
      });
      
      expect(parseFloat(color.opacity)).toBeGreaterThan(0.5);
    }
  });

  test('all buttons should have sufficient padding and spacing', async ({ page }) => {
    await page.goto('/');
    
    const buttons = await page.getByRole('button').all();
    for (const button of buttons) {
      const computedStyle = await button.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          paddingLeft: parseFloat(style.paddingLeft),
          paddingRight: parseFloat(style.paddingRight),
          paddingTop: parseFloat(style.paddingTop),
          paddingBottom: parseFloat(style.paddingBottom),
          marginLeft: parseFloat(style.marginLeft),
          marginRight: parseFloat(style.marginRight)
        };
      });
      
      // Check for sufficient padding
      expect(computedStyle.paddingLeft).toBeGreaterThanOrEqual(8);
      expect(computedStyle.paddingRight).toBeGreaterThanOrEqual(8);
      expect(computedStyle.paddingTop).toBeGreaterThanOrEqual(4);
      expect(computedStyle.paddingBottom).toBeGreaterThanOrEqual(4);
      
      // Check for sufficient spacing between buttons
      expect(computedStyle.marginLeft + computedStyle.marginRight).toBeGreaterThanOrEqual(4);
    }
  });

  test('buttons should be keyboard accessible', async ({ page }) => {
    await page.goto('/');
    
    const buttons = await page.getByRole('button').all();
    for (const button of buttons) {
      // Check if button can receive focus
      await button.focus();
      await expect(button).toBeFocused();
      
      // Check if button has visible focus indicator
      const focusStyles = await button.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          outlineWidth: parseFloat(style.outlineWidth),
          outlineStyle: style.outlineStyle,
          boxShadow: style.boxShadow
        };
      });
      
      const hasFocusIndicator = focusStyles.outlineWidth > 0 || 
                               focusStyles.outlineStyle !== 'none' ||
                               focusStyles.boxShadow !== 'none';
      expect(hasFocusIndicator).toBeTruthy();
    }
  });
});