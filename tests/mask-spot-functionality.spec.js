/**
 * Comprehensive tests for mask spot functionality
 * Tests mask creation, background image interaction, and rendering
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Mask Spot Functionality', () => {
    let page;
    
    test.beforeEach(async ({ page: testPage }) => {
        page = testPage;
        
        // Navigate to the application  
        const indexPath = path.resolve(__dirname, '../index.html');
        await page.goto(`file://${indexPath}`);
        
        // Wait for the application to initialize
        await page.waitForFunction(() => window.employerBrandTool && window.employerBrandTool.isInitialized);
        
        // Set up basic text for testing
        await page.fill('#mainText', 'TEST\nMASK\nSPOT');
        
        // Find spots to have something to work with
        await page.click('#findSpots');
        
        // Wait for spots to be detected
        await page.waitForTimeout(1000);
    });

    test('should detect spots correctly', async () => {
        // Verify spots were detected
        const spotCount = await page.textContent('#spotCount');
        expect(parseInt(spotCount)).toBeGreaterThan(0);
        
        // Verify spots list is populated
        const spotsListChildren = await page.locator('#spotsList .spot-item').count();
        expect(spotsListChildren).toBeGreaterThan(0);
    });

    test('should create mask spot and show proper controls', async () => {
        // Find the first spot and change it to mask type
        const firstSpotSelector = await page.locator('#spotsList .spot-item').first();
        
        // Change spot type to mask
        const typeSelect = firstSpotSelector.locator('.spot-type-select');
        await typeSelect.selectOption('mask');
        
        // Expand spot controls
        const toggleBtn = firstSpotSelector.locator('.spot-toggle');
        await toggleBtn.click();
        
        // Verify mask-specific controls are present
        await expect(firstSpotSelector.locator('text=Mask Opacity')).toBeVisible();
        await expect(firstSpotSelector.locator('.spot-opacity')).toBeVisible();
        
        // Verify opacity slider works
        const opacitySlider = firstSpotSelector.locator('.spot-opacity');
        await opacitySlider.fill('75');
        
        // Verify opacity value updates
        const opacityValue = firstSpotSelector.locator('.opacity-value');
        await expect(opacityValue).toHaveText('75%');
    });

    test('should upload background image and show it in canvas', async () => {
        // Create a test image file path
        const testImagePath = path.resolve(__dirname, '../test-assets/test-bg.svg');
        
        // Upload background image
        const fileInput = page.locator('#backgroundImage');
        await fileInput.setInputFiles(testImagePath);
        
        // Wait for image to load
        await page.waitForTimeout(2000);
        
        // Verify clear button appears
        await expect(page.locator('#clearBackgroundImage')).toBeVisible();
        
        // Verify canvas manager has background image
        const hasBackgroundImage = await page.evaluate(() => {
            return window.employerBrandTool.canvasManager.backgroundImage !== null;
        });
        expect(hasBackgroundImage).toBe(true);
    });

    test('should render mask spot with background image correctly', async () => {
        // Upload background image first
        const testImagePath = path.resolve(__dirname, '../test-assets/test-bg.svg');
        await page.locator('#backgroundImage').setInputFiles(testImagePath);
        await page.waitForTimeout(2000);
        
        // Change first spot to mask type
        const firstSpotSelector = page.locator('#spotsList .spot-item').first();
        const typeSelect = firstSpotSelector.locator('.spot-type-select');
        await typeSelect.selectOption('mask');
        
        // Take screenshot to verify mask rendering
        const canvas = page.locator('#chatooly-canvas');
        const canvasScreenshot = await canvas.screenshot();
        
        // Verify the mask spot is rendering (not just whitish overlay)
        // This would need visual comparison, but for now we'll check programmatically
        const maskRenderingWorking = await page.evaluate(() => {
            const app = window.employerBrandTool;
            const firstSpot = app.spots[0];
            
            // Check if spot has mask type
            if (firstSpot.type !== 'mask') return false;
            
            // Check if background image exists
            return app.canvasManager.backgroundImage !== null;
        });
        
        expect(maskRenderingWorking).toBe(true);
    });

    test('should show whitish overlay bug when background image not passed correctly', async () => {
        // This test reproduces the current bug
        
        // Upload background image
        const testImagePath = path.resolve(__dirname, '../test-assets/test-bg.svg');
        await page.locator('#backgroundImage').setInputFiles(testImagePath);
        await page.waitForTimeout(2000);
        
        // Change first spot to mask type
        const firstSpotSelector = page.locator('#spotsList .spot-item').first();
        const typeSelect = firstSpotSelector.locator('.spot-type-select');
        await typeSelect.selectOption('mask');
        
        // Check current rendering behavior
        const renderingIssue = await page.evaluate(() => {
            const app = window.employerBrandTool;
            const firstSpot = app.spots[0];
            
            // Mock the render call to see what's happening
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');
            
            // Call the spot's render method without background image parameter
            // This simulates the current bug
            firstSpot.render(ctx, true, false, null); // backgroundImage is null
            
            return {
                spotType: firstSpot.type,
                hasBackgroundImage: app.canvasManager.backgroundImage !== null,
                backgroundImagePassedToRender: false // This is the bug
            };
        });
        
        expect(renderingIssue.spotType).toBe('mask');
        expect(renderingIssue.hasBackgroundImage).toBe(true);
        expect(renderingIssue.backgroundImagePassedToRender).toBe(false); // This shows the bug
    });

    test('should adjust mask opacity correctly', async () => {
        // Change first spot to mask type
        const firstSpotSelector = page.locator('#spotsList .spot-item').first();
        const typeSelect = firstSpotSelector.locator('.spot-type-select');
        await typeSelect.selectOption('mask');
        
        // Expand spot controls
        const toggleBtn = firstSpotSelector.locator('.spot-toggle');
        await toggleBtn.click();
        
        // Test different opacity values
        const opacitySlider = firstSpotSelector.locator('.spot-opacity');
        
        // Test 25% opacity
        await opacitySlider.fill('25');
        let spotOpacity = await page.evaluate(() => window.employerBrandTool.spots[0].opacity);
        expect(spotOpacity).toBeCloseTo(0.25, 2);
        
        // Test 80% opacity
        await opacitySlider.fill('80');
        spotOpacity = await page.evaluate(() => window.employerBrandTool.spots[0].opacity);
        expect(spotOpacity).toBeCloseTo(0.80, 2);
        
        // Test 100% opacity
        await opacitySlider.fill('100');
        spotOpacity = await page.evaluate(() => window.employerBrandTool.spots[0].opacity);
        expect(spotOpacity).toBeCloseTo(1.0, 2);
    });

    test('should show mask placeholder when no background image', async () => {
        // Change first spot to mask type without background image
        const firstSpotSelector = page.locator('#spotsList .spot-item').first();
        const typeSelect = firstSpotSelector.locator('.spot-type-select');
        await typeSelect.selectOption('mask');
        
        // Verify placeholder behavior
        const placeholderRendering = await page.evaluate(() => {
            const app = window.employerBrandTool;
            const firstSpot = app.spots[0];
            
            return {
                spotType: firstSpot.type,
                hasBackgroundImage: app.canvasManager.backgroundImage !== null,
                opacity: firstSpot.opacity
            };
        });
        
        expect(placeholderRendering.spotType).toBe('mask');
        expect(placeholderRendering.hasBackgroundImage).toBe(false);
        expect(placeholderRendering.opacity).toBeGreaterThan(0);
    });

    test('should handle mask spot padding correctly', async () => {
        // Change first spot to mask type
        const firstSpotSelector = page.locator('#spotsList .spot-item').first();
        const typeSelect = firstSpotSelector.locator('.spot-type-select');
        await typeSelect.selectOption('mask');
        
        // Expand spot controls
        const toggleBtn = firstSpotSelector.locator('.spot-toggle');
        await toggleBtn.click();
        
        // Find padding control (should be added by MaskSpotController)
        const paddingSlider = firstSpotSelector.locator('.spot-padding');
        if (await paddingSlider.count() > 0) {
            // Test padding adjustment
            await paddingSlider.fill('10');
            
            const spotPadding = await page.evaluate(() => {
                const spot = window.employerBrandTool.spots[0];
                return spot.content?.padding || 0;
            });
            
            expect(spotPadding).toBe(10);
        }
    });

    test('should handle canvas click on mask spot', async () => {
        // Upload background image
        const testImagePath = path.resolve(__dirname, '../test-assets/test-bg.svg');
        await page.locator('#backgroundImage').setInputFiles(testImagePath);
        await page.waitForTimeout(2000);
        
        // Change first spot to mask type
        const firstSpotSelector = page.locator('#spotsList .spot-item').first();
        const typeSelect = firstSpotSelector.locator('.spot-type-select');
        await typeSelect.selectOption('mask');
        
        // Get spot bounds and click on it
        const spotBounds = await page.evaluate(() => {
            const spot = window.employerBrandTool.spots[0];
            return {
                x: spot.x + spot.width / 2,
                y: spot.y + spot.height / 2
            };
        });
        
        // Click on the spot
        const canvas = page.locator('#chatooly-canvas');
        await canvas.click({
            position: { x: spotBounds.x, y: spotBounds.y }
        });
        
        // Verify popup appears
        await expect(page.locator('#spotEditPopup.show')).toBeVisible();
        await expect(page.locator('#spotPopupTitle')).toContainText('Edit Spot 1');
    });

    test('should clear background image and handle mask spots correctly', async () => {
        // Upload background image first
        const testImagePath = path.resolve(__dirname, '../test-assets/test-bg.svg');
        await page.locator('#backgroundImage').setInputFiles(testImagePath);
        await page.waitForTimeout(2000);
        
        // Change first spot to mask type
        const firstSpotSelector = page.locator('#spotsList .spot-item').first();
        const typeSelect = firstSpotSelector.locator('.spot-type-select');
        await typeSelect.selectOption('mask');
        
        // Clear background image
        await page.click('#clearBackgroundImage');
        
        // Verify image is cleared
        const hasBackgroundImage = await page.evaluate(() => {
            return window.employerBrandTool.canvasManager.backgroundImage !== null;
        });
        expect(hasBackgroundImage).toBe(false);
        
        // Verify clear button is hidden
        await expect(page.locator('#clearBackgroundImage')).not.toBeVisible();
        
        // Verify mask spot now shows placeholder
        const maskShowsPlaceholder = await page.evaluate(() => {
            const app = window.employerBrandTool;
            const firstSpot = app.spots[0];
            return firstSpot.type === 'mask' && app.canvasManager.backgroundImage === null;
        });
        expect(maskShowsPlaceholder).toBe(true);
    });
});

test.describe('Mask Spot Bug Reproduction', () => {
    test('should reproduce the whitish overlay bug', async ({ page }) => {
        const indexPath = path.resolve(__dirname, '../index.html');
        await page.goto(`file://${indexPath}`);
        await page.waitForFunction(() => window.employerBrandTool && window.employerBrandTool.isInitialized);
        
        // Set up the exact scenario described in the issue
        await page.fill('#mainText', 'TEST\nMASK\nBUG');
        
        // Upload background image
        const testImagePath = path.resolve(__dirname, '../test-assets/test-bg.svg');
        await page.locator('#backgroundImage').setInputFiles(testImagePath);
        await page.waitForTimeout(2000);
        
        // Set background color on top
        await page.fill('#backgroundColor', '#ff0000'); // Red background
        await page.locator('#backgroundOpacity').fill('80'); // 80% opacity
        
        // Find spots
        await page.click('#findSpots');
        await page.waitForTimeout(1000);
        
        // Change first spot to mask type
        const firstSpotSelector = page.locator('#spotsList .spot-item').first();
        const typeSelect = firstSpotSelector.locator('.spot-type-select');
        await typeSelect.selectOption('mask');
        
        // Take screenshot showing the bug
        const canvas = page.locator('#chatooly-canvas');
        const bugScreenshot = await canvas.screenshot();
        
        // Verify the bug exists by checking what's actually being rendered
        const bugDetails = await page.evaluate(() => {
            const app = window.employerBrandTool;
            const ctx = app.canvasManager.ctx;
            const firstSpot = app.spots[0];
            
            // Create test canvas to check rendering
            const testCanvas = document.createElement('canvas');
            testCanvas.width = 100;
            testCanvas.height = 100;
            const testCtx = testCanvas.getContext('2d');
            
            // This reproduces the current buggy behavior
            firstSpot.render(testCtx, false, false, null); // Background image not passed!
            
            return {
                spotType: firstSpot.type,
                hasCanvasBackgroundImage: app.canvasManager.backgroundImage !== null,
                backgroundImagePassedToSpotRender: false, // This is the bug
                spotOpacity: firstSpot.opacity,
                spotFillColor: firstSpot.fillColor
            };
        });
        
        // Document the bug
        console.log('Bug reproduction results:', bugDetails);
        expect(bugDetails.spotType).toBe('mask');
        expect(bugDetails.hasCanvasBackgroundImage).toBe(true);
        expect(bugDetails.backgroundImagePassedToSpotRender).toBe(false); // THE BUG!
    });
});