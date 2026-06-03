import { supabase } from '../../lib/supabase';
import type { Solicitud } from '../../types';
import type { ISolicitudRepository } from '../interfaces/index';

export class SupabaseSolicitudRepository implements ISolicitudRepository {
  async obtenerPorEstudiante(idEstudiante: string): Promise<Solicitud[]> {
    const { data, error } = await supabase.from('justificadas').select('*').eq('id_estudiante', idEstudiante).order('fecha', { ascending: false });
    if (error) return [];
    return (data || []) as Solicitud[];
  }

  async obtenerPorEstablecimiento(idEstablecimiento: string): Promise<Solicitud[]> {
    const { data, error } = await supabase.from('justificadas').select('*').eq('id_establecimiento', idEstablecimiento).order('fecha', { ascending: false });
    if (error) throw error;
    return (data || []) as Solicitud[];
  }

  async obtenerPaginadas(pagina: number, porPagina: number = 7): Promise<{ data: any[]; total: number }> {
    const from = (pagina - 1) * porPagina;
    const [countRes, dataRes] = await Promise.all([
      supabase.from('solicitudes_registro').select('*', { count: 'exact', head: true }),
      supabase.from('solicitudes_registro').select('*').order('fecha_solicitud', { ascending: false }).range(from, from + porPagina - 1),
    ]);
    if (dataRes.error) throw dataRes.error;
    return { data: dataRes.data || [], total: countRes.count || 0 };
  }
}
