/**
 * grid-system.spec.js - Playwright tests for Grid Animation System
 * Tests the Grid visual representation and status functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Grid Animation System', () => {
    test.beforeEach(async ({ page }) => {
        // Start development server and navigate to application
        await page.goto('http://localhost:3000');

        // Wait for application to initialize
        await page.waitForFunction(() => {
            return window.app && window.app.grid && window.app.grid.isGridReady();
        });
    });

    test('should initialize Grid system correctly', async ({ page }) => {
        // Check that Grid system is initialized
        const gridExists = await page.evaluate(() => {
            return !!(window.app && window.app.grid);
        });

        expect(gridExists).toBe(true);

        // Check initial grid status
        const status = await page.evaluate(() => {
            return window.app.grid.getStatus();
        });

        expect(status.isReady).toBe(true);
        expect(status.isLocked).toBe(false);
        expect(status.hasSnapshot).toBe(false);
    });

    test('should show correct visual grid layout for text only', async ({ page }) => {
        let consoleMessages = [];

        // Capture console messages
        page.on('console', msg => {
            consoleMessages.push(msg.text());
        });

        // Get grid status to trigger visual output
        const status = await page.evaluate(() => {
            return window.app.grid.getStatus();
        });

        // Verify basic status - spatial grid is now 3x3
        expect(status.rows).toBe(3); // 3x3 spatial grid
        expect(status.cols).toBe(3); // 3 columns for spatial positioning
        expect(status.totalCells).toBeGreaterThanOrEqual(1); // At least 1 text cell

        // Check that visual grid messages were logged
        const hasVisualLayout = consoleMessages.some(msg =>
            msg.includes('📋 Visual Grid Layout:')
        );
        expect(hasVisualLayout).toBe(true);

        // Check for expected text content in console
        // Note: In spatial grid, multiple lines might appear in the same cell or different rows
        const gridOutput = consoleMessages.join('\n');
        const hasTextContent = gridOutput.includes('EMPLOYEE') ||
                              gridOutput.includes('SPOTLIGHT') ||
                              gridOutput.includes('2024');

        expect(hasTextContent).toBe(true);
    });

    test('should show correct visual grid layout with spots', async ({ page }) => {
        let consoleMessages = [];

        // Capture console messages
        page.on('console', msg => {
            consoleMessages.push(msg.text());
        });

        // Click "Find Open Spots" button
        await page.getByRole('button', { name: 'Find Open Spots' }).click();

        // Wait for spot detection to complete
        await page.waitForTimeout(1000);

        // Rebuild grid and get status
        const status = await page.evaluate(() => {
            window.app.grid.buildFromExisting();
            return window.app.grid.getStatus();
        });

        // Verify grid now has spots
        expect(status.rows).toBeGreaterThan(3);
        expect(status.totalCells).toBeGreaterThan(3);

        // Check that visual grid shows spots
        const hasEmptySpots = consoleMessages.some(msg =>
            msg.includes('[empty]')
        );
        expect(hasEmptySpots).toBe(true);

        // Check columns per row information
        const hasColumnInfo = consoleMessages.some(msg =>
            msg.includes('📊 Columns per row:')
        );
        expect(hasColumnInfo).toBe(true);
    });

    test('should provide detailed status breakdown', async ({ page }) => {
        // First, detect spots
        await page.getByRole('button', { name: 'Find Open Spots' }).click();
        await page.waitForTimeout(1000);

        // Get detailed status
        const detailedStatus = await page.evaluate(() => {
            window.app.grid.buildFromExisting();
            return window.app.grid.getDetailedStatus();
        });

        // Verify detailed breakdown structure
        expect(detailedStatus).toHaveProperty('basic');
        expect(detailedStatus).toHaveProperty('breakdown');
        expect(detailedStatus).toHaveProperty('textContent');
        expect(detailedStatus).toHaveProperty('rowStructure');

        // Check text content
        expect(detailedStatus.textContent).toEqual(['EMPLOYEE', 'SPOTLIGHT', '2024']);

        // Check breakdown
        expect(detailedStatus.breakdown.textCells).toBe(3);
        expect(detailedStatus.breakdown.spotCells).toBeGreaterThan(0);

        // Check row structure
        expect(detailedStatus.rowStructure).toBeInstanceOf(Array);
        expect(detailedStatus.rowStructure.length).toBeGreaterThan(3);
    });

    test('should handle matrix access correctly', async ({ page }) => {
        // Test matrix access methods
        const matrixTests = await page.evaluate(() => {
            const results = {};

            // Test valid cell access
            const cell00 = window.app.grid.getCell(0, 0);
            results.validCell = !!(cell00 && cell00.type === 'main-text' && cell00.text === 'EMPLOYEE');

            // Test invalid cell access
            const invalidCell = window.app.grid.getCell(999, 999);
            results.invalidCell = invalidCell === null;

            // Test getAllCells
            const allCells = window.app.grid.getAllCells();
            results.allCellsCount = allCells.length;
            results.hasTextCells = allCells.some(cell => cell.type === 'main-text');

            // Test row bounds
            const lastRowCell = window.app.grid.getCell(window.app.grid.rows - 1, 0);
            results.lastRowAccess = !!lastRowCell;

            return results;
        });

        expect(matrixTests.validCell).toBe(true);
        expect(matrixTests.invalidCell).toBe(true);
        expect(matrixTests.allCellsCount).toBeGreaterThanOrEqual(3);
        expect(matrixTests.hasTextCells).toBe(true);
        expect(matrixTests.lastRowAccess).toBe(true);
    });

    test('should serialize and deserialize grid correctly', async ({ page }) => {
        // Detect spots first to have a more complex grid
        await page.getByRole('button', { name: 'Find Open Spots' }).click();
        await page.waitForTimeout(1000);

        const serializationTest = await page.evaluate(() => {
            // Rebuild grid to include spots
            window.app.grid.buildFromExisting();

            // Create snapshot
            const snapshot = window.app.grid.serialize();

            // Verify snapshot structure
            const hasMetadata = !!(snapshot.metadata &&
                                  snapshot.metadata.timestamp &&
                                  snapshot.metadata.canvasWidth &&
                                  snapshot.metadata.canvasHeight);

            const hasLayout = !!(snapshot.layout &&
                               snapshot.layout.rows &&
                               snapshot.layout.cols &&
                               snapshot.layout.cells);

            const cellCount = snapshot.layout.cells.length;
            const hasTextCells = snapshot.layout.cells.some(cell => cell.type === 'main-text');
            const hasSpotCells = snapshot.layout.cells.some(cell => cell.type === 'spot');

            return {
                hasMetadata,
                hasLayout,
                cellCount,
                hasTextCells,
                hasSpotCells,
                rowCount: snapshot.layout.rows,
                colCount: snapshot.layout.cols
            };
        });

        expect(serializationTest.hasMetadata).toBe(true);
        expect(serializationTest.hasLayout).toBe(true);
        expect(serializationTest.cellCount).toBeGreaterThan(3);
        expect(serializationTest.hasTextCells).toBe(true);
        expect(serializationTest.hasSpotCells).toBe(true);
        expect(serializationTest.rowCount).toBeGreaterThan(3);
    });

    test('should handle text changes and grid rebuilding', async ({ page }) => {
        // Change text content
        await page.fill('#mainText', 'HELLO\nWORLD\nTEST');

        // Wait for changes to process and trigger text engine update
        await page.waitForTimeout(500);

        // Force text update in the app and rebuild grid
        const newStatus = await page.evaluate(() => {
            // Update text engine with new content
            window.app.textEngine.setText(window.app.elements.mainText.value);

            // Rebuild grid with updated text
            window.app.grid.buildFromExisting();

            return {
                status: window.app.grid.getStatus(),
                textContent: window.app.grid.getAllCells()
                    .filter(cell => cell.type === 'main-text')
                    .map(cell => cell.text)
            };
        });

        // Verify new text is reflected in grid
        expect(newStatus.textContent).toEqual(['HELLO', 'WORLD', 'TEST']);
        expect(newStatus.status.totalCells).toBeGreaterThanOrEqual(3);
    });

    test('should show proper visual representation in console', async ({ page }) => {
        let consoleMessages = [];

        // Capture all console messages
        page.on('console', msg => {
            consoleMessages.push(msg.text());
        });

        // Trigger visual grid display
        await page.evaluate(() => {
            window.app.grid.getStatus();
        });

        // Check for visual formatting elements
        const hasTopBorder = consoleMessages.some(msg =>
            msg.includes('=====================================')
        );

        const hasRowLabels = consoleMessages.some(msg =>
            msg.includes('Row 0:') || msg.includes('Row 1:') || msg.includes('Row 2:')
        );

        const hasColumnInfo = consoleMessages.some(msg =>
            msg.includes('filled cells') && msg.includes('total slots')
        );

        expect(hasTopBorder).toBe(true);
        expect(hasRowLabels).toBe(true);
        expect(hasColumnInfo).toBe(true);
    });

    test('should maintain grid integrity after multiple operations', async ({ page }) => {
        // Perform multiple operations
        await page.getByRole('button', { name: 'Find Open Spots' }).click();
        await page.waitForTimeout(500);

        await page.fill('#mainText', 'NEW\nTEXT\nLAYOUT');
        await page.waitForTimeout(500);

        await page.getByRole('button', { name: 'Find Open Spots' }).click();
        await page.waitForTimeout(500);

        // Verify grid is still functional
        const finalStatus = await page.evaluate(() => {
            window.app.grid.buildFromExisting();
            return {
                status: window.app.grid.getStatus(),
                canSerialize: !!window.app.grid.serialize(),
                hasValidCells: window.app.grid.getAllCells().length > 0
            };
        });

        expect(finalStatus.status.isReady).toBe(true);
        expect(finalStatus.canSerialize).toBe(true);
        expect(finalStatus.hasValidCells).toBe(true);
    });
});

test.describe('Grid Visual Output Validation', () => {
    test('should display expected grid format in console', async ({ page }) => {
        await page.goto('http://localhost:3000');

        // Wait for initialization
        await page.waitForFunction(() => {
            return window.app && window.app.grid && window.app.grid.isGridReady();
        });

        let consoleOutput = [];
        page.on('console', msg => {
            consoleOutput.push(msg.text());
        });

        // Trigger grid display
        await page.evaluate(() => {
            window.app.grid.getStatus();
        });

        // Verify the exact format matches expectations
        const gridDisplay = consoleOutput.join('\n');

        // Should contain the expected grid format
        expect(gridDisplay).toContain('[EMPLOYEE]');
        expect(gridDisplay).toContain('[SPOTLIGHT]');
        expect(gridDisplay).toContain('[2024]');
        expect(gridDisplay).toContain('Row 0:');
        expect(gridDisplay).toContain('Row 1:');
        expect(gridDisplay).toContain('Row 2:');
    });
});