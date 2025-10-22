# Multi-Page Preset System - Architecture v2
**Revised Design: Page-as-Preset Model**

## 🎯 Core Concept

**Designer**: Works on single canvas → Saves as page in preset → Marks editable fields during save
**End-User**: Loads preset → Fills form with editable fields → Generates all pages → Exports ZIP

**Key Principle**: Designer focuses on ONE canvas at a time. Multi-page management happens through save/load operations, not live switching.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        DESIGNER WORKFLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Design Canvas (Current Interface)                          │
│     ├─ Grid Builder                                            │
│     ├─ Text Controls                                           │
│     ├─ Background Manager                                      │
│     └─ Content Cells                                           │
│                                                                 │
│  2. Click "Save Page to Preset"                                │
│     ├─ Modal opens with canvas preview                         │
│     ├─ Click cells to mark as editable/locked                  │
│     ├─ Name each editable field                                │
│     ├─ Choose: New Preset or Existing Preset                   │
│     └─ Select page position (1, 2, 3, 4, or 5)                 │
│                                                                 │
│  3. Save to Wix CMS                                            │
│     └─ Preset stored with pages array                          │
│                                                                 │
│  4. Load Page from Preset (to edit)                            │
│     ├─ Browse presets (grouped by preset name)                 │
│     ├─ Select page to load                                     │
│     └─ Edit and re-save to same position                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       END-USER WORKFLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Load Preset (Separate URL: /end-user)                      │
│     └─ Select from available presets                           │
│                                                                 │
│  2. View Form with Editable Fields                             │
│     ├─ Text inputs for editable text cells                     │
│     ├─ Image uploads for editable content cells                │
│     ├─ Color pickers for editable colors                       │
│     └─ All non-editable fields: LOCKED                         │
│                                                                 │
│  3. Fill Form Data                                             │
│     └─ Real-time preview on canvas                             │
│                                                                 │
│  4. Generate All Pages                                         │
│     └─ Apply form data to each page template                   │
│                                                                 │
│  5. Page Navigation                                            │
│     └─ Bottom bar with thumbnails (switch to preview)          │
│                                                                 │
│  6. Export as ZIP                                              │
│     ├─ Generate PNG/MP4 for each page                          │
│     └─ Download: preset-name.zip                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Model

### Preset Structure (Wix CMS)

```javascript
{
  _id: "preset-123",
  presetName: "Summer Campaign",
  description: "5-page campaign template",
  createdAt: "2025-10-22T00:00:00Z",
  updatedAt: "2025-10-22T00:00:00Z",

  // Page data stored in separate fields (not array)
  page1: {
    pageName: "Hero Banner",
    pageNumber: 1,
    exportFormat: "png",
    exportDuration: null,

    // Complete canvas state
    canvas: {
      width: 1080,
      height: 1080,
      padding: { left: 20, right: 20, top: 20, bottom: 20 },
      grid: { rows: 3, cols: 3 }
    },

    background: {
      color: "#f5f5f5",
      imageURL: "wix:image://...",
      gifURL: null,
      fillMode: "cover",
      fitMode: "cover",
      videoSettings: { autoplay: true, loop: true }
    },

    mainText: {
      content: "WELCOME TO {{companyName}}",
      fontSize: 60,
      fontFamily: "Inter",
      textTransform: "uppercase",
      fontWeight: "bold",
      textAlign: "center",
      color: "#000000"
    },

    grid: {
      rows: 3,
      cols: 3,
      spotSpacing: 10,
      minSpotSize: 50,
      snapshot: { /* grid state */ }
    },

    layers: {
      textCells: [
        {
          cellId: "text-cell-1",
          content: "Hero Headline",
          position: { row: 0, col: 1 },
          styling: { fontSize: 48, color: "#333" }
        }
      ],
      contentCells: [
        {
          cellId: "content-cell-1",
          type: "image",
          imageURL: "wix:image://...",
          position: { row: 1, col: 1 }
        }
      ]
    },

    // Editable fields configuration
    editableFields: {
      mainText: {
        editable: false,
        fieldName: null
      },
      textCells: {
        "text-cell-1": {
          editable: true,
          fieldName: "heroHeadline",
          fieldLabel: "Hero Headline"
        },
        "text-cell-2": {
          editable: true,
          fieldName: "heroSubheadline",
          fieldLabel: "Hero Subheadline"
        }
      },
      contentCells: {
        "content-cell-1": {
          editable: true,
          fieldName: "heroImage",
          fieldLabel: "Hero Image"
        }
      },
      background: {
        color: { editable: false },
        image: { editable: false }
      }
    }
  },

  page2: { /* Same structure */ },
  page3: { /* Same structure */ },
  page4: null,  // Empty if not used
  page5: null   // Empty if not used
}
```

