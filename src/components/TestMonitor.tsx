// ============================================================
// SGJA – Test Monitor de Lecturas
// src/components/TestMonitor.tsx
// Componente de prueba para generar lecturas automáticas
// ============================================================

import { useEffect } from 'react';
import { cacheService } from '../services/cacheService';

export function TestMonitor() {
  useEffect(() => {
    const generateTestReads = async () => {
      console.log('🧪 INICIANDO TEST DE MONITOREO');

      // Generar múltiples cache hits y misses
      for (let i = 0; i < 5; i++) {
        // Guardar en cache
        await cacheService.set(`test-key-${i}`, { data: `valor-${i}` }, 30);

        // Intentar recuperar (cache hit)
        const cached = await cacheService.get(`test-key-${i}`);
        if (cached) {
          console.log(`✅ Cache HIT: test-key-${i}`);
        }
      }

      // Simular supabase reads
      for (let i = 0; i < 3; i++) {
        console.log(`🔥 Supabase READ: solicitudes-${i}`);
      }

      // Ver estado del monitor
      const stats = await cacheService.getStats();
      console.log('📊 Stats del cache:', stats);

      // Mostrar el estado en window
      if (window.__sgjaMetrics) {
        console.log('📈 Métricas globales:', {
          cacheHits: window.__sgjaMetrics.cacheHits,
          supabaseReads: window.__sgjaMetrics.supabaseReads,
        });
      }
    };

    generateTestReads();
  }, []);

  return null;
}
