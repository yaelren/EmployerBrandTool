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
    constructor(canvasManager, presetPageManager, wixAPI) {
        this.canvasManager = canvasManager;
        this.presetPageManager = presetPageManager;
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
            canvas: document.getElementById('chatooly-canvas')
        };

        // ✅ Phase 1A: Load saved content data from localStorage
        this.loadContentDataFromLocalStorage();

        this.initializeEventListeners();
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
                this.contentSlotRenderer.renderLockedLayout(pageData, this.contentData);
                console.log('🎨 Canvas re-rendered (debounced)');
            }
        }, 300);
    }

    /**
     * Initialize all event listeners
     */
    initializeEventListeners() {
        // Preset selection
        if (this.elements.browsePresetsBtn) {
            console.log('🔗 Attaching click listener to Browse Presets button');
            this.elements.browsePresetsBtn.addEventListener('click', (e) => {
                console.log('🖱️ Browse Presets button clicked!');
                e.preventDefault();
                e.stopPropagation();
                this.showPresetModal();
            });
        } else {
            console.error('❌ Browse Presets button not found in DOM!');
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
            const presets = await this.presetPageManager.getAllPresets();
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
     * Load a preset and display first page
     */
    async loadPreset(presetId) {
        try {
            console.log(`📂 Loading preset: ${presetId}`);

            // Fetch preset data from Wix CMS
            this.currentPresetData = await this.presetPageManager.getPresetFromCMS(presetId);
            this.currentPresetId = presetId;

            // Parse all pages and namespace slotIds
            this.loadedPages = [];
            for (let i = 1; i <= 5; i++) {
                const pageField = `page${i}`;
                if (this.currentPresetData[pageField]) {
                    try {
                        const pageData = JSON.parse(this.currentPresetData[pageField]);

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
            this.elements.presetSelector.style.display = 'none';
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

        // Render canvas with locked layout
        await this.contentSlotRenderer.renderLockedLayout(pageData, this.contentData);

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

                // Render page
                this.currentPageIndex = i;
                const pageData = this.loadedPages[i];
                await this.contentSlotRenderer.renderLockedLayout(pageData, this.contentData);

                // Wait for render to complete
                await new Promise(resolve => setTimeout(resolve, 500));

                // Export canvas to PNG
                const dataURL = this.canvasManager.canvas.toDataURL('image/png');
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
}
