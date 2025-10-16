/**
 * PresetManager.js - Core preset save/load system
 * Handles serialization and deserialization of complete canvas states
 */

class PresetManager {
    constructor(app) {
        this.app = app;
        this.wixAPI = null; // Will be set by app.js after WixAPI initialization
    }

    /**
     * Set Wix API instance for cloud operations
     * @param {WixPresetAPI} wixAPI - Initialized WixPresetAPI instance
     */
    setWixAPI(wixAPI) {
        this.wixAPI = wixAPI;
        console.log('✅ WixAPI connected to PresetManager');
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
     * Serialize background state (NO base64 - URLs only)
     * @returns {Object} Background state
     * @private
     */
    serializeBackgroundState() {
        const bg = this.app.canvasManager.backgroundManager;

        const hasImage = !!bg.backgroundImage;
        console.log('📸 SAVE: Serializing background state...');
        console.log('   → Has image element:', hasImage);
        if (hasImage) {
            console.log('   → Image element type:', bg.backgroundImage.constructor.name);
            console.log('   → Image dimensions:', bg.backgroundImage.width, 'x', bg.backgroundImage.height);
            console.log('   → Image will be uploaded to cloud');
        } else {
            console.log('   → No image to serialize');
        }

        return {
            color: bg.backgroundColor,
            imageURL: bg.backgroundImageURL || null, // Will be set during cloud upload
            imageElement: bg.backgroundImage, // Temp reference for upload
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
     * Process cell content for cloud serialization (NO base64 - URLs only)
     * @param {Object} cellData - Cell data from existing serialize() method
     * @returns {Object} Processed cell data with temp image references for upload
     * @private
     */
    processCellContentForSerialization(cellData) {
        if (!cellData.content) return cellData;

        const processedData = { ...cellData };
        const content = { ...cellData.content };

        // Handle media content - store temp reference for cloud upload
        if (cellData.contentType === 'media' && cellData.content.media) {
            if (cellData.content.media instanceof HTMLImageElement) {
                console.log(`📸 SAVE: Processing cell ${cellData.id} with image`);
                console.log('   → Image dimensions:', cellData.content.media.width, 'x', cellData.content.media.height);
                content.imageElement = cellData.content.media; // Temp ref for upload
                content.imageURL = null; // Will be set during cloud upload
                content.media = null; // Remove actual element
            } else if (cellData.content.media instanceof HTMLVideoElement) {
                console.log(`⚠️ SAVE: Cell ${cellData.id} has video (will be skipped)`);
                // Skip videos
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
            console.log('📦 LOAD: Deserializing preset...');
            console.log('   → Preset name:', stateData.presetName);
            console.log('   → Has background image:', !!stateData.background?.imageURL);
            if (stateData.background?.imageURL) {
                console.log('   → Background image URL length:', stateData.background.imageURL.length, 'characters');
            }

            // Validate the preset structure
            this.validatePresetJSON(stateData);

            // Clear existing state completely
            this.clearCurrentState();

            // Restore in order (all synchronous, no delays)
            console.log('🔄 LOAD: Restoring canvas state...');
            this.restoreCanvasState(stateData.canvas);       // Canvas size FIRST

            console.log('🔄 LOAD: Restoring background state...');
            this.restoreBackgroundState(stateData.background);

            console.log('🔄 LOAD: Restoring main text state...');
            this.restoreMainTextState(stateData.mainText);   // Now syncs textEngine properly

            console.log('🔄 LOAD: Restoring grid state...');
            this.restoreGridState(stateData.grid);           // Grid deserialize

            console.log('🔄 LOAD: Restoring layer state...');
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
     * Restore background state from Wix URL
     * @param {Object} backgroundData - Background state data
     * @private
     */
    restoreBackgroundState(backgroundData) {
        const bg = this.app.canvasManager.backgroundManager;

        // Set background color
        bg.setBackgroundColor(backgroundData.color);

        // Restore background image from Wix CDN URL
        if (backgroundData.imageURL) {
            console.log('🔄 LOAD: Restoring background image...');
            console.log('   → URL type:', backgroundData.imageURL.substring(0, 30));
            console.log('   → URL length:', backgroundData.imageURL.length, 'characters');

            const img = new Image();
            img.onload = () => {
                bg.setBackgroundImage(img);
                console.log('   ✅ Background image loaded and set!');
                console.log('   → Image size:', img.width, 'x', img.height);
                console.log('   → Triggering canvas render...');
                this.app.render(); // CRITICAL: Trigger render so image appears!
            };
            img.onerror = (e) => {
                console.error('   ❌ LOAD: Failed to load background image!');
                console.error('   → Error type:', e.type);
                console.error('   → URL preview:', backgroundData.imageURL.substring(0, 100) + '...');
            };
            img.src = backgroundData.imageURL;
        } else {
            console.log('ℹ️ LOAD: No background image URL to restore');
        }

        // Set fit mode
        bg.setBackgroundFitMode(backgroundData.fitMode);

        // Restore video settings (UI only)
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
     * Restore media content from Wix CDN URLs
     * @private
     */
    restoreMediaContent() {
        if (!this.app.grid) return;

        const allCells = this.app.grid.getAllCells();

        allCells.forEach(cell => {
            if (cell && cell.type === 'content' && cell.content && cell.content.imageURL) {
                this.restoreImageFromURL(cell, cell.content.imageURL);
            }
        });
    }

    /**
     * Restore image from Wix CDN URL
     * @param {ContentCell} cell - Cell to restore image to
     * @param {string} imageURL - Wix CDN URL
     * @private
     */
    restoreImageFromURL(cell, imageURL) {
        console.log(`🔄 LOAD: Restoring cell image for ${cell.id}...`);
        console.log('   → URL type:', imageURL.substring(0, 30));
        console.log('   → URL length:', imageURL.length, 'characters');

        const img = new Image();
        img.onload = () => {
            if (cell.content) {
                cell.content.media = img; // CellRenderer looks for .media not .image
                console.log(`   ✅ Cell image loaded and set! (${cell.id})`);
                console.log('   → Image size:', img.width, 'x', img.height);
                console.log('   → cell.content.media set to:', cell.content.media.constructor.name);
                console.log('   → Triggering canvas render...');
                this.app.render();
            }
        };
        img.onerror = (e) => {
            console.error(`   ❌ LOAD: Failed to load cell image! (${cell.id})`);
            console.error('   → Error type:', e.type);
            console.error('   → URL preview:', imageURL.substring(0, 100) + '...');
        };
        img.src = imageURL;
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

    // ==============================================
    // CLOUD PRESET METHODS (Wix Headless)
    // ==============================================

    /**
     * Save preset to Wix cloud with automatic asset uploads
     * @param {string} presetName - Name for the preset
     * @returns {Promise} Promise that resolves when save is complete
     */
    async saveToCloud(presetName) {
        if (!this.wixAPI) {
            throw new Error('Wix API not initialized. Cannot save to cloud.');
        }

        try {
            console.log(`🔄 Starting cloud save: "${presetName}"`);

            // 1. Get current state (with temp image references)
            const state = this.serializeState(presetName);

            // 2. Upload background image if exists
            if (state.background.imageElement) {
                console.log('📤 SAVE: Uploading background image...');
                console.log('   → Image element type:', state.background.imageElement.constructor.name);
                console.log('   → Image dimensions:', state.background.imageElement.width, 'x', state.background.imageElement.height);

                state.background.imageURL = await this.wixAPI.uploadImage(
                    state.background.imageElement,
                    `bg-${presetName}-${Date.now()}.png`
                );

                console.log('   ✅ Data URL created, length:', state.background.imageURL.length, 'characters');
                console.log('   → Preview:', state.background.imageURL.substring(0, 50) + '...');
                delete state.background.imageElement; // Remove temp reference
            } else {
                console.log('ℹ️ SAVE: No background image to upload');
            }

            // 3. Upload all cell images
            if (state.grid.snapshot && state.grid.snapshot.layout && state.grid.snapshot.layout.cells) {
                console.log(`📋 SAVE: Checking ${state.grid.snapshot.layout.cells.length} cells for images...`);
                let cellImageCount = 0;
                let videoSkipCount = 0;

                for (let i = 0; i < state.grid.snapshot.layout.cells.length; i++) {
                    const cellData = state.grid.snapshot.layout.cells[i];

                    // Count skipped videos
                    if (cellData.content && cellData.content.videoSkipped) {
                        videoSkipCount++;
                    }

                    if (cellData.content && cellData.content.imageElement) {
                        cellImageCount++;
                        console.log(`📤 SAVE: Uploading cell image ${i + 1}...`);
                        console.log('   → Cell index:', i);
                        console.log('   → Image dimensions:', cellData.content.imageElement.width, 'x', cellData.content.imageElement.height);

                        cellData.content.imageURL = await this.wixAPI.uploadImage(
                            cellData.content.imageElement,
                            `cell-${presetName}-${i}-${Date.now()}.png`
                        );

                        console.log('   ✅ Cell image uploaded, URL length:', cellData.content.imageURL.length, 'characters');
                        delete cellData.content.imageElement; // Remove temp reference
                    }
                }
                console.log(`✅ SAVE: Uploaded ${cellImageCount} cell image(s)`);
                if (videoSkipCount > 0) {
                    console.warn(`⚠️ SAVE: Skipped ${videoSkipCount} video(s) - videos cannot be saved in presets yet`);
                }
            }

            // 4. Save preset to Wix collection
            console.log('💾 Saving preset to Wix...');
            const savedPreset = await this.wixAPI.savePreset(presetName, state);

            console.log(`✅ Preset saved to cloud: "${presetName}"`);
            return savedPreset;

        } catch (error) {
            console.error('❌ Failed to save preset to cloud:', error);
            throw new Error(`Cloud save failed: ${error.message}`);
        }
    }

    /**
     * Load preset from Wix cloud by ID
     * @param {string} presetId - Wix preset _id
     * @returns {Promise} Promise that resolves when load is complete
     */
    async loadFromCloud(presetId) {
        if (!this.wixAPI) {
            throw new Error('Wix API not initialized. Cannot load from cloud.');
        }

        try {
            console.log(`🔄 Loading preset from cloud: ${presetId}`);

            // 1. Fetch preset from Wix
            const preset = await this.wixAPI.loadPreset(presetId);

            // 2. Deserialize the settings (URLs load automatically in browser)
            this.deserializeState(preset.settings);

            console.log(`✅ Preset loaded from cloud: "${preset.name}"`);
            return preset;

        } catch (error) {
            console.error('❌ Failed to load preset from cloud:', error);
            throw new Error(`Cloud load failed: ${error.message}`);
        }
    }

    /**
     * List all presets from Wix cloud
     * @returns {Promise<Array>} Promise that resolves with array of presets
     */
    async listCloudPresets() {
        if (!this.wixAPI) {
            throw new Error('Wix API not initialized. Cannot list presets.');
        }

        try {
            return await this.wixAPI.listPresets();
        } catch (error) {
            console.error('❌ Failed to list cloud presets:', error);
            return [];
        }
    }

    /**
     * Delete preset from Wix cloud
     * @param {string} presetId - Wix preset _id
     * @returns {Promise} Promise that resolves when delete is complete
     */
    async deleteFromCloud(presetId) {
        if (!this.wixAPI) {
            throw new Error('Wix API not initialized. Cannot delete from cloud.');
        }

        try {
            await this.wixAPI.deletePreset(presetId);
            console.log(`✅ Preset deleted from cloud: ${presetId}`);
        } catch (error) {
            console.error('❌ Failed to delete preset from cloud:', error);
            throw new Error(`Cloud delete failed: ${error.message}`);
        }
    }

    // ==============================================
    // LOCAL FILE METHODS (REMOVED - Cloud only)
    // ==============================================
    // downloadPreset() - REMOVED: Use saveToCloud() instead
    // loadPresetFromFile() - REMOVED: Use loadFromCloud() instead

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
