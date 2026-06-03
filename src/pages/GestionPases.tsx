// ============================================================
// SGJA – Gestión de Pases (Atrasos/Inasistencias) - v2
// src/pages/GestionPases.tsx
// ============================================================

import { useState, useEffect } from 'react';
import { Card } from '../components/Common';
import {
  obtenerEstudiantesDelEstablecimiento,
  crearSolicitud,
  obtenerSolicitudesDelEstablecimiento,
  actualizarSolicitud,
} from '../services/database';
import type { Estudiante, Solicitud } from '../types';
import { EstadoSolicitud, TipoRegistro } from '../types';
import { esAtraso } from '../utils/tipoRegistroHelper';

interface Props {
  idEstablecimiento: string;
  rol: string;
  idUsuarioActual?: string;
}

interface FormPase {
  id_estudiante: string;
  rut: string;
  nombre_estudiante: string;
  curso: string;
  tipo: TipoRegistro;
  fecha: string;
  hora: string;
}

const ITEMS_POR_PAGINA = 10;

export default function GestionPases({ idEstablecimiento, rol, idUsuarioActual }: Props) {
  const [tab, setTab] = useState<'crear' | 'ver'>('crear');
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [cursoSeleccionado, setCursoSeleccionado] = useState('');
  
  const [formData, setFormData] = useState<FormPase>({
    id_estudiante: '',
    rut: '',
    nombre_estudiante: '',
    curso: '',
    tipo: TipoRegistro.ATRASO,
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().slice(0, 5),
  });

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idEstablecimiento]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [estudiantesData, solicitudesData] = await Promise.all([
        obtenerEstudiantesDelEstablecimiento(idEstablecimiento).catch(() => []),
        obtenerSolicitudesDelEstablecimiento(idEstablecimiento).catch(() => []),
      ]);

      setEstudiantes(estudiantesData);
      setSolicitudes(solicitudesData);
    } catch (err) {
      setError('Error al cargar datos');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const handleSelectCurso = (curso: string) => {
    setCursoSeleccionado(curso);
    setFormData({
      ...formData,
      id_estudiante: '',
      rut: '',
      nombre_estudiante: '',
      curso: curso,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.id_estudiante) {
      setError('Debes seleccionar un estudiante');
      return;
    }

    try {
      setGuardando(true);

      const id_solicitud = `sol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const solicitud: Solicitud = {
        id_solicitud,
        id_establecimiento: idEstablecimiento,
        id_estudiante: formData.id_estudiante,
        id_profesor: idUsuarioActual || '',
        tipo: formData.tipo,
        fecha: formData.fecha,
        hora: formData.hora,
        estado: EstadoSolicitud.INJUSTIFICADA,
        motivo_codigo: null,
        motivo_descripcion: 'Ausente',
        observaciones: null,
        respaldo_recibido: false,
        tipo_respaldo: null,
        id_token_qr: null,
        curso: formData.curso,
      };

      await crearSolicitud(solicitud);

      setExito(true);
      setFormData({
        id_estudiante: '',
        rut: '',
        nombre_estudiante: '',
        curso: cursoSeleccionado,
        tipo: TipoRegistro.ATRASO,
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().slice(0, 5),
      });
      await cargarDatos();
      setTimeout(() => setExito(false), 3000);
    } catch (err) {
      setError(`Error al crear pase: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleAnularPase = async (id_solicitud: string, id_profesor: string) => {
    // Solo el profesor que lo creó o ADMIN pueden anularlo
    if (rol !== 'ADMIN' && idUsuarioActual !== id_profesor) {
      setError('Solo puedes anular tus propios pases');
      return;
    }

    if (!confirm('¿Estás seguro de que deseas anular este pase?')) return;

    try {
      await actualizarSolicitud(id_solicitud, { estado: EstadoSolicitud.NO_PRESENTADA });
      setExito(true);
      await cargarDatos();
      setTimeout(() => setExito(false), 3000);
    } catch (err) {
      setError(`Error al anular pase: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  // Cursos únicos ordenados
  const cursosUnicos = [...new Set(estudiantes.map(e => e.curso))].sort();

  // Estudiantes del curso seleccionado
  const estudiantesCurso = cursoSeleccionado
    ? estudiantes.filter(e => e.curso === cursoSeleccionado)
    : [];

  // Solicitudes filtradas (paginar de 10 en 10)
  const solicitudesFiltradas = solicitudes
    .filter(s => {
      // Si es profesor, solo ve sus pases; si es admin, ve todos
      if (rol === 'ADMIN') return true;
      return s.id_profesor === idUsuarioActual;
    })
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const totalPaginas = Math.ceil(solicitudesFiltradas.length / ITEMS_POR_PAGINA);
  const solicitudosPaginadas = solicitudesFiltradas.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA
  );

  if (cargando) {
    return (
      <div style={styles.contenedor}>
        <div style={styles.spinner}>⏳ Cargando…</div>
      </div>
    );
  }

  return (
    <div style={styles.contenedor}>
      {/* Tabs */}
      <div style={styles.tabs}>
        <button type="button" 
          onClick={() => setTab('crear')}
          style={{
            ...styles.tabBtn,
            ...(tab === 'crear' ? styles.tabBtnActivo : {}),
          }}
        >
          ➕ Crear Pase
        </button>
        <button type="button" 
          onClick={() => setTab('ver')}
          style={{
            ...styles.tabBtn,
            ...(tab === 'ver' ? styles.tabBtnActivo : {}),
          }}
        >
          📋 Ver Pases
        </button>
      </div>

      {/* TAB: CREAR PASE */}
      {tab === 'crear' && (
        <Card titulo="Crear Pase" descripcion="Registrar un nuevo pase de atraso o inasistencia">
          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Paso 1: Seleccionar Curso */}
            <div style={styles.paso}>
              <h4 style={styles.numeroPaso}>📚 Paso 1: Selecciona el Curso</h4>
              <div style={styles.grupo}>
                <label style={styles.label}>Curso *</label>
                <select
                  value={cursoSeleccionado}
                  onChange={(e) => handleSelectCurso(e.target.value)}
                  style={styles.select}
                >
                  <option value="">-- Selecciona un curso --</option>
                  {cursosUnicos.map((curso) => (
                    <option key={curso} value={curso}>
                      {curso}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Paso 2: Seleccionar Estudiante */}
            {cursoSeleccionado && (
              <div style={styles.paso}>
                <h4 style={styles.numeroPaso}>👤 Paso 2: Selecciona el Estudiante</h4>
                <div style={styles.grupo}>
                  <label style={styles.label}>Estudiante *</label>
                  <select
                    value={formData.id_estudiante}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      console.log('=== SELECCIÓN DE ESTUDIANTE ===');
                      console.log('Seleccionado ID:', selectedId);
                      console.log('Estudiantes disponibles (full):', JSON.stringify(estudiantesCurso, null, 2));
                      
                      if (selectedId) {
                        const est = estudiantesCurso.find(s => s.id_estudiante === selectedId);
                        console.log('Búsqueda: buscando id_estudiante =', selectedId);
                        console.log('Encontrado:', est);
                        
                        if (est) {
                          const nuevoForm = {
                            ...formData,
                            id_estudiante: est.id_estudiante || '',
                            rut: est.rut || '',
                            nombre_estudiante: est.nombre_completo || '',
                            curso: est.curso || '',
                          };
                          console.log('✓ Actualizando formData:', nuevoForm);
                          setFormData(nuevoForm);
                        } else {
                          console.error('✗ Estudiante NO encontrado con ID:', selectedId);
                          console.log('Comparación de IDs en array:');
                          estudiantesCurso.forEach((s, idx) => {
                            console.log(`  [${idx}] id_estudiante=${s.id_estudiante}, nombre=${s.nombre_completo}`);
                          });
                        }
                      } else {
                        setFormData({
                          ...formData,
                          id_estudiante: '',
                          rut: '',
                          nombre_estudiante: '',
                          curso: cursoSeleccionado,
                        });
                      }
                    }}
                    style={styles.select}
                  >
                    <option value="">-- Selecciona un estudiante --</option>
                    {estudiantesCurso.map((est) => (
                      <option key={est.id_estudiante} value={est.id_estudiante || ''}>
                        {est.nombre_completo} - RUT: {est.rut}
                      </option>
                    ))}
                  </select>
                  {formData.id_estudiante && (
                    <div style={styles.datoestudiante}>
                      <small>RUT: {formData.rut}</small>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Paso 3: Tipo, Fecha, Hora */}
            {formData.id_estudiante && (
              <div style={styles.paso}>
                <h4 style={styles.numeroPaso}>📝 Paso 3: Detalles del Pase</h4>
                <div style={styles.fila3}>
                  <div style={styles.grupo}>
                    <label style={styles.label}>Tipo *</label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoRegistro })}
                      style={styles.select}
                    >
                      <option value={TipoRegistro.ATRASO}>🕐 Atraso</option>
                      <option value={TipoRegistro.INASISTENCIA}>❌ Inasistencia</option>
                    </select>
                  </div>
                  <div style={styles.grupo}>
                    <label style={styles.label}>Fecha *</label>
                    <input
                      type="date"
                      value={formData.fecha}
                      onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                      min="2026-03-01"
                      max={new Date().toISOString().split('T')[0]}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.grupo}>
                    <label style={styles.label}>Hora *</label>
                    <input
                      type="time"
                      value={formData.hora}
                      onChange={(e) => {
                        const hora = e.target.value;
                        if (hora) {
                          const [horas, minutos] = hora.split(':').map(Number);
                          // Solo permitir entre 08:00 y 17:00
                          if (horas >= 8 && horas <= 17) {
                            // Si es las 17, solo permitir 17:00
                            if (horas === 17 && minutos > 0) {
                              return;
                            }
                            setFormData({ ...formData, hora });
                          }
                        }
                      }}
                      min="08:00"
                      max="17:00"
                      style={styles.input}
                    />
                  </div>
                </div>
              </div>
            )}

            {error && <div style={styles.error}>{error}</div>}
            {exito && <div style={styles.exito}>✅ Pase creado exitosamente</div>}

            {formData.id_estudiante && (
              <button
                type="submit"
                disabled={guardando}
                style={{
                  ...styles.botonPrimario,
                  opacity: guardando ? 0.6 : 1,
                }}
              >
                {guardando ? '⏳ Guardando...' : '✓ Crear Pase'}
              </button>
            )}
          </form>
        </Card>
      )}

      {/* TAB: VER PASES */}
      {tab === 'ver' && (
        <Card titulo="Pases Registrados" descripcion={`Todos los pases (${rol === 'ADMIN' ? 'Admin ve todos' : 'Solo tus pases'})`}>
          {solicitudosPaginadas.length === 0 ? (
            <p style={styles.sinDatos}>No hay pases registrados</p>
          ) : (
            <>
              <div style={styles.tabla}>
                <div style={styles.filaEncabezado}>
                  <div style={styles.celdaEncabezado}>Estudiante</div>
                  <div style={styles.celdaEncabezado}>Curso</div>
                  <div style={styles.celdaEncabezado}>Tipo</div>
                  <div style={styles.celdaEncabezado}>Fecha/Hora</div>
                  <div style={styles.celdaEncabezado}>Estado</div>
                  <div style={styles.celdaEncabezado}>Acciones</div>
                </div>

                {solicitudosPaginadas.map((sol) => {
                  const est = estudiantes.find(e => e.id_estudiante === sol.id_estudiante);
                  const puedeanular = rol === 'ADMIN' || sol.id_profesor === idUsuarioActual;
                  
                  return (
                    <div key={sol.id_solicitud} style={styles.filaTabla}>
                      <div style={styles.celda}>
                        <strong>{est?.nombre_completo}</strong>
                        <br />
                        <small>RUT: {est?.rut}</small>
                      </div>
                      <div style={styles.celda}>{est?.curso}</div>
                      <div style={styles.celda}>
                        <span style={{
                          ...styles.badge,
                          ...(esAtraso(sol.tipo) ? { backgroundColor: '#FEF3C7', color: '#92400E' } : { backgroundColor: '#FEE2E2', color: '#991B1B' })
                        }}>
                          {sol.tipo}
                        </span>
                      </div>
                      <div style={styles.celda}>
                        <strong>{sol.fecha}</strong>
                        <br />
                        <small>{sol.hora}</small>
                      </div>
                      <div style={styles.celda}>
                        <span style={{
                          ...styles.badge,
                          ...(sol.estado === EstadoSolicitud.NO_PRESENTADA ? { backgroundColor: '#F3F4F6', color: '#6B7280' } : { backgroundColor: '#DBEAFE', color: '#1E40AF' })
                        }}>
                          {sol.estado}
                        </span>
                      </div>
                      <div style={styles.acciones}>
                        {puedeanular && sol.estado !== EstadoSolicitud.NO_PRESENTADA && (
                          <button type="button" 
                            onClick={() => handleAnularPase(sol.id_solicitud, sol.id_profesor)}
                            style={styles.botonAnular}
                          >
                            ✕ Anular
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Paginador */}
              {totalPaginas > 1 && (
                <div style={styles.paginador}>
                  <button type="button" 
                    onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                    disabled={paginaActual === 1}
                    style={styles.botonPaginador}
                  >
                    ◀ Anterior
                  </button>
                  <span style={styles.paginaInfo}>
                    Página {paginaActual} de {totalPaginas}
                  </span>
                  <button type="button" 
                    onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                    disabled={paginaActual === totalPaginas}
                    style={styles.botonPaginador}
                  >
                    Siguiente ▶
                  </button>
                </div>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  contenedor: {
    padding: '24px',
    backgroundColor: '#F9FAFB',
    minHeight: '100vh',
  },
  spinner: {
    textAlign: 'center',
    fontSize: '16px',
    color: '#6B7280',
    padding: '40px',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
  },
  tabBtn: {
    padding: '10px 16px',
    backgroundColor: '#E5E7EB',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    transition: 'all 0.2s',
  },
  tabBtnActivo: {
    backgroundColor: '#1A3C6B',
    color: '#FFFFFF',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  paso: {
    padding: '16px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
  },
  numeroPaso: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1F2937',
    margin: '0 0 12px 0',
  },
  fila3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '16px',
  },
  grupo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'Arial, sans-serif',
    color: '#374151',
    backgroundColor: '#FFFFFF',
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'Arial, sans-serif',
    color: '#374151',
    backgroundColor: '#FFFFFF',
  },
  datoestudiante: {
    fontSize: '12px',
    color: '#6B7280',
    paddingTop: '4px',
  },
  error: {
    padding: '12px',
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    borderRadius: '6px',
    fontSize: '14px',
  },
  exito: {
    padding: '12px',
    backgroundColor: '#DCFCE7',
    color: '#166534',
    borderRadius: '6px',
    fontSize: '14px',
  },
  botonPrimario: {
    padding: '10px 20px',
    backgroundColor: '#1A3C6B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  sinDatos: {
    textAlign: 'center',
    color: '#6B7280',
    padding: '40px 20px',
  },
  tabla: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    marginBottom: '16px',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  filaEncabezado: {
    display: 'grid',
    gridTemplateColumns: '180px 100px 100px 120px 100px 100px',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#F3F4F6',
    fontWeight: '600',
    fontSize: '13px',
    color: '#1F2937',
    borderBottom: '2px solid #E5E7EB',
  },
  celdaEncabezado: {
    fontSize: '13px',
    fontWeight: '700',
  },
  filaTabla: {
    display: 'grid',
    gridTemplateColumns: '180px 100px 100px 120px 100px 100px',
    gap: '12px',
    padding: '12px',
    borderBottom: '1px solid #E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  celda: {
    fontSize: '13px',
    color: '#374151',
  },
  acciones: {
    display: 'flex',
    gap: '8px',
  },
  botonAnular: {
    padding: '6px 12px',
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    border: '1px solid #FECACA',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
  },
  paginador: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #E5E7EB',
  },
  botonPaginador: {
    padding: '8px 12px',
    backgroundColor: '#E5E7EB',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  paginaInfo: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
  },
};
