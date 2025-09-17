# Employer Brand Tool - POC Specification
**Version 1.1** | Text-Driven Dynamic Grid System with Chatooly Integration

## 🎯 POC Goal
Create a proof of concept that demonstrates text-driven layout with automatic open-spot detection. The main text defines the grid structure, and the algorithm finds all available spaces aligned to that structure.

## 🏗️ Core Concept

### The Text IS the Grid
- Main text placement creates natural rows based on line breaks
- Each row's text defines column divisions within that row
- Empty spaces become "spots" that align to text edges
- No predefined grid - the text creates it dynamically

### Layer Architecture
```
1. Background Image Layer (bottom)
2. Color Background Layer 
3. Main Text Layer
4. Spots Layer (image/text/mask)
5. Debug Overlays (top)

Masks in spots reveal the background image through the color layer
```

### Example Visualization
```
Input text: "I\nLove\nYou"

Resulting dynamic grid:
┌────────┬───┬────────┐
│ Spot 1 │ I │ Spot 2 │  Row 1: 3 columns
├────────┴───┴────────┤
│        Love         │  Row 2: 1 column (full width)
├────────────┬────────┤
│    You     │ Spot 3 │  Row 3: 2 columns
└────────────┴────────┘

If remaining canvas space:
├────────────────────┤
│      Spot 4        │  Row 4: 1 column (remaining space)
└────────────────────┘
```

---

## 📁 Clean Project Structure

```
employer-brand-tool-poc/
├── index.html                    # Single page entry point
├── css/
│   ├── variables.css            # Override/extend Chatooly variables
│   ├── layout.css              # Page layout and structure
│   ├── components.css          # UI components styling
│   └── debug.css              # Debug mode styles
├── js/
│   ├── app.js                 # Main application controller
│   ├── core/
│   │   ├── Canvas.js         # Canvas manager class
│   │   ├── LayerManager.js   # Manages canvas layers
│   │   ├── TextEngine.js     # Text rendering and measurement
│   │   └── ExportManager.js  # Chatooly export integration
│   ├── algorithms/
│   │   ├── SpotDetector.js   # Base strategy class
│   │   ├── strategies/
│   │   │   ├── LineBasedStrategy.js
│   │   │   ├── RecursiveDivisionStrategy.js
│   │   │   └── FloodFillStrategy.js
│   │   └── GridBuilder.js    # Dynamic grid construction
│   ├── models/
│   │   ├── Spot.js           # Spot data model
│   │   ├── TextConfig.js     # Text configuration model
│   │   ├── Grid.js           # Dynamic grid model
│   │   └── Layer.js          # Layer model
│   ├── ui/
│   │   ├── ControlPanel.js   # Left panel controller
│   │   ├── SpotsList.js      # Spots list component
│   │   ├── TextControls.js   # Text input and controls
│   │   └── DebugPanel.js     # Debug visualization controls
│   └── utils/
│       ├── TextMeasure.js    # Text measurement utilities
│       ├── Geometry.js       # Geometric calculations
│       └── EventBus.js       # Event system for components
├── assets/
│   ├── fonts/               # Custom fonts if needed
│   └── test-images/         # Test background images
└── config/
    └── chatooly-config.js   # Chatooly tool configuration
```

---

## 🏗️ Technical Architecture

### Canvas Setup (Chatooly Compliant)
```javascript
// MANDATORY Chatooly structure
<div id="chatooly-container">
    <canvas id="chatooly-canvas"></canvas>
</div>

// Additional canvases for layering (if needed)
<canvas id="debug-canvas" class="overlay-canvas"></canvas>
```

### Object-Oriented Design

#### Core Classes

