# Multi-Role Employer Brand Tool - System Design Document

**Version**: 2.0
**Date**: 2025-10-21
**Status**: Approved - Ready for Implementation

---

## Executive Summary

Transform the Chatooly Employer Brand Tool into a dual-role application:

- **Designer Role**: Create multi-page preset sets with fine-grained editable field configuration and per-page export formats (PNG/MP4)
- **End-User Role**: Select preset sets, fill editable fields via auto-generated forms, generate multiple canvases, export as single ZIP with mixed formats

**Key Innovation**: Individual main text cell editability (e.g., make only "JOSEPH" editable in "JOSEPH\nSPOTLIGHT\n2024")

---

## Architecture Overview

### Core Approach

**Single Preset with Pages Array + Fine-Grained Field Targeting**

Extend the existing PresetManager to support:
- Multi-page presets (e.g., Cover, Middle, Ending)
- Editable field configuration with precise targeting (including individual main text cells)
- Shared fields across pages (e.g., Employee Name appears on all pages)
- Page-specific fields (e.g., Interview Quote only on Middle page)
- Per-page export format specification (PNG or MP4)

### Why This Approach

✅ Builds on existing PresetManager architecture
✅ Atomic save/load (single Wix collection item)
✅ Fine-grained control (individual cell editability)
✅ Unified designer/end-user UI (thumbnail navigation)
✅ No backward compatibility constraints (fresh start)

---

## Data Model

### Extended Preset Schema

```javascript
{
  // Preset metadata
  presetName: "Employee Spotlight",
  presetType: "set",  // "single" | "set"
  createdAt: "2025-10-21T...",
  version: "2.0",

  // Editable field definitions
  editableFields: [
    {
      id: "employee_first_name",
      label: "Employee First Name",
      type: "text",  // "text" | "textarea" | "media" | "color"
      target: {
        type: "mainTextCell",  // Target a specific main text cell
        pageIds: ["page-1", "page-2"],  // Which pages this field applies to
        cellId: "main-text-cell-10"     // Specific cell (e.g., line 1 = "JOSEPH")
      },
      defaultValue: "[First Name]",
      placeholder: "Enter first name",
      required: true
    },
    {
      id: "employee_photo",
      label: "Employee Photo",
      type: "media",
      target: {
        type: "contentCell",
        pageIds: ["page-1", "page-2", "page-3"],  // All pages
        cellId: "cell-2-3"
      },
      defaultValue: null,
      required: true
    },
    {
      id: "background_color",
      label: "Background Color",
      type: "color",
      target: {
        type: "background",
        pageIds: ["page-1"],  // Only cover page
        property: "color"
      },
      defaultValue: "#ffffff",
      required: false
    },
    {
      id: "interview_quote",
      label: "Interview Quote",
      type: "textarea",
      target: {
        type: "contentCell",
        pageIds: ["page-2"],  // Only middle page
        cellId: "cell-1-2"
      },
      defaultValue: "",
      required: false
    }
  ],

  // Multi-page structure
  pages: [
    {
      pageId: "page-1",
      pageName: "Cover",  // User-defined, editable by designer
      exportFormat: "png",  // "png" | "mp4"
      exportDuration: null,  // Duration in seconds (for mp4 only)

      // Complete preset state for this page
      canvas: { width: 1080, height: 1080, backgroundColor: "#fff", ... },
      background: { color: "#fff", imageURL: null, fitMode: "fill", ... },
      mainText: {
        content: "[First Name]\nSPOTLIGHT\n2024",
        fontSize: 100,
        fontFamily: "Wix Madefor Display",
        color: "#000",
        ...
      },
      grid: {
        rows: 3,
        cols: 3,
        minCellSize: 50,
        snapshot: {
          layout: {
            cells: [
              {
                id: "main-text-cell-10",
                type: "main-text",
                cellType: "main-text",
                bounds: { x: 50, y: 50, width: 200, height: 100 },
                content: "[First Name]",
                lineNumber: 1
              },
              {
                id: "main-text-cell-11",
                type: "main-text",
                content: "SPOTLIGHT",
                lineNumber: 2
              },
              {
                id: "cell-2-3",
                type: "content",
                cellType: "content",
                contentType: "media",
                content: { media: null, mediaType: "image", ... }
              }
            ]
          }
        }
      },
      layers: { assignments: { "main-text-cell-10": "main-text-layer", ... } }
    },
    {
      pageId: "page-2",
      pageName: "Middle",
      exportFormat: "mp4",  // Video export
      exportDuration: 3,     // 3 seconds
      canvas: { ... },
      background: { ... },
      mainText: { ... },
      grid: { ... },
      layers: { ... }
    },
    {
      pageId: "page-3",
      pageName: "Ending",
      exportFormat: "png",
      exportDuration: null,
      canvas: { ... },
      background: { ... },
      mainText: { ... },
      grid: { ... },
      layers: { ... }
    }
  ]
}
```

### Target Types Reference

```javascript
// Main text - entire main text block
{
  type: "mainText",
  pageIds: ["page-1", "page-2"]
}

// Main text cell - specific line/cell within main text
{
  type: "mainTextCell",
  pageIds: ["page-1", "page-2"],
  cellId: "main-text-cell-10"  // Specific cell from grid
}

// Content cell - grid cell with content (image, text, fill)
{
  type: "contentCell",
  pageIds: ["page-1", "page-2", "page-3"],
  cellId: "cell-2-3"
}

// Background property
{
  type: "background",
  pageIds: ["page-1"],
  property: "color" | "imageURL"
}
```

---

## Component Architecture

### New Components

#### 1. PresetSetManager (extends PresetManager)
**Purpose**: Manage multi-page preset lifecycle

