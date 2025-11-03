# Content Slots Overlay Testing Guide

The visual Content Slots overlay is now integrated! Here's how to test it:

## ✅ What's Been Added

1. **ContentSlotOverlay.js** - Visual overlay system (like grid guides)
2. **"Show Content Slots" button** - Next to "Show Guides" button in top-right
3. **Integration** - Fully connected to your existing app and ContentSlotManager

---

## 🧪 How to Test

### Step 1: Open Your App
Open [enduser.html](enduser.html) or your main app page in the browser.

### Step 2: Look for the Button
You should see two buttons in the top-right corner:
- 📐 Show Guides (existing)
- 📝 Show Content Slots (NEW!)

### Step 3: Create a Content Slot

**Option A: Use the Test Panel**
```javascript
// Paste this in browser console to load test panel
(async () => {
    const response = await fetch('test-slots-integration.js');
    const script = await response.text();
    eval(script);
})();
```

Then click **"📝 Test with Text Cell"** to create a slot from an existing text cell.

**Option B: Manual Test**
```javascript
// In browser console:
const cells = app.grid.getAllCells();
const textCell = cells.find(c => c.type === 'text' || c.type === 'main-text');

if (textCell) {
    const config = {
        fieldName: 'testHeadline',
        fieldLabel: 'Test Headline',
        fieldDescription: 'Testing overlay',
        required: true,
        constraints: {
            maxCharacters: 50,
            minFontSize: 24,
            maxFontSize: 72
        }
    };

    const slot = app.presetPageManager.contentSlotManager.createSlotFromCell(textCell, config);
    console.log('✅ Slot created:', slot);
} else {
    console.log('❌ No text cells found. Add a text cell first!');
}
```

### Step 4: Click "Show Content Slots"

Click the **📝 Show Content Slots** button. You should see:

#### When No Slots Exist:
- Semi-transparent dark overlay
- White message box in center
- "No Content Slots Configured"
- Instruction to configure cells

#### When Slots Exist:
- **Blue boxes** around text slots (#3b82f6)
- **Purple boxes** around image slots (#8b5cf6)
- **Labels** at top-left showing field name and type
- **Corner indicators** (small L-shapes at corners)
- **Constraints badge** at bottom-right showing settings

---

## 🎨 Visual Features

### Bounding Box
- Dashed border (8px dash, 4px gap)
- Glow effect (shadow blur)
- Semi-transparent fill (10% opacity)

### Label
- Colored background (blue for text, purple for image)
- White text showing: "Field Label (type)"
- Positioned above the slot

### Corner Indicators
- Small L-shaped markers at all 4 corners
- Same color as slot type
- Helps identify exact bounds

### Constraints Badge
- Bottom-right of slot
- Black semi-transparent background
- Shows key constraints:
  - Text: "50 chars, 24-72px"
  - Image: "cover, 10MB"

---

## 🐛 Troubleshooting

### "Show Content Slots" button doesn't appear
- Check browser console for errors
- Verify all scripts loaded: `console.log(app.contentSlotOverlay)`

### Button shows but overlay is blank
- Check if slots exist: `app.presetPageManager.contentSlotManager.getAllSlots()`
- Should return array of slot objects

### Overlay shows "No slots" but you created one
- Verify slot was added: `app.presetPageManager.contentSlotManager.getAllSlots().length`
- Try clicking button to refresh overlay

### Overlay doesn't match cell positions
- Resize browser window (overlay auto-updates)
- Or manually: `app.contentSlotOverlay.updateSize()`

---

## 💡 Next Steps

Once the overlay is working:

1. **Test with multiple slots**
   - Create both text and image slots
   - Verify colors are different (blue vs purple)
   - Check labels show correct field names

2. **Test overlay updates**
   - Add a new slot while overlay is visible
   - Should auto-update to show new slot

3. **Test toggle behavior**
   - Click "Show Content Slots" → overlay appears
   - Click "Hide Content Slots" → overlay disappears
   - Button label should change

4. **Integration with SavePagePanel**
   - Add "Make Editable" button to cells
   - Open ContentSlotConfigPanel from cell click
   - Verify overlay updates after saving slot

---

## 📊 Success Criteria

✅ "Show Content Slots" button appears next to "Show Guides"
✅ Clicking button toggles overlay visibility
✅ Button label changes: "Show" ↔ "Hide"
✅ "No slots" message appears when slots array is empty
✅ Blue boxes appear around text slots
✅ Purple boxes appear around image slots
✅ Labels show correct field names and types
✅ Constraints badges show correct values
✅ Overlay matches cell positions on canvas

---

**Ready to test!** 🚀

Load your app and click **📝 Show Content Slots** to see the visual overlay in action!
