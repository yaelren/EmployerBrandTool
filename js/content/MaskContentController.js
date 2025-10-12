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
        
        // Mask padding control (only control for masks)
        const paddingGroup = this.createPaddingControl(cell, context);
        container.appendChild(paddingGroup);
        controls.push(paddingGroup);

        return controls;
    }
    
    /**
     * Create padding control for masks (overrides base class to default to 0)
     * @param {ContentCell} cell - Cell object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Padding control element
     * @private
     */
    createPaddingControl(cell, context) {
        const paddingGroup = document.createElement('div');
        paddingGroup.className = context === 'popup' ? 'chatooly-control-group' : 'spot-control-section';
        paddingGroup.innerHTML = `
            <label>Padding: <span class="padding-value">${cell.content?.padding || 0}px</span></label>
            <input type="range" class="spot-padding" min="0" max="50" step="1" value="${cell.content?.padding || 0}">
            <p style="font-size: 11px; color: var(--chatooly-color-text-secondary, #999); margin-top: 8px;">
                This cell will reveal the background image through a transparent window.
            </p>
        `;

        const paddingSlider = paddingGroup.querySelector('.spot-padding');
        this.addControlListener(paddingSlider, 'input', () => {
            const value = parseInt(paddingSlider.value);
            paddingGroup.querySelector('.padding-value').textContent = value + 'px';
            this.updateContent(cell, { padding: value }, true);
        });

        return paddingGroup;
    }
}