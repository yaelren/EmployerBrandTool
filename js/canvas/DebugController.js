/**
 * DebugController.js - Manages all debug visualization and controls
 * Handles debug panel UI, keyboard shortcuts, and visualization options
 */

class DebugController {
    constructor(app) {
        this.app = app; // Reference to main app
        
        // Debug state
        this.debugOptions = {
            showSpotOutlines: true,
            showSpotNumbers: true,
            showTextBounds: false,
            showPadding: false
        };
        
        // UI element references
        this.elements = {};
        
        // Layer panel removed - no longer needed in debug panel
        
        // Initialize
        this.cacheElements();
        this.setupEventListeners();
        this.initializeState();
        // Layer panel initialization removed
    }
    
    /**
     * Cache UI element references
     * @private
     */
    cacheElements() {
        const elementIds = {
            toggleDebug: 'toggleDebug',
            debugContent: 'debugContent',
            showAllDebug: 'showAllDebug',
            hideAllDebug: 'hideAllDebug',
            showSpotOutlines: 'showSpotOutlines',
            showSpotNumbers: 'showSpotNumbers',
            showTextBounds: 'showTextBounds',
            showPadding: 'showPadding'
        };
        
        for (const [key, id] of Object.entries(elementIds)) {
            const element = document.getElementById(id);
            if (!element) {
                console.warn(`Debug element not found: ${id}`);
            }
            this.elements[key] = element;
        }
    }
    
