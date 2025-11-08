# UI Redesign Mapping Document
**Goal**: Convert current tab-based UI to Figma's card-based layout while preserving ALL functionality

---

## 🎯 SECTION 1: LAYOUT SETUP (Figma Card)

### Current Location: Grid Builder Tab → Lines 70-77
**Figma Control**: "Grid Density" (slider, 50%)
**Current Code**: `#minSpotSize` (number input, value="50" min="20" max="200")
**Element ID**: `minSpotSize`
**Type**: number input
**Action**: ❓ **QUESTION: Does "Grid Density 50%" map to Min Spot Size?**
- Figma shows slider with percentage
- Current has number input with px units
- **Need clarification on mapping**

---

### Current Location: Grid Builder Tab → Lines 86-99
**Figma Control**: "Canvas Padding" with horizontal/vertical icons
**Current Code**:
- `#paddingHorizontal` (range slider, min="0" max="100" value="20")
- `#paddingVertical` (range slider, min="0" max="100" value="20")

**Element IDs**:
- `paddingHorizontal`
- `paddingHorizontalValue` (display span)
- `paddingVertical`
- `paddingVerticalValue` (display span)

**Mapping**: ✅ **DIRECT MATCH**
- Figma UI shows same concept (width/height padding)
- Both use icons to indicate horizontal/vertical
- Values display next to inputs

---

**Figma Control**: "Cell Gaps" (horizontal/vertical line icons)
**Current Code**: ❌ **NOT FOUND IN GRID BUILDER TAB**
**Action**: ❓ **QUESTION: Where is cell gaps control? Is this a new feature or exists elsewhere?**

---

## 🎨 SECTION 2: BACKGROUND (Figma Card)

### Current Location: Grid Builder Tab → Canvas & Background Section (Lines 79-152)

