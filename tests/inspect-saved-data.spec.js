/**
 * Inspect what's actually being saved to localStorage
 */

import { test } from '@playwright/test';

test('inspect saved preset data structure', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    await page.waitForFunction(() => window.app && window.app.grid);

    // Get what's currently in localStorage
    const currentData = await page.evaluate(() => {
        const data = localStorage.getItem('chatooly_multipage_presets');
        if (!data) return null;

        const parsed = JSON.parse(data);
        return parsed.map(preset => ({
            presetName: preset.presetName,
            presetId: preset._id,
            pages: {
                page1: preset.page1 ? JSON.parse(preset.page1) : null,
                page2: preset.page2 ? JSON.parse(preset.page2) : null,
                page3: preset.page3 ? JSON.parse(preset.page3) : null,
            }
        }));
    });

    console.log('\n📦 CURRENT LOCALSTORAGE DATA:\n');
    console.log(JSON.stringify(currentData, null, 2));

    if (currentData && currentData.length > 0) {
        currentData.forEach((preset, idx) => {
            console.log(`\n━━━ PRESET ${idx + 1}: ${preset.presetName} ━━━`);

            ['page1', 'page2', 'page3'].forEach(pageKey => {
                const pageData = preset.pages[pageKey];
                if (pageData) {
                    console.log(`\n  📄 ${pageKey.toUpperCase()}:`);
                    console.log(`     Page Name: ${pageData.pageName}`);
                    console.log(`     Page Number: ${pageData.pageNumber}`);
                    console.log(`     Font Size: ${pageData.mainText?.fontSize}`);
                    console.log(`     Main Text: ${pageData.mainText?.content?.substring(0, 50)}...`);
                    console.log(`     Grid: ${pageData.grid?.rows}x${pageData.grid?.cols}`);
                    console.log(`     Has Background Image: ${!!pageData.background?.imageURL}`);
                    console.log(`     Canvas Size: ${pageData.canvas?.width}x${pageData.canvas?.height}`);

                    // Check grid snapshot for content cells
                    if (pageData.grid?.snapshot?.layout?.cells) {
                        const cells = pageData.grid.snapshot.layout.cells;
                        const contentCells = cells.filter(c => c.contentType === 'media' || c.type === 'content');
                        console.log(`     Content Cells: ${contentCells.length}`);

                        contentCells.forEach((cell, i) => {
                            console.log(`       Cell ${i + 1}: type=${cell.type}, contentType=${cell.contentType}`);
                            if (cell.content) {
                                console.log(`         Has media: ${!!cell.content.media}`);
                                console.log(`         Media type: ${cell.content.mediaType}`);
                            }
                        });
                    }
                }
            });
        });
    }

    // Also check what's on canvas right now
    const canvasState = await page.evaluate(() => {
        return {
            fontSize: window.app.mainTextFontSize,
            mainText: window.app.mainTextContent,
            canvasWidth: window.app.canvasManager.canvas.width,
            canvasHeight: window.app.canvasManager.canvas.height,
            gridRows: window.app.grid?.rows,
            gridCols: window.app.grid?.cols
        };
    });

    console.log('\n\n🎨 CURRENT CANVAS STATE:');
    console.log(JSON.stringify(canvasState, null, 2));
});
