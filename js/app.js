/**
 * app.js - Main application controller
 * Ties together all components and handles UI interactions
 */

class EmployerBrandToolPOC {
    constructor() {
        // Core components
        this.canvasManager = new CanvasManager();
        this.textEngine = new MainTextController();
        this.spotDetector = new SpotDetector();
        this.debugController = null; // Will be initialized after DOM is ready

        // State
        this.spots = [];
        this.isInitialized = false;
        this.savedLineAlignments = {}; // Store user's line alignment preferences
        this.savedSpotData = []; // Store spot content data for persistence

        // Auto-detection settings
        this.autoDetectSpots = true; // Enable automatic spot detection
        this.spotDetectionTimeout = null; // Debounce timeout for spot detection
        this.waitingSpots = []; // Spots that couldn't fit in current layout but are preserved

        // Canvas resize tracking
        this.previousCanvasSize = { width: 0, height: 0 };

        // Main text component
        this.mainTextComponent = new MainTextComponent();

        // UI elements
        this.elements = {};

        // Spot Controllers - Object-oriented spot management
        this.spotControllers = {
            'empty': new EmptySpotController(this),
            'text': new TextSpotController(this),
            'image': new ImageSpotController(this),
            'mask': new MaskSpotController(this)
        };

        // Shuffler System
        this.shuffler = null; // Will be initialized after DOM is ready

        // Asset Management System
        this.backgroundImage = null; // Currently loaded background image

        // Grid Animation System (NEW - simple per-cell animations)
        this.grid = null; // Will be initialized after DOM is ready

        // Initialize the application
        this.initialize();
    }
    
    /**
     * Initialize the application
     */
    async initialize() {
        try {
            // Cache UI elements
            this.cacheUIElements();

            // Initialize debug controller
            this.debugController = new DebugController(this);

            // Initialize shuffler system
            this.shuffler = new Shuffler(this);
            console.log('🎲 Shuffler system initialized');

            // Initialize Grid system (NEW - simple per-cell animations)
            this.grid = new Grid(this);
            console.log('🔧 Grid system initialized');

            // Set initial canvas size via Chatooly CDN
            this.initializeChatoolyCanvas();

            // Set up event listeners (including resize)
            this.setupEventListeners();

            // Initialize MainTextController with canvas dimensions and default mode
            this.textEngine.updateConfig({
                canvasWidth: this.canvasManager.canvas.width,
                canvasHeight: this.canvasManager.canvas.height,
                mode: 'fillCanvas' // Set default mode
            });

            // Initialize font family dropdown
            this.initializeFontFamilyDropdown();

            // Initialize main text component
            this.mainTextComponent.setContainer(
                0, 0,
                this.canvasManager.canvas.width,
                this.canvasManager.canvas.height
            );
            this.mainTextComponent.text = this.elements.mainText.value;
            this.mainTextComponent.color = this.elements.textColor.value;

            // Set initial text
            this.textEngine.setText(this.elements.mainText.value);

            // Update line alignment controls for initial text
            this.updateLineAlignmentControls();

            // Sync auto-detect setting with UI
            this.autoDetectSpots = this.elements.autoDetectSpots.checked;

            // Initial render
            this.render();

            // Test Grid system (NEW - build from existing data)
            if (this.grid) {
                this.grid.buildFromExisting();
                console.log('🧪 Grid system test:', this.grid.getStatus());

                // Update visual grid display
                this.updateVisualGrid();
            }

            this.isInitialized = true;

            console.log('✅ Employer Brand Tool POC initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize POC:', error);
            this.showError('Failed to initialize application. Please refresh and try again.');
        }
    }

    /**
     * Initialize Chatooly canvas dimensions
     * @private
     */
    initializeChatoolyCanvas() {
        const setCanvasSize = () => {
            if (window.Chatooly && window.Chatooly.canvasResizer) {
                console.log('📐 Setting initial canvas size to 1080x1350');
                window.Chatooly.canvasResizer.setExportSize(1080, 1350);
                window.Chatooly.canvasResizer.applyExportSize();

                // Update our tracking
                this.previousCanvasSize = {
                    width: this.canvasManager.canvas.width,
                    height: this.canvasManager.canvas.height
                };
            }
        };

        // Try to set size immediately if CDN is ready
        if (window.Chatooly && window.Chatooly.canvasResizer) {
            setCanvasSize();
        } else {
            // Wait for Chatooly to be ready
            window.addEventListener('chatooly:ready', setCanvasSize);
        }
    }
    
    
    /**
     * Cache references to UI elements
     * @private
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
     * @private
     */
    initializeFontFamilyDropdown() {
        const fontFamilySelect = this.elements.fontFamily;
        
        // Get available fonts from TextComponent (single source of truth)
        const fonts = this.textEngine.getAvailableFonts();
        
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
     * @private
     */
    setupEventListeners() {
        // Canvas resize event from Chatooly CDN
        document.addEventListener('chatooly:canvas-resized', (e) => this.onCanvasResized(e));

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
            this.mainTextComponent.text = this.elements.mainText.value;
            this.onTextChanged();
        });
        
        // Text color changes
        this.elements.textColor.addEventListener('input', () => {
            const color = this.elements.textColor.value;
            this.mainTextComponent.color = color;
            this.render();
        });

        // Font family changes
        this.elements.fontFamily.addEventListener('change', () => {
            const fontFamily = this.elements.fontFamily.value;
            this.mainTextComponent.fontFamily = fontFamily;
            this.textEngine.updateConfig({ fontFamily: fontFamily });
            this.onTextChanged(); // Font family affects text width - trigger auto-detection
        });
        
        // Main text styling buttons
        this.elements.mainTextBold.addEventListener('click', () => {
            this.mainTextComponent.fontWeight = this.mainTextComponent.fontWeight === 'bold' ? 'normal' : 'bold';
            const isActive = this.mainTextComponent.fontWeight === 'bold';
            this.elements.mainTextBold.classList.toggle('active', isActive);
            this.onTextChanged(); // Bold affects text width - trigger auto-detection
        });
        
        this.elements.mainTextItalic.addEventListener('click', () => {
            this.mainTextComponent.fontStyle = this.mainTextComponent.fontStyle === 'italic' ? 'normal' : 'italic';
            const isActive = this.mainTextComponent.fontStyle === 'italic';
            this.elements.mainTextItalic.classList.toggle('active', isActive);
            this.onTextChanged(); // Italic affects text width - trigger auto-detection
        });
        
        this.elements.mainTextUnderline.addEventListener('click', () => {
            this.mainTextComponent.underline = !this.mainTextComponent.underline;
            this.elements.mainTextUnderline.classList.toggle('active', this.mainTextComponent.underline);
            this.render(); // Underline doesn't affect layout - just visual
        });
        
        this.elements.mainTextHighlight.addEventListener('click', () => {
            this.mainTextComponent.highlight = !this.mainTextComponent.highlight;
            this.elements.mainTextHighlight.classList.toggle('active', this.mainTextComponent.highlight);
            
            // Show/hide highlight color picker based on highlight state
            const highlightColorGroup = this.elements.mainTextHighlightColor.parentElement;
            highlightColorGroup.style.display = this.mainTextComponent.highlight ? 'block' : 'none';
            
            this.render(); // Highlight doesn't affect layout - just visual
        });
        
