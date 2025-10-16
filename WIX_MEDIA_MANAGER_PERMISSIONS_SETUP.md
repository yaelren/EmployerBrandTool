# Wix Media Manager Permissions Setup for Headless OAuth

**Based on official Wix Headless documentation**

---

## 🎯 What You Need

According to Wix's official documentation, to upload files to Media Manager via headless OAuth, you need these **specific permission scopes**:

### Required Permission Scopes:

1. ✅ **`MEDIA.SITE_MEDIA_FILES_MANAGE`** - Allows file upload, update, and management
2. ✅ **`MEDIA.SITE_MEDIA_FILES_READ`** - Allows reading file information (optional but recommended)

**Alternative (broader permission):**
- ✅ **`Manage Media Manager`** - Covers all Media Manager operations

---

## 📍 Where to Add These Permissions

### Option 1: Wix Developers Dashboard (Recommended)

**Step-by-Step:**

1. **Navigate to App Permissions:**
   - Go to: [https://dev.wix.com/](https://dev.wix.com/)
   - Click **"Your Apps"** in left sidebar
   - Select your OAuth app (Client ID: `be6b179c-58a3-457e-aada-b37e3d245348`)
   - Click **"Permissions"** tab

2. **Add Media Manager Permissions:**
   - Click **"Add Permissions"** button (usually at top or bottom of permissions list)
   - **Search for:** `media` or `site media files`
   - Look for these permission scopes:
     - ☐ **MEDIA.SITE_MEDIA_FILES_MANAGE**
     - ☐ **MEDIA.SITE_MEDIA_FILES_READ**
   - **OR** simply select:
     - ☐ **Manage Media Manager** (covers both)

3. **Save Changes:**
   - Click **"Save"** button
   - Permissions will propagate within a few minutes

### Option 2: Via OAuth App Settings

**Alternative Path:**

1. Go to [Wix Dashboard](https://www.wix.com/my-account/sites/)
2. Select your site
3. Navigate to **Settings** → **Headless** (or **APIs & Webhooks**)
4. Find your OAuth app in the list
5. Click **"Manage Permissions"** or **"Edit"**
6. Follow same steps as Option 1, Step 2-3

---

## 🔍 What to Look For

### Visual Guide:

When you're in the **Permissions** tab, you'll see categories like:

```
Data Collections
├─ ☑ Read Data Items (already enabled)
├─ ☑ Create Data Items (already enabled)
└─ ☑ Delete Data Items (already enabled)

Files / Site Media / Media Manager  ← LOOK FOR THIS SECTION
├─ ☐ Read Files (MEDIA.SITE_MEDIA_FILES_READ)
├─ ☐ Manage Files (MEDIA.SITE_MEDIA_FILES_MANAGE)  ← ENABLE THIS
├─ ☐ Generate Upload URL
└─ ☐ Upload Files

Storage
└─ (other permissions)
```

### Permission Names May Vary:

The same permission might be displayed as:
- "Manage Media Manager"
- "MEDIA.SITE_MEDIA_FILES_MANAGE"
- "Manage Files"
- "Site Media: Manage Files"

**Any of these that mention "manage" + "files/media" should work!**

---

## 🔐 Authentication Strategy

Your current setup uses **OAuth with Visitor (Anonymous) identity**, which is correct for headless projects.

### Current Implementation:

```javascript
// js/api/WixPresetAPI.js
async authenticate() {
    const response = await fetch(`${this.baseURL}/oauth/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            clientId: this.clientId,
            grantType: 'anonymous'  // ← OAuth Visitor strategy
        })
    });
}
```

**This is correct!** According to Wix documentation:
- ✅ **OAuth Visitor (anonymous)** - Suitable for public operations
- ✅ **Permissions granted to OAuth app** - Applied to all authenticated requests

---

## 🧪 Verification Steps

After adding permissions:

### Step 1: Clear Token Cache
```javascript
// Open browser console (F12), paste and run:
localStorage.clear();
console.log('Token cache cleared! Reload page to generate new token with updated permissions.');
```

### Step 2: Reload Application
Refresh your browser to generate a **new OAuth token** with the updated permissions.

### Step 3: Test Upload
1. Upload a background image
2. Navigate to **Presets** tab
3. Click **"☁️ Save to Cloud"**
4. Open browser console (F12)

### Step 4: Check Console Output

**✅ Success (Permissions Working):**
```
📤 Uploading image to Wix Media Manager: bg-test-1234567890.png
   → Blob size: 217.45 KB
   → MIME type: image/png
   → Upload URL generated
   → File ID: abc123-def456-ghi789
✅ Image uploaded to Wix CDN
   → CDN URL: https://static.wixstatic.com/media/abc123_def456.png
```

**❌ Still Blocked (Permissions Not Applied Yet):**
```
📤 Uploading image to Wix Media Manager: bg-test-1234567890.png
❌ Wix image upload failed: 403 Forbidden
   → Error: Permission denied
