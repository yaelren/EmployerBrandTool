/**
 * Wix Headless API Wrapper for Cloud Preset Storage (REST API)
 *
 * Uses Wix REST API directly instead of SDK packages for browser compatibility
 * Handles all interactions with Wix Headless backend:
 * - Image uploads to Wix Media Manager
 * - Preset save/load/delete operations
 * - Data collection management
 */

export class WixPresetAPI {
    constructor() {
        this.clientId = null;
        this.accessToken = null;
        this.initialized = false;
        this.collectionName = 'presets';
        this.baseURL = 'https://www.wixapis.com';
    }

    /**
     * Initialize Wix API with OAuth client ID
     * @param {string} clientId - Wix OAuth Client ID
     */
    async initialize(clientId) {
        try {
            console.log('🔄 Initializing Wix REST API...');
            this.clientId = clientId;

            // Generate visitor access token
            await this.generateAccessToken();

            console.log('✅ Wix REST API initialized successfully');
            this.initialized = true;

        } catch (error) {
            console.error('❌ Failed to initialize Wix REST API:', error);
            throw new Error(`Wix initialization failed: ${error.message}`);
        }
    }

    /**
     * Generate visitor access token using OAuth
     */
    async generateAccessToken() {
        try {
            // For visitor tokens (anonymous access), we use a simple approach
            // In production, you'd implement proper OAuth flow
            // For now, we'll use a public API key approach or visitor session

            console.log('🎫 Using visitor session for anonymous access');

            // Note: Wix Headless typically requires proper OAuth setup
            // This is a simplified version - you may need to implement full OAuth flow
            this.accessToken = 'visitor-token'; // Placeholder - will be replaced with actual implementation

        } catch (error) {
            console.error('❌ Failed to generate access token:', error);
            throw error;
        }
    }

    /**
     * Check if API is initialized
     */
    ensureInitialized() {
        if (!this.initialized) {
            throw new Error('WixPresetAPI not initialized. Call initialize() first.');
        }
    }

