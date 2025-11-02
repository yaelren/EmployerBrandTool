/**
 * Test: Complete Preset UI Synchronization
 * Verify that ALL mainText UI controls update correctly when loading presets
 * Covers: line spacing, margins, text styles, alignment, and more
 */

import { test, expect } from '@playwright/test';

test.describe('Complete Preset UI Synchronization', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');

        // Clear any existing presets
        await page.evaluate(() => {
            localStorage.clear();
        });
    });

    test('should sync ALL mainText UI controls when loading old-style preset', async ({ page }) => {
        console.log('🧪 Test: Complete UI sync for old-style preset');

        // STEP 1: Configure all mainText properties with non-default values
        console.log('   Step 1: Configuring all mainText properties...');

        const textInput = page.locator('#mainText');
        await textInput.fill('Complete\nUI Sync\nTest');

        // Line spacing
        await page.locator('#lineSpacing').fill('15');

        // Margins
        await page.locator('#marginVertical').fill('10');
        await page.locator('#marginHorizontal').fill('20');

        // Text styles
        await page.click('#mainTextBold');
        await page.click('#mainTextItalic');
        await page.click('#mainTextUnderline');
        await page.click('#mainTextHighlight');

        // Position alignment (top-left)
        await page.click('.pos-btn[data-vertical="top"][data-horizontal="left"]');

        console.log('   ✅ All properties configured');

        // STEP 2: Save as old-style preset
        console.log('   Step 2: Saving old-style preset...');

        // Expand old preset system
        await page.click('button:has-text("Presets")');
        await page.click('.old-preset-toggle');
        await page.waitForTimeout(300);

        const presetNameInput = page.locator('#presetNameInput');
        await presetNameInput.fill('Complete UI Test Preset');

        const saveBtn = page.locator('button.preset-save-local-btn');
        await saveBtn.click();
        await page.waitForTimeout(500);
        console.log('   ✅ Preset saved');

        // STEP 3: Reset all values to defaults
        console.log('   Step 3: Resetting to defaults...');

        await page.click('button:has-text("Main Text")');
        await page.locator('#lineSpacing').fill('0');
        await page.locator('#marginVertical').fill('0');
        await page.locator('#marginHorizontal').fill('0');
        await page.click('#mainTextBold'); // Toggle off
        await page.click('#mainTextItalic');
        await page.click('#mainTextUnderline');
        await page.click('#mainTextHighlight');
        await page.click('.pos-btn[data-vertical="center"][data-horizontal="center"]'); // Center

        console.log('   ✅ Reset to defaults');

        // STEP 4: Load the preset back
        console.log('   Step 4: Loading preset...');

        await page.click('button:has-text("Presets")');
        await page.click('.old-preset-toggle');
        await page.waitForTimeout(300);

        const presetCard = page.locator('.preset-card:has-text("Complete UI Test Preset")');
        await expect(presetCard).toBeVisible();

        const loadBtn = presetCard.locator('button:has-text("Load")');
        await loadBtn.click();
        await page.waitForTimeout(1500);
        console.log('   ✅ Preset loaded');

        // STEP 5: Verify ALL UI controls are synchronized
        console.log('   Step 5: Verifying UI synchronization...');

        await page.click('button:has-text("Main Text")');

        // Check line spacing
        const lineSpacing = await page.locator('#lineSpacing').inputValue();
        expect(lineSpacing).toBe('15');
        console.log('   ✅ Line spacing: ' + lineSpacing);

        // Check margins
        const marginV = await page.locator('#marginVertical').inputValue();
        expect(marginV).toBe('10');
        console.log('   ✅ Margin vertical: ' + marginV);

        const marginH = await page.locator('#marginHorizontal').inputValue();
        expect(marginH).toBe('20');
        console.log('   ✅ Margin horizontal: ' + marginH);

        // Check text style buttons
        await expect(page.locator('#mainTextBold')).toHaveClass(/active/);
        console.log('   ✅ Bold active');

        await expect(page.locator('#mainTextItalic')).toHaveClass(/active/);
        console.log('   ✅ Italic active');

        await expect(page.locator('#mainTextUnderline')).toHaveClass(/active/);
        console.log('   ✅ Underline active');

        await expect(page.locator('#mainTextHighlight')).toHaveClass(/active/);
        console.log('   ✅ Highlight active');

        // Check position alignment
        const topLeftBtn = page.locator('.pos-btn[data-vertical="top"][data-horizontal="left"]');
        await expect(topLeftBtn).toHaveClass(/active/);
        console.log('   ✅ Position alignment: top-left active');

        console.log('✅ Test passed: All UI controls synchronized for old-style preset');
    });

    test('should sync ALL mainText UI controls when loading multi-page preset', async ({ page }) => {
        console.log('🧪 Test: Complete UI sync for multi-page preset');

        // STEP 1: Configure all properties
        console.log('   Step 1: Configuring properties...');

        const textInput = page.locator('#mainText');
        await textInput.fill('Multi-Page\nUI Test');

        await page.locator('#lineSpacing').fill('20');
        await page.locator('#marginVertical').fill('15');
        await page.locator('#marginHorizontal').fill('25');
        await page.click('#mainTextBold');
        await page.click('.pos-btn[data-vertical="bottom"][data-horizontal="right"]');

        console.log('   ✅ Properties configured');

        // STEP 2: Save as multi-page preset
        console.log('   Step 2: Saving multi-page preset...');

        await page.click('button:has-text("Presets")');

        const savePageBtn = page.locator('button.preset-save-page-btn');
        await savePageBtn.click();
        await page.waitForTimeout(500);

        // Fill in save page panel
        const newPresetRadio = page.locator('input[name="save-preset-type"][value="new"]');
        await newPresetRadio.check();

        const presetNameInput = page.locator('#save-new-preset-name');
        await presetNameInput.fill('Multi-Page UI Test');

        const saveActionBtn = page.locator('button.preset-save-page-action-btn');
        await saveActionBtn.click();

        page.once('dialog', dialog => dialog.accept());
        await page.waitForTimeout(1000);
        console.log('   ✅ Multi-page preset saved');

        // STEP 3: Reset to defaults
        console.log('   Step 3: Resetting...');

        await page.click('button:has-text("Main Text")');
        await page.locator('#lineSpacing').fill('0');
        await page.locator('#marginVertical').fill('0');
        await page.locator('#marginHorizontal').fill('0');
        await page.click('#mainTextBold'); // Toggle off
        await page.click('.pos-btn[data-vertical="center"][data-horizontal="center"]');

        console.log('   ✅ Reset');

        // STEP 4: Load multi-page preset
        console.log('   Step 4: Loading multi-page preset...');

        await page.click('button:has-text("Presets")');

        const loadPageBtn = page.locator('button.preset-load-page-btn');
        await loadPageBtn.click();
        await page.waitForTimeout(500);

        // Select preset and page in modal
        const presetCard = page.locator('.preset-card:has-text("Multi-Page UI Test")');
        await presetCard.click();
        await page.waitForTimeout(300);

        const page1Card = page.locator('.page-card:has-text("Page 1")');
        await page1Card.click();
        await page.waitForTimeout(300);

        const loadActionBtn = page.locator('button.load-page-action-btn');
        await loadActionBtn.click();
        await page.waitForTimeout(1500);
        console.log('   ✅ Multi-page preset loaded');

        // STEP 5: Verify UI synchronization
        console.log('   Step 5: Verifying UI...');

        await page.click('button:has-text("Main Text")');

        const lineSpacing = await page.locator('#lineSpacing').inputValue();
        expect(lineSpacing).toBe('20');
        console.log('   ✅ Line spacing: ' + lineSpacing);

        const marginV = await page.locator('#marginVertical').inputValue();
        expect(marginV).toBe('15');
        console.log('   ✅ Margin vertical: ' + marginV);

        const marginH = await page.locator('#marginHorizontal').inputValue();
        expect(marginH).toBe('25');
        console.log('   ✅ Margin horizontal: ' + marginH);

        await expect(page.locator('#mainTextBold')).toHaveClass(/active/);
        console.log('   ✅ Bold active');

        const bottomRightBtn = page.locator('.pos-btn[data-vertical="bottom"][data-horizontal="right"]');
        await expect(bottomRightBtn).toHaveClass(/active/);
        console.log('   ✅ Position: bottom-right active');

        console.log('✅ Test passed: All UI controls synchronized for multi-page preset');
    });

    test('should handle edge cases: zero values and defaults', async ({ page }) => {
        console.log('🧪 Test: Edge cases with zero and default values');

        // Save preset with all zero/default values
        const textInput = page.locator('#mainText');
        await textInput.fill('Zero Values');

        // Explicitly set to zero
        await page.locator('#lineSpacing').fill('0');
        await page.locator('#marginVertical').fill('0');
        await page.locator('#marginHorizontal').fill('0');

        // Save
        await page.click('button:has-text("Presets")');
        await page.click('.old-preset-toggle');
        await page.waitForTimeout(300);

        const presetNameInput = page.locator('#presetNameInput');
        await presetNameInput.fill('Zero Values Preset');
        await page.click('button.preset-save-local-btn');
        await page.waitForTimeout(500);

        // Change to non-zero
        await page.click('button:has-text("Main Text")');
        await page.locator('#lineSpacing').fill('10');
        await page.locator('#marginVertical').fill('5');

        // Load back
        await page.click('button:has-text("Presets")');
        await page.click('.old-preset-toggle');
        await page.waitForTimeout(300);

        const presetCard = page.locator('.preset-card:has-text("Zero Values Preset")');
        const loadBtn = presetCard.locator('button:has-text("Load")');
        await loadBtn.click();
        await page.waitForTimeout(1500);

        // Verify zeros are restored
        await page.click('button:has-text("Main Text")');

        const lineSpacing = await page.locator('#lineSpacing').inputValue();
        expect(lineSpacing).toBe('0');
        console.log('   ✅ Line spacing restored to 0');

        const marginV = await page.locator('#marginVertical').inputValue();
        expect(marginV).toBe('0');
        console.log('   ✅ Margin vertical restored to 0');

        console.log('✅ Test passed: Zero values handled correctly');
    });
});