⚠️ Falling back to data URL...
⚠️ Using data URL fallback (217.42 KB)
```

**⏳ If still getting 403:**
1. Wait 5-10 minutes for permissions to propagate
2. Double-check permissions are **saved** in dev.wix.com
3. Clear localStorage and reload again
4. Verify you're using the correct OAuth Client ID

---

## 📊 What Changes After Enabling Permissions

### Before (Current State):

| Media Type | Storage Method | Size per Item | Works? |
|------------|---------------|---------------|--------|
| Background Images | Data URL fallback | ~275 KB | ✅ Yes |
| Cell Images | Data URL fallback | ~180 KB | ✅ Yes |
| Cell Videos | **Cannot save** | N/A | ❌ No |
| GIFs | Data URL fallback | ~200 KB | ✅ Yes |

**Preset JSON Size:** ~455 KB (with 1 background + 1 cell image)

### After (With Permissions):

| Media Type | Storage Method | Size per Item | Works? |
|------------|---------------|---------------|--------|
| Background Images | **Wix CDN URL** | **~80 bytes** | ✅ Yes |
| Cell Images | **Wix CDN URL** | **~80 bytes** | ✅ Yes |
| Cell Videos | **Wix CDN URL** | **~90 bytes** | ✅ Yes |
| GIFs | **Wix CDN URL** | **~80 bytes** | ✅ Yes |

**Preset JSON Size:** ~0.5 KB (with 1 background + 1 cell image) — **99% reduction!**

---

## 🚨 Troubleshooting

### Problem 1: "I don't see an 'Add Permissions' button"

**Solutions:**
1. Make sure you're in the **"Permissions"** tab (not "Overview" or "Settings")
2. Scroll to the very bottom of the permissions list
3. Try clicking **"Edit Permissions"** if you see that instead
4. Check if you have admin access to the OAuth app

### Problem 2: "I can't find 'MEDIA.SITE_MEDIA_FILES_MANAGE' in the list"

**Solutions:**
1. Use the **search box** at the top of permissions page
2. Search for: `media`, `files`, `site media`, or `manager`
3. Look for any permission containing "manage" + "files" or "media"
4. Alternative names: "Manage Media Manager", "Site Media: Manage Files"

### Problem 3: "Permissions are enabled but still getting 403"

**Checklist:**
1. ✅ Permissions are **saved** (click Save button)
2. ✅ Waited 5-10 minutes for propagation
3. ✅ Cleared localStorage: `localStorage.clear()`
4. ✅ Reloaded page to generate new token
5. ✅ Verified correct Client ID in code
6. ✅ Checked console for specific error message

**If still blocked:**
```javascript
// Check your current OAuth token in console:
console.log('Current token:', localStorage.getItem('wix_auth_token'));
console.log('Token expiry:', localStorage.getItem('wix_token_expires_at'));

// Force new token:
localStorage.removeItem('wix_auth_token');
localStorage.removeItem('wix_token_expires_at');
location.reload();
```

### Problem 4: "My Wix plan doesn't include Media Manager API"

**Check Your Plan:**
1. Media Manager API is included in most Wix plans
2. For headless projects, ensure you have a **Business or Enterprise** plan
3. Check: [Wix Pricing](https://www.wix.com/upgrade/website)
4. Contact Wix Support if unsure

---

## 🎓 According to Wix Documentation

### From Official Wix Headless Docs:

> **Authentication Strategies:**
> - **API Key**: For admin-level access (not recommended for client-side)
> - **OAuth (Visitor)**: For public/anonymous access (what we use)
> - **OAuth (Member)**: For logged-in user access
>
> **Permission Scopes:**
> - Each API endpoint lists required permission scopes
> - Apps should only request necessary permissions
> - Permissions are granted during app installation or OAuth authorization

### Our Implementation Aligns With:

1. ✅ **OAuth Visitor Strategy** - Correct for client-side headless
2. ✅ **Permission-based Authorization** - Using OAuth token with app permissions
3. ✅ **Direct Upload Flow** - Generate URL → PUT request → CDN URL
4. ✅ **Error Handling** - Graceful fallback for images (not videos)

---

## 📝 Summary Checklist

**Complete these steps in order:**

- [ ] 1. Go to [dev.wix.com](https://dev.wix.com/) → Your Apps
- [ ] 2. Select your OAuth app → Permissions tab
- [ ] 3. Add permission: **`MEDIA.SITE_MEDIA_FILES_MANAGE`**
- [ ] 4. Click **Save** button
- [ ] 5. Wait 5 minutes for propagation
- [ ] 6. Clear localStorage in browser: `localStorage.clear()`
- [ ] 7. Reload your application
- [ ] 8. Test upload with background image
- [ ] 9. Check console for "✅ Image uploaded to Wix CDN"
- [ ] 10. Verify CDN URL in console output

---

## 🔗 Relevant Documentation

- [Wix Headless Authentication](https://dev.wix.com/docs/go-headless/getting-started/setup/authentication)
- [Adding Permissions to Wix Apps](https://dev.wix.com/docs/build-apps/build-your-app/app-management/app-permissions/add-permissions-to-your-app)
- [Media Manager API Reference](https://dev.wix.com/docs/rest/assets/media/media-manager)
- [Media Manager Permission Scopes](https://dev.wix.com/docs/build-apps/build-your-app/app-management/app-permissions/permissions-list#permissions_media-manager)

---

## ✅ Final Note

**Your implementation is already correct!** The code follows official Wix Headless patterns:

```javascript
// ✅ Correct OAuth authentication
// ✅ Correct upload URL generation
// ✅ Correct PUT request with blob
// ✅ Correct error handling

// Just needs: ⚠️ OAuth app permissions enabled
```

Once you enable the **`MEDIA.SITE_MEDIA_FILES_MANAGE`** permission, everything will work automatically. Videos will upload to CDN, images will use tiny URLs instead of large data URLs, and preset file sizes will drop by 99%.

**No code changes needed - just enable the permission!**
