import { supabase } from '../../lib/supabase';
import type { Usuario } from '../../types';
import type { IUsuarioRepository } from '../interfaces/IUsuarioRepository';

export class SupabaseUsuarioRepository implements IUsuarioRepository {
  async obtenerTodos(_idEstablecimiento: string): Promise<Usuario[]> {
    const { data, error } = await supabase.from('usuarios').select('*').order('nombre');
    if (error) throw error;
    return (data || []).map(u => ({ ...u, id_usuario: u.id, uid: u.uid, nombre_completo: u.nombre || '', apellidos: u.apellidos || '' }));
  }

  async obtener(uid: string): Promise<Usuario | null> {
    const { data, error } = await supabase.from('usuarios').select('*').eq('id', uid).single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data as Usuario;
  }

  async actualizar(uid: string, datos: Partial<Usuario>): Promise<void> {
    const dbData: Record<string, unknown> = { ...datos };
    if ('nombre_completo' in dbData) { dbData.nombre = dbData.nombre_completo; delete dbData.nombre_completo; }
    delete dbData.foto_url; delete dbData.fecha_creacion;
    const { error } = await supabase.from('usuarios').update(dbData).eq('id', uid);
    if (error) throw error;
  }

  async eliminar(uid: string): Promise<void> {
    const { error } = await supabase.from('usuarios').delete().eq('id', uid);
    if (error) throw error;
  }

  async crearConAutenticacion(email: string, nombre: string, rol: string, idEstablecimiento: string): Promise<string | null> {
    const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({ email, password: tempPassword, email_confirm: true, user_metadata: { nombre } });
    if (authError) throw authError;
    if (!authData?.user) throw new Error('No se pudo crear el usuario');
    const { error: insertError } = await supabase.from('usuarios').insert({ id: authData.user.id, uid: authData.user.id, email, nombre, rol, id_establecimiento: idEstablecimiento, activo: true });
    if (insertError) throw insertError;
    return tempPassword;
  }

  async obtenerDatosPersonales(uid: string): Promise<any | null> {
    const { data, error } = await supabase.from('datospersonalesusuarios').select('*').eq('uid', uid).maybeSingle();
    if (error) return null;
    return data;
  }

  async guardarDatosPersonales(datos: any): Promise<{ error: string | null }> {
    const { error } = await supabase.from('datospersonalesusuarios').upsert({ ...datos, updated_at: new Date().toISOString() }, { onConflict: 'uid' });
    if (error) return { error: error.message };
    return { error: null };
  }

  async asignarEstablecimiento(uid: string, idEstablecimiento: string | null): Promise<string | null> {
    const { error } = await supabase.from('usuarios').update({ id_establecimiento: idEstablecimiento }).eq('uid', uid);
    if (error) return error.message;
    return null;
  }
}
