# End-User Preset Rendering - Complete Design Document

**Author**: Claude Code
**Date**: 2025-01-06
**Status**: Design Phase
**Related Branch**: `locked-presets`

---

## 🎯 Executive Summary

This document specifies the complete architecture for end-user preset rendering, where users fill content slots within locked grid layouts. The key distinction from designer mode is that **grid structure is frozen** while **content updates within fixed boundaries**.

---

## 📊 System Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        END-USER WORKFLOW                         │
└─────────────────────────────────────────────────────────────────┘

1. SELECT PRESET
   ↓
   EndUserController.loadPreset(presetId)
   ↓
   Fetch preset data from Wix CMS
   ↓
2. DISPLAY PAGES
   ↓
   For each page: EndUserController.renderCurrentPage()
   ↓
   ContentSlotRenderer.renderLockedLayout(pageData, contentData)
   ↓
3. USER EDITS FORM
   ↓
   FormGenerator displays content slot fields in sidebar
   ↓
   User changes value → EndUserController.handleContentUpdate()
   ↓
4. RE-RENDER CANVAS
   ↓
   ContentSlotRenderer updates canvas with new content
   ↓
5. EXPORT
   ↓
   Generate final images/videos with user content
```

---

## 🔑 Core Concept: Content Slot → Cell Mapping

### Data Structure

**Designer View - Creating Content Slots:**

```javascript
// Designer clicks "unlock" on a cell
cell = {
  id: "content-cell-5",              // Changes on grid rebuild
  contentId: "a3f2b9c1-xxxx-...",    // ✅ PERSISTENT UUID
  type: "content",
  bounds: {x: 600, y: 150, width: 400, height: 400},
  content: {
    imageURL: "designer-uploaded-image.jpg",
    contentType: "media"
  }
}

// ContentSlotManager creates slot
slot = {
  slotId: "content-cell-5-slot",
  sourceElement: "content-cell-5",
  sourceContentId: "a3f2b9c1-xxxx-...",  // ✅ MAPS TO cell.contentId
  type: "image",

  // Fixed bounding box (NEVER changes)
  boundingBox: {
    x: 600,
    y: 150,
    width: 400,
    height: 400
  },

  // Designer-configured constraints
  constraints: {
    imageFillMode: "crop",  // or "free"
    required: true
  },

  // Form metadata
  fieldName: "teamPhoto",
  fieldLabel: "Team Photo",
  fieldDescription: "Upload team photo (square format recommended)"
}

// Save to preset
pageData = {
  pageName: "Opening Page",
  canvas: {width: 1920, height: 1080},
  background: {...},
  grid: {
    snapshot: {
      layout: {
        cells: [cell, ...]  // All cells with their contentId UUIDs
      }
    }
  },
  contentSlots: [slot, ...]  // All editable slots
}
```

**End-User View - Loading and Rendering:**

```javascript
// Load preset from CMS
pageData = await presetPageManager.getPresetFromCMS(presetId);

// User fills form
contentData = {
  "content-cell-5-slot": "user-uploaded-image-base64..."
}

// Render process
ContentSlotRenderer.renderLockedLayout(pageData, contentData) {
  // 1. Render ALL cells from grid snapshot
  for (cell of pageData.grid.snapshot.layout.cells) {
    renderCell(cell);  // Shows designer content
  }

  // 2. Render content slots ON TOP (❌ CURRENT - WRONG)
  // This creates double rendering!
  for (slot of pageData.contentSlots) {
    if (contentData[slot.slotId]) {
      renderContentSlot(slot, contentData[slot.slotId]);
    }
  }
}
```

### The Problem: Double Rendering

**Current flow renders content twice:**
1. Base layer: Designer's cell content
2. Top layer: User's content slot content

**Example:**
- Designer places image at (600, 150)
- Creates content slot for that cell
- End-user uploads new image
- Result: Designer image visible underneath user image → visual artifacts!

---

## ✅ Solution: Replace Mode Rendering

### New Architecture

```javascript
ContentSlotRenderer.renderLockedLayout(pageData, contentData) {
  // STEP 1: Build content slot → cell mapping
  const contentSlotCellMap = new Map();
  for (const slot of pageData.contentSlots) {
    contentSlotCellMap.set(slot.sourceContentId, slot);
  }

  // STEP 2: Render cells (SKIP cells with content slots)
  for (const cell of pageData.grid.snapshot.layout.cells) {
    if (contentSlotCellMap.has(cell.contentId)) {
      // This cell has a content slot
      const slot = contentSlotCellMap.get(cell.contentId);

      if (contentData[slot.slotId]) {
        // User provided content → SKIP cell, render slot instead
        continue;
      } else {
        // No user content → show designer's original
        await renderCell(cell);
      }
    } else {
      // No content slot → always render designer content
      await renderCell(cell);
    }
  }

  // STEP 3: Render content slots with user data
  for (const slot of pageData.contentSlots) {
    if (contentData[slot.slotId]) {
      await renderContentSlot(slot, contentData[slot.slotId]);
    }
  }
}
```

### Rendering Logic Decision Tree

```
For each cell in grid.snapshot.layout.cells:

