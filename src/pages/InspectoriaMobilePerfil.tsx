import { LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { registrarCierre } from '../services/online';
import { Rol } from '../types';
import { useTheme } from '../hooks/useTheme';

interface Props {
  nombre: string;
  email: string;
  rol: Rol;
}

const NOMBRE_ROL: Record<string, string> = {
  ADMIN: 'Administrador',
  INSPECTOR: 'Inspector',
  PARADOCENTE: 'Paradocente',
  PROFESOR: 'Profesor',
  ESTUDIANTE: 'Estudiante',
  APODERADO: 'Apoderado',
};

export default function InspectoriaMobilePerfil({ nombre, email, rol }: Props) {
  const { temaOscuro, setTemaOscuro } = useTheme();

  const iniciales = nombre
    ? nombre.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const handleLogout = async () => {
    try {
      if (email) await registrarCierre(email);
      await supabase.auth.signOut();
    } catch {
      await supabase.auth.signOut();
    }
  };

  const containerStyle: React.CSSProperties = {
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 24,
  };

  const avatarStyle: React.CSSProperties = {
    width: 80,
    height: 80,
    borderRadius: '50%',
    backgroundColor: '#7a1f3d',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 32,
    fontWeight: 700,
  };

  const cardStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: temaOscuro ? '#1f2937' : '#ffffff',
    borderRadius: 16,
    padding: 16,
    border: temaOscuro ? '1px solid #374151' : '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 14,
  };

  const labelStyle: React.CSSProperties = {
    color: temaOscuro ? '#9ca3af' : '#554245',
    fontWeight: 500,
  };

  const valueStyle: React.CSSProperties = {
    color: temaOscuro ? '#f3f4f6' : '#191c1e',
    fontWeight: 600,
  };

  const btnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', padding: '12px', border: 'none', borderRadius: 12,
    cursor: 'pointer', fontSize: 15, fontWeight: 600,
    backgroundColor: '#dc2626', color: '#ffffff',
  };

  return (
    <div style={containerStyle}>
      <div style={avatarStyle}>
        {iniciales}
      </div>

      <div style={cardStyle}>
        <div style={rowStyle}>
          <span style={labelStyle}>Nombre</span>
          <span style={valueStyle}>{nombre}</span>
        </div>
        <div style={{ ...rowStyle, borderTop: temaOscuro ? '1px solid #374151' : '1px solid #e2e8f0', paddingTop: 12 }}>
          <span style={labelStyle}>Email</span>
          <span style={valueStyle}>{email}</span>
        </div>
        <div style={{ ...rowStyle, borderTop: temaOscuro ? '1px solid #374151' : '1px solid #e2e8f0', paddingTop: 12 }}>
          <span style={labelStyle}>Rol</span>
          <span style={valueStyle}>{NOMBRE_ROL[rol as string] || rol}</span>
        </div>
      </div>

      <div style={cardStyle}>
        <button
          onClick={() => setTemaOscuro(!temaOscuro)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
            border: 'none', background: 'transparent', cursor: 'pointer',
            fontSize: 14, color: temaOscuro ? '#f3f4f6' : '#191c1e', textAlign: 'left', width: '100%',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            {temaOscuro ? 'light_mode' : 'dark_mode'}
          </span>
          {temaOscuro ? 'Modo claro' : 'Modo oscuro'}
        </button>
      </div>

      <button style={btnStyle} onClick={handleLogout}>
        <LogOut size={18} />
        Cerrar sesión
      </button>
    </div>
  );
}
