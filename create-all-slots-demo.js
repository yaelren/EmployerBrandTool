/**
 * Create content slots for ALL cells in the grid
 * This will show blue boxes for text cells and purple boxes for image cells
 *
 * Paste this in your browser console after the app is loaded
 */

(function createAllSlotsDemo() {
    console.log('🧪 Creating Content Slots for ALL Grid Cells');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Check if app is ready
    if (!window.app || !window.app.grid) {
        console.error('❌ App not ready. Please wait for app to initialize.');
        return;
    }

    // Clear any existing slots
    const manager = window.app.presetPageManager.contentSlotManager;
    manager.slots = [];
    console.log('🗑️  Cleared existing slots');

    // Get all cells
    const cells = window.app.grid.getAllCells();
    console.log(`📋 Found ${cells.length} cells in grid`);

    let textSlotCount = 0;
    let imageSlotCount = 0;
    const results = [];

    // Create a slot for each cell (skip empty cells)
    cells.forEach((cell, index) => {
        try {
            // Skip empty content cells
            if (cell.type === 'content' && (!cell.content || cell.content.type === 'empty')) {
                console.log(`⏭️  Skipped empty cell ${cell.id}`);
                return;
            }

            // Determine actual content type
            let isTextCell = false;
            if (cell.type === 'main-text' || cell.type === 'text') {
                isTextCell = true;
            } else if (cell.type === 'content' && cell.content) {
                // Check if content cell has text
                isTextCell = cell.content.type === 'text' || cell.content.text !== undefined;
            }

            const cellTypeLabel = isTextCell ? 'TEXT' : 'IMAGE';

            let config;

            if (isTextCell) {
                // Text slot configuration
                config = {
                    fieldName: `text${cell.id}`,
                    fieldLabel: `Text Cell ${cell.id}`,
                    fieldDescription: `Text content slot for cell ${cell.id}`,
                    required: true,
                    constraints: {
                        maxCharacters: 100,
                        minFontSize: 16,
                        maxFontSize: 72
                    }
                };
                textSlotCount++;
            } else {
                // Image slot configuration
                config = {
                    fieldName: `image${cell.id}`,
                    fieldLabel: `Image Cell ${cell.id}`,
                    fieldDescription: `Image content slot for cell ${cell.id}`,
                    required: false,
                    constraints: {
                        fitMode: 'cover',
                        maxFileSize: 10485760 // 10MB
                    }
                };
                imageSlotCount++;
            }

            // Create and add the slot
            const slot = manager.createSlotFromCell(cell, config);
            manager.addSlot(slot);

            results.push({
                cellId: cell.id,
                type: cellTypeLabel,
                slotId: slot.slotId,
                bounds: slot.boundingBox,
                success: true
            });

            console.log(`✅ ${cellTypeLabel} Cell ${cell.id}: ${slot.boundingBox.width.toFixed(0)}×${slot.boundingBox.height.toFixed(0)}px at (${slot.boundingBox.x.toFixed(0)}, ${slot.boundingBox.y.toFixed(0)})`);

        } catch (error) {
            results.push({
                cellId: cell.id,
                type: 'ERROR',
                error: error.message,
                success: false
            });
            console.error(`❌ Failed to create slot for cell ${cell.id}:`, error.message);
        }
    });

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 SUMMARY:`);
    console.log(`   Total cells: ${cells.length}`);
    console.log(`   🔵 Text slots: ${textSlotCount}`);
    console.log(`   🟣 Image slots: ${imageSlotCount}`);
    console.log(`   ✅ Success: ${results.filter(r => r.success).length}`);
    console.log(`   ❌ Failed: ${results.filter(r => !r.success).length}`);

    // Show the overlay
    if (window.app.contentSlotOverlay) {
        window.app.contentSlotOverlay.show();
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✨ Content Slots Overlay ENABLED');
        console.log('');
        console.log('Look at your canvas - you should see:');
        console.log('  🔵 BLUE boxes = Text cells');
        console.log('  🟣 PURPLE boxes = Image cells');
        console.log('');
        console.log('Each box shows:');
        console.log('  • Dashed border with glow effect');
        console.log('  • Label at top showing field name and type');
        console.log('  • Corner indicators (L-shapes)');
        console.log('  • Constraints badge at bottom-right');
        console.log('');
        console.log('💡 Click "📝 Hide Content Slots" button to toggle off');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
        console.warn('⚠️  ContentSlotOverlay not initialized');
    }

    // Return results for inspection
    return {
        totalCells: cells.length,
        textSlots: textSlotCount,
        imageSlots: imageSlotCount,
        slots: manager.getAllSlots(),
        results: results
    };
})();