```javascript
// Canvas Manager - Handles all canvas operations
class CanvasManager {
    constructor() {
        this.canvas = document.getElementById('chatooly-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.layers = new LayerManager(this);
        this.exportManager = new ExportManager(this);
    }
    
    initialize(width, height) {
        this.setDimensions(width, height);
        this.layers.createLayers();
    }
    
    render() {
        this.layers.renderAll();
    }
}

// Layer Manager - Manages rendering layers
class LayerManager {
    constructor(canvasManager) {
        this.canvas = canvasManager;
        this.layers = new Map();
        this.initializeLayers();
    }
    
    initializeLayers() {
        this.layers.set('backgroundImage', new ImageLayer());
        this.layers.set('colorBackground', new ColorLayer());
        this.layers.set('mainText', new TextLayer());
        this.layers.set('spots', new SpotsLayer());
        this.layers.set('debug', new DebugLayer());
    }
    
    renderAll() {
        // Render in order
        for (let [name, layer] of this.layers) {
            if (layer.visible) {
                layer.render(this.canvas.ctx);
            }
        }
    }
}

// Text Engine - Handles text rendering and measurement
class TextEngine {
    constructor() {
        this.config = new TextConfig();
        this.lines = [];
        this.bounds = [];
    }
    
    setText(content) {
        this.parseLines(content);
        this.calculateBounds();
    }
    
    parseLines(content) {
        this.lines = content.split('\n');
    }
    
    calculateBounds() {
        this.bounds = this.lines.map(line => this.measureLine(line));
    }
    
    measureLine(line) {
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.font = `${this.config.fontSize}px ${this.config.fontFamily}`;
        const metrics = ctx.measureText(line);
        
        return {
            width: metrics.width,
            height: this.config.fontSize * this.config.lineHeight,
            actualBoundingBox: {
                left: metrics.actualBoundingBoxLeft,
                right: metrics.actualBoundingBoxRight,
                ascent: metrics.actualBoundingBoxAscent,
                descent: metrics.actualBoundingBoxDescent
            }
        };
    }
}

// Spot Detector with Strategy Pattern
class SpotDetector {
    constructor(strategy) {
        this.strategy = strategy;
        this.spots = [];
    }
    
    setStrategy(strategy) {
        this.strategy = strategy;
    }
    
    detect(canvas, textBounds) {
        this.spots = this.strategy.detect(canvas, textBounds);
        return this.spots;
    }
    
    getSpots() {
        return this.spots;
    }
}

// Base Strategy Class
class DetectionStrategy {
    detect(canvas, textBounds) {
        throw new Error('detect() must be implemented by subclass');
    }
    
    createSpot(id, x, y, width, height, row, column) {
        return new Spot(id, x, y, width, height, row, column);
    }
}

// Line-Based Strategy Implementation
class LineBasedStrategy extends DetectionStrategy {
    constructor(minSpotSize = 50) {
        super();
        this.minSpotSize = minSpotSize;
    }
    
    detect(canvas, textBounds) {
        const spots = [];
        const rows = this.buildRows(canvas, textBounds);
        
        let spotId = 1;
        rows.forEach((row, rowIndex) => {
            row.elements.forEach((element, colIndex) => {
                if (element.type === 'spot' && 
                    element.width >= this.minSpotSize && 
                    element.height >= this.minSpotSize) {
                    spots.push(this.createSpot(
                        spotId++,
                        element.x,
                        row.y,
                        element.width,
                        row.height,
                        rowIndex,
                        colIndex
                    ));
                }
            });
        });
        
        return spots;
    }
    
    buildRows(canvas, textBounds) {
        // Implementation as previously defined
    }
}
```

#### Model Classes

```javascript
// Spot Model
class Spot {
    constructor(id, x, y, width, height, row, column) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.row = row;
        this.column = column;
        this.type = 'empty'; // 'empty' | 'image' | 'text' | 'mask'
        this.content = null;
    }
    
    setType(type) {
        this.type = type;
    }
    
    setContent(content) {
        this.content = content;
    }
    
    render(ctx) {
        // Render based on type
        switch(this.type) {
            case 'mask':
                this.renderMask(ctx);
                break;
            case 'image':
                this.renderImage(ctx);
                break;
            case 'text':
                this.renderText(ctx);
                break;
            default:
                this.renderEmpty(ctx);
        }
    }
    
    renderMask(ctx) {
        // Reveals background image
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.globalCompositeOperation = 'source-over';
    }
}

// Text Configuration Model
class TextConfig {
    constructor() {
        this.content = '';
        this.fontSize = 60;
        this.fontFamily = 'var(--chatooly-font-family)';
        this.lineHeight = 1.2;
        this.alignment = 'left'; // 'left' | 'center' | 'right'
        this.autoWrap = false;
        this.autoShrink = false;
        this.color = 'var(--chatooly-color-text)';
    }
    
    update(changes) {
        Object.assign(this, changes);
    }
}

// Dynamic Grid Model
class DynamicGrid {
    constructor() {
        this.rows = [];
        this.totalSpots = 0;
    }
    
    addRow(y, height, elements) {
        this.rows.push({
            index: this.rows.length,
            y: y,
            height: height,
            elements: elements
        });
    }
    
    clear() {
        this.rows = [];
        this.totalSpots = 0;
    }
    
    getSpotAt(row, column) {
        if (this.rows[row] && this.rows[row].elements[column]) {
            return this.rows[row].elements[column];
        }
        return null;
    }
}
```

