# Implementation Tasks - Multi-Page Preset System v2
**Page-as-Preset Model**

## Sprint Overview

| Sprint | Focus | Duration | Deliverable |
|--------|-------|----------|-------------|
| Sprint 1 | Save Page to Preset | 1 week | Designer can save canvas as page with editable fields |
| Sprint 2 | Load & Edit Pages | 1 week | Designer can load and edit existing pages |
| Sprint 3 | End-User Interface | 1 week | End-user can load preset, fill form, preview pages |
| Sprint 4 | Export System | 1 week | End-user can export all pages as ZIP |

**POC Goal**: Designer creates 3-page preset → End-user fills form → Exports 3 PNGs as ZIP

---

## Sprint 1: Save Page to Preset (Week 1)

### Goal
Designer can save current canvas as a page in a preset (new or existing), marking fields as editable during save.

### Tasks

#### 1.1 Update Wix CMS Collection
- [ ] Open Wix CMS dashboard
- [ ] Update `Presets` collection schema:
  - [ ] Add `page1` (Rich Content, Optional)
  - [ ] Add `page2` (Rich Content, Optional)
  - [ ] Add `page3` (Rich Content, Optional)
  - [ ] Add `page4` (Rich Content, Optional)
  - [ ] Add `page5` (Rich Content, Optional)
  - [ ] Update `presetName` to be required
  - [ ] Add `description` (Text, Optional)
- [ ] Set permissions: Read (Anyone), Write (Admin)
- [ ] Test: Create manual preset with page1 data

**Files**: Wix CMS only
**Time**: 30 minutes

---

#### 1.2 Create PresetPageManager Class
- [ ] Create `js/parameters/PresetPageManager.js`
- [ ] Implement core methods:
  - [ ] `constructor(app)` - Initialize with app reference
  - [ ] `captureCurrentPage()` - Serialize current canvas state
  - [ ] `async savePageToPreset(presetName, pageNumber, editableConfig)` - Save to Wix
  - [ ] `async createNewPreset(presetName, pageData, pageNumber)` - Create preset
  - [ ] `async updatePresetPage(presetId, pageNumber, pageData)` - Update existing
  - [ ] `generatePageId()` - Generate unique page IDs
  - [ ] `generatePageName(pageNumber)` - Generate default names
- [ ] Add validation:
  - [ ] Page number 1-5
  - [ ] JSON size < 60KB
  - [ ] Required fields present
- [ ] Add error handling and console logging

**Files**: `js/parameters/PresetPageManager.js` (NEW, ~300 lines)
**Dependencies**: PresetManager (for serialization logic)
**Time**: 3 hours

---

#### 1.3 Create SavePageModal Component
- [ ] Create `js/ui/SavePageModal.js`
- [ ] Build modal HTML structure:
  - [ ] Canvas preview with overlay
  - [ ] Clickable cells (toggle editable/locked)
  - [ ] Field name inputs for editable cells
  - [ ] Preset selection (new/existing dropdown)
  - [ ] Page position dropdown (1-5)
  - [ ] Save/Cancel buttons
- [ ] Implement interaction logic:
  - [ ] `show()` - Display modal with current canvas
  - [ ] `toggleCellEditable(cellId)` - Mark cell as editable
  - [ ] `collectEditableConfig()` - Gather editable fields data
  - [ ] `onSave()` - Validate and trigger save
  - [ ] `hide()` - Close modal
- [ ] Add visual indicators:
  - [ ] 🔒 icon for locked fields
  - [ ] 🔓 icon for editable fields
  - [ ] Highlight on hover
  - [ ] Error messages for invalid input

**Files**: `js/ui/SavePageModal.js` (NEW, ~400 lines)
**Dependencies**: None
**Time**: 4 hours

---

