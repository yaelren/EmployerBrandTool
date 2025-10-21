# Multi-Role System - Implementation Task List

**Project**: Employer Brand Tool - Designer/End-User Split
**Timeline**: 8 weeks (Phase I MVP)
**Last Updated**: 2025-10-21

---

## Sprint 1: Multi-Page Foundation (Week 1-2)

### 1.1 Data Model Updates

**Priority**: CRITICAL | **Estimated**: 4 hours

- [ ] **Task 1.1.1**: Extend PresetManager schema
  - Add `presetType` field ("single" | "set")
  - Add `pages` array to hold multiple page objects
  - Add `editableFields` array
  - Update `serializeState()` to handle new structure
  - **Files**: `js/parameters/PresetManager.js`
  - **Tests**: Verify existing single presets still work

- [ ] **Task 1.1.2**: Define page schema structure
  - Add `pageId`, `pageName` fields
  - Add `exportFormat` ("png" | "mp4")
  - Add `exportDuration` (number, for videos)
  - Define complete page object structure
  - **Files**: Update PresetManager.js schema comments

- [ ] **Task 1.1.3**: Define editableFields schema
  - Define field object structure (id, label, type, target, defaultValue, etc.)
  - Define target type interfaces (mainText, mainTextCell, contentCell, background)
  - Document field types (text, textarea, media, color)
  - **Files**: Add schema documentation to PresetManager.js

---

### 1.2 Page Management Backend

**Priority**: CRITICAL | **Estimated**: 12 hours

- [ ] **Task 1.2.1**: Create PresetSetManager class
  - Extend PresetManager class
  - Add `currentPageId` property to track active page
  - Add `pages` array management
  - **Files**: Create `js/parameters/PresetSetManager.js`
  - **Dependencies**: PresetManager.js

- [ ] **Task 1.2.2**: Implement addPage() method
  - Accept optional `sourcePage` parameter
  - If sourcePage provided, deep clone it
  - If no sourcePage, call `getCurrentPageState()` to capture current canvas
  - Generate unique `pageId` (e.g., "page-" + timestamp)
  - Set default `pageName` (e.g., "Page 1", "Page 2")
  - Set default `exportFormat` to "png"
  - Add to `pages` array
  - **Files**: PresetSetManager.js
  - **Returns**: New page object

- [ ] **Task 1.2.3**: Implement removePage(pageId) method
  - Find page by pageId
  - Remove from `pages` array
  - If removed page was current page, switch to first page
  - Prevent deletion if only one page remains
  - **Files**: PresetSetManager.js

- [ ] **Task 1.2.4**: Implement updatePageName(pageId, name) method
  - Find page by pageId
  - Update `pageName` property
  - Trigger UI update if needed
  - **Files**: PresetSetManager.js

- [ ] **Task 1.2.5**: Implement setPageExportFormat(pageId, format, duration) method
  - Find page by pageId
  - Update `exportFormat` property
  - Update `exportDuration` (required for mp4, null for png)
  - Trigger UI update
  - **Files**: PresetSetManager.js

- [ ] **Task 1.2.6**: Implement getCurrentPageState() method
  - Call existing `PresetManager.serializeState()` to get current canvas state
  - Extract relevant sections: canvas, background, mainText, grid, layers
  - Generate new `pageId`
  - Return page object
  - **Files**: PresetSetManager.js
  - **Dependencies**: PresetManager.serializeState()

- [ ] **Task 1.2.7**: Implement loadPage(pageId) method
  - Find page by pageId in `pages` array
  - Call existing `PresetManager.deserializeState()` with page data
  - Update `currentPageId`
  - Trigger canvas re-render
  - **Files**: PresetSetManager.js
  - **Dependencies**: PresetManager.deserializeState()

- [ ] **Task 1.2.8**: Implement serializeSet() method
  - Capture current page state (if modified)
  - Build complete preset set object with all pages
  - Include `editableFields` array
  - Return JSON-ready object
  - **Files**: PresetSetManager.js

- [ ] **Task 1.2.9**: Implement deserializeSet(data) method
  - Validate preset set structure
  - Load first page by default
  - Store pages array
  - Store editableFields
  - Update UI to show all pages
  - **Files**: PresetSetManager.js

---

### 1.3 Designer UI - Page Navigation

**Priority**: HIGH | **Estimated**: 10 hours

- [ ] **Task 1.3.1**: Create PageNavigationUI component
  - Create new class `PageNavigationUI`
  - Initialize with app reference
  - Create container element for thumbnail gallery
  - **Files**: Create `js/ui/PageNavigationUI.js`

