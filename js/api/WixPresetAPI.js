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

            // Try loading existing tokens first
            const hasExistingTokens = this.loadTokens();

            if (hasExistingTokens) {
                // Check if token is still valid
                await this.ensureValidToken();
            } else {
                // Generate new visitor access token
                await this.generateAccessToken();
            }

            console.log('✅ Wix REST API initialized successfully');
            this.initialized = true;

        } catch (error) {
            console.error('❌ Failed to initialize Wix REST API:', error);
            throw new Error(`Wix initialization failed: ${error.message}`);
        }
    }

    /**
     * Generate visitor access token using OAuth
     * Uses Wix OAuth2 anonymous grant type for visitor access
     * Tokens expire after 4 hours (14,400 seconds)
     */
    async generateAccessToken() {
        try {
            console.log('🎫 Generating visitor access token...');
            console.log('   → Client ID:', this.clientId);

            // Wix OAuth2 endpoint for token generation
            const tokenEndpoint = 'https://www.wixapis.com/oauth2/token';

            // Request visitor (anonymous) token
            const response = await fetch(tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    clientId: this.clientId,
                    grantType: 'anonymous'
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Token generation failed: ${response.status} ${errorText}`);
            }

            const data = await response.json();

            // Store tokens
            this.accessToken = data.access_token;
            this.refreshToken = data.refresh_token;
            this.tokenExpiresAt = Date.now() + (data.expires_in * 1000);

            console.log('✅ Visitor token generated successfully');
            console.log('   → Token type:', data.token_type);
            console.log('   → Expires in:', data.expires_in, 'seconds (4 hours)');
            console.log('   → Token expiry:', new Date(this.tokenExpiresAt).toLocaleString());

            // Store tokens in localStorage for persistence
            this.saveTokens();

        } catch (error) {
            console.error('❌ Failed to generate access token:', error);
            throw error;
        }
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken() {
        try {
            console.log('🔄 Refreshing access token...');

            if (!this.refreshToken) {
                throw new Error('No refresh token available');
            }

            const tokenEndpoint = 'https://www.wixapis.com/oauth2/token';

            const response = await fetch(tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    clientId: this.clientId,
                    grantType: 'refresh_token',
                    refreshToken: this.refreshToken
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
            }

            const data = await response.json();

            // Update tokens
            this.accessToken = data.access_token;
            this.refreshToken = data.refresh_token || this.refreshToken;
            this.tokenExpiresAt = Date.now() + (data.expires_in * 1000);

            console.log('✅ Token refreshed successfully');
            console.log('   → New expiry:', new Date(this.tokenExpiresAt).toLocaleString());

            // Save updated tokens
            this.saveTokens();

        } catch (error) {
            console.error('❌ Failed to refresh token:', error);
            // If refresh fails, generate new token
            await this.generateAccessToken();
        }
    }

    /**
     * Check if token is expired and refresh if needed
     */
    async ensureValidToken() {
        const now = Date.now();
        const buffer = 5 * 60 * 1000; // 5 minutes buffer

        if (!this.accessToken || now >= (this.tokenExpiresAt - buffer)) {
            console.log('⚠️ Token expired or expiring soon, refreshing...');
            if (this.refreshToken) {
                await this.refreshAccessToken();
            } else {
                await this.generateAccessToken();
            }
        }
    }

    /**
     * Save tokens to localStorage for persistence
     */
    saveTokens() {
        try {
            localStorage.setItem('wix_access_token', this.accessToken);
            localStorage.setItem('wix_refresh_token', this.refreshToken);
            localStorage.setItem('wix_token_expires_at', this.tokenExpiresAt.toString());
            console.log('💾 Tokens saved to localStorage');
        } catch (error) {
            console.warn('⚠️ Failed to save tokens to localStorage:', error);
        }
    }

    /**
     * Load tokens from localStorage
     */
    loadTokens() {
        try {
            this.accessToken = localStorage.getItem('wix_access_token');
            this.refreshToken = localStorage.getItem('wix_refresh_token');
            const expiresAt = localStorage.getItem('wix_token_expires_at');
            if (expiresAt) {
                this.tokenExpiresAt = parseInt(expiresAt);
            }

            if (this.accessToken) {
                console.log('📦 Loaded existing tokens from localStorage');
                console.log('   → Expiry:', new Date(this.tokenExpiresAt).toLocaleString());
                return true;
            }
            return false;
        } catch (error) {
            console.warn('⚠️ Failed to load tokens from localStorage:', error);
            return false;
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
     * Upload image to Wix Media Manager
     * Falls back to data URLs if Wix upload fails
     * @param {HTMLImageElement|HTMLCanvasElement} imageElement
     * @param {string} filename - Optional custom filename
     * @returns {Promise<string>} - Image URL (Wix CDN URL or data URL fallback)
     */
    async uploadImage(imageElement, filename = null) {
        this.ensureInitialized();

        try {
            console.log(`📤 Uploading image to Wix Media Manager: ${filename}`);

            // Ensure token is valid
            await this.ensureValidToken();

            // Convert image to blob
            const blob = await this.imageToBlob(imageElement);
            console.log(`   → Blob size: ${(blob.size / 1024).toFixed(2)} KB`);

            // Generate upload URL from Wix
            const uploadData = await this.generateMediaUploadUrl('image/png', filename);
            console.log(`   → Upload URL generated`);
            console.log(`   → File ID: ${uploadData.fileId}`);

            // Upload blob to Wix CDN
            const cdnUrl = await this.uploadToWixCDN(uploadData.uploadUrl, blob);
            console.log(`✅ Image uploaded to Wix CDN`);
            console.log(`   → CDN URL: ${cdnUrl}`);

            return cdnUrl;

        } catch (error) {
            console.error('❌ Wix upload failed, falling back to data URL:', error);

            // Fallback to data URL
            try {
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
                console.log(`⚠️ Using data URL fallback (${(dataURL.length / 1024).toFixed(2)} KB)`);
                return dataURL;

            } catch (fallbackError) {
                console.error('❌ Fallback failed:', fallbackError);
                throw new Error(`Failed to process image: ${fallbackError.message}`);
            }
        }
    }

    /**
     * Generate upload URL from Wix Media Manager
     * @param {string} mimeType - MIME type (e.g., 'image/png')
     * @param {string} filename - Optional filename
     * @returns {Promise<{uploadUrl: string, fileId: string}>}
     */
    async generateMediaUploadUrl(mimeType, filename = null) {
        try {
            const endpoint = `${this.baseURL}/site-media/v1/files/generate-upload-url`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    mimeType: mimeType,
                    options: filename ? { filename: filename } : {}
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload URL generation failed: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            return {
                uploadUrl: data.uploadUrl,
                fileId: data.fileId
            };

        } catch (error) {
            console.error('❌ Failed to generate upload URL:', error);
            throw error;
        }
    }

    /**
     * Upload blob to Wix CDN using upload URL
     * @param {string} uploadUrl - Upload URL from generateMediaUploadUrl
     * @param {Blob} blob - Image blob
     * @returns {Promise<string>} - CDN URL
     */
    async uploadToWixCDN(uploadUrl, blob) {
        try {
            const response = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': blob.type || 'application/octet-stream'
                },
                body: blob
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`CDN upload failed: ${response.status} ${errorText}`);
            }

            // Extract CDN URL from upload URL (before query params)
            const cdnUrl = uploadUrl.split('?')[0];
            return cdnUrl;

        } catch (error) {
            console.error('❌ Failed to upload to CDN:', error);
            throw error;
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
