/* ==========================================================================
   LIBERTAD EXTREMA - ROUTE CARD COMPONENT
   ========================================================================== */

export const RouteCard = {
  render(route) {
    const isPrevista = route.status === 'prevista';
    const isFinalizada = route.status === 'finalizada';
    const isCancelada = route.status === 'cancelada';

    const activeRiders = (route.riders || []).filter(r => r.status !== 'unsubscribed');
    const riderCount = activeRiders.length;
    const photoCount = route.media && route.media.photos ? route.media.photos.length : 0;
    const videoCount = route.media && route.media.videos ? route.media.videos.length : 0;
    
    const days = route.days || 1;
    const isMultiDay = days > 1;

    let statusLabel = 'Prevista';
    if (isFinalizada) statusLabel = 'Finalizada';
    if (isCancelada) statusLabel = 'Cancelada';

    return `
      <article class="route-card animate-fade-in" data-id="${route.id}">
        <div class="route-card-media">
          <img src="${route.image}" alt="${route.title}" loading="lazy" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=80';" />
          <div class="route-card-badge">
            <span class="badge-status ${route.status}">${statusLabel}</span>
          </div>
          <div class="route-card-date">
            📅 ${route.dateFormatted || route.date}
          </div>
          ${isMultiDay ? `
            <div style="position: absolute; top: 1rem; left: 1rem; background: var(--flame-gradient); color: #fff; font-family: var(--font-heading); font-weight: 800; font-size: 0.75rem; padding: 0.25rem 0.65rem; border-radius: var(--radius-sm); box-shadow: var(--shadow-sm);">
              🗓️ ${days} DÍAS DE RUTA
            </div>
          ` : ''}
        </div>

        <div class="route-card-body">
          <h3 class="route-card-title">${route.title}</h3>
          
          ${isCancelada ? `
            <div style="background: var(--status-cancelada-bg); border: 1px solid var(--status-cancelada-border); color: #ff5252; padding: 0.6rem; border-radius: var(--radius-sm); font-size: 0.85rem; margin-bottom: 1rem;">
              ⚠️ <strong>Motivo de cancelación:</strong> ${route.cancellationReason || 'Cancelada por incidencias o meteorología.'}
            </div>
          ` : `
            <p class="route-card-desc">${route.description}</p>
          `}

          <div class="route-meta-grid">
            <div class="meta-item">
              <span class="meta-label">Duración</span>
              <span class="meta-value" style="color: var(--primary);">${days} ${days === 1 ? 'Día' : 'Días'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Distancia</span>
              <span class="meta-value">${route.distance}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Dificultad</span>
              <span class="meta-value">${route.difficulty}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Salida</span>
              <span class="meta-value" title="${route.startPoint}">
                ${route.startPoint.split('(')[0]}
              </span>
            </div>
          </div>

          <div class="route-card-footer">
            <div class="rider-count">
              ${isFinalizada ? `
                📸 <span class="highlight">${photoCount} fotos</span> • 🎬 <span class="highlight">${videoCount} vídeos</span>
              ` : `
                🏍️ <span class="highlight">${riderCount}</span> moteros inscritos
              `}
            </div>

            <button class="btn ${isPrevista ? 'btn-primary' : 'btn-secondary'} btn-sm view-route-btn" data-id="${route.id}">
              ${isPrevista ? 'Ver Ruta / Apuntarse' : isFinalizada ? 'Ver Galería & Recap' : 'Ver Info'}
            </button>
          </div>
        </div>
      </article>
    `;
  }
};
