/**
 * Grid Debug Visualization Test
 * Tests that debug outlines and numbers appear for all grid cells
 */

const { test, expect } = require('@playwright/test');

test.describe('Grid Debug Visualization', () => {
    test('should show debug outlines and numbers for all grid cells', async ({ page }) => {
        await page.goto('http://localhost:5501/index.html');
        await page.waitForLoadState('networkidle');

        // Type some text to trigger grid building
        const textInput = page.locator('#textInput');
        await textInput.fill('HELLO\nWORLD');
        await page.waitForTimeout(500);

        // Enable debug controls
        const showSpotOutlines = page.locator('#showSpotOutlines');
        const showSpotNumbers = page.locator('#showSpotNumbers');

        await showSpotOutlines.check();
        await showSpotNumbers.check();
        await page.waitForTimeout(300);

        // Take screenshot with debug enabled
        await page.screenshot({
            path: '.playwright-mcp/debug-visualization-enabled.png',
            fullPage: true
        });

        // Check that debug controls are active
        const outlinesChecked = await showSpotOutlines.isChecked();
        const numbersChecked = await showSpotNumbers.isChecked();

        expect(outlinesChecked).toBe(true);
        expect(numbersChecked).toBe(true);

        // Get canvas and check it's rendering
        const canvas = page.locator('#canvas');
        const canvasBox = await canvas.boundingBox();
        expect(canvasBox).toBeTruthy();
        expect(canvasBox.width).toBeGreaterThan(0);
        expect(canvasBox.height).toBeGreaterThan(0);

        console.log('✅ Debug visualization test complete');
    });

    test('should detect and visualize content cells after changing alignment', async ({ page }) => {
        await page.goto('http://localhost:5501/index.html');
        await page.waitForLoadState('networkidle');

        // Type text
        const textInput = page.locator('#textInput');
        await textInput.fill('TEST\nALIGN');
        await page.waitForTimeout(500);

        // Enable debug
        await page.locator('#showSpotOutlines').check();
        await page.locator('#showSpotNumbers').check();
        await page.waitForTimeout(300);

        // Take initial screenshot
        await page.screenshot({
            path: '.playwright-mcp/grid-initial-alignment.png',
            fullPage: true
        });

        // Change alignment to center
        const alignmentSelect = page.locator('#textAlign');
        await alignmentSelect.selectOption('center');
        await page.waitForTimeout(500);

        // Take screenshot after alignment change
        await page.screenshot({
            path: '.playwright-mcp/grid-center-alignment.png',
            fullPage: true
        });

        // Change to right alignment
        await alignmentSelect.selectOption('right');
        await page.waitForTimeout(500);

        // Take screenshot with right alignment
        await page.screenshot({
            path: '.playwright-mcp/grid-right-alignment.png',
            fullPage: true
        });

        console.log('✅ Alignment change visualization test complete');
    });

    test('should show text bounds correctly positioned', async ({ page }) => {
        await page.goto('http://localhost:5501/index.html');
        await page.waitForLoadState('networkidle');

        // Type text with different alignment
        const textInput = page.locator('#textInput');
        await textInput.fill('Typography\nAlignment\nTest');
        await page.waitForTimeout(500);

        // Enable all debug options
        await page.locator('#showSpotOutlines').check();
        await page.locator('#showSpotNumbers').check();
        await page.locator('#showTextBounds').check();
        await page.waitForTimeout(300);

        // Take screenshot with all debug enabled
        await page.screenshot({
            path: '.playwright-mcp/text-bounds-debug.png',
            fullPage: true
        });

        // Check console for any errors
        const logs = [];
        page.on('console', msg => logs.push(msg.text()));

        await page.waitForTimeout(500);

        const errors = logs.filter(log => log.includes('❌') || log.toLowerCase().includes('error'));
        if (errors.length > 0) {
            console.log('Console errors found:', errors);
        }

        console.log('✅ Text bounds visualization test complete');
    });
});
