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
        this.waitingContent = []; // Content waiting to be restored (NEW)

        console.log('🔧 Grid system initialized');
    }

    /**
     * Build grid matrix using GridDetector (Phase 2: Unified approach)
     * This method uses GridDetector to create ContentCell and MainTextCell directly
     *
     * According to the Unified Grid Architecture:
     * - GridDetector creates ContentCell and MainTextCell instances directly
     * - No Spot intermediary objects
     * - Text is part of the grid matrix with full coordinates
     * - Animation state is preserved across rebuilds
     */
    buildFromExisting() {
        try {
            console.log('🔄 Building grid using GridDetector...');

            // Capture animation state before rebuild
            const animationState = this.captureAnimationState();

            // Capture disappearing content for waiting system
            this.captureDisappearingContent();

            // Get data from existing system
            const textBounds = this.app.textEngine ? this.app.textEngine.textBounds : [];
            const canvas = this.app.canvasManager ? this.app.canvasManager.canvas : { width: 800, height: 600 };

            // CRITICAL: Get padding from textEngine config (where text was actually positioned)
            // NOT from this.app.padding which doesn't exist and defaults to 0
            const textConfig = this.app.textEngine ? this.app.textEngine.config : {};
            const padding = {
                top: textConfig.paddingTop || 0,
                bottom: textConfig.paddingBottom || 0,
                left: textConfig.paddingLeft || 0,
                right: textConfig.paddingRight || 0
            };

            // Use GridDetector to build unified matrix
            const gridDetector = this.app.gridDetector || new GridDetector();
            if (this.app.minSpotSize) {
                gridDetector.setMinCellSize(this.app.minSpotSize);
            }

            const gridResult = gridDetector.detect(canvas, textBounds, padding);

            // Apply grid result
            this.matrix = gridResult.matrix;
            this.rows = gridResult.rows;
            this.cols = gridResult.cols;

            // Assign sequential IDs (1, 2, 3... left-to-right, top-to-bottom)
            this.assignSequentialIds();

            // Restore waiting content to nearest available cells
            this.restoreWaitingContent();

            // Restore animation state using contentId
            this.restoreAnimationState(animationState);

            // Save original bounds for all cells
            this._saveOriginalBounds();

            this.isReady = true;
            console.log(`✅ Grid built successfully: ${this.rows} rows, ${this.cols} cols`);

        } catch (error) {
            console.error('❌ Error building grid:', error);
            this.isReady = false;
        }
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
     * Get cell by sequential ID
     * @param {number} id - Sequential cell ID
     * @returns {GridCell|null} - Cell with matching ID or null
     */
    getCellById(id) {
        const allCells = this.getAllCells();
        return allCells.find(cell => cell && cell.id === id) || null;
    }

    /**
     * Get cell by content ID (persistent across rebuilds)
     * @param {string} contentId - Persistent content ID
     * @returns {GridCell|null} - Cell with matching contentId or null
     */
    getCellByContentId(contentId) {
        const allCells = this.getAllCells();
        return allCells.find(cell => cell && cell.contentId === contentId) || null;
    }

    /**
     * Get cell at specific canvas coordinates (hit detection)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {GridCell|null} - Cell at position or null
     */
    getCellAt(x, y) {
        const allCells = this.getAllCells();

        // Search in reverse order (top cells first)
        for (let i = allCells.length - 1; i >= 0; i--) {
            const cell = allCells[i];
            if (cell && cell.contains && cell.contains(x, y)) {
                return cell;
            }
        }

        return null;
    }

    /**
     * Get all text cells (MainTextCell instances)
     * @returns {Array} - Array of MainTextCell instances
     */
    getTextCells() {
        return this.getAllCells().filter(cell =>
            cell && (cell.type === 'main-text' || cell.type === 'text')
        );
    }

    /**
     * Get all content cells (ContentCell instances - not text)
     * @returns {Array} - Array of ContentCell instances
     */
    getContentCells() {
        return this.getAllCells().filter(cell =>
            cell && cell.cellType === 'content'
        );
    }

    /**
     * Get content cells by type
     * @param {string} contentType - 'empty' | 'image' | 'text' | 'mask'
     * @returns {Array} - Array of ContentCell instances with matching type
     */
    getContentCellsByType(contentType) {
        return this.getContentCells().filter(cell =>
            cell.contentType === contentType
        );
    }

    /**
     * Get all empty content cells
     * @returns {Array} - Array of empty ContentCell instances
     */
    getEmptyContentCells() {
        return this.getContentCells().filter(cell =>
            cell.isEmpty && cell.isEmpty()
        );
    }

    /**
     * Get all cells in a specific row
     * @param {number} rowIndex - Row index
     * @returns {Array} - Array of cells in the row
     */
    getCellsInRow(rowIndex) {
        if (rowIndex < 0 || rowIndex >= this.rows) {
            return [];
        }
        return (this.matrix[rowIndex] || []).filter(cell => cell !== null);
    }

    /**
     * Get all cells in a specific column
     * @param {number} colIndex - Column index
     * @returns {Array} - Array of cells in the column
     */
    getCellsInColumn(colIndex) {
        const cells = [];
        for (let row = 0; row < this.rows; row++) {
            if (this.matrix[row] && this.matrix[row][colIndex]) {
                cells.push(this.matrix[row][colIndex]);
            }
        }
        return cells;
    }

    /**
     * Assign sequential IDs to all cells
     * Called after grid building to number cells left-to-right, top-to-bottom
     */
    assignSequentialIds() {
        let cellId = 1;

        for (let row = 0; row < this.rows; row++) {
            if (!this.matrix[row]) continue;

            for (let col = 0; col < this.matrix[row].length; col++) {
                const cell = this.matrix[row][col];
                if (cell) {
                    cell.id = cellId++;
                }
            }
        }

        console.log(`🔢 Assigned sequential IDs to ${cellId - 1} cells`);
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
     * Enhanced with animation preservation and waiting content restoration
     */
    rebuild() {
        if (this.isLocked) {
            console.warn('⚠️ Cannot rebuild grid in Animation Mode');
            return;
        }

        console.log('🔄 Rebuilding grid with animation preservation...');

        // 1. Capture animation state by contentId
        const animationState = this.captureAnimationState();

        // 2. Capture content from cells that will disappear
        this.captureDisappearingContent();

        // 3. Rebuild grid structure
        this.buildFromExisting();

        // 4. Restore waiting content to nearest cells
        this.restoreWaitingContent();

        // 5. Restore animations to matching cells
        this.restoreAnimationState(animationState);

        console.log('✅ Grid rebuilt with animations and content preserved');
    }

    /**
     * Capture all animation state before rebuild
     * @returns {Object} Map of contentId → animation config
     */
    captureAnimationState() {
        const state = {};

        this.getAllCells().forEach(cell => {
            if (cell && cell.animation) {
                state[cell.contentId] = {
                    type: cell.animation.type,
                    intensity: cell.animation.intensity,
                    speed: cell.animation.speed,
                    isPlaying: cell.animation.isPlaying,
                    startTime: cell.animation.startTime
                };
            }
        });

        console.log(`📸 Captured animation state for ${Object.keys(state).length} cells`);
        return state;
    }

    /**
     * Restore animation state after rebuild
     * @param {Object} state - Animation state map
     */
    restoreAnimationState(state) {
        let restored = 0;

        this.getAllCells().forEach(cell => {
            if (cell && state[cell.contentId]) {
                const anim = state[cell.contentId];

                // Recreate animation
                cell.setAnimation(anim.type, anim.intensity, anim.speed);

                // Restore playing state
                if (anim.isPlaying && cell.animation) {
                    cell.animation.play();
                }

                restored++;
            }
        });

        console.log(`♻️ Restored animations to ${restored} cells`);
    }

    /**
     * Save content from cells before rebuild (waiting content system)
     */
    captureDisappearingContent() {
        if (!this.waitingContent) {
            this.waitingContent = [];
        }

        // Get all content cells that have non-empty content
        const contentCells = this.getContentCells();

        contentCells.forEach(cell => {
            if (cell.isEmpty && !cell.isEmpty()) {
                // Save content with spatial position for restoration
                this.waitingContent.push({
                    contentId: cell.contentId,
                    contentType: cell.contentType,
                    content: cell.content,
                    lastPosition: {
                        x: cell.bounds.x + cell.bounds.width / 2,
                        y: cell.bounds.y + cell.bounds.height / 2
                    },
                    animation: cell.animation ? {
                        type: cell.animation.type,
                        intensity: cell.animation.intensity,
                        speed: cell.animation.speed,
                        isPlaying: cell.animation.isPlaying
                    } : null
                });
            }
        });

        console.log(`💾 Saved ${this.waitingContent.length} content items to waiting list`);
    }

    /**
     * Restore waiting content to nearest available cells
     */
    restoreWaitingContent() {
        if (!this.waitingContent || this.waitingContent.length === 0) {
            return;
        }

        const availableCells = this.getEmptyContentCells();
        let restoredCount = 0;
        const stillWaiting = [];

        this.waitingContent.forEach(waiting => {
            // Find nearest empty cell using spatial distance
            const nearestCell = this.findNearestCell(
                waiting.lastPosition,
                availableCells
            );

            if (nearestCell) {
                // Restore content
                nearestCell.contentId = waiting.contentId;
                nearestCell.setContentType(waiting.contentType);
                nearestCell.setContent(waiting.content);

                // Restore animation
                if (waiting.animation) {
                    nearestCell.setAnimation(
                        waiting.animation.type,
                        waiting.animation.intensity,
                        waiting.animation.speed
                    );
                    if (waiting.animation.isPlaying) {
                        nearestCell.animation.play();
                    }
                }

                // Remove from available
                const index = availableCells.indexOf(nearestCell);
                if (index > -1) {
                    availableCells.splice(index, 1);
                }

                restoredCount++;
            } else {
                // No space available, keep waiting
                stillWaiting.push(waiting);
            }
        });

        // Update waiting list
        this.waitingContent = stillWaiting;

        console.log(`📥 Restored ${restoredCount} content items from waiting list`);
        if (stillWaiting.length > 0) {
            console.log(`⏳ ${stillWaiting.length} items still waiting for space`);
        }
    }

    /**
     * Find nearest cell to a position using Euclidean distance
     * @param {Object} pos - {x, y} position
     * @param {Array} cells - Available cells
     * @returns {ContentCell|null} Nearest cell or null
     */
    findNearestCell(pos, cells) {
        if (!cells || cells.length === 0) return null;

        let nearest = cells[0];
        let minDistance = this.calculateDistance(pos, nearest.getCenter());

        cells.forEach(cell => {
            const distance = this.calculateDistance(pos, cell.getCenter());
            if (distance < minDistance) {
                minDistance = distance;
                nearest = cell;
            }
        });

        return nearest;
    }

    /**
     * Calculate Euclidean distance between two points
     * @param {Object} pos1 - {x, y}
     * @param {Object} pos2 - {x, y}
     * @returns {number} Distance
     */
    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx * dx + dy * dy);
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

        // console.log('=====================================');

        // // Show actual column counts per row
        // console.log('📊 Columns per row:');
        // for (let row = 0; row < this.rows; row++) {
        //     const actualCols = this.matrix[row] ? this.matrix[row].length : 0;
        //     const filledCols = this.matrix[row] ? this.matrix[row].filter(cell => cell !== null && cell !== undefined).length : 0;
        //     console.log(`  Row ${row}: ${filledCols} filled cells, ${actualCols} total slots (max: ${this.cols})`);
        // }
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