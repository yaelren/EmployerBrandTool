# Custom Font Upload System

## Overview

The Custom Font Upload System allows users to upload and use custom fonts in both the main text and spot text components. The system supports WOFF, WOFF2, TTF, and OTF font formats with a maximum file size of 5MB.

## Features

- **Font Upload**: Drag and drop or click to upload font files
- **Font Management**: Preview, manage, and remove uploaded fonts
- **Persistence**: Custom fonts are saved in localStorage and persist across sessions
- **Integration**: Works with both main text and spot text components
- **Validation**: File type and size validation with user-friendly error messages
- **Preview**: Live preview of uploaded fonts before use

## Architecture

### Core Components

1. **FontManager.js** - Core font management functionality
2. **FontUploadComponent.js** - UI component for font upload and management
3. **TextComponent.js** - Updated to include custom fonts in available options
4. **UIManager.js** - Integration with main text controls
5. **TextContentController.js** - Integration with spot text controls

### File Structure

```
js/text/
├── FontManager.js           # Core font management
├── FontUploadComponent.js   # UI component
└── TextComponent.js         # Updated with custom font support
```

## Usage

### Main Text Font Upload

1. **Access**: Click the 📁 button next to the Font dropdown in the main text controls
2. **Upload**: 
   - Click "Upload Font" button
   - Drag and drop font files onto the dropzone
   - Or click the dropzone to browse for files
3. **Select**: Choose the uploaded font from the Font dropdown (marked as "Custom")
4. **Manage**: Use the font list to preview or remove fonts

### Spot Text Font Upload

1. **Access**: In spot text controls, click "Upload Font" button
2. **Upload**: Same process as main text
3. **Select**: Choose the uploaded font from the spot's Font dropdown
4. **Manage**: Preview or remove fonts using the provided controls

## API Reference

### FontManager

```javascript
// Initialize
const fontManager = new FontManager();

// Upload font
const fontData = await fontManager.uploadFont(file);

// Get custom fonts
const customFonts = fontManager.getCustomFonts();

// Remove font
const success = fontManager.removeCustomFont(fontName);

// Check if font is ready
const isReady = await fontManager.isFontReady(fontFamily);
```

### FontUploadComponent

```javascript
// Initialize
const uploadComponent = new FontUploadComponent(fontManager);

// Create upload UI
uploadComponent.createUploadUI(container, onFontsChanged);

// Refresh font list
uploadComponent.refresh();
```

### TextComponent

```javascript
// Get all available fonts (including custom)
const fonts = TextComponent.getAvailableFonts();

// Font objects include:
// - name: Display name
// - value: CSS font-family value
// - isCustom: Boolean indicating if it's a custom font
// - uploadedAt: Upload timestamp (for custom fonts)
// - size: File size (for custom fonts)
```

## Supported Font Formats

- **WOFF** (Web Open Font Format)
- **WOFF2** (Web Open Font Format 2.0)
- **TTF** (TrueType Font)
- **OTF** (OpenType Font)

## File Size Limits

- Maximum file size: 5MB
- Validation occurs before upload
- User-friendly error messages for oversized files

## Storage

- Custom fonts are stored in browser localStorage
- Fonts persist across browser sessions
- Storage key: `customFonts`
- Data format: JSON array of font objects

## Error Handling

The system provides comprehensive error handling for:

- Invalid file types
- Oversized files
- Duplicate font names
- File read errors
- Font loading failures

## Browser Compatibility

- Modern browsers with localStorage support
- Canvas API support for font rendering
- File API support for uploads
- CSS @font-face support

## Testing

A test file `font-upload-test.html` is provided to verify:

- FontManager initialization
- FontUploadComponent functionality
- TextComponent integration
- Font loading and rendering

## Security Considerations

- Font files are stored as base64 data URLs
- No server-side processing required
- Client-side validation only
- Fonts are scoped to the current domain

## Performance Notes

- Fonts are loaded using CSS @font-face with `font-display: swap`
- Custom fonts are loaded on-demand
- Font metrics are cached for performance
- Large font files may impact page load time

## Troubleshooting

### Common Issues

1. **Font not appearing in dropdown**
   - Check browser console for errors
   - Verify font file format is supported
   - Ensure file size is under 5MB

2. **Font not rendering**
   - Check if font is properly loaded
   - Verify CSS @font-face rule was created
   - Test with browser developer tools

3. **Upload fails**
   - Check file format and size
   - Verify browser supports File API
   - Check localStorage availability

### Debug Mode

Enable debug logging by opening browser console. The system logs:
- Font upload progress
- Font loading status
- Error messages
- Performance metrics

## Future Enhancements

Potential improvements for future versions:

- Google Fonts integration
- Font subsetting for smaller file sizes
- Font preview with custom text
- Font categorization and tags
- Import/export font collections
- Font licensing information
- Server-side font storage
- Font optimization and compression
