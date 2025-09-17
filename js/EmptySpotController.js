/**
 * EmptySpotController.js - Handles empty spot controls and interactions
 * Extends SpotController for empty spot functionality (minimal controls)
 */

class EmptySpotController extends SpotController {
    constructor(app) {
        super(app);
        this.spotType = 'empty';
    }
    
    /**
     * Get default content for empty spots
     * @returns {Object} Default content object
     */
    getDefaultContent() {
        return {}; // Empty spots have no content
    }
    
    /**
     * Create controls for empty spots
     * @param {Spot} spot - Spot object
     * @param {HTMLElement} container - Container for controls
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement[]} Array of created control elements (empty for empty spots)
     */
    createControls(spot, container, context = 'sidebar') {
        // Empty spots don't have any specific controls
        // They only show the type selector and no padding controls
        
        // Could add a placeholder message
        const messageGroup = this.createControlGroup(context);
        messageGroup.innerHTML = `
            <p style="font-size: 12px; color: var(--chatooly-color-text-secondary, #999); text-align: center; margin: 20px 0;">
                This spot is empty. Select a different type to add content.
            </p>
        `;
        
        container.appendChild(messageGroup);
        return [messageGroup];
    }
}