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
        // ========== Step 1: Initialize Full EmployerBrandTool App ==========
        console.log('🚀 Initializing Full EmployerBrandTool Instance...');

        // Create full app instance (same as designer mode)
        const app = new EmployerBrandToolPOC();
        await app.initialize();
        console.log('✅ Full EmployerBrandTool initialized');

        // Hide designer-specific UI elements (keep canvas visible)
        if (app.uiManager) {
            // Hide sidebar tabs we don't need
            const sidebarTabs = document.querySelectorAll('.sidebar-tab');
            sidebarTabs.forEach(tab => {
                tab.style.display = 'none';
            });

            // Hide any designer-specific panels
            const designerPanels = document.querySelectorAll('.sidebar-panel');
            designerPanels.forEach(panel => {
                panel.style.display = 'none';
            });

            console.log('✅ Designer UI elements hidden');
        }

        // ========== Step 2: Initialize Wix CMS ==========

        let wixAPI = null;

        try {
            console.log('🔄 Initializing Wix Cloud Backend...');

            // Dynamically import Wix modules
            const { WixPresetAPI } = await import('./api/WixPresetAPI.js');
            const { WIX_CONFIG } = await import('./config/wix-config.js');

            wixAPI = new WixPresetAPI();
            await wixAPI.initialize(WIX_CONFIG.clientId, null, WIX_CONFIG.siteId);

            console.log('✅ Wix Cloud Backend initialized');

            // Initialize PresetPageManager with full app
            await app.presetPageManager.initializeWix(wixAPI);

            console.log('✅ PresetPageManager initialized with Wix');

            // Load custom fonts from Wix (optional)
            try {
                await app.uiManager.fontManager.loadCustomFontsFromStorage();
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

        // ========== Step 3: Initialize End-User Components ==========

        // Form Generator
        const formContainer = document.getElementById('pageSectionsContainer');
        const formGenerator = new FormGenerator(formContainer);
        console.log('✅ FormGenerator initialized');

        // Content Slot Renderer (simplified - only for overlay)
        const contentSlotRenderer = new ContentSlotRenderer(app.canvasManager, app.presetPageManager);
        console.log('✅ ContentSlotRenderer initialized');

        // End User Controller (main coordinator) - now accepts full app
        const endUserController = new EndUserController(app, wixAPI);
        endUserController.setComponents(formGenerator, contentSlotRenderer);
        console.log('✅ EndUserController initialized');

        // ========== Step 4: Initial Render ==========

        // Render empty canvas
        app.render();

        // Make controller available globally for debugging
        window.endUserApp = {
            app,  // Full app instance
            endUserController,
            formGenerator,
            contentSlotRenderer,
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
