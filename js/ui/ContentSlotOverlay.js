/**
 * ContentSlotOverlay.js - Visual overlay to show content slots on canvas
 *
 * Similar to grid guides, but highlights editable content slot areas
 * Shows bounding boxes and labels for all configured slots
 */

class ContentSlotOverlay {
    constructor(app) {
        this.app = app;
        this.contentSlotManager = app.presetPageManager.contentSlotManager;

        this.enabled = false;
        this.overlayCanvas = null;
        this.overlayCtx = null;

        this.createOverlay();
    }

    /**
     * Create overlay canvas
     */
    createOverlay() {
        // Create canvas element
        this.overlayCanvas = document.createElement('canvas');
        this.overlayCanvas.id = 'contentSlotOverlay';
        this.overlayCanvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 100;
            display: none;
        `;

        // Insert after main canvas
        const mainCanvas = this.app.canvasManager.canvas;
        mainCanvas.parentElement.insertBefore(this.overlayCanvas, mainCanvas.nextSibling);

        this.overlayCtx = this.overlayCanvas.getContext('2d');

        // Match main canvas size
        this.updateSize();
    }

    /**
     * Update overlay canvas size and position to match main canvas
     */
    updateSize() {
        const mainCanvas = this.app.canvasManager.canvas;
        this.overlayCanvas.width = mainCanvas.width;
        this.overlayCanvas.height = mainCanvas.height;

        // Get main canvas position relative to its offset parent
        const mainRect = mainCanvas.getBoundingClientRect();
        const parentRect = mainCanvas.parentElement.getBoundingClientRect();

        // Calculate position relative to parent
        const left = mainRect.left - parentRect.left;
        const top = mainRect.top - parentRect.top;

        // Match visual size and position
        this.overlayCanvas.style.width = mainRect.width + 'px';
        this.overlayCanvas.style.height = mainRect.height + 'px';
        this.overlayCanvas.style.left = left + 'px';
        this.overlayCanvas.style.top = top + 'px';
    }

    /**
     * Show content slot overlays
     */
    show() {
        this.enabled = true;
        this.overlayCanvas.style.display = 'block';
        this.render();
    }

    /**
     * Hide content slot overlays
     */
    hide() {
        this.enabled = false;
        this.overlayCanvas.style.display = 'none';
        this.clear();
    }

    /**
     * Toggle overlay visibility
     */
    toggle() {
        if (this.enabled) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Clear overlay
     */
    clear() {
        this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    }

    /**
     * Render all content slots
     */
    render() {
        if (!this.enabled) return;

        this.clear();
        this.updateSize();

        const slots = this.contentSlotManager.getAllSlots();

        if (slots.length === 0) {
            // Show message when no slots
            this.renderNoSlotsMessage();
            return;
        }

        // Draw each slot
        slots.forEach((slot, index) => {
            this.renderSlot(slot, index);
        });
    }

    /**
     * Render "No slots configured" message
     */
    renderNoSlotsMessage() {
        const ctx = this.overlayCtx;
        const canvas = this.overlayCanvas;

        ctx.save();

        // Semi-transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Message box
        const boxWidth = 400;
        const boxHeight = 120;
        const x = (canvas.width - boxWidth) / 2;
        const y = (canvas.height - boxHeight) / 2;

        // White box
        ctx.fillStyle = 'white';
        ctx.fillRect(x, y, boxWidth, boxHeight);

        // Border
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, boxWidth, boxHeight);

        // Text
        ctx.fillStyle = '#1e40af';
        ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No Content Slots Configured', canvas.width / 2, y + 40);

        ctx.fillStyle = '#6b7280';
        ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillText('Click on cells and configure them', canvas.width / 2, y + 65);
        ctx.fillText('as editable content slots', canvas.width / 2, y + 85);

        ctx.restore();
    }

    /**
     * Render a single content slot
     */
    renderSlot(slot, index) {
        const ctx = this.overlayCtx;
        const bounds = slot.boundingBox;

        ctx.save();

        // Different colors for text vs image
        const isText = slot.type === 'text';
        const color = isText ? '#3b82f6' : '#8b5cf6'; // Blue for text, Purple for image

        // Draw bounding box with glow effect
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);

        // Glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

        // Reset shadow
        ctx.shadowBlur = 0;

        // Label background
        const labelPadding = 8;
        const labelHeight = 24;
        const labelText = `${slot.fieldLabel} (${slot.type})`;

        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        const labelWidth = ctx.measureText(labelText).width + labelPadding * 2;

        // Position label at top-left of slot
        const labelX = bounds.x;
        const labelY = bounds.y - labelHeight - 4;

        // Label background
        ctx.fillStyle = color;
        ctx.fillRect(labelX, labelY, labelWidth, labelHeight);

        // Label text
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, labelX + labelPadding, labelY + labelHeight / 2);

        // Corner indicators
        this.drawCornerIndicators(bounds, color);

        // Constraints indicator (bottom-right)
        this.drawConstraintsIndicator(slot, bounds, color);

        ctx.restore();
    }

    /**
     * Draw corner indicators for slot bounds
     */
    drawCornerIndicators(bounds, color) {
        const ctx = this.overlayCtx;
        const cornerSize = 12;
        const cornerThickness = 3;

        ctx.strokeStyle = color;
        ctx.lineWidth = cornerThickness;
        ctx.setLineDash([]);

        // Top-left
        ctx.beginPath();
        ctx.moveTo(bounds.x, bounds.y + cornerSize);
        ctx.lineTo(bounds.x, bounds.y);
        ctx.lineTo(bounds.x + cornerSize, bounds.y);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(bounds.x + bounds.width - cornerSize, bounds.y);
        ctx.lineTo(bounds.x + bounds.width, bounds.y);
        ctx.lineTo(bounds.x + bounds.width, bounds.y + cornerSize);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(bounds.x, bounds.y + bounds.height - cornerSize);
        ctx.lineTo(bounds.x, bounds.y + bounds.height);
        ctx.lineTo(bounds.x + cornerSize, bounds.y + bounds.height);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(bounds.x + bounds.width - cornerSize, bounds.y + bounds.height);
        ctx.lineTo(bounds.x + bounds.width, bounds.y + bounds.height);
        ctx.lineTo(bounds.x + bounds.width, bounds.y + bounds.height - cornerSize);
        ctx.stroke();
    }

    /**
     * Draw constraints indicator badge
     */
    drawConstraintsIndicator(slot, bounds, color) {
        const ctx = this.overlayCtx;

        let constraintText = '';
        if (slot.type === 'text') {
            constraintText = `${slot.constraints.maxCharacters} chars, ${slot.constraints.minFontSize}-${slot.constraints.maxFontSize}px`;
        } else {
            constraintText = `${slot.constraints.fitMode}, ${Math.round(slot.constraints.maxFileSize / 1048576)}MB`;
        }

        // Small badge at bottom-right
        ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        const badgeWidth = ctx.measureText(constraintText).width + 8;
        const badgeHeight = 16;
        const badgeX = bounds.x + bounds.width - badgeWidth;
        const badgeY = bounds.y + bounds.height + 4;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);

        // Text
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(constraintText, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2);
    }

    /**
     * Add toggle button to UI
     */
    addToggleButton() {
        // Find a good place to add the button (next to Show Guides)
        const guidesCheckbox = document.querySelector('input[type="checkbox"]'); // Adjust selector

        if (!guidesCheckbox) {
            // Fallback: add to controls area
            const controls = document.querySelector('.left-panel');
            if (controls) {
                this.createToggleButton(controls);
            }
            return;
        }

        const parent = guidesCheckbox.parentElement;
        this.createToggleButton(parent.parentElement);
    }

    /**
     * Create toggle button element
     */
    createToggleButton(container) {
        const button = document.createElement('label');
        button.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            cursor: pointer;
            user-select: none;
            background: #f3f4f6;
            border-radius: 4px;
            margin: 8px 0;
        `;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'showContentSlots';
        checkbox.checked = this.enabled;
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.show();
            } else {
                this.hide();
            }
        });

        const label = document.createElement('span');
        label.textContent = '📝 Show Content Slots';
        label.style.cssText = 'font-size: 14px; font-weight: 500; color: #374151;';

        button.appendChild(checkbox);
        button.appendChild(label);
        container.appendChild(button);
    }
}
