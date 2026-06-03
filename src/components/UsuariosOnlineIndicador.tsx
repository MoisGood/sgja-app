// ============================================================
// SGJA – Indicador de Usuarios En Línea
// src/components/UsuariosOnlineIndicador.tsx
// ============================================================

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';

interface IndicadorState {
  conectados: number;
  desconectados: number;
}

export function UsuariosOnlineIndicador() {
  const { temaOscuro } = useTheme();
  const [estado, setEstado] = useState<IndicadorState>({
    conectados: 0,
    desconectados: 0,
  });

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const { data, error } = await supabase
          .from('online')
          .select('estado');

        if (error) throw error;

        let conectados = 0;
        let desconectados = 0;

        (data || []).forEach((doc) => {
          if (doc.estado === 'conectado') {
            conectados++;
          } else if (doc.estado === 'desconectado') {
            desconectados++;
          }
        });

        setEstado({
          conectados,
          desconectados,
        });
      } catch (error) {
        console.error('Error obteniendo usuarios online:', error);
      }
    };

    // Cargar datos inicialmente
    fetchUsuarios();
    
    // Polling cada 30 segundos
    const interval = setInterval(fetchUsuarios, 30000);

    return () => clearInterval(interval);
  }, []);

  const colorTexto = temaOscuro ? '#d1d5db' : '#6b7280';

  return (
    <div style={styles.contenedor}>
      {/* Punto verde - Conectados */}
      <div style={styles.indicador} title="Usuarios conectados">
        <span style={{ ...styles.punto, backgroundColor: '#10b981' }} />
        <span style={{ ...styles.numero, color: colorTexto }}>{estado.conectados}</span>
      </div>

      {/* Punto gris - Desconectados */}
      <div style={styles.indicador} title="Usuarios desconectados">
        <span style={{ ...styles.punto, backgroundColor: '#9ca3af' }} />
        <span style={{ ...styles.numero, color: colorTexto }}>{estado.desconectados}</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  contenedor: {
    display: 'flex',
    gap: '16px',
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
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    display: 'inline-block',
    filter: 'drop-shadow(0 0 3px rgba(0, 0, 0, 0.3))',
  },
  numero: {
    fontSize: '14px',
    fontWeight: '600',
    minWidth: '20px',
  },
};