- [ ] **Task 1.3.2**: Implement thumbnail generation
  - Create `generateThumbnail(pageId)` method
  - Render page to main canvas
  - Create 150x150 thumbnail canvas
  - Scale down main canvas to thumbnail size
  - Return dataURL
  - **Files**: PageNavigationUI.js
  - **Dependencies**: app.render()

- [ ] **Task 1.3.3**: Render thumbnail gallery UI
  - Create gallery container at bottom of designer view
  - For each page in preset set, render thumbnail
  - Display thumbnail image
  - Display page name below thumbnail
  - Display export format indicator (🖼️ PNG | 🎬 MP4)
  - Add active page highlighting
  - **Files**: PageNavigationUI.js
  - **HTML**: Update index.html with gallery container

- [ ] **Task 1.3.4**: Implement "+" button for adding pages
  - Add "+" button to gallery
  - On click, call `PresetSetManager.addPage()`
  - Show modal: "Duplicate Current Page" or "Blank Page"
  - On selection, create new page
  - Regenerate thumbnail gallery
  - **Files**: PageNavigationUI.js
  - **Dependencies**: PresetSetManager.addPage()

- [ ] **Task 1.3.5**: Implement click-to-switch pages
  - Add click event listener to each thumbnail
  - On click, call `PresetSetManager.loadPage(pageId)`
  - Update active page indicator
  - Update canvas with page data
  - **Files**: PageNavigationUI.js
  - **Dependencies**: PresetSetManager.loadPage()

- [ ] **Task 1.3.6**: Implement page name editing
  - Make page name editable (click to edit)
  - Show input field on click
  - On blur/enter, call `PresetSetManager.updatePageName()`
  - Update thumbnail with new name
  - **Files**: PageNavigationUI.js
  - **Dependencies**: PresetSetManager.updatePageName()

- [ ] **Task 1.3.7**: Add export format indicators
  - Display icon based on page.exportFormat
  - 🖼️ for PNG
  - 🎬 for MP4 (with duration: "🎬 3s")
  - Update indicator when format changes
  - **Files**: PageNavigationUI.js

- [ ] **Task 1.3.8**: Style thumbnail gallery
  - Create CSS for gallery layout (horizontal scrolling)
  - Style thumbnail container (border, shadow, hover effects)
  - Style active thumbnail (highlighted border)
  - Style page name (editable appearance)
  - Style export format indicator
  - Style "+" button
  - **Files**: Create `css/page-navigation.css`

- [ ] **Task 1.3.9**: Integrate PageNavigationUI into designer view
  - Initialize PageNavigationUI in app.js
  - Render gallery in designer view
  - Connect to PresetSetManager events
  - Test page switching workflow
  - **Files**: js/app.js, index.html

---

### Sprint 1 Deliverables

✅ PresetSetManager.js with complete page management API
✅ PageNavigationUI.js with thumbnail gallery
✅ Designer can create multiple pages
✅ Designer can switch between pages
✅ Designer can rename pages
✅ Export format indicators displayed on thumbnails

---

## Sprint 2: Field Selection & Configuration (Week 3-4)

### 2.1 Click-to-Select System

**Priority**: CRITICAL | **Estimated**: 8 hours

- [ ] **Task 2.1.1**: Create ClickToSelectController class
  - Initialize with app reference
  - Add `isEnabled` state flag
  - Add `selectedElement` property
  - **Files**: Create `js/ui/ClickToSelectController.js`

- [ ] **Task 2.1.2**: Implement hover highlighting
  - Add mousemove event listener to canvas
  - Detect element at mouse position (main text cell, content cell, background)
  - Draw outline around hovered element
  - **Files**: ClickToSelectController.js
  - **Dependencies**: Grid cell detection

- [ ] **Task 2.1.3**: Implement click selection
  - Add click event listener to canvas
  - On click, identify element at position
  - Store selected element
  - Draw blue outline around selected element
  - Trigger selection callback
  - **Files**: ClickToSelectController.js

- [ ] **Task 2.1.4**: Add element type detection
  - Detect main text cells (from grid.getAllCells() where type === 'main-text')
  - Detect content cells (from grid.getAllCells() where type === 'content')
  - Detect background (check if click is outside all cells)
  - Return element info object
  - **Files**: ClickToSelectController.js

- [ ] **Task 2.1.5**: Display element info panel
  - Create info panel UI (floating or sidebar)
  - Show element type (Main Text Cell, Content Cell, Background)
  - Show element ID
  - Show content preview (text snippet or "Image")
  - Show line number (for main text cells)
  - **Files**: ClickToSelectController.js

