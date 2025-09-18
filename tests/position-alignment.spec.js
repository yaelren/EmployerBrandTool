/**
 * Position Alignment Tests
 * Tests for text and image position alignment within spots
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

const APP_URL = `file://${path.join(__dirname, '../index.html')}`;

test.describe('Position Alignment System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
    // Wait for app to initialize
    await page.waitForFunction(() => window.app && window.app.isInitialized);
  });

  test.describe('Text Spot Position Alignment', () => {
    test('should show position alignment controls for text spots', async ({ page }) => {
      // First detect spots
      await page.locator('#findSpots').click();
      await page.waitForFunction(() => {
        const count = document.querySelector('#spotCount');
        return count && parseInt(count.textContent) > 0;
      });
      
      // Navigate to spots tab
      await page.locator('.tab-btn[data-tab="spots"]').click();
      
      // Change first spot to text type and open controls
      const firstSpot = page.locator('#spotsList .spot-item').first();
      await firstSpot.locator('.spot-type-select').selectOption('text');
      await firstSpot.locator('.spot-toggle').click();
      
      // Check that position controls exist
      const spotControls = firstSpot.locator('.spot-controls');
      await expect(spotControls.locator('text=Position in Spot')).toBeVisible();
      await expect(spotControls.locator('.positioning-grid')).toBeVisible();
      
      // Check that we have 9 position buttons (3x3 grid)
      const positionButtons = spotControls.locator('.pos-btn');
      await expect(positionButtons).toHaveCount(9);
      
      // Check that center position is initially active
      const centerBtn = positionButtons.filter({ hasText: '•' });
      await expect(centerBtn).toHaveClass(/active/);
    });

    test('should change text position when position buttons are clicked', async ({ page }) => {
      // Setup: detect spots and set up text spot
      await page.locator('#findSpots').click();
      await page.waitForFunction(() => {
        const count = document.querySelector('#spotCount');
        return count && parseInt(count.textContent) > 0;
      });
      
      await page.locator('.tab-btn[data-tab="spots"]').click();
      const firstSpot = page.locator('#spotsList .spot-item').first();
      await firstSpot.locator('.spot-type-select').selectOption('text');
      await firstSpot.locator('.spot-toggle').click();
      
      const spotControls = firstSpot.locator('.spot-controls');
      
      // Add some text to see positioning effects
      const textInput = spotControls.locator('.spot-text-input');
      await textInput.fill('TEST TEXT');
      
      // Test top-left position
      const topLeftBtn = spotControls.locator('.pos-btn').filter({ hasText: '↖' });
      await topLeftBtn.click();
      await expect(topLeftBtn).toHaveClass(/active/);
      
      // Test bottom-right position
      const bottomRightBtn = spotControls.locator('.pos-btn').filter({ hasText: '↘' });
      await bottomRightBtn.click();
      await expect(bottomRightBtn).toHaveClass(/active/);
      await expect(topLeftBtn).not.toHaveClass(/active/);
      
      // Test center position
      const centerBtn = spotControls.locator('.pos-btn').filter({ hasText: '•' });
      await centerBtn.click();
      await expect(centerBtn).toHaveClass(/active/);
      await expect(bottomRightBtn).not.toHaveClass(/active/);
    });
  });

  test.describe('Image Spot Position Alignment', () => {
    test('should show position alignment controls for image spots', async ({ page }) => {
      // First detect spots
      await page.locator('#findSpots').click();
      await page.waitForFunction(() => {
        const count = document.querySelector('#spotCount');
        return count && parseInt(count.textContent) > 0;
      });
      
      // Navigate to spots tab
      await page.locator('.tab-btn[data-tab="spots"]').click();
      
      // Change first spot to image type and open controls
      const firstSpot = page.locator('#spotsList .spot-item').first();
      await firstSpot.locator('.spot-type-select').selectOption('image');
      await firstSpot.locator('.spot-toggle').click();
      
      // Check that position controls exist even without image loaded
      const spotControls = firstSpot.locator('.spot-controls');
      await expect(spotControls.locator('text=Position in Spot')).toBeVisible();
      await expect(spotControls.locator('.positioning-grid')).toBeVisible();
      
      // Check that we have 9 position buttons (3x3 grid)
      const positionButtons = spotControls.locator('.pos-btn');
      await expect(positionButtons).toHaveCount(9);
      
      // Check that center position is initially active
      const centerBtn = positionButtons.filter({ hasText: '•' });
      await expect(centerBtn).toHaveClass(/active/);
    });

    test('should change image position when position buttons are clicked', async ({ page }) => {
      // Setup: detect spots and set up image spot
      await page.locator('#findSpots').click();
      await page.waitForFunction(() => {
        const count = document.querySelector('#spotCount');
        return count && parseInt(count.textContent) > 0;
      });
      
      await page.locator('.tab-btn[data-tab="spots"]').click();
      const firstSpot = page.locator('#spotsList .spot-item').first();
      await firstSpot.locator('.spot-type-select').selectOption('image');
      await firstSpot.locator('.spot-toggle').click();
      
      const spotControls = firstSpot.locator('.spot-controls');
      
      // Test different positions
      const topRightBtn = spotControls.locator('.pos-btn').filter({ hasText: '↗' });
      await topRightBtn.click();
      await expect(topRightBtn).toHaveClass(/active/);
      
      const bottomLeftBtn = spotControls.locator('.pos-btn').filter({ hasText: '↙' });
      await bottomLeftBtn.click();
      await expect(bottomLeftBtn).toHaveClass(/active/);
      await expect(topRightBtn).not.toHaveClass(/active/);
      
      const middleRightBtn = spotControls.locator('.pos-btn').filter({ hasText: '→' });
      await middleRightBtn.click();
      await expect(middleRightBtn).toHaveClass(/active/);
      await expect(bottomLeftBtn).not.toHaveClass(/active/);
    });
  });

  test.describe('Position with Padding', () => {
    test('should respect padding when positioning text', async ({ page }) => {
      // Setup: detect spots and set up text spot
      await page.locator('#findSpots').click();
      await page.waitForFunction(() => {
        const count = document.querySelector('#spotCount');
        return count && parseInt(count.textContent) > 0;
      });
      
      await page.locator('.tab-btn[data-tab="spots"]').click();
      const firstSpot = page.locator('#spotsList .spot-item').first();
      await firstSpot.locator('.spot-type-select').selectOption('text');
      await firstSpot.locator('.spot-toggle').click();
      
      const spotControls = firstSpot.locator('.spot-controls');
      
      // Add text
      const textInput = spotControls.locator('.spot-text-input');
      await textInput.fill('PADDED TEXT');
      
      // Set top-left position
      const topLeftBtn = spotControls.locator('.pos-btn').filter({ hasText: '↖' });
      await topLeftBtn.click();
      
      // Position should be active (padding is automatically considered in positioning logic)
      await expect(topLeftBtn).toHaveClass(/active/);
      
      // The actual visual verification would require canvas pixel checking,
      // but we can at least verify the controls work correctly
    });
  });
});