/* ==========================================================================
   LIBERTAD EXTREMA - ROUTE MODAL COMPONENT (WITH GOOGLE MAPS DIRECTIONS & SUB-ROUTES BY DAY)
   ========================================================================== */

import { routeService } from '../services/routeService.js';
import { generateGoogleMapsDirUrl, store } from '../services/store.js';
import { Toast } from './Toast.js';
import { renderViewContent } from '../app.js';

export const RouteModal = {
  render(route) {
    if (!route) return '';

    const isPrevista = route.status === 'prevista';
    const isFinalizada = route.status === 'finalizada';
    const isCancelada = route.status === 'cancelada';

    const allRiders = route.riders || [];
    const activeRiders = allRiders.filter(r => r.status !== 'unsubscribed');
    const photos = (route.media && route.media.photos) || [];
    const videos = (route.media && route.media.videos) || [];
    const subRoutes = route.subRoutes || [];
    const days = route.days || 1;

    // Automatic Directions URL from Start to End
    const directionsUrl = route.mapUrl && route.mapUrl.includes('dir/?api=1') 
      ? route.mapUrl 
      : generateGoogleMapsDirUrl(route.startPoint, route.endPoint);

    return `
      <div class="modal-backdrop" id="routeModal">
        <div class="modal-container animate-fade-in" style="max-width: 800px;">
          <div class="modal-header">
            <div>
              <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.4rem;">
                <span class="badge-status ${route.status}">
                  ${route.status.toUpperCase()}
                </span>
                <span style="background: var(--bg-elevated); border: 1px solid var(--glass-border); color: var(--primary-light); font-family: var(--font-heading); font-size: 0.78rem; font-weight: 800; padding: 0.25rem 0.6rem; border-radius: var(--radius-full);">
                  🗓️ DURACIÓN: ${days} ${days === 1 ? 'DÍA' : 'DÍAS'}
                </span>
              </div>
              <h2 class="modal-title">${route.title}</h2>
            </div>
            <button class="modal-close" id="closeRouteModal">&times;</button>
          </div>

          <div class="modal-body">
            <!-- Header Image -->
            <div style="height: 250px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 1.5rem; position: relative;">
              <img src="${route.image}" alt="${route.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=80';" />
              <div style="position: absolute; bottom: 1rem; left: 1rem; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); padding: 0.5rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--glass-border); font-size: 0.9rem;">
                📅 <strong>Fecha:</strong> ${route.dateFormatted || route.date}
              </div>
            </div>

            <!-- Route Details Info -->
            <div class="route-meta-grid" style="margin-bottom: 1.5rem; padding: 1rem;">
              <div class="meta-item">
                <span class="meta-label">Origen</span>
                <span class="meta-value">${route.startPoint}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Destino Final</span>
                <span class="meta-value">${route.endPoint}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Distancia Total</span>
                <span class="meta-value">${route.distance}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Dificultad</span>
                <span class="meta-value">${route.difficulty}</span>
              </div>
            </div>

            <p style="color: var(--text-muted); line-height: 1.6; font-size: 1rem; margin-bottom: 1.5rem;">
              ${route.description}
            </p>

            <!-- Google Maps Directions Button (Origen a Destino) -->
            <div style="margin-bottom: 2rem; background: rgba(255, 87, 34, 0.06); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid rgba(255, 87, 34, 0.25); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
              <div>
                <h4 style="font-family: var(--font-heading); font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.2rem;">
                  🗺️ RUTA COMPLETA EN GOOGLE MAPS
                </h4>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">
                  Calcular itinerario GPS punto a punto: <strong>${route.startPoint}</strong> ➔ <strong>${route.endPoint}</strong>
                </p>
              </div>
              <a href="${directionsUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">
                📍 Abrir Ruta Origen ➔ Destino ↗
              </a>
            </div>

            <!-- SUB-ROUTES BY DAY (SUB RUTAS POR DÍA) -->
            ${(subRoutes.length > 0 || days > 1) ? `
              <div style="margin-bottom: 2rem; background: var(--bg-deep); border-radius: var(--radius-md); padding: 1.5rem; border: 1px solid var(--glass-border);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.2rem;">
                  <h3 style="font-family: var(--font-heading); font-size: 1.2rem; font-weight: 800; color: var(--primary); text-transform: uppercase; margin: 0;">
                    🗓️ DESGLOSE DE SUB-RUTAS POR DÍA (${days} ${days === 1 ? 'DÍA' : 'DÍAS'})
                  </h3>
                  <span style="font-size: 0.82rem; color: var(--text-dim);">Itinerarios diarios</span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 1rem;">
                  ${(subRoutes.length > 0 ? subRoutes : [
                    { day: 1, title: `Día 1: ${route.startPoint} a ${route.endPoint}`, startPoint: route.startPoint, endPoint: route.endPoint, distance: route.distance }
                  ]).map(sr => {
                    const srMapUrl = sr.mapUrl || generateGoogleMapsDirUrl(sr.startPoint, sr.endPoint);
                    return `
                      <div style="background: var(--bg-card); border-radius: var(--radius-md); padding: 1.1rem; border: 1px solid var(--glass-border); display: flex; flex-direction: column; gap: 0.6rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                          <span style="background: var(--flame-gradient); color: #fff; font-family: var(--font-heading); font-weight: 800; font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: var(--radius-sm);">
                            DÍA ${sr.day || 1}
                          </span>
                          <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-main);">
                            📏 Distancia tramo: ${sr.distance || 'N/A'}
                          </span>
                        </div>
                        <h4 style="font-family: var(--font-heading); font-size: 1.05rem; font-weight: 800; color: var(--text-main);">
                          ${sr.title}
                        </h4>
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.4rem; padding-top: 0.6rem; border-top: 1px dashed rgba(255,255,255,0.08);">
                          <span style="font-size: 0.85rem; color: var(--text-muted);">
                            📍 <strong>Tramo:</strong> ${sr.startPoint || route.startPoint} ➔ ${sr.endPoint || route.endPoint}
                          </span>
                          <a href="${srMapUrl}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">
                            🗺️ Mapa Día ${sr.day || 1} ↗
                          </a>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            ` : ''}

            <!-- PREVISTA: SIGNUP / UNSUBSCRIBE FORM & RIDERS LIST -->
            ${isPrevista ? `
              <div id="signupBoxContainer" style="background: var(--bg-deep); padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--glass-border); margin-bottom: 1.5rem;">
                <h3 style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 800; color: var(--primary); margin-bottom: 0.5rem; text-transform: uppercase;">
                  🏍️ Inscripción / Gestión de Plaza
                </h3>
                <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 1.2rem;">
                  Apúntate indicando tu nombre y teléfono móvil o cancela tu plaza rellenando tu número.
                </p>

                <form id="riderSignupForm" data-route-id="${route.id}">
                  <div class="form-grid-2" style="margin-bottom: 1rem;">
                    <div class="form-group" style="margin: 0;">
                      <label class="form-label" for="riderName">Nombre Completo *</label>
                      <input type="text" id="riderName" class="form-input" placeholder="Ej. Juan Pérez / Motero12" />
                    </div>
                    <div class="form-group" style="margin: 0;">
                      <label class="form-label" for="riderPhone">Teléfono Móvil (España) *</label>
                      <input type="tel" id="riderPhone" class="form-input" placeholder="Ej. 612 345 678" required />
                    </div>
                  </div>
                  <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                    <button type="submit" id="btnConfirmSignup" class="btn btn-primary" style="flex: 2; min-width: 200px;">
                      ✅ Confirmar mi Inscripción
                    </button>
                    <button type="button" id="btnUnsubscribeRider" class="btn btn-outline" style="flex: 1; border-color: rgba(255, 82, 82, 0.4); color: #ff5252; min-width: 140px;">
                      ❌ Darse de Baja
                    </button>
                  </div>
                </form>
              </div>

              <!-- List of Registered Active Riders -->
              <div>
                <h4 style="font-family: var(--font-heading); font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.75rem;">
                  Moteros Apuntados (<span id="ridersCountBadge">${activeRiders.length}</span>)
                </h4>
                <div id="ridersListContainer" style="display: flex; flex-wrap: wrap; gap: 0.6rem;">
                  ${activeRiders.length === 0 ? `
                    <p style="font-size: 0.9rem; color: var(--text-dim);" id="noRidersMsg">Sé el primero en apuntarte a esta ruta.</p>
                  ` : `
                    ${activeRiders.map(r => `
                      <span style="background: var(--bg-elevated); border: 1px solid var(--glass-border); padding: 0.4rem 0.8rem; border-radius: var(--radius-full); font-size: 0.85rem; color: var(--text-main); display: inline-flex; align-items: center; gap: 0.4rem;">
                        🏍️ ${r.name}
                      </span>
                    `).join('')}
                  `}
                </div>
              </div>
            ` : ''}

            <!-- FINALIZADA: MEDIA GALLERY (PHOTOS & VIDEOS) -->
            ${isFinalizada ? `
              <div style="margin-top: 1.5rem;">
                <h3 style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 800; color: var(--status-finalizada); margin-bottom: 1rem; text-transform: uppercase;">
                  📸 Galería de Fotos y Vídeos
                </h3>

                <!-- Photos Grid -->
                <h4 style="font-size: 0.95rem; color: var(--text-muted); margin-bottom: 0.75rem;">Fotos de la Ruta (${photos.length})</h4>
                ${photos.length === 0 ? `
                  <p style="font-size: 0.88rem; color: var(--text-dim); margin-bottom: 1.5rem;">Los administradores aún no han subido fotos para esta ruta.</p>
                ` : `
                  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                    ${photos.map(p => `
                      <div style="height: 140px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--glass-border); position: relative;">
                        <img src="${p.url}" alt="${p.caption || 'Foto'}" style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;" onclick="window.open('${p.url}', '_blank')" />
                        ${p.caption ? `
                          <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.75); padding: 0.3rem 0.5rem; font-size: 0.75rem; color: #fff; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                            ${p.caption}
                          </div>
                        ` : ''}
                      </div>
                    `).join('')}
                  </div>
                `}

                <!-- Videos Grid -->
                <h4 style="font-size: 0.95rem; color: var(--text-muted); margin-bottom: 0.75rem;">Vídeos de la Ruta (${videos.length})</h4>
                ${videos.length === 0 ? `
                  <p style="font-size: 0.88rem; color: var(--text-dim);">No hay vídeos publicados para esta ruta.</p>
                ` : `
                  <div style="display: grid; grid-template-columns: 1fr; gap: 1rem;">
                    ${videos.map(v => `
                      <div style="background: var(--bg-deep); border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--glass-border); padding: 0.75rem;">
                        <h5 style="font-size: 0.9rem; color: var(--text-main); margin-bottom: 0.5rem;">🎬 ${v.title}</h5>
                        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: var(--radius-sm);">
                          <iframe src="${v.embedUrl}" style="position: absolute; top:0; left:0; width:100%; height:100%; border:0;" allowfullscreen></iframe>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                `}
              </div>
            ` : ''}

            <!-- CANCELADA BANNER -->
            ${isCancelada ? `
              <div style="background: var(--status-cancelada-bg); border: 1px solid var(--status-cancelada-border); border-radius: var(--radius-md); padding: 1.25rem; color: #ff5252;">
                <h4 style="font-family: var(--font-heading); font-size: 1.1rem; font-weight: 800; margin-bottom: 0.4rem;">
                  ⚠️ Ruta Cancelada
                </h4>
                <p style="font-size: 0.92rem; color: #ffcdd2;">
                  ${route.cancellationReason || 'Lamentablemente esta ruta ha tenido que suspenderse. Consulta nuestras próximas rutas disponibles.'}
                </p>
              </div>
            ` : ''}
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" id="closeRouteModalFooter">Cerrar</button>
          </div>
        </div>
      </div>
    `;
  },

  bindEvents(route, onSignupSuccess) {
    const backdrop = document.getElementById('routeModal');
    const closeBtns = [document.getElementById('closeRouteModal'), document.getElementById('closeRouteModalFooter')];

    const closeModal = () => {
      backdrop?.classList.remove('active');
      setTimeout(() => {
        backdrop?.remove();
        renderViewContent();
      }, 300);
    };

    closeBtns.forEach(btn => btn?.addEventListener('click', closeModal));

    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });

    const signupForm = document.getElementById('riderSignupForm');
    signupForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const routeId = signupForm.dataset.routeId;
      const nameInput = document.getElementById('riderName');
      const phoneInput = document.getElementById('riderPhone');

      const name = nameInput ? nameInput.value.trim() : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';

      try {
        routeService.registerRider(routeId, name, phone);
        Toast.show(`¡Inscripción confirmada para ${name}! 🏍️`, 'success');

        // Render Success Box inside Modal
        const signupBoxContainer = document.getElementById('signupBoxContainer');
        if (signupBoxContainer) {
          signupBoxContainer.style.background = 'rgba(0, 230, 118, 0.12)';
          signupBoxContainer.style.borderColor = 'rgba(0, 230, 118, 0.4)';
          signupBoxContainer.innerHTML = `
            <div style="text-align: center; padding: 0.5rem 0;">
              <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🎉</div>
              <h4 style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 800; color: var(--status-prevista); margin-bottom: 0.4rem; text-transform: uppercase;">
                ¡INSCRIPCIÓN REALIZADA CON ÉXITO!
              </h4>
              <p style="font-size: 1rem; color: var(--text-main); margin-bottom: 0.5rem;">
                Hola <strong>${name}</strong>, has quedado oficialmente registrado en <strong>${route.title}</strong>.
              </p>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">
                Un organizador del club podrá contactar al teléfono <code>${phone}</code> antes de la fecha de salida.
              </p>
            </div>
          `;
        }

        // Update list of active riders in modal
        const noRidersMsg = document.getElementById('noRidersMsg');
        if (noRidersMsg) noRidersMsg.remove();

        const ridersListContainer = document.getElementById('ridersListContainer');
        if (ridersListContainer) {
          const newRiderChip = document.createElement('span');
          newRiderChip.style.cssText = 'background: rgba(0, 230, 118, 0.2); border: 1px solid var(--status-prevista); padding: 0.4rem 0.8rem; border-radius: var(--radius-full); font-size: 0.85rem; color: var(--status-prevista); display: inline-flex; align-items: center; gap: 0.4rem; animation: fadeIn 0.4s ease; font-weight: 700;';
          newRiderChip.innerHTML = `🏍️ ${name} (¡Tú!)`;
          ridersListContainer.appendChild(newRiderChip);
        }

        const countBadge = document.getElementById('ridersCountBadge');
        if (countBadge) {
          const currentActive = (store.getRouteById(routeId)?.riders || []).filter(r => r.status !== 'unsubscribed');
          countBadge.textContent = currentActive.length;
        }

        if (onSignupSuccess) onSignupSuccess();
      } catch (err) {
        Toast.show(err.message, 'error');
      }
    });

    // Unsubscribe Button Listener
    const btnUnsubscribe = document.getElementById('btnUnsubscribeRider');
    btnUnsubscribe?.addEventListener('click', () => {
      const phoneInput = document.getElementById('riderPhone');
      const phone = phoneInput ? phoneInput.value.trim() : '';

      if (!phone) {
        Toast.show('Escribe tu número de teléfono móvil para verificar tu inscripción y darte de baja.', 'info');
        phoneInput?.focus();
        return;
      }

      // Step 1: Validate Spanish phone format
      const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
      const esPhoneRegex = /^(\+34|0034)?[67]\d{8}$/;
      if (!esPhoneRegex.test(cleanedPhone)) {
        Toast.show('Introduce un número de teléfono móvil válido en España (9 dígitos comenzando por 6 o 7).', 'error');
        phoneInput?.focus();
        return;
      }

      // Step 2: Validate if phone is registered as active BEFORE asking for confirmation!
      const currentRouteState = store.getRouteById(route.id);
      const getDigits9 = (s) => (s ? String(s).replace(/\D/g, '').slice(-9) : '');
      const inputDigits = getDigits9(phone);
      const activeRiders = (currentRouteState?.riders || []).filter(r => r.status !== 'unsubscribed');
      const targetRider = activeRiders.find(r => getDigits9(r.phone) === inputDigits);

      if (!targetRider) {
        Toast.show(`No consta ninguna inscripción activa asociada al teléfono ${phone} en esta ruta.`, 'error');
        return;
      }

      // Step 3: ONLY ask for confirmation AFTER verifying the phone exists!
      if (!confirm(`Hola ${targetRider.name}, ¿estás seguro de que deseas darte de baja de la ruta "${route.title}"?`)) {
        return;
      }

      try {
        const unsubscribedRider = (routeService && typeof routeService.unregisterRider === 'function')
          ? routeService.unregisterRider(route.id, phone)
          : store.unregisterRider(route.id, phone);
        Toast.show(`Baja confirmada para ${unsubscribedRider.name}.`, 'info');

        const signupBoxContainer = document.getElementById('signupBoxContainer');
        if (signupBoxContainer) {
          signupBoxContainer.style.background = 'rgba(255, 82, 82, 0.08)';
          signupBoxContainer.style.borderColor = 'rgba(255, 82, 82, 0.3)';
          signupBoxContainer.innerHTML = `
            <div style="text-align: center; padding: 0.5rem 0;">
              <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">ℹ️</div>
              <h4 style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 800; color: #ff5252; margin-bottom: 0.4rem; text-transform: uppercase;">
                BAJA PROCESADA CORRECTAMENTE
              </h4>
              <p style="font-size: 1rem; color: var(--text-main); margin-bottom: 0.5rem;">
                <strong>${unsubscribedRider.name}</strong>, te has dado de baja oficialmente de la ruta <strong>${route.title}</strong>.
              </p>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">
                Teléfono: <code>${unsubscribedRider.phone}</code>. ¡Esperamos volver a rodar contigo muy pronto!
              </p>
            </div>
          `;
        }

        // Re-render active riders list in modal
        const ridersListContainer = document.getElementById('ridersListContainer');
        if (ridersListContainer) {
          const updatedRoute = store.getRouteById(route.id);
          const currentActive = (updatedRoute?.riders || []).filter(r => r.status !== 'unsubscribed');
          if (currentActive.length === 0) {
            ridersListContainer.innerHTML = `<p style="font-size: 0.9rem; color: var(--text-dim);" id="noRidersMsg">Sé el primero en apuntarte a esta ruta.</p>`;
          } else {
            ridersListContainer.innerHTML = currentActive.map(r => `
              <span style="background: var(--bg-elevated); border: 1px solid var(--glass-border); padding: 0.4rem 0.8rem; border-radius: var(--radius-full); font-size: 0.85rem; color: var(--text-main); display: inline-flex; align-items: center; gap: 0.4rem;">
                🏍️ ${r.name}
              </span>
            `).join('');
          }
        }

        const countBadge = document.getElementById('ridersCountBadge');
        if (countBadge) {
          const updatedRoute = store.getRouteById(route.id);
          const currentActive = (updatedRoute?.riders || []).filter(r => r.status !== 'unsubscribed');
          countBadge.textContent = currentActive.length;
        }

        if (onSignupSuccess) onSignupSuccess();
      } catch (err) {
        Toast.show(err.message, 'error');
      }
    });
  }
};
