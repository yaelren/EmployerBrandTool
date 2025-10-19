# Quick Start Guide - Media Manager Backend

## 🚀 Get Started in 5 Steps

### Step 1: Install Dependencies

```bash
cd /Users/yaelre/Documents/Repos/Chatooly-EmployerBrandTool
npm install
```

This installs:
- `node-fetch@2.7.0` - For API calls
- `formidable@3.5.1` - For file uploads

### Step 2: Create .env File

Copy the example and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your actual credentials:

```bash
# Get these from: js/config/wix-config.js
WIX_API_KEY=IST.eyJraWQiOi... (your full IST token)
WIX_SITE_ID=edaa8e17-ad18-47e2-8266-179540e1f27b
```

### Step 3: Install Vercel CLI (if not installed)

```bash
npm install -g vercel
```

### Step 4: Start Local Dev Server

```bash
vercel dev
```

**What you'll see:**
```
Vercel CLI 28.0.0
Ready! Available at http://localhost:3000

Serverless Functions:
  - api/media/list.js
  - api/media/upload.js
```

### Step 5: Test It!

1. **Open browser:** http://localhost:3000
2. **Click "Browse Media Manager"** button
3. **See your media files** in the grid
4. **Click "Upload New"** to test upload
5. **Select image** → Choose "Media Manager" mode
6. **Watch console** for success messages

---

## ✅ Expected Results

### When You Click "Browse Media Manager":

**Console output:**
```
🔧 MediaPickerModal API base: http://localhost:3000/api
📡 Fetching media files from backend...
✅ Loaded 15 media files from backend
📁 Opening Media Manager picker...
   → Loaded 15 files
```

**What you see:**
- Modal opens with grid of thumbnails
- Your Wix Media Manager files displayed
- File names and sizes shown

### When You Upload a File:

**Console output:**
```
📤 Uploading to Media Manager via backend...
✅ Upload successful: https://static.wixstatic.com/media/...
```

**What you see:**
- Upload dialog shows two options
- After upload, file appears in grid
- File is now in your Wix Media Manager

### When You Save a Preset:

**Console output:**
```
🎯 SAVE: Detected CDN URL - saving directly (no upload needed)
   → CDN URL: https://static.wixstatic.com/media/959e32...
   → URL length: 82 bytes (vs ~266KB for data URL)
💾 Saving preset to Wix...
✅ Preset saved to cloud
```

**Result:**
- Preset JSON is TINY (~1.5KB instead of 360KB!)
- CDN URL saved instead of data URL
- Loading preset fetches from CDN

---

## 🔧 Troubleshooting

### Issue: "Missing environment variables"

**Solution:**
- Make sure `.env` file exists in project root
- Check that `WIX_API_KEY` and `WIX_SITE_ID` are set
- Restart `vercel dev` after creating/editing `.env`

### Issue: "Failed to fetch media"

**Solution:**
- Check your internet connection
- Verify API key is valid (starts with `IST.`)
- Check Site ID matches your Wix site
- Look at terminal output for specific error

### Issue: "Upload failed"

**Solution:**
- Check file type (must be image or video)
- Verify file size isn't too large (< 10MB recommended)
- Check API key has Media Manager permissions
- Look at terminal output for specific error

### Issue: Port 3000 already in use

**Solution:**
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill

# Or use different port
vercel dev --listen 3001
```

---

## 📊 What's Different Now?

### Before (Data URL approach):
```javascript
// Preset JSON - HUGE!
{
  "backgroundMedia": "data:image/png;base64,iVBORw0KGgo... [217,000 characters]"
}
```
- Size: ~360KB for 2 images
- Upload: CORS errors, falls back to data URL
- Loading: Slow (embedded in JSON)

### After (CDN URL approach):
```javascript
// Preset JSON - TINY!
{
  "backgroundMedia": "https://static.wixstatic.com/media/959e32_abc.jpg"
}
```
- Size: ~1.5KB for 2 images (240x smaller!)
- Upload: Works via backend
- Loading: Fast (fetches from CDN)

---

## 🎯 Next Steps

### For Local Development:
1. Keep `vercel dev` running while you work
2. Changes to frontend (HTML/JS/CSS) → refresh browser
3. Changes to backend (api/*.js) → Vercel auto-restarts

### Ready to Deploy to Production:
```bash
# Deploy to Vercel
vercel --prod

# You'll get a URL like:
# https://employer-brand-tool.vercel.app
```

Then your tool works exactly the same online!

---

## 💡 Tips

- **Keep `vercel dev` terminal open** to see backend logs
- **Browser console** shows frontend activity
- **Terminal** shows backend API calls
- **Upload "Media Manager" mode** for permanent CDN URLs
- **Upload "Local only" mode** for temporary testing

---

## 🚨 Common Mistakes

❌ **Forgot to create .env file**
✅ Copy .env.example → .env and fill in values

❌ **Used wrong API endpoint**
✅ MediaPickerModal auto-detects (localhost:3000/api)

❌ **Uploaded without choosing mode**
✅ Dialog always asks: Media Manager or Local?

❌ **Expected old "Browse" button to work**
✅ Old browse button still has CORS issues - use new picker!

---

## 📝 File Structure

```
Chatooly-EmployerBrandTool/
├── .env                              ← YOUR API KEYS (don't commit!)
├── .env.example                      ← Template
├── api/
│   └── media/
│       ├── list.js                   ← Backend: List files
│       └── upload.js                 ← Backend: Upload files
├── js/ui/
│   └── MediaPickerModal.js           ← Frontend: Updated for backend
├── css/
│   └── media-picker.css              ← Styles with upload dialog
└── package.json                      ← Dependencies added

Ready to test! 🚀
```

---

Need help? Check the terminal output and browser console for detailed error messages!
