/**
 * Grid.js - Central controller for the unified grid matrix system
 * Part of the Grid Animation System
 */

class Grid {
    constructor(app) {
        this.app = app; // Reference to existing system
        this.matrix = []; // [row][col] grid structure
        this.rows = 0;
        this.cols = 0;
        this.snapshot = null; // Saved state for animation mode
        this.isLocked = false; // Layout lock status
        this.isReady = false; // Grid initialization status

        console.log('🔧 Grid system initialized');
    }

    /**
     * Build grid matrix from existing system (MainTextController + spots)
     * This method converts the current textBounds and spots into a unified grid
     *
     * According to the Animation Design Document, this should:
     * - Unify text lines and spots into single matrix
     * - Provide clear row/column access patterns
     * - Create accurate spatial representation
     */
    buildFromExisting() {
        try {
            console.log('🔄 Building grid from existing system...');

            // Clear existing matrix
            this.matrix = [];
            this.rows = 0;
            this.cols = 0;

            // Check if we have GridBuilder results from spot detection
            const spotDetector = this.app.spotDetector;
            if (spotDetector && spotDetector.getGridResult) {
                const gridResult = spotDetector.getGridResult();
                if (gridResult && gridResult.matrix) {
                    console.log('🎯 Using GridBuilder results from spot detection');
                    this._buildFromGridBuilder(gridResult);
                    this.isReady = true;
                    console.log(`✅ Grid built from GridBuilder: ${this.rows} rows, ${this.cols} cols`);
                    return;
                }
            }

            // Fallback to original method
            console.log('📋 Using fallback grid building method');

            // Get data from existing system
            const textBounds = this.app.textEngine ? this.app.textEngine.textBounds : [];
            const spots = this.app.spots || [];

            if (textBounds.length === 0 && spots.length === 0) {
                console.log('⚠️ No text or spots found, creating empty grid');
                this.isReady = true;
                return;
            }

            // Build matrix structure
            this._buildMatrixFromTextAndSpots(textBounds, spots);

            // Calculate grid dimensions
            this._calculateGridDimensions();

            // Save original bounds for all cells
            this._saveOriginalBounds();

            this.isReady = true;
            console.log(`✅ Grid built successfully: ${this.rows} rows, ${this.cols} cols`);

        } catch (error) {
            console.error('❌ Error building grid from existing system:', error);
            this.isReady = false;
        }
    }

    /**
     * Private method to build matrix from text bounds and spots
     * Creates a spatial grid where each cell represents a real position
     * @param {Array} textBounds - Text line bounds from MainTextController
     * @param {Array} spots - Spot objects from app.spots
     * @private
     */
    _buildMatrixFromTextAndSpots(textBounds, spots) {
        console.log(`🔧 Building matrix from ${textBounds.length} text lines and ${spots.length} spots`);

        // For text-only scenarios (no spots), create simple grid
        if (spots.length === 0 && textBounds.length > 0) {
            this._buildTextOnlyMatrix(textBounds);
            return;
        }

        // For spots-only scenarios (no text), create spots grid
        if (textBounds.length === 0 && spots.length > 0) {
            this._buildSpotsOnlyMatrix(spots);
            return;
        }

        // For mixed scenarios, create spatial grid
        if (textBounds.length > 0 && spots.length > 0) {
            this._buildMixedMatrix(textBounds, spots);
            return;
        }

        console.log('⚠️ No valid elements to build matrix');
    }

