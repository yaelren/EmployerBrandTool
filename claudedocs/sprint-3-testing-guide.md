# Sprint 3 Testing Guide: Wix CMS Integration

**Date**: 2025-01-03
**Purpose**: Test Wix multi-page preset integration with designer UI

---

## Prerequisites

✅ **Wix Configuration Already Set Up**:
- Client ID: `be6b179c-58a3-457e-aada-b37e3d245348`
- Site ID: `edaa8e17-ad18-47e2-8266-179540e1f27b`
- Wix backend initialization: Automatic on app startup

✅ **Code Integration Complete**:
- [app.js](../js/app.js:1503) - PresetPageManager Wix initialization added
- [PresetPageManager.js](../js/parameters/PresetPageManager.js) - Wix adapter integrated
- [WixMultiPagePresetAdapter.js](../js/api/WixMultiPagePresetAdapter.js) - Adapter implemented

---

## Wix CMS Setup

Before testing, ensure the `MultiPagePresets` collection exists in your Wix CMS:

### Collection Schema:
```
Collection Name: MultiPagePresets

Fields:
- presetName (Text, Required)
- description (Text, Optional)
- page1 (Rich Content, 64KB limit)
- page2 (Rich Content, 64KB limit)
- page3 (Rich Content, 64KB limit)
- page4 (Rich Content, 64KB limit)
- page5 (Rich Content, 64KB limit)
```

### Create Collection:
1. Go to your Wix site dashboard
2. Navigate to **CMS** → **Content Manager**
3. Click **+ Add Collection**
4. Name: `MultiPagePresets`
5. Add the 7 fields listed above
6. Set **Permissions**: Allow site members to read/write (or adjust as needed)

**Reference**: [wix-cms-schema.md](wix-cms-schema.md) for complete schema details

---

## Testing Workflow

### Test 1: Save Single Page to Wix CMS

