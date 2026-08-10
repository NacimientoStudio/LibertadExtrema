/* ==========================================================================
   LIBERTAD EXTREMA - ROUTE SERVICE
   ========================================================================== */

import { store, generateGoogleMapsDirUrl } from './store.js';

export const routeService = {
  getRoutes(filter = 'todas') {
    return store.getRoutes(filter);
  },

  getRouteById(id) {
    return store.getRouteById(id);
  },

  createRoute(formData) {
    if (!formData.title || !formData.date || !formData.startPoint || !formData.endPoint) {
      throw new Error('Por favor, rellena todos los campos obligatorios de la ruta.');
    }

    const dateObj = new Date(formData.date);
    const dateFormatted = dateObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const days = parseInt(formData.days) || 1;

    // Automatic Google Maps Directions URL from Start to End
    const mapUrl = formData.mapUrl || generateGoogleMapsDirUrl(formData.startPoint, formData.endPoint);

    // Build sub-routes if provided or auto-generate single stage
    let subRoutes = [];
    if (formData.subRoutesJson) {
      try {
        subRoutes = JSON.parse(formData.subRoutesJson);
      } catch (e) {
        console.warn('Error parsing subRoutes json:', e);
      }
    }

    if (subRoutes.length === 0 && days === 1) {
      subRoutes.push({
        day: 1,
        title: `Etapa Única: ${formData.startPoint} ➔ ${formData.endPoint}`,
        startPoint: formData.startPoint,
        endPoint: formData.endPoint,
        distance: formData.distance ? `${formData.distance} km` : 'Por determinar',
        mapUrl: mapUrl
      });
    }

    return store.addRoute({
      title: formData.title,
      status: formData.status || 'prevista',
      days: days,
      cancellationReason: formData.cancellationReason || '',
      date: formData.date,
      dateFormatted: dateFormatted,
      startPoint: formData.startPoint,
      endPoint: formData.endPoint,
      distance: formData.distance ? `${formData.distance} km` : 'Por determinar',
      difficulty: formData.difficulty || 'Media',
      description: formData.description,
      image: formData.image || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=80',
      mapUrl: mapUrl,
      subRoutes: subRoutes
    });
  },

  updateRouteStatus(id, newStatus, cancellationReason = '') {
    const route = store.getRouteById(id);
    if (!route) throw new Error('Ruta no encontrada');

    store.updateRoute(id, {
      status: newStatus,
      cancellationReason: newStatus === 'cancelada' ? cancellationReason : ''
    });
  },

  deleteRoute(id) {
    store.deleteRoute(id);
  },

  registerRider(routeId, name, phone) {
    if (!name || name.trim().length < 2) {
      throw new Error('Introduce tu nombre completo.');
    }

    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
    const esPhoneRegex = /^(\+34|0034)?[67]\d{8}$/;
    
    if (!esPhoneRegex.test(cleanedPhone)) {
      throw new Error('Introduce un número de teléfono móvil válido en España (9 dígitos comenzando por 6 o 7).');
    }

    const normalizedDigits = cleanedPhone.replace(/^(\+34|0034)/, '');
    const formattedPhone = `+34 ${normalizedDigits.slice(0, 3)} ${normalizedDigits.slice(3, 6)} ${normalizedDigits.slice(6)}`;

    return store.registerRider(routeId, {
      name: name.trim(),
      phone: formattedPhone
    });
  },

  unregisterRider(routeId, phone) {
    if (!phone) {
      throw new Error('Por favor, indica tu número de teléfono móvil para procesar tu baja.');
    }

    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
    const esPhoneRegex = /^(\+34|0034)?[67]\d{8}$/;
    
    if (!esPhoneRegex.test(cleanedPhone)) {
      throw new Error('Introduce un número de teléfono móvil válido en España (9 dígitos comenzando por 6 o 7).');
    }

    const normalizedDigits = cleanedPhone.replace(/^(\+34|0034)/, '');
    const formattedPhone = `+34 ${normalizedDigits.slice(0, 3)} ${normalizedDigits.slice(3, 6)} ${normalizedDigits.slice(6)}`;

    return store.unregisterRider(routeId, formattedPhone);
  }
};
