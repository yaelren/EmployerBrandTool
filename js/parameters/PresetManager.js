/**
 * PresetManager.js - Core preset save/load system
 * Handles serialization and deserialization of complete canvas states
 */

class PresetManager {
    constructor(app) {
        this.app = app;
    }

    /**
     * Serialize the complete application state to JSON
     * @param {string} presetName - Name for the preset
     * @returns {Object} Complete state object ready for JSON.stringify
     */
    serializeState(presetName) {
        try {
            const state = {
                presetName: presetName,
                createdAt: new Date().toISOString(),
                version: "1.0",
                canvas: this.serializeCanvasState(),
                background: this.serializeBackgroundState(),
                mainText: this.serializeMainTextState(),
                grid: this.serializeGridState(),
                layers: this.serializeLayerState()
            };

            return state;
        } catch (error) {
            console.error('❌ Failed to serialize state:', error);
            throw new Error('Failed to serialize canvas state: ' + error.message);
        }
    }

    /**
     * Serialize canvas settings
     * @returns {Object} Canvas state
     * @private
     */
    serializeCanvasState() {
        return {
            width: this.app.canvasManager.canvas.width,
            height: this.app.canvasManager.canvas.height,
            backgroundColor: this.app.canvasManager.backgroundManager.backgroundColor,
            backgroundFitMode: this.app.canvasManager.backgroundManager.backgroundFitMode,
            padding: {
                left: parseInt(this.app.uiManager.elements.paddingHorizontal?.value || 20),
                right: parseInt(this.app.uiManager.elements.paddingHorizontal?.value || 20),
                top: parseInt(this.app.uiManager.elements.paddingVertical?.value || 20),
                bottom: parseInt(this.app.uiManager.elements.paddingVertical?.value || 20)
            }
        };
    }

    /**
     * Serialize background state
     * @returns {Object} Background state
     * @private
     */
    serializeBackgroundState() {
        const bg = this.app.canvasManager.backgroundManager;
        
        // If we have an image but no data URL, convert it
        let imageDataURL = bg.backgroundImageDataURL;
        if (bg.backgroundImage && !imageDataURL) {
            imageDataURL = this.imageToDataURL(bg.backgroundImage);
        }
        
        return {
            color: bg.backgroundColor,
            imageDataURL: imageDataURL,
            // Skip video for Phase I - videos cannot be saved in presets
            videoDataURL: null,
            fitMode: bg.backgroundFitMode,
            videoSettings: {
                autoplay: this.app.uiManager.elements.backgroundVideoAutoplay?.checked || false,
                loop: this.app.uiManager.elements.backgroundVideoLoop?.checked || false
            }
        };
    }

    /**
     * Serialize main text state
     * @returns {Object} Main text state
     * @private
     */
    serializeMainTextState() {
        const mainText = this.app.mainTextComponent;
        const ui = this.app.uiManager.elements;

        return {
            content: mainText.text,
            fontFamily: mainText.fontFamily,
            fontSize: mainText.fontSize,
            color: mainText.color,
            lineSpacing: mainText.lineSpacing,
            marginVertical: parseInt(ui.marginVertical?.value || 0),
            marginHorizontal: parseInt(ui.marginHorizontal?.value || 0),
            fontWeight: mainText.fontWeight,
            fontStyle: mainText.fontStyle,
            underline: mainText.underline,
            highlight: mainText.highlight,
            highlightColor: mainText.highlightColor,
            alignH: mainText.alignH,
            alignV: mainText.alignV,
            lineAlignments: { ...this.app.savedLineAlignments },
            fillWithBackgroundColor: this.app.mainTextFillWithBackgroundColor
        };
    }

    /**
     * Serialize grid state including all cells
     * @returns {Object} Grid state
     * @private
     */
    serializeGridState() {
        if (!this.app.grid) {
            return { rows: 0, cols: 0, minCellSize: 50, snapshot: null };
        }

        // Use existing Grid.serialize() method
        const gridSnapshot = this.app.grid.serialize();

        // Process cells for media serialization
        if (gridSnapshot.layout && gridSnapshot.layout.cells) {
            gridSnapshot.layout.cells = gridSnapshot.layout.cells.map(cellData => {
                return this.processCellContentForSerialization(cellData);
            });
        }

        return {
            rows: this.app.grid.rows,
            cols: this.app.grid.cols,
            minCellSize: this.app.minSpotSize || 50,
            snapshot: gridSnapshot
        };
    }

