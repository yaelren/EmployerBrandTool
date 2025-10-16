# Media Manager Asset Picker - Implementation Plan

## 🎯 Goal
Replace the broken upload system with a Media Manager asset picker that lets users select pre-uploaded files from Wix.

---

## 📋 Comprehensive Task List

### Phase 1: API Integration (30 minutes)

**Task 1.1:** Add listMediaFiles() method to WixPresetAPI.js
- Endpoint: `GET /site-media/v1/files`
- Use existing OAuth token
- Parse response and return file array
- Handle pagination if needed

**Task 1.2:** Test API connection
- Call method from console
- Verify files returned
- Check authentication works
- Log response structure

**Task 1.3:** Add error handling
- Catch network errors
- Handle empty results
- Add detailed console logging
- Provide user-friendly error messages

---

### Phase 2: UI Component (1 hour)

**Task 2.1:** Create MediaPickerModal.js component
- File location: `js/ui/MediaPickerModal.js`
- Constructor accepts wixAPI instance
- show() method returns Promise with selected file

**Task 2.2:** Implement modal HTML structure
- Modal overlay
- Header with title and close button
- Filters (search input + type dropdown)
- File grid container
- Footer with Cancel/Select buttons

**Task 2.3:** Add file grid rendering
- Grid layout with thumbnails
- Image thumbnails from CDN URLs
- Video icon placeholders
- File name and type labels
- Selection highlighting

**Task 2.4:** Implement search functionality
- Real-time search by filename
- Case-insensitive matching
- Update grid on input change

**Task 2.5:** Implement type filtering
- Dropdown: All / Images / Videos
- Filter files by mimeType
- Update grid on selection change

**Task 2.6:** Handle file selection
- Click to select file
- Highlight selected item
- Enable/disable Select button
- Store selectedFile reference

---

### Phase 3: Integration (30 minutes)

**Task 3.1:** Add browse button to background media
- Location: UIManager.js, Grid tab setup
- Button: "📁 Browse Media Manager"
- Position: Next to existing upload button
- Click handler opens MediaPickerModal

**Task 3.2:** Add browse button to cell media
- Location: ImageContentController.js
- Same button style and behavior
- Handle cell-specific selection

**Task 3.3:** Connect selected files to media display
- Use CDN URL from selected file
- Call existing setBackgroundMedia() for background
- Update cell content for cell media
- Preserve existing display logic

**Task 3.4:** Test integration
- Background media selection
- Cell media selection
- Media display correctness
- Multiple selections

---

### Phase 4: Styling (30 minutes)

**Task 4.1:** Create media-picker.css
- File location: `css/media-picker.css`
- Modal overlay styles
- Content box with rounded corners
- Responsive layout

**Task 4.2:** Style file grid
- CSS Grid layout
- Responsive columns (auto-fill)
- Thumbnail sizing and object-fit
- Gap spacing

**Task 4.3:** Add interactive states
- Hover effects on file items
- Selected state highlighting
- Button hover states
- Disabled button styles

**Task 4.4:** Add responsiveness
- Mobile-friendly modal
- Smaller grid on mobile
- Touch-friendly button sizes
- Proper scrolling

**Task 4.5:** Link CSS in HTML
- Add `<link>` tag to index.html
- Verify styles load correctly

---

### Phase 5: Cleanup & Documentation (30 minutes)

**Task 5.1:** Delete unnecessary documentation
- BUG_FIX_403_ERROR.md
- ENABLE_VIDEO_UPLOADS.md
- FINDING_MEDIA_MANAGER_PERMISSIONS.md
- GET_WIX_API_KEY.md
- VIDEO_UPLOAD_QUICK_FIX.md
- WIX_API_KEY_TYPES.md
- MEDIA_MANAGER_AUTH_LIMITATION.md
- MEDIA_MANAGER_NO_PERMISSIONS_NEEDED.md
- WIX_MEDIA_MANAGER_PERMISSIONS_SETUP.md
- QUICK_START_PERMISSIONS.md

**Task 5.2:** Update MEDIA_UPLOAD_SYSTEM.md
- Document new Media Manager picker approach
- Add usage instructions
- Remove obsolete sections about API keys

**Task 5.3:** Update PHASE_II_WIX_SETUP.md
- Add "Upload Media to Media Manager" section
- Document one-time setup workflow
- Add screenshots/instructions

**Task 5.4:** Test complete workflow
- Upload test media to Wix Media Manager manually
- Browse Media Manager in tool
- Select image → verify display
- Select video → verify display
- Save preset → verify CDN URLs
- Load preset → verify media loads

**Task 5.5:** Commit and push
- Commit message: "feat: Add Media Manager asset picker"
- Include all new files
- Remove deleted docs
- Push to origin

---

## 📂 File Structure

### Files to CREATE:
```
js/ui/MediaPickerModal.js       (NEW component)
css/media-picker.css            (NEW stylesheet)
IMPLEMENTATION_PLAN_MEDIA_PICKER.md (THIS FILE)
```

### Files to MODIFY:
```
js/api/WixPresetAPI.js          (add listMediaFiles method)
js/ui/UIManager.js              (add browse button for background)
js/controllers/ImageContentController.js (add browse button for cells)
index.html                      (link new CSS)
MEDIA_UPLOAD_SYSTEM.md          (update with new approach)
PHASE_II_WIX_SETUP.md           (add Media Manager upload instructions)
```

