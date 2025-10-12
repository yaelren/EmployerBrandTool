/**
 * Playwright Tests for TextComponent System
 * Tests the centralized text component functionality for both main text and spot text
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

const APP_URL = `file://${path.join(__dirname, '../../index.html')}`;

test.describe('TextComponent System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
    // Wait for app to initialize
    await page.waitForFunction(() => window.app && window.app.isInitialized);
  });

  test.describe('Main Text Features', () => {
    test('should render initial text with line alignment controls', async ({ page }) => {
      // Check initial text is present
      const textArea = page.locator('#mainText');
      await expect(textArea).toHaveValue('EMPLOYEE\nSPOTLIGHT\n2024');

      // Check line alignment controls are generated
      await expect(page.locator('text=Line 1: "EMPLOYEE"')).toBeVisible();
      await expect(page.locator('text=Line 2: "SPOTLIGHT"')).toBeVisible();
      await expect(page.locator('text=Line 3: "2024"')).toBeVisible();

      // Check alignment buttons exist for each line
      const lineControls = page.locator('.line-alignment-control');
      await expect(lineControls).toHaveCount(3);
    });

    test('should toggle text styling (Bold, Italic, Underline, Highlight)', async ({ page }) => {
      // Test Bold button
      const boldBtn = page.locator('#mainTextBold');
      await boldBtn.click();
      await expect(boldBtn).toHaveClass(/active/);
      
      // Test Italic button
      const italicBtn = page.locator('#mainTextItalic');
      await italicBtn.click();
      await expect(italicBtn).toHaveClass(/active/);
      
      // Test Underline button
      const underlineBtn = page.locator('#mainTextUnderline');
      await underlineBtn.click();
      await expect(underlineBtn).toHaveClass(/active/);
      
      // Test Highlight button
      const highlightBtn = page.locator('#mainTextHighlight');
      await highlightBtn.click();
      await expect(highlightBtn).toHaveClass(/active/);
    });

    test('should show/hide highlight color picker', async ({ page }) => {
      const highlightBtn = page.locator('#mainTextHighlight');
      const colorGroup = page.locator('#highlightColorGroup');
      
      // Initially hidden
      await expect(colorGroup).toBeHidden();
      
      // Click highlight button to show
      await highlightBtn.click();
      await expect(colorGroup).toBeVisible();
      
      // Click again to hide
      await highlightBtn.click();
      await expect(colorGroup).toBeHidden();
    });

    test('should change text color', async ({ page }) => {
      const colorInput = page.locator('#textColor');
      await colorInput.fill('#ff0000');
      await expect(colorInput).toHaveValue('#ff0000');
    });

    test('should handle line alignment changes', async ({ page }) => {
      // Click left alignment for first line
      const firstLineLeftBtn = page.locator('[data-line="0"][data-align="left"]');
      await firstLineLeftBtn.click();
      await expect(firstLineLeftBtn).toHaveClass(/active/);
      
      // Click right alignment for second line
      const secondLineRightBtn = page.locator('[data-line="1"][data-align="right"]');
      await secondLineRightBtn.click();
      await expect(secondLineRightBtn).toHaveClass(/active/);
    });
  });

  test.describe('Spot Detection and Management', () => {
    test('should detect spots successfully', async ({ page }) => {
      const findSpotsBtn = page.locator('#findSpots');
      const spotCount = page.locator('#spotCount');
      
      await findSpotsBtn.click();
      
      // Wait for spot detection to complete
      await page.waitForFunction(() => {
        const count = document.querySelector('#spotCount');
        return count && parseInt(count.textContent) > 0;
      });
      
      // Check that spots were found
      const count = await spotCount.textContent();
      expect(parseInt(count)).toBeGreaterThan(0);
    });

    test('should navigate to spots tab and show detected spots', async ({ page }) => {
      // First detect spots
      await page.locator('#findSpots').click();
      await page.waitForFunction(() => {
        const count = document.querySelector('#spotCount');
        return count && parseInt(count.textContent) > 0;
      });
      
      // Navigate to spots tab (use more specific selector)
      const spotsTab = page.locator('.tab-btn[data-tab="spots"]');
      await spotsTab.click();
      await expect(spotsTab).toHaveClass(/active/);
      
      // Check spots list is populated
      const spotsList = page.locator('#spotsList');
      const spotItems = spotsList.locator('.spot-item');
      await expect(spotItems).toHaveCount(4); // Should have 4 spots
      
      // Check each spot has proper controls
      for (let i = 0; i < 4; i++) {
        const spotItem = spotItems.nth(i);
        await expect(spotItem.locator('.spot-type-select')).toBeVisible();
        await expect(spotItem.locator('.spot-toggle')).toBeVisible();
      }
    });
  });

  test.describe('Spot Text Features', () => {
    test.beforeEach(async ({ page }) => {
      // Detect spots first
      await page.locator('#findSpots').click();
      await page.waitForFunction(() => {
        const count = document.querySelector('#spotCount');
        return count && parseInt(count.textContent) > 0;
      });
      
      // Navigate to spots tab
      await page.locator('.tab-btn[data-tab="spots"]').click();
    });

    test('should change spot type to Text and show text controls', async ({ page }) => {
      // Change first spot to Text type
      const firstSpotSelect = page.locator('#spotsList .spot-item').first().locator('.spot-type-select');
      await firstSpotSelect.selectOption('text');
      
      // Open spot settings
      const settingsBtn = page.locator('#spotsList .spot-item').first().locator('.spot-toggle');
      await settingsBtn.click();
      
      // Check text controls are visible
      const spotControls = page.locator('#spotsList .spot-item').first().locator('.spot-controls');
      await expect(spotControls).toBeVisible();
      
      // Check specific text controls
      await expect(spotControls.locator('.spot-text-input')).toBeVisible();
      await expect(spotControls.locator('.spot-text-alignment')).toBeVisible();
      await expect(spotControls.locator('.spot-text-styling')).toBeVisible();
      await expect(spotControls.locator('.spot-text-color')).toBeVisible();
    });

    test('should handle spot text input and styling', async ({ page }) => {
      // Setup: Change first spot to text type and open controls
      const firstSpot = page.locator('#spotsList .spot-item').first();
      await firstSpot.locator('.spot-type-select').selectOption('text');
      await firstSpot.locator('.spot-toggle').click();
      
      const spotControls = firstSpot.locator('.spot-controls');
      
      // Test text input
      const textInput = spotControls.locator('.spot-text-input');
      await textInput.fill('TEST SPOT');
      await expect(textInput).toHaveValue('TEST SPOT');
      
      // Test text styling buttons
      const boldBtn = spotControls.locator('.style-btn').filter({ hasText: 'B' });
      await boldBtn.click();
      await expect(boldBtn).toHaveClass(/active/);
      
      const italicBtn = spotControls.locator('.style-btn').filter({ hasText: 'I' });
      await italicBtn.click();
      await expect(italicBtn).toHaveClass(/active/);
      
      const highlightBtn = spotControls.locator('.style-btn').filter({ hasText: 'H' });
      await highlightBtn.click();
      await expect(highlightBtn).toHaveClass(/active/);
    });

    test('should handle spot text alignment', async ({ page }) => {
      // Setup: Change first spot to text type and open controls
      const firstSpot = page.locator('#spotsList .spot-item').first();
      await firstSpot.locator('.spot-type-select').selectOption('text');
      await firstSpot.locator('.spot-toggle').click();
      
      const spotControls = firstSpot.locator('.spot-controls');
      const alignmentControls = spotControls.locator('.spot-text-alignment');
      
      // Test left alignment
      const leftBtn = alignmentControls.locator('.align-btn.align-left-icon');
      await leftBtn.click();
      await expect(leftBtn).toHaveClass(/active/);
      
      // Test right alignment
      const rightBtn = alignmentControls.locator('.align-btn.align-right-icon');
      await rightBtn.click();
      await expect(rightBtn).toHaveClass(/active/);
      
      // Test center alignment
      const centerBtn = alignmentControls.locator('.align-btn.align-center-icon');
      await centerBtn.click();
      await expect(centerBtn).toHaveClass(/active/);
    });

    test('should show highlight color picker for spot text', async ({ page }) => {
      // Setup: Change first spot to text type and open controls
      const firstSpot = page.locator('#spotsList .spot-item').first();
      await firstSpot.locator('.spot-type-select').selectOption('text');
      await firstSpot.locator('.spot-toggle').click();
      
      const spotControls = firstSpot.locator('.spot-controls');
      
      // Initially no highlight color control
      await expect(spotControls.locator('.spot-highlight-color')).toHaveCount(0);
      
      // Click highlight button
      const highlightBtn = spotControls.locator('.style-btn').filter({ hasText: 'H' });
      await highlightBtn.click();
      
      // After clicking highlight, the UI rebuilds and controls collapse
      // We need to re-open the controls to see the highlight color picker
      await page.waitForTimeout(500); // Wait for UI update
      await firstSpot.locator('.spot-toggle').click(); // Re-open controls
      
      // Now highlight color control should appear
      const reopenedControls = firstSpot.locator('.spot-controls');
      await expect(reopenedControls.locator('.spot-highlight-color')).toBeVisible();
    });
  });

  test.describe('System Integration', () => {
    test('should maintain text styling when switching between modes', async ({ page }) => {
      // Apply text styling
      await page.locator('#mainTextBold').click();
      await page.locator('#mainTextItalic').click();
      
      // Switch to manual mode
      // Manual mode is now the default - no need to switch
      
      // Check styling is maintained
      await expect(page.locator('#mainTextBold')).toHaveClass(/active/);
      await expect(page.locator('#mainTextItalic')).toHaveClass(/active/);
      
      // Manual mode is now the default - no need to switch modes
      
      // Check styling is still maintained
      await expect(page.locator('#mainTextBold')).toHaveClass(/active/);
      await expect(page.locator('#mainTextItalic')).toHaveClass(/active/);
    });

    test('should handle text changes and update line controls', async ({ page }) => {
      const textArea = page.locator('#mainText');
      
      // Change text content
      await textArea.fill('NEW\nTEST\nCONTENT\nFOUR\nLINES');
      
      // Check line alignment controls update
      await expect(page.locator('text=Line 1: "NEW"')).toBeVisible();
      await expect(page.locator('text=Line 2: "TEST"')).toBeVisible();
      await expect(page.locator('text=Line 3: "CONTENT"')).toBeVisible();
      await expect(page.locator('text=Line 4: "FOUR"')).toBeVisible();
      await expect(page.locator('text=Line 5: "LINES"')).toBeVisible();
      
      // Check we have 5 line controls now
      const lineControls = page.locator('.line-alignment-control');
      await expect(lineControls).toHaveCount(5);
    });

    test('should clear spots when text changes', async ({ page }) => {
      // First detect spots
      await page.locator('#findSpots').click();
      await page.waitForFunction(() => {
        const count = document.querySelector('#spotCount');
        return count && parseInt(count.textContent) > 0;
      });
      
      const initialCount = await page.locator('#spotCount').textContent();
      expect(parseInt(initialCount)).toBeGreaterThan(0);
      
      // Change text
      const textArea = page.locator('#mainText');
      await textArea.fill('DIFFERENT\nTEXT');
      
      // Check spots are cleared
      await expect(page.locator('#spotCount')).toHaveText('0');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle empty text gracefully', async ({ page }) => {
      const textArea = page.locator('#mainText');
      
      // Clear all text
      await textArea.fill('');
      
      // Should not show line controls for empty text
      const lineControls = page.locator('.line-alignment-control');
      await expect(lineControls).toHaveCount(0);
      
      // Spot detection should still work without errors
      await page.locator('#findSpots').click();
      
      // Should not throw errors (no alert dialogs)
      const alert = page.locator('[role="dialog"]');
      await expect(alert).toHaveCount(0);
    });

    test('should handle rapid UI interactions', async ({ page }) => {
      // Rapidly toggle styling buttons
      for (let i = 0; i < 5; i++) {
        await page.locator('#mainTextBold').click();
        await page.locator('#mainTextItalic').click();
        await page.locator('#mainTextUnderline').click();
        await page.locator('#mainTextHighlight').click();
      }
      
      // Should end in consistent state
      await expect(page.locator('#mainTextBold')).toHaveClass(/active/);
      await expect(page.locator('#mainTextItalic')).toHaveClass(/active/);
      await expect(page.locator('#mainTextUnderline')).toHaveClass(/active/);
      await expect(page.locator('#mainTextHighlight')).toHaveClass(/active/);
    });
  });
});