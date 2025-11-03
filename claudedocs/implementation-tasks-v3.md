# Implementation Tasks - Content Slots & Flexible Export System v3

**Last Updated**: 2025-01-03
**Architecture**: [content-slots-architecture-v3.md](content-slots-architecture-v3.md)

---

## 📊 Project Overview

**Goal**: Implement multi-page presets with locked layout editing and flexible export system

**Key Features:**
1. Content Slots with automatic bounding box capture
2. Text auto-fit and image crop constraints
3. Per-page and bulk export (image/video)
4. Wix CDN integration for exports
5. Designer and end-user interfaces

---

## 🗓️ Sprint Plan

| Sprint | Focus | Duration | Dependencies |
|--------|-------|----------|--------------|
| Sprint 1 | Content Slots Foundation | 3-4 days | None |
| Sprint 2 | Designer UI | 3-4 days | Sprint 1 |
| Sprint 3 | Wix Backend | 2-3 days | Sprint 2 |
| Sprint 4 | End-User Interface | 4-5 days | Sprint 3 |
| Sprint 5 | Export System | 4-5 days | Sprint 4 |

**Total Estimated Time**: 16-21 days (3-4 weeks)

---

## Sprint 1: Content Slots Foundation (3-4 days)

### 1.1 Create ContentSlotManager Class
**File**: `js/parameters/ContentSlotManager.js`
**Time**: 6 hours

**Tasks:**
- [ ] Create class structure
- [ ] Implement `captureBoundingBox(cell)` - Extract `cell.bounds`
- [ ] Implement `createSlotFromCell(cell, config)` - Build content slot object
- [ ] Implement `buildConstraints(cell, config)` - Generate constraints based on type
- [ ] Implement `extractStyling(cell)` - Extract locked styling
- [ ] Implement `extractContent(cell)` - Get default content
- [ ] Add validation for slot data

**Methods:**
```javascript
class ContentSlotManager {
  captureBoundingBox(cell) { }
  createSlotFromCell(cell, config) { }
  buildConstraints(cell, config) { }
  extractStyling(cell) { }
  extractContent(cell) { }
  validateSlot(slot) { }
}
```

**Testing:**
- [ ] Test with text cells
- [ ] Test with image cells
- [ ] Test bounding box accuracy
- [ ] Test constraint generation

---

### 1.2 Update PresetPageManager
**File**: `js/parameters/PresetPageManager.js`
**Time**: 3 hours

**Tasks:**
- [ ] Add `contentSlots: []` to page data structure
- [ ] Update `captureCurrentPage()` to include contentSlots
- [ ] Add `exportConfig` to page data
- [ ] Update serialization to include new fields
- [ ] Test save/load with contentSlots

**Data Structure Addition:**
```javascript
{
  // ... existing fields
  exportConfig: {
    defaultFormat: "image",
    videoDuration: 5,
    videoFPS: 60,
    imageFormat: "png"
  },
  contentSlots: []
}
```

---

### 1.3 Content Slot Data Types
**File**: `js/parameters/ContentSlotTypes.js` (NEW)
**Time**: 2 hours

**Tasks:**
- [ ] Define ContentSlot class/interface
- [ ] Define TextSlotConstraints type
- [ ] Define ImageSlotConstraints type
- [ ] Define ExportConfig type
- [ ] Add JSDoc type definitions

---

## Sprint 2: Designer UI (3-4 days)

### 2.1 Modify SavePageModal
**File**: `js/ui/SavePageModal.js`
**Time**: 6 hours

**Tasks:**
- [ ] Add "Make Editable" toggle for each cell
- [ ] Show visual indicator for editable cells
- [ ] Open configuration panel when cell marked editable
- [ ] Track which cells are editable
- [ ] Pass editable cells to ContentSlotManager
- [ ] Generate contentSlots array before save

**UI Flow:**
```
1. User clicks cell → Show "Make Editable" button
2. Click "Make Editable" → Open ContentSlotConfigPanel
3. User configures slot → Save to editableCells list
4. On "Save Page" → Generate contentSlots from editableCells
5. Pass to PresetPageManager.saveToNewPreset()
```