┌─────────────────────────────────────────────┐
│ Does cell have a content slot?             │
│ (check cell.contentId in contentSlots)     │
└─────────────────────────────────────────────┘
         │
         ├─── NO ──→ Render cell as-is (locked designer content)
         │
         └─── YES
                │
                ├─────────────────────────────────────┐
                │ Did user provide content?           │
                │ (check contentData[slot.slotId])    │
                └─────────────────────────────────────┘
                         │
                         ├─── NO ──→ Render cell (show designer default)
                         │
                         └─── YES ──→ SKIP cell, render content slot with user data
```

---

## 🎨 Content Slot Rendering Specifications

### Text Slots

**Requirements:**
- Text renders at slot's `boundingBox` position
- Auto-scales between `minFontSize` and `maxFontSize`
- Auto-wraps to fit slot width
- Uses designer's font family, weight, color
- Grid does NOT resize

**Current Implementation:** ✅ Correct!
- [ContentSlotRenderer.js:309-368](js/enduser/ContentSlotRenderer.js#L309-L368)
- Binary search for optimal font size
- `wrapText()` method handles line breaks
- Respects `maxCharacters` constraint

**Example:**
```javascript
slot.constraints = {
  fontFamily: "Wix Madefor Display",
  fontWeight: "600",
  color: "#FFFFFF",
  minFontSize: 24,
  maxFontSize: 48,
  maxCharacters: 50,
  align: "center",
  verticalAlign: "middle",
  lineHeight: 1.2
}

// User enters: "Welcome to Our Amazing Company Culture and Team"
// → Auto-scales to ~32px (calculated)
// → Wraps into 2 lines to fit slot width
// → Truncates at 50 characters if needed
```

### Image Slots

**Requirements:**
- Image renders at slot's `boundingBox` position
- Two modes based on `constraints.imageFillMode`

#### Mode 1: Crop (Fill to Slot)
```javascript
constraints.imageFillMode = "crop"

// Behavior:
// - Crops and fills entire boundingBox
// - Maintains aspect ratio
// - Centers crop (like CSS object-fit: cover)

// Example:
// Slot: 400x400 (square)
// User uploads: 300x600 (vertical)
// Result: Crops to 400x400, centered crop
```

**Implementation:**
```javascript
drawImageCover(img, boundingBox) {
  const {x, y, width, height} = boundingBox;
  const imgRatio = img.width / img.height;
  const boxRatio = width / height;

  let sourceWidth, sourceHeight, sourceX, sourceY;

  if (imgRatio > boxRatio) {
    // Image wider than box → crop sides
    sourceHeight = img.height;
    sourceWidth = img.height * boxRatio;
    sourceX = (img.width - sourceWidth) / 2;
    sourceY = 0;
  } else {
    // Image taller than box → crop top/bottom
    sourceWidth = img.width;
    sourceHeight = img.width / boxRatio;
    sourceX = 0;
    sourceY = (img.height - sourceHeight) / 2;
  }

  ctx.drawImage(
    img,
    sourceX, sourceY, sourceWidth, sourceHeight,  // Source crop
    x, y, width, height                            // Destination
  );
}
```

#### Mode 2: Free (No Crop)
```javascript
constraints.imageFillMode = "free"

// Behavior:
// - Places image at slot position
// - Maintains original aspect ratio
// - Scales to fit within boundingBox (letterbox if needed)
// - Does NOT crop

