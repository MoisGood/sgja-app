import { useLocation, useNavigate } from 'react-router-dom';
import type { Rol } from '../types';
import { Menu, X, LogOut } from 'lucide-react';

interface MenuItem {
  icono: React.ReactNode;
  etiqueta: string;
  ruta: string;
  roles: Rol[];
  submenu?: MenuItem[];
}

interface Props {
  sidebarAbierto: boolean;
  setSidebarAbierto: (v: boolean) => void;
  itemsFiltrados: MenuItem[];
  submenuAbierto: string | null;
  setSubmenuAbierto: (v: string | null) => void;
  handleLogout: () => void;
  sistemaNombre?: string;
  sistemaSubtitulo?: string;
  sistemaLogoUrl?: string;
}

export default function Sidebar({
  sidebarAbierto, setSidebarAbierto, itemsFiltrados,
  submenuAbierto, setSubmenuAbierto, handleLogout,
  sistemaNombre = 'SGJA', sistemaSubtitulo = '', sistemaLogoUrl = '',
}: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const rutaActiva = location.pathname;
  return (
    <aside style={{
      backgroundColor: '#1A3C6B', display: 'flex', flexDirection: 'column',
      transition: 'width 0.25s ease, min-width 0.25s ease',
      position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', overflowX: 'hidden',
      width: sidebarAbierto ? '260px' : '70px', minWidth: sidebarAbierto ? '260px' : '70px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        {sidebarAbierto && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {sistemaLogoUrl
              ? <img src={sistemaLogoUrl} alt="" style={{ width: 64, height: 'auto', borderRadius: 6, objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              : <span style={{ fontSize: '28px' }}>📋</span>
            }
            <div>
              <p style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '18px', margin: 0 }}>{sistemaNombre}</p>
              <p style={{ color: '#93C5FD', fontSize: '12px', margin: 0 }}>{sistemaSubtitulo}</p>
            </div>
          </div>
        )}
        <button type="button" onClick={() => setSidebarAbierto(!sidebarAbierto)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
          {sidebarAbierto ? <X size={20} color="#fff" /> : <Menu size={20} color="#fff" />}
        </button>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', padding: '12px 8px', gap: '4px', flex: 1 }}>
        {itemsFiltrados.length === 0 ? (
          <p style={{ color: '#9CA3AF', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>Sin páginas disponibles</p>
        ) : itemsFiltrados.map((item) => {
          const activo = rutaActiva === item.ruta;
          const tieneSubmenu = item.submenu && item.submenu.length > 0;
          const submenuExpanded = submenuAbierto === item.ruta;
          return (
            <div key={item.ruta}>
              <button type="button"                 onClick={() => { if (!sidebarAbierto) { setSidebarAbierto(true); if (tieneSubmenu) setSubmenuAbierto(item.ruta); } else { if (tieneSubmenu) { setSubmenuAbierto(submenuExpanded ? null : item.ruta); } else { navigate(item.ruta); } } }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px',
                  border: 'none', cursor: 'pointer', width: '100%', transition: 'background-color 0.15s',
                  background: activo || submenuExpanded ? 'rgba(255,255,255,0.15)' : 'transparent',
                  borderLeft: activo || submenuExpanded ? '3px solid #60A5FA' : '3px solid transparent',
                  justifyContent: sidebarAbierto ? 'flex-start' : 'center',
                }}
              >
                <span style={{ color: activo || submenuExpanded ? '#60A5FA' : '#CBD5E1', flexShrink: 0 }}>{item.icono}</span>
                {sidebarAbierto && (
                  <>
                    <span style={{ fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: activo || submenuExpanded ? '#F0F9FF' : '#CBD5E1' }}>{item.etiqueta}</span>
                    {tieneSubmenu && <span style={{ marginLeft: 'auto', fontSize: '12px', transform: submenuExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>}
                  </>
                )}
              </button>
              {tieneSubmenu && submenuExpanded && sidebarAbierto && (
                <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '8px', gap: '2px' }}>
                  {item.submenu?.map((sub) => {
                    const subactivo = rutaActiva === sub.ruta;
                    return (
                      <button type="button" key={sub.ruta} onClick={() => navigate(sub.ruta)} style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px 8px 20px',
                        borderRadius: '6px', border: 'none', cursor: 'pointer', width: '100%',
                        fontSize: '13px', transition: 'background-color 0.15s', background: 'transparent',
                        backgroundColor: subactivo ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
                        borderLeft: subactivo ? '3px solid #60A5FA' : '3px solid transparent',
                      }}>
                        <span style={{ color: subactivo ? '#60A5FA' : '#CBD5E1', flexShrink: 0 }}>{sub.icono}</span>
                        <span style={{ fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: subactivo ? '#F0F9FF' : '#CBD5E1' }}>{sub.etiqueta}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <button type="button" onClick={handleLogout} style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px',
        border: 'none', cursor: 'pointer', width: '100%', transition: 'background-color 0.15s',
        background: 'transparent', marginTop: 'auto', marginBottom: '16px',
        justifyContent: sidebarAbierto ? 'flex-start' : 'center',
      }}>
        <LogOut size={20} color="#F87171" />
        {sidebarAbierto && <span style={{ fontSize: '14px', fontWeight: 500, color: '#F87171' }}>Cerrar sesión</span>}
      </button>
    </aside>
  );
}
