/* ==========================================================================
   LIBERTAD EXTREMA - ROUTES VIEW (FILTERABLE BY 3 STATES: PREVISTA, FINALIZADA, CANCELADA)
   ========================================================================== */

import { store } from '../services/store.js';
import { RouteCard } from '../components/RouteCard.js';
import { RouteModal } from '../components/RouteModal.js';
import { renderViewContent } from '../app.js';

let activeFilter = 'todas';

export const RoutesView = {
  render() {
    const routes = store.getRoutes(activeFilter);
    const allRoutes = store.getRoutes('todas');

    const counts = {
      todas: allRoutes.length,
      prevista: allRoutes.filter(r => r.status === 'prevista').length,
      finalizada: allRoutes.filter(r => r.status === 'finalizada').length,
      cancelada: allRoutes.filter(r => r.status === 'cancelada').length
    };

    return `
      <section style="margin-bottom: 2rem;">
        <span style="color: var(--primary); font-family: var(--font-heading); font-weight: 700; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.08em;">
          🏍️ RUTA Y CARRETERA
        </span>
        <h1 style="font-family: var(--font-heading); font-size: 2.4rem; font-weight: 900; text-transform: uppercase; margin-bottom: 0.5rem;">
          Catálogo de Rutas Moteras
        </h1>
        <p style="color: var(--text-muted); max-width: 650px;">
          Filtra nuestras rodadas según su estado: apúntate a las rutas <strong>Previstas</strong>, rememora con fotos y vídeos las <strong>Finalizadas</strong> o revisa los avisos de las <strong>Canceladas</strong>.
        </p>
      </section>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <div class="tabs-group">
          <button class="tab-btn ${activeFilter === 'todas' ? 'active' : ''}" data-filter="todas">
            Todas (${counts.todas})
          </button>
          <button class="tab-btn ${activeFilter === 'prevista' ? 'active' : ''}" data-filter="prevista">
            🟢 Previstas (${counts.prevista})
          </button>
          <button class="tab-btn ${activeFilter === 'finalizada' ? 'active' : ''}" data-filter="finalizada">
            🔵 Finalizadas (${counts.finalizada})
          </button>
          <button class="tab-btn ${activeFilter === 'cancelada' ? 'active' : ''}" data-filter="cancelada">
            🔴 Canceladas (${counts.cancelada})
          </button>
        </div>

        <div style="font-size: 0.85rem; color: var(--text-dim);">
          Mostrando ${routes.length} de ${counts.todas} rutas
        </div>
      </div>

      <!-- Routes Cards Grid -->
      ${routes.length === 0 ? `
        <div style="background: var(--bg-card); padding: 4rem 2rem; text-align: center; border-radius: var(--radius-lg); border: 1px solid var(--glass-border);">
          <p style="font-size: 1.2rem; color: var(--text-muted); margin-bottom: 1rem;">
            No se encontraron rutas con el estado seleccionado.
          </p>
          <button class="btn btn-outline btn-sm" id="resetFilterBtn">Mostrar todas las rutas</button>
        </div>
      ` : `
        <div class="cards-grid">
          ${routes.map(r => RouteCard.render(r)).join('')}
        </div>
      `}

      <div id="modalContainer"></div>
    `;
  },

  bindEvents() {
    const modalContainer = document.getElementById('modalContainer');

    // Filter tabs
    document.querySelectorAll('.tab-btn[data-filter]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeFilter = e.currentTarget.dataset.filter;
        renderViewContent();
      });
    });

    // Reset filter
    document.getElementById('resetFilterBtn')?.addEventListener('click', () => {
      activeFilter = 'todas';
      renderViewContent();
    });

    // View Route / Signup Button
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
