import { useState, useEffect, useRef } from 'react';
import { Card } from '../components/Common';
import {
  obtenerEstudiantesDelEstablecimiento,
  crearSolicitud,
  obtenerSolicitudesDelEstablecimiento,
  obtenerSolicitudesPorCursoYFecha,
  actualizarSolicitud,
  obtenerBloquesHorarios,
} from '../services/database';
import type { Estudiante, Solicitud, BloqueHorario } from '../types';
import { EstadoSolicitud, TipoRegistro } from '../types';
import { esAtraso } from '../utils/tipoRegistroHelper';

interface Props {
  idEstablecimiento: string;
  rol: string;
  idUsuarioActual?: string;
  tabExterno?: 'crear' | 'ver';
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

interface MultiBloqueInfo {
  estudianteId: string;
  bloques: string[];
}

const ITEMS_POR_PAGINA = 10;

export default function GestionPases({ idEstablecimiento, rol, idUsuarioActual, tabExterno }: Props) {
  const [tab, setTab] = useState<'crear' | 'ver'>('crear');
  const tabEfectivo = tabExterno || tab;
  const [esMobil, setEsMobil] = useState(window.innerWidth < 768);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [filtros, setFiltros] = useState<Record<string, string>>({ curso: '', tipo: '', fecha: '', estado: '' });
  const [filtroAbierto, setFiltroAbierto] = useState<string | null>(null);
  const [cursoSeleccionado, setCursoSeleccionado] = useState('');
  const [bloques, setBloques] = useState<BloqueHorario[]>([]);
  const [bloqueSeleccionado, setBloqueSeleccionado] = useState<string>('');
  const [cardsEstado, setCardsEstado] = useState<Record<string, 'presente' | 'atraso' | 'inasistencia'>>({});
  const [cardsMultiVisible, setCardsMultiVisible] = useState<Set<string>>(new Set());
  const [multiBloque, setMultiBloque] = useState<MultiBloqueInfo | null>(null);
  const [bloquesMultiSeleccionados, setBloquesMultiSeleccionados] = useState<Set<string>>(new Set());
  const [multiBloqueTodos, setMultiBloqueTodos] = useState(false);
  const [multiBloquePersistido, setMultiBloquePersistido] = useState<Record<string, { bloques: string[]; todos: boolean }>>({});
  const cardRequestRef = useRef(0);
  const cardsLockedRef = useRef<Set<string>>(new Set());
  const longPressRef = useRef<{ id: string; fired: boolean } | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const [paso1Abierto, setPaso1Abierto] = useState(false);
  const paso2Ref = useRef<HTMLDivElement>(null);
  const [detallesAbierto, setDetallesAbierto] = useState(false);
  const [marcarTipo, setMarcarTipo] = useState<'atraso' | 'inasistencia'>('atraso');

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
  }, [idEstablecimiento]);

  useEffect(() => {
    const handleResize = () => setEsMobil(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (cursoSeleccionado && idEstablecimiento) {
      handleSelectCurso(cursoSeleccionado);
    }
  }, [formData.fecha, bloqueSeleccionado]);

  useEffect(() => {
    if (tab === 'ver') {
      cargarDatos();
    }
  }, [tab]);

  useEffect(() => {
    if (!filtroAbierto) return;
    const cerrar = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-filter]')) setFiltroAbierto(null);
    };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [filtroAbierto]);

  const detectarBloqueActual = (bloquesData: BloqueHorario[]): string => {
    const ahora = new Date();
    const hora = ahora.toTimeString().slice(0, 5);
    const [h, m] = hora.split(':').map(Number);
    const minutos = h * 60 + m;
    for (const b of bloquesData) {
      if (b.nombre_bloque.toLowerCase().includes('recre')) continue;
      const [hi, mi] = b.hora_inicio.split(':').map(Number);
      const [hf, mf] = b.hora_fin.split(':').map(Number);
      const inicio = hi * 60 + mi;
      const fin = hf * 60 + mf;
      if (minutos >= inicio && minutos < fin) return b.id_bloque;
    }
    if (bloquesData.length > 0) return bloquesData[0].id_bloque;
    return '';
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [estudiantesData, solicitudesData, bloquesData] = await Promise.all([
        obtenerEstudiantesDelEstablecimiento(idEstablecimiento).catch(() => []),
        obtenerSolicitudesDelEstablecimiento(idEstablecimiento).catch(() => []),
        obtenerBloquesHorarios(idEstablecimiento).catch(() => []),
      ]);
      setBloques(bloquesData);
      const bloquesClase = bloquesData.filter(b => !b.nombre_bloque.toLowerCase().includes('recre'));
      if (bloquesClase.length > 0) {
        const detectado = detectarBloqueActual(bloquesData);
        const idBloqueInicial = detectado || bloquesClase[0].id_bloque;
        setBloqueSeleccionado(idBloqueInicial);
        const bloqueInicial = bloquesData.find(b => b.id_bloque === idBloqueInicial);
        if (bloqueInicial) {
          setFormData(prev => ({ ...prev, hora: bloqueInicial.hora_inicio }));
        }
      }
      setEstudiantes(estudiantesData);
      setSolicitudes(solicitudesData);
    } catch (err) {
      setError('Error al cargar datos');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const detectarBloque = (hora: string): string => {
    if (!hora || bloques.length === 0) return '';
    const [h, m] = hora.split(':').map(Number);
    const minutos = h * 60 + m;
    for (const b of bloques) {
      const [hi, mi] = b.hora_inicio.split(':').map(Number);
      const [hf, mf] = b.hora_fin.split(':').map(Number);
      const inicio = hi * 60 + mi;
      const fin = hf * 60 + mf;
      if (minutos >= inicio && minutos < fin) return b.id_bloque;
    }
    return '';
  };

  const obtenerBloquesConsecutivos = (): BloqueHorario[] => {
    if (!bloqueSeleccionado || bloques.length === 0) return [];
    const actual = bloques.find(b => b.id_bloque === bloqueSeleccionado);
    if (!actual) return [];
    return bloques.filter(b => {
      const esRecreo = b.nombre_bloque.toLowerCase().includes('recre');
      return !esRecreo && b.orden >= actual.orden;
    }).sort((a, b) => a.orden - b.orden);
  };

  const handleSeleccionarBloque = (idBloque: string, sincronizarHora = true) => {
    setBloqueSeleccionado(idBloque);
    const bloque = bloques.find(b => b.id_bloque === idBloque);
    if (bloque && sincronizarHora) {
      setFormData(prev => ({ ...prev, hora: bloque.hora_inicio }));
    }
  };

  const reloadCards = async (curso: string, bloque?: string) => {
    const reqId = ++cardRequestRef.current;
    cardsLockedRef.current = new Set();
    setCardsMultiVisible(new Set());
    setMultiBloquePersistido({});
    const fecha = formData.fecha || new Date().toISOString().split('T')[0];
    let existentes: Solicitud[] = [];
    if (idEstablecimiento) {
      existentes = await obtenerSolicitudesPorCursoYFecha(idEstablecimiento, curso, fecha, bloque);
    }
    if (reqId !== cardRequestRef.current) return;
    const nuevosEstados: Record<string, 'presente' | 'atraso' | 'inasistencia'> = {};
    estudiantes.filter(e => e.curso === curso).forEach(e => {
      if (e.id_estudiante) {
        const sol = existentes.find(s => s.id_estudiante === e.id_estudiante);
        if (sol) {
          if (sol.estado === EstadoSolicitud.NO_PRESENTADA) {
            nuevosEstados[e.id_estudiante] = 'presente';
          } else {
            nuevosEstados[e.id_estudiante] = sol.tipo === 'INASISTENCIA' ? 'inasistencia' : 'atraso';
            cardsLockedRef.current.add(e.id_estudiante);
          }
        } else {
          nuevosEstados[e.id_estudiante] = 'presente';
        }
      }
    });
    if (reqId !== cardRequestRef.current) return;
    setCardsEstado(nuevosEstados);
  };

  const handleSelectCurso = async (curso: string) => {
    setCursoSeleccionado(curso);
    setFormData({
      ...formData,
      id_estudiante: '',
      rut: '',
      nombre_estudiante: '',
      curso: curso,
    });
    await reloadCards(curso, bloqueSeleccionado || undefined);
    if (curso) {
      setPaso1Abierto(false);
      setTimeout(() => {
        paso2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    }
  };

  const abrirMultiBloque = (idEstudiante: string) => {
    const consecutivos = obtenerBloquesConsecutivos();
    const prev = multiBloquePersistido[idEstudiante];
    setMultiBloque({ estudianteId: idEstudiante, bloques: consecutivos.map(b => b.id_bloque) });
    setBloquesMultiSeleccionados(prev && !prev.todos
      ? new Set(prev.bloques.filter(b => consecutivos.some(c => c.id_bloque === b)))
      : new Set([bloqueSeleccionado]));
    setMultiBloqueTodos(prev ? prev.todos : false);
  };

  const toggleCardClick = (id: string) => {
    if (cardsLockedRef.current.has(id)) return;
    if (longPressRef.current?.id === id && longPressRef.current.fired) {
      longPressRef.current = null;
      return;
    }
    setCardsEstado(prev => {
      const actual = prev[id];
      if (actual === 'presente') {
        const primerClic = esMobil ? marcarTipo : 'atraso';
        setFormData(f => ({ ...f, tipo: primerClic === 'inasistencia' ? TipoRegistro.INASISTENCIA : TipoRegistro.ATRASO }));
        return { ...prev, [id]: primerClic };
      }
      if (actual === 'atraso') {
        setFormData(f => ({ ...f, tipo: TipoRegistro.INASISTENCIA }));
        return { ...prev, [id]: 'inasistencia' };
      }
      return { ...prev, [id]: 'presente' };
    });
  };

  const toggleCardDblClick = (id: string) => {
    if (cardsLockedRef.current.has(id)) return;
    setCardsMultiVisible(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const iniciarLongPress = (id: string) => {
    if (cardsLockedRef.current.has(id)) return;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = window.setTimeout(() => {
      longPressRef.current = { id, fired: true };
      setCardsEstado(prev => {
        if ((prev[id] || 'presente') !== 'presente') return prev;
        const primerClic = esMobil ? marcarTipo : 'atraso';
        setFormData(f => ({ ...f, tipo: primerClic === 'inasistencia' ? TipoRegistro.INASISTENCIA : TipoRegistro.ATRASO }));
        return { ...prev, [id]: primerClic };
      });
      toggleCardDblClick(id);
    }, 450);
  };

  const cancelarLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const getBloquesACrear = (idEstudiante: string): string[] => {
    const estado = cardsEstado[idEstudiante];
    if (estado !== 'atraso' && estado !== 'inasistencia') return [];
    const persistido = multiBloquePersistido[idEstudiante];
    if (persistido) {
      return persistido.todos ? bloquesClase.map(b => b.id_bloque) : persistido.bloques;
    }
    return bloqueSeleccionado ? [bloqueSeleccionado] : [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rol !== 'ADMIN' && rol !== 'PROFESOR') {
      setError('No tienes permisos para crear pases');
      return;
    }

    const ausentes = Object.entries(cardsEstado).filter(([, estado]) => estado === 'atraso' || estado === 'inasistencia');
    if (ausentes.length === 0) {
      setError('No hay estudiantes marcados como ausentes');
      return;
    }

    const yaRegistradosPorBloque = new Map<string, Set<string>>();
    if (idEstablecimiento) {
      const existentes = await obtenerSolicitudesPorCursoYFecha(idEstablecimiento, formData.curso, formData.fecha);
      existentes.forEach(s => {
        if (s.id_estudiante && s.id_bloque && s.estado !== EstadoSolicitud.NO_PRESENTADA) {
          if (!yaRegistradosPorBloque.has(s.id_estudiante)) yaRegistradosPorBloque.set(s.id_estudiante, new Set());
          yaRegistradosPorBloque.get(s.id_estudiante)!.add(s.id_bloque);
        }
      });
    }

    const porCrear: { id: string; bloques: string[] }[] = [];
    for (const [id_estudiante] of ausentes) {
      if (cardsLockedRef.current.has(id_estudiante)) continue;
      const bloquesYa = yaRegistradosPorBloque.get(id_estudiante);
      if (bloquesYa?.has(bloqueSeleccionado)) continue;
      let bloquesDestino = getBloquesACrear(id_estudiante);
      if (bloquesYa) {
        bloquesDestino = bloquesDestino.filter(idBloque => !bloquesYa.has(idBloque));
      }
      if (bloquesDestino.length === 0) continue;
      porCrear.push({ id: id_estudiante, bloques: bloquesDestino });
    }
    if (porCrear.length === 0) {
      setError('Todos los estudiantes seleccionados ya están registrados en estos bloques');
      return;
    }

    const creados: string[] = [];
    try {
      setGuardando(true);

      for (const { id: id_estudiante, bloques: bloquesDestino } of porCrear) {
        const est = estudiantes.find(s => s.id_estudiante === id_estudiante);
        if (!est) continue;
        const esAtraso = cardsEstado[id_estudiante] === 'atraso';
        for (const idBloque of bloquesDestino) {
          const bloque = bloques.find(b => b.id_bloque === idBloque);
          const ts = Date.now();
          const id_solicitud = `sol_${ts}_${Math.random().toString(36).substr(2, 9)}`;
          const solicitud: Solicitud = {
            id_solicitud,
            id_establecimiento: idEstablecimiento,
            id_estudiante,
            id_profesor: idUsuarioActual || '',
            tipo: esAtraso ? TipoRegistro.ATRASO : TipoRegistro.INASISTENCIA,
            fecha: formData.fecha,
            hora: bloque ? bloque.hora_inicio : formData.hora,
            estado: EstadoSolicitud.INASISTENTE,
            motivo_codigo: null,
            motivo_descripcion: esAtraso ? 'Atraso' : 'Ausente',
            observaciones: null,
            respaldo_recibido: false,
            tipo_respaldo: null,
            id_token_qr: null,
            curso: formData.curso,
            id_bloque: idBloque,
            bloques_afectados: bloquesDestino.length,
          };
          await crearSolicitud(solicitud);
        }
        creados.push(id_estudiante);
      }

      creados.forEach(id => cardsLockedRef.current.add(id));
      setExito(true);
      await cargarDatos();
      setTimeout(() => setExito(false), 3000);
    } catch (err) {
      // Falla parcial: los creados quedan grabados; bloquearlos para evitar duplicados al reintentar.
      await reloadCards(formData.curso, bloqueSeleccionado || undefined).catch(() => {});
      creados.forEach(id => cardsLockedRef.current.add(id));
      setError(`Error al crear pase (se guardaron ${creados.length} de ${porCrear.length}): ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleAnularPase = async (id_solicitud: string, id_profesor: string, id_estudiante?: string) => {
    if (rol !== 'ADMIN' && idUsuarioActual !== id_profesor) {
      setError('Solo puedes anular tus propios pases');
      return;
    }
    if (!confirm('¿Estás seguro de que deseas anular este pase?')) return;
    try {
      await actualizarSolicitud(id_solicitud, { estado: EstadoSolicitud.NO_PRESENTADA });
      setSolicitudes(prev => prev.map(s => s.id_solicitud === id_solicitud ? { ...s, estado: EstadoSolicitud.NO_PRESENTADA } : s));
      if (id_estudiante) {
        setCardsEstado(prev => ({ ...prev, [id_estudiante]: 'presente' }));
        cardsLockedRef.current.delete(id_estudiante);
      }
      setExito(true);
      setTimeout(() => setExito(false), 3000);
    } catch (err) {
      setError(`Error al anular pase: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const obtenerOpciones = (columna: string): string[] => {
    const valores = solicitudes.map(s => {
      const est = estudiantes.find(e => e.id_estudiante === s.id_estudiante);
      if (columna === 'curso') return est?.curso || '—';
      if (columna === 'tipo') return s.tipo;
      if (columna === 'fecha') return s.fecha;
      if (columna === 'estado') {
        if (s.estado === EstadoSolicitud.NO_PRESENTADA) return 'Anulado';
        if (s.estado === EstadoSolicitud.INASISTENTE) return 'Sin procesar';
        if (s.estado === 'ATRASO_JUSTIFICADO' || s.estado === 'INASISTENCIA_JUSTIFICADA') return 'Justificado';
        if (s.estado === 'ATRASO_INJUSTIFICADO') return 'Injustificado';
        if (s.estado === 'INASISTENCIA_NO_JUSTIFICADA') return 'Rechazado';
        return s.estado;
      }
      return '';
    });
    return [...new Set(valores)].filter(Boolean).sort();
  };

  const etiquetaEstado = (sol: { estado: string }) =>
    sol.estado === EstadoSolicitud.NO_PRESENTADA ? 'Anulado'
      : sol.estado === EstadoSolicitud.INASISTENTE ? 'Sin procesar'
      : sol.estado === 'ATRASO_JUSTIFICADO' || sol.estado === 'INASISTENCIA_JUSTIFICADA' ? 'Justificado'
      : sol.estado === 'ATRASO_INJUSTIFICADO' ? 'Injustificado'
      : sol.estado === 'INASISTENCIA_NO_JUSTIFICADA' ? 'Rechazado'
      : sol.estado;

  const colorEstado = (estado: string) =>
    estado === EstadoSolicitud.NO_PRESENTADA ? { backgroundColor: '#F3F4F6', color: '#6B7280' }
      : estado === EstadoSolicitud.INASISTENTE ? { backgroundColor: '#FEF3C7', color: '#92400E' }
      : estado === 'ATRASO_JUSTIFICADO' || estado === 'INASISTENCIA_JUSTIFICADA' ? { backgroundColor: '#DCFCE7', color: '#166534' }
      : estado === 'ATRASO_INJUSTIFICADO' ? { backgroundColor: '#FEF3C7', color: '#92400E' }
      : estado === 'INASISTENCIA_NO_JUSTIFICADA' ? { backgroundColor: '#FEE2E2', color: '#991B1B' }
      : { backgroundColor: '#DBEAFE', color: '#1E40AF' };

  const cursosUnicos = [...new Set(estudiantes.map(e => e.curso))].sort();
  const estudiantesCurso = cursoSeleccionado
    ? estudiantes.filter(e => e.curso === cursoSeleccionado)
    : [];
  const bloquesClase = bloques.filter(b => !b.nombre_bloque.toLowerCase().includes('recre'));
  const puedeCrear = rol === 'ADMIN' || rol === 'PROFESOR';

  const solicitudesFiltradas = solicitudes
    .filter(s => {
      if (rol !== 'ADMIN' && s.id_profesor !== idUsuarioActual) return false;
      const est = estudiantes.find(e => e.id_estudiante === s.id_estudiante);
      if (filtros.curso && est?.curso !== filtros.curso) return false;
      if (filtros.tipo && s.tipo !== filtros.tipo) return false;
      if (filtros.fecha && s.fecha !== filtros.fecha) return false;
      if (filtros.estado) {
        if (etiquetaEstado(s) !== filtros.estado) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const totalPaginas = Math.ceil(solicitudesFiltradas.length / ITEMS_POR_PAGINA);
  const solicitudosPaginadas = solicitudesFiltradas.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA
  );

  const bloqueActual = bloques.find(b => b.id_bloque === bloqueSeleccionado);

  if (cargando) {
    return (
      <div style={styles.contenedor}>
        <div style={styles.spinner}>⏳ Cargando…</div>
      </div>
    );
  }

  return (
    <div style={esMobil ? styles.contenedorMobil : styles.contenedor}>
      {!esMobil && !tabExterno && (
        <div style={styles.tabs}>
          <button type="button"
            onClick={() => setTab('crear')}
            style={{ ...styles.tabBtn, ...(tabEfectivo === 'crear' ? styles.tabBtnActivo : {}) }}
          >
            ➕ Crear Pase
          </button>
          <button type="button"
            onClick={() => setTab('ver')}
            style={{ ...styles.tabBtn, ...(tabEfectivo === 'ver' ? styles.tabBtnActivo : {}) }}
          >
            📋 Ver Pases
          </button>
        </div>
      )}

      {/* TAB: CREAR PASE */}
      {(tabEfectivo === 'crear' || (esMobil && !tabExterno)) && (
        <Card titulo="Crear Pase" descripcion="Registrar atrasos e inasistencias por bloque">
          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Curso + Bloque selectors */}
            <div style={styles.paso}>
              {esMobil ? (
                <button
                  type="button"
                  onClick={() => setPaso1Abierto(p => !p)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                >
                  <h4 style={styles.numeroPaso}>
                    📚 Paso 1: {cursoSeleccionado || 'Selecciona curso'}{bloqueActual ? ` · ${bloqueActual.nombre_bloque} (${bloqueActual.hora_inicio})` : ''}
                  </h4>
                  <span style={{ fontSize: 14, color: '#6B7280' }}>{paso1Abierto ? '▾' : '▸'}</span>
                </button>
              ) : (
                <h4 style={styles.numeroPaso}>📚 Paso 1: Curso y Bloque</h4>
              )}
              {(!esMobil || paso1Abierto) && (
                <>
                  <div style={esMobil ? styles.filaMobil : styles.fila2}>
                    <div style={styles.grupo}>
                      <label style={styles.label}>Curso</label>
                      <select
                        value={cursoSeleccionado}
                        onChange={(e) => handleSelectCurso(e.target.value)}
                        style={styles.select}
                      >
                        <option value="">-- Selecciona --</option>
                        {cursosUnicos.map((curso) => (
                          <option key={curso} value={curso}>{curso}</option>
                        ))}
                      </select>
                    </div>
                    <div style={styles.grupo}>
                      <label style={styles.label}>Bloque</label>
                      <select
                        value={bloqueSeleccionado}
                        onChange={(e) => handleSeleccionarBloque(e.target.value)}
                        style={styles.select}
                      >
                      {bloquesClase.map((b) => (
                        <option key={b.id_bloque} value={b.id_bloque}>
                          {b.nombre_bloque} ({b.hora_inicio}-{b.hora_fin})
                        </option>
                      ))}
                      </select>
                    </div>
                  </div>
                  {bloqueActual && (
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>
                      ⏰ Bloque detectado: {bloqueActual.nombre_bloque} ({bloqueActual.hora_inicio}-{bloqueActual.hora_fin})
                      {idUsuarioActual && cursoSeleccionado && ' — Registrando tu presencia'}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Student cards */}
            {cursoSeleccionado && (
              <div style={styles.paso} ref={paso2Ref}>
                <h4 style={styles.numeroPaso}>👤 Paso 2: Marca los ausentes</h4>
                {esMobil && puedeCrear && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'stretch' }}>
                    <button
                      type="button"
                      onClick={() => setMarcarTipo(t => t === 'atraso' ? 'inasistencia' : 'atraso')}
                      title="Estado que se aplicará al hacer clic en un card"
                      style={{ width: 138, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0', border: 'none', borderRadius: 6, fontSize: 14, lineHeight: 1, fontWeight: 600, cursor: 'pointer', backgroundColor: marcarTipo === 'atraso' ? '#FCD34D' : '#FCA5A5', color: marcarTipo === 'atraso' ? '#92400E' : '#991B1B', whiteSpace: 'nowrap' }}
                    >
                      {marcarTipo === 'atraso' ? '🕐 Atraso' : '❌ Inasistencia'}
                    </button>
                    <button
                      type="submit"
                      disabled={guardando}
                      style={{ ...styles.botonPrimario, flex: 1, opacity: guardando ? 0.6 : 1 }}
                    >
                      {guardando ? '⏳ Guardando...' : '✓ Registrar ausentes'}
                    </button>
                  </div>
                )}
                <p style={{ fontSize: 11, color: '#6B7280', margin: '0 0 8px' }}>
                  {esMobil
                    ? 'Click = cambia estado (🟢→🟡→🔴) · Mantén presionado = marcar y + Bloques'
                    : 'Click = cambia estado (🟢→🟡→🔴) · Doble click = opción agregar más bloques'}
                </p>
                <div style={esMobil ? styles.cardGridMobil : styles.cardGrid}>
                  {estudiantesCurso.map((est, idx) => {
                    const estId = est.id_estudiante || '';
                    const estado = cardsEstado[estId] || 'presente';
                    const esAtraso = estado === 'atraso';
                    const esInasistencia = estado === 'inasistencia';
                    const esLocked = cardsLockedRef.current.has(estId);
                    const esMarked = esAtraso || esInasistencia;

                    const bgColor = esLocked
                      ? (() => {
                          const sol = solicitudes.find(s => s.id_estudiante === estId && s.fecha === formData.fecha && s.id_bloque === bloqueSeleccionado);
                          if (!sol) return '#F3F4F6';
                          if (sol.estado === EstadoSolicitud.INASISTENCIA_JUSTIFICADA || sol.estado === EstadoSolicitud.ATRASO_JUSTIFICADO) return '#DCFCE7';
                          if (sol.tipo === 'ATRASO') return '#FEF3C7';
                          return '#FEE2E2';
                        })()
                      : esInasistencia
                        ? 'linear-gradient(135deg,#FEE2E2,#FCA5A5)'
                        : esAtraso
                          ? 'linear-gradient(135deg,#FEF3C7,#FCD34D)'
                          : 'linear-gradient(135deg,#D1FAE5,#A7F3D0)';

                    const bordeCard = esLocked
                      ? '2px solid #D1D5DB'
                      : esMarked
                        ? '3px solid rgb(0 0 0)'
                        : '2px solid #34D399';

                    return (
                      <div
                        key={estId}
                        onClick={() => toggleCardClick(estId)}
                        onDoubleClick={!esMobil ? () => toggleCardDblClick(estId) : undefined}
                        onTouchStart={() => iniciarLongPress(estId)}
                        onTouchEnd={cancelarLongPress}
                        onTouchMove={cancelarLongPress}
                        onContextMenu={(e) => e.preventDefault()}
                        style={{ ...styles.cardItem, background: bgColor, border: bordeCard, cursor: esLocked ? 'default' : 'pointer', opacity: esLocked ? 0.75 : 1, ...(esMobil ? { WebkitUserSelect: 'none' as const, userSelect: 'none' as const, touchAction: 'manipulation' as const } : {}) }}
                      >
                        {esLocked && <span style={{ position: 'absolute', top: 3, right: 3, fontSize: 10, color: '#6B7280', zIndex: 5 }}>🔒</span>}
                        {esMarked && (
                          <div style={{ fontSize: 8, color: '#1F2937', fontWeight: 700, textTransform: 'uppercase', lineHeight: '9px', letterSpacing: '0.2px' }}>
                            {esInasistencia ? 'inasistencia' : 'atraso'}
                          </div>
                        )}
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>
                          {est.numero ?? idx + 1}
                        </div>
                        <div style={{ fontSize: 9, color: '#6B7280' }}>{est.rut}</div>
                        <div style={{ fontSize: 8, color: '#9CA3AF' }}>{est.nombre_completo?.split(' ')[0]}</div>
                        {cardsMultiVisible.has(estId) && esMarked && !esLocked && (
                          <div
                            onClick={(e) => { e.stopPropagation(); abrirMultiBloque(estId); }}
                            style={{ fontSize: 9, color: '#3B82F6', cursor: 'pointer', marginTop: 2, textDecoration: 'underline' }}
                          >
                            {(() => {
                              const sel = multiBloquePersistido[estId];
                              if (sel && (sel.todos || sel.bloques.length > 1)) {
                                return `📅 ${sel.todos ? 'todos' : `${sel.bloques.length} bloques`}`;
                              }
                              return '+ Bloques';
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: '#6B7280', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <span>🟢 Presente</span>
                  <span>🟡 Atraso</span>
                  <span>🔴 Inasistencia</span>
                  <span>🔒 Ya registrado</span>
                </div>
              </div>
            )}

            {/* Details */}
            {cursoSeleccionado && (
              <div style={styles.paso}>
                {esMobil ? (
                  <button
                    type="button"
                    onClick={() => setDetallesAbierto(d => !d)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                  >
                    <h4 style={styles.numeroPaso}>📝 Detalles del Pase</h4>
                    <span style={{ fontSize: 14, color: '#6B7280' }}>{detallesAbierto ? '▾' : '▸'}</span>
                  </button>
                ) : (
                  <h4 style={styles.numeroPaso}>📝 Detalles del Pase</h4>
                )}
                {(!esMobil || detallesAbierto) && (
                  <div style={esMobil ? styles.filaMobil : styles.fila3}>
                  <div style={styles.grupo}>
                    <label style={styles.label}>Tipo</label>
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
                    <label style={styles.label}>Fecha</label>
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
                    <label style={styles.label}>Hora</label>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <input
                        type="time"
                        value={formData.hora}
                        onChange={(e) => {
                          const hora = e.target.value;
                          if (hora) {
                            const [horas, minutos] = hora.split(':').map(Number);
                            if (horas >= 8 && horas <= 17) {
                              if (horas === 17 && minutos > 0) return;
                              setFormData({ ...formData, hora });
                              const bloqueId = detectarBloque(hora);
                              if (bloqueId) handleSeleccionarBloque(bloqueId, false);
                              if (cursoSeleccionado) {
                                reloadCards(cursoSeleccionado, bloqueId || undefined);
                              }
                            }
                          }
                        }}
                        min="08:00"
                        max="17:00"
                        style={{ ...styles.input, flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const ahora = new Date();
                          const hora = ahora.toTimeString().slice(0, 5);
                          const [horas, minutos] = hora.split(':').map(Number);
                          if (horas >= 8 && horas <= 17 && !(horas === 17 && minutos > 0)) {
                            setFormData({ ...formData, hora });
                            const bloqueId = detectarBloque(hora);
                            if (bloqueId) handleSeleccionarBloque(bloqueId, false);
                            if (cursoSeleccionado) {
                              reloadCards(cursoSeleccionado, bloqueId || undefined);
                            }
                          }
                        }}
                        title="Sincronizar hora actual"
                        style={{ padding: '6px 8px', background: 'none', border: '1px solid #D1D5DB', borderRadius: 4, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
                      >🔄</button>
                    </div>
                    {bloqueActual && (
                      <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>
                        ⏰ {bloqueActual.nombre_bloque} ({bloqueActual.hora_inicio}-{bloqueActual.hora_fin})
                      </div>
                    )}
                  </div>
                </div>
                )}
              </div>
            )}

            {error && <div style={styles.error}>{error}</div>}
            {exito && <div style={styles.exito}>✅ Pases creados exitosamente</div>}

            {cursoSeleccionado && !esMobil && puedeCrear && (
              <button
                type="submit"
                disabled={guardando}
                style={{ ...styles.botonPrimario, opacity: guardando ? 0.6 : 1 }}
              >
                {guardando ? '⏳ Guardando...' : '✓ Registrar Ausentes'}
              </button>
            )}
          </form>
        </Card>
      )}

      {/* Multi-block modal */}
      {multiBloque && (() => {
        const consecutivos = obtenerBloquesConsecutivos();
        const registrados = new Set<string>();
        solicitudes.forEach(s => {
          if (s.id_estudiante === multiBloque.estudianteId && s.id_bloque && s.fecha === formData.fecha && s.estado !== EstadoSolicitud.NO_PRESENTADA) {
            registrados.add(s.id_bloque);
          }
        });
        return (
          <div style={styles.modalOverlay}>
            <div style={esMobil ? styles.modalContentMobil : styles.modalContent}>
              <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>Bloques Afectados</h3>
              <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 12px' }}>
                {estudiantes.find(e => e.id_estudiante === multiBloque.estudianteId)?.nombre_completo}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {consecutivos.slice(0, 2).map((b) => {
                  const yaReg = registrados.has(b.id_bloque);
                  const esActual = b.id_bloque === bloqueSeleccionado;
                  const esSel = bloquesMultiSeleccionados.has(b.id_bloque) || yaReg || multiBloqueTodos || esActual;
                  const deshabilitado = yaReg || multiBloqueTodos || esActual;
                  return (
                    <label key={b.id_bloque} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: deshabilitado ? 'default' : 'pointer', opacity: yaReg ? 0.75 : 1 }}>
                      <input
                        type="checkbox"
                        disabled={deshabilitado}
                        checked={esSel}
                        onChange={() => {
                          const next = new Set(bloquesMultiSeleccionados);
                          if (next.has(b.id_bloque)) next.delete(b.id_bloque); else next.add(b.id_bloque);
                          setBloquesMultiSeleccionados(next);
                        }}
                      />
                      <span>{b.nombre_bloque} ({b.hora_inicio}-{b.hora_fin})</span>
                    </label>
                  );
                })}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', borderTop: '1px solid #E5E7EB', paddingTop: 8 }}>
                  <input
                    type="checkbox"
                    checked={multiBloqueTodos}
                    onChange={() => setMultiBloqueTodos(t => !t)}
                  />
                  <strong>Todos</strong>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>— faltó a toda la jornada (no asistió al establecimiento)</span>
                </label>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setMultiBloque(null)} style={{ padding: '8px 16px', border: '1px solid #D1D5DB', borderRadius: 6, cursor: 'pointer', background: '#FFF', fontSize: 13 }}>
                  Cerrar
                </button>
                <button type="button" onClick={() => {
                  if (multiBloque) {
                    const todos = multiBloqueTodos;
                    const bloques = todos ? bloquesClase.map(b => b.id_bloque) : Array.from(bloquesMultiSeleccionados);
                    setMultiBloquePersistido(prev => ({ ...prev, [multiBloque.estudianteId]: { bloques, todos } }));
                  }
                  setMultiBloque(null);
                }} style={{ padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', background: '#1A3C6B', color: '#FFF', fontSize: 13 }}>
                  ✅ Listo {multiBloqueTodos ? '(todos)' : `(${bloquesMultiSeleccionados.size} bloque${bloquesMultiSeleccionados.size !== 1 ? 's' : ''})`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB: VER PASES */}
      {tabEfectivo === 'ver' && (!esMobil || tabExterno === 'ver') && (
        <Card titulo="Pases Registrados" descripcion={`${rol === 'ADMIN' ? 'Admin ve todos los pases' : 'Solo tus pases'}`}>
          {error && <div style={styles.error}>{error}</div>}
          {exito && <div style={styles.exito}>✅ Pase anulado correctamente</div>}
          {solicitudosPaginadas.length === 0 ? (
            <p style={styles.sinDatos}>No hay pases registrados</p>
          ) : (
            <>
              {esMobil ? (
                <>
                  <div style={styles.mobilFilterBar}>
                    {(['curso', 'tipo', 'fecha', 'estado'] as const).map(key => (
                      <select
                        key={key}
                        value={filtros[key]}
                        onChange={(e) => { setFiltros(f => ({ ...f, [key]: e.target.value })); setPaginaActual(1); }}
                        style={styles.mobilFilterSelect}
                      >
                        <option value="">{key === 'fecha' ? '📅 Fecha' : key === 'tipo' ? 'Tipo' : key === 'curso' ? 'Curso' : 'Estado'}</option>
                        {obtenerOpciones(key).map(op => (
                          <option key={op} value={op}>{op}</option>
                        ))}
                      </select>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {solicitudosPaginadas.map((sol) => {
                      const est = estudiantes.find(e => e.id_estudiante === sol.id_estudiante);
                      const puedeanular = rol === 'ADMIN' || sol.id_profesor === idUsuarioActual;
                      return (
                        <div key={sol.id_solicitud} style={styles.mobilCard}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px 12px', alignItems: 'center' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1F2937' }}>
                              {est?.nombre_completo} - {est?.curso}
                            </div>
                            <div style={{ justifySelf: 'end' }}>
                              <span style={{ ...styles.badge, ...colorEstado(sol.estado), flexShrink: 0 }}>{etiquetaEstado(sol)}</span>
                            </div>
                            <div style={{ fontSize: 12, color: '#6B7280' }}>RUT: {est?.rut}</div>
                            <div style={{ justifySelf: 'end' }}>
                              <span style={{ ...styles.badge, ...(esAtraso(sol.tipo) ? { backgroundColor: '#FEF3C7', color: '#92400E' } : { backgroundColor: '#FEE2E2', color: '#991B1B' }) }}>
                                {sol.tipo}
                              </span>
                            </div>
                            <div style={{ fontSize: 12, color: '#374151' }}>📅 {sol.fecha} · 🕐 {sol.hora}</div>
                            <div style={{ justifySelf: 'end' }}>
                              {sol.estado === EstadoSolicitud.NO_PRESENTADA ? (
                                <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>✕ Anulado</span>
                              ) : puedeanular && sol.estado !== 'ATRASO_JUSTIFICADO' && sol.estado !== 'INASISTENCIA_JUSTIFICADA' ? (
                                <button type="button" onClick={() => handleAnularPase(sol.id_solicitud, sol.id_profesor, sol.id_estudiante)} style={styles.botonAnular}>
                                  ✕ Anular
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
              <div style={styles.tabla}>
                <div style={styles.filaEncabezado}>
                  {([['', 'Estudiante'], ['curso', 'Curso'], ['tipo', 'Tipo'], ['fecha', 'Fecha'], ['estado', 'Estado'], ['', 'Acciones']] as const).map(([colKey, label]) => (
                    <div key={colKey || label} style={{ ...styles.celdaEncabezado, position: colKey ? ('relative' as const) : undefined }}>
                      {colKey ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                          onClick={() => setFiltroAbierto(filtroAbierto === colKey ? null : colKey)}
                        >
                          <span>{label}</span>
                          <span style={{ fontSize: 9, opacity: filtros[colKey] ? 1 : 0.6 }}>
                            {filtros[colKey] ? '●' : '▼'}
                          </span>
                        </div>
                      ) : (
                        <span>{label}</span>
                      )}
                      {colKey && filtroAbierto === colKey && (
                        <div data-filter="true" style={{
                          position: 'absolute', top: '100%', left: 0, zIndex: 50,
                          background: '#1e293b', borderRadius: 6, padding: 4, minWidth: 140,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        }}>
                          <div onClick={() => { setFiltros(f => ({ ...f, [colKey]: '' })); setFiltroAbierto(null); setPaginaActual(1); }}
                            style={{ padding: '6px 10px', fontSize: 12, color: '#94a3b8', cursor: 'pointer', borderRadius: 4 }}>
                            {colKey === 'fecha' ? 'Todas las fechas' : 'Todos'}
                          </div>
                          {obtenerOpciones(colKey).map(op => (
                            <div key={op} onClick={() => { setFiltros(f => ({ ...f, [colKey]: op })); setFiltroAbierto(null); setPaginaActual(1); }}
                              style={{ padding: '6px 10px', fontSize: 12, color: '#f1f5f9', cursor: 'pointer', borderRadius: 4 }}>
                              {op}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {solicitudosPaginadas.map((sol) => {
                  const est = estudiantes.find(e => e.id_estudiante === sol.id_estudiante);
                  const puedeanular = rol === 'ADMIN' || sol.id_profesor === idUsuarioActual;
                  return (
                    <div key={sol.id_solicitud} style={styles.filaTabla}>
                      <div style={styles.celda}>
                        <strong>{est?.nombre_completo}</strong>
                        <br /><small>RUT: {est?.rut}</small>
                      </div>
                      <div style={styles.celda}>{est?.curso}</div>
                      <div style={styles.celda}>
                        <span style={{ ...styles.badge, ...(esAtraso(sol.tipo) ? { backgroundColor: '#FEF3C7', color: '#92400E' } : { backgroundColor: '#FEE2E2', color: '#991B1B' }) }}>
                          {sol.tipo}
                        </span>
                      </div>
                      <div style={styles.celda}>
                        <strong>{sol.fecha}</strong>
                        <br /><small>{sol.hora}</small>
                      </div>
                      <div style={styles.celda}>
                        <span style={{ ...styles.badge, ...colorEstado(sol.estado) }}>
                          {etiquetaEstado(sol)}
                        </span>
                      </div>
                      <div style={styles.acciones}>
                        {sol.estado === EstadoSolicitud.NO_PRESENTADA ? (
                          <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>✕ Anulado</span>
                        ) : puedeanular && sol.estado !== 'ATRASO_JUSTIFICADO' && sol.estado !== 'INASISTENCIA_JUSTIFICADA' ? (
                          <button type="button" onClick={() => handleAnularPase(sol.id_solicitud, sol.id_profesor, sol.id_estudiante)} style={styles.botonAnular}>
                            ✕ Anular
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
              )}

              {totalPaginas > 1 && (
                <div style={styles.paginador}>
                  <button type="button" onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))} disabled={paginaActual === 1} style={styles.botonPaginador}>
                    ◀ Anterior
                  </button>
                  <span style={styles.paginaInfo}>Página {paginaActual} de {totalPaginas}</span>
                  <button type="button" onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))} disabled={paginaActual === totalPaginas} style={styles.botonPaginador}>
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
  contenedor: { padding: '24px', backgroundColor: '#F9FAFB', minHeight: '100vh' },
  contenedorMobil: { padding: '12px', backgroundColor: '#F9FAFB', minHeight: '100vh' },
  spinner: { textAlign: 'center', fontSize: '16px', color: '#6B7280', padding: '40px' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '20px' },
  tabBtn: { padding: '10px 16px', backgroundColor: '#E5E7EB', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#374151', transition: 'all 0.2s' },
  tabBtnActivo: { backgroundColor: '#1A3C6B', color: '#FFFFFF' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  paso: { padding: '16px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px' },
  numeroPaso: { fontSize: '14px', fontWeight: '700', color: '#1F2937', margin: '0 0 12px 0' },
  fila2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  fila3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' },
  filaMobil: { display: 'flex', flexDirection: 'column', gap: '12px' },
  grupo: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: '600', color: '#374151' },
  input: { padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', fontFamily: 'Arial, sans-serif', color: '#374151', backgroundColor: '#FFFFFF' },
  select: { padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', fontFamily: 'Arial, sans-serif', color: '#374151', backgroundColor: '#FFFFFF' },
  error: { padding: '12px', backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: '6px', fontSize: '14px' },
  exito: { padding: '12px', backgroundColor: '#DCFCE7', color: '#166534', borderRadius: '6px', fontSize: '14px' },
  botonPrimario: { padding: '10px 20px', backgroundColor: '#1A3C6B', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  sinDatos: { textAlign: 'center', color: '#6B7280', padding: '40px 20px' },
  tabla: { display: 'flex', flexDirection: 'column', gap: '0', marginBottom: '16px', border: '1px solid #E5E7EB', borderRadius: '6px', overflow: 'hidden' },
  tablaMobil: { display: 'flex', flexDirection: 'column', gap: '0', marginBottom: '16px', border: '1px solid #E5E7EB', borderRadius: '6px', overflowX: 'auto' },
  mobilFilterBar: { display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' },
  mobilFilterSelect: { flex: '1 1 45%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', backgroundColor: '#FFFFFF', color: '#374151', fontFamily: 'Arial, sans-serif' },
  mobilCard: { border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px', backgroundColor: '#FFFFFF' },
  filaEncabezado: { display: 'grid', gridTemplateColumns: '180px 100px 100px 120px 100px 100px', gap: '12px', padding: '12px', backgroundColor: '#F3F4F6', fontWeight: '600', fontSize: '13px', color: '#1F2937', borderBottom: '2px solid #E5E7EB' },
  celdaEncabezado: { fontSize: '13px', fontWeight: '700' },
  filaTabla: { display: 'grid', gridTemplateColumns: '180px 100px 100px 120px 100px 100px', gap: '12px', padding: '12px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', alignItems: 'center' },
  celda: { fontSize: '13px', color: '#374151' },
  acciones: { display: 'flex', gap: '8px' },
  botonAnular: { padding: '6px 12px', backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  paginador: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' },
  botonPaginador: { padding: '8px 12px', backgroundColor: '#E5E7EB', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  paginaInfo: { fontSize: '14px', fontWeight: '600', color: '#374151' },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' },
  cardGridMobil: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '6px' },
  cardItem: { position: 'relative' as const, padding: '10px 6px', borderRadius: '8px', textAlign: 'center' as const, cursor: 'pointer', transition: 'all 0.2s', minHeight: '60px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: '2px', overflow: 'hidden' },
  badge: { display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' },
  modalOverlay: { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
  modalContent: { background: '#FFF', borderRadius: 12, padding: 24, minWidth: 320, maxWidth: 400, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' },
  modalContentMobil: { background: '#FFF', borderRadius: 12, padding: 20, width: '100%', maxWidth: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' },
};
