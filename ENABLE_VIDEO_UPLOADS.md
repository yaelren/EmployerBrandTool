# Enable Video Uploads - Quick Setup Guide

## 🎯 What This Does

Enables video uploads to Wix Media Manager by using your Wix API Key instead of visitor OAuth tokens.

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Get Your Wix API Key (Account-Level)

**IMPORTANT:** You need an **Account-level API Key** (starts with `JWS.`), NOT an Instance Token (starts with `IST.`).

#### Method 1: Get from Wix Dashboard (Recommended)

1. Go to: **[https://www.wix.com/my-account/](https://www.wix.com/my-account/)**
2. Click **"Account Settings"** in top right
3. Navigate to: **"API Keys"** in the sidebar
4. Click **"Generate API Key"** or **"Create New Key"**
5. Give it a name: `Chatooly Media Upload`
6. **Important:** Check the box for **"Media Manager"** permissions
7. **Copy the API key** (should start with: `JWS.eyJraWQiOiJQb3pIX0...`)

#### Method 2: Get from Developer Console

1. Go to: **[https://dev.wix.com/](https://dev.wix.com/)**
2. Navigate to **"API Keys"** section
3. Click **"Create API Key"**
4. Select permissions: **"Media Manager"**
5. **Copy the API key** (must start with `JWS.`, not `IST.`)

#### ✅ Verify Your API Key:

**Correct format:**
```
JWS.eyJraWQiOiJQb3pIX0FDMiIsImFsZyI6IlJTMjU2In0...
```

**Wrong format (don't use):**
```
IST.eyJraWQiOiJQb3pIX0FDMiIsImFsZyI6IlJTMjU2In0...
```

**If your key starts with `IST.`**, it's an Instance Token and will NOT work with the Media Manager REST API.

### Step 2: Add API Key to Config

1. Open: **`js/config/wix-config.js`**
2. Find the line: `apiKey: null`
3. Replace with your API key:
   ```javascript
   apiKey: 'JWS.eyJraWQiOiJQb3pIX0...'  // Paste your key here
   ```

### Step 3: Reload and Test

1. **Hard reload** your browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Add a video to a cell or background
3. Go to **Presets** tab
4. Click **"☁️ Save to Cloud"**
5. Check console for success message

---

## ✅ Expected Console Output

### Success:
```console
🔄 Initializing Wix REST API...
🔑 API Key provided - Media Manager uploads will use admin authentication
   ⚠️ API key exposed in browser - use only for personal/demo projects
✅ Wix REST API initialized successfully

📤 SAVE: Uploading cell video 1...
   → Video dimensions: 1994 x 1346
   → Video duration: 4.992733 seconds
📤 Uploading video to Wix Media Manager: cell-test-0-1234567890.webm
   → Auth type: API Key (admin)
   → Blob size: 1455.66 KB
   → MIME type: video/webm
   → Response status: 200 OK
   → Upload URL generated
   → File ID: abc123-def456
✅ Video uploaded to Wix CDN
   → CDN URL: https://video.wixstatic.com/video/...
✅ SAVE: Uploaded 0 image(s) and 1 video(s)
```

### If Still Failing:
```console
❌ Failed to generate upload URL: 401 Unauthorized
```
→ **Check API key is correct** (no extra spaces, complete key)

---

## 🔒 Security Warning

### ⚠️ API Key is Exposed in Browser

**This approach exposes your Wix API key in the browser's JavaScript code.**

**Safe for:**
- ✅ Personal projects
- ✅ Demo/testing environments
- ✅ Local development
- ✅ Trusted users only

**NOT safe for:**
- ❌ Production with public access
- ❌ Websites with untrusted users
- ❌ Open source projects

**Why?** Anyone can open the browser's developer tools and steal your API key, giving them admin access to your Wix site.

---

## 🎓 What is Wix Blocks? (Option 2 - Secure Solution)

**Wix Blocks** is Wix's platform for building custom widgets and apps with backend code.

### How it works:
```
Browser → Wix Blocks Backend (secure) → Wix Media Manager
                ↑
           API key stays here (safe!)
```

### Setup Process:

1. **Create Wix Blocks Project:**
   - Go to [Wix Blocks](https://www.wix.com/app-builder)
   - Click "Create New App"
   - Choose "Blocks App"

2. **Add Backend Function:**
   ```javascript
   // Backend file (.web.js)
   import { files } from '@wix/media';
   import { elevate } from 'wix-auth';

   export const generateUploadUrl = elevate(async (mimeType, fileName) => {
       const result = await files.generateFileUploadUrl(mimeType, {
           fileName: fileName
       });
       return result;
   });
   ```

3. **Call from Frontend:**
   ```javascript
   // Your app calls Wix Blocks backend
   import { generateUploadUrl } from 'backend/media';

   const result = await generateUploadUrl('video/webm', 'video.webm');
   ```

### Benefits:
- ✅ **Secure** - API key stays on server
- ✅ **Official** - Uses Wix SDK
- ✅ **Scalable** - Hosted on Wix infrastructure
- ✅ **Production-ready** - Safe for public sites

### Time Investment:
- Initial setup: ~30 minutes
- Learning curve: Medium
- Long-term: Best solution

---

## 📊 Comparison

| Feature | Option 1 (API Key) | Option 2 (Wix Blocks) |
|---------|-------------------|---------------------|
| **Setup Time** | 5 minutes | 30 minutes |
| **Security** | ⚠️ API key exposed | ✅ Secure |
| **Production Ready** | ❌ No | ✅ Yes |
| **Maintenance** | Low | Medium |
| **Cost** | Free | Free |
| **For Personal Use** | ✅ Perfect | ⚡ Overkill |
| **For Public Sites** | ❌ Risky | ✅ Required |

---

## 🎯 Recommendation

**For your use case (personal project/testing):**
→ **Use Option 1 (API Key)** - It's fast, simple, and works great for personal use!

**If you later want to publish publicly:**
→ **Upgrade to Option 2 (Wix Blocks)** - Secure and production-ready

---

## 🔧 Troubleshooting

### Problem: "API key undefined"
**Solution:** Make sure you saved `wix-config.js` and did a hard reload.

### Problem: Still getting 403 errors
**Solution:**
1. **Check if key starts with `IST.` instead of `JWS.`** - This is the most common issue!
   - If it starts with `IST.`, you have an Instance Token (wrong type)
   - You need an Account-level API Key starting with `JWS.`
   - Follow Step 1 above to get the correct key type
2. Double-check API key is complete (no spaces, no line breaks)
3. Make sure you did a **hard reload** after updating the key: `Ctrl+Shift+R` or `Cmd+Shift+R`
4. Verify API key has Media Manager permissions enabled
5. Check console for the line: `→ API key prefix: JWS` (should be JWS, not IST)

### Problem: "API key not found in Wix dashboard"
**Solution:** Look for:
- Settings → API Keys
- Developer Tools → API Keys
- Advanced → API Keys
Different Wix plans have different menu locations.

### Problem: Videos upload but don't play on reload
**Solution:** This is a different issue - check `restoreVideoFromURL()` method.

---

## ✅ You're All Set!

Once your API key is added to `wix-config.js`, you can:
- ✅ Upload videos to cells
- ✅ Upload videos to backgrounds
- ✅ Save presets with videos
- ✅ Load presets with videos across devices
- ✅ Videos stored on Wix CDN (tiny URLs)

**Enjoy your video uploads!** 🎉

---

## 📝 Quick Reference

**Config file:** `js/config/wix-config.js`
**Line to edit:** `apiKey: null` → `apiKey: 'YOUR_KEY_HERE'`
**Get API key:** [Wix Dashboard](https://www.wix.com/my-account/site-selector/) → Site → Settings → API Keys

**Questions?** See [MEDIA_MANAGER_AUTH_LIMITATION.md](MEDIA_MANAGER_AUTH_LIMITATION.md) for detailed explanation of why this is needed.
