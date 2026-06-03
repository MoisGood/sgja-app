// ============================================================
// SGJA – Hook para Registrar Actividad de Usuario
// src/hooks/useRegistrarActividad.ts
// ============================================================

import { useEffect, useRef } from 'react';
import { registrarActividad } from '../services/actividades';

interface Props {
  idUsuario: string | undefined;
  nombreUsuario: string;
  emailUsuario: string;
  rolUsuario: string;
}

/**
 * Hook que registra la actividad del usuario de forma automática
 * 
 * IMPORTANTE: Este hook NO incluye 'pagina' ni 'accion' en sus dependencias
 * para evitar ciclos infinitos cuando la navegación cambia.
 * 
 * Comportamiento:
 * - Registra actividad inicial cuando el usuario se autentica
 * - Mantiene un "keep-alive" cada 2 minutos
 * - NO depende de cambios de navegación
 */
export function useRegistrarActividad({
  idUsuario,
  nombreUsuario,
  emailUsuario,
  rolUsuario,
}: Props) {
  const registeredRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!idUsuario) {
      registeredRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Solo registrar una vez cuando el usuario se autentica
    if (!registeredRef.current) {
      registrarActividad(
        idUsuario,
        nombreUsuario,
        emailUsuario,
        rolUsuario,
        'Sesión iniciada',
        'Usuario inició sesión'
      ).catch((error) => {
        console.error('Error registrando actividad inicial:', error);
      });
      registeredRef.current = true;
    }

    // Registrar actividad cada 2 minutos para mantener la sesión "viva"
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        registrarActividad(
          idUsuario,
          nombreUsuario,
          emailUsuario,
          rolUsuario,
          'Sesión activa',
          'Keep-alive automático'
        ).catch((error) => {
          console.error('Error en keep-alive de actividad:', error);
        });
      }, 2 * 60 * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [idUsuario, nombreUsuario, emailUsuario, rolUsuario]);
}