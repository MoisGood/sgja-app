// ============================================================
// SGJA – Servicios de Base de Datos (Supabase)
// src/services/database.ts
// ============================================================

import { supabase } from '../lib/supabase';
import { cacheService } from './cacheService';
import { SupabaseUsuarioRepository } from '../repositories/impl/SupabaseUsuarioRepository';
import { SupabaseConfiguracionRepository } from '../repositories/impl/SupabaseConfiguracionRepository';
import { formatoSimple, formatearRUT, limpiarRUT } from '../utils/rutUtils';
import { getCache, setCache } from '../utils/cacheUtils';
import type {
  Usuario,
  Estudiante,
  Solicitud,
  TokenQR,
  MotivoJustificacion,
  Establecimiento,
  BloqueHorario,
  // Funcionario, // TODO: Utilizar cuando se implemente MantenedorFuncionarios
} from '../types';
import { EstadoSolicitud } from '../types';

const _usuarioRepo = new SupabaseUsuarioRepository();
const _configRepo = new SupabaseConfiguracionRepository();

// ────────────────────────────────────────────────────────────
// HELPER: Obtener dato con cache automático
// ────────────────────────────────────────────────────────────

async function obtenerConCache<T>(
  cacheKey: string,
  ttlMinutos: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = await cacheService.get<T>(cacheKey);
  if (cached) {
    return cached;
  }

  const data = await fetchFn();
  await cacheService.set(cacheKey, data, ttlMinutos);

  return data;
}

// ════════════════════════════════════════════════════════════
// 📋 USUARIOS
// ════════════════════════════════════════════════════════════

export async function obtenerUsuario(uid: string): Promise<Usuario | null> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', uid)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data ? { ...data, id_usuario: data.id, uid: data.uid, nombre_completo: data.nombre || '', apellidos: data.apellidos || '' } : null;
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    throw error;
  }
}

export async function obtenerUsuariosDelEstablecimiento(
  idEstablecimiento: string
): Promise<Usuario[]> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('activo', true);

    if (error) throw error;
    return (data || []).map(u => ({ ...u, id_usuario: u.id, uid: u.uid, nombre_completo: u.nombre || '', apellidos: u.apellidos || '' }));
  } catch (error) {
    console.error('Error al obtener usuarios del establecimiento:', error);
    throw error;
  }
}

export async function obtenerTodosLosUsuarios(): Promise<Usuario[]> {
  const cacheKey = 'todos_usuarios';
  const cached = getCache<Usuario[]>(cacheKey);
  if (cached) return cached;
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('nombre');

    if (error) throw error;
    const result = (data || []).map(u => ({
      ...u,
      id_usuario: u.id,
      uid: u.uid,
      nombre_completo: u.nombre || '',
      apellidos: u.apellidos || '',
    }));
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error al obtener todos los usuarios:', error);
    throw error;
  }
}

export async function obtenerUsuariosDelEstablecimientoTodos(
  idEstablecimiento: string
): Promise<Usuario[]> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento);

    if (error) throw error;
    return (data || []).map(u => ({
      ...u,
      id_usuario: u.id,
      uid: u.uid,
      nombre_completo: u.nombre || '',
      apellidos: u.apellidos || '',
    }));
  } catch (error) {
    console.error('Error al obtener todos los usuarios del establecimiento:', error);
    throw error;
  }
}

export async function obtenerProfesoresDelEstablecimiento(
  idEstablecimiento: string
): Promise<Usuario[]> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('rol', 'PROFESOR')
      .eq('activo', true);

    if (error) throw error;
    return (data || []).map(u => ({ ...u, id_usuario: u.id, uid: u.uid, nombre_completo: u.nombre || '', apellidos: u.apellidos || '' }));
  } catch (error) {
    console.error('Error al obtener profesores:', error);
    throw error;
  }
}

export async function crearUsuario(uid: string, datos: Partial<Usuario>): Promise<void> {
  try {
    const { error } = await supabase
      .from('usuarios')
      .insert([{
        id: uid,
        ...datos,
        fecha_creacion: new Date().toISOString(),
        activo: true,
      }]);

    if (error) throw error;
  } catch (error) {
    console.error('Error al crear usuario:', error);
    throw error;
  }
}

export async function crearUsuarioConAutenticacion(
  email: string,
  nombre_completo: string,
  rol: string,
  id_establecimiento: string
): Promise<string> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: Math.random().toString(36).slice(-8),
    });

    if (authError) throw authError;

    const uid = authData.user?.id;
    if (!uid) throw new Error('No UID returned from auth signup');

    const { error: insertError } = await supabase
      .from('usuarios')
      .insert([{
        id: uid,
        email,
        nombre: nombre_completo,
        rol,
        id_establecimiento,
        activo: true,
        foto_url: null,
        creado_en: new Date().toISOString(),
      }]);

    if (insertError) throw insertError;
    return '';
  } catch (error) {
    console.error('Error al crear usuario con autenticación:', error);
    throw error;
  }
}

export async function asignarRolAUsuario(
  uid: string,
  email: string,
  nombre_completo: string,
  rol: string,
  id_establecimiento: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('usuarios')
      .upsert({
        id: uid,
        email,
        nombre: nombre_completo,
        rol,
        id_establecimiento,
        activo: true,
        foto_url: null,
        creado_en: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error al asignar rol a usuario:', error);
    throw error;
  }
}

export async function actualizarUsuario(uid: string, datos: Partial<Usuario>): Promise<void> {
  return _usuarioRepo.actualizar(uid, datos);
}

export async function eliminarUsuario(uid: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('usuarios')
      .update({ activo: false })
      .eq('id', uid);

    if (error) throw error;
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    throw error;
  }
}

