import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { obtenerUsuariosPorEstablecimientoTodos } from '../services/usuarios.service';
import { obtenerSolicitudesDelEstablecimiento } from '../services/database';
import '../styles/dashboard.css';

interface Props {
  idEstablecimiento: string;
}

interface StatCard {
  label: string;
  valor: number | string;
  icono: string;
  color: string;
  bg: string;
}

interface Acceso {
  icono: string;
  titulo: string;
  descripcion: string;
  ruta: string;
  gradient: string;
}

const ACCESOS: Acceso[] = [
  { icono: '👥', titulo: 'Usuarios', descripcion: 'Gestionar cuentas y roles', ruta: '/gestion-usuarios', gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
  { icono: '📋', titulo: 'Solicitudes', descripcion: 'Crear nueva solicitud', ruta: '/inspectoria/justificaciones', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { icono: '🛡️', titulo: 'Seguridad', descripcion: '2FA, inactividad, accesos', ruta: '/seguridad', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
  { icono: '⏰', titulo: 'Bloques', descripcion: 'Configurar horarios', ruta: '/bloque-horario', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
  { icono: '📚', titulo: 'Cursos', descripcion: 'Mantenedor de cursos', ruta: '/mantenedor-cursos', gradient: 'linear-gradient(135deg, #ec4899, #db2777)' },
  { icono: '👤', titulo: 'Estudiantes', descripcion: 'Mantenedor de estudiantes', ruta: '/mantenedor-estudiantes', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
  { icono: '🔐', titulo: 'Permisos', descripcion: 'Asignar accesos por rol', ruta: '/asignar-permisos', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
  { icono: '📊', titulo: 'Reportes', descripcion: 'Estadísticas del sistema', ruta: '/reportes', gradient: 'linear-gradient(135deg, #f97316, #ea580c)' },
  { icono: '⚙️', titulo: 'Parámetros', descripcion: 'Configuración general', ruta: '/parametros', gradient: 'linear-gradient(135deg, #6b7280, #4b5563)' },
  { icono: '📧', titulo: 'Correos', descripcion: 'Configurar correos', ruta: '/correos', gradient: 'linear-gradient(135deg, #14b8a6, #0d9488)' },
];

export default function DashboardAdmin({ idEstablecimiento }: Props) {
  const navigate = useNavigate();
  const { nombre: nombreAdmin, email } = useAuth();
  const [stats, setStats] = useState<StatCard[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    async function cargar() {
      try {
        const [usuarios, solicitudes] = await Promise.all([
          obtenerUsuariosPorEstablecimientoTodos(idEstablecimiento),
          obtenerSolicitudesDelEstablecimiento(idEstablecimiento),
        ]);
        if (!activo) return;
        const hoy = new Date().toISOString().slice(0, 10);
        const solicitudesHoy = solicitudes.filter(s => s.fecha?.startsWith(hoy));
        const pendientes = solicitudes.filter(s => s.estado === 'INASISTENTE');
        setStats([
          { label: 'Usuarios', valor: usuarios.length, icono: '👥', color: '#6366f1', bg: '#eef2ff' },
          { label: 'Solicitudes Hoy', valor: solicitudesHoy.length, icono: '📋', color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Pendientes', valor: pendientes.length, icono: '⏳', color: '#10b981', bg: '#ecfdf5' },
          { label: 'Total Solicitudes', valor: solicitudes.length, icono: '📊', color: '#3b82f6', bg: '#eff6ff' },
        ]);
      } catch {
        if (activo) {
          setStats([
            { label: 'Usuarios', valor: '—', icono: '👥', color: '#6366f1', bg: '#eef2ff' },
            { label: 'Solicitudes Hoy', valor: '—', icono: '📋', color: '#f59e0b', bg: '#fffbeb' },
            { label: 'Pendientes', valor: '—', icono: '⏳', color: '#10b981', bg: '#ecfdf5' },
            { label: 'Total Solicitudes', valor: '—', icono: '📊', color: '#3b82f6', bg: '#eff6ff' },
          ]);
        }
      } finally {
        if (activo) setCargando(false);
      }
    }
    cargar();
    return () => { activo = false; };
  }, [idEstablecimiento]);

  return (
    <div className="dashboard-container">
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #1d4ed8 100%)',
        borderRadius: '16px',
        padding: 'clamp(1.5rem, 4vw, 2.5rem)',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px',
          borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-30%', left: '20%', width: '200px', height: '200px',
          borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ color: '#fff', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, marginBottom: '0.5rem' }}>
            Bienvenido, {nombreAdmin || email || 'Admin'}
          </h1>
          <p style={{ color: '#93c5fd', fontSize: 'clamp(0.875rem, 2vw, 1rem)', margin: 0 }}>
            Panel de administración — Gestiona el sistema desde un solo lugar
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-stats">
        {stats.map((s, i) => (
          <div key={i} className="stat-card" style={{ animation: `fadeInUp 0.3s ease ${i * 0.08}s both` }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px', background: s.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem', marginBottom: '0.75rem',
            }}>
              {s.icono}
            </div>
            <div className="stat-number" style={{ color: s.color }}>{cargando ? '...' : s.valor}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Access Grid */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: 'clamp(1rem, 3vw, 1.5rem)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb',
      }}>
        <h3 style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', fontWeight: 600, marginBottom: '0.25rem' }}>
          ⚡ Accesos Rápidos
        </h3>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
          Funciones principales del sistema
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem',
        }}>
          {ACCESOS.map((a, i) => (
            <button
              key={i}
              type="button"
              onClick={() => navigate(a.ruta)}
              style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1rem', border: 'none', borderRadius: '12px',
                cursor: 'pointer', transition: 'all 0.25s ease',
                background: '#f9fafb', textAlign: 'left',
                animation: `fadeInUp 0.3s ease ${(i + 4) * 0.05}s both`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = a.gradient;
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                const icon = e.currentTarget.querySelector('.acceso-icono') as HTMLElement;
                if (icon) icon.style.background = 'rgba(255,255,255,0.2)';
                const desc = e.currentTarget.querySelector('.acceso-desc') as HTMLElement;
                if (desc) desc.style.color = 'rgba(255,255,255,0.8)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#f9fafb';
                e.currentTarget.style.color = '#1f2937';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
                const icon = e.currentTarget.querySelector('.acceso-icono') as HTMLElement;
                if (icon) icon.style.background = '#eef2ff';
                const desc = e.currentTarget.querySelector('.acceso-desc') as HTMLElement;
                if (desc) desc.style.color = '#6b7280';
              }}
            >
              <div className="acceso-icono" style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: '#eef2ff', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0,
                transition: 'background 0.25s ease',
              }}>
                {a.icono}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', transition: 'color 0.25s ease' }}>{a.titulo}</div>
                <div className="acceso-desc" style={{
                  color: '#6b7280', fontSize: '0.75rem', marginTop: '2px',
                  transition: 'color 0.25s ease',
                }}>
                  {a.descripcion}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
