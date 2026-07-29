// ============================================================
// AGIL – Gestión de Pases (Atrasos/Inasistencias) - v2
// src/pages/GestionPases.tsx
// ============================================================

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
  const [bloques, setBloques] = useState<BloqueHorario[]>([]);
  const [bloqueDetectado, setBloqueDetectado] = useState<string>('');
  const [cardsEstado, setCardsEstado] = useState<Record<string, 'presente' | 'atraso' | 'inasistencia'>>({});
  const [cardsJustificado, setCardsJustificado] = useState<Record<string, boolean>>({});
  const cardRequestRef = useRef(0);
  const cardsLockedRef = useRef<Set<string>>(new Set());

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

  useEffect(() => {
    if (cursoSeleccionado && idEstablecimiento) {
      handleSelectCurso(cursoSeleccionado);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.fecha]);

  useEffect(() => {
    if (tab === 'ver') {
      cargarDatos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [estudiantesData, solicitudesData, bloquesData] = await Promise.all([
        obtenerEstudiantesDelEstablecimiento(idEstablecimiento).catch(() => []),
        obtenerSolicitudesDelEstablecimiento(idEstablecimiento).catch(() => []),
        obtenerBloquesHorarios(idEstablecimiento).catch(() => []),
      ]);
      setBloques(bloquesData);
      // Detectar bloque inicial
      const horaInicial = new Date().toTimeString().slice(0, 5);
      for (const b of bloquesData) {
        const [hi, mi] = b.hora_inicio.split(':').map(Number);
        const [hf, mf] = b.hora_fin.split(':').map(Number);
        const [h, m] = horaInicial.split(':').map(Number);
        const mins = h * 60 + m, ini = hi * 60 + mi, fin = hf * 60 + mf;
        if (mins >= ini && mins < fin) { setBloqueDetectado(b.id_bloque); break; }
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

  const reloadCards = async (curso: string, bloque?: string) => {
    const reqId = ++cardRequestRef.current;
    cardsLockedRef.current = new Set();
    const fecha = formData.fecha || new Date().toISOString().split('T')[0];
    let existentes: Solicitud[] = [];
    if (idEstablecimiento) {
      existentes = await obtenerSolicitudesPorCursoYFecha(idEstablecimiento, curso, fecha, bloque);
    }
    if (reqId !== cardRequestRef.current) return;
    const nuevosEstados: Record<string, 'presente' | 'atraso' | 'inasistencia'> = {};
    const nuevosJustif: Record<string, boolean> = {};
    estudiantes.filter(e => e.curso === curso).forEach(e => {
      if (e.id_estudiante) {
        const sol = existentes.find(s => s.id_estudiante === e.id_estudiante);
        if (sol) {
          if (sol.estado === EstadoSolicitud.NO_PRESENTADA) {
            nuevosEstados[e.id_estudiante] = 'presente';
            nuevosJustif[e.id_estudiante] = false;
          } else {
            nuevosEstados[e.id_estudiante] = sol.tipo === 'INASISTENCIA' ? 'inasistencia' : 'atraso';
            nuevosJustif[e.id_estudiante] = sol.estado === 'INASISTENCIA_JUSTIFICADA' || sol.estado === 'JUSTIFICADA' || sol.estado === 'ATRASO_JUSTIFICADO';
            cardsLockedRef.current.add(e.id_estudiante);
          }
        } else {
          nuevosEstados[e.id_estudiante] = 'presente';
          nuevosJustif[e.id_estudiante] = false;
        }
      }
    });
    if (reqId !== cardRequestRef.current) return;
    setCardsEstado(nuevosEstados);
    setCardsJustificado(nuevosJustif);
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
    await reloadCards(curso, bloqueDetectado || undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let ausentes = Object.entries(cardsEstado).filter(([, estado]) => estado === 'atraso' || estado === 'inasistencia');
    if (ausentes.length === 0) {
      setError('No hay estudiantes marcados como ausentes');
      return;
    }

    // Excluir estudiantes ya registrados en este bloque
    const yaRegistrados = new Set<string>();
    if (idEstablecimiento) {
      const existentes = await obtenerSolicitudesPorCursoYFecha(idEstablecimiento, formData.curso, formData.fecha, bloqueDetectado || undefined);
      existentes.forEach(s => { if (s.id_estudiante && s.estado !== EstadoSolicitud.NO_PRESENTADA) yaRegistrados.add(s.id_estudiante); });
    }
    ausentes = ausentes.filter(([id]) => !yaRegistrados.has(id) && !cardsLockedRef.current.has(id));
    if (ausentes.length === 0) {
      setError('Todos los estudiantes seleccionados ya están registrados en este bloque');
      return;
    }

    // Bloquear también los que ya estaban en DB
    yaRegistrados.forEach(id => cardsLockedRef.current.add(id));

    try {
      setGuardando(true);
      const creados: string[] = [];

      for (const [id_estudiante] of ausentes) {
        const est = estudiantes.find(s => s.id_estudiante === id_estudiante);
        if (!est) continue;
        const id_solicitud = `sol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const esAtraso = cardsEstado[id_estudiante] === 'atraso';
        const solicitud: Solicitud = {
          id_solicitud,
          id_establecimiento: idEstablecimiento,
          id_estudiante,
          id_profesor: idUsuarioActual || '',
          tipo: esAtraso ? TipoRegistro.ATRASO : TipoRegistro.INASISTENCIA,
          fecha: formData.fecha,
          hora: formData.hora,
          estado: cardsJustificado[id_estudiante] ? 'INASISTENCIA_JUSTIFICADA' : 'INASISTENTE',
          motivo_codigo: null,
          motivo_descripcion: cardsJustificado[id_estudiante] ? 'Justificado' : (esAtraso ? 'Atraso' : 'Ausente'),
          observaciones: null,
          respaldo_recibido: false,
          tipo_respaldo: null,
          id_token_qr: null,
          curso: formData.curso,
          id_bloque: bloqueDetectado || undefined,
        };
        await crearSolicitud(solicitud);
        creados.push(est.nombre_completo);
      }

      for (const [id_estudiante] of ausentes) {
        cardsLockedRef.current.add(id_estudiante);
      }
      setExito(true);
      await cargarDatos();
      setTimeout(() => setExito(false), 3000);
    } catch (err) {
      setError(`Error al crear pase: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setGuardando(false);
    }
  };

  const toggleCardClick = (id: string) => {
    if (cardsLockedRef.current.has(id)) return;
    setCardsEstado(prev => {
      const actual = prev[id];
      if (actual === 'atraso') {
        setFormData(f => ({ ...f, tipo: TipoRegistro.ATRASO }));
        return { ...prev, [id]: 'presente' };
      }
      if (actual === 'inasistencia') {
        setFormData(f => ({ ...f, tipo: TipoRegistro.ATRASO }));
        return { ...prev, [id]: 'presente' };
      }
      setFormData(f => ({ ...f, tipo: TipoRegistro.ATRASO }));
      setCardsJustificado(jprev => ({ ...jprev, [id]: false }));
      return { ...prev, [id]: 'atraso' };
    });
  };

  const toggleCardDblClick = (id: string) => {
    if (cardsLockedRef.current.has(id)) return;
    setCardsEstado(prev => {
      const actual = prev[id];
      if (actual === 'inasistencia') {
        setFormData(f => ({ ...f, tipo: TipoRegistro.ATRASO }));
        return { ...prev, [id]: 'presente' };
      }
      if (actual === 'atraso') {
        setFormData(f => ({ ...f, tipo: TipoRegistro.ATRASO }));
        return { ...prev, [id]: 'presente' };
      }
      setFormData(f => ({ ...f, tipo: TipoRegistro.INASISTENCIA }));
      setCardsJustificado(jprev => ({ ...jprev, [id]: false }));
      return { ...prev, [id]: 'inasistencia' };
    });
  };

  const toggleJustificado = (id: string) => {
    if (cardsLockedRef.current.has(id)) return;
    setCardsJustificado(prev => ({ ...prev, [id]: !prev[id] }));
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
        setCardsJustificado(prev => ({ ...prev, [id_estudiante]: false }));
        cardsLockedRef.current.delete(id_estudiante);
      }
      setExito(true);
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

            {/* Paso 2: Lista de estudiantes como cards */}
            {cursoSeleccionado && (
              <div style={styles.paso}>
                <h4 style={styles.numeroPaso}>👤 Paso 2: Marca los ausentes</h4>
                <div style={styles.cardGrid}>
                  {estudiantesCurso.map((est, idx) => {
                    const estId = est.id_estudiante || '';
                    const estado = cardsEstado[estId] || 'presente';
                    const justif = cardsJustificado[estId] || false;
                    const esAtraso = estado === 'atraso';
                    const esInasistencia = estado === 'inasistencia';
                    const bgColor = esInasistencia
                      ? 'linear-gradient(135deg,#FEE2E2,#FCA5A5)'
                      : esAtraso
                        ? 'linear-gradient(135deg,#FEF3C7,#FCD34D)'
                        : 'linear-gradient(135deg,#D1FAE5,#A7F3D0)';
                    const esLocked = cardsLockedRef.current.has(estId);
                    const esMarked = esAtraso || esInasistencia;
                    const bordeCard = esMarked
                      ? (justif ? '3px solid rgb(15 85 183)' : '3px solid rgb(0 0 0)')
                      : '2px solid #34D399';
                    return (
                      <div
                        key={estId}
                        onClick={() => toggleCardClick(estId)}
                        onDoubleClick={() => toggleCardDblClick(estId)}
                        style={{
                          ...styles.cardItem,
                          background: bgColor,
                          border: bordeCard,
                        }}
                      >
                        {esLocked && <span style={{position:'absolute',top:3,right:3,fontSize:10,color:'#6B7280',zIndex:5}}>🔒</span>}
                        {esMarked && !esLocked && (
                          <span
                            onClick={(e) => { e.stopPropagation(); toggleJustificado(estId); }}
                            style={{
                              position: 'absolute', top: 3, right: 3,
                              fontSize: 11, lineHeight: '14px',
                              color: justif ? '#3B82F6' : '#9CA3AF',
                              cursor: 'pointer', zIndex: 5,
                              fontWeight: 'bold',
                            }}
                          >
                            {justif ? '✓' : '○'}
                          </span>
                        )}
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>
                          {est.numero ?? idx + 1}
                        </div>
                        <div style={{ fontSize: 9, color: '#6B7280' }}>{est.rut}</div>
                        <div style={{ fontSize: 8, color: '#9CA3AF' }}>{est.nombre_completo?.split(' ')[0]}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{display:'flex',gap:16,marginTop:8,fontSize:11,color:'#6B7280',justifyContent:'center'}}>
                  <span style={{display:'inline-flex',alignItems:'center',gap:4}}>
                    <span style={{width:14,height:14,border:'3px solid rgb(0 0 0)',borderRadius:3,display:'inline-block'}}></span>
                    Borde negro = estudiante injustificado
                  </span>
                  <span style={{display:'inline-flex',alignItems:'center',gap:4}}>
                    <span style={{width:14,height:14,border:'3px solid rgb(15 85 183)',borderRadius:3,display:'inline-block'}}></span>
                    Borde azul = estudiante justificado
                  </span>
                </div>
              </div>
            )}

            {/* Detalles del pase */}
            {cursoSeleccionado && (
              <div style={styles.paso}>
                <h4 style={styles.numeroPaso}>📝 Detalles del Pase</h4>
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
                    <div style={{display:'flex',gap:4,alignItems:'center'}}>
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
                              setBloqueDetectado(bloqueId);
                              if (cursoSeleccionado) {
                                reloadCards(cursoSeleccionado, bloqueId || undefined);
                              }
                            }
                          }
                        }}
                        min="08:00"
                        max="17:00"
                        style={{...styles.input,flex:1}}
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
                            setBloqueDetectado(bloqueId);
                            if (cursoSeleccionado) {
                              reloadCards(cursoSeleccionado, bloqueId || undefined);
                            }
                          }
                        }}
                        title="Sincronizar hora actual"
                        style={{padding:'6px 8px',background:'none',border:'1px solid #D1D5DB',borderRadius:4,cursor:'pointer',fontSize:16,lineHeight:1}}
                      >🔄</button>
                    </div>
                    {bloqueDetectado && (() => {
                      const b = bloques.find(bq => bq.id_bloque === bloqueDetectado);
                      return b ? <div style={{fontSize:10,color:'#6B7280',marginTop:2}}>⏰ {b.nombre_bloque} ({b.hora_inicio}-{b.hora_fin})</div> : null;
                    })()}
                  </div>
                </div>
              </div>
            )}

            {error && <div style={styles.error}>{error}</div>}
            {exito && <div style={styles.exito}>✅ Pases creados exitosamente</div>}

            {cursoSeleccionado && (
              <button
                type="submit"
                disabled={guardando}
                style={{
                  ...styles.botonPrimario,
                  opacity: guardando ? 0.6 : 1,
                }}
              >
                {guardando ? '⏳ Guardando...' : '✓ Registrar Ausentes'}
              </button>
            )}
          </form>
        </Card>
      )}

      {/* TAB: VER PASES */}
      {tab === 'ver' && (
        <Card titulo="Pases Registrados" descripcion={`Todos los pases (${rol === 'ADMIN' ? 'Admin ve todos' : 'Solo tus pases'})`}>
          {error && <div style={styles.error}>{error}</div>}
          {exito && <div style={styles.exito}>✅ Pase anulado correctamente</div>}
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
                          {sol.estado === EstadoSolicitud.NO_PRESENTADA ? 'Anulado' : sol.estado === 'ATRASO_JUSTIFICADO' ? 'Justificado' : sol.estado === 'INASISTENCIA_JUSTIFICADA' ? 'Justificado' : sol.estado === 'ATRASO_INJUSTIFICADO' ? 'Injustificado' : sol.estado === 'INASISTENCIA_NO_JUSTIFICADA' ? 'Rechazado' : sol.estado}
                        </span>
                      </div>
                      <div style={styles.acciones}>
                        {sol.estado === EstadoSolicitud.NO_PRESENTADA ? (
                          <span style={{fontSize:12,color:'#6B7280',fontWeight:600}}>✕ Anulado</span>
                        ) : puedeanular && sol.estado !== 'ATRASO_JUSTIFICADO' && sol.estado !== 'INASISTENCIA_JUSTIFICADA' ? (
                          <button type="button" 
                            onClick={() => handleAnularPase(sol.id_solicitud, sol.id_profesor, sol.id_estudiante)}
                            style={styles.botonAnular}
                          >
                            ✕ Anular
                          </button>
                        ) : null}
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
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '8px',
  },
  cardItem: {
    position: 'relative' as const,
    padding: '10px 6px',
    borderRadius: '8px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
    minHeight: '60px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    overflow: 'hidden',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
  },
};