export async function obtenerUsuariosPorEstablecimientoTodos(
  idEstablecimiento: string
): Promise<Usuario[]> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento);

    if (error) throw error;
    return (data || []).map(u => ({ ...u, id_usuario: u.id, uid: u.uid, nombre_completo: u.nombre || '', apellidos: u.apellidos || '' }));
  } catch (error) {
    console.error('Error al obtener usuarios (todos):', error);
    throw error;
  }
}

// ════════════════════════════════════════════════════════════
// 👥 ESTUDIANTES
// ════════════════════════════════════════════════════════════

export async function obtenerEstudiante(idEstudiante: string): Promise<Estudiante | null> {
  try {
    const { data, error } = await supabase
      .from('estudiantes')
      .select('*')
      .eq('id', idEstudiante)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data as Estudiante;
  } catch (error) {
    console.error('Error al obtener estudiante:', error);
    throw error;
  }
}

export async function obtenerEstudiantesPorCurso(
  idEstablecimiento: string,
  curso: string
): Promise<Estudiante[]> {
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
        console.error('Error al obtener estudiantes del curso:', error);
        throw error;
      }
    }
  );
}

export async function obtenerEstudiantesDelEstablecimiento(
  idEstablecimiento: string
): Promise<Estudiante[]> {
  try {
    const { data, error } = await supabase
      .from('estudiantes')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('activo', true);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener estudiantes:', error);
    throw error;
  }
}

export async function obtenerEstudiantesPorApoderado(
  idApoderado: string
): Promise<Estudiante[]> {
  try {
    const { data, error } = await supabase
      .from('estudiantes')
      .select('*')
      .eq('id_apoderado', idApoderado)
      .eq('activo', true);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener estudiantes del apoderado:', error);
    throw error;
  }
}

export async function crearEstudiante(datos: {
  id_establecimiento: string;
  rut: string;
  nombre_completo: string;
  curso: string;
  anno_ingreso: number;
  id_apoderado?: string | null;
  activo?: boolean;
}): Promise<void> {
  try {
    const { error } = await supabase.from('estudiantes').insert([{
      id_establecimiento: datos.id_establecimiento,
      rut: datos.rut,
      nombre_completo: datos.nombre_completo,
      curso: datos.curso,
      anno_ingreso: datos.anno_ingreso,
      id_apoderado: datos.id_apoderado ?? null,
      activo: datos.activo ?? true,
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
    }]);
    if (error) throw error;
  } catch (error) {
    console.error('Error al crear estudiante:', error);
    throw error;
  }
}