### Files to DELETE:
```
BUG_FIX_403_ERROR.md
ENABLE_VIDEO_UPLOADS.md
FINDING_MEDIA_MANAGER_PERMISSIONS.md
GET_WIX_API_KEY.md
VIDEO_UPLOAD_QUICK_FIX.md
WIX_API_KEY_TYPES.md
MEDIA_MANAGER_AUTH_LIMITATION.md
MEDIA_MANAGER_NO_PERMISSIONS_NEEDED.md
WIX_MEDIA_MANAGER_PERMISSIONS_SETUP.md
QUICK_START_PERMISSIONS.md
```

### Files to KEEP:
```
MEDIA_MANAGER_PICKER_DESIGN.md  (implementation reference)
MEDIA_GALLERY_FIELD_OPTION.md   (future enhancement reference)
MEDIA_UPLOAD_SYSTEM.md          (comprehensive overview)
PHASE_II_WIX_SETUP.md           (setup guide)
```

---

## 🔍 Detailed Implementation Specs

### API Method Signature
```javascript
/**
 * List files from Wix Media Manager
 * @param {string} folderId - Optional folder ID to filter by
 * @returns {Promise<Array<MediaFile>>} - Array of file objects
 */
async listMediaFiles(folderId = null) {
    // Implementation in Phase 1
}

// MediaFile object structure:
{
    id: string,
    fileUrl: string,           // CDN URL
    displayName: string,
    mimeType: string,          // e.g., "image/png", "video/mp4"
    sizeInBytes: number,
    createdDate: string,
    labels: string[]
}
```

### Component API
```javascript
// MediaPickerModal usage
const picker = new MediaPickerModal(wixAPI);
const selectedFile = await picker.show();
// selectedFile = MediaFile object or null if cancelled
```

### UI Dimensions
```
Modal width: 90% (max 800px)
Modal height: 80vh (max)
Grid item size: 150px (min)
Thumbnail size: 120px x 120px
Button padding: 10px 20px
Grid gap: 15px
```

### CSS Classes
```
.media-picker-modal           (container)
.media-picker-overlay         (backdrop)
.media-picker-content         (modal box)
.media-picker-header
.media-picker-filters
.media-picker-grid
.media-file-item
.media-file-item.selected
.video-icon
.file-icon
.media-picker-footer
.browse-media-btn             (trigger button)
```

---

## 🧪 Testing Checklist

### Unit Tests:
- [ ] API method returns file array
- [ ] API handles empty results
- [ ] API handles errors gracefully
- [ ] Modal renders correctly
- [ ] Search filters files
- [ ] Type dropdown filters files
- [ ] File selection updates state
- [ ] Select button enables/disables correctly

### Integration Tests:
- [ ] Browse button opens modal
- [ ] Modal displays files from API
- [ ] Selected file displays in tool (background)
- [ ] Selected file displays in tool (cell)
- [ ] CDN URL saved in preset data
- [ ] Preset saves successfully (no size error)
- [ ] Preset loads correctly
- [ ] Media loads from CDN on restore

### End-to-End Tests:
- [ ] Upload image to Wix Media Manager
- [ ] Upload video to Wix Media Manager
- [ ] Browse in tool shows both files
- [ ] Select image → displays in background
- [ ] Select video → displays in cell
- [ ] Save preset "test1"
- [ ] Reload page
- [ ] Load preset "test1"
- [ ] Background image loads ✅
- [ ] Cell video loads and plays ✅

---

## 📊 Success Metrics

### Before (Current Broken System):
```
Upload → 403 Error → Data URL fallback (266KB) → Save fails ❌
Success rate: ~40% (only tiny images work)
Video support: 0% ❌
```

### After (Media Manager Picker):
```
Browse → Select → CDN URL (80 bytes) → Save succeeds ✅
Success rate: 100% (all file sizes work)
Video support: 100% ✅
```

### Performance:
- Preset size: 99.97% smaller (CDN URLs vs data URLs)
- Save time: <1 second (no upload needed)
- Load time: <1 second (CDN is fast)
- Video support: Full working ✅

---

## 🚀 Rollout Strategy

### Step 1: Implement Core (Phase 1-2)
- API method + Modal component
- Test independently
- Verify API works with OAuth

### Step 2: Add UI Integration (Phase 3)
- Add browse buttons
- Connect to modal
- Test file selection flow

### Step 3: Polish (Phase 4)
- Add CSS styling
- Test responsiveness
- Fine-tune UX

### Step 4: Cleanup & Document (Phase 5)
- Remove old docs
- Update remaining docs
- Full end-to-end test
- Commit and push

### Step 5: User Onboarding
- Document "Upload to Media Manager" workflow
- Create quick start guide
- Test with real user workflow

---

## ⏱️ Time Estimates

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 | API Integration | 30 minutes |
| Phase 2 | UI Component | 1 hour |
| Phase 3 | Integration | 30 minutes |
| Phase 4 | Styling | 30 minutes |
| Phase 5 | Cleanup & Testing | 30 minutes |
| **Total** | | **3 hours** |

---

## 🎯 Next Steps

1. **Review this plan** - Make sure approach makes sense
2. **Start Phase 1** - Implement API method first
3. **Test API** - Verify it works before building UI
4. **Build incrementally** - Test each phase before moving on
5. **Commit frequently** - Don't lose progress

---

## 💡 Future Enhancements

After basic implementation works:

### Phase 6 (Optional):
- Folder navigation in modal
- File preview on hover
- Drag & drop file selection
- Recently used files section
- Custom file labels/tagging
- Bulk selection (multiple files)
- Upload from modal (if we solve auth)

---

## ✅ Ready to Start?

This plan is comprehensive and ready to execute. Let's begin with Phase 1! 🚀
