import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Rol } from '../types';
import { useTheme } from '../hooks/useTheme';

import DatosPersonalesModal from './DatosPersonalesModal';
import MobileBottomNav from './MobileBottomNav';

interface Props {
  children: React.ReactNode;
  rol: Rol;
  nombre: string;
  email: string;
  usuarioId?: string;
  idEstablecimiento?: string | null;
  permisos: string[];
}

export function MobileLayout({
  children,
  rol,
  nombre,
  email,
  usuarioId,
  permisos,
}: Props) {
  const location = useLocation();
  const esMobileRoute = location.pathname.startsWith('/tecnico/m/') || location.pathname === '/ticket';
  const { temaOscuro } = useTheme();
  const [modalDatosAbierto, setModalDatosAbierto] = useState(false);

  const styles = {
    contenedor: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
      backgroundColor: temaOscuro ? '#111827' : '#f8f9fb',
    },
    main: {
      flex: 1,
      overflowY: 'auto' as const,
      paddingBottom: '72px',
    },
  };

  return (
    <div style={{ ...styles.contenedor, ...(esMobileRoute ? { minHeight: 'auto' } : {}) }} data-rol={rol}>

      {/* BODY - Contenido principal */}
      <main style={{ ...styles.main, paddingBottom: 'var(--skin-nav-height, 56px)' }}>
        {children}
      </main>

      {/* BOTTOM NAV */}
      <div>
        <MobileBottomNav rol={rol} permisos={permisos} />
      </div>

      <DatosPersonalesModal
        abierto={modalDatosAbierto}
        onCerrar={() => setModalDatosAbierto(false)}
        usuarioId={usuarioId || ''}
        nombre={nombre}
        rol={rol}
        email={email}
      />
    </div>
  );
}
