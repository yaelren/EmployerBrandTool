# Content Slots Architecture v3
**Multi-Page Presets with Locked Layout Editing & Flexible Export**

**Last Updated**: 2025-01-03
**Status**: Design Complete - Ready for Implementation

---

## 🎯 Core Concept

**Designer creates flexible layouts → End-users fill content within locked constraints → Export with flexible format options**

### Key Innovations

1. **Content Slots**: Constrained input areas that lock layout while allowing content editing
2. **Auto-Capture Bounds**: Automatically capture `cell.bounds` from rendered grid cells
3. **Flexible Export**: Per-page format selection (image/video) + bulk export options
4. **Wix CDN Integration**: Upload exports to Wix Media Manager for cloud storage

---

## 📊 Complete Data Architecture

### **Page Data Structure (Stored in Wix CMS)**

```javascript
{
  pageName: "Hero Banner",
  pageNumber: 1,

  // ===== EXPORT CONFIGURATION =====
  exportConfig: {
    defaultFormat: "image",  // "image" or "video"
    videoDuration: 5,        // seconds (if video)
    videoFPS: 60,            // frames per second
    imageFormat: "png"       // "png" or "jpg"
  },

  // ===== DESIGNER DATA (for re-editing) =====
  canvas: {
    width: 1080,
    height: 1080,
    padding: { left: 20, right: 20, top: 20, bottom: 20 }
  },

  background: {
    color: "#ffffff",
    imageURL: "wix:image://...",
    gifURL: null,
    videoURL: null,
    fillMode: "cover",
    fitMode: "cover"
  },

  mainText: {
    content: "WELCOME TO OUR COMPANY",
    fontSize: 60,
    fontFamily: "Inter",
    fontWeight: "bold",
    textAlign: "center",
    color: "#000000",
    textTransform: "uppercase"
  },

  grid: {
    rows: 3,
    cols: 3,
    spotSpacing: 10,
    minSpotSize: 50,
    snapshot: {
      // Full grid state with calculated positions
      layout: {
        cells: [
          {
            id: "cell-0",
            contentId: "uuid-123",
            row: 0,
            col: 1,
            bounds: { x: 370, y: 20, width: 340, height: 340 }
          }
        ]
      }
    }
  },

  layers: {
    textCells: [
      {
        cellId: "text-cell-1",
        contentId: "uuid-456",
        type: "text",
        content: {
          text: "Hero Headline",
          fontSize: 48,
          fontFamily: "Inter",
          color: "#333333"
        },
        row: 0,
        col: 1,
        bounds: { x: 370, y: 140, width: 340, height: 80 },
        layerId: "behind-main-text"
      }
    ],
    contentCells: [
      {
        cellId: "content-cell-1",
        contentId: "uuid-789",
        type: "media",
        content: {
          mediaUrl: "wix:image://...",
          mediaType: "image"
        },
        row: 1,
        col: 1,
        bounds: { x: 510, y: 440, width: 200, height: 200 },
        layerId: "behind-main-text"
      }
    ]
  },

  // ===== CONTENT SLOTS (for end-users) =====
  contentSlots: [
    {
      slotId: "text-cell-1-slot",
      sourceElement: "text-cell-1",
      sourceContentId: "uuid-456",
      type: "text",

      // AUTO-CAPTURED from cell.bounds
      boundingBox: {
        x: 370,
        y: 140,
        width: 340,
        height: 80
      },

      // Designer-configured constraints
      constraints: {
        maxCharacters: 50,
        fontSizeMode: "auto-fit",
        minFontSize: 24,
        maxFontSize: 48,
        wordWrap: true,
        verticalAlign: "center",
        horizontalAlign: "center"
      },

      // Locked styling
      styling: {
        fontFamily: "Inter",
        fontWeight: "bold",
        color: "#333333"
      },

      defaultContent: "Hero Headline",

      // Form metadata
      fieldName: "headline",
      fieldLabel: "Hero Headline",
      fieldDescription: "Enter your main headline (max 50 characters)",
      required: true
    },

    {
      slotId: "content-cell-1-slot",
      sourceElement: "content-cell-1",
      sourceContentId: "uuid-789",
      type: "image",

      boundingBox: {
        x: 510,
        y: 440,
        width: 200,
        height: 200
      },

      constraints: {
        fitMode: "cover",  // "cover" or "free"
        focalPoint: "center",
        maxFileSize: 10485760,
        allowedFormats: ["jpg", "png", "webp", "gif"]
      },

      defaultContent: "wix:image://...",

      fieldName: "companyLogo",
      fieldLabel: "Company Logo",
      fieldDescription: "Upload your company logo",
      required: true
    }
  ]
}
```

