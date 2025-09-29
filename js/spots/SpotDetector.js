/**
 * SpotDetector.js - Text-driven layout algorithm for finding open spots
 * Implements the line-based strategy where text defines the grid structure
 */

class SpotDetector {
    constructor() {
        this.minSpotSize = 50; // Minimum spot dimensions in pixels
        this.debugging = false;
        this.debugData = {};
    }
    
    /**
     * Set minimum spot size
     * @param {number} size - Minimum width/height in pixels
     */
    setMinSpotSize(size) {
        this.minSpotSize = Math.max(10, size);
    }
    
    /**
     * Enable/disable debugging
     * @param {boolean} enabled - Whether to enable debug mode
     */
    setDebugging(enabled) {
        this.debugging = enabled;
    }
    
    /**
     * Main detection method - finds all open spots based on text layout
     * @param {Object} canvas - Canvas with width/height properties
     * @param {Array} textBounds - Array of text line bounding boxes
     * @param {Object} padding - Padding object with top, bottom, left, right
     * @returns {Array} Array of detected Spot objects
     */
    detect(canvas, textBounds, padding = {top: 0, bottom: 0, left: 0, right: 0}) {
        const startTime = performance.now();

        // Initialize GridBuilder for spatial layout discovery
        this.gridBuilder = new GridBuilder();
        this.gridBuilder.startBuild();

        // Initialize debug data
        if (this.debugging) {
            this.debugData = {
                canvasSize: `${canvas.width}x${canvas.height}`,
                textLines: textBounds.length,
                detectedSpots: 0,
                processingSteps: []
            };
        }
        
        const spots = [];
        let spotId = 1;
        
        // Handle empty text case
        if (!textBounds || textBounds.length === 0) {
            const availableWidth = canvas.width - padding.left - padding.right;
            const availableHeight = canvas.height - padding.top - padding.bottom;
            
            const fullCanvasSpot = new Spot(
                spotId,
                padding.left,
                padding.top,
                availableWidth,
                availableHeight,
                0,
                0
            );
            
            if (this.debugging) {
                this.debugData.processingSteps.push('Empty text: created full canvas spot within padding');
            }
            
            return [fullCanvasSpot];
        }
        
        // Filter out empty lines for processing
        const nonEmptyBounds = textBounds.filter(bounds => bounds.text.trim());
        
        if (this.debugging) {
            this.debugData.processingSteps.push(`Filtered to ${nonEmptyBounds.length} non-empty lines`);
        }
        
        // Step 1: Process each text line to find horizontal spots
        let currentRow = 0;
        let occupiedRegions = []; // Track all occupied areas
        
        nonEmptyBounds.forEach((bounds, index) => {
            if (this.debugging) {
                this.debugData.processingSteps.push(`Processing line ${index}: "${bounds.text}"`);
            }
            
            // Add this text bounds to occupied regions
            occupiedRegions.push({
                x: bounds.x,
                y: bounds.y,
                width: bounds.width,
                height: bounds.height,
                type: 'text'
            });

            // Add text region to GridBuilder for spatial discovery
            this.gridBuilder.addTextRegion(bounds, bounds.text, index);
            
            // Check for spot to the LEFT of text (respecting left padding)
            const leftSpotWidth = bounds.x - padding.left;
            if (leftSpotWidth >= this.minSpotSize && bounds.height >= this.minSpotSize) {
                const leftSpot = new Spot(
                    spotId++,
                    padding.left,
                    bounds.y,
                    leftSpotWidth,
                    bounds.height,
                    currentRow,
                    0
                );
                spots.push(leftSpot);

                // Add left spot to GridBuilder
                this.gridBuilder.addSpotRegion(leftSpot);

                if (this.debugging) {
                    this.debugData.processingSteps.push(`  Found left spot: ${Math.round(leftSpotWidth)}x${Math.round(bounds.height)}`);
                }
            }
            
            // Check for spot to the RIGHT of text (respecting right padding)
            const rightSpotX = bounds.x + bounds.width;
            const rightSpotWidth = canvas.width - padding.right - rightSpotX;
            if (rightSpotWidth >= this.minSpotSize && bounds.height >= this.minSpotSize) {
                const rightSpot = new Spot(
                    spotId++,
                    rightSpotX,
                    bounds.y,
                    rightSpotWidth,
                    bounds.height,
                    currentRow,
                    2 // Column after text
                );
                spots.push(rightSpot);

                // Add right spot to GridBuilder
                this.gridBuilder.addSpotRegion(rightSpot);

                if (this.debugging) {
                    this.debugData.processingSteps.push(`  Found right spot: ${Math.round(rightSpotWidth)}x${Math.round(bounds.height)}`);
                }
            }
            
            currentRow++;
        });
        
        // Step 2: Find vertical gaps between text lines
        if (nonEmptyBounds.length > 1) {
            for (let i = 0; i < nonEmptyBounds.length - 1; i++) {
                const currentLine = nonEmptyBounds[i];
                const nextLine = nonEmptyBounds[i + 1];
                
                const gapY = currentLine.y + currentLine.height;
                const gapHeight = nextLine.y - gapY;
                
                if (gapHeight >= this.minSpotSize) {
                    // Create a spot in the gap (respecting horizontal padding)
                    const availableWidth = canvas.width - padding.left - padding.right;
                    const gapSpot = new Spot(
                        spotId++,
                        padding.left,
                        gapY,
                        availableWidth,
                        gapHeight,
                        currentRow++,
                        0
                    );
                    spots.push(gapSpot);

                    // Add gap spot to GridBuilder
                    this.gridBuilder.addSpotRegion(gapSpot);

                    if (this.debugging) {
                        this.debugData.processingSteps.push(`Found gap between lines: ${Math.round(gapHeight)}px high`);
                    }
                }
            }
        }
        
        // Step 3: Check for remaining space at the TOP (before first line, respecting top padding)
        if (nonEmptyBounds.length > 0) {
            const firstLine = nonEmptyBounds[0];
            const topSpaceHeight = firstLine.y - padding.top;

            if (topSpaceHeight >= this.minSpotSize) {
                const availableWidth = canvas.width - padding.left - padding.right;
                const topSpot = new Spot(
                    spotId++,
                    padding.left,
                    padding.top,
                    availableWidth,
                    topSpaceHeight,
                    -1, // Before first row
                    0
                );
                spots.push(topSpot);

                // Add top spot to GridBuilder
                this.gridBuilder.addSpotRegion(topSpot);

                if (this.debugging) {
                    this.debugData.processingSteps.push(`Found top space: ${Math.round(topSpaceHeight)}px high`);
                }
            }
        }
        
        // Step 4: Check for remaining space at the BOTTOM (after last line, respecting bottom padding)
        if (nonEmptyBounds.length > 0) {
            const lastLine = nonEmptyBounds[nonEmptyBounds.length - 1];
            const bottomSpaceY = lastLine.y + lastLine.height;
            const bottomSpaceHeight = canvas.height - padding.bottom - bottomSpaceY;

            if (bottomSpaceHeight >= this.minSpotSize) {
                const availableWidth = canvas.width - padding.left - padding.right;
                const bottomSpot = new Spot(
                    spotId++,
                    padding.left,
                    bottomSpaceY,
                    availableWidth,
                    bottomSpaceHeight,
                    currentRow,
                    0
                );
                spots.push(bottomSpot);

                // Add bottom spot to GridBuilder
                this.gridBuilder.addSpotRegion(bottomSpot);

                if (this.debugging) {
                    this.debugData.processingSteps.push(`Found bottom space: ${Math.round(bottomSpaceHeight)}px high`);
                }
            }
        }
        
        // Step 5: Validate and clean up spots
        const validSpots = this.validateSpots(spots, canvas);

        // Step 6: Finalize the spatial grid based on discovered layout
        const gridResult = this.gridBuilder.finalizeGrid();

        // Store grid result for access by Grid system
        this.lastGridResult = gridResult;

        // Final debug info
        const endTime = performance.now();
        const detectionTime = Math.round(endTime - startTime);

        if (this.debugging) {
            this.debugData.detectedSpots = validSpots.length;
            this.debugData.detectionTime = detectionTime;
            this.debugData.processingSteps.push(`Final: ${validSpots.length} valid spots in ${detectionTime}ms`);
            this.debugData.processingSteps.push(`Grid: ${gridResult.rows}x${gridResult.cols} with ${this.gridBuilder.regions.length} regions`);
        }

        return validSpots;
    }
    
