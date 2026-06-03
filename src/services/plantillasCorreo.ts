import { supabase } from '../lib/supabase';
import type { PlantillaCorreo } from '../types';

const CACHE_KEY = 'plantillas_correo';
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
  const keys = Object.keys(localStorage);
  keys.forEach(k => { if (k.startsWith(CACHE_KEY)) localStorage.removeItem(k); });
}

export async function obtenerPlantillas(idEstablecimiento: string): Promise<PlantillaCorreo[]> {
  const cacheKey = `${CACHE_KEY}_${idEstablecimiento}`;
  const cached = getCache<PlantillaCorreo[]>(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('plantillas_correo')
    .select('*')
    .eq('id_establecimiento', idEstablecimiento)
    .eq('activo', true)
    .order('ultimo_uso', { ascending: false, nullsFirst: false })
    .order('nombre');

  if (error) throw error;
  const result = data || [];
  setCache(cacheKey, result);
  return result;
}

export async function crearPlantilla(
  p: Omit<PlantillaCorreo, 'id' | 'activo' | 'creado_en' | 'actualizado_en'>
): Promise<void> {
  const { error } = await supabase.from('plantillas_correo').insert({
    ...p,
    activo: true,
    creado_en: new Date().toISOString(),
    actualizado_en: new Date().toISOString(),
  });
  if (error) {
    console.error('Error crearPlantilla:', error);
    throw error;
  }
  clearCache();
}

export async function actualizarPlantilla(id: string, datos: Partial<PlantillaCorreo>): Promise<void> {
  const { error } = await supabase
    .from('plantillas_correo')
    .update({ ...datos, actualizado_en: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
  clearCache();
}

export async function eliminarPlantilla(id: string): Promise<void> {
  const { error } = await supabase
    .from('plantillas_correo')
    .update({ activo: false, actualizado_en: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
  clearCache();
}

export async function registrarUsoPlantilla(id: string): Promise<void> {
  const { error } = await supabase
    .from('plantillas_correo')
    .update({ ultimo_uso: new Date().toISOString(), actualizado_en: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
  clearCache();
}

export function renderizarPlantilla(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || key);
}

export const VARIABLES_DISPONIBLES = [
  { clave: 'rut', descripcion: 'RUT del funcionario' },
];
