/* ==========================================================================
   LIBERTAD EXTREMA - REST API & SQLITE STORE CONNECTOR
   ========================================================================== */

export function generateGoogleMapsDirUrl(start, end) {
  if (!start || !end) return '';
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(start)}&destination=${encodeURIComponent(end)}&travelmode=driving`;
}

class Store {
  constructor() {
    this.listeners = [];
    this.token = localStorage.getItem('libertad_extrema_token') || null;
    this.data = {
      isAdmin: !!this.token,
      routes: [],
      events: []
    };
    this.fetchData();
  }

  getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async fetchData() {
    try {
      const [routesRes, eventsRes] = await Promise.all([
        fetch('/api/routes'),
        fetch('/api/events')
      ]);

      if (routesRes.ok) {
        this.data.routes = await routesRes.json();
      }
      if (eventsRes.ok) {
        this.data.events = await eventsRes.json();
      }

      this.notify();
    } catch (e) {
      console.warn('Error conectando con la API SQLite backend:', e);
    }
  }

  saveState() {
    // Notify local subscribers
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn(this.data));
  }

  // Getters (Síncronos para renderizado ultra rápido)
  getState() {
    return this.data;
  }

  getRoutes(statusFilter = 'todas') {
    if (statusFilter === 'todas') return this.data.routes;
    return this.data.routes.filter(r => r.status === statusFilter);
  }

  getRouteById(id) {
    return this.data.routes.find(r => r.id === id);
  }

  getEvents() {
    return this.data.events;
  }

  isAdmin() {
    return !!this.data.isAdmin;
  }

  // Admin Auth
  async loginAdmin(username, password) {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Error al iniciar sesión');
    }

    this.token = data.token;
    localStorage.setItem('libertad_extrema_token', data.token);
    this.data.isAdmin = true;
    await this.fetchData();
    return true;
  }

  async setAdminMode(status) {
    if (!status) {
      if (this.token) {
        fetch('/api/admin/logout', {
          method: 'POST',
          headers: this.getAuthHeaders()
        }).catch(() => {});
      }
      this.token = null;
      localStorage.removeItem('libertad_extrema_token');
      this.data.isAdmin = false;
      this.notify();
    }
  }

  // Route Mutations
  async addRoute(routeData) {
    const res = await fetch('/api/routes', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(routeData)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al crear la ruta');

    await this.fetchData();
    return data;
  }

  async updateRouteStatus(id, newStatus, cancellationReason = '') {
    const res = await fetch(`/api/routes/${id}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status: newStatus, cancellationReason })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al actualizar el estado');

    await this.fetchData();
    return data;
  }

  async updateRoute(id, updatedData) {
    if (updatedData.status) {
      return this.updateRouteStatus(id, updatedData.status, updatedData.cancellationReason || '');
    }
  }

  async deleteRoute(id) {
    const res = await fetch(`/api/routes/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al eliminar la ruta');

    await this.fetchData();
    return data;
  }

  // Rider Signup & Unsubscribe
  async registerRider(routeId, riderData) {
    const res = await fetch(`/api/routes/${routeId}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(riderData)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error en la inscripción');

    await this.fetchData();
    return data;
  }

  async unregisterRider(routeId, phone) {
    const res = await fetch(`/api/routes/${routeId}/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al procesar la baja');

    await this.fetchData();
    return data;
  }

  // Route Media Mutations
  async addPhotoToRoute(routeId, url, caption) {
    const res = await fetch(`/api/routes/${routeId}/media`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ mediaType: 'photo', url, caption })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al añadir foto');

    await this.fetchData();
    return data;
  }

  async addVideoToRoute(routeId, url, title) {
    const res = await fetch(`/api/routes/${routeId}/media`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ mediaType: 'video', url, caption: title })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al vincular vídeo');

    await this.fetchData();
    return data;
  }

  async removeMedia(routeId, type, indexOrId) {
    // Look up media ID from cached route
    const route = this.getRouteById(routeId);
    if (!route || !route.media) return;

    const list = type === 'photo' ? route.media.photos : route.media.videos;
    const mediaItem = typeof indexOrId === 'number' ? list[indexOrId] : list.find(m => m.id === indexOrId);

    if (!mediaItem) return;

    const res = await fetch(`/api/routes/${routeId}/media/${mediaItem.id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al eliminar contenido multimedia');

    await this.fetchData();
    return data;
  }

  // Event Mutations
  async addEvent(eventData) {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(eventData)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al crear evento');

    await this.fetchData();
    return data;
  }

  async deleteEvent(id) {
    const res = await fetch(`/api/events/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al eliminar el evento');

    await this.fetchData();
    return data;
  }

  async resetToSeed() {
    await this.fetchData();
  }
}

export const store = new Store();
