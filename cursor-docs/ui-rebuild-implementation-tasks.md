# UI Rebuild Implementation Tasks
## Detailed Task Breakdown and Implementation Guide

**Project**: Chatooly Employer Brand Tool UI Rebuild  
**Date**: December 2024  
**Status**: Ready for Implementation  

---

## Phase 1: Debug Controls Cleanup

### Task 1.1: Remove Layer Management from Debug Panel
**Priority**: High  
**Estimated Time**: 30 minutes  

**Objective**: Remove layering controls from debug panel, keep only visualization controls

**Files to Modify**:
- `js/canvas/DebugController.js`
- `index.html` (debug panel HTML)
- `style.css` (debug panel styling)

**Implementation Steps**:
1. **Remove Layer Panel Integration**:
   ```javascript
   // In DebugController.js - Remove these lines:
   this.layerPanel = null;
   this.initializeLayerPanel();
   this.refreshLayerPanel();
   ```

2. **Update Debug Options**:
   ```javascript
   // Keep only these debug options:
   this.debugOptions = {
       showSpotOutlines: true,
       showSpotNumbers: true,
       showTextBounds: false,
       showPadding: false
   };
   ```

3. **Remove Layer Panel HTML**:
   ```html
   <!-- Remove from index.html debug content -->
   <div class="layer-panel-section">
       <!-- All layer panel HTML -->
   </div>
   ```

**Acceptance Criteria**:
- [ ] Debug panel shows only spot outlines, spot numbers, text bounds, padding
- [ ] No layer management controls visible
- [ ] Debug functionality still works correctly

### Task 1.2: Make Debug Button Smaller
**Priority**: Medium  
**Estimated Time**: 15 minutes  

**Implementation Steps**:
1. **Update CSS**:
   ```css
   .debug-toggle {
       width: 24px;
       height: 24px;
       font-size: 12px;
   }
   ```

**Acceptance Criteria**:
- [ ] Debug button is smaller and less prominent
- [ ] Button still functions correctly

---

## Phase 2: Left Sidebar Simplification

### Task 2.1: Remove Spot Detection Buttons
**Priority**: High  
**Estimated Time**: 45 minutes  

**Objective**: Remove "Find Open Spots" and "Auto Detect Text on Change" buttons

**Files to Modify**:
- `index.html` (remove button HTML)
- `js/ui/UIManager.js` (remove event listeners and methods)

**Implementation Steps**:
1. **Remove HTML Elements**:
   ```html
   <!-- Remove from index.html -->
   <div class="chatooly-control-group">
       <button id="findSpots">Find Open Spots</button>
       <label class="auto-detect-toggle">
           <input type="checkbox" id="autoDetectSpots" checked>
           Auto-detect on text changes
       </label>
   </div>
   ```

2. **Remove Event Listeners**:
   ```javascript
   // Remove from UIManager.js setupEventListeners():
   this.elements.findSpots.addEventListener('click', () => {
       this.app.detectSpots();
   });
   
   this.elements.autoDetectSpots.addEventListener('change', () => {
       this.app.autoDetectSpots = this.elements.autoDetectSpots.checked;
       // ... rest of handler
   });
   ```

3. **Remove Element Caching**:
   ```javascript
   // Remove from cacheUIElements():
   findSpots: 'findSpots',
   autoDetectSpots: 'autoDetectSpots',
   ```

4. **Enable Auto-Detection Permanently**:
   ```javascript
   // In app.js constructor or initialization:
   this.autoDetectSpots = true; // Always enabled
   ```

**Acceptance Criteria**:
- [ ] "Find Open Spots" button removed
- [ ] "Auto Detect Text on Change" toggle removed
- [ ] Auto-detection works automatically on text changes
- [ ] No broken references in code

### Task 2.2: Remove Unnecessary Tabs
**Priority**: High  
**Estimated Time**: 30 minutes  

**Objective**: Remove "Spots" and "Animations" tabs, rename "Canvas" to "Grid"

**Files to Modify**:
- `index.html` (tab navigation and content)
- `js/ui/UIManager.js` (tab switching logic)

**Implementation Steps**:
1. **Update Tab Navigation**:
   ```html
   <!-- Update in index.html -->
   <div class="tab-navigation">
       <button class="tab-btn active" data-tab="mainText">Main Text</button>
       <button class="tab-btn" data-tab="grid">Grid</button>
       <button class="tab-btn" data-tab="parameters">🎲 Parameters</button>
   </div>
   ```

