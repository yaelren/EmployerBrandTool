/**
 * enduser-app.js
 * Sprint 4: End-User Application Entry Point
 *
 * Initializes the end-user interface for filling content slots.
 * This is a simplified version of app.js without designer controls.
 *
 * Workflow:
 * 1. Initialize canvas and core systems
 * 2. Initialize Wix CMS connection
 * 3. Initialize end-user components
 * 4. Show preset selector
 */

(async function initializeEndUserApp() {
    console.log('🚀 Initializing End-User Interface...');

    try {
        // ========== Step 1: Initialize Canvas ==========
        // Note: Canvas must be id="chatooly-canvas" for Chatooly CDN compatibility
        const canvas = document.getElementById('chatooly-canvas');
        if (!canvas) {
            throw new Error('Canvas element not found');
        }

        // Set canvas size (1080 x 1920 portrait format)
        const canvasWidth = 1080;
        const canvasHeight = 1920;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const ctx = canvas.getContext('2d');
        console.log(`✅ Canvas initialized: ${canvasWidth}x${canvasHeight}`);

        // ========== Step 2: Initialize Core Systems ==========

        // Canvas Manager
        const canvasManager = new CanvasManager(canvas, ctx, canvasWidth, canvasHeight);
        console.log('✅ CanvasManager initialized');

        // Background Manager
        const backgroundManager = new BackgroundManager(canvasManager);
        canvasManager.backgroundManager = backgroundManager;
        console.log('✅ BackgroundManager initialized');

        // Layer Manager
        const layerManager = new LayerManager(canvasManager);
        canvasManager.layerManager = layerManager;
        console.log('✅ LayerManager initialized');

        // Grid Builder
        const gridBuilder = new GridBuilder(canvasManager);
        canvasManager.gridBuilder = gridBuilder;
        console.log('✅ GridBuilder initialized');

        // Font Manager
        const fontManager = new FontManager();
        // Note: Custom fonts will be loaded after Wix initialization
        console.log('✅ FontManager initialized');

        // Content Slot Manager
        const contentSlotManager = new ContentSlotManager();
        console.log('✅ ContentSlotManager initialized');

        // ========== Step 3: Initialize Wix CMS ==========

        let wixAPI = null;
        let presetPageManager = null;

        try {
            console.log('🔄 Initializing Wix Cloud Backend...');

            // Dynamically import Wix modules
            const { WixPresetAPI } = await import('./api/WixPresetAPI.js');
            const { WIX_CONFIG } = await import('./config/wix-config.js');

            wixAPI = new WixPresetAPI();
            await wixAPI.initialize(WIX_CONFIG.clientId, null, WIX_CONFIG.siteId);

            console.log('✅ Wix Cloud Backend initialized');

            // Initialize PresetPageManager (needs minimal app-like object)
            const minimalApp = {
                canvasManager,
                backgroundManager,
                layerManager,
                gridBuilder,
                fontManager,
                contentSlotManager,
                render: () => canvasManager.render()
            };

            presetPageManager = new PresetPageManager(minimalApp);
            await presetPageManager.initializeWix(wixAPI);

            console.log('✅ PresetPageManager initialized with Wix');

            // Load custom fonts from Wix (optional)
            try {
                await fontManager.loadCustomFontsFromStorage();
                console.log('✅ Custom fonts loaded');
            } catch (error) {
                console.warn('⚠️ Could not load custom fonts:', error);
            }

        } catch (error) {
            console.error('❌ Wix initialization failed:', error);
            console.warn('⚠️ Continuing without Wix Cloud Backend');

            // Show error message to user
            const presetName = document.getElementById('presetName');
            if (presetName) {
                presetName.textContent = 'Wix Cloud Backend unavailable - please check configuration';
                presetName.style.color = '#ff4444';
            }

            throw new Error('Wix CMS is required for end-user interface');
        }

        // ========== Step 4: Initialize End-User Components ==========

        // Form Generator
        const formContainer = document.getElementById('pageSectionsContainer');
        const formGenerator = new FormGenerator(formContainer);
        console.log('✅ FormGenerator initialized');

        // Content Slot Renderer
        const contentSlotRenderer = new ContentSlotRenderer(canvasManager, presetPageManager);
        console.log('✅ ContentSlotRenderer initialized');

        // End User Controller (main coordinator)
        const endUserController = new EndUserController(canvasManager, presetPageManager, wixAPI);
        endUserController.setComponents(formGenerator, contentSlotRenderer);
        console.log('✅ EndUserController initialized');

        // ========== Step 5: Initial Render ==========

        // Render empty canvas with empty render data
        canvasManager.render({
            textLines: [],
            textConfig: {},
            spots: []
        });

        // Make controller available globally for debugging
        window.endUserApp = {
            canvasManager,
            presetPageManager,
            formGenerator,
            contentSlotRenderer,
            endUserController,
            wixAPI
        };

        console.log('✅ End-User Interface Ready!');
        console.log('📝 Use window.endUserApp to access components in console');

    } catch (error) {
        console.error('❌ Failed to initialize end-user interface:', error);

        // Show error to user
        const container = document.querySelector('.enduser-container');
        if (container) {
            container.innerHTML = `
                <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    padding: 40px;
                    text-align: center;
                    background: #0a0a0a;
                    color: #e5e5e5;
                ">
                    <div style="font-size: 64px; margin-bottom: 24px;">⚠️</div>
                    <h1 style="font-size: 24px; margin-bottom: 16px;">Initialization Failed</h1>
                    <p style="font-size: 16px; color: #999; margin-bottom: 24px;">
                        ${error.message}
                    </p>
                    <details style="max-width: 600px; text-align: left;">
                        <summary style="cursor: pointer; margin-bottom: 12px;">Show Error Details</summary>
                        <pre style="
                            background: #1a1a1a;
                            padding: 16px;
                            border-radius: 8px;
                            overflow: auto;
                            font-size: 12px;
                            color: #ff4444;
                        ">${error.stack || error.message}</pre>
                    </details>
                </div>
            `;
        }
    }
})();