    /**
     * Set up event listeners
     * @private
     */
    setupEventListeners() {
        // Debug panel toggle button
        if (this.elements.toggleDebug) {
            this.elements.toggleDebug.addEventListener('click', () => {
                this.toggleDebugPanel();
            });
        }
        
        // Quick action buttons
        if (this.elements.showAllDebug) {
            this.elements.showAllDebug.addEventListener('click', () => {
                this.showAllControls();
            });
        }
        
        if (this.elements.hideAllDebug) {
            this.elements.hideAllDebug.addEventListener('click', () => {
                this.hideAllControls();
            });
        }
        
        // Individual debug option checkboxes
        const debugCheckboxes = [
            'showSpotOutlines',
            'showSpotNumbers', 
            'showTextBounds',
            'showPadding'
        ];
        
        debugCheckboxes.forEach(id => {
            if (this.elements[id]) {
                this.elements[id].addEventListener('change', () => {
                    this.updateDebugOption(id, this.elements[id].checked);
                });
            }
        });
        
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcut(e));
    }
    
    /**
     * Initialize debug state from UI
     * @private
     */
    initializeState() {
        // Sync initial checkbox states
        if (this.elements.showSpotOutlines) {
            this.debugOptions.showSpotOutlines = this.elements.showSpotOutlines.checked;
        }
        if (this.elements.showSpotNumbers) {
            this.debugOptions.showSpotNumbers = this.elements.showSpotNumbers.checked;
        }
        if (this.elements.showTextBounds) {
            this.debugOptions.showTextBounds = this.elements.showTextBounds.checked;
        }
        if (this.elements.showPadding) {
            this.debugOptions.showPadding = this.elements.showPadding.checked;
        }
        
        // Apply initial state
        this.applyDebugOptions();
    }
    
    /**
     * Layer panel methods removed - no longer needed in debug panel
     */
    
    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     * @private
     */
    handleKeyboardShortcut(e) {
        // Don't trigger shortcuts when typing in inputs
        if (e.target.tagName === 'INPUT' || 
            e.target.tagName === 'TEXTAREA' || 
            e.target.tagName === 'SELECT') {
            return;
        }
        
        // Check for Ctrl/Cmd modifier
        const isCtrlOrCmd = e.ctrlKey || e.metaKey;
        
        // Cmd/Ctrl + D: Toggle all debug controls
        if (isCtrlOrCmd && e.code === 'KeyI') {
            e.preventDefault();
            this.toggleAllControls();
        }
    }
    
    /**
     * Toggle debug panel visibility
     */
    toggleDebugPanel() {
        if (this.elements.debugContent) {
            this.elements.debugContent.classList.toggle('show');
        }
    }
    
    /**
     * Toggle all debug controls on/off
     */
    toggleAllControls() {
        // Check if any control is currently enabled
        const anyEnabled = this.debugOptions.showSpotOutlines ||
                          this.debugOptions.showSpotNumbers ||
                          this.debugOptions.showTextBounds ||
                          this.debugOptions.showPadding;
        
        if (anyEnabled) {
            this.hideAllControls();
        } else {
            this.showAllControls();
        }
    }
    
    /**
     * Show all debug controls
     */
    showAllControls() {
        this.setAllCheckboxes(true);
    }
    
    /**
     * Hide all debug controls
     */
    hideAllControls() {
        this.setAllCheckboxes(false);
    }
    
    /**
     * Set all debug checkboxes to a specific state
     * @param {boolean} checked - State to set
     * @private
     */
    setAllCheckboxes(checked) {
        const checkboxIds = ['showSpotOutlines', 'showSpotNumbers', 'showTextBounds', 'showPadding'];
        
        checkboxIds.forEach(id => {
            if (this.elements[id]) {
                this.elements[id].checked = checked;
                this.debugOptions[id] = checked;
            }
        });
        
        this.applyDebugOptions();
    }
    
    /**
     * Update a single debug option
     * @param {string} option - Option name
     * @param {boolean} value - New value
     * @private
     */
    updateDebugOption(option, value) {
        this.debugOptions[option] = value;
        this.applyDebugOptions();
    }
    
    /**
     * Apply debug options to canvas manager and trigger render
     * @private
     */
    applyDebugOptions() {
        // Update canvas manager debug options
        if (this.app.canvasManager) {
            this.app.canvasManager.setDebugOptions(this.debugOptions);
        }
        
        // Trigger re-render
        if (this.app.render) {
            this.app.render();
        }
    }
    
    /**
     * Get current debug options
     * @returns {Object} Current debug options
     */
    getDebugOptions() {
        return { ...this.debugOptions };
    }
    
    /**
     * Set debug options programmatically
     * @param {Object} options - Debug options to set
     */
    setDebugOptions(options) {
        Object.assign(this.debugOptions, options);
        
        // Update UI checkboxes to match
        Object.keys(options).forEach(key => {
            if (this.elements[key]) {
                this.elements[key].checked = options[key];
            }
        });
        
        this.applyDebugOptions();
    }
    
    /**
     * Check if any debug option is enabled
     * @returns {boolean} True if any debug option is on
     */
    isAnyDebugEnabled() {
        return Object.values(this.debugOptions).some(value => value === true);
    }
    
    /**
     * Render debug overlays on the canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} components - Components to debug (mainTextComponent, spots, etc.)
     */
    renderDebugOverlays(ctx, components) {
        if (!this.isAnyDebugEnabled()) return;
        
        const { mainTextComponent, spots } = components;
        
        // Show text bounds
        if (this.debugOptions.showTextBounds && mainTextComponent) {
            this.renderTextBounds(ctx, mainTextComponent);
        }
        
        // Show padding areas
        if (this.debugOptions.showPadding && mainTextComponent) {
            this.renderPaddingAreas(ctx, mainTextComponent);
        }
        
        // Note: Spot outlines and numbers are handled by the Spot class itself
        // based on the debug options passed during their render() calls
    }
    
    /**
     * Render text bounds debug overlay
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {TextComponent} textComponent - Text component to debug
     * @private
     */
    renderTextBounds(ctx, textComponent) {
        ctx.save();
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        
        // Get text bounds from the component
        const textBounds = this.getTextBoundsFromComponent(ctx, textComponent);
        
        // Draw bounds for each line
        textBounds.forEach(bounds => {
            ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        });
        
        // Also draw container bounds in different color
        ctx.strokeStyle = '#0099ff';
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(
            textComponent.containerX + textComponent.paddingLeft,
            textComponent.containerY + textComponent.paddingTop,
            textComponent.getAvailableWidth(),
            textComponent.getAvailableHeight()
        );
        
        ctx.restore();
    }
    
    /**
     * Render padding areas debug overlay
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {TextComponent} textComponent - Text component to debug
     * @private
     */
    renderPaddingAreas(ctx, textComponent) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
        
        const containerX = textComponent.containerX;
        const containerY = textComponent.containerY;
        const containerWidth = textComponent.containerWidth;
        const containerHeight = textComponent.containerHeight;
        
        // Top padding
        ctx.fillRect(containerX, containerY, containerWidth, textComponent.paddingTop);
        // Bottom padding
        ctx.fillRect(containerX, containerY + containerHeight - textComponent.paddingBottom, 
                    containerWidth, textComponent.paddingBottom);
        // Left padding
        ctx.fillRect(containerX, containerY, textComponent.paddingLeft, containerHeight);
        // Right padding
        ctx.fillRect(containerX + containerWidth - textComponent.paddingRight, containerY, 
                    textComponent.paddingRight, containerHeight);
        
        ctx.restore();
    }
    
    /**
     * Get text bounds from the text engine (MainTextController)
     * @param {CanvasRenderingContext2D} ctx - Canvas context (unused, kept for compatibility)
     * @param {TextComponent} textComponent - Text component (unused, kept for compatibility)
     * @returns {Array} Array of text bounds
     * @private
     */
    getTextBoundsFromComponent(ctx, textComponent) {
        // Use MainTextController (textEngine) instead of MainTextComponent
        // because the grid system and actual rendering use MainTextController
        if (this.app.textEngine) {
            return this.app.textEngine.getTextBounds();
        }
        // Fallback to old component if textEngine not available
        return textComponent.getTextBounds(ctx);
    }

    /**
     * Export debug state for testing
     * @returns {Object} Debug state
     */
    exportState() {
        return {
            options: { ...this.debugOptions },
            panelVisible: this.elements.debugContent ? 
                          this.elements.debugContent.classList.contains('show') : false
        };
    }
}