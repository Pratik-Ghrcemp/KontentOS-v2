// KontentOS — Creator Brain Profile Hub
import { stateStore, GEO_LOCALES } from '../state.js';

export function renderCreatorBrain(container) {
  const state = stateStore.get();
  const profile = state.creatorProfile;
  const locale = GEO_LOCALES[state.geo] || GEO_LOCALES.IN;

  container.innerHTML = `
    <div class="content-container" style="max-width: 1100px;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
            <h1 style="font-size: 2rem;">🧠 Creator Brain & Signature DNA</h1>
            <span class="badge badge-neon">ONLINE & LEARNING</span>
          </div>
          <p style="color: var(--text-muted); font-size: 0.95rem;">
            Your centralized AI memory bank. KontentOS learns your tone, audience hooks, and winning visual style over time.
          </p>
        </div>

        <button id="btn-edit-brain" class="btn btn-primary">
          <span>⚡ Retrain Creator Brain</span>
        </button>
      </div>

      <!-- Bento Grid: Brain Metrics & Archetype -->
      <div class="bento-grid" style="margin-bottom: 2rem;">
        <!-- Left: Voice DNA & Niche -->
        <div class="card card-glow" style="grid-column: span 7;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <h3 style="font-size: 1.2rem;">Creator Voice & Identity</h3>
            <span class="badge badge-purple">${profile.voiceArchetype || 'Dynamic Creator'}</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <div style="background: var(--bg-surface-low); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-subtle);">
              <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-dim); font-weight: 700; margin-bottom: 0.25rem;">
                Operating Mode & Focus
              </div>
              <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-main);">
                ${profile.mode === 'viral' ? `⚡ Viral & Entertainment (${profile.selectedVibe})` : `🎯 Pro Authority (${profile.proNiche || 'General'} • ${profile.proSubNiche || 'Shorts'})`}
              </div>
            </div>

            <div style="background: var(--bg-surface-low); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-subtle);">
              <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--accent-cyan); font-weight: 700; margin-bottom: 0.25rem;">
                Signature Hook Formula & Catchphrase
              </div>
              <div style="font-size: 0.95rem; font-weight: 600; color: var(--accent-gold);">
                "${profile.customCatchphrase || 'Bhai suno!'}" — ${profile.hookFormula}
              </div>
            </div>

            <div style="background: var(--bg-surface-low); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-subtle);">
              <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--accent-secondary); font-weight: 700; margin-bottom: 0.25rem;">
                Audience & Language Synchronization
              </div>
              <div style="font-size: 0.92rem; font-weight: 600;">
                ${profile.language || 'Multi-lingual'} • Live Audience Graph Synced
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Connected Channels & Memory Stats -->
        <div class="card" style="grid-column: span 5;">
          <h3 style="font-size: 1.15rem; margin-bottom: 1rem;">Omni-Channel Distribution</h3>
          
          <div style="display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 1.5rem;">
            ${['instagram', 'youtube', 'x', 'threads', 'facebook', 'linkedin'].map(p => {
              const isConn = profile.connectedPlatforms.includes(p);
              const names = { instagram: 'Instagram Reels', youtube: 'YouTube Shorts', x: '𝕏 (Twitter)', threads: 'Threads', facebook: 'Facebook Watch', linkedin: 'LinkedIn' };
              return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0.85rem; background: var(--bg-surface-low); border-radius: 8px; border: 1px solid var(--border-subtle);">
                  <span style="font-size: 0.88rem; font-weight: 600;">${names[p]}</span>
                  <span class="badge ${isConn ? 'badge-neon' : 'badge-purple'}" style="font-size: 0.65rem;">
                    ${isConn ? 'SYNCED' : 'READY'}
                  </span>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Memory Stats -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; text-align: center;">
            <div style="background: var(--bg-surface-low); padding: 0.85rem; border-radius: 10px; border: 1px solid var(--border-subtle);">
              <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent-primary-light);">42</div>
              <div style="font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase;">Saved Hooks</div>
            </div>
            <div style="background: var(--bg-surface-low); padding: 0.85rem; border-radius: 10px; border: 1px solid var(--border-subtle);">
              <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent-secondary);">12</div>
              <div style="font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase;">Winning Formats</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const editBtn = container.querySelector('#btn-edit-brain');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      stateStore.setTab('onboarding');
    });
  }
}