#### 1.4 Create SavePageModal CSS
- [ ] Create `css/save-page-modal.css`
- [ ] Style modal overlay (dark theme, centered)
- [ ] Style canvas preview area
- [ ] Style cell overlay icons (🔒/🔓)
- [ ] Style field name inputs
- [ ] Style preset/page selectors
- [ ] Style buttons (Save/Cancel)
- [ ] Add hover effects and transitions
- [ ] Ensure responsive design (desktop-first)

**Files**: `css/save-page-modal.css` (NEW, ~200 lines)
**Time**: 2 hours

---

#### 1.5 Update PresetUIComponent
- [ ] Open `js/ui/PresetUIComponent.js`
- [ ] Add "Save Page to Preset" button to Presets tab
- [ ] Initialize SavePageModal
- [ ] Connect button click to modal.show()
- [ ] Handle save event from modal
- [ ] Call PresetPageManager.savePageToPreset()
- [ ] Show success/error notifications
- [ ] Refresh preset list after save

**Files**: `js/ui/PresetUIComponent.js` (MODIFY, ~50 lines added)
**Time**: 1 hour

---

#### 1.6 Update index.html
- [ ] Add `<link rel="stylesheet" href="css/save-page-modal.css">`
- [ ] Add `<script src="js/parameters/PresetPageManager.js"></script>`
- [ ] Add `<script src="js/ui/SavePageModal.js"></script>`
- [ ] Verify load order (after PresetManager, before app.js)

**Files**: `index.html` (MODIFY, 3 lines)
**Time**: 10 minutes

---

#### 1.7 Update app.js
- [ ] Initialize PresetPageManager in app constructor
- [ ] Pass PresetPageManager to PresetUIComponent
- [ ] Add error handling for save operations
- [ ] Add console logging for debugging

**Files**: `js/app.js` (MODIFY, ~20 lines)
**Time**: 30 minutes

---

#### 1.8 Testing
- [ ] Manual testing:
  - [ ] Design canvas with text + images
  - [ ] Click "Save Page to Preset"
  - [ ] Mark 2-3 fields as editable
  - [ ] Enter field names
  - [ ] Create new preset "Test Preset"
  - [ ] Save as Page 1
  - [ ] Verify in Wix CMS (page1 field populated)
- [ ] Edge cases:
  - [ ] Save without editable fields (all locked)
  - [ ] Save with long preset name
  - [ ] Save with special characters in field names
  - [ ] Save to page 5
- [ ] Error scenarios:
  - [ ] Save without preset name
  - [ ] Save without field names for editable cells

**Time**: 2 hours

---

### Sprint 1 Deliverables
✅ Designer can save canvas as page in preset
✅ Editable fields configuration during save
✅ Data stored in Wix CMS (page1-page5 fields)
✅ Basic validation and error handling

**Total Time**: ~13 hours (1.5 days)

---

## Sprint 2: Load & Edit Pages (Week 2)

### Goal
Designer can load existing pages from presets, edit them, and save updates back to the same position.

### Tasks

#### 2.1 Extend PresetPageManager
- [ ] Add `async getAllPresets()` - Query all presets from Wix
- [ ] Add `async getPresetPages(presetId)` - Get all pages for preset
- [ ] Add `async loadPageData(presetId, pageNumber)` - Load specific page
- [ ] Add `formatPresetList()` - Format for dropdown display
- [ ] Add caching for preset list (reduce Wix queries)

**Files**: `js/parameters/PresetPageManager.js` (MODIFY, ~150 lines added)
**Time**: 2 hours

---

#### 2.2 Create LoadPageModal Component
- [ ] Create `js/ui/LoadPageModal.js`
- [ ] Build modal structure:
  - [ ] Preset list (grouped, expandable)
  - [ ] Page list under each preset
  - [ ] Search/filter input
  - [ ] Load/Cancel buttons
- [ ] Implement logic:
  - [ ] `show()` - Display modal with preset list
  - [ ] `async loadPresetList()` - Fetch from PresetPageManager
  - [ ] `renderPresetTree()` - Grouped display
  - [ ] `onPageSelect(presetId, pageNumber)` - Handle selection
  - [ ] `onLoad()` - Trigger load action
