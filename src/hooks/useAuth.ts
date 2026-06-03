// ============================================================
// SGJA – Hook de Autenticación con Supabase
// src/hooks/useAuth.ts
// ============================================================

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Rol } from '../types';
import { obtenerUsuarioPorUid } from '../services/supabaseDB';
import { obtenerSolicitudPorUid, obtenerDatosPersonales } from '../services/database';
import { obtenerEstadoMantenimiento, debeBloquear } from '../services/mantenimientoService';
import { marcarCuentaActiva } from '../services/funcionarios';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  uid: string | null;
  rol: Rol | null;
  idEstablecimiento: string | null;
  nombre: string | null;
  apellidos: string | null;
  email: string | null;
  cargando: boolean;
  autorizado: boolean;
  documentoExiste: boolean;
  usuarioInactivo: boolean;
  datosPendientes: boolean;
  mantenimientoBloqueo: boolean;
  mttoHorario: string;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    uid: null,
    rol: null,
    idEstablecimiento: null,
    nombre: null,
    apellidos: null,
    email: null,
    cargando: true,
    autorizado: false,
    documentoExiste: false,
    usuarioInactivo: false,
    datosPendientes: false,
    mantenimientoBloqueo: false,
    mttoHorario: '',
  });

  // ── Autenticación y obtención de rol ──
  useEffect(() => {
    let mounted = true;
    let authEventReceived = false;
    let settleTimer: ReturnType<typeof setTimeout>;

    const limpiarSesion = () => {
      // No limpiar storage completo aquí: durante el callback OAuth
      // Supabase usa claves internas para finalizar la sesión.
      localStorage.removeItem('id_usuario_actual');
      sessionStorage.removeItem('id_usuario_actual');
      sessionStorage.removeItem('auth_error');

      if (!mounted) return;

      setState({
        uid: null,
        rol: null,
        idEstablecimiento: null,
        nombre: null,
        apellidos: null,
        email: null,
        cargando: false,
        autorizado: false,
        documentoExiste: false,
        usuarioInactivo: false,
        datosPendientes: false,
        mantenimientoBloqueo: false,
        mttoHorario: '',
      });
    };

    const resolverUsuario = async (user: User | null | undefined) => {
      if (!user) {
        limpiarSesion();
        return;
      }

      try {
        const userEmail = user.email || '';

        const userData = await obtenerUsuarioPorUid(user.id);

        if (!mounted) return;

        if (!userData) {
          
          const solicitud = await obtenerSolicitudPorUid(user.id);
          const pendiente = solicitud && solicitud.estado === 'pendiente';

          if (pendiente) {
            setState({
              uid: user.id,
              rol: null,
              idEstablecimiento: null,
              nombre: solicitud.nombre,
              apellidos: solicitud.apellidos,
              email: solicitud.correo || userEmail || null,
              cargando: false,
              autorizado: false,
              documentoExiste: true,
              usuarioInactivo: true,
              datosPendientes: false,
              mantenimientoBloqueo: false,
              mttoHorario: '',
            });
            return;
          }

          setState({
            uid: user.id,
            rol: null,
            idEstablecimiento: null,
            nombre: user.user_metadata?.full_name || userEmail.split('@')[0] || null,
            apellidos: null,
            email: userEmail || null,
            cargando: false,
            autorizado: false,
            documentoExiste: false,
            usuarioInactivo: true,
            datosPendientes: false,
            mantenimientoBloqueo: false,
            mttoHorario: '',
          });
          return;
        }

        if (!userData.activo) {
          
          setState({
            uid: user.id,
            rol: null,
            idEstablecimiento: userData.id_establecimiento,
            nombre: userData.nombre,
            apellidos: userData.apellidos,
            email: userData.email || userEmail,
            cargando: false,
            autorizado: false,
            documentoExiste: true,
            usuarioInactivo: true,
            datosPendientes: false,
            mantenimientoBloqueo: false,
            mttoHorario: '',
          });
          return;
        }

        if (userData.rol !== 'ADMIN' && userData.id_establecimiento) {
          const mtto = await obtenerEstadoMantenimiento(userData.id_establecimiento);
          if (debeBloquear(mtto.activo, mtto.desde, mtto.hasta, userData.rol, mtto.modo)) {
            setState({
              uid: user.id,
              rol: userData.rol as Rol,
              idEstablecimiento: userData.id_establecimiento,
              nombre: userData.nombre,
              apellidos: userData.apellidos,
              email: userData.email || userEmail,
              cargando: false,
              autorizado: false,
              documentoExiste: true,
              usuarioInactivo: false,
              datosPendientes: false,
              mantenimientoBloqueo: true,
              mttoHorario: `${mtto.desde} - ${mtto.hasta}`,
            });
            return;
          }
        }

        let datosPendientes = false;
        if (userData.rol !== 'APODERADO') {
          const datos = await obtenerDatosPersonales(user.id);
          datosPendientes = !datos || !datos.apellidos || !datos.telefono || !datos.ciudad || !datos.direccion || !datos.emergencia_nombre || !datos.emergencia_telefono || !datos.emergencia_parentesco;
        }
        
        setState({
          uid: user.id,
          rol: userData.rol as Rol,
          idEstablecimiento: userData.id_establecimiento,
          nombre: userData.nombre,
          apellidos: userData.apellidos,
          email: userData.email || userEmail,
          cargando: false,
          autorizado: true,
          documentoExiste: true,
          usuarioInactivo: false,
          datosPendientes,
          mantenimientoBloqueo: false,
          mttoHorario: '',
        });

        sessionStorage.setItem('id_usuario_actual', user.id);

        marcarCuentaActiva(user.id).catch(() => {});
      } catch (error) {
        console.error('Error al obtener datos del usuario:', error);

        if (!mounted) return;

        
        setState({
          uid: user.id,
          rol: null,
          idEstablecimiento: null,
          nombre: null,
          apellidos: null,
          email: user.email || null,
          cargando: false,
          autorizado: false,
          documentoExiste: false,
          usuarioInactivo: false,
          datosPendientes: false,
          mantenimientoBloqueo: false,
          mttoHorario: '',
        });
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session: Session | null) => {
        authEventReceived = true;
        // Debounce: si llegan eventos múltiples en rápida sucesión (SIGNED_IN + INITIAL_SESSION
        // durante init), esperar a que el auth state se asiente antes de consultar la DB
        clearTimeout(settleTimer);
        settleTimer = setTimeout(() => {
          resolverUsuario(session?.user);
        }, 800);
      }
    );

    // Safety timeout: solo si NO ha llegado NINGÚN evento de auth en 30s
    // (protege contra fallos del subscription, no contra queries lentas)
    const safetyTimer = setTimeout(() => {
      if (mounted && !authEventReceived) {
        setState(prev => ({ ...prev, cargando: false }));
      }
    }, 30000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      clearTimeout(settleTimer);
      subscription?.unsubscribe();
    };
  }, []);

  return state;
}
