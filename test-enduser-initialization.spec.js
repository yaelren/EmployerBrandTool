/**
 * Playwright Test: End-User Interface Initialization
 * Verifies that enduser.html loads correctly with all components initialized
 */

import { test, expect } from '@playwright/test';

test.describe('End-User Interface Initialization', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to enduser.html on live server
        await page.goto('http://127.0.0.1:5502/enduser.html');

        // Wait for page to load
        await page.waitForLoadState('networkidle');
    });

    test('should load page without errors', async ({ page }) => {
        // Check for critical errors in console
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        // Wait a bit for initialization
        await page.waitForTimeout(2000);

        // Check that no critical errors occurred
        const hasCriticalError = errors.some(err =>
            err.includes('Failed to initialize end-user interface')
        );
        expect(hasCriticalError).toBe(false);
    });

    test('should have correct HTML structure', async ({ page }) => {
        // Check main containers exist
        await expect(page.locator('.enduser-container')).toBeVisible();
        await expect(page.locator('.enduser-sidebar')).toBeVisible();
        await expect(page.locator('.enduser-canvas-area')).toBeVisible();

        // Check header elements
        await expect(page.locator('.enduser-header .header-title')).toHaveText('Employer Brand Tool');
        await expect(page.locator('.enduser-header .header-subtitle')).toHaveText('End User');

        // Check preset selector is visible initially
        await expect(page.locator('#presetSelector')).toBeVisible();
        await expect(page.locator('#browsePresetsBtn')).toBeVisible();

        // Check page thumbnails nav is hidden initially
        await expect(page.locator('#pageNav')).toBeHidden();

        // Check export button exists
        await expect(page.locator('#exportBtn')).toBeVisible();

        // Check canvas structure (canvas itself may not be visible until rendered)
        await expect(page.locator('#chatooly-container')).toBeVisible();

        // Check modal is hidden initially
        await expect(page.locator('#presetModal')).toBeHidden();
    });

    test('should initialize canvas with correct dimensions', async ({ page }) => {
        const canvas = page.locator('#chatooly-canvas');

        // Check canvas is rendered
        await expect(canvas).toBeVisible();

        // Check canvas dimensions (1080 x 1920)
        const canvasWidth = await canvas.evaluate(el => el.width);
        const canvasHeight = await canvas.evaluate(el => el.height);

        expect(canvasWidth).toBe(1080);
        expect(canvasHeight).toBe(1920);
    });

    test('should initialize all core systems', async ({ page }) => {
        // Wait for initialization messages
        await page.waitForTimeout(2000);

        // Check console logs for successful initialization
        const logs = [];
        page.on('console', msg => {
            if (msg.type() === 'log') {
                logs.push(msg.text());
            }
        });

        // Reload to capture logs
        await page.reload();
        await page.waitForTimeout(2000);

        // Verify key initialization messages
        const hasCanvasInit = logs.some(log => log.includes('Canvas initialized'));
        const hasCanvasManager = logs.some(log => log.includes('CanvasManager initialized'));
        const hasBackgroundManager = logs.some(log => log.includes('BackgroundManager initialized'));
        const hasLayerManager = logs.some(log => log.includes('LayerManager initialized'));
        const hasGridBuilder = logs.some(log => log.includes('GridBuilder initialized'));
        const hasFontManager = logs.some(log => log.includes('FontManager initialized'));

        expect(hasCanvasInit).toBe(true);
        expect(hasCanvasManager).toBe(true);
        expect(hasBackgroundManager).toBe(true);
        expect(hasLayerManager).toBe(true);
        expect(hasGridBuilder).toBe(true);
        expect(hasFontManager).toBe(true);
    });

    test('should have window.endUserApp global object', async ({ page }) => {
        // Wait for initialization
        await page.waitForTimeout(2000);

        // Check global object exists
        const hasGlobal = await page.evaluate(() => {
            return typeof window.endUserApp !== 'undefined';
        });

        expect(hasGlobal).toBe(true);

        // Check global object has expected properties
        const hasProperties = await page.evaluate(() => {
            const app = window.endUserApp;
            return app.canvasManager !== undefined &&
                   app.presetPageManager !== undefined &&
                   app.formGenerator !== undefined &&
                   app.contentSlotRenderer !== undefined &&
                   app.endUserController !== undefined;
        });

        expect(hasProperties).toBe(true);
    });

    test('should open preset modal when browse button clicked', async ({ page }) => {
        // Note: Modal opening depends on Wix backend response
        // Test verifies button is clickable and modal interaction works

        // Modal should be hidden initially
        await expect(page.locator('#presetModal')).toBeHidden();

        // Click browse presets button (should work now that canvas overlay is fixed)
        await page.click('#browsePresetsBtn');

        // Wait for modal to open (it will try to fetch presets)
        await page.waitForTimeout(1000);

        // Modal should be visible
        await expect(page.locator('#presetModal')).toBeVisible();
        await expect(page.locator('.modal-header h3')).toHaveText('Select a Preset');
    });

    test.skip('should close preset modal when close button clicked', async ({ page }) => {
        // Note: This test requires Wix backend to be properly configured
        // Skipping for now as it depends on external service availability

        // Open modal (force click to bypass canvas overlay)
        await page.click('#browsePresetsBtn', { force: true });
        await page.waitForTimeout(500);
        await expect(page.locator('#presetModal')).toBeVisible();

        // Click close button
        await page.click('#closePresetModal');
        await page.waitForTimeout(500);

        // Modal should be hidden
        await expect(page.locator('#presetModal')).toBeHidden();
    });

    test.skip('should close preset modal when clicking outside', async ({ page }) => {
        // Note: This test requires Wix backend to be properly configured
        // Skipping for now as it depends on external service availability

        // Open modal (force click to bypass canvas overlay)
        await page.click('#browsePresetsBtn', { force: true });
        await page.waitForTimeout(500);
        await expect(page.locator('#presetModal')).toBeVisible();

        // Click on modal overlay (outside content)
        await page.click('.modal-overlay');
        await page.waitForTimeout(500);

        // Modal should be hidden
        await expect(page.locator('#presetModal')).toBeHidden();
    });

    test('should have CSS loaded correctly', async ({ page }) => {
        // Check background colors match dark theme
        const containerBg = await page.locator('.enduser-container').evaluate(el => {
            return window.getComputedStyle(el).backgroundColor;
        });

        const sidebarBg = await page.locator('.enduser-sidebar').evaluate(el => {
            return window.getComputedStyle(el).backgroundColor;
        });

        // Should have dark backgrounds (not white)
        expect(containerBg).not.toBe('rgb(255, 255, 255)');
        expect(sidebarBg).not.toBe('rgb(255, 255, 255)');

        // Check flexbox layout is applied
        const containerDisplay = await page.locator('.enduser-container').evaluate(el => {
            return window.getComputedStyle(el).display;
        });

        expect(containerDisplay).toBe('flex');
    });

    test('should have all required scripts loaded', async ({ page }) => {
        // Check that key classes are defined
        const classesExist = await page.evaluate(() => {
            return typeof CanvasManager !== 'undefined' &&
                   typeof BackgroundManager !== 'undefined' &&
                   typeof LayerManager !== 'undefined' &&
                   typeof GridBuilder !== 'undefined' &&
                   typeof FontManager !== 'undefined' &&
                   typeof ContentSlotManager !== 'undefined' &&
                   typeof FormGenerator !== 'undefined' &&
                   typeof ContentSlotRenderer !== 'undefined' &&
                   typeof EndUserController !== 'undefined';
        });

        expect(classesExist).toBe(true);
    });

    test('should not have designer-only elements', async ({ page }) => {
        // Check that designer controls are NOT present
        const hasGridTab = await page.locator('[data-tab="grid"]').count();
        const hasPresetsTab = await page.locator('[data-tab="presets"]').count();
        const hasDebugPanel = await page.locator('#debugPanel').count();

        expect(hasGridTab).toBe(0);
        expect(hasPresetsTab).toBe(0);
        expect(hasDebugPanel).toBe(0);
    });
});