2. **Remove Tab Content**:
   ```html
   <!-- Remove these sections from index.html -->
   <div id="spotsTab" class="tab-content">
       <!-- All spots tab content -->
   </div>
   
   <div id="animationTab" class="tab-content">
       <!-- All animation tab content -->
   </div>
   ```

3. **Update Tab Switching Logic**:
   ```javascript
   // Update switchTab method in UIManager.js
   switchTab(tabName) {
       // Remove active class from all tabs and content
       document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
       document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

       // Add active class to selected tab
       const activeTabBtn = document.querySelector(`[data-tab="${tabName}"]`);
       if (activeTabBtn) {
           activeTabBtn.classList.add('active');
       }

       // Show corresponding content
       let contentId;
       switch(tabName) {
           case 'mainText':
               contentId = 'mainTextTab';
               break;
           case 'grid':
               contentId = 'gridTab';
               break;
           case 'parameters':
               contentId = 'parametersTab';
               break;
       }

       const activeContent = document.getElementById(contentId);
       if (activeContent) {
           activeContent.classList.add('active');
       }
   }
   ```

**Acceptance Criteria**:
- [ ] Only Main Text, Grid, and Parameters tabs visible
- [ ] Tab switching works correctly
- [ ] No broken references to removed tabs

---

## Phase 3: Remove Spot Popup UI

### Task 3.1: Remove Popup HTML Structure
**Priority**: High  
**Estimated Time**: 15 minutes  

**Files to Modify**:
- `index.html`

**Implementation Steps**:
1. **Remove Popup HTML**:
   ```html
   <!-- Remove from index.html -->
   <div id="spotEditPopup" class="spot-popup">
       <div class="spot-popup-content">
           <div class="spot-popup-header">
               <h4 id="spotPopupTitle">Edit Spot</h4>
               <button id="closeSpotPopup" class="popup-close">×</button>
           </div>
           <div id="spotPopupBody" class="spot-popup-body">
               <!-- Dynamic content will be populated here -->
           </div>
       </div>
   </div>
   ```

**Acceptance Criteria**:
- [ ] Spot popup HTML completely removed
- [ ] No broken references to popup elements

### Task 3.2: Remove Popup CSS Styles
**Priority**: High  
**Estimated Time**: 20 minutes  

**Files to Modify**:
- `style.css`

**Implementation Steps**:
1. **Remove All Popup Styles**:
   ```css
   /* Remove all .spot-popup related styles from style.css */
   .spot-popup { /* Remove */ }
   .spot-popup.show { /* Remove */ }
   .spot-popup-content { /* Remove */ }
   .spot-popup-header { /* Remove */ }
   .spot-popup-header h4 { /* Remove */ }
   .spot-popup-body { /* Remove */ }
   .spot-popup-body .chatooly-control-group { /* Remove */ }
   .spot-popup-body .chatooly-control-group:last-child { /* Remove */ }
   .spot-popup-body label { /* Remove */ }
   ```

**Acceptance Criteria**:
- [ ] All popup-related CSS removed
- [ ] No orphaned CSS rules

### Task 3.3: Remove Popup JavaScript Methods
**Priority**: High  
**Estimated Time**: 45 minutes  

**Files to Modify**:
- `js/app.js`
- `js/ui/UIManager.js`

**Implementation Steps**:
1. **Remove Canvas Click Handler**:
   ```javascript
   // Remove from app.js
   handleCanvasClick(e) {
       const rect = this.canvasManager.canvas.getBoundingClientRect();
       const canvasCoords = this.canvasManager.screenToCanvas(e.clientX, e.clientY);
       
       // Find clicked spot
       const clickedSpot = this.canvasManager.findSpotAt(canvasCoords.x, canvasCoords.y, this.spots);
       
       if (clickedSpot) {
           this.uiManager.showSpotEditPopup(clickedSpot, e.clientX, e.clientY);
       }
   }
   ```

2. **Remove Canvas Click Event Listener**:
   ```javascript
   // Remove from UIManager.js setupEventListeners()
   this.app.canvasManager.canvas.addEventListener('click', (e) => {
       this.app.handleCanvasClick(e);
   });
   ```

3. **Remove Popup Methods**:
   ```javascript
   // Remove from UIManager.js
   showSpotEditPopup(spot, clickX, clickY) { /* Remove entire method */ }
   createPopupSpotControls(spot, container) { /* Remove entire method */ }
   ```

**Acceptance Criteria**:
- [ ] Canvas click handler removed
- [ ] Popup methods removed
- [ ] No broken references to popup functionality

### Task 3.4: Update Tests
**Priority**: Medium  
**Estimated Time**: 30 minutes  

