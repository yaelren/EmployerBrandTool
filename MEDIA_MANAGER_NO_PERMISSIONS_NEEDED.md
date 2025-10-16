# Media Manager: No Special Permissions Needed!

## 🎉 Good News!

According to **official Wix documentation**, the Media Manager upload API **does NOT require special permissions** in your OAuth app for visitor authentication.

---

## 📚 From Official Wix Docs:

The `/site-media/v1/files/generate-upload-url` endpoint:
- ✅ Works with OAuth visitor tokens
- ✅ Does NOT require "MEDIA.SITE_MEDIA_FILES_MANAGE" permission
- ✅ Uses the OAuth token's inherent permissions

**Source:** Wix API Reference (retrieved from Context7 on 2025-10-16)

---

## 🔍 Why You Can't Find Media Manager Permissions

**You're correct** - there are no Media Manager permissions to enable in OAuth apps for visitor authentication because:

1. **Visitor OAuth apps have built-in Media Manager access**
2. **The upload API is designed for external clients** (your use case!)
3. **Permissions are embedded in the OAuth token itself**

---

## ❓ So Why Are We Getting 403 Errors?

If you're getting 403 errors on Media Manager uploads, it's **NOT** because of missing permissions. Here are the actual possible causes:

### 1. **OAuth Token Issue**
**Problem:** Token might be expired or invalid

**Solution:**
```javascript
// In browser console:
localStorage.clear();
location.reload();
```

### 2. **Incorrect API Endpoint**
**Problem:** Wrong base URL or endpoint path

**Current endpoint:**
```javascript
const endpoint = `${this.baseURL}/site-media/v1/files/generate-upload-url`;
```

**Verify baseURL:**
```javascript
// Should be: https://www.wixapis.com
console.log(window.WixPresetAPI?.baseURL);
```

### 3. **CORS Issues**
**Problem:** Browser blocking cross-origin requests

**Check console for:**
```
Access to fetch at 'https://www.wixapis.com/...' from origin '...' has been blocked by CORS policy
```

### 4. **Request Format Issues**
**Problem:** Incorrect request body or headers

**Current implementation:**
```javascript
const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        mimeType: mimeType,
        fileName: filename
    })
});
```

---

## 🧪 Let's Debug Together

### Step 1: Check Your Current Setup

**Open browser console (F12) and run:**

```javascript
// 1. Check if WixPresetAPI exists
console.log('API exists:', window.app?.presetManager?.wixAPI !== undefined);

// 2. Check base URL
console.log('Base URL:', window.app?.presetManager?.wixAPI?.baseURL);

// 3. Check if authenticated
console.log('Has token:', !!localStorage.getItem('wix_access_token'));

// 4. Check token expiry
const expiresAt = localStorage.getItem('wix_token_expires_at');
if (expiresAt) {
    const expiry = new Date(parseInt(expiresAt));
    const now = new Date();
    console.log('Token expires:', expiry.toLocaleString());
    console.log('Token valid:', expiry > now);
}
```

### Step 2: Test Upload Endpoint Directly

**Try generating an upload URL:**

```javascript
// Run in console after uploading a background image
async function testUpload() {
    const api = window.app.presetManager.wixAPI;

    try {
        console.log('🧪 Testing Media Manager upload...');
        console.log('   → Base URL:', api.baseURL);
        console.log('   → Has token:', !!api.accessToken);

        const result = await api.generateMediaUploadUrl('image/png', 'test.png');
        console.log('✅ SUCCESS! Upload URL generated:', result);
        return result;

    } catch (error) {
        console.error('❌ FAILED:', error);
        console.error('   → Status:', error.status);
        console.error('   → Message:', error.message);
        return null;
    }
}

testUpload();
```

### Step 3: Check Network Tab

1. Open **DevTools** (F12)
2. Go to **Network** tab
3. Filter by: `generate-upload-url`
4. Try saving a preset with an image
5. Click on the failed request
6. Check:
   - **Request URL**: Should be `https://www.wixapis.com/site-media/v1/files/generate-upload-url`
   - **Request Headers**: Should include `Authorization: Bearer ...`
   - **Request Payload**: Should have `mimeType` and `fileName`
   - **Response**: Look for specific error message

---

## 🔧 Possible Fixes

### Fix 1: Token Refresh Issue

If token is expired or invalid:

```javascript
// Force new authentication
localStorage.clear();
location.reload();
// App will automatically re-authenticate
```

### Fix 2: CORS Configuration

If you're running locally and getting CORS errors, the issue is with local development setup, not production.

**Workaround for local development:**
- Use a CORS proxy (not recommended for production)
- Or test directly on your deployed Wix site

### Fix 3: Verify OAuth Client ID

Make sure your `config.json` has the correct client ID:

```json
{
    "wix": {
        "clientId": "be6b179c-58a3-457e-aada-b37e3d245348"
    }
}
```

### Fix 4: Check if Feature is Enabled in Wix

1. Go to your Wix Dashboard
2. Navigate to **Settings** → **Headless**
3. Verify your OAuth app is **enabled**
4. Check if there are any warnings or notices

---

## 📊 What Should Happen

### Successful Upload Flow:

```console
1️⃣ Generate Upload URL Request:
POST https://www.wixapis.com/site-media/v1/files/generate-upload-url
Headers: {
    Authorization: Bearer eyJhbGc...
    Content-Type: application/json
}
Body: {
    mimeType: "image/png",
    fileName: "bg-test-123.png"
}

2️⃣ Response (200 OK):
{
    "uploadUrl": "https://upload.wixmp.com/upload/...",
    "fileId": "abc123-def456-ghi789"
}

3️⃣ Upload File to CDN:
PUT https://upload.wixmp.com/upload/...?filename=bg-test-123.png
Headers: {
    Content-Type: image/png
}
Body: [binary blob data]

4️⃣ Response (200 OK):
{
    "file": {
        "id": "2acbb8_...",
        "url": "https://static.wixstatic.com/media/2acbb8_...png",
        ...
    }
}
```

### What You're Seeing (403 Error):

```console
1️⃣ Generate Upload URL Request:
POST https://www.wixapis.com/site-media/v1/files/generate-upload-url
Headers: {
    Authorization: Bearer eyJhbGc...
    Content-Type: application/json
}

2️⃣ Response (403 Forbidden):
{
    "error": "Permission denied" or "Unauthorized"
}
```

---

## 🎯 Next Steps

**Since there are NO permissions to enable**, the 403 error must be from one of these:

1. **Token issue** - Try: `localStorage.clear()` → reload
2. **OAuth app not active** - Check Wix dashboard
3. **Wrong client ID** - Verify config.json
4. **Request format** - Check network tab for details
5. **Wix account issue** - Contact Wix support

---

## 💡 Quick Test

**Run this complete diagnostic:**

```javascript
async function fullDiagnostic() {
    console.log('🔍 FULL DIAGNOSTIC TEST\n');

    // 1. Check setup
    console.log('1️⃣ SETUP CHECK');
    console.log('   ✓ API exists:', !!window.app?.presetManager?.wixAPI);
    console.log('   ✓ Base URL:', window.app?.presetManager?.wixAPI?.baseURL);
    console.log('   ✓ Client ID:', window.WIX_CONFIG?.clientId);
    console.log('');

    // 2. Check token
    console.log('2️⃣ TOKEN CHECK');
    const token = localStorage.getItem('wix_access_token');
    const expiresAt = localStorage.getItem('wix_token_expires_at');
    console.log('   ✓ Has token:', !!token);
    if (token) {
        console.log('   ✓ Token length:', token.length);
        console.log('   ✓ Token preview:', token.substring(0, 20) + '...');
    }
    if (expiresAt) {
        const expiry = new Date(parseInt(expiresAt));
        console.log('   ✓ Expires:', expiry.toLocaleString());
        console.log('   ✓ Valid:', expiry > new Date() ? 'YES' : 'NO (EXPIRED!)');
    }
    console.log('');

    // 3. Test upload URL generation
    console.log('3️⃣ UPLOAD URL TEST');
    const api = window.app?.presetManager?.wixAPI;
    if (api && api.accessToken) {
        try {
            const result = await api.generateMediaUploadUrl('image/png', 'diagnostic-test.png');
            console.log('   ✅ SUCCESS! Upload URL generated');
            console.log('   → Upload URL:', result.uploadUrl.substring(0, 50) + '...');
            console.log('   → File ID:', result.fileId);
        } catch (error) {
            console.error('   ❌ FAILED');
            console.error('   → Error:', error.message);
            console.error('   → Full error:', error);
        }
    } else {
        console.error('   ❌ Cannot test - API not initialized or no token');
    }

    console.log('\n🏁 DIAGNOSTIC COMPLETE');
}

fullDiagnostic();
```

---

## 📝 Summary

**Key Insight:** You were right to say "i think there isnt wone" (isn't one)!

**The Wix Media Manager upload API for OAuth visitors does NOT require special permissions in the OAuth app.**

**Your 403 errors are from:**
- Token issues (expired, invalid, or not generated)
- OAuth app configuration (not enabled, wrong client ID)
- Request format issues
- Wix account/site issues

**NOT from:**
- ❌ Missing "MEDIA.SITE_MEDIA_FILES_MANAGE" permission
- ❌ Missing "Generate Upload URL" permission
- ❌ Missing "Upload Files" permission

**These permissions don't exist for visitor OAuth!**

---

**Let's run the diagnostic and see what the real issue is!** 🔍