    /**
     * Process cell content for media serialization
     * @param {Object} cellData - Cell data from existing serialize() method
     * @returns {Object} Processed cell data with media converted to base64
     * @private
     */
    processCellContentForSerialization(cellData) {
        if (!cellData.content) return cellData;

        const processedData = { ...cellData };
        const content = { ...cellData.content };

        // Handle media content - convert images to base64
        if (cellData.contentType === 'media' && cellData.content.media) {
            if (cellData.content.media instanceof HTMLImageElement) {
                content.imageDataURL = this.imageToDataURL(cellData.content.media);
                content.media = null; // Remove the actual image element
            } else if (cellData.content.media instanceof HTMLVideoElement) {
                // Skip videos for Phase I
                content.media = null;
                content.videoSkipped = true;
            }
        }

        // Remove non-serializable properties
        const nonSerializable = ['lottieAnimation', 'lottieContainer', 'media'];
        nonSerializable.forEach(prop => {
            if (content[prop] !== undefined) {
                delete content[prop];
            }
        });

        processedData.content = content;
        return processedData;
    }

    /**
     * Serialize layer state
     * @returns {Object} Layer state
     * @private
     */
    serializeLayerState() {
        const assignments = {};
        
        if (this.app.grid) {
            const allCells = this.app.grid.getAllCells();
            allCells.forEach(cell => {
                if (cell && cell.id) {
                    assignments[cell.id] = cell.layerId;
                }
            });
        }

        return {
            assignments: assignments,
            stats: this.app.layerManager.getLayerStats()
        };
    }

    /**
     * Deserialize state from JSON and restore application
     * @param {Object} stateData - Serialized state object
     */
    deserializeState(stateData) {
        try {
            // Validate the preset structure
            this.validatePresetJSON(stateData);

            // Clear existing state completely
            this.clearCurrentState();

            // Restore in order (all synchronous, no delays)
            this.restoreCanvasState(stateData.canvas);       // Canvas size FIRST
            this.restoreBackgroundState(stateData.background);
            this.restoreMainTextState(stateData.mainText);   // Now syncs textEngine properly
            this.restoreGridState(stateData.grid);           // Grid deserialize
            this.restoreLayerState(stateData.layers);

            // Update UI elements to match restored state (no renders triggered)
            this.updateUIElements(stateData);

            // Apply saved alignments (like onTextChanged does)
            if (this.app.applySavedAlignments) {
                this.app.applySavedAlignments();
            }

            // Update line alignment controls
            if (this.app.uiManager && this.app.uiManager.updateLineAlignmentControls) {
                this.app.uiManager.updateLineAlignmentControls();
            }

            // Rebuild grid from scratch (uses fresh textEngine data)
            if (this.app.grid) {
                this.app.grid.buildFromExisting();

                // Sync spots array with grid
                this.app.spots = this.app.grid.getContentCells();
                if (this.app.uiManager && this.app.uiManager.updateSpotsUI) {
                    this.app.uiManager.updateSpotsUI();
                }
            }

            // Single synchronous render (no setTimeout, no redundant calls)
            this.app.render();

            console.log('✅ Preset loaded successfully');

        } catch (error) {
            console.error('❌ Failed to deserialize state:', error);
            alert(`Failed to load preset: ${error.message}\n\nCheck console for details.`);
            window.location.reload();
        }
    }

    /**
     * Validate preset JSON structure
     * @param {Object} json - JSON to validate
     * @throws {Error} If JSON is invalid
     * @private
     */
    validatePresetJSON(json) {
        if (!json || typeof json !== 'object') {
            throw new Error('Invalid preset: Not a valid JSON object');
        }

        const required = ['presetName', 'canvas', 'background', 'mainText', 'grid', 'layers'];
        for (const field of required) {
            if (!(field in json)) {
                throw new Error(`Invalid preset: Missing required field '${field}'`);
            }
        }

        // Validate canvas structure
        if (!json.canvas.width || !json.canvas.height) {
            throw new Error('Invalid preset: Canvas dimensions missing');
        }

        // Validate main text structure
        if (typeof json.mainText.content !== 'string') {
            throw new Error('Invalid preset: Main text content missing');
        }
    }

