# Lock Icon State Debugging

**Date**: 2025-11-05
**Status**: 🔍 **DEBUG LOGGING ADDED**
**Branch**: locked-presets

---

## 🎯 Issue

Lock icons may not be consistently showing locked (🔒) vs unlocked (🔓) states.

---

## 🔍 Debug Logging Added

I've added comprehensive logging to track lock icon state changes. When you open the Save Page panel and interact with lock icons, you'll see:

### On Initial Render

```
🔒 Rendered 5 lock icons based on content slot bounds

🔍 Lock icon for cell 3:
  elementId: contentCell-3
  cellType: content
  isEditable: false
  emoji: 🔒

🔍 Lock icon for cell 5:
  elementId: contentCell-5
  cellType: content
  isEditable: true
  emoji: 🔓
```

### When Refreshing Icons

```
🔄 refreshOverlayLockIcons called
📊 Found 5 lock icons to refresh

  🔄 Refreshing icon for contentCell-3:
    isRegistered: false
    emoji: 🔒
    hadUnlockedClass: false

  🔄 Refreshing icon for contentCell-5:
    isRegistered: true
    emoji: 🔓
    hadUnlockedClass: true
```

### When Updating Single Icon

```
🔍 updateLockIcon called:
  elementId: contentCell-3
  isEditable: true
  overlayExists: true

🔍 Lock icon found: YES for elementId: contentCell-3
✅ Lock icon updated to: 🔓
```

---

## 🧪 How to Test

### Test 1: Initial State
1. Open Save Page panel
2. Check console for "Rendered X lock icons"
3. Verify each icon log shows correct `isEditable` and `emoji`
4. Visually check if icons match the console output

### Test 2: Creating New Slot
1. Click a 🔒 (locked) icon
2. Fill in the Field Label
3. Check console for "updateLockIcon called" with `isEditable: true`
4. Verify icon changes to 🔓
5. Check "refreshOverlayLockIcons" shows updated state

### Test 3: Deleting Slot
1. Delete an existing slot
2. Check console for "updateLockIcon called" with `isEditable: false`
3. Verify icon changes to 🔒
4. Check "refreshOverlayLockIcons" shows updated state

### Test 4: Reopening Panel
1. Close and reopen Save Page panel
2. Icons should reflect current slot registration state
3. Console should show correct `isEditable` values

---

## 🔧 Expected Behavior

### Lock Icon Logic

```javascript
isSlotRegistered(cell) → true  → 🔓 (unlocked) + green background
isSlotRegistered(cell) → false → 🔒 (locked)   + dark background
```

### CSS Classes

```css
/* Locked (default) */
.cell-lock-icon {
    background: rgba(26, 26, 26, 0.9);
    border: 2px solid rgba(255, 255, 255, 0.2);
}

/* Unlocked */
.cell-lock-icon.unlocked {
    background: rgba(76, 175, 80, 0.15);  /* Green tint */
    border-color: rgba(76, 175, 80, 0.5);  /* Green border */
}
```

---

## 🐛 Common Issues to Check

### Issue 1: Wrong Emoji Shows
**Symptom**: All icons show 🔒 or all show 🔓  
**Debug**: Check console logs for `isEditable` / `isRegistered` values  
**Possible Cause**: `isSlotRegistered()` not working correctly

### Issue 2: Icon Doesn't Update After Action
**Symptom**: Click lock, create slot, but icon stays 🔒  
**Debug**: Check if `updateLockIcon` or `refreshOverlayLockIcons` is called  
**Possible Cause**: Event not triggering refresh

### Issue 3: Inconsistent on Reload
**Symptom**: Icons correct initially, wrong after closing/reopening panel  
**Debug**: Check `show()` method loads slots correctly  
**Possible Cause**: `configuredSlots` not syncing with ContentSlotManager

### Issue 4: Visual vs Data Mismatch
**Symptom**: Icon shows 🔓 but cell not in `configuredSlots`  
**Debug**: Check `isSlotRegistered()` matching logic  
**Possible Cause**: Cell ID matching issue (cell.id vs cell.contentId)

---

## 📊 What to Report

Please test and share:

1. **Console output** when opening Save Page panel
2. **Which icons show incorrectly** (locked when should be unlocked, or vice versa)
3. **Steps to reproduce** the inconsistency
4. **Console logs** during the reproduction steps

Example report:
```
Problem: Cell 3 shows 🔒 but should show 🔓

Console shows:
🔍 Lock icon for cell 3:
  isEditable: false  ← Should be true!
  
🔍 isSlotRegistered check:
  cellId: 3
  isRegistered: false  ← Why?
  totalSlots: 2
  matchingSlots: []  ← No matches found!
```

---

## 🔑 Key Methods to Review

### 1. `isSlotRegistered(cell)` [Line 576]
Checks if cell is registered as content slot:
- Compares `slot.sourceContentId === cell.contentId`
- Compares `slot.sourceElement === cell.id`
- Special case for main-text

### 2. `renderCellLockIcons()` [Line 379]
Initial render of all lock icons:
- Gets all content bounds
- Calls `isSlotRegistered()` for each
- Sets emoji and class

### 3. `refreshOverlayLockIcons()` [Line 499]
Updates all existing icons:
- Finds all icons in overlay
- Re-checks registration status
- Updates emoji and class

### 4. `updateLockIcon(elementId, isEditable)` [Line 475]
Updates single icon:
- Finds specific icon by elementId
- Sets emoji and class directly

---

## 🎯 Quick Fix Ideas

If you see inconsistencies, possible fixes:

### Fix 1: Force Refresh After Every Action
```javascript
// After creating/deleting slot, always refresh all icons
this.refreshOverlayLockIcons();
```

### Fix 2: Simplify Lock Icon Logic
Use only emoji, remove CSS classes:
```javascript
lockIcon.innerHTML = isRegistered ? '🔓' : '🔒';
// Remove: lockIcon.classList.toggle('unlocked', isRegistered);
```

### Fix 3: Add Visual Indicator
Add text label to icon:
```javascript
lockIcon.innerHTML = isRegistered 
    ? '🔓<small>Edit</small>' 
    : '🔒<small>Lock</small>';
```

---

**Status**: 🔍 **AWAITING TEST RESULTS**

Please test and share console output so we can identify the exact issue!
