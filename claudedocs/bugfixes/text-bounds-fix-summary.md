# Text Bounds Issue - Root Cause & Solution

**Date**: 2025-01-04
**Status**: ✅ Root Cause Identified
**Issue**: "The New" text bounding box appears "too high and not wide enough"

---

## Root Cause Analysis

### The Problem

From console logs and user feedback:
- **Cell bounds**: x=299.7, y=240, width=760.3, height=139
- **Calculated bbox**: x=649.0, y=163.5, width=391.0, height=292
- **Issue**: Bounding box starts **76.5px above** the cell and extends **76.5px below** the cell

### Why This Happens

The issue is caused by **typography-aware vertical centering** when text overflows the cell:

1. **Text Height Calculation** (TextComponent.js:240-249):
   ```javascript
   // Uses capHeight/xHeight for line height (typography-aware)
   totalHeight += this.getLineHeight(line, fontSize);  // Returns capHeight or xHeight (~141px per line)
   ```
   - For "The New" (2 lines): `totalHeight ≈ 141 + 10 + 141 = 292px`

2. **Container Setup**:
   ```javascript
   // Cell bounds with default padding
   containerHeight = 139px
   paddingTop = 20px, paddingBottom = 20px
   contentHeight = 139 - 20 - 20 = 99px
   ```

3. **Vertical Centering Formula** (TextComponent.js:706-708):
   ```javascript
   case 'middle':
       anchorY = contentY + (contentHeight - totalHeight) / 2;
       // anchorY = 260 + (99 - 292) / 2
       // anchorY = 260 - 96.5
       // anchorY = 163.5  ✅ Matches observed value!
   ```

4. **The Core Issue**: When `totalHeight > contentHeight`, the centering formula produces a **negative offset**, placing the text above the cell top. This is **geometrically correct** for where the text renders, but creates unexpected visual bounds.

---

## Why "Phone" Looks Fine But "The New" Doesn't

- **"Phone"**: Single line in a properly-sized cell → no overflow → bounds look normal
- **"The New"**: Two lines with large font (190px) in small cell (139px height) → massive overflow → bounds extend far outside cell

Both calculations are **mathematically correct**, but "The New" has more visible overflow due to the size mismatch.

---

## The Typography-Aware Height Issue

The problem is compounded by using **capHeight/xHeight** instead of **full line box heights** (ascent + descent):

```javascript
// Current implementation (TextComponent.js:191-201)
getLineHeight(line, fontSize) {
    const metrics = this.getFontMetrics(fontSize);
    // Uses tight typography-aware heights
    return this.hasCapitalLetters(line) ? metrics.capHeight : metrics.xHeight;
}
```

This creates a **mismatch** between:
1. The **positioning** (based on tight capHeight/xHeight)
2. The **rendering** (actual visual text with full ascenders/descenders)

---

## Solution Options

### Option 1: Use Full Line Box Heights (RECOMMENDED)

**Change**: Modify `getLineHeight()` to return full line box heights instead of typography-aware heights for bounds calculation.

**Location**: [TextComponent.js:191-201](../js/text/TextComponent.js#L191-L201)

```javascript
getLineHeight(line, fontSize) {
    const metrics = this.getFontMetrics(fontSize);
    if (!metrics) {
        return fontSize;
    }
    // Use full line box height (ascent + descent) for proper spacing
    return metrics.ascent + metrics.descent;
}
```

**Impact**:
- ✅ Bounding boxes will match actual visual rendering area
- ✅ Vertical centering will be based on full text height
- ✅ Works for all text (with/without descenders)
- ⚠️ May change line spacing slightly (but more accurate)

### Option 2: Adjust Bounds After Calculation

**Change**: Keep typography-aware positioning, but adjust bounds to include full visual area.

**Location**: [TextComponent.js:301-355](../js/text/TextComponent.js#L301-L355)

```javascript
// In getTextBounds(), adjust boundsY and boundsHeight to account for
// the difference between typography-aware and actual rendering
```

**Impact**:
- ✅ Preserves current tight line spacing
- ❌ More complex logic (need to calculate offsets)
- ❌ Doesn't fix the root positioning issue

### Option 3: Clip Bounds to Cell (NOT RECOMMENDED)

**Change**: Constrain bounding boxes to cell boundaries.

**Impact**:
- ❌ Incorrect for content editing (users can't edit overflowing content)
- ❌ Hides the real issue (text overflow)
- ❌ Breaks the purpose of tight bounding boxes

---

## Recommended Fix

**Implement Option 1**: Change `getLineHeight()` to use full line box heights.

This fix addresses the root cause by making the height calculation match the actual rendered text area. The positioning will be correct, and bounding boxes will wrap the full visual text.

### Implementation Steps

1. **Modify getLineHeight()** in [TextComponent.js:191-201](../js/text/TextComponent.js#L191-L201)
2. **Test with multiple presets**:
   - Launch Event ("The New" - mixed case, overflow)
   - Luggage (media overflow)
   - Various text alignments and sizes
3. **Verify**:
   - Bounding boxes wrap correctly
   - Line spacing looks natural
   - No regressions in rendering

---

## Additional Context

### Diagnostic Logging Added

Added comprehensive logging to understand the issue:

1. **TextComponent.js:251-264**: Positioning calculation details
2. **TextComponent.js:366-371**: Per-line bounds information
3. **ContentSlotManager.js:109-111**: getTextBounds() call tracking

These logs can be removed after verification.

### Related Files

- [TextComponent.js:191-201](../js/text/TextComponent.js#L191-L201) - getLineHeight() method
- [TextComponent.js:220-378](../js/text/TextComponent.js#L220-L378) - getTextBounds() method
- [ContentSlotManager.js:91-174](../js/parameters/ContentSlotManager.js#L91-L174) - _captureTextBounds() method
- [TextPositioning.js:15-32](../js/text/TextPositioning.js#L15-L32) - calculateBaselineY() method

---

## Expected Results After Fix

**Before** (Current):
```
Cell: x=299.7, y=240, width=760.3, height=139
Bbox: x=649.0, y=163.5, width=391.0, height=292
Issue: Bbox starts 76.5px above cell, extends 76.5px below
```

**After** (With Fix):
```
Cell: x=299.7, y=240, width=760.3, height=139
Bbox: x=649.0, y=~220, width=391.0, height=~170
Expected: Bbox properly positioned within reasonable overflow range
```

The exact numbers will depend on the actual ascent/descent values for the Inter 24pt font at 190px size.

---

## Next Steps

1. Implement the recommended fix (Option 1)
2. Test with Launch Event preset
3. Verify no regressions with other presets
4. Remove diagnostic logging
5. Update documentation
