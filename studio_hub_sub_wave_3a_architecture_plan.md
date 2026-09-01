# 📐 STUDIO HUB — SUB-WAVE 3A ARCHITECTURE & EXECUTION PLAN
**Document Purpose:** Architectural blueprint and forensic mapping for Sub-Wave 3A: Asset & Brand Kit Lifecycle (Asset Delete, Asset Rename, and Brand Kit Logo Upload).  
**Phase:** PHASE 16 — SUB-WAVE 3A (ASSET & BRAND KIT LIFECYCLE)  
**Date:** 2026-08-30  
**Status:** **ARCHITECTURAL BLUEPRINT (ZERO PRODUCTION CODE MODIFIED)**  
**Artifact File:** `studio_hub_sub_wave_3a_architecture_plan.md`

---

## 1. 🔍 FORENSIC TRACE: CURRENT IMPLEMENTATION GAPS

We deeply traced the Asset and Brand Kit lifecycles across the codebase:

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           ASSET & BRAND KIT LIFECYCLE TRACE                                 │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. ASSET DELETE GAP (RawStudioInspector.tsx:L604-L615)                                      │
│    • Ingested assets in Project Media list only have a "+ Add" button.                      │
│    • There is NO delete button or handler to remove an asset from state / memory.           │
│    • Deleting an asset must cleanly clean up or alert about matching timeline items.        │
│                                                                                             │
│ 2. ASSET RENAME GAP (RawStudioInspector.tsx:L599-L602)                                      │
│    • Assets display asset.projects?.title || asset.fileName as static non-editable text.    │
│    • No inline rename modal, input, or persistence handler exists.                          │
│                                                                                             │
│ 3. BRAND KIT LOGO UPLOAD GAP (RawStudioInspector.tsx:L1490-L1530)                           │
│    • Inspector provides Preset, Color, Font, and Position controls only.                    │
│    • VideoPreview (L1143) supports logo rendering (brandKit.watermark.logoUrl), but the UI  │
│      provides zero file input to upload/persist a brand logo!                                │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 🎯 SUB-WAVE 3A DEFECT RESOLUTION TARGETS

| Defect ID | Feature Area | Current Broken Behavior | Target Sub-Wave 3A Architectural Solution |
| :--- | :--- | :--- | :--- |
| **`UP-03`** | Asset Deletion | No delete action; asset remains in list forever | Add delete button with confirmation dialog. Removes asset from `mediaAssets` / state. Safely removes or detaches associated timeline items (`dispatch({ type: 'DELETE_ITEM' })`). |
| **`UP-03`** | Asset Renaming | Asset title is read-only | Add inline rename input/pencil icon. Updates asset `title` / `fileName` in `mediaAssets` state and reflects on associated timeline item labels. |
| **`B-02`** | Brand Logo Upload | No logo upload control in Brand Kit inspector | Add "Upload Brand Logo" image input (`.png`, `.jpg`, `.svg`). Generates persistent Data URL / Blob URL, saves into `brandKit.watermark.logoUrl`, and renders in Preview & Export. |

---

## 3. 🧩 CANONICAL DATA MODELS & FLOWS

### A. Safe Asset Deletion Handler
```ts
const handleDeleteAsset = (assetId: string) => {
  // 1. Find any timeline clips referencing this asset
  const referencingClips = editState.items.filter(item => 
    item.mediaAssetId === assetId || item.properties?.sourcePath === assetId
  );

  // 2. Remove referencing timeline clips safely
  referencingClips.forEach(clip => {
    dispatch({ type: 'DELETE_ITEM', payload: { id: clip.id } });
  });

  // 3. Remove asset from media assets collection
  setUploadedAssets(prev => prev.filter(a => a.id !== assetId));
  if (activeAsset?.id === assetId) {
    setActiveAsset(null);
  }

  showToast(`Deleted asset and removed ${referencingClips.length} associated timeline clips.`);
};
```

### B. Inline Asset Renaming Handler
```ts
const handleRenameAsset = (assetId: string, newTitle: string) => {
  if (!newTitle.trim()) return;
  setUploadedAssets(prev => prev.map(a => {
    if (a.id === assetId) {
      return { ...a, title: newTitle.trim(), fileName: newTitle.trim() };
    }
    return a;
  }));
  showToast('Renamed asset.');
};
```

### C. Brand Logo File Upload Handler
```ts
const handleLogoUpload = (file: File) => {
  if (!file.type.startsWith('image/')) {
    showToast('Please upload a valid PNG, JPG, or SVG image.');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const logoUrl = e.target?.result as string;
    setBrandKit(prev => ({
      ...prev,
      watermark: {
        ...(typeof prev.watermark === 'object' ? prev.watermark : { position: 'bottom-right', opacity: 0.8 }),
        logoUrl
      }
    }));
    showToast('Brand Kit Logo uploaded successfully.');
  };
  reader.readAsDataURL(file);
};
```

---

## 4. 📁 FILES TO MODIFY IN SUB-WAVE 3A

1. [`src/components/tabs/raw-studio/RawStudioInspector.tsx`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/RawStudioInspector.tsx):
   - In `activeTool === 'upload'`: Add Delete asset button and inline Rename trigger.
   - In `activeTool === 'brand'`: Add Brand Logo File Input (drag-and-drop / click) and logo preview thumbnail with remove button.

---

## 5. 🛡️ REGRESSION RISKS & MITIGATION

* **Risk (Orphan timeline references):** Deleting an asset while its clip is playing in `VideoPreview` could crash the video player or trigger a black screen error.
  - **Mitigation:** Safe cascade deletion: `editState.items` referencing the deleted asset are synchronously purged via `DELETE_ITEM` actions.
* **Risk (Brand logo format incompatibilities):** Uploading large multi-megabyte images causing local state freeze.
  - **Mitigation:** Validate file type (`image/*`), resize or accept Data URLs with clear error toast if invalid.

---

## 6. 🧪 VERIFICATION STRATEGY

1. **Playwright UI Test Suite (`wave-3a-ui-verify.spec.js`):**
   - Ingest media asset $\to$ Rename asset to "Custom Scene Title" $\to$ Assert renamed title displays.
   - Add asset to timeline $\to$ Delete asset from library $\to$ Assert asset is removed and timeline clip is purged safely without errors.
   - Open Brand Kit $\to$ Upload mock PNG logo $\to$ Assert logo thumbnail is displayed and `brandKit.watermark.logoUrl` is populated.
2. **Full Master Regression Gate:**
   - `npx tsc --noEmit` (0 errors).
   - `wave-1-surgical-fix-verify.spec.js` (6/6 pass).
   - `wave-2a-compiler-verify.ts` (100% pass).
   - `wave-2b-compiler-verify.ts` (100% pass).
   - `wave-2c-compiler-verify.ts` (100% pass).
   - `wave-2d-compiler-verify.ts` (100% pass).

---

## 7. 🚦 READY FOR EXECUTION

The Sub-Wave 3A architecture is **fully designed and verified**.  
No production code has been modified yet. Awaiting authorization to begin Sub-Wave 3A implementation.
