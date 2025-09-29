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

        // Animation properties
        this.animation = {
            type: 'none',                 // 'sway-horizontal' | 'sway-vertical' | 'none'
            isActive: false,
            intensity: 20,                // pixels of movement
            currentOffset: { x: 0, y: 0 }, // current animation position
            shouldReact: true,            // responds to neighbor animations
            reactionScale: 1,             // current scale for reactions
            reactionOffset: { x: 0, y: 0 } // offset from neighbor reactions
        };
    }

    /**
     * Calculate current animation offset based on time
     * @param {number} time - Current animation time
     * @returns {Object} - {x, y} offset values
     */
    getAnimationOffset(time) {
        if (!this.animation.isActive || this.animation.type === 'none') {
            return { x: 0, y: 0 };
        }

        const normalizedTime = (time / 1000) * 2; // 2 cycles per second
        const intensity = this.animation.intensity;

        switch (this.animation.type) {
            case 'sway-horizontal':
                return {
                    x: Math.sin(normalizedTime) * intensity,
                    y: 0
                };
            case 'sway-vertical':
                return {
                    x: 0,
                    y: Math.sin(normalizedTime) * intensity
                };
            default:
                return { x: 0, y: 0 };
        }
    }

    /**
     * Reset to original position (before animations)
     */
    resetToOriginal() {
        if (this.originalBounds) {
            this.bounds = { ...this.originalBounds };
        }
        this.animation.currentOffset = { x: 0, y: 0 };
        this.animation.reactionOffset = { x: 0, y: 0 };
        this.animation.reactionScale = 1;
        this.animation.isActive = false;
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
            originalBounds: this.originalBounds,
            animation: {
                type: this.animation.type,
                intensity: this.animation.intensity,
                shouldReact: this.animation.shouldReact
            }
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
        cell.animation.type = data.animation.type;
        cell.animation.intensity = data.animation.intensity;
        cell.animation.shouldReact = data.animation.shouldReact;
        return cell;
    }
}