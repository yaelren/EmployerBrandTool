# Implementation Tasks - Multi-Page Preset System v2
**Page-as-Preset Model**

**Last Updated**: 2025-10-23
**Current Status**: Sprint 2 In Progress (70% complete)

## Sprint Overview

| Sprint | Focus | Duration | Status | Completion |
|--------|-------|----------|--------|------------|
| Sprint 1 | Save Page to Preset | 1 week | ✅ **COMPLETED** | 100% |
| Sprint 2 | Load & Edit Pages | 1 week | 🚧 **IN PROGRESS** | 70% |
| Sprint 3 | End-User Interface | 1 week | ⏳ Not Started | 0% |
| Sprint 4 | Export System | 1 week | ⏳ Not Started | 0% |

**POC Goal**: Designer creates 3-page preset → End-user fills form → Exports 3 PNGs as ZIP

---

## 🐛 Bug Fixes & Improvements (Post-Sprint 1)

### Completed Fixes
- ✅ **Complete State Preservation** (commit 4b79a68)
  - Fixed: PresetPageManager was reconstructing state instead of using serializeState() directly
  - Impact: All font properties, margins, alignments now preserve correctly
  - Lost properties restored: fontStyle, underline, highlight, lineSpacing, marginVertical/Horizontal, alignH/V, lineAlignments

- ✅ **Image Loading Fix** (commit 36f69fe)
  - Fixed: Property name mismatch (imageURL/videoURL vs mediaUrl)
  - Impact: Images now load correctly after page load

- ✅ **Page Naming Auto-Update** (commit cc6078c)
  - Fixed: Hardcoded "Page 1" value in SavePageModal
  - Impact: Page names now auto-update when selecting different positions

- ✅ **Modal UI State Reset** (commit ca16a47)
  - Fixed: LoadPageModal showing stale page list on reopen
  - Impact: Clean state when modal reopens

---

## 📋 Testing Status

### ✅ Tested & Working
- [x] Save page to new preset
- [x] Complete canvas state preservation (fonts, images, styles, grid)
- [x] Page naming with auto-update
- [x] Image loading with mediaUrl
- [x] Load page from preset
- [x] Modal UI state management
- [x] Multiple presets support

### 🧪 Needs Testing
- [ ] Save multiple pages (3-5) to single preset
- [ ] Load preset with 5 pages
- [ ] Edge case: Very large images
- [ ] Edge case: Complex grid layouts (5x5+)
- [ ] Edge case: Long text content with line alignments
- [ ] Browser compatibility (Chrome, Firefox, Safari)

---

## Sprint 1: Save Page to Preset (Week 1) ✅ COMPLETED

### Goal
Designer can save current canvas as a page in a preset (new or existing), marking fields as editable during save.

### Tasks

#### 1.1 Update Wix CMS Collection ✅
- [x] Open Wix CMS dashboard
- [x] Update `Presets` collection schema:
  - [x] Add `page1` (Rich Content, Optional)
  - [x] Add `page2` (Rich Content, Optional)
  - [x] Add `page3` (Rich Content, Optional)
  - [x] Add `page4` (Rich Content, Optional)
  - [x] Add `page5` (Rich Content, Optional)
  - [x] Update `presetName` to be required
  - [x] Add `description` (Text, Optional)
- [x] Set permissions: Read (Anyone), Write (Admin)
- [x] Test: Create manual preset with page1 data

**Files**: Wix CMS only
**Status**: ✅ Using localStorage for POC

---

#### 1.2 Create PresetPageManager Class ✅
- [x] Create `js/parameters/PresetPageManager.js`
- [x] Implement core methods:
  - [x] `constructor(app)` - Initialize with app reference
  - [x] `captureCurrentPage()` - Serialize current canvas state (FIXED: Now uses serializeState() directly)
  - [x] `async savePageToPreset(presetName, pageNumber, editableConfig)` - Save to localStorage
  - [x] `async createNewPreset(presetName, pageData, pageNumber)` - Create preset
  - [x] `async updatePresetPage(presetId, pageNumber, pageData)` - Update existing
  - [x] `generatePageId()` - Generate unique page IDs
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

#### 1.3 Create SavePageModal Component ✅
- [x] Create `js/ui/SavePageModal.js`
- [x] Build modal HTML structure:
  - [x] Preset name input (simplified - no canvas preview in POC)
  - [x] Page position dropdown (1-5) with auto-update
  - [x] Page name input
  - [x] Save/Cancel buttons
