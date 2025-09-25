# Parameter Management System Documentation

## Overview

The Parameter Management System allows you to control which parameters can be randomized and which should stay fixed when shuffling for new design variations. This gives you precise control over what aspects of your design can change while keeping others consistent.

## 🎯 Key Concepts

### Parameters
Everything adjustable in your tool, from text content to colors to layout properties. Examples:
- `text` - Main text content
- `textColor` - Text color
- `fontFamily` - Font family selection
- `backgroundColor` - Canvas background color
- `paddingHorizontal` - Left/right padding

### Lock States
Each parameter can be:
- **🔒 Locked**: Won't change during shuffling
- **🔓 Unlocked**: Can be randomized during shuffling

### Parameter Groups
Parameters are organized into logical groups:
- **📝 Main Text**: Text content, font, styles, colors
- **📐 Layout**: Positioning, padding, spacing, modes
- **🎨 Background**: Background colors, opacity, transparency
- **📍 Spots**: Spot detection settings
- **🎯 Individual Spots**: Per-spot content and styling

## 🎲 Using the UI

### Quick Actions
1. **🎲 Shuffle All Unlocked** - Randomizes all unlocked parameters (with automatic color contrast)
2. **📐 Shuffle Layout Only** - Changes only layout/positioning
3. **🎨 Shuffle Colors Only** - Changes only colors (with automatic contrast protection)
4. **📍 Shuffle Spots Only** - Changes only spot content

### Parameter Groups
Each group has:
- **🔒 Lock All** - Locks all parameters in the group
- **🔓 Unlock All** - Unlocks all parameters in the group
- Individual parameter toggles for fine control

### Lock Summary
Shows current counts:
- **🔒 Locked**: Number of locked parameters
- **🔓 Unlocked**: Number of unlocked parameters

## 💻 Console Commands

Open browser dev tools (F12) and use these commands:

### Basic Shuffling
```javascript
shuffleAll()        // Shuffle all unlocked parameters
shuffleLayout()     // Shuffle layout only
shuffleColors()     // Shuffle colors only
shuffleSpots()      // Shuffle spots only
```

### Parameter Control
```javascript
// Lock/unlock individual parameters
lockParameter('textColor')
unlockParameter('textColor')

// Lock/unlock entire groups
lockGroup('mainText')
unlockGroup('background')

// Information commands
listParameters()      // See all parameters
getParameterSummary() // Get lock state counts
```

### Presets
```javascript
presets.minimal()     // Lock most, unlock basic colors & layout
presets.creative()    // Unlock everything except main text
presets.layout()      // Focus on positioning & spacing only
presets.spots()       // Focus on spot content & arrangement
```

## 🔧 Parameter Categories

### Main Text Parameters
- `text` - Main text content
- `textColor` - Text color
- `fontFamily` - Font family
- `fontSize` - Font size
- `fontWeight` - Bold/normal
- `fontStyle` - Italic/normal
- `underline` - Underline on/off
- `highlight` - Highlight on/off
- `highlightColor` - Highlight color
- `lineSpacing` - Line spacing (0-150px)

### Layout Parameters
- `mode` - Fill canvas vs manual mode (not shuffled - keeps user setting)
- `fontSize` - Font size (12-120px)
- `mainTextAlignment` - Text alignment within lines (left/center/right)
- `perLineAlignment` - Per-line alignment patterns (uniform/alternating/random/cascade)
- `mainTextPositionH` - Text block horizontal position (left/center/right)
- `mainTextPositionV` - Text block vertical position (top/middle/bottom)
- `textPositionVertical` - Legacy vertical position
- `textPositionHorizontal` - Legacy horizontal position
- `paddingHorizontal` - Left/right padding
- `paddingVertical` - Top/bottom padding
- `lineSpacing` - Line spacing (0-150px)

### Background Parameters
- `backgroundColor` - Background color
- `backgroundOpacity` - Background opacity
- `transparentBackground` - Transparent background toggle

### Spot Parameters
- `autoDetectSpots` - Auto-detection on/off
- `minSpotSize` - Minimum spot size

### Individual Spot Parameters
- `spot_type` - Spot type (empty/text/image/mask)
- `spot_text` - Spot text content
- `spot_color` - Spot text color
- `spot_alignment` - Text alignment
- `spot_position` - Position in spot
- `spot_styles` - Text styles (bold, italic, etc.)
- `spot_scale` - Image scale
- `spot_rotation` - Image rotation

## 🎨 Example Workflows

### Scenario 1: Brand Consistency
**Goal**: Keep brand text and colors consistent, vary layout only

