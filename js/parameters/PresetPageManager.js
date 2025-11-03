/**
 * PresetPageManager - Page-as-Preset Model
 *
 * Designer workflow:
 * 1. Design canvas (single page focus)
 * 2. Click "Save Page to Preset"
 * 3. Mark editable fields during save
 * 4. Choose new/existing preset
 * 5. Specify page position (1-5)
 *
 * Each page stores complete canvas state + editable field configuration
 */

class PresetPageManager {
    constructor(app) {
        this.app = app;
        this.presetManager = app.presetManager;

        // Content Slots Manager (v3)
        this.contentSlotManager = new ContentSlotManager(app);

        // Validation constants
        this.MAX_PAGES = 5;
        this.MAX_PAGE_SIZE = 60000; // 60KB safety margin (Wix Rich Content limit: 64KB)
    }

    /**
     * Capture current canvas state as page data
     * Uses existing PresetManager logic for canvas serialization
     * @returns {Object} Complete page data with canvas state
     */
    captureCurrentPage(pageNumber = 1, pageName = 'Untitled Page') {
        // Get current canvas state using existing PresetManager logic
        // This preserves ALL properties that make presets work correctly
        const canvasState = this.presetManager.serializeState('temp');

        // Build complete page structure by adding multi-page metadata to existing state
        // IMPORTANT: Use canvasState directly to preserve all properties
        const pageData = {
            pageName: pageName,
            pageNumber: pageNumber,

            // Preserve complete canvas state from PresetManager.serializeState()
            // This includes all properties needed for correct deserialization
            canvas: canvasState.canvas,
            background: canvasState.background,
            mainText: canvasState.mainText,
            grid: canvasState.grid,
            layers: canvasState.layers,

            // Export configuration (v3)
            exportConfig: {
                defaultFormat: this.presetManager.exportFormat || 'image',
                videoDuration: this.presetManager.exportFormat === 'video' ? (this.presetManager.exportDuration || 5) : null,
                videoFPS: 60,
                imageFormat: 'png'
            },

            // Content Slots (v3) - initially empty, populated by designer
            contentSlots: [...this.contentSlotManager.getAllSlots()],

            // Editable fields configuration (legacy - kept for backwards compatibility)
            editableFields: {
                mainText: {
                    editable: false,
                    fieldName: null,
                    fieldLabel: null
                },
                textCells: {},
                contentCells: {},
                background: {
                    color: { editable: false, fieldName: null },
                    image: { editable: false, fieldName: null }
                }
            }
        };

        return pageData;
    }

    /**
     * Validate page data before saving
     * @param {Object} pageData - Page data to validate
     * @throws {Error} If validation fails
     */
    validatePageData(pageData) {
        // Required fields check
        if (!pageData.pageName) {
            throw new Error('Page name is required');
        }

        if (!pageData.pageNumber || pageData.pageNumber < 1 || pageData.pageNumber > this.MAX_PAGES) {
            throw new Error(`Page number must be between 1 and ${this.MAX_PAGES}`);
        }

        if (!pageData.canvas) {
            throw new Error('Canvas data is required');
        }

        if (!pageData.background) {
            throw new Error('Background data is required');
        }

        if (!pageData.mainText) {
            throw new Error('Main text data is required');
        }

        if (!pageData.editableFields) {
            throw new Error('Editable fields configuration is required');
        }

        // Size check
        const jsonString = JSON.stringify(pageData);
        if (jsonString.length > this.MAX_PAGE_SIZE) {
            throw new Error(`Page data exceeds maximum size (${this.MAX_PAGE_SIZE / 1000}KB). Current: ${(jsonString.length / 1000).toFixed(1)}KB`);
        }

        return true;
    }

