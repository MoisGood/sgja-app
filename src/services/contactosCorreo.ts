import { supabase } from '../lib/supabase';
import type { ContactoCorreo } from '../types';

const CACHE_KEY = 'contactos_correo';
const CACHE_TTL = 30 * 60 * 1000;

function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, expiry } = JSON.parse(raw);
    if (Date.now() > expiry) { localStorage.removeItem(key); return null; }
    return data as T;
  } catch { return null; }
}
function setCache<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify({ data, expiry: Date.now() + CACHE_TTL }));
}
function clearCache(): void {
  Object.keys(localStorage).forEach(k => { if (k.startsWith(CACHE_KEY)) localStorage.removeItem(k); });
}

export async function obtenerContactos(idEstablecimiento: string): Promise<ContactoCorreo[]> {
  const cacheKey = `${CACHE_KEY}_${idEstablecimiento}`;
  const cached = getCache<ContactoCorreo[]>(cacheKey);
  if (cached) return cached;
  const { data, error } = await supabase
    .from('contactos_correo')
    .select('*')
    .eq('id_establecimiento', idEstablecimiento)
    .eq('activo', true)
    .order('nombre');
  if (error) throw error;
  const result = data || [];
  setCache(cacheKey, result);
  return result;
}

export async function crearContacto(
  c: Omit<ContactoCorreo, 'id' | 'activo' | 'creado_en' | 'actualizado_en'>
): Promise<void> {
  const { error } = await supabase.from('contactos_correo').insert({
    ...c,
    activo: true,
    creado_en: new Date().toISOString(),
    actualizado_en: new Date().toISOString(),
  });
  if (error) throw error;
  clearCache();
}

export async function eliminarContacto(id: string): Promise<void> {
  const { error } = await supabase
    .from('contactos_correo')
    .update({ activo: false, actualizado_en: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
  clearCache();
}
