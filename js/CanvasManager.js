/**
 * CanvasManager.js - Handles all canvas operations and rendering
 * Manages the Chatooly-compliant canvas and provides rendering methods
 */

class CanvasManager {
    constructor() {
        // Get Chatooly-compliant canvas
        this.canvas = document.getElementById('chatooly-canvas');
        if (!this.canvas) {
            throw new Error('Canvas with id "chatooly-canvas" not found!');
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Set initial dimensions
        this.setDimensions(600, 600);
        
        // Background settings
        this.backgroundColor = '#ffffff';
        this.backgroundImage = null;
        
        // Debug flags
        this.showSpotOutlines = true;
        this.showSpotNumbers = true;
        this.showTextBounds = false;
        this.showPadding = false;
    }
    
    /**
     * Set canvas dimensions
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    setDimensions(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = width;
        this.height = height;
    }
    
    /**
     * Clear the entire canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Fill with background color
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    /**
     * Set background color
     * @param {string} color - CSS color string
     */
    setBackgroundColor(color) {
        this.backgroundColor = color;
    }
    
    /**
     * Set background image (for future use)
     * @param {HTMLImageElement} image - Background image
     */
    setBackgroundImage(image) {
        this.backgroundImage = image;
    }
    
    /**
     * Render background (color + optional image)
     */
    renderBackground() {
        // Clear and fill with background color
        this.clear();
        
        // If background image exists, draw it
        if (this.backgroundImage) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.3; // Make background image subtle
            this.ctx.drawImage(this.backgroundImage, 0, 0, this.width, this.height);
            this.ctx.restore();
        }
    }
    
    /**
     * Render text lines on canvas
     * @param {Array} lines - Array of line objects with text, x, y, width, height
     * @param {Object} textConfig - Text configuration object
     */
    renderText(lines, textConfig) {
        if (!lines || lines.length === 0) return;
        
        this.ctx.save();
        
        // Set font properties
        this.ctx.font = `${textConfig.fontSize}px ${textConfig.fontFamily || 'Arial'}`;
        this.ctx.fillStyle = textConfig.color || '#000000';
        this.ctx.textBaseline = 'top';
        
        // Render each line
        lines.forEach(line => {
            if (line.text.trim()) {
                // Set alignment for this line
                this.ctx.textAlign = line.alignment || 'left';
                
                // Calculate x position based on alignment
                let x = line.x;
                if (line.alignment === 'center') {
                    x = line.x + line.width / 2;
                } else if (line.alignment === 'right') {
                    x = line.x + line.width;
                }
                
                this.ctx.fillText(line.text, x, line.y);
            }
        });
        
        this.ctx.restore();
        
        // Draw text bounds if debug mode is on
        if (this.showTextBounds) {
            this.renderTextBounds(lines);
        }
    }
    
    /**
     * Render text bounding boxes for debug
     * @param {Array} lines - Array of line objects
     * @private
     */
    renderTextBounds(lines) {
        this.ctx.save();
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([2, 2]);
        
        lines.forEach(line => {
            this.ctx.strokeRect(line.x, line.y, line.width, line.height);
        });
        
        this.ctx.restore();
    }
    
