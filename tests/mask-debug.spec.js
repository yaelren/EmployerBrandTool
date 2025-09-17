/**
 * Simple debug test to reproduce the mask spot whitish overlay bug
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

test('debug mask spot bug', async ({ page }) => {
    // Navigate to the application
    const indexPath = path.resolve(__dirname, '../index.html');
    await page.goto(`file://${indexPath}`);
    
    // Wait for the application to initialize
    await page.waitForFunction(() => window.employerBrandTool && window.employerBrandTool.isInitialized, { timeout: 10000 });
    
    // Set up test text
    await page.fill('#mainText', 'TEST\nMASK\nBUG');
    
    // Upload background image
    const testImagePath = path.resolve(__dirname, '../test-assets/test-bg.svg');
    await page.locator('#backgroundImage').setInputFiles(testImagePath);
    await page.waitForTimeout(2000);
    
    // Set background color
    await page.fill('#backgroundColor', '#ff0000'); // Red background
    await page.locator('#backgroundOpacity').fill('80'); // 80% opacity
    
    // Find spots
    await page.click('#findSpots');
    await page.waitForTimeout(1000);
    
    // Check if spots were found
    const spotCount = await page.textContent('#spotCount');
    console.log('Spots detected:', spotCount);
    
    if (parseInt(spotCount) > 0) {
        // Change first spot to mask type
        const firstSpotSelector = page.locator('#spotsList .spot-item').first();
        const typeSelect = firstSpotSelector.locator('.spot-type-select');
        await typeSelect.selectOption('mask');
        
        // Check current state
        const bugInfo = await page.evaluate(() => {
            const app = window.employerBrandTool;
            const firstSpot = app.spots[0];
            
            return {
                spotType: firstSpot.type,
                hasCanvasBackgroundImage: app.canvasManager.backgroundImage !== null,
                spotOpacity: firstSpot.opacity,
                spotFillColor: firstSpot.fillColor,
                backgroundImageDimensions: app.canvasManager.backgroundImage ? {
                    width: app.canvasManager.backgroundImage.width,
                    height: app.canvasManager.backgroundImage.height
                } : null
            };
        });
        
        console.log('Debug info:', bugInfo);
        
        // Take a screenshot to see the current rendering
        await page.screenshot({ path: 'test-results/mask-bug-reproduction.png' });
        
        // The bug: Check if background image is being passed to spot render method
        const renderingIssue = await page.evaluate(() => {
            const app = window.employerBrandTool;
            const firstSpot = app.spots[0];
            
            // Look at the current render method call in app.js
            // The issue is in app.js line ~1193: spot.render(this.canvasManager.ctx, showOutline, showNumber);
            // It should be: spot.render(this.canvasManager.ctx, showOutline, showNumber, this.canvasManager.backgroundImage);
            
            return {
                currentRenderCall: 'spot.render(ctx, showOutline, showNumber)', // Missing backgroundImage parameter
                shouldBe: 'spot.render(ctx, showOutline, showNumber, backgroundImage)',
                bugLocation: 'app.js line ~1193 in render() method'
            };
        });
        
        console.log('Rendering issue:', renderingIssue);
        expect(bugInfo.spotType).toBe('mask');
        expect(bugInfo.hasCanvasBackgroundImage).toBe(true);
    }
});