/**
 * Test for multi-line text wrapping in content cells
 * Verifies that content slots correctly wrap multi-line text
 */

import { test, expect } from '@playwright/test';

test('should wrap multi-line text in content cell correctly', async ({ page }) => {
    await page.goto('http://localhost:5502');
    await page.waitForFunction(() => window.app && window.app.isInitialized);

    const result = await page.evaluate(() => {
        const cells = window.app.grid.getAllCells();
        // Find a content cell
        const contentCell = cells.find(c => c.type === 'content' && c.id !== 1 && c.id !== 11);

        if (!contentCell) return { error: 'No content cell found' };

        // Add multi-line text content
        contentCell.content = {
            type: 'text',
            text: 'We asked our employees about their 2025 resolutions.',
            fontSize: 'auto',  // Auto-size like in real preset
            fontFamily: '"Wix Madefor Display", Arial, sans-serif',
            color: '#ffffff',
            textAlign: 'left',
            positionH: 'left',
            positionV: 'middle',
            padding: 1
        };

        // Render to ensure cell is displayed
        window.app.render();

        // Create slot (this will create textComponent if needed)
        const config = {
            fieldName: 'multilineText',
            fieldLabel: 'Multi-line Text',
            required: true,
            constraints: {
                maxCharacters: 100,
                minFontSize: 12,
                maxFontSize: 48
            }
        };

        try {
            const slot = window.app.presetPageManager.contentSlotManager.createSlotFromCell(contentCell, config);
            window.app.presetPageManager.contentSlotManager.addSlot(slot);

            // Check if textComponent was created during slot creation
            const hasTextComponent = !!contentCell.textComponent;
            const hasCalculateMethod = hasTextComponent && typeof contentCell.textComponent.getTextBounds === 'function';

            // Get text bounds if available
            let textBounds = null;
            if (hasCalculateMethod) {
                const ctx = window.app.canvasManager.ctx;
                textBounds = contentCell.textComponent.getTextBounds(ctx);
            }

            return {
                success: true,
                cellId: contentCell.id,
                text: contentCell.content.text,
                hasTextComponent,
                hasCalculateMethod,
                textBoundsLineCount: textBounds ? textBounds.length : 0,
                cellBounds: contentCell.bounds,
                slotBounds: slot.boundingBox,
                textBounds: textBounds
            };
        } catch (error) {
            return {
                error: error.message,
                stack: error.stack,
                hasTextComponent: !!contentCell.textComponent,
                hasCalculateMethod: false
            };
        }
    });

    console.log('\n📊 MULTI-LINE TEXT TEST RESULT:');
    console.log('Text:', result.text);
    console.log('Has textComponent:', result.hasTextComponent);
    console.log('Has calculateTextBoundsPerLine:', result.hasCalculateMethod);
    console.log('Text bounds line count:', result.textBoundsLineCount);
    console.log('\nCell bounds:', result.cellBounds);
    console.log('Slot bounds:', result.slotBounds);

    if (result.textBounds) {
        console.log('\nText bounds per line:');
        result.textBounds.forEach((line, i) => {
            console.log(`  Line ${i}: "${line.text}" at (${line.x.toFixed(1)}, ${line.y.toFixed(1)}) ${line.width.toFixed(1)}×${line.height.toFixed(1)}`);
        });
    }

    // Show overlay
    await page.click('#toggleContentSlots');
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({ path: 'test-multiline-wrapping.png', fullPage: true });

    expect(result.success).toBe(true);
    expect(result.hasTextComponent).toBe(true);
    expect(result.hasCalculateMethod).toBe(true);
    expect(result.textBoundsLineCount).toBeGreaterThan(1); // Should have multiple lines
});
