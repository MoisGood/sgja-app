import { supabase } from '../lib/supabase';
import type { Solicitud } from '../types';
import { EstadoSolicitud } from '../types';

export async function obtenerSolicitud(idSolicitud: string): Promise<Solicitud | null> {
  try {
    let { data, error } = await supabase
      .from('justificadas')
      .select('*')
      .eq('id', idSolicitud)
      .single();

    if (!error) return data as Solicitud;

    ({ data, error } = await supabase
      .from('injustificadas')
      .select('*')
      .eq('id', idSolicitud)
      .single());

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data as Solicitud;
  } catch (error) {
    console.error('Error al obtener solicitud:', error);
    throw error;
  }
}

export async function obtenerSolicitudesPorEstudiante(
  idEstudiante: string
): Promise<Solicitud[]> {
  try {
    const [{ data: justificadas, error: error1 }, { data: injustificadas, error: error2 }] = await Promise.all([
      supabase.from('justificadas').select('*').eq('id_estudiante', idEstudiante),
      supabase.from('injustificadas').select('*').eq('id_estudiante', idEstudiante),
    ]);

    if (error1) throw error1;
    if (error2) throw error2;

    const solicitudes = [...(justificadas || []), ...(injustificadas || [])];
    solicitudes.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    return solicitudes as Solicitud[];
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
    const [{ data: justificadas, error: error1 }, { data: injustificadas, error: error2 }] = await Promise.all([
      supabase.from('justificadas').select('*').eq('id_establecimiento', idEstablecimiento),
      supabase.from('injustificadas').select('*').eq('id_establecimiento', idEstablecimiento),
    ]);

    if (error1) throw error1;
    if (error2) throw error2;

    let solicitudes: Solicitud[] = [...(justificadas || []), ...(injustificadas || [])];

    if (idProfesor) {
      solicitudes = solicitudes.filter(s => s.id_profesor === idProfesor);
    }

    if (estado) {
      solicitudes = solicitudes.filter(s => s.estado === estado);
    }

    solicitudes.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    if (limitResultados) {
      solicitudes = solicitudes.slice(0, limitResultados);
    }

    return solicitudes as Solicitud[];
  } catch (error) {
    console.error('Error al obtener solicitudes del establecimiento:', error);
    return [];
  }
}

export async function crearSolicitud(solicitud: Solicitud): Promise<void> {
  try {
    const table = solicitud.estado === EstadoSolicitud.JUSTIFICADA ? 'justificadas' : 'injustificadas';
    const { error } = await supabase
      .from(table)
      .insert([solicitud]);

    if (error) throw error;
  } catch (error) {
    console.error('Error al crear solicitud:', error);
    throw error;
  }
}

export async function eliminarSolicitudesInjustificadas(
  idEstudiante: string,
  fecha: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('injustificadas')
      .delete()
      .eq('id_estudiante', idEstudiante)
      .eq('fecha', fecha);

    if (error) throw error;
  } catch (error) {
    console.error('Error al eliminar solicitudes injustificadas:', error);
    throw error;
  }
}

export async function justificarSolicitud(
  solicitudId: string,
  solicitud: Solicitud,
  motivoCodigo?: string,
  motivoDescripcion?: string,
  idInspectorJustificador?: string
): Promise<void> {
  try {
    const ahora = new Date();
    const horaJustificacion = ahora.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const solicitudJustificada: Solicitud = {
      ...solicitud,
      estado: EstadoSolicitud.JUSTIFICADA,
      ...(motivoCodigo && { motivo_codigo: motivoCodigo }),
      ...(motivoDescripcion && { motivo_descripcion: motivoDescripcion }),
      ...(idInspectorJustificador && { id_inspector_justificador: idInspectorJustificador }),
      hora_justificacion: horaJustificacion,
    };

    const [{ error: insertError }, { error: deleteError }] = await Promise.all([
      supabase.from('justificadas').insert([solicitudJustificada]),
      supabase.from('injustificadas').delete().eq('id', solicitudId),
    ]);

    if (insertError) throw insertError;
    if (deleteError) throw deleteError;
  } catch (error) {
    console.error('Error al justificar solicitud:', error);
    throw error;
  }
}

export async function actualizarEstadoSolicitud(
  idSolicitud: string,
  nuevoEstado: EstadoSolicitud
): Promise<void> {
  try {
    let { error } = await supabase
      .from('justificadas')
      .update({ estado: nuevoEstado })
      .eq('id', idSolicitud);

    if (!error) return;

    ({ error } = await supabase
      .from('injustificadas')
      .update({ estado: nuevoEstado })
      .eq('id', idSolicitud));

    if (error) throw error;
  } catch (error) {
    console.error('Error al actualizar solicitud:', error);
    throw error;
  }
}

export async function actualizarSolicitud(
  idSolicitud: string,
  datos: Partial<Solicitud>,
  coleccion: 'injustificadas' | 'justificadas' = 'injustificadas'
): Promise<void> {
  try {
    const { error } = await supabase
      .from(coleccion)
      .update(datos)
      .eq('id', idSolicitud);

    if (error) throw error;
  } catch (error) {
    console.error('Error al actualizar solicitud:', error);
    throw error;
  }
}

export async function eliminarSolicitudPorId(idSolicitud: string): Promise<void> {
  try {
    let { error } = await supabase
      .from('justificadas')
      .delete()
      .eq('id', idSolicitud);

    if (!error) return;

    ({ error } = await supabase
      .from('injustificadas')
      .delete()
      .eq('id', idSolicitud));

    if (error) console.warn('⚠️ No se encontró solicitud para eliminar');
  } catch (error) {
    console.error('Error al eliminar solicitud:', error);
    throw error;
  }
}
