import { supabase } from '../lib/supabase';
import { getCache, setCache, clearCache } from '../utils/cacheUtils';
import type { FuncionarioAusencia } from '../types';

const CACHE_KEY = 'ausencias_activas';

export async function obtenerAusenciasActivas(): Promise<any[]> {
  const cached = getCache<any[]>(CACHE_KEY);
  if (cached) return cached;
  const hoy = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('funcionario_ausencias')
    .select('*, funcionarios!inner(rut, nombre_completo)')
    .lte('fecha_inicio', hoy)
    .or(`fecha_termino.gte.${hoy},fecha_termino.is.null`)
    .order('fecha_inicio', { ascending: false });
  if (error) throw error;
  const result = data || [];
  setCache(CACHE_KEY, result);
  return result;
}

export async function registrarAusencia(
  ausencia: Omit<FuncionarioAusencia, 'id' | 'creado_en'>
): Promise<void> {
  const { error } = await supabase.from('funcionario_ausencias').insert({
    ...ausencia,
    creado_en: new Date().toISOString(),
  });
  if (error) throw error;
  clearCache(CACHE_KEY);
}

export async function eliminarAusencia(id: string): Promise<void> {
  const { error } = await supabase
    .from('funcionario_ausencias')
    .delete()
    .eq('id', id);
  if (error) throw error;
  clearCache(CACHE_KEY);
}
