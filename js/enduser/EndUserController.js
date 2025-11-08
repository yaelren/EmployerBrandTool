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

        // ✅ Phase 1A: Load saved content data from localStorage
        this.loadContentDataFromLocalStorage();

        this.initializeEventListeners();

        // Load presets into fullscreen dropdown
        this.loadPresetsIntoFullscreenDropdown();
    }

    /**
     * ✅ Phase 1A: Load content data from localStorage
     */
    loadContentDataFromLocalStorage() {
        try {
            const saved = localStorage.getItem(this.localStorageKey);
            if (saved) {
                this.contentData = JSON.parse(saved);
                console.log('✅ Loaded saved content data from localStorage');
            }
        } catch (error) {
            console.warn('⚠️ Failed to load from localStorage:', error);
        }
    }

    /**
     * ✅ Phase 1A: Save content data to localStorage
     */
    saveContentDataToLocalStorage() {
        try {
            localStorage.setItem(this.localStorageKey, JSON.stringify(this.contentData));
            console.log('💾 Auto-saved to localStorage');
        } catch (error) {
            console.error('❌ Failed to save to localStorage:', error);
        }
    }

    /**
     * ✅ Phase 1B: Create debounced render function
     * Uses hide-then-overlay approach for correct rendering
     */
    debouncedRender() {
        // Clear existing timer
        if (this.renderDebounceTimer) {
            clearTimeout(this.renderDebounceTimer);
        }

        // Set new timer (300ms delay)
        this.renderDebounceTimer = setTimeout(() => {
            const pageData = this.loadedPages[this.currentPageIndex];
            if (pageData) {
                // Hide cells with filled content slots
                this.hideFilledContentSlots(pageData.contentSlots);

                // Render designer layout (creates "holes" where user content will go)
                this.app.render();

                // Overlay user content in bounded regions
                this.contentSlotRenderer.renderUserContent(pageData.contentSlots, this.contentData);

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
                        if (pageData.contentSlots && Array.isArray(pageData.contentSlots)) {
                            pageData.contentSlots = pageData.contentSlots.map(slot => ({
                                ...slot,
                                originalSlotId: slot.slotId,  // Keep original for reference
                                slotId: `page${i}-${slot.slotId}`  // Add page prefix
                            }));
                            console.log(`✅ Namespaced ${pageData.contentSlots.length} slots for page ${i}`);
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
     * Uses hide-then-overlay approach for correct rendering
     */
    async renderCurrentPage() {
        const pageData = this.loadedPages[this.currentPageIndex];

        if (!pageData) {
            console.error('❌ No page data at index:', this.currentPageIndex);
            return;
        }

        console.log(`🎨 Rendering page ${this.currentPageIndex + 1}/${this.loadedPages.length}`);
        console.log(`📦 Page has ${pageData.contentSlots?.length || 0} content slots`);

        // Update page indicator
        this.updatePageNavigation();

        // ========== HIDE-THEN-OVERLAY APPROACH ==========

        // Step 1: Load page into app (same as designer mode)
        await this.app.presetManager.deserializeState(pageData);
        console.log('✅ Page data loaded into app');

        // Step 2: Hide cells that have editable content slots with user data
        this.hideFilledContentSlots(pageData.contentSlots);

        // Step 3: Render designer layout (creates "holes" where user content will go)
        this.app.render();
        console.log('✅ Designer layout rendered');

        // Step 4: Overlay user content in bounded regions (fills the holes)
        this.contentSlotRenderer.renderUserContent(pageData.contentSlots, this.contentData);
        console.log('✅ User content overlaid');

        // ========== FORM GENERATION ==========

        // Generate form for this page's content slots
        const pageSlotsData = {
            pageName: pageData.pageName,
            slots: pageData.contentSlots || []
        };
        this.formGenerator.generateForm(pageSlotsData, (slotId, value) => {
            this.handleContentUpdate(slotId, value);
        });

        // ✅ Phase 1C: PRE-POPULATE form with saved data
        this.prePopulateForm(pageData.contentSlots);

        console.log('✅ Page rendered');
    }

    /**
     * Hide cells that have content slots with user data
     * This creates "holes" in the designer layout where user content will be overlaid
     * @param {Array} contentSlots - Array of content slot definitions
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
     * ✅ Phase 1A & 1B: Auto-save + Debounced rendering
     */
    handleContentUpdate(slotId, value) {
        console.log(`📝 Content update: ${slotId}`, value);

        // Store content data
        this.contentData[slotId] = value;

        // ✅ Phase 1A: AUTO-SAVE to localStorage
        this.saveContentDataToLocalStorage();

        // ✅ Phase 1B: Re-render canvas with DEBOUNCE (300ms)
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
     */
    async exportAllPages() {
        try {
            console.log('📥 Starting export...');

            const exportedImages = [];
            const originalPageIndex = this.currentPageIndex;

            // Render and export each page
            for (let i = 0; i < this.loadedPages.length; i++) {
                console.log(`📥 Exporting page ${i + 1}/${this.loadedPages.length}...`);

                // Render page using hide-then-overlay approach
                this.currentPageIndex = i;
                const pageData = this.loadedPages[i];

                // Load page into app
                await this.app.presetManager.deserializeState(pageData);

                // Hide filled content slots
                this.hideFilledContentSlots(pageData.contentSlots);

                // Render designer layout
                this.app.render();

                // Overlay user content
                this.contentSlotRenderer.renderUserContent(pageData.contentSlots, this.contentData);

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
     * Clear all saved content data (for debugging)
     */
    clearContentData() {
        this.contentData = {};
        localStorage.removeItem(this.localStorageKey);
        console.log('🗑️ Cleared all content data and localStorage');

        // Clear all form inputs
        const textInputs = document.querySelectorAll('.slot-input-text');
        textInputs.forEach(input => {
            input.value = '';
        });

        const textareas = document.querySelectorAll('.slot-input-textarea');
        textareas.forEach(textarea => {
            textarea.value = '';
        });

        console.log('🗑️ Cleared all form inputs');

        // Re-render current page
        if (this.loadedPages.length > 0) {
            this.debouncedRender();
        }
    }
}
