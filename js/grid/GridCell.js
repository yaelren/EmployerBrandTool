/**
 * GridCell.js - Base class for all grid cells
 * Part of the Grid Animation System
 */

class GridCell {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.type = 'base'; // 'main-text' | 'spot'
        this.bounds = { x: 0, y: 0, width: 0, height: 0 };
        this.originalBounds = null; // Snapshot for animation reset

        // Animation (NEW: Simple per-cell animation)
        // This is completely isolated from grid structure
        // cell.bounds remains unchanged - only currentOffset affects rendering
        this.animation = null;          // TextAnimation instance or null
        this.currentOffset = { x: 0, y: 0 }; // Visual rendering offset (non-destructive)
    }

    /**
     * Set animation for this cell
     * @param {string} type - Animation type ('sway', 'bounce', 'rotate', 'pulse')
     * @param {number} intensity - Animation intensity in pixels (default: 20)
     * @param {number} speed - Speed multiplier (default: 1.0)
     */
    setAnimation(type, intensity = 20, speed = 1.0) {
        // Remove existing animation if present
        if (this.animation) {
            this.animation.pause();
            this.animation = null;
        }

        // Create new animation based on cell type
        if (this.type === 'main-text') {
            this.animation = new TextAnimation(this, { type, intensity, speed });
            console.log(`✨ Animation set on cell [${this.row}][${this.col}]: ${type}`);
        } else {
            console.log(`⚠️ Animation not supported for cell type: ${this.type}`);
        }
    }

    /**
     * Remove animation from this cell
     */
    removeAnimation() {
        if (this.animation) {
            this.animation.pause();
            this.animation = null;
        }
        this.currentOffset = { x: 0, y: 0 };
        console.log(`🚫 Animation removed from cell [${this.row}][${this.col}]`);
    }

    /**
     * Reset to original position (before animations)
     */
    resetToOriginal() {
        if (this.originalBounds) {
            this.bounds = { ...this.originalBounds };
        }
        this.currentOffset = { x: 0, y: 0 };
    }

    /**
     * Save current bounds as original for animation reset
     */
    saveOriginalBounds() {
        this.originalBounds = { ...this.bounds };
    }

    /**
     * Serialize cell data to JSON
     * @returns {Object} - Serializable representation
     */
    serialize() {
        return {
            row: this.row,
            col: this.col,
            type: this.type,
            bounds: this.bounds,
            originalBounds: this.originalBounds
            // Note: Animation state is NOT serialized - it's purely visual/transient
        };
    }

    /**
     * Restore cell from serialized data
     * @param {Object} data - Serialized cell data
     */
    static deserialize(data) {
        const cell = new GridCell(data.row, data.col);
        cell.type = data.type;
        cell.bounds = data.bounds;
        cell.originalBounds = data.originalBounds;
        // Animation state is not restored from serialization
        return cell;
    }
}