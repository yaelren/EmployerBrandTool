# Media Manager Picker - Design Document

## 🎯 Goal

Allow users to select pre-uploaded media from Wix Media Manager instead of uploading during tool usage.

---

## ✨ Benefits

**Solves Current Problems:**
- ✅ No upload authentication issues (IST token 403 errors)
- ✅ No data URL bloat (uses tiny CDN URLs)
- ✅ Videos work perfectly (CDN URLs are small)
- ✅ High-res images work (no size limits)
- ✅ Presets save successfully (under document size limit)

**Additional Benefits:**
- ✅ Organized media library in Wix
- ✅ Reuse assets across multiple presets
- ✅ Better asset management workflow
- ✅ No browser memory issues with large files

---

## 🔄 User Workflow

### Current Broken Flow:
```
1. Click "Upload Image" in tool
2. Select local file
3. Tool tries to upload to Media Manager
4. 403 Error (IST token doesn't work)
5. Falls back to data URL
6. Preset too large → Save fails ❌
```

### New Working Flow:
```
1. [ONE TIME] Upload media to Wix Media Manager via dashboard
2. In tool: Click "Browse Media Manager" button
3. Modal shows list of available files with thumbnails
4. Select file from library
5. Tool uses CDN URL directly (tiny string)
6. Save preset → Success! ✅
```

---

## 🏗️ Architecture

### API Endpoint

**List Files:**
```http
GET https://www.wixapis.com/site-media/v1/files
Authorization: Bearer {OAuth_access_token}
```

**Query Parameters:**
- `parentFolderId` (optional) - Filter by folder

**Response:**
```json
{
  "files": [
    {
      "id": "string",
      "fileUrl": "https://static.wixstatic.com/media/abc123.png",
      "displayName": "my-image.png",
      "mimeType": "image/png",
      "sizeInBytes": 1234567,
      "labels": ["background", "product"],
      "createdDate": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Authentication

**Important:** List Files API requires API Key (IST Token)! 🔑

Like the upload endpoint, the **list/read** endpoint requires admin authentication:
```javascript
headers: {
    'Authorization': `Bearer ${this.apiKey}` // IST token, not OAuth token
}
```

**Why OAuth tokens don't work:**
- OAuth visitor tokens lack Media Manager read permissions
- IST (Instance) tokens have full Media Manager access
- Must use the same API key as for uploads

---

## 🎨 UI Design

### Location 1: Background Media Upload

**Current UI:**
```
[Upload Background Image]
[Clear Background]
```

**New UI:**
```
[Upload Background Image] [Browse Media Manager]
[Clear Background]
```

### Location 2: Cell Media Upload

**Current UI:**
```
[Upload Image/Video]
```

**New UI:**
```
[Upload Image/Video] [Browse Media Manager]
```

### Media Manager Browser Modal

**Layout:**
```
┌─────────────────────────────────────────┐
│  Select Media from Wix Media Manager    │
├─────────────────────────────────────────┤
│  [Search: ____________] [Type: All ▼]   │
├─────────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│  │ 📷  │ │ 📷  │ │ 🎥  │ │ 📷  │       │
│  │ img │ │ bg  │ │ vid │ │ logo│       │
│  │ 1   │ │ 2   │ │ 1   │ │ 3   │       │
│  └─────┘ └─────┘ └─────┘ └─────┘       │
│                                         │
│  [Cancel]              [Select File]    │
└─────────────────────────────────────────┘
```

**Features:**
- Grid of thumbnails (or icons for videos)
- File name and type displayed
- Search/filter by name
- Filter by type (Images/Videos/All)
- Pagination if >20 files
- Selected file highlighted
- Preview on hover (optional)

---

## 🛠️ Implementation Plan

### Phase 1: Add API Method

**File:** `js/api/WixPresetAPI.js`

```javascript
/**
 * List files from Wix Media Manager
 * @param {string} folderId - Optional folder ID to filter by
 * @returns {Promise<Array>} - Array of file objects
 */
