/**
 * End-to-End Test: Save Page to Preset Workflow
 *
 * Tests the complete workflow:
 * 1. Load app with canvas content
 * 2. Open Save Page Modal
 * 3. Select editable fields
 * 4. Enter field names and labels
 * 5. Save to new preset
 * 6. Verify data in localStorage
 */

import { test, expect } from '@playwright/test';

test.describe('Save Page to Preset - Complete Workflow', () => {
    test('should complete full save workflow and persist to localStorage', async ({ page }) => {
        // Navigate to the app
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');

        console.log('✅ App loaded');

        // Wait for app initialization
        await page.waitForFunction(() => {
            return window.app && window.app.grid && window.app.presetPageManager;
        });

        console.log('✅ App initialized');

        // Switch to Presets tab
        await page.click('button:has-text("Presets")');
        await page.waitForTimeout(500);

        console.log('✅ Switched to Presets tab');

        // Click "Save Page to Preset" button
        await page.click('button.preset-save-page-btn');
        await page.waitForTimeout(500);

        console.log('✅ Save Page Modal opened');

        // Verify modal is visible
        const modal = page.locator('.save-page-modal');
        await expect(modal).toBeVisible();

        // Count canvas elements detected
        const elementCheckboxes = await page.locator('.element-checkbox').count();
        console.log(`📊 Detected ${elementCheckboxes} canvas elements`);

        // Should have at least 1 element (the main text cells)
        expect(elementCheckboxes).toBeGreaterThan(0);

        // Select first 2 elements as editable
        const firstCheckbox = page.locator('.element-checkbox').first();
        const secondCheckbox = page.locator('.element-checkbox').nth(1);

        await firstCheckbox.check();
        await page.waitForTimeout(200);

        await secondCheckbox.check();
        await page.waitForTimeout(200);

        console.log('✅ Selected 2 elements as editable');

        // Verify editable fields list appears
        const fieldInputs = await page.locator('.field-name-input').count();
        console.log(`📋 Editable field inputs: ${fieldInputs}`);
        expect(fieldInputs).toBe(2);

        // Fill in field names and labels
        const firstFieldName = page.locator('.field-name-input').first();
        const firstFieldLabel = page.locator('.field-label-input').first();

        await firstFieldName.fill('heroTitle');
        await firstFieldLabel.fill('Hero Title');

        const secondFieldName = page.locator('.field-name-input').nth(1);
        const secondFieldLabel = page.locator('.field-label-input').nth(1);

        await secondFieldName.fill('heroSubtitle');
        await secondFieldLabel.fill('Hero Subtitle');

        console.log('✅ Filled in field names and labels');

        // Select "Create New Preset"
        await page.check('input[name="preset-type"][value="new"]');

        // Enter preset name
        await page.fill('#new-preset-name', 'Test Multi-Page Preset');

        // Enter page name
        await page.fill('#page-name-input', 'Homepage Hero');

        // Select page position (Page 1)
        await page.selectOption('#page-position-select', '1');

        console.log('✅ Filled in preset and page details');

        // Click Save button
        await page.click('button.save-page-modal-save');
        await page.waitForTimeout(1000);

        console.log('✅ Clicked Save button');

        // Verify alert shown
        page.on('dialog', async dialog => {
            console.log(`📢 Alert: ${dialog.message()}`);
            expect(dialog.message()).toContain('Page saved to new preset');
            await dialog.accept();
        });

        // Verify modal closed
        await expect(modal).not.toBeVisible({ timeout: 2000 });

        console.log('✅ Modal closed after save');

        // Verify data in localStorage
        const localStorageData = await page.evaluate(() => {
            const data = localStorage.getItem('chatooly_multipage_presets');
            return data ? JSON.parse(data) : null;
        });

        console.log('📦 localStorage data:', JSON.stringify(localStorageData, null, 2));

        // Verify preset was saved
        expect(localStorageData).not.toBeNull();
        expect(Array.isArray(localStorageData)).toBe(true);
        expect(localStorageData.length).toBeGreaterThan(0);

        // Find our preset
        const savedPreset = localStorageData.find(p => p.presetName === 'Test Multi-Page Preset');
        expect(savedPreset).toBeDefined();

        console.log('✅ Found saved preset:', savedPreset.presetName);

        // Verify preset structure
        expect(savedPreset.page1).toBeDefined();
        expect(savedPreset.page2).toBeNull();
        expect(savedPreset.page3).toBeNull();

        // Parse page1 data
        const page1Data = JSON.parse(savedPreset.page1);
        console.log('📄 Page 1 data keys:', Object.keys(page1Data));

        // Verify page data structure
        expect(page1Data.pageName).toBe('Homepage Hero');
        expect(page1Data.pageNumber).toBe(1);
        expect(page1Data.canvas).toBeDefined();
        expect(page1Data.background).toBeDefined();
        expect(page1Data.mainText).toBeDefined();
        expect(page1Data.editableFields).toBeDefined();

        console.log('✅ Page data structure valid');

        // Verify editable fields configuration
        const editableFields = page1Data.editableFields;
        console.log('📝 Editable fields config:', JSON.stringify(editableFields, null, 2));

        // Should have 2 editable text cells
        const editableTextCells = Object.keys(editableFields.textCells).filter(
            key => editableFields.textCells[key].editable
        );

        expect(editableTextCells.length).toBe(2);

        // Verify field names and labels
        const textCellConfigs = Object.values(editableFields.textCells);
        const fieldNames = textCellConfigs.map(c => c.fieldName).sort();
        const fieldLabels = textCellConfigs.map(c => c.fieldLabel).sort();

        expect(fieldNames).toContain('heroTitle');
        expect(fieldNames).toContain('heroSubtitle');
        expect(fieldLabels).toContain('Hero Title');
        expect(fieldLabels).toContain('Hero Subtitle');

        console.log('✅ Editable fields configuration correct');
        console.log('✅ COMPLETE WORKFLOW TEST PASSED');
    });

    test('should handle saving to existing preset', async ({ page }) => {
        // Navigate to the app
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');

        // Wait for app initialization
        await page.waitForFunction(() => {
            return window.app && window.app.grid && window.app.presetPageManager;
        });

        // First, create a preset with page 1
        console.log('📝 Creating initial preset...');

        await page.click('button:has-text("Presets")');
        await page.waitForTimeout(500);

        await page.click('button.preset-save-page-btn');
        await page.waitForTimeout(500);

        // Select first element
        const firstCheckbox = page.locator('.element-checkbox').first();
        await firstCheckbox.check();
        await page.waitForTimeout(200);

        // Fill field name
        await page.fill('.field-name-input', 'testField');
        await page.fill('.field-label-input', 'Test Field');

        // Create new preset
        await page.check('input[name="preset-type"][value="new"]');
        await page.fill('#new-preset-name', 'Multi-Page Test Preset');
        await page.fill('#page-name-input', 'Page One');
        await page.selectOption('#page-position-select', '1');

        // Save
        page.on('dialog', async dialog => {
            await dialog.accept();
        });
        await page.click('button.save-page-modal-save');
        await page.waitForTimeout(1000);

        console.log('✅ Created preset with Page 1');

        // Now add Page 2 to existing preset
        console.log('📝 Adding Page 2 to existing preset...');

        await page.click('button.preset-save-page-btn');
        await page.waitForTimeout(500);

        // Select element for page 2
        await firstCheckbox.check();
        await page.waitForTimeout(200);

        await page.fill('.field-name-input', 'page2Field');
        await page.fill('.field-label-input', 'Page 2 Field');

        // Select "Add to Existing Preset"
        await page.check('input[name="preset-type"][value="existing"]');
        await page.waitForTimeout(500);

        // Select the preset we just created by text content
        const options = await page.locator('#existing-preset-select option').allTextContents();
        const targetOption = options.find(opt => opt.includes('Multi-Page Test Preset'));
        await page.selectOption('#existing-preset-select', { label: targetOption });

        await page.fill('#page-name-input', 'Page Two');
        await page.selectOption('#page-position-select', '2');

        // Save
        await page.click('button.save-page-modal-save');
        await page.waitForTimeout(1000);

        console.log('✅ Added Page 2 to preset');

        // Verify localStorage has both pages
        const localStorageData = await page.evaluate(() => {
            const data = localStorage.getItem('chatooly_multipage_presets');
            return data ? JSON.parse(data) : null;
        });

        const savedPreset = localStorageData.find(p => p.presetName === 'Multi-Page Test Preset');
        expect(savedPreset).toBeDefined();

        // Verify both pages exist
        expect(savedPreset.page1).toBeDefined();
        expect(savedPreset.page2).toBeDefined();

        const page1Data = JSON.parse(savedPreset.page1);
        const page2Data = JSON.parse(savedPreset.page2);

        expect(page1Data.pageName).toBe('Page One');
        expect(page2Data.pageName).toBe('Page Two');

        console.log('✅ Both pages saved correctly');
        console.log('✅ EXISTING PRESET TEST PASSED');
    });
});
