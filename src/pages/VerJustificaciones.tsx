import { useState, useEffect, useRef } from 'react';
import {
  obtenerEstudiantesDelEstablecimiento,
  obtenerCursosDelEstablecimiento,
  obtenerMotivosDelEstablecimiento,
  justificarSolicitud,
  escucharSolicitudesJustificadas,
  escucharSolicitudesInjustificadas,
} from '../services/database';
import type { Estudiante, Solicitud, MotivoJustificacion } from '../types';
import { EstadoSolicitud } from '../types';

interface Props {
  idEstablecimiento: string;
  rol?: string;
  idUsuario?: string;
}

export default function VerJustificaciones({ idEstablecimiento }: Props) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [cursos, setCursos] = useState<string[]>([]);
  const [motivos, setMotivos] = useState<MotivoJustificacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const [busquedaRut, setBusquedaRut] = useState('');
  const [pestanaActiva, setPestanaActiva] = useState<'justificados' | 'injustificados'>('justificados');
  const [filtroFecha, setFiltroFecha] = useState<string>('');
  const [itemsPorPagina, setItemsPorPagina] = useState(10);
  const [filtrosCurso, setFiltrosCurso] = useState<string>('');
  
  // Estados para el modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<Solicitud | null>(null);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<string>('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [tieneDocumento, setTieneDocumento] = useState(false);

  const selectMotivoRef = useRef<HTMLSelectElement>(null);

  // ── Cargar datos iniciales y escuchar cambios en tiempo real ──
  useEffect(() => {
    let unsubscribeJustificadas: () => void = () => {};
    let unsubscribeInjustificadas: () => void = () => {};

    const cargarDatosIniciales = async () => {
      try {
        setCargando(true);
        
        // Cargar datos estáticos
        const [estudiantesData, cursosData, motivosData] = await Promise.all([
          obtenerEstudiantesDelEstablecimiento(idEstablecimiento),
          obtenerCursosDelEstablecimiento(idEstablecimiento),
          obtenerMotivosDelEstablecimiento(idEstablecimiento),
        ]);

        setEstudiantes(estudiantesData);
        setCursos(cursosData);
        const motivosUnicos = Array.from(
          new Map(motivosData.map((m: MotivoJustificacion) => [m.id_motivo, m])).values()
        );
        const motivosOrdenados = (motivosUnicos as MotivoJustificacion[]).sort((a, b) => 
          a.descripcion.localeCompare(b.descripcion, 'es', { sensitivity: 'base' })
        );
        setMotivos(motivosOrdenados);

        // Configurar listeners para cambios en tiempo real
        unsubscribeJustificadas = escucharSolicitudesJustificadas(
          idEstablecimiento,
          (justificadasData) => {
            setSolicitudes((prevSolicitudes) => {
              // Combinar justificadas + injustificadas existentes
              const injustificadas = prevSolicitudes.filter(s => s.estado === EstadoSolicitud.INJUSTIFICADA);
              return [...justificadasData, ...injustificadas];
            });
          }
        );

        unsubscribeInjustificadas = escucharSolicitudesInjustificadas(
          idEstablecimiento,
          (injustificadasData) => {
            setSolicitudes((prevSolicitudes) => {
              // Combinar justificadas + injustificadas existentes
              const justificadas = prevSolicitudes.filter(s => s.estado === EstadoSolicitud.JUSTIFICADA);
              return [...justificadas, ...injustificadasData];
            });
          }
        );

        setCargando(false);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setCargando(false);
      }
    };

    cargarDatosIniciales();

    // Limpiar listeners al desmontar componente
    return () => {
      unsubscribeJustificadas();
      unsubscribeInjustificadas();
    };
  }, [idEstablecimiento]);

  // Filtrar solicitudes según la pestaña activa
  const solicitudesFiltradas = solicitudes.filter(s => {
    if (pestanaActiva === 'justificados') {
      return s.estado === EstadoSolicitud.JUSTIFICADA;
    } else {
      // Injustificados
      return s.estado === EstadoSolicitud.INJUSTIFICADA;
    }
  });

  // Filtrar por búsqueda y otros criterios
  const solicitudesProcessadas = solicitudesFiltradas
    .filter(s => {
      const estudiante = estudiantes.find(e => e.id_estudiante === s.id_estudiante);
      if (busquedaRut && estudiante?.rut && !estudiante.rut.includes(busquedaRut)) {
        return false;
      }
      if (filtroFecha && s.fecha !== filtroFecha) {
        return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  // Paginación
  const totalPaginas = Math.ceil(solicitudesProcessadas.length / itemsPorPagina);
  const inicio = (paginaActual - 1) * itemsPorPagina;
  const fin = inicio + itemsPorPagina;
  const solicitudesPaginadas = solicitudesProcessadas.slice(inicio, fin);

  // Funciones para modal
  const abrirModal = (solicitud: Solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setModalAbierto(true);
    setMotivoSeleccionado('');
    setError(null);
    setTimeout(() => {
      selectMotivoRef.current?.focus();
    }, 0);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setSolicitudSeleccionada(null);
    setMotivoSeleccionado('');
    setTieneDocumento(false);
    setError(null);
  };

  const handleJustificar = async () => {
    if (!solicitudSeleccionada) return;
    if (!motivoSeleccionado && !tieneDocumento) {
      setError('Debes seleccionar un motivo o indicar que tiene documento');
      return;
    }

    try {
      setGuardando(true);
      let codigoMotivo = '';
      let descripcionMotivo = '';

      if (tieneDocumento) {
        // Documento/certificado médico
        codigoMotivo = 'DOC';
        descripcionMotivo = 'Documento/Certificado presentado';
      } else {
        // Motivo regular
        const motivo = motivos.find(m => m.id_motivo === motivoSeleccionado);
        codigoMotivo = motivo?.codigo || '';
        descripcionMotivo = motivo?.descripcion || '';
      }

      await justificarSolicitud(
        solicitudSeleccionada.id_solicitud,
        solicitudSeleccionada,
        codigoMotivo,
        descripcionMotivo
      );
      setExito(true);
      cerrarModal();
      // Los datos se actualizan automáticamente mediante listeners en tiempo real
      setTimeout(() => setExito(false), 3000);
    } catch (err) {
      setError(`Error al justificar: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setGuardando(false);
    }
  };

  const styles = {
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '2rem',
      backgroundColor: '#f9fafb',
      minHeight: '100vh',
    },
    header: {
      marginBottom: '2rem',
    },
    title: {
      fontSize: '2rem',
      fontWeight: 700,
      color: '#111827',
      marginBottom: '0.5rem',
    },
    subtitle: {
      fontSize: '0.875rem',
      color: '#6b7280',
    },
    card: {
      background: '#fff',
      borderRadius: '0.75rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '1.5rem',
      marginBottom: '2rem',
    },
    tabContainer: {
      display: 'flex',
      gap: '0.5rem',
      borderBottom: '1px solid #e5e7eb',
      marginBottom: '1.5rem',
    },
    tab: {
      padding: '0.75rem 1.5rem',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: '0.875rem',
      color: '#6b7280',
      borderBottom: '2px solid transparent',
      transition: 'all 0.2s ease',
    },
    tabActive: {
      color: '#2563eb',
      borderBottomColor: '#2563eb',
    },
    filtrosContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '1.5rem',
    },
    input: {
      padding: '0.625rem 1rem',
      border: '1px solid #d1d5db',
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      width: '100%',
      boxSizing: 'border-box' as const,
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      fontSize: '0.875rem',
    },
    th: {
      padding: '0.75rem',
      textAlign: 'left' as const,
      background: '#f3f4f6',
      fontWeight: 600,
      color: '#374151',
      borderBottom: '1px solid #d1d5db',
    },
    td: {
      padding: '0.75rem',
      borderBottom: '1px solid #e5e7eb',
    },
    badge: {
      display: 'inline-block',
      padding: '0.25rem 0.75rem',
      borderRadius: '0.375rem',
      fontSize: '0.75rem',
      fontWeight: 600,
      whiteSpace: 'nowrap' as const,
    },
    badgeJustificado: {
      backgroundColor: '#dcfce7',
      color: '#15803d',
    },
    badgeInjustificado: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
    },
    badgePendiente: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
    },
    emptyState: {
      textAlign: 'center' as const,
      padding: '2rem',
      color: '#6b7280',
    },
    paginacion: {
      display: 'flex',
      gap: '0.5rem',
      justifyContent: 'center',
      marginTop: '1.5rem',
      alignItems: 'center',
    },
    botonPaginacion: {
      padding: '0.5rem 0.75rem',
      border: '1px solid #d1d5db',
      background: '#fff',
      borderRadius: '0.375rem',
      cursor: 'pointer',
      fontSize: '0.875rem',
    },
    modalOverlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: modalAbierto ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: '#fff',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      maxWidth: '500px',
      width: '90%',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    },
    modalTitle: {
      fontSize: '1.25rem',
      fontWeight: 700,
      color: '#111827',
      marginBottom: '1rem',
    },
    modalInput: {
      width: '100%',
      padding: '0.625rem 1rem',
      border: '1px solid #d1d5db',
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      marginBottom: '1rem',
      boxSizing: 'border-box' as const,
    },
    modalButtons: {
      display: 'flex',
      gap: '0.75rem',
      justifyContent: 'flex-end',
    },
    botonModal: {
      padding: '0.625rem 1rem',
      borderRadius: '0.5rem',
      border: 'none',
      fontWeight: 600,
      cursor: 'pointer',
      fontSize: '0.875rem',
    },
    botonModalPrimary: {
      backgroundColor: '#2563eb',
      color: '#fff',
    },
    botonModalSecondary: {
      backgroundColor: '#e5e7eb',
      color: '#374151',
    },
    botonJustificar: {
      padding: '0.5rem 0.75rem',
      backgroundColor: '#10b981',
      color: '#fff',
      border: 'none',
      borderRadius: '0.375rem',
      cursor: 'pointer',
      fontSize: '0.75rem',
      fontWeight: 600,
    },
  };

  if (cargando) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <p style={{ fontSize: '1.125rem', color: '#6b7280', fontWeight: 600 }}>⏳ Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Encabezado */}
      <div style={styles.header}>
        <h1 style={styles.title}>📋 Ver Justificaciones</h1>
        <p style={styles.subtitle}>Consulta todas las solicitudes justificadas, injustificadas y pendientes</p>
      </div>

      <div style={styles.card}>
        {/* Pestañas */}
        <div style={styles.tabContainer}>
          {(['justificados', 'injustificados'] as const).map((tab) => {
            const labels = {
              justificados: `✓ Justificados (${solicitudes.filter(s => s.estado === EstadoSolicitud.JUSTIFICADA).length})`,
              injustificados: `✕ Injustificados (${solicitudes.filter(s => s.estado === EstadoSolicitud.INJUSTIFICADA).length})`,
            };
            return (
              <button type="button" 
                key={tab}
                onClick={() => {
                  setPestanaActiva(tab);
                  setPaginaActual(1);
                }}
                style={{
                  ...styles.tab,
                  ...(pestanaActiva === tab ? styles.tabActive : {}),
                }}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Filtros */}
        <div style={styles.filtrosContainer}>
          <input
            type="text"
            placeholder="🔍 Buscar por RUT"
            value={busquedaRut}
            onChange={(e) => {
              setBusquedaRut(e.target.value);
              setPaginaActual(1);
            }}
            style={styles.input}
          />
          <select
            value={filtrosCurso}
            onChange={(e) => {
              setFiltrosCurso(e.target.value);
              setPaginaActual(1);
            }}
            style={styles.input}
          >
            <option value="">📚 Todos los cursos</option>
            {cursos.map((curso) => (
              <option key={curso} value={curso}>
                {curso}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => {
              setFiltroFecha(e.target.value);
              setPaginaActual(1);
            }}
            min="2026-03-01"
            max={new Date().toISOString().split('T')[0]}
            style={styles.input}
          />
          <select
            value={itemsPorPagina}
            onChange={(e) => setItemsPorPagina(Number(e.target.value))}
            style={styles.input}
          >
            <option value={5}>5 por página</option>
            <option value={10}>10 por página</option>
            <option value={30}>30 por página</option>
          </select>
        </div>

        {/* Tabla */}
        {solicitudesPaginadas.length === 0 ? (
          <div style={styles.emptyState}>
            <p>📭 No hay solicitudes para mostrar</p>
          </div>
        ) : (
          <>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>RUT</th>
                  <th style={styles.th}>Estudiante</th>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Hora</th>
                  <th style={styles.th}>Tipo</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {solicitudesPaginadas.map((solicitud) => {
                  const estudiante = estudiantes.find(e => e.id_estudiante === solicitud.id_estudiante);
                  let estadoBadge = styles.badgeInjustificado;
                  let etiquetaEstado = 'Injustificado';

                  if (solicitud.estado === EstadoSolicitud.JUSTIFICADA) {
                    estadoBadge = styles.badgeJustificado;
                    etiquetaEstado = 'Justificado';
                  }

                  return (
                    <tr key={solicitud.id_solicitud} style={{ transition: 'background-color 0.2s' }}>
                      <td style={styles.td}>{estudiante?.rut || '-'}</td>
                      <td style={styles.td}>{estudiante?.nombre_completo || '-'}</td>
                      <td style={styles.td}>{solicitud.fecha}</td>
                      <td style={styles.td}>{solicitud.hora}</td>
                      <td style={styles.td}>{solicitud.tipo}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...estadoBadge }}>
                          {etiquetaEstado}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {solicitud.estado === EstadoSolicitud.INJUSTIFICADA && (
                          <button type="button" 
                            onClick={() => abrirModal(solicitud)}
                            style={styles.botonJustificar}
                          >
                            ✓ Justificar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div style={styles.paginacion}>
                <button type="button" 
                  style={styles.botonPaginacion}
                  onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                  disabled={paginaActual === 1}
                >
                  ← Anterior
                </button>
                <span style={{ color: '#6b7280' }}>
                  Página {paginaActual} de {totalPaginas}
                </span>
                <button type="button" 
                  style={styles.botonPaginacion}
                  onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                  disabled={paginaActual === totalPaginas}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de justificación */}
      {modalAbierto && solicitudSeleccionada && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>✍️ Justificar Registro</h2>
            
            {/* Estudiante info */}
            <div style={{
              background: '#f3f4f6',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
            }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>Estudiante: </span>
                {estudiantes.find(e => e.id_estudiante === solicitudSeleccionada.id_estudiante)?.nombre_completo}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>Fecha: </span>
                {solicitudSeleccionada.fecha} a las {solicitudSeleccionada.hora}
              </div>
              <div>
                <span style={{ fontWeight: '600', color: '#374151' }}>Tipo: </span>
                {solicitudSeleccionada.tipo}
              </div>
            </div>

            {exito && (
              <div style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                ✓ Solicitud justificada correctamente
              </div>
            )}

            {error && (
              <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                ⚠ {error}
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
                Motivo de Justificación *
              </label>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                Digita el número del motivo (1-{motivos.length}) o selecciona de la lista:
              </p>
              <select
                ref={selectMotivoRef}
                value={motivoSeleccionado}
                onChange={(e) => setMotivoSeleccionado(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                <option value="">-- Selecciona un motivo --</option>
                {motivos.map((m, index) => (
                  <option key={m.id_motivo} value={m.id_motivo}>
                    {index + 1}. {m.descripcion}
                  </option>
                ))}
              </select>
              
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={tieneDocumento}
                    onChange={(e) => {
                      setTieneDocumento(e.target.checked);
                      if (e.target.checked) setMotivoSeleccionado('');
                    }}
                    style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>
                    📄 Tiene documento/certificado médico
                  </span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" 
                onClick={cerrarModal}
                disabled={guardando}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  color: '#374151',
                  fontWeight: '600',
                  cursor: 'pointer',
                  opacity: guardando ? 0.6 : 1,
                }}
              >
                Cancelar
              </button>
              <button type="button" 
                onClick={handleJustificar}
                disabled={guardando || !motivoSeleccionado}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#16a34a',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  opacity: guardando || !motivoSeleccionado ? 0.6 : 1,
                }}
              >
                {guardando ? '⏳ Guardando...' : '✓ Justificar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
