import { supabase } from '../lib/supabase';
import type { Establecimiento } from '../types';

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
