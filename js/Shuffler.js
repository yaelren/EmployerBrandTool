/**
 * Shuffler.js - Simplified parameter shuffling system
 * Provides fun randomization options with smart defaults
 */

class Shuffler {
    constructor(app) {
        this.app = app;

        // Preloaded image arrays
        this.spotImages = [];
        this.backgroundImages = [];

        // Default text content for shuffling
        this.defaultMainTexts = [
            'JOIN\nOUR\nTEAM',
            'WE ARE\nHIRING',
            'GROW\nWITH\nUS',
            'YOUR\nCAREER\nSTARTS HERE',
            'BUILD\nYOUR\nFUTURE',
            'WORK\nWITH\nPURPOSE',
            'INNOVATE\nTOGETHER',
            'SHAPE\nTOMORROW'
        ];

        this.defaultSpotTexts = [
            'Join our innovative team',
            'Build your dream career',
            'Grow with industry leaders',
            'Shape the future together',
            'Create meaningful impact',
            'Unlock your potential',
            'Work with purpose',
            'Lead the change',
            'Make a difference',
            'Excel in your field',
            'Collaborate and innovate',
            'Achieve your goals'
        ];

        // Initialize image arrays
        this.initializeImages();

        // Color palettes for shuffling
        // Original Palette 1
        this.colorPalette1 = ['#AF1E01', '#F4FF4D', '#014051', '#6544F9', '#101585'];

        // Original Palette 2
        this.colorPalette2 = ['#863A29', '#FED980', '#00524E', '#8FA3FF', '#015293'];

        // New Palette 3
        this.colorPalette3 = ['#AD3119', '#FDF4A1', '#067A69', '#B07FF6', '#1E56C3'];

        // New Palette 4
        this.colorPalette4 = ['#FB492D', '#FDFFA7', '#00935F', '#BEA3E7', '#3910ED'];

        // New Palette 5
        this.colorPalette5 = ['#FF5500', '#FDFFCB', '#C2EBC3', '#CDC5FF', '#166AEA'];

        // New Palette 6
        this.colorPalette6 = ['#FF8044', '#D4C9B7', '#D8E3B7', '#E2D8FF', '#8CBAFF'];

        // New Palette 7
        this.colorPalette7 = ['#FAA85E', '#EDE9E5', '#D2FFA0', '#FFC2FE', '#ADD7FF'];

        // New Palette 8 - Extended palette with many colors
        this.colorPalette8 = [
            '#F98971', '#FECFBB', '#A6FFD7', '#C1E0EC', '#C4F1FE'
        ];

        // New Palette 9 - Grayscale palette
        this.colorPalette9 = ['#141E2A', '#455466', '#9EB4CE', '#D8E2EC', '#E6EEF7'];

        // Store all palettes
        this.allPalettes = [
            this.colorPalette1,
            this.colorPalette2,
            this.colorPalette3,
            this.colorPalette4,
            this.colorPalette5,
            this.colorPalette6,
            this.colorPalette7,
            this.colorPalette8,
            this.colorPalette9
        ];

        // Will be set to a random palette when shuffling
        this.currentPalette = null;

        // Font options
        this.fontFamilies = [
            '"Wix Madefor Display", Arial, sans-serif',
            '"Wix Madefor Text", Arial, sans-serif',
        ];

        // Alignment patterns (excluding 'cells')
        this.alignmentOptions = ['left', 'center', 'right'];
        this.perLinePatterns = ['uniform', 'alternating', 'random', 'cascade'];
    }

    /**
     * Initialize and preload all images
     */
    initializeImages() {
        // Spot image paths
        const spotImagePaths = [
            'assets/spots/spot1.png',
            'assets/spots/spot2.png',
            'assets/spots/spot3.png'
        ];

        // Background image paths
        const backgroundImagePaths = [
            'assets/backgrounds/background1.png',
            'assets/backgrounds/background2.png'
        ];

        // Preload spot images
        spotImagePaths.forEach(path => {
            const img = new Image();
            img.onload = () => {
                this.spotImages.push(img);
                
            };
            img.onerror = () => {
                console.warn(`❌ Failed to load spot image: ${path}`);
            };
            img.src = path;
        });

        // Preload background images
        backgroundImagePaths.forEach(path => {
            const img = new Image();
            img.onload = () => {
                this.backgroundImages.push(img);
            };
            img.onerror = () => {
                console.warn(`❌ Failed to load background image: ${path}`);
            };
            img.src = path;
        });
    }

