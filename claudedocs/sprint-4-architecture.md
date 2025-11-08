# Sprint 4 Architecture: End-User Interface

**Date**: 2025-01-03
**Status**: Planning Phase
**Estimated Time**: 4-5 days

---

## Overview

Sprint 4 creates a simplified interface for end-users (non-designers) to:
1. Select a preset created by designers
2. Fill in editable content through auto-generated forms
3. Preview their customized pages in real-time
4. Navigate between multiple pages
5. Export final designs (Sprint 5)

**Key Principle**: End-users see a locked layout with forms - no grid manipulation, no design controls.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       enduser.html                          │
│  ┌───────────────────┐  ┌──────────────────────────────┐   │
│  │  Form Sidebar     │  │     Canvas Preview           │   │
│  │  - Preset Select  │  │     (Locked Layout)          │   │
│  │  - Content Forms  │  │     - No Grid Controls       │   │
│  │  - Page Nav       │  │     - Text Auto-Fit          │   │
│  └───────────────────┘  │     - Image Crop/Scale       │   │
│                         └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    enduser-app.js                           │
│              (Entry Point & Initialization)                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┴─────────────────────┐
        ↓                     ↓                      ↓
┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐
│ EndUserController│  │FormGenerator │  │ContentSlotRenderer│
│  - Load preset   │  │ - Generate   │  │ - Text auto-fit  │
│  - Manage pages  │  │   forms      │  │ - Image render   │
│  - Track content │  │ - Validate   │  │ - Locked layout  │
└──────────────────┘  └──────────────┘  └──────────────────┘
        ↓
┌─────────────────────────────────────┐
│      Shared Components              │
│  - PresetPageManager (load presets) │
│  - WixMultiPagePresetAdapter        │
│  - CanvasManager (rendering)        │
│  - BackgroundManager                │
└─────────────────────────────────────┘
```

---

## Component Breakdown

### 1. enduser.html (NEW)
**Purpose**: Simplified HTML without designer controls

**Layout**:
```
┌────────────────────────────────────────────────────┐
│                    Header Bar                      │
│  Logo | Preset: "Hero Banner" | Page 1 of 3       │
├──────────────┬─────────────────────────────────────┤
│              │                                     │
│  Form        │         Canvas Preview              │
│  Sidebar     │         (1080x1920)                 │
│              │                                     │
│  ┌────────┐  │    ┌─────────────────────┐         │
│  │Preset  │  │    │  Background Image   │         │
│  │Select  │  │    │                     │         │
│  └────────┘  │    │  [Text Auto-Fit]    │         │
│              │    │                     │         │
│  ┌────────┐  │    │  [Image Slot]       │         │
│  │Page 1  │  │    │                     │         │
│  │ ▸Headline│  │    └─────────────────────┘         │
│  │ ▸Logo   │  │                                     │
│  └────────┘  │                                     │
│              │                                     │
│  ┌────────┐  │                                     │
│  │Page 2  │  │                                     │
│  │ ▸Title  │  │                                     │
│  └────────┘  │                                     │
│              │                                     │
│  [< Prev]    │                                     │
│  [Next >]    │                                     │
│              │                                     │
└──────────────┴─────────────────────────────────────┘
```

**What's Removed from index.html**:
- ❌ Grid Builder controls
- ❌ Presets tab (save/load designer presets)
- ❌ Cell editing controls
- ❌ Background upload (locked)
- ❌ Text style controls (locked)
- ❌ Grid configuration
- ❌ Animation controls
- ❌ Layer management

**What's Added**:
- ✅ Preset selector dropdown/modal
- ✅ Auto-generated form area
- ✅ Page navigation (Prev/Next)
- ✅ Form validation indicators
- ✅ Character counters for text fields
- ✅ Image upload with preview

---

### 2. EndUserController.js (NEW)
**Purpose**: Main controller for end-user workflow

**Responsibilities**:
- Load preset from Wix CMS
- Extract content slots from all pages
- Generate forms via FormGenerator
- Manage user-entered content
- Render pages via ContentSlotRenderer
- Handle page navigation
- Coordinate with export system (Sprint 5)

**State Management**:
```javascript
{
  currentPreset: {
    _id: 'preset-123',
    presetName: 'Hero Banner',
    pages: [
      { pageNumber: 1, pageName: 'Hero' },
      { pageNumber: 2, pageName: 'Features' }
    ]
  },

  allPageData: [
    { pageNumber: 1, pageName: 'Hero', contentSlots: [...], canvas: {...} },
    { pageNumber: 2, pageName: 'Features', contentSlots: [...], canvas: {...} }
  ],

  currentPageIndex: 0,

  userContent: {
    'slot-hero-headline': 'Welcome to Our Company',
    'slot-hero-logo': 'https://cdn.wix.com/logo.png',
    'slot-feature-title': 'Amazing Features'
  },

  formErrors: {
    'slot-hero-headline': null, // or error message
    'slot-hero-logo': 'File too large (max 10MB)'
  }
}
```

**Class Structure**:
```javascript
class EndUserController {
  constructor(app) {
    this.app = app;
    this.presetPageManager = app.presetPageManager;
    this.formGenerator = new FormGenerator();
    this.contentSlotRenderer = new ContentSlotRenderer(app);

    // State
    this.currentPreset = null;
    this.allPageData = [];
    this.currentPageIndex = 0;
    this.userContent = {};
    this.formErrors = {};
  }

