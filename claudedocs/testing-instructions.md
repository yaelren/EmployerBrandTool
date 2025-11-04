# Testing Instructions: Lock Icons & Content Slots

## Step-by-Step Test Procedure

### Step 1: Open the Application
1. Go to http://127.0.0.1:5502/index.html (or wherever you're serving it)
2. **Load a preset** from the dropdown (important!)
3. Open browser console (F12)

### Step 2: Open Save Page Panel
1. Scroll down to find the **"Save Page"** button
2. Click it to open the SavePagePanel
3. You should see the panel with editable slots section

### Step 3: Create a NEW Slot (Testing Lock Icons)

**IMPORTANT**: We need to test creating a NEW slot, not editing an existing one!

1. **Find an UNCONFIGURED lock icon** (🔒) on the canvas
   - Look for lock icons that show 🔒 (locked)
   - NOT 🔓 (unlocked) - those are already configured

2. **Click the locked icon** (🔒)
   - The inline editor should appear
   - You should see empty form fields

3. **Fill in the form**:
   - Field Name: `test1`
   - Field Label: `Test Label`
   - Field Description: `My test description`

4. **DO NOT CLICK SAVE** - Just wait 500ms
   - The form auto-saves after 300ms
   - Watch the console for debug logs

### Step 4: Check Console Output

You should see logs like this (in order):

```
📝 Adding slot to ContentSlotManager: <some-slot-id>
✅ Slot added to ContentSlotManager: YES
📊 Total slots in ContentSlotManager: <number>
📋 All slot IDs: [array of IDs]
🔓 About to update lock icon for: textCell-1 (or similar)
🔍 updateLockIcon called: {elementId: '...', isEditable: true, overlayExists: true}
🔍 Lock icon found: YES for elementId: ...
✅ Lock icon updated to: 🔓
🔄 Refreshing all overlay lock icons
✅ New slot created: <slot-id> elementId: <element-id>
```

### Step 5: Visual Verification

After the console logs, check:

1. **Lock icon on canvas**: Should change from 🔒 to 🔓
2. **Editable slots list**: Should show your new slot "test1"
3. **Collapsed header**: Should show "test1" (bold) and "My test description"

### Step 6: Test Content Slots Overlay

1. Look for a button that says **"Show Content Slots"** or similar
2. Click it
3. A visual overlay should appear showing:
   - Bounding boxes around editable areas
   - Labels with field names

### Step 7: Copy Console Output

**Copy ALL console output** from Step 4 and share it with me, especially:
- Any logs with emoji prefixes (🔍, ✅, ❌, 📝, 🔓, 🔄)
- Any errors in red
- The "Available lock icons" array if you see it

## Common Issues to Avoid

❌ **DON'T**: Click on an already-configured slot (🔓)
   - This will show editing logs, not creation logs

❌ **DON'T**: Click "Save Slot" button
   - Wait for auto-save instead (500ms)

❌ **DON'T**: Test before loading a preset
   - Load a preset first so there are cells to configure

✅ **DO**: Click on a NEW, unconfigured lock icon (🔒)

✅ **DO**: Wait and watch the console after filling the form

✅ **DO**: Copy ALL console output for debugging

## What to Report

1. **Console output** - Everything from Steps 4-6
2. **Visual results**:
   - Did lock icon change? (🔒 → 🔓)
   - Did slot appear in list?
   - Did "Show Content Slots" show anything?
3. **Screenshots** if possible:
   - Before clicking lock icon
   - After saving slot
   - Content Slots overlay (if visible)

## Expected vs Actual

### Expected Behavior:
1. Click 🔒 → Editor appears
2. Fill form → Wait 500ms
3. Console shows creation logs (📝, 🔓, ✅)
4. Lock icon changes to 🔓
5. Slot appears in "Editable Slots" list
6. "Show Content Slots" displays overlay

### If Something Goes Wrong:

**Scenario A**: No console logs with emoji
- **Problem**: Not creating a new slot, editing existing one
- **Solution**: Find an unconfigured 🔒 icon

**Scenario B**: "❌ No overlay found!"
- **Problem**: Overlay doesn't exist when trying to update
- **Solution**: Check if SavePagePanel.overlay is initialized

**Scenario C**: "❌ Lock icon not found in overlay"
- **Problem**: elementId mismatch
- **Solution**: Check "Available lock icons" array in console

**Scenario D**: "Slot added to ContentSlotManager: NO"
- **Problem**: addSlot() failed
- **Solution**: Check slot validation or ContentSlotManager errors
