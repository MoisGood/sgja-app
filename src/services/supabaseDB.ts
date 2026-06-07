// ============================================================
// SGJA – Servicios de Base de Datos con Supabase
// src/services/supabaseDB.ts
// ============================================================

import { supabase } from '../lib/supabase';
import { cacheService } from './cacheService';
import { handleError } from '../utils/errorHandler';

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────

export interface UsuarioDB {
  id: string;
  uid: string;
  email: string;
  nombre: string;
  apellidos: string | null;
  rol: string;
  id_establecimiento: string | null;
  activo: boolean;
  foto_url: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface EstudianteDB {
  id: string;
  id_estudiante: string;
  nombre_completo: string;
  email: string | null;
  curso: string;
  id_establecimiento: string | null;
  id_apoderado: string | null;
  activo: boolean;
}

export interface EstablecimientoDB {
  id: string;
  nombre: string;
  codigo: string;
  region: string | null;
  activo: boolean;
  creado_en: string;
}

export interface SolicitudDB {
  id: string;
  id_solicitud: string;
  id_estudiante: string;
  id_profesor: string | null;
  id_profesor_nombre: string | null;
  tipo: string;
  estado: string;
  fecha: string;
  hora: string | null;
  id_bloque: string | null;
  curso: string | null;
  id_establecimiento: string | null;
  motivo_codigo: string | null;
  motivo_descripcion: string | null;
  observaciones: string | null;
  respaldo_recibido: boolean;
  id_inspector_justificador: string | null;
  hora_justificacion: string | null;
  creado_en: string;
}

export interface BloqueHorarioDB {
  id: string;
  id_bloque: string;
  nombre_bloque: string;
  hora_inicio: string;
  hora_fin: string;
  orden: number;
  id_establecimiento: string | null;
  activo: boolean;
}

export interface MotivoJustificacionDB {
  id: string;
  codigo: string;
  descripcion: string;
  requiere_respaldo: boolean;
  activo: boolean;
}

// ─────────────────────────────────────────────────────────────
// HELPER: Obtener dato con cache
// ─────────────────────────────────────────────────────────────

async function obtenerConCache<T>(
  cacheKey: string,
  ttlMinutos: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = await cacheService.get<T>(cacheKey);
  if (cached) {
    console.log(`✅ Cache HIT: ${cacheKey}`);
    return cached;
  }

  console.log(`🔥 Supabase READ: ${cacheKey}`);
  const data = await fetchFn();
  await cacheService.set(cacheKey, data, ttlMinutos);
  return data;
}

// ─────────────────────────────────────────────────────────────
// ESTABLECIMIENTOS
// ─────────────────────────────────────────────────────────────

/**
 * Obtener todos los establecimientos
 */
export async function obtenerEstablecimientos(): Promise<EstablecimientoDB[]> {
  try {
    const { data, error } = await supabase
      .from('establecimientos')
      .select('*')
      .eq('activo', true);

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, 'Error al obtener establecimientos');
    return [];
  }
}

/**
 * Obtener establecimiento por ID
 */
export async function obtenerEstablecimiento(id: string): Promise<EstablecimientoDB | null> {
  try {
    const { data, error } = await supabase
      .from('establecimientos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleError(error, 'Error al obtener establecimiento');
    return null;
  }
}

/**
 * Crear establecimiento
 */
export async function crearEstablecimiento(
  datos: Omit<EstablecimientoDB, 'id' | 'creado_en'>
): Promise<EstablecimientoDB | null> {
  try {
    const { data, error } = await supabase
      .from('establecimientos')
      .insert(datos)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleError(error, 'Error al crear establecimiento');
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// USUARIOS
// ─────────────────────────────────────────────────────────────

/**
 * Obtener usuario por UID
 */
export async function obtenerUsuarioPorUid(uid: string): Promise<UsuarioDB | null> {
  const TIMEOUT_MS = 20000;

  const timeoutPromise = new Promise<null>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout al obtener usuario')), TIMEOUT_MS)
  );

  try {
    const queryPromise = (async (): Promise<UsuarioDB | null> => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('uid', uid)
        .single();

      if (!error && data) {
        return data;
      }

      // Compatibilidad: en algunos entornos antiguos el auth UID quedó guardado en "id".
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', uid)
        .single();

      if (fallbackError) {
        if (fallbackError.code === 'PGRST116') return null; // No encontrado
        throw fallbackError;
      }

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return fallbackData;
    })();

    return await Promise.race([queryPromise, timeoutPromise]);
  } catch (error) {
    handleError(error, 'Error al obtener usuario');
    return null;
  }
}

/**
 * Obtener usuarios de un establecimiento
 */
export async function obtenerUsuariosDelEstablecimiento(
  idEstablecimiento: string
): Promise<UsuarioDB[]> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('activo', true);

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, 'Error al obtener usuarios');
    return [];
  }
}

