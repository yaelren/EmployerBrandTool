/**
 * UIManager.js - Manages all UI interactions and display updates
 * Handles event listeners, UI element caching, and UI state management
 */

class UIManager {
    /**
     * Create a new UIManager instance
     * @param {EmployerBrandToolPOC} app - Reference to main application instance
     */
    constructor(app) {
        this.app = app;
        this.elements = {}; // UI element cache

        // Initialize UI
        this.cacheUIElements();
        this.initializeFontFamilyDropdown();
        this.initializeFontUpload();
        this.setupEventListeners();
        
        // Set default mode to manual
        this.setTextMode('manual');
        
        // Initialize highlight color picker visibility
        if (this.elements.mainTextHighlightColor) {
            this.elements.mainTextHighlightColor.style.display = 'none';
        }
    }

    /**
     * Cache references to UI elements
     */
    cacheUIElements() {
        const requiredElements = {
            mainText: 'mainText',
            textColor: 'textColor',
            backgroundColor: 'backgroundColor',
            backgroundImage: 'backgroundImage',
            clearBackgroundImage: 'clearBackgroundImage',
            backgroundFillMode: 'backgroundFillMode',
            fontFamily: 'fontFamily',
            fontSize: 'fontSize',
            lineSpacing: 'lineSpacing',
            enableWrap: 'enableWrap',
            paddingHorizontal: 'paddingHorizontal',
            paddingHorizontalValue: 'paddingHorizontalValue',
            paddingVertical: 'paddingVertical',
            paddingVerticalValue: 'paddingVerticalValue',
            lineAlignmentControls: 'lineAlignmentControls',
            minSpotSize: 'minSpotSize',
            // Removed: findSpots, autoDetectSpots, spotCount, spotsList
            // Main text styling buttons
            mainTextBold: 'mainTextBold',
            mainTextItalic: 'mainTextItalic',
            mainTextUnderline: 'mainTextUnderline',
            mainTextHighlight: 'mainTextHighlight',
            mainTextHighlightColor: 'mainTextHighlightColor',
            mainTextFillWithBackgroundColor: 'mainTextFillWithBackgroundColor',
            mainTextBackgroundColor: 'mainTextBackgroundColor'
        };

        // Cache all elements
        for (const [key, id] of Object.entries(requiredElements)) {
            const element = document.getElementById(id);
            if (!element) {
                console.warn(`UI element not found: ${id} - this may be expected if the element was removed`);
            }
            this.elements[key] = element;
        }
    }

    /**
     * Initialize font family dropdown with options from TextComponent
     */
    initializeFontFamilyDropdown() {
        const fontFamilySelect = this.elements.fontFamily;

        // Get available fonts from TextComponent (single source of truth)
        const fonts = this.app.textEngine.getAvailableFonts();

        // Clear existing options
        fontFamilySelect.innerHTML = '';

        // Add font options
        fonts.forEach(font => {
            const option = document.createElement('option');
            option.value = font.value;
            option.textContent = font.name;
            
            // Mark custom fonts
            if (font.isCustom) {
                option.textContent += ' (Custom)';
                option.style.fontStyle = 'italic';
            }
            
            fontFamilySelect.appendChild(option);
        });

        // Add separator and upload option
        const separator = document.createElement('option');
        separator.disabled = true;
        separator.textContent = '───────────────';
        fontFamilySelect.appendChild(separator);

        const uploadOption = document.createElement('option');
        uploadOption.value = '__upload_font__';
        uploadOption.textContent = '📁 Upload custom font...';
        uploadOption.style.fontStyle = 'italic';
        uploadOption.style.color = '#999';
        fontFamilySelect.appendChild(uploadOption);

        // Set initial value to default
        fontFamilySelect.value = '"Wix Madefor Display", Arial, sans-serif';
    }

    /**
     * Refresh font family dropdown when custom fonts change
     */
    refreshFontFamilyDropdown() {
        this.initializeFontFamilyDropdown();
    }

    /**
     * Initialize font upload functionality
     */
    initializeFontUpload() {
        // Initialize FontManager if not already done
        if (typeof FontManager !== 'undefined' && !window.fontManager) {
            window.fontManager = new FontManager();
        }

        // Initialize FontUploadComponent if not already done
        if (typeof FontUploadComponent !== 'undefined' && !this.fontUploadComponent) {
            this.fontUploadComponent = new FontUploadComponent(window.fontManager);
        }
    }

