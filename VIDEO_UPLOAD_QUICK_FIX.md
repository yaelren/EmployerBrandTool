# Video Upload Quick Fix

## 🎯 The Problem

You're getting 403 errors when uploading videos because you have an **Instance Token (IST)** instead of an **Account API Key (JWS)**.

**Console shows:**
```
→ API key prefix: IST
POST https://www.wixapis.com/site-media/v1/files/generate-upload-url 403 (Forbidden)
```

---

## ✅ The Solution

Replace your `IST.` token with a proper `JWS.` API key.

---

## ⚡ Quick Fix (5 Minutes)

### Step 1: Get Correct API Key

**Go to:** [https://www.wix.com/my-account/](https://www.wix.com/my-account/)

**Path:**
```
Account Settings → API Keys → Generate API Key
→ Name: "Media Manager Upload"
→ Enable: "Media Manager" permissions
→ Copy key (must start with JWS.)
```

**Detailed guide:** [GET_WIX_API_KEY.md](GET_WIX_API_KEY.md)

---

### Step 2: Replace in Config File

**Open:** [js/config/wix-config.js](js/config/wix-config.js)

**Change this:**
```javascript
apiKey: 'IST.eyJraWQiOiJQb3pIX0FDMiIsImFsZyI6IlJTMjU2In0...'  // ❌ WRONG
```

**To this:**
```javascript
apiKey: 'JWS.eyJraWQiOiJQb3pIX0FDMiIsImFsZyI6IlJTMjU2In0...'  // ✅ CORRECT
```

---

### Step 3: Hard Reload

Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

---

### Step 4: Test

1. Add a video to a cell or background
2. Go to Presets tab
3. Click "☁️ Save to Cloud"
4. Check console

**Expected output:**
```console
→ API key prefix: JWS  ← Should be JWS now!
✅ Video uploaded to Wix CDN
→ CDN URL: https://video.wixstatic.com/video/...
```

---

## 🔍 How to Verify You Have the Right Key

### ✅ Correct Format (Account API Key):
```
JWS.eyJraWQiOiJQb3pIX0FDMiIsImFsZyI6IlJTMjU2In0...
```
→ **Use this!** Works with Media Manager REST API

### ❌ Wrong Format (Instance Token):
```
IST.eyJraWQiOiJQb3pIX0FDMiIsImFsZyI6IlJTMjU2In0...
```
→ **Don't use!** Won't work with Media Manager REST API

---

## 📊 What This Fixes

| Before (IST Token) | After (JWS Key) |
|-------------------|----------------|
| ❌ Videos fail to upload | ✅ Videos upload to CDN |
| ⚠️ Images use data URLs (142 KB) | ✅ Images use CDN URLs (~80 bytes) |
| ❌ 403 Forbidden errors | ✅ 200 OK responses |
| ⚠️ Large preset files | ✅ Tiny preset files |
| ❌ No cross-device video sync | ✅ Perfect video sync |

---

## 🚨 Still Getting Errors?

### Check Console for:

**If you see:**
```
→ API key prefix: IST
```
→ **You still have the wrong key!** Follow Step 1 again.

**If you see:**
```
→ API key prefix: JWS
POST ... 403 (Forbidden)
```
→ **API key permissions issue.** Make sure "Media Manager" permission is enabled.

**If you see:**
```
→ API key prefix: undefined
```
→ **Key not loaded.** Check you saved wix-config.js and did hard reload.

---

## 📚 Detailed Documentation

Need more details? Check these guides:

1. **[GET_WIX_API_KEY.md](GET_WIX_API_KEY.md)** - Step-by-step visual guide
2. **[WIX_API_KEY_TYPES.md](WIX_API_KEY_TYPES.md)** - IST vs JWS explained
3. **[ENABLE_VIDEO_UPLOADS.md](ENABLE_VIDEO_UPLOADS.md)** - Complete setup guide
4. **[Wix Media Manager API](https://dev.wix.com/docs/api-reference/assets/media/media-manager/introduction)** - Official docs

---

## 🎯 Summary

**Problem:** IST token doesn't work with Media Manager REST API
**Solution:** Get JWS Account API Key from Account Settings
**Time:** 5 minutes
**Result:** Videos upload successfully to Wix CDN ✨

**That's it!** Just swap IST for JWS and everything works. 🚀
