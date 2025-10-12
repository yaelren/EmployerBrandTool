# Implementation Tasks Document

## Phase 1: Core Layer Infrastructure

### Task 1.1: Create Layer Classes
**Files**: `js/grid/LayerManager.js`, `js/grid/Layer.js`

**Tasks**:
- [ ] Create `Layer` class with id, name, order, visible, cells properties
- [ ] Create `LayerManager` class with default layer initialization
- [ ] Add methods: `addCell()`, `removeCell()`, `getSortedLayers()`
- [ ] Add layer visibility toggle functionality

**Acceptance Criteria**:
- LayerManager initializes with 4 default layers
- Layers can be created, cells assigned, and retrieved in order
- Layer visibility can be toggled

### Task 1.2: Extend GridCell with Layer Support
**Files**: `js/grid/GridCell.js`

**Tasks**:
- [ ] Add `layerId` and `layerOrder` properties to constructor
- [ ] Add `setLayer(layerId)` method
- [ ] Add reference to LayerManager (injected during grid building)
- [ ] Update `MainTextCell` and `ContentCell` constructors to set default layers

**Acceptance Criteria**:
- All cells have layer properties
- MainTextCell defaults to 'main-text' layer
- ContentCell defaults to 'behind-main-text' layer
- Cells can be moved between layers

### Task 1.3: Integrate LayerManager into App
**Files**: `js/app.js`

**Tasks**:
- [ ] Add LayerManager instance to app constructor
- [ ] Pass LayerManager reference to Grid during building
- [ ] Update Grid class to use LayerManager for cell assignment

**Acceptance Criteria**:
- App has LayerManager instance
- Grid building assigns cells to appropriate layers
- Layer assignments persist across grid rebuilds

## Phase 2: Layer-Based Rendering

### Task 2.1: Update Rendering Pipeline
**Files**: `js/app.js`

**Tasks**:
- [ ] Replace `allCells.forEach()` with layer-based rendering
- [ ] Create `renderByLayers()` method
- [ ] Create `renderCellWithAnimations()` helper method
- [ ] Ensure animation transforms still work correctly

**Acceptance Criteria**:
- Cells render in layer order (background → behind-main-text → main-text → above-main-text)
- Animations continue to work per-cell
- Rendering performance is maintained or improved

### Task 2.2: Update Grid Building for Layer Assignment
**Files**: `js/grid/GridBuilder.js`, `js/grid/Grid.js`

**Tasks**:
- [ ] Pass LayerManager to GridBuilder
- [ ] Assign cells to default layers during matrix building
- [ ] Ensure layer assignments persist across rebuilds

**Acceptance Criteria**:
- New cells get assigned to correct default layers
- Existing cells maintain their layer assignments during rebuilds
- Layer assignments work with animation state preservation

## Phase 3: Layer Panel UI

### Task 3.1: Create Layer Panel Component
**Files**: `js/ui/LayerPanel.js`

**Tasks**:
- [ ] Create LayerPanel class with layer list display
- [ ] Add layer visibility toggle (eye icons)
- [ ] Add expandable cell lists per layer
- [ ] Add cell selection highlighting

**Acceptance Criteria**:
- Layer panel shows all layers with cell counts
- Layers can be shown/hidden with eye icons
- Individual cells are listed under their layers
- Selected cells are highlighted

### Task 3.2: Integrate Layer Panel into Debug Panel
**Files**: `js/canvas/DebugController.js`, `index.html`

**Tasks**:
- [ ] Add layer panel HTML structure to debug panel
- [ ] Integrate LayerPanel into DebugController
- [ ] Add layer panel toggle functionality
- [ ] Style layer panel to match existing debug panel

**Acceptance Criteria**:
- Layer panel appears in debug panel
- Layer panel can be toggled on/off
- Layer panel styling matches existing UI
- Layer panel updates when cells change layers

### Task 3.3: Add Cell Selection and Layer Assignment
**Files**: `js/ui/LayerPanel.js`, `js/canvas/DebugController.js`

**Tasks**:
- [ ] Add click handlers for cell selection
- [ ] Add layer dropdown for selected cell
- [ ] Add visual feedback for selected cell
- [ ] Add layer change functionality

**Acceptance Criteria**:
- Users can click cells to select them
- Selected cell shows current layer
- Users can change cell's layer via dropdown
- Visual feedback shows which cell is selected

## Phase 4: Grid Matrix View Integration

### Task 4.1: Create Grid Matrix Visualization
**Files**: `js/ui/GridMatrixView.js`

**Tasks**:
- [ ] Create visual grid representation of cells
- [ ] Add click handlers for cell selection
- [ ] Show cell types (text, image, empty) with icons
- [ ] Highlight selected cell

**Acceptance Criteria**:
- Grid matrix shows all cells in visual grid
- Cells show their type with appropriate icons
- Clicking cell selects it and updates layer panel
- Selected cell is visually highlighted

### Task 4.2: Integrate Grid Matrix into Layer Panel
**Files**: `js/ui/LayerPanel.js`, `js/canvas/DebugController.js`

**Tasks**:
- [ ] Add grid matrix view to layer panel
- [ ] Connect grid matrix selection to layer panel
- [ ] Add layer assignment controls
- [ ] Add visual feedback for layer changes

**Acceptance Criteria**:
- Grid matrix appears in layer panel
- Selecting cell in matrix updates layer panel
- Layer changes update grid matrix visualization
- Smooth interaction between matrix and layer controls

## Phase 5: Testing and Polish

### Task 5.1: Add Layer System Tests
**Files**: `tests/layer-system.spec.js`

**Tasks**:
- [ ] Test layer creation and management
- [ ] Test cell layer assignment
- [ ] Test layer-based rendering order
- [ ] Test layer visibility toggles

**Acceptance Criteria**:
- All layer functionality has test coverage
- Tests pass consistently
- Edge cases are handled properly

### Task 5.2: UI Polish and UX Improvements
**Files**: Various UI files

**Tasks**:
- [ ] Add smooth animations for layer changes
- [ ] Add keyboard shortcuts for layer operations
- [ ] Add tooltips and help text
- [ ] Optimize performance for large grids

**Acceptance Criteria**:
- Layer changes feel smooth and responsive
- Keyboard shortcuts work for common operations
- UI is intuitive and well-documented
- Performance is good with many cells

## Implementation Order

1. **Phase 1** (Core Infrastructure) - Foundation for everything else
2. **Phase 2** (Rendering) - Core functionality working
3. **Phase 3** (Layer Panel) - Basic UI working
4. **Phase 4** (Grid Matrix) - Full UI functionality
5. **Phase 5** (Testing/Polish) - Production ready

## Success Criteria

- [ ] Main text renders on top by default
- [ ] Users can move content above main text when needed
- [ ] Layer panel shows all cells organized by layer
- [ ] Grid matrix allows easy cell selection and layer assignment
- [ ] Animations continue to work with layer system
- [ ] Performance is maintained or improved
- [ ] UI is intuitive and matches existing design patterns
