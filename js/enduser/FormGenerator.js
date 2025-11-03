/**
 * FormGenerator.js
 * Sprint 4: Dynamic Form Generation
 *
 * Generates HTML forms from content slot definitions.
 * Handles different field types:
 * - Text (single line)
 * - Textarea (multi-line with character counter)
 * - File upload (images)
 *
 * Features:
 * - Real-time validation
 * - Character counters for text fields
 * - Image preview for uploads
 * - Live updates to canvas
 */

class FormGenerator {
    constructor(containerElement) {
        this.container = containerElement;
        this.currentForm = null;
        this.onChangeCallback = null;
    }

    /**
     * Generate form from page slots data
     * @param {Object} pageData - { pageName, slots: [...] }
     * @param {Function} onChangeCallback - Called when field value changes: (slotId, value) => {}
     */
    generateForm(pageData, onChangeCallback) {
        this.onChangeCallback = onChangeCallback;
        this.container.innerHTML = '';

        if (!pageData.slots || pageData.slots.length === 0) {
            this.showEmptyState(pageData.pageName);
            return;
        }

        console.log(`🎨 Generating form for "${pageData.pageName}" with ${pageData.slots.length} slots`);

        // Create form container
        const formHTML = this.buildFormHTML(pageData);
        this.container.innerHTML = formHTML;

        // Attach event listeners
        this.attachEventListeners(pageData.slots);

        console.log('✅ Form generated');
    }

    /**
     * Build HTML for entire form
     */
    buildFormHTML(pageData) {
        const pageTitle = pageData.pageName || 'Unnamed Page';

        const slotsHTML = pageData.slots.map(slot => {
            return this.buildFieldHTML(slot);
        }).join('');

        return `
            <div class="form-page-header">
                <h3 class="form-page-title">${pageTitle}</h3>
                <p class="form-page-description">${pageData.slots.length} field(s) to fill</p>
            </div>
            <div class="form-fields">
                ${slotsHTML}
            </div>
        `;
    }

    /**
     * Build HTML for a single field based on slot type
     */
    buildFieldHTML(slot) {
        const fieldId = `field-${slot.slotId}`;
        const isRequired = slot.constraints?.required !== false;
        const requiredIndicator = isRequired ? '<span class="required-indicator">*</span>' : '';

        switch (slot.type) {
            case 'text':
                return this.buildTextFieldHTML(slot, fieldId, requiredIndicator);

            case 'image':
                return this.buildImageFieldHTML(slot, fieldId, requiredIndicator);

            default:
                console.warn(`⚠️ Unknown slot type: ${slot.type}`);
                return '';
        }
    }

