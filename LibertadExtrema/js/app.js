/* ==========================================================================
   LIBERTAD EXTREMA - MAIN ENTRY POINT & SPA HASH ROUTER
   ========================================================================== */

import { store } from './services/store.js';
import { Header } from './components/Header.js';
import { HomeView } from './views/HomeView.js';
import { RoutesView } from './views/RoutesView.js';
import { EventsView } from './views/EventsView.js';
import { AdminView } from './views/AdminView.js';

const routesMap = {
  '': HomeView,
  '#/': HomeView,
  '#/home': HomeView,
  '#/rutas': RoutesView,
  '#/eventos': EventsView,
  '#/admin': AdminView
};

function getCurrentRouteKey() {
  const hash = window.location.hash.split('?')[0] || '#/home';
  return hash;
}

export function renderViewContent() {
  const container = document.querySelector('.main-content .container');
  const routeKey = getCurrentRouteKey();
  const activeView = routesMap[routeKey] || HomeView;
  if (container) {
    container.innerHTML = activeView.render();
    if (activeView.bindEvents) {
      activeView.bindEvents();
    }
  } else {
    renderApp();
  }
}

export function renderApp() {
  const routeKey = getCurrentRouteKey();
  const activeView = routesMap[routeKey] || HomeView;

  let currentViewName = 'home';
  if (routeKey.includes('rutas')) currentViewName = 'rutas';
  if (routeKey.includes('eventos')) currentViewName = 'eventos';
  if (routeKey.includes('admin')) currentViewName = 'admin';

  const appEl = document.getElementById('app');
  if (!appEl) return;

  appEl.innerHTML = `
    ${Header.render(currentViewName)}

    <main class="main-content">
      <div class="container">
        ${activeView.render()}
      </div>
    </main>

    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <div class="brand-logo" style="margin-bottom: 1rem;">
              <img src="./logo.jpg" alt="Libertad Extrema" class="logo-img" />
              <span>LIBERTAD <span class="accent">EXTREMA</span></span>
            </div>
            <p>
              Club motero de España dedicado al ruteo de calidad, compañerismo y difusión de la pasión por las dos ruedas.
            </p>
          </div>

          <div>
            <h4 class="footer-title">Secciones</h4>
            <ul class="footer-links">
              <li><a href="#/home">Inicio</a></li>
              <li><a href="#/rutas">Rutas Moteras</a></li>
              <li><a href="#/eventos">Eventos de Interés</a></li>
              <li><a href="#/admin">Zona de Administración</a></li>
            </ul>
          </div>

          <div>
            <h4 class="footer-title">Estados de Ruta</h4>
            <ul class="footer-links">
              <li><a href="#/rutas">🟢 Rutas Previstas</a></li>
              <li><a href="#/rutas">🔵 Rutas Finalizadas</a></li>
              <li><a href="#/rutas">🔴 Rutas Canceladas</a></li>
            </ul>
          </div>

          <div>
            <h4 class="footer-title">Contacto Club</h4>
            <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.6;">
              📍 Madrid / España<br/>
              📧 info@libertadextrema.es<br/>
              📞 +34 600 000 000
            </p>
          </div>
        </div>

        <div class="footer-bottom">
          <div>
            &copy; 2026 Club Motero Libertad Extrema. Todos los derechos reservados.
            • <button id="resetStoreDataBtn" style="background:none; border:none; color: var(--text-dim); text-decoration: underline; font-size: 0.78rem; cursor: pointer; margin-left: 0.5rem;">
              🔄 Restablecer Rutas y Días por Defecto
            </button>
          </div>
          <div>
            Diseñado para amantes del motor en España 🇪🇸
          </div>
        </div>
      </div>
    </footer>
  `;

  // Bind Header & View Interactive Events
  Header.bindEvents();
  if (activeView.bindEvents) {
    activeView.bindEvents();
  }

  // Bind Reset Data Button
  document.getElementById('resetStoreDataBtn')?.addEventListener('click', () => {
    if (confirm('¿Deseas restablecer las rutas por defecto con el mapa de Google Maps y la duración en días?')) {
      store.resetToSeed();
      window.location.reload();
    }
  });
}

// Router Event Listeners
window.addEventListener('hashchange', renderApp);
window.addEventListener('DOMContentLoaded', () => {
  if (!window.location.hash) {
    window.location.hash = '#/home';
  }
  renderApp();
});

// Subscribe store state updates (Do not destroy active open modals)
store.subscribe(() => {
  const activeModal = document.querySelector('.modal-backdrop');
  if (!activeModal) {
    renderApp();
  }
});