    /**
     * Build simple text-only matrix (no spots)
     * @param {Array} textBounds - Text line bounds
     * @private
     */
    _buildTextOnlyMatrix(textBounds) {
        console.log('📝 Building text-only matrix');
        this.matrix = [];

        // When we have text only, we should still create a spatial representation
        // Create virtual grid based on canvas dimensions
        const canvasWidth = this.app.canvasManager ? this.app.canvasManager.canvas.width : 1080;
        const canvasHeight = this.app.canvasManager ? this.app.canvasManager.canvas.height : 1350;

        // Create a 3x3 grid for simple spatial representation
        const gridRowHeight = canvasHeight / 3; // 3 rows
        const gridColWidth = canvasWidth / 3;   // 3 columns
        const totalRows = 3;
        const totalCols = 3;

        // Initialize empty 3x3 matrix
        for (let i = 0; i < totalRows; i++) {
            this.matrix[i] = [];
            for (let j = 0; j < totalCols; j++) {
                this.matrix[i][j] = null;
            }
        }

        // Place text cells based on their actual X,Y position
        textBounds.forEach((bounds, lineIndex) => {
            if (bounds.text && bounds.text.trim()) {
                // Calculate which row and column this text belongs to
                // Use the center of the text bounds for more accurate positioning
                const textCenterX = bounds.x + (bounds.width || 0) / 2;
                const textCenterY = bounds.y + (bounds.height || 0) / 2;

                const rowIndex = Math.min(Math.floor(textCenterY / gridRowHeight), totalRows - 1);
                const colIndex = Math.min(Math.floor(textCenterX / gridColWidth), totalCols - 1);

                // Ensure indices are valid
                if (rowIndex >= 0 && rowIndex < totalRows && colIndex >= 0 && colIndex < totalCols) {
                    const cell = new MainTextCell(bounds.text, lineIndex, rowIndex, colIndex);
                    cell.bounds = { ...bounds };
                    cell.style = this._extractTextStyle(bounds);

                    this.matrix[rowIndex][colIndex] = cell;
                    console.log(`  Placed "${bounds.text}" at row ${rowIndex}, col ${colIndex} (X: ${bounds.x}, Y: ${bounds.y})`);
                }
            }
        });

        console.log(`✅ Text-only spatial matrix: ${totalRows} rows, ${totalCols} columns`);
    }

    /**
     * Build spots-only matrix (no text)
     * @param {Array} spots - Spot objects
     * @private
     */
    _buildSpotsOnlyMatrix(spots) {
        console.log('📍 Building spots-only matrix');
        this.matrix = [];

        // Sort spots by position (top to bottom, then left to right)
        const sortedSpots = spots.slice().sort((a, b) => {
            const yDiff = a.y - b.y;
            if (Math.abs(yDiff) > 40) return yDiff;
            return a.x - b.x;
        });

        // Group spots into rows
        const rowGroups = this._groupSpotsIntoRows(sortedSpots);

        rowGroups.forEach((rowSpots, rowIndex) => {
            this.matrix[rowIndex] = [];

            rowSpots.forEach((spot, colIndex) => {
                const cell = new SpotCell(spot, rowIndex, colIndex);
                cell.bounds = {
                    x: spot.x,
                    y: spot.y,
                    width: spot.width,
                    height: spot.height
                };
                this.matrix[rowIndex][colIndex] = cell;
            });
        });

        console.log(`✅ Spots-only matrix: ${this.matrix.length} rows`);
    }

    /**
     * Build mixed matrix with both text and spots
     * @param {Array} textBounds - Text line bounds
     * @param {Array} spots - Spot objects
     * @private
     */
    _buildMixedMatrix(textBounds, spots) {
        console.log('🎯 Building mixed text+spots matrix');

        // Collect all elements (text + spots) with their spatial positions
        const allElements = [];

        // Add text elements
        textBounds.forEach((bounds, index) => {
            if (bounds.text && bounds.text.trim()) {
                allElements.push({
                    type: 'text',
                    data: bounds,
                    lineIndex: index,
                    x: bounds.x,
                    y: bounds.y,
                    width: bounds.width,
                    height: bounds.height
                });
            }
        });

        // Add spot elements
        spots.forEach(spot => {
            allElements.push({
                type: 'spot',
                data: spot,
                x: spot.x,
                y: spot.y,
                width: spot.width,
                height: spot.height
            });
        });

        // Sort elements by position (top to bottom, then left to right)
        allElements.sort((a, b) => {
            const yDiff = a.y - b.y;
            if (Math.abs(yDiff) > 10) { // 10px threshold for "same row"
                return yDiff;
            }
            return a.x - b.x; // Same row, sort by X
        });

        // Group elements into rows based on Y position
        const rowGroups = this._groupElementsIntoRows(allElements);

        // Build matrix from row groups
        this._buildMatrixFromRowGroups(rowGroups);

        console.log(`✅ Mixed matrix: ${this.matrix.length} rows`);
    }

    /**
     * Group spots into rows (helper for spots-only matrix)
     * @param {Array} spots - Sorted spots
     * @returns {Array} - Array of row groups
     * @private
     */
    _groupSpotsIntoRows(spots) {
        const rowGroups = [];
        let currentRow = [];
        let currentRowY = null;
        const rowThreshold = 40;

        spots.forEach(spot => {
            if (currentRowY === null || Math.abs(spot.y - currentRowY) > rowThreshold) {
                if (currentRow.length > 0) {
                    rowGroups.push([...currentRow]);
                }
                currentRow = [spot];
                currentRowY = spot.y;
            } else {
                currentRow.push(spot);
                const rowYSum = currentRow.reduce((sum, s) => sum + s.y, 0);
                currentRowY = rowYSum / currentRow.length;
            }
        });

        if (currentRow.length > 0) {
            rowGroups.push(currentRow);
        }

        return rowGroups;
    }

