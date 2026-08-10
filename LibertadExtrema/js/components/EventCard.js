/* ==========================================================================
   LIBERTAD EXTREMA - EVENT CARD COMPONENT
   ========================================================================== */

export const EventCard = {
  render(event) {
    return `
      <article class="event-card animate-fade-in">
        <div class="event-card-media">
          <img src="${event.image}" alt="${event.title}" loading="lazy" />
          <span class="event-category-tag">${event.category}</span>
        </div>
        <div class="event-card-body">
          <div class="event-card-date">
            📅 ${event.date} • 📍 ${event.location}
          </div>
          <h3 class="event-card-title">${event.title}</h3>
          <p class="route-card-desc">${event.description}</p>
          
          <div style="margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.8rem; color: var(--text-dim);">Evento de Interés</span>
            ${event.link ? `
              <a href="${event.link}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">
                Más información ↗
              </a>
            ` : ''}
          </div>
        </div>
      </article>
    `;
  }
};
