/* 
 * Employer Brand Tool - Configuration
 * Author: Yael Renous - Studio Video
 */

// ========== EDIT THIS: Chatooly Configuration ==========
window.ChatoolyConfig = {
    // REQUIRED: Your tool name
    name: "employer-brand-tool",  // e.g., "my-awesome-tool"

    // OPTIONAL: Export settings
    resolution: 2,              // 1, 2, or 4
    buttonPosition: "bottom-right",

    // OPTIONAL: Feature opt-in/opt-out (all features enabled by default)
    features: {
        exportButton: true,      // Export button in sidebar footer
        exportModal: true,       // Export modal UI
        publishButton: false,    // Publish to Hub button (DISABLED for this tool)
        canvasResizeBar: true,   // Canvas resize bar UI
        backgroundControls: true // Background color/gradient controls
    },

    // REQUIRED FOR PUBLISHING: Tool metadata
    category: "generators",     // Choose one: "generators", "visualizers", "editors", "utilities", "games", "art"
    tags: ["branding", "hr", "recruitment", "design", "marketing"],         // Add relevant tags e.g., ["creative", "interactive", "design"]
    description: "Create professional employer brand materials and visual assets for recruitment and HR purposes",  // Brief description of what your tool does
    version: "1.0.0",
    author: "Yael Renous - Studio Video"        // Your name or handle
};