**Files to Modify**:
- `tests/mask-spot-functionality.spec.js`

**Implementation Steps**:
1. **Remove Popup Tests**:
   ```javascript
   // Remove or update tests that expect popup functionality
   test('should handle canvas click on mask spot', async () => {
       // Remove this test or update to test new grid interaction
   });
   ```

**Acceptance Criteria**:
- [ ] Tests updated to reflect new interaction model
- [ ] No failing tests due to removed popup functionality

---

## Phase 4: New Grid Tab Implementation

### Task 4.1: Create Grid Tab Structure
**Priority**: High  
**Estimated Time**: 60 minutes  

**Objective**: Create new Grid tab with background controls and grid visualization

**Files to Modify**:
- `index.html`
- `style.css`

**Implementation Steps**:
1. **Create Grid Tab HTML**:
   ```html
   <!-- Add to index.html -->
   <div id="gridTab" class="tab-content">
       <!-- Background Controls -->
       <div class="chatooly-control-group">
           <h3>Background</h3>
           <!-- Move background controls from canvasTab here -->
           <div class="chatooly-control-group">
               <label for="backgroundColor">Background Color</label>
               <input type="color" id="backgroundColor" value="#ffffff">
               <label for="backgroundOpacity">Opacity: <span id="backgroundOpacityValue">100%</span></label>
               <input type="range" id="backgroundOpacity" min="0" max="100" step="5" value="100">
               <label>
                   <input type="checkbox" id="transparentBackground">
                   Transparent Background
               </label>
           </div>
           
           <div class="chatooly-control-group">
               <label for="backgroundMedia">Background Media</label>
               <input type="file" id="backgroundMedia" accept="image/*,video/*">
               <button type="button" id="clearBackgroundMedia" style="display: none;">Clear Media</button>
               
               <div id="backgroundVideoControls" class="background-video-controls" style="display: none;">
                   <label>
                       <input type="checkbox" id="backgroundVideoAutoplay" checked>
                       Autoplay
                   </label>
                   <label>
                       <input type="checkbox" id="backgroundVideoLoop" checked>
                       Loop
                   </label>
               </div>
           </div>
           
           <div class="chatooly-control-group">
               <label for="backgroundFitMode">Background Fit Mode</label>
               <select id="backgroundFitMode">
                   <option value="fit">Fit (Letterbox)</option>
                   <option value="fill">Fill (Crop)</option>
                   <option value="stretch">Stretch (Distort)</option>
               </select>
           </div>
           
           <div class="chatooly-control-group">
               <label>Canvas Padding</label>
               <div class="padding-controls">
                   <div class="padding-row">
                       <label for="paddingHorizontal">Horizontal (L+R)</label>
                       <input type="range" id="paddingHorizontal" min="0" max="100" value="20">
                       <span id="paddingHorizontalValue">20px</span>
                   </div>
                   <div class="padding-row">
                       <label for="paddingVertical">Vertical (T+B)</label>
                       <input type="range" id="paddingVertical" min="0" max="100" value="20">
                       <span id="paddingVerticalValue">20px</span>
                   </div>
               </div>
           </div>
       </div>
       
       <!-- Grid Visualization -->
       <div class="chatooly-control-group">
           <h3>Grid</h3>
           <p class="control-description">Click any cell to configure its content, animation, and layer</p>
           
           <div id="visualGrid" class="visual-grid">
               <!-- Grid cells will be dynamically generated here -->
           </div>
       </div>
       
       <!-- Selected Cell Controls -->
       <div id="selectedCellControls" class="selected-cell-controls" style="display: none;">
           <h3>Cell Configuration</h3>
           <div id="selectedCellInfo" class="selected-cell-info">
               <!-- Cell info will be populated here -->
           </div>
           
           <div class="cell-control-sections">
               <!-- Content, Animation, and Layer controls will be added here -->
           </div>
       </div>
   </div>
   ```

