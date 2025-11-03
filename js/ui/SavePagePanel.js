/**
 * SavePagePanel - Inline panel for saving page to preset with editable field configuration
 * 
 * Workflow:
 * 1. Click "Save Page to Preset" button to expand panel in sidebar
 * 2. Display instruction: "Click on canvas cells to make editable"
 * 3. Click canvas cells to open editable cell configuration on the side
 * 4. Configure field name and description for each editable cell
 * 5. Choose new preset or existing preset (first section after expanding)
 * 6. Save page to CMS
 */

class SavePagePanel {
    constructor(app) {
        this.app = app;
        this.presetPageManager = app.presetPageManager;
        this.contentSlotManager = app.presetPageManager.contentSlotManager;

        this.container = null;
        this.isExpanded = false;
        
        // Content slot configuration panel
        this.configPanel = new ContentSlotConfigPanel(app);

        // Track configured slots for this page
        this.configuredSlots = []; // Array of slot objects
        this.configuredCellIds = new Set(); // Set of cell IDs that have slots

        // Currently selected cell for editing
        this.selectedCellId = null;

        // Canvas click handler bound for adding/removing
        this.canvasClickHandler = this.handleCanvasClick.bind(this);
    }

    /**
     * Render the save page panel in the given container
     * @param {HTMLElement} container - Container element
     */
    render(container) {
        this.container = container;
        
        // Initially collapsed
        container.innerHTML = `
            <div class="save-page-panel-content" style="display: none;">
                <!-- Instruction -->
                <div class="save-page-instruction">
                    <p>👆 Click on canvas cells to make editable</p>
                </div>

                <!-- Choose Preset Section (First) -->
                <div class="save-page-preset-choice">
                    <h4>Choose Preset</h4>
                    <div class="preset-radio-group">
                        <label>
                            <input type="radio" name="save-preset-type" value="new" checked>
                            Create New Preset
                        </label>
                        <label>
                            <input type="radio" name="save-preset-type" value="existing">
                            Add to Existing
                        </label>
                    </div>

                    <!-- New Preset Name -->
                    <div id="save-new-preset-container">
                        <input type="text" id="save-new-preset-name" class="preset-name-input" placeholder="Enter preset name..." />
                    </div>

                    <!-- Existing Preset Dropdown -->
                    <div id="save-existing-preset-container" style="display: none;">
                        <select id="save-existing-preset-select" class="preset-dropdown">
                            <option value="">-- Select Preset --</option>
                        </select>
                    </div>
                </div>

                <!-- Editable Fields List -->
                <div class="save-page-editable-list">
                    <h4>Editable Fields</h4>
                    <div id="save-editable-fields-list" class="editable-fields-container">
                        <p class="no-fields-message">No editable fields yet</p>
                    </div>
                </div>

                <!-- Page Settings -->
                <div class="save-page-settings-section">
                    <h4>Page Settings</h4>
                    <div class="page-settings-row">
                        <div class="page-setting-field">
                            <label>Page Position</label>
                            <select id="save-page-position" class="preset-dropdown">
                                <option value="1">Page 1</option>
                                <option value="2">Page 2</option>
                                <option value="3">Page 3</option>
                                <option value="4">Page 4</option>
                                <option value="5">Page 5</option>
                            </select>
                        </div>
                        <div class="page-setting-field">
                            <label>Page Name</label>
                            <input type="text" id="save-page-name" class="preset-name-input" placeholder="e.g., Hero Banner" value="Page 1" />
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="save-page-actions">
                    <button type="button" class="preset-save-page-action-btn">Save Page</button>
                    <button type="button" class="preset-cancel-page-action-btn">Cancel</button>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        if (!this.container) return;

        // Preset type radio buttons
        const radioButtons = this.container.querySelectorAll('input[name="save-preset-type"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', (e) => this.handlePresetTypeChange(e.target.value));
        });

        // Page position select - auto-update page name
        const pagePositionSelect = this.container.querySelector('#save-page-position');
        if (pagePositionSelect) {
            pagePositionSelect.addEventListener('change', (e) => {
                const pageNumber = e.target.value;
                const pageNameInput = this.container.querySelector('#save-page-name');
                if (pageNameInput && pageNameInput.value.match(/^Page \d+$/)) {
                    pageNameInput.value = `Page ${pageNumber}`;
                }
            });
        }

        // Field name/label inputs - update config on change
        const fieldNameInput = this.container.querySelector('#save-field-name');
        const fieldLabelInput = this.container.querySelector('#save-field-label');
        
        if (fieldNameInput) {
            fieldNameInput.addEventListener('input', (e) => {
                if (this.selectedCellId) {
                    this.updateSelectedCellConfig('fieldName', e.target.value);
                }
            });
        }

        if (fieldLabelInput) {
            fieldLabelInput.addEventListener('input', (e) => {
                if (this.selectedCellId) {
                    this.updateSelectedCellConfig('fieldLabel', e.target.value);
                }
            });
        }

        // Remove editable button
        const removeBtn = this.container.querySelector('.preset-cell-remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => this.removeEditableCell());
        }

        // Save button
        const saveBtn = this.container.querySelector('.preset-save-page-action-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.handleSave());
        }

        // Cancel button
        const cancelBtn = this.container.querySelector('.preset-cancel-page-action-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hide());
        }
    }

    /**
     * Show/expand the panel
     */
    async show() {
        // Reset content slots
        this.configuredSlots = [];
        this.configuredCellIds.clear();
        this.selectedCellId = null;

        // Load existing presets for dropdown
        await this.loadExistingPresets();

        // Show panel
        const content = this.container.querySelector('.save-page-panel-content');
        if (content) {
            content.style.display = 'block';
        }

        // Hide cell editor initially
        const cellEditor = this.container.querySelector('#save-cell-editor');
        if (cellEditor) {
            cellEditor.style.display = 'none';
        }

        this.isExpanded = true;

        // Enable canvas overlay mode (visual indicator)
        this.enableCanvasOverlayMode();

        // Update editable fields list
        this.updateEditableFieldsList();
    }

    /**
     * Hide/collapse the panel
     */
    hide() {
        const content = this.container.querySelector('.save-page-panel-content');
        if (content) {
            content.style.display = 'none';
        }

        this.isExpanded = false;

        // Disable canvas overlay mode
        this.disableCanvasOverlayMode();

        // Clear selection
        this.selectedCellId = null;
    }

    /**
     * Enable canvas overlay mode with lock icons
     */
    enableCanvasOverlayMode() {
        // Create overlay element
        this.overlay = document.createElement('div');
        this.overlay.className = 'save-page-canvas-overlay';
        this.overlay.innerHTML = `
            <div class="save-page-overlay-header">
                <span class="overlay-instruction">🔒 Click cells to make editable</span>
                <button class="overlay-exit-btn" title="Exit Save Mode">✕ Exit</button>
            </div>
        `;
        
        // Add overlay to canvas container
        const canvasContainer = document.getElementById('chatooly-container');
        if (canvasContainer) {
            canvasContainer.style.position = 'relative';
            canvasContainer.appendChild(this.overlay);
        }

        // Exit button handler
        const exitBtn = this.overlay.querySelector('.overlay-exit-btn');
        if (exitBtn) {
            exitBtn.addEventListener('click', () => this.hide());
        }

        // Enable canvas click interactions
        this.enableCanvasClickInteraction();

        // Render lock icons on all cells
        this.renderCellLockIcons();

        // Set flag to prevent normal canvas click behavior
        if (this.app) {
            this.app.savePageModeActive = true;
        }
    }

    /**
     * Disable canvas overlay mode
     */
    disableCanvasOverlayMode() {
        // Remove overlay
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = null;

        // Disable canvas click interactions
        this.disableCanvasClickInteraction();

        // Clear lock icons
        this.clearCellLockIcons();

        // Clear flag
        if (this.app) {
            this.app.savePageModeActive = false;
        }
    }

    /**
     * Enable canvas click interaction for selecting cells
     */
    enableCanvasClickInteraction() {
        const canvas = document.getElementById('chatooly-canvas') || document.getElementById('chatooly-canvas');
        if (canvas) {
            // Use capture phase to intercept before app.js handler
            canvas.addEventListener('click', this.canvasClickHandler, true);
        }
    }

    /**
     * Disable canvas click interaction
     */
    disableCanvasClickInteraction() {
        const canvas = document.getElementById('chatooly-canvas') || document.getElementById('chatooly-canvas');
        if (canvas) {
            // Remove from capture phase
            canvas.removeEventListener('click', this.canvasClickHandler, true);
        }
    }

    /**
     * Handle canvas click to select cells
     */

    /**
     * Render lock/unlock icons on all cells
     */
    renderCellLockIcons() {
        if (!this.app || !this.app.grid) return;

        const allCells = this.app.grid.getAllCells();
        
        let renderedCount = 0;
        allCells.forEach((cell, index) => {
            // Skip cells that don't exist
            if (!cell) return;
            
            // Skip empty cells
            if (typeof cell.isEmpty === 'function' && cell.isEmpty()) {
                return;
            }

            const cellId = cell.id !== undefined ? cell.id : `${cell.row}-${cell.col}`;
            const elementId = cell.type === 'main-text' ? `textCell-${cellId}` : `contentCell-${cellId}`;
            
            // Check if cell is editable
            const isEditable = this.isCellEditable(elementId);
            
            // Create lock icon element
            const lockIcon = document.createElement('div');
            lockIcon.className = 'cell-lock-icon';
            if (isEditable) {
                lockIcon.classList.add('unlocked');
            }
            lockIcon.dataset.cellId = cellId;
            lockIcon.dataset.elementId = elementId;
            lockIcon.innerHTML = isEditable ? '🔓' : '🔒';
            
            // Get canvas and its container
            const canvas = document.getElementById('chatooly-canvas');
            if (!canvas) return;
            
            const canvasRect = canvas.getBoundingClientRect();
            const containerRect = canvas.parentElement.getBoundingClientRect();
            
            // Calculate scale factors (canvas internal size vs displayed size)
            const scaleX = canvasRect.width / canvas.width;
            const scaleY = canvasRect.height / canvas.height;
            
            // Position relative to canvas (canvas coordinates → screen coordinates)
            // Account for canvas offset within its container
            const canvasOffsetX = canvasRect.left - containerRect.left;
            const canvasOffsetY = canvasRect.top - containerRect.top;
            
            const iconX = canvasOffsetX + (cell.bounds.x * scaleX) + 8;
            const iconY = canvasOffsetY + (cell.bounds.y * scaleY) + 8;
            
            lockIcon.style.left = iconX + 'px';
            lockIcon.style.top = iconY + 'px';
            
            // Click handler for lock icon
            lockIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                e.stopImmediatePropagation();
                e.preventDefault();
                this.toggleCellLock(elementId, cellId, cell.type);
            });
            
            // Add to overlay
            if (this.overlay) {
                this.overlay.appendChild(lockIcon);
                renderedCount++;
            }
        });
    }

    /**
     * Clear all lock icons
     */
    clearCellLockIcons() {
        if (!this.overlay) return;
        
        const lockIcons = this.overlay.querySelectorAll('.cell-lock-icon');
        lockIcons.forEach(icon => icon.remove());
    }

    /**
     * Update a single lock icon
     */
    updateLockIcon(elementId, isEditable) {
        if (!this.overlay) return;
        
        const lockIcon = this.overlay.querySelector(`[data-element-id="${elementId}"]`);
        if (lockIcon) {
            lockIcon.innerHTML = isEditable ? '🔓' : '🔒';
            lockIcon.classList.toggle('unlocked', isEditable);
        }
    }

    /**
     * Check if cell is editable
     */
    isCellEditable(elementId) {
        // Parse cell ID from elementId
        if (elementId.startsWith('textCell-') || elementId.startsWith('contentCell-')) {
            const cellIdStr = elementId.replace('textCell-', '').replace('contentCell-', '');
            const cellId = parseInt(cellIdStr);
            return this.configuredCellIds.has(cellId);
        }
        return false;
    }

    /**
     * Toggle cell lock/unlock
     */
    /**
     * Find cell by element ID
     */
    _findCellByElementId(elementId) {
        const grid = this.app.grid;
        if (!grid) return null;

        if (elementId === 'mainText') {
            const allCells = grid.getAllCells();
            return allCells.find(c => c.type === 'main-text');
        } else if (elementId.startsWith('textCell-')) {
            const cellIdStr = elementId.replace('textCell-', '');
            const cellId = parseInt(cellIdStr);
            return grid.getCellById(cellId);
        } else if (elementId.startsWith('contentCell-')) {
            const cellIdStr = elementId.replace('contentCell-', '');
            const cellId = parseInt(cellIdStr);
            return grid.getCellById(cellId);
        }

        return null;
    }

    toggleCellLock(elementId, cellId, cellType) {
        // Check if already configured
        const alreadyConfigured = this.configuredCellIds.has(cellId);
        
        if (alreadyConfigured) {
            // Remove slot
            this.configuredSlots = this.configuredSlots.filter(slot => 
                !slot.sourceContentId || slot.sourceContentId !== cellId
            );
            this.configuredCellIds.delete(cellId);
            this.updateLockIcon(elementId, false);
            this.updateEditableFieldsList();
        } else {
            // Find the cell and open config panel
            const cell = this._findCellByElementId(elementId);
            if (!cell) {
                console.error('Cell not found:', elementId);
                return;
            }

            // Open config panel
            this.configPanel.show(cell,
                (slot) => {
                    // On save: add slot to configured list
                    this.configuredSlots.push(slot);
                    this.configuredCellIds.add(cellId);
                    this.updateLockIcon(elementId, true);
                    this.updateEditableFieldsList();
                    console.log('✅ Slot configured:', slot.slotId);
                },
                () => {
                    // On cancel: do nothing, leave unlocked
                    console.log('❌ Slot configuration cancelled');
                }
            );
        }
    }

    handleCanvasClick(event) {
        // Stop all propagation and default behavior
        event.stopPropagation();
        event.stopImmediatePropagation();
        event.preventDefault();
        
        const canvas = document.getElementById('chatooly-canvas') || document.getElementById('chatooly-canvas');
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        // Find cell at click position
        const cell = this.app.grid.getCellAt(x, y);
        if (!cell || (cell.isEmpty && cell.isEmpty())) {
            return;
        }

        // Get cell ID
        const cellId = cell.id !== undefined ? cell.id : `${cell.row}-${cell.col}`;
        const cellType = cell.type;

        // Determine element ID
        let elementId;
        if (cellType === 'main-text') {
            elementId = `textCell-${cellId}`;
        } else if (cellType === 'content') {
            elementId = `contentCell-${cellId}`;
        } else {
            return;
        }

        // Toggle lock instead of just showing editor
        this.toggleCellLock(elementId, cellId, cellType);
    }

    /**
     * Show the cell editor for a specific cell
     */
    showCellEditor(elementId, cellId, cellType) {
        this.selectedCellId = elementId;

        // Ensure config exists
        if (elementId.startsWith('textCell-')) {
            const id = elementId.replace('textCell-', '');
            if (!this.editableConfig.textCells[id]) {
                this.editableConfig.textCells[id] = { editable: true, fieldName: '', fieldLabel: '' };
            } else {
                this.editableConfig.textCells[id].editable = true;
            }
        } else if (elementId.startsWith('contentCell-')) {
            const id = elementId.replace('contentCell-', '');
            if (!this.editableConfig.contentCells[id]) {
                this.editableConfig.contentCells[id] = { editable: true, fieldName: '', fieldLabel: '' };
            } else {
                this.editableConfig.contentCells[id].editable = true;
            }
        }

        // Get current config
        const config = this.getConfigForElementId(elementId);

        // Show editor
        const cellEditor = this.container.querySelector('#save-cell-editor');
        if (cellEditor) {
            cellEditor.style.display = 'block';

            // Populate fields
            const fieldNameInput = this.container.querySelector('#save-field-name');
            const fieldLabelInput = this.container.querySelector('#save-field-label');

            if (fieldNameInput) {
                fieldNameInput.value = config.fieldName || '';
            }
            if (fieldLabelInput) {
                fieldLabelInput.value = config.fieldLabel || '';
            }
        }

        // Update editable fields list
        this.updateEditableFieldsList();
    }

    /**
     * Get config object for element ID
     */
    getConfigForElementId(elementId) {
        if (elementId === 'mainText') {
            return this.editableConfig.mainText;
        } else if (elementId.startsWith('textCell-')) {
            const cellId = elementId.replace('textCell-', '');
            return this.editableConfig.textCells[cellId] || { editable: false, fieldName: null, fieldLabel: null };
        } else if (elementId.startsWith('contentCell-')) {
            const cellId = elementId.replace('contentCell-', '');
            return this.editableConfig.contentCells[cellId] || { editable: false, fieldName: null, fieldLabel: null };
        } else if (elementId === 'background-color') {
            return this.editableConfig.background.color;
        } else if (elementId === 'background-image') {
            return this.editableConfig.background.image || { editable: false, fieldName: null };
        }
        return { editable: false, fieldName: null, fieldLabel: null };
    }

    /**
     * Update selected cell config
     */
    updateSelectedCellConfig(field, value) {
        if (!this.selectedCellId) return;

        const config = this.getConfigForElementId(this.selectedCellId);
        if (config) {
            config[field] = value;
        }

        // Update editable fields list
        this.updateEditableFieldsList();
    }

    /**
     * Remove editable cell
     */
    removeEditableCell() {
        if (!this.selectedCellId) return;

        // Remove from config
        if (this.selectedCellId === 'mainText') {
            this.editableConfig.mainText.editable = false;
        } else if (this.selectedCellId.startsWith('textCell-')) {
            const cellId = this.selectedCellId.replace('textCell-', '');
            if (this.editableConfig.textCells[cellId]) {
                delete this.editableConfig.textCells[cellId];
            }
        } else if (this.selectedCellId.startsWith('contentCell-')) {
            const cellId = this.selectedCellId.replace('contentCell-', '');
            if (this.editableConfig.contentCells[cellId]) {
                delete this.editableConfig.contentCells[cellId];
            }
        }

        // Hide cell editor
        const cellEditor = this.container.querySelector('#save-cell-editor');
        if (cellEditor) {
            cellEditor.style.display = 'none';
        }

        this.selectedCellId = null;

        // Update editable fields list
        this.updateEditableFieldsList();
    }

    /**
     * Update editable fields list display - now shows configured content slots
     */
    updateEditableFieldsList() {
        const listContainer = this.container.querySelector('#save-editable-fields-list');
        if (!listContainer) return;

        listContainer.innerHTML = '';

        if (this.configuredSlots.length === 0) {
            listContainer.innerHTML = '<p class="no-fields-message">No editable fields yet</p>';
            return;
        }

        // Show configured slots
        this.configuredSlots.forEach(slot => {
            const item = document.createElement('div');
            item.className = 'configured-slot-item';
            item.innerHTML = `
                <div class="field-list-header">
                    <div class="field-list-label">
                        <strong>${slot.fieldLabel}</strong>
                        <span class="slot-type-badge">${slot.type}</span>
                    </div>
                    <div class="field-list-details">
                        <span class="field-detail-name">${slot.fieldName}</span>
                        ${slot.required ? '<span class="slot-required">Required</span>' : ''}
                    </div>
                </div>
                ${slot.fieldDescription ? `<div class="slot-description">${slot.fieldDescription}</div>` : ''}
            `;
            listContainer.appendChild(item);
        });
    }

    /**
     * Create field list item
     */
    createFieldListItem(elementId, label, config) {
        const item = document.createElement('div');
        item.className = 'editable-field-list-item';
        
        const fieldName = config.fieldName || '(unnamed)';
        const fieldLabel = config.fieldLabel || '(no label)';

        // Get content preview for this cell
        const previewData = this.getCellContentPreview(elementId);
        const formattedPreview = previewData.isText ? `["${previewData.text}"]` : `[${previewData.text}]`;
        console.log('📝 Creating field list item:', { elementId, label, previewData });

        item.innerHTML = `
            <div class="field-list-header">
                <div class="field-list-label">
                    ${label} ${formattedPreview}
                </div>
                <div class="field-list-details">
                    <span class="field-detail-name">${fieldName}</span>
                    <span class="field-detail-divider">•</span>
                    <span class="field-detail-label">${fieldLabel}</span>
                </div>
            </div>
            <div class="field-list-editor" style="display: none;">
                <h5 class="field-editor-title">Set name and label</h5>
                <div class="cell-editor-field">
                    <label>Field Name</label>
                    <input type="text" class="field-name-input preset-name-input" placeholder="e.g., heroHeadline" value="${config.fieldName || ''}" />
                </div>
                <div class="cell-editor-field">
                    <label>Field Label</label>
                    <input type="text" class="field-label-input preset-name-input" placeholder="e.g., Hero Headline" value="${config.fieldLabel || ''}" />
                </div>
                <div class="cell-editor-actions">
                    <button type="button" class="preset-cell-remove-btn">Remove Editable</button>
                </div>
            </div>
        `;

        const header = item.querySelector('.field-list-header');
        const editor = item.querySelector('.field-list-editor');
        const fieldNameInput = item.querySelector('.field-name-input');
        const fieldLabelInput = item.querySelector('.field-label-input');
        const removeBtn = item.querySelector('.preset-cell-remove-btn');

        // Toggle editor on click
        header.addEventListener('click', () => {
            const isExpanded = editor.style.display === 'block';
            
            // Close all other editors first
            const allEditors = this.container.querySelectorAll('.field-list-editor');
            allEditors.forEach(e => e.style.display = 'none');
            
            // Toggle this editor
            editor.style.display = isExpanded ? 'none' : 'block';
            item.classList.toggle('expanded', !isExpanded);
            
            this.selectedCellId = isExpanded ? null : elementId;
        });

        // Update config when inputs change
        fieldNameInput.addEventListener('input', (e) => {
            config.fieldName = e.target.value;
            const detailName = item.querySelector('.field-detail-name');
            if (detailName) {
                detailName.textContent = e.target.value || '(unnamed)';
            }
        });

        fieldLabelInput.addEventListener('input', (e) => {
            config.fieldLabel = e.target.value;
            const detailLabel = item.querySelector('.field-detail-label');
            if (detailLabel) {
                detailLabel.textContent = e.target.value || '(no label)';
            }
        });

        // Remove editable field
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleCellLock(elementId);
        });

        return item;
    }


    /**
     * Get content preview for a cell
     * @param {string} elementId - Element ID (e.g., 'main-text', 'text-3', 'content-5')
     * @returns {string} Content preview text
     */
    getCellContentPreview(elementId) {
        // Parse element ID to get cell ID and type
        if (elementId === 'main-text') {
            // Get main text content
            const textEngine = this.app.textEngine;
            if (textEngine && textEngine.textBounds && textEngine.textBounds.length > 0) {
                const firstLine = textEngine.textBounds[0];
                if (firstLine && firstLine.text) {
                    const text = firstLine.text.trim();
                    const displayText = text.length > 30 ? text.substring(0, 30) + '...' : text;
                    return { text: displayText, isText: true };
                }
            }
            return { text: '(empty)', isText: false };
        }

        // Parse cell ID from elementId (e.g., 'textCell-3' -> 3, 'contentCell-5' -> 5)
        const match = elementId.match(/(\d+)$/);
        if (!match) {
            return { text: '(unknown)', isText: false };
        }

        const cellId = parseInt(match[1]);
        const cell = this.app.grid.getCellById(cellId);

        console.log('🔍 Looking up cell:', { elementId, cellId, cell });

        if (!cell) {
            return { text: '(not found)', isText: false };
        }

        // Check if it's a content cell
        if (cell.cellType === 'content' || cell.type === 'content') {
            const contentType = cell.contentType;
            
            if (contentType === 'empty') {
                return { text: '(empty)', isText: false };
            } else if (contentType === 'media') {
                // Check if there's actual media content
                if (cell.content && cell.content.mediaUrl) {
                    return { text: 'Image', isText: false };
                }
                return { text: 'Media', isText: false };
            } else if (contentType === 'fill') {
                return { text: 'Color', isText: false };
            } else if (contentType === 'text') {
                // Get text content
                if (cell.content && cell.content.text) {
                    const text = cell.content.text.trim();
                    const displayText = text.length > 30 ? text.substring(0, 30) + '...' : text;
                    return { text: displayText, isText: true };
                }
                return { text: 'Text', isText: false };
            }
        }

        // For main text cells
        if (cell.cellType === 'main-text' || cell.type === 'main-text') {
            if (cell.text) {
                const text = cell.text.trim();
                const displayText = text.length > 30 ? text.substring(0, 30) + '...' : text;
                return { text: displayText, isText: true };
            }
            return { text: 'Main Text', isText: false };
        }

        return { text: '', isText: false };
    }

    /**
     * Load existing presets into dropdown
     */
    async loadExistingPresets() {
        const presets = await this.presetPageManager.getAllPresets();
        const select = this.container.querySelector('#save-existing-preset-select');

        if (!select) return;

        // Clear existing options
        select.innerHTML = '<option value="">-- Select Preset --</option>';

        // Add presets
        presets.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.presetId;
            option.textContent = `${preset.presetName} (${preset.pageCount} pages)`;
            select.appendChild(option);
        });
    }

    /**
     * Handle preset type change (new vs existing)
     */
    handlePresetTypeChange(type) {
        const newContainer = this.container.querySelector('#save-new-preset-container');
        const existingContainer = this.container.querySelector('#save-existing-preset-container');

        if (type === 'new') {
            newContainer.style.display = 'block';
            existingContainer.style.display = 'none';
        } else {
            newContainer.style.display = 'none';
            existingContainer.style.display = 'block';
        }
    }

    /**
     * Handle save button click
     */
    async handleSave() {
        try {
            // Get form values
            const presetType = this.container.querySelector('input[name="save-preset-type"]:checked').value;
            const pageName = this.container.querySelector('#save-page-name').value.trim();
            const pagePosition = parseInt(this.container.querySelector('#save-page-position').value);

            // Validate
            if (!pageName) {
                alert('Please enter a page name');
                return;
            }

            let presetName, presetId;

            if (presetType === 'new') {
                presetName = this.container.querySelector('#save-new-preset-name').value.trim();
                if (!presetName) {
                    alert('Please enter a preset name');
                    return;
                }
            } else {
                presetId = this.container.querySelector('#save-existing-preset-select').value;
                if (!presetId) {
                    alert('Please select a preset');
                    return;
                }
            }

            // Clear content slot manager and add configured slots
            this.contentSlotManager.clearSlots();
            this.configuredSlots.forEach(slot => {
                this.contentSlotManager.addSlot(slot);
            });

            // Capture current page (will include content slots)
            const pageData = this.presetPageManager.captureCurrentPage(pagePosition, pageName);
            
            console.log(`✅ Page captured with ${pageData.contentSlots.length} content slots`);

            // Save
            if (presetType === 'new') {
                await this.presetPageManager.saveToNewPreset(presetName, pageData, pagePosition);
                alert(`✅ Page saved to new preset: ${presetName}`);
            } else {
                await this.presetPageManager.addPageToExistingPreset(presetId, pageData, pagePosition);
                alert(`✅ Page added to existing preset`);
            }

            this.hide();

            // Refresh preset list in UI if needed
            if (this.app.presetUI) {
                this.app.presetUI.loadPresets();
            }

        } catch (error) {
            console.error('Error saving page:', error);
            alert(`Error saving page: ${error.message}`);
        }
    }
}
