/**
 * TextSpotController.js - Handles text spot controls and interactions
 * Extends SpotController for text-specific functionality
 */

class TextSpotController extends SpotController {
    constructor(app) {
        super(app);
        this.spotType = 'text';
    }
    
    /**
     * Get default content for text spots
     * @returns {Object} Default content object
     */
    getDefaultContent() {
        return {
            text: '',
            color: '#000000',
            textAlign: 'center',
            styles: {},
            fontSize: 'auto',
            fontFamily: '"Wix Madefor Display", Arial, sans-serif',
            padding: 1,
            highlightColor: '#ffff00'
        };
    }
    
    /**
     * Create controls for text spots
     * @param {Spot} spot - Spot object
     * @param {HTMLElement} container - Container for controls
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement[]} Array of created control elements
     */
    createControls(spot, container, context = 'sidebar') {
        // Initialize content if needed
        this.initializeContent(spot);
        
        const controls = [];
        
        // Text input
        const textGroup = this.createTextInput(spot, context);
        container.appendChild(textGroup);
        controls.push(textGroup);
        
        // Font family control
        const fontFamilyGroup = this.createFontFamilyControl(spot, context);
        container.appendChild(fontFamilyGroup);
        controls.push(fontFamilyGroup);
        
        // Font size control
        const fontSizeGroup = this.createFontSizeControl(spot, context);
        container.appendChild(fontSizeGroup);
        controls.push(fontSizeGroup);
        
        // Text alignment
        const alignmentGroup = this.createAlignmentControl(spot, context);
        container.appendChild(alignmentGroup);
        controls.push(alignmentGroup);
        
        // Text styling
        const stylingGroup = this.createStylingControl(spot, context);
        container.appendChild(stylingGroup);
        controls.push(stylingGroup);
        
        // Text color
        const colorGroup = this.createColorControl(spot, context);
        container.appendChild(colorGroup);
        controls.push(colorGroup);
        
        // Highlight color (only show if highlight is enabled)
        if (spot.content.styles?.highlight) {
            const highlightColorGroup = this.createHighlightColorControl(spot, context);
            container.appendChild(highlightColorGroup);
            controls.push(highlightColorGroup);
        }
        
        return controls;
    }
    
    /**
     * Create text input control
     * @param {Spot} spot - Spot object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Text input control element
     * @private
     */
    createTextInput(spot, context) {
        const textGroup = this.createControlGroup(context);
        textGroup.innerHTML = `
            <label>Text</label>
            <textarea class="spot-text-input" placeholder="Enter text..." rows="3">${spot.content.text || ''}</textarea>
        `;
        
        const textInput = textGroup.querySelector('.spot-text-input');
        this.addControlListener(textInput, 'input', () => {
            this.updateContent(spot, { text: textInput.value }, true);
        });
        
        return textGroup;
    }
    
    /**
     * Create font family control
     * @param {Spot} spot - Spot object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Font family control element
     * @private
     */
    createFontFamilyControl(spot, context) {
        const fontFamilyGroup = this.createControlGroup(context);
        fontFamilyGroup.innerHTML = `<label>Font Family</label>`;
        
        const fontSelect = document.createElement('select');
        fontSelect.className = 'spot-font-family';
        
        // Get available fonts from TextComponent (single source of truth)
        const fonts = TextComponent.getAvailableFonts();
        
        fonts.forEach(font => {
            const option = document.createElement('option');
            option.value = font.value;
            option.textContent = font.name;
            if (font.value === (spot.content.fontFamily || '"Wix Madefor Display", Arial, sans-serif')) {
                option.selected = true;
            }
            fontSelect.appendChild(option);
        });
        
        this.addControlListener(fontSelect, 'change', () => {
            this.updateContent(spot, { fontFamily: fontSelect.value }, true);
        });
        
        fontFamilyGroup.appendChild(fontSelect);
        return fontFamilyGroup;
    }

