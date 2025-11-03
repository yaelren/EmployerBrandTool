# Multi-Page Presets System v3 - Documentation Index

**Last Updated**: 2025-01-03
**Status**: Design Complete - Ready for Implementation

---

## 📚 Documentation Overview

This folder contains complete architecture and implementation documentation for the Multi-Page Presets system with Content Slots and Flexible Export.

---

## 🗂️ Document Index

### **1. Architecture Design**
📄 **[content-slots-architecture-v3.md](content-slots-architecture-v3.md)**

**What's Inside:**
- Complete data architecture (page structure with contentSlots)
- Designer workflow (marking editable, configuring constraints)
- End-user workflow (locked layout, form filling, export)
- Export system architecture (image/video, per-page/bulk)
- Technical implementation details
- Code examples and class structures

**Read this first** to understand the overall system design.

---

### **2. Implementation Plan**
📄 **[implementation-tasks-v3.md](implementation-tasks-v3.md)**

**What's Inside:**
- 5 sprint breakdown (16-21 days total)
- Sprint 1: Content Slots Foundation (3-4 days)
- Sprint 2: Designer UI (3-4 days)
- Sprint 3: Wix Backend (2-3 days)
- Sprint 4: End-User Interface (4-5 days)
- Sprint 5: Export System (4-5 days)
- Detailed task lists with time estimates
- Testing strategy
- Success milestones

**Use this** as your implementation roadmap.

---

### **3. Wix CMS Schema**
📄 **[wix-cms-schema.md](wix-cms-schema.md)**

**What's Inside:**
- Collection structure: `MultiPagePresets`
- Field definitions (presetName, page1-5)
- Permissions settings
- Query patterns
- Example data

**Reference this** when setting up the Wix CMS collection.

---

### **4. Legacy Documentation**
📄 **[multi-page-architecture-v2.md](multi-page-architecture-v2.md)** - Original page-as-preset design
📄 **[sprint-1-v2-complete.md](sprint-1-v2-complete.md)** - Completed sprint 1 notes

**Historical context** - superseded by v3 architecture.

---

## 🎯 Quick Start Guide

### **For Designers Reading This:**

1. **Understand the System**
   - Read: [content-slots-architecture-v3.md](content-slots-architecture-v3.md) (Section: Designer Workflow)
   - Focus on: How to mark elements editable, configure constraints, set export formats

2. **Set Up Wix CMS**
   - Read: [wix-cms-schema.md](wix-cms-schema.md)
   - Action: Create `MultiPagePresets` collection in Wix Dashboard
   - Time: 10 minutes

3. **Ready to Implement**
   - Read: [implementation-tasks-v3.md](implementation-tasks-v3.md) (Sprint 1-2)
   - Start with: ContentSlotManager class
   - Estimated: 6-8 days for designer features

---

### **For Developers Reading This:**

1. **Architecture Overview**
   - Read: [content-slots-architecture-v3.md](content-slots-architecture-v3.md)
   - Understand: Content Slots, auto-capture bounds, constraint enforcement
   - Time: 30 minutes

2. **Implementation Plan**
   - Read: [implementation-tasks-v3.md](implementation-tasks-v3.md)
   - Follow: Sprint-by-sprint tasks
   - Total Time: 3-4 weeks

3. **Code Structure**
   ```
   js/
   ├─ parameters/
   │  ├─ ContentSlotManager.js          (NEW - Sprint 1)
   │  └─ WixMultiPagePresetAdapter.js   (NEW - Sprint 3)
   ├─ ui/
   │  ├─ ContentSlotConfigPanel.js      (NEW - Sprint 2)
   │  └─ ExportFormatSelector.js        (NEW - Sprint 2)
   ├─ enduser/
   │  ├─ EndUserController.js           (NEW - Sprint 4)
   │  ├─ FormGenerator.js               (NEW - Sprint 4)
   │  ├─ ContentSlotRenderer.js         (NEW - Sprint 4)
   │  ├─ PageExporter.js                (NEW - Sprint 5)
   │  └─ ExportConfigUI.js              (NEW - Sprint 5)
   ```

