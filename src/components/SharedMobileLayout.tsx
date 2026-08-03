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
}

export default function SharedMobileLayout({ children, nombre, email, areaPrefix, bottomNav, establecimientoNombre }: Props) {
  const { temaOscuro, setTemaOscuro } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const iniciales = nombre
    ? nombre.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
    : '??';

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
  };

  const menuBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'none', border: 'none', cursor: 'pointer',
    color: temaOscuro ? '#f3f4f6' : '#191c1e', padding: 4,
  };

  const intranetStyle: React.CSSProperties = {
    fontSize: 16, fontWeight: 700,
  };

  const perfilBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'none', border: 'none', cursor: 'pointer', padding: 4,
    color: temaOscuro ? '#f3f4f6' : '#191c1e',
  };

  const perfilLabelStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 600,
  };

  const estabStyle: React.CSSProperties = {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 500,
    color: temaOscuro ? '#9ca3af' : '#554245',
    marginTop: 4,
  };

  const avatarStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: '50%',
    backgroundColor: '#7a1f3d',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
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
          <button
            onClick={() => setMenuAbierto(true)}
            style={menuBtnStyle}
            title="Menú"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>menu</span>
            <span style={intranetStyle}>Intranet</span>
          </button>
          <button
            onClick={() => navigate(navLink('perfil'))}
            style={perfilBtnStyle}
            title="Perfil"
          >
            <span style={perfilLabelStyle}>Perfil</span>
            <span style={avatarStyle}>{iniciales}</span>
          </button>
        </div>
        {establecimientoNombre && (
          <div style={estabStyle}>{establecimientoNombre}</div>
        )}
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
                position: 'fixed', top: 0, right: 0, bottom: 0, width: 280,
                backgroundColor: temaOscuro ? '#1f2937' : '#ffffff',
                zIndex: 999, display: 'flex', flexDirection: 'column',
                boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
              }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px', borderBottom: temaOscuro ? '1px solid #374151' : '1px solid #e2e8f0',
              }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: temaOscuro ? '#f3f4f6' : '#191c1e' }}>
                  Menú
                </h2>
                <button
                  onClick={() => setMenuAbierto(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: temaOscuro ? '#9ca3af' : '#554245', padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: temaOscuro ? '#9ca3af' : '#887275', letterSpacing: '0.05em', padding: '8px 12px 4px', margin: 0 }}>
                  NAVEGACIÓN
                </p>
                <button
                  onClick={() => { setMenuAbierto(false); navigate(navLink('inicio')); }}
                  style={drawerItemStyle(location.pathname === navLink('inicio'), temaOscuro)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>home</span>
                  Inicio
                </button>
                <button
                  onClick={() => { setMenuAbierto(false); navigate(navLink('perfil')); }}
                  style={drawerItemStyle(location.pathname === navLink('perfil'), temaOscuro)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person</span>
                  Perfil
                </button>
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
