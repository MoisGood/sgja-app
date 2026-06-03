import { supabase } from '../lib/supabase';

let cache: { activo: boolean; desde: string; hasta: string; modo: string } | null = null;

export async function obtenerEstadoMantenimiento(idEstablecimiento: string): Promise<{ activo: boolean; desde: string; hasta: string; modo: string }> {
  if (cache) return cache;
  const { data } = await supabase.from('configuracion_sistema').select('*').eq('id_establecimiento', idEstablecimiento).maybeSingle();
  const estado = {
    activo: data?.mantenimiento_activo ?? false,
    desde: data?.horario_desde ?? '07:00',
    hasta: data?.horario_hasta ?? '17:00',
    modo: data?.modo ?? 'manual',
  };
  cache = estado;
  return estado;
}

export function getEstadoMantenimientoCache(): { activo: boolean; desde: string; hasta: string; modo: string } | null {
  return cache;
}

export function invalidarCacheMantenimiento() {
  cache = null;
}

export function estaEnHorario(desde: string, hasta: string): boolean {
  const ahora = new Date();
  const h = String(ahora.getHours()).padStart(2, '0');
  const m = String(ahora.getMinutes()).padStart(2, '0');
  const actual = `${h}:${m}`;
  return actual >= desde && actual <= hasta;
}

export function debeBloquear(activo: boolean, desde: string, hasta: string, rol: string, modo: string): boolean {
  if (rol === 'ADMIN') return false;
  if (modo === 'manual') return activo;
  if (modo === 'horario') return !estaEnHorario(desde, hasta);
  return false;
}

export async function toggleMantenimiento(idEstablecimiento: string, activo: boolean, modo: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('configuracion_sistema').update({ mantenimiento_activo: activo, modo, actualizado_en: new Date().toISOString() }).eq('id_establecimiento', idEstablecimiento);
  if (!error) {
    if (cache) { cache.activo = activo; cache.modo = modo; }
  }
  return { error: error?.message || null };
}

export async function actualizarHorario(idEstablecimiento: string, desde: string, hasta: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('configuracion_sistema').update({ horario_desde: desde, horario_hasta: hasta, actualizado_en: new Date().toISOString() }).eq('id_establecimiento', idEstablecimiento);
  if (!error && cache) {
    cache.desde = desde;
    cache.hasta = hasta;
  }
  return { error: error?.message || null };
}