    /**
     * Group elements into rows based on Y position
     * @param {Array} allElements - All elements sorted by position
     * @returns {Array} - Array of row groups
     * @private
     */
    _groupElementsIntoRows(allElements) {
        const rowGroups = [];
        let currentRow = [];
        let currentRowY = null;
        const rowThreshold = 40; // Pixels - elements within this distance are in same row

        allElements.forEach(element => {
            // Check if this element belongs to a new row
            if (currentRowY === null || Math.abs(element.y - currentRowY) > rowThreshold) {
                // Start new row
                if (currentRow.length > 0) {
                    rowGroups.push([...currentRow]);
                }
                currentRow = [element];
                currentRowY = element.y;
            } else {
                // Add to current row - adjust currentRowY to be average of row elements
                currentRow.push(element);
                const rowYSum = currentRow.reduce((sum, el) => sum + el.y, 0);
                currentRowY = rowYSum / currentRow.length;
            }
        });

        // Add the last row
        if (currentRow.length > 0) {
            rowGroups.push(currentRow);
        }

        console.log(`🔧 Grouped ${allElements.length} elements into ${rowGroups.length} rows`);
        return rowGroups;
    }

    /**
     * Build matrix from row groups creating a proper spatial grid
     * @param {Array} rowGroups - Array of row groups
     * @private
     */
    _buildMatrixFromRowGroups(rowGroups) {
        this.matrix = [];

        // Calculate the maximum number of columns needed
        let maxCols = 0;
        rowGroups.forEach(rowElements => {
            if (rowElements.length > maxCols) {
                maxCols = rowElements.length;
            }
        });

        // Build each row
        rowGroups.forEach((rowElements, rowIndex) => {
            this.matrix[rowIndex] = [];

            // Sort elements in this row by X position (left to right)
            rowElements.sort((a, b) => a.x - b.x);

            // For proper spatial grid, we need to determine actual column positions
            // based on X coordinates, not just sequential order
            const sortedElements = [...rowElements];

            sortedElements.forEach((element, elementIndex) => {
                let cell;

                if (element.type === 'text') {
                    // Create MainTextCell
                    cell = new MainTextCell(element.data.text, element.lineIndex, rowIndex, elementIndex);
                    cell.bounds = { ...element.data };
                    cell.style = this._extractTextStyle(element.data);
                } else if (element.type === 'spot') {
                    // Create SpotCell
                    cell = new SpotCell(element.data, rowIndex, elementIndex);
                    cell.bounds = {
                        x: element.data.x,
                        y: element.data.y,
                        width: element.data.width,
                        height: element.data.height
                    };
                }

                if (cell) {
                    // Update cell with correct column position
                    cell.col = elementIndex;
                    this.matrix[rowIndex][elementIndex] = cell;
                }
            });

            // Fill any gaps in the row with null values to maintain matrix structure
            for (let col = rowElements.length; col < maxCols; col++) {
                this.matrix[rowIndex][col] = null;
            }
        });

        console.log(`🔧 Built spatial matrix: ${rowGroups.length} rows, max ${maxCols} columns`);
    }

    /**
     * Build grid matrix from GridBuilder results
     * @param {Object} gridResult - GridBuilder result with matrix and metadata
     * @private
     */
    _buildFromGridBuilder(gridResult) {
        console.log('🎯 Building grid from GridBuilder logical structure');

        // Set dimensions from GridBuilder
        this.rows = gridResult.rows;
        this.cols = gridResult.cols;

        // Initialize matrix directly from GridBuilder's logical structure
        this.matrix = [];

        // Process each row from GridBuilder
        for (let r = 0; r < gridResult.matrix.length; r++) {
            const gridRow = gridResult.matrix[r];
            this.matrix[r] = [];

            if (!gridRow || gridRow.length === 0) {
                // Empty row
                this.matrix[r] = [null];
            } else {
                // Process each cell in the logical row
                for (let c = 0; c < gridRow.length; c++) {
                    const gridCell = gridRow[c];

                    if (!gridCell) {
                        // Empty cell
                        this.matrix[r][c] = null;
                    } else if (gridCell.type === 'text') {
                        // Create MainTextCell
                        const cell = new MainTextCell(gridCell.text, r, c);
                        cell.bounds = gridCell.bounds;
                        cell.lineIndex = gridCell.lineIndex;
                        cell.originalBounds = { ...gridCell.bounds };
                        cell.style = this._extractTextStyle(gridCell.bounds);
                        this.matrix[r][c] = cell;
                        console.log(`  Row ${r}: Text "${gridCell.text}" at logical column ${c}`);

                    } else if (gridCell.type === 'spot') {
                        // Create SpotCell
                        const cell = new SpotCell(gridCell.spot, r, c);
                        cell.originalBounds = {
                            x: gridCell.spot.x,
                            y: gridCell.spot.y,
                            width: gridCell.spot.width,
                            height: gridCell.spot.height
                        };
                        this.matrix[r][c] = cell;
                        console.log(`  Row ${r}: Spot ${gridCell.spot.id} at logical column ${c}`);
                    }
                }
            }

            console.log(`  Row ${r}: ${this.matrix[r].length} logical columns`);
        }

        console.log(`✅ Grid built from GridBuilder: ${this.rows} rows x ${this.cols} logical columns`);
    }

