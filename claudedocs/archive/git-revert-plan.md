# Git Revert Plan - Multi-Page Sprint 1 Cleanup

## Overview

We need to revert the Sprint 1 "multi-page in designer view" implementation and prepare for the new "page-as-preset" architecture.

---

## Files to Remove (Created in Sprint 1)

These files were created for the old architecture and should be deleted:

```bash
# JavaScript files
js/parameters/PresetSetManager.js
js/ui/PageNavigationUI.js

# CSS files
css/page-navigation.css

# Test files
tests/page-navigation-debug.spec.js
tests/page-navigation-interaction.spec.js
tests/quick-debug.spec.js
tests/console-errors.spec.js
tests/modal-debug.spec.js
tests/page-content-bug.spec.js
tests/canvas-layout-debug.spec.js
tests/add-page-full-test.spec.js

# Documentation (outdated)
claudedocs/sprint-1-implementation-summary.md
claudedocs/page-navigation-user-guide.md
claudedocs/bug-fixes-summary.md
claudedocs/implementation-tasks.md (old version)
claudedocs/multi-role-system-design.md (old version)
```

---

## Files to Revert (Modified in Sprint 1)

These files were modified and should be restored to their pre-Sprint 1 state:

```bash
index.html                    # Remove page navigation CSS/JS links
js/app.js                    # Remove PresetSetManager initialization
js/ui/PresetUIComponent.js   # Revert any multi-page changes (if any)
```

---

## Git Commands

### Option 1: Manual File Removal (Recommended)

```bash
# Remove created files
rm js/parameters/PresetSetManager.js
rm js/ui/PageNavigationUI.js
rm css/page-navigation.css

# Remove test files
rm tests/page-navigation-debug.spec.js
rm tests/page-navigation-interaction.spec.js
rm tests/quick-debug.spec.js
rm tests/console-errors.spec.js
rm tests/modal-debug.spec.js
rm tests/page-content-bug.spec.js
rm tests/canvas-layout-debug.spec.js
rm tests/add-page-full-test.spec.js

# Remove test screenshots
rm -rf tests/screenshots/*.png

# Remove outdated docs
rm claudedocs/sprint-1-implementation-summary.md
rm claudedocs/page-navigation-user-guide.md
rm claudedocs/bug-fixes-summary.md
rm claudedocs/implementation-tasks.md
rm claudedocs/multi-role-system-design.md

# Revert modified files to commit before Sprint 1
# (Find the commit hash before we started Sprint 1)
git checkout da7c14b -- index.html
git checkout da7c14b -- js/app.js
git checkout da7c14b -- js/ui/PresetUIComponent.js

# Stage all deletions and reverts
git add -A

# Commit the cleanup
git commit -m "revert: Remove Sprint 1 multi-page implementation

Remove page-as-switching architecture in favor of page-as-preset model.

Removed files:
- PresetSetManager.js (page switching logic)
- PageNavigationUI.js (bottom navigation bar)
- page-navigation.css
- All Sprint 1 test files
- Outdated documentation

Reverted files:
- index.html (removed page navigation links)
- app.js (removed PresetSetManager initialization)
- PresetUIComponent.js (reverted to original state)

Reason: Pivot to simpler page-as-preset architecture where designer
saves canvas as page in preset, rather than switching pages live."
```

### Option 2: Git Restore (Alternative)

```bash
# Find commit before Sprint 1 started
git log --oneline --all | grep "docs: Add comprehensive multi-role system design"
# Output: da7c14b

# Restore specific files to that commit
git restore --source=da7c14b index.html
git restore --source=da7c14b js/app.js
git restore --source=da7c14b js/ui/PresetUIComponent.js

# Remove new files manually (git restore doesn't delete untracked files)
rm js/parameters/PresetSetManager.js
rm js/ui/PageNavigationUI.js
rm css/page-navigation.css
# ... etc (see Option 1 for full list)

# Commit
git add -A
git commit -m "revert: Remove Sprint 1 multi-page implementation"
```

---

## Verification Checklist

After running git commands, verify:

