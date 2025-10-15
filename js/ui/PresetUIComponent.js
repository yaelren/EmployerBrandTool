/**
 * PresetUIComponent.js - UI controls for preset save/load functionality
 * Handles user interactions for saving and loading presets
 */

class PresetUIComponent {
    constructor(app) {
        this.app = app;
        this.presetManager = null; // Will be set when PresetManager is initialized
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
            <div class="preset-controls">
                <div class="preset-section">
                    <h3>Save Preset</h3>
                    <p class="preset-description">Download your current design as a preset file</p>
                    <button type="button" class="preset-save-btn chatooly-btn chatooly-btn-primary">
                        💾 Save Preset
                    </button>
                </div>
                
                <div class="preset-section">
                    <h3>Load Preset</h3>
                    <p class="preset-description">Upload a preset file to restore a design</p>
                    <div class="preset-load-controls">
                        <input type="file" id="presetFileInput" accept=".json" class="preset-file-input" style="display: none;">
                        <button type="button" class="preset-load-btn chatooly-btn chatooly-btn-secondary">
                            📁 Load Preset
                        </button>
                    </div>
                </div>
                
                <div class="preset-info">
                    <h4>About Presets</h4>
                    <ul class="preset-features">
                        <li>✅ Saves all text, styling, and animations</li>
                        <li>✅ Includes background images and colors</li>
                        <li>✅ Preserves all content cells and layers</li>
                        <li>⚠️ Videos cannot be saved (Phase I limitation)</li>
                        <li>⚠️ Custom fonts revert to defaults</li>
                    </ul>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    /**
     * Setup event listeners for preset controls
     */
    setupEventListeners() {
        // Save preset button
        const saveBtn = document.querySelector('.preset-save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.handleSavePreset());
        }

        // Load preset button
        const loadBtn = document.querySelector('.preset-load-btn');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => this.handleLoadPreset());
        }

        // File input change
        const fileInput = document.getElementById('presetFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }
    }

    /**
     * Handle save preset button click
     */
    handleSavePreset() {
        if (!this.presetManager) {
            this.showError('Preset system not initialized');
            return;
        }

        // Check for background video and show warning
        if (this.hasBackgroundVideo()) {
            const proceed = confirm(
                '⚠️ Background Video Detected\n\n' +
                'Videos cannot be saved in presets (Phase I limitation).\n' +
                'The preset will be saved without the video.\n\n' +
                'Continue?'
            );
            if (!proceed) {
                return;
            }
        }

        // Get preset name from user
        const presetName = prompt('Enter a name for your preset:', 'My Design');
        
        if (!presetName || presetName.trim() === '') {
            return; // User cancelled or entered empty name
        }

        try {
            this.showLoading('Saving preset...');
            this.presetManager.downloadPreset(presetName.trim());
            this.showSuccess(`Preset "${presetName}" saved successfully!`);
        } catch (error) {
            console.error('Save preset error:', error);
            this.showError('Failed to save preset: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Handle load preset button click
     */
    handleLoadPreset() {
        const fileInput = document.getElementById('presetFileInput');
        if (fileInput) {
            fileInput.click();
        }
    }

    /**
     * Handle file selection
     * @param {Event} event - File input change event
     */
    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.json')) {
            this.showError('Please select a valid JSON preset file');
            return;
        }

        // Validate file size (50MB limit)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            this.showError('File too large. Maximum size is 50MB');
            return;
        }

        try {
            this.showLoading('Loading preset...');
            await this.presetManager.loadPresetFromFile(file);
            this.showSuccess(`Preset "${file.name}" loaded successfully!`);
        } catch (error) {
            console.error('Load preset error:', error);
            this.showError('Failed to load preset: ' + error.message);
        } finally {
            this.hideLoading();
            // Clear the file input
            event.target.value = '';
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
        // Create or update loading indicator
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

    /**
     * Update preset info based on current state
     */
    updatePresetInfo() {
        const infoEl = document.querySelector('.preset-info');
        if (!infoEl) return;

        const features = infoEl.querySelector('.preset-features');
        if (!features) return;

        // Update features based on current state
        const hasVideo = this.hasBackgroundVideo();
        const videoItem = features.querySelector('li:nth-child(4)');
        if (videoItem) {
            videoItem.innerHTML = hasVideo ? 
                '⚠️ Background video detected (will be skipped)' : 
                '✅ No background video';
        }

        // Check for custom fonts
        const hasCustomFont = this.hasCustomFont();
        const fontItem = features.querySelector('li:nth-child(5)');
        if (fontItem) {
            fontItem.innerHTML = hasCustomFont ? 
                '⚠️ Custom font detected (will revert to default)' : 
                '✅ Using standard fonts';
        }
    }

    /**
     * Check if current design uses custom fonts
     * @returns {boolean} True if custom font is detected
     */
    hasCustomFont() {
        const fontFamily = this.app.mainTextComponent.fontFamily;
        // Check if font family contains custom font indicators
        return fontFamily && (
            fontFamily.includes('Custom') || 
            fontFamily.includes('Uploaded') ||
            !fontFamily.includes('Wix') && !fontFamily.includes('Arial') && !fontFamily.includes('sans-serif')
        );
    }

    /**
     * Get current preset summary for display
     * @returns {Object} Summary of current state
     */
    getCurrentStateSummary() {
        return {
            hasText: this.app.mainTextComponent.text.trim().length > 0,
            hasBackgroundImage: this.app.canvasManager.backgroundManager.backgroundImage !== null,
            hasBackgroundVideo: this.hasBackgroundVideo(),
            hasCustomFont: this.hasCustomFont(),
            cellCount: this.app.grid ? this.app.grid.getAllCells().length : 0,
            animatedCells: this.app.grid ? this.app.grid.getAnimatedCells().length : 0
        };
    }
}
