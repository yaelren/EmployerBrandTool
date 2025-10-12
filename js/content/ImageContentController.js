/**
 * ImageContentController.js - Handles media cell controls and interactions
 * Extends ContentController for image, video, GIF, and other media functionality
 */

class ImageContentController extends ContentController {
    constructor(app) {
        super(app);
        this.contentType = 'media';
    }
    
    /**
     * Get default content for media spots
     * @returns {Object} Default content object
     */
    getDefaultContent() {
        return {
            media: null,        // HTMLImageElement, HTMLVideoElement, or HTMLCanvasElement
            mediaType: null,    // 'image', 'video', 'gif', 'lottie', 'other'
            mediaUrl: null,     // Original file URL/data URL
            fillMode: 'fit',    // 'fill', 'fit', or 'stretch'
            scale: 1,
            rotation: 0,
            padding: 1,
            positionH: 'center',
            positionV: 'middle',
            // Video-specific properties
            autoplay: true,
            loop: true,
            muted: true,
            controls: false,
            // Lottie-specific properties
            lottieAnimation: null,  // Lottie animation instance
            lottieContainer: null   // Hidden container element for Lottie
        };
    }
    
    /**
     * Create controls for media spots
     * @param {ContentCell} cell - Spot object
     * @param {HTMLElement} container - Container for controls
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement[]} Array of created control elements
     */
    createControls(cell, container, context = 'sidebar') {
        // Initialize content if needed
        this.initializeContent(cell);

        const controls = [];

        // 1. Media upload
        const mediaGroup = this.createMediaUploadControl(cell, context);
        container.appendChild(mediaGroup);
        controls.push(mediaGroup);

        // 2. Fill mode control (inline)
        const fillModeGroup = this.createFillModeControl(cell, context);
        container.appendChild(fillModeGroup);
        controls.push(fillModeGroup);

        // 3. Scale control (only show in free mode)
        if (cell.content.fillMode === 'fit') {
            const scaleGroup = this.createScaleControl(cell, context);
            container.appendChild(scaleGroup);
            controls.push(scaleGroup);
        }

        // 4. Rotation control
        const rotationGroup = this.createRotationControl(cell, context);
        container.appendChild(rotationGroup);
        controls.push(rotationGroup);

        // 5. Background controls (fill with global background color)
        const backgroundGroup = this.createBackgroundControls(cell, context);
        container.appendChild(backgroundGroup);
        controls.push(backgroundGroup);

        // 6. Position control
        const positionGroup = this.createPositionControl(cell, context);
        container.appendChild(positionGroup);
        controls.push(positionGroup);

        // Note: Padding control is automatically added by UIManager after createControls()

        return controls;
    }
    
    /**
     * Initialize cell content with defaults and migrate old image property
     * @param {ContentCell} cell - Cell object
     * @returns {Object} Initialized content object
     * @protected
     */
    initializeContent(cell) {
        if (!cell.content) {
            cell.content = this.getDefaultContent();
        } else {
            // Migrate old image property to new media structure
            if (cell.content.image && !cell.content.media) {
                cell.content.media = cell.content.image;
                cell.content.mediaType = 'image';
                cell.content.mediaUrl = cell.content.image.src || null;
                delete cell.content.image;
            }
            
            // Ensure fillMode exists (for backward compatibility)
            if (!cell.content.fillMode) {
                cell.content.fillMode = 'fit';
            }
        }
        return cell.content;
    }
    