#### UI Components

```javascript
// Control Panel Manager
class ControlPanel {
    constructor(app) {
        this.app = app;
        this.textControls = new TextControls(this);
        this.spotsList = new SpotsList(this);
        this.debugPanel = new DebugPanel(this);
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        // Find Spots button
        document.getElementById('findSpots').addEventListener('click', () => {
            this.app.detectSpots();
        });
    }
}

// Spots List Component
class SpotsList {
    constructor(controlPanel) {
        this.controlPanel = controlPanel;
        this.container = document.getElementById('spotsList');
    }
    
    update(spots) {
        this.clear();
        spots.forEach(spot => this.addSpotItem(spot));
    }
    
    addSpotItem(spot) {
        const item = document.createElement('div');
        item.className = 'spot-item';
        item.innerHTML = `
            <span class="spot-number">${spot.id}</span>
            <select class="spot-type" data-spot-id="${spot.id}">
                <option value="empty">Empty</option>
                <option value="image">Image</option>
                <option value="text">Text</option>
                <option value="mask">Mask</option>
            </select>
            <span class="spot-size">${Math.round(spot.width)}x${Math.round(spot.height)}</span>
        `;
        
        // Add event listener for type change
        item.querySelector('.spot-type').addEventListener('change', (e) => {
            this.onSpotTypeChange(spot.id, e.target.value);
        });
        
        this.container.appendChild(item);
    }
    
    onSpotTypeChange(spotId, type) {
        this.controlPanel.app.updateSpotType(spotId, type);
    }
    
    clear() {
        this.container.innerHTML = '';
    }
}
```

### Event System

```javascript
// Event Bus for component communication
class EventBus {
    constructor() {
        this.events = {};
    }
    
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }
    
    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }
    
    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }
}
```

---

## 🎨 Chatooly Integration

### CSS Variables Usage
```css
/* Override/extend Chatooly variables in variables.css */
:root {
    /* Extend Chatooly with custom variables */
    --ebt-spot-outline: var(--chatooly-color-primary-alpha-30);
    --ebt-spot-hover: var(--chatooly-color-primary-hover);
    --ebt-grid-line: var(--chatooly-color-border);
    --ebt-text-frame: var(--chatooly-color-info);
    
    /* Use Chatooly spacing system */
    --ebt-panel-padding: var(--chatooly-spacing-md);
    --ebt-control-gap: var(--chatooly-spacing-sm);
}

/* Component styling using Chatooly variables */
.control-panel {
    background: var(--chatooly-color-surface);
    border-right: 1px solid var(--chatooly-color-border);
    padding: var(--chatooly-spacing-lg);
    font-family: var(--chatooly-font-family);
}

.spot-item {
    background: var(--chatooly-color-background);
    border: 1px solid var(--chatooly-color-border);
    border-radius: var(--chatooly-border-radius-md);
    padding: var(--chatooly-spacing-sm);
    margin-bottom: var(--chatooly-spacing-xs);
}

/* Chatooly automatically styles these elements */
input[type="range"],
input[type="text"],
select,
button {
    /* Already styled by Chatooly CDN */
}
```

### Export Integration
```javascript
// Mandatory Chatooly export function
window.renderHighResolution = function(targetCanvas, scale) {
    if (!app || !app.canvasManager) {
        console.warn('App not ready for high-res export');
        return;
    }
    
    const ctx = targetCanvas.getContext('2d');
    targetCanvas.width = app.canvasManager.canvas.width * scale;
    targetCanvas.height = app.canvasManager.canvas.height * scale;
    
    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    ctx.save();
    ctx.scale(scale, scale);
    
    // Re-render all layers at high resolution
    app.canvasManager.layers.renderAll(ctx);
    
    ctx.restore();
    console.log(`High-res export completed at ${scale}x resolution`);
};
```

---

## 🚀 Main Application Controller