- [ ] Add visual feedback:
  - [ ] Loading spinner while fetching
  - [ ] Hover states
  - [ ] Selected page highlight

**Files**: `js/ui/LoadPageModal.js` (NEW, ~350 lines)
**Time**: 4 hours

---

#### 2.3 Create LoadPageModal CSS
- [ ] Create `css/load-page-modal.css`
- [ ] Style modal (similar to SavePageModal)
- [ ] Style preset tree (indented, expandable)
- [ ] Style search input
- [ ] Style load button
- [ ] Add expand/collapse animations

**Files**: `css/load-page-modal.css` (NEW, ~150 lines)
**Time**: 1.5 hours

---

#### 2.4 Implement Page Loading Logic
- [ ] In PresetPageManager:
  - [ ] `async loadPageIntoCanvas(presetId, pageNumber)` - Deserialize and apply
  - [ ] Use existing PresetManager.deserializeState()
  - [ ] Set current preset context (for re-saving)
- [ ] Store loaded page metadata:
  - [ ] Current presetId
  - [ ] Current pageNumber
  - [ ] Original editable config

**Files**: `js/parameters/PresetPageManager.js` (MODIFY, ~100 lines added)
**Time**: 2 hours

---

#### 2.5 Update PresetUIComponent
- [ ] Add "Load Page from Preset" button
- [ ] Initialize LoadPageModal
- [ ] Connect button to modal.show()
- [ ] Handle load event
- [ ] Clear canvas before loading
- [ ] Show success notification
- [ ] Update "Save Page" to show "Update Page" when editing loaded page

**Files**: `js/ui/PresetUIComponent.js` (MODIFY, ~60 lines added)
**Time**: 1.5 hours

---

#### 2.6 Add "Update Page" Functionality
- [ ] In SavePageModal:
  - [ ] Detect if page is loaded (has presetId context)
  - [ ] Change "Save Page" button to "Update Page"
  - [ ] Pre-fill preset selection with current preset
  - [ ] Pre-fill page number with current page
  - [ ] Disable preset/page selection (update in place)
- [ ] In PresetPageManager:
  - [ ] `async updateExistingPage()` - Update page at same position

**Files**: `js/ui/SavePageModal.js`, `js/parameters/PresetPageManager.js` (MODIFY, ~80 lines total)
**Time**: 2 hours

---

#### 2.7 Add "Add to Existing Preset" Workflow
- [ ] In SavePageModal:
  - [ ] Radio buttons: "Create New" vs "Add to Existing"
  - [ ] Show preset dropdown when "Add to Existing" selected
  - [ ] Fetch presets from PresetPageManager
  - [ ] Show occupied page positions (disable in dropdown)
  - [ ] Enable insert/replace logic

**Files**: `js/ui/SavePageModal.js` (MODIFY, ~100 lines added)
**Time**: 2.5 hours

---

#### 2.8 Update index.html & app.js
- [ ] Add LoadPageModal CSS link
- [ ] Add LoadPageModal script tag
- [ ] Initialize LoadPageModal in app.js

**Files**: `index.html`, `js/app.js` (MODIFY, 5 lines total)
**Time**: 10 minutes

---

#### 2.9 Testing
- [ ] Load Page workflow:
  - [ ] Click "Load Page from Preset"
  - [ ] Select preset with multiple pages
  - [ ] Load Page 1
  - [ ] Verify canvas matches saved state
  - [ ] Verify editable config preserved
- [ ] Update Page workflow:
  - [ ] Load Page 1
  - [ ] Modify canvas (change colors, text)
  - [ ] Click "Save Page" (should show "Update Page")
  - [ ] Update page
  - [ ] Reload page, verify changes saved
- [ ] Add to Existing workflow:
  - [ ] Design new canvas
  - [ ] Save as Page 2 to existing preset
  - [ ] Verify page2 field populated in Wix CMS

