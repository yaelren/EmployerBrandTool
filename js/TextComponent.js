/**
 * TextComponent.js - Base class for all text rendering components
 * Provides common text properties and rendering logic
 */

class TextComponent {
    constructor() {
        // Text content
        this.text = '';
        
        // Font properties
        this.fontFamily = '"Wix Madefor Display", Arial, sans-serif';
        this.fontSize = 48; // Can be a number or 'auto' for auto-sizing
        this.fontWeight = 'normal'; // 'normal' or 'bold'
        this.fontStyle = 'normal'; // 'normal' or 'italic'
        
        // Text color
        this.color = '#000000';
        
        // Text decoration
        this.underline = false;
        this.lineWidth = 1; // Underline width
        
        // Text highlight
        this.highlight = false;
        this.highlightColor = '#ffff00';
        this.highlightPadding = 0.1; // Padding around text for highlight (as ratio of fontSize)
        
        // ========== TEXT ALIGNMENT ========== \n        // How text is aligned within its calculated bounds (CSS text-align equivalent)
        this.alignH = 'center'; // 'left', 'center', 'right'
        this.alignV = 'middle'; // 'top', 'middle', 'bottom'
        
        // ========== POSITION ALIGNMENT ========== \n        // Where the entire text block is positioned within the container (9-position grid)
        this.positionH = 'center'; // 'left', 'center', 'right' - where text block sits in container
        this.positionV = 'middle'; // 'top', 'middle', 'bottom' - where text block sits in container
        
        // Padding (space between text and container edges)
        this.paddingTop = 20;
        this.paddingRight = 20;
        this.paddingBottom = 20;
        this.paddingLeft = 20;
        
        // Line spacing for multi-line text
        this.lineSpacing = 10;
        
        // Container bounds (will be set by subclasses)
        this.containerX = 0;
        this.containerY = 0;
        this.containerWidth = 0;
        this.containerHeight = 0;
        
        // Text wrapping
        this.wrapText = true;
        this.maxLines = null; // null for unlimited
        
        // Cached measurements
        this._cachedLines = null;
        this._cachedFontSize = null;
    }
    
