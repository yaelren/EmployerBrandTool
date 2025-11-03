/**
 * Final verification test - Shows content slots wrapping multi-line text correctly
 * Replicates the user's preset with "We asked our employees..." text
 */

import { test, expect } from '@playwright/test';

test('should correctly wrap all text including multi-line content cells', async ({ page }) => {
    await page.goto('http://localhost:5502');
    await page.waitForFunction(() => window.app && window.app.isInitialized);

    const result = await page.evaluate(() => {
        const manager = window.app.presetPageManager.contentSlotManager;
        manager.slots = [];

        const cells = window.app.grid.getAllCells();

        // Add multi-line text to content cells to replicate user's preset
        const contentCells = cells.filter(c => c.type === 'content');

        if (contentCells.length > 0) {
            // Add the "We asked our employees..." text
            contentCells[0].content = {
                type: 'text',
                text: 'We asked our employees about their 2025 resolutions.',
                fontSize: 'auto',
                fontFamily: '"Wix Madefor Display", Arial, sans-serif',
                color: '#ffffff',
                textAlign: 'left',
                positionH: 'left',
                positionV: 'middle',
                padding: 1
            };
        }

        if (contentCells.length > 1) {
            // Add another multi-line text
            contentCells[1].content = {
                type: 'text',
                text: '2025 BRINGS BIG NEW',
                fontSize: 'auto',
                fontFamily: '"Wix Madefor Display", Arial, sans-serif',
                color: '#ffffff',
                textAlign: 'left',
                positionH: 'left',
                positionV: 'top',
                padding: 1
            };
        }

        // Render to display the text
        window.app.render();

        // Now create slots for ALL text cells
        const slotResults = [];
        cells.forEach(cell => {
            let hasText = false;
            let text = '';

            if (cell.type === 'main-text' && cell.text) {
                hasText = true;
                text = cell.text;
            } else if (cell.type === 'content' && cell.content && cell.content.text) {
                hasText = true;
                text = cell.content.text;
            }

            if (hasText) {
                try {
                    const config = {
                        fieldName: `text${cell.id}`,
                        fieldLabel: `Text Cell ${cell.id}`,
                        required: true,
                        constraints: {
                            maxCharacters: 200,
                            minFontSize: 12,
                            maxFontSize: 120
                        }
                    };

                    const slot = manager.createSlotFromCell(cell, config);
                    manager.addSlot(slot);

                    // Get line count
                    let lineCount = 0;
                    if (cell.textComponent && cell.textComponent.getTextBounds) {
                        const ctx = window.app.canvasManager.ctx;
                        const textBounds = cell.textComponent.getTextBounds(ctx);
                        lineCount = textBounds ? textBounds.length : 0;
                    }

                    slotResults.push({
                        cellId: cell.id,
                        cellType: cell.type,
                        text,
                        lineCount,
                        cellBounds: cell.bounds,
                        slotBounds: slot.boundingBox,
                        wrapsCorrectly: lineCount > 1 ?
                            (slot.boundingBox.height > cell.bounds.height * 0.3) :
                            (slot.boundingBox.height <= cell.bounds.height + 2),
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
            totalSlots: slotResults.length,
            successCount: slotResults.filter(r => r.success).length,
            multiLineCount: slotResults.filter(r => r.lineCount > 1).length,
            slotResults
        };
    });

    console.log('\n📊 FINAL VERIFICATION TEST:');
    console.log(`Total slots: ${result.totalSlots}`);
    console.log(`Success: ${result.successCount}`);
    console.log(`Multi-line text cells: ${result.multiLineCount}`);

    console.log('\n📝 Slot Details:');
    result.slotResults.forEach(slot => {
        if (slot.success) {
            const indicator = slot.wrapsCorrectly ? '✅' : '❌';
            console.log(`\n${indicator} Cell ${slot.cellId} (${slot.cellType}):`);
            console.log(`   Text: "${slot.text.substring(0, 40)}${slot.text.length > 40 ? '...' : ''}"`);
            console.log(`   Lines: ${slot.lineCount}`);
            console.log(`   Cell: ${slot.cellBounds.width.toFixed(0)}×${slot.cellBounds.height.toFixed(0)}`);
            console.log(`   Slot: ${slot.slotBounds.width.toFixed(0)}×${slot.slotBounds.height.toFixed(0)}`);
            console.log(`   Wraps correctly: ${slot.wrapsCorrectly}`);
        }
    });

    // Show overlay
    await page.click('#toggleContentSlots');
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({ path: 'test-final-verification.png', fullPage: true });

    expect(result.successCount).toBe(result.totalSlots);
    expect(result.slotResults.every(r => r.wrapsCorrectly)).toBe(true);

    console.log('\n✅ All content slots wrap correctly with typography-aware bounds!');
});