  /**
   * Load preset and all its pages
   * @param {string} presetId - Preset ID from Wix CMS
   */
  async loadPreset(presetId) {
    // 1. Load preset metadata
    const preset = await this.presetPageManager.getPresetFromCMS(presetId);
    this.currentPreset = preset;

    // 2. Load all pages with content slots
    this.allPageData = [];
    for (let i = 1; i <= 5; i++) {
      if (preset[`page${i}`]) {
        const pageData = JSON.parse(preset[`page${i}`]);
        this.allPageData.push(pageData);
      }
    }

    // 3. Extract all content slots from all pages
    const allSlots = this.extractAllContentSlots();

    // 4. Generate form
    this.formGenerator.generateForm(allSlots, this.allPageData);

    // 5. Render first page
    this.renderCurrentPage();
  }

  /**
   * Extract content slots from all pages
   * @returns {Array} All content slots with page metadata
   */
  extractAllContentSlots() {
    const allSlots = [];

    this.allPageData.forEach((pageData, pageIndex) => {
      const slots = pageData.contentSlots || [];
      slots.forEach(slot => {
        allSlots.push({
          ...slot,
          _pageIndex: pageIndex,
          _pageName: pageData.pageName
        });
      });
    });

    return allSlots;
  }

  /**
   * Handle form input change
   * @param {string} slotId - Content slot ID
   * @param {any} value - User-entered value (text or file URL)
   */
  handleFormInput(slotId, value) {
    // 1. Store user content
    this.userContent[slotId] = value;

    // 2. Validate
    const slot = this.findSlotById(slotId);
    const error = this.validateSlotContent(slot, value);
    this.formErrors[slotId] = error;

    // 3. Re-render current page if slot belongs to it
    const currentPageData = this.allPageData[this.currentPageIndex];
    const slotInCurrentPage = currentPageData.contentSlots.find(s => s.slotId === slotId);

    if (slotInCurrentPage) {
      this.renderCurrentPage();
    }
  }

  /**
   * Render current page with user content
   */
  renderCurrentPage() {
    const pageData = this.allPageData[this.currentPageIndex];

    // 1. Apply background
    this.applyBackground(pageData.background);

    // 2. Apply main text (if not a slot)
    this.applyMainText(pageData.mainText);

    // 3. Render content slots with user content
    pageData.contentSlots.forEach(slot => {
      const userValue = this.userContent[slot.slotId];

      if (slot.type === 'text') {
        this.contentSlotRenderer.renderTextSlot(slot, userValue || '');
      } else if (slot.type === 'image') {
        this.contentSlotRenderer.renderImageSlot(slot, userValue || null);
      }
    });

    // 4. Render canvas
    this.app.render();
  }

  /**
   * Switch to different page
   * @param {number} pageIndex - Page index (0-based)
   */
  switchPage(pageIndex) {
    if (pageIndex < 0 || pageIndex >= this.allPageData.length) {
      return;
    }

    this.currentPageIndex = pageIndex;
    this.renderCurrentPage();

    // Update UI page indicator
    this.updatePageIndicator();
  }

