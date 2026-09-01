# 📐 STUDIO HUB — SUB-WAVE 3A ARCHITECTURE READINESS REVIEW
**Document Purpose:** In-depth forensic architecture review and state ownership mapping for Sub-Wave 3A: Asset & Brand Kit Lifecycle.  
**Phase:** PHASE 16 — SUB-WAVE 3A (ASSET & BRAND KIT LIFECYCLE)  
**Date:** 2026-08-30  
**Status:** **ARCHITECTURAL BLUEPRINT & READINESS REVIEW (ZERO PRODUCTION CODE MODIFIED)**  
**Artifact File:** `studio_hub_sub_wave_3a_architecture_readiness_review.md`

---

## 1. 🔍 STATE OWNERSHIP & PERSISTENCE MAPPING

We audited the entire data storage and state architecture across the application:

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           ASSET & BRAND KIT STATE ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. RUNTIME IN-MEMORY STATE (RawStudioContext.tsx / index.tsx:L59-L60)                       │
│    • assets: StudioAsset[] (Owned by RawStudio, provided to RawStudioInspector)             │
│    • activeAsset: StudioAsset | null                                                        │
│    • brandKit: BrandKit (Contains colors, primaryFont, and watermark: { logoUrl, position }) │
│    • editState.items: TimelineItem[] (Clips referencing asset via assetId or sourcePath)    │
│                                                                                             │
│ 2. PERSISTENT STORAGE LAYER (media-service.ts & indexed-db-media.ts)                        │
│    • localStorage['demo_project_data'].assets: Metadata JSON array (survives tab switches) │
│    • IndexedDB (DB: kontentos_media_db, Store: media_blobs): Binary video/audio/image blobs │
│    • deleteMediaBlob(id): Purges binary data from IndexedDB on asset delete                 │
│                                                                                             │
│ 3. REFERENTIAL INTEGRITY (editState.items ➔ assets)                                         │
│    • Timeline items store assetId (e.g. clip.assetId === asset.id)                          │
│    • Deleting an asset requires: (A) Purging referencing timeline items via DELETE_ITEM,    │
│      (B) Purging from assets state, (C) Purging from localStorage & IndexedDB.              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 🛡️ SAFE DELETION CASCADE ALGORITHM

When the user triggers asset deletion:
1. **Dependency Detection:**
   Scan active timeline items for references:
   ```ts
   const referencingClips = editState.items.filter(item => 
     item.assetId === assetId || 
     item.properties?.sourcePath === asset.storage_path ||
     item.id.includes(assetId)
   );
   ```
2. **Confirmation Modal:**
   Display dialog: *"Delete asset '{asset.title || asset.fileName}'? This will also remove {referencingClips.length} associated timeline clip(s)."*
3. **Atomic Execution:**
   - Purge dependent timeline clips: `referencingClips.forEach(clip => dispatch({ type: 'DELETE_ITEM', payload: { id: clip.id } }))`.
   - Purge storage: Call `deleteMediaAsset(assetId, asset._raw_path)` (which updates `demo_project_data` in `localStorage` and executes `deleteMediaBlob(assetId)` in `IndexedDB`).
   - Purge state: `setAssets(prev => prev.filter(a => a.id !== assetId))`.
   - Clear selection: If `activeAsset?.id === assetId`, set `activeAsset = null`.

---

## 3. 🏷️ ASSET RENAMING ARCHITECTURE

1. **State Mutation:**
   ```ts
   export async function updateMediaAssetTitle(assetId: string, newTitle: string): Promise<void> {
     // 1. Update localStorage demo_project_data
     if (isDemoMode() || !isSupabaseConfigured()) {
       const raw = localStorage.getItem('demo_project_data');
       if (raw) {
         const data = JSON.parse(raw);
         if (data.assets) {
           data.assets = data.assets.map((a: any) => a.id === assetId ? { ...a, title: newTitle, fileName: newTitle, file_name: newTitle } : a);
           localStorage.setItem('demo_project_data', JSON.stringify(data));
         }
       }
       return;
     }
     // 2. Update Supabase if configured
     await supabase.from('media_assets').update({ file_name: newTitle }).eq('id', assetId);
   }
   ```
2. **Timeline Propagation:**
   Updating asset title updates `assets` state and updates the display labels of un-customized referencing clips.

---

## 4. 🎨 BRAND KIT LOGO PERSISTENCE ARCHITECTURE

1. **File Validation:**
   - Allowed MIME types: `image/png`, `image/jpeg`, `image/svg+xml`, `image/webp`.
   - Max file size: $5\text{MB}$.
2. **Persistence Strategy (Serialized Base64 Data URL):**
   - Read file via `FileReader.readAsDataURL()`.
   - Stored in `brandKit.watermark.logoUrl` as a persistent Data URL string.
   - Survives serialization into `localStorage['demo_project_data']` and project export without relying on transient Blob URLs (`URL.createObjectURL`).
3. **Rendering & Export Parity:**
   - `VideoPreview.tsx:L1144` already renders `<img src={brandKit.watermark.logoUrl} ... />` with dynamic corner positioning.
   - `ffmpeg-command-planner.ts:L239` receives `imageUrl` for overlay rendering.

---

## 5. 📁 EXACT PRODUCTION FILES TO MODIFY

| File | Scope of Change |
| :--- | :--- |
| [`src/lib/data/media-service.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/data/media-service.ts) | Add `deleteMediaBlob(assetId)` call inside `deleteMediaAsset()`; add `updateMediaAssetTitle()` persistence helper. |
| [`src/components/tabs/raw-studio/RawStudioInspector.tsx`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/RawStudioInspector.tsx) | Add Delete confirmation dialog, inline Rename input/pencil icon, and Brand Kit Logo file input with preview thumbnail and remove button. |

---

## 6. 🛡️ REGRESSION RISKS & MITIGATION

* **Risk (Orphan/Ghost Clips in VideoPreview):** Deleting an asset while a clip is on the timeline could cause `<video>` tag to fail loading the source.
  - **Mitigation:** Synchronous cascade `DELETE_ITEM` action dispatch ensures no timeline item points to a deleted asset ID.
* **Risk (Data URL Size in localStorage):** Uploading a 20MB image could exceed localStorage quota.
  - **Mitigation:** Enforce strict 5MB size limit on logo uploads with user-facing toast alert.

---

## 7. 🧪 VERIFICATION STRATEGY

1. **Playwright UI Test Suite (`scratch/wave-3a-ui-verify.spec.js`):**
   - **Asset Ingestion & Rename:** Upload sample MKV $\to$ rename to "Ocean Hero Scene" $\to$ assert name persists in list.
   - **Safe Asset Deletion:** Add asset to timeline $\to$ click Delete $\to$ verify confirmation dialog shows 1 affected clip $\to$ confirm delete $\to$ assert asset removed and timeline clip purged without console errors.
   - **Brand Kit Logo Upload:** Upload PNG logo $\to$ verify logo thumbnail rendered in inspector and preview canvas.
2. **Master Regression Gate:**
   - `npx tsc --noEmit` (0 errors).
   - `wave-1-surgical-fix-verify.spec.js` (6/6 pass).
   - `wave-2a-compiler-verify.ts` (100% pass).
   - `wave-2b-compiler-verify.ts` (100% pass).
   - `wave-2c-compiler-verify.ts` (100% pass).
   - `wave-2d-compiler-verify.ts` (100% pass).

---

## 8. 🚦 READY FOR SURGICAL IMPLEMENTATION

The architecture review is **complete, verified against the storage layer, and implementation-ready**.  
No production code has been modified yet. Awaiting authorization to begin Sub-Wave 3A implementation.
