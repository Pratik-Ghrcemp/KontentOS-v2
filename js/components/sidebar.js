// KontentOS — Desktop Sidebar & Mobile Bottom Navigation with Settings
import { stateStore } from '../state.js';

export function renderSidebar(sidebarContainer, mobileNavContainer) {
  const state = stateStore.get();
  const profile = state.creatorProfile;
  const currentTab = state.currentTab;

  const menuItems = [
    { id: 'onboarding', label: 'Creator Brain', icon: '🧠' },
    { id: 'dashboard', label: 'Idea Studio', icon: '💡' },
    { id: 'studio', label: 'Raw-to-Reel Studio', icon: '🎬' },
    { id: 'growth', label: 'Growth Intelligence', icon: '📊' },
    { id: 'monetization', label: 'Monetization Hub', icon: '💰' },
    { id: 'settings', label: 'User Settings', icon: '⚙️' }
  ];

  // Render Desktop Sidebar
  if (sidebarContainer) {
    sidebarContainer.innerHTML = `
      <div class="brand-header">
        <div class="brand-logo-badge">⚡</div>
        <div class="brand-title">
          <span>KontentOS</span>
          <span class="brand-subtitle">Creator Suite</span>
        </div>
      </div>

      <nav class="nav-menu">
        ${menuItems.map(item => `
          <div class="nav-item ${currentTab === item.id ? 'active' : ''}" data-tab="${item.id}">
            <span class="nav-icon">${item.icon}</span>
            <span>${item.label}</span>
          </div>
        `).join('')}
      </nav>

      <div class="sidebar-user-card" id="sidebar-user-profile-trigger" style="cursor: pointer;" title="Click to open User Settings">
        <div class="user-avatar">${(profile.name || 'C').charAt(0)}</div>
        <div class="user-info">
          <div class="user-name">${profile.name || 'Creator'}</div>
          <div class="user-tier">
            <span>●</span> ${profile.isPro ? 'Creator Pro' : 'Free Tier'}
          </div>
        </div>
      </div>
    `;

    sidebarContainer.querySelectorAll('.nav-item').forEach(el => {
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
    mobileNavContainer.innerHTML = menuItems.map(item => `
      <button class="mobile-nav-btn ${currentTab === item.id ? 'active' : ''}" data-tab="${item.id}">
        <span class="icon">${item.icon}</span>
        <span>${item.label.split(' ')[0]}</span>
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