  /**
   * Navigate to next page
   */
  nextPage() {
    this.switchPage(this.currentPageIndex + 1);
  }

  /**
   * Navigate to previous page
   */
  previousPage() {
    this.switchPage(this.currentPageIndex - 1);
  }

  /**
   * Validate all required fields before export
   * @returns {boolean} True if all valid
   */
  validateAllFields() {
    const allSlots = this.extractAllContentSlots();
    let allValid = true;

    allSlots.forEach(slot => {
      if (slot.required) {
        const value = this.userContent[slot.slotId];
        if (!value) {
          this.formErrors[slot.slotId] = 'This field is required';
          allValid = false;
        }
      }
    });

    return allValid;
  }
}
```

---

### 3. FormGenerator.js (NEW)
**Purpose**: Generate HTML forms from content slots

**Features**:
- Group fields by page
- Create appropriate input types (text, textarea, file upload)
- Add validation indicators
- Character counters for text
- File size/format validation for images
- Real-time feedback

**Form Structure**:
```javascript
class FormGenerator {
  constructor() {
    this.formContainer = null;
  }

  /**
   * Generate complete form from content slots
   * @param {Array} contentSlots - All content slots with page metadata
   * @param {Array} pageData - All page data for grouping
   */
  generateForm(contentSlots, pageData) {
    this.formContainer = document.getElementById('enduser-form-container');
    this.formContainer.innerHTML = '';

    // Group slots by page
    const slotsByPage = this.groupSlotsByPage(contentSlots, pageData);

    // Generate form sections for each page
    slotsByPage.forEach((pageSlo, pageIndex) => {
      const pageSection = this.createPageSection(pageSlots, pageIndex);
      this.formContainer.appendChild(pageSection);
    });
  }

  /**
   * Create text input field
   * @param {Object} slot - Content slot configuration
   * @returns {HTMLElement} Form field element
   */
  createTextInput(slot) {
    const container = document.createElement('div');
    container.className = 'form-field text-field';
    container.dataset.slotId = slot.slotId;

    // Label
    const label = document.createElement('label');
    label.textContent = slot.fieldLabel;
    if (slot.required) {
      const required = document.createElement('span');
      required.className = 'required-indicator';
      required.textContent = ' *';
      label.appendChild(required);
    }

    // Input or textarea based on max characters
    const isLong = slot.constraints.maxCharacters > 100;
    const input = document.createElement(isLong ? 'textarea' : 'input');
    input.id = `input-${slot.slotId}`;
    input.name = slot.fieldName;
    input.maxLength = slot.constraints.maxCharacters;
    input.placeholder = slot.fieldDescription || `Enter ${slot.fieldLabel.toLowerCase()}`;

    if (!isLong) {
      input.type = 'text';
    } else {
      input.rows = 4;
    }

    // Character counter
    const counter = document.createElement('div');
    counter.className = 'char-counter';
    counter.textContent = `0 / ${slot.constraints.maxCharacters}`;

    // Input event listener
    input.addEventListener('input', (e) => {
      const length = e.target.value.length;
      counter.textContent = `${length} / ${slot.constraints.maxCharacters}`;

      // Emit to controller
      this.onInputChange(slot.slotId, e.target.value);
    });

    // Help text
    const help = document.createElement('div');
    help.className = 'field-help';
    help.textContent = slot.fieldDescription || '';

    // Validation error
    const error = document.createElement('div');
    error.className = 'field-error';
    error.id = `error-${slot.slotId}`;
    error.style.display = 'none';

    // Assemble
    container.appendChild(label);
    container.appendChild(input);
    container.appendChild(counter);
    if (slot.fieldDescription) {
      container.appendChild(help);
    }
    container.appendChild(error);

    return container;
  }

