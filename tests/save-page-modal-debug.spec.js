import { test, expect } from '@playwright/test';

test.describe('Save Page Modal - Canvas Elements Detection', () => {
    test('should detect and show canvas elements that already exist', async ({ page }) => {
        // Navigate to the app
        await page.goto('http://localhost:3000');

        // Wait for app to initialize
        await page.waitForSelector('canvas', { timeout: 10000 });
        await page.waitForTimeout(3000); // Wait for everything to load

        console.log('✅ App loaded, checking existing canvas content');

        // Now check grid status in console
        const gridStatus = await page.evaluate(() => {
            const grid = window.app?.grid;
            if (!grid) return { error: 'No grid found' };

            const status = grid.getStatus();
            const allCells = grid.getAllCells();

            console.log('=== GRID DEBUG ===');
            console.log('Grid Status:', status);
            console.log('Total cells from getAllCells():', allCells.length);

            const cellsInfo = allCells.map(cell => ({
                row: cell.row,
                col: cell.col,
                type: cell.type,
                isEmpty: cell.isEmpty,
                hasContent: !!cell.content,
                contentType: cell.content?.type,
                contentPreview: cell.type === 'text' ? cell.content?.substring(0, 30) : '[non-text]'
            }));

            console.log('Cells:', cellsInfo);

            return {
                status,
                totalCells: allCells.length,
                cells: cellsInfo
            };
        });

        console.log('📊 Grid Status:', JSON.stringify(gridStatus, null, 2));

        // Go to Presets tab
        await page.click('button:has-text("Presets")');
        await page.waitForTimeout(500);

        console.log('✅ Switched to Presets tab');

        // Click "Save Page to Preset" button
        const savePageButton = page.locator('button.preset-save-page-btn');
        await expect(savePageButton).toBeVisible();
        await savePageButton.click();
        await page.waitForTimeout(1000);

        console.log('✅ Save Page Modal opened');

        // Check if modal is visible
        const modal = page.locator('.save-page-modal-overlay');
        await expect(modal).toBeVisible();

        // Take screenshot of modal
        await page.screenshot({ path: 'tests/screenshots/save-page-modal-elements.png', fullPage: true });

        // Check canvas elements container
        const elementsContainer = page.locator('#save-page-elements-container');
        await expect(elementsContainer).toBeVisible();

        // Get the HTML content of the elements container
        const elementsHTML = await elementsContainer.innerHTML();
        console.log('📋 Elements Container HTML:', elementsHTML);

        // Count how many checkboxes are shown
        const checkboxes = elementsContainer.locator('.element-checkbox-item');
        const checkboxCount = await checkboxes.count();
        console.log(`📊 Number of canvas elements shown: ${checkboxCount}`);

        // Get details of each checkbox
        for (let i = 0; i < checkboxCount; i++) {
            const checkbox = checkboxes.nth(i);
            const text = await checkbox.textContent();
            console.log(`  ${i + 1}. ${text}`);
        }

        // Verify we have at least some elements
        if (checkboxCount === 0) {
            console.log('❌ NO ELEMENTS FOUND!');

            // Debug: Check if renderCanvasOverlay was called
            const renderDebug = await page.evaluate(() => {
                const grid = window.app?.grid;
                if (!grid) return 'No grid';

                const allCells = grid.getAllCells();
                return {
                    gridExists: !!grid,
                    cellCount: allCells.length,
                    cells: allCells.map(c => ({
                        row: c.row,
                        col: c.col,
                        type: c.type,
                        isEmpty: c.isEmpty
                    }))
                };
            });
            console.log('🔍 Render Debug:', JSON.stringify(renderDebug, null, 2));
        }

        // Keep modal open for inspection
        await page.waitForTimeout(2000);

        // Assertion: We should have at least 1 element (the main text or the image)
        expect(checkboxCount).toBeGreaterThan(0);
    });
});
