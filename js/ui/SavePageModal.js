/**
 * SavePageModal - Modal for saving page to preset with editable field configuration
 *
 * Workflow:
 * 1. Show modal with canvas preview overlay
 * 2. Designer clicks cells to toggle editable/locked
 * 3. For editable cells, enter field name and label
 * 4. Choose new preset or existing preset
 * 5. Select page position (1-5)
 * 6. Save page to CMS
 */

class SavePageModal {
    constructor(app) {
        this.app = app;
        this.presetPageManager = app.presetPageManager;

        this.modal = null;
        this.isVisible = false;

        // Editable field configuration
        this.editableConfig = {
            mainText: { editable: false, fieldName: null, fieldLabel: null },
            textCells: {},
            contentCells: {},
            background: {
                color: { editable: false, fieldName: null },
                image: { editable: false, fieldName: null }
            }
        };

        this.createModal();
    }

    /**
     * Create modal HTML structure
     */
    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'save-page-modal-overlay';
        this.modal.style.display = 'none';
        this.modal.innerHTML = `
            <div class="save-page-modal">
                <div class="save-page-modal-header">
                    <h2>Save Page to Preset</h2>
                    <button class="save-page-modal-close">&times;</button>
                </div>

                <div class="save-page-modal-body">
                    <!-- Instructions -->
                    <div class="save-page-instructions">
                        <p>Select which canvas elements should be editable by end-users. Editable fields will have customizable values when the preset is used.</p>
                    </div>

                    <!-- Canvas Elements List -->
                    <div class="save-page-elements-list">
                        <h3>Canvas Elements</h3>
                        <p class="elements-hint">Check elements to make them editable, then provide field names below</p>
                        <div id="save-page-elements-container">
                            <!-- Elements will be rendered here -->
                        </div>
                    </div>

                    <!-- Editable Fields Configuration -->
                    <div class="save-page-editable-fields">
                        <h3>Editable Field Names</h3>
                        <div id="save-page-fields-list">
                            <p class="no-fields-message">No editable fields selected. Check elements above to configure them.</p>
                        </div>
                    </div>

                    <!-- Preset Selection -->
                    <div class="save-page-preset-selection">
                        <h3>Preset</h3>
                        <div class="preset-radio-group">
                            <label>
                                <input type="radio" name="preset-type" value="new" checked>
                                Create New Preset
                            </label>
                            <label>
                                <input type="radio" name="preset-type" value="existing">
                                Add to Existing Preset
                            </label>
                        </div>

                        <!-- New Preset Name -->
                        <div id="new-preset-name-container">
                            <label>Preset Name:</label>
                            <input type="text" id="new-preset-name" placeholder="Enter preset name..." />
                        </div>

                        <!-- Existing Preset Dropdown -->
                        <div id="existing-preset-container" style="display: none;">
                            <label>Select Preset:</label>
                            <select id="existing-preset-select">
                                <option value="">-- Select Preset --</option>
                            </select>
                        </div>
                    </div>

                    <!-- Page Settings -->
                    <div class="save-page-settings">
                        <div class="page-name-input">
                            <label>Page Name:</label>
                            <input type="text" id="page-name-input" placeholder="e.g., Hero Banner, About Us..." value="Page 1" />
                        </div>

                        <div class="page-position-input">
                            <label>Page Position:</label>
                            <select id="page-position-select">
                                <option value="1">Page 1</option>
                                <option value="2">Page 2</option>
                                <option value="3">Page 3</option>
                                <option value="4">Page 4</option>
                                <option value="5">Page 5</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="save-page-modal-footer">
                    <button class="save-page-modal-cancel">Cancel</button>
                    <button class="save-page-modal-save">Save Page</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);
        this.attachEventListeners();
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close buttons
        this.modal.querySelector('.save-page-modal-close').addEventListener('click', () => this.hide());
        this.modal.querySelector('.save-page-modal-cancel').addEventListener('click', () => this.hide());

        // Save button
        this.modal.querySelector('.save-page-modal-save').addEventListener('click', () => this.handleSave());

        // Preset type radio buttons
        const radioButtons = this.modal.querySelectorAll('input[name="preset-type"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', (e) => this.handlePresetTypeChange(e.target.value));
        });

        // Close on overlay click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });
    }

    /**
     * Show modal
     */
    async show() {
        // Reset editable config
        this.editableConfig = {
            mainText: { editable: false, fieldName: null, fieldLabel: null },
            textCells: {},
            contentCells: {},
            background: {
                color: { editable: false, fieldName: null },
                image: { editable: false, fieldName: null }
            }
        };

        // Load existing presets for dropdown
        await this.loadExistingPresets();

        // Render canvas overlay
        this.renderCanvasOverlay();

        // Show modal
        this.modal.style.display = 'flex';
        this.isVisible = true;
    }

    /**
     * Hide modal
     */
    hide() {
        this.modal.style.display = 'none';
        this.isVisible = false;
    }

    /**
     * Load existing presets into dropdown
     */
    async loadExistingPresets() {
        const presets = await this.presetPageManager.getAllPresets();
        const select = this.modal.querySelector('#existing-preset-select');

        // Clear existing options (except first "-- Select --")
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
        const newContainer = this.modal.querySelector('#new-preset-name-container');
        const existingContainer = this.modal.querySelector('#existing-preset-container');

        if (type === 'new') {
            newContainer.style.display = 'block';
            existingContainer.style.display = 'none';
        } else {
            newContainer.style.display = 'none';
            existingContainer.style.display = 'block';
        }
    }

    /**
     * Render canvas elements as checkbox list organized by grid position
     */
    renderCanvasOverlay() {
        const container = this.modal.querySelector('#save-page-elements-container');
        container.innerHTML = '';

        // Access the grid directly from the app
        const grid = this.app.grid;
        if (!grid) {
            container.innerHTML = '<p class="no-fields-message">No grid detected. Please ensure canvas has content.</p>';
            return;
        }

        // Get all cells from the grid
        const allCells = grid.getAllCells();

        // Iterate through all cells
        allCells.forEach(cell => {
            // Skip empty cells using isEmpty() method
            if (cell.isEmpty && cell.isEmpty()) return;

            // Get cell ID (sequential number) and position
            const cellId = cell.id !== undefined ? cell.id : `${cell.row}-${cell.col}`;
            const cellLabel = `Cell #${cellId}`;