        // Highlight color changes
        this.elements.mainTextHighlightColor.addEventListener('input', () => {
            this.mainTextComponent.highlightColor = this.elements.mainTextHighlightColor.value;
            if (this.mainTextComponent.highlight) {
                this.render();
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
            this.textEngine.updateConfig({ fontSize });
            this.applySavedAlignments(); // Restore alignments after config change
            this.render(); // Update display immediately
        });
        
        // Font size auto-detection on release
        this.elements.fontSize.addEventListener('change', () => {
            this.onTextChanged(); // Trigger auto-detection when slider is released
        });
        
        // Line spacing changes
        this.elements.lineSpacing.addEventListener('input', () => {
            const lineSpacing = parseInt(this.elements.lineSpacing.value);
            this.elements.lineSpacingValue.textContent = lineSpacing + 'px';
            this.textEngine.updateConfig({ lineSpacing });
            this.applySavedAlignments(); // Restore alignments after config change
            this.render(); // Update display immediately
        });
        
        // Line spacing auto-detection on release
        this.elements.lineSpacing.addEventListener('change', () => {
            this.onTextChanged(); // Trigger auto-detection when slider is released
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
            this.textEngine.updateConfig({ enableWrap });
            this.onTextChanged();
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
        
        
        // Debug panel is now handled by DebugController
        
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
                this.textEngine.updateConfig({
                    textPositionVertical: vertical,
                    textPositionHorizontal: horizontal
                });

                // Also update MainTextComponent to keep them in sync
                this.mainTextComponent.positionH = horizontal;
                this.mainTextComponent.positionV = vertical;

                this.onTextChanged();
            });
        });
        
        // Canvas click detection for spots
        this.canvasManager.canvas.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });
        
        
        // Minimum spot size changes
        this.elements.minSpotSize.addEventListener('input', () => {
            const minSize = parseInt(this.elements.minSpotSize.value);
            this.spotDetector.setMinSpotSize(minSize);
        });
        
        // Find spots button
        this.elements.findSpots.addEventListener('click', () => {
            this.detectSpots();
        });
        
        // Auto-detect toggle
        this.elements.autoDetectSpots.addEventListener('change', () => {
            this.autoDetectSpots = this.elements.autoDetectSpots.checked;
            console.log(`🤖 Auto-detect spots: ${this.autoDetectSpots ? 'enabled' : 'disabled'}`);
            
            // If enabled and we have text but no spots, trigger detection
            if (this.autoDetectSpots && this.elements.mainText.value.trim() && this.spots.length === 0) {
                this.autoDetectSpotsDebounced(100); // Quick detection when enabling
            }
        });
        
        // Debug visualization is now handled by DebugController

        // Animation Controls Event Handlers
        this.setupAnimationEventListeners();

        // Visual Grid Animation Editor
        this.setupVisualGridListeners();

    }

    /**
     * Set up animation control event listeners (NEW - Simple per-cell animations)
     * @private
     */
    setupAnimationEventListeners() {
        // Animation playback controls
        const playBtn = document.getElementById('playAnimation');
        const pauseBtn = document.getElementById('pauseAnimation');
        const resetBtn = document.getElementById('resetAnimation');
        const clearBtn = document.getElementById('clearAnimations');

        if (playBtn) {
            playBtn.addEventListener('click', () => {
                if (this.grid) {
                    this.grid.playAllAnimations();
                    this._startAnimationLoop();  // Start render loop
                    this.updateAnimationStatus();
                }
            });
        }

        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                if (this.grid) {
                    this.grid.pauseAllAnimations();
                    this._stopAnimationLoop();  // Stop render loop
                    this.updateAnimationStatus();
                }
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (this.grid) {
                    this.grid.resetAllAnimations();
                    this._stopAnimationLoop();  // Stop render loop
                    this.updateAnimationStatus();
                    this.render(); // Re-render to show reset
                }
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                // Clear all animations from all cells
                if (this.grid) {
                    this.grid.getAllCells().forEach(cell => {
                        if (cell && cell.animation) {
                            cell.removeAnimation();
                        }
                    });
                    this._stopAnimationLoop();  // Stop render loop
                    this.updateAnimationStatus();
                    this.updateTextLineAnimations(); // Refresh sidebar controls
                    this.updateVisualGrid();  // Refresh visual grid
                    this.render();  // Re-render canvas
                }
            });
        }

        // Initialize text line animation controls on first setup
        this.updateTextLineAnimations();
    }

    /**
     * Set up animation popup event listeners (DEPRECATED - using sidebar controls)
     * @private
     */
    setupAnimationPopupListeners() {
        // Animation popup functionality has been replaced with sidebar controls
        // This method is kept for compatibility but no longer used
        console.log('🔄 Animation popup listeners deprecated - using sidebar controls');
    }

    /**
     * Update animation status display (NEW - Simple per-cell animations)
     * @private
     */
    updateAnimationStatus() {
        const animationCount = document.getElementById('animationCount');
        const playbackStatus = document.getElementById('playbackStatus');

        if (this.grid) {
            const animatedCells = this.grid.getAnimatedCells();
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
     * Handle canvas clicks in animation mode (DEPRECATED - using sidebar controls)
     * @param {MouseEvent} e - Click event
     * @private
     */
    handleAnimationCanvasClick(e) {
        // Canvas clicking for animations has been replaced with sidebar controls
        console.log('🔄 Canvas click for animations deprecated - use sidebar controls');
    }

    /**
     * Show animation configuration popup
     * @param {MainTextCell} cell - Text cell to animate
     * @private
     */
    showAnimationPopup(cell) {
        const popup = document.getElementById('animationPopup');
        const title = document.getElementById('popupTitle');
        const previewText = document.getElementById('previewText');
        const intensitySlider = document.getElementById('animationIntensity');

        if (!popup) return;

        // Store reference to cell being configured
        this.currentAnimationCell = cell;

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
     * @private
     */
    hideAnimationPopup() {
        const popup = document.getElementById('animationPopup');
        if (popup) {
            popup.style.display = 'none';
        }
        this.currentAnimationCell = null;
    }

    /**
     * Apply selected animation configuration
     * @private
     */
    applySelectedAnimation() {
        if (!this.currentAnimationCell || !this.animationEngine) return;

        const popup = document.getElementById('animationPopup');
        const selectedOption = popup ? popup.querySelector('.anim-option.selected') : null;
        const intensitySlider = document.getElementById('animationIntensity');

        if (!selectedOption) return;

        const animationType = selectedOption.dataset.type;
        const intensity = intensitySlider ? parseInt(intensitySlider.value) : 20;

        // Apply animation to the cell
        this.animationEngine.setAnimation(
            this.currentAnimationCell.row,
            this.currentAnimationCell.col,
            animationType,
            intensity
        );

        // Update status display
        this.updateAnimationStatus();

        // Hide popup
        this.hideAnimationPopup();

        console.log(`✨ Applied ${animationType} animation (${intensity}px) to "${this.currentAnimationCell.text}"`);
    }

    /**
     * Update visual grid display showing all cells
     * @private
     */
    updateVisualGrid() {
        const container = document.getElementById('visualGrid');
        if (!container) {
            console.warn('⚠️ visualGrid element not found in DOM');
            return;
        }

        // Clear existing grid
        container.innerHTML = '';

        // Check if grid is ready
        if (!this.grid || !this.grid.isReady) {
            container.innerHTML = '<p class="no-text-message">Grid not ready. Add text to see grid...</p>';
            console.log('⚠️ Grid not ready yet');
            return;
        }

        // Set grid columns based on actual grid dimensions
        const cols = this.grid.cols || 3;
        container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

        // Create grid cells
        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                const cell = this.grid.getCell(row, col);

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

        console.log(`🎯 Updated visual grid: ${this.grid.rows}x${this.grid.cols}`);
    }

    /**
     * Select a grid cell for animation editing
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @private
     */
    selectGridCell(row, col) {
        const cell = this.grid.getCell(row, col);
        if (!cell) return;

        // Update selected cell
        this.selectedCell = { row, col, cell };

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

        console.log(`✓ Selected cell [${row},${col}]:`, cell.type);
    }

    /**
     * Setup event listeners for visual grid animation controls
     * @private
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
     * @private
     */
    applyCellAnimation() {
        if (!this.selectedCell) return;

        const { row, col, cell } = this.selectedCell;
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

        console.log(`✨ Applied ${type} animation to cell [${row},${col}]`);
    }

    /**
     * Remove animation from selected cell
     * @private
     */
    removeCellAnimation() {
        if (!this.selectedCell) return;

        const { row, col, cell } = this.selectedCell;
        cell.removeAnimation();

        // Update UI
        document.getElementById('cellAnimationType').value = 'none';
        this.updateVisualGrid();
        this.updateAnimationStatus();

        console.log(`🚫 Removed animation from cell [${row},${col}]`);
    }

    /**
     * Update text line animation controls in the sidebar
     * @private
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
        if (!this.grid || !this.grid.isReady) {
            container.innerHTML = '<p class="no-text-message">Loading text lines...</p>';
            return;
        }

        // Get text cells from grid
        const textCells = this.grid.getAllCells().filter(cell => cell && cell.type === 'main-text');

        if (textCells.length === 0) {
            container.innerHTML = '<p class="no-text-message">No text lines found</p>';
            return;
        }

        // Create controls for each text line
        textCells.forEach((cell, index) => {
            if (!cell.text || cell.isEmpty()) return;

            // Get animation status (NEW - check if animation instance exists)
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

        console.log(`🎛️ Updated sidebar animation controls for ${textCells.length} text lines`);
    }

    /**
     * Get animation status text for a cell
     * @param {MainTextCell} cell - Text cell
     * @returns {string} Status text
     * @private
     */
    getAnimationStatusText(cell) {
        if (!cell.animation) {
            return 'No Animation';
        }
        const status = cell.animation.getStatus();
        return `${status.type} (${status.intensity}px)`;
    }

    /**
     * Set up event listeners for text line animation controls
     * @param {HTMLElement} container - Container with controls
     * @private
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
     * @private
     */
    setTextLineAnimation(row, col, type) {
        if (!this.grid) return;

        const cell = this.grid.getCell(row, col);
        if (!cell) return;

        if (type === 'none') {
            // Remove animation
            cell.removeAnimation();
            console.log(`🚫 Removed animation from text line at (${row}, ${col})`);
        } else {
            // Set animation with default intensity
            const intensity = 20;
            const speed = 1.0;
            cell.setAnimation(type, intensity, speed);
            console.log(`✨ Set ${type} animation (${intensity}px) for text line at (${row}, ${col})`);
        }
    }

    /**
     * Update animation intensity for a text line
     * @param {number} row - Grid row
     * @param {number} col - Grid column
     * @param {number} intensity - Animation intensity
     * @private
     */
    updateTextLineAnimationIntensity(row, col, intensity) {
        if (!this.grid) return;

        const cell = this.grid.getCell(row, col);
        if (cell && cell.animation) {
            // Update the animation configuration
            cell.animation.updateConfig({ intensity });
            console.log(`🎚️ Updated animation intensity to ${intensity}px for text line at (${row}, ${col})`);
        }
    }

    /**
     * Handle text input changes
     * @private
     */
    onTextChanged() {
        const text = this.elements.mainText.value;
        this.mainTextComponent.text = text;

        // Update text engine with new text
        if (this.textEngine) {
            this.textEngine.setText(text);
        }

        // IMPORTANT: Apply saved alignments immediately after text change but before updateLineAlignmentControls
        this.applySavedAlignments();

        // Update line alignment controls
        this.updateLineAlignmentControls();

        // Save spots before clearing when text changes
        if (this.spots.length > 0) {
            this.saveSpotData();
        }

        // Clear spots when text changes
        this.spots = [];
        this.updateSpotsUI();

        this.render();

        // Rebuild grid after text changes (NEW - keep grid synchronized)
        if (this.grid) {
            this.grid.buildFromExisting();
            console.log('🔄 Grid rebuilt after text change');

            // Update visual grid and animation controls after grid rebuild
            setTimeout(() => {
                this.updateVisualGrid();
                this.updateTextLineAnimations();
            }, 100); // Small delay to ensure grid is fully rebuilt
        }

        // Auto-detect spots after text changes (only if there's text content)
        if (this.elements.mainText.value.trim()) {
            this.autoDetectSpotsDebounced();
        }
    }
    

    /**
     * Apply saved alignments to current text lines
     * @private
     */
    applySavedAlignments() {
        // Get lines from main text component (assumes already synced)
        const ctx = this.canvasManager.ctx;
        ctx.save();
        
        let fontSize = this.mainTextComponent.fontSize;
        if (fontSize === 'auto') {
            fontSize = this.mainTextComponent.calculateAutoFontSize(ctx);
        }
        
        ctx.font = this.mainTextComponent.getFontString(fontSize);
        const availableWidth = this.mainTextComponent.getAvailableWidth();
        const lines = this.mainTextComponent.wrapTextToLines(ctx, this.mainTextComponent.text, availableWidth, fontSize);
        
        ctx.restore();
        
        lines.forEach((line, index) => {
            if (line.trim()) {
                const lineKey = line.trim();
                const savedAlignment = this.savedLineAlignments[lineKey];
                
                if (savedAlignment) {
                    this.mainTextComponent.setLineAlignment(index, savedAlignment);
                }
            }
        });
    }
    
    /**
     * Update line alignment controls based on current text
     * @private
     */
    updateLineAlignmentControls() {
        const container = this.elements.lineAlignmentControls;
        
        // Sync main text component first
        this.syncMainTextComponent();
        
        // Get lines from main text component
        const ctx = this.canvasManager.ctx;
        ctx.save();
        
        let fontSize = this.mainTextComponent.fontSize;
        if (fontSize === 'auto') {
            fontSize = this.mainTextComponent.calculateAutoFontSize(ctx);
        }
        
        ctx.font = this.mainTextComponent.getFontString(fontSize);
        const availableWidth = this.mainTextComponent.getAvailableWidth();
        const lines = this.mainTextComponent.wrapTextToLines(ctx, this.mainTextComponent.text, availableWidth, fontSize);
        
        ctx.restore();
        
        // Clear existing controls
        container.innerHTML = '';
        
        // Create alignment control for each line
        lines.forEach((line, index) => {
            if (!line.trim()) return; // Skip empty lines
            
            // Get the current alignment from MainTextComponent
            const currentAlignment = this.mainTextComponent.getLineAlignment(index);
            
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
     * @private
     */
    setLineAlignment(lineIndex, alignment) {
        // Sync main text component first
        this.syncMainTextComponent();
        
        // Get lines from main text component
        const ctx = this.canvasManager.ctx;
        ctx.save();
        
        let fontSize = this.mainTextComponent.fontSize;
        if (fontSize === 'auto') {
            fontSize = this.mainTextComponent.calculateAutoFontSize(ctx);
        }
        
        ctx.font = this.mainTextComponent.getFontString(fontSize);
        const availableWidth = this.mainTextComponent.getAvailableWidth();
        const lines = this.mainTextComponent.wrapTextToLines(ctx, this.mainTextComponent.text, availableWidth, fontSize);
        
        ctx.restore();
        
        const line = lines[lineIndex];
        
        if (line && line.trim()) {
            // Save the alignment preference for this line content
            const lineKey = line.trim();
            this.savedLineAlignments[lineKey] = alignment;
            
            console.log(`💾 Saved alignment for "${lineKey}": ${alignment}`);
        }
        
        this.mainTextComponent.setLineAlignment(lineIndex, alignment);
        this.updateLineAlignmentControls(); // Refresh controls to show active state
        this.onTextChanged(); // Trigger auto-detection for layout change
    }
    
    /**
     * Set text mode and update UI accordingly
     * @param {string} mode - 'fillCanvas' or 'manual'
     * @private
     */
    setTextMode(mode) {
        console.log(`🎛️ Switching to ${mode} mode`);
        
        // When switching to manual mode, preserve current font size and line height
        if (mode === 'manual') {
            const currentConfig = this.textEngine.getConfig();
            
            // Update UI controls to reflect current state
            this.elements.fontSize.value = currentConfig.fontSize;
            this.elements.fontSizeValue.textContent = currentConfig.fontSize + 'px';
            this.elements.lineSpacing.value = currentConfig.lineSpacing;
            this.elements.lineSpacingValue.textContent = currentConfig.lineSpacing + 'px';
            
            console.log(`📋 Preserving font size: ${currentConfig.fontSize}px, line spacing: ${currentConfig.lineSpacing}px`);
        }
        
        this.textEngine.updateConfig({ mode });
        
        // Update canvas dimensions in textEngine
        this.textEngine.updateConfig({ 
            canvasWidth: this.canvasManager.canvas.width, 
            canvasHeight: this.canvasManager.canvas.height 
        });
        
        // Show/hide manual controls
        if (mode === 'manual') {
            console.log('👀 Showing manual controls');
            this.elements.manualControls.style.display = 'block';
        } else {
            console.log('🙈 Hiding manual controls');
            this.elements.manualControls.style.display = 'none';
        }
        
        this.onTextChanged();
    }
    
    /**
     * Switch between tabs
     * @param {string} tabName - Tab to switch to
     * @private
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
        
        console.log(`🔄 Switched to ${tabName} tab`);
    }
    
    /**
     * Update symmetrical padding display only (no auto-detection)
     * @param {string} direction - 'horizontal' or 'vertical'
     * @param {number} value - Padding value
     * @private
     */
    updateSymmetricalPaddingDisplay(direction, value) {
        if (direction === 'horizontal') {
            this.textEngine.updateConfig({ 
                paddingLeft: value, 
                paddingRight: value 
            });
        } else if (direction === 'vertical') {
            this.textEngine.updateConfig({ 
                paddingTop: value, 
                paddingBottom: value 
            });
        }
        
        // Update main text component padding
        const paddingH = parseInt(this.elements.paddingHorizontal.value);
        const paddingV = parseInt(this.elements.paddingVertical.value);
        this.mainTextComponent.setPaddingIndividual({
            left: paddingH,
            right: paddingH,
            top: paddingV,
            bottom: paddingV
        });
        
        this.render(); // Update display immediately
    }
    
    /**
     * Update symmetrical padding with auto-detection
     * @param {string} direction - 'horizontal' or 'vertical'
     * @param {number} value - Padding value
     * @private
     */
    updateSymmetricalPadding(direction, value) {
        if (direction === 'horizontal') {
            this.textEngine.updateConfig({ 
                paddingLeft: value, 
                paddingRight: value 
            });
        } else if (direction === 'vertical') {
            this.textEngine.updateConfig({ 
                paddingTop: value, 
                paddingBottom: value 
            });
        }
        this.onTextChanged();
    }
    
    /**
     * Update background color with opacity
     * @private
     */
    updateBackgroundColor() {
        const isTransparent = this.elements.transparentBackground.checked;
        
        if (isTransparent) {
            this.canvasManager.setBackgroundColor('transparent');
        } else {
            const hexColor = this.elements.backgroundColor.value;
            const opacity = parseInt(this.elements.backgroundOpacity.value);
            
            if (opacity === 100) {
                // Fully opaque, use hex color
                this.canvasManager.setBackgroundColor(hexColor);
            } else {
                // Convert hex to RGBA with opacity
                const rgbaColor = this.hexToRgba(hexColor, opacity / 100);
                this.canvasManager.setBackgroundColor(rgbaColor);
            }
        }
        
        this.render();
    }
    
    /**
     * Convert hex color to RGBA
     * @param {string} hex - Hex color (#ffffff)
     * @param {number} alpha - Alpha value (0-1)
     * @returns {string} RGBA color string
     * @private
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
     * @private
     */
    handleBackgroundImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.canvasManager.setBackgroundImage(img);
                this.elements.clearBackgroundImage.style.display = 'inline-block';
                this.render();
                console.log('✅ Background image loaded');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    /**
     * Clear background image
     * @private
     */
    clearBackgroundImage() {
        this.canvasManager.setBackgroundImage(null);
        this.elements.backgroundImage.value = '';
        this.elements.clearBackgroundImage.style.display = 'none';
        this.render();
        console.log('🗑️ Background image cleared');
    }
    
    
    /**
     * Save current spot data for persistence
     * @private
     */
    saveSpotData() {
        const promises = this.spots.map(async (spot) => {
            if (spot.type === 'empty') return null;
            
            // Create base saved spot data
            const savedSpot = {
                // Position data for matching
                x: spot.x,
                y: spot.y,
                width: spot.width,
                height: spot.height,
                
                // Basic properties
                type: spot.type,
                opacity: spot.opacity,
                originalId: spot.id
            };
            
            // Handle content based on type
            if (spot.content) {
                if (spot.type === 'image' && spot.content.image) {
                    // Convert image to data URL for serialization
                    savedSpot.content = {
                        ...spot.content,
                        imageDataURL: this.imageToDataURL(spot.content.image),
                        image: null // Remove the actual image object
                    };
                } else {
                    // For non-image content, use regular deep copy
                    savedSpot.content = JSON.parse(JSON.stringify(spot.content));
                }
            } else {
                savedSpot.content = null;
            }
            
            return savedSpot;
        });
        
        // Filter out null values (empty spots) and combine with waiting spots
        const currentSpotData = this.spots
            .map(spot => this.createSavedSpotData(spot))
            .filter(savedSpot => savedSpot !== null);
        
        // Combine current spots with waiting spots (waiting spots take priority to be restored first)
        this.savedSpotData = [...this.waitingSpots, ...currentSpotData];
        
        console.log(`💾 Saved ${currentSpotData.length} current spots + ${this.waitingSpots.length} waiting spots = ${this.savedSpotData.length} total`);
    }
    
    /**
     * Create saved spot data for a single spot
     * @param {Spot} spot - Spot to save
     * @returns {Object|null} Saved spot data or null if empty
     * @private
     */
    createSavedSpotData(spot) {
        if (spot.type === 'empty') return null;
        
        const savedSpot = {
            // Position data for matching
            x: spot.x,
            y: spot.y,
            width: spot.width,
            height: spot.height,
            
            // Basic properties
            type: spot.type,
            opacity: spot.opacity,
            originalId: spot.id
        };
        
        // Handle content based on type
        if (spot.content) {
            if (spot.type === 'image' && spot.content.image) {
                // Convert image to data URL for serialization
                savedSpot.content = {
                    ...spot.content,
                    imageDataURL: this.imageToDataURL(spot.content.image),
                    image: null // Remove the actual image object
                };
            } else {
                // For non-image content, use regular deep copy
                savedSpot.content = JSON.parse(JSON.stringify(spot.content));
            }
        } else {
            savedSpot.content = null;
        }
        
        return savedSpot;
    }
    
    /**
     * Convert Image object to data URL
     * @param {HTMLImageElement} image - Image to convert
     * @returns {string} Data URL
     * @private
     */
    imageToDataURL(image) {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = image.width || image.naturalWidth;
            canvas.height = image.height || image.naturalHeight;
            ctx.drawImage(image, 0, 0);
            return canvas.toDataURL();
        } catch (error) {
            console.warn('Failed to convert image to data URL:', error);
            return null;
        }
    }
    
    /**
     * Restore saved spot data to newly detected spots
     * @private
     */
    restoreSpotData() {
        if (!this.savedSpotData || this.savedSpotData.length === 0) {
            console.log('📝 No saved spot data to restore');
            return;
        }
        
        console.log(`🔄 Attempting to restore ${this.savedSpotData.length} saved spots (including ${this.waitingSpots.length} waiting) to ${this.spots.length} new spots`);
        
        // Phase 1: Try to restore spots to their original positions
        const remainingSavedSpots = [...this.savedSpotData];
        let restoredCount = 0;
        
        // First pass: Match spots to their original positions (within 150 pixels)
        for (const newSpot of this.spots) {
            if (remainingSavedSpots.length === 0) break;
            
            let bestMatch = null;
            let bestScore = Infinity;
            let bestIndex = -1;
            
            remainingSavedSpots.forEach((savedSpot, index) => {
                // Calculate distance between centers
                const newCenterX = newSpot.x + newSpot.width / 2;
                const newCenterY = newSpot.y + newSpot.height / 2;
                const savedCenterX = savedSpot.x + savedSpot.width / 2;
                const savedCenterY = savedSpot.y + savedSpot.height / 2;
                
                const distance = Math.sqrt(
                    Math.pow(newCenterX - savedCenterX, 2) + 
                    Math.pow(newCenterY - savedCenterY, 2)
                );
                
                // Only consider close matches in first pass
                if (distance < 150 && distance < bestScore) {
                    bestScore = distance;
                    bestMatch = savedSpot;
                    bestIndex = index;
                }
            });
            
            // Restore if we found a close match
            if (bestMatch) {
                this.restoreSpotToNewLocation(newSpot, bestMatch);
                remainingSavedSpots.splice(bestIndex, 1);
                restoredCount++;
                console.log(`✅ Restored spot ${newSpot.id} with type '${bestMatch.type}' at original position (distance: ${Math.round(bestScore)})`);
            }
        }
        
        // Phase 2: Place remaining saved spots in any available spots (starting from spot 1)
        const availableSpots = this.spots.filter(spot => spot.type === 'empty');
        for (let i = 0; i < availableSpots.length && remainingSavedSpots.length > 0; i++) {
            const newSpot = availableSpots[i];
            const savedSpot = remainingSavedSpots[0]; // Take first remaining saved spot
            
            this.restoreSpotToNewLocation(newSpot, savedSpot);
            remainingSavedSpots.shift(); // Remove from remaining
            restoredCount++;
            console.log(`✅ Restored spot ${newSpot.id} with type '${savedSpot.type}' at new position (was spot ${savedSpot.originalId})`);
        }
        
        // Phase 3: Move unfitted spots to waiting list (don't delete them!)
        if (remainingSavedSpots.length > 0) {
            this.waitingSpots = remainingSavedSpots;
            console.log(`⏳ ${remainingSavedSpots.length} spots moved to waiting list (will be restored when space becomes available)`);
            remainingSavedSpots.forEach(spot => {
                console.log(`   - Waiting: spot with type '${spot.type}' (was spot ${spot.originalId})`);
            });
        } else {
            // Clear waiting list if all spots were restored
            this.waitingSpots = [];
        }
        
        const unrestoredCount = this.waitingSpots.length;
        console.log(`🎯 Restoration complete: ${restoredCount} restored, ${unrestoredCount} waiting for space`);
        
        if (unrestoredCount > 0) {
            console.log('💡 Waiting spots will be automatically restored when layout provides more space');
        }
    }
    
    /**
     * Restore a saved spot to a new spot location
     * @param {Spot} newSpot - New spot to restore to
     * @param {Object} savedSpot - Saved spot data
     * @private
     */
    restoreSpotToNewLocation(newSpot, savedSpot) {
        newSpot.setType(savedSpot.type);
        
        // Handle content restoration based on type
        if (savedSpot.content) {
            if (savedSpot.type === 'image' && savedSpot.content.imageDataURL) {
                // Restore image from data URL
                this.restoreImageContent(newSpot, savedSpot.content);
            } else {
                // Regular content restoration
                newSpot.content = savedSpot.content;
            }
        }
        
        if (savedSpot.opacity !== undefined) {
            newSpot.opacity = savedSpot.opacity;
        }
    }
    
    /**
     * Restore image content from data URL
     * @param {Spot} spot - Spot to restore to
     * @param {Object} savedContent - Saved content with imageDataURL
     * @private
     */
    restoreImageContent(spot, savedContent) {
        if (!savedContent.imageDataURL) {
            console.warn('No image data URL found for spot restoration');
            return;
        }
        
        const img = new Image();
        img.onload = () => {
            // Create the content object with restored image
            spot.content = {
                ...savedContent,
                image: img,
                imageDataURL: undefined // Remove the data URL as we now have the image
            };
            
            // Re-render to show the restored image
            this.render();
            console.log(`🖼️ Image restored for spot ${spot.id}`);
        };
        
        img.onerror = () => {
            console.warn(`Failed to load image for spot ${spot.id}`);
            // Set content without image so other properties are still restored
            spot.content = {
                ...savedContent,
                image: null,
                imageDataURL: undefined
            };
        };
        
        img.src = savedContent.imageDataURL;
    }
    
    /**
     * Auto-detect spots with debouncing
     * @param {number} delay - Delay in milliseconds (default: 500ms)
     * @param {Function} callback - Optional callback to run after detection completes
     * @private
     */
    autoDetectSpotsDebounced(delay = 500, callback = null) {
        if (!this.autoDetectSpots) return;
        
        // Clear existing timeout
        if (this.spotDetectionTimeout) {
            clearTimeout(this.spotDetectionTimeout);
        }
        
        // Set new timeout
        this.spotDetectionTimeout = setTimeout(() => {
            console.log('🤖 Auto-detecting spots after text change...');
            this.detectSpots(callback);
        }, delay);
    }

    /**
     * Detect open spots using the algorithm
     * @param {Function} callback - Optional callback to run after detection completes
     */
    detectSpots(callback = null) {
        try {
            console.log('🔍 Starting spot detection...');
            
            // Save current spot data before regenerating (only if we have spots)
            if (this.spots.length > 0) {
                this.saveSpotData();
            }
            
            // Enable debugging for detection
            this.spotDetector.setDebugging(true);
            
            // Sync main text component first
            this.syncMainTextComponent();
            
            // Get current text bounds from MainTextComponent
            const textBounds = this.getTextBoundsFromMainComponent();
            const canvas = this.canvasManager.getDimensions();
            
            // Prepare padding info for spot detector
            const padding = {
                top: this.mainTextComponent.paddingTop,
                bottom: this.mainTextComponent.paddingBottom,
                left: this.mainTextComponent.paddingLeft,
                right: this.mainTextComponent.paddingRight
            };
            
            // Run detection algorithm
            const startTime = performance.now();
            this.spots = this.spotDetector.detect(canvas, textBounds, padding);
            const endTime = performance.now();
            
            // Restore saved spot data to new spots
            this.restoreSpotData();
            
            // Update UI
            this.updateSpotsUI();
            this.render();

            // Rebuild grid after spot detection (NEW - keep grid synchronized)
            if (this.grid) {
                this.grid.buildFromExisting();
                console.log('🔄 Grid rebuilt after spot detection');

                // Update visual grid display
                this.updateVisualGrid();
            }

            // Call the callback if provided
            if (callback && typeof callback === 'function') {
                console.log('🎯 Spot detection complete, running callback...');
                callback();
            }
            
        } catch (error) {
            console.error('❌ Spot detection failed:', error);
            this.showError('Spot detection failed. Please try again.');
            
            // Still call callback even if detection failed
            if (callback && typeof callback === 'function') {
                callback();
            }
        }
    }
    
    /**
     * Get text bounds from MainTextComponent for spot detection
     * @returns {Array} Array of text bounds
     * @private
     */
    getTextBoundsFromMainComponent() {
        return this.mainTextComponent.getTextBounds(this.canvasManager.ctx);
    }
    
    /**
     * Update the spots list in the UI
     * @private
     */
    updateSpotsUI() {
        // Update spot count with waiting spots indicator
        const waitingText = this.waitingSpots.length > 0 ? ` (+${this.waitingSpots.length} waiting)` : '';
        this.elements.spotCount.textContent = `${this.spots.length}${waitingText}`;
        
        // Clear existing spots list
        this.elements.spotsList.innerHTML = '';
        
        // Add each spot to the UI
        this.spots.forEach(spot => {
            const spotItem = this.createSpotItemElement(spot);
            this.elements.spotsList.appendChild(spotItem);
        });
        
        // Add waiting spots section if any exist
        if (this.waitingSpots.length > 0) {
            this.addWaitingSpotsSection();
        }
    }
    
    /**
     * Add waiting spots section to the UI
     * @private
     */
    addWaitingSpotsSection() {
        const waitingSection = document.createElement('div');
        waitingSection.className = 'waiting-spots-section';
        waitingSection.innerHTML = `
            <div class="waiting-spots-header">
                <h4>⏳ Waiting for Space (${this.waitingSpots.length})</h4>
                <p>These spots will be restored when layout provides more room:</p>
            </div>
        `;
        
        // Add each waiting spot as a simple info item
        this.waitingSpots.forEach((spot, index) => {
            const waitingItem = document.createElement('div');
            waitingItem.className = 'waiting-spot-item';
            
            const contentPreview = this.getSpotContentPreview(spot);
            waitingItem.innerHTML = `
                <span class="waiting-spot-info">
                    <strong>Spot ${spot.originalId}</strong> (${spot.type})
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
     * @private
     */
    getSpotContentPreview(spot) {
        if (!spot.content) return '';
        
        switch (spot.type) {
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
     * @private
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
            option.selected = type.value === spot.type;
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
            spot.setType(typeSelect.value);
            this.createSpotTypeControls(spot, controls);
            this.render();

            // Update grid to reflect spot type change
            if (this.grid) {
                this.grid.updateSpotType(spot.id, typeSelect.value);
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
     * @private
     */
    createSpotTypeControls(spot, container) {
        // Clear existing controls
        container.innerHTML = '';
        
        // Use appropriate controller for the spot type
        const controller = this.spotControllers[spot.type];
        if (controller) {
            controller.createControls(spot, container, 'sidebar');
        }
        
        // Add padding control for all non-empty spot types (after type-specific controls)
        if (spot.type !== 'empty') {
            controller.createPaddingControl(spot, container, 'sidebar');
        }
    }
    
    
    /**
     * Handle spot type changes
     * @param {number} spotId - ID of the spot
     * @param {string} newType - New spot type
     * @private
     */
    onSpotTypeChanged(spotId, newType) {
        const spot = this.spots.find(s => s.id === spotId);
        if (spot) {
            spot.setType(newType);
            console.log(`Changed spot ${spotId} to type: ${newType}`);
            this.render();

            // Update grid to reflect spot type change
            if (this.grid) {
                this.grid.updateSpotType(spot.id, typeSelect.value);
            }
        }
    }
    
    /**
     * Update spot padding
     * @param {Spot} spot - Spot object
     * @param {number} padding - Padding value in pixels
     * @private
     */
    updateSpotPadding(spot, padding) {
        if (!spot.content) spot.content = {};
        spot.content.padding = padding;
        this.render();
        console.log(`Updated spot ${spot.id} padding: ${padding}px`);
    }
    
    /**
     * Update spot text content
     * @param {Spot} spot - Spot object
     * @param {string} text - New text content
     * @private
     */
    updateSpotText(spot, text) {
        if (!spot.content) spot.content = {};
        spot.content.text = text;
        this.render();
    }
    
    /**
     * Update spot text alignment
     * @param {Spot} spot - Spot object
     * @param {string} alignment - Text alignment (left, center, right)
     * @private
     */
    updateSpotTextAlignment(spot, alignment) {
        if (!spot.content) spot.content = {};
        spot.content.textAlign = alignment;
        this.render();
    }
    
    /**
     * Toggle spot text style
     * @param {Spot} spot - Spot object
     * @param {string} style - Style to toggle (bold, italic, underline)
     * @private
     */
    toggleSpotTextStyle(spot, style) {
        if (!spot.content) spot.content = {};
        if (!spot.content.styles) spot.content.styles = {};
        spot.content.styles[style] = !spot.content.styles[style];
        this.render();
    }
    
    /**
     * Update spot text color
     * @param {Spot} spot - Spot object
     * @param {string} color - New text color
     * @private
     */
    updateSpotTextColor(spot, color) {
        if (!spot.content) spot.content = {};
        spot.content.color = color;
        this.render();
    }
    
    /**
     * Handle spot image upload
     * @param {Spot} spot - Spot object
     * @param {Event} event - File input event
     * @private
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
                this.render();
                console.log(`✅ Image loaded for spot ${spot.id}`);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    /**
     * Update spot image scale
     * @param {Spot} spot - Spot object
     * @param {number} scale - New scale value
     * @private
     */
    updateSpotImageScale(spot, scale) {
        if (!spot.content) spot.content = {};
        spot.content.scale = scale;
        this.render();
    }
    
    /**
     * Update spot image rotation
     * @param {Spot} spot - Spot object
     * @param {number} rotation - New rotation value in degrees
     * @private
     */
    updateSpotImageRotation(spot, rotation) {
        if (!spot.content) spot.content = {};
        spot.content.rotation = rotation;
        this.render();
    }
    
    /**
     * Handle canvas clicks
     * @param {MouseEvent} event - Click event
     * @private
     */
    onCanvasClick(event) {
        const canvasCoords = this.canvasManager.screenToCanvas(event.clientX, event.clientY);
        const clickedSpot = this.canvasManager.findSpotAt(canvasCoords.x, canvasCoords.y, this.spots);
        
        if (clickedSpot) {
            console.log(`Clicked on spot ${clickedSpot.id}`);
            // Future: Could highlight spot or show properties
        }
    }
    
    /**
     * Main render method
     * @param {boolean} isAnimationFrame - True if called from animation loop
     */
    render(isAnimationFrame = false) {
        try {
            // Update main text component with current values
            this.syncMainTextComponent();

            // Render canvas background
            this.canvasManager.renderBackground();

            // NEW: Simple unified rendering (animations always applied if present)
            this._renderWithAnimations();

            // Render debug overlays if enabled
            if (this.debugController) {
                this.debugController.renderDebugOverlays(this.canvasManager.ctx, {
                    mainTextComponent: this.mainTextComponent,
                    spots: this.spots
                });
            }

        } catch (error) {
            console.error('❌ Render failed:', error);
        }
    }

    /**
     * Render content with animations (NEW - Grid-aware per-cell animation rendering)
     * Applies cell.currentOffset transforms when rendering animated cells
     * @private
     */
    _renderWithAnimations() {
        const ctx = this.canvasManager.ctx;
        const debugOptions = this.debugController ? this.debugController.getDebugOptions() : {};

        // Check if we have a grid with cells
        if (this.grid && this.grid.isReady) {
            const allCells = this.grid.getAllCells();
            const animatedCells = allCells.filter(cell => cell && cell.animation);

            // If we have animated cells, render cell-by-cell with transforms
            if (animatedCells.length > 0) {
                // Render all grid cells (both animated and non-animated)
                allCells.forEach(cell => {
                    if (!cell) return;

                    if (cell.type === 'main-text') {
                        ctx.save();

                        // Apply animation transforms if cell has animation
                        const offset = cell.currentOffset || { x: 0, y: 0 };

                        // Calculate transform origin (center of text bounds)
                        const centerX = cell.bounds.x + cell.bounds.width / 2;
                        const centerY = cell.bounds.y + cell.bounds.height / 2;

                        // Move to center, apply transforms, move back
                        ctx.translate(centerX, centerY);
                        ctx.translate(offset.x || 0, offset.y || 0);
                        if (offset.rotation) ctx.rotate(offset.rotation);
                        if (offset.scale) ctx.scale(offset.scale, offset.scale);
                        ctx.translate(-centerX, -centerY);

                        // Render text cell
                        ctx.font = cell.getFontString();
                        ctx.fillStyle = cell.style.color;
                        ctx.textAlign = cell.getAlignment();
                        ctx.textBaseline = 'top';

                        // Calculate text position based on alignment
                        const textX = cell.getAlignment() === 'center'
                            ? cell.bounds.x + cell.bounds.width / 2
                            : cell.bounds.x;

                        // Draw highlight if enabled
                        if (cell.style.highlight) {
                            ctx.fillStyle = cell.style.highlightColor;
                            ctx.fillRect(cell.bounds.x, cell.bounds.y, cell.bounds.width, cell.bounds.height);
                            ctx.fillStyle = cell.style.color;
                        }

                        // Draw text
                        ctx.fillText(cell.text, textX, cell.bounds.y);

                        // Draw underline if enabled
                        if (cell.style.underline) {
                            const textWidth = ctx.measureText(cell.text).width;
                            const underlineY = cell.bounds.y + cell.bounds.height - 2;
                            const underlineX = cell.getAlignment() === 'center'
                                ? textX - textWidth / 2
                                : textX;

                            ctx.strokeStyle = cell.style.color;
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.moveTo(underlineX, underlineY);
                            ctx.lineTo(underlineX + textWidth, underlineY);
                            ctx.stroke();
                        }

                        ctx.restore();
                    } else if (cell.type === 'spot') {
                        // Render spot cells normally (spots handle their own rendering)
                        const spot = this.spots.find(s => s.id === cell.spotId);
                        if (spot) {
                            const showOutline = debugOptions.showSpotOutlines;
                            const showNumber = debugOptions.showSpotNumbers;
                            spot.render(ctx, showOutline, showNumber, this.canvasManager.backgroundImage);
                        }
                    }
                });

                // Render spots that are not part of the grid
                this.spots.forEach(spot => {
                    const isInGrid = allCells.some(cell =>
                        cell && cell.type === 'spot' && cell.spotId === spot.id
                    );

                    if (!isInGrid) {
                        const showOutline = debugOptions.showSpotOutlines;
                        const showNumber = debugOptions.showSpotNumbers;
                        spot.render(ctx, showOutline, showNumber, this.canvasManager.backgroundImage);
                    }
                });

                return; // Done rendering with grid
            }
        }

        // Fallback: No grid or no animated cells - use MainTextComponent
        this.mainTextComponent.render(ctx);

        // Render all spots normally
        this.spots.forEach(spot => {
            const showOutline = debugOptions.showSpotOutlines;
            const showNumber = debugOptions.showSpotNumbers;
            spot.render(ctx, showOutline, showNumber, this.canvasManager.backgroundImage);
        });
    }

    /**
     * Start animation render loop
     * Continuously renders canvas while animations are playing
     * @private
     */
    _startAnimationLoop() {
        if (this._animationLoopId) {
            console.log('🔄 Animation loop already running');
            return;
        }

        console.log('▶️ Starting animation render loop');
        this._animationStartTime = performance.now();
        this._animationFrameCount = 0;

        const animate = () => {
            // Check if any animations are still playing
            const hasPlayingAnimations = this.grid &&
                this.grid.getAnimatedCells().some(cell =>
                    cell.animation && cell.animation.isPlaying
                );

            if (hasPlayingAnimations) {
                // Re-render canvas
                this.render();

                // Update FPS counter
                this._animationFrameCount++;
                const elapsed = performance.now() - this._animationStartTime;
                if (elapsed >= 1000) {
                    const fps = Math.round((this._animationFrameCount / elapsed) * 1000);
                    const fpsDisplay = document.getElementById('fpsDisplay');
                    if (fpsDisplay) {
                        fpsDisplay.textContent = `${fps} FPS`;
                    }
                    this._animationFrameCount = 0;
                    this._animationStartTime = performance.now();
                }

                // Schedule next frame
                this._animationLoopId = requestAnimationFrame(animate);
            } else {
                // No more playing animations, stop loop
                console.log('⏹️ No active animations, stopping render loop');
                this._stopAnimationLoop();
            }
        };

        // Start the loop
        this._animationLoopId = requestAnimationFrame(animate);
    }

    /**
     * Stop animation render loop
     * @private
     */
    _stopAnimationLoop() {
        if (this._animationLoopId) {
            cancelAnimationFrame(this._animationLoopId);
            this._animationLoopId = null;
            console.log('⏸️ Animation render loop stopped');

            // Clear FPS display
            const fpsDisplay = document.getElementById('fpsDisplay');
            if (fpsDisplay) {
                fpsDisplay.textContent = '0 FPS';
            }
        }
    }


    
    /**
     * Sync MainTextComponent with current UI state
     * @private
     */
    syncMainTextComponent() {
        // Update text content
        this.mainTextComponent.text = this.elements.mainText.value;
        
        // Update container size and position
        this.mainTextComponent.setContainer(
            0, 0,
            this.canvasManager.canvas.width,
            this.canvasManager.canvas.height
        );
        
        // Update color
        this.mainTextComponent.color = this.elements.textColor.value;
        
        // Update padding
        const paddingH = parseInt(this.elements.paddingHorizontal.value);
        const paddingV = parseInt(this.elements.paddingVertical.value);
        this.mainTextComponent.setPaddingIndividual({
            left: paddingH,
            right: paddingH,
            top: paddingV,
            bottom: paddingV
        });
        
        // Update text mode (auto-size vs manual)
        if (this.elements.fillCanvasMode.checked) {
            this.mainTextComponent.fontSize = 'auto';
        } else {
            this.mainTextComponent.fontSize = parseInt(this.elements.fontSize.value);
        }
        
        // Update line spacing
        this.mainTextComponent.lineSpacing = parseInt(this.elements.lineSpacing.value);
        
        // Update wrapping
        this.mainTextComponent.wrapText = this.elements.enableWrap.checked;
        
        // Update positioning for manual mode
        if (this.elements.manualMode.checked) {
            const activePos = document.querySelector('.pos-btn.active');
            if (activePos) {
                this.mainTextComponent.alignH = activePos.dataset.horizontal;
                this.mainTextComponent.alignV = activePos.dataset.vertical;
            }
        } else {
            // Fill canvas mode uses center alignment
            this.mainTextComponent.alignH = 'center';
            this.mainTextComponent.alignV = 'middle';
        }
        
        // Apply saved line alignments by converting content keys to numeric indices
        this.applySavedAlignments();
    }
    
    
    /**
     * Show error message to user
     * @param {string} message - Error message
     * @private
     */
    showError(message) {
        // Simple alert for now - could be improved with better UI
        alert('Error: ' + message);
    }
    
    /**
     * Get current application state for debugging
     * @returns {Object} Current state
     */
    getState() {
        return {
            textContent: this.elements.mainText.value,
            textConfig: this.textEngine.getConfig(),
            spots: this.spots.map(spot => ({
                id: spot.id,
                type: spot.type,
                bounds: { x: spot.x, y: spot.y, width: spot.width, height: spot.height }
            })),
            canvasDimensions: this.canvasManager.getDimensions()
        };
    }

    /**
     * Handle canvas resize event from Chatooly CDN
     * @param {Event} e - Canvas resize event
     * @private
     */
    onCanvasResized(e) {
        if (!this.isInitialized || !e.detail) return;

        const newWidth = e.detail.canvas.width;
        const newHeight = e.detail.canvas.height;
        const oldWidth = this.previousCanvasSize.width;
        const oldHeight = this.previousCanvasSize.height;

        console.log(`📏 Canvas resized from ${oldWidth}x${oldHeight} to ${newWidth}x${newHeight}`);

        // Skip if this is the first resize or dimensions haven't changed
        if (oldWidth === 0 || oldHeight === 0 || (oldWidth === newWidth && oldHeight === newHeight)) {
            this.previousCanvasSize = { width: newWidth, height: newHeight };
            return;
        }

        // Calculate scale factors
        const scaleX = newWidth / oldWidth;
        const scaleY = newHeight / oldHeight;

        // Scale all spots
        this.spots.forEach(spot => {
            spot.x *= scaleX;
            spot.y *= scaleY;
            spot.width *= scaleX;
            spot.height *= scaleY;

            // Scale spot content if needed
            if (spot.content) {
                if (spot.content.fontSize) {
                    spot.content.fontSize = Math.round(spot.content.fontSize * Math.min(scaleX, scaleY));
                }
                if (spot.content.padding) {
                    spot.content.padding = Math.round(spot.content.padding * Math.min(scaleX, scaleY));
                }
            }
        });

        // Canvas dimensions are now automatically synced - no manual update needed

        // Update text engine configuration
        this.textEngine.updateConfig({
            canvasWidth: newWidth,
            canvasHeight: newHeight
        });

        // Update main text component
        this.mainTextComponent.setContainer(0, 0, newWidth, newHeight);

        // Scale padding
        const paddingH = Math.round(parseInt(this.elements.paddingHorizontal.value) * scaleX);
        const paddingV = Math.round(parseInt(this.elements.paddingVertical.value) * scaleY);
        this.elements.paddingHorizontal.value = paddingH;
        this.elements.paddingVertical.value = paddingV;
        this.elements.paddingHorizontalValue.textContent = paddingH + 'px';
        this.elements.paddingVerticalValue.textContent = paddingV + 'px';

        // Update tracking
        this.previousCanvasSize = { width: newWidth, height: newHeight };

        // Re-render everything
        this.render();

        // Trigger spot detection if auto-detect is enabled
        if (this.autoDetectSpots && this.elements.mainText.value.trim()) {
            this.autoDetectSpotsDebounced(300);
        }
    }

    /**
     * Run a test to verify everything is working
     * @returns {Object} Test results
     */
    runTest() {
        console.log('🧪 Running POC test...');
        
        try {
            // Set test text
            this.elements.mainText.value = 'TEST\nSPOT\nDETECTION';
            this.onTextChanged();
            
            // Run detection
            this.detectSpots();
            
            // Check results
            const hasText = this.textEngine.getTextBounds().length > 0;
            const hasSpots = this.spots.length > 0;
            const canRender = true; // If we get here, rendering worked
            
            const result = {
                success: hasText && hasSpots && canRender,
                textLines: this.textEngine.getTextBounds().length,
                spotsFound: this.spots.length,
                canvasSize: this.canvasManager.getDimensions(),
                textEngine: hasText,
                spotDetector: hasSpots,
                canvasManager: canRender
            };
            
            console.log('✅ Test completed:', result);
            return result;
            
        } catch (error) {
            console.error('❌ Test failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Handle canvas click to detect spot selection
     * @param {MouseEvent} e - Mouse event
     * @private
     */
    handleCanvasClick(e) {
        const rect = this.canvasManager.canvas.getBoundingClientRect();
        const canvasCoords = this.canvasManager.screenToCanvas(e.clientX, e.clientY);
        
        // Find clicked spot
        const clickedSpot = this.canvasManager.findSpotAt(canvasCoords.x, canvasCoords.y, this.spots);
        
        if (clickedSpot) {
            console.log(`🎯 Clicked on spot ${clickedSpot.id}`);
            this.showSpotEditPopup(clickedSpot, e.clientX, e.clientY);
        }
    }
    
    /**
     * Show spot edit popup
     * @param {Spot} spot - Spot to edit
     * @param {number} clickX - Click X position (screen coordinates)
     * @param {number} clickY - Click Y position (screen coordinates) 
     * @private
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
        
        console.log(`📝 Opened popup for spot ${spot.id}`);
    }
    
    
    /**
     * Create spot controls for popup
     * @param {Spot} spot - Spot object
     * @param {HTMLElement} container - Container for controls
     * @private
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
                <option value="image">Image</option>
                <option value="mask">Mask (Background Reveal)</option>
            </select>
        `;
        
        const typeSelect = typeGroup.querySelector('.popup-spot-type-select');
        typeSelect.value = spot.type;
        
        typeSelect.addEventListener('change', (e) => {
            e.stopPropagation();
            spot.setType(typeSelect.value);
            this.createPopupSpotControls(spot, container);
            this.render();
            this.updateSpotsUI();

            // Update grid to reflect spot type change
            if (this.grid) {
                this.grid.updateSpotType(spot.id, typeSelect.value);
                this.updateVisualGrid();
            }
        });
        
        container.appendChild(typeGroup);
        
        // Add padding control for non-empty types
        if (spot.type !== 'empty') {
            this.spotControllers.text.createPaddingControl(spot, container, 'popup');
        }
        
        // Use appropriate controller for the spot type
        const controller = this.spotControllers[spot.type];
        if (controller) {
            controller.createControls(spot, container, 'popup');
        }
    }
    
    /**
     * Set background image
     * @param {HTMLImageElement} image - Image to set as background
     */
    setBackgroundImage(image) {
        this.backgroundImage = image;
        this.render();
    }
    
    /**
     * Clear background image
     */
    clearBackgroundImage() {
        this.backgroundImage = null;
        this.render();
    }
    
    /**
     * Render background image on canvas if set
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @private
     */
    renderBackgroundImage(ctx) {
        if (!this.backgroundImage) return;
        
        const canvas = this.canvasManager.canvas;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // Calculate scaling to fit the image in the canvas while maintaining aspect ratio
        const imageAspect = this.backgroundImage.width / this.backgroundImage.height;
        const canvasAspect = canvasWidth / canvasHeight;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imageAspect > canvasAspect) {
            // Image is wider than canvas - fit to height
            drawHeight = canvasHeight;
            drawWidth = drawHeight * imageAspect;
            drawX = (canvasWidth - drawWidth) / 2;
            drawY = 0;
        } else {
            // Image is taller than canvas - fit to width
            drawWidth = canvasWidth;
            drawHeight = drawWidth / imageAspect;
            drawX = 0;
            drawY = (canvasHeight - drawHeight) / 2;
        }
        
        // Draw the background image
        ctx.drawImage(this.backgroundImage, drawX, drawY, drawWidth, drawHeight);
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
                await this.shuffler.shuffleAll(useDefaults);
            });
        }

        if (shuffleLayout) {
            shuffleLayout.addEventListener('click', async () => {
                await this.shuffler.shuffleLayout();
            });
        }

        if (shuffleColors) {
            shuffleColors.addEventListener('click', async () => {
                await this.shuffler.shuffleColors();
            });
        }

        if (shuffleSpots) {
            shuffleSpots.addEventListener('click', async () => {
                const useDefaults = useDefaultContent ? useDefaultContent.checked : false;
                await this.shuffler.shuffleSpots(useDefaults);
            });
        }
    }

}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Create global app instance
        window.employerBrandTool = new EmployerBrandToolPOC();
        
        // Add to global scope for debugging
        window.app = window.employerBrandTool;
        
        console.log('🚀 Application ready! Try window.app.runTest() in console');
        
    } catch (error) {
        console.error('❌ Failed to initialize application:', error);
        alert('Failed to initialize application. Please refresh and try again.');
    }
});

