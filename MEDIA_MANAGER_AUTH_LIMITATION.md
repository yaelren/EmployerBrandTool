# Media Manager Authentication Limitation

## 🚨 Critical Discovery

The Wix Media Manager `generateFileUploadUrl` endpoint **does NOT support anonymous visitor OAuth tokens**.

---

## 📚 From Official Wix Documentation

> **"When building apps without Blocks or for headless projects, you can only call the Generate File Upload Url method directly when authenticated as a Wix app or Wix user identity. When authenticated as a different identity, you can call this method using elevation."**

**Source:** Wix Developer Documentation (2025)

---

## 🔍 What This Means

### Current Authentication Method:
```javascript
// We're using anonymous visitor OAuth
{
    clientId: "be6b179c-58a3-457e-aada-b37e3d245348",
    grantType: "anonymous"  // ← Visitor authentication
}
```

### What Media Manager Requires:
- **Wix App authentication** (not visitor)
- **Wix User authentication** (logged-in member)
- **Elevation** (backend code with elevated permissions)

### Why Data Collections Works But Media Manager Doesn't:

| API | Visitor OAuth Support |
|-----|----------------------|
| Data Collections | ✅ Supported |
| Media Manager Upload | ❌ **NOT** Supported |

---

## 🎯 Available Solutions

### Solution 1: Keep Data URLs (Current Fallback) ✅ **WORKING**

**What happens:**
- Images fall back to data URLs (~290KB per image)
- Videos cannot be saved (no fallback)
- System works but with larger file sizes

**Pros:**
- ✅ Already implemented and working
- ✅ No backend code needed
- ✅ No additional Wix setup required
- ✅ Cross-device sync works (via Data Collections)

**Cons:**
- ⚠️ Large preset JSON files (~290KB per image)
- ❌ Videos cannot be saved
- ⚠️ Slower loading times

**Current Status:** This is what's working right now!

---

### Solution 2: Backend API Proxy with Elevation ⭐ **RECOMMENDED**

Create a backend API endpoint that uses **elevated permissions** to upload to Media Manager.

**Architecture:**
```
Browser → Your Backend API → Wix Media Manager (with elevation)
```

**Implementation Options:**

#### Option A: Wix Blocks Backend

Create a Wix Blocks backend function:

```javascript
// Backend file (.web.js)
import { files } from '@wix/media';
import { elevate } from 'wix-auth';

export const generateUploadUrl = elevate(async (mimeType, fileName) => {
    // This runs with elevated permissions
    const result = await files.generateFileUploadUrl(mimeType, {
        fileName: fileName
    });
    return result;
});
```

**Pros:**
- ✅ Uses official Wix SDK
- ✅ Built-in elevation support
- ✅ Hosted on Wix infrastructure

**Cons:**
- ⚠️ Requires Wix Blocks setup
- ⚠️ Needs backend code deployment

#### Option B: External Backend (Node.js/Express)

Create your own backend API:

```javascript
// server.js
const express = require('express');
const app = express();

app.post('/api/generate-upload-url', async (req, res) => {
    const { mimeType, fileName } = req.body;

    // Use Wix API Key (admin authentication)
    const response = await fetch('https://www.wixapis.com/site-media/v1/files/generate-upload-url', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${WIX_API_KEY}`,  // Admin API key
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mimeType, fileName })
    });

    const data = await response.json();
    res.json(data);
});
```

**Pros:**
- ✅ Full control over backend
- ✅ Can add additional logic/validation
- ✅ Works with any hosting provider

**Cons:**
- ⚠️ Requires separate backend hosting
- ⚠️ Need to secure Wix API key
- ⚠️ Additional infrastructure costs

---

### Solution 3: Use API Key Authentication (Admin) ⚠️ **NOT RECOMMENDED**

Use Wix API Key directly in frontend (admin authentication).

```javascript
// ❌ NOT SECURE - API key exposed in frontend
const response = await fetch(endpoint, {
    headers: {
        'Authorization': `Bearer ${WIX_API_KEY}`  // Admin API key
    }
});
```

**Pros:**
- ✅ Simple to implement
- ✅ Works immediately

**Cons:**
- ❌ **SECURITY RISK**: API key exposed in browser
- ❌ **NOT RECOMMENDED** by Wix
- ❌ Anyone can extract and abuse your API key

---

### Solution 4: Member OAuth (Require Login)

Switch from anonymous visitor OAuth to member OAuth (require users to log in).

**Changes needed:**
```javascript
// Instead of anonymous grant
{
    clientId: "...",
    grantType: "authorization_code",  // Member authentication
    code: "...",  // From OAuth flow
    redirectUri: "..."
}
```

**Pros:**
- ✅ Member tokens have more permissions
- ✅ May support Media Manager (needs testing)

**Cons:**
- ⚠️ Requires user login (not anonymous anymore)
- ⚠️ More complex OAuth flow
- ⚠️ May still not have Media Manager permissions

**Status:** Uncertain if member OAuth has Media Manager upload permissions.

---

## 💡 Recommended Approach

### Short Term: **Keep Current System (Solution 1)**

**Why:**
- ✅ Already working with data URL fallback
- ✅ No additional development needed
- ✅ Images work (just larger file sizes)
- ✅ Cross-device sync via Data Collections

**Trade-off:**
- Larger preset files (~290KB per image vs 80 bytes)
- Videos cannot be saved

### Long Term: **Add Backend Proxy (Solution 2)**

**Why:**
- ✅ Best security practice
- ✅ Official Wix recommendation
- ✅ Enables full CDN upload functionality
- ✅ Supports images AND videos

**When to implement:**
- When video uploads become critical
- When preset file sizes become problematic
- When you have time to set up backend infrastructure

---

## 📊 Current System Performance

### What Works Right Now:

| Feature | Status | Details |
|---------|--------|---------|
| Data Collections (Presets) | ✅ Working | Anonymous visitor OAuth supported |
| Image Upload (Data URL) | ✅ Working | Fallback to embedded data URLs |
| Video Upload | ❌ Blocked | No fallback, fails completely |
| Cross-device Sync | ✅ Working | Via Data Collections |
| Preset Save/Load | ✅ Working | Full functionality |

### File Size Impact:

**With Data URLs (Current):**
- Background image: ~275 KB per preset
- Cell image: ~180 KB per preset
- Total for 1 background + 1 cell: ~455 KB

**With CDN (Requires Backend):**
- Background image URL: ~80 bytes
- Cell image URL: ~80 bytes
- Total for 1 background + 1 cell: ~0.5 KB (99% reduction)

---

## 🎯 Immediate Action Items

### Option A: Accept Current Limitations (EASY)
1. ✅ System already works with data URLs
2. ✅ Update user documentation to explain limitations
3. ✅ Consider it "Phase II-A" (partial cloud sync)

### Option B: Implement Backend Proxy (COMPLEX)
1. ⏳ Choose backend option (Wix Blocks or External)
2. ⏳ Set up backend infrastructure
3. ⏳ Implement elevated Media Manager calls
4. ⏳ Update frontend to call backend proxy
5. ⏳ Test and deploy

---

## 📝 Summary

**The 403 Error Cause:**
- ❌ Not about permissions in OAuth app
- ❌ Not about request body format
- ✅ **Fundamental limitation:** Visitor OAuth doesn't support Media Manager upload API

**Current Status:**
- ✅ System works with data URL fallback
- ✅ Images save successfully (just larger)
- ❌ Videos cannot save
- ✅ Cross-device sync via Data Collections

**Recommendation:**
- **Short term:** Keep current system (it works!)
- **Long term:** Add backend proxy when needed

**User Impact:**
- Slightly slower preset loading (larger files)
- No video support in presets
- Everything else works perfectly

---

## 🔗 Related Documentation

- **Bug Investigation:** [BUG_FIX_403_ERROR.md](BUG_FIX_403_ERROR.md)
- **Upload System:** [MEDIA_UPLOAD_SYSTEM.md](MEDIA_UPLOAD_SYSTEM.md)
- **No Permissions Needed:** [MEDIA_MANAGER_NO_PERMISSIONS_NEEDED.md](MEDIA_MANAGER_NO_PERMISSIONS_NEEDED.md)

---

**Bottom Line:** Your system is working correctly with the limitations of anonymous visitor OAuth. To enable CDN uploads, you'd need a backend proxy with elevated permissions.
