# Text Bounds Investigation - "The New" Issue

**Date**: 2025-01-04
**Status**: 🔍 In Progress
**Preset**: Launch Event
**Issue**: Bounding box for "The New" text looks "too high and not wide enough"

---

## Problem Analysis

### User Report
> "the part of the text called the New isn't being like outline correctly... to me looks too high and not wide enough"

### Data from Console (Before Diagnostic Logging)

**Cell 3 - "The New"**:
- Cell bounds: (299.7, 240, 760.3, 139)
- Calculated bbox: (649.0, 163.5, 391.0, 292)
- Text lines:
  - Line 1 "The": (710.0, 163.5, 330.0, 141.0)
  - Line 2 "New": (649.0, 314.5, 391.0, 141.0)

### Observations

1. **Bbox starts above cell**:
   - Cell top: y=240
   - Bbox top: y=163.5
   - Difference: **-76.5px** (bbox is 76.5px above cell!)

2. **Bbox extends below cell**:
   - Cell bottom: y=240+139=379
   - Bbox bottom: y=163.5+292=455.5
   - Difference: **+76.5px** (bbox extends 76.5px below cell)

3. **Width calculation**:
   - Cell width: 760.3px
   - Bbox width: 391.0px (only 51% of cell width)
   - Both lines end at x=1040 (center-aligned)
   - Width from leftmost (649) to rightmost (1040) = **391px ✓ Correct**

4. **Height calculation**:
   - Gap between lines: 314.5 - 163.5 = 151px
   - Line height: 141px each
   - Line spacing: 151 - 141 = **10px**
   - Total height: 141 + 10 + 141 = **292px ✓ Mathematically correct**

---

## Root Cause Hypothesis

### Typography-Aware Positioning Issue

The issue appears to be that `getTextBounds()` uses typography-aware heights (capHeight/xHeight) for positioning, which creates a coordinate system mismatch:

1. **Container Setup** (ContentSlotManager.js:99-104):
   ```javascript
   cell.textComponent.setContainer(
       299.7,  // cell.bounds.x
       240,    // cell.bounds.y  ← Container starts at cell top
       760.3,  // cell.bounds.width
       139     // cell.bounds.height
   );
   ```

2. **Positioning Calculation** (TextComponent.js:240-251):
   - Uses `getLineHeight()` which returns `capHeight` or `xHeight` (~141px)
   - Calculates `totalHeight = capHeight * 2 + lineSpacing ≈ 292px`
   - But `contentHeight = 139 - 20 - 20 = 99px` (with default padding 20px)
   - Text is **193px taller** than available space!

3. **Vertical Centering** (TextComponent.js:706-708):
   ```javascript
   anchorY = contentY + (contentHeight - totalHeight) / 2;
   // anchorY = 260 + (99 - 292) / 2
   // anchorY = 260 + (-193) / 2
   // anchorY = 260 - 96.5
   // anchorY ≈ 163.5  ✓ Matches observed y=163.5!
   ```

4. **The Issue**: When `totalHeight > contentHeight`, centering causes text to overflow both above and below the cell. This is **geometrically correct** for where the text renders, but visually unexpected.

---

## Comparison with "Phone"

**Why "Phone" looks correct but "The New" doesn't:**

- "Phone" is likely a single line in a different cell with proper sizing
- "The New" is two lines with large font size that overflows the cell
- Both calculations are **correct**, but "The New" has more visible overflow

---

## Potential Fixes

### Option 1: Use Full Line Box Height
Instead of typography-aware heights (capHeight/xHeight), use full line box heights (ascent + descent) for bounds calculation. This would better represent the visual rendering area.

**Location**: TextComponent.js:191-201 (getLineHeight method)

### Option 2: Adjust Bounds After Positioning
Keep typography-aware heights for positioning, but adjust bounds to include full visual area including descenders.

**Location**: TextComponent.js:301-355 (getTextBounds bounds calculation)

### Option 3: Constrain to Cell Bounds
Clip bounding boxes to cell boundaries when overflow occurs (but this would be incorrect for actual content editing).

**Location**: ContentSlotManager.js:98-131 (_captureTextBounds method)

---

## Next Steps

1. **Add diagnostic logging** ✅ (Added in TextComponent.js:251-264)
2. **Verify positioning calculations** (Load Launch Event preset, check console)
3. **Determine correct fix** (Based on rendering vs bounds mismatch)
4. **Implement and test** (Verify with multiple presets)

---

## Diagnostic Logging Added

### TextComponent.js:251-264
```javascript
console.log(`📐 getTextBounds positioning:`, {
    text: this.text.substring(0, 20),
    lines: lines.length,
    fontSize,
    totalHeight,
    container: { x, y, width, height },
    padding: { top, bottom },
    contentHeight: this.getAvailableHeight(),
    positionV: this.positionV
});
console.log(`   → Starting position:`, position);
```

### TextComponent.js:366-371
```javascript
console.log(`   Line ${index + 1} "${line}":`, {
    hasCapitals: this.hasCapitalLetters(line),
    lineHeight,
    bounds: { x, y, width, height }
});
```

---

## Expected Console Output

When loading Launch Event preset:
```
📐 getTextBounds positioning: {
    text: "The New",
    lines: 2,
    fontSize: ~180,
    totalHeight: ~292,
    container: { x: 299.7, y: 240, width: 760.3, height: 139 },
    padding: { top: 20, bottom: 20 },
    contentHeight: 99,
    positionV: "middle"
}
   → Starting position: { x: ~630, y: ~163.5, ... }
   Line 1 "The": { hasCapitals: true, lineHeight: 141, bounds: {...} }
   Line 2 "New": { hasCapitals: true, lineHeight: 141, bounds: {...} }
```

This should confirm that the positioning calculation is producing y=163.5 due to the centering formula with overflow.
