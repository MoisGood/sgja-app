// ============================================================
// SGJA – Servicio de Funcionarios (CRUD)
// src/services/funcionarios.ts
// ============================================================

import { supabase } from '../lib/supabase';
import { getCache, setCache, clearCache } from '../utils/cacheUtils';
import type { Funcionario } from '../types';

const CACHE_KEY = 'funcionarios';

export async function obtenerFuncionarios(): Promise<Funcionario[]> {
  const cached = getCache<Funcionario[]>(CACHE_KEY);
  if (cached) return cached;
  const { data, error } = await supabase
    .from('funcionarios')
    .select('*')
    .order('creado_en', { ascending: false });
  if (error) throw error;
  const result = data || [];
  setCache(CACHE_KEY, result);
  return result;
}

export async function obtenerFuncionario(rut: string): Promise<Funcionario | null> {
  const { data, error } = await supabase
    .from('funcionarios')
    .select('*')
    .eq('rut', rut)
    .single();
  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data;
}

export async function crearFuncionario(f: Omit<Funcionario, 'creado_en' | 'actualizado_en'>): Promise<void> {
  const ahora = new Date().toISOString();
  const payload = { ...f, creado_en: ahora, actualizado_en: ahora };

  // Intentar actualizar primero (si ya existe por correo_institucional)
  const { data: existente } = await supabase
    .from('funcionarios')
    .select('rut')
    .eq('correo_institucional', f.correo_institucional)
    .maybeSingle();

  if (existente) {
    // Ya existe, actualizar
    const { error: updErr } = await supabase
      .from('funcionarios')
      .update(payload)
      .eq('rut', existente.rut);
    if (updErr) throw updErr;
  } else {
    // No existe, insertar
    const { error } = await supabase.from('funcionarios').insert(payload);
    if (error) throw error;
  }

  clearCache(CACHE_KEY);
}

export async function actualizarFuncionario(rut: string, datos: Partial<Funcionario>): Promise<void> {
  const { error } = await supabase
    .from('funcionarios')
    .update({ ...datos, actualizado_en: new Date().toISOString() })
    .eq('rut', rut);
  if (error) throw error;
  clearCache(CACHE_KEY);
}

export async function cambiarEstadoFuncionario(rut: string, vigente: boolean): Promise<void> {
  const { error } = await supabase
    .from('funcionarios')
    .update({ vigente, actualizado_en: new Date().toISOString() })
    .eq('rut', rut);
  if (error) throw error;
  clearCache(CACHE_KEY);
}

export async function marcarCuentaActiva(usuarioId: string): Promise<void> {
  await supabase
    .from('usuarios')
    .update({ cuenta_activa: true })
    .eq('id', usuarioId);
}

export interface UsuarioSinFuncionario {
  id_usuario: string;
  nombre_completo: string;
  email: string;
  rol: string;
}

export async function obtenerUsuariosSinFuncionario(): Promise<UsuarioSinFuncionario[]> {
  const [usuariosRes, funcionariosRes] = await Promise.all([
    supabase
      .from('usuarios')
      .select('id, nombre_completo, email, rol')
      .eq('tipo_usuario', 'funcionario')
      .eq('activo', true),
    supabase.from('funcionarios').select('id_usuario'),
  ]);

  if (usuariosRes.error) throw usuariosRes.error;

  let funcIds = new Set<string>();
  if (!funcionariosRes.error) {
    funcIds = new Set(funcionariosRes.data?.map(f => f.id_usuario).filter(Boolean) || []);
  }

  return (usuariosRes.data || [])
    .filter(u => !funcIds.has(u.id))
    .map(u => ({ id_usuario: u.id, nombre_completo: u.nombre_completo, email: u.email, rol: u.rol }));
}
