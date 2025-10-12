/**
 * Test Font File Generator
 * This creates a simple test font file for testing font upload functionality
 */

// This is a placeholder for testing - in a real scenario, you would use actual font files
// For testing purposes, we'll create a simple data URL that represents a font file

const testFontData = {
    name: 'Test Font',
    dataUrl: 'data:font/woff2;base64,d09GMgABAAAAAA==', // Minimal valid font data
    fileName: 'test-font.woff2',
    size: 1024
};

console.log('Test font data created:', testFontData);

// Export for use in tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = testFontData;
}