    /**
     * Get available font options
     * @returns {Array} Array of font options with name and value
     */
    static getAvailableFonts() {
        return [
            { name: 'Wix Madefor Display', value: '"Wix Madefor Display", Arial, sans-serif' },
            { name: 'Wix Madefor Text', value: '"Wix Madefor Text", Arial, sans-serif' },
            { name: 'Arial', value: 'Arial, sans-serif' },
            { name: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
            { name: 'Times New Roman', value: '"Times New Roman", Times, serif' },
            { name: 'Georgia', value: 'Georgia, serif' },
            { name: 'Courier New', value: '"Courier New", Courier, monospace' },
            { name: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
            { name: 'Trebuchet MS', value: '"Trebuchet MS", Helvetica, sans-serif' },
            { name: 'Impact', value: 'Impact, Charcoal, sans-serif' }
        ];
    }

    /**
     * Set font family
     * @param {string} fontFamily - Font family CSS value
     */
    setFontFamily(fontFamily) {
        this.fontFamily = fontFamily;
        this.invalidateCache();
    }

    /**
     * Set text styles from an object
     * @param {Object} styles - Object containing style properties
     */
    setStyles(styles) {
        if (styles.bold !== undefined) {
            this.fontWeight = styles.bold ? 'bold' : 'normal';
        }
        if (styles.italic !== undefined) {
            this.fontStyle = styles.italic ? 'italic' : 'normal';
        }
        if (styles.underline !== undefined) {
            this.underline = styles.underline;
        }
        if (styles.highlight !== undefined) {
            this.highlight = styles.highlight;
        }
        if (styles.highlightColor !== undefined) {
            this.highlightColor = styles.highlightColor;
        }
        this.invalidateCache();
    }
    
    /**
     * Set all padding values at once
     * @param {number} value - Padding value in pixels
     */
    setPadding(value) {
        this.paddingTop = value;
        this.paddingRight = value;
        this.paddingBottom = value;
        this.paddingLeft = value;
        this.invalidateCache();
    }
    
    /**
     * Set individual padding values
     * @param {Object} padding - Object with top, right, bottom, left properties
     */
    setPaddingIndividual(padding) {
        if (padding.top !== undefined) this.paddingTop = padding.top;
        if (padding.right !== undefined) this.paddingRight = padding.right;
        if (padding.bottom !== undefined) this.paddingBottom = padding.bottom;
        if (padding.left !== undefined) this.paddingLeft = padding.left;
        this.invalidateCache();
    }
    
    /**
     * Set container bounds
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Container width
     * @param {number} height - Container height
     */
    setContainer(x, y, width, height) {
        this.containerX = x;
        this.containerY = y;
        this.containerWidth = width;
        this.containerHeight = height;
        this.invalidateCache();
    }
    
    /**
     * Get the font string for canvas context
     * @returns {string} Font string for ctx.font
     */
    getFontString(fontSize = null) {
        const size = fontSize || this.fontSize;
        return `${this.fontStyle} ${this.fontWeight} ${size}px ${this.fontFamily}`;
    }
    
    /**
     * Get available width for text (container width minus padding)
     * @returns {number} Available width in pixels
     */
    getAvailableWidth() {
        return this.containerWidth - this.paddingLeft - this.paddingRight;
    }
    
    /**
     * Get available height for text (container height minus padding)
     * @returns {number} Available height in pixels
     */
    getAvailableHeight() {
        return this.containerHeight - this.paddingTop - this.paddingBottom;
    }
    
    /**
     * Calculate optimal font size for text to fit container
     * @param {CanvasRenderingContext2D} ctx - Canvas context for measurement
     * @returns {number} Optimal font size in pixels
     */
    calculateAutoFontSize(ctx) {
        if (this._cachedFontSize !== null) {
            return this._cachedFontSize;
        }
        
        const availableWidth = this.getAvailableWidth();
        const availableHeight = this.getAvailableHeight();
        
        if (availableWidth <= 0 || availableHeight <= 0) {
            this._cachedFontSize = 12;
            return this._cachedFontSize;
        }
        
        let testFontSize = Math.min(availableHeight, 120);
        const minFontSize = 8;
        const step = 2;
        
        while (testFontSize >= minFontSize) {
            ctx.font = this.getFontString(testFontSize);
            const lines = this.wrapTextToLines(ctx, this.text, availableWidth, testFontSize);
            
            const totalHeight = lines.length * testFontSize + (lines.length - 1) * this.lineSpacing;
            
            if (totalHeight <= availableHeight) {
                // Check if all lines fit width
                let allFit = true;
                for (const line of lines) {
                    const metrics = ctx.measureText(line);
                    if (metrics.width > availableWidth) {
                        allFit = false;
                        break;
                    }
                }
                
                if (allFit) {
                    this._cachedFontSize = testFontSize;
                    this._cachedLines = lines;
                    return testFontSize;
                }
            }
            
            testFontSize -= step;
        }
        
        this._cachedFontSize = minFontSize;
        return minFontSize;
    }
    
    /**
     * Wrap text into lines that fit the available width
     * @param {CanvasRenderingContext2D} ctx - Canvas context for measurement
     * @param {string} text - Text to wrap
     * @param {number} maxWidth - Maximum width for each line
     * @param {number} fontSize - Font size to use
     * @returns {string[]} Array of text lines
     */
    wrapTextToLines(ctx, text, maxWidth, fontSize) {
        if (!this.wrapText) {
            return text.split('\n');
        }
        
        const inputLines = text.split('\n');
        const wrappedLines = [];
        
        ctx.font = this.getFontString(fontSize);
        
        for (const inputLine of inputLines) {
            if (!inputLine.trim()) {
                wrappedLines.push('');
                continue;
            }
            
            const words = inputLine.split(' ');
            let currentLine = '';
            
            for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                const metrics = ctx.measureText(testLine);
                
                if (metrics.width <= maxWidth) {
                    currentLine = testLine;
                } else {
                    if (currentLine) {
                        wrappedLines.push(currentLine);
                    }
                    currentLine = word;
                }
            }
            
            if (currentLine) {
                wrappedLines.push(currentLine);
            }
        }
        
        return wrappedLines;
    }
    
    /**
     * Calculate text position based on alignment and positioning
     * @param {number} lineWidth - Width of the text line (not used for positioning, kept for compatibility)
     * @param {number} totalHeight - Total height of all text lines
     * @returns {Object} Object with x and y starting positions and anchor info
     */
    calculateTextPosition(lineWidth, totalHeight) {
        // Calculate content area with padding
        const contentX = this.containerX + this.paddingLeft;
        const contentY = this.containerY + this.paddingTop;
        const contentWidth = this.getAvailableWidth();
        const contentHeight = this.getAvailableHeight();
        
        // Horizontal anchor position based on positionH
        let anchorX;
        switch (this.positionH) {
            case 'left':
                anchorX = contentX;
                break;
            case 'right':
                anchorX = contentX + contentWidth;
                break;
            case 'center':
            default:
                anchorX = contentX + contentWidth / 2;
                break;
        }
        
        // Vertical anchor position based on positionV
        let anchorY;
        switch (this.positionV) {
            case 'top':
                anchorY = contentY;
                break;
            case 'bottom':
                anchorY = contentY + contentHeight - totalHeight;
                break;
            case 'middle':
            default:
                anchorY = contentY + (contentHeight - totalHeight) / 2;
                break;
        }
        
        return { 
            x: anchorX, 
            y: anchorY,
            contentX,
            contentY,
            contentWidth,
            contentHeight
        };
    }
    
    /**
     * Render the text on canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    render(ctx) {
        if (!this.text || !this.text.trim()) return;
        
        const availableWidth = this.getAvailableWidth();
        const availableHeight = this.getAvailableHeight();
        
        if (availableWidth <= 0 || availableHeight <= 0) return;
        
        ctx.save();
        
        // Determine font size
        let fontSize = this.fontSize;
        if (fontSize === 'auto') {
            fontSize = this.calculateAutoFontSize(ctx);
        }
        
        // Set font
        ctx.font = this.getFontString(fontSize);
        ctx.fillStyle = this.color;
        ctx.textBaseline = 'top';
        
        // Get text lines
        const lines = this.wrapTextToLines(ctx, this.text, availableWidth, fontSize);
        
        // Calculate total text height
        const lineHeight = fontSize;
        const totalHeight = lines.length * lineHeight + (lines.length - 1) * this.lineSpacing;
        
        // Calculate starting position
        const position = this.calculateTextPosition(availableWidth, totalHeight);
        
        // Set text alignment for canvas
        ctx.textAlign = this.alignH;
        
        // Render each line
        lines.forEach((line, index) => {
            if (!line.trim()) return;
            
            const lineY = position.y + index * (lineHeight + this.lineSpacing);
            let lineX = position.x;
            
            // Measure line for decorations
            const metrics = ctx.measureText(line);
            
            // Draw highlight if enabled
            if (this.highlight) {
                ctx.save();
                ctx.fillStyle = this.highlightColor;
                
                let highlightX;
                switch (this.alignH) {
                    case 'left':
                        highlightX = lineX;
                        break;
                    case 'right':
                        highlightX = lineX - metrics.width;
                        break;
                    case 'center':
                    default:
                        highlightX = lineX - metrics.width / 2;
                        break;
                }
                
                const highlightPadding = fontSize * this.highlightPadding;
                ctx.fillRect(
                    highlightX - highlightPadding,
                    lineY - highlightPadding,
                    metrics.width + (highlightPadding * 2),
                    fontSize + (highlightPadding * 2)
                );
                
                ctx.fillStyle = this.color;
                ctx.restore();
            }
            
            // Draw the text
            ctx.fillText(line, lineX, lineY);
            
            // Draw underline if enabled
            if (this.underline) {
                ctx.save();
                ctx.strokeStyle = this.color;
                ctx.lineWidth = Math.max(1, fontSize * 0.05);
                
                let underlineX;
                switch (this.alignH) {
                    case 'left':
                        underlineX = lineX;
                        break;
                    case 'right':
                        underlineX = lineX - metrics.width;
                        break;
                    case 'center':
                    default:
                        underlineX = lineX - metrics.width / 2;
                        break;
                }
                
                const underlineY = lineY + fontSize * 0.9;
                ctx.beginPath();
                ctx.moveTo(underlineX, underlineY);
                ctx.lineTo(underlineX + metrics.width, underlineY);
                ctx.stroke();
                ctx.restore();
            }
        });
        
        ctx.restore();
    }
    
    /**
     * Invalidate cached calculations
     */
    invalidateCache() {
        this._cachedLines = null;
        this._cachedFontSize = null;
    }
    
    /**
     * Clone this text component
     * @returns {TextComponent} Cloned instance
     */
    clone() {
        const cloned = new this.constructor();
        Object.assign(cloned, this);
        return cloned;
    }
    
    /**
     * Export configuration as plain object
     * @returns {Object} Configuration object
     */
    toJSON() {
        return {
            text: this.text,
            fontFamily: this.fontFamily,
            fontSize: this.fontSize,
            fontWeight: this.fontWeight,
            fontStyle: this.fontStyle,
            color: this.color,
            underline: this.underline,
            highlight: this.highlight,
            highlightColor: this.highlightColor,
            alignH: this.alignH,
            alignV: this.alignV,
            positionH: this.positionH,
            positionV: this.positionV,
            paddingTop: this.paddingTop,
            paddingRight: this.paddingRight,
            paddingBottom: this.paddingBottom,
            paddingLeft: this.paddingLeft,
            lineSpacing: this.lineSpacing,
            wrapText: this.wrapText
        };
    }
    
    /**
     * Import configuration from plain object
     * @param {Object} config - Configuration object
     */
    fromJSON(config) {
        Object.assign(this, config);
        this.invalidateCache();
    }
}

/**
 * MainTextComponent - Specialized text component for main canvas text
 * Inherits from TextComponent and adds main text specific behavior
 */
class MainTextComponent extends TextComponent {
    constructor() {
        super();
        
        // Main text specific defaults
        this.fontSize = 'auto'; // Auto-size by default
        this.alignH = 'center';
        this.alignV = 'middle';
        
        // Canvas filling mode
        this.fillCanvas = true;
        
        // Per-line alignment support
        this.lineAlignments = {}; // { lineIndex: 'left' | 'center' | 'right' }
    }
    
