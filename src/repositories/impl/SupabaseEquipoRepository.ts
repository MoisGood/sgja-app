import { supabase } from '../../lib/supabase';
import type { Equipo } from '../../types';
import type { IEquipoRepository } from '../interfaces/IEquipoRepository';

export class SupabaseEquipoRepository implements IEquipoRepository {
  async obtenerTodos(idEstablecimiento: string): Promise<Equipo[]> {
    const { data, error } = await supabase
      .from('equipos')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('activo', true)
      .order('nombre');
    if (error) throw error;
    return data || [];
  }

  async obtenerPorLugar(idLugar: string): Promise<Equipo[]> {
    const { data, error } = await supabase
      .from('equipos')
      .select('*')
      .eq('id_lugar', idLugar)
      .eq('activo', true)
      .order('nombre');
    if (error) throw error;
    return data || [];
  }

  async obtener(id: string): Promise<Equipo | null> {
    const { data, error } = await supabase
      .from('equipos')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data;
  }

  async crear(equipo: Omit<Equipo, 'id' | 'created_at' | 'updated_at'>): Promise<Equipo> {
    const { data, error } = await supabase
      .from('equipos')
      .insert(equipo)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async actualizar(id: string, datos: Partial<Equipo>): Promise<void> {
    const { error } = await supabase
      .from('equipos')
      .update(datos)
      .eq('id', id);
    if (error) throw error;
  }

  async eliminar(id: string): Promise<void> {
    const { error } = await supabase
      .from('equipos')
      .update({ activo: false })
      .eq('id', id);
    if (error) throw error;
  }
}
