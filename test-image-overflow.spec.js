/**
 * Test image content slot bounds with scale > 1.0 causing overflow
 * Verifies that slots capture full rendered dimensions even when extending beyond cell
 */

import { test, expect } from '@playwright/test';

test('should calculate dimensions from natural image size × scale in free/fit mode', async ({ page }) => {
    await page.goto('http://localhost:5502');
    await page.waitForFunction(() => window.app && window.app.isInitialized);

    const result = await page.evaluate(async () => {
        const cells = window.app.grid.getAllCells();
        const contentCell = cells.find(c => c.type === 'content' && c.id !== 1 && c.id !== 11);

        if (!contentCell) return { error: 'No content cell found' };

        // Create a 100x100 square image
        const img = new Image();
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwMDAwMCIvPjwvc3ZnPg==';

        await new Promise(resolve => { img.onload = resolve; });

        // Set image content with scale = 2.0 (should render at 200x200 from natural 100x100)
        contentCell.content = {
            type: 'media',
            mediaType: 'image',
            media: img,
            scale: 2.0,      // 2x natural size = 200x200px
            fillMode: 'fit', // Free mode: scale from natural dimensions
            positionH: 'center',
            positionV: 'middle'
        };

        window.app.render();

        const config = {
            fieldName: 'overflowImage',
            fieldLabel: 'Overflow Test Image',
            required: false
        };

        try {
            const slot = window.app.presetPageManager.contentSlotManager.createSlotFromCell(contentCell, config);
            window.app.presetPageManager.contentSlotManager.addSlot(slot);

            // Calculate expected dimensions
            const padding = contentCell.padding || 0;
            const contentX = contentCell.bounds.x + padding;
            const contentY = contentCell.bounds.y + padding;
            const contentWidth = contentCell.bounds.width - padding * 2;
            const contentHeight = contentCell.bounds.height - padding * 2;

            // With scale=2.0 in free/fit mode, image should be 2x its NATURAL size
            // 100x100px image * 2.0 = 200x200px
            const expectedWidth = 100 * 2.0;  // Natural width * scale
            const expectedHeight = 100 * 2.0; // Natural height * scale

            // Position: center/middle means image center aligns with content center
            // So top-left corner is offset by half the overflow
            const expectedX = contentX + (contentWidth - expectedWidth) / 2;
            const expectedY = contentY + (contentHeight - expectedHeight) / 2;

            return {
                success: true,
                cellBounds: contentCell.bounds,
                contentArea: {
                    x: contentX,
                    y: contentY,
                    width: contentWidth,
                    height: contentHeight
                },
                slotBounds: slot.boundingBox,
                scale: contentCell.content.scale,
                expected: {
                    width: expectedWidth,
                    height: expectedHeight,
                    x: expectedX,
                    y: expectedY
                },
                // Verify slot is 2x content area dimensions
                isDoubleSize:
                    Math.abs(slot.boundingBox.width - expectedWidth) < 2 &&
                    Math.abs(slot.boundingBox.height - expectedHeight) < 2,
                // Verify slot extends beyond content area
                extendsLeft: slot.boundingBox.x < contentX,
                extendsRight: (slot.boundingBox.x + slot.boundingBox.width) > (contentX + contentWidth),
                extendsTop: slot.boundingBox.y < contentY,
                extendsBottom: (slot.boundingBox.y + slot.boundingBox.height) > (contentY + contentHeight)
            };
        } catch (error) {
            return { error: error.message, stack: error.stack };
        }
    });

    console.log('\n📊 FREE MODE TEST (scale from natural dimensions):');
    console.log('Cell bounds:', result.cellBounds);
    console.log('Content area:', result.contentArea);
    console.log('Slot bounds:', result.slotBounds);
    console.log('Expected (100x100 * 2.0):', result.expected);
    console.log('Scale:', result.scale);
    console.log('Matches natural × scale:', result.isDoubleSize);

    await page.click('#toggleContentSlots');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-image-natural-scale.png', fullPage: true });

    expect(result.success).toBe(true);
    expect(result.isDoubleSize).toBe(true);

    console.log('\n✅ Image slot correctly calculates from natural size × scale!');
});

test('should handle extreme scaling (scale=3.0) correctly', async ({ page }) => {
    await page.goto('http://localhost:5502');
    await page.waitForFunction(() => window.app && window.app.isInitialized);

    const result = await page.evaluate(async () => {
        const cells = window.app.grid.getAllCells();
        const contentCell = cells.find(c => c.type === 'content' && c.id !== 1 && c.id !== 11);

        if (!contentCell) return { error: 'No content cell found' };

        // Create a 100x100 square image
        const img = new Image();
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmMDAwMCIvPjwvc3ZnPg==';

        await new Promise(resolve => { img.onload = resolve; });

        // Extreme scale: 3x
        contentCell.content = {
            type: 'media',
            mediaType: 'image',
            media: img,
            scale: 3.0,
            fillMode: 'fit',
            positionH: 'center',
            positionV: 'middle'
        };

        window.app.render();

        const config = {
            fieldName: 'extremeScaleImage',
            fieldLabel: 'Extreme Scale Image',
            required: false
        };

        try {
            const slot = window.app.presetPageManager.contentSlotManager.createSlotFromCell(contentCell, config);
            window.app.presetPageManager.contentSlotManager.addSlot(slot);

            const padding = contentCell.padding || 0;
            const contentWidth = contentCell.bounds.width - padding * 2;
            const contentHeight = contentCell.bounds.height - padding * 2;

            // Natural size (100x100) * scale (3.0) = 300x300
            const expectedDimension = 100 * 3.0;

            return {
                success: true,
                slotBounds: slot.boundingBox,
                scale: 3.0,
                expectedDimension: expectedDimension,
                actualDimension: Math.min(slot.boundingBox.width, slot.boundingBox.height),
                isTripleSize: Math.abs(slot.boundingBox.width - expectedDimension) < 2
            };
        } catch (error) {
            return { error: error.message, stack: error.stack };
        }
    });

    console.log('\n📊 EXTREME SCALE TEST (scale=3.0):');
    console.log('Expected dimension:', result.expectedDimension);
    console.log('Actual dimension:', result.actualDimension);
    console.log('Is triple size:', result.isTripleSize);

    await page.click('#toggleContentSlots');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-image-extreme-scale.png', fullPage: true });

    expect(result.success).toBe(true);
    expect(result.isTripleSize).toBe(true);

    console.log('\n✅ Image slot correctly handles extreme scaling!');
});
