// ============================================================
// Script de Prueba: Monitor de Lecturas
// Ejecutar en DevTools Console para probar manualmente
// ============================================================

// 1. Verificar que window.__sgjaMetrics existe
console.log('📊 Estado actual del monitor:');
console.log('window.__sgjaMetrics:', window.__sgjaMetrics);

// 2. Simular un cache hit
console.log('✅ Cache HIT: test-key');

// 3. Simular un firestore read
console.log('🔥 Firestore READ: test-read');

// 4. Ver stats en tiempo real
setInterval(() => {
  console.log('STATS:', {
    cacheHits: window.__sgjaMetrics?.cacheHits || 0,
    firestoreReads: window.__sgjaMetrics?.firestoreReads || 0,
  });
}, 2000);

// 5. Ver cache storage
(async () => {
  const { cacheService } = await import('./src/services/cacheService');
  const stats = await cacheService.getStats();
  console.log('Cache Stats:', stats);
})();