    /**
     * Shuffle all unlocked parameters
     */
    async shuffleAll(useDefaults = false) {
        console.log('🎲 Shuffling all parameters...');

        // Always switch to manual mode when shuffling
        this.app.setTextMode('manual');

        const changes = {};

        // Shuffle main text
        if (useDefaults) {
            changes.text = this.randomFromArray(this.defaultMainTexts);
        }

        // Shuffle colors
        Object.assign(changes, this.shuffleColorsOnly());

        // Shuffle layout
        Object.assign(changes, this.shuffleLayoutOnly());

        // Apply changes
        await this.applyChanges(changes);

        // Trigger spot detection with callback to shuffle spots after detection
        if (this.app.autoDetectSpots) {
            this.app.autoDetectSpotsDebounced(200, () => {
                console.log('num of spots after detection:', this.app.spots.length);
                // Shuffle spots - ALWAYS shuffle spots with random types and parameters
                if (this.app.spots && this.app.spots.length > 0) {
                    this.shuffleAllSpotsRandomly();
                }
            });
        } else {
            // If auto-detect is disabled, just shuffle existing spots
            console.log('num of spots (no detection):', this.app.spots.length);
            if (this.app.spots && this.app.spots.length > 0) {
                await this.shuffleAllSpotsRandomly();
            }
        }

    }

    /**
     * Shuffle layout parameters only
     */
    async shuffleLayout() {

        // Always switch to manual mode when shuffling layout
        this.app.setTextMode('manual');

        const changes = this.shuffleLayoutOnly();
        await this.applyChanges(changes);

        // Trigger spot detection if enabled
        if (this.app.autoDetectSpots) {
            this.app.autoDetectSpotsDebounced(200);
        }
    }

    /**
     * Shuffle color parameters only
     */
    async shuffleColors() {

        const changes = this.shuffleColorsOnly();
        await this.applyChanges(changes);
    }

    /**
     * Shuffle spot parameters only
     */
    async shuffleSpots(useDefaults = false) {
        console.log('📍 Shuffling spots...');
        await this.shuffleSpotsOnly(useDefaults);
    }

    /**
     * Get layout shuffle changes
     */
    shuffleLayoutOnly() {
        const changes = {};

        // Font size - bigger range for more dramatic shuffles
        changes.fontSize = this.randomInRange(30, 220, 4);

        // Font family
        changes.fontFamily = this.randomFromArray(this.fontFamilies);

        // Font styles
        changes.fontWeight = Math.random() > 0.5 ? 'bold' : 'normal';
        changes.fontStyle = Math.random() > 0.7 ? 'italic' : 'normal';
        changes.underline = Math.random() > 0.8;

        // Padding
        changes.paddingHorizontal = this.randomInRange(10, 60, 5);
        changes.paddingVertical = this.randomInRange(10, 60, 5);

        // Line spacing
        changes.lineSpacing = this.randomInRange(0, 100, 10);

        // Text alignment (never use 'cells') - this is how text aligns within its bounds
        changes.textAlignment = this.randomFromArray(this.alignmentOptions);
        changes.perLineAlignment = this.randomFromArray(this.perLinePatterns);

        // Text position - this is where the text block sits in the container (9-position grid)
        changes.textPositionH = this.randomFromArray(['left', 'center', 'right']);
        changes.textPositionV = this.randomFromArray(['top', 'middle', 'bottom']);

        return changes;
    }

    /**
     * Get color shuffle changes
     */
    shuffleColorsOnly() {
        const changes = {};

        // Randomly select a palette
        this.currentPalette = this.randomFromArray(this.allPalettes);

        // Pick background color from the selected palette
        changes.backgroundColor = this.randomFromArray(this.currentPalette);

        // Pick text color - ensure it's different from background
        const availableTextColors = this.currentPalette.filter(color => color !== changes.backgroundColor);
        if (availableTextColors.length > 0) {
            // If we have other colors, pick one that's different
            changes.textColor = this.randomFromArray(availableTextColors);
        } else {
            // Edge case: palette has only one color (shouldn't happen with our palettes)
            changes.textColor = changes.backgroundColor;
        }

        // Highlight
        changes.highlight = Math.random() > 0.7;
        if (changes.highlight) {
            // Pick highlight color - ensure it's different from text color
            const availableHighlightColors = this.currentPalette.filter(color => color !== changes.textColor);
            if (availableHighlightColors.length > 0) {
                changes.highlightColor = this.randomFromArray(availableHighlightColors);
            } else {
                // Edge case: only one color available, use it anyway
                changes.highlightColor = this.randomFromArray(this.currentPalette);
            }
        }

        // Always set background to opaque (100% opacity)
        changes.backgroundOpacity = 100;
        changes.transparentBackground = false;

        return changes;
    }

