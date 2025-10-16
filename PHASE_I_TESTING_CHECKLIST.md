# Phase I Testing Checklist

Complete testing guide before moving to Phase II (Wix Data Collections).

---

## ✅ Already Tested

### 1. OAuth Authentication
- [x] Token generation works
- [x] Bearer token format correct
- [x] 4-hour expiry calculated
- [x] Tokens saved to localStorage
- [x] Console logs showing success

**Verified in Session:**
```
✅ Visitor token generated successfully
   → Token type: Bearer
   → Expires in: 14400 seconds (4 hours)
   → Token expiry: 10/16/2025, 7:53:27 PM
💾 Tokens saved to localStorage
```

### 2. Local Save (Download)
- [x] JSON file downloads correctly
- [x] Filename sanitized properly
- [x] File contains complete preset data
- [x] Success notification displays
- [x] Input field clears after save

**Verified:** `test_local_download.json` (5.4KB)

### 3. Local Load (Upload)
- [x] File picker accepts .json files
- [x] Selected filename displays
- [x] JSON parses correctly
- [x] Preset deserializes successfully
- [x] Canvas restores correctly ("EMPLOYEE SPOTLIGHT 2024")
- [x] Success notification displays

---

## ⏳ Needs Testing

### 4. OAuth Token Persistence
**Goal:** Verify tokens survive page reload

**Steps:**
1. Open browser DevTools → Application → Local Storage
2. Verify these keys exist:
   - `wix_access_token`
   - `wix_refresh_token`
   - `wix_token_expires_at`
3. Refresh page (F5)
4. Check console for: `📦 Loaded existing tokens from localStorage`
5. Verify no new token generation (should use existing)

**Expected Result:**
```
📦 Loaded existing tokens from localStorage
   → Expiry: [saved expiry time]
✅ Wix REST API initialized successfully
```

**Test Status:** ⏳ Not yet tested

---

### 5. OAuth Token Auto-Refresh
**Goal:** Verify automatic refresh when token expires

**Option A: Manual Expiry Simulation**
1. Open DevTools → Console
2. Run:
```javascript
// Set token expiry to 2 minutes from now (past the 5-min buffer)
const twoMinutesFromNow = Date.now() + (2 * 60 * 1000);
localStorage.setItem('wix_token_expires_at', twoMinutesFromNow.toString());
console.log('Token expiry set to:', new Date(twoMinutesFromNow).toLocaleString());
```
3. Refresh page
4. Check console for refresh logs

**Expected Result:**
```
⚠️ Token expired or expiring soon, refreshing...
🔄 Refreshing access token...
✅ Token refreshed successfully
   → New expiry: [new time]
```

**Option B: Wait for Natural Expiry**
- Token expires in: 4 hours from generation
- Come back in 3 hours 56 minutes
- Trigger any API call
- Should auto-refresh

**Test Status:** ⏳ Not yet tested

---

### 6. Cloud Save with Background Image
**Goal:** Verify background image saves correctly

**Steps:**
1. Click "Background Media" button
2. Upload a background image
3. Verify image displays on canvas
4. Navigate to Presets tab
5. Enter preset name: "Test Background Image"
6. Click "☁️ Save to Cloud"
7. Check console logs

**Expected Logs:**
```
📸 SAVE: Serializing background state...
   → Has image element: true
   → Image dimensions: 1920 x 1080
📤 SAVE: Uploading background image...
   → Image element type: HTMLImageElement
⚠️ Wix upload failed, falling back to data URL: [error]
⚠️ Using data URL fallback (217.45 KB)
💾 Saving preset to localStorage: "Test Background Image"
✅ Preset saved to cloud: "Test Background Image"
```

**Verify:**
- Preset appears in dropdown
- Can load preset and background image displays

**Test Status:** ⏳ Not yet tested

---

### 7. Cloud Save with Cell Images
**Goal:** Verify cell images save correctly

**Steps:**
1. Navigate to Grid Builder
2. Enter text: "HELLO\nWORLD"
3. Click "Build Grid"
4. Navigate to Grid Editor
5. Click on a content cell
6. Upload image to cell
7. Navigate to Presets tab
8. Enter preset name: "Test Cell Images"
9. Click "☁️ Save to Cloud"

**Expected Logs:**
```
📋 SAVE: Checking [X] cells for images...
📤 SAVE: Uploading cell image 1...
   → Cell index: 2
   → Image dimensions: 800 x 600
⚠️ Using data URL fallback (103.2 KB)
✅ SAVE: Uploaded 1 cell image(s)
```