- [ ] **Task 2.1.6**: Handle selection state management
  - Enable/disable click-to-select mode
  - Clear selection
  - Get selected element
  - **Files**: ClickToSelectController.js

---

### 2.2 Create Preset Modal - Steps 1 & 2

**Priority**: CRITICAL | **Estimated**: 12 hours

- [ ] **Task 2.2.1**: Create CreatePresetModal component
  - Create modal UI structure (4-step wizard)
  - Add step navigation (Step 1, 2, 3, 4 indicators)
  - Add "Next" and "Back" buttons
  - Add "Cancel" button
  - **Files**: Create `js/ui/CreatePresetModal.js`

- [ ] **Task 2.2.2**: Design modal UI
  - Create modal overlay
  - Create modal content container
  - Add close button (×)
  - Style modal (centered, responsive)
  - Add animations (fade in/out)
  - **Files**: Create `css/create-preset-modal.css`

- [ ] **Task 2.2.3**: Implement Step 1 - Preset Info
  - Add input field for preset name
  - Display list of pages with editable names
  - Allow inline editing of page names
  - Validate preset name (required, max length)
  - **Files**: CreatePresetModal.js

- [ ] **Task 2.2.4**: Implement Step 2 - Click-to-Select Interface
  - Show page thumbnail previews (side-by-side or tabs)
  - Enable click-to-select mode
  - Display "Make Editable" checkbox for selected element
  - Build editable fields list as designer selects
  - **Files**: CreatePresetModal.js
  - **Dependencies**: ClickToSelectController

- [ ] **Task 2.2.5**: Handle field selection
  - When element selected, show in sidebar
  - Add "Make Editable" checkbox
  - On check, add to editableFields list
  - Display field in "Selected Fields" list
  - Allow removal from list
  - **Files**: CreatePresetModal.js

- [ ] **Task 2.2.6**: Handle multi-page field application
  - When designer clicks same element on different page
  - Detect if field already exists (same cellId)
  - Show "Also applies to this page" checkbox (auto-checked)
  - Update field's pageIds array
  - **Files**: CreatePresetModal.js

- [ ] **Task 2.2.7**: Display selected fields list
  - Show all fields in sidebar
  - For each field, show:
    - Element type
    - Element ID
    - Pages it applies to
    - Remove button
  - Allow reordering (Phase II)
  - **Files**: CreatePresetModal.js

---

### 2.3 Create Preset Modal - Steps 3 & 4

**Priority**: HIGH | **Estimated**: 10 hours

- [ ] **Task 2.3.1**: Implement Step 3 - Field Metadata Configuration
  - Show form for each editable field
  - Generate appropriate inputs based on field type
  - **Files**: CreatePresetModal.js

- [ ] **Task 2.3.2**: Create field metadata form
  - For each field in editableFields list:
    - Label input (text, required)
    - Default value input (type-specific)
    - Placeholder input (text, for text/textarea fields)
    - Required checkbox
  - Display field preview (element type, pages)
  - **Files**: CreatePresetModal.js

- [ ] **Task 2.3.3**: Generate type-specific default value inputs
  - Text field: text input
  - Textarea field: textarea
  - Media field: file upload (optional default image)
  - Color field: color picker
  - **Files**: CreatePresetModal.js

- [ ] **Task 2.3.4**: Validate field metadata
  - Ensure all fields have labels
  - Check for duplicate field IDs
  - Validate required fields
  - **Files**: CreatePresetModal.js

- [ ] **Task 2.3.5**: Implement Step 4 - Review Summary
  - Display preset set summary
  - Show preset name
  - Show number of pages with names
  - Show export format for each page
  - List all editable fields with metadata
  - Add "Edit" buttons to go back to previous steps
  - **Files**: CreatePresetModal.js

- [ ] **Task 2.3.6**: Integrate with save workflow
  - On "Save to Cloud" click
  - Build complete preset set object
  - Call `PresetSetManager.serializeSet()`
  - Add editableFields to preset data
  - Call `PresetManager.saveToCloud()`
  - Show success message
  - Close modal
  - Refresh preset dropdown
  - **Files**: CreatePresetModal.js
  - **Dependencies**: PresetSetManager, WixPresetAPI

---

### 2.4 Export Format Selector

**Priority**: HIGH | **Estimated**: 4 hours

- [ ] **Task 2.4.1**: Create ExportFormatSelector component
  - Create dropdown: PNG | MP4
  - Create duration input (visible only for MP4)
  - **Files**: Create `js/ui/ExportFormatSelector.js`

