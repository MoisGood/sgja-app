import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  obtenerSolicitudesDelEstablecimiento,
  escucharSolicitudes,
} from '../services/database';
import type { Solicitud } from '../types';
import { EstadoSolicitud } from '../types';
import { esAtraso, esInasistencia } from '../utils/tipoRegistroHelper';
import '../styles/dashboard.css';

interface Props {
  idEstablecimiento: string;
  nombre?: string;
  apellidos?: string;
}

interface StatCard {
  label: string;
  valor: number;
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
  { icono: '🚑', titulo: 'Formulario de Accidente', descripcion: 'Registrar un accidente escolar', ruta: '/registrar-accidente', gradient: 'linear-gradient(135deg, #dc2626, #b91c1c)' },
  { icono: '📋', titulo: 'Gestión de Pases', descripcion: 'Crear y justificar atrasos e inasistencias', ruta: '/inspectoria/gestion-pases', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { icono: '👀', titulo: 'Ver Pases', descripcion: 'Revisar los pases registrados', ruta: '/inspectoria/m/ver-pases', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
];

const hoyLocal = (): string => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dia}`;
};

const formatearFecha = (fecha: string): string => {
  if (!fecha) return '';
  try {
    const d = new Date(`${fecha}T00:00:00`);
    return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return fecha;
  }
};

const etiquetaEstado = (s: Solicitud): { texto: string; bg: string; color: string } => {
  switch (s.estado) {
    case EstadoSolicitud.INASISTENTE:
      return { texto: 'Pendiente', bg: '#fef3c7', color: '#92400e' };
    case EstadoSolicitud.INASISTENCIA_JUSTIFICADA:
      return { texto: 'Justificada', bg: '#dcfce7', color: '#166534' };
    case EstadoSolicitud.INASISTENCIA_NO_JUSTIFICADA:
      return { texto: 'No justificada', bg: '#fee2e2', color: '#991b1b' };
    case EstadoSolicitud.ATRASO_JUSTIFICADO:
      return { texto: 'Atraso justificado', bg: '#dcfce7', color: '#166534' };
    case EstadoSolicitud.ATRASO_INJUSTIFICADO:
      return { texto: 'Atraso injustificado', bg: '#fee2e2', color: '#991b1b' };
    case EstadoSolicitud.NO_PRESENTADA:
      return { texto: 'No presentada', bg: '#e5e7eb', color: '#374151' };
    default:
      return { texto: s.estado || 'Desconocido', bg: '#e5e7eb', color: '#374151' };
  }
};

export default function DashboardParadocente({ idEstablecimiento, nombre = '', apellidos = '' }: Props) {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoyLocal);

  useEffect(() => {
    let unsub: () => void = () => {};

    const init = async () => {
      setCargando(true);
      const data = await obtenerSolicitudesDelEstablecimiento(idEstablecimiento).catch(() => [] as Solicitud[]);
      setSolicitudes(data);
      unsub = escucharSolicitudes(idEstablecimiento, (dataRealtime) => {
        setSolicitudes(dataRealtime);
      });
      setCargando(false);
    };

    init();
    return () => unsub();
  }, [idEstablecimiento]);

  const delDia = useMemo(
    () => solicitudes.filter((s) => s.fecha === fechaSeleccionada),
    [solicitudes, fechaSeleccionada]
  );

  const inasistencias = delDia.filter((s) => esInasistencia(s.tipo));
  const atrasos = delDia.filter((s) => esAtraso(s.tipo));
  const pendientes = inasistencias.filter((s) => s.estado === EstadoSolicitud.INASISTENTE);
  const justificadas = inasistencias.filter((s) => s.estado === EstadoSolicitud.INASISTENCIA_JUSTIFICADA);
  const noJustificadas = inasistencias.filter((s) => s.estado === EstadoSolicitud.INASISTENCIA_NO_JUSTIFICADA);

  const stats: StatCard[] = [
    { label: 'Inasistencias de la jornada', valor: inasistencias.length, icono: '❌', color: '#dc2626', bg: '#fee2e2' },
    { label: 'Atrasos del día', valor: atrasos.length, icono: '🕐', color: '#d97706', bg: '#fef3c7' },
    { label: 'Justificadas', valor: justificadas.length, icono: '✅', color: '#059669', bg: '#d1fae5' },
    { label: 'No justificadas', valor: noJustificadas.length, icono: '⛔', color: '#991b1b', bg: '#fee2e2' },
    { label: 'Pendientes por justificar', valor: pendientes.length, icono: '⏳', color: '#2563eb', bg: '#dbeafe' },
  ];

  const esHoy = fechaSeleccionada === hoyLocal();

  return (
    <div className="dashboard-container">
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 55%, #b91c1c 100%)',
        borderRadius: '16px',
        padding: 'clamp(1.5rem, 4vw, 2.5rem)',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px',
          borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-30%', left: '20%', width: '200px', height: '200px',
          borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ color: '#fff', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, marginBottom: '0.5rem' }}>
            Bienvenido, {nombre.trim() || (apellidos.trim() ? apellidos.trim() : 'Paradocente')}
          </h1>
          <p style={{ color: '#fecaca', fontSize: 'clamp(0.875rem, 2vw, 1rem)', margin: 0 }}>
            Control de asistencia e inspectoría — registra, supervisa y justifica atrasos e inasistencias de la jornada en tu establecimiento.
          </p>
        </div>
      </div>

      {/* Filtro de calendario */}
      <div style={{
        background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px',
        padding: '1rem 1.25rem', marginBottom: '1.5rem',
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 220 }}>
          <span style={{ fontSize: '1.25rem' }}>📅</span>
          <input
            type="date"
            value={fechaSeleccionada}
            onChange={(e) => setFechaSeleccionada(e.target.value || hoyLocal())}
            style={{
              padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '8px',
              fontSize: '0.875rem', flex: 1,
            }}
          />
        </div>
        {!esHoy && (
          <button
            type="button"
            onClick={() => setFechaSeleccionada(hoyLocal())}
            style={{
              padding: '0.5rem 1rem', background: '#dc2626', color: '#fff', border: 'none',
              borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
            }}
          >
            Volver a hoy
          </button>
        )}
        <p style={{
          margin: 0, fontSize: '0.875rem', color: '#6b7280', fontWeight: 600, textTransform: 'capitalize',
          minWidth: 200,
        }}>
          {formatearFecha(fechaSeleccionada)}{esHoy ? ' · Hoy' : ''}
        </p>
      </div>

      {/* Stats */}
      <div className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
        {stats.map((s, i) => (
          <div key={i} className="stat-card" style={{ animation: `fadeInUp 0.3s ease ${i * 0.08}s both` }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px', background: s.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem', marginBottom: '0.75rem',
            }}>
              {s.icono}
            </div>
            <div className="stat-number" style={{ color: s.color }}>{cargando ? '…' : s.valor}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Accesos Rápidos */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: 'clamp(1rem, 3vw, 1.5rem)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb', marginBottom: '1.5rem',
      }}>
        <h3 style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', fontWeight: 600, margin: '0 0 0.25rem' }}>
          ⚡ Accesos Rápidos
        </h3>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
          Funciones principales para tu perfil
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
                if (icon) icon.style.background = '#fee2e2';
                const desc = e.currentTarget.querySelector('.acceso-desc') as HTMLElement;
                if (desc) desc.style.color = '#6b7280';
              }}
            >
              <div className="acceso-icono" style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: '#fee2e2', display: 'flex', alignItems: 'center',
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

      {/* Detalle de inasistencias del día */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: 'clamp(1rem, 3vw, 1.5rem)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', fontWeight: 600, margin: '0 0 0.25rem' }}>
              ❌ Inasistencias del día
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
              {inasistencias.length > 0
                ? `${inasistencias.length} registro${inasistencias.length !== 1 ? 's' : ''} para la jornada del ${formatearFecha(fechaSeleccionada)}`
                : 'Sin inasistencias registradas para esta fecha'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/inspectoria/gestion-pases')}
            style={{
              padding: '0.6rem 1.25rem', background: '#dc2626', color: '#fff', border: 'none',
              borderRadius: '10px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Ir a Gestión de Pases →
          </button>
        </div>

        {inasistencias.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0', margin: 0, fontSize: '0.925rem' }}>
            No hay inasistencias que mostrar para el día seleccionado.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {inasistencias.map((s) => {
              const estado = etiquetaEstado(s);
              return (
                <div key={s.id_solicitud} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
                  padding: '0.75rem 1rem', borderRadius: '10px', background: '#f9fafb', flexWrap: 'wrap',
                }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>
                      {s.id_estudiante}
                      {s.curso && <span style={{ color: '#6b7280', fontWeight: 500 }}> · {s.curso}</span>}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                      {s.fecha} {s.hora ? `· ${s.hora}` : ''}
                    </p>
                  </div>
                  <span style={{
                    padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem',
                    fontWeight: 600, background: estado.bg, color: estado.color,
                  }}>
                    {estado.texto}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
