# Get Wix Account API Key - Visual Guide

## 🎯 What You Need

**Account-level API Key** that starts with `JWS.` (not `IST.`)

---

## 📍 Navigation Path

```
https://www.wix.com/my-account/
↓
Click "Account Settings" (top right)
↓
Click "API Keys" (left sidebar)
↓
Click "Generate API Key" or "Create New Key"
↓
Name: "Media Manager Upload"
↓
Enable: "Media Manager" permissions
↓
Copy key (starts with JWS.)
```

---

## 🖼️ Step-by-Step Visual Guide

### Step 1: Go to Wix Account Dashboard

**URL:** [https://www.wix.com/my-account/](https://www.wix.com/my-account/)

**What you'll see:**
```
┌─────────────────────────────────────────────────┐
│  Wix                    [Your Name ▼]           │ ← Click here
├─────────────────────────────────────────────────┤
│  My Sites                                       │
│  ┌───────┐  ┌───────┐  ┌───────┐              │
│  │ Site1 │  │ Site2 │  │ Site3 │              │
│  └───────┘  └───────┘  └───────┘              │
└─────────────────────────────────────────────────┘
```

**Action:** Click your name/avatar in top right → Select **"Account Settings"**

---

### Step 2: Navigate to API Keys

**What you'll see in Account Settings:**
```
┌─────────────────────────────────────────────────┐
│  Account Settings                               │
│                                                 │
│  ┌──────────────────┐  ┌─────────────────────┐│
│  │ Personal Info    │  │ Content             ││
│  │ Billing & Plans  │  │ ...                 ││
│  │ Security         │  │                     ││
│  │ API Keys         │ ← Click here           ││
│  └──────────────────┘  └─────────────────────┘│
└─────────────────────────────────────────────────┘
```

**Action:** Click **"API Keys"** in the left sidebar

---

### Step 3: Create New API Key

**What you'll see on API Keys page:**
```
┌─────────────────────────────────────────────────┐
│  API Keys                                       │
│                                                 │
│  [+ Generate API Key] or [Create New Key]      │ ← Click here
│                                                 │
│  Existing keys (if any):                       │
│  ┌─────────────────────────────────────────┐  │
│  │ My Previous Key                         │  │
│  │ JWS.eyJraWQiOiJQb3pIX0...              │  │
│  └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Action:** Click **"Generate API Key"** or **"Create New Key"**

---

### Step 4: Configure API Key

**What you'll see in the creation dialog:**
```
┌─────────────────────────────────────────────────┐
│  Create API Key                                 │
│                                                 │
│  Name: [Media Manager Upload    ]              │ ← Type name
│                                                 │
│  Permissions:                                   │
│  ☐ Data Collections                            │
│  ☑ Media Manager                               │ ← Check this!
│  ☐ Members                                      │
│  ☐ eCommerce                                    │
│  ☐ ...                                          │
│                                                 │
│  [Cancel]  [Create API Key]                    │ ← Click create
└─────────────────────────────────────────────────┘
```

**Actions:**
1. **Name:** Type `Media Manager Upload`
2. **Permissions:** Check **"Media Manager"**
3. **Click:** "Create API Key" button

---

### Step 5: Copy the API Key

**What you'll see after creation:**
```
┌─────────────────────────────────────────────────┐
│  Your API Key                                   │
│                                                 │
│  JWS.eyJraWQiOiJQb3pIX0FDMiIsImFsZyI6IlJTMjU2 │ ← Copy this!
│  In0.eyJpYXQiOjE3MDk1NzY4NDksImV4cCI6MTcxMDEw │
│  ODQ0OSwianRpIjoiOGM4ZjJhYWItZGIyMC00YzEzLWJk │
│  MzktNjExYWQxOTFkNGJkIn0.signature...          │
│                                                 │
│  [Copy]  [Done]                                │ ← Click copy
│                                                 │
│  ⚠️ This is the only time you'll see this key  │
└─────────────────────────────────────────────────┘
```

**Actions:**
1. **Click:** "Copy" button (or select all and copy manually)
2. **Verify:** Check it starts with `JWS.` (not `IST.`)
3. **Save:** Keep it safe - you won't see it again!

---

## ✅ Verification

After copying your key, check:

**✅ Correct format:**
```
JWS.eyJraWQiOiJQb3pIX0FDMiIsImFsZyI6IlJTMjU2In0...
```

**❌ Wrong format (Instance Token):**
```
IST.eyJraWQiOiJQb3pIX0FDMiIsImFsZyI6IlJTMjU2In0...
```

**If it starts with `IST.`**, you have the wrong type of token. Go back and follow the steps again, making sure you're in **Account Settings** → **API Keys**, not site-specific settings.

---

## 🔧 Alternative Method: Wix Developers Console

If you can't find API Keys in Account Settings, try:

### Path:
```
https://dev.wix.com/
↓
Click "API Keys" in navigation
↓
Click "Create API Key"
↓
Select "Media Manager" permissions
↓
Copy key (starts with JWS.)
```

### Visual:
```
┌─────────────────────────────────────────────────┐
│  Wix Developers                                 │
│  [Your Apps] [API Keys] [Documentation]         │ ← Click API Keys
│                                                 │
│  [+ Create API Key]                            │ ← Click here
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🚨 Common Issues

### Issue 1: "I don't see API Keys option"

**Possible Causes:**
- Looking at site settings instead of account settings
- Your Wix plan doesn't include API access
- Account doesn't have admin permissions

**Solutions:**
1. Make sure you're at [wix.com/my-account](https://www.wix.com/my-account/), not site dashboard
2. Click your profile/avatar → "Account Settings"
3. Check your Wix plan includes API access
4. Try the Developers Console method instead

### Issue 2: "My key starts with IST, not JWS"

**Cause:** You copied an Instance Token, not an Account API Key

**Solution:**
- Don't use keys from site-specific settings
- Use **Account Settings** → **API Keys** (account-level, not site-level)
- Generate a new key specifically for REST API use

### Issue 3: "API Key creation dialog doesn't show Media Manager"

**Cause:** May need to enable permissions differently

**Solution:**
1. Create key anyway
2. After creation, click on the key to edit permissions
3. Enable "Media Manager" permission
4. Save changes

---

## 📝 Next Steps

Once you have your JWS API key:

1. **Open:** `js/config/wix-config.js`
2. **Find:** `apiKey: 'IST.eyJ...'` (old key)
3. **Replace with:** `apiKey: 'JWS.eyJ...'` (new key)
4. **Save** the file
5. **Hard reload:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
6. **Test:** Save a preset and check console

**Expected console output:**
```console
→ API key prefix: JWS  ← Should be JWS now!
✅ Image uploaded to Wix CDN
✅ Video uploaded to Wix CDN
```

---

## 🔗 Related Guides

- [WIX_API_KEY_TYPES.md](WIX_API_KEY_TYPES.md) - Understand IST vs JWS
- [ENABLE_VIDEO_UPLOADS.md](ENABLE_VIDEO_UPLOADS.md) - Complete setup guide
- [Wix Media Manager API Docs](https://dev.wix.com/docs/api-reference/assets/media/media-manager/introduction)

---

**Good luck getting your API key!** If you follow these steps, you should get a proper JWS-format Account API Key that works with the Media Manager REST API. 🎉
