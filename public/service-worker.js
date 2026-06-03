/* ============================================================================
   SERVICE WORKER - PWA (Progressive Web App)
   Versión simplificada para evitar problemas con Response.clone()
   ============================================================================ */

const CACHE_NAME = 'sgja-v1';

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalando...');
  self.skipWaiting();
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activado');
  self.clients.claim();
});

// Estrategia simple: Network First, sin caching de Firebase
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptar GET
  if (request.method !== 'GET') {
    return;
  }

  // Firebase y APIs externas: Network Only
  if (
    url.origin.includes('firebase') ||
    url.origin.includes('googleapis.com') ||
    url.origin.includes('firebaseapp.com')
  ) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response('No hay conexión', { status: 0 });
      })
    );
    return;
  }

  // Para todo lo demás: Network First
  event.respondWith(
    fetch(request)
      .then((response) => response)
      .catch(() => {
        return caches.match(request);
      })
  );
});

console.log('🚀 Service Worker cargado - SGJA v1');

