/**
 * Test image content slot bounds
 * Verifies that image content slots wrap the actual rendered image, not the full cell
 */

import { test, expect } from '@playwright/test';

test('should wrap image content tightly based on scale and positioning', async ({ page }) => {
    await page.goto('http://localhost:5502');
    await page.waitForFunction(() => window.app && window.app.isInitialized);

    const result = await page.evaluate(async () => {
        const cells = window.app.grid.getAllCells();

        // Find a content cell to add an image to
        const contentCell = cells.find(c => c.type === 'content' && c.id !== 1 && c.id !== 11);

        if (!contentCell) return { error: 'No content cell found' };

        // Create a test image
        const img = new Image();
        img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        // Wait for image to load
        await new Promise(resolve => {
            img.onload = resolve;
        });

        // Set image content with scale = 0.5 (half size) and left-top positioning
        contentCell.content = {
            type: 'media',
            mediaType: 'image',
            media: img,
            scale: 0.5,
            fillMode: 'fit',
            positionH: 'left',
            positionV: 'top'
        };

        window.app.render();

        // Create slot
        const config = {
            fieldName: 'testImage',
            fieldLabel: 'Test Image',
            required: false,
            constraints: {
                fitMode: 'cover',
                maxFileSize: 10485760
            }
        };

        try {
            const slot = window.app.presetPageManager.contentSlotManager.createSlotFromCell(contentCell, config);
            window.app.presetPageManager.contentSlotManager.addSlot(slot);

            return {
                success: true,
                cellId: contentCell.id,
                cellBounds: contentCell.bounds,
                slotBounds: slot.boundingBox,
                scale: contentCell.content.scale,
                // Slot should be half the cell size due to scale = 0.5
                isTightlyBound: slot.boundingBox.width < contentCell.bounds.width * 0.6 &&
                                slot.boundingBox.height < contentCell.bounds.height * 0.6
            };
        } catch (error) {
            return {
                error: error.message,
                stack: error.stack
            };
        }
    });

    console.log('\n📊 IMAGE BOUNDS TEST:');
    console.log('Cell bounds:', result.cellBounds);
    console.log('Slot bounds:', result.slotBounds);
    console.log('Scale:', result.scale);
    console.log('Tightly bound:', result.isTightlyBound);

    // Show overlay
    await page.click('#toggleContentSlots');
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({ path: 'test-image-bounds.png', fullPage: true });

    expect(result.success).toBe(true);
    expect(result.isTightlyBound).toBe(true);

    console.log('\n✅ Image content slot wraps actual image size, not full cell!');
});
