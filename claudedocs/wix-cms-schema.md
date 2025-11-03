# Wix CMS Schema - Multi-Page Presets v3

**Architecture Version**: v3 (Content Slots)
**Related Documentation**: [content-slots-architecture-v3.md](content-slots-architecture-v3.md)

## Collection: `MultiPagePresets`

### Collection Settings
- **Name**: `MultiPagePresets`
- **Collection ID**: `MultiPagePresets`
- **Permissions**:
  - Read: Anyone
  - Write: Admin only (designer mode)

---

## Field Definitions

### Basic Information

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `_id` | Text | Auto | Wix-generated unique ID |
| `_createdDate` | Date | Auto | Wix-generated creation timestamp |
| `_updatedDate` | Date | Auto | Wix-generated update timestamp |
| `presetName` | Text | Yes | Display name of preset (e.g., "Summer Campaign") |
| `description` | Text | No | Optional description for preset |

### Page Data Fields

Each page is a **separate rich content field** to allow complex JSON storage:

| Field Name | Type | Required | Max Size | Description |
|------------|------|----------|----------|-------------|
| `page1` | Rich Content | No | 64KB | Complete page 1 data (JSON) |
| `page2` | Rich Content | No | 64KB | Complete page 2 data (JSON) |
| `page3` | Rich Content | No | 64KB | Complete page 3 data (JSON) |
| `page4` | Rich Content | No | 64KB | Complete page 4 data (JSON) |
| `page5` | Rich Content | No | 64KB | Complete page 5 data (JSON) |

**Note**: Rich Content fields in Wix can store JSON as text. We'll stringify/parse on save/load.

---

## Page Data Structure (JSON) - v3 with Content Slots

Each `pageX` field contains stringified JSON with this structure:

```json
{
  "pageName": "Hero Banner",
  "pageNumber": 1,

  "exportConfig": {
    "format": "image",
    "duration": null
  },

  "canvas": {
    "width": 1080,
    "height": 1080,
    "padding": {
      "left": 20,
      "right": 20,
      "top": 20,
      "bottom": 20
    },
    "grid": {
      "rows": 3,
      "cols": 3
    }
  },

  "background": {
    "color": "#f5f5f5",
    "imageURL": "wix:image://v1/abc123...",
    "gifURL": null,
    "fillMode": "cover",
    "fitMode": "cover",
    "videoSettings": {
      "autoplay": true,
      "loop": true
    }
  },

  "mainText": {
    "content": "WELCOME TO OUR COMPANY",
    "fontSize": 60,
    "fontFamily": "Inter",
    "textTransform": "uppercase",
    "fontWeight": "bold",
    "textAlign": "center",
    "color": "#000000"
  },

  "grid": {
    "rows": 3,
    "cols": 3,
    "spotSpacing": 10,
    "minSpotSize": 50,
    "snapshot": {
      "layout": {
        "cells": [
          {
            "row": 0,
            "col": 0,
            "width": 350,
            "height": 350,
            "x": 10,
            "y": 10
          }
        ]
      }
    }
  },

  "layers": {
    "textCells": [
      {
        "cellId": "text-cell-1",
        "type": "text",
        "content": "Hero Headline",
        "position": { "row": 0, "col": 1 },
        "styling": {
          "fontSize": 48,
          "fontFamily": "Inter",
          "fontWeight": "bold",
          "color": "#333333",
          "textAlign": "center"
        }
      }
    ],
    "contentCells": [
      {
        "cellId": "content-cell-1",
        "type": "image",
        "imageURL": "wix:image://v1/xyz789...",
        "position": { "row": 1, "col": 1 },
        "fillMode": "cover"
      }
    ]
  },

  "contentSlots": [
    {
      "slotId": "text-cell-1-slot",
      "sourceElement": "text-cell-1",
      "type": "text",
      "boundingBox": {
        "x": 370,
        "y": 140,
        "width": 340,
        "height": 80
      },
      "constraints": {
        "maxCharacters": 50,
        "fontSizeMode": "auto-fit",
        "minFontSize": 24,
        "maxFontSize": 48,
        "wordWrap": true
      },
      "styling": {
        "fontFamily": "Inter",
        "fontWeight": "bold",
        "color": "#333333",
        "textAlign": "center"
      },
      "fieldName": "heroHeadline",
      "fieldLabel": "Hero Headline"
    },
    {
      "slotId": "content-cell-1-slot",
      "sourceElement": "content-cell-1",
      "type": "image",
      "boundingBox": {
        "x": 370,
        "y": 240,
        "width": 340,
        "height": 450
      },
      "constraints": {
        "fitMode": "cover",
        "allowedTypes": ["image/jpeg", "image/png", "image/webp"]
      },
      "fieldName": "heroImage",
      "fieldLabel": "Hero Image"
    }
  ],

  "editableFields": {
    "mainText": {
      "editable": false,
      "fieldName": null,
      "fieldLabel": null
    },
    "textCells": {
      "text-cell-1": {
        "editable": true,
        "fieldName": "heroHeadline",
        "fieldLabel": "Hero Headline"
      }
    },
    "contentCells": {
      "content-cell-1": {
        "editable": true,
        "fieldName": "heroImage",
        "fieldLabel": "Hero Image"
      }
    },
    "background": {
      "color": {
        "editable": false,
        "fieldName": null
      },
      "image": {
        "editable": false,
        "fieldName": null
      }
    }
  }
}
```