    /**
     * Shuffle individual spots
     */
    async shuffleSpotsOnly(useDefaults = false) {
        if (!this.app.spots || this.app.spots.length === 0) return;

        for (const spot of this.app.spots) {
            await this.shuffleIndividualSpot(spot, useDefaults);
        }

        this.app.updateSpotsUI();
    }

    /**
     * Shuffle an individual spot
     */
    async shuffleIndividualSpot(spot, useDefaults = false) {
        // Randomly choose spot type with equal probability
        const types = ['text', 'image', 'mask', 'empty'];
        const newType = this.randomFromArray(types);
        spot.setType(newType);

        switch (newType) {
            case 'text':
                await this.shuffleTextSpot(spot, useDefaults);
                break;
            case 'image':
                await this.shuffleImageSpot(spot);
                break;
            case 'mask':
                // Mask spots with random opacity
                spot.opacity = Math.random() * 0.5 + 0.5;
                break;
            case 'empty':
                // Empty spots don't need configuration
                break;
        }
    }

    /**
     * Shuffle text spot parameters
     */
    async shuffleTextSpot(spot, useDefaults = false) {
        if (!spot.content) spot.content = {};

        // Text content
        if (useDefaults) {
            spot.content.text = this.randomFromArray(this.defaultSpotTexts);
        }

        // Text color - use current palette if available, otherwise use first palette
        const palette = this.currentPalette || this.colorPalette1;
        spot.content.color = this.randomFromArray(palette);

        // Text alignment - only horizontal (left, center, right)
        const horizontalAlignments = ['left', 'center', 'right'];
        spot.content.textAlign = this.randomFromArray(horizontalAlignments);

        // Position - always vertically centered, only vary horizontal
        const horizontalPositions = ['left', 'center', 'right'];
        spot.content.positionH = this.randomFromArray(horizontalPositions);
        spot.content.positionV = 'middle'; // Always center vertically

        // Styles
        spot.content.styles = {
            bold: Math.random() > 0.5,
            italic: Math.random() > 0.7,
            underline: Math.random() > 0.8,
            highlight: Math.random() > 0.8
        };
    }

    /**
     * Shuffle image spot parameters
     */
    async shuffleImageSpot(spot) {
        if (!spot.content) spot.content = {};

        // Use preloaded spot images
        if (this.spotImages.length > 0) {
            const randomImage = this.randomFromArray(this.spotImages);
            spot.content.image = randomImage;
        } else {
            console.warn('No spot images loaded yet');
            spot.content.image = null;
        }

        // Random scale for variety (0.5x to 2x size)
        spot.content.scale = Math.random() * 1.5 + 0.5;

        // Random rotation (-45 to +45 degrees)
        spot.content.rotation = (Math.random() - 0.5) * 90;

        // Random alignment - all 9 positions
        const horizontalPositions = ['left', 'center', 'right'];
        const verticalPositions = ['top', 'middle', 'bottom'];

        spot.content.positionH = this.randomFromArray(horizontalPositions);
        spot.content.positionV = this.randomFromArray(verticalPositions);
    }