// Example:
// Slot: 400x400 (square)
// User uploads: 300x600 (vertical)
// Result: Scales to 200x400, centered at (x+100, y)
```

**Implementation:**
```javascript
drawImageFree(img, boundingBox) {
  const {x, y, width, height} = boundingBox;
  const imgRatio = img.width / img.height;
  const boxRatio = width / height;

  let drawWidth, drawHeight, drawX, drawY;

  if (imgRatio > boxRatio) {
    // Image wider → fit to width
    drawWidth = width;
    drawHeight = width / imgRatio;
    drawX = x;
    drawY = y + (height - drawHeight) / 2;
  } else {
    // Image taller → fit to height
    drawHeight = height;
    drawWidth = height * imgRatio;
    drawX = x + (width - drawWidth) / 2;
    drawY = y;
  }

  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
}
```

---

## 🖼️ Canvas & Layout Specifications

### Canvas Aspect Ratio

**Requirement:** Canvas should maintain preset's aspect ratio and be centered

**Current State:**
- Canvas container uses flexbox centering ✅
- Canvas dimensions set from `pageData.canvas.width/height` ✅
- Already centered in [enduser.css:186-209](css/enduser.css#L186-L209)

**No changes needed!** Already correct.

### Page Thumbnail Centering

**Requirement:** Center page thumbnails at bottom navigation

**Current State:**
```css
/* enduser.css:260-270 */
.enduser-page-nav {
    display: flex;
    justify-content: space-between; /* ❌ WRONG */
}
```

**Fix:**
```css
.enduser-page-nav {
    display: flex;
    justify-content: center; /* ✅ CENTER */
}
```

---

## 🔄 Complete Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                     DESIGNER MODE (index.html)                    │
└──────────────────────────────────────────────────────────────────┘

User edits grid
    ↓
Changes grid structure (cells resize/move)
    ↓
User clicks "lock" icon on cell
    ↓
ContentSlotManager.createSlotFromCell(cell, config)
    ↓
Creates slot with:
  - sourceContentId: cell.contentId (persistent UUID)
  - boundingBox: current cell position (frozen!)
  - constraints: {imageFillMode, minFontSize, maxFontSize, etc.}
    ↓
PresetPageManager.captureCurrentPage()
    ↓
Saves pageData:
  {
    canvas: {width, height},
    background: {...},
    grid: {snapshot: {layout: {cells: [...]}}},
    contentSlots: [slot1, slot2, ...]
  }
    ↓
Save to Wix CMS via WixMultiPagePresetAdapter


┌──────────────────────────────────────────────────────────────────┐
│                     END-USER MODE (enduser.html)                  │
└──────────────────────────────────────────────────────────────────┘

User clicks "Browse Presets"
    ↓
EndUserController.showPresetModal()
    ↓
Fetch presets from Wix CMS
    ↓
User selects preset
    ↓
EndUserController.loadPreset(presetData)
    ↓
Store: this.presetData = presetData
    ↓
EndUserController.renderCurrentPage(pageIndex)
    ↓
pageData = this.presetData.pages[pageIndex]
contentData = this.contentData (user form inputs)
    ↓
ContentSlotRenderer.renderLockedLayout(pageData, contentData)
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ RENDERING ALGORITHM (NEW):                                      │
│                                                                  │
│ 1. Build contentSlot → cell mapping (via sourceContentId)       │
│ 2. For each cell in grid.snapshot.layout.cells:                 │
│    - Check if cell.contentId matches any slot.sourceContentId   │
│    - If YES and user provided content:                          │
│        → SKIP cell rendering                                     │
│    - Otherwise:                                                  │
│        → Render cell (designer content)                          │
│ 3. For each slot in contentSlots:                               │
│    - If contentData[slot.slotId] exists:                        │
│        → Render content slot with user data                      │
│          (text with auto-scale, or image with crop/free mode)    │
└─────────────────────────────────────────────────────────────────┘
    ↓
Canvas displays: Locked grid + user content in fixed slots
    ↓
User edits form in sidebar
    ↓
EndUserController.handleContentUpdate(slotId, value)
    ↓
Update this.contentData[slotId] = value
    ↓
Re-render: ContentSlotRenderer.renderLockedLayout(pageData, contentData)
```

---

## 🛠️ Implementation Plan

### Phase 1A: Core Data Structure Fixes (Critical - Do First!)

**1. Fix SlotId Namespacing**

**Files to Modify:**
- `js/enduser/EndUserController.js`

