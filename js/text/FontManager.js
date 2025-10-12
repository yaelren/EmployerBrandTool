/**
 * FontManager.js - Manages custom font uploads and loading
 * Handles font file uploads, CSS @font-face generation, and persistence
 */

class FontManager {
    constructor() {
        this.customFonts = new Map(); // Map of fontName -> fontData
        this.loadCustomFontsFromStorage();
    }

    /**
     * Load custom fonts from localStorage
     */
    loadCustomFontsFromStorage() {
        try {
            const stored = localStorage.getItem('customFonts');
            if (stored) {
                const fonts = JSON.parse(stored);
                fonts.forEach(fontData => {
                    this.customFonts.set(fontData.name, fontData);
                    this.loadFont(fontData);
                });
            }
        } catch (error) {
            console.warn('Failed to load custom fonts from storage:', error);
        }
    }

    /**
     * Save custom fonts to localStorage
     */
    saveCustomFontsToStorage() {
        try {
            const fonts = Array.from(this.customFonts.values());
            localStorage.setItem('customFonts', JSON.stringify(fonts));
        } catch (error) {
            console.warn('Failed to save custom fonts to storage:', error);
        }
    }

    /**
     * Upload and process a font file
     * @param {File} file - Font file (woff, woff2, ttf, otf)
     * @returns {Promise<Object>} Font data object
     */
    async uploadFont(file) {
        return new Promise((resolve, reject) => {
            // Validate file type
            const validTypes = ['font/woff', 'font/woff2', 'application/font-woff', 'application/font-woff2', 'font/ttf', 'font/otf'];
            const fileExtension = file.name.toLowerCase().split('.').pop();
            const validExtensions = ['woff', 'woff2', 'ttf', 'otf'];
            
            if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
                reject(new Error('Invalid font file type. Please upload a WOFF, WOFF2, TTF, or OTF file.'));
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                reject(new Error('Font file is too large. Maximum size is 5MB.'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const fontData = this.processFontFile(file, e.target.result);
                    this.customFonts.set(fontData.name, fontData);
                    this.loadFont(fontData);
                    this.saveCustomFontsToStorage();
                    resolve(fontData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read font file'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Process font file and create font data object
     * @param {File} file - Original file
     * @param {string} dataUrl - Base64 data URL
     * @returns {Object} Font data object
     */
    processFontFile(file, dataUrl) {
        const fileName = file.name;
        const fontName = this.extractFontName(fileName);
        const fontFamily = this.generateFontFamily(fontName);
        
        return {
            name: fontName,
            family: fontFamily,
            fileName: fileName,
            dataUrl: dataUrl,
            uploadedAt: new Date().toISOString(),
            size: file.size
        };
    }

    /**
     * Extract font name from filename
     * @param {string} fileName - Font file name
     * @returns {string} Clean font name
     */
    extractFontName(fileName) {
        // Remove extension and clean up the name
        let name = fileName.replace(/\.[^/.]+$/, '');
        
        // Remove common suffixes
        name = name.replace(/-?(regular|normal|medium|bold|light|thin|heavy|black)$/i, '');
        
        // Convert to title case
        name = name.split(/[-_\s]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        
        return name || 'Custom Font';
    }

    /**
     * Generate CSS font-family value
     * @param {string} fontName - Font name
     * @returns {string} CSS font-family value
     */
    generateFontFamily(fontName) {
        return `"${fontName}", Arial, sans-serif`;
    }

    /**
     * Load font into the page using CSS @font-face
     * @param {Object} fontData - Font data object
     */
    loadFont(fontData) {
        // Check if font is already loaded
        if (document.querySelector(`style[data-font="${fontData.name}"]`)) {
            return;
        }

        // Determine font format from data URL
        let format = 'woff2';
        if (fontData.dataUrl.includes('font/woff')) {
            format = 'woff';
        } else if (fontData.dataUrl.includes('font/ttf')) {
            format = 'truetype';
        } else if (fontData.dataUrl.includes('font/otf')) {
            format = 'opentype';
        }

        // Create CSS @font-face rule
        const css = `
            @font-face {
                font-family: "${fontData.name}";
                src: url(${fontData.dataUrl}) format('${format}');
                font-display: swap;
            }
        `;

        // Add to page
        const style = document.createElement('style');
        style.setAttribute('data-font', fontData.name);
        style.textContent = css;
        document.head.appendChild(style);

        console.log(`Loaded custom font: ${fontData.name}`);
    }

    /**
     * Get all custom fonts
     * @returns {Array} Array of font data objects
     */
    getCustomFonts() {
        return Array.from(this.customFonts.values());
    }

    /**
     * Get custom font by name
     * @param {string} name - Font name
     * @returns {Object|null} Font data object or null
     */
    getCustomFont(name) {
        return this.customFonts.get(name) || null;
    }

    /**
     * Remove custom font
     * @param {string} name - Font name
     * @returns {boolean} Success status
     */
    removeCustomFont(name) {
        if (this.customFonts.has(name)) {
            // Remove CSS
            const style = document.querySelector(`style[data-font="${name}"]`);
            if (style) {
                style.remove();
            }

            // Remove from storage
            this.customFonts.delete(name);
            this.saveCustomFontsToStorage();
            return true;
        }
        return false;
    }

    /**
     * Check if font is loaded and ready
     * @param {string} fontFamily - CSS font-family value
     * @returns {Promise<boolean>} Font ready status
     */
    async isFontReady(fontFamily) {
        return new Promise((resolve) => {
            // Create a test element
            const testElement = document.createElement('span');
            testElement.style.fontFamily = fontFamily;
            testElement.style.fontSize = '72px';
            testElement.style.position = 'absolute';
            testElement.style.left = '-9999px';
            testElement.style.top = '-9999px';
            testElement.textContent = 'abcdefghijklmnopqrstuvwxyz0123456789';
            
            document.body.appendChild(testElement);
            
            // Measure with default font
            const defaultWidth = testElement.offsetWidth;
            
            // Measure with custom font
            testElement.style.fontFamily = fontFamily;
            
            // Check if font loaded (width should be different)
            setTimeout(() => {
                const customWidth = testElement.offsetWidth;
                document.body.removeChild(testElement);
                
                // Font is ready if width changed (indicating custom font loaded)
                resolve(customWidth !== defaultWidth);
            }, 100);
        });
    }

    /**
     * Get font file size in human readable format
     * @param {number} bytes - File size in bytes
     * @returns {string} Human readable size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Validate font file before upload
     * @param {File} file - Font file
     * @returns {Object} Validation result
     */
    validateFontFile(file) {
        const result = {
            valid: true,
            errors: []
        };

        // Check file type
        const validTypes = ['font/woff', 'font/woff2', 'application/font-woff', 'application/font-woff2', 'font/ttf', 'font/otf'];
        const fileExtension = file.name.toLowerCase().split('.').pop();
        const validExtensions = ['woff', 'woff2', 'ttf', 'otf'];
        
        if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
            result.valid = false;
            result.errors.push('Invalid file type. Please upload a WOFF, WOFF2, TTF, or OTF file.');
        }

        // Check file size
        if (file.size > 5 * 1024 * 1024) {
            result.valid = false;
            result.errors.push('File is too large. Maximum size is 5MB.');
        }

        // Check if font name already exists
        const fontName = this.extractFontName(file.name);
        if (this.customFonts.has(fontName)) {
            result.valid = false;
            result.errors.push(`Font "${fontName}" already exists.`);
        }

        return result;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FontManager;
}