    /**
     * Create media upload control
     * @param {ContentCell} cell - Spot object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Media upload control element
     * @private
     */
    createMediaUploadControl(cell, context) {
        const mediaGroup = this.createControlGroup(context);
        
        // Check if there's already a file uploaded
        const hasFile = cell.content?.media && cell.content?.mediaUrl;
        const fileName = hasFile ? (cell.content.fileName || this.getFileNameFromUrl(cell.content.mediaUrl)) : '';
        
        console.log('Creating media upload control:', {
            hasFile,
            fileName,
            media: cell.content?.media,
            mediaUrl: cell.content?.mediaUrl,
            mediaType: cell.content?.mediaType
        });
        
        mediaGroup.innerHTML = `
            <label>Media (Image, Video, GIF, MP4, Lottie JSON)</label>
            <div class="media-upload-row">
                ${!hasFile ? `
                    <input type="file" class="spot-media-input" accept="image/*,video/*,.gif,.mp4,.webm,.mov,.json,application/json">
                ` : `
                    <div class="uploaded-file-inline">
                        <span class="file-name">${fileName}</span>
                        <button type="button" class="remove-file-btn" title="Remove file">×</button>
                        <button type="button" class="change-file-btn" title="Change file">Change</button>
                    </div>
                    <input type="file" class="spot-media-input" accept="image/*,video/*,.gif,.mp4,.webm,.mov,.json,application/json" style="display: none;">
                `}
            </div>
            ${hasFile && (cell.content.mediaType === 'video' || cell.content.mediaType === 'lottie') ? `
                <div class="video-loop-control">
                    <label class="loop-toggle">
                        <input type="checkbox" class="media-loop" ${cell.content.loop !== false ? 'checked' : ''}>
                        Loop
                    </label>
                </div>
            ` : ''}
        `;

        const mediaInput = mediaGroup.querySelector('.spot-media-input');
        const removeBtn = mediaGroup.querySelector('.remove-file-btn');
        const changeBtn = mediaGroup.querySelector('.change-file-btn');
        const loopToggle = mediaGroup.querySelector('.media-loop');
        
        this.addControlListener(mediaInput, 'change', (e) => {
            this.handleMediaUpload(cell, e);
        });
        
        if (removeBtn) {
            this.addControlListener(removeBtn, 'click', () => {
                this.removeMedia(cell, mediaGroup);
            });
        }

        if (changeBtn) {
            this.addControlListener(changeBtn, 'click', () => {
                mediaInput.click();
            });
        }

        if (loopToggle) {
            this.addControlListener(loopToggle, 'change', () => {
                this.updateContent(cell, { loop: loopToggle.checked }, true);
                if (cell.content.media) {
                    // Handle video loop
                    if (cell.content.mediaType === 'video') {
                        cell.content.media.loop = loopToggle.checked;
                    }
                    // Handle Lottie loop
                    else if (cell.content.mediaType === 'lottie' && cell.content.lottieAnimation) {
                        cell.content.lottieAnimation.loop = loopToggle.checked;
                    }
                }
            });
        }

        return mediaGroup;
    }
    
    /**
     * Create fill mode control
     * @param {ContentCell} cell - Cell object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Fill mode control element
     * @private
     */
    createFillModeControl(cell, context) {
        const fillModeGroup = this.createControlGroup(context);
        fillModeGroup.innerHTML = `
            <div class="fill-mode-control">
                <label for="imageFillMode">Fill Mode:</label>
                <select id="imageFillMode" class="image-fill-mode">
                    <option value="stretch" ${cell.content.fillMode === 'stretch' ? 'selected' : ''}>Stretch</option>
                    <option value="fit" ${cell.content.fillMode === 'fit' ? 'selected' : ''}>Free</option>
                    <option value="fill" ${cell.content.fillMode === 'fill' ? 'selected' : ''}>Fill (Crop)</option>
                </select>
            </div>
        `;

        const select = fillModeGroup.querySelector('#imageFillMode');
        this.addControlListener(select, 'change', () => {
            const mode = select.value;
            this.updateContent(cell, { fillMode: mode }, false);
            
            // Refresh controls to show/hide scale control
            if (this.app.uiManager && this.app.uiManager.showSelectedCellControls) {
                const selectedCell = this.app.selectedCell;
                if (selectedCell) {
                    this.app.uiManager.showSelectedCellControls(selectedCell.cell, selectedCell.row, selectedCell.col);
                }
            }
        });

        return fillModeGroup;
    }
    