---

## 🔄 Designer Workflow (Detailed)

### 1. Design Canvas
- Designer uses **existing interface** (no changes to current design view)
- Grid Builder, text controls, background manager all work as before
- Canvas shows exactly what will be saved

### 2. Save Page to Preset

**UI Components:**

```
┌────────────────────────────────────────────────────────┐
│  Save Page to Preset                            [X]    │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Canvas Preview (with overlay)                        │
│  ┌──────────────────────────────────────────┐         │
│  │  [🔒] Main Text: "WELCOME"              │         │
│  │  [🔓] Text Cell 1: "Hero Headline"      │ ← Click to toggle
│  │  [🔓] Text Cell 2: "Subheadline"        │         │
│  │  [🔓] Content Cell 1: [Image]           │         │
│  │  [🔒] Background: Blue gradient          │         │
│  └──────────────────────────────────────────┘         │
│                                                        │
│  Editable Fields:                                     │
│  ┌──────────────────────────────────────────┐         │
│  │ Text Cell 1                              │         │
│  │ Field Name: [Hero Headline________]      │         │
│  │                                          │         │
│  │ Text Cell 2                              │         │
│  │ Field Name: [Hero Subheadline_____]      │         │
│  │                                          │         │
│  │ Content Cell 1                           │         │
│  │ Field Name: [Hero Image___________]      │         │
│  └──────────────────────────────────────────┘         │
│                                                        │
│  Preset: ○ Create New  ● Add to Existing             │
│           [Summer Campaign ▼]                         │
│                                                        │
│  Page Position: [Page 2 ▼]                           │
│                                                        │
│  [Cancel]                        [Save Page]          │
└────────────────────────────────────────────────────────┘
```

**Interaction Flow:**

1. Designer clicks "Save Page to Preset" button (in Presets tab)
2. Modal opens with canvas overlay
3. All fields default to **LOCKED** (🔒)
4. Designer clicks a cell → Toggles to UNLOCKED (🔓)
5. For unlocked cells, field name input appears
6. Designer enters field name (e.g., "Hero Headline", "Company Logo")
7. Designer selects preset (new or existing)
8. Designer selects page position (1-5)
9. Click "Save Page" → Saves to Wix CMS

### 3. Load Page from Preset

**UI Components:**

```
┌────────────────────────────────────────────┐
│  Presets                                   │
├────────────────────────────────────────────┤
│                                            │
│  [Load Page from Preset ▼]                │
│                                            │
│  ► Summer Campaign                         │
│    ├─ Page 1: Hero Banner                 │
│    ├─ Page 2: About Us                    │
│    └─ Page 3: Contact                     │
│                                            │
│  ► Winter Campaign                         │
│    ├─ Page 1: Holiday Special             │
│    └─ Page 2: Store Locations             │
│                                            │
│  ► Spring Promo                            │
│    └─ Page 1: Sale Announcement           │
│                                            │
└────────────────────────────────────────────┘
```

**Interaction Flow:**

1. Designer clicks "Load Page from Preset" dropdown
2. Presets grouped by name with expandable pages
3. Click page → Loads into canvas
4. Edit as needed
5. Save → Updates same page in same preset

---

## 👤 End-User Workflow (Detailed)

### URL Structure
- **Designer**: `http://localhost:3000/` (or `/designer`)
- **End-User**: `http://localhost:3000/end-user`

### 1. Load Preset

```
┌────────────────────────────────────────────────────┐
│  Select Preset                                     │
├────────────────────────────────────────────────────┤
│                                                    │
│  ○ Summer Campaign (5 pages)                      │
│  ○ Winter Campaign (2 pages)                      │
│  ○ Spring Promo (1 page)                          │
│                                                    │
│  [Load Preset]                                    │
└────────────────────────────────────────────────────┘
```

### 2. Fill Editable Fields

