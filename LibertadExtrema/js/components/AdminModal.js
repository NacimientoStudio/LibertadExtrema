/* ==========================================================================
   LIBERTAD EXTREMA - ADMIN LOGIN & CONTENT CREATION MODALS
   ========================================================================== */

import { store } from '../services/store.js';
import { routeService } from '../services/routeService.js';
import { eventService } from '../services/eventService.js';
import { Toast } from './Toast.js';

export const AdminModal = {
  renderLoginModal() {
    return `
      <div class="modal-backdrop active" id="adminLoginModal">
        <div class="modal-container animate-fade-in" style="max-width: 440px;">
          <div class="modal-header">
            <h2 class="modal-title">🔒 Acceso Club Admin</h2>
            <button class="modal-close" id="closeAdminLoginModal">&times;</button>
          </div>
          <div class="modal-body">
            <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.25rem;">
              Accede para publicar nuevas rutas, indicar días de duración, desglosar sub-rutas por jornada y consultar moteros inscritos.
            </p>
            <form id="adminLoginForm">
              <div class="form-group">
                <label class="form-label" for="adminPass">Contraseña de Administración</label>
                <input type="password" id="adminPass" class="form-input" placeholder="Introduce clave admin (ej: admin)" required />
              </div>
              <button type="submit" class="btn btn-primary" style="width: 100%;">
                Entrar al Panel Admin
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  renderNewRouteModal() {
    return `
      <div class="modal-backdrop active" id="newRouteModal">
        <div class="modal-container animate-fade-in" style="max-width: 740px;">
          <div class="modal-header">
            <h2 class="modal-title">🏍️ Publicar Nueva Ruta</h2>
            <button class="modal-close" id="closeNewRouteModal">&times;</button>
          </div>
          <div class="modal-body">
            <form id="createRouteForm">
              <div class="form-group">
                <label class="form-label">Título de la Ruta *</label>
                <input type="text" name="title" class="form-input" placeholder="Ej. Ruta por los Puertos de Gredos" required />
              </div>

              <div class="form-grid-3">
                <div class="form-group">
                  <label class="form-label">Fecha de Salida *</label>
                  <input type="date" name="date" class="form-input" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Duración (Días) *</label>
                  <select name="days" class="form-select" id="daysSelect">
                    <option value="1" selected>1 Día (Ruta de Jornada)</option>
                    <option value="2">2 Días (Fin de Semana)</option>
                    <option value="3">3 Días (Puente / Travesía)</option>
                    <option value="4">4+ Días (Gran Ruta)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Estado Inicial</label>
                  <select name="status" class="form-select">
                    <option value="prevista" selected>Prevista (Inscripciones abiertas)</option>
                    <option value="finalizada">Finalizada (Subir fotos/vídeos)</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Punto de Origen *</label>
                  <input type="text" name="startPoint" class="form-input" placeholder="Ej. Arenas de San Pedro (Ávila)" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Punto de Destino *</label>
                  <input type="text" name="endPoint" class="form-input" placeholder="Ej. Navarredonda de Gredos" required />
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Distancia Total Aprox. (km)</label>
                  <input type="number" name="distance" class="form-input" placeholder="Ej. 280" />
                </div>
                <div class="form-group">
                  <label class="form-label">Dificultad</label>
                  <select name="difficulty" class="form-select">
                    <option value="Fácil">Fácil (Iniciación)</option>
                    <option value="Media" selected>Media (Intermedio)</option>
                    <option value="Media-Alta">Media-Alta (Curvas reviradas)</option>
                    <option value="Alta">Alta (Exigente / Rutón)</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">URL Imagen de Cabecera</label>
                <input type="url" name="image" class="form-input" placeholder="https://images.unsplash.com/..." />
              </div>

              <div class="form-group">
                <label class="form-label">Descripción Detallada de la Ruta</label>
                <textarea name="description" class="form-textarea" placeholder="Indica paradas previstas, alojamientos si es de varios días, almuerzo motero..."></textarea>
              </div>

              <button type="submit" class="btn btn-primary" style="width: 100%;">
                🔥 Crear y Publicar Ruta
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  renderNewEventModal() {
    return `
      <div class="modal-backdrop active" id="newEventModal">
        <div class="modal-container animate-fade-in" style="max-width: 600px;">
          <div class="modal-header">
            <h2 class="modal-title">📰 Publicar Evento de Interés</h2>
            <button class="modal-close" id="closeNewEventModal">&times;</button>
          </div>
          <div class="modal-body">
            <form id="createEventForm">
              <div class="form-group">
                <label class="form-label">Título del Evento / Noticia *</label>
                <input type="text" name="title" class="form-input" placeholder="Ej. Concentración Motera Pingüinos 2027" required />
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label class="form-label">Categoría *</label>
                  <select name="category" class="form-select">
                    <option value="Concentración">Concentración Motera</option>
                    <option value="Competición">Competición / MotoGP</option>
                    <option value="Formación">Formación / Cursos</option>
                    <option value="Quedada">Quedada Local</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Fecha / Periodo *</label>
                  <input type="text" name="date" class="form-input" placeholder="Ej. 28 - 30 de Abril, 2027" required />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Ubicación / Provincia *</label>
                <input type="text" name="location" class="form-input" placeholder="Ej. Jerez de la Frontera (Cádiz)" required />
              </div>

              <div class="form-group">
                <label class="form-label">URL Imagen del Evento</label>
                <input type="url" name="image" class="form-input" placeholder="https://images.unsplash.com/..." />
              </div>

              <div class="form-group">
                <label class="form-label">Enlace Oficial de Registro / Web</label>
                <input type="url" name="link" class="form-input" placeholder="https://..." />
              </div>

              <div class="form-group">
                <label class="form-label">Descripción Informativa</label>
                <textarea name="description" class="form-textarea" placeholder="Resume el interés del evento para los socios del club..."></textarea>
              </div>

              <button type="submit" class="btn btn-primary" style="width: 100%;">
                📢 Publicar Evento
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  bindLoginEvents(onSuccess) {
    const backdrop = document.getElementById('adminLoginModal');
    const closeBtn = document.getElementById('closeAdminLoginModal');
    const form = document.getElementById('adminLoginForm');

    const close = () => {
      backdrop?.classList.remove('active');
      setTimeout(() => backdrop?.remove(), 300);
    };

    closeBtn?.addEventListener('click', close);

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pass = document.getElementById('adminPass').value;
      try {
        await store.loginAdmin('admin', pass);
        Toast.show('¡Bienvenido al Panel de Administración! ⚙️', 'success');
        close();
        if (onSuccess) onSuccess();
      } catch (err) {
        Toast.show(err.message || 'Contraseña incorrecta', 'error');
      }
    });
  },

  bindNewRouteEvents(onSuccess) {
    const backdrop = document.getElementById('newRouteModal');
    const closeBtn = document.getElementById('closeNewRouteModal');
    const form = document.getElementById('createRouteForm');

    const close = () => {
      backdrop?.classList.remove('active');
      setTimeout(() => backdrop?.remove(), 300);
    };

    closeBtn?.addEventListener('click', close);

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      try {
        routeService.createRoute(data);
        Toast.show('¡Ruta creada y publicada con éxito! 🏍️', 'success');
        close();
        if (onSuccess) onSuccess();
      } catch (err) {
        Toast.show(err.message, 'error');
      }
    });
  },

  bindNewEventEvents(onSuccess) {
    const backdrop = document.getElementById('newEventModal');
    const closeBtn = document.getElementById('closeNewEventModal');
    const form = document.getElementById('createEventForm');

    const close = () => {
      backdrop?.classList.remove('active');
      setTimeout(() => backdrop?.remove(), 300);
    };

    closeBtn?.addEventListener('click', close);

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      try {
        eventService.createEvent(data);
        Toast.show('¡Evento publicado con éxito! 📰', 'success');
        close();
        if (onSuccess) onSuccess();
      } catch (err) {
        Toast.show(err.message, 'error');
      }
    });
  }
};
