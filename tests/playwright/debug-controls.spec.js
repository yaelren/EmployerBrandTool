/**
 * Playwright Tests for Debug Controls System
 * Tests all debug visualization controls functionality
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

const APP_URL = `file://${path.join(__dirname, '../../index.html')}`;

test.describe('Debug Controls System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
    // Wait for app to initialize
    await page.waitForFunction(() => window.app && window.app.isInitialized);
    
    // Open debug panel for all tests
    const debugToggle = page.locator('#toggleDebug');
    await debugToggle.click();
    await page.waitForTimeout(200); // Wait for panel animation
  });

  test.describe('Debug Panel Interface', () => {
    test('should open and close debug panel', async ({ page }) => {
      const debugToggle = page.locator('#toggleDebug');
      const debugContent = page.locator('#debugContent');
      
      // Panel should be open from beforeEach
      await expect(debugContent).toBeVisible();
      
      // Close panel
      await debugToggle.click();
      await expect(debugContent).toBeHidden();
      
      // Reopen panel
      await debugToggle.click();
      await expect(debugContent).toBeVisible();
    });

    test('should have all debug checkboxes', async ({ page }) => {
      // Verify all debug checkboxes exist
      await expect(page.locator('#showSpotOutlines')).toBeVisible();
      await expect(page.locator('#showSpotNumbers')).toBeVisible();
      await expect(page.locator('#showTextBounds')).toBeVisible();
      await expect(page.locator('#showPadding')).toBeVisible();
    });

    test('should have show all and hide all buttons', async ({ page }) => {
      const showAllBtn = page.locator('#showAllDebug');
      const hideAllBtn = page.locator('#hideAllDebug');
      
      await expect(showAllBtn).toBeVisible();
      await expect(hideAllBtn).toBeVisible();
      
      // Test show all functionality
      await showAllBtn.click();
      await expect(page.locator('#showSpotOutlines')).toBeChecked();
      await expect(page.locator('#showSpotNumbers')).toBeChecked();
      await expect(page.locator('#showTextBounds')).toBeChecked();
      await expect(page.locator('#showPadding')).toBeChecked();
      
      // Test hide all functionality
      await hideAllBtn.click();
      await expect(page.locator('#showSpotOutlines')).not.toBeChecked();
      await expect(page.locator('#showSpotNumbers')).not.toBeChecked();
      await expect(page.locator('#showTextBounds')).not.toBeChecked();
      await expect(page.locator('#showPadding')).not.toBeChecked();
    });
  });

  test.describe('Individual Debug Controls', () => {
    test.beforeEach(async ({ page }) => {
      // Start with all debug controls off
      await page.locator('#hideAllDebug').click();
    });

    test('should toggle spot outlines', async ({ page }) => {
      const checkbox = page.locator('#showSpotOutlines');
      
      // Should start unchecked (after hideAllDebug in beforeEach)
      await expect(checkbox).not.toBeChecked();
      
      // Toggle on
      await checkbox.click();
      await expect(checkbox).toBeChecked();
      
      // Toggle off
      await checkbox.click();
      await expect(checkbox).not.toBeChecked();
    });

    test('should toggle spot numbers', async ({ page }) => {
      const checkbox = page.locator('#showSpotNumbers');
      
      // Should start unchecked
      await expect(checkbox).not.toBeChecked();
      
      // Toggle on
      await checkbox.click();
      await expect(checkbox).toBeChecked();
      
      // Toggle off
      await checkbox.click();
      await expect(checkbox).not.toBeChecked();
    });

    test('should toggle text bounds', async ({ page }) => {
      const checkbox = page.locator('#showTextBounds');
      
      // Should start unchecked
      await expect(checkbox).not.toBeChecked();
      
      // Toggle on
      await checkbox.click();
      await expect(checkbox).toBeChecked();
      
      // Toggle off
      await checkbox.click();
      await expect(checkbox).not.toBeChecked();
    });

    test('should toggle padding visualization', async ({ page }) => {
      const checkbox = page.locator('#showPadding');
      
      // Should start unchecked
      await expect(checkbox).not.toBeChecked();
      
      // Toggle on
      await checkbox.click();
      await expect(checkbox).toBeChecked();
      
      // Toggle off
      await checkbox.click();
      await expect(checkbox).not.toBeChecked();
    });
  });

  test.describe('Debug Controls with Spots', () => {
    test.beforeEach(async ({ page }) => {
      // First detect spots so we have something to debug
      await page.locator('#findSpots').click();
      await page.waitForFunction(() => {
        const count = document.querySelector('#spotCount');
        return count && parseInt(count.textContent) > 0;
      });
    });

    test('should work with spot outlines when spots exist', async ({ page }) => {
      const checkbox = page.locator('#showSpotOutlines');
      
      // Turn off all debug first
      await page.locator('#hideAllDebug').click();
      
      // Turn on spot outlines
      await checkbox.click();
      await expect(checkbox).toBeChecked();
      
      // Verify spots exist
      const spotCount = await page.locator('#spotCount').textContent();
      expect(parseInt(spotCount)).toBeGreaterThan(0);
    });

    test('should work with spot numbers when spots exist', async ({ page }) => {
      const checkbox = page.locator('#showSpotNumbers');
      
      // Turn off all debug first
      await page.locator('#hideAllDebug').click();
      
      // Turn on spot numbers
      await checkbox.click();
      await expect(checkbox).toBeChecked();
      
      // Verify spots exist
      const spotCount = await page.locator('#spotCount').textContent();
      expect(parseInt(spotCount)).toBeGreaterThan(0);
    });

    test('should work with both spot outlines and numbers', async ({ page }) => {
      const outlineCheckbox = page.locator('#showSpotOutlines');
      const numberCheckbox = page.locator('#showSpotNumbers');
      
      // Turn off all debug first
      await page.locator('#hideAllDebug').click();
      
      // Turn on both spot controls
      await outlineCheckbox.click();
      await numberCheckbox.click();
      
      await expect(outlineCheckbox).toBeChecked();
      await expect(numberCheckbox).toBeChecked();
      
      // Verify spots exist
      const spotCount = await page.locator('#spotCount').textContent();
      expect(parseInt(spotCount)).toBeGreaterThan(0);
    });
  });

  test.describe('Debug Controls Integration', () => {
    test('should maintain debug states when switching modes', async ({ page }) => {
      // Enable some debug controls
      await page.locator('#showTextBounds').click();
      await page.locator('#showPadding').click();
      
      // Switch to manual mode
      // Manual mode is now the default - no need to switch
      
      // Debug controls should still be enabled
      await expect(page.locator('#showTextBounds')).toBeChecked();
      await expect(page.locator('#showPadding')).toBeChecked();
      
      // Manual mode is now the default - no need to switch modes
      
      // Debug controls should still be enabled
      await expect(page.locator('#showTextBounds')).toBeChecked();
      await expect(page.locator('#showPadding')).toBeChecked();
    });

    test('should work with text changes', async ({ page }) => {
      // Enable text bounds
      await page.locator('#showTextBounds').click();
      
      // Change text content
      const textArea = page.locator('#mainText');
      await textArea.fill('NEW\\nTEST\\nCONTENT');
      
      // Debug control should still be enabled
      await expect(page.locator('#showTextBounds')).toBeChecked();
    });

    test('should work when spots are cleared and regenerated', async ({ page }) => {
      // Turn off all debug first, then enable only spot controls
      await page.locator('#hideAllDebug').click();
      await page.locator('#showSpotOutlines').click();
      await page.locator('#showSpotNumbers').click();
      
      // Generate spots
      await page.locator('#findSpots').click();
      await page.waitForFunction(() => {
        const count = document.querySelector('#spotCount');
        return count && parseInt(count.textContent) > 0;
      });
      
      // Verify controls are still enabled
      await expect(page.locator('#showSpotOutlines')).toBeChecked();
      await expect(page.locator('#showSpotNumbers')).toBeChecked();
      
      // Change text (clears spots)
      const textArea = page.locator('#mainText');
      await textArea.fill('DIFFERENT\\nTEXT');
      
      // Controls should still be enabled
      await expect(page.locator('#showSpotOutlines')).toBeChecked();
      await expect(page.locator('#showSpotNumbers')).toBeChecked();
      
      // Regenerate spots
      await page.locator('#findSpots').click();
      await page.waitForFunction(() => {
        const count = document.querySelector('#spotCount');
        return count && parseInt(count.textContent) > 0;
      });
      
      // Controls should still be enabled
      await expect(page.locator('#showSpotOutlines')).toBeChecked();
      await expect(page.locator('#showSpotNumbers')).toBeChecked();
    });
  });

  test.describe('Visual Debug Features', () => {
    test('should handle rapid debug control toggling', async ({ page }) => {
      // Rapidly toggle all debug controls multiple times
      for (let i = 0; i < 3; i++) {
        await page.locator('#showAllDebug').click();
        await page.waitForTimeout(100);
        await page.locator('#hideAllDebug').click();
        await page.waitForTimeout(100);
      }
      
      // Should end in consistent state (all off)
      await expect(page.locator('#showSpotOutlines')).not.toBeChecked();
      await expect(page.locator('#showSpotNumbers')).not.toBeChecked();
      await expect(page.locator('#showTextBounds')).not.toBeChecked();
      await expect(page.locator('#showPadding')).not.toBeChecked();
    });

    test('should work with line spacing changes', async ({ page }) => {
      // Enable text bounds
      await page.locator('#showTextBounds').click();
      
      // Switch to main text tab to access line spacing control
      await page.locator('.tab-btn[data-tab="mainText"]').click();
      
      // Switch to manual mode to access line spacing control
      // Manual mode is now the default - no need to switch
      
      // Change line spacing
      const lineSpacingSlider = page.locator('#lineSpacing');
      await lineSpacingSlider.fill('20');
      
      // Debug control should still work
      await expect(page.locator('#showTextBounds')).toBeChecked();
      
      // Toggle off and on to verify functionality
      await page.locator('#showTextBounds').click();
      await expect(page.locator('#showTextBounds')).not.toBeChecked();
      
      await page.locator('#showTextBounds').click();
      await expect(page.locator('#showTextBounds')).toBeChecked();
    });

    test('should handle all debug controls simultaneously', async ({ page }) => {
      // First generate spots for spot debugging
      await page.locator('#findSpots').click();
      await page.waitForFunction(() => {
        const count = document.querySelector('#spotCount');
        return count && parseInt(count.textContent) > 0;
      });
      
      // Enable all debug controls at once
      await page.locator('#showAllDebug').click();
      
      // All should be enabled
      await expect(page.locator('#showSpotOutlines')).toBeChecked();
      await expect(page.locator('#showSpotNumbers')).toBeChecked();
      await expect(page.locator('#showTextBounds')).toBeChecked();
      await expect(page.locator('#showPadding')).toBeChecked();
      
      // Should not cause any errors or crashes
      await page.waitForTimeout(500);
      
      // Application should still be responsive
      const textArea = page.locator('#mainText');
      await textArea.fill('TEST');
      await expect(textArea).toHaveValue('TEST');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle debug controls with empty text', async ({ page }) => {
      // Clear text
      const textArea = page.locator('#mainText');
      await textArea.fill('');
      
      // Enable debug controls
      await page.locator('#showAllDebug').click();
      
      // Should not cause errors
      await page.waitForTimeout(500);
      
      // All controls should still be enabled
      await expect(page.locator('#showSpotOutlines')).toBeChecked();
      await expect(page.locator('#showSpotNumbers')).toBeChecked();
      await expect(page.locator('#showTextBounds')).toBeChecked();
      await expect(page.locator('#showPadding')).toBeChecked();
    });

    test('should handle debug controls without spots', async ({ page }) => {
      // Ensure no spots exist
      const spotCount = await page.locator('#spotCount').textContent();
      expect(parseInt(spotCount)).toBe(0);
      
      // Turn off all debug first, then enable spot controls
      await page.locator('#hideAllDebug').click();
      await page.locator('#showSpotOutlines').click();
      await page.locator('#showSpotNumbers').click();
      
      // Should not cause errors
      await page.waitForTimeout(500);
      
      // Controls should still be enabled
      await expect(page.locator('#showSpotOutlines')).toBeChecked();
      await expect(page.locator('#showSpotNumbers')).toBeChecked();
    });
  });
});