// Required by Chatooly for high-res export
window.renderHighResolution = function(targetCanvas, scale) {
    if (!window.employerBrandTool || !window.employerBrandTool.isInitialized) {
        console.warn('App not ready for high-res export');
        return;
    }

    const app = window.employerBrandTool;
    const ctx = targetCanvas.getContext('2d');

    // Set up scaled canvas
    const originalWidth = app.canvasManager.canvas.width;
    const originalHeight = app.canvasManager.canvas.height;
    targetCanvas.width = originalWidth * scale;
    targetCanvas.height = originalHeight * scale;

    ctx.save();
    ctx.scale(scale, scale);

    // Get current render data (no swapping - use original layout)
    const renderData = {
        textLines: app.textEngine.getLinesForRender(),
        textConfig: app.textEngine.getConfig(),
        spots: app.spots,
        debugInfo: null // Skip debug for export
    };

    // Temporarily swap canvas and context for rendering, but keep everything else the same
    const originalCanvas = app.canvasManager.canvas;
    const originalCtx = app.canvasManager.ctx;

    // Temporarily set export canvas and context
    app.canvasManager.canvas = targetCanvas;
    app.canvasManager.ctx = ctx;

    // Render using the actual CanvasManager (preserves all methods and alignment logic)
    app.canvasManager.render(renderData);

    // Restore original canvas and context
    app.canvasManager.canvas = originalCanvas;
    app.canvasManager.ctx = originalCtx;

    ctx.restore();
    console.log(`High-res export completed at ${scale}x resolution`);
    console.log(`Original canvas: ${originalWidth}x${originalHeight}`);
    console.log(`Export canvas: ${targetCanvas.width}x${targetCanvas.height}`);
};