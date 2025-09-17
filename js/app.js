/**
 * app.js - Main application controller
 * Ties together all components and handles UI interactions
 */

class EmployerBrandToolPOC {
    constructor() {
        // Core components
        this.canvasManager = new CanvasManager();
        this.textEngine = new TextEngine();
        this.spotDetector = new SpotDetector();
        
        // State
        this.spots = [];
        this.isInitialized = false;
        this.savedLineAlignments = {}; // Store user's line alignment preferences
        this.savedSpotData = []; // Store spot content data for persistence
        
        // Auto-detection settings
        this.autoDetectSpots = true; // Enable automatic spot detection
        this.spotDetectionTimeout = null; // Debounce timeout for spot detection
        this.waitingSpots = []; // Spots that couldn't fit in current layout but are preserved
        
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
        
        // Initialize the application
        this.initialize();
    }
    
    /**
     * Initialize the application
     */
    initialize() {
        try {
            // Cache UI elements
            this.cacheUIElements();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize TextEngine with canvas dimensions and default mode
            this.textEngine.updateConfig({ 
                canvasWidth: this.canvasManager.canvas.width, 
                canvasHeight: this.canvasManager.canvas.height,
                mode: 'fillCanvas' // Set default mode
            });
            
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
            
            this.isInitialized = true;
            
            console.log('✅ Employer Brand Tool POC initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize POC:', error);
            this.showError('Failed to initialize application. Please refresh and try again.');
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
            toggleDebug: 'toggleDebug',
            debugContent: 'debugContent',
            showAllDebug: 'showAllDebug',
            hideAllDebug: 'hideAllDebug',
            minSpotSize: 'minSpotSize',
            findSpots: 'findSpots',
            autoDetectSpots: 'autoDetectSpots',
            showSpotOutlines: 'showSpotOutlines',
            showSpotNumbers: 'showSpotNumbers',
            showTextBounds: 'showTextBounds',
            showPadding: 'showPadding',
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
     * Set up all event listeners
     * @private
     */
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.tab;
                this.switchTab(targetTab);
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
        
        // Main text styling buttons
        this.elements.mainTextBold.addEventListener('click', () => {
            this.mainTextComponent.fontWeight = this.mainTextComponent.fontWeight === 'bold' ? 'normal' : 'bold';
            const isActive = this.mainTextComponent.fontWeight === 'bold';
            this.elements.mainTextBold.classList.toggle('active', isActive);
            this.render();
        });
        
        this.elements.mainTextItalic.addEventListener('click', () => {
            this.mainTextComponent.fontStyle = this.mainTextComponent.fontStyle === 'italic' ? 'normal' : 'italic';
            const isActive = this.mainTextComponent.fontStyle === 'italic';
            this.elements.mainTextItalic.classList.toggle('active', isActive);
            this.render();
        });
        
        this.elements.mainTextUnderline.addEventListener('click', () => {
            this.mainTextComponent.underline = !this.mainTextComponent.underline;
            this.elements.mainTextUnderline.classList.toggle('active', this.mainTextComponent.underline);
            this.render();
        });
        
        this.elements.mainTextHighlight.addEventListener('click', () => {
            this.mainTextComponent.highlight = !this.mainTextComponent.highlight;
            this.elements.mainTextHighlight.classList.toggle('active', this.mainTextComponent.highlight);
            
            // Show/hide highlight color picker based on highlight state
            const highlightColorGroup = this.elements.mainTextHighlightColor.parentElement;
            highlightColorGroup.style.display = this.mainTextComponent.highlight ? 'block' : 'none';
            
            this.render();
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
            this.render();
        });
        
        // Line spacing changes
        this.elements.lineSpacing.addEventListener('input', () => {
            const lineSpacing = parseInt(this.elements.lineSpacing.value);
            this.elements.lineSpacingValue.textContent = lineSpacing + 'px';
            this.textEngine.updateConfig({ lineSpacing });
            this.applySavedAlignments(); // Restore alignments after config change
            this.render();
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
            this.updateSymmetricalPadding('horizontal', padding);
        });
        
        this.elements.paddingVertical.addEventListener('input', () => {
            const padding = parseInt(this.elements.paddingVertical.value);
            this.elements.paddingVerticalValue.textContent = padding + 'px';
            this.updateSymmetricalPadding('vertical', padding);
        });
        
        
        // Debug panel toggle
        this.elements.toggleDebug.addEventListener('click', () => {
            this.elements.debugContent.classList.toggle('show');
        });
        
        // Debug quick actions
        this.elements.showAllDebug.addEventListener('click', () => {
            this.elements.showSpotOutlines.checked = true;
            this.elements.showSpotNumbers.checked = true;
            this.elements.showTextBounds.checked = true;
            this.elements.showPadding.checked = true;
            this.updateDebugOptions();
        });
        
        this.elements.hideAllDebug.addEventListener('click', () => {
            this.elements.showSpotOutlines.checked = false;
            this.elements.showSpotNumbers.checked = false;
            this.elements.showTextBounds.checked = false;
            this.elements.showPadding.checked = false;
            this.updateDebugOptions();
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
                
                this.textEngine.updateConfig({
                    textPositionVertical: vertical,
                    textPositionHorizontal: horizontal
                });
                
                this.onTextChanged();
            });
        });
        
