import { useState, useEffect, useCallback } from 'react';
import { obtenerConfiguracionInactividad } from '../services/online';
import { Rol } from '../types';

interface InactivityWarningState {
  mostrarModal: boolean;
  segundosRestantes: number;
  cerrandoSesion: boolean;
}

export function useInactivityWarning(rol: Rol | null, usuarioActivo: boolean) {
  const [state, setState] = useState<InactivityWarningState>({
    mostrarModal: false,
    segundosRestantes: 0,
    cerrandoSesion: false,
  });

  const [tiempoInactividad, setTiempoInactividad] = useState(10); // minutos por defecto
  const [shouldApplyTimeout, setShouldApplyTimeout] = useState(false);

  // Cargar configuración
  useEffect(() => {
    const cargarConfig = async () => {
      try {
        const config = await obtenerConfiguracionInactividad(rol as any);
        const aplicar = config?.cerrarAutomatico || false;
        
        setShouldApplyTimeout(aplicar);
        setTiempoInactividad(config?.minutosInactividad || 10);
      } catch (error) {
        console.error('Error cargando configuración:', error);
        setShouldApplyTimeout(rol === Rol.ADMIN);
      }
    };

    if (usuarioActivo && rol) {
      cargarConfig();
    }
  }, [rol, usuarioActivo]);

  // Timer de inactividad y advertencia
  useEffect(() => {
    if (!shouldApplyTimeout || !usuarioActivo) return;

    let inactivityTimer: ReturnType<typeof setTimeout>;
    let warningTimer: ReturnType<typeof setTimeout>;
    let countdownInterval: ReturnType<typeof setInterval>;

    const TIEMPO_ADVERTENCIA = 60; // segundos para mostrar modal (1 minuto)
    const TIEMPO_TOTAL_MS = tiempoInactividad * 60 * 1000;
    const TIEMPO_ANTES_ADVERTENCIA_MS = TIEMPO_TOTAL_MS - TIEMPO_ADVERTENCIA * 1000;

    const resetTimers = () => {
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      clearInterval(countdownInterval);

      setState({
        mostrarModal: false,
        segundosRestantes: 0,
        cerrandoSesion: false,
      });

      // Mostrar advertencia N segundos antes de cerrar
      warningTimer = setTimeout(() => {
        setState((prev) => ({
          ...prev,
          mostrarModal: true,
          segundosRestantes: TIEMPO_ADVERTENCIA,
        }));

        // Iniciar countdown
        let tiempoRestante = TIEMPO_ADVERTENCIA;
        countdownInterval = setInterval(() => {
          tiempoRestante--;
          setState((prev) => ({
            ...prev,
            segundosRestantes: tiempoRestante,
          }));

          if (tiempoRestante <= 0) {
            clearInterval(countdownInterval);
          }
        }, 1000);

        // Cerrar sesión automáticamente después del countdown
        inactivityTimer = setTimeout(() => {
          setState((prev) => ({
            ...prev,
            cerrandoSesion: true,
          }));
          // El componente que lo use manejará el signOut
        }, TIEMPO_ADVERTENCIA * 1000);
      }, TIEMPO_ANTES_ADVERTENCIA_MS);
    };

    // Eventos para detectar actividad
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => {
      // Solo resetear si el modal no está visible
      if (!state.mostrarModal) {
        resetTimers();
      }
    };

    events.forEach((event) => document.addEventListener(event, handleActivity));
    resetTimers();

    return () => {
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      clearInterval(countdownInterval);
      events.forEach((event) => document.removeEventListener(event, handleActivity));
    };
  }, [shouldApplyTimeout, tiempoInactividad, usuarioActivo, state.mostrarModal]);

  const extenderSesion = useCallback(() => {
    setState({
      mostrarModal: false,
      segundosRestantes: 0,
      cerrandoSesion: false,
    });
    // Disparar evento para resetear los timers
    document.dispatchEvent(new Event('mousedown'));
  }, []);

  return {
    ...state,
    extenderSesion,
  };
}
