/**
 * Debug the live instance to check saved data
 */

import { test } from '@playwright/test';

test('inspect live instance localStorage', async ({ page }) => {
    // Connect to your live server
    await page.goto('http://127.0.0.1:5502/');
    await page.waitForLoadState('networkidle');

    console.log('✅ Connected to live instance');

    await page.waitForFunction(() => window.app && window.app.grid, { timeout: 10000 });

    console.log('✅ App loaded');

    // Get localStorage data
    const result = await page.evaluate(() => {
        const data = localStorage.getItem('chatooly_multipage_presets');
        if (!data) return { error: 'No data in localStorage' };

        try {
            const parsed = JSON.parse(data);
            const preset = parsed[0];

            const result = {
                presetName: preset.presetName,
                presetId: preset._id,
                pages: {}
            };

            // Check each page
            ['page1', 'page2', 'page3', 'page4', 'page5'].forEach(pageKey => {
                if (preset[pageKey]) {
                    try {
                        const pageData = JSON.parse(preset[pageKey]);
                        result.pages[pageKey] = {
                            pageName: pageData.pageName,
                            pageNumber: pageData.pageNumber,
                            fontSize: pageData.mainText?.fontSize,
                            mainTextPreview: pageData.mainText?.content?.substring(0, 50),
                            gridRows: pageData.grid?.rows,
                            gridCols: pageData.grid?.cols,
                            canvasWidth: pageData.canvas?.width,
                            canvasHeight: pageData.canvas?.height,
                            hasBackgroundImage: !!pageData.background?.imageURL,
                            backgroundImageURL: pageData.background?.imageURL?.substring(0, 100),
                            cellCount: pageData.grid?.snapshot?.layout?.cells?.length || 0
                        };

                        // Check for content cells with media
                        if (pageData.grid?.snapshot?.layout?.cells) {
                            const cells = pageData.grid.snapshot.layout.cells;
                            const mediaCells = cells.filter(c =>
                                (c.type === 'content' && c.contentType === 'media') ||
                                (c.content && c.content.media)
                            );
                            result.pages[pageKey].mediaCellCount = mediaCells.length;

                            if (mediaCells.length > 0) {
                                result.pages[pageKey].mediaCells = mediaCells.map(c => ({
                                    id: c.id,
                                    row: c.row,
                                    col: c.col,
                                    contentType: c.contentType,
                                    hasMedia: !!c.content?.media,
                                    mediaType: c.content?.mediaType
                                }));
                            }
                        }
                    } catch (e) {
                        result.pages[pageKey] = { error: e.message };
                    }
                }
            });

            // Current canvas state
            result.currentCanvas = {
                fontSize: window.app.mainTextFontSize,
                mainText: window.app.mainTextContent?.substring(0, 50),
                canvasWidth: window.app.canvasManager?.canvas?.width,
                canvasHeight: window.app.canvasManager?.canvas?.height,
                gridRows: window.app.grid?.rows,
                gridCols: window.app.grid?.cols
            };

            return result;
        } catch (e) {
            return { error: 'Parse error: ' + e.message };
        }
    });

    console.log('\n📦 SAVED PRESET DATA:');
    console.log('Preset Name:', result.presetName);
    console.log('Preset ID:', result.presetId);
    console.log('\n');

    Object.keys(result.pages).forEach(pageKey => {
        const page = result.pages[pageKey];
        console.log(`━━━ ${pageKey.toUpperCase()} ━━━`);
        console.log('  Page Name:', page.pageName);
        console.log('  Page Number:', page.pageNumber);
        console.log('  Font Size:', page.fontSize);
        console.log('  Main Text:', page.mainTextPreview);
        console.log('  Grid:', `${page.gridRows}x${page.gridCols}`);
        console.log('  Canvas:', `${page.canvasWidth}x${page.canvasHeight}`);
        console.log('  Cell Count:', page.cellCount);
        console.log('  Media Cells:', page.mediaCellCount);
        if (page.mediaCells) {
            page.mediaCells.forEach(cell => {
                console.log(`    • Cell [${cell.row}][${cell.col}]: ${cell.contentType}, hasMedia=${cell.hasMedia}`);
            });
        }
        console.log('  Has Background Image:', page.hasBackgroundImage);
        if (page.backgroundImageURL) {
            console.log('  Background URL:', page.backgroundImageURL + '...');
        }
        console.log('');
    });

    console.log('━━━ CURRENT CANVAS STATE ━━━');
    console.log('  Font Size:', result.currentCanvas.fontSize);
    console.log('  Main Text:', result.currentCanvas.mainText);
    console.log('  Canvas:', `${result.currentCanvas.canvasWidth}x${result.currentCanvas.canvasHeight}`);
    console.log('  Grid:', `${result.currentCanvas.gridRows}x${result.currentCanvas.gridCols}`);
});
