// KontentOS — Professional Media Kit & Rate Card (V3 Studio White Edition)
import { stateStore } from '../state.js';

export function renderMediaKit(container) {
  const state = stateStore.get();
  const profile = state.creatorProfile;

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      
      <!-- Top Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
            <h1 style="font-size: 1.85rem; font-weight: 800; letter-spacing: -0.02em; color: var(--text-main);">
              Professional Creator Media Kit
            </h1>
            <span class="badge badge-green">LIVE VERIFIED STATS</span>
          </div>
          <p style="color: var(--text-muted); font-size: 0.9rem;">
            Shareable, high-converting partnership deck for agency reps and inbound brand sponsors.
          </p>
        </div>

        <div style="display: flex; gap: 0.5rem;">
          <button id="btn-copy-media-link" class="btn btn-secondary" style="padding: 0.65rem 1rem;">
            <span class="material-symbols-outlined" style="font-size: 1.1rem;">link</span>
            <span>Copy Live Link</span>
          </button>
          <button id="btn-export-pdf" class="btn btn-primary" style="padding: 0.65rem 1.25rem;">
            <span class="material-symbols-outlined" style="font-size: 1.1rem;">download</span>
            <span>Download PDF Deck</span>
          </button>
        </div>
      </div>

      <!-- Hero Creator Profile Card -->
      <div class="card neo-raised" style="padding: 1.75rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem;">
        <div style="display: flex; align-items: center; gap: 1.25rem;">
          <div style="width: 72px; height: 72px; border-radius: 50%; background: var(--accent-primary); color: #fff; font-weight: 900; font-size: 2rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px var(--accent-primary-glow);">
            ${(profile.name || 'C').charAt(0)}
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 2px;">
              <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-main);">${profile.name || 'Creator Profile'}</h2>
              <span class="badge badge-neon">VERIFIED PARTNER</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--accent-primary); font-weight: 700; margin-bottom: 4px;">
              ${profile.handle || '@creator'} • ${profile.proNiche || 'Tech & AI Systems'}
            </div>
            <p style="font-size: 0.82rem; color: var(--text-muted); max-width: 540px; line-height: 1.4;">
              Creating high-impact short-form breakdowns and actionable guides on AI automation, software engineering, and the future of creator work.
            </p>
          </div>
        </div>

        <div style="display: flex; gap: 1.5rem; border-left: 1px solid var(--border-subtle); padding-left: 1.5rem;">
          <div>
            <div style="font-size: 1.45rem; font-weight: 800; color: var(--text-main);">248K+</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">Total Audience</div>
          </div>
          <div>
            <div style="font-size: 1.45rem; font-weight: 800; color: var(--text-main);">8.6%</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">Avg Engagement</div>
          </div>
          <div>
            <div style="font-size: 1.45rem; font-weight: 800; color: var(--text-main);">2.4M</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">Monthly Views</div>
          </div>
        </div>
      </div>

      <!-- Channel Breakdown Grid -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;">
        
        <div class="card neo-raised" style="padding: 1.15rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 1.25rem;">📸</span>
            <span class="badge badge-neon">TOP CHANNEL</span>
          </div>
          <div style="font-weight: 800; font-size: 1.25rem; color: var(--text-main); margin-bottom: 2px;">85,400</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem;">Instagram Reels Followers</div>
          <div style="font-size: 0.72rem; color: var(--accent-primary); font-weight: 700;">11.2% Reel Engagement</div>
        </div>

        <div class="card neo-raised" style="padding: 1.15rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 1.25rem;">▶️</span>
            <span class="badge badge-purple">FAST GROWING</span>
          </div>
          <div style="font-weight: 800; font-size: 1.25rem; color: var(--text-main); margin-bottom: 2px;">92,100</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem;">YouTube Subscribers</div>
          <div style="font-size: 0.72rem; color: var(--accent-tertiary); font-weight: 700;">94% Short-Form Retention</div>
        </div>

        <div class="card neo-raised" style="padding: 1.15rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 1.25rem;">💼</span>
            <span class="badge badge-cyan">HIGH B2B VALUE</span>
          </div>
          <div style="font-weight: 800; font-size: 1.25rem; color: var(--text-main); margin-bottom: 2px;">38,200</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem;">LinkedIn Newsletter & Post Reach</div>
          <div style="font-size: 0.72rem; color: var(--accent-cyan); font-weight: 700;">64% Tech Decision Makers</div>
        </div>

        <div class="card neo-raised" style="padding: 1.15rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 1.25rem;">🎵</span>
            <span class="badge badge-neon">VIRAL ENGINE</span>
          </div>
          <div style="font-weight: 800; font-size: 1.25rem; color: var(--text-main); margin-bottom: 2px;">32,800</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem;">TikTok Followers</div>
          <div style="font-size: 0.72rem; color: var(--accent-primary); font-weight: 700;">1.4M Organic Views/Mo</div>
        </div>

      </div>

      <!-- Past Brand Partnerships & Testimonials -->
      <div class="card neo-raised">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-main);">Selected Past Brand Partnerships</h3>
          <span style="font-size: 0.78rem; color: var(--text-muted);">100% Sponsor Satisfaction Guarantee</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
          
          <div style="background: var(--bg-surface-card); box-shadow: var(--shadow-neo-raised-sm); padding: 1rem; border-radius: 12px;">
            <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-main); margin-bottom: 2px;">Supabase Cloud</div>
            <div style="font-size: 0.75rem; color: var(--accent-primary); font-weight: 700; margin-bottom: 6px;">Sponsored Reel + 𝕏 Thread</div>
            <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.35;">
              "Drove 1,840 developer signups in 72 hours. Highest conversion rate of our Q2 influencer campaign."
            </p>
          </div>

          <div style="background: var(--bg-surface-card); box-shadow: var(--shadow-neo-raised-sm); padding: 1rem; border-radius: 12px;">
            <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-main); margin-bottom: 2px;">Notion Workspaces</div>
            <div style="font-size: 0.75rem; color: var(--accent-tertiary); font-weight: 700; margin-bottom: 6px;">Template Integration Campaign</div>
            <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.35;">
              "Over 42,000 template downloads generated. The storytelling and hook retention were phenomenal."
            </p>
          </div>

          <div style="background: var(--bg-surface-card); box-shadow: var(--shadow-neo-raised-sm); padding: 1rem; border-radius: 12px;">
            <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-main); margin-bottom: 2px;">Linear AI</div>
            <div style="font-size: 0.75rem; color: var(--accent-cyan); font-weight: 700; margin-bottom: 6px;">Product Launch Breakdown</div>
            <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.35;">
              "Clean, high-aesthetic production. Perfectly aligned with our brand tone and audience expectations."
            </p>
          </div>

        </div>
      </div>

    </div>
  `;

  // Attach Events
  const btnCopy = container.querySelector('#btn-copy-media-link');
  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      navigator.clipboard?.writeText(window.location.href);
      alert('📋 Public Live Media Kit Link copied to clipboard!');
    });
  }

  const btnExport = container.querySelector('#btn-export-pdf');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      alert('📑 Generating verified PDF Media Kit deck with real-time stats...');
    });
  }
}
