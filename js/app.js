// KontentOS — Main Application Controller with Settings Routing
import { stateStore } from './state.js';
import { renderTopBar } from './components/topbar.js';
import { renderSidebar } from './components/sidebar.js';
import { renderOnboarding } from './components/onboarding.js';
import { renderCreatorBrain } from './components/creator-brain.js';
import { renderIdeaStudio } from './components/idea-studio.js';
import { renderRawStudio } from './components/raw-studio.js';
import { renderGrowthHub } from './components/growth-hub.js';
import { renderMonetization } from './components/monetization.js';
import { renderSettingsPage } from './components/settings-page.js';

function initApp() {
  const topBarContainer = document.getElementById('topbar-container');
  const sidebarContainer = document.getElementById('desktop-sidebar');
  const mobileNavContainer = document.getElementById('mobile-bottom-nav');
  const viewContainer = document.getElementById('active-view-container');

  function render() {
    const state = stateStore.get();

    // Apply active theme attribute
    document.documentElement.setAttribute('data-theme', state.theme);

    // Render Shell
    renderTopBar(topBarContainer);
    renderSidebar(sidebarContainer, mobileNavContainer);

    // Render Active View
    viewContainer.innerHTML = '';
    switch (state.currentTab) {
      case 'onboarding':
        renderOnboarding(viewContainer);
        break;
      case 'brain':
        renderCreatorBrain(viewContainer);
        break;
      case 'dashboard':
        renderIdeaStudio(viewContainer);
        break;
      case 'studio':
        renderRawStudio(viewContainer);
        break;
      case 'growth':
        renderGrowthHub(viewContainer);
        break;
      case 'monetization':
        renderMonetization(viewContainer);
        break;
      case 'settings':
        renderSettingsPage(viewContainer);
        break;
      default:
        renderOnboarding(viewContainer);
        break;
    }
  }

  // Subscribe to state changes
  stateStore.subscribe(() => {
    render();
  });

  // Initial render
  render();
}

document.addEventListener('DOMContentLoaded', initApp);
