/**
 * Spot.js - Simple data model for detected open spots
 * Represents a rectangular area that can contain content (image, text, mask, or empty)
 */

class Spot {
    constructor(id, x, y, width, height, row = 0, column = 0) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.row = row;
        this.column = column;
        
        // Content properties
        this.type = 'empty'; // 'empty' | 'image' | 'text' | 'mask'
        this.content = null; // Content data based on type
        this.opacity = 1.0; // For mask type
        
        // Visual properties
        this.outlineColor = '#e5e5e5';
        this.fillColor = 'rgba(229, 229, 229, 0.1)';
    }
    
    /**
     * Set the type of content this spot contains
     * @param {string} type - 'empty', 'image', 'text', or 'mask'
     */
    setType(type) {
        this.type = type;
        this.content = null; // Reset content when type changes
        
        // Set default properties based on type
        switch(type) {
            case 'mask':
                this.opacity = 0.5;
                this.fillColor = 'rgba(229, 229, 229, 0.3)';
                break;
            case 'image':
                this.fillColor = 'rgba(100, 149, 237, 0.2)'; // Light blue
                break;
            case 'text':
                this.fillColor = 'rgba(255, 165, 0, 0.2)'; // Light orange
                break;
            default:
                this.fillColor = 'rgba(229, 229, 229, 0.1)'; // Default light gray
        }
    }
    
    /**
     * Set content for this spot
     * @param {*} content - Content data (depends on type)
     */
    setContent(content) {
        this.content = content;
    }
    
    /**
     * Set opacity for mask spots
     * @param {number} opacity - Opacity value (0-1)
     */
    setOpacity(opacity) {
        this.opacity = Math.max(0, Math.min(1, opacity));
    }
    
    /**
     * Check if a point is inside this spot
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if point is inside
     */
    contains(x, y) {
        return x >= this.x && 
               x <= this.x + this.width && 
               y >= this.y && 
               y <= this.y + this.height;
    }
    
    /**
     * Get the center point of this spot
     * @returns {{x: number, y: number}} Center coordinates
     */
    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }
    
    /**
     * Get area of this spot
     * @returns {number} Area in pixels
     */
    getArea() {
        return this.width * this.height;
    }
    
    /**
     * Get aspect ratio of this spot
     * @returns {number} Width divided by height
     */
    getAspectRatio() {
        return this.width / this.height;
    }
    
    /**
     * Render this spot on a canvas context
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {boolean} showOutline - Whether to show outline
     * @param {boolean} showNumber - Whether to show spot number
     * @param {HTMLImageElement} backgroundImage - Background image for mask spots
     */
    render(ctx, showOutline = true, showNumber = true, backgroundImage = null) {
        ctx.save();
        
        // Render based on type
        switch(this.type) {
            case 'mask':
                this.renderMask(ctx, backgroundImage);
                break;
            case 'image':
                this.renderImage(ctx);
                break;
            case 'text':
                this.renderText(ctx);
                break;
            default:
                this.renderEmpty(ctx);
        }
        
        // Draw outline if requested
        if (showOutline) {
            ctx.strokeStyle = this.outlineColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
        
        // Draw spot number if requested
        if (showNumber) {
            this.renderSpotNumber(ctx);
        }
        
        ctx.restore();
    }
    
    /**
     * Render empty spot (just fill)
     * @private
     */
    renderEmpty(ctx) {
        ctx.fillStyle = this.fillColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    
    /**
     * Render mask spot (reveals background image through transparent area)
     * @param {HTMLImageElement} backgroundImage - Background image to reveal
     * @private
     */
    renderMask(ctx, backgroundImage = null) {
        // Calculate content area with padding
        const padding = this.content?.padding || 0;
        const contentX = this.x + padding;
        const contentY = this.y + padding;
        const contentWidth = this.width - (padding * 2);
        const contentHeight = this.height - (padding * 2);
        
        if (backgroundImage && contentWidth > 0 && contentHeight > 0) {
            // Create a clipping path for the mask area
            ctx.save();
            ctx.beginPath();
            ctx.rect(contentX, contentY, contentWidth, contentHeight);
            ctx.clip();
            
            // Draw the background image scaled to fit the canvas
            const canvasWidth = ctx.canvas.width;
            const canvasHeight = ctx.canvas.height;
            ctx.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);
            
            ctx.restore();
        } else {
            // No background image or invalid dimensions - show placeholder
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.fillColor;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.globalAlpha = 1.0;
            
            // Add mask icon placeholder
            const iconSize = Math.min(this.width, this.height) * 0.3;
            const iconX = this.x + (this.width - iconSize) / 2;
            const iconY = this.y + (this.height - iconSize) / 2;
            
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(iconX + iconSize/2, iconY + iconSize/2, iconSize/2, 0, Math.PI * 2);
            ctx.stroke();
            
            // Add "M" for mask
            ctx.fillStyle = '#888';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('M', iconX + iconSize/2, iconY + iconSize/2);
        }
    }
    
    /**
     * Render image spot with actual image content, scale, and rotation
     * @private
     */
    renderImage(ctx) {
        // If no image content, show placeholder with background
        if (!this.content || !this.content.image) {
            ctx.fillStyle = this.fillColor;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            this.renderImagePlaceholder(ctx);
            return;
        }
        
        // Calculate content area with padding
        const padding = this.content.padding || 0;
        const contentX = this.x + padding;
        const contentY = this.y + padding;
        const contentWidth = this.width - (padding * 2);
        const contentHeight = this.height - (padding * 2);
        
        if (contentWidth <= 0 || contentHeight <= 0) return;
        
        const image = this.content.image;
        const scale = this.content.scale || 1;
        const rotation = (this.content.rotation || 0) * Math.PI / 180; // Convert to radians
        
        // Calculate image dimensions maintaining aspect ratio
        const imageAspect = image.width / image.height;
        const contentAspect = contentWidth / contentHeight;
        
        let drawWidth, drawHeight;
        if (imageAspect > contentAspect) {
            // Image is wider than content area
            drawWidth = contentWidth * scale;
            drawHeight = (contentWidth / imageAspect) * scale;
        } else {
            // Image is taller than content area
            drawWidth = (contentHeight * imageAspect) * scale;
            drawHeight = contentHeight * scale;
        }
        
        // Center the image in content area
        const centerX = contentX + contentWidth / 2;
        const centerY = contentY + contentHeight / 2;
        
        ctx.save();
        
        // Move to center, rotate, then move back
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);
        ctx.translate(-drawWidth / 2, -drawHeight / 2);
        
        // Draw the image
        ctx.drawImage(image, 0, 0, drawWidth, drawHeight);
        
        ctx.restore();
    }
    
    /**
     * Render image placeholder when no content
     * @private
     */
    renderImagePlaceholder(ctx) {
        // Add image icon placeholder (simple rectangle with X)
        const iconSize = Math.min(this.width, this.height) * 0.3;
        const iconX = this.x + (this.width - iconSize) / 2;
        const iconY = this.y + (this.height - iconSize) / 2;
        
        ctx.strokeStyle = '#6495ED';
        ctx.lineWidth = 2;
        ctx.strokeRect(iconX, iconY, iconSize, iconSize);
        
        // Draw X
        ctx.beginPath();
        ctx.moveTo(iconX, iconY);
        ctx.lineTo(iconX + iconSize, iconY + iconSize);
        ctx.moveTo(iconX + iconSize, iconY);
        ctx.lineTo(iconX, iconY + iconSize);
        ctx.stroke();
    }
    
    /**
     * Render text spot with actual text content and auto-fitting
     * @private
     */
    renderText(ctx) {
        // If no text content, show placeholder with background
        if (!this.content || !this.content.text) {
            ctx.fillStyle = this.fillColor;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            this.renderTextPlaceholder(ctx);
            return;
        }
        
        // Create or update SpotTextComponent
        if (!this.textComponent) {
            this.textComponent = new SpotTextComponent();
            this.textComponent.setSpotId(this.id);
        }
        
        // Update text component with current content
        this.syncTextComponent();
        
        // Render using TextComponent
        this.textComponent.render(ctx);
    }
    
    /**
     * Sync SpotTextComponent with current spot content
     * @private
     */
    syncTextComponent() {
        if (!this.textComponent) return;
        
        // Set container bounds
        this.textComponent.setContainer(this.x, this.y, this.width, this.height);
        
        // Set text content
        this.textComponent.text = this.content.text || '';
        
        // Set color
        this.textComponent.color = this.content.color || '#000000';
        
        // Set alignment
        this.textComponent.alignH = this.content.textAlign || 'center';
        this.textComponent.alignV = 'middle'; // Spots always center vertically
        
        // Set padding
        const padding = this.content.padding || 1;
        this.textComponent.setPadding(padding);
        
        // Set font size
        this.textComponent.fontSize = this.content.fontSize || 'auto';
        
        // Set text styles
        const styles = this.content.styles || {};
        this.textComponent.fontWeight = styles.bold ? 'bold' : 'normal';
        this.textComponent.fontStyle = styles.italic ? 'italic' : 'normal';
        this.textComponent.underline = styles.underline || false;
        this.textComponent.highlight = styles.highlight || false;
        this.textComponent.highlightColor = this.content.highlightColor || '#ffff00';
    }
    
    
    /**
     * Render text placeholder when no content
     * @private
     */
    renderTextPlaceholder(ctx) {
        // Add text lines placeholder
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        const lineSpacing = Math.min(this.height / 4, 20);
        const startY = this.y + this.height / 3;
        
        for (let i = 0; i < 3; i++) {
            const y = startY + i * lineSpacing;
            if (y + lineSpacing > this.y + this.height) break;
            
            const lineWidth = this.width * 0.7 * (i === 2 ? 0.6 : 1); // Last line shorter
            ctx.beginPath();
            ctx.moveTo(this.x + 10, y);
            ctx.lineTo(this.x + lineWidth, y);
            ctx.stroke();
        }
    }
    
    /**
     * Wrap text to fit in given width
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} text - Text to wrap
     * @param {number} maxWidth - Maximum width
     * @param {string} fontStyle - Font style (normal, italic)
     * @param {string} fontWeight - Font weight (normal, bold)
     * @returns {Array} Array of wrapped lines
     * @private
     */
    wrapTextToFitArea(ctx, text, maxWidth, fontStyle = 'normal', fontWeight = 'normal') {
        // Start with a reasonable font size for measurement
        const testFontSize = 16;
        ctx.font = `${fontStyle} ${fontWeight} ${testFontSize}px "Wix Madefor Display", Arial, sans-serif`;
        
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines.length > 0 ? lines : [text]; // Fallback to original text if wrapping fails
    }
    
    /**
     * Calculate optimal font size for multiple lines
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Array} lines - Array of text lines
     * @param {number} maxWidth - Maximum width
     * @param {number} maxHeight - Maximum height
     * @param {string} fontStyle - Font style (normal, italic)
     * @param {string} fontWeight - Font weight (normal, bold)
     * @returns {number} Optimal font size
     * @private
     */
    calculateOptimalFontSizeForLines(ctx, lines, maxWidth, maxHeight, fontStyle = 'normal', fontWeight = 'normal') {
        let fontSize = Math.min(maxHeight / lines.length * 0.8, 72);
        const minFontSize = 8;
        
        ctx.save();
        
        while (fontSize > minFontSize) {
            ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "Wix Madefor Display", Arial, sans-serif`;
            
            // Check if all lines fit width
            let allLinesFit = true;
            let maxLineWidth = 0;
            
            for (const line of lines) {
                const metrics = ctx.measureText(line);
                maxLineWidth = Math.max(maxLineWidth, metrics.width);
                if (metrics.width > maxWidth) {
                    allLinesFit = false;
                    break;
                }
            }
            
            // Check if total height fits
            const lineHeight = fontSize * 1.2;
            const totalHeight = lines.length * lineHeight;
            
            if (allLinesFit && totalHeight <= maxHeight) {
                ctx.restore();
                return fontSize;
            }
            
            fontSize -= 2;
        }
        
        ctx.restore();
        return minFontSize;
    }
    
    /**
     * Calculate optimal font size to fit text in given area (legacy method for backward compatibility)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} text - Text to fit
     * @param {number} maxWidth - Maximum width
     * @param {number} maxHeight - Maximum height
     * @returns {number} Optimal font size
     * @private
     */
    calculateOptimalFontSize(ctx, text, maxWidth, maxHeight) {
        let fontSize = Math.min(maxHeight * 0.8, 72); // Start with reasonable size
        const minFontSize = 8;
        
        ctx.save();
        
        while (fontSize > minFontSize) {
            ctx.font = `${fontSize}px "Wix Madefor Display", Arial, sans-serif`;
            const metrics = ctx.measureText(text);
            
            // Check if text fits both width and height
            if (metrics.width <= maxWidth && fontSize <= maxHeight * 0.8) {
                ctx.restore();
                return fontSize;
            }
            
            fontSize -= 2;
        }
        
        ctx.restore();
        return minFontSize;
    }
    
    /**
     * Render spot number
     * @private
     */
    renderSpotNumber(ctx) {
        const center = this.getCenter();
        const radius = 15;
        
        // Circle background
        ctx.fillStyle = '#e5e5e5';
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Number text
        ctx.fillStyle = '#121212';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.id.toString(), center.x, center.y);
    }
    
    /**
     * Get a summary of this spot for debugging
     * @returns {string} Summary string
     */
    toString() {
        return `Spot ${this.id}: ${Math.round(this.width)}x${Math.round(this.height)} at (${Math.round(this.x)}, ${Math.round(this.y)}) - ${this.type}`;
    }
}