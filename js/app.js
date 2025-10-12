/**
 * app.js - Main application controller
 * Ties together all components and handles UI interactions
 */

class EmployerBrandToolPOC {
    constructor() {
        // Core components
        this.canvasManager = new CanvasManager();
        this.textEngine = new MainTextController();
        this.gridDetector = new GridDetector(); // Phase 2: Unified grid detection
        this.debugController = null; // Will be initialized after DOM is ready
        
        // Layer Management System (NEW)
        this.layerManager = new LayerManager();

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

        // UI Manager
        this.uiManager = null; // Will be initialized after DOM is ready

        // Content Controllers - Object-oriented content management
        this.contentControllers = {
            'empty': new EmptyContentController(this),
            'text': new TextContentController(this),
            'image': new ImageContentController(this),
            'mask': new MaskContentController(this)
        };

        // Shuffler System
        this.shuffler = null; // Will be initialized after DOM is ready

        // Asset Management System
        this.backgroundImage = null; // Currently loaded background image
        this.backgroundVideo = null; // Currently loaded background video

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
            // Initialize UI Manager FIRST (other components depend on it)
            this.uiManager = new UIManager(this);

            // Initialize debug controller
            this.debugController = new DebugController(this);

            // Initialize shuffler system
            this.shuffler = new Shuffler(this);

            // Initialize Grid system (NEW - simple per-cell animations)
            this.grid = new Grid(this);

            // Set initial canvas size via Chatooly CDN
            this.initializeChatoolyCanvas();

            // Initialize MainTextController with canvas dimensions and default mode
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
            this.mainTextComponent.text = this.uiManager.elements.mainText.value;
            this.mainTextComponent.color = this.uiManager.elements.textColor.value;

            // Set initial text
            this.textEngine.setText(this.uiManager.elements.mainText.value);

            // Update line alignment controls for initial text
            this.uiManager.updateLineAlignmentControls();

            // Auto-detection is now permanently enabled
            this.autoDetectSpots = true;

            // Initial render
            this.render();

            // Test Grid system (NEW - build from existing data)
            if (this.grid) {
                this.grid.buildFromExisting();

                // Populate spots array from grid content cells
                this.spots = this.grid.getContentCells();
                this.uiManager.updateSpotsUI();

                // Update visual grid display
                this.uiManager.updateVisualGrid();
            }

            this.isInitialized = true;

        } catch (error) {
            console.error('❌ Failed to initialize POC:', error);
            if (this.uiManager && this.uiManager.showError) {
                this.uiManager.showError('Failed to initialize application. Please refresh and try again.');
            } else {
                alert('Failed to initialize application. Please refresh and try again.');
            }
        }
    }

    /**
     * Initialize Chatooly canvas dimensions
     * @private
     */
    initializeChatoolyCanvas() {
        const setCanvasSize = () => {
            if (window.Chatooly && window.Chatooly.canvasResizer) {
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
     * Handle text input changes
     * @private
     */
    onTextChanged() {
        const text = this.uiManager.elements.mainText.value;
        this.mainTextComponent.text = text;

        // Sync styling properties from MainTextComponent to MainTextController
        if (this.textEngine) {
            this.textEngine.updateConfig({
                textStyles: {
                    bold: this.mainTextComponent.fontWeight === 'bold',
                    italic: this.mainTextComponent.fontStyle === 'italic',
                    underline: this.mainTextComponent.underline,
                    highlight: this.mainTextComponent.highlight,
                    highlightColor: this.mainTextComponent.highlightColor
                }
            });
            this.textEngine.setText(text);
        }

        // IMPORTANT: Apply saved alignments immediately after text change but before updateLineAlignmentControls
        this.applySavedAlignments();

        // Update line alignment controls
        this.uiManager.updateLineAlignmentControls();

        // Save spots before clearing when text changes
        if (this.spots.length > 0) {
            this.saveSpotData();
        }

        // Clear spots when text changes
        this.spots = [];
        this.uiManager.updateSpotsUI();

        // Rebuild grid BEFORE rendering (NEW - keep grid synchronized)
        if (this.grid) {
            this.grid.buildFromExisting();

            // Sync spots array with grid content cells
            this.spots = this.grid.getContentCells();
            this.uiManager.updateSpotsUI();
        }

        // Render with updated grid
        this.render();

        // Update visual grid and animation controls after grid rebuild
        if (this.grid) {
            setTimeout(() => {
                this.uiManager.updateVisualGrid();
                this.uiManager.updateTextLineAnimations();
            }, 100); // Small delay to ensure grid is fully rebuilt
        }

        // Auto-detect spots after text changes (only if there's text content)
        if (this.uiManager.elements.mainText.value.trim()) {
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
                    // Update BOTH systems to keep them in sync
                    // 1. Update MainTextComponent (for rendering)
                    this.mainTextComponent.setLineAlignment(index, savedAlignment);

                    // 2. Update MainTextController (for grid detection and bounds)
                    if (this.textEngine) {
                        this.textEngine.setLineAlignment(index, savedAlignment);
                    }
                }
            }
        });
    }
    
    
    
    
    
    
    
    
    
    
    
    
    /**
     * Save current spot data for persistence
     * @private
     */
    saveSpotData() {
        const promises = this.spots.map(async (spot) => {
            if (spot.contentType === 'empty') return null;

            // Create base saved spot data
            const savedSpot = {
                // Position data for matching
                x: spot.x,
                y: spot.y,
                width: spot.width,
                height: spot.height,

                // Basic properties
                type: spot.contentType,
                opacity: spot.opacity,
                originalId: spot.id
            };

            // Handle content based on type
            if (spot.content) {
                if (spot.contentType === 'image' && spot.content.image) {
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
    }
    
    /**
     * Create saved spot data for a single spot
     * @param {Spot} spot - Spot to save
     * @returns {Object|null} Saved spot data or null if empty
     * @private
     */
    createSavedSpotData(spot) {
        if (spot.contentType === 'empty') return null;

        const savedSpot = {
            // Position data for matching
            x: spot.x,
            y: spot.y,
            width: spot.width,
            height: spot.height,

            // Basic properties
            type: spot.contentType,
            opacity: spot.opacity,
            originalId: spot.id
        };

        // Handle content based on type
        if (spot.content) {
            if (spot.contentType === 'image' && spot.content.image) {
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
            return;
        }
        
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
            }
        }
        
        // Phase 2: Place remaining saved spots in any available spots (starting from spot 1)
        const availableSpots = this.spots.filter(spot => spot.contentType === 'empty');
        for (let i = 0; i < availableSpots.length && remainingSavedSpots.length > 0; i++) {
            const newSpot = availableSpots[i];
            const savedSpot = remainingSavedSpots[0]; // Take first remaining saved spot

            this.restoreSpotToNewLocation(newSpot, savedSpot);
            remainingSavedSpots.shift(); // Remove from remaining
            restoredCount++;
        }

        // Phase 3: Move unfitted spots to waiting list (don't delete them!)
        if (remainingSavedSpots.length > 0) {
            this.waitingSpots = remainingSavedSpots;
        } else {
            // Clear waiting list if all spots were restored
            this.waitingSpots = [];
        }
    }
    
    /**
     * Restore a saved spot to a new spot location
     * @param {Spot} newSpot - New spot to restore to
     * @param {Object} savedSpot - Saved spot data
     * @private
     */
    restoreSpotToNewLocation(newSpot, savedSpot) {
        newSpot.setContentType(savedSpot.type);
        
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
            this.detectSpots(callback);
        }, delay);
    }

    /**
     * Detect/rebuild spots - now simplified to use Grid system
     * @param {Function} callback - Optional callback to run after detection completes
     */
    detectSpots(callback = null) {
        try {
            // Rebuild grid (this handles everything: detection, building, content preservation)
            if (this.grid) {
                this.grid.buildFromExisting();

                // Extract content cells as spots for UI compatibility
                this.spots = this.grid.getContentCells();
            }

            // Update UI
            this.uiManager.updateSpotsUI();
            this.uiManager.updateVisualGrid();
            this.render();

            // Call the callback if provided
            if (callback && typeof callback === 'function') {
                callback();
            }

        } catch (error) {
            console.error('❌ Grid rebuild failed:', error);
            this.uiManager.showError('Grid rebuild failed. Please try again.');

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
     * Handle canvas clicks
     * @param {MouseEvent} event - Click event
     * @private
     */
    onCanvasClick(event) {
        const canvasCoords = this.canvasManager.screenToCanvas(event.clientX, event.clientY);
        const clickedSpot = this.canvasManager.findSpotAt(canvasCoords.x, canvasCoords.y, this.spots);

        // Future: Could highlight spot or show properties
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

            // Unified grid rendering (animations applied when present)
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
     * Render content using unified grid architecture
     * Renders all grid cells (MainTextCell and ContentCell) with animation transforms
     * @private
     */
    _renderWithAnimations() {
        const ctx = this.canvasManager.ctx;
        const debugOptions = this.debugController ? this.debugController.getDebugOptions() : {};

        
        // Always use layer-based rendering
        this.renderByLayers(ctx, debugOptions);
    }

    /**
     * Render cells by layers (NEW layer-based rendering)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} debugOptions - Debug options
     * @private
     */
    renderByLayers(ctx, debugOptions) {
        const sortedLayers = this.layerManager.getSortedLayers();
        
        sortedLayers.forEach(layer => {
            if (!layer.visible) return;
            
            const layerCells = layer.getCells();
            layerCells.forEach(cell => {
                this.renderCellWithAnimations(ctx, cell, debugOptions);
            });
        });
    }

    /**
     * Render a single cell with animation transforms
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {GridCell} cell - Cell to render
     * @param {Object} debugOptions - Debug options
     * @private
     */
    renderCellWithAnimations(ctx, cell, debugOptions) {
        if (!cell) return;
        
        ctx.save();
        
        // Apply animation transforms
        const offset = cell.currentOffset || { x: 0, y: 0 };
        const centerX = cell.bounds.x + cell.bounds.width / 2;
        const centerY = cell.bounds.y + cell.bounds.height / 2;
        
        ctx.translate(centerX, centerY);
        ctx.translate(offset.x || 0, offset.y || 0);
        if (offset.rotation) ctx.rotate(offset.rotation);
        if (offset.scale) ctx.scale(offset.scale, offset.scale);
        ctx.translate(-centerX, -centerY);
        
        // Render based on cell type
        if (cell.type === 'main-text') {
            CellRenderer.renderTextCell(ctx, cell, debugOptions);
            
            // Draw debug outline if enabled
            if (debugOptions.showSpotOutlines) {
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.strokeRect(cell.bounds.x, cell.bounds.y, cell.bounds.width, cell.bounds.height);
            }
            
            // Draw debug number if enabled
            if (debugOptions.showSpotNumbers && cell.id) {
                const center = cell.getCenter();
                const radius = 15;
                
                // Circle background
                ctx.fillStyle = '#e5e5e5';
                ctx.beginPath();
                ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Number text
                ctx.fillStyle = '#121212';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(cell.id.toString(), center.x, center.y);
            }
        } else if (cell instanceof ContentCell) {
            const renderOptions = {
                showOutlines: debugOptions.showSpotOutlines,
                showNumbers: debugOptions.showSpotNumbers,
                backgroundImage: this.canvasManager.backgroundImage
            };
            CellRenderer.render(ctx, cell, renderOptions);
        }
        
        ctx.restore();
    }

    /**
     * Start animation render loop
     * Continuously renders canvas while animations are playing
     * @private
     */
    _startAnimationLoop() {
        if (this._animationLoopId) {
            return;
        }

        this._animationStartTime = performance.now();
        this._animationFrameCount = 0;

        const animate = () => {
            // Check if any animations are still playing
            const hasPlayingAnimations = this.grid &&
                this.grid.getAnimatedCells().some(cell =>
                    cell.animation && cell.animation.isPlaying
                );

            // Check if any videos need frame updates
            const hasVideos = this.grid &&
                this.grid.getAllCells().some(cell =>
                    cell.content && cell.content.media instanceof HTMLVideoElement
                );

            // Check if background video needs frame updates
            const hasBackgroundVideo = this.canvasManager.backgroundVideo instanceof HTMLVideoElement;

            if (hasPlayingAnimations || hasVideos || hasBackgroundVideo) {
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
                // No more playing animations or videos, stop loop
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
        // Safety check: UIManager must be initialized
        if (!this.uiManager || !this.uiManager.elements) {
            return;
        }

        // Update text content
        this.mainTextComponent.text = this.uiManager.elements.mainText.value;
        
        // Update container size and position
        this.mainTextComponent.setContainer(
            0, 0,
            this.canvasManager.canvas.width,
            this.canvasManager.canvas.height
        );
        
        // Update color
        this.mainTextComponent.color = this.uiManager.elements.textColor.value;
        
        // Update padding
        const paddingH = parseInt(this.uiManager.elements.paddingHorizontal.value);
        const paddingV = parseInt(this.uiManager.elements.paddingVertical.value);
        this.mainTextComponent.setPaddingIndividual({
            left: paddingH,
            right: paddingH,
            top: paddingV,
            bottom: paddingV
        });
        
        // Update text mode (auto-size vs manual)
        if (this.uiManager.elements.fillCanvasMode.checked) {
            this.mainTextComponent.fontSize = 'auto';
        } else {
            this.mainTextComponent.fontSize = parseInt(this.uiManager.elements.fontSize.value);
        }
        
        // Update line spacing
        this.mainTextComponent.lineSpacing = parseInt(this.uiManager.elements.lineSpacing.value);
        
        // Update wrapping
        this.mainTextComponent.wrapText = this.uiManager.elements.enableWrap.checked;
        
        // Update positioning for manual mode
        if (this.uiManager.elements.manualMode.checked) {
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
     * Get current application state for debugging
     * @returns {Object} Current state
     */
    getState() {
        return {
            textContent: this.uiManager.elements.mainText.value,
            textConfig: this.textEngine.getConfig(),
            spots: this.spots.map(spot => ({
                id: spot.id,
                type: spot.contentType,
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
        const paddingH = Math.round(parseInt(this.uiManager.elements.paddingHorizontal.value) * scaleX);
        const paddingV = Math.round(parseInt(this.uiManager.elements.paddingVertical.value) * scaleY);
        this.uiManager.elements.paddingHorizontal.value = paddingH;
        this.uiManager.elements.paddingVertical.value = paddingV;
        this.uiManager.elements.paddingHorizontalValue.textContent = paddingH + 'px';
        this.uiManager.elements.paddingVerticalValue.textContent = paddingV + 'px';

        // Update tracking
        this.previousCanvasSize = { width: newWidth, height: newHeight };

        // Re-render everything
        this.render();

        // Trigger spot detection if auto-detect is enabled
        if (this.autoDetectSpots && this.uiManager.elements.mainText.value.trim()) {
            this.autoDetectSpotsDebounced(300);
        }
    }

    /**
     * Run a test to verify everything is working
     * @returns {Object} Test results
     */
    runTest() {
        try {
            // Set test text
            this.uiManager.elements.mainText.value = 'TEST\nSPOT\nDETECTION';
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
     * Canvas click handler removed - spot editing now handled through unified sidebar
     */
    
    
    
    
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
        this.canvasManager.setBackgroundImage(null);
        this.backgroundImage = null;
        this.render();
    }
    
    /**
     * Set background video
     * @param {HTMLVideoElement} video - Video element
     */
    setBackgroundVideo(video) {
        this.canvasManager.setBackgroundVideo(video);
        this.backgroundVideo = video;
        this.backgroundImage = null; // Clear image when setting video
        this.render();
        
        // Start animation loop for video frame updates
        this._startAnimationLoop();
    }
    
    /**
     * Clear background video
     */
    clearBackgroundVideo() {
        this.canvasManager.setBackgroundVideo(null);
        this.backgroundVideo = null;
        this.render();
    }
    
    /**
     * Set background fit mode
     * @param {string} mode - 'fit', 'fill', or 'stretch'
     */
    setBackgroundFitMode(mode) {
        this.canvasManager.setBackgroundFitMode(mode);
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


}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Create global app instance
        window.employerBrandTool = new EmployerBrandToolPOC();

        // Add to global scope for debugging
        window.app = window.employerBrandTool;

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
};