export async function actualizarEstudiante(id: string, datos: {
  rut?: string;
  nombre_completo?: string;
  curso?: string;
  anno_ingreso?: number;
  id_apoderado?: string | null;
  activo?: boolean;
}): Promise<void> {
  try {
    const { error } = await supabase
      .from('estudiantes')
      .update({ ...datos, actualizado_en: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  } catch (error) {
    console.error('Error al actualizar estudiante:', error);
    throw error;
  }
}

export async function eliminarEstudiante(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('estudiantes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch (error) {
    console.error('Error al eliminar estudiante:', error);
    throw error;
  }
}

export async function verificarRutDuplicado(
  idEstablecimiento: string,
  rut: string,
  excluirId?: string
): Promise<boolean> {
  try {
    let query = supabase
      .from('estudiantes')
      .select('id', { count: 'exact', head: true })
      .eq('id_establecimiento', idEstablecimiento)
      .eq('rut', rut);
    if (excluirId) query = query.neq('id', excluirId);
    const { count } = await query;
    return (count ?? 0) > 0;
  } catch (error) {
    console.error('Error al verificar RUT duplicado:', error);
    return false;
  }
}

export async function verificarRutsDuplicados(
  idEstablecimiento: string,
  ruts: string[]
): Promise<string[]> {
  try {
    const { data } = await supabase
      .from('estudiantes')
      .select('rut')
      .eq('id_establecimiento', idEstablecimiento)
      .in('rut', ruts);
    return (data || []).map(r => r.rut).filter(Boolean);
  } catch (error) {
    console.error('Error al verificar RUTs duplicados:', error);
    return [];
  }
}

export async function crearEstudiantesBatch(
  estudiantes: Array<{
    id_establecimiento: string;
    rut: string;
    nombre_completo: string;
    curso: string;
    anno_ingreso: number;
    id_apoderado?: string | null;
    activo: boolean;
  }>
): Promise<void> {
  try {
    const ahora = new Date().toISOString();
    const registros = estudiantes.map(e => ({
      id_establecimiento: e.id_establecimiento,
      rut: e.rut,
      nombre_completo: e.nombre_completo,
      curso: e.curso,
      anno_ingreso: e.anno_ingreso,
      id_apoderado: e.id_apoderado ?? null,
      activo: e.activo,
      creado_en: ahora,
      actualizado_en: ahora,
    }));
    const { error } = await supabase.from('estudiantes').insert(registros);
    if (error) throw error;
  } catch (error) {
    console.error('Error al crear estudiantes en batch:', error);
    throw error;
  }
}

export async function obtenerTodosLosCursos(
  idEstablecimiento: string
): Promise<Array<{ id: string; codigo: string; nombre: string; nivel: string }>> {
  try {
    const { data, error } = await supabase
      .from('cursos')
      .select('id, codigo, nombre, nivel')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('activo', true)
      .order('nivel');
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener cursos:', error);
    return [];
  }
}

// ════════════════════════════════════════════════════════════
// 📝 SOLICITUDES
// ════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════
// 🎟️ TOKENS QR
// ════════════════════════════════════════════════════════════

export async function obtenerTokenQR(idToken: string): Promise<TokenQR | null> {
  try {
    const { data, error } = await supabase
      .from('tokens_qr')
      .select('*')
      .eq('id', idToken)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data as TokenQR;
  } catch (error) {
    console.error('Error al obtener token QR:', error);
    throw error;
  }
}

export async function crearTokenQR(token: TokenQR): Promise<void> {
  try {
    const { error } = await supabase
      .from('tokens_qr')
      .insert([token]);

    if (error) throw error;
  } catch (error) {
    console.error('Error al crear token QR:', error);
    throw error;
  }
}

export async function actualizarTokenQR(
  idToken: string,
  datos: Partial<TokenQR>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('tokens_qr')
      .update(datos)
      .eq('id', idToken);

    if (error) throw error;
  } catch (error) {
    console.error('Error al actualizar token QR:', error);
    throw error;
  }
}

// ════════════════════════════════════════════════════════════
// 💡 MOTIVOS DE JUSTIFICACIÓN
// ════════════════════════════════════════════════════════════

export async function obtenerMotivosDelEstablecimiento(
  idEstablecimiento: string
): Promise<MotivoJustificacion[]> {
  try {
    const { data, error } = await supabase
      .from('motivos_justificacion')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener motivos:', error);
    return [];
  }
}

export async function crearMotivo(motivo: MotivoJustificacion): Promise<void> {
  try {
    const { error } = await supabase
      .from('motivos_justificacion')
      .insert([motivo]);

    if (error) throw error;
  } catch (error) {
    console.error('Error al crear motivo:', error);
    throw error;
  }
}

export async function crearMotivoJustificacion(motivo: MotivoJustificacion): Promise<void> {
  try {
    const { error } = await supabase
      .from('motivos_justificacion')
      .insert([{
        ...motivo,
        creado_en: new Date().toISOString(),
      }]);

    if (error) throw error;
  } catch (error) {
    console.error('Error al crear motivo:', error);
    throw error;
  }
}

export async function actualizarMotivoJustificacion(
  id: string,
  datos: Partial<MotivoJustificacion>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('motivos_justificacion')
      .update({
        ...datos,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error al actualizar motivo:', error);
    throw error;
  }
}

export async function eliminarMotivoJustificacion(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('motivos_justificacion')
      .update({
        activo: false,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error al eliminar motivo:', error);
    throw error;
  }
}

// ════════════════════════════════════════════════════════════
// 🏢 ESTABLECIMIENTOS
// ════════════════════════════════════════════════════════════

export async function obtenerEstablecimiento(
  idEstablecimiento: string
): Promise<Establecimiento | null> {
  try {
    const { data, error } = await supabase
      .from('establecimientos')
      .select('*')
      .eq('id', idEstablecimiento)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data as Establecimiento;
  } catch (error) {
    console.error('Error al obtener establecimiento:', error);
    throw error;
  }
}

export async function actualizarEstablecimiento(
  idEstablecimiento: string,
  datos: Partial<Establecimiento>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('establecimientos')
      .update(datos)
      .eq('id', idEstablecimiento);

    if (error) throw error;
  } catch (error) {
    console.error('Error al actualizar establecimiento:', error);
    throw error;
  }
}

// ════════════════════════════════════════════════════════════
// 📊 ESTADÍSTICAS
// ════════════════════════════════════════════════════════════

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
    data?.forEach(record => {
      if (record.curso) cursosSet.add(record.curso);
    });

    const cursos = Array.from(cursosSet).sort((a, b) => {
      const matchA = a.match(/(\d+)([A-Z])/);
      const matchB = b.match(/(\d+)([A-Z])/);

      if (!matchA || !matchB) return a.localeCompare(b);

      const numA = parseInt(matchA[1]);
      const numB = parseInt(matchB[1]);

      if (numA !== numB) return numA - numB;

      return matchA[2].localeCompare(matchB[2]);
    });

    return cursos;
  } catch (error) {
    console.error('❌ Error al obtener cursos:', error);
    return [];
  }
}

export async function obtenerUltimasSolicitudes(
  idEstablecimiento: string,
  cantidad: number = 10
): Promise<Solicitud[]> {
  try {
    const [{ data: justificadas, error: error1 }, { data: injustificadas, error: error2 }] = await Promise.all([
      supabase.from('justificadas').select('*').eq('id_establecimiento', idEstablecimiento).limit(cantidad),
      supabase.from('injustificadas').select('*').eq('id_establecimiento', idEstablecimiento).limit(cantidad),
    ]);

    if (error1) throw error1;
    if (error2) throw error2;

    const solicitudes = [...(justificadas || []), ...(injustificadas || [])];
    solicitudes.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    return solicitudes.slice(0, cantidad) as Solicitud[];
  } catch (error) {
    console.error('Error al obtener últimas solicitudes:', error);
    throw error;
  }
}

// ════════════════════════════════════════════════════════════
// ⚙️ PARÁMETROS DEL SISTEMA
// ════════════════════════════════════════════════════════════

export interface Parametros {
  id_parametros: string;
  id_establecimiento: string;
  tiempo_inactividad_minutos: number;
}

export async function obtenerParametrosDelEstablecimiento(
  idEstablecimiento: string
): Promise<Parametros | null> {
  try {
    const { data, error } = await supabase
      .from('parametros')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data as Parametros;
  } catch (error) {
    console.error('Error al obtener parámetros:', error);
    throw error;
  }
}

export async function crearParametros(
  idEstablecimiento: string,
  tiempoInactividadMinutos: number = 30
): Promise<Parametros> {
  try {
    const nuevoParametro: Parametros = {
      id_parametros: `${idEstablecimiento}_parametros`,
      id_establecimiento: idEstablecimiento,
      tiempo_inactividad_minutos: tiempoInactividadMinutos,
    };

    const { error } = await supabase
      .from('parametros')
      .insert([nuevoParametro]);

    if (error) throw error;
    return nuevoParametro;
  } catch (error) {
    console.error('Error al crear parámetros:', error);
    throw error;
  }
}

