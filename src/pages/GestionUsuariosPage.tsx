import { useState } from 'react';
import GestionUsuarios from './GestionUsuarios';
import SolicitudesRegistro from './SolicitudesRegistro';
import GestionExternos from '../components/GestionExternos';

interface Props { idEstablecimiento: string }

export default function GestionUsuariosPage({ idEstablecimiento }: Props) {
  const [tab, setTab] = useState<'usuarios' | 'solicitudes' | 'externos'>('usuarios');

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1A3C6B', margin: '0 0 20px' }}>👥 Gestión de Usuarios</h1>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '2px solid #e5e7eb', paddingBottom: 8 }}>
        {([{ key: 'usuarios' as const, icono: '👥', label: 'Usuarios' }, { key: 'solicitudes' as const, icono: '📝', label: 'Solicitudes' }, { key: 'externos' as const, icono: '🌐', label: 'Externos' }]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} title={t.label}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', fontSize: 20, cursor: 'pointer',
              background: tab === t.key ? '#e0e7ff' : 'transparent',
              borderBottom: tab === t.key ? '3px solid #3b82f6' : '3px solid transparent',
            }}
          >
            {t.icono}
          </button>
        ))}
      </div>

      {tab === 'usuarios' && <GestionUsuarios idEstablecimiento={idEstablecimiento} />}
      {tab === 'solicitudes' && <SolicitudesRegistro idEstablecimiento={idEstablecimiento} />}
      {tab === 'externos' && <GestionExternos idEstablecimiento={idEstablecimiento} />}
    </div>
  );
}
