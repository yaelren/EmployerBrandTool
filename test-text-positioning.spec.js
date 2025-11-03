/**
 * Test text content slot positioning
 * Verifies that text slots respect positionH, positionV, and textAlign
 */

import { test, expect } from '@playwright/test';

test('should position text slots correctly with left-top alignment', async ({ page }) => {
    await page.goto('http://localhost:5502');
    await page.waitForFunction(() => window.app && window.app.isInitialized);

    const result = await page.evaluate(() => {
        const cells = window.app.grid.getAllCells();
        const contentCell = cells.find(c => c.type === 'content' && c.id !== 1 && c.id !== 11);

        if (!contentCell) return { error: 'No content cell found' };

        // Add text with left-top positioning and small font
        contentCell.content = {
            type: 'text',
            text: 'Top Left',
            fontSize: 18,
            fontFamily: 'Arial',
            color: '#000000',
            textAlign: 'left',
            positionH: 'left',
            positionV: 'top',
            padding: 5
        };

        window.app.render();

        const config = {
            fieldName: 'topLeftText',
            fieldLabel: 'Top Left Text',
            required: true,
            constraints: {
                maxCharacters: 50,
                minFontSize: 12,
                maxFontSize: 48
            }
        };

        try {
            const slot = window.app.presetPageManager.contentSlotManager.createSlotFromCell(contentCell, config);
            window.app.presetPageManager.contentSlotManager.addSlot(slot);

            // Expected: slot should be at top-left of content area
            const padding = 5;
            const expectedX = contentCell.bounds.x + padding;
            const expectedY = contentCell.bounds.y + padding;

            return {
                success: true,
                cellBounds: contentCell.bounds,
                slotBounds: slot.boundingBox,
                positioning: {
                    positionH: 'left',
                    positionV: 'top',
                    textAlign: 'left'
                },
                isAtTopLeft:
                    Math.abs(slot.boundingBox.x - expectedX) < 2 &&
                    Math.abs(slot.boundingBox.y - expectedY) < 2,
                isSmall:
                    slot.boundingBox.width < contentCell.bounds.width / 2 &&
                    slot.boundingBox.height < contentCell.bounds.height / 2
            };
        } catch (error) {
            return { error: error.message, stack: error.stack };
        }
    });

    console.log('\n📊 TEXT POSITIONING TEST (Left-Top):');
    console.log('Cell bounds:', result.cellBounds);
    console.log('Slot bounds:', result.slotBounds);
    console.log('Positioning:', result.positioning);
    console.log('At top-left:', result.isAtTopLeft);
    console.log('Small size:', result.isSmall);

    await page.click('#toggleContentSlots');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-text-left-top.png', fullPage: true });

    expect(result.success).toBe(true);
    expect(result.isAtTopLeft).toBe(true);
    expect(result.isSmall).toBe(true);

    console.log('\n✅ Text slot correctly positioned at top-left!');
});

test('should position text slots correctly with right-bottom alignment', async ({ page }) => {
    await page.goto('http://localhost:5502');
    await page.waitForFunction(() => window.app && window.app.isInitialized);

    const result = await page.evaluate(() => {
        const cells = window.app.grid.getAllCells();
        const contentCell = cells.find(c => c.type === 'content' && c.id !== 1 && c.id !== 11);

        if (!contentCell) return { error: 'No content cell found' };

        // Add text with right-bottom positioning
        contentCell.content = {
            type: 'text',
            text: 'Bottom Right',
            fontSize: 20,
            fontFamily: 'Arial',
            color: '#ff0000',
            textAlign: 'right',
            positionH: 'right',
            positionV: 'bottom',
            padding: 5
        };

        window.app.render();

        const config = {
            fieldName: 'bottomRightText',
            fieldLabel: 'Bottom Right Text',
            required: true
        };

        try {
            const slot = window.app.presetPageManager.contentSlotManager.createSlotFromCell(contentCell, config);
            window.app.presetPageManager.contentSlotManager.addSlot(slot);

            // Expected: slot should be at bottom-right of content area
            const padding = 5;
            const contentRight = contentCell.bounds.x + contentCell.bounds.width - padding;
            const contentBottom = contentCell.bounds.y + contentCell.bounds.height - padding;
            const expectedX = contentRight - slot.boundingBox.width;
            const expectedY = contentBottom - slot.boundingBox.height;

            return {
                success: true,
                cellBounds: contentCell.bounds,
                slotBounds: slot.boundingBox,
                isAtBottomRight:
                    Math.abs(slot.boundingBox.x - expectedX) < 2 &&
                    Math.abs(slot.boundingBox.y - expectedY) < 2
            };
        } catch (error) {
            return { error: error.message, stack: error.stack };
        }
    });

    console.log('\n📊 TEXT POSITIONING TEST (Right-Bottom):');
    console.log('At bottom-right:', result.isAtBottomRight);

    await page.click('#toggleContentSlots');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-text-right-bottom.png', fullPage: true });

    expect(result.success).toBe(true);
    expect(result.isAtBottomRight).toBe(true);

    console.log('\n✅ Text slot correctly positioned at bottom-right!');
});
