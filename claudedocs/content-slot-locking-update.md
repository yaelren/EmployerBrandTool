# Content Slot Based Locking System Update

**Date**: 2025-11-05
**Status**: ✅ **IMPLEMENTED**
**Branch**: locked-presets

---

## 🎯 Overview

Updated the SavePagePanel locking system to be based on **content slots** instead of **grid cells**. Lock icons now appear at the same positions as content slot overlays, providing a consistent visual experience.

---

## 📋 Changes Summary

### Before
- Lock icons positioned at **grid cell bounds** (`cell.bounds.x`, `cell.bounds.y`)
- Lock state tracked using `configuredCellIds` (Set of cell IDs)
- Icons appeared at cell corners, not matching content slot visual bounds

### After
- Lock icons positioned at **content slot bounds** (tight bounding boxes around actual content)
- Lock state determined by `ContentSlotManager.getAllSlots()` registration
- Icons appear exactly where content slot overlays show (consistent UX)
- Editable cell data saved to page data via content slots

---

## 🔧 Modified Methods

### [SavePagePanel.js](../js/ui/SavePagePanel.js)

#### 1. `renderCellLockIcons()` (Lines 356-423)
**Changed**: Uses `getAllContentBounds()` instead of iterating grid cells directly
**Effect**: Lock icons positioned at content slot bounds, not cell bounds

```javascript
// OLD: Position using cell.bounds
const iconX = canvasOffsetX + (cell.bounds.x * scaleX) + 8;
const iconY = canvasOffsetY + (cell.bounds.y * scaleY) + 8;

// NEW: Position using content slot bbox
const iconX = canvasOffsetX + (bbox.x * scaleX) + 8;
const iconY = canvasOffsetY + (bbox.y * scaleY) + 8;
```

#### 2. `refreshOverlayLockIcons()` (Lines 462-485)
**Changed**: Uses `isSlotRegistered(cell)` instead of checking `configuredCellIds`
**Effect**: Lock state reflects actual content slot registration

```javascript
// OLD: Check configuredCellIds Set
const isRegistered = this.configuredCellIds.has(cellId);

// NEW: Check ContentSlotManager registration
const isRegistered = this.isSlotRegistered(cell);
```

#### 3. `isCellEditable()` (Lines 497-505)
**Changed**: Uses `isSlotRegistered(cell)` instead of `configuredCellIds.has()`
**Effect**: Editability determined by content slot registration

```javascript
// OLD: Parse cell ID and check Set
const cellId = parseInt(cellIdStr);
return this.configuredCellIds.has(cellId);

// NEW: Find cell and check registration
const cell = this._findCellByElementId(elementId);
return this.isSlotRegistered(cell);
```

#### 4. `toggleCellLock()` (Lines 600-633)
**Changed**: Uses `isSlotRegistered(cell)` and searches ContentSlotManager
**Effect**: Lock toggling based on content slot registration, not local tracking

```javascript
// OLD: Check configuredCellIds
const alreadyConfigured = this.configuredCellIds.has(cellId);

// NEW: Check content slot registration
const alreadyConfigured = this.isSlotRegistered(cell);
```

#### 5. `show()` (Lines 218-246)
**Changed**: Loads existing slots from ContentSlotManager on panel open
**Effect**: Panel syncs with existing content slot configuration

```javascript
// NEW: Load from ContentSlotManager
this.configuredSlots = [...this.contentSlotManager.getAllSlots()];

// Sync configuredCellIds for backward compatibility
this.configuredCellIds.clear();
this.configuredSlots.forEach(slot => {
    if (slot.sourceContentId) {
        this.configuredCellIds.add(slot.sourceContentId);
    }
});
```

---

## 🆕 New Helper Methods

### `getAllContentBounds()` (Added after line 505)
**Purpose**: Get all content bounding boxes from grid (mirrors ContentSlotOverlay logic)
**Returns**: Array of `{cell, bounds, type}` objects

**Logic**:
1. Get main text cells from 'main-text' layer
2. Get content cells from all other layers
3. Capture bounding box for each using `contentSlotManager.captureBoundingBox(cell)`
4. Skip empty cells and cells without content

### `isSlotRegistered(cell)` (Added after getAllContentBounds)
**Purpose**: Check if a cell is registered as a content slot
**Returns**: Boolean

**Logic**:
```javascript
const slots = this.contentSlotManager.getAllSlots();
return slots.some(slot =>
    slot.sourceContentId === cell.contentId ||
    slot.sourceElement === cell.id ||
    (cell.type === 'main-text' && slot.sourceElement === 'main-text')
);
```

---

## 🎨 Visual Changes

### Lock Icon Positioning

