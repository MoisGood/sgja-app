import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

const NAV_ITEMS = [
  { label: 'Inicio', icono: 'home', ruta: '/tecnico/m/inicio', roles: ['ADMIN', 'INSPECTOR', 'PROFESOR', 'ESTUDIANTE', 'APODERADO', 'TECNICO'] },
  { label: 'Historial', icono: 'history', ruta: '/tecnico/m/tickets', roles: ['TECNICO'] },
  { label: 'QR', icono: 'qr_code_scanner', ruta: '/tecnico/m/qr', roles: ['TECNICO'], isQr: true },
  { label: 'Inventario', icono: 'inventory_2', ruta: '/tecnico/m/inventario', roles: ['TECNICO'] },
  { label: 'Config', icono: 'settings', ruta: '/tecnico/m/config', roles: ['TECNICO'] },
] as const;

interface Props { rol: string; permisos?: string[] }

export default function MobileBottomNav({ rol }: Props) {
  const { temaOscuro } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

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

  const qrStyle: React.CSSProperties = {
    width: 64, height: 64, display: 'flex', alignItems: 'center',
    justifyContent: 'center', borderRadius: '9999px',
    background: temaOscuro ? '#5c0427' : '#5c0427',
    color: '#ffffff',
    marginTop: -24, border: temaOscuro ? '4px solid #111827' : '4px solid #ffffff',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
    transition: 'transform 0.15s',
  };

  const items = NAV_ITEMS.filter(item => (item.roles as readonly string[]).includes(rol));

  if (items.length === 0) return null;

  return (
    <nav style={navStyle}>
      {items.map(item => {
        const activa = location.pathname === item.ruta;
        if ('isQr' in item && item.isQr) {
          return (
            <button
              key={item.ruta}
              style={qrStyle}
              onClick={() => navigate(item.ruta)}
              title={item.label}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
                {item.icono}
              </span>
            </button>
          );
        }
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
