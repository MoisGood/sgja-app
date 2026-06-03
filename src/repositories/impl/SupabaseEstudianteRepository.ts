import { supabase } from '../../lib/supabase';
import type { Estudiante } from '../../types';
import type { IEstudianteRepository } from '../interfaces/index';

export class SupabaseEstudianteRepository implements IEstudianteRepository {
  async obtener(idEstudiante: string): Promise<Estudiante | null> {
    const { data, error } = await supabase.from('estudiantes').select('*').eq('id', idEstudiante).single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data as Estudiante;
  }

  async obtenerPorCurso(idEstablecimiento: string, curso: string): Promise<Estudiante[]> {
    const { data, error } = await supabase.from('estudiantes').select('*').eq('id_establecimiento', idEstablecimiento).eq('curso', curso).eq('activo', true);
    if (error) throw error;
    return (data || []) as Estudiante[];
  }

  async obtenerDelEstablecimiento(idEstablecimiento: string): Promise<Estudiante[]> {
    const { data, error } = await supabase.from('estudiantes').select('*').eq('id_establecimiento', idEstablecimiento).eq('activo', true);
    if (error) throw error;
    return (data || []) as Estudiante[];
  }

  async crear(datos: any): Promise<{ error: string | null }> {
    const { error } = await supabase.from('estudiantes').insert(datos);
    if (error) return { error: error.message };
    return { error: null };
  }

  async actualizar(id: string, datos: Partial<Estudiante>): Promise<{ error: string | null }> {
    const { error } = await supabase.from('estudiantes').update(datos).eq('id_estudiante', id);
    if (error) return { error: error.message };
    return { error: null };
  }

  async eliminar(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('estudiantes').update({ activo: false }).eq('id_estudiante', id);
    if (error) return { error: error.message };
    return { error: null };
  }

  async verificarRutDuplicado(rut: string): Promise<boolean> {
    const { data } = await supabase.from('estudiantes').select('id_estudiante').eq('rut', rut).maybeSingle();
    return !!data;
  }

  async crearBatch(estudiantes: any[]): Promise<{ error: string | null }> {
    const { error } = await supabase.from('estudiantes').insert(estudiantes);
    if (error) return { error: error.message };
    return { error: null };
  }

  async obtenerTodosLosCursos(idEstablecimiento: string): Promise<string[]> {
    const { data } = await supabase.from('estudiantes').select('curso').eq('id_establecimiento', idEstablecimiento).eq('activo', true);
    return [...new Set((data || []).map((d: any) => d.curso).filter(Boolean))] as string[];
  }
}
