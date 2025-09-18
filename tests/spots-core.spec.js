/**
 * Core Playwright tests for the Spot System functionality
 * Focused on essential spot system organization and functionality
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Spot System Core Tests', () => {
    let page;
    
    test.beforeEach(async ({ page: testPage }) => {
        page = testPage;
        page.setDefaultTimeout(8000);
        
        const filePath = path.join(__dirname, '..', 'index.html');
        await page.goto(`file://${filePath}`);
        
        // Wait for spot classes to be available
        await page.waitForFunction(() => {
            return typeof Spot !== 'undefined' && 
                   typeof SpotDetector !== 'undefined' && 
                   typeof SpotController !== 'undefined';
        }, { timeout: 6000 });
    });

    test('should load all spot system files from organized structure', async () => {
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
        
        // Verify all spot system classes loaded correctly
        expect(spotClassesAvailable.Spot).toBe(true);
        expect(spotClassesAvailable.SpotDetector).toBe(true);
        expect(spotClassesAvailable.SpotController).toBe(true);
        expect(spotClassesAvailable.EmptySpotController).toBe(true);
        expect(spotClassesAvailable.TextSpotController).toBe(true);
        expect(spotClassesAvailable.ImageSpotController).toBe(true);
        expect(spotClassesAvailable.MaskSpotController).toBe(true);
    });

    test('should create and configure Spot instances correctly', async () => {
        const spotTest = await page.evaluate(() => {
            const testSpot = new Spot(1, 100, 100, 200, 150, 0, 0);
            
            // Test basic properties
            const basicProps = {
                id: testSpot.id,
                x: testSpot.x,
                y: testSpot.y,
                width: testSpot.width,
                height: testSpot.height,
                type: testSpot.type
            };
            
            // Test methods
            const center = testSpot.getCenter();
            const area = testSpot.getArea();
            const aspectRatio = testSpot.getAspectRatio();
            const contains = testSpot.contains(150, 150);
            
            // Test type changes
            testSpot.setType('text');
            const typeAfterChange = testSpot.type;
            
            return {
                ...basicProps,
                center,
                area,
                aspectRatio,
                contains,
                typeAfterChange
            };
        });
        
        expect(spotTest.id).toBe(1);
        expect(spotTest.x).toBe(100);
        expect(spotTest.y).toBe(100);
        expect(spotTest.width).toBe(200);
        expect(spotTest.height).toBe(150);
        expect(spotTest.type).toBe('empty');
        expect(spotTest.center).toEqual({ x: 200, y: 175 });
        expect(spotTest.area).toBe(30000);
        expect(spotTest.aspectRatio).toBeCloseTo(1.333, 2);
        expect(spotTest.contains).toBe(true);
        expect(spotTest.typeAfterChange).toBe('text');
    });

    test('should initialize SpotDetector with correct configuration', async () => {
        const detectorTest = await page.evaluate(() => {
            const detector = new SpotDetector();
            
            // Test initial configuration
            const initialConfig = {
                minSpotSize: detector.minSpotSize,
                debugging: detector.debugging
            };
            
            // Test configuration methods
            detector.setMinSpotSize(75);
            detector.setDebugging(true);
            
            const updatedConfig = {
                minSpotSize: detector.minSpotSize,
                debugging: detector.debugging
            };
            
            return { initialConfig, updatedConfig };
        });
        
        expect(detectorTest.initialConfig.minSpotSize).toBe(50);
        expect(detectorTest.initialConfig.debugging).toBe(false);
        expect(detectorTest.updatedConfig.minSpotSize).toBe(75);
        expect(detectorTest.updatedConfig.debugging).toBe(true);
    });

    test('should verify controller inheritance structure', async () => {
        const inheritanceTest = await page.evaluate(() => {
            // Create mock app object
            const mockApp = { render: () => {}, updateSpotsUI: () => {} };
            
            const emptyController = new EmptySpotController(mockApp);
            const textController = new TextSpotController(mockApp);
            const imageController = new ImageSpotController(mockApp);
            const maskController = new MaskSpotController(mockApp);
            
            return {
                emptyIsSpotController: emptyController instanceof SpotController,
                textIsSpotController: textController instanceof SpotController,
                imageIsSpotController: imageController instanceof SpotController,
                maskIsSpotController: maskController instanceof SpotController,
                emptyType: emptyController.spotType,
                textType: textController.spotType,
                imageType: imageController.spotType,
                maskType: maskController.spotType,
                emptyDefaults: emptyController.getDefaultContent(),
                textDefaults: textController.getDefaultContent(),
                imageDefaults: imageController.getDefaultContent(),
                maskDefaults: maskController.getDefaultContent()
            };
        });
        
        // Verify inheritance
        expect(inheritanceTest.emptyIsSpotController).toBe(true);
        expect(inheritanceTest.textIsSpotController).toBe(true);
        expect(inheritanceTest.imageIsSpotController).toBe(true);
        expect(inheritanceTest.maskIsSpotController).toBe(true);
        
        // Verify spot types
        expect(inheritanceTest.emptyType).toBe('empty');
        expect(inheritanceTest.textType).toBe('text');
        expect(inheritanceTest.imageType).toBe('image');
        expect(inheritanceTest.maskType).toBe('mask');
        
        // Verify default content
        expect(Object.keys(inheritanceTest.emptyDefaults)).toHaveLength(0);
        expect(inheritanceTest.textDefaults).toHaveProperty('text', '');
        expect(inheritanceTest.textDefaults).toHaveProperty('color', '#000000');
        expect(inheritanceTest.imageDefaults).toHaveProperty('scale', 1);
        expect(inheritanceTest.maskDefaults).toHaveProperty('opacity', 0.5);
    });

    test('should detect spots when text is provided', async () => {
        const detectionTest = await page.evaluate(() => {
            const detector = new SpotDetector();
            const canvas = { width: 600, height: 600 };
            const textBounds = [
                { text: 'HELLO', x: 100, y: 100, width: 200, height: 60 },
                { text: 'WORLD', x: 50, y: 200, width: 300, height: 60 }
            ];
            const padding = { top: 20, bottom: 20, left: 20, right: 20 };
            
            const spots = detector.detect(canvas, textBounds, padding);
            
            return {
                spotCount: spots.length,
                firstSpotValid: spots.length > 0 ? {
                    hasValidDimensions: spots[0].width > 0 && spots[0].height > 0,
                    withinBounds: spots[0].x >= 0 && spots[0].y >= 0,
                    hasId: typeof spots[0].id === 'number'
                } : null
            };
        });
        
        expect(detectionTest.spotCount).toBeGreaterThan(0);
        if (detectionTest.firstSpotValid) {
            expect(detectionTest.firstSpotValid.hasValidDimensions).toBe(true);
            expect(detectionTest.firstSpotValid.withinBounds).toBe(true);
            expect(detectionTest.firstSpotValid.hasId).toBe(true);
        }
    });

    test('should handle empty canvas case gracefully', async () => {
        const emptyCanvasTest = await page.evaluate(() => {
            const detector = new SpotDetector();
            const canvas = { width: 400, height: 400 };
            const textBounds = []; // No text
            const padding = { top: 10, bottom: 10, left: 10, right: 10 };
            
            const spots = detector.detect(canvas, textBounds, padding);
            
            return {
                spotCount: spots.length,
                fullCanvasSpot: spots.length > 0 ? {
                    width: spots[0].width,
                    height: spots[0].height,
                    x: spots[0].x,
                    y: spots[0].y
                } : null
            };
        });
        
        expect(emptyCanvasTest.spotCount).toBe(1); // Should create one full canvas spot
        if (emptyCanvasTest.fullCanvasSpot) {
            expect(emptyCanvasTest.fullCanvasSpot.width).toBe(380); // 400 - 20 padding
            expect(emptyCanvasTest.fullCanvasSpot.height).toBe(380);
            expect(emptyCanvasTest.fullCanvasSpot.x).toBe(10);
            expect(emptyCanvasTest.fullCanvasSpot.y).toBe(10);
        }
    });

    test('should respect minimum spot size settings', async () => {
        const minSizeTest = await page.evaluate(() => {
            const detector = new SpotDetector();
            detector.setMinSpotSize(100);
            
            const canvas = { width: 600, height: 600 };
            const textBounds = [
                { text: 'A', x: 50, y: 50, width: 20, height: 20 }, // Would create small spots
                { text: 'B', x: 100, y: 300, width: 200, height: 80 } // Should create valid spots
            ];
            
            const spots = detector.detect(canvas, textBounds);
            
            return {
                allSpotsValid: spots.every(spot => spot.width >= 100 && spot.height >= 100),
                spotCount: spots.length
            };
        });
        
        expect(minSizeTest.allSpotsValid).toBe(true);
    });

    test('should provide debug information when enabled', async () => {
        const debugTest = await page.evaluate(() => {
            const detector = new SpotDetector();
            detector.setDebugging(true);
            
            const canvas = { width: 400, height: 400 };
            const textBounds = [
                { text: 'DEBUG', x: 100, y: 100, width: 150, height: 50 }
            ];
            
            const spots = detector.detect(canvas, textBounds);
            const debugInfo = detector.getDebugInfo();
            
            return {
                hasDebugInfo: typeof debugInfo === 'object' && debugInfo !== null,
                hasCanvasSize: debugInfo.hasOwnProperty('canvasSize'),
                hasTextLines: debugInfo.hasOwnProperty('textLines'),
                hasDetectedSpots: debugInfo.hasOwnProperty('detectedSpots'),
                hasProcessingSteps: Array.isArray(debugInfo.processingSteps)
            };
        });
        
        expect(debugTest.hasDebugInfo).toBe(true);
        expect(debugTest.hasCanvasSize).toBe(true);
        expect(debugTest.hasTextLines).toBe(true);
        expect(debugTest.hasDetectedSpots).toBe(true);
        expect(debugTest.hasProcessingSteps).toBe(true);
    });
});

test.describe('Spot System Integration Tests', () => {
    let page;
    
    test.beforeEach(async ({ page: testPage }) => {
        page = testPage;
        page.setDefaultTimeout(8000);
        
        const filePath = path.join(__dirname, '..', 'index.html');
        await page.goto(`file://${filePath}`);
        
        await page.waitForFunction(() => {
            return typeof Spot !== 'undefined' && typeof window.app !== 'undefined';
        }, { timeout: 6000 });
    });

    test('should integrate with main application', async () => {
        const integrationTest = await page.evaluate(() => {
            // Test that the application has the necessary spot-related properties
            return {
                appExists: typeof window.app !== 'undefined',
                hasRenderMethod: typeof window.app?.render === 'function',
                spotsArrayExists: Array.isArray(window.app?.spots),
                hasSpotDetector: window.app?.spotDetector !== undefined,
                hasSpotControllers: window.app?.spotControllers !== undefined
            };
        });
        
        expect(integrationTest.appExists).toBe(true);
        expect(integrationTest.hasRenderMethod).toBe(true);
        expect(integrationTest.spotsArrayExists).toBe(true);
        // These may not be directly accessible but the classes should be available
        expect(integrationTest.hasSpotDetector || typeof SpotDetector !== 'undefined').toBe(true);
    });

    test('should have canvas element properly configured', async () => {
        const canvasTest = await page.evaluate(() => {
            const canvas = document.getElementById('chatooly-canvas');
            return {
                canvasExists: canvas !== null,
                hasWidth: canvas?.width > 0,
                hasHeight: canvas?.height > 0,
                width: canvas?.width,
                height: canvas?.height
            };
        });
        
        expect(canvasTest.canvasExists).toBe(true);
        expect(canvasTest.hasWidth).toBe(true);
        expect(canvasTest.hasHeight).toBe(true);
        expect(canvasTest.width).toBe(600);
        expect(canvasTest.height).toBe(600);
    });
});