    /**
     * Extract text style from bounds object
     * @param {Object} bounds - Text bounds object
     * @returns {Object} - Style object
     * @private
     */
    _extractTextStyle(bounds) {
        // Extract style information from existing system
        const config = this.app.textEngine ? this.app.textEngine.config : {};
        return {
            fontSize: config.fontSize || 48,
            fontFamily: config.fontFamily || '"Wix Madefor Display", Arial, sans-serif',
            color: config.color || '#000000',
            alignment: bounds.alignment || config.defaultAlignment || 'left',
            bold: config.textStyles?.bold || false,
            italic: config.textStyles?.italic || false,
            underline: config.textStyles?.underline || false,
            highlight: config.textStyles?.highlight || false,
            highlightColor: config.textStyles?.highlightColor || '#ffff00'
        };
    }

    /**
     * Calculate grid dimensions
     * @private
     */
    _calculateGridDimensions() {
        this.rows = this.matrix.length;
        this.cols = 0;

        this.matrix.forEach(row => {
            if (row && row.length > this.cols) {
                this.cols = row.length;
            }
        });
    }

    /**
     * Save original bounds for all cells (for animation reset)
     * @private
     */
    _saveOriginalBounds() {
        this.matrix.forEach(row => {
            if (row) {
                row.forEach(cell => {
                    if (cell) {
                        cell.saveOriginalBounds();
                    }
                });
            }
        });
    }

    /**
     * Get cell at specific row/column
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {GridCell|null} - Cell at position or null
     */
    getCell(row, col) {
        if (row < 0 || row >= this.rows || col < 0) {
            return null;
        }
        return this.matrix[row] && this.matrix[row][col] ? this.matrix[row][col] : null;
    }

    /**
     * Get all cells in the grid
     * @returns {Array} - Flat array of all cells
     */
    getAllCells() {
        const cells = [];
        this.matrix.forEach(row => {
            if (row) {
                row.forEach(cell => {
                    if (cell) {
                        cells.push(cell);
                    }
                });
            }
        });
        return cells;
    }

    /**
     * Play all cell animations
     */
    playAllAnimations() {
        let playedCount = 0;
        this.getAllCells().forEach(cell => {
            if (cell && cell.animation) {
                cell.animation.play();
                playedCount++;
            }
        });
        console.log(`▶️ Playing ${playedCount} cell animations`);
    }

    /**
     * Pause all cell animations
     */
    pauseAllAnimations() {
        let pausedCount = 0;
        this.getAllCells().forEach(cell => {
            if (cell && cell.animation) {
                cell.animation.pause();
                pausedCount++;
            }
        });
        console.log(`⏸️ Paused ${pausedCount} cell animations`);
    }

    /**
     * Reset all cell animations
     */
    resetAllAnimations() {
        let resetCount = 0;
        this.getAllCells().forEach(cell => {
            if (cell && cell.animation) {
                cell.animation.reset();
                resetCount++;
            }
        });
        console.log(`↺ Reset ${resetCount} cell animations`);
    }

    /**
     * Get all cells that have animations
     * @returns {Array} - Array of cells with animations
     */
    getAnimatedCells() {
        return this.getAllCells().filter(cell => cell && cell.animation);
    }