**Changes:**
```javascript
// In loadPreset() - Namespace slotIds by page number
async loadPreset(presetId) {
    // ... existing code ...

    // Parse and namespace all pages
    this.loadedPages = [];
    for (let i = 1; i <= 5; i++) {
        const pageField = `page${i}`;
        if (this.currentPresetData[pageField]) {
            const pageData = JSON.parse(this.currentPresetData[pageField]);

            // ✅ NAMESPACE: Add page prefix to all slotIds
            if (pageData.contentSlots) {
                pageData.contentSlots = pageData.contentSlots.map(slot => ({
                    ...slot,
                    slotId: `page${i}-${slot.slotId}`,
                    originalSlotId: slot.slotId  // Keep original for reference
                }));
            }

            this.loadedPages.push(pageData);
        }
    }
}
```

**2. Fix FormGenerator Data Structure**

**Files to Modify:**
- `js/enduser/EndUserController.js`

**Changes:**
```javascript
// In renderCurrentPage() - Pass contentSlots (not slots)
async renderCurrentPage() {
    const pageData = this.loadedPages[this.currentPageIndex];

    // ✅ FIX: FormGenerator expects contentSlots
    this.formGenerator.generateForm({
        pageName: pageData.pageName,
        pageNumber: pageData.pageNumber,
        slots: pageData.contentSlots  // ← Map contentSlots to slots for FormGenerator
    }, (slotId, value) => {
        this.handleContentUpdate(slotId, value);
    });

    // Render canvas
    await this.contentSlotRenderer.renderLockedLayout(pageData, this.contentData);
}
```

**3. Implement Local Auto-save**

**Files to Modify:**
- `js/enduser/EndUserController.js`

**Changes:**
```javascript
// Add localStorage methods
class EndUserController {
    constructor() {
        // ... existing code ...
        this.localStorageKey = 'chatooly-enduser-content-data';
        this.loadContentDataFromLocalStorage();
    }

    loadContentDataFromLocalStorage() {
        try {
            const saved = localStorage.getItem(this.localStorageKey);
            if (saved) {
                this.contentData = JSON.parse(saved);
                console.log('✅ Loaded saved content data from localStorage');
            }
        } catch (error) {
            console.warn('⚠️ Failed to load from localStorage:', error);
        }
    }

    saveContentDataToLocalStorage() {
        try {
            localStorage.setItem(this.localStorageKey, JSON.stringify(this.contentData));
            console.log('💾 Auto-saved to localStorage');
        } catch (error) {
            console.error('❌ Failed to save to localStorage:', error);
        }
    }

    handleContentUpdate(slotId, value) {
        console.log(`📝 Content update: ${slotId}`, value);

        // Store content data
        this.contentData[slotId] = value;

        // ✅ AUTO-SAVE to localStorage
        this.saveContentDataToLocalStorage();

        // Re-render canvas with debounce (see Phase 1B)
        this.debouncedRender();
    }
}
```

### Phase 1B: Debounced Rendering

**Files to Modify:**
- `js/enduser/EndUserController.js`

**Changes:**

1. **Add debounce utility and method:**
```javascript
class EndUserController {
    constructor() {
        // ... existing code ...
        this.renderDebounceTimer = null;
        this.debouncedRender = this.createDebouncedRender();
    }

    createDebouncedRender() {
        return () => {
            // Clear existing timer
            if (this.renderDebounceTimer) {
                clearTimeout(this.renderDebounceTimer);
            }

            // Set new timer (300ms delay)
            this.renderDebounceTimer = setTimeout(() => {
                const pageData = this.loadedPages[this.currentPageIndex];
                this.contentSlotRenderer.renderLockedLayout(pageData, this.contentData);
                console.log('🎨 Canvas re-rendered (debounced)');
            }, 300);
        };
    }
}
```

### Phase 1C: Form Pre-population with Defaults

**Files to Modify:**
- `js/enduser/FormGenerator.js`

