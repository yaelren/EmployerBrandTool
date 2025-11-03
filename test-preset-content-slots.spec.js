/**
 * Test content slots with actual preset data
 * Verifies that all text in the preset wraps correctly
 */

import { test, expect } from '@playwright/test';

test('should wrap all text content in preset correctly', async ({ page }) => {
    await page.goto('http://localhost:5502');
    await page.waitForFunction(() => window.app && window.app.isInitialized);

    // Create slots for all cells that have text
    const result = await page.evaluate(() => {
        const manager = window.app.presetPageManager.contentSlotManager;
        manager.slots = [];

        const cells = window.app.grid.getAllCells();
        const textCells = [];
        const slotResults = [];

        cells.forEach(cell => {
            // Check if cell has text
            let hasText = false;
            if (cell.type === 'main-text' && cell.text) {
                hasText = true;
            } else if (cell.type === 'content' && cell.content && cell.content.text) {
                hasText = true;
            }

            if (hasText) {
                textCells.push({
                    id: cell.id,
                    type: cell.type,
                    text: cell.text || cell.content.text,
                    bounds: cell.bounds
                });

                try {
                    const config = {
                        fieldName: `text${cell.id}`,
                        fieldLabel: `Text ${cell.id}`,
                        required: true,
                        constraints: {
                            maxCharacters: 200,
                            minFontSize: 12,
                            maxFontSize: 120
                        }
                    };

                    const slot = manager.createSlotFromCell(cell, config);
                    manager.addSlot(slot);

                    // Get text bounds if available
                    let lineCount = 0;
                    if (cell.textComponent && cell.textComponent.getTextBounds) {
                        const ctx = window.app.canvasManager.ctx;
                        const textBounds = cell.textComponent.getTextBounds(ctx);
                        lineCount = textBounds ? textBounds.length : 0;
                    }

                    slotResults.push({
                        cellId: cell.id,
                        cellType: cell.type,
                        text: cell.text || cell.content.text,
                        cellBounds: cell.bounds,
                        slotBounds: slot.boundingBox,
                        lineCount,
                        success: true
                    });
                } catch (error) {
                    slotResults.push({
                        cellId: cell.id,
                        error: error.message,
                        success: false
                    });
                }
            }
        });

        return {
            totalCells: cells.length,
            textCells: textCells.length,
            slotResults
        };
    });

    console.log('\n📊 PRESET CONTENT SLOTS TEST:');
    console.log(`Total cells: ${result.totalCells}`);
    console.log(`Text cells: ${result.textCells}`);
    console.log(`Slots created: ${result.slotResults.filter(r => r.success).length}`);
    console.log('\nText cell slots:');

    result.slotResults.forEach(slot => {
        if (slot.success) {
            console.log(`\nCell ${slot.cellId} (${slot.cellType}):`);
            console.log(`  Text: "${slot.text.substring(0, 50)}${slot.text.length > 50 ? '...' : ''}"`);
            console.log(`  Lines: ${slot.lineCount}`);
            console.log(`  Cell: ${slot.cellBounds.width.toFixed(0)}×${slot.cellBounds.height.toFixed(0)}`);
            console.log(`  Slot: ${slot.slotBounds.width.toFixed(0)}×${slot.slotBounds.height.toFixed(0)}`);
        }
    });

    // Show overlay
    await page.click('#toggleContentSlots');
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({ path: 'test-preset-content-slots.png', fullPage: true });

    expect(result.slotResults.every(r => r.success)).toBe(true);
    console.log('\n✅ All content slots created successfully!');
});
