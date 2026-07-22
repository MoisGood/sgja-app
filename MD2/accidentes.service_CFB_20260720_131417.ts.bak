// src/services/accidentes.service.ts
import { supabase } from '../lib/supabase';
import { getCache, setCache } from '../utils/cacheUtils';
import type { AccidenteEscolar, Estudiante } from '../types';

const CACHE_KEY_ESTUDIANTES = 'accidentes_estudiantes';

// ── Buscar estudiante por RUT o nombre ──
export async function buscarEstudiantes(termino: string): Promise<Estudiante[]> {
  try {
    // Intentar desde caché primero
    const cached = getCache<Estudiante[]>(CACHE_KEY_ESTUDIANTES);
    if (cached) {
      return filtrarLocal(cached, termino);
    }

    // Desde Supabase
    const { data, error } = await supabase
      .from('estudiantes')
      .select('*')
      .or(`rut.ilike.%${termino}%,nombre_completo.ilike.%${termino}%`)
      .eq('activo', true)
      .limit(20);

    if (error) throw error;

    // Cachear resultado completo (sin filtro)
    const { data: todos } = await supabase
      .from('estudiantes')
      .select('*')
      .eq('activo', true);
    if (todos) setCache(CACHE_KEY_ESTUDIANTES, todos);

    return (data as Estudiante[]) || [];
  } catch (error) {
    console.error('Error al buscar estudiantes:', error);
    return [];
  }
}

function filtrarLocal(estudiantes: Estudiante[], termino: string): Estudiante[] {
  const t = termino.toLowerCase();
  return estudiantes.filter(
    e =>
      e.nombre_completo.toLowerCase().includes(t) ||
      (e.rut && e.rut.toLowerCase().includes(t))
  ).slice(0, 20);
}

// ── Precargar caché de estudiantes para búsqueda rápida ──
export async function precargarEstudiantes(): Promise<void> {
  try {
    const { data } = await supabase
      .from('estudiantes')
      .select('*')
      .eq('activo', true);
    if (data) setCache(CACHE_KEY_ESTUDIANTES, data);
  } catch {
    // Silencioso - la búsqueda irá a Supabase directo si no hay caché
  }
}

// ── Eliminar accidente (borrado lógico: activo = false) ──
export async function eliminarAccidente(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('accidentes_escolares')
      .update({ activo: false })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error al eliminar accidente:', error);
    throw error;
  }
}

// ── Listar accidentes ──
export async function listarAccidentes(idEstablecimiento: string): Promise<AccidenteEscolar[]> {
  try {
    const { data, error } = await supabase
      .from('accidentes_escolares')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('activo', true)
      .order('creado_en', { ascending: false });

    if (error) throw error;
    return (data as AccidenteEscolar[]) || [];
  } catch (error) {
    console.error('Error al listar accidentes:', error);
    return [];
  }
}

// ── Guardar accidente ──
export async function guardarAccidente(
  accidente: Omit<AccidenteEscolar, 'id' | 'creado_en' | 'actualizado_en'>
): Promise<AccidenteEscolar | null> {
  try {
    const { data, error } = await supabase
      .from('accidentes_escolares')
      .insert([accidente])
      .select()
      .single();

    if (error) throw error;
    return data as AccidenteEscolar;
  } catch (error) {
    console.error('Error al guardar accidente:', error);
    throw error;
  }
}