    /**
     * Set alignment for a specific line
     * @param {number} lineIndex - Index of the line
     * @param {string} alignment - 'left', 'center', or 'right'
     */
    setLineAlignment(lineIndex, alignment) {
        this.lineAlignments[lineIndex] = alignment;
        this.invalidateCache();
    }
    
    /**
     * Get alignment for a specific line
     * @param {number} lineIndex - Index of the line
     * @returns {string} Line alignment or default alignment
     */
    getLineAlignment(lineIndex) {
        // Check if we have a numeric index stored
        if (this.lineAlignments.hasOwnProperty(lineIndex)) {
            return this.lineAlignments[lineIndex];
        }
        
        // Fallback to default alignment
        return this.alignH;
    }
    
    /**
     * Override render to support per-line alignment
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    render(ctx) {
        if (!this.text || !this.text.trim()) return;
        
        const availableWidth = this.getAvailableWidth();
        const availableHeight = this.getAvailableHeight();
        
        if (availableWidth <= 0 || availableHeight <= 0) return;
        
        ctx.save();
        
        // Determine font size
        let fontSize = this.fontSize;
        if (fontSize === 'auto') {
            fontSize = this.calculateAutoFontSize(ctx);
        }
        
        // Set font
        ctx.font = this.getFontString(fontSize);
        ctx.fillStyle = this.color;
        ctx.textBaseline = 'top';
        
        // Get text lines
        const lines = this.wrapTextToLines(ctx, this.text, availableWidth, fontSize);
        
        // Calculate total text height
        const lineHeight = fontSize;
        const totalHeight = lines.length * lineHeight + (lines.length - 1) * this.lineSpacing;
        
        // Calculate starting position
        const position = this.calculateTextPosition(availableWidth, totalHeight);
        
        // Render each line with its own alignment
        lines.forEach((line, index) => {
            if (!line.trim()) return;
            
            const lineY = position.y + index * (lineHeight + this.lineSpacing);
            const lineAlign = this.getLineAlignment(index);
            
            // Calculate line X based on line-specific alignment
            let lineX;
            const contentX = this.containerX + this.paddingLeft;
            
            switch (lineAlign) {
                case 'left':
                    lineX = contentX;
                    ctx.textAlign = 'left';
                    break;
                case 'right':
                    lineX = contentX + availableWidth;
                    ctx.textAlign = 'right';
                    break;
                case 'center':
                default:
                    lineX = contentX + availableWidth / 2;
                    ctx.textAlign = 'center';
                    break;
            }
            
            // Measure line for decorations
            const metrics = ctx.measureText(line);
            
            // Draw highlight if enabled
            if (this.highlight) {
                ctx.save();
                ctx.fillStyle = this.highlightColor;
                
                let highlightX;
                switch (lineAlign) {
                    case 'left':
                        highlightX = lineX;
                        break;
                    case 'right':
                        highlightX = lineX - metrics.width;
                        break;
                    case 'center':
                    default:
                        highlightX = lineX - metrics.width / 2;
                        break;
                }
                
                const highlightPadding = fontSize * this.highlightPadding;
                ctx.fillRect(
                    highlightX - highlightPadding,
                    lineY - highlightPadding,
                    metrics.width + (highlightPadding * 2),
                    fontSize + (highlightPadding * 2)
                );
                
                ctx.fillStyle = this.color;
                ctx.restore();
            }
            
            // Draw the text
            ctx.fillText(line, lineX, lineY);
            
            // Draw underline if enabled
            if (this.underline) {
                ctx.save();
                ctx.strokeStyle = this.color;
                ctx.lineWidth = Math.max(1, fontSize * 0.05);
                
                let underlineX;
                switch (lineAlign) {
                    case 'left':
                        underlineX = lineX;
                        break;
                    case 'right':
                        underlineX = lineX - metrics.width;
                        break;
                    case 'center':
                    default:
                        underlineX = lineX - metrics.width / 2;
                        break;
                }
                
                const underlineY = lineY + fontSize * 0.9;
                ctx.beginPath();
                ctx.moveTo(underlineX, underlineY);
                ctx.lineTo(underlineX + metrics.width, underlineY);
                ctx.stroke();
                ctx.restore();
            }
        });
        
        ctx.restore();
    }
}

/**
 * SpotTextComponent - Specialized text component for spot text
 * Inherits from TextComponent and adds spot-specific behavior
 */
class SpotTextComponent extends TextComponent {
    constructor() {
        super();
        
        // Spot text specific defaults
        this.fontSize = 'auto'; // Auto-size by default
        this.alignH = 'center';
        this.alignV = 'middle';
        this.setPadding(1); // Default 1px padding for spots
        
        // Spot-specific properties
        this.spotId = null;
    }
    
    /**
     * Set the associated spot ID
     * @param {number} spotId - ID of the spot this text belongs to
     */
    setSpotId(spotId) {
        this.spotId = spotId;
    }
}