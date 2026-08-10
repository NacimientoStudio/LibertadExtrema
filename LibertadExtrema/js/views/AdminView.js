/* ==========================================================================
   LIBERTAD EXTREMA - ADMIN VIEW & MANAGEMENT DASHBOARD
   ========================================================================== */

import { store } from '../services/store.js';
import { routeService } from '../services/routeService.js';
import { eventService } from '../services/eventService.js';
import { mediaService } from '../services/mediaService.js';
import { AdminModal } from '../components/AdminModal.js';
import { Toast } from '../components/Toast.js';
import { renderViewContent } from '../app.js';

let activeAdminTab = 'rutas'; // 'rutas', 'inscritos', 'media', 'eventos'
let selectedRouteForRiders = '';
let selectedRouteForMedia = '';

export const AdminView = {
  render() {
    const isAdmin = store.isAdmin();

    if (!isAdmin) {
      return `
        <div style="max-width: 500px; margin: 4rem auto; text-align: center; background: var(--bg-card); padding: 3rem 2rem; border-radius: var(--radius-lg); border: 1px solid var(--glass-border);">
          <div style="font-size: 3.5rem; margin-bottom: 1rem;">🔒</div>
          <h2 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; margin-bottom: 0.75rem;">Acceso Restringido</h2>
          <p style="color: var(--text-muted); margin-bottom: 2rem; font-size: 0.95rem;">
            Debes iniciar sesión con las credenciales de administración del club motero para acceder a la gestión de rutas, lista de moteros inscritos y subida multimedia.
          </p>
          <button id="openAdminLoginFromViewBtn" class="btn btn-primary btn-lg" style="width: 100%;">
            🔑 Abrir Inicio de Sesión Admin
          </button>
        </div>
        <div id="modalContainer"></div>
      `;
    }

    const routes = store.getRoutes('todas');
    const events = store.getEvents();

    if (!selectedRouteForRiders && routes.length > 0) {
      selectedRouteForRiders = routes[0].id;
    }
    if (!selectedRouteForMedia && routes.length > 0) {
      const firstFinalizada = routes.find(r => r.status === 'finalizada') || routes[0];
      selectedRouteForMedia = firstFinalizada.id;
    }

    const activeRidersRoute = store.getRouteById(selectedRouteForRiders);
    const activeMediaRoute = store.getRouteById(selectedRouteForMedia);

    return `
      <!-- Admin Header Bar -->
      <div class="admin-header-bar container">
        <div class="admin-title-row">
          <div>
            <span class="admin-badge">PANEL DE CONTROL CLUB</span>
            <h1 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 900; margin-top: 0.3rem;">
              Administración "Libertad Extrema"
            </h1>
          </div>
          <div>
            <button id="adminExitBtn" class="btn btn-secondary btn-sm">🔒 Cerrar Sesión</button>
          </div>
        </div>
      </div>

      <!-- Admin Nav Tabs -->
      <div class="admin-nav-tabs">
        <button class="admin-tab ${activeAdminTab === 'rutas' ? 'active' : ''}" data-tab="rutas">
          🏍️ Gestión de Rutas y Estados (${routes.length})
        </button>
        <button class="admin-tab ${activeAdminTab === 'inscritos' ? 'active' : ''}" data-tab="inscritos">
          📱 Moteros Inscritos por Ruta
        </button>
        <button class="admin-tab ${activeAdminTab === 'media' ? 'active' : ''}" data-tab="media">
          📸 Subida Fotos & Vídeos (Recap)
        </button>
        <button class="admin-tab ${activeAdminTab === 'eventos' ? 'active' : ''}" data-tab="eventos">
          📰 Eventos de Interés (${events.length})
        </button>
      </div>

      <!-- TAB 1: GESTIÓN DE RUTAS Y ESTADOS -->
      ${activeAdminTab === 'rutas' ? `
        <div class="animate-fade-in">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
            <h3>Todas las Rutas</h3>
            <button id="btnOpenNewRouteModal" class="btn btn-primary">
              ➕ Crear Nueva Ruta
            </button>
          </div>

          <div class="riders-table-container">
            <table class="riders-table">
              <thead>
                <tr>
                  <th>Ruta</th>
                  <th>Duración</th>
                  <th>Fecha</th>
                  <th>Estado Actual</th>
                  <th>Moteros</th>
                  <th>Acciones / Cambio de Estado</th>
                </tr>
              </thead>
              <tbody>
                ${routes.map(r => `
                  <tr>
                    <td>
                      <strong>${r.title}</strong><br/>
                      <small style="color: var(--text-dim);">${r.startPoint} ➔ ${r.endPoint} (${r.distance})</small>
                    </td>
                    <td>
                      <span style="font-weight: 700; color: var(--primary);">🗓️ ${r.days || 1} ${(r.days || 1) === 1 ? 'Día' : 'Días'}</span>
                      ${(r.subRoutes && r.subRoutes.length > 0) ? `<br/><small style="color: var(--text-dim);">${r.subRoutes.length} etapas</small>` : ''}
                    </td>
                    <td>${r.dateFormatted || r.date}</td>
                    <td>
                      <span class="badge-status ${r.status}">${r.status}</span>
                    </td>
                    <td>
                      <strong>${r.riders ? r.riders.length : 0}</strong> inscritos
                    </td>
                    <td>
                      <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <select class="form-select status-change-select" data-route-id="${r.id}" style="padding: 0.35rem 0.6rem; font-size: 0.85rem; width: 140px;">
                          <option value="prevista" ${r.status === 'prevista' ? 'selected' : ''}>Prevista</option>
                          <option value="finalizada" ${r.status === 'finalizada' ? 'selected' : ''}>Finalizada</option>
                          <option value="cancelada" ${r.status === 'cancelada' ? 'selected' : ''}>Cancelada</option>
                        </select>
                        <button class="btn btn-danger btn-sm delete-route-btn" data-route-id="${r.id}" title="Eliminar ruta">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      <!-- TAB 2: CONSULTA DE MOTEROS INSCRITOS POR RUTA (TELÉFONOS MÓVILES) -->
      ${activeAdminTab === 'inscritos' ? `
        <div class="animate-fade-in">
          <div style="background: var(--bg-card); padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--glass-border); margin-bottom: 1.5rem;">
            <label class="form-label" style="font-size: 1rem; color: var(--primary);">Seleccionar Ruta para Consultar Inscritos y Bajas:</label>
            <select id="routeSelectForRiders" class="form-select" style="font-size: 1.05rem; padding: 0.75rem;">
              ${routes.map(r => {
                const rRiders = r.riders || [];
                const nActive = rRiders.filter(x => x.status !== 'unsubscribed').length;
                const nBajas = rRiders.filter(x => x.status === 'unsubscribed').length;
                return `
                  <option value="${r.id}" ${r.id === selectedRouteForRiders ? 'selected' : ''}>
                    ${r.title} [${r.status.toUpperCase()}] (${nActive} Activos, ${nBajas} Bajas)
                  </option>
                `;
              }).join('')}
            </select>
          </div>

          ${activeRidersRoute ? `
            <div style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
              <h3>Historial e Inscritos en "${activeRidersRoute.title}"</h3>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <span class="badge-status ${activeRidersRoute.status}">${activeRidersRoute.status.toUpperCase()}</span>
              </div>
            </div>

            ${(!activeRidersRoute.riders || activeRidersRoute.riders.length === 0) ? `
              <div style="background: var(--bg-card); padding: 3rem; text-align: center; border-radius: var(--radius-md); border: 1px solid var(--glass-border);">
                <p style="color: var(--text-muted); font-size: 1.1rem;">No hay registro de moteros ni bajas en esta ruta todavía.</p>
              </div>
            ` : `
              <div class="riders-table-container">
                <table class="riders-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nombre del Motero</th>
                      <th>Teléfono Móvil</th>
                      <th>Estado / Auditoría</th>
                      <th>Llamada Rápida</th>
                      <th>Fecha Registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${activeRidersRoute.riders.map((rider, idx) => {
                      const isUnsubscribed = rider.status === 'unsubscribed';
                      return `
                        <tr style="${isUnsubscribed ? 'opacity: 0.65; background: rgba(255, 82, 82, 0.05);' : ''}">
                          <td><strong>${idx + 1}</strong></td>
                          <td><strong>🏍️ ${rider.name}</strong></td>
                          <td><code>${rider.phone}</code></td>
                          <td>
                            ${isUnsubscribed ? `
                              <span style="background: rgba(255, 82, 82, 0.15); border: 1px solid rgba(255, 82, 82, 0.4); color: #ff5252; font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: var(--radius-sm);">
                                🔴 BAJA REGISTRADA (${rider.unsubscribedAt || 'Baja'})
                              </span>
                            ` : `
                              <span style="background: rgba(0, 230, 118, 0.15); border: 1px solid rgba(0, 230, 118, 0.4); color: var(--status-prevista); font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: var(--radius-sm);">
                                🟢 ACTIVO EN RUTA
                              </span>
                            `}
                          </td>
                          <td>
                            <a href="tel:${rider.phone.replace(/\s+/g, '')}" class="phone-link" style="${isUnsubscribed ? 'filter: grayscale(0.8);' : ''}">
                              📞 Llamar (${rider.name.split(' ')[0]})
                            </a>
                          </td>
                          <td style="color: var(--text-dim); font-size: 0.85rem;">
                            ${rider.date || 'Alta reciente'}
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            `}
          ` : ''}
        </div>
      ` : ''}

      <!-- TAB 3: SUBIDA DE FOTOS Y VÍDEOS (RUTAS FINALIZADAS) -->
      ${activeAdminTab === 'media' ? `
        <div class="animate-fade-in">
          <div style="background: var(--bg-card); padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--glass-border); margin-bottom: 1.5rem;">
            <label class="form-label" style="font-size: 1rem; color: var(--status-finalizada);">Seleccionar Ruta para Gestionar Multimedia:</label>
            <select id="routeSelectForMedia" class="form-select" style="font-size: 1.05rem; padding: 0.75rem;">
              ${routes.map(r => `
                <option value="${r.id}" ${r.id === selectedRouteForMedia ? 'selected' : ''}>
                  ${r.title} [${r.status.toUpperCase()}]
                </option>
              `).join('')}
            </select>
          </div>

          ${activeMediaRoute ? `
            <div class="form-grid-2" style="margin-bottom: 2rem;">
              <!-- Form Subir Foto -->
              <div style="background: var(--bg-card); padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--glass-border);">
                <h4 style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 800; color: var(--text-main); margin-bottom: 1rem;">
                  📸 Añadir Foto a la Ruta
                </h4>
                <form id="addPhotoForm">
                  <div class="form-group">
                    <label class="form-label">URL de la Foto o Subir Archivo</label>
                    <input type="text" id="photoUrlInput" class="form-input" placeholder="https://images.unsplash.com/..." required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">O bien Seleccionar Archivo Local (JPG/PNG)</label>
                    <input type="file" id="photoFileInput" accept="image/*" class="form-input" style="padding: 0.4rem;" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Pie de foto / Título</label>
                    <input type="text" id="photoCaptionInput" class="form-input" placeholder="Ej. Parada para almorzar en el puerto" />
                  </div>
                  <button type="submit" class="btn btn-primary" style="width: 100%;">➕ Guardar Foto</button>
                </form>
              </div>

              <!-- Form Añadir Vídeo -->
              <div style="background: var(--bg-card); padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--glass-border);">
                <h4 style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 800; color: var(--text-main); margin-bottom: 1rem;">
                  🎬 Añadir Vídeo a la Ruta
                </h4>
                <form id="addVideoForm">
                  <div class="form-group">
                    <label class="form-label">URL de YouTube / Vimeo / Vídeo Directo</label>
                    <input type="url" id="videoUrlInput" class="form-input" placeholder="https://www.youtube.com/watch?v=..." required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Título del Vídeo</label>
                    <input type="text" id="videoTitleInput" class="form-input" placeholder="Ej. Resumen de la rodada por el puerto" required />
                  </div>
                  <button type="submit" class="btn btn-outline" style="width: 100%;">🎬 Guardar Vídeo</button>
                </form>
              </div>
            </div>

            <!-- Existing Media Gallery Preview & Delete -->
            <div>
              <h3>Galería Actual de "${activeMediaRoute.title}"</h3>
              
              <h4 style="margin-top: 1rem; color: var(--text-muted);">Fotos (${activeMediaRoute.media?.photos?.length || 0})</h4>
              <div class="media-preview-grid">
                ${(activeMediaRoute.media?.photos || []).map((p, idx) => `
                  <div class="media-preview-item">
                    <img src="${p.url}" alt="${p.caption}" />
                    <button class="media-remove-btn remove-photo-btn" data-index="${idx}" title="Eliminar foto">&times;</button>
                  </div>
                `).join('')}
              </div>

              <h4 style="margin-top: 1.5rem; color: var(--text-muted);">Vídeos (${activeMediaRoute.media?.videos?.length || 0})</h4>
              <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">
                ${(activeMediaRoute.media?.videos || []).map((v, idx) => `
                  <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-deep); padding: 0.75rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--glass-border);">
                    <span>🎬 <strong>${v.title}</strong> (${v.embedUrl})</span>
                    <button class="btn btn-danger btn-sm remove-video-btn" data-index="${idx}">Eliminar</button>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- TAB 4: GESTIÓN DE EVENTOS -->
      ${activeAdminTab === 'eventos' ? `
        <div class="animate-fade-in">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
            <h3>Eventos de Interés Publicados</h3>
            <button id="btnOpenNewEventModal" class="btn btn-primary">
              📢 Publicar Nuevo Evento
            </button>
          </div>

          <div class="riders-table-container">
            <table class="riders-table">
              <thead>
                <tr>
                  <th>Título Evento</th>
                  <th>Categoría</th>
                  <th>Fecha / Periodo</th>
                  <th>Ubicación</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                ${events.map(e => `
                  <tr>
                    <td><strong>${e.title}</strong></td>
                    <td><span class="event-category-tag" style="position: static;">${e.category}</span></td>
                    <td>${e.date}</td>
                    <td>📍 ${e.location}</td>
                    <td>
                      <button class="btn btn-danger btn-sm delete-event-btn" data-event-id="${e.id}">
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      <div id="modalContainer"></div>
    `;
  },

  bindEvents() {
    const modalContainer = document.getElementById('modalContainer');

    // Login from view button
    document.getElementById('openAdminLoginFromViewBtn')?.addEventListener('click', () => {
      if (modalContainer) {
        modalContainer.innerHTML = AdminModal.renderLoginModal();
        AdminModal.bindLoginEvents(() => {
          renderViewContent();
        });
      }
    });

    // Exit Admin
    document.getElementById('adminExitBtn')?.addEventListener('click', () => {
      store.setAdminMode(false);
      window.location.hash = '#/home';
    });

    // Tab switcher
    document.querySelectorAll('.admin-tab[data-tab]').forEach(tab => {
      tab.addEventListener('click', (e) => {
        activeAdminTab = e.currentTarget.dataset.tab;
        renderViewContent();
      });
    });

    // Tab 1 Events: Status Change & Create Route
    document.getElementById('btnOpenNewRouteModal')?.addEventListener('click', () => {
      if (modalContainer) {
        modalContainer.innerHTML = AdminModal.renderNewRouteModal();
        AdminModal.bindNewRouteEvents(() => {
          renderViewContent();
        });
      }
    });

    document.querySelectorAll('.status-change-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const routeId = e.currentTarget.dataset.routeId;
        const newStatus = e.currentTarget.value;
        
        let reason = '';
        if (newStatus === 'cancelada') {
          reason = prompt('Introduce el motivo de la cancelación de esta ruta:', 'Inclemencias meteorológicas o causa de fuerza mayor');
          if (reason === null) {
            // Revert
            renderViewContent();
            return;
          }
        }

        try {
          routeService.updateRouteStatus(routeId, newStatus, reason);
          Toast.show(`Estado de la ruta actualizado a "${newStatus.toUpperCase()}"`, 'success');
          renderViewContent();
        } catch (err) {
          Toast.show(err.message, 'error');
        }
      });
    });

    document.querySelectorAll('.delete-route-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const routeId = e.currentTarget.dataset.routeId;
        if (confirm('¿Seguro que deseas eliminar esta ruta por completo?')) {
          routeService.deleteRoute(routeId);
          Toast.show('Ruta eliminada correctamente', 'info');
          renderViewContent();
        }
      });
    });

    // Tab 2 Events: Rider Select
    const routeSelectForRiders = document.getElementById('routeSelectForRiders');
    routeSelectForRiders?.addEventListener('change', (e) => {
      selectedRouteForRiders = e.target.value;
      renderViewContent();
    });

    // Tab 3 Events: Media Select & Form Submit
    const routeSelectForMedia = document.getElementById('routeSelectForMedia');
    routeSelectForMedia?.addEventListener('change', (e) => {
      selectedRouteForMedia = e.target.value;
      renderViewContent();
    });

    // Local file photo upload handler
    const photoFileInput = document.getElementById('photoFileInput');
    const photoUrlInput = document.getElementById('photoUrlInput');
    photoFileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (photoUrlInput) photoUrlInput.value = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    const addPhotoForm = document.getElementById('addPhotoForm');
    addPhotoForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = photoUrlInput.value;
      const caption = document.getElementById('photoCaptionInput').value;

      try {
        mediaService.addPhotoToRoute(selectedRouteForMedia, url, caption);
        Toast.show('¡Foto añadida a la ruta con éxito! 📸', 'success');
        renderViewContent();
      } catch (err) {
        Toast.show(err.message, 'error');
      }
    });

    const addVideoForm = document.getElementById('addVideoForm');
    addVideoForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = document.getElementById('videoUrlInput').value;
      const title = document.getElementById('videoTitleInput').value;

      try {
        mediaService.addVideoToRoute(selectedRouteForMedia, url, title);
        Toast.show('¡Vídeo vinculado a la ruta! 🎬', 'success');
        renderViewContent();
      } catch (err) {
        Toast.show(err.message, 'error');
      }
    });

    document.querySelectorAll('.remove-photo-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index);
        mediaService.removeMedia(selectedRouteForMedia, 'photo', idx);
        Toast.show('Foto eliminada', 'info');
        renderViewContent();
      });
    });

    document.querySelectorAll('.remove-video-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index);
        mediaService.removeMedia(selectedRouteForMedia, 'video', idx);
        Toast.show('Vídeo eliminado', 'info');
        renderViewContent();
      });
    });

    // Tab 4 Events: Create / Delete Events
    document.getElementById('btnOpenNewEventModal')?.addEventListener('click', () => {
      if (modalContainer) {
        modalContainer.innerHTML = AdminModal.renderNewEventModal();
        AdminModal.bindNewEventEvents(() => {
          renderViewContent();
        });
      }
    });

    document.querySelectorAll('.delete-event-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const eventId = e.currentTarget.dataset.eventId;
        if (confirm('¿Seguro que deseas eliminar este evento?')) {
          eventService.deleteEvent(eventId);
          Toast.show('Evento eliminado', 'info');
          renderViewContent();
        }
      });
    });
  }
};
