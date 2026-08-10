/* ==========================================================================
   LIBERTAD EXTREMA - MEDIA SERVICE (PHOTOS & VIDEOS FOR COMPLETED ROUTES)
   ========================================================================== */

import { store } from './store.js';

export const mediaService = {
  addPhotoToRoute(routeId, photoUrl, caption = '') {
    if (!photoUrl) throw new Error('Debes proporcionar una URL o subir una foto.');
    
    store.addMediaToRoute(routeId, 'photo', {
      url: photoUrl,
      caption: caption || 'Foto de la ruta'
    });
  },

  addVideoToRoute(routeId, videoUrl, title = '') {
    if (!videoUrl) throw new Error('Debes proporcionar la URL del vídeo.');

    // Convert standard YouTube URL to embed URL if needed
    let embedUrl = videoUrl;
    if (videoUrl.includes('youtube.com/watch?v=')) {
      const videoId = videoUrl.split('v=')[1]?.split('&')[0];
      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (videoUrl.includes('youtu.be/')) {
      const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }

    store.addMediaToRoute(routeId, 'video', {
      embedUrl: embedUrl,
      title: title || 'Vídeo de la ruta'
    });
  },

  removeMedia(routeId, type, index) {
    store.removeMediaFromRoute(routeId, type, index);
  }
};
