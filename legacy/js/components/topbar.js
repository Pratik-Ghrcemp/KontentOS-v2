// KontentOS — V3 Silk Top Bar Component
import { stateStore } from '../state.js';

export function renderTopBar(container) {
  const state = stateStore.get();
  const profile = state.creatorProfile;
  const isDark = state.theme === 'dark';

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; height: 100%;">
      <!-- Left: Breadcrumb / Active Screen Title -->
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div style="font-weight: 800; font-size: 1.15rem; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem; cursor: pointer;" id="topbar-logo-click">
          <span style="color: var(--accent-primary);">⚡</span>
          <span>KontentOS</span>
          <span class="badge badge-neon" style="font-size: 0.62rem;">STUDIO WHITE V3</span>
        </div>
      </div>

      <!-- Right: Search, Theme Switcher, Quick Create, User Avatar -->
      <div style="display: flex; align-items: center; gap: 0.85rem;">
        <!-- Theme Toggle Button -->
        <button id="btn-theme-toggle" class="btn btn-secondary" style="padding: 0.4rem 0.75rem; font-size: 0.82rem; border-radius: 999px;" title="Switch Studio White / Midnight Dark">
          <span>${isDark ? '☀️ Studio White' : '🌙 Midnight Dark'}</span>
        </button>

        <!-- Quick Create CTA Button -->
        <button id="btn-header-create" class="btn btn-primary" style="padding: 0.45rem 1.15rem; font-size: 0.85rem;">
          <span>⚡ Studio Hub</span>
        </button>

        <!-- User Profile Pill -->
        <div id="topbar-user-avatar" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 4px 8px; border-radius: 999px; background: var(--bg-surface-card); box-shadow: var(--shadow-neo-raised-sm);" title="Open User Settings">
          <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--accent-primary); color: #fff; font-weight: 800; font-size: 0.8rem; display: flex; align-items: center; justify-content: center;">
            ${(profile.name || 'C').charAt(0)}
          </div>
          <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-main); padding-right: 4px;">${(profile.name || 'Creator').split(' ')[0]}</span>
        </div>
      </div>
    </div>
  `;

  // Attach Event Listeners
  const logoClick = container.querySelector('#topbar-logo-click');
  if (logoClick) {
    logoClick.addEventListener('click', () => {
      stateStore.setTab('dashboard');
    });
  }

  const createBtn = container.querySelector('#btn-header-create');
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      stateStore.setTab('studio');
    });
  }

  const themeToggle = container.querySelector('#btn-theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      stateStore.setTheme(nextTheme);
    });
  }

  const avatarClick = container.querySelector('#topbar-user-avatar');
  if (avatarClick) {
    avatarClick.addEventListener('click', () => {
      stateStore.setTab('settings');
    });
  }
}