    /**
     * Apply parameter changes to the app
     */
    async applyChanges(changes) {
        const elements = this.app.elements;

        // Apply each change
        for (const [key, value] of Object.entries(changes)) {
            switch (key) {
                case 'text':
                    if (elements.mainText) elements.mainText.value = value;
                    this.app.mainTextComponent.text = value;
                    break;

                case 'textColor':
                    if (elements.textColor) elements.textColor.value = value;
                    this.app.mainTextComponent.color = value;
                    break;

                case 'fontFamily':
                    if (elements.fontFamily) elements.fontFamily.value = value;
                    this.app.mainTextComponent.fontFamily = value;
                    break;

                case 'fontSize':
                    if (elements.fontSize) {
                        elements.fontSize.value = value;
                        elements.fontSizeValue.textContent = value + 'px';
                    }
                    this.app.textEngine.updateConfig({ fontSize: value });
                    break;

                case 'fontWeight':
                    this.app.mainTextComponent.fontWeight = value;
                    if (elements.mainTextBold) {
                        elements.mainTextBold.classList.toggle('active', value === 'bold');
                    }
                    break;

                case 'fontStyle':
                    this.app.mainTextComponent.fontStyle = value;
                    if (elements.mainTextItalic) {
                        elements.mainTextItalic.classList.toggle('active', value === 'italic');
                    }
                    break;

                case 'underline':
                    this.app.mainTextComponent.underline = value;
                    if (elements.mainTextUnderline) {
                        elements.mainTextUnderline.classList.toggle('active', value);
                    }
                    break;

                case 'highlight':
                    this.app.mainTextComponent.highlight = value;
                    if (elements.mainTextHighlight) {
                        elements.mainTextHighlight.classList.toggle('active', value);
                    }
                    break;

                case 'highlightColor':
                    if (elements.mainTextHighlightColor) elements.mainTextHighlightColor.value = value;
                    this.app.mainTextComponent.highlightColor = value;
                    break;

                case 'backgroundColor':
                    if (elements.backgroundColor) elements.backgroundColor.value = value;
                    this.app.updateBackgroundColor();
                    break;

                case 'backgroundOpacity':
                    if (elements.backgroundOpacity) {
                        elements.backgroundOpacity.value = value;
                        elements.backgroundOpacityValue.textContent = value + '%';
                    }
                    this.app.updateBackgroundColor();
                    break;

                case 'transparentBackground':
                    if (elements.transparentBackground) elements.transparentBackground.checked = value;
                    this.app.updateBackgroundColor();
                    break;

                case 'paddingHorizontal':
                    if (elements.paddingHorizontal) {
                        elements.paddingHorizontal.value = value;
                        elements.paddingHorizontalValue.textContent = value + 'px';
                    }
                    this.app.updateSymmetricalPadding('horizontal', value);
                    break;

                case 'paddingVertical':
                    if (elements.paddingVertical) {
                        elements.paddingVertical.value = value;
                        elements.paddingVerticalValue.textContent = value + 'px';
                    }
                    this.app.updateSymmetricalPadding('vertical', value);
                    break;

                case 'lineSpacing':
                    if (elements.lineSpacing) {
                        elements.lineSpacing.value = value;
                        elements.lineSpacingValue.textContent = value + 'px';
                    }
                    this.app.textEngine.updateConfig({ lineSpacing: value });
                    break;

                case 'textAlignment':
                    this.app.mainTextComponent.alignH = value;
                    this.app.updateLineAlignmentControls?.();
                    break;

                case 'perLineAlignment':
                    this.applyPerLineAlignment(value);
                    break;

                case 'textPositionH':
                    // Update both MainTextComponent and MainTextController for position alignment
                    this.app.mainTextComponent.positionH = value;
                    this.app.textEngine.updateConfig({ textPositionHorizontal: value });
                    break;

                case 'textPositionV':
                    // Update both MainTextComponent and MainTextController for position alignment
                    this.app.mainTextComponent.positionV = value;
                    this.app.textEngine.updateConfig({ textPositionVertical: value });
                    break;
            }
        }

        // Load random background image with 50% probability
        if (Math.random() > 0.5 && this.backgroundImages.length > 0) {
            const randomBackgroundImage = this.randomFromArray(this.backgroundImages);
            // Pass the actual Image object, not the src string
            this.app.setBackgroundImage(randomBackgroundImage);
        }

        // Update position button UI after all changes
        this.updatePositionButtonUI();

        // Trigger re-render
        this.app.render();
    }

    /**
     * Apply per-line alignment pattern
     */
    applyPerLineAlignment(pattern) {
        const text = this.app.mainTextComponent.text;
        if (!text) return;

        const lines = text.split('\n');

        // Clear existing line alignments
        this.app.mainTextComponent.lineAlignments = {};

        switch (pattern) {
            case 'uniform':
                // All lines use main alignment
                break;

            case 'alternating':
                lines.forEach((line, index) => {
                    if (line.trim()) {
                        this.app.mainTextComponent.setLineAlignment(index, index % 2 === 0 ? 'left' : 'right');
                    }
                });
                break;

            case 'random':
                lines.forEach((line, index) => {
                    if (line.trim()) {
                        // Never use 'cells' alignment
                        const align = this.randomFromArray(['left', 'center', 'right']);
                        this.app.mainTextComponent.setLineAlignment(index, align);
                    }
                });
                break;

            case 'cascade':
                const cascadePattern = ['left', 'center', 'right', 'center'];
                lines.forEach((line, index) => {
                    if (line.trim()) {
                        const alignIndex = index % cascadePattern.length;
                        this.app.mainTextComponent.setLineAlignment(index, cascadePattern[alignIndex]);
                    }
                });
                break;
        }

        this.app.updateLineAlignmentControls?.();
        this.app.render();
    }