**Changes:**
```javascript
buildTextFieldHTML(slot, fieldId, requiredIndicator) {
    const maxChars = slot.constraints?.maxCharacters || 500;
    const placeholder = slot.placeholder || `Enter ${slot.fieldLabel.toLowerCase()}...`;
    const hint = slot.hint || `Maximum ${maxChars} characters`;

    // ✅ PRE-POPULATE: Use defaultContent if available
    const defaultValue = slot.defaultContent?.text || '';

    const isMultiline = slot.constraints?.multiline !== false;

    if (isMultiline) {
        return `
            <textarea
                id="${fieldId}"
                class="form-textarea"
                data-slot-id="${slot.slotId}"
                data-max-chars="${maxChars}"
                placeholder="${placeholder}"
                rows="4"
            >${defaultValue}</textarea>
            <!-- Character counter will update on page load -->
        `;
    } else {
        return `
            <input
                type="text"
                id="${fieldId}"
                class="form-input"
                data-slot-id="${slot.slotId}"
                data-max-chars="${maxChars}"
                placeholder="${placeholder}"
                value="${defaultValue}"
            />
        `;
    }
}

buildImageFieldHTML(slot, fieldId, requiredIndicator) {
    // ✅ PRE-POPULATE: Show designer's image if available
    const defaultImageURL = slot.defaultContent?.imageURL || null;
    const hint = slot.hint || 'Supported: PNG, JPG, GIF, WebP, Video';

    let previewHTML = '';
    if (defaultImageURL) {
        previewHTML = `
            <div class="image-preview" id="${fieldId}-preview">
                <img src="${defaultImageURL}" alt="Default image" />
                <button type="button" class="image-remove-btn" data-field-id="${fieldId}">
                    ✕
                </button>
            </div>
        `;
    }

    return `
        <div class="form-group">
            <label class="form-label">
                ${slot.fieldLabel}
                ${requiredIndicator}
            </label>
            <button type="button" class="image-upload-btn" id="${fieldId}-btn" data-slot-id="${slot.slotId}">
                📁 Choose File
            </button>
            <input
                type="file"
                id="${fieldId}"
                class="image-upload-input"
                data-slot-id="${slot.slotId}"
                accept="image/*,video/*"
                style="display: none;"
            />
            ${previewHTML}
            <span class="form-hint">${hint}</span>
        </div>
    `;
}

// ✅ NEW: Initialize form with default values in contentData
attachEventListeners(slots) {
    // ... existing event listener code ...

    // Initialize contentData with defaults if not already set
    slots.forEach(slot => {
        if (!this.onChangeCallback) return;

        // Check if user has already provided content
        // (This would come from localStorage auto-save)
        const fieldId = `field-${slot.slotId}`;
        const field = document.getElementById(fieldId);

        if (field && field.value && slot.defaultContent) {
            // Trigger callback to populate contentData with default
            this.onChangeCallback(slot.slotId, field.value);
        }
    });
}
```

### Phase 1D: Fix Content Slot Rendering (Core Fix!)

**Files to Modify:**
- `js/enduser/ContentSlotRenderer.js`

**Changes:**

1. **Add method to build content slot mapping:**
```javascript
buildContentSlotCellMap(contentSlots) {
    const map = new Map();
    for (const slot of contentSlots) {
        // Use originalSlotId to get the sourceContentId (before namespacing)
        const sourceContentId = slot.sourceContentId;
        if (sourceContentId) {
            map.set(sourceContentId, slot);
        }
    }
    return map;
}
```

2. **Modify `renderLockedLayout()` to skip cells with filled slots:**
```javascript
async renderLockedLayout(pageData, contentData) {
    console.log(`🎨 Rendering locked layout for: ${pageData.pageName}`);

    // Apply background and canvas dimensions
    await this.applyPageStateToCanvas(pageData);

    // ✅ Build content slot → cell mapping
    const contentSlotMap = this.buildContentSlotCellMap(pageData.contentSlots || []);

    // Render grid cells (skip cells with filled content slots)
    if (pageData.grid?.snapshot?.layout?.cells) {
        const cells = pageData.grid.snapshot.layout.cells;
        console.log(`📦 Rendering ${cells.length} grid cells`);

        const cellRenderer = new CellRenderer(this.ctx);

        for (const cell of cells) {
            // ✅ Check if this cell has a content slot
            const slot = contentSlotMap.get(cell.contentId);

            if (slot && contentData[slot.slotId]) {
                // User provided content for this slot → SKIP cell
                console.log(`⏭️  Skipping cell ${cell.id} (has content slot with user data)`);
                continue;
            }

            // Render cell (either no slot, or no user data yet)
            try {
                await this.renderCell(cell, cellRenderer, this.canvasManager);
            } catch (error) {
                console.warn(`⚠️ Failed to render cell ${cell.id}:`, error);
            }
        }

        console.log('✅ Grid cells rendered');
    }

    // ✅ Render content slots with user data ON TOP
    if (pageData.contentSlots && pageData.contentSlots.length > 0) {
        await this.renderContentSlots(pageData.contentSlots, contentData);
    }

    console.log('✅ Layout rendered');
}
```