**Time**: 2 hours

---

### Sprint 2 Deliverables
✅ Designer can load pages from presets
✅ Designer can edit and update existing pages
✅ Designer can add pages to existing presets
✅ Preset/page management UI complete

**Total Time**: ~16 hours (2 days)

---

## Sprint 3: End-User Interface (Week 3)

### Goal
End-user can load a preset, see a form with editable fields, fill the form, and preview all pages.

### Tasks

#### 3.1 Create End-User Route
- [ ] Create `enduser.html` (duplicate index.html structure)
- [ ] Remove designer controls (Grid Builder, Presets tab, etc.)
- [ ] Keep only canvas display area
- [ ] Add form sidebar area
- [ ] Add page navigation area (bottom)
- [ ] Link CSS and JS files

**Files**: `enduser.html` (NEW, ~200 lines)
**Time**: 1.5 hours

---

#### 3.2 Create EndUserController
- [ ] Create `js/enduser/EndUserController.js`
- [ ] Implement:
  - [ ] `constructor(app)` - Initialize
  - [ ] `async loadPresetList()` - Get all presets
  - [ ] `async loadPreset(presetId)` - Load all pages
  - [ ] `extractEditableFields(pages)` - Build field list
  - [ ] `generateForm(fields)` - Create form UI
  - [ ] `applyFormData(formData)` - Update canvas
  - [ ] `switchPage(pageNumber)` - Display different page
- [ ] Store preset and page data in memory

**Files**: `js/enduser/EndUserController.js` (NEW, ~400 lines)
**Time**: 5 hours

---

#### 3.3 Create FormGenerator
- [ ] Create `js/enduser/FormGenerator.js`
- [ ] Generate form elements based on field types:
  - [ ] Text fields → `<input type="text">`
  - [ ] Text cells → `<textarea>`
  - [ ] Image fields → `<input type="file">` with preview
  - [ ] Color fields → `<input type="color">`
- [ ] Group fields by page (expandable sections)
- [ ] Add field labels and descriptions
- [ ] Handle file uploads (convert to data URLs)
- [ ] Real-time validation

**Files**: `js/enduser/FormGenerator.js` (NEW, ~300 lines)
**Time**: 4 hours

---

#### 3.4 Create End-User CSS
- [ ] Create `css/enduser.css`
- [ ] Layout:
  - [ ] Form sidebar (left, 400px wide)
  - [ ] Canvas area (center, flex-grow)
  - [ ] Page navigation (bottom, fixed)
- [ ] Style form elements:
  - [ ] Input fields
  - [ ] Textareas
  - [ ] File upload buttons
  - [ ] Color pickers
  - [ ] Submit button
- [ ] Style page navigation thumbnails
- [ ] Responsive design (collapse sidebar on mobile)

**Files**: `css/enduser.css` (NEW, ~250 lines)
**Time**: 3 hours

---

#### 3.5 Implement Real-Time Preview
- [ ] In EndUserController:
  - [ ] Listen to form input events
  - [ ] On change, update current page data
  - [ ] Re-render canvas with new data
  - [ ] Debounce updates (300ms delay)
- [ ] Handle different field types:
  - [ ] Text: Update text cell content
  - [ ] Image: Load and display uploaded image
  - [ ] Color: Update background or text color

**Files**: `js/enduser/EndUserController.js` (MODIFY, ~150 lines added)
**Time**: 3 hours

---

#### 3.6 Add Page Navigation (Reuse from v1)
- [ ] Copy `js/ui/PageNavigationUI.js` to `js/enduser/`
- [ ] Simplify for end-user (read-only, no editing)
- [ ] Remove "Add Page" button
- [ ] Remove editable page names
- [ ] Keep thumbnail display and click-to-switch
- [ ] Update active page indicator
- [ ] Integrate with EndUserController