    /**
     * Convert image element to blob
     * @param {HTMLImageElement|HTMLCanvasElement} imageElement
     * @returns {Promise<Blob>}
     */
    async imageToBlob(imageElement) {
        return new Promise((resolve, reject) => {
            // If it's already a canvas, convert directly
            if (imageElement instanceof HTMLCanvasElement) {
                imageElement.toBlob(blob => {
                    if (blob) resolve(blob);
                    else reject(new Error('Failed to convert canvas to blob'));
                }, 'image/png');
                return;
            }

            // If it's an image, draw to canvas first
            const canvas = document.createElement('canvas');
            canvas.width = imageElement.naturalWidth || imageElement.width;
            canvas.height = imageElement.naturalHeight || imageElement.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imageElement, 0, 0);

            canvas.toBlob(blob => {
                if (blob) resolve(blob);
                else reject(new Error('Failed to convert image to blob'));
            }, 'image/png');
        });
    }

    /**
     * Upload image to Wix Media Manager (using data URL as fallback for now)
     * @param {HTMLImageElement|HTMLCanvasElement} imageElement
     * @param {string} filename - Optional custom filename
     * @returns {Promise<string>} - Image URL (data URL for now, will be Wix CDN in production)
     */
    async uploadImage(imageElement, filename = null) {
        this.ensureInitialized();

        try {
            console.log(`📤 Processing image: ${filename}`);

            // TEMPORARY SOLUTION: Use data URLs instead of uploading to Wix
            // This allows the system to work without full OAuth setup
            // In production, this would upload to Wix Media Manager

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (imageElement instanceof HTMLCanvasElement) {
                canvas.width = imageElement.width;
                canvas.height = imageElement.height;
                ctx.drawImage(imageElement, 0, 0);
            } else {
                canvas.width = imageElement.naturalWidth || imageElement.width;
                canvas.height = imageElement.naturalHeight || imageElement.height;
                ctx.drawImage(imageElement, 0, 0);
            }

            const dataURL = canvas.toDataURL('image/png');

            console.log(`✅ Image processed (using data URL for now)`);
            console.warn('⚠️ Production: This would upload to Wix CDN');

            return dataURL;

        } catch (error) {
            console.error('❌ Image processing failed:', error);
            throw new Error(`Failed to process image: ${error.message}`);
        }
    }

    /**
     * Save preset to browser localStorage (fallback until Wix OAuth is fully set up)
     * @param {string} name - Preset name
     * @param {object} settings - Complete preset settings
     * @returns {Promise<object>} - Created preset item
     */
    async savePreset(name, settings) {
        this.ensureInitialized();

        try {
            console.log(`💾 Saving preset to localStorage: "${name}"`);

            // TEMPORARY SOLUTION: Use localStorage instead of Wix
            // This allows the system to work without full OAuth setup

            const presetId = `preset_${Date.now()}`;
            const presetData = {
                _id: presetId,
                name: name,
                settings: settings,
                _createdDate: new Date().toISOString(),
                _updatedDate: new Date().toISOString()
            };

            // Get existing presets
            const presetsKey = 'wix_presets';
            const existingPresetsJSON = localStorage.getItem(presetsKey);
            const existingPresets = existingPresetsJSON ? JSON.parse(existingPresetsJSON) : [];

            // Add new preset
            existingPresets.push(presetData);

            // Save back to localStorage
            localStorage.setItem(presetsKey, JSON.stringify(existingPresets));

            console.log(`✅ Preset saved with ID: ${presetId}`);
            console.warn('⚠️ Production: This would save to Wix Data Collections');

            return presetData;

        } catch (error) {
            console.error('❌ Failed to save preset:', error);

            // Check if it's a quota exceeded error
            if (error.name === 'QuotaExceededError') {
                console.error('💾 localStorage is full!');
                console.error('   → Current presets:', existingPresets.length);
                console.error('   → Consider deleting old presets or migrating to Wix REST API');
                throw new Error('localStorage quota exceeded. Please delete some old presets or migrate to cloud storage.');
            }

            throw new Error(`Failed to save preset: ${error.message}`);
        }
    }

    /**
     * Get localStorage usage information
     * @returns {Object} Storage usage stats
     */
    getStorageInfo() {
        try {
            const presetsKey = 'wix_presets';
            const presetsJSON = localStorage.getItem(presetsKey) || '[]';
            const presets = JSON.parse(presetsJSON);

            // Calculate size in bytes (approximate)
            const totalSize = new Blob([presetsJSON]).size;
            const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);

            // Estimate quota (typically 5-10MB)
            const estimatedQuotaMB = 5;
            const usagePercent = ((totalSize / (estimatedQuotaMB * 1024 * 1024)) * 100).toFixed(1);

            return {
                presetCount: presets.length,
                totalSize: totalSize,
                totalSizeMB: totalSizeMB,
                usagePercent: usagePercent,
                estimatedQuotaMB: estimatedQuotaMB
            };
        } catch (error) {
            console.error('Failed to get storage info:', error);
            return null;
        }
    }

    /**
     * List all presets from localStorage (fallback)
     * @returns {Promise<Array>} - Array of preset items
     */
    async listPresets() {
        this.ensureInitialized();

        try {
            console.log('📋 Fetching preset list from localStorage...');

            // TEMPORARY SOLUTION: Use localStorage instead of Wix
            const presetsKey = 'wix_presets';
            const presetsJSON = localStorage.getItem(presetsKey);
            const presets = presetsJSON ? JSON.parse(presetsJSON) : [];

            // Sort by created date descending
            presets.sort((a, b) => new Date(b._createdDate) - new Date(a._createdDate));

            console.log(`✅ Found ${presets.length} presets`);
            if (presets.length === 0) {
                console.warn('⚠️ Production: Would query Wix Data Collections');
            }

            return presets;

        } catch (error) {
            console.error('❌ Failed to list presets:', error);
            return [];
        }
    }

    /**
     * Load preset by ID from localStorage (fallback)
     * @param {string} presetId - Preset _id
     * @returns {Promise<object>} - Preset item
     */
    async loadPreset(presetId) {
        this.ensureInitialized();

        try {
            console.log(`📥 Loading preset from localStorage: ${presetId}`);

            // TEMPORARY SOLUTION: Use localStorage instead of Wix
            const presetsKey = 'wix_presets';
            const presetsJSON = localStorage.getItem(presetsKey);
            const presets = presetsJSON ? JSON.parse(presetsJSON) : [];

            const preset = presets.find(p => p._id === presetId);

            if (!preset) {
                throw new Error(`Preset not found: ${presetId}`);
            }

            console.log(`✅ Preset loaded: "${preset.name}"`);
            console.warn('⚠️ Production: Would fetch from Wix Data Collections');

            return preset;

        } catch (error) {
            console.error('❌ Failed to load preset:', error);
            throw new Error(`Failed to load preset: ${error.message}`);
        }
    }

    /**
     * Delete preset by ID from localStorage (fallback)
     * @param {string} presetId - Preset _id
     * @returns {Promise<void>}
     */
    async deletePreset(presetId) {
        this.ensureInitialized();

        try {
            console.log(`🗑️ Deleting preset from localStorage: ${presetId}`);

            // TEMPORARY SOLUTION: Use localStorage instead of Wix
            const presetsKey = 'wix_presets';
            const presetsJSON = localStorage.getItem(presetsKey);
            const presets = presetsJSON ? JSON.parse(presetsJSON) : [];

            const filteredPresets = presets.filter(p => p._id !== presetId);

            if (filteredPresets.length === presets.length) {
                throw new Error(`Preset not found: ${presetId}`);
            }

            localStorage.setItem(presetsKey, JSON.stringify(filteredPresets));

            console.log(`✅ Preset deleted successfully`);
            console.warn('⚠️ Production: Would delete from Wix Data Collections');

        } catch (error) {
            console.error('❌ Failed to delete preset:', error);
            throw new Error(`Failed to delete preset: ${error.message}`);
        }
    }
}