- [ ] **Task 2.4.2**: Integrate into CreatePresetModal
  - Add export format selector for each page in Step 1
  - Display current format
  - On change, update page data
  - **Files**: CreatePresetModal.js
  - **Dependencies**: ExportFormatSelector.js

- [ ] **Task 2.4.3**: Update page data on format change
  - On dropdown change, call `PresetSetManager.setPageExportFormat()`
  - Show/hide duration input based on format
  - Update page object
  - Update thumbnail indicator
  - **Files**: ExportFormatSelector.js

- [ ] **Task 2.4.4**: Style export format selector
  - Style dropdown
  - Style duration input
  - Add format icons (🖼️, 🎬)
  - **Files**: create-preset-modal.css

---

### Sprint 2 Deliverables

✅ ClickToSelectController.js with element selection
✅ CreatePresetModal.js with 4-step workflow
✅ ExportFormatSelector.js for format selection
✅ Designer can mark fields as editable
✅ Designer can configure field metadata
✅ Designer can set export format per page
✅ Preset set can be saved to cloud with all configuration

---

## Sprint 3: End-User Application (Week 5-6)

### 3.1 End-User HTML & Controller

**Priority**: CRITICAL | **Estimated**: 8 hours

- [ ] **Task 3.1.1**: Create end-user.html
  - Copy base structure from index.html
  - Remove designer-specific UI (controls panel)
  - Create minimal layout:
    - Left sidebar (editable fields form)
    - Center canvas preview
    - Bottom thumbnail gallery
    - Export button
  - Link required scripts and CSS
  - **Files**: Create `end-user.html`

- [ ] **Task 3.1.2**: Create EndUserController class
  - Initialize with app reference
  - Add properties: currentPresetSet, canvasInstances, fieldValues
  - **Files**: Create `js/end-user/EndUserController.js`

- [ ] **Task 3.1.3**: Implement role-based routing
  - Check URL parameter `?role=end-user`
  - If end-user role, initialize EndUserController
  - If designer role (default), initialize normal app flow
  - **Files**: app.js or create end-user-app.js

- [ ] **Task 3.1.4**: Implement preset set dropdown
  - Fetch preset sets from Wix (filter by presetType === "set")
  - Populate dropdown with preset names
  - Show page count badge: "(3 pages)", "(3 pages: 1 video)"
  - **Files**: EndUserController.js
  - **Dependencies**: WixPresetAPI

- [ ] **Task 3.1.5**: Implement preset set loading
  - On dropdown selection, load preset set
  - Parse editableFields and pages
  - Create canvas instances
  - Render first page
  - Populate sidebar form
  - Generate thumbnails
  - **Files**: EndUserController.js

- [ ] **Task 3.1.6**: Create canvas instance data structures
  - Define CanvasInstance interface:
    - instanceId (unique)
    - pageId (reference to page in preset)
    - pageName
    - exportFormat
    - exportDuration
    - currentFieldValues (map of fieldId → value)
  - **Files**: EndUserController.js

---

### 3.2 Canvas Instance Management

**Priority**: CRITICAL | **Estimated**: 10 hours

- [ ] **Task 3.2.1**: Create CanvasInstanceManager class
  - Initialize with app reference
  - Add instances array
  - Add currentInstanceId property
  - **Files**: Create `js/end-user/CanvasInstanceManager.js`

- [ ] **Task 3.2.2**: Implement createInstance(pageData)
  - Deep clone page data
  - Generate unique instanceId
  - Initialize currentFieldValues (empty or with defaults)
  - Add to instances array
  - Return instance object
  - **Files**: CanvasInstanceManager.js

- [ ] **Task 3.2.3**: Implement renderInstance(instance)
  - Load page data into canvas
  - Apply all field values from instance.currentFieldValues
  - Call app.render()
  - **Files**: CanvasInstanceManager.js
  - **Dependencies**: PresetManager.deserializeState(), applyFieldValue()

- [ ] **Task 3.2.4**: Implement applyFieldValue(fieldId, value)
  - Find field configuration in editableFields
  - Find all applicable instances (check pageIds)
  - For each instance:
    - Update canvas based on target type
    - Store value in instance.currentFieldValues
  - Re-render affected instances
  - Update thumbnails (debounced)
  - **Files**: CanvasInstanceManager.js

- [ ] **Task 3.2.5**: Implement updateMainTextCell()
  - Find main text cell by cellId in grid
  - Update cell content with value
  - Trigger grid re-layout if needed (hope cell IDs stay stable)
  - Re-render canvas
  - **Files**: CanvasInstanceManager.js

