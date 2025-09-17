# Employer Brand Tool - POC

A text-driven layout tool with automatic open-spot detection for employer branding content creation.

## 📁 Project Structure

```
employer-brand-tool/
├── index.html              # Main application entry point
├── style.css              # Custom styles (extends Chatooly)
├── js/                    # JavaScript modules
│   ├── chatooly-config.js # Chatooly configuration
│   ├── Spot.js           # Spot data model
│   ├── SpotDetector.js   # Core detection algorithm
│   ├── TextEngine.js     # Text parsing & measurement
│   ├── CanvasManager.js  # Canvas rendering
│   ├── app.js           # Main application controller
│   └── main.js          # Legacy file (unused)
├── docs/                 # Documentation
│   ├── POC_SIMPLIFIED.md # Simple implementation spec
│   └── POC_SPECIFICATION.md # Detailed spec
├── claude-rules/         # Development rules for Claude
└── CLAUDE.md            # Claude Code instructions
```

## 🚀 How to Run

### Option 1: Direct Browser (Simplest)
1. Simply open `index.html` in any modern browser
2. No server needed for basic functionality

### Option 2: Local Server (Recommended)
```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if you have it)
npx serve .
```

Then visit: `http://localhost:8000`

## 🎯 How to Use

1. **Enter Text**: Type your main text (each line can have different alignment)
2. **Adjust Settings**: Font size, line height, minimum spot size
3. **Find Spots**: Click "Find Open Spots" to run the algorithm
4. **Configure Spots**: Set each spot type (Empty/Image/Text/Mask)
5. **Debug**: Toggle visual aids to see how the algorithm works

## 🧠 How It Works

### Core Concept
The text placement creates a dynamic grid structure:
- Each line of text defines rows
- Algorithm finds empty spaces left/right of text
- Remaining canvas space becomes additional spots

### Example
```
Input: "EMPLOYEE\nSPOTLIGHT\n2024"

Result:
┌────────┬─────────┬────────┐
│ Spot 1 │EMPLOYEE │ Spot 2 │  Row 1
├────────┴─────────┴────────┤
│       SPOTLIGHT           │  Row 2
├──────┬────────────────────┤
│ 2024 │      Spot 3        │  Row 3
├──────┴────────────────────┤
│         Spot 4            │  Remaining space
└───────────────────────────┘
```

## 🛠️ Key Features

- ✅ **Text-Driven Layout**: Main text defines the grid structure
- ✅ **Per-Line Alignment**: Each line can be left/center/right aligned
- ✅ **Smart Detection**: Finds all available spaces ≥ minimum size
- ✅ **Visual Feedback**: Numbered outlines show detected spots
- ✅ **Spot Types**: Empty, Image, Text, or Mask (with opacity)
- ✅ **Debug Mode**: See algorithm steps and text bounds
- ✅ **Export Ready**: Chatooly-compliant for high-res exports

## 🧪 Testing

Open browser console and try:
```javascript
// Run automated test
window.app.runTest()

// Get current state
window.app.getState()

// Access components directly
window.app.textEngine.getStatistics()
window.app.spotDetector.getDebugInfo()
```

## 📊 Algorithm Details

The `SpotDetector` uses a line-based strategy:

1. **Parse Text Lines**: Each line becomes a row
2. **Check Horizontal Spaces**: Find empty areas left/right of text
3. **Check Vertical Gaps**: Find spaces between text lines
4. **Check Remaining Space**: Find areas above/below all text
5. **Filter by Size**: Remove spots smaller than minimum
6. **Number Sequentially**: Assign IDs for UI reference

## 🔗 Chatooly Integration

This tool is built on the Chatooly framework:
- Uses Chatooly CSS variables for theming
- Exports high-resolution images via CDN
- Follows Chatooly canvas structure requirements
- Automatic dark theme styling

## 🐛 Troubleshooting

**No spots detected?**
- Check minimum spot size setting
- Ensure text isn't filling entire canvas
- Try different text alignment

**Canvas not showing?**
- Check browser console for errors
- Ensure all JavaScript files loaded correctly
- Try refreshing the page

**Export not working?**
- Chatooly CDN must be loaded
- Canvas must have id="chatooly-canvas"
- Check browser compatibility