2. **Add Grid Tab Styles**:
   ```css
   /* Add to style.css */
   .visual-grid {
       display: grid;
       gap: 4px;
       padding: 10px;
       background: var(--chatooly-color-surface, #f5f5f5);
       border-radius: 8px;
       margin: 10px 0;
   }
   
   .grid-cell {
       aspect-ratio: 1;
       border: 2px solid var(--chatooly-color-border, #ddd);
       border-radius: 4px;
       display: flex;
       flex-direction: column;
       align-items: center;
       justify-content: center;
       cursor: pointer;
       transition: all 0.2s ease;
       background: white;
   }
   
   .grid-cell:hover {
       border-color: var(--chatooly-color-primary, #007bff);
       background: var(--chatooly-color-primary-light, #e3f2fd);
   }
   
   .grid-cell.selected {
       border-color: var(--chatooly-color-primary, #007bff);
       background: var(--chatooly-color-primary-light, #e3f2fd);
       box-shadow: 0 0 0 2px var(--chatooly-color-primary, #007bff);
   }
   
   .grid-cell-content {
       font-size: 12px;
       font-weight: bold;
       text-align: center;
   }
   
   .grid-cell-position {
       font-size: 10px;
       color: var(--chatooly-color-text-secondary, #666);
       margin-top: 2px;
   }
   
   .grid-cell-animation {
       font-size: 10px;
       color: var(--chatooly-color-success, #28a745);
       margin-top: 2px;
   }
   
   .selected-cell-controls {
       margin-top: 20px;
       padding: 15px;
       background: var(--chatooly-color-surface, #f5f5f5);
       border-radius: 8px;
   }
   
   .cell-control-sections {
       margin-top: 15px;
   }
   
   .control-section {
       margin-bottom: 15px;
       border: 1px solid var(--chatooly-color-border, #ddd);
       border-radius: 6px;
       overflow: hidden;
   }
   
   .control-section-header {
       background: var(--chatooly-color-surface-secondary, #e9ecef);
       padding: 10px 15px;
       cursor: pointer;
       display: flex;
       justify-content: space-between;
       align-items: center;
   }
   
   .control-section-header:hover {
       background: var(--chatooly-color-surface-hover, #dee2e6);
   }
   
   .control-section-content {
       padding: 15px;
       display: none;
   }
   
   .control-section-content.expanded {
       display: block;
   }
   ```

**Acceptance Criteria**:
- [ ] Grid tab created with background controls
- [ ] Visual grid placeholder added
- [ ] Selected cell controls structure created
- [ ] Styles applied correctly

### Task 4.2: Move Visual Grid from Animation Tab
**Priority**: High  
**Estimated Time**: 45 minutes  

**Objective**: Move grid visualization functionality from animation tab to new grid tab

**Files to Modify**:
- `js/ui/UIManager.js`

**Implementation Steps**:
1. **Update Visual Grid Method**:
   ```javascript
   // Update updateVisualGrid method in UIManager.js
   updateVisualGrid() {
       const container = document.getElementById('visualGrid');
       if (!container) {
           return;
       }

       // Clear existing grid
       container.innerHTML = '';

       // Check if grid is ready
       if (!this.app.grid || !this.app.grid.isReady) {
           container.innerHTML = '<p class="no-text-message">Grid not ready. Add text to see grid...</p>';
           return;
       }

       // Set grid columns based on actual grid dimensions
       const cols = this.app.grid.cols || 3;
       container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

       // Create grid cells
       for (let row = 0; row < this.app.grid.rows; row++) {
           for (let col = 0; col < this.app.grid.cols; col++) {
               const cell = this.app.grid.getCell(row, col);

               const gridCellDiv = document.createElement('div');
               gridCellDiv.className = 'grid-cell';
               gridCellDiv.dataset.row = row;
               gridCellDiv.dataset.col = col;

               if (!cell) {
                   // Empty cell
                   gridCellDiv.classList.add('empty-cell');
                   gridCellDiv.innerHTML = `
                       <div class="grid-cell-content">—</div>
                       <div class="grid-cell-position">[${row},${col}]</div>
                   `;
               } else {
                   // Cell with content
                   const hasAnimation = cell.animation !== null;
                   if (hasAnimation) {
                       gridCellDiv.classList.add('has-animation');
                   }

                   const content = cell.type === 'main-text' ? cell.text :
                                  cell.type === 'content' ? `Content: ${cell.contentType}` :
                                  cell.type === 'spot' ? `Spot: ${cell.spotType}` :
                                  'Unknown';

                   let animInfo = '';
                   if (hasAnimation) {
                       const status = cell.animation.getStatus();
                       animInfo = `<div class="grid-cell-animation">${status.type}</div>`;
                   }

                   gridCellDiv.innerHTML = `
                       <div class="grid-cell-content">${content}</div>
                       <div class="grid-cell-position">[${row},${col}]</div>
                       ${animInfo}
                   `;

                   // Add click handler for non-empty cells
                   gridCellDiv.addEventListener('click', () => this.selectGridCell(row, col));
               }

               container.appendChild(gridCellDiv);
           }
       }
   }
   ```

