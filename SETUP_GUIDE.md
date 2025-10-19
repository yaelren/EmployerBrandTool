# Media Manager Setup Guide

## 🎯 What This Does

This tool now integrates with **Wix Media Manager** to let you:
- **Browse** all your pre-uploaded media files
- **Upload** new files to Media Manager
- **Use CDN URLs** instead of bloated data URLs
- **Save tiny presets** (~1.5KB vs 360KB)

---

## 📁 Project Structure

```
Chatooly-EmployerBrandTool/
├── .env                              ← Your Wix API keys (DON'T COMMIT!)
├── .env.example                      ← Template for API keys
├── dev-server.js                     ← Simple API server for local dev
├── package.json                      ← Dependencies
├── api/                              ← Vercel serverless functions (for production)
│   └── media/
│       ├── list.js                   ← List media files
│       └── upload.js                 ← Upload files
├── js/
│   ├── ui/
│   │   └── MediaPickerModal.js      ← Media Manager picker UI
│   └── parameters/
│       └── PresetManager.js         ← CDN URL detection & saving
└── css/
    └── media-picker.css             ← Picker modal styles
```

---

## 🚀 How to Run (Local Development)

### Prerequisites

You need:
- Node.js installed
- Wix API Key (IST token) with Media Manager permissions
- Wix Site ID

### Step 1: Install Dependencies

```bash
npm install
```

This installs:
- `express` - API server
- `cors` - Cross-origin requests
- `dotenv` - Environment variables
- `formidable` - File uploads
- `node-fetch` - HTTP requests

### Step 2: Configure Environment Variables

The `.env` file is already created with your credentials. **Don't commit this file!**

It contains:
```bash
WIX_API_KEY=IST.your-token-here
WIX_SITE_ID=edaa8e17-ad18-47e2-8266-179540e1f27b
```

### Step 3: Start the API Server

```bash
node dev-server.js
```

**You should see:**
```
🚀 Media Manager API Server
   → Running on: http://localhost:3000
   → Endpoints:
      GET  /api/media/list
      POST /api/media/upload

✅ Ready! Use with your Live Server on any port.
```

**Keep this terminal open!**

### Step 4: Start Your Frontend

**Option A: Use Live Server (VS Code)**
- Right-click `index.html` → "Open with Live Server"
- Opens on `http://localhost:5502` (or similar)

**Option B: Use Python**
```bash
python3 -m http.server 8000
```
- Opens on `http://localhost:8000`

**Option C: Open Directly**
- Just open `index.html` in your browser
- File URLs work too!

---

## ✅ How to Use

### 1. Browse Media Manager

1. Click **"📁 Browse Media Manager"** button (in Background Media section)
2. Modal opens showing all your media files from Wix
3. Click an image/video to select it
4. Media loads with CDN URL

### 2. Upload New Files

1. Click **"Browse Media Manager"**
2. Click **"➕ Upload New"** in the modal
3. Choose upload mode:
   - **Media Manager (recommended)**: Uploads to Wix, returns CDN URL, saves in presets
   - **Local only**: Temporary, won't save in presets
4. File uploads and appears in the grid

### 3. Save Presets with CDN URLs

1. Use media from Media Manager
2. Click "Save Preset"
3. Preset JSON is **tiny** (~1.5KB instead of 360KB!)
4. CDN URLs are saved instead of data URLs

### 4. Load Presets

1. Select a preset
2. Click "Load"
3. Media fetches from CDN URLs
4. Everything works seamlessly!

---

## 📊 What Happens Behind the Scenes

### When You Browse:

```
[Browser]
   → Click "Browse Media Manager"
   → MediaPickerModal fetches: http://localhost:3000/api/media/list

[API Server]
   → Calls Wix API with your API Key & Site ID
   → Returns list of files with CDN URLs

[Browser]
   → Shows files in grid
   → You click to select
   → Loads from CDN URL
```

### When You Upload:

```
[Browser]
   → Select file
   → Choose "Media Manager" mode
   → POST to: http://localhost:3000/api/media/upload

[API Server]
   → Uploads file to Wix Media Manager
   → Returns CDN URL

[Browser]
   → File appears in picker
   → CDN URL ready to use
```

### When You Save Preset:

```
[PresetManager]
   → Check if image.src is CDN URL
   → If yes: Save CDN URL directly (tiny!)
   → If no: Upload to Media Manager OR fallback to data URL

[Wix Data Collections]
   → Store preset with CDN URLs
   → Preset size: ~1.5KB (vs ~360KB with data URLs)
```

---

## 🔧 Troubleshooting

### API Server Won't Start

**Error:** `Port 3000 already in use`

**Solution:**
```bash
# Kill whatever's on port 3000
lsof -ti:3000 | xargs kill

# Or use different port (update MediaPickerModal.js)
PORT=3001 node dev-server.js
```

### "Failed to fetch media"

**Check:**
1. Is API server running? (Look for "🚀 Media Manager API Server")
2. Is `.env` file correct?
3. Is your API key valid?
4. Check browser console for CORS errors

**Test manually:**
```bash
curl http://localhost:3000/api/media/list
```

Should return JSON with your files.

### "Upload failed"

**Check:**
1. File type supported? (images/videos only)
2. File size reasonable? (< 10MB recommended)
3. API key has Media Manager permissions?
4. Check API server terminal for error details

### Media Picker Shows Empty

**Possible causes:**
1. No files in Wix Media Manager yet
2. API key doesn't have read permissions
3. Site ID incorrect
4. API server not running

**Upload your first file:**
- Go to Wix Dashboard → Media Manager
- Upload an image manually
- Refresh picker - it should appear!

---

## 🌐 Production Deployment (Vercel)

For production, deploy the serverless functions to Vercel:

### Step 1: Deploy to Vercel

```bash
npx vercel --prod
```

### Step 2: Set Environment Variables

In Vercel dashboard:
- Add `WIX_API_KEY`
- Add `WIX_SITE_ID`

### Step 3: Update MediaPickerModal.js

Change API base for production:
```javascript
if (isLocalhost) {
    this.apiBase = 'http://localhost:3000/api';
} else {
    this.apiBase = '/api';  // Uses Vercel deployment
}
```

### Step 4: Deploy

Your tool on Vercel will have:
- Frontend: `https://your-project.vercel.app`
- API: `https://your-project.vercel.app/api/media/*`

---

## 📝 Quick Reference

### Start Development:
```bash
# Terminal 1: API Server
node dev-server.js

# Terminal 2: Frontend (if using Python)
python3 -m http.server 8000

# Or just use Live Server in VS Code
```

### Stop Everything:
```bash
# Stop API server
pkill -f "node dev-server"

# Stop Python server
pkill -f "http.server"
```

### Check API Status:
```bash
curl http://localhost:3000/api/media/list
```

---

## 💡 Tips

1. **Keep API server running** while you work
2. **Use Media Manager mode** when uploading for permanent CDN URLs
3. **Local mode** is only for temporary testing
4. **Browser console** shows frontend activity
5. **API server terminal** shows backend activity
6. **CDN URLs are permanent** - safe to use in production

---

## 🎯 Summary

**Local Development:**
- API Server: `node dev-server.js` on port 3000
- Frontend: Live Server or any method
- Everything works together seamlessly

**How It Works:**
- Browse → API calls Wix → Shows files
- Upload → API uploads to Wix → Returns CDN URL
- Save → Detects CDN URLs → Saves tiny presets
- Load → Fetches from CDN → Fast loading

**Result:**
- ✅ Tiny preset sizes (240x smaller!)
- ✅ No upload authentication issues
- ✅ Support for videos
- ✅ Permanent, reliable URLs
- ✅ Fast loading from Wix CDN

---

Ready to use! Just run `node dev-server.js` and start creating! 🚀
