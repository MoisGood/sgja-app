import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Rol } from '../types';
import GestionPases from './GestionPases';
import RegistrarJustificacion from './RegistrarJustificacion';

interface Props {
  idEstablecimiento: string;
}

const TABS_CONFIG = [
  { id: 'pases', label: 'Crear Pase', roles: [Rol.ADMIN, Rol.INSPECTOR, Rol.PROFESOR] },
  { id: 'registrar', label: 'Gestion de Pases', roles: [Rol.ADMIN, Rol.INSPECTOR, Rol.PARADOCENTE] },
];

export default function JustificacionesTabs({ idEstablecimiento }: Props) {
  const { rol, uid } = useAuth();
  const tabsDisponibles = TABS_CONFIG.filter(t => t.roles.includes(rol!));
  const [tabActiva, setTabActiva] = useState(tabsDisponibles[0]?.id || 'pases');

  if (tabsDisponibles.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 14 }}>
        No tiene permisos para ver esta seccion.
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1A3C6B', marginBottom: 20 }}>
        Justificaciones
      </h1>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #E5E7EB' }}>
        {tabsDisponibles.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTabActiva(t.id)}
            style={{
              padding: '10px 24px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: tabActiva === t.id ? 700 : 500,
              color: tabActiva === t.id ? '#1A3C6B' : '#6B7280',
              borderBottom: tabActiva === t.id ? '3px solid #1A3C6B' : '3px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tabActiva === 'pases' && (
        <GestionPases idEstablecimiento={idEstablecimiento} rol={rol!} idUsuarioActual={uid || ''} />
      )}
      {tabActiva === 'registrar' && (
        <RegistrarJustificacion idEstablecimiento={idEstablecimiento} idUsuario={uid || ''} />
      )}
    </div>
  );
}
