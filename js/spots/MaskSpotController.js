/**
 * MaskSpotController.js - Handles mask spot controls and interactions
 * Extends SpotController for mask-specific functionality
 */

class MaskSpotController extends SpotController {
    constructor(app) {
        super(app);
        this.spotType = 'mask';
    }
    
    /**
     * Get default content for mask spots
     * @returns {Object} Default content object
     */
    getDefaultContent() {
        return {
            opacity: 0.5,
            padding: 0
        };
    }
    
    /**
     * Create controls for mask spots
     * @param {Spot} spot - Spot object
     * @param {HTMLElement} container - Container for controls
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement[]} Array of created control elements
     */
    createControls(spot, container, context = 'sidebar') {
        // Initialize content if needed
        this.initializeContent(spot);
        
        const controls = [];
        
        // Mask opacity control
        const opacityGroup = this.createOpacityControl(spot, context);
        container.appendChild(opacityGroup);
        controls.push(opacityGroup);
        
        return controls;
    }
    
    /**
     * Create opacity control
     * @param {Spot} spot - Spot object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Opacity control element
     * @private
     */
    createOpacityControl(spot, context) {
        const opacityGroup = this.createControlGroup(context);
        
        // Ensure spot has opacity property
        if (typeof spot.opacity === 'undefined') {
            spot.setOpacity(spot.content.opacity || 0.5);
        }
        
        opacityGroup.innerHTML = `
            <label>Mask Opacity: <span class="opacity-value">${Math.round((spot.opacity || 0.5) * 100)}%</span></label>
            <input type="range" class="spot-opacity" min="0" max="100" step="5" value="${Math.round((spot.opacity || 0.5) * 100)}">
            <p style="font-size: 11px; color: var(--chatooly-color-text-secondary, #999); margin-top: 8px;">
                This spot will reveal the background image through a transparent window.
            </p>
        `;
        
        const opacitySlider = opacityGroup.querySelector('.spot-opacity');
        const opacityValue = opacityGroup.querySelector('.opacity-value');
        
        this.addControlListener(opacitySlider, 'input', () => {
            const value = parseInt(opacitySlider.value);
            const normalizedOpacity = value / 100;
            
            opacityValue.textContent = value + '%';
            spot.setOpacity(normalizedOpacity);
            
            // Update content for consistency
            this.updateContent(spot, { opacity: normalizedOpacity }, true);
        });
        
        return opacityGroup;
    }
}