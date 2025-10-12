# Background and Layer Refactoring Implementation Tasks

## Overview

This document provides detailed implementation tasks for the background and layer refactoring system. Tasks are organized by phase and include specific file modifications, code changes, and testing requirements.

## Phase 1: Core Background System

### Task 1.1: Create BackgroundManager Class

**Files to Create:**
- `js/background/BackgroundManager.js`

**Implementation:**
```javascript
/**
 * BackgroundManager.js - Centralized background management system
 * Handles global background color, image, and fit modes
 */

class BackgroundManager {
    constructor() {
        this.backgroundColor = '#ffffff';
        this.backgroundImage = null;
        this.backgroundImageDataURL = null;
        this.backgroundFitMode = 'fit-within-padding'; // 'fit-within-padding' | 'fill-canvas'
        this.padding = { top: 0, bottom: 0, left: 0, right: 0 };
    }
    
    setBackgroundColor(color) { /* ... */ }
    setBackgroundImage(image) { /* ... */ }
    setBackgroundFitMode(mode) { /* ... */ }
    setPadding(padding) { /* ... */ }
    renderBackground(ctx, canvas) { /* ... */ }
    clearBackgroundImage() { /* ... */ }
    getBackgroundInfo() { /* ... */ }
}
```

**Dependencies:** None
**Testing:** Unit tests for all methods

### Task 1.2: Update CanvasManager Integration

**Files to Modify:**
- `js/canvas/CanvasManager.js`

**Changes:**
1. Add BackgroundManager instance
2. Remove background-related properties and methods
3. Update `renderBackground()` to delegate to BackgroundManager
4. Update constructor to initialize BackgroundManager

**Code Changes:**
```javascript
// Remove these properties:
// this.backgroundColor = '#ffffff';
// this.backgroundImage = null;
// this.backgroundVideo = null;
// this.backgroundFitMode = 'fit';

// Add:
this.backgroundManager = new BackgroundManager();

// Update renderBackground():
renderBackground() {
    this.backgroundManager.renderBackground(this.ctx, this.canvas);
}
```

**Dependencies:** Task 1.1
**Testing:** Integration tests with existing canvas functionality

### Task 1.3: Update UI Background Controls

**Files to Modify:**
- `index.html`
- `js/ui/UIManager.js`

**HTML Changes:**
```html
<!-- Replace existing background controls with: -->
<div class="chatooly-control-group">
    <h3>Background</h3>
    
    <!-- Background Color -->
    <div class="chatooly-control-group">
        <label for="backgroundColor">Background Color</label>
        <input type="color" id="backgroundColor" value="#ffffff">
    </div>
    
    <!-- Background Image -->
    <div class="chatooly-control-group">
        <label for="backgroundImage">Background Image</label>
        <input type="file" id="backgroundImage" accept="image/*">
        <button type="button" id="clearBackgroundImage" style="display: none;">Clear Image</button>
        
        <!-- Fit Mode -->
        <div class="chatooly-control-group">
            <label>Image Fit Mode:</label>
            <label>
                <input type="radio" name="backgroundFitMode" value="fit-within-padding" checked>
                Fit within padding
            </label>
            <label>
                <input type="radio" name="backgroundFitMode" value="fill-canvas">
                Fill entire canvas
            </label>
        </div>
    </div>
</div>
```

**JavaScript Changes:**
```javascript
// Remove opacity and transparency controls
// Update event listeners to use BackgroundManager
// Add background image fit mode handling
```

**Dependencies:** Task 1.1, Task 1.2
**Testing:** UI interaction tests

### Task 1.4: Remove Legacy Background Code

**Files to Modify:**
- `js/ui/UIManager.js`
- `js/app.js`

**Changes:**
1. Remove `updateBackgroundColor()` method
2. Remove `hexToRgba()` method
3. Remove opacity-related event listeners
4. Remove transparency checkbox handling
5. Update app.js background methods to use BackgroundManager

**Dependencies:** Task 1.3
**Testing:** Ensure no broken references

## Phase 2: Cell Background System

### Task 2.1: Enhance ContentCell with Background Properties and Fill Content Type

**Files to Modify:**
- `js/grid/ContentCell.js`

**Changes:**
1. Add fill content type alongside empty/image/text
2. Add background properties for different content types
3. Update `_getDefaultContent()` to include background settings
4. Update `serialize()` and `deserialize()` methods
5. Remove mask content type entirely

**Code Changes:**
```javascript
constructor(contentType, row, col) {
    super(row, col);
    // Content types: 'empty' | 'image' | 'text' | 'fill'
    this.contentType = contentType;
    
    // Background properties for image/text cells
    this.fillWithBackgroundColor = false;  // Checkbox state
    this.backgroundColor = null;           // Custom color override
    
    // Background properties for fill cells
    this.useGlobalBackground = true;       // Default for fill cells
    this.customColor = null;               // Custom color for fill cells
}

_getDefaultContent(type) {
    switch (type) {
        case 'fill':
            return {
                useGlobalBackground: true,  // Default: use global background color
                customColor: null,          // Optional override
                padding: 0                  // No padding for solid fills
            };
        case 'image':
        case 'text':
            return {
                fillWithBackgroundColor: false,  // Default: show image
                backgroundColor: null,           // Custom color override
                // ... existing properties
            };
        // ... other cases
    }
}
```