### Key v3 Changes:
- **`exportConfig`**: Per-page export format configuration (image/video)
- **`contentSlots`**: Array of constrained input areas with auto-captured bounding boxes
- Each content slot includes:
  - `boundingBox`: Auto-captured from `cell.bounds` property
  - `constraints`: Text limits (character count, font range) or image fit modes
  - `fieldName`/`fieldLabel`: For end-user form generation
- **Backwards Compatible**: Still includes `editableFields` for reference

---

## Wix Data API - Code Examples

### 1. Save New Preset with Page

```javascript
import wixData from 'wix-data';

async function saveNewPreset(presetName, page1Data) {
  const preset = {
    presetName: presetName,
    description: "",
    page1: JSON.stringify(page1Data),
    page2: null,
    page3: null,
    page4: null,
    page5: null
  };

  const result = await wixData.insert("MultiPagePresets", preset);
  return result._id;
}
```

### 2. Add Page to Existing Preset

```javascript
async function addPageToPreset(presetId, pageNumber, pageData) {
  const fieldName = `page${pageNumber}`; // "page1", "page2", etc.

  const updateData = {
    _id: presetId,
    [fieldName]: JSON.stringify(pageData)
  };

  await wixData.update("MultiPagePresets", updateData);
}
```

### 3. Load All Presets

```javascript
async function getAllPresets() {
  const results = await wixData.query("MultiPagePresets")
    .ascending("presetName")
    .find();

  return results.items.map(preset => ({
    id: preset._id,
    name: preset.presetName,
    pages: [
      preset.page1 ? JSON.parse(preset.page1) : null,
      preset.page2 ? JSON.parse(preset.page2) : null,
      preset.page3 ? JSON.parse(preset.page3) : null,
      preset.page4 ? JSON.parse(preset.page4) : null,
      preset.page5 ? JSON.parse(preset.page5) : null
    ].filter(page => page !== null)
  }));
}
```

### 4. Load Specific Page from Preset

```javascript
async function loadPage(presetId, pageNumber) {
  const preset = await wixData.get("MultiPagePresets", presetId);
  const fieldName = `page${pageNumber}`;
  const pageDataString = preset[fieldName];

  if (!pageDataString) {
    throw new Error(`Page ${pageNumber} does not exist in this preset`);
  }

  return JSON.parse(pageDataString);
}
```

### 5. Update Existing Page

```javascript
async function updatePage(presetId, pageNumber, updatedPageData) {
  const fieldName = `page${pageNumber}`;

  const updateData = {
    _id: presetId,
    [fieldName]: JSON.stringify(updatedPageData)
  };

  await wixData.update("MultiPagePresets", updateData);
}
```

### 6. Get Preset with Page Count

```javascript
async function getPresetWithPageCount(presetId) {
  const preset = await wixData.get("MultiPagePresets", presetId);

  const pageCount = [
    preset.page1,
    preset.page2,
    preset.page3,
    preset.page4,
    preset.page5
  ].filter(page => page !== null && page !== undefined).length;

  return {
    id: preset._id,
    name: preset.presetName,
    pageCount: pageCount
  };
}
```

---

## Migration from Current Structure

### Current Structure (Single Page)
```javascript
{
  _id: "preset-123",
  presetName: "My Preset",
  presetData: "{ canvas: {...}, background: {...}, ... }"
}
```

### New Structure (Multi-Page)
```javascript
{
  _id: "preset-123",
  presetName: "My Preset",
  description: "",
  page1: "{ pageName: 'Page 1', canvas: {...}, background: {...}, ... }",
  page2: null,
  page3: null,
  page4: null,
  page5: null
}
```

