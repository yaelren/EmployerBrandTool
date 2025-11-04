# Manual Test Plan: Editable Slots

## Setup
1. Open `index.html` in browser at http://127.0.0.1:5502/index.html
2. Load a preset from the dropdown
3. Scroll down to "Multi-Page Presets" section
4. Click "Save Page" button to open the SavePagePanel

## Test 1: Create Multiple Editable Slots Without Overwriting

**Steps:**
1. Click on a lock icon (🔒) on the canvas overlay
2. Inline editor should appear with default values
3. Fill in:
   - Field Name: `headline1`
   - Field Label: `Headline 1`
4. Wait 500ms for auto-save
5. Verify lock icon changes to 🔓
6. Verify "Editable Slots" list shows "Headline 1"
7. Click on a DIFFERENT lock icon (🔒)
8. Fill in:
   - Field Name: `headline2`
   - Field Label: `Headline 2`
9. Wait 500ms for auto-save
10. Verify BOTH slots appear in the list
11. Verify first slot still shows "Headline 1"

**Expected Result:** ✅ Both slots exist without overwriting

---

## Test 2: Lock Icon Updates

**Steps:**
1. Find an unconfigured cell with 🔒 icon
2. Click the lock icon
3. Configure the slot with any valid field name/label
4. Wait for auto-save
5. Check the lock icon on canvas

**Expected Result:** ✅ Lock icon changes from 🔒 to 🔓

---

## Test 3: Delete Slot via × Button

**Steps:**
1. Configure a slot (follow Test 1 steps 1-6)
2. Find the slot in "Editable Slots" list
3. Click the red × button next to the slot
4. Accept the confirmation dialog
5. Check the list and canvas

**Expected Result:**
- ✅ Slot removed from list
- ✅ Lock icon reverts to 🔒

---

## Test 4: Collapse/Expand Inline Editor

**Steps:**
1. Configure a slot
2. Click on the configured slot in the list
3. Inline editor should expand showing the slot name in header
4. Click the header (not the Remove button)
5. Editor fields should collapse, showing only header
6. Icon should change from ▼ to ▶
7. Click header again
8. Fields should expand again

**Expected Result:** ✅ Collapse/expand works, ▼ ⇄ ▶ toggles

---

## Test 5: Auto-Save While Typing

**Steps:**
1. Click lock icon to create new slot
2. Start typing in "Field Label" input
3. Type slowly: "M", "y", " ", "T", "e", "s", "t"
4. Watch the header of inline editor

**Expected Result:** ✅ Header updates to show "My Test" as you type (after 300ms debounce)

---

## Test 6: Unique Slot IDs

**Console Test:**
```javascript
// After creating 2-3 slots, run in console:
app.presetPageManager.contentSlotManager.slots
```

**Expected Result:** ✅ Each slot has unique slotId with timestamp (e.g., `1-1730724123456-slot`, `2-1730724128789-slot`)

---

## Known Issues Fixed:
- ✅ `styling` field now included in default slots
- ✅ Unique slotIds prevent overwriting
- ✅ ContentSlotManager path corrected
- ✅ Lock icons update via `refreshOverlayLockIcons()`
- ✅ Delete button (×) next to each slot
- ✅ Header styling readable (dark blue with white text)
- ✅ Auto-save on input changes (300ms debounce)
