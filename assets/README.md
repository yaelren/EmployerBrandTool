# Assets Folder - Image Shuffle System

This folder contains image assets that can be used in the parameter shuffling system for backgrounds and spots.

## Folder Structure

```
assets/
├── backgrounds/     # Background images for canvas
├── spots/          # Images for spot content  
├── manifest.json   # List of available images
└── README.md       # This file
```

## How to Add Images (Zero Configuration!)

🎯 **SUPER SIMPLE: Just add images and run dev mode!**

### Quick Start (Recommended)
```bash
# 1. Add ANY images to folders:
# assets/backgrounds/ - Any images you want as backgrounds  
# assets/spots/ - Any images you want in spots

# 2. Start development (auto-scans and serves):
npm run dev

# 3. Visit: http://localhost:3000 - All images ready!
```

### Step-by-Step Details

**Step 1: Add Images to Folders**
Put any image files in the appropriate folders:
- `assets/backgrounds/` - Any images you want as backgrounds
- `assets/spots/` - Any images you want in spots

**Step 2: Use ANY Filenames**
The system doesn't care what you name your files! Examples:

**Any of these work:**
- `1.jpg`, `2.png`, `3.webp` 
- `photo.jpg`, `image.png`, `pic.gif`
- `my-background.jpg`, `company-logo.svg`
- `vacation-photo.jpeg`, `random-pic.webp`
- `a.jpg`, `b.png`, `xyz.gif`

**The system automatically finds:**
- Common numbered files: `1.jpg`, `2.png`, `10.webp`, etc.
- Generic names: `image.jpg`, `pic.png`, `photo.gif`, etc. 
- Letter names: `a.jpg`, `b.png`, `c.svg`, etc.
- ANY files listed in `manifest.json` (if you create one)
- ANY files in directory listing files

### Advanced Options (Optional)

**Option 1: Manifest File** (for explicit control)
```json
{
  "backgrounds": ["backgrounds/any-name.jpg"],
  "spots": ["spots/whatever.png"]
}
```

**Option 2: Directory Listing** (for server integration)
```json
{
  "files": [
    "backgrounds/file1.jpg",
    "spots/file2.png"
  ]
}
```

## Supported Image Formats

- JPG/JPEG
- PNG
- WebP
- GIF
- SVG (for spot images)

## Usage in Shuffling

### Background Images
When shuffling background parameters, the system will:
1. Randomly select an image from `assets/backgrounds/`
2. Apply it as the canvas background
3. Render it behind all other content

### Spot Images  
When shuffling individual spots with type "image", the system will:
1. Randomly select an image from `assets/spots/`
2. Apply scaling (0.5x to 2.0x)
3. Apply rotation (-45° to +45°)
4. Position according to spot settings

## Console Commands

Test the automatic discovery system in the browser console:

```javascript
// Check what images were discovered
app.assetManager.getCacheStats()

// See all discovered background images
app.assetManager.getBackgroundImagePaths()

// See all discovered spot images  
app.assetManager.getSpotImagePaths()

// Test random image selection
app.assetManager.getRandomBackgroundImage().then(img => console.log('Random bg:', img))
app.assetManager.getRandomSpotImage().then(img => console.log('Random spot:', img))

// Force re-discovery (after adding new images)
await app.assetManager.initialize()

// Shuffle with auto-discovered images
await app.parameterManager.shuffleUnlockedParameters({
    includeGroups: ['background', 'individual_spots'],
    includeSpots: true
})
```

## Performance Notes

- Images are cached after first load
- Multiple spots can use the same image without re-loading
- Large images are automatically scaled to fit canvas dimensions
- SVG images work well for spots but not recommended for backgrounds

## Troubleshooting

If images aren't loading:
1. Check browser console for error messages
2. Verify file paths in manifest.json are correct
3. Ensure image files exist in the correct folders
4. Check that images are web-accessible (no CORS issues)

The system will gracefully fallback to color-only modes if no images are available.