- [ ] `js/parameters/PresetSetManager.js` - File deleted
- [ ] `js/ui/PageNavigationUI.js` - File deleted
- [ ] `css/page-navigation.css` - File deleted
- [ ] `index.html` - No references to page-navigation.css or PageNavigationUI.js
- [ ] `js/app.js` - No PresetSetManager or PageNavigationUI initialization
- [ ] `tests/` - Only core test files remain (no Sprint 1 tests)
- [ ] `claudedocs/` - Old docs removed, new v2 docs present
- [ ] App runs without errors: `npm run dev`
- [ ] Browser console shows no missing file errors

---

## What to Keep

These files should **NOT** be removed (useful for v2):

```bash
# Core system files (keep)
js/parameters/PresetManager.js      ✅ Keep (reuse serialization)
js/ui/PresetUIComponent.js          ✅ Keep (will modify for v2)
js/ui/MediaPickerModal.js           ✅ Keep (reuse modal patterns)
css/media-picker.css                ✅ Keep (reuse modal styling)

# New v2 documentation (keep)
claudedocs/multi-page-architecture-v2.md   ✅ Keep
claudedocs/wix-cms-schema.md               ✅ Keep
claudedocs/implementation-tasks-v2.md      ✅ Keep
claudedocs/git-revert-plan.md              ✅ Keep (this file)

# Existing app files (keep)
js/app.js                           ✅ Keep (but revert changes)
index.html                          ✅ Keep (but revert changes)
All other JS modules                ✅ Keep
All other CSS files                 ✅ Keep
```

---

## Clean State Verification

After cleanup, the project should:

1. **Run without errors**:
   ```bash
   npm run dev
   # Open http://localhost:3000
   # Check browser console - no 404 errors
   ```

2. **Have clean git status**:
   ```bash
   git status
   # Should show: "Your branch is ahead of 'origin/main' by 1 commit"
   # (The revert commit)
   ```

3. **Designer view works normally**:
   - Grid Builder tab works
   - Text controls work
   - Background manager works
   - Preset save/load works (single-page presets)
   - No page navigation at bottom
   - No PresetSetManager errors in console

4. **Ready for v2 implementation**:
   - PresetManager.js available for reuse
   - PresetUIComponent.js ready to modify
   - Clean slate for new components

---

## Files to Create Next (Sprint 1 v2)

After cleanup, we'll create these NEW files:

```bash
# Sprint 1 v2
js/parameters/PresetPageManager.js     # Page save/load logic
js/ui/SavePageModal.js                 # Editable fields config modal
css/save-page-modal.css                # Modal styling

# Sprint 2 v2
js/ui/LoadPageModal.js                 # Load page from preset modal
css/load-page-modal.css                # Modal styling

# Sprint 3 v2
enduser.html                           # End-user interface
js/enduser/EndUserController.js        # End-user logic
js/enduser/FormGenerator.js            # Form generation
js/enduser/PageNavigationUI.js         # Simplified nav for end-user
js/enduser-app.js                      # Entry point
css/enduser.css                        # End-user styling

# Sprint 4 v2
js/enduser/PageExporter.js             # Export to ZIP
```

---

## Execution Steps

### Step 1: Backup (Optional but Recommended)
```bash
# Create a branch for Sprint 1 attempt (for reference)
git branch sprint-1-attempt-backup
```

### Step 2: Run Cleanup
```bash
# Execute removal commands from "Option 1" above
# OR use "Option 2" git restore commands
```

### Step 3: Verify
```bash
# Run verification checklist above
npm run dev
# Open http://localhost:3000
# Check console for errors
```

### Step 4: Commit
```bash
git add -A
git commit -m "revert: Remove Sprint 1 multi-page implementation

Pivot to page-as-preset architecture"
```

### Step 5: Clean Documentation Folder
```bash
ls -la claudedocs/
# Should only have:
# - multi-page-architecture-v2.md
# - wix-cms-schema.md
# - implementation-tasks-v2.md
# - git-revert-plan.md
```

---

## Post-Cleanup Status

After cleanup:
- ✅ No Sprint 1 files remaining
- ✅ Designer view works (single-page)
- ✅ Clean git state
- ✅ Ready for Sprint 1 v2 (page-as-preset)
- ✅ Documentation updated to v2
- ✅ No jank or bugs from old implementation

---

**Status**: Ready to execute
**Last Updated**: 2025-10-22
**Estimated Time**: 15 minutes
