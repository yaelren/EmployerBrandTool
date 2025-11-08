# Width Calculation Debugging Guide

**Date**: 2025-11-05
**Issue**: Main text cells with spaces between words may have incorrect width calculations
**User Report**: "Spacing works for text inside content cells, but not for main text"

---

## 🔍 The Suspected Issue

**Problem Location**: [TextComponent.js:524-536](../js/text/TextComponent.js#L524-L536) - `getTightTextWidth()` method

### Current Behavior

**Main Text Cells** use `getTightTextWidth()`:
```javascript
// Line 283 in getTextBounds()
const tightWidth = this.getTightTextWidth(ctx, line);

// getTightTextWidth() implementation
getTightTextWidth(ctx, text) {
    const metrics = ctx.measureText(text);

    if (metrics.actualBoundingBoxRight !== undefined) {
        return metrics.actualBoundingBoxRight;  // ← Only measures to right edge of GLYPHS
    }

    return metrics.width;  // ← Includes trailing spaces
}
```

**Content Cell Text** (fallback path) uses `metrics.width`:
```javascript
// Line 196 in ContentSlotManager
const textWidth = metrics.width;  // ← Includes trailing spaces
```

### The Key Difference

| Method | Trailing Spaces | Leading Spaces | Glyph Ink |
|--------|----------------|----------------|-----------|
| `metrics.width` | ✅ Included | ✅ Included | ✅ Included |
| `actualBoundingBoxRight` | ❌ Excluded | ❌ Excluded | ✅ Only glyphs |

**Example**:
- Text: `"HELLO WORLD"`
- `metrics.width`: ~150px (includes space between words)
- `actualBoundingBoxRight`: ~145px (measures only to edge of "D")

---

## 🧪 Testing Instructions

### Step 1: Create Test Case

1. **Open the app** in browser
2. **Create a main text cell** with text that has spaces:
   - Example 1: `"HELLO WORLD"` (2 words with space)
   - Example 2: `"THE NEW PHONE"` (3 words with spaces)
   - Example 3: `"WELCOME TO OUR COMPANY"` (4 words)

3. **Create a content cell with text** using the SAME text:
   - Upload text to a content cell
   - Use identical text: `"HELLO WORLD"`

### Step 2: Open Console & Toggle Overlay

1. **Open browser console** (F12)
2. **Click "Show Content Slots"** button
3. **Observe the console output**

### Step 3: Analyze Console Output

You should see output like this:

```
📝 _captureTextBounds() called for cell 3
   → Cell type: main-text
   → Has textComponent: true
   → Text preview: "HELLO WORLD..."
   → Taking TEXTCOMPONENT path (has textComponent + bounds)
   → Calling cell.textComponent.getTextBounds()

📏 getTightTextWidth() called for: "HELLO WORLD"
   → metrics.width: 150.5
   → actualBoundingBoxLeft: 0
   → actualBoundingBoxRight: 145.2
   → Using actualBoundingBoxRight: 145.2
   → Difference from metrics.width: 5.3 px

   → textBounds returned 1 lines
   → Line 0: "HELLO WORLD"
      x: 100, y: 50, width: 145.2, height: 60
   ✅ Final combined bounds: {x: 100, y: 50, width: 145.2, height: 60}
```

**Compare to content cell:**
```
📝 _captureTextBounds() called for cell 8
   → Cell type: content
   → Has textComponent: false
   → Text preview: "HELLO WORLD..."
   → Taking FALLBACK path (manual calculation)
   → Fallback width calculation for: "HELLO WORLD"
      metrics.width: 150.5
      Using textWidth: 150.5
```

### Step 4: Visual Verification

**Check the bounding boxes on the canvas:**
- Main text bounding box should be **narrower** (cuts off trailing space)
- Content cell text bounding box should be **wider** (includes full width)

---

## 🎯 What to Look For

### Confirm the Bug

1. **Width difference**: Main text width < content cell width for same text
2. **Console values**:
   - Main text uses `actualBoundingBoxRight` value
   - Content cell uses `metrics.width` value
3. **Visual mismatch**: Bounding box doesn't fully wrap the text area

### Expected Console Output

**For Main Text with Spaces:**
```
📏 getTightTextWidth() called for: "HELLO WORLD"
   → Difference from metrics.width: 5.3 px    ← Should be > 0 if spaces exist
```

**For Content Cell Text:**
```
   → Fallback width calculation for: "HELLO WORLD"
      metrics.width: 150.5
      Using textWidth: 150.5    ← Uses full width
```

---

## 🔧 Potential Solutions

### Option 1: Always Use `metrics.width` for Main Text

**Change**: [TextComponent.js:524-536](../js/text/TextComponent.js#L524-L536)

```javascript
getTightTextWidth(ctx, text) {
    const metrics = ctx.measureText(text);

    // Always use standard width (includes spaces)
    return metrics.width;
}
```

**Pros**: Simple, consistent with content cells
**Cons**: May make bounding boxes slightly larger than visual glyphs

### Option 2: Use `actualBoundingBoxLeft + actualBoundingBoxRight`

```javascript
getTightTextWidth(ctx, text) {
    const metrics = ctx.measureText(text);

    if (metrics.actualBoundingBoxLeft !== undefined &&
        metrics.actualBoundingBoxRight !== undefined) {
        // Include both sides for accurate measurement
        return metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
    }

    return metrics.width;
}
```

**Pros**: More accurate to actual glyph bounds
**Cons**: Still doesn't include trailing spaces

### Option 3: Add Parameter to Control Behavior

```javascript
getTightTextWidth(ctx, text, includeSpaces = true) {
    const metrics = ctx.measureText(text);

    if (!includeSpaces && metrics.actualBoundingBoxRight !== undefined) {
        return metrics.actualBoundingBoxRight;
    }

    return metrics.width;
}
```

**Pros**: Flexible, maintains both behaviors
**Cons**: More complex API

---

## 📋 Test Checklist

- [ ] Main text with single space: "HELLO WORLD"
- [ ] Main text with multiple spaces: "THE NEW PHONE"
- [ ] Main text with trailing space: "HELLO "
- [ ] Main text with leading space: " HELLO"
- [ ] Content cell with same text for comparison
- [ ] Console output captured for all cases
- [ ] Visual bounding boxes compared
- [ ] Width difference calculated

---

## 🚀 Next Steps

1. **Run the tests** following the instructions above
2. **Copy console output** to share with development team
3. **Take screenshots** of bounding boxes for visual comparison
4. **Decide on solution** based on desired behavior:
   - Should bounding boxes wrap full text width (including spaces)?
   - Or should they wrap only visible glyphs (excluding spaces)?

---

## 📊 Current Status

**Status**: 🐛 Debugging in progress
**Logging Added**: ✅ Complete
**Files Modified**:
- [ContentSlotManager.js](../js/parameters/ContentSlotManager.js) - Added detailed logging
- [TextComponent.js](../js/text/TextComponent.js) - Added width calculation logging

**Awaiting**: User testing and console output