  /**
   * Create file upload field
   * @param {Object} slot - Content slot configuration
   * @returns {HTMLElement} Form field element
   */
  createFileUpload(slot) {
    const container = document.createElement('div');
    container.className = 'form-field file-field';
    container.dataset.slotId = slot.slotId;

    // Label
    const label = document.createElement('label');
    label.textContent = slot.fieldLabel;
    if (slot.required) {
      const required = document.createElement('span');
      required.className = 'required-indicator';
      required.textContent = ' *';
      label.appendChild(required);
    }

    // File input
    const input = document.createElement('input');
    input.type = 'file';
    input.id = `input-${slot.slotId}`;
    input.name = slot.fieldName;
    input.accept = slot.constraints.allowedFormats.map(f => `image/${f}`).join(',');

    // Preview
    const preview = document.createElement('div');
    preview.className = 'file-preview';
    preview.innerHTML = '<div class="preview-placeholder">No image selected</div>';

    // File info
    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-info';
    fileInfo.textContent = `Max size: ${(slot.constraints.maxFileSize / 1024 / 1024).toFixed(0)}MB | Formats: ${slot.constraints.allowedFormats.join(', ')}`;

    // File change handler
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file size
      if (file.size > slot.constraints.maxFileSize) {
        this.showError(slot.slotId, `File too large (max ${(slot.constraints.maxFileSize / 1024 / 1024).toFixed(0)}MB)`);
        return;
      }

      // Validate format
      const fileExt = file.name.split('.').pop().toLowerCase();
      if (!slot.constraints.allowedFormats.includes(fileExt)) {
        this.showError(slot.slotId, `Invalid format (allowed: ${slot.constraints.allowedFormats.join(', ')})`);
        return;
      }

      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.innerHTML = `<img src="${e.target.result}" alt="Preview" />`;
        this.onInputChange(slot.slotId, e.target.result);
      };
      reader.readAsDataURL(file);
    });

    // Validation error
    const error = document.createElement('div');
    error.className = 'field-error';
    error.id = `error-${slot.slotId}`;
    error.style.display = 'none';

    // Assemble
    container.appendChild(label);
    container.appendChild(input);
    container.appendChild(preview);
    container.appendChild(fileInfo);
    container.appendChild(error);

    return container;
  }

  /**
   * Show validation error
   * @param {string} slotId - Slot ID
   * @param {string} message - Error message
   */
  showError(slotId, message) {
    const errorEl = document.getElementById(`error-${slotId}`);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }

  /**
   * Clear validation error
   * @param {string} slotId - Slot ID
   */
  clearError(slotId) {
    const errorEl = document.getElementById(`error-${slotId}`);
    if (errorEl) {
      errorEl.style.display = 'none';
    }
  }

  /**
   * Callback for input change (set by EndUserController)
   * @param {string} slotId - Slot ID
   * @param {any} value - Input value
   */
  onInputChange(slotId, value) {
    // Override this with controller's handler
  }
}
```

---

### 4. ContentSlotRenderer.js (NEW)
**Purpose**: Render content in locked bounding boxes with auto-fit

**Key Features**:
- Text auto-fit algorithm (find largest font that fits)
- Word wrap and line breaking
- Vertical/horizontal alignment
- Image crop (cover mode) or scale (free mode)
- Render at exact boundingBox coordinates
- No grid manipulation

**Text Auto-Fit Algorithm**:
```javascript
class ContentSlotRenderer {
  constructor(app) {
    this.app = app;
    this.ctx = app.canvasManager.ctx;
  }

  /**
   * Render text slot with auto-fit
   * @param {Object} slot - Content slot configuration
   * @param {string} text - User-entered text
   */
  renderTextSlot(slot, text) {
    const { boundingBox, constraints, styling } = slot;

    // 1. Enforce character limit
    if (text.length > constraints.maxCharacters) {
      text = text.substring(0, constraints.maxCharacters);
    }

    // 2. Find optimal font size (binary search for efficiency)
    const fontSize = this.findOptimalFontSize(
      text,
      boundingBox,
      constraints.minFontSize,
      constraints.maxFontSize,
      styling
    );

    // 3. Word wrap text
    const lines = this.wrapText(text, boundingBox.width, fontSize, styling.fontFamily);

    // 4. Calculate vertical position based on alignment
    const totalHeight = lines.length * fontSize * 1.2; // 1.2 = line height
    let y = boundingBox.y;

    if (constraints.verticalAlign === 'center') {
      y += (boundingBox.height - totalHeight) / 2;
    } else if (constraints.verticalAlign === 'bottom') {
      y += boundingBox.height - totalHeight;
    }

    // 5. Render each line
    this.ctx.save();
    this.ctx.font = `${fontSize}px ${styling.fontFamily}`;
    this.ctx.fillStyle = styling.color || '#000000';
    this.ctx.textAlign = constraints.horizontalAlign || 'center';

    lines.forEach((line, index) => {
      let x = boundingBox.x;

      if (constraints.horizontalAlign === 'center') {
        x += boundingBox.width / 2;
      } else if (constraints.horizontalAlign === 'right') {
        x += boundingBox.width;
      }

      const lineY = y + (index + 1) * fontSize * 1.2;
      this.ctx.fillText(line, x, lineY);
    });

    this.ctx.restore();
  }

