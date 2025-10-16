# localStorage Quota Exceeded - Quick Fix

## 🐛 The Error

```
QuotaExceededError: Failed to execute 'setItem' on 'Storage':
Setting the value of 'wix_presets' exceeded the quota.
```

## 📊 What Happened

You've hit the browser's localStorage limit (~5-10MB depending on browser).

**Your current usage:**
- 3 presets saved
- Each preset with images: ~320KB
- Total: ~1MB (approaching limit with image data URLs)

## ✅ Quick Solutions

### Option 1: Delete Old Presets (Immediate Fix)

**In Browser Console:**
```javascript
// See what you have
const presets = JSON.parse(localStorage.getItem('wix_presets'));
console.table(presets.map(p => ({ name: p.name, id: p._id, date: p._createdDate })));

// Delete ALL presets (start fresh)
localStorage.removeItem('wix_presets');
location.reload();

// OR Delete specific preset by ID
const presets = JSON.parse(localStorage.getItem('wix_presets'));
const filtered = presets.filter(p => p._id !== 'preset_1760616665428'); // Change ID
localStorage.setItem('wix_presets', JSON.stringify(filtered));
location.reload();
```

### Option 2: Use Delete Button in UI

1. Go to **Presets** tab
2. Select preset from dropdown
3. Click **🗑️ Delete** button
4. Repeat for old presets

### Option 3: Compress Images Before Saving

**Reduce image size:**
1. Use smaller images (resize to 800x600 instead of full resolution)
2. Compress images before uploading (use tools like TinyPNG)
3. Convert images to JPEG instead of PNG (smaller file size)

## 📈 Check Storage Usage

**Browser Console Command:**
```javascript
// Check current usage
const presetsJSON = localStorage.getItem('wix_presets');
const sizeBytes = new Blob([presetsJSON]).size;
const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2);
const presets = JSON.parse(presetsJSON || '[]');

console.log(`
📊 Storage Usage:
   Presets: ${presets.length}
   Total Size: ${sizeMB} MB
   Average per preset: ${(sizeBytes / presets.length / 1024).toFixed(0)} KB
   Estimated quota: ~5-10 MB
   Usage: ${((sizeBytes / (5 * 1024 * 1024)) * 100).toFixed(1)}%
`);

// Show preset sizes
presets.forEach(p => {
    const size = (new Blob([JSON.stringify(p)]).size / 1024).toFixed(0);
    console.log(`  ${p.name}: ${size} KB`);
});
```

## 🔮 Long-term Solution: Migrate to Wix Cloud

The current implementation uses localStorage as a temporary fallback. For production:

1. **Migrate to Wix REST API** - No storage limits
2. **Upload images to Wix CDN** - Better performance
3. **Cross-device sync** - Access presets anywhere

**Migration is already prepared in the code**, just needs Wix REST API implementation in `WixPresetAPI.js`.

## 💡 Why This Happens

**Data URLs are large:**
```
Small image (232x232): ~103KB as data URL
Background (232x232): ~217KB as data URL
---
Total per preset: ~320KB

3 presets = ~1MB
10 presets = ~3.2MB
15 presets = ~4.8MB (near limit!)
```

**localStorage limits:**
- Chrome: ~10MB
- Firefox: ~10MB
- Safari: ~5MB
- Edge: ~10MB

## 🎯 Best Practices

1. **Keep 5-10 presets max** with images in localStorage
2. **Delete old presets** regularly
3. **Use smaller images** when possible
4. **Migrate to Wix cloud** for production use

## 🚀 Temporary Fix Applied

The code now includes:
- ✅ Better error message for quota exceeded
- ✅ Shows current preset count when error occurs
- ✅ Suggests deleting old presets
- ✅ `getStorageInfo()` method to check usage

**Next steps:**
Either delete old presets or implement Wix REST API migration.
