// ============================================================
// SGJA – Indicador de Conexión
// src/components/IndicadorConexion.tsx
// Muestra círculo verde/negro según conexión a internet
// ============================================================

import { useState } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function IndicadorConexion() {
  const isOnline = useOnlineStatus();
  const [mostrarTooltip, setMostrarTooltip] = useState(false);

  return (
    <button
      type="button"
      style={{
        position: 'relative',
        display: 'inline-block',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
      }}
      onMouseEnter={() => setMostrarTooltip(true)}
      onMouseLeave={() => setMostrarTooltip(false)}
      onClick={() => setMostrarTooltip(!mostrarTooltip)}
    >
      {/* Círculo de conexión */}
      <div
        style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: isOnline ? '#4CAF50' : '#212121',
          boxShadow: isOnline
            ? '0 0 8px rgba(76, 175, 80, 0.6)'
            : '0 0 4px rgba(33, 33, 33, 0.4)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
      />

      {/* Tooltip */}
      {mostrarTooltip && (
        <div
          style={{
            position: 'absolute',
            top: '25px',
            right: '-30px',
            backgroundColor: isOnline ? '#4CAF50' : '#212121',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          }}
        >
          {isOnline ? 'En línea' : 'Sin conexión'}
        </div>
      )}
    </button>
  );
}