**Dependencies:** Phase 1 complete
**Testing:** Unit tests for background methods

### Task 2.2: Create Cell Background Controls

**Files to Create:**
- `js/content/CellBackgroundController.js`

**Implementation:**
```javascript
/**
 * CellBackgroundController.js - Handles cell background controls
 * Provides UI controls for cell background customization
 */

class CellBackgroundController {
    constructor(app) {
        this.app = app;
    }
    
    createBackgroundControls(cell, container, context = 'sidebar') {
        // Create background type selection
        // Create custom color picker
        // Add event listeners
    }
    
    updateCellBackground(cell, backgroundType, customColor) {
        // Update cell background properties
        // Trigger re-render
    }
}
```

**Dependencies:** Task 2.1
**Testing:** Unit tests for control creation and updates

### Task 2.3: Update Content Controllers

**Files to Modify:**
- `js/content/EmptyContentController.js`
- `js/content/ImageContentController.js`
- `js/content/TextContentController.js`

**Files to Create:**
- `js/content/FillContentController.js`

**Changes:**
1. Add background controls to each controller
2. Create FillContentController for new fill content type
3. Update `createControls()` methods
4. Remove mask references

**Code Changes:**
```javascript
// In each controller's createControls method:
createControls(cell, container, context = 'sidebar') {
    const controls = [];
    
    // ... existing controls ...
    
    // Add background controls based on content type
    if (cell.contentType === 'fill') {
        // Fill-specific controls
    } else if (cell.contentType === 'image' || cell.contentType === 'text') {
        // Checkbox + color picker controls
    }
    // Empty cells have no background controls
    
    return controls;
}
```

**Dependencies:** Task 2.2
**Testing:** Integration tests with existing content controllers

### Task 2.4: Update MainTextCell Background Support

**Files to Modify:**
- `js/grid/MainTextCell.js`

**Changes:**
1. Add background properties similar to ContentCell
2. Add background rendering method
3. Update serialization methods

**Dependencies:** Task 2.1
**Testing:** Unit tests for MainTextCell background functionality

## Phase 3: Rendering Pipeline Updates

### Task 3.1: Update Grid Rendering

**Files to Modify:**
- `js/grid/Grid.js`

**Changes:**
1. Update rendering to include cell backgrounds
2. Ensure proper z-index ordering
3. Optimize rendering performance

**Code Changes:**
```javascript
render(ctx) {
    // Render global background first
    this.app.canvasManager.renderBackground();
    
    // Render cells with their backgrounds
    this.getAllCells().forEach(cell => {
        if (cell.renderBackground) {
            cell.renderBackground(ctx, this.app.backgroundManager);
        }
        // ... existing cell rendering ...
    });
}
```

**Dependencies:** Phase 2 complete
**Testing:** Visual tests for rendering order

### Task 3.2: Update Cell Rendering Methods

**Files to Modify:**
- `js/grid/ContentCell.js`
- `js/grid/MainTextCell.js`

**Changes:**
1. Implement `renderBackground()` method
2. Ensure proper background rendering order
3. Handle different background types

**Code Changes:**
```javascript
renderBackground(ctx, globalBackground) {
    switch (this.backgroundType) {
        case 'global':
            // Use global background (already rendered)
            break;
        case 'fill':
            // Fill with global background color only
            ctx.fillStyle = globalBackground.backgroundColor;
            ctx.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
            break;
        case 'custom':
            // Use custom background color
            ctx.fillStyle = this.customBackgroundColor;
            ctx.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
            break;
    }
}
```

**Dependencies:** Task 3.1
**Testing:** Visual tests for different background types

### Task 3.3: Update Animation System Integration

**Files to Modify:**
- `js/grid/GridCell.js`
- `js/animations/CellAnimation.js`

**Changes:**
1. Ensure backgrounds work with animations
2. Update animation rendering order
3. Test background animation performance

**Dependencies:** Task 3.2
**Testing:** Animation tests with backgrounds

## Phase 4: UI Integration and Testing

### Task 4.1: Update Sidebar UI

**Files to Modify:**
- `index.html`
- `style.css`

**Changes:**
1. Add cell background controls to sidebar
2. Style new background controls
3. Ensure responsive design

**CSS Changes:**
```css
.cell-background-controls {
    /* Style for cell background controls */
}

.background-type-selector {
    /* Style for background type radio buttons */
}

.custom-color-picker {
    /* Style for custom color picker */
}
```