- [ ] **Task 3.2.6**: Implement updateContentCell()
  - Find content cell by cellId in grid
  - Update cell content based on type:
    - Text: update content.text
    - Media: update content.media (load image/video)
  - Re-render canvas
  - **Files**: CanvasInstanceManager.js

- [ ] **Task 3.2.7**: Implement updateBackground()
  - Update background property (color or imageURL)
  - Apply to canvas
  - Re-render canvas
  - **Files**: CanvasInstanceManager.js

- [ ] **Task 3.2.8**: Implement updateInstanceThumbnail() (debounced)
  - Use 500ms debounce
  - Render instance to canvas
  - Generate thumbnail (150x150)
  - Update thumbnail in gallery UI
  - **Files**: CanvasInstanceManager.js

- [ ] **Task 3.2.9**: Implement duplicateInstance(instanceId)
  - Find instance by instanceId
  - Deep clone instance
  - Generate new instanceId
  - Update pageName with "(2)", "(3)", etc.
  - Add to instances array
  - Return new instance
  - **Files**: CanvasInstanceManager.js

---

### 3.3 End-User Sidebar

**Priority**: HIGH | **Estimated**: 10 hours

- [ ] **Task 3.3.1**: Create EndUserSidebar component
  - Initialize with controller reference
  - Create form container
  - **Files**: Create `js/end-user/EndUserSidebar.js`

- [ ] **Task 3.3.2**: Implement auto-form generation
  - Read editableFields from preset set
  - For each field, generate appropriate control
  - Group fields by type or alphabetically
  - **Files**: EndUserSidebar.js

- [ ] **Task 3.3.3**: Reuse existing UI components
  - Import text input component
  - Import textarea component
  - Import file upload component
  - Import color picker component
  - Apply same styling as designer UI
  - **Files**: EndUserSidebar.js

- [ ] **Task 3.3.4**: Implement text field handler
  - Create text input for "text" type fields
  - Set placeholder from field config
  - Set default value from field config
  - Add required indicator (*)
  - On input change, call applyFieldValue()
  - **Files**: EndUserSidebar.js

- [ ] **Task 3.3.5**: Implement textarea field handler
  - Create textarea for "textarea" type fields
  - Set placeholder, default value
  - Add character count (optional)
  - On change, call applyFieldValue()
  - **Files**: EndUserSidebar.js

- [ ] **Task 3.3.6**: Implement media field handler
  - Create file upload button for "media" type fields
  - Show "Browse..." button
  - Show file name when selected
  - On file select, read file as dataURL
  - Call applyFieldValue() with dataURL
  - Handle image and video files
  - **Files**: EndUserSidebar.js

- [ ] **Task 3.3.7**: Implement color field handler
  - Create color picker for "color" type fields
  - Set default color from field config
  - On color change, call applyFieldValue()
  - **Files**: EndUserSidebar.js

- [ ] **Task 3.3.8**: Implement page-specific field visibility
  - Track current selected page/instance
  - Filter fields to show only those with current pageId in pageIds array
  - Show/hide fields when page switches
  - **Files**: EndUserSidebar.js

- [ ] **Task 3.3.9**: Add field validation UI
  - Show required field indicators (*)
  - Show validation errors (red border, error message)
  - Prevent export if required fields empty
  - **Files**: EndUserSidebar.js

- [ ] **Task 3.3.10**: Style end-user sidebar
  - Clean, minimal design
  - Form layout (vertical stack)
  - Field labels (bold)
  - Input styling (consistent with designer)
  - Required indicators
  - **Files**: Create `css/end-user.css`

---

### 3.4 Thumbnail Navigation (End-User)

**Priority**: MEDIUM | **Estimated**: 4 hours

- [ ] **Task 3.4.1**: Reuse PageNavigationUI component
  - Initialize PageNavigationUI in end-user view
  - Pass end-user mode flag (no edit, no add button)
  - **Files**: EndUserController.js
  - **Dependencies**: PageNavigationUI.js

- [ ] **Task 3.4.2**: Display canvas instance thumbnails
  - For each canvas instance, generate thumbnail
  - Show thumbnail in gallery
  - Show page name (non-editable)
  - Show export format indicator
  - **Files**: PageNavigationUI.js (add end-user mode)

- [ ] **Task 3.4.3**: Implement click to preview
  - On thumbnail click, switch to that instance
  - Call renderInstance()
  - Update active indicator
  - Update sidebar (show page-specific fields)
  - **Files**: PageNavigationUI.js, EndUserController.js

- [ ] **Task 3.4.4**: Regenerate thumbnails on field change
  - When field value changes, trigger updateInstanceThumbnail()
  - Use debounced update (500ms)
  - Only update affected instances
  - **Files**: CanvasInstanceManager.js

