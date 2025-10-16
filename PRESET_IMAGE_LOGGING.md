# Preset Image Logging Guide

This document explains the console logs you'll see when saving and loading presets with images.

## 🎯 Quick Summary

Images ARE working in the preset system! The logs will help you see exactly what's happening at each step.

---

## 💾 SAVE FLOW - What You'll See

### When you click "Save to Cloud":

```
🔄 Starting cloud save: "Your Preset Name"
```

### 1. Serialization Phase

**Background:**
```
📸 SAVE: Serializing background state...
   → Has image element: true
   → Image element type: HTMLImageElement
   → Image dimensions: 1920 x 1080
   → Image will be uploaded to cloud
```

**What this means:**
- ✅ Background image was found and captured
- Shows the original image dimensions
- Image element is ready for upload

**If no image:**
```
📸 SAVE: Serializing background state...
   → Has image element: false
   → No image to serialize
```

**Cell Images:**
```
📸 SAVE: Processing cell content-1-0 with image
   → Image dimensions: 232 x 232
```

**What this means:**
- ✅ Cell image found in grid
- Image captured from `cell.content.media`
- Ready for upload as `imageElement`

### 2. Background Image Upload

```
📤 SAVE: Uploading background image...
   → Image element type: HTMLImageElement
   → Image dimensions: 1920 x 1080

📤 Processing image: bg-Your Preset Name-1760615884781.png
✅ Image processed (using data URL for now)
⚠️ Production: This would upload to Wix CDN

   ✅ Data URL created, length: 2250 characters
   → Preview: data:image/png;base64,iVBORw0KGgoAAAANS...
```

**What this means:**
- ✅ Image was converted to data URL (base64 PNG)
- Shows the data URL length (bigger images = longer URLs)
- **Important:** Currently using data URLs, production will use Wix CDN

### 3. Cell Images (if grid has images)

```
📋 SAVE: Checking 6 cells for images...

📤 SAVE: Uploading cell image 1...
   → Cell index: 2
   → Image dimensions: 800 x 600
   ✅ Cell image uploaded, URL length: 1850 characters

📤 SAVE: Uploading cell image 2...
   → Cell index: 4
   → Image dimensions: 640 x 480
   ✅ Cell image uploaded, URL length: 1200 characters

✅ SAVE: Uploaded 2 cell image(s)
```

**What this means:**
- Shows how many cells were checked
- Lists each cell that has an image
- Shows dimensions and data URL size for each

### 4. Final Save

```
💾 Saving preset to Wix...
💾 Saving preset to localStorage: "Your Preset Name"
✅ Preset saved with ID: preset_1760615884783
⚠️ Production: This would save to Wix Data Collections
✅ Preset saved to cloud: "Your Preset Name"
```

---

## 📥 LOAD FLOW - What You'll See

### When you click "Load":

```
🔄 Loading preset from cloud: preset_1760615884783
📥 Loading preset from localStorage: preset_1760615884783
✅ Preset loaded: "Your Preset Name"
⚠️ Production: Would fetch from Wix Data Collections
```

### 1. Deserialization Phase

```
📦 LOAD: Deserializing preset...
   → Preset name: Your Preset Name
   → Has background image: true
   → Background image URL length: 2250 characters
```

**What this means:**
- Preset data was retrieved from localStorage
- Confirms whether background image exists
- Shows the data URL size

### 2. Restoring Canvas

```
🔄 LOAD: Restoring canvas state...
```

### 3. Restoring Background Image

```
🔄 LOAD: Restoring background state...

🔄 LOAD: Restoring background image...
   → URL type: data:image/png;base64,iVBORw0K
   → URL length: 2250 characters

   ✅ Background image loaded and set!
   → Image size: 1920 x 1080
   → Now visible on canvas
```

**What this means:**
- ✅ Image was successfully loaded from data URL
- Browser decoded the base64 data
- Image was set as canvas background
- **You should see it on screen now!**

**If image fails:**
```
   ❌ LOAD: Failed to load background image!
   → Error type: error
   → URL preview: data:image/png;base64,iVBORw0KGgoAAAANSU...
```

