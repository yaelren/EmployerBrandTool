# Wix API Key Types: IST vs JWS

## 🎯 Quick Answer

For **Media Manager REST API**, you need:
- ✅ **Account-level API Key** (starts with `JWS.`)
- ❌ **NOT Instance Token** (starts with `IST.`)

---

## 📊 Comparison

| Feature | Instance Token (IST) | Account API Key (JWS) |
|---------|---------------------|---------------------|
| **Prefix** | `IST.` | `JWS.` |
| **Purpose** | Internal Wix operations | REST API authentication |
| **Scope** | Specific site instance | Account-level access |
| **For Media Manager** | ❌ Does NOT work | ✅ Works correctly |
| **Found Where** | Site dashboard, embedded code | Account settings, API Keys |
| **Security Level** | Site-specific | Account-wide |

---

## 🔍 How to Identify What You Have

### Check Your Current Key:

**If it starts with `IST.`:**
```
IST.eyJraWQiOiJQb3pIX0FDMiIsImFsZyI6IlJTMjU2In0...
```
→ **You have an Instance Token** - Won't work with Media Manager REST API

**If it starts with `JWS.`:**
```
JWS.eyJraWQiOiJQb3pIX0FDMiIsImFsZyI6IlJTMjU2In0...
```
→ **You have an Account API Key** - Perfect for Media Manager REST API!

### Check Console Output:

When you save a preset, look for this line:
```console
WixPresetAPI.js:447    → API key prefix: IST
```

- `IST` = Wrong type, will get 403 errors
- `JWS` = Correct type, should work!

---

## ✅ How to Get the Correct Key Type

### Method 1: Wix Account Settings (Best for Account-level API Keys)

1. **Navigate to:** [https://www.wix.com/my-account/](https://www.wix.com/my-account/)
2. Click **"Account Settings"** (top right corner)
3. Go to **"API Keys"** section in sidebar
4. Click **"Generate API Key"** or **"Create New Key"**
5. Name it: `Media Manager Upload`
6. Enable permissions: **"Media Manager"**
7. **Copy the key** - Should start with `JWS.`

### Method 2: Wix Developers Console

1. **Navigate to:** [https://dev.wix.com/](https://dev.wix.com/)
2. Go to **"API Keys"** section
3. Click **"Create API Key"**
4. Select scope: **"Media Manager"**
5. **Copy the key** - Should start with `JWS.`

---

## 🚨 Common Mistakes

### Mistake 1: Using Site Dashboard API Key
**Problem:** Going to individual site settings instead of account settings
**Result:** Often gives Instance Token (IST) instead of Account API Key (JWS)
**Fix:** Go to **Account Settings**, not site settings

### Mistake 2: Using OAuth Client ID
**Problem:** Copying the OAuth app's client ID thinking it's an API key
**Result:** Client IDs don't start with IST or JWS, completely wrong format
**Fix:** Generate a proper API key from Account Settings → API Keys

### Mistake 3: Mixing Up Token Types
**Problem:** Using Instance Token from embedded Wix code
**Result:** IST tokens work for internal Wix operations but not REST API
**Fix:** Get dedicated Account API Key for REST API operations

---

## 🔧 How to Replace Your Key

### If You Currently Have IST Token:

1. **Open:** `js/config/wix-config.js`

2. **Current code (WRONG):**
```javascript
apiKey: 'IST.eyJraWQiOiJQb3pIX0FDMiIsImFsZyI6IlJTMjU2In0...'
```

3. **Replace with JWS key (CORRECT):**
```javascript
apiKey: 'JWS.eyJraWQiOiJQb3pIX0FDMiIsImFsZyI6IlJTMjU2In0...'
```

4. **Hard reload:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

5. **Test:** Save preset and check console for:
```console
→ API key prefix: JWS  ← Should be JWS now!
```

---

## 📚 Official Documentation

According to [Wix Media Manager API docs](https://dev.wix.com/docs/api-reference/assets/media/media-manager/introduction):

> **Authentication Methods:**
> - API Key (Account-level)
> - OAuth 2.0 with elevated permissions
>
> **For direct REST API calls**, use Account-level API Keys.

**Key point:** Instance Tokens (IST) are NOT mentioned as valid authentication for REST API endpoints.

---

## 🎓 Why This Matters

### Instance Tokens (IST) are for:
- Internal Wix platform operations
- Site-specific functionality
- Embedded Wix components
- Instance-level data access

### Account API Keys (JWS) are for:
- **REST API authentication** ← What we need!
- Cross-site operations
- External applications
- Media Manager uploads

---

## ✅ Verification Checklist

After getting your new API key:

- [ ] Key starts with `JWS.` (not `IST.`)
- [ ] Key is complete (no spaces or line breaks)
- [ ] Pasted into `wix-config.js` with quotes: `apiKey: 'JWS...'`
- [ ] File saved
- [ ] Hard reload performed: `Ctrl+Shift+R` or `Cmd+Shift+R`
- [ ] Console shows: `→ API key prefix: JWS`
- [ ] No 403 errors in console
- [ ] Video uploads successfully

---

## 🎯 Expected Results After Fix

### Before (with IST token):
```console
WixPresetAPI.js:447    → API key prefix: IST
WixPresetAPI.js:467  POST https://www.wixapis.com/site-media/v1/files/generate-upload-url 403 (Forbidden)
⚠️ Falling back to data URL...
⚠️ Using data URL fallback (142.89 KB)
```

### After (with JWS key):
```console
WixPresetAPI.js:447    → API key prefix: JWS
📤 Uploading image to Wix Media Manager: bg-test-1234567890.png
   → Auth type: API Key (admin)
   → Upload URL generated
✅ Image uploaded to Wix CDN
   → CDN URL: https://static.wixstatic.com/media/abc123.png
```

---

## 🔗 Quick Links

- [Get Account API Key](https://www.wix.com/my-account/) → Account Settings → API Keys
- [Wix Developers Console](https://dev.wix.com/) → API Keys section
- [Media Manager API Docs](https://dev.wix.com/docs/api-reference/assets/media/media-manager/introduction)
- [Setup Guide](ENABLE_VIDEO_UPLOADS.md)

---

**Summary:** Always use Account-level API Keys (JWS format) for Media Manager REST API. Instance Tokens (IST) won't work! ✨
