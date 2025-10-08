/**
 * MainTextCell.js - Grid cell for main text lines
 * Part of the Grid Animation System
 */

class MainTextCell extends GridCell {
    constructor(text, lineIndex, row, col) {
        super(row, col);
        this.type = 'main-text';
        this.text = text;
        this.lineIndex = lineIndex;

        // Override contentId with content-based ID for text cells
        // This ensures text cells with same content get same ID across rebuilds
        this.contentId = this._generateTextContentId(text, lineIndex);

        // Text styling properties
        this.style = {
            fontSize: 48,
            fontFamily: '"Wix Madefor Display", Arial, sans-serif',
            color: '#000000',
            alignment: 'left',
            bold: false,
            italic: false,
            underline: false,
            highlight: false,
            highlightColor: '#ffff00'
        };

        // Text cells support animations (set via setAnimation method)
    }

    /**
     * Generate content-based ID for text cells
     * @param {string} text - Text content
     * @param {number} lineIndex - Line index
     * @returns {string} - Content-based ID
     * @private
     */
    _generateTextContentId(text, lineIndex) {
        // Simple hash function for text
        const hash = this._hashString(text);
        return `text-${lineIndex}-${hash}`;
    }

    /**
     * Simple string hash function
     * @param {string} str - String to hash
     * @returns {string} - Hash string
     * @private
     */
    _hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Update text content
     * @param {string} newText - New text content
     */
    setText(newText) {
        this.text = newText;
        // Update contentId when text changes
        this.contentId = this._generateTextContentId(newText, this.lineIndex);
    }

    /**
     * Update text style properties
     * @param {Object} styleUpdates - Style properties to update
     */
    updateStyle(styleUpdates) {
        Object.assign(this.style, styleUpdates);
    }

    /**
     * Get text style as CSS font string
     * @returns {string} - CSS font string
     */
    getFontString() {
        let fontString = '';

        if (this.style.italic) fontString += 'italic ';
        if (this.style.bold) fontString += 'bold ';

        fontString += `${this.style.fontSize}px ${this.style.fontFamily}`;

        return fontString;
    }

    /**
     * Check if this text cell is empty
     * @returns {boolean}
     */
    isEmpty() {
        return !this.text || this.text.trim().length === 0;
    }

    /**
     * Get the current alignment of this text cell
     * @returns {string} - Alignment value ('left', 'center', 'right')
     */
    getAlignment() {
        return this.style.alignment || 'left';
    }

    /**
     * Serialize MainTextCell data to JSON
     * @returns {Object} - Serializable representation
     */
    serialize() {
        const baseData = super.serialize();
        return {
            ...baseData,
            text: this.text,
            lineIndex: this.lineIndex,
            style: { ...this.style }
        };
    }

    /**
     * Restore MainTextCell from serialized data
     * @param {Object} data - Serialized cell data
     * @returns {MainTextCell}
     */
    static deserialize(data) {
        const cell = new MainTextCell(data.text, data.lineIndex, data.row, data.col);
        cell.bounds = data.bounds;
        cell.originalBounds = data.originalBounds;
        cell.style = { ...data.style };
        // Animation state is not restored from serialization
        return cell;
    }
}