**Figma Control**: "Color" (color picker, blue #006eff shown)
**Current Code**: `#backgroundColor` (color input, value="#ffffff")
**Element ID**: `backgroundColor`
**Mapping**: ✅ **DIRECT MATCH** - Just UI styling difference

---

**Figma Control**: "Image Upload" - Two buttons (Background / Foreground)
**Current Code**: Lines 110-127
- `#browseBackgroundMedia` (Browse button)
- `#clearBackgroundMedia` (× clear button)
- `#backgroundVideoAutoplay` (checkbox)
- `#backgroundVideoLoop` (checkbox)

**Element IDs**:
- `browseBackgroundMedia`
- `clearBackgroundMedia`
- `backgroundVideoAutoplay`
- `backgroundVideoLoop`

**Mapping**: ⚠️ **PARTIAL MATCH**
- Current: Single "Browse" for background media
- Figma: Separate "Background" and "Foreground" buttons
- **Action**: ❓ **QUESTION: Do we need Foreground image upload? Or is this future feature?**

---

**Figma Control**: "Fill Mode" dropdown (Stretch selected)
**Current Code**: `#backgroundFillMode` (select, options: stretch/fit/fill)
**Element ID**: `backgroundFillMode`
**Mapping**: ✅ **DIRECT MATCH**

---

**Figma Control**: "Enable Padding" (toggle switch)
**Current Code**: Lines 131-140 (radio buttons: Canvas/Padding)
- `name="backgroundSpace"` with values "canvas"/"padding"

**Mapping**: ⚠️ **LOGIC DIFFERENCE**
- Figma: Toggle switch (on/off)
- Current: Radio buttons (canvas/padding choice)
- **Action**: ❓ **QUESTION: Should we keep radio button logic or change to toggle?**

---

## ✍️ SECTION 3: TYPOGRAPHY (Figma Card)

### Current Location: Grid Builder Tab → Main Text Section (Lines 154-262)

**Figma Control**: Text preview box (shows "EMPLOYEE\nSPOTLIGHT\n2025")
**Current Code**: `#mainText` (textarea, rows="3")
**Element ID**: `mainText`
**Mapping**: ✅ **DIRECT MATCH**

---

**Figma Control**: "Font Family" dropdown (Wix Madefor Display)
**Current Code**: `#fontFamily` (select, populated by JS)
**Element ID**: `fontFamily`
**Mapping**: ✅ **DIRECT MATCH**

---

**Figma Control**: "Font Size" (100px)
**Current Code**: `#fontSize` (number input, min="20" max="200" value="100")
**Element ID**: `fontSize`
**Mapping**: ✅ **DIRECT MATCH**

---

**Figma Control**: "Styles" - B/I/U/H buttons (Bold is active/black)
**Current Code**: Lines 201-207
- `#mainTextBold` (button)
- `#mainTextItalic` (button)
- `#mainTextUnderline` (button)
- `#mainTextHighlight` (button)
- `#mainTextHighlightColor` (color input, hidden)

**Element IDs**:
- `mainTextBold`, `mainTextItalic`, `mainTextUnderline`, `mainTextHighlight`
- `mainTextHighlightColor`

**Mapping**: ✅ **DIRECT MATCH**

---

**Figma Control**: "Line Spacing" with up/down arrows (20px)
**Current Code**: `#lineSpacing` (number input, min="0" max="50" value="0")
**Element ID**: `lineSpacing`
**Mapping**: ✅ **DIRECT MATCH**

---

**Figma Control**: "Color" (blue #006eff color picker)
**Current Code**: `#textColor` (color input, value="#000000")
**Element ID**: `textColor`
**Mapping**: ✅ **DIRECT MATCH**

---

**Figma Control**: "Blending Mode" dropdown (Normal)
**Current Code**: ❌ **NOT FOUND**
**Action**: ❓ **QUESTION: Is blending mode a new feature to add?**

---

**Figma Control**: Per-line controls (Line 01: EMPLOYEE, Line 02: SPOTLIGHT, Line 03: 2025)
Each line has left/center/right alignment buttons
**Current Code**: Lines 256-260 - `#lineAlignmentControls` (dynamically populated)
**Element ID**: `lineAlignmentControls`
**Mapping**: ✅ **EXISTS** - Just needs UI restyling to match Figma cards

---

**Figma Control**: "Entire Text Alignment" (3x3 grid of position buttons)
**Current Code**: Lines 231-244 - positioning grid with 9 buttons
**Mapping**: ✅ **DIRECT MATCH**

---

## 📦 SECTION 4: MAIN CONTENT CELLS (Figma Card)

### Current Location: ❓ **WHERE ARE THESE CONTROLS?**

**Figma Controls**:
- Padding (horizontal/vertical with icons)
- Fill Color (color picker + 100% opacity)
- Stroke Color (color picker + 100% opacity)
- Stroke Width (5px slider)
- Corner Radius (5px)
- Drop Shadow (checkbox/expandable)

**Action**: ❓ **QUESTION: Are these in Grid Editor tab? Or new features?**

---

## 🚫 REMOVED FEATURES?

### Current UI Has (Not in Figma):
1. **Tabs** - Grid Builder, Grid Editor, Presets
2. **Main Text Cell Margin** (marginVertical, marginHorizontal) - Lines 212-228
3. **Fill with global background color** checkbox - Lines 247-253

**Action**: ❓ **QUESTION: Should these be removed or integrated into new UI?**

---

## ⭐ NEW FEATURES IN FIGMA?

1. **Cell Gaps** control
2. **Foreground** image upload
3. **Blending Mode** dropdown
4. **Main Content Cells** section (padding, fill, stroke, shadow controls)

**Action**: ❓ **QUESTION: Are these planned features or should we skip for now?**

---

## ✅ ANSWERS CONFIRMED

1. ✅ "Grid Density 50%" = "Min Spot Size 50px" - SAME CONTROL
2. ✅ "Cell Gaps" = "Main Text Cell Margin" (marginVertical, marginHorizontal)
3. ✅ REMOVE "Foreground" upload - keep only Background
4. ✅ CHANGE to toggle switch logic (enable/disable padding)
5. ✅ REMOVE "Blending Mode" - not needed now
6. ✅ REMOVE "Main Content Cells" section - future feature
7. ✅ KEEP tabs (Grid Builder, Grid Editor, Presets) at top - small buttons
8. ✅ ADD "Fill with global background color" checkbox where "Blending Mode" was shown
9. ✅ RENAME "Main Text Cell Margin" → "Cell Gaps" in UI

---

## ✅ CONFIRMED MATCHES (No Changes Needed - Just UI Styling)

- Canvas Padding (horizontal/vertical)
- Background Color
- Fill Mode dropdown
- Text Content textarea
- Font Family dropdown
- Font Size
- Text styling buttons (B/I/U/H)
- Line Spacing
- Text Color
- Line alignment controls (dynamically generated)
- Entire Text Alignment grid

---

## 🎯 IMPLEMENTATION PLAN - SCREENSHOT 1

### Layout Changes:
1. Keep tab buttons at top (Grid Builder, Grid Editor, Presets) - NOT visible in Figma but keep functionality
2. Convert sections to Chatooly `.chatooly-section-card` components
3. Use light green background (#d9e5d7) for cards
4. Dark sidebar background (#232323)

### Section Mapping:

**LAYOUT SETUP Card:**
- Grid Density (rename from "Min Spot Size") → `#minSpotSize`
- Canvas Padding → `#paddingHorizontal`, `#paddingVertical`
- Cell Gaps (rename from "Main Text Cell Margin") → `#marginVertical`, `#marginHorizontal`

**BACKGROUND Card:**
- Color → `#backgroundColor`
- Image Upload (Background only) → `#browseBackgroundMedia`, `#clearBackgroundMedia`
- Fill Mode → `#backgroundFillMode`
- Enable Padding (toggle) → Convert from `name="backgroundSpace"` radio to toggle

**TYPOGRAPHY Card:**
- Text preview → `#mainText`
- Font Family → `#fontFamily`
- Font Size → `#fontSize`
- Styles (B/I/U/H) → `#mainTextBold`, `#mainTextItalic`, `#mainTextUnderline`, `#mainTextHighlight`
- Line Spacing → `#lineSpacing`
- Color → `#textColor`
- Fill with global BG (move from bottom) → `#mainTextFillWithBackgroundColor`
- Per-line alignment → `#lineAlignmentControls`
- Entire Text Alignment → positioning grid

**REMOVE:**
- "Blending Mode" control
- "Main Content Cells" section
- "Foreground" upload button

---

---

## 📸 SCREENSHOT 2: GRID EDITOR - EMPTY CELL SELECTED

### New Sections Visible:

**DESIGN & LAYOUT (CELL 01) Card:**
- Padding (horizontal/vertical with icons) → 0px each
- Fill Color (color picker + opacity %) → Blue #006eff, 100%
- Stroke Color (color picker + opacity %) → Black, 100%
- Stroke Width (slider) → 5px
- Corner Radius → 5px
- Drop Shadow (checkbox/expandable) → Unchecked

**CONTENT (CELL 01) Card:**
- Type (dropdown) → "Empty"

**ANIMATION (CELL 01) Card:**
- Type (dropdown) → "None"

**LAYER ORDER (CELL 01) Card:**
- Position (dropdown) → "Behind Main Text"

### ✅ ANSWERS for Screenshot 2:

**Q9 (Cell Design Controls):**
✅ These controls appear when clicking on a cell in Grid Editor
✅ Currently dynamically populated in `#selectedCellControls`
✅ Keep existing controls, just restyle to match Figma cards

**Q10 (Design & Layout Changes):**
For "DESIGN & LAYOUT (CELL 01)" card:
- ✅ **Padding**: Keep all 4 sides (currently exists, just UI change)
- ✅ **Fill Color**: Keep (this is cell background color)
- ❌ **REMOVE**: Stroke Color
- ❌ **REMOVE**: Stroke Width
- ❌ **REMOVE**: Corner Radius
- ❌ **REMOVE**: Drop Shadow

**Simplified DESIGN & LAYOUT Card:**
- Padding (4 sides: top, right, bottom, left)
- Fill Color (color picker + opacity %)

**Q11 (Content Type Options):**
✅ Same options as current code:
- Empty, Text, Image, Fill (same as now)

**Q12 (Animation Type Options):**
✅ Same options as current code:
- None, Sway, Bounce, Rotate, Pulse (same as now)

**Q13 (Layer Order Options):**
✅ Same options as current code:
- Behind Main Text, In Front of Main Text (same as now)

---

---

## 📸 SCREENSHOT 3: GRID EDITOR - TEXT CELL SELECTED

### CONTENT (CELL 01) Card - TEXT TYPE:

**New controls visible:**
- Type dropdown → "Text" selected
- Text input area → "Enter text here..."
- Font Family dropdown → "Wix Madefor Display"
- Auto-Fit to Cell (toggle switch) → ON
- Font Size → 100px
- Alignment (3 buttons: Left/Center/Right)
- Styles (B/I/U/H buttons) → Bold active
- Line Spacing → 20px (with up/down arrows)
- Color → Blue color picker
- **Blending Mode dropdown** → "Normal"
- **Position in Cell** → 3x3 grid (like "Entire Text Alignment")

### ✅ ANSWERS for Screenshot 3:

**Q14 (Blending Mode):**
❌ REMOVE "Blending Mode" from text cells
❌ REMOVE "Line Spacing" from text cells

**Q15 (Position in Cell):**
✅ YES - 3x3 grid for positioning text within cell bounds

**Q16 (Current Code):**
✅ YES - Controls dynamically created when Content Type = "Text"

**Simplified TEXT CELL Controls:**
- Type dropdown → "Text"
- Text input area
- Font Family dropdown
- Auto-Fit to Cell toggle
- Font Size
- Alignment (Left/Center/Right buttons)
- Styles (B/I/U/H buttons)
- ❌ ~~Line Spacing~~ REMOVE
- Color picker
- ❌ ~~Blending Mode~~ REMOVE
- Position in Cell (3x3 grid)

---

---

## 📸 SCREENSHOT 4: GRID EDITOR - MEDIA CELL SELECTED

### CONTENT (CELL 01) Card - MEDIA TYPE:

**Controls visible:**
- Type dropdown → "Media" selected
- **Add Image** button/upload area
- Fill Mode dropdown → "Stretch" (options: Stretch/Fit/Fill)
- Scale slider → 5.00
- Rotation slider → 0
- **Position in Cell** → 3x3 grid (like "Entire Text Alignment")

### ✅ ANSWERS for Screenshot 4:

**Q17 (Media Upload):**
✅ YES - "Add Image" button maps to existing image upload functionality

**Q18 (Fill Mode):**
✅ YES - Same Fill Mode control for cell media content (Stretch/Fit/Fill options)

**Q19 (Scale and Rotation):**
✅ EXISTING - Scale and Rotation sliders are existing features in current code

**Q20 (Position in Cell):**
✅ YES - Same 3x3 grid positioning as Text cells, works for media content

**Confirmed MEDIA CELL Controls:**
- Type dropdown → "Media"
- Add Image button (existing upload functionality)
- Fill Mode dropdown (Stretch/Fit/Fill)
- Scale slider
- Rotation slider
- Position in Cell (3x3 grid)

---

---

## 📸 SCREENSHOT 5: PRESETS TAB (Design Inference)

**No Figma screenshot provided - using design system inspiration**

### User Requirements:
1. ✅ Create card for Multi-Page Presets
2. ✅ Create card for Old Preset System (collapsed/hidden by default)
3. ✅ Change "Old System" structure to SINGLE card with unified controls
4. ✅ Save controls: Name input + "Save" button (single action)
5. ✅ Load controls: "Load Local" and "Load from Cloud" side-by-side (NOT stacked)
6. ✅ Apply Figma design system look and feel to all controls
7. ✅ Use Chatooly card components (light green #d9e5d7 background)

### Current Structure (from PresetUIComponent.js):
```
Multi-Page Save Section:
- Save Page button
- Load Page button

Old Preset System (collapsible):
  Save Section:
  - Preset name input
  - Save Locally button
  - Save to Cloud button (stacked)

  Load Local File Section:
  - Choose File button

  Load Section:
  - Preset dropdown
  - Load button
  - Delete button
  - Refresh button
```

### New Structure (Redesigned):

**MULTI-PAGE PRESETS Card:**
- Save Page button
- Load Page button
- (Keep existing SavePagePanel integration)

**SINGLE PRESET SYSTEM Card:**
- **Save Design Section:**
  - Preset name input
  - "Save" button (single action)

- **Load Design Section:**
  - "Load Local" button | "Load from Cloud" button (side-by-side)
  - Preset dropdown (for cloud presets)
  - Action buttons: Delete, Refresh

**Design Changes:**
- Convert all sections to `.chatooly-section-card` components
- Use light green card backgrounds (#d9e5d7)
- Apply Figma-style button and input styling
- Side-by-side layout for Load Local/Load from Cloud
- Simplified Save (single button instead of Save Local/Save Cloud split)
- Remove "Old Preset System" collapsible - make it a clean single card

---

## 📸 SCREENSHOTS ANALYSIS COMPLETE

Total screenshots analyzed: 4 Figma screenshots + 1 inferred design
All UI states documented and mapped! ✅

---

---

## 🎯 FINAL IMPLEMENTATION PLAN

### Phase 1: HTML Structure Changes

**1. Tab Navigation (Keep at Top)**
- Keep existing 3-tab structure: Grid Builder, Grid Editor, Presets
- Style tabs as small buttons (Figma-inspired)
- Maintain all existing tab functionality

**2. Grid Builder Tab → Convert to Card Layout**

**LAYOUT SETUP Card:**
```html
<div class="chatooly-section-card">
  <div class="chatooly-section-header">LAYOUT SETUP</div>
  <div class="chatooly-section-content">
    - Grid Density (label change from "Min Spot Size")
    - Canvas Padding (horizontal/vertical with icons)
    - Cell Gaps (label change from "Main Text Cell Margin")
  </div>
</div>
```

**BACKGROUND Card:**
```html
<div class="chatooly-section-card">
  <div class="chatooly-section-header">BACKGROUND</div>
  <div class="chatooly-section-content">
    - Color picker
    - Image Upload (Background only - keep existing browse/clear)
    - Fill Mode dropdown
    - Enable Padding (convert radio → toggle switch)
    - Video controls (autoplay, loop)
  </div>
</div>
```

**TYPOGRAPHY Card:**
```html
<div class="chatooly-section-card">
  <div class="chatooly-section-header">TYPOGRAPHY</div>
  <div class="chatooly-section-content">
    - Text preview textarea
    - Font Family dropdown
    - Font Size
    - Styles (B/I/U/H buttons)
    - Line Spacing
    - Color picker
    - Fill with global background color checkbox (moved from bottom)
    - Per-line alignment controls
    - Entire Text Alignment (3x3 grid)
  </div>
</div>
```

**3. Grid Editor Tab → Convert Cell Controls to Cards**

When cell selected, render cards:

**DESIGN & LAYOUT (CELL ##) Card:**
```html
<div class="chatooly-section-card">
  <div class="chatooly-section-header">DESIGN & LAYOUT (CELL ##)</div>
  <div class="chatooly-section-content">
    - Padding (4 sides: top, right, bottom, left)
    - Fill Color (color picker + opacity %)
  </div>
</div>
```

**CONTENT (CELL ##) Card:**
```html
<div class="chatooly-section-card">
  <div class="chatooly-section-header">CONTENT (CELL ##)</div>
  <div class="chatooly-section-content">
    - Type dropdown (Empty/Text/Media/Fill)

    [If Type = "Text"]
    - Text input area
    - Font Family dropdown
    - Auto-Fit to Cell toggle
    - Font Size
    - Alignment (Left/Center/Right)
    - Styles (B/I/U/H)
    - Color picker
    - Position in Cell (3x3 grid)

    [If Type = "Media"]
    - Add Image button
    - Fill Mode dropdown
    - Scale slider
    - Rotation slider
    - Position in Cell (3x3 grid)

    [If Type = "Empty" or "Fill"]
    - (No additional controls)
  </div>
</div>
```

**ANIMATION (CELL ##) Card:**
```html
<div class="chatooly-section-card">
  <div class="chatooly-section-header">ANIMATION (CELL ##)</div>
  <div class="chatooly-section-content">
    - Type dropdown (None/Sway/Bounce/Rotate/Pulse)
  </div>
</div>
```

**LAYER ORDER (CELL ##) Card:**
```html
<div class="chatooly-section-card">
  <div class="chatooly-section-header">LAYER ORDER (CELL ##)</div>
  <div class="chatooly-section-content">
    - Position dropdown (Behind Main Text/In Front of Main Text)
  </div>
</div>
```

**4. Presets Tab → Convert to Card Layout**

**MULTI-PAGE PRESETS Card:**
```html
<div class="chatooly-section-card">
  <div class="chatooly-section-header">MULTI-PAGE PRESETS</div>
  <div class="chatooly-section-content">
    - Save Page button
    - Load Page button
    - (SavePagePanel renders inline)
  </div>
</div>
```

**SINGLE PRESET SYSTEM Card:**
```html
<div class="chatooly-section-card">
  <div class="chatooly-section-header">PRESET SYSTEM</div>
  <div class="chatooly-section-content">
    Save Design:
    - Preset name input
    - "Save" button (single action)

    Load Design:
    - "Load Local" | "Load from Cloud" (side-by-side buttons)
    - Preset dropdown (for cloud presets)
    - Delete, Refresh buttons
  </div>
</div>
```

---

### Phase 2: CSS Styling

**Global Styles:**
- Dark sidebar background: `#232323`
- Card background: `#d9e5d7` (light green)
- Apply Chatooly design system typography and spacing
- Figma-inspired button styles (rounded, clean)
- Input field styling matching Figma design

**Component Styles:**
- `.chatooly-section-card` - collapsible cards
- `.chatooly-section-header` - card headers with expand/collapse
- `.chatooly-section-content` - card content areas
- Tab buttons - small, clean style at top
- Toggle switches (for Enable Padding)
- 3x3 grid positioning controls
- Side-by-side button layouts

---

### Phase 3: JavaScript Functionality Preservation

**NO CHANGES to:**
- All existing element IDs (`#minSpotSize`, `#paddingHorizontal`, etc.)
- Event handlers and listeners
- Data processing logic
- Canvas rendering
- Animation system
- Preset save/load functionality
- Grid cell detection and selection

**ONLY CHANGES to:**
- HTML structure (wrapping in cards)
- CSS styling (visual appearance)
- Label text (Grid Density, Cell Gaps)
- Radio → Toggle conversion for "Enable Padding"
- Preset tab layout (side-by-side Load buttons)

---

### Phase 4: Elements to REMOVE

**From Grid Builder:**
- ❌ "Blending Mode" control (main text)
- ❌ "Foreground" upload button

**From Grid Editor - Cell Controls:**
- ❌ Stroke Color
- ❌ Stroke Width
- ❌ Corner Radius
- ❌ Drop Shadow
- ❌ "Blending Mode" (from text cells)
- ❌ "Line Spacing" (from text cells)

**From Presets:**
- ❌ "Old Preset System" collapsible wrapper
- ❌ Separate "Save Locally" / "Save to Cloud" buttons (merge to single "Save")

---

### Phase 5: Implementation Order

1. ✅ **Update CSS** - Add Chatooly card styles and Figma-inspired button/input styles
2. ✅ **Update Grid Builder Tab** - Wrap in cards, rename labels
3. ✅ **Update Grid Editor Tab** - Wrap cell controls in cards
4. ✅ **Update Presets Tab** - New card layout with side-by-side buttons
5. ✅ **Update JavaScript** - Adjust dynamic rendering for new card structure
6. ✅ **Test All Functionality** - Verify every control works exactly as before

---

## ✅ READY FOR IMPLEMENTATION

All requirements documented and mapped. Implementation can begin! 🚀
