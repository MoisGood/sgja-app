import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { registrarCierre } from '../services/online';
import { Rol } from '../types';
import { useTheme } from '../hooks/useTheme';
import InspectoriaMobileBottomNav from './InspectoriaMobileBottomNav';

interface Props {
  children: React.ReactNode;
  rol: Rol;
  nombre: string;
  email: string;
}

export default function InspectoriaMobileLayout({ children, rol, nombre, email }: Props) {
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: temaOscuro ? '#1f2937' : '#ffffff',
    borderBottom: temaOscuro ? '1px solid #374151' : '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
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

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <button
          style={avatarStyle}
          onClick={() => navigate('/inspectoria/m/perfil')}
          title="Perfil"
        >
          {iniciales}
        </button>
        <button
          onClick={() => setMenuAbierto(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: temaOscuro ? '#f3f4f6' : '#191c1e', padding: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title="Menú"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>menu</span>
        </button>
      </header>

      <main style={mainStyle}>
        {children}
      </main>

      <InspectoriaMobileBottomNav rol={rol} />

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
                  onClick={() => { setMenuAbierto(false); navigate('/inspectoria/m/inicio'); }}
                  style={drawerItemStyle(location.pathname === '/inspectoria/m/inicio', temaOscuro)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>home</span>
                  Inicio
                </button>
                <button
                  onClick={() => { setMenuAbierto(false); navigate('/inspectoria/m/perfil'); }}
                  style={drawerItemStyle(location.pathname === '/inspectoria/m/perfil', temaOscuro)}
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
