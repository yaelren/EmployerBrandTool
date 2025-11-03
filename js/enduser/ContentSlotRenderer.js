/**
 * ContentSlotRenderer.js
 * Sprint 4: Locked Layout Rendering
 *
 * Renders content slots with locked layouts - users cannot manipulate the grid.
 * Features:
 * - Text auto-fit algorithm (binary search for optimal font size)
 * - Image rendering modes (cover/fit/free)
 * - Respects bounding boxes and constraints
 * - Real-time preview updates
 */

class ContentSlotRenderer {
    constructor(canvasManager, presetPageManager) {
        this.canvasManager = canvasManager;
        this.presetPageManager = presetPageManager;
        this.ctx = canvasManager.ctx;
        this.canvas = canvasManager.canvas;

        // Font metrics cache for performance
        this.fontMetricsCache = new Map();
    }

    /**
     * Render locked layout with user content
     * @param {Object} pageData - Complete page data from preset
     * @param {Object} contentData - User-provided content { slotId: value }
     */
    async renderLockedLayout(pageData, contentData) {
        console.log(`🎨 Rendering locked layout for: ${pageData.pageName}`);

        // Apply page state to canvas (background, main text, grid)
        await this.applyPageStateToCanvas(pageData);

        // Render content slots on top
        if (pageData.contentSlots && pageData.contentSlots.length > 0) {
            await this.renderContentSlots(pageData.contentSlots, contentData);
        }

        console.log('✅ Layout rendered');
    }

    /**
     * Apply page state directly to canvas (end-user mode)
     * Renders complete preset design using grid cells from snapshot
     */
    async applyPageStateToCanvas(pageData) {
        const { canvasManager } = this;

        console.log('📋 Applying page state:', {
            hasBackground: !!pageData.background,
            hasMainText: !!pageData.mainText,
            hasGrid: !!pageData.grid,
            hasCanvas: !!pageData.canvas
        });

        // 1. Set canvas dimensions
        if (pageData.canvas) {
            canvasManager.canvas.width = pageData.canvas.width;
            canvasManager.canvas.height = pageData.canvas.height;
            console.log(`📏 Canvas dimensions: ${pageData.canvas.width}x${pageData.canvas.height}`);
        }

        // 2. Apply background
        if (pageData.background) {
            if (pageData.background.imageURL) {
                // Load background image from URL
                const bgImg = await this.loadImage(pageData.background.imageURL);
                canvasManager.backgroundManager.setBackgroundImage(bgImg);
                canvasManager.backgroundManager.setBackgroundFitMode(pageData.background.fitMode || 'fill-canvas');
                console.log('🖼️ Background image loaded and applied');
            } else if (pageData.background.color) {
                canvasManager.backgroundManager.setBackgroundColor(pageData.background.color);
                console.log('🎨 Applied background color:', pageData.background.color);
            }
        }

        // 3. Render background
        canvasManager.backgroundManager.renderBackground(canvasManager.ctx, canvasManager.canvas);

        // 4. Render grid cells from snapshot
        if (pageData.grid?.snapshot?.layout?.cells) {
            const cells = pageData.grid.snapshot.layout.cells;
            console.log(`📦 Rendering ${cells.length} grid cells`);

            // Use CellRenderer to render each cell
            const cellRenderer = new CellRenderer(canvasManager.ctx);

            for (const cell of cells) {
                try {
                    await this.renderCell(cell, cellRenderer, canvasManager);
                } catch (error) {
                    console.warn(`⚠️ Failed to render cell ${cell.id}:`, error);
                }
            }

            console.log('✅ Grid cells rendered');
        }
    }

    /**
     * Render a single grid cell
     */
    async renderCell(cell, cellRenderer, canvasManager) {
        const { bounds, type, content } = cell;

        if (!bounds) return;

        // Render based on cell type
        if (type === 'main-text' && cell.text) {
            // Render main text cell
            this.renderTextCell(cell, canvasManager.ctx);
        } else if (type === 'content' && content) {
            if (content.text) {
                // Render content text cell
                this.renderTextCell(cell, canvasManager.ctx);
            } else if ((content.mediaType === 'image' || content.contentType === 'media') && content.imageURL) {
                // Render image cell (check both mediaType and contentType for compatibility)
                await this.renderImageCell(cell, canvasManager.ctx);
            }
        }
    }

