import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { registrarCierre } from '../services/online';
import { Rol } from '../types';
import { useTheme } from '../hooks/useTheme';

interface Props {
  children: React.ReactNode;
  rol: Rol;
  nombre: string;
  email: string;
  areaPrefix: string;
  bottomNav: React.ReactNode;
  establecimientoNombre?: string;
  establecimientoLogo?: string;
}

const LABEL_ROL: Record<Rol, string> = {
  [Rol.ADMIN]: 'Administrador',
  [Rol.INSPECTOR]: 'Inspector',
  [Rol.PARADOCENTE]: 'Paradocente',
  [Rol.PROFESOR]: 'Profesor',
  [Rol.ESTUDIANTE]: 'Estudiante',
  [Rol.APODERADO]: 'Apoderado',
};

interface DrawerItem {
  etiqueta: string;
  icono: string;
  ruta: string;
  roles: Rol[];
}

const DRAWER_ITEMS: DrawerItem[] = [
  { etiqueta: 'Inicio', icono: 'home', ruta: 'inicio', roles: [Rol.ADMIN, Rol.INSPECTOR, Rol.PARADOCENTE, Rol.PROFESOR, Rol.ESTUDIANTE, Rol.APODERADO] },
  { etiqueta: 'Crear Pase', icono: 'add_circle', ruta: 'crear-pase', roles: [Rol.ADMIN] },
  { etiqueta: 'Pases', icono: 'add_circle', ruta: 'crear-pase', roles: [Rol.PROFESOR] },
  { etiqueta: 'Pases', icono: 'assignment', ruta: 'gestion-pases', roles: [Rol.INSPECTOR] },
  { etiqueta: 'Gestión', icono: 'assignment', ruta: 'gestion-pases', roles: [Rol.ADMIN, Rol.PARADOCENTE] },
  { etiqueta: 'Ver Pases', icono: 'visibility', ruta: 'ver-pases', roles: [Rol.INSPECTOR, Rol.PARADOCENTE] },
  { etiqueta: 'Formulario de Accidente', icono: 'emergency', ruta: '/registrar-accidente', roles: [Rol.ADMIN, Rol.INSPECTOR, Rol.PARADOCENTE, Rol.PROFESOR] },
  { etiqueta: 'Historial', icono: 'history', ruta: 'historial-pases', roles: [Rol.INSPECTOR, Rol.PROFESOR, Rol.ESTUDIANTE, Rol.APODERADO] },
  { etiqueta: 'Biblioteca', icono: 'book', ruta: 'biblioteca', roles: [Rol.ESTUDIANTE] },
  { etiqueta: 'Catálogo', icono: 'book', ruta: '/biblioteca/m/catalogo', roles: [Rol.PROFESOR] },
  { etiqueta: 'Perfil', icono: 'person', ruta: 'perfil', roles: [Rol.ADMIN, Rol.INSPECTOR, Rol.PARADOCENTE, Rol.PROFESOR, Rol.ESTUDIANTE, Rol.APODERADO] },
];

const titularEstablecimiento = (nombre?: string): string => {
  if (!nombre) return '';
  const partes = nombre.trim().split(/\s+/);
  if (partes.length >= 4 && partes[partes.length - 2].toLowerCase() === 'de') {
    return partes.slice(0, partes.length - 2).join(' ');
  }
  return nombre;
};

const nombreConSalto = (nombre?: string): React.ReactNode => {
  if (!nombre) return '';
  const idx = nombre.lastIndexOf(' de ');
  if (idx > 0) {
    return (
      <>
        {nombre.slice(0, idx)}
        <br />
        {nombre.slice(idx + 1)}
      </>
    );
  }
  return nombre;
};

