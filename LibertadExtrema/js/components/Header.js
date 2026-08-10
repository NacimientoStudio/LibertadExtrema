/* ==========================================================================
   LIBERTAD EXTREMA - HEADER COMPONENT
   ========================================================================== */

import { store } from '../services/store.js';

export const Header = {
  render(currentView = 'home') {
    const isAdmin = store.isAdmin();

    return `
      <header class="site-header" id="siteHeader">
        <div class="container header-container">
          <a href="#/home" class="brand-logo">
            <img src="./logo.jpg" alt="Libertad Extrema" class="logo-img" />
            <span>LIBERTAD <span class="accent">EXTREMA</span></span>
          </a>

          <nav>
            <ul class="nav-menu" id="navMenu">
              <li><a href="#/home" class="nav-link ${currentView === 'home' ? 'active' : ''}">Inicio</a></li>
              <li><a href="#/rutas" class="nav-link ${currentView === 'rutas' ? 'active' : ''}">Rutas</a></li>
              <li><a href="#/eventos" class="nav-link ${currentView === 'eventos' ? 'active' : ''}">Eventos de Interés</a></li>
              <li><a href="#/admin" class="nav-link ${currentView === 'admin' ? 'active' : ''}">
                ${isAdmin ? '⚙️ Panel Admin' : '🔒 Zona Admin'}
              </a></li>
            </ul>
          </nav>

          <div class="nav-actions">
            ${isAdmin ? `
              <span class="admin-badge">MODO ADMIN ACTIVO</span>
              <button id="logoutAdminBtn" class="btn btn-secondary btn-sm">Salir Admin</button>
            ` : `
              <a href="#/admin" class="btn btn-primary btn-sm">Acceso Club</a>
            `}
            <button class="mobile-toggle" id="mobileToggle" aria-label="Menú">
              ☰
            </button>
          </div>
        </div>
      </header>
    `;
  },

  bindEvents() {
    const header = document.getElementById('siteHeader');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 30) {
        header?.classList.add('scrolled');
      } else {
        header?.classList.remove('scrolled');
      }
    });

    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    mobileToggle?.addEventListener('click', () => {
      navMenu?.classList.toggle('open');
    });

    const logoutBtn = document.getElementById('logoutAdminBtn');
    logoutBtn?.addEventListener('click', () => {
      store.setAdminMode(false);
      window.location.hash = '#/home';
    });
  }
};
