# Asset Scanner - Get All Files from Folders

🎯 **The easiest way to use images: Just add them and scan!**

## How It Works

1. **Add images** to `assets/backgrounds/` and `assets/spots/` folders
2. **Run the scanner**: `npm run scan-assets`  
3. **Refresh the page** - all images will be available for shuffling!

## Usage

### Easy Development Mode (Recommended)
```bash
# Add any images to the folders (any filenames work)
# Then run:
npm run dev
```

This automatically:
1. 🔍 Scans for ALL image files in both folders
2. 📁 Creates `assets/files.json` with complete listing  
3. 🚀 Starts the development server
4. 🎲 Makes all images available for shuffling

### Manual Asset Scanning
```bash
# Just scan assets without starting server:
npm run scan-assets
```

The scanner will:
- 🔍 Find **ALL** image files in both folders
- 📁 Create `assets/files.json` with complete listing
- ✅ List every single image file it finds
- 🎲 Make them all available for shuffling

## Supported File Types

- JPG/JPEG
- PNG  
- WebP
- GIF
- SVG

## Example Workflow

### Quick Development (Recommended)
```bash
# 1. Add your images (any names work!)
cp ~/Desktop/vacation-photo.jpg assets/backgrounds/
cp ~/Downloads/company-logo.png assets/spots/
cp ~/Pictures/*.jpg assets/backgrounds/

# 2. Start development with auto-scanning
npm run dev

# Visit: http://localhost:3000 - all images ready!
```

### Manual Workflow  
```bash
# 1. Add your images (any names work!)
cp ~/Desktop/vacation-photo.jpg assets/backgrounds/
cp ~/Downloads/company-logo.png assets/spots/
cp ~/Pictures/*.jpg assets/backgrounds/

# 2. Scan to find all files
npm run scan-assets

# 3. Check what was found
cat assets/files.json

# 4. Open webpage - images now available!
open index.html
```

## Output

The scanner creates `assets/files.json` with this structure:

```json
{
  "backgrounds": [
    "backgrounds/vacation-photo.jpg",
    "backgrounds/sunset.png",
    "backgrounds/texture.webp"
  ],
  "spots": [
    "spots/company-logo.png", 
    "spots/icon.svg",
    "spots/badge.jpg"
  ],
  "totalFiles": 6,
  "generated": "2025-01-08T10:30:00.000Z"
}
```

## Benefits

- **Zero Configuration** - No need to list filenames manually
- **Any Filenames Work** - vacation-photo.jpg, random-pic.png, whatever.svg
- **Recursive Scanning** - Finds files in subfolders too
- **Complete Discovery** - Gets every single image file
- **Fast Updates** - Just re-run the scan when you add new images

## Integration

The AssetManager automatically looks for `assets/files.json` first. If found, it uses the complete listing instead of guessing at filenames.

This is the **best method** for image discovery - no guesswork, no missed files, just complete folder scanning!

## Automation Ideas

Add to your workflow:
```bash
# Watch for changes and auto-scan
# (requires additional setup with file watchers)

# Or add to git hooks
echo "npm run scan-assets" > .git/hooks/post-merge
chmod +x .git/hooks/post-merge
```

Now you can just drop images in folders and the shuffle system will find them all! 🎨✨