**Verify:**
- Preset saves successfully
- Can load preset and cell images display

**Test Status:** ⏳ Not yet tested

---

### 8. localStorage Quota Handling
**Goal:** Verify error handling when storage is full

**Steps:**
1. Save multiple large presets with images
2. Try to save 4th or 5th preset
3. Check for quota error

**Expected Logs:**
```
❌ Failed to save preset: QuotaExceededError
💾 localStorage is full!
   → Current presets: 4
   → Consider deleting old presets or migrating to Wix REST API
```

**Expected UI:**
Error notification with helpful message

**Reference:** [STORAGE_QUOTA_FIX.md](STORAGE_QUOTA_FIX.md)

**Test Status:** ⏳ Not yet tested (previously encountered, fix implemented)

---

### 9. Video Handling (Expected Limitation)
**Goal:** Verify videos are skipped with proper warnings

**Steps:**
1. Navigate to Grid Editor
2. Click on a content cell
3. Upload a video (MP4) to cell
4. Video should display in preview
5. Navigate to Presets tab
6. Try to save preset

**Expected Logs:**
```
⚠️ SAVE: Cell content-X has video (will be skipped)
⚠️ SAVE: Skipped 1 video(s) - videos cannot be saved in presets yet
```

**Expected Behavior:**
- Preset saves successfully
- Video cell excluded from save
- When loaded, cell is empty (no video)

**Test Status:** ⏳ Not yet tested

---

### 10. Media Manager Upload (Requires Wix Setup)
**Goal:** Test actual Wix CDN upload

**Prerequisites:**
- Wix project properly configured
- Media Manager permissions enabled
- Valid OAuth token with upload rights

**Steps:**
1. Ensure OAuth token is valid
2. Upload background image
3. Save preset to cloud
4. Check console logs for upload attempt

**Expected Success:**
```
📤 Uploading image to Wix Media Manager: bg-test-1760617327471.png
   → Blob size: 217.45 KB
   → Upload URL generated
   → File ID: abc123-def456-ghi789
✅ Image uploaded to Wix CDN
   → CDN URL: https://static.wixstatic.com/media/abc123.png
```

**Expected Fallback (Current Behavior):**
```
📤 Uploading image to Wix Media Manager: bg-test-1760617327471.png
❌ Wix upload failed, falling back to data URL: Error: [reason]
⚠️ Using data URL fallback (217.45 KB)
```

**Test Status:** ⏳ Not yet tested (requires Wix project setup)

---

### 11. End-to-End: Complete Workflow
**Goal:** Full preset save/load cycle with all features

**Steps:**
1. **Setup:**
   - Upload background image
   - Build grid: "AWESOME\nPRESET"
   - Upload images to 2-3 content cells
   - Customize colors, fonts, padding

2. **Save Locally:**
   - Name: "Complete Test Local"
   - Click "📁 Save Locally"
   - Verify download

3. **Save to Cloud:**
   - Name: "Complete Test Cloud"
   - Click "☁️ Save to Cloud"
   - Verify appears in dropdown

4. **Clear Canvas:**
   - Refresh page
   - Verify canvas is empty/default

5. **Load from Cloud:**
   - Select "Complete Test Cloud" from dropdown
   - Click "📥 Load"
   - Verify everything restores:
     - Background image ✓
     - Grid layout ✓
     - Main text ✓
     - Cell images ✓
     - Colors/fonts ✓

6. **Load from Local:**
   - Refresh page again
   - Click "📂 Choose File"
   - Upload the downloaded JSON
   - Verify everything restores identically

**Test Status:** ⏳ Not yet tested

---

### 12. Edge Cases

#### A. Empty Preset (No Images)
- Save preset with no background or cell images
- Should save only text/layout
- Should load successfully

**Test Status:** ⏳ Not yet tested

#### B. Very Large Images
- Upload 4K background image (large file)
- Try to save
- Should hit quota or fallback gracefully

**Test Status:** ⏳ Not yet tested

#### C. Special Characters in Preset Name
- Try names with: spaces, apostrophes, quotes, emojis
- Example: "John's Preset 2024 🎨"
- Should sanitize filename for download

**Test Status:** ⏳ Not yet tested