    /**
     * Create font size control
     * @param {Spot} spot - Spot object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Font size control element
     * @private
     */
    createFontSizeControl(spot, context) {
        const fontSizeGroup = this.createControlGroup(context);
        
        // Calculate max font size based on spot dimensions
        const padding = spot.content.padding || 0;
        const availableHeight = spot.height - (padding * 2);
        const maxFontSize = Math.min(availableHeight * 0.8, 72);
        const currentFontSize = spot.content.fontSize === 'auto' ? maxFontSize : spot.content.fontSize || maxFontSize;
        
        fontSizeGroup.innerHTML = `
            <label>Font Size: <span class="font-size-value">${spot.content.fontSize === 'auto' ? 'Auto' : currentFontSize + 'px'}</span></label>
            <input type="range" class="spot-font-size" min="8" max="${Math.floor(maxFontSize)}" step="1" value="${currentFontSize}">
            <label style="margin-top: 8px;">
                <input type="checkbox" class="auto-size-checkbox" ${spot.content.fontSize === 'auto' ? 'checked' : ''}>
                Auto-fit to spot
            </label>
        `;
        
        const fontSizeSlider = fontSizeGroup.querySelector('.spot-font-size');
        const fontSizeValue = fontSizeGroup.querySelector('.font-size-value');
        const autoSizeCheckbox = fontSizeGroup.querySelector('.auto-size-checkbox');
        
        const updateFontSize = () => {
            if (autoSizeCheckbox.checked) {
                this.updateContent(spot, { fontSize: 'auto' }, true);
                fontSizeValue.textContent = 'Auto';
                fontSizeSlider.disabled = true;
            } else {
                const size = parseInt(fontSizeSlider.value);
                this.updateContent(spot, { fontSize: size }, true);
                fontSizeValue.textContent = size + 'px';
                fontSizeSlider.disabled = false;
            }
        };
        
        this.addControlListener(fontSizeSlider, 'input', updateFontSize);
        this.addControlListener(autoSizeCheckbox, 'change', updateFontSize);
        
        return fontSizeGroup;
    }
    
    /**
     * Create text alignment control
     * @param {Spot} spot - Spot object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Alignment control element
     * @private
     */
    createAlignmentControl(spot, context) {
        const alignmentGroup = this.createControlGroup(context);
        alignmentGroup.innerHTML = `<label>Text Alignment</label>`;
        
        const alignmentDiv = document.createElement('div');
        alignmentDiv.className = 'spot-text-alignment';
        
        const alignments = [
            { value: 'left', label: 'L' },
            { value: 'center', label: 'C' },
            { value: 'right', label: 'R' }
        ];
        
        alignments.forEach(align => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'align-btn';
            btn.textContent = align.label;
            
            if (align.value === (spot.content.textAlign || 'center')) {
                btn.classList.add('active');
            }
            
            this.addControlListener(btn, 'click', () => {
                alignmentDiv.querySelectorAll('.align-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateContent(spot, { textAlign: align.value }, true);
            });
            
            alignmentDiv.appendChild(btn);
        });
        
        alignmentGroup.appendChild(alignmentDiv);
        return alignmentGroup;
    }
    
    /**
     * Create text styling control
     * @param {Spot} spot - Spot object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Styling control element
     * @private
     */
    createStylingControl(spot, context) {
        const stylingGroup = this.createControlGroup(context);
        stylingGroup.innerHTML = `<label>Text Style</label>`;
        
        const stylingDiv = document.createElement('div');
        stylingDiv.className = 'spot-text-styling';
        
        const styles = [
            { key: 'bold', label: 'B' },
            { key: 'italic', label: 'I' },
            { key: 'underline', label: 'U' },
            { key: 'highlight', label: 'H' }
        ];
        
        styles.forEach(style => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'style-btn';
            btn.textContent = style.label;
            
            if (spot.content.styles?.[style.key]) {
                btn.classList.add('active');
            }
            
            this.addControlListener(btn, 'click', () => {
                btn.classList.toggle('active');
                const currentStyles = { ...spot.content.styles };
                currentStyles[style.key] = !currentStyles[style.key];
                this.updateContent(spot, { styles: currentStyles }, true);
                
                // If highlight was toggled, recreate controls to show/hide highlight color
                if (style.key === 'highlight') {
                    // Force UI update to show/hide highlight color control
                    this.app.updateSpotsUI();
                }
            });
            
            stylingDiv.appendChild(btn);
        });
        
        stylingGroup.appendChild(stylingDiv);
        return stylingGroup;
    }
    
    /**
     * Create text color control
     * @param {Spot} spot - Spot object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Color control element
     * @private
     */
    createColorControl(spot, context) {
        const colorGroup = this.createControlGroup(context);
        colorGroup.innerHTML = `
            <label>Text Color</label>
            <input type="color" class="spot-text-color" value="${spot.content.color || '#000000'}">
        `;
        
        const colorInput = colorGroup.querySelector('.spot-text-color');
        this.addControlListener(colorInput, 'input', () => {
            this.updateContent(spot, { color: colorInput.value }, true);
        });
        
        return colorGroup;
    }
    
    /**
     * Create highlight color control
     * @param {Spot} spot - Spot object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Highlight color control element
     * @private
     */
    createHighlightColorControl(spot, context) {
        const highlightColorGroup = this.createControlGroup(context);
        highlightColorGroup.innerHTML = `
            <label>Highlight Color</label>
            <input type="color" class="spot-highlight-color" value="${spot.content.highlightColor || '#ffff00'}">
        `;
        
        const colorInput = highlightColorGroup.querySelector('.spot-highlight-color');
        this.addControlListener(colorInput, 'input', () => {
            this.updateContent(spot, { highlightColor: colorInput.value }, true);
        });
        
        return highlightColorGroup;
    }
}