    /**
     * Clear all current application state
     * @private
     */
    clearCurrentState() {
        // Clear text
        this.app.uiManager.elements.mainText.value = '';
        this.app.mainTextComponent.text = '';

        // Clear spots and waiting spots completely
        this.app.spots = [];
        this.app.savedSpotData = [];
        this.app.waitingSpots = []; // Ensure waiting spots are cleared

        // Clear saved alignments
        this.app.savedLineAlignments = {};

        // Clear background
        this.app.canvasManager.clearBackgroundMedia();

        // Clear grid completely
        if (this.app.grid) {
            // Clear the matrix and reset grid state
            this.app.grid.matrix = [];
            this.app.grid.rows = 0;
            this.app.grid.cols = 0;
            this.app.grid.isReady = false;
            this.app.grid.waitingContent = []; // Clear waiting content in grid

            // Clear all cells from layers
            this.app.grid.getAllCells().forEach(cell => {
                if (cell && cell.layerId) {
                    const layer = this.app.layerManager.getLayer(cell.layerId);
                    if (layer) {
                        layer.removeCell(cell);
                    }
                }
            });
        }

        // Clear layers
        this.app.layerManager.clearAllLayers();
    }

    /**
     * Restore canvas state
     * @param {Object} canvasData - Canvas state data
     * @private
     */
    restoreCanvasState(canvasData) {
        // Set canvas size via Chatooly CDN FIRST
        if (window.Chatooly && window.Chatooly.canvasResizer) {
            window.Chatooly.canvasResizer.setExportSize(
                canvasData.width,
                canvasData.height
            );
            window.Chatooly.canvasResizer.applyExportSize();
        }

        // Update textEngine canvas dimensions
        this.app.textEngine.updateConfig({
            canvasWidth: canvasData.width,
            canvasHeight: canvasData.height
        });

        // Update mainTextComponent container
        this.app.mainTextComponent.setContainer(
            0, 0,
            canvasData.width,
            canvasData.height
        );

        // Update padding
        if (this.app.uiManager.elements.paddingHorizontal) {
            this.app.uiManager.elements.paddingHorizontal.value = canvasData.padding.left;
        }
        if (this.app.uiManager.elements.paddingVertical) {
            this.app.uiManager.elements.paddingVertical.value = canvasData.padding.top;
        }
    }

    /**
     * Restore background state
     * @param {Object} backgroundData - Background state data
     * @private
     */
    restoreBackgroundState(backgroundData) {
        const bg = this.app.canvasManager.backgroundManager;
        
        // Set background color
        bg.setBackgroundColor(backgroundData.color);
        
        // Restore background image if present
        if (backgroundData.imageDataURL) {
            const img = new Image();
            img.onload = () => {
                bg.setBackgroundImage(img);
            };
            img.onerror = () => {
                console.error('PresetManager: Failed to load background image');
            };
            img.src = backgroundData.imageDataURL;
        }
        
        // Set fit mode
        bg.setBackgroundFitMode(backgroundData.fitMode);
        
        // Restore video settings (UI only, no video data)
        if (this.app.uiManager.elements.backgroundVideoAutoplay) {
            this.app.uiManager.elements.backgroundVideoAutoplay.checked = backgroundData.videoSettings.autoplay;
        }
        if (this.app.uiManager.elements.backgroundVideoLoop) {
            this.app.uiManager.elements.backgroundVideoLoop.checked = backgroundData.videoSettings.loop;
        }
    }

    /**
     * Restore main text state
     * @param {Object} mainTextData - Main text state data
     * @private
     */
    restoreMainTextState(mainTextData) {
        const ui = this.app.uiManager.elements;
        const mainText = this.app.mainTextComponent;

        // 1. Update UI elements (for visibility)
        ui.mainText.value = mainTextData.content;
        if (ui.fontFamily) {
            ui.fontFamily.value = mainTextData.fontFamily;
        }
        if (ui.fontSize) {
            ui.fontSize.value = mainTextData.fontSize;
        }
        if (ui.textColor) {
            ui.textColor.value = mainTextData.color;
        }
        if (ui.mainTextHighlightColor) {
            ui.mainTextHighlightColor.value = mainTextData.highlightColor;
        }
        if (ui.marginVertical) {
            ui.marginVertical.value = mainTextData.marginVertical;
        }
        if (ui.marginHorizontal) {
            ui.marginHorizontal.value = mainTextData.marginHorizontal;
        }

        // 2. Update mainTextComponent (visual properties)
        mainText.text = mainTextData.content;
        mainText.fontFamily = mainTextData.fontFamily;
        mainText.fontSize = mainTextData.fontSize;
        mainText.color = mainTextData.color;
        mainText.fontWeight = mainTextData.fontWeight;
        mainText.fontStyle = mainTextData.fontStyle;
        mainText.underline = mainTextData.underline;
        mainText.highlight = mainTextData.highlight;
        mainText.highlightColor = mainTextData.highlightColor;
        mainText.lineSpacing = mainTextData.lineSpacing;
        mainText.alignH = mainTextData.alignH;
        mainText.alignV = mainTextData.alignV;

        // 3. Sync to textEngine (CRITICAL - SAME AS onTextChanged)
        // This is the missing piece that causes margins/alignment bugs!
        this.app.textEngine.updateConfig({
            fontSize: mainTextData.fontSize,
            fontFamily: mainTextData.fontFamily,
            color: mainTextData.color,
            lineSpacing: mainTextData.lineSpacing,
            marginVertical: mainTextData.marginVertical,
            marginHorizontal: mainTextData.marginHorizontal,
            defaultAlignment: mainTextData.alignH,
            textPositionHorizontal: mainTextData.alignH,
            textPositionVertical: mainTextData.alignV,
            textStyles: {
                bold: mainTextData.fontWeight === 'bold',
                italic: mainTextData.fontStyle === 'italic',
                underline: mainTextData.underline,
                highlight: mainTextData.highlight,
                highlightColor: mainTextData.highlightColor
            }
        });

        // 4. Set text and recalculate bounds (CRITICAL)
        // Without this, textEngine.textBounds stays empty and grid can't render
        this.app.textEngine.setText(mainTextData.content);

        // 5. Restore line alignments
        this.app.savedLineAlignments = { ...mainTextData.lineAlignments };

        // 6. Apply line alignments to textEngine
        if (mainTextData.lineAlignments) {
            Object.entries(mainTextData.lineAlignments).forEach(([index, alignment]) => {
                this.app.textEngine.setLineAlignment(parseInt(index), alignment);
            });
        }

        // 7. Set background fill preference
        this.app.mainTextFillWithBackgroundColor = mainTextData.fillWithBackgroundColor;
        if (ui.mainTextFillWithBackgroundColor) {
            ui.mainTextFillWithBackgroundColor.checked = mainTextData.fillWithBackgroundColor;
        }

        // 8. Update UI button states
        this.updateTextStyleButtons();
    }