```
┌─────────────────────────────────────────────────────────┐
│  Summer Campaign - Fill Form                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Editable Fields:                                      │
│                                                         │
│  Hero Headline:                                        │
│  [Welcome to Our Company_________________________]     │
│                                                         │
│  Hero Subheadline:                                     │
│  [We Create Amazing Products_____________________]     │
│                                                         │
│  Hero Image:                                           │
│  [Choose File] company-hero.jpg                        │
│                                                         │
│  Company Name (Page 2):                                │
│  [ACME Corporation_______________________________]     │
│                                                         │
│  About Text (Page 2):                                  │
│  [We are a leading company in..._______________]       │
│                                                         │
│  Contact Email (Page 3):                               │
│  [contact@acme.com_______________________________]     │
│                                                         │
│  [Apply to All Pages]                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3. Canvas Preview + Navigation

```
┌─────────────────────────────────────────────────────────┐
│  Canvas Preview (Real-time)                             │
│  ┌───────────────────────────────────────────────┐     │
│  │                                               │     │
│  │       WELCOME TO OUR COMPANY                  │     │
│  │   We Create Amazing Products                  │     │
│  │                                               │     │
│  │         [Company Hero Image]                  │     │
│  │                                               │     │
│  └───────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  Page Navigation                                        │
│  ┌───┐  ┌───┐  ┌───┐  ┌───┐  ┌───┐                   │
│  │ 1 │  │ 2 │  │ 3 │  │ 4 │  │ 5 │                   │
│  │ ● │  │   │  │   │  │   │  │   │  [Export All]     │
│  └───┘  └───┘  └───┘  └───┘  └───┘                   │
└─────────────────────────────────────────────────────────┘
```

### 4. Export All Pages

```
[Export All Pages]
   ↓
Generate Page 1 PNG... ✓
Generate Page 2 PNG... ✓
Generate Page 3 PNG... ✓
Generate Page 4 PNG... ✓
Generate Page 5 PNG... ✓
   ↓
Create ZIP: summer-campaign.zip
   ↓
Download ⬇️
```

---

## 🔧 Technical Implementation

### File Structure

```
js/
├─ parameters/
│  ├─ PresetManager.js (existing - keep)
│  └─ PresetPageManager.js (NEW - manages page save/load)
│
├─ ui/
│  ├─ PresetUIComponent.js (existing - modify)
│  ├─ SavePageModal.js (NEW - editable fields configuration)
│  ├─ LoadPageModal.js (NEW - grouped preset/page selector)
│  └─ EndUserFormUI.js (NEW - end-user form interface)
│
├─ enduser/
│  ├─ EndUserController.js (NEW - end-user mode orchestration)
│  ├─ PresetLoader.js (NEW - load preset for end-user)
│  ├─ FormGenerator.js (NEW - generate form from editable fields)
│  └─ PageExporter.js (NEW - export all pages as ZIP)
│
└─ app.js (modify - add end-user mode detection)
```

### Key Classes

**PresetPageManager**
```javascript
class PresetPageManager {
  constructor(app) {}

  // Save current canvas as page
  async savePage(presetName, pageNumber, editableFieldsConfig) {}

  // Load page into canvas
  async loadPage(presetName, pageNumber) {}

  // Get all presets with pages
  async getAllPresets() {}

  // Update existing page
  async updatePage(presetName, pageNumber, editableFieldsConfig) {}
}
```

**SavePageModal**
```javascript
class SavePageModal {
  constructor(app) {}

  // Show modal with canvas overlay
  show() {}

  // Toggle cell editable state
  toggleCellEditable(cellId) {}

  // Collect editable fields configuration
  getEditableFieldsConfig() {}
}
```

**EndUserController**
```javascript
class EndUserController {
  constructor(app) {}

  // Load preset for end-user
  async loadPreset(presetName) {}

  // Generate form from preset
  generateForm(preset) {}

  // Apply form data to pages
  applyFormData(formData) {}

  // Export all pages as ZIP
  async exportAllPages() {}
}
```

---

## 📅 Implementation Phases

### Sprint 1: Designer - Save Page to Preset (Week 1)
- Create SavePageModal component
- Implement editable field marking (click to toggle)
- Save page to Wix CMS (page1-page5 fields)
- Basic preset creation (new preset only)

### Sprint 2: Designer - Load & Edit Pages (Week 2)
- Create LoadPageModal component
- Load page from preset into canvas
- Update existing page functionality
- Add to existing preset functionality

### Sprint 3: End-User - Load & Fill Form (Week 3)
- Create end-user route (`/end-user`)
- Load preset and generate form
- Real-time canvas preview
- Page navigation (reuse bottom bar from v1)

### Sprint 4: End-User - Export (Week 4)
- Generate PNG/MP4 for each page
- Create ZIP with JSZip
- Download functionality
- Progress indicators

### Phase 2 (Future):
- Global parameters across pages
- Preview thumbnails in modals
- Drag-to-reorder pages
- Advanced editable field types

---

## ✅ Success Criteria

**Designer POC:**
- ✅ Save canvas as page in preset
- ✅ Mark any field as editable with custom name
- ✅ Load page from preset to edit
- ✅ Save to page position (1-5)

**End-User POC:**
- ✅ Load preset
- ✅ See form with all editable fields
- ✅ Fill form and see real-time preview
- ✅ Switch between pages
- ✅ Export all pages as ZIP

---

**Status**: Design approved, ready for implementation
**Last Updated**: 2025-10-22
**Version**: 2.0 (Page-as-Preset Model)
