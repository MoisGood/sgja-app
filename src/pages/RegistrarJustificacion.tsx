import { useState, useEffect, useRef } from 'react';
import { RegistrarJustificacionUI } from '../components/RegistrarJustificacion';
import {
  obtenerEstudiantesDelEstablecimiento,
  obtenerCursosDelEstablecimiento,
  obtenerMotivosDelEstablecimiento,
  justificarSolicitud,
  escucharSolicitudesInjustificadas,
  escucharSolicitudesJustificadas,
} from '../services/database';
import type { Estudiante, Solicitud, MotivoJustificacion } from '../types';
import { EstadoSolicitud } from '../types';

interface Props {
  idEstablecimiento: string;
  idUsuario?: string;
}

export default function RegistrarJustificacion({ idEstablecimiento, idUsuario = '' }: Props) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [cursos, setCursos] = useState<string[]>([]);
  const [motivos, setMotivos] = useState<MotivoJustificacion[]>([]);
  const [filtrosCurso, setFiltrosCurso] = useState<string>('');
  const [cargando, setCargando] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const [busquedaRut, setBusquedaRut] = useState('');
  const [pestanaActiva, setPestanaActiva] = useState<'todos' | 'injustificados' | 'justificados'>('todos');
  const [filtroFecha, setFiltroFecha] = useState<string>('');
  const [itemsPorPagina, setItemsPorPagina] = useState(10);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<Solicitud | null>(null);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<string>('');
  const [tieneDocumento, setTieneDocumento] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectMotivoRef = useRef<HTMLSelectElement>(null);

  // ── Cargar datos iniciales y escuchar cambios en tiempo real ──
  useEffect(() => {
    let unsubscribeInjustificadas: () => void = () => {};
    let unsubscribeJustificadas: () => void = () => {};

    const cargarDatosIniciales = async () => {
      try {
        setCargando(true);
        
        // Cargar datos estáticos
        const [estudiantesData, cursosData, motivosData] = await Promise.all([
          obtenerEstudiantesDelEstablecimiento(idEstablecimiento).catch(() => []),
          obtenerCursosDelEstablecimiento(idEstablecimiento).catch(() => []),
          obtenerMotivosDelEstablecimiento(idEstablecimiento).catch(() => []),
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

        // Configurar listeners para ambas colecciones
        unsubscribeInjustificadas = escucharSolicitudesInjustificadas(
          idEstablecimiento,
          (injustificadasData) => {
            setSolicitudes((prevSolicitudes) => {
              // Combinar con justificadas existentes
              const justificadas = prevSolicitudes.filter(s => s.estado === EstadoSolicitud.JUSTIFICADA);
              return [...injustificadasData, ...justificadas];
            });
          }
        );

        unsubscribeJustificadas = escucharSolicitudesJustificadas(
          idEstablecimiento,
          (justificadasData) => {
            setSolicitudes((prevSolicitudes) => {
              // Combinar con injustificadas existentes
              const injustificadas = prevSolicitudes.filter(s => s.estado === EstadoSolicitud.INJUSTIFICADA);
              return [...injustificadas, ...justificadasData];
            });
          }
        );

        setCargando(false);
      } catch (err) {
        console.error(err);
        setCargando(false);
      }
    };

    cargarDatosIniciales();

    // Limpiar listeners al desmontar
    return () => {
      unsubscribeInjustificadas();
      unsubscribeJustificadas();
    };
  }, [idEstablecimiento]);

  const abrirModal = (solicitud: Solicitud) => {
    if (solicitud.estado === EstadoSolicitud.INJUSTIFICADA) {
      setSolicitudSeleccionada(solicitud);
      setModalAbierto(true);
      setMotivoSeleccionado('');
      setError(null);
      // Hacer focus en el select cuando se abre el modal
      setTimeout(() => {
        selectMotivoRef.current?.focus();
      }, 0);
    }
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setSolicitudSeleccionada(null);
    setMotivoSeleccionado('');
    setError(null);
  };

  const handleJustificar = async () => {
    if (!solicitudSeleccionada) return;
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

      // Justificar la solicitud (crea en justificadas, elimina de injustificadas)
      await justificarSolicitud(
        solicitudSeleccionada.id_solicitud,
        solicitudSeleccionada,
        codigoMotivo,
        descripcionMotivo,
        idUsuario  // Pasar el ID del usuario (inspector/paradocente) que justifica
      );

      // Actualizar localmente: eliminar de la lista
      setSolicitudes(prev =>
        prev.filter(s => s.id_solicitud !== solicitudSeleccionada.id_solicitud)
      );

      cerrarModal();
    } catch (err) {
      setError(`Error al justificar: ${err instanceof Error ? err.message : 'Error desconocido'}`);
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
        pestanaActiva={pestanaActiva}
        onPestanaChange={setPestanaActiva}
        busquedaRut={busquedaRut}
        onBusquedaChange={setBusquedaRut}
        filtrosCurso={filtrosCurso}
        onFiltroChange={setFiltrosCurso}
        filtroFecha={filtroFecha}
        onFiltroFechaChange={setFiltroFecha}
        paginaActual={paginaActual}
        onPaginaChange={setPaginaActual}
        itemsPorPagina={itemsPorPagina}
        onItemsPorPaginaChange={setItemsPorPagina}
        onFilaClick={abrirModal}
      />

      {/* MODAL */}
      {modalAbierto && solicitudSeleccionada && (
        <button type="button" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem',
          border: 'none',
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
              ✍️ Justificar Registro
            </h2>

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

            {/* Motivo */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                Motivo de Justificación *
              </label>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                Digita el número del motivo (1-{motivos.length}) o selecciona de la lista:
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
                {guardando ? '⏳ Guardando...' : '✅ Justificar'}
              </button>
            </div>
          </div>
        </button>
      )}
    </>
  );
}
