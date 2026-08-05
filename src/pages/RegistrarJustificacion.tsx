import { useState, useEffect, useRef } from 'react';
import { RegistrarJustificacionUI } from '../components/RegistrarJustificacion';
import {
  obtenerEstudiantesDelEstablecimiento,
  obtenerCursosDelEstablecimiento,
  obtenerMotivosDelEstablecimiento,
  obtenerProfesoresDelEstablecimiento,
  obtenerSolicitudesDelEstablecimiento,
  justificarAtraso,
  justificarInasistencia,
  crearSolicitud,
  escucharSolicitudesInjustificadas,
} from '../services/database';
import type { Estudiante, Solicitud, MotivoJustificacion } from '../types';
import { EstadoSolicitud, TipoRegistro } from '../types';
import { supabase } from '../lib/supabase';

interface Props {
  idEstablecimiento: string;
  idUsuario?: string;
}

type EstadoLookup = 'justificado' | 'injustificado' | 'sin_registro' | null;

const esJustificado = (e: EstadoSolicitud) =>
  e === EstadoSolicitud.ATRASO_JUSTIFICADO || e === EstadoSolicitud.INASISTENCIA_JUSTIFICADA;

const normalizarRut = (r: string) => (r || '').replace(/[.\-\s]/g, '').toLowerCase();

