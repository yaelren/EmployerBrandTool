import { test, expect } from '@playwright/test';

test.describe('Save Page - Editable Slots', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://127.0.0.1:5502/index.html');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000); // Wait for initialization

        // Wait for the save page button to be visible
        await page.waitForSelector('.preset-save-page-btn', { timeout: 10000 });
    });

    test('should create multiple editable slots without overwriting', async ({ page }) => {
        // Click Save Page button to open panel
        await page.click('.preset-save-page-btn');
        await page.waitForTimeout(500);

        // Find lock icons on canvas overlay
        const lockIcons = await page.locator('[data-element-id]').all();
        console.log(`Found ${lockIcons.length} lock icons`);

        if (lockIcons.length < 2) {
            throw new Error('Need at least 2 lock icons to test multiple slots');
        }

        // Click first lock icon to configure first slot
        await lockIcons[0].click();
        await page.waitForTimeout(500);

        // Check inline editor is visible
        const editor = page.locator('#inline-slot-editor');
        await expect(editor).toBeVisible();

        // Fill in first slot details
        await page.fill('#inline-field-name', 'headline1');
        await page.fill('#inline-field-label', 'Headline 1');
        await page.waitForTimeout(500); // Wait for auto-save

        console.log('✅ First slot configured');

        // Verify first slot appears in list
        const slot1 = page.locator('.configured-slot-item:has-text("Headline 1")');
        await expect(slot1).toBeVisible({ timeout: 5000 });

        // Click second lock icon to configure second slot
        await lockIcons[1].click();
        await page.waitForTimeout(500);

        // Fill in second slot details
        await page.fill('#inline-field-name', 'headline2');
        await page.fill('#inline-field-label', 'Headline 2');
        await page.waitForTimeout(500); // Wait for auto-save

        console.log('✅ Second slot configured');

        // Verify both slots exist in the list
        await expect(slot1).toBeVisible();
        const slot2 = page.locator('.configured-slot-item:has-text("Headline 2")');
        await expect(slot2).toBeVisible({ timeout: 5000 });

        // Count total configured slots
        const slotCount = await page.locator('.configured-slot-item').count();
        console.log(`Total configured slots: ${slotCount}`);
        expect(slotCount).toBe(2);

        console.log('✅ Both slots exist without overwriting');
    });

    test('should update lock icons from locked to unlocked', async ({ page }) => {
        // Click Save Page button to open panel
        await page.click('.preset-save-page-btn');
        await page.waitForTimeout(500);

        // Find first lock icon
        const lockIcon = page.locator('[data-element-id]').first();

        // Check initial state is locked (🔒)
        const initialIcon = await lockIcon.textContent();
        console.log(`Initial icon: ${initialIcon}`);
        expect(initialIcon).toBe('🔒');

        // Click to configure
        await lockIcon.click();
        await page.waitForTimeout(500);

        // Fill in slot details
        await page.fill('#inline-field-name', 'testSlot');
        await page.fill('#inline-field-label', 'Test Slot');
        await page.waitForTimeout(1000); // Wait for auto-save

        // Check lock icon changed to unlocked (🔓)
        const updatedIcon = await lockIcon.textContent();
        console.log(`Updated icon: ${updatedIcon}`);
        expect(updatedIcon).toBe('🔓');

        console.log('✅ Lock icon updated correctly');
    });

    test('should delete slot via × button', async ({ page }) => {
        // Click Save Page button
        await page.click('.preset-save-page-btn');
        await page.waitForTimeout(500);

        // Configure a slot
        const lockIcon = page.locator('[data-element-id]').first();
        await lockIcon.click();
        await page.waitForTimeout(500);

        await page.fill('#inline-field-name', 'deleteTest');
        await page.fill('#inline-field-label', 'Delete Test');
        await page.waitForTimeout(1000);

        // Verify slot exists
        const slot = page.locator('.configured-slot-item:has-text("Delete Test")');
        await expect(slot).toBeVisible();

        // Click delete button
        const deleteBtn = slot.locator('.slot-delete-btn');

        // Handle confirmation dialog
        page.on('dialog', dialog => dialog.accept());
        await deleteBtn.click();
        await page.waitForTimeout(500);

        // Verify slot is removed
        await expect(slot).not.toBeVisible();

        console.log('✅ Slot deleted successfully');
    });

    test('should collapse/expand inline editor', async ({ page }) => {
        // Click Save Page button
        await page.click('.preset-save-page-btn');
        await page.waitForTimeout(500);

        // Configure a slot
        const lockIcon = page.locator('[data-element-id]').first();
        await lockIcon.click();
        await page.waitForTimeout(500);

        await page.fill('#inline-field-name', 'collapseTest');
        await page.fill('#inline-field-label', 'Collapse Test');
        await page.waitForTimeout(500);

        // Check editor content is visible
        const editorContent = page.locator('#inline-editor-content');
        await expect(editorContent).toBeVisible();

        // Click header to collapse
        await page.click('.inline-editor-header');
        await page.waitForTimeout(300);

        // Check editor content is hidden
        await expect(editorContent).toBeHidden();

        // Click header to expand
        await page.click('.inline-editor-header');
        await page.waitForTimeout(300);

        // Check editor content is visible again
        await expect(editorContent).toBeVisible();

        console.log('✅ Collapse/expand works correctly');
    });
});
