# Development Setup Guide

## 🔌 Port Configuration

| Server | Port | Purpose | Command |
|--------|------|---------|---------|
| **Backend API** | **3001** | Wix Media Manager API proxy | `node dev-server.js` |
| **Frontend (Option 1)** | **3000** | Python HTTP server | `npm run dev` |
| **Frontend (Option 2)** | **5502** | VSCode Live Server | Click "Go Live" in VSCode |

## ✅ Recommended Setup

### Option 1: Use npm run dev (Simple)

**Terminal 1 - Backend API:**
```bash
node dev-server.js
```
Output: `🚀 Development server running on http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
npm run dev
```
Output: `Serving HTTP on 0.0.0.0 port 3000...`

**Open browser:** http://localhost:3000

### Option 2: Use Live Server (For live reload)

**Terminal - Backend API:**
```bash
node dev-server.js
```
Output: `🚀 Development server running on http://localhost:3001`

**VSCode:**
- Right-click `index.html`
- Click "Open with Live Server"
- Automatically opens http://127.0.0.1:5502

## 🔧 How It Works

1. **Frontend** (port 3000 or 5502):
   - Serves HTML, CSS, JS files
   - Runs the canvas app in browser

2. **Backend API** (port 3001):
   - Proxies requests to Wix Media Manager API
   - Handles file uploads
   - Requires `.env` file with Wix credentials

3. **Auto-Detection:**
   - Code automatically detects localhost
   - Connects to `http://localhost:3001/api` for media operations

## 📝 Environment Setup

Create `.env` file in project root:
```env
WIX_API_KEY=your_wix_api_key_here
WIX_SITE_ID=your_site_id_here
```

## 🐛 Troubleshooting

### Problem: "Failed to fetch media"
**Cause:** Backend not running or wrong port
**Fix:**
1. Check backend is running: `curl http://localhost:3001/api/media/list`
2. Restart backend: `node dev-server.js`

### Problem: "Port 3000 already in use"
**Cause:** Another process using port 3000
**Fix:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill

# Or use Live Server on 5502 instead
```

### Problem: "Port 3001 already in use"
**Cause:** Old backend process still running
**Fix:**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill

# Restart backend
node dev-server.js
```

## 🚀 Production

In production (Vercel):
- Frontend and backend API are both served from same domain
- No port conflicts
- API available at `/api/*` routes
- Environment variables configured in Vercel dashboard