    /**
     * Validate spots and ensure they meet requirements
     * @param {Array} spots - Array of detected spots
     * @param {Object} canvas - Canvas dimensions
     * @returns {Array} Array of valid spots
     * @private
     */
    validateSpots(spots, canvas) {
        return spots.filter((spot, index) => {
            // Check minimum size
            if (spot.width < this.minSpotSize || spot.height < this.minSpotSize) {
                if (this.debugging) {
                    this.debugData.processingSteps.push(`Rejected spot ${spot.id}: too small (${Math.round(spot.width)}x${Math.round(spot.height)})`);
                }
                return false;
            }
            
            // Check bounds
            if (spot.x < 0 || spot.y < 0 || 
                spot.x + spot.width > canvas.width || 
                spot.y + spot.height > canvas.height) {
                if (this.debugging) {
                    this.debugData.processingSteps.push(`Rejected spot ${spot.id}: out of bounds`);
                }
                return false;
            }
            
            // Check for negative dimensions
            if (spot.width <= 0 || spot.height <= 0) {
                if (this.debugging) {
                    this.debugData.processingSteps.push(`Rejected spot ${spot.id}: negative dimensions`);
                }
                return false;
            }
            
            return true;
        }).map((spot, index) => {
            // Renumber spots sequentially
            spot.id = index + 1;
            return spot;
        });
    }
    