    /**
     * Render padding areas for debug
     * @param {Object} textConfig - Text configuration with padding values
     * @private
     */
    renderPaddingAreas(textConfig) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.2)'; // Semi-transparent yellow
        this.ctx.strokeStyle = '#ffcc00';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([3, 3]);
        
        const { paddingTop, paddingBottom, paddingLeft, paddingRight } = textConfig;
        
        // Top padding area
        if (paddingTop > 0) {
            this.ctx.fillRect(0, 0, this.width, paddingTop);
            this.ctx.strokeRect(0, 0, this.width, paddingTop);
        }
        
        // Bottom padding area
        if (paddingBottom > 0) {
            this.ctx.fillRect(0, this.height - paddingBottom, this.width, paddingBottom);
            this.ctx.strokeRect(0, this.height - paddingBottom, this.width, paddingBottom);
        }
        
        // Left padding area
        if (paddingLeft > 0) {
            this.ctx.fillRect(0, 0, paddingLeft, this.height);
            this.ctx.strokeRect(0, 0, paddingLeft, this.height);
        }
        
        // Right padding area
        if (paddingRight > 0) {
            this.ctx.fillRect(this.width - paddingRight, 0, paddingRight, this.height);
            this.ctx.strokeRect(this.width - paddingRight, 0, paddingRight, this.height);
        }
        
        this.ctx.restore();
    }
    
    /**
     * Render all spots
     * @param {Array} spots - Array of Spot objects
     */
    renderSpots(spots) {
        if (!spots || spots.length === 0) return;
        
        spots.forEach(spot => {
            spot.render(this.ctx, this.showSpotOutlines, this.showSpotNumbers);
        });
    }
    
    /**
     * Render debug information
     * @param {Object} debugInfo - Debug information object
     */
    renderDebugInfo(debugInfo) {
        if (!debugInfo) return;
        
        this.ctx.save();
        this.ctx.fillStyle = '#000000';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        
        let y = 10;
        const lineHeight = 16;
        
        // Render debug text
        if (debugInfo.detectionTime) {
            this.ctx.fillText(`Detection Time: ${debugInfo.detectionTime}ms`, 10, y);
            y += lineHeight;
        }
        
        if (debugInfo.spotsFound) {
            this.ctx.fillText(`Spots Found: ${debugInfo.spotsFound}`, 10, y);
            y += lineHeight;
        }
        
        if (debugInfo.textLines) {
            this.ctx.fillText(`Text Lines: ${debugInfo.textLines}`, 10, y);
            y += lineHeight;
        }
        
        this.ctx.restore();
    }
    
    /**
     * Main render method - renders everything
     * @param {Object} renderData - Object containing all render data
     */
    render(renderData) {
        const {
            textLines = [],
            textConfig = {},
            spots = [],
            debugInfo = null
        } = renderData;
        
        // 1. Render background
        this.renderBackground();
        
        // 2. Render spots (behind text)
        this.renderSpots(spots);
        
        // 3. Render text (on top)
        this.renderText(textLines, textConfig);
        
        // 4. Render padding areas if debug mode is on
        if (this.showPadding && textConfig) {
            this.renderPaddingAreas(textConfig);
        }
        
        // 5. Render debug info if available
        if (debugInfo) {
            this.renderDebugInfo(debugInfo);
        }
    }
    
    /**
     * Set debug visualization options
     * @param {Object} options - Debug options
     */
    setDebugOptions(options) {
        if (options.showSpotOutlines !== undefined) {
            this.showSpotOutlines = options.showSpotOutlines;
        }
        if (options.showSpotNumbers !== undefined) {
            this.showSpotNumbers = options.showSpotNumbers;
        }
        if (options.showTextBounds !== undefined) {
            this.showTextBounds = options.showTextBounds;
        }
        if (options.showPadding !== undefined) {
            this.showPadding = options.showPadding;
        }
    }
    
    /**
     * Get canvas data URL for export (required by Chatooly)
     * @param {string} format - Image format ('png', 'jpeg')
     * @param {number} quality - Quality for JPEG (0-1)
     * @returns {string} Data URL
     */
    toDataURL(format = 'png', quality = 1.0) {
        return this.canvas.toDataURL(`image/${format}`, quality);
    }
    
    /**
     * Get canvas dimensions
     * @returns {{width: number, height: number}}
     */
    getDimensions() {
        return {
            width: this.width,
            height: this.height
        };
    }
    
    /**
     * Convert screen coordinates to canvas coordinates
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @returns {{x: number, y: number}} Canvas coordinates
     */
    screenToCanvas(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.width / rect.width;
        const scaleY = this.height / rect.height;
        
        return {
            x: (screenX - rect.left) * scaleX,
            y: (screenY - rect.top) * scaleY
        };
    }
    
    /**
     * Find spot at given coordinates
     * @param {number} x - Canvas X coordinate
     * @param {number} y - Canvas Y coordinate
     * @param {Array} spots - Array of spots to search
     * @returns {Spot|null} Found spot or null
     */
    findSpotAt(x, y, spots) {
        // Search in reverse order (top spots first)
        for (let i = spots.length - 1; i >= 0; i--) {
            if (spots[i].contains(x, y)) {
                return spots[i];
            }
        }
        return null;
    }
}