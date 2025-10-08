/**
 * MaskContentController.js - Handles mask cell controls and interactions
 * Extends ContentController for mask-specific functionality
 */

class MaskContentController extends ContentController {
    constructor(app) {
        super(app);
        this.contentType = 'mask';
    }
    
    /**
     * Get default content for mask cells
     * @returns {Object} Default content object
     */
    getDefaultContent() {
        return {
            opacity: 0.5,
            padding: 0
        };
    }
    
    /**
     * Create controls for mask cells
     * @param {ContentCell} cell - Cell object
     * @param {HTMLElement} container - Container for controls
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement[]} Array of created control elements
     */
    createControls(cell, container, context = 'sidebar') {
        // Initialize content if needed
        this.initializeContent(cell);
        
        const controls = [];
        
        // Mask opacity control
        const opacityGroup = this.createOpacityControl(cell, context);
        container.appendChild(opacityGroup);
        controls.push(opacityGroup);

        return controls;
    }
    
    /**
     * Create opacity control
     * @param {ContentCell} cell - Cell object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Opacity control element
     * @private
     */
    createOpacityControl(cell, context) {
        const opacityGroup = this.createControlGroup(context);
        
        // Ensure cell has opacity property
        if (typeof cell.opacity === 'undefined') {
            cell.setOpacity(cell.content.opacity || 0.5);
        }
        
        opacityGroup.innerHTML = `
            <label>Mask Opacity: <span class="opacity-value">${Math.round((cell.opacity || 0.5) * 100)}%</span></label>
            <input type="range" class="spot-opacity" min="0" max="100" step="5" value="${Math.round((cell.opacity || 0.5) * 100)}">
            <p style="font-size: 11px; color: var(--chatooly-color-text-secondary, #999); margin-top: 8px;">
                This cell will reveal the background image through a transparent window.
            </p>
        `;
        
        const opacitySlider = opacityGroup.querySelector('.spot-opacity');
        const opacityValue = opacityGroup.querySelector('.opacity-value');
        
        this.addControlListener(opacitySlider, 'input', () => {
            const value = parseInt(opacitySlider.value);
            const normalizedOpacity = value / 100;

            opacityValue.textContent = value + '%';
            cell.setOpacity(normalizedOpacity);

            // Update content for consistency
            this.updateContent(cell, { opacity: normalizedOpacity }, true);
        });
        
        return opacityGroup;
    }
}