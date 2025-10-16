# Phase II: Wix Data Collections Setup Guide

Complete guide for setting up Wix CMS collection and testing cross-device preset sync.

---

## 🎯 Overview

Phase II replaces localStorage with Wix Data Collections for unlimited cloud storage and cross-device sync.

**What's Implemented:**
- ✅ OAuth visitor tokens (Phase I)
- ✅ Media Manager upload with fallback (Phase I)
- ✅ Wix Data Collections API integration (Phase II)
- ✅ All CRUD operations (Create, Read, Update, Delete)

**What You Need to Setup:**
1. Create CMS collection in Wix dashboard
2. Configure collection permissions
3. Enable Media Manager permissions (optional, for CDN uploads)
4. Test cross-device sync

---

## 📋 Step 1: Create CMS Collection

### Access Wix Dashboard

1. Go to [Wix Dashboard](https://www.wix.com/my-account/sites/)
2. Select your site/project
3. Navigate to **CMS** section

### Create "presets" Collection

1. Click **"Create Collection"**
2. Set collection name: **`presets`**
3. Add the following fields:

#### Field Configuration

| Field Name | Field Type | Required | Description |
|------------|------------|----------|-------------|
| `name` | Text | Yes | Preset display name |
| `settings` | Object | Yes | Complete preset configuration (JSON) |
| `_createdDate` | Date | Auto | Creation timestamp |
| `_updatedDate` | Date | Auto | Last update timestamp |

**Important Notes:**
- **Collection ID:** Must be exactly `presets` (matches `this.collectionName` in [WixPresetAPI.js](js/api/WixPresetAPI.js#L15))
- **`_createdDate` and `_updatedDate`:** These are system fields automatically managed by Wix
- **`settings` field:** Must be type **Object** to store complex JSON data

### Collection Permissions

Set the following permissions for visitor access:

| Operation | Permission | Reason |
|-----------|------------|--------|
| **Create** | Site members & visitors | Allow saving new presets |
| **Read** | Site members & visitors | Allow loading presets |
| **Update** | Site members & visitors | Allow editing presets |
| **Delete** | Site members & visitors | Allow deleting presets |

**Security Note:** Visitor tokens (anonymous OAuth) are used, so all users share the same preset library. For user-specific presets, you'll need member authentication (future enhancement).

---

## 🔐 Step 2: Configure OAuth App Permissions

Your OAuth app needs permissions to access Data Collections and Media Manager.

### Access OAuth App Settings

**Option 1: Via Wix Developers Dashboard (Recommended)**

1. Go to [Wix Developers](https://dev.wix.com/)
2. Navigate to **Your Apps** in left sidebar
3. Select your OAuth app (Client ID: `be6b179c-58a3-457e-aada-b37e3d245348`)
4. Click on **Permissions** tab in the app settings

**Option 2: Via Wix Dashboard**

1. Go to [Wix Dashboard](https://www.wix.com/my-account/sites/)
2. Select your site
3. Navigate to **Settings** → **Headless**
4. Find your OAuth app in the list
5. Click **Manage Permissions**

### Required Permissions

Enable the following permissions in the **Permissions** tab:

#### Data Collections (Required)
- ✅ **Read Data Items** - Required for `listPresets()` and `loadPreset()`
- ✅ **Create Data Items** - Required for `savePreset()`
- ✅ **Update Data Items** - Optional (not currently used)
- ✅ **Delete Data Items** - Required for `deletePreset()`

#### Media Manager (IMPORTANT for CDN Uploads)

**Required Permission Scope:**
- ✅ **`MEDIA.SITE_MEDIA_FILES_MANAGE`** - Allows file upload and management

**Optional (Recommended):**
- ✅ **`MEDIA.SITE_MEDIA_FILES_READ`** - Allows reading file information

**Alternative (Broader):**
- ✅ **Manage Media Manager** - Covers all Media Manager operations

**Finding Media Manager Permissions:**

The Media Manager permissions may be listed in these sections:
- **"Media Manager"** section
- **"Site Media"** section
- **"Files"** section

**Permission may appear as:**
- "MEDIA.SITE_MEDIA_FILES_MANAGE" (official scope name)
- "Manage Media Manager"
- "Manage Files"
- "Site Media: Manage Files"

**To Add Permissions:**
1. In the Permissions tab, look for **"Add Permissions"** button
2. Search for: `media` or `site media files`
3. Select **MEDIA.SITE_MEDIA_FILES_MANAGE**
4. Click **Save**

**Important Notes:**
- Without Media Manager permissions, images will fall back to data URLs (larger file sizes)
- Videos REQUIRE Media Manager permissions (no fallback available)
- Some Wix plans may not include Media Manager API access
- Permissions may take 5-10 minutes to propagate after enabling
- After enabling, clear localStorage and reload to get new token with permissions

### Save Changes

1. Click **"Save"** after enabling permissions
2. Wait for changes to propagate (usually instant)

---

## 🧪 Step 3: Test Data Collections

### Test from Browser Console

Open your app in browser and test the API:

#### 3.1. Check OAuth Token

```javascript
// Should show existing token
localStorage.getItem('wix_access_token')
```

#### 3.2. Test Save Preset

```javascript
// Navigate to your app: http://127.0.0.1:3000/
// Open Presets tab
// Enter name: "Test Wix Collections"
// Click "☁️ Save to Cloud"

// Expected console logs:
// 💾 Saving preset to Wix Data Collections: "Test Wix Collections"
// ✅ Preset saved to Wix Data Collections
//    → Preset ID: abc123-def456-ghi789
//    → Preset Name: Test Wix Collections
```

#### 3.3. Test List Presets

```javascript
// Refresh the preset dropdown

// Expected console logs:
// 📋 Fetching preset list from Wix Data Collections...
// ✅ Found 1 presets in Wix Data Collections
```

#### 3.4. Test Load Preset

```javascript
// Select preset from dropdown
// Click "📥 Load"

// Expected console logs:
// 📥 Loading preset from Wix Data Collections: abc123-def456-ghi789
// ✅ Preset loaded from Wix: "Test Wix Collections"
//    → Created: 10/16/2025, 3:45:27 PM
```

#### 3.5. Test Delete Preset

```javascript
// Select preset from dropdown
// Click "🗑️ Delete"

// Expected console logs:
// 🗑️ Deleting preset from Wix Data Collections: abc123-def456-ghi789
// ✅ Preset deleted from Wix Data Collections
//    → Preset ID: abc123-def456-ghi789
```

---

## 🌐 Step 4: Test Cross-Device Sync

This is the key benefit of Phase II - presets sync across all devices!

### Test Scenario 1: Same Browser, Different Tabs

1. **Tab 1:** Save preset "Cross Device Test"
2. **Tab 2:** Refresh preset dropdown
3. **Expected:** "Cross Device Test" appears in Tab 2 ✅

### Test Scenario 2: Different Browsers (Same Computer)

1. **Chrome:** Save preset "Multi Browser Test"
2. **Firefox:** Open app, refresh preset dropdown
3. **Expected:** "Multi Browser Test" appears in Firefox ✅

### Test Scenario 3: Different Computers (Holy Grail!)

1. **Computer 1:** Save preset "Cross Computer Test" with background image
2. **Computer 2:** Open app on different computer/phone
3. **Computer 2:** Refresh preset dropdown
4. **Expected:** "Cross Computer Test" appears in dropdown ✅
5. **Computer 2:** Load preset
6. **Expected:** Background image loads from Wix CDN (if Media Manager enabled) ✅

---

## 📊 Expected API Responses

### Save Preset Response

```json
{
  "dataItem": {
    "_id": "abc123-def456-ghi789",
    "_createdDate": "2025-10-16T19:45:27.000Z",
    "_updatedDate": "2025-10-16T19:45:27.000Z",
    "name": "Test Wix Collections",
    "settings": {
      "canvas": { "width": 1080, "height": 1350 },
      "background": {
        "imageURL": "https://static.wixstatic.com/media/abc123.png"
      },
      "mainText": { "content": "HELLO\\nWORLD" },
      "grid": { ... }
    }
  }
}
```

### List Presets Response

```json
{
  "dataItems": [
    {
      "_id": "abc123",
      "name": "Test Wix Collections",
      "_createdDate": "2025-10-16T19:45:27.000Z"
    },
    {
      "_id": "def456",
      "name": "Another Preset",
      "_createdDate": "2025-10-16T18:30:15.000Z"
    }
  ],
  "totalCount": 2
}
```

### Load Preset Response

```json
{
  "dataItem": {
    "_id": "abc123-def456-ghi789",
    "name": "Test Wix Collections",
    "settings": { ... },
    "_createdDate": "2025-10-16T19:45:27.000Z",
    "_updatedDate": "2025-10-16T19:45:27.000Z"
  }
}
```

### Delete Preset Response

HTTP 200 OK (empty body)

---

## 🚨 Troubleshooting

### Error: 403 Forbidden

**Problem:**
```
POST https://www.wixapis.com/v2/data/collections/presets/items 403 (Forbidden)
```

**Causes:**
1. OAuth app doesn't have Data Collections permissions
2. Collection doesn't exist in Wix dashboard
3. Collection permissions not set correctly

**Solutions:**
1. Check OAuth app permissions (Step 2)
2. Verify collection exists and named exactly "presets"
3. Set collection permissions to allow visitors

### Error: 404 Not Found

**Problem:**
```
POST https://www.wixapis.com/v2/data/collections/presets/items/query 404 (Not Found)
```

**Causes:**
1. Collection name mismatch (case-sensitive!)
2. Collection not yet created

**Solutions:**
1. Verify collection name is exactly `presets` (lowercase)
2. Create collection in Wix dashboard (Step 1)

### Error: 401 Unauthorized

**Problem:**
```
POST https://www.wixapis.com/v2/data/collections/presets/items 401 (Unauthorized)
```

**Causes:**
1. OAuth token expired (shouldn't happen with auto-refresh)
2. Invalid OAuth client ID

**Solutions:**
1. Check token expiry: `localStorage.getItem('wix_token_expires_at')`
2. Verify client ID matches OAuth app

### Presets Not Syncing Across Devices

**Problem:** Saved preset on Computer 1 doesn't appear on Computer 2

**Causes:**
1. Still using localStorage (Phase I behavior)
2. API calls failing silently
3. Different OAuth app/site

**Solutions:**
1. Check console logs - should say "Wix Data Collections" not "localStorage"
2. Look for API error messages in console
3. Verify both devices use same Wix site/app

---

## 📊 Comparison: Phase I vs Phase II

| Feature | Phase I (localStorage) | Phase II (Wix Collections) |
|---------|------------------------|----------------------------|
| **Storage** | ~5-10MB browser limit | Unlimited (Wix cloud) |
| **Cross-Tab** | ✅ Same browser only | ✅ All tabs |
| **Cross-Browser** | ❌ No sync | ✅ Full sync |
| **Cross-Device** | ❌ No sync | ✅ Full sync |
| **Images** | Data URLs (~33% larger) | CDN URLs (optimized) |
| **Quota Errors** | ✅ Common with images | ❌ No limits |
| **Setup** | ✅ None required | ⚠️ Wix dashboard setup |
| **Performance** | ⚡ Instant | 🌐 Network dependent |

---

## 🔗 API Documentation

### Wix Data Collections API

**Base URL:** `https://www.wixapis.com/v2/data/collections`

**Endpoints Used:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/presets/items` | Create preset |
| GET | `/presets/items/{id}` | Load preset by ID |
| POST | `/presets/items/query` | List all presets |
| DELETE | `/presets/items/{id}` | Delete preset |

**Headers:**
```javascript
{
  'Authorization': 'Bearer <access_token>',
  'Content-Type': 'application/json'
}
```

### Code References

- [WixPresetAPI.js](js/api/WixPresetAPI.js) - Full API wrapper implementation
- [PresetManager.js](js/parameters/PresetManager.js#L680-L748) - saveToCloud() method
- [PresetManager.js](js/parameters/PresetManager.js#L768-L772) - loadFromCloud() method

---

## ✅ Success Checklist

Before considering Phase II complete, verify:

- [ ] CMS collection "presets" created with correct fields
- [ ] Collection permissions set for visitors
- [ ] OAuth app has Data Collections permissions
- [ ] Test save: Preset saved to Wix (no localStorage logs)
- [ ] Test load: Preset loaded from Wix
- [ ] Test list: Dropdown populated from Wix
- [ ] Test delete: Preset deleted from Wix
- [ ] Cross-tab sync: Works across browser tabs
- [ ] Cross-browser sync: Works across different browsers
- [ ] Cross-device sync: Works across different computers/phones
- [ ] Images upload to CDN (optional, with Media Manager permissions)

---

## 🚀 Next Steps After Phase II

Once Phase II is working:

1. **User Authentication:** Switch from visitor tokens to member tokens for user-specific presets
2. **Preset Sharing:** Add public/private preset flags
3. **Preset Versioning:** Track preset history and allow rollback
4. **Preset Templates:** Pre-populate with starter templates
5. **Analytics:** Track preset usage and popularity

---

## 💡 Tips

1. **Test Gradually:** Start with save, then list, then load, then delete
2. **Check Console:** All operations log detailed messages
3. **Use Browser DevTools:** Monitor network requests in Network tab
4. **Clear localStorage:** Test fresh start with `localStorage.clear()`
5. **Backup First:** Download important presets locally before testing

---

**Phase II is ready to test!** 🎉

All code is implemented. Just need to:
1. Create the CMS collection in Wix dashboard
2. Configure permissions
3. Test and celebrate cross-device sync! 🚀
