# Media Manager Implementation Specification

## 📋 User Decisions Summary

Based on your answers:

1. **UI Design:** Modal overlay ✅
2. **Upload Options:** User chooses - Upload to Media Manager OR Local only ✅
3. **File Organization:** Flat (no folders) ✅
4. **File Types:** Images + Videos ✅
5. **Features:** No search/filters (keep simple) ✅
6. **Thumbnails:** Grid with thumbnails ✅

---

## 🎯 Key Feature: Upload Mode Choice

### User Workflow:

When user uploads a file, they see a **choice**:

```
┌─────────────────────────────────────┐
│  Upload Image                       │
├─────────────────────────────────────┤
│  File: my-image.jpg                 │
│                                     │
│  Where should this be saved?        │
│                                     │
│  ○ Media Manager (recommended)      │
│    └─ Permanent CDN URL             │
│    └─ Loads in any preset           │
│    └─ Tiny preset size              │
│                                     │
│  ○ Local only (temporary)           │
│    └─ Not uploaded to cloud         │
│    └─ Only works in this session    │
│    └─ Won't load in saved presets   │
│                                     │
│       [Cancel]  [Upload]            │
└─────────────────────────────────────┘
```

### Technical Implementation:

**Media Manager Mode:**
- File uploads to Wix Media Manager via serverless function
- Returns CDN URL
- Preset saves CDN URL (~80 bytes)
- Loading preset → fetches from CDN ✅

**Local Mode:**
- File stays in browser memory
- Saves as data URL in preset (~266KB)
- Loading preset → data URL embedded ⚠️
- **OR** saves `null` and shows "missing media" warning

---

## 🏗️ Architecture

### Repository Structure

```
Chatooly-EmployerBrandTool/
├── index.html
├── js/
│   ├── ui/
│   │   ├── MediaPickerModal.js      ← UPDATE: Connect to backend
│   │   └── UIManager.js
│   ├── api/
│   │   └── WixPresetAPI.js
│   └── ...
├── css/
│   └── media-picker.css
├── api/                              ← NEW: Vercel serverless functions
│   └── media/
│       ├── list.js                   ← List all media files
│       └── upload.js                 ← Upload file to Media Manager
├── vercel.json                       ← NEW: Vercel configuration
└── .env.example                      ← NEW: Environment variables template
```

### Data Flow

**Browse Flow:**
```
[Browser]
  → Click "Browse Media Manager"
  → MediaPickerModal.fetchFiles()
  → GET /api/media/list

[Vercel Function]
  → Calls Wix API with API Key + Site ID
  → Returns file list with CDN URLs

[Browser]
  → Displays thumbnails in grid
  → User clicks image
  → Loads from CDN URL
  → Saves CDN URL in preset
```

**Upload Flow - Media Manager Mode:**
```
[Browser]
  → User selects file
  → User chooses "Media Manager"
  → POST /api/media/upload with file

[Vercel Function]
  → Uploads to Wix Media Manager
  → Returns CDN URL

[Browser]
  → Loads image from CDN URL
  → Image appears in picker grid
  → Saves CDN URL in preset
```

**Upload Flow - Local Mode:**
```
[Browser]
  → User selects file
  → User chooses "Local only"
  → No API call

[Browser]
  → Creates object URL for display
  → Saves marker: { type: 'local', url: null }
  → Preset save: Skip this media (or warn user)
```

---

## 📁 File-by-File Implementation

### 1. Vercel Serverless Functions

#### `api/media/list.js`
```javascript
/**
 * List all media files from Wix Media Manager
 * GET /api/media/list
 */
import fetch from 'node-fetch';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const API_KEY = process.env.WIX_API_KEY;
        const SITE_ID = process.env.WIX_SITE_ID;

        if (!API_KEY || !SITE_ID) {
            throw new Error('Missing environment variables');
        }

        const response = await fetch(
            'https://www.wixapis.com/site-media/v1/files',
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                    'wix-site-id': SITE_ID
                }
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Wix API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // Filter for images and videos only
        const mediaFiles = (data.files || []).filter(file => {
            const isImage = file.mimeType?.startsWith('image/');
            const isVideo = file.mimeType?.startsWith('video/');
            return isImage || isVideo;
        });

        return res.status(200).json({
            success: true,
            files: mediaFiles,
            count: mediaFiles.length
        });

    } catch (error) {
        console.error('Error fetching media:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
```