    /**
     * Check if two rectangles overlap
     * @param {Object} rect1 - First rectangle {x, y, width, height}
     * @param {Object} rect2 - Second rectangle {x, y, width, height}
     * @returns {boolean} True if rectangles overlap
     * @private
     */
    rectanglesOverlap(rect1, rect2) {
        return !(rect1.x + rect1.width <= rect2.x || 
                rect2.x + rect2.width <= rect1.x || 
                rect1.y + rect1.height <= rect2.y || 
                rect2.y + rect2.height <= rect1.y);
    }
    
    /**
     * Get debug information from the last detection
     * @returns {Object} Debug data object
     */
    getDebugInfo() {
        return this.debugData;
    }

    /**
     * Get the grid result from the last detection
     * @returns {Object} Grid matrix and metadata from GridBuilder
     */
    getGridResult() {
        return this.lastGridResult;
    }
    
    /**
     * Calculate detection statistics
     * @param {Array} spots - Detected spots
     * @param {Array} textBounds - Text bounds
     * @param {Object} canvas - Canvas dimensions
     * @returns {Object} Statistics object
     */
    getStatistics(spots, textBounds, canvas) {
        if (!spots || !textBounds || !canvas) {
            return null;
        }
        
        const totalCanvasArea = canvas.width * canvas.height;
        const totalTextArea = textBounds.reduce((sum, bounds) => 
            sum + (bounds.width * bounds.height), 0);
        const totalSpotArea = spots.reduce((sum, spot) => 
            sum + spot.getArea(), 0);
        
        return {
            totalSpots: spots.length,
            totalCanvasArea: totalCanvasArea,
            totalTextArea: totalTextArea,
            totalSpotArea: totalSpotArea,
            textCoverage: ((totalTextArea / totalCanvasArea) * 100).toFixed(1) + '%',
            spotCoverage: ((totalSpotArea / totalCanvasArea) * 100).toFixed(1) + '%',
            averageSpotSize: spots.length > 0 ? Math.round(totalSpotArea / spots.length) : 0,
            largestSpot: spots.length > 0 ? Math.max(...spots.map(s => s.getArea())) : 0,
            smallestSpot: spots.length > 0 ? Math.min(...spots.map(s => s.getArea())) : 0
        };
    }
    
    /**
     * Test the algorithm with sample data
     * @param {Object} testConfig - Test configuration
     * @returns {Object} Test results
     */
    runTest(testConfig = {}) {
        const defaultCanvas = { width: 600, height: 600 };
        const defaultTextBounds = [
            { text: 'HELLO', x: 100, y: 100, width: 200, height: 60 },
            { text: 'WORLD', x: 50, y: 200, width: 300, height: 60 }
        ];
        
        const canvas = testConfig.canvas || defaultCanvas;
        const textBounds = testConfig.textBounds || defaultTextBounds;
        
        this.setDebugging(true);
        const spots = this.detect(canvas, textBounds);
        const stats = this.getStatistics(spots, textBounds, canvas);
        const debugInfo = this.getDebugInfo();
        
        return {
            spots: spots,
            statistics: stats,
            debugInfo: debugInfo,
            success: spots.length > 0
        };
    }
}