---

### 2.2 Create ContentSlotConfigPanel
**File**: `js/ui/ContentSlotConfigPanel.js` (NEW)
**Time**: 8 hours

**Tasks:**
- [ ] Create panel structure
- [ ] Implement text slot configuration form
  - [ ] Field name input
  - [ ] Field label input
  - [ ] Max characters input
  - [ ] Min/max font size inputs
  - [ ] Required checkbox
- [ ] Implement image slot configuration form
  - [ ] Field name input
  - [ ] Field label input
  - [ ] Fit mode radio (cover/free)
  - [ ] Required checkbox
- [ ] Add form validation
- [ ] Return configuration object on save

**Text Config UI:**
```html
<div class="slot-config-panel">
  <h3>Text Slot Configuration</h3>
  <label>Field Name: <input type="text" name="fieldName"></label>
  <label>Field Label: <input type="text" name="fieldLabel"></label>
  <label>Max Characters: <input type="number" name="maxChars" value="100"></label>
  <label>Min Font Size: <input type="number" name="minFont" value="24"></label>
  <label>Max Font Size: <input type="number" name="maxFont" value="48"></label>
  <label><input type="checkbox" name="required"> Required field</label>
  <button class="save-slot-btn">Save Slot</button>
</div>
```

---

### 2.3 Create ExportFormatSelector
**File**: `js/ui/ExportFormatSelector.js` (NEW)
**Time**: 4 hours

**Tasks:**
- [ ] Create format selection UI
- [ ] Radio buttons: Image / Video
- [ ] Video settings (duration, FPS)
- [ ] Default to "image"
- [ ] Return exportConfig object

**UI:**
```html
<div class="export-format-selector">
  <h3>Default Export Format</h3>
  <label><input type="radio" name="format" value="image" checked> Image (PNG)</label>
  <label><input type="radio" name="format" value="video"> Video (MP4)</label>

  <div class="video-settings" style="display:none;">
    <label>Duration: <input type="number" name="duration" value="5"> seconds</label>
    <label>FPS: <input type="number" name="fps" value="60"></label>
  </div>
</div>
```

---

### 2.4 Update SavePageModal CSS
**File**: `css/save-page-modal.css`
**Time**: 2 hours

**Tasks:**
- [ ] Style editable cell indicators
- [ ] Style ContentSlotConfigPanel
- [ ] Style ExportFormatSelector
- [ ] Add hover effects
- [ ] Make responsive

---

## Sprint 3: Wix Backend (2-3 days)

### 3.1 Create Wix CMS Collection
**Platform**: Wix Dashboard
**Time**: 30 minutes

**Tasks:**
- [ ] Create collection: `MultiPagePresets`
- [ ] Add field: `presetName` (Text, Required, Show in list)
- [ ] Add field: `description` (Text, Optional)
- [ ] Add fields: `page1`, `page2`, `page3`, `page4`, `page5` (Rich Text, Optional)
- [ ] Set permissions: Read (Anyone), Write (Admin)
- [ ] Test: Create manual preset entry

---

### 3.2 Create WixMultiPagePresetAdapter
**File**: `js/api/WixMultiPagePresetAdapter.js` (NEW)
**Time**: 6 hours

**Tasks:**
- [ ] Create adapter class
- [ ] Implement `async savePreset(presetName, pageData, pageNumber)`
- [ ] Implement `async getPreset(presetId)`
- [ ] Implement `async getAllPresets()`
- [ ] Implement `async updatePresetPage(presetId, pageNumber, pageData)`
- [ ] Use existing WixPresetAPI for API calls
- [ ] Handle page1-page5 field mapping
- [ ] Add error handling

**Methods:**
```javascript
class WixMultiPagePresetAdapter {
  constructor(wixAPI) {
    this.wixAPI = wixAPI;
    this.collectionName = 'MultiPagePresets';
  }

  async savePreset(presetName, pageData, pageNumber) { }
  async getPreset(presetId) { }
  async getAllPresets() { }
  async updatePresetPage(presetId, pageNumber, pageData) { }
}
```

---

