// KontentOS — Clean Top Bar Component
import { stateStore } from '../state.js';

export function renderTopBar(container) {
  const state = stateStore.get();

  container.innerHTML = `
    <header class="top-app-bar">
      <div class="top-bar-left">
        <div class="brand-title" style="font-size: 1.25rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; cursor: pointer;" id="topbar-logo-click">
          <span style="background: var(--accent-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">KontentOS</span>
          <span class="badge badge-purple" style="font-size: 0.65rem; padding: 2px 6px;">CREATOR SUITE</span>
        </div>
      </div>

      <div class="top-bar-right">
        <!-- Quick Create CTA -->
        <button id="btn-header-create" class="btn-quick-create">
          <span>⚡</span>
          <span>Quick Create</span>
        </button>
      </div>
    </header>
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
}