- [x] Implement interaction logic:
  - [x] `show()` - Display modal
  - [x] `collectEditableConfig()` - Gather editable fields data
  - [x] `onSave()` - Validate and trigger save
  - [x] `hide()` - Close modal

**Files**: `js/ui/SavePageModal.js` (NEW, ~250 lines)
**Status**: ✅ Simplified for POC - editable fields deferred to Sprint 3

---

#### 1.4 Create SavePageModal CSS ✅
- [x] Create `css/save-page-modal.css`
- [x] Style modal overlay (dark theme, centered)
- [x] Style preset/page selectors
- [x] Style buttons (Save/Cancel)
- [x] Add hover effects and transitions

**Files**: `css/save-page-modal.css` (NEW, ~150 lines)
**Status**: ✅ Complete

---

#### 1.5 Update PresetUIComponent ✅
- [x] Open `js/ui/PresetUIComponent.js`
- [x] Add "Save Page to Preset" button to Presets tab
- [x] Initialize SavePageModal
- [x] Connect button click to modal.show()
- [x] Handle save event from modal
- [x] Call PresetPageManager.savePageToPreset()
- [x] Show success/error notifications

**Files**: `js/ui/PresetUIComponent.js` (MODIFY, ~50 lines added)
**Status**: ✅ Complete

---

#### 1.6 Update index.html ✅
- [x] Add `<link rel="stylesheet" href="css/save-page-modal.css">`
- [x] Add `<script src="js/parameters/PresetPageManager.js"></script>`
- [x] Add `<script src="js/ui/SavePageModal.js"></script>`
- [x] Verify load order

**Files**: `index.html` (MODIFY, 3 lines)
**Status**: ✅ Complete

---

#### 1.7 Update app.js ✅
- [x] Initialize PresetPageManager in app constructor
- [x] Pass PresetPageManager to PresetUIComponent
- [x] Add error handling for save operations
- [x] Add console logging for debugging

**Files**: `js/app.js` (MODIFY, ~20 lines)
**Status**: ✅ Complete

---

#### 1.8 Testing ✅
- [x] Manual testing:
  - [x] Design canvas with text + images
  - [x] Click "Save Page to Preset"
  - [x] Create new preset "Test Preset"
  - [x] Save as Page 1
  - [x] Verify in localStorage
  - [x] Complete state preservation (fonts, images, grid)
- [x] Edge cases:
  - [x] Save with different font styles
  - [x] Save with images
  - [x] Save to different page positions
- [x] Bug fixes:
  - [x] Fixed page naming auto-update
  - [x] Fixed complete state preservation
  - [x] Fixed image loading

**Status**: ✅ Tested and working

---

### Sprint 1 Deliverables ✅
✅ Designer can save canvas as page in preset
✅ Complete canvas state preserved (all properties)
✅ Data stored in localStorage (POC)
✅ Page naming with auto-update
✅ Multiple pages per preset support

**Total Time**: ~13 hours + 4 hours bug fixes = 17 hours

---

## Sprint 2: Load & Edit Pages (Week 2) 🚧 IN PROGRESS (70%)

### Goal
Designer can load existing pages from presets, edit them, and save updates back to the same position.

### Tasks

#### 2.1 Extend PresetPageManager ✅
- [x] Add `async getAllPresets()` - Query all presets from localStorage
- [x] Add `async getPresetPages(presetId)` - Get all pages for preset
- [x] Add `async loadPageData(presetId, pageNumber)` - Load specific page
- [x] Add `formatPresetList()` - Format for dropdown display
- [x] Add `applyPageToCanvas()` - Apply page using deserializeState()

**Files**: `js/parameters/PresetPageManager.js` (MODIFY, ~150 lines added)
**Status**: ✅ Complete

---

#### 2.2 Create LoadPageModal Component ✅
- [x] Create `js/ui/LoadPageModal.js`
- [x] Build modal structure:
  - [x] Preset dropdown selector
  - [x] Page list grid (cards)
  - [x] Load/Cancel buttons
- [x] Implement logic:
  - [x] `show()` - Display modal with preset list
  - [x] `async loadPresets()` - Fetch from PresetPageManager
  - [x] `handlePresetSelection()` - Load pages for selected preset
  - [x] `renderPages()` - Display page cards
  - [x] `loadPage()` - Trigger load action
- [x] Add visual feedback:
  - [x] Hover states
  - [x] Page cards with metadata

