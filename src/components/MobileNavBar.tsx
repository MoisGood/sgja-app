import { useLocation, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, Camera, Monitor, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { icono: <Home size={20} />, label: 'Inicio', ruta: '/tecnico/m/inicio' },
  { icono: <ClipboardList size={20} />, label: 'Historial', ruta: '/tecnico/m/historial' },
  { icono: <Camera size={20} />, label: 'QR', ruta: '/tecnico/m/qr' },
  { icono: <Monitor size={20} />, label: 'Equipos', ruta: '/tecnico/m/equipos' },
  { icono: <Settings size={20} />, label: 'Config', ruta: '/tecnico/m/config' },
];

export default function MobileNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const activa = location.pathname;

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999,
      background: '#fff', borderTop: '1px solid #E5E7EB',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '4px 0', height: 56, boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
    }}>
      {NAV_ITEMS.map(item => {
        const esActiva = activa === item.ruta;
        return (
          <button
            key={item.ruta}
            onClick={() => navigate(item.ruta)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 1, background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px 8px', minWidth: 48,
              opacity: esActiva ? 1 : 0.5,
              transition: 'opacity .15s',
            }}
          >
            <span style={{ lineHeight: 1, color: esActiva ? '#1A3C6B' : '#6B7280' }}>{item.icono}</span>
            <span style={{
              fontSize: 10, fontWeight: esActiva ? 600 : 400,
              color: esActiva ? '#1A3C6B' : '#6B7280',
            }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