2. **Update Tab Switching**:
   ```javascript
   // Update tab switching to show visual grid when switching to grid tab
   switchTab(tabName) {
       // ... existing code ...
       
       // Update visual grid when switching to grid tab
       if (tabName === 'grid') {
           setTimeout(() => {
               this.updateVisualGrid();
           }, 50);
       }
   }
   ```

**Acceptance Criteria**:
- [ ] Visual grid displays correctly in Grid tab
- [ ] Grid cells show proper content and animation status
- [ ] Grid updates when switching to Grid tab

---

## Phase 5: Unified Cell Controls

### Task 5.1: Implement Cell Selection
**Priority**: High  
**Estimated Time**: 60 minutes  

**Objective**: Create cell selection mechanism and show unified controls

**Files to Modify**:
- `js/ui/UIManager.js`

**Implementation Steps**:
1. **Update selectGridCell Method**:
   ```javascript
   // Update selectGridCell method in UIManager.js
   selectGridCell(row, col) {
       const cell = this.app.grid.getCell(row, col);
       if (!cell) return;

       // Update selected cell
       this.app.selectedCell = { row, col, cell };

       // Highlight selected cell in visual grid
       document.querySelectorAll('.grid-cell').forEach(el => {
           el.classList.remove('selected');
       });
       const selectedDiv = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
       if (selectedDiv) {
           selectedDiv.classList.add('selected');
       }

       // Show selected cell controls
       this.showSelectedCellControls(cell, row, col);
   }
   ```

2. **Create showSelectedCellControls Method**:
   ```javascript
   // Add new method to UIManager.js
   showSelectedCellControls(cell, row, col) {
       const controlsContainer = document.getElementById('selectedCellControls');
       const infoContainer = document.getElementById('selectedCellInfo');
       const sectionsContainer = document.querySelector('.cell-control-sections');

       if (!controlsContainer || !infoContainer || !sectionsContainer) return;

       // Show controls container
       controlsContainer.style.display = 'block';

       // Update cell info
       const content = cell.type === 'main-text' ? `"${cell.text}"` :
                      cell.type === 'content' ? `Content (${cell.contentType})` :
                      cell.type === 'spot' ? `Spot (${cell.spotType})` :
                      'Unknown';
       infoContainer.innerHTML = `
           <div class="selected-cell-header">
               <h4>${content} [${row},${col}]</h4>
           </div>
       `;

       // Clear existing control sections
       sectionsContainer.innerHTML = '';

       // Create control sections
       this.createContentControls(cell, sectionsContainer);
       this.createAnimationControls(cell, sectionsContainer);
       this.createLayerControls(cell, sectionsContainer);
   }
   ```

