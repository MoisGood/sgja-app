import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { registrarCierre } from '../services/online';
import { UsuariosOnlineIndicador } from './UsuariosOnlineIndicador';
import { Rol } from '../types';
import { useTheme } from '../hooks/useTheme';
import { Moon, Sun, LogOut } from 'lucide-react';
import DatosPersonalesModal from './DatosPersonalesModal';

interface Props {
  children: React.ReactNode;
  rol: Rol;
  nombre: string;
  email: string;
  usuarioId?: string;
  idEstablecimiento?: string | null;
  permisos: string[];
}

interface MenuButton {
  icono: string;
  label: string;
  id: string;
  ruta: string;
  roles: Rol[];
}

const FOOTER_BUTTONS: MenuButton[] = [
  { icono: '🏠', label: 'Inicio', id: 'dashboard', ruta: '/dashboard', roles: [Rol.ADMIN, Rol.INSPECTOR, Rol.PROFESOR, Rol.ESTUDIANTE, Rol.APODERADO] },
  { icono: '📚', label: 'Catálogo', id: 'catalogo', ruta: '/catalogo', roles: [Rol.ADMIN, Rol.ESTUDIANTE] },
  { icono: '📋', label: 'Registrar', id: 'registrar', ruta: '/registrar', roles: [Rol.ADMIN, Rol.INSPECTOR] },
  { icono: '📱', label: 'QR', id: 'qr', ruta: '/qr', roles: [Rol.INSPECTOR] },
  { icono: '⚙️', label: 'Config', id: 'config', ruta: '/configuracion', roles: [Rol.ADMIN] },
];

const ROL_LABEL: Record<Rol, string> = {
  [Rol.ADMIN]: 'Administrador',
  [Rol.INSPECTOR]: 'Inspector',
  [Rol.PROFESOR]: 'Profesor',
  [Rol.ESTUDIANTE]: 'Estudiante',
  [Rol.APODERADO]: 'Apoderado',
};

export function MobileLayout({
  children,
  rol,
  nombre,
  email,
  usuarioId,
  idEstablecimiento,
  permisos,
}: Props) {
  const navigate = useNavigate();
  const [modalDatosAbierto, setModalDatosAbierto] = useState(false);
  const { temaOscuro, setTemaOscuro } = useTheme();
  const botonesVisibles = FOOTER_BUTTONS.filter(btn => {
    if (!btn.roles.includes(rol)) return false;
    if (permisos.length > 0 && !permisos.includes(btn.ruta)) return false;
    return true;
  });

  const handleLogout = async () => {
    try {
      console.log(`🔴 Cerrando sesión para usuario: ${usuarioId}`);
      if (email && email.length > 0) {
        console.log(`📝 Registrando cierre en colección online...`);
        await registrarCierre(email);
        // Pequeño delay para asegurar que Supabase procesa la actualización
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`✅ Cierre registrado, cerrando sesión en Supabase...`);
      }
      await supabase.auth.signOut();
      console.log(`✅ Sesión cerrada exitosamente`);
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
      // Intentar cerrar sesión de todas formas
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error('❌ Error al cerrar sesión en Supabase:', signOutError);
      }
    }
  };

  const styles = {
    contenedor: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
      backgroundColor: '#f9fafb',
    },
    header: {
      background: `linear-gradient(to right, var(--role-primary) 0%, var(--role-primary-dark) 100%)`,
      color: 'white',
      padding: '0.75rem 1rem',
      position: 'sticky' as const,
      top: 0,
      zIndex: 40,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
    headerContenido: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '0.75rem',
    },
    headerInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      flex: 1,
    },
    avatar: {
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      flexShrink: 0,
    },
    nombreInfo: {
      flex: 1,
      minWidth: 0,
    },
    nombre: {
      fontSize: '0.9rem',
      fontWeight: 700,
      lineHeight: 1.2,
      margin: 0,
    },
    rol: {
      fontSize: '0.75rem',
      opacity: 0.9,
      margin: 0,
    },
    main: {
      flex: 1,
      overflowY: 'auto' as const,
    },
    footer: {
      background: 'white',
      borderTop: '2px solid #bfdbfe',
      boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.08)',
    },
    botonesGrid: {
      display: 'grid',
      gap: '0.5rem',
      padding: '1rem',
      gridTemplateColumns: `repeat(${botonesVisibles.length}, 1fr)`,
    },
    boton: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0.75rem 0.5rem',
      borderRadius: '8px',
      border: 'none',
      background: 'white',
      color: '#6b7280',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontSize: '0.75rem',
      textAlign: 'center' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    iconoBoton: {
      fontSize: '1.75rem',
      lineHeight: 1,
      marginBottom: '0.4rem',
      display: 'block',
    },
    labelBoton: {
      fontSize: '0.65rem',
      wordBreak: 'break-word' as const,
    },
  };

  return (
    <div style={styles.contenedor} data-rol={rol}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.headerContenido}>
          <button type="button" style={{ ...styles.headerInfo, background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit', color: 'inherit' }} onClick={() => usuarioId && setModalDatosAbierto(true)}>
            <div style={styles.avatar}>👤</div>
            <div style={styles.nombreInfo}>
              <p style={styles.nombre}>{nombre}</p>
              <p style={styles.rol}>{ROL_LABEL[rol]}</p>
            </div>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <UsuariosOnlineIndicador />
            <button type="button" 
              onClick={() => setTemaOscuro(!temaOscuro)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                transition: 'all 0.2s ease',
                color: 'white',
                fontSize: '20px',
              }}
              title={temaOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {temaOscuro ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button type="button"
              onClick={handleLogout}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                transition: 'all 0.2s ease',
                color: 'white',
              }}
              title="Cerrar sesión"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* BODY - Contenido principal */}
      <main style={styles.main}>
        {children}
      </main>

      {/* FOOTER - Navegación */}
      <footer style={styles.footer}>
        {/* Grid de botones */}
        <div style={styles.botonesGrid}>
          {botonesVisibles.map((btn) => (
            <button type="button" 
              key={btn.id}
              onClick={() => navigate(btn.ruta)}
              style={{
                ...styles.boton,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#eff6ff';
                e.currentTarget.style.color = 'var(--role-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#6b7280';
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.backgroundColor = '#dbeafe';
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              <span style={styles.iconoBoton}>{btn.icono}</span>
              <span style={styles.labelBoton}>{btn.label}</span>
            </button>
          ))}
        </div>

        {/* Botón Logout removido — está en el header */}
      </footer>

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