---

### Sprint 3 Deliverables

✅ end-user.html with minimal interface
✅ EndUserController.js managing flow
✅ CanvasInstanceManager.js handling instances
✅ EndUserSidebar.js with auto-generated form
✅ End-user can select preset set
✅ End-user can fill editable fields
✅ Canvases update in real-time
✅ Thumbnail navigation functional

---

## Sprint 4: Export Functionality (Week 7-8)

### 4.1 Export Manager Foundation

**Priority**: CRITICAL | **Estimated**: 6 hours

- [ ] **Task 4.1.1**: Create ExportManager class
  - Initialize with controller reference
  - Add properties: currentExport, progress
  - **Files**: Create `js/end-user/ExportManager.js`

- [ ] **Task 4.1.2**: Add JSZip library
  - Add JSZip CDN link to end-user.html
  - Test library loading
  - **Files**: end-user.html
  - **CDN**: https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js

- [ ] **Task 4.1.3**: Implement exportAll() orchestration
  - Get all canvas instances
  - Initialize JSZip
  - Loop through instances
  - Call appropriate export method based on format
  - Add to ZIP
  - Generate and download ZIP
  - **Files**: ExportManager.js

- [ ] **Task 4.1.4**: Create progress tracking system
  - Track current step (1/5, 2/5, etc.)
  - Track current operation ("Rendering PNG...", "Recording video...")
  - Emit progress events
  - **Files**: ExportManager.js

---

### 4.2 PNG Export

**Priority**: HIGH | **Estimated**: 4 hours

- [ ] **Task 4.2.1**: Implement exportPNG(instance)
  - Render instance to canvas using renderInstance()
  - Get canvas element
  - Call canvas.toDataURL('image/png')
  - Convert dataURL to Blob
  - Return PNG blob
  - **Files**: ExportManager.js
  - **Dependencies**: CanvasInstanceManager.renderInstance()

- [ ] **Task 4.2.2**: Handle high-resolution export
  - Use resolution setting from ChatoolyConfig
  - Render at 2x or 4x resolution
  - Scale canvas temporarily
  - Generate PNG
  - Restore canvas size
  - **Files**: ExportManager.js

- [ ] **Task 4.2.3**: Test PNG export quality
  - Verify image quality at different resolutions
  - Test with various canvas sizes
  - Check file sizes (should be 1-3 MB)
  - **Files**: Manual testing

---

### 4.3 MP4 Export

**Priority**: HIGH | **Estimated**: 8 hours

- [ ] **Task 4.3.1**: Implement exportMP4(instance, duration)
  - Render instance to canvas
  - Start canvas animations (if present)
  - Create canvas stream
  - Initialize MediaRecorder
  - Record for specified duration
  - Stop animations
  - Return video blob
  - **Files**: ExportManager.js

- [ ] **Task 4.3.2**: Implement MediaRecorder setup
  - Get canvas stream: canvas.captureStream(60)
  - Set mimeType: 'video/webm;codecs=vp9'
  - Check browser support: MediaRecorder.isTypeSupported()
  - Fallback to 'video/webm' if VP9 not supported
  - **Files**: ExportManager.js

- [ ] **Task 4.3.3**: Implement recording lifecycle
  - Handle ondataavailable event (collect chunks)
  - Handle onstop event (create blob)
  - Handle onerror event (throw error)
  - Start recording: recorder.start()
  - Stop after duration: setTimeout(() => recorder.stop(), duration * 1000)
  - **Files**: ExportManager.js

- [ ] **Task 4.3.4**: Handle animation start/stop
  - Check if app.grid.animationManager exists
  - Call app.grid.startAllAnimations() before recording
  - Call app.grid.stopAllAnimations() after recording
  - Ensure animations are playing during recording
  - **Files**: ExportManager.js

- [ ] **Task 4.3.5**: Test video export
  - Test with 3s, 5s, 10s durations
  - Verify animations play smoothly in video
  - Check video file sizes (should be 3-6 MB for 3s)
  - Test browser compatibility (Chrome, Firefox, Safari)
  - **Files**: Manual testing

- [ ] **Task 4.3.6**: Handle MediaRecorder browser compatibility
  - Feature detection for MediaRecorder
  - Show error message if not supported
  - Fallback to PNG-only export in unsupported browsers
  - **Files**: ExportManager.js

---

### 4.4 ZIP Creation & Download

**Priority**: HIGH | **Estimated**: 4 hours

