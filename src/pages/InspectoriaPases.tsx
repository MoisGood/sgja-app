import { useState } from 'react';
import GestionPases from './GestionPases';
import RegistrarJustificacion from './RegistrarJustificacion';

interface Props {
  idEstablecimiento: string;
  rol: string;
  idUsuarioActual?: string;
}

type Pestana = 'crear' | 'ver' | 'justificar';

const ROLES_CREAR = ['ADMIN', 'INSPECTOR', 'PROFESOR'];
const ROLES_VER = ['ADMIN', 'INSPECTOR', 'PROFESOR', 'PARADOCENTE'];
const ROLES_JUSTIFICAR = ['ADMIN', 'INSPECTOR', 'PARADOCENTE'];

export default function InspectoriaPases({ idEstablecimiento, rol, idUsuarioActual }: Props) {
  const pestañas: { id: Pestana; label: string }[] = [
    ...(ROLES_CREAR.includes(rol) ? [{ id: 'crear' as Pestana, label: '➕ Crear Pase' }] : []),
    ...(ROLES_VER.includes(rol) ? [{ id: 'ver' as Pestana, label: '📋 Ver Pases' }] : []),
    ...(ROLES_JUSTIFICAR.includes(rol) ? [{ id: 'justificar' as Pestana, label: '⚖️ Justificar' }] : []),
  ];
  const [pestanaActiva, setPestanaActiva] = useState<Pestana>(pestañas[0]?.id ?? 'ver');

  if (pestañas.length === 0) return null;

  const activa = pestañas.some((p) => p.id === pestanaActiva) ? pestanaActiva : pestañas[0].id;

  return (
    <div>
      <div style={styles.tabs}>
        {pestañas.map((p) => (
          <button
            type="button"
            key={p.id}
            onClick={() => setPestanaActiva(p.id)}
            style={{ ...styles.tabBtn, ...(activa === p.id ? styles.tabBtnActivo : {}) }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {activa !== 'justificar' ? (
        <GestionPases
          idEstablecimiento={idEstablecimiento}
          rol={rol}
          idUsuarioActual={idUsuarioActual}
          tabExterno={activa}
        />
      ) : (
        <RegistrarJustificacion idEstablecimiento={idEstablecimiento} idUsuario={idUsuarioActual} />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '2px solid #e2e8f0',
    paddingBottom: '0',
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    padding: '12px 18px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    color: '#64748b',
    borderBottom: '3px solid transparent',
  },
  tabBtnActivo: {
    color: '#2563eb',
    borderBottom: '3px solid #2563eb',
  },
};