async listMediaFiles(folderId = null) {
    try {
        const endpoint = `${this.baseURL}/site-media/v1/files`;
        const url = folderId
            ? `${endpoint}?parentFolderId=${folderId}`
            : endpoint;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to list media files: ${response.status}`);
        }

        const data = await response.json();
        return data.files || [];

    } catch (error) {
        console.error('❌ Failed to list media files:', error);
        throw error;
    }
}
```

### Phase 2: Create Media Picker UI Component

**File:** `js/ui/MediaPickerModal.js` (NEW)

```javascript
export class MediaPickerModal {
    constructor(wixAPI) {
        this.wixAPI = wixAPI;
        this.files = [];
        this.selectedFile = null;
        this.filterType = 'all'; // 'all', 'image', 'video'
        this.searchQuery = '';
    }

    async show() {
        // Fetch files from Wix
        this.files = await this.wixAPI.listMediaFiles();

        // Create modal HTML
        const modal = this.createModalHTML();
        document.body.appendChild(modal);

        // Setup event listeners
        this.setupEventListeners(modal);

        // Return promise that resolves with selected file
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    createModalHTML() {
        const modal = document.createElement('div');
        modal.className = 'media-picker-modal';
        modal.innerHTML = `
            <div class="media-picker-overlay"></div>
            <div class="media-picker-content">
                <div class="media-picker-header">
                    <h2>Select Media from Wix Media Manager</h2>
                    <button class="close-btn">×</button>
                </div>
                <div class="media-picker-filters">
                    <input type="text" class="search-input" placeholder="Search files...">
                    <select class="type-filter">
                        <option value="all">All Files</option>
                        <option value="image">Images Only</option>
                        <option value="video">Videos Only</option>
                    </select>
                </div>
                <div class="media-picker-grid">
                    ${this.renderFileGrid()}
                </div>
                <div class="media-picker-footer">
                    <button class="cancel-btn">Cancel</button>
                    <button class="select-btn" disabled>Select File</button>
                </div>
            </div>
        `;
        return modal;
    }

    renderFileGrid() {
        const filtered = this.getFilteredFiles();

        if (filtered.length === 0) {
            return '<div class="no-files">No files found</div>';
        }

        return filtered.map(file => `
            <div class="media-file-item" data-file-id="${file.id}">
                ${this.renderFileThumbnail(file)}
                <div class="file-name">${file.displayName}</div>
                <div class="file-type">${file.mimeType.split('/')[0]}</div>
            </div>
        `).join('');
    }

    renderFileThumbnail(file) {
        if (file.mimeType.startsWith('image/')) {
            return `<img src="${file.fileUrl}" alt="${file.displayName}">`;
        } else if (file.mimeType.startsWith('video/')) {
            return `<div class="video-icon">🎥</div>`;
        }
        return `<div class="file-icon">📄</div>`;
    }

    getFilteredFiles() {
        return this.files.filter(file => {
            // Filter by type
            if (this.filterType !== 'all') {
                if (!file.mimeType.startsWith(this.filterType)) {
                    return false;
                }
            }

            // Filter by search query
            if (this.searchQuery) {
                return file.displayName.toLowerCase()
                    .includes(this.searchQuery.toLowerCase());
            }

            return true;
        });
    }

    setupEventListeners(modal) {
        // Close button
        modal.querySelector('.close-btn').addEventListener('click', () => {
            this.close(modal);
            this.reject(new Error('User cancelled'));
        });

        // Cancel button
        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            this.close(modal);
            this.reject(new Error('User cancelled'));
        });

        // Select button
        modal.querySelector('.select-btn').addEventListener('click', () => {
            this.close(modal);
            this.resolve(this.selectedFile);
        });

        // File selection
        modal.querySelectorAll('.media-file-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Remove previous selection
                modal.querySelectorAll('.media-file-item').forEach(i =>
                    i.classList.remove('selected'));

                // Add selection
                item.classList.add('selected');

                // Enable select button
                modal.querySelector('.select-btn').disabled = false;

                // Store selected file
                const fileId = item.dataset.fileId;
                this.selectedFile = this.files.find(f => f.id === fileId);
            });
        });

        // Search input
        modal.querySelector('.search-input').addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.refreshGrid(modal);
        });

        // Type filter
        modal.querySelector('.type-filter').addEventListener('change', (e) => {
            this.filterType = e.target.value;
            this.refreshGrid(modal);
        });
    }

    refreshGrid(modal) {
        const grid = modal.querySelector('.media-picker-grid');
        grid.innerHTML = this.renderFileGrid();
        this.setupFileClickHandlers(modal);
    }

    close(modal) {
        modal.remove();
    }
}
```

### Phase 3: Integrate with Existing Upload Buttons

**File:** `js/ui/UIManager.js`

**Add to Grid tab setup:**
```javascript
// Add "Browse Media Manager" button next to background upload
const browseMediaBtn = document.createElement('button');
browseMediaBtn.textContent = '📁 Browse Media Manager';
browseMediaBtn.className = 'browse-media-btn';
browseMediaBtn.addEventListener('click', async () => {
    try {
        const picker = new MediaPickerModal(this.app.wixAPI);
        const selectedFile = await picker.show();

        if (selectedFile) {
            // Use the CDN URL directly
            this.app.setBackgroundMedia(selectedFile.fileUrl, 'image');
        }
    } catch (error) {
        if (error.message !== 'User cancelled') {
            console.error('Failed to select media:', error);
        }
    }
});

// Insert after existing upload button
backgroundMediaElement.parentNode.insertBefore(
    browseMediaBtn,
    backgroundMediaElement.nextSibling
);
```

**For cell media:**
```javascript
// Similar integration in ImageContentController.js
// Add browse button next to cell upload input
```

### Phase 4: Update Save Logic

**File:** `js/parameters/PresetManager.js`

**No changes needed!** Media Manager URLs are already CDN URLs, so they'll be saved as tiny strings automatically.

**Validation:** Just ensure URLs from Media Manager are preserved:
```javascript
// In serializeBackgroundState()
if (bgURL && bgURL.startsWith('https://static.wixstatic.com/')) {
    // This is a Media Manager CDN URL - save it directly
    backgroundData.imageURL = bgURL;
}
```

### Phase 5: Add CSS Styling

**File:** Create `css/media-picker.css` (NEW)

```css
.media-picker-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.media-picker-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
}

.media-picker-content {
    position: relative;
    background: white;
    border-radius: 8px;
    width: 90%;
    max-width: 800px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.media-picker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e0e0e0;
}

.media-picker-header h2 {
    margin: 0;
    font-size: 20px;
}

.close-btn {
    background: none;
    border: none;
    font-size: 30px;
    cursor: pointer;
    color: #666;
}

.media-picker-filters {
    display: flex;
    gap: 10px;
    padding: 15px 20px;
    border-bottom: 1px solid #e0e0e0;
}

.search-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.type-filter {
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.media-picker-grid {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
}

.media-file-item {
    border: 2px solid transparent;
    border-radius: 8px;
    padding: 10px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
}

.media-file-item:hover {
    border-color: #4CAF50;
    background: #f5f5f5;
}

.media-file-item.selected {
    border-color: #4CAF50;
    background: #e8f5e9;
}

.media-file-item img {
    width: 100%;
    height: 120px;
    object-fit: cover;
    border-radius: 4px;
}

.video-icon, .file-icon {
    width: 100%;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    background: #f0f0f0;
    border-radius: 4px;
}

.file-name {
    margin-top: 8px;
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.file-type {
    font-size: 10px;
    color: #666;
    text-transform: uppercase;
}

.media-picker-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 15px 20px;
    border-top: 1px solid #e0e0e0;
}

.cancel-btn, .select-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
}

.cancel-btn {
    background: #f0f0f0;
    color: #333;
}

.select-btn {
    background: #4CAF50;
    color: white;
}

.select-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.no-files {
    grid-column: 1 / -1;
    text-align: center;
    padding: 40px;
    color: #666;
}
```

---

## 🧪 Testing Plan

### Test 1: API Connection
1. Open browser console
2. Click "Browse Media Manager" button
3. Check console for API call and response
4. Verify files list returned

### Test 2: UI Functionality
1. Modal opens with file grid
2. Search filters files correctly
3. Type dropdown filters by image/video
4. Click file to select (highlights)
5. Cancel button closes modal
6. Select button returns file URL

### Test 3: Integration
1. Select Media Manager image
2. Image displays in cell/background
3. Save preset
4. Check console - URL should be tiny CDN string
5. Preset saves successfully (no size error)
6. Load preset - media loads from CDN

### Test 4: Videos
1. Upload video to Wix Media Manager manually
2. Browse Media Manager in tool
3. Select video
4. Video plays in cell
5. Save preset
6. Load preset - video loads and plays ✅

---

## 📊 Expected Results

### Before (Current System):
```
Upload attempt → 403 Error → Data URL fallback (266KB)
→ Document too large error ❌
```

### After (Media Manager Picker):
```
Browse Media Manager → Select file → Use CDN URL (80 bytes)
→ Preset saves successfully ✅
```

**File size comparison:**
- Data URL: `data:image/png;base64,iVBORw0KGg...` (266,000 characters)
- CDN URL: `https://static.wixstatic.com/media/abc123.png` (80 characters)

**Reduction: 99.97% smaller!** 🎉

---

## 🎯 Success Criteria

- [ ] User can browse Wix Media Manager files
- [ ] Modal shows thumbnails/icons for all files
- [ ] Search and filter work correctly
- [ ] Selected media displays in tool
- [ ] CDN URLs are saved (not data URLs)
- [ ] Presets save successfully (no size errors)
- [ ] Videos work end-to-end
- [ ] Multiple images per preset work
- [ ] Media loads correctly on preset restore

---

## 🚀 Rollout Plan

1. **Phase 1:** Implement API method (30 min)
2. **Phase 2:** Create modal UI component (1 hour)
3. **Phase 3:** Add browse buttons (30 min)
4. **Phase 4:** Add CSS styling (30 min)
5. **Phase 5:** Test all scenarios (30 min)

**Total estimated time: 3 hours**

---

## 📝 User Documentation

### For End Users:

**How to Use Media Manager Assets:**

1. **Upload Media to Wix (One-Time Setup):**
   - Go to Wix Dashboard → Media Manager
   - Upload your images and videos
   - Organize into folders (optional)

2. **Use in Tool:**
   - Click "📁 Browse Media Manager" button
   - Select file from your library
   - Media appears in tool immediately
   - Save preset normally

3. **Benefits:**
   - Organize assets in one place
   - Reuse across multiple presets
   - Videos work perfectly
   - Faster preset saves

---

## ✅ Next Steps

Ready to implement? Let me know and I'll start building the Media Manager picker! 🚀
