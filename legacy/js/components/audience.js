// KontentOS — Audience Intelligence Hub (V3 Studio White Edition)
import { stateStore } from '../state.js';

export function renderAudience(container) {
  const state = stateStore.get();
  const profile = state.creatorProfile;

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      
      <!-- Top Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
            <h1 style="font-size: 1.85rem; font-weight: 800; letter-spacing: -0.02em; color: var(--text-main);">
              Audience Intelligence Hub
            </h1>
            <span class="badge badge-neon">DEEP PERSONA CRM</span>
          </div>
          <p style="color: var(--text-muted); font-size: 0.9rem;">
            Understand who watches, what triggers shares, and cultivate high-loyalty super-fans.
          </p>
        </div>

        <div style="display: flex; gap: 0.5rem;">
          <button id="btn-export-audience" class="btn btn-secondary" style="padding: 0.65rem 1rem;">
            <span>📥 Export CSV Data</span>
          </button>
          <button id="btn-audience-to-growth" class="btn btn-primary" style="padding: 0.65rem 1.25rem;">
            <span>🚀 Run Growth Experiment</span>
          </button>
        </div>
      </div>

      <!-- 4 Key Audience Stats -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem;">
        
        <div class="card neo-raised" style="padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Verified Community</span>
            <span class="badge badge-green">↑ 18.4%</span>
          </div>
          <div style="font-size: 1.85rem; font-weight: 800; color: var(--text-main); line-height: 1.2; margin-bottom: 0.25rem;">
            248,500
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">
            Active across 6 connected platforms
          </div>
        </div>

        <div class="card neo-raised" style="padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Core Demographic</span>
            <span class="badge badge-neon">HIGH SPEND</span>
          </div>
          <div style="font-size: 1.85rem; font-weight: 800; color: var(--text-main); line-height: 1.2; margin-bottom: 0.25rem;">
            25 - 34 YRS
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">
            68% Founders, Engineers & Creators
          </div>
        </div>

        <div class="card neo-raised" style="padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Super-Fan Index</span>
            <span class="badge badge-purple">92 / 100</span>
          </div>
          <div style="font-size: 1.85rem; font-weight: 800; color: var(--text-main); line-height: 1.2; margin-bottom: 0.25rem;">
            14.2K VIPs
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">
            Avg 4.8 comments & shares / month
          </div>
        </div>

        <div class="card neo-raised" style="padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Top Geography</span>
            <span class="badge badge-cyan">GLOBAL TECH</span>
          </div>
          <div style="font-size: 1.85rem; font-weight: 800; color: var(--text-main); line-height: 1.2; margin-bottom: 0.25rem;">
            US • IN • UK
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">
            Tier-1 commercial purchasing power
          </div>
        </div>

      </div>

      <!-- Main Bento Grid: Persona Clusters & Super-Fan CRM -->
      <div class="bento-grid">
        
        <!-- Left: 3 Core Persona Archetypes -->
        <div class="card neo-raised" style="grid-column: span 7;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-main);">Audience Persona Breakdown</h3>
            <span class="badge badge-neon">AI CLUSTERED</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.85rem;">
            
            <div style="background: var(--bg-surface-card); box-shadow: var(--shadow-neo-raised-sm); padding: 1rem; border-radius: 12px; border-left: 3px solid var(--accent-primary);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <strong style="font-size: 0.92rem; color: var(--text-main);">1. The Solopreneur & Tech Founder (48%)</strong>
                <span class="badge badge-neon">PRIMARY</span>
              </div>
              <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 0.5rem;">
                Looking for actionable systems to scale revenue, automate workflows with AI, and grow asymmetric distribution.
              </p>
              <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                <span class="badge" style="background: rgba(0,0,0,0.05); color: var(--text-muted); font-size: 0.65rem;">Triggers: Time-saving frameworks</span>
                <span class="badge" style="background: rgba(0,0,0,0.05); color: var(--text-muted); font-size: 0.65rem;">Avg Watch: 88%</span>
              </div>
            </div>

            <div style="background: var(--bg-surface-card); box-shadow: var(--shadow-neo-raised-sm); padding: 1rem; border-radius: 12px; border-left: 3px solid var(--accent-tertiary);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <strong style="font-size: 0.92rem; color: var(--text-main);">2. The Aspiring Creator / Freelancer (32%)</strong>
                <span class="badge badge-purple">FAST GROWING</span>
              </div>
              <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 0.5rem;">
                Consumes tutorials on video editing, camera presence, script frameworks, and initial monetization.
              </p>
              <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                <span class="badge" style="background: rgba(0,0,0,0.05); color: var(--text-muted); font-size: 0.65rem;">Triggers: Behind-the-scenes breakdowns</span>
                <span class="badge" style="background: rgba(0,0,0,0.05); color: var(--text-muted); font-size: 0.65rem;">High Bookmark Rate</span>
              </div>
            </div>

            <div style="background: var(--bg-surface-card); box-shadow: var(--shadow-neo-raised-sm); padding: 1rem; border-radius: 12px; border-left: 3px solid var(--accent-cyan);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <strong style="font-size: 0.92rem; color: var(--text-main);">3. Engineering Leaders & Enterprise Buyers (20%)</strong>
                <span class="badge badge-cyan">HIGH VALUE</span>
              </div>
              <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 0.5rem;">
                Engages primarily on LinkedIn and YouTube. High purchase intent for B2B developer tools and sponsor products.
              </p>
            </div>

          </div>
        </div>

        <!-- Right: Super-Fan Loyalty CRM -->
        <div class="card neo-raised" style="grid-column: span 5; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-main);">Top Super-Fan Champions</h3>
              <span class="badge badge-purple">VIP LIST</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.65rem;">
              ${[
                { name: 'Alex Rivera', handle: '@arivera_dev', shares: 48, score: '99', badge: '🥇 Top Champion' },
                { name: 'Siddharth Mehta', handle: '@sid_builds', shares: 36, score: '96', badge: '🥈 Super Fan' },
                { name: 'Elena Rostova', handle: '@elena_ai', shares: 29, score: '94', badge: '🥉 Super Fan' },
                { name: 'Marcus Chen', handle: '@mchen_tech', shares: 22, score: '91', badge: '⭐ Engaged' }
              ].map(fan => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0.85rem; background: var(--bg-surface-card); box-shadow: var(--shadow-neo-raised-sm); border-radius: 10px;">
                  <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--accent-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.8rem;">
                      ${fan.name.charAt(0)}
                    </div>
                    <div>
                      <div style="font-weight: 800; font-size: 0.82rem; color: var(--text-main);">${fan.name}</div>
                      <div style="font-size: 0.68rem; color: var(--text-muted);">${fan.handle} • ${fan.shares} shares</div>
                    </div>
                  </div>
                  <span class="badge badge-neon" style="font-size: 0.65rem;">${fan.badge}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <button id="btn-dm-superfans" class="btn btn-primary" style="width: 100%; margin-top: 1rem; padding: 0.75rem;">
            <span>💌 Send VIP Exclusive Update</span>
          </button>
        </div>

      </div>

    </div>
  `;

  // Attach Events
  const btnGrowth = container.querySelector('#btn-audience-to-growth');
  if (btnGrowth) btnGrowth.addEventListener('click', () => stateStore.setTab('growth'));

  const btnDm = container.querySelector('#btn-dm-superfans');
  if (btnDm) btnDm.addEventListener('click', () => alert('💌 VIP Broadcast ready! You can send early access videos to your top 500 champions.'));
}