    /**
     * Save page to new preset
     * @param {string} presetName - Name for the new preset
     * @param {Object} pageData - Complete page data
     * @param {number} pageNumber - Page position (1-5)
     * @returns {Promise<string>} Preset ID
     */
    async saveToNewPreset(presetName, pageData, pageNumber = 1) {
        // Validate page data
        pageData.pageNumber = pageNumber;
        this.validatePageData(pageData);

        // Build preset object with page1-page5 fields
        const preset = {
            presetName: presetName,
            description: '',
            page1: pageNumber === 1 ? JSON.stringify(pageData) : null,
            page2: pageNumber === 2 ? JSON.stringify(pageData) : null,
            page3: pageNumber === 3 ? JSON.stringify(pageData) : null,
            page4: pageNumber === 4 ? JSON.stringify(pageData) : null,
            page5: pageNumber === 5 ? JSON.stringify(pageData) : null
        };

        // Save to Wix CMS (or localStorage for now)
        const presetId = await this.savePresetToCMS(preset);

        console.log(`✅ Saved page ${pageNumber} to new preset: ${presetName} (ID: ${presetId})`);
        return presetId;
    }

    /**
     * Add page to existing preset
     * @param {string} presetId - Existing preset ID
     * @param {Object} pageData - Complete page data
     * @param {number} pageNumber - Page position (1-5)
     */
    async addPageToExistingPreset(presetId, pageData, pageNumber) {
        // Validate page data
        pageData.pageNumber = pageNumber;
        this.validatePageData(pageData);

        // Get existing preset
        const preset = await this.getPresetFromCMS(presetId);

        if (!preset) {
            throw new Error(`Preset not found: ${presetId}`);
        }

        // Update the specific page field
        const fieldName = `page${pageNumber}`;
        preset[fieldName] = JSON.stringify(pageData);

        // Update in CMS
        await this.updatePresetInCMS(presetId, preset);

        console.log(`✅ Added page ${pageNumber} to preset: ${preset.presetName} (ID: ${presetId})`);
    }

    /**
     * Load page from preset into canvas
     * @param {string} presetId - Preset ID
     * @param {number} pageNumber - Page position (1-5)
     * @returns {Promise<Object>} Page data
     */
    async loadPage(presetId, pageNumber) {
        const preset = await this.getPresetFromCMS(presetId);

        if (!preset) {
            throw new Error(`Preset not found: ${presetId}`);
        }

        const fieldName = `page${pageNumber}`;
        const pageDataString = preset[fieldName];

        if (!pageDataString) {
            throw new Error(`Page ${pageNumber} does not exist in preset: ${preset.presetName}`);
        }

        const pageData = JSON.parse(pageDataString);

        // Apply page data to canvas using PresetManager
        await this.applyPageToCanvas(pageData);

        console.log(`✅ Loaded page ${pageNumber} from preset: ${preset.presetName}`);
        return pageData;
    }

    /**
     * Apply page data to current canvas
     * @param {Object} pageData - Page data to apply
     */
    async applyPageToCanvas(pageData) {
        // Use existing PresetManager.deserializeState logic
        // This will restore the complete canvas state
        // Note: deserializeState expects 'presetName' field for validation
        await this.presetManager.deserializeState({
            presetName: pageData.pageName || 'Loaded Page', // Add presetName for validation
            canvas: pageData.canvas,
            background: pageData.background,
            mainText: pageData.mainText,
            grid: pageData.grid,
            layers: pageData.layers,
            exportFormat: pageData.exportFormat,
            exportDuration: pageData.exportDuration
        });

        // Restore content slots (v3)
        if (pageData.contentSlots && Array.isArray(pageData.contentSlots)) {
            this.contentSlotManager.clearSlots();
            pageData.contentSlots.forEach(slot => {
                this.contentSlotManager.addSlot(slot);
            });
            console.log(`✅ Restored ${pageData.contentSlots.length} content slots`);
        }
    }

