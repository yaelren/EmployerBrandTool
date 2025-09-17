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
        
        // UI elements
        this.elements = {};
        
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
            
            // Set initial text
            this.textEngine.setText(this.elements.mainText.value);
            
            // Update line alignment controls for initial text
            this.updateLineAlignmentControls();
            
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
            minSpotSize: 'minSpotSize',
            findSpots: 'findSpots',
            showSpotOutlines: 'showSpotOutlines',
            showSpotNumbers: 'showSpotNumbers',
            showTextBounds: 'showTextBounds',
            showPadding: 'showPadding',
            spotCount: 'spotCount',
            spotsList: 'spotsList'
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
        // Text input changes
        this.elements.mainText.addEventListener('input', () => {
            this.onTextChanged();
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
        
        
        // Minimum spot size changes
        this.elements.minSpotSize.addEventListener('input', () => {
            const minSize = parseInt(this.elements.minSpotSize.value);
            this.spotDetector.setMinSpotSize(minSize);
        });
        
        // Find spots button
        this.elements.findSpots.addEventListener('click', () => {
            this.detectSpots();
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
        
        // Canvas click for spot interaction (future feature)
        this.canvasManager.canvas.addEventListener('click', (event) => {
            this.onCanvasClick(event);
        });
    }
    
    /**
     * Handle text input changes
     * @private
     */
    onTextChanged() {
        const text = this.elements.mainText.value;
        this.textEngine.setText(text);
        
        // IMPORTANT: Apply saved alignments immediately after setText but before updateLineAlignmentControls
        this.applySavedAlignments();
        
        // Update line alignment controls
        this.updateLineAlignmentControls();
        
        // Clear spots when text changes
        this.spots = [];
        this.updateSpotsUI();
        
        this.render();
    }
    
    /**
     * Apply saved alignments to current text lines
     * @private
     */
    applySavedAlignments() {
        const textBounds = this.textEngine.getTextBounds();
        
        textBounds.forEach((bounds, index) => {
            if (bounds.text.trim()) {
                const lineKey = bounds.text.trim();
                const savedAlignment = this.savedLineAlignments[lineKey];
                
                if (savedAlignment) {
                    console.log(`🔄 Restoring alignment for "${lineKey}": ${savedAlignment}`);
                    this.textEngine.setLineAlignment(index, savedAlignment);
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
        const textBounds = this.textEngine.getTextBounds();
        
        // Clear existing controls
        container.innerHTML = '';
        
        // Create alignment control for each line
        textBounds.forEach((bounds, index) => {
            if (!bounds.text.trim()) return; // Skip empty lines
            
            // Use the current alignment from bounds (already applied by applySavedAlignments)
            const currentAlignment = bounds.alignment;
            
            const lineControl = document.createElement('div');
            lineControl.className = 'line-alignment-control';
            lineControl.innerHTML = `
                <label>Line ${index + 1}: "${bounds.text}"</label>
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
        // Get the text bounds to identify the line
        const textBounds = this.textEngine.getTextBounds();
        const lineBounds = textBounds[lineIndex];
        
        if (lineBounds && lineBounds.text.trim()) {
            // Save the alignment preference for this line content
            const lineKey = lineBounds.text.trim();
            this.savedLineAlignments[lineKey] = alignment;
            
            console.log(`💾 Saved alignment for "${lineKey}": ${alignment}`);
        }
        
        this.textEngine.setLineAlignment(lineIndex, alignment);
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
     * Detect open spots using the algorithm
     */
    detectSpots() {
        try {
            console.log('🔍 Starting spot detection...');
            
            // Enable debugging for detection
            this.spotDetector.setDebugging(true);
            
            // Get current text bounds
            const textBounds = this.textEngine.getTextBounds();
            const canvas = this.canvasManager.getDimensions();
            const config = this.textEngine.getConfig();
            
            // Prepare padding info for spot detector
            const padding = {
                top: config.paddingTop,
                bottom: config.paddingBottom,
                left: config.paddingLeft,
                right: config.paddingRight
            };
            
            // Run detection algorithm
            const startTime = performance.now();
            this.spots = this.spotDetector.detect(canvas, textBounds, padding);
            const endTime = performance.now();
            
            // Log results
            const detectionTime = Math.round(endTime - startTime);
            console.log(`✅ Found ${this.spots.length} spots in ${detectionTime}ms`);
            
            // Update UI
            this.updateSpotsUI();
            this.render();
            
            // Log debug info
            if (this.spotDetector.debugging) {
                console.log('Debug info:', this.spotDetector.getDebugInfo());
            }
            
        } catch (error) {
            console.error('❌ Spot detection failed:', error);
            this.showError('Spot detection failed. Please try again.');
        }
    }
    
    /**
     * Update the spots list in the UI
     * @private
     */
    updateSpotsUI() {
        // Update spot count
        this.elements.spotCount.textContent = this.spots.length.toString();
        
        // Clear existing spots list
        this.elements.spotsList.innerHTML = '';
        
        // Add each spot to the UI
        this.spots.forEach(spot => {
            const spotItem = this.createSpotItemElement(spot);
            this.elements.spotsList.appendChild(spotItem);
        });
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
        
        // Spot number
        const number = document.createElement('span');
        number.className = 'spot-number';
        number.textContent = spot.id.toString();
        
        // Type selector
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
        
        // Handle type changes
        typeSelect.addEventListener('change', () => {
            this.onSpotTypeChanged(spot.id, typeSelect.value);
        });
        
        // Size display
        const size = document.createElement('span');
        size.className = 'spot-size';
        size.textContent = `${Math.round(spot.width)}×${Math.round(spot.height)}`;
        
        // Assemble item
        item.appendChild(number);
        item.appendChild(typeSelect);
        item.appendChild(size);
        
        return item;
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
            // Prepare render data
            const renderData = {
                textLines: this.textEngine.getLinesForRender(),
                textConfig: this.textEngine.getConfig(),
                spots: this.spots,
                debugInfo: this.spotDetector.debugging ? this.getDebugDisplayInfo() : null
            };
            
            // Render everything
            this.canvasManager.render(renderData);
            
        } catch (error) {
            console.error('❌ Render failed:', error);
        }
    }
    
    /**
     * Get debug information for display
     * @returns {Object} Debug info for canvas display
     * @private
     */
    getDebugDisplayInfo() {
        const debugInfo = this.spotDetector.getDebugInfo();
        const textStats = this.textEngine.getStatistics();
        
        return {
            detectionTime: debugInfo.detectionTime,
            spotsFound: this.spots.length,
            textLines: textStats.totalLines
        };
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