export default function RegistrarJustificacion({ idEstablecimiento, idUsuario = '' }: Props) {

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [cursos, setCursos] = useState<string[]>([]);
  const [motivos, setMotivos] = useState<MotivoJustificacion[]>([]);
  const [profesoresMap, setProfesoresMap] = useState<Record<string, string>>({});
  const [filtrosCurso, setFiltrosCurso] = useState<string>('');
  const [cargando, setCargando] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const [pestanaActiva, setPestanaActiva] = useState<'todos' | 'injustificados' | 'justificados' | 'anulados'>('todos');
  const [filtroFecha, setFiltroFecha] = useState<string>('');
  const [itemsPorPagina, setItemsPorPagina] = useState(10);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<Solicitud | null>(null);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<string>('');
  const [tipoModal, setTipoModal] = useState<TipoRegistro>(TipoRegistro.ATRASO);
  const [tieneDocumento, setTieneDocumento] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Formulario superior (diseño Justificar1) ──
  const hoy = new Date().toISOString().split('T')[0];
  const [fechaForm, setFechaForm] = useState(hoy);
  const [horaForm, setHoraForm] = useState(() => new Date().toTimeString().slice(0, 5));
  const [rutLookup, setRutLookup] = useState('');
  const [estudianteLookup, setEstudianteLookup] = useState<Estudiante | null>(null);
  const [estadoLookup, setEstadoLookup] = useState<EstadoLookup>(null);
  const [estadoManual, setEstadoManual] = useState('');
  const [tipoNuevo, setTipoNuevo] = useState<TipoRegistro>(TipoRegistro.ATRASO);
  const [modoCrear, setModoCrear] = useState(false);

  const selectMotivoRef = useRef<HTMLSelectElement>(null);
  const modalAbiertoRef = useRef(false);
  const solicitudSeleccionadaRef = useRef<Solicitud | null>(null);
  const errorRef = useRef<React.Dispatch<React.SetStateAction<string | null>>>(() => {});

  // Mantener refs sincronizados
  useEffect(() => { modalAbiertoRef.current = modalAbierto; }, [modalAbierto]);
  useEffect(() => { solicitudSeleccionadaRef.current = solicitudSeleccionada; }, [solicitudSeleccionada]);
  useEffect(() => { errorRef.current = setError; }, []);

  // ── Refrescar solicitudes con validación de modal abierto ──
  const refrescarSolicitudes = async () => {
    try {
      const frescas = await obtenerSolicitudesDelEstablecimiento(idEstablecimiento);
      const ordenadas = [...frescas].sort((a, b) => {
        const ca = a.creado_en ? new Date(a.creado_en).getTime() : 0;
        const cb = b.creado_en ? new Date(b.creado_en).getTime() : 0;
        if (ca && cb && ca !== cb) return cb - ca;
        const cmpFecha = b.fecha.localeCompare(a.fecha);
        if (cmpFecha !== 0) return cmpFecha;
        return (b.hora || '').localeCompare(a.hora || '');
      });
      setSolicitudes(ordenadas);

      // Si el modal está abierto, validar que la solicitud siga siendo INASISTENTE
      if (modalAbiertoRef.current && solicitudSeleccionadaRef.current) {
        const actual = ordenadas.find(s => s.id_solicitud === solicitudSeleccionadaRef.current!.id_solicitud);
        if (!actual || actual.estado !== EstadoSolicitud.INASISTENTE) {
          errorRef.current('Este registro fue anulado o modificado por otro usuario');
          setModalAbierto(false);
          setSolicitudSeleccionada(null);
          setMotivoSeleccionado('');
          setModoCrear(false);
        }
      }
    } catch { /* ignorar */ }
  };

  // ── Cargar datos iniciales y escuchar cambios en tiempo real ──
  useEffect(() => {
    let unsubscribe: () => void = () => {};

    const cargarDatosIniciales = async () => {
      try {
        setCargando(true);

        const [estudiantesData, cursosData, motivosData, profesoresData] = await Promise.all([
          obtenerEstudiantesDelEstablecimiento(idEstablecimiento).catch(() => []),
          obtenerCursosDelEstablecimiento(idEstablecimiento).catch(() => []),
          obtenerMotivosDelEstablecimiento(idEstablecimiento).catch(() => []),
          obtenerProfesoresDelEstablecimiento(idEstablecimiento).catch(() => []),
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

        const mapa: Record<string, string> = {};
        (profesoresData as Array<{ uid?: string; id_usuario?: string; nombre_completo?: string; apellidos?: string }>).forEach(p => {
          const nombreCompleto = [p.nombre_completo, p.apellidos].filter(Boolean).join(' ').trim();
          if (p.uid) mapa[p.uid] = nombreCompleto;
          if (p.id_usuario) mapa[p.id_usuario] = nombreCompleto;
        });
        setProfesoresMap(mapa);

        unsubscribe = escucharSolicitudesInjustificadas(
          idEstablecimiento,
          (solicitudesData) => {
            const ordenadas = [...solicitudesData].sort((a, b) => {
              const ca = a.creado_en ? new Date(a.creado_en).getTime() : 0;
              const cb = b.creado_en ? new Date(b.creado_en).getTime() : 0;
              if (ca && cb && ca !== cb) return cb - ca;
              const cmpFecha = b.fecha.localeCompare(a.fecha);
              if (cmpFecha !== 0) return cmpFecha;
              return (b.hora || '').localeCompare(a.hora || '');
            });
            setSolicitudes(ordenadas);
          }
        );

        setCargando(false);
      } catch (err) {
        console.error(err);
        setCargando(false);
      }
    };

    cargarDatosIniciales();

    return () => {
      unsubscribe();
    };
  }, [idEstablecimiento]);

  useEffect(() => {
    const intervalo = setInterval(refrescarSolicitudes, 10000);
    return () => clearInterval(intervalo);
  }, [idEstablecimiento]);

  useEffect(() => {
    window.addEventListener('paseNuevo', refrescarSolicitudes);
    return () => window.removeEventListener('paseNuevo', refrescarSolicitudes);
  }, [idEstablecimiento]);

  const abrirModal = (solicitud: Solicitud) => {
    if (solicitud.estado === EstadoSolicitud.INASISTENTE) {
      setModoCrear(false);
      setSolicitudSeleccionada(solicitud);
      setTipoModal(solicitud.tipo);
      setModalAbierto(true);
      setMotivoSeleccionado('');
      setError(null);
      setTimeout(() => {
        selectMotivoRef.current?.focus();
      }, 0);
    }
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setSolicitudSeleccionada(null);
    setMotivoSeleccionado('');
    setModoCrear(false);
    setError(null);
  };

  // ── Lookup individual por RUT ──
  const handleBuscarRut = () => {
    setError(null);
    if (!normalizarRut(rutLookup)) return;

    const est = estudiantes.find(e => normalizarRut(e.rut || '') === normalizarRut(rutLookup));
    if (!est) {
      setEstudianteLookup(null);
      setEstadoLookup(null);
      setError('No se encontró un estudiante con ese RUT');
      return;
    }

    setEstudianteLookup(est);
    const sol = solicitudes.find(s => s.id_estudiante === est.id_estudiante && s.fecha === hoy) || null;
    if (!sol) { setEstadoLookup('sin_registro'); setEstadoManual('Justificado'); }
    else {
      const autoEstado = esJustificado(sol.estado) ? 'justificado' : 'injustificado';
      if (sol.estado === EstadoSolicitud.NO_PRESENTADA) {
        setEstadoLookup('sin_registro');
        setEstadoManual('Justificado');
      } else {
        setEstadoLookup(autoEstado);
        setEstadoManual(autoEstado === 'justificado' ? 'Justificado' : 'Injustificado');
      }
    }
  };

  // ── Crear justificación (cuando no hay registro hoy) ──
  const handleCrearJustificacion = () => {
    if (!estudianteLookup) return;
    if (!confirm(`${estudianteLookup.nombre_completo} no tiene registro hoy.\n¿Desea crear la justificación?`)) return;
    setModoCrear(true);
    setSolicitudSeleccionada(null);
    setTipoModal(tipoNuevo);
    setMotivoSeleccionado('');
    setError(null);
    setModalAbierto(true);
    setTimeout(() => {
      selectMotivoRef.current?.focus();
    }, 0);
  };

  const handleJustificar = async () => {
    if (!modoCrear && !solicitudSeleccionada) return;
    if (modoCrear && !estudianteLookup) return;
    if (!motivoSeleccionado) {
      setError('Debes seleccionar un motivo');
      return;
    }

    try {
      setGuardando(true);
      setError(null);

      let codigoMotivo = '';
      let descripcionMotivo = '';

      if (motivoSeleccionado === '__documento__') {
        // Opción especial para documento/certificado médico
        codigoMotivo = 'DOC';
        descripcionMotivo = 'Documento/Certificado presentado';
      } else {
        // Motivo regular
        const motivo = motivos.find(m => m.id_motivo === motivoSeleccionado);
        codigoMotivo = motivo?.codigo || motivoSeleccionado;
        descripcionMotivo = motivo?.descripcion || '';
      }

      if (modoCrear && estudianteLookup) {
        // Crear la solicitud y justificarla en el mismo paso
        const id_solicitud = `sol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const nueva: Solicitud = {
          id_solicitud,
          id_establecimiento: idEstablecimiento,
          id_estudiante: estudianteLookup.id_estudiante,
          id_profesor: idUsuario || '',
          tipo: tipoModal,
          fecha: fechaForm,
          hora: horaForm,
          estado: EstadoSolicitud.INJUSTIFICADA,
          motivo_codigo: null,
          motivo_descripcion: null,
          observaciones: null,
          respaldo_recibido: false,
          tipo_respaldo: null,
          id_token_qr: null,
          curso: estudianteLookup.curso,
        };
        await crearSolicitud(nueva);

        if (tipoModal === TipoRegistro.ATRASO) {
          await justificarAtraso(id_solicitud, codigoMotivo, descripcionMotivo, idUsuario);
        } else {
          await justificarInasistencia(id_solicitud, codigoMotivo, descripcionMotivo, idUsuario, tieneDocumento);
        }
        setEstadoLookup('justificado');
      } else if (solicitudSeleccionada) {
        // Validar que el registro siga existiendo y en estado INASISTENTE
        const actual = solicitudes.find(s => s.id_solicitud === solicitudSeleccionada.id_solicitud);
        if (!actual || actual.estado !== EstadoSolicitud.INASISTENTE) {
          setError('Este registro fue anulado o modificado por otro usuario');
          cerrarModal();
          await refrescarSolicitudes();
          return;
        }

        const tipoCambio = tipoModal !== solicitudSeleccionada.tipo;

        if (tipoModal === TipoRegistro.ATRASO) {
          await justificarAtraso(
            solicitudSeleccionada.id_solicitud,
            codigoMotivo,
            descripcionMotivo,
            idUsuario
          );
        } else {
          await justificarInasistencia(
            solicitudSeleccionada.id_solicitud,
            codigoMotivo,
            descripcionMotivo,
            idUsuario,
            tieneDocumento
          );
        }

        // Si cambió el tipo, actualizar también el tipo en la solicitud
        if (tipoCambio) {
          const { error: errTipo } = await supabase
            .from('solicitudes')
            .update({ tipo: tipoModal })
            .eq('id_solicitud', solicitudSeleccionada.id_solicitud);
          if (errTipo) console.warn('No se pudo actualizar el tipo:', errTipo);
        }

        // Refrescar badge del lookup si es el mismo estudiante
        if (estudianteLookup?.id_estudiante === solicitudSeleccionada.id_estudiante) {
          setEstadoLookup('justificado');
        }
      }

      // Refrescar tabla inmediatamente
      await refrescarSolicitudes();

      cerrarModal();
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido';
      const anulado = mensaje.toLowerCase().includes('anulado') || mensaje.toLowerCase().includes('modificado');
      setError(anulado ? mensaje : `Error al justificar: ${mensaje}`);
      cerrarModal();
      await refrescarSolicitudes().catch(() => {});
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="p-4 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-500">⏳ Cargando…</div>
      </div>
    );
  }

  return (
    <>
      <RegistrarJustificacionUI
        solicitudes={solicitudes}
        estudiantes={estudiantes}
        cursos={cursos}
        profesoresMap={profesoresMap}
        pestanaActiva={pestanaActiva}
        onPestanaChange={setPestanaActiva}
        filtrosCurso={filtrosCurso}
        onFiltroChange={setFiltrosCurso}
        filtroFecha={filtroFecha}
        onFiltroFechaChange={setFiltroFecha}
        paginaActual={paginaActual}
        onPaginaChange={setPaginaActual}
        itemsPorPagina={itemsPorPagina}
        onItemsPorPaginaChange={setItemsPorPagina}
        onFilaClick={abrirModal}
        fechaForm={fechaForm}
        onFechaFormChange={setFechaForm}
        horaForm={horaForm}
        onHoraFormChange={setHoraForm}
        rutLookup={rutLookup}
        onRutLookupChange={setRutLookup}
        onBuscarRut={handleBuscarRut}
        estudianteLookup={estudianteLookup}
        estadoLookup={estadoLookup}
        estadoManual={estadoManual}
        onEstadoManualChange={setEstadoManual}
        onCrearJustificacion={handleCrearJustificacion}
        tipoNuevo={tipoNuevo}
        onTipoNuevoChange={setTipoNuevo}
      />

      {/* MODAL */}
      {modalAbierto && (modoCrear ? !!estudianteLookup : !!solicitudSeleccionada) && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem',
        }} onClick={cerrarModal}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: '#1f2937' }}>
              {modoCrear ? '✍️ Crear y Justificar' : '✍️ Justificar Registro'}
            </h2>

            {/* Estudiante info */}
            <div style={{
              background: '#f3f4f6',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
            }}>
              {modoCrear && estudianteLookup ? (
                <>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '600', color: '#374151' }}>Estudiante: </span>
                    {estudianteLookup.nombre_completo}
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '600', color: '#374151' }}>Curso: </span>
                    {estudianteLookup.curso}
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '600', color: '#374151' }}>Fecha: </span>
                    {fechaForm} a las {horaForm}
                  </div>
                </>
              ) : solicitudSeleccionada ? (
                <>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '600', color: '#374151' }}>Estudiante: </span>
                    {estudiantes.find(e => e.id_estudiante === solicitudSeleccionada.id_estudiante)?.nombre_completo}
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '600', color: '#374151' }}>Fecha: </span>
                    {solicitudSeleccionada.fecha} a las {solicitudSeleccionada.hora}
                  </div>
                </>
              ) : null}

              {/* Selector de tipo */}
              <div style={{
                display: 'flex', gap: 8, marginTop: '0.75rem',
                padding: '0.5rem', background: '#f9fafb', borderRadius: 6,
              }}>
                <label style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  padding: '6px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: tipoModal === TipoRegistro.ATRASO ? '#FCD34D' : '#f3f4f6',
                  color: tipoModal === TipoRegistro.ATRASO ? '#92400E' : '#6b7280',
                  border: tipoModal === TipoRegistro.ATRASO ? '2px solid #F59E0B' : '2px solid transparent',
                }}>
                  <input type="radio" name="tipoModal" checked={tipoModal === TipoRegistro.ATRASO}
                    onChange={() => { setTipoModal(TipoRegistro.ATRASO); setMotivoSeleccionado(''); }}
                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                  🕐 Atraso
                </label>
                <label style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  padding: '6px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: tipoModal === TipoRegistro.INASISTENCIA ? '#FCA5A5' : '#f3f4f6',
                  color: tipoModal === TipoRegistro.INASISTENCIA ? '#991B1B' : '#6b7280',
                  border: tipoModal === TipoRegistro.INASISTENCIA ? '2px solid #EF4444' : '2px solid transparent',
                }}>
                  <input type="radio" name="tipoModal" checked={tipoModal === TipoRegistro.INASISTENCIA}
                    onChange={() => { setTipoModal(TipoRegistro.INASISTENCIA); setMotivoSeleccionado(''); }}
                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                  ❌ Inasistencia
                </label>
              </div>
            </div>

            {/* Motivo */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                Motivo de Justificación *
              </label>
              {(() => {
                const motivosFiltrados = motivos.filter(m => !tipoModal || m.tipo_registro === tipoModal);
                return motivosFiltrados.length === 0 ? (
                  <div style={{
                    background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '8px',
                    padding: '1rem', fontSize: '0.875rem', color: '#92400E',
                  }}>
                    No hay motivos de tipo "{tipoModal}" disponibles.
                    Ve a <strong>Mantenedores &gt; Justificaciones</strong> para agregarlos.
                  </div>
                ) : (
                <>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                  Digita el número del motivo (1-{motivosFiltrados.length}) o selecciona de la lista:
                </p>
                <select
                  ref={selectMotivoRef}
                  value={motivoSeleccionado}
                  onChange={(e) => {
                    setMotivoSeleccionado(e.target.value);
                  }}
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
                  {motivosFiltrados.map((m, index) => (
                    <option key={m.id_motivo} value={m.id_motivo}>
                      {index + 1}. {m.codigo} - {m.descripcion}
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
              </>);})()}
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '0.75rem',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.875rem',
              }}>
                {error}
              </div>
            )}

            {/* Botones */}
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
                  cursor: guardando || !motivoSeleccionado ? 'not-allowed' : 'pointer',
                  opacity: guardando || !motivoSeleccionado ? 0.6 : 1,
                }}
              >
                {guardando ? '⏳ Guardando...' : modoCrear ? '✅ Crear y Justificar' : '✅ Justificar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
