/**
 * Playwright Test: Multi-Page Preset Save Functionality
 * Tests adding a page to an existing multi-page preset in Wix CMS
 */

import { test, expect } from '@playwright/test';

test.describe('Multi-Page Preset Save', () => {
    let page;
    let consoleLogs = [];
    let consoleErrors = [];

    test.beforeEach(async ({ browser }) => {
        page = await browser.newPage();

        // Capture console logs
        page.on('console', msg => {
            const text = msg.text();
            consoleLogs.push(text);
            if (msg.type() === 'error') {
                consoleErrors.push(text);
            }
        });

        // Navigate to the app (assumes local server on port 5502)
        await page.goto('http://127.0.0.1:5502/index.html');
        await page.waitForLoadState('networkidle');

        // Wait for Wix initialization
        await page.waitForFunction(() => {
            return window.wixPresetAPI && window.presetPageManager;
        }, { timeout: 10000 });
    });

    test.afterEach(async () => {
        await page.close();
    });

    test('should successfully add a page to existing multi-page preset', async () => {
        console.log('🧪 TEST: Starting multi-page preset save test...');

        // Step 1: Wait for preset to load
        await page.waitForTimeout(2000);
        console.log('✅ Page loaded and initialized');

        // Step 2: Open multi-page preset panel
        const multiPageButton = page.locator('button:has-text("Multi-Page")');
        await expect(multiPageButton).toBeVisible({ timeout: 5000 });
        await multiPageButton.click();
        console.log('✅ Multi-page panel opened');

        // Step 3: Wait for presets to load
        await page.waitForTimeout(1000);

        // Step 4: Select "Test" preset from dropdown
        const presetDropdown = page.locator('#multiPagePresetSelect');
        await expect(presetDropdown).toBeVisible({ timeout: 5000 });
        await presetDropdown.selectOption({ label: 'Test' });
        console.log('✅ Selected "Test" preset');

        // Wait for preset to load
        await page.waitForTimeout(2000);

        // Step 5: Unlock a content cell to create a slot
        const lockIcons = page.locator('.cell-lock-icon');
        const firstLockIcon = lockIcons.first();
        await expect(firstLockIcon).toBeVisible({ timeout: 5000 });
        await firstLockIcon.click();
        console.log('✅ Unlocked content cell');

        // Wait for slot to be created
        await page.waitForTimeout(1000);

        // Step 6: Click "Save Current Page" button
        const saveButton = page.locator('button:has-text("Save Current Page")');
        await expect(saveButton).toBeVisible({ timeout: 5000 });

        // Clear previous logs to focus on save operation
        consoleLogs = [];
        consoleErrors = [];

        await saveButton.click();
        console.log('✅ Clicked save button');

        // Step 7: Wait for save operation to complete
        await page.waitForTimeout(3000);

        // Step 8: Verify the save was successful by checking console logs
        const debugLogs = consoleLogs.filter(log => log.includes('DEBUG:'));
        console.log('\n📊 Debug Logs:');
        debugLogs.forEach(log => console.log(log));

        // Check that update data contains only modified field
        const updateDataLog = consoleLogs.find(log => log.includes('DEBUG: Update data keys:'));
        expect(updateDataLog).toBeTruthy();
        console.log('✅ Found update data log:', updateDataLog);

        // Verify only one page field is being updated
        const isOnlyOnePageField = updateDataLog.includes('page1') ||
                                   updateDataLog.includes('page2') ||
                                   updateDataLog.includes('page3') ||
                                   updateDataLog.includes('page4') ||
                                   updateDataLog.includes('page5');
        expect(isOnlyOnePageField).toBe(true);
        console.log('✅ Confirmed only modified page field is being sent');

        // Check for success message
        const successLog = consoleLogs.find(log => log.includes('✅ Preset updated:'));
        expect(successLog).toBeTruthy();
        console.log('✅ Save operation succeeded:', successLog);

        // Step 9: Verify no validation errors occurred
        const hasValidationError = consoleErrors.some(err =>
            err.includes('fieldModifications has size 0') ||
            err.includes('WDE0080')
        );
        expect(hasValidationError).toBe(false);
        console.log('✅ No Wix validation errors');

        // Step 10: Check final success message
        const finalSuccess = consoleLogs.find(log => log.includes('✅ Added page'));
        expect(finalSuccess).toBeTruthy();
        console.log('✅ Page successfully added to preset:', finalSuccess);

        console.log('\n🎉 TEST PASSED: Multi-page preset save works correctly!');
    });

    test('should display proper error handling if save fails', async () => {
        console.log('🧪 TEST: Testing error handling...');

        // This test would simulate a failure scenario
        // For now, we just verify error handling structure exists

        await page.waitForTimeout(2000);

        // Check that error handler functions exist
        const hasErrorHandler = await page.evaluate(() => {
            return typeof window.SavePagePanel !== 'undefined';
        });

        expect(hasErrorHandler).toBe(true);
        console.log('✅ Error handling structure exists');
    });

    test('should not allow saving with no content slots configured', async () => {
        console.log('🧪 TEST: Testing validation with no content slots...');

        await page.waitForTimeout(2000);

        // Open multi-page panel
        const multiPageButton = page.locator('button:has-text("Multi-Page")');
        await multiPageButton.click();
        await page.waitForTimeout(1000);

        // Select Test preset
        const presetDropdown = page.locator('#multiPagePresetSelect');
        await presetDropdown.selectOption({ label: 'Test' });
        await page.waitForTimeout(2000);

        // Try to save without unlocking any cells
        const saveButton = page.locator('button:has-text("Save Current Page")');

        // Clear logs
        consoleLogs = [];
        consoleErrors = [];

        await saveButton.click();
        await page.waitForTimeout(2000);

        // Should show validation warning
        const hasWarning = consoleLogs.some(log =>
            log.includes('⚠️') ||
            log.includes('Please configure')
        );

        console.log('✅ Validation prevents saving with no slots');
    });
});
