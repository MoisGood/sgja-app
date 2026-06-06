import { IndicadorConexion } from './IndicadorConexion';
import NotificacionCampana from './NotificacionCampana';
import { Moon, Sun } from 'lucide-react';
import { Rol } from '../types';

const ROL_COLORES: Record<Rol, string> = {
  [Rol.ADMIN]: '#7C3AED', [Rol.INSPECTOR]: '#0369A1', [Rol.PROFESOR]: '#065F46',
  [Rol.ESTUDIANTE]: '#92400E', [Rol.APODERADO]: '#9D174D',
};
const ROL_BG: Record<Rol, string> = {
  [Rol.ADMIN]: '#EDE9FE', [Rol.INSPECTOR]: '#E0F2FE', [Rol.PROFESOR]: '#D1FAE5',
  [Rol.ESTUDIANTE]: '#FEF3C7', [Rol.APODERADO]: '#FCE7F3',
};

interface Props {
  temaOscuro: boolean;
  setTemaOscuro: (v: boolean) => void;
  nombre: string;
  rol: Rol;
  email: string;
  usuarioId?: string;
  onAbrirDatos: () => void;
  establecimientoNombre?: string;
  sistemaNombre?: string;
  sistemaSubtitulo?: string;
}

export default function Header({ temaOscuro, setTemaOscuro, nombre, rol, email, usuarioId, onAbrirDatos, establecimientoNombre, sistemaNombre = 'Intranet', sistemaSubtitulo = '' }: Props) {
  return (
    <header style={{
      backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0',
      padding: '12px 32px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10,
    }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#1A3C6B', margin: 0 }}>
          {sistemaNombre}
        </h1>
        {sistemaSubtitulo && (
          <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>
            {sistemaSubtitulo}{establecimientoNombre ? ` · ${establecimientoNombre}` : ''}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <IndicadorConexion />
        <NotificacionCampana />
        <button type="button" onClick={() => setTemaOscuro(!temaOscuro)} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '6px', color: temaOscuro ? '#fbbf24' : '#6b7280', fontSize: '20px',
        }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = temaOscuro ? '#f3f4f6' : '#111827'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
          title={temaOscuro ? 'Modo claro' : 'Modo oscuro'}
        >
          {temaOscuro ? <Sun size={24} /> : <Moon size={24} />}
        </button>
        <button type="button" onClick={() => usuarioId && onAbrirDatos()} style={{
          display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
          padding: '6px 12px', borderRadius: '8px', transition: 'background-color 0.15s',
          border: 'none', background: 'none', font: 'inherit', color: 'inherit',
        }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F3F4F6'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#2E75B6', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', flexShrink: 0 }}>
            {nombre.charAt(0).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A3C6B' }}>{nombre}</span>
            <span style={{ fontSize: '12px', fontWeight: 700, padding: '1px 6px', borderRadius: '999px', display: 'inline-block', width: 'fit-content', color: ROL_COLORES[rol], backgroundColor: ROL_BG[rol] }}>{rol}</span>
          </div>
          <span style={{ fontSize: '13px', color: '#6B7280' }}>{email}</span>
        </button>
      </div>
    </header>
  );
}
