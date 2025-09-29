/**
 * GridBuilder.js - Builds spatial grid during spot detection
 * Part of the Grid Animation System
 *
 * This class works with SpotDetector to build an accurate spatial grid
 * that represents the actual layout discovered during spot detection
 */

class GridBuilder {
    constructor() {
        this.regions = [];  // All discovered regions (text + spots)
        this.rows = [];     // Row boundaries discovered
        this.cols = [];     // Column boundaries discovered
        this.matrix = [];   // Final grid matrix
    }

    /**
     * Start building a new grid
     */
    startBuild() {
        this.regions = [];
        this.rows = [];
        this.cols = [];
        this.matrix = [];
        console.log('🔧 GridBuilder: Starting new grid build');
    }

    /**
     * Add a text region discovered during spot detection
     * @param {Object} bounds - Text bounds with x, y, width, height
     * @param {string} text - The text content
     * @param {number} lineIndex - Index of this text line
     */
    addTextRegion(bounds, text, lineIndex) {
        this.regions.push({
            type: 'text',
            bounds: bounds,
            text: text,
            lineIndex: lineIndex,
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height
        });

        // Track row boundaries
        this._trackRowBoundaries(bounds.y, bounds.y + bounds.height);

        // Track column boundaries
        this._trackColumnBoundaries(bounds.x, bounds.x + bounds.width);

        console.log(`  Added text region: "${text}" at (${bounds.x}, ${bounds.y})`);
    }

    /**
     * Add a spot region discovered during detection
     * @param {Object} spot - Spot object with position and dimensions
     */
    addSpotRegion(spot) {
        this.regions.push({
            type: 'spot',
            spot: spot,
            x: spot.x,
            y: spot.y,
            width: spot.width,
            height: spot.height
        });

        // Track row boundaries
        this._trackRowBoundaries(spot.y, spot.y + spot.height);

        // Track column boundaries
        this._trackColumnBoundaries(spot.x, spot.x + spot.width);

        console.log(`  Added spot region at (${spot.x}, ${spot.y})`);
    }

    /**
     * Track row boundaries based on Y positions
     * @private
     */
    _trackRowBoundaries(top, bottom) {
        // Add unique Y positions as potential row boundaries
        if (!this.rows.includes(top)) {
            this.rows.push(top);
        }
        if (!this.rows.includes(bottom)) {
            this.rows.push(bottom);
        }
    }

    /**
     * Track column boundaries based on X positions
     * @private
     */
    _trackColumnBoundaries(left, right) {
        // Add unique X positions as potential column boundaries
        if (!this.cols.includes(left)) {
            this.cols.push(left);
        }
        if (!this.cols.includes(right)) {
            this.cols.push(right);
        }
    }

    /**
     * Finalize the grid based on discovered regions
     * @returns {Object} - Grid matrix and metadata
     */
    finalizeGrid() {
        console.log('🔄 Finalizing grid structure with logical columns...');

        // Sort row boundaries
        this.rows.sort((a, b) => a - b);
        // Merge close row boundaries (within threshold)
        this.rows = this._mergeBoundaries(this.rows, 20);  // 20px threshold for rows
        const numRows = Math.max(1, this.rows.length - 1);

        // Build logical grid based on spot detection pattern
        // Each row has at most 3 logical columns: [left] [center] [right]
        this.matrix = [];

        // Group regions by row
        const regionsByRow = {};
        this.regions.forEach(region => {
            const row = this._findRow(region.y + region.height / 2);
            if (!regionsByRow[row]) {
                regionsByRow[row] = [];
            }
            regionsByRow[row].push(region);
        });

        // Build each row with logical columns
        for (let r = 0; r < numRows; r++) {
            const rowRegions = regionsByRow[r] || [];

            if (rowRegions.length === 0) {
                // Empty row
                this.matrix[r] = [null];
            } else {
                // Sort regions by X position
                rowRegions.sort((a, b) => a.x - b.x);

                // Determine logical structure
                const hasText = rowRegions.some(r => r.type === 'text');

                if (hasText) {
                    // Find text region and spots
                    const textRegion = rowRegions.find(r => r.type === 'text');
                    const leftSpots = rowRegions.filter(r => r.type === 'spot' && r.x < textRegion.x);
                    const rightSpots = rowRegions.filter(r => r.type === 'spot' && r.x > textRegion.x);

                    // Build logical row: [left spot?] [text] [right spot?]
                    const logicalRow = [];

                    // Left column (logical column 0)
                    if (leftSpots.length > 0) {
                        logicalRow.push({
                            type: 'spot',
                            spot: leftSpots[0].spot  // Use first left spot
                        });
                    }

                    // Center column (text)
                    logicalRow.push({
                        type: 'text',
                        text: textRegion.text,
                        bounds: textRegion.bounds,
                        lineIndex: textRegion.lineIndex
                    });

                    // Right column (logical column 2)
                    if (rightSpots.length > 0) {
                        logicalRow.push({
                            type: 'spot',
                            spot: rightSpots[0].spot  // Use first right spot
                        });
                    }

                    this.matrix[r] = logicalRow;
                    console.log(`  Row ${r}: ${logicalRow.length} logical columns (left: ${leftSpots.length > 0}, text: true, right: ${rightSpots.length > 0})`);
                } else {
                    // Only spots, no text - just create single column
                    this.matrix[r] = [{
                        type: 'spot',
                        spot: rowRegions[0].spot
                    }];
                    console.log(`  Row ${r}: 1 logical column (spots only)`);
                }
            }
        }

        // Calculate logical columns (maximum columns in any row)
        const numCols = Math.max(...this.matrix.map(row => row.length));

        console.log(`✅ Grid finalized: ${numRows} rows x ${numCols} logical columns`);

        return {
            matrix: this.matrix,
            rows: numRows,
            cols: numCols,
            rowBoundaries: this.rows,
            colBoundaries: []  // No longer using column boundaries
        };
    }

    /**
     * Merge boundaries that are too close together
     * @private
     */
    _mergeBoundaries(boundaries, threshold) {
        if (boundaries.length <= 1) return boundaries;

        const merged = [boundaries[0]];
        for (let i = 1; i < boundaries.length; i++) {
            const last = merged[merged.length - 1];
            if (boundaries[i] - last > threshold) {
                merged.push(boundaries[i]);
            }
        }
        return merged;
    }

    /**
     * Find which row a Y position belongs to
     * @private
     */
    _findRow(y) {
        for (let i = 0; i < this.rows.length - 1; i++) {
            if (y >= this.rows[i] && y < this.rows[i + 1]) {
                return i;
            }
        }
        return this.rows.length - 2;  // Last row
    }

    /**
     * Find which column an X position belongs to
     * @private
     */
    _findColumn(x) {
        for (let i = 0; i < this.cols.length - 1; i++) {
            if (x >= this.cols[i] && x < this.cols[i + 1]) {
                return i;
            }
        }
        return this.cols.length - 2;  // Last column
    }

    /**
     * Get a visual representation of the grid
     */
    getVisualRepresentation() {
        let visual = '📋 Grid Layout:\n';
        visual += '=====================================\n';

        for (let r = 0; r < this.matrix.length; r++) {
            let row = `Row ${r}: `;
            for (let c = 0; c < this.matrix[r].length; c++) {
                const cell = this.matrix[r][c];
                if (!cell) {
                    row += '[empty]';
                } else if (cell.type === 'text') {
                    row += `[${cell.text}]`;
                } else if (cell.type === 'spot') {
                    row += `[${cell.spot.type || 'spot'}]`;
                }
            }
            visual += row + '\n';
        }

        visual += '=====================================\n';
        return visual;
    }
}