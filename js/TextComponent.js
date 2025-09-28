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

        // Typography settings
        this.useTypographyHeight = true; // Set to true to enable FontMetrics-based measurements

        /*
         * 🦆 CURRENT STATE SUMMARY:
         *
         * When useTypographyHeight = true:
         * 1. RENDERING: Text draws with textBaseline='alphabetic' at calculated baseline position
         * 2. BOUNDS: Calculated to show visual text area (capHeight for caps, xHeight for lowercase)
         * 3. POSITIONING: lineY represents where visual TOP of text should appear
         *
         * When useTypographyHeight = false:
         * 1. RENDERING: Text draws with textBaseline='top' at lineY position
         * 2. BOUNDS: Uses full fontSize height
         * 3. POSITIONING: lineY represents where font box top appears
         */
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
     * Get font metrics using FontMetrics library (no caching)
     * @param {number} fontSize - Font size in pixels
     * @returns {Object} Font metrics object
     */
    getFontMetrics(fontSize = null) {
        const size = fontSize || (this.fontSize === 'auto' ? 48 : this.fontSize);

        try {
            if (typeof window !== 'undefined' && window.FontMetrics) {
                const metrics = window.FontMetrics({
                    fontFamily: this.fontFamily,
                    fontSize: size,
                    fontWeight: this.fontWeight,
                    fontStyle: this.fontStyle,
                    origin: 'baseline'  // Use baseline origin for reliable ratios
                });

                // Convert normalized values to actual pixels
                // FontMetrics baseline origin returns positive fractional values
                const calculatedMetrics = {
                    fontSize: size,
                    xHeight: Math.abs(metrics.xHeight * size),      // Distance from baseline up to x-height
                    capHeight: Math.abs(metrics.capHeight * size),  // Distance from baseline up to cap-height
                    ascent: Math.abs(metrics.ascent * size),        // Distance from baseline up to font top
                    descent: Math.abs(metrics.descent * size),      // Distance from baseline down to font bottom
                    baseline: 0, // We're using baseline as reference
                    lineHeight: size
                };
                return calculatedMetrics;
            } else {
                console.error('FontMetrics library not available');
                return null;
            }
        } catch (error) {
            console.error('FontMetrics measurement failed:', error);
            return null;
        }
    }


    /**
     * Check if text contains capital letters (Unicode-aware)
     * @param {string} text - Text to check
     * @returns {boolean} True if text contains capitals
     */
    hasCapitalLetters(text) {
        return /\p{Lu}/u.test(text);
    }

    /**
     * Get line height for text rendering (typography-aware or standard)
     * @param {string} line - Text line to measure
     * @param {number} fontSize - Font size in pixels
     * @returns {number} Line height to use for both positioning and bounds
     */
    getLineHeight(line, fontSize) {
        var lineHeight = fontSize
        if (!this.useTypographyHeight) {
            return lineHeight; // Standard behavior
        }

        const metrics = this.getFontMetrics(fontSize);
        if (!metrics) {
            return lineHeight; // Fallback to standard if FontMetrics fails
        }

        // Use cap-height if line has capitals, otherwise x-height
        lineHeight = this.hasCapitalLetters(line) ? metrics.capHeight : metrics.xHeight;
        return lineHeight;
       

    }

    /**
     * Debug method to show text bounds comparison
     * @param {number} fontSize - Font size to test
     */
    debugTextBounds(fontSize = null) {
        const size = fontSize || this.fontSize;
        console.log('🔧 DEBUG TEXT BOUNDS:');
        console.log('  Text:', this.text);
        console.log('  Font Size:', size);
        console.log('  useTypographyHeight:', this.useTypographyHeight);

        if (this.useTypographyHeight) {
            const metrics = this.getFontMetrics(size);
            if (metrics) {
                console.log('  Font Metrics:', {
                    xHeight: metrics.xHeight,
                    capHeight: metrics.capHeight,
                    ascent: metrics.ascent,
                    descent: metrics.descent
                });
            } else {
                console.log('  Font Metrics: NULL (FontMetrics not available)');
            }

            console.log('  Available Height (typography):', this.getAvailableHeight());
            console.log('  Available Height (basic):', this.containerHeight - this.paddingTop - this.paddingBottom);
            console.log('  Has capitals:', this.hasCapitalLetters(this.text));
        } else {
            console.log('  Available Height (standard):', this.getAvailableHeight());
        }
    }

    /**
     * 🎯 BOUNDS CALCULATION - Used by debug visualization and spot detection
     * Get text bounds for each line (single source of truth)
     * @param {CanvasRenderingContext2D} ctx - Canvas context for measurement
     * @returns {Array} Array of text bounds objects
     */
    getTextBounds(ctx) {
        if (!this.text || !this.text.trim()) {
            return [];
        }

        ctx.save();

        // Get font size
        let fontSize = this.fontSize;
        if (fontSize === 'auto') {
            fontSize = this.calculateAutoFontSize(ctx);
        }

        // Set font for measurement
        ctx.font = this.getFontString(fontSize);

        // Get text lines
        const availableWidth = this.getAvailableWidth();
        const lines = this.wrapTextToLines(ctx, this.text, availableWidth, fontSize);

        // Calculate total text height (use typography-aware heights if enabled)
        let totalHeight = 0;
        if (this.useTypographyHeight) {
            // Calculate actual height based on each line's typography
            lines.forEach((line, index) => {
                if (line.trim()) {
                    totalHeight += this.getLineHeight(line, fontSize);
                    if (index < lines.length - 1) {
                        totalHeight += this.lineSpacing;
                    }
                }
            });
        } else {
            // Standard calculation
            const lineHeight = fontSize;
            totalHeight = lines.length * lineHeight + (lines.length - 1) * this.lineSpacing;
        }

        const position = this.calculateTextPosition(totalHeight);

        // Create bounds for each line
        const textBounds = [];
        let currentY = position.y;

        lines.forEach((line, index) => {
            if (!line.trim()) return;

            // Get line height based on typography settings
            const lineHeight = this.getLineHeight(line, fontSize);
            const lineY = currentY;
            const lineAlign = this.getLineAlignment ? this.getLineAlignment(index) : this.alignH;

            // Calculate line X based on alignment
            let lineX;
            const contentX = this.containerX + this.paddingLeft;

            switch (lineAlign) {
                case 'left':
                    lineX = contentX;
                    break;
                case 'right':
                    lineX = contentX + availableWidth;
                    break;
                case 'center':
                default:
                    lineX = contentX + availableWidth / 2;
                    break;
            }

            // Measure the line
            const metrics = ctx.measureText(line);
            const tightWidth = this.getTightTextWidth(ctx, line);

            // Calculate actual bounds based on alignment
            let boundX;
            switch (lineAlign) {
                case 'left':
                    boundX = lineX;
                    break;
                case 'right':
                    boundX = lineX - tightWidth;
                    break;
                case 'center':
                default:
                    boundX = lineX - tightWidth / 2;
                    break;
            }

            // Calculate typography-aligned bounds
            let boundsY = lineY;
            let boundsHeight = lineHeight;

            if (this.useTypographyHeight && lineHeight !== fontSize) {
                // Get font metrics for typography positioning
                const fontMetrics = this.getFontMetrics(fontSize);
                if (fontMetrics) {
                    const hasCapitals = this.hasCapitalLetters(line);

                    // Get correct FontMetrics with baseline origin
                    const correctMetrics = window.FontMetrics({
                        fontFamily: this.fontFamily,
                        fontSize: fontSize,
                        fontWeight: this.fontWeight,
                        fontStyle: this.fontStyle,
                        origin: 'baseline'
                    });

                    // Calculate correct pixel values
                    const correctCapHeight = Math.abs(correctMetrics.capHeight * fontSize);
                    const correctXHeight = Math.abs(correctMetrics.xHeight * fontSize);


                    // BACK TO WORKING APPROACH: Use baseline position directly (lineY)
                    // This positioned correctly, just need to adjust the bounds to wrap letters properly

                    // Get actual text measurements from Canvas
                    const metrics = ctx.measureText(line);
                    const actualAscent = metrics.actualBoundingBoxAscent || correctCapHeight;

                    // Use baseline position with typography-aware heights
                    boundsY = lineY;  // Use baseline directly (this was closest to correct)

                    if (hasCapitals) {
                        boundsHeight = correctCapHeight;  // Typography-aware height for capitals
                    } else {
                        boundsHeight = correctXHeight;    // Typography-aware height for lowercase
                    }

                }
            }

            textBounds.push({
                x: boundX,
                y: boundsY,
                width: tightWidth,
                height: boundsHeight,
                text: line,
                line: line
            });

            // Move to next line position
            currentY += lineHeight + this.lineSpacing;
        });

        ctx.restore();
        return textBounds;
    }

    /**
     * Get typography-aware available height (enhanced version of getAvailableHeight)
     * This creates a tighter bounding box based on actual typographic metrics
     * @param {string} text - Text to analyze for capital letters (optional, uses this.text if not provided)
     * @param {number} fontSize - Font size to use for calculation (optional)
     * @returns {number} Typography-aware available height in pixels
     */
    getTypographyAwareAvailableHeight(text = null, fontSize = null) {
        const basicHeight = this.containerHeight - this.paddingTop - this.paddingBottom;

        // If typography height is not enabled, return basic calculation
        if (!this.useTypographyHeight) {
            return basicHeight;
        }

        // Use provided text or fall back to component text
        const textToAnalyze = text || this.text;
        if (!textToAnalyze || !textToAnalyze.trim()) {
            return basicHeight;
        }

        // If fontSize is auto, we need the actual calculated size, not a default
        let effectiveFontSize = fontSize;
        if (!effectiveFontSize) {
            if (this.fontSize === 'auto') {
                // Get the actual calculated font size
                const canvas = document.querySelector('canvas');
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    effectiveFontSize = this.calculateAutoFontSize(ctx);
                } else {
                    effectiveFontSize = 48; // Last resort fallback
                }
            } else {
                effectiveFontSize = this.fontSize;
            }
        }

        const metrics = this.getFontMetrics(effectiveFontSize);
        if (!metrics) {
            console.warn('FontMetrics not available, using basic height');
            return basicHeight;
        }

        // For typography-aware mode, we want to calculate how much vertical space
        // the text actually needs based on its typographic characteristics

        // Split text into lines to analyze each line separately
        const lines = textToAnalyze.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
            return basicHeight;
        }

        // Calculate the total height needed for all lines
        let totalTypographicHeight = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Each line gets its appropriate height based on its content
            if (this.hasCapitalLetters(line)) {
                // Lines with capitals need cap-height
                totalTypographicHeight += metrics.capHeight;
            } else {
                // Lowercase-only lines need only x-height
                totalTypographicHeight += metrics.xHeight;
            }

            // Add line spacing between lines (but not after the last line)
            if (i < lines.length - 1) {
                totalTypographicHeight += this.lineSpacing;
            }
        }

        // The available height should be the minimum of:
        // 1. The basic container height (respecting container bounds)
        // 2. The calculated typographic height (for tighter bounds)
        // This ensures we don't exceed container but can show tighter bounds when appropriate

        // For now, return the basic height to maintain compatibility
        // The tight bounds should be shown via debug visualization
        return basicHeight;
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
     * Get tight text width using actualBoundingBox properties
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} text - Text to measure
     * @returns {number} Tight width in pixels
     */
    getTightTextWidth(ctx, text) {
        const metrics = ctx.measureText(text);
        
        // Use actualBoundingBox if available (modern browsers)
        if (metrics.actualBoundingBoxLeft !== undefined && 
            metrics.actualBoundingBoxRight !== undefined) {
            const tightWidth = metrics.actualBoundingBoxRight; // Distance from origin to right edge
            return tightWidth;
        }
        
        // Fallback to standard width
        return metrics.width;
    }
    
    /**
     * Get available width for text (container width minus padding)
     * @param {CanvasRenderingContext2D} ctx - Canvas context for tight width calculation
     * @param {string} text - Text to measure for tight width (optional)
     * @returns {number} Available width in pixels
     */
    getAvailableWidth(ctx = null, text = null) {
        const containerWidth = this.containerWidth - this.paddingLeft - this.paddingRight;
        
        // If context and text provided, return tight text width
        if (ctx && text && text.trim()) {
            const tightWidth = this.getTightTextWidth(ctx, text);
            return Math.min(containerWidth, tightWidth);
        }
        
        // Default: return container width
        return containerWidth;
    }
    
    /**
     * Get available height for text (container height minus padding)
     * @returns {number} Available height in pixels
     */
    getAvailableHeight() {
        return this.getTypographyAwareAvailableHeight();
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
        // For font size calculation, always use full container height, not typography-aware height
        const availableHeight = this.containerHeight - this.paddingTop - this.paddingBottom;
        
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
    calculateTextPosition(totalHeight) {
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
     * 🎨 TEXT RENDERING - Actually draws the text on canvas
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

        // Use baseline alignment for typography-aware rendering
        if (this.useTypographyHeight) {
            ctx.textBaseline = 'alphabetic'; // Align to baseline
        } else {
            ctx.textBaseline = 'top'; // Standard behavior
        }
        
        // Get text lines
        const lines = this.wrapTextToLines(ctx, this.text, availableWidth, fontSize);

        // Calculate total text height (use typography-aware heights if enabled)
        let totalHeight = 0;
        if (this.useTypographyHeight) {
            // Calculate actual height based on each line's typography
            lines.forEach((line, index) => {
                if (line.trim()) {
                    totalHeight += this.getLineHeight(line, fontSize);
                    if (index < lines.length - 1) {
                        totalHeight += this.lineSpacing;
                    }
                }
            });
        } else {
            // Standard calculation
            const lineHeight = fontSize;
            totalHeight = lines.length * lineHeight + (lines.length - 1) * this.lineSpacing;
        }
        
        // Calculate starting position
        const position = this.calculateTextPosition(totalHeight);
        
        // Set text alignment for canvas
        ctx.textAlign = this.alignH;
        
        // Render each line
        let currentY = position.y;
        lines.forEach((line, index) => {
            if (!line.trim()) return;

            const lineHeight = this.useTypographyHeight ? this.getLineHeight(line, fontSize) : fontSize;
            const lineY = currentY;
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
            
            // Calculate rendering position based on baseline alignment
            let renderY = lineY;
            if (this.useTypographyHeight) {
                const fontMetrics = this.getFontMetrics(fontSize);
                if (fontMetrics) {
                    const hasCapitals = this.hasCapitalLetters(line);
                    if (hasCapitals) {
                        // For baseline alignment: baseline = lineY + capHeight
                        renderY = lineY + fontMetrics.capHeight;
                    } else {
                        // For baseline alignment: baseline = lineY + xHeight
                        renderY = lineY + fontMetrics.xHeight;
                    }
                }
            } else {
                // Standard mode: already using lineY with textBaseline='top'
                renderY = lineY;
            }

            // Draw the text (at baseline if typography mode, at top if standard)
            ctx.fillText(line, lineX, renderY);
            
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

            // Move to next line position
            currentY += lineHeight + this.lineSpacing;
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

        // Use baseline alignment for typography-aware rendering
        if (this.useTypographyHeight) {
            ctx.textBaseline = 'alphabetic'; // Align to baseline
        } else {
            ctx.textBaseline = 'top'; // Standard behavior
        }
        
        // Get text lines
        const lines = this.wrapTextToLines(ctx, this.text, availableWidth, fontSize);

        // Calculate total text height (use typography-aware heights if enabled)
        let totalHeight = 0;
        if (this.useTypographyHeight) {
            // Calculate actual height based on each line's typography
            lines.forEach((line, index) => {
                if (line.trim()) {
                    totalHeight += this.getLineHeight(line, fontSize);
                    if (index < lines.length - 1) {
                        totalHeight += this.lineSpacing;
                    }
                }
            });
        } else {
            // Standard calculation
            const lineHeight = fontSize;
            totalHeight = lines.length * lineHeight + (lines.length - 1) * this.lineSpacing;
        }
        
        // Calculate starting position
        const position = this.calculateTextPosition(totalHeight);
        
        // Render each line with its own alignment
        let currentY = position.y;
        lines.forEach((line, index) => {
            if (!line.trim()) return;

            const lineHeight = this.useTypographyHeight ? this.getLineHeight(line, fontSize) : fontSize;
            const lineY = currentY;
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
            
            // Calculate rendering position based on baseline alignment
            let renderY = lineY;
            if (this.useTypographyHeight) {
                const fontMetrics = this.getFontMetrics(fontSize);
                if (fontMetrics) {
                    const hasCapitals = this.hasCapitalLetters(line);
                    if (hasCapitals) {
                        // For baseline alignment: baseline = lineY + capHeight
                        renderY = lineY + fontMetrics.capHeight;
                    } else {
                        // For baseline alignment: baseline = lineY + xHeight
                        renderY = lineY + fontMetrics.xHeight;
                    }
                }
            } else {
                // Standard mode: already using lineY with textBaseline='top'
                renderY = lineY;
            }

            // Draw the text (at baseline if typography mode, at top if standard)
            ctx.fillText(line, lineX, renderY);
            
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

            // Move to next line position
            currentY += lineHeight + this.lineSpacing;
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