### 3.3 Update PresetPageManager to use Wix
**File**: `js/parameters/PresetPageManager.js`
**Time**: 4 hours

**Tasks:**
- [ ] Replace localStorage methods with Wix adapter calls
- [ ] Update `saveToNewPreset()` to use `wixAdapter.savePreset()`
- [ ] Update `getPresetFromCMS()` to use `wixAdapter.getPreset()`
- [ ] Update `getAllPresetsFromCMS()` to use `wixAdapter.getAllPresets()`
- [ ] Keep localStorage as fallback option
- [ ] Add storage toggle (localStorage vs Wix)
- [ ] Test save/load roundtrip

---

### 3.4 Add Storage Toggle UI
**File**: `js/ui/PresetUIComponent.js`
**Time**: 2 hours

**Tasks:**
- [ ] Add toggle switch: "Storage: Local / Cloud"
- [ ] Connect to PresetPageManager storage mode
- [ ] Save preference to localStorage
- [ ] Show storage status indicator

---

## Sprint 4: End-User Interface (4-5 days)

### 4.1 Create enduser.html
**File**: `enduser.html` (NEW)
**Time**: 3 hours

**Tasks:**
- [ ] Copy structure from index.html
- [ ] Remove designer controls (Grid Builder, Presets tab)
- [ ] Add form sidebar area
- [ ] Add export configuration area
- [ ] Add page navigation
- [ ] Link CSS and JS files
- [ ] Create enduser-specific CSS

---

### 4.2 Create EndUserController
**File**: `js/enduser/EndUserController.js` (NEW)
**Time**: 8 hours

**Tasks:**
- [ ] Create class structure
- [ ] Implement `async loadPreset(presetId)`
- [ ] Implement `extractContentSlots(pages)`
- [ ] Implement `generateForm()`
- [ ] Implement `renderPage(pageIndex)`
- [ ] Implement `handleFormInput(fieldName, value)`
- [ ] Implement `switchPage(pageIndex)`
- [ ] Track user content for all fields
- [ ] Initialize export system

**Methods:**
```javascript
class EndUserController {
  constructor(app) { }
  async loadPreset(presetId) { }
  generateForm() { }
  renderPage(pageIndex) { }
  handleFormInput(fieldName, value) { }
  switchPage(pageIndex) { }
}
```

---

### 4.3 Create FormGenerator
**File**: `js/enduser/FormGenerator.js` (NEW)
**Time**: 6 hours

**Tasks:**
- [ ] Create form generation from contentSlots
- [ ] Generate text inputs with character counters
- [ ] Generate file upload inputs with previews
- [ ] Group fields by page
- [ ] Add real-time validation
- [ ] Emit events on input change
- [ ] Handle required fields

**Form Structure:**
```javascript
generateForm(contentSlots) {
  contentSlots.forEach(slot => {
    if (slot.type === 'text') {
      return this.createTextInput(slot);
    } else if (slot.type === 'image') {
      return this.createFileUpload(slot);
    }
  });
}
```

---

### 4.4 Create ContentSlotRenderer
**File**: `js/enduser/ContentSlotRenderer.js` (NEW)
**Time**: 10 hours

**Tasks:**
- [ ] Create rendering engine for locked layouts
- [ ] Implement `renderTextSlot(slot, content)`
  - [ ] Character limit enforcement
  - [ ] Font auto-fit algorithm
  - [ ] Word wrap
  - [ ] Vertical/horizontal alignment
- [ ] Implement `renderImageSlot(slot, imageURL)`
  - [ ] Cover mode (crop to fill)
  - [ ] Free mode (scale proportionally)
  - [ ] Center positioning
- [ ] Render at fixed `boundingBox` positions
- [ ] No grid controls, no cell manipulation

**Text Auto-Fit Algorithm:**
```javascript
renderTextSlot(slot, text) {
  // Enforce char limit
  if (text.length > slot.constraints.maxCharacters) {
    text = text.substring(0, slot.constraints.maxCharacters);
  }

  // Calculate fitting font size
  let fontSize = slot.constraints.maxFontSize;
  while (fontSize >= slot.constraints.minFontSize) {
    if (textFits(text, fontSize, slot.boundingBox)) {
      break;
    }
    fontSize--;
  }

  // Render
  drawText(text, slot.boundingBox, fontSize, slot.styling);
}
```