---

## 🔄 Designer Workflow

### **1. Design Canvas**
- Use Grid Builder to create layout
- Add text cells, image cells, main text
- All cells have `bounds: {x, y, width, height}` calculated automatically

### **2. Save Page to Preset**

**Step 1: Mark Editable Elements**
- Click element → "Make Editable"
- Configure content slot

**Step 2: Configure Content Slots**

**Text Configuration:**
```
┌──────────────────────────────────────┐
│ Text Slot Configuration              │
├──────────────────────────────────────┤
│ Field Name: [headline______________] │
│ Field Label: [Hero Headline________] │
│                                      │
│ Max Characters: [50]                 │
│                                      │
│ Font Size Range (auto-fit):          │
│   Current: 48px                      │
│   Min: [24] px  Max: [72] px         │
│                                      │
│ ☑ Required field                     │
│ [Save Slot]                          │
└──────────────────────────────────────┘
```

**Image Configuration:**
```
┌──────────────────────────────────────┐
│ Image Slot Configuration             │
├──────────────────────────────────────┤
│ Field Name: [companyLogo___________] │
│ Field Label: [Company Logo_________] │
│                                      │
│ Fit Mode:                            │
│ ● Cover (crop to fill)               │
│ ○ Free (scale proportionally)        │
│                                      │
│ ☑ Required field                     │
│ [Save Slot]                          │
└──────────────────────────────────────┘
```

**Step 3: Configure Export Format**
```
┌──────────────────────────────────────┐
│ Page Export Settings                 │
├──────────────────────────────────────┤
│ Default Export Format:               │
│ ● Image (PNG)                        │
│ ○ Video (MP4)                        │
│                                      │
│ Video Settings (if selected):        │
│   Duration: [5] seconds              │
│   FPS: [60]                          │
│                                      │
│ [Save Page]                          │
└──────────────────────────────────────┘
```

### **3. Save to Wix**
System automatically:
1. Captures `cell.bounds` from each marked element
2. Creates ContentSlot with constraints
3. Saves to Wix CMS with:
   - Full grid + layers (for designer)
   - ContentSlots array (for end-user)
   - Export configuration

---

## 👤 End-User Workflow

### **1. Load Preset**
```javascript
EndUserController.loadPreset(presetId)
  → Fetch all pages from Wix
  → Extract contentSlots from each page
  → Generate form
  → Render preview canvas
```

### **2. Fill Form**
```
┌──────────────────────────────────────┐
│ Fill Your Information                │
├──────────────────────────────────────┤
│ Page 1: Hero Banner                  │
│                                      │
│ Hero Headline *                      │
│ [Welcome to ACME Corporation_______] │
│ 28/50 characters                     │
│                                      │
│ Company Logo *                       │
│ [Choose File] acme-logo.png          │
│ [  200×200 preview  ]                │
│                                      │
│ ──────────────────────────────────── │
│                                      │
│ Page 2: About Us                     │
│ ... more fields ...                  │
│                                      │
│ [Preview All Pages]                  │
└──────────────────────────────────────┘
```

### **3. Export Configuration**
```
┌────────────────────────────────────────┐
│ Export Your Pages                      │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ Page 1: Hero Banner                │ │
│ │ Format: ● Image  ○ Video (5s)      │ │
│ │ [Export This Page]                 │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ Page 2: About Us                   │ │
│ │ Format: ○ Image  ● Video (3s)      │ │
│ │ [Export This Page]                 │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ Page 3: Contact                    │ │
│ │ Format: ● Image  ○ Video (4s)      │ │
│ │ [Export This Page]                 │ │
│ └────────────────────────────────────┘ │
│                                        │
├────────────────────────────────────────┤
│ Bulk Export Options:                   │
│                                        │
│ [Export All as Images]                 │
│ [Export All as Videos]                 │
│ [Export All (Mixed Formats)]           │
│                                        │
└────────────────────────────────────────┘
```

