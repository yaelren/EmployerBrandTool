# Dual Save System - Local & Cloud Presets

Complete implementation of dual preset save functionality with local file download and cloud storage options.

## 🎯 Overview

The preset system now offers TWO independent save methods:

1. **📁 Save Locally** - Downloads preset as JSON file to your computer
2. **☁️ Save to Cloud** - Saves to localStorage/Wix (existing cloud functionality)

Both systems work completely independently without interference.

---

## 💾 Save Locally

### How It Works

**Button:** "📁 Save Locally" (secondary button, gray)

**Process:**
1. Enter preset name
2. Click "📁 Save Locally"
3. JSON file downloads to your Downloads folder
4. Filename format: `preset_name.json` (sanitized)

**What's Saved:**
- Complete preset configuration
- Canvas settings (size, background, padding)
- Main text content and styling
- Full grid layout with all cells
- Layer assignments and stats
- **Images as data URLs** (base64 encoded, embedded in JSON)

**Benefits:**
- ✅ Complete offline backup
- ✅ Share presets via file transfer
- ✅ No browser storage limits
- ✅ All data in one portable file
- ✅ Works without internet connection

**Limitations:**
- ⚠️ Large file sizes (~320KB per preset with images)
- ⚠️ Manual file management required
- ⚠️ Videos still cannot be saved (Phase I limitation)

### Code Implementation

