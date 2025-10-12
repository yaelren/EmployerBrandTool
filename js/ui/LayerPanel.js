/**
 * LayerPanel.js - Photoshop-style layer management UI component
 * Part of the Layer Management System
 */

class LayerPanel {
    constructor(app) {
        this.app = app;
        this.layerManager = app.layerManager;
        this.selectedCell = null;
        this.elements = {};
        
        this.initialize();
    }
    
    /**
     * Initialize the layer panel
     */
    initialize() {
        this.createHTML();
        this.cacheElements();
        this.setupEventListeners();
        this.updateDisplay();
    }
    
    /**
     * Create the HTML structure for the layer panel
     */
    createHTML() {
        const debugContent = document.getElementById('debugContent');
        if (!debugContent) {
            console.error('Debug content container not found - LayerPanel cannot initialize');
            return;
        }
        
        
        // Create layer panel section
        const layerPanelHTML = `
            <div class="layer-panel-section">
                <h3>Layer Management</h3>
                <div class="layer-list" id="layerList">
                    <!-- Layers will be populated here -->
                </div>
                
                <div class="cell-selection" id="cellSelection">
                    <h4>Cell Selection</h4>
                    <div class="selected-cell-info" id="selectedCellInfo">
                        <p>No cell selected</p>
                    </div>
                    <div class="layer-assignment" id="layerAssignment" style="display: none;">
                        <label>Move to layer:</label>
                        <select id="layerSelect">
                            <option value="background">Background</option>
                            <option value="behind-main-text">Behind Main Text</option>
                            <option value="main-text">Main Text</option>
                            <option value="above-main-text">Above Main Text</option>
                        </select>
                        <button id="moveToLayer">Move</button>
                    </div>
                </div>
                
                <div class="grid-matrix-view" id="gridMatrixView">
                    <h4>Grid Matrix</h4>
                    <div class="matrix-container" id="matrixContainer">
                        <!-- Grid matrix will be populated here -->
                    </div>
                </div>
            </div>
        `;
        
        debugContent.insertAdjacentHTML('beforeend', layerPanelHTML);
    }
    
