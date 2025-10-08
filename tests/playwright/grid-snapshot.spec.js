/**
 * grid-snapshot.spec.js - Tests for GridSnapshot serialization system
 * Tests the Day 2 GridSnapshot functionality
 */

import { test, expect } from '@playwright/test';

test.describe('GridSnapshot System', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to application
        await page.goto('http://localhost:3000');

        // Wait for application to initialize
        await page.waitForFunction(() => {
            return window.app && window.app.grid && window.app.grid.isGridReady();
        });
    });

    test('should create GridSnapshot with valid structure', async ({ page }) => {
        const snapshotTest = await page.evaluate(() => {
            // Create a snapshot
            const snapshot = window.app.grid.createSnapshot();

            // Test snapshot structure
            const serialized = snapshot.serialize();

            return {
                hasMetadata: !!(serialized.metadata &&
                               serialized.metadata.timestamp &&
                               serialized.metadata.version &&
                               serialized.metadata.type === 'GridSnapshot'),
                hasGrid: !!serialized.grid,
                hasCanvas: !!serialized.canvas,
                hasConfig: !!serialized.config,
                hasAnimation: serialized.animation !== undefined,
                snapshotInfo: snapshot.getInfo(),
                isValid: snapshot.validate().success
            };
        });

        expect(snapshotTest.hasMetadata).toBe(true);
        expect(snapshotTest.hasGrid).toBe(true);
        expect(snapshotTest.hasCanvas).toBe(true);
        expect(snapshotTest.hasConfig).toBe(true);
        expect(snapshotTest.isValid).toBe(true);
        expect(snapshotTest.snapshotInfo.gridCells).toBeGreaterThanOrEqual(3);
    });

    test('should serialize and deserialize snapshots correctly', async ({ page }) => {
        const serializationTest = await page.evaluate(() => {
            // Create original snapshot
            const originalSnapshot = window.app.grid.createSnapshot();
            const serialized = originalSnapshot.serialize();

            // Deserialize
            const restoredSnapshot = GridSnapshot.deserialize(serialized);

            // Compare snapshots
            const comparison = originalSnapshot.compare(restoredSnapshot);

            return {
                originalValid: originalSnapshot.validate().success,
                restoredValid: restoredSnapshot.validate().success,
                originalInfo: originalSnapshot.getInfo(),
                restoredInfo: restoredSnapshot.getInfo(),
                comparison: comparison,
                timestampsMatch: originalSnapshot.timestamp === restoredSnapshot.timestamp,
                versionsMatch: originalSnapshot.version === restoredSnapshot.version
            };
        });

        expect(serializationTest.originalValid).toBe(true);
        expect(serializationTest.restoredValid).toBe(true);
        expect(serializationTest.timestampsMatch).toBe(true);
        expect(serializationTest.versionsMatch).toBe(true);
        expect(serializationTest.comparison.gridChanged).toBe(false);
        expect(serializationTest.comparison.canvasChanged).toBe(false);
    });

    test('should restore grid state from snapshot', async ({ page }) => {
        // First, change the text to create a different state
        await page.fill('#mainText', 'SNAPSHOT\nTEST\nDATA');
        await page.waitForTimeout(500);

        const restoreTest = await page.evaluate(() => {
            // Update text engine and rebuild grid
            window.app.textEngine.setText(window.app.elements.mainText.value);
            window.app.grid.buildFromExisting();

            // Create snapshot of new state
            const newSnapshot = window.app.grid.createSnapshot();
            const newTextContent = window.app.grid.getAllCells()
                .filter(cell => cell.type === 'main-text')
                .map(cell => cell.text);

            // Change text back to original
            window.app.elements.mainText.value = 'EMPLOYEE\nSPOTLIGHT\n2024';
            window.app.textEngine.setText(window.app.elements.mainText.value);
            window.app.grid.buildFromExisting();

            const originalTextContent = window.app.grid.getAllCells()
                .filter(cell => cell.type === 'main-text')
                .map(cell => cell.text);

            // Restore from snapshot
            const restoreSuccess = window.app.grid.restoreSnapshot(newSnapshot);

            const restoredTextContent = window.app.grid.getAllCells()
                .filter(cell => cell.type === 'main-text')
                .map(cell => cell.text);

            return {
                restoreSuccess,
                newTextContent,
                originalTextContent,
                restoredTextContent,
                restoredMatchesNew: JSON.stringify(restoredTextContent) === JSON.stringify(newTextContent)
            };
        });

        expect(restoreTest.restoreSuccess).toBe(true);
        expect(restoreTest.newTextContent).toEqual(['SNAPSHOT', 'TEST', 'DATA']);
        expect(restoreTest.originalTextContent).toEqual(['EMPLOYEE', 'SPOTLIGHT', '2024']);
        expect(restoreTest.restoredTextContent).toEqual(['SNAPSHOT', 'TEST', 'DATA']);
        expect(restoreTest.restoredMatchesNew).toBe(true);
    });

    test('should capture canvas and config state', async ({ page }) => {
        const stateTest = await page.evaluate(() => {
            const snapshot = window.app.grid.createSnapshot();
            const serialized = snapshot.serialize();

            return {
                canvasWidth: serialized.canvas?.width,
                canvasHeight: serialized.canvas?.height,
                hasCanvasState: !!serialized.canvas,
                hasTextEngineConfig: !!(serialized.config?.textEngine),
                hasCanvasConfig: !!(serialized.config?.canvas),
                configKeys: Object.keys(serialized.config || {})
            };
        });

        expect(stateTest.hasCanvasState).toBe(true);
        expect(stateTest.canvasWidth).toBeGreaterThan(0);
        expect(stateTest.canvasHeight).toBeGreaterThan(0);
        expect(stateTest.hasTextEngineConfig).toBe(true);
        expect(stateTest.configKeys.length).toBeGreaterThan(0);
    });

    test('should validate snapshot integrity', async ({ page }) => {
        const validationTest = await page.evaluate(() => {
            // Create valid snapshot
            const validSnapshot = window.app.grid.createSnapshot();
            const validResult = validSnapshot.validate();

            // Create invalid snapshot by corrupting data
            const invalidData = {
                metadata: { timestamp: Date.now(), version: '1.0.0', type: 'GridSnapshot' },
                grid: null, // Missing grid data
                canvas: { width: -1, height: -1 }, // Invalid dimensions
                config: {},
                animation: null
            };

            const invalidSnapshot = GridSnapshot.deserialize(invalidData);
            const invalidResult = invalidSnapshot.validate();

            return {
                validSnapshot: {
                    success: validResult.success,
                    issues: validResult.issues
                },
                invalidSnapshot: {
                    success: invalidResult.success,
                    issues: invalidResult.issues
                }
            };
        });

        expect(validationTest.validSnapshot.success).toBe(true);
        expect(validationTest.validSnapshot.issues.length).toBe(0);
        expect(validationTest.invalidSnapshot.success).toBe(false);
        expect(validationTest.invalidSnapshot.issues.length).toBeGreaterThan(0);
    });

    test('should clone snapshots correctly', async ({ page }) => {
        const cloneTest = await page.evaluate(() => {
            const original = window.app.grid.createSnapshot();
            const clone = original.clone();

            const comparison = original.compare(clone);

            return {
                originalTimestamp: original.timestamp,
                cloneTimestamp: clone.timestamp,
                timestampsMatch: original.timestamp === clone.timestamp,
                versionsMatch: original.version === clone.version,
                gridSame: !comparison.gridChanged,
                canvasSame: !comparison.canvasChanged,
                configSame: !comparison.configChanged,
                animationSame: !comparison.animationChanged
            };
        });

        expect(cloneTest.timestampsMatch).toBe(true);
        expect(cloneTest.versionsMatch).toBe(true);
        expect(cloneTest.gridSame).toBe(true);
        expect(cloneTest.canvasSame).toBe(true);
        expect(cloneTest.configSame).toBe(true);
        expect(cloneTest.animationSame).toBe(true);
    });

    test('should provide meaningful snapshot info', async ({ page }) => {
        const infoTest = await page.evaluate(() => {
            const snapshot = window.app.grid.createSnapshot();
            const info = snapshot.getInfo();

            return {
                hasTimestamp: !!info.timestamp,
                hasVersion: !!info.version,
                hasGridCells: typeof info.gridCells === 'number',
                hasActiveAnimations: typeof info.activeAnimations === 'number',
                hasCanvasSize: !!info.canvasSize,
                hasValidFlag: typeof info.isValid === 'boolean',
                gridCells: info.gridCells,
                canvasSize: info.canvasSize
            };
        });

        expect(infoTest.hasTimestamp).toBe(true);
        expect(infoTest.hasVersion).toBe(true);
        expect(infoTest.hasGridCells).toBe(true);
        expect(infoTest.hasActiveAnimations).toBe(true);
        expect(infoTest.hasCanvasSize).toBe(true);
        expect(infoTest.hasValidFlag).toBe(true);
        expect(infoTest.gridCells).toBeGreaterThanOrEqual(3);
        expect(infoTest.canvasSize).toMatch(/^\d+×\d+$/);
    });
});