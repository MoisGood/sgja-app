import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { obtenerSolicitudesDelEstablecimiento, escucharSolicitudes } from '../services/database';
import type { Solicitud } from '../types';
import { EstadoSolicitud } from '../types';
import { esAtraso, esInasistencia } from '../utils/tipoRegistroHelper';

interface Props {
  idEstablecimiento: string;
  nombre?: string;
  apellidos?: string;
}

interface Contador {
  label: string;
  valor: number;
  icono: string;
  color: string;
  bg: string;
}

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
    return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
  } catch {
    return fecha;
  }
};

const ACCESOS = [
  { icono: 'emergency', titulo: 'Formulario de Accidente', descripcion: 'Registrar un accidente escolar', ruta: '/registrar-accidente', color: '#dc2626', bg: '#fee2e2' },
  { icono: 'assignment', titulo: 'Gestión de Pases', descripcion: 'Crear y justificar atrasos e inasistencias', ruta: '/inspectoria/m/gestion-pases', color: '#d97706', bg: '#fef3c7' },
  { icono: 'visibility', titulo: 'Ver Pases', descripcion: 'Revisar los pases registrados', ruta: '/inspectoria/m/ver-pases', color: '#2563eb', bg: '#dbeafe' },
];

const etiquetaEstado = (s: Solicitud): { texto: string; bg: string; color: string } => {
  switch (s.estado) {
    case EstadoSolicitud.INASISTENTE:
      return { texto: 'Pendiente', bg: '#fef3c7', color: '#92400e' };
    case EstadoSolicitud.INASISTENCIA_JUSTIFICADA:
      return { texto: 'Justificada', bg: '#dcfce7', color: '#166534' };
    case EstadoSolicitud.INASISTENCIA_NO_JUSTIFICADA:
      return { texto: 'No justificada', bg: '#fee2e2', color: '#991b1b' };
    default:
      return { texto: s.estado || 'Desconocido', bg: '#e5e7eb', color: '#374151' };
  }
};

