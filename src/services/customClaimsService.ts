// ============================================================
// Servicio: customClaimsService
// src/services/customClaimsService.ts
// Funciones para sincronizar Custom Claims desde el frontend
// ============================================================

import { supabase } from '../lib/supabase';

/**
 * Actualizar Custom Claims de un usuario específico (requiere admin)
 */
export async function actualizarCustomClaimsManual(// uid: string
) {
  try {
    // En Supabase, los custom claims se manejan a través de:
    // 1. El JWT que devuelve Supabase Auth (que incluye app_metadata)
    // 2. Edge Functions para actualizar el rol del usuario
    // 3. O directamente llamando al RPC (si existe)
    
    // Opción: Llamar a un Edge Function (si está implementado)
    // const { data, error } = await supabase.functions.invoke('update-custom-claims', {
    //   body: { uid }
    // });

    console.log('⚠️  actualizarCustomClaimsManual: Function no implementada en Supabase');
    return { status: 'pending', message: 'Feature not yet implemented' };
  } catch (error) {
    console.error('❌ Error al actualizar Custom Claims:', error);
    throw error;
  }
}

/**
 * Sincronizar Custom Claims de todos los usuarios (requiere admin)
 * Útil después de cambios masivos en roles
 */
export async function sincronizarTodosLosCustomClaims() {
  try {
    // Opción: Llamar a un Edge Function (si está implementado)
    // const { data, error } = await supabase.functions.invoke('sync-all-custom-claims', {
    //   body: {}
    // });

    console.log('⚠️  sincronizarTodosLosCustomClaims: Function no implementada en Supabase');
    return { status: 'pending', message: 'Feature not yet implemented' };
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    throw error;
  }
}

/**
 * Refrescar Custom Claims del usuario autenticado actual
 * Se llama automáticamente pero puede usarse manualmente
 */
export async function refrescarCustomClaimsActual() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw new Error('No hay usuario autenticado');
    }

    // En Supabase, refrescar la sesión para obtener el token actualizado
    const { error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      throw refreshError;
    }

    console.log('✅ Custom Claims refrescados para usuario actual');
  } catch (error) {
    console.error('❌ Error al refrescar Custom Claims:', error);
    throw error;
  }
}
