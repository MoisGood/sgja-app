import { supabase } from '../lib/supabase';
import { cacheService } from './cacheService';
import type { Estudiante } from '../types';

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