```javascript
// Main App Class
class EmployerBrandToolPOC {
    constructor() {
        this.canvasManager = new CanvasManager();
        this.textEngine = new TextEngine();
        this.spotDetector = new SpotDetector(new LineBasedStrategy());
        this.grid = new DynamicGrid();
        this.controlPanel = new ControlPanel(this);
        this.eventBus = new EventBus();
        
        this.initialize();
    }
    
    initialize() {
        // Set up canvas with default aspect ratio
        this.canvasManager.initialize(800, 800);
        
        // Initialize with sample text
        this.textEngine.setText("EMPLOYEE\nSPOTLIGHT\n2024");
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initial render
        this.render();
    }
    
    setupEventListeners() {
        // Text input changes
        this.eventBus.on('textChanged', (text) => {
            this.textEngine.setText(text);
            this.render();
        });
        
        // Spot type changes
        this.eventBus.on('spotTypeChanged', ({spotId, type}) => {
            const spot = this.spotDetector.getSpots().find(s => s.id === spotId);
            if (spot) {
                spot.setType(type);
                this.render();
            }
        });
    }
    
    detectSpots() {
        // Clear previous spots
        this.grid.clear();
        
        // Detect new spots
        const spots = this.spotDetector.detect(
            this.canvasManager.canvas,
            this.textEngine.bounds
        );
        
        // Update grid model
        this.updateGrid(spots);
        
        // Update UI
        this.controlPanel.spotsList.update(spots);
        
        // Re-render with spots
        this.render();
    }
    
    updateGrid(spots) {
        // Build dynamic grid from spots and text
        // Implementation based on algorithm
    }
    
    render() {
        this.canvasManager.render();
    }
    
    updateSpotType(spotId, type) {
        this.eventBus.emit('spotTypeChanged', {spotId, type});
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new EmployerBrandToolPOC();
});
```

---

## 📊 Data Flow

```
User Input → TextEngine → SpotDetector → DynamicGrid → CanvasManager → Visual Output
     ↓                           ↓                              ↓
ControlPanel ←─────────── EventBus ←──────────────────── SpotsList
```

---

## ✅ POC Success Criteria

### Must Have
- [x] Text input renders on canvas using Chatooly structure
- [x] Text automatically defines frame size (no manual resizing)
- [x] Manual "Find Spots" button triggers algorithm
- [x] Algorithm identifies empty spaces aligned to text
- [x] Spots displayed as numbered outlines
- [x] Spots list in UI with type selector (empty/image/text/mask)
- [x] Clean OO code structure
- [x] Chatooly CDN integration for export

### Nice to Have
- [ ] Background image layer support
- [ ] Mask spots reveal background through color layer
- [ ] Auto-wrap text option
- [ ] Auto-shrink font to fit
- [ ] Different alignment options
- [ ] Debug visualization mode

### Technical Requirements
- Clean object-oriented architecture
- Separation of concerns (models, views, controllers)
- Pluggable algorithm strategies
- Event-driven communication between components
- Chatooly-compliant canvas and export setup
- Use of Chatooly CSS variables throughout

---

## 🚀 Implementation Steps

### Phase 1: Foundation & Architecture (Day 1)
1. [ ] Set up project structure with all directories
2. [ ] Create base classes (CanvasManager, LayerManager, TextEngine)
3. [ ] Implement Chatooly-compliant HTML structure
4. [ ] Set up CSS with Chatooly variables
5. [ ] Create EventBus for component communication

### Phase 2: Core Functionality (Day 2)
1. [ ] Implement TextEngine with measurement
2. [ ] Create SpotDetector with strategy pattern
3. [ ] Build LineBasedStrategy algorithm
4. [ ] Implement DynamicGrid model
5. [ ] Test spot detection with various text inputs

### Phase 3: UI Components (Day 3)
1. [ ] Build ControlPanel class
2. [ ] Create SpotsList component
3. [ ] Implement TextControls
4. [ ] Add event handling between components
5. [ ] Style with Chatooly variables

### Phase 4: Visual & Export (Day 4)
1. [ ] Implement layer rendering system
2. [ ] Add spot visualization on canvas
3. [ ] Create debug overlay option
4. [ ] Implement Chatooly export function
5. [ ] Test high-resolution export

### Phase 5: Polish & Enhancement (Day 5)
1. [ ] Add background image layer support
2. [ ] Implement mask spot functionality
3. [ ] Optimize performance
4. [ ] Add remaining strategies
5. [ ] Final testing and debugging

---

Ready to start implementation with this clean, object-oriented structure that integrates properly with Chatooly?