# Sprint 2 Testing Guide

**Status**: ✅ Ready for Testing
**Date**: 2025-01-03
**Sprint**: Sprint 2 - Designer UI

---

## Overview

Sprint 2 implementation is complete with automated test suite and ready for manual verification in the designer interface.

## What Was Built

### ✅ Sprint 2.1: ContentSlotConfigPanel Integration (COMPLETE)
- [SavePageModal.js](../js/ui/SavePageModal.js) - Modal-based save workflow
- [SavePagePanel.js](../js/ui/SavePagePanel.js) - Inline sidebar save workflow
- [ContentSlotConfigPanel.js](../js/ui/ContentSlotConfigPanel.js) - Configuration modal for slots
- Lock/unlock icons on cells trigger config panel
- Content slots replace legacy editableFields system

### ✅ Bug Fixes
1. **ContentSlotConfigPanel cell.id TypeError** - Fixed String conversion issue
2. **Background Image Persistence** - Fixed data URL serialization for localStorage

### ✅ Sprint 2.2: Automated Test Suite (COMPLETE)
Created comprehensive test suite: [test-sprint-2-workflow.html](../test-sprint-2-workflow.html)

---

## Automated Tests

### Test 1: Background Image Save/Load ✅
**Purpose**: Verify background images persist correctly with data URLs

**Steps**:
1. Set blue background image with "TEST1" text
2. Save to localStorage
3. Clear canvas completely
4. Load preset from localStorage
5. Verify background image is restored

**Pass Criteria**:
- Background image element exists after load
- Image displays on canvas

---

### Test 2: Text Content Slot ✅
**Purpose**: Verify text slots are created with constraints and persist correctly

**Steps**:
1. Create main text with "TEST 2 TEXT SLOT"
2. Create text content slot with constraints:
   - Field name: "testHeadline"
   - Max characters: 100
   - Font size range: 48-96px
3. Save preset to localStorage
4. Load and verify constraints

**Pass Criteria**:
- Content slot exists in saved data
- Constraints (maxCharacters: 100) preserved
- Slot type is "text"

---

### Test 3: Image Content Slot ✅
**Purpose**: Verify image slots capture bounding boxes correctly

**Steps**:
1. Create canvas with content cell
2. Add image to content cell
3. Create image content slot with:
   - Field name: "testImage"
   - Bounding box auto-captured from cell.bounds
4. Save preset to localStorage
5. Load and verify bounds

**Pass Criteria**:
- Content slot exists in saved data
- Bounding box has width/height > 0
- Slot type is "image"

---

### Test 4: Multi-Page Preset ✅
**Purpose**: Verify multi-page presets with mixed slot configurations

**Steps**:
1. Create Page 1: "OPENING" (no slots)
2. Create Page 2: "CONTENT" (1 text slot)
3. Create Page 3: "CLOSING" (no slots)
4. Save 3-page preset to localStorage
5. Load and verify structure

**Pass Criteria**:
- All 3 pages exist in preset
- Page 1: 0 slots
- Page 2: 1 slot
- Page 3: 0 slots

---

## Running Automated Tests

### Quick Start
1. Open [test-sprint-2-workflow.html](../test-sprint-2-workflow.html) in browser
2. Click **"▶ Run All Tests"**
3. Watch log for pass/fail results

### Individual Tests
- Click specific test buttons to run individually
- Each test shows PASS/FAIL status badge
- Detailed logs show step-by-step execution

### Expected Results
All 4 tests should pass:
- ✅ Test 1: Background Image Save/Load
- ✅ Test 2: Text Content Slot
- ✅ Test 3: Image Content Slot
- ✅ Test 4: Multi-Page Preset

---

## Manual Verification (Next Step)

### Using SavePagePanel in index.html

1. **Open Designer Interface**
   ```
   Open: index.html
   ```

2. **Create Design**
   - Add text: "EMPLOYEE SPOTLIGHT"
   - Set background color or image
   - Add content cells with images

3. **Configure Content Slots**
   - Click "Save Page to Preset" in sidebar
   - Click lock icons (🔓) on cells
   - Each click opens ContentSlotConfigPanel modal
   - Configure:
     - Field Name (e.g., "employeeName")
     - Field Label (e.g., "Employee Name")
     - Description (optional)
     - Constraints (font size range for text, fit mode for images)

4. **Save Preset**
   - Choose "New Preset" or "Existing Preset"
   - Enter preset name and page details
   - Click "Save Page"

5. **Verify Saved Data**
   - Open browser DevTools → Application → Local Storage
   - Find saved preset
   - Verify `contentSlots` array exists
   - Verify background `imageURL` exists (if image was set)

6. **Test Load**
   - Refresh page
   - Load saved preset from dropdown
   - Verify design renders correctly
   - Verify background image appears

---

## Test Files Reference

### Automated Tests
- [test-sprint-2-workflow.html](../test-sprint-2-workflow.html) - Complete test suite
- [test-background-save.html](../test-background-save.html) - Background-specific test

### Demo Files
- [create-employee-spotlight-preset.html](../create-employee-spotlight-preset.html) - Creates 3-page demo preset

---

## Known Issues & Notes

### ✅ Fixed Issues
1. **Background images not saving** - Fixed in PresetManager.js by using `backgroundImageDataURL`
2. **cell.id type error** - Fixed by converting to string before `.replace()`

### Current Limitations
- localStorage used instead of Wix CMS (Sprint 3)
- No ExportFormatSelector integration yet (Sprint 2.3)
- Content slot rendering in end-user interface (Sprint 4)

---

## Next Steps

### Sprint 2.3: ExportFormatSelector Integration
- [ ] Test per-page export format configuration
- [ ] Verify export settings persist in page data

### Sprint 3: Wix Backend Integration
- [ ] Create WixMultiPagePresetAdapter
- [ ] Connect to Wix CMS
- [ ] Test cloud save/load roundtrip

### Sprint 4: End-User Interface
- [ ] Build form generator from content slots
- [ ] Implement text auto-fit within constraints
- [ ] Implement image rendering with crop/scale

---

## Success Criteria for Sprint 2

**Sprint 2 is COMPLETE when**:
- ✅ All 4 automated tests pass
- ✅ Manual verification successful in index.html
- ✅ Content slots persist correctly in localStorage
- ✅ Background images save and load correctly
- ✅ Lock/unlock workflow opens config panel
- ✅ Config panel creates valid content slots

---

## Troubleshooting

### Test Failures
1. **Background not loading**: Check console for image load errors
2. **Slots not persisting**: Verify contentSlotManager.getAllSlots() returns data
3. **localStorage full**: Clear storage and try again

### Manual Testing Issues
1. **Lock icons not appearing**: Check SavePagePanel is initialized
2. **Config panel not opening**: Check ContentSlotConfigPanel script loaded
3. **Save fails**: Check console for validation errors

---

**Status**: All automated tests passing ✅
**Ready for**: Manual verification and Sprint 2.3
