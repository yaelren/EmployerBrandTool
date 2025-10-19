# CDN URL Implementation Plan

## 🧪 Test Results Summary

**Date**: 2025-10-19

### ✅ What Works:
1. **Loading from CDN URLs** - Perfect! No CORS issues
   - Background images load successfully from Wix CDN
   - Image displays correctly on canvas
   - URL length: ~80 bytes (vs ~266KB for data URLs)

2. **CDN URL Format**:
   ```
   https://static.wixstatic.com/media/959e32_bd7930840ec040cfb18380c71af7e0d2~mv2.jpg
   ```

3. **Public Access**: CDN URLs require no authentication to load

### ❌ What Doesn't Work:
1. **Uploading to Media Manager** - CORS blocks browser-side calls
   - Error: `Request header field wix-site-id is not allowed`
   - Root cause: Wix Media Manager upload API designed for server-side only
   - Current behavior: Falls back to data URLs (bloated)

### 📊 Size Comparison:
- **CDN URL**: 82 bytes
- **Data URL**: 212,420 bytes (2,590x larger!)

---

## 🎯 Recommended Solution: Hybrid Approach

Since **loading works** but **uploading doesn't**, we'll use a **manual upload + CDN URL** workflow:

### User Workflow:

1. **Upload assets to Wix Media Manager manually** (one-time setup)
   - User goes to Wix dashboard → Media Manager
   - Uploads all images/videos they want to use
   - Wix generates permanent CDN URLs

2. **Use CDN URLs in the tool** (during creative work)
   - Browse button shows text input for CDN URL
   - User pastes the CDN URL from Media Manager
   - Tool loads and displays the media
   - Preset saves the tiny CDN URL (not data URL)

3. **Presets save/load efficiently**
   - Preset JSON contains CDN URLs (~80 bytes each)
   - Total preset size stays tiny (under document limits)
   - Loading presets fetches media from CDN
   - No authentication needed for loading

### Benefits:
- ✅ Solves data URL bloat problem (2,590x size reduction)
- ✅ Enables video support (data URLs too large for videos)
- ✅ No backend needed (CDN URLs are public)
- ✅ Works with existing Wix infrastructure
- ✅ Permanent, reliable URLs
- ✅ No CORS issues for loading

### Trade-offs:
- ⚠️ Manual upload step required (but only once per asset)
- ⚠️ No browse/picker UI (just URL input fields)
- ⚠️ User needs to manage Media Manager separately

---

## 📋 Implementation Tasks

### Phase 1: Update Save Logic ✅ TESTED
- [x] Test CDN URL loading (background media)
- [x] Verify no CORS issues when loading
- [x] Confirm URL size vs data URL size

### Phase 2: Add CDN URL Input Fields
**Location 1: Background Media**
- [x] Add text input for CDN URL (already added as test)
- [ ] Add helpful label: "Paste Wix Media Manager URL"
- [ ] Add validation for Wix CDN URL format
- [ ] Keep existing file upload as fallback

**Location 2: Cell Media (Grid)**
- [ ] Add CDN URL input option per cell
- [ ] Update ImageContentController to support CDN URLs
- [ ] Show preview when CDN URL is pasted
- [ ] Keep existing file upload as fallback

### Phase 3: Update PresetManager Save Logic
**Current behavior**: Always tries to upload, falls back to data URL

**New behavior**:
```javascript
// If media source is CDN URL → save CDN URL directly
// If media source is File upload → save as data URL (or show warning)
// If media source is HTMLImageElement with .src CDN URL → extract and save URL
```

**Files to modify**:
- `js/PresetManager.js` - Update `saveToCloud()` method
- Check if background image source is CDN URL
- Check if cell media sources are CDN URLs
- Store CDN URLs in preset JSON instead of attempting upload

### Phase 4: Update PresetManager Load Logic
**Current behavior**: Loads data URLs or uploaded media URLs

**New behavior**:
- If preset contains CDN URL → load from CDN
- If preset contains data URL → load data URL (legacy support)
- Add loading indicators for CDN fetches

**Files to modify**:
- `js/PresetManager.js` - Update `loadFromCloud()` method

### Phase 5: UI/UX Enhancements
- [ ] Add "How to get CDN URL" help text/link
- [ ] Add CDN URL format validation
- [ ] Show file size comparison (CDN URL vs data URL)
- [ ] Add success/error feedback for CDN loading
- [ ] Consider thumbnail preview for CDN URLs

### Phase 6: Documentation
- [ ] Create user guide: "How to Upload to Wix Media Manager"
- [ ] Create user guide: "How to Get CDN URLs"
- [ ] Update tool instructions to explain CDN workflow
- [ ] Add tooltips/help text in UI

---

## 🔧 Technical Implementation Details

### Detecting CDN URL Sources

When saving, check if media source is a CDN URL:

