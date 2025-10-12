/**
 * FillContentController.js - Handles fill content controls and interactions
 * Extends ContentController for fill content functionality
 */

class FillContentController extends ContentController {
    constructor(app) {
        super(app);
        this.contentType = 'fill';
    }

    /**
     * Get default content for fill cells
     * @returns {Object} Default content object
     */
    getDefaultContent() {
        return {
            useGlobalBackground: true,  // Default: use global background color
            customColor: null,          // Optional override
            padding: 0                  // No padding for solid fills
        };
    }

    /**
     * Create controls for fill cells
     * @param {ContentCell} cell - ContentCell object
     * @param {HTMLElement} container - Container for controls
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement[]} Array of created control elements
     */
    createControls(cell, container, context = 'sidebar') {
        const controls = [];
        
        // Initialize content if needed
        this.initializeContent(cell);

        // Background Color Selection
        const backgroundGroup = this.createControlGroup(context);
        backgroundGroup.innerHTML = `
            <label>Background Color:</label>
            <label>
                <input type="radio" name="fillBackgroundType" value="global" ${cell.content.useGlobalBackground ? 'checked' : ''}>
                Use global background color
            </label>
            <label>
                <input type="radio" name="fillBackgroundType" value="custom" ${!cell.content.useGlobalBackground ? 'checked' : ''}>
                Custom color
            </label>
        `;

        // Custom Color Picker (shown when custom is selected)
        const colorGroup = this.createControlGroup(context);
        colorGroup.innerHTML = `
            <label for="fillCustomColor">Custom Color:</label>
            <input type="color" id="fillCustomColor" value="${cell.content.customColor || '#ffffff'}" 
                   style="display: ${!cell.content.useGlobalBackground ? 'block' : 'none'}">
        `;

        // Add event listeners
        const globalRadio = backgroundGroup.querySelector('input[value="global"]');
        const customRadio = backgroundGroup.querySelector('input[value="custom"]');
        const colorPicker = colorGroup.querySelector('#fillCustomColor');

        globalRadio.addEventListener('change', () => {
            cell.setUseGlobalBackground(true);
            colorPicker.style.display = 'none';
            this.app.render();
            this.app.uiManager?.updateSpotsUI();
        });

        customRadio.addEventListener('change', () => {
            cell.setUseGlobalBackground(false);
            colorPicker.style.display = 'block';
            if (!cell.content.customColor) {
                // Set default color to current global background color
                const globalColor = this.app.canvasManager?.backgroundManager?.backgroundColor || '#ffffff';
                cell.setCustomColor(globalColor);
                colorPicker.value = globalColor;
            }
            this.app.render();
            this.app.uiManager?.updateSpotsUI();
        });

        colorPicker.addEventListener('input', () => {
            cell.setCustomColor(colorPicker.value);
            this.app.render();
            this.app.uiManager?.updateSpotsUI();
        });

        container.appendChild(backgroundGroup);
        container.appendChild(colorGroup);
        
        controls.push(backgroundGroup, colorGroup);
        return controls;
    }
}
