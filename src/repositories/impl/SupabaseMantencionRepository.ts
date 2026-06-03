import { supabase } from '../../lib/supabase';
import type { Mantencion } from '../../types';
import type { IMantencionRepository } from '../interfaces/IMantencionRepository';

export class SupabaseMantencionRepository implements IMantencionRepository {
  async obtenerPorEquipo(idEquipo: string): Promise<Mantencion[]> {
    const { data, error } = await supabase
      .from('mantenciones')
      .select('*')
      .eq('id_equipo', idEquipo)
      .eq('activo', true)
      .order('fecha_mantencion', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async obtener(id: string): Promise<Mantencion | null> {
    const { data, error } = await supabase
      .from('mantenciones')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data;
  }

  async crear(m: Omit<Mantencion, 'id' | 'created_at'>): Promise<Mantencion> {
    const { data, error } = await supabase
      .from('mantenciones')
      .insert(m)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async eliminar(id: string): Promise<void> {
    const { error } = await supabase
      .from('mantenciones')
      .update({ activo: false })
      .eq('id', id);
    if (error) throw error;
  }
}