- [ ] **Task 4.4.1**: Implement createZIP(files)
  - Initialize JSZip instance
  - For each file object (name, blob):
    - Add to ZIP: zip.file(name, blob)
  - Generate ZIP with compression
  - Return ZIP blob
  - **Files**: ExportManager.js

- [ ] **Task 4.4.2**: Configure ZIP compression
  - Set type: 'blob'
  - Set compression: 'DEFLATE'
  - Set compression level: 6 (balanced)
  - **Files**: ExportManager.js

- [ ] **Task 4.4.3**: Implement proper file naming
  - Generate filenames: `preset-name-1.png`, `preset-name-2.mp4`, etc.
  - Sanitize preset name (lowercase, replace spaces with hyphens)
  - Handle duplicate names (shouldn't happen with numbering)
  - **Files**: ExportManager.js

- [ ] **Task 4.4.4**: Implement downloadZIP(blob, filename)
  - Create object URL from blob
  - Create <a> element
  - Set href to object URL
  - Set download attribute to filename
  - Trigger click
  - Revoke object URL
  - **Files**: ExportManager.js

- [ ] **Task 4.4.5**: Test ZIP creation
  - Test with mixed formats (2 PNG + 1 MP4)
  - Test with many files (5+ files)
  - Verify ZIP structure (correct filenames)
  - Verify files can be extracted and opened
  - **Files**: Manual testing

---

### 4.5 Export UI

**Priority**: HIGH | **Estimated**: 6 hours

- [ ] **Task 4.5.1**: Add "Export All" button
  - Place button at bottom of end-user sidebar
  - Style as primary action button (large, prominent)
  - On click, call ExportManager.exportAll()
  - **Files**: end-user.html, EndUserSidebar.js

- [ ] **Task 4.5.2**: Create progress indicator component
  - Modal overlay with progress display
  - Show current step (1/5, 2/5, etc.)
  - Show current operation ("Processing Page 2/5 (Middle - Video)...")
  - Show format-specific messages ("🎬 Recording 3s video...")
  - Show checkmarks for completed steps
  - **Files**: Create progress modal in ExportManager.js

- [ ] **Task 4.5.3**: Implement detailed progress updates
  - Update progress after each step
  - Show operation type (Rendering PNG, Recording video)
  - Show file size after each export (2.1 MB)
  - Show total progress (40% complete)
  - **Files**: ExportManager.js

- [ ] **Task 4.5.4**: Implement success message
  - Show after ZIP download completes
  - Display:
    - "✅ Export complete!"
    - Number of files exported
    - Total ZIP size
    - Download filename
  - Auto-dismiss after 5 seconds
  - **Files**: ExportManager.js

- [ ] **Task 4.5.5**: Implement error handling
  - Catch errors during export
  - Show user-friendly error messages
  - Log detailed errors to console
  - Allow retry or cancel
  - **Files**: ExportManager.js

- [ ] **Task 4.5.6**: Style progress indicator
  - Modal centered on screen
  - Progress bar or spinner
  - Step list with checkmarks
  - File size display
  - Clean, professional appearance
  - **Files**: end-user.css

---

### 4.6 Session Persistence

**Priority**: MEDIUM | **Estimated**: 4 hours

- [ ] **Task 4.6.1**: Implement session storage save
  - On field value change, save to sessionStorage
  - Save key: 'chatooly-end-user-data'
  - Save data: presetId, fieldValues, canvasInstances, lastModified
  - Debounce saves (save after 1s of inactivity)
  - **Files**: EndUserController.js

- [ ] **Task 4.6.2**: Implement session restore
  - On page load, check sessionStorage for saved data
  - If found, parse data
  - Load preset set by presetId
  - Restore field values
  - Restore canvas instances (recreate from pages)
  - Render first instance
  - **Files**: EndUserController.js

- [ ] **Task 4.6.3**: Implement session clear
  - After successful export, optionally clear sessionStorage
  - Add "Clear Session" button (optional)
  - Clear on preset set change (warn user first)
  - **Files**: EndUserController.js

- [ ] **Task 4.6.4**: Handle session expiration
  - Check lastModified timestamp
  - If older than 24 hours, discard session
  - Show message: "Session expired, please start over"
  - **Files**: EndUserController.js

---

### Sprint 4 Deliverables

✅ ExportManager.js with multi-format support
✅ JSZip integration working
✅ PNG export functional
✅ MP4 export functional (WebM format)
✅ ZIP creation and download working
✅ Progress indicators showing detailed status
✅ Session persistence implemented
✅ End-to-end export workflow complete
✅ **MVP READY FOR LAUNCH**

---

## Phase II - Enhancements (Future Sprints)

### Sprint 5: Canvas Management (Week 9-10)

- [ ] Implement page duplication with "⋮" menu
- [ ] Implement page deletion with confirmation
- [ ] Implement drag-to-reorder thumbnails
- [ ] Handle instance renaming (Middle → Middle (2))

### Sprint 6: Advanced Fields & Validation (Week 11-12)

- [ ] Implement color palette fields (preset color options)
- [ ] Implement dropdown fields (designer-specified options)
- [ ] Implement field validation (required, character limits, file size)
- [ ] Show validation errors before export

### Sprint 7: UI/UX Polish (Week 13-14)

- [ ] Add skeleton loaders for preset loading
- [ ] Implement smooth page transitions
- [ ] Add field grouping in sidebar (collapsible sections)
- [ ] Make end-user interface responsive/mobile-friendly

### Sprint 8: Performance Optimization (Week 15-16)

- [ ] Implement debounced canvas updates (already specified: 500ms)
- [ ] Batch update shared fields
- [ ] Lazy-load non-active canvas instances
- [ ] Optimize thumbnail generation (lower resolution)
- [ ] Parallelize PNG exports
- [ ] Add cancel export functionality

---

## Testing Checklist

### Unit Tests (Optional)

- [ ] PresetSetManager.addPage()
- [ ] PresetSetManager.removePage()
- [ ] PresetSetManager.loadPage()
- [ ] CanvasInstanceManager.applyFieldValue()
- [ ] ExportManager.exportPNG()
- [ ] ExportManager.exportMP4()

### Integration Tests

- [ ] Create multi-page preset → save → load → verify all pages intact
- [ ] Configure editable fields → save → load → verify fields in end-user view
- [ ] Fill fields in end-user view → verify canvas updates
- [ ] Export mixed formats → verify ZIP contains correct files
- [ ] Session persistence → reload page → verify data restored

### End-to-End Tests

- [ ] **Designer Flow**: Create preset set → configure fields → save
- [ ] **End-User Flow**: Select preset → fill fields → export
- [ ] **Mixed Formats**: Export with 2 PNG + 1 MP4 → verify ZIP
- [ ] **Page Duplication**: Duplicate page → fill different data → export
- [ ] **Session Restore**: Fill fields → reload page → verify data persists

### Browser Compatibility Tests

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest) - especially MediaRecorder
- [ ] Edge (latest)

