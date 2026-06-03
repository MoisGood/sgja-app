// ============================================================
// SGJA – Dashboard Apoderado
// src/pages/DashboardApoderado.tsx
// ============================================================

import { useState, useEffect } from 'react';
import { Card, EstadoBadge } from '../components/Common';
import { obtenerSolicitudesPorEstudiante, obtenerEstudiantesPorApoderado } from '../services/database';
import { obtenerPrestamosActivos } from '../services/library';
import type { Solicitud, Estudiante } from '../types';
import { TipoRegistro } from '../types';
import { getEmojiTipo, getLabelSimple } from '../utils/tipoRegistroHelper';

interface Props {
  idApoderado: string;
  idEstablecimiento: string;
}

export default function DashboardApoderado({ idApoderado, idEstablecimiento }: Props) {
  const [pupilos, setPupilos] = useState<Estudiante[]>([]);
  const [pupiloSeleccionado, setPupiloSeleccionado] = useState<Estudiante | null>(null);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [prestamosActivos, setPrestamosActivos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const doFetch = async () => {
      try {
        setCargando(true);
        const hijos = await obtenerEstudiantesPorApoderado(idApoderado).catch(() => []);
        setPupilos(hijos || []);
        if (hijos && hijos.length > 0) {
          setPupiloSeleccionado(hijos[0]);
        }
      } catch {
        setPupilos([]);
      } finally {
        setCargando(false);
      }
    };
    doFetch();
  }, [idApoderado]);

  useEffect(() => {
    if (!pupiloSeleccionado) return;
    const doFetch = async () => {
      try {
        const [sols, prestamosA] = await Promise.all([
          obtenerSolicitudesPorEstudiante(pupiloSeleccionado.id_estudiante).catch(() => []),
          obtenerPrestamosActivos(idEstablecimiento).catch(() => []),
        ]);
        setSolicitudes(sols || []);
        const prestamosDelPupilo = (prestamosA || []).filter((p: any) => p.student_id === pupiloSeleccionado.id_estudiante);
        setPrestamosActivos(prestamosDelPupilo);
      } catch (err) {
        console.error('Error al cargar datos del pupilo:', err);
      }
    };
    doFetch();
  }, [pupiloSeleccionado, idEstablecimiento]);

  if (cargando) {
    return (
      <div style={styles.contenedor}>
        <p style={styles.cargando}>⏳ Cargando información...</p>
      </div>
    );
  }

  if (pupilos.length === 0) {
    return (
      <div style={styles.contenedor}>
        <Card titulo="Sin datos" padding="24px">
          <p style={styles.sinDatos}>
            No se encontraron estudiantes vinculados a tu cuenta. Contacta al inspector del establecimiento.
          </p>
        </Card>
      </div>
    );
  }

  const atrasos = solicitudes.filter(s => s.tipo === TipoRegistro.ATRASO).length;
  const inasistencias = solicitudes.filter(s => s.tipo === TipoRegistro.INASISTENCIA).length;
  const prestamosVencidos = prestamosActivos.filter((p: any) => {
    const hoy = new Date();
    const vencimiento = new Date(p.due_date);
    return vencimiento < hoy && p.status !== 'Devuelto';
  }).length;

  return (
    <div style={styles.contenedor}>
      {/* Encabezado */}
      <div style={styles.encabezado}>
        <h1 style={styles.titulo}>Panel del Apoderado</h1>
        {pupilos.length > 1 && (
          <div style={styles.selectorPupilo}>
            <label style={styles.labelPupilo}>Seleccionar pupilo:</label>
            <select
              value={pupiloSeleccionado?.id_estudiante || ''}
              onChange={(e) => {
                const seleccionado = pupilos.find(p => p.id_estudiante === e.target.value);
                setPupiloSeleccionado(seleccionado || null);
              }}
              style={styles.selectPupilo}
            >
              {pupilos.map(p => (
                <option key={p.id_estudiante} value={p.id_estudiante}>
                  {p.nombre_completo} - {p.curso}
                </option>
              ))}
            </select>
          </div>
        )}
       {/* {pupiloSeleccionado && (
          <p style={styles.subtitulo}>
            Pupilo: <strong>{pupiloSeleccionado.nombre_completo}</strong> | Curso: {pupiloSeleccionado.curso}
            {pupiloSeleccionado.rut && ` | RUT: ${pupiloSeleccionado.rut}`}
          </p>
        )}*/}
      </div>
         {/* Datos del Pupilo */}
      {pupiloSeleccionado && (
        <Card titulo="👤 Datos del Pupilo" descripcion="Información del estudiante" padding="24px" sombra="pequeña">
          <div style={styles.datosGrid}>
            <div style={styles.datoItem}>
              <span style={styles.datoLabel}>Nombre:</span>
              <span style={styles.datoValor}>{pupiloSeleccionado.nombre_completo}</span>
            </div>
            <div style={styles.datoItem}>
              <span style={styles.datoLabel}>RUT:</span>
              <span style={styles.datoValor}>{pupiloSeleccionado.rut || 'No registrado'}</span>
            </div>
            <div style={styles.datoItem}>
              <span style={styles.datoLabel}>Curso:</span>
              <span style={styles.datoValor}>{pupiloSeleccionado.curso}</span>
            </div>
            <div style={styles.datoItem}>
              <span style={styles.datoLabel}>Año ingreso:</span>
              <span style={styles.datoValor}>{pupiloSeleccionado.anno_ingreso}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Card resumen */}
       <Card padding="20px" sombra="normal">
        <div style={styles.resumenCard}>
          <div style={styles.resumenIcono}>📊</div>
          <div style={styles.resumenInfo}>
              <p style={styles.resumenNombre}>Resumen</p>            
             
           {/* <p style={styles.resumenNombre}>{pupiloSeleccionado?.nombre_completo}</p>
            <p style={styles.resumenDetalle}>
              {atrasos} atraso{atrasos !== 1 ? 's' : ''} · {inasistencias} inasistencia{inasistencias !== 1 ? 's' : ''} · {prestamosActivos.length} préstamo{prestamosActivos.length !== 1 ? 's' : ''}
            </p>*/}
          </div>
        </div>
      </Card>

      {/* Lista de indicadores */}
      <div style={styles.listaIndicadores}>
        <div style={styles.indicadorItem}>
          <div style={{ ...styles.indicadorIcono, backgroundColor: '#FEF3C7' }}>⏰</div>
          <div style={styles.indicadorInfo}>
            <p style={styles.indicadorTitulo}>Atrasos</p>
            <p style={styles.indicadorNumero}>{atrasos}</p>
          </div>
          <div style={{ ...styles.indicadorIcono, backgroundColor: '#FEE2E2' }}>📋</div>
          <div style={styles.indicadorInfo}>
            <p style={styles.indicadorTitulo}>Inasistencias</p>
            <p style={styles.indicadorNumero}>{inasistencias}</p>
          </div>
        </div>
       
        <div style={styles.indicadorItem}>
          <div style={{ ...styles.indicadorIcono, backgroundColor: '#DBEAFE' }}>📚</div>
          <div style={styles.indicadorInfo}>
            <p style={styles.indicadorTitulo}>Préstamos de libros</p>
            <p style={styles.indicadorNumero}>
              {prestamosActivos.length} activo{prestamosActivos.length !== 1 ? 's' : ''}
              {prestamosVencidos > 0 && (
                <span style={styles.indicadorVencido}> · {prestamosVencidos} vencido{prestamosVencidos !== 1 ? 's' : ''}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Biblioteca del Pupilo */}
      <Card titulo="📚 Biblioteca del Pupilo" descripcion="Préstamos de libros" padding="24px" sombra="normal">
        {prestamosActivos.length === 0 ? (
          <p style={styles.sinDatos}>No hay préstamos activos.</p>
        ) : (
          <div style={styles.lista}>
            {prestamosActivos.map((p: any, idx: number) => {
              const vencido = new Date(p.due_date) < new Date() && p.status !== 'Devuelto';
              return (
                <div key={idx} style={{
                  ...styles.itemSolicitud,
                  borderLeft: `4px solid ${vencido ? '#F59E0B' : '#10B981'}`,
                }}>
                  <div style={styles.itemHeader}>
                    <div>
                      <p style={styles.itemTitulo}>
                        {p.book_copies?.books?.titulo || 'Libro'}
                      </p>
                      <p style={styles.itemTexto}>
                        Préstamo: {new Date(p.loan_date).toLocaleDateString('es-CL')} | Vence: {new Date(p.due_date).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: vencido ? '#FEF3C7' : '#D1FAE5',
                      color: vencido ? '#92400E' : '#065F46',
                    }}>
                      {vencido ? 'Vencido' : p.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Justificaciones */}
      <Card titulo="📋 Justificaciones" descripcion="Estado de solicitudes" padding="24px" sombra="normal">
        {solicitudes.length === 0 ? (
          <p style={styles.sinDatos}>No hay solicitudes registradas aún.</p>
        ) : (
          <div style={styles.lista}>
            {solicitudes.map((sol, idx) => (
              <div key={idx} style={styles.itemSolicitud}>
                <div style={styles.itemHeader}>
                  <div>
                    <p style={styles.itemTitulo}>
                      {getEmojiTipo(sol.tipo)} {getLabelSimple(sol.tipo)}
                    </p>
                    <p style={styles.itemTexto}>
                      {new Date(sol.fecha).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  <EstadoBadge estado={sol.estado} />
                </div>
                {sol.motivo_descripcion && (
                  <p style={styles.motivo}>{sol.motivo_descripcion}</p>
                )}
                {sol.estado === 'Rechazada' && sol.observaciones && (
                  <div style={styles.razonRechazo}>
                    <p style={styles.razonLabel}>Razón del rechazo:</p>
                    <p style={styles.razonTexto}>{sol.observaciones}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

   

      {/* Calendario */}
      <Card titulo="📅 Calendario Escolar" descripcion="Fechas importantes" padding="24px" sombra="pequeña">
        <p style={styles.infoContacto}>
          📌 El calendario escolar está disponible en la sección de Circulación del sistema.
        </p>
        <p style={styles.infoContacto}>
          📧 Para consultas sobre fechas, contacta al inspector del establecimiento.
        </p>
      </Card>

      {/* Contacto */}
      <Card titulo="¿Necesitas Ayuda?" descripcion="Información de contacto" padding="24px" sombra="pequeña">
        <p style={styles.infoContacto}>
          📧 Para consultas, contacta al inspector del establecimiento
        </p>
        <p style={styles.infoContacto}>
          📞 También puedes comunicarte con la secretaría de la institución
        </p>
      </Card>
    </div>
  );
}

  // ── Mantenimiento ──

const styles: Record<string, React.CSSProperties> = {
  contenedor: {
    padding: '24px',
    backgroundColor: '#F9FAFB',
    minHeight: '100vh',
  },
  encabezado: {
    marginBottom: '24px',
  },
  titulo: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1A3C6B',
    margin: '0 0 8px 0',
  },
  subtitulo: {
    fontSize: '14px',
    color: '#6B7280',
    margin: 0,
  },
  selectorPupilo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  labelPupilo: {
    fontSize: '14px',
    color: '#374151',
    fontWeight: '600',
  },
  selectPupilo: {
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid #D1D5DB',
    fontSize: '14px',
    backgroundColor: '#FFFFFF',
  },
  resumenCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  resumenIcono: {
    fontSize: '40px',
  },
  resumenInfo: {
    flex: 1,
  },
  resumenNombre: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1A3C6B',
    margin: '0 0 4px 0',
  },
  resumenDetalle: {
    fontSize: '14px',
    color: '#6B7280',
    margin: 0,
  },
  listaIndicadores: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
    marginTop: '16px',
  },
  indicadorItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  indicadorIcono: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    flexShrink: 0,
  },
  indicadorInfo: {
    flex: 1,
  },
  indicadorTitulo: {
    fontSize: '13px',
    color: '#6B7280',
    margin: '0 0 2px 0',
    fontWeight: '600',
  },
  indicadorNumero: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1A3C6B',
    margin: 0,
  },
  indicadorVencido: {
    fontSize: '14px',
    color: '#DC2626',
    fontWeight: '600',
  },
  lista: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  itemSolicitud: {
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #E5E7EB',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitulo: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1A3C6B',
    margin: '0 0 4px 0',
  },
  itemTexto: {
    fontSize: '12px',
    color: '#9CA3AF',
    margin: 0,
  },
  motivo: {
    fontSize: '13px',
    color: '#374151',
    margin: '8px 0 0 0',
    fontStyle: 'italic',
  },
  razonRechazo: {
    backgroundColor: '#FEE2E2',
    borderLeft: '3px solid #DC2626',
    padding: '8px 12px',
    marginTop: '8px',
    borderRadius: '4px',
  },
  razonLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#991B1B',
    margin: '0 0 4px 0',
  },
  razonTexto: {
    fontSize: '12px',
    color: '#7F1D1D',
    margin: 0,
  },
  infoContacto: {
    fontSize: '13px',
    color: '#6B7280',
    margin: '0 0 8px 0',
  },
  cargando: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: '16px',
    margin: '40px 0',
  },
  sinDatos: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: '14px',
    padding: '20px',
  },
  badge: {
    padding: '6px 16px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: '600',
  },
  datosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  } as React.CSSProperties,
  datoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  datoLabel: {
    fontSize: '12px',
    color: '#6B7280',
    fontWeight: '600',
  },
  datoValor: {
    fontSize: '14px',
    color: '#1A3C6B',
  },
};