    /**
     * Cache references to UI elements
     */
    cacheElements() {
        this.elements = {
            layerList: document.getElementById('layerList'),
            cellSelection: document.getElementById('cellSelection'),
            selectedCellInfo: document.getElementById('selectedCellInfo'),
            layerAssignment: document.getElementById('layerAssignment'),
            layerSelect: document.getElementById('layerSelect'),
            moveToLayer: document.getElementById('moveToLayer'),
            matrixContainer: document.getElementById('matrixContainer')
        };
        
        // Check if all elements were found
        const missingElements = Object.entries(this.elements)
            .filter(([name, element]) => !element)
            .map(([name]) => name);
            
        if (missingElements.length > 0) {
            console.error('LayerPanel: Missing elements:', missingElements);
        }
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Layer visibility toggles
        this.elements.layerList.addEventListener('click', (e) => {
            if (e.target.classList.contains('layer-visibility')) {
                this.toggleLayerVisibility(e.target);
            }
        });
        
        // Layer assignment
        this.elements.moveToLayer.addEventListener('click', () => {
            this.moveSelectedCellToLayer();
        });
        
        // Grid matrix cell selection
        this.elements.matrixContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('matrix-cell')) {
                this.selectCell(e.target);
            }
        });
    }
    
    /**
     * Update the layer panel display
     */
    updateDisplay() {
        this.updateLayerList();
        this.updateGridMatrix();
        this.updateSelectedCellInfo();
    }
    
    /**
     * Update the layer list display
     */
    updateLayerList() {
        const layers = this.layerManager.getAllLayers();
        const layerListHTML = layers.map(layer => {
            const cellCount = layer.getCellCount();
            const visibilityIcon = layer.visible ? '👁' : '🚫';
            
            return `
                <div class="layer-item" data-layer-id="${layer.id}">
                    <span class="layer-visibility" data-layer-id="${layer.id}">${visibilityIcon}</span>
                    <span class="layer-name">${layer.name}</span>
                    <span class="layer-count">(${cellCount} cells)</span>
                    <div class="layer-cells">
                        ${this.getLayerCellsHTML(layer)}
                    </div>
                </div>
            `;
        }).join('');
        
        this.elements.layerList.innerHTML = layerListHTML;
    }
    
    /**
     * Get HTML for cells in a layer
     */
    getLayerCellsHTML(layer) {
        const cells = layer.getCells();
        return cells.map(cell => {
            const cellType = this.getCellTypeIcon(cell);
            const cellInfo = this.getCellInfo(cell);
            
            return `
                <div class="layer-cell" data-cell-id="${cell.id}">
                    <span class="cell-icon">${cellType}</span>
                    <span class="cell-info">${cellInfo}</span>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Get icon for cell type
     */
    getCellTypeIcon(cell) {
        switch (cell.type) {
            case 'main-text': return '📝';
            case 'content': 
                switch (cell.contentType) {
                    case 'image': return '🖼️';
                    case 'text': return '📄';
                    case 'mask': return '🎭';
                    default: return '⬜';
                }
            default: return '❓';
        }
    }
    
    /**
     * Get cell information string
     */
    getCellInfo(cell) {
        if (cell.type === 'main-text') {
            return `Text Line ${cell.lineIndex + 1}`;
        } else if (cell.type === 'content') {
            return `Cell ${cell.id} (${cell.contentType})`;
        }
        return `Cell ${cell.id}`;
    }
    
    /**
     * Update the grid matrix view
     */
    updateGridMatrix() {
        if (!this.app.grid || !this.app.grid.isReady) {
            this.elements.matrixContainer.innerHTML = '<p>Grid not ready</p>';
            return;
        }
        
        const matrix = this.app.grid.matrix;
        const matrixHTML = matrix.map((row, rowIndex) => {
            const rowHTML = row.map((cell, colIndex) => {
                if (!cell) {
                    return '<div class="matrix-cell empty"></div>';
                }
                
                const cellType = this.getCellTypeIcon(cell);
                const isSelected = this.selectedCell && this.selectedCell.id === cell.id;
                const selectedClass = isSelected ? 'selected' : '';
                
                return `
                    <div class="matrix-cell ${selectedClass}" 
                         data-cell-id="${cell.id}" 
                         data-row="${rowIndex}" 
                         data-col="${colIndex}"
                         title="Cell ${cell.id} - ${cell.type}">
                        ${cellType}
                    </div>
                `;
            }).join('');
            
            return `<div class="matrix-row">${rowHTML}</div>`;
        }).join('');
        
        this.elements.matrixContainer.innerHTML = matrixHTML;
    }
    
    /**
     * Update selected cell information
     */
    updateSelectedCellInfo() {
        if (!this.selectedCell) {
            this.elements.selectedCellInfo.innerHTML = '<p>No cell selected</p>';
            this.elements.layerAssignment.style.display = 'none';
            return;
        }
        
        const cell = this.selectedCell;
        const cellInfo = this.getCellInfo(cell);
        const currentLayer = this.layerManager.getLayer(cell.layerId);
        
        this.elements.selectedCellInfo.innerHTML = `
            <p><strong>Selected:</strong> ${cellInfo}</p>
            <p><strong>Current Layer:</strong> ${currentLayer ? currentLayer.name : 'Unknown'}</p>
            <p><strong>Position:</strong> Row ${cell.row}, Col ${cell.col}</p>
        `;
        
        // Set current layer in dropdown
        this.elements.layerSelect.value = cell.layerId;
        this.elements.layerAssignment.style.display = 'block';
    }
    
    /**
     * Toggle layer visibility
     */
    toggleLayerVisibility(element) {
        const layerId = element.dataset.layerId;
        const layer = this.layerManager.getLayer(layerId);
        
        if (layer) {
            layer.setVisible(!layer.visible);
            this.updateDisplay();
            this.app.render(); // Re-render to reflect visibility changes
        }
    }
    
    /**
     * Select a cell from the grid matrix
     */
    selectCell(element) {
        const cellId = parseInt(element.dataset.cellId);
        const cell = this.app.grid.getCellById(cellId);
        
        if (cell) {
            this.selectedCell = cell;
            this.updateDisplay();
        }
    }
    
    /**
     * Move selected cell to a different layer
     */
    moveSelectedCellToLayer() {
        if (!this.selectedCell) {
            alert('No cell selected');
            return;
        }
        
        const newLayerId = this.elements.layerSelect.value;
        const success = this.selectedCell.setLayer(newLayerId);
        
        if (success) {
            this.updateDisplay();
            this.app.render(); // Re-render to show layer change
        } else {
            alert('Failed to move cell to layer');
        }
    }
    
    /**
     * Refresh the layer panel (call this when grid changes)
     */
    refresh() {
        this.updateDisplay();
    }
}
