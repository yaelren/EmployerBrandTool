/**
 * ImageSpotController.js - Handles image spot controls and interactions
 * Extends SpotController for image-specific functionality
 */

class ImageSpotController extends SpotController {
    constructor(app) {
        super(app);
        this.spotType = 'image';
    }
    
    /**
     * Get default content for image spots
     * @returns {Object} Default content object
     */
    getDefaultContent() {
        return {
            image: null,
            scale: 1,
            rotation: 0,
            padding: 1
        };
    }
    
    /**
     * Create controls for image spots
     * @param {Spot} spot - Spot object
     * @param {HTMLElement} container - Container for controls
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement[]} Array of created control elements
     */
    createControls(spot, container, context = 'sidebar') {
        // Initialize content if needed
        this.initializeContent(spot);
        
        const controls = [];
        
        // Image upload
        const imageGroup = this.createImageUploadControl(spot, context);
        container.appendChild(imageGroup);
        controls.push(imageGroup);
        
        // If image is loaded, show transform controls
        if (spot.content?.image) {
            // Scale control
            const scaleGroup = this.createScaleControl(spot, context);
            container.appendChild(scaleGroup);
            controls.push(scaleGroup);
            
            // Rotation control
            const rotationGroup = this.createRotationControl(spot, context);
            container.appendChild(rotationGroup);
            controls.push(rotationGroup);
        }
        
        return controls;
    }
    
    /**
     * Create image upload control
     * @param {Spot} spot - Spot object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Image upload control element
     * @private
     */
    createImageUploadControl(spot, context) {
        const imageGroup = this.createControlGroup(context);
        imageGroup.innerHTML = `
            <label>Image</label>
            <input type="file" class="spot-image-input" accept="image/*">
        `;
        
        const imageInput = imageGroup.querySelector('.spot-image-input');
        this.addControlListener(imageInput, 'change', (e) => {
            this.handleImageUpload(spot, e);
        });
        
        return imageGroup;
    }
    
    /**
     * Create scale control
     * @param {Spot} spot - Spot object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Scale control element
     * @private
     */
    createScaleControl(spot, context) {
        const scaleGroup = this.createControlGroup(context);
        scaleGroup.innerHTML = `
            <label>Scale: <span class="scale-value">${(spot.content.scale || 1).toFixed(2)}</span></label>
            <input type="range" class="spot-scale" min="0.1" max="3" step="0.1" value="${spot.content.scale || 1}">
        `;
        
        const scaleSlider = scaleGroup.querySelector('.spot-scale');
        const scaleValue = scaleGroup.querySelector('.scale-value');
        
        this.addControlListener(scaleSlider, 'input', () => {
            const value = parseFloat(scaleSlider.value);
            scaleValue.textContent = value.toFixed(2);
            this.updateContent(spot, { scale: value }, true);
        });
        
        return scaleGroup;
    }
    
    /**
     * Create rotation control
     * @param {Spot} spot - Spot object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Rotation control element
     * @private
     */
    createRotationControl(spot, context) {
        const rotationGroup = this.createControlGroup(context);
        rotationGroup.innerHTML = `
            <label>Rotation: <span class="rotation-value">${spot.content.rotation || 0}°</span></label>
            <input type="range" class="spot-rotation" min="0" max="360" step="5" value="${spot.content.rotation || 0}">
        `;
        
        const rotationSlider = rotationGroup.querySelector('.spot-rotation');
        const rotationValue = rotationGroup.querySelector('.rotation-value');
        
        this.addControlListener(rotationSlider, 'input', () => {
            const value = parseInt(rotationSlider.value);
            rotationValue.textContent = value + '°';
            this.updateContent(spot, { rotation: value }, true);
        });
        
        return rotationGroup;
    }
    
    /**
     * Handle image file upload
     * @param {Spot} spot - Spot object
     * @param {Event} event - File input change event
     * @private
     */
    handleImageUpload(spot, event) {
        const file = event.target.files[0];
        if (!file || !file.type.startsWith('image/')) {
            console.warn('Please select a valid image file');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.updateContent(spot, {
                    image: img,
                    scale: 1,
                    rotation: 0
                });
                
                // Recreate controls to show scale/rotation
                const container = event.target.closest('.spot-controls') || event.target.closest('.spot-popup-body');
                if (container) {
                    // Find the parent spot item to recreate controls
                    this.app.updateSpotsUI();
                }
                
                console.log(`📸 Image loaded for spot ${spot.id}: ${img.width}x${img.height}`);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}