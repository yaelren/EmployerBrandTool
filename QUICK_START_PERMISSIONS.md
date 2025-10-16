# Quick Start: Enable Media Manager Permissions

**⏱️ Takes 2 minutes**

---

## 🎯 The Simple Path

### Step 1: Open Your OAuth App
**URL:** [https://dev.wix.com/](https://dev.wix.com/)

**Navigation:**
```
dev.wix.com
└── Your Apps (left sidebar)
    └── Select app: be6b179c-58a3-457e-aada-b37e3d245348
        └── Click "Permissions" tab (top navigation)
```

### Step 2: Add Permission
**In the Permissions page:**

1. Look for **"Add Permissions"** button (usually top-right or bottom)
2. Click it
3. Search box appears → Type: **`media`**
4. Find and select: **`MEDIA.SITE_MEDIA_FILES_MANAGE`**
   - May also be shown as: "Manage Media Manager"
5. Click **"Save"** or **"Add"**

### Step 3: Wait & Refresh
**In your application:**

1. **Wait:** 5 minutes for Wix to propagate permissions
2. **Clear cache:** Open browser console (F12), type:
   ```javascript
   localStorage.clear()
   ```
   Press Enter
3. **Reload page:** Press `Ctrl+R` (Windows) or `Cmd+R` (Mac)

### Step 4: Test
1. Upload a background image
2. Go to **Presets** tab
3. Click **"☁️ Save to Cloud"**
4. Open console (F12)
5. Look for: **"✅ Image uploaded to Wix CDN"**

---

## 🔍 Visual Guide

### What You're Looking For:

```
Permissions Tab (after clicking "Add Permissions")
┌─────────────────────────────────────────────────┐
│ Add Permissions                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Search: media                               │ │ ← Type here
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ Data Collections                                │
│   ☑ Read Data Items                            │
│   ☑ Create Data Items                          │
│   ☑ Delete Data Items                          │
│                                                  │
│ Media Manager / Site Media / Files              │ ← Look here
│   ☐ MEDIA.SITE_MEDIA_FILES_READ                │
│   ☐ MEDIA.SITE_MEDIA_FILES_MANAGE     ← CHECK  │
│   ☐ MEDIA.SITE_MEDIA_FILES_DELETE              │
│                                                  │
│                        [Cancel]  [Save] ← Click │
└─────────────────────────────────────────────────┘
```

---

## ✅ Success Indicators

### Before (Current - Using Fallback):
```console
📤 Uploading image to Wix Media Manager: bg-test.png
❌ Wix image upload failed: 403 Forbidden
⚠️ Falling back to data URL...
⚠️ Using data URL fallback (217.42 KB)
```

### After (With Permissions):
```console
📤 Uploading image to Wix Media Manager: bg-test.png
   → Blob size: 217.45 KB
   → MIME type: image/png
   → Upload URL generated
✅ Image uploaded to Wix CDN
   → CDN URL: https://static.wixstatic.com/media/abc123.png
```

---

## 🚨 Still Not Working?

### Checklist:
- [ ] Permission is **checked** in the list
- [ ] Clicked **"Save"** button
- [ ] Waited 5-10 minutes
- [ ] Ran `localStorage.clear()` in console
- [ ] Reloaded the page
- [ ] Tried uploading again

### If Still Blocked:

**Check your token:**
```javascript
// In browser console:
console.log('Token:', localStorage.getItem('wix_auth_token'));
console.log('Expires:', localStorage.getItem('wix_token_expires_at'));

// Force new token:
localStorage.removeItem('wix_auth_token');
localStorage.removeItem('wix_token_expires_at');
location.reload();
```

**Verify Client ID:**
```javascript
// Should be: be6b179c-58a3-457e-aada-b37e3d245348
console.log('Config:', window.WIX_CONFIG);
```

---

## 📊 What This Enables

| Feature | Before | After |
|---------|--------|-------|
| Background images | 275 KB (data URL) | 80 bytes (CDN URL) |
| Cell images | 180 KB (data URL) | 80 bytes (CDN URL) |
| Videos | ❌ Cannot save | ✅ CDN upload works |
| GIFs | 200 KB (data URL) | 80 bytes (CDN URL) |
| Preset file size | ~455 KB | ~0.5 KB (99% smaller!) |
| Cross-device sync | ⚠️ Slow loading | ✅ Fast CDN delivery |

---

## 🎓 Why This Permission?

From Wix documentation:
- **`MEDIA.SITE_MEDIA_FILES_MANAGE`** allows:
  - ✅ Generate upload URLs
  - ✅ Upload files to Media Manager
  - ✅ Manage uploaded files
  - ✅ Access Media Manager CDN

**Your OAuth app requests this permission → Wix grants it → Your upload code works**

No code changes needed - the implementation is already correct!

---

## 🔗 Full Guides

Need more details?
- [WIX_MEDIA_MANAGER_PERMISSIONS_SETUP.md](WIX_MEDIA_MANAGER_PERMISSIONS_SETUP.md) - Complete setup guide
- [FINDING_MEDIA_MANAGER_PERMISSIONS.md](FINDING_MEDIA_MANAGER_PERMISSIONS.md) - Detailed troubleshooting
- [PHASE_II_WIX_SETUP.md](PHASE_II_WIX_SETUP.md) - Full Phase II documentation

---

**That's it! Just enable one permission and everything works. 🚀**
