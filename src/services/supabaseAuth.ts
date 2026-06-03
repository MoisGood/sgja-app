// ============================================================
// SGJA – Autenticación con Supabase
// src/services/supabaseAuth.ts
// ============================================================

import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { Usuario } from '../types';

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  nombre_completo: string | null;
  foto_url: string | null;
}

export interface AuthState {
  usuario: User | null;
  session: Session | null;
  cargando: boolean;
}

// ─────────────────────────────────────────────────────────────
// AUTENTICACIÓN GOOGLE
// ─────────────────────────────────────────────────────────────

/**
 * Iniciar sesión con Google OAuth
 * Usa el proveedor de Google configurado en Supabase
 */
export async function iniciarSesionGoogle(): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('❌ Error en login con Google:', error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error('❌ Error inesperado en login:', error);
    return { error: error as Error };
  }
}

/**
 * Cerrar sesión en Supabase
 */
export async function cerrarSesionSupabase(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Error al cerrar sesión:', error);
      throw error;
    }
    console.log('✅ Sesión cerrada en Supabase');
  } catch (error) {
    console.error('❌ Error en cierre de sesión:', error);
    throw error;
  }
}

/**
 * Obtener sesión actual
 */
export async function obtenerSesionActual(): Promise<Session | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Error al obtener sesión:', error);
      return null;
    }
    return session;
  } catch (error) {
    console.error('❌ Error al obtener sesión:', error);
    return null;
  }
}

/**
 * Obtener usuario actual
 */
export async function obtenerUsuarioActual(): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('❌ Error al obtener usuario:', error);
      return null;
    }
    return user;
  } catch (error) {
    console.error('❌ Error al obtener usuario:', error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// REGISTRO DE USUARIOS
// ─────────────────────────────────────────────────────────────

/**
 * Sincronizar usuario de Supabase con tabla usuarios
 * Crea entrada en tabla usuarios si no existe
 */
export async function sincronizarUsuario(
  supabaseUser: User
): Promise<{ existe: boolean; datos: Usuario | null }> {
  try {
    // Verificar si usuario existe en tabla usuarios
    const { data: usuarioExistente, error: errorBusqueda } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (usuarioExistente) {
      console.log('✅ Usuario ya existe en tabla usuarios');
      return { existe: true, datos: usuarioExistente as Usuario };
    }

    if (errorBusqueda && errorBusqueda.code !== 'PGRST116') {
      throw errorBusqueda;
    }

    // Crear usuario nuevo en tabla usuarios
    const nuevoUsuario: any = {
      id: supabaseUser.id,
      uid: supabaseUser.id,
      email: supabaseUser.email || '',
      nombre: supabaseUser.user_metadata?.full_name ||
              supabaseUser.user_metadata?.name ||
              supabaseUser.email?.split('@')[0] ||
              'Sin nombre',
      foto_url: supabaseUser.user_metadata?.avatar_url || null,
      rol: '',
      id_establecimiento: null,
      activo: false, // Pendiente de activación por admin
    };

    const { data: usuarioCreado, error: errorCreacion } = await supabase
      .from('usuarios')
      .insert([nuevoUsuario])
      .select()
      .single();

    if (errorCreacion) {
      throw errorCreacion;
    }

    console.log('✅ Usuario sincronizado en tabla usuarios');
    return { existe: false, datos: usuarioCreado as Usuario };
  } catch (error) {
    console.error('❌ Error al sincronizar usuario:', error);
    throw error;
  }
}

/**
 * Verificar si el usuario tiene acceso (está activo y tiene rol)
 */
export async function verificarAccesoUsuario(uid: string): Promise<{
  tieneAcceso: boolean;
  usuario: Usuario | null;
}> {
  try {
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', uid)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return { tieneAcceso: false, usuario: null };
      }
      throw error;
    }

    // Verificar si está activo y tiene rol
    const tieneAcceso = usuario.activo === true && !!usuario.rol;

    return { tieneAcceso, usuario: usuario as Usuario };
  } catch (error) {
    console.error('❌ Error al verificar acceso:', error);
    return { tieneAcceso: false, usuario: null };
  }
}

/**
 * Activar cuenta de usuario
 */
export async function activarCuenta(uid: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('usuarios')
      .update({ activo: true })
      .eq('id', uid);

    if (error) {
      throw error;
    }

    console.log('✅ Cuenta activada');
  } catch (error) {
    console.error('❌ Error al activar cuenta:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// LISTENERS DE AUTENTICACIÓN
// ─────────────────────────────────────────────────────────────

type AuthCallback = (event: string, session: Session | null) => void;

/**
 * Suscribirse a cambios de autenticación
 */
export function subscribeToAuthChanges(callback: AuthCallback): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      console.log('📡 Auth event:', event, session?.user?.email);
      callback(event, session);
    }
  );

  return () => subscription.unsubscribe();
}

// ─────────────────────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────────────────────

/**
 * Verificar si hay una sesión activa
 */
export function tieneSesionActiva(): boolean {
  return !!supabase.auth.getSession();
}

/**
 * Obtener el ID del usuario actual (sincrónico si está cacheado)
 */
export async function obtenerUsuarioId(): Promise<string | undefined> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id;
}