**Files**: `js/ui/LoadPageModal.js` (NEW, ~250 lines)
**Status**: ✅ Complete + bug fix (modal UI reset)

---

#### 2.3 Create LoadPageModal CSS ✅
- [x] Create `css/load-page-modal.css`
- [x] Style modal (similar to SavePageModal)
- [x] Style preset dropdown
- [x] Style page cards grid
- [x] Style load button
- [x] Add hover effects

**Files**: `css/load-page-modal.css` (NEW, ~150 lines)
**Status**: ✅ Complete

---

#### 2.4 Implement Page Loading Logic ✅
- [x] In PresetPageManager:
  - [x] `async loadPage(presetId, pageNumber)` - Load specific page
  - [x] `applyPageToCanvas(pageData)` - Deserialize and apply
  - [x] Use existing PresetManager.deserializeState()
- [x] Bug fix: Added presetName field for validation
- [x] Bug fix: Complete state preservation (fonts, images, all properties)

**Files**: `js/parameters/PresetPageManager.js` (MODIFY, ~100 lines added)
**Status**: ✅ Complete

---

#### 2.5 Update PresetUIComponent ✅
- [x] Add "Load Page from Preset" button
- [x] Initialize LoadPageModal
- [x] Connect button to modal.show()
- [x] Handle load event
- [x] Show success notification

**Files**: `js/ui/PresetUIComponent.js` (MODIFY, ~40 lines added)
**Status**: ✅ Complete

---

#### 2.6 Add "Update Page" Functionality ⏳ NOT STARTED
- [ ] In SavePageModal:
  - [ ] Detect if page is loaded (has presetId context)
  - [ ] Change "Save Page" button to "Update Page"
  - [ ] Pre-fill preset selection with current preset
  - [ ] Pre-fill page number with current page
  - [ ] Disable preset/page selection (update in place)
- [ ] In PresetPageManager:
  - [ ] Track current loaded page context
  - [ ] `async updateExistingPage()` - Update page at same position

**Files**: `js/ui/SavePageModal.js`, `js/parameters/PresetPageManager.js` (MODIFY, ~80 lines total)
**Status**: ⏳ Not started
**Time**: 2 hours

---

#### 2.7 Add "Add to Existing Preset" Workflow ⏳ NOT STARTED
- [ ] In SavePageModal:
  - [ ] Radio buttons: "Create New" vs "Add to Existing"
  - [ ] Show preset dropdown when "Add to Existing" selected
  - [ ] Fetch presets from PresetPageManager
  - [ ] Show occupied page positions (disable in dropdown)
  - [ ] Enable insert/replace logic

**Files**: `js/ui/SavePageModal.js` (MODIFY, ~100 lines added)
**Status**: ⏳ Not started
**Time**: 2.5 hours

---

#### 2.8 Update index.html & app.js ✅
- [x] Add LoadPageModal CSS link
- [x] Add LoadPageModal script tag
- [x] Initialize LoadPageModal in app.js

**Files**: `index.html`, `js/app.js` (MODIFY, 5 lines total)
**Status**: ✅ Complete

---

#### 2.9 Testing 🚧 IN PROGRESS
- [x] Load Page workflow:
  - [x] Click "Load Page from Preset"
  - [x] Select preset with multiple pages
  - [x] Load Page 1
  - [x] Verify canvas matches saved state (fonts, images, grid)
  - [x] Modal UI state reset bug fix
- [ ] Update Page workflow (NOT IMPLEMENTED YET):
  - [ ] Load Page 1
  - [ ] Modify canvas (change colors, text)
  - [ ] Click "Save Page" (should show "Update Page")
  - [ ] Update page
  - [ ] Reload page, verify changes saved
- [ ] Add to Existing workflow (NOT IMPLEMENTED YET):
  - [ ] Design new canvas
  - [ ] Save as Page 2 to existing preset
  - [ ] Verify overwrite warning

**Status**: 🚧 Partial - core load functionality tested, update/add features pending

---

### Sprint 2 Deliverables (70% Complete)
✅ Designer can load pages from presets
✅ Complete state preservation on load
✅ Preset/page management UI working
⏳ Designer can edit and update existing pages (NOT IMPLEMENTED)
⏳ Designer can add pages to existing presets (NOT IMPLEMENTED)

**Total Time**: ~12 hours complete + 4.5 hours remaining = 16.5 hours

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