**Migration Strategy**: No automatic migration needed since we don't need backwards compatibility. Existing presets can remain as-is or be manually converted by designer.

---

## Field Size Considerations

### Page Data Size
- **Average page**: ~10-20KB (compressed JSON)
- **Max realistic size**: ~40KB with large grid snapshots
- **Wix Rich Content limit**: 64KB per field

**Safety margin**: Each page field can handle ~1.5x average page size.

### Total Preset Size
- **5 pages × 40KB** = 200KB total
- Well within Wix data item limits (~1MB total)

---

## Query Patterns

### For Designer View - Load Page List

```javascript
// Get all presets with page names for dropdown
async function getPresetList() {
  const results = await wixData.query("MultiPagePresets")
    .ascending("presetName")
    .find();

  return results.items.map(preset => {
    const pages = [];

    for (let i = 1; i <= 5; i++) {
      const pageData = preset[`page${i}`];
      if (pageData) {
        const parsed = JSON.parse(pageData);
        pages.push({
          pageNumber: i,
          pageName: parsed.pageName
        });
      }
    }

    return {
      presetId: preset._id,
      presetName: preset.presetName,
      pages: pages
    };
  });
}
```

### For End-User View - Load Complete Preset

```javascript
// Load all pages for end-user
async function loadCompletePreset(presetId) {
  const preset = await wixData.get("MultiPagePresets", presetId);

  const pages = [];
  for (let i = 1; i <= 5; i++) {
    const pageDataString = preset[`page${i}`];
    if (pageDataString) {
      pages.push(JSON.parse(pageDataString));
    }
  }

  return {
    presetName: preset.presetName,
    pages: pages
  };
}
```

---

## CMS UI Configuration

### In Wix Dashboard:

1. **Create Collection**: "MultiPagePresets"

2. **Add Fields**:
   - `presetName` (Text, Required, Show in List)
   - `description` (Text, Optional)
   - `page1` (Rich Content, Optional)
   - `page2` (Rich Content, Optional)
   - `page3` (Rich Content, Optional)
   - `page4` (Rich Content, Optional)
   - `page5` (Rich Content, Optional)

3. **Set Permissions**:
   - Site Content: Read
   - Admin: Full

4. **Configure Display**:
   - Primary Field: `presetName`
   - Thumbnail: None (can add in future phase)

---

## Validation Rules

### On Save
```javascript
function validatePageData(pageData) {
  // Required fields
  if (!pageData.pageName) throw new Error("Page name is required");
  if (!pageData.pageNumber) throw new Error("Page number is required");
  if (!pageData.canvas) throw new Error("Canvas data is required");
  if (!pageData.background) throw new Error("Background data is required");
  if (!pageData.mainText) throw new Error("Main text data is required");
  if (!pageData.editableFields) throw new Error("Editable fields config is required");

  // Page number range
  if (pageData.pageNumber < 1 || pageData.pageNumber > 5) {
    throw new Error("Page number must be between 1 and 5");
  }

  // JSON size check
  const jsonString = JSON.stringify(pageData);
  if (jsonString.length > 60000) { // 60KB safety margin
    throw new Error("Page data exceeds maximum size (60KB)");
  }

  return true;
}
```

---

## Example: Complete Preset

```javascript
{
  "_id": "preset-summer-2025",
  "presetName": "Summer Campaign 2025",
  "description": "5-page summer marketing campaign template",
  "page1": "{\"pageName\":\"Hero Banner\",\"pageNumber\":1,...}",
  "page2": "{\"pageName\":\"About Us\",\"pageNumber\":2,...}",
  "page3": "{\"pageName\":\"Services\",\"pageNumber\":3,...}",
  "page4": "{\"pageName\":\"Testimonials\",\"pageNumber\":4,...}",
  "page5": "{\"pageName\":\"Contact\",\"pageNumber\":5,...}"
}
```

---

## Related Documentation

- **Architecture**: [content-slots-architecture-v3.md](content-slots-architecture-v3.md)
- **Implementation Plan**: [implementation-tasks-v3.md](implementation-tasks-v3.md)
- **Documentation Index**: [README-v3.md](README-v3.md)
- **Historical v2 Docs**: [archive/](archive/)

---

**Status**: Schema updated for v3 Content Slots architecture
**Last Updated**: 2025-01-03
**Version**: 3.0