    /**
     * Build text field (single line or textarea)
     */
    buildTextFieldHTML(slot, fieldId, requiredIndicator) {
        const maxChars = slot.constraints?.maxCharacters || 500;
        const placeholder = slot.placeholder || `Enter ${slot.fieldLabel.toLowerCase()}...`;
        const hint = slot.hint || `Maximum ${maxChars} characters`;

        const isMultiline = slot.constraints?.multiline !== false;

        if (isMultiline) {
            return `
                <div class="form-group">
                    <label class="form-label" for="${fieldId}">
                        ${slot.fieldLabel}
                        ${requiredIndicator}
                    </label>
                    <textarea
                        id="${fieldId}"
                        class="form-textarea"
                        data-slot-id="${slot.slotId}"
                        data-max-chars="${maxChars}"
                        placeholder="${placeholder}"
                        rows="4"
                    ></textarea>
                    <div class="form-field-footer">
                        <span class="form-hint">${hint}</span>
                        <span class="char-counter" id="${fieldId}-counter">0 / ${maxChars}</span>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="form-group">
                    <label class="form-label" for="${fieldId}">
                        ${slot.fieldLabel}
                        ${requiredIndicator}
                    </label>
                    <input
                        type="text"
                        id="${fieldId}"
                        class="form-input"
                        data-slot-id="${slot.slotId}"
                        data-max-chars="${maxChars}"
                        placeholder="${placeholder}"
                    />
                    <div class="form-field-footer">
                        <span class="form-hint">${hint}</span>
                        <span class="char-counter" id="${fieldId}-counter">0 / ${maxChars}</span>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Build image upload field
     */
    buildImageFieldHTML(slot, fieldId, requiredIndicator) {
        const hint = slot.hint || 'Upload an image (JPG, PNG)';
        const accept = 'image/jpeg,image/png,image/jpg';

        return `
            <div class="form-group">
                <label class="form-label" for="${fieldId}">
                    ${slot.fieldLabel}
                    ${requiredIndicator}
                </label>
                <input
                    type="file"
                    id="${fieldId}"
                    class="file-input-hidden"
                    data-slot-id="${slot.slotId}"
                    accept="${accept}"
                    style="display: none;"
                />
                <button
                    type="button"
                    class="file-upload-btn"
                    onclick="document.getElementById('${fieldId}').click()"
                >
                    📁 Choose File
                </button>
                <span class="form-hint">${hint}</span>
                <div class="file-preview" id="${fieldId}-preview" style="display: none;">
                    <img src="" alt="Preview" />
                    <button type="button" class="file-remove" data-field-id="${fieldId}">×</button>
                </div>
            </div>
        `;
    }

    /**
     * Show empty state when no slots available
     */
    showEmptyState(pageName) {
        this.container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3 class="empty-state-title">${pageName || 'This Page'}</h3>
                <p class="empty-state-description">No editable fields on this page.</p>
            </div>
        `;
    }

    /**
     * Attach event listeners to all form fields
     */
    attachEventListeners(slots) {
        slots.forEach(slot => {
            const fieldId = `field-${slot.slotId}`;
            const element = document.getElementById(fieldId);

            if (!element) {
                console.warn(`⚠️ Field element not found: ${fieldId}`);
                return;
            }

            if (slot.type === 'text') {
                this.attachTextFieldListeners(element, fieldId, slot);
            } else if (slot.type === 'image') {
                this.attachImageFieldListeners(element, fieldId, slot);
            }
        });
    }

    /**
     * Attach listeners for text fields
     */
    attachTextFieldListeners(element, fieldId, slot) {
        const counterId = `${fieldId}-counter`;
        const counter = document.getElementById(counterId);
        const maxChars = slot.constraints?.maxCharacters || 500;

        // Input event (real-time updates)
        element.addEventListener('input', (e) => {
            const value = e.target.value;
            const length = value.length;

            // Update character counter
            if (counter) {
                counter.textContent = `${length} / ${maxChars}`;

                // Warning color when near limit
                if (length > maxChars * 0.9) {
                    counter.classList.add('warning');
                } else {
                    counter.classList.remove('warning');
                }

                // Error color when over limit
                if (length > maxChars) {
                    counter.classList.add('error');
                } else {
                    counter.classList.remove('error');
                }
            }

            // Truncate if over limit
            if (length > maxChars) {
                e.target.value = value.substring(0, maxChars);
                return;
            }

            // Trigger callback for canvas update
            if (this.onChangeCallback) {
                this.onChangeCallback(slot.slotId, value);
            }
        });
    }

    /**
     * Attach listeners for image fields
     */
    attachImageFieldListeners(element, fieldId, slot) {
        const previewId = `${fieldId}-preview`;
        const preview = document.getElementById(previewId);

        // File change event
        element.addEventListener('change', (e) => {
            const file = e.target.files[0];

            if (!file) return;

            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file (JPG, PNG)');
                e.target.value = '';
                return;
            }

            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                alert('Image file is too large. Maximum size is 5MB.');
                e.target.value = '';
                return;
            }

            // Show preview
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = preview.querySelector('img');
                img.src = event.target.result;
                preview.style.display = 'block';

                // Trigger callback with image data URL
                if (this.onChangeCallback) {
                    this.onChangeCallback(slot.slotId, event.target.result);
                }
            };
            reader.readAsDataURL(file);
        });

        // Remove button
        const removeBtn = preview.querySelector('.file-remove');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                element.value = '';
                preview.style.display = 'none';

                // Trigger callback with null to clear image
                if (this.onChangeCallback) {
                    this.onChangeCallback(slot.slotId, null);
                }
            });
        }
    }

    /**
     * Get all form values
     * @returns {Object} { slotId: value, ... }
     */
    getAllValues() {
        const values = {};
        const inputs = this.container.querySelectorAll('[data-slot-id]');

        inputs.forEach(input => {
            const slotId = input.dataset.slotId;

            if (input.type === 'file') {
                // For file inputs, get the preview image src
                const previewId = `${input.id}-preview`;
                const preview = document.getElementById(previewId);
                const img = preview?.querySelector('img');
                values[slotId] = img?.src || null;
            } else {
                values[slotId] = input.value;
            }
        });

        return values;
    }

    /**
     * Set form values (for loading saved data)
     * @param {Object} values - { slotId: value, ... }
     */
    setValues(values) {
        Object.entries(values).forEach(([slotId, value]) => {
            const input = this.container.querySelector(`[data-slot-id="${slotId}"]`);

            if (!input) return;

            if (input.type === 'file') {
                // For file inputs, set preview image
                if (value) {
                    const previewId = `${input.id}-preview`;
                    const preview = document.getElementById(previewId);
                    const img = preview?.querySelector('img');
                    if (img) {
                        img.src = value;
                        preview.style.display = 'block';
                    }
                }
            } else {
                input.value = value || '';

                // Update character counter
                const counterId = `${input.id}-counter`;
                const counter = document.getElementById(counterId);
                if (counter) {
                    const maxChars = parseInt(input.dataset.maxChars) || 500;
                    const length = value?.length || 0;
                    counter.textContent = `${length} / ${maxChars}`;
                }
            }
        });
    }

    /**
     * Validate all fields
     * @returns {Object} { valid: boolean, errors: string[] }
     */
    validate() {
        const errors = [];
        const inputs = this.container.querySelectorAll('[data-slot-id]');

        inputs.forEach(input => {
            const slotId = input.dataset.slotId;
            const label = this.container.querySelector(`label[for="${input.id}"]`)?.textContent?.trim() || slotId;

            // Check required fields
            const formGroup = input.closest('.form-group');
            const isRequired = formGroup?.querySelector('.required-indicator') !== null;

            if (isRequired) {
                if (input.type === 'file') {
                    const previewId = `${input.id}-preview`;
                    const preview = document.getElementById(previewId);
                    if (!preview || preview.style.display === 'none') {
                        errors.push(`${label} is required`);
                    }
                } else if (!input.value.trim()) {
                    errors.push(`${label} is required`);
                }
            }
        });

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}
