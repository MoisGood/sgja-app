// ============================================================
// Hook para monitorear actividad de sesión y enviar heartbeat
// src/hooks/useSessionActivity.ts
// ============================================================

import { useEffect } from 'react';
import { actualizarActividadSesion, enviarHeartbeat } from '../services/online';

/**
 * Hook que detecta actividad del usuario y envía heartbeat
 * 
 * - Actualiza timestamp_ultima_actividad cuando hay actividad (cada 5 min)
 * - Envía heartbeat cada 30 segundos (para detectar desconexiones brusas)
 * - Si el navegador se cierra sin logout, la falta de heartbeat permitirá detectarlo
 */
export function useSessionActivity(email: string | undefined) {
  useEffect(() => {
    if (!email) return;

    let timeoutIdActividad: ReturnType<typeof setTimeout>;

    const handleActivity = async () => {
      // Cancelar el timeout anterior
      clearTimeout(timeoutIdActividad);

      // Actualizar actividad (timestamp_ultima_actividad)
      await actualizarActividadSesion(email);

      // Establecer nuevo timeout para la próxima actualización de actividad (cada 5 minutos)
      timeoutIdActividad = setTimeout(async () => {
        await actualizarActividadSesion(email);
      }, 5 * 60 * 1000);
    };

    // Eventos que indican actividad del usuario
    const eventos = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    // Agregar listeners para actividad
    eventos.forEach(evento => {
      document.addEventListener(evento, handleActivity, true);
    });

    // Enviar heartbeat inicial
    enviarHeartbeat(email);

    // Iniciar intervalo de heartbeat cada 30 segundos (detecta desconexiones brusas)
    const intervalIdHeartbeat = setInterval(() => {
      enviarHeartbeat(email);
    }, 30 * 1000);

    // Actividad inmediata
    handleActivity();

    // Limpiar listeners
    return () => {
      clearTimeout(timeoutIdActividad);
      clearInterval(intervalIdHeartbeat);
      eventos.forEach(evento => {
        document.removeEventListener(evento, handleActivity, true);
      });
    };
  }, [email]);
}
