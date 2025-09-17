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
     */
    render(ctx, showOutline = true, showNumber = true) {
        ctx.save();
        
        // Render based on type
        switch(this.type) {
            case 'mask':
                this.renderMask(ctx);
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
     * Render mask spot (reveals background)
     * @private
     */
    renderMask(ctx) {
        // For now, just show as semi-transparent fill
        // In full implementation, this would use composite operations
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.fillColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.globalAlpha = 1.0;
    }
    
    /**
     * Render image spot placeholder
     * @private
     */
    renderImage(ctx) {
        // Fill with image placeholder color
        ctx.fillStyle = this.fillColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
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
     * Render text spot placeholder
     * @private
     */
    renderText(ctx) {
        // Fill with text placeholder color
        ctx.fillStyle = this.fillColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
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