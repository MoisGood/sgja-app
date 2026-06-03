import { supabase } from '../../lib/supabase';
import type { Requerimiento } from '../../types';
import type { IRequerimientoRepository } from '../interfaces/IRequerimientoRepository';

export class SupabaseRequerimientoRepository implements IRequerimientoRepository {
  async obtenerTodos(idEstablecimiento: string): Promise<Requerimiento[]> {
    const { data, error } = await supabase
      .from('requerimientos')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('activo', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async obtener(id: string): Promise<Requerimiento | null> {
    const { data, error } = await supabase
      .from('requerimientos')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data;
  }

  async crear(r: Omit<Requerimiento, 'id' | 'created_at' | 'updated_at'>): Promise<Requerimiento> {
    const { data, error } = await supabase
      .from('requerimientos')
      .insert(r)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async actualizar(id: string, datos: Partial<Requerimiento>): Promise<void> {
    const { error } = await supabase
      .from('requerimientos')
      .update(datos)
      .eq('id', id);
    if (error) throw error;
  }

  async eliminar(id: string): Promise<void> {
    const { error } = await supabase
      .from('requerimientos')
      .update({ activo: false })
      .eq('id', id);
    if (error) throw error;
  }
}