### **4. Export Process**

**Flow:**
```
User clicks export
  ↓
Generate files
  ↓
Upload to Wix CDN
  ↓
Get CDN URLs
  ↓
Create ZIP with files
  ↓
Download ZIP
```

**Per-Page Export:**
```javascript
async exportPage(pageIndex, format) {
  // 1. Render page with user content
  renderPageWithUserContent(pageIndex);

  // 2. Generate file based on format
  let blob, fileName;
  if (format === 'image') {
    blob = await generateImageBlob(canvas);
    fileName = `page-${pageIndex + 1}.png`;
  } else {
    blob = await generateVideoBlob(canvas, duration, fps);
    fileName = `page-${pageIndex + 1}.mp4`;
  }

  // 3. Upload to Wix CDN
  const cdnUrl = await wixAPI.uploadMedia(blob, fileName, blob.type);

  // 4. Return file info
  return { fileName, cdnUrl, blob, format };
}
```

**Bulk Export - All as Images:**
```javascript
async exportAllAsImages() {
  const files = [];

  for (let i = 0; i < pages.length; i++) {
    const file = await exportPage(i, 'image');
    files.push(file);
  }

  const zip = await createZIP(files);
  downloadZIP(zip, `${presetName}-images.zip`);
}
```

**Bulk Export - All as Videos:**
```javascript
async exportAllAsVideos() {
  const files = [];

  for (let i = 0; i < pages.length; i++) {
    const file = await exportPage(i, 'video');
    files.push(file);
  }

  const zip = await createZIP(files);
  downloadZIP(zip, `${presetName}-videos.zip`);
}
```

**Bulk Export - Mixed Formats:**
```javascript
async exportAllMixed() {
  const files = [];

  for (let i = 0; i < pages.length; i++) {
    // Use user-selected format or default
    const format = exportConfigs[i].selectedFormat ||
                   pages[i].exportConfig.defaultFormat;
    const file = await exportPage(i, format);
    files.push(file);
  }

  const zip = await createZIP(files);
  downloadZIP(zip, `${presetName}-mixed.zip`);
}
```

---

## 🏗️ Implementation Components

### **New Files to Create**

```
js/
├─ enduser/
│  ├─ EndUserController.js          (NEW) - Orchestrates workflow
│  ├─ FormGenerator.js              (NEW) - Generates form from slots
│  ├─ ContentSlotRenderer.js        (NEW) - Renders with constraints
│  ├─ PageExporter.js               (NEW) - Flexible export system
│  │   ├─ exportPage(index, format)
│  │   ├─ exportAllAsImages()
│  │   ├─ exportAllAsVideos()
│  │   ├─ exportAllMixed()
│  │   ├─ generateImageBlob()
│  │   ├─ generateVideoBlob()
│  │   └─ createZIP()
│  └─ ExportConfigUI.js             (NEW) - Export format selection UI
│
├─ parameters/
│  ├─ ContentSlotManager.js         (NEW) - Slot creation/capture
│  │   ├─ captureBoundingBox(cell)
│  │   ├─ createSlotFromCell(cell, config)
│  │   ├─ buildConstraints(cell, config)
│  │   └─ extractStyling(cell)
│  └─ WixMultiPagePresetAdapter.js  (NEW) - Wix backend adapter
│
├─ ui/
│  ├─ SavePageModal.js              (MODIFY) - Add slot config
│  ├─ ContentSlotConfigPanel.js     (NEW) - Slot configuration UI
│  └─ ExportFormatSelector.js       (NEW) - Export format UI
│
enduser.html                         (NEW) - End-user interface
```

### **Key Classes**