            // MAIN TEXT CELL - Check if it has text content
            if (cell.type === 'main-text') {
                // MainTextCell has .text property getter
                const textContent = cell.text;

                if (textContent && textContent.trim()) {
                    const label = `📝 ${cellLabel} (Main Text)`;
                    const elementId = `textCell-${cellId}`;
                    const isEditable = this.editableConfig.textCells[cellId]?.editable || false;

                    const textItem = this.createElementCheckbox(
                        label,
                        textContent,
                        elementId,
                        isEditable
                    );
                    container.appendChild(textItem);
                }
            }

            // CONTENT CELL - Check for media or text content
            else if (cell.type === 'content') {
                // ContentCell has contentType property: 'empty', 'media', 'text', 'fill'
                // Check if cell has media using hasImage() method
                if (cell.hasImage && cell.hasImage()) {
                    const label = `🖼️ ${cellLabel} (Media)`;
                    const elementId = `contentCell-${cellId}`;
                    const isEditable = this.editableConfig.contentCells[cellId]?.editable || false;

                    const contentItem = this.createElementCheckbox(
                        label,
                        '[Image]',
                        elementId,
                        isEditable
                    );
                    container.appendChild(contentItem);
                }
                // Check if cell has text using hasText() method
                else if (cell.hasText && cell.hasText()) {
                    const textContent = cell.content?.text || '';
                    const label = `📝 ${cellLabel} (Text)`;
                    const elementId = `contentCell-${cellId}`;
                    const isEditable = this.editableConfig.contentCells[cellId]?.editable || false;

                    const contentItem = this.createElementCheckbox(
                        label,
                        textContent,
                        elementId,
                        isEditable
                    );
                    container.appendChild(contentItem);
                }
                // Check if it's a fill cell using isFill() method
                else if (cell.isFill && cell.isFill()) {
                    const label = `🎨 ${cellLabel} (Fill)`;
                    const elementId = `contentCell-${cellId}`;
                    const isEditable = this.editableConfig.contentCells[cellId]?.editable || false;

                    const contentItem = this.createElementCheckbox(
                        label,
                        '[Color Fill]',
                        elementId,
                        isEditable
                    );
                    container.appendChild(contentItem);
                }
            }
        });

        // Render Background Color (if not default white)
        const canvasState = this.app.presetManager.serializeState('temp');
        if (canvasState.background?.color && canvasState.background.color !== '#ffffff') {
            const bgItem = this.createElementCheckbox(
                '🎨 Background Color',
                canvasState.background.color,
                'background-color',
                this.editableConfig.background.color.editable
            );
            container.appendChild(bgItem);
        }

        // Render Background Image (if exists)
        if (canvasState.background?.imageURL || canvasState.background?.gifURL) {
            const bgImageItem = this.createElementCheckbox(
                '🖼️ Background Image',
                '[Background Media]',
                'background-image',
                this.editableConfig.background.image?.editable || false
            );
            container.appendChild(bgImageItem);
        }

        // Show message if no elements found
        if (container.children.length === 0) {
            container.innerHTML = '<p class="no-fields-message">No canvas elements found. Add text or images to the canvas first.</p>';
        }
    }

    /**
     * Create element checkbox item
     */
    createElementCheckbox(label, content, elementId, isChecked) {
        const item = document.createElement('div');
        item.className = 'element-checkbox-item';
        item.dataset.elementId = elementId;

        // Truncate long content
        const displayContent = content.length > 50 ? content.substring(0, 50) + '...' : content;

        item.innerHTML = `
            <label class="element-checkbox-label">
                <input type="checkbox"
                       class="element-checkbox"
                       data-element-id="${elementId}"
                       ${isChecked ? 'checked' : ''}>
                <span class="element-label-text">
                    <strong>${label}</strong>
                    <span class="element-content">${displayContent}</span>
                </span>
            </label>
        `;

        const checkbox = item.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', (e) => {
            this.toggleElementEditable(elementId, e.target.checked);
        });

        return item;
    }

    /**
     * Toggle element editable state
     */
    toggleElementEditable(elementId, isEditable) {
        if (elementId === 'mainText') {
            this.editableConfig.mainText.editable = isEditable;
        } else if (elementId.startsWith('textCell-')) {
            const cellId = elementId.replace('textCell-', '');
            if (!this.editableConfig.textCells[cellId]) {
                this.editableConfig.textCells[cellId] = { editable: false, fieldName: null, fieldLabel: null };
            }
            this.editableConfig.textCells[cellId].editable = isEditable;
        } else if (elementId.startsWith('contentCell-')) {
            const cellId = elementId.replace('contentCell-', '');
            if (!this.editableConfig.contentCells[cellId]) {
                this.editableConfig.contentCells[cellId] = { editable: false, fieldName: null, fieldLabel: null };
            }
            this.editableConfig.contentCells[cellId].editable = isEditable;
        } else if (elementId === 'background-color') {
            this.editableConfig.background.color.editable = isEditable;
        } else if (elementId === 'background-image') {
            if (!this.editableConfig.background.image) {
                this.editableConfig.background.image = { editable: false, fieldName: null };
            }
            this.editableConfig.background.image.editable = isEditable;
        }

        // Re-render field list
        this.renderEditableFieldsList();
    }

    /**
     * Render editable fields list with field name inputs
     */
    renderEditableFieldsList() {
        const fieldsList = this.modal.querySelector('#save-page-fields-list');
        fieldsList.innerHTML = '';

        let hasFields = false;

        // Main Text
        if (this.editableConfig.mainText.editable) {
            hasFields = true;
            fieldsList.appendChild(this.createFieldInput('mainText', 'Main Text', this.editableConfig.mainText));
        }

        // Text Cells
        Object.entries(this.editableConfig.textCells).forEach(([cellId, config]) => {
            if (config.editable) {
                hasFields = true;
                fieldsList.appendChild(this.createFieldInput(`textCell-${cellId}`, `Text Cell`, config));
            }
        });

        // Content Cells
        Object.entries(this.editableConfig.contentCells).forEach(([cellId, config]) => {
            if (config.editable) {
                hasFields = true;
                fieldsList.appendChild(this.createFieldInput(`contentCell-${cellId}`, `Content Cell`, config));
            }
        });

        // Background
        if (this.editableConfig.background.color.editable) {
            hasFields = true;
            fieldsList.appendChild(this.createFieldInput('background-color', 'Background Color', this.editableConfig.background.color));
        }

        if (!hasFields) {
            fieldsList.innerHTML = '<p class="no-fields-message">No editable fields selected. Click canvas elements above to mark as editable.</p>';
        }
    }

    /**
     * Create field input for editable field
     */
    createFieldInput(elementId, label, config) {
        const fieldItem = document.createElement('div');
        fieldItem.className = 'editable-field-item';
        fieldItem.innerHTML = `
            <div class="field-label">${label}</div>
            <div class="field-inputs">
                <input type="text"
                       class="field-name-input"
                       placeholder="Field Name (e.g., heroHeadline)"
                       value="${config.fieldName || ''}"
                       data-element-id="${elementId}" />
                <input type="text"
                       class="field-label-input"
                       placeholder="Field Label (e.g., Hero Headline)"
                       value="${config.fieldLabel || ''}"
                       data-element-id="${elementId}" />
            </div>
        `;

        // Update config on input
        const fieldNameInput = fieldItem.querySelector('.field-name-input');
        const fieldLabelInput = fieldItem.querySelector('.field-label-input');

        fieldNameInput.addEventListener('input', (e) => {
            config.fieldName = e.target.value;
        });

        fieldLabelInput.addEventListener('input', (e) => {
            config.fieldLabel = e.target.value;
        });

        return fieldItem;
    }

    /**
     * Handle save button click
     */
    async handleSave() {
        try {
            // Get form values
            const presetType = this.modal.querySelector('input[name="preset-type"]:checked').value;
            const pageName = this.modal.querySelector('#page-name-input').value.trim();
            const pagePosition = parseInt(this.modal.querySelector('#page-position-select').value);

            // Validate
            if (!pageName) {
                alert('Please enter a page name');
                return;
            }

            let presetName, presetId;

            if (presetType === 'new') {
                presetName = this.modal.querySelector('#new-preset-name').value.trim();
                if (!presetName) {
                    alert('Please enter a preset name');
                    return;
                }
            } else {
                presetId = this.modal.querySelector('#existing-preset-select').value;
                if (!presetId) {
                    alert('Please select a preset');
                    return;
                }
            }

            // Capture current page
            const pageData = this.presetPageManager.captureCurrentPage(pagePosition, pageName);

            // Apply editable fields configuration
            pageData.editableFields = this.editableConfig;

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
