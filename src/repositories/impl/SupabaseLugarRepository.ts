import { supabase } from '../../lib/supabase';
import type { Lugar } from '../../types';
import type { ILugarRepository } from '../interfaces/ILugarRepository';

export class SupabaseLugarRepository implements ILugarRepository {
  async obtenerPorPiso(piso: number, idEstablecimiento: string): Promise<Lugar[]> {
    const { data, error } = await supabase
      .from('lugares')
      .select('*')
      .eq('piso', piso)
      .eq('id_establecimiento', idEstablecimiento)
      .eq('activo', true)
      .order('top_pos')
      .order('left_pos');
    if (error) throw error;
    return data || [];
  }

  async obtenerTodos(idEstablecimiento: string): Promise<Lugar[]> {
    const { data, error } = await supabase
      .from('lugares')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('activo', true)
      .order('piso')
      .order('top_pos')
      .order('left_pos');
    if (error) throw error;
    return data || [];
  }

  async obtener(id: string): Promise<Lugar | null> {
    const { data, error } = await supabase
      .from('lugares')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data;
  }

  async crear(lugar: Omit<Lugar, 'id' | 'created_at' | 'updated_at'>): Promise<Lugar> {
    const { data, error } = await supabase
      .from('lugares')
      .insert(lugar)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async actualizar(id: string, datos: Partial<Lugar>): Promise<void> {
    const { error } = await supabase
      .from('lugares')
      .update(datos)
      .eq('id', id);
    if (error) throw error;
  }

  async eliminar(id: string): Promise<void> {
    const { error } = await supabase
      .from('lugares')
      .update({ activo: false })
      .eq('id', id);
    if (error) throw error;
  }

  async upsertDesdeJSON(
    items: Omit<Lugar, 'id' | 'created_at' | 'updated_at'>[]
  ): Promise<{ insertados: number; actualizados: number }> {
    let insertados = 0;
    let actualizados = 0;

    for (const item of items) {
      const { data: existing } = await supabase
        .from('lugares')
        .select('id')
        .eq('id_establecimiento', item.id_establecimiento)
        .eq('piso', item.piso)
        .eq('nombre', item.nombre)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('lugares')
          .update(item)
          .eq('id', existing.id);
        if (!error) actualizados++;
      } else {
        const { error } = await supabase
          .from('lugares')
          .insert(item);
        if (!error) insertados++;
      }
    }

    return { insertados, actualizados };
  }
}
