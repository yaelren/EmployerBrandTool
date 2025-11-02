/**
 * Test: Preset Loading - Alignment UI Synchronization
 * Verify that position alignment buttons update correctly when loading a preset
 */

import { test, expect } from '@playwright/test';

test.describe('Preset Alignment UI Synchronization', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');

        // Clear any existing presets
        await page.evaluate(() => {
            localStorage.clear();
        });
    });

    test('should update position button UI when loading preset with custom alignment', async ({ page }) => {
        console.log('🧪 Test: Position button UI sync on preset load');

        // STEP 1: Set up custom text with top-left alignment
        console.log('   Step 1: Setting custom alignment (top-left)...');

        const textInput = page.locator('#mainText');
        await textInput.fill('Test Alignment\nPreset Loading');

        // Click top-left position button
        const topLeftBtn = page.locator('.pos-btn[data-vertical="top"][data-horizontal="left"]');
        await topLeftBtn.click();

        // Verify button is active
        await expect(topLeftBtn).toHaveClass(/active/);
        console.log('   ✅ Top-left alignment button activated');

        // STEP 2: Save as preset
        console.log('   Step 2: Saving preset...');

        // Navigate to Presets tab
        await page.click('button:has-text("Presets")');

        // Fill preset name and save
        const presetNameInput = page.locator('#presetName');
        await presetNameInput.fill('Alignment Test Preset');

        const saveBtn = page.locator('button.preset-save-local-btn');
        await saveBtn.click();

        // Wait for save confirmation
        await page.waitForTimeout(500);
        console.log('   ✅ Preset saved');

        // STEP 3: Change alignment to something different
        console.log('   Step 3: Changing alignment to bottom-right...');

        await page.click('button:has-text("Main Text")');

        const bottomRightBtn = page.locator('.pos-btn[data-vertical="bottom"][data-horizontal="right"]');
        await bottomRightBtn.click();

        await expect(bottomRightBtn).toHaveClass(/active/);
        await expect(topLeftBtn).not.toHaveClass(/active/);
        console.log('   ✅ Changed to bottom-right alignment');

        // STEP 4: Load the preset back
        console.log('   Step 4: Loading preset back...');

        await page.click('button:has-text("Presets")');

        const presetCard = page.locator('.preset-card:has-text("Alignment Test Preset")');
        await expect(presetCard).toBeVisible();

        const loadBtn = presetCard.locator('button:has-text("Load")');
        await loadBtn.click();

        // Wait for preset to load
        await page.waitForTimeout(1000);
        console.log('   ✅ Preset loaded');

        // STEP 5: Verify position button UI is synchronized
        console.log('   Step 5: Verifying UI synchronization...');

        await page.click('button:has-text("Main Text")');

        // Check that top-left button is active again
        await expect(topLeftBtn).toHaveClass(/active/);
        console.log('   ✅ Top-left button is active');

        // Check that bottom-right is NOT active
        await expect(bottomRightBtn).not.toHaveClass(/active/);
        console.log('   ✅ Other buttons are inactive');

        // STEP 6: Verify the actual alignment values in component
        const alignmentValues = await page.evaluate(() => {
            return {
                alignH: window.app.mainTextComponent.alignH,
                alignV: window.app.mainTextComponent.alignV
            };
        });

        expect(alignmentValues.alignH).toBe('left');
        expect(alignmentValues.alignV).toBe('top');
        console.log('   ✅ Component has correct alignment values:', alignmentValues);

        console.log('✅ Test passed: Position button UI synchronized correctly');
    });

    test('should handle center alignment correctly', async ({ page }) => {
        console.log('🧪 Test: Center alignment UI sync');

        // Set text with center alignment (default)
        const textInput = page.locator('#mainText');
        await textInput.fill('Centered Text');

        // Center button should be active by default
        const centerBtn = page.locator('.pos-btn[data-vertical="center"][data-horizontal="center"]');
        await expect(centerBtn).toHaveClass(/active/);

        // Save preset
        await page.click('button:has-text("Presets")');
        const presetNameInput = page.locator('#presetName');
        await presetNameInput.fill('Center Alignment Preset');
        const saveBtn = page.locator('button.preset-save-local-btn');
        await saveBtn.click();
        await page.waitForTimeout(500);

        // Change to top-right
        await page.click('button:has-text("Main Text")');
        const topRightBtn = page.locator('.pos-btn[data-vertical="top"][data-horizontal="right"]');
        await topRightBtn.click();
        await expect(topRightBtn).toHaveClass(/active/);

        // Load preset back
        await page.click('button:has-text("Presets")');
        const presetCard = page.locator('.preset-card:has-text("Center Alignment Preset")');
        const loadBtn = presetCard.locator('button:has-text("Load")');
        await loadBtn.click();
        await page.waitForTimeout(1000);

        // Verify center button is active again
        await page.click('button:has-text("Main Text")');
        await expect(centerBtn).toHaveClass(/active/);
        await expect(topRightBtn).not.toHaveClass(/active/);

        console.log('✅ Test passed: Center alignment UI synchronized correctly');
    });

    test('should handle all 9 position alignments correctly', async ({ page }) => {
        console.log('🧪 Test: All 9 position alignments');

        const positions = [
            { v: 'top', h: 'left', name: 'Top-Left' },
            { v: 'top', h: 'center', name: 'Top-Center' },
            { v: 'top', h: 'right', name: 'Top-Right' },
            { v: 'center', h: 'left', name: 'Center-Left' },
            { v: 'center', h: 'center', name: 'Center-Center' },
            { v: 'center', h: 'right', name: 'Center-Right' },
            { v: 'bottom', h: 'left', name: 'Bottom-Left' },
            { v: 'bottom', h: 'center', name: 'Bottom-Center' },
            { v: 'bottom', h: 'right', name: 'Bottom-Right' }
        ];

        for (const pos of positions) {
            console.log(`   Testing ${pos.name}...`);

            // Set alignment
            await page.click('button:has-text("Main Text")');
            const posBtn = page.locator(`.pos-btn[data-vertical="${pos.v}"][data-horizontal="${pos.h}"]`);
            await posBtn.click();

            // Save preset
            await page.click('button:has-text("Presets")');
            const presetNameInput = page.locator('#presetName');
            await presetNameInput.fill(`Preset ${pos.name}`);
            const saveBtn = page.locator('button.preset-save-local-btn');
            await saveBtn.click();
            await page.waitForTimeout(300);

            // Change to different alignment
            await page.click('button:has-text("Main Text")');
            const centerBtn = page.locator('.pos-btn[data-vertical="center"][data-horizontal="center"]');
            await centerBtn.click();

            // Load preset back
            await page.click('button:has-text("Presets")');
            const presetCard = page.locator(`.preset-card:has-text("Preset ${pos.name}")`);
            const loadBtn = presetCard.locator('button:has-text("Load")');
            await loadBtn.click();
            await page.waitForTimeout(500);

            // Verify correct button is active
            await page.click('button:has-text("Main Text")');
            await expect(posBtn).toHaveClass(/active/);

            console.log(`   ✅ ${pos.name} verified`);
        }

        console.log('✅ Test passed: All 9 positions synchronized correctly');
    });
});
