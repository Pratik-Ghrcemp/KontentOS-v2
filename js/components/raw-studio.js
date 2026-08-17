// KontentOS — Universal Studio Hub: 🎬 Pro Video & Reel Studio + 🖼️ AI Image & Carousel Studio
import { stateStore, GEO_LOCALES } from '../state.js';
import { openProModal } from './pro-modal.js';

// Master Catalog of 20+ Curated High-Resolution Background Photography
const MASTER_BG_CATALOG = [
  {
    id: 'minimalist_desk',
    name: 'Minimalist Workspace',
    tag: 'Workspace',
    url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'modern_office',
    name: 'Architectural Window',
    tag: 'Office',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'wooden_desk',
    name: 'Warm Wood & Laptop',
    tag: 'Warmth',
    url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'minimal_plant',
    name: 'Sunlit Plant Desk',
    tag: 'Nature',
    url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'moody_studio',
    name: 'Moody Creator Studio',
    tag: 'Studio',
    url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'podcast_mic',
    name: 'Podcast Studio Mic',
    tag: 'Podcast',
    url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'audio_console',
    name: 'Audio Mixing Desk',
    tag: 'Audio',
    url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'aesthetic_coffee',
    name: 'Coffee & Laptop Desk',
    tag: 'Lifestyle',
    url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'latte_notebook',
    name: 'Espresso & Notebook',
    tag: 'Journal',
    url: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'coworking_vibe',
    name: 'Co-Working Lounge',
    tag: 'Vibe',
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'coding_night',
    name: 'Clean Code Desk',
    tag: 'Focus',
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'abstract_mesh',
    name: 'Modern Fluid Gradient',
    tag: 'Abstract',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'pastel_peach',
    name: 'Terracotta & Peach',
    tag: 'Editorial',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'chromatic_wave',
    name: 'Chromatic 3D Wave',
    tag: '3D Wave',
    url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'cyber_neon',
    name: 'Neon Cyber Desk',
    tag: 'Cyber',
    url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'moody_mountain',
    name: 'Misty Alpine Silhouette',
    tag: 'Moody',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'none',
    name: 'Pure Solid / Minimal Glass',
    tag: 'Solid',
    url: ''
  }
];

