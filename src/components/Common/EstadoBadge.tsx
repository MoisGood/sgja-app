// ============================================================
// SGJA – EstadoBadge Componente Compartido
// src/components/Common/EstadoBadge.tsx
// ============================================================

import { EstadoSolicitud } from '../../types';

interface Props {
  estado: EstadoSolicitud;
}

export default function EstadoBadge({ estado }: Props) {
  const colores: Record<EstadoSolicitud, { bg: string; color: string }> = {
    Injustificada: { bg: '#FEE2E2', color: '#991B1B' },
    Justificada: { bg: '#D1FAE5', color: '#065F46' },
    Rechazada: { bg: '#FEE2E2', color: '#991B1B' },
    'No presentada': { bg: '#F3F4F6', color: '#374151' },
  };

  const estilo = colores[estado] || { bg: '#F3F4F6', color: '#374151' };

  return (
    <span
      style={{
        backgroundColor: estilo.bg,
        color: estilo.color,
        padding: '6px 16px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: '600',
      }}
    >
      {estado}
    </span>
  );
}
