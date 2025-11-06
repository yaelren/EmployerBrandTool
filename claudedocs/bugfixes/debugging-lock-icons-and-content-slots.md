# Debugging: Lock Icons & Content Slots Not Showing

## Issues to Debug

1. **Lock icons not updating from 🔒 to 🔓 after slot creation**
2. **"Show Content Slots" overlay shows no slots**

## Debugging Code Added

### Location: [SavePagePanel.js:439-458](../js/ui/SavePagePanel.js#L439-L458)

Added comprehensive logging to `updateLockIcon()` method:

```javascript
updateLockIcon(elementId, isEditable) {
    console.log('🔍 updateLockIcon called:', { elementId, isEditable, overlayExists: !!this.overlay });

    if (!this.overlay) {
        console.error('❌ No overlay found!');
        return;
    }

    const lockIcon = this.overlay.querySelector(`[data-element-id="${elementId}"]`);
    console.log('🔍 Lock icon found:', lockIcon ? 'YES' : 'NO', 'for elementId:', elementId);

    if (lockIcon) {
        lockIcon.innerHTML = isEditable ? '🔓' : '🔒';
        lockIcon.classList.toggle('unlocked', isEditable);
        console.log('✅ Lock icon updated to:', lockIcon.innerHTML);
    } else {
        console.error('❌ Lock icon not found in overlay for:', elementId);
        console.log('Available lock icons:', Array.from(this.overlay.querySelectorAll('[data-element-id]')).map(el => el.dataset.elementId));
    }
}
```

### Location: [SavePagePanel.js:1032-1070](../js/ui/SavePagePanel.js#L1032-L1070)

Added logging to slot creation to verify ContentSlotManager registration:

```javascript
// Add to content slot manager
console.log('📝 Adding slot to ContentSlotManager:', slot.slotId);
this.app.presetPageManager.contentSlotManager.addSlot(slot);

// Verify it was added
const allSlots = this.app.presetPageManager.contentSlotManager.getAllSlots();
const verifySlot = allSlots.find(s => s.slotId === slot.slotId);
console.log('✅ Slot added to ContentSlotManager:', verifySlot ? 'YES' : 'NO');
console.log('📊 Total slots in ContentSlotManager:', allSlots.length);
console.log('📋 All slot IDs:', allSlots.map(s => s.slotId));

// Update lock icon
console.log('🔓 About to update lock icon for:', elementId);
this.updateLockIcon(elementId, true);

// Force refresh overlay
if (this.overlay && this.overlay.parentElement) {
    console.log('🔄 Refreshing all overlay lock icons');
    this.refreshOverlayLockIcons();
}

console.log('✅ New slot created:', slot.slotId, 'elementId:', elementId);
```

## How to Test

1. Open browser console (F12)
2. Open SavePagePanel
3. Click a lock icon (🔒) to configure a slot
4. Fill in field details and save
5. **Check console for these logs:**

### Expected Console Output (Success):
```
📝 Adding slot to ContentSlotManager: 1-1730724123456-slot
✅ Slot added to ContentSlotManager: YES
📊 Total slots in ContentSlotManager: 1
📋 All slot IDs: ['1-1730724123456-slot']
🔓 About to update lock icon for: textCell-1
🔍 updateLockIcon called: {elementId: 'textCell-1', isEditable: true, overlayExists: true}
🔍 Lock icon found: YES for elementId: textCell-1
✅ Lock icon updated to: 🔓
🔄 Refreshing all overlay lock icons
✅ New slot created: 1-1730724123456-slot elementId: textCell-1
```

### Possible Error Scenarios:

#### Scenario A: Overlay Doesn't Exist
```
🔓 About to update lock icon for: textCell-1
🔍 updateLockIcon called: {elementId: 'textCell-1', isEditable: true, overlayExists: false}
❌ No overlay found!
```
**Fix**: Ensure overlay is created before calling `updateLockIcon()`

#### Scenario B: Lock Icon Not Found
```
🔍 updateLockIcon called: {elementId: 'textCell-1', isEditable: true, overlayExists: true}
🔍 Lock icon found: NO for elementId: textCell-1
❌ Lock icon not found in overlay for: textCell-1
Available lock icons: ['contentCell-1', 'contentCell-2', 'mainText']
```
**Fix**: elementId mismatch - check `_getElementIdForSlot()` vs actual overlay IDs

#### Scenario C: Slot Not Added to ContentSlotManager
```
📝 Adding slot to ContentSlotManager: 1-1730724123456-slot
✅ Slot added to ContentSlotManager: NO
📊 Total slots in ContentSlotManager: 0
📋 All slot IDs: []
```
**Fix**: `addSlot()` method failing or slot validation issue

## What to Report

After testing, report:

1. **Console output** - Copy all logs starting with emoji prefixes (🔍, ✅, ❌, 📝, etc.)
2. **Lock icon behavior** - Did it change from 🔒 to 🔓?
3. **Content Slots overlay** - Do slots appear when clicking "Show Content Slots"?
4. **Any errors** - Red error messages in console

## Root Cause Hypotheses

### Hypothesis 1: Timing Issue
- Lock icons rendered **after** `updateLockIcon()` is called
- **Test**: Add delay before update
- **Probability**: Low (overlay should exist when panel opens)

### Hypothesis 2: elementId Mismatch
- elementId format doesn't match overlay's `data-element-id`
- **Test**: Compare console "Available lock icons" vs requested elementId
- **Probability**: High (most common DOM query issue)

### Hypothesis 3: ContentSlotManager Not Persisting
- Slots added but immediately cleared or lost
- **Test**: Check slot count after creation
- **Probability**: Medium (possible race condition)

### Hypothesis 4: Overlay Reference Stale
- `this.overlay` points to old/removed DOM element
- **Test**: Check `overlayExists: true` but no icons found
- **Probability**: Medium (overlay might be recreated)
