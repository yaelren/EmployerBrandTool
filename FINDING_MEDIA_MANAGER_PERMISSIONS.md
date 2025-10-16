# Finding Media Manager Permissions in Wix Dashboard

**Quick Answer:** Go to [Wix Developers](https://dev.wix.com/) → Your Apps → Select your OAuth app → **Permissions** tab → Scroll to **"Files"** or **"Site Media"** section.

---

## 🎯 Step-by-Step Visual Guide

### Method 1: Wix Developers Dashboard (Recommended)

#### Step 1: Access Wix Developers
1. Open: [https://dev.wix.com/](https://dev.wix.com/)
2. Sign in with your Wix account

#### Step 2: Navigate to Your Apps
1. Look for **"Your Apps"** in the left sidebar
2. Click on it to see all your OAuth applications

#### Step 3: Select Your OAuth App
1. Find your app with Client ID: `be6b179c-58a3-457e-aada-b37e3d245348`
2. Click on the app name to open settings

#### Step 4: Open Permissions Tab
1. Look for tabs at the top: **Overview** | **Permissions** | **Settings** | etc.
2. Click on **"Permissions"** tab
3. This is where ALL API permissions are managed

#### Step 5: Find Media Manager Section
Scroll down the permissions list until you find one of these sections:

**Option A: "Files" Section**
```
Files
├─ ☐ Read Files
├─ ☐ Generate File Upload URL  ← Enable this!
└─ ☐ Upload Files               ← Enable this!
```

**Option B: "Site Media" Section**
```
Site Media
├─ ☐ Read Media
├─ ☐ Generate Upload URL        ← Enable this!
└─ ☐ Upload Media Files         ← Enable this!
```

**Option C: "Media Manager" Section**
```
Media Manager
├─ ☐ Read Media Items
├─ ☐ Generate Upload URL        ← Enable this!
└─ ☐ Upload Files               ← Enable this!
```

#### Step 6: Enable Required Permissions
1. Check the box for **"Generate Upload URL"** (or similar)
2. Check the box for **"Upload Files"** (or similar)
3. Click **"Save"** button at bottom of page

---

### Method 2: Via Site Dashboard

#### Step 1: Access Site Dashboard
1. Go to: [https://www.wix.com/my-account/sites/](https://www.wix.com/my-account/sites/)
2. Select your site from the list

#### Step 2: Navigate to Headless Settings
1. Look for **"Settings"** in left sidebar
2. Find **"Headless"** or **"APIs & Webhooks"**
3. Click to open

#### Step 3: Find OAuth App
1. Look for section labeled **"OAuth Apps"** or **"Headless Applications"**
2. Find your app (Client ID: `be6b179c-58a3-457e-aada-b37e3d245348`)
3. Click **"Manage"** or **"Edit Permissions"**

#### Step 4: Configure Permissions
Follow same steps as Method 1, Step 5-6

---

## 🔍 What You're Looking For

### Permission Names to Enable:

**For Media Upload (Files):**
- ✅ **Generate File Upload URL**
- ✅ **Generate Upload URL**
- ✅ **Files: Generate Upload URL**
- ✅ **Site Media: Generate Upload URL**

**For File Storage:**
- ✅ **Upload Files**
- ✅ **Upload Media Files**
- ✅ **Files: Upload**
- ✅ **Site Media: Upload**

### Visual Indicators:
- Checkboxes or toggle switches
- Usually in sections labeled: **Files**, **Site Media**, or **Media Manager**
- May be grouped with other media-related permissions
- Often near **"Data Collections"** or **"Storage"** sections

---

## 🚨 Troubleshooting

### Problem 1: "I don't see a Permissions tab"

**Possible Causes:**
1. You're looking at site settings, not the OAuth app settings
2. You don't have admin access to the OAuth app
3. The app was created by someone else

**Solution:**
1. Make sure you're at [dev.wix.com](https://dev.wix.com/), not manage.wix.com
2. Verify you're the OAuth app owner
3. Check if app was created under a different Wix account

### Problem 2: "I see Permissions tab but no Media Manager section"

**Possible Causes:**
1. Your Wix plan doesn't include Media Manager API
2. Permissions section hasn't loaded fully
3. Media permissions may be under a different name

**Solution:**
1. Scroll through ENTIRE permissions list (can be long)
2. Use browser search (Ctrl+F / Cmd+F) for: "upload", "files", "media"
3. Check if your Wix plan includes Headless API features
4. Contact Wix support to verify Media Manager API access

### Problem 3: "Permissions are enabled but uploads still fail"

**Possible Causes:**
1. Permissions haven't propagated yet
2. OAuth token needs refresh
3. Incorrect API endpoint

**Solution:**
1. Wait 5-10 minutes after enabling permissions
2. Clear localStorage: `localStorage.clear()` in browser console
3. Reload page to generate fresh OAuth token
4. Check console logs for specific error messages

### Problem 4: "I get 403 Forbidden errors"

**Possible Causes:**
1. Permissions not saved properly
2. Token generated before permissions enabled
3. Wrong OAuth client ID

**Solution:**
1. Double-check permissions are checked AND saved
2. Generate new token: Clear localStorage → reload page
3. Verify client ID matches: `be6b179c-58a3-457e-aada-b37e3d245348`

---

## ✅ Verification Steps

After enabling permissions:

### Step 1: Clear Token Cache
```javascript
// In browser console:
localStorage.clear();
```

### Step 2: Reload Application
Refresh the page to generate new OAuth token with updated permissions

### Step 3: Test Upload
1. Open your application
2. Navigate to Presets tab
3. Create preset with background image
4. Click "☁️ Save to Cloud"
5. Check console logs

### Step 4: Expected Console Output

**✅ Success (CDN Upload):**
```
📤 Uploading image to Wix Media Manager: bg-test-1234567890.png
   → Blob size: 217.45 KB
   → MIME type: image/png
   → Upload URL generated
   → File ID: abc123-def456-ghi789
✅ Image uploaded to Wix CDN
   → CDN URL: https://static.wixstatic.com/media/abc123.png
```

**⚠️ Fallback (Data URLs - Permissions Missing):**
```
📤 Uploading image to Wix Media Manager: bg-test-1234567890.png
❌ Wix image upload failed: 403 Forbidden
⚠️ Falling back to data URL...
⚠️ Using data URL fallback (217.42 KB)
```

---

## 📊 Permission Comparison

| Without Media Manager Permissions | With Media Manager Permissions |
|-----------------------------------|--------------------------------|
| ⚠️ Images use data URLs (~275KB) | ✅ Images use CDN URLs (~80 bytes) |
| ❌ Videos cannot be saved | ✅ Videos upload to CDN |
| ⚠️ Large preset JSON files | ✅ Small, efficient presets |
| ❌ No cross-device media sync | ✅ Perfect cross-device sync |
| ⚠️ localStorage quota issues | ✅ Unlimited cloud storage |

---

## 🔗 Quick Links

- [Wix Developers Dashboard](https://dev.wix.com/)
- [Wix Media Manager API Docs](https://dev.wix.com/docs/rest/assets/media/media-manager)
- [Wix OAuth Configuration Guide](https://dev.wix.com/docs/go-headless/getting-started/setup/authentication)
- [Your Site Dashboard](https://www.wix.com/my-account/sites/)

---

## 💡 Still Can't Find It?

### Option 1: Search the Permissions Page
1. Open Permissions tab in your OAuth app
2. Press `Ctrl+F` (Windows) or `Cmd+F` (Mac)
3. Search for: **"upload"**
4. Look for any permission containing "upload" and "file" or "media"

### Option 2: Enable All Media-Related Permissions
When in doubt, enable ALL permissions in sections labeled:
- Files
- Site Media
- Media Manager
- Storage
- Assets

Then narrow down later based on actual usage.

### Option 3: Check Wix Plan Compatibility
Some permissions may not be available on all Wix plans:
1. Go to [Wix Pricing](https://www.wix.com/upgrade/website)
2. Check if your plan includes "Headless APIs"
3. Verify "Media Manager API" is included
4. Upgrade if necessary

### Option 4: Contact Wix Support
If permissions genuinely don't exist:
1. Go to [Wix Support](https://support.wix.com/)
2. Ask: "How do I enable Media Manager upload permissions for my OAuth app?"
3. Provide your Client ID: `be6b179c-58a3-457e-aada-b37e3d245348`

---

## 📝 Summary

**Fastest Path:**
1. [dev.wix.com](https://dev.wix.com/) → Your Apps → Select app
2. Permissions tab → Scroll to "Files" section
3. Enable "Generate Upload URL" + "Upload Files"
4. Save → Clear localStorage → Reload app
5. Test upload → Check console for CDN URL

**If stuck:** Search permissions page for "upload" or contact Wix support.

**Without these permissions:** System still works but uses data URLs (larger files, no video support).

---

**Need more help?** Share a screenshot of your Permissions tab and I'll guide you through it!