3. **Create Control Section Methods**:
   ```javascript
   // Add new methods to UIManager.js
   createContentControls(cell, container) {
       const section = this.createControlSection('Content', 'content');
       
       // Content type selector
       const typeGroup = document.createElement('div');
       typeGroup.className = 'chatooly-control-group';
       typeGroup.innerHTML = `
           <label>Content Type:</label>
           <select class="cell-content-type">
               <option value="empty">Empty</option>
               <option value="text">Text</option>
               <option value="image">Image</option>
               <option value="mask">Mask</option>
           </select>
       `;

       const typeSelect = typeGroup.querySelector('.cell-content-type');
       typeSelect.value = cell.contentType || 'empty';

       // Content-specific controls container
       const contentControls = document.createElement('div');
       contentControls.className = 'content-specific-controls';

       // Add event listener for type changes
       typeSelect.addEventListener('change', (e) => {
           const newType = e.target.value;
           cell.setContentType(newType);
           this.updateContentSpecificControls(cell, contentControls, newType);
           this.app.render();
       });

       // Add content-specific controls
       this.updateContentSpecificControls(cell, contentControls, cell.contentType || 'empty');

       section.querySelector('.control-section-content').appendChild(typeGroup);
       section.querySelector('.control-section-content').appendChild(contentControls);
       container.appendChild(section);
   }

   createAnimationControls(cell, container) {
       const section = this.createControlSection('Animation', 'animation');
       
       const animGroup = document.createElement('div');
       animGroup.className = 'chatooly-control-group';
       animGroup.innerHTML = `
           <label>Animation Type:</label>
           <select class="cell-animation-type">
               <option value="none">None</option>
               <option value="sway">Sway</option>
               <option value="bounce">Bounce</option>
               <option value="rotate">Rotate</option>
               <option value="pulse">Pulse</option>
           </select>
       `;

       const animSelect = animGroup.querySelector('.cell-animation-type');
       if (cell.animation) {
           const status = cell.animation.getStatus();
           animSelect.value = status.type;
       } else {
           animSelect.value = 'none';
       }

       // Animation-specific controls container
       const animControls = document.createElement('div');
       animControls.className = 'animation-specific-controls';

       // Add event listener for animation changes
       animSelect.addEventListener('change', (e) => {
           const animType = e.target.value;
           if (animType === 'none') {
               cell.removeAnimation();
           } else {
               const intensity = 20;
               const speed = 1.0;
               cell.setAnimation(animType, intensity, speed);
               // Auto-preview animation
               this.app.grid.playAllAnimations();
               setTimeout(() => {
                   this.app.grid.pauseAllAnimations();
               }, 2000);
           }
           this.updateAnimationSpecificControls(cell, animControls, animType);
           this.app.render();
       });

       // Add animation-specific controls
       this.updateAnimationSpecificControls(cell, animControls, animSelect.value);

       section.querySelector('.control-section-content').appendChild(animGroup);
       section.querySelector('.control-section-content').appendChild(animControls);
       container.appendChild(section);
   }

   createLayerControls(cell, container) {
       const section = this.createControlSection('Layer', 'layer');
       
       const layerGroup = document.createElement('div');
       layerGroup.className = 'chatooly-control-group';
       layerGroup.innerHTML = `
           <label>Layer Position:</label>
           <select class="cell-layer-position">
               <option value="background">Background</option>
               <option value="behind-main-text">Behind Main Text</option>
               <option value="main-text">Main Text</option>
               <option value="above-main-text">Above Main Text</option>
           </select>
       `;

       const layerSelect = layerGroup.querySelector('.cell-layer-position');
       layerSelect.value = cell.layerId || 'main-text';

       // Add event listener for layer changes
       layerSelect.addEventListener('change', (e) => {
           const newLayerId = e.target.value;
           cell.setLayer(newLayerId);
           this.app.render();
       });

       section.querySelector('.control-section-content').appendChild(layerGroup);
       container.appendChild(section);
   }

   createControlSection(title, id) {
       const section = document.createElement('div');
       section.className = 'control-section';
       section.innerHTML = `
           <div class="control-section-header" data-section="${id}">
               <span>${title}</span>
               <span class="section-toggle">▼</span>
           </div>
           <div class="control-section-content">
               <!-- Controls will be added here -->
           </div>
       `;

       // Add toggle functionality
       const header = section.querySelector('.control-section-header');
       const content = section.querySelector('.control-section-content');
       const toggle = section.querySelector('.section-toggle');

       header.addEventListener('click', () => {
           const isExpanded = content.classList.contains('expanded');
           if (isExpanded) {
               content.classList.remove('expanded');
               toggle.textContent = '▼';
           } else {
               content.classList.add('expanded');
               toggle.textContent = '▲';
           }
       });

       return section;
   }
   ```

**Acceptance Criteria**:
- [ ] Cell selection works correctly
- [ ] Selected cell is highlighted in visual grid
- [ ] Unified controls appear for selected cell
- [ ] Control sections are expandable/collapsible

### Task 5.2: Integrate Content Controllers
**Priority**: High  
**Estimated Time**: 90 minutes  

**Objective**: Integrate existing content controllers into unified interface

**Files to Modify**:
- `js/ui/UIManager.js`

**Implementation Steps**:
1. **Create updateContentSpecificControls Method**:
   ```javascript
   // Add new method to UIManager.js
   updateContentSpecificControls(cell, container, contentType) {
       // Clear existing controls
       container.innerHTML = '';

       // Use appropriate controller for the content type
       const controller = this.app.contentControllers[contentType];
       if (controller) {
           controller.createControls(cell, container, 'sidebar');

           // Add padding control for all non-empty content types
           if (contentType !== 'empty' && controller.createPaddingControl) {
               controller.createPaddingControl(cell, container, 'sidebar');
           }
       }
   }
   ```

