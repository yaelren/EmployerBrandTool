# Single Logical Line Fix - Complete

**Date**: 2025-11-05
**Status**: ✅ **FIXED & PUSHED**
**Branch**: locked-presets
**Commit**: f7b424c

---

## 🎯 Problem Summary

When main text like **"WIX STUDIO"** wrapped to multiple lines, the content slot bounding box calculation was incorrect:

### Issues Found
1. **Width**: Lost space between words (only measured individual lines)
2. **Height**: Combined all wrapped lines instead of treating as single line
3. **X Position**: Used first line's position (offset right for center-aligned text)
4. **Y Position**: Used first line's Y (too high, not centered)

### Example: "WIX STUDIO"
```
Wrapped to:
Line 1: "WIX"    (194px wide)
Line 2: "STUDIO" (380px wide)

❌ Before Fix:
   Width: 380px (only "STUDIO", lost space!)
   Height: 168px (both lines)
   X: 224px (first line's X)
   Y: 509px (first line's Y)

✅ After Fix:
   Width: 600px (full "WIX STUDIO" with space!)
   Height: 74px (single line)
   X: 21px (centered for full width)
   Y: 556px (vertically centered)
```

---

## 🔧 Solution Implemented

### 1. Detect Single Logical Lines

**File**: [TextComponent.js:251](../js/text/TextComponent.js#L251)

```javascript
// Text with spaces but no newlines = single logical line
const isSingleLogicalLine = !this.text.includes('\n') && this.text.includes(' ');
```

**Logic**:
- `"WIX STUDIO"` → `true` (has space, no `\n`)
- `"WIX\nSTUDIO"` → `false` (has newline, intentional multi-line)
- `"TEMPLATES"` → `false` (no spaces, single word)

### 2. Measure Full Text Width

**File**: [TextComponent.js:247](../js/text/TextComponent.js#L247)

```javascript
const fullTextWidth = ctx.measureText(this.text).width;
// Measures "WIX STUDIO" as one string → 600px (includes space!)
```

### 3. Collapse Wrapped Lines to Single Bounds

**File**: [TextComponent.js:371-449](../js/text/TextComponent.js#L371-L449)

When `isSingleLogicalLine && textBounds.length > 0`:

#### Width Fix
```javascript
// Use full text width instead of widest line
width: fullTextWidth  // 600px, not 380px
```

#### Height Fix
```javascript
// Use single line height instead of combined
height: singleLineHeight  // 74px, not 168px
```

#### X Position Fix
```javascript
// Recalculate based on alignment and full width
if (firstLineAlign === 'center') {
    const widthDiff = fullTextWidth - firstLineWidth;
    correctedX = firstLineX - (widthDiff / 2);
}
// For "WIX STUDIO": 224 - (600-194)/2 = 21px
```

#### Y Position Fix
```javascript
// Center single line around wrapped text's vertical center
const verticalCenter = minY + (totalWrappedHeight / 2);
correctedY = verticalCenter - (singleLineHeight / 2);
// For "WIX STUDIO": 593 - 74/2 = 556px
```

---

## 📊 Visual Comparison

### Before Fix
```
Container: [----563px----]
┌─────────────────────────┐
│      WIX      │         │  Line 1: x=224, y=509, w=194
│   STUDIO      │         │  Line 2: x=131, y=603, w=380
└─────────────────────────┘
Final bounds: x=131, y=509, w=380, h=168
❌ Width missing space
❌ Height too tall
❌ X/Y position wrong
```

### After Fix
```
Container: [----563px----]
┌─────────────────────────┐
│                         │
│[WIX STUDIO]            │  Single: x=21, y=556, w=600, h=74
│                         │  (extends beyond container edges)
└─────────────────────────┘
✅ Width includes space
✅ Height single line
✅ Centered correctly
```

---

## 🧪 Testing Results

### Test Case 1: "WIX STUDIO" (2 words, wrapped)
```
→ Original text: "WIX STUDIO"
→ Is single logical line: true
→ Full text width: 600.20px
→ Lines wrapped: 2 (treating as single line)

Before: widest line = 379.80px
After: full text width = 600.20px

Corrected X: 21.5
Corrected Y: 556

✅ Final bounds: {x: 21.5, y: 556, width: 600.20, height: 74}
```

### Test Case 2: "TEMPLATES" (1 word, no wrap)
```
→ Original text: "TEMPLATES"
→ Is single logical line: false (no spaces)
→ Lines wrapped: 1

✅ No fix applied (single word, works as before)
✅ Final bounds: {x: 462.68, y: 1000, width: 577.32, height: 74}
```

### Test Case 3: "WIX\nSTUDIO" (intentional multi-line)
```
→ Original text: "WIX\nSTUDIO"
→ Is single logical line: false (has newline)

✅ No fix applied (intentional multi-line)
✅ Uses widest line width (correct for multi-line)
```

---

## 📝 Files Modified

### 1. [TextComponent.js](../js/text/TextComponent.js)

**Lines 236-252**: Detection logic
- Measure full text width
- Detect single logical lines

**Lines 371-449**: Single logical line fix
- Collapse wrapped lines to single bounds
- Recalculate X position based on alignment
- Recalculate Y position to center vertically
- Use full text width and single line height

**Lines 525-540**: Debug logging for `getTightTextWidth()`
- Shows `actualBoundingBoxRight` vs `metrics.width`
- Helps identify space loss issues

### 2. [ContentSlotManager.js](../js/parameters/ContentSlotManager.js)

**Lines 79-136**: Comprehensive logging
- Shows which path is taken (textComponent vs fallback)
- Logs per-line bounds with text content
- Logs final combined bounds calculation
- Shows height calculation: `maxY - minY`

**Lines 175-203**: Fallback path logging
- Shows `metrics.width` for comparison
- Helps compare main text vs content cell text behavior

---

## 🔑 Key Insights

### Why Spaces Were Lost
`getTightTextWidth()` uses `actualBoundingBoxRight`, which measures only to the **right edge of glyphs**, excluding trailing spaces:

```javascript
"WIX "       → actualBoundingBoxRight excludes trailing space
"WIX STUDIO" → When split to lines, space is between lines (lost!)
```

### Why This Only Affected Main Text
- **Main text** uses `TextComponent.getTextBounds()` → uses `getTightTextWidth()`
- **Content cell text** (fallback) uses `metrics.width` → includes spaces

### Why Position Was Wrong
Each wrapped line is positioned **independently** based on alignment:
```javascript
"WIX"    centered in 563px → x = 224
"STUDIO" centered in 563px → x = 131

When collapsed to full width (600px):
Must recenter: x = 224 - (600-194)/2 = 21
```

---

## ✅ Success Criteria

- [x] Width includes all spaces between words
- [x] Height uses single line (not combined wrapped lines)
- [x] X position correctly centered for full width
- [x] Y position centered around wrapped text's vertical center
- [x] Works for left/center/right alignment
- [x] Doesn't affect single-word text
- [x] Doesn't affect intentional multi-line text (with `\n`)
- [x] Logging added for future debugging
- [x] Committed and pushed to git

---

## 🎉 Impact

**Content slots now correctly capture the full bounding box for text that:**
- Contains multiple words with spaces
- Wraps to multiple lines due to container width
- Should be treated as a single logical line for editing

**This enables proper form field sizing for end-users when they:**
- Edit wrapped text in content slots
- See accurate character limits
- Get properly sized input fields

---

## 🔗 Related Fixes

This fix builds on previous work:
1. [text-bounds-fix-completed.md](text-bounds-fix-completed.md) - Typography-aware heights
2. [media-path-fix.md](media-path-fix.md) - Media path detection for old presets
3. Rotation and padding support (commit a13b5d6)

---

## 📌 Future Considerations

### Possible Improvements
1. **Remove debug logging** once fix is verified stable in production
2. **Add unit tests** for single logical line detection
3. **Consider performance** if many text cells (logging overhead)

### Edge Cases to Monitor
1. Text with **multiple consecutive spaces** ("WIX  STUDIO")
2. Text with **tabs** instead of spaces
3. Text with **very long words** that force wrapping mid-word
4. Text in **RTL languages** (Arabic, Hebrew)

---

## 🎓 Lessons Learned

1. **Canvas text measurement is complex**:
   - `metrics.width` includes spaces
   - `actualBoundingBoxRight` excludes trailing spaces
   - Wrapped lines lose inter-line spacing

2. **Positioning depends on context**:
   - Each wrapped line positioned independently
   - Must recalculate for different dimensions

3. **Logging is essential**:
   - Console logs helped identify exact issue
   - Visual debugging would have been harder

4. **User feedback is valuable**:
   - "Spacing works for content cells" was the key clue
   - Narrowed investigation to main text vs content text difference

---

**Status**: ✅ **COMPLETE** - Fix implemented, tested, committed, and pushed.