**Key Methods**:
- `addPage(sourcePage?)` - Add new page (duplicate source or create blank)
- `removePage(pageId)` - Remove a page
- `updatePageName(pageId, name)` - Rename a page
- `setPageExportFormat(pageId, format, duration)` - Set export format for page
- `reorderPages(pageIds)` - Reorder page sequence
- `getCurrentPageState()` - Serialize current canvas state as page object
- `loadPage(pageId)` - Load page state into canvas for editing
- `serializeSet()` - Create complete preset set JSON
- `deserializeSet(data)` - Load preset set from JSON

**File**: `js/parameters/PresetSetManager.js`

---

#### 2. CreatePresetModal
**Purpose**: Unified modal workflow for preset creation

**4-Step Workflow**:
1. **Preset Info**: Name input + page names
2. **Select Fields**: Click-to-select editable elements from canvas
3. **Configure Fields**: Set labels, defaults, placeholders, required flags
4. **Review & Save**: Summary + save to cloud

**Features**:
- Page thumbnail previews
- Click-to-select mode integration
- Field list management
- Export format selection per page

**File**: `js/ui/CreatePresetModal.js`

---

#### 3. ClickToSelectController
**Purpose**: Enable click-to-select mode for marking editable fields

**Features**:
- Hover highlighting (outline on mouseover)
- Click selection with blue outline
- Element detection (main text cell, content cell, background)
- Display element info (type, ID, content preview)
- Add selected element to editable fields list

**File**: `js/ui/ClickToSelectController.js`

---

#### 4. PageNavigationUI
**Purpose**: Thumbnail gallery for page navigation (shared designer/end-user)

**Features**:
- Render thumbnail preview of each page
- Active page indicator
- Click to switch pages
- "+" button to add new page (designer only)
- Page name display/edit (designer only, locked for end-user)
- Export format indicator (🖼️ PNG | 🎬 MP4)
- Drag-to-reorder (Phase II)

**File**: `js/ui/PageNavigationUI.js`

---

#### 5. ExportFormatSelector
**Purpose**: UI for selecting export format per page

**Features**:
- Dropdown: PNG | MP4
- Duration input (visible only for MP4)
- Preview indicator on thumbnail

**File**: `js/ui/ExportFormatSelector.js`

---

#### 6. EndUserController
**Purpose**: Main controller for end-user application

**Responsibilities**:
- Preset set selection and loading
- Canvas instance management (create/duplicate/delete)
- Data binding (form fields → canvas instances)
- Export orchestration
- Session persistence

**File**: `js/end-user/EndUserController.js`

---

#### 7. CanvasInstanceManager
**Purpose**: Manage multiple canvas instances for end-user

**Key Methods**:
- `createInstance(pageData)` - Create canvas instance from page
- `renderInstance(instance)` - Render instance to canvas
- `applyFieldValue(fieldId, value)` - Apply field value to applicable instances
- `updateInstanceThumbnail(instance)` - Regenerate thumbnail (debounced 500ms)
- `duplicateInstance(instanceId)` - Duplicate existing instance

**File**: `js/end-user/CanvasInstanceManager.js`

---

#### 8. EndUserSidebar
**Purpose**: Auto-generated form for editable fields

**Features**:
- Read editableFields configuration
- Generate appropriate controls (text input, textarea, file upload, color picker)
- Reuse existing designer UI components
- Show only editable fields (not all designer controls)
- Page-specific field visibility
- Real-time canvas updates on field change

**File**: `js/end-user/EndUserSidebar.js`

---

#### 9. ExportManager
**Purpose**: Multi-format ZIP export (PNG + MP4)

**Key Methods**:
- `exportAll()` - Main export orchestration
- `exportPNG(instance)` - Export PNG using canvas.toDataURL()
- `exportMP4(instance, duration)` - Export MP4 using MediaRecorder
- `createZIP(files)` - Bundle all exports into ZIP using JSZip
- `downloadZIP(blob, filename)` - Trigger ZIP download

**File**: `js/end-user/ExportManager.js`

---

### Modified Components

#### PresetManager (Extended)
**Changes**:
- Add `currentPageId` property (track which page designer is viewing)
- Modify `serializeState()` to support pages array
- Modify `deserializeState()` to handle multi-page presets
- Add page manipulation methods (delegate to PresetSetManager)

**File**: `js/parameters/PresetManager.js` (EXTEND)

---

#### PresetUIComponent (Streamlined)
**Changes**:
- Remove old "Configure Editable Fields" button
- Add "Create Preset" button → opens CreatePresetModal
- Show preset sets in dropdown with badge indicating page count ("3 pages")
- Display export format indicators

**File**: `js/ui/PresetUIComponent.js` (MODIFY)

---

#### UIManager (Page-Aware)
**Changes**:
- When designer switches pages, update all UI controls to match page state
- Store/restore page state when switching
- Handle export format UI updates

**File**: `js/ui/UIManager.js` (MODIFY)

---

## User Workflows

### Designer Workflow

#### 1. Create Multi-Page Preset Set

**Starting Point**: Blank canvas or existing design

1. **Create First Page**
   - Designer creates layout as usual (existing workflow)
   - Adds main text: "JOSEPH\nSPOTLIGHT\n2024"
   - Adjusts grid, adds images, sets background

2. **Add Second Page**
   - Designer clicks thumbnail "+" button at bottom
   - Modal appears: "Add New Page"
     - Option: "Duplicate Current Page" (default)
     - Option: "Blank Page"
   - Designer selects "Duplicate Current Page"
   - New page created, thumbnail appears in gallery
   - Designer switches to Page 2, modifies layout

3. **Add Third Page**
   - Clicks "+" again, duplicates Page 2
   - Modifies to create ending layout

4. **Rename Pages**
   - Clicks page name under thumbnail "Page 1"
   - Edits to "Cover"
   - Renames "Page 2" → "Middle", "Page 3" → "Ending"

