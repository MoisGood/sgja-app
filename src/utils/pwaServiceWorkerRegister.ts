/* ============================================================================
   PWA SERVICE WORKER REGISTRATION
   Registra el service worker para soporte offline y cacheo
   ============================================================================ */

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('⚠️ Service Worker no soportado en este navegador');
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js', { scope: '/' })
      .then((registration) => {
        console.log('✅ Service Worker registrado exitosamente:', registration);

        // Escuchar actualizaciones
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              console.log('🔄 Nueva versión del Service Worker disponible');
              // Notificar al usuario que hay una actualización
              if (window.confirm('Hay una nueva versión disponible. ¿Actualizar?')) {
                window.location.reload();
              }
            }
          });
        });

        // Escuchar cambios de conexión
        window.addEventListener('online', () => {
          console.log('🌐 Conectado a internet');
          document.body.classList.remove('offline');
        });

        window.addEventListener('offline', () => {
          console.log('📴 Desconectado de internet');
          document.body.classList.add('offline');
        });

        // Mostrar estado inicial
        if (!navigator.onLine) {
          document.body.classList.add('offline');
          console.log('📴 Iniciando en modo offline');
        }
      })
      .catch((error) => {
        console.error('❌ Error al registrar Service Worker:', error);
      });
  });
}

// Función para limpiar cache (útil para debugging)
export function clearServiceWorkerCache() {
  if ('serviceWorker' in navigator && 'controller' in navigator.serviceWorker) {
    navigator.serviceWorker.controller?.postMessage({
      type: 'CLEAR_CACHE',
    });
    console.log('🗑️ Cache limpiado');
  }
}

// Función para forzar actualización del Service Worker
export function updateServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then((registration) => {
      registration?.update();
      console.log('🔄 Verificando actualizaciones del Service Worker...');
    });
  }
}
