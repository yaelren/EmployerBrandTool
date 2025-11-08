/**
 * Quick demo script to create a text content slot
 * Paste this in your browser console when the app is loaded
 */

(function createTextSlotDemo() {
    console.log('🧪 Creating Text Content Slot Demo');

    // Check if app is ready
    if (!window.app || !window.app.grid) {
        console.error('❌ App not ready. Please wait for app to initialize.');
        return;
    }

    // Get all cells
    const cells = window.app.grid.getAllCells();
    console.log(`Found ${cells.length} cells total`);

    // Find a content cell (not main-text)
    const contentCell = cells.find(c => c.type === 'content' && c.id !== 1 && c.id !== 11);

    if (!contentCell) {
        console.error('❌ No suitable content cell found');
        return;
    }

    console.log(`✅ Selected cell ID ${contentCell.id}:`, contentCell);

    // First, add text content to the cell
    console.log('📝 Adding text content to cell...');

    // Find the cell in the grid's cells array
    const gridCell = window.app.grid.cells.find(c => c.id === contentCell.id);

    if (gridCell) {
        // Change cell type to 'text' and add text content
        gridCell.type = 'text';
        gridCell.content = {
            type: 'text',
            text: 'Sample Text',
            fontSize: 32,
            fontFamily: 'Wix Madefor Display',
            color: '#000000',
            align: 'center'
        };

        console.log('✅ Cell converted to text type');

        // Re-render to show the text
        window.app.render();

        // Now create a content slot for this text cell
        const config = {
            fieldName: 'sampleText',
            fieldLabel: 'Sample Text',
            fieldDescription: 'Text content slot example',
            required: true,
            constraints: {
                maxCharacters: 30,
                minFontSize: 20,
                maxFontSize: 48
            }
        };

        try {
            const slot = window.app.presetPageManager.contentSlotManager.createSlotFromCell(gridCell, config);
            window.app.presetPageManager.contentSlotManager.addSlot(slot);

            console.log('✅ Content slot created:', slot);

            // Show the overlay
            if (window.app.contentSlotOverlay) {
                window.app.contentSlotOverlay.show();
                console.log('✅ Content slots overlay enabled');
                console.log('💡 Click "📝 Hide Content Slots" to toggle off');
            }

            return slot;
        } catch (error) {
            console.error('❌ Error creating slot:', error);
            return null;
        }
    } else {
        console.error('❌ Could not find cell in grid');
        return null;
    }
})();