  /**
   * Find optimal font size using binary search
   * @returns {number} Optimal font size
   */
  findOptimalFontSize(text, boundingBox, minSize, maxSize, styling) {
    let low = minSize;
    let high = maxSize;
    let bestSize = minSize;

    // Binary search for largest fitting font size
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);

      if (this.textFits(text, mid, boundingBox, styling)) {
        bestSize = mid;
        low = mid + 1; // Try larger
      } else {
        high = mid - 1; // Try smaller
      }
    }

    return bestSize;
  }

  /**
   * Check if text fits in bounding box at given font size
   * @returns {boolean} True if fits
   */
  textFits(text, fontSize, boundingBox, styling) {
    this.ctx.font = `${fontSize}px ${styling.fontFamily}`;

    const lines = this.wrapText(text, boundingBox.width, fontSize, styling.fontFamily);
    const totalHeight = lines.length * fontSize * 1.2; // 1.2 = line height

    return totalHeight <= boundingBox.height;
  }

  /**
   * Wrap text to fit width
   * @returns {Array<string>} Array of text lines
   */
  wrapText(text, maxWidth, fontSize, fontFamily) {
    this.ctx.font = `${fontSize}px ${fontFamily}`;

    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = this.ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Render image slot
   * @param {Object} slot - Content slot configuration
   * @param {string} imageURL - Image URL or data URL
   */
  renderImageSlot(slot, imageURL) {
    if (!imageURL) return;

    const { boundingBox, constraints } = slot;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      this.ctx.save();

      // Clip to bounding box
      this.ctx.beginPath();
      this.ctx.rect(boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height);
      this.ctx.clip();

      if (constraints.fitMode === 'cover') {
        // Cover: crop to fill, maintain aspect ratio
        this.drawImageCover(img, boundingBox);
      } else {
        // Free: scale proportionally, fit within bounds
        this.drawImageFree(img, boundingBox);
      }

      this.ctx.restore();

      // Re-render canvas
      this.app.render();
    };

    img.src = imageURL;
  }

  /**
   * Draw image in cover mode (crop to fill)
   */
  drawImageCover(img, boundingBox) {
    const imgRatio = img.width / img.height;
    const boxRatio = boundingBox.width / boundingBox.height;

    let sourceWidth, sourceHeight, sourceX, sourceY;

    if (imgRatio > boxRatio) {
      // Image wider than box - crop sides
      sourceHeight = img.height;
      sourceWidth = img.height * boxRatio;
      sourceX = (img.width - sourceWidth) / 2;
      sourceY = 0;
    } else {
      // Image taller than box - crop top/bottom
      sourceWidth = img.width;
      sourceHeight = img.width / boxRatio;
      sourceX = 0;
      sourceY = (img.height - sourceHeight) / 2;
    }

    this.ctx.drawImage(
      img,
      sourceX, sourceY, sourceWidth, sourceHeight,
      boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height
    );
  }

  /**
   * Draw image in free mode (scale to fit)
   */
  drawImageFree(img, boundingBox) {
    const imgRatio = img.width / img.height;
    const boxRatio = boundingBox.width / boundingBox.height;

    let drawWidth, drawHeight, drawX, drawY;

    if (imgRatio > boxRatio) {
      // Image wider - fit to width
      drawWidth = boundingBox.width;
      drawHeight = boundingBox.width / imgRatio;
      drawX = boundingBox.x;
      drawY = boundingBox.y + (boundingBox.height - drawHeight) / 2;
    } else {
      // Image taller - fit to height
      drawHeight = boundingBox.height;
      drawWidth = boundingBox.height * imgRatio;
      drawX = boundingBox.x + (boundingBox.width - drawWidth) / 2;
      drawY = boundingBox.y;
    }

    this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  }
}
```

---

### 5. enduser-app.js (NEW)
**Purpose**: Entry point for end-user interface

**Workflow**:
```javascript
// enduser-app.js

