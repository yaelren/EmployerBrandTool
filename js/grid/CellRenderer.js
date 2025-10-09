/**
 * CellRenderer.js - Separated rendering logic for grid cells
 * Part of the Unified Grid System
 *
 * Handles rendering for all cell types: MainTextCell and ContentCell
 * Uses static methods for stateless rendering
 */

class CellRenderer {
    /**
     * Render any cell type (main entry point)
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {GridCell} cell - Cell to render
     * @param {Object} options - Rendering options
     *   - showOutlines: boolean - Show cell outlines
     *   - showNumbers: boolean - Show cell numbers
     *   - backgroundImage: HTMLImageElement - Background image for masks
     */
    static render(ctx, cell, options = {}) {
        if (!cell) return;

        if (cell instanceof MainTextCell) {
            this.renderTextCell(ctx, cell, options);
        } else if (cell instanceof ContentCell) {
            this.renderContentCell(ctx, cell, options);
        }
    }

    // ===== TEXT CELL RENDERING =====

    /**
     * Render MainTextCell with proper styling
     * @param {CanvasRenderingContext2D} ctx
     * @param {MainTextCell} cell
     * @param {Object} options
     */
    static renderTextCell(ctx, cell, options) {
        ctx.font = cell.getFontString();
        ctx.fillStyle = cell.textComponent.color;
        const alignment = cell.getAlignment();
        ctx.textAlign = alignment;
        ctx.textBaseline = 'top';

        // Calculate text position based on alignment
        // bounds.x is the LEFT edge of the text bounds
        let textX;
        switch (alignment) {
            case 'left':
                textX = cell.bounds.x;
                break;
            case 'center':
                textX = cell.bounds.x + cell.bounds.width / 2;
                break;
            case 'right':
                textX = cell.bounds.x + cell.bounds.width; // Right edge for right-aligned text
                break;
            default:
                textX = cell.bounds.x;
        }

        // Draw highlight if enabled
        if (cell.textComponent.highlight) {
            ctx.fillStyle = cell.textComponent.highlightColor;
            ctx.fillRect(cell.bounds.x, cell.bounds.y, cell.bounds.width, cell.bounds.height);
            ctx.fillStyle = cell.textComponent.color;
        }

        // Draw text
        ctx.fillText(cell.text, textX, cell.bounds.y);

        // Draw underline if enabled
        if (cell.textComponent.underline) {
            const textWidth = ctx.measureText(cell.text).width;
            const underlineY = cell.bounds.y + cell.bounds.height - 2;

            let underlineX;
            switch (cell.getAlignment()) {
                case 'left':
                    underlineX = textX;
                    break;
                case 'center':
                    underlineX = textX - textWidth / 2;
                    break;
                case 'right':
                    underlineX = textX - textWidth; // Start from left edge
                    break;
                default:
                    underlineX = textX;
            }

            ctx.strokeStyle = cell.textComponent.color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(underlineX, underlineY);
            ctx.lineTo(underlineX + textWidth, underlineY);
            ctx.stroke();
        }
    }

    // ===== CONTENT CELL RENDERING =====

    /**
     * Render ContentCell based on its content type
     * @param {CanvasRenderingContext2D} ctx
     * @param {ContentCell} cell
     * @param {Object} options
     */
    static renderContentCell(ctx, cell, options) {
        // Render content based on type
        switch (cell.contentType) {
            case 'image':
                this.renderImage(ctx, cell, options);
                break;
            case 'text':
                this.renderSpotText(ctx, cell, options);
                break;
            case 'mask':
                this.renderMask(ctx, cell, options);
                break;
            default:  // 'empty'
                this.renderEmpty(ctx, cell, options);
        }

        // Draw outline if requested
        if (options.showOutlines) {
            ctx.strokeStyle = cell.outlineColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(cell.bounds.x, cell.bounds.y, cell.bounds.width, cell.bounds.height);
        }

        // Draw cell number if requested
        if (options.showNumbers && cell.id) {
            this.renderCellNumber(ctx, cell);
        }
    }

    // ===== INDIVIDUAL CONTENT TYPE RENDERERS =====

    /**
     * Render empty content cell (just fill color)
     * @private
     */
    static renderEmpty(ctx, cell, options) {
        if (cell.fillColor !== 'transparent') {
            ctx.fillStyle = cell.fillColor;
            ctx.fillRect(cell.bounds.x, cell.bounds.y, cell.bounds.width, cell.bounds.height);
        }
    }

