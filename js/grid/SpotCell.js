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

        // Spots can also have animations (future feature)
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
     * Serialize SpotCell data to JSON
     * @returns {Object} - Serializable representation
     */
    serialize() {
        const baseData = super.serialize();
        return {
            ...baseData,
            spotId: this.spotId,
            spotType: this.spotType,
            content: this.content
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
        // Animation state is not restored from serialization
        return cell;
    }
}