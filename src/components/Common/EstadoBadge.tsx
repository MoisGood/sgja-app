// ============================================================
// AGIL – EstadoBadge Componente Compartido
// src/components/Common/EstadoBadge.tsx
// ============================================================

import { EstadoSolicitud } from '../../types';

interface Props {
  estado: EstadoSolicitud;
}

export default function EstadoBadge({ estado }: Props) {
  const colores: Record<string, { bg: string; color: string; label: string }> = {
    [EstadoSolicitud.INASISTENTE]:                { bg: '#FEF3C7', color: '#92400E', label: 'Sin procesar' },
    [EstadoSolicitud.ATRASO_JUSTIFICADO]:         { bg: '#D1FAE5', color: '#065F46', label: 'Atraso justificado' },
    [EstadoSolicitud.ATRASO_INJUSTIFICADO]:       { bg: '#FEE2E2', color: '#991B1B', label: 'Atraso injustificado' },
    [EstadoSolicitud.INASISTENCIA_JUSTIFICADA]:   { bg: '#D1FAE5', color: '#065F46', label: 'Inasistencia justificada' },
    [EstadoSolicitud.INASISTENCIA_NO_JUSTIFICADA]: { bg: '#FEE2E2', color: '#991B1B', label: 'Inasistencia no justificada' },
    [EstadoSolicitud.NO_PRESENTADA]:              { bg: '#F3F4F6', color: '#374151', label: 'No presentada' },
  };

  const estilo = colores[estado] || { bg: '#F3F4F6', color: '#374151', label: estado };

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
      {estilo.label}
    </span>
  );
}
