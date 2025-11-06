# Main Text Alignment Offset Debug

**Date**: 2025-11-05
**Status**: 🔍 **INVESTIGATING**
**Branch**: locked-presets

---

## 🎯 Problem Summary

User reports alignment offset issues for main text content slots:

1. **LEFT align**: Content slot beginning is "a bit to the right" (doesn't match visual text position)
2. **RIGHT align**: Opposite problem (slot doesn't align with right edge properly)

---

## 🔍 Investigation Approach

### Hypothesis

The single logical line fix for main text may have a calculation discrepancy compared to the per-line bounds calculation. Both should use identical logic for positioning.

### Key Code Sections

**Per-Line Calculation** ([TextComponent.js:350-383](../js/text/TextComponent.js#L350-L383)):
```javascript
// MAIN TEXT MODE: Align to canvas (full available width)
switch (lineAlign) {
    case 'left':
        lineX = contentX;  // Anchor at left edge
        break;
    case 'right':
        lineX = contentX + availableWidth;  // Anchor at right edge
        break;
    case 'center':
    default:
        lineX = contentX + availableWidth / 2;  // Anchor at center
        break;
}

// Calculate bounds from anchor
switch (lineAlign) {
    case 'left':
        boundX = lineX;  // Bound starts at anchor
        break;
    case 'right':
        boundX = lineX - tightWidth;  // Bound extends left from anchor
        break;
    case 'center':
    default:
        boundX = lineX - tightWidth / 2;  // Bound centers on anchor
        break;
}
```

**Single Logical Line Fix** ([TextComponent.js:478-497](../js/text/TextComponent.js#L478-L497)):
```javascript
// MAIN TEXT MODE: use canvas width calculation
const contentX = this.containerX + this.paddingLeft;
const firstLineAlign = this.alignH || 'center';

if (firstLineAlign === 'center') {
    correctedX = contentX + availableWidth / 2 - fullTextWidth / 2;
} else if (firstLineAlign === 'right') {
    correctedX = contentX + availableWidth - fullTextWidth;
} else {
    correctedX = contentX;
}
```

### Mathematical Equivalence Check

**LEFT align:**
- Per-line: `boundX = lineX = contentX` ✓
- Single logical: `correctedX = contentX` ✓
- **MATCH**

**RIGHT align:**
- Per-line: `boundX = lineX - tightWidth = (contentX + availableWidth) - tightWidth`
- Single logical: `correctedX = contentX + availableWidth - fullTextWidth`
- **MATCH** (using fullTextWidth instead of tightWidth for spaces)

**CENTER align:**
- Per-line: `boundX = lineX - tightWidth/2 = (contentX + availableWidth/2) - tightWidth/2`
- Single logical: `correctedX = contentX + availableWidth/2 - fullTextWidth/2`
- **MATCH** (using fullTextWidth instead of tightWidth for spaces)

The math is **identical**! So why the offset?

---

## 🧪 Debug Logging Added

### Console Output to Check

When you toggle "Show Content Slots" with main text that has LEFT or RIGHT alignment:

**Look for this output:**

```
📐 Line bounds calculation (line 0):
   mode: MAIN TEXT
   positionH: center (or left/right?)
   alignH: left (or right)
   contentX: ???, availableWidth: ???
   lineX: ???, boundX: ???
   tightWidth: ???

📍 Single logical line fix - MAIN TEXT MODE:
   contentX: ???, availableWidth: ???
   alignH: left (or right), fullTextWidth: ???
   LEFT: correctedX = ???
   (or RIGHT: correctedX = ...)
```

### Key Values to Compare

1. **contentX**: Should be the same in both logs
2. **availableWidth**: Should be the same in both logs
3. **lineX vs correctedX**: Should match for LEFT align
4. **boundX vs correctedX**: Should match (accounting for tightWidth vs fullTextWidth difference)

### Potential Issues to Detect

1. **positionH not 'center'**: If positionH is 'left' or 'right' for main text, this could affect rendering but not bounds
2. **Padding differences**: If containerX or paddingLeft changes between calculations
3. **Width measurement differences**: If tightWidth and fullTextWidth differ significantly

---

## 📊 Test Cases

### Test 1: Main Text LEFT Align with Spaces

1. Create main text cell with text like "WIX STUDIO" or "HELLO WORLD"
2. Set alignment: LEFT
3. Toggle "Show Content Slots"
4. Check console output

**Expected:**
- Per-line: `boundX = contentX`
- Single logical: `correctedX = contentX`
- **Visual**: Content slot should start at left edge of content area

### Test 2: Main Text RIGHT Align with Spaces

1. Same text
2. Set alignment: RIGHT
3. Toggle "Show Content Slots"
4. Check console output

**Expected:**
- Per-line: `boundX = contentX + availableWidth - tightWidth`
- Single logical: `correctedX = contentX + availableWidth - fullTextWidth`
- **Visual**: Content slot should end at right edge of content area

### Test 3: Check positionH Value

**Critical**: Main text cells should have `positionH = 'center'` by default.

If positionH is something else, this could cause the offset because:
- Text rendering might use position.x (which considers positionH)
- But bounds calculation uses contentX (which doesn't consider positionH for main text mode)

---

## 🔧 Potential Fixes

### Option 1: Verify positionH is 'center' for Main Text

If main text has positionH='left' or 'right', we need to handle this in the bounds calculation.

### Option 2: Use Two-Step Calculation

Match the per-line approach exactly by calculating lineX first, then boundX:

```javascript
// Calculate anchor point (lineX)
let lineX;
switch (firstLineAlign) {
    case 'left':
        lineX = contentX;
        break;
    case 'right':
        lineX = contentX + availableWidth;
        break;
    case 'center':
    default:
        lineX = contentX + availableWidth / 2;
        break;
}

// Calculate bounds from anchor (boundX)
switch (firstLineAlign) {
    case 'left':
        correctedX = lineX;
        break;
    case 'right':
        correctedX = lineX - fullTextWidth;
        break;
    case 'center':
    default:
        correctedX = lineX - fullTextWidth / 2;
        break;
}
```

This is mathematically identical but makes the structure match exactly.

### Option 3: Consider Text Rendering Anchor

Check if text rendering uses a different anchor point than bounds calculation. The rendering code might use `position.x` while bounds use `contentX`.

---

## 📝 Next Steps

1. **Run the app** with debug logging enabled
2. **Copy console output** for LEFT and RIGHT aligned main text
3. **Compare values**: Check if contentX, availableWidth, lineX, boundX, correctedX match expected values
4. **Identify discrepancy**: Find which value is causing the offset
5. **Apply fix**: Based on the root cause identified

---

## 🔗 Related Files

- [TextComponent.js](../js/text/TextComponent.js) - Text rendering and bounds calculation
- [single-logical-line-fix.md](single-logical-line-fix.md) - Previous space calculation fix
- [position-align-fix.md](position-align-fix.md) - Position vs alignment concepts

---

**Status**: 🔍 **AWAITING CONSOLE OUTPUT** - Please test and share the console logs!
