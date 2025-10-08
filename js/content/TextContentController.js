/**
 * TextContentController.js - Handles text cell controls and interactions
 * Extends ContentController for text-specific functionality
 */

class TextContentController extends ContentController {
    constructor(app) {
        super(app);
        this.contentType = 'text';
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
            positionH: 'center',
            positionV: 'middle',
            styles: {},
            fontSize: 'auto',
            fontFamily: '"Wix Madefor Display", Arial, sans-serif',
            padding: 1,
            highlightColor: '#ffff00'
        };
    }
    
    /**
     * Create controls for text spots
     * @param {ContentCell} cell - Cell object
     * @param {HTMLElement} container - Container for controls
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement[]} Array of created control elements
     */
    createControls(cell, container, context = 'sidebar') {
        // Initialize content if needed
        this.initializeContent(cell);

        const controls = [];

        // Text input
        const textGroup = this.createTextInput(cell, context);
        container.appendChild(textGroup);
        controls.push(textGroup);

        // Font family control
        const fontFamilyGroup = this.createFontFamilyControl(cell, context);
        container.appendChild(fontFamilyGroup);
        controls.push(fontFamilyGroup);

        // Font size control
        const fontSizeGroup = this.createFontSizeControl(cell, context);
        container.appendChild(fontSizeGroup);
        controls.push(fontSizeGroup);

        // Text alignment
        const alignmentGroup = this.createAlignmentControl(cell, context);
        container.appendChild(alignmentGroup);
        controls.push(alignmentGroup);

        // Position alignment
        const positionGroup = this.createPositionControl(cell, context);
        container.appendChild(positionGroup);
        controls.push(positionGroup);

        // Text styling
        const stylingGroup = this.createStylingControl(cell, context);
        container.appendChild(stylingGroup);
        controls.push(stylingGroup);

        // Text color
        const colorGroup = this.createColorControl(cell, context);
        container.appendChild(colorGroup);
        controls.push(colorGroup);

        // Highlight color (only show if highlight is enabled)
        if (cell.content.styles?.highlight) {
            const highlightColorGroup = this.createHighlightColorControl(cell, context);
            container.appendChild(highlightColorGroup);
            controls.push(highlightColorGroup);
        }

        return controls;
    }
    
    /**
     * Create text input control
     * @param {ContentCell} cell - Cell object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Text input control element
     * @private
     */
    createTextInput(cell, context) {
        const textGroup = this.createControlGroup(context);
        textGroup.innerHTML = `
            <label>Text</label>
            <textarea class="spot-text-input" placeholder="Enter text..." rows="3">${cell.content.text || ''}</textarea>
        `;

        const textInput = textGroup.querySelector('.spot-text-input');
        this.addControlListener(textInput, 'input', () => {
            this.updateContent(cell, { text: textInput.value }, true);
        });

        return textGroup;
    }
    
    /**
     * Create font family control
     * @param {ContentCell} cell - Cell object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Font family control element
     * @private
     */
    createFontFamilyControl(cell, context) {
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
            if (font.value === (cell.content.fontFamily || '"Wix Madefor Display", Arial, sans-serif')) {
                option.selected = true;
            }
            fontSelect.appendChild(option);
        });

        this.addControlListener(fontSelect, 'change', () => {
            this.updateContent(cell, { fontFamily: fontSelect.value }, true);
        });

        fontFamilyGroup.appendChild(fontSelect);
        return fontFamilyGroup;
    }

    /**
     * Create font size control
     * @param {ContentCell} cell - Cell object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Font size control element
     * @private
     */
    createFontSizeControl(cell, context) {
        const fontSizeGroup = this.createControlGroup(context);

        // Calculate max font size based on cell dimensions
        const padding = cell.content.padding || 0;
        const availableHeight = cell.height - (padding * 2);
        const maxFontSize = Math.min(availableHeight * 0.8, 72);
        const currentFontSize = cell.content.fontSize === 'auto' ? maxFontSize : cell.content.fontSize || maxFontSize;

        fontSizeGroup.innerHTML = `
            <label>Font Size: <span class="font-size-value">${cell.content.fontSize === 'auto' ? 'Auto' : currentFontSize + 'px'}</span></label>
            <input type="range" class="spot-font-size" min="8" max="${Math.floor(maxFontSize)}" step="1" value="${currentFontSize}">
            <label style="margin-top: 8px;">
                <input type="checkbox" class="auto-size-checkbox" ${cell.content.fontSize === 'auto' ? 'checked' : ''}>
                Auto-fit to cell
            </label>
        `;

        const fontSizeSlider = fontSizeGroup.querySelector('.spot-font-size');
        const fontSizeValue = fontSizeGroup.querySelector('.font-size-value');
        const autoSizeCheckbox = fontSizeGroup.querySelector('.auto-size-checkbox');

        const updateFontSize = () => {
            if (autoSizeCheckbox.checked) {
                this.updateContent(cell, { fontSize: 'auto' }, true);
                fontSizeValue.textContent = 'Auto';
                fontSizeSlider.disabled = true;
            } else {
                const size = parseInt(fontSizeSlider.value);
                this.updateContent(cell, { fontSize: size }, true);
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
     * @param {ContentCell} cell - Cell object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Alignment control element
     * @private
     */
    createAlignmentControl(cell, context) {
        const alignmentGroup = this.createControlGroup(context);
        alignmentGroup.innerHTML = `<label>Text Alignment</label>`;

        const alignmentDiv = document.createElement('div');
        alignmentDiv.className = 'spot-text-alignment';

        const alignments = [
            { value: 'left', label: '<span class="align-icon"></span>', title: 'Align Left', iconClass: 'align-left-icon' },
            { value: 'center', label: '<span class="align-icon"></span>', title: 'Align Center', iconClass: 'align-center-icon' },
            { value: 'right', label: '<span class="align-icon"></span>', title: 'Align Right', iconClass: 'align-right-icon' }
        ];

        alignments.forEach(align => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'align-btn';
            btn.innerHTML = align.label;
            btn.title = align.title;
            btn.classList.add(align.iconClass);

            if (align.value === (cell.content.textAlign || 'center')) {
                btn.classList.add('active');
            }

            this.addControlListener(btn, 'click', () => {
                alignmentDiv.querySelectorAll('.align-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateContent(cell, { textAlign: align.value }, true);
            });

            alignmentDiv.appendChild(btn);
        });

        alignmentGroup.appendChild(alignmentDiv);
        return alignmentGroup;
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
     * Create text styling control
     * @param {ContentCell} cell - Cell object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Styling control element
     * @private
     */
    createStylingControl(cell, context) {
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

            if (cell.content.styles?.[style.key]) {
                btn.classList.add('active');
            }

            this.addControlListener(btn, 'click', () => {
                btn.classList.toggle('active');
                const currentStyles = { ...cell.content.styles };
                currentStyles[style.key] = !currentStyles[style.key];
                this.updateContent(cell, { styles: currentStyles }, true);

                // If highlight was toggled, recreate controls to show/hide highlight color
                if (style.key === 'highlight') {
                    // Force UI update to show/hide highlight color control
                    this.app.uiManager?.updateSpotsUI();
                }
            });

            stylingDiv.appendChild(btn);
        });

        stylingGroup.appendChild(stylingDiv);
        return stylingGroup;
    }
    
    /**
     * Create text color control
     * @param {ContentCell} cell - Cell object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Color control element
     * @private
     */
    createColorControl(cell, context) {
        const colorGroup = this.createControlGroup(context);
        colorGroup.innerHTML = `
            <label>Text Color</label>
            <input type="color" class="spot-text-color" value="${cell.content.color || '#000000'}">
        `;

        const colorInput = colorGroup.querySelector('.spot-text-color');
        this.addControlListener(colorInput, 'input', () => {
            this.updateContent(cell, { color: colorInput.value }, true);
        });

        return colorGroup;
    }
    
    /**
     * Create highlight color control
     * @param {ContentCell} cell - Cell object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Highlight color control element
     * @private
     */
    createHighlightColorControl(cell, context) {
        const highlightColorGroup = this.createControlGroup(context);
        highlightColorGroup.innerHTML = `
            <label>Highlight Color</label>
            <input type="color" class="spot-highlight-color" value="${cell.content.highlightColor || '#ffff00'}">
        `;

        const colorInput = highlightColorGroup.querySelector('.spot-highlight-color');
        this.addControlListener(colorInput, 'input', () => {
            this.updateContent(cell, { highlightColor: colorInput.value }, true);
        });

        return highlightColorGroup;
    }
}