    /**
     * Apply user-provided content to content slots
     * This is called by the end-user to fill in editable fields
     * @param {Object} slotData - Map of {slotId: contentValue}
     * @example
     * applyContentToSlots({
     *   'slot-hero-headline': 'Welcome to Our Company',
     *   'slot-hero-image': 'https://example.com/image.jpg'
     * })
     */
    applyContentToSlots(slotData) {
        const slots = this.contentSlotManager.getAllSlots();
        let appliedCount = 0;

        slots.forEach(slot => {
            if (slotData.hasOwnProperty(slot.slotId)) {
                const newContent = slotData[slot.slotId];

                // Find the cell using contentId (UUID - survives rebuilds)
                const cell = this.contentSlotManager.findCellByContentId(slot.sourceContentId);

                if (!cell) {
                    console.warn(`Cell not found for slot: ${slot.slotId} (contentId: ${slot.sourceContentId})`);
                    return;
                }

                // Apply content based on slot type
                if (slot.type === 'text') {
                    // Apply text content
                    if (cell.type === 'main-text' && cell.mainTextComponent) {
                        cell.mainTextComponent.text = newContent;
                    } else if (cell.content) {
                        cell.content.text = newContent;
                    }
                    appliedCount++;
                } else if (slot.type === 'image') {
                    // Apply image content
                    if (cell.content) {
                        // If newContent is a URL, create an Image element
                        if (typeof newContent === 'string') {
                            const img = new Image();
                            img.crossOrigin = 'anonymous';
                            img.src = newContent;
                            cell.content.media = img;
                            cell.content.mediaUrl = newContent;
                        } else if (newContent instanceof HTMLImageElement) {
                            cell.content.media = newContent;
                            cell.content.mediaUrl = newContent.src;
                        }
                        appliedCount++;
                    }
                }
            }
        });

        // Re-render the canvas with new content
        this.app.render();

        console.log(`✅ Applied content to ${appliedCount}/${Object.keys(slotData).length} slots`);
        return appliedCount;
    }

    /**
     * Get all presets with page information
     * @returns {Promise<Array>} List of presets with page counts
     */
    async getAllPresets() {
        const allPresets = await this.getAllPresetsFromCMS();

        return allPresets.map(preset => {
            const pages = [];

            for (let i = 1; i <= this.MAX_PAGES; i++) {
                const fieldName = `page${i}`;
                if (preset[fieldName]) {
                    const pageData = JSON.parse(preset[fieldName]);
                    pages.push({
                        pageNumber: i,
                        pageName: pageData.pageName
                    });
                }
            }

            return {
                presetId: preset._id || preset.id,
                presetName: preset.presetName,
                pages: pages,
                pageCount: pages.length
            };
        });
    }

    // ===== CMS Integration Methods =====
    // For now, these use localStorage. Will be replaced with Wix Data API

    /**
     * Save preset to CMS (localStorage for now)
     */
    async savePresetToCMS(preset) {
        const presetId = `preset-${Date.now()}`;
        preset._id = presetId;
        preset._createdDate = new Date().toISOString();
        preset._updatedDate = new Date().toISOString();

        // Get existing presets
        const presets = this.getAllPresetsFromLocalStorage();
        presets.push(preset);

        localStorage.setItem('chatooly_multipage_presets', JSON.stringify(presets));
        return presetId;
    }

    /**
     * Get preset from CMS (localStorage for now)
     */
    async getPresetFromCMS(presetId) {
        const presets = this.getAllPresetsFromLocalStorage();
        return presets.find(p => p._id === presetId);
    }

    /**
     * Update preset in CMS (localStorage for now)
     */
    async updatePresetInCMS(presetId, updatedPreset) {
        const presets = this.getAllPresetsFromLocalStorage();
        const index = presets.findIndex(p => p._id === presetId);

        if (index === -1) {
            throw new Error(`Preset not found: ${presetId}`);
        }

        updatedPreset._updatedDate = new Date().toISOString();
        presets[index] = updatedPreset;

        localStorage.setItem('chatooly_multipage_presets', JSON.stringify(presets));
    }

    /**
     * Get all presets from CMS (localStorage for now)
     */
    async getAllPresetsFromCMS() {
        return this.getAllPresetsFromLocalStorage();
    }

    /**
     * Helper: Get all presets from localStorage
     */
    getAllPresetsFromLocalStorage() {
        const presetsJson = localStorage.getItem('chatooly_multipage_presets');
        return presetsJson ? JSON.parse(presetsJson) : [];
    }
}