### Performance Tests

- [ ] Page switch time (target: < 500ms)
- [ ] Field update to render time (target: < 100ms)
- [ ] PNG export time (target: < 2s per image)
- [ ] MP4 export time (target: < 5s for 3s video)
- [ ] Total export time for 5 canvases (target: < 20s)

---

## Deployment Checklist

### Pre-Launch

- [ ] All Sprint 1-4 tasks completed
- [ ] End-to-end testing passed
- [ ] Browser compatibility verified
- [ ] Performance metrics met
- [ ] Documentation complete (this file + design doc)

### Launch

- [ ] Deploy to Wix
- [ ] Configure Wix collections (Presets)
- [ ] Test on production environment
- [ ] Monitor for errors
- [ ] Collect user feedback

### Post-Launch

- [ ] Fix critical bugs (P0)
- [ ] Plan Phase II features based on feedback
- [ ] Optimize performance bottlenecks
- [ ] Add requested features to backlog

---

## Notes & Decisions

### Design Decisions Made

1. **Grid Cell ID Stability**: Hope for the best, don't lock grid
2. **Thumbnail Update Frequency**: Debounced 500ms
3. **Page Duplication**: Deep copy (independent instance)
4. **Export Format**: WebM for Phase I, MP4 conversion in Phase II
5. **No Backward Compatibility**: Fresh start, no legacy support

### Open Questions

1. **Video Format**: Start with WebM, add MP4 conversion if users need it
2. **Recording Strategy**: Try Chatooly CDN video export first, fallback to MediaRecorder
3. **Page Duplication UI**: Always duplicate by default, add choice modal in Phase II
4. **Export Resolution**: Fixed 2x from config, add options in Phase II

---

## Timeline Summary

| Sprint | Dates | Focus | Deliverable |
|--------|-------|-------|-------------|
| Sprint 1 | Week 1-2 | Multi-Page Foundation | Page management working |
| Sprint 2 | Week 3-4 | Field Configuration | Click-to-select + modal |
| Sprint 3 | Week 5-6 | End-User App | Form + canvas instances |
| Sprint 4 | Week 7-8 | Export | Multi-format ZIP export |
| **LAUNCH** | **End of Week 8** | **MVP Complete** | **Production Ready** |

---

**End of Task List**