    /**
     * Update spot type in the grid without rebuilding
     * @param {number} spotId - The spot ID to update
     * @param {string} newType - The new spot type
     */
    updateSpotType(spotId, newType) {
        let updated = false;

        // Search through matrix for the spot cell with matching ID
        for (let row = 0; row < this.rows; row++) {
            if (!this.matrix[row]) continue;

            for (let col = 0; col < this.matrix[row].length; col++) {
                const cell = this.matrix[row][col];

                if (cell && cell.type === 'spot' && cell.spotId === spotId) {
                    // Update the spot type
                    cell.spotType = newType;
                    if (cell.spot) {
                        cell.spot.type = newType;
                    }
                    updated = true;
                    console.log(`✏️ Updated spot ${spotId} type to: ${newType} at [${row}][${col}]`);
                    break;
                }
            }

            if (updated) break;
        }

        if (!updated) {
            console.log(`⚠️ Could not find spot ${spotId} in grid`);
        }

        return updated;
    }

    /**
     * Rebuild grid (Layout Mode only)
     */
    rebuild() {
        if (this.isLocked) {
            console.warn('⚠️ Cannot rebuild grid in Animation Mode');
            return;
        }

        console.log('🔄 Rebuilding grid...');
        this.buildFromExisting();
    }


    /**
     * Create JSON snapshot of current grid state
     * @returns {Object} - Serializable grid snapshot
     */
    serialize() {
        const cells = [];

        this.matrix.forEach((row, rowIndex) => {
            if (row) {
                row.forEach((cell, colIndex) => {
                    if (cell) {
                        cells.push({
                            ...cell.serialize(),
                            id: `${cell.type}-${rowIndex}-${colIndex}`
                        });
                    }
                });
            }
        });

        return {
            metadata: {
                timestamp: Date.now(),
                version: '1.0.0',
                canvasWidth: this.app.canvasManager?.canvas?.width || 1080,
                canvasHeight: this.app.canvasManager?.canvas?.height || 1350,
                backgroundColor: this.app.elements?.backgroundColor?.value || '#ffffff'
            },
            layout: {
                rows: this.rows,
                cols: this.cols,
                cells: cells
            }
        };
    }

    /**
     * Restore grid from JSON snapshot
     * @param {Object} snapshot - Serialized grid data
     */
    deserialize(snapshot) {
        try {
            console.log('🔄 Restoring grid from snapshot...');

            this.matrix = [];
            this.rows = snapshot.layout.rows;
            this.cols = snapshot.layout.cols;

            // Rebuild matrix from cells
            snapshot.layout.cells.forEach(cellData => {
                if (!this.matrix[cellData.row]) {
                    this.matrix[cellData.row] = [];
                }

                let cell;
                if (cellData.type === 'main-text') {
                    cell = MainTextCell.deserialize(cellData);
                } else if (cellData.type === 'spot') {
                    cell = SpotCell.deserialize(cellData);
                }

                if (cell) {
                    this.matrix[cellData.row][cellData.col] = cell;
                }
            });

            console.log('✅ Grid restored from snapshot');
        } catch (error) {
            console.error('❌ Error restoring grid from snapshot:', error);
        }
    }

    /**
     * Check if grid is ready for use
     * @returns {boolean}
     */
    isGridReady() {
        return this.isReady;
    }

    /**
     * Get grid status for debugging
     * @returns {Object} - Grid status information
     */
    getStatus() {
        const status = {
            isReady: this.isReady,
            isLocked: this.isLocked,
            rows: this.rows,
            cols: this.cols,
            totalCells: this.getAllCells().length,
            hasSnapshot: !!this.snapshot
        };

        // Add visual grid representation
        console.log('📋 Visual Grid Layout:');
        this.printVisualGrid();

        return status;
    }

    /**
     * Print visual representation of the grid
     */
    printVisualGrid() {
        console.log('=====================================');

        for (let row = 0; row < this.rows; row++) {
            let rowStr = '';
            const rowCells = this.matrix[row] || [];

            if (rowCells.length === 0) {
                rowStr = '[empty]';
            } else {
                // Only iterate through actual columns that exist in this row
                const actualCols = rowCells.length;
                let hasContent = false;

                for (let col = 0; col < actualCols; col++) {
                    const cell = rowCells[col];
                    if (cell) {
                        if (cell.type === 'main-text') {
                            rowStr += `[${cell.text}]`;
                            hasContent = true;
                        } else if (cell.type === 'spot') {
                            const content = cell.spotType || 'empty';
                            rowStr += `[${content}]`;
                            hasContent = true;
                        } else {
                            rowStr += '[unknown]';
                        }
                    } else {
                        rowStr += '[empty]';
                    }
                }

                // If entire row is empty, show it clearly
                if (!hasContent) {
                    rowStr = '[empty]';
                }
            }

            console.log(`Row ${row}: ${rowStr}`);
        }

        console.log('=====================================');

        // Show actual column counts per row
        console.log('📊 Columns per row:');
        for (let row = 0; row < this.rows; row++) {
            const actualCols = this.matrix[row] ? this.matrix[row].length : 0;
            const filledCols = this.matrix[row] ? this.matrix[row].filter(cell => cell !== null && cell !== undefined).length : 0;
            console.log(`  Row ${row}: ${filledCols} filled cells, ${actualCols} total slots (max: ${this.cols})`);
        }
    }

