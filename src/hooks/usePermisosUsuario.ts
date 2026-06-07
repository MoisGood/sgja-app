// ============================================================
// SGJA – Hook para obtener permisos del usuario actual
// src/hooks/usePermisosUsuario.ts
// ============================================================

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { handleError } from '../utils/errorHandler';
import { Rol } from '../types';

interface UsePermisosUsuarioReturn {
  permisos: string[];
  cargando: boolean;
  error: string | null;
}

/**
 * Hook que obtiene los permisos del usuario actual basado en su rol.
 * Los permisos se almacenan en Firestore en la colección 'configuracion'
 * con documentos nombrados como el rol (ej: 'ADMIN', 'PROFESOR', etc)
 */
export function usePermisosUsuario(
  idEstablecimiento: string,
  rolUsuario: Rol
): UsePermisosUsuarioReturn {
  const [permisos, setPermisos] = useState<string[] | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const obtenerPermisos = async () => {
      try {
        setCargando(true);
        setError(null);

        if (!idEstablecimiento || !rolUsuario) {
          setPermisos([]);
          setCargando(false);
          return;
        }

        const { data, error } = await supabase
          .from('configuracion')
          .select('permisos')
          .eq('rol', rolUsuario)
          .maybeSingle();

        if (error) throw error;

        if (data?.permisos) {
          setPermisos(Array.isArray(data.permisos) ? data.permisos : []);
        } else if (Object.values(Rol).includes(rolUsuario as Rol)) {
          setPermisos(obtenerPermisosDefecto(rolUsuario));
        } else {
          setPermisos([]);
        }
      } catch (err) {
        handleError(err, 'Error al cargar permisos');
        setPermisos([]);
      } finally {
        setCargando(false);
      }
    };

    obtenerPermisos();
  }, [idEstablecimiento, rolUsuario]);

  return { permisos: permisos ?? [], cargando, error };
}

/**
 * Obtiene los permisos por defecto para un rol específico
 */
function obtenerPermisosDefecto(rol: Rol): string[] {
  const permisosDefault: Record<Rol, string[]> = {
    [Rol.ADMIN]: [
      '/dashboard',
      '/en-linea',
      '/gestion-usuarios',
      '/registrar',
      '/ver-justificaciones',
      '/gestion-pases',
      '/justificaciones',
      '/mantenedor-motivos',
      '/calendario',
      '/parametros',
      '/seguridad',
      '/bloque-horario',
      '/asignar-permisos',
    ],
    [Rol.INSPECTOR]: [],
    [Rol.PROFESOR]: [],
    [Rol.ESTUDIANTE]: [],
    [Rol.APODERADO]: [],
  };

  return permisosDefault[rol] || ['/dashboard'];
}
