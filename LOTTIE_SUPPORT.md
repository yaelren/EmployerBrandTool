# Lottie Animation Support

## Overview
The media cell type now supports uploading and displaying Lottie JSON animations alongside images, videos, and GIFs.

## What's New

### Features Added
1. **Lottie JSON Upload**: Media cells can now accept `.json` files containing Lottie animation data
2. **Automatic Rendering**: Lottie animations are automatically rendered to canvas and displayed in cells
3. **Loop Control**: Lottie animations support loop toggling, just like videos
4. **Standard Controls**: All existing media controls work with Lottie:
   - Fill Mode (Stretch, Fit, Fill/Crop)
   - Scale (in Free mode)
   - Rotation
   - Position alignment
   - Padding
   - Background fill options

## How to Use

### Upload a Lottie Animation
1. Select a media cell (image content type) in the Grid Editor
2. Click the media upload control
3. Choose a `.json` file containing Lottie animation data
4. The animation will automatically load and start playing

### Controls Available
- **Loop Toggle**: Enable/disable animation looping (enabled by default)
- **Fill Mode**: Choose how the animation fits in the cell
- **Scale**: Adjust size (only in Free mode)
- **Rotation**: Rotate the animation
- **Position**: Align within the cell (9-point grid)
- **Padding**: Add padding around the animation

### Technical Details

#### Implementation
- Lottie animations are loaded using the `lottie-web` library (v5.12.2)
- Animations are rendered to an off-screen canvas
- The canvas is then drawn to the main canvas using standard image rendering
- Animation instances are properly cleaned up when removed

#### File Format
- Accepts `.json` files or files with `application/json` MIME type
- Must be valid Lottie JSON format (exported from After Effects, etc.)

#### Performance
- Lottie animations use the canvas renderer for optimal performance
- Animations auto-play and loop by default
- The animation loop is synchronized with the application's render loop

## Example Use Cases

1. **Logo Animations**: Add animated logos to your employer brand designs
2. **Icon Animations**: Use animated icons for visual interest
3. **Background Elements**: Create dynamic background effects
4. **Transitions**: Add smooth animated transitions between sections

## File Sources

You can get Lottie JSON files from:
- **LottieFiles**: https://lottiefiles.com/
- **After Effects**: Export using Bodymovin plugin
- **Custom Animations**: Create with animation tools that support Lottie export

## Troubleshooting

### Animation Not Playing
- Ensure the JSON file is valid Lottie format
- Check browser console for error messages
- Try refreshing the page if the Lottie library didn't load

### Animation Quality Issues
- Lottie animations maintain their original resolution
- For best quality, ensure your animation dimensions match your intended display size
- Use the Scale control to adjust size as needed

### Memory Issues with Large Files
- Very complex Lottie files may impact performance
- Consider simplifying animations or reducing layer count
- Remove the animation and add a simpler version if needed

## Code Changes

### Files Modified
1. `index.html` - Added lottie-web library script
2. `js/content/ImageContentController.js`:
   - Updated file input to accept JSON files
   - Added `handleLottieUpload()` method
   - Updated `removeMedia()` to clean up Lottie instances
   - Added loop control for Lottie animations
3. `js/grid/CellRenderer.js`:
   - Added HTMLCanvasElement handling for rendering
   - Lottie animations render like other media types

### New Properties
Cell content now includes:
- `mediaType: 'lottie'` - Identifies Lottie animations
- `lottieAnimation` - Stores the Lottie animation instance