### 4. Restoring Grid & Text

```
🔄 LOAD: Restoring main text state...
🔄 LOAD: Restoring grid state...
```

### 5. Restoring Cell Images (if any)

```
🔄 LOAD: Restoring cell image for content-1-0...
   → URL type: data:image/png;base64,iVBORw0K
   → URL length: 103186 characters

   ✅ Cell image loaded and set! (content-1-0)
   → Image size: 232 x 232
   → cell.content.media set to: HTMLImageElement
   → Triggering canvas render...
```

**What this means:**
- Each cell image is loaded asynchronously
- Image is set to `cell.content.media` (required for CellRenderer)
- Canvas re-renders when each image loads
- You'll see images appear one by one on the grid

### 6. Final Load

```
✅ Preset loaded successfully
✅ Preset loaded from cloud: "Your Preset Name"
```

---

## 🐛 Troubleshooting

### "ℹ️ SAVE: No background image to upload"
**Cause:** No background image is set
**Fix:** Add a background image before saving

### "ℹ️ LOAD: No background image URL to restore"
**Cause:** Preset was saved without a background image
**Fix:** Normal - preset has no background image

### "❌ LOAD: Failed to load background image!"
**Possible causes:**
1. **Data URL corrupted** - Try saving the preset again
2. **localStorage quota exceeded** - Image too large for localStorage
3. **Browser security restrictions** - Check browser console

### "✅ Cell image loaded and set!" but image not visible
**Cause:** Image was loaded but not set to correct property
**Fixed in:** PresetManager.js line 613 - now sets `cell.content.media` (not `.image`)
**Verify:** Check console for `→ cell.content.media set to: HTMLImageElement`

### "⚠️ Production: This would upload to Wix CDN"
**What it means:**
- This is expected in development
- Using localStorage fallback with data URLs
- Production will use real Wix CDN uploads

---

## 📊 Understanding Data URLs

### What is a data URL?
```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAM...
```

- **Prefix:** `data:image/png;base64,` (tells browser it's a PNG image)
- **Data:** Base64 encoded image data
- **Size:** Roughly 33% larger than original file

### Size Limits
- **localStorage limit:** ~5-10MB depending on browser
- **Typical image sizes:**
  - Small icon (50x50): ~200-500 characters
  - Medium image (800x600): ~1,000-3,000 characters
  - Large image (1920x1080): ~5,000-15,000 characters
  - Very large (4K): May exceed localStorage limits!

### Production vs Development
| Feature | Development (Current) | Production (Future) |
|---------|----------------------|---------------------|
| Storage | localStorage | Wix Data Collections |
| Images | Data URLs (base64) | Wix CDN URLs |
| Size Limit | ~5-10MB | No practical limit |
| Speed | Instant | Network dependent |
| Persistence | Browser only | Cross-device |

---

## ✅ Expected Behavior

### Successful Save
1. ✅ Serialization logs show image found
2. ✅ Upload logs show data URL created
3. ✅ Preset appears in dropdown
4. ✅ Success notification shown

### Successful Load
1. ✅ Deserialization logs show image URL found
2. ✅ Background image loads with dimensions
3. ✅ Image visible on canvas
4. ✅ Success notification shown

---

## 🔍 Debugging Tips

### Check localStorage directly:
Open browser console and run:
```javascript
const presets = JSON.parse(localStorage.getItem('wix_presets'));
console.log(presets[0].settings.background.imageURL?.substring(0, 100));
```

### Verify image element:
```javascript
console.log(window.app.canvasManager.backgroundManager.backgroundImage);
```

### Check preset data:
```javascript
const presets = JSON.parse(localStorage.getItem('wix_presets'));
console.log('Has background URL:', !!presets[0].settings.background.imageURL);
console.log('URL length:', presets[0].settings.background.imageURL?.length);
```

---

## 📝 Notes

- **Images work!** The test confirmed full save/load functionality
- Data URLs are temporary - production will use Wix CDN
- Large images may hit localStorage limits (switch to Wix when ready)
- Cell images work the same way as background images
- All logs prefixed with SAVE: or LOAD: for easy filtering
