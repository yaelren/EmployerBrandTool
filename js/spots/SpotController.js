/**
 * SpotController.js - Base class for spot control management
 * Provides common functionality for all spot types
 */

class SpotController {
    constructor(app) {
        this.app = app;
        this.spotType = 'base';
    }
    
    /**
     * Create controls for this spot type
     * @param {Spot} spot - Spot object
     * @param {HTMLElement} container - Container for controls
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement[]} Array of created control elements
     */
    createControls(spot, container, context = 'sidebar') {
        throw new Error('createControls must be implemented by subclass');
    }
    
    /**
     * Create shared padding control
     * @param {Spot} spot - Spot object
     * @param {HTMLElement} container - Container for controls
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Created padding control element
     * @protected
     */
    createPaddingControl(spot, container, context = 'sidebar') {
        const paddingGroup = document.createElement('div');
        paddingGroup.className = context === 'popup' ? 'chatooly-control-group' : 'spot-control-section';
        paddingGroup.innerHTML = `
            <label>Padding: <span class="padding-value">${spot.content?.padding || 1}px</span></label>
            <input type="range" class="spot-padding" min="0" max="50" step="1" value="${spot.content?.padding || 1}">
        `;
        
        const paddingSlider = paddingGroup.querySelector('.spot-padding');
        this.addControlListener(paddingSlider, 'input', () => {
            const value = parseInt(paddingSlider.value);
            paddingGroup.querySelector('.padding-value').textContent = value + 'px';
            this.updateContent(spot, { padding: value }, true);
        });
        
        container.appendChild(paddingGroup);
        return paddingGroup;
    }
    
    /**
     * Create control group wrapper
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Control group element
     * @protected
     */
    createControlGroup(context = 'sidebar') {
        const group = document.createElement('div');
        group.className = context === 'popup' ? 'chatooly-control-group' : 'spot-control-section';
        return group;
    }
    
    /**
     * Add event listener with propagation prevention
     * @param {HTMLElement} element - Element to add listener to
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @protected
     */
    addControlListener(element, event, handler) {
        element.addEventListener(event, (e) => {
            e.stopPropagation(); // Prevent closing sidebar controls
            handler(e);
        });
    }
    
    /**
     * Initialize spot content with defaults
     * @param {Spot} spot - Spot object
     * @returns {Object} Initialized content object
     * @protected
     */
    initializeContent(spot) {
        if (!spot.content) {
            spot.content = this.getDefaultContent();
        }
        return spot.content;
    }
    
    /**
     * Get default content for this spot type
     * @returns {Object} Default content object
     * @protected
     */
    getDefaultContent() {
        return { padding: 1 };
    }
    
    /**
     * Handle spot content update
     * @param {Spot} spot - Spot object
     * @param {Object} updates - Content updates
     * @param {boolean} skipUIUpdate - Skip UI update for minor changes
     * @protected
     */
    updateContent(spot, updates, skipUIUpdate = false) {
        if (!spot.content) {
            spot.content = this.getDefaultContent();
        }
        Object.assign(spot.content, updates);
        this.app.render();
        
        // Only update spots UI if necessary (to prevent closing open controls)
        if (!skipUIUpdate) {
            this.app.updateSpotsUI();
        }
    }
}