#### **PageExporter**
```javascript
class PageExporter {
  constructor(app, wixAPI) {
    this.app = app;
    this.wixAPI = wixAPI;
    this.pages = [];
    this.userContent = {};
    this.exportConfigs = [];
  }

  // Single page export
  async exportPage(pageIndex, format) {
    const page = this.pages[pageIndex];
    const exportConfig = page.exportConfig;

    // Render page with user content
    await this.renderPageWithUserContent(pageIndex);

    // Generate based on format
    if (format === 'image') {
      return await this.exportAsImage(pageIndex, exportConfig);
    } else {
      return await this.exportAsVideo(pageIndex, exportConfig);
    }
  }

  // Image export
  async exportAsImage(pageIndex, config) {
    const canvas = this.app.canvasManager.canvas;
    const format = config.imageFormat || 'png';

    // Convert canvas to blob
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, `image/${format}`);
    });

    const fileName = `page-${pageIndex + 1}.${format}`;

    // Upload to Wix CDN
    const cdnUrl = await this.wixAPI.uploadMedia(
      blob,
      fileName,
      `image/${format}`
    );

    return { fileName, cdnUrl, blob, format: 'image' };
  }

  // Video export
  async exportAsVideo(pageIndex, config) {
    const canvas = this.app.canvasManager.canvas;
    const duration = config.videoDuration || 5;
    const fps = config.videoFPS || 60;

    // Capture frames using MediaRecorder
    const blob = await this.captureVideoFrames(
      canvas,
      duration,
      fps
    );

    const fileName = `page-${pageIndex + 1}.mp4`;

    // Upload to Wix CDN
    const cdnUrl = await this.wixAPI.uploadMedia(
      blob,
      fileName,
      'video/mp4'
    );

    return { fileName, cdnUrl, blob, format: 'video' };
  }

  // Capture video frames
  async captureVideoFrames(canvas, duration, fps) {
    const stream = canvas.captureStream(fps);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    const chunks = [];

    return new Promise((resolve, reject) => {
      mediaRecorder.ondataavailable = e => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      };
      mediaRecorder.onerror = reject;

      mediaRecorder.start();

      // Play animations for duration
      this.playAnimationsForDuration(duration);

      setTimeout(() => {
        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());
      }, duration * 1000);
    });
  }

  // Bulk exports
  async exportAllAsImages() {
    const files = [];
    for (let i = 0; i < this.pages.length; i++) {
      files.push(await this.exportPage(i, 'image'));
    }
    return await this.createZIP(files, 'images');
  }

  async exportAllAsVideos() {
    const files = [];
    for (let i = 0; i < this.pages.length; i++) {
      files.push(await this.exportPage(i, 'video'));
    }
    return await this.createZIP(files, 'videos');
  }

  async exportAllMixed() {
    const files = [];
    for (let i = 0; i < this.pages.length; i++) {
      const format = this.exportConfigs[i].selectedFormat ||
                     this.pages[i].exportConfig.defaultFormat;
      files.push(await this.exportPage(i, format));
    }
    return await this.createZIP(files, 'mixed');
  }

  // Create ZIP with JSZip
  async createZIP(files, type) {
    const zip = new JSZip();

    files.forEach(file => {
      zip.file(file.fileName, file.blob);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return zipBlob;
  }

  // Download ZIP
  downloadZIP(zipBlob, fileName) {
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

---

## 🔧 Wix CDN Integration

### **Upload Flow**

```javascript
// PageExporter uses WixPresetAPI for uploads
const cdnUrl = await this.wixAPI.uploadMedia(
  blob,           // Image or video blob
  fileName,       // "page-1.png" or "page-1.mp4"
  mimeType        // "image/png" or "video/mp4"
);

// Returns: "https://static.wixstatic.com/media/abc123_page-1.png"
```

### **WixPresetAPI Integration**

The existing `WixPresetAPI` already supports:
- ✅ Image uploads (`uploadMedia()`)
- ✅ Video uploads (`uploadMedia()` with video mimeType)
- ✅ OAuth token management
- ✅ CDN URL generation

**No changes needed to WixPresetAPI!**

---

## 📋 Export UI Components

### **ExportConfigUI.js**

```javascript
class ExportConfigUI {
  constructor(pages) {
    this.pages = pages;
    this.exportConfigs = this.initializeConfigs();
  }