### Phase 2: Page Thumbnail Centering (Quick Win)

**Files to Modify:**
- `css/enduser.css`

**Changes:**
```css
/* Line 260-270 */
.enduser-page-nav {
    height: 120px;
    background: var(--chatooly-color-surface, #1a1a1a);
    border-top: 1px solid var(--chatooly-color-border, #3a3a3a);
    display: flex;
    align-items: center;
    justify-content: center; /* ✅ CHANGED from space-between */
    padding: 0 24px;
    flex-shrink: 0;
    overflow: hidden;
}
```

### Phase 3: Export Functionality

**Files to Modify:**
- `js/enduser/EndUserController.js`

**Changes:**

Add export methods with options for current page vs all pages:

```javascript
async exportCurrentPage() {
    const pageData = this.loadedPages[this.currentPageIndex];

    // Validate required fields
    if (!this.validatePage(pageData)) {
        alert('Please fill all required fields before exporting.');
        return;
    }

    // Render final canvas
    await this.contentSlotRenderer.renderLockedLayout(pageData, this.contentData);

    // Determine format based on content
    const hasAnimations = this.checkForAnimations(pageData);
    const hasVideo = this.checkForVideo(pageData);

    if (hasAnimations || hasVideo) {
        // Export as video
        await this.exportPageAsVideo(pageData);
    } else {
        // Export as PNG
        this.exportPageAsImage(pageData);
    }
}

async exportAllPages() {
    // Validate all pages
    for (const pageData of this.loadedPages) {
        if (!this.validatePage(pageData)) {
            alert(`Please fill all required fields on all pages before exporting.`);
            return;
        }
    }

    // Show export format selection modal
    const format = await this.showExportFormatModal(); // 'images' or 'video'

    if (format === 'images') {
        await this.exportAllPagesAsImages();
    } else {
        await this.exportAllPagesAsVideo();
    }
}

validatePage(pageData) {
    if (!pageData.contentSlots) return true;

    for (const slot of pageData.contentSlots) {
        if (slot.required && !this.contentData[slot.slotId]) {
            return false;
        }
    }

    return true;
}

exportPageAsImage(pageData) {
    const dataURL = this.canvasManager.canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${pageData.pageName || 'page'}.png`;
    link.href = dataURL;
    link.click();
    console.log('✅ Exported page as PNG');
}

