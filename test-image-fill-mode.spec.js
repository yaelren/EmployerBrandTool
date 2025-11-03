/**
 * Test image content slot bounds with fill mode clipping
 * Verifies that slots respect clipping for fill/stretch modes
 */

import { test, expect } from '@playwright/test';

test('should clip image bounds to content area in fill mode', async ({ page }) => {
    await page.goto('http://localhost:5502');
    await page.waitForFunction(() => window.app && window.app.isInitialized);

    const result = await page.evaluate(async () => {
        const cells = window.app.grid.getAllCells();
        const contentCell = cells.find(c => c.type === 'content' && c.id !== 1 && c.id !== 11);

        if (!contentCell) return { error: 'No content cell found' };

        // Create test image (landscape 2:1 aspect ratio)
        const img = new Image();
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzQyODVmNCIvPjwvc3ZnPg==';

        await new Promise(resolve => { img.onload = resolve; });

        // Set image content with fill mode (should clip to content area)
        contentCell.content = {
            type: 'media',
            mediaType: 'image',
            media: img,
            scale: 1.0,
            fillMode: 'fill',  // Fill mode = clipping enabled
            positionH: 'center',
            positionV: 'middle'
        };

        window.app.render();

        const config = {
            fieldName: 'fillModeImage',
            fieldLabel: 'Fill Mode Image',
            required: false
        };

        try {
            const slot = window.app.presetPageManager.contentSlotManager.createSlotFromCell(contentCell, config);
            window.app.presetPageManager.contentSlotManager.addSlot(slot);

            // Calculate expected behavior:
            // Cell is portrait (taller than wide)
            // Image is landscape (wider than tall)
            // Fill mode fits to height and crops width
            // So slot should match content area dimensions
            const contentWidth = contentCell.bounds.width - (contentCell.padding || 0) * 2;
            const contentHeight = contentCell.bounds.height - (contentCell.padding || 0) * 2;

            return {
                success: true,
                cellBounds: contentCell.bounds,
                slotBounds: slot.boundingBox,
                fillMode: contentCell.content.fillMode,
                // For fill mode, slot should match content area (clipped)
                isClippedToContentArea:
                    Math.abs(slot.boundingBox.width - contentWidth) < 1 &&
                    Math.abs(slot.boundingBox.height - contentHeight) < 1
            };
        } catch (error) {
            return { error: error.message, stack: error.stack };
        }
    });

    console.log('\n📊 FILL MODE IMAGE TEST:');
    console.log('Cell bounds:', result.cellBounds);
    console.log('Slot bounds:', result.slotBounds);
    console.log('Fill mode:', result.fillMode);
    console.log('Clipped to content area:', result.isClippedToContentArea);

    await page.click('#toggleContentSlots');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-image-fill-mode.png', fullPage: true });

    expect(result.success).toBe(true);
    expect(result.isClippedToContentArea).toBe(true);

    console.log('\n✅ Fill mode image slot correctly clipped to content area!');
});
