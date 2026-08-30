// KontentOS — Omni-Channel Content Calendar (V3 Studio White Edition)
import { stateStore } from '../state.js';

export function renderCalendar(container) {
  const state = stateStore.get();
  const profile = state.creatorProfile;

  let activeCalendarView = 'week'; // 'week', 'month', 'queue'

  const scheduledPosts = [
    {
      id: 'post-1',
      day: 'Monday',
      time: '06:30 PM',
      platform: 'Instagram Reels',
      platformIcon: '📸',
      badgeClass: 'badge-neon',
      title: 'POV: 3 AI Tools That Feel Illegal in 2026',
      status: 'Ready / Auto-Publish',
      reachEst: '45K - 60K'
    },
    {
      id: 'post-2',
      day: 'Tuesday',
      time: '08:00 AM',
      platform: 'LinkedIn Article',
      platformIcon: '💼',
      badgeClass: 'badge-purple',
      title: 'The Asymmetric Creator: How Systems Compound',
      status: 'Ready / Auto-Publish',
      reachEst: '18K - 24K'
    },
    {
      id: 'post-3',
      day: 'Wednesday',
      time: '07:15 PM',
      platform: 'YouTube Shorts',
      platformIcon: '▶️',
      badgeClass: 'badge-cyan',
      title: 'Stop Spending 4 Hours on Raw Footage Edits',
      status: 'Queued (Auto-Sync)',
      reachEst: '70K - 110K'
    },
    {
      id: 'post-4',
      day: 'Thursday',
      time: '01:00 PM',
      platform: '𝕏 Viral Thread',
      platformIcon: '𝕏',
      badgeClass: 'badge-neon',
      title: '10 Harsh Truths About Building an Online Brand in 2026',
      status: 'Ready / Auto-Publish',
      reachEst: '35K - 50K'
    },
    {
      id: 'post-5',
      day: 'Friday',
      time: '05:45 PM',
      platform: 'TikTok & Reels',
      platformIcon: '🎵',
      badgeClass: 'badge-purple',
      title: 'Behind The Scenes: Studio Setup Tour & Workflow',
      status: 'Draft (Needs Audio Review)',
      reachEst: '50K - 85K'
    },
    {
      id: 'post-6',
      day: 'Saturday',
      time: '11:00 AM',
      platform: 'Newsletter & PDF',
      platformIcon: '📑',
      badgeClass: 'badge-green',
      title: 'The Weekly Creator Blueprint #42',
      status: 'Scheduled',
      reachEst: '12.5K Subscribers'
    }
  ];

  function renderMain() {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        
        <!-- Top Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
              <h1 style="font-size: 1.85rem; font-weight: 800; letter-spacing: -0.02em; color: var(--text-main);">
                Omni-Channel Content Calendar
              </h1>
              <span class="badge badge-neon">6 PLATFORMS SYNCED</span>
            </div>
            <p style="color: var(--text-muted); font-size: 0.9rem;">
              Automated multi-platform scheduling engine with AI-predicted optimum engagement windows.
            </p>
          </div>

          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <!-- View Switcher -->
            <div style="display: flex; background: var(--bg-surface-card); box-shadow: var(--shadow-neo-pressed); padding: 3px; border-radius: 12px; gap: 3px;">
              <button class="btn ${activeCalendarView === 'week' ? 'btn-primary' : 'btn-secondary'} btn-cal-view" data-view="week" style="padding: 0.4rem 0.85rem; font-size: 0.78rem;">
                Week
              </button>
              <button class="btn ${activeCalendarView === 'month' ? 'btn-primary' : 'btn-secondary'} btn-cal-view" data-view="month" style="padding: 0.4rem 0.85rem; font-size: 0.78rem;">
                Month
              </button>
              <button class="btn ${activeCalendarView === 'queue' ? 'btn-primary' : 'btn-secondary'} btn-cal-view" data-view="queue" style="padding: 0.4rem 0.85rem; font-size: 0.78rem;">
                Queue (${scheduledPosts.length})
              </button>
            </div>

            <button id="btn-schedule-new" class="btn btn-primary" style="padding: 0.55rem 1.15rem; font-size: 0.85rem;">
              <span class="material-symbols-outlined" style="font-size: 1.1rem;">add</span>
              <span>Schedule Post</span>
            </button>
          </div>
        </div>

        <!-- Optimum Posting Windows Alert -->
        <div class="card neo-raised" style="padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(99, 102, 241, 0.15); display: flex; align-items: center; justify-content: center; color: var(--accent-primary); font-size: 1.1rem;">
              ⚡
            </div>
            <div>
              <div style="font-weight: 800; font-size: 0.88rem; color: var(--text-main);">AI Peak Velocity Recommendation</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Your target demographic is most active during <strong>Mon-Thu 6:00 PM - 8:30 PM</strong> and <strong>Sat 11:00 AM</strong>.</div>
            </div>
          </div>
          <div style="display: flex; gap: 0.35rem;">
            <span class="badge badge-neon">Today 6:30 PM (Peak)</span>
            <span class="badge badge-purple">Tomorrow 8:00 AM</span>
          </div>
        </div>

        <!-- Weekly Calendar Grid -->
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.75rem;">
          ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
            const dayPosts = scheduledPosts.filter(p => p.day === day);
            const isToday = day === 'Monday';

            return `
              <div class="card neo-raised" style="padding: 0.85rem 0.65rem; min-height: 380px; display: flex; flex-direction: column; justify-content: space-between; ${isToday ? 'border: 1.5px solid var(--accent-primary);' : ''}">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.35rem;">
                    <strong style="font-size: 0.82rem; color: ${isToday ? 'var(--accent-primary)' : 'var(--text-main)'};">${day.slice(0, 3)}</strong>
                    ${isToday ? '<span class="badge badge-neon" style="font-size: 0.55rem; padding: 1px 4px;">TODAY</span>' : ''}
                  </div>

                  <!-- Post Cards in Day -->
                  <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${dayPosts.map(p => `
                      <div style="background: var(--bg-surface-card); box-shadow: var(--shadow-neo-raised-sm); padding: 0.65rem; border-radius: 10px; cursor: pointer; transition: all 0.2s ease;" class="cal-post-card" title="Click to edit schedule">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                          <span style="font-size: 0.65rem; font-weight: 700; color: var(--accent-primary);">${p.time}</span>
                          <span class="badge ${p.badgeClass}" style="font-size: 0.55rem; padding: 1px 4px;">${p.platform.split(' ')[0]}</span>
                        </div>
                        <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-main); line-height: 1.3; margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                          ${p.title}
                        </div>
                        <div style="font-size: 0.65rem; color: var(--text-dim);">
                          🎯 ${p.reachEst}
                        </div>
                      </div>
                    `).join('')}

                    ${dayPosts.length === 0 ? `
                      <div style="text-align: center; padding: 2rem 0; color: var(--text-dim); font-size: 0.72rem;">
                        No posts scheduled
                      </div>
                    ` : ''}
                  </div>
                </div>

                <button class="btn btn-secondary btn-add-day-post" data-day="${day}" style="width: 100%; padding: 0.35rem; font-size: 0.7rem; border-radius: 8px;">
                  + Add Post
                </button>
              </div>
            `;
          }).join('')}
        </div>

        <!-- 1-Click Publishing Pipeline Queue Details -->
        <div class="card neo-raised">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-main);">Publishing Pipeline Queue (All Connected Channels)</h3>
            <button id="btn-dispatch-now" class="btn btn-primary" style="padding: 0.45rem 1rem; font-size: 0.82rem;">
              🚀 1-Click Dispatch All Ready Posts
            </button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.65rem;">
            ${scheduledPosts.map(p => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: var(--bg-surface-card); box-shadow: var(--shadow-neo-raised-sm); border-radius: 12px;">
                <div style="display: flex; align-items: center; gap: 0.85rem;">
                  <span style="font-size: 1.25rem;">${p.platformIcon}</span>
                  <div>
                    <div style="font-weight: 800; font-size: 0.85rem; color: var(--text-main);">${p.title}</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">${p.platform} • Scheduled for <strong>${p.day} at ${p.time}</strong></div>
                  </div>
                </div>

                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <span class="badge ${p.badgeClass}">${p.status}</span>
                  <button class="btn btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;">Edit</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    container.querySelectorAll('.btn-cal-view').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCalendarView = btn.getAttribute('data-view');
        renderMain();
      });
    });

    const btnSchedule = container.querySelector('#btn-schedule-new');
    if (btnSchedule) {
      btnSchedule.addEventListener('click', () => {
        stateStore.setTab('studio');
      });
    }

    const btnDispatch = container.querySelector('#btn-dispatch-now');
    if (btnDispatch) {
      btnDispatch.addEventListener('click', () => {
        alert('🚀 All 6 scheduled posts successfully dispatched to your connected channels!');
      });
    }

    container.querySelectorAll('.btn-add-day-post').forEach(btn => {
      btn.addEventListener('click', () => {
        const day = btn.getAttribute('data-day');
        stateStore.setTab('studio');
      });
    });
  }

  renderMain();
}