import { EndUserController } from './enduser/EndUserController.js';

let app;
let endUserController;

window.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize canvas app (minimal version, no designer controls)
  const container = document.getElementById('enduser-canvas-container');
  app = new App(container, 1080, 1920);
  await app.initialize();

  // 2. Initialize end-user controller
  endUserController = new EndUserController(app);

  // 3. Show preset selector modal
  showPresetSelector();
});

/**
 * Show preset selector modal
 */
async function showPresetSelector() {
  const modal = document.getElementById('preset-selector-modal');
  const presetList = document.getElementById('preset-list');

  // Load all presets
  const presets = await app.presetPageManager.getAllPresets();

  // Populate list
  presetList.innerHTML = '';
  presets.forEach(preset => {
    const item = document.createElement('div');
    item.className = 'preset-item';
    item.innerHTML = `
      <h3>${preset.presetName}</h3>
      <p>${preset.description || 'No description'}</p>
      <p class="preset-meta">${preset.pageCount} pages</p>
    `;
    item.addEventListener('click', () => {
      selectPreset(preset.presetId);
      modal.style.display = 'none';
    });
    presetList.appendChild(item);
  });

  modal.style.display = 'flex';
}

/**
 * Handle preset selection
 */
async function selectPreset(presetId) {
  // Show loading
  showLoading('Loading preset...');

  try {
    // Load preset and generate form
    await endUserController.loadPreset(presetId);

    hideLoading();
  } catch (error) {
    console.error('Error loading preset:', error);
    alert(`Failed to load preset: ${error.message}`);
  }
}

/**
 * Page navigation
 */
document.getElementById('btn-prev-page')?.addEventListener('click', () => {
  endUserController.previousPage();
});

document.getElementById('btn-next-page')?.addEventListener('click', () => {
  endUserController.nextPage();
});

/**
 * Export button (Sprint 5)
 */
document.getElementById('btn-export')?.addEventListener('click', async () => {
  // Validate all fields
  if (!endUserController.validateAllFields()) {
    alert('Please fill in all required fields');
    return;
  }

  // TODO: Sprint 5 - Export system
  alert('Export feature coming in Sprint 5!');
});

// Expose for debugging
window.endUserController = endUserController;
```

---

## Data Flow

### Load Preset Flow:
```
User selects preset
    ↓
EndUserController.loadPreset(presetId)
    ↓
PresetPageManager.getPresetFromCMS(presetId)
    ↓
WixMultiPagePresetAdapter.loadPreset(presetId)
    ↓
Wix CMS returns: { _id, presetName, page1: "...", page2: "...", ... }
    ↓
EndUserController parses all pages
    ↓
EndUserController.extractAllContentSlots()
    ↓
FormGenerator.generateForm(allSlots, pageData)
    ↓
Form HTML rendered in sidebar
    ↓
EndUserController.renderCurrentPage()
    ↓
ContentSlotRenderer renders locked layout
```

### User Input Flow:
```
User types in form field
    ↓
FormGenerator input event listener
    ↓
FormGenerator.onInputChange(slotId, value)
    ↓
EndUserController.handleFormInput(slotId, value)
    ↓
Store in userContent[slotId]
    ↓
Validate content
    ↓
If slot in current page:
    EndUserController.renderCurrentPage()
    ↓
ContentSlotRenderer.renderTextSlot(slot, userValue)
    ↓
Auto-fit text in bounding box
    ↓
Canvas updates in real-time
```

### Page Navigation Flow:
```
User clicks "Next Page"
    ↓
EndUserController.nextPage()
    ↓
EndUserController.switchPage(currentPageIndex + 1)
    ↓
Update currentPageIndex
    ↓
EndUserController.renderCurrentPage()
    ↓
Load new page background
    ↓
Render all slots for new page with user content
    ↓