**Before**:
```
Grid Cell: ┌────────────────┐
           │ 🔒             │ ← Lock at cell corner
           │                │
           │  [Content]     │ ← Content with tight bounds
           │                │
           └────────────────┘
```

**After**:
```
Grid Cell: ┌────────────────┐
           │                │
           │ 🔒[Content]    │ ← Lock at content bounds
           │                │
           │                │
           └────────────────┘
```

**Result**: Lock icons now match content slot overlay positions exactly!

---

## 📊 Data Flow

### Content Slot Registration Flow

1. **User clicks lock icon** → `toggleCellLock(elementId, cellId, cellType)`
2. **Check registration** → `isSlotRegistered(cell)` queries ContentSlotManager
3. **If not registered** → Show inline editor for new slot creation
4. **If registered** → Show inline editor for editing existing slot
5. **On save** → Slot saved to `configuredSlots` array
6. **On page save** → `handleSave()` syncs `configuredSlots` to ContentSlotManager
7. **Page capture** → `captureCurrentPage()` includes all ContentSlotManager slots in page data

### Lock Icon Update Flow

1. **Panel opens** → `show()` loads slots from ContentSlotManager
2. **Render icons** → `renderCellLockIcons()` uses `getAllContentBounds()`
3. **Position icons** → Uses content slot bbox coordinates
4. **Set lock state** → Uses `isSlotRegistered(cell)` for 🔒/🔓 display
5. **Refresh icons** → `refreshOverlayLockIcons()` updates based on ContentSlotManager

---

## 🔑 Key Concepts

### Content Slot Bounds vs Grid Cell Bounds

| Property | Grid Cell Bounds | Content Slot Bounds |
|----------|------------------|---------------------|
| Source | `cell.bounds` | `contentSlotManager.captureBoundingBox(cell)` |
| Calculation | Grid layout positioning | Tight bounding box around actual content |
| Includes | Padding, empty space | Only content area (text/media) |
| Use Case | Grid rendering | User interaction zones |

**Example - Main Text "EMPLOYEE"**:
- Grid Cell Bounds: `{x: 40, y: 500, width: 600, height: 100}`
- Content Slot Bounds: `{x: 60, y: 520, width: 580, height: 60}` (tighter!)

### Registration Check Logic

**Content Slot Matching** (3 possible matches):
1. `slot.sourceContentId === cell.contentId` - Content cell match
2. `slot.sourceElement === cell.id` - Grid cell ID match
3. `cell.type === 'main-text' && slot.sourceElement === 'main-text'` - Main text match

---

## ✅ Benefits

1. **Visual Consistency**: Lock icons appear exactly where content slot overlays show
2. **Accurate Positioning**: Icons positioned at tight content bounds, not loose cell bounds
3. **Content-Aware**: System based on actual content slots, not grid structure
4. **Single Source of Truth**: ContentSlotManager is the authoritative source for slot registration
5. **Better UX**: Users see locks where they expect them (around actual content)

---

## 🧪 Testing Checklist

- [ ] Lock icons appear at content slot positions (not cell corners)
- [ ] Lock icons match ContentSlotOverlay visual positions
- [ ] Clicking lock icon opens inline editor for unregistered content
- [ ] Clicking lock icon edits slot for registered content
- [ ] Lock state (🔒/🔓) reflects ContentSlotManager registration
- [ ] Saving page includes all configured content slots
- [ ] Loading preset restores content slots and lock icons
- [ ] Lock icons update when slots are added/removed

---

## 🔗 Related Files

- [SavePagePanel.js](../js/ui/SavePagePanel.js) - Modified locking methods
- [ContentSlotOverlay.js](../js/ui/ContentSlotOverlay.js) - Visual overlay reference
- [ContentSlotManager.js](../js/parameters/ContentSlotManager.js) - Slot registration source
- [PresetPageManager.js](../js/parameters/PresetPageManager.js) - Page data capture

---

## 📝 Migration Notes

### Backward Compatibility

`configuredCellIds` is kept for backward compatibility but is no longer the primary source of truth:
- Still populated in `show()` method by syncing from ContentSlotManager
- Still updated when slots are added/removed
- Can be safely removed in future refactoring once all code paths verified

### Deprecation Path

Future cleanup (not urgent):
1. Remove `configuredCellIds` Set from constructor
2. Remove `configuredCellIds` manipulation in slot add/remove methods
3. Update any remaining references to use `isSlotRegistered()` directly

---

**Status**: ✅ **READY FOR TESTING**

Test the updated locking system by:
1. Opening Save Page panel
2. Toggling "Show Content Slots" overlay
3. Verifying lock icons appear at same positions as content slot boxes
4. Clicking locks to register/edit content slots
5. Saving page and verifying content slots are saved correctly
