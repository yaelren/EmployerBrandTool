# Layer System Architecture Document

## Overview
A layer-based rendering system that allows per-cell layer assignment with a Photoshop-style layer panel integrated into the existing debug/animation panel.

## Core Components

### 1. LayerManager Class
```javascript
class LayerManager {
    constructor() {
        this.layers = new Map();
        this.initializeDefaultLayers();
    }
    
    initializeDefaultLayers() {
        const defaultLayers = [
            { id: 'background', name: 'Background', order: 0 },
            { id: 'behind-main-text', name: 'Behind Main Text', order: 1 },
            { id: 'main-text', name: 'Main Text', order: 2 },
            { id: 'above-main-text', name: 'Above Main Text', order: 3 }
        ];
        
        defaultLayers.forEach(layerData => {
            this.layers.set(layerData.id, new Layer(
                layerData.id, 
                layerData.name, 
                layerData.order
            ));
        });
    }
}
```

### 2. Layer Class
```javascript
class Layer {
    constructor(id, name, order, visible = true) {
        this.id = id;
        this.name = name;
        this.order = order; // Lower numbers render first (behind)
        this.visible = visible;
        this.cells = new Set(); // Cells assigned to this layer
    }
    
    addCell(cell) {
        this.cells.add(cell);
        cell.layerId = this.id;
    }
    
    removeCell(cell) {
        this.cells.delete(cell);
        cell.layerId = null;
    }
}
```

### 3. Enhanced GridCell
```javascript
class GridCell {
    constructor(row, col) {
        // ... existing properties ...
        this.layerId = 'behind-main-text'; // Default layer
        this.layerOrder = 0; // Order within layer (for future use)
    }
    
    setLayer(layerId) {
        // Remove from current layer
        if (this.layerId && this.layerManager) {
            const currentLayer = this.layerManager.layers.get(this.layerId);
            if (currentLayer) {
                currentLayer.removeCell(this);
            }
        }
        
        // Add to new layer
        if (this.layerManager) {
            const newLayer = this.layerManager.layers.get(layerId);
            if (newLayer) {
                newLayer.addCell(this);
            }
        }
    }
}
```

## Layer Assignment Rules

### Default Assignments
- **MainTextCell**: Always assigned to `main-text` layer
- **ContentCell**: Default to `behind-main-text` layer
- **Empty cells**: Assigned to `behind-main-text` layer

### Manual Override
- Users can move any cell to any layer via the layer panel
- Main text can be moved to `behind-main-text` or `background` if needed
- Content can be moved to `above-main-text` to appear over main text

## Rendering Pipeline Changes

### Current Flow
```javascript
// app.js _renderWithAnimations()
allCells.forEach(cell => {
    // Render each cell in grid order
});
```

### New Layer-Based Flow
```javascript
// app.js _renderWithAnimations()
const sortedLayers = this.layerManager.getSortedLayers();
sortedLayers.forEach(layer => {
    if (!layer.visible) return;
    
    layer.cells.forEach(cell => {
        this.renderCellWithAnimations(ctx, cell, debugOptions);
    });
});
```

## UI Integration

### Layer Panel in Debug/Animation Panel
- **Location**: Integrated into existing debug panel
- **Layout**: Photoshop-style layer list showing:
  - Layer name
  - Eye icon (visibility toggle)
  - Cell count per layer
  - Expandable cell list

### Cell Selection & Layer Assignment
- **Grid Matrix View**: Shows all cells in a visual grid
- **Click to Select**: Click cell to select and show its current layer
- **Layer Dropdown**: Dropdown to change selected cell's layer
- **Visual Feedback**: Selected cell highlighted, layer info displayed

### Layer Panel Structure
```
┌─ Debug Panel ─────────────────────┐
│ ☑ Show Spot Outlines              │
│ ☑ Show Spot Numbers               │
│ ☑ Show Text Bounds                │
│ ☑ Show Padding                    │
│                                    │
│ ┌─ Layer Management ─────────────┐ │
│ │ 👁 Background (0 cells)        │ │
│ │ 👁 Behind Main Text (3 cells)  │ │
│ │   ├─ Cell 1 (Image)            │ │
│ │   ├─ Cell 2 (Empty)            │ │
│ │   └─ Cell 3 (Text Spot)         │ │
│ │ 👁 Main Text (2 cells)         │ │
│ │   ├─ Cell 4 (Line 1)           │ │
│ │   └─ Cell 5 (Line 2)           │ │
│ │ 👁 Above Main Text (0 cells)   │ │
│ └────────────────────────────────┘ │
│                                    │
│ ┌─ Cell Selection ────────────────┐ │
│ │ Selected: Cell 1               │ │
│ │ Layer: Behind Main Text        │ │
│ │ [Change Layer ▼]               │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

## File Structure Changes

### New Files
- `js/grid/LayerManager.js` - Core layer management
- `js/grid/Layer.js` - Individual layer class
- `js/ui/LayerPanel.js` - Layer panel UI component

### Modified Files
- `js/grid/GridCell.js` - Add layer properties
- `js/grid/MainTextCell.js` - Set default layer
- `js/grid/ContentCell.js` - Set default layer
- `js/app.js` - Update rendering pipeline
- `js/canvas/DebugController.js` - Add layer panel integration
- `index.html` - Add layer panel HTML structure

## Performance Considerations

### Rendering Optimization
- **Layer Visibility**: Skip rendering invisible layers entirely
- **Cell Caching**: Cache layer-sorted cells to avoid re-sorting every frame
- **Dirty Tracking**: Only re-sort when layer assignments change

### Memory Management
- **Layer References**: Cells hold references to layers (circular references handled carefully)
- **Cleanup**: Proper cleanup when cells are destroyed or layers are removed

## Integration Points

### Grid Building
- Layer assignments happen during `GridBuilder.buildMatrix()`
- Default layer assignment based on cell type

### Animation System
- Animations continue to work per-cell via `currentOffset`
- Layer ordering respected during animation
- No changes needed to `CellAnimation` class

### Debug System
- Layer panel integrated into existing debug panel
- Layer visibility controls added to debug options
- Cell selection integrated with existing debug controls
