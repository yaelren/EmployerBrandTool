# Background and Layer Refactoring Design Document

## Overview

This document outlines the comprehensive refactoring of the background and layer system in the Chatooly Employer Brand Tool. The new system will provide a unified background management approach with improved flexibility for cell-level background customization.

## Current System Analysis

### Existing Background System
- **CanvasManager**: Handles background color, image, and video with fit modes
- **UIManager**: Manages background controls (color, opacity, transparency, media upload)
- **Current Issues**:
  - Opacity controls are complex and confusing
  - No transparent background option (only opacity)
  - Background image always fills entire canvas
  - No per-cell background customization
  - Limited fit mode options

### Existing Layer System
- **LayerManager**: Manages 4 default layers (background, behind-main-text, main-text, above-main-text)
- **ContentCell**: Supports different content types (empty, image, text, mask)
- **Current Issues**:
  - No background color inheritance from global background
  - No per-cell background color options
  - Mask system is separate from background system

## New System Design

### 1. Global Background System

#### Background Color
- **Single background color** for the entire canvas
- **No opacity controls** - background color is always solid
- **No transparent background** - always has a color
- **Default**: White (#ffffff)

#### Background Image
- **Optional background image** that overlays the background color
- **Two fit modes**:
  - **"Fit within padding"**: Image fits within canvas padding, background color visible around edges
  - **"Fill entire canvas"**: Image fills entire canvas (current behavior)
- **Image positioning**: Always centered
- **Image upload**: Support for common image formats (PNG, JPG, WebP)

#### Background Rendering Order
1. Background color (fills entire canvas)
2. Background image (if present, with selected fit mode)
3. Grid cells (with their individual backgrounds)

### 2. Cell-Level Background System

#### Background Inheritance
- **All cells inherit the global background color** by default
- **Background image is visible** through empty/transparent areas of cells
- **Per-cell background override** available for all cell types

#### Cell Background Options
- **"Use global background"** (default): Inherits global background color + image
- **"Custom background color"**: Override with specific color
- **"Fill with background color"**: Fill entire cell with global background color (no image)

#### Content Type Background Behavior

##### Empty Cells
- **Default**: Show global background (color + image)
- **No controls**: No background customization needed

##### Fill Cells (NEW)
- **Default**: Automatically uses global background color
- **Option**: Custom color picker to override
- **Purpose**: Fill cell with background color (no image)
- **Use case**: Quick background color fills that stay in sync with global changes

##### Image Cells
- **Default**: Show global background image (if present)
- **Option**: Checkbox "Fill with background color" - when checked, shows global background color
- **Custom color**: When checkbox is checked, user can override with custom color

##### Text Cells
- **Default**: Show global background image (if present)
- **Option**: Checkbox "Fill with background color" - when checked, shows global background color
- **Custom color**: When checkbox is checked, user can override with custom color

##### Main Text Cells
- **Default**: Show global background image (if present)
- **Option**: Checkbox "Fill with background color" - when checked, shows global background color
- **Custom color**: When checkbox is checked, user can override with custom color

### 3. UI Controls Design

#### Global Background Controls
```
Background
├── Background Color
│   └── Color picker (#ffffff)
├── Background Image
│   ├── Upload button
│   ├── Clear button (when image present)
│   └── Fit Mode
│       ├── ○ Fit within padding
│       └── ○ Fill entire canvas
└── Preview area (shows current background)
```

#### Cell Background Controls (in cell sidebar)

##### For Empty Cells:
```
No background controls - shows global background automatically
```

##### For Fill Cells:
```
Fill Cell Background
├── Background Color
│   ├── ○ Use global background color (default)
│   └── ○ Custom color
└── Custom Color (when "Custom color" selected)
    └── Color picker
```

##### For Image/Text/Main Text Cells:
```
Cell Background
├── ☐ Fill with background color
└── Background Color (when checkbox checked)
    └── Color picker (defaults to global background color)
```

### 4. Technical Implementation

#### BackgroundManager Class
```javascript
class BackgroundManager {
    constructor() {
        this.backgroundColor = '#ffffff';
        this.backgroundImage = null;
        this.backgroundFitMode = 'fit-within-padding'; // 'fit-within-padding' | 'fill-canvas'
    }
    
    setBackgroundColor(color) { /* ... */ }
    setBackgroundImage(image) { /* ... */ }
    setBackgroundFitMode(mode) { /* ... */ }
    renderBackground(ctx, canvas) { /* ... */ }
}
```

#### Enhanced ContentCell
```javascript
class ContentCell extends GridCell {
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
    
    setFillWithBackgroundColor(enabled) { /* ... */ }
    setBackgroundColor(color) { /* ... */ }
    setCustomColor(color) { /* ... */ }
    renderBackground(ctx, globalBackground) { /* ... */ }
}
```

#### Background Rendering Pipeline
1. **CanvasManager.renderBackground()**: Renders global background
2. **Grid.render()**: Renders all cells with their background settings
3. **ContentCell.renderBackground()**: Renders cell-specific background if needed

### 5. Migration Strategy

#### Phase 1: Core Background System
- Create BackgroundManager class
- Update CanvasManager to use BackgroundManager
- Remove opacity and transparency controls
- Add background image fit mode controls

#### Phase 2: Cell Background System
- Add background properties to ContentCell
- Create cell background controls in UI
- Update rendering pipeline

#### Phase 3: Content Controller Updates
- Update all ContentController subclasses
- Add background controls to each content type
- Test with existing content

#### Phase 4: Cleanup and Optimization
- Remove legacy opacity/transparency code
- Optimize rendering performance
- Update documentation

### 6. Benefits

#### User Experience
- **Simplified controls**: No confusing opacity settings
- **Consistent behavior**: All cells inherit global background by default
- **Flexible customization**: Per-cell background overrides when needed
- **Visual clarity**: Background image fit modes provide clear options

#### Technical Benefits
- **Cleaner architecture**: Separated background management
- **Better performance**: Optimized rendering pipeline
- **Easier maintenance**: Clear separation of concerns
- **Future-proof**: Extensible design for additional background features

### 7. Edge Cases and Considerations

#### Background Image Handling
- **Large images**: Ensure proper scaling and memory management
- **Small images**: Handle stretching appropriately
- **Image loading**: Show loading states and error handling
- **Format support**: Validate supported image formats

#### Cell Background Interactions
- **Animation compatibility**: Ensure backgrounds work with cell animations
- **Layer ordering**: Maintain proper z-index with layer system
- **Performance**: Optimize rendering for many cells with custom backgrounds

#### Backward Compatibility
- **Existing projects**: Ensure existing projects continue to work
- **Data migration**: Handle conversion of opacity-based backgrounds
- **API compatibility**: Maintain existing API where possible

### 8. Testing Strategy

#### Unit Tests
- BackgroundManager functionality
- ContentCell background rendering
- Background fit mode calculations

#### Integration Tests
- Background rendering pipeline
- UI control interactions
- Cell background inheritance

#### Visual Tests
- Background image fit modes
- Cell background combinations
- Animation with backgrounds

### 9. Future Enhancements

#### Potential Features
- **Background patterns**: Support for repeating patterns
- **Gradient backgrounds**: Linear and radial gradients
- **Background animations**: Animated background elements
- **Background presets**: Predefined background combinations

#### Performance Optimizations
- **Background caching**: Cache rendered backgrounds
- **Lazy loading**: Load background images on demand
- **Compression**: Optimize background image storage

## Conclusion

This refactoring will provide a cleaner, more intuitive background system that maintains the flexibility needed for creative designs while simplifying the user interface. The new system will be more maintainable and provide a solid foundation for future enhancements.
