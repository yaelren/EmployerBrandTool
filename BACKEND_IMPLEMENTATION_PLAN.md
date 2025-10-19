# Backend Implementation Plan - Media Manager Integration

## 🎯 Project Goal

Build a serverless backend + frontend UI to replicate Wix Media Manager functionality in your tool, enabling:
- Browse all media files with thumbnails
- Upload new files from desktop
- Get CDN URLs for use in presets
- Keep preset sizes tiny (URLs instead of data URLs)

---

## ❓ Pre-Implementation Questions

Please answer these questions so we build exactly what you need:

### 1. **Deployment Platform**
- ✅ **Confirmed:** Vercel
- Do you have a Vercel account? (Yes/No)
- Is this tool already deployed on Vercel, or will this be the first deployment?

### 2. **Repository Structure**
Current structure:
```
Chatooly-EmployerBrandTool/
├── index.html
├── js/
├── css/
└── ...
```

**Question:** Should we create the backend in the same repo or separate?

**Option A: Same Repo (Recommended)**
```
Chatooly-EmployerBrandTool/
├── index.html
├── js/
├── css/
├── api/                    ← NEW: Serverless functions
│   ├── media/
│   │   ├── list.js         ← List media files
│   │   └── upload.js       ← Upload new files
└── vercel.json             ← NEW: Vercel config
```
- ✅ Pros: Single deployment, easier to manage
- ⚠️ Cons: None really

**Option B: Separate Backend Repo**
```
Chatooly-EmployerBrandTool/          (Frontend)
Chatooly-Backend/                     (Backend API)
```
- ✅ Pros: Cleaner separation
- ⚠️ Cons: Two deployments, CORS config needed

**Your choice:** A or B?

### 3. **Media Manager UI Design**

**Question:** What should the Media Manager picker look like?

**Option A: Modal Overlay (Like Current Browse Button)**
```
┌─────────────────────────────────────────┐
│  Browse Media Manager            [✕]    │
├─────────────────────────────────────────┤
│  [Search...] [All ▾] [Upload New]      │
├─────────────────────────────────────────┤
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐             │
│  │img│ │img│ │img│ │img│             │
│  └───┘ └───┘ └───┘ └───┘             │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐             │
│  │img│ │img│ │img│ │img│             │
│  └───┘ └───┘ └───┘ └───┘             │
│                                         │
│         [Cancel]  [Select]              │
└─────────────────────────────────────────┘
```
- ✅ We already have MediaPickerModal.js built
- ✅ Just needs backend connection
- ✅ Familiar UX

**Option B: Sidebar Panel**
```
┌────────┬──────────────────────────────┐
│        │                              │
│ Media  │  Your Canvas                 │
│ Panel  │                              │
│        │                              │
│ [Search│                              │
│        │                              │
│ ┌───┐  │                              │
│ │img│  │                              │
│ └───┘  │                              │
│ ┌───┐  │                              │
│ │img│  │                              │
│ └───┘  │                              │
│        │                              │
└────────┴──────────────────────────────┘
```
- ✅ Always visible
- ✅ Drag & drop possible
- ⚠️ Takes up screen space

**Option C: Dedicated Tab**
```
[Canvas] [Grid] [Main Text] [Media Manager] ← NEW TAB
                            ─────────────────
┌─────────────────────────────────────────┐
│  [Search...] [All ▾] [Upload New]       │
├─────────────────────────────────────────┤
│  Grid of images with thumbnails...      │
└─────────────────────────────────────────┘
```
- ✅ Doesn't overlap canvas
- ✅ Full screen space for browsing
- ⚠️ Requires tab switching

**Your choice:** A, B, or C?

### 4. **Upload Functionality**

**Question:** Where should users be able to upload files?

**Option A: Only in Media Manager Picker**
- Click "Browse Media Manager" → Modal opens
- Click "Upload New" button in modal
- Upload happens, new file appears in grid

**Option B: Both Picker AND File Upload Controls**
- Keep existing "Choose File" buttons
- Upload through those buttons → goes to Media Manager → returns CDN URL
- Also can upload through picker

**Option C: Replace All File Uploads with Media Manager**
- Remove all "Choose File" buttons
- Everything goes through Media Manager picker
- Cleaner, single workflow

**Your choice:** A, B, or C?

### 5. **Media Organization**

**Question:** Do you want folder support?

Wix Media Manager has folders. Should we:

**Option A: Show All Files (Flat)**
- Ignore folders, show everything in one grid
- ✅ Simpler
- ⚠️ Can get messy with many files

**Option B: Support Folders**
- Show folder structure
- Click folder → see files inside
- Breadcrumb navigation
- ✅ Better organization
- ⚠️ More complex UI

**Your choice:** A or B?

### 6. **File Types**

**Question:** What file types should the picker show?

**Option A: Images Only**
- jpg, jpeg, png, gif, webp
- ✅ Simpler
- ⚠️ No videos

**Option B: Images + Videos**
- jpg, jpeg, png, gif, webp, mp4, webm, mov
- ✅ Full media support
- ⚠️ Larger thumbnails, longer load times

**Option C: All Media Types**
- Images, videos, PDFs, SVGs, etc.
- ✅ Maximum flexibility
- ⚠️ More complex filtering needed

**Your choice:** A, B, or C?

### 7. **Search and Filtering**

**Question:** What search/filter capabilities do you want?

**Available filters:**
- [ ] Search by filename
- [ ] Filter by type (image/video)
- [ ] Filter by size
- [ ] Filter by upload date
- [ ] Sort by (name, date, size)
- [ ] Folder navigation

**Check all that apply, or just say "keep it simple"**

### 8. **Thumbnail Display**

**Question:** How should thumbnails look?

