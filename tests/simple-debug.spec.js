import { test, expect } from '@playwright/test';

test('Simple Font Metrics Debug', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForFunction(() => window.app && window.app.mainTextComponent);
    await page.waitForTimeout(2000);

    const debugInfo = await page.evaluate(() => {
        const component = window.app.mainTextComponent;

        console.log('=== SIMPLE DEBUG ===');
        console.log('Text:', component.text);
        console.log('Container dimensions:', component.containerWidth, 'x', component.containerHeight);
        console.log('Padding:', {top: component.paddingTop, bottom: component.paddingBottom});
        console.log('fontSize property:', component.fontSize);

        // Test FontMetrics directly
        const testSize = 100;
        const metrics = component.getFontMetrics(testSize);
        console.log('FontMetrics for 100px:', metrics);

        // Check if auto font size calculation is the problem
        const canvas = document.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        const autoSize = component.fontSize === 'auto' ? component.calculateAutoFontSize(ctx) : component.fontSize;
        console.log('Auto calculated size:', autoSize);

        return {
            text: component.text,
            fontSize: component.fontSize,
            autoCalculatedSize: autoSize,
            containerHeight: component.containerHeight,
            availableHeight: component.containerHeight - component.paddingTop - component.paddingBottom,
            testMetrics: metrics
        };
    });

    console.log('Debug Info:', debugInfo);
});