#### D. Duplicate Preset Names
- Save preset: "Test"
- Save another preset: "Test"
- Should overwrite or create Test(1)?

**Test Status:** ⏳ Not yet tested

#### E. Corrupted JSON File
- Edit downloaded JSON to break syntax
- Try to upload
- Should show error message

**Test Status:** ⏳ Not yet tested

---

## 📋 Quick Test Priority

### High Priority (Before Phase II)
1. ✅ OAuth token persistence (page reload)
2. ✅ Cloud save with background image
3. ✅ Cloud save with cell images
4. ✅ End-to-end complete workflow
5. ✅ Video handling (skip with warning)

### Medium Priority (Can Test During Phase II)
6. OAuth token auto-refresh
7. localStorage quota handling
8. Empty preset (no images)
9. Special characters in names

### Low Priority (Edge Cases)
10. Very large images
11. Duplicate preset names
12. Corrupted JSON file
13. Media Manager actual upload (needs Wix setup)

---

## 🧪 Testing Console Commands

### Check localStorage Tokens
```javascript
console.log('Access Token:', localStorage.getItem('wix_access_token'));
console.log('Refresh Token:', localStorage.getItem('wix_refresh_token'));
const expiry = localStorage.getItem('wix_token_expires_at');
console.log('Expiry:', new Date(parseInt(expiry)).toLocaleString());
console.log('Time until expiry:', (parseInt(expiry) - Date.now()) / 1000 / 60, 'minutes');
```

### Check Saved Presets
```javascript
const presets = JSON.parse(localStorage.getItem('wix_presets') || '[]');
console.log('Preset count:', presets.length);
presets.forEach((p, i) => {
    const size = JSON.stringify(p).length;
    console.log(`${i + 1}. ${p.name} - ${(size / 1024).toFixed(2)} KB`);
    console.log('   Has background:', !!p.settings.background.imageURL);
});
```

### Calculate localStorage Usage
```javascript
let total = 0;
for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
    }
}
console.log('Total localStorage usage:', (total / 1024).toFixed(2), 'KB');
console.log('Estimated limit: ~5-10 MB');
console.log('Usage percentage:', (total / (5 * 1024 * 1024) * 100).toFixed(1), '%');
```

### Force Token Refresh Test
```javascript
// Set token to expire in 2 minutes (past 5-min buffer)
const twoMin = Date.now() + (2 * 60 * 1000);
localStorage.setItem('wix_token_expires_at', twoMin.toString());
console.log('Token expiry set to:', new Date(twoMin).toLocaleString());
console.log('Refresh page to trigger auto-refresh');
```

---

## 📊 Test Results Template

Use this template to document test results:

```markdown
### Test: [Test Name]
**Date:** [Date]
**Browser:** [Chrome/Firefox/Safari]
**Result:** ✅ Pass / ❌ Fail / ⚠️ Partial

**Steps:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Actual Result:**
[What actually happened]

**Console Logs:**
```
[Relevant logs]
```

**Screenshots:**
[If applicable]

**Issues Found:**
[Any bugs or unexpected behavior]

**Notes:**
[Additional observations]
```

---

## ✅ Completion Criteria

Phase I is ready for Phase II when:

- [x] OAuth token generation working
- [ ] Token persistence across reloads verified
- [ ] Background images save/load correctly
- [ ] Cell images save/load correctly
- [ ] End-to-end workflow tested
- [ ] Video skip warning confirmed
- [ ] Documentation complete ✅
- [ ] No critical bugs found

**Current Status:** 4/8 complete (50%)

**Estimated Testing Time:** 30-45 minutes for high priority tests

---

## 🚀 Next Steps After Testing

Once Phase I testing is complete:

1. **Document Test Results**
   - Add results to this file
   - Note any bugs found
   - Create bug fix tickets if needed

2. **Begin Phase II Implementation**
   - Wix Data Collections save/load
   - Cross-device preset sync
   - Production CDN uploads

3. **Phase II Testing**
   - Test with real Wix backend
   - Verify cross-device sync
   - Performance testing with large datasets

---

## 📝 Notes

- All OAuth tests use Client ID: `be6b179c-58a3-457e-aada-b37e3d245348`
- Dev server running on: `http://127.0.0.1:3000/`
- Tokens expire after 4 hours (14,400 seconds)
- localStorage limit varies by browser (~5-10MB)
- Data URLs are ~33% larger than original images

---

**Ready to begin testing!** 🧪