// ... Additional export methods ...
```

---

## 📋 Implementation Checklist

### Phase 1A: Core Data Structure Fixes
- [ ] Implement slotId namespacing (page prefix)
- [ ] Fix FormGenerator to use contentSlots
- [ ] Implement localStorage auto-save
- [ ] Test: SlotIds are unique across pages
- [ ] Test: Auto-save persists after refresh

### Phase 1B: Debounced Rendering
- [ ] Add debounce timer to EndUserController
- [ ] Implement debouncedRender() method
- [ ] Test: No lag when typing rapidly
- [ ] Test: Canvas updates after 300ms delay

### Phase 1C: Form Pre-population
- [ ] Pre-fill text fields with defaultContent
- [ ] Show default images in image fields
- [ ] Initialize contentData on form load
- [ ] Test: Defaults appear correctly
- [ ] Test: Defaults can be overwritten

### Phase 1D: Content Slot Rendering Fix
- [ ] Implement buildContentSlotCellMap()
- [ ] Modify renderLockedLayout() with skip logic
- [ ] Test: No double rendering
- [ ] Test: Empty slots show designer content
- [ ] Test: Filled slots show user content

### Phase 2: Thumbnail Centering
- [ ] Update CSS justify-content
- [ ] Test: Thumbnails centered at bottom

### Phase 3: Export Functionality
- [ ] Implement exportCurrentPage()
- [ ] Implement exportAllPages()
- [ ] Add format selection modal
- [ ] Add validation before export
- [ ] Test: Single page PNG export
- [ ] Test: All pages PNG export
- [ ] Test: Video export (with animations)

---

## 🎯 Priority Order

**Week 1: Critical Fixes**
1. Phase 1A: Data structure fixes (namespacing, auto-save)
2. Phase 1D: Content slot rendering fix (no double rendering)
3. Phase 2: Thumbnail centering (quick win)

**Week 2: UX Improvements**
4. Phase 1B: Debounced rendering (performance)
5. Phase 1C: Form pre-population (UX)

**Week 3: Export**
6. Phase 3: Export functionality (complete workflow)

2. **Modify `renderLockedLayout()` method:**
```javascript
async renderLockedLayout(pageData, contentData) {
    console.log(`🎨 Rendering locked layout for: ${pageData.pageName}`);

    // Apply background and canvas dimensions
    await this.applyPageStateToCanvas(pageData);

    // Build content slot → cell mapping
    const contentSlotMap = this.buildContentSlotCellMap(pageData.contentSlots || []);

    // Render grid cells (skip cells with filled content slots)
    if (pageData.grid?.snapshot?.layout?.cells) {
        const cells = pageData.grid.snapshot.layout.cells;
        console.log(`📦 Rendering ${cells.length} grid cells`);

        const cellRenderer = new CellRenderer(this.ctx);

        for (const cell of cells) {
            // Check if this cell has a content slot
            const slot = contentSlotMap.get(cell.contentId);

            if (slot && contentData[slot.slotId]) {
                // User provided content for this slot → SKIP cell
                console.log(`⏭️  Skipping cell ${cell.id} (has content slot with user data)`);
                continue;
            }

            // Render cell (either no slot, or no user data yet)
            try {
                await this.renderCell(cell, cellRenderer, this.canvasManager);
            } catch (error) {
                console.warn(`⚠️ Failed to render cell ${cell.id}:`, error);
            }
        }

        console.log('✅ Grid cells rendered');
    }

    // Render content slots with user data ON TOP
    if (pageData.contentSlots && pageData.contentSlots.length > 0) {
        await this.renderContentSlots(pageData.contentSlots, contentData);
    }

    console.log('✅ Layout rendered');
}
```

3. **Verify image rendering modes:**
- Check `drawImageCover()` implements correct crop logic
- Check `drawImageFree()` maintains aspect ratio without crop
- Add logging for debugging

### Phase 2: Fix Page Thumbnail Centering (Low Priority)

**Files to Modify:**
- `css/enduser.css`

**Changes:**
```css
/* Line 260-270 */
.enduser-page-nav {
    height: 120px;
    background: var(--chatooly-color-surface, #1a1a1a);
    border-top: 1px solid var(--chatooly-color-border, #3a3a3a);
    display: flex;
    align-items: center;
    justify-content: center; /* ✅ CHANGED from space-between */
    padding: 0 24px;
    flex-shrink: 0;
    overflow: hidden;
}
```

### Phase 3: Testing & Validation

**Test Cases:**

1. **Text Slot Rendering:**
   - [ ] Text scales between min/max font sizes
   - [ ] Text wraps correctly within slot width
   - [ ] Text respects maxCharacters limit
   - [ ] Font family, weight, color match designer settings
   - [ ] Grid does not resize when text changes

2. **Image Slot Rendering (Crop Mode):**
   - [ ] Square image in square slot → fills perfectly
   - [ ] Vertical image in square slot → crops top/bottom
   - [ ] Horizontal image in square slot → crops left/right
   - [ ] Image centered correctly in crop

3. **Image Slot Rendering (Free Mode):**
   - [ ] Square image in square slot → fills perfectly
   - [ ] Vertical image in square slot → letterboxes (centered)
   - [ ] Horizontal image in square slot → letterboxes (centered)
   - [ ] No cropping occurs

4. **Content Slot → Cell Mapping:**
   - [ ] Correct cell is replaced by content slot
   - [ ] No double rendering
   - [ ] Cells without slots render normally
   - [ ] Empty slots show designer default content

5. **Page Navigation:**
   - [ ] Thumbnails centered at bottom
   - [ ] Active page highlighted
   - [ ] Clicking thumbnail loads correct page

---

## 🎯 Workflow Specifications

### Form Generation
- **Data Structure**: FormGenerator expects `pageData.contentSlots` (not `slots`)
- **Pre-population**: Form fields pre-filled with designer's default content
- **Real-time Updates**: Canvas updates as user types (debounced 300ms)

### Content Data Management
- **Scope**: Global `contentData` object for entire preset
- **SlotId Naming**: Page-namespaced format: `"page{N}-{originalSlotId}"`
  - Example: `"page1-text-cell-1-slot"`, `"page2-image-cell-5-slot"`
- **Persistence**: Auto-save to localStorage on every change
- **Reset**: Per-field reset button to restore designer defaults

### Page Navigation
- **Order**: User can fill pages in any order (non-linear)
- **Auto-save**: All changes auto-saved immediately (no "save" button needed)
- **No warnings**: Switching pages doesn't show warnings (auto-saved)
- **Completion badges**: Visual indicators for filled vs empty pages (future)

### Validation
- **Timing**: Real-time validation as user types
- **Required fields**: Show indicator, validate before export
- **Character limits**: Enforce maxCharacters, show counter
- **Image formats**: Support all formats (PNG, JPG, GIF, WebP, video)

### Export Options
1. **Export All Pages**:
   - Format: PNG images or video (if animations/video present)
   - Exports all pages in sequence
2. **Export Current Page**:
   - Format: Single PNG image or video
   - Exports only active page

### Performance
- **Debounced Rendering**: 300ms delay after user stops typing
- **Image Optimization**: Auto-resize large images to canvas dimensions
- **Incremental Updates**: Only re-render affected content slots

---

## 📝 Future Enhancements

### Phase 4: Color Slot Support (Future)
- Allow end-users to change colors of specific elements
- Requires Scene Render Engine integration
- Store color values in contentData
- Apply to cells via color override

### Phase 5: Enhanced Validation
- Image dimension constraints
- File size warnings
- Format-specific validation

### Phase 6: Preview Modes
- Side-by-side comparison (designer vs user content)
- Preview before export
- Thumbnail generation for page navigation

---

## 🔍 Key Technical Decisions

### Why sourceContentId Instead of cell.id?

**Problem:** Grid cells get new IDs on rebuild
**Solution:** Use persistent UUID (`cell.contentId`)
**Benefit:** Content slots survive grid structure changes

### Why Skip + Render Instead of Update?

**Alternative Approach:** Update cell content in place
**Chosen Approach:** Skip cell, render slot separately
**Reason:**
- Cleaner separation of concerns
- Preserves designer cell data
- Easier to debug and maintain
- Allows different rendering logic for slots vs cells

### Why Build Map First?

**Alternative:** Loop through slots for each cell
**Chosen:** Build map once, O(1) lookups
**Reason:** Performance - O(n) vs O(n²)

---

## 📚 Related Files

**Core Rendering:**
- `js/enduser/ContentSlotRenderer.js` - Main rendering logic
- `js/enduser/EndUserController.js` - Workflow orchestration
- `js/enduser/FormGenerator.js` - Form generation from slots

**Content Slot System:**
- `js/parameters/ContentSlotManager.js` - Slot creation/management
- `js/parameters/ContentSlotTypes.js` - Type definitions
- `js/parameters/PresetPageManager.js` - Page capture/restore

**Grid System:**
- `js/grid/GridCell.js` - Cell base class (contentId generation)
- `js/grid/ContentCell.js` - Content cells (images)
- `js/grid/MainTextCell.js` - Text cells

**Canvas:**
- `js/canvas/CanvasManager.js` - Canvas rendering
- `js/grid/CellRenderer.js` - Cell rendering logic

**Styling:**
- `css/enduser.css` - End-user UI styles

---

## ✅ Success Criteria

1. **No Double Rendering:** Each visual element renders exactly once
2. **Grid Stays Fixed:** User content never resizes/moves grid structure
3. **Content Slots Work:** Text scales, images crop/fit correctly
4. **Mapping Correct:** Content slots update the right cells
5. **Designer Default:** Empty slots show original designer content
6. **Performance:** Rendering completes in < 500ms for typical preset

---

## 🚀 Next Steps

1. Review this design document with team
2. Implement Phase 1 changes (content slot rendering fix)
3. Test with existing presets
4. Implement Phase 2 (thumbnail centering)
5. Create test preset with various content slot types
6. Validate all rendering modes work correctly
7. Document any edge cases discovered during testing

---

**Document Version:** 1.0
**Last Updated:** 2025-01-06
**Status:** Ready for Implementation
