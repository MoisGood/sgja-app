import { supabase } from '../lib/supabase';
import { getCache, setCache } from '../utils/cacheUtils';
import { SupabaseUsuarioRepository } from '../repositories/impl/SupabaseUsuarioRepository';
import type { Usuario } from '../types';

const _usuarioRepo = new SupabaseUsuarioRepository();

export async function obtenerUsuario(uid: string): Promise<Usuario | null> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', uid)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    if (!data) return null;
    return {
      ...data,
      id_usuario: data.id,
      uid: data.uid,
      nombre_completo: data.nombre || '',
      apellidos: data.apellidos || '',
    };
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    throw error;
  }
}

export async function obtenerProfesoresDelEstablecimiento(
  idEstablecimiento: string
): Promise<Usuario[]> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .eq('rol', 'PROFESOR')
      .eq('activo', true);

    if (error) throw error;
    return (data || []).map(u => ({ ...u, id_usuario: u.id, uid: u.uid, nombre_completo: u.nombre || '', apellidos: u.apellidos || '' }));
  } catch (error) {
    console.error('Error al obtener profesores:', error);
    throw error;
  }
}

export async function obtenerTodosLosUsuarios(): Promise<Usuario[]> {
  const cacheKey = 'todos_usuarios';
  const cached = getCache<Usuario[]>(cacheKey);
  if (cached) return cached;
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .not('email', 'like', 'eliminado_%@sgja.cl')
      .order('nombre');

    if (error) throw error;
    const result = (data || []).map(u => ({
      ...u,
      id_usuario: u.id,
      uid: u.uid,
      nombre_completo: u.nombre || '',
      apellidos: u.apellidos || '',
    }));
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error al obtener todos los usuarios:', error);
    throw error;
  }
}

export async function crearUsuario(uid: string, datos: Partial<Usuario>): Promise<void> {
  try {
    const { error } = await supabase
      .from('usuarios')
      .insert([{
        id: uid,
        ...datos,
        fecha_creacion: new Date().toISOString(),
        activo: true,
      }]);

    if (error) throw error;
  } catch (error) {
    console.error('Error al crear usuario:', error);
    throw error;
  }
}

export async function crearUsuarioConAutenticacion(
  email: string,
  nombre_completo: string,
  rol: string,
  id_establecimiento: string
): Promise<string> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: Math.random().toString(36).slice(-8),
    });

    if (authError) throw authError;

    const uid = authData.user?.id;
    if (!uid) throw new Error('No UID returned from auth signup');

    const { error: insertError } = await supabase
      .from('usuarios')
      .insert([{
        id: uid,
        email,
        nombre: nombre_completo,
        rol,
        id_establecimiento,
        activo: true,
        foto_url: null,
        creado_en: new Date().toISOString(),
      }]);

    if (insertError) throw insertError;
    return '';
  } catch (error) {
    console.error('Error al crear usuario con autenticación:', error);
    throw error;
  }
}

export async function asignarRolAUsuario(
  uid: string,
  email: string,
  nombre_completo: string,
  rol: string,
  id_establecimiento: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('usuarios')
      .upsert({
        id: uid,
        email,
        nombre: nombre_completo,
        rol,
        id_establecimiento,
        activo: true,
        foto_url: null,
        creado_en: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error al asignar rol a usuario:', error);
    throw error;
  }
}

export async function actualizarUsuario(uid: string, datos: Partial<Usuario>): Promise<void> {
  return _usuarioRepo.actualizar(uid, datos);
}

export async function eliminarUsuario(uid: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('usuarios')
      .update({ activo: false })
      .eq('id', uid);

    if (error) throw error;
  } catch (error) {
    console.error('Error al desactivar usuario:', error);
    throw error;
  }
}

export async function eliminarUsuarioPermanente(
  idUsuario: string,
  motivo: string
): Promise<void> {
  try {
    const { data, error } = await supabase.rpc('eliminar_usuario_permanente', {
      p_id_usuario: idUsuario,
      p_motivo: motivo,
    });

    if (error) throw error;

    const result = data as { error?: string | null } | null;
    if (result?.error) throw new Error(result.error!);
  } catch (error) {
    console.error('Error al eliminar usuario permanentemente:', error);
    throw error;
  }
}

export async function obtenerUsuariosPorEstablecimientoTodos(
  idEstablecimiento: string
): Promise<Usuario[]> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id_establecimiento', idEstablecimiento)
      .not('email', 'like', 'eliminado_%@sgja.cl');

    if (error) throw error;
    return (data || []).map(u => ({ ...u, id_usuario: u.id, uid: u.uid, nombre_completo: u.nombre || '', apellidos: u.apellidos || '' }));
  } catch (error) {
    console.error('Error al obtener usuarios (todos):', error);
    throw error;
  }
}
