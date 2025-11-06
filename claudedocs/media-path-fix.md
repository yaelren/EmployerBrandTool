# Media Path Detection Fix

**Date**: 2025-01-04
**Status**: ✅ **FIXED**
**Branch**: locked-presets

---

## Problem

When loading presets via the **old preset system**, media cells (like the luggage image) were taking the **EMPTY CONTENT path** instead of the **MEDIA path** in `captureBoundingBox()`. This caused the overlay to use cell bounds instead of calculating tight media bounds with overflow.

### User Report
"I uploaded the luggage preset using the load preset from the old preset system and the luggage itself image isn't being correctly outlined"

### Console Evidence (Before Fix)

```javascript
🎯 captureBoundingBox() called for cell 8 {
    type: 'content',
    hasContent: true,
    contentType: undefined,        // ← Not set
    contentMediaType: undefined,   // ← Not set
    hasMedia: true                 // ← Media exists!
}
   → Taking EMPTY CONTENT path     // ❌ WRONG PATH
```

**Root Cause**: The condition check on line 58 was insufficient:

```javascript
if (cell.content.type === 'media' || cell.content.mediaType) {
    // Take MEDIA path
}
```

Both `content.type` and `content.mediaType` were `undefined`, but `content.media` (the actual media element) **did exist**. The code fell through to the "EMPTY CONTENT" path.

---

## Solution

**File**: [ContentSlotManager.js:58](../js/parameters/ContentSlotManager.js#L58)

Added check for `cell.content.media` directly:

```javascript
// Image/media content
if (cell.content.type === 'media' || cell.content.mediaType || cell.content.media) {
    console.log(`   → Taking MEDIA path (content.type = ${cell.content.type}, mediaType = ${cell.content.mediaType})`);
    return this._captureMediaBounds(cell);
}
```

---

## Verification

### Console Output (After Fix)

```javascript
🎯 captureBoundingBox() called for cell 8 {
    type: 'content',
    hasContent: true,
    contentType: undefined,
    contentMediaType: undefined,
    hasMedia: true
}
   → Taking MEDIA path (content.type = undefined, mediaType = undefined)  // ✅ CORRECT!
📦 Cell 8 media dimensions: {
    naturalWidth: 581,
    naturalHeight: 1125,
    mediaWidth: 581,
    mediaHeight: 581,
    scale: 1,
    fillMode: "fit",
    positionH: "center",
    positionV: "middle",
    rotation: 0,
    padding: 0
}
✅ Cell 8 final bounds: {
    x: 355.9,
    y: 599.1,
    width: 368.1,
    height: 712.8,
    overflow: {
        left: 4.1,
        right: 4.0,
        top: 16.9,
        bottom: 17.9
    }
}
```

### Visual Verification

**Test**: Loaded "Luggage" preset via old preset system, toggled "Show Content Slots"

**Result**: ✅ Overlay renders correctly with:
- Gray labels for text content ("WIX", "CITY", "GUIDES")
- Bounding boxes around all content
- Overflow correctly calculated (4-17px on all sides)
- Orange corner indicators and constraint badges

**Screenshot**: `luggage-fullpage-with-overlay.png`

---

## Test Results

### Test Cases

1. ✅ **Multi-page preset** (tested "ff" preset)
   - Media path: ✅ Correct
   - Overflow calculation: ✅ Correct (4-17px overflow)
   - Issue: Had 0 content slots registered (expected behavior)

2. ✅ **Old preset system** (tested "Luggage" preset)
   - Media path: ✅ Fixed (now takes MEDIA path)
   - Overflow calculation: ✅ Correct (4-17px overflow)
   - Overlay rendering: ✅ Working (shows all content)

### Browsers Tested
- Playwright (Chromium)

### Preset Systems Tested
- ✅ Old preset system (Wix Data Collections)
- ✅ Multi-page preset system

---

## Why Both `contentType` and `mediaType` Were Undefined

The old preset system stores minimal metadata. When `PresetManager.restoreMediaContent()` creates the media element:

```javascript
cell.content.media = img;  // Only sets .media property
// Does NOT set .type or .mediaType
```

The fix accounts for this by checking for the actual media element (`cell.content.media`) instead of relying on metadata properties.

---

## Related Files

- [ContentSlotManager.js:58](../js/parameters/ContentSlotManager.js#L58) - The fix
- [ContentSlotManager.js:30-71](../js/parameters/ContentSlotManager.js#L30-L71) - Diagnostic logging
- [ContentSlotOverlay.js](../js/ui/ContentSlotOverlay.js) - Overlay rendering
- [PresetManager.js:840-863](../js/parameters/PresetManager.js#L840-L863) - Media restoration

---

## Documentation Updates

- [tight-bounding-box-implementation.md](tight-bounding-box-implementation.md) - Previous async loading fix
- [preset-loading-diagnosis.md](preset-loading-diagnosis.md) - Initial investigation (misdiagnosis)

---

## Checklist

- [x] Media path detection fixed for old presets
- [x] Media path detection working for multi-page presets
- [x] Overflow calculation correct (verified with logs)
- [x] Overlay rendering working (visual verification)
- [x] Diagnostic logging added for future debugging
- [x] Tested with multiple presets
- [x] Screenshots captured for documentation

---

## Summary

**The issue was a missing condition check in the media path detection logic.** The fix adds `|| cell.content.media` to the condition, ensuring that cells with media elements are correctly routed to the MEDIA path, regardless of whether metadata properties are set.

**Status**: ✅ **RESOLVED** - Media overflow is now correctly captured for both preset systems.