Update page indicator (Page 2 of 3)
```

---

## File Structure

```
/Users/yaelre/Documents/Repos/Chatooly-EmployerBrandTool/
├── enduser.html (NEW)
├── js/
│   ├── enduser/ (NEW DIRECTORY)
│   │   ├── EndUserController.js
│   │   ├── FormGenerator.js
│   │   ├── ContentSlotRenderer.js
│   │   └── enduser-app.js
│   ├── api/
│   │   ├── WixPresetAPI.js (EXISTING)
│   │   └── WixMultiPagePresetAdapter.js (EXISTING)
│   ├── parameters/
│   │   ├── PresetPageManager.js (EXISTING - reuse)
│   │   └── ContentSlotManager.js (EXISTING - reuse)
│   └── (other existing files)
├── css/
│   └── enduser.css (NEW)
└── claudedocs/
    ├── sprint-4-architecture.md (THIS FILE)
    └── sprint-4-complete.md (WILL CREATE)
```

---

## CSS Requirements

### enduser.css
```css
/* Layout */
.enduser-container {
  display: grid;
  grid-template-columns: 350px 1fr;
  height: 100vh;
}

.form-sidebar {
  background: #f9fafb;
  padding: 20px;
  overflow-y: auto;
}

.canvas-container {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
}

/* Form Fields */
.form-field {
  margin-bottom: 20px;
}

.form-field label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
}

.required-indicator {
  color: #ef4444;
}

.form-field input[type="text"],
.form-field textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.char-counter {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.field-error {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

.file-preview {
  width: 100%;
  height: 150px;
  border: 2px dashed #d1d5db;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
}

.file-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* Page Navigation */
.page-nav {
  display: flex;
  justify-content: space-between;
  padding: 15px 0;
  border-top: 1px solid #d1d5db;
}

.page-indicator {
  font-weight: 600;
  text-align: center;
  margin: 10px 0;
}
```

---

## Testing Strategy

### Unit Tests:
1. **ContentSlotRenderer**:
   - Text auto-fit finds correct font size
   - Word wrap works correctly
   - Image cover mode crops properly
   - Image free mode scales correctly

2. **FormGenerator**:
   - Generates correct input types
   - Validation works for required fields
   - Character counter updates correctly
   - File upload validates size/format

### Integration Tests:
1. Load preset and generate form
2. Fill form and see real-time preview
3. Navigate between pages
4. Validate all fields before export

### Manual Tests:
1. Select preset with 3 pages
2. Fill in text fields (test auto-fit with different lengths)
3. Upload images (test cover vs free mode)
4. Navigate between pages
5. Verify content persists when switching pages
6. Test required field validation

---

## Success Criteria

Sprint 4 is complete when:

✅ **enduser.html loads without designer controls**
✅ **Preset selector shows all presets from Wix CMS**
✅ **Form auto-generates from content slots**
✅ **Text inputs have character counters**
✅ **Image uploads show previews**
✅ **Text auto-fits within bounding boxes** (min/max font size)
✅ **Images render in cover or free mode**
✅ **Page navigation works (Prev/Next)**
✅ **Content persists when switching pages**
✅ **Required field validation works**
✅ **Real-time preview updates as user types**

---

## Next: Sprint 5

After Sprint 4, we'll build the export system:
- Export individual pages as images
- Export all pages as images/videos
- Upload to Wix CDN
- Generate ZIP files
- Email/download delivery

---

## Estimated Timeline

| Task | Time | Status |
|------|------|--------|
| Architecture & Planning | 2 hours | ✅ Complete |
| enduser.html | 3 hours | 🔜 Next |
| EndUserController.js | 8 hours | Pending |
| FormGenerator.js | 6 hours | Pending |
| ContentSlotRenderer.js | 10 hours | Pending |
| enduser-app.js | 3 hours | Pending |
| CSS & Styling | 4 hours | Pending |
| Testing & Debugging | 6 hours | Pending |
| **Total** | **42 hours (5-6 days)** | |

---

## Ready to Build!

This architecture provides:
- Clear separation of concerns
- Reuse of existing Sprint 3 components
- Locked layouts with auto-fit
- Real-time preview
- Validation and error handling
- Path to Sprint 5 export system

Let me know when you're ready to start implementation!
