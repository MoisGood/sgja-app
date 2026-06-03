import { useState } from 'react';
import ConfigRoles from './ConfigRoles';
import Festivos from './Festivos';
import Justificaciones from './Justificaciones';

interface Props { idEstablecimiento: string }

const TABS = [
  { id: 'roles', label: 'Roles' },
  { id: 'festivos', label: 'Festivos' },
  { id: 'justificar', label: 'Justificar' },
];

export default function ConfigBiblioteca({ idEstablecimiento }: Props) {
  const [tab, setTab] = useState('roles');

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1A3C6B', marginBottom: '24px' }}>Configuración Biblioteca</h1>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '2px solid #E5E7EB' }}>
        {TABS.map(t => (
          <button type="button"             key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 24px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? '#1A3C6B' : '#6B7280',
              borderBottom: tab === t.id ? '3px solid #1A3C6B' : '3px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'roles' && <ConfigRoles idEstablecimiento={idEstablecimiento} />}
      {tab === 'festivos' && <Festivos idEstablecimiento={idEstablecimiento} />}
      {tab === 'justificar' && <Justificaciones idEstablecimiento={idEstablecimiento} />}
    </div>
  );
}
