# Position + Alignment Fix for Content Cell Text

**Date**: 2025-11-05
**Status**: 🧪 **READY FOR TESTING**
**Branch**: locked-presets

---

## 🎯 Problem Summary

For **content cells with text**, there are TWO positioning systems:

1. **`positionH/V`** - Where to place the text block in the cell (left/center/right, top/middle/bottom)
2. **`textAlign` (alignH)** - How text aligns within itself (left/center/right)

**The Bug**: `getTextBounds()` was only considering `textAlign`, ignoring `positionH`!

---

## 📊 Visual Example

### Text Properties
```javascript
positionH: 'left'    // Place text block at LEFT of cell
textAlign: 'center'  // Text is center-aligned within itself
```

### Before Fix ❌
```
Cell: [--------container--------]
      ┌─────────────────────────┐
      │    TEXT CENTERED       │  ← Ignores positionH
      │                         │     Uses contentX + padding
      └─────────────────────────┘
```

### After Fix ✅
```
Cell: [--------container--------]
      ┌─────────────────────────┐
      │TEXT CENTERED │          │  ← Respects positionH='left'
      │              │          │     Uses anchor from calculateTextPosition()
      └─────────────────────────┘
```

---

## 🔍 Root Cause

**File**: [TextComponent.js:281](../js/text/TextComponent.js#L281)

**Before**:
```javascript
// Only uses containerX + padding (ignores positionH)
const contentX = this.containerX + this.paddingLeft;

switch (lineAlign) {
    case 'left':
        lineX = contentX;  // ❌ Wrong! Doesn't account for positionH
        break;
    // ...
}
```

**After**:
```javascript
// Uses position.x which includes positionH
switch (lineAlign) {
    case 'left':
        lineX = position.x;  // ✅ Correct! Includes positionH
        break;
    case 'right':
        lineX = position.x;  // Anchor position
        break;
    case 'center':
        lineX = position.x;  // Anchor position
        break;
}
```

---

## 🔧 The Fix

### Changed Code

**File**: [TextComponent.js:279-303](../js/text/TextComponent.js#L279-L303)

**Key Change**: Use `position.x` (which includes `positionH`) instead of recalculating from `contentX`.

```javascript
// position.x is calculated by calculateTextPosition() which considers:
// - containerX
// - paddingLeft
// - positionH (left/center/right)

switch (this.positionH) {
    case 'left':
        anchorX = contentX;  // Left edge
        break;
    case 'right':
        anchorX = contentX + contentWidth;  // Right edge
        break;
    case 'center':
        anchorX = contentX + contentWidth / 2;  // Center
        break;
}
```

Then `lineX = position.x` uses this anchor, and `boundX` is calculated relative to it based on `textAlign`.

---

## 📋 Test Cases

### Test 1: positionH='left', textAlign='center'
```javascript
Cell width: 400px
Text: "HELLO"
positionH: 'left'
textAlign: 'center'

Expected:
- Text block placed at LEFT of cell
- Text itself is center-aligned
- Bounds should start near left edge

Before: Bounds centered in cell (wrong)
After: Bounds at left with centered text (correct)
```

### Test 2: positionH='right', textAlign='left'
```javascript
positionH: 'right'
textAlign: 'left'

Expected:
- Text block placed at RIGHT of cell
- Text itself is left-aligned
- Bounds should be near right edge

Before: Bounds at left edge (wrong)
After: Bounds at right edge (correct)
```

### Test 3: positionH='center', textAlign='center'
```javascript
positionH: 'center'
textAlign: 'center'

Expected:
- Text block centered in cell
- Text itself is center-aligned
- Should work as before (already correct)
```

---

## 🧪 How to Test

1. **Create a content cell with text**
2. **Set positioning**:
   ```javascript
   cell.textComponent.positionH = 'left';  // or 'right'
   cell.textComponent.alignH = 'center';   // or 'left', 'right'
   ```
3. **Toggle "Show Content Slots"**
4. **Check console output**:
   ```
   📍 Position calculation:
      positionH: left, positionV: middle
      alignH: center, alignV: middle
      Anchor position: x=60, y=300
   ```
5. **Verify bounding box** visually matches expected position

---

## 🔑 Key Concepts

### Position vs Alignment

| Property | What It Controls | Example |
|----------|-----------------|---------|
| `positionH` | Where text block sits in container | "Put text at left side of cell" |
| `textAlign` (alignH) | How text aligns within itself | "Center the text within its block" |
| `positionV` | Vertical position in container | "Put text at top of cell" |
| `alignV` | Vertical text alignment | "Align text to top of its block" |

### Example Combinations

**positionH='left' + textAlign='center'**:
```
[LEFT                    ]
 ↓
[  CENTERED TEXT  ]......
```

**positionH='right' + textAlign='left'**:
```
[                   RIGHT]
                       ↓
................[LEFT TEXT]
```

**positionH='center' + textAlign='right'**:
```
[         CENTER         ]
             ↓
........[RIGHT TEXT]......
```

---

## ✅ Expected Results

After this fix:
- ✅ Content cell text respects BOTH `positionH` and `textAlign`
- ✅ Bounding boxes accurately reflect text position
- ✅ Works for all 9 position combinations (3x3 grid)
- ✅ Main text cells unaffected (they use default center/middle)

---

## 🔗 Related Code

### TextComponent Properties (Lines 6-69)
```javascript
// TEXT ALIGNMENT - how text aligns within itself
this.alignH = 'center';     // left/center/right
this.alignV = 'middle';     // top/middle/bottom

// POSITION ALIGNMENT - where text block sits in container
this.positionH = 'center';  // left/center/right
this.positionV = 'middle';  // top/middle/bottom
```

### calculateTextPosition() (Lines 778-823)
- Calculates anchor position based on `positionH/V`
- Returns `{ x, y }` that accounts for container + padding + position

### getTextBounds() (Lines 219-459)
- Uses `position.x` for horizontal anchor
- Uses `position.y` for vertical anchor
- Calculates bounds relative to these anchors

---

## 📝 Testing Checklist

- [ ] positionH='left' + textAlign='left'
- [ ] positionH='left' + textAlign='center'
- [ ] positionH='left' + textAlign='right'
- [ ] positionH='center' + textAlign='left'
- [ ] positionH='center' + textAlign='center' (default, should still work)
- [ ] positionH='center' + textAlign='right'
- [ ] positionH='right' + textAlign='left'
- [ ] positionH='right' + textAlign='center'
- [ ] positionH='right' + textAlign='right'
- [ ] Verify main text cells still work correctly
- [ ] Verify single logical line fix still works

---

## 🚀 Next Steps

1. **Test with various position/alignment combinations**
2. **Verify bounding boxes match visual rendering**
3. **Commit if tests pass**
4. **Document any edge cases found**

---

**Status**: 🧪 **READY FOR TESTING**

Please test and share console output showing:
```
📍 Position calculation:
   positionH: left (or center/right)
   alignH: center (or left/right)
   Anchor position: x=???, y=???
```

And verify the visual bounding box position matches expectations!
