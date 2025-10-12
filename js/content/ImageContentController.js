/**
 * ImageContentController.js - Handles media cell controls and interactions
 * Extends ContentController for image, video, GIF, and other media functionality
 */

class ImageContentController extends ContentController {
    constructor(app) {
        super(app);
        this.contentType = 'image';
    }
    
    /**
     * Get default content for media spots
     * @returns {Object} Default content object
     */
    getDefaultContent() {
        return {
            media: null,        // HTMLImageElement, HTMLVideoElement, or HTMLCanvasElement
            mediaType: null,    // 'image', 'video', 'gif', 'other'
            mediaUrl: null,     // Original file URL/data URL
            scale: 1,
            rotation: 0,
            padding: 1,
            positionH: 'center',
            positionV: 'middle',
            // Video-specific properties
            autoplay: true,
            loop: true,
            muted: true,
            controls: false
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

        // Media upload
        const mediaGroup = this.createMediaUploadControl(cell, context);
        container.appendChild(mediaGroup);
        controls.push(mediaGroup);

        // Position control (always show)
        const positionGroup = this.createPositionControl(cell, context);
        container.appendChild(positionGroup);
        controls.push(positionGroup);

        // Scale control (always show for image content type)
        const scaleGroup = this.createScaleControl(cell, context);
        container.appendChild(scaleGroup);
        controls.push(scaleGroup);

        // Rotation control (always show for image content type)
        const rotationGroup = this.createRotationControl(cell, context);
        container.appendChild(rotationGroup);
        controls.push(rotationGroup);

        // Video-specific controls (only show if media is loaded and is video)
        if (cell.content?.media && cell.content.mediaType === 'video') {
            const videoGroup = this.createVideoControls(cell, context);
            container.appendChild(videoGroup);
            controls.push(videoGroup);
        }

        // Background controls
        const backgroundGroup = this.createBackgroundControls(cell, context);
        container.appendChild(backgroundGroup);
        controls.push(backgroundGroup);

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
            <label>Media (Image, Video, GIF, MP4)</label>
            <input type="file" class="spot-media-input" accept="image/*,video/*,.gif,.mp4,.webm,.mov">
            ${hasFile ? `
                <div class="uploaded-file-display">
                    <span class="file-name">${fileName}</span>
                    <div class="file-controls">
                        ${cell.content.mediaType === 'video' ? `
                            <label class="loop-toggle">
                                <input type="checkbox" class="media-loop" ${cell.content.loop !== false ? 'checked' : ''}>
                                Loop
                            </label>
                        ` : ''}
                        <button type="button" class="remove-file-btn" title="Remove file">×</button>
                    </div>
                </div>
            ` : ''}
        `;

        const mediaInput = mediaGroup.querySelector('.spot-media-input');
        const removeBtn = mediaGroup.querySelector('.remove-file-btn');
        const loopToggle = mediaGroup.querySelector('.media-loop');
        
        this.addControlListener(mediaInput, 'change', (e) => {
            this.handleMediaUpload(cell, e);
        });
        
        if (removeBtn) {
            this.addControlListener(removeBtn, 'click', () => {
                this.removeMedia(cell, mediaGroup);
            });
        }

        if (loopToggle) {
            this.addControlListener(loopToggle, 'change', () => {
                this.updateContent(cell, { loop: loopToggle.checked }, true);
                if (cell.content.media) {
                    cell.content.media.loop = loopToggle.checked;
                }
            });
        }

        return mediaGroup;
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
        // Actually remove the file completely
        this.updateContent(cell, {
            media: null,
            mediaType: null,
            mediaUrl: null,
            fileName: null,
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