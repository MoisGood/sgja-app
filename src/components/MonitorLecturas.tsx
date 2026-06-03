// ============================================================
// SGJA – Monitor de Lecturas
// src/components/MonitorLecturas.tsx
// Muestra en tiempo real: cache hits vs Supabase reads
// ============================================================

import { useEffect, useState } from 'react';
import { cacheService } from '../services/cacheService';

interface StatsLecturas {
  cacheHits: number;
  supabaseReads: number;
  eficiencia: number;
  totalCache: number;
  expiredCache: number;
  cacheSizeKB: number;
}

// Global tracker para contar lecturas
declare global {
  interface Window {
    __sgjaMetrics?: {
      cacheHits: number;
      supabaseReads: number;
    };
  }
}

// Inicializar tracker global
if (!window.__sgjaMetrics) {
  window.__sgjaMetrics = {
    cacheHits: 0,
    supabaseReads: 0,
  };
}

export function MonitorLecturas() {
  const [stats, setStats] = useState<StatsLecturas>({
    cacheHits: 0,
    supabaseReads: 0,
    eficiencia: 0,
    totalCache: 0,
    expiredCache: 0,
    cacheSizeKB: 0,
  });
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const originalLog = console.log;

    console.log = function (...args: unknown[]) {
      const msg = String(args[0] || '');

      if (msg.includes('✅ Cache HIT')) {
        if (window.__sgjaMetrics) {
          window.__sgjaMetrics.cacheHits++;
        }
      }
      if (msg.includes('🔥 Supabase READ')) {
        if (window.__sgjaMetrics) {
          window.__sgjaMetrics.supabaseReads++;
        }
      }

      originalLog.apply(console, args as Parameters<typeof console.log>);
    };

    const interval = setInterval(async () => {
      if (!window.__sgjaMetrics) return;

      const cacheStats = await cacheService.getStats();
      const hits = window.__sgjaMetrics.cacheHits;
      const misses = window.__sgjaMetrics.supabaseReads;
      const total = hits + misses || 1;

      setStats({
        cacheHits: hits,
        supabaseReads: misses,
        eficiencia: Math.round((hits / total) * 100),
        totalCache: cacheStats.totalKeys,
        expiredCache: cacheStats.expiredCount,
        cacheSizeKB: cacheStats.totalSizeKB,
      });
    }, 5000);

    return () => {
      clearInterval(interval);
      console.log = originalLog;
    };
  }, []);

  if (!visible) {
    return (
      <button type="button" 
        onClick={() => setVisible(true)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          background: '#1e40af',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          cursor: 'pointer',
          fontSize: '18px',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Mostrar monitor"
      >
        📊
      </button>
    );
  }

  const bgColor = stats.eficiencia > 80 ? '#065f46' : stats.eficiencia > 50 ? '#854d0e' : '#7f1d1d';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        background: bgColor,
        color: '#fff',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        minWidth: '200px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
        <span>📊 MONITOR LECTURAS</span>
        <button type="button" 
          onClick={() => setVisible(false)}
          style={{
            background: 'transparent',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.2)', paddingTop: '8px', paddingBottom: '8px' }}>
        <div>✅ Cache Hits: <strong>{stats.cacheHits}</strong></div>
        <div>🔥 Supabase Reads: <strong>{stats.supabaseReads}</strong></div>
        <div>⚡ Eficiencia: <strong>{stats.eficiencia}%</strong></div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.2)', paddingTop: '8px', fontSize: '10px', opacity: 0.8 }}>
        <div>💾 Cache Items: {stats.totalCache}</div>
        <div>⏰ Expired: {stats.expiredCache}</div>
        <div>📦 Size: {stats.cacheSizeKB}KB</div>
      </div>

      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.2)', fontSize: '9px' }}>
        <button type="button" 
          onClick={async () => {
            await cacheService.clear();
            alert('Cache limpiado ✅');
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '9px',
            width: '100%',
          }}
        >
          🗑️ Limpiar Cache
        </button>
      </div>
    </div>
  );
}
