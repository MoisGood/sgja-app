import { supabase } from '../lib/supabase';
import type { Solicitud } from '../types';
import { EstadoSolicitud } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────

function mapOldEstado(estado: string): string {
  const map: Record<string, string> = {
    'PENDIENTE': 'INASISTENTE',
    'INJUSTIFICADA': 'INASISTENTE',
    'JUSTIFICADA': 'INASISTENCIA_JUSTIFICADA',
    'RECHAZADA': 'INASISTENCIA_NO_JUSTIFICADA',
    'No presentada': 'NO_PRESENTADA',
    'Injustificada': 'INASISTENTE',
    'Justificada': 'INASISTENCIA_JUSTIFICADA',
    'Rechazada': 'INASISTENCIA_NO_JUSTIFICADA',
  };
  return map[estado] || estado;
}

function mapOldTipo(tipo: string): string {
  if (tipo === 'AUSENCIA' || tipo === 'JUSTIFICADA' || tipo === 'RETIRO') return 'INASISTENCIA';
  return tipo;
}

function prepareSolicitud(s: any): Solicitud {
  return {
    ...s,
    estado: (mapOldEstado(s.estado) || s.estado) as EstadoSolicitud,
    tipo: (mapOldTipo(s.tipo) || s.tipo) as any,
  } as Solicitud;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function obtenerSolicitud(idSolicitud: string): Promise<Solicitud | null> {
  try {
    const { data, error } = await supabase
      .from('solicitudes')
      .select('*')
      .eq('id_solicitud', idSolicitud)
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return prepareSolicitud(data);
  } catch (error) {
    console.error('Error al obtener solicitud:', error);
    throw error;
  }
}

export async function obtenerSolicitudesPorEstudiante(
  idEstudiante: string
): Promise<Solicitud[]> {
  try {
    const { data, error } = await supabase
      .from('solicitudes')
      .select('*')
      .eq('id_estudiante', idEstudiante)
      .eq('activo', true)
      .order('fecha', { ascending: false });
    if (error) throw error;
    return (data || []).map(prepareSolicitud);
  } catch (error) {
    console.error('Error al obtener solicitudes del estudiante:', error);
    throw error;
  }
}

export async function obtenerSolicitudesDelEstablecimiento(
  idEstablecimiento: string,
  estado?: EstadoSolicitud,
  limitResultados?: number,
  idProfesor?: string
): Promise<Solicitud[]> {
  try {
    let query = supabase
      .from('solicitudes')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('activo', true);

    if (idProfesor) {
      query = query.eq('id_profesor', idProfesor);
    }
    if (estado) {
      query = query.eq('estado', estado);
    }

    query = query.order('fecha', { ascending: false });

    if (limitResultados) {
      query = query.limit(limitResultados);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(prepareSolicitud);
  } catch (error) {
    console.error('Error al obtener solicitudes del establecimiento:', error);
    return [];
  }
}

export async function crearSolicitud(solicitud: Solicitud): Promise<void> {
  try {
    const record = {
      id_solicitud: solicitud.id_solicitud,
      id_establecimiento: solicitud.id_establecimiento,
      id_estudiante: solicitud.id_estudiante,
      id_profesor: solicitud.id_profesor || null,
      tipo: solicitud.tipo,
      estado: EstadoSolicitud.INASISTENTE,
      fecha: solicitud.fecha,
      hora: solicitud.hora || null,
      id_bloque: solicitud.id_bloque || null,
      curso: solicitud.curso || null,
      motivo_codigo: solicitud.motivo_codigo || null,
      motivo_descripcion: solicitud.motivo_descripcion || null,
      observaciones: solicitud.observaciones || null,
      respaldo_recibido: solicitud.respaldo_recibido || false,
      tipo_respaldo: solicitud.tipo_respaldo || null,
      id_token_qr: solicitud.id_token_qr || null,
      bloques_afectados: solicitud.bloques_afectados || 1,
    };

    const { error } = await supabase.from('solicitudes').insert([record]);
    if (error) throw error;
  } catch (error) {
    console.error('Error al crear solicitud:', error);
    throw error;
  }
}

// ── Actualización de estado (unificado) ──────────────────────────────────

export async function actualizarEstadoSolicitud(
  idSolicitud: string,
  nuevoEstado: EstadoSolicitud,
  datos?: {
    id_inspector_justificador?: string;
    motivo_codigo?: string;
    motivo_descripcion?: string;
    observaciones?: string;
    respaldo_recibido?: boolean;
    tipo_respaldo?: string;
  }
): Promise<void> {
  try {
    const updateData: Record<string, any> = {
      estado: nuevoEstado,
      actualizado_en: new Date().toISOString(),
    };

    if (datos?.id_inspector_justificador) {
      updateData.id_inspector_justificador = datos.id_inspector_justificador;
      updateData.hora_justificacion = new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
    }
    if (datos?.motivo_codigo) updateData.motivo_codigo = datos.motivo_codigo;
    if (datos?.motivo_descripcion) updateData.motivo_descripcion = datos.motivo_descripcion;
    if (datos?.observaciones !== undefined) updateData.observaciones = datos.observaciones;
    if (datos?.respaldo_recibido !== undefined) updateData.respaldo_recibido = datos.respaldo_recibido;
    if (datos?.tipo_respaldo) updateData.tipo_respaldo = datos.tipo_respaldo;

    const { error } = await supabase
      .from('solicitudes')
      .update(updateData)
      .eq('id_solicitud', idSolicitud);

    if (error) throw error;
  } catch (error) {
    console.error('Error al actualizar estado de solicitud:', error);
    throw error;
  }
}

// ── Acciones de dominio ─────────────────────────────────────────────────

/** Paradocente justifica un atraso (estudiante llegó tarde con justificación) */
export async function justificarAtraso(
  idSolicitud: string,
  motivoCodigo: string,
  motivoDescripcion: string,
  idInspectorJustificador: string,
  observaciones?: string
): Promise<void> {
  await actualizarEstadoSolicitud(idSolicitud, EstadoSolicitud.ATRASO_JUSTIFICADO, {
    id_inspector_justificador: idInspectorJustificador,
    motivo_codigo: motivoCodigo,
    motivo_descripcion: motivoDescripcion,
    observaciones,
  });
}

/** Paradocente marca atraso sin justificación */
export async function marcarAtrasoInjustificado(
  idSolicitud: string,
  idInspectorJustificador: string,
  observaciones?: string
): Promise<void> {
  await actualizarEstadoSolicitud(idSolicitud, EstadoSolicitud.ATRASO_INJUSTIFICADO, {
    id_inspector_justificador: idInspectorJustificador,
    observaciones,
  });
}

/** Paradocente justifica inasistencia con documento */
export async function justificarInasistencia(
  idSolicitud: string,
  motivoCodigo: string,
  motivoDescripcion: string,
  idInspectorJustificador: string,
  respaldoRecibido?: boolean,
  observaciones?: string
): Promise<void> {
  await actualizarEstadoSolicitud(idSolicitud, EstadoSolicitud.INASISTENCIA_JUSTIFICADA, {
    id_inspector_justificador: idInspectorJustificador,
    motivo_codigo: motivoCodigo,
    motivo_descripcion: motivoDescripcion,
    respaldo_recibido: respaldoRecibido || false,
    observaciones,
  });
}

/** Paradocente deja inasistencia como no justificada */
export async function rechazarInasistencia(
  idSolicitud: string,
  idInspectorJustificador: string,
  observaciones?: string
): Promise<void> {
  await actualizarEstadoSolicitud(idSolicitud, EstadoSolicitud.INASISTENCIA_NO_JUSTIFICADA, {
    id_inspector_justificador: idInspectorJustificador,
    observaciones,
  });
}

/** Profesor anula un pase */
export async function anularSolicitud(idSolicitud: string): Promise<void> {
  await actualizarEstadoSolicitud(idSolicitud, EstadoSolicitud.NO_PRESENTADA);
}

// ── Backward compatibility ──────────────────────────────────────────────

/** @deprecated Usar justificarAtraso/justificarInasistencia según corresponda */
export async function justificarSolicitud(
  idSolicitud: string,
  solicitud: Partial<Solicitud>,
  motivoCodigo: string,
  motivoDescripcion: string
): Promise<void> {
  const tipo = solicitud.tipo;
  const esAtraso = tipo === 'ATRASO';
  if (esAtraso) {
    await justificarAtraso(idSolicitud, motivoCodigo, motivoDescripcion, solicitud.id_inspector_justificador || '');
  } else {
    await justificarInasistencia(idSolicitud, motivoCodigo, motivoDescripcion, solicitud.id_inspector_justificador || '');
  }
}

/** @deprecated Usar actualizarEstadoSolicitud directamente */
export async function actualizarSolicitud(
  idSolicitud: string,
  datos: { estado: string; motivo_codigo?: string; motivo_descripcion?: string; observaciones?: string | null; tipo_respaldo?: string | null }
): Promise<void> {
  await actualizarEstadoSolicitud(idSolicitud, datos.estado as EstadoSolicitud, {
    motivo_codigo: datos.motivo_codigo,
    motivo_descripcion: datos.motivo_descripcion,
    observaciones: datos.observaciones ?? undefined,
    tipo_respaldo: datos.tipo_respaldo ?? undefined,
  });
}

// ── Eliminación (soft delete) ────────────────────────────────────────────

export async function eliminarSolicitudesPorEstudianteYFecha(
  idEstudiante: string,
  fecha: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('solicitudes')
      .update({ activo: false, actualizado_en: new Date().toISOString() })
      .eq('id_estudiante', idEstudiante)
      .eq('fecha', fecha);
    if (error) throw error;
  } catch (error) {
    console.error('Error al eliminar solicitudes:', error);
    throw error;
  }
}

export async function eliminarSolicitudPorId(idSolicitud: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('solicitudes')
      .update({ activo: false, actualizado_en: new Date().toISOString() })
      .eq('id_solicitud', idSolicitud);
    if (error) console.warn('No se encontró solicitud para eliminar');
  } catch (error) {
    console.error('Error al eliminar solicitud:', error);
    throw error;
  }
}

// ── Realtime ────────────────────────────────────────────────────────────

export function escucharSolicitudes(
  idEstablecimiento: string,
  callback: (solicitudes: Solicitud[]) => void
): () => void {
  try {
    const subscription = supabase
      .channel(`solicitudes:${idEstablecimiento}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'solicitudes',
          filter: `id_establecimiento=eq.${idEstablecimiento}`,
        },
        async () => {
          const { data } = await supabase
            .from('solicitudes')
            .select('*')
            .eq('id_establecimiento', idEstablecimiento)
            .eq('activo', true);
          callback((data || []).map(prepareSolicitud));
        }
      )
      .subscribe();

    return () => { subscription.unsubscribe(); };
  } catch (error) {
    console.error('Error al configurar listener:', error);
    return () => {};
  }
}
