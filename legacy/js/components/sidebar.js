// KontentOS — V3 Silk Desktop Sidebar & Mobile Navigation
import { stateStore } from '../state.js';

export function renderSidebar(sidebarContainer, mobileNavContainer) {
  const state = stateStore.get();
  const profile = state.creatorProfile;
  const currentTab = state.currentTab;

  const menuItems = [
    { id: 'dashboard', label: 'Intelligence Dashboard', icon: 'dashboard', short: 'Dashboard' },
    { id: 'studio', label: 'Studio Hub', icon: 'movie_edit', short: 'Studio' },
    { id: 'growth', label: 'Growth Intelligence', icon: 'trending_up', short: 'Growth' },
    { id: 'calendar', label: 'Content Calendar', icon: 'calendar_month', short: 'Calendar' },
    { id: 'monetization', label: 'Monetization Hub', icon: 'payments', short: 'Monetize' },
    { id: 'audience', label: 'Audience CRM', icon: 'group', short: 'Audience' },
    { id: 'media_kit', label: 'Media Kit', icon: 'badge', short: 'Media Kit' },
    { id: 'onboarding', label: 'Creator Brain', icon: 'psychology', short: 'Brain' },
    { id: 'settings', label: 'User Settings', icon: 'settings', short: 'Settings' }
  ];

  // Render Desktop Sidebar
  if (sidebarContainer) {
    sidebarContainer.innerHTML = `
      <div>
        <!-- Brand Header -->
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; padding: 0.5rem 0.25rem;">
          <div style="width: 38px; height: 38px; border-radius: 12px; background: var(--bg-surface-card); box-shadow: var(--shadow-neo-raised); display: flex; align-items: center; justify-content: center; color: var(--accent-primary); font-weight: 800; font-size: 1.1rem;">
            ⚡
          </div>
          <div>
            <div style="font-weight: 800; font-size: 1.05rem; letter-spacing: -0.02em; color: var(--text-main);">KontentOS</div>
            <div style="font-size: 0.68rem; font-weight: 600; color: var(--text-muted);">Studio White Edition</div>
          </div>
        </div>

        <!-- Navigation Menu -->
        <nav style="display: flex; flex-direction: column; gap: 0.35rem;">
          ${menuItems.map(item => {
            const isActive = currentTab === item.id;
            return `
              <button class="btn ${isActive ? 'btn-primary' : 'btn-secondary'} nav-menu-btn" data-tab="${item.id}" style="width: 100%; justify-content: flex-start; padding: 0.65rem 0.85rem; font-size: 0.85rem; font-weight: ${isActive ? '800' : '600'}; ${isActive ? 'box-shadow: 0 4px 14px var(--accent-primary-glow);' : 'box-shadow: none; background: transparent;'}">
                <span class="material-symbols-outlined" style="font-size: 1.15rem;">${item.icon}</span>
                <span>${item.label}</span>
              </button>
            `;
          }).join('')}
        </nav>
      </div>

      <!-- Bottom User Profile Card -->
      <div id="sidebar-user-profile-trigger" style="cursor: pointer; padding: 0.75rem; border-radius: 14px; background: var(--bg-surface-card); box-shadow: var(--shadow-neo-raised); display: flex; align-items: center; gap: 0.65rem; transition: all 0.2s ease;" title="Click to open User Settings">
        <div style="width: 34px; height: 34px; border-radius: 50%; background: var(--accent-primary); color: #fff; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; justify-content: center;">
          ${(profile.name || 'C').charAt(0)}
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 700; font-size: 0.82rem; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${profile.name || 'Creator Name'}
          </div>
          <div style="font-size: 0.68rem; color: var(--accent-primary); font-weight: 600;">
            ● ${profile.isPro ? 'Pro Creator' : 'Free Tier'}
          </div>
        </div>
        <span class="material-symbols-outlined" style="font-size: 1rem; color: var(--text-dim);">tune</span>
      </div>
    `;

    sidebarContainer.querySelectorAll('.nav-menu-btn').forEach(el => {
      el.addEventListener('click', () => {
        const tab = el.getAttribute('data-tab');
        stateStore.setTab(tab);
      });
    });

    const userCard = sidebarContainer.querySelector('#sidebar-user-profile-trigger');
    if (userCard) {
      userCard.addEventListener('click', () => {
        stateStore.setTab('settings');
      });
    }
  }

  // Render Mobile Bottom Navigation
  if (mobileNavContainer) {
    const mobileItems = menuItems.slice(0, 5);
    mobileNavContainer.innerHTML = mobileItems.map(item => `
      <button class="mobile-nav-btn ${currentTab === item.id ? 'active' : ''}" data-tab="${item.id}" style="background: none; border: none; color: ${currentTab === item.id ? 'var(--accent-primary)' : 'var(--text-muted)'}; display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 0.68rem; font-weight: 700; cursor: pointer;">
        <span class="material-symbols-outlined" style="font-size: 1.25rem;">${item.icon}</span>
        <span>${item.short}</span>
      </button>
    `).join('');

    mobileNavContainer.querySelectorAll('.mobile-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        stateStore.setTab(tab);
      });
    });
  }
}
