/**
 * SpotCell.js - Grid cell for spots (empty, image, text, mask)
 * Part of the Grid Animation System
 */

class SpotCell extends GridCell {
    constructor(spot, row, col) {
        super(row, col);
        this.type = 'spot';
        this.spotId = spot.id;
        this.content = spot.content || null;
        this.spotType = spot.type; // 'empty' | 'image' | 'text' | 'mask'

        // Store reference to original spot for compatibility
        this.spot = spot;

        // Spots typically react to text animations
        this.animation.canInitiate = false;
        this.animation.reactionType = 'scale';
        this.animation.intensity = 10; // Smaller reaction than text
        this.animation.shouldReact = true;
    }

    /**
     * Update spot content
     * @param {*} newContent - New content for the spot
     */
    setContent(newContent) {
        this.content = newContent;
        if (this.spot) {
            this.spot.content = newContent;
        }
    }

    /**
     * Update spot type
     * @param {string} newType - 'empty' | 'image' | 'text' | 'mask'
     */
    setSpotType(newType) {
        this.spotType = newType;
        if (this.spot) {
            this.spot.type = newType;
        }
    }

    /**
     * Check if this spot is empty
     * @returns {boolean}
     */
    isEmpty() {
        return this.spotType === 'empty' || !this.content;
    }

    /**
     * Check if this spot has image content
     * @returns {boolean}
     */
    hasImage() {
        return this.spotType === 'image' && this.content;
    }

    /**
     * Check if this spot has text content
     * @returns {boolean}
     */
    hasText() {
        return this.spotType === 'text' && this.content;
    }

    /**
     * Check if this spot is a mask
     * @returns {boolean}
     */
    isMask() {
        return this.spotType === 'mask';
    }

    /**
     * Get the appropriate reaction intensity based on spot type
     * @returns {number}
     */
    getReactionIntensity() {
        switch (this.spotType) {
            case 'empty':
                return this.animation.intensity * 1.0; // Full reaction
            case 'image':
                return this.animation.intensity * 0.7; // Less reaction for images
            case 'text':
                return this.animation.intensity * 0.8; // Moderate reaction for text
            case 'mask':
                return this.animation.intensity * 0.5; // Minimal reaction for masks
            default:
                return this.animation.intensity;
        }
    }

    /**
     * Apply reaction to neighboring animation
     * @param {number} neighborOffset - Animation offset from neighbor
     * @param {number} distance - Distance from animating neighbor
     */
    applyReaction(neighborOffset, distance = 1) {
        if (!this.animation.shouldReact) return;

        const falloff = 1 / (distance + 1); // Distance falloff
        const intensity = this.getReactionIntensity();
        const reactionStrength = Math.abs(neighborOffset) / 20; // Normalize to 0-1

        // Apply scale reaction
        if (this.animation.reactionType === 'scale') {
            this.animation.reactionScale = 1 - (reactionStrength * 0.3 * falloff);
            this.animation.reactionScale = Math.max(0.7, this.animation.reactionScale); // Minimum scale
        }

        // Store reaction offset for rendering
        this.animation.reactionOffset = {
            x: neighborOffset * 0.5 * falloff,
            y: 0
        };
    }

    /**
     * Serialize SpotCell data to JSON
     * @returns {Object} - Serializable representation
     */
    serialize() {
        const baseData = super.serialize();
        return {
            ...baseData,
            spotId: this.spotId,
            spotType: this.spotType,
            content: this.content,
            reactionType: this.animation.reactionType
        };
    }

    /**
     * Restore SpotCell from serialized data
     * @param {Object} data - Serialized cell data
     * @returns {SpotCell}
     */
    static deserialize(data) {
        // Create a mock spot object for the constructor
        const mockSpot = {
            id: data.spotId,
            type: data.spotType,
            content: data.content
        };

        const cell = new SpotCell(mockSpot, data.row, data.col);
        cell.bounds = data.bounds;
        cell.originalBounds = data.originalBounds;
        cell.animation.type = data.animation.type;
        cell.animation.intensity = data.animation.intensity;
        cell.animation.shouldReact = data.animation.shouldReact;
        cell.animation.reactionType = data.reactionType;
        return cell;
    }
}