export function renderRawStudio(container) {
  const state = stateStore.get();
  const profile = state.creatorProfile;
  const locale = GEO_LOCALES[state.geo] || GEO_LOCALES.IN;

  // Studio Mode: 'video' or 'image'
  let activeStudioMode = 'video';

  // Video Mode State
  let isVideoUploaded = false;
  let isAutoEdited = false;
  let currentVideoUrl = null;
  let currentFileName = 'raw_phone_recording.mp4';
  let isPlaying = true;

  // Pro Video Editor Settings
  let activeEditorTab = 'subtitles'; // 'subtitles', 'broll_stickers', 'color_pro', 'effects', 'transitions', 'audio_sfx', 'timeline'
  
  // 1. Subtitles State
  let selectedSubtitlePreset = 'beast'; // 'beast', 'hormozi', 'ali_abdaal', 'cyber_glitch', 'minimal'
  let subtitlePosition = 'bottom'; // 'bottom', 'center', 'top'
  let subtitleFontSize = '1.15rem';
  let subtitleHighlightColor = '#39ff14';
  let liveTranscriptText = "STOP DOING THIS IN 2026! THE #1 MISTAKE CREATORS MAKE";

  // 2. AI B-Roll & Emojis State
  let bRollEnabled = true;
  let bRollType = 'tech_growth'; // 'tech_growth', 'lifestyle', 'crypto_money', 'viral_memes'
  let emojiPopupsEnabled = true;
  let emojiStyle = '3d_bounce'; // '3d_bounce', 'glow_pop', 'fire_smoke'

  // 3. Pro Color Adjustments & LUTs State
  let selectedFilter = 'teal_orange'; // 'none', 'teal_orange', 'cyber_neon', 'vintage_film', 'studio_bright', 'black_white'
  let colorBrightness = 105; // 80 - 130%
  let colorContrast = 115; // 80 - 140%
  let colorSaturation = 120; // 50 - 150%
  let colorVignette = 15; // 0 - 60%

  // 4. Effects & Dynamic Zooms State
  let selectedEffect = 'smart_zoom'; // 'none', 'smart_zoom', 'glitch_flash', 'light_leak', 'film_grain'
  let motionBlurEnabled = true;
  let speedRampEnabled = true;

  // 5. Transitions & Pacing State
  let selectedTransition = 'whip_pan'; // 'whip_pan', 'zoom_snap', 'glitch', 'camera_flash'
  let cutPacing = 'viral_fast'; // 'viral_fast' (1.2s), 'medium_pace' (2.5s), 'cinematic' (4.0s)

  // 6. Audio & Sound FX State
  let voiceIsolator = true;
  let voiceSpeed = '1.05x'; // '1.0x', '1.05x', '1.15x', '0.95x'
  let sfxPack = 'beast_high_viral'; // 'beast_high_viral', 'vox_documentary', 'clean_tech', 'none'
  let bgMusicTrack = 'lofi_chill'; // 'none', 'lofi_chill', 'phonk_drift', 'synthwave_drive', 'upbeat_pop'
  let bgMusicVolume = 45;

  // Overlay Helpers
  let showSafeZoneGrid = false;

  // Image / Carousel Mode State
  let selectedImageTemplate = 'instagram'; // 'instagram', 'linkedin', 'tweet', 'carousel', 'quote'
  let selectedAspectRatio = '1:1'; // '1:1', '4:5', '16:9'
  let selectedImageTheme = 'sahara'; // 'sahara', 'midnight', 'emerald', 'amber', 'monolith'

  function getRandomBackgrounds() {
    const photoPool = MASTER_BG_CATALOG.filter(b => b.id !== 'none');
    const shuffled = [...photoPool].sort(() => 0.5 - Math.random()).slice(0, 5);
    shuffled.push(MASTER_BG_CATALOG.find(b => b.id === 'none'));
    return shuffled;
  }

  let currentDisplayedBgs = getRandomBackgrounds();
  let selectedBgObj = currentDisplayedBgs[0];

  let imageHeadline = "Most creators spend 80% of their time on repetitive edits instead of high-leverage ideas.";
  let imageBody = "Here is the exact 3-step system to turn 1 raw thought into 6 high-converting assets in under 5 minutes.";
  let carouselSlideNum = 1;
  let totalCarouselSlides = 5;

  function renderMain() {
    container.innerHTML = `
      <div class="content-container" style="max-width: 1200px;">
        <!-- Hidden File Input for Native Camera Roll / Video Picker -->
        <input type="file" id="video-file-input" accept="video/*,image/*" style="display: none;" />

        <!-- Top Header & Studio Mode Switcher -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
              <h1 style="font-size: 2rem;">⚡ Content Studio Hub</h1>
              <span class="badge badge-neon">PRO VIDEO SUITE</span>
            </div>
            <p style="color: var(--text-muted); font-size: 0.92rem;">
              Upload raw footage $\rightarrow$ 1-click AI Auto-Edit into viral Super Reels $\rightarrow$ Fine-tune with pro visual effects, B-Rolls, LUTs, SFX & kinetic captions.
            </p>
          </div>

          <!-- Studio Mode Switcher Tabs -->
          <div style="display: flex; background: var(--bg-surface-card); padding: 4px; border-radius: 12px; border: 1px solid var(--border-subtle); gap: 4px;">
            <button id="tab-mode-video" class="btn ${activeStudioMode === 'video' ? 'btn-primary' : 'btn-secondary'}" style="padding: 0.45rem 1.15rem; font-size: 0.85rem; border-radius: 8px;">
              <span>🎬 Video & Reel Studio</span>
            </button>
            <button id="tab-mode-image" class="btn ${activeStudioMode === 'image' ? 'btn-primary' : 'btn-secondary'}" style="padding: 0.45rem 1.15rem; font-size: 0.85rem; border-radius: 8px;">
              <span>🖼️ AI Image & Carousel Studio</span>
            </button>
          </div>
        </div>

        <!-- Mode Workspace Container -->
        <div id="studio-workspace-area">
          ${activeStudioMode === 'video' ? renderVideoStudioHtml() : renderImageStudioHtml()}
        </div>

      </div>
    `;

    attachModeEvents();
    if (activeStudioMode === 'video') {
      attachVideoEvents();
    } else {
      attachImageEvents();
    }
  }

  // ==========================================
  // 1. VIDEO STUDIO HTML GENERATOR (Pro Suite)
  // ==========================================
  function renderVideoStudioHtml() {
    // Build Pro CSS Filter String based on selected LUT and adjustment sliders
    const filterStyle = isAutoEdited 
      ? `filter: brightness(${colorBrightness}%) contrast(${colorContrast}%) saturate(${colorSaturation}%);` 
      : '';

    return `
      <div class="bento-grid" style="margin-bottom: 2rem;">
        
        <!-- Left Column: 9:16 Video Player & Live Effect Simulator -->
        <div class="card" style="grid-column: span 7; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 560px; position: relative;">
          
          <!-- Drop Zone (When no video uploaded) -->
          <div id="drop-zone" style="width: 100%; border: 2px dashed var(--border-glass); border-radius: 16px; padding: 3rem 1.5rem; text-align: center; background: var(--bg-surface-low); cursor: pointer; transition: all 0.25s ease; ${isVideoUploaded ? 'display: none;' : ''}">
            <div style="width: 64px; height: 64px; border-radius: 50%; background: var(--bg-surface-high); margin: 0 auto 1.25rem auto; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: var(--accent-primary);">
              ☁️
            </div>
            <h3 style="font-size: 1.25rem; margin-bottom: 0.35rem;">Drop Raw Phone Recording Here</h3>
            <p style="color: var(--text-muted); font-size: 0.85rem; max-width: 420px; margin: 0 auto 1.5rem auto;">
              Supports MP4, MOV, ProRes up to 4K / Max 10GB. Upload your unedited clip to preview and run AI auto-edits.
            </p>
            <div style="display: flex; justify-content: center; gap: 0.75rem; flex-wrap: wrap;">
              <button class="btn btn-primary" id="btn-browse-file" type="button" style="padding: 0.75rem 1.5rem; font-size: 0.92rem;">
                <span>📁 Browse Camera Roll</span>
              </button>
              <button class="btn btn-secondary" id="btn-sample-video" type="button">
                <span>⚡ Load Sample 4K Video</span>
              </button>
            </div>
          </div>

          <!-- Live 9:16 Interactive Video Simulator -->
          <div id="video-simulator" style="width: 100%; max-width: 320px; height: 550px; background: #000; border-radius: 20px; position: relative; overflow: hidden; box-shadow: var(--shadow-lg); border: 2px solid var(--border-glass); ${isVideoUploaded ? 'display: flex;' : 'display: none;'} flex-direction: column; justify-content: space-between; padding: 1.25rem;">
            
            <!-- Video Layer with Applied Color Filter & Smart Zoom Classes -->
            <div id="video-media-container" class="${isAutoEdited && selectedFilter !== 'none' ? `filter-${selectedFilter.replace('_', '-')}` : ''} ${isAutoEdited && selectedEffect === 'smart_zoom' ? 'fx-smart-zoom-active' : ''}" style="position: absolute; inset: 0; z-index: 1; background: radial-gradient(circle at center, #232733 0%, #0c0e14 100%); display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; ${filterStyle}">
              ${currentVideoUrl ? `
                <video id="player-video-tag" src="${currentVideoUrl}" autoplay loop muted playsinline style="width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0;"></video>
              ` : `
                <div style="text-align: center; opacity: 0.9; position: relative; z-index: 2;">
                  <div style="font-size: 4.5rem; animation: pulse 2s infinite;">🎬</div>
                  <div style="font-size: 0.82rem; font-weight: 700; color: var(--accent-primary); margin-top: 0.5rem;" id="simulated-label">
                    ${isAutoEdited ? '⚡ [SUPER REEL: 4K 60FPS AI EDITED]' : '📹 [RAW FOOTAGE: UNEDITED]'}
                  </div>
                  <div style="font-size: 0.7rem; color: var(--text-dim); margin-top: 2px;">
                    ${isAutoEdited ? '8 Silence Cuts • Auto Subtitles • Color Graded' : '0 Pauses Trimmed • No Captions'}
                  </div>
                </div>
              `}
            </div>

            <!-- FX Overlay Layer (Glitch, Light Leak, Film Grain) -->
            <div id="fx-layer-container">
              ${isAutoEdited && selectedEffect === 'glitch_flash' ? '<div class="fx-glitch-overlay"></div>' : ''}
              ${isAutoEdited && selectedEffect === 'light_leak' ? '<div class="fx-light-leak-overlay"></div>' : ''}
              ${isAutoEdited && selectedEffect === 'film_grain' ? '<div class="fx-film-grain-overlay"></div>' : ''}
            </div>

            <!-- AI B-Roll & 3D Animated Emoji Popup Overlay -->
            ${isAutoEdited && (bRollEnabled || emojiPopupsEnabled) ? `
              <div id="broll-emoji-overlay" style="position: absolute; top: 18%; left: 0; right: 0; z-index: 12; pointer-events: none; text-align: center; animation: pulse 2s infinite;">
                ${emojiPopupsEnabled ? `
                  <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); padding: 4px 10px; border-radius: 999px; border: 1.5px solid ${subtitleHighlightColor}; box-shadow: 0 4px 16px rgba(0,0,0,0.7); transform: scale(0.95);">
                    <span style="font-size: 1.2rem;">🔥</span>
                    <span style="font-size: 0.72rem; font-weight: 900; color: #fff; text-transform: uppercase;">VIRAL HOOK ALERT</span>
                  </div>
                ` : ''}
              </div>
            ` : ''}

            <!-- Safe-Zone Overlay Grid (Toggleable) -->
            <div id="safe-zone-overlay" style="position: absolute; inset: 0; z-index: 18; pointer-events: none; border: 1px dashed rgba(0, 240, 255, 0.4); display: ${showSafeZoneGrid ? 'flex' : 'none'}; flex-direction: column; justify-content: space-between; padding: 1.5rem 0.75rem;">
              <div style="font-size: 0.62rem; color: #00f0ff; background: rgba(0,0,0,0.7); padding: 2px 6px; border-radius: 4px; align-self: flex-start;">Safe Top Header</div>
              <div style="font-size: 0.62rem; color: #00f0ff; background: rgba(0,0,0,0.7); padding: 2px 6px; border-radius: 4px; align-self: flex-end;">Safe Bottom CTA</div>
            </div>

            <!-- Top Simulator Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; z-index: 20; position: relative;">
              <span class="badge ${isAutoEdited ? 'badge-neon' : 'badge-purple'}" style="font-size: 0.65rem;">
                ${isAutoEdited ? '⚡ SUPER REEL AI EDITED' : '📹 RAW UNEDITED CLIP'}
              </span>
              <button id="btn-change-video" class="btn btn-secondary" style="padding: 2px 8px; font-size: 0.68rem; background: rgba(0,0,0,0.6); color: #fff; border: 1px solid rgba(255,255,255,0.2);">
                <span>🔄 Swap Video</span>
              </button>
            </div>

            <!-- Center Play/Pause Overlay -->
            <button id="btn-play-pause" style="position: absolute; top: 46%; left: 50%; transform: translate(-50%, -50%); z-index: 15; width: 48px; height: 48px; border-radius: 50%; background: rgba(0,0,0,0.65); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.3); color: #fff; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0.8; transition: all 0.2s;">
              ❚❚
            </button>

            <!-- Dynamic Animated Subtitle Layer (Karaoke) -->
            <div id="subtitle-preview-box" style="z-index: 10; margin-bottom: ${subtitlePosition === 'top' ? 'auto' : (subtitlePosition === 'center' ? 'auto' : '1.5rem')}; margin-top: ${subtitlePosition === 'top' ? '1.5rem' : 'auto'}; text-align: center; position: relative; ${isAutoEdited ? 'display: block;' : 'display: none;'}">
              <!-- Content generated dynamically -->
            </div>

            <!-- Bottom Video Scrub Timeline & Timecode -->
            <div style="z-index: 10; position: relative; background: rgba(0,0,0,0.65); backdrop-filter: blur(8px); padding: 4px 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 4px;">
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.65rem; color: var(--text-dim); margin-bottom: 2px;">
                <span id="player-timecode">00:07 / 00:30</span>
                <span style="color: var(--accent-cyan);">${voiceSpeed} Speed • 9:16 HD</span>
              </div>
              <div style="height: 3px; background: rgba(255,255,255,0.2); border-radius: 2px; overflow: hidden; position: relative;">
                <div style="width: 32%; height: 100%; background: var(--accent-primary);"></div>
              </div>
            </div>

            <!-- Watermark Overlay Badge -->
            <div id="watermark-overlay" style="position: absolute; bottom: 10px; right: 12px; z-index: 20; ${profile.includeWatermark ? 'display: flex;' : 'display: none;'}; align-items: center; gap: 4px; background: rgba(15, 17, 21, 0.85); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.15); padding: 4px 8px; border-radius: 999px; box-shadow: 0 2px 8px rgba(0,0,0,0.6);">
              <span style="font-size: 0.75rem; color: var(--accent-primary-light);">⚡</span>
              <span style="font-size: 0.68rem; font-weight: 800; letter-spacing: 0.02em; color: #fff;">Made with <span style="color: var(--accent-cyan);">KontentOS</span></span>
            </div>

          </div>

          <!-- Video Upload Status Pill Below Player -->
          ${isVideoUploaded ? `
            <div style="margin-top: 0.85rem; display: flex; gap: 0.75rem; align-items: center; font-size: 0.78rem;">
              <span style="color: var(--text-dim);">📁 ${currentFileName}</span>
              ${isAutoEdited ? `
                <button id="btn-revert-raw" class="btn btn-secondary" style="padding: 2px 8px; font-size: 0.7rem;">
                  <span>Revert to Raw</span>
                </button>
              ` : ''}
            </div>
          ` : ''}
        </div>

        <!-- Right Column: AI Auto-Edit Trigger & Pro Video Editor Suite -->
        <div class="card" style="grid-column: span 5; display: flex; flex-direction: column; gap: 1.15rem;">
          
          <!-- PHASE 1: When Video is Raw (Before AI Auto-Edit) -->
          ${!isAutoEdited ? `
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <h3 style="font-size: 1.15rem;">⚡ AI Magic Auto-Edit</h3>
                <span class="badge badge-neon">ONE-CLICK ENHANCE</span>
              </div>
              <p style="color: var(--text-muted); font-size: 0.82rem; margin-bottom: 1rem; line-height: 1.4;">
                Transform your raw unedited recording into a viral Super Reel with kinetic subtitles, silence trimming, face zooms & studio audio.
              </p>

              <!-- Auto-Edit Engine Controls -->
              <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0.85rem; background: var(--bg-surface-low); border-radius: 10px; border: 1px solid var(--border-subtle);">
                  <div>
                    <div style="font-weight: 600; font-size: 0.85rem;">Trim Silence & Filler Words</div>
                    <div style="font-size: 0.7rem; color: var(--text-dim);">Auto-removes dead pauses > 0.4s & 'um/like'</div>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" checked id="toggle-trim-silence">
                    <span class="toggle-slider"></span>
                  </label>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0.85rem; background: var(--bg-surface-low); border-radius: 10px; border: 1px solid var(--border-subtle);">
                  <div>
                    <div style="font-weight: 600; font-size: 0.85rem;">9:16 Smart Face & Object Tracking</div>
                    <div style="font-size: 0.7rem; color: var(--text-dim);">Keeps your face in dynamic center frame</div>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" checked id="toggle-reframe">
                    <span class="toggle-slider"></span>
                  </label>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0.85rem; background: var(--bg-surface-low); border-radius: 10px; border: 1px solid var(--border-subtle);">
                  <div>
                    <div style="font-weight: 600; font-size: 0.85rem;">Studio Mic Voice Isolator</div>
                    <div style="font-size: 0.7rem; color: var(--text-dim);">Eliminates room echo & enhances voice presence</div>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" checked id="toggle-mic">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <!-- Main Hero Action Button: RUN AUTO-EDIT -->
              <button id="btn-run-auto-edit" class="btn btn-primary" style="padding: 0.95rem; width: 100%; font-size: 1.05rem; box-shadow: var(--shadow-glow);">
                <span>⚡ Run AI Auto-Edit (Turn into Super Reel)</span>
              </button>
            </div>
          ` : `
            <!-- PHASE 2: Pro Creative Video Editor Suite (After AI Auto-Edit) -->
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.4rem;">
                  <h3 style="font-size: 1.15rem;">🎬 Pro Video Editor Suite</h3>
                  <span class="badge badge-neon" style="font-size: 0.6rem;">MULTI-TRACK</span>
                </div>
                <span style="font-size: 0.72rem; color: var(--text-dim);">Real-time preview</span>
              </div>

              <!-- Editor Sub-Tabs Navigation (7-Tab Suite) -->
              <div style="display: flex; gap: 0.35rem; overflow-x: auto; padding-bottom: 4px; margin-bottom: 0.85rem;">
                <button class="editor-subtab-btn ${activeEditorTab === 'subtitles' ? 'active' : ''}" data-tab="subtitles">🔤 Captions</button>
                <button class="editor-subtab-btn ${activeEditorTab === 'broll_stickers' ? 'active' : ''}" data-tab="broll_stickers">🎭 B-Roll & Emojis</button>
                <button class="editor-subtab-btn ${activeEditorTab === 'color_pro' ? 'active' : ''}" data-tab="color_pro">🎨 Pro Color</button>
                <button class="editor-subtab-btn ${activeEditorTab === 'effects' ? 'active' : ''}" data-tab="effects">✨ FX & Zooms</button>
                <button class="editor-subtab-btn ${activeEditorTab === 'transitions' ? 'active' : ''}" data-tab="transitions">🔄 Transitions</button>
                <button class="editor-subtab-btn ${activeEditorTab === 'audio_sfx' ? 'active' : ''}" data-tab="audio_sfx">🔊 Audio & SFX</button>
                <button class="editor-subtab-btn ${activeEditorTab === 'timeline' ? 'active' : ''}" data-tab="timeline">🎞️ Timeline</button>
              </div>

              <!-- Sub-Tab Content Rendering -->
              <div id="editor-subtab-content" style="background: var(--bg-surface-low); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 1rem; min-height: 250px;">
                ${renderEditorSubtabContent()}
              </div>

              <!-- Export / Publish Action Bar -->
              <div style="display: flex; gap: 0.5rem; margin-top: 1.15rem;">
                <button id="btn-export-reel" class="btn btn-primary" style="flex: 1.2; padding: 0.75rem; font-size: 0.9rem;">
                  <span>💾 Export 4K 60FPS Super Reel</span>
                </button>
                <button id="btn-publish-all" class="btn btn-secondary" style="flex: 1; padding: 0.75rem; font-size: 0.9rem;">
                  <span>🚀 Publish to 6 Channels</span>
                </button>
              </div>
            </div>
          `}

        </div>
      </div>

      <!-- 6-Platform Output Deck (Visible when video is auto-edited) -->
      <div id="atomizer-results-section" style="${isAutoEdited ? 'display: block;' : 'display: none;'} margin-top: 2.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 style="font-size: 1.5rem;">📱 6-Platform Social Output Deck (Captions, Tags & Emojis)</h2>
            <p style="color: var(--text-muted); font-size: 0.88rem;">1 Super Reel $\rightarrow$ Auto-formatted hooks, takeaway bullets, and 20+ viral hashtag stacks.</p>
          </div>

          <button id="btn-publish-all-bottom" class="btn btn-primary" style="padding: 0.65rem 1.35rem; font-size: 0.9rem;">
            <span>🚀 1-Click Publish to All 6 Channels</span>
          </button>
        </div>

        <div class="bento-grid">
          ${renderPlatformSocialCards('video')}
        </div>
      </div>
    `;
  }

  // ==========================================
  // 2. PRO SUB-TAB CONTENT GENERATOR
  // ==========================================
  function renderEditorSubtabContent() {
    if (activeEditorTab === 'subtitles') {
      return `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
            <strong style="font-size: 0.85rem;">Kinetic Caption Style Presets</strong>
            <span style="font-size: 0.7rem; color: var(--accent-secondary);">● Auto-Synced Karaoke</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.45rem; margin-bottom: 0.85rem;">
            <!-- Beast -->
            <div class="subtitle-card card ${selectedSubtitlePreset === 'beast' ? 'active-card' : ''}" data-sub="beast" style="cursor: pointer; padding: 0.55rem 0.35rem; text-align: center; border-color: ${selectedSubtitlePreset === 'beast' ? 'var(--accent-primary)' : 'var(--border-subtle)'};">
              <div style="background: #000; padding: 4px; border-radius: 6px; border: 1.5px solid #39ff14; margin-bottom: 4px;">
                <span style="font-weight: 900; font-size: 0.72rem; color: #fff;">STOP <span style="background: #39ff14; color: #000; padding: 1px 3px; border-radius: 3px;">THIS</span></span>
              </div>
              <div style="font-weight: 800; font-size: 0.72rem; color: var(--text-main);">"The Beast"</div>
              <div style="font-size: 0.62rem; color: var(--text-dim);">Neon Pop</div>
            </div>

            <!-- Hormozi -->
            <div class="subtitle-card card ${selectedSubtitlePreset === 'hormozi' ? 'active-card' : ''}" data-sub="hormozi" style="cursor: pointer; padding: 0.55rem 0.35rem; text-align: center; border-color: ${selectedSubtitlePreset === 'hormozi' ? 'var(--accent-primary)' : 'var(--border-subtle)'};">
              <div style="background: #000; padding: 4px; border-radius: 6px; border: 1.5px solid #fbbf24; margin-bottom: 4px;">
                <span style="font-weight: 900; font-size: 0.72rem; color: #fff;">THE <span style="background: #fbbf24; color: #000; padding: 1px 3px; border-radius: 3px;">#1 FIX</span></span>
              </div>
              <div style="font-weight: 800; font-size: 0.72rem; color: var(--text-main);">"Hormozi"</div>
              <div style="font-size: 0.62rem; color: var(--text-dim);">Yellow Block</div>
            </div>

            <!-- Ali Abdaal -->
            <div class="subtitle-card card ${selectedSubtitlePreset === 'ali_abdaal' ? 'active-card' : ''}" data-sub="ali_abdaal" style="cursor: pointer; padding: 0.55rem 0.35rem; text-align: center; border-color: ${selectedSubtitlePreset === 'ali_abdaal' ? 'var(--accent-primary)' : 'var(--border-subtle)'};">
              <div style="background: #0f172a; padding: 4px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); margin-bottom: 4px;">
                <span style="font-weight: 700; font-size: 0.72rem; color: #38bdf8;">Ali Abdaal</span>
              </div>
              <div style="font-weight: 800; font-size: 0.72rem; color: var(--text-main);">"Abdaal"</div>
              <div style="font-size: 0.62rem; color: var(--text-dim);">Clean Blue</div>
            </div>
          </div>

          <!-- Live Transcript Word Editor -->
          <div style="margin-bottom: 0.85rem;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-dim); margin-bottom: 4px;">Live Transcribed Hook Text (Editable)</div>
            <input type="text" id="input-transcript-text" class="form-input" value="${liveTranscriptText}" style="font-size: 0.82rem; font-weight: 700;" />
          </div>

          <!-- Position Selector -->
          <div style="margin-bottom: 0.85rem;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-dim); margin-bottom: 4px;">Vertical Position (Safe Zone)</div>
            <div style="display: flex; gap: 0.4rem;">
              <button class="btn ${subtitlePosition === 'bottom' ? 'btn-primary' : 'btn-secondary'} btn-sub-pos" data-pos="bottom" style="flex: 1; padding: 0.3rem; font-size: 0.75rem;">
                Safe Zone Bottom
              </button>
              <button class="btn ${subtitlePosition === 'center' ? 'btn-primary' : 'btn-secondary'} btn-sub-pos" data-pos="center" style="flex: 1; padding: 0.3rem; font-size: 0.75rem;">
                Center Screen
              </button>
              <button class="btn ${subtitlePosition === 'top' ? 'btn-primary' : 'btn-secondary'} btn-sub-pos" data-pos="top" style="flex: 1; padding: 0.3rem; font-size: 0.75rem;">
                Top Header
              </button>
            </div>
          </div>

          <!-- Font Size Selector -->
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; font-weight: 700; color: var(--text-dim); margin-bottom: 4px;">
              <span>Font Size</span>
              <span id="label-sub-size">${subtitleFontSize}</span>
            </div>
            <input type="range" id="range-sub-size" min="0.9" max="1.5" step="0.05" value="${parseFloat(subtitleFontSize)}" style="width: 100%; accent-color: var(--accent-primary);" />
          </div>
        </div>
      `;
    } else if (activeEditorTab === 'broll_stickers') {
      // 2. AI B-Roll & Emojis Subtab
      return `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <strong style="font-size: 0.85rem;">🎭 AI Visual Cutaways & 3D Emojis</strong>
            <span class="badge badge-neon" style="font-size: 0.6rem;">VIRAL HOOKS</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.55rem 0.75rem; background: var(--bg-surface-card); border-radius: 8px; border: 1px solid var(--border-subtle);">
              <div>
                <div style="font-weight: 700; font-size: 0.8rem;">Auto-Insert Contextual AI B-Roll</div>
                <div style="font-size: 0.68rem; color: var(--text-dim);">Inserts 1.5s visual cutaways on key nouns & tools</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" ${bRollEnabled ? 'checked' : ''} id="toggle-broll-inserts">
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.55rem 0.75rem; background: var(--bg-surface-card); border-radius: 8px; border: 1px solid var(--border-subtle);">
              <div>
                <div style="font-weight: 700; font-size: 0.8rem;">Animated 3D Emoji Popups</div>
                <div style="font-size: 0.68rem; color: var(--text-dim);">Triggers 🔥, 🚀, 🤯 animations on punchlines</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" ${emojiPopupsEnabled ? 'checked' : ''} id="toggle-emoji-popups">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div>
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-dim); margin-bottom: 4px;">B-Roll Visual Niche Pack</div>
            <select id="select-broll-pack" class="form-select" style="font-size: 0.82rem;">
              <option value="tech_growth" ${bRollType === 'tech_growth' ? 'selected' : ''}>💻 Tech, Coding & Startup Growth</option>
              <option value="crypto_money" ${bRollType === 'crypto_money' ? 'selected' : ''}>💰 Cash Flow & Financial Charts</option>
              <option value="lifestyle" ${bRollType === 'lifestyle' ? 'selected' : ''}>☕ Minimal Workspace & Coffee Lounge</option>
              <option value="viral_memes" ${bRollType === 'viral_memes' ? 'selected' : ''}>🎭 High-Energy Pop Culture Memes</option>
            </select>
          </div>
        </div>
      `;
    } else if (activeEditorTab === 'color_pro') {
      // 3. Pro Color & LUTs Subtab
      const filters = [
        { id: 'none', name: 'Natural / Raw', tag: 'Original', color: '#64748b' },
        { id: 'teal_orange', name: 'Teal & Orange', tag: 'Cinematic', color: '#0ea5e9' },
        { id: 'cyber_neon', name: 'Cyber Neon', tag: 'Vibrant', color: '#a855f7' },
        { id: 'vintage_film', name: 'Vintage 90s Film', tag: 'Warm Grain', color: '#d97706' },
        { id: 'studio_bright', name: 'Studio Daylight', tag: 'Clean', color: '#10b981' },
        { id: 'black_white', name: 'Dramatic Noir', tag: 'B&W', color: '#ffffff' }
      ];

      return `
        <div>
          <div style="font-size: 0.85rem; font-weight: 700; margin-bottom: 0.5rem;">Cinematic LUT Presets</div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.45rem; margin-bottom: 1rem;">
            ${filters.map(f => `
              <button class="btn ${selectedFilter === f.id ? 'btn-primary' : 'btn-secondary'} btn-select-filter" data-filter="${f.id}" style="padding: 0.5rem 0.35rem; font-size: 0.72rem; display: flex; flex-direction: column; align-items: center; gap: 2px;">
                <div style="width: 12px; height: 12px; border-radius: 50%; background: ${f.color};"></div>
                <strong style="font-size: 0.72rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${f.name}</strong>
              </button>
            `).join('')}
          </div>

          <!-- Color Correction Adjustment Sliders -->
          <div style="display: flex; flex-direction: column; gap: 0.5rem; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-dim);">
                <span>Brightness</span>
                <span>${colorBrightness}%</span>
              </div>
              <input type="range" id="range-brightness" min="80" max="130" value="${colorBrightness}" style="width: 100%; accent-color: var(--accent-primary);" />
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-dim);">
                <span>Contrast</span>
                <span>${colorContrast}%</span>
              </div>
              <input type="range" id="range-contrast" min="80" max="140" value="${colorContrast}" style="width: 100%; accent-color: var(--accent-primary);" />
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-dim);">
                <span>Saturation / Vibrance</span>
                <span>${colorSaturation}%</span>
              </div>
              <input type="range" id="range-saturation" min="60" max="150" value="${colorSaturation}" style="width: 100%; accent-color: var(--accent-primary);" />
            </div>
          </div>
        </div>
      `;
    } else if (activeEditorTab === 'effects') {
      const effects = [
        { id: 'smart_zoom', name: 'Smart Face Zoom', desc: 'Auto-punches in 1.2x on key hook words', icon: '🔍' },
        { id: 'glitch_flash', name: 'Glitch Chromatic Flash', desc: 'RGB chromatic snap on transitions', icon: '⚡' },
        { id: 'light_leak', name: 'Warm Light Leak Flare', desc: 'Golden hour optical flare overlay', icon: '☀️' },
        { id: 'film_grain', name: 'Cinematic 35mm Grain', desc: 'High-end cinema camera texture', icon: '🎞️' },
        { id: 'none', name: 'No Visual FX', desc: 'Clean un-overlayed footage', icon: '🚫' }
      ];

      return `
        <div>
          <div style="font-size: 0.85rem; font-weight: 700; margin-bottom: 0.6rem;">Visual FX & Dynamic Zooms</div>
          <div style="display: flex; flex-direction: column; gap: 0.45rem; margin-bottom: 0.85rem;">
            ${effects.map(fx => `
              <div class="btn ${selectedEffect === fx.id ? 'btn-primary' : 'btn-secondary'} btn-select-effect" data-effect="${fx.id}" style="padding: 0.55rem 0.75rem; cursor: pointer; text-align: left; display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="font-weight: 700; font-size: 0.8rem;">${fx.icon} ${fx.name}</div>
                  <div style="font-size: 0.65rem; opacity: 0.85; margin-top: 1px;">${fx.desc}</div>
                </div>
                <span style="font-size: 0.8rem;">${selectedEffect === fx.id ? '✓' : ''}</span>
              </div>
            `).join('')}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: var(--bg-surface-card); border-radius: 8px; border: 1px solid var(--border-subtle);">
            <div>
              <div style="font-weight: 700; font-size: 0.78rem;">Dynamic Motion Blur on Swipes</div>
              <div style="font-size: 0.65rem; color: var(--text-dim);">Renders speed blur on fast camera moves</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" ${motionBlurEnabled ? 'checked' : ''} id="toggle-motion-blur">
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      `;
    } else if (activeEditorTab === 'transitions') {
      const transitions = [
        { id: 'whip_pan', name: 'Whip Pan Right', tag: 'Viral Standard' },
        { id: 'zoom_snap', name: 'Smooth Zoom Snap', tag: 'High Energy' },
        { id: 'glitch', name: 'Glitch Slice Cut', tag: 'Cyber' },
        { id: 'camera_flash', name: 'Camera Flash Fade', tag: 'Dramatic' }
      ];

      return `
        <div>
          <div style="font-size: 0.85rem; font-weight: 700; margin-bottom: 0.6rem;">Transition Style on Jump Cuts</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.45rem; margin-bottom: 1rem;">
            ${transitions.map(t => `
              <button class="btn ${selectedTransition === t.id ? 'btn-primary' : 'btn-secondary'} btn-select-transition" data-transition="${t.id}" style="padding: 0.55rem; font-size: 0.78rem; text-align: left;">
                <div style="font-weight: 700;">${t.name}</div>
                <div style="font-size: 0.65rem; opacity: 0.8;">${t.tag}</div>
              </button>
            `).join('')}
          </div>

          <div style="border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-dim); margin-bottom: 4px;">Cut Frequency / Pacing Velocity</div>
            <div style="display: flex; gap: 0.4rem;">
              <button class="btn ${cutPacing === 'viral_fast' ? 'btn-primary' : 'btn-secondary'} btn-select-pacing" data-pacing="viral_fast" style="flex: 1; padding: 0.35rem; font-size: 0.72rem;">
                🔥 Viral (1.2s cuts)
              </button>
              <button class="btn ${cutPacing === 'medium_pace' ? 'btn-primary' : 'btn-secondary'} btn-select-pacing" data-pacing="medium_pace" style="flex: 1; padding: 0.35rem; font-size: 0.72rem;">
                ⚡ Dynamic (2.5s)
              </button>
              <button class="btn ${cutPacing === 'cinematic' ? 'btn-primary' : 'btn-secondary'} btn-select-pacing" data-pacing="cinematic" style="flex: 1; padding: 0.35rem; font-size: 0.72rem;">
                🎬 Cinema (4s)
              </button>
            </div>
          </div>
        </div>
      `;
    } else if (activeEditorTab === 'audio_sfx') {
      return `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <strong style="font-size: 0.85rem;">Audio Isolation, Voice Pitch & SFX Packs</strong>
            <span class="badge badge-neon" style="font-size: 0.6rem;">STUDIO MIC</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.55rem 0.75rem; background: var(--bg-surface-card); border-radius: 8px; border: 1px solid var(--border-subtle);">
              <div>
                <div style="font-weight: 700; font-size: 0.8rem;">Studio Mic Voice Isolator</div>
                <div style="font-size: 0.68rem; color: var(--text-dim);">Cuts room echo, fan noise & HVAC rumble</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" ${voiceIsolator ? 'checked' : ''} id="toggle-editor-voice-iso">
                <span class="toggle-slider"></span>
              </label>
            </div>

            <!-- Voice Speed / Pacing Dial -->
            <div>
              <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-dim); margin-bottom: 4px;">Voice Speed Ramping</div>
              <div style="display: flex; gap: 0.35rem;">
                <button class="btn ${voiceSpeed === '1.0x' ? 'btn-primary' : 'btn-secondary'} btn-voice-speed" data-spd="1.0x" style="flex: 1; padding: 0.25rem; font-size: 0.72rem;">1.0x Natural</button>
                <button class="btn ${voiceSpeed === '1.05x' ? 'btn-primary' : 'btn-secondary'} btn-voice-speed" data-spd="1.05x" style="flex: 1; padding: 0.25rem; font-size: 0.72rem;">⚡ 1.05x Snappy</button>
                <button class="btn ${voiceSpeed === '1.15x' ? 'btn-primary' : 'btn-secondary'} btn-voice-speed" data-spd="1.15x" style="flex: 1; padding: 0.25rem; font-size: 0.72rem;">🔥 1.15x Fast</button>
              </div>
            </div>

            <!-- Sound FX Pack Selector -->
            <div>
              <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-dim); margin-bottom: 4px;">Sound Design (SFX Pack)</div>
              <select id="select-sfx-pack" class="form-select" style="font-size: 0.82rem;">
                <option value="beast_high_viral" ${sfxPack === 'beast_high_viral' ? 'selected' : ''}>💥 MrBeast High Viral (Bass Drops, Whooshes & Pops)</option>
                <option value="vox_documentary" ${sfxPack === 'vox_documentary' ? 'selected' : ''}>🎙️ Vox Documentary (Subtle Clicks & Paper Rustles)</option>
                <option value="clean_tech" ${sfxPack === 'clean_tech' ? 'selected' : ''}>💻 Clean Tech & UI Chimes</option>
                <option value="none" ${sfxPack === 'none' ? 'selected' : ''}>🚫 Mute All Sound FX</option>
              </select>
            </div>
          </div>

          <!-- Background Music Track Selection -->
          <div>
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-dim); margin-bottom: 4px;">Viral Background Music (BGM)</div>
            <select id="select-bgm-track" class="form-select" style="font-size: 0.82rem; margin-bottom: 0.5rem;">
              <option value="lofi_chill" ${bgMusicTrack === 'lofi_chill' ? 'selected' : ''}>☕ Lofi Chai & Focus Chill (Trending)</option>
              <option value="phonk_drift" ${bgMusicTrack === 'phonk_drift' ? 'selected' : ''}>🏎️ Brazilian Phonk High-Energy</option>
              <option value="synthwave_drive" ${bgMusicTrack === 'synthwave_drive' ? 'selected' : ''}>🌆 Midnight Tokyo Synthwave</option>
              <option value="upbeat_pop" ${bgMusicTrack === 'upbeat_pop' ? 'selected' : ''}>✨ Upbeat Viral Pop Beat</option>
              <option value="none" ${bgMusicTrack === 'none' ? 'selected' : ''}>🚫 No Background Music</option>
            </select>

            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-dim);">
              <span>BGM Volume Level</span>
              <span>${bgMusicVolume}%</span>
            </div>
            <input type="range" id="range-bgm-vol" min="10" max="100" value="${bgMusicVolume}" style="width: 100%; accent-color: var(--accent-primary);" />
          </div>
        </div>
      `;
    } else {
      // 7. Timeline Track
      return `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
            <strong style="font-size: 0.85rem;">🎞️ 4-Track Multi-Layer Timeline</strong>
            <span style="font-size: 0.7rem; color: var(--text-dim);">00:00 / 00:30</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.45rem; margin-bottom: 1rem;">
            
            <!-- Track 1: Video Cuts -->
            <div>
              <div style="font-size: 0.68rem; font-weight: 700; color: var(--text-dim); margin-bottom: 2px;">TRACK 1: 9:16 VIDEO CUTS & ZOOMS</div>
              <div class="timeline-track-bar">
                <div class="timeline-clip-block" style="left: 0%; width: 22%;">Scene 1 (Hook)</div>
                <div class="timeline-clip-block" style="left: 24%; width: 28%; background: #38bdf8;">Zoom 1.2x [Face]</div>
                <div class="timeline-clip-block" style="left: 54%; width: 22%; background: #a855f7;">Scene 2 [Cut]</div>
                <div class="timeline-clip-block" style="left: 78%; width: 20%; background: #39ff14;">Scene 3 [CTA]</div>
              </div>
            </div>

            <!-- Track 2: B-Roll Insert Layer -->
            <div>
              <div style="font-size: 0.68rem; font-weight: 700; color: var(--text-dim); margin-bottom: 2px;">TRACK 2: AI B-ROLL OVERLAYS & 3D EMOJIS</div>
              <div class="timeline-track-bar">
                <div class="timeline-clip-block" style="left: 28%; width: 18%; background: #ec4899;">🎭 B-Roll Cutaway</div>
                <div class="timeline-clip-block" style="left: 65%; width: 14%; background: #f59e0b;">🔥 3D Fire Pop</div>
              </div>
            </div>

            <!-- Track 3: Subtitles -->
            <div>
              <div style="font-size: 0.68rem; font-weight: 700; color: var(--text-dim); margin-bottom: 2px;">TRACK 3: DYNAMIC KARAOKE CAPTIONS</div>
              <div class="timeline-track-bar">
                <div class="timeline-clip-block" style="left: 0%; width: 30%; background: #fbbf24;">"STOP DOING THIS..."</div>
                <div class="timeline-clip-block" style="left: 32%; width: 35%; background: #fbbf24;">"THE #1 MISTAKE..."</div>
                <div class="timeline-clip-block" style="left: 69%; width: 30%; background: #fbbf24;">"FOLLOW FOR MORE"</div>
              </div>
            </div>

            <!-- Track 4: Audio Track -->
            <div>
              <div style="font-size: 0.68rem; font-weight: 700; color: var(--text-dim); margin-bottom: 2px;">TRACK 4: BGM & WHOOSH SFX</div>
              <div class="timeline-track-bar">
                <div class="timeline-clip-block" style="left: 0%; width: 98%; background: rgba(255,255,255,0.2); color: #fff;">
                  🎵 ${bgMusicTrack.replace('_', ' ').toUpperCase()} (Voice Ducking -12dB)
                </div>
              </div>
            </div>

          </div>

          <div style="background: var(--bg-surface-card); padding: 0.5rem 0.75rem; border-radius: 8px; font-size: 0.72rem; color: var(--text-muted); line-height: 1.35;">
            💡 <strong>AI Pacing Optimization:</strong> Automatically trimmed 8 dead pauses (-4.2s total) to maintain 92% viewer retention score.
          </div>
        </div>
      `;
    }
  }

  // ==========================================
  // 3. AI IMAGE & CAROUSEL STUDIO HTML GENERATOR
  // ==========================================
  function renderImageStudioHtml() {
    const currentTheme = getThemeObject(selectedImageTheme);

    let aspectWidth = '440px';
    let aspectHeight = '440px';
    if (selectedAspectRatio === '4:5') {
      aspectWidth = '380px';
      aspectHeight = '475px';
    } else if (selectedAspectRatio === '16:9') {
      aspectWidth = '480px';
      aspectHeight = '270px';
    }

    return `
      <div class="bento-grid" style="margin-bottom: 2rem;">
        <!-- Left: Live Graphic Card Canvas -->
        <div class="card" style="grid-column: span 7; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 540px; background: var(--bg-surface-low); position: relative; padding: 2rem 1rem;">
          
          <!-- Target Platform & Format Indicator Tabs on Canvas -->
          <div style="display: flex; gap: 0.4rem; align-items: center; margin-bottom: 1.25rem; z-index: 10; flex-wrap: wrap; justify-content: center;">
            <button class="btn ${selectedImageTemplate === 'instagram' ? 'btn-primary' : 'btn-secondary'} btn-template-select" data-template="instagram" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; border-radius: 999px;">
              📸 Instagram Post (Overlay)
            </button>
            <button class="btn ${selectedImageTemplate === 'linkedin' ? 'btn-primary' : 'btn-secondary'} btn-template-select" data-template="linkedin" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; border-radius: 999px;">
              💼 LinkedIn Post (Split)
            </button>
            <button class="btn ${selectedImageTemplate === 'tweet' ? 'btn-primary' : 'btn-secondary'} btn-template-select" data-template="tweet" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; border-radius: 999px;">
              𝕏 Tweet Card
            </button>
            <button class="btn ${selectedImageTemplate === 'carousel' ? 'btn-primary' : 'btn-secondary'} btn-template-select" data-template="carousel" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; border-radius: 999px;">
              📊 Carousel Slide
            </button>
            <button class="btn ${selectedImageTemplate === 'quote' ? 'btn-primary' : 'btn-secondary'} btn-template-select" data-template="quote" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; border-radius: 999px;">
              ✨ Editorial Quote
            </button>
          </div>

          <!-- Dynamic Visual Graphic Card Element -->
          <div id="live-graphic-canvas" style="width: ${aspectWidth}; min-height: ${aspectHeight}; max-width: 100%; border: 2px solid ${currentTheme.border}; border-radius: 18px; box-shadow: 0 16px 40px rgba(0,0,0,0.35); position: relative; overflow: hidden; display: flex; flex-direction: column; transition: all 0.25s ease;">
            ${renderGraphicCanvasContent(currentTheme, selectedBgObj)}
          </div>

          <!-- Quick Canvas Actions -->
          <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem; flex-wrap: wrap; justify-content: center;">
            <button id="btn-download-image" class="btn btn-primary" style="padding: 0.55rem 1.25rem; font-size: 0.85rem;">
              <span>💾 Export High-Res PNG (300 DPI)</span>
            </button>
            <button id="btn-random-bg-canvas" class="btn btn-secondary" style="padding: 0.55rem 1rem; font-size: 0.85rem;">
              <span>🎲 Randomize Photo</span>
            </button>
            <button id="btn-copy-image" class="btn btn-secondary" style="padding: 0.55rem 1rem; font-size: 0.85rem;">
              <span>📋 Copy Image & Text</span>
            </button>
          </div>
        </div>

        <!-- Right: Background Photography, Layout, Content & Theme Controls -->
        <div class="card" style="grid-column: span 5; display: flex; flex-direction: column; gap: 1.15rem;">
          
          <!-- 1. Background Photography Preset Selector with Refresh Button -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem;">
              <div style="display: flex; align-items: center; gap: 0.4rem;">
                <strong style="font-size: 0.88rem;">🖼️ Background Photography</strong>
                <span class="badge badge-neon" style="font-size: 0.6rem;">AI CURATED</span>
              </div>
              
              <!-- Refresh Background Photos CTA -->
              <button id="btn-refresh-bgs" class="btn btn-regenerate" style="padding: 0.25rem 0.65rem; font-size: 0.72rem; border-radius: 999px;" title="Shuffle 6 new high-res photos">
                <span id="refresh-bg-icon">🔄</span>
                <span>Refresh Photos</span>
              </button>
            </div>

            <!-- Background Grid (6 Active Items) -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.4rem;" id="bg-selector-grid">
              ${currentDisplayedBgs.map(bg => {
                const isActive = selectedBgObj && selectedBgObj.id === bg.id;
                return `
                  <button class="btn ${isActive ? 'btn-primary' : 'btn-secondary'} btn-bg-select" data-bg-id="${bg.id}" style="padding: 0.4rem; font-size: 0.72rem; display: flex; flex-direction: column; align-items: center; gap: 2px; text-align: center; overflow: hidden;">
                    <span style="font-weight: 700; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; max-width: 100%;">${bg.tag}</span>
                    <span style="font-size: 0.62rem; opacity: 0.8;">${bg.name.split(' ')[0]}</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <!-- 2. Aspect Ratio Selection -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <strong style="font-size: 0.85rem;">Aspect Ratio</strong>
              <span style="font-size: 0.7rem; color: var(--text-dim);">Instagram (1:1 / 4:5) • 𝕏 / LinkedIn (16:9)</span>
            </div>
            <div style="display: flex; gap: 0.4rem;">
              <button class="btn ${selectedAspectRatio === '1:1' ? 'btn-primary' : 'btn-secondary'} btn-ratio-select" data-ratio="1:1" style="flex: 1; padding: 0.35rem; font-size: 0.78rem;">
                1:1 Square
              </button>
              <button class="btn ${selectedAspectRatio === '4:5' ? 'btn-primary' : 'btn-secondary'} btn-ratio-select" data-ratio="4:5" style="flex: 1; padding: 0.35rem; font-size: 0.78rem;">
                4:5 Portrait
              </button>
              <button class="btn ${selectedAspectRatio === '16:9' ? 'btn-primary' : 'btn-secondary'} btn-ratio-select" data-ratio="16:9" style="flex: 1; padding: 0.35rem; font-size: 0.78rem;">
                16:9 Landscape
              </button>
            </div>
          </div>

          <!-- 3. Color Aesthetic Themes -->
          <div>
            <strong style="font-size: 0.85rem; display: block; margin-bottom: 0.35rem;">Color Palette Theme</strong>
            <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
              <button class="btn ${selectedImageTheme === 'sahara' ? 'btn-primary' : 'btn-secondary'} btn-theme-select" data-theme-val="sahara" style="padding: 0.28rem 0.65rem; font-size: 0.72rem; border-radius: 999px;">
                ☀️ Sahara Linen
              </button>
              <button class="btn ${selectedImageTheme === 'midnight' ? 'btn-primary' : 'btn-secondary'} btn-theme-select" data-theme-val="midnight" style="padding: 0.28rem 0.65rem; font-size: 0.72rem; border-radius: 999px;">
                🌌 Midnight Cyan
              </button>
              <button class="btn ${selectedImageTheme === 'emerald' ? 'btn-primary' : 'btn-secondary'} btn-theme-select" data-theme-val="emerald" style="padding: 0.28rem 0.65rem; font-size: 0.72rem; border-radius: 999px;">
                🌿 Forest Emerald
              </button>
              <button class="btn ${selectedImageTheme === 'amber' ? 'btn-primary' : 'btn-secondary'} btn-theme-select" data-theme-val="amber" style="padding: 0.28rem 0.65rem; font-size: 0.72rem; border-radius: 999px;">
                🔥 Amber Heat
              </button>
              <button class="btn ${selectedImageTheme === 'monolith' ? 'btn-primary' : 'btn-secondary'} btn-theme-select" data-theme-val="monolith" style="padding: 0.28rem 0.65rem; font-size: 0.72rem; border-radius: 999px;">
                ⬛ Monolith Dark
              </button>
            </div>
          </div>

          <!-- 4. Content Copy Inputs -->
          <div style="display: flex; flex-direction: column; gap: 0.6rem;">
            <div>
              <label style="font-size: 0.78rem; font-weight: 700; color: var(--text-dim); display: block; margin-bottom: 3px;">
                Headline / Main Hook Statement
              </label>
              <textarea id="input-image-headline" class="form-textarea" rows="2" style="font-size: 0.85rem; resize: vertical;">${imageHeadline}</textarea>
            </div>

            <div>
              <label style="font-size: 0.78rem; font-weight: 700; color: var(--text-dim); display: block; margin-bottom: 3px;">
                Supporting Text / Tactical Takeaway
              </label>
              <textarea id="input-image-body" class="form-textarea" rows="2" style="font-size: 0.85rem; resize: vertical;">${imageBody}</textarea>
            </div>
          </div>

          <!-- Generate 6-Platform Social Posts CTA -->
          <button id="btn-generate-image-socials" class="btn btn-primary" style="padding: 0.8rem; width: 100%; font-size: 0.95rem;">
            <span>⚡ Atomize to 6 Platforms</span>
          </button>
        </div>
      </div>

      <!-- 6-Platform Deck for Static Graphics & Carousels with Full Tags & Emojis -->
      <div id="image-atomizer-deck" style="display: block; margin-top: 2.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 style="font-size: 1.5rem;">📱 6-Platform Social Post Deck (Rich Copy, Tags & Emojis)</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem;">Platform-accurate copy, structured hooks, discussion prompts, and complete hashtag stacks.</p>
          </div>

          <button id="btn-publish-image-all" class="btn btn-primary" style="padding: 0.65rem 1.35rem; font-size: 0.9rem;">
            <span>🚀 1-Click Publish to All 6 Channels</span>
          </button>
        </div>

        <div class="bento-grid">
          ${renderPlatformSocialCards('image')}
        </div>
      </div>
    `;
  }

  // ==========================================
  // 4. GRAPHIC CANVAS CONTENT BUILDER
  // ==========================================
  function renderGraphicCanvasContent(theme, bgObj) {
    const hasBgImage = bgObj && bgObj.url && bgObj.url.length > 0;
    const bgStyle = hasBgImage ? `background: url('${bgObj.url}') center/cover no-repeat;` : `background: ${theme.bg};`;

    if (selectedImageTemplate === 'instagram') {
      return `
        <div style="position: absolute; inset: 0; ${bgStyle} z-index: 1;"></div>
        <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.72) 100%); z-index: 2;"></div>

        <div style="position: relative; z-index: 10; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 0.5rem; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); padding: 4px 10px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.15);">
              <div style="width: 22px; height: 22px; border-radius: 50%; background: ${theme.accent}; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #fff; font-size: 0.72rem;">
                ${(profile.fullName || 'C').charAt(0)}
              </div>
              <span style="font-size: 0.75rem; font-weight: 700; color: #fff;">@${profile.instagramHandle ? profile.instagramHandle.replace('@', '') : 'creator'}</span>
            </div>
            <span class="badge badge-neon" style="font-size: 0.65rem;">INSIGHT</span>
          </div>

          <div style="background: rgba(10, 12, 16, 0.82); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(255,255,255,0.18); border-radius: 16px; padding: 1.35rem; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="color: #ffffff; font-size: 1.15rem; font-weight: 800; line-height: 1.35; font-family: 'Montserrat', 'Inter', sans-serif; margin-bottom: 0.65rem; text-shadow: 0 2px 6px rgba(0,0,0,0.6);">
              ${imageHeadline}
            </div>
            <div style="color: #cbd5e1; font-size: 0.85rem; line-height: 1.45; font-family: 'Inter', sans-serif;">
              ${imageBody}
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; color: #fff; font-size: 0.75rem;">
            <span style="background: rgba(0,0,0,0.5); padding: 2px 8px; border-radius: 6px;">📌 Swipe & Save</span>
            ${getWatermarkHtml()}
          </div>
        </div>
      `;
    } else if (selectedImageTemplate === 'linkedin') {
      return `
        <div style="height: 100%; display: flex; flex-direction: column; background: ${theme.cardBg}; border-radius: 16px; overflow: hidden; position: relative;">
          <div style="height: 150px; width: 100%; ${bgStyle} position: relative; border-bottom: 2px solid ${theme.border};">
            <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%);"></div>
            
            <div style="position: absolute; top: 12px; left: 12px; z-index: 10;">
              <span class="badge badge-purple" style="font-size: 0.65rem;">💼 THOUGHT LEADERSHIP</span>
            </div>

            <div style="position: absolute; bottom: 10px; left: 12px; z-index: 10; display: flex; align-items: center; gap: 0.5rem;">
              <div style="width: 28px; height: 28px; border-radius: 50%; background: ${theme.accent}; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #fff; font-size: 0.8rem; border: 2px solid #fff;">
                ${(profile.fullName || 'C').charAt(0)}
              </div>
              <div>
                <div style="color: #fff; font-weight: 700; font-size: 0.8rem; text-shadow: 0 1px 3px rgba(0,0,0,0.8);">${profile.fullName || 'Creator Name'}</div>
                <div style="color: #e2e8f0; font-size: 0.65rem; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">Founder & Creator</div>
              </div>
            </div>
          </div>

          <div style="flex: 1; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; background: ${theme.cardBg}; color: ${theme.text};">
            <div>
              <div style="font-size: 1.05rem; font-weight: 800; line-height: 1.4; color: ${theme.text}; font-family: 'Inter', sans-serif; margin-bottom: 0.6rem;">
                ${imageHeadline}
              </div>

              <div style="background: rgba(0,0,0,0.04); border-left: 3px solid ${theme.accent}; padding: 0.65rem 0.85rem; border-radius: 6px; font-size: 0.82rem; line-height: 1.4; color: ${theme.muted};">
                💡 <strong>Core Takeaway:</strong> ${imageBody}
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid ${theme.border}; padding-top: 0.65rem; margin-top: 0.75rem; font-size: 0.72rem; color: ${theme.muted};">
              <span>PDF Slide Document</span>
              ${getWatermarkHtml()}
            </div>
          </div>
        </div>
      `;
    } else if (selectedImageTemplate === 'tweet') {
      return `
        <div style="position: absolute; inset: 0; ${hasBgImage ? `background: url('${bgObj.url}') center/cover no-repeat; opacity: 0.15; filter: blur(2px);` : ''} z-index: 1;"></div>
        
        <div style="position: relative; z-index: 10; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 1.5rem; background: ${theme.bg}; color: ${theme.text};">
          <div>
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.15rem;">
              <div style="width: 44px; height: 44px; border-radius: 50%; background: ${theme.accent}; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #fff; font-size: 1.1rem; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                ${(profile.fullName || 'Creator').charAt(0)}
              </div>
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 4px;">
                  <strong style="color: ${theme.text}; font-size: 0.95rem; font-family: 'Manrope', 'Inter', sans-serif;">${profile.fullName || 'Creator Name'}</strong>
                  <span style="color: ${theme.accent}; font-size: 0.95rem;">☑️</span>
                </div>
                <div style="color: ${theme.muted}; font-size: 0.78rem; font-family: monospace;">
                  @${profile.instagramHandle ? profile.instagramHandle.replace('@', '') : 'creator'}
                </div>
              </div>
              <div style="font-size: 1.1rem; color: ${theme.muted};">𝕏</div>
            </div>

            <div style="color: ${theme.text}; font-size: 1.08rem; font-weight: 700; line-height: 1.45; font-family: 'Inter', sans-serif; margin-bottom: 0.85rem;">
              ${imageHeadline}
            </div>

            <div style="color: ${theme.muted}; font-size: 0.88rem; line-height: 1.45; font-family: 'Inter', sans-serif;">
              ${imageBody}
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid ${theme.border}; padding-top: 0.85rem; margin-top: 1rem; color: ${theme.muted}; font-size: 0.75rem;">
            <div style="display: flex; gap: 0.75rem;">
              <span>❤️ 2.4K</span>
              <span>🔁 640</span>
              <span>🔖 1.8K</span>
            </div>
            ${getWatermarkHtml()}
          </div>
        </div>
      `;
    } else if (selectedImageTemplate === 'carousel') {
      return `
        <div style="height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 1.5rem; background: ${theme.bg}; color: ${theme.text}; position: relative;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <span style="font-weight: 800; font-size: 0.75rem; color: ${theme.accent}; letter-spacing: 0.08em; text-transform: uppercase;">
                SLIDE ${carouselSlideNum} OF ${totalCarouselSlides}
              </span>
              <span style="font-size: 0.75rem; color: ${theme.muted};">@${profile.instagramHandle ? profile.instagramHandle.replace('@', '') : 'creator'}</span>
            </div>

            <div style="color: ${theme.text}; font-size: 1.15rem; font-weight: 800; line-height: 1.35; margin-bottom: 0.85rem; font-family: 'Montserrat', 'Inter', sans-serif;">
              ${imageHeadline}
            </div>

            ${hasBgImage ? `
              <div style="height: 110px; width: 100%; ${bgStyle} border-radius: 10px; margin-bottom: 0.85rem; border: 1px solid ${theme.border};"></div>
            ` : ''}

            <div style="background: rgba(0,0,0,0.05); padding: 0.75rem 0.95rem; border-radius: 10px; border-left: 3px solid ${theme.accent};">
              <div style="color: ${theme.text}; font-size: 0.85rem; line-height: 1.45;">
                👉 ${imageBody}
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; border-top: 1px solid ${theme.border}; padding-top: 0.75rem;">
            <span style="font-size: 0.72rem; color: ${theme.muted};">Save for later 📌</span>
            <span style="font-size: 0.8rem; font-weight: 800; color: ${theme.accent}; display: flex; align-items: center; gap: 4px;">
              SWIPE 👉
            </span>
          </div>
          ${getWatermarkHtml()}
        </div>
      `;
    } else {
      return `
        <div style="position: absolute; inset: 0; ${hasBgImage ? `background: url('${bgObj.url}') center/cover no-repeat; opacity: 0.18; filter: blur(2px);` : ''} z-index: 1;"></div>

        <div style="position: relative; z-index: 10; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 1.75rem; background: ${theme.bg}; color: ${theme.text};">
          <div>
            <div style="font-size: 3.5rem; line-height: 1; color: ${theme.accent}; font-family: 'EB Garamond', serif; opacity: 0.85; margin-bottom: 0.25rem;">
              “
            </div>

            <div style="color: ${theme.text}; font-size: 1.25rem; font-weight: 700; line-height: 1.4; font-family: 'EB Garamond', 'Montserrat', serif; margin-bottom: 1rem;">
              ${imageHeadline}
            </div>

            <div style="color: ${theme.muted}; font-size: 0.92rem; line-height: 1.5; font-style: italic;">
              ${imageBody}
            </div>
          </div>

          <div style="border-top: 2px solid ${theme.accent}; padding-top: 0.75rem; margin-top: 1.25rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: ${theme.text}; font-size: 0.88rem; display: block;">— ${profile.fullName || 'Creator'}</strong>
              <span style="color: ${theme.muted}; font-size: 0.72rem;">@${profile.instagramHandle ? profile.instagramHandle.replace('@', '') : 'creator'}</span>
            </div>
            ${getWatermarkHtml()}
          </div>
        </div>
      `;
    }
  }

  // ==========================================
  // 5. PLATFORM SOCIAL CARDS GENERATOR
  // ==========================================
  function renderPlatformSocialCards(mode) {
    const cards = [
      {
        platform: '📸 Instagram',
        badge: mode === 'video' ? '9:16 REEL' : 'CAROUSEL & POST',
        badgeClass: 'badge-neon',
        title: 'Instagram Post / Reel',
        hook: `🪝 "${imageHeadline}"`,
        body: `📌 Here is the 3-step breakdown you need to stop wasting hours on manual editing:\n\n1️⃣ Batch raw ideas when creative flow is high\n2️⃣ Let AI handle auto-transcription & formatting\n3️⃣ Atomize across 6 channels simultaneously\n\n👇 Save this post for your next content batch! Which part of your workflow takes the most time? Let me know in the comments.`,
        tags: '#contentcreator #solopreneur #creatoreconomy #socialmediatips #instagramgrowth #contentstrategy #productivityhacks #buildinpublic #viralcontent #reelsstrategy #creatortips #growthmindset'
      },
      {
        platform: '💼 LinkedIn',
        badge: 'THOUGHT LEADERSHIP',
        badgeClass: 'badge-purple',
        title: 'LinkedIn Insight & Document',
        hook: `💡 Most creators and solopreneurs spend 80% of their energy on low-leverage execution.`,
        body: `The creators scaling sustainably in 2026 aren't working 14 hours a day. They build systems that compound.\n\n🎯 Key takeaway:\n"${imageHeadline}"\n\n${imageBody}\n\n💬 How is your team automating repetitive content workflows this year?`,
        tags: '#CreatorEconomy #Leadership #Productivity #AIWorkflows #MarketingStrategy #Entrepreneurship #PersonalBranding'
      },
      {
        platform: '𝕏 (Twitter)',
        badge: 'VIRAL THREAD',
        badgeClass: 'badge-cyan',
        title: '𝕏 Tweet & Thread Opener',
        hook: `🧵 Nobody is talking about the real reason most creators burn out in 2026.`,
        body: `${imageHeadline}\n\n${imageBody}\n\nHere is the exact framework 🧵👇`,
        tags: '#buildinpublic #solopreneur #creators #productivity'
      },
      {
        platform: '🧵 Threads',
        badge: 'CONVERSATIONAL',
        badgeClass: 'badge-neon',
        title: 'Threads Conversation Note',
        hook: `☕ Honest creator check-in:`,
        body: `"${imageHeadline}"\n\nAgree or disagree with this take? 🤔\n\nDrop your thoughts below 👇`,
        tags: '#threads #creators #productivity #relatable'
      },
      {
        platform: '👥 Facebook',
        badge: 'MASS ENGAGEMENT',
        badgeClass: 'badge-purple',
        title: 'Facebook Community Post',
        hook: `🚀 A quick reminder for anyone building online right now!`,
        body: `${imageHeadline}\n\n${imageBody}\n\n🙌 Share this with a fellow creator or business owner who needs to see this today!`,
        tags: '#contentcreators #digitalmarketing #businessgrowth #creatorhacks'
      },
      {
        platform: '▶️ YouTube Community',
        badge: 'COMMUNITY & POLL',
        badgeClass: 'badge-cyan',
        title: 'YouTube Community Update',
        hook: `🎬 Quick behind-the-scenes creator note:`,
        body: `${imageHeadline}\n\nFull deep-dive video breakdown drops this Thursday! 🔔 Make sure your notifications are turned on.\n\nWhat topic should we tackle next?`,
        tags: '#CreatorStudio #Shorts #ProductionHacks #NewVideo'
      }
    ];

    return cards.map(c => `
      <div class="card" style="grid-column: span 4; display: flex; flex-direction: column; justify-content: space-between; min-height: 320px;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem;">
            <div style="font-weight: 700; font-size: 0.95rem;">${c.platform}</div>
            <span class="badge ${c.badgeClass}">${c.badge}</span>
          </div>

          <div style="background: var(--bg-surface-low); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 0.85rem; font-size: 0.8rem; color: var(--text-main); margin-bottom: 0.75rem; line-height: 1.45; max-height: 200px; overflow-y: auto;">
            <div style="font-weight: 700; margin-bottom: 0.35rem; color: var(--accent-primary);">${c.hook}</div>
            <div style="white-space: pre-line; margin-bottom: 0.5rem; color: var(--text-main);">${c.body}</div>
            <div style="color: var(--accent-cyan); font-size: 0.72rem; word-break: break-word; line-height: 1.35; border-top: 1px solid var(--border-subtle); padding-top: 0.4rem;">
              ${c.tags}
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 0.4rem;">
          <button class="btn btn-secondary btn-copy-platform-text" data-copy="${encodeURIComponent(c.hook + '\n\n' + c.body + '\n\n' + c.tags)}" style="flex: 1; font-size: 0.75rem; padding: 0.35rem;">
            <span>📋 Copy Post & Tags</span>
          </button>
        </div>
      </div>
    `).join('');
  }

  // ==========================================
  // 6. EVENT BINDINGS & SUBTITLE LOGIC
  // ==========================================
  function attachModeEvents() {
    const tabVideo = container.querySelector('#tab-mode-video');
    const tabImage = container.querySelector('#tab-mode-image');

    if (tabVideo) {
      tabVideo.addEventListener('click', () => {
        activeStudioMode = 'video';
        renderMain();
      });
    }

    if (tabImage) {
      tabImage.addEventListener('click', () => {
        activeStudioMode = 'image';
        renderMain();
      });
    }

    container.querySelectorAll('.btn-copy-platform-text').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = decodeURIComponent(btn.getAttribute('data-copy') || '');
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text);
        }
        btn.classList.add('btn-primary');
        btn.innerHTML = '<span>✅ Copied with Tags!</span>';
        setTimeout(() => {
          btn.classList.remove('btn-primary');
          btn.innerHTML = '<span>📋 Copy Post & Tags</span>';
        }, 1800);
      });
    });
  }

  function updateSubtitleText() {
    const subBox = container.querySelector('#subtitle-preview-box');
    if (!subBox) return;

    if (!isAutoEdited) {
      subBox.style.display = 'none';
      return;
    }
    subBox.style.display = 'block';

    const words = liveTranscriptText.split(' ');
    const firstPart = words.slice(0, Math.ceil(words.length / 2)).join(' ');
    const lastPart = words.slice(Math.ceil(words.length / 2)).join(' ');

    if (selectedSubtitlePreset === 'beast') {
      subBox.innerHTML = `
        <div style="display: inline-block; background: rgba(0, 0, 0, 0.92); backdrop-filter: blur(12px); border: 2px solid #39ff14; border-radius: 14px; padding: 8px 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.9); max-width: 90%;">
          <div style="font-size: ${subtitleFontSize}; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 0.02em; font-family: 'Montserrat', sans-serif; line-height: 1.25;">
            ${firstPart} <span style="color: #000000; background: #39ff14; padding: 2px 8px; border-radius: 6px; display: inline-block; transform: rotate(-2deg); font-weight: 900; box-shadow: 0 0 14px #39ff14;">${lastPart}</span> 🔥
          </div>
        </div>
      `;
    } else if (selectedSubtitlePreset === 'hormozi') {
      subBox.innerHTML = `
        <div style="display: inline-block; background: rgba(0, 0, 0, 0.92); backdrop-filter: blur(12px); border: 2px solid #fbbf24; border-radius: 14px; padding: 8px 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.9); max-width: 90%;">
          <div style="font-size: ${subtitleFontSize}; font-weight: 900; color: #ffffff; text-transform: uppercase; font-family: 'Montserrat', sans-serif; line-height: 1.25;">
            ${firstPart} <span style="color: #000000; background: #fbbf24; padding: 2px 8px; border-radius: 6px; font-weight: 900; display: inline-block; box-shadow: 0 0 14px #fbbf24;">${lastPart}</span> ⚡
          </div>
        </div>
      `;
    } else if (selectedSubtitlePreset === 'ali_abdaal') {
      subBox.innerHTML = `
        <div style="display: inline-block; background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(12px); border: 1.5px solid #38bdf8; border-radius: 12px; padding: 8px 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.8); max-width: 90%;">
          <div style="font-size: ${subtitleFontSize}; font-weight: 800; color: #f8fafc; font-family: 'Inter', sans-serif; line-height: 1.3;">
            "${firstPart} <span style="color: #38bdf8; text-decoration: underline;">${lastPart}</span>" 💡
          </div>
        </div>
      `;
    } else {
      subBox.innerHTML = `
        <div style="display: inline-block; background: rgba(10, 14, 23, 0.88); backdrop-filter: blur(12px); border: 1.5px solid rgba(255, 255, 255, 0.4); border-radius: 12px; padding: 8px 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.8); max-width: 90%;">
          <div style="font-size: ${subtitleFontSize}; font-weight: 600; color: #ffffff; font-style: italic; font-family: 'EB Garamond', serif; text-shadow: 0 2px 4px rgba(0,0,0,0.9); line-height: 1.35;">
            "${liveTranscriptText}"
          </div>
        </div>
      `;
    }
  }

  function attachVideoEvents() {
    updateSubtitleText();

    const fileInput = container.querySelector('#video-file-input');
    const btnBrowse = container.querySelector('#btn-browse-file');
    const btnSample = container.querySelector('#btn-sample-video');
    const dropZone = container.querySelector('#drop-zone');
    const btnChangeVideo = container.querySelector('#btn-change-video');
    const btnPlayPause = container.querySelector('#btn-play-pause');
    const btnRunAutoEdit = container.querySelector('#btn-run-auto-edit');
    const btnRevertRaw = container.querySelector('#btn-revert-raw');
    const btnToggleGrid = container.querySelector('#btn-toggle-grid');

    function loadVideoFile(file) {
      if (!file) return;
      currentFileName = file.name || 'uploaded_video.mp4';
      const objectUrl = URL.createObjectURL(file);
      currentVideoUrl = objectUrl;
      isVideoUploaded = true;
      isAutoEdited = false; // Starts in Raw state!
      renderMain();
    }

    function triggerSampleVideo() {
      isVideoUploaded = true;
      isAutoEdited = false; // Starts in Raw state!
      currentFileName = 'sample_4k_creator_footage.mp4';
      renderMain();
    }

    // Play/Pause Action
    if (btnPlayPause) {
      btnPlayPause.addEventListener('click', () => {
        const videoTag = container.querySelector('#player-video-tag');
        if (videoTag) {
          if (videoTag.paused) {
            videoTag.play();
            btnPlayPause.textContent = '❚❚';
          } else {
            videoTag.pause();
            btnPlayPause.textContent = '▶';
          }
        } else {
          isPlaying = !isPlaying;
          btnPlayPause.textContent = isPlaying ? '❚❚' : '▶';
        }
      });
    }

    // Toggle 9:16 Safe Zone Grid
    if (btnToggleGrid) {
      btnToggleGrid.addEventListener('click', () => {
        showSafeZoneGrid = !showSafeZoneGrid;
        const grid = container.querySelector('#safe-zone-overlay');
        if (grid) grid.style.display = showSafeZoneGrid ? 'flex' : 'none';
        btnToggleGrid.classList.toggle('btn-primary', showSafeZoneGrid);
      });
    }

    // RUN AI AUTO-EDIT (Transform into Super Reel)
    if (btnRunAutoEdit) {
      btnRunAutoEdit.addEventListener('click', () => {
        btnRunAutoEdit.disabled = true;
        btnRunAutoEdit.innerHTML = `<span>⏳ AI Editing: Trimming Dead Silence & Synching Captions...</span>`;

        setTimeout(() => {
          isAutoEdited = true;
          renderMain();
          alert('⚡ Super Reel Generated! AI trimmed 8 dead silence pauses (-4.2s), generated kinetic karaoke captions, applied 9:16 Smart Face tracking, and enhanced voice presence.');
        }, 800);
      });
    }

    // Revert to Raw
    if (btnRevertRaw) {
      btnRevertRaw.addEventListener('click', () => {
        isAutoEdited = false;
        renderMain();
      });
    }

    // File Browse and Change
    if (btnBrowse && fileInput) {
      btnBrowse.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
      });
    }

    if (btnChangeVideo && fileInput) {
      btnChangeVideo.addEventListener('click', () => {
        fileInput.click();
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          loadVideoFile(e.target.files[0]);
        }
      });
    }

    if (dropZone) {
      dropZone.addEventListener('click', () => {
        if (fileInput) fileInput.click();
      });

      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--accent-primary)';
        dropZone.style.background = 'var(--bg-surface-high)';
      });

      dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--border-glass)';
        dropZone.style.background = 'var(--bg-surface-low)';
      });

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--border-glass)';
        dropZone.style.background = 'var(--bg-surface-low)';
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          loadVideoFile(e.dataTransfer.files[0]);
        }
      });
    }

    if (btnSample) btnSample.addEventListener('click', triggerSampleVideo);

    // Watermark Toggle with Pro Payment Trigger
    const watermarkToggle = container.querySelector('#toggle-watermark');
    const watermarkOverlay = container.querySelector('#watermark-overlay');

    if (watermarkToggle) {
      watermarkToggle.addEventListener('change', (e) => {
        if (!e.target.checked && !profile.isPro) {
          openProModal({
            onSuccess: () => {
              if (watermarkToggle) watermarkToggle.checked = false;
              if (watermarkOverlay) watermarkOverlay.style.display = 'none';
            },
            onCancel: () => {
              if (watermarkToggle) watermarkToggle.checked = true;
              stateStore.updateProfile({ includeWatermark: true });
              if (watermarkOverlay) watermarkOverlay.style.display = 'flex';
            }
          });
        } else {
          stateStore.updateProfile({ includeWatermark: e.target.checked });
          if (watermarkOverlay) watermarkOverlay.style.display = e.target.checked ? 'flex' : 'none';
        }
      });
    }

    // CapCut Editor Sub-Tabs
    container.querySelectorAll('.editor-subtab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeEditorTab = btn.getAttribute('data-tab');
        renderMain();
      });
    });

    // Subtitle Style Selectors
    container.querySelectorAll('.subtitle-card').forEach(card => {
      card.addEventListener('click', () => {
        selectedSubtitlePreset = card.getAttribute('data-sub');
        renderMain();
      });
    });

    // Live Transcript Text Input
    const inputTranscript = container.querySelector('#input-transcript-text');
    if (inputTranscript) {
      inputTranscript.addEventListener('input', (e) => {
        liveTranscriptText = e.target.value;
        updateSubtitleText();
      });
    }

    // Subtitle Position Selectors
    container.querySelectorAll('.btn-sub-pos').forEach(btn => {
      btn.addEventListener('click', () => {
        subtitlePosition = btn.getAttribute('data-pos');
        renderMain();
      });
    });

    // Subtitle Font Size Range
    const rangeSubSize = container.querySelector('#range-sub-size');
    if (rangeSubSize) {
      rangeSubSize.addEventListener('input', (e) => {
        subtitleFontSize = `${e.target.value}rem`;
        const label = container.querySelector('#label-sub-size');
        if (label) label.textContent = subtitleFontSize;
        updateSubtitleText();
      });
    }

    // B-Roll & Emojis Toggles
    const toggleBroll = container.querySelector('#toggle-broll-inserts');
    if (toggleBroll) {
      toggleBroll.addEventListener('change', (e) => {
        bRollEnabled = e.target.checked;
        renderMain();
      });
    }

    const toggleEmoji = container.querySelector('#toggle-emoji-popups');
    if (toggleEmoji) {
      toggleEmoji.addEventListener('change', (e) => {
        emojiPopupsEnabled = e.target.checked;
        renderMain();
      });
    }

    const selectBrollPack = container.querySelector('#select-broll-pack');
    if (selectBrollPack) {
      selectBrollPack.addEventListener('change', (e) => {
        bRollType = e.target.value;
      });
    }

    // Filter Selectors
    container.querySelectorAll('.btn-select-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedFilter = btn.getAttribute('data-filter');
        renderMain();
      });
    });

    // Pro Color Adjustments Sliders
    const rangeBright = container.querySelector('#range-brightness');
    if (rangeBright) {
      rangeBright.addEventListener('input', (e) => {
        colorBrightness = parseInt(e.target.value);
        const media = container.querySelector('#video-media-container');
        if (media) {
          media.style.filter = `brightness(${colorBrightness}%) contrast(${colorContrast}%) saturate(${colorSaturation}%)`;
        }
      });
    }

    const rangeContrast = container.querySelector('#range-contrast');
    if (rangeContrast) {
      rangeContrast.addEventListener('input', (e) => {
        colorContrast = parseInt(e.target.value);
        const media = container.querySelector('#video-media-container');
        if (media) {
          media.style.filter = `brightness(${colorBrightness}%) contrast(${colorContrast}%) saturate(${colorSaturation}%)`;
        }
      });
    }

    const rangeSat = container.querySelector('#range-saturation');
    if (rangeSat) {
      rangeSat.addEventListener('input', (e) => {
        colorSaturation = parseInt(e.target.value);
        const media = container.querySelector('#video-media-container');
        if (media) {
          media.style.filter = `brightness(${colorBrightness}%) contrast(${colorContrast}%) saturate(${colorSaturation}%)`;
        }
      });
    }

    // Effect Selectors
    container.querySelectorAll('.btn-select-effect').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedEffect = btn.getAttribute('data-effect');
        renderMain();
      });
    });

    // Motion Blur Toggle
    const toggleMotionBlur = container.querySelector('#toggle-motion-blur');
    if (toggleMotionBlur) {
      toggleMotionBlur.addEventListener('change', (e) => {
        motionBlurEnabled = e.target.checked;
      });
    }

    // Transition Selectors
    container.querySelectorAll('.btn-select-transition').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedTransition = btn.getAttribute('data-transition');
        renderMain();
      });
    });

    // Pacing Selectors
    container.querySelectorAll('.btn-select-pacing').forEach(btn => {
      btn.addEventListener('click', () => {
        cutPacing = btn.getAttribute('data-pacing');
        renderMain();
      });
    });

    // Audio Controls
    const toggleVoiceIso = container.querySelector('#toggle-editor-voice-iso');
    if (toggleVoiceIso) {
      toggleVoiceIso.addEventListener('change', (e) => {
        voiceIsolator = e.target.checked;
      });
    }

    container.querySelectorAll('.btn-voice-speed').forEach(btn => {
      btn.addEventListener('click', () => {
        voiceSpeed = btn.getAttribute('data-spd');
        renderMain();
      });
    });

    const selectSfx = container.querySelector('#select-sfx-pack');
    if (selectSfx) {
      selectSfx.addEventListener('change', (e) => {
        sfxPack = e.target.value;
      });
    }

    const selectBgm = container.querySelector('#select-bgm-track');
    if (selectBgm) {
      selectBgm.addEventListener('change', (e) => {
        bgMusicTrack = e.target.value;
      });
    }

    const rangeBgmVol = container.querySelector('#range-bgm-vol');
    if (rangeBgmVol) {
      rangeBgmVol.addEventListener('input', (e) => {
        bgMusicVolume = e.target.value;
      });
    }

    // Export Reel
    const btnExportReel = container.querySelector('#btn-export-reel');
    if (btnExportReel) {
      btnExportReel.addEventListener('click', () => {
        alert('💾 Super Reel Exported in Ultra-HD 4K 60FPS ProRes! (Color graded with kinetic subtitles & SFX)');
      });
    }

    // Publish to 6 Channels
    const btnPublishAll = container.querySelector('#btn-publish-all');
    const btnPublishBottom = container.querySelector('#btn-publish-all-bottom');

    const handlePublishAll = () => {
      alert('🚀 Dispatched! Super Reel & rich captions scheduled and published to all 6 connected channels.');
      stateStore.setTab('growth');
    };

    if (btnPublishAll) btnPublishAll.addEventListener('click', handlePublishAll);
    if (btnPublishBottom) btnPublishBottom.addEventListener('click', handlePublishAll);
  }

  function attachImageEvents() {
    // 1. Template Selectors
    container.querySelectorAll('.btn-template-select').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedImageTemplate = btn.getAttribute('data-template');
        renderMain();
      });
    });

    // 2. Aspect Ratio Selectors
    container.querySelectorAll('.btn-ratio-select').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedAspectRatio = btn.getAttribute('data-ratio');
        renderMain();
      });
    });

    // 3. Theme Palette Selectors
    container.querySelectorAll('.btn-theme-select').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedImageTheme = btn.getAttribute('data-theme-val');
        renderMain();
      });
    });

    // 4. Background Photography Preset Selectors
    container.querySelectorAll('.btn-bg-select').forEach(btn => {
      btn.addEventListener('click', () => {
        const bgId = btn.getAttribute('data-bg-id');
        const found = MASTER_BG_CATALOG.find(b => b.id === bgId);
        if (found) {
          selectedBgObj = found;
          renderMain();
        }
      });
    });

    // 5. Dynamic Background Photography Refresh Action
    const btnRefreshBgs = container.querySelector('#btn-refresh-bgs');
    const refreshIcon = container.querySelector('#refresh-bg-icon');

    if (btnRefreshBgs) {
      btnRefreshBgs.addEventListener('click', () => {
        if (refreshIcon) refreshIcon.style.transform = 'rotate(360deg)';
        btnRefreshBgs.disabled = true;
        btnRefreshBgs.innerHTML = `<span>⚡ Shuffling...</span>`;

        setTimeout(() => {
          currentDisplayedBgs = getRandomBackgrounds();
          selectedBgObj = currentDisplayedBgs[0];
          renderMain();
        }, 400);
      });
    }

    // 6. Quick Randomize Photo Button on Canvas
    const btnRandomBgCanvas = container.querySelector('#btn-random-bg-canvas');
    if (btnRandomBgCanvas) {
      btnRandomBgCanvas.addEventListener('click', () => {
        const photoPool = MASTER_BG_CATALOG.filter(b => b.id !== 'none' && b.id !== selectedBgObj.id);
        const randomChoice = photoPool[Math.floor(Math.random() * photoPool.length)];
        if (randomChoice) {
          selectedBgObj = randomChoice;
          renderMain();
        }
      });
    }

    // 7. Headline & Body Inputs
    const inputHeadline = container.querySelector('#input-image-headline');
    const inputBody = container.querySelector('#input-image-body');

    if (inputHeadline) {
      inputHeadline.addEventListener('input', (e) => {
        imageHeadline = e.target.value;
        const canvas = container.querySelector('#live-graphic-canvas');
        if (canvas) {
          canvas.innerHTML = renderGraphicCanvasContent(getThemeObject(selectedImageTheme), selectedBgObj);
        }
      });
    }

    if (inputBody) {
      inputBody.addEventListener('input', (e) => {
        imageBody = e.target.value;
        const canvas = container.querySelector('#live-graphic-canvas');
        if (canvas) {
          canvas.innerHTML = renderGraphicCanvasContent(getThemeObject(selectedImageTheme), selectedBgObj);
        }
      });
    }

    // 8. Watermark Toggle in Image Mode with Pro Payment Trigger
    const imgWatermarkToggle = container.querySelector('#toggle-image-watermark');

    if (imgWatermarkToggle) {
      imgWatermarkToggle.addEventListener('change', (e) => {
        if (!e.target.checked && !profile.isPro) {
          openProModal({
            onSuccess: () => {
              if (imgWatermarkToggle) imgWatermarkToggle.checked = false;
              const badge = container.querySelector('#image-watermark-badge');
              if (badge) badge.style.display = 'none';
            },
            onCancel: () => {
              if (imgWatermarkToggle) imgWatermarkToggle.checked = true;
              stateStore.updateProfile({ includeWatermark: true });
              const badge = container.querySelector('#image-watermark-badge');
              if (badge) badge.style.display = 'flex';
            }
          });
        } else {
          stateStore.updateProfile({ includeWatermark: e.target.checked });
          const badge = container.querySelector('#image-watermark-badge');
          if (badge) badge.style.display = e.target.checked ? 'flex' : 'none';
        }
      });
    }

    // 9. Action Buttons
    const btnDownloadImg = container.querySelector('#btn-download-image');
    if (btnDownloadImg) {
      btnDownloadImg.addEventListener('click', () => {
        alert('💾 Graphic exported in High-Res PNG! (300 DPI, Ready for Instagram & LinkedIn)');
      });
    }

    const btnCopyImg = container.querySelector('#btn-copy-image');
    if (btnCopyImg) {
      btnCopyImg.addEventListener('click', () => {
        alert('📋 Card graphic and social copy copied to your clipboard!');
      });
    }

    const btnPublishImgAll = container.querySelector('#btn-publish-image-all');
    if (btnPublishImgAll) {
      btnPublishImgAll.addEventListener('click', () => {
        alert('🚀 Graphic post & carousel dispatched to all 6 connected social channels!');
        stateStore.setTab('growth');
      });
    }
  }

  function getThemeObject(themeName) {
    const themeStyles = {
      sahara: { bg: '#faf5ee', cardBg: '#ffffff', text: '#3a302a', muted: '#605850', accent: '#c2652a', border: 'rgba(194, 101, 42, 0.2)' },
      midnight: { bg: '#050608', cardBg: '#0f131a', text: '#f0f4fc', muted: '#94a3b8', accent: '#00f0ff', border: 'rgba(0, 240, 255, 0.25)' },
      emerald: { bg: '#064e3b', cardBg: '#022c22', text: '#ecfdf5', muted: '#a7f3d0', accent: '#34d399', border: 'rgba(52, 211, 153, 0.3)' },
      amber: { bg: '#451a03', cardBg: '#271003', text: '#fef3c7', muted: '#fde68a', accent: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
      monolith: { bg: '#18181b', cardBg: '#09090b', text: '#fafafa', muted: '#a1a1aa', accent: '#ffffff', border: 'rgba(255, 255, 255, 0.15)' }
    };
    return themeStyles[themeName] || themeStyles.sahara;
  }

  function getWatermarkHtml() {
    return `
      <div id="image-watermark-badge" style="display: ${profile.includeWatermark ? 'flex' : 'none'}; align-items: center; gap: 4px; background: rgba(0,0,0,0.65); backdrop-filter: blur(6px); border: 1px solid rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 999px;">
        <span style="font-size: 0.68rem; color: #00f0ff;">⚡</span>
        <span style="font-size: 0.62rem; font-weight: 800; color: #fff; letter-spacing: 0.02em;">Made with <span>KontentOS</span></span>
      </div>
    `;
  }

  renderMain();
}