4. **Dependencies**
   - WixPresetAPI (already exists)
   - JSZip (already in use)
   - MediaRecorder API (browser native)

---

## 🔑 Key Concepts

### **Content Slots**
Constrained input areas that:
- Auto-capture bounding boxes from `cell.bounds`
- Enforce text constraints (char limits, font auto-fit)
- Enforce image constraints (crop modes, fit modes)
- Lock layout for end-users (no move/resize)

### **Flexible Export**
End-users can:
- Export individual pages (choose image or video per page)
- Export all as images (bulk PNG export)
- Export all as videos (bulk MP4 export)
- Export mixed formats (page 1 video, page 2 image, etc.)
- All exports upload to Wix CDN for cloud storage

### **Designer vs End-User**
- **Designer**: Full editing power, Grid Builder, mark editable fields
- **End-User**: Locked layout, form-based content editing, export only

---

## 🎓 Learning Path

### **Phase 1: Understanding** (1-2 hours)
1. Read architecture document
2. Review code examples
3. Understand data flow

### **Phase 2: Setup** (30 minutes)
1. Create Wix CMS collection
2. Review existing codebase
3. Identify integration points

### **Phase 3: Implementation** (3-4 weeks)
1. Sprint 1: Content Slots Foundation
2. Sprint 2: Designer UI
3. Sprint 3: Wix Backend
4. Sprint 4: End-User Interface
5. Sprint 5: Export System

### **Phase 4: Testing** (3-5 days)
1. Unit tests
2. Integration tests
3. End-to-end scenarios
4. Browser compatibility

---

## ✅ Implementation Checklist

### **Before Starting**
- [ ] Read [content-slots-architecture-v3.md](content-slots-architecture-v3.md)
- [ ] Read [implementation-tasks-v3.md](implementation-tasks-v3.md)
- [ ] Create Wix CMS collection (see [wix-cms-schema.md](wix-cms-schema.md))
- [ ] Verify WixPresetAPI credentials
- [ ] Set up local development environment

### **Sprint 1: Content Slots Foundation**
- [ ] Create ContentSlotManager class
- [ ] Update PresetPageManager with contentSlots
- [ ] Test bounding box capture

### **Sprint 2: Designer UI**
- [ ] Modify SavePageModal for editable marking
- [ ] Create ContentSlotConfigPanel
- [ ] Create ExportFormatSelector
- [ ] Test designer workflow

### **Sprint 3: Wix Backend**
- [ ] Create WixMultiPagePresetAdapter
- [ ] Connect PresetPageManager to Wix
- [ ] Test save/load roundtrip

### **Sprint 4: End-User Interface**
- [ ] Create enduser.html
- [ ] Build EndUserController
- [ ] Build FormGenerator
- [ ] Build ContentSlotRenderer
- [ ] Test locked layout rendering

### **Sprint 5: Export System**
- [ ] Build PageExporter with Wix CDN integration
- [ ] Build ExportConfigUI
- [ ] Implement bulk export options
- [ ] Test export workflows

---

## 🚀 Ready to Start?

1. **Create Wix CMS collection** → [wix-cms-schema.md](wix-cms-schema.md)
2. **Begin Sprint 1** → [implementation-tasks-v3.md](implementation-tasks-v3.md#sprint-1-content-slots-foundation-3-4-days)
3. **Reference architecture** → [content-slots-architecture-v3.md](content-slots-architecture-v3.md)

---

## 📞 Questions?

- Architecture questions → See [content-slots-architecture-v3.md](content-slots-architecture-v3.md)
- Implementation questions → See [implementation-tasks-v3.md](implementation-tasks-v3.md)
- Wix setup questions → See [wix-cms-schema.md](wix-cms-schema.md)

---

**Status**: Documentation Complete ✅
**Next Action**: Create Wix CMS Collection → Begin Sprint 1