    /**
     * Show font upload modal
     */
    showFontUploadModal() {
        // Initialize FontManager if not already done
        if (typeof FontManager !== 'undefined' && !window.fontManager) {
            window.fontManager = new FontManager();
        }

        // Initialize FontUploadComponent if not already done
        if (typeof FontUploadComponent !== 'undefined' && !this.fontUploadComponent) {
            this.fontUploadComponent = new FontUploadComponent(window.fontManager);
        }

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'font-upload-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Upload Custom Font</h3>
                        <button type="button" class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <!-- Font upload UI will be populated here -->
                    </div>
                </div>
            </div>
        `;

        // Add styles
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const overlay = modal.querySelector('.modal-overlay');
        overlay.style.cssText = `
            background: rgba(0, 0, 0, 0.8);
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const content = modal.querySelector('.modal-content');
        content.style.cssText = `
            background: var(--chatooly-color-surface, #1a1a1a);
            border-radius: 8px;
            max-width: 500px;
            max-height: 80vh;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            border: 1px solid var(--chatooly-color-border, #3a3a3a);
        `;

        const header = modal.querySelector('.modal-header');
        header.style.cssText = `
            padding: 20px;
            border-bottom: 1px solid var(--chatooly-color-border, #3a3a3a);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--chatooly-color-background, #121212);
        `;

        const headerTitle = header.querySelector('h3');
        headerTitle.style.cssText = `
            margin: 0;
            color: var(--chatooly-color-text, #e5e5e5);
            font-size: 18px;
        `;

        const body = modal.querySelector('.modal-body');
        body.style.cssText = `
            padding: 20px;
            max-height: 60vh;
            overflow-y: auto;
        `;

        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--chatooly-color-text, #e5e5e5);
        `;

        // Create font upload UI in modal
        if (this.fontUploadComponent) {
            this.fontUploadComponent.createUploadUI(
                body,
                () => {
                    this.refreshFontFamilyDropdown();
                    // Close modal after successful upload
                    setTimeout(() => {
                        if (modal.parentNode) {
                            modal.parentNode.removeChild(modal);
                        }
                    }, 2000);
                }
            );
        }

        // Add event listeners
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(modal);
            }
        });

        document.body.appendChild(modal);
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Canvas resize event from Chatooly CDN
        document.addEventListener('chatooly:canvas-resized', (e) => this.app.onCanvasResized(e));

        // Initialize shuffler UI
        this.initShufflerUI();

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.tab;
                this.switchTab(targetTab);

                // Update animation controls when switching to animation tab
                if (targetTab === 'animation') {
                    setTimeout(() => {
                        this.updateVisualGrid();
                        this.updateTextLineAnimations();
                    }, 50);
                }
            });
        });

        // Text input changes
        this.elements.mainText.addEventListener('input', () => {
            this.app.mainTextComponent.text = this.elements.mainText.value;
            this.app.onTextChanged();
        });

        // Canvas Padding Controls (moved from Grid tab to Main Text tab)
        const paddingHorizontal = document.getElementById('paddingHorizontal');
        const paddingVertical = document.getElementById('paddingVertical');
        const paddingHorizontalValue = document.getElementById('paddingHorizontalValue');
        const paddingVerticalValue = document.getElementById('paddingVerticalValue');

        if (paddingHorizontal) {
            console.log('Padding horizontal element found in Main Text tab');
            paddingHorizontal.removeEventListener('input', this.handlePaddingHorizontalInput);
            paddingHorizontal.removeEventListener('change', this.handlePaddingHorizontalChange);
            
            this.handlePaddingHorizontalInput = () => {
                const padding = parseInt(paddingHorizontal.value);
                if (paddingHorizontalValue) {
                    paddingHorizontalValue.textContent = padding + 'px';
                }
                console.log('Padding horizontal input:', padding);
                this.updateSymmetricalPaddingDisplay('horizontal', padding);
            };
            
            this.handlePaddingHorizontalChange = () => {
                const padding = parseInt(paddingHorizontal.value);
                console.log('Padding horizontal change:', padding);
                this.updateSymmetricalPadding('horizontal', padding);
            };
            
            paddingHorizontal.addEventListener('input', this.handlePaddingHorizontalInput);
            paddingHorizontal.addEventListener('change', this.handlePaddingHorizontalChange);
        }

        if (paddingVertical) {
            console.log('Padding vertical element found in Main Text tab');
            paddingVertical.removeEventListener('input', this.handlePaddingVerticalInput);
            paddingVertical.removeEventListener('change', this.handlePaddingVerticalChange);
            
            this.handlePaddingVerticalInput = () => {
                const padding = parseInt(paddingVertical.value);
                if (paddingVerticalValue) {
                    paddingVerticalValue.textContent = padding + 'px';
                }
                console.log('Padding vertical input:', padding);
                this.updateSymmetricalPaddingDisplay('vertical', padding);
            };
            
            this.handlePaddingVerticalChange = () => {
                const padding = parseInt(paddingVertical.value);
                console.log('Padding vertical change:', padding);
                this.updateSymmetricalPadding('vertical', padding);
            };
            
            paddingVertical.addEventListener('input', this.handlePaddingVerticalInput);
            paddingVertical.addEventListener('change', this.handlePaddingVerticalChange);
        }

        // Text color changes
        this.elements.textColor.addEventListener('input', () => {
            const color = this.elements.textColor.value;
            console.log('Text color changed to:', color);
            this.app.mainTextComponent.color = color;
            this.app.syncGridCellStyling(); // Sync to grid cells
            this.app.render();
        });

        // Font family changes
        this.elements.fontFamily.addEventListener('change', () => {
            const fontFamily = this.elements.fontFamily.value;
            
            // Handle upload option
            if (fontFamily === '__upload_font__') {
                this.showFontUploadModal();
                // Reset to previous selection
                this.elements.fontFamily.value = this.app.mainTextComponent.fontFamily || '"Wix Madefor Display", Arial, sans-serif';
                return;
            }
            
            this.app.mainTextComponent.fontFamily = fontFamily;
            this.app.textEngine.updateConfig({ fontFamily: fontFamily });
            this.app.onTextChanged(); // Font family affects text width - trigger auto-detection
        });

        // Main text styling buttons
        this.elements.mainTextBold.addEventListener('click', () => {
            this.app.mainTextComponent.fontWeight = this.app.mainTextComponent.fontWeight === 'bold' ? 'normal' : 'bold';
            const isActive = this.app.mainTextComponent.fontWeight === 'bold';
            this.elements.mainTextBold.classList.toggle('active', isActive);
            this.app.onTextChanged(); // Bold affects text width - trigger auto-detection
        });

        this.elements.mainTextItalic.addEventListener('click', () => {
            this.app.mainTextComponent.fontStyle = this.app.mainTextComponent.fontStyle === 'italic' ? 'normal' : 'italic';
            const isActive = this.app.mainTextComponent.fontStyle === 'italic';
            this.elements.mainTextItalic.classList.toggle('active', isActive);
            this.app.onTextChanged(); // Italic affects text width - trigger auto-detection
        });

        this.elements.mainTextUnderline.addEventListener('click', () => {
            this.app.mainTextComponent.underline = !this.app.mainTextComponent.underline;
            this.elements.mainTextUnderline.classList.toggle('active', this.app.mainTextComponent.underline);
            this.app.onTextChanged(); // Trigger complete rebuild to apply underline styling
        });

        this.elements.mainTextHighlight.addEventListener('click', () => {
            this.app.mainTextComponent.highlight = !this.app.mainTextComponent.highlight;
            this.elements.mainTextHighlight.classList.toggle('active', this.app.mainTextComponent.highlight);

            // Show/hide highlight color picker based on highlight state
            this.elements.mainTextHighlightColor.style.display = this.app.mainTextComponent.highlight ? 'inline-block' : 'none';

            this.app.onTextChanged(); // Trigger complete rebuild to apply highlight styling
        });

        // Highlight color changes
        this.elements.mainTextHighlightColor.addEventListener('input', () => {
            const color = this.elements.mainTextHighlightColor.value;
            console.log('Highlight color changed to:', color);
            this.app.mainTextComponent.highlightColor = color;
            this.app.syncGridCellStyling(); // Sync to grid cells
            if (this.app.mainTextComponent.highlight) {
                this.app.render();
            }
        });

        // Main text background controls
        if (this.elements.mainTextFillWithBackgroundColor) {
            this.elements.mainTextFillWithBackgroundColor.addEventListener('change', (e) => {
                const enabled = e.target.checked;
                const colorContainer = document.getElementById('mainTextBackgroundColorContainer');
                
                // Show/hide color picker
                colorContainer.style.display = enabled ? 'block' : 'none';
                
                // Update all main text cells
                this.app.grid?.getAllCells().forEach(cell => {
                    if (cell.type === 'main-text') {
                        cell.setFillWithBackgroundColor(enabled);
                        
                        // Set to global background color if no custom color is set
                        if (enabled && !cell.backgroundColor) {
                            cell.setBackgroundColor(this.app.canvasManager.backgroundManager.backgroundColor);
                            this.elements.mainTextBackgroundColor.value = cell.backgroundColor;
                        }
                    }
                });
                
                this.app.render();
            });
        }

        if (this.elements.mainTextBackgroundColor) {
            this.elements.mainTextBackgroundColor.addEventListener('input', (e) => {
                const color = e.target.value;
                
                // Update all main text cells
                this.app.grid?.getAllCells().forEach(cell => {
                    if (cell.type === 'main-text') {
                        cell.setBackgroundColor(color);
                    }
                });
                
                this.app.render();
            });
        }

        // Background color changes
        if (this.elements.backgroundColor) {
            this.elements.backgroundColor.addEventListener('input', () => {
                this.app.canvasManager.setBackgroundColor(this.elements.backgroundColor.value);
                this.app.render();
            });
        }

        // Background image upload
        if (this.elements.backgroundImage) {
            this.elements.backgroundImage.addEventListener('change', (e) => {
                this.handleBackgroundImageUpload(e);
            });
        }

        // Clear background image
        if (this.elements.clearBackgroundImage) {
            this.elements.clearBackgroundImage.addEventListener('click', () => {
                this.clearBackgroundImage();
            });
        }

        // Background space (canvas vs padding)
        const spaceRadios = document.querySelectorAll('input[name="backgroundSpace"]');
        spaceRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.updateBackgroundMode();
            });
        });

        // Background fill mode
        if (this.elements.backgroundFillMode) {
            this.elements.backgroundFillMode.addEventListener('change', () => {
                this.updateBackgroundMode();
            });
        }

        // Font size changes
        this.elements.fontSize.addEventListener('input', () => {
            const fontSize = parseInt(this.elements.fontSize.value);
            this.app.textEngine.updateConfig({ fontSize });
            this.app.applySavedAlignments(); // Restore alignments after config change
            this.app.render(); // Update display immediately
        });

        // Font size auto-detection on change
        this.elements.fontSize.addEventListener('change', () => {
            this.app.onTextChanged(); // Trigger auto-detection when value changes
        });

        // Line spacing changes
        this.elements.lineSpacing.addEventListener('input', () => {
            const lineSpacing = parseInt(this.elements.lineSpacing.value);
            this.app.textEngine.updateConfig({ lineSpacing });
            this.app.applySavedAlignments(); // Restore alignments after config change
            this.app.render(); // Update display immediately
        });

        // Line spacing auto-detection on change
        this.elements.lineSpacing.addEventListener('change', () => {
            this.app.onTextChanged(); // Trigger auto-detection when value changes
        });

        // Text wrapping toggle
        this.elements.enableWrap.addEventListener('change', () => {
            const enableWrap = this.elements.enableWrap.checked;
            this.app.textEngine.updateConfig({ enableWrap });
            this.app.onTextChanged();
        });

        // Symmetrical padding controls
        if (this.elements.paddingHorizontal) {
            this.elements.paddingHorizontal.addEventListener('input', () => {
                const padding = parseInt(this.elements.paddingHorizontal.value);
                if (this.elements.paddingHorizontalValue) {
                    this.elements.paddingHorizontalValue.textContent = padding + 'px';
                }
                this.updateSymmetricalPaddingDisplay('horizontal', padding); // Update display only
            });

            // Padding auto-detection on release
            this.elements.paddingHorizontal.addEventListener('change', () => {
                const padding = parseInt(this.elements.paddingHorizontal.value);
                this.updateSymmetricalPadding('horizontal', padding); // Trigger auto-detection
            });
        }

        if (this.elements.paddingVertical) {
            this.elements.paddingVertical.addEventListener('input', () => {
                const padding = parseInt(this.elements.paddingVertical.value);
                if (this.elements.paddingVerticalValue) {
                    this.elements.paddingVerticalValue.textContent = padding + 'px';
                }
                this.updateSymmetricalPaddingDisplay('vertical', padding); // Update display only
            });

            // Padding auto-detection on release
            this.elements.paddingVertical.addEventListener('change', () => {
                const padding = parseInt(this.elements.paddingVertical.value);
                this.updateSymmetricalPadding('vertical', padding); // Trigger auto-detection
            });
        }

        // Text positioning controls (manual mode only)
        document.querySelectorAll('.pos-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                document.querySelectorAll('.pos-btn').forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                e.target.classList.add('active');

                const vertical = e.target.dataset.vertical;
                const horizontal = e.target.dataset.horizontal;

                // Update both MainTextController and MainTextComponent
                this.app.textEngine.updateConfig({
                    textPositionVertical: vertical,
                    textPositionHorizontal: horizontal
                });

                // Also update MainTextComponent to keep them in sync
                this.app.mainTextComponent.positionH = horizontal;
                this.app.mainTextComponent.positionV = vertical;

                this.app.onTextChanged();
            });
        });

        // Canvas click handler removed - spot editing now handled through unified sidebar

        // Removed spot detection controls - auto-detection is now permanently enabled

        // Animation Controls Event Handlers
        this.setupAnimationEventListeners();

        // Visual Grid Animation Editor
        this.setupVisualGridListeners();
    }

    /**
     * Animation event listeners removed - auto-preview handles animation display
     */
    setupAnimationEventListeners() {
        // Manual animation controls removed - auto-preview handles animation display
        // Initialize text line animation controls on first setup
        this.updateTextLineAnimations();
    }

    /**
     * Update animation status display (updated for auto-preview mode)
     */
    updateAnimationStatus() {
        const animationCount = document.getElementById('animationCount');
        const playbackStatus = document.getElementById('playbackStatus');

        // These elements may not exist if animation tab was removed
        if (!animationCount && !playbackStatus) return;

        if (this.app.grid) {
            const animatedCells = this.app.grid.getAnimatedCells();
            const playingCount = animatedCells.filter(cell => cell.animation && cell.animation.isPlaying).length;

            if (animationCount) {
                animationCount.textContent = `${animatedCells.length} animations set`;
            }

            if (playbackStatus) {
                const statusText = playingCount > 0 ? 'Previewing' : 'Ready';
                playbackStatus.textContent = statusText;
            }
        }
    }

    /**
     * Show animation configuration popup
     * @param {MainTextCell} cell - Text cell to animate
     */
    showAnimationPopup(cell) {
        const popup = document.getElementById('animationPopup');
        const title = document.getElementById('popupTitle');
        const previewText = document.getElementById('previewText');
        const intensitySlider = document.getElementById('animationIntensity');

        if (!popup) return;

        // Store reference to cell being configured
        this.app.currentAnimationCell = cell;

        // Update popup content
        if (title) {
            title.textContent = `Animate "${cell.text}"`;
        }

        if (previewText) {
            previewText.textContent = cell.text;
        }

        // Set current animation values
        if (intensitySlider) {
            intensitySlider.value = cell.animation.intensity || 20;
            const intensityValue = document.getElementById('intensityValue');
            if (intensityValue) {
                intensityValue.textContent = `${intensitySlider.value}px`;
            }
        }

        // Select current animation type
        popup.querySelectorAll('.anim-option').forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.type === cell.animation.type) {
                option.classList.add('selected');
            }
        });

        // If no animation is set, select 'none' by default
        if (cell.animation.type === 'none') {
            const noneOption = popup.querySelector('.anim-option[data-type="none"]');
            if (noneOption) noneOption.classList.add('selected');
        }

        // Show popup
        popup.style.display = 'flex';
    }

    /**
     * Hide animation configuration popup
     */
    hideAnimationPopup() {
        const popup = document.getElementById('animationPopup');
        if (popup) {
            popup.style.display = 'none';
        }
        this.app.currentAnimationCell = null;
    }

    /**
     * Apply selected animation configuration
     */
    applySelectedAnimation() {
        if (!this.app.currentAnimationCell || !this.app.animationEngine) return;

        const popup = document.getElementById('animationPopup');
        const selectedOption = popup ? popup.querySelector('.anim-option.selected') : null;
        const intensitySlider = document.getElementById('animationIntensity');

        if (!selectedOption) return;

        const animationType = selectedOption.dataset.type;
        const intensity = intensitySlider ? parseInt(intensitySlider.value) : 20;

        // Apply animation to the cell
        this.app.animationEngine.setAnimation(
            this.app.currentAnimationCell.row,
            this.app.currentAnimationCell.col,
            animationType,
            intensity
        );

        // Update status display
        this.updateAnimationStatus();

        // Hide popup
        this.hideAnimationPopup();
    }

    /**
     * Update visual grid display showing all cells
     */
    updateVisualGrid() {
        const container = document.getElementById('visualGrid');
        if (!container) {
            return;
        }

        // Clear existing grid
        container.innerHTML = '';

        // Check if grid is ready
        if (!this.app.grid || !this.app.grid.isReady) {
            container.innerHTML = '<p class="no-text-message">Grid not ready. Add text to see grid...</p>';
            return;
        }

        // Set grid columns based on actual grid dimensions
        const cols = this.app.grid.cols || 3;
        container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

        // Create grid cells
        for (let row = 0; row < this.app.grid.rows; row++) {
            for (let col = 0; col < this.app.grid.cols; col++) {
                const cell = this.app.grid.getCell(row, col);

                const gridCellDiv = document.createElement('div');
                gridCellDiv.className = 'grid-cell';
                gridCellDiv.dataset.row = row;
                gridCellDiv.dataset.col = col;

                if (!cell) {
                    // Empty cell
                    gridCellDiv.classList.add('empty-cell');
                    gridCellDiv.innerHTML = `
                        <div class="grid-cell-content">—</div>
                        <div class="grid-cell-position">[${row},${col}]</div>
                    `;
                } else {
                    // Cell with content
                    const hasAnimation = cell.animation !== null;
                    if (hasAnimation) {
                        gridCellDiv.classList.add('has-animation');
                    }

                    const content = cell.type === 'main-text' ? cell.text :
                                   cell.type === 'content' ? `Content: ${cell.contentType}` :
                                   cell.type === 'spot' ? `Spot: ${cell.spotType}` :
                                   'Unknown';

                    let animInfo = '';
                    if (hasAnimation) {
                        const status = cell.animation.getStatus();
                        animInfo = `<div class="grid-cell-animation">${status.type}</div>`;
                    }

                    gridCellDiv.innerHTML = `
                        <div class="grid-cell-content">${content}</div>
                        <div class="grid-cell-position">[${row},${col}]</div>
                        ${animInfo}
                    `;

                    // Add click handler for non-empty cells
                    gridCellDiv.addEventListener('click', () => this.selectGridCell(row, col));
                }

                container.appendChild(gridCellDiv);
            }
        }
    }

    /**
     * Select a grid cell for animation editing
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    selectGridCell(row, col) {
        const cell = this.app.grid.getCell(row, col);
        if (!cell) return;

        // Update selected cell
        this.app.selectedCell = { row, col, cell };

        // Highlight selected cell in visual grid
        document.querySelectorAll('.grid-cell').forEach(el => {
            el.classList.remove('selected');
        });
        const selectedDiv = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
        if (selectedDiv) {
            selectedDiv.classList.add('selected');
        }

        // Show selected cell controls
        this.showSelectedCellControls(cell, row, col);
    }

    /**
     * Show unified controls for selected cell
     * @param {Object} cell - Selected cell
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    showSelectedCellControls(cell, row, col) {
        const controlsContainer = document.getElementById('selectedCellControls');
        const infoContainer = document.getElementById('selectedCellInfo');
        const sectionsContainer = document.querySelector('.cell-control-sections');

        if (!controlsContainer || !infoContainer || !sectionsContainer) return;

        // Show controls container
        controlsContainer.style.display = 'block';

        // Update cell info
        const content = cell.type === 'main-text' ? `"${cell.text}"` :
                       cell.type === 'content' ? `Content (${cell.contentType})` :
                       cell.type === 'spot' ? `Spot (${cell.spotType})` :
                       'Unknown';
        infoContainer.innerHTML = `
            <div class="selected-cell-header">
                <h4>${content} [${row},${col}]</h4>
            </div>
        `;

        // Clear existing control sections
        sectionsContainer.innerHTML = '';

        // Create control sections
        this.createContentControls(cell, sectionsContainer);
        this.createAnimationControls(cell, sectionsContainer);
        this.createLayerControls(cell, sectionsContainer);
    }

    /**
     * Create content controls section
     * @param {Object} cell - Selected cell
     * @param {HTMLElement} container - Container for controls
     */
    createContentControls(cell, container) {
        const section = this.createControlSection('Content', 'content');
        
        // Content type selector
        const typeGroup = document.createElement('div');
        typeGroup.className = 'chatooly-control-group';
        typeGroup.innerHTML = `
            <label>Content Type:</label>
            <select class="cell-content-type">
                <option value="empty">Empty</option>
                <option value="text">Text</option>
                <option value="image">Image</option>
                <option value="fill">Fill</option>
            </select>
        `;

        const typeSelect = typeGroup.querySelector('.cell-content-type');
        typeSelect.value = cell.contentType || 'empty';

        // Content-specific controls container
        const contentControls = document.createElement('div');
        contentControls.className = 'content-specific-controls';

        // Add event listener for type changes
        typeSelect.addEventListener('change', (e) => {
            const newType = e.target.value;
            cell.setContentType(newType);
            this.updateContentSpecificControls(cell, contentControls, newType);
            this.app.render();
        });

        // Add content-specific controls
        this.updateContentSpecificControls(cell, contentControls, cell.contentType || 'empty');

        section.querySelector('.control-section-content').appendChild(typeGroup);
        section.querySelector('.control-section-content').appendChild(contentControls);
        container.appendChild(section);
    }

    /**
     * Create animation controls section
     * @param {Object} cell - Selected cell
     * @param {HTMLElement} container - Container for controls
     */
    createAnimationControls(cell, container) {
        const section = this.createControlSection('Animation', 'animation');
        
        const animGroup = document.createElement('div');
        animGroup.className = 'chatooly-control-group';
        animGroup.innerHTML = `
            <label>Animation Type:</label>
            <select class="cell-animation-type">
                <option value="none">None</option>
                <option value="sway">Sway</option>
                <option value="bounce">Bounce</option>
                <option value="rotate">Rotate</option>
                <option value="pulse">Pulse</option>
            </select>
        `;

        const animSelect = animGroup.querySelector('.cell-animation-type');
        if (cell.animation) {
            const status = cell.animation.getStatus();
            animSelect.value = status.type;
        } else {
            animSelect.value = 'none';
        }

        // Animation-specific controls container
        const animControls = document.createElement('div');
        animControls.className = 'animation-specific-controls';

        // Add event listener for animation changes
        animSelect.addEventListener('change', (e) => {
            const animType = e.target.value;
            if (animType === 'none') {
                cell.removeAnimation();
            } else {
                const intensity = 20;
                const speed = 1.0;
                cell.setAnimation(animType, intensity, speed);
                // Auto-preview animation
                this.previewAnimation(cell, animType);
            }
            this.updateAnimationSpecificControls(cell, animControls, animType);
            this.app.render();
        });

        // Add animation-specific controls
        this.updateAnimationSpecificControls(cell, animControls, animSelect.value);

        section.querySelector('.control-section-content').appendChild(animGroup);
        section.querySelector('.control-section-content').appendChild(animControls);
        container.appendChild(section);
    }

    /**
     * Create layer controls section
     * @param {Object} cell - Selected cell
     * @param {HTMLElement} container - Container for controls
     */
    createLayerControls(cell, container) {
        const section = this.createControlSection('Layer', 'layer');
        
        const layerGroup = document.createElement('div');
        layerGroup.className = 'chatooly-control-group';
        layerGroup.innerHTML = `
            <label>Layer Position:</label>
            <select class="cell-layer-position">
                <option value="background">Background</option>
                <option value="behind-main-text">Behind Main Text</option>
                <option value="main-text">Main Text</option>
                <option value="above-main-text">Above Main Text</option>
            </select>
        `;

        const layerSelect = layerGroup.querySelector('.cell-layer-position');
        layerSelect.value = cell.layerId || 'main-text';

        // Add event listener for layer changes
        layerSelect.addEventListener('change', (e) => {
            const newLayerId = e.target.value;
            cell.setLayer(newLayerId);
            this.app.render();
        });

        section.querySelector('.control-section-content').appendChild(layerGroup);
        container.appendChild(section);
    }

    /**
     * Create expandable control section
     * @param {string} title - Section title
     * @param {string} id - Section ID
     * @returns {HTMLElement} Control section element
     */
    createControlSection(title, id) {
        const section = document.createElement('div');
        section.className = 'control-section';
        section.innerHTML = `
            <div class="control-section-header" data-section="${id}">
                <span>${title}</span>
                <span class="section-toggle">▼</span>
            </div>
            <div class="control-section-content">
                <!-- Controls will be added here -->
            </div>
        `;

        // Add toggle functionality
        const header = section.querySelector('.control-section-header');
        const content = section.querySelector('.control-section-content');
        const toggle = section.querySelector('.section-toggle');

        header.addEventListener('click', () => {
            const isExpanded = content.classList.contains('expanded');
            if (isExpanded) {
                content.classList.remove('expanded');
                toggle.textContent = '▼';
            } else {
                content.classList.add('expanded');
                toggle.textContent = '▲';
            }
        });

        return section;
    }

    /**
     * Update content-specific controls based on content type
     * @param {Object} cell - Selected cell
     * @param {HTMLElement} container - Container for controls
     * @param {string} contentType - Content type
     */
    updateContentSpecificControls(cell, container, contentType) {
        // Clear existing controls
        container.innerHTML = '';

        // Use appropriate controller for the content type
        const controller = this.app.contentControllers[contentType];
        if (controller) {
            controller.createControls(cell, container, 'sidebar');

            // Add padding control for all non-empty content types
            if (contentType !== 'empty' && controller.createPaddingControl) {
                controller.createPaddingControl(cell, container, 'sidebar');
            }
        }
    }

    /**
     * Update animation-specific controls based on animation type
     * @param {Object} cell - Selected cell
     * @param {HTMLElement} container - Container for controls
     * @param {string} animType - Animation type
     */
    updateAnimationSpecificControls(cell, container, animType) {
        // Clear existing controls
        container.innerHTML = '';

        if (animType === 'none') {
            container.innerHTML = '<p class="no-animation-message">No animation selected</p>';
            return;
        }

        // Create intensity control
        const intensityGroup = document.createElement('div');
        intensityGroup.className = 'chatooly-control-group';
        intensityGroup.innerHTML = `
            <label>Intensity: <span class="intensity-value">20px</span></label>
            <input type="range" class="animation-intensity" min="5" max="50" value="20">
        `;

        const intensitySlider = intensityGroup.querySelector('.animation-intensity');
        const intensityValue = intensityGroup.querySelector('.intensity-value');

        intensitySlider.addEventListener('input', () => {
            const value = parseInt(intensitySlider.value);
            intensityValue.textContent = value + 'px';
            if (cell.animation) {
                cell.animation.updateConfig({ intensity: value });
                this.app.render();
            }
        });

        // Create speed control
        const speedGroup = document.createElement('div');
        speedGroup.className = 'chatooly-control-group';
        speedGroup.innerHTML = `
            <label>Speed: <span class="speed-value">1.0x</span></label>
            <input type="range" class="animation-speed" min="0.5" max="2" step="0.1" value="1.0">
        `;

        const speedSlider = speedGroup.querySelector('.animation-speed');
        const speedValue = speedGroup.querySelector('.speed-value');

        speedSlider.addEventListener('input', () => {
            const value = parseFloat(speedSlider.value);
            speedValue.textContent = value.toFixed(1) + 'x';
            if (cell.animation) {
                cell.animation.updateConfig({ speed: value });
                this.app.render();
            }
        });

        container.appendChild(intensityGroup);
        container.appendChild(speedGroup);
    }

    /**
     * Preview animation for selected cell
     * @param {Object} cell - Selected cell
     * @param {string} animType - Animation type
     */
    previewAnimation(cell, animType) {
        if (!this.app.grid) return;

        // Start animation preview
        this.app.grid.playAllAnimations();
        this.app._startAnimationLoop();

        // Stop preview after 3 seconds
        setTimeout(() => {
            this.app.grid.pauseAllAnimations();
            this.app._stopAnimationLoop();
        }, 3000);
    }

    /**
     * Setup event listeners for visual grid animation controls
     */
    setupVisualGridListeners() {
        // Intensity slider
        const intensityInput = document.getElementById('cellAnimationIntensity');
        const intensityValue = document.getElementById('intensityValue');
        if (intensityInput && intensityValue) {
            intensityInput.addEventListener('input', () => {
                intensityValue.textContent = intensityInput.value;
            });
        }

        // Speed slider
        const speedInput = document.getElementById('cellAnimationSpeed');
        const speedValue = document.getElementById('speedValue');
        if (speedInput && speedValue) {
            speedInput.addEventListener('input', () => {
                speedValue.textContent = parseFloat(speedInput.value).toFixed(1);
            });
        }

        // Apply animation button
        const applyBtn = document.getElementById('applyCellAnimation');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applyCellAnimation());
        }

        // Remove animation button
        const removeBtn = document.getElementById('removeCellAnimation');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => this.removeCellAnimation());
        }
    }

    /**
     * Apply animation to selected cell
     */
    applyCellAnimation() {
        if (!this.app.selectedCell) return;

        const { row, col, cell } = this.app.selectedCell;
        const type = document.getElementById('cellAnimationType').value;
        const intensity = parseInt(document.getElementById('cellAnimationIntensity').value);
        const speed = parseFloat(document.getElementById('cellAnimationSpeed').value);

        if (type === 'none') {
            cell.removeAnimation();
        } else {
            cell.setAnimation(type, intensity, speed);
        }

        // Update visual grid
        this.updateVisualGrid();
        this.updateAnimationStatus();
    }

    /**
     * Remove animation from selected cell
     */
    removeCellAnimation() {
        if (!this.app.selectedCell) return;

        const { row, col, cell } = this.app.selectedCell;
        cell.removeAnimation();

        // Update UI
        document.getElementById('cellAnimationType').value = 'none';
        this.updateVisualGrid();
        this.updateAnimationStatus();
    }

    /**
     * Update text line animation controls in the sidebar
     */
    updateTextLineAnimations() {
        const container = document.getElementById('textLineAnimations');
        if (!container) return;

        // Clear existing content
        container.innerHTML = '';

        // Get current text content
        const text = this.elements.mainText.value.trim();
        if (!text) {
            container.innerHTML = '<p class="no-text-message">Enter text to see animation options</p>';
            return;
        }

        // Check if grid is ready
        if (!this.app.grid || !this.app.grid.isReady) {
            container.innerHTML = '<p class="no-text-message">Loading text lines...</p>';
            return;
        }

        // Get text cells from grid
        const textCells = this.app.grid.getAllCells().filter(cell => cell && cell.type === 'main-text');

        if (textCells.length === 0) {
            container.innerHTML = '<p class="no-text-message">No text lines found</p>';
            return;
        }

        // Create controls for each text line
        textCells.forEach((cell, index) => {
            if (!cell.text || cell.isEmpty()) return;

            // Get animation status
            const animStatus = cell.animation ? cell.animation.getStatus() : null;
            const currentType = animStatus ? animStatus.type : 'none';
            const currentIntensity = animStatus ? animStatus.intensity : 20;

            const lineControl = document.createElement('div');
            lineControl.className = 'text-line-control';
            lineControl.innerHTML = `
                <div class="text-line-header">
                    <h4>Line ${index + 1}: "${cell.text}"</h4>
                    <span class="animation-status">${this.getAnimationStatusText(cell)}</span>
                </div>
                <div class="animation-controls">
                    <div class="animation-type-selector">
                        <label>Animation Type:</label>
                        <div class="animation-buttons">
                            <button type="button" class="animation-type-btn ${currentType === 'none' ? 'active' : ''}"
                                    data-type="none" data-row="${cell.row}" data-col="${cell.col}">
                                None
                            </button>
                            <button type="button" class="animation-type-btn ${currentType === 'sway' ? 'active' : ''}"
                                    data-type="sway" data-row="${cell.row}" data-col="${cell.col}">
                                Sway
                            </button>
                            <button type="button" class="animation-type-btn ${currentType === 'bounce' ? 'active' : ''}"
                                    data-type="bounce" data-row="${cell.row}" data-col="${cell.col}">
                                Bounce
                            </button>
                            <button type="button" class="animation-type-btn ${currentType === 'rotate' ? 'active' : ''}"
                                    data-type="rotate" data-row="${cell.row}" data-col="${cell.col}">
                                Rotate
                            </button>
                            <button type="button" class="animation-type-btn ${currentType === 'pulse' ? 'active' : ''}"
                                    data-type="pulse" data-row="${cell.row}" data-col="${cell.col}">
                                Pulse
                            </button>
                        </div>
                    </div>
                    <div class="animation-intensity-control ${currentType === 'none' ? 'disabled' : ''}">
                        <label>Intensity: <span class="intensity-value">${currentIntensity}px</span></label>
                        <input type="range" class="intensity-slider"
                               min="5" max="50" value="${currentIntensity}"
                               data-row="${cell.row}" data-col="${cell.col}">
                    </div>
                </div>
            `;

            container.appendChild(lineControl);
        });

        // Add event listeners to animation controls
        this.setupTextLineAnimationListeners(container);
    }

    /**
     * Set up event listeners for text line animation controls
     * @param {HTMLElement} container - Container with controls
     */
    setupTextLineAnimationListeners(container) {
        // Animation type buttons
        container.querySelectorAll('.animation-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                const type = e.target.dataset.type;

                // Apply animation to the cell
                this.setTextLineAnimation(row, col, type);

                // Update UI to reflect changes
                this.updateTextLineAnimations();
                this.updateAnimationStatus();
            });
        });

        // Intensity sliders
        container.querySelectorAll('.intensity-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                const intensity = parseInt(e.target.value);

                // Update intensity display
                const valueDisplay = e.target.parentElement.querySelector('.intensity-value');
                if (valueDisplay) {
                    valueDisplay.textContent = `${intensity}px`;
                }

                // Apply new intensity
                this.updateTextLineAnimationIntensity(row, col, intensity);
            });
        });
    }

    /**
     * Set animation for a text line
     * @param {number} row - Grid row
     * @param {number} col - Grid column
     * @param {string} type - Animation type
     */
    setTextLineAnimation(row, col, type) {
        if (!this.app.grid) return;

        const cell = this.app.grid.getCell(row, col);
        if (!cell) return;

        if (type === 'none') {
            // Remove animation
            cell.removeAnimation();
        } else {
            // Set animation with default intensity
            const intensity = 20;
            const speed = 1.0;
            cell.setAnimation(type, intensity, speed);
        }
    }

    /**
     * Update animation intensity for a text line
     * @param {number} row - Grid row
     * @param {number} col - Grid column
     * @param {number} intensity - Animation intensity
     */
    updateTextLineAnimationIntensity(row, col, intensity) {
        if (!this.app.grid) return;

        const cell = this.app.grid.getCell(row, col);
        if (cell && cell.animation) {
            // Update the animation configuration
            cell.animation.updateConfig({ intensity });
        }
    }

    /**
     * Update line alignment controls based on current text
     */
    updateLineAlignmentControls() {
        const container = this.elements.lineAlignmentControls;

        // Sync main text component first
        this.app.syncMainTextComponent();

        // Get lines from main text component
        const ctx = this.app.canvasManager.ctx;
        ctx.save();

        let fontSize = this.app.mainTextComponent.fontSize;
        if (fontSize === 'auto') {
            fontSize = this.app.mainTextComponent.calculateAutoFontSize(ctx);
        }

        ctx.font = this.app.mainTextComponent.getFontString(fontSize);
        const availableWidth = this.app.mainTextComponent.getAvailableWidth();
        const lines = this.app.mainTextComponent.wrapTextToLines(ctx, this.app.mainTextComponent.text, availableWidth, fontSize);

        ctx.restore();

        // Clear existing controls
        container.innerHTML = '';

        // Create alignment control for each line
        lines.forEach((line, index) => {
            if (!line.trim()) return; // Skip empty lines

            // Get the current alignment from MainTextComponent
            const currentAlignment = this.app.mainTextComponent.getLineAlignment(index);

            const lineControl = document.createElement('div');
            lineControl.className = 'line-alignment-control';
            lineControl.innerHTML = `
                <label>Line ${index + 1}: "${line}"</label>
                <div class="alignment-buttons">
                    <button type="button" class="align-btn align-left-icon ${currentAlignment === 'left' ? 'active' : ''}"
                            data-line="${index}" data-align="left" title="Align Left"><span class="align-icon"></span></button>
                    <button type="button" class="align-btn align-center-icon ${currentAlignment === 'center' ? 'active' : ''}"
                            data-line="${index}" data-align="center" title="Align Center"><span class="align-icon"></span></button>
                    <button type="button" class="align-btn align-right-icon ${currentAlignment === 'right' ? 'active' : ''}"
                            data-line="${index}" data-align="right" title="Align Right"><span class="align-icon"></span></button>
                </div>
            `;

            container.appendChild(lineControl);
        });

        // Add event listeners to alignment buttons
        container.querySelectorAll('.align-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lineIndex = parseInt(e.currentTarget.dataset.line);
                const alignment = e.currentTarget.dataset.align;
                this.setLineAlignment(lineIndex, alignment);
            });
        });
    }

    /**
     * Set alignment for a specific line
     * @param {number} lineIndex - Index of the line
     * @param {string} alignment - 'left', 'center', or 'right'
     */
    setLineAlignment(lineIndex, alignment) {
        // Sync main text component first
        this.app.syncMainTextComponent();

        // Get lines from main text component
        const ctx = this.app.canvasManager.ctx;
        ctx.save();

        let fontSize = this.app.mainTextComponent.fontSize;
        if (fontSize === 'auto') {
            fontSize = this.app.mainTextComponent.calculateAutoFontSize(ctx);
        }

        ctx.font = this.app.mainTextComponent.getFontString(fontSize);
        const availableWidth = this.app.mainTextComponent.getAvailableWidth();
        const lines = this.app.mainTextComponent.wrapTextToLines(ctx, this.app.mainTextComponent.text, availableWidth, fontSize);

        ctx.restore();

        const line = lines[lineIndex];

        if (line && line.trim()) {
            // Save the alignment preference for this line content
            const lineKey = line.trim();
            this.app.savedLineAlignments[lineKey] = alignment;
        }

        // CRITICAL: Update BOTH systems to keep them in sync
        // 1. Update MainTextComponent (for rendering)
        this.app.mainTextComponent.setLineAlignment(lineIndex, alignment);

        // 2. Update MainTextController (for grid detection and bounds)
        if (this.app.textEngine) {
            this.app.textEngine.setLineAlignment(lineIndex, alignment);
        }

        this.updateLineAlignmentControls(); // Refresh controls to show active state
        this.app.onTextChanged(); // Trigger auto-detection for layout change
    }

    /**
     * Set text mode (manual only)
     * @param {string} mode - 'manual' (only mode supported)
     */
    setTextMode(mode) {
        // Always use manual mode
        this.app.textEngine.updateConfig({ mode: 'manual' });

        // Update canvas dimensions in textEngine
        this.app.textEngine.updateConfig({
            canvasWidth: this.app.canvasManager.canvas.width,
            canvasHeight: this.app.canvasManager.canvas.height
        });

        this.app.onTextChanged();
    }

    /**
     * Switch between tabs
     * @param {string} tabName - Tab to switch to
     */
    switchTab(tabName) {
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Add active class to selected tab
        const activeTabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTabBtn) {
            activeTabBtn.classList.add('active');
        }

        // Show corresponding content
        let contentId;
        switch(tabName) {
            case 'mainText':
                contentId = 'mainTextTab';
                break;
            case 'grid':
                contentId = 'gridTab';
                break;
            case 'parameters':
                contentId = 'parametersTab';
                break;
        }

        const activeContent = document.getElementById(contentId);
        if (activeContent) {
            activeContent.classList.add('active');
        }

        // Update visual grid when switching to grid tab
        if (tabName === 'grid') {
            setTimeout(() => {
                this.updateVisualGrid();
                this.setupGridTabEventListeners();
            }, 50);
        }
    }

    /**
     * Setup event listeners for Grid tab controls
     * Called when Grid tab is shown to ensure elements are accessible
     */
    setupGridTabEventListeners() {
        console.log('Setting up Grid tab event listeners');
        
        // Re-cache background elements from the Grid tab
        const backgroundColor = document.getElementById('backgroundColor');
        const backgroundOpacity = document.getElementById('backgroundOpacity');
        const backgroundOpacityValue = document.getElementById('backgroundOpacityValue');
        const transparentBackground = document.getElementById('transparentBackground');
        const backgroundMedia = document.getElementById('backgroundMedia');
        const clearBackgroundMedia = document.getElementById('clearBackgroundMedia');
        const backgroundVideoAutoplay = document.getElementById('backgroundVideoAutoplay');
        const backgroundVideoLoop = document.getElementById('backgroundVideoLoop');
        const backgroundFitMode = document.getElementById('backgroundFitMode');
        const paddingHorizontal = document.getElementById('paddingHorizontal');
        const paddingHorizontalValue = document.getElementById('paddingHorizontalValue');
        const paddingVertical = document.getElementById('paddingVertical');
        const paddingVerticalValue = document.getElementById('paddingVerticalValue');

        // Background color changes
        if (backgroundColor) {
            console.log('Background color element found in Grid tab');
            // Remove existing listeners to avoid duplicates
            backgroundColor.removeEventListener('input', this.handleBackgroundColorChange);
            this.handleBackgroundColorChange = () => {
                console.log('Background color changed:', backgroundColor.value);
                this.updateBackgroundColor();
            };
            backgroundColor.addEventListener('input', this.handleBackgroundColorChange);
        }

        // Background opacity changes
        if (backgroundOpacity) {
            console.log('Background opacity element found in Grid tab');
            backgroundOpacity.removeEventListener('input', this.handleBackgroundOpacityChange);
            this.handleBackgroundOpacityChange = () => {
                const opacity = parseInt(backgroundOpacity.value);
                if (backgroundOpacityValue) {
                    backgroundOpacityValue.textContent = opacity + '%';
                }
                console.log('Background opacity changed:', opacity);
                this.updateBackgroundColor();
            };
            backgroundOpacity.addEventListener('input', this.handleBackgroundOpacityChange);
        }

        // Transparent background toggle
        if (transparentBackground) {
            console.log('Transparent background element found in Grid tab');
            transparentBackground.removeEventListener('change', this.handleTransparentBackgroundChange);
            this.handleTransparentBackgroundChange = () => {
                console.log('Transparent background changed:', transparentBackground.checked);
                this.updateBackgroundColor();
            };
            transparentBackground.addEventListener('change', this.handleTransparentBackgroundChange);
        }

        // Background media upload
        if (backgroundMedia) {
            console.log('Background media element found in Grid tab');
            const handler = (e) => {
                console.log('Background media upload triggered');
                this.handleBackgroundMediaUpload(e);
            };
            backgroundMedia.removeEventListener('change', handler);
            backgroundMedia.addEventListener('change', handler);
        }

        // Clear background media
        if (clearBackgroundMedia) {
            console.log('Clear background media element found in Grid tab');
            const handler = () => {
                console.log('Clear background media clicked');
                this.clearBackgroundMedia();
            };
            clearBackgroundMedia.removeEventListener('click', handler);
            clearBackgroundMedia.addEventListener('click', handler);
        }

        // Background video controls
        if (backgroundVideoAutoplay) {
            backgroundVideoAutoplay.removeEventListener('change', this.handleBackgroundVideoChange);
            this.handleBackgroundVideoChange = () => {
                console.log('Background video settings changed');
                this.updateBackgroundVideoSettings();
            };
            backgroundVideoAutoplay.addEventListener('change', this.handleBackgroundVideoChange);
        }

        if (backgroundVideoLoop) {
            backgroundVideoLoop.removeEventListener('change', this.handleBackgroundVideoChange);
            backgroundVideoLoop.addEventListener('change', this.handleBackgroundVideoChange);
        }

        // Background fit mode
        if (backgroundFitMode) {
            console.log('Background fit mode element found in Grid tab');
            backgroundFitMode.removeEventListener('change', this.handleBackgroundFitModeChange);
            this.handleBackgroundFitModeChange = (e) => {
                console.log('Background fit mode changed:', e.target.value);
                this.app.setBackgroundFitMode(e.target.value);
            };
            backgroundFitMode.addEventListener('change', this.handleBackgroundFitModeChange);
        }

        // Minimum spot size changes
        if (this.elements.minSpotSize) {
            console.log('Minimum spot size element found in Grid tab');
            this.elements.minSpotSize.addEventListener('input', () => {
                const minSize = parseInt(this.elements.minSpotSize.value);
                console.log('Minimum spot size changed to:', minSize);
                this.app.gridDetector.setMinCellSize(minSize);
                this.app.minSpotSize = minSize; // Store for Grid.buildFromExisting()
                this.app.onTextChanged(); // Trigger spot detection with new size
            });
        }
    }

    /**
     * Update symmetrical padding display only (no auto-detection)
     * @param {string} direction - 'horizontal' or 'vertical'
     * @param {number} value - Padding value
     */
    updateSymmetricalPaddingDisplay(direction, value) {
        if (direction === 'horizontal') {
            this.app.textEngine.updateConfig({
                paddingLeft: value,
                paddingRight: value
            });
        } else if (direction === 'vertical') {
            this.app.textEngine.updateConfig({
                paddingTop: value,
                paddingBottom: value
            });
        }

        // Update main text component padding
        const paddingH = this.elements.paddingHorizontal ? parseInt(this.elements.paddingHorizontal.value) : 20;
        const paddingV = this.elements.paddingVertical ? parseInt(this.elements.paddingVertical.value) : 20;
        this.app.mainTextComponent.setPaddingIndividual({
            left: paddingH,
            right: paddingH,
            top: paddingV,
            bottom: paddingV
        });

        this.app.render(); // Update display immediately
    }

    /**
     * Update symmetrical padding with auto-detection
     * @param {string} direction - 'horizontal' or 'vertical'
     * @param {number} value - Padding value
     */
    updateSymmetricalPadding(direction, value) {
        if (direction === 'horizontal') {
            this.app.textEngine.updateConfig({
                paddingLeft: value,
                paddingRight: value
            });
        } else if (direction === 'vertical') {
            this.app.textEngine.updateConfig({
                paddingTop: value,
                paddingBottom: value
            });
        }
        this.app.onTextChanged();
    }

    /**
     * Handle background image upload
     * @param {Event} e - File input change event
     */
    handleBackgroundImageUpload(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            // Set callback to render when image is loaded
            this.app.canvasManager.setBackgroundImage(file, () => {
                this.elements.clearBackgroundImage.style.display = 'block';
                this.app.render();
            });
        }
    }

    /**
     * Update background mode based on space and fill mode selections
     */
    updateBackgroundMode() {
        const spaceRadios = document.querySelectorAll('input[name="backgroundSpace"]');
        const selectedSpace = Array.from(spaceRadios).find(radio => radio.checked)?.value || 'canvas';
        const fillMode = this.elements.backgroundFillMode?.value || 'stretch';
        
        // Combine space and fill mode into single mode string
        let combinedMode;
        if (selectedSpace === 'canvas') {
            if (fillMode === 'stretch') {
                combinedMode = 'stretch-canvas';
            } else if (fillMode === 'fit') {
                combinedMode = 'fit-canvas';
            } else if (fillMode === 'fill') {
                combinedMode = 'fill-canvas';
            }
        } else { // padding
            if (fillMode === 'stretch') {
                combinedMode = 'stretch-padding';
            } else if (fillMode === 'fit') {
                combinedMode = 'fit-padding';
            } else if (fillMode === 'fill') {
                combinedMode = 'fill-padding';
            }
        }
        
        this.app.canvasManager.setBackgroundFitMode(combinedMode);
        this.app.render();
    }

    /**

    /**
     * Convert hex color to RGBA
     * @param {string} hex - Hex color (#ffffff)
     * @param {number} alpha - Alpha value (0-1)
     * @returns {string} RGBA color string
     */
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Handle background media upload (image or video)
     * @param {Event} event - File input change event
     */
    handleBackgroundMediaUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const fileType = file.type;
            const fileName = file.name.toLowerCase();

            // Determine media type
            let mediaType = 'other';
            if (fileType.startsWith('image/')) {
                mediaType = 'image';
            } else if (fileType.startsWith('video/')) {
                mediaType = 'video';
            }

            if (mediaType === 'image') {
                // Handle images
                const img = new Image();
                img.onload = () => {
                    this.app.canvasManager.setBackgroundImage(img);
                    this.elements.clearBackgroundMedia.style.display = 'inline-block';
                    this.elements.backgroundVideoControls.style.display = 'none';
                    this.app.render();
                };
                img.src = e.target.result;
            } else if (mediaType === 'video') {
                // Handle videos
                const video = document.createElement('video');
                video.src = e.target.result;
                video.preload = 'metadata';
                video.crossOrigin = 'anonymous';
                video.autoplay = true; // Always enable autoplay attribute
                video.loop = this.elements.backgroundVideoLoop.checked;
                video.muted = true; // Always muted for autoplay compatibility
                video.controls = false;
                
                console.log('Setting up background video with autoplay:', video.autoplay, 'loop:', video.loop);
                
                video.addEventListener('loadedmetadata', () => {
                    console.log('Background video metadata loaded:', video.videoWidth, 'x', video.videoHeight);
                    this.app.setBackgroundVideo(video);
                    this.elements.clearBackgroundMedia.style.display = 'inline-block';
                    this.elements.backgroundVideoControls.style.display = 'flex';
                    this.app.render();
                    
                    // Start playing if autoplay is enabled
                    if (this.elements.backgroundVideoAutoplay.checked) {
                        console.log('Attempting to start background video playback...');
                        video.play().then(() => {
                            console.log('Background video started playing successfully');
                        }).catch(error => {
                            console.warn('Background video autoplay failed:', error);
                        });
                    }
                });

                video.addEventListener('canplay', () => {
                    console.log('Background video can play, current state:', {
                        paused: video.paused,
                        autoplay: video.autoplay,
                        readyState: video.readyState
                    });
                    // Ensure video starts playing if autoplay is enabled
                    if (this.elements.backgroundVideoAutoplay.checked && video.paused) {
                        console.log('Attempting to start background video playback from canplay event...');
                        video.play().then(() => {
                            console.log('Background video started playing from canplay event');
                        }).catch(error => {
                            console.warn('Background video autoplay failed from canplay event:', error);
                        });
                    }
                });

                video.addEventListener('error', (event) => {
                    console.error('Error loading background video:', video.error, event);
                    alert('Error loading background video file. Please try a different format.');
                });
                
                video.load();
            } else {
                console.warn('Unsupported file type:', fileType);
                alert('Unsupported file type. Please select an image or video file.');
            }
        };
        reader.readAsDataURL(file);
    }

    /**
     * Clear background media (image or video)
     */
    clearBackgroundMedia() {
        this.app.canvasManager.setBackgroundImage(null);
        this.app.canvasManager.setBackgroundVideo(null);
        this.elements.backgroundMedia.value = '';
        this.elements.clearBackgroundMedia.style.display = 'none';
        this.elements.backgroundVideoControls.style.display = 'none';
        this.app.render();
    }

    /**
     * Update background video settings
     */
    updateBackgroundVideoSettings() {
        if (this.app.canvasManager.backgroundVideo) {
            const video = this.app.canvasManager.backgroundVideo;
            video.autoplay = this.elements.backgroundVideoAutoplay.checked;
            video.loop = this.elements.backgroundVideoLoop.checked;
            
            // If autoplay is enabled and video is paused, play it
            if (video.autoplay && video.paused) {
                video.play().catch(error => {
                    console.warn('Background video autoplay failed:', error);
                });
            }
        }
    }

    /**
     * Update spots UI (updated for new Grid tab structure)
     */
    updateSpotsUI() {
        // Check if spots UI elements exist (they may not if spots tab was removed)
        if (!this.elements.spotCount && !this.elements.spotsList) {
            return; // Spots UI elements removed - functionality moved to Grid tab
        }

        // Update spot count with waiting spots indicator
        const waitingText = this.app.waitingSpots.length > 0 ? ` (+${this.app.waitingSpots.length} waiting)` : '';
        if (this.elements.spotCount) {
            this.elements.spotCount.textContent = `${this.app.spots.length}${waitingText}`;
        }

        // Clear existing spots list
        if (this.elements.spotsList) {
            this.elements.spotsList.innerHTML = '';

            // Add each spot to the UI
            this.app.spots.forEach(spot => {
                const spotItem = this.createSpotItemElement(spot);
                this.elements.spotsList.appendChild(spotItem);
            });

            // Add waiting spots section if any exist
            if (this.app.waitingSpots.length > 0) {
                this.addWaitingSpotsSection();
            }
        }
    }

    /**
     * Add waiting spots section to the UI
     */
    addWaitingSpotsSection() {
        const waitingSection = document.createElement('div');
        waitingSection.className = 'waiting-spots-section';
        waitingSection.innerHTML = `
            <div class="waiting-spots-header">
                <h4>⏳ Waiting for Space (${this.app.waitingSpots.length})</h4>
                <p>These spots will be restored when layout provides more room:</p>
            </div>
        `;

        // Add each waiting spot as a simple info item
        this.app.waitingSpots.forEach((spot, index) => {
            const waitingItem = document.createElement('div');
            waitingItem.className = 'waiting-spot-item';

            const contentPreview = this.getSpotContentPreview(spot);
            waitingItem.innerHTML = `
                <span class="waiting-spot-info">
                    <strong>Spot ${spot.originalId}</strong> (${spot.contentType})
                    ${contentPreview ? `: ${contentPreview}` : ''}
                </span>
            `;

            waitingSection.appendChild(waitingItem);
        });

        this.elements.spotsList.appendChild(waitingSection);
    }

    /**
     * Get a preview of spot content for display
     * @param {Object} spot - Spot data
     * @returns {string} Content preview
     */
    getSpotContentPreview(spot) {
        if (!spot.content) return '';

        switch (spot.contentType) {
            case 'text':
                return spot.content.text ? `"${spot.content.text.substring(0, 20)}${spot.content.text.length > 20 ? '...' : ''}"` : '';
            case 'image':
                return spot.content.imageDataURL ? 'Image' : '';
            case 'fill':
                return 'Fill';
            default:
                return '';
        }
    }

    /**
     * Create a spot item element for the UI
     * @param {Spot} spot - Spot object
     * @returns {HTMLElement} Spot item element
     */
    createSpotItemElement(spot) {
        const item = document.createElement('div');
        item.className = 'spot-item';
        item.dataset.spotId = spot.id;

        // Main spot header with improved readability
        const header = document.createElement('div');
        header.className = 'spot-header';

        // Left section: Spot info
        const infoSection = document.createElement('div');
        infoSection.className = 'spot-info';

        // Spot number with label
        const numberLabel = document.createElement('div');
        numberLabel.className = 'spot-number-label';
        numberLabel.innerHTML = `<strong>Spot ${spot.id}</strong>`;

        infoSection.appendChild(numberLabel);

        // Right section: Controls
        const controlsSection = document.createElement('div');
        controlsSection.className = 'spot-controls-section';

        // Type selector with label
        const typeLabel = document.createElement('label');
        typeLabel.className = 'spot-type-label';
        typeLabel.textContent = 'Type:';

        const typeSelect = document.createElement('select');
        typeSelect.className = 'spot-type-select';

        const types = [
            { value: 'empty', label: 'Empty' },
            { value: 'image', label: 'Image' },
            { value: 'text', label: 'Text' },
            { value: 'fill', label: 'Fill' }
        ];

        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type.value;
            option.textContent = type.label;
            option.selected = type.value === spot.contentType;
            typeSelect.appendChild(option);
        });

        // Expand/collapse button
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'spot-toggle';
        toggleBtn.textContent = '▼ Settings';

        controlsSection.appendChild(typeLabel);
        controlsSection.appendChild(typeSelect);
        controlsSection.appendChild(toggleBtn);

        // Prevent clicks on header from interfering with controls
        header.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Assemble header
        header.appendChild(infoSection);
        header.appendChild(controlsSection);

        // Expandable controls container
        const controls = document.createElement('div');
        controls.className = 'spot-controls';
        controls.style.display = 'none';

        // Create type-specific controls
        this.createSpotTypeControls(spot, controls);

        // Prevent clicks inside controls from closing the section
        controls.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Toggle functionality
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = controls.style.display !== 'none';
            controls.style.display = isOpen ? 'none' : 'block';
            toggleBtn.textContent = isOpen ? '▶ Settings' : '▼ Settings';
        });

        // Handle type changes
        typeSelect.addEventListener('change', (e) => {
            e.stopPropagation();
            spot.setContentType(typeSelect.value);
            this.createSpotTypeControls(spot, controls);
            this.app.render();

            // Update grid to reflect spot type change
            if (this.app.grid) {
                this.app.grid.updateSpotType(spot.id, typeSelect.value);
            }
        });

        // Assemble item
        item.appendChild(header);
        item.appendChild(controls);

        return item;
    }

    /**
     * Create type-specific controls for a spot
     * @param {Spot} spot - Spot object
     * @param {HTMLElement} container - Container for controls
     */
    createSpotTypeControls(spot, container) {
        // Clear existing controls
        container.innerHTML = '';

        // Use appropriate controller for the spot type
        const controller = this.app.contentControllers[spot.contentType];
        if (controller) {
            controller.createControls(spot, container, 'sidebar');

            // Add padding control for all non-empty spot types (after type-specific controls)
            if (spot.contentType !== 'empty' && controller.createPaddingControl) {
                controller.createPaddingControl(spot, container, 'sidebar');
            }
        }
    }

    /**
     * Handle spot type changes
     * @param {number} spotId - ID of the spot
     * @param {string} newType - New spot type
     */
    onSpotTypeChanged(spotId, newType) {
        const spot = this.app.spots.find(s => s.id === spotId);
        if (spot) {
            spot.setContentType(newType);
            this.app.render();

            // Update grid to reflect spot type change
            if (this.app.grid) {
                this.app.grid.updateSpotType(spot.id, newType);
            }
        }
    }

    /**
     * Update spot padding
     * @param {Spot} spot - Spot object
     * @param {number} padding - Padding value in pixels
     */
    updateSpotPadding(spot, padding) {
        if (!spot.content) spot.content = {};
        spot.content.padding = padding;
        this.app.render();
    }

    /**
     * Update spot text content
     * @param {Spot} spot - Spot object
     * @param {string} text - New text content
     */
    updateSpotText(spot, text) {
        if (!spot.content) spot.content = {};
        spot.content.text = text;
        this.app.render();
    }

    /**
     * Update spot text alignment
     * @param {Spot} spot - Spot object
     * @param {string} alignment - Text alignment (left, center, right)
     */
    updateSpotTextAlignment(spot, alignment) {
        if (!spot.content) spot.content = {};
        spot.content.textAlign = alignment;
        this.app.render();
    }

    /**
     * Toggle spot text style
     * @param {Spot} spot - Spot object
     * @param {string} style - Style to toggle (bold, italic, underline)
     */
    toggleSpotTextStyle(spot, style) {
        if (!spot.content) spot.content = {};
        if (!spot.content.styles) spot.content.styles = {};
        spot.content.styles[style] = !spot.content.styles[style];
        this.app.render();
    }

    /**
     * Update spot text color
     * @param {Spot} spot - Spot object
     * @param {string} color - New text color
     */
    updateSpotTextColor(spot, color) {
        if (!spot.content) spot.content = {};
        spot.content.color = color;
        this.app.render();
    }

    /**
     * Handle spot image upload
     * @param {Spot} spot - Spot object
     * @param {Event} event - File input event
     */
    handleSpotImageUpload(spot, event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                if (!spot.content) spot.content = {};
                spot.content.image = img;
                this.app.render();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    /**
     * Update spot image scale
     * @param {Spot} spot - Spot object
     * @param {number} scale - New scale value
     */
    updateSpotImageScale(spot, scale) {
        if (!spot.content) spot.content = {};
        spot.content.scale = scale;
        this.app.render();
    }

    /**
     * Update spot image rotation
     * @param {Spot} spot - Spot object
     * @param {number} rotation - New rotation value in degrees
     */
    updateSpotImageRotation(spot, rotation) {
        if (!spot.content) spot.content = {};
        spot.content.rotation = rotation;
        this.app.render();
    }

    /**
     * Spot popup methods removed - functionality moved to unified sidebar
     */

    /**
     * Initialize shuffler UI event listeners
     */
    initShufflerUI() {
        const shuffleAll = document.getElementById('shuffleAll');
        const shuffleLayout = document.getElementById('shuffleLayout');
        const shuffleColors = document.getElementById('shuffleColors');
        const shuffleSpots = document.getElementById('shuffleSpots');
        const useDefaultContent = document.getElementById('useDefaultContent');

        if (shuffleAll) {
            shuffleAll.addEventListener('click', async () => {
                const useDefaults = useDefaultContent ? useDefaultContent.checked : false;
                await this.app.shuffler.shuffleAll(useDefaults);
            });
        }

        if (shuffleLayout) {
            shuffleLayout.addEventListener('click', async () => {
                await this.app.shuffler.shuffleLayout();
            });
        }

        if (shuffleColors) {
            shuffleColors.addEventListener('click', async () => {
                await this.app.shuffler.shuffleColors();
            });
        }

        if (shuffleSpots) {
            shuffleSpots.addEventListener('click', async () => {
                const useDefaults = useDefaultContent ? useDefaultContent.checked : false;
                await this.app.shuffler.shuffleSpots(useDefaults);
            });
        }
    }

    /**
     * Show error message to user
     * @param {string} message - Error message
     */
    showError(message) {
        // Simple alert for now - could be improved with better UI
        alert('Error: ' + message);
    }

    /**
     * Get animation status text for a cell
     * @param {MainTextCell} cell - Text cell
     * @returns {string} Status text
     */
    getAnimationStatusText(cell) {
        if (!cell.animation) {
            return 'No Animation';
        }
        const status = cell.animation.getStatus();
        return `${status.type} (${status.intensity}px)`;
    }
}