    /**
     * Render a text cell (main-text or content text)
     */
    renderTextCell(cell, ctx) {
        const { bounds, text, content } = cell;
        const displayText = text || content?.text;

        if (!displayText) return;

        ctx.save();

        // Get text styling
        const fontFamily = cell.fontFamily || content?.fontFamily || 'Arial';
        const fontSize = cell.fontSize || content?.fontSize || 16;
        const fontWeight = cell.fontWeight || (content?.styles?.bold ? 'bold' : 'normal');
        const fontStyle = cell.fontStyle || (content?.styles?.italic ? 'italic' : 'normal');
        const color = cell.color || content?.color || '#000000';
        const textAlign = content?.textAlign || cell.alignH || 'left';
        const verticalAlign = content?.positionV || cell.alignV || 'top';

        // Set font
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = color;
        ctx.textAlign = textAlign === 'center' ? 'center' : (textAlign === 'right' ? 'right' : 'left');

        // Handle multiline text
        const lines = displayText.split('\n');
        const lineHeight = fontSize * 1.2;
        const totalHeight = lines.length * lineHeight;

        // Calculate starting Y based on vertical alignment
        let startY = bounds.y;
        if (verticalAlign === 'middle') {
            startY = bounds.y + (bounds.height - totalHeight) / 2;
        } else if (verticalAlign === 'bottom') {
            startY = bounds.y + bounds.height - totalHeight;
        }

        // Calculate X based on horizontal alignment
        let textX = bounds.x;
        if (textAlign === 'center') {
            textX = bounds.x + bounds.width / 2;
        } else if (textAlign === 'right') {
            textX = bounds.x + bounds.width;
        }

        // Render each line
        lines.forEach((line, index) => {
            const lineY = startY + (index + 0.8) * lineHeight;
            ctx.fillText(line, textX, lineY);
        });

        ctx.restore();
    }