**Option A: Grid with Names**
```
┌─────────┐  ┌─────────┐
│  [img]  │  │  [img]  │
│ img.jpg │  │ bg.png  │
│ 250 KB  │  │ 1.2 MB  │
└─────────┘  └─────────┘
```

**Option B: Grid Only (No Text)**
```
┌────┐ ┌────┐ ┌────┐
│img │ │img │ │img │
└────┘ └────┘ └────┘
```

**Option C: List View**
```
📷 my-image.jpg      250 KB    [Select]
📷 background.png    1.2 MB    [Select]
🎥 video.mp4         5.3 MB    [Select]
```

**Your choice:** A, B, or C?

### 9. **Loading State**

**Question:** How should we handle loading?

When opening picker or uploading:

**Option A: Skeleton Loaders**
```
┌────┐ ┌────┐ ┌────┐
│ ░░ │ │ ░░ │ │ ░░ │
└────┘ └────┘ └────┘
(Animated placeholder)
```

**Option B: Spinner**
```
     ⏳ Loading media...
```

**Option C: Progress Bar**
```
▓▓▓▓▓▓▓▓░░░░  Loading... 65%
```

**Your choice:** A, B, or C?

### 10. **Error Handling**

**Question:** What if Media Manager is empty or has errors?

**Empty state:**
```
┌─────────────────────────────────────┐
│                                     │
│        📁 No media files yet        │
│                                     │
│      [Upload Your First File]       │
│                                     │
└─────────────────────────────────────┘
```

**Network error:**
```
❌ Failed to load media
[Retry]
```

**Upload error:**
```
❌ Upload failed: File too large
[Try Again]
```

**Acceptable? Or want different messaging?**

### 11. **Performance Considerations**

**Question:** How many media files do you typically have?

- < 50 files: Load all at once
- 50-200 files: Load all, might be slow
- 200+ files: Need pagination or lazy loading

**Your answer:** Approximately how many files?

### 12. **Cell Media Integration**

**Question:** Should the picker work for BOTH background and cell media?

Currently you have:
- Background media section (with our test CDN URL field)
- Cell media in grid (per-cell upload)

**Option A: Universal Picker**
- Same picker UI works everywhere
- Click "Browse" in background → picker opens → select → loads as background
- Click "Browse" in cell → picker opens → select → loads in that cell
- ✅ Consistent experience

**Option B: Different UIs**
- Background media: Full picker modal
- Cell media: Simplified quick-select
- ⚠️ More complex

**Your choice:** A or B?

### 13. **Backwards Compatibility**

**Question:** What about existing presets with data URLs?

**Option A: Support Both**
- New presets: Save CDN URLs
- Old presets: Load data URLs (legacy support)
- ✅ Nothing breaks

**Option B: Migrate Everything**
- Convert old data URLs to uploads on load
- Everything becomes CDN URLs
- ⚠️ One-time migration needed

**Your choice:** A or B?

### 14. **Environment Variables Security**

**Question:** How should we handle API keys?

In Vercel, we'll store:
- `WIX_API_KEY` (your IST token)
- `WIX_SITE_ID` (your site ID)

**These will be server-side only** (secure). Frontend will only call our API endpoints.

**Acceptable? Any concerns?**

### 15. **Testing Strategy**

**Question:** What's your preferred testing workflow?

**Option A: Test in Production**
- Deploy to Vercel
- Test with real data
- ✅ Simple
- ⚠️ Real consequences if bugs

**Option B: Local Dev First**
- Run locally with `vercel dev`
- Test thoroughly
- Then deploy
- ✅ Safer

**Option C: Separate Staging**
- Deploy to staging environment first
- Test fully
- Then promote to production
- ✅ Most professional
- ⚠️ More complex setup

**Your choice:** A, B, or C?

---

## 📋 Quick Decision Template

Copy and fill this out with your answers:

```
1. Vercel account: [Yes/No]
2. Repository structure: [A or B]
3. UI Design: [A, B, or C]
4. Upload locations: [A, B, or C]
5. Folder support: [A or B]
6. File types: [A, B, or C]
7. Filters needed: [List or "keep it simple"]
8. Thumbnail style: [A, B, or C]
9. Loading state: [A, B, or C]
10. Error handling: [Looks good / Want changes]
11. Typical file count: [Number]
12. Picker scope: [A or B]
13. Legacy presets: [A or B]
14. API key security: [Looks good / Have concerns]
15. Testing approach: [A, B, or C]
```

---

## 🚀 Once You Answer...

I'll create:
1. **Detailed implementation spec** based on your answers
2. **Complete serverless backend code** (Vercel functions)
3. **Updated frontend code** (Media picker UI)
4. **Deployment instructions** (step-by-step)
5. **Environment variable setup guide**
6. **Testing checklist**

**Estimated timeline after decisions:**
- Backend functions: 1 hour
- Frontend UI updates: 1-2 hours
- Testing & debugging: 1 hour
- **Total: 3-4 hours of work**

---

## 💡 My Recommendations (If You Want to Move Fast)

Based on your "just like a copy of the media manager in my frontend" comment:

```
1. Vercel account: Yes (you said you'll deploy)
2. Repository structure: A (same repo, easier)
3. UI Design: A (modal overlay - already built)
4. Upload locations: B (both picker and existing buttons)
5. Folder support: A (flat, simpler to start)
6. File types: B (images + videos)
7. Filters: Keep it simple (just search by name)
8. Thumbnail style: A (grid with names and sizes)
9. Loading state: A (skeleton loaders, looks professional)
10. Error handling: Looks good
11. File count: ? (you tell me)
12. Picker scope: A (universal, works everywhere)
13. Legacy presets: A (support both)
14. API security: Looks good
15. Testing: B (local dev first, safer)
```

**Sound good? Or want to customize?**

Just answer the questions and I'll start building! 🚀
