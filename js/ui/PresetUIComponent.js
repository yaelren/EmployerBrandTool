/**
 * PresetUIComponent.js - Cloud-only preset UI controls
 * Handles user interactions for saving, loading, and managing presets in Wix cloud
 */

class PresetUIComponent {
    constructor(app) {
        this.app = app;
        this.presetManager = null; // Will be set when PresetManager is initialized
        this.currentPresetId = null; // Track currently selected preset
    }

    /**
     * Initialize the preset UI component
     * @param {PresetManager} presetManager - PresetManager instance
     */
    initialize(presetManager) {
        this.presetManager = presetManager;
        this.setupEventListeners();
    }

    /**
     * Render the preset controls in the specified container
     * @param {HTMLElement} container - Container to render controls in
     */
    render(container) {
        if (!container) {
            console.error('PresetUIComponent: No container provided');
            return;
        }

        container.innerHTML = `
            <div class="preset-controls preset-cloud-controls">
                <!-- Save Section -->
                <div class="preset-section preset-save-section">
                    <h3>💾 Save New Preset</h3>
                    <p class="preset-description">Save your current design to the cloud</p>
                    <div class="preset-save-controls">
                        <input
                            type="text"
                            id="presetNameInput"
                            class="preset-name-input"
                            placeholder="Enter preset name..."
                            maxlength="50">
                        <button type="button" class="preset-save-cloud-btn chatooly-btn chatooly-btn-primary">
                            💾 Save to Cloud
                        </button>
                    </div>
                </div>

                <!-- Load Section -->
                <div class="preset-section preset-load-section">
                    <h3>📥 Load Preset</h3>
                    <p class="preset-description">Select a preset from your cloud library</p>
                    <div class="preset-load-controls">
                        <select id="presetDropdown" class="preset-dropdown">
                            <option value="">-- Select Preset --</option>
                        </select>
                        <div class="preset-action-buttons">
                            <button type="button" class="preset-load-cloud-btn chatooly-btn chatooly-btn-primary">
                                📥 Load
                            </button>
                            <button type="button" class="preset-delete-btn chatooly-btn chatooly-btn-danger">
                                🗑️ Delete
                            </button>
                            <button type="button" class="preset-refresh-btn chatooly-btn chatooly-btn-secondary">
                                🔄 Refresh
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Info Section -->
                <div class="preset-info preset-cloud-info">
                    <h4>ℹ️ About Cloud Presets</h4>
                    <ul class="preset-features">
                        <li>✅ Automatically saved to Wix cloud</li>
                        <li>✅ All images uploaded to Wix CDN</li>
                        <li>✅ Access from any device</li>
                        <li>✅ No file downloads needed</li>
                        <li>⚠️ Videos cannot be saved (Phase I limitation)</li>
                    </ul>
                </div>
            </div>
        `;

        this.setupEventListeners();

        // Populate dropdown on render
        this.populatePresetDropdown();
    }