    /**
     * Create position alignment control
     * @param {ContentCell} cell - Cell object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Position control element
     * @private
     */
    createPositionControl(cell, context) {
        const positionGroup = this.createControlGroup(context);
        positionGroup.innerHTML = `<label>Position in Cell</label>`;

        const positionGrid = document.createElement('div');
        positionGrid.className = 'positioning-grid';

        const positions = [
            { h: 'left', v: 'top', icon: '↖', title: 'Top Left' },
            { h: 'center', v: 'top', icon: '↑', title: 'Top Center' },
            { h: 'right', v: 'top', icon: '↗', title: 'Top Right' },
            { h: 'left', v: 'middle', icon: '←', title: 'Middle Left' },
            { h: 'center', v: 'middle', icon: '•', title: 'Center' },
            { h: 'right', v: 'middle', icon: '→', title: 'Middle Right' },
            { h: 'left', v: 'bottom', icon: '↙', title: 'Bottom Left' },
            { h: 'center', v: 'bottom', icon: '↓', title: 'Bottom Center' },
            { h: 'right', v: 'bottom', icon: '↘', title: 'Bottom Right' }
        ];

        positions.forEach(pos => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'pos-btn';
            btn.textContent = pos.icon;
            btn.title = pos.title;

            const currentPosH = cell.content.positionH || 'center';
            const currentPosV = cell.content.positionV || 'middle';

            if (pos.h === currentPosH && pos.v === currentPosV) {
                btn.classList.add('active');
            }

            this.addControlListener(btn, 'click', () => {
                positionGrid.querySelectorAll('.pos-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateContent(cell, {
                    positionH: pos.h,
                    positionV: pos.v
                }, true);
            });

            positionGrid.appendChild(btn);
        });

        positionGroup.appendChild(positionGrid);
        return positionGroup;
    }
    
    /**
     * Create scale control
     * @param {ContentCell} cell - Cell object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Scale control element
     * @private
     */
    createScaleControl(cell, context) {
        const scaleGroup = this.createControlGroup(context);
        scaleGroup.innerHTML = `
            <label>Scale: <span class="scale-value">${(cell.content.scale || 1).toFixed(2)}</span></label>
            <input type="range" class="spot-scale" min="0.1" max="3" step="0.1" value="${cell.content.scale || 1}">
        `;

        const scaleSlider = scaleGroup.querySelector('.spot-scale');
        const scaleValue = scaleGroup.querySelector('.scale-value');

        this.addControlListener(scaleSlider, 'input', () => {
            const value = parseFloat(scaleSlider.value);
            scaleValue.textContent = value.toFixed(2);
            this.updateContent(cell, { scale: value }, true);
        });

        return scaleGroup;
    }
    
    /**
     * Create rotation control
     * @param {ContentCell} cell - Cell object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Rotation control element
     * @private
     */
    createRotationControl(cell, context) {
        const rotationGroup = this.createControlGroup(context);
        rotationGroup.innerHTML = `
            <label>Rotation: <span class="rotation-value">${cell.content.rotation || 0}°</span></label>
            <input type="range" class="spot-rotation" min="0" max="360" step="5" value="${cell.content.rotation || 0}">
        `;

        const rotationSlider = rotationGroup.querySelector('.spot-rotation');
        const rotationValue = rotationGroup.querySelector('.rotation-value');

        this.addControlListener(rotationSlider, 'input', () => {
            const value = parseInt(rotationSlider.value);
            rotationValue.textContent = value + '°';
            this.updateContent(cell, { rotation: value }, true);
        });

        return rotationGroup;
    }
    
    /**
     * Create video-specific controls
     * @param {ContentCell} cell - Cell object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Video controls element
     * @private
     */
    createVideoControls(cell, context) {
        const videoGroup = this.createControlGroup(context);
        videoGroup.innerHTML = `
            <label>Video Settings</label>
            <div class="video-controls">
                <label>
                    <input type="checkbox" class="video-loop" ${cell.content.loop ? 'checked' : ''}>
                    Loop
                </label>
                <p style="font-size: 11px; color: var(--chatooly-color-text-secondary, #999); margin-top: 8px;">
                    Videos autoplay by default (muted for browser compatibility)
                </p>
            </div>
        `;

        // Add event listener for loop control only
        const loopCheckbox = videoGroup.querySelector('.video-loop');

        this.addControlListener(loopCheckbox, 'change', () => {
            this.updateContent(cell, { loop: loopCheckbox.checked }, true);
            if (cell.content.media) {
                cell.content.media.loop = loopCheckbox.checked;
            }
        });

        return videoGroup;
    }
    
    /**
     * Handle media file upload (images, videos, GIFs)
     * @param {ContentCell} cell - Cell object
     * @param {Event} event - File input change event
     * @private
     */
    handleMediaUpload(cell, event) {
        const file = event.target.files[0];
        if (!file) {
            console.warn('Please select a file');
            return;
        }

        // Store the file name for display
        this.currentFileName = file.name;

        // Check if this is a Lottie JSON file
        const fileName = file.name.toLowerCase();
        const isJSON = fileName.endsWith('.json') || file.type === 'application/json';

        if (isJSON) {
            // Handle Lottie JSON file
            const reader = new FileReader();
            reader.onload = (e) => {
                this.handleLottieUpload(cell, e.target.result, file.name);
            };
            reader.readAsText(file);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const fileType = file.type;
            const fileName = file.name.toLowerCase();

            // Determine media type
            let mediaType = 'other';
            if (fileType.startsWith('image/')) {
                mediaType = fileName.endsWith('.gif') ? 'gif' : 'image';
            } else if (fileType.startsWith('video/')) {
                mediaType = 'video';
            }

            if (mediaType === 'image' || mediaType === 'gif') {
                // Handle images and GIFs
                const img = new Image();
                img.onload = () => {
                    this.updateContent(cell, {
                        media: img,
                        mediaType: mediaType,
                        mediaUrl: e.target.result,
                        fileName: file.name, // Store original file name
                        scale: 1,
                        rotation: 0
                    });
                    
                    console.log('Image uploaded, updating content:', {
                        media: img,
                        mediaType: mediaType,
                        mediaUrl: e.target.result,
                        fileName: file.name
                    });

                    // Recreate controls to show scale/rotation and file display
                    if (this.app.uiManager && this.app.uiManager.showSelectedCellControls) {
                        const selectedCell = this.app.selectedCell;
                        if (selectedCell) {
                            this.app.uiManager.showSelectedCellControls(selectedCell.cell, selectedCell.row, selectedCell.col);
                        }
                    }
                };
                img.src = e.target.result;
            } else if (mediaType === 'video') {
                // Handle videos
                const video = document.createElement('video');
                video.src = e.target.result;
                video.preload = 'metadata';
                video.crossOrigin = 'anonymous'; // Allow canvas drawing
                
                // Set video properties immediately
                video.autoplay = true; // Always autoplay
                video.loop = cell.content.loop !== false; // Default to true
                video.muted = true; // Always muted for autoplay compatibility
                video.controls = false; // Never show controls
                
                video.addEventListener('loadedmetadata', () => {
                    console.log('Video metadata loaded:', video.videoWidth, 'x', video.videoHeight);
                    
                    this.updateContent(cell, {
                        media: video,
                        mediaType: mediaType,
                        mediaUrl: e.target.result,
                        fileName: file.name, // Store original file name
                        scale: 1,
                        rotation: 0,
                        autoplay: true, // Always autoplay
                        loop: cell.content.loop !== false // Default to true
                    });

                    // Recreate controls to show video controls and file display
                    if (this.app.uiManager && this.app.uiManager.showSelectedCellControls) {
                        const selectedCell = this.app.selectedCell;
                        if (selectedCell) {
                            this.app.uiManager.showSelectedCellControls(selectedCell.cell, selectedCell.row, selectedCell.col);
                        }
                    }
                    
                    // Force a render to show the video
                    this.app.render();
                    
                    // Start animation loop for video frame updates
                    this.app._startAnimationLoop();
                    
                    // Ensure video playback is correct
                    this.ensureVideoPlayback(cell);
                });

                video.addEventListener('canplay', () => {
                    console.log('Video can play');
                    // Ensure we have a frame to draw
                    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                        this.app.render();
                    }
                });

                video.addEventListener('error', (event) => {
                    console.error('Error loading video:', video.error, event);
                    alert('Error loading video file. Please try a different format.');
                });
                
                // Also try to load the video immediately
                video.load();
            } else {
                console.warn('Unsupported file type:', fileType);
                alert('Unsupported file type. Please select an image, video, or GIF file.');
            }
        };
        reader.readAsDataURL(file);
    }
    
    /**
     * Handle Lottie JSON file upload
     * @param {ContentCell} cell - Cell object
     * @param {string} jsonData - Lottie JSON data as string
     * @param {string} fileName - Original file name
     * @private
     */
    handleLottieUpload(cell, jsonData, fileName) {
        try {
            // Parse JSON to validate it
            const animationData = JSON.parse(jsonData);
            
            // Check if lottie library is available
            if (typeof lottie === 'undefined') {
                console.error('Lottie library not loaded');
                alert('Lottie library not loaded. Please refresh the page.');
                return;
            }
            
            // Get animation dimensions
            const width = animationData.w || 512;
            const height = animationData.h || 512;
            
            // Create a hidden container div for Lottie canvas
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.width = width + 'px';
            container.style.height = height + 'px';
            container.style.pointerEvents = 'none';
            document.body.appendChild(container);
            
            // Create Lottie animation instance with canvas renderer
            const lottieAnimation = lottie.loadAnimation({
                container: container,
                renderer: 'canvas',
                loop: true,
                autoplay: true,
                animationData: animationData,
                rendererSettings: {
                    preserveAspectRatio: 'xMidYMid meet',
                    clearCanvas: true,
                    progressiveLoad: false
                }
            });
            
            // Get the canvas that Lottie created
            const canvas = container.querySelector('canvas');
            
            if (!canvas) {
                console.error('Lottie did not create a canvas element');
                document.body.removeChild(container);
                alert('Failed to initialize Lottie animation.');
                return;
            }
            
            // Store canvas, animation instance, and container for cleanup
            this.updateContent(cell, {
                media: canvas,
                mediaType: 'lottie',
                mediaUrl: jsonData, // Store JSON data
                fileName: fileName,
                lottieAnimation: lottieAnimation, // Store animation instance for control
                lottieContainer: container, // Store container for cleanup
                scale: 1,
                rotation: 0
            });
            
            console.log('Lottie animation loaded:', {
                fileName: fileName,
                width: width,
                height: height,
                canvas: canvas
            });
            
            // Recreate controls to show file display
            if (this.app.uiManager && this.app.uiManager.showSelectedCellControls) {
                const selectedCell = this.app.selectedCell;
                if (selectedCell) {
                    this.app.uiManager.showSelectedCellControls(selectedCell.cell, selectedCell.row, selectedCell.col);
                }
            }
            
            // Start animation loop to continuously render Lottie frames
            this.app._startAnimationLoop();
            
        } catch (error) {
            console.error('Error loading Lottie animation:', error);
            alert('Invalid Lottie JSON file. Please make sure the file is a valid Lottie animation.');
        }
    }
    
    /**
     * Extract file name from data URL or file path
     * @param {string} url - Data URL or file path
     * @returns {string} File name
     * @private
     */
    getFileNameFromUrl(url) {
        if (!url) return '';
        
        // For data URLs, try to extract from the original file name if stored
        if (url.startsWith('data:')) {
            // If we have the original file name stored, use it
            return this.currentFileName || 'uploaded-file';
        }
        
        // For regular URLs, extract from path
        const pathParts = url.split('/');
        return pathParts[pathParts.length - 1] || 'file';
    }
    
    /**
     * Remove uploaded media from cell
     * @param {ContentCell} cell - Cell object
     * @param {HTMLElement} mediaGroup - Media control group element
     * @private
     */
    removeMedia(cell, mediaGroup) {
        // Clean up Lottie animation if present
        if (cell.content?.lottieAnimation) {
            try {
                cell.content.lottieAnimation.destroy();
                console.log('Lottie animation destroyed');
            } catch (error) {
                console.warn('Error destroying Lottie animation:', error);
            }
        }
        
        // Clean up Lottie container if present
        if (cell.content?.lottieContainer && cell.content.lottieContainer.parentNode) {
            try {
                document.body.removeChild(cell.content.lottieContainer);
                console.log('Lottie container removed');
            } catch (error) {
                console.warn('Error removing Lottie container:', error);
            }
        }
        
        // Actually remove the file completely
        this.updateContent(cell, {
            media: null,
            mediaType: null,
            mediaUrl: null,
            fileName: null,
            lottieAnimation: null,
            lottieContainer: null,
            scale: 1,
            rotation: 0,
            autoplay: true,
            loop: true
        });
        
        // Clear the file input
        const fileInput = mediaGroup.querySelector('.spot-media-input');
        if (fileInput) {
            fileInput.value = '';
        }
        
        // Refresh the content controls to hide file display
        if (this.app.uiManager && this.app.uiManager.showSelectedCellControls) {
            const selectedCell = this.app.selectedCell;
            if (selectedCell) {
                this.app.uiManager.showSelectedCellControls(selectedCell.cell, selectedCell.row, selectedCell.col);
            }
        }
    }
    
    /**
     * Ensure video is playing if autoplay is enabled
     * @param {ContentCell} cell - Cell object
     * @private
     */
    ensureVideoPlayback(cell) {
        if (cell.content?.media instanceof HTMLVideoElement) {
            const video = cell.content.media;
            
            // Always try to play videos (autoplay is always enabled)
            if (video.paused) {
                video.play().catch(error => {
                    console.warn('Video autoplay failed:', error);
                    // Autoplay might fail due to browser policies, that's okay
                });
            }
            
            // If loop is enabled, ensure it's set
            if (cell.content.loop !== false) { // Default to true
                video.loop = true;
            }
        }
    }

    /**
     * Create background controls for image/text cells
     * @param {ContentCell} cell - Cell object
     * @param {string} context - 'sidebar' or 'popup'
     * @returns {HTMLElement} Created background controls element
     * @protected
     */
    createBackgroundControls(cell, context) {
        const group = this.createControlGroup(context);
        group.innerHTML = `
            <label>Background:</label>
            <label>
                <input type="checkbox" id="imageFillWithBackgroundColor" ${cell.content.fillWithBackgroundColor ? 'checked' : ''}>
                Fill with global background color
            </label>
        `;

        // Add event listeners
        const checkbox = group.querySelector('#imageFillWithBackgroundColor');

        checkbox.addEventListener('change', (e) => {
            cell.content.fillWithBackgroundColor = e.target.checked;
            this.app.render();
        });

        return group;
    }
}