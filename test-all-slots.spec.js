/**
 * Playwright test to show ALL content slots with border-only overlay
 */

import { test, expect } from '@playwright/test';

test('should show all content slots with borders only', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5502');

    // Wait for app to initialize
    await page.waitForFunction(() => window.app && window.app.isInitialized);

    console.log('✅ App initialized');

    // Create slots for ALL cells
    const result = await page.evaluate(() => {
        const manager = window.app.presetPageManager.contentSlotManager;

        // Clear existing slots
        manager.slots = [];

        const cells = window.app.grid.getAllCells();
        let textCount = 0;
        let imageCount = 0;

        cells.forEach(cell => {
            const isTextCell = cell.type === 'main-text' || cell.type === 'text';

            let config;
            if (isTextCell) {
                config = {
                    fieldName: `text${cell.id}`,
                    fieldLabel: `Text ${cell.id}`,
                    required: true,
                    constraints: {
                        maxCharacters: 100,
                        minFontSize: 16,
                        maxFontSize: 72
                    }
                };
                textCount++;
            } else {
                config = {
                    fieldName: `image${cell.id}`,
                    fieldLabel: `Image ${cell.id}`,
                    required: false,
                    constraints: {
                        fitMode: 'cover',
                        maxFileSize: 10485760
                    }
                };
                imageCount++;
            }

            const slot = manager.createSlotFromCell(cell, config);
            manager.addSlot(slot);
        });

        return {
            totalCells: cells.length,
            textSlots: textCount,
            imageSlots: imageCount,
            slots: manager.getAllSlots().length
        };
    });

    console.log('📊 Created slots:', result);

    // Show the overlay
    await page.click('#toggleContentSlots');
    await page.waitForTimeout(500);

    // Verify overlay is visible
    const overlayVisible = await page.evaluate(() => {
        return document.getElementById('contentSlotOverlay')?.style.display !== 'none';
    });

    console.log('Overlay visible:', overlayVisible);
    expect(overlayVisible).toBe(true);

    // Take screenshot
    await page.screenshot({ path: 'test-all-slots-borders-only.png', fullPage: true });
    console.log('📸 Screenshot saved: test-all-slots-borders-only.png');

    console.log('✅ Test complete - check the screenshot!');
});