**Files**: `js/enduser/PageNavigationUI.js` (COPY + MODIFY, ~200 lines)
**Time**: 2 hours

---

#### 3.7 Create EndUserApp Entry Point
- [ ] Create `js/enduser-app.js`
- [ ] Initialize EndUserController
- [ ] Load preset list on startup
- [ ] Show preset selector modal
- [ ] Handle preset selection
- [ ] Initialize canvas and form
- [ ] Setup page navigation

**Files**: `js/enduser-app.js` (NEW, ~150 lines)
**Time**: 2 hours

---

#### 3.8 Create Preset Selector Modal
- [ ] Show list of available presets
- [ ] Display preset name and page count
- [ ] "Load" button for each preset
- [ ] Handle load action
- [ ] Show loading state

**Files**: Add to `js/enduser/EndUserController.js` (MODIFY, ~100 lines)
**Time**: 1.5 hours

---

#### 3.9 Update enduser.html
- [ ] Link all CSS files
- [ ] Link all JS files (CanvasManager, BackgroundManager, etc.)
- [ ] Link EndUserController and dependencies
- [ ] Link enduser-app.js as entry point
- [ ] Add form sidebar container
- [ ] Add page navigation container

**Files**: `enduser.html` (MODIFY, ~30 lines)
**Time**: 30 minutes

---

#### 3.10 Testing
- [ ] Load preset with 3 pages
- [ ] Verify form shows all editable fields
- [ ] Fill in text fields → See canvas update
- [ ] Upload images → See canvas update
- [ ] Change colors → See canvas update
- [ ] Switch between pages → Verify data preserved
- [ ] Switch back to page 1 → Verify form still filled

**Time**: 2 hours

---

### Sprint 3 Deliverables
✅ End-user can load presets
✅ End-user sees form with editable fields only
✅ Real-time canvas preview
✅ Page navigation working
✅ Form data preserved across page switches

**Total Time**: ~24 hours (3 days)

---

## Sprint 4: Export System (Week 4)

### Goal
End-user can export all pages as PNG/MP4 files in a ZIP archive.

### Tasks

#### 4.1 Create PageExporter Class
- [ ] Create `js/enduser/PageExporter.js`
- [ ] Implement:
  - [ ] `async exportPageAsPNG(pageData)` - Render and capture PNG
  - [ ] `async exportPageAsMP4(pageData, duration)` - Render animation as video
  - [ ] `async exportAllPages(pages)` - Export all pages
  - [ ] `createZIP(files)` - Create ZIP with JSZip
  - [ ] `downloadZIP(zipBlob, filename)` - Trigger download
- [ ] Handle different export formats per page
- [ ] Show progress (1/5, 2/5, etc.)

**Files**: `js/enduser/PageExporter.js` (NEW, ~300 lines)
**Time**: 4 hours

---

#### 4.2 Integrate JSZip Library
- [ ] Add JSZip CDN link to enduser.html:
  ```html
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
  ```
- [ ] Test JSZip basic functionality
- [ ] Create sample ZIP with 2 files

**Files**: `enduser.html` (MODIFY, 1 line)
**Time**: 30 minutes

---

#### 4.3 Implement PNG Export
- [ ] Use `canvas.toDataURL('image/png')`
- [ ] Convert data URL to Blob
- [ ] Add to ZIP with filename: `page-1.png`, `page-2.png`, etc.
- [ ] Handle high resolution (2x, 3x)

**Files**: `js/enduser/PageExporter.js` (MODIFY, ~100 lines)
**Time**: 2 hours

---

#### 4.4 Implement MP4 Export (if time allows)
- [ ] Use existing animation system
- [ ] Render frames at 60 FPS
- [ ] Use MediaRecorder API or CCapture.js
- [ ] Generate MP4 file
- [ ] Add to ZIP with filename: `page-1.mp4`

**Files**: `js/enduser/PageExporter.js` (MODIFY, ~200 lines)
**Time**: 6 hours (OPTIONAL - can be Phase 2)