    /**
     * Get contrasting color for readability
     */
    getContrastingColor(bgColor) {
        // If no current palette, use the first one
        const palette = this.currentPalette || this.colorPalette1;

        const rgb = this.hexToRgb(bgColor);
        if (!rgb) return this.randomFromArray(palette);

        // Calculate luminance
        const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

        // Sort palette colors by their luminance
        const sortedColors = palette.slice().sort((a, b) => {
            const rgbA = this.hexToRgb(a);
            const rgbB = this.hexToRgb(b);
            const lumA = (0.299 * rgbA.r + 0.587 * rgbA.g + 0.114 * rgbA.b) / 255;
            const lumB = (0.299 * rgbB.r + 0.587 * rgbB.g + 0.114 * rgbB.b) / 255;
            return lumA - lumB;
        });

        // If background is light, pick from darker half of palette
        // If background is dark, pick from lighter half of palette
        if (luminance > 0.5) {
            // Background is light, pick darker colors
            const darkColors = sortedColors.slice(0, Math.ceil(sortedColors.length / 2));
            return this.randomFromArray(darkColors.length > 0 ? darkColors : palette);
        } else {
            // Background is dark, pick lighter colors
            const lightColors = sortedColors.slice(Math.floor(sortedColors.length / 2));
            return this.randomFromArray(lightColors.length > 0 ? lightColors : palette);
        }
    }

    /**
     * Convert hex to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Get random item from array
     */
    randomFromArray(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * Get random number in range
     */
    randomInRange(min, max, step = 1) {
        return Math.round((Math.random() * (max - min) + min) / step) * step;
    }

    /**
     * Update position button UI to reflect shuffled position
     */
    updatePositionButtonUI() {
        const posButtons = document.querySelectorAll('.pos-btn');

        // Get current position from MainTextComponent
        const currentH = this.app.mainTextComponent.positionH;
        const currentV = this.app.mainTextComponent.positionV;

        posButtons.forEach(btn => {
            const btnH = btn.dataset.horizontal;
            const btnV = btn.dataset.vertical;

            // Check if this button matches the current position
            const isActive = (btnH === currentH && btnV === currentV);
            btn.classList.toggle('active', isActive);
        });
    }

    /**
     * Shuffle all spots with random types and parameters (ignores useDefaults)
     */
    async shuffleAllSpotsRandomly() {
        if (!this.app.spots || this.app.spots.length === 0) return;

        for (const spot of this.app.spots) {
            await this.shuffleIndividualSpotRandomly(spot);
        }

        this.app.updateSpotsUI();
    }

    /**
     * Shuffle an individual spot with random type and parameters (ignores useDefaults)
     */
    async shuffleIndividualSpotRandomly(spot) {
        // Randomly choose spot type with equal probability
        const types = ['text', 'image', 'mask', 'empty'];
        const newType = this.randomFromArray(types);
        spot.setType(newType);
        console.log('shuffling spot with type:', newType);

        switch (newType) {
            case 'text':
                await this.shuffleTextSpotRandomly(spot);
                break;
            case 'image':
                await this.shuffleImageSpot(spot);
                break;
            case 'mask':
                // Mask spots with random opacity
                spot.opacity = Math.random() * 0.5 + 0.5;
                break;
            case 'empty':
                // Empty spots don't need configuration
                break;
        }
    }

    /**
     * Shuffle text spot parameters with random content (ignores useDefaults)
     */
    async shuffleTextSpotRandomly(spot) {
        if (!spot.content) spot.content = {};

        // ALWAYS assign random text content
        spot.content.text = this.randomFromArray(this.defaultSpotTexts);

        // Text color - use current palette if available, otherwise use first palette
        const palette = this.currentPalette || this.colorPalette1;
        spot.content.color = this.randomFromArray(palette);

        // Text alignment - only horizontal (left, center, right)
        const horizontalAlignments = ['left', 'center', 'right'];
        spot.content.textAlign = this.randomFromArray(horizontalAlignments);

        // Position - always vertically centered, only vary horizontal
        const horizontalPositions = ['left', 'center', 'right'];
        spot.content.positionH = this.randomFromArray(horizontalPositions);
        spot.content.positionV = 'middle'; // Always center vertically

        // Styles
        spot.content.styles = {
            bold: Math.random() > 0.5,
            italic: Math.random() > 0.7,
            underline: Math.random() > 0.8,
            highlight: Math.random() > 0.8
        };
    }
}