/* ==========================================================================
   LIBERTAD EXTREMA - EVENT & NEWS SERVICE
   ========================================================================== */

import { store } from './store.js';

export const eventService = {
  getEvents() {
    return store.getEvents();
  },

  createEvent(formData) {
    if (!formData.title || !formData.category || !formData.date || !formData.location) {
      throw new Error('Por favor, rellena los campos obligatorios del evento.');
    }

    return store.addEvent({
      title: formData.title,
      category: formData.category,
      date: formData.date,
      location: formData.location,
      description: formData.description || '',
      image: formData.image || 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
      link: formData.link || ''
    });
  },

  deleteEvent(id) {
    store.deleteEvent(id);
  }
};
