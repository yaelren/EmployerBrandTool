import { test, expect } from '@playwright/test';

test.describe('Text Bounds and Typography Inspection', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the application
        await page.goto('http://localhost:3000');

        // Wait for the application to be ready
        await page.waitForFunction(() => window.app && window.app.mainTextComponent);

        // Wait a bit for initialization
        await page.waitForTimeout(2000);
    });

    test('Compare Typography vs Standard Text Bounds', async ({ page }) => {
        console.log('🔍 Starting text bounds comparison test...');

        // Test with typography HEIGHT DISABLED first (standard behavior)
        await page.evaluate(() => {
            window.app.mainTextComponent.useTypographyHeight = false;
            window.app.render();
        });

        // Capture debug info for standard behavior
        const standardDebug = await page.evaluate(() => {
            const component = window.app.mainTextComponent;
            component.debugTextBounds();

            return {
                useTypographyHeight: component.useTypographyHeight,
                text: component.text,
                fontSize: component.fontSize,
                availableHeight: component.getAvailableHeight(),
                containerHeight: component.containerHeight,
                paddingTop: component.paddingTop,
                paddingBottom: component.paddingBottom,
                basicHeight: component.containerHeight - component.paddingTop - component.paddingBottom
            };
        });

        console.log('📏 STANDARD BEHAVIOR:', standardDebug);

        // Take screenshot of standard behavior
        await page.screenshot({
            path: 'tests/screenshots/text-bounds-standard.png',
            fullPage: true
        });

        // Now test with typography HEIGHT ENABLED
        await page.evaluate(() => {
            window.app.mainTextComponent.useTypographyHeight = true;
            window.app.render();
        });

        // Capture debug info for typography behavior
        const typographyDebug = await page.evaluate(() => {
            const component = window.app.mainTextComponent;
            component.debugTextBounds();

            const metrics = component.getFontMetrics();

            return {
                useTypographyHeight: component.useTypographyHeight,
                text: component.text,
                fontSize: component.fontSize,
                availableHeight: component.getAvailableHeight(),
                containerHeight: component.containerHeight,
                paddingTop: component.paddingTop,
                paddingBottom: component.paddingBottom,
                basicHeight: component.containerHeight - component.paddingTop - component.paddingBottom,
                fontMetrics: metrics,
                hasCapitals: component.hasCapitalLetters(component.text)
            };
        });

        console.log('📐 TYPOGRAPHY BEHAVIOR:', typographyDebug);

        // Take screenshot of typography behavior
        await page.screenshot({
            path: 'tests/screenshots/text-bounds-typography.png',
            fullPage: true
        });

        // Verify the differences
        expect(standardDebug.useTypographyHeight).toBe(false);
        expect(typographyDebug.useTypographyHeight).toBe(true);
        expect(standardDebug.availableHeight).toBeGreaterThan(typographyDebug.availableHeight);

        console.log(`📊 Height difference: ${standardDebug.availableHeight}px → ${typographyDebug.availableHeight}px (${Math.round((1 - typographyDebug.availableHeight / standardDebug.availableHeight) * 100)}% reduction)`);
    });

    test('Inspect Text Rendering and Line Positioning', async ({ page }) => {
        console.log('🎯 Inspecting text rendering details...');

        // Enable typography and get detailed rendering info
        const renderingInfo = await page.evaluate(() => {
            const component = window.app.mainTextComponent;
            component.useTypographyHeight = true;

            // Get canvas context to inspect rendering
            const canvas = document.querySelector('canvas');
            const ctx = canvas.getContext('2d');

            // Get text lines and measurements
            const availableWidth = component.getAvailableWidth();
            const fontSize = component.fontSize === 'auto' ?
                component.calculateAutoFontSize(ctx) : component.fontSize;

            const lines = component.wrapTextToLines(ctx, component.text, availableWidth, fontSize);

            // Calculate line heights both ways
            const standardLineHeights = lines.map(() => fontSize);
            const typographyLineHeights = lines.map(line => component.getLineHeight(line, fontSize));

            return {
                fontSize: fontSize,
                lines: lines,
                linesCount: lines.length,
                availableWidth: availableWidth,
                availableHeight: component.getAvailableHeight(),
                standardLineHeights: standardLineHeights,
                typographyLineHeights: typographyLineHeights,
                standardTotalHeight: standardLineHeights.reduce((sum, h) => sum + h, 0) +
                    (lines.length - 1) * component.lineSpacing,
                typographyTotalHeight: typographyLineHeights.reduce((sum, h) => sum + h, 0) +
                    (lines.length - 1) * component.lineSpacing,
                lineSpacing: component.lineSpacing
            };
        });

        console.log('📝 RENDERING INFO:', renderingInfo);

        // Log line-by-line comparison
        renderingInfo.lines.forEach((line, index) => {
            console.log(`  Line ${index + 1}: "${line.trim()}"`);
            console.log(`    Standard height: ${renderingInfo.standardLineHeights[index]}px`);
            console.log(`    Typography height: ${renderingInfo.typographyLineHeights[index]}px`);
        });

        console.log(`📏 Total height comparison:`);
        console.log(`  Standard: ${renderingInfo.standardTotalHeight}px`);
        console.log(`  Typography: ${renderingInfo.typographyTotalHeight}px`);
        console.log(`  Available: ${renderingInfo.availableHeight}px`);
    });

    test('Test Spot Detection with Different Text Bounds', async ({ page }) => {
        console.log('🎲 Testing spot detection with typography bounds...');

        // Test spot detection with standard bounds
        await page.evaluate(() => {
            window.app.mainTextComponent.useTypographyHeight = false;
            window.app.render();
        });

        await page.click('#findSpots');
        await page.waitForTimeout(1000);

        const standardSpots = await page.evaluate(() => {
            const spots = window.app.spotDetector?.spots || [];
            return {
                spotsCount: spots.length,
                textBounds: window.app.mainTextComponent.getAvailableHeight(),
                spotsData: spots.map(spot => ({
                    x: spot.x,
                    y: spot.y,
                    width: spot.width,
                    height: spot.height,
                    type: spot.type
                }))
            };
        });

        console.log('🔳 STANDARD SPOTS:', standardSpots);

        // Take screenshot of standard spot detection
        await page.screenshot({
            path: 'tests/screenshots/spots-standard.png',
            fullPage: true
        });

        // Test spot detection with typography bounds
        await page.evaluate(() => {
            window.app.mainTextComponent.useTypographyHeight = true;
            window.app.render();
        });

        await page.click('#findSpots');
        await page.waitForTimeout(1000);

        const typographySpots = await page.evaluate(() => {
            const spots = window.app.spotDetector?.spots || [];
            return {
                spotsCount: spots.length,
                textBounds: window.app.mainTextComponent.getAvailableHeight(),
                spotsData: spots.map(spot => ({
                    x: spot.x,
                    y: spot.y,
                    width: spot.width,
                    height: spot.height,
                    type: spot.type
                }))
            };
        });

        console.log('📐 TYPOGRAPHY SPOTS:', typographySpots);

        // Take screenshot of typography spot detection
        await page.screenshot({
            path: 'tests/screenshots/spots-typography.png',
            fullPage: true
        });

        // Compare spot detection results
        console.log(`🔍 Spot detection comparison:`);
        console.log(`  Standard: ${standardSpots.spotsCount} spots (text bounds: ${standardSpots.textBounds}px)`);
        console.log(`  Typography: ${typographySpots.spotsCount} spots (text bounds: ${typographySpots.textBounds}px)`);
    });

    test('Verify Debug Outlines and Grid Alignment', async ({ page }) => {
        console.log('🔧 Testing debug outlines and grid alignment...');

        // Enable debug outlines
        await page.check('#showGridlines');
        await page.check('#showTextBounds');
        await page.check('#showSpotNumbers');

        // Test both typography modes
        for (const useTypography of [false, true]) {
            const mode = useTypography ? 'typography' : 'standard';
            console.log(`🔍 Testing ${mode} mode...`);

            await page.evaluate((useTypo) => {
                window.app.mainTextComponent.useTypographyHeight = useTypo;
                window.app.render();
            }, useTypography);

            await page.click('#findSpots');
            await page.waitForTimeout(1000);

            // Capture debug info
            const debugInfo = await page.evaluate(() => {
                const component = window.app.mainTextComponent;
                return {
                    mode: component.useTypographyHeight ? 'typography' : 'standard',
                    containerX: component.containerX,
                    containerY: component.containerY,
                    containerWidth: component.containerWidth,
                    containerHeight: component.containerHeight,
                    paddingTop: component.paddingTop,
                    paddingBottom: component.paddingBottom,
                    paddingLeft: component.paddingLeft,
                    paddingRight: component.paddingRight,
                    availableHeight: component.getAvailableHeight(),
                    availableWidth: component.getAvailableWidth()
                };
            });

            console.log(`📋 ${mode.toUpperCase()} DEBUG INFO:`, debugInfo);

            // Take screenshot with debug outlines
            await page.screenshot({
                path: `tests/screenshots/debug-outlines-${mode}.png`,
                fullPage: true
            });
        }
    });
});