    /**
     * Get a detailed breakdown of the grid structure
     * @returns {Object} - Detailed grid information
     */
    getDetailedStatus() {
        const allCells = this.getAllCells();
        const textCells = allCells.filter(cell => cell.type === 'main-text');
        const spotCells = allCells.filter(cell => cell.type === 'spot');

        // Analyze spot types
        const spotTypes = {};
        spotCells.forEach(cell => {
            const type = cell.spotType || 'unknown';
            spotTypes[type] = (spotTypes[type] || 0) + 1;
        });

        return {
            basic: this.getStatus(),
            breakdown: {
                textCells: textCells.length,
                spotCells: spotCells.length,
                spotTypes: spotTypes
            },
            textContent: textCells.map(cell => cell.text),
            rowStructure: this.matrix.map((row, index) => ({
                rowIndex: index,
                cellCount: row ? row.filter(cell => cell !== null && cell !== undefined).length : 0,
                cells: row ? row.filter(cell => cell !== null && cell !== undefined).map(cell => ({
                    type: cell.type,
                    content: cell.type === 'main-text' ? cell.text : cell.spotType
                })) : []
            }))
        };
    }

    /**
     * Create a comprehensive snapshot of current grid state
     * @returns {GridSnapshot} - Complete state snapshot
     */
    createSnapshot() {
        const canvas = this.app.canvasManager ? this.app.canvasManager.canvas : null;
        const config = this._captureCurrentConfig();

        const snapshot = new GridSnapshot(this, canvas, config);
        console.log('📸 Grid snapshot created');
        return snapshot;
    }

    /**
     * Restore grid from a snapshot
     * @param {GridSnapshot} snapshot - Snapshot to restore from
     * @returns {boolean} - Success status
     */
    restoreSnapshot(snapshot) {
        try {
            if (!(snapshot instanceof GridSnapshot)) {
                throw new Error('Invalid snapshot object');
            }

            // Validate snapshot
            const validation = snapshot.validate();
            if (!validation.success) {
                console.warn('⚠️ Snapshot validation issues:', validation.issues);
            }

            // Restore grid state
            if (snapshot.gridData) {
                this.deserialize(snapshot.gridData);
            }

            // Restore configuration if available
            if (snapshot.config) {
                this._restoreConfig(snapshot.config);
            }

            console.log('📷 Grid restored from snapshot');
            return true;

        } catch (error) {
            console.error('❌ Failed to restore from snapshot:', error);
            return false;
        }
    }

    /**
     * Capture current application configuration
     * @returns {Object} - Current config state
     * @private
     */
    _captureCurrentConfig() {
        return {
            textEngine: this.app.textEngine ? {
                fontSize: this.app.textEngine.config?.fontSize,
                fontFamily: this.app.textEngine.config?.fontFamily,
                color: this.app.textEngine.config?.color,
                mode: this.app.textEngine.config?.mode
            } : null,

            canvas: this.app.canvasManager ? {
                padding: this.app.canvasManager.padding,
                dimensions: {
                    width: this.app.canvasManager.canvas?.width,
                    height: this.app.canvasManager.canvas?.height
                }
            } : null,

            spots: this.app.spotController ? {
                minSize: this.app.spotController.minSpotSize,
                autoDetect: this.app.elements?.autoDetectSpots?.checked
            } : null,

            debug: this.app.debugController ? {
                showOutlines: this.app.debugController.debugState?.showSpotOutlines,
                showNumbers: this.app.debugController.debugState?.showSpotNumbers
            } : null
        };
    }

    /**
     * Restore configuration from snapshot
     * @param {Object} config - Configuration to restore
     * @private
     */
    _restoreConfig(config) {
        // Note: This is a placeholder for config restoration
        // In a full implementation, this would restore UI states and settings
        console.log('🔧 Configuration restoration (placeholder)', config);
    }
}