5. **Set Export Formats**
   - Page 1 (Cover): Export Format = PNG
   - Page 2 (Middle): Export Format = MP4, Duration = 3 seconds
   - Page 3 (Ending): Export Format = PNG
   - UI shows indicators: 🖼️ PNG, 🎬 3s MP4

---

#### 2. Configure Editable Fields

Designer clicks "Create Preset" button:

**Step 1: Preset Info**
- Input: "Preset Name" → "Employee Spotlight"
- Page names shown (editable): Cover, Middle, Ending
- Click "Next: Select Editable Fields"

**Step 2: Select Editable Fields**
- Modal shows thumbnail previews of all 3 pages
- Click-to-select mode enabled
- Designer workflow:

  **Select Employee Name (Main Text Cell)**:
  - Clicks on "JOSEPH" text in Cover page
  - Element highlights with blue outline
  - Sidebar shows: "Selected: Main Text Cell 10 (Line 1)"
  - Checkbox: ☐ Make Editable → Designer checks it
  - Added to editable fields list

  **Select Employee Photo (Content Cell)**:
  - Clicks on image in Cell 2-3 in Cover page
  - Highlights with outline
  - "Selected: Content Cell 2-3 (Image)"
  - Checkbox: ☐ Make Editable → checks it
  - Added to list

  **Apply to Multiple Pages**:
  - Designer clicks same image cell in Middle page
  - System detects: "This field already exists (Employee Photo)"
  - Checkbox: ☑ Also applies to this page (auto-checked)
  - Updates field's pageIds array to include "page-2"
  - Repeats for Ending page

  **Select Page-Specific Field**:
  - Clicks text cell in Middle page
  - "Selected: Content Cell 1-2 (Text)"
  - Makes editable → will be named "Interview Quote"

- Click "Next: Configure Fields"

**Step 3: Configure Field Metadata**

List of all editable fields with configuration forms:

```
1. Main Text Cell 10 (Line 1) - Cover, Middle
   Label: [Employee First Name____]
   Default Value: [[First Name]______]
   Placeholder: [Enter first name____]
   ☑ Required

2. Content Cell 2-3 (Image) - Cover, Middle, Ending
   Label: [Employee Photo_____]
   ☑ Required

3. Content Cell 1-2 (Text) - Middle
   Label: [Interview Quote_____]
   Default Value: [________________]
   ☐ Required
```

Designer fills in labels, defaults, placeholders
Click "Next: Review & Save"

**Step 4: Review**

Summary display:
- Preset Name: "Employee Spotlight"
- 3 Pages: Cover (PNG), Middle (MP4 3s), Ending (PNG)
- 3 Editable Fields:
  - Employee First Name (text)
  - Employee Photo (media)
  - Interview Quote (textarea)

Click "Save to Cloud"

**Save Process**:
1. System uploads all media (background images, cell images) to Wix Media Manager
2. Creates preset set object with editableFields and pages arrays
3. Saves to Wix collection
4. Success message: "Preset set 'Employee Spotlight' saved!"

---

### End-User Workflow

#### 1. Open End-User View

- Navigate to `end-user.html` or `index.html?role=end-user`
- Interface shows:
  - Large canvas preview area (center)
  - Minimal left sidebar
  - Thumbnail gallery at bottom

---

#### 2. Select Preset Set

- Top of sidebar: Dropdown "Select Template"
- Shows available preset sets:
  - "Employee Spotlight (3 pages: 1 video)"
  - "Team Photo (2 pages)"
  - "Department Update (4 pages: 2 videos)"

- User selects "Employee Spotlight"

**Loading Process**:
1. System loads preset set from Wix collection
2. Creates 3 canvas instances (one per page):
   - Instance 1: Cover (PNG)
   - Instance 2: Middle (MP4)
   - Instance 3: Ending (PNG)
3. Canvas shows Page 1 (Cover) preview
4. Thumbnails show all 3 pages at bottom
5. Sidebar populates with editable fields

---

#### 3. Fill Editable Fields

Sidebar shows auto-generated form (using same UI components as designer):

```
┌─ Employee Spotlight Template ���────┐
│                                    │
│ Employee First Name *              │
│ [JOSEPH_______________]            │
│                                    │
│ Employee Photo *                   │
│ [Browse...] [No file chosen]      │
│                                    │
│ Background Color                   │
│ [🎨 #ffffff]                       │
│                                    │
│ (Interview Quote field hidden      │
│  until Middle page is selected)    │
│                                    │
└────────────────────────────────────┘
```

**User Actions**:

1. **Enter Name**:
   - Types "JOSEPH" in "Employee First Name" field
   - All canvases update instantly (Cover and Middle show "JOSEPH")
   - Thumbnail previews regenerate (debounced 500ms)

2. **Upload Photo**:
   - Clicks "Browse..." for Employee Photo
   - Uploads `joseph-smith.jpg`
   - Image appears on all 3 canvases (Cover, Middle, Ending)
   - Thumbnails update

