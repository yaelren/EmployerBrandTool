# Media Gallery Field Option - Alternative Approach

## 🎯 What This Is

Wix CMS has a native **Media Gallery** field type that stores images and videos directly in collections. This could be an alternative to manually uploading to Media Manager.

---

## 📊 Current vs Media Gallery Approach

### Current Approach (What We're Doing Now):
```
1. Upload image/video to Media Manager → Get CDN URL
2. Store URL as text string in CMS
3. Retrieve URL and load media on preset restore
```

**Issues:**
- Requires API key for Media Manager uploads
- Authentication complexity (IST vs JWS tokens)
- Manual media management
- Data URL fallbacks for auth failures (142KB per image)

### Media Gallery Field Approach (Alternative):
```
1. Create Media Gallery field in CMS collection
2. Store media as array of objects with metadata
3. Wix handles media storage/CDN natively
4. Retrieve media gallery array on preset restore
```

**Potential Benefits:**
- Native Wix solution (better supported)
- Might work with visitor OAuth tokens (no API key needed?)
- Built-in media optimization
- Cleaner data model
- Metadata support (title, alt, description)

---

## 🔍 Media Gallery Field Format

Based on [Wix documentation](https://dev.wix.com/docs/rest/business-solutions/cms/data-items/data-types-in-wix-data) and [community examples](https://forum.wixstudio.com/velo/forum/tips-tutorials-examples/array-format-to-populate-a-media-gallery-field-using-wixdata):

### Field Type
- **Type:** Media Gallery
- **Data Structure:** Array of media objects
- **Supported Media:** Images and videos
- **API Access:** Via Wix Data Collections v2 API

### Object Structure

**Minimum required:**
```javascript
{
    src: "https://static.wixstatic.com/media/abc123.png",  // Required
    type: "image"  // or "video"
}
```

**Full structure:**
```javascript
{
    src: "https://static.wixstatic.com/media/abc123.png",  // Required: file URL
    type: "image",              // Required: "image" or "video"
    title: "Background Image",  // Optional: display title
    alt: "Grid background",     // Optional: alt text for accessibility
    description: "Main bg",     // Optional: detailed description
    slug: "bg-image-1",         // Optional: URL-friendly identifier
    settings: {}                // Optional: additional metadata
}
```

### Example Array
```javascript
{
    "backgroundMedia": [
        {
            src: "https://static.wixstatic.com/media/bg123.png",
            type: "image",
            title: "Background Image"
        }
    ],
    "cellVideos": [
        {
            src: "https://video.wixstatic.com/video/cell1.mp4",
            type: "video",
            title: "Cell Video 1"
        },
        {
            src: "https://video.wixstatic.com/video/cell2.mp4",
            type: "video",
            title: "Cell Video 2"
        }
    ]
}
```

---

## 🤔 Key Questions to Investigate

### 1. **Does This Work with Visitor OAuth?**
**Question:** Can we set Media Gallery fields using anonymous visitor OAuth tokens?

**Current Knowledge:**
- Data Collections API requires "Collect content" permission ✅ (we have this)
- Media Gallery is just a field type in collections
- **Likely works** since it's part of the Data Collections API, not Media Manager API

**Need to Test:**
1. Add Media Gallery field to `presets` collection
2. Try setting it with current OAuth token
3. Check if 403 errors occur

### 2. **How Do We Get Media into the Gallery?**
**Three Possible Flows:**

**Option A: Upload to Media Manager → Reference in Gallery**
```
1. Upload to Media Manager (needs API key - current problem)
2. Get CDN URL
3. Create gallery object with CDN URL
4. Store in collection
```
→ **Still has authentication problem**

**Option B: Store Data URLs in Gallery**
```
1. Convert image/video to data URL
2. Create gallery object with data URL
3. Store in collection
```
→ **Would work but defeats the purpose** (still large files)

**Option C: Upload via Wix Upload Button → Store fileUrl**
```
1. Use Wix's upload button widget
2. Get fileUrl from upload result
3. Store in Media Gallery field
```
→ **Might only work in Wix editor context**, not headless

**Most Likely Reality:**
Media Gallery fields probably **expect CDN URLs**, meaning we still need to solve the Media Manager upload authentication issue.

### 3. **Does It Reduce Complexity?**

**Benefits:**
- ✅ Cleaner data model (proper field types)
- ✅ Native Wix solution (better long-term support)
- ✅ Metadata support (titles, alt text, descriptions)
- ✅ Built-in array handling

**Drawbacks:**
- ❌ Might still require Media Manager uploads (same auth issue)
- ❌ More complex object structure
- ❌ Migration needed for existing presets
- ❌ Unknown if it works with headless OAuth

---

## 📋 Migration Path (If We Choose This)

### Phase 1: Add Fields to Collection
```
1. Go to Wix CMS dashboard
2. Edit "presets" collection
3. Add new fields:
   - backgroundMedia (Media Gallery)
   - cellVideos (Media Gallery)
4. Keep existing fields for backward compatibility
```

### Phase 2: Update Save Logic
```javascript
// Instead of:
presetData.backgroundImageURL = "https://cdn.url/image.png";

// Do:
presetData.backgroundMedia = [{
    src: "https://cdn.url/image.png",
    type: "image",
    title: "Background"
}];

presetData.cellVideos = cellsWithVideos.map(cell => ({
    src: cell.videoURL,
    type: "video",
    title: `Cell ${cell.index}`
}));
```

### Phase 3: Update Load Logic
```javascript
// Instead of:
const bgURL = presetData.backgroundImageURL;

// Do:
const bgURL = presetData.backgroundMedia?.[0]?.src || presetData.backgroundImageURL;
```

### Phase 4: Deprecate Old Fields
```
1. Support both formats for 1 month
2. Migrate old presets to new format
3. Remove old text fields
```

---

## 🎯 Recommendation

### **DON'T MIGRATE YET** - Here's Why:

**The fundamental problem remains:**
Media Gallery fields **still require CDN URLs**, which means we still need to:
1. Upload media to Media Manager (requires API key)
2. Get CDN URL from upload
3. Then store URL in Media Gallery field

**Media Gallery fields don't solve the authentication problem - they just provide a better data structure AFTER you already have CDN URLs.**

### **What Media Gallery Fields ARE Good For:**

Once we solve the upload authentication (IST token fix), Media Gallery fields would be great for:
- ✅ **Better data organization** (arrays instead of scattered text fields)
- ✅ **Metadata storage** (titles, alt text, descriptions)
- ✅ **Future features** (thumbnails, captions, image manipulation)
- ✅ **Multiple media items** (easier to handle many videos/images)

### **Recommended Sequence:**

1. **FIRST:** Fix IST token authentication (Bearer prefix - already done!)
2. **TEST:** Verify videos upload successfully with fixed auth
3. **IF WORKING:** Keep current simple approach (text fields with CDN URLs)
4. **LATER:** Consider migrating to Media Gallery fields for better architecture

**Why this order?**
- Solve authentication problem first (blocking issue)
- Keep implementation simple initially
- Migrate to Media Gallery as enhancement (not urgent fix)
- Don't add complexity until current approach works

---

## 🧪 Quick Test (Optional)

If you want to verify Media Gallery fields work with visitor OAuth:

### Test Steps:
1. **Add test field:**
   - Go to Wix CMS → `presets` collection
   - Add field: `testMedia` (Media Gallery type)

2. **Try to save:**
   ```javascript
   // In PresetManager.js saveToCloud()
   presetData.testMedia = [{
       src: "https://static.wixstatic.com/media/test.png",
       type: "image"
   }];
   ```

3. **Check results:**
   - If saves successfully → Media Gallery works with visitor OAuth ✅
   - If 403 error → Needs elevated permissions ❌

---

## 📚 References

- [Wix Data Types Documentation](https://dev.wix.com/docs/rest/business-solutions/cms/data-items/data-types-in-wix-data)
- [Media Gallery Field Format (Community)](https://forum.wixstudio.com/velo/forum/tips-tutorials-examples/array-format-to-populate-a-media-gallery-field-using-wixdata)
- [CMS Media Gallery Field Support](https://support.wix.com/en/article/field-type-support-and-limitations-in-the-content-manager)

---

## 🎯 Summary

**Media Gallery Fields:**
- ✅ Native Wix solution for storing media in CMS
- ✅ Better data structure than text URLs
- ✅ Supports metadata and multiple items
- ❌ **Doesn't solve authentication problem** (still needs CDN URLs)
- ❌ More complex to implement
- ⏳ Good future enhancement, not urgent fix

**Current Approach:**
- ✅ Simpler implementation
- ✅ Works once authentication fixed
- ✅ No migration needed
- ❌ Less structured data
- ❌ No metadata support

**Verdict:** Fix authentication first with IST Bearer token, consider Media Gallery fields as Phase 2 enhancement. 🚀