**File:** [js/ui/PresetUIComponent.js](js/ui/PresetUIComponent.js#L353-L403)

```javascript
async handleSaveLocally() {
    // Serialize state (without uploading images to cloud)
    const state = this.presetManager.serializeState(presetName);

    // Create JSON blob
    const jsonString = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${presetName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;

    // Trigger download
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
```

---

## 📂 Load Local Preset

### How It Works

**Button:** "📂 Choose File" (secondary button, gray)

**Process:**
1. Click "📂 Choose File"
2. Select JSON file from your computer
3. File name displays next to button
4. Preset loads automatically
5. Success notification appears

**What's Loaded:**
- All canvas settings restored
- Main text and styling applied
- Grid layout rebuilt
- Layers reassigned
- Images decoded from data URLs and displayed

**Benefits:**
- ✅ Restore from downloaded backups
- ✅ Import presets from other users
- ✅ No cloud dependency
- ✅ Fast local loading

### Code Implementation

**File:** [js/ui/PresetUIComponent.js](js/ui/PresetUIComponent.js#L405-L443)

```javascript
async handleLoadFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Show selected file name
    const fileNameSpan = document.getElementById('selectedFileName');
    if (fileNameSpan) {
        fileNameSpan.textContent = file.name;
    }

    // Read file
    const text = await file.text();
    const stateData = JSON.parse(text);

    // Deserialize state
    this.presetManager.deserializeState(stateData);

    this.showSuccess(`✅ Preset "${stateData.presetName || file.name}" loaded successfully!`);
}
```

---

## ☁️ Save to Cloud

### How It Works

**Button:** "☁️ Save to Cloud" (primary button, blue)

**Process:**
1. Enter preset name
2. Click "☁️ Save to Cloud" OR press Enter
3. Images uploaded (currently as data URLs to localStorage)
4. Preset saved to localStorage/Wix
5. Appears in cloud preset dropdown

**What's Saved:**
- Same as local save
- Images stored as data URLs in localStorage (temporary)
- **Future:** Images will upload to Wix CDN

**Benefits:**
- ✅ Centralized storage
- ✅ Access from dropdown
- ✅ Easy management (Load/Delete/Refresh)
- ✅ **Future:** Cross-device sync with Wix

**Limitations:**
- ⚠️ localStorage quota limit (~5-10MB)
- ⚠️ Currently browser-only (no cross-device)
- ⚠️ Large presets may hit storage limits

**Migration Path:**
- Current: localStorage fallback with data URLs
- Future: Wix REST API with CDN image uploads

---

## 📥 Load from Cloud

### How It Works

**Dropdown:** "-- Select Preset --"

**Process:**
1. Select preset from dropdown
2. Click "📥 Load" button
3. Preset loads from localStorage
4. Success notification appears

**Additional Actions:**
- **🗑️ Delete** - Removes preset from cloud
- **🔄 Refresh** - Reloads dropdown list

---

## 🎨 UI Design

### Save Section
```
💾 Save New Preset
Save your current design locally or to the cloud

[Enter preset name...]

[📁 Save Locally]  [☁️ Save to Cloud]
```

### Load Local Section
```
📂 Load Local Preset
Upload a preset file from your computer

[📂 Choose File] filename.json
```

### Load Cloud Section
```
📥 Load Preset
Select a preset from your cloud library

[-- Select Preset -- ▼]

[📥 Load] [🗑️ Delete] [🔄 Refresh]
```

---

## 🔧 Technical Details

### File Format

**Local JSON Structure:**
```json
{
  "presetName": "Test Local Download",
  "createdAt": "2025-10-16T12:22:07.471Z",
  "version": "1.0",
  "canvas": {
    "width": 1080,
    "height": 1350,
    "backgroundColor": "#ffffff",
    "padding": { "left": 20, "right": 20, "top": 20, "bottom": 20 }
  },
  "background": {
    "color": "#ffffff",
    "imageURL": "data:image/png;base64,iVBORw0KGgo...",
    "fitMode": "fill-canvas"
  },
  "mainText": {
    "content": "EMPLOYEE\nSPOTLIGHT\n2024",
    "fontSize": 100,
    "color": "#000000"
  },
  "grid": {
    "rows": 5,
    "cols": 3,
    "snapshot": { /* full grid data */ }
  },
  "layers": { /* layer assignments */ }
}
```

### Data URL Sizes

**Typical Image Sizes:**
- Small icon (50x50): ~200-500 bytes (base64)
- Background (1920x1080): ~217KB (base64)
- Cell image (232x232): ~103KB (base64)
- **Total per preset:** ~320KB with images

**localStorage Limits:**
- Chrome: ~10MB
- Firefox: ~10MB
- Safari: ~5MB
- Edge: ~10MB

**Recommended Usage:**
- Keep 5-10 presets max in localStorage
- Use local file download for archival/backup
- Delete old cloud presets regularly

---

## 🧪 Testing Results

### ✅ Save Locally
- [x] File downloads to Downloads folder
- [x] Filename sanitized correctly (`test_local_download.json`)
- [x] JSON formatted with proper indentation
- [x] All preset data included
- [x] Images embedded as data URLs
- [x] Success notification displays
- [x] Input field clears after save

### ✅ Load Local Preset
- [x] File picker accepts .json files
- [x] Selected filename displays
- [x] JSON parses correctly
- [x] Preset deserializes successfully
- [x] Canvas restores correctly
- [x] Text displays: "EMPLOYEE SPOTLIGHT 2024"
- [x] Grid layout accurate
- [x] Success notification displays

### ✅ Save to Cloud
- [x] Saves to localStorage
- [x] Appears in dropdown
- [x] Images stored as data URLs
- [x] Success notification displays

### ✅ Load from Cloud
- [x] Dropdown populated correctly
- [x] Preset loads successfully
- [x] Images restore correctly
- [x] Success notification displays

---

## 🚀 Usage Examples

### Scenario 1: Daily Work with Cloud
```
1. Design your layout
2. Click "☁️ Save to Cloud"
3. Access from dropdown anytime
4. Quick load/delete/refresh
```

### Scenario 2: Backup Important Designs
```
1. Create your masterpiece
2. Click "📁 Save Locally"
3. File saved to Downloads
4. Keep as permanent backup
```

### Scenario 3: Share with Team
```
1. Save locally to get JSON file
2. Email/Slack file to teammate
3. They click "📂 Choose File"
4. Upload your preset
5. Exact same design restored
```

### Scenario 4: Avoid Storage Limits
```
1. localStorage getting full
2. Download important presets locally
3. Delete from cloud
4. Upload later when needed
```

---

## 📊 Comparison: Local vs Cloud

| Feature | Local File | Cloud Storage |
|---------|-----------|---------------|
| **Storage** | Unlimited (your disk) | ~5-10MB (localStorage) |
| **Sharing** | Easy (send file) | Not yet (future Wix) |
| **Backup** | Manual download | Automatic |
| **Access** | Need file | From dropdown |
| **Speed** | Very fast | Fast |
| **Management** | File system | UI buttons |
| **Offline** | Yes | Yes (localStorage) |
| **Cross-device** | Manual transfer | Future (Wix API) |

---

## 🛠️ Future Enhancements

### Phase II: Wix REST API Integration

**When implemented:**
- ☁️ Cloud saves will upload to Wix Data Collections
- 📤 Images will upload to Wix Media Manager (CDN)
- 🌐 Cross-device sync across all devices
- 🔄 No localStorage limits
- 🚀 Better performance

**Current Code:**
Already prepared in [js/api/WixPresetAPI.js](js/api/WixPresetAPI.js)
- `uploadImage()` - Ready for Wix CDN
- `savePreset()` - Ready for Wix Data Collections
- OAuth placeholders in place

**Migration Path:**
1. Implement proper OAuth flow
2. Replace localStorage with Wix REST API calls
3. Upload images to Wix Media Manager
4. Update data URLs to CDN URLs
5. Seamless transition for users

---

## 📝 Notes

- **Videos:** Cannot be saved in either system (Phase I limitation)
- **Images:** Embedded as data URLs in local files, same in localStorage
- **Compatibility:** Both systems use same JSON structure
- **Independence:** Local and cloud saves don't interfere
- **Default Action:** Enter key saves to cloud (primary action)
- **File Input:** Clears after each upload for security

---

## 🔗 Related Documentation

- [BUGFIX_BACKGROUND_IMAGE.md](BUGFIX_BACKGROUND_IMAGE.md) - Background image render fix
- [STORAGE_QUOTA_FIX.md](STORAGE_QUOTA_FIX.md) - localStorage quota handling
- [PRESET_IMAGE_LOGGING.md](PRESET_IMAGE_LOGGING.md) - Image save/load logging guide
- [js/api/WixPresetAPI.js](js/api/WixPresetAPI.js) - Wix API wrapper (future implementation)
- [js/parameters/PresetManager.js](js/parameters/PresetManager.js) - Core preset serialization

---

## ✅ Commit

**Commit:** f9bc440 - feat: Add dual save system with local file download and upload

**Changes:**
- Added `handleSaveLocally()` method (downloads JSON)
- Added `handleLoadFromFile()` method (uploads JSON)
- Updated UI with dual save buttons
- Added file upload section
- Updated event listeners for all new buttons
- Tested and verified all functionality

**Testing:**
- Saved preset locally: `test_local_download.json`
- Verified JSON structure and content
- Loaded preset from file
- Confirmed canvas restored correctly
- Verified "EMPLOYEE SPOTLIGHT 2024" text display
