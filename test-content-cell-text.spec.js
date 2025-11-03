/**
 * Playwright test to investigate text wrapping in content cells
 * Tests whether content slots correctly wrap text that's inside content cells
 */

import { test, expect } from '@playwright/test';

test.describe('Content Cell Text Wrapping', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5502');
        await page.waitForFunction(() => window.app && window.app.isInitialized);
    });

    test('should wrap text content in content cell with left alignment and small font', async ({ page }) => {
        const result = await page.evaluate(() => {
            const cells = window.app.grid.getAllCells();
            // Find a content cell that's not the main text cells
            const contentCell = cells.find(c => c.type === 'content' && c.id !== 1 && c.id !== 11);

            if (!contentCell) return { error: 'No content cell found' };

            console.log('Selected content cell:', contentCell.id);

            // Add text content to the cell with small font and left alignment
            contentCell.content = {
                type: 'text',
                text: 'Small Text',
                fontSize: 16,
                fontFamily: 'Arial',
                color: '#000000',
                align: 'left'
            };

            window.app.render();

            // Create slot
            const config = {
                fieldName: 'contentCellText',
                fieldLabel: 'Content Cell Text',
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

                return {
                    success: true,
                    cellId: contentCell.id,
                    cellBounds: contentCell.bounds,
                    slotBounds: slot.boundingBox,
                    text: contentCell.content.text,
                    fontSize: contentCell.content.fontSize,
                    alignment: contentCell.content.align
                };
            } catch (error) {
                return { error: error.message, stack: error.stack };
            }
        });

        console.log('Test result:', result);
        expect(result.success).toBe(true);

        // Show overlay
        await page.click('#toggleContentSlots');
        await page.waitForTimeout(500);

        // Screenshot
        await page.screenshot({ path: 'test-content-cell-small-left.png', fullPage: true });

        // Verify slot is smaller than cell (should wrap text, not cell)
        expect(result.slotBounds.width).toBeLessThan(result.cellBounds.width);
        expect(result.slotBounds.height).toBeLessThan(result.cellBounds.height);

        console.log('✅ Slot wraps text tightly (not full cell)');
    });

    test('should wrap text content in content cell with bottom-right alignment', async ({ page }) => {
        const result = await page.evaluate(() => {
            const cells = window.app.grid.getAllCells();
            const contentCell = cells.find(c => c.type === 'content' && c.id !== 1 && c.id !== 11 && c.id !== 2);

            if (!contentCell) return { error: 'No content cell found' };

            // Add text content with bottom-right alignment
            contentCell.content = {
                type: 'text',
                text: 'Bottom Right',
                fontSize: 20,
                fontFamily: 'Arial',
                color: '#ff0000',
                align: 'right'
            };

            window.app.render();

            const config = {
                fieldName: 'contentCellText2',
                fieldLabel: 'Bottom Right Text',
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

                return {
                    success: true,
                    cellId: contentCell.id,
                    cellBounds: contentCell.bounds,
                    slotBounds: slot.boundingBox,
                    text: contentCell.content.text
                };
            } catch (error) {
                return { error: error.message, stack: error.stack };
            }
        });

        console.log('Bottom-right alignment result:', result);
        expect(result.success).toBe(true);

        // Screenshot
        await page.screenshot({ path: 'test-content-cell-bottom-right.png', fullPage: true });
    });

    test('should show multiple text content cells with different properties', async ({ page }) => {
        const result = await page.evaluate(() => {
            const manager = window.app.presetPageManager.contentSlotManager;
            manager.slots = []; // Clear any existing slots

            const cells = window.app.grid.getAllCells();
            const contentCells = cells.filter(c => c.type === 'content' && c.id !== 1 && c.id !== 11);

            if (contentCells.length < 3) return { error: 'Need at least 3 content cells' };

            const results = [];

            // Cell 1: Small font, left align
            contentCells[0].content = {
                type: 'text',
                text: 'Left Small',
                fontSize: 14,
                fontFamily: 'Arial',
                color: '#000000',
                align: 'left'
            };

            // Cell 2: Large font, center align
            contentCells[1].content = {
                type: 'text',
                text: 'Center Large',
                fontSize: 36,
                fontFamily: 'Arial',
                color: '#0000ff',
                align: 'center'
            };

            // Cell 3: Medium font, right align
            contentCells[2].content = {
                type: 'text',
                text: 'Right Medium',
                fontSize: 24,
                fontFamily: 'Arial',
                color: '#ff0000',
                align: 'right'
            };

            window.app.render();

            // Create slots for all three
            [contentCells[0], contentCells[1], contentCells[2]].forEach((cell, i) => {
                try {
                    const config = {
                        fieldName: `textCell${i}`,
                        fieldLabel: `Text ${i}`,
                        required: true,
                        constraints: {
                            maxCharacters: 50,
                            minFontSize: 12,
                            maxFontSize: 48
                        }
                    };

                    const slot = manager.createSlotFromCell(cell, config);
                    manager.addSlot(slot);

                    results.push({
                        cellId: cell.id,
                        text: cell.content.text,
                        fontSize: cell.content.fontSize,
                        align: cell.content.align,
                        cellBounds: cell.bounds,
                        slotBounds: slot.boundingBox
                    });
                } catch (error) {
                    results.push({ error: error.message });
                }
            });

            return { success: true, results };
        });

        console.log('Multiple text cells:', result);
        expect(result.success).toBe(true);

        // Show overlay
        await page.click('#toggleContentSlots');
        await page.waitForTimeout(500);

        // Screenshot
        await page.screenshot({ path: 'test-multiple-text-content-cells.png', fullPage: true });

        // Log comparison of cell bounds vs slot bounds
        result.results.forEach((r, i) => {
            if (!r.error) {
                console.log(`Cell ${i}: "${r.text}" (${r.fontSize}px, ${r.align})`);
                console.log(`  Cell: ${r.cellBounds.width}×${r.cellBounds.height}`);
                console.log(`  Slot: ${r.slotBounds.width}×${r.slotBounds.height}`);
                console.log(`  Slot should be smaller than cell: ${r.slotBounds.width < r.cellBounds.width && r.slotBounds.height < r.cellBounds.height}`);
            }
        });
    });
});
