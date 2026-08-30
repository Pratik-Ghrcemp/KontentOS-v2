// KontentOS — Monetization Command Center (V3 Studio White Edition)
import { stateStore } from '../state.js';

export function renderMonetization(container) {
  const state = stateStore.get();
  const profile = state.creatorProfile;

  // Rate Card Calculator State
  let customViews = 50000;
  let customCpm = 35;

  function calculateBundleRate(views, cpm) {
    const baseReel = (views / 1000) * cpm;
    const dedicatedVideo = baseReel * 2.2;
    const newsletterSponsor = 1200;
    const fullBundle = (baseReel + dedicatedVideo + newsletterSponsor) * 0.85; // 15% bundle discount
    return {
      reel: Math.round(baseReel),
      dedicated: Math.round(dedicatedVideo),
      newsletter: newsletterSponsor,
      bundle: Math.round(fullBundle)
    };
  }

  function renderMain() {
    const rates = calculateBundleRate(customViews, customCpm);

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        
        <!-- Top Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
              <h1 style="font-size: 1.85rem; font-weight: 800; letter-spacing: -0.02em; color: var(--text-main);">
                Monetization Command Center
              </h1>
              <span class="badge badge-purple">DEALS CRM & RATE CARD</span>
            </div>
            <p style="color: var(--text-muted); font-size: 0.9rem;">
              Manage active brand partnerships, calculate high-yield rate cards, and track closed creator revenue.
            </p>
          </div>

          <div style="display: flex; gap: 0.5rem;">
            <button id="btn-create-deal" class="btn btn-primary" style="padding: 0.65rem 1.25rem;">
              <span class="material-symbols-outlined" style="font-size: 1.1rem;">add</span>
              <span>+ New Brand Deal</span>
            </button>
          </div>
        </div>

        <!-- 4 Key Revenue KPI Cards -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem;">
          
          <div class="card neo-raised" style="padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Closed Revenue (YTD)</span>
              <span class="badge badge-green">↑ 28.4%</span>
            </div>
            <div style="font-size: 1.85rem; font-weight: 800; color: var(--text-main); line-height: 1.2; margin-bottom: 0.25rem;">
              $42,800
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">
              +$9,200 vs previous quarter
            </div>
          </div>

          <div class="card neo-raised" style="padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Active Pipeline</span>
              <span class="badge badge-purple">3 DEALS</span>
            </div>
            <div style="font-size: 1.85rem; font-weight: 800; color: var(--text-main); line-height: 1.2; margin-bottom: 0.25rem;">
              $14,250
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">
              Avg deal size: $4,750
            </div>
          </div>

          <div class="card neo-raised" style="padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Creator CPM Benchmark</span>
              <span class="badge badge-neon">TOP 5%</span>
            </div>
            <div style="font-size: 1.85rem; font-weight: 800; color: var(--text-main); line-height: 1.2; margin-bottom: 0.25rem;">
              $38.50
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">
              Niche: ${profile.proNiche || 'Tech & AI'}
            </div>
          </div>

          <div class="card neo-raised" style="padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">90-Day Projection</span>
              <span class="badge badge-green">HIGH CONFIDENCE</span>
            </div>
            <div style="font-size: 1.85rem; font-weight: 800; color: var(--text-main); line-height: 1.2; margin-bottom: 0.25rem;">
              $68,000
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">
              Includes recurring newsletter sponsors
            </div>
          </div>

        </div>

        <!-- Deals Pipeline CRM (Kanban / Table) -->
        <div class="card neo-raised">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <div>
              <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-main);">Active Brand Deals Pipeline</h3>
              <p style="font-size: 0.78rem; color: var(--text-muted);">Track deliverables, contract signing, and invoice payments</p>
            </div>
            <span class="badge badge-neon">3 Active Partnerships</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
            
            <!-- Deal 1: TechFlow AI -->
            <div style="background: var(--bg-surface-card); box-shadow: var(--shadow-neo-raised-sm); padding: 1.15rem; border-radius: 14px; display: flex; flex-direction: column; justify-content: space-between; min-height: 200px;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <span class="badge badge-purple">CONTRACT REVIEW</span>
                  <strong style="font-size: 1.1rem; color: var(--accent-primary);">$4,500</strong>
                </div>
                <div style="font-weight: 800; font-size: 1rem; color: var(--text-main); margin-bottom: 4px;">
                  TechFlow AI
                </div>
                <div style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 0.75rem;">
                  1x Dedicated 60s Reel + 1x LinkedIn Post + Newsletter Header Mention.
                </div>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 0.65rem;">
                <span style="font-size: 0.72rem; color: var(--text-dim);">Due: Oct 28</span>
                <button class="btn btn-secondary" style="padding: 0.3rem 0.65rem; font-size: 0.72rem;">View Contract</button>
              </div>
            </div>

            <!-- Deal 2: CloudScale -->
            <div style="background: var(--bg-surface-card); box-shadow: var(--shadow-neo-raised-sm); padding: 1.15rem; border-radius: 14px; display: flex; flex-direction: column; justify-content: space-between; min-height: 200px;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <span class="badge badge-neon">DELIVERABLES ACTIVE</span>
                  <strong style="font-size: 1.1rem; color: var(--accent-primary);">$6,000</strong>
                </div>
                <div style="font-weight: 800; font-size: 1rem; color: var(--text-main); margin-bottom: 4px;">
                  CloudScale Systems
                </div>
                <div style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 0.75rem;">
                  2x Multi-Platform Super Reels (YouTube Shorts + Instagram) + 30-Day Ad Usage Rights.
                </div>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 0.65rem;">
                <span style="font-size: 0.72rem; color: var(--text-dim);">Due: Nov 04</span>
                <button class="btn btn-primary" style="padding: 0.3rem 0.65rem; font-size: 0.72rem;">Upload Draft</button>
              </div>
            </div>

            <!-- Deal 3: DevPulse -->
            <div style="background: var(--bg-surface-card); box-shadow: var(--shadow-neo-raised-sm); padding: 1.15rem; border-radius: 14px; display: flex; flex-direction: column; justify-content: space-between; min-height: 200px;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <span class="badge badge-green">PAYMENT PROCESSING</span>
                  <strong style="font-size: 1.1rem; color: var(--accent-primary);">$3,750</strong>
                </div>
                <div style="font-weight: 800; font-size: 1rem; color: var(--text-main); margin-bottom: 4px;">
                  DevPulse Analytics
                </div>
                <div style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 0.75rem;">
                  1x Sponsored Breakdown Video + 𝕏 Thread. Deliverables approved with 98% positive sentiment.
                </div>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 0.65rem;">
                <span style="font-size: 0.72rem; color: var(--accent-green); font-weight: 700;">Payout in 2 days</span>
                <button class="btn btn-secondary" style="padding: 0.3rem 0.65rem; font-size: 0.72rem;">Invoice #1042</button>
              </div>
            </div>

          </div>
        </div>

        <!-- Interactive Dynamic Rate Card Calculator -->
        <div class="card neo-raised">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem;">
            <div>
              <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-main);">Dynamic Sponsor Rate Card Calculator</h3>
              <p style="font-size: 0.78rem; color: var(--text-muted);">Automatically calculates optimal sponsorship packages based on projected viewership and CPM.</p>
            </div>
            <button id="btn-export-rate-card" class="btn btn-secondary" style="padding: 0.45rem 1rem; font-size: 0.82rem;">
              <span>📑 Export Media Kit PDF</span>
            </button>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 1.5rem; align-items: center;">
            <!-- Sliders -->
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">
                  <span>Average Video Views</span>
                  <span id="label-calc-views" style="color: var(--accent-primary);">${customViews.toLocaleString()}</span>
                </div>
                <input type="range" id="range-calc-views" min="10000" max="250000" step="5000" value="${customViews}" style="width: 100%; accent-color: var(--accent-primary);" />
              </div>

              <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">
                  <span>Target CPM Rate ($)</span>
                  <span id="label-calc-cpm" style="color: var(--accent-primary);">$${customCpm}</span>
                </div>
                <input type="range" id="range-calc-cpm" min="20" max="80" step="5" value="${customCpm}" style="width: 100%; accent-color: var(--accent-primary);" />
              </div>
            </div>

            <!-- Tiered Packages Display -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.85rem;">
              
              <div style="background: var(--bg-surface-card); box-shadow: var(--shadow-neo-raised-sm); padding: 1rem; border-radius: 12px; text-align: center;">
                <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Standard Reel</div>
                <div style="font-size: 1.45rem; font-weight: 800; color: var(--text-main); margin: 4px 0;">
                  $${rates.reel}
                </div>
                <div style="font-size: 0.68rem; color: var(--text-dim);">60s Integration</div>
              </div>

              <div style="background: var(--bg-surface-card); box-shadow: var(--shadow-neo-raised-sm); padding: 1rem; border-radius: 12px; text-align: center; border: 1.5px solid var(--accent-primary);">
                <div style="font-size: 0.72rem; font-weight: 700; color: var(--accent-primary); text-transform: uppercase;">Full Bundle (Best Value)</div>
                <div style="font-size: 1.45rem; font-weight: 800; color: var(--accent-primary); margin: 4px 0;">
                  $${rates.bundle}
                </div>
                <div style="font-size: 0.68rem; color: var(--text-muted);">Reel + 𝕏 + Newsletter (15% off)</div>
              </div>

              <div style="background: var(--bg-surface-card); box-shadow: var(--shadow-neo-raised-sm); padding: 1rem; border-radius: 12px; text-align: center;">
                <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Dedicated Video</div>
                <div style="font-size: 1.45rem; font-weight: 800; color: var(--text-main); margin: 4px 0;">
                  $${rates.dedicated}
                </div>
                <div style="font-size: 0.68rem; color: var(--text-dim);">Dedicated 5-8 min video</div>
              </div>

            </div>
          </div>
        </div>

      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    const rangeViews = container.querySelector('#range-calc-views');
    const rangeCpm = container.querySelector('#range-calc-cpm');

    if (rangeViews) {
      rangeViews.addEventListener('input', (e) => {
        customViews = parseInt(e.target.value);
        renderMain();
      });
    }

    if (rangeCpm) {
      rangeCpm.addEventListener('input', (e) => {
        customCpm = parseInt(e.target.value);
        renderMain();
      });
    }

    const btnExport = container.querySelector('#btn-export-rate-card');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        stateStore.setTab('media_kit');
      });
    }

    const btnCreateDeal = container.querySelector('#btn-create-deal');
    if (btnCreateDeal) {
      btnCreateDeal.addEventListener('click', () => {
        alert('💼 Brand deal creation modal ready! You can link incoming inquiries directly to your Media Kit.');
      });
    }
  }

  renderMain();
}
