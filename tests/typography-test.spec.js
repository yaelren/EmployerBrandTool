import { test, expect } from '@playwright/test';

test('Typography Available Height Test', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForFunction(() => window.app && window.app.mainTextComponent);
    await page.waitForTimeout(2000);

    const result = await page.evaluate(() => {
        const component = window.app.mainTextComponent;

        // Enable typography
        component.useTypographyHeight = true;

        // Test the available height calculation
        const typographyHeight = component.getTypographyAwareAvailableHeight();
        const standardHeight = component.containerHeight - component.paddingTop - component.paddingBottom;

        return {
            typographyHeight: typographyHeight,
            standardHeight: standardHeight,
            fontSize: component.fontSize,
            text: component.text
        };
    });

    console.log('🎯 TYPOGRAPHY TEST RESULTS:');
    console.log('  Typography height:', result.typographyHeight);
    console.log('  Standard height:', result.standardHeight);
    console.log('  Font size:', result.fontSize);
    console.log('  Text:', JSON.stringify(result.text));

    expect(result.typographyHeight).toBeGreaterThan(50);
    expect(result.typographyHeight).toBeLessThan(result.standardHeight);
});