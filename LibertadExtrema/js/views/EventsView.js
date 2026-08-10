/* ==========================================================================
   LIBERTAD EXTREMA - EVENTS & NEWS VIEW
   ========================================================================== */

import { store } from '../services/store.js';
import { EventCard } from '../components/EventCard.js';
import { renderViewContent } from '../app.js';

let activeCategory = 'todas';

export const EventsView = {
  render() {
    const allEvents = store.getEvents();
    const events = activeCategory === 'todas' 
      ? allEvents 
      : allEvents.filter(e => e.category.toLowerCase() === activeCategory.toLowerCase());

    return `
      <section style="margin-bottom: 2rem;">
        <span style="color: var(--secondary); font-family: var(--font-heading); font-weight: 700; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.08em;">
          📰 ACTUALIDAD Y MOTOR
        </span>
        <h1 style="font-family: var(--font-heading); font-size: 2.4rem; font-weight: 900; text-transform: uppercase; margin-bottom: 0.5rem;">
          Eventos de Interés y Noticias
        </h1>
        <p style="color: var(--text-muted); max-width: 650px;">
          Mantente informado sobre las concentraciones moteras más importantes de España, premios de MotoGP, rodadas en circuito y quedadas de nuestro club.
        </p>
      </section>

      <!-- Category Filter Tabs -->
      <div class="filter-bar">
        <div class="tabs-group">
          <button class="tab-btn ${activeCategory === 'todas' ? 'active' : ''}" data-category="todas">
            Todos
          </button>
          <button class="tab-btn ${activeCategory === 'concentración' ? 'active' : ''}" data-category="concentración">
            Concentraciones
          </button>
          <button class="tab-btn ${activeCategory === 'competición' ? 'active' : ''}" data-category="competición">
            MotoGP / Competición
          </button>
          <button class="tab-btn ${activeCategory === 'formación' ? 'active' : ''}" data-category="formación">
            Cursos / Formación
          </button>
        </div>
      </div>

      <!-- Events Grid -->
      ${events.length === 0 ? `
        <div style="background: var(--bg-card); padding: 4rem 2rem; text-align: center; border-radius: var(--radius-lg); border: 1px solid var(--glass-border);">
          <p style="font-size: 1.1rem; color: var(--text-muted);">
            No hay eventos registrados en esta categoría por ahora.
          </p>
        </div>
      ` : `
        <div class="cards-grid">
          ${events.map(e => EventCard.render(e)).join('')}
        </div>
      `}
    `;
  },

  bindEvents() {
    document.querySelectorAll('.tab-btn[data-category]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeCategory = e.currentTarget.dataset.category;
        renderViewContent();
      });
    });
  }
};