export default function DashboardParadocenteMovil({ idEstablecimiento, nombre = '', apellidos = '' }: Props) {
  const { temaOscuro } = useTheme();
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

  const contadores: Contador[] = [
    { label: 'Inasistencias', valor: inasistencias.length, icono: '❌', color: '#dc2626', bg: '#fee2e2' },
    { label: 'Atrasos', valor: atrasos.length, icono: '🕐', color: '#d97706', bg: '#fef3c7' },
    { label: 'Justificadas', valor: justificadas.length, icono: '✅', color: '#059669', bg: '#d1fae5' },
    { label: 'No justificadas', valor: noJustificadas.length, icono: '⛔', color: '#991b1b', bg: '#fee2e2' },
    { label: 'Pendientes', valor: pendientes.length, icono: '⏳', color: '#2563eb', bg: '#dbeafe' },
  ];

  const esHoy = fechaSeleccionada === hoyLocal();

  const cardStyle: React.CSSProperties = {
    backgroundColor: temaOscuro ? '#1f2937' : '#ffffff',
    borderRadius: 16,
    padding: 16,
    border: temaOscuro ? '1px solid #374151' : '1px solid #e2e8f0',
  };

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Saludo */}
      <div>
        <h1 style={{
          fontSize: 22, fontWeight: 700, color: temaOscuro ? '#f3f4f6' : '#191c1e',
          margin: '0 0 4px', lineHeight: 1.3,
        }}>
          ¡Hola, {(nombre.trim() || apellidos.trim() || 'Paradocente').split(' ')[0]}!
        </h1>
        <p style={{
          fontSize: 13, color: temaOscuro ? '#9ca3af' : '#554245', margin: 0, lineHeight: 1.4,
        }}>
          Registra y justifica atrasos e inasistencias de la jornada en tu establecimiento.
        </p>
      </div>

      {/* Filtro calendario */}
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#dc2626' }}>calendar_month</span>
        <input
          type="date"
          value={fechaSeleccionada}
          onChange={(e) => setFechaSeleccionada(e.target.value || hoyLocal())}
          style={{
            flex: 1, minWidth: 120, padding: '8px 10px', border: '1px solid #d1d5db',
            borderRadius: 8, fontSize: 14, background: temaOscuro ? '#111827' : '#fff',
            color: temaOscuro ? '#f3f4f6' : '#191c1e',
          }}
        />
        {!esHoy && (
          <button
            type="button"
            onClick={() => setFechaSeleccionada(hoyLocal())}
            style={{
              padding: '8px 14px', background: '#dc2626', color: '#fff', border: 'none',
              borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}
          >
            Hoy
          </button>
        )}
      </div>

      {/* Contadores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {contadores.map((c, i) => (
          <div
            key={i}
            style={{
              backgroundColor: c.bg, borderRadius: 14, padding: '14px 12px',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{c.icono}</span>
            <span style={{ fontSize: 26, fontWeight: 800, color: c.color, lineHeight: 1 }}>
              {cargando ? '…' : c.valor}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', lineHeight: 1.2 }}>
              {c.label}
            </span>
          </div>
        ))}
      </div>

      {/* Accesos rápidos */}
      <div>
        <p style={{
          fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
          color: temaOscuro ? '#9ca3af' : '#554245', margin: '0 0 10px',
        }}>
          Accesos rápidos
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {ACCESOS.map((a, i) => (
            <button
              key={i}
              type="button"
              onClick={() => navigate(a.ruta)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 6, padding: '14px 6px', border: 'none', borderRadius: 14, cursor: 'pointer',
                background: a.bg, textAlign: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 26, color: a.color }}>
                {a.icono}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: temaOscuro ? '#f3f4f6' : '#191c1e', lineHeight: 1.2 }}>
                {a.titulo}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Inasistencias del día */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <p style={{
              fontSize: 15, fontWeight: 700, margin: 0, color: temaOscuro ? '#f3f4f6' : '#191c1e',
              textTransform: 'capitalize',
            }}>
              {formatearFecha(fechaSeleccionada)}{esHoy ? ' · Hoy' : ''}
            </p>
            <p style={{ fontSize: 12, color: temaOscuro ? '#9ca3af' : '#554245', margin: '2px 0 0' }}>
              {inasistencias.length} inasistencia{inasistencias.length !== 1 ? 's' : ''} en la jornada
            </p>
          </div>
          <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#dc2626' }}>error</span>
        </div>

        {inasistencias.length === 0 ? (
          <p style={{
            textAlign: 'center', color: temaOscuro ? '#6b7280' : '#9ca3af', margin: 0, padding: '12px 0', fontSize: 13,
          }}>
            Sin inasistencias registradas esta fecha.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {inasistencias.slice(0, 6).map((s) => {
              const estado = etiquetaEstado(s);
              return (
                <div key={s.id_solicitud} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  padding: '10px 12px', borderRadius: 12, background: temaOscuro ? '#111827' : '#f9fafb',
                }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      margin: 0, fontWeight: 600, fontSize: 13, color: temaOscuro ? '#f3f4f6' : '#111827',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {s.id_estudiante}
                      {s.curso && <span style={{ color: '#6b7280', fontWeight: 500 }}> · {s.curso}</span>}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: temaOscuro ? '#9ca3af' : '#6b7280' }}>
                      {s.hora || s.fecha}
                    </p>
                  </div>
                  <span style={{
                    padding: '3px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 600,
                    background: estado.bg, color: estado.color, whiteSpace: 'nowrap',
                  }}>
                    {estado.texto}
                  </span>
                </div>
              );
            })}
            {inasistencias.length > 6 && (
              <button
                type="button"
                onClick={() => navigate('/inspectoria/m/gestion-pases')}
                style={{
                  padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, color: '#2563eb',
                }}
              >
                Ver las {inasistencias.length} inasistencias →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
