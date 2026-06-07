import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';

interface Props { idEstablecimiento?: string }

export default function MenuTecnico({ idEstablecimiento: _idEst }: Props) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [rol, setRol] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data?.user?.email) setUsuario(data.user.email);
      if (data?.user?.id) {
        const { data: u } = await supabase.from('usuarios').select('rol').eq('uid', data.user.id).single();
        if (u) setRol(u.rol);
      }
    });
  }, []);

  const esAdmin = rol === 'ADMIN';
  const menuItems = esAdmin ? [
    { icono: '🗺️', label: 'Mapa', ruta: '/tecnico/mapa', desc: 'Mapa interactivo de ubicaciones' },
    { icono: '🔧', label: 'Equipos', ruta: '/tecnico/equipos', desc: 'Administrar equipos' },
    { icono: '📍', label: 'Ubicaciones', ruta: '/tecnico/ubicaciones', desc: 'Gestionar ubicaciones' },
    { icono: '📋', label: 'Requerimientos', ruta: '/tecnico/requerimientos', desc: 'Ver todos los requerimientos' },
    { icono: '⚙️', label: 'Configuración', ruta: '/tecnico/configuracion', desc: 'Catálogos técnicos' },
    { icono: '📷', label: 'Accesos Rápidos', ruta: '/tecnico/accesos', desc: 'Escanear QR, tickets rápidos' },
  ] : [
    { icono: '🗺️', label: 'Mapa', ruta: '/tecnico/m/mapa', desc: 'Mapa y lugares del establecimiento' },
    { icono: '🔧', label: 'Equipos', ruta: '/tecnico/m/equipos', desc: 'Administrar equipos' },
    { icono: '📍', label: 'Ubicaciones', ruta: '/tecnico/m/ubicaciones', desc: 'Gestionar ubicaciones' },
    { icono: '⚙️', label: 'Configuración', ruta: '/tecnico/m/config', desc: 'Catálogos técnicos' },
    { icono: '📷', label: 'Accesos Rápidos', ruta: '/tecnico/accesos', desc: 'Escanear QR, tickets rápidos' },
  ];

  return (
    <div style={{ padding: 16, maxWidth: 500, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A3C6B', margin: '0 0 2px' }}>📋 Menú Técnico</h1>
      <p style={{ color: '#6B7280', fontSize: 12, marginBottom: 16 }}>
        {usuario ? `Bienvenido, ${usuario}` : 'SGJA — Soporte y mantención'}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {menuItems.map(item => (
          <div
            key={item.ruta}
            onClick={() => navigate(item.ruta)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', borderRadius: 12,
              background: '#fff', border: '1px solid #E5E7EB',
              cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'box-shadow .15s, transform .15s',
            }}
          >
            <span style={{ fontSize: 28, lineHeight: 1 }}>{item.icono}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>{item.label}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{item.desc}</div>
            </div>
            <span style={{ color: '#D1D5DB', fontSize: 18 }}>›</span>
          </div>
        ))}
      </div>

      <button onClick={() => navigate('/tecnico/accesos')} style={{
        width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #D1D5DB',
        background: '#F9FAFB', color: '#374151', fontSize: 14, fontWeight: 500, cursor: 'pointer',
        marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        ← Volver al inicio
      </button>

      <p style={{ color: '#9CA3AF', fontSize: 10, textAlign: 'center', marginTop: 16 }}>
        SGJA · Módulo Técnico v1
      </p>
    </div>
  );
}