**Image Rendering:**
```javascript
renderImageSlot(slot, imageURL) {
  const img = new Image();
  img.src = imageURL;
  img.onload = () => {
    if (slot.constraints.fitMode === 'cover') {
      this.drawImageCover(img, slot.boundingBox);
    } else {
      this.drawImageFree(img, slot.boundingBox);
    }
  };
}
```

---

### 4.5 Create enduser-app.js Entry Point
**File**: `js/enduser-app.js` (NEW)
**Time**: 3 hours

**Tasks:**
- [ ] Initialize EndUserController
- [ ] Show preset selector modal on load
- [ ] Handle preset selection
- [ ] Initialize form and canvas
- [ ] Setup page navigation
- [ ] Connect export system

---

## Sprint 5: Export System (4-5 days)

### 5.1 Create PageExporter Class
**File**: `js/enduser/PageExporter.js` (NEW)
**Time**: 12 hours

**Tasks:**
- [ ] Create class structure
- [ ] Implement `async exportPage(pageIndex, format)`
- [ ] Implement `async exportAsImage(pageIndex, config)`
  - [ ] Render page with user content
  - [ ] Convert canvas to blob
  - [ ] Upload to Wix CDN
  - [ ] Return file info
- [ ] Implement `async exportAsVideo(pageIndex, config)`
  - [ ] Setup MediaRecorder
  - [ ] Capture frames at specified FPS
  - [ ] Play animations for duration
  - [ ] Generate video blob
  - [ ] Upload to Wix CDN
  - [ ] Return file info
- [ ] Implement `async captureVideoFrames(canvas, duration, fps)`
- [ ] Implement `async createZIP(files)`
- [ ] Implement `downloadZIP(zipBlob, fileName)`

**Bulk Export Methods:**
- [ ] Implement `async exportAllAsImages()`
- [ ] Implement `async exportAllAsVideos()`
- [ ] Implement `async exportAllMixed()`

**Integration:**
- [ ] Use WixPresetAPI.uploadMedia() for uploads
- [ ] Use JSZip for ZIP creation
- [ ] Add progress tracking
- [ ] Add error handling

---

### 5.2 Create ExportConfigUI
**File**: `js/enduser/ExportConfigUI.js` (NEW)
**Time**: 6 hours

**Tasks:**
- [ ] Create export configuration UI
- [ ] Per-page format selection (radio: image/video)
- [ ] Video duration/FPS display
- [ ] Individual page export buttons
- [ ] Bulk export buttons
  - [ ] "Export All as Images"
  - [ ] "Export All as Videos"
  - [ ] "Export All (Mixed)"
- [ ] Track export configuration state
- [ ] Emit export events

**UI Structure:**
```javascript
createPageSection(page, index) {
  return `
    <div class="export-page">
      <h4>Page ${page.pageNumber}: ${page.pageName}</h4>
      <label>
        <input type="radio" name="format-${index}" value="image">
        Image (PNG)
      </label>
      <label>
        <input type="radio" name="format-${index}" value="video">
        Video (${page.exportConfig.videoDuration}s)
      </label>
      <button data-index="${index}">Export This Page</button>
    </div>
  `;
}
```

---

### 5.3 Add Progress Indicators
**File**: `js/enduser/ExportProgressUI.js` (NEW)
**Time**: 4 hours

**Tasks:**
- [ ] Create progress modal
- [ ] Show current page being exported
- [ ] Show progress bar (0-100%)
- [ ] Show status messages
- [ ] Handle errors
- [ ] Show completion message

**Progress UI:**
```javascript
showProgress(current, total, status) {
  const percent = (current / total) * 100;
  this.progressBar.style.width = `${percent}%`;
  this.statusText.textContent = status;
  // "Exporting Page 2/5: About Us..."
}
```

---

### 5.4 Integrate JSZip Library
**File**: `enduser.html`
**Time**: 30 minutes