    /**
     * Setup event listeners for preset controls
     */
    setupEventListeners() {
        // Save to cloud button
        const saveBtn = document.querySelector('.preset-save-cloud-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.handleSaveToCloud());
        }

        // Enter key on name input = save
        const nameInput = document.getElementById('presetNameInput');
        if (nameInput) {
            nameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSaveToCloud();
                }
            });
        }

        // Load from cloud button
        const loadBtn = document.querySelector('.preset-load-cloud-btn');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => this.handleLoadFromCloud());
        }

        // Delete preset button
        const deleteBtn = document.querySelector('.preset-delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.handleDeletePreset());
        }

        // Refresh dropdown button
        const refreshBtn = document.querySelector('.preset-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.populatePresetDropdown());
        }

        // Dropdown selection change
        const dropdown = document.getElementById('presetDropdown');
        if (dropdown) {
            dropdown.addEventListener('change', (e) => {
                this.currentPresetId = e.target.value;
            });
        }
    }

    /**
     * Populate preset dropdown from Wix cloud
     */
    async populatePresetDropdown() {
        if (!this.presetManager) {
            console.error('PresetManager not initialized');
            return;
        }

        const dropdown = document.getElementById('presetDropdown');
        if (!dropdown) return;

        try {
            console.log('🔄 Fetching presets from cloud...');

            // Fetch presets from Wix
            const presets = await this.presetManager.listCloudPresets();

            // Clear dropdown
            dropdown.innerHTML = '<option value="">-- Select Preset --</option>';

            // Add presets to dropdown
            if (presets.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = '(No presets saved yet)';
                option.disabled = true;
                dropdown.appendChild(option);
                console.log('ℹ️ No presets found in cloud');
            } else {
                presets.forEach(preset => {
                    const option = document.createElement('option');
                    option.value = preset._id;
                    option.textContent = preset.name || 'Unnamed Preset';
                    dropdown.appendChild(option);
                });
                console.log(`✅ Loaded ${presets.length} presets into dropdown`);
            }

        } catch (error) {
            console.error('❌ Failed to populate dropdown:', error);
            dropdown.innerHTML = '<option value="">-- Error loading presets --</option>';
            this.showError('Failed to load presets from cloud');
        }
    }

    /**
     * Handle save to cloud button click
     */
    async handleSaveToCloud() {
        if (!this.presetManager) {
            this.showError('Preset system not initialized');
            return;
        }

        const nameInput = document.getElementById('presetNameInput');
        const presetName = nameInput?.value.trim();

        if (!presetName) {
            this.showError('Please enter a preset name');
            nameInput?.focus();
            return;
        }

        // Check for background video warning
        if (this.hasBackgroundVideo()) {
            const proceed = confirm(
                '⚠️ Background Video Detected\n\n' +
                'Videos cannot be saved in presets.\n' +
                'The preset will be saved without the video.\n\n' +
                'Continue?'
            );
            if (!proceed) return;
        }

        try {
            this.showLoading('Saving to cloud...');

            // Save to cloud (uploads assets automatically)
            await this.presetManager.saveToCloud(presetName);

            // Clear input
            nameInput.value = '';

            // Refresh dropdown
            await this.populatePresetDropdown();

            this.showSuccess(`✅ Preset "${presetName}" saved to cloud!`);

        } catch (error) {
            console.error('❌ Save to cloud failed:', error);
            this.showError(`Failed to save preset: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Handle load from cloud button click
     */
    async handleLoadFromCloud() {
        if (!this.presetManager) {
            this.showError('Preset system not initialized');
            return;
        }

        if (!this.currentPresetId) {
            this.showError('Please select a preset to load');
            return;
        }

        try {
            this.showLoading('Loading from cloud...');

            // Load preset from Wix
            const preset = await this.presetManager.loadFromCloud(this.currentPresetId);

            this.showSuccess(`✅ Preset "${preset.name}" loaded successfully!`);

        } catch (error) {
            console.error('❌ Load from cloud failed:', error);
            this.showError(`Failed to load preset: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Handle delete preset button click
     */
    async handleDeletePreset() {
        if (!this.presetManager) {
            this.showError('Preset system not initialized');
            return;
        }

        if (!this.currentPresetId) {
            this.showError('Please select a preset to delete');
            return;
        }

        // Get preset name for confirmation
        const dropdown = document.getElementById('presetDropdown');
        const selectedOption = dropdown?.options[dropdown.selectedIndex];
        const presetName = selectedOption?.textContent || 'this preset';

        // Confirm deletion
        const confirmed = confirm(
            `🗑️ Delete Preset?\n\n` +
            `Are you sure you want to delete "${presetName}"?\n\n` +
            `This action cannot be undone.`
        );

        if (!confirmed) return;

        try {
            this.showLoading('Deleting preset...');

            // Delete from Wix
            await this.presetManager.deleteFromCloud(this.currentPresetId);

            // Clear selection
            this.currentPresetId = null;

            // Refresh dropdown
            await this.populatePresetDropdown();

            this.showSuccess(`✅ Preset "${presetName}" deleted from cloud`);

        } catch (error) {
            console.error('❌ Delete from cloud failed:', error);
            this.showError(`Failed to delete preset: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Check if there's a background video
     * @returns {boolean} True if background video exists
     */
    hasBackgroundVideo() {
        return this.app.canvasManager.backgroundManager.backgroundVideo !== null;
    }

    /**
     * Show loading indicator
     * @param {string} message - Loading message
     */
    showLoading(message) {
        let loadingEl = document.getElementById('presetLoading');
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.id = 'presetLoading';
            loadingEl.className = 'preset-loading';
            loadingEl.innerHTML = `
                <div class="preset-loading-content">
                    <div class="preset-spinner"></div>
                    <span class="preset-loading-text">${message}</span>
                </div>
            `;
            document.body.appendChild(loadingEl);
        } else {
            loadingEl.querySelector('.preset-loading-text').textContent = message;
        }
        loadingEl.style.display = 'flex';
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        const loadingEl = document.getElementById('presetLoading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * Show message (success or error)
     * @param {string} message - Message to show
     * @param {string} type - Message type ('success' or 'error')
     */
    showMessage(message, type) {
        // Remove existing message
        const existingMessage = document.getElementById('presetMessage');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message
        const messageEl = document.createElement('div');
        messageEl.id = 'presetMessage';
        messageEl.className = `preset-message preset-message-${type}`;
        messageEl.innerHTML = `
            <div class="preset-message-content">
                <span class="preset-message-icon">${type === 'success' ? '✅' : '❌'}</span>
                <span class="preset-message-text">${message}</span>
                <button type="button" class="preset-message-close">&times;</button>
            </div>
        `;

        // Add close functionality
        const closeBtn = messageEl.querySelector('.preset-message-close');
        closeBtn.addEventListener('click', () => messageEl.remove());

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.remove();
            }
        }, 5000);

        document.body.appendChild(messageEl);

        // Auto-scroll to message
        messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}
