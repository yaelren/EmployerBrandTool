import { test, expect } from '@playwright/test';

test('Final Typography System Verification', async ({ page }) => {
    console.log('🔍 Starting final verification test...');

    await page.goto('http://localhost:3000');
    await page.waitForFunction(() => window.app && window.app.mainTextComponent);
    await page.waitForTimeout(3000);

    // Test 1: Standard behavior
    console.log('📏 Testing STANDARD behavior...');
    const standardResults = await page.evaluate(() => {
        const component = window.app.mainTextComponent;
        component.useTypographyHeight = false;
        window.app.render();

        return {
            mode: 'standard',
            availableHeight: component.getAvailableHeight(),
            fontSize: component.fontSize,
            actualFontSize: component.fontSize === 'auto' ?
                component.calculateAutoFontSize(document.querySelector('canvas').getContext('2d')) :
                component.fontSize
        };
    });
    console.log('Standard results:', standardResults);

    await page.screenshot({
        path: 'tests/screenshots/final-standard.png',
        fullPage: true
    });

    // Test 2: Typography behavior
    console.log('📐 Testing TYPOGRAPHY behavior...');
    const typographyResults = await page.evaluate(() => {
        const component = window.app.mainTextComponent;
        component.useTypographyHeight = true;
        window.app.render();

        const metrics = component.getFontMetrics();

        return {
            mode: 'typography',
            availableHeight: component.getAvailableHeight(),
            fontSize: component.fontSize,
            actualFontSize: component.fontSize === 'auto' ?
                component.calculateAutoFontSize(document.querySelector('canvas').getContext('2d')) :
                component.fontSize,
            metrics: metrics ? {
                xHeight: metrics.xHeight,
                capHeight: metrics.capHeight,
                ascent: metrics.ascent,
                descent: metrics.descent
            } : null,
            hasCapitals: component.hasCapitalLetters(component.text),
            text: component.text
        };
    });
    console.log('Typography results:', typographyResults);

    await page.screenshot({
        path: 'tests/screenshots/final-typography.png',
        fullPage: true
    });

    // Test 3: Compare the differences
    console.log('🔄 Comparison analysis...');
    console.log(`Available height: ${standardResults.availableHeight}px → ${typographyResults.availableHeight}px`);
    console.log(`Reduction: ${Math.round((1 - typographyResults.availableHeight / standardResults.availableHeight) * 100)}%`);

    if (typographyResults.metrics) {
        console.log('Font metrics (120px):', {
            xHeight: `${typographyResults.metrics.xHeight}px`,
            capHeight: `${typographyResults.metrics.capHeight}px`,
            ascent: `${typographyResults.metrics.ascent}px`,
            descent: `${typographyResults.metrics.descent}px`
        });
        console.log(`Using: ${typographyResults.hasCapitals ? 'cap-height' : 'x-height'} (${typographyResults.availableHeight}px)`);
    }

    // Assertions to verify everything is working
    expect(standardResults.actualFontSize).toBeGreaterThan(100); // Font size should be reasonable
    expect(typographyResults.actualFontSize).toEqual(standardResults.actualFontSize); // Font size calculation should be consistent
    expect(typographyResults.availableHeight).toBeGreaterThan(50); // Typography height should be reasonable
    expect(typographyResults.availableHeight).toBeLessThan(standardResults.availableHeight); // Typography should be smaller than standard
    expect(typographyResults.metrics).not.toBeNull(); // FontMetrics should be working

    console.log('✅ All verifications passed!');
});