/* ==========================================================================
   LIBERTAD EXTREMA - HOME VIEW
   ========================================================================== */

import { store } from '../services/store.js';
import { RouteCard } from '../components/RouteCard.js';
import { EventCard } from '../components/EventCard.js';
import { RouteModal } from '../components/RouteModal.js';
import { renderViewContent } from '../app.js';

export const HomeView = {
  render() {
    const routes = store.getRoutes();
    const previstRoutes = routes.filter(r => r.status === 'prevista').slice(0, 3);
    const finalizadasRoutes = routes.filter(r => r.status === 'finalizada').slice(0, 3);
    const events = store.getEvents().slice(0, 3);

    return `
      <!-- Hero Banner Section -->
      <section class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">
            SIENTE LA <span class="highlight">LIBERTAD EXTREMA</span> EN CADA RUTA
          </h1>
          <p class="hero-subtitle">
            Un club motero creado por y para apasionados de las curvas, el asfalto y la buena compañía. Explora nuestras próximas rodadas, apúntate en segundos y comparte tus vivencias.
          </p>

          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <a href="#/rutas" class="btn btn-primary btn-lg">
              🏍️ Ver Próximas Rutas
            </a>
            <a href="#/eventos" class="btn btn-outline btn-lg">
              📰 Eventos de Interés
            </a>
          </div>

          <div class="hero-stats">
            <div class="stat-item">
              <span class="stat-value">${routes.length}<span>+</span></span>
              <span class="stat-label">Rutas Organizadas</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">120<span>+</span></span>
              <span class="stat-label">Moteros Activos</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">15k<span>km</span></span>
              <span class="stat-label">Rodados en España</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Section: Próximas Rutas Previstas -->
      <section style="margin-bottom: 4rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <span style="color: var(--primary); font-family: var(--font-heading); font-weight: 700; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.08em;">
              🔥 INSCRIPCIONES ABIERTAS
            </span>
            <h2 style="font-family: var(--font-heading); font-size: 2rem; font-weight: 900; text-transform: uppercase;">
              Próximas Rutas Previstas
            </h2>
          </div>
          <a href="#/rutas" class="btn btn-outline btn-sm">Ver Todas las Rutas →</a>
        </div>

        ${previstRoutes.length === 0 ? `
          <p style="color: var(--text-dim); text-align: center; padding: 2rem; background: var(--bg-card); border-radius: var(--radius-md);">
            No hay rutas previstas en este momento. ¡Vuelve pronto!
          </p>
        ` : `
          <div class="cards-grid">
            ${previstRoutes.map(r => RouteCard.render(r)).join('')}
          </div>
        `}
      </section>

      <!-- Section: Rutas Finalizadas y Recaps -->
      ${finalizadasRoutes.length > 0 ? `
        <section style="margin-bottom: 4rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span style="color: var(--status-finalizada); font-family: var(--font-heading); font-weight: 700; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.08em;">
                📸 RECAPS & MULTIMEDIA
              </span>
              <h2 style="font-family: var(--font-heading); font-size: 2rem; font-weight: 900; text-transform: uppercase;">
                Últimas Rutas Finalizadas
              </h2>
            </div>
            <a href="#/rutas" class="btn btn-secondary btn-sm">Ver Galerías Completas</a>
          </div>

          <div class="cards-grid">
            ${finalizadasRoutes.map(r => RouteCard.render(r)).join('')}
          </div>
        </section>
      ` : ''}

      <!-- Section: Eventos de Interés -->
      <section>
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <span style="color: var(--secondary); font-family: var(--font-heading); font-weight: 700; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.08em;">
              📰 NOTICIAS & QUEDADAS
            </span>
            <h2 style="font-family: var(--font-heading); font-size: 2rem; font-weight: 900; text-transform: uppercase;">
              Eventos del Mundo Motero
            </h2>
          </div>
          <a href="#/eventos" class="btn btn-outline btn-sm">Ver Todos los Eventos →</a>
        </div>

        <div class="cards-grid">
          ${events.map(e => EventCard.render(e)).join('')}
        </div>
      </section>

      <div id="modalContainer"></div>
    `;
  },

  bindEvents() {
    const modalContainer = document.getElementById('modalContainer');

    document.querySelectorAll('.view-route-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const routeId = e.currentTarget.dataset.id;
        const route = store.getRouteById(routeId);
        if (route && modalContainer) {
          modalContainer.innerHTML = RouteModal.render(route);
          RouteModal.bindEvents(route, () => {
            const cardRiderCount = document.querySelector(`.route-card[data-id="${route.id}"] .rider-count`);
            if (cardRiderCount) {
              const updatedRoute = store.getRouteById(route.id);
              const activeCount = (updatedRoute?.riders || []).filter(r => r.status !== 'unsubscribed').length;
              cardRiderCount.innerHTML = `🏍️ <span class="highlight">${activeCount}</span> moteros inscritos`;
            }
          });
          const modalBackdrop = document.getElementById('routeModal');
          requestAnimationFrame(() => modalBackdrop?.classList.add('active'));
        }
      });
    });
  }
};