    /**
     * Restore grid state
     * @param {Object} gridData - Grid state data
     * @private
     */
    restoreGridState(gridData) {
        if (!this.app.grid) return;
        
        // Set minimum cell size
        this.app.minSpotSize = gridData.minCellSize;
        if (this.app.uiManager.elements.minSpotSize) {
            this.app.uiManager.elements.minSpotSize.value = gridData.minCellSize;
        }
        
        // Clear existing grid
        if (this.app.grid) {
            // Clear the matrix and reset grid state
            this.app.grid.matrix = [];
            this.app.grid.rows = 0;
            this.app.grid.cols = 0;
            this.app.grid.isReady = false;
            
            // Clear all cells from layers
            this.app.grid.getAllCells().forEach(cell => {
                if (cell && cell.layerId) {
                    const layer = this.app.layerManager.getLayer(cell.layerId);
                    if (layer) {
                        layer.removeCell(cell);
                    }
                }
            });
        }
        
        // Use existing Grid.deserialize() method
        if (gridData.snapshot) {
            this.app.grid.deserialize(gridData.snapshot);
        }
        
        // Process any media content that needs restoration
        this.restoreMediaContent();
        
        // Update spots array (but don't use it for rendering - grid handles ContentCells)
        this.app.spots = this.app.grid.getContentCells();
        
        // Update UI (but don't trigger render yet)
        if (this.app.uiManager.updateSpotsUI) {
            this.app.uiManager.updateSpotsUI();
        }
        
        // Don't trigger grid rebuild here - it causes multiple renders
        // The grid is already properly deserialized
    }

    /**
     * Restore media content from base64 data URLs
     * @private
     */
    restoreMediaContent() {
        if (!this.app.grid) return;

        const allCells = this.app.grid.getAllCells();
        
        allCells.forEach(cell => {
            if (cell && cell.type === 'content' && cell.content && cell.content.imageDataURL) {
                this.restoreImageFromDataURL(cell, cell.content.imageDataURL);
            }
        });
    }

    /**
     * Restore image from base64 data URL
     * @param {ContentCell} cell - Cell to restore image to
     * @param {string} imageDataURL - Base64 data URL
     * @private
     */
    restoreImageFromDataURL(cell, imageDataURL) {
        const img = new Image();
        img.onload = () => {
            if (cell.content) {
                cell.content.image = img;
                delete cell.content.imageDataURL;
                this.app.render();
            }
        };
        img.onerror = () => {
            console.warn(`Failed to load image for cell ${cell.id}`);
            if (cell.content) {
                delete cell.content.imageDataURL;
            }
        };
        img.src = imageDataURL;
    }

    /**
     * Restore layer state
     * @param {Object} layerData - Layer state data
     * @private
     */
    restoreLayerState(layerData) {
        // Layer assignments are handled during cell restoration
        // This method is here for future layer-specific settings
    }

