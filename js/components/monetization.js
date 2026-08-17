// KontentOS — Monetization Hub & Localized Rate Calculator
import { stateStore, GEO_LOCALES } from '../state.js';

export function renderMonetization(container) {
  const state = stateStore.get();
  const profile = state.creatorProfile;
  const locale = GEO_LOCALES[state.geo] || GEO_LOCALES.IN;

  let views = 250000;
  let rateEstimate = locale.currency === 'INR (₹)' ? '₹45,000 – ₹75,000' : '$2,500 – $4,200';

  container.innerHTML = `
    <div class="content-container" style="max-width: 1200px;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
            <h1 style="font-size: 2rem;">💰 Monetization Hub & Brand CRM</h1>
            <span class="badge badge-neon">COMMERCIAL SUITE</span>
          </div>
          <p style="color: var(--text-muted); font-size: 0.92rem;">
            Calculate fair sponsor rates, track deal pipelines, and manage your public verified media kit.
          </p>
        </div>

        <button id="btn-export-proposal" class="btn btn-secondary">
          <span>📄 Export Rate Card (PDF)</span>
        </button>
      </div>

      <!-- Bento Grid: Rate Calculator & Live Media Kit Preview -->
      <div class="bento-grid" style="margin-bottom: 2rem;">
        <!-- Left: Sponsorship Rate Calculator -->
        <div class="card" style="grid-column: span 6;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="font-size: 1.15rem;">🧮 Sponsorship Rate Calculator</h3>
            <span class="badge badge-purple">LIVE CPM BENCHMARK</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <div>
              <label style="display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.35rem; color: var(--text-muted);">
                Deliverable Type
              </label>
              <select id="select-deliverable" class="form-select">
                <option value="reel">1x Dedicated Instagram Reel / Short (60s)</option>
                <option value="youtube">1x Dedicated YouTube Video (8-10m)</option>
                <option value="bundle">Multi-Platform Repurposed Bundle (All 6 Channels)</option>
              </select>
            </div>

            <div>
              <label style="display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.35rem; color: var(--text-muted);">
                Average 30-Day Views: <strong id="views-display" style="color: var(--text-main); font-size: 0.95rem;">250,000</strong>
              </label>
              <input type="range" id="input-views" min="10000" max="2000000" step="10000" value="250000" style="width: 100%; accent-color: var(--accent-primary);">
            </div>

            <div style="background: var(--bg-surface-low); padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border-subtle); text-align: center;">
              <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-dim); font-weight: 700; margin-bottom: 0.25rem;">
                Suggested Market Quote Range
              </div>
              <div id="rate-display" style="font-size: 1.8rem; font-weight: 900; color: var(--accent-secondary); letter-spacing: -0.02em;">
                ${rateEstimate}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
                Calibrated against current industry CPM benchmarks
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Public Media Kit Preview -->
        <div class="card" style="grid-column: span 6; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <h3 style="font-size: 1.15rem;">🌐 Live Media Kit Preview</h3>
              <span class="badge badge-cyan">kontentos.me/${profile.handle}</span>
            </div>

            <div style="background: var(--bg-surface-low); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem;">
              <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--accent-primary); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.2rem; color: #fff;">
                  ${profile.name.charAt(0)}
                </div>
                <div>
                  <div style="font-weight: 700; font-size: 1.05rem;">${profile.name}</div>
                  <div style="font-size: 0.78rem; color: var(--text-muted);">${profile.proNiche || profile.selectedVibe}</div>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; text-align: center;">
                <div style="background: var(--bg-surface-card); padding: 0.65rem; border-radius: 8px;">
                  <div style="font-size: 1.1rem; font-weight: 800; color: var(--accent-primary-light);">1.2M</div>
                  <div style="font-size: 0.68rem; color: var(--text-dim);">Monthly Reach</div>
                </div>
                <div style="background: var(--bg-surface-card); padding: 0.65rem; border-radius: 8px;">
                  <div style="font-size: 1.1rem; font-weight: 800; color: var(--accent-secondary);">8.4%</div>
                  <div style="font-size: 0.68rem; color: var(--text-dim);">Eng. Rate</div>
                </div>
                <div style="background: var(--bg-surface-card); padding: 0.65rem; border-radius: 8px;">
                  <div style="font-size: 1.1rem; font-weight: 800; color: var(--accent-cyan);">$42</div>
                  <div style="font-size: 0.68rem; color: var(--text-dim);">Est. RPM</div>
                </div>
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-secondary" style="flex: 1;">
              <span>🔗 Copy Media Kit URL</span>
            </button>
            <button class="btn btn-primary">
              <span>Edit Kit</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Kanban Deal Pipeline -->
      <div class="card">
        <h3 style="font-size: 1.15rem; margin-bottom: 1.25rem;">📋 Active Sponsorship Deal Pipeline</h3>
        
        <div class="bento-grid">
          <!-- Col 1: Pitched -->
          <div style="grid-column: span 3; background: var(--bg-surface-low); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-subtle);">
            <div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim); margin-bottom: 0.75rem;">
              1. Pitched (2)
            </div>
            <div class="card" style="padding: 0.85rem; margin-bottom: 0.65rem;">
              <div style="font-weight: 700; font-size: 0.9rem;">Notion Pro Package</div>
              <div style="font-size: 0.75rem; color: var(--accent-gold); margin-top: 2px;">$3,500 • 1x YouTube Video</div>
            </div>
          </div>

          <!-- Col 2: In Negotiation -->
          <div style="grid-column: span 3; background: var(--bg-surface-low); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-subtle);">
            <div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--accent-primary); margin-bottom: 0.75rem;">
              2. Negotiating (1)
            </div>
            <div class="card" style="padding: 0.85rem; margin-bottom: 0.65rem; border-color: var(--border-glass);">
              <div style="font-weight: 700; font-size: 0.9rem;">Audio-Technica Mic Review</div>
              <div style="font-size: 0.75rem; color: var(--accent-primary); margin-top: 2px;">$1,800 + Free Hardware</div>
            </div>
          </div>

          <!-- Col 3: Deliverable Ready -->
          <div style="grid-column: span 3; background: var(--bg-surface-low); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-subtle);">
            <div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--accent-cyan); margin-bottom: 0.75rem;">
              3. In Production (1)
            </div>
            <div class="card" style="padding: 0.85rem; margin-bottom: 0.65rem;">
              <div style="font-weight: 700; font-size: 0.9rem;">CapCut Studio Promo Reel</div>
              <div style="font-size: 0.75rem; color: var(--accent-cyan); margin-top: 2px;">$2,400 • Due Friday</div>
            </div>
          </div>

          <!-- Col 4: Paid & Closed -->
          <div style="grid-column: span 3; background: var(--bg-surface-low); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-subtle);">
            <div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--accent-secondary); margin-bottom: 0.75rem;">
              4. Paid & Closed (3)
            </div>
            <div class="card" style="padding: 0.85rem; margin-bottom: 0.65rem;">
              <div style="font-weight: 700; font-size: 0.9rem;">Zapier AI Automation Reel</div>
              <div style="font-size: 0.75rem; color: var(--accent-secondary); margin-top: 2px;">$3,000 • Completed</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Views Slider Event
  const slider = container.querySelector('#input-views');
  const viewsDisplay = container.querySelector('#views-display');
  const rateDisplay = container.querySelector('#rate-display');

  if (slider && viewsDisplay && rateDisplay) {
    slider.addEventListener('input', (e) => {
      const v = parseInt(e.target.value, 10);
      viewsDisplay.textContent = v.toLocaleString();
      
      if (locale.currency === 'INR (₹)') {
        const min = Math.round((v / 1000) * 200);
        const max = Math.round((v / 1000) * 350);
        rateDisplay.textContent = `₹${min.toLocaleString()} – ₹${max.toLocaleString()}`;
      } else {
        const min = Math.round((v / 1000) * 12);
        const max = Math.round((v / 1000) * 22);
        rateDisplay.textContent = `$${min.toLocaleString()} – $${max.toLocaleString()}`;
      }
    });
  }
}
