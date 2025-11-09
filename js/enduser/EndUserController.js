/**
 * EndUserController.js
 * Sprint 4: End-User Interface Controller
 *
 * Manages the end-user workflow:
 * - Preset selection and loading
 * - Page navigation
 * - Content slot data management
 * - Form generation coordination
 * - Export functionality
 */

class EndUserController {
    constructor(app, wixAPI) {
        // Store full app instance (same as designer mode)
        this.app = app;
        this.wixAPI = wixAPI;

        // State
        this.currentPresetId = null;
        this.currentPresetData = null;
        this.currentPageIndex = 0;
        this.loadedPages = []; // Array of page data objects
        this.contentData = {}; // { slotId: value } for all slots across all pages

        // ✅ Phase 1A: Debounce timer for canvas re-rendering
        this.renderDebounceTimer = null;

        // ✅ Phase 1A: LocalStorage key for auto-save
        this.localStorageKey = 'chatooly-enduser-content-data';

        // Components
        this.formGenerator = null;
        this.contentSlotRenderer = null;

        // DOM references
        this.elements = {
            presetName: document.getElementById('presetName'),
            sidebarTitle: document.getElementById('sidebarTitle'),
            presetSelector: document.getElementById('presetSelector'),
            browsePresetsBtn: document.getElementById('browsePresetsBtn'),
            pageSectionsContainer: document.getElementById('pageSectionsContainer'),
            pageNav: document.getElementById('pageNav'),
            pageThumbs: document.getElementById('pageThumbs'),
            exportBtn: document.getElementById('exportBtn'),
            presetModal: document.getElementById('presetModal'),
            presetList: document.getElementById('presetList'),
            closePresetModal: document.getElementById('closePresetModal'),
            canvas: document.getElementById('chatooly-canvas'),
            // Full-screen preset selector
            fullscreenPresetSelector: document.getElementById('fullscreenPresetSelector'),
            fullscreenPresetDropdown: document.getElementById('fullscreenPresetDropdown'),
            fullscreenLoadBtn: document.getElementById('fullscreenLoadBtn'),
            mainContainer: document.getElementById('mainContainer')
        };

        // ✅ RESET ON PAGE LOAD: Clear localStorage to always start fresh
        // This ensures hard page refresh resets to designer defaults
        localStorage.removeItem(this.localStorageKey);
        console.log('🔄 Page loaded - cleared previous session data');

        this.initializeEventListeners();

        // Load presets into fullscreen dropdown
        this.loadPresetsIntoFullscreenDropdown();
    }

    /**
     * ⚠️ DEPRECATED: Auto-save disabled for hard reset behavior
     * Content data is NOT saved to localStorage to ensure fresh start on reload
     */
    loadContentDataFromLocalStorage() {
        // Intentionally disabled - page reload should reset to designer defaults
        console.log('ℹ️ Auto-load disabled - starting with clean state');
    }

    /**
     * ⚠️ DEPRECATED: Auto-save disabled for hard reset behavior
     * Content data is NOT saved to localStorage to ensure fresh start on reload
     */
    saveContentDataToLocalStorage() {
        // Intentionally disabled - page reload should reset to designer defaults
        // console.log('ℹ️ Auto-save disabled - changes will be lost on page reload');
    }

    /**
     * ✅ NEW: Debounced render function
     * Applies user content to cells and re-renders grid
     */
    debouncedRender() {
        // Clear existing timer
        if (this.renderDebounceTimer) {
            clearTimeout(this.renderDebounceTimer);
        }

        // Set new timer (300ms delay)
        this.renderDebounceTimer = setTimeout(() => {
            if (this.app.grid) {
                // Apply user content to all editable cells
                const allCells = this.app.grid.getAllCells();
                const editableCells = allCells.filter(cell => cell.editable);

                editableCells.forEach(cell => {
                    const userData = this.contentData[cell.slotId];
                    if (userData) {
                        this.applyUserContentToCell(cell, userData);
                    }
                });

                // Render grid normally
                this.app.render();

                console.log('🎨 Canvas re-rendered (debounced)');
            }
        }, 300);
    }

