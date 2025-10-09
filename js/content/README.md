# Spot System Components

This directory contains all components related to the spot detection and management system.

## Core Classes

### Data Model
- **Spot.js** - Main data model for detected spots, handles rendering and content management

### Detection System  
- **SpotDetector.js** - Text-driven layout algorithm for finding open spots in the canvas

### Controller System
- **SpotController.js** - Base controller class with common functionality
- **EmptySpotController.js** - Handles empty spots (minimal controls)
- **TextSpotController.js** - Manages text spots with full text editing capabilities
- **ImageSpotController.js** - Handles image spots with scale/rotation controls
- **MaskSpotController.js** - Manages mask spots that reveal background images

## Dependencies

### Load Order (maintained in index.html):
1. `Spot.js` - Core data model (no dependencies)
2. `SpotDetector.js` - Detection algorithm (depends on Spot.js)
3. `SpotController.js` - Base controller (no dependencies)
4. `EmptySpotController.js` - Extends SpotController
5. `TextSpotController.js` - Extends SpotController, uses TextComponent
6. `ImageSpotController.js` - Extends SpotController
7. `MaskSpotController.js` - Extends SpotController

### External Dependencies:
- **TextComponent.js** - Required by Spot.js and TextSpotController.js
- All controllers depend on a main app instance passed to their constructors

## Integration

These components are integrated into the main application through:
- `app.js` - Main application controller
- `CanvasManager.js` - Canvas rendering and interaction handling
- `index.html` - Script loading order and initialization