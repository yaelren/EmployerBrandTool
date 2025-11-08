# End-User Rendering Redesign - Implementation Plan

**Date**: 2025-01-08
**Branch**: `preset-enduser-updates`
**Status**: In Progress

---

## 🎯 Goal

Refactor end-user interface to use THE SAME rendering code as designer mode, eliminating custom rendering logic and fixing all positioning/scaling issues.

---

## 📋 Current State Analysis

### enduser-app.js (Current - Wrong)
```javascript
// Creates "minimal app" with just managers
const minimalApp = {
    canvasManager,
    backgroundManager,
    layerManager,
    gridBuilder,
    fontManager,
    contentSlotManager,
    render: () => canvasManager.render() // ❌ Wrong - not full app.render()
};

const endUserController = new EndUserController(canvasManager, presetPageManager, wixAPI);
const contentSlotRenderer = new ContentSlotRenderer(canvasManager, presetPageManager);
```

### app.js (Designer Mode - Correct)
```javascript
// Creates full EmployerBrandTool instance
const app = new EmployerBrandTool();
await app.initialize();

// app.render() does:
// 1. app.canvasManager.renderBackground()
// 2. app._renderWithAnimations() → renderByLayers() → renderCellWithAnimations()
```

---

## ✅ New Approach

### Step 1: Initialize Full App in enduser-app.js
```javascript
// Import EmployerBrandTool
import { EmployerBrandTool } from './app.js';

// Create FULL app instance (same as designer mode)
const app = new EmployerBrandTool();
await app.initialize();

// Override/hide UI elements we don't need
app.uiManager.hideDesignerControls(); // New method to hide sidebar tabs

// Initialize end-user controller WITH app
const endUserController = new EndUserController(app);

// Make available globally
window.endUserApp = {
    app,              // Full app instance
    endUserController
};
```

### Step 2: Refactor EndUserController
```javascript
class EndUserController {
    constructor(app) {  // ✅ Take full app instance
        this.app = app;
        this.contentData = {};
        this.loadedPages = [];

        // Initialize form generator
        const formContainer = document.getElementById('pageSectionsContainer');
        this.formGenerator = new FormGenerator(formContainer);

        // Load from localStorage
        this.loadContentDataFromLocalStorage();
    }

    async renderCurrentPage() {
        const pageData = this.loadedPages[this.currentPageIndex];

        // 1. Load page data into app (same as designer mode)
        await this.app.presetManager.deserializeState(pageData);

        // 2. Apply user content to cells
        this.applyUserContentToCells(pageData.contentSlots);

        // 3. Render (same as designer mode)
        this.app.render();

        // 4. Generate form
        this.generateForm(pageData.contentSlots);
    }

    applyUserContentToCells(contentSlots) {
        contentSlots.forEach(slot => {
            const userValue = this.contentData[slot.slotId];
            if (!userValue) return; // Use designer default

            // Find cell by contentId
            const cell = this.findCellByContentId(slot.sourceContentId);
            if (!cell) return;

            // Replace cell content with user data
            if (slot.type === 'text') {
                if (cell.textComponent) {
                    cell.textComponent.text = userValue;
                } else if (cell.content) {
                    cell.content.text = userValue;
                }
            } else if (slot.type === 'image') {
                // Handle image replacement
                if (cell.content) {
                    cell.content.mediaUrl = userValue;
                    // Load image asynchronously
                    const img = new Image();
                    img.onload = () => {
                        cell.content.media = img;
                        this.app.render();
                    };
                    img.src = userValue;
                }
            }
        });
    }

    findCellByContentId(contentId) {
        if (!this.app.grid) return null;
        const allCells = this.app.grid.getAllCells();
        return allCells.find(cell => cell.contentId === contentId) || null;
    }

    debouncedRender() {
        if (this.renderDebounceTimer) {
            clearTimeout(this.renderDebounceTimer);
        }
        this.renderDebounceTimer = setTimeout(() => {
            const pageData = this.loadedPages[this.currentPageIndex];
            if (pageData) {
                this.applyUserContentToCells(pageData.contentSlots);
                this.app.render(); // ✅ Use app.render()
            }
        }, 300);
    }
}
```

---

## 🔧 Implementation Steps

### Phase 1: Update enduser-app.js ✅ COMPLETED
- [x] Import EmployerBrandTool from app.js
- [x] Initialize full app instance instead of minimal app
- [x] Pass app to EndUserController constructor
- [x] Hide designer UI elements
- [x] Clean up unnecessary manager initializations

### Phase 2: Refactor EndUserController ✅ COMPLETED
- [x] Change constructor to accept `app` parameter
- [x] Add `hideFilledContentSlots()` method
- [x] Update `renderCurrentPage()` to use hide-then-overlay approach
- [x] Update `debouncedRender()` to use hide-then-overlay approach
- [x] Update export to use hide-then-overlay approach
- [x] Update all presetPageManager references to use app.presetPageManager

### Phase 3: Simplify ContentSlotRenderer ✅ COMPLETED
- [x] Add `renderUserContent()` method (overlay only)
- [x] Add `renderTextOverlay()` helper
- [x] Add `renderImageOverlay()` helper
- [x] Keep old methods for now (backward compatibility)

### Phase 4: Testing ⏳ IN PROGRESS
- [ ] Load preset in end-user mode
- [ ] Verify canvas looks identical to designer mode
- [ ] Type in content slots
- [ ] Verify text renders correctly
- [ ] Verify no offset or alignment issues
- [ ] Switch pages
- [ ] Verify export works

### Phase 5: Clean Up ⏳ PENDING
- [ ] Remove old renderLockedLayout method from ContentSlotRenderer
- [ ] Update documentation with final architecture
- [ ] Verify no broken references

---

## 🚨 Key Changes Summary

| Component | Old | New |
|-----------|-----|-----|
| **App Initialization** | Minimal app with managers | Full EmployerBrandTool instance |
| **EndUserController Constructor** | `(canvasManager, presetPageManager, wixAPI)` | `(app)` |
| **Rendering** | `contentSlotRenderer.renderLockedLayout()` | `app.render()` |
| **Content Injection** | Custom rendering with scaled bounds | Modify cell content, use same renderer |
| **Content Slots** | Need bounding box scaling | Use sourceContentId to find cells |

---

## 📦 Files to Modify

1. **js/enduser-app.js** - Initialize full app
2. **js/enduser/EndUserController.js** - Refactor to use app.render()
3. **enduser.html** - Remove ContentSlotRenderer import
4. **js/enduser/ContentSlotRenderer.js** - Archive/delete

---

## ✅ Expected Results

After implementation:
- ✅ End-user canvas looks IDENTICAL to designer canvas
- ✅ User content positioned correctly (no offsets)
- ✅ Font sizes match designer settings
- ✅ Canvas viewport shows full canvas
- ✅ No scaling or coordinate transformation issues
- ✅ Same rendering code = same results

---

**Status**: Ready to implement Phase 1
**Next**: Update enduser-app.js to initialize full app