    /**
     * Initialize all event listeners
     */
    initializeEventListeners() {
        // Full-screen preset selector
        if (this.elements.fullscreenPresetDropdown) {
            this.elements.fullscreenPresetDropdown.addEventListener('change', (e) => {
                const selectedPresetId = e.target.value;
                if (selectedPresetId) {
                    this.elements.fullscreenLoadBtn.disabled = false;
                } else {
                    this.elements.fullscreenLoadBtn.disabled = true;
                }
            });
        }

        if (this.elements.fullscreenLoadBtn) {
            this.elements.fullscreenLoadBtn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent form submission/page refresh
                const selectedPresetId = this.elements.fullscreenPresetDropdown.value;
                if (selectedPresetId) {
                    this.loadPresetFromFullscreen(selectedPresetId);
                }
            });
        }

        // Preset selection (old modal - keep for future use)
        if (this.elements.browsePresetsBtn) {
            console.log('🔗 Attaching click listener to Browse Presets button');
            this.elements.browsePresetsBtn.addEventListener('click', (e) => {
                console.log('🖱️ Browse Presets button clicked!');
                e.preventDefault();
                e.stopPropagation();
                this.showPresetModal();
            });
        }

        if (this.elements.closePresetModal) {
            this.elements.closePresetModal.addEventListener('click', () => {
                console.log('🖱️ Close modal button clicked');
                this.hidePresetModal();
            });
        }

        // Click outside modal to close
        if (this.elements.presetModal) {
            this.elements.presetModal.addEventListener('click', (e) => {
                if (e.target === this.elements.presetModal) {
                    console.log('🖱️ Clicked outside modal - closing');
                    this.hidePresetModal();
                }
            });
        }

        // Export
        if (this.elements.exportBtn) {
            this.elements.exportBtn.addEventListener('click', () => {
                console.log('🖱️ Export button clicked');
                this.exportAllPages();
            });
        }

        console.log('✅ EndUserController: Event listeners initialized');
        console.log('📋 Button element:', this.elements.browsePresetsBtn);
        console.log('📋 Modal element:', this.elements.presetModal);
    }

    /**
     * Set component references
     */
    setComponents(formGenerator, contentSlotRenderer) {
        this.formGenerator = formGenerator;
        this.contentSlotRenderer = contentSlotRenderer;
        console.log('✅ EndUserController: Components linked');
    }

    /**
     * Show preset selection modal with available presets
     */
    async showPresetModal() {
        try {
            console.log('📂 showPresetModal() called - Starting preset loading...');
            console.log('📂 Modal element state:', {
                exists: !!this.elements.presetModal,
                currentDisplay: this.elements.presetModal?.style.display
            });

            // Fetch presets from Wix CMS
            console.log('🔄 Fetching presets from Wix CMS...');
            const presets = await this.app.presetPageManager.getAllPresets();
            console.log(`✅ Fetched ${presets.length} presets from CMS`);

            if (presets.length === 0) {
                this.elements.presetList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <h3 class="empty-state-title">No Presets Available</h3>
                        <p class="empty-state-description">Please create presets using the designer interface first.</p>
                    </div>
                `;
            } else {
                // Generate preset list
                this.elements.presetList.innerHTML = presets.map(preset => `
                    <div class="preset-item" data-preset-id="${preset.presetId}">
                        <div class="preset-item-header">
                            <span class="preset-item-name">${preset.presetName}</span>
                            <span class="preset-item-badge">${preset.pageCount} pages</span>
                        </div>
                        <p class="preset-item-description">${preset.description || 'No description provided'}</p>
                    </div>
                `).join('');

                // Add click handlers to preset items
                this.elements.presetList.querySelectorAll('.preset-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const presetId = item.dataset.presetId;
                        this.loadPreset(presetId);
                        this.hidePresetModal();
                    });
                });
            }

            console.log('🎨 Setting modal display to block...');
            this.elements.presetModal.style.display = 'block';
            console.log('✅ Preset modal shown with', presets.length, 'presets');
            console.log('📂 Modal display after setting:', this.elements.presetModal.style.display);

        } catch (error) {
            console.error('❌ Error loading presets:', error);
            console.error('❌ Error stack:', error.stack);
            alert('Failed to load presets: ' + error.message);
        }
    }

    /**
     * Hide preset selection modal
     */
    hidePresetModal() {
        this.elements.presetModal.style.display = 'none';
    }

    /**
     * Load presets into fullscreen dropdown on initialization
     */
    async loadPresetsIntoFullscreenDropdown() {
        try {
            console.log('🔄 Loading presets into fullscreen dropdown...');
            const presets = await this.app.presetPageManager.getAllPresets();
            console.log(`✅ Fetched ${presets.length} presets for fullscreen selector`);

            if (presets.length === 0) {
                this.elements.fullscreenPresetDropdown.innerHTML = `
                    <option value="">No presets available</option>
                `;
                this.elements.fullscreenLoadBtn.disabled = true;
            } else {
                this.elements.fullscreenPresetDropdown.innerHTML = `
                    <option value="">Choose a preset...</option>
                    ${presets.map(preset => `
                        <option value="${preset.presetId}">${preset.presetName} (${preset.pageCount} pages)</option>
                    `).join('')}
                `;
            }
        } catch (error) {
            console.error('❌ Error loading presets into fullscreen dropdown:', error);
            this.elements.fullscreenPresetDropdown.innerHTML = `
                <option value="">Error loading presets</option>
            `;
        }
    }

    /**
     * Load preset from fullscreen selector and transition to main UI
     */
    async loadPresetFromFullscreen(presetId) {
        try {
            console.log(`📂 Loading preset from fullscreen: ${presetId}`);

            // Load the preset (same as loadPreset but with UI transition)
            await this.loadPreset(presetId);
            console.log('✅ Preset loaded successfully');

            // Hide fullscreen selector and show main container
            console.log('🔄 Hiding fullscreen selector...');
            if (this.elements.fullscreenPresetSelector) {
                this.elements.fullscreenPresetSelector.classList.add('hidden');
                console.log('✅ Fullscreen selector hidden');
            } else {
                console.error('❌ fullscreenPresetSelector element not found');
            }

            console.log('🔄 Showing main container...');
            if (this.elements.mainContainer) {
                this.elements.mainContainer.style.display = 'flex';
                console.log('✅ Main container shown');
            } else {
                console.error('❌ mainContainer element not found');
            }

            console.log('✅ Transitioned from fullscreen selector to main UI');
        } catch (error) {
            console.error('❌ Error loading preset from fullscreen:', error);
            console.error('❌ Error stack:', error.stack);
            alert('Failed to load preset: ' + error.message);
        }
    }

    /**
     * Load a preset and display first page
     */
    async loadPreset(presetId) {
        try {
            console.log(`📂 Loading preset: ${presetId}`);

            // Fetch preset data from Wix CMS
            this.currentPresetData = await this.app.presetPageManager.getPresetFromCMS(presetId);
            this.currentPresetId = presetId;

            // Parse all pages and namespace slotIds
            this.loadedPages = [];
            for (let i = 1; i <= 5; i++) {
                const pageField = `page${i}`;
                if (this.currentPresetData[pageField]) {
                    try {
                        const pageData = JSON.parse(this.currentPresetData[pageField]);

                        // ✅ Add presetName to pageData (required by PresetManager validation)
                        pageData.presetName = this.currentPresetData.presetName || 'Untitled Preset';

                        // ✅ Phase 1A: NAMESPACE slotIds by page number
                        // Namespace legacy contentSlots
                        if (pageData.contentSlots && Array.isArray(pageData.contentSlots)) {
                            pageData.contentSlots = pageData.contentSlots.map(slot => ({
                                ...slot,
                                originalSlotId: slot.slotId,  // Keep original for reference
                                slotId: `page${i}-${slot.slotId}`  // Add page prefix
                            }));
                            console.log(`✅ Namespaced ${pageData.contentSlots.length} legacy slots for page ${i}`);
                        }

                        // ✅ NEW: Namespace cell slotIds in grid data
                        if (pageData.grid?.snapshot?.layout?.cells) {
                            // 🔍 DEBUG: Log cells BEFORE namespacing
                            const cellsBeforeNamespace = pageData.grid.snapshot.layout.cells.filter(c => c.editable);
                            console.log(`🔍 DEBUG: Before namespacing, found ${cellsBeforeNamespace.length} editable cells:`,
                                cellsBeforeNamespace.map(c => ({
                                    id: c.id,
                                    editable: c.editable,
                                    slotId: c.slotId,
                                    hasSlotConfig: !!c.slotConfig
                                }))
                            );

                            pageData.grid.snapshot.layout.cells = pageData.grid.snapshot.layout.cells.map(cell => {
                                if (cell.editable && cell.slotId) {
                                    return {
                                        ...cell,
                                        originalSlotId: cell.slotId,  // Keep original for reference
                                        slotId: `page${i}-${cell.slotId}`  // Add page prefix
                                    };
                                }
                                return cell;
                            });

                            // 🔍 DEBUG: Log cells AFTER namespacing
                            const cellsAfterNamespace = pageData.grid.snapshot.layout.cells.filter(c => c.editable);
                            console.log(`🔍 DEBUG: After namespacing, found ${cellsAfterNamespace.length} editable cells:`,
                                cellsAfterNamespace.map(c => ({
                                    id: c.id,
                                    editable: c.editable,
                                    slotId: c.slotId,
                                    hasSlotConfig: !!c.slotConfig
                                }))
                            );

                            const namespacedCount = pageData.grid.snapshot.layout.cells.filter(c => c.editable).length;
                            console.log(`✅ Namespaced ${namespacedCount} editable cell slotIds for page ${i}`);
                        }

                        this.loadedPages.push(pageData);
                    } catch (e) {
                        console.warn(`⚠️ Could not parse ${pageField}:`, e);
                    }
                }
            }

            console.log(`✅ Loaded ${this.loadedPages.length} pages with namespaced slotIds`);

            // Update UI
            this.elements.presetName.textContent = this.currentPresetData.presetName;
            this.elements.presetName.style.display = 'block';
            // Note: presetSelector element removed in favor of fullscreen selector
            this.elements.pageNav.style.display = 'flex';
            this.elements.exportBtn.disabled = false;

            // Load first page
            this.currentPageIndex = 0;
            await this.renderCurrentPage();

            console.log('✅ Preset loaded successfully');

        } catch (error) {
            console.error('❌ Error loading preset:', error);
            alert('Failed to load preset: ' + error.message);
        }
    }

    /**
     * Render the current page (canvas + form)
     * ✅ NEW APPROACH: Direct cell rendering with user data
     */
    async renderCurrentPage() {
        if (!this.currentPresetId) {
            console.error('❌ No preset loaded');
            return;
        }

        const pageNumber = this.currentPageIndex + 1; // Convert 0-based to 1-based

        console.log(`🎨 Rendering page ${pageNumber}/${this.loadedPages.length}`);

        // Update page indicator
        this.updatePageNavigation();

        // ========== UNIFIED CELL-BASED APPROACH ==========

        // Step 1: Load page using PresetPageManager (same as index.html)
        // This loads the page directly without namespacing - cells will have editable properties!
        const pageData = await this.app.presetPageManager.loadPage(this.currentPresetId, pageNumber);
        console.log('✅ Page data loaded into app');

        // Step 2: Get editable cells and namespace their slotIds AFTER deserialization
        const allCells = this.app.grid.getAllCells();
        const editableCells = allCells.filter(cell => cell.editable);
        console.log(`📝 Found ${editableCells.length} editable cells BEFORE namespacing`);

        // ✅ Namespace slotIds in live cell objects (to avoid collisions between pages)
        editableCells.forEach(cell => {
            if (cell.slotId) {
                const originalSlotId = cell.slotId;
                cell.slotId = `page${pageNumber}-${originalSlotId}`;
                console.log(`🔄 Namespaced cell ${cell.id}: ${originalSlotId} → ${cell.slotId}`);
            }
        });

        console.log(`✅ Namespaced ${editableCells.length} editable cell slotIds`);

        editableCells.forEach(cell => {
            const userData = this.contentData[cell.slotId];
            if (userData) {
                this.applyUserContentToCell(cell, userData);
                console.log(`✅ Applied user data to cell ${cell.id} (${cell.slotId})`);
            }
        });

        // Step 3: Render grid normally (respects layers, no overlay needed!)
        this.app.render();
        console.log('✅ Grid rendered with user content');

        // ========== FORM GENERATION ==========

        // Generate form from editable cells
        this.generateFormForEditableCells(editableCells);

        // Pre-populate form with saved data
        this.prePopulateFormFromCells(editableCells);

        console.log('✅ Page rendered');
    }

    /**
     * ✅ NEW: Apply user content directly to cell
     * Updates cell properties with user-provided content
     * @param {GridCell} cell - Cell to update
     * @param {string} userData - User-provided content (text or media URL)
     */
    applyUserContentToCell(cell, userData) {
        // Determine cell type and apply content appropriately
        // ✅ Check cell.type (not instanceof which doesn't work)
        if (cell.type === 'main-text') {
            // Main text cell - update text
            cell.setText(userData);
        } else if (cell.type === 'content') {
            // Content cell - check content type
            if (cell.contentType === 'text' || (cell.content && cell.content.text !== undefined)) {
                // Text content - update text property
                if (!cell.content) {
                    cell.setContentType('text');
                }
                cell.content.text = userData;
            } else if (cell.contentType === 'media' || (cell.content && cell.content.media !== undefined)) {
                // Media content - load image or video
                if (!cell.content) {
                    cell.setContentType('media');
                }

                // ✅ PRESERVE existing cell content properties (fillMode, scale, padding, position)
                // These come from the original designer cell and control how media fills/crops
                const existingFillMode = cell.content.fillMode;
                const existingScale = cell.content.scale;
                const existingPadding = cell.content.padding;
                const existingPositionH = cell.content.positionH;
                const existingPositionV = cell.content.positionV;

                // Apply fitMode from slotConfig if available (overrides existing)
                // Mapping: 'cover' -> 'fill', 'free' -> 'fit'
                let fillMode = existingFillMode || 'fill'; // Default to fill (crop to fit)
                if (cell.slotConfig?.constraints?.fitMode) {
                    fillMode = cell.slotConfig.constraints.fitMode === 'cover' ? 'fill' : 'fit';
                }

                // Update media URL
                cell.content.mediaUrl = userData;

                // Detect media type from URL (both data URLs and regular URLs)
                const isVideo = userData && (
                    userData.includes('data:video/') || 
                    userData.includes('.mp4') || 
                    userData.includes('.webm')
                );

                if (isVideo) {
                    // Load video
                    const video = document.createElement('video');
                    video.src = userData;
                    video.preload = 'metadata';
                    video.crossOrigin = 'anonymous';
                    video.autoplay = true;
                    video.loop = true;
                    video.muted = true;
                    video.controls = false;

                    video.addEventListener('loadedmetadata', () => {
                        cell.content.media = video;
                        cell.content.mediaType = 'video';
                        // ✅ Restore/apply content properties
                        cell.content.fillMode = fillMode;
                        cell.content.scale = existingScale !== undefined ? existingScale : 1.0;
                        cell.content.padding = existingPadding !== undefined ? existingPadding : 0; // No padding for fill/crop
                        cell.content.positionH = existingPositionH || 'center';
                        cell.content.positionV = existingPositionV || 'middle';
                        
                        // Play video
                        video.play().catch(err => {
                            console.warn('⚠️ Autoplay prevented, video will play when visible:', err);
                        });
                        
                        this.app.render();
                    });

                    video.addEventListener('error', (e) => {
                        console.error('❌ Failed to load video:', userData, e);
                    });
                } else {
                    // Load image (including GIF)
                    const img = new Image();
                    img.crossOrigin = 'anonymous';

                    img.onload = () => {
                        cell.content.media = img;
                        cell.content.mediaType = 'image';
                        // ✅ Restore/apply content properties
                        cell.content.fillMode = fillMode;
                        cell.content.scale = existingScale !== undefined ? existingScale : 1.0;
                        cell.content.padding = existingPadding !== undefined ? existingPadding : 0; // No padding for fill/crop
                        cell.content.positionH = existingPositionH || 'center';
                        cell.content.positionV = existingPositionV || 'middle';
                        this.app.render();
                    };

                    img.onerror = (e) => {
                        console.error('❌ Failed to load image:', userData, e);
                    };

                    img.src = userData;
                }
            }
        }
    }

    /**
     * ✅ NEW: Generate form from editable cells
     * Converts cell-based editable slots to form fields
     * @param {Array} editableCells - Array of cells with editable=true
     */
    generateFormForEditableCells(editableCells) {
        // Convert cells to slot format expected by FormGenerator
        const slots = editableCells.map(cell => {
            // Determine slot type from cell
            let slotType = 'text';
            // ✅ Check cell.type (not instanceof which doesn't work)
            if (cell.type === 'content') {
                if (cell.contentType === 'media' || (cell.content && cell.content.media !== undefined)) {
                    slotType = 'image';
                }
            }

            return {
                slotId: cell.slotId,
                type: slotType,
                fieldLabel: cell.slotConfig?.fieldLabel || `Cell ${cell.id}`,
                fieldDescription: cell.slotConfig?.fieldDescription || '',
                placeholder: cell.slotConfig?.placeholder || `Enter ${slotType}...`,
                hint: cell.slotConfig?.hint || '',
                constraints: cell.slotConfig?.constraints || {}
            };
        });

        const pageSlotsData = {
            pageName: this.loadedPages[this.currentPageIndex]?.pageName || 'Page',
            slots: slots
        };

        this.formGenerator.generateForm(pageSlotsData, (slotId, value) => {
            this.handleContentUpdate(slotId, value);
        });
    }

    /**
     * ✅ NEW: Pre-populate form from editable cells
     * @param {Array} editableCells - Array of cells with editable=true
     */
    prePopulateFormFromCells(editableCells) {
        const valuesToSet = {};

        editableCells.forEach(cell => {
            const slotId = cell.slotId;

            // Priority 1: Use saved user data from localStorage/contentData
            if (this.contentData[slotId] !== undefined && this.contentData[slotId] !== null && this.contentData[slotId] !== '') {
                valuesToSet[slotId] = this.contentData[slotId];
                console.log(`📝 Pre-populating ${slotId} with saved data`);
            }
            // Priority 2: Use actual cell content from preset
            else {
                let cellContent = null;
                
                // For text cells (MainTextCell)
                if (cell.type === 'main-text' && cell.text) {
                    cellContent = cell.text;
                }
                // For content cells with text content
                else if (cell.type === 'content' && cell.contentType === 'text' && cell.content?.text) {
                    cellContent = cell.content.text;
                }
                // For content cells with media content
                else if (cell.type === 'content' && cell.contentType === 'media' && cell.content?.imageURL) {
                    cellContent = cell.content.imageURL;
                }
                
                if (cellContent) {
                    valuesToSet[slotId] = cellContent;
                    console.log(`📝 Pre-populating ${slotId} with cell content`);
                }
                // Priority 3: Fallback to slotConfig.defaultContent if no cell content
                else if (cell.slotConfig?.defaultContent) {
                    valuesToSet[slotId] = cell.slotConfig.defaultContent;
                    console.log(`📝 Pre-populating ${slotId} with default content`);
                }
            }
        });

        // Apply values to form
        if (Object.keys(valuesToSet).length > 0) {
            this.formGenerator.setValues(valuesToSet);
            console.log(`✅ Pre-populated ${Object.keys(valuesToSet).length} field(s)`);
        }
    }

    /**
     * LEGACY: Hide cells that have content slots with user data
     * This creates "holes" in the designer layout where user content will be overlaid
     * @param {Array} contentSlots - Array of content slot definitions
     * @deprecated Use applyUserContentToCell() instead
     */
    hideFilledContentSlots(contentSlots) {
        if (!contentSlots || !this.app.grid) {
            return;
        }

        const allCells = this.app.grid.getAllCells();

        contentSlots.forEach(slot => {
            // Find cell by sourceContentId
            const cell = allCells.find(c => c.contentId === slot.sourceContentId);
            if (!cell) {
                return; // Cell not found
            }

            // ✅ CRITICAL FIX: Different hiding logic for main text vs content cells
            const isMainTextCell = cell.constructor.name === 'MainTextCell';
            const userValue = this.contentData[slot.slotId];

            if (isMainTextCell) {
                // Main text cells: ALWAYS hide if marked editable (user replaces, not adds to)
                // Hide ALL main text cells because they're split ("WIX", "CITY", "GUIDES")
                console.log('👻 Detected MainTextCell - hiding ALL main text cells');
                allCells.forEach(c => {
                    if (c.constructor.name === 'MainTextCell') {
                        c.visible = false;
                        console.log(`   👻 Hidden MainTextCell: "${c.text}" (${c.contentId})`);
                    }
                });
            } else {
                // Content cells: Only hide if user has provided content
                if (userValue) {
                    cell.visible = false;
                    console.log(`👻 Hidden cell with contentId: ${slot.sourceContentId} for slot: ${slot.slotId}`);
                }
            }
        });
    }

    /**
     * ✅ Phase 1C: Pre-populate form with saved data and defaults
     * @param {Array} contentSlots - Array of content slot definitions
     */
    prePopulateForm(contentSlots) {
        if (!contentSlots || contentSlots.length === 0) {
            return;
        }

        // Build values object for pre-population
        const valuesToSet = {};

        contentSlots.forEach(slot => {
            const slotId = slot.slotId;

            // Priority 1: Use saved user data from localStorage/contentData
            if (this.contentData[slotId] !== undefined && this.contentData[slotId] !== null && this.contentData[slotId] !== '') {
                valuesToSet[slotId] = this.contentData[slotId];
                console.log(`📝 Pre-populating ${slotId} with saved data`);
            }
            // Priority 2: Use designer defaults from slot definition
            else if (slot.defaultContent) {
                if (slot.type === 'text' && slot.defaultContent.text) {
                    valuesToSet[slotId] = slot.defaultContent.text;
                    console.log(`📝 Pre-populating ${slotId} with default: "${slot.defaultContent.text}"`);
                } else if (slot.type === 'image' && slot.defaultContent.src) {
                    valuesToSet[slotId] = slot.defaultContent.src;
                    console.log(`📝 Pre-populating ${slotId} with default image`);
                }
            }
        });

        // Apply values to form
        if (Object.keys(valuesToSet).length > 0) {
            this.formGenerator.setValues(valuesToSet);
            console.log(`✅ Pre-populated ${Object.keys(valuesToSet).length} field(s)`);
        }
    }

    /**
     * Handle content update from form
     * Stores content in memory and re-renders canvas (NOT saved to localStorage)
     */
    handleContentUpdate(slotId, value) {
        console.log(`📝 Content update: ${slotId}`, value);

        // Store content data in memory (will be lost on page reload)
        this.contentData[slotId] = value;

        // Re-render canvas with DEBOUNCE (300ms)
        this.debouncedRender();
    }

    /**
     * Update page navigation thumbnails
     */
    updatePageNavigation() {
        const totalPages = this.loadedPages.length;

        // Generate page thumbnails if not already created
        if (this.elements.pageThumbs.children.length === 0) {
            this.loadedPages.forEach((pageData, index) => {
                const thumb = document.createElement('div');
                thumb.className = 'enduser-page-thumb';
                if (index === this.currentPageIndex) {
                    thumb.classList.add('active');
                }
                thumb.dataset.pageIndex = index;

                thumb.innerHTML = `
                    <div class="thumb-preview">
                        <div class="thumb-placeholder">
                            <span class="thumb-number">${index + 1}</span>
                        </div>
                    </div>
                    <span class="thumb-label">${pageData.pageName || `Page ${index + 1}`}</span>
                `;

                thumb.addEventListener('click', () => {
                    this.navigateToPage(index);
                });

                this.elements.pageThumbs.appendChild(thumb);
            });
        } else {
            // Update active state
            Array.from(this.elements.pageThumbs.children).forEach((thumb, index) => {
                if (index === this.currentPageIndex) {
                    thumb.classList.add('active');
                } else {
                    thumb.classList.remove('active');
                }
            });
        }
    }

    /**
     * Navigate to a specific page
     */
    async navigateToPage(pageIndex) {
        if (pageIndex >= 0 && pageIndex < this.loadedPages.length && pageIndex !== this.currentPageIndex) {
            this.currentPageIndex = pageIndex;
            await this.renderCurrentPage();
            console.log(`📄 Navigated to page ${this.currentPageIndex + 1}`);
        }
    }

    /**
     * Navigate to previous page
     */
    async navigateToPreviousPage() {
        if (this.currentPageIndex > 0) {
            this.currentPageIndex--;
            await this.renderCurrentPage();
            console.log(`⬅️ Navigated to page ${this.currentPageIndex + 1}`);
        }
    }

    /**
     * Navigate to next page
     */
    async navigateToNextPage() {
        if (this.currentPageIndex < this.loadedPages.length - 1) {
            this.currentPageIndex++;
            await this.renderCurrentPage();
            console.log(`➡️ Navigated to page ${this.currentPageIndex + 1}`);
        }
    }

    /**
     * Export all pages as PNG images
     * ✅ NEW: Uses cell-based rendering
     */
    async exportAllPages() {
        try {
            console.log('📥 Starting export...');

            const exportedImages = [];
            const originalPageIndex = this.currentPageIndex;

            // Render and export each page
            for (let i = 0; i < this.loadedPages.length; i++) {
                console.log(`📥 Exporting page ${i + 1}/${this.loadedPages.length}...`);

                this.currentPageIndex = i;
                const pageData = this.loadedPages[i];

                // Load page into app
                await this.app.presetManager.deserializeState(pageData);

                // Apply user content to editable cells
                const allCells = this.app.grid.getAllCells();
                const editableCells = allCells.filter(cell => cell.editable);
                editableCells.forEach(cell => {
                    const userData = this.contentData[cell.slotId];
                    if (userData) {
                        this.applyUserContentToCell(cell, userData);
                    }
                });

                // Render grid normally
                this.app.render();

                // Wait for render to complete
                await new Promise(resolve => setTimeout(resolve, 500));

                // Export canvas to PNG
                const dataURL = this.app.canvasManager.canvas.toDataURL('image/png');
                exportedImages.push({
                    pageNumber: i + 1,
                    pageName: pageData.pageName,
                    dataURL: dataURL
                });
            }

            // Download all images
            exportedImages.forEach(({ pageNumber, pageName, dataURL }) => {
                const link = document.createElement('a');
                link.download = `${this.currentPresetData.presetName}-page-${pageNumber}.png`;
                link.href = dataURL;
                link.click();
            });

            // Restore original page
            this.currentPageIndex = originalPageIndex;
            await this.renderCurrentPage();

            alert(`✅ Successfully exported ${exportedImages.length} pages!`);
            console.log('✅ Export complete');

        } catch (error) {
            console.error('❌ Export failed:', error);
            alert('Export failed: ' + error.message);
        }
    }

    /**
     * Get current page data (for debugging)
     */
    getCurrentPageData() {
        return this.loadedPages[this.currentPageIndex];
    }

    /**
     * Get all content data (for debugging)
     */
    getAllContentData() {
        return this.contentData;
    }

    /**
     * Clear all saved content data and reset to designer defaults
     * This performs a hard reset:
     * - Clears all user-provided content
     * - Clears localStorage
     * - Resets form to designer preset values
     * - Reloads canvas with original preset data
     */
    async clearContentData() {
        // Clear content data
        this.contentData = {};
        localStorage.removeItem(this.localStorageKey);
        console.log('🗑️ Cleared all content data and localStorage');

        // Re-render current page to restore designer defaults
        // This will automatically populate form with defaultContent from cells
        if (this.loadedPages.length > 0) {
            await this.renderCurrentPage();
            console.log('✅ Reset to designer preset defaults');
        }
    }

    /**
     * Hard reset on page reload
     * Call this on initialization to clear any saved state and start fresh
     */
    async resetToPresetDefaults() {
        await this.clearContentData();
    }
}
