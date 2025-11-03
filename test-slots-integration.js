/**
 * Content Slots Integration Test
 * Add this to your app to test Content Slots with real grid cells
 *
 * Usage: Paste this entire file into browser console after app loads
 */

(function() {
    console.log('🧪 Content Slots Integration Test Loaded');

    // Verify prerequisites
    if (!window.app) {
        console.error('❌ App not found. Wait for app to load.');
        return;
    }

    if (!app.presetPageManager || !app.presetPageManager.contentSlotManager) {
        console.error('❌ ContentSlotManager not initialized. Check console for errors.');
        return;
    }

    console.log('✅ App and ContentSlotManager ready');

    // Create test UI
    const testPanel = document.createElement('div');
    testPanel.id = 'slotsTestPanel';
    testPanel.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        border: 2px solid #3b82f6;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        max-width: 350px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    testPanel.innerHTML = `
        <div style="margin-bottom: 12px;">
            <strong style="color: #1e40af; font-size: 16px;">🧪 Content Slots Test</strong>
            <button id="closeTestPanel" style="float: right; background: none; border: none; font-size: 20px; cursor: pointer; color: #6b7280;">&times;</button>
        </div>

        <div style="font-size: 13px; color: #4b5563; margin-bottom: 12px;">
            Test Content Slots with your grid cells
        </div>

        <div id="testStatus" style="padding: 8px; background: #f3f4f6; border-radius: 4px; font-size: 12px; margin-bottom: 12px; color: #374151;">
            Status: Ready
        </div>

        <button id="testTextCell" style="width: 100%; padding: 8px; margin-bottom: 8px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;">
            📝 Test with Text Cell
        </button>

        <button id="testImageCell" style="width: 100%; padding: 8px; margin-bottom: 8px; background: #8b5cf6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;">
            🖼️ Test with Image Cell
        </button>

        <button id="showConfigPanel" style="width: 100%; padding: 8px; margin-bottom: 8px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;">
            ⚙️ Open Config Panel
        </button>

        <button id="showAllSlots" style="width: 100%; padding: 8px; margin-bottom: 8px; background: #f59e0b; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;">
            📋 Show All Slots
        </button>

        <button id="testExportSelector" style="width: 100%; padding: 8px; background: #ec4899; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;">
            🎬 Test Export Selector
        </button>
    `;

    document.body.appendChild(testPanel);

    // Status helper
    function updateStatus(message, type = 'info') {
        const status = document.getElementById('testStatus');
        const colors = {
            info: '#3b82f6',
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b'
        };
        status.style.color = colors[type] || colors.info;
        status.textContent = message;
        console.log(message);
    }

    // Close button
    document.getElementById('closeTestPanel').addEventListener('click', () => {
        testPanel.remove();
    });

    // Test with text cell
    document.getElementById('testTextCell').addEventListener('click', () => {
        try {
            const cells = app.grid?.getAllCells() || [];
            const textCell = cells.find(c => c.type === 'text' || c.type === 'main-text');

            if (!textCell) {
                updateStatus('❌ No text cells found. Create one first!', 'error');
                alert('No text cells found in grid. Please add a text cell first.');
                return;
            }

            updateStatus(`Found text cell: ${textCell.id}`, 'success');

            // Create slot
            const config = {
                fieldName: 'testHeadline',
                fieldLabel: 'Test Headline',
                fieldDescription: 'Testing text slot creation',
                required: true,
                constraints: {
                    maxCharacters: 50,
                    minFontSize: 24,
                    maxFontSize: 72
                }
            };

            const slot = app.presetPageManager.contentSlotManager.createSlotFromCell(textCell, config);

            console.log('✅ Text slot created:', slot);
            console.log('   → Bounding box:', slot.boundingBox);
            console.log('   → Constraints:', slot.constraints);
            console.log('   → Styling:', slot.styling);

            updateStatus(`✅ Created text slot for ${textCell.id}`, 'success');
            alert(`✅ Text Slot Created!\n\nCell: ${textCell.id}\nBounds: x=${slot.boundingBox.x}, y=${slot.boundingBox.y}\nSize: ${slot.boundingBox.width}×${slot.boundingBox.height}\n\nCheck console for details.`);

        } catch (error) {
            updateStatus(`❌ Error: ${error.message}`, 'error');
            console.error('Error creating text slot:', error);
            alert(`Error: ${error.message}`);
        }
    });

    // Test with image cell
    document.getElementById('testImageCell').addEventListener('click', () => {
        try {
            const cells = app.grid?.getAllCells() || [];
            const imageCell = cells.find(c => c.type === 'content' || c.type === 'spot');

            if (!imageCell) {
                updateStatus('❌ No image cells found. Create one first!', 'error');
                alert('No image/content cells found in grid. Please add one first.');
                return;
            }

            updateStatus(`Found image cell: ${imageCell.id}`, 'success');

            // Create slot
            const config = {
                fieldName: 'testImage',
                fieldLabel: 'Test Image',
                fieldDescription: 'Testing image slot creation',
                required: true,
                constraints: {
                    fitMode: 'cover',
                    maxFileSize: 10485760
                }
            };

            const slot = app.presetPageManager.contentSlotManager.createSlotFromCell(imageCell, config);

            console.log('✅ Image slot created:', slot);
            console.log('   → Bounding box:', slot.boundingBox);
            console.log('   → Constraints:', slot.constraints);

            updateStatus(`✅ Created image slot for ${imageCell.id}`, 'success');
            alert(`✅ Image Slot Created!\n\nCell: ${imageCell.id}\nBounds: x=${slot.boundingBox.x}, y=${slot.boundingBox.y}\nSize: ${slot.boundingBox.width}×${slot.boundingBox.height}\n\nCheck console for details.`);

        } catch (error) {
            updateStatus(`❌ Error: ${error.message}`, 'error');
            console.error('Error creating image slot:', error);
            alert(`Error: ${error.message}`);
        }
    });

    // Open config panel
    document.getElementById('showConfigPanel').addEventListener('click', () => {
        try {
            const cells = app.grid?.getAllCells() || [];
            const cell = cells.find(c => c.type === 'text' || c.type === 'main-text' || c.type === 'content');

            if (!cell) {
                updateStatus('❌ No cells found. Create some first!', 'error');
                alert('No cells found in grid. Please create some cells first.');
                return;
            }

            if (!app.contentSlotConfigPanel) {
                app.contentSlotConfigPanel = new ContentSlotConfigPanel(app);
            }

            updateStatus(`Opening config panel for ${cell.id}`, 'info');

            app.contentSlotConfigPanel.show(cell, (slot) => {
                updateStatus(`✅ Slot saved via panel: ${slot.slotId}`, 'success');
                console.log('✅ Slot created via panel:', slot);
                alert(`✅ Slot Created!\n\nSlot ID: ${slot.slotId}\nField: ${slot.fieldName}\nType: ${slot.type}\n\nCheck console for full details.`);
            }, () => {
                updateStatus('⚠️ Config panel cancelled', 'warning');
            });

        } catch (error) {
            updateStatus(`❌ Error: ${error.message}`, 'error');
            console.error('Error opening config panel:', error);
            alert(`Error: ${error.message}`);
        }
    });

    // Show all slots
    document.getElementById('showAllSlots').addEventListener('click', () => {
        try {
            const slots = app.presetPageManager.contentSlotManager.getAllSlots();

            console.log('📋 All Content Slots:', slots);
            console.log('   → Count:', slots.length);

            if (slots.length === 0) {
                updateStatus('No slots created yet', 'info');
                alert('No slots have been created yet.\n\nUse the test buttons above to create some slots first.');
            } else {
                updateStatus(`Found ${slots.length} slot(s)`, 'success');

                const slotInfo = slots.map((s, i) =>
                    `${i + 1}. ${s.slotId} (${s.type})\n   Field: ${s.fieldName}\n   Bounds: ${s.boundingBox.width}×${s.boundingBox.height}`
                ).join('\n\n');

                alert(`📋 Content Slots (${slots.length}):\n\n${slotInfo}\n\nCheck console for full details.`);
            }

        } catch (error) {
            updateStatus(`❌ Error: ${error.message}`, 'error');
            console.error('Error showing slots:', error);
        }
    });

    // Test export selector
    document.getElementById('testExportSelector').addEventListener('click', () => {
        try {
            // Create container
            const container = document.createElement('div');
            container.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 24px;
                border-radius: 8px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                z-index: 10000;
                max-width: 500px;
            `;

            const closeBtn = document.createElement('button');
            closeBtn.textContent = 'Close';
            closeBtn.style.cssText = `
                margin-top: 16px;
                padding: 8px 16px;
                background: #6b7280;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            `;
            closeBtn.addEventListener('click', () => {
                container.remove();
            });

            container.appendChild(document.createElement('div'));
            const selector = new ExportFormatSelector(container.firstChild);

            container.appendChild(closeBtn);
            document.body.appendChild(container);

            updateStatus('✅ Export selector opened', 'success');

            // Log config on close
            const originalClose = closeBtn.onclick;
            closeBtn.onclick = () => {
                const config = selector.getConfig();
                console.log('📤 Export Configuration:', config);
                updateStatus(`Export: ${config.defaultFormat} (${config.videoDuration}s, ${config.videoFPS}fps)`, 'success');
                originalClose.call(closeBtn);
            };

        } catch (error) {
            updateStatus(`❌ Error: ${error.message}`, 'error');
            console.error('Error opening export selector:', error);
            alert(`Error: ${error.message}`);
        }
    });

    updateStatus('✅ Test panel ready! Click buttons to test.', 'success');
    console.log('✅ Content Slots test panel loaded');
    console.log('💡 Use the blue panel in bottom-right to test features');

})();
