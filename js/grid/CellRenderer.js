/**
 * CellRenderer.js - Separated rendering logic for grid cells
 * Part of the Unified Grid System
 *
 * Handles rendering for all cell types: MainTextCell and ContentCell
 * Uses static methods for stateless rendering
 */

class CellRenderer {
    /**
     * ✅ NEW: Scale bounding box from export coordinates to display coordinates
     * Used for tight bounds constraints on editable cells
     * @param {Object} exportBounds - Bounding box in export coordinates {x, y, width, height}
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @returns {Object} Bounding box in display coordinates
     */
    static scaleExportToDisplay(exportBounds, canvas) {
        if (!exportBounds || !canvas) return null;

        // Get canvas dimensions
        const displayWidth = canvas.width;
        const displayHeight = canvas.height;

        // Get export resolution from Chatooly
        const exportWidth = window.Chatooly?.canvasResizer?.exportWidth || displayWidth;
        const exportHeight = window.Chatooly?.canvasResizer?.exportHeight || displayHeight;

        // Calculate scale factors (export → display)
        const scaleX = displayWidth / exportWidth;
        const scaleY = displayHeight / exportHeight;

        // Scale bounds
        return {
            x: exportBounds.x * scaleX,
            y: exportBounds.y * scaleY,
            width: exportBounds.width * scaleX,
            height: exportBounds.height * scaleY
        };
    }

    /**
     * ✅ NEW: Get rendering bounds for cell
     * Returns tight boundingBox for editable cells, otherwise cell.bounds
     * @param {GridCell} cell - Cell to get bounds for
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {boolean} isEditableCell - Whether this is an editable cell
     * @returns {Object} Bounds to use for rendering {x, y, width, height}
     */
    static getRenderBounds(cell, canvas, isEditableCell = false) {
        // For editable cells, use tight boundingBox if available
        if (isEditableCell) {
            const tightBounds = this.scaleExportToDisplay(cell.slotConfig.boundingBox, canvas);
            if (tightBounds) {
                return tightBounds;
            }
        }

        // Default: use cell.bounds (grid cell bounds)
        return cell.bounds;
    }

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

        // ✅ Skip rendering if cell is marked as invisible (for hide-then-overlay in end-user mode)
        if (cell.visible === false) {
            return;
        }