2. **Create updateAnimationSpecificControls Method**:
   ```javascript
   // Add new method to UIManager.js
   updateAnimationSpecificControls(cell, container, animType) {
       // Clear existing controls
       container.innerHTML = '';

       if (animType === 'none') {
           container.innerHTML = '<p class="no-animation-message">No animation selected</p>';
           return;
       }

       // Create intensity control
       const intensityGroup = document.createElement('div');
       intensityGroup.className = 'chatooly-control-group';
       intensityGroup.innerHTML = `
           <label>Intensity: <span class="intensity-value">20px</span></label>
           <input type="range" class="animation-intensity" min="5" max="50" value="20">
       `;

       const intensitySlider = intensityGroup.querySelector('.animation-intensity');
       const intensityValue = intensityGroup.querySelector('.intensity-value');

       intensitySlider.addEventListener('input', () => {
           const value = parseInt(intensitySlider.value);
           intensityValue.textContent = value + 'px';
           if (cell.animation) {
               cell.animation.updateConfig({ intensity: value });
               this.app.render();
           }
       });

       // Create speed control
       const speedGroup = document.createElement('div');
       speedGroup.className = 'chatooly-control-group';
       speedGroup.innerHTML = `
           <label>Speed: <span class="speed-value">1.0x</span></label>
           <input type="range" class="animation-speed" min="0.5" max="2" step="0.1" value="1.0">
       `;

       const speedSlider = speedGroup.querySelector('.animation-speed');
       const speedValue = speedGroup.querySelector('.speed-value');

       speedSlider.addEventListener('input', () => {
           const value = parseFloat(speedSlider.value);
           speedValue.textContent = value.toFixed(1) + 'x';
           if (cell.animation) {
               cell.animation.updateConfig({ speed: value });
               this.app.render();
           }
       });

       container.appendChild(intensityGroup);
       container.appendChild(speedGroup);
   }
   ```

**Acceptance Criteria**:
- [ ] Content controllers integrate correctly
- [ ] Animation controls show/hide based on animation type
- [ ] All existing spot functionality preserved
- [ ] Controls update cell properties correctly

---

## Phase 6: Animation Integration

### Task 6.1: Implement Auto-Preview
**Priority**: High  
**Estimated Time**: 60 minutes  

**Objective**: Automatically preview animations when selected

**Files to Modify**:
- `js/ui/UIManager.js`
- `js/animations/CellAnimation.js`

**Implementation Steps**:
1. **Update Animation Selection**:
   ```javascript
   // Update animation selection in UIManager.js
   animSelect.addEventListener('change', (e) => {
       const animType = e.target.value;
       if (animType === 'none') {
           cell.removeAnimation();
       } else {
           const intensity = 20;
           const speed = 1.0;
           cell.setAnimation(animType, intensity, speed);
           
           // Auto-preview animation
           this.previewAnimation(cell, animType);
       }
       this.updateAnimationSpecificControls(cell, animControls, animType);
       this.app.render();
   });
   ```

2. **Create previewAnimation Method**:
   ```javascript
   // Add new method to UIManager.js
   previewAnimation(cell, animType) {
       if (!this.app.grid) return;

       // Start animation preview
       this.app.grid.playAllAnimations();
       this.app._startAnimationLoop();

       // Stop preview after 3 seconds
       setTimeout(() => {
           this.app.grid.pauseAllAnimations();
           this.app._stopAnimationLoop();
       }, 3000);
   }
   ```

3. **Update Animation Controls**:
   ```javascript
   // Update animation controls to trigger preview on changes
   intensitySlider.addEventListener('input', () => {
       const value = parseInt(intensitySlider.value);
       intensityValue.textContent = value + 'px';
       if (cell.animation) {
           cell.animation.updateConfig({ intensity: value });
           this.app.render();
           
           // Quick preview of updated animation
           this.previewAnimation(cell, cell.animation.getStatus().type);
       }
   });
   ```

**Acceptance Criteria**:
- [ ] Animations auto-preview when selected
- [ ] Animation changes trigger immediate preview
- [ ] Preview stops automatically after 3 seconds
- [ ] No manual play button needed

### Task 6.2: Remove Manual Animation Controls
**Priority**: Medium  
**Estimated Time**: 30 minutes  

**Objective**: Remove manual play/pause/reset buttons since auto-preview handles this

**Files to Modify**:
- `js/ui/UIManager.js`

**Implementation Steps**:
1. **Remove Animation Playback Controls**:
   ```javascript
   // Remove from setupAnimationEventListeners() in UIManager.js
   const playBtn = document.getElementById('playAnimation');
   const pauseBtn = document.getElementById('pauseAnimation');
   const resetBtn = document.getElementById('resetAnimation');
   const clearBtn = document.getElementById('clearAnimations');
   
   // Remove all event listeners for these buttons
   ```

2. **Update Animation Status Display**:
   ```javascript
   // Keep updateAnimationStatus method but remove manual controls
   updateAnimationStatus() {
       const animationCount = document.getElementById('animationCount');
       const playbackStatus = document.getElementById('playbackStatus');

       if (this.app.grid) {
           const animatedCells = this.app.grid.getAnimatedCells();
           const playingCount = animatedCells.filter(cell => cell.animation && cell.animation.isPlaying).length;

           if (animationCount) {
               animationCount.textContent = `${animatedCells.length} animations set`;
           }

           if (playbackStatus) {
               const statusText = playingCount > 0 ? 'Previewing' : 'Ready';
               playbackStatus.textContent = statusText;
           }
       }
   }
   ```