```javascript
// Lock brand elements
lockParameter('text')
lockParameter('textColor')
lockParameter('backgroundColor')

// Unlock layout for variation
unlockGroup('layout')

// Shuffle layout variations
shuffleLayout()
```

### Scenario 2: Creative Exploration
**Goal**: Generate many creative variations while keeping core text

```javascript
// Apply creative preset
presets.creative()

// Generate variations
shuffleAll()
```

### Scenario 3: Color Exploration
**Goal**: Try different color combinations with fixed layout

```javascript
// Lock everything except colors
lockGroup('layout')
lockGroup('spots')
lockParameter('text')

// Unlock colors
unlockParameter('textColor')
unlockParameter('backgroundColor')
unlockParameter('highlightColor')

// Try color variations
shuffleColors()
```

### Scenario 4: Spot Content Variations
**Goal**: Keep main design, vary spot content only

```javascript
// Lock main design
lockGroup('mainText')
lockGroup('layout')
lockGroup('background')

// Focus on spots
unlockGroup('individual_spots')

// Generate spot variations
shuffleSpots()
```

## 💾 Persistence

### Save/Load Lock States
```javascript
// Manual save/load (also available in UI)
app.parameterManager.saveLockStates()
app.parameterManager.loadLockStates()

// Reset to defaults
resetAllLocks()
```

Lock states are automatically saved to browser localStorage and restored when you reload the page.

## 🔍 Advanced Usage

### Custom Shuffle Options
```javascript
// Shuffle with specific options
app.parameterManager.shuffleUnlockedParameters({
    includeGroups: ['mainText', 'background'],
    excludeGroups: ['spots'],
    includeSpots: false
})
```

### Check Parameter States
```javascript
// Check if parameter is locked
app.parameterManager.isLocked('textColor')

// Get all unlocked parameters
app.parameterManager.getUnlockedParameters()

// Get parameter definition
app.parameterManager.parameterDefinitions.textColor
```

### Direct Parameter Control
```javascript
// Toggle specific parameter
app.parameterManager.toggleParameterLock('fontSize')

// Get lock summary
app.parameterManager.getLockSummary()
```

## 🎯 Tips for Best Results

### Start with Presets
Use the built-in presets as starting points:
- `presets.minimal()` for conservative variations
- `presets.creative()` for bold experimentation
- `presets.layout()` for positioning focus
- `presets.spots()` for content focus

### Iterative Refinement
1. Start with a preset
2. Shuffle to see variations
3. Lock parameters you like
4. Unlock parameters you want to vary more
5. Shuffle again

### Group-Level Control
Use group lock/unlock for quick broad changes:
- Lock `mainText` to preserve branding
- Unlock `layout` to explore positioning
- Lock `spots` to focus on main design

### Parameter-Level Control
Fine-tune with individual parameter toggles:
- Lock specific colors you like
- Unlock specific fonts to try
- Keep certain spacing but vary others

## 🐛 Troubleshooting

### Parameters Not Changing
- Check if parameter is locked (🔒 in UI)
- Verify parameter is in selected shuffle groups
- Try `listParameters()` to see all states

### UI Not Updating
- Check browser console for errors
- Try refreshing the page
- Verify all script files are loaded

### Unexpected Results
- Use `getParameterSummary()` to check states
- Try `resetAllLocks()` to start fresh
- Check if auto-detect spots is interfering

## 🚀 Getting Started

1. **Open the Parameters tab** in the tool sidebar
2. **Try a preset**: Click `presets.creative()` in console
3. **Shuffle**: Click "🎲 Shuffle All Unlocked"
4. **Refine**: Lock parameters you like, unlock others
5. **Repeat**: Shuffle again for new variations

The parameter system gives you powerful control over design generation - experiment and have fun!

## 🎨 Automatic Color Contrast Protection

The system automatically ensures good readability by preventing text and background color conflicts:

### How It Works
- **Detects similar colors**: Uses color distance calculation to identify problematic combinations
- **Automatic resolution**: When colors are too similar, automatically selects a contrasting alternative
- **Smart contrast**: Chooses dark colors for light backgrounds and bright colors for dark backgrounds
- **Preserves intent**: Tries to keep your preferred color when possible, only changing the conflicting one

### Examples
```javascript
// If shuffle picks black text on dark gray background:
// System detects conflict and automatically changes to white text

// If shuffle picks white text on light gray background:
// System detects conflict and automatically changes to black text
```

### Test It
```javascript
testColorContrast()    // Demo the contrast detection system
forceColorConflict()   // See automatic conflict resolution in action
```