/**
 * Phase 1 Validation Tests
 * Tests for Unified Grid System foundation components
 *
 * HOW TO RUN:
 * 1. Open index.html in browser
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire file into console
 * 4. Run: runPhase1Tests()
 */

function runPhase1Tests() {
    console.log('🧪 ========================================');
    console.log('🧪 Phase 1 Validation Tests Starting...');
    console.log('🧪 ========================================\n');

    let passed = 0;
    let failed = 0;

    function assert(condition, testName) {
        if (condition) {
            console.log(`✅ PASS: ${testName}`);
            passed++;
            return true;
        } else {
            console.error(`❌ FAIL: ${testName}`);
            failed++;
            return false;
        }
    }

    function assertThrows(fn, testName) {
        try {
            fn();
            console.error(`❌ FAIL: ${testName} (should have thrown)`);
            failed++;
            return false;
        } catch (e) {
            console.log(`✅ PASS: ${testName}`);
            passed++;
            return true;
        }
    }

    // ===== TEST GROUP 1: GridCell Base Class =====
    console.log('\n📦 Test Group 1: GridCell Base Class');
    console.log('─────────────────────────────────────');

    try {
        const cell = new GridCell(0, 1);

        assert(cell.row === 0, 'GridCell: row property initialized');
        assert(cell.col === 1, 'GridCell: col property initialized');
        assert(cell.id === null, 'GridCell: id starts as null');
        assert(cell.contentId !== null, 'GridCell: contentId auto-generated');
        assert(cell.contentId.includes('-'), 'GridCell: contentId is UUID format');
        assert(cell.type === 'base', 'GridCell: type is base');
        assert(cell.animation === null, 'GridCell: animation starts null');
        assert(cell.currentOffset.x === 0 && cell.currentOffset.y === 0, 'GridCell: currentOffset initialized');

        // Test contentId uniqueness
        const cell2 = new GridCell(0, 2);
        assert(cell.contentId !== cell2.contentId, 'GridCell: contentId is unique per instance');

        // Test serialization
        cell.id = 5;
        const serialized = cell.serialize();
        assert(serialized.id === 5, 'GridCell: serialization includes id');
        assert(serialized.contentId === cell.contentId, 'GridCell: serialization includes contentId');
        assert(serialized.row === 0, 'GridCell: serialization includes row');
        assert(serialized.col === 1, 'GridCell: serialization includes col');
        assert(serialized.animation === null, 'GridCell: serialization includes animation state');

    } catch (e) {
        console.error(`❌ GridCell test error: ${e.message}`);
        failed++;
    }

    // ===== TEST GROUP 2: MainTextCell =====
    console.log('\n📝 Test Group 2: MainTextCell');
    console.log('─────────────────────────────────────');

    try {
        const textCell = new MainTextCell('HELLO', 0, 0, 1);

        assert(textCell instanceof GridCell, 'MainTextCell: extends GridCell');
        assert(textCell.type === 'main-text', 'MainTextCell: type is main-text');
        assert(textCell.text === 'HELLO', 'MainTextCell: text property set');
        assert(textCell.lineIndex === 0, 'MainTextCell: lineIndex property set');
        assert(textCell.contentId.startsWith('text-0-'), 'MainTextCell: contentId is content-based');

        // Test content-based ID consistency
        const textCell2 = new MainTextCell('HELLO', 0, 1, 1);
        assert(textCell.contentId === textCell2.contentId, 'MainTextCell: same text = same contentId');

        const textCell3 = new MainTextCell('WORLD', 0, 0, 2);
        assert(textCell.contentId !== textCell3.contentId, 'MainTextCell: different text = different contentId');

        // Test setText updates contentId
        const oldId = textCell.contentId;
        textCell.setText('GOODBYE');
        assert(textCell.text === 'GOODBYE', 'MainTextCell: setText updates text');
        assert(textCell.contentId !== oldId, 'MainTextCell: setText updates contentId');

        // Test serialization
        const serialized = textCell.serialize();
        assert(serialized.text === 'GOODBYE', 'MainTextCell: serialization includes text');
        assert(serialized.lineIndex === 0, 'MainTextCell: serialization includes lineIndex');
        assert(serialized.style !== undefined, 'MainTextCell: serialization includes style');

    } catch (e) {
        console.error(`❌ MainTextCell test error: ${e.message}`);
        failed++;
    }

    // ===== TEST GROUP 3: ContentCell =====
    console.log('\n🎨 Test Group 3: ContentCell');
    console.log('─────────────────────────────────────');

    try {
        const contentCell = new ContentCell('empty', 0, 2);

        assert(contentCell instanceof GridCell, 'ContentCell: extends GridCell');
        assert(contentCell.type === 'content', 'ContentCell: type is content');
        assert(contentCell.contentType === 'empty', 'ContentCell: contentType set');
        assert(contentCell.content === null, 'ContentCell: empty content is null');

        // Test type checking methods
        assert(contentCell.isEmpty() === true, 'ContentCell: isEmpty() works for empty');
        assert(contentCell.hasImage() === false, 'ContentCell: hasImage() false for empty');
        assert(contentCell.hasText() === false, 'ContentCell: hasText() false for empty');
        assert(contentCell.isMask() === false, 'ContentCell: isMask() false for empty');

        // Test setContentType
        contentCell.setContentType('image');
        assert(contentCell.contentType === 'image', 'ContentCell: setContentType updates type');
        assert(contentCell.content !== null, 'ContentCell: setContentType initializes default content');
        assert(contentCell.content.scale === 1.0, 'ContentCell: image default content has scale');

        // Test spatial methods
        contentCell.bounds = { x: 100, y: 200, width: 50, height: 75 };
        assert(contentCell.contains(125, 225) === true, 'ContentCell: contains() true for point inside');
        assert(contentCell.contains(50, 50) === false, 'ContentCell: contains() false for point outside');

        const center = contentCell.getCenter();
        assert(center.x === 125 && center.y === 237.5, 'ContentCell: getCenter() calculates correctly');

        assert(contentCell.getArea() === 3750, 'ContentCell: getArea() calculates correctly');
        assert(contentCell.getAspectRatio() === (50/75), 'ContentCell: getAspectRatio() calculates correctly');

        // Test serialization
        const serialized = contentCell.serialize();
        assert(serialized.contentType === 'image', 'ContentCell: serialization includes contentType');
        assert(serialized.content !== null, 'ContentCell: serialization includes content');

    } catch (e) {
        console.error(`❌ ContentCell test error: ${e.message}`);
        failed++;
    }

    // ===== TEST GROUP 4: Animation with contentId =====
    console.log('\n✨ Test Group 4: Animation with contentId');
    console.log('─────────────────────────────────────');

    try {
        const animCell = new MainTextCell('ANIMATE', 0, 0, 0);
        const originalContentId = animCell.contentId;

        // Test setAnimation
        animCell.setAnimation('sway', 20, 1.0);
        assert(animCell.animation !== null, 'Animation: setAnimation creates animation');
        assert(animCell.animation.type === 'sway', 'Animation: animation type set correctly');
        assert(animCell.animation.intensity === 20, 'Animation: animation intensity set');
        assert(animCell.animation.speed === 1.0, 'Animation: animation speed set');
        assert(animCell.contentId === originalContentId, 'Animation: contentId unchanged by animation');

        // Test animation serialization
        const serialized = animCell.serialize();
        assert(serialized.animation !== null, 'Animation: serialization includes animation');
        assert(serialized.animation.type === 'sway', 'Animation: serialized animation type correct');
        assert(serialized.animation.intensity === 20, 'Animation: serialized animation intensity correct');
        assert(serialized.animation.isPlaying === false, 'Animation: serialized isPlaying state');

        // Test removeAnimation
        animCell.removeAnimation();
        assert(animCell.animation === null, 'Animation: removeAnimation clears animation');
        assert(animCell.currentOffset.x === 0 && animCell.currentOffset.y === 0, 'Animation: removeAnimation resets offset');

    } catch (e) {
        console.error(`❌ Animation test error: ${e.message}`);
        failed++;
    }

    // ===== TEST GROUP 5: Grid Helper Methods =====
    console.log('\n🗺️ Test Group 5: Grid Helper Methods');
    console.log('─────────────────────────────────────');

    try {
        // Create a test grid
        const testGrid = new Grid({ spots: [], textEngine: {} });

        // Manually create a test matrix
        testGrid.matrix = [
            [
                new ContentCell('empty', 0, 0),
                new MainTextCell('HELLO', 0, 0, 1),
                new ContentCell('image', 0, 2)
            ],
            [
                new ContentCell('empty', 1, 0),
                new MainTextCell('WORLD', 1, 1, 1),
                new ContentCell('text', 1, 2)
            ]
        ];
        testGrid.rows = 2;
        testGrid.cols = 3;

        // Assign sequential IDs
        testGrid.assignSequentialIds();

        // Test assignSequentialIds
        assert(testGrid.matrix[0][0].id === 1, 'Grid: assignSequentialIds starts at 1');
        assert(testGrid.matrix[0][1].id === 2, 'Grid: assignSequentialIds increments correctly');
        assert(testGrid.matrix[1][2].id === 6, 'Grid: assignSequentialIds reaches last cell');

        // Test getCellById
        const cell2 = testGrid.getCellById(2);
        assert(cell2 !== null && cell2.id === 2, 'Grid: getCellById finds cell');
        assert(cell2.text === 'HELLO', 'Grid: getCellById returns correct cell');

        const noCell = testGrid.getCellById(999);
        assert(noCell === null, 'Grid: getCellById returns null for invalid ID');

        // Test getCellByContentId
        const contentId = testGrid.matrix[0][1].contentId;
        const cellByContent = testGrid.getCellByContentId(contentId);
        assert(cellByContent !== null, 'Grid: getCellByContentId finds cell');
        assert(cellByContent.contentId === contentId, 'Grid: getCellByContentId returns correct cell');

        // Test getTextCells
        const textCells = testGrid.getTextCells();
        assert(textCells.length === 2, 'Grid: getTextCells returns correct count');
        assert(textCells[0].text === 'HELLO', 'Grid: getTextCells finds first text');
        assert(textCells[1].text === 'WORLD', 'Grid: getTextCells finds second text');

        // Test getContentCells
        const contentCells = testGrid.getContentCells();
        assert(contentCells.length === 4, 'Grid: getContentCells returns correct count');

        // Test getEmptyContentCells
        // Initially all ContentCells are empty (content=null): [0][0], [0][2], [1][0], [1][2]
        let emptyCells = testGrid.getEmptyContentCells();
        assert(emptyCells.length === 4, 'Grid: getEmptyContentCells counts initial empty cells');

        // Make one cell non-empty
        testGrid.matrix[0][2].setContent({ image: 'mock' });
        emptyCells = testGrid.getEmptyContentCells();
        assert(emptyCells.length === 3, 'Grid: getEmptyContentCells filters correctly');

        // Test getCellsInRow
        const row0 = testGrid.getCellsInRow(0);
        assert(row0.length === 3, 'Grid: getCellsInRow returns all cells in row');

        const invalidRow = testGrid.getCellsInRow(999);
        assert(invalidRow.length === 0, 'Grid: getCellsInRow returns empty for invalid row');

        // Test getCellsInColumn
        const col1 = testGrid.getCellsInColumn(1);
        assert(col1.length === 2, 'Grid: getCellsInColumn returns all cells in column');

        // Test contains for getCellAt
        testGrid.matrix[0][0].bounds = { x: 0, y: 0, width: 100, height: 100 };
        testGrid.matrix[0][1].bounds = { x: 100, y: 0, width: 200, height: 100 };

        const cellAt = testGrid.getCellAt(50, 50);
        assert(cellAt !== null, 'Grid: getCellAt finds cell at position');
        assert(cellAt.id === 1, 'Grid: getCellAt returns correct cell');

    } catch (e) {
        console.error(`❌ Grid helper methods test error: ${e.message}`);
        failed++;
    }

    // ===== TEST GROUP 6: Animation Persistence =====
    console.log('\n♻️ Test Group 6: Animation Persistence');
    console.log('─────────────────────────────────────');

    try {
        const grid = new Grid({ spots: [], textEngine: {} });

        // Create cells with animations
        const cell1 = new MainTextCell('TEST', 0, 0, 0);
        cell1.id = 1;
        cell1.setAnimation('sway', 20, 1.0);
        cell1.animation.isPlaying = true;

        const cell2 = new ContentCell('image', 0, 1);
        cell2.id = 2;
        cell2.setAnimation('bounce', 15, 0.8);
        cell2.animation.isPlaying = false;

        grid.matrix = [[cell1, cell2]];
        grid.rows = 1;
        grid.cols = 2;

        // Capture animation state
        const state = grid.captureAnimationState();
        assert(Object.keys(state).length === 2, 'Grid: captureAnimationState captures all animations');
        assert(state[cell1.contentId] !== undefined, 'Grid: captureAnimationState uses contentId as key');
        assert(state[cell1.contentId].type === 'sway', 'Grid: captureAnimationState saves type');
        assert(state[cell1.contentId].intensity === 20, 'Grid: captureAnimationState saves intensity');
        assert(state[cell1.contentId].isPlaying === true, 'Grid: captureAnimationState saves playing state');

        // Clear animations
        cell1.removeAnimation();
        cell2.removeAnimation();
        assert(cell1.animation === null, 'Grid: animations cleared');

        // Restore animation state
        grid.restoreAnimationState(state);
        assert(cell1.animation !== null, 'Grid: restoreAnimationState recreates animation');
        assert(cell1.animation.type === 'sway', 'Grid: restoreAnimationState restores type');
        assert(cell1.animation.intensity === 20, 'Grid: restoreAnimationState restores intensity');

    } catch (e) {
        console.error(`❌ Animation persistence test error: ${e.message}`);
        failed++;
    }

    // ===== TEST GROUP 7: Waiting Content System =====
    console.log('\n⏳ Test Group 7: Waiting Content System');
    console.log('─────────────────────────────────────');

    try {
        const grid = new Grid({ spots: [], textEngine: {} });

        // Create content cell with image
        const imageCell = new ContentCell('image', 0, 0);
        imageCell.bounds = { x: 100, y: 100, width: 200, height: 150 };
        imageCell.setContentType('image');
        imageCell.setContent({ image: 'mock-image', scale: 1.5 });

        grid.matrix = [[imageCell]];
        grid.rows = 1;
        grid.cols = 1;

        // Test captureDisappearingContent
        grid.captureDisappearingContent();
        assert(grid.waitingContent.length === 1, 'Grid: captureDisappearingContent saves content');
        assert(grid.waitingContent[0].contentType === 'image', 'Grid: waitingContent preserves contentType');
        assert(grid.waitingContent[0].contentId === imageCell.contentId, 'Grid: waitingContent preserves contentId');
        assert(grid.waitingContent[0].lastPosition !== undefined, 'Grid: waitingContent saves position');
        assert(grid.waitingContent[0].lastPosition.x === 200, 'Grid: waitingContent calculates center X');
        assert(grid.waitingContent[0].lastPosition.y === 175, 'Grid: waitingContent calculates center Y');

        // Test findNearestCell
        const emptyCell1 = new ContentCell('empty', 0, 0);
        emptyCell1.bounds = { x: 50, y: 50, width: 100, height: 100 };

        const emptyCell2 = new ContentCell('empty', 0, 1);
        emptyCell2.bounds = { x: 300, y: 300, width: 100, height: 100 };

        const nearest = grid.findNearestCell({ x: 100, y: 100 }, [emptyCell1, emptyCell2]);
        assert(nearest === emptyCell1, 'Grid: findNearestCell finds closest cell');

        // Test calculateDistance
        const dist = grid.calculateDistance({ x: 0, y: 0 }, { x: 3, y: 4 });
        assert(dist === 5, 'Grid: calculateDistance calculates Euclidean distance');

    } catch (e) {
        console.error(`❌ Waiting content test error: ${e.message}`);
        failed++;
    }

    // ===== TEST GROUP 8: CellRenderer (Basic) =====
    console.log('\n🎨 Test Group 8: CellRenderer');
    console.log('─────────────────────────────────────');

    try {
        assert(typeof CellRenderer !== 'undefined', 'CellRenderer: class exists');
        assert(typeof CellRenderer.render === 'function', 'CellRenderer: render method exists');
        assert(typeof CellRenderer.renderTextCell === 'function', 'CellRenderer: renderTextCell exists');
        assert(typeof CellRenderer.renderContentCell === 'function', 'CellRenderer: renderContentCell exists');
        assert(typeof CellRenderer.renderImage === 'function', 'CellRenderer: renderImage exists');
        assert(typeof CellRenderer.renderSpotText === 'function', 'CellRenderer: renderSpotText exists');
        assert(typeof CellRenderer.renderMask === 'function', 'CellRenderer: renderMask exists');
        assert(typeof CellRenderer.renderEmpty === 'function', 'CellRenderer: renderEmpty exists');

        // Note: Full rendering tests require canvas context and would be visual tests

    } catch (e) {
        console.error(`❌ CellRenderer test error: ${e.message}`);
        failed++;
    }

    // ===== SUMMARY =====
    console.log('\n');
    console.log('🧪 ========================================');
    console.log('🧪 Phase 1 Test Results');
    console.log('🧪 ========================================');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed === 0) {
        console.log('🎉 All tests passed! Phase 1 is solid.');
        console.log('✨ Ready to proceed to Phase 2.');
    } else {
        console.log('⚠️  Some tests failed. Review errors above.');
    }

    console.log('🧪 ========================================\n');

    return { passed, failed, successRate: (passed / (passed + failed)) * 100 };
}

// Auto-run message
console.log('💡 Phase 1 Validation Tests Loaded');
console.log('💡 Run: runPhase1Tests()');
