/**
 * Playwright test for Content Slots Overlay
 * Tests the visual overlay system and debugging
 */

import { test, expect } from '@playwright/test';

test.describe('Content Slots Overlay', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the app
        await page.goto('http://localhost:5502');

        // Wait for app to initialize
        await page.waitForFunction(() => window.app && window.app.isInitialized);
    });

    test('should show overlay button', async ({ page }) => {
        // Check if "Show Content Slots" button exists
        const button = await page.locator('#toggleContentSlots');
        await expect(button).toBeVisible();

        const text = await button.textContent();
        console.log('Button text:', text);
    });

    test('should investigate overlay canvas positioning', async ({ page }) => {
        // Get main canvas info
        const mainCanvas = await page.locator('#chatooly-canvas');
        const mainBox = await mainCanvas.boundingBox();
        console.log('Main canvas position:', mainBox);

        // Click show content slots button
        await page.click('#toggleContentSlots');
        await page.waitForTimeout(500);

        // Get overlay canvas info
        const overlay = await page.locator('#contentSlotOverlay');
        const overlayExists = await overlay.count();
        console.log('Overlay exists:', overlayExists > 0);

        if (overlayExists > 0) {
            const overlayBox = await overlay.boundingBox();
            console.log('Overlay canvas position:', overlayBox);

            const overlayStyle = await overlay.evaluate(el => ({
                display: el.style.display,
                position: el.style.position,
                top: el.style.top,
                left: el.style.left,
                width: el.style.width,
                height: el.style.height,
                zIndex: el.style.zIndex
            }));
            console.log('Overlay styles:', overlayStyle);

            const canvasSize = await overlay.evaluate(el => ({
                width: el.width,
                height: el.height
            }));
            console.log('Overlay canvas size:', canvasSize);
        }

        // Take screenshot
        await page.screenshot({ path: 'test-overlay-initial.png', fullPage: true });
    });

    test('should check ContentSlotManager state', async ({ page }) => {
        // Check if ContentSlotManager exists
        const managerExists = await page.evaluate(() => {
            return !!(window.app &&
                     window.app.presetPageManager &&
                     window.app.presetPageManager.contentSlotManager);
        });
        console.log('ContentSlotManager exists:', managerExists);

        // Get all slots
        const slots = await page.evaluate(() => {
            if (window.app?.presetPageManager?.contentSlotManager) {
                return window.app.presetPageManager.contentSlotManager.getAllSlots();
            }
            return null;
        });
        console.log('Current slots:', slots);
        console.log('Slots count:', slots ? slots.length : 'N/A');
    });

    test('should create test slot and show overlay', async ({ page }) => {
        // Get cells
        const cells = await page.evaluate(() => {
            return window.app.grid.getAllCells().map(c => ({
                id: c.id,
                type: c.type,
                bounds: c.bounds
            }));
        });
        console.log('Available cells:', cells);

        // Find a text cell
        const textCell = cells.find(c => c.type === 'text' || c.type === 'main-text');
        console.log('Selected text cell:', textCell);

        if (textCell) {
            // Create slot
            const slotCreated = await page.evaluate((cellId) => {
                // Find cell from all cells
                const allCells = window.app.grid.getAllCells();
                const cell = allCells.find(c => c.id === cellId);
                if (!cell) return { error: 'Cell not found' };

                try {
                    const config = {
                        fieldName: 'testHeadline',
                        fieldLabel: 'Test Headline',
                        fieldDescription: 'Testing overlay',
                        required: true,
                        constraints: {
                            maxCharacters: 50,
                            minFontSize: 24,
                            maxFontSize: 72
                        }
                    };

                    const slot = window.app.presetPageManager.contentSlotManager.createSlotFromCell(cell, config);
                    // IMPORTANT: Must manually add slot to manager
                    window.app.presetPageManager.contentSlotManager.addSlot(slot);
                    return { success: true, slot };
                } catch (error) {
                    return { error: error.message, stack: error.stack };
                }
            }, textCell.id);

            console.log('Slot creation result:', slotCreated);

            // Wait a bit
            await page.waitForTimeout(500);

            // Click show content slots
            await page.click('#toggleContentSlots');
            await page.waitForTimeout(500);

            // Manually trigger re-render after slot creation
            await page.evaluate(() => {
                if (window.app.contentSlotOverlay && window.app.contentSlotOverlay.enabled) {
                    window.app.contentSlotOverlay.render();
                }
            });

            // Take screenshot
            await page.screenshot({ path: 'test-overlay-with-slot.png', fullPage: true });

            // Check overlay content
            const overlayVisible = await page.evaluate(() => {
                const overlay = document.getElementById('contentSlotOverlay');
                return overlay && overlay.style.display !== 'none';
            });
            console.log('Overlay visible:', overlayVisible);

            // Get slots again
            const slotsAfter = await page.evaluate(() => {
                return window.app.presetPageManager.contentSlotManager.getAllSlots();
            });
            console.log('Slots after creation:', slotsAfter.length);
        }
    });

    test('should check overlay parent element', async ({ page }) => {
        // Check where overlay is inserted
        const overlayInfo = await page.evaluate(() => {
            const overlay = document.getElementById('contentSlotOverlay');
            if (!overlay) return { error: 'Overlay not found' };

            const mainCanvas = document.getElementById('chatooly-canvas');
            const container = document.getElementById('chatooly-container');

            return {
                overlayExists: !!overlay,
                overlayParent: overlay.parentElement?.id || overlay.parentElement?.className,
                mainCanvasParent: mainCanvas?.parentElement?.id || mainCanvas?.parentElement?.className,
                containerInfo: container ? {
                    id: container.id,
                    position: window.getComputedStyle(container).position
                } : null,
                nextSibling: overlay.nextSibling?.id || overlay.nextSibling?.tagName
            };
        });
        console.log('Overlay DOM info:', overlayInfo);
    });
});