        if (cell.type === 'main-text') {
            this.renderTextCell(ctx, cell, options);
        } else if (cell.type === 'content') {
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

        // ✅ NEW: Check if this is an editable cell that should use tight bounds
        const isEditableCell = cell.editable && cell.slotConfig?.boundingBox;

        // ✅ NEW: Get rendering bounds (tight bounds for editable cells)
        const renderBounds = this.getRenderBounds(cell, ctx.canvas, isEditableCell);

        // ✅ FIX: For editable cells, calculate optimal single-line font size
        if (isEditableCell) {
            // Get constraints from slotConfig
            const constraints = cell.slotConfig.constraints || {};
            const minFontSize = constraints.minFontSize || 8;
            const maxFontSize = constraints.maxFontSize || 120;

            // Calculate optimal font size for single-line text within bounds
            let optimalFontSize = minFontSize;
            const availableWidth = renderBounds.width;

            // Binary search for optimal font size
            let testFontSize = maxFontSize;
            while (testFontSize >= minFontSize) {
                ctx.font = `${testFontSize}px ${cell.textComponent.fontFamily}`;
                const metrics = ctx.measureText(cell.text);

                if (metrics.width <= availableWidth) {
                    optimalFontSize = testFontSize;
                    break;
                }

                testFontSize -= 2; // Step down by 2px
            }

            // Update the cell's font size and set context font
            cell.textComponent.fontSize = optimalFontSize;
            ctx.font = `${optimalFontSize}px ${cell.textComponent.fontFamily}`;
        } else {
            // Non-editable cells: use normal font
            ctx.font = cell.getFontString();
        }

        // Common rendering code for all cells
        ctx.fillStyle = cell.textComponent.color;
        const alignment = cell.getAlignment();
        ctx.textAlign = alignment;
        ctx.textBaseline = 'alphabetic'; // Use baseline alignment like main branch

        // Single line text rendering (for non-editable cells)
        const positioning = TextPositioning.getTextPositioning(
            renderBounds,
            cell.textComponent,
            cell.text,
            alignment,
            cell.textComponent.fontSize
        );

        // Draw highlight if enabled
        if (cell.textComponent.highlight) {
            ctx.fillStyle = cell.textComponent.highlightColor;
            ctx.fillRect(renderBounds.x, renderBounds.y, renderBounds.width, renderBounds.height);
            ctx.fillStyle = cell.textComponent.color;
        }

        // Draw text at baseline position
        ctx.fillText(cell.text, positioning.textX, positioning.baselineY);

        // Draw underline if enabled
        if (cell.textComponent.underline) {
            const textWidth = ctx.measureText(cell.text).width;

            const underlineX = TextPositioning.calculateUnderlineX(positioning.textX, alignment, textWidth);

            ctx.strokeStyle = cell.textComponent.color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(underlineX, positioning.underlineY);
            ctx.lineTo(underlineX + textWidth, positioning.underlineY);
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
            case 'media':
                this.renderImage(ctx, cell, options);
                break;
            case 'text':
                this.renderSpotText(ctx, cell, options);
                break;
            case 'fill':
                this.renderFill(ctx, cell, options);
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
     * Render fill content cell (solid color background)
     * @private
     */
    static renderFill(ctx, cell, options) {
        // Fill cells are rendered by their background method in app.js
        // This method is here for completeness but doesn't need to do anything
        // since the background is already rendered by cell.renderBackground()
    }

    /**
     * Render image/media content cell
     * @private
     */
    static renderImage(ctx, cell, options) {
        // If no media content, show placeholder
        if (!cell.content || !cell.content.media) {
            if (cell.fillColor !== 'transparent') {
                ctx.fillStyle = cell.fillColor;
                ctx.fillRect(cell.bounds.x, cell.bounds.y, cell.bounds.width, cell.bounds.height);
            }
            this.renderImagePlaceholder(ctx, cell);
            return;
        }

        // ✅ NEW: Determine if cell has user content (for editable cells)
        const hasUserContent = cell.editable && 
            cell.content.mediaUrl && 
            cell.content.mediaUrl !== cell.slotConfig?.defaultContent;

        // ✅ NEW: Get rendering bounds (tight bounds for editable cells with user content)
        const renderBounds = this.getRenderBounds(cell, ctx.canvas, hasUserContent);

        // Calculate content area with padding
        const padding = cell.content.padding || 0;
        const contentX = renderBounds.x + padding;
        const contentY = renderBounds.y + padding;
        const contentWidth = renderBounds.width - (padding * 2);
        const contentHeight = renderBounds.height - (padding * 2);

        if (contentWidth <= 0 || contentHeight <= 0) return;

        const media = cell.content.media;
        const scale = cell.content.scale || 1;
        const rotation = (cell.content.rotation || 0) * Math.PI / 180; // Convert to radians
        const fillMode = cell.content.fillMode || 'fit';

        // Get media dimensions
        let mediaWidth, mediaHeight;
        if (media instanceof HTMLImageElement) {
            // Use naturalWidth/naturalHeight for actual image dimensions (not styled size)
            mediaWidth = media.naturalWidth || media.width;
            mediaHeight = media.naturalHeight || media.height;

            // Debug GIF rendering
            if (cell.content.mediaType === 'gif' && Math.random() < 0.02) {
                console.log('🎨 CellRenderer drawing GIF:', {
                    naturalWidth: media.naturalWidth,
                    naturalHeight: media.naturalHeight,
                    styledWidth: media.width,
                    styledHeight: media.height,
                    usingWidth: mediaWidth,
                    usingHeight: mediaHeight
                });
            }
        } else if (media instanceof HTMLVideoElement) {
            mediaWidth = media.videoWidth;
            mediaHeight = media.videoHeight;
        } else if (media instanceof HTMLCanvasElement) {
            // Handle canvas elements (including Lottie animations)
            mediaWidth = media.width;
            mediaHeight = media.height;
        } else {
            // Fallback for other media types
            mediaWidth = contentWidth;
            mediaHeight = contentHeight;
        }

        // Calculate media dimensions based on fill mode
        const mediaAspect = mediaWidth / mediaHeight;
        const contentAspect = contentWidth / contentHeight;

        let drawWidth, drawHeight;
        
        switch (fillMode) {
            case 'fill':
                // Fill: Cover entire spot (crop if needed, respect padding)
                // Always fill the content area, cropping if necessary
                if (mediaAspect > contentAspect) {
                    // Media is wider - fit to height, crop width
                    drawWidth = contentHeight * mediaAspect;
                    drawHeight = contentHeight;
                } else {
                    // Media is taller - fit to width, crop height
                    drawWidth = contentWidth;
                    drawHeight = contentWidth / mediaAspect;
                }
                break;
                
            case 'stretch':
                // Stretch: Fill spot ignoring aspect ratio (respect padding)
                drawWidth = contentWidth;
                drawHeight = contentHeight;
                break;
                
            case 'fit':
            default:
                // Free: Maintain aspect ratio, fit within spot (scale can exceed boundaries)
                // Cell-relative scaling: scale is relative to cell dimensions
                if (mediaAspect > contentAspect) {
                    // Media is wider than content area
                    drawWidth = contentWidth * scale;
                    drawHeight = (contentWidth / mediaAspect) * scale;
                } else {
                    // Media is taller than content area
                    drawWidth = (contentHeight * mediaAspect) * scale;
                    drawHeight = contentHeight * scale;
                }
                break;
        }

        // Position the media in content area based on positionH and positionV
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

        // For fill and stretch modes, clip to content area (respects padding)
        if (fillMode === 'fill' || fillMode === 'stretch') {
            ctx.beginPath();
            ctx.rect(contentX, contentY, contentWidth, contentHeight);
            ctx.clip();
        }

        // Move to anchor, rotate, then move back
        ctx.translate(anchorX, anchorY);
        ctx.rotate(rotation);
        ctx.translate(-drawWidth / 2, -drawHeight / 2);

        // Draw the media
        if (media instanceof HTMLImageElement) {
            // For GIFs, force canvas to use latest frame by ensuring image is from DOM
            if (cell.content.mediaType === 'gif') {
                // The image element must be in DOM and visible for animation to work
                // Find the actual DOM element (should be the visible one in bottom-right)
                const domImage = media.parentNode ? media : document.querySelector(`img[src="${media.src}"]`);
                if (domImage) {
                    ctx.drawImage(domImage, 0, 0, drawWidth, drawHeight);
                } else {
                    ctx.drawImage(media, 0, 0, drawWidth, drawHeight);
                }
            } else {
                ctx.drawImage(media, 0, 0, drawWidth, drawHeight);
            }
        } else if (media instanceof HTMLVideoElement) {
            // For videos, we need to handle the current frame
            try {
                // Check if video is ready to be drawn
                if (media.readyState >= HTMLMediaElement.HAVE_METADATA) {
                    ctx.drawImage(media, 0, 0, drawWidth, drawHeight);
                    
                    // // Debug: Log video state occasionally
                    // if (Math.random() < 0.001) { // Very infrequent logging
                    //     console.log('Video rendering:', {
                    //         readyState: media.readyState,
                    //         paused: media.paused,
                    //         currentTime: media.currentTime,
                    //         duration: media.duration,
                    //         videoWidth: media.videoWidth,
                    //         videoHeight: media.videoHeight
                    //     });
                    // }
                } else {
                    // Video not ready, draw placeholder
                    this.renderVideoPlaceholder(ctx, 0, 0, drawWidth, drawHeight);
                }
            } catch (error) {
                // If video isn't ready, draw a placeholder
                console.warn('Video rendering error:', error);
                this.renderVideoPlaceholder(ctx, 0, 0, drawWidth, drawHeight);
            }
        } else if (media instanceof HTMLCanvasElement) {
            // Handle canvas elements (including Lottie animations)
            ctx.drawImage(media, 0, 0, drawWidth, drawHeight);
        }

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
     * Render video placeholder when video isn't ready
     * @private
     */
    static renderVideoPlaceholder(ctx, x, y, width, height) {
        // Draw a play button icon
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const iconSize = Math.min(width, height) * 0.3;

        ctx.fillStyle = '#6495ED';
        ctx.beginPath();
        ctx.moveTo(centerX - iconSize/3, centerY - iconSize/2);
        ctx.lineTo(centerX - iconSize/3, centerY + iconSize/2);
        ctx.lineTo(centerX + iconSize/2, centerY);
        ctx.closePath();
        ctx.fill();
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

        // ✅ FIX: For editable cells with user content, use tight boundingBox from slotConfig
        const hasUserContent = cell.editable && cell.content.text &&
            cell.content.text !== cell.slotConfig?.defaultContent;

        let containerBounds = cell.bounds;

        if (hasUserContent && cell.slotConfig?.boundingBox) {
            // Get canvas from window context (available during rendering)
            const canvas = document.getElementById('chatooly-canvas');
            if (canvas) {
                // Scale tight bounds from export to display coordinates
                const tightBounds = this.scaleExportToDisplay(cell.slotConfig.boundingBox, canvas);
                if (tightBounds) {
                    containerBounds = tightBounds;
                    console.log(`📏 Using tight bounds for editable cell ${cell.id}:`, tightBounds);
                }
            }
        }

        // Set container bounds (tight bounds for editable cells, regular bounds otherwise)
        cell.textComponent.setContainer(
            containerBounds.x,
            containerBounds.y,
            containerBounds.width,
            containerBounds.height
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

        // Set alignment mode: CONTENT CELLS align to text box (longest line width)
        cell.textComponent.alignToTextBox = true;

        // Set padding
        const padding = cell.content.padding || 1;
        cell.textComponent.setPadding(padding);

        // ✅ FIX: For editable cells, respect min/max font constraints from slotConfig
        if (hasUserContent && cell.slotConfig?.constraints) {
            const constraints = cell.slotConfig.constraints;

            // Store min/max constraints in textComponent for auto-sizing
            cell.textComponent.minFontSize = constraints.minFontSize || 8;
            cell.textComponent.maxFontSize = constraints.maxFontSize || 120;

            console.log(`🎯 Applied font constraints for cell ${cell.id}: min=${cell.textComponent.minFontSize}, max=${cell.textComponent.maxFontSize}`);
        }

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
