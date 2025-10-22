/**
 * Debug Test: Trace save and load operations to find failure point
 */

import { test, expect } from '@playwright/test';

test.describe('Debug Save-Load Operations', () => {
    test('should trace save and load with detailed logging', async ({ page }) => {
        // Enable console logging
        page.on('console', msg => {
            const type = msg.type();
            if (type === 'error' || type === 'warn' || msg.text().includes('❌') || msg.text().includes('Error')) {
                console.log(`[BROWSER ${type.toUpperCase()}]:`, msg.text());
            }
        });

        // Navigate to the app
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');

        console.log('✅ App loaded');

        // Wait for app initialization
        await page.waitForFunction(() => {
            return window.app && window.app.grid && window.app.presetPageManager;
        });

        console.log('✅ App initialized');

        // Clear localStorage
        await page.evaluate(() => {
            localStorage.removeItem('chatooly_multipage_presets');
            console.log('🧹 Cleared localStorage');
        });

        // Switch to Presets tab
        await page.click('button:has-text("Presets")');
        await page.waitForTimeout(500);

        console.log('✅ Switched to Presets tab');

        // STEP 1: Save a page
        console.log('\n📝 STEP 1: SAVING PAGE...\n');

        await page.click('button.preset-save-page-btn');
        await page.waitForTimeout(500);

        // Check one element
        const firstCheckbox = page.locator('.element-checkbox').first();
        await firstCheckbox.check();
        await page.waitForTimeout(200);

        await page.fill('.field-name-input', 'testField');
        await page.check('input[name="preset-type"][value="new"]');
        await page.fill('#new-preset-name', 'Debug Preset');
        await page.fill('#page-name-input', 'Debug Page 1');
        await page.selectOption('#page-position-select', '1');

        // Capture console output during save
        const savePromise = page.evaluate(async () => {
            console.log('🔍 About to save...');
            console.log('PresetPageManager exists:', !!window.app.presetPageManager);
            console.log('captureCurrentPage exists:', typeof window.app.presetPageManager.captureCurrentPage);
            return true;
        });

        await savePromise;

        // Click save with alert handler
        page.once('dialog', async dialog => {
            console.log(`📢 Save Alert: ${dialog.message()}`);
            await dialog.accept();
        });

        await page.click('button.save-page-modal-save');
        await page.waitForTimeout(2000);

        console.log('✅ Save clicked');

        // Check localStorage after save
        const savedData = await page.evaluate(() => {
            const data = localStorage.getItem('chatooly_multipage_presets');
            console.log('📦 localStorage raw data:', data ? data.substring(0, 200) + '...' : 'null');

            if (!data) {
                console.error('❌ No data in localStorage!');
                return null;
            }

            try {
                const parsed = JSON.parse(data);
                console.log('📦 Parsed data:', {
                    isArray: Array.isArray(parsed),
                    length: parsed.length,
                    firstPresetName: parsed[0]?.presetName,
                    hasPage1: !!parsed[0]?.page1
                });
                return parsed;
            } catch (e) {
                console.error('❌ Failed to parse localStorage:', e.message);
                return null;
            }
        });

        expect(savedData).not.toBeNull();
        expect(savedData.length).toBeGreaterThan(0);

        console.log('\n✅ SAVE COMPLETED\n');

        // STEP 2: Load the page back
        console.log('\n📝 STEP 2: LOADING PAGE...\n');

        await page.click('button.preset-load-page-btn');
        await page.waitForTimeout(500);

        console.log('✅ Load modal opened');

        // Select preset
        const options = await page.locator('#load-page-preset-select option').allTextContents();
        console.log('📋 Available presets:', options);

        const targetOption = options.find(opt => opt.includes('Debug Preset'));
        await page.selectOption('#load-page-preset-select', { label: targetOption });
        await page.waitForTimeout(500);

        console.log('✅ Preset selected');

        // Capture console during load
        const loadDebug = await page.evaluate(async () => {
            const presetId = window.app.loadPageModal.selectedPresetId;
            console.log('🔍 Selected preset ID:', presetId);

            // Get the preset data
            const allPresets = await window.app.presetPageManager.getAllPresetsFromCMS();
            const preset = allPresets.find(p => p._id === presetId);
            console.log('📦 Found preset:', {
                name: preset?.presetName,
                hasPage1: !!preset?.page1
            });

            if (preset?.page1) {
                try {
                    const page1Data = JSON.parse(preset.page1);
                    console.log('📄 Page 1 data:', {
                        pageName: page1Data.pageName,
                        hasCanvas: !!page1Data.canvas,
                        hasBackground: !!page1Data.background,
                        hasMainText: !!page1Data.mainText,
                        hasGrid: !!page1Data.grid
                    });
                    return { success: true, pageData: page1Data };
                } catch (e) {
                    console.error('❌ Failed to parse page1:', e.message);
                    return { success: false, error: e.message };
                }
            }

            return { success: false, error: 'No page1 data' };
        });

        console.log('Load debug result:', loadDebug);

        // Click the page card
        const pageCard = page.locator('.load-page-card[data-page-number="1"]');
        await expect(pageCard).toBeVisible();

        // Capture detailed error if load fails
        page.once('dialog', async dialog => {
            const message = dialog.message();
            console.log(`📢 Load Alert: ${message}`);

            if (message.includes('Error')) {
                // Get more details from console
                const errorDetails = await page.evaluate(() => {
                    return {
                        presetManager: typeof window.app.presetManager,
                        deserializeState: typeof window.app.presetManager?.deserializeState,
                        applyPreset: typeof window.app.presetManager?.applyPreset
                    };
                });
                console.log('🔍 PresetManager methods:', errorDetails);
            }

            await dialog.accept();
        });

        await pageCard.click();
        await page.waitForTimeout(2000);

        console.log('✅ Load completed or failed - check alerts above');

        // Final canvas state check
        const finalState = await page.evaluate(() => {
            const cells = window.app.grid.getAllCells();
            const textCells = cells.filter(c => c.type === 'main-text' && !c.isEmpty());
            return {
                cellCount: textCells.length,
                texts: textCells.map(c => c.text)
            };
        });

        console.log('📊 Final canvas state:', finalState);
    });
});
