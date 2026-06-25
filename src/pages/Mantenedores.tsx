import { useState } from 'react';
import { Clock, ClipboardList, Users, UserCheck, Building2, LifeBuoy } from 'lucide-react';
import BloqueHorario from './BloqueHorario';
import MantenedorMotivos from './MantenedorMotivos';
import MantenedorEstudiantes from './MantenedorEstudiantes';
import MantenedorRolesPage from './MantenedorRolesPage';
import MantenedorEstablecimiento from './MantenedorEstablecimiento';
import AdminAyudaMantenedor from '../components/AdminAyudaMantenedor';

interface Props { idEstablecimiento: string }

interface TabDef { key: string; icono: React.ReactNode; tooltip: string; lazy: boolean }

const TABS: TabDef[] = [
  { key: 'horarios',    icono: <Clock size={20} />,         tooltip: 'Mantenedor de Horarios',        lazy: true },
  { key: 'justifs',     icono: <ClipboardList size={20} />, tooltip: 'Mantenedor de Justificaciones',  lazy: true },
  { key: 'estudiantes', icono: <Users size={20} />,         tooltip: 'Mantenedor de Estudiantes',      lazy: true },
  { key: 'roles',       icono: <UserCheck size={20} />,     tooltip: 'Mantenedor de Roles',           lazy: false },
  { key: 'establec',    icono: <Building2 size={20} />,     tooltip: 'Mantenedor Establecimiento',     lazy: false },
  { key: 'ayuda',       icono: <LifeBuoy size={20} />,      tooltip: 'Módulo de Ayuda (FAQ, Tutoriales, Errores)', lazy: false },
];

function LazyTable({ children, label }: { children: React.ReactNode; label: string }) {
  const [visible, setVisible] = useState(false);
  if (!visible) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <button onClick={() => setVisible(true)} style={{
          padding: '12px 32px', borderRadius: 10, border: 'none',
          background: '#2563eb', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
        }}>
          📊 Ver Tabla de {label}
        </button>
      </div>
    );
  }
  return <>{children}</>;
}

export default function Mantenedores({ idEstablecimiento }: Props) {
  const [tab, setTab] = useState(TABS[0].key);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1A3C6B', margin: '0 0 20px' }}>📂 Mantenedores</h1>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '2px solid #e5e7eb', paddingBottom: 8 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} title={t.tooltip}
            style={{
              padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', lineHeight: 1,
              background: tab === t.key ? '#e0e7ff' : 'transparent',
              borderBottom: tab === t.key ? '3px solid #3b82f6' : '3px solid transparent',
              color: tab === t.key ? '#3b82f6' : '#64748b',
            }}
          >
            {t.icono}
          </button>
        ))}
      </div>

      {tab === 'horarios' && (
        <LazyTable label="Horarios"><BloqueHorario idEstablecimiento={idEstablecimiento} /></LazyTable>
      )}
      {tab === 'justifs' && (
        <LazyTable label="Justificaciones"><MantenedorMotivos idEstablecimiento={idEstablecimiento} /></LazyTable>
      )}
      {tab === 'estudiantes' && (
        <LazyTable label="Estudiantes"><MantenedorEstudiantes idEstablecimiento={idEstablecimiento} /></LazyTable>
      )}
      {tab === 'roles' && <MantenedorRolesPage idEstablecimiento={idEstablecimiento} />}
      {tab === 'establec' && <MantenedorEstablecimiento idEstablecimiento={idEstablecimiento} />}
      {tab === 'ayuda' && <AdminAyudaMantenedor />}
    </div>
  );
}
