# Employer Brand Tool POC - Simplified Specification
**Version 2.0** | Clean & Simple Implementation

## 🎯 POC Goal
Create a simple proof of concept: text input → spot detection → visual feedback. No over-engineering.

## 🏗️ Simplified Architecture

### File Structure
```
employer-brand-tool-poc/
├── index.html              # Single page
├── style.css              # Simple styles with Chatooly variables
├── app.js                 # Main app class
├── CanvasManager.js       # Canvas operations
├── TextEngine.js          # Text parsing & measurement
├── SpotDetector.js        # Line-based algorithm
└── Spot.js               # Simple data model
```

### Core Classes (5 files total)

#### 1. Main App (`app.js`)
```javascript
class EmployerBrandToolPOC {
  constructor() {
    this.canvas = new CanvasManager();
    this.textEngine = new TextEngine();
    this.spotDetector = new SpotDetector();
    this.spots = [];
    this.setupUI();
  }
  
  // Direct method calls, no event system
  onTextChanged() { /* update & render */ }
  onFindSpots() { /* detect & update UI */ }
  onSpotTypeChanged() { /* update spot & render */ }
  render() { /* draw everything */ }
}
```

#### 2. Canvas Manager (`CanvasManager.js`)
```javascript
class CanvasManager {
  constructor() {
    this.canvas = document.getElementById('chatooly-canvas');
    this.ctx = this.canvas.getContext('2d');
  }
  
  clear() { /* clear canvas */ }
  drawText() { /* render text */ }
  drawSpots() { /* draw spot outlines */ }
  drawDebug() { /* debug visualization */ }
}
```

#### 3. Text Engine (`TextEngine.js`)
```javascript
class TextEngine {
  constructor() {
    this.lines = [];
    this.bounds = [];
  }
  
  setText(content) { /* parse & measure */ }
  measureLine(text) { /* canvas text metrics */ }
  getLineBounds() { /* return bounding boxes */ }
}
```

#### 4. Spot Detector (`SpotDetector.js`)
```javascript
class SpotDetector {
  detect(canvas, textBounds) {
    // Simple algorithm:
    // 1. Create rows from text lines
    // 2. Find empty spaces left/right of text
    // 3. Find remaining canvas space
    // 4. Filter by minimum size (50x50)
    return spots;
  }
}
```

#### 5. Spot Model (`Spot.js`)
```javascript
class Spot {
  constructor(id, x, y, width, height) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = 'empty'; // 'empty'|'image'|'text'|'mask'
    this.opacity = 1; // For masks
  }
}
```

---

## 🎨 Simple UI Structure

### HTML (`index.html`)
```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/yaelren/chatooly-cdn@main/css/variables.css">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="app">
        <!-- Left Panel -->
        <aside class="controls">
            <h3>Main Text</h3>
            <textarea id="mainText">EMPLOYEE
SPOTLIGHT
2024</textarea>
            
            <button id="findSpots">Find Spots</button>
            
            <div id="spotsList">
                <!-- Dynamic spots list -->
            </div>
        </aside>
        
        <!-- Canvas Area -->
        <main class="canvas-area">
            <div id="chatooly-container">
                <canvas id="chatooly-canvas"></canvas>
            </div>
        </main>
    </div>
    
    <script src="Spot.js"></script>
    <script src="SpotDetector.js"></script>
    <script src="TextEngine.js"></script>
    <script src="CanvasManager.js"></script>
    <script src="app.js"></script>
</body>
</html>
```

### CSS (`style.css`)
```css
/* Use Chatooly variables */
.app {
    display: flex;
    height: 100vh;
    background: var(--chatooly-color-background);
    font-family: var(--chatooly-font-family);
}

.controls {
    width: 300px;
    padding: var(--chatooly-spacing-lg);
    background: var(--chatooly-color-surface);
    border-right: 1px solid var(--chatooly-color-border);
}

.canvas-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--chatooly-spacing-lg);
}

#chatooly-canvas {
    border: 1px solid var(--chatooly-color-border);
}

/* Chatooly auto-styles inputs, buttons, etc. */
```

---

## 📋 Implementation Tasks (Simplified)

### Day 1: Setup & Core (4 hours)
- [ ] Create 5 files with basic class structure
- [ ] Set up HTML with Chatooly canvas
- [ ] Basic CSS layout with Chatooly variables
- [ ] Canvas initialization and basic rendering

### Day 2: Text System (4 hours)
- [ ] Implement TextEngine with line parsing
- [ ] Add Canvas text measurement
- [ ] Handle per-line alignment
- [ ] Connect text input to engine

### Day 3: Algorithm (4 hours)
- [ ] Implement simple spot detection
- [ ] Handle rows, left/right spaces
- [ ] Add minimum size filtering
- [ ] Test with various text inputs

### Day 4: Visualization (4 hours)
- [ ] Draw spot outlines on canvas
- [ ] Add spot numbering
- [ ] Create spots list UI
- [ ] Add spot type dropdowns

### Day 5: Polish (2 hours)
- [ ] Add debug visualization toggle
- [ ] Test with different text combinations
- [ ] Basic error handling
- [ ] Clean up code

**Total: ~18 hours over 5 days**

---

## 🎯 Core Algorithm (Simplified)

```javascript
detect(canvas, textBounds) {
    const spots = [];
    let spotId = 1;
    let currentY = 0;
    
    // Process each text line
    for (let line of textBounds) {
        // Check space before text (left side)
        if (line.x > 0) {
            const width = line.x;
            const height = line.height;
            if (width >= 50 && height >= 50) {
                spots.push(new Spot(spotId++, 0, currentY, width, height));
            }
        }
        
        // Check space after text (right side)
        const remainingWidth = canvas.width - (line.x + line.width);
        if (remainingWidth >= 50) {
            const height = line.height;
            if (height >= 50) {
                spots.push(new Spot(spotId++, line.x + line.width, currentY, remainingWidth, height));
            }
        }
        
        currentY += line.height;
    }
    
    // Check remaining canvas space (bottom)
    const remainingHeight = canvas.height - currentY;
    if (remainingHeight >= 50) {
        spots.push(new Spot(spotId++, 0, currentY, canvas.width, remainingHeight));
    }
    
    return spots;
}
```

---

## ✅ Success Criteria (Final)

**Must Work:**
- [x] Text input updates canvas
- [x] "Find Spots" button detects areas
- [x] Spots drawn as numbered outlines
- [x] Spots list shows type dropdowns
- [x] Algorithm checks left/right of all lines
- [x] 50x50 minimum spot size

**That's it!** Simple, clean, working POC.

Ready to build this simplified version?