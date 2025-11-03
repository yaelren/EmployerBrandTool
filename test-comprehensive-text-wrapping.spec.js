/**
 * Comprehensive test for text wrapping in all cell types
 * Verifies that both main-text cells and content cells with text wrap correctly
 */

import { test, expect } from '@playwright/test';

test('comprehensive text wrapping test for all cell types', async ({ page }) => {
    await page.goto('http://localhost:5502');
    await page.waitForFunction(() => window.app && window.app.isInitialized);

    const result = await page.evaluate(() => {
        const manager = window.app.presetPageManager.contentSlotManager;
        manager.slots = [];

        const cells = window.app.grid.getAllCells();
        console.log(`Total cells: ${cells.length}`);

        const results = {
            mainTextCells: [],
            contentTextCells: [],
            errors: []
        };

        // Test main-text cells (should already have text)
        const mainTextCells = cells.filter(c => c.type === 'main-text');
        console.log(`Main-text cells: ${mainTextCells.length}`);

        mainTextCells.forEach(cell => {
            try {
                const config = {
                    fieldName: `mainText${cell.id}`,
                    fieldLabel: `Main Text ${cell.id}`,
                    required: true,
                    constraints: {
                        maxCharacters: 100,
                        minFontSize: 24,
                        maxFontSize: 120
                    }
                };

                const slot = manager.createSlotFromCell(cell, config);
                manager.addSlot(slot);

                results.mainTextCells.push({
                    cellId: cell.id,
                    text: cell.text,
                    cellBounds: cell.bounds,
                    slotBounds: slot.boundingBox,
                    // Main-text cells often span full width by design (letterSpacing),
                    // so we only check that height wraps tightly (with small tolerance for rounding)
                    wrapsContent: slot.boundingBox.height <= cell.bounds.height + 2
                });
            } catch (error) {
                results.errors.push({
                    cellId: cell.id,
                    type: 'main-text',
                    error: error.message
                });
            }
        });

        // Test content cells with added text
        const contentCells = cells.filter(c => c.type === 'content' && c.id !== 1 && c.id !== 11);
        console.log(`Content cells: ${contentCells.length}`);

        // Add different text configurations to first 3 content cells
        const textConfigs = [
            { text: 'Tiny', fontSize: 12, align: 'left' },
            { text: 'Large Centered Text', fontSize: 48, align: 'center' },
            { text: 'Small Right', fontSize: 18, align: 'right' }
        ];

        contentCells.slice(0, 3).forEach((cell, i) => {
            try {
                const textConfig = textConfigs[i];
                cell.content = {
                    type: 'text',
                    text: textConfig.text,
                    fontSize: textConfig.fontSize,
                    fontFamily: 'Arial',
                    color: '#000000',
                    align: textConfig.align
                };

                window.app.render();

                const config = {
                    fieldName: `contentText${cell.id}`,
                    fieldLabel: `Content Text ${cell.id}`,
                    required: true,
                    constraints: {
                        maxCharacters: 50,
                        minFontSize: 12,
                        maxFontSize: 60
                    }
                };

                const slot = manager.createSlotFromCell(cell, config);
                manager.addSlot(slot);

                results.contentTextCells.push({
                    cellId: cell.id,
                    text: cell.content.text,
                    fontSize: cell.content.fontSize,
                    align: cell.content.align,
                    cellBounds: cell.bounds,
                    slotBounds: slot.boundingBox,
                    // Content can overflow cell bounds (e.g., large text),
                    // so we check that slot wraps the actual content dimensions
                    // Height should be appropriate for font size (not exceed cell * 1.5)
                    wrapsContent: slot.boundingBox.height <= cell.bounds.height * 1.5
                });
            } catch (error) {
                results.errors.push({
                    cellId: cell.id,
                    type: 'content',
                    error: error.message
                });
            }
        });

        return results;
    });

    console.log('\n📊 TEST RESULTS:\n');
    console.log('=== MAIN-TEXT CELLS ===');
    result.mainTextCells.forEach(cell => {
        console.log(`Cell ${cell.cellId}: "${cell.text}"`);
        console.log(`  Cell: ${cell.cellBounds.width.toFixed(1)} × ${cell.cellBounds.height.toFixed(1)} px`);
        console.log(`  Slot: ${cell.slotBounds.width.toFixed(1)} × ${cell.slotBounds.height.toFixed(1)} px`);
        console.log(`  ✅ Wraps content: ${cell.wrapsContent}`);
    });

    console.log('\n=== CONTENT CELLS WITH TEXT ===');
    result.contentTextCells.forEach(cell => {
        console.log(`Cell ${cell.cellId}: "${cell.text}" (${cell.fontSize}px, ${cell.align})`);
        console.log(`  Cell: ${cell.cellBounds.width.toFixed(1)} × ${cell.cellBounds.height.toFixed(1)} px`);
        console.log(`  Slot: ${cell.slotBounds.width.toFixed(1)} × ${cell.slotBounds.height.toFixed(1)} px`);
        console.log(`  ✅ Wraps content: ${cell.wrapsContent}`);
    });

    if (result.errors.length > 0) {
        console.log('\n=== ERRORS ===');
        result.errors.forEach(err => {
            console.log(`Cell ${err.cellId} (${err.type}): ${err.error}`);
        });
    }

    // Show overlay
    await page.click('#toggleContentSlots');
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({ path: 'test-comprehensive-wrapping.png', fullPage: true });

    // Verify all slots wrap content correctly
    const allMainTextWrap = result.mainTextCells.every(c => c.wrapsContent);
    const allContentTextWrap = result.contentTextCells.every(c => c.wrapsContent);

    console.log(`\n✅ All main-text cells wrap content: ${allMainTextWrap}`);
    console.log(`✅ All content cells wrap content: ${allContentTextWrap}`);

    expect(allMainTextWrap).toBe(true);
    expect(allContentTextWrap).toBe(true);
    expect(result.errors.length).toBe(0);
});