export async function actualizarParametros(
  idEstablecimiento: string,
  tiempoInactividadMinutos: number
): Promise<void> {
  try {
    const { error } = await supabase
      .from('parametros')
      .update({ tiempo_inactividad_minutos: tiempoInactividadMinutos })
      .eq('id_establecimiento', idEstablecimiento);

    if (error) throw error;
  } catch (error) {
    console.error('Error al actualizar parámetros:', error);
    throw error;
  }
}

// ════════════════════════════════════════════════════════════
// ⏰ BLOQUES DE HORARIO
// ════════════════════════════════════════════════════════════

export async function obtenerBloquesHorarios(idEstablecimiento: string): Promise<BloqueHorario[]> {
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
          .order('orden', { ascending: true });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error al obtener bloques horarios:', error);
        throw error;
      }
    }
  );
}

export async function crearBloqueHorario(
  idEstablecimiento: string,
  nombreBloque: string,
  horaInicio: string,
  horaFin: string,
  tipo: 'clase' | 'recreo' | 'almuerzo' | 'otro',
  orden: number
): Promise<string> {
  try {
    const [horaI, minI] = horaInicio.split(':').map(Number);
    const [horaF, minF] = horaFin.split(':').map(Number);
    const duracionMinutos = (horaF * 60 + minF) - (horaI * 60 + minI);

    const bloque: BloqueHorario = {
      id_bloque: '',
      id_establecimiento: idEstablecimiento,
      numero_bloque: 0,
      nombre_bloque: nombreBloque,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      duracion_minutos: duracionMinutos,
      tipo,
      orden,
      activo: true,
      creado_en: new Date(),
      actualizado_en: new Date(),
    };

    const { data, error } = await supabase
      .from('bloques_horarios')
      .insert([bloque])
      .select();

    if (error) throw error;
    return data?.[0]?.id_bloque || '';
  } catch (error) {
    console.error('Error al crear bloque horario:', error);
    throw error;
  }
}

export async function actualizarBloqueHorario(
  idBloque: string,
  updates: Partial<BloqueHorario>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('bloques_horarios')
      .update({
        ...updates,
        actualizado_en: new Date(),
      })
      .eq('id', idBloque);

    if (error) throw error;
  } catch (error) {
    console.error('Error al actualizar bloque horario:', error);
    throw error;
  }
}

export async function eliminarBloqueHorario(idBloque: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('bloques_horarios')
      .update({
        activo: false,
        actualizado_en: new Date(),
      })
      .eq('id', idBloque);

    if (error) throw error;
  } catch (error) {
    console.error('Error al eliminar bloque horario:', error);
    throw error;
  }
}

// ════════════════════════════════════════════════════════════
// 📋 PERMISOS DE ROLES
// ════════════════════════════════════════════════════════════