export default function SharedMobileLayout({ children, rol, email, areaPrefix, bottomNav, establecimientoNombre, establecimientoLogo }: Props) {
  const { temaOscuro, setTemaOscuro } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const handleLogout = async () => {
    setMenuAbierto(false);
    try {
      if (email) await registrarCierre(email);
      await supabase.auth.signOut();
    } catch {
      await supabase.auth.signOut();
    }
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: temaOscuro ? '#111827' : '#f8f9fb',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    padding: '8px 16px',
    backgroundColor: temaOscuro ? '#1f2937' : '#ffffff',
    borderBottom: temaOscuro ? '1px solid #374151' : '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  };

  const filaSuperiorStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  };

  const grupoIzqStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '4px 10px',
    minWidth: 0,
  };

  const menuBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'none', border: 'none', cursor: 'pointer',
    color: temaOscuro ? '#f3f4f6' : '#191c1e', padding: 4,
  };

  const nombreStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 600,
    color: temaOscuro ? '#9ca3af' : '#554245',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 140,
  };

  const rolLabel = LABEL_ROL[rol] || rol;
  const titular = titularEstablecimiento(establecimientoNombre);

  const estabStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.3,
    color: temaOscuro ? '#f3f4f6' : '#191c1e',
    minWidth: 0,
  };

  const mainStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    paddingBottom: 80,
  };

  const navLink = (path: string) => `${areaPrefix}${path}`;

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div style={filaSuperiorStyle}>
          <div style={grupoIzqStyle}>
            <button
              onClick={() => setMenuAbierto(true)}
              style={menuBtnStyle}
              title="Menú"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>menu</span>
            </button>
            <span style={estabStyle}>{titular ? `Intranet ${titular}` : 'Intranet'}</span>
          </div>
          <span style={nombreStyle}>{rolLabel}</span>
        </div>
      </header>

      <main style={mainStyle}>
        {children}
      </main>

      {bottomNav}

      <AnimatePresence>
        {menuAbierto && (
          <>
            <motion.div
              style={{
                position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 998,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuAbierto(false)}
            />
            <motion.aside
              style={{
                position: 'fixed', top: 0, left: 0, bottom: 0, width: 280,
                backgroundColor: temaOscuro ? '#1f2937' : '#ffffff',
                zIndex: 999, display: 'flex', flexDirection: 'column',
                boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
              }}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              <div style={{
                position: 'relative',
                padding: '20px 16px 16px',
                borderBottom: temaOscuro ? '1px solid #374151' : '1px solid #e2e8f0',
                textAlign: 'center',
              }}>
                <button
                  onClick={() => setMenuAbierto(false)}
                  style={{
                    position: 'absolute', top: 12, right: 12,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: temaOscuro ? '#9ca3af' : '#554245', padding: 4,
                  }}
                  title="Cerrar"
                >
                  <X size={20} />
                </button>
                {establecimientoLogo && (
                  <img
                    src={establecimientoLogo}
                    alt="Logo del establecimiento"
                    style={{
                      display: 'block',
                      margin: '0 auto 10px',
                      maxWidth: 110,
                      maxHeight: 110,
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                    }}
                  />
                )}
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, lineHeight: 1.4, color: temaOscuro ? '#f3f4f6' : '#191c1e' }}>
                  {nombreConSalto(establecimientoNombre)}
                </h2>
              </div>

              <div style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: temaOscuro ? '#9ca3af' : '#887275', letterSpacing: '0.05em', padding: '8px 12px 4px', margin: 0 }}>
                  NAVEGACIÓN
                </p>
                {DRAWER_ITEMS.filter(item => item.roles.includes(rol)).map(item => (
                  <button
                    key={`${item.ruta}-${item.etiqueta}`}
                    onClick={() => { setMenuAbierto(false); navigate(item.ruta.startsWith('/') ? item.ruta : navLink(item.ruta)); }}
                    style={drawerItemStyle(location.pathname === (item.ruta.startsWith('/') ? item.ruta : navLink(item.ruta)), temaOscuro)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{item.icono}</span>
                    {item.etiqueta}
                  </button>
                ))}
              </div>

              <div style={{
                padding: '16px', borderTop: temaOscuro ? '1px solid #374151' : '1px solid #e2e8f0',
              }}>
                <button
                  onClick={() => setTemaOscuro(!temaOscuro)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                    border: 'none', background: 'transparent', borderRadius: 8,
                    cursor: 'pointer', fontSize: 14, color: temaOscuro ? '#f3f4f6' : '#191c1e',
                    width: '100%', textAlign: 'left',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    {temaOscuro ? 'light_mode' : 'dark_mode'}
                  </span>
                  {temaOscuro ? 'Modo claro' : 'Modo oscuro'}
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                    border: 'none', background: 'transparent', borderRadius: 8,
                    cursor: 'pointer', fontSize: 14, color: '#dc2626', width: '100%', textAlign: 'left',
                  }}
                >
                  <LogOut size={18} />
                  Cerrar sesión
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function drawerItemStyle(activo: boolean, oscuro: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
    border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14,
    fontWeight: activo ? 600 : 400,
    width: '100%', textAlign: 'left' as const,
    background: activo ? (oscuro ? '#2d3748' : '#f3f4f6') : 'transparent',
    color: activo ? (oscuro ? '#ffb1c2' : '#7a1f3d') : (oscuro ? '#f3f4f6' : '#191c1e'),
  };
}
