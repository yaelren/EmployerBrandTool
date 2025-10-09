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
        this.setupEventListeners();
    }

    /**
     * Cache references to UI elements
     */
    cacheUIElements() {
        const requiredElements = {
            mainText: 'mainText',
            textColor: 'textColor',
            backgroundColor: 'backgroundColor',
            backgroundOpacity: 'backgroundOpacity',
            backgroundOpacityValue: 'backgroundOpacityValue',
            transparentBackground: 'transparentBackground',
            backgroundImage: 'backgroundImage',
            clearBackgroundImage: 'clearBackgroundImage',
            fontFamily: 'fontFamily',
            fontSize: 'fontSize',
            fontSizeValue: 'fontSizeValue',
            lineSpacing: 'lineSpacing',
            lineSpacingValue: 'lineSpacingValue',
            enableWrap: 'enableWrap',
            fillCanvasMode: 'fillCanvasMode',
            manualMode: 'manualMode',
            manualControls: 'manualControls',
            paddingHorizontal: 'paddingHorizontal',
            paddingHorizontalValue: 'paddingHorizontalValue',
            paddingVertical: 'paddingVertical',
            paddingVerticalValue: 'paddingVerticalValue',
            lineAlignmentControls: 'lineAlignmentControls',
            minSpotSize: 'minSpotSize',
            findSpots: 'findSpots',
            autoDetectSpots: 'autoDetectSpots',
            spotCount: 'spotCount',
            spotsList: 'spotsList',
            // Main text styling buttons
            mainTextBold: 'mainTextBold',
            mainTextItalic: 'mainTextItalic',
            mainTextUnderline: 'mainTextUnderline',
            mainTextHighlight: 'mainTextHighlight',
            mainTextHighlightColor: 'mainTextHighlightColor'
        };

        // Cache all elements
        for (const [key, id] of Object.entries(requiredElements)) {
            const element = document.getElementById(id);
            if (!element) {
                throw new Error(`Required UI element not found: ${id}`);
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
            fontFamilySelect.appendChild(option);
        });

        // Set initial value to default
        fontFamilySelect.value = '"Wix Madefor Display", Arial, sans-serif';
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

        // Text color changes
        this.elements.textColor.addEventListener('input', () => {
            const color = this.elements.textColor.value;
            this.app.mainTextComponent.color = color;
            this.app.render();
        });

        // Font family changes
        this.elements.fontFamily.addEventListener('change', () => {
            const fontFamily = this.elements.fontFamily.value;
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
            const highlightColorGroup = this.elements.mainTextHighlightColor.parentElement;
            highlightColorGroup.style.display = this.app.mainTextComponent.highlight ? 'block' : 'none';

            this.app.onTextChanged(); // Trigger complete rebuild to apply highlight styling
        });

        // Highlight color changes
        this.elements.mainTextHighlightColor.addEventListener('input', () => {
            this.app.mainTextComponent.highlightColor = this.elements.mainTextHighlightColor.value;
            if (this.app.mainTextComponent.highlight) {
                this.app.render();
            }
        });

        // Background color changes
        this.elements.backgroundColor.addEventListener('input', () => {
            this.updateBackgroundColor();
        });

        // Background opacity changes
        this.elements.backgroundOpacity.addEventListener('input', () => {
            const opacity = parseInt(this.elements.backgroundOpacity.value);
            this.elements.backgroundOpacityValue.textContent = opacity + '%';
            this.updateBackgroundColor();
        });

        // Transparent background toggle
        this.elements.transparentBackground.addEventListener('change', () => {
            this.updateBackgroundColor();
        });

        // Background image upload
        this.elements.backgroundImage.addEventListener('change', (e) => {
            this.handleBackgroundImageUpload(e);
        });

        // Clear background image
        this.elements.clearBackgroundImage.addEventListener('click', () => {
            this.clearBackgroundImage();
        });

        // Font size changes
        this.elements.fontSize.addEventListener('input', () => {
            const fontSize = parseInt(this.elements.fontSize.value);
            this.elements.fontSizeValue.textContent = fontSize + 'px';
            this.app.textEngine.updateConfig({ fontSize });
            this.app.applySavedAlignments(); // Restore alignments after config change
            this.app.render(); // Update display immediately
        });

        // Font size auto-detection on release
        this.elements.fontSize.addEventListener('change', () => {
            this.app.onTextChanged(); // Trigger auto-detection when slider is released
        });

        // Line spacing changes
        this.elements.lineSpacing.addEventListener('input', () => {
            const lineSpacing = parseInt(this.elements.lineSpacing.value);
            this.elements.lineSpacingValue.textContent = lineSpacing + 'px';
            this.app.textEngine.updateConfig({ lineSpacing });
            this.app.applySavedAlignments(); // Restore alignments after config change
            this.app.render(); // Update display immediately
        });

        // Line spacing auto-detection on release
        this.elements.lineSpacing.addEventListener('change', () => {
            this.app.onTextChanged(); // Trigger auto-detection when slider is released
        });

        // Mode selection
        this.elements.fillCanvasMode.addEventListener('change', () => {
            if (this.elements.fillCanvasMode.checked) {
                this.setTextMode('fillCanvas');
            }
        });

        this.elements.manualMode.addEventListener('change', () => {
            if (this.elements.manualMode.checked) {
                this.setTextMode('manual');
            }
        });

        // Text wrapping toggle (only in manual mode)
        this.elements.enableWrap.addEventListener('change', () => {
            const enableWrap = this.elements.enableWrap.checked;
            this.app.textEngine.updateConfig({ enableWrap });
            this.app.onTextChanged();
        });

        // Symmetrical padding controls
        this.elements.paddingHorizontal.addEventListener('input', () => {
            const padding = parseInt(this.elements.paddingHorizontal.value);
            this.elements.paddingHorizontalValue.textContent = padding + 'px';
            this.updateSymmetricalPaddingDisplay('horizontal', padding); // Update display only
        });

        // Padding auto-detection on release
        this.elements.paddingHorizontal.addEventListener('change', () => {
            const padding = parseInt(this.elements.paddingHorizontal.value);
            this.updateSymmetricalPadding('horizontal', padding); // Trigger auto-detection
        });

        this.elements.paddingVertical.addEventListener('input', () => {
            const padding = parseInt(this.elements.paddingVertical.value);
            this.elements.paddingVerticalValue.textContent = padding + 'px';
            this.updateSymmetricalPaddingDisplay('vertical', padding); // Update display only
        });

        // Padding auto-detection on release
        this.elements.paddingVertical.addEventListener('change', () => {
            const padding = parseInt(this.elements.paddingVertical.value);
            this.updateSymmetricalPadding('vertical', padding); // Trigger auto-detection
        });

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

        // Canvas click detection for spots
        this.app.canvasManager.canvas.addEventListener('click', (e) => {
            this.app.handleCanvasClick(e);
        });

        // Minimum spot size changes
        this.elements.minSpotSize.addEventListener('input', () => {
            const minSize = parseInt(this.elements.minSpotSize.value);
            this.app.gridDetector.setMinCellSize(minSize);
            this.app.minSpotSize = minSize; // Store for Grid.buildFromExisting()
        });

        // Find spots button
        this.elements.findSpots.addEventListener('click', () => {
            this.app.detectSpots();
        });

        // Auto-detect toggle
        this.elements.autoDetectSpots.addEventListener('change', () => {
            this.app.autoDetectSpots = this.elements.autoDetectSpots.checked;

            // If enabled and we have text but no spots, trigger detection
            if (this.app.autoDetectSpots && this.elements.mainText.value.trim() && this.app.spots.length === 0) {
                this.app.autoDetectSpotsDebounced(100); // Quick detection when enabling
            }
        });

        // Animation Controls Event Handlers
        this.setupAnimationEventListeners();

        // Visual Grid Animation Editor
        this.setupVisualGridListeners();
    }

    /**
     * Set up animation control event listeners
     */
    setupAnimationEventListeners() {
        // Animation playback controls
        const playBtn = document.getElementById('playAnimation');
        const pauseBtn = document.getElementById('pauseAnimation');
        const resetBtn = document.getElementById('resetAnimation');
        const clearBtn = document.getElementById('clearAnimations');

        if (playBtn) {
            playBtn.addEventListener('click', () => {
                if (this.app.grid) {
                    this.app.grid.playAllAnimations();
                    this.app._startAnimationLoop();  // Start render loop
                    this.updateAnimationStatus();
                }
            });
        }

        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                if (this.app.grid) {
                    this.app.grid.pauseAllAnimations();
                    this.app._stopAnimationLoop();  // Stop render loop
                    this.updateAnimationStatus();
                }
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (this.app.grid) {
                    this.app.grid.resetAllAnimations();
                    this.app._stopAnimationLoop();  // Stop render loop
                    this.updateAnimationStatus();
                    this.app.render(); // Re-render to show reset
                }
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                // Clear all animations from all cells
                if (this.app.grid) {
                    this.app.grid.getAllCells().forEach(cell => {
                        if (cell && cell.animation) {
                            cell.removeAnimation();
                        }
                    });
                    this.app._stopAnimationLoop();  // Stop render loop
                    this.updateAnimationStatus();
                    this.updateTextLineAnimations(); // Refresh sidebar controls
                    this.updateVisualGrid();  // Refresh visual grid
                    this.app.render();  // Re-render canvas
                }
            });
        }

        // Initialize text line animation controls on first setup
        this.updateTextLineAnimations();
    }

    /**
     * Update animation status display
     */
    updateAnimationStatus() {
        const animationCount = document.getElementById('animationCount');
        const playbackStatus = document.getElementById('playbackStatus');

        if (this.app.grid) {
            const animatedCells = this.app.grid.getAnimatedCells();
            const playingCount = animatedCells.filter(cell => cell.animation && cell.animation.isPlaying).length;

            if (animationCount) {
                animationCount.textContent = `${animatedCells.length} animations set`;
            }

            if (playbackStatus) {
                const statusText = playingCount > 0 ? 'Playing' : 'Stopped';
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

        // Show selected cell info panel
        const infoPanel = document.getElementById('selectedCellInfo');
        const cellLabel = document.getElementById('selectedCellLabel');
        const typeSelect = document.getElementById('cellAnimationType');
        const intensityInput = document.getElementById('cellAnimationIntensity');
        const speedInput = document.getElementById('cellAnimationSpeed');
        const intensityValue = document.getElementById('intensityValue');
        const speedValue = document.getElementById('speedValue');

        if (infoPanel) {
            infoPanel.style.display = 'block';
        }

        if (cellLabel) {
            const content = cell.type === 'main-text' ? `"${cell.text}"` :
                           cell.type === 'content' ? `Content (${cell.contentType})` :
                           cell.type === 'spot' ? `Spot (${cell.spotType})` :
                           'Unknown';
            cellLabel.textContent = `${content} [${row},${col}]`;
        }

        // Set current animation values
        if (cell.animation) {
            const status = cell.animation.getStatus();
            if (typeSelect) typeSelect.value = status.type;
            if (intensityInput) intensityInput.value = status.intensity;
            if (speedInput) speedInput.value = status.speed;
            if (intensityValue) intensityValue.textContent = status.intensity;
            if (speedValue) speedValue.textContent = status.speed.toFixed(1);
        } else {
            if (typeSelect) typeSelect.value = 'none';
            if (intensityInput) intensityInput.value = 20;
            if (speedInput) speedInput.value = 1.0;
            if (intensityValue) intensityValue.textContent = '20';
            if (speedValue) speedValue.textContent = '1.0';
        }
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
     * Set text mode and update UI accordingly
     * @param {string} mode - 'fillCanvas' or 'manual'
     */
    setTextMode(mode) {
        // When switching to manual mode, preserve current font size and line height
        if (mode === 'manual') {
            const currentConfig = this.app.textEngine.getConfig();

            // Update UI controls to reflect current state
            this.elements.fontSize.value = currentConfig.fontSize;
            this.elements.fontSizeValue.textContent = currentConfig.fontSize + 'px';
            this.elements.lineSpacing.value = currentConfig.lineSpacing;
            this.elements.lineSpacingValue.textContent = currentConfig.lineSpacing + 'px';
        }

        this.app.textEngine.updateConfig({ mode });

        // Update canvas dimensions in textEngine
        this.app.textEngine.updateConfig({
            canvasWidth: this.app.canvasManager.canvas.width,
            canvasHeight: this.app.canvasManager.canvas.height
        });

        // Show/hide manual controls
        if (mode === 'manual') {
            this.elements.manualControls.style.display = 'block';
        } else {
            this.elements.manualControls.style.display = 'none';
        }

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
            case 'canvas':
                contentId = 'canvasTab';
                break;
            case 'spots':
                contentId = 'spotsTab';
                break;
            case 'animation':
                contentId = 'animationTab';
                break;
            case 'parameters':
                contentId = 'parametersTab';
                break;
        }

        const activeContent = document.getElementById(contentId);
        if (activeContent) {
            activeContent.classList.add('active');
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
        const paddingH = parseInt(this.elements.paddingHorizontal.value);
        const paddingV = parseInt(this.elements.paddingVertical.value);
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
     * Update background color with opacity
     */
    updateBackgroundColor() {
        const isTransparent = this.elements.transparentBackground.checked;

        if (isTransparent) {
            this.app.canvasManager.setBackgroundColor('transparent');
        } else {
            const hexColor = this.elements.backgroundColor.value;
            const opacity = parseInt(this.elements.backgroundOpacity.value);

            if (opacity === 100) {
                // Fully opaque, use hex color
                this.app.canvasManager.setBackgroundColor(hexColor);
            } else {
                // Convert hex to RGBA with opacity
                const rgbaColor = this.hexToRgba(hexColor, opacity / 100);
                this.app.canvasManager.setBackgroundColor(rgbaColor);
            }
        }

        this.app.render();
    }

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
     * Handle background image upload
     * @param {Event} event - File input change event
     */
    handleBackgroundImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.app.canvasManager.setBackgroundImage(img);
                this.elements.clearBackgroundImage.style.display = 'inline-block';
                this.app.render();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    /**
     * Clear background image
     */
    clearBackgroundImage() {
        this.app.canvasManager.setBackgroundImage(null);
        this.elements.backgroundImage.value = '';
        this.elements.clearBackgroundImage.style.display = 'none';
        this.app.render();
    }

    /**
     * Update the spots list in the UI
     */
    updateSpotsUI() {
        // Update spot count with waiting spots indicator
        const waitingText = this.app.waitingSpots.length > 0 ? ` (+${this.app.waitingSpots.length} waiting)` : '';
        this.elements.spotCount.textContent = `${this.app.spots.length}${waitingText}`;

        // Clear existing spots list
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
            case 'mask':
                return 'Background reveal';
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
            { value: 'mask', label: 'Mask' }
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
     * Show spot edit popup
     * @param {Spot} spot - Spot to edit
     * @param {number} clickX - Click X position (screen coordinates)
     * @param {number} clickY - Click Y position (screen coordinates)
     */
    showSpotEditPopup(spot, clickX, clickY) {
        const popup = document.getElementById('spotEditPopup');
        const title = document.getElementById('spotPopupTitle');
        const body = document.getElementById('spotPopupBody');
        const closeBtn = document.getElementById('closeSpotPopup');

        // Set title
        title.textContent = `Edit Spot ${spot.id}`;

        // Create popup content
        this.createPopupSpotControls(spot, body);

        // Show popup
        popup.classList.add('show');

        // Close button handler
        const closePopup = () => {
            popup.classList.remove('show');
            closeBtn.removeEventListener('click', closePopup);
            popup.removeEventListener('click', outsideClick);
        };

        // Outside click handler
        const outsideClick = (e) => {
            if (e.target === popup) {
                closePopup();
            }
        };

        closeBtn.addEventListener('click', closePopup);
        popup.addEventListener('click', outsideClick);
    }

    /**
     * Create spot controls for popup
     * @param {Spot} spot - Spot object
     * @param {HTMLElement} container - Container for controls
     */
    createPopupSpotControls(spot, container) {
        container.innerHTML = '';

        // Spot type selector
        const typeGroup = document.createElement('div');
        typeGroup.className = 'chatooly-control-group';
        typeGroup.innerHTML = `
            <label>Spot Type</label>
            <select class="popup-spot-type-select">
                <option value="empty">Empty</option>
                <option value="text">Text</option>
                <option value="image">Media (Image, Video, GIF)</option>
                <option value="mask">Mask (Background Reveal)</option>
            </select>
        `;

        const typeSelect = typeGroup.querySelector('.popup-spot-type-select');
        typeSelect.value = spot.contentType;

        typeSelect.addEventListener('change', (e) => {
            e.stopPropagation();
            spot.setContentType(typeSelect.value);
            this.createPopupSpotControls(spot, container);
            this.app.render();
            this.updateSpotsUI();

            // Update grid to reflect spot type change
            if (this.app.grid) {
                this.app.grid.updateSpotType(spot.id, typeSelect.value);
                this.updateVisualGrid();
            }
        });

        container.appendChild(typeGroup);

        // Add padding control for non-empty types
        if (spot.contentType !== 'empty') {
            this.app.contentControllers.text.createPaddingControl(spot, container, 'popup');
        }

        // Use appropriate controller for the spot type
        const controller = this.app.contentControllers[spot.contentType];
        if (controller) {
            controller.createControls(spot, container, 'popup');
        }
    }

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