**Steps**:
1. Open [index.html](../index.html) in your browser
2. Design a page:
   - Add main text: "TEST PAGE 1"
   - Set background color: Blue (#3b82f6)
   - Add some grid cells with content
3. Open browser console (F12) to see logs
4. Click the **"Save Page"** button in the right sidebar
5. In SavePagePanel:
   - Enter page name: "Test Page 1"
   - Select "Create New Preset"
   - Enter preset name: "Wix Test Single Page"
   - Page number: 1
6. Click **"Save"**

**Expected Console Output**:
```
✅ Wix Multi-Page Preset Adapter initialized
💾 Saving multi-page preset: "Wix Test Single Page"
   → Pages: 1
✅ Multi-page preset saved
   → Preset ID: [some-wix-id]
   → Name: Wix Test Single Page
   → Pages: 1
✅ Saved to Wix CMS: [preset-id]
```

**Verification**:
- Check Wix CMS dashboard → MultiPagePresets collection
- Should see new preset with `page1` field populated
- Click to view → `page1` should contain JSON data

---

### Test 2: Save Multi-Page Preset (3 Pages)

**Steps**:
1. **Page 1**:
   - Main text: "PAGE 1"
   - Background: Blue (#3b82f6)
   - Click **"Save Page"** → New Preset: "Multi-Page Test" → Page 1

2. **Page 2**:
   - Main text: "PAGE 2"
   - Background: Green (#10b981)
   - Click **"Save Page"** → Add to Existing: "Multi-Page Test" → Page 2

3. **Page 3**:
   - Main text: "PAGE 3"
   - Background: Orange (#f59e0b)
   - Click **"Save Page"** → Add to Existing: "Multi-Page Test" → Page 3

**Expected Console Output** (for each save):
```
✅ Saved to Wix CMS: [preset-id]
```

**Verification**:
- Check Wix CMS dashboard → MultiPagePresets collection
- Find "Multi-Page Test" preset
- Should have `page1`, `page2`, and `page3` fields populated with JSON

---

### Test 3: Load Page from Wix CMS

**Steps**:
1. Click **"Load Page"** button (or use LoadPageModal)
2. Select "Multi-Page Test" preset from list
3. Select Page 2
4. Click **"Load"**

**Expected Behavior**:
- Canvas clears
- Page 2 loads with:
  - Main text: "PAGE 2"
  - Background: Green (#10b981)
  - Grid cells and content restored

**Expected Console Output**:
```
📂 Loading preset from localStorage...
✅ Loaded from Wix CMS: Multi-Page Test
   → Background imageURL length: [number] chars
✅ Preset loaded successfully!
   → Background image restored: YES/NO
```

**Verification**:
- Canvas matches the original Page 2 design
- Main text is correct
- Background color is correct
- All content cells are restored

---

### Test 4: Content Slots Persistence

**Steps**:
1. Design a page with editable fields:
   - Add main text: "HERO HEADLINE"
   - Create 2-3 grid cells with text/images

2. **Lock cells** to create content slots:
   - Click on main text cell → **"Make Editable"**
   - Configure slot:
     - Field name: `heroHeadline`
     - Field label: "Hero Headline"
     - Max characters: 100
     - Font size range: 24-72px
   - Click **"Save Slot"**

   - Repeat for other cells

3. **Save the page**:
   - Click **"Save Page"**
   - New preset: "Content Slots Test"
   - Page 1

4. **Clear canvas** (refresh page or design something else)

5. **Load the page back**:
   - Click **"Load Page"**
   - Select "Content Slots Test"
   - Page 1
   - Click **"Load"**

**Expected Behavior**:
- Page loads with all visual content
- Content slots are restored to ContentSlotManager
- Locked cells remain locked
- Slot overlay indicators appear

**Expected Console Output**:
```
✅ Preset loaded: "Content Slots Test"
   → Pages: 1
✅ Restored [N] content slots
```

**Verification**:
- Open browser console
- Type: `app.presetPageManager.contentSlotManager.getAllSlots()`
- Should return array of content slots with correct structure
- Each slot should have:
  - `slotId`, `type`, `fieldName`, `fieldLabel`
  - `boundingBox` (x, y, width, height)
  - `constraints` (maxCharacters, minFontSize, maxFontSize, etc.)

---

## Console Commands for Testing

### Check Wix Integration Status:
```javascript
// Is Wix available?
app.presetPageManager.isWixAvailable()
// Should return: true

// Get Wix adapter
app.presetPageManager.wixAdapter
// Should return: WixMultiPagePresetAdapter instance
```

### Manual Save Test:
```javascript
// Capture current page
const pageData = app.presetPageManager.captureCurrentPage(1, 'Console Test Page');

// Build preset
const preset = {
    presetName: 'Console Test',
    description: 'Manual test from console',
    page1: JSON.stringify(pageData)
};

// Save to Wix
const presetId = await app.presetPageManager.wixAdapter.savePreset(preset);
console.log('Saved preset ID:', presetId);
```

### Manual Load Test:
```javascript
// List all presets
const allPresets = await app.presetPageManager.wixAdapter.listPresets();
console.log('All presets:', allPresets);

// Load specific preset
const presetId = '[paste-id-here]';
const preset = await app.presetPageManager.wixAdapter.loadPreset(presetId);
console.log('Loaded preset:', preset);

// Apply to canvas
const pageData = JSON.parse(preset.page1);
await app.presetPageManager.applyPageToCanvas(pageData);
```

### Check Content Slots:
```javascript
// Get all slots
const slots = app.presetPageManager.contentSlotManager.getAllSlots();
console.log('Content slots:', slots);

// Get specific slot
const slot = app.presetPageManager.contentSlotManager.getSlot('slot-id-here');
console.log('Slot details:', slot);
```

---

## Troubleshooting

### Error: "Preset not found"
**Cause**: Preset ID doesn't exist in Wix CMS
**Solution**:
- Check Wix CMS dashboard for correct preset ID
- Try saving a new preset first

### Error: "Wix save failed, falling back to localStorage"
**Cause**: Wix API token expired or network issue
**Solution**:
- Refresh the page to get new OAuth token
- Check network tab for API errors
- Verify Wix credentials in wix-config.js

### Error: "Collection 'MultiPagePresets' not found"
**Cause**: Collection not created in Wix CMS
**Solution**:
- Create the MultiPagePresets collection (see setup above)
- Ensure collection name is exactly: `MultiPagePresets`

### Content Slots Not Restoring
**Cause**: Content slots array missing or corrupted
**Solution**:
- Check console for errors during load
- Verify `pageData.contentSlots` is an array
- Re-save the page to fix corrupted data

### Background Image Not Loading
**Cause**: Image data URL too large or network issue
**Solution**:
- Check page size (should be < 60KB)
- For large images, consider using smaller images or compression
- Check console for image load errors

---

## Success Criteria

Sprint 3 is successfully tested when:

- ✅ **Test 1**: Single page saves to Wix CMS and appears in dashboard
- ✅ **Test 2**: Multi-page preset (3 pages) saves correctly
- ✅ **Test 3**: Pages load from Wix CMS and restore correctly on canvas
- ✅ **Test 4**: Content slots persist through save/load cycle
- ✅ **Console**: No errors in browser console during save/load operations
- ✅ **Fallback**: localStorage fallback works if Wix unavailable

---

## Next Steps After Testing

Once Sprint 3 is verified:

1. **Document any issues** found during testing
2. **Fix critical bugs** before moving to Sprint 4
3. **Optimize page size** if approaching 60KB limit
4. **Consider compression** for large images/data

Then proceed to:

### Sprint 4: End-User Interface (4-5 days)
- Create `enduser.html` for non-designers
- Build form generator for content slots
- Implement text auto-fit and image rendering
- Test end-user workflow: select → fill → export

---

## Testing Checklist

Use this checklist during testing:

**Setup**:
- [ ] Wix CMS `MultiPagePresets` collection created
- [ ] Collection permissions configured
- [ ] Wix credentials in [wix-config.js](../js/config/wix-config.js) verified

**Test 1: Save Single Page**:
- [ ] Page saves successfully
- [ ] Console shows "✅ Saved to Wix CMS"
- [ ] Preset appears in Wix CMS dashboard
- [ ] `page1` field contains JSON data

**Test 2: Save Multi-Page**:
- [ ] Page 1 saves to new preset
- [ ] Page 2 adds to existing preset
- [ ] Page 3 adds to existing preset
- [ ] All 3 pages visible in Wix CMS

**Test 3: Load Page**:
- [ ] Preset list shows saved presets
- [ ] Page loads without errors
- [ ] Canvas matches original design
- [ ] Console shows "✅ Loaded from Wix CMS"

**Test 4: Content Slots**:
- [ ] Slots save with page data
- [ ] Slots restore after load
- [ ] ContentSlotManager has correct slot count
- [ ] Slot overlay indicators appear

**Edge Cases**:
- [ ] Save with 0 content slots works
- [ ] Save with 5+ content slots works
- [ ] Load non-existent preset shows error
- [ ] Fallback to localStorage works

---

## Contact & Support

If you encounter issues:
1. Check browser console for error messages
2. Verify Wix CMS collection setup
3. Check network tab for API failures
4. Review [sprint-3-complete.md](sprint-3-complete.md) for implementation details

For automated testing, use: [test-wix-integration.html](../test-wix-integration.html)