  initializeConfigs() {
    return this.pages.map(page => ({
      pageIndex: page.pageNumber - 1,
      selectedFormat: page.exportConfig.defaultFormat,
      videoDuration: page.exportConfig.videoDuration,
      videoFPS: page.exportConfig.videoFPS
    }));
  }

  render() {
    const container = document.createElement('div');
    container.className = 'export-config-container';

    // Per-page format selection
    this.pages.forEach((page, i) => {
      const pageSection = this.createPageSection(page, i);
      container.appendChild(pageSection);
    });

    // Bulk export buttons
    const bulkSection = this.createBulkSection();
    container.appendChild(bulkSection);

    return container;
  }

  createPageSection(page, index) {
    const section = document.createElement('div');
    section.className = 'export-page-section';
    section.innerHTML = `
      <h4>Page ${page.pageNumber}: ${page.pageName}</h4>
      <div class="format-selector">
        <label>
          <input type="radio" name="format-${index}" value="image"
                 ${this.exportConfigs[index].selectedFormat === 'image' ? 'checked' : ''}>
          Image (PNG)
        </label>
        <label>
          <input type="radio" name="format-${index}" value="video"
                 ${this.exportConfigs[index].selectedFormat === 'video' ? 'checked' : ''}>
          Video (${page.exportConfig.videoDuration}s at ${page.exportConfig.videoFPS} FPS)
        </label>
      </div>
      <button class="export-single-btn" data-index="${index}">
        Export This Page
      </button>
    `;

    return section;
  }

  createBulkSection() {
    const section = document.createElement('div');
    section.className = 'export-bulk-section';
    section.innerHTML = `
      <h3>Bulk Export Options</h3>
      <button class="export-all-images-btn">
        Export All as Images
      </button>
      <button class="export-all-videos-btn">
        Export All as Videos
      </button>
      <button class="export-all-mixed-btn">
        Export All (Mixed Formats)
      </button>
    `;

    return section;
  }
}
```

---

## ✅ Implementation Checklist

### Phase 1: Content Slots Foundation
- [ ] Create `ContentSlotManager.js`
- [ ] Implement bounding box capture from `cell.bounds`
- [ ] Build constraint creation for text/image

### Phase 2: Designer UI
- [ ] Modify `SavePageModal.js` for editable marking
- [ ] Create `ContentSlotConfigPanel.js`
- [ ] Add text configuration (max chars, font range)
- [ ] Add image configuration (fit mode)
- [ ] Add export format selector
- [ ] Update `PresetPageManager` to include contentSlots

### Phase 3: Wix Backend
- [ ] Create Wix CMS collection `MultiPagePresets`
- [ ] Create `WixMultiPagePresetAdapter.js`
- [ ] Connect `PresetPageManager` to Wix backend
- [ ] Test save/load with contentSlots

### Phase 4: End-User Interface
- [ ] Create `enduser.html`
- [ ] Create `EndUserController.js`
- [ ] Create `FormGenerator.js`
- [ ] Create `ContentSlotRenderer.js`
- [ ] Implement text auto-fit algorithm
- [ ] Implement image cover/free rendering

### Phase 5: Export System
- [ ] Create `PageExporter.js`
- [ ] Implement image export with Wix CDN upload
- [ ] Implement video export with MediaRecorder
- [ ] Create `ExportConfigUI.js`
- [ ] Implement bulk export (images/videos/mixed)
- [ ] Implement individual page export
- [ ] Add ZIP creation with JSZip
- [ ] Add progress indicators

---

## 🎯 Success Criteria

**Designer POC:**
- ✅ Save page with auto-captured content slots
- ✅ Configure text constraints (max chars, font range)
- ✅ Configure image fit mode (cover/free)
- ✅ Set default export format per page
- ✅ Load page and continue editing

**End-User POC:**
- ✅ Load preset with locked layout
- ✅ Fill form with all editable fields
- ✅ Preview all pages
- ✅ Select export format per page
- ✅ Export individual page (image or video)
- ✅ Export all as images (bulk)
- ✅ Export all as videos (bulk)
- ✅ Export all mixed formats
- ✅ All files uploaded to Wix CDN
- ✅ Download ZIP with all exports

---

**Status**: Architecture Complete
**Next Step**: Create Wix CMS collection & begin Phase 1 implementation
