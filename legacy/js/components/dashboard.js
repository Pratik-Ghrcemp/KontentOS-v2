// KontentOS — Executive Intelligence Dashboard (V3 Studio White Edition)
import { stateStore } from '../state.js';

export function renderDashboard(container) {
  const state = stateStore.get();
  const profile = state.creatorProfile;

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      
      <!-- Screen Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
            <h1 style="font-size: 1.85rem; font-weight: 800; letter-spacing: -0.02em; color: var(--text-main);">
              Executive Intelligence Dashboard
            </h1>
            <span class="badge badge-neon">REAL-TIME SYNC</span>
          </div>
          <p style="color: var(--text-muted); font-size: 0.9rem;">
            Welcome back, <strong>${profile.name || 'Creator'}</strong>. Cross-platform growth velocity is up <strong>+18.4%</strong> this month.
          </p>
        </div>

        <div style="display: flex; gap: 0.5rem;">
          <button id="btn-dashboard-to-studio" class="btn btn-primary" style="padding: 0.65rem 1.25rem;">
            <span class="material-symbols-outlined" style="font-size: 1.1rem;">movie_edit</span>
            <span>⚡ Open Studio Hub</span>
          </button>
          <button id="btn-dashboard-to-calendar" class="btn btn-secondary" style="padding: 0.65rem 1rem;">
            <span class="material-symbols-outlined" style="font-size: 1.1rem;">calendar_month</span>
            <span>Schedule</span>
          </button>
        </div>
      </div>

      <!-- 4 High-Impact KPI Stat Extrusions -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem;">
        
        <!-- Stat 1: Total Reach -->
        <div class="card neo-raised" style="padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Total Reach (30D)</span>
            <span class="badge badge-green">↑ 18.4%</span>
          </div>
          <div style="font-size: 1.85rem; font-weight: 800; color: var(--text-main); line-height: 1.2; margin-bottom: 0.25rem;">
            2.48M
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">
            +382K impressions vs last month
          </div>
        </div>

        <!-- Stat 2: Engagement Rate -->
        <div class="card neo-raised" style="padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Avg Engagement</span>
            <span class="badge badge-neon">↑ 2.1%</span>
          </div>
          <div style="font-size: 1.85rem; font-weight: 800; color: var(--text-main); line-height: 1.2; margin-bottom: 0.25rem;">
            8.64%
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">
            Industry benchmark: 3.2%
          </div>
        </div>

        <!-- Stat 3: Active Sponsor Pipeline -->
        <div class="card neo-raised" style="padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Sponsor Pipeline</span>
            <span class="badge badge-purple">3 DEALS</span>
          </div>
          <div style="font-size: 1.85rem; font-weight: 800; color: var(--text-main); line-height: 1.2; margin-bottom: 0.25rem;">
            $14,250
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">
            $6,500 closed • $7,750 in review
          </div>
        </div>

        <!-- Stat 4: Net New Followers -->
        <div class="card neo-raised" style="padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Net Follower Velocity</span>
            <span class="badge badge-green">↑ 42.8K</span>
          </div>
          <div style="font-size: 1.85rem; font-weight: 800; color: var(--text-main); line-height: 1.2; margin-bottom: 0.25rem;">
            +1,420/day
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">
            Top platform: Instagram Reels & Shorts
          </div>
        </div>

      </div>

      <!-- Main Bento Grid (Velocity Chart + AI Opportunity Radar) -->
      <div class="bento-grid">
        
        <!-- Left: Cross-Platform Performance Chart -->
        <div class="card neo-raised" style="grid-column: span 8; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <div>
                <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-main);">Cross-Platform Growth Velocity</h3>
                <p style="font-size: 0.78rem; color: var(--text-muted);">Daily views and engagement across 6 channels</p>
              </div>
              <div style="display: flex; gap: 0.35rem;">
                <span class="badge badge-neon">Instagram</span>
                <span class="badge badge-purple">YouTube</span>
                <span class="badge badge-cyan">LinkedIn</span>
              </div>
            </div>

            <!-- Visual Bar Chart Simulation -->
            <div style="height: 180px; display: flex; align-items: flex-end; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border-subtle);">
              ${[
                { day: 'Mon', val: 65, color: 'var(--accent-primary)' },
                { day: 'Tue', val: 82, color: 'var(--accent-primary)' },
                { day: 'Wed', val: 45, color: 'var(--accent-primary)' },
                { day: 'Thu', val: 95, color: 'var(--accent-primary)' },
                { day: 'Fri', val: 78, color: 'var(--accent-primary)' },
                { day: 'Sat', val: 110, color: 'var(--accent-tertiary)' },
                { day: 'Sun', val: 135, color: 'var(--accent-tertiary)' },
                { day: 'Mon', val: 90, color: 'var(--accent-primary)' },
                { day: 'Tue', val: 105, color: 'var(--accent-primary)' },
                { day: 'Wed', val: 120, color: 'var(--accent-primary)' },
                { day: 'Thu', val: 145, color: 'var(--accent-tertiary)' },
                { day: 'Fri', val: 160, color: 'var(--accent-tertiary)' }
              ].map(bar => `
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; justify-content: flex-end;">
                  <div style="width: 100%; height: ${bar.val}px; background: ${bar.color}; border-radius: 6px; transition: all 0.3s ease; box-shadow: 0 2px 6px rgba(0,0,0,0.1);" title="${bar.val * 1000} Views"></div>
                  <span style="font-size: 0.65rem; color: var(--text-dim); font-family: monospace;">${bar.day}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; font-size: 0.78rem; color: var(--text-muted);">
            <span>🔥 Viral Coefficient: <strong>1.42 (High compounding)</strong></span>
            <span style="color: var(--accent-primary); font-weight: 700; cursor: pointer;" id="view-full-growth-analytics">View Full Analytics $\rightarrow$</span>
          </div>
        </div>

        <!-- Right: AI Opportunity Radar & Recommendations -->
        <div class="card neo-raised" style="grid-column: span 4; display: flex; flex-direction: column; gap: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text-main);">AI Opportunity Radar</h3>
            <span class="badge badge-neon">3 HIGH IMPACT</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            
            <div style="background: var(--bg-surface-card); box-shadow: var(--shadow-neo-raised-sm); padding: 0.85rem; border-radius: 12px; border-left: 3px solid var(--accent-primary);">
              <div style="font-weight: 800; font-size: 0.82rem; color: var(--text-main); margin-bottom: 2px;">
                ⚡ Repurpose Top Reel to LinkedIn PDF
              </div>
              <div style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.35;">
                Your recent AI automation clip has 94% retention. Converting to a carousel will drive estimated +400 newsletter signups.
              </div>
            </div>

            <div style="background: var(--bg-surface-card); box-shadow: var(--shadow-neo-raised-sm); padding: 0.85rem; border-radius: 12px; border-left: 3px solid var(--accent-tertiary);">
              <div style="font-weight: 800; font-size: 0.82rem; color: var(--text-main); margin-bottom: 2px;">
                🎯 Optimum Post Window: Today 6:30 PM
              </div>
              <div style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.35;">
                Your audience activity peaks in 4 hours. 2 draft reels are ready in your pipeline.
              </div>
            </div>

            <div style="background: var(--bg-surface-card); box-shadow: var(--shadow-neo-raised-sm); padding: 0.85rem; border-radius: 12px; border-left: 3px solid var(--accent-cyan);">
              <div style="font-weight: 800; font-size: 0.82rem; color: var(--text-main); margin-bottom: 2px;">
                💼 Sponsor Deal Pending: TechFlow AI ($4,500)
              </div>
              <div style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.35;">
                Contract awaiting counter-signature. Rate card matches creator benchmarks.
              </div>
            </div>

          </div>

          <button id="btn-quick-create-dash" class="btn btn-primary" style="width: 100%; margin-top: auto; padding: 0.75rem;">
            <span>⚡ Create New Post Now</span>
          </button>
        </div>

      </div>

      <!-- Recent Content & Distribution Stream -->
      <div class="card neo-raised" style="margin-top: 0.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-main);">Recent Published & Scheduled Content</h3>
          <span style="font-size: 0.78rem; color: var(--text-muted);">6 Platforms Active</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
          
          <div style="background: var(--bg-surface-card); box-shadow: var(--shadow-neo-raised-sm); padding: 1rem; border-radius: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span class="badge badge-neon">REEL • INSTAGRAM</span>
              <span style="font-size: 0.7rem; color: var(--text-dim);">2 hours ago</span>
            </div>
            <div style="font-weight: 800; font-size: 0.88rem; margin-bottom: 0.35rem; color: var(--text-main);">
              "Stop spending 4 hours editing raw footage..."
            </div>
            <div style="display: flex; gap: 0.75rem; font-size: 0.75rem; color: var(--text-muted);">
              <span>👁️ 48.2K</span>
              <span>❤️ 3.4K</span>
              <span>💬 182</span>
            </div>
          </div>

          <div style="background: var(--bg-surface-card); box-shadow: var(--shadow-neo-raised-sm); padding: 1rem; border-radius: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span class="badge badge-purple">ARTICLE • LINKEDIN</span>
              <span style="font-size: 0.7rem; color: var(--text-dim);">Yesterday</span>
            </div>
            <div style="font-weight: 800; font-size: 0.88rem; margin-bottom: 0.35rem; color: var(--text-main);">
              "The 3-Step Content Compounding Framework"
            </div>
            <div style="display: flex; gap: 0.75rem; font-size: 0.75rem; color: var(--text-muted);">
              <span>👁️ 19.5K</span>
              <span>❤️ 840</span>
              <span>🔄 124</span>
            </div>
          </div>

          <div style="background: var(--bg-surface-card); box-shadow: var(--shadow-neo-raised-sm); padding: 1rem; border-radius: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span class="badge badge-cyan">SCHEDULED • THURSDAY</span>
              <span style="font-size: 0.7rem; color: var(--text-dim);">6:30 PM</span>
            </div>
            <div style="font-weight: 800; font-size: 0.88rem; margin-bottom: 0.35rem; color: var(--text-main);">
              "Why Solopreneurs Scale Faster with Asymmetric Systems"
            </div>
            <div style="font-size: 0.75rem; color: var(--accent-primary); font-weight: 700;">
              ⚡ Auto-dispatching to 6 channels
            </div>
          </div>

        </div>
      </div>

    </div>
  `;

  // Attach Events
  const btnStudio = container.querySelector('#btn-dashboard-to-studio');
  const btnQuick = container.querySelector('#btn-quick-create-dash');
  if (btnStudio) btnStudio.addEventListener('click', () => stateStore.setTab('studio'));
  if (btnQuick) btnQuick.addEventListener('click', () => stateStore.setTab('studio'));

  const btnCalendar = container.querySelector('#btn-dashboard-to-calendar');
  if (btnCalendar) btnCalendar.addEventListener('click', () => stateStore.setTab('calendar'));

  const growthLink = container.querySelector('#view-full-growth-analytics');
  if (growthLink) growthLink.addEventListener('click', () => stateStore.setTab('growth'));
}