/**
 * Obtener profesores de un establecimiento
 */
export async function obtenerProfesoresDelEstablecimiento(
  idEstablecimiento: string
): Promise<UsuarioDB[]> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('rol', 'PROFESOR')
      .eq('activo', true);

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, 'Error al obtener profesores');
    return [];
  }
}

/**
 * Crear usuario
 */
export async function crearUsuario(
  datos: Omit<UsuarioDB, 'id' | 'creado_en' | 'actualizado_en'>
): Promise<UsuarioDB | null> {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('usuarios')
      .insert({
        ...datos,
        creado_en: now,
        actualizado_en: now,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleError(error, 'Error al crear usuario');
    return null;
  }
}

/**
 * Actualizar usuario
 */
export async function actualizarUsuario(
  uid: string,
  datos: Partial<UsuarioDB>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('usuarios')
      .update({
        ...datos,
        actualizado_en: new Date().toISOString(),
      })
      .eq('uid', uid);

    if (error) throw error;
    return true;
  } catch (error) {
    handleError(error, 'Error al actualizar usuario');
    return false;
  }
}

/**
 * Eliminar usuario (soft delete)
 */
export async function eliminarUsuario(uid: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('usuarios')
      .update({ activo: false })
      .eq('uid', uid);

    if (error) throw error;
    return true;
  } catch (error) {
    handleError(error, 'Error al eliminar usuario');
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// ESTUDIANTES
// ─────────────────────────────────────────────────────────────

/**
 * Obtener estudiantes de un curso (con cache)
 */
export async function obtenerEstudiantesPorCurso(
  idEstablecimiento: string,
  curso: string
): Promise<EstudianteDB[]> {
  return obtenerConCache(
    `estudiantes_${idEstablecimiento}_${curso}`,
    30,
    async () => {
      try {
        const { data, error } = await supabase
          .from('estudiantes')
          .select('*')
          .eq('id_establecimiento', idEstablecimiento)
          .eq('curso', curso)
          .eq('activo', true);

        if (error) throw error;
        return data || [];
      } catch (error) {
    handleError(error, 'Error al obtener estudiantes del curso');
    return [];
      }
    }
  );
}

/**
 * Obtener estudiantes de un establecimiento
 */
export async function obtenerEstudiantesDelEstablecimiento(
  idEstablecimiento: string
): Promise<EstudianteDB[]> {
  try {
    const { data, error } = await supabase
      .from('estudiantes')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('activo', true);

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, 'Error al obtener estudiantes');
    return [];
  }
}

/**
 * Obtener estudiante por ID
 */
export async function obtenerEstudiantePorId(idEstudiante: string): Promise<EstudianteDB | null> {
  try {
    const { data, error } = await supabase
      .from('estudiantes')
      .select('*')
      .eq('id_estudiante', idEstudiante)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  } catch (error) {
    handleError(error, 'Error al obtener estudiante');
    return null;
  }
}

/**
 * Crear estudiante
 */
export async function crearEstudiante(
  datos: Omit<EstudianteDB, 'id'>
): Promise<EstudianteDB | null> {
  try {
    const { data, error } = await supabase
      .from('estudiantes')
      .insert(datos)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleError(error, 'Error al crear estudiante');
    return null;
  }
}

/**
 * Actualizar estudiante
 */
export async function actualizarEstudiante(
  idEstudiante: string,
  datos: Partial<EstudianteDB>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('estudiantes')
      .update(datos)
      .eq('id_estudiante', idEstudiante);

    if (error) throw error;
    return true;
  } catch (error) {
    handleError(error, 'Error al actualizar estudiante');
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// SOLICITUDES
// ─────────────────────────────────────────────────────────────

/**
 * Obtener solicitudes de un establecimiento
 */
export async function obtenerSolicitudesDelEstablecimiento(
  idEstablecimiento: string,
  estado?: string
): Promise<SolicitudDB[]> {
  try {
    let query = supabase
      .from('solicitudes')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento);

    if (estado) {
      query = query.eq('estado', estado);
    }

    const { data, error } = await query.order('fecha', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, 'Error al obtener solicitudes');
    return [];
  }
}

/**
 * Obtener solicitudes de un estudiante
 */
export async function obtenerSolicitudesPorEstudiante(
  idEstudiante: string
): Promise<SolicitudDB[]> {
  try {
    const { data, error } = await supabase
      .from('solicitudes')
      .select('*')
      .eq('id_estudiante', idEstudiante)
      .order('fecha', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, 'Error al obtener solicitudes del estudiante');
    return [];
  }
}

/**
 * Crear solicitud
 */