```javascript
// In PresetManager.js saveToCloud() method

// For background image
if (this.backgroundImage) {
    const imgSrc = this.backgroundImage.src;

    if (imgSrc.startsWith('https://static.wixstatic.com/media/')) {
        // This is a CDN URL - save it directly
        presetData.backgroundMedia = {
            type: 'image',
            url: imgSrc, // Save CDN URL (tiny!)
            source: 'cdn'
        };
    } else if (imgSrc.startsWith('data:')) {
        // This is a data URL - warn user about size
        console.warn('⚠️ Saving data URL - consider using CDN URL instead');
        presetData.backgroundMedia = {
            type: 'image',
            url: imgSrc,
            source: 'dataurl'
        };
    }
}

// Similar logic for cell media
```

### CDN URL Validation

```javascript
function isValidWixCdnUrl(url) {
    const cdnPattern = /^https:\/\/static\.wixstatic\.com\/media\/.+\.(jpg|jpeg|png|gif|webp|mp4|webm|mov)$/i;
    return cdnPattern.test(url);
}
```

### Loading from CDN URLs

```javascript
// Already implemented in handleLoadBackgroundCdnUrl()
// Extend to cell media and preset loading

async loadMediaFromCdnUrl(url, mediaType = 'image') {
    return new Promise((resolve, reject) => {
        if (mediaType === 'image') {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        } else if (mediaType === 'video') {
            const video = document.createElement('video');
            video.crossOrigin = 'anonymous';
            video.addEventListener('loadedmetadata', () => resolve(video));
            video.addEventListener('error', reject);
            video.src = url;
        }
    });
}
```

---

## 🧪 Testing Checklist

### Background Media
- [ ] Paste CDN URL → image loads
- [ ] Save preset with CDN background → preset JSON contains URL
- [ ] Load preset with CDN background → image loads from CDN
- [ ] Verify preset JSON size is tiny

### Cell Media
- [ ] Paste CDN URL into cell → image loads
- [ ] Save preset with CDN cell media → preset JSON contains URLs
- [ ] Load preset with CDN cell media → images load from CDN
- [ ] Test multiple cells with CDN URLs

### Video Support
- [ ] Paste CDN video URL → video loads and plays
- [ ] Save preset with CDN video → preset contains URL
- [ ] Load preset with CDN video → video plays correctly

### Mixed Media
- [ ] Some cells with CDN URLs, some with uploads
- [ ] Save preset → CDN URLs preserved, uploads become data URLs
- [ ] Load preset → all media loads correctly

### Edge Cases
- [ ] Invalid CDN URL → shows error
- [ ] Non-Wix CDN URL → validate and warn
- [ ] Network failure loading CDN → show error
- [ ] Empty CDN URL field → ignored

---

## 📝 User Documentation Template

### "How to Use Wix Media Manager URLs"

**Step 1: Upload Your Assets**
1. Go to Wix Dashboard → Media Manager
2. Upload your images/videos
3. Organize into folders if desired

**Step 2: Get CDN URLs**
1. Click on any uploaded file
2. Look for "File URL" or right-click → Copy Link Address
3. URL format: `https://static.wixstatic.com/media/...`

**Step 3: Use in Tool**
1. In Background Media or Grid Cell media controls
2. Paste the CDN URL into the text field
3. Click "Load" - your media appears instantly
4. Save your preset - it will be tiny!

**Benefits**:
- ✅ Presets save 2,500x smaller
- ✅ Support for high-res images and videos
- ✅ Reliable, permanent URLs
- ✅ No upload authentication issues

---

## 🚀 Next Steps

1. **Review this plan** - Does this approach work for your workflow?

2. **Decide on scope**:
   - Option A: Full implementation (background + cells + videos)
   - Option B: Start with background only, expand later
   - Option C: Background + cells, skip videos for now

3. **Implementation order**:
   - Phase 2: Add CDN URL inputs everywhere
   - Phase 3: Update save logic to detect and preserve CDN URLs
   - Phase 4: Update load logic to handle CDN URLs
   - Phase 5: Polish UI/UX
   - Phase 6: Documentation

4. **Timeline estimate**:
   - Phase 2: 1-2 hours
   - Phase 3: 2-3 hours
   - Phase 4: 1-2 hours
   - Phase 5: 1-2 hours
   - Phase 6: 1 hour
   - **Total: 6-10 hours**

---

## ❓ Questions to Decide

1. **Should we keep file upload as fallback?**
   - Yes → Users can still upload, but get warned about size
   - No → Force CDN URLs only, remove upload controls

2. **How to handle videos?**
   - Full support with CDN URLs
   - Skip for now, focus on images only

3. **UI preference for CDN input?**
   - Simple text input (current test approach)
   - Text input + "Browse Media Manager" button that opens Wix dashboard
   - Text input + thumbnail preview when URL pasted

4. **Legacy preset support?**
   - Keep loading data URLs from old presets
   - Migrate old presets to CDN URLs (manual process)

Let me know your preferences and I'll start implementation! 🚀
