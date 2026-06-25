// ============================================================
// SGJA – Indicador de Conectividad
// Consulta Cloudflare Worker para verificar estado del servidor
// ============================================================

import { useState, useEffect } from 'react';
const WORKER_URL = 'https://icy-limit-9f6c.soportetipresente.workers.dev/';

export function UsuariosOnlineIndicador() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let activo = true;

    const check = async () => {
      try {
        const res = await fetch(WORKER_URL, { method: 'GET', cache: 'no-store' });
        if (!activo) return;
        setOnline(res.ok);
      } catch {
        if (activo) setOnline(false);
      }
    };

    check();
    const interval = setInterval(() => { if (activo) check(); }, 30000);

    return () => { activo = false; clearInterval(interval); };
  }, []);

  return (
    <div style={styles.contenedor}>
      <div style={styles.indicador} title={online ? 'Servidor en línea' : 'Servidor desconectado'}>
        <span style={{
          ...styles.punto,
          backgroundColor: online ? '#10b981' : '#ef4444',
          boxShadow: online ? '0 0 6px rgba(16, 185, 129, 0.6)' : 'none',
        }} />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  contenedor: {
    display: 'flex',
    alignItems: 'center',
  },
  indicador: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  punto: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block',
  },
};

