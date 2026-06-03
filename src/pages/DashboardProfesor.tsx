// ============================================================
// SGJA – Dashboard Profesor
// src/pages/DashboardProfesor.tsx
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  obtenerEstudiantesPorCurso,
  obtenerSolicitudesDelEstablecimiento,
  crearSolicitud,
  obtenerUsuario,
  obtenerBloquesHorarios,
  guardarRegistroBloqueProfesor,
  obtenerCursosDelEstablecimiento,
  eliminarSolicitudPorId,
} from '../services/database';
import type { Estudiante, Solicitud, BloqueHorario } from '../types';
import { getEmojiTipo, getLabelSimple } from '../utils/tipoRegistroHelper';
import { EstadoSolicitud, TipoRegistro } from '../types';

interface Props {
  idEstablecimiento: string;
  idProfesor?: string;
}

type Vista = 'inicio' | 'historial';

interface RegistroEstudiante {
  id_estudiante: string;
  tipo: TipoRegistro;
  estado: EstadoSolicitud;
  fecha: string;
}

interface EstadoEstudiante {
  estado: 'PRESENTE' | 'AUSENTE';
  bloqueado: boolean;
  justificadoPor?: string;
  tipoJustificacion?: string;
  rolInspector?: string;
}

export default function DashboardProfesor({ idEstablecimiento, idProfesor }: Props) {
  const [vista, setVista] = useState<Vista>('inicio');
  const [esMobil, setEsMobil] = useState(window.innerWidth < 768);

  // ── Estados de Bloques ──
  const [bloques, setBloques] = useState<BloqueHorario[]>([]);
  const [bloqueSeleccionado, setBloqueSeleccionado] = useState<string>('');
  const [cargandoBloques, setCargandoBloques] = useState(false);

  // ── Estados de Inicio ──
  const [estudiantesCurso, setEstudiantesCurso] = useState<Estudiante[]>([]);
  const [cursos, setCursos] = useState<string[]>([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<string>('1A');
  const [cargando, setCargando] = useState(true);
  const [cargandoCursos, setCargandoCursos] = useState(false);
  const [registros, setRegistros] = useState<Record<string, RegistroEstudiante>>({});
  const [estadosEstudiantes, setEstadosEstudiantes] = useState<Record<string, EstadoEstudiante>>({});
  const [error, setError] = useState<string | null>(null);

  // ── Modal de Bloques ──
  const [modalBloques, setModalBloques] = useState(false);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<string | null>(null);
  const [bloquesConsecutivos, setBloquesConsecutivos] = useState<typeof bloques>([]);
  const [bloquesSeleccionados, setBloquesSeleccionados] = useState<Set<string>>(new Set());

  // ── Modal de Confirmación Curso-Bloque ──
  const [modalConfirmacionCurso, setModalConfirmacionCurso] = useState(false);
  const [cursoParaConfirmar, setCursoParaConfirmar] = useState<string | null>(null);

  // ── Modal de Confirmación de Cambio a PRESENTE ──
  const [modalConfirmacionPresente, setModalConfirmacionPresente] = useState(false);
  const [estudianteParaPresente, setEstudianteParaPresente] = useState<string | null>(null);

  // ── Estados de Historial ──
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  // ── Filtros de Historial ──
  const [busquedaRUT, setBusquedaRUT] = useState('');
  const [fechaFiltro, setFechaFiltro] = useState(
    new Date().toISOString().split('T')[0] // Fecha de hoy por defecto
  );
  const [cursoFiltro, setCursoFiltro] = useState<string>('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('');

  // ── Detectar tamaño de pantalla ──
  useEffect(() => {
    const handleResize = () => setEsMobil(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Cargar bloques horarios ──
  useEffect(() => {
    const cargarBloques = async () => {
      try {
        setCargandoBloques(true);
        const data = await obtenerBloquesHorarios(idEstablecimiento);
        const bloquesOrdenados = (data || []).sort((a, b) => a.orden - b.orden);
        setBloques(bloquesOrdenados);

        // Establecer el primer bloque como predeterminado (sin detectar hora actual)
        if (bloquesOrdenados.length > 0) {
          setBloqueSeleccionado(bloquesOrdenados[0].id_bloque);
        }
      } catch (err) {
        console.error('Error al cargar bloques:', err);
      } finally {
        setCargandoBloques(false);
      }
    };

    cargarBloques();
  }, [idEstablecimiento]);

  // ── Cargar cursos disponibles ──
  useEffect(() => {
    const cargarCursos = async () => {
      try {
        setCargandoCursos(true);
        console.log('🔄 Cargando cursos para establecimiento:', idEstablecimiento);
        const cursosObtenidos = await obtenerCursosDelEstablecimiento(idEstablecimiento);
        const cursosSorted = (cursosObtenidos || []).sort();
        console.log('📚 Cursos cargados:', cursosSorted);
        setCursos(cursosSorted);
        // No sobrescribir el curso seleccionado, mantener el valor por defecto (1A)
      } catch (err) {
        console.error('Error al cargar cursos:', err);
      } finally {
        setCargandoCursos(false);
      }
    };

    cargarCursos();
  }, [idEstablecimiento]);

  // ── Cargar estudiantes cuando cambia el curso ──
  useEffect(() => {
    if (!cursoSeleccionado) {
      setEstudiantesCurso([]);
      return;
    }
    
    const cargarEstudiantesDelCurso = async () => {
      try {
        setCargando(true);
        console.log('🔄 Cargando estudiantes para curso:', cursoSeleccionado, 'establecimiento:', idEstablecimiento);
        const data = await obtenerEstudiantesPorCurso(idEstablecimiento, cursoSeleccionado);
        console.log('📚 Estudiantes cargados para curso:', cursoSeleccionado, data?.length || 0, 'estudiantes', data);
        setEstudiantesCurso(data || []);
      } catch (err) {
        console.error('Error al cargar estudiantes:', err);
      } finally {
        setCargando(false);
      }
    };

    cargarEstudiantesDelCurso();
  }, [cursoSeleccionado, idEstablecimiento]);

  // ── Refs para acceder a valores sin causar recreación ──
  const estudiantesCursoRef = useRef<Estudiante[]>([]);
  const cursoSeleccionadoRef = useRef<string>('1A');
  const bloqueSeleccionadoRef = useRef<string>('');

  // Actualizar refs cuando cambien
  useEffect(() => {
    estudiantesCursoRef.current = estudiantesCurso;
  }, [estudiantesCurso]);

  useEffect(() => {
    cursoSeleccionadoRef.current = cursoSeleccionado;
  }, [cursoSeleccionado]);

  useEffect(() => {
    bloqueSeleccionadoRef.current = bloqueSeleccionado;
  }, [bloqueSeleccionado]);

  // ── Cargar historial ──
  const cargarHistorial = useCallback(async () => {
    try {
      setCargandoHistorial(true);
      const data = await obtenerSolicitudesDelEstablecimiento(idEstablecimiento);
      setSolicitudes(data || []);

      const fechaHoy = new Date().toISOString().split('T')[0];
      const nuevosRegistros: Record<string, RegistroEstudiante> = {};
      const nuevoEstados: Record<string, EstadoEstudiante> = {};
      
      // Inicializar todos los estudiantes del curso actual como PRESENTES
      estudiantesCursoRef.current.forEach((est) => {
        nuevoEstados[est.id_estudiante] = {
          estado: 'PRESENTE',
          bloqueado: false,
        };
      });

      // Procesar SOLO solicitudes de HOY que pertenezcan al curso actual Y al bloque actual
      console.log('📅 Procesando solicitudes para curso:', cursoSeleccionadoRef.current, 'bloque:', bloqueSeleccionadoRef.current, 'fecha:', fechaHoy);
      const solicitudesDeHoy = data.filter(sol => {
        // Filtrar por fecha de hoy Y que el estudiante esté en el curso actual Y que sea del bloque actual
        const estudianteEnCurso = estudiantesCursoRef.current.some(
          est => est.id_estudiante === sol.id_estudiante
        );
        return sol.fecha === fechaHoy && estudianteEnCurso && sol.id_bloque === bloqueSeleccionadoRef.current;
      });
      console.log('📊 Total solicitudes de hoy para curso', cursoSeleccionadoRef.current + ':', solicitudesDeHoy.length);

      for (const sol of solicitudesDeHoy) {
        const key = sol.id_estudiante;
        
        console.log(`  → ${key}: ${sol.tipo} (${sol.estado})`);

        // Actualizar registros
        if (!nuevosRegistros[key] || nuevosRegistros[key].estado !== EstadoSolicitud.JUSTIFICADA) {
          nuevosRegistros[key] = {
            id_estudiante: sol.id_estudiante,
            tipo: sol.tipo,
            estado: sol.estado,
            fecha: sol.fecha,
          };
        }

        // Actualizar estados del switch
        const estaJustificada = sol.estado === EstadoSolicitud.JUSTIFICADA;
        const esInjustificada = sol.estado === EstadoSolicitud.INJUSTIFICADA;

        // Si hay CUALQUIER solicitud (justificada o no) → AUSENTE
        if (estaJustificada || esInjustificada) {
          // Si justificada, obtener nombre y rol del inspector
          let nombreInspector = sol.id_inspector_justificador || 'Inspectoría';
          let rolInspector = '';
          
          if (estaJustificada && sol.id_inspector_justificador) {
            try {
              const usuario = await obtenerUsuario(sol.id_inspector_justificador);
              nombreInspector = usuario?.nombre_completo || sol.id_inspector_justificador;
              rolInspector = usuario?.rol || '';
            } catch (err) {
              console.error('Error al obtener usuario:', err);
            }
          }

          nuevoEstados[key] = {
            estado: 'AUSENTE',
            bloqueado: estaJustificada,
            justificadoPor: estaJustificada ? nombreInspector : undefined,
            tipoJustificacion: estaJustificada ? sol.tipo : undefined,
            rolInspector: estaJustificada ? rolInspector : undefined,
          };
        }
      }
      
      console.log('✅ Estados actualizados:', Object.keys(nuevoEstados).length);
      setRegistros(nuevosRegistros);
      setEstadosEstudiantes(nuevoEstados);
    } catch (err) {
      console.error('Error al cargar historial:', err);
    } finally {
      setCargandoHistorial(false);
    }
  }, [idEstablecimiento]);

  // ── Ref para cargar historial cuando cambia curso/bloque ──
  const cargarHistorialRef = useRef(cargarHistorial);

  // Actualizar ref cuando cargarHistorial cambia
  useEffect(() => {
    cargarHistorialRef.current = cargarHistorial;
  }, [cargarHistorial]);

  useEffect(() => {
    if (vista === 'inicio') {
      // Cargar una sola vez al entrar a la vista
      cargarHistorialRef.current();
      
      // NO usar intervalo automático - el profesor carga manualmente según necesite
      // El datos se actualizan cuando cambia el bloque o el curso
    }
  }, [vista]);

  // ── Recargar cuando cambia el bloque seleccionado ──
  useEffect(() => {
    if (bloqueSeleccionado && vista === 'inicio') {
      cargarHistorialRef.current();
    }
  }, [bloqueSeleccionado, vista]);

  // ── Limpiar y recargar cuando cambia el curso ──
  useEffect(() => {
    if (cursoSeleccionado && vista === 'inicio') {
      console.log('🔄 Curso cambió a:', cursoSeleccionado);
      // Limpiar estados del curso anterior
      setRegistros({});
      setEstadosEstudiantes({});
    }
  }, [cursoSeleccionado, vista]);

  // ── Recargar cuando se cargan los nuevos estudiantes (después de cambiar curso) ──
  useEffect(() => {
    if (estudiantesCurso.length > 0 && vista === 'inicio' && cursoSeleccionado) {
      console.log('📚 Estudiantes cargados, recargando lista para curso:', cursoSeleccionado);
      cargarHistorialRef.current();
    }
  }, [estudiantesCurso, vista, cursoSeleccionado]);

  // ── Manejar selección de bloque y registrar hora ──
  const handleSeleccionarBloque = async (idBloqueNuevo: string) => {
    const bloqueNuevo = bloques.find((b) => b.id_bloque === idBloqueNuevo);
    
    // Si es un cambio de bloque (no la primera vez)
    if (bloqueSeleccionado && bloqueSeleccionado !== idBloqueNuevo) {
      // Limpiar lista de estudiantes al cambiar de bloque SOLO si hay registros
      if (Object.keys(registros).length > 0) {
        setRegistros({});
        setEstadosEstudiantes({});
      }
    }
    
    setBloqueSeleccionado(idBloqueNuevo);
    
    // Registrar siempre al seleccionar un bloque
    if (bloqueNuevo && idProfesor) {
      // Usar la hora inicial del bloque
      const horaARegistrar = bloqueNuevo.hora_inicio;
      
      try {
        await guardarRegistroBloqueProfesor(
          idProfesor,
          idEstablecimiento,
          idBloqueNuevo,
          bloqueNuevo.numero_bloque,
          bloqueNuevo.nombre_bloque,
          horaARegistrar,
          bloqueNuevo.hora_inicio,
          bloqueNuevo.hora_fin,
          cursoSeleccionado
        );
      } catch (err) {
        console.error('Error al guardar registro de bloque:', err);
      }
    }
  };

  // ── Manejador del Switch Ausente/Presente ──
  const getRowStyle = (idEstudiante: string): React.CSSProperties => {
    const registro = registros[idEstudiante];
    if (!registro) return {};

    if (registro.estado === EstadoSolicitud.JUSTIFICADA) {
      return {
        background: '#DCFCE7',
        borderLeft: '4px solid #16A34A',
      };
    }
    if (registro.estado === EstadoSolicitud.INJUSTIFICADA) {
      if (registro.tipo === TipoRegistro.ATRASO) {
        return {
          background: '#FED7AA',
          borderLeft: '4px solid #F97316',
        };
      }
      if (registro.tipo === TipoRegistro.INASISTENCIA) {
        return {
          background: '#FECACA',
          borderLeft: '4px solid #DC2626',
        };
      }
    }
    return {};
  };

  const getEstadoLabel = (idEstudiante: string) => {
    const registro = registros[idEstudiante];
    if (!registro) return '—';
    return registro.estado === EstadoSolicitud.JUSTIFICADA
      ? '✅ Justificado'
      : '⏳ Injustificado';
  };

  // ── Obtener bloques consecutivos del profesor ──
  const obtenerBloquesConsecutivosProfesor = (): typeof bloques => {
    if (!bloqueSeleccionado || bloques.length === 0) return [];

    const bloqueActual = bloques.find((b) => b.id_bloque === bloqueSeleccionado);
    if (!bloqueActual) return [];

    // Obtener el orden del bloque actual
    const ordenActual = bloqueActual.orden;

    // Obtener bloques que NO sean recreos y que sean >= al orden actual
    const consecutivos = bloques.filter((b) => {
      const esRecreо = b.nombre_bloque.toLowerCase().includes('recre');
      return !esRecreо && b.orden >= ordenActual;
    });

    // Ordenar por orden
    return consecutivos.sort((a, b) => a.orden - b.orden);
  };

  // ── Abrir modal de bloques ──
  const abrirModalBloques = (idEstudiante: string) => {
    const bloquesConsec = obtenerBloquesConsecutivosProfesor();
    setEstudianteSeleccionado(idEstudiante);
    setBloquesConsecutivos(bloquesConsec);
    
    // Obtener los bloques ya registrados para este estudiante (si existen)
    const fechaHoy = new Date().toISOString().split('T')[0];
    const solicitudesDelEstudiante = solicitudes.filter(
      (sol) => sol.id_estudiante === idEstudiante && sol.fecha === fechaHoy
    );
    
    // Si hay solicitudes, seleccionar todos los bloques registrados
    if (solicitudesDelEstudiante.length > 0) {
      const bloquesRegistrados = new Set(
        solicitudesDelEstudiante.map((sol) => sol.id_bloque).filter((id) => id !== undefined) as string[]
      );
      setBloquesSeleccionados(bloquesRegistrados);
    } else {
      // Si no hay solicitudes, seleccionar solo el bloque actual
      setBloquesSeleccionados(new Set([bloqueSeleccionado]));
    }
    
    setModalBloques(true);
  };

  // ── Registrar ausencia en bloques seleccionados ──
  const registrarAusenciaEnBloques = async () => {
    if (!estudianteSeleccionado || !idProfesor) return;

    try {
      const ahora = new Date();
      const fecha = ahora.toISOString().split('T')[0];
      const hora = ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

      // Obtener bloques que ya tenía registrados
      const solicitudesActuales = solicitudes.filter(
        (sol) => sol.id_estudiante === estudianteSeleccionado && sol.fecha === fecha
      );
      const bloquesRegistrados = new Set(
        solicitudesActuales.map((sol) => sol.id_bloque).filter((id) => id !== undefined) as string[]
      );

      // Encontrar bloques a eliminar (estaban registrados pero ahora están deseleccionados)
      const bloquesAEliminar = Array.from(bloquesRegistrados).filter(
        (bloqueId) => !bloquesSeleccionados.has(bloqueId)
      );

      // Encontrar bloques a crear (están seleccionados pero no estaban registrados)
      const bloquesACrear = Array.from(bloquesSeleccionados).filter(
        (bloqueId) => !bloquesRegistrados.has(bloqueId)
      );

      // Eliminar solicitudes de bloques deseleccionados
      await Promise.all(bloquesAEliminar.map(async (idBloqueEliminar) => {
        const solicitudAEliminar = solicitudesActuales.find((sol) => sol.id_bloque === idBloqueEliminar);
        if (solicitudAEliminar) {
          await eliminarSolicitudPorId(solicitudAEliminar.id_solicitud);
        }
      }));

      // Crear solicitudes para bloques nuevamente seleccionados
      const ts = Date.now();
      await Promise.all(bloquesACrear.map((idBloque, i) =>
        crearSolicitud({
          id_solicitud: `inasistencia_${estudianteSeleccionado}_${idBloque}_${ts}_${i}`,
          id_establecimiento: idEstablecimiento,
          id_estudiante: estudianteSeleccionado,
          id_profesor: idProfesor,
          tipo: TipoRegistro.INASISTENCIA,
          fecha,
          hora,
          estado: EstadoSolicitud.INJUSTIFICADA,
          motivo_codigo: null,
          motivo_descripcion: null,
          observaciones: null,
          respaldo_recibido: false,
          tipo_respaldo: null,
          id_token_qr: null,
          curso: cursoSeleccionado,
          id_bloque: idBloque,
          bloques_afectados: bloquesSeleccionados.size,
        })
      ));

      // Si no hay bloques seleccionados después de los cambios, cambiar a PRESENTE
      if (bloquesSeleccionados.size === 0) {
        // Eliminar todas las solicitudes del estudiante para hoy
        await Promise.all(solicitudesActuales.map(solicitud => eliminarSolicitudPorId(solicitud.id_solicitud)));

        setEstadosEstudiantes({
          ...estadosEstudiantes,
          [estudianteSeleccionado]: {
            estado: 'PRESENTE',
            bloqueado: false,
          },
        });

        // Limpiar registros
        const registrosActualizados = { ...registros };
        delete registrosActualizados[estudianteSeleccionado];
        setRegistros(registrosActualizados);
      } else {
        // Actualizar estado a AUSENTE si hay bloques seleccionados
        setRegistros({
          ...registros,
          [estudianteSeleccionado]: {
            id_estudiante: estudianteSeleccionado,
            tipo: TipoRegistro.INASISTENCIA,
            estado: EstadoSolicitud.INJUSTIFICADA,
            fecha,
          },
        });

        setEstadosEstudiantes({
          ...estadosEstudiantes,
          [estudianteSeleccionado]: {
            estado: 'AUSENTE',
            bloqueado: false,
          },
        });
      }

      // Cerrar modal
      setModalBloques(false);
      setEstudianteSeleccionado(null);
      setBloquesConsecutivos([]);
      setBloquesSeleccionados(new Set());
      setError(null);

      // Recargar historial desde Firestore para sincronizar
      cargarHistorialRef.current();
    } catch (err) {
      console.error('Error al registrar ausencia:', err);
      setError('Error al registrar. Intenta nuevamente.');
    }
  };

  // ── Confirmar cambio a PRESENTE ──
  const confirmarCambioAPresente = async () => {
    if (!estudianteParaPresente || !idProfesor) return;

    try {
      const fechaHoy = new Date().toISOString().split('T')[0];
      
      // Eliminar TODAS las solicitudes de ausencia del estudiante para HOY (todos los bloques)
      const solicitudesAEliminar = solicitudes.filter(
        (s) => s.id_estudiante === estudianteParaPresente && s.fecha === fechaHoy
      );

      await Promise.all(solicitudesAEliminar.map(solicitud => eliminarSolicitudPorId(solicitud.id_solicitud)));

      // Actualizar estado local a PRESENTE
      setEstadosEstudiantes({
        ...estadosEstudiantes,
        [estudianteParaPresente]: {
          estado: 'PRESENTE',
          bloqueado: false,
        },
      });

      // Actualizar registros local
      const nuevosRegistros = { ...registros };
      delete nuevosRegistros[estudianteParaPresente];
      setRegistros(nuevosRegistros);

      // Recargar historial desde Firestore
      cargarHistorialRef.current();

      setModalConfirmacionPresente(false);
      setEstudianteParaPresente(null);
      setEstudianteSeleccionado(null);
      setBloquesConsecutivos([]);
      setBloquesSeleccionados(new Set());
    } catch (err) {
      console.error('Error al cambiar a presente:', err);
      setError('Error al registrar. Intenta nuevamente.');
    }
  };

  // ── Filtrar solicitudes ──
  const solicitudesFiltradas = solicitudes.filter((s) => {
    // Filtro por RUT
    if (busquedaRUT && !s.id_estudiante.toLowerCase().includes(busquedaRUT.toLowerCase()))
      return false;
    // Filtro por fecha
    if (fechaFiltro && s.fecha !== fechaFiltro) return false;
    // Filtro por curso (extraer de estudiantes)
    if (cursoFiltro) {
      const est = estudiantesCurso.find((e) => e.id_estudiante === s.id_estudiante);
      if (!est || est.curso !== cursoFiltro) return false;
    }
    // Filtro por estado
    if (estadoFiltro && s.estado !== estadoFiltro) return false;
    return true;
  });

  return (
    <div style={styles.contenedor(esMobil)}>
      {/* ── Encabezado ── */}
      <div style={styles.encabezado}>
        <h1 style={styles.titulo(esMobil)}>Dashboard Profesor</h1>
        <div style={{
          fontSize: '14px',
          color: '#666',
          fontWeight: 'normal',
          marginTop: '5px'
        }}>
          Pases con fecha: {new Date().toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </div>
      </div>

      {/* ── Navegación ── */}
      <div style={styles.navegacion}>
        <button type="button" 
          onClick={() => setVista('inicio')}
          style={{ ...styles.navBoton, ...(vista === 'inicio' ? styles.navBotonActivo : {}) }}
        >
          📊 Inicio
        </button>
        <button type="button" 
          onClick={() => setVista('historial')}
          style={{ ...styles.navBoton, ...(vista === 'historial' ? styles.navBotonActivo : {}) }}
        >
          📜 Historial
        </button>
      </div>

      {/* ── Errores ── */}
      {error && (
        <div style={styles.errorBanner}>
          <p>{error}</p>
          <button type="button" onClick={() => setError(null)} style={styles.botonCerrar}>
            ✕
          </button>
        </div>
      )}

      {/* ── VISTA: INICIO ── */}
      {vista === 'inicio' && (
        <div style={styles.vista}>
          {/* Controles */}
          <div style={styles.seccion}>
            <div style={styles.selectoresContainer}>
              {/* Selector de Curso */}
              <div style={styles.selectWrapper}>
                <label style={styles.label}>📚 Curso</label>
                <select
                  value={cursoSeleccionado}
                  onChange={(e) => {
                    setCursoParaConfirmar(e.target.value);
                    setModalConfirmacionCurso(true);
                  }}
                  style={styles.selectCurso}
                  disabled={cargandoCursos || cursos.length === 0}
                >
                  {cursos.length === 0 ? (
                    <option value="">-- Cargando cursos --</option>
                  ) : (
                    cursos.map((curso) => (
                      <option key={curso} value={curso}>
                        {curso}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Selector de Bloque */}
              <div style={styles.selectWrapper}>
                <label style={styles.label}>⏱️ Bloque</label>
                <select
                  value={bloqueSeleccionado}
                  onChange={(e) => handleSeleccionarBloque(e.target.value)}
                  style={styles.selectCurso}
                  disabled={cargandoBloques || bloques.length === 0}
                >
                  {bloques.reduce((acc, b) => {
                    if (!b.nombre_bloque.toLowerCase().includes('recre')) {
                      acc.push(
                        <option key={b.id_bloque} value={b.id_bloque}>
                          {b.orden}. {b.nombre_bloque} ({b.hora_inicio}-{b.hora_fin})
                        </option>
                      );
                    }
                    return acc;
                  }, [] as React.ReactNode[])}
                </select>
              </div>
            </div>
          </div>

          {/* Tabla de Estudiantes */}
          <div style={styles.seccion}>
            <h2 style={styles.titulSeccion}>👥 Estudiantes</h2>
            {cargando ? (
              <p style={styles.cargando}>⏳ Cargando…</p>
            ) : estudiantesCurso.length === 0 ? (
              <p style={styles.sinDatos}>No hay estudiantes</p>
            ) : esMobil ? (
              // ── VISTA MÓVIL ──
              <div style={styles.listaMobil}>
                {estudiantesCurso
                  .map((est) => {
                  const estadoEst = estadosEstudiantes[est.id_estudiante] || {
                    estado: 'PRESENTE',
                    bloqueado: false,
                  };
                  
                  const handleClickEstudiante = () => {
                    if (estadoEst.bloqueado) return;
                    abrirModalBloques(est.id_estudiante);
                  };

                  return (
                    <button
                      type="button"
                      key={est.id_estudiante}
                      onClick={handleClickEstudiante}
                      style={{
                        ...styles.tarjetaMobil,
                        ...getRowStyle(est.id_estudiante),
                        cursor: estadoEst.bloqueado ? 'not-allowed' : 'pointer',
                        opacity: estadoEst.bloqueado ? 0.7 : 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <p style={styles.nombreMobil}>{est.nombre_completo}</p>
                        <p style={styles.rutMobil}>RUT: {est.rut}</p>
                      </div>
                      <div style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        fontSize: '13px',
                        color: estadoEst.estado === 'AUSENTE' ? '#DC2626' : '#16A34A',
                      }}>
                        {estadoEst.estado === 'AUSENTE' ? '❌ AUSENTE' : '✅ PRESENTE'}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              // ── VISTA DESKTOP ──
              <div style={styles.tablaContenedor}>
                <table style={styles.tabla}>
                  <thead>
                    <tr style={styles.tablaEncabezado}>
                      <th style={styles.celdaEncabezado}>Nombre</th>
                      <th style={styles.celdaEncabezado}>Curso</th>
                      <th style={styles.celdaEncabezado}>RUT</th>
                      <th style={styles.celdaEncabezado}>Estado</th>
                      <th style={styles.celdaEncabezado}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estudiantesCurso
                      .map((est) => (
                      <tr
                        key={est.id_estudiante}
                        style={{
                          ...styles.filaTabla,
                          ...getRowStyle(est.id_estudiante),
                        }}
                      >
                        <td style={styles.celda}>{est.nombre_completo}</td>
                        <td style={styles.celda}>{est.curso}</td>
                        <td style={styles.celda}>{est.rut}</td>
                        <td style={styles.celda}>{getEstadoLabel(est.id_estudiante)}</td>
                        <td style={styles.celdaAcciones}>
                          <button type="button" 
                            onClick={() => abrirModalBloques(est.id_estudiante)}
                            style={styles.botonInasistencia}
                          >
                            ❌ Registrar Ausencia
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VISTA: HISTORIAL ── */}
      {vista === 'historial' && (
        <div style={styles.vista}>
          {/* Filtros */}
          <div style={styles.seccion}>
            <h2 style={styles.titulSeccion}>🔍 Filtros</h2>
            <div style={styles.filtrosGrid}>
              <input
                type="text"
                value={busquedaRUT}
                onChange={(e) => setBusquedaRUT(e.target.value)}
                placeholder="Buscar RUT..."
                style={styles.inputFiltro}
              />
              <input
                type="date"
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
                style={styles.inputFiltro}
              />
              <select
                value={cursoFiltro}
                onChange={(e) => setCursoFiltro(e.target.value)}
                style={styles.selectFiltro}
              >
                <option value="">Todos los cursos</option>
                <option value="1A">1A</option>
                <option value="1B">1B</option>
                <option value="2A">2A</option>
                <option value="2B">2B</option>
              </select>
              <select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
                style={styles.selectFiltro}
              >
                <option value="">Todos los estados</option>
                <option value={EstadoSolicitud.INJUSTIFICADA}>{EstadoSolicitud.INJUSTIFICADA}</option>
                <option value={EstadoSolicitud.JUSTIFICADA}>{EstadoSolicitud.JUSTIFICADA}</option>
                <option value={EstadoSolicitud.RECHAZADA}>{EstadoSolicitud.RECHAZADA}</option>
              </select>
              <button type="button" 
                onClick={() => {
                  setBusquedaRUT('');
                  setFechaFiltro(new Date().toISOString().split('T')[0]);
                  setCursoFiltro('');
                  setEstadoFiltro('');
                }}
                style={styles.botonLimpiar}
              >
                Limpiar
              </button>
            </div>
          </div>

          {/* Tabla de Registros */}
          <div style={styles.seccion}>
            <h2 style={styles.titulSeccion}>
              📋 Registros ({solicitudesFiltradas.length})
            </h2>
            {cargandoHistorial ? (
              <p style={styles.cargando}>⏳ Cargando…</p>
            ) : solicitudesFiltradas.length === 0 ? (
              <p style={styles.sinDatos}>Sin registros</p>
            ) : esMobil ? (
              // ── VISTA MÓVIL ──
              <div style={styles.listaMobil}>
                {solicitudesFiltradas.map((s) => (
                  <div key={s.id_solicitud} style={styles.tarjetaMobil}>
                    <div style={styles.infoMobil}>
                      <p style={styles.nombreMobil}>{s.id_estudiante}</p>
                      <p style={styles.rutMobil}>{s.fecha} {s.hora}</p>
                      <p style={styles.estadoMobil}>
                        {getEmojiTipo(s.tipo)} {getLabelSimple(s.tipo)}
                      </p>
                      <p style={{...styles.estadoMobil, fontWeight: 700}}>
                        {s.estado === EstadoSolicitud.JUSTIFICADA ? '✅' : s.estado === EstadoSolicitud.INJUSTIFICADA ? '⏳' : '❌'} {s.estado}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // ── VISTA DESKTOP ──
              <div style={styles.tablaContenedor}>
                <table style={styles.tabla}>
                  <thead>
                    <tr style={styles.tablaEncabezado}>
                      <th style={styles.celdaEncabezado}>RUT</th>
                      <th style={styles.celdaEncabezado}>Fecha</th>
                      <th style={styles.celdaEncabezado}>Hora</th>
                      <th style={styles.celdaEncabezado}>Tipo</th>
                      <th style={styles.celdaEncabezado}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {solicitudesFiltradas.map((s) => (
                      <tr
                        key={s.id_solicitud}
                        style={{
                          ...styles.filaTabla,
                          background:
                            s.estado === EstadoSolicitud.JUSTIFICADA
                              ? '#DCFCE7'
                              : s.estado === EstadoSolicitud.INJUSTIFICADA
                                ? s.tipo === TipoRegistro.ATRASO
                                  ? '#FED7AA'
                                  : '#FECACA'
                                : '#F3F4F6',
                        }}
                      >
                        <td style={styles.celda}>{s.id_estudiante}</td>
                        <td style={styles.celda}>{s.fecha}</td>
                        <td style={styles.celda}>{s.hora}</td>
                        <td style={styles.celda}>
                          {getEmojiTipo(s.tipo)} {getLabelSimple(s.tipo)}
                        </td>
                        <td style={{...styles.celda, fontWeight: 600}}>
                          {s.estado === EstadoSolicitud.JUSTIFICADA
                            ? '✅ Justificado'
                            : s.estado === EstadoSolicitud.INJUSTIFICADA
                              ? '⏳ Injustificado'
                              : s.estado}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL DE BLOQUES ── */}
      {modalBloques && estudianteSeleccionado && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitulo}>Seleccionar Bloques Afectados</h2>
            <p style={styles.modalSubtexto}>
              {estudiantesCurso.find((e) => e.id_estudiante === estudianteSeleccionado)?.nombre_completo}
            </p>
            
            <div style={styles.bloquesGrid}>
              {bloquesConsecutivos.map((bloque) => (
                <label key={bloque.id_bloque} style={styles.bloqueCheckbox}>
                  <input
                    type="checkbox"
                    checked={bloquesSeleccionados.has(bloque.id_bloque)}
                    onChange={(e) => {
                      const nuevosSeleccionados = new Set(bloquesSeleccionados);
                      if (e.target.checked) {
                        nuevosSeleccionados.add(bloque.id_bloque);
                      } else {
                        nuevosSeleccionados.delete(bloque.id_bloque);
                      }
                      setBloquesSeleccionados(nuevosSeleccionados);
                      
                      // Si se deselecciona el último check, mostrar confirmación
                      if (nuevosSeleccionados.size === 0 && bloquesSeleccionados.size > 0) {
                        setTimeout(() => {
                          setEstudianteParaPresente(estudianteSeleccionado);
                          setModalConfirmacionPresente(true);
                          setModalBloques(false);
                        }, 0);
                      }
                    }}
                    style={styles.checkbox}
                  />
                  <span>
                    {bloque.orden}. {bloque.nombre_bloque} ({bloque.hora_inicio}-{bloque.hora_fin})
                  </span>
                </label>
              ))}
            </div>

            <div style={styles.modalBotones}>
              <button type="button" 
                onClick={() => {
                  setModalBloques(false);
                  setEstudianteSeleccionado(null);
                  setBloquesConsecutivos([]);
                  setBloquesSeleccionados(new Set());
                }}
                style={styles.botonCancelar}
              >
                Cancelar
              </button>
              <button type="button" 
                onClick={registrarAusenciaEnBloques}
                style={styles.botonConfirmar}
                disabled={bloquesSeleccionados.size === 0}
              >
                ✅ Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación Curso-Bloque */}
      {modalConfirmacionCurso && cursoParaConfirmar && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitulo}>Confirmar Selección</h2>
            <p style={styles.modalSubtexto}>
              ¿Confirmás que tomarás clases en Curso {cursoParaConfirmar} en Bloque {bloqueSeleccionado}?
            </p>
            <p style={{ fontSize: '12px', color: '#666', margin: '8px 0 0 0' }}>
              Otros profesores no podrán registrar en este bloque mientras lo tengas seleccionado.
            </p>

            <div style={styles.modalBotones}>
              <button type="button" 
                onClick={() => {
                  setModalConfirmacionCurso(false);
                  setCursoParaConfirmar(null);
                }}
                style={styles.botonCancelar}
              >
                Cancelar
              </button>
              <button type="button" 
                onClick={() => {
                  setCursoSeleccionado(cursoParaConfirmar);
                  setModalConfirmacionCurso(false);
                  setCursoParaConfirmar(null);
                }}
                style={styles.botonConfirmar}
              >
                ✅ Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Cambio a PRESENTE */}
      {modalConfirmacionPresente && estudianteParaPresente && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitulo}>Confirmar Estado</h2>
            <p style={styles.modalSubtexto}>
              {estudiantesCurso.find((e) => e.id_estudiante === estudianteParaPresente)?.nombre_completo}
            </p>
            <p style={{ fontSize: '14px', color: '#333', margin: '12px 0 0 0', fontWeight: 500 }}>
              ¿Deseas que el estudiante quede PRESENTE?
            </p>

            <div style={styles.modalBotones}>
              <button type="button" 
                onClick={() => {
                  setModalConfirmacionPresente(false);
                  setEstudianteParaPresente(null);
                  setEstudianteSeleccionado(null);
                  setBloquesConsecutivos([]);
                  setBloquesSeleccionados(new Set());
                }}
                style={styles.botonCancelar}
              >
                Cancelar
              </button>
              <button type="button" 
                onClick={confirmarCambioAPresente}
                style={styles.botonConfirmar}
              >
                ✅ Dejar PRESENTE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  contenedor: (esMobil: boolean): React.CSSProperties => ({
    padding: esMobil ? '12px' : '16px',
    maxWidth: '1400px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  }),
  encabezado: { marginBottom: '20px' } as React.CSSProperties,
  titulo: (esMobil: boolean): React.CSSProperties => ({
    fontSize: esMobil ? '20px' : '28px',
    fontWeight: '700',
    color: '#1A3C6B',
    margin: '0 0 8px 0',
  }),
  subtitulo: { fontSize: '12px', color: '#666', margin: '0' } as React.CSSProperties,
  navegacion: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    borderBottom: '2px solid #E5E7EB',
  } as React.CSSProperties,
  navBoton: {
    padding: '12px 16px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
  } as React.CSSProperties,
  navBotonActivo: {
    color: '#1A3C6B',
    borderBottom: '3px solid #1A3C6B',
    marginBottom: '-2px',
  } as React.CSSProperties,
  vista: { display: 'flex', flexDirection: 'column', gap: '20px' } as React.CSSProperties,
  seccion: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    padding: '16px',
  } as React.CSSProperties,
  titulSeccion: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1A3C6B',
    margin: '0 0 12px 0',
  } as React.CSSProperties,
  selectCurso: {
    padding: '10px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: 'inherit',
    width: '100%',
  } as React.CSSProperties,
  tablaContenedor: { overflowX: 'auto' } as React.CSSProperties,
  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
    border: '1px solid #E5E7EB',
  } as React.CSSProperties,
  tablaEncabezado: {
    background: '#F3F4F6',
    fontWeight: '600',
    fontSize: '13px',
  } as React.CSSProperties,
  celdaEncabezado: {
    padding: '10px',
    textAlign: 'left',
    borderBottom: '2px solid #D1D5DB',
    color: '#374151',
  } as React.CSSProperties,
  filaTabla: {
    borderTop: '1px solid #E5E7EB',
    transition: 'background 0.2s',
  } as React.CSSProperties,
  celda: { padding: '10px', fontSize: '13px' } as React.CSSProperties,
  celdaAcciones: {
    padding: '10px',
    display: 'flex',
    gap: '6px',
  } as React.CSSProperties,
  botonAtraso: {
    padding: '6px 10px',
    background: '#FBBF24',
    color: '#78350F',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
  botonInasistencia: {
    padding: '6px 10px',
    background: '#EF4444',
    color: '#FFF',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
  listaMobil: { display: 'flex', flexDirection: 'column', gap: '10px' } as React.CSSProperties,
  tarjetaMobil: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    transition: 'background 0.2s',
  } as React.CSSProperties,
  infoMobil: { flex: 1 } as React.CSSProperties,
  nombreMobil: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1A3C6B',
    margin: '0',
  } as React.CSSProperties,
  rutMobil: { fontSize: '12px', color: '#666', margin: '2px 0' } as React.CSSProperties,
  estadoMobil: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#666',
    margin: '4px 0 0 0',
  } as React.CSSProperties,
  botonesWrapMobil: { display: 'flex', gap: '6px' } as React.CSSProperties,
  switchWrapMobil: {
    flex: 1,
    marginLeft: '12px',
  } as React.CSSProperties,
  botonMobil: {
    padding: '6px 8px',
    background: '#F0F0F0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  } as React.CSSProperties,
  filtros: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  } as React.CSSProperties,
  inputFiltro: {
    padding: '8px 10px',
    border: '1px solid #D1D5DB',
    borderRadius: '4px',
    fontSize: '13px',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  selectFiltro: {
    padding: '8px 10px',
    border: '1px solid #D1D5DB',
    borderRadius: '4px',
    fontSize: '13px',
    fontFamily: 'inherit',
    background: '#FFFFFF',
  } as React.CSSProperties,
  filtrosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '10px',
  } as React.CSSProperties,
  botonLimpiar: {
    padding: '8px 12px',
    background: '#EF4444',
    color: '#FFF',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  } as React.CSSProperties,
  listaHistorial: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  } as React.CSSProperties,
  itemSolicitud: {
    padding: '12px',
    background: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    fontSize: '12px',
    borderLeft: '3px solid #1A3C6B',
  } as React.CSSProperties,
  cargando: {
    textAlign: 'center',
    padding: '20px',
    color: '#999',
    fontSize: '13px',
  } as React.CSSProperties,
  sinDatos: {
    textAlign: 'center',
    padding: '20px',
    color: '#999',
    fontSize: '13px',
  } as React.CSSProperties,
  errorBanner: {
    padding: '12px',
    background: '#FEE2E2',
    color: '#991B1B',
    borderRadius: '6px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  } as React.CSSProperties,
  botonCerrar: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#991B1B',
  } as React.CSSProperties,
  relojContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  } as React.CSSProperties,
  relojDigital: {
    background: 'linear-gradient(135deg, #1A3C6B 0%, #2D5A9B 100%)',
    padding: '16px',
    borderRadius: '8px',
    textAlign: 'center',
  } as React.CSSProperties,
  relojDigitalEditable: {
    background: 'linear-gradient(135deg, #1A3C6B 0%, #2D5A9B 100%)',
    padding: '12px',
    borderRadius: '8px',
    textAlign: 'center',
  } as React.CSSProperties,
  inputRelojAzul: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#FFF',
    background: 'transparent',
    border: 'none',
    textAlign: 'center',
    fontFamily: 'monospace',
    letterSpacing: '2px',
    cursor: 'pointer',
    width: '100%',
  } as React.CSSProperties,
  relojHora: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#FFF',
    margin: '0',
    fontFamily: 'monospace',
    letterSpacing: '2px',
  } as React.CSSProperties,
  selectoresContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  } as React.CSSProperties,
  selectWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  } as React.CSSProperties,
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
  } as React.CSSProperties,
  relojEditableContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px',
    background: '#F3F4F6',
    borderRadius: '6px',
  } as React.CSSProperties,
  inputReloj: {
    fontSize: '16px',
    fontWeight: '600',
    padding: '6px 8px',
    border: '2px solid #1A3C6B',
    borderRadius: '4px',
    fontFamily: 'monospace',
    textAlign: 'center',
    width: '70px',
  } as React.CSSProperties,
  botonGuardarHora: {
    padding: '6px 12px',
    background: '#10B981',
    color: '#FFF',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
  } as React.CSSProperties,
  botonEditarHora: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px 8px',
  } as React.CSSProperties,
  modoRegistroBox: {
    background: '#F3F4F6',
    border: '2px solid #1A3C6B',
    borderRadius: '8px',
    padding: '14px',
    marginBottom: '16px',
  } as React.CSSProperties,
  modoLabel: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#1A3C6B',
    display: 'block',
    marginBottom: '10px',
  } as React.CSSProperties,
  modoButtonsContainer: {
    display: 'flex',
    gap: '10px',
  } as React.CSSProperties,
  modoButton: {
    flex: 1,
    padding: '10px 14px',
    border: '2px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  } as React.CSSProperties,
  modoButtonActivo: {
    background: '#1A3C6B',
    color: '#FFF',
    borderColor: '#1A3C6B',
  } as React.CSSProperties,
  modoButtonInactivo: {
    background: '#FFF',
    color: '#374151',
    borderColor: '#D1D5DB',
  } as React.CSSProperties,
  relojRowContainer: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end',
  } as React.CSSProperties,
  relojOptionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  } as React.CSSProperties,
  relojOptionButton: {
    width: '48px',
    height: '48px',
    fontSize: '20px',
    border: '2px solid #D1D5DB',
    borderRadius: '6px',
    cursor: 'pointer',
    background: '#FFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  } as React.CSSProperties,
  relojOptionButtonActivo: {
    background: '#1A3C6B',
    color: '#FFF',
    borderColor: '#1A3C6B',
  } as React.CSSProperties,
  relojOptionButtonInactivo: {
    background: '#FFF',
    color: '#374151',
    borderColor: '#D1D5DB',
  } as React.CSSProperties,
  selectWrapperWithOptions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end',
  } as React.CSSProperties,
  bloqueOptionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  } as React.CSSProperties,
  bloqueOptionButton: {
    width: '48px',
    height: '48px',
    fontSize: '20px',
    border: '2px solid #D1D5DB',
    borderRadius: '6px',
    cursor: 'pointer',
    background: '#FFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  } as React.CSSProperties,
  bloqueOptionButtonActivo: {
    background: '#1A3C6B',
    color: '#FFF',
    borderColor: '#1A3C6B',
  } as React.CSSProperties,
  bloqueOptionButtonInactivo: {
    background: '#FFF',
    color: '#374151',
    borderColor: '#D1D5DB',
  } as React.CSSProperties,
  bloqueSelectContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  } as React.CSSProperties,
  singleModoButton: {
    width: '56px',
    height: '56px',
    fontSize: '24px',
    border: '2px solid #1A3C6B',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    flexShrink: 0,
  } as React.CSSProperties,
  singleModoButtonBloque: {
    background: '#1A3C6B',
    color: '#FFF',
    borderColor: '#1A3C6B',
  } as React.CSSProperties,
  singleModoButtonReloj: {
    background: '#D1D5DB',
    color: '#374151',
    borderColor: '#1A3C6B',
  } as React.CSSProperties,
  
  // ── Estilos del Modal de Bloques ──
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  } as React.CSSProperties,
  modalContent: {
    background: '#FFF',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
  } as React.CSSProperties,
  modalTitulo: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1A3C6B',
    margin: '0 0 8px 0',
  } as React.CSSProperties,
  modalSubtexto: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 16px 0',
  } as React.CSSProperties,
  bloquesGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '20px',
    maxHeight: '300px',
    overflowY: 'auto',
  } as React.CSSProperties,
  bloqueCheckbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background 0.2s',
  } as React.CSSProperties,
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  } as React.CSSProperties,
  modalBotones: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  } as React.CSSProperties,
  botonCancelar: {
    padding: '10px 16px',
    background: '#E5E7EB',
    color: '#374151',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'background 0.2s',
  } as React.CSSProperties,
  botonConfirmar: {
    padding: '10px 16px',
    background: '#10B981',
    color: '#FFF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'background 0.2s',
  } as React.CSSProperties,
};