3. **Change Background Color**:
   - Clicks color picker
   - Selects blue (#0066CC)
   - Cover page background updates

4. **Switch to Middle Page**:
   - Clicks Middle page thumbnail
   - Canvas preview switches to Middle page
   - Sidebar now shows "Interview Quote" field (page-specific)

5. **Enter Quote**:
   - Types: "I love working here because of the amazing team culture"
   - Middle canvas updates with quote text
   - Middle thumbnail regenerates

---

#### 4. Add More Pages (Duplicate Middle)

**Scenario**: User realizes interview is long, needs 2 more Middle pages

1. Hovers over Middle thumbnail → "⋮" menu appears
2. Clicks "⋮" → "Duplicate Page"
3. New Middle page added: "Middle (2)"
4. Canvas instance list now has 4 pages:
   - Cover
   - Middle
   - Middle (2)
   - Ending
5. Shared fields (Employee Name, Photo) auto-populate on new page
6. User can enter different quote in Middle (2)

**Repeat**:
- User duplicates Middle again → "Middle (3)"
- Now has 5 total canvases
- Each Middle variant can have different quote

---

#### 5. Export All

User clicks "Export All" button at bottom of sidebar

**Export Process with Progress Indicators**:

```
Processing Page 1/5 (Cover - PNG)...
  ✅ Rendered PNG (2.1 MB)

Processing Page 2/5 (Middle - Video)...
  🎬 Recording 3s video...
  ✅ Rendered MP4 (4.5 MB)

Processing Page 3/5 (Middle (2) - Video)...
  🎬 Recording 3s video...
  ✅ Rendered MP4 (4.3 MB)

Processing Page 4/5 (Middle (3) - Video)...
  🎬 Recording 3s video...
  ✅ Rendered MP4 (4.4 MB)

Processing Page 5/5 (Ending - PNG)...
  ✅ Rendered PNG (2.0 MB)

Creating ZIP archive...
  📦 employee-spotlight-1.png (2.1 MB)
  📦 employee-spotlight-2.mp4 (4.5 MB)
  📦 employee-spotlight-3.mp4 (4.3 MB)
  📦 employee-spotlight-4.mp4 (4.4 MB)
  📦 employee-spotlight-5.png (2.0 MB)

✅ Export complete! Downloaded employee-spotlight.zip (17.3 MB)
```

**Result**:
- Browser downloads `employee-spotlight.zip`
- ZIP contains 5 files (2 PNGs + 3 MP4s)
- Success message displays
- Session storage cleared (optional)

---

## Implementation Plan

### Phase I - Core Functionality (MVP)

**Timeline**: 8 weeks
**Goal**: Designer creates preset sets, end-user fills fields and exports

---

#### Sprint 1: Multi-Page Foundation (Week 1-2)

**1.1 Data Model Updates**
- [ ] Extend PresetManager schema with `presetType` field
- [ ] Add `pages` array to schema
- [ ] Add `editableFields` array to schema
- [ ] Define target type interfaces
- [ ] Add `exportFormat` and `exportDuration` to page schema

**1.2 Page Management Backend**
- [ ] Create `PresetSetManager` class extending `PresetManager`
- [ ] Implement `addPage(sourcePage?)` - Add new page
- [ ] Implement `removePage(pageId)` - Remove page
- [ ] Implement `updatePageName(pageId, name)` - Rename page
- [ ] Implement `setPageExportFormat(pageId, format, duration)` - Set export format
- [ ] Implement `getCurrentPageState()` - Serialize current canvas state
- [ ] Implement `loadPage(pageId)` - Load page into canvas
- [ ] Implement `serializeSet()` - Create complete preset set JSON
- [ ] Implement `deserializeSet(data)` - Load preset set

**1.3 Designer UI - Page Navigation**
- [ ] Create `PageNavigationUI` component
- [ ] Implement thumbnail generation from canvas
- [ ] Render thumbnail gallery at bottom of designer view
- [ ] Implement "+" button for adding new page
- [ ] Implement click-to-switch pages functionality
- [ ] Add page name editing (click to edit)
- [ ] Add export format indicator on thumbnails (🖼️ PNG | 🎬 MP4)
- [ ] Style thumbnail gallery (active state, hover effects)

**Deliverables**:
- PresetSetManager.js with page management
- PageNavigationUI.js with thumbnail gallery
- Designer can create/switch between multiple pages
- Page names are editable
- Export formats displayed on thumbnails

---

#### Sprint 2: Field Selection & Configuration (Week 3-4)

**2.1 Click-to-Select System**
- [ ] Create `ClickToSelectController` class
- [ ] Implement hover highlighting (outline on mouseover)
- [ ] Implement click selection (blue outline + info display)
- [ ] Add element type detection (main text cell, content cell, background)
- [ ] Display element info panel (ID, type, content preview)
- [ ] Handle element selection state management

**2.2 Create Preset Modal - Step 1 & 2**
- [ ] Create `CreatePresetModal` component
- [ ] Design modal UI (4-step wizard)
- [ ] Implement Step 1: Preset name + page names input
- [ ] Implement Step 2: Click-to-select interface
- [ ] Show page thumbnail previews in modal
- [ ] Add "Make Editable" checkbox for selected elements
- [ ] Build editable fields list as designer selects elements
- [ ] Handle field application to multiple pages

**2.3 Create Preset Modal - Step 3 & 4**
- [ ] Implement Step 3: Field metadata configuration form
- [ ] Generate form fields for each editable field
- [ ] Add inputs: label, default value, placeholder, required checkbox
- [ ] Implement Step 4: Review summary
- [ ] Display preset summary (name, pages, fields, export formats)
- [ ] Integrate with PresetSetManager save workflow
- [ ] Add export format selection UI per page

**2.4 Export Format Selector**
- [ ] Create `ExportFormatSelector` component
- [ ] Add dropdown: PNG | MP4
- [ ] Add duration input (visible only for MP4)
- [ ] Update page data when format changes
- [ ] Show format indicator on thumbnails

**Deliverables**:
- ClickToSelectController.js with element selection
- CreatePresetModal.js with 4-step workflow
- ExportFormatSelector.js for format selection
- Designer can mark fields as editable via click-to-select
- Designer can configure field metadata
- Designer can set export format per page
- Preset set can be saved to cloud

---

#### Sprint 3: End-User Application (Week 5-6)

**3.1 End-User HTML & Controller**
- [ ] Create `end-user.html` with minimal UI layout
- [ ] Create `EndUserController` class
- [ ] Implement preset set dropdown population
- [ ] Implement preset set loading from Wix collection
- [ ] Create canvas instance data structures
- [ ] Implement role-based routing (URL parameter `?role=end-user`)

**3.2 Canvas Instance Management**
- [ ] Create `CanvasInstanceManager` class
- [ ] Implement `createInstance(pageData)` - Create from page
- [ ] Implement `renderInstance(instance)` - Render to canvas
- [ ] Implement `applyFieldValue(fieldId, value)` - Update instances
- [ ] Implement `updateInstanceThumbnail(instance)` - Regenerate thumbnail (debounced)
- [ ] Handle real-time updates when field values change

**3.3 End-User Sidebar**
- [ ] Create `EndUserSidebar` component
- [ ] Implement auto-form generation from `editableFields` config
- [ ] Reuse existing UI components (text input, file upload, color picker)
- [ ] Implement field type handlers:
  - [ ] Text input for "text" type
  - [ ] Textarea for "textarea" type
  - [ ] File upload for "media" type
  - [ ] Color picker for "color" type
- [ ] Implement data binding (form change → update canvas instances)
- [ ] Show/hide page-specific fields based on selected page
- [ ] Add field validation UI (required field indicators)

**3.4 Thumbnail Navigation (End-User)**
- [ ] Reuse `PageNavigationUI` component in end-user view
- [ ] Display all canvas instance thumbnails
- [ ] Implement click to preview canvas
- [ ] Regenerate thumbnails when field values change (debounced)
- [ ] Show page names (non-editable for end-user)

**Deliverables**:
- end-user.html with clean interface
- EndUserController.js managing end-user flow
- CanvasInstanceManager.js handling multiple instances
- EndUserSidebar.js with auto-generated form
- End-user can select preset set
- End-user can fill editable fields
- Canvases update in real-time
- Thumbnail navigation works

---

#### Sprint 4: Export Functionality (Week 7-8)

**4.1 Export Manager Foundation**
- [ ] Create `ExportManager` class
- [ ] Add JSZip library dependency (via CDN)
- [ ] Implement export orchestration loop
- [ ] Implement `exportAll()` main method

**4.2 PNG Export**
- [ ] Implement `exportPNG(instance)` method
- [ ] Render instance to canvas using existing render engine
- [ ] Capture `canvas.toDataURL('image/png')`
- [ ] Convert dataURL to Blob
- [ ] Return PNG blob for ZIP addition

**4.3 MP4 Export**
- [ ] Implement `exportMP4(instance, duration)` method
- [ ] Start canvas animations if present
- [ ] Use MediaRecorder API to capture canvas stream
- [ ] Record for specified duration (from page.exportDuration)
- [ ] Stop animations after recording
- [ ] Return video blob (WebM format for Phase I)
- [ ] Handle MediaRecorder browser compatibility

**4.4 ZIP Creation & Download**
- [ ] Implement `createZIP(files)` method
- [ ] Use JSZip to bundle all exports (PNGs + MP4s)
- [ ] Generate proper filenames (e.g., `employee-spotlight-1.png`)
- [ ] Implement `downloadZIP(blob, filename)` method
- [ ] Trigger browser download

**4.5 Export UI**
- [ ] Add "Export All" button to end-user sidebar
- [ ] Create progress indicator component
- [ ] Show detailed progress per page (1/5, 2/5, etc.)
- [ ] Show format-specific messages ("Recording video...", "Rendering PNG...")
- [ ] Display file sizes during export
- [ ] Show success message with file count and total size
- [ ] Handle export errors gracefully

**4.6 Session Persistence**
- [ ] Implement session storage save on field change
- [ ] Save field values to `sessionStorage`
- [ ] Save canvas instance list
- [ ] Implement session restore on page reload
- [ ] Clear sessionStorage after successful export (optional)

**Deliverables**:
- ExportManager.js with multi-format export
- JSZip integration working
- PNG export functional
- MP4 export functional (WebM format)
- ZIP creation and download working
- Progress indicators showing
- Session persistence implemented
- End-to-end export workflow complete

---

### Phase II - Enhancements (Future)

**Timeline**: TBD
**Goal**: Advanced features, better UX, optimization

---

#### Sprint 5: Canvas Management Enhancements

**5.1 Page Duplication**
- [ ] Add "⋮" menu to thumbnail gallery items
- [ ] Implement "Duplicate Page" action
- [ ] Handle duplicate naming (Middle → Middle (2) → Middle (3))
- [ ] Update shared fields to apply to duplicates automatically
- [ ] Add confirmation dialog

**5.2 Page Deletion**
- [ ] Add "Delete Page" action to "⋮" menu
- [ ] Implement deletion with confirmation
- [ ] Handle edge cases (can't delete last page)
- [ ] Update instance numbering after deletion

**5.3 Page Reordering**
- [ ] Implement drag-to-reorder in thumbnail gallery
- [ ] Update page sequence in data model
- [ ] Maintain field bindings during reorder
- [ ] Update export order accordingly

---

#### Sprint 6: Advanced Field Types & Validation

**6.1 Color Palette Fields**
- [ ] Designer defines preset color options (e.g., brand colors)
- [ ] End-user selects from palette instead of free color picker
- [ ] Apply to background color, text color, etc.

**6.2 Dropdown Fields**
- [ ] Designer specifies dropdown options (e.g., "Department: HR, Engineering, Sales")
- [ ] End-user selects from dropdown
- [ ] Apply to text cells or other properties

**6.3 Field Validation**
- [ ] Implement required field validation before export
- [ ] Add character limits for text fields
- [ ] Add file type/size validation for media uploads
- [ ] Show validation errors in UI
- [ ] Prevent export until all validations pass

---

#### Sprint 7: UI/UX Polish

**7.1 Loading & Progress States**
- [ ] Add skeleton loaders for preset loading
- [ ] Implement smooth transitions between pages
- [ ] Add thumbnail generation loading indicators
- [ ] Improve export progress visualization

**7.2 Field Grouping**
- [ ] Group fields by category (Employee Info, Images, Text, etc.)
- [ ] Add collapsible sections in end-user sidebar
- [ ] Better visual organization

**7.3 Responsive Design**
- [ ] Make end-user interface mobile-friendly
- [ ] Add touch-friendly controls
- [ ] Implement adaptive thumbnail gallery for smaller screens

---

#### Sprint 8: Performance Optimization

**8.1 Rendering Optimization**
- [ ] Implement debounced canvas updates on text input (already specified: 500ms)
- [ ] Batch update shared fields across multiple canvases
- [ ] Lazy-load non-active canvas instances
- [ ] Optimize thumbnail generation (use lower resolution)

**8.2 Export Optimization**
- [ ] Parallelize PNG exports where possible
- [ ] Compress images in ZIP (already configured: level 6)
- [ ] Show granular progress (percentage, MB processed)
- [ ] Add cancel export functionality

---

## Technical Implementation Details

### File Structure

```
Chatooly-EmployerBrandTool/
├── index.html (designer view - existing, remains)
├── end-user.html (NEW - end-user view)
│
├── js/
│   ├── parameters/
│   │   ├── PresetManager.js (EXTEND - add pages support)
│   │   └── PresetSetManager.js (NEW - multi-page preset logic)
│   │
│   ├── ui/
│   │   ├── PresetUIComponent.js (MODIFY - streamline, add Create Preset button)
│   │   ├── CreatePresetModal.js (NEW - integrated preset creation flow)
│   │   ├── ClickToSelectController.js (NEW - field selection)
│   │   ├── PageNavigationUI.js (NEW - thumbnail gallery, shared)
│   │   └── ExportFormatSelector.js (NEW - format selection per page)
│   │
│   └── end-user/ (NEW - all end-user specific code)
│       ├── EndUserController.js (NEW - main controller)
│       ├── CanvasInstanceManager.js (NEW - multi-canvas management)
│       ├── EndUserSidebar.js (NEW - dynamic field controls)
│       └── ExportManager.js (NEW - multi-format ZIP export)
│
├── css/
│   ├── page-navigation.css (NEW - thumbnail gallery styles)
│   ├── create-preset-modal.css (NEW - modal styles)
│   └── end-user.css (NEW - end-user interface styles)
│
├── lib/
│   └── jszip.min.js (NEW - ZIP creation library)
│
└── claudedocs/
    ├── multi-role-system-design.md (THIS FILE)
    └── implementation-tasks.md (Detailed task breakdown)
```

---

### Key Algorithms

#### 1. Field Value Application

When end-user changes a field value, apply to all applicable canvas instances:

```javascript
function applyFieldValue(fieldId, value) {
  // Find field configuration
  const field = editableFields.find(f => f.id === fieldId);
  if (!field) return;

  // Get applicable canvas instances
  const instances = canvasInstances.filter(instance =>
    field.target.pageIds.includes(instance.pageId)
  );

  // Apply to each instance
  instances.forEach(instance => {
    switch(field.target.type) {
      case 'mainText':
        // Update entire main text
        updateMainText(instance, value);
        break;

      case 'mainTextCell':
        // Update specific main text cell
        updateMainTextCell(instance, field.target.cellId, value);
        break;

      case 'contentCell':
        // Update content cell (image, text, etc.)
        updateContentCell(instance, field.target.cellId, value);
        break;

      case 'background':
        // Update background property
        updateBackground(instance, field.target.property, value);
        break;
    }

    // Re-render this instance
    renderInstance(instance);

    // Update thumbnail (debounced)
    updateThumbnailDebounced(instance);
  });
}
```

---

#### 2. Main Text Cell Targeting

Identify specific main text cell when designer clicks on canvas:

```javascript
function identifyMainTextCell(clickX, clickY) {
  // Get all main text cells from grid
  const mainTextCells = grid.getAllCells().filter(c => c.type === 'main-text');

  // Find cell at click position
  const cell = mainTextCells.find(cell => {
    const bounds = cell.bounds;
    return clickX >= bounds.x &&
           clickX <= bounds.x + bounds.width &&
           clickY >= bounds.y &&
           clickY <= bounds.y + bounds.height;
  });

  if (cell) {
    return {
      type: 'mainTextCell',
      cellId: cell.id,  // e.g., "main-text-cell-10"
      content: cell.content,  // e.g., "JOSEPH"
      lineNumber: cell.lineNumber  // e.g., 1 (first line)
    };
  }

  return null;
}
```

---

#### 3. Thumbnail Generation (Debounced)

Generate thumbnail preview of canvas with debouncing:

```javascript
let thumbnailTimeouts = {};

function updateThumbnailDebounced(instance, delay = 500) {
  // Clear existing timeout for this instance
  if (thumbnailTimeouts[instance.id]) {
    clearTimeout(thumbnailTimeouts[instance.id]);
  }

  // Set new timeout
  thumbnailTimeouts[instance.id] = setTimeout(() => {
    generateThumbnail(instance);
  }, delay);
}

function generateThumbnail(instance) {
  // Render instance to main canvas
  canvasInstanceManager.renderInstance(instance);

  // Create thumbnail canvas
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = 150;
  thumbCanvas.height = 150;
  const ctx = thumbCanvas.getContext('2d');

  // Draw scaled-down version
  const mainCanvas = document.getElementById('chatooly-canvas');
  ctx.drawImage(
    mainCanvas,
    0, 0,
    mainCanvas.width,
    mainCanvas.height,
    0, 0,
    150, 150
  );

  // Update thumbnail in UI
  const dataURL = thumbCanvas.toDataURL('image/png');
  updateThumbnailUI(instance.id, dataURL);

  return dataURL;
}
```

---

#### 4. Multi-Format ZIP Export

Export all canvas instances to ZIP with mixed formats (PNG + MP4):

```javascript
async function exportAllToZip() {
  const zip = new JSZip();
  const presetName = currentPresetSet.presetName;
  const totalInstances = canvasInstances.length;

  // Show initial progress
  showProgress('Starting export...', 0, totalInstances);

  for (let i = 0; i < totalInstances; i++) {
    const instance = canvasInstances[i];
    const page = preset.pages.find(p => p.pageId === instance.pageId);

    // Update progress with page info
    showProgress(
      `Processing Page ${i+1}/${totalInstances} (${page.pageName} - ${page.exportFormat.toUpperCase()})...`,
      i,
      totalInstances
    );

    // Render this instance to canvas
    canvasInstanceManager.renderInstance(instance);

    // Export based on format
    let blob;
    let extension;

    if (page.exportFormat === 'png') {
      // PNG Export
      const canvas = document.getElementById('chatooly-canvas');
      const dataURL = canvas.toDataURL('image/png');
      blob = await fetch(dataURL).then(r => r.blob());
      extension = 'png';

      updateProgress(`✅ Rendered PNG (${(blob.size / 1024 / 1024).toFixed(1)} MB)`);

    } else if (page.exportFormat === 'mp4') {
      // Video Export
      const duration = page.exportDuration || 3;

      updateProgress(`🎬 Recording ${duration}s video...`);

      blob = await recordVideo(duration);
      extension = 'webm';  // Phase I uses WebM, Phase II converts to MP4

      updateProgress(`✅ Rendered video (${(blob.size / 1024 / 1024).toFixed(1)} MB)`);
    }

    // Add to ZIP
    const filename = `${presetName.toLowerCase().replace(/\s+/g, '-')}-${i + 1}.${extension}`;
    zip.file(filename, blob);
  }

  // Generate ZIP
  showProgress('Creating ZIP archive...', totalInstances, totalInstances);

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  // Download
  const zipFilename = `${presetName.toLowerCase().replace(/\s+/g, '-')}.zip`;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(zipBlob);
  link.download = zipFilename;
  link.click();

  // Cleanup
  URL.revokeObjectURL(link.href);
  hideProgress();

  // Success message
  showSuccess(
    `✅ Export complete! Downloaded ${zipFilename} (${(zipBlob.size / 1024 / 1024).toFixed(1)} MB)\n` +
    `Contains ${totalInstances} files.`
  );
}

// Video recording using MediaRecorder API
async function recordVideo(duration) {
  return new Promise((resolve, reject) => {
    // Start canvas animations if present
    if (app.grid && app.grid.animationManager) {
      app.grid.startAllAnimations();
    }

    // Get canvas stream
    const canvas = document.getElementById('chatooly-canvas');
    const stream = canvas.captureStream(60); // 60 FPS

    // Create MediaRecorder
    const chunks = [];
    let mimeType = 'video/webm;codecs=vp9';

    // Fallback for Safari
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }

    const recorder = new MediaRecorder(stream, { mimeType });

    recorder.ondataavailable = e => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });

      // Stop animations
      if (app.grid && app.grid.animationManager) {
        app.grid.stopAllAnimations();
      }

      resolve(blob);
    };

    recorder.onerror = (e) => {
      reject(new Error(`Recording failed: ${e.error}`));
    };

    // Start recording
    recorder.start();

    // Stop after specified duration
    setTimeout(() => {
      recorder.stop();
    }, duration * 1000);
  });
}
```

---

### Dependencies

#### New Libraries

**JSZip** (v3.10.1)
- Purpose: ZIP file creation for multi-file export
- CDN: `https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js`
- Size: ~20KB minified
- License: MIT/GPL

#### Existing Libraries (Reused)

- **Chatooly CDN**: Canvas rendering and export infrastructure
- **Wix SDK**: Cloud preset storage and media management
- **Existing UI Components**: Text inputs, color pickers, file uploads (reused for end-user sidebar)

---

### Browser Compatibility

**Minimum Requirements**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required Browser Features**:
- ES6+ (async/await, classes, arrow functions)
- Canvas API
- Canvas.captureStream() for video export
- MediaRecorder API
- FileReader API for image uploads
- sessionStorage
- Blob/File APIs

**Known Limitations**:
- Safari MediaRecorder support may vary (fallback to PNG-only export or server-side video)
- MediaRecorder produces WebM by default (MP4 conversion in Phase II)

---

### Data Storage

#### Wix Collections Schema

**Collection Name**: `Presets`

```javascript
{
  _id: "auto-generated-id",
  name: "Employee Spotlight",
  presetType: "set",  // "single" | "set"
  settings: {
    // Full preset set object (nested JSON)
    presetName: "Employee Spotlight",
    editableFields: [...],
    pages: [...]
  },
  createdAt: Date,
  updatedAt: Date,
  _owner: "user-id"
}
```

---

#### Session Storage Schema

**Key**: `chatooly-end-user-data`

```javascript
{
  presetId: "preset-abc123",
  presetName: "Employee Spotlight",
  fieldValues: {
    "employee_first_name": "JOSEPH",
    "employee_photo": "data:image/png;base64,...",  // Or Wix CDN URL
    "background_color": "#0066CC",
    "interview_quote": "I love working here..."
  },
  canvasInstances: [
    {
      instanceId: "instance-1",
      pageId: "page-1",
      pageName: "Cover"
    },
    {
      instanceId: "instance-2",
      pageId: "page-2",
      pageName: "Middle"
    },
    {
      instanceId: "instance-3",
      pageId: "page-2",
      pageName: "Middle (2)"
    },
    {
      instanceId: "instance-4",
      pageId: "page-3",
      pageName: "Ending"
    }
  ],
  lastModified: "2025-10-21T14:30:00Z"
}
```

---

## Success Metrics

### Designer Experience
✅ Create 3-page preset set in < 10 minutes
✅ Configure editable fields via click-to-select (no complex forms)
✅ Preview all pages in thumbnail gallery
✅ Set export formats per page easily

### End-User Experience
✅ Select preset → fill 3 fields → export in < 2 minutes
✅ No learning curve (intuitive form interface)
✅ Single ZIP download (not 5 separate files)
✅ Real-time canvas preview updates
✅ Mixed format export (PNG + MP4)

### Technical Performance
✅ Page switch < 500ms
✅ Field update → canvas render < 100ms (debounced)
✅ PNG export < 2s per image
✅ MP4 export < 5s per video (3s duration)
✅ Total export (2 PNG + 1 MP4) < 15s
✅ Zero data loss (session persistence)

---

## Risk Mitigation

### Risk 1: Main Text Cell ID Stability
**Issue**: When end-user changes main text, grid regenerates and cell IDs may change

**Current Approach**: Hope for the best (cell IDs remain stable in practice)

**Fallback Plan (Phase II)**:
- Add stable cell identifiers based on line number + position
- Lock grid structure for preset sets (no auto-regeneration)

---

### Risk 2: Large Video File Sizes
**Issue**: MP4/WebM files can be large (4-10 MB per 3s clip), total ZIP may exceed 20 MB

**Mitigation**:
- Warn user during export about file size
- Show file size in progress indicator
- Consider compression settings in Phase II

**Alternative**:
- Server-side video generation/compression
- Offer resolution options (1x, 2x, 4x)

---

### Risk 3: Browser Compatibility (MediaRecorder)
**Issue**: Safari MediaRecorder support varies by version

**Mitigation**:
- Feature detection: Check `MediaRecorder.isTypeSupported()`
- Fallback message: "Video export not supported in this browser"
- Graceful degradation: PNG-only export option

**Alternative**:
- Server-side video generation using FFmpeg
- Client-side canvas frame export → server assembly

---

### Risk 4: Mixed Export Complexity
**Issue**: Handling both PNG and MP4 exports in single workflow increases complexity

**Mitigation**:
- Clear progress indicators showing format being processed
- Extensive testing of edge cases (all PNG, all MP4, mixed)
- Error handling for individual export failures (continue with others)

---

## Open Implementation Decisions

### Decision 1: Video Format
**Question**: WebM (native) or MP4 (better compatibility)?

**Options**:
- **Option A**: WebM (Phase I) - Native MediaRecorder output, smaller files
- **Option B**: MP4 (Phase II) - Better compatibility, requires conversion (FFmpeg.js or server-side)

**Recommendation**: Start with WebM, add MP4 conversion if users need it

---

### Decision 2: Video Recording Strategy
**Question**: Use MediaRecorder API or Chatooly CDN video export?

**Options**:
- **Option A**: MediaRecorder API - Full control, works offline
- **Option B**: Chatooly CDN export (if available) - Simpler integration

**Recommendation**: Try Chatooly CDN first, fallback to MediaRecorder API

---

### Decision 3: Main Text Cell ID Stability
**Question**: How to ensure cell IDs remain stable after grid regeneration?

**Options**:
- **Option A**: Hope cell IDs stay stable (current approach)
- **Option B**: Use line number + character position as identifier
- **Option C**: Lock grid structure (no regeneration for preset sets)

**Recommendation**: Start with Option A, implement Option C if issues arise

---

### Decision 4: Page Duplication Default
**Question**: When adding new page, duplicate current or create blank?

**Options**:
- **Option A**: Always duplicate current page
- **Option B**: Always create blank page
- **Option C**: Ask user each time (modal with choice)

**Recommendation**: Option A (duplicate) with Option C (ask) added in Phase II

---

## Next Steps

### Immediate Actions
1. ✅ **Design Approved** - This document represents the final approved design
2. **Review Task List** - See `implementation-tasks.md` for detailed task breakdown
3. **Sprint 1 Kickoff** - Begin multi-page foundation implementation
4. **Prototype Video Export** - Test MediaRecorder early to validate approach

### Weekly Cadence
1. **Monday**: Sprint planning, task assignment
2. **Wednesday**: Mid-week check-in, blocker resolution
3. **Friday**: Demo progress, adjust plan as needed

### Phase I Milestones
- **Week 2**: Multi-page foundation complete (Sprint 1)
- **Week 4**: Field configuration complete (Sprint 2)
- **Week 6**: End-user app complete (Sprint 3)
- **Week 8**: Export functionality complete (Sprint 4) - **MVP LAUNCH**

---

## Appendix

### Glossary

**Preset Set**: A collection of multiple pages (sub-presets) grouped together with shared editable field configuration

**Page**: A single canvas state within a preset set (e.g., Cover, Middle, Ending)

**Editable Field**: A specific element (main text cell, content cell, background) marked as editable for end-users

**Target**: The specific element that an editable field controls (includes type, pageIds, cellId)

**Canvas Instance**: A runtime instance of a page with specific field values applied

**Main Text Cell**: Individual cell created when main text is broken into lines by the grid system

**Content Cell**: Grid cell containing content (image, text, fill, or empty)

**Export Format**: The output format for a page (PNG for static, MP4 for video)

---

### References

- Existing PresetManager: [js/parameters/PresetManager.js](../js/parameters/PresetManager.js)
- Existing Grid System: [js/grid/Grid.js](../js/grid/Grid.js)
- Existing ContentCell: [js/grid/ContentCell.js](../js/grid/ContentCell.js)
- Chatooly CDN Documentation: https://yaelren.github.io/chatooly-cdn/
- JSZip Documentation: https://stuk.github.io/jszip/
- MediaRecorder API: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder

---

**Document Version History**:
- v1.0 (2025-10-21): Initial draft
- v2.0 (2025-10-21): Final approved version with MP4 export support

---

**End of Design Document**