**Acceptance Criteria**:
- [ ] Manual animation controls removed
- [ ] Auto-preview handles all animation display
- [ ] Status display updated to reflect preview mode

---

## Testing and Validation

### Task 7.1: Update Tests
**Priority**: Medium  
**Estimated Time**: 60 minutes  

**Objective**: Update existing tests to work with new UI structure

**Files to Modify**:
- `tests/mask-spot-functionality.spec.js`
- `tests/playwright/grid-system.spec.js`
- Other relevant test files

**Implementation Steps**:
1. **Update Spot Interaction Tests**:
   ```javascript
   // Update tests to use grid cell selection instead of popup
   test('should handle cell selection and configuration', async () => {
       // Click on grid cell instead of canvas spot
       const gridCell = page.locator('.grid-cell').first();
       await gridCell.click();
       
       // Verify unified controls appear
       await expect(page.locator('#selectedCellControls')).toBeVisible();
       await expect(page.locator('.control-section')).toHaveCount(3); // Content, Animation, Layer
   });
   ```

2. **Update Animation Tests**:
   ```javascript
   // Update animation tests to use new interface
   test('should auto-preview animations', async () => {
       // Select cell and set animation
       const gridCell = page.locator('.grid-cell').first();
       await gridCell.click();
       
       const animSelect = page.locator('.cell-animation-type');
       await animSelect.selectOption('sway');
       
       // Verify auto-preview starts
       await expect(page.locator('#playbackStatus')).toContainText('Previewing');
   });
   ```

**Acceptance Criteria**:
- [ ] All tests updated to use new interface
- [ ] Tests pass with new UI structure
- [ ] No broken test references

### Task 7.2: Manual Testing Checklist
**Priority**: High  
**Estimated Time**: 120 minutes  

**Objective**: Comprehensive manual testing of new interface

**Testing Areas**:
1. **Debug Controls**:
   - [ ] Debug button is smaller
   - [ ] Only visualization controls visible
   - [ ] All debug options work correctly

2. **Sidebar Simplification**:
   - [ ] Only Main Text, Grid, Parameters tabs visible
   - [ ] Auto-detection works automatically
   - [ ] Tab switching works correctly

3. **Grid Tab**:
   - [ ] Background controls work correctly
   - [ ] Visual grid displays properly
   - [ ] Grid updates when text changes

4. **Cell Selection**:
   - [ ] Clicking grid cells selects them
   - [ ] Selected cell is highlighted
   - [ ] Unified controls appear

5. **Content Controls**:
   - [ ] Content type dropdown works
   - [ ] Content-specific controls appear
   - [ ] All content types (text/image/mask/empty) work

6. **Animation Controls**:
   - [ ] Animation dropdown works
   - [ ] Auto-preview triggers on selection
   - [ ] Animation-specific controls appear
   - [ ] Intensity and speed controls work

7. **Layer Controls**:
   - [ ] Layer dropdown works
   - [ ] Layer changes apply correctly
   - [ ] Visual feedback on layer changes

8. **Integration**:
   - [ ] All existing functionality preserved
   - [ ] No broken references
   - [ ] Performance is acceptable

---

## Deployment and Rollback Plan

### Deployment Steps
1. **Backup Current State**: Create git branch with current working state
2. **Phase-by-Phase Deployment**: Implement phases sequentially
3. **Testing After Each Phase**: Validate functionality before proceeding
4. **Documentation Updates**: Update user documentation

### Rollback Plan
1. **Git Revert**: Revert to previous working state
2. **Database Rollback**: If any data structure changes
3. **User Communication**: Notify users of any temporary issues

---

## Success Metrics

### Quantitative Metrics
- **Code Reduction**: Target 20% reduction in UI-related code
- **Performance**: No degradation in rendering performance
- **Test Coverage**: Maintain 100% test coverage

### Qualitative Metrics
- **User Experience**: Improved workflow efficiency
- **Interface Clarity**: Reduced cognitive load
- **Maintainability**: Easier to maintain and extend

---

## Conclusion

This comprehensive task breakdown provides a clear roadmap for implementing the UI rebuild. Each phase builds upon the previous one, ensuring a stable transition while maintaining all existing functionality.

The phased approach allows for iterative validation and adjustment, reducing risk while delivering significant improvements to the user experience.