    /**
     * Update text style button states in UI
     * @private
     */
    updateTextStyleButtons() {
        const ui = this.app.uiManager.elements;
        const mainText = this.app.mainTextComponent;
        
        // Update button states
        if (ui.mainTextBold) {
            ui.mainTextBold.classList.toggle('active', mainText.fontWeight === 'bold');
        }
        if (ui.mainTextItalic) {
            ui.mainTextItalic.classList.toggle('active', mainText.fontStyle === 'italic');
        }
        if (ui.mainTextUnderline) {
            ui.mainTextUnderline.classList.toggle('active', mainText.underline);
        }
        if (ui.mainTextHighlight) {
            ui.mainTextHighlight.classList.toggle('active', mainText.highlight);
        }
        
        // Show/hide highlight color picker
        if (ui.mainTextHighlightColor) {
            ui.mainTextHighlightColor.style.display = mainText.highlight ? 'inline-block' : 'none';
        }
    }

    /**
     * Convert image to data URL
     * @param {HTMLImageElement} image - Image to convert
     * @returns {string} Data URL
     * @private
     */
    imageToDataURL(image) {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = image.width || image.naturalWidth;
            canvas.height = image.height || image.naturalHeight;
            ctx.drawImage(image, 0, 0);
            return canvas.toDataURL();
        } catch (error) {
            console.warn('Failed to convert image to data URL:', error);
            return null;
        }
    }

    /**
     * Generate slugified filename for preset
     * @param {string} presetName - Original preset name
     * @returns {string} Slugified filename
     */
    generateFilename(presetName) {
        const slug = presetName
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .trim();
        
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        return `${slug}-${timestamp}.json`;
    }

    /**
     * Download preset as JSON file
     * @param {string} presetName - Name for the preset
     */
    downloadPreset(presetName) {
        try {
            const state = this.serializeState(presetName);
            const jsonString = JSON.stringify(state, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const filename = this.generateFilename(presetName);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('✅ Preset downloaded:', filename);
        } catch (error) {
            console.error('❌ Failed to download preset:', error);
            throw error;
        }
    }

    /**
     * Load preset from file
     * @param {File} file - JSON file to load
     * @returns {Promise} Promise that resolves when loading is complete
     */
    async loadPresetFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    this.deserializeState(jsonData);
                    resolve(jsonData);
                } catch (error) {
                    console.error('❌ Failed to parse preset file:', error);
                    reject(error);
                }
            };
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            reader.readAsText(file);
        });
    }

    /**
     * Update UI elements to match the restored preset state
     * @param {Object} stateData - Complete preset state data
     * @private
     */
    updateUIElements(stateData) {
        // Temporarily disable event listeners to prevent multiple renders
        const originalOnTextChanged = this.app.onTextChanged;
        this.app.onTextChanged = () => {
            // Do nothing during preset loading
        };
        
        try {
            // Update background color UI
            if (this.app.uiManager.elements.backgroundColor) {
                this.app.uiManager.elements.backgroundColor.value = stateData.background.color;
            }
            
            // Update background fit mode UI
            if (this.app.uiManager.elements.backgroundFitMode) {
                this.app.uiManager.elements.backgroundFitMode.value = stateData.background.fitMode;
            }
            
            // Update main text UI
            if (this.app.uiManager.elements.mainText) {
                this.app.uiManager.elements.mainText.value = stateData.mainText.content;
            }
            
            // Update font family UI
            if (this.app.uiManager.elements.fontFamily) {
                this.app.uiManager.elements.fontFamily.value = stateData.mainText.fontFamily;
            }
            
            // Update font size UI
            if (this.app.uiManager.elements.fontSize) {
                this.app.uiManager.elements.fontSize.value = stateData.mainText.fontSize;
            }
            
            // Update text color UI
            if (this.app.uiManager.elements.textColor) {
                this.app.uiManager.elements.textColor.value = stateData.mainText.color;
            }
            
            // Update padding UI
            if (this.app.uiManager.elements.paddingHorizontal) {
                this.app.uiManager.elements.paddingHorizontal.value = stateData.canvas.padding.left;
            }
            if (this.app.uiManager.elements.paddingVertical) {
                this.app.uiManager.elements.paddingVertical.value = stateData.canvas.padding.top;
            }
            
            // Update minimum spot size UI
            if (this.app.uiManager.elements.minSpotSize) {
                this.app.uiManager.elements.minSpotSize.value = stateData.grid.minCellSize;
            }
            
            // UI elements updated successfully
        } finally {
            // Restore original event listener
            this.app.onTextChanged = originalOnTextChanged;
        }
    }
}