        // Canvas click detection for spots
        this.canvasManager.canvas.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });
        
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeydown(e);
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
        
        // Debug visualization toggles
        this.elements.showSpotOutlines.addEventListener('change', () => {
            this.updateDebugOptions();
        });
        
        this.elements.showSpotNumbers.addEventListener('change', () => {
            this.updateDebugOptions();
        });
        
        this.elements.showTextBounds.addEventListener('change', () => {
            this.updateDebugOptions();
        });
        
        this.elements.showPadding.addEventListener('change', () => {
            this.updateDebugOptions();
        });
        
    }
    
    /**
     * Handle text input changes
     * @private
     */
    onTextChanged() {
        const text = this.elements.mainText.value;
        this.mainTextComponent.text = text;
        
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
                    console.log(`🔄 Restoring alignment for "${lineKey}": ${savedAlignment}`);
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
                    <button type="button" class="align-btn ${currentAlignment === 'left' ? 'active' : ''}" 
                            data-line="${index}" data-align="left">L</button>
                    <button type="button" class="align-btn ${currentAlignment === 'center' ? 'active' : ''}" 
                            data-line="${index}" data-align="center">C</button>
                    <button type="button" class="align-btn ${currentAlignment === 'right' ? 'active' : ''}" 
                            data-line="${index}" data-align="right">R</button>
                </div>
            `;
            
            container.appendChild(lineControl);
        });
        
        // Add event listeners to alignment buttons
        container.querySelectorAll('.align-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lineIndex = parseInt(e.target.dataset.line);
                const alignment = e.target.dataset.align;
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
        this.render();
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
        }
        
        const activeContent = document.getElementById(contentId);
        if (activeContent) {
            activeContent.classList.add('active');
        }
        
        console.log(`🔄 Switched to ${tabName} tab`);
    }
    
    /**
     * Update symmetrical padding
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
     * Update debug visualization options
     * @private
     */
    updateDebugOptions() {
        const options = {
            showSpotOutlines: this.elements.showSpotOutlines.checked,
            showSpotNumbers: this.elements.showSpotNumbers.checked,
            showTextBounds: this.elements.showTextBounds.checked,
            showPadding: this.elements.showPadding.checked
        };
        
        this.canvasManager.setDebugOptions(options);
        this.render();
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
     * @private
     */
    autoDetectSpotsDebounced(delay = 500) {
        if (!this.autoDetectSpots) return;
        
        // Clear existing timeout
        if (this.spotDetectionTimeout) {
            clearTimeout(this.spotDetectionTimeout);
        }
        
        // Set new timeout
        this.spotDetectionTimeout = setTimeout(() => {
            console.log('🤖 Auto-detecting spots after text change...');
            this.detectSpots();
        }, delay);
    }

    /**
     * Detect open spots using the algorithm
     */
    detectSpots() {
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
            
        } catch (error) {
            console.error('❌ Spot detection failed:', error);
            this.showError('Spot detection failed. Please try again.');
        }
    }
    
    /**
     * Get text bounds from MainTextComponent for spot detection
     * @returns {Array} Array of text bounds
     * @private
     */
    getTextBoundsFromMainComponent() {
        if (!this.mainTextComponent.text.trim()) {
            return [];
        }
        
        const ctx = this.canvasManager.ctx;
        ctx.save();
        
        // Get font size
        let fontSize = this.mainTextComponent.fontSize;
        if (fontSize === 'auto') {
            fontSize = this.mainTextComponent.calculateAutoFontSize(ctx);
        }
        
        // Set font for measurement
        ctx.font = this.mainTextComponent.getFontString(fontSize);
        
        // Get text lines
        const availableWidth = this.mainTextComponent.getAvailableWidth();
        const lines = this.mainTextComponent.wrapTextToLines(ctx, this.mainTextComponent.text, availableWidth, fontSize);
        
        // Calculate line positions using TextComponent's actual rendering logic
        const lineHeight = fontSize;
        const totalHeight = lines.length * lineHeight + (lines.length - 1) * this.mainTextComponent.lineSpacing;
        const position = this.mainTextComponent.calculateTextPosition(availableWidth, totalHeight);
        
        // Create bounds for each line
        const textBounds = [];
        lines.forEach((line, index) => {
            if (!line.trim()) return;
            
            const lineY = position.y + index * (lineHeight + this.mainTextComponent.lineSpacing);
            const lineAlign = this.mainTextComponent.getLineAlignment(index);
            
            // Calculate line X based on alignment
            let lineX;
            const contentX = this.mainTextComponent.containerX + this.mainTextComponent.paddingLeft;
            
            switch (lineAlign) {
                case 'left':
                    lineX = contentX;
                    break;
                case 'right':
                    lineX = contentX + availableWidth;
                    break;
                case 'center':
                default:
                    lineX = contentX + availableWidth / 2;
                    break;
            }
            
            // Measure the line
            const metrics = ctx.measureText(line);
            
            // Calculate actual bounds based on alignment
            let boundX;
            switch (lineAlign) {
                case 'left':
                    boundX = lineX;
                    break;
                case 'right':
                    boundX = lineX - metrics.width;
                    break;
                case 'center':
                default:
                    boundX = lineX - metrics.width / 2;
                    break;
            }
            
            textBounds.push({
                x: boundX,
                y: lineY,
                width: metrics.width,
                height: fontSize,
                text: line,
                line: line // Keep both for compatibility
            });
        });
        
        ctx.restore();
        return textBounds;
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
     */
    render() {
        try {
            // Update main text component with current values
            this.syncMainTextComponent();
            
            // Render canvas background
            this.canvasManager.renderBackground();
            
            // Render main text using TextComponent
            this.mainTextComponent.render(this.canvasManager.ctx);
            
            // Render all spots
            this.spots.forEach(spot => {
                const showOutline = this.canvasManager.debugOptions.showSpotOutlines;
                const showNumber = this.canvasManager.debugOptions.showSpotNumbers;
                // Pass background image to spot render method for mask spots
                spot.render(this.canvasManager.ctx, showOutline, showNumber, this.canvasManager.backgroundImage);
            });
            
            // Render debug overlays if enabled
            if (this.canvasManager.debugOptions && 
                (this.canvasManager.debugOptions.showSpotOutlines || 
                 this.canvasManager.debugOptions.showSpotNumbers ||
                 this.canvasManager.debugOptions.showTextBounds ||
                 this.canvasManager.debugOptions.showPadding)) {
                this.renderDebugOverlays();
            }
            
        } catch (error) {
            console.error('❌ Render failed:', error);
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
     * Render debug overlays
     * @private
     */
    renderDebugOverlays() {
        const ctx = this.canvasManager.ctx;
        
        // Show text bounds
        if (this.canvasManager.debugOptions.showTextBounds) {
            ctx.save();
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            
            // Get actual text bounds from the MainTextComponent
            const textBounds = this.getTextBoundsFromMainComponent();
            
            // Draw bounds for each line
            textBounds.forEach(bounds => {
                ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
            });
            
            // Also draw container bounds in different color
            ctx.strokeStyle = '#0099ff';
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(
                this.mainTextComponent.containerX + this.mainTextComponent.paddingLeft,
                this.mainTextComponent.containerY + this.mainTextComponent.paddingTop,
                this.mainTextComponent.getAvailableWidth(),
                this.mainTextComponent.getAvailableHeight()
            );
            ctx.restore();
        }
        
        // Show padding areas
        if (this.canvasManager.debugOptions.showPadding) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
            
            const containerX = this.mainTextComponent.containerX;
            const containerY = this.mainTextComponent.containerY;
            const containerWidth = this.mainTextComponent.containerWidth;
            const containerHeight = this.mainTextComponent.containerHeight;
            
            // Top padding
            ctx.fillRect(containerX, containerY, containerWidth, this.mainTextComponent.paddingTop);
            // Bottom padding
            ctx.fillRect(containerX, containerY + containerHeight - this.mainTextComponent.paddingBottom, 
                        containerWidth, this.mainTextComponent.paddingBottom);
            // Left padding
            ctx.fillRect(containerX, containerY, this.mainTextComponent.paddingLeft, containerHeight);
            // Right padding
            ctx.fillRect(containerX + containerWidth - this.mainTextComponent.paddingRight, containerY, 
                        this.mainTextComponent.paddingRight, containerHeight);
            
            ctx.restore();
        }
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
     * Handle global keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     * @private
     */
    handleGlobalKeydown(e) {
        // Don't trigger shortcuts when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Check for Ctrl/Cmd modifier key combinations
        const isCtrlOrCmd = e.ctrlKey || e.metaKey;
        
        switch(e.code) {
            case 'KeyD':
                if (isCtrlOrCmd) {
                    e.preventDefault();
                    // Ctrl/Cmd + D: Toggle debug panel
                    this.elements.debugContent.classList.toggle('show');
                    console.log('🔄 Toggled debug panel');
                }
                break;
                
            case 'KeyH':
                if (isCtrlOrCmd && e.shiftKey) {
                    e.preventDefault();
                    // Ctrl/Cmd + Shift + H: Hide All Debug
                    this.hideAllDebugControls();
                    console.log('👁️‍🗨️ Hide all debug controls');
                } else if (isCtrlOrCmd) {
                    e.preventDefault();
                    // Ctrl/Cmd + H: Show All Debug
                    this.showAllDebugControls();
                    console.log('👁️ Show all debug controls');
                }
                break;
        }
    }
    
    /**
     * Show all debug controls
     * @private
     */
    showAllDebugControls() {
        this.elements.showSpotOutlines.checked = true;
        this.elements.showSpotNumbers.checked = true;
        this.elements.showTextBounds.checked = true;
        this.elements.showPadding.checked = true;
        this.updateDebugOptions();
    }
    
    /**
     * Hide all debug controls
     * @private
     */
    hideAllDebugControls() {
        this.elements.showSpotOutlines.checked = false;
        this.elements.showSpotNumbers.checked = false;
        this.elements.showTextBounds.checked = false;
        this.elements.showPadding.checked = false;
        this.updateDebugOptions();
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
    targetCanvas.width = app.canvasManager.width * scale;
    targetCanvas.height = app.canvasManager.height * scale;
    
    ctx.save();
    ctx.scale(scale, scale);
    
    // Re-render at high resolution
    const renderData = {
        textLines: app.textEngine.getLinesForRender(),
        textConfig: app.textEngine.getConfig(),
        spots: app.spots,
        debugInfo: null // Skip debug for export
    };
    
    // Render to target canvas
    const originalCanvas = app.canvasManager.canvas;
    const originalCtx = app.canvasManager.ctx;
    
    app.canvasManager.canvas = targetCanvas;
    app.canvasManager.ctx = ctx;
    app.canvasManager.render(renderData);
    
    // Restore original canvas
    app.canvasManager.canvas = originalCanvas;
    app.canvasManager.ctx = originalCtx;
    
    ctx.restore();
    console.log(`High-res export completed at ${scale}x resolution`);
};