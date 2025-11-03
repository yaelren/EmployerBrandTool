/**
 * Test CellRenderer fit mode behavior
 * Verify that fit mode scales from natural dimensions vs cell-relative
 */

import { test, expect } from '@playwright/test';

test('verify CellRenderer fit mode uses natural dimensions × scale', async ({ page }) => {
    await page.goto('http://localhost:5502');
    await page.waitForFunction(() => window.app && window.app.isInitialized);

    const result = await page.evaluate(async () => {
        const cells = window.app.grid.getAllCells();
        const contentCell = cells.find(c => c.type === 'content' && c.id !== 1 && c.id !== 11);

        if (!contentCell) return { error: 'No content cell found' };

        // Create a known-size image: 100x100px
        const img = new Image();
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwZmYwMCIvPjwvc3ZnPg==';

        await new Promise(resolve => { img.onload = resolve; });

        // Set with scale = 2.0 in fit mode
        contentCell.content = {
            type: 'media',
            mediaType: 'image',
            media: img,
            scale: 2.0,
            fillMode: 'fit',
            positionH: 'center',
            positionV: 'middle'
        };

        // Render and capture what was drawn
        window.app.render();

        // Check what dimensions the image thinks it is
        const cellBounds = contentCell.bounds;
        const naturalDims = { width: img.naturalWidth, height: img.naturalHeight };

        // Calculate what ContentSlotManager would return
        const slot = window.app.presetPageManager.contentSlotManager.createSlotFromCell(contentCell, {
            fieldName: 'testImage',
            fieldLabel: 'Test Image',
            required: false
        });

        return {
            success: true,
            cellBounds,
            naturalDimensions: naturalDims,
            scale: 2.0,
            slotDimensions: { width: slot.boundingBox.width, height: slot.boundingBox.height },
            expectedFromNatural: { width: 100 * 2.0, height: 100 * 2.0 },
            usesNaturalDimensions: Math.abs(slot.boundingBox.width - 200) < 2
        };
    });

    console.log('\n📊 CellRenderer Fit Mode Test:');
    console.log('Cell bounds:', result.cellBounds);
    console.log('Natural dimensions:', result.naturalDimensions);
    console.log('Scale:', result.scale);
    console.log('Slot dimensions:', result.slotDimensions);
    console.log('Expected (natural × scale):', result.expectedFromNatural);
    console.log('Uses natural dimensions:', result.usesNaturalDimensions);

    await page.screenshot({ path: 'test-cellrenderer-fit-mode.png', fullPage: true });

    expect(result.success).toBe(true);
    expect(result.usesNaturalDimensions).toBe(true);

    console.log('\n✅ CellRenderer fit mode correctly uses natural dimensions!');
});