**Dependencies:** Phase 3 complete
**Testing:** UI responsiveness tests

### Task 4.2: Add Background Preview

**Files to Modify:**
- `index.html`
- `js/ui/UIManager.js`

**Changes:**
1. Add background preview area
2. Update preview when background changes
3. Show fit mode effects

**Code Changes:**
```javascript
updateBackgroundPreview() {
    // Create preview canvas
    // Render current background settings
    // Update preview display
}
```

**Dependencies:** Task 4.1
**Testing:** Preview accuracy tests

### Task 4.3: Update Export System

**Files to Modify:**
- `js/grid/Grid.js` (serialize method)
- Export-related files

**Changes:**
1. Include background settings in exports
2. Ensure background data is preserved
3. Test export/import functionality

**Dependencies:** Task 4.2
**Testing:** Export/import tests

## Phase 5: Testing and Validation

### Task 5.1: Unit Tests

**Files to Create:**
- `tests/unit/BackgroundManager.test.js`
- `tests/unit/CellBackground.test.js`
- `tests/unit/BackgroundRendering.test.js`

**Test Coverage:**
- BackgroundManager functionality
- Cell background inheritance
- Background rendering pipeline
- Background fit modes
- Custom background colors

### Task 5.2: Integration Tests

**Files to Create:**
- `tests/integration/BackgroundIntegration.test.js`
- `tests/integration/CellBackgroundIntegration.test.js`

**Test Coverage:**
- UI control interactions
- Background rendering with different cell types
- Animation with backgrounds
- Export/import with backgrounds

### Task 5.3: Visual Tests

**Files to Create:**
- `tests/visual/BackgroundVisual.test.js`
- `tests/visual/CellBackgroundVisual.test.js`

**Test Coverage:**
- Background image fit modes
- Cell background combinations
- Animation with backgrounds
- Performance with many cells

### Task 5.4: Performance Tests

**Files to Create:**
- `tests/performance/BackgroundPerformance.test.js`

**Test Coverage:**
- Rendering performance with backgrounds
- Memory usage with background images
- Animation performance with backgrounds

## Phase 6: Documentation and Cleanup

### Task 6.1: Update Documentation

**Files to Modify:**
- `README.md`
- `docs/` directory files
- Code comments

**Changes:**
1. Document new background system
2. Update API documentation
3. Add usage examples

### Task 6.2: Code Cleanup

**Files to Modify:**
- All modified files

**Changes:**
1. Remove commented-out code
2. Optimize performance
3. Ensure consistent coding style
4. Add error handling

### Task 6.3: Final Testing

**Files to Test:**
- All modified files
- All new files

**Testing:**
1. Full system integration test
2. User acceptance testing
3. Performance validation
4. Cross-browser testing

## Implementation Timeline

### Week 1: Phase 1 (Core Background System)
- Tasks 1.1-1.4
- Focus: BackgroundManager and basic UI updates

### Week 2: Phase 2 (Cell Background System)
- Tasks 2.1-2.4
- Focus: Cell background properties and controls

### Week 3: Phase 3 (Rendering Pipeline)
- Tasks 3.1-3.3
- Focus: Rendering integration and animation support

### Week 4: Phase 4 (UI Integration)
- Tasks 4.1-4.3
- Focus: UI polish and export system

### Week 5: Phase 5 (Testing)
- Tasks 5.1-5.4
- Focus: Comprehensive testing

### Week 6: Phase 6 (Documentation and Cleanup)
- Tasks 6.1-6.3
- Focus: Documentation and final polish

## Risk Mitigation

### Technical Risks
- **Rendering Performance**: Monitor performance with many cells
- **Memory Usage**: Optimize background image handling
- **Browser Compatibility**: Test across different browsers

### User Experience Risks
- **Learning Curve**: Provide clear documentation and examples
- **Backward Compatibility**: Ensure existing projects continue to work
- **UI Complexity**: Keep controls simple and intuitive

### Mitigation Strategies
- **Incremental Implementation**: Implement in phases with testing
- **Performance Monitoring**: Add performance metrics and monitoring
- **User Testing**: Conduct user testing at each phase
- **Rollback Plan**: Maintain ability to rollback changes if needed

## Success Criteria

### Functional Requirements
- ✅ Global background color and image support
- ✅ Background image fit modes (within padding, fill canvas)
- ✅ Per-cell background customization
- ✅ Background inheritance system
- ✅ Animation compatibility

### Performance Requirements
- ✅ Rendering performance maintained or improved
- ✅ Memory usage optimized
- ✅ Smooth animations with backgrounds

### User Experience Requirements
- ✅ Intuitive UI controls
- ✅ Clear visual feedback
- ✅ Responsive design
- ✅ Cross-browser compatibility

### Technical Requirements
- ✅ Clean, maintainable code
- ✅ Comprehensive test coverage
- ✅ Proper error handling
- ✅ Documentation completeness
