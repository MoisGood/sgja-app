import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { Rol } from '../types';

interface NavItem {
  label: string;
  icono: string;
  ruta: string;
  roles: Rol[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', icono: 'home', ruta: '/secretaria/m/inicio', roles: [Rol.ADMIN, Rol.PARADOCENTE] },
  { label: 'Ausentes', icono: 'event_busy', ruta: '/secretaria/m/ausentes', roles: [Rol.ADMIN] },
  { label: 'Redactar', icono: 'mail', ruta: '/secretaria/m/enviar-correo', roles: [Rol.ADMIN] },
  { label: 'Perfil', icono: 'person', ruta: '/secretaria/m/perfil', roles: [Rol.ADMIN, Rol.PARADOCENTE] },
];

interface Props {
  rol: Rol;
}

export default function SecretariaMobileBottomNav({ rol }: Props) {
  const { temaOscuro } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const items = NAV_ITEMS.filter(item => item.roles.includes(rol));

  if (items.length === 0) return null;

  const navStyle: React.CSSProperties = {
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999,
    background: temaOscuro ? '#1f2937' : '#edeef0',
    borderTop: temaOscuro ? '1px solid #374151' : '1px solid #dac0c4',
    display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start',
    padding: '8px 8px calc(env(safe-area-inset-bottom, 0px) + 8px)',
    height: 72,
    borderRadius: '12px 12px 0 0',
    boxShadow: '0 -2px 8px rgba(0,0,0,.08)',
  };

  const itemStyle = (activo: boolean): React.CSSProperties => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    border: 'none', cursor: 'pointer',
    padding: '6px 16px', minWidth: 48, borderRadius: 9999,
    background: activo ? (temaOscuro ? '#2d3748' : '#7a1f3d') : 'transparent',
    color: activo ? (temaOscuro ? '#ffb1c2' : '#ff8ba8') : (temaOscuro ? '#9ca3af' : '#554245'),
    transition: 'background 0.15s, color 0.15s, transform 0.15s',
  });

  return (
    <nav style={navStyle}>
      {items.map(item => {
        const activa = location.pathname === item.ruta;
        return (
          <button
            key={item.ruta}
            style={itemStyle(activa)}
            onClick={() => navigate(item.ruta)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22, lineHeight: 1 }}>
              {item.icono}
            </span>
            <span style={{
              fontSize: 11, fontWeight: activa ? 700 : 500, margin: 0,
              letterSpacing: '0.02em',
              color: activa ? (temaOscuro ? '#ffb1c2' : '#ff8ba8') : undefined,
            }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