**Tasks:**
- [ ] Add JSZip CDN link:
  ```html
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
  ```
- [ ] Test ZIP creation
- [ ] Test ZIP download

---

### 5.5 Testing Export System
**Time**: 6 hours

**Test Cases:**
- [ ] Export single page as image
- [ ] Export single page as video
- [ ] Export all as images (3 pages)
- [ ] Export all as videos (3 pages)
- [ ] Export mixed (2 images, 1 video)
- [ ] Verify Wix CDN uploads
- [ ] Verify ZIP file contents
- [ ] Test with animations
- [ ] Test with different canvas sizes
- [ ] Test error handling (upload failure)

---

## 🔧 Technical Dependencies

### External Libraries
- ✅ **JSZip** - ZIP file creation (already in use)
- ✅ **MediaRecorder API** - Video capture (browser native)
- ✅ **WixPresetAPI** - Wix CDN uploads (already exists)

### Internal Dependencies
```
ContentSlotManager
  ↓
PresetPageManager → WixMultiPagePresetAdapter → WixPresetAPI
  ↓                        ↓
SavePageModal        EndUserController
  ↓                        ↓
ContentSlotConfigPanel   FormGenerator
                           ↓
                    ContentSlotRenderer
                           ↓
                      PageExporter → ExportConfigUI
```

---

## 📝 Testing Strategy

### Unit Testing
- [ ] ContentSlotManager methods
- [ ] Bounding box capture accuracy
- [ ] Constraint generation
- [ ] Text auto-fit algorithm
- [ ] Image crop/scale algorithms

### Integration Testing
- [ ] Save page with content slots
- [ ] Load page from Wix
- [ ] Form generation from slots
- [ ] Canvas rendering with constraints
- [ ] Export image to Wix CDN
- [ ] Export video to Wix CDN
- [ ] ZIP creation and download

### End-to-End Testing
- [ ] Designer: Create 3-page preset
- [ ] Designer: Configure content slots for all pages
- [ ] Designer: Save to Wix
- [ ] End-user: Load preset
- [ ] End-user: Fill form
- [ ] End-user: Export all as images
- [ ] End-user: Export mixed formats
- [ ] Verify downloaded ZIP contents

---

## 🎯 Success Milestones

### Milestone 1: Content Slots Working (Sprint 1-2)
- ✅ Designer can mark elements editable
- ✅ Bounding boxes auto-captured
- ✅ Content slots saved with page data

### Milestone 2: Wix Integration (Sprint 3)
- ✅ Presets save to Wix CMS
- ✅ Presets load from Wix CMS
- ✅ Full data roundtrip working

### Milestone 3: End-User Interface (Sprint 4)
- ✅ End-user can load presets
- ✅ Form generated from content slots
- ✅ Canvas renders with locked layout
- ✅ Text auto-fits, images crop/scale

### Milestone 4: Export System (Sprint 5)
- ✅ Individual page export (image/video)
- ✅ Bulk export (all formats)
- ✅ Wix CDN uploads working
- ✅ ZIP download working

---

## 📦 Deliverables

### Code Files
- `js/parameters/ContentSlotManager.js`
- `js/parameters/WixMultiPagePresetAdapter.js`
- `js/ui/ContentSlotConfigPanel.js`
- `js/ui/ExportFormatSelector.js`
- `js/enduser/EndUserController.js`
- `js/enduser/FormGenerator.js`
- `js/enduser/ContentSlotRenderer.js`
- `js/enduser/PageExporter.js`
- `js/enduser/ExportConfigUI.js`
- `enduser.html`
- `js/enduser-app.js`

### Documentation
- Content Slots Architecture v3
- Implementation Tasks v3
- API Documentation (WixMultiPagePresetAdapter)
- User Guide (Designer)
- User Guide (End-User)

### Testing
- Unit test suite
- Integration test suite
- E2E test scenarios
- Browser compatibility report

---

**Status**: Ready for Implementation
**Estimated Total Time**: 16-21 days (3-4 weeks)
**Next Step**: Sprint 1 - Content Slots Foundation
