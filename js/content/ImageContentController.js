/**
 * ImageContentController.js - Handles image cell controls and interactions
 * Extends ContentController for image-specific functionality
 */

class ImageContentController extends ContentController {
    constructor(app) {
        super(app);
        this.contentType = 'image';
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
            padding: 1,
            positionH: 'center',
            positionV: 'middle'
        };
    }
    
    /**
     * Create controls for image spots
     * @param {ContentCell} cell - Spot object
     * @param {HTMLElement} container - Container for controls
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement[]} Array of created control elements
     */
    createControls(cell, container, context = 'sidebar') {
        // Initialize content if needed
        this.initializeContent(cell);

        const controls = [];

        // Image upload
        const imageGroup = this.createImageUploadControl(cell, context);
        container.appendChild(imageGroup);
        controls.push(imageGroup);

        // Position control (always show)
        const positionGroup = this.createPositionControl(cell, context);
        container.appendChild(positionGroup);
        controls.push(positionGroup);

        // If image is loaded, show transform controls
        if (cell.content?.image) {
            // Scale control
            const scaleGroup = this.createScaleControl(cell, context);
            container.appendChild(scaleGroup);
            controls.push(scaleGroup);

            // Rotation control
            const rotationGroup = this.createRotationControl(cell, context);
            container.appendChild(rotationGroup);
            controls.push(rotationGroup);
        }

        return controls;
    }
    
    /**
     * Create image upload control
     * @param {ContentCell} cell - Spot object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Image upload control element
     * @private
     */
    createImageUploadControl(cell, context) {
        const imageGroup = this.createControlGroup(context);
        imageGroup.innerHTML = `
            <label>Image</label>
            <input type="file" class="spot-image-input" accept="image/*">
        `;

        const imageInput = imageGroup.querySelector('.spot-image-input');
        this.addControlListener(imageInput, 'change', (e) => {
            this.handleImageUpload(cell, e);
        });

        return imageGroup;
    }
    
    /**
     * Create position alignment control
     * @param {ContentCell} cell - Cell object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Position control element
     * @private
     */
    createPositionControl(cell, context) {
        const positionGroup = this.createControlGroup(context);
        positionGroup.innerHTML = `<label>Position in Cell</label>`;

        const positionGrid = document.createElement('div');
        positionGrid.className = 'positioning-grid';

        const positions = [
            { h: 'left', v: 'top', icon: '↖', title: 'Top Left' },
            { h: 'center', v: 'top', icon: '↑', title: 'Top Center' },
            { h: 'right', v: 'top', icon: '↗', title: 'Top Right' },
            { h: 'left', v: 'middle', icon: '←', title: 'Middle Left' },
            { h: 'center', v: 'middle', icon: '•', title: 'Center' },
            { h: 'right', v: 'middle', icon: '→', title: 'Middle Right' },
            { h: 'left', v: 'bottom', icon: '↙', title: 'Bottom Left' },
            { h: 'center', v: 'bottom', icon: '↓', title: 'Bottom Center' },
            { h: 'right', v: 'bottom', icon: '↘', title: 'Bottom Right' }
        ];

        positions.forEach(pos => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'pos-btn';
            btn.textContent = pos.icon;
            btn.title = pos.title;

            const currentPosH = cell.content.positionH || 'center';
            const currentPosV = cell.content.positionV || 'middle';

            if (pos.h === currentPosH && pos.v === currentPosV) {
                btn.classList.add('active');
            }

            this.addControlListener(btn, 'click', () => {
                positionGrid.querySelectorAll('.pos-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateContent(cell, {
                    positionH: pos.h,
                    positionV: pos.v
                }, true);
            });

            positionGrid.appendChild(btn);
        });

        positionGroup.appendChild(positionGrid);
        return positionGroup;
    }
    
    /**
     * Create scale control
     * @param {ContentCell} cell - Cell object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Scale control element
     * @private
     */
    createScaleControl(cell, context) {
        const scaleGroup = this.createControlGroup(context);
        scaleGroup.innerHTML = `
            <label>Scale: <span class="scale-value">${(cell.content.scale || 1).toFixed(2)}</span></label>
            <input type="range" class="spot-scale" min="0.1" max="3" step="0.1" value="${cell.content.scale || 1}">
        `;

        const scaleSlider = scaleGroup.querySelector('.spot-scale');
        const scaleValue = scaleGroup.querySelector('.scale-value');

        this.addControlListener(scaleSlider, 'input', () => {
            const value = parseFloat(scaleSlider.value);
            scaleValue.textContent = value.toFixed(2);
            this.updateContent(cell, { scale: value }, true);
        });

        return scaleGroup;
    }
    
    /**
     * Create rotation control
     * @param {ContentCell} cell - Cell object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Rotation control element
     * @private
     */
    createRotationControl(cell, context) {
        const rotationGroup = this.createControlGroup(context);
        rotationGroup.innerHTML = `
            <label>Rotation: <span class="rotation-value">${cell.content.rotation || 0}°</span></label>
            <input type="range" class="spot-rotation" min="0" max="360" step="5" value="${cell.content.rotation || 0}">
        `;

        const rotationSlider = rotationGroup.querySelector('.spot-rotation');
        const rotationValue = rotationGroup.querySelector('.rotation-value');

        this.addControlListener(rotationSlider, 'input', () => {
            const value = parseInt(rotationSlider.value);
            rotationValue.textContent = value + '°';
            this.updateContent(cell, { rotation: value }, true);
        });

        return rotationGroup;
    }
    
    /**
     * Handle image file upload
     * @param {ContentCell} cell - Cell object
     * @param {Event} event - File input change event
     * @private
     */
    handleImageUpload(cell, event) {
        const file = event.target.files[0];
        if (!file || !file.type.startsWith('image/')) {
            console.warn('Please select a valid image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.updateContent(cell, {
                    image: img,
                    scale: 1,
                    rotation: 0
                });

                // Recreate controls to show scale/rotation
                const container = event.target.closest('.spot-controls') || event.target.closest('.spot-popup-body');
                if (container) {
                    // Find the parent cell item to recreate controls
                    this.app.uiManager?.updateSpotsUI();
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}