#### `api/media/upload.js`
```javascript
/**
 * Upload file to Wix Media Manager
 * POST /api/media/upload (multipart/form-data)
 */
import formidable from 'formidable';
import fetch from 'node-fetch';
import fs from 'fs/promises';

export const config = {
    api: {
        bodyParser: false, // Disable default body parser for file uploads
    },
};

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const API_KEY = process.env.WIX_API_KEY;
        const SITE_ID = process.env.WIX_SITE_ID;

        if (!API_KEY || !SITE_ID) {
            throw new Error('Missing environment variables');
        }

        // Parse multipart form data
        const form = formidable({ multiples: false });
        const [fields, files] = await form.parse(req);

        const uploadedFile = files.file?.[0];
        if (!uploadedFile) {
            return res.status(400).json({
                success: false,
                error: 'No file provided'
            });
        }

        // Read file buffer
        const fileBuffer = await fs.readFile(uploadedFile.filepath);

        // Step 1: Generate upload URL from Wix
        const uploadUrlResponse = await fetch(
            'https://www.wixapis.com/site-media/v1/files/generate-upload-url',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                    'wix-site-id': SITE_ID
                },
                body: JSON.stringify({
                    mimeType: uploadedFile.mimetype,
                    fileName: uploadedFile.originalFilename
                })
            }
        );

        if (!uploadUrlResponse.ok) {
            const errorText = await uploadUrlResponse.text();
            throw new Error(`Generate upload URL failed: ${uploadUrlResponse.status} - ${errorText}`);
        }

        const { uploadUrl, fileId } = await uploadUrlResponse.json();

        // Step 2: Upload file to Wix storage
        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': uploadedFile.mimetype
            },
            body: fileBuffer
        });

        if (!uploadResponse.ok) {
            throw new Error(`File upload failed: ${uploadResponse.status}`);
        }

        // Step 3: Get file details (CDN URL)
        const fileDetailsResponse = await fetch(
            `https://www.wixapis.com/site-media/v1/files/${fileId}`,
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'wix-site-id': SITE_ID
                }
            }
        );

        if (!fileDetailsResponse.ok) {
            throw new Error(`Get file details failed: ${fileDetailsResponse.status}`);
        }

        const fileData = await fileDetailsResponse.json();

        return res.status(200).json({
            success: true,
            file: {
                id: fileData.id,
                fileName: fileData.fileName,
                displayName: fileData.displayName,
                fileUrl: fileData.fileUrl,
                mimeType: fileData.mimeType,
                sizeInBytes: fileData.sizeInBytes,
                width: fileData.width,
                height: fileData.height
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
```

### 2. Vercel Configuration

#### `vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ],
  "env": {
    "WIX_API_KEY": "@wix-api-key",
    "WIX_SITE_ID": "@wix-site-id"
  }
}
```

#### `.env.example`
```bash
# Wix API Configuration
WIX_API_KEY=IST.your-api-key-here
WIX_SITE_ID=your-site-id-here
```

#### `package.json` (Add dependencies)
```json
{
  "dependencies": {
    "node-fetch": "^2.7.0",
    "formidable": "^3.5.1"
  }
}
```

### 3. Frontend Updates

#### Update `js/ui/MediaPickerModal.js`

**Add API configuration:**
```javascript
class MediaPickerModal {
    constructor(wixAPI) {
        this.wixAPI = wixAPI;
        this.files = [];
        this.selectedFile = null;

        // API endpoints (auto-detect based on environment)
        this.apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3000/api'  // Local dev with vercel dev
            : '/api';  // Production Vercel deployment
    }

    async fetchFiles() {
        try {
            console.log('📡 Fetching media files from backend...');
            const response = await fetch(`${this.apiBase}/media/list`);

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            console.log(`✅ Loaded ${data.count} media files`);

            this.files = data.files || [];
            return this.files;

        } catch (error) {
            console.error('❌ Failed to fetch media:', error);
            throw error;
        }
    }

    async uploadFile(file, uploadToMediaManager = true) {
        if (!uploadToMediaManager) {
            // Local mode - create object URL for temporary use
            console.log('📁 Using local file (not uploaded to Media Manager)');
            const objectUrl = URL.createObjectURL(file);

            return {
                fileUrl: objectUrl,
                fileName: file.name,
                mimeType: file.type,
                isLocal: true  // Marker for local-only files
            };
        }

        try {
            console.log('📤 Uploading to Media Manager via backend...');
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${this.apiBase}/media/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Upload failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Upload successful:', data.file.fileUrl);

            return data.file;

        } catch (error) {
            console.error('❌ Upload failed:', error);
            throw error;
        }
    }

    async show() {
        // Fetch files from backend
        await this.fetchFiles();

        const modal = this.createModalHTML();
        document.body.appendChild(modal);
        this.setupEventListeners(modal);

        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    createModalHTML() {
        // Update HTML to include upload button
        return `
            <div class="media-picker-modal">
                <div class="media-picker-overlay"></div>
                <div class="media-picker-content">
                    <div class="media-picker-header">
                        <h2>📁 Browse Media Manager</h2>
                        <button class="media-picker-upload-btn">➕ Upload New</button>
                        <button class="media-picker-close">&times;</button>
                    </div>

                    <div class="media-picker-body">
                        ${this.files.length === 0 ? this.createEmptyState() : this.renderFileGrid()}
                    </div>

                    <div class="media-picker-footer">
                        <button class="media-picker-cancel">Cancel</button>
                    </div>
                </div>

                <!-- Hidden file input -->
                <input type="file" class="media-picker-file-input" accept="image/*,video/*" style="display: none;">
            </div>
        `;
    }

    createEmptyState() {
        return `
            <div class="media-picker-empty">
                <p>📁 No media files yet</p>
                <button class="media-picker-upload-btn-large">Upload Your First File</button>
            </div>
        `;
    }

    renderFileGrid() {
        return `
            <div class="media-picker-grid">
                ${this.files.map(file => this.renderFileItem(file)).join('')}
            </div>
        `;
    }

    renderFileItem(file) {
        const isVideo = file.mimeType?.startsWith('video/');
        const thumbnailUrl = file.fileUrl;
        const sizeKB = (file.sizeInBytes / 1024).toFixed(1);

        return `
            <div class="media-picker-item" data-file-id="${file.id}">
                ${isVideo ?
                    `<video src="${thumbnailUrl}" class="media-picker-thumbnail"></video>` :
                    `<img src="${thumbnailUrl}" alt="${file.displayName}" class="media-picker-thumbnail">`
                }
                <div class="media-picker-item-info">
                    <div class="media-picker-item-name">${file.displayName || file.fileName}</div>
                    <div class="media-picker-item-size">${sizeKB} KB</div>
                </div>
            </div>
        `;
    }

    setupEventListeners(modal) {
        // Close button
        modal.querySelector('.media-picker-close').addEventListener('click', () => {
            this.close();
            this.reject(new Error('User cancelled'));
        });

        // Cancel button
        modal.querySelector('.media-picker-cancel').addEventListener('click', () => {
            this.close();
            this.reject(new Error('User cancelled'));
        });

        // File selection
        modal.querySelectorAll('.media-picker-item').forEach(item => {
            item.addEventListener('click', () => {
                const fileId = item.dataset.fileId;
                const selectedFile = this.files.find(f => f.id === fileId);
                this.close();
                this.resolve(selectedFile);
            });
        });

        // Upload button clicks
        const uploadButtons = modal.querySelectorAll('.media-picker-upload-btn, .media-picker-upload-btn-large');
        uploadButtons.forEach(btn => {
            btn.addEventListener('click', () => this.handleUploadClick(modal));
        });

        // File input change
        const fileInput = modal.querySelector('.media-picker-file-input');
        fileInput.addEventListener('change', (e) => this.handleFileSelected(e, modal));
    }

    handleUploadClick(modal) {
        const fileInput = modal.querySelector('.media-picker-file-input');
        fileInput.click();
    }

    async handleFileSelected(event, modal) {
        const file = event.target.files[0];
        if (!file) return;

        // Show upload mode choice dialog
        const uploadToMediaManager = await this.showUploadModeDialog(file);

        try {
            const uploadedFile = await this.uploadFile(file, uploadToMediaManager);

            // If uploaded to Media Manager, refresh the grid
            if (!uploadedFile.isLocal) {
                await this.fetchFiles();
                this.refreshGrid(modal);
            }

            // Auto-select the uploaded file
            this.close();
            this.resolve(uploadedFile);

        } catch (error) {
            alert(`Upload failed: ${error.message}`);
        }
    }

    async showUploadModeDialog(file) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'upload-mode-dialog';
            dialog.innerHTML = `
                <div class="upload-mode-overlay"></div>
                <div class="upload-mode-content">
                    <h3>Upload: ${file.name}</h3>
                    <p>Where should this file be saved?</p>

                    <label class="upload-mode-option">
                        <input type="radio" name="uploadMode" value="mediaManager" checked>
                        <div>
                            <strong>Media Manager (recommended)</strong>
                            <ul>
                                <li>Permanent CDN URL</li>
                                <li>Loads in any preset</li>
                                <li>Tiny preset size (~80 bytes)</li>
                            </ul>
                        </div>
                    </label>

                    <label class="upload-mode-option">
                        <input type="radio" name="uploadMode" value="local">
                        <div>
                            <strong>Local only (temporary)</strong>
                            <ul>
                                <li>Not uploaded to cloud</li>
                                <li>Only works in this session</li>
                                <li>Won't load in saved presets</li>
                            </ul>
                        </div>
                    </label>

                    <div class="upload-mode-actions">
                        <button class="upload-mode-cancel">Cancel</button>
                        <button class="upload-mode-upload">Upload</button>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);

            dialog.querySelector('.upload-mode-cancel').addEventListener('click', () => {
                dialog.remove();
                resolve(null);
            });

            dialog.querySelector('.upload-mode-upload').addEventListener('click', () => {
                const selected = dialog.querySelector('input[name="uploadMode"]:checked').value;
                dialog.remove();
                resolve(selected === 'mediaManager');
            });
        });
    }

    refreshGrid(modal) {
        const body = modal.querySelector('.media-picker-body');
        body.innerHTML = this.files.length === 0 ? this.createEmptyState() : this.renderFileGrid();

        // Re-attach event listeners for new items
        modal.querySelectorAll('.media-picker-item').forEach(item => {
            item.addEventListener('click', () => {
                const fileId = item.dataset.fileId;
                const selectedFile = this.files.find(f => f.id === fileId);
                this.close();
                this.resolve(selectedFile);
            });
        });
    }

    close() {
        const modal = document.querySelector('.media-picker-modal');
        if (modal) {
            modal.remove();
        }
    }
}
```

#### Update CSS for Upload Mode Dialog

Add to `css/media-picker.css`:

```css
/* Upload Mode Dialog */
.upload-mode-dialog {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
}

.upload-mode-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
}

.upload-mode-content {
    position: relative;
    background: white;
    border-radius: 8px;
    padding: 24px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.upload-mode-content h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
}

.upload-mode-content > p {
    margin: 0 0 20px 0;
    color: #666;
}

.upload-mode-option {
    display: flex;
    gap: 12px;
    padding: 16px;
    border: 2px solid #ddd;
    border-radius: 6px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s;
}

.upload-mode-option:hover {
    border-color: #4CAF50;
    background: #f9fff9;
}

.upload-mode-option input[type="radio"] {
    margin-top: 4px;
}

.upload-mode-option input[type="radio"]:checked + div {
    color: #4CAF50;
}

.upload-mode-option strong {
    display: block;
    margin-bottom: 8px;
}

.upload-mode-option ul {
    margin: 0;
    padding-left: 20px;
    font-size: 13px;
    color: #666;
}

.upload-mode-option ul li {
    margin: 4px 0;
}

.upload-mode-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 20px;
}

.upload-mode-cancel,
.upload-mode-upload {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
}

.upload-mode-cancel {
    background: #f0f0f0;
    color: #333;
}

.upload-mode-cancel:hover {
    background: #e0e0e0;
}

.upload-mode-upload {
    background: #4CAF50;
    color: white;
}

.upload-mode-upload:hover {
    background: #45a049;
}

/* Upload button in picker header */
.media-picker-upload-btn {
    padding: 8px 16px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
}

.media-picker-upload-btn:hover {
    background: #45a049;
}

/* Empty state upload button */
.media-picker-upload-btn-large {
    padding: 12px 24px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    margin-top: 16px;
}

.media-picker-upload-btn-large:hover {
    background: #45a049;
}

.media-picker-empty {
    text-align: center;
    padding: 60px 20px;
    color: #666;
}

.media-picker-empty p {
    font-size: 18px;
    margin-bottom: 20px;
}
```

---

## 🚀 Deployment Steps

### 1. Install Dependencies

```bash
cd Chatooly-EmployerBrandTool
npm init -y  # If no package.json exists
npm install node-fetch@2.7.0 formidable@3.5.1
```

### 2. Create API Directory

```bash
mkdir -p api/media
# Copy the list.js and upload.js files into api/media/
```

### 3. Create Vercel Config

```bash
# Copy vercel.json to root
# Copy .env.example to root
```

### 4. Install Vercel CLI

```bash
npm i -g vercel
```

### 5. Login to Vercel

```bash
vercel login
```

### 6. Set Environment Variables

```bash
vercel env add WIX_API_KEY
# Paste: IST.your-actual-key

vercel env add WIX_SITE_ID
# Paste: edaa8e17-ad18-47e2-8266-179540e1f27b
```

### 7. Test Locally

```bash
vercel dev
# Tool will run on http://localhost:3000
# API endpoints: http://localhost:3000/api/media/list
```

### 8. Deploy to Production

```bash
vercel --prod
```

---

## ✅ Testing Checklist

### Local Testing (vercel dev)
- [ ] Visit http://localhost:3000
- [ ] Click "Browse Media Manager"
- [ ] Verify modal opens with media files
- [ ] Click "Upload New"
- [ ] Select "Media Manager" mode → verify upload works
- [ ] Select "Local only" mode → verify file loads but warns
- [ ] Click image in grid → verify it loads
- [ ] Save preset with Media Manager image → verify tiny JSON
- [ ] Save preset with local image → verify warning or null
- [ ] Load preset with Media Manager image → verify loads correctly

### Production Testing
- [ ] Deploy with `vercel --prod`
- [ ] Visit production URL
- [ ] Repeat all tests above
- [ ] Verify CDN URLs work
- [ ] Verify preset save/load workflow

---

## 📊 Expected Results

### Success Metrics:

**Before (Data URLs):**
- Preset with 2 images: ~360KB
- Upload: CORS errors, falls back to data URL
- Load: Embedded in JSON

**After (CDN URLs):**
- Preset with 2 Media Manager images: ~1.5KB (240x smaller!)
- Upload: Works via backend, returns CDN URL
- Load: Fetches from Wix CDN

**Local Mode:**
- Preset with local image: Warning or null entry
- Load: Shows "missing media" or skips

---

## 🎯 Next Steps After Implementation

1. **Test thoroughly** with local dev server
2. **Deploy to production** when tests pass
3. **Update existing presets** (optional migration)
4. **Document workflow** for users
5. **Consider enhancements:**
   - Folder support
   - Search/filter
   - Bulk upload
   - Delete files

---

This spec gives us everything needed to build the complete system. Ready to start implementing?
