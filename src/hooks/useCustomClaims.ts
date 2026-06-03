// ============================================================
// Hook: useCustomClaims
// src/hooks/useCustomClaims.ts
// Accede a los Custom Claims del usuario autenticado (Supabase)
// ============================================================

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUsuarioByEmail } from '../services/supabaseService';

export interface CustomClaims {
  rol: string | null;
  id_establecimiento: string | null;
  nombre: string | null;
  email: string | null;
  activo: boolean;
}

export function useCustomClaims() {
  const [claims, setClaims] = useState<CustomClaims | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          const user = session?.user;
          
          if (user && user.email) {
            const userData = await getUsuarioByEmail(user.email);
            
            if (userData) {
              const customClaims: CustomClaims = {
                rol: userData.rol || null,
                id_establecimiento: userData.id_establecimiento || null,
                nombre: userData.nombre || null,
                email: user.email,
                activo: userData.activo ?? true,
              };

              setClaims(customClaims);
              console.log('✅ Custom Claims cargados:', customClaims);
            } else {
              setClaims(null);
            }
          } else {
            setClaims(null);
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Error desconocido');
          setError(error);
          console.error('❌ Error al obtener Custom Claims:', error);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return { claims, loading, error };
}

/**
 * Hook para obtener un Custom Claim específico
 */
export function useCustomClaim(key: keyof CustomClaims) {
  const { claims, loading, error } = useCustomClaims();
  return {
    value: claims?.[key] ?? null,
    loading,
    error,
  };
}

/**
 * Hook para verificar si el usuario tiene un rol específico
 */
export function useHasRole(rol: string) {
  const { claims, loading } = useCustomClaims();
  return {
    hasRole: claims?.rol === rol && claims.activo,
    loading,
  };
}

/**
 * Hook para verificar si el usuario es admin
 */
export function useIsAdmin() {
  return useHasRole('ADMIN');
}

/**
 * Hook para verificar si el usuario es inspector
 */
export function useIsInspector() {
  return useHasRole('INSPECTOR');
}

/**
 * Hook para verificar si el usuario es profesor
 */
export function useIsProfesor() {
  return useHasRole('PROFESOR');
}

/**
 * Hook para obtener el id_establecimiento del usuario
 */
export function useIdEstablecimiento() {
  const { value: idEstablecimiento, loading } = useCustomClaim('id_establecimiento');
  return {
    idEstablecimiento: idEstablecimiento as string | null,
    loading,
  };
}
