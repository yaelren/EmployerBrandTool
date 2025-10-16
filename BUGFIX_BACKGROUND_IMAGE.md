# Bug Fix: Background Image Not Rendering on First Load

## 🐛 The Problem

**Symptoms:**
- Background image doesn't appear when loading a preset (first time)
- Second click on "Load" button makes it appear
- Cell images work fine on first load

**User Report:**
> "when I say 'backward image,' it loaded the layout, but didn't load the backward image when I first loaded. But when I click 'load' the second time, it did work."

## 🔍 Root Cause

**Asynchronous Image Loading Without Render:**

The background image loading was asynchronous (Image.onload callback), but unlike cell images, it **didn't trigger a canvas render** when the image finished loading.

### Code Flow Before Fix:

```javascript
// PresetManager.js - restoreBackgroundState()
const img = new Image();
img.onload = () => {
    bg.setBackgroundImage(img);
    console.log('✅ Background image loaded and set!');
    // ❌ NO RENDER TRIGGERED!
};
img.src = backgroundData.imageURL;
```

### Why Second Click Worked:

When you clicked "Load" again, the preset restoration triggered a full render cycle, which then drew the already-loaded background image from the first attempt.

## ✅ The Fix

**Added render trigger in background image onload callback:**

```javascript
// PresetManager.js:421 - restoreBackgroundState()
img.onload = () => {
    bg.setBackgroundImage(img);
    console.log('✅ Background image loaded and set!');
    console.log('→ Triggering canvas render...');
    this.app.render(); // ✅ CRITICAL: Trigger render so image appears!
};
```

**Location:** [PresetManager.js:421](js/parameters/PresetManager.js#L421)

## 🧪 Verification

**Before Fix:**
1. Save preset with background image ✅
2. Load preset → Background NOT visible ❌
3. Click Load again → Background NOW visible ✅

**After Fix:**
1. Save preset with background image ✅
2. Load preset → Background visible immediately ✅

**Console Output (After Fix):**
```
🔄 LOAD: Restoring background image...
   → URL type: data:image/png;base64,iVBORw0K
   → URL length: 103186 characters
   ✅ Background image loaded and set!
   → Image size: 1920 x 1080
   → Triggering canvas render...  ← NEW!
```

## 🎥 Video Handling

**Bonus Fix:** Added better logging for skipped videos

Videos in content cells are currently not supported in presets (Phase I limitation). Now you'll see clear warnings:

```javascript
⚠️ SAVE: Cell content-1-0 has video (will be skipped)
...
⚠️ SAVE: Skipped 1 video(s) - videos cannot be saved in presets yet
```

**Why Videos Are Skipped:**
- Videos are large binary files (not suitable for localStorage)
- Data URL conversion would exceed browser limits
- Future Phase II will use Wix CDN for video storage

## 📋 Changes Made

### 1. Background Image Render Trigger
**File:** `js/parameters/PresetManager.js`
**Line:** 421
**Change:** Added `this.app.render()` to `img.onload` callback

### 2. Video Skip Counter
**File:** `js/parameters/PresetManager.js`
**Lines:** 712-741
**Change:** Added `videoSkipCount` tracking and warning message

## 🚀 Testing Checklist

- [x] Background image appears on first load
- [x] Cell images still work correctly
- [x] Video skip warning displays in console
- [x] Second load doesn't cause issues
- [x] Canvas renders properly after async load

## 📝 Related Issues

- **Cell images working:** Already had `this.app.render()` in their onload (line 617)
- **Why background was different:** Background image restoration didn't have render trigger
- **Consistency:** Now both background and cell images trigger render on load

## 🎯 Impact

**Before:**
- Confusing UX (need to click Load twice)
- Background images appeared "broken"
- Users might think presets don't save images

**After:**
- ✅ Background images appear immediately
- ✅ Clear messaging about video limitations
- ✅ Consistent behavior with cell images
- ✅ Better user experience

## 🔗 Commit

This fix will be included in the next commit along with video skip improvements.