    /**
     * Render image content cell
     * @private
     */
    static renderImage(ctx, cell, options) {
        // If no image content, show placeholder
        if (!cell.content || !cell.content.image) {
            if (cell.fillColor !== 'transparent') {
                ctx.fillStyle = cell.fillColor;
                ctx.fillRect(cell.bounds.x, cell.bounds.y, cell.bounds.width, cell.bounds.height);
            }
            this.renderImagePlaceholder(ctx, cell);
            return;
        }

        // Calculate content area with padding
        const padding = cell.content.padding || 0;
        const contentX = cell.bounds.x + padding;
        const contentY = cell.bounds.y + padding;
        const contentWidth = cell.bounds.width - (padding * 2);
        const contentHeight = cell.bounds.height - (padding * 2);

        if (contentWidth <= 0 || contentHeight <= 0) return;

        const image = cell.content.image;
        const scale = cell.content.scale || 1;
        const rotation = (cell.content.rotation || 0) * Math.PI / 180; // Convert to radians

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

        // Position the image in content area based on positionH and positionV
        const positionH = cell.content.positionH || 'center';
        const positionV = cell.content.positionV || 'middle';

        let anchorX, anchorY;

        // Horizontal positioning
        switch (positionH) {
            case 'left':
                anchorX = contentX + drawWidth / 2;
                break;
            case 'right':
                anchorX = contentX + contentWidth - drawWidth / 2;
                break;
            case 'center':
            default:
                anchorX = contentX + contentWidth / 2;
                break;
        }

        // Vertical positioning
        switch (positionV) {
            case 'top':
                anchorY = contentY + drawHeight / 2;
                break;
            case 'bottom':
                anchorY = contentY + contentHeight - drawHeight / 2;
                break;
            case 'middle':
            default:
                anchorY = contentY + contentHeight / 2;
                break;
        }

        ctx.save();

        // Move to anchor, rotate, then move back
        ctx.translate(anchorX, anchorY);
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
    static renderImagePlaceholder(ctx, cell) {
        const iconSize = Math.min(cell.bounds.width, cell.bounds.height) * 0.3;
        const iconX = cell.bounds.x + (cell.bounds.width - iconSize) / 2;
        const iconY = cell.bounds.y + (cell.bounds.height - iconSize) / 2;

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
     * Render text content cell (uses SpotTextComponent)
     * @private
     */
    static renderSpotText(ctx, cell, options) {
        // If no text content, show placeholder
        if (!cell.content || !cell.content.text) {
            if (cell.fillColor !== 'transparent') {
                ctx.fillStyle = cell.fillColor;
                ctx.fillRect(cell.bounds.x, cell.bounds.y, cell.bounds.width, cell.bounds.height);
            }
            this.renderTextPlaceholder(ctx, cell);
            return;
        }

        // Create or update SpotTextComponent (reusing existing system)
        if (!cell.textComponent) {
            cell.textComponent = new SpotTextComponent();
            cell.textComponent.setSpotId(cell.id || 0);
        }

        // Sync text component with cell content
        this.syncTextComponent(cell);

        // Render using TextComponent
        cell.textComponent.render(ctx);
    }

    /**
     * Sync SpotTextComponent with cell content
     * @private
     */
    static syncTextComponent(cell) {
        if (!cell.textComponent) return;

        // Set container bounds
        cell.textComponent.setContainer(
            cell.bounds.x,
            cell.bounds.y,
            cell.bounds.width,
            cell.bounds.height
        );

        // Set text content
        cell.textComponent.text = cell.content.text || '';

        // Set color
        cell.textComponent.color = cell.content.color || '#000000';

        // Set alignment
        cell.textComponent.alignH = cell.content.textAlign || 'center';
        cell.textComponent.alignV = 'middle';

        // Set position alignment
        cell.textComponent.positionH = cell.content.positionH || 'center';
        cell.textComponent.positionV = cell.content.positionV || 'middle';

        // Set padding
        const padding = cell.content.padding || 1;
        cell.textComponent.setPadding(padding);

        // Set font size
        cell.textComponent.fontSize = cell.content.fontSize || 'auto';

        // Set font family
        cell.textComponent.fontFamily = cell.content.fontFamily || '"Wix Madefor Display", Arial, sans-serif';

        // Set text styles
        const styles = cell.content.styles || {};
        cell.textComponent.fontWeight = styles.bold ? 'bold' : 'normal';
        cell.textComponent.fontStyle = styles.italic ? 'italic' : 'normal';
        cell.textComponent.underline = styles.underline || false;
        cell.textComponent.highlight = styles.highlight || false;
        cell.textComponent.highlightColor = cell.content.highlightColor || '#ffff00';
    }

    /**
     * Render text placeholder when no content
     * @private
     */
    static renderTextPlaceholder(ctx, cell) {
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        const lineSpacing = Math.min(cell.bounds.height / 4, 20);
        const startY = cell.bounds.y + cell.bounds.height / 3;

        for (let i = 0; i < 3; i++) {
            const y = startY + i * lineSpacing;
            if (y + lineSpacing > cell.bounds.y + cell.bounds.height) break;

            const lineWidth = cell.bounds.width * 0.7 * (i === 2 ? 0.6 : 1); // Last line shorter
            ctx.beginPath();
            ctx.moveTo(cell.bounds.x + 10, y);
            ctx.lineTo(cell.bounds.x + lineWidth, y);
            ctx.stroke();
        }
    }

    /**
     * Render mask content cell (reveals background image)
     * @private
     */
    static renderMask(ctx, cell, options) {
        const backgroundImage = options.backgroundImage;

        // Calculate content area with padding
        const padding = cell.content?.padding || 0;
        const contentX = cell.bounds.x + padding;
        const contentY = cell.bounds.y + padding;
        const contentWidth = cell.bounds.width - (padding * 2);
        const contentHeight = cell.bounds.height - (padding * 2);

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
            const opacity = cell.content?.opacity || 0.5;
            ctx.globalAlpha = opacity;
            ctx.fillStyle = cell.fillColor;
            ctx.fillRect(cell.bounds.x, cell.bounds.y, cell.bounds.width, cell.bounds.height);
            ctx.globalAlpha = 1.0;

            // Add mask icon placeholder
            const iconSize = Math.min(cell.bounds.width, cell.bounds.height) * 0.3;
            const iconX = cell.bounds.x + (cell.bounds.width - iconSize) / 2;
            const iconY = cell.bounds.y + (cell.bounds.height - iconSize) / 2;

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
     * Render cell number badge
     * @private
     */
    static renderCellNumber(ctx, cell) {
        const center = cell.getCenter();
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
        ctx.fillText(cell.id.toString(), center.x, center.y);
    }
}
