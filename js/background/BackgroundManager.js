/**
 * BackgroundManager.js - Centralized background management system
 * Handles global background color, image, and fit modes
 */

class BackgroundManager {
    constructor() {
        this.backgroundColor = '#ffffff';
        this.backgroundImage = null;
        this.backgroundImageDataURL = null;
        this.backgroundFitMode = 'fill-canvas'; // 'stretch-canvas' | 'fit-canvas' | 'fill-canvas' | 'stretch-padding' | 'fit-padding' | 'fill-padding'
        this.padding = { top: 0, bottom: 0, left: 0, right: 0 };
    }
    
    /**
     * Set the global background color
     * @param {string} color - Hex color string (#ffffff)
     */
    setBackgroundColor(color) {
        this.backgroundColor = color;
    }
    
    /**
     * Set the background image
     * @param {File|HTMLImageElement} image - Image file or element
     * @param {Function} onLoadCallback - Callback when image is loaded
     */
    setBackgroundImage(image, onLoadCallback = null) {
        if (image instanceof File) {
            // Convert file to data URL
            const reader = new FileReader();
            reader.onload = (e) => {
                this.backgroundImageDataURL = e.target.result;
                this.backgroundImage = new Image();
                this.backgroundImage.onload = () => {
                    // Image loaded successfully - trigger callback if provided
                    if (onLoadCallback) {
                        onLoadCallback();
                    }
                };
                this.backgroundImage.src = this.backgroundImageDataURL;
            };
            reader.readAsDataURL(image);
        } else if (image instanceof HTMLImageElement) {
            this.backgroundImage = image;
            this.backgroundImageDataURL = null;
            if (onLoadCallback) {
                onLoadCallback();
            }
        }
    }
    
    /**
     * Set the background fit mode
     * @param {string} mode - 'stretch-canvas' | 'fit-canvas' | 'fill-canvas' | 'stretch-padding' | 'fit-padding' | 'fill-padding'
     */
    setBackgroundFitMode(mode) {
        this.backgroundFitMode = mode;
    }
    
    /**
     * Set canvas padding for fit-within-padding mode
     * @param {Object} padding - {top, bottom, left, right}
     */
    setPadding(padding) {
        this.padding = { ...padding };
    }
    
    /**
     * Clear the background image
     */
    clearBackgroundImage() {
        this.backgroundImage = null;
        this.backgroundImageDataURL = null;
    }
    
    /**
     * Render the background (color + optional image)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {HTMLCanvasElement} canvas - Canvas element
     */
    renderBackground(ctx, canvas) {
        // Clear the canvas first
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Render background color (fills entire canvas)
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Render background image if present
        if (this.backgroundImage) {
            this.renderBackgroundImage(ctx, canvas);
        }
    }
    
    /**
     * Render background image with proper fit mode
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @private
     */
    renderBackgroundImage(ctx, canvas) {
        if (!this.backgroundImage) return;
        
        ctx.save();
        
        if (this.backgroundFitMode === 'stretch-canvas') {
            this.renderImageStretchCanvas(ctx, canvas);
        } else if (this.backgroundFitMode === 'fit-canvas') {
            this.renderImageFitCanvas(ctx, canvas);
        } else if (this.backgroundFitMode === 'fill-canvas') {
            this.renderImageFillCanvas(ctx, canvas);
        } else if (this.backgroundFitMode === 'stretch-padding') {
            this.renderImageStretchPadding(ctx, canvas);
        } else if (this.backgroundFitMode === 'fit-padding') {
            this.renderImageFitPadding(ctx, canvas);
        } else if (this.backgroundFitMode === 'fill-padding') {
            this.renderImageFillPadding(ctx, canvas);
        }
        
        ctx.restore();
    }
    
    /**
     * Render image stretched to fill entire canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @private
     */
    renderImageStretchCanvas(ctx, canvas) {
        // Stretch image to fill entire canvas (may distort aspect ratio)
        ctx.drawImage(this.backgroundImage, 0, 0, canvas.width, canvas.height);
    }
    
    /**
     * Render image fitted to entire canvas (maintain aspect ratio)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @private
     */
    renderImageFitCanvas(ctx, canvas) {
        // Calculate scale to fit image within canvas while maintaining aspect ratio
        const scaleX = canvas.width / this.backgroundImage.width;
        const scaleY = canvas.height / this.backgroundImage.height;
        const scale = Math.min(scaleX, scaleY);
        
        const scaledWidth = this.backgroundImage.width * scale;
        const scaledHeight = this.backgroundImage.height * scale;
        
        // Center the image
        const x = (canvas.width - scaledWidth) / 2;
        const y = (canvas.height - scaledHeight) / 2;
        
        ctx.drawImage(this.backgroundImage, x, y, scaledWidth, scaledHeight);
    }
    
