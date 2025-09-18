/**
 * Playwright tests for the Spot System functionality
 * Tests the organized spot controllers and detection system
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Spot System Tests', () => {
    let page;
    
    test.beforeEach(async ({ page: testPage }) => {
        page = testPage;
        
        // Set longer timeout for initialization
        page.setDefaultTimeout(10000);
        
        // Navigate to the application
        const filePath = path.join(__dirname, '..', 'index.html');
        await page.goto(`file://${filePath}`);
        
        // Wait for application to initialize with better error handling
        try {
            await page.waitForFunction(() => {
                return window.app && window.app.initialized === true;
            }, { timeout: 8000 });
        } catch (error) {
            console.log('App initialization check failed, checking if classes are available...');
            // Fallback check for basic class availability
            await page.waitForFunction(() => {
                return typeof Spot !== 'undefined' && 
                       typeof SpotDetector !== 'undefined' && 
                       typeof SpotController !== 'undefined';
            }, { timeout: 5000 });
        }
        
        // Clear any existing spots
        await page.evaluate(() => {
            if (window.app && window.app.spots) {
                window.app.spots.length = 0;
                if (window.app.render) {
                    window.app.render();
                }
            }
        });
    });

    test('should load all spot system files without errors', async () => {
        // Check that all spot classes are available
        const spotClassesAvailable = await page.evaluate(() => {
            return {
                Spot: typeof Spot !== 'undefined',
                SpotDetector: typeof SpotDetector !== 'undefined',
                SpotController: typeof SpotController !== 'undefined',
                EmptySpotController: typeof EmptySpotController !== 'undefined',
                TextSpotController: typeof TextSpotController !== 'undefined',
                ImageSpotController: typeof ImageSpotController !== 'undefined',
                MaskSpotController: typeof MaskSpotController !== 'undefined'
            };
        });
        
        expect(spotClassesAvailable.Spot).toBe(true);
        expect(spotClassesAvailable.SpotDetector).toBe(true);
        expect(spotClassesAvailable.SpotController).toBe(true);
        expect(spotClassesAvailable.EmptySpotController).toBe(true);
        expect(spotClassesAvailable.TextSpotController).toBe(true);
        expect(spotClassesAvailable.ImageSpotController).toBe(true);
        expect(spotClassesAvailable.MaskSpotController).toBe(true);
    });

    test('should detect spots when Find Open Spots button is clicked', async () => {
        // Set some test text
        await page.fill('#mainText', 'EMPLOYEE\nSPOTLIGHT\n2024');
        
        // Click Find Open Spots button
        await page.click('#findSpots');
        
        // Wait for spot detection to complete
        await page.waitForTimeout(2000);
        
        // Switch to Spots tab to see results
        await page.click('[data-tab="spots"]');
        
        // Wait for tab to switch
        await page.waitForTimeout(500);
        
        // Check that spots were detected
        const spotCountText = await page.textContent('#spotCount');
        const spotCount = parseInt(spotCountText);
        expect(spotCount).toBeGreaterThan(0);
        
        // Verify spots are visible in the list
        const spotsVisible = await page.locator('#spotsList .spot-item').count();
        expect(spotsVisible).toBeGreaterThan(0);
    });

    test('should create spot instances with correct properties', async () => {
        const spotProperties = await page.evaluate(() => {
            // Create a test spot
            const testSpot = new Spot(1, 100, 100, 200, 150, 0, 0);
            
            return {
                id: testSpot.id,
                x: testSpot.x,
                y: testSpot.y,
                width: testSpot.width,
                height: testSpot.height,
                type: testSpot.type,
                hasContainsMethod: typeof testSpot.contains === 'function',
                hasCenterMethod: typeof testSpot.getCenter === 'function',
                hasAreaMethod: typeof testSpot.getArea === 'function'
            };
        });
        
        expect(spotProperties.id).toBe(1);
        expect(spotProperties.x).toBe(100);
        expect(spotProperties.y).toBe(100);
        expect(spotProperties.width).toBe(200);
        expect(spotProperties.height).toBe(150);
        expect(spotProperties.type).toBe('empty');
        expect(spotProperties.hasContainsMethod).toBe(true);
        expect(spotProperties.hasCenterMethod).toBe(true);
        expect(spotProperties.hasAreaMethod).toBe(true);
    });

    test('should change spot type and show appropriate controls', async () => {
        // Ensure we have spots
        await page.fill('#mainText', 'TEST\nTEXT');
        await page.click('#findSpots');
        await page.waitForTimeout(1000);
        await page.click('[data-tab="spots"]');
        
        // Wait for spots to be visible
        await page.waitForSelector('.spot-item');
        
        // Change first spot to text type
        const firstSpotSelect = page.locator('.spot-item').first().locator('.spot-type-select');
        await firstSpotSelect.selectOption('text');
        
        // Click settings to open controls
        await page.locator('.spot-item').first().locator('.toggle-controls-btn').click();
        
        // Verify text controls are visible
        await expect(page.locator('.spot-text-input')).toBeVisible();
        await expect(page.locator('.spot-font-family')).toBeVisible();
        await expect(page.locator('.spot-text-color')).toBeVisible();
    });

    test('should handle text spot controller functionality', async () => {
        // Setup spots
        await page.fill('#mainText', 'HELLO\nWORLD');
        await page.click('#findSpots');
        await page.waitForTimeout(1000);
        await page.click('[data-tab="spots"]');
        await page.waitForSelector('.spot-item');
        
        // Convert first spot to text
        await page.locator('.spot-item').first().locator('.spot-type-select').selectOption('text');
        await page.locator('.spot-item').first().locator('.toggle-controls-btn').click();
        
        // Test text input
        await page.fill('.spot-text-input', 'Test Text');
        
        // Test font family change
        await page.selectOption('.spot-font-family', '"Arial", sans-serif');
        
        // Test text color change
        await page.fill('.spot-text-color', '#ff0000');
        
        // Test text alignment
        await page.click('.spot-text-alignment .align-btn[title="Left"]');
        
        // Test text styling
        await page.click('.spot-text-styling .style-btn[title="Bold"]');
        
        // Verify the spot content was updated
        const spotContent = await page.evaluate(() => {
            if (window.app && window.app.spots && window.app.spots[0]) {
                return {
                    text: window.app.spots[0].content?.text,
                    color: window.app.spots[0].content?.color,
                    fontFamily: window.app.spots[0].content?.fontFamily,
                    textAlign: window.app.spots[0].content?.textAlign,
                    bold: window.app.spots[0].content?.styles?.bold
                };
            }
            return null;
        });
        
        expect(spotContent?.text).toBe('Test Text');
        expect(spotContent?.color).toBe('#ff0000');
        expect(spotContent?.fontFamily).toBe('"Arial", sans-serif');
        expect(spotContent?.textAlign).toBe('left');
        expect(spotContent?.bold).toBe(true);
    });

    test('should handle image spot controller functionality', async () => {
        // Setup spots
        await page.fill('#mainText', 'IMAGE\nTEST');
        await page.click('#findSpots');
        await page.waitForTimeout(1000);
        await page.click('[data-tab="spots"]');
        await page.waitForSelector('.spot-item');
        
        // Convert first spot to image
        await page.locator('.spot-item').first().locator('.spot-type-select').selectOption('image');
        await page.locator('.spot-item').first().locator('.toggle-controls-btn').click();
        
        // Verify image controls are visible
        await expect(page.locator('.spot-image-input')).toBeVisible();
        
        // After image is loaded, scale and rotation controls should appear
        // For now, just verify the file input exists
        const imageInput = page.locator('.spot-image-input');
        await expect(imageInput).toHaveAttribute('accept', 'image/*');
    });

    test('should handle mask spot controller functionality', async () => {
        // Setup spots
        await page.fill('#mainText', 'MASK\nTEST');
        await page.click('#findSpots');
        await page.waitForTimeout(1000);
        await page.click('[data-tab="spots"]');
        await page.waitForSelector('.spot-item');
        
        // Convert first spot to mask
        await page.locator('.spot-item').first().locator('.spot-type-select').selectOption('mask');
        await page.locator('.spot-item').first().locator('.toggle-controls-btn').click();
        
        // Verify mask controls are visible
        await expect(page.locator('.spot-opacity')).toBeVisible();
        
        // Test opacity control
        await page.fill('.spot-opacity', '75');
        
        // Verify opacity was applied
        const spotOpacity = await page.evaluate(() => {
            if (window.app && window.app.spots && window.app.spots[0]) {
                return window.app.spots[0].opacity;
            }
            return null;
        });
        
        expect(spotOpacity).toBe(0.75);
    });

    test('should handle empty spot controller (no controls)', async () => {
        // Setup spots
        await page.fill('#mainText', 'EMPTY\nTEST');
        await page.click('#findSpots');
        await page.waitForTimeout(1000);
        await page.click('[data-tab="spots"]');
        await page.waitForSelector('.spot-item');
        
        // First spot should be empty by default
        await page.locator('.spot-item').first().locator('.toggle-controls-btn').click();
        
        // Verify empty spot message is shown
        const emptyMessage = page.locator('.spot-controls p');
        await expect(emptyMessage).toContainText('This spot is empty');
    });

    test('should detect spots automatically when text changes (if auto-detect is enabled)', async () => {
        // Ensure auto-detect is enabled
        await page.check('#autoDetectSpots');
        
        // Change main text
        await page.fill('#mainText', 'AUTO\nDETECT\nTEST');
        
        // Wait for auto-detection
        await page.waitForTimeout(1500);
        
        // Check spots tab
        await page.click('[data-tab="spots"]');
        
        // Should have detected spots automatically
        const spotCount = await page.textContent('#spotCount');
        expect(parseInt(spotCount)).toBeGreaterThan(0);
    });

    test('should respect minimum spot size setting', async () => {
        // Set a larger minimum spot size
        await page.click('[data-tab="spots"]');
        await page.fill('#minSpotSize', '100');
        
        // Set text that might create small spots
        await page.fill('#mainText', 'A\nB\nC\nD\nE\nF');
        await page.click('#findSpots');
        await page.waitForTimeout(1000);
        
        // Verify spots meet minimum size requirement
        const validSpots = await page.evaluate(() => {
            if (window.app && window.app.spots) {
                return window.app.spots.every(spot => 
                    spot.width >= 100 && spot.height >= 100
                );
            }
            return true;
        });
        
        expect(validSpots).toBe(true);
    });

    test('should maintain spot data integrity during type changes', async () => {
        // Setup initial spot
        await page.fill('#mainText', 'DATA\nINTEGRITY');
        await page.click('#findSpots');
        await page.waitForTimeout(1000);
        await page.click('[data-tab="spots"]');
        await page.waitForSelector('.spot-item');
        
        const firstSpot = page.locator('.spot-item').first();
        
        // Get initial spot properties
        const initialSpot = await page.evaluate(() => {
            if (window.app && window.app.spots && window.app.spots[0]) {
                const spot = window.app.spots[0];
                return {
                    id: spot.id,
                    x: spot.x,
                    y: spot.y,
                    width: spot.width,
                    height: spot.height
                };
            }
            return null;
        });
        
        // Change to text, then back to empty
        await firstSpot.locator('.spot-type-select').selectOption('text');
        await firstSpot.locator('.spot-type-select').selectOption('empty');
        
        // Verify position/size properties remain the same
        const finalSpot = await page.evaluate(() => {
            if (window.app && window.app.spots && window.app.spots[0]) {
                const spot = window.app.spots[0];
                return {
                    id: spot.id,
                    x: spot.x,
                    y: spot.y,
                    width: spot.width,
                    height: spot.height
                };
            }
            return null;
        });
        
        expect(finalSpot?.id).toBe(initialSpot?.id);
        expect(finalSpot?.x).toBe(initialSpot?.x);
        expect(finalSpot?.y).toBe(initialSpot?.y);
        expect(finalSpot?.width).toBe(initialSpot?.width);
        expect(finalSpot?.height).toBe(initialSpot?.height);
    });

    test('should handle spot popup interactions', async () => {
        // Setup spots
        await page.fill('#mainText', 'POPUP\nTEST');
        await page.click('#findSpots');
        await page.waitForTimeout(1000);
        
        // Enable debug mode to see spot outlines
        await page.check('#showSpotOutlines');
        
        // The canvas should be rendered with spots
        const canvas = page.locator('#chatooly-canvas');
        await expect(canvas).toBeVisible();
        
        // Verify canvas has proper dimensions
        const canvasSize = await page.evaluate(() => {
            const canvas = document.getElementById('chatooly-canvas');
            return {
                width: canvas.width,
                height: canvas.height
            };
        });
        
        expect(canvasSize.width).toBe(600);
        expect(canvasSize.height).toBe(600);
    });
});

test.describe('Spot Controller Inheritance Tests', () => {
    let page;
    
    test.beforeEach(async ({ page: testPage }) => {
        page = testPage;
        const filePath = path.join(__dirname, '..', 'index.html');
        await page.goto(`file://${filePath}`);
        await page.waitForFunction(() => window.app && window.app.initialized);
    });

    test('should verify controller inheritance hierarchy', async () => {
        const inheritanceTest = await page.evaluate(() => {
            // Test that all spot controllers extend the base SpotController
            const emptyController = new EmptySpotController(window.app);
            const textController = new TextSpotController(window.app);
            const imageController = new ImageSpotController(window.app);
            const maskController = new MaskSpotController(window.app);
            
            return {
                emptyIsSpotController: emptyController instanceof SpotController,
                textIsSpotController: textController instanceof SpotController,
                imageIsSpotController: imageController instanceof SpotController,
                maskIsSpotController: maskController instanceof SpotController,
                emptyType: emptyController.spotType,
                textType: textController.spotType,
                imageType: imageController.spotType,
                maskType: maskController.spotType
            };
        });
        
        expect(inheritanceTest.emptyIsSpotController).toBe(true);
        expect(inheritanceTest.textIsSpotController).toBe(true);
        expect(inheritanceTest.imageIsSpotController).toBe(true);
        expect(inheritanceTest.maskIsSpotController).toBe(true);
        expect(inheritanceTest.emptyType).toBe('empty');
        expect(inheritanceTest.textType).toBe('text');
        expect(inheritanceTest.imageType).toBe('image');
        expect(inheritanceTest.maskType).toBe('mask');
    });

    test('should verify controller default content generation', async () => {
        const defaultContent = await page.evaluate(() => {
            const emptyController = new EmptySpotController(window.app);
            const textController = new TextSpotController(window.app);
            const imageController = new ImageSpotController(window.app);
            const maskController = new MaskSpotController(window.app);
            
            return {
                empty: emptyController.getDefaultContent(),
                text: textController.getDefaultContent(),
                image: imageController.getDefaultContent(),
                mask: maskController.getDefaultContent()
            };
        });
        
        // Empty should have minimal content
        expect(Object.keys(defaultContent.empty)).toHaveLength(0);
        
        // Text should have text-specific defaults
        expect(defaultContent.text).toHaveProperty('text', '');
        expect(defaultContent.text).toHaveProperty('color', '#000000');
        expect(defaultContent.text).toHaveProperty('textAlign', 'center');
        
        // Image should have image-specific defaults
        expect(defaultContent.image).toHaveProperty('image', null);
        expect(defaultContent.image).toHaveProperty('scale', 1);
        expect(defaultContent.image).toHaveProperty('rotation', 0);
        
        // Mask should have mask-specific defaults
        expect(defaultContent.mask).toHaveProperty('opacity', 0.5);
    });
});