---

#### 4.5 Add Export Button to UI
- [ ] Add "Export All Pages" button
- [ ] Position: Bottom-right, next to page navigation
- [ ] Style: Large, prominent, primary color
- [ ] Disable while exporting
- [ ] Show progress bar during export

**Files**: `enduser.html`, `css/enduser.css` (MODIFY, ~50 lines total)
**Time**: 1 hour

---

#### 4.6 Create Progress Indicator
- [ ] Show modal during export:
  - [ ] "Exporting pages..."
  - [ ] Progress bar (0-100%)
  - [ ] Current page: "2 / 5"
  - [ ] Status: "Generating Page 2..."
- [ ] Update progress after each page
- [ ] Show completion message
- [ ] Auto-download ZIP when done

**Files**: Add to `js/enduser/PageExporter.js` (MODIFY, ~100 lines)
**Time**: 2 hours

---

#### 4.7 Handle Export Errors
- [ ] Try-catch around each page export
- [ ] If one page fails, continue with others
- [ ] Show error summary at end
- [ ] Allow partial ZIP download

**Files**: `js/enduser/PageExporter.js` (MODIFY, ~80 lines)
**Time**: 1.5 hours

---

#### 4.8 Add Export Settings (Optional)
- [ ] Export settings modal:
  - [ ] Image quality (low, medium, high)
  - [ ] Resolution (1x, 2x, 3x)
  - [ ] File format per page (PNG/MP4)
- [ ] Save settings to localStorage

**Files**: NEW modal component (~200 lines)
**Time**: 3 hours (OPTIONAL)

---

#### 4.9 Testing
- [ ] Export 1-page preset → Verify ZIP contains 1 PNG
- [ ] Export 3-page preset → Verify ZIP contains 3 PNGs
- [ ] Export 5-page preset → Verify all exported
- [ ] Test with different canvas sizes (1080x1080, 1920x1080)
- [ ] Test with animated pages (MP4 export if implemented)
- [ ] Test error handling (fail one page, continue others)
- [ ] Test on different browsers (Chrome, Firefox, Safari)

**Time**: 2 hours

---

### Sprint 4 Deliverables
✅ End-user can export all pages as PNGs
✅ ZIP file created with all pages
✅ Download triggered automatically
✅ Progress indicator during export
✅ (Optional) MP4 export for animated pages

**Total Time**: ~19 hours (2.5 days) without MP4, ~25 hours with MP4

---

## Phase 2 (Future Enhancements)

### Not in POC, but planned:

1. **Global Parameters**
   - Designer links fields across pages
   - End-user fills once, applies to all

2. **Preview Thumbnails**
   - Show page thumbnails in load modal
   - Show thumbnails in end-user navigation

3. **Page Reordering**
   - Drag-and-drop to reorder pages
   - Update page numbers automatically

4. **Advanced Export Options**
   - Custom resolution per page
   - Custom file naming
   - Include metadata file

5. **Preset Templates**
   - Pre-built preset templates
   - Template marketplace

6. **Collaboration**
   - Share presets between designers
   - Comments and feedback system

---

## Testing Checklist

### Sprint 1
- [ ] Save page to new preset
- [ ] Save page to existing preset
- [ ] Mark fields as editable
- [ ] All locked (no editable fields)
- [ ] Verify Wix CMS data

### Sprint 2
- [ ] Load page from preset
- [ ] Edit and update page
- [ ] Add page to existing preset
- [ ] Load preset with 5 pages

### Sprint 3
- [ ] Load preset in end-user mode
- [ ] Fill form fields
- [ ] Real-time preview
- [ ] Switch pages
- [ ] Data preservation

### Sprint 4
- [ ] Export single page
- [ ] Export multi-page preset
- [ ] Download ZIP
- [ ] Verify file contents

---

**Status**: Ready for implementation
**Last Updated**: 2025-10-22
**Version**: 2.0