export async function crearSolicitud(
  datos: Omit<SolicitudDB, 'id' | 'creado_en'>
): Promise<SolicitudDB | null> {
  try {
    const { data, error } = await supabase
      .from('solicitudes')
      .insert({
        ...datos,
        creado_en: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleError(error, 'Error al crear solicitud');
    return null;
  }
}

/**
 * Actualizar solicitud
 */
export async function actualizarSolicitud(
  idSolicitud: string,
  datos: Partial<SolicitudDB>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('solicitudes')
      .update(datos)
      .eq('id_solicitud', idSolicitud);

    if (error) throw error;
    return true;
  } catch (error) {
    handleError(error, 'Error al actualizar solicitud');
    return false;
  }
}

/**
 * Eliminar solicitud
 */
export async function eliminarSolicitud(idSolicitud: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('solicitudes')
      .delete()
      .eq('id_solicitud', idSolicitud);

    if (error) throw error;
    return true;
  } catch (error) {
    handleError(error, 'Error al eliminar solicitud');
    return false;
  }
}

/**
 * Obtener motivos de justificación
 */
export async function obtenerMotivos(): Promise<MotivoJustificacionDB[]> {
  try {
    const { data, error } = await supabase
      .from('motivos_justificacion')
      .select('*')
      .eq('activo', true)
      .order('codigo');

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, 'Error al obtener motivos');
    return [];
  }
}

/**
 * Crear motivo
 */
export async function crearMotivo(
  datos: Omit<MotivoJustificacionDB, 'id'>
): Promise<MotivoJustificacionDB | null> {
  try {
    const { data, error } = await supabase
      .from('motivos_justificacion')
      .insert(datos)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleError(error, 'Error al crear motivo');
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// BLOQUES HORARIOS
// ─────────────────────────────────────────────────────────────

/**
 * Obtener bloques horarios de un establecimiento (con cache)
 */
export async function obtenerBloquesHorarios(
  idEstablecimiento: string
): Promise<BloqueHorarioDB[]> {
  return obtenerConCache(
    `bloques_${idEstablecimiento}`,
    60,
    async () => {
      try {
        const { data, error } = await supabase
          .from('bloques_horarios')
          .select('*')
          .eq('id_establecimiento', idEstablecimiento)
          .eq('activo', true)
          .order('orden');

        if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Error al obtener bloques');
      return [];
    }
    }
  );
}

/**
 * Crear bloque horario
 */
export async function crearBloqueHorario(
  datos: Omit<BloqueHorarioDB, 'id'>
): Promise<BloqueHorarioDB | null> {
  try {
    const { data, error } = await supabase
      .from('bloques_horarios')
      .insert(datos)
      .select()
      .single();

    if (error) throw error;
    // Limpiar cache
    await cacheService.invalidate(`bloques_${datos.id_establecimiento}`);
    return data;
  } catch (error) {
    handleError(error, 'Error al crear bloque');
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// CURSOS
// ─────────────────────────────────────────────────────────────

/**
 * Obtener cursos únicos de un establecimiento
 */
export async function obtenerCursosDelEstablecimiento(
  idEstablecimiento: string
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('estudiantes')
      .select('curso')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('activo', true);

    if (error) throw error;

    const cursosSet = new Set<string>();
    data?.forEach((est) => {
      if (est.curso) cursosSet.add(est.curso);
    });

    // Ordenar cursos
    return Array.from(cursosSet).sort((a, b) => {
      const matchA = a.match(/(\d+)([A-Z])/);
      const matchB = b.match(/(\d+)([A-Z])/);

      if (!matchA || !matchB) return a.localeCompare(b);

      const numA = parseInt(matchA[1]);
      const numB = parseInt(matchB[1]);

      if (numA !== numB) return numA - numB;
      return matchA[2].localeCompare(matchB[2]);
    });
  } catch (error) {
    handleError(error, 'Error al obtener cursos');
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// CONSULTAS EN TIEMPO REAL (SUSCRIPCIONES)
// ─────────────────────────────────────────────────────────────

type SubscribeCallback<T> = (data: T) => void;

/**
 * Suscribirse a cambios en solicitudes
 */
export function suscribirSolicitudes(
  idEstablecimiento: string,
  callback: SubscribeCallback<SolicitudDB[]>
): () => void {
  const channel = supabase
    .channel('solicitudes_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'solicitudes',
        filter: `id_establecimiento=eq.${idEstablecimiento}`,
      },
      (payload) => {
        console.log('📡 Cambio en solicitudes:', payload);
        // Recargar datos
        obtenerSolicitudesDelEstablecimiento(idEstablecimiento).then(callback);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Suscribirse a cambios en usuarios
 */
export function suscribirUsuarios(
  idEstablecimiento: string,
  callback: SubscribeCallback<UsuarioDB[]>
): () => void {
  const channel = supabase
    .channel('usuarios_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'usuarios',
        filter: `id_establecimiento=eq.${idEstablecimiento}`,
      },
      (payload) => {
        console.log('📡 Cambio en usuarios:', payload);
        obtenerUsuariosDelEstablecimiento(idEstablecimiento).then(callback);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