    /**
     * Render an image cell
     */
    async renderImageCell(cell, ctx) {
        const { bounds, content } = cell;

        if (!content?.imageURL) return;

        try {
            const img = await this.loadImage(content.imageURL);

            ctx.save();

            // Clip to cell bounds
            ctx.beginPath();
            ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height);
            ctx.clip();

            const fillMode = content.fillMode || 'fit';
            const scale = content.scale || 1.0;
            const positionH = content.positionH || 'center';
            const positionV = content.positionV || 'middle';

            let drawWidth, drawHeight;

            if (fillMode === 'fit') {
                // Fit mode: scale from natural dimensions (can exceed bounds, clipping handles overflow)
                drawWidth = img.width * scale;
                drawHeight = img.height * scale;
            } else if (fillMode === 'fill') {
                // Fill mode: cover entire cell (crop if needed)
                const imgRatio = img.width / img.height;
                const boxRatio = bounds.width / bounds.height;

                if (imgRatio > boxRatio) {
                    // Image wider - fit to height, crop width
                    drawWidth = bounds.height * imgRatio;
                    drawHeight = bounds.height;
                } else {
                    // Image taller - fit to width, crop height
                    drawWidth = bounds.width;
                    drawHeight = bounds.width / imgRatio;
                }
            } else {
                // Stretch mode: fill ignoring aspect ratio
                drawWidth = bounds.width;
                drawHeight = bounds.height;
            }

            // Position the image in cell based on alignment
            let drawX, drawY;

            if (positionH === 'center') {
                drawX = bounds.x + (bounds.width - drawWidth) / 2;
            } else if (positionH === 'right') {
                drawX = bounds.x + bounds.width - drawWidth;
            } else {
                drawX = bounds.x;
            }

            if (positionV === 'middle') {
                drawY = bounds.y + (bounds.height - drawHeight) / 2;
            } else if (positionV === 'bottom') {
                drawY = bounds.y + bounds.height - drawHeight;
            } else {
                drawY = bounds.y;
            }

            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

            ctx.restore();
        } catch (error) {
            console.warn(`⚠️ Failed to load image for cell ${cell.id}:`, error);
        }
    }

    /**
     * Render all content slots with user data
     */
    async renderContentSlots(slots, contentData) {
        for (const slot of slots) {
            const value = contentData[slot.slotId];

            if (!value) {
                // No content provided - render placeholder or skip
                this.renderPlaceholder(slot);
                continue;
            }

            switch (slot.type) {
                case 'text':
                    this.renderTextSlot(slot, value);
                    break;

                case 'image':
                    await this.renderImageSlot(slot, value);
                    break;

                default:
                    console.warn(`⚠️ Unknown slot type: ${slot.type}`);
            }
        }
    }

    /**
     * Render placeholder for empty slot
     */
    renderPlaceholder(slot) {
        const { x, y, width, height } = slot.boundingBox;

        this.ctx.save();

        // Dashed border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.setLineDash([5, 5]);
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);

        // Placeholder text
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(slot.fieldLabel, x + width / 2, y + height / 2);

        this.ctx.restore();
    }

    /**
     * Render text slot with auto-fit algorithm
     */
    renderTextSlot(slot, text) {
        if (!text || !text.trim()) return;

        const { x, y, width, height } = slot.boundingBox;
        const constraints = slot.constraints || {};

        // Text styling from constraints
        const fontFamily = constraints.fontFamily || 'Arial';
        const fontWeight = constraints.fontWeight || 'normal';
        const color = constraints.color || '#000000';
        const align = constraints.align || 'left';
        const verticalAlign = constraints.verticalAlign || 'top';
        const minFontSize = constraints.minFontSize || 12;
        const maxFontSize = constraints.maxFontSize || 72;
        const lineHeight = constraints.lineHeight || 1.2;

        // Find optimal font size using binary search
        const optimalSize = this.findOptimalFontSize(
            text,
            { x, y, width, height },
            { fontFamily, fontWeight, lineHeight, minFontSize, maxFontSize }
        );

        // Render text with optimal size
        this.ctx.save();

        this.ctx.font = `${fontWeight} ${optimalSize}px ${fontFamily}`;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;

        // Split text into lines that fit width
        const lines = this.wrapText(text, width, this.ctx);

        // Calculate total text height
        const totalHeight = lines.length * optimalSize * lineHeight;

        // Calculate starting Y based on vertical alignment
        let startY = y;
        if (verticalAlign === 'middle') {
            startY = y + (height - totalHeight) / 2;
        } else if (verticalAlign === 'bottom') {
            startY = y + height - totalHeight;
        }

        // Calculate X based on horizontal alignment
        let textX = x;
        if (align === 'center') {
            textX = x + width / 2;
        } else if (align === 'right') {
            textX = x + width;
        }

        // Render each line
        lines.forEach((line, index) => {
            const lineY = startY + (index + 0.8) * optimalSize * lineHeight;
            this.ctx.fillText(line, textX, lineY);
        });

        this.ctx.restore();
    }

    /**
     * Find optimal font size using binary search
     * Ensures text fits within bounding box
     */
    findOptimalFontSize(text, boundingBox, styling) {
        const { width, height } = boundingBox;
        const { fontFamily, fontWeight, lineHeight, minFontSize, maxFontSize } = styling;

        let low = minFontSize;
        let high = maxFontSize;
        let bestSize = minFontSize;

        // Binary search for largest font size that fits
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);

            if (this.textFitsInBox(text, width, height, mid, fontFamily, fontWeight, lineHeight)) {
                bestSize = mid;
                low = mid + 1; // Try larger
            } else {
                high = mid - 1; // Try smaller
            }
        }

        return bestSize;
    }

    /**
     * Check if text fits in bounding box at given font size
     */
    textFitsInBox(text, boxWidth, boxHeight, fontSize, fontFamily, fontWeight, lineHeight) {
        const cacheKey = `${text}-${boxWidth}-${fontSize}-${fontFamily}`;

        if (this.fontMetricsCache.has(cacheKey)) {
            return this.fontMetricsCache.get(cacheKey);
        }

        this.ctx.save();
        this.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

        const lines = this.wrapText(text, boxWidth, this.ctx);
        const totalHeight = lines.length * fontSize * lineHeight;

        this.ctx.restore();

        const fits = totalHeight <= boxHeight;
        this.fontMetricsCache.set(cacheKey, fits);

        return fits;
    }

    /**
     * Wrap text into lines that fit within maxWidth
     */
    wrapText(text, maxWidth, ctx) {
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

        return lines;
    }

    /**
     * Render image slot with cover/fit/free modes
     */
    async renderImageSlot(slot, imageDataURL) {
        const { x, y, width, height } = slot.boundingBox;
        const constraints = slot.constraints || {};
        const mode = constraints.imageMode || 'cover'; // 'cover', 'fit', 'free'

        // Load image
        const img = await this.loadImage(imageDataURL);

        this.ctx.save();

        // Clip to bounding box
        this.ctx.beginPath();
        this.ctx.rect(x, y, width, height);
        this.ctx.clip();

        switch (mode) {
            case 'cover':
                this.drawImageCover(img, { x, y, width, height });
                break;

            case 'fit':
                this.drawImageFit(img, { x, y, width, height });
                break;

            case 'free':
                this.drawImageFree(img, { x, y, width, height }, constraints);
                break;

            default:
                console.warn(`⚠️ Unknown image mode: ${mode}, using cover`);
                this.drawImageCover(img, { x, y, width, height });
        }

        this.ctx.restore();
    }

    /**
     * Draw image in cover mode (crop to fill, maintain aspect ratio)
     */
    drawImageCover(img, box) {
        const { x, y, width, height } = box;
        const imgRatio = img.width / img.height;
        const boxRatio = width / height;

        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = img.width;
        let sourceHeight = img.height;

        if (imgRatio > boxRatio) {
            // Image wider than box - crop sides
            sourceWidth = img.height * boxRatio;
            sourceX = (img.width - sourceWidth) / 2;
        } else {
            // Image taller than box - crop top/bottom
            sourceHeight = img.width / boxRatio;
            sourceY = (img.height - sourceHeight) / 2;
        }

        this.ctx.drawImage(
            img,
            sourceX, sourceY, sourceWidth, sourceHeight,
            x, y, width, height
        );
    }

    /**
     * Draw image in fit mode (scale to fit, maintain aspect ratio, may show empty space)
     */
    drawImageFit(img, box) {
        const { x, y, width, height } = box;
        const imgRatio = img.width / img.height;
        const boxRatio = width / height;

        let drawWidth = width;
        let drawHeight = height;
        let drawX = x;
        let drawY = y;

        if (imgRatio > boxRatio) {
            // Image wider - fit to width
            drawHeight = width / imgRatio;
            drawY = y + (height - drawHeight) / 2;
        } else {
            // Image taller - fit to height
            drawWidth = height * imgRatio;
            drawX = x + (width - drawWidth) / 2;
        }

        this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    }

    /**
     * Draw image in free mode (scale and position freely based on constraints)
     */
    drawImageFree(img, box, constraints) {
        const { x, y, width, height } = box;
        const scale = constraints.imageScale || 1.0;
        const positionH = constraints.positionH || 'center'; // 'left', 'center', 'right'
        const positionV = constraints.positionV || 'center'; // 'top', 'center', 'bottom'

        // Calculate scaled dimensions
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        // Calculate position based on alignment
        let drawX = x;
        let drawY = y;

        if (positionH === 'center') {
            drawX = x + (width - scaledWidth) / 2;
        } else if (positionH === 'right') {
            drawX = x + width - scaledWidth;
        }

        if (positionV === 'center') {
            drawY = y + (height - scaledHeight) / 2;
        } else if (positionV === 'bottom') {
            drawY = y + height - scaledHeight;
        }

        this.ctx.drawImage(img, drawX, drawY, scaledWidth, scaledHeight);
    }

    /**
     * Load image from data URL
     * @returns {Promise<HTMLImageElement>}
     */
    loadImage(dataURL) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = dataURL;
        });
    }

    /**
     * Clear font metrics cache (call when font changes)
     */
    clearCache() {
        this.fontMetricsCache.clear();
    }
}
