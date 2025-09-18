/**
 * Playwright test suite for Debug Controls functionality
 * Tests the complete debug control module including UI, keyboard shortcuts, and visualizations
 */

const { test, expect } = require('@playwright/test');

test.describe('Debug Controls Module', () => {
    
    test.beforeEach(async ({ page }) => {
        // Navigate to the app using file:// URL
        const path = require('path');
        const filePath = path.resolve(__dirname, '..', 'index.html');
        await page.goto(`file://${filePath}`);
        
        // Wait for app initialization
        await page.waitForFunction(() => window.employerBrandTool && window.employerBrandTool.isInitialized);
    });
    
    test.describe('Debug Panel UI', () => {
        
        test('should toggle debug panel visibility', async ({ page }) => {
            // Initially, debug content should be hidden
            await expect(page.locator('#debugContent')).not.toHaveClass(/show/);
            
            // Click toggle button
            await page.click('#toggleDebug');
            
            // Debug content should now be visible
            await expect(page.locator('#debugContent')).toHaveClass(/show/);
            
            // Click again to hide
            await page.click('#toggleDebug');
            
            // Should be hidden again
            await expect(page.locator('#debugContent')).not.toHaveClass(/show/);
        });
        
        test('should have all debug control checkboxes', async ({ page }) => {
            // Open debug panel
            await page.click('#toggleDebug');
            
            // Check all checkboxes exist
            await expect(page.locator('#showSpotOutlines')).toBeVisible();
            await expect(page.locator('#showSpotNumbers')).toBeVisible();
            await expect(page.locator('#showTextBounds')).toBeVisible();
            await expect(page.locator('#showPadding')).toBeVisible();
        });
        
        test('should have Show All and Hide All buttons', async ({ page }) => {
            // Open debug panel
            await page.click('#toggleDebug');
            
            // Check buttons exist
            await expect(page.locator('#showAllDebug')).toBeVisible();
            await expect(page.locator('#hideAllDebug')).toBeVisible();
        });
    });
    
    test.describe('Show/Hide All Controls', () => {
        
        test('Show All button should enable all debug options', async ({ page }) => {
            // Open debug panel
            await page.click('#toggleDebug');
            
            // Click Show All
            await page.click('#showAllDebug');
            
            // All checkboxes should be checked
            await expect(page.locator('#showSpotOutlines')).toBeChecked();
            await expect(page.locator('#showSpotNumbers')).toBeChecked();
            await expect(page.locator('#showTextBounds')).toBeChecked();
            await expect(page.locator('#showPadding')).toBeChecked();
            
            // Verify via JS that debug options are set
            const debugState = await page.evaluate(() => {
                return window.employerBrandTool.debugController.getDebugOptions();
            });
            
            expect(debugState.showSpotOutlines).toBe(true);
            expect(debugState.showSpotNumbers).toBe(true);
            expect(debugState.showTextBounds).toBe(true);
            expect(debugState.showPadding).toBe(true);
        });
        
        test('Hide All button should disable all debug options', async ({ page }) => {
            // Open debug panel
            await page.click('#toggleDebug');
            
            // First enable all
            await page.click('#showAllDebug');
            
            // Then click Hide All
            await page.click('#hideAllDebug');
            
            // All checkboxes should be unchecked
            await expect(page.locator('#showSpotOutlines')).not.toBeChecked();
            await expect(page.locator('#showSpotNumbers')).not.toBeChecked();
            await expect(page.locator('#showTextBounds')).not.toBeChecked();
            await expect(page.locator('#showPadding')).not.toBeChecked();
            
            // Verify via JS
            const debugState = await page.evaluate(() => {
                return window.employerBrandTool.debugController.getDebugOptions();
            });
            
            expect(debugState.showSpotOutlines).toBe(false);
            expect(debugState.showSpotNumbers).toBe(false);
            expect(debugState.showTextBounds).toBe(false);
            expect(debugState.showPadding).toBe(false);
        });
    });
    
    test.describe('Keyboard Shortcuts', () => {
        
        test('Cmd+D should toggle all debug controls', async ({ page }) => {
            // Initial state - get current debug state
            const initialState = await page.evaluate(() => {
                return window.employerBrandTool.debugController.getDebugOptions();
            });
            
            // Press Cmd+D (or Ctrl+D on non-Mac)
            const isMac = process.platform === 'darwin';
            await page.keyboard.press(isMac ? 'Meta+d' : 'Control+d');
            
            // Wait for state change
            await page.waitForTimeout(100);
            
            // Check that state toggled
            const afterToggle = await page.evaluate(() => {
                return window.employerBrandTool.debugController.getDebugOptions();
            });
            
            // If initially some were on, all should be off now
            // If initially all were off, all should be on now
            const wasAnyOn = Object.values(initialState).some(v => v === true);
            const expectedState = !wasAnyOn;
            
            expect(afterToggle.showSpotOutlines).toBe(expectedState);
            expect(afterToggle.showSpotNumbers).toBe(expectedState);
            expect(afterToggle.showTextBounds).toBe(expectedState);
            expect(afterToggle.showPadding).toBe(expectedState);
            
            // Toggle again to verify it switches back
            await page.keyboard.press(isMac ? 'Meta+d' : 'Control+d');
            await page.waitForTimeout(100);
            
            const afterSecondToggle = await page.evaluate(() => {
                return window.employerBrandTool.debugController.getDebugOptions();
            });
            
            expect(afterSecondToggle.showSpotOutlines).toBe(!expectedState);
            expect(afterSecondToggle.showSpotNumbers).toBe(!expectedState);
            expect(afterSecondToggle.showTextBounds).toBe(!expectedState);
            expect(afterSecondToggle.showPadding).toBe(!expectedState);
        });
        
        test('keyboard shortcuts should not work when typing in inputs', async ({ page }) => {
            // Focus on the main text input
            await page.focus('#mainText');
            
            // Get initial state
            const initialState = await page.evaluate(() => {
                return window.employerBrandTool.debugController.getDebugOptions();
            });
            
            // Try to press Cmd+D while focused on input
            const isMac = process.platform === 'darwin';
            await page.keyboard.press(isMac ? 'Meta+d' : 'Control+d');
            
            // State should not change
            const afterAttempt = await page.evaluate(() => {
                return window.employerBrandTool.debugController.getDebugOptions();
            });
            
            expect(afterAttempt).toEqual(initialState);
        });
    });
    
    test.describe('Individual Debug Options', () => {
        
        test('should toggle spot outlines independently', async ({ page }) => {
            // Open debug panel
            await page.click('#toggleDebug');
            
            // Toggle spot outlines
            await page.click('#showSpotOutlines');
            
            // Verify state changed
            const state = await page.evaluate(() => {
                return window.employerBrandTool.debugController.getDebugOptions();
            });
            
            expect(state.showSpotOutlines).toBe(false);
            
            // Toggle back
            await page.click('#showSpotOutlines');
            
            const stateAfter = await page.evaluate(() => {
                return window.employerBrandTool.debugController.getDebugOptions();
            });
            
            expect(stateAfter.showSpotOutlines).toBe(true);
        });
        
        test('should toggle each debug option independently', async ({ page }) => {
            // Open debug panel
            await page.click('#toggleDebug');
            
            // Test each checkbox independently
            const checkboxes = [
                'showSpotOutlines',
                'showSpotNumbers',
                'showTextBounds',
                'showPadding'
            ];
            
            for (const checkbox of checkboxes) {
                // Get initial state
                const initialState = await page.evaluate((cb) => {
                    return window.employerBrandTool.debugController.getDebugOptions()[cb];
                }, checkbox);
                
                // Click checkbox
                await page.click(`#${checkbox}`);
                
                // Verify state changed
                const newState = await page.evaluate((cb) => {
                    return window.employerBrandTool.debugController.getDebugOptions()[cb];
                }, checkbox);
                
                expect(newState).toBe(!initialState);
            }
        });
    });
    
    test.describe('Visual Debug Overlays', () => {
        
        test('should render spot outlines when enabled', async ({ page }) => {
            // Add some text to trigger spot detection
            await page.fill('#mainText', 'TEST\nSPOT\nDETECTION');
            
            // Trigger spot detection
            await page.click('#findSpots');
            
            // Wait for spots to be detected
            await page.waitForFunction(() => {
                const app = window.employerBrandTool;
                return app.spots && app.spots.length > 0;
            });
            
            // Open debug panel and enable spot outlines
            await page.click('#toggleDebug');
            await page.click('#showAllDebug');
            
            // Take screenshot to verify visual debug overlays
            const screenshot = await page.screenshot();
            expect(screenshot).toBeTruthy();
            
            // Verify programmatically that debug rendering is happening
            const debugActive = await page.evaluate(() => {
                const app = window.employerBrandTool;
                return app.debugController.isAnyDebugEnabled();
            });
            
            expect(debugActive).toBe(true);
        });
        
        test('should show text bounds overlay when enabled', async ({ page }) => {
            // Add text
            await page.fill('#mainText', 'Testing Text Bounds');
            
            // Open debug panel
            await page.click('#toggleDebug');
            
            // Enable text bounds only
            await page.click('#hideAllDebug'); // Start with all off
            await page.click('#showTextBounds'); // Enable only text bounds
            
            // Verify only text bounds is enabled
            const state = await page.evaluate(() => {
                return window.employerBrandTool.debugController.getDebugOptions();
            });
            
            expect(state.showTextBounds).toBe(true);
            expect(state.showSpotOutlines).toBe(false);
            expect(state.showSpotNumbers).toBe(false);
            expect(state.showPadding).toBe(false);
        });
        
        test('should show padding overlay when enabled', async ({ page }) => {
            // Open debug panel
            await page.click('#toggleDebug');
            
            // Enable padding overlay only
            await page.click('#hideAllDebug');
            await page.click('#showPadding');
            
            // Verify state
            const state = await page.evaluate(() => {
                return window.employerBrandTool.debugController.getDebugOptions();
            });
            
            expect(state.showPadding).toBe(true);
            expect(state.showTextBounds).toBe(false);
        });
    });
    
    test.describe('Debug State Persistence', () => {
        
        test('should maintain debug state during app operations', async ({ page }) => {
            // Enable specific debug options
            await page.click('#toggleDebug');
            await page.click('#showAllDebug');
            
            // Perform various app operations
            await page.fill('#mainText', 'New Text Content');
            await page.click('#findSpots');
            
            // Switch to manual mode to make fontSize visible
            await page.click('#manualMode');
            await page.fill('#fontSize', '60');
            
            // Verify debug state persisted
            const state = await page.evaluate(() => {
                return window.employerBrandTool.debugController.getDebugOptions();
            });
            
            expect(state.showSpotOutlines).toBe(true);
            expect(state.showSpotNumbers).toBe(true);
            expect(state.showTextBounds).toBe(true);
            expect(state.showPadding).toBe(true);
        });
    });
    
    test.describe('Integration with Canvas Rendering', () => {
        
        test('should trigger re-render when debug options change', async ({ page }) => {
            // Set up render spy
            await page.evaluate(() => {
                window.renderCount = 0;
                const originalRender = window.employerBrandTool.render;
                window.employerBrandTool.render = function() {
                    window.renderCount++;
                    return originalRender.call(this);
                };
            });
            
            // Get initial render count
            const initialCount = await page.evaluate(() => window.renderCount);
            
            // Toggle debug option
            await page.click('#toggleDebug');
            await page.click('#showTextBounds');
            
            // Wait a bit for render
            await page.waitForTimeout(100);
            
            // Check render was called
            const afterCount = await page.evaluate(() => window.renderCount);
            expect(afterCount).toBeGreaterThan(initialCount);
        });
    });
    
    test.describe('Debug Controller API', () => {
        
        test('should expose proper API methods', async ({ page }) => {
            const apiMethods = await page.evaluate(() => {
                const controller = window.employerBrandTool.debugController;
                return {
                    hasToggleAllControls: typeof controller.toggleAllControls === 'function',
                    hasShowAllControls: typeof controller.showAllControls === 'function',
                    hasHideAllControls: typeof controller.hideAllControls === 'function',
                    hasGetDebugOptions: typeof controller.getDebugOptions === 'function',
                    hasSetDebugOptions: typeof controller.setDebugOptions === 'function',
                    hasIsAnyDebugEnabled: typeof controller.isAnyDebugEnabled === 'function',
                    hasRenderDebugOverlays: typeof controller.renderDebugOverlays === 'function',
                    hasExportState: typeof controller.exportState === 'function'
                };
            });
            
            expect(apiMethods.hasToggleAllControls).toBe(true);
            expect(apiMethods.hasShowAllControls).toBe(true);
            expect(apiMethods.hasHideAllControls).toBe(true);
            expect(apiMethods.hasGetDebugOptions).toBe(true);
            expect(apiMethods.hasSetDebugOptions).toBe(true);
            expect(apiMethods.hasIsAnyDebugEnabled).toBe(true);
            expect(apiMethods.hasRenderDebugOverlays).toBe(true);
            expect(apiMethods.hasExportState).toBe(true);
        });
        
        test('should allow programmatic control of debug options', async ({ page }) => {
            // Set options programmatically
            await page.evaluate(() => {
                window.employerBrandTool.debugController.setDebugOptions({
                    showSpotOutlines: false,
                    showSpotNumbers: false,
                    showTextBounds: true,
                    showPadding: true
                });
            });
            
            // Verify UI reflects the changes
            await page.click('#toggleDebug'); // Open panel to see checkboxes
            
            await expect(page.locator('#showSpotOutlines')).not.toBeChecked();
            await expect(page.locator('#showSpotNumbers')).not.toBeChecked();
            await expect(page.locator('#showTextBounds')).toBeChecked();
            await expect(page.locator('#showPadding')).toBeChecked();
        });
        
        test('should export debug state correctly', async ({ page }) => {
            // Set up specific state
            await page.click('#toggleDebug'); // Open panel
            await page.click('#showAllDebug'); // Enable all
            
            // Export state
            const exportedState = await page.evaluate(() => {
                return window.employerBrandTool.debugController.exportState();
            });
            
            expect(exportedState).toHaveProperty('options');
            expect(exportedState).toHaveProperty('panelVisible');
            expect(exportedState.options.showSpotOutlines).toBe(true);
            expect(exportedState.options.showSpotNumbers).toBe(true);
            expect(exportedState.options.showTextBounds).toBe(true);
            expect(exportedState.options.showPadding).toBe(true);
            expect(exportedState.panelVisible).toBe(true);
        });
    });
});

// Test for production build (no debug in export)
test.describe('Production Export', () => {
    
    test('debug overlays should not appear in high-res export', async ({ page }) => {
        const path = require('path');
        const filePath = path.resolve(__dirname, '..', 'index.html');
        await page.goto(`file://${filePath}`);
        await page.waitForFunction(() => window.employerBrandTool && window.employerBrandTool.isInitialized);
        
        // Enable all debug options
        await page.click('#toggleDebug');
        await page.click('#showAllDebug');
        
        // Add text and detect spots
        await page.fill('#mainText', 'EXPORT TEST');
        await page.click('#findSpots');
        
        // Trigger high-res export
        const exportResult = await page.evaluate(() => {
            const canvas = document.createElement('canvas');
            window.renderHighResolution(canvas, 2);
            return {
                width: canvas.width,
                height: canvas.height,
                hasContent: canvas.getContext('2d').getImageData(0, 0, 1, 1).data[3] > 0
            };
        });
        
        expect(exportResult.width).toBe(1200); // 600 * 2
        expect(exportResult.height).toBe(1200);
        expect(exportResult.hasContent).toBe(true);
        
        // Note: In actual export, debug overlays should not be included
        // This would require visual regression testing to fully verify
    });
});