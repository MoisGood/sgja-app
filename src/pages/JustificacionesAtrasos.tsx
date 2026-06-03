// ============================================================
// SGJA – Justificaciones de Atrasos e Inasistencias
// src/pages/JustificacionesAtrasos.tsx
// ============================================================

import { useState, useEffect } from 'react';
import {
  obtenerEstudiantesDelEstablecimiento,
  obtenerMotivosDelEstablecimiento,
  actualizarSolicitud,
  escucharSolicitudesInjustificadas,
} from '../services/database';
import type { Estudiante, Solicitud, MotivoJustificacion } from '../types';
import { EstadoSolicitud } from '../types';
import { esAtraso, esInasistencia } from '../utils/tipoRegistroHelper';

interface Props {
  idEstablecimiento: string;
}

interface ModalState {
  abierto: boolean;
  solicitud: Solicitud | null;
}

interface FormJustificacion {
  motivo_codigo: string;
  observaciones: string;
  respaldo_url: string | null;
}

const ITEMS_POR_PAGINA = 10;

export default function JustificacionesAtrasos({ idEstablecimiento }: Props) {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [motivos, setMotivos] = useState<MotivoJustificacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [modal, setModal] = useState<ModalState>({ abierto: false, solicitud: null });
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'ATRASO' | 'INASISTENCIA'>('TODOS');

  const [formJustificacion, setFormJustificacion] = useState<FormJustificacion>({
    motivo_codigo: '',
    observaciones: '',
    respaldo_url: null,
  });

  // ── Cargar datos iniciales y escuchar cambios en tiempo real ──
  useEffect(() => {
    let unsubscribeSolicitudes: () => void = () => {};

    const cargarDatosIniciales = async () => {
      try {
        setCargando(true);
        
        // Cargar datos estáticos (estudiantes y motivos)
        const [estudiantesData, motivosData] = await Promise.all([
          obtenerEstudiantesDelEstablecimiento(idEstablecimiento).catch(() => []),
          obtenerMotivosDelEstablecimiento(idEstablecimiento).catch(() => []),
        ]);

        setEstudiantes(estudiantesData);
        setMotivos(motivosData);

        // Configurar listener para solicitudes INJUSTIFICADAS en tiempo real
        unsubscribeSolicitudes = escucharSolicitudesInjustificadas(
          idEstablecimiento,
          (solicitudesData) => {
            setSolicitudes(solicitudesData);
          }
        );

        setCargando(false);
      } catch (err) {
        setError('Error al cargar datos');
        console.error(err);
        setCargando(false);
      }
    };

    cargarDatosIniciales();

    // Limpiar listener al desmontar componente
    return () => {
      unsubscribeSolicitudes();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idEstablecimiento]);

  const abrirModal = (solicitud: Solicitud) => {
    setModal({ abierto: true, solicitud });
    setFormJustificacion({
      motivo_codigo: solicitud.motivo_codigo || '',
      observaciones: solicitud.observaciones || '',
      respaldo_url: solicitud.tipo_respaldo || null,
    });
  };

  const cerrarModal = () => {
    setModal({ abierto: false, solicitud: null });
    setFormJustificacion({
      motivo_codigo: '',
      observaciones: '',
      respaldo_url: null,
    });
  };

  const handleJustificar = async () => {
    if (!modal.solicitud || !formJustificacion.motivo_codigo) {
      setError('Debes seleccionar un motivo');
      return;
    }

    try {
      setGuardando(true);
      setError(null);

      const motivoSeleccionado = motivos.find(m => m.id_motivo === formJustificacion.motivo_codigo);

      await actualizarSolicitud(modal.solicitud.id_solicitud, {
        estado: EstadoSolicitud.JUSTIFICADA,
        motivo_codigo: formJustificacion.motivo_codigo,
        motivo_descripcion: motivoSeleccionado?.descripcion || '',
        observaciones: formJustificacion.observaciones || null,
        tipo_respaldo: formJustificacion.respaldo_url,
      });

      // Actualizar localmente para reflejo inmediato
      setSolicitudes(prev => 
        prev.filter(s => s.id_solicitud !== modal.solicitud!.id_solicitud)
      );

      setExito(true);
      cerrarModal();
      setTimeout(() => setExito(false), 3000);
    } catch (err) {
      setError(`Error al justificar: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleRechazar = async (solicitud: Solicitud) => {
    if (!confirm('¿Estás seguro de que deseas rechazar esta justificación?')) return;

    try {
      await actualizarSolicitud(solicitud.id_solicitud, {
        estado: EstadoSolicitud.RECHAZADA,
      });

      // Actualizar localmente para reflejo inmediato
      setSolicitudes(prev => 
        prev.filter(s => s.id_solicitud !== solicitud.id_solicitud)
      );

      setExito(true);
      cerrarModal();
      setTimeout(() => setExito(false), 3000);
    } catch (err) {
      setError(`Error al rechazar: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  // Filtrar solo INJUSTIFICADAS
  const injustificadas = solicitudes.filter(s => s.estado === EstadoSolicitud.INJUSTIFICADA);

  // Aplicar filtro por tipo
  const filtradas =
    filtroTipo === 'TODOS'
      ? injustificadas
      : filtroTipo === 'ATRASO'
        ? injustificadas.filter(s => esAtraso(s.tipo))
        : injustificadas.filter(s => esInasistencia(s.tipo));

  // Paginar
  const totalPaginas = Math.ceil(filtradas.length / ITEMS_POR_PAGINA);
  const solicitudosPaginadas = filtradas
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice((paginaActual - 1) * ITEMS_POR_PAGINA, paginaActual * ITEMS_POR_PAGINA);

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center text-xl text-blue-600 font-bold">⏳ Cargando…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
          {/* Título */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-2">
              Justificaciones de Atrasos e Inasistencias
            </h1>
            <p className="text-gray-600">Total de injustificados: <span className="font-bold text-blue-600">{injustificadas.length}</span></p>
          </div>
          {/* Filtros */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button type="button" 
              onClick={() => { setFiltroTipo('TODOS'); setPaginaActual(1); }}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                filtroTipo === 'TODOS'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos ({injustificadas.length})
            </button>
            <button type="button" 
              onClick={() => { setFiltroTipo('ATRASO'); setPaginaActual(1); }}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                filtroTipo === 'ATRASO'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Atrasos ({injustificadas.filter(s => esAtraso(s.tipo)).length})
            </button>
            <button type="button" 
              onClick={() => { setFiltroTipo('INASISTENCIA'); setPaginaActual(1); }}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                filtroTipo === 'INASISTENCIA'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inasistencias ({injustificadas.filter(s => esInasistencia(s.tipo)).length})
            </button>
          </div>

          {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 font-semibold">{error}</div>}
          {exito && <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 font-semibold">✅ Acción completada exitosamente</div>}

          {solicitudosPaginadas.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay atrasos o inasistencias sin justificar</p>
          ) : (
            <>
              {/* Tabla de solicitudes */}
              <div className="overflow-x-auto mb-6">
                <div className="min-w-full">
                  {/* Encabezado */}
                  <div className="hidden md:grid md:grid-cols-6 gap-3 px-4 py-3 bg-gray-50 font-bold text-sm text-gray-700 border-b-2 border-gray-200 rounded-t-lg">
                    <div>Estudiante</div>
                    <div>RUT</div>
                    <div>Curso</div>
                    <div>Tipo</div>
                    <div>Fecha</div>
                    <div>Acciones</div>
                  </div>

                  {/* Filas */}
                  {solicitudosPaginadas.map((sol) => {
                    const est = estudiantes.find(e => e.id_estudiante === sol.id_estudiante);
                    return (
                      <div key={sol.id_solicitud} className="md:grid md:grid-cols-6 md:gap-3 md:px-4 md:py-3 md:border-b md:border-gray-100 md:hover:bg-blue-50 md:transition-colors flex flex-col gap-2 p-3 border-b border-gray-100 bg-white md:bg-transparent">
                        <div className="md:auto">
                          <span className="md:hidden text-xs font-bold text-gray-500 mr-2">Estudiante:</span>
                          <strong className="text-sm">{est?.nombre_completo}</strong>
                        </div>
                        <div className="md:auto">
                          <span className="md:hidden text-xs font-bold text-gray-500 mr-2">RUT:</span>
                          <span className="text-sm">{est?.rut}</span>
                        </div>
                        <div className="md:auto">
                          <span className="md:hidden text-xs font-bold text-gray-500 mr-2">Curso:</span>
                          <span className="text-sm">{est?.curso}</span>
                        </div>
                        <div className="md:auto">
                          <span className="md:hidden text-xs font-bold text-gray-500 mr-2">Tipo:</span>
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                            esAtraso(sol.tipo)
                              ? 'bg-yellow-100 text-yellow-900'
                              : 'bg-red-100 text-red-900'
                          }`}>
                            {sol.tipo}
                          </span>
                        </div>
                        <div className="md:auto">
                          <span className="md:hidden text-xs font-bold text-gray-500 mr-2">Fecha:</span>
                          <strong className="text-sm">{sol.fecha}</strong><br/>
                          <small className="text-gray-500">{sol.hora}</small>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" 
                            onClick={() => abrirModal(sol)}
                            className="flex-1 md:flex-none px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 border border-blue-200 font-semibold text-sm transition-colors"
                          >
                            ✓ Justificar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Paginador */}
              {totalPaginas > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6 pt-6 border-t border-gray-200">
                  <button type="button" 
                    onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                    disabled={paginaActual === 1}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm hover:bg-gray-300"
                  >
                    ◀ Anterior
                  </button>
                  <span className="font-semibold text-gray-700">
                    Página {paginaActual} de {totalPaginas}
                  </span>
                  <button type="button" 
                    onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                    disabled={paginaActual === totalPaginas}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm hover:bg-gray-300"
                  >
                    Siguiente ▶
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MODAL: JUSTIFICAR */}
      {modal.abierto && modal.solicitud && (
        <button type="button" className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={cerrarModal}>
          <div className="bg-white rounded-xl p-6 md:p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              Justificar {modal.solicitud.tipo}
            </h2>

            <div className="space-y-4">
              {/* Datos del estudiante */}
              <div className="p-3 md:p-4 bg-gray-100 rounded-lg text-sm md:text-base">
                <p className="mb-2">
                  <strong>Estudiante:</strong> {' '}
                  {estudiantes.find(e => e.id_estudiante === modal.solicitud!.id_estudiante)
                    ?.nombre_completo}
                </p>
                <p>
                  <strong>Fecha:</strong> {modal.solicitud.fecha} a las {modal.solicitud.hora}
                </p>
              </div>

              {/* Motivo */}
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-700 text-sm md:text-base">Motivo de Justificación *</label>
                <select
                  value={formJustificacion.motivo_codigo}
                  onChange={(e) =>
                    setFormJustificacion({ ...formJustificacion, motivo_codigo: e.target.value })
                  }
                  className="w-full px-3 md:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base bg-white"
                >
                  <option value="">-- Selecciona un motivo --</option>
                  {motivos.map((m) => (
                    <option key={m.id_motivo} value={m.id_motivo}>
                      {m.descripcion}
                    </option>
                  ))}
                </select>
              </div>

              {/* Observaciones */}
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-700 text-sm md:text-base">Observaciones</label>
                <textarea
                  value={formJustificacion.observaciones}
                  onChange={(e) =>
                    setFormJustificacion({ ...formJustificacion, observaciones: e.target.value })
                  }
                  placeholder="Agrega detalles adicionales..."
                  className="w-full px-3 md:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-20 resize-vertical text-sm md:text-base"
                />
              </div>

              {/* Respaldo */}
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-700 text-sm md:text-base">Respaldo (opcional)</label>
                <input
                  type="text"
                  value={formJustificacion.respaldo_url || ''}
                  onChange={(e) =>
                    setFormJustificacion({ ...formJustificacion, respaldo_url: e.target.value })
                  }
                  placeholder="URL del respaldo o documento"
                  className="w-full px-3 md:px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                />
                <small className="text-gray-500 text-xs md:text-sm">Ej: URL de foto, PDF, enlace compartido</small>
              </div>

              {/* Botones */}
              <div className="flex gap-2 md:gap-3 mt-6">
                <button type="button" 
                  onClick={cerrarModal}
                  className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold text-sm md:text-base transition-colors"
                >
                  Cancelar
                </button>
                <button type="button" 
                  onClick={() => handleRechazar(modal.solicitud!)}
                  disabled={guardando}
                  className="flex-1 px-4 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold text-sm md:text-base border border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ✕ Rechazar
                </button>
                <button type="button" 
                  onClick={handleJustificar}
                  disabled={guardando || !formJustificacion.motivo_codigo}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg font-semibold text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {guardando ? '⏳ Guardando...' : '✓ Justificar'}
                </button>
              </div>
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