    /**
     * Render image stretched to fill padding area
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @private
     */
    renderImageStretchPadding(ctx, canvas) {
        const availableWidth = canvas.width - this.padding.left - this.padding.right;
        const availableHeight = canvas.height - this.padding.top - this.padding.bottom;
        
        if (availableWidth <= 0 || availableHeight <= 0) return;
        
        // Stretch image to fill the available area (may distort aspect ratio)
        ctx.drawImage(
            this.backgroundImage,
            this.padding.left,
            this.padding.top,
            availableWidth,
            availableHeight
        );
    }
    
    /**
     * Render image fitted to padding area (maintain aspect ratio)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @private
     */
    renderImageFitPadding(ctx, canvas) {
        const availableWidth = canvas.width - this.padding.left - this.padding.right;
        const availableHeight = canvas.height - this.padding.top - this.padding.bottom;
        
        if (availableWidth <= 0 || availableHeight <= 0) return;
        
        // Calculate scale to fit image within available area while maintaining aspect ratio
        const scaleX = availableWidth / this.backgroundImage.width;
        const scaleY = availableHeight / this.backgroundImage.height;
        const scale = Math.min(scaleX, scaleY);
        
        const scaledWidth = this.backgroundImage.width * scale;
        const scaledHeight = this.backgroundImage.height * scale;
        
        // Center the image within the available area
        const x = this.padding.left + (availableWidth - scaledWidth) / 2;
        const y = this.padding.top + (availableHeight - scaledHeight) / 2;
        
        ctx.drawImage(this.backgroundImage, x, y, scaledWidth, scaledHeight);
    }
    
    /**
     * Render image filled to padding area (crop to fit)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @private
     */
    renderImageFillPadding(ctx, canvas) {
        const availableWidth = canvas.width - this.padding.left - this.padding.right;
        const availableHeight = canvas.height - this.padding.top - this.padding.bottom;
        
        if (availableWidth <= 0 || availableHeight <= 0) return;
        
        // Calculate scale to fill available area while maintaining aspect ratio (may crop)
        const scaleX = availableWidth / this.backgroundImage.width;
        const scaleY = availableHeight / this.backgroundImage.height;
        const scale = Math.max(scaleX, scaleY);
        
        const scaledWidth = this.backgroundImage.width * scale;
        const scaledHeight = this.backgroundImage.height * scale;
        
        // Calculate source rectangle for cropping (center crop)
        // Convert scaled coordinates back to original image coordinates
        const sourceX = (scaledWidth - availableWidth) / 2 / scale;
        const sourceY = (scaledHeight - availableHeight) / 2 / scale;
        const sourceWidth = availableWidth / scale;
        const sourceHeight = availableHeight / scale;
        
        // Draw the cropped image to fill the exact padding area
        ctx.drawImage(
            this.backgroundImage,
            sourceX, sourceY, sourceWidth, sourceHeight,  // source rectangle (in original image space)
            this.padding.left, this.padding.top, availableWidth, availableHeight  // destination rectangle
        );
    }
    
    /**
     * Render image to fill entire canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @private
     */
    renderImageFillCanvas(ctx, canvas) {
        // Calculate scale to fill canvas while maintaining aspect ratio
        const scaleX = canvas.width / this.backgroundImage.width;
        const scaleY = canvas.height / this.backgroundImage.height;
        const scale = Math.max(scaleX, scaleY);
        
        const scaledWidth = this.backgroundImage.width * scale;
        const scaledHeight = this.backgroundImage.height * scale;
        
        // Center the image
        const x = (canvas.width - scaledWidth) / 2;
        const y = (canvas.height - scaledHeight) / 2;
        
        ctx.drawImage(this.backgroundImage, x, y, scaledWidth, scaledHeight);
    }
    
    /**
     * Get current background information
     * @returns {Object} Background info object
     */
    getBackgroundInfo() {
        return {
            backgroundColor: this.backgroundColor,
            hasImage: !!this.backgroundImage,
            fitMode: this.backgroundFitMode,
            padding: { ...this.padding }
        };
    }
    
    /**
     * Check if background image is loaded
     * @returns {boolean} True if image is loaded and ready
     */
    isImageLoaded() {
        return this.backgroundImage && this.backgroundImage.complete;
    }
}