export async function guardarPermisosRol(
  idEstablecimiento: string,
  rol: string,
  rutas: string[]
): Promise<void> {
  try {
    console.log('[ConfigDB] Guardando permisos:', { rol, idEstablecimiento, rutas: rutas.length });

    const { data: existente } = await supabase
      .from('configuracion')
      .select('id')
      .eq('rol', rol)
      .eq('id_establecimiento', idEstablecimiento)
      .maybeSingle();

    if (existente) {
      const { error } = await supabase
        .from('configuracion')
        .update({
          permisos: rutas,
          actualizado_en: new Date().toISOString(),
        })
        .eq('id', existente.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('configuracion')
        .insert({
          rol,
          id_establecimiento: idEstablecimiento,
          permisos: rutas,
          actualizado_en: new Date().toISOString(),
        });

      if (error) throw error;
    }

    console.log('[ConfigDB] Permisos guardados OK');
  } catch (error) {
    console.error('Error al guardar permisos:', error);
    throw error;
  }
}

export async function obtenerPermisosRol(
  idEstablecimiento: string,
  rol: string
): Promise<string[]> {
  try {
    console.log('[ConfigDB] Obteniendo permisos:', { rol, idEstablecimiento });
    const { data, error } = await supabase
      .from('configuracion')
      .select('permisos')
      .eq('rol', rol)
      .eq('id_establecimiento', idEstablecimiento)
      .single();

    if (error && error.code === 'PGRST116') {
      console.log('[ConfigDB] No hay permisos configurados (PGRST116)');
      return [];
    }
    if (error) {
      console.error('[ConfigDB] Error:', error);
      throw error;
    }
    console.log('[ConfigDB] Permisos obtenidos:', data?.permisos);
    return Array.isArray(data?.permisos) ? data.permisos : [];
  } catch (error) {
    console.error('Error al obtener permisos:', error);
    return [];
  }
}

// ════════════════════════════════════════════════════════════
// 📄 LISTA MAESTRA DE PÁGINAS DEL SISTEMA
// ════════════════════════════════════════════════════════════

export interface PermisosPagina {
  ruta: string;
  nombre: string;
  descripcion: string;
}

export function obtenerTodasLasPaginas(): PermisosPagina[] {
  return [
    { ruta: '/dashboard', nombre: 'Inicio', descripcion: 'Panel principal del dashboard' },
    { ruta: '/secretaria', nombre: 'Secretaría', descripcion: 'Gestión de secretaría' },
    { ruta: '/secretaria/ausentes', nombre: 'Ausentes', descripcion: 'Registro de ausencias de funcionarios' },
    { ruta: '/secretaria/enviar-correo', nombre: 'Enviar Correo', descripcion: 'Envío de correos a funcionarios' },

    { ruta: '/mantenedor-funcionarios', nombre: 'Funcionarios', descripcion: 'Mantenedor de funcionarios' },
    { ruta: '/justificaciones', nombre: 'Justificaciones', descripcion: 'Panel de justificaciones' },
    { ruta: '/registrar', nombre: 'Registrar', descripcion: 'Registrar justificación' },
    { ruta: '/ver-justificaciones', nombre: 'Ver Justificaciones', descripcion: 'Listado de justificaciones' },
    { ruta: '/gestion-pases', nombre: 'Gestión de Pases', descripcion: 'Administrar pases' },
    { ruta: '/seguridad', nombre: 'Seguridad', descripcion: 'Configuración de seguridad' },
    { ruta: '/configuracion', nombre: 'Configuración', descripcion: 'Panel de configuración' },
    { ruta: '/en-linea', nombre: 'En Línea', descripcion: 'Usuarios en línea' },
    { ruta: '/gestion-usuarios', nombre: 'Gestión Usuarios', descripcion: 'Administrar usuarios' },
    { ruta: '/mantenedor-estudiantes', nombre: 'Mantenedor Estudiantes', descripcion: 'CRUD de estudiantes' },
    { ruta: '/mantenedor-roles', nombre: 'Mantenedor de Roles', descripcion: 'Administrar roles' },
    { ruta: '/mantenedor-motivos', nombre: 'Motivos de Justificación', descripcion: 'Motivos de justificación' },
    { ruta: '/solicitudes-registro', nombre: 'Solicitudes de Registro', descripcion: 'Solicitudes de registro de usuarios' },
    { ruta: '/parametros', nombre: 'Parámetros', descripcion: 'Parámetros del sistema' },
    { ruta: '/asignar-permisos', nombre: 'Asignar Accesos', descripcion: 'Asignar accesos por rol' },
    { ruta: '/bloque-horario', nombre: 'Bloques Horarios', descripcion: 'Bloques de horario' },
    { ruta: '/reportes', nombre: 'Reportes', descripcion: 'Reportes del sistema' },
    { ruta: '/mantenedor-cursos', nombre: 'Mantenedor Cursos', descripcion: 'CRUD de cursos' },
    { ruta: '/biblioteca', nombre: 'Biblioteca', descripcion: 'Acceso al módulo de biblioteca' },
    { ruta: '/libros', nombre: 'Libros', descripcion: 'Mantenedor de libros' },
    { ruta: '/catalogo', nombre: 'Catálogo', descripcion: 'Catálogo bibliográfico' },
    { ruta: '/prestamos', nombre: 'Préstamos', descripcion: 'Circulación y préstamos' },
    { ruta: '/inventario', nombre: 'Inventario', descripcion: 'Inventario físico de ejemplares' },
    { ruta: '/historial-biblioteca', nombre: 'Historial Biblioteca', descripcion: 'Historial de préstamos' },
    { ruta: '/config-biblioteca', nombre: 'Config. Biblioteca', descripcion: 'Configuración del módulo biblioteca' },
    { ruta: '/correos', nombre: 'Correos', descripcion: 'Configuración de envío de correos' },
    { ruta: '/sistema', nombre: 'Sistema', descripcion: 'Configuración de mantenimiento del sistema' },
    { ruta: '/tecnico', nombre: 'Técnico', descripcion: 'Panel principal del módulo técnico' },
    { ruta: '/tecnico/mapa', nombre: 'Mapa', descripcion: 'Mapa interactivo con equipos por piso' },
    { ruta: '/tecnico/equipos', nombre: 'Equipos', descripcion: 'CRUD de equipos del establecimiento' },
    { ruta: '/tecnico/ubicaciones', nombre: 'Ubicaciones', descripcion: 'Gestión de ubicaciones y lugares' },
    { ruta: '/tecnico/requerimientos', nombre: 'Requerimientos', descripcion: 'Solicitudes de soporte técnico' },
    { ruta: '/tecnico/accesos', nombre: 'Accesos Rápidos', descripcion: 'Atajos y generación de códigos QR' },
    { ruta: '/tecnico/menu', nombre: 'Menú Técnico', descripcion: 'Menú principal del módulo técnico' },
    { ruta: '/tecnico/m/mapa', nombre: 'Mapa Móvil', descripcion: 'Mapa y lugares versión móvil' },
    { ruta: '/tecnico/m/equipos', nombre: 'Equipos Móvil', descripcion: 'Administrar equipos versión móvil' },
    { ruta: '/tecnico/m/ubicaciones', nombre: 'Ubicaciones Móvil', descripcion: 'Ubicaciones versión móvil' },
    { ruta: '/tecnico/m/config', nombre: 'Config Móvil', descripcion: 'Configuración técnica versión móvil' },
    { ruta: '/tecnico/configuracion', nombre: 'Config. Técnico', descripcion: 'Configuración de catálogos técnicos' },
    { ruta: '/tecnico/qr', nombre: 'Redirigir QR', descripcion: 'Redirección por código QR' },
    { ruta: '/ticket', nombre: 'Ticket Técnico', descripcion: 'Crear y cerrar tickets de soporte' },
    { ruta: '/monitoreo-correos', nombre: 'Monitoreo Correos', descripcion: 'Monitoreo de envío de correos' },
    { ruta: '/monitoreo-fallos', nombre: 'Monitoreo Fallos', descripcion: 'Registro de fallos del sistema' },
  ];
}

// ════════════════════════════════════════════════════════════
// 🔄 LISTENERS EN TIEMPO REAL (Supabase Realtime)
// ════════════════════════════════════════════════════════════

export function escucharSolicitudesInjustificadas(
  idEstablecimiento: string,
  callback: (solicitudes: Solicitud[]) => void
): () => void {
  try {
    const subscription = supabase
      .channel(`injustificadas:${idEstablecimiento}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'injustificadas',
          filter: `id_establecimiento=eq.${idEstablecimiento}`,
        },
        async () => {
          const { data } = await supabase
            .from('injustificadas')
            .select('*')
            .eq('id_establecimiento', idEstablecimiento);

          callback((data || []) as Solicitud[]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  } catch (error) {
    console.error('Error al configurar listener:', error);
    return () => {};
  }
}

export function escucharSolicitudesJustificadas(
  idEstablecimiento: string,
  callback: (solicitudes: Solicitud[]) => void
): () => void {
  try {
    const subscription = supabase
      .channel(`justificadas:${idEstablecimiento}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'justificadas',
          filter: `id_establecimiento=eq.${idEstablecimiento}`,
        },
        async () => {
          const { data } = await supabase
            .from('justificadas')
            .select('*')
            .eq('id_establecimiento', idEstablecimiento);

          callback((data || []) as Solicitud[]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  } catch (error) {
    console.error('Error al configurar listener:', error);
    return () => {};
  }
}

// ════════════════════════════════════════════════════════════
// 📊 REGISTROS DE BLOQUE POR PROFESOR
// ════════════════════════════════════════════════════════════

export async function guardarRegistroBloqueProfesor(
  idProfesor: string,
  idEstablecimiento: string,
  idBloque: string,
  numeroBloque: number,
  nombreBloque: string,
  horaRegistrada: string,
  horaInicio: string,
  horaFin: string,
  curso: string
): Promise<string> {
  try {
    const fecha = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('registros_bloque_profesor')
      .insert([{
        id_profesor: idProfesor,
        id_establecimiento: idEstablecimiento,
        id_bloque: idBloque,
        numero_bloque: numeroBloque,
        nombre_bloque: nombreBloque,
        hora_registrada: horaRegistrada,
        hora_inicio_bloque: horaInicio,
        hora_fin_bloque: horaFin,
        curso,
        fecha,
        creado_en: new Date().toISOString(),
      }])
      .select();

    if (error) throw error;
    return data?.[0]?.id || '';
  } catch (error) {
    console.error('Error al guardar registro de bloque:', error);
    throw error;
  }
}

export async function obtenerRegistrosBloqueProfesor(
  idProfesor: string,
  idEstablecimiento: string,
  fecha?: string
): Promise<(Record<string, unknown> & { id_registro: string })[]> {
  try {
    const fechaQuery = fecha || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('registros_bloque_profesor')
      .select('*')
      .eq('id_profesor', idProfesor)
      .eq('id_establecimiento', idEstablecimiento)
      .eq('fecha', fechaQuery);

    if (error) throw error;

    return (data || []).map(doc => ({
      ...doc,
      id_registro: doc.id,
    }));
  } catch (error) {
    console.error('Error al obtener registros de bloque:', error);
    throw error;
  }
}

// ════════════════════════════════════════════════════════════
// 👥 ROLES PERSONALIZADOS
// ════════════════════════════════════════════════════════════

export interface RolPersonalizado {
  id_rol: string;
  id_establecimiento: string;
  nombre_rol: string;
  descripcion: string;
  activo: boolean;
  creado_en: Date;
  actualizado_en: Date;
}

export async function obtenerRolesPersonalizados(
  idEstablecimiento: string
): Promise<RolPersonalizado[]> {
  const ROLES_PREDEFINIDOS: RolPersonalizado[] = [
    {
      id_rol: 'ADMIN',
      id_establecimiento: idEstablecimiento,
      nombre_rol: 'ADMIN',
      descripcion: 'Administrador del establecimiento',
      activo: true,
      creado_en: new Date('2000-01-01'),
      actualizado_en: new Date('2000-01-01'),
    },
    {
      id_rol: 'INSPECTOR',
      id_establecimiento: idEstablecimiento,
      nombre_rol: 'INSPECTOR',
      descripcion: 'Inspector de convivencia',
      activo: true,
      creado_en: new Date('2000-01-01'),
      actualizado_en: new Date('2000-01-01'),
    },
    {
      id_rol: 'PROFESOR',
      id_establecimiento: idEstablecimiento,
      nombre_rol: 'PROFESOR',
      descripcion: 'Profesor de la institución',
      activo: true,
      creado_en: new Date('2000-01-01'),
      actualizado_en: new Date('2000-01-01'),
    },
    {
      id_rol: 'ESTUDIANTE',
      id_establecimiento: idEstablecimiento,
      nombre_rol: 'ESTUDIANTE',
      descripcion: 'Estudiante de la institución',
      activo: true,
      creado_en: new Date('2000-01-01'),
      actualizado_en: new Date('2000-01-01'),
    },
    {
      id_rol: 'APODERADO',
      id_establecimiento: idEstablecimiento,
      nombre_rol: 'APODERADO',
      descripcion: 'Apoderado de estudiante',
      activo: true,
      creado_en: new Date('2000-01-01'),
      actualizado_en: new Date('2000-01-01'),
    },
  ];

  try {
    const { data, error } = await supabase
      .from('roles_personalizados')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('activo', true);

    if (error && error.code !== 'PGRST116') throw error;

    const rolesPersonalizados = (data || []) as RolPersonalizado[];
    const todoRoles = [...ROLES_PREDEFINIDOS];

    for (const rol of rolesPersonalizados) {
      if (!todoRoles.find(r => r.nombre_rol.toUpperCase() === rol.nombre_rol.toUpperCase())) {
        todoRoles.push(rol);
      }
    }

    return todoRoles;
  } catch (error) {
    console.error('Error al obtener roles personalizados:', error);
    return ROLES_PREDEFINIDOS;
  }
}

export async function crearRolPersonalizado(
  idEstablecimiento: string,
  nombreRol: string,
  descripcion: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('roles_personalizados')
      .insert({
        id_establecimiento: idEstablecimiento,
        nombre_rol: nombreRol.toUpperCase(),
        descripcion: descripcion || '',
        activo: true,
      });

    if (error) return { error: error.message };
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

export async function eliminarRolPersonalizado(
  idEstablecimiento: string,
  idRol: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('roles_personalizados')
      .update({ activo: false })
      .eq('id_rol', idRol)
      .eq('id_establecimiento', idEstablecimiento);

    if (error) return { error: error.message };
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

export async function actualizarRolPersonalizado(
  idEstablecimiento: string,
  idRol: string,
  datos: { nombre_rol?: string; descripcion?: string }
): Promise<{ error: string | null }> {
  try {
    const updateData: Record<string, unknown> = { actualizado_en: new Date().toISOString() };
    if (datos.nombre_rol !== undefined) updateData.nombre_rol = datos.nombre_rol.toUpperCase();
    if (datos.descripcion !== undefined) updateData.descripcion = datos.descripcion;

    const { error } = await supabase
      .from('roles_personalizados')
      .update(updateData)
      .eq('id_rol', idRol)
      .eq('id_establecimiento', idEstablecimiento);

    if (error) return { error: error.message };
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

// ════════════════════════════════════════════════════════════
// 📝 SOLICITUDES DE REGISTRO (Nuevos Usuarios)
// ════════════════════════════════════════════════════════════

export interface SolicitudRegistro {
  id_solicitud: number;
  uid: string;
  nombre: string;
  apellidos: string;
  correo: string;
  fecha_solicitud: string;
  estado: string;
  respuesta_enviada: boolean;
  fecha_respuesta: string | null;
}

export async function obtenerTodosLosEstablecimientos(): Promise<{ id: string; nombre: string }[]> {
  try {
    const { data, error } = await supabase
      .from('establecimientos')
      .select('id, nombre')
      .eq('activo', true)
      .order('nombre');

    if (error) throw error;
    return (data || []) as { id: string; nombre: string }[];
  } catch (error) {
    console.error('Error al obtener establecimientos:', error);
    return [];
  }
}

export async function buscarEstablecimientos(termino: string): Promise<{ id: string; nombre: string }[]> {
  try {
    const { data, error } = await supabase
      .from('establecimientos')
      .select('id, nombre')
      .ilike('nombre', `%${termino}%`)
      .eq('activo', true)
      .limit(10);

    if (error) throw error;
    return (data || []) as { id: string; nombre: string }[];
  } catch (error) {
    console.error('Error al buscar establecimientos:', error);
    return [];
  }
}

export async function enviarSolicitudRegistro(
  uid: string,
  correo: string,
  nombre: string,
  apellidos: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('solicitudes_registro')
      .insert([{
        uid,
        nombre,
        apellidos,
        correo,
        estado: 'pendiente',
      }]);

    if (error) return { error: error.message };
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

export async function obtenerSolicitudPorUid(uid: string): Promise<SolicitudRegistro | null> {
  try {
    const { data, error } = await supabase
      .from('solicitudes_registro')
      .select('*')
      .eq('uid', uid)
      .order('id_solicitud', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data as SolicitudRegistro;
  } catch (error) {
    return null;
  }
}

export async function obtenerSolicitudesPendientes(): Promise<SolicitudRegistro[]> {
  try {
    const { data, error } = await supabase
      .from('solicitudes_registro')
      .select('*')
      .eq('estado', 'pendiente')
      .order('fecha_solicitud', { ascending: false });

    if (error) throw error;
    return (data || []) as SolicitudRegistro[];
  } catch (error) {
    console.error('Error al obtener solicitudes pendientes:', error);
    return [];
  }
}

export async function aprobarSolicitud(
  uid: string,
  rol: string
): Promise<{ error: string | null }> {
  try {
    const { data: solicitud, error: errSolicitud } = await supabase
      .from('solicitudes_registro')
      .select('*')
      .eq('uid', uid)
      .single();

    if (errSolicitud || !solicitud) return { error: 'Solicitud no encontrada' };

    const { error: errInsert } = await supabase
      .from('usuarios')
      .insert([{
        id: uid,
        uid: uid,
        email: solicitud.correo,
        nombre: solicitud.nombre,
        apellidos: solicitud.apellidos,
        rol,
        activo: true,
      }]);

    if (errInsert) return { error: errInsert.message };

    const { error: errUpdate } = await supabase
      .from('solicitudes_registro')
      .update({
        estado: 'aprobado',
        respuesta_enviada: false,
        fecha_respuesta: new Date().toISOString(),
      })
      .eq('uid', uid);

    if (errUpdate) return { error: errUpdate.message };
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

export async function rechazarSolicitud(uid: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('solicitudes_registro')
      .update({
        estado: 'rechazado',
        respuesta_enviada: false,
        fecha_respuesta: new Date().toISOString(),
      })
      .eq('uid', uid);

    if (error) return { error: error.message };
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

// ════════════════════════════════════════════════════════════
// DATOS PERSONALES DE USUARIOS
// ════════════════════════════════════════════════════════════

export interface DatosPersonales {
  uid: string;
  rut: string | null;
  nombres: string;
  apellidos: string;
  email_personal: string | null;
  telefono: string | null;
  ciudad: string | null;
  direccion: string | null;
  asignatura: string | null;
  horas: number | null;
  emergencia_nombre: string | null;
  emergencia_telefono: string | null;
  emergencia_parentesco: string | null;
}

export async function obtenerDatosPersonales(uid: string): Promise<DatosPersonales | null> {
  try {
    // Obtener usuario del sistema
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id, tipo_usuario, nombre, apellidos')
      .eq('uid', uid)
      .maybeSingle();

    if (!usuario) {
      // Fallback: tabla antigua
      const { data } = await supabase
        .from('datospersonalesusuarios')
        .select('*')
        .eq('uid', uid)
        .maybeSingle();
      return data as DatosPersonales | null;
    }

    if (usuario.tipo_usuario === 'funcionario') {
      const { data: func } = await supabase
        .from('funcionarios')
        .select('*')
        .eq('id_usuario', usuario.id)
        .maybeSingle();

      if (!func) return null;

      return {
        uid,
        rut: func.rut || null,
        nombres: func.nombre_completo || usuario.nombre || '',
        apellidos: usuario.apellidos || '',
        email_personal: func.correo_personal || null,
        telefono: func.celular || null,
        ciudad: func.comuna || null,
        direccion: func.domicilio || null,
        asignatura: func.asignatura || null,
        horas: func.horas_contrato || null,
        emergencia_nombre: func.emergencia_nombre || null,
        emergencia_telefono: func.emergencia_telefono || null,
        emergencia_parentesco: func.emergencia_parentesco || null,
      };
    }

    // No es funcionario: tabla antigua
    const { data } = await supabase
      .from('datospersonalesusuarios')
      .select('*')
      .eq('uid', uid)
      .maybeSingle();
    return data as DatosPersonales | null;
  } catch {
    return null;
  }
}

// ════════════════════════════════════════════════════════════
// SOLICITUDES PAGINADAS
// ════════════════════════════════════════════════════════════

export async function obtenerSolicitudesPaginadas(
  pagina: number,
  porPagina: number = 7
): Promise<{ data: SolicitudRegistro[]; total: number }> {
  try {
    const from = (pagina - 1) * porPagina;
    const to = from + porPagina - 1;

    const { data, error, count } = await supabase
      .from('solicitudes_registro')
      .select('*', { count: 'exact' })
      .order('fecha_solicitud', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data: (data || []) as SolicitudRegistro[], total: count ?? 0 };
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    return { data: [], total: 0 };
  }
}

export async function obtenerDatosPersonalesPorUid(uid: string): Promise<DatosPersonales | null> {
  try {
    const { data, error } = await supabase
      .from('datospersonalesusuarios')
      .select('*')
      .eq('uid', uid)
      .maybeSingle();

    if (error) return null;
    return data as DatosPersonales | null;
  } catch (error) {
    return null;
  }
}

export async function guardarDatosPersonales(
  datos: DatosPersonales
): Promise<{ error: string | null }> {
  try {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id, tipo_usuario')
      .eq('uid', datos.uid)
      .maybeSingle();

    if (usuario?.tipo_usuario === 'funcionario') {
      const nombreCompleto = [datos.nombres, datos.apellidos].filter(Boolean).join(' ');
      const rawRut = datos.rut ? limpiarRUT(datos.rut) : null;
      const funcData = {
        id_usuario: usuario.id,
        rut: rawRut ? formatoSimple(rawRut) : usuario.id,
        rut_formateado: rawRut ? formatearRUT(rawRut) : usuario.id.slice(0, 8),
        nombre_completo: nombreCompleto,
        domicilio: datos.direccion || 'Pendiente',
        comuna: datos.ciudad || 'Pendiente',
        celular: datos.telefono || '',
        correo_personal: datos.email_personal || '',
        correo_institucional: '',
        tipo_funcionario: 'docente',
        tipo_contrato: 'plazo_fijo',
        asignatura: datos.asignatura,
        horas_contrato: datos.horas || 0,
        emergencia_nombre: datos.emergencia_nombre,
        emergencia_telefono: datos.emergencia_telefono,
        emergencia_parentesco: datos.emergencia_parentesco,
        vigente: true,
        tiene_licencia: false,
        tiene_permiso_admin: false,
        usuario_registrado_sistema: true,
        actualizado_en: new Date().toISOString(),
      };

      // Buscar si ya existe un funcionario con este id_usuario
      const { data: existente } = await supabase
        .from('funcionarios')
        .select('rut')
        .eq('id_usuario', usuario.id)
        .maybeSingle();

      if (existente) {
        const { error } = await supabase
          .from('funcionarios')
          .update(funcData)
          .eq('id_usuario', usuario.id);
        if (error) return { error: error.message };
      } else {
        const { error } = await supabase
          .from('funcionarios')
          .insert({ ...funcData, creado_en: new Date().toISOString() });
        if (error) return { error: error.message };
      }

      return { error: null };
    }

    // No es funcionario: tabla antigua
    const { error } = await supabase
      .from('datospersonalesusuarios')
      .upsert({
        ...datos,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'uid' });

    if (error) return { error: error.message };
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

// ═══════════════════════════════════════════════
// JUSTIFICACIONES (CRUD)
// ═══════════════════════════════════════════════

export async function obtenerJustificaciones(idEstablecimiento: string): Promise<any[]> {
  return _configRepo.obtenerJustificaciones(idEstablecimiento);
}
export async function crearJustificacion(nombre: string, descripcion: string, idEstablecimiento: string): Promise<{ error: string | null }> {
  return _configRepo.crearJustificacion(nombre, descripcion, idEstablecimiento);
}
export async function actualizarJustificacion(id: string, nombre: string, descripcion: string): Promise<{ error: string | null }> {
  return _configRepo.actualizarJustificacion(id, nombre, descripcion);
}
export async function eliminarJustificacion(id: string): Promise<{ error: string | null }> {
  return _